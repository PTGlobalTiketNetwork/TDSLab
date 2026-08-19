/**
 * TiketInput Component
 * 
 * Source of Truth: Banner Name input field in FormStepConfig
 * 
 * Features:
 * - Standard padding (12px horizontal, 10px vertical)
 * - Rounded corners (8px)
 * - Focus ring color (#007BFF)
 * - Error state support
 * - Disabled state styling
 * 
 * @example
 * <TiketInput
 *   value={bannerName}
 *   onChange={(e) => setBannerName(e.target.value)}
 *   placeholder="Enter banner name"
 *   error="This field is required"
 * />
 */

import React from 'react';
import { cn } from './utils';

export interface TiketInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const TiketInput = React.forwardRef<HTMLInputElement, TiketInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none text-[14px] transition-all placeholder:text-[#9EA0A5] disabled:bg-[#F8F9FD] disabled:text-[#9EA0A5] bg-white font-medium",
          error && "border-[#ff5c5c] ring-1 ring-[#ff5c5c] focus:border-[#ff5c5c] focus:ring-[#ff5c5c]",
          className
        )}
        style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 500 }}
        {...props}
      />
    );
  }
);
TiketInput.displayName = 'TiketInput';

export interface TiketTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const TiketTextarea = React.forwardRef<HTMLTextAreaElement, TiketTextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none text-[14px] transition-all placeholder:text-[#9EA0A5] disabled:bg-[#F8F9FD] disabled:text-[#9EA0A5] bg-white min-h-[100px] resize-y",
          error && "border-[#ff5c5c] ring-1 ring-[#ff5c5c] focus:border-[#ff5c5c] focus:ring-[#ff5c5c]",
          className
        )}
        style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}
        {...props}
      />
    );
  }
);
TiketTextarea.displayName = 'TiketTextarea';
