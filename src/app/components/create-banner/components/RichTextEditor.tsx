import React, { useEffect, useRef, useState } from 'react';
import { TextFormattingToolbar } from '../../ui/TextFormattingToolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  singleLine?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  // Caps the plain-text length (tags don't count). Typing/pasting past the limit is blocked, like a native maxLength.
  maxLength?: number;
  
  // Font Size Controls
  fontSize?: number;
  onFontSizeChange?: (value: number) => void;
  minFontSize?: number;
  maxFontSize?: number;
  defaultFontSize?: number; // enables the reset-to-default icon in the size controls

  // Global Color Control (if no text selected)
  onGlobalColorChange?: (color: string) => void;
  // Colour of the whole field (shown in the toolbar when the cursor isn't inside a custom-coloured span)
  globalColor?: string;

  // Vertical spacing (line-height) control
  lineHeight?: number; // percent, undefined = auto
  onLineHeightChange?: (value: number | undefined) => void;
}

export function RichTextEditor({ 
    value, 
    onChange, 
    placeholder, 
    className, 
    singleLine,
    onFocus,
    maxLength,
    fontSize,
    onFontSizeChange,
    minFontSize = 12,
    maxFontSize = 100,
    defaultFontSize,
    onGlobalColorChange,
    globalColor,
    lineHeight,
    onLineHeightChange
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeItalic, setActiveItalic] = useState<boolean>(false);
  const [activeFontSize, setActiveFontSize] = useState<number | null>(null);
  const [hasSelection, setHasSelection] = useState<boolean>(false);

  // --- Undo/Redo history ---
  // contentEditable's native undo doesn't reliably track the Range-surgery our format actions do,
  // so we keep our own stack of past values (the tag-string, not the live DOM) and drive Ctrl/Cmd+Z/Y.
  const prevValueRef = useRef(value);
  const historyRef = useRef<{ undo: string[]; redo: string[] }>({ undo: [], redo: [] });
  const lastSnapshotAt = useRef(0);
  const HISTORY_DEBOUNCE_MS = 500;
  const HISTORY_MAX = 100;

  // The last non-collapsed selection we saw inside this editor. Clicking the toolbar's Slider or
  // QuantityInput (unlike the format buttons, which preventDefault on mousedown) steals the live
  // browser selection — so format actions triggered from there fall back to this instead.
  const lastRangeRef = useRef<Range | null>(null);
  const getWorkingSelection = (): Selection | null => {
      const sel = window.getSelection();
      if (!sel) return null;
      if (sel.rangeCount && !sel.isCollapsed) {
          const r = sel.getRangeAt(0);
          if (editorRef.current?.contains(r.commonAncestorContainer)) return sel;
      }
      if (lastRangeRef.current && editorRef.current?.contains(lastRangeRef.current.commonAncestorContainer)) {
          sel.removeAllRanges();
          sel.addRange(lastRangeRef.current.cloneRange());
          return sel;
      }
      return null;
  };

  // --- Parsing Logic ---

  // Converts the internal storage format to HTML for the contentEditable div
  const toHTML = (val: string) => {
    if (!val) return '';
    // escape HTML entities
    let html = val
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Replace custom tags with spans
    // We replace opening and closing tags separately to support nesting
    html = html
        .replace(/&lt;sb&gt;/g, '<span class="font-semibold" data-tag="sb">')
        .replace(/&lt;\/sb&gt;/g, '</span>')
        .replace(/&lt;b&gt;/g, '<span class="font-bold" data-tag="b">')
        .replace(/&lt;\/b&gt;/g, '</span>')
        .replace(/&lt;eb&gt;/g, '<span class="font-extrabold" data-tag="eb">')
        .replace(/&lt;\/eb&gt;/g, '</span>')
        .replace(/&lt;r&gt;/g, '<span class="font-normal" data-tag="reset">')
        .replace(/&lt;\/r&gt;/g, '</span>')
        .replace(/&lt;i&gt;/g, '<span class="italic" data-tag="i">')
        .replace(/&lt;\/i&gt;/g, '</span>')
        // Color tags: <c v="#RRGGBB">...</c>
        // Regex matches literal quotes " because initial escaping does not convert quotes to &quot;
        .replace(/&lt;c v="(.*?)"&gt;/g, (match, color) => {
            // NOTE: We intentionally DO NOT apply the color to the text style here.
            // The Editor input should remain black/gray for readability.
            // We use a visual cue (underline) instead.
            return `<span style="text-decoration: underline; text-decoration-style: dotted; text-decoration-color: #94a3b8; text-decoration-thickness: 2px;" data-tag="color" data-color="${color}">`;
        })
        .replace(/&lt;\/c&gt;/g, '</span>')
        // Per-selection font size: <fs v="22">...</fs>
        .replace(/&lt;fs v="(.*?)"&gt;/g, (match, size) => `<span style="font-size: ${size}px" data-tag="fs" data-size="${size}">`)
        .replace(/&lt;\/fs&gt;/g, '</span>')
        .replace(/\n/g, '<br>');

    return html;
  };

  // Walks a DOM node and rebuilds our internal tag string from it. Used both for this editor's own
  // content (where every formatted span carries our data-tag marker) and for externally pasted HTML
  // (own-editor copies keep their data-tag markers through the system clipboard; content pasted from
  // elsewhere — Word, Docs, another app — only has inline styles/tag names, which we fall back to).
  const nodeToValue = (root: Node): string => {
      const traverse = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
          if (node.nodeName === 'BR') return '\n';

          if (node.nodeName === 'DIV' || node.nodeName === 'P') {
              return '\n' + Array.from(node.childNodes).map(traverse).join('');
          }

          if (node.nodeName === 'SPAN' || node.nodeName === 'B' || node.nodeName === 'STRONG' || node.nodeName === 'I' || node.nodeName === 'EM') {
              const el = node as HTMLElement;
              const tag = el.dataset?.tag;
              const content = Array.from(node.childNodes).map(traverse).join('');

              if (tag === 'sb') return `<sb>${content}</sb>`;
              if (tag === 'b') return `<b>${content}</b>`;
              if (tag === 'eb') return `<eb>${content}</eb>`;
              if (tag === 'reset') return `<r>${content}</r>`;
              if (tag === 'i') return `<i>${content}</i>`;
              if (tag === 'color') {
                  const color = el.dataset?.color || el.style?.color;
                  return color ? `<c v="${color}">${content}</c>` : content;
              }
              if (tag === 'fs') {
                  const size = el.dataset?.size;
                  return size ? `<fs v="${size}">${content}</fs>` : content;
              }

              // Fallback for content pasted from outside our own editors (no data-tag markers)
              let result = content;
              const weight = parseInt(el.style?.fontWeight || '', 10);
              if (node.nodeName === 'EM' || node.nodeName === 'I' || el.style?.fontStyle === 'italic') {
                  result = `<i>${result}</i>`;
              }
              if (!isNaN(weight) && weight >= 800) result = `<eb>${result}</eb>`;
              else if (node.nodeName === 'B' || node.nodeName === 'STRONG' || (!isNaN(weight) && weight >= 700)) result = `<b>${result}</b>`;
              else if (!isNaN(weight) && weight >= 600) result = `<sb>${result}</sb>`;
              return result;
          }

          return Array.from(node.childNodes).map(traverse).join('');
      };

      const res = Array.from(root.childNodes).map(traverse).join('');
      // remove leading newline if any
      return res.startsWith('\n') ? res.substring(1) : res;
  };

  const getOutputValue = () => {
      if (!editorRef.current) return '';
      return nodeToValue(editorRef.current);
  };

  // --- Effects ---

  useEffect(() => {
    // Never repaint innerHTML while this editor has focus/selection — even a value update that's
    // semantically identical (just reserialized through toHTML) can differ in whitespace/attribute
    // order from the live DOM, forcing a full node replacement that destroys the user's current
    // Selection. That silently breaks the next format action (Ctrl+B/I, toolbar buttons): they bail
    // out early when the selection is collapsed/gone, with no visible error.
    if (editorRef.current && !isInternalChange.current && document.activeElement !== editorRef.current) {
        const html = toHTML(value);
        if (editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
        // An external change (switching to a different field/language, not our own edit) —
        // the undo/redo history no longer applies to whatever is now in this box.
        if (value !== prevValueRef.current) {
            historyRef.current = { undo: [], redo: [] };
        }
    }
    prevValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const checkSelection = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !editorRef.current) {
            setActiveTag(null);
            setActiveColor(null);
            setActiveFontSize(null);
            setHasSelection(false);
            return;
        }

        // Check if the selection is within THIS editor instance
        const range = sel.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) {
            return;
        }

        setHasSelection(!sel.isCollapsed);
        if (!sel.isCollapsed) lastRangeRef.current = range.cloneRange();

        // Find active tags
        let node = sel.anchorNode;
        // If anchor is the editor div itself, use the child at offset
        // (Not strictly necessary for simple cases)

        let foundTag: string | null = null;
        let foundWeightResolved = false; // the innermost weight tag (incl. explicit "reset") wins — don't let an outer ancestor override it
        let foundColor: string | null = null;
        let foundItalic = false;
        let foundFontSize: number | null = null;

        let current = node;
        while (current && current !== editorRef.current) {
            if (current.nodeName === 'SPAN' && (current as HTMLElement).dataset.tag) {
                const tag = (current as HTMLElement).dataset.tag;
                if (tag === 'color') {
                    if (!foundColor) foundColor = (current as HTMLElement).dataset.color || null;
                } else if (tag === 'i') {
                    foundItalic = true;
                } else if (tag === 'fs') {
                    if (!foundFontSize) foundFontSize = parseInt((current as HTMLElement).dataset.size || '', 10) || null;
                } else if (!foundWeightResolved) {
                    // Priority to weight tags
                    foundWeightResolved = true;
                    foundTag = tag === 'reset' ? null : (tag ?? null); // explicit reset
                }
            }
            current = current.parentNode;
        }
        setActiveTag(foundTag);
        setActiveColor(foundColor);
        setActiveItalic(foundItalic);
        setActiveFontSize(foundFontSize);
    };

    document.addEventListener('selectionchange', checkSelection);
    return () => document.removeEventListener('selectionchange', checkSelection);
  }, []);

  // --- Handlers ---

  const handleInput = () => {
      isInternalChange.current = true;
      const val = getOutputValue();

      // Snapshot the value from BEFORE this change for undo, debounced so continuous typing
      // doesn't produce one undo step per keystroke. Formatting actions (bold, color, size, …)
      // call handleInput() right after a discrete DOM edit, so they always get their own step.
      const now = Date.now();
      if (val !== prevValueRef.current && (now - lastSnapshotAt.current > HISTORY_DEBOUNCE_MS || historyRef.current.undo.length === 0)) {
          historyRef.current.undo.push(prevValueRef.current);
          if (historyRef.current.undo.length > HISTORY_MAX) historyRef.current.undo.shift();
          historyRef.current.redo = [];
      }
      lastSnapshotAt.current = now;

      onChange(val);
      prevValueRef.current = val;
      setTimeout(() => isInternalChange.current = false, 0);
  };

  const restoreValue = (target: string) => {
      if (!editorRef.current) return;
      isInternalChange.current = true;
      editorRef.current.innerHTML = toHTML(target);
      onChange(target);
      prevValueRef.current = target;
      // Put the cursor at the end so typing continues naturally after an undo/redo
      const sel = window.getSelection();
      const r = document.createRange();
      r.selectNodeContents(editorRef.current);
      r.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(r);
      setTimeout(() => isInternalChange.current = false, 0);
  };

  const undo = () => {
      const { undo: undoStack, redo: redoStack } = historyRef.current;
      if (undoStack.length === 0) return;
      const target = undoStack.pop()!;
      redoStack.push(prevValueRef.current);
      restoreValue(target);
  };

  const redo = () => {
      const { undo: undoStack, redo: redoStack } = historyRef.current;
      if (redoStack.length === 0) return;
      const target = redoStack.pop()!;
      undoStack.push(prevValueRef.current);
      restoreValue(target);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const plain = e.clipboardData.getData('text/plain');
      const html = e.clipboardData.getData('text/html');

      let insertValue = plain;
      if (html) {
          try {
              const parsed = nodeToValue(new DOMParser().parseFromString(html, 'text/html').body);
              if (parsed) insertValue = parsed;
          } catch {
              // fall back to plain text below
          }
      }

      if (typeof maxLength === 'number') {
          const sel = window.getSelection();
          const hasSelection = !!sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode);
          const currentLength = editorRef.current?.textContent?.length ?? 0;
          const remaining = Math.max(0, maxLength - (hasSelection ? 0 : currentLength));
          if (insertValue.replace(/<[^>]*>/g, '').length > remaining) {
              // Truncate on plain-text length, tags don't count — simplest safe approach is to strip
              // tags from the overflowing paste rather than risk cutting a tag string in half.
              const plainOnly = insertValue.replace(/<[^>]*>/g, '');
              insertValue = plainOnly.slice(0, remaining);
          }
      }

      const selection = window.getSelection();
      const range = selection && selection.rangeCount ? selection.getRangeAt(0) : null;
      if (!selection || !range || !editorRef.current?.contains(range.commonAncestorContainer)) {
          document.execCommand('insertText', false, plain);
          return;
      }

      range.deleteContents();
      const temp = document.createElement('div');
      temp.innerHTML = toHTML(insertValue);
      let lastNode: ChildNode | null = null;
      const frag = document.createDocumentFragment();
      while (temp.firstChild) {
          lastNode = temp.firstChild;
          frag.appendChild(temp.firstChild);
      }
      range.insertNode(frag);

      if (lastNode) {
          const newRange = document.createRange();
          newRange.setStartAfter(lastNode);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
      }

      handleInput();
  };

  // Finds the nearest ancestor span carrying a weight tag (sb/b/eb/reset), if the given node sits inside one.
  const findWeightAncestor = (node: Node | null): HTMLElement | null => {
      let cur: Node | null = node;
      while (cur && cur !== editorRef.current) {
          if (cur.nodeType === Node.ELEMENT_NODE) {
              const tag = (cur as HTMLElement).dataset?.tag;
              if (tag === 'sb' || tag === 'b' || tag === 'eb' || tag === 'reset') return cur as HTMLElement;
          }
          cur = cur.parentNode;
      }
      return null;
  };

  const applyTag = (requestedTag: string) => {
      const selection = getWorkingSelection();
      if (!selection || !selection.rangeCount) return;

      let range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

      if (range.collapsed) return;

      // Re-selecting text that's already wrapped in a weight span (e.g. toggling Bold on/off
      // repeatedly on the same selection) must REPLACE that span, not nest a new one inside it —
      // extractContents() below only pulls out the span's CHILDREN, leaving the wrapper behind.
      // Unwrap it first so the selection sits directly on plain content again.
      // Only when the selection spans the WHOLE ancestor span, though — if it's a smaller selection inside a larger
      // bolded block, unwrapping the whole thing would silently grow the selection to the entire block (bug: bolding
      // one word inside an already-bold sentence re-bolded the whole sentence instead of just that word).
      const weightAncestor = findWeightAncestor(range.commonAncestorContainer);
      if (weightAncestor) {
          const fullRange = document.createRange();
          fullRange.selectNodeContents(weightAncestor);
          const isExactMatch = range.compareBoundaryPoints(Range.START_TO_START, fullRange) === 0 &&
              range.compareBoundaryPoints(Range.END_TO_END, fullRange) === 0;
          if (isExactMatch) {
              const parent = weightAncestor.parentNode;
              if (parent) {
                  const children = Array.from(weightAncestor.childNodes);
                  children.forEach((child) => parent.insertBefore(child, weightAncestor));
                  parent.removeChild(weightAncestor);
                  if (children.length) {
                      const newRange = document.createRange();
                      newRange.setStartBefore(children[0]);
                      newRange.setEndAfter(children[children.length - 1]);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      range = newRange;
                  }
              }
          }
      }

      // 1. Extract Selection.
      const fragment = range.extractContents();
      
      // 2. Clean up the fragment: Remove our weight spans but keep text.
      // (We don't remove color spans here, we let them nest or handle separately?)
      // Actually, if we apply Bold, we want to keep Color.
      const cleanFragment = (frag: DocumentFragment) => {
          const spans = frag.querySelectorAll('span[data-tag]');
          spans.forEach(span => {
              const tag = (span as HTMLElement).dataset.tag;
              // Only remove weight tags
              if (tag === 'sb' || tag === 'b' || tag === 'eb' || tag === 'reset') {
                  const parent = span.parentNode;
                  if (parent) {
                      while (span.firstChild) {
                          parent.insertBefore(span.firstChild, span);
                      }
                      parent.removeChild(span);
                  }
              }
          });
      };
      
      cleanFragment(fragment);

      // 3. Determine action.
      const shouldReset = activeTag === requestedTag;
      const targetTag = shouldReset ? 'reset' : requestedTag;
      
      // 4. Wrap content
      const span = document.createElement('span');
      if (targetTag === 'sb') { span.className = 'font-semibold'; span.dataset.tag = 'sb'; }
      else if (targetTag === 'b') { span.className = 'font-bold'; span.dataset.tag = 'b'; }
      else if (targetTag === 'eb') { span.className = 'font-extrabold'; span.dataset.tag = 'eb'; }
      else if (targetTag === 'reset') { span.className = 'font-normal'; span.dataset.tag = 'reset'; }
      
      span.appendChild(fragment);
      
      // 5. Insert back
      range.insertNode(span);
      
      // 6. Cleanup empty spans
      const cleanEmptySpans = () => {
         const spans = editorRef.current?.querySelectorAll('span[data-tag]');
         spans?.forEach(s => {
             if (!s.textContent) s.remove();
         });
      };
      cleanEmptySpans();
      
      // Restore selection
      const newRange = document.createRange();
      newRange.selectNodeContents(span); 
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      handleInput();
  };

  const applyColor = (color: string) => {
      const selection = window.getSelection();
      
      // If no selection or range collapsed, update global color if handler provided
      if (!selection || !selection.rangeCount || selection.isCollapsed) {
          if (onGlobalColorChange) {
              onGlobalColorChange(color);
          }
          return;
      }
      
      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

      if (range.collapsed) return;

      const fragment = range.extractContents();

      // Clean up existing COLOR tags in the fragment to avoid messy nesting/overrides
      // We want the new color to apply to everything selected.
      const cleanFragmentColors = (frag: DocumentFragment) => {
          const spans = frag.querySelectorAll('span[data-tag="color"]');
          spans.forEach(span => {
              const parent = span.parentNode;
              if (parent) {
                  while (span.firstChild) {
                      parent.insertBefore(span.firstChild, span);
                  }
                  parent.removeChild(span);
              }
          });
      };
      cleanFragmentColors(fragment);

      const span = document.createElement('span');
      // Intentionally NOT setting span.style.color to keep text readable (black/gray)
      // span.style.color = color; 
      
      // Visual cue: Dotted underline
      span.style.textDecoration = 'underline';
      span.style.textDecorationStyle = 'dotted';
      span.style.textDecorationColor = '#94a3b8';
      span.style.textDecorationThickness = '2px';

      span.dataset.tag = 'color';
      span.dataset.color = color;
      span.appendChild(fragment);

      range.insertNode(span);
      
      // Restore selection
      const newRange = document.createRange();
      newRange.selectNodeContents(span); 
      selection.removeAllRanges();
      selection.addRange(newRange);
      
      handleInput();
  };

  const applyFontSize = (size: number) => {
      const selection = getWorkingSelection();
      if (!selection || !selection.rangeCount || selection.isCollapsed) return;

      let range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
      if (range.collapsed) return;

      // Selecting ALL the text and resizing means "change this field's size" — set the block size (which
      // EN/ID style sync mirrors) instead of wrapping everything in a per-selection override that sync can't see.
      if (onFontSizeChange && range.toString().trim() === (editorRef.current.textContent || '').trim()) {
          const fsSpans = editorRef.current.querySelectorAll('span[data-tag="fs"]');
          if (fsSpans.length) {
              fsSpans.forEach((span) => {
                  const parent = span.parentNode;
                  if (!parent) return;
                  while (span.firstChild) parent.insertBefore(span.firstChild, span);
                  parent.removeChild(span);
              });
              handleInput();
              // Separate tick so the size update builds on the text update above instead of overwriting it
              setTimeout(() => onFontSizeChange(size), 0);
          } else {
              onFontSizeChange(size);
          }
          return;
      }

      // Re-adjusting a selection that's already wrapped in a font-size span (e.g. dragging the
      // Size slider, which re-applies on every tick) must REPLACE that span, not nest a new one
      // inside it — extractContents() below only pulls out the span's CHILDREN.
      const fsAncestor = (() => {
          let cur: Node | null = range.commonAncestorContainer;
          while (cur && cur !== editorRef.current) {
              if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).dataset?.tag === 'fs') return cur as HTMLElement;
              cur = cur.parentNode;
          }
          return null;
      })();
      if (fsAncestor) {
          // Only when the selection spans the WHOLE ancestor span — otherwise unwrapping it would grow a
          // selection inside a larger resized block out to the whole block (same bug class as applyTag).
          const fullRange = document.createRange();
          fullRange.selectNodeContents(fsAncestor);
          const isExactMatch = range.compareBoundaryPoints(Range.START_TO_START, fullRange) === 0 &&
              range.compareBoundaryPoints(Range.END_TO_END, fullRange) === 0;
          if (isExactMatch) {
              const parent = fsAncestor.parentNode;
              if (parent) {
                  const children = Array.from(fsAncestor.childNodes);
                  children.forEach((child) => parent.insertBefore(child, fsAncestor));
                  parent.removeChild(fsAncestor);
                  if (children.length) {
                      const newRange = document.createRange();
                      newRange.setStartBefore(children[0]);
                      newRange.setEndAfter(children[children.length - 1]);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                      range = newRange;
                  }
              }
          }
      }

      const fragment = range.extractContents();

      // Remove any existing font-size override within the selection so sizes don't nest/stack
      const spans = fragment.querySelectorAll('span[data-tag="fs"]');
      spans.forEach(span => {
          const parent = span.parentNode;
          if (parent) {
              while (span.firstChild) parent.insertBefore(span.firstChild, span);
              parent.removeChild(span);
          }
      });

      // Always wrap with an explicit size, even when it happens to match the block's base —
      // the editor's own plain-text rendering is a fixed 14px, not the block's base size, so
      // skipping the wrap there made the selection visually shrink instead of matching it.
      const span = document.createElement('span');
      span.style.fontSize = `${size}px`;
      span.dataset.tag = 'fs';
      span.dataset.size = String(size);
      span.appendChild(fragment);
      range.insertNode(span);

      const newRange = document.createRange();
      newRange.selectNodeContents(span);
      selection.removeAllRanges();
      selection.addRange(newRange);

      // Cleanup empty spans
      editorRef.current?.querySelectorAll('span[data-tag]').forEach(s => {
          if (!s.textContent) s.remove();
      });

      handleInput();
  };

  const findItalicAncestor = (node: Node | null): HTMLElement | null => {
      let cur: Node | null = node;
      while (cur && cur !== editorRef.current) {
          if (cur.nodeType === Node.ELEMENT_NODE && (cur as HTMLElement).dataset?.tag === 'i') {
              return cur as HTMLElement;
          }
          cur = cur.parentNode;
      }
      return null;
  };

  const stripItalicSpans = (root: ParentNode) => {
      const spans = root.querySelectorAll('span[data-tag="i"]');
      spans.forEach(span => {
          const parent = span.parentNode;
          if (!parent) return;
          while (span.firstChild) parent.insertBefore(span.firstChild, span);
          parent.removeChild(span);
      });
  };

  const applyItalic = () => {
      const selection = getWorkingSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
      if (range.collapsed) return;

      if (activeItalic) {
          // Toggle OFF: unwrap any italic ancestor of the selection, and strip any
          // italic spans that fall fully inside the selection.
          // Only unwrap the whole ancestor when the selection spans ALL of it — otherwise a selection
          // inside a larger italicized block would un-italicize the whole block, not just the selection.
          const ancestor = findItalicAncestor(range.commonAncestorContainer);
          const spansWholeAncestor = (() => {
              if (!ancestor) return false;
              const fullRange = document.createRange();
              fullRange.selectNodeContents(ancestor);
              return range.compareBoundaryPoints(Range.START_TO_START, fullRange) === 0 &&
                  range.compareBoundaryPoints(Range.END_TO_END, fullRange) === 0;
          })();
          if (ancestor && spansWholeAncestor) {
              const parent = ancestor.parentNode;
              if (parent) {
                  while (ancestor.firstChild) parent.insertBefore(ancestor.firstChild, ancestor);
                  parent.removeChild(ancestor);
              }
          } else {
              const fragment = range.extractContents();
              stripItalicSpans(fragment);
              range.insertNode(fragment);
          }
          setActiveItalic(false);
      } else {
          // Toggle ON: wrap selection in italic span (strip nested italic first).
          const fragment = range.extractContents();
          stripItalicSpans(fragment);
          const span = document.createElement('span');
          span.className = 'italic';
          span.dataset.tag = 'i';
          span.appendChild(fragment);
          range.insertNode(span);

          const newRange = document.createRange();
          newRange.selectNodeContents(span);
          selection.removeAllRanges();
          selection.addRange(newRange);
          setActiveItalic(true);
      }

      // Cleanup empty spans
      editorRef.current?.querySelectorAll('span[data-tag]').forEach(s => {
          if (!s.textContent) s.remove();
      });

      handleInput();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ctrl/Cmd+B and Ctrl/Cmd+I must go through our tag system; the browser's
      // native bold/italic would produce <b>/<i> nodes that getOutputValue drops.
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
          const k = e.key.toLowerCase();
          if (k === 'b') { e.preventDefault(); applyTag('b'); return; }
          if (k === 'i') { e.preventDefault(); applyItalic(); return; }
      }
      // Undo/redo go through our own history stack — the browser's native contentEditable undo
      // doesn't track the Range surgery our format actions do, so it was a no-op (Ctrl+Z/Ctrl+Y).
      if ((e.ctrlKey || e.metaKey) && !e.altKey) {
          const k = e.key.toLowerCase();
          if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
          if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); return; }
      }
      if (singleLine && e.key === 'Enter') {
          e.preventDefault();
      }
      // Block typing past maxLength, like a native input's maxlength — only for plain printable
      // keystrokes; navigation/deletion/shortcuts must still go through.
      if (typeof maxLength === 'number' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const sel = window.getSelection();
          const hasSelection = !!sel && !sel.isCollapsed && editorRef.current?.contains(sel.anchorNode);
          const currentLength = editorRef.current?.textContent?.length ?? 0;
          if (!hasSelection && currentLength >= maxLength) {
              e.preventDefault();
          }
      }
  };

  return (
    <div className={`flex flex-col border border-[#d8dce8] rounded-[8px] bg-white overflow-hidden transition-all focus-within:border-[#007BFF] focus-within:ring-1 focus-within:ring-[#007BFF] relative ${className || ''}`}>
        
        {/* Toolbar */}
        <TextFormattingToolbar
            activeWeight={activeTag}
            onWeightChange={applyTag}
            fontSize={hasSelection && typeof fontSize === 'number' ? (activeFontSize ?? fontSize) : fontSize}
            onFontSizeChange={hasSelection && onFontSizeChange ? applyFontSize : onFontSizeChange}
            defaultFontSize={hasSelection ? fontSize : defaultFontSize}
            minFontSize={minFontSize}
            maxFontSize={maxFontSize}
            activeColor={activeColor ?? globalColor ?? null}
            onColorChange={applyColor}
            activeItalic={activeItalic}
            onItalicToggle={applyItalic}
            lineHeight={lineHeight}
            onLineHeightChange={onLineHeightChange}
        />

        {/* Editor Wrapper */}
        <div className="relative w-full">
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onFocus={onFocus}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="w-full px-[12px] py-[10px] outline-none min-h-[42px] font-sans selection:bg-[#007BFF] selection:text-white whitespace-pre-wrap"
                style={{
                    minHeight: singleLine ? 'auto' : '80px',
                    lineHeight: typeof lineHeight === 'number' ? lineHeight / 100 : undefined,
                    // The block's own Size field is the base size for any text NOT wrapped in a per-selection
                    // <fs> override — without this the box always rendered at a fixed 14px, so two fields
                    // showing the same Size value could still look different depending on leftover <fs> wraps.
                    fontSize: typeof fontSize === 'number' ? `${fontSize}px` : '14px',
                }}
            />
            
            {/* Placeholder overlay if empty */}
            {!value && placeholder && (
                <div
                    className="absolute top-0 left-0 w-full h-full px-[12px] py-[10px] text-[#9EA0A5] pointer-events-none select-none"
                    style={{ fontSize: typeof fontSize === 'number' ? `${fontSize}px` : '14px' }}
                >
                    {placeholder}
                </div>
            )}
        </div>
    </div>
  );
}
