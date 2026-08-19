import { X } from 'lucide-react';
import { toast } from 'sonner';

interface SnackbarProps {
  message: string;
  variant?: 'default' | 'error';
  cta?: {
    label: string;
    onClick: () => void;
  };
  id?: string | number; // To close the toast
}

export function Snackbar({ message, variant = 'default', cta, id }: SnackbarProps) {
  const isError = variant === 'error';
  
  return (
    <div 
      className={`
        w-full max-w-[400px] min-w-[320px] 
        rounded-[8px] px-[16px] py-[12px] 
        flex items-center justify-between gap-[12px] shadow-lg
        ${isError ? 'bg-[#D92D20]' : 'bg-[#303135]'}
      `}
    >
      <span className="text-[14px] font-medium text-white leading-[20px]">
        {message}
      </span>
      
      {cta && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            cta.onClick();
            if (id) toast.dismiss(id);
          }}
          className="text-[14px] font-bold text-white hover:opacity-80 transition-opacity whitespace-nowrap"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
}
