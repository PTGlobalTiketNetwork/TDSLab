import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { ToastMessage } from '../../types/banner';

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast && toast.duration) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-[32px] left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-[#1f2937] text-white px-[24px] py-[16px] rounded-[8px] shadow-2xl flex items-center gap-3 min-w-[320px]">
        <CheckCircle size={20} className="text-[#10b981] flex-shrink-0" />
        <p className="text-[14px] font-medium flex-1">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
