import { BannerFormData } from './types';
import { DraggableItem } from './utils/DraggableItem';
import type { DiffHighlights } from '../../../utils/diffUtils';
import { forwardRef, useState, useEffect, useRef, ForwardedRef } from 'react';
import { Skeleton } from '../ui/skeleton';
import { ENTRY_POINT_SPECS } from '../../../config/banner-layouts';
import exampleImage from 'figma:asset/605b8d8048aad59b933d3ed10d18a40a444d8fd6.png';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface BannerEntryPointProps {
    formData: BannerFormData; 
    lang: 'en' | 'id'; 
    label?: string;
    scale: number;
    position: { x: number, y: number };
    onMouseDown?: (e: React.MouseEvent) => void;
    previewUrl: string | null;
    isDraggable?: boolean;
    className?: string; 
    hideHeader?: boolean; 
    renderScale?: number; 
    thumbnailUrl?: string; 
    isImagePreloaded?: boolean; 
    isUnlocked?: boolean;
    fullSize?: boolean;
    hideBorder?: boolean;
    onElementMove?: (key: string, x: number, y: number, w?: number, h?: number, lang?: 'en' | 'id') => void;
    onContentChange?: (lang: 'en' | 'id', key: string, value: any) => void;
    highlights?: DiffHighlights;
    isShimmering?: boolean;
}

const ResizeHandle = ({ 
    onResizeStart, 
    onResize 
}: { 
    onResizeStart: () => void, 
    onResize: (delta: number) => void 
}) => {
    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const startY = e.clientY;
        onResizeStart();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientY - startY;
            onResize(delta);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'ns-resize';
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-6 h-3 bg-white border border-blue-500 rounded-full flex items-center justify-center cursor-ns-resize z-50 shadow-sm hover:scale-110 transition-transform"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-3 h-1 bg-blue-500 rounded-full" />
        </div>
    );
};

export const BannerEntryPoint = forwardRef((props: BannerEntryPointProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { 
    formData, 
    lang, 
    scale, 
    position, 
    onMouseDown, 
    previewUrl, 
    isDraggable = false,
    isUnlocked,
    fullSize = false,
    hideBorder = false,
    onContentChange,
    highlights,
    isImagePreloaded,
    thumbnailUrl,
    className,
    renderScale,
    hideHeader,
    label,
    onElementMove,
    isShimmering
  } = props;
  
  const content = formData.content[lang];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const visualDragRef = useRef<{ startX: number, startY: number, initialPos: { x: number, y: number } } | null>(null);
  const gradientDragRef = useRef<{ startX: number, startY: number, initialPos: { x: number, y: number }, width: number, height: number } | null>(null);

  // Clear selection when locking
  useEffect(() => {
    if (!isUnlocked) setSelectedId(null);
  }, [isUnlocked]);

  // Track previous URL to only reset position on ACTUAL image change, not just re-mount
  const prevUrlRef = useRef<string | null>(previewUrl);

  // Reset visual position ONLY when image source changes (fixes floating bug but preserves state on nav)
  useEffect(() => {
    // If we have a previous URL and the new one is different, it's a new image upload -> Reset
    // If prevUrlRef is null (first mount), we trust the saved formData position -> No Reset
    if (previewUrl && prevUrlRef.current && previewUrl !== prevUrlRef.current) {
        if (onElementMove) {
            onElementMove('keyVisualPosition', 0, 0);
        }
    }
    prevUrlRef.current = previewUrl;
  }, [previewUrl, onElementMove]);

  const startSizeRef = useRef(0);
  const handleFontResizeStart = (currentSize: number) => {
      startSizeRef.current = currentSize;
  };
  const handleFontResize = (delta: number, field: string, min = 8, max = 100) => {
      const newSize = Math.max(min, Math.min(max, startSizeRef.current + (delta * 0.5)));
      if (onContentChange) onContentChange(lang, field, Math.round(newSize));
  };

  const parseStyledText = (text: string) => {
      if (!text) return '';
      return text
          .replace(/<sb>/g, '<span class="font-semibold">')
          .replace(/<\/sb>/g, '</span>')
          .replace(/<b>/g, '<span class="font-bold">')
          .replace(/<\/b>/g, '</span>')
          .replace(/<eb>/g, '<span class="font-extrabold">')
          .replace(/<\/eb>/g, '</span>')
          .replace(/<r>/g, '<span class="font-normal">')
          .replace(/<\/r>/g, '</span>')
          .replace(/<i>/g, '<span style="font-style: italic; display: inline-block; transform: skewX(-10deg); transform-origin: 0 100%;">')
          .replace(/<\/i>/g, '</span>')
          .replace(/<c v="(.*?)">/g, '<span style="color: $1">')
          .replace(/<\/c>/g, '</span>')
          .replace(/\n/g, '<br/>');
  };

  const handleVisualMouseDown = (e: React.MouseEvent) => {
      if (!isUnlocked && !isDraggable) return;
      e.preventDefault();
      e.stopPropagation();
      
      const startX = e.clientX;
      const startY = e.clientY;
      const initialPos = formData.keyVisualPosition || { x: 0, y: 0 };
      
      visualDragRef.current = { startX, startY, initialPos };
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!visualDragRef.current || !onElementMove) return;
          
          const deltaX = moveEvent.clientX - visualDragRef.current.startX;
          const deltaY = moveEvent.clientY - visualDragRef.current.startY;
          
          const currentScale = renderScale || 1;
          const adjustedDeltaX = deltaX / currentScale;
          const adjustedDeltaY = deltaY / currentScale;

          const newX = visualDragRef.current.initialPos.x + adjustedDeltaX;
          const newY = visualDragRef.current.initialPos.y + adjustedDeltaY;
          
          onElementMove('keyVisualPosition', newX, newY, undefined, undefined, undefined);
      };
      
      const handleMouseUp = () => {
          visualDragRef.current = null;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleGradientPosMouseDown = (e: React.MouseEvent) => {
      if (!isUnlocked || !onElementMove) return;
      e.preventDefault();
      e.stopPropagation();
      
      const container = e.currentTarget.parentElement?.parentElement; // The main container wrapper
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const initialPos = formData.backgroundGradientPosition || { x: 50, y: 50 };
      
      gradientDragRef.current = { 
          startX, 
          startY, 
          initialPos,
          width: rect.width,
          height: rect.height
      };
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!gradientDragRef.current || !onElementMove) return;
          
          const deltaX = moveEvent.clientX - gradientDragRef.current.startX;
          const deltaY = moveEvent.clientY - gradientDragRef.current.startY;
          
          // Calculate percentage change
          const percentX = (deltaX / gradientDragRef.current.width) * 100;
          const percentY = (deltaY / gradientDragRef.current.height) * 100;
          
          const newX = Math.max(0, Math.min(100, gradientDragRef.current.initialPos.x + percentX));
          const newY = Math.max(0, Math.min(100, gradientDragRef.current.initialPos.y + percentY));
          
          onElementMove('backgroundGradientPosition', newX, newY, undefined, undefined, undefined);
      };
      
      const handleMouseUp = () => {
          gradientDragRef.current = null;
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
  };

  // Determine which spec to use based on bannerRatio
  let ratioKey: keyof typeof ENTRY_POINT_SPECS = 'mobile_5:2';
  if (formData.bannerRatio === 'Mobile (2:1)') ratioKey = 'mobile_2:1';
  if (formData.bannerRatio === 'Mobile (4:1)') ratioKey = 'mobile_4:1';
  if (formData.bannerRatio === 'Mobile (2:1 WhatsApp)') ratioKey = 'mobile_2:1_whatsapp';
  if (formData.bannerRatio === 'Desktop (5:1)') ratioKey = 'desktop_5:1';
  if (formData.bannerRatio === 'Desktop (8:1)') ratioKey = 'desktop_8:1';

  const specs = ENTRY_POINT_SPECS[ratioKey];
  const variant = formData.entryPointVariant || 'with_cta';
  const isSlim = ratioKey === 'mobile_4:1';
  const isWhatsApp = ratioKey === 'mobile_2:1_whatsapp';
  const isDesktop = ratioKey === 'desktop_5:1' || ratioKey === 'desktop_8:1';
  const isDesktopStrip = ratioKey === 'desktop_8:1';
  const showLogo = isWhatsApp && formData.showLogo && formData.selectedLogoUrl;
  
  // Logic for Bottom-Anchored Layout (Mobile 5:2 & 2:1 with CTA)
  const isBottomAnchored = variant === 'with_cta' && (ratioKey === 'mobile_5:2' || ratioKey === 'mobile_2:1');
  let bottomPadding = '0px';
  if (isBottomAnchored) {
      if (ratioKey === 'mobile_5:2') bottomPadding = '20px';
      if (ratioKey === 'mobile_2:1') bottomPadding = '30px';
  }
  // Desktop uses row layout: visual left, content right, vertically centered
  const isRowCentered = isDesktop;

  // Background
  const bgType = formData.backgroundType || 'color';
  const bgColor = formData.backgroundColor || '#0064D2'; // Default B500/B400 Blue
  
  // Gradient logic
  const renderGradient = () => {
      if (bgType !== 'gradient' || !formData.backgroundGradientStops) return null;
      const stops = [...formData.backgroundGradientStops].sort((a, b) => a.position - b.position);
      const gradientString = stops.map(s => `${s.color} ${s.position}%`).join(', ');
      const type = formData.backgroundGradientType || 'linear';
      const angle = formData.backgroundGradientAngle ?? 135;
      
      if (type === 'radial') {
          const posX = formData.backgroundGradientPosition?.x ?? 50;
          const posY = formData.backgroundGradientPosition?.y ?? 50;
          return `radial-gradient(circle at ${posX}% ${posY}%, ${gradientString})`;
      }
      return `linear-gradient(${angle}deg, ${gradientString})`;
  };

  const renderHtml = (text: string | undefined, className: string) => {
      if (!text) return null;
      return <span className={className} dangerouslySetInnerHTML={{ __html: text.replace(/\n/g, '<br/>') }} />;
  };

  const getHeadlinePlaceholder = () => {
      if (isWhatsApp) {
          return lang === 'en'
              ? 'Copy without \nheadline. Max 4 lines.'
              : 'Tulis copy promo.\nMaksimal 4 baris.';
      }
      if (isDesktop) {
          return lang === 'en'
              ? 'Promo copy here.\nMax 2 lines.'
              : 'Tulis copy promo.\nMaksimal 2 baris.';
      }
      if (variant === 'with_cta') {
          if (isSlim) {
              return lang === 'en'
                  ? 'Copy without \nheadline. Max 2 lines.'
                  : 'Tulis copy promo.\nMaksimal 2 baris.';
          }
          return lang === 'en'
              ? 'Copy without \nheadline.You can use \nmax 3 lines.'
              : 'Tulis copy promo.\nTanpa headlinea.\nMaksimal 3 baris.';
      }
      return lang === 'en'
          ? 'Headline 13-14px\nmax 2 lines'
          : 'Headline 13-14px\nMaksimal 2 baris';
  };

  const getSubHeadlinePlaceholder = () => {
       return lang === 'en' 
          ? 'Subtext goes here.\nYou can use maximum\n3 lines for subtext.' 
          : 'Tulis subteks di sini.\nKamu bisa gunakan\nmaksimal 3 baris.';
  };

  return (
    <div className={`flex flex-col gap-[8px] flex-shrink-0 ${className || ''}`} ref={ref}>
        {!hideHeader && (
            <div className="bg-[#f2f8ff] rounded-[4px] p-[10px]" style={{ width: specs.width * (renderScale || 1) }}>
                <div className="flex gap-[8px] items-center">
                    <div className="h-[16px] w-[24px] relative shrink-0">
                        <img src={lang === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/id.png"} alt={lang} className="w-full h-full object-cover rounded-[2px]" crossOrigin="anonymous" />
                    </div>
                    <p className="text-[16px] font-bold leading-[22px] text-[#71747d]">{label}</p>
                </div>
            </div>
        )}

        <div style={{ width: specs.width * (renderScale || 1), height: specs.height * (renderScale || 1), position: 'relative' }}>
            
            {/* Background Highlight (Outside Border) */}
            {highlights && highlights.entryPointBackgroundDiff && (
                <div 
                    className="absolute pointer-events-none z-0"
                    style={{
                        top: -6,
                        left: -6,
                        right: -6,
                        bottom: -6,
                        border: '2px dashed #FF9800', // Dotted/Dashed as requested ("putus-putus" implies dashed/dotted, but prompt says "highlight changes bordernya di luar") - user said "dotted underline" for text editor, but for background "bordernya di luar card preview aja". Usually highlights are solid or dashed. Let's stick to standard style but dashed to differentiate? Or just standard highlight style.
                        // User said: "border di luar card preview aja, dengan skala sedikit lebih besar"
                        // I will use the standard highlight color #FF9800.
                        borderRadius: '12px',
                        boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.1), 0 0 12px rgba(255, 152, 0, 0.4)',
                        animation: 'highlight-pulse 2s ease-in-out infinite'
                    }}
                />
            )}

            <div  
                className={`relative overflow-hidden isolate ${fullSize || hideBorder ? '' : 'shadow-sm border border-gray-100'}`} 
                style={{ 
                    width: specs.width,
                    height: specs.height,
                    borderRadius: '8px', 
                    background: bgType === 'gradient' ? renderGradient()! : bgColor, 
                    cursor: (isDraggable && !isUnlocked) ? 'grab' : 'default',
                    touchAction: 'none',
                    transform: `scale(${renderScale || 1})`,
                    transformOrigin: 'top left'
                }}
                onMouseDown={onMouseDown}
                onClick={() => isUnlocked && setSelectedId(null)}
            >
                {/* Radial Gradient Handle */}
                {isUnlocked && bgType === 'gradient' && formData.backgroundGradientType === 'radial' && (
                    <div
                        className="absolute w-6 h-6 bg-white border-2 border-blue-500 rounded-full shadow-md z-30 cursor-move flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform"
                        style={{
                            left: `${formData.backgroundGradientPosition?.x ?? 50}%`,
                            top: `${formData.backgroundGradientPosition?.y ?? 50}%`
                        }}
                        onMouseDown={handleGradientPosMouseDown}
                    >
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    </div>
                )}

                {/* Visual Layer (Z=0) */}
                <div 
                    className={`absolute z-0 ${(isUnlocked || isDraggable) ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'}`}
                    style={{
                        left: specs.elements.visual.x,
                        bottom: 0,
                        width: specs.elements.visual.w,
                        height: 'auto',
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'flex-start',
                        transform: `translate(${formData.keyVisualPosition?.x || 0}px, ${formData.keyVisualPosition?.y || 0}px)`,
                        zIndex: 0
                    }}
                    onMouseDown={handleVisualMouseDown}
                >
                    <img 
                        src={previewUrl || exampleImage} 
                        className={`object-contain ${!previewUrl ? 'opacity-80' : ''}`}
                        alt="Visual"
                        style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '100%',
                            transform: `rotate(${formData.keyVisualRotation || 0}deg) scale(${(formData.keyVisualFlipH ? -1 : 1) * (formData.keyVisualScale ? formData.keyVisualScale / 100 : 1)}, ${(formData.keyVisualFlipV ? -1 : 1) * (formData.keyVisualScale ? formData.keyVisualScale / 100 : 1)})`,
                            transformOrigin: 'center center',
                            position: 'relative'
                        }}
                        draggable={false}
                    />
                </div>

                {/* Content Layer (Z=20) */}
                <div
                    className={`absolute z-20 flex flex-col items-start ${isSlim || isDesktopStrip ? 'gap-[6px]' : (isBottomAnchored ? 'gap-[8px]' : (isDesktop ? 'gap-[10px]' : (variant === 'no_cta' ? 'gap-[4px]' : 'gap-[12px]')))}`}
                    style={{
                        right: isWhatsApp ? undefined : (isDesktop ? undefined : '12px'),
                        left: isWhatsApp ? specs.elements.contentArea.x : specs.elements.contentArea.x,
                        top: 0,
                        bottom: 0,
                        height: '100%',
                        width: specs.elements.contentArea.w,
                        pointerEvents: 'none',
                        textAlign: 'left',
                        justifyContent: isBottomAnchored ? 'flex-end' : (isRowCentered ? 'center' : (showLogo ? 'flex-start' : 'center')),
                        paddingTop: showLogo ? '12px' : (isDesktop ? '0px' : '0px'),
                        paddingBottom: bottomPadding,
                        paddingRight: isDesktop ? '16px' : '0px',
                    }}
                >
                    {/* Logo (WhatsApp Only) */}
                    {showLogo && (
                        <div 
                            className="relative w-full flex items-center justify-start pointer-events-auto"
                            style={{ 
                                height: `${30 * ((formData.logoScale ?? 60) / 100)}px`,
                                marginBottom: '0px'
                            }}
                        >
                            {/* Highlight for Logo */}
                            {highlights && highlights.entryPointLogoDiff && (
                                <div 
                                    className="absolute -inset-2 pointer-events-none"
                                    style={{
                                        border: '2px solid #FF9800',
                                        borderRadius: '4px',
                                        boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
                                        animation: 'highlight-pulse 2s ease-in-out infinite'
                                    }}
                                />
                            )}
                             <img 
                                src={formData.selectedLogoUrl!} 
                                alt="Entity Logo" 
                                className="h-full w-auto object-contain max-h-[30px]"
                                style={{
                                    transformOrigin: 'left center'
                                }}
                             />
                        </div>
                    )}

                    {/* Headline */}
                    <div 
                        className={`relative group pointer-events-auto w-full ${selectedId === 'headline' ? 'ring-1 ring-blue-500 rounded' : ''}`}
                        onClick={(e) => { e.stopPropagation(); if (isUnlocked) setSelectedId('headline'); }}
                    >
                        {/* Highlight for Headline (with_cta/WhatsApp = Copy, no_cta = Headline) */}
                        {highlights && (
                            ((variant === 'with_cta' || isWhatsApp) && highlights.entryPointCopyDiff) ||
                            (!isWhatsApp && variant === 'no_cta' && highlights.entryPointHeadlineDiff)
                        ) && (
                            <div 
                                className="absolute -inset-1 pointer-events-none"
                                style={{
                                    border: '2px solid #FF9800',
                                    borderRadius: '4px',
                                    boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
                                    animation: 'highlight-pulse 2s ease-in-out infinite'
                                }}
                            />
                        )}
                        <h3 
                            className={`font-banner font-bold text-left block leading-tight ${(isSlim || isDesktopStrip) ? 'line-clamp-2' : 'line-clamp-3'}`}
                            style={{ 
                                fontSize: `${content.headlineFontSize || specs.elements.headline.fontSize}px`,
                                lineHeight: isWhatsApp ? 1.3 : 1.1,
                                color: content.headlineColor || specs.elements.headline.color,
                            }}
                            dangerouslySetInnerHTML={{ __html: parseStyledText(content.headline || getHeadlinePlaceholder()) }}
                        />
                        {isUnlocked && selectedId === 'headline' && (
                            <ResizeHandle 
                                onResizeStart={() => handleFontResizeStart(content.headlineFontSize || specs.elements.headline.fontSize)} 
                                onResize={(d) => handleFontResize(d, 'headlineFontSize', 13, 24)} 
                            />
                        )}
                    </div>

                    {/* Variant Switch */}
                    {(!isWhatsApp) && (
                        variant === 'with_cta' ? (
                            // CTA Button
                            <div 
                                className={`relative group pointer-events-auto ${selectedId === 'cta' ? 'ring-1 ring-blue-500 rounded' : ''}`}
                                onClick={(e) => { e.stopPropagation(); if (isUnlocked) setSelectedId('cta'); }}
                            >
                                {/* Highlight for CTA */}
                                {highlights && highlights.entryPointCtaDiff && (
                                    <div 
                                        className="absolute -inset-1 pointer-events-none"
                                        style={{
                                            border: '2px solid #FF9800',
                                            borderRadius: specs.elements.ctaButton.radius,
                                            boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
                                            animation: 'highlight-pulse 2s ease-in-out infinite'
                                        }}
                                    />
                                )}
                                <div 
                                    className="flex items-center justify-center font-bold font-banner shadow-sm px-3"
                                    style={{
                                        width: specs.elements.ctaButton.w,
                                        height: specs.elements.ctaButton.h,
                                        borderRadius: specs.elements.ctaButton.radius,
                                        backgroundColor: specs.elements.ctaButton.bg,
                                        color: specs.elements.ctaButton.color,
                                        fontSize: `${specs.elements.ctaButton.fontSize}px`
                                    }}
                                >
                                    {content.ctaText || (lang === 'en' ? 'Book Now' : 'Pesan')}
                                </div>
                            </div>
                        ) : (
                            // Sub-headline
                            <div 
                                className={`relative group pointer-events-auto w-full ${selectedId === 'subHeadline' ? 'ring-1 ring-blue-500 rounded' : ''}`}
                                onClick={(e) => { e.stopPropagation(); if (isUnlocked) setSelectedId('subHeadline'); }}
                            >
                                {/* Highlight for Subtext */}
                                {highlights && highlights.entryPointSubtextDiff && (
                                    <div 
                                        className="absolute -inset-1 pointer-events-none"
                                        style={{
                                            border: '2px solid #FF9800',
                                            borderRadius: '4px',
                                            boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
                                            animation: 'highlight-pulse 2s ease-in-out infinite'
                                        }}
                                    />
                                )}
                                <p 
                                    className="font-banner font-medium opacity-90 text-left block"
                                    style={{ 
                                        fontSize: specs.elements.subHeadline.fontSize,
                                        lineHeight: specs.elements.subHeadline.lineHeight,
                                        color: content.subHeadlineColor || specs.elements.subHeadline.color,
                                    }}
                                    dangerouslySetInnerHTML={{ __html: parseStyledText(content.subHeadline || getSubHeadlinePlaceholder()) }}
                                />
                            </div>
                        )
                    )}
                </div>

                {/* Shimmer Overlay for Translation Loading */}
                {isShimmering && (
                    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[8px]">
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                        <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            style={{
                                transform: 'skewX(-20deg) translateX(-150%)',
                                animation: 'shimmer 1.5s infinite linear'
                            }} 
                        />
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes shimmer {
                                0% { transform: skewX(-20deg) translateX(-150%); }
                                100% { transform: skewX(-20deg) translateX(150%); }
                            }
                        `}} />
                    </div>
                )}

                {/* Highlight Changes Overlays */}
                {highlights && (
                    <div className="absolute inset-0 z-40 pointer-events-none">
                        {/* Visual Highlight (Background + Key Visual) */}
                        {highlights.entryPointVisualDiff && (
                            <div 
                                className="absolute"
                                style={{
                                    left: specs.elements.visual.x,
                                    top: 0,
                                    bottom: 0,
                                    width: specs.elements.visual.w,
                                    border: '2px solid #FF9800',
                                    borderRadius: '4px',
                                    boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
                                    animation: 'highlight-pulse 2s ease-in-out infinite'
                                }}
                            />
                        )}

                        {/* Pulse Animation */}
                        <style dangerouslySetInnerHTML={{__html: `
                            @keyframes highlight-pulse {
                                0%, 100% { 
                                    opacity: 1;
                                    box-shadow: inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4);
                                }
                                50% { 
                                    opacity: 0.7;
                                    box-shadow: inset 0 0 0 2px rgba(255, 152, 0, 0.3), 0 0 20px rgba(255, 152, 0, 0.6);
                                }
                            }
                        `}} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
});

BannerEntryPoint.displayName = 'BannerEntryPoint';