import { forwardRef } from 'react';
import { Asset } from '../../types/asset';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface AssetRowProps {
  asset: Asset;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

export const AssetRow = forwardRef<HTMLDivElement, AssetRowProps>(
  ({ asset, index, isSelected, onClick, ...props }, ref) => {
    // Format index to be 01, 02, etc.
    const formattedIndex = (index + 1).toString().padStart(2, '0');

    return (
      <div 
        ref={ref}
        id={`asset-card-${asset.id}`}
        onClick={onClick}
        className={`bg-white rounded-[12px] h-[64px] flex items-center px-[24px] cursor-pointer transition-all hover:shadow-sm ${
          isSelected ? 'border-[2px] border-[#007BFF] px-[23px]' : 'border border-[#d8dce8]'
        }`}
        {...props}
      >
        {/* Index */}
        <div className="w-[40px] shrink-0 font-bold text-[#303135] text-[16px]">
          {formattedIndex}
        </div>

        {/* Image */}
        <div className="w-[100px] shrink-0 flex items-center justify-start">
           <div className="h-[40px] w-[80px] flex items-center justify-start">
              <ImageWithFallback 
                  src={asset.imageUrl}
                  alt={asset.name}
                  className="max-w-full max-h-full object-contain"
              />
           </div>
        </div>

        {/* Name */}
        <div className="flex-1 font-bold text-[#303135] text-[16px]">
          {asset.name}
        </div>
      </div>
    );
  }
);

AssetRow.displayName = 'AssetRow';
