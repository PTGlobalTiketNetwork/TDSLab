"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "./utils";

interface QuantityInputProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export function QuantityInput({
  value,
  min = 0,
  max = 999,
  onChange,
  className,
  disabled = false,
}: QuantityInputProps) {
  
  const [inputValue, setInputValue] = React.useState(value.toString());

  // Sync internal state if prop value changes externally
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = () => {
    if (!disabled && value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (!disabled && value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(newValue)) return;
    
    setInputValue(newValue);

    if (newValue !== "") {
        const parsed = parseInt(newValue, 10);
        if (!isNaN(parsed)) {
            onChange(parsed);
        }
    }
  };

  const handleBlur = () => {
    let parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || inputValue === "") {
        parsed = min;
    }
    
    let clamped = parsed;
    if (parsed < min) clamped = min;
    if (parsed > max) clamped = max;
    
    setInputValue(clamped.toString());
    onChange(clamped);
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#E8F2FF] text-[#007BFF] transition-colors hover:bg-[#D1E5FF] disabled:pointer-events-none disabled:bg-[#F4F5F7] disabled:text-[#C0C3CF]",
        )}
      >
        <Minus className="h-4 w-4" />
      </button>
      
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onFocus={(e) => e.target.select()}
        disabled={disabled}
        maxLength={3}
        className={cn(
          "h-8 w-[40px] rounded-[4px] border border-[#d8dce8] bg-white text-center text-[14px] font-medium text-[#303135] focus:border-[#007BFF] focus:outline-none focus:ring-1 focus:ring-[#007BFF] disabled:bg-[#F4F5F7] disabled:text-[#9EA0A5]",
        )}
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#E8F2FF] text-[#007BFF] transition-colors hover:bg-[#D1E5FF] disabled:pointer-events-none disabled:bg-[#F4F5F7] disabled:text-[#C0C3CF]",
        )}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  )
}
