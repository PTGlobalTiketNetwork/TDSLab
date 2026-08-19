/**
 * TiketTabs Component
 * 
 * Source of Truth: EN/ID Translation tabs in FormStep2
 * 
 * Features:
 * - Underline style with blue border on active tab
 * - Text-based tabs with hover states
 * - Support for any number of tab items
 * 
 * @example
 * <TiketTabs
 *   items={[
 *     { id: 'en', label: 'EN Translation' },
 *     { id: 'id', label: 'ID Translation' }
 *   ]}
 *   activeId="en"
 *   onChange={(id) => setActiveTab(id)}
 * />
 */

import React from 'react';

export interface TiketTabItem {
  id: string;
  label: string;
}

export interface TiketTabsProps {
  items: TiketTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export function TiketTabs({ items, activeId, onChange, className = '', fullWidth = false, disabled = false }: TiketTabsProps) {
  return (
    <div className={`flex border-b border-[#e9ebef] ${className} ${disabled ? 'opacity-50 grayscale' : ''}`}>
      {items.map((item) => (
        <button
          key={item.id}
          disabled={disabled}
          onClick={() => onChange(item.id)}
          className={`px-[16px] py-[12px] text-[14px] font-bold border-b-2 transition-colors ${
            activeId === item.id
              ? 'text-[#007BFF] border-[#007BFF]'
              : 'text-[#71747d] border-transparent hover:text-[#303135]'
          } ${fullWidth ? 'flex-1 w-full text-center' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
          style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
