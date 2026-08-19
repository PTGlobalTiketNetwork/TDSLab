import { X, Loader2 } from 'lucide-react';
import { Asset } from '../../types/asset';

interface AssetDeleteModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function AssetDeleteModal({ isOpen, asset, onConfirm, onCancel, isLoading }: AssetDeleteModalProps) {
  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-[12px] w-[480px] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
          <h3 className="text-[20px] font-bold text-[#303135]">
            Delete Asset
          </h3>
          <button
            onClick={!isLoading ? onCancel : undefined}
            disabled={isLoading}
            className="text-[#71747d] hover:text-[#303135] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-[24px]">
          <p className="text-[14px] text-[#4D4F56] mb-4">
            Are you sure you want to delete this asset?
          </p>
          <div className="bg-[#f8f9fd] p-[16px] rounded-[8px] flex items-center gap-4">
             {/* Thumbnail */}
             <div className="w-[60px] h-[60px] bg-white rounded border border-[#d8dce8] flex items-center justify-center p-1">
                 <img src={asset.imageUrl} alt={asset.name} className="max-w-full max-h-full object-contain" />
             </div>
             <div>
                <p className="text-[14px] font-bold text-[#303135]">
                {asset.name}
                </p>
                <p className="text-[12px] text-[#71747d] mt-1">
                {asset.category} • {asset.fileSize}
                </p>
            </div>
          </div>
          <p className="text-[14px] text-[#dc2626] mt-4">
            This action cannot be undone and will remove the file from storage.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="h-[40px] px-[24px] bg-white border border-[#d8dce8] text-[#4D4F56] text-[14px] font-bold rounded-[8px] hover:bg-[#f4f7fe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="h-[40px] px-[24px] bg-[#dc2626] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#b91c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            Delete Asset
          </button>
        </div>
      </div>
    </div>
  );
}
