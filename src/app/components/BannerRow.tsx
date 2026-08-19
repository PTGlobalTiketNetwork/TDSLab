import { Banner } from '../../types/banner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { BannerFormData } from './create-banner/types';
import { ScaledBannerPreview } from './ScaledBannerPreview';
import type { MouseEvent } from 'react';

interface BannerRowProps {
  banner: Banner;
  index: number;
  isSelected: boolean;
  onClick: (e: MouseEvent) => void;
}

export function BannerRow({ banner, index, isSelected, onClick }: BannerRowProps) {
  const formData = (banner as any).form_data as BannerFormData | undefined;
  const hasSourcePreview = Boolean(formData?.keyVisualUrl);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };
  
  const cacheBuster = (banner as any).updatedAt ? new Date((banner as any).updatedAt).getTime() : banner.id;
  
  // Prefer the source visual for every banner with saved form data. This prevents
  // an outdated exported image_url_en from winning over the actual selected background.
  const rawThumbnail = formData?.keyVisualUrl || banner.thumbnail || banner.imageUrl || null;
  const thumbnailUrl = rawThumbnail
    ? `${rawThumbnail}${rawThumbnail.includes('?') ? '&' : '?'}t=${cacheBuster}`
    : undefined;

  return (
    <div
      id={`banner-card-${banner.id}`}
      onClick={handleClick}
      onMouseDown={(e) => {
        if (e.shiftKey) e.preventDefault();
      }}
      className={`
        relative rounded-[12px] bg-white cursor-pointer transition-all select-none
        flex items-center gap-[20px] p-[16px] w-full
        ${isSelected 
          ? '' 
          : 'shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
        }
      `}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 rounded-[12px]"
        onClick={handleClick}
        onMouseDown={(e) => {
          if (e.shiftKey) e.preventDefault();
        }}
      />

      {/* Selected Overlay */}
      {isSelected && (
        <div 
          aria-hidden="true" 
          className="absolute border-2 border-[#007BFF] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]" 
        />
      )}

      {/* Number */}
      <div className="text-[18px] font-bold text-[#303135] w-[26px] text-center shrink-0">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Thumbnail */}
      <div className="w-[96px] h-[48px] rounded-[4px] overflow-hidden bg-[#f8f9fd] shrink-0 relative pointer-events-none">
        {hasSourcePreview && formData ? (
          <ScaledBannerPreview
            formData={formData}
            previewUrl={thumbnailUrl || null}
            className="h-full w-full"
            fit="cover"
          />
        ) : (
          <ImageWithFallback
            src={thumbnailUrl}
            alt={banner.name}
            className="absolute inset-0 size-full object-cover rounded-[4px]"
          />
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
        <h3 className="text-[18px] font-bold text-[#303135] truncate leading-[24px]">
          {banner.name}
        </h3>
      </div>
    </div>
  );
}
