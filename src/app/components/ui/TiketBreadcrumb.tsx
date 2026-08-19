/**
 * TiketBreadcrumb Component
 * 
 * Source of Truth: Top navigation path in CreateBanner (e.g., Banners > Create New...)
 * 
 * Features:
 * - Clickable breadcrumb items
 * - Arrow separator between items
 * - Active/inactive text states
 * - Optional onClick for navigation
 * 
 * @example
 * <TiketBreadcrumb
 *   items={[
 *     { label: 'Banners', onClick: () => navigate('/banners') },
 *     { label: 'Create New Banner' }
 *   ]}
 * />
 */

import React from 'react';

export interface TiketBreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export interface TiketBreadcrumbProps {
  items: TiketBreadcrumbItem[];
  className?: string;
}

export function TiketBreadcrumb({ items, className = '' }: TiketBreadcrumbProps) {
  return (
    <div className={`flex gap-[8px] items-center text-[12px] ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isClickable = !!item.onClick;
        
        return (
          <div key={index} className="flex gap-[8px] items-center">
            <span 
              className={`${
                isLast 
                  ? 'font-bold text-[#71747d]' 
                  : 'font-semibold text-[#71747d]'
              } ${isClickable ? 'cursor-pointer hover:text-[#007BFF] transition-colors' : ''}`}
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
              onClick={item.onClick}
            >
              {item.label}
            </span>
            
            {!isLast && (
              <span className="text-[#71747d] text-[14px]">{'>'}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}