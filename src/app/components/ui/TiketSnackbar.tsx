import React, { ReactNode } from 'react';
import { toast } from 'sonner';

export interface TiketSnackbarProps {
  message: string;
  variant?: 'default' | 'error' | 'success';
  cta?: {
    label: string;
    onClick: () => void;
  };
  id?: string | number; // To close the toast
  icon?: ReactNode;
}

export function TiketSnackbar({ message, variant = 'default', cta, id, icon }: TiketSnackbarProps) {
  const isError = variant === 'error';
  const isSuccess = variant === 'success';

  return (
    <div
      className={`
        w-full max-w-[400px] min-w-[320px]
        rounded-[8px] px-[16px] py-[12px]
        flex items-start justify-between gap-[12px] shadow-lg
        ${isError ? 'bg-[#D92D20]' : isSuccess ? 'bg-[#0BAE54]' : 'bg-[#303135]'}
      `}
    >
      <div className="flex items-start gap-[12px] flex-1 min-w-0">
        {icon && (
          <div className="shrink-0 flex items-center justify-center text-white">
            {icon}
          </div>
        )}
        <span className="text-[14px] font-medium text-white leading-[20px] line-clamp-2">
          {message}
        </span>
      </div>

      {cta && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            cta.onClick();
            if (id) toast.dismiss(id);
          }}
          className="text-[14px] font-bold text-white hover:opacity-80 transition-opacity whitespace-nowrap shrink-0"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
