/**
 * TiketButton Component
 * 
 * Design System: Tiket.com Button Guidelines
 * 
 * Variants:
 * - primary: Blue background (#007BFF), white text - main CTAs
 * - secondary: Light blue background (#E5F2FF), blue text - secondary actions
 * - tertiary: Transparent, blue text only - least emphasis
 * - alert: Red background (#FF6B6B), white text - destructive actions
 * 
 * Sizes:
 * - medium: Standard height (44px) - default
 * - large: Taller height (52px) - prominent actions
 * 
 * States:
 * - Default: Full saturation
 * - Hover: Lighter/adjusted shade
 * - Disabled: Desaturated pale colors
 * - Loading: Shows spinner, disabled interaction
 * 
 * @example
 * <TiketButton variant="primary" size="large" onClick={handleNext}>
 *   Continue
 * </TiketButton>
 * 
 * <TiketButton variant="secondary" onClick={handleCancel}>
 *   Cancel
 * </TiketButton>
 * 
 * <TiketButton variant="alert" onClick={handleDelete}>
 *   Delete
 * </TiketButton>
 * 
 * <TiketButton variant="tertiary" onClick={handleSkip}>
 *   Skip
 * </TiketButton>
 */

import React from 'react';
import { cn } from './utils';

export type TiketButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'alert';
export type TiketButtonSize = 'medium' | 'large';

export interface TiketButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TiketButtonVariant;
  size?: TiketButtonSize;
  isLoading?: boolean;
}

const LoadingSpinner = () => (
  <svg className="animate-spin mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export const TiketButton = React.forwardRef<HTMLButtonElement, TiketButtonProps>(
  ({ className, variant = 'primary', size = 'medium', isLoading = false, children, disabled, ...props }, ref) => {
    // Base styles - consistent across all variants
    const baseStyles = "inline-flex items-center justify-center rounded-[8px] font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF] focus-visible:ring-offset-2 disabled:cursor-not-allowed";
    
    // Size variations
    const sizeStyles: Record<TiketButtonSize, string> = {
      medium: "h-[44px] px-[24px] text-[16px]",
      large: "h-[52px] px-[32px] text-[18px]"
    };
    
    // Variant styles with proper hover and disabled states
    const variantStyles: Record<TiketButtonVariant, string> = {
      primary: "bg-[#007BFF] text-white hover:bg-[#3D9EFF] disabled:bg-[#E3E7EE] disabled:text-[#C1C5CF] shadow-sm",
      secondary: "bg-[#E5F2FF] text-[#007BFF] hover:bg-[#B3DCFF] disabled:bg-[#E3E7EE] disabled:text-[#C1C5CF]",
      tertiary: "bg-transparent text-[#007BFF] hover:bg-[#F5F9FF] disabled:bg-transparent disabled:text-[#C1C5CF]",
      alert: "bg-[#FF6B6B] text-white hover:bg-[#FF8E8E] disabled:bg-[#E3E7EE] disabled:text-[#C1C5CF] shadow-sm"
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner />}
        {children}
      </button>
    );
  }
);
TiketButton.displayName = 'TiketButton';