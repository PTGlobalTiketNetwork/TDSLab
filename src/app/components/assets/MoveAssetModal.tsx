import { useState, useMemo } from 'react';
import { X, Loader2, AlertTriangle, ChevronDown, FolderInput, Check, Info } from 'lucide-react';
import { Asset } from '../../types/asset';
import {
  ALL_ASSET_CATEGORIES,
  getAssetConstraints,
  validateAssetForCategory,
} from '../../utils/assetConstraints';

interface MoveAssetModalProps {
  isOpen: boolean;
  asset: Asset | null;
  onConfirm: (asset: Asset, targetCategory: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type Step = 'select' | 'confirm';

export function MoveAssetModal({ isOpen, asset, onConfirm, onCancel, isLoading }: MoveAssetModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('select');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Reset state when modal opens/closes
  const handleCancel = () => {
    setSelectedCategory(null);
    setStep('select');
    setDropdownOpen(false);
    onCancel();
  };

  const availableCategories = useMemo(() => {
    if (!asset) return [];
    return ALL_ASSET_CATEGORIES.filter((c) => c !== asset.category);
  }, [asset]);

  const validationError = useMemo(() => {
    if (!asset || !selectedCategory) return null;
    return validateAssetForCategory(asset.dimension, selectedCategory);
  }, [asset, selectedCategory]);

  const targetConstraints = useMemo(() => {
    if (!selectedCategory) return null;
    return getAssetConstraints(selectedCategory);
  }, [selectedCategory]);

  if (!isOpen || !asset) return null;

  const handleConfirm = () => {
    if (!selectedCategory || validationError) return;
    onConfirm(asset, selectedCategory);
    setSelectedCategory(null);
    setStep('select');
  };

  const handleNext = () => {
    if (!selectedCategory || validationError) return;
    setStep('confirm');
  };

  const handleBack = () => {
    setStep('select');
  };

  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
        <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFF4E5] flex items-center justify-center text-[#F5A623]">
                <FolderInput size={22} strokeWidth={2} />
              </div>
              <h3 className="text-[20px] font-bold text-[#303135]">
                Confirm Move
              </h3>
            </div>
            <button
              onClick={!isLoading ? handleCancel : undefined}
              disabled={isLoading}
              className="text-[#71747d] hover:text-[#303135] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-[24px]">
            <p className="text-[14px] text-[#4D4F56] mb-4">
              Are you sure you want to move this asset?
            </p>

            {/* Asset Preview */}
            <div className="bg-[#f8f9fd] p-[16px] rounded-[8px] flex items-center gap-4 mb-4">
              <div className="w-[60px] h-[60px] bg-white rounded border border-[#d8dce8] flex items-center justify-center p-1 shrink-0">
                <img src={asset.imageUrl} alt={asset.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-[#303135] truncate">
                  {asset.name}
                </p>
                <p className="text-[12px] text-[#71747d] mt-1">
                  {asset.dimension} &bull; {asset.ratio}
                </p>
              </div>
            </div>

            {/* Move Path */}
            <div className="flex items-center gap-3 p-[16px] rounded-[8px] border border-[#d8dce8] bg-white">
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-medium text-[#71747d] mb-1">From</span>
                <span className="inline-flex items-center px-3 py-1.5 bg-[#f4f7fe] rounded-[6px] text-[13px] font-bold text-[#303135]">
                  {asset.category}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <svg width="40" height="12" viewBox="0 0 40 12" fill="none">
                  <path d="M0 6H36M36 6L30 1M36 6L30 11" stroke="#AEB2BE" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-medium text-[#71747d] mb-1">To</span>
                <span className="inline-flex items-center px-3 py-1.5 bg-[#E0EFFF] rounded-[6px] text-[13px] font-bold text-[#0064D2]">
                  {selectedCategory}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="h-[40px] px-[24px] bg-white border border-[#d8dce8] text-[#4D4F56] text-[14px] font-bold rounded-[8px] hover:bg-[#f4f7fe] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="h-[40px] px-[24px] bg-[#007BFF] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
              Move Asset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step: select
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleCancel}>
      <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E0EFFF] flex items-center justify-center text-[#0064D2]">
              <FolderInput size={22} strokeWidth={2} />
            </div>
            <h3 className="text-[20px] font-bold text-[#303135]">
              Move Asset
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-[#71747d] hover:text-[#303135] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-[24px]">
          {/* Asset Preview */}
          <div className="bg-[#f8f9fd] p-[16px] rounded-[8px] flex items-center gap-4 mb-5">
            <div className="w-[60px] h-[60px] bg-white rounded border border-[#d8dce8] flex items-center justify-center p-1 shrink-0">
              <img src={asset.imageUrl} alt={asset.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-[#303135] truncate">
                {asset.name}
              </p>
              <p className="text-[12px] text-[#71747d] mt-1">
                Currently in <span className="font-bold text-[#303135]">{asset.category}</span> &bull; {asset.dimension} &bull; {asset.ratio}
              </p>
            </div>
          </div>

          {/* Target Category Picker */}
          <label className="block text-[14px] font-medium text-[#71747d] mb-2">
            Move to category
          </label>
          <div className="relative mb-4">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] border text-[14px] text-left transition-colors ${
                dropdownOpen ? 'border-[#007BFF] ring-1 ring-[#007BFF]' : 'border-[#d8dce8]'
              } ${selectedCategory ? 'text-[#303135]' : 'text-[#aeb2be]'}`}
            >
              <span>{selectedCategory || 'Select target category'}</span>
              <ChevronDown size={18} className={`text-[#71747d] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d8dce8] rounded-[8px] shadow-lg z-10 py-1 max-h-[240px] overflow-y-auto">
                {availableCategories.map((cat) => {
                  const catValidation = validateAssetForCategory(asset.dimension, cat);
                  const catConstraints = getAssetConstraints(cat);
                  const isDisabled = !!catValidation;
                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex flex-col px-3 py-2.5 text-left transition-colors ${
                        isDisabled
                          ? 'text-[#aeb2be] cursor-not-allowed bg-[#fafafa]'
                          : selectedCategory === cat
                          ? 'bg-[#E0EFFF] text-[#0064D2] font-bold'
                          : 'text-[#303135] hover:bg-[#f4f7fe]'
                      }`}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="flex-1 text-[14px]">{cat}</span>
                        {selectedCategory === cat && !isDisabled && (
                          <Check size={16} className="text-[#0064D2]" />
                        )}
                      </div>
                      {isDisabled && catValidation && (
                        <span className="text-[11px] text-[#d4183d] font-normal mt-0.5 leading-[14px]">
                          {catValidation}
                        </span>
                      )}
                      {!isDisabled && catConstraints && (
                        <span className="text-[11px] text-[#71747d] font-normal mt-0.5 leading-[14px]">
                          {catConstraints.recommendation}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target Category Requirements */}
          {selectedCategory && targetConstraints && !validationError && (
            <div className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#E0EFFF] mb-3">
              <Check size={16} className="text-[#0064D2] shrink-0 mt-[1px]" />
              <div className="text-[12px] text-[#003D81] leading-[18px]">
                <span className="font-bold">Asset meets requirements</span> for {selectedCategory}: {targetConstraints.recommendation}
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-start gap-2 p-3 rounded-[8px] bg-[#FFDFDF]">
              <AlertTriangle size={14} className="text-[#B81D1D] shrink-0 mt-[1px]" />
              <p className="text-[12px] text-[#8C1616] leading-[16px] font-medium">
                {validationError}
              </p>
            </div>
          )}

          {/* Info about disabled items */}
          {!selectedCategory && (
            <div className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#f8f9fd]">
              <Info size={14} className="text-[#71747d] shrink-0 mt-[1px]" />
              <p className="text-[12px] text-[#71747d] leading-[16px]">
                Categories that don't match the asset's dimension or ratio requirements will be disabled.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
          <button
            onClick={handleCancel}
            className="h-[40px] px-[24px] bg-white border border-[#d8dce8] text-[#4D4F56] text-[14px] font-bold rounded-[8px] hover:bg-[#f4f7fe] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            disabled={!selectedCategory || !!validationError}
            className="h-[40px] px-[24px] bg-[#007BFF] text-white text-[14px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors disabled:bg-[#d8dce8] disabled:text-[#aeb2be] disabled:cursor-not-allowed flex items-center gap-2"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}