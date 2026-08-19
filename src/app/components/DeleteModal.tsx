import { X, Loader2 } from 'lucide-react';
import { Banner } from '../../types/banner';

interface DeleteModalProps {
  isOpen: boolean;
  banner?: Banner | null;
  banners?: Banner[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteModal({ isOpen, banner, banners, onConfirm, onCancel, isLoading }: DeleteModalProps) {
  const isBulk = banners && banners.length > 0;
  if (!isOpen || (!banner && !isBulk)) return null;

  const count = isBulk ? banners.length : 1;
  const title = isBulk ? `Delete ${count} Banners` : 'Delete Banner';
  const buttonLabel = isBulk ? `Delete ${count} Banners` : 'Delete Banner';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[12px] w-[480px] shadow-2xl">
        <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
          <h3 className="text-[20px] font-bold text-[#303135]">
            {title}
          </h3>
          <button
            onClick={!isLoading ? onCancel : undefined}
            disabled={isLoading}
            className="text-[#71747d] hover:text-[#303135] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-[24px]">
          <p className="text-[14px] text-[#4D4F56] mb-4">
            {isBulk
              ? `Are you sure you want to delete these ${count} banners?`
              : 'Are you sure you want to delete this banner?'}
          </p>

          {isBulk ? (
            <div className="bg-[#f8f9fd] p-[16px] rounded-[8px] max-h-[200px] overflow-y-auto space-y-2">
              {banners.map(b => (
                <div key={b.id} className="flex items-center justify-between">
                  <p className="text-[14px] font-bold text-[#303135] truncate flex-1">{b.name}</p>
                  <p className="text-[12px] text-[#71747d] ml-2 shrink-0">{b.product}</p>
                </div>
              ))}
            </div>
          ) : banner ? (
            <div className="bg-[#f8f9fd] p-[16px] rounded-[8px]">
              <p className="text-[14px] font-bold text-[#303135]">{banner.name}</p>
              <p className="text-[12px] text-[#71747d] mt-1">
                {banner.product} • {banner.dimension}
              </p>
            </div>
          ) : null}

          <p className="text-[14px] text-[#dc2626] mt-4">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-[40px] px-[24px] bg-[#FFDFDF] text-[#F15C59] text-[14px] font-bold rounded-[8px] hover:bg-[#FC9999] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {buttonLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="h-[40px] px-[24px] bg-[#007BFF] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}