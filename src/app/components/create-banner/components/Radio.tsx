import React from 'react';

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  children: React.ReactNode;
}

export function Radio({ children, className, ...props }: RadioProps) {
  return (
    <label className={`flex items-center gap-[8px] cursor-pointer group ${className || ''}`}>
      <div className="relative w-[24px] h-[24px] shrink-0">
        <input
          type="radio"
          className="peer appearance-none w-full h-full absolute inset-0 cursor-pointer z-10"
          {...props}
        />
        {/* Active State Icon */}
        <div className="hidden peer-checked:block pointer-events-none w-full h-full">
          <svg className="block w-full h-full" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" fill="white" r="7" stroke="#007BFF" strokeWidth="6" />
          </svg>
        </div>
        {/* Inactive State Icon */}
        <div className="block peer-checked:hidden pointer-events-none w-full h-full">
           <svg className="block w-full h-full" fill="none" viewBox="0 0 24 24">
             <circle cx="12" cy="12" fill="white" r="9.5" stroke="#AEB2BE" />
           </svg>
        </div>
      </div>
      <div className="text-[#303135] select-none">{children}</div>
    </label>
  );
}
