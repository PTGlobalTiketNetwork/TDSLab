import { forwardRef } from 'react';
import { Asset } from '../../types/asset';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onClick: () => void;
}

export const AssetCard = forwardRef<HTMLDivElement, AssetCardProps>(
  ({ asset, isSelected, onClick, ...props }, ref) => {
    return (
      <div 
        ref={ref}
        id={`asset-card-${asset.id}`}
        onClick={onClick}
        className={`bg-white rounded-[12px] p-[16px] h-[160px] flex flex-col justify-between cursor-pointer transition-all hover:shadow-md relative overflow-hidden group ${
          isSelected ? 'border-[2px] border-[#007BFF] p-[15px]' : 'border border-[#d8dce8]'
        }`}
        {...props}
      >
        {/* Image Area */}
        <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden">
          <ImageWithFallback 
             src={asset.imageUrl}
             alt={asset.name}
             className="max-w-full max-h-[80px] object-contain"
          />
        </div>

        {/* Title */}
        <div className="mt-2">
           <p className="font-bold text-[#303135] text-[14px] leading-[20px] truncate">
              {asset.name}
           </p>
        </div>
      </div>
    );
  }
);

AssetCard.displayName = 'AssetCard';
