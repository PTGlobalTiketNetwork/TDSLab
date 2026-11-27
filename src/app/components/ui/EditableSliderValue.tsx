import { useEffect, useState } from 'react';

interface EditableSliderValueProps {
  value: number;
  onChange: (value: number) => void;
  /** Shown right after the number, e.g. '%' or 'px'. Not part of the editable text. */
  suffix?: string;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * The small colored number next to a slider (e.g. "175%"), made directly typable — click it,
 * type a whole number, Enter/blur to commit. Clamped to [min, max] and always rounded to an integer.
 */
export function EditableSliderValue({ value, onChange, suffix = '', min, max, className }: EditableSliderValueProps) {
  const [text, setText] = useState(String(Math.round(value)));

  useEffect(() => {
    setText(String(Math.round(value)));
  }, [value]);

  const commit = () => {
    let n = parseInt(text, 10);
    if (isNaN(n)) {
      setText(String(Math.round(value)));
      return;
    }
    if (typeof min === 'number') n = Math.max(min, n);
    if (typeof max === 'number') n = Math.min(max, n);
    setText(String(n));
    if (n !== Math.round(value)) onChange(n);
  };

  return (
    <span className={`inline-flex items-baseline ${className || ''}`}>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          if (/^-?\d*$/.test(e.target.value)) setText(e.target.value);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
        onFocus={(e) => e.target.select()}
        className="bg-transparent text-right outline-none"
        style={{ width: `${Math.max(2, text.length)}ch` }}
      />
      {suffix}
    </span>
  );
}
