import { BannerFormData } from './types';
import { FileText, CheckCircle } from 'lucide-react';
import TdsIcOvalPlus from '../../../imports/TdsIcOvalPlus-2016-512';
import exampleImage from 'figma:asset/c593b610d3877a5faf067379a77363d554217a35.png';
import { forwardRef, useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import type { DiffHighlights } from '../../../utils/diffUtils';
import { BANNER_SPECS } from '../../../config/banner-layouts';

interface BannerLegacyProps {
    formData: BannerFormData; 
    lang: 'en' | 'id'; 
    label?: string;
    scale: number;
    position: { x: number, y: number };
    onMouseDown?: (e: React.MouseEvent) => void;
    previewUrl: string | null;
    isDraggable?: boolean;
    className?: string; // Allow override
    hideHeader?: boolean; // Option to hide flag/label
    renderScale?: number; // Zoom scale
    thumbnailUrl?: string; // Low-res thumbnail for progressive loading
    isImagePreloaded?: boolean; // External loading state to prevent flickering
    highlights?: DiffHighlights; // Visual diff highlighting
    isUnlocked?: boolean;
    onElementMove?: (key: string, x: number, y: number) => void;
    hideBorder?: boolean;
}

export const BannerLegacy = forwardRef<HTMLDivElement, BannerLegacyProps>(({ 
    formData, 
    lang, 
    label, 
    scale, 
    position, 
    onMouseDown, 
    previewUrl, 
    isDraggable = false,
    className,
    hideHeader = false,
    renderScale = 1,
    thumbnailUrl,
    isImagePreloaded,
    highlights,
    isUnlocked,
    onElementMove,
    isShimmering
}, ref) => {
  const content = formData.content[lang];
  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  
  const isTwoHeadlines = formData.headlineType === '2 Headlines';
  const defaultHeadlineSize = isTwoHeadlines ? 26 : 40;

  const defaults = {
      en: {
          headline: 'Headline Goes Here',
          subHeadline: 'Sub-headline Goes Here',
          secondHeadline: 'Second Headline Goes Here',
          labelDiscountText: 'Add Label Discount',
          termsText: '*T&C apply',
      },
      id: {
          headline: 'Tulis Headline Disini',
          subHeadline: 'Tulis Sub-headline Disini',
          secondHeadline: 'Tulis Headline Kedua Disini',
          labelDiscountText: 'Tambahkan Label Diskon',
          termsText: '*S&K berlaku',
      }
  };

  const currentDefaults = defaults[lang];
  const headlineText = content.headline || currentDefaults.headline;
  const subHeadlineText = content.subHeadline || currentDefaults.subHeadline;
  const secondHeadlineText = content.secondHeadline || currentDefaults.secondHeadline;
  
  // Use explicit check for Discount Amount to show placeholder '50'
  const discountAmountText = content.discountAmount || '50';
  
  // Label Discount
  const labelDiscountText = content.labelDiscountText || currentDefaults.labelDiscountText;
  
  // Terms
  const termsText = content.termsText || currentDefaults.termsText;

  // --- Promo Banner Logic ---
  const ratioClasses = {
    'Landscape (2:1)': 'aspect-[2/1]',
    'Landscape (16:9)': 'aspect-[16/9]',
    'Square (1:1)': 'aspect-[1/1]',
    'Portrait (3:4)': 'aspect-[3/4]',
  };
  const currentRatioClass = formData.bannerRatio === 'Landscape (2:1)' ? 'aspect-[2/1]' : (formData.bannerRatio ? ratioClasses[formData.bannerRatio as keyof typeof ratioClasses] : 'aspect-[2/1]');

  const bgGradients: Record<string, string> = {
    'Hotel': 'linear-gradient(135deg, #FF6B6B 0%, #EE5D88 100%)',
    'Transport': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'ToDos': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    'Event': 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  };
  
  const secondLineText = isTwoHeadlines ? secondHeadlineText : subHeadlineText;
  
  const currentDisplayImage = previewUrl || exampleImage;
  const isPlaceholder = !previewUrl;

  // Image Positioning Logic
  const imageStyle: React.CSSProperties = isPlaceholder ? {
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate3d(-50%, -50%, 0)', // No scaling for placeholder
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      pointerEvents: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
  } : {
      position: 'absolute',
      left: `${position.x}%`,
      top: `${position.y}%`,
      transform: `translate3d(-50%, -50%, 0) scale(${(formData.keyVisualFlipH ? -1 : 1) * (scale / 100)}, ${(formData.keyVisualFlipV ? -1 : 1) * (scale / 100)})`,
      width: 'auto',
      minWidth: '100%',
      height: 'auto',
      maxWidth: 'none',
      pointerEvents: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
  };
  
  const [internalImageLoaded, setInternalImageLoaded] = useState(false);
  const isImageLoaded = isImagePreloaded !== undefined ? isImagePreloaded : internalImageLoaded;

  useEffect(() => {
      if (isImagePreloaded === undefined) {
          setInternalImageLoaded(false);
      }
  }, [currentDisplayImage, isImagePreloaded]);
  
  const containerBackground = (bgGradients[formData.verticalCategory] || '#e9ebef');

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
  };

  const overlayColor = formData.overlayColor || '#000000';
  const rgb = hexToRgb(overlayColor);
  const opacityStart = (formData.gradientOpacity ?? 100) / 100;
  const stopPos = formData.overlayGradientStop ?? 10;

  const gradientStyle = {
      background: `linear-gradient(90deg, rgba(${rgb},${opacityStart}) 0%, rgba(${rgb},${opacityStart}) ${stopPos}%, rgba(${rgb},0) 100%)`,
      transform: 'translateZ(0)', // Fix Safari stacking context
  };

  const renderHtml = (text: string | undefined, className: string, style?: React.CSSProperties) => {
    if (!text) return null;
    const htmlContent = text
        .replace(/\n/g, '<br/>')
        .replace(/<sb>/g, '<span style="font-weight: 600">')
        .replace(/<\/sb>/g, '</span>')
        .replace(/<b>/g, '<span style="font-weight: 700">')
        .replace(/<\/b>/g, '</span>')
        .replace(/<eb>/g, '<span style="font-weight: 800">')
        .replace(/<\/eb>/g, '</span>')
        .replace(/<r>/g, '<span style="font-weight: 400">')
        .replace(/<\/r>/g, '</span>')
        .replace(/<i>/g, '<span style="font-style: italic; display: inline-block; transform: skewX(-10deg); transform-origin: 0 100%;">')
        .replace(/<\/i>/g, '</span>')
        .replace(/<c v="(.*?)">/g, '<span style="color: $1">')
        .replace(/<\/c>/g, '</span>');
    return <span className={`${className}`} style={style} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  const HighlightWrapper = ({ children, active, label }: { children: React.ReactNode; active?: boolean; label?: string }) => {
    if (!active) return <>{children}</>;
    
    return (
      <div className="relative group inline-block">
        <div 
          className="absolute rounded-[8px] pointer-events-none"
          style={{ 
            inset: '-4px', 
            zIndex: 9999,
            border: '2px solid #FF9800',
            boxShadow: 'inset 0 0 0 2px rgba(255, 152, 0, 0.2), 0 0 12px rgba(255, 152, 0, 0.4)',
            animation: 'highlight-pulse 2s ease-in-out infinite'
          }}
        />
        {label && (
          <div 
            className="absolute top-0 right-0 bg-[#FF9800] text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-md rounded-tr-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap" 
            style={{ transform: 'translate(4px, -4px)', zIndex: 9999 }}
          >
            {label}
          </div>
        )}
        <div className="relative inline-block">{children}</div>
      </div>
    );
  };

  const renderLeftColumn = (fontScale = 1, forPortrait = false) => {
    if (content.showPrefix === false) return null;
    const text = content.mainBenefitPrefix;
    const showRp = content.discountType === 'IDR';
    if (!text) return null;

    const lowerText = text.toLowerCase().trim();
    const lines = text.split('\n');
    const shouldAlignBottom = lines.length > 1;
    let contentNode;

    const color = content.prefixColor || 'white';
    const pt = content.prefixType;
    const fs = Math.round(18 * fontScale);
    const lh = Math.round(22 * fontScale);
    const tyUp = Math.round(6 * fontScale);

    if (lowerText === 'discount' || lowerText === 'diskon') {
        contentNode = (
            <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px` }}>{text}</span>
        );
    } else if (lowerText === 'discount up to') {
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Discount</span>
                <span className="font-normal font-banner" style={{ color: 'white', fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block' }}>up to</span>
            </>
        );
    } else if (lowerText === 'diskon hingga') {
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Diskon</span>
                <span className="font-normal font-banner" style={{ color: 'white', fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block' }}>hingga</span>
            </>
        );
    } else if (lowerText === 'up to' || lowerText === 'hingga') {
        contentNode = (
            <span className="font-normal font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px` }}>{text}</span>
        );
    } else if (lowerText === 'start from') {
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Start</span>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block' }}>from</span>
            </>
        );
    } else if (lowerText === 'mulai dari') {
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Mulai</span>
                <span className="font-bold font-banner" style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block' }}>dari</span>
            </>
        );
    } else if (pt === 'instant_cashback') {
        const isID = lang === 'id';
        const fontStyle: React.CSSProperties['fontStyle'] = isID ? 'italic' : 'normal';
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontStyle, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Instant</span>
                <span className="font-bold font-banner" style={{ color, fontStyle, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: 'block' }}>cashback</span>
            </>
        );
    } else if (pt === 'instant_cashback_upto') {
        const isID = lang === 'id';
        const fontStyle: React.CSSProperties['fontStyle'] = isID ? 'italic' : 'normal';
        const thirdLine = isID ? 'hingga' : 'up to';
        contentNode = (
            <>
                <span className="font-bold font-banner" style={{ color, fontStyle, fontSize: `${fs}px`, lineHeight: `${fs}px`, display: 'block', transform: `translateY(${tyUp}px)` }}>Instant</span>
                <span className="font-bold font-banner" style={{ color, fontStyle, fontSize: `${fs}px`, lineHeight: `${fs}px`, display: 'block' }}>cashback</span>
                <span className="font-normal font-banner" style={{ color: 'white', fontStyle: 'normal', fontSize: `${fs}px`, lineHeight: `${fs}px`, display: 'block' }}>{thirdLine}</span>
            </>
        );
    } else {
        const isCustom = content.prefixType === 'custom';
        const customSize = (content.prefixFontSize || 20) * fontScale;
        const isMultiline = lines.length >= 4;

        contentNode = (
            <>{lines.map((line, idx) => (
                <span
                    key={idx}
                    className="font-banner text-left whitespace-nowrap"
                    style={{
                        color: content.prefixColor || 'white',
                        fontSize: isCustom ? `${customSize}px` : `${fs}px`,
                        lineHeight: isCustom ? (typeof content.prefixLineHeight === 'number' ? content.prefixLineHeight / 100 : '1.2') : `${lh}px`,
                    }}
                    dangerouslySetInnerHTML={{ __html: line.replace(/<sb>/g, '<span style="font-weight: 600">').replace(/<\/sb>/g, '</span>').replace(/<b>/g, '<span style="font-weight: 700">').replace(/<\/b>/g, '</span>').replace(/<eb>/g, '<span style="font-weight: 800">').replace(/<\/eb>/g, '</span>').replace(/<r>/g, '<span style="font-weight: 400">').replace(/<\/r>/g, '</span>').replace(/<c v="(.*?)">/g, '<span style="color: $1">').replace(/<\/c>/g, '</span>') }}
                />
            ))}</>
        );

        const rpFs = Math.round(15 * fontScale);
        const rpLh = Math.round(16 * fontScale);
        if (isMultiline && showRp) {
            return (
                <div className="flex items-start gap-[4px] h-auto self-stretch text-left">
                    <div className="flex flex-col items-start self-end translate-y-[2px] mt-[0px] mr-[0px] mb-[6px] ml-[0px]">{contentNode}</div>
                    <span className="font-bold drop-shadow-md font-banner" style={{ color: content.prefixColor || 'white', fontSize: `${rpFs}px`, lineHeight: `${rpLh}px`, marginTop: `${Math.round(6 * fontScale)}px`, marginLeft: `${Math.round(6 * fontScale)}px` }}>Rp</span>
                </div>
            );
        }
    }

    if (forPortrait) {
      // Rp is rendered next to the number (value group), so prefix column holds text only
      return (
        <div className="flex flex-col items-end self-stretch text-left">
          <div className="flex-1 flex flex-col items-end justify-center">
            <div className="flex flex-col items-start">{contentNode}</div>
          </div>
        </div>
      );
    }

    return (
        <div className="flex flex-col justify-end h-auto self-stretch items-end text-left">
            <div className={`flex flex-col items-start mt-[0px] mr-[0px] mb-[6px] ml-[0px] ${shouldAlignBottom ? 'self-end' : ''}`} style={{ transform: `translateY(${Math.round(2 * fontScale)}px)` }}>{contentNode}</div>
        </div>
    );
  };

  const isPortrait = formData.bannerRatio === 'Portrait (3:4)';

  if (!isPromoBanner) {
      return (
        <div className={`flex flex-col gap-[8px] w-[600px] flex-shrink-0 opacity-50 ${className || ''}`} style={{ transform: `scale(${renderScale})`, transformOrigin: 'top left' }} ref={ref}>
             <div className="bg-[#f2f8ff] rounded-[4px] w-full p-[10px]"><p className="text-[14px]">Legacy Preview Disabled</p></div>
             <div className="h-[200px] bg-gray-100 rounded flex items-center justify-center">Select Promo Banner</div>
        </div>
      )
  }

  if (isPortrait) {
    return (
      <div className={`flex flex-col gap-[8px] flex-shrink-0 ${className || ''}`} style={{ width: '360px', transform: `scale(${renderScale || 1})`, transformOrigin: 'top left' }} ref={ref}>
        {!hideHeader && (
          <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
            <div className="flex gap-[8px] items-center">
              <div className="h-[16px] w-[24px] relative shrink-0">
                <img src={lang === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/id.png"} alt={lang} className="w-full h-full object-cover rounded-[2px]" crossOrigin="anonymous" />
              </div>
              <p className="text-[16px] font-bold leading-[22px] text-[#71747d]">{label}</p>
            </div>
          </div>
        )}

        {/* 360×480 outer wrapper; 720×960 canvas at scale(0.5) = native 720×960 quality */}
        <div
          className="relative"
          style={{ width: '360px', height: '480px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', cursor: isDraggable ? 'grab' : 'default' }}
          onMouseDown={onMouseDown}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, width: '720px', height: '960px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
          <div className="relative w-full h-full isolate" style={{ background: containerBackground }}>
            {/* Background image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {thumbnailUrl && !isImageLoaded && (
                <img src={thumbnailUrl} alt="Loading preview" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(20px)', transform: 'scale(1.1)', willChange: 'filter, transform' }} draggable={false} crossOrigin="anonymous" />
              )}
              {!thumbnailUrl && !isImageLoaded && (
                <Skeleton className="w-full h-full absolute inset-0 z-0" />
              )}
              <img
                src={currentDisplayImage}
                alt="Background"
                style={{ ...imageStyle, opacity: isImageLoaded ? 1 : 0, transition: 'opacity 500ms ease-in-out', willChange: 'opacity' }}
                draggable={false}
                crossOrigin="anonymous"
                onLoad={() => setInternalImageLoaded(true)}
              />
            </div>

            {/* Gradient overlay — same controls as 2:1, direction bottom-to-top */}
            <div className="absolute bottom-0 left-0 right-0 h-[640px] z-10 pointer-events-none" style={{ background: `linear-gradient(to top, rgba(${rgb},${opacityStart}) 0%, rgba(${rgb},${opacityStart}) ${stopPos}%, rgba(${rgb},0) 100%)`, transform: 'translateZ(0)' }} />

            {/* Partner logo */}
            {formData.showPartnerLogo && (
              <div className="absolute right-0 z-20 pointer-events-none" style={{ top: `${formData.partnerLogoY ?? 20}px`, transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-[20px] px-[24px] py-[8px] bg-white shadow-sm" style={{ borderRadius: '40px 0 0 40px', transform: `translateZ(0) scale(${formData.partnerLogoScale ?? 1})`, transformOrigin: 'top right' }}>
                  {formData.partnerLogos.slice(0, 3).map((slot, idx) => {
                    const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                    const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                    return (
                      <div key={slot.id || idx} className="h-[40px] min-w-[80px] max-w-[160px] flex items-center justify-center">
                        <img src={imgSrc} alt={slot.logo || "Partner"} className="h-full w-auto object-contain" crossOrigin="anonymous" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Campaign logo */}
            {formData.showCampaignLogo && (
              <div className="absolute z-20 pointer-events-none" style={{ top: `${(formData.campaignLogoY ?? 16) * 1.2}px`, left: `${(formData.campaignLogoX ?? 16) * 1.2}px`, transformOrigin: 'top left' }}>
                <div className="w-[86px] h-[43px] flex items-center justify-center" style={{ transform: `scale(${formData.campaignLogoScale ?? 1})`, transformOrigin: 'top left' }}>
                  <img src={formData.campaignLogo || exampleImage} alt="Campaign Logo" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Portrait content — auto-layout column, 20px from canvas bottom, 24px gaps */}
            {(() => {
              const cs = (formData.portraitContentScale ?? 120) / 100;
              return (
                <div
                  className="absolute left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-[48px]"
                  style={{ bottom: '40px', gap: '0px' }}
                >
                  {/* Main content block — headline + benefit + labels, all scaled by cs */}
                  <div className="flex flex-col items-center w-full" style={{ gap: `${4 * cs}px` }}>
                    {/* Headline */}
                    <h3
                      className={`drop-shadow-md font-banner leading-[1.1] text-center w-full ${isTwoHeadlines ? 'font-bold line-clamp-2 break-words' : ''}`}
                      style={{ fontSize: `${(content.headlineFontSize || defaultHeadlineSize) * 2 * cs}px`, color: content.headlineColor || '#FEDD00' }}
                    >
                      {renderHtml(headlineText, "")}
                    </h3>

                    {/* Sub-headline / 2nd headline */}
                    {secondLineText && formData.headlineType !== '1 Headline' && (
                      <h3
                        className={`drop-shadow-md font-banner text-center w-full ${isTwoHeadlines ? 'leading-[1.1] font-bold line-clamp-2 break-words' : ''}`}
                        style={{ fontSize: isTwoHeadlines ? `${(content.headlineFontSize || defaultHeadlineSize) * 2 * cs}px` : `${(content.subHeadlineFontSize || 18) * 2 * cs}px`, color: content.subHeadlineColor || 'white' }}
                      >
                        {renderHtml(secondLineText, "")}
                      </h3>
                    )}

                    {/* Nudge / benefit row */}
                    {!isTwoHeadlines && formData.discountEnabled !== false && (
                      <div className={`flex ${content.mainBenefitPrefix && content.showPrefix !== false ? 'items-center' : 'items-baseline'} justify-center gap-[8px]`} style={{ marginTop: `${16 * cs}px` }}>
                        {renderLeftColumn(2 * cs, true)}
                        <div className="relative flex items-end">
                          {content.discountType === 'IDR' && !(content.prefixType === 'custom' && (content.mainBenefitPrefix || '').split('\n').length >= 4 && content.showPrefix !== false) && (
                            <span className="font-bold drop-shadow-md font-banner self-start mr-[2px] ml-[4px]" style={{ fontSize: `${30 * cs}px`, color: content.discountAmountColor || 'white', marginTop: `${-20 * cs}px` }}>Rp</span>
                          )}
                          <span className="font-extrabold drop-shadow-md font-banner ml-[4px]" style={{ fontSize: `${(content.discountAmountFontSize || 80) * 2 * cs}px`, lineHeight: `${132 * cs}px`, letterSpacing: `${-8 * cs}px`, color: content.discountAmountColor || 'white' }}>
                            {discountAmountText}
                          </span>
                          {content.unit && (
                            content.unitDisplayType === 'icon' ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', flexShrink: 0, zIndex: 10, width: `${(content.unit === 'mio' ? 60 : 48) * cs}px`, height: `${(content.unit === 'mio' ? 60 : 48) * cs}px`, marginBottom: `${18 * cs}px`, backgroundColor: content.unitIconColor || 'white', position: 'relative', bottom: '0px', left: `${-12 * cs}px` }}>
                                <span className="font-bold leading-none" style={{ fontSize: `${30 * cs}px`, color: content.unitColor || '#0064D2' }}>{content.unit}</span>
                              </div>
                            ) : (
                              <span className="font-bold drop-shadow-md font-banner" style={{ fontSize: `${48 * cs}px`, marginLeft: `${4 * cs}px`, marginBottom: `${8 * cs}px`, color: content.unitColor || 'white' }}>{content.unit}</span>
                            )
                          )}
                          {content.hasSecondDiscount && (
                            <>
                              <span className="font-bold drop-shadow-md font-banner" style={{ fontSize: `${96 * cs}px`, marginBottom: `${16 * cs}px`, marginRight: `${6 * cs}px`, marginLeft: content.unitDisplayType === 'icon' ? `${2 * cs}px` : `${8 * cs}px`, color: content.discountAmountColor || 'white' }}>+</span>
                              {content.secondDiscountType === 'IDR' && (
                                <span className="font-bold drop-shadow-md font-banner self-start" style={{ fontSize: `${30 * cs}px`, marginRight: `${2 * cs}px`, marginLeft: `${4 * cs}px`, marginTop: `${8 * cs}px`, color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>Rp</span>
                              )}
                              <span className="font-extrabold drop-shadow-md font-banner" style={{ fontSize: `${160 * cs}px`, lineHeight: `${132 * cs}px`, letterSpacing: `${-8 * cs}px`, color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>
                                {content.secondDiscountAmount || '0'}
                              </span>
                              {content.secondDiscountUnit && (
                                content.secondUnitDisplayType === 'icon' ? (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', flexShrink: 0, zIndex: 10, width: `${(content.secondDiscountUnit === 'mio' ? 60 : 48) * cs}px`, height: `${(content.secondDiscountUnit === 'mio' ? 60 : 48) * cs}px`, marginBottom: `${18 * cs}px`, backgroundColor: content.secondUnitIconColor || 'white', position: 'relative', left: `${-16 * cs}px` }}>
                                    <span className="font-bold leading-none" style={{ fontSize: `${30 * cs}px`, color: content.secondUnitColor || '#0064D2' }}>{content.secondDiscountUnit}</span>
                                  </div>
                                ) : (
                                  <span className="font-bold drop-shadow-md font-banner" style={{ fontSize: `${48 * cs}px`, marginLeft: `${4 * cs}px`, marginBottom: `${4 * cs}px`, color: content.secondUnitColor || content.unitColor || 'white' }}>{content.secondDiscountUnit}</span>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Label discount */}
                    {content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${12 * cs}px`, marginTop: isTwoHeadlines ? `${28 * cs}px` : `${4 * cs}px` }}>
                        {content.labelDiscountType === 'With icon' && (
                          <div style={{ width: `${32 * cs}px`, height: `${32 * cs}px`, '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
                        )}
                        <div className="font-bold drop-shadow-md font-banner text-center" style={{ fontSize: `${28 * cs}px`, color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "")}</div>
                      </div>
                    )}

                    {/* Additional label */}
                    {content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
                      <div className="font-bold tracking-wider font-banner shadow-sm" style={{ fontSize: `${24 * cs}px`, borderRadius: `${20 * cs}px`, padding: `${8 * cs}px ${24 * cs}px`, marginTop: `${16 * cs}px`, backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00', color: content.additionalLabelTextColor || '#0064D2' }}>
                        {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                      </div>
                    )}
                  </div>

                  {/* CTA Button — fixed size (not affected by content scale) */}
                  {formData.showPortraitCta && (() => {
                    const widthMode = formData.portraitCtaWidthMode ?? 'hugged';
                    const fixedW = formData.portraitCtaFixedWidth ?? 480;
                    return (
                      <div
                        className="flex items-center justify-center font-bold font-banner whitespace-nowrap"
                        style={{
                          backgroundColor: formData.ctaButtonColor || '#007BFF',
                          color: formData.ctaTextColor || '#FFFFFF',
                          fontSize: '32px',
                          borderRadius: '16px',
                          padding: '24px 48px',
                          marginTop: '32px',
                          ...(widthMode === 'fixed' ? { width: `${fixedW}px` } : {}),
                        }}
                      >
                        {content.ctaText || (lang === 'en' ? 'Book Now' : 'Pesan Sekarang')}
                      </div>
                    );
                  })()}

                  {/* T&C — fixed default size, not cs-scaled */}
                  {content.termsAndCondition && (
                    <div className="text-center w-full" style={{ marginTop: formData.showPortraitCta ? '24px' : '32px' }}>
                      <div className="font-banner leading-[1.4]" style={{ fontSize: `${(content.termsFontSize || 11) * 2}px`, color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Shimmer Overlay */}
            {isShimmering && (
              <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" style={{ transform: 'skewX(-20deg) translateX(-150%)', animation: 'shimmer 1.5s infinite linear' }} />
                <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 0% { transform: skewX(-20deg) translateX(-150%); } 100% { transform: skewX(-20deg) translateX(150%); } }`}} />
              </div>
            )}
          </div>{/* end inner 720×960 div */}
          </div>{/* end scale(0.5) div */}
        </div>{/* end 360×480 outer wrapper */}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[8px] w-[600px] flex-shrink-0 ${className || ''}`} style={{ transform: `scale(${renderScale})`, transformOrigin: 'top left' }} ref={ref}>
      {!hideHeader && (
      <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
        <div className="flex gap-[8px] items-center">
           <div className="h-[16px] w-[24px] relative shrink-0">
             <img src={lang === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/id.png"} alt={lang} className="w-full h-full object-cover rounded-[2px]" crossOrigin="anonymous" />
           </div>
           <p className="text-[16px] font-bold leading-[22px] text-[#71747d]">{label}</p>
        </div>
      </div>
      )}

      <div className="relative w-full">
        {/* Background Highlight (Outside Border) */}
        {highlights && highlights.backgroundDiff && (
            <div 
                className="absolute pointer-events-none z-0"
                style={{
                    top: -6,
                    left: -6,
                    right: -6,
                    bottom: -6,
                    border: '2px dashed #FF9800',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.1), 0 0 12px rgba(255, 152, 0, 0.4)',
                    animation: 'highlight-pulse 2s ease-in-out infinite'
                }}
            />
        )}
        <div  
            className={`w-full relative rounded-[12px] overflow-hidden ${currentRatioClass} isolate`} 
            style={{ 
                background: containerBackground, 
                cursor: isDraggable ? 'grab' : 'default',
                touchAction: 'none'
            }}
            onMouseDown={onMouseDown}
        >
         {/* Background Image with Progressive Blur-Up */}
         <div className="absolute inset-0 z-0">
             {thumbnailUrl && !isImageLoaded && (
                 <img 
                    src={thumbnailUrl} 
                    alt="Loading preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ 
                        filter: 'blur(20px)', 
                        transform: 'scale(1.1)',
                        willChange: 'filter, transform'
                    }} 
                    draggable={false} 
                    crossOrigin="anonymous"
                 />
             )}
             
             {!thumbnailUrl && !isImageLoaded && (
                 <Skeleton className="w-full h-full absolute inset-0 z-0" />
             )}
             
             <img 
                src={currentDisplayImage} 
                alt="Background" 
                style={{ 
                    ...imageStyle, 
                    opacity: isImageLoaded ? 1 : 0, 
                    transition: 'opacity 500ms ease-in-out',
                    willChange: 'opacity'
                }} 
                draggable={false} 
                crossOrigin="anonymous"
                onLoad={() => setInternalImageLoaded(true)}
             />
         </div>
         
         <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyle} />

         <div className="absolute left-0 top-0 h-full w-[55%] z-20 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
             <div className="h-full w-full px-[20px] py-[15px] flex flex-col justify-center items-start">
                 <div className={`flex flex-col items-start gap-[2px] w-full mr-[0px] mb-[0px] ml-[0px] ${formData.headlineType === '1 Headline' ? (formData.discountEnabled === false && content.showPrefix === false ? 'mt-[0px]' : content.hasSecondDiscount ? 'mt-[26px]' : 'mt-[32px]') : formData.headlineType === 'With Sub-Headline' ? (formData.discountEnabled === false && content.showPrefix === false ? 'mt-[0px]' : 'mt-[12px]') : 'mt-[12px]'}`}>
                     <HighlightWrapper active={highlights?.headlineDiff} label="Headline Changed">
                       <>
                         {headlineText && (
                             <h3 className={`drop-shadow-md font-banner leading-[1.1] mb-[0px] text-left ${formData.headlineType !== '1 Headline' ? 'mt-[4px]' : 'mt-[-4px]'} ${isTwoHeadlines ? 'font-bold line-clamp-2 w-full break-words' : ''}`} style={{ fontSize: `${content.headlineFontSize || defaultHeadlineSize}px`, color: content.headlineColor || 'white' }}>
                                 {renderHtml(headlineText, "")} 
                             </h3>
                         )}
                         {secondLineText && formData.headlineType !== '1 Headline' && (
                            <h3 className={`drop-shadow-md font-banner text-left ${isTwoHeadlines ? 'leading-[1.1] -mt-[4px] font-bold line-clamp-2 w-full break-words' : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[2px]' : '-mt-[4px]')}`} style={{ fontSize: isTwoHeadlines ? `${content.headlineFontSize || defaultHeadlineSize}px` : `${content.subHeadlineFontSize || 18}px`, color: content.subHeadlineColor || 'white' }}>
                                {renderHtml(secondLineText, "")}
                            </h3>
                         )}
                       </>
                     </HighlightWrapper>
                     {!isTwoHeadlines && (
                     <HighlightWrapper active={highlights?.nudgeDiff} label="Nudge Changed">
                       <div className={`flex ${content.mainBenefitPrefix && content.showPrefix !== false ? 'items-stretch' : 'items-baseline'} gap-[4px] ${formData.headlineType === '1 Headline' ? (content.hasSecondDiscount ? 'mt-[-4px]' : 'mt-[8px]') : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[10px]' : 'mt-[-6px]')}`}>
                         {renderLeftColumn()}
                         {formData.discountEnabled !== false && (
                         <div className="relative flex items-end">
                             {content.discountType === 'IDR' && !(content.prefixType === 'custom' && (content.mainBenefitPrefix || '').split('\n').length >= 4 && content.showPrefix !== false) && (
                                <span className={`text-[15px] font-bold drop-shadow-md font-banner self-start mr-[2px] ml-[4px] ${formData.headlineType === '1 Headline' ? (content.hasSecondDiscount ? 'mt-[-4px]' : 'mt-[-10px]') : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[0px]' : 'mt-[14px]')}`} style={{ color: content.discountAmountColor || 'white' }}>Rp</span>
                             )}
                             <span className={`text-[80px] font-extrabold tracking-[-4px] drop-shadow-md font-banner leading-[66px] ml-[4px] mt-[0px]`} style={{ color: content.discountAmountColor || 'white' }}>{discountAmountText}</span>
                             {content.unit && (
                                 content.unitDisplayType === 'icon' ? (
                                     <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 mt-[0px] mr-[0px] ml-[0px] ${content.unit === 'mio' ? (content.hasSecondDiscount ? 'w-[30px] h-[30px] mb-[9px] translate-x-[-4px]' : 'w-[30px] h-[30px] mb-[9px] ' + (formData.headlineType === '1 Headline' || formData.headlineType === 'With Sub-Headline' ? 'translate-x-[-2px]' : 'translate-x-[4px]')) : 'w-[24px] h-[24px] mb-[9px]'}`} style={{ backgroundColor: content.unitIconColor || 'white', position: 'relative', bottom: '0px', left: '-6px', right: 'auto' }}>
                                         <span className="text-[15px] font-bold leading-none translate-y-[1px]" style={{ color: content.unitColor || '#0064D2' }}>{content.unit}</span>
                                     </div>
                                 ) : (
                                     <span className={`text-[24px] font-bold drop-shadow-md font-banner ml-[2px] mb-[4px]`} style={{ color: content.unitColor || 'white' }}>{content.unit}</span>
                                 )
                             )}
                             {content.hasSecondDiscount && (
                                 <>
                                     <span className={`text-[48px] font-bold drop-shadow-md font-banner mb-[8px] mr-[3px] ${content.unitDisplayType === 'icon' ? 'ml-[1px]' : 'ml-[4px]'}`} style={{ color: content.discountAmountColor || 'white' }}>+</span>
                                     {content.secondDiscountType === 'IDR' && (
                                         <span className={`text-[15px] font-bold drop-shadow-md font-banner self-start mr-[2px] ml-[4px] ${formData.headlineType === '1 Headline' ? 'mt-[4px]' : 'mt-[10px]'}`} style={{ color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>Rp</span>
                                     )}
                                     <span className="text-[80px] font-extrabold tracking-[-4px] drop-shadow-md font-banner leading-[66px]" style={{ color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>{content.secondDiscountAmount || '0'}</span>
                                     {content.secondDiscountUnit && (
                                         content.secondUnitDisplayType === 'icon' ? (
                                              <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 mt-[0px] mr-[8px] ml-[0px] ${content.secondDiscountUnit === 'mio' ? 'w-[30px] h-[30px] mb-[9px] translate-x-[0px]' : 'w-[24px] h-[24px] mb-[9px]'}`} style={{ backgroundColor: content.secondUnitIconColor || 'white', marginBottom: '8px', position: 'relative', top: '-2px', left: '-8px' }}>
                                                  <span className="text-[15px] font-bold leading-none translate-y-[1px]" style={{ color: content.secondUnitColor || '#0064D2' }}>{content.secondDiscountUnit}</span>
                                              </div>
                                         ) : (
                                              <span className="text-[24px] font-bold drop-shadow-md font-banner ml-[2px] mb-[2px]" style={{ color: content.secondUnitColor || content.unitColor || 'white' }}>{content.secondDiscountUnit}</span>
                                         )
                                     )}
                                 </>
                             )}
                         </div>
                         )}
                       </div>
                     </HighlightWrapper>
                     )}
                     <HighlightWrapper active={highlights?.labelDiscountDiff} label="Label Discount Changed">
                      {content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
                          <div className={`flex items-center gap-[6px] ${isTwoHeadlines ? 'mt-[14px]' : 'mt-[2px]'}`}>
                             {content.labelDiscountType === 'With icon' && (
                                 <div className="w-[16px] h-[16px]" style={{ '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
                             )}
                             <div className="text-[14px] font-bold drop-shadow-md font-banner" style={{ color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "", { transform: 'translateY(0)' })}</div>
                          </div>
                      )}
                     </HighlightWrapper>
                     <HighlightWrapper active={highlights?.additionalLabelDiff} label="Additional Label Changed">
                      {content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
                          <div 
                             className={`text-[12px] font-bold px-[12px] py-[4px] rounded-[10px] tracking-wider font-banner shadow-sm mt-[8px]`}
                             style={{ 
                                 backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00',
                                 color: content.additionalLabelTextColor || '#0064D2'
                             }}
                          >
                             {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                          </div>
                      )}
                     </HighlightWrapper>
                     {formData.bannerStyle === 'Style 3 (Flagship/big campaign)' && (
                         <div className="mt-[16px] h-[36px] px-[20px] bg-[#0064D2] rounded-full text-white text-[14px] font-bold flex items-center shadow-lg cursor-default">Book Now</div>
                     )}
                 </div>
             </div>
             {content.termsAndCondition && (
                 <div className="absolute bottom-[15px] left-[20px] max-w-[calc(100%-40px)] z-30">
                     <HighlightWrapper active={highlights?.tncDiff} label="Terms & Conditions Changed">
                         <div className="text-[6px] leading-[1.4] font-banner" style={{ color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
                     </HighlightWrapper>
                 </div>
             )}
         </div>

         {formData.showPartnerLogo && (
            <div className="absolute right-0 z-20 pointer-events-none" style={{ top: `${formData.partnerLogoY ?? 16}px`, transform: 'translateZ(0)' }}>
              <HighlightWrapper active={highlights?.partnerLogoDiff} label="Partner Logo Changed">
                <div className="flex items-center gap-[10px] h-[35px] pl-[20px] pr-[10px] bg-white rounded-l-full rounded-r-none shadow-sm" style={{ transform: `translateZ(0) scale(${formData.partnerLogoScale ?? 1})`, transformOrigin: 'top right' }}>
                    {formData.partnerLogos.slice(0, 3).map((slot, idx) => {
                         const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                         const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                         
                         return (
                         <div key={slot.id || idx} className="h-[27px] min-w-[66px] max-w-[132px] flex items-center justify-center" title={slot.logo || slot.type}>
                            <img src={imgSrc} alt={slot.logo || "Partner"} className="h-full w-auto object-contain" crossOrigin="anonymous" />
                         </div>
                         );
                    })}
                </div>
              </HighlightWrapper>
            </div>
         )}
         {formData.showCampaignLogo && (
             <div className="absolute z-20 pointer-events-none" style={{ top: `${formData.campaignLogoY ?? 16}px`, left: `${formData.campaignLogoX ?? 16}px`, transform: 'translateZ(0)', transformOrigin: 'top left' }}>
               <HighlightWrapper active={highlights?.campaignLogoDiff} label="Campaign Logo Changed">
                 <div className="w-[72px] h-[36px] flex items-center justify-center" style={{ transform: `scale(${formData.campaignLogoScale ?? 1})`, transformOrigin: 'top left' }}>
                    <img src={formData.campaignLogo || exampleImage} alt="Campaign Logo" className="w-full h-full object-contain" />
                 </div>
               </HighlightWrapper>
             </div>
         )}
         
        {/* Shimmer Overlay for Translation Loading */}
        {isShimmering && (
            <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden rounded-[12px]">
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
        </div>
      </div>
    </div>
  );
});

BannerLegacy.displayName = 'BannerLegacy';