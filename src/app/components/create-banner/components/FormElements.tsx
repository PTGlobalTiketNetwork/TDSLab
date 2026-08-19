import React from 'react';
import { cn } from '../../ui/utils';

// Common styles based on the user's design system
const baseStyles = "w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none text-[14px] transition-all placeholder:text-[#9EA0A5] disabled:bg-[#F8F9FD] disabled:text-[#9EA0A5] font-sans bg-white";

export const StyledInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input 
        ref={ref} 
        className={cn(baseStyles, "font-medium", className)} 
        {...props} 
      />
    );
  }
);
StyledInput.displayName = 'StyledInput';

export const StyledTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea 
        ref={ref} 
        className={cn(baseStyles, "min-h-[100px] resize-y", className)} 
        {...props} 
      />
    );
  }
);
StyledTextarea.displayName = 'StyledTextarea';

export const StyledNativeSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
    ({ className, ...props }, ref) => {
      return (
        <select 
          ref={ref} 
          className={cn(baseStyles, "appearance-none pr-[40px] cursor-pointer", className)} 
          {...props} 
        />
      );
    }
  );
StyledNativeSelect.displayName = 'StyledNativeSelect';
