import { useRef, useState } from 'react';
import { ArrowLeftRight, Minus, Plus, RotateCw } from 'lucide-react';
import { ColorPicker } from '../ColorPicker';

export type LinearGradient = { angle: number; stops: { color: string; pos: number }[] };

interface Props {
  value: LinearGradient;
  onChange: (g: LinearGradient) => void;
  maxStops?: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const css = (g: LinearGradient, angle = g.angle) => `linear-gradient(${angle}deg, ${[...g.stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ')})`;

/**
 * Linear gradient editor, same model as Figma's: a bar with draggable stop handles, a stop list
 * (position % + colour), add/remove stops (2 to `maxStops`), swap direction and rotate 90°.
 */
export function LinearGradientEditor({ value, onChange, maxStops = 3 }: Props) {
  const [active, setActive] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);
  const stops = value.stops;
  const set = (stops: LinearGradient['stops']) => onChange({ ...value, stops });
  const byPosition = stops.map((s, i) => ({ s, i })).sort((a, b) => a.s.pos - b.s.pos || a.i - b.i);
  const setStop = (i: number, patch: Partial<LinearGradient['stops'][number]>) => set(stops.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const moved = useRef(false);
  const dragStop = (e: React.PointerEvent, i: number) => {
    setActive(i);
    moved.current = false;
    const startX = e.clientX;
    const bar = barRef.current!.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      if (!moved.current && Math.abs(ev.clientX - startX) < 3) return;
      moved.current = true;
      setStop(i, { pos: Math.round(clamp(((ev.clientX - bar.left) / bar.width) * 100, 0, 100)) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const addStop = () => {
    // New stop goes in the widest gap, coloured like its left neighbour
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    let best = 0;
    for (let i = 1; i < sorted.length - 1; i++) if (sorted[i + 1].pos - sorted[i].pos > sorted[best + 1].pos - sorted[best].pos) best = i;
    const pos = Math.round((sorted[best].pos + sorted[best + 1].pos) / 2);
    set([...stops, { color: sorted[best].color, pos }]);
    setActive(stops.length);
  };
  const swap = () => set(stops.map((s) => ({ ...s, pos: 100 - s.pos })));
  const rotate = () => onChange({ ...value, angle: (value.angle + 90) % 360 });

  const iconBtn = 'w-[28px] h-[28px] flex items-center justify-center rounded-[6px] text-[#5e6066] hover:bg-[#f5f6fa] hover:text-[#303135] disabled:opacity-40 disabled:hover:bg-transparent transition-colors';
  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-[#303135]">Linear · {value.angle}°</span>
        <div className="flex items-center gap-[4px]">
          <button type="button" onClick={swap} className={iconBtn} title="Swap direction"><ArrowLeftRight size={14} /></button>
          <button type="button" onClick={rotate} className={iconBtn} title="Rotate 90°"><RotateCw size={14} /></button>
        </div>
      </div>

      {/* The bar always reads left → right; handles sit on top of it */}
      <div className="relative pt-[22px] px-[8px]">
        <div ref={barRef} className="relative h-[24px] rounded-[6px] border border-[#e9ebef]" style={{ background: css(value, 90) }}>
          {stops.map((s, i) => (
            // Click a handle to open its colour picker; drag it to move the stop (a drag doesn't open the picker)
            <div key={i} className="absolute -top-[22px] -translate-x-1/2" style={{ left: `${s.pos}%` }}>
              <ColorPicker
                value={s.color}
                onChange={(c) => setStop(i, { color: c })}
                trigger={
                  <button
                    type="button"
                    onPointerDown={(e) => dragStop(e, i)}
                    onClick={(e) => { if (moved.current) { e.preventDefault(); moved.current = false; } }}
                    className={`block w-[18px] h-[18px] rounded-[4px] border-2 shadow-sm cursor-pointer ${active === i ? 'border-[#007BFF]' : 'border-white'}`}
                    style={{ background: s.color, touchAction: 'none' }}
                    title={`${s.pos}% · click to change colour, drag to move`}
                  />
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-[#303135]">Stops</span>
        <button type="button" onClick={addStop} disabled={stops.length >= maxStops} className={iconBtn} title="Add stop"><Plus size={14} /></button>
      </div>
      <div className="flex flex-col gap-[6px]">
        {/* Listed left → right by position (like Figma); i stays the stop's own index, so dragging a handle past another re-sorts the list live */}
        {byPosition.map(({ s, i }) => (
          <div key={i} onClick={() => setActive(i)} className={`flex items-center gap-[8px] px-[8px] py-[6px] rounded-[8px] ${active === i ? 'bg-[#f2f8ff]' : ''}`}>
            <div className="flex items-center w-[64px] h-[30px] rounded-[6px] border border-[#d8dce8] bg-white px-[8px]">
              <input
                type="number"
                min={0}
                max={100}
                value={s.pos}
                onChange={(e) => setStop(i, { pos: clamp(Number(e.target.value) || 0, 0, 100) })}
                className="w-full min-w-0 bg-transparent outline-none text-[13px]"
              />
              <span className="text-[12px] text-[#71747d]">%</span>
            </div>
            <div className="flex-1"><ColorPicker value={s.color} onChange={(c) => setStop(i, { color: c })} /></div>
            <button type="button" onClick={(e) => { e.stopPropagation(); set(stops.filter((_, j) => j !== i)); setActive(0); }} disabled={stops.length <= 2} className={iconBtn} title="Remove stop"><Minus size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
