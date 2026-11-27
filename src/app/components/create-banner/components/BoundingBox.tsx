import { useRef, useState, CSSProperties, ReactNode } from 'react';

interface BoundingBoxProps {
  children: ReactNode;
  /** Only the editor preview passes this; exports render the plain content. */
  enabled: boolean;
  className?: string;
  style?: CSSProperties;
  /** Current vertical offset in stored units, stored units per canvas px, and limits. */
  offsetY: number;
  offsetUnit: number;
  offsetMin: number;
  offsetMax: number;
  onOffsetChange: (value: number) => void;
  /** Optional horizontal drag (stored units per canvas px, limits). */
  offsetX?: number;
  offsetXUnit?: number;
  offsetXMin?: number;
  offsetXMax?: number;
  onOffsetXChange?: (value: number) => void;
  /** Current content scale in % and limits. */
  scale: number;
  scaleMin: number;
  scaleMax: number;
  onScaleChange: (value: number) => void;
  /** Width mode: the corner handles resize the box width (right edge stays put), e.g. to change where text wraps. Replaces scaling. */
  widthMode?: { width: number; min: number; max: number; onChange: (w: number) => void };
  /** Extra scale already applied to this element by a CSS transform (so the outline/handles keep a constant on-screen size). */
  selfScale?: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Hover/drag bounding box for the content block of a banner preview.
 * Drag the body to move it up/down, drag a corner to scale it — no sliders needed.
 * Screen px are converted to canvas px using the nearest [data-canvas-w] ancestor.
 */
export function BoundingBox({ children, enabled, className, style, offsetY, offsetUnit, offsetMin, offsetMax, onOffsetChange, offsetX = 0, offsetXUnit = 1, offsetXMin = -9999, offsetXMax = 9999, onOffsetXChange, scale, scaleMin, scaleMax, onScaleChange, widthMode, selfScale = 1 }: BoundingBoxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [ratio, setRatio] = useState(1); // screen px per canvas px

  if (!enabled) return <div className={className} style={style}>{children}</div>;

  const measure = () => {
    const canvas = ref.current?.closest('[data-canvas-w]') as HTMLElement | null;
    if (!canvas) return 1;
    const r = canvas.getBoundingClientRect().width / Number(canvas.dataset.canvasW || 1);
    setRatio(r);
    return r;
  };

  const startMove = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = measure();
    const startY = e.clientY;
    const startX = e.clientX;
    const startVal = offsetY;
    const startValX = offsetX;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const dCanvas = (ev.clientY - startY) / r;
      onOffsetChange(clamp(Math.round((startVal + dCanvas * offsetUnit) / 2) * 2, offsetMin, offsetMax));
      if (onOffsetXChange) onOffsetXChange(clamp(Math.round((startValX + ((ev.clientX - startX) / r) * offsetXUnit) / 2) * 2, offsetXMin, offsetXMax));
    };
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startScale = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = measure();
    if (widthMode) {
      // dragging a left handle to the left widens the box, to the right narrows it
      const startX = e.clientX;
      const startW = widthMode.width;
      setDragging(true);
      const moveW = (ev: PointerEvent) => widthMode.onChange(clamp(Math.round((startW - (ev.clientX - startX) / r / selfScale) / 4) * 4, widthMode.min, widthMode.max));
      const upW = () => { setDragging(false); window.removeEventListener('pointermove', moveW); window.removeEventListener('pointerup', upW); };
      window.addEventListener('pointermove', moveW);
      window.addEventListener('pointerup', upW);
      return;
    }
    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const startScaleVal = scale;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      onScaleChange(clamp(Math.round((startScaleVal * dist) / startDist / 5) * 5, scaleMin, scaleMax));
    };
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const show = hover || dragging;
  const px = (n: number) => `${n / ratio / selfScale}px`; // constant on-screen size
  const corners: [string, CSSProperties][] = [
    ['nwse-resize', { left: 0, top: 0 }],
    ['nesw-resize', { right: 0, top: 0 }],
    ['nesw-resize', { left: 0, bottom: 0 }],
    ['nwse-resize', { right: 0, bottom: 0 }],
  ];

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none', outline: show ? `${px(2)} dashed #007BFF` : 'none', outlineOffset: px(4) }}
      onPointerEnter={() => { measure(); setHover(true); }}
      onPointerLeave={() => setHover(false)}
      onPointerDown={startMove}
    >
      {children}
      {show && (widthMode ? corners.filter(([, pos]) => pos.left === 0).map(([, pos]) => ['ew-resize', pos] as [string, CSSProperties]) : corners).map(([cursor, pos], i) => (
        <div
          key={i}
          onPointerDown={startScale}
          style={{ position: 'absolute', width: px(12), height: px(12), background: '#fff', border: `${px(2)} solid #007BFF`, borderRadius: px(2), cursor, zIndex: 50, transform: `translate(${pos.left === 0 ? '-50%' : pos.right === 0 ? '50%' : '0'}, ${pos.top === 0 ? '-50%' : '50%'})`, ...pos }}
        />
      ))}
    </div>
  );
}
