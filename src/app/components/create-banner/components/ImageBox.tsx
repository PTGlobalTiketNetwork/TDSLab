import { useLayoutEffect, useRef, useState, CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ImageBoxProps {
  children: ReactNode; // the <img>
  /** Style of the wrapper that carries the image position/scale (left/top %, translate(-50%), scale…) */
  wrapperStyle: CSSProperties;
  /** Current key visual position (% of the canvas) and scale (%) */
  position: { x: number; y: number };
  scale: number;
  scaleMin?: number;
  scaleMax?: number;
  onPositionChange: (p: { x: number; y: number }) => void;
  onScaleChange: (s: number) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Bounding box for the key visual: drag the image to reposition it, drag a corner to scale it.
 * The outline/handles are portalled into the banner canvas ([data-canvas-w]) so they sit above the gradient and content.
 */
export function ImageBox({ children, wrapperStyle, position, scale, scaleMin = 5, scaleMax = 200, onPositionChange, onScaleChange }: ImageBoxProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [handleHover, setHandleHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [box, setBox] = useState<{ left: number; top: number; width: number; height: number; ratio: number } | null>(null);
  const [canvas, setCanvas] = useState<HTMLElement | null>(null);

  const measure = () => {
    const el = wrapRef.current;
    const c = el?.closest('[data-canvas-w]') as HTMLElement | null;
    if (!el || !c) return null;
    const cr = c.getBoundingClientRect();
    const r = cr.width / Number(c.dataset.canvasW || 1);
    const er = el.getBoundingClientRect();
    const next = { left: (er.left - cr.left) / r, top: (er.top - cr.top) / r, width: er.width / r, height: er.height / r, ratio: r };
    setCanvas((prev) => (prev === c ? prev : c));
    // Only update when something actually moved — otherwise the layout effect below would re-render forever
    setBox((prev) => (prev && Math.abs(prev.left - next.left) < 0.5 && Math.abs(prev.top - next.top) < 0.5 && Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5 && Math.abs(prev.ratio - next.ratio) < 0.001 ? prev : next));
    return { r, canvasW: Number(c.dataset.canvasW), canvasH: cr.height / r };
  };

  const show = hover || handleHover || dragging;
  // keep the outline glued to the image while position/scale change
  useLayoutEffect(() => { if (show) measure(); }, [show, position.x, position.y, scale]);

  const startMove = (e: React.PointerEvent) => {
    e.preventDefault();
    const m = measure();
    if (!m) return;
    const sx = e.clientX, sy = e.clientY, start = { ...position };
    setDragging(true);
    const move = (ev: PointerEvent) => onPositionChange({
      x: clamp(Math.round(start.x + ((ev.clientX - sx) / m.r / m.canvasW) * 100), -50, 150),
      y: clamp(Math.round(start.y + ((ev.clientY - sy) / m.r / m.canvasH) * 100), -50, 150),
    });
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const startScale = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    measure();
    const er = wrapRef.current!.getBoundingClientRect();
    const cx = er.left + er.width / 2, cy = er.top + er.height / 2;
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    const startScaleVal = scale;
    setDragging(true);
    const move = (ev: PointerEvent) => onScaleChange(clamp(Math.round((startScaleVal * Math.hypot(ev.clientX - cx, ev.clientY - cy)) / startDist), scaleMin, scaleMax));
    const up = () => { setDragging(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const px = (n: number) => `${n / (box?.ratio ?? 1)}px`;
  const corners: [string, CSSProperties][] = [
    ['nwse-resize', { left: 0, top: 0, transform: 'translate(-50%,-50%)' }],
    ['nesw-resize', { right: 0, top: 0, transform: 'translate(50%,-50%)' }],
    ['nesw-resize', { left: 0, bottom: 0, transform: 'translate(-50%,50%)' }],
    ['nwse-resize', { right: 0, bottom: 0, transform: 'translate(50%,50%)' }],
  ];

  return (
    <>
      <div
        ref={wrapRef}
        style={{ ...wrapperStyle, pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
        onPointerEnter={() => { measure(); setHover(true); }}
        onPointerLeave={() => setHover(false)}
        onPointerDown={startMove}
      >
        {children}
      </div>
      {show && box && canvas && createPortal(
        <div
          style={{ position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height, outline: `${px(2)} dashed #FF8A00`, pointerEvents: 'none', zIndex: 40 }}
        >
          {corners.map(([cursor, pos], i) => (
            <div
              key={i}
              onPointerDown={startScale}
              onPointerEnter={() => setHandleHover(true)}
              onPointerLeave={() => setHandleHover(false)}
              style={{ position: 'absolute', width: px(12), height: px(12), background: '#fff', border: `${px(2)} solid #FF8A00`, borderRadius: px(2), cursor, pointerEvents: 'auto', ...pos }}
            />
          ))}
        </div>,
        canvas,
      )}
    </>
  );
}
