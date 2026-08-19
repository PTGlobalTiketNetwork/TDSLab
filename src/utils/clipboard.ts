/**
 * Robust copy to clipboard utility that handles permission policy restrictions.
 * Tries the modern Async Clipboard API first, then falls back to document.execCommand('copy').
 * Handles Focus Traps (like Radix UI Dialogs) by appending the temporary element to the active dialog.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (!text) return false;

  // 1. Try modern Async Clipboard API
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
    }
  } catch (err) {
    console.warn("Navigator clipboard failed, trying fallback...", err);
  }

  // 2. Fallback: document.execCommand('copy')
  try {
    const activeEl = document.activeElement;
    
    const textarea = document.createElement("textarea");
    textarea.value = text;
    
    // Prevent layout shift but keep it "visible" to the browser
    textarea.style.position = "fixed";
    textarea.style.left = "0";
    textarea.style.top = "0";
    textarea.style.opacity = "0.01"; // Not 0, just in case
    textarea.style.pointerEvents = "none";
    textarea.style.zIndex = "9999";
    
    // Important for mobile/some contexts
    textarea.contentEditable = "true";
    textarea.readOnly = false; 
    
    // Append to the closest dialog if exists (to avoid focus trap issues) or body
    let container: HTMLElement = document.body;
    if (activeEl) {
        const dialog = activeEl.closest('[role="dialog"]') as HTMLElement;
        if (dialog) {
            container = dialog;
        } else {
             // If active element is inside a shadow root or similar, we might need more logic,
             // but usually appending to body is fine if no dialog.
             // Try to append to active element's parent if body fails? No.
        }
    }
    
    container.appendChild(textarea);
    
    textarea.focus({ preventScroll: true });
    textarea.select();
    textarea.setSelectionRange(0, 99999); // For mobile
    
    const successful = document.execCommand("copy");
    
    if (container.contains(textarea)) {
        container.removeChild(textarea);
    }
    
    // Restore focus
    if (activeEl instanceof HTMLElement) {
        activeEl.focus({ preventScroll: true });
    }
    
    return successful;
  } catch (err) {
    console.error("Copy fallback failed", err);
  }

  return false;
};
