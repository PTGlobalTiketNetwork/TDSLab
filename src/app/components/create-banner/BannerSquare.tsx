import { unitBadgeAutoColor } from './components/PolaroidCollage';
import { gradientStopsCss, DEFAULT_OVERLAY_GRADIENT_STOPS } from './components/GradientEditor';
import { BannerFormData } from './types';
import { DraggableItem } from './utils/DraggableItem';
import type { DiffHighlights } from '../../../utils/diffUtils';
import exampleImage from 'figma:asset/605b8d8048aad59b933d3ed10d18a40a444d8fd6.png';
import TdsIcOvalPlus from '../../../imports/TdsIcOvalPlus-2016-512';
import { forwardRef, useState, useEffect, useRef, ForwardedRef } from 'react';
import { ChevronLeft, Share } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { BoundingBox } from './components/BoundingBox';
import { getPositionsForRender, getCurrencyLabel, getUnitLabel, getDefaultPartnerLogoY, getDefaultPartnerLogoScale, getDefaultCampaignLogoY, tagsToHtml } from './utils/layoutUtils';

// BannerSquare's native canvas is 600×600 vs. BannerLegacy's portrait 720-wide canvas.
// The DLP Header navbar/partner-logo blocks are ported from BannerLegacy's 720-wide pixel
// space, so raw pixel values are scaled by these ratios to keep the same relative size/position.
const SQUARE_NAVBAR_SCALE = 600 / 360; // logical 360px navbar scaled to fill the 600px-wide canvas (vs. scale(2) = 720px in BannerLegacy)
const SQUARE_PARTNER_LOGO_SCALE = 600 / 720; // BannerLegacy's partner logo pixel values assume a 720-wide canvas

interface BannerSquareProps {
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
    onFormChange?: (updates: Partial<BannerFormData>) => void; // editor preview only: drag/scale the DLP content block
}

const ResizeHandle = ({ 
    onResizeStart, 
    onResize, 
    maxVal 
}: { 
    onResizeStart: () => void, 
    onResize: (delta: number) => void,
    maxVal?: number 
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
            className="absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-8 h-4 bg-white border border-blue-500 rounded-full flex items-center justify-center cursor-ns-resize z-50 shadow-sm hover:scale-110 transition-transform"
            title="Drag up/down to resize"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="w-4 h-1 bg-blue-500 rounded-full" />
        </div>
    );
};

export const BannerSquare = forwardRef((props: BannerSquareProps, ref: ForwardedRef<HTMLDivElement>) => {
  const { 
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
    isUnlocked,
    fullSize = false,
    hideBorder = false,
    onElementMove,
    onContentChange,
    highlights,
    isShimmering
  } = props;
  const content = formData.content[lang];
  // Text shadow on headline / benefit / labels: off unless the banner turns it on (applies to existing banners too)
  const textShadowClass = formData.textShadow === true ? 'drop-shadow-md' : '';
  
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const HighlightWrapper = ({ children, active, label }: { children: React.ReactNode; active?: boolean; label?: string }) => {
    if (!active) return <>{children}</>;
    
    return (
      <div className="relative group inline-block w-full h-full">
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
        <div className="relative inline-block w-full h-full">{children}</div>
      </div>
    );
  };
  
  // Clear selection when locking
  useEffect(() => {
    if (!isUnlocked) {
      setSelectedId(null);
    }
  }, [isUnlocked]);

  const startSizeRef = useRef(0);
  
  // Generic Font Resize
  const handleFontResizeStart = (currentSize: number) => {
      startSizeRef.current = currentSize;
  };

  const handleFontResize = (delta: number, field: string, max = 300) => {
      // Sensitivity: 1px drag = 0.5px size change
      const newSize = Math.max(10, Math.min(max, startSizeRef.current + (delta * 0.5)));
      if (onContentChange) {
          onContentChange(lang, field, Math.round(newSize));
      }
  };

  // Generic Container Resize (for Icons like Unit)
  const handleContainerResizeStart = (currentSize: number) => {
      startSizeRef.current = currentSize;
  };

  const handleContainerResize = (delta: number, key: string, max = 200) => {
      const newSize = Math.max(20, Math.min(max, startSizeRef.current + delta));
      const currentPos = getPos(key);
      if (onElementMove) {
        onElementMove(key, currentPos.x, currentPos.y, newSize, newSize, lang);
      }
  };
  
  const isDlpHeader = formData.dlpRole === 'header-mobile';

  const defaults = {
      en: {
          headline: 'Headline Goes Here \nmax 2 lines',
          subHeadline: 'Sub-headline Goes Here',
          secondHeadline: 'Second Headline Goes Here',
          labelDiscountText: 'Add Additional Perks',
          termsText: '*T&C apply',
      },
      id: {
          headline: 'Tulis Headline Disini \nmaks 2 baris',
          subHeadline: 'Tulis Sub-headline Disini',
          secondHeadline: 'Tulis Headline Kedua Disini',
          labelDiscountText: 'Tambahkan Additional Perks',
          termsText: '*S&K berlaku',
      }
  };

  const currentDefaults = defaults[lang];
  const headlineText = content.headline || currentDefaults.headline;
  const isTwoHeadlines = formData.headlineType === '2 Headlines';
  const defaultHeadlineSize = isTwoHeadlines ? 26 : 40;
  const secondHeadlineText = isTwoHeadlines
      ? (content.secondHeadline || currentDefaults.secondHeadline)
      : formData.headlineType === 'With Sub-Headline'
          ? (content.subHeadline || currentDefaults.subHeadline)
          : '';
  const labelDiscountText = content.labelDiscountText || currentDefaults.labelDiscountText;

  // Show the typed amount as-is; only fall back to the '50' placeholder when empty, and only if
  // the currency isn't "None" (an empty amount with "None" currency means no nominal at all).
  const discountAmountText = content.discountAmount || (content.discountType === 'Non-IDR' ? '' : '50');
  const secondDiscountAmountText = content.secondDiscountAmount || (content.secondDiscountType === 'Non-IDR' ? '' : '50');
  const currencyLabel = getCurrencyLabel(content.discountType, content.customCurrency);
  const secondCurrencyLabel = getCurrencyLabel(content.secondDiscountType, content.secondCustomCurrency);

  // Terms
  const termsText = content.termsText || currentDefaults.termsText;

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
  
  // Use external preloaded state if available, otherwise use internal state
  const [internalImageLoaded, setInternalImageLoaded] = useState(false);
  const isImageLoaded = isImagePreloaded !== undefined ? isImagePreloaded : internalImageLoaded;

  // Only reset internal state if not using external preload state
  useEffect(() => {
      if (isImagePreloaded === undefined) {
          setInternalImageLoaded(false);
      }
  }, [currentDisplayImage, isImagePreloaded]);
  
  const bgGradients: Record<string, string> = {
    'Hotel': 'linear-gradient(135deg, #FF6B6B 0%, #EE5D88 100%)',
    'Accom': 'linear-gradient(135deg, #FF6B6B 0%, #EE5D88 100%)',
    'Transport': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'Flight': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'NFT': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'ToDos': 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    'Event': 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)',
  };

  const containerBackground = (bgGradients[formData.verticalCategory] || '#e9ebef');

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
  };

  const overlayColor = formData.overlayColor || '#000000';
  const rgb = hexToRgb(overlayColor);
  const opacityStart = (formData.gradientOpacity ?? 100) / 100;
  const stopPos = formData.overlayGradientStop ?? 10;
  const stopEnd = formData.overlayGradientEnd ?? 100;
  const opacity2 = (formData.overlay2Opacity ?? 100) / 100;

  // Overlay box covers the bottom 70% of the 600px canvas (420px); Start/Stop are % within that box.
  const overlaySolid = formData.overlayMode === 'solid';
  const solidOp = (formData.overlaySolidOpacity ?? 100) / 100;
  const solidCov = formData.overlaySolidCoverage ?? 50;
  const solidBg = (dir: string) => `linear-gradient(${dir}, rgba(${rgb},${solidOp}) 0%, rgba(${rgb},${solidOp}) ${solidCov}%, transparent ${solidCov}%)`;
  // Solid + gradient fill: the gradient sits on its own Coverage-sized block so the hard edge survives
  const solidGrad = overlaySolid && formData.overlaySolidFill === 'gradient';
  const solidGradEl = (anchor: React.CSSProperties) => <div className="absolute" style={{ ...anchor, background: gradientStopsCss(formData.overlaySolidGradientStops ?? DEFAULT_OVERLAY_GRADIENT_STOPS, formData.overlaySolidGradientType, formData.overlaySolidGradientAngle ?? 90), opacity: solidOp }} />;
  const gradientStyle = {
      background: solidGrad ? 'none' : overlaySolid ? solidBg('to top') : `linear-gradient(to top, rgba(${rgb},${opacityStart}) 0%, rgba(${rgb},${opacityStart}) ${stopPos}%, rgba(${rgb},0) ${Math.max(stopPos + 1, stopEnd)}%)`,
      transform: 'translateZ(0)', // Fix Safari stacking context
  };
  const gradientStyle2 = {
      background: `linear-gradient(to top, rgba(${rgb},${opacity2}) 0%, rgba(${rgb},${opacity2}) ${formData.overlayGradientStop2 ?? 40}%, rgba(${rgb},0) ${Math.max((formData.overlayGradientStop2 ?? 40) + 1, formData.overlayGradientEnd2 ?? 100)}%)`,
      transform: 'translateZ(0)',
  };

  const renderHtml = (text: string | undefined, className: string) => {
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
    return <span className={`${className}`} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  // Use refined position logic that respects Nudge/Language specific storage
  const positions = getPositionsForRender(formData, lang);
  
  // Merge defaults with current positions to ensure all keys exist
  const specs = (BANNER_SPECS as any)['Square (1:1)'];
  const hasSecondDiscount = content.hasSecondDiscount;
  const layoutDefaults = (hasSecondDiscount ? specs?.defaults : (specs?.defaults_single || specs?.defaults)) || {};
  
  const mergedPositions = { ...layoutDefaults, ...positions };
  
  const getPos = (key: string) => mergedPositions[key] || { x: 0, y: 0 };
  
  const handleItemMove = (key: string, x: number, y: number, w?: number, h?: number) => {
      onElementMove?.(key, x, y, w, h, lang);
  };

  // --- DLP Header (1:1): content block ported verbatim from BannerLegacy's Portrait (3:4) ---
  // content column so the two ratios render identically, scaled down to fit the 720px-logical
  // column into the 600px-wide square canvas via SQUARE_PARTNER_LOGO_SCALE on the wrapper.
  const renderLeftColumnDlp = (fontScale = 1, forPortrait = false, which: 'first' | 'second' = 'first', inline = false) => {
    if (content.showPrefix === false) return null;
    const isSecond = which === 'second';
    const text = isSecond ? content.secondBenefitPrefix : content.mainBenefitPrefix;
    const pt = isSecond ? content.secondPrefixType : content.prefixType;
    if (!text) return null;

    const lowerText = text.toLowerCase().trim();
    const color = (isSecond ? (content.secondPrefixColor ?? content.prefixColor) : content.prefixColor) || '#FEDD00';
    const fs = Math.round(18 * fontScale);
    const lh = Math.round(fs * 0.95);
    const base = 'font-banner';
    const line = (t: string, weight: 'bold' | 'normal', extra: React.CSSProperties = {}) => (
      <span
        className={`${weight === 'bold' ? 'font-bold' : 'font-normal'} ${base}`}
        style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: inline ? 'inline-block' : 'block', whiteSpace: 'nowrap', ...extra }}
      >{t}</span>
    );

    let contentNode: React.ReactNode;
    if (pt !== 'custom' && (lowerText === 'discount' || lowerText === 'diskon')) {
        contentNode = line(text, 'bold');
    } else if (pt !== 'custom' && (lowerText === 'discount up to' || lowerText === 'diskon hingga')) {
        const [w1, ...rest] = text.split(' ');
        contentNode = (<>{line(w1, 'bold')}{line(rest.join(' '), 'normal', { color: 'white' })}</>);
    } else if (pt !== 'custom' && (lowerText === 'up to' || lowerText === 'hingga')) {
        contentNode = line(text, 'normal', { color: 'white' });
    } else if (pt !== 'custom' && (lowerText === 'start from' || lowerText === 'mulai dari')) {
        const [w1, ...rest] = text.split(' ');
        contentNode = (<>{line(w1, 'bold')}{line(rest.join(' '), 'normal', { color: 'white' })}</>);
    } else if (pt === 'instant_cashback') {
        const fontStyle: React.CSSProperties['fontStyle'] = lang === 'id' ? 'italic' : 'normal';
        contentNode = (<>{line('Instant', 'bold', { fontStyle })}{line('cashback', 'bold', { fontStyle })}</>);
    } else if (pt === 'instant_cashback_upto') {
        const isID = lang === 'id';
        const fontStyle: React.CSSProperties['fontStyle'] = isID ? 'italic' : 'normal';
        contentNode = (<>
            {line('Instant', 'bold', { fontStyle })}
            {line('cashback', 'bold', { fontStyle })}
            {line(isID ? 'hingga' : 'up to', 'normal', { color: 'white' })}
        </>);
    } else {
        const isCustom = pt === 'custom' || pt === 'buy_x_get_y';
        const customSize = (content.prefixFontSize || 20) * fontScale;
        contentNode = (
            <span
                className={`${base} text-left whitespace-nowrap block`}
                style={{
                    color,
                    fontSize: isCustom ? `${customSize}px` : `${fs}px`,
                    lineHeight: isCustom ? (typeof content.prefixLineHeight === 'number' ? content.prefixLineHeight / 100 : '1.2') : `${lh}px`,
                }}
                dangerouslySetInnerHTML={{ __html: tagsToHtml(text) }}
            />
        );
    }

    if (inline) {
      return <div className="flex flex-row flex-wrap items-baseline justify-center text-center" style={{ columnGap: `${Math.round(fs * 0.25)}px` }}>{contentNode}</div>;
    }
    return <div className="flex flex-col items-start justify-center">{contentNode}</div>;
  };

  const renderBenefitDlp = (cs: number, rowMax: number, bleed: number, align: 'center' | 'start' = 'center') => {
    const amountBase = (content.discountAmountFontSize || 80) * 2;
    const hasPrefix = !!content.mainBenefitPrefix && content.showPrefix !== false;

    const renderValue = (which: 'first' | 'second', fit = 1) => {
      const isSecond = which === 'second';
      const cur = isSecond ? secondCurrencyLabel : currencyLabel;
      const amount = isSecond ? secondDiscountAmountText : discountAmountText;
      const unit = amount ? (isSecond ? content.secondDiscountUnit : content.unit) : '';
      const unitAsIcon = (isSecond ? content.secondUnitDisplayType : content.unitDisplayType) === 'icon';
      const amountColor = (isSecond ? content.secondDiscountAmountColor : undefined) || content.discountAmountColor || 'white';
      const unitColor = isSecond ? (content.secondUnitColor || content.unitColor) : content.unitColor;
      const unitBg = (isSecond ? (content.secondUnitIconColor ?? content.unitIconColor) : content.unitIconColor) || '#FEE645';
      const s = cs * fit;
      const badge = (unit === 'mio' ? 60 : 48) * s;
      return (
        <div className="relative flex items-end whitespace-nowrap">
          {cur && (
            <span className={`font-bold ${textShadowClass} font-banner self-start`} style={{ fontSize: `${30 * s}px`, lineHeight: 1, color: amountColor, marginRight: `${4 * s}px` }}>{cur}</span>
          )}
          {amount && <span className={`font-extrabold ${textShadowClass} font-banner`} style={{ fontSize: `${amountBase * s}px`, lineHeight: `${132 * s}px`, letterSpacing: `${-8 * s}px`, color: amountColor }}>
            {amount}
          </span>}
          {unit && (
            unitAsIcon ? (
              <div className="flex items-center justify-center rounded-full shrink-0 z-10" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.2)', width: `${badge}px`, height: `${badge}px`, marginBottom: `${10 * s}px`, marginLeft: `${-12 * s}px`, backgroundColor: unitBg }}>
                <span className="font-bold font-banner leading-none" style={{ fontSize: `${28 * s}px`, color: unitColor || unitBadgeAutoColor(formData) }}>{getUnitLabel(unit)}</span>
              </div>
            ) : (
              <span className={`font-bold ${textShadowClass} font-banner`} style={{ fontSize: `${48 * s}px`, lineHeight: 1, marginLeft: `${4 * s}px`, marginBottom: `${16 * s}px`, color: unitColor || 'white' }}>{getUnitLabel(unit)}</span>
            )
          )}
        </div>
      );
    };

    // Same preset bold/regular split as everywhere else (renderLeftColumnDlp), just centered above the number instead of stacked to its left.
    const renderTopLabel = (which: 'first' | 'second', s: number) => renderLeftColumnDlp(2 * s, true, which, true);

    if (!content.hasSecondDiscount && formData.nudgeOnTop) {
      return (
        <div className={`flex flex-col ${align === 'center' ? 'items-center' : 'items-start'}`} style={{ marginTop: `${16 * cs}px` }}>
          {hasPrefix && renderLeftColumnDlp(2 * cs, true, 'first', true)}
          <div style={{ marginTop: `${22 * cs}px` }}>{renderValue('first')}</div>
        </div>
      );
    }

    if (!content.hasSecondDiscount) {
      return (
        <div className="flex items-center justify-center" style={{ gap: `${12 * cs}px`, marginTop: `${16 * cs}px` }}>
          {hasPrefix && renderLeftColumnDlp(2 * cs, true)}
          {renderValue('first')}
        </div>
      );
    }

    const groupWidth = (cur: string, amount: string, unit?: string) =>
      (cur ? cur.length * 18 + 4 : 0) + amount.length * (amountBase * 0.62 - 8) + (unit ? 44 : 0);
    const labelWidth = (text?: string, type?: string) => {
      if (!text || content.showPrefix === false) return 0;
      const plain = text.replace(/<[^>]*>/g, '');
      const size = ((type === 'custom' || type === 'buy_x_get_y') ? (content.prefixFontSize || 20) : 18) * 2;
      return plain.length * size * 0.55;
    };
    const estWidth = (Math.max(groupWidth(currencyLabel, discountAmountText, discountAmountText ? content.unit : undefined), labelWidth(content.mainBenefitPrefix, content.prefixType))
      + Math.max(groupWidth(secondCurrencyLabel, secondDiscountAmountText, secondDiscountAmountText ? content.secondDiscountUnit : undefined), labelWidth(content.secondBenefitPrefix, content.secondPrefixType))
      + 96 + 32) * cs;
    const fit = Math.min(1, rowMax / estWidth);
    const s = cs * fit;
    const valueTrim = -22;

    return (
      <div
        className={`grid items-end ${align === 'center' ? 'justify-center' : 'justify-start'}`}
        style={{ gridTemplateColumns: 'auto auto auto', columnGap: `${16 * s}px`, rowGap: 0, marginTop: `${16 * cs}px`, marginLeft: `${-bleed}px`, marginRight: `${-bleed}px` }}
      >
        <div className="flex justify-center" style={{ gridColumn: 1, gridRow: 1 }}>{renderTopLabel('first', s)}</div>
        <div className="flex justify-center" style={{ gridColumn: 3, gridRow: 1 }}>{renderTopLabel('second', s)}</div>
        <div className="flex justify-center" style={{ gridColumn: 1, gridRow: 2, marginTop: `${-valueTrim * s}px` }}>{renderValue('first', fit)}</div>
        <span className={`font-bold ${textShadowClass} font-banner self-center`} style={{ gridColumn: 2, gridRow: 2, transform: `translateY(${-valueTrim / 2 * s}px)`, fontSize: `${96 * s}px`, lineHeight: 1, color: content.discountAmountColor || 'white' }}>+</span>
        <div className="flex justify-center" style={{ gridColumn: 3, gridRow: 2, marginTop: `${-valueTrim * s}px` }}>{renderValue('second', fit)}</div>
      </div>
    );
  };

  const SCALE_FACTOR = 400 / 600; // 0.6667 - Visual display scale
  
  const backgroundHighlight = highlights && highlights.backgroundDiff && (
        <div 
            className="absolute pointer-events-none z-0"
            style={{
                top: -6,
                left: -6,
                right: -6,
                bottom: -6,
                border: '2px dashed #FF9800', // Kept dashed for background as per previous request/user preference for background container, or should I make it solid? User said "samakan style garisnya" but also specifically complained about ELEMENTS using dashed red. 
                // Wait, the prompt says "Promo banner version comparison masih memakai garis putius2 warna merah berkedip untuk elemen2nya selain background". 
                // So the ELEMENTS (text, etc) should be solid orange.
                // The background was recently changed to dashed orange.
                // "untuk promo banner square, blum ada outline di card previewnya kalau backgroundnya berubah. padahal ada perubahan tapi tidak muncul garis luar card nya."
                // I will update the background highlight to be visible by fixing overflow.
                borderRadius: '16px',
                boxShadow: '0 0 0 2px rgba(255, 152, 0, 0.1), 0 0 12px rgba(255, 152, 0, 0.4)',
                animation: 'highlight-pulse 2s ease-in-out infinite'
            }}
        />
  );

  const bannerContent = (
    <div  
        data-canvas-w="600"
        className={`w-[600px] h-[600px] relative rounded-[12px] overflow-hidden isolate ${fullSize || hideBorder ? '' : 'shadow-sm border border-gray-100'}`} 
        style={{ 
            background: containerBackground, 
            cursor: (isDraggable && !isUnlocked) ? 'grab' : 'default', // Only grab if NOT unlocked (background drag)
            touchAction: 'none'
        }}
        onMouseDown={onMouseDown}
        onClick={() => isUnlocked && setSelectedId(null)}
    >
        {/* Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            {!isImageLoaded && thumbnailUrl && (formData.backgroundType === 'image' || formData.backgroundType === 'generate') && (
                <img src={thumbnailUrl} className="absolute inset-0 w-full h-full object-cover blur-md scale-110" />
            )}
            {!isImageLoaded && !thumbnailUrl && (formData.backgroundType === 'image' || formData.backgroundType === 'generate') && <Skeleton className="w-full h-full absolute inset-0" />}
            
            {/* Color Background */}
            {formData.backgroundType === 'color' && (
                <div className="absolute inset-0 w-full h-full" style={{ backgroundColor: formData.backgroundColor || '#FFFFFF' }} />
            )}
            
            {/* Gradient Background */}
            {formData.backgroundType === 'gradient' && (
                <div 
                    className="absolute inset-0 w-full h-full" 
                    style={{ 
                        background: (() => {
                            const stops = formData.backgroundGradientStops || [
                                { id: '1', color: '#4FACFE', position: 0 },
                                { id: '2', color: '#00F2FE', position: 100 }
                            ];
                            const sortedStops = [...stops].sort((a, b) => a.position - b.position);
                            
                            const gradientString = sortedStops.map(s => {
                                return `${s.color} ${s.position}%`;
                            }).join(', ');
                            
                            const type = formData.backgroundGradientType || 'linear';
                            const angle = formData.backgroundGradientAngle ?? 135; // Use ?? because 0 is valid

                            if (type === 'radial') {
                                return `radial-gradient(circle at center, ${gradientString})`;
                            } else {
                                return `linear-gradient(${angle}deg, ${gradientString})`;
                            }
                        })()
                    }} 
                />
            )}
            
            {/* Image Background */}
            {(formData.backgroundType === 'image' || formData.backgroundType === 'generate' || !formData.backgroundType) && (
                <img 
                    src={currentDisplayImage} 
                    alt="Background" 
                    style={{ 
                        ...imageStyle, 
                        opacity: isImageLoaded ? 1 : 0, 
                        transition: 'opacity 500ms ease-in-out'
                    }} 
                    onLoad={() => setInternalImageLoaded(true)}
                />
            )}
        </div>
        
        {/* Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-[420px] pointer-events-none z-10" style={gradientStyle}>{solidGrad && solidGradEl({ left: 0, right: 0, bottom: 0, height: `${solidCov}%` })}</div>
        {formData.overlay2Enabled && !overlaySolid && <div className="absolute bottom-0 left-0 right-0 h-[420px] pointer-events-none z-10" style={gradientStyle2} />}

        {/* DLP Header mobile: iOS status bar + transparent top bar, built at 360 logical px and scaled up to fill the 600px canvas */}
        {formData.dlpRole === 'header-mobile' && formData.dlpNavbar !== false && (
            <div data-dlp-navbar className="absolute top-0 left-0 z-20 pointer-events-none" style={{ width: 360, transform: `scale(${SQUARE_NAVBAR_SCALE})`, transformOrigin: 'top left', fontFamily: 'inherit' }}>
                {/* Status bar (iOS, inverted = white) */}
                <div className="flex items-center justify-between text-white" style={{ minHeight: 44, padding: '8px 20px' }}>
                    <span className="font-semibold whitespace-nowrap" style={{ padding: '8px 19px', fontSize: 14, lineHeight: '20px' }}>9:41</span>
                    <span className="flex items-center justify-end" style={{ padding: '4px 0', gap: 5 }}>
                        <svg width="17" height="10.667" viewBox="0 0 17 10.667" fill="currentColor"><path d="M2 6.66699C2.55228 6.66699 3 7.11471 3 7.66699V9.66699C2.99982 10.2191 2.55218 10.667 2 10.667H1C0.447824 10.667 0.000175969 10.2191 0 9.66699V7.66699C0 7.11471 0.447715 6.66699 1 6.66699H2ZM6.66699 4.66699C7.21913 4.66717 7.66699 5.11482 7.66699 5.66699V9.66699C7.66682 10.219 7.21902 10.6668 6.66699 10.667H5.66699C5.11482 10.667 4.66717 10.2191 4.66699 9.66699V5.66699C4.66699 5.11471 5.11471 4.66699 5.66699 4.66699H6.66699ZM11.333 2.33301C11.8852 2.33301 12.3328 2.78087 12.333 3.33301V9.66699C12.3328 10.2191 11.8852 10.667 11.333 10.667H10.333C9.78098 10.6668 9.33318 10.219 9.33301 9.66699V3.33301C9.33318 2.78098 9.78098 2.33318 10.333 2.33301H11.333ZM16 0C16.5523 0 17 0.447715 17 1V9.66699C16.9998 10.2191 16.5522 10.667 16 10.667H15C14.4478 10.667 14.0002 10.2191 14 9.66699V1C14 0.447715 14.4477 0 15 0H16Z" /></svg>
                        <svg width="15.272" height="10.966" viewBox="0 0 15.2725 10.966" fill="currentColor"><path d="M5.42676 8.40057C6.70234 7.32168 8.57111 7.32168 9.84669 8.40057C9.91071 8.45859 9.94746 8.54074 9.94923 8.62713C9.95095 8.71359 9.9172 8.79702 9.85548 8.8576L7.85841 10.8732C7.79988 10.9324 7.71998 10.966 7.63673 10.966C7.55347 10.966 7.47359 10.9324 7.41505 10.8732L5.417 8.8576C5.3554 8.797 5.32148 8.71351 5.32325 8.62713C5.32508 8.54068 5.36262 8.45855 5.42676 8.40057ZM2.76173 5.71111C5.50982 3.15507 9.76555 3.15512 12.5137 5.71111C12.5756 5.77097 12.6113 5.85351 12.6123 5.93963C12.6132 6.02581 12.5793 6.10892 12.5186 6.1701L11.3643 7.33709C11.2453 7.45619 11.0527 7.45884 10.9307 7.34295C10.0282 6.52576 8.85417 6.07337 7.63673 6.07342C6.42004 6.07392 5.24661 6.52628 4.34473 7.34295C4.22266 7.45877 4.03007 7.45617 3.91114 7.33709L2.75684 6.1701C2.69617 6.10903 2.66228 6.02572 2.66309 5.93963C2.66403 5.8535 2.69976 5.77095 2.76173 5.71111ZM0.0966866 3.02947C4.3118 -1.0097 10.9618 -1.00995 15.1768 3.02947C15.2377 3.08942 15.2719 3.17156 15.2725 3.25701C15.273 3.34257 15.239 3.42481 15.1787 3.48553L14.0225 4.65252C13.9033 4.77199 13.7107 4.77324 13.5899 4.65545C11.9839 3.12872 9.85255 2.27764 7.63673 2.27752C5.42063 2.27751 3.28877 3.12856 1.68262 4.65545C1.56183 4.77344 1.36905 4.77222 1.25001 4.65252L0.0937569 3.48553C0.0334926 3.42476 -0.000556156 3.34259 6.87362e-06 3.25701C0.000622824 3.1715 0.0356758 3.08939 0.0966866 3.02947Z" /></svg>
                        <svg width="24.328" height="11.333" viewBox="0 0 24.328 11.3333" fill="currentColor"><path opacity="0.35" stroke="currentColor" d="M2.66699 0.5H19.333C20.5296 0.5 21.5 1.47037 21.5 2.66699V8.66699C21.4998 9.86346 20.5295 10.833 19.333 10.833H2.66699C1.47048 10.833 0.500176 9.86346 0.5 8.66699V2.66699C0.5 1.47038 1.47037 0.5 2.66699 0.5Z" /><path opacity="0.4" d="M23 3.66667V7.66667C23.8047 7.32789 24.328 6.5398 24.328 5.66667C24.328 4.79353 23.8047 4.00544 23 3.66667" /><path d="M2 3.33333C2 2.59695 2.59695 2 3.33333 2H18.6667C19.403 2 20 2.59695 20 3.33333V8C20 8.73638 19.403 9.33333 18.6667 9.33333H3.33333C2.59695 9.33333 2 8.73638 2 8V3.33333Z" /></svg>
                    </span>
                </div>
                {/* Top bar (transparent): floating white circular icon buttons */}
                <div className="flex items-center" style={{ padding: '0 20px 12px', gap: 16 }}>
                    {[0].map((k) => (
                        <span key={k} className="flex items-center justify-center bg-white rounded-full" style={{ padding: 8, boxShadow: '0 2px 8px #30313529' }}>
                            <ChevronLeft size={20} color="#4d4f56" />
                        </span>
                    ))}
                    <span className="flex items-center ml-auto" style={{ gap: 12 }}>
                        <span className="flex items-center justify-center bg-white rounded-full" style={{ padding: 8, boxShadow: '0 2px 8px #30313529' }}>
                            <Share size={20} color="#4d4f56" />
                        </span>
                    </span>
                </div>
            </div>
        )}

        {/* DLP Header (1:1): headline + nudge + discount content block, ported verbatim from
            BannerLegacy's Portrait (3:4) layout and scaled down to the 600px square canvas —
            not the generic Promo Banner square layout below. */}
        {isDlpHeader && (
            <div
                className="absolute left-1/2 bottom-0 z-20 flex flex-col items-center pointer-events-none"
                style={{ width: 720, marginLeft: -360, paddingBottom: '24px', transform: `scale(${SQUARE_PARTNER_LOGO_SCALE})`, transformOrigin: 'bottom center' }}
            >
                <BoundingBox
                    enabled={!!props.onFormChange}
                    className="flex flex-col items-center w-full px-[48px]"
                    style={{ gap: '4px', transform: `translateY(${formData.squareContentOffsetY ?? 0}px) scale(${(formData.squareContentScale ?? 100) / 100})`, transformOrigin: 'bottom center' }}
                    offsetY={formData.squareContentOffsetY ?? 0} offsetUnit={720 / 600} offsetMin={-200} offsetMax={200}
                    onOffsetChange={(v) => props.onFormChange?.({ squareContentOffsetY: v })}
                    scale={formData.squareContentScale ?? 100} scaleMin={60} scaleMax={200}
                    onScaleChange={(v) => props.onFormChange?.({ squareContentScale: v })}
                    selfScale={SQUARE_PARTNER_LOGO_SCALE * (formData.squareContentScale ?? 100) / 100}
                >
                    <h3
                        className={`${textShadowClass} font-banner font-bold leading-[1.1] text-center w-full ${isTwoHeadlines ? 'line-clamp-2 break-words' : ''}`}
                        style={{ fontSize: `${(content.headlineFontSize || defaultHeadlineSize) * 2}px`, color: content.headlineColor || '#FEDD00' }}
                    >
                        {renderHtml(headlineText, "")}
                    </h3>

                    {secondHeadlineText && formData.headlineType !== '1 Headline' && (
                        <h3
                            className={`${textShadowClass} font-banner font-bold text-center w-full ${isTwoHeadlines ? 'leading-[1.1] line-clamp-2 break-words' : ''}`}
                            style={{ fontSize: isTwoHeadlines ? `${(content.headlineFontSize || defaultHeadlineSize) * 2}px` : `${(content.subHeadlineFontSize || 18) * 2}px`, color: content.subHeadlineColor || 'white' }}
                        >
                            {renderHtml(secondHeadlineText, "")}
                        </h3>
                    )}

                    {!isTwoHeadlines && formData.discountEnabled !== false && renderBenefitDlp((formData.portraitBenefitScale ?? 100) / 100, 720 - 12 * 2, 36)}

                    {content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: isTwoHeadlines ? '28px' : '4px' }}>
                            {content.labelDiscountType === 'With icon' && (
                                <div style={{ width: '32px', height: '32px', '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
                            )}
                            <div className={`font-bold ${textShadowClass} font-banner text-center`} style={{ fontSize: `${content.labelDiscountFontSize || 28}px`, color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "")}</div>
                        </div>
                    )}

                    {content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
                        content.additionalLabelType === 'Voucher' ? (
                        <div className="inline-flex items-center gap-[8px] font-banner" style={{ borderRadius: '6px', padding: '8px 10px 6px', marginTop: '16px', backgroundColor: content.additionalLabelBackgroundColor || '#FFFFFF', color: content.additionalLabelTextColor || '#007BFF' }}>
                            <div className="font-normal leading-[1.15] text-left shrink-0" style={{ fontSize: `${(content.additionalLabelFontSize || 16) * 0.4}px` }}>
                                <div>{lang === 'id' ? 'Kode' : 'Promo'}</div>
                                <div>{lang === 'id' ? 'Promo:' : 'Code:'}</div>
                            </div>
                            <div className="self-stretch shrink-0 border-l border-dashed opacity-60" style={{ borderColor: 'currentColor' }} />
                            <div className="font-bold uppercase tracking-tight leading-[0.8] whitespace-nowrap" style={{ fontSize: `${content.additionalLabelFontSize || 16}px` }}>
                                {renderHtml(content.additionalLabelText, "") || 'VOUCHERCODE'}
                            </div>
                        </div>
                        ) : (
                        <div className="font-bold tracking-wider font-banner shadow-sm" style={{ fontSize: '24px', borderRadius: '999px', padding: '8px 24px', marginTop: '16px', backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00', color: content.additionalLabelTextColor || '#0064D2' }}>
                        {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                        </div>
                        )
                    )}
                </BoundingBox>

                <div className="text-center w-full" style={{ marginTop: '32px', visibility: content.termsAndCondition ? 'visible' : 'hidden' }}>
                    <div className="font-banner leading-[1.4]" style={{ fontSize: `${(content.termsFontSize || 11) * 2}px`, color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
                </div>
            </div>
        )}

        {/* Strict Layout Elements */}

        {/* Headline - Dynamic Size */}
        {!isDlpHeader && (
        <DraggableItem id="headline" {...getPos('headline')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'headline'} onClick={() => setSelectedId('headline')}>
                <HighlightWrapper active={highlights?.headlineDiff} label="Headline Changed">
                <div style={{ textAlign: 'center', position: 'relative', whiteSpace: isTwoHeadlines ? 'normal' : 'nowrap' }}>
                <h3 className={`font-banner font-bold leading-[1.1] ${textShadowClass} ${isTwoHeadlines ? 'line-clamp-2 break-words' : ''}`}
                    style={{ fontSize: `${content.headlineFontSize || 36}px`, color: content.headlineColor || '#FEDD00' }}>
                    {renderHtml(headlineText, "")}
                </h3>
                {secondHeadlineText && (
                <h3 className={`font-banner font-bold ${textShadowClass} ${isTwoHeadlines ? 'leading-[1.1] mt-[2px] line-clamp-2 break-words' : 'leading-[1.2] mt-[6px]'}`}
                    style={{
                        fontSize: isTwoHeadlines ? `${content.headlineFontSize || 36}px` : `${content.subHeadlineFontSize || 18}px`,
                        color: isTwoHeadlines ? (content.headlineColor || '#FEDD00') : (content.subHeadlineColor || '#FFFFFF')
                    }}>
                    {renderHtml(secondHeadlineText, "")}
                </h3>
                )}
                {isUnlocked && selectedId === 'headline' && (
                <ResizeHandle onResizeStart={() => handleFontResizeStart(content.headlineFontSize || 36)} onResize={(d) => handleFontResize(d, 'headlineFontSize')} />
                )}
                </div>
                </HighlightWrapper>
        </DraggableItem>
        )}

        {/* Discount Amount - Dynamic Size */}
        {!isDlpHeader && formData.discountEnabled !== false && discountAmountText && (
        <DraggableItem id="discountAmount" {...getPos('discountAmount')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'discountAmount'} onClick={() => setSelectedId('discountAmount')}>
                <HighlightWrapper active={highlights?.amount1Diff} label="Amount Changed">
                <div style={{ textAlign: 'center', position: 'relative' }}>
                <span className={`font-banner font-extrabold tracking-[-10px] ${textShadowClass} leading-[0.8]`} 
                        style={{ fontSize: `${content.discountAmountFontSize || 180}px`, color: content.discountAmountColor || '#FFFFFF' }}>
                        {discountAmountText}
                </span>
                {isUnlocked && selectedId === 'discountAmount' && (
                <ResizeHandle onResizeStart={() => handleFontResizeStart(content.discountAmountFontSize || 180)} onResize={(d) => handleFontResize(d, 'discountAmountFontSize')} />
                )}
                </div>
                </HighlightWrapper>
        </DraggableItem>
        )}

        {/* Nudge (Prefix) */}
        {!isDlpHeader && content.showPrefix !== false && (
            <DraggableItem key="nudge" id="nudge" {...getPos('nudge')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'nudge'} onClick={() => setSelectedId('nudge')}>
                    <HighlightWrapper active={highlights?.nudgeDiff} label="Nudge Changed">
                    <div className="text-left relative flex flex-col justify-end" style={{ minHeight: `${(content.prefixFontSize || 40) * 2}px` }}>
                    {(() => {
                        const text = content.mainBenefitPrefix;
                        if (!text) return null;
                        
                        const fontSize = content.prefixFontSize || 40;
                    
                        const lowerText = text.toLowerCase().trim();
                    
                        // Preset: Discount
                        if (lowerText === 'discount' || lowerText === 'diskon') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: 'transparent', visibility: 'hidden' }}>Discount</span>
                            <span className="font-banner font-bold -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>{text}</span>
                            </div>
                        );
                        }
                    
                        // Preset: Discount up to — "Discount" bold, "up to" regular
                        if (lowerText === 'discount up to') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Discount</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: '#FFFFFF' }}>up to</span>
                            </div>
                        );
                        }

                        // Preset: Diskon hingga — "Diskon" bold, "hingga" regular
                        if (lowerText === 'diskon hingga') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Diskon</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: '#FFFFFF' }}>hingga</span>
                            </div>
                        );
                        }

                        // Preset: Up to — regular weight
                        if (lowerText === 'up to') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: 'transparent', visibility: 'hidden' }}>Discount</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Up to</span>
                            </div>
                        );
                        }

                        // Preset: Hingga — regular weight
                        if (lowerText === 'hingga') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: 'transparent', visibility: 'hidden' }}>Diskon</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Hingga</span>
                            </div>
                        );
                        }

                        // Preset: Start from — "Start" bold, "from" regular
                        if (lowerText === 'start from') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Start</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: '#FFFFFF' }}>from</span>
                            </div>
                        );
                        }

                        // Preset: Mulai dari — "Mulai" bold, "dari" regular
                        if (lowerText === 'mulai dari') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Mulai</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: '#FFFFFF' }}>dari</span>
                            </div>
                        );
                        }

                        // Preset: Instant cashback — bold, 2 lines (italic in ID)
                        if (content.prefixType === 'instant_cashback') {
                        const isID = lang === 'id';
                        const fontStyle = isID ? 'italic' : 'normal';
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF', fontStyle }}>Instant</span>
                            <span className="font-banner font-bold -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF', fontStyle }}>cashback</span>
                            </div>
                        );
                        }

                        // Preset: Instant cashback up to / hingga — 3 lines
                        if (content.prefixType === 'instant_cashback_upto') {
                        const isID = lang === 'id';
                        const fontStyle = isID ? 'italic' : 'normal';
                        const thirdLine = isID ? 'hingga' : 'up to';
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF', fontStyle }}>Instant</span>
                            <span className="font-banner font-bold -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF', fontStyle }}>cashback</span>
                            <span className="font-banner font-normal -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: '#FFFFFF', fontStyle: 'normal' }}>{thirdLine}</span>
                            </div>
                        );
                        }
                        
                        // Custom: Support multiline and bold tags
                        const lines = text.split('\n');
                        
                        return (
                        <div className="flex flex-col gap-0 leading-tight">
                            {lines.map((line, idx) => (
                            <span 
                                key={idx}
                                className="font-banner"
                                style={{ 
                                fontSize: `${fontSize}px`,
                                color: content.prefixColor || '#FFFFFF',
                                lineHeight: typeof content.prefixLineHeight === 'number' ? content.prefixLineHeight / 100 : '1.1'
                                }}
                                dangerouslySetInnerHTML={{ 
                                __html: line
                                    .replace(/<sb>/g, '<span style="font-weight: 600">')
                                    .replace(/<\/sb>/g, '</span>')
                                    .replace(/<b>/g, '<span style="font-weight: 700">')
                                    .replace(/<\/b>/g, '</span>')
                                    .replace(/<eb>/g, '<span style="font-weight: 800">')
                                    .replace(/<\/eb>/g, '</span>')
                                    .replace(/<r>/g, '<span style="font-weight: 400">')
                                    .replace(/<\/r>/g, '</span>')
                                    .replace(/<c v="(.*?)">/g, '<span style="color: $1">')
                                    .replace(/<\/c>/g, '</span>')
                                }}
                            />
                            ))}
                        </div>
                        );
                    })()}
                    {isUnlocked && selectedId === 'nudge' && (
                        <ResizeHandle onResizeStart={() => handleFontResizeStart(content.prefixFontSize || 40)} onResize={(d) => handleFontResize(d, 'prefixFontSize')} />
                    )}
                    </div>
                    </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Currency Symbol (Rp) - Only for IDR */}
        {!isDlpHeader && getCurrencyLabel(content.discountType, content.customCurrency) && (
            <DraggableItem key="currencySymbol" id="currencySymbol" {...getPos('currencySymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'currencySymbol'} onClick={() => setSelectedId('currencySymbol')}>
                    <HighlightWrapper active={highlights?.currency1Diff} label="Currency Changed">
                    <div style={{ position: 'relative' }}>
                    <span className={`font-banner font-bold leading-none ${textShadowClass}`} 
                            style={{ 
                                fontSize: `${content.currencyFontSize || 36}px`,
                                color: content.discountAmountColor || '#FFFFFF' 
                            }}>
                            {getCurrencyLabel(content.discountType, content.customCurrency)}
                    </span>
                    {isUnlocked && selectedId === 'currencySymbol' && (
                        <ResizeHandle onResizeStart={() => handleFontResizeStart(content.currencyFontSize || 36)} onResize={(d) => handleFontResize(d, 'currencyFontSize')} />
                    )}
                    </div>
                    </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Unit Icon */}
        {!isDlpHeader && discountAmountText && content.unit && formData.discountEnabled !== false && (
            <DraggableItem key="unitIcon" id="unitIcon" {...getPos('unitIcon')} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'unitIcon'} onClick={() => setSelectedId('unitIcon')}>
                <HighlightWrapper active={highlights?.unit1Diff} label="Unit Changed">
                <div className="flex items-center justify-center rounded-full shadow-lg relative" 
                        style={{ 
                            width: getPos('unitIcon').width || 64, 
                            height: getPos('unitIcon').height || 64, 
                            backgroundColor: content.unitIconColor || '#FFD600' 
                        }}>
                    <span className="font-bold leading-none translate-y-[1px]" 
                            style={{ 
                                fontSize: `${((getPos('unitIcon').width || 64) / 64) * ((content.unit === 'K' || content.unit === '%') ? 34 : (content.unit === 'Rb' ? 28 : 24))}px`,
                                color: content.unitColor || unitBadgeAutoColor(formData) 
                            }}>
                            {getUnitLabel(content.unit)}
                    </span>
                    {isUnlocked && selectedId === 'unitIcon' && (
                        <ResizeHandle onResizeStart={() => handleContainerResizeStart(getPos('unitIcon').width || 64)} onResize={(d) => handleContainerResize(d, 'unitIcon')} />
                    )}
                </div>
                </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Second Discount Elements - Only shown when hasSecondDiscount is true */}
        {!isDlpHeader && content.hasSecondDiscount && formData.discountEnabled !== false && (
            <>
                {/* Plus Symbol */}
                <DraggableItem key="plusSymbol" id="plusSymbol" {...getPos('plusSymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'plusSymbol'} onClick={() => setSelectedId('plusSymbol')}>
                        <div style={{ position: 'relative' }}>
                        <span className={`font-banner font-bold leading-none ${textShadowClass}`} 
                                style={{ 
                                    fontSize: `${content.plusFontSize || 60}px`,
                                    color: content.discountAmountColor || '#FFFFFF' 
                                }}>
                                +
                        </span>
                        {isUnlocked && selectedId === 'plusSymbol' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.plusFontSize || 60)} onResize={(d) => handleFontResize(d, 'plusFontSize')} />
                        )}
                        </div>
                </DraggableItem>

                {/* Second Currency Symbol (Rp) - Only for IDR */}
                {getCurrencyLabel(content.secondDiscountType, content.secondCustomCurrency) && (
                    <DraggableItem key="secondCurrencySymbol" id="secondCurrencySymbol" {...getPos('secondCurrencySymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'secondCurrencySymbol'} onClick={() => setSelectedId('secondCurrencySymbol')}>
                            <HighlightWrapper active={highlights?.currency2Diff} label="2nd Currency Changed">
                            <div style={{ position: 'relative' }}>
                            <span className={`font-banner font-bold leading-none ${textShadowClass}`} 
                                    style={{ 
                                        fontSize: `${content.currencyFontSize || 36}px`,
                                        color: content.secondDiscountAmountColor || '#FFFFFF' 
                                    }}>
                                    {getCurrencyLabel(content.secondDiscountType, content.secondCustomCurrency)}
                            </span>
                            {isUnlocked && selectedId === 'secondCurrencySymbol' && (
                                <ResizeHandle onResizeStart={() => handleFontResizeStart(content.currencyFontSize || 36)} onResize={(d) => handleFontResize(d, 'currencyFontSize')} />
                            )}
                            </div>
                            </HighlightWrapper>
                    </DraggableItem>
                )}

                {/* Second Discount Amount - Same size as first discount */}
                <DraggableItem key="secondDiscountAmount" id="secondDiscountAmount" {...getPos('secondDiscountAmount')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'secondDiscountAmount'} onClick={() => setSelectedId('secondDiscountAmount')}>
                        <HighlightWrapper active={highlights?.amount2Diff} label="2nd Amount Changed">
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                        <span className={`font-banner font-extrabold tracking-[-10px] ${textShadowClass} leading-[0.8]`} 
                                style={{ fontSize: `${content.discountAmountFontSize || 180}px`, color: content.secondDiscountAmountColor || '#FFFFFF' }}>
                                {secondDiscountAmountText}
                        </span>
                        {isUnlocked && selectedId === 'secondDiscountAmount' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.discountAmountFontSize || 180)} onResize={(d) => handleFontResize(d, 'discountAmountFontSize')} />
                        )}
                        </div>
                        </HighlightWrapper>
                </DraggableItem>

                {/* Second Unit Icon - Same size as first unit */}
                {secondDiscountAmountText && content.secondDiscountUnit && (
                    <DraggableItem key="secondUnitIcon" id="secondUnitIcon" {...getPos('secondUnitIcon')} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'secondUnitIcon'} onClick={() => setSelectedId('secondUnitIcon')}>
                        <HighlightWrapper active={highlights?.unit2Diff} label="2nd Unit Changed">
                        <div className="flex items-center justify-center rounded-full shadow-lg relative" 
                                style={{ 
                                    width: getPos('secondUnitIcon').width || 64, 
                                    height: getPos('secondUnitIcon').height || 64, 
                                    backgroundColor: content.secondUnitIconColor || '#FFD600' 
                                }}>
                            <span className="font-bold leading-none translate-y-[1px]" 
                                    style={{ 
                                        fontSize: `${((getPos('secondUnitIcon').width || 64) / 64) * ((content.secondDiscountUnit === 'K' || content.secondDiscountUnit === '%') ? 34 : (content.secondDiscountUnit === 'Rb' ? 28 : 24))}px`,
                                        color: content.secondUnitColor || content.unitColor || unitBadgeAutoColor(formData) 
                                    }}>
                                    {getUnitLabel(content.secondDiscountUnit)}
                            </span>
                            {isUnlocked && selectedId === 'secondUnitIcon' && (
                                <ResizeHandle onResizeStart={() => handleContainerResizeStart(getPos('secondUnitIcon').width || 64)} onResize={(d) => handleContainerResize(d, 'secondUnitIcon')} />
                            )}
                        </div>
                        </HighlightWrapper>
                    </DraggableItem>
                )}
            </>
        )}

        {/* Product Icon */}
        {formData.productIcon && (
            <DraggableItem id="productIcon" {...getPos('productIcon')} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}}>
                <HighlightWrapper active={highlights?.productIconDiff} label="Product Icon Changed">
                <img src={formData.productIcon} className="object-contain drop-shadow-md" 
                        style={{ width: getPos('productIcon').width || 100, height: getPos('productIcon').height || 100 }} />
                </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Partner logo */}
        {formData.showPartnerLogo && (
            <div className="absolute right-0 z-20 pointer-events-none" style={{ top: `${(formData.partnerLogoY ?? getDefaultPartnerLogoY(formData)) * SQUARE_PARTNER_LOGO_SCALE}px`, transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-[17px] px-[20px] py-[7px]" style={{ borderRadius: '33px 0 0 33px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', background: formData.partnerLogoBgEnabled === false ? 'transparent' : (formData.partnerLogoBg ?? '#FFFFFF'), transform: `translateZ(0) scale(${formData.partnerLogoScale ?? getDefaultPartnerLogoScale(formData)})`, transformOrigin: 'top right' }}>
                    {formData.partnerLogos.slice(0, 3).map((slot, idx) => {
                        const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                        const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                        return (
                            <div key={slot.id || idx} className="h-[33px] min-w-[67px] max-w-[133px] flex items-center justify-center">
                                <img src={imgSrc} alt={slot.logo || "Partner"} className="h-full w-auto object-contain" style={{ transform: `scale(${(formData.partnerLogoAssetScale ?? 100) / 100})` }} crossOrigin="anonymous" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Campaign Logo — position/scale driven by the same formData.campaignLogo{X,Y,Scale}
            sliders as BannerLegacy (not the per-element drag system used by the other items here);
            the square canvas is native 600px, same unit the sliders already store, so no extra scale factor is needed. */}
        {formData.showCampaignLogo && (() => {
            const campaignPos = getPos('campaignLogo');
            const hasSavedCampaignPos = !!positions.campaignLogo;
            const campaignLogoX = formData.campaignLogoX ?? (hasSavedCampaignPos ? campaignPos.x : 20);
            const campaignLogoY = formData.campaignLogoY ?? (hasSavedCampaignPos ? campaignPos.y : (isDlpHeader ? getDefaultCampaignLogoY(formData) : campaignPos.y));
            const campaignLogoScale = formData.campaignLogoScale ?? 1.6;
            return (
                <div className="absolute z-20 pointer-events-none" style={{ top: `${campaignLogoY}px`, left: `${campaignLogoX}px` }}>
                    <HighlightWrapper active={highlights?.campaignLogoDiff} label="Campaign Logo Changed">
                    <div className="w-[86px] h-[43px] flex items-center justify-center" style={{ transform: `scale(${campaignLogoScale})`, transformOrigin: 'top left' }}>
                        <img src={formData.campaignLogo || exampleImage} alt="Campaign Logo" className="w-full h-full object-contain" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                    </div>
                    </HighlightWrapper>
                </div>
            );
        })()}
        
        {/* Additional Info (Label) */}
        {!isDlpHeader && content.additionalLabel && (
            <DraggableItem id="additionalInfo" {...getPos('additionalInfo')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'additionalInfo'} onClick={() => setSelectedId('additionalInfo')}>
                    <HighlightWrapper active={highlights?.additionalLabelDiff} label="Label Changed">
                    {content.additionalLabelType === 'Voucher' ? (
                    <div
                        className="inline-flex items-center gap-[8px] font-banner whitespace-nowrap relative"
                        style={{ borderRadius: '6px', padding: '8px 10px 6px', backgroundColor: content.additionalLabelBackgroundColor || '#FFFFFF', color: content.additionalLabelTextColor || '#007BFF' }}
                    >
                        <div className="font-normal leading-[1.15] text-left shrink-0" style={{ fontSize: `${(content.additionalLabelFontSize || 16) * 0.4}px` }}>
                            <div>{lang === 'id' ? 'Kode' : 'Promo'}</div>
                            <div>{lang === 'id' ? 'Promo:' : 'Code:'}</div>
                        </div>
                        <div className="self-stretch shrink-0 border-l border-dashed opacity-60" style={{ borderColor: 'currentColor' }} />
                        <div className="font-bold uppercase tracking-tight leading-[0.8]" style={{ fontSize: `${content.additionalLabelFontSize || 16}px` }}>
                            {renderHtml(content.additionalLabelText, "") || 'VOUCHERCODE'}
                        </div>
                        {isUnlocked && selectedId === 'additionalInfo' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.additionalLabelFontSize || 16)} onResize={(d) => handleFontResize(d, 'additionalLabelFontSize')} />
                        )}
                    </div>
                    ) : (
                    <div
                        className="font-bold px-[16px] py-[6px] rounded-[999px] tracking-wider font-banner shadow-sm whitespace-nowrap flex items-center justify-center relative"
                        style={{
                            fontSize: `${content.additionalLabelFontSize || 14}px`,
                            backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00',
                            color: content.additionalLabelTextColor || '#0064D2'
                        }}
                    >
                        {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                        {isUnlocked && selectedId === 'additionalInfo' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.additionalLabelFontSize || 14)} onResize={(d) => handleFontResize(d, 'additionalLabelFontSize')} />
                        )}
                    </div>
                    )}
                    </HighlightWrapper>
            </DraggableItem>
        )}

        {/* TNC - Dynamic Size */}
        {!isDlpHeader && content.termsAndCondition && (
            <DraggableItem id="tnc" {...getPos('tnc')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'tnc'} onClick={() => setSelectedId('tnc')}>
                    <HighlightWrapper active={highlights?.tncDiff} label="Terms Changed">
                    <div 
                        className="leading-[1.4] font-banner text-center whitespace-nowrap relative" 
                        style={{ 
                            fontSize: `${content.termsFontSize || 11}px`, 
                            color: content.termsColor || 'rgba(255,255,255,0.8)'
                        }}
                    >
                            {termsText}
                            {isUnlocked && selectedId === 'tnc' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.termsFontSize || 11)} onResize={(d) => handleFontResize(d, 'termsFontSize')} />
                            )}
                    </div>
                    </HighlightWrapper>
            </DraggableItem>
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
  );

  if (fullSize) {
    return (
        <div className={className} style={{ transform: `scale(${renderScale})`, transformOrigin: 'top left' }} ref={ref}>
            <div className="relative inline-block">
                {backgroundHighlight}
                {bannerContent}
            </div>
        </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[16px] w-full ${className || ''}`} style={{ transform: `scale(${renderScale})`, transformOrigin: 'top left' }} ref={ref}>
      {!hideHeader && (
      <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
        <div className="flex gap-[8px] items-center">
           <span className="text-[18px] leading-none shrink-0" role="img" aria-label={lang}>{lang === 'en' ? '🇺🇸' : '🇮🇩'}</span>
           <p className="text-[16px] font-bold leading-[22px] text-[#71747d]">{label}</p>
        </div>
      </div>
      )}

      {/* Scaled Canvas Wrapper - Centered */}
      <div className="flex justify-center w-full">
        <div style={{ width: '400px', height: '400px' /* Removed overflow: hidden to allow highlight to be seen */ }}>
          <div style={{ transform: `scale(${SCALE_FACTOR})`, transformOrigin: 'top left' }} className="relative inline-block">
             {backgroundHighlight}
             {bannerContent}
          </div>
        </div>
      </div>
    </div>
  );
});

BannerSquare.displayName = 'BannerSquare';