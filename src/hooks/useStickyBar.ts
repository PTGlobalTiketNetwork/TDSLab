import { useEffect, useId, useSyncExternalStore, type RefObject } from 'react';

/**
 * One shadow rule for every sticky / fixed bar:
 * a bar casts STICKY_SHADOW only while it is actually stuck AND it is the bottom-most stuck bar
 * of the stack (header + stepper + tab bars…). Every other bar shows border-b only.
 *
 * Each bar registers here; on scroll/resize all bars are measured and the stuck bar with the
 * largest bottom edge wins the shadow.
 */
export const STICKY_SHADOW = 'shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]';

type Entry = { el: HTMLElement | null; forced?: boolean };
const bars = new Map<string, Entry>();
const stuckSet = new Set<string>();
let winner: string | null = null;
const listeners = new Set<() => void>();
let raf = 0;
let attached = false;

function measure() {
  raf = 0;
  stuckSet.clear();
  let best: string | null = null;
  let bestBottom = -Infinity;
  bars.forEach((entry, id) => {
    let stuck = false;
    let bottom = -Infinity;
    if (entry.forced !== undefined) {
      stuck = entry.forced;
      if (stuck && entry.el) bottom = entry.el.getBoundingClientRect().bottom;
    } else if (entry.el) {
      const cs = getComputedStyle(entry.el);
      if (cs.position === 'sticky') {
        const rect = entry.el.getBoundingClientRect();
        const top = parseFloat(cs.top);
        // Pinned exactly at its sticky offset (not still in flow, not being pushed out by its container).
        stuck = !Number.isNaN(top) && Math.abs(rect.top - top) < 1;
        bottom = rect.bottom;
      }
    }
    if (stuck) {
      stuckSet.add(id);
      if (bottom > bestBottom) { bestBottom = bottom; best = id; }
    }
  });
  winner = best;
  listeners.forEach((l) => l());
}

function schedule() {
  if (!raf) raf = requestAnimationFrame(measure);
}

function attach() {
  if (attached || typeof window === 'undefined') return;
  attached = true;
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/**
 * Registers a sticky bar. `forcedStuck` is for fixed bars whose "stuck" state is known (e.g. the
 * scrolled stepper bar). Returns whether the bar is stuck and whether it should draw the shadow.
 */
export function useStickyBar(ref: RefObject<HTMLElement | null>, forcedStuck?: boolean) {
  const id = useId();
  useEffect(() => {
    attach();
    bars.set(id, { el: ref.current, forced: forcedStuck });
    schedule();
    return () => { bars.delete(id); schedule(); };
  });
  const stuck = useSyncExternalStore(subscribe, () => stuckSet.has(id), () => false);
  const shadow = useSyncExternalStore(subscribe, () => winner === id, () => false);
  return { stuck, shadow };
}
