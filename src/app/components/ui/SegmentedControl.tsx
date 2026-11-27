/**
 * SegmentedControl — shared pill-style segmented control.
 *
 * Source of truth: the EN/ID language switch in create-banner/FormStep2.tsx ("lang-seg").
 * Use this everywhere a 2(+)-option switch should look like a pill, not an underline tab
 * (TiketTabs) or plain radio/checkbox row — e.g. Mobile/Desktop, EN/ID.
 *
 * @example
 * <SegmentedControl
 *   items={[{ id: 'mobile', label: 'Mobile' }, { id: 'desktop', label: 'Desktop' }]}
 *   activeId={device}
 *   onChange={(id) => setDevice(id as 'mobile' | 'desktop')}
 *   fullWidth
 * />
 */

export interface SegmentedControlItem {
  id: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps {
  items: SegmentedControlItem[];
  activeId: string;
  onChange: (id: string) => void;
  /** Pill stretches edge to edge of its container, each option sharing the width equally. */
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl({ items, activeId, onChange, fullWidth = false, className = '', disabled = false }: SegmentedControlProps) {
  return (
    <div className={`flex p-[4px] gap-[4px] rounded-full bg-[#f2f4f8] ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 grayscale' : ''} ${className}`}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(item.id)}
          className={`px-[14px] py-[6px] rounded-full text-[14px] font-bold transition-colors ${fullWidth ? 'flex-1 text-center' : ''} ${
            activeId === item.id
              ? 'bg-white text-[#007BFF] shadow-[0px_1px_4px_0px_rgba(48,49,53,0.16)]'
              : 'text-[#71747d] hover:text-[#303135]'
          } ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
