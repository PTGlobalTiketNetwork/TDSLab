import React, { useEffect, useRef, useState } from 'react';
import { TextFormattingToolbar } from '../../ui/TextFormattingToolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  singleLine?: boolean;
  onFocus?: (e: React.FocusEvent<HTMLDivElement>) => void;
  
  // Font Size Controls
  fontSize?: number;
  onFontSizeChange?: (value: number) => void;
  minFontSize?: number;
  maxFontSize?: number;

  // Global Color Control (if no text selected)
  onGlobalColorChange?: (color: string) => void;

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
    fontSize,
    onFontSizeChange,
    minFontSize = 12,
    maxFontSize = 100,
    onGlobalColorChange,
    lineHeight,
    onLineHeightChange
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string | null>(null);
  const [activeItalic, setActiveItalic] = useState<boolean>(false);

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
        .replace(/\n/g, '<br>');

    return html;
  };

  const getOutputValue = () => {
      if (!editorRef.current) return '';
      
      const traverse = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
          if (node.nodeName === 'BR') return '\n';
          
          if (node.nodeName === 'DIV') {
              return '\n' + Array.from(node.childNodes).map(traverse).join('');
          }
          
          if (node.nodeName === 'SPAN') {
              const el = node as HTMLElement;
              const tag = el.dataset.tag;
              const content = Array.from(node.childNodes).map(traverse).join('');
              
              if (tag === 'sb') return `<sb>${content}</sb>`;
              if (tag === 'b') return `<b>${content}</b>`;
              if (tag === 'eb') return `<eb>${content}</eb>`;
              if (tag === 'reset') return `<r>${content}</r>`;
              if (tag === 'i') return `<i>${content}</i>`;
              if (tag === 'color') {
                  const color = el.dataset.color || el.style.color;
                  return `<c v="${color}">${content}</c>`;
              }
              return content;
          }
          
          return Array.from(node.childNodes).map(traverse).join('');
      };
      
      const res = Array.from(editorRef.current.childNodes).map(traverse).join('');
      // remove leading newline if any
      return res.startsWith('\n') ? res.substring(1) : res;
  };

  // --- Effects ---

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
        const html = toHTML(value);
        if (editorRef.current.innerHTML !== html) {
            editorRef.current.innerHTML = html;
        }
    }
  }, [value]);

  useEffect(() => {
    const checkSelection = () => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !editorRef.current) {
            setActiveTag(null);
            setActiveColor(null);
            return;
        }
        
        // Check if the selection is within THIS editor instance
        const range = sel.getRangeAt(0);
        if (!editorRef.current.contains(range.commonAncestorContainer)) {
            return;
        }
        
        // Find active tags
        let node = sel.anchorNode;
        // If anchor is the editor div itself, use the child at offset
        // (Not strictly necessary for simple cases)

        let foundTag: string | null = null;
        let foundColor: string | null = null;
        let foundItalic = false;

        let current = node;
        while (current && current !== editorRef.current) {
            if (current.nodeName === 'SPAN' && (current as HTMLElement).dataset.tag) {
                const tag = (current as HTMLElement).dataset.tag;
                if (tag === 'color') {
                    if (!foundColor) foundColor = (current as HTMLElement).dataset.color || null;
                } else if (tag === 'i') {
                    foundItalic = true;
                } else if (!foundTag) {
                    // Priority to weight tags
                    if (tag === 'reset') {
                        foundTag = null; // explicit reset
                    } else {
                        foundTag = tag;
                    }
                }
            }
            current = current.parentNode;
        }
        setActiveTag(foundTag);
        setActiveColor(foundColor);
        setActiveItalic(foundItalic);
    };

    document.addEventListener('selectionchange', checkSelection);
    return () => document.removeEventListener('selectionchange', checkSelection);
  }, []);

  // --- Handlers ---

  const handleInput = () => {
      isInternalChange.current = true;
      const val = getOutputValue();
      onChange(val);
      setTimeout(() => isInternalChange.current = false, 0);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
  };

  const applyTag = (requestedTag: string) => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      
      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;

      if (range.collapsed) return;

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
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      if (!editorRef.current?.contains(range.commonAncestorContainer)) return;
      if (range.collapsed) return;

      if (activeItalic) {
          // Toggle OFF: unwrap any italic ancestor of the selection, and strip any
          // italic spans that fall fully inside the selection.
          const ancestor = findItalicAncestor(range.commonAncestorContainer);
          if (ancestor) {
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
      if (singleLine && e.key === 'Enter') {
          e.preventDefault();
      }
  };

  return (
    <div className={`flex flex-col border border-[#d8dce8] rounded-[8px] bg-white overflow-hidden transition-all focus-within:border-[#007BFF] focus-within:ring-1 focus-within:ring-[#007BFF] relative ${className || ''}`}>
        
        {/* Toolbar */}
        <TextFormattingToolbar 
            activeWeight={activeTag}
            onWeightChange={applyTag}
            fontSize={fontSize}
            onFontSizeChange={onFontSizeChange}
            minFontSize={minFontSize}
            maxFontSize={maxFontSize}
            activeColor={activeColor}
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
                className="w-full px-[12px] py-[10px] outline-none text-[14px] min-h-[42px] font-sans selection:bg-[#007BFF] selection:text-white whitespace-pre-wrap"
                style={{ minHeight: singleLine ? 'auto' : '80px', lineHeight: typeof lineHeight === 'number' ? lineHeight / 100 : undefined }}
            />
            
            {/* Placeholder overlay if empty */}
            {!value && placeholder && (
                <div className="absolute top-0 left-0 w-full h-full px-[12px] py-[10px] text-[#9EA0A5] text-[14px] pointer-events-none select-none">
                    {placeholder}
                </div>
            )}
        </div>
    </div>
  );
}
