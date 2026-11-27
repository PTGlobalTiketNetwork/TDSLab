import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { TiketSnackbar } from '@/app/components/ui/TiketSnackbar';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveDraftOptions {
  /** False while a manual save / publish runs, or when required fields are missing. */
  enabled: boolean;
  /** True when there are real changes that are not saved yet (same notion as the unsaved-changes check). */
  isDirty: boolean;
  /** The edited state; a value or a plain object of state values (compared shallowly). A change restarts the debounce. */
  changeKey: unknown;
  /** Saves silently as draft. Must throw on failure. */
  save: () => Promise<void>;
  delay?: number;
}

/**
 * Debounced, silent draft auto-save shared by the editor flows.
 * - waits `delay` ms after the last change, then calls `save` when enabled && isDirty
 * - never runs two saves at once; a change during a save queues exactly one follow-up
 * - `stop()` ends it for good (publish / discard); it also stops on unmount
 * - warns on page unload while there are changes that have not been saved yet
 */
export function useAutoSaveDraft({ enabled, isDirty, changeKey, save, delay = 5000 }: UseAutoSaveDraftOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Bump a version only when changeKey really changes (shallow compare), so unrelated re-renders don't reset the debounce
  const prevKeyRef = useRef(changeKey);
  const versionRef = useRef(0);
  if (!shallowEqual(prevKeyRef.current, changeKey)) {
    prevKeyRef.current = changeKey;
    versionRef.current += 1;
  }
  const version = versionRef.current;

  const saveRef = useRef(save);
  saveRef.current = save;
  const enabledRef = useRef(enabled && isDirty);
  enabledRef.current = enabled && isDirty;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const stoppedRef = useRef(false);
  const errorShownRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const run = useCallback(async () => {
    timerRef.current = null;
    if (stoppedRef.current || !enabledRef.current) return;
    if (runningRef.current) { pendingRef.current = true; return; }
    runningRef.current = true;
    pendingRef.current = false;
    setStatus('saving');
    try {
      await saveRef.current();
      if (stoppedRef.current) return;
      errorShownRef.current = false;
      setLastSavedAt(new Date());
      setStatus('saved');
    } catch (err) {
      console.error('Auto-save draft failed:', err);
      if (stoppedRef.current) return;
      setStatus('error');
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        toast.custom((t) => <TiketSnackbar id={t} message="Auto-save failed. Your changes are not saved yet." variant="error" />);
      }
    } finally {
      runningRef.current = false;
      // Changes made while saving: schedule one follow-up save
      if (pendingRef.current && !stoppedRef.current) {
        pendingRef.current = false;
        clearTimer();
        timerRef.current = setTimeout(run, delay);
      }
    }
  }, [delay]);

  // Debounce: restart the timer on every change
  useEffect(() => {
    if (stoppedRef.current) return;
    clearTimer();
    if (!enabled || !isDirty) return;
    if (runningRef.current) { pendingRef.current = true; return; }
    timerRef.current = setTimeout(run, delay);
    return clearTimer;
  }, [version, enabled, isDirty, delay, run]);

  // Stop on unmount
  useEffect(() => () => { stoppedRef.current = true; clearTimer(); }, []);

  // Warn before reload/close while there are changes not auto-saved yet
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      if (stoppedRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /** Stops auto-saving for good (after publish / discard). */
  const stop = useCallback(() => {
    stoppedRef.current = true;
    pendingRef.current = false;
    clearTimer();
  }, []);

  /** Records a save done elsewhere (e.g. manual Save Draft) so the indicator stays accurate. */
  const markSaved = useCallback(() => {
    setLastSavedAt(new Date());
    setStatus('saved');
  }, []);

  /** Resolves once any in-flight auto-save has finished (use before a manual save / publish). */
  const waitForIdle = useCallback(async () => {
    clearTimer();
    pendingRef.current = false;
    while (runningRef.current) await new Promise((r) => setTimeout(r, 100));
  }, []);

  return { status, lastSavedAt, stop, markSaved, waitForIdle };
}

function shallowEqual(a: unknown, b: unknown) {
  if (Object.is(a, b)) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const ka = Object.keys(a as object), kb = Object.keys(b as object);
  return ka.length === kb.length && ka.every((k) => Object.is((a as any)[k], (b as any)[k]));
}

/** "Saving…" / "Draft saved hh:mm" in muted 12px text. */
export function AutoSaveIndicator({ status, lastSavedAt, className = '' }: { status: AutoSaveStatus; lastSavedAt: Date | null; className?: string }) {
  let text = '';
  if (status === 'saving') text = 'Saving…';
  else if (lastSavedAt) text = `Draft saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  if (!text) return null;
  return <span className={`text-[12px] leading-[16px] text-[#71747d] whitespace-nowrap ${className}`} aria-live="polite">{text}</span>;
}
