/**
 * Active-time tracker for the banner / DLP Assets create flows.
 * Counts a second only while the tab is visible AND the user did something in the last IDLE_MS
 * (mouse, keyboard, scroll, touch), so leaving the tab open does not inflate the time.
 * The total is attached to the record by BannerService (metadata.creation_seconds) on every save.
 */
const IDLE_MS = 60_000;
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const;

let seconds = 0;
let running = false;
let lastActivity = 0;
let timer: ReturnType<typeof setInterval> | null = null;

const onActivity = () => { lastActivity = Date.now(); };

/** Start (or restart) counting. `initial` carries over the time already spent on a banner being edited. */
export function startCreationTimer(initial = 0) {
  stopCreationTimer();
  seconds = Math.max(0, initial);
  running = true;
  lastActivity = Date.now();
  EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }));
  timer = setInterval(() => {
    if (document.visibilityState === 'visible' && Date.now() - lastActivity < IDLE_MS) seconds += 1;
  }, 1000);
}

export function stopCreationTimer() {
  if (timer) clearInterval(timer);
  timer = null;
  EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true } as EventListenerOptions));
  running = false;
}

export const isCreationTimerRunning = () => running;
export const getCreationSeconds = () => Math.round(seconds);
