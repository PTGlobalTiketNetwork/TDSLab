import { Banner } from '../../types/banner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import exampleImage from 'figma:asset/c593b610d3877a5faf067379a77363d554217a35.png';
import { BannerFormData } from './create-banner/types';
import { useState, useEffect, type MouseEvent } from 'react';
import { Skeleton } from './ui/skeleton';
import { Loader2 } from 'lucide-react';
import { AvatarStack } from './UserAvatar';
import { PresenceUser } from '../../hooks/usePresence';
import { ScaledBannerPreview } from './ScaledBannerPreview';

interface BannerCardProps {
  banner: Banner;
  isSelected: boolean;
  onClick: (e: MouseEvent) => void;
  activeEditors?: PresenceUser[];
  className?: string;
}

export function BannerCard({ banner, isSelected, onClick, activeEditors, className }: BannerCardProps) {
  // Published records also retain form_data. Use its key visual whenever it exists:
  // exported image_url_en can be a stale, generic red/pink render from an older renderer.
  const formData = (banner as any).form_data as BannerFormData | undefined;
  const hasSourcePreview = Boolean(formData?.keyVisualUrl);

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    onClick(e);
  };
  
  // Background URLs may already contain signed query parameters. Preserve those
  // parameters when invalidating the browser cache so signed Supabase assets keep loading.
  const withPreviewCacheBust = (url: string | null | undefined, cacheBuster: string | number) => {
    if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url || null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${cacheBuster}`;
  };

  const rawUrl = formData?.keyVisualUrl || banner.imageUrl || banner.thumbnail || null;
  const cacheBuster = (banner as any).updatedAt
    ? new Date((banner as any).updatedAt).getTime()
    : banner.id;
  const previewUrl = withPreviewCacheBust(rawUrl, cacheBuster);

  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    if (!previewUrl) {
        setIsImageLoading(false);
        return;
    }
    
    setIsImageLoading(true);
    const img = new Image();
    const handleLoad = () => setIsImageLoading(false);
    const handleError = () => setIsImageLoading(false);

    // Attach listeners before assigning src: cached image resources may resolve immediately.
    img.onload = handleLoad;
    img.onerror = handleError;
    img.src = previewUrl;
    
    return () => {
        img.onload = null;
        img.onerror = null;
    };
  }, [previewUrl]);

  const getAspectRatioStyle = () => {
    // Try form data first
    const formData = (banner as any).form_data;
    if (formData) {
        if (formData.bannerCategory === 'Product Entry Point') {
            // Entry Point: check ratio
            if (formData.bannerRatio === 'Mobile (2:1)') {
                return { aspectRatio: '2/1' };
            }
            return { aspectRatio: '5/2' }; // Default Mobile (5:2)
        }
        
        if (formData.bannerRatio) {
            if (formData.bannerRatio === 'Landscape (2:1)') return { aspectRatio: '2/1' };
            if (formData.bannerRatio === 'Landscape (16:9)') return { aspectRatio: '16/9' };
            if (formData.bannerRatio === 'Square (1:1)') return { aspectRatio: '1/1' };
            if (formData.bannerRatio === 'Portrait (3:4)') return { aspectRatio: '3/4' };
        }
    }
    
    // Fallback dimension check
    const dim = banner.dimension || (banner.metadata as any)?.dimension;
    if (dim) {
        const parts = dim.toLowerCase().replace('px', '').split('x');
        if (parts.length === 2) {
            const w = parseFloat(parts[0]);
            const h = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(h) && h !== 0) {
                return { aspectRatio: `${w}/${h}` };
            }
        }
    }
    
    return { aspectRatio: '1/1' };
  };

  return (
    <div
      id={`banner-card-${banner.id}`}
      onClick={handleClick}
      onMouseDown={(e) => {
        if (e.shiftKey) e.preventDefault();
      }}
      className={`bg-white flex flex-col gap-[12px] p-[16px] relative rounded-[12px] cursor-pointer transition-all w-full h-full select-none ${
        isSelected ? '' : 'shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
      } ${banner.isSyncing ? 'ring-2 ring-[#007BFF] ring-offset-2' : ''} ${className || ''}`}
      data-name="Content"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 rounded-[12px]"
        onClick={handleClick}
        onMouseDown={(e) => {
          if (e.shiftKey) e.preventDefault();
        }}
      />

      {/* Selected Border Overlay */}
      {isSelected && (
        <div 
          aria-hidden="true" 
          className="absolute border-2 border-[#007BFF] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-20" 
        />
      )}
      
      {/* Image or Draft Preview - Universal Centering Rule */}
      <div 
        className="relative rounded-[12px] w-full h-[180px] bg-gray-50 flex items-center justify-center overflow-hidden pointer-events-none" 
        data-name="pt_daily_promo (10) 1"
      >
        {/* Syncing Overlay */}
        {banner.isSyncing && (
            <div className="absolute inset-0 z-30 bg-white/80 flex flex-col items-center justify-center backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 text-[#007BFF] animate-spin mb-2" />
                <span className="text-[12px] font-medium text-[#007BFF]">Updating...</span>
            </div>
        )}

        {hasSourcePreview && formData ? (
          <div className="flex h-full w-full items-center justify-center p-2">
            <ScaledBannerPreview
              formData={formData}
              previewUrl={previewUrl}
              className="h-full w-full shadow-sm"
              fit="contain"
            />
          </div>
        ) : (
          <>
            {isImageLoading ? (
                <Skeleton className="absolute inset-0 w-full h-full" />
            ) : (
                <ImageWithFallback
                    src={previewUrl || exampleImage}
                    alt={banner.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                />
            )}
          </>
        )}
      </div>
      
      {/* Text Content */}
      <div className="flex flex-col gap-[16px] w-full mt-auto" data-name="With Tag">
        <div className="content-stretch flex items-center justify-between gap-2 relative shrink-0 w-full z-30" data-name="Title + Avatars">
          <p className="font-bold leading-[24px] not-italic text-[#303135] text-[18px] flex-1 truncate">
            {banner.name}
          </p>
          {activeEditors && activeEditors.length > 0 && (
            <div className="flex-shrink-0">
              <AvatarStack users={activeEditors} size={20} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}