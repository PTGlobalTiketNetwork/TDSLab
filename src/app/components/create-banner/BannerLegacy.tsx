import { BannerFormData } from './types';
import { gradientStopsCss, DEFAULT_OVERLAY_GRADIENT_STOPS } from './components/GradientEditor';
import { FileText, CheckCircle, ChevronLeft, Share } from 'lucide-react';
import TdsIcOvalPlus from '../../../imports/TdsIcOvalPlus-2016-512';
import exampleImage from 'figma:asset/c593b610d3877a5faf067379a77363d554217a35.png';
import { forwardRef, useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import type { DiffHighlights } from '../../../utils/diffUtils';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { tagsToHtml, getCurrencyLabel, getUnitLabel, getDefaultPortraitContentOffsetY, getDefaultLandscapeContentScale, getDefaultPartnerLogoY, getDefaultPartnerLogoScale, getDefaultCampaignLogoY } from './utils/layoutUtils';
import { BoundingBox } from './components/BoundingBox';
import { ImageBox } from './components/ImageBox';
import { PolaroidCollage, isPolaroidTemplate, unitBadgeAutoColor } from './components/PolaroidCollage';

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
    isShimmering?: boolean;
    onFormChange?: (updates: Partial<BannerFormData>) => void;
    /** Render only the 2:1 content column (headline, benefit, labels) — used by the Desktop 5:1 banner so it shows the very same component. */
    contentOnly?: { width: number; center?: boolean; verticalCenter?: boolean };
    showPolaroidBadges?: boolean;
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
    isShimmering,
    onFormChange,
    contentOnly,
    showPolaroidBadges = true
}, ref) => {
  const content = formData.content[lang];
  // Text shadow on headline / benefit / labels: off unless the banner turns it on (applies to existing banners too)
  const textShadowClass = formData.textShadow === true ? 'drop-shadow-md' : '';
  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  
  const isTwoHeadlines = formData.headlineType === '2 Headlines';
  const defaultHeadlineSize = isTwoHeadlines ? 26 : 40;

  const defaults = {
      en: {
          headline: 'Headline Goes Here',
          subHeadline: 'Sub-headline Goes Here',
          secondHeadline: 'Second Headline Goes Here',
          labelDiscountText: 'Add Additional Perks',
          termsText: '*T&C apply',
      },
      id: {
          headline: 'Tulis Headline Disini',
          subHeadline: 'Tulis Sub-headline Disini',
          secondHeadline: 'Tulis Headline Kedua Disini',
          labelDiscountText: 'Tambahkan Additional Perks',
          termsText: '*S&K berlaku',
      }
  };

  const currentDefaults = defaults[lang];
  const headlineText = content.headline || currentDefaults.headline;
  const subHeadlineText = content.subHeadline || currentDefaults.subHeadline;
  const secondHeadlineText = content.secondHeadline || currentDefaults.secondHeadline;
  
  // Show the typed amount as-is; only fall back to the placeholder when empty, and only if the
  // currency isn't "None" (an empty amount with "None" currency means no nominal at all).
  const discountAmountText = content.discountAmount || (content.discountType === 'Non-IDR' ? '' : '50');
  const secondDiscountAmountText = content.secondDiscountAmount || (content.secondDiscountType === 'Non-IDR' ? '' : '0');
  const currencyLabel = getCurrencyLabel(content.discountType, content.customCurrency);
  const secondCurrencyLabel = getCurrencyLabel(content.secondDiscountType, content.secondCustomCurrency);
  
  // Additional Perks (labelDiscount)
  const labelDiscountText = content.labelDiscountText || currentDefaults.labelDiscountText;
  
  // Terms
  const termsText = content.termsText || currentDefaults.termsText;

  // --- Promo Banner Logic ---
  const ratioClasses = {
    'Landscape (2:1)': 'aspect-[2/1]',
    'Landscape (3:1)': 'aspect-[3/1]', // TTD Promo Asset: 2:1 layout cloned onto a wider canvas
    'Landscape (16:9)': 'aspect-[16/9]',
    'Square (1:1)': 'aspect-[1/1]',
    'Portrait (3:4)': 'aspect-[3/4]',
  };
  const currentRatioClass = formData.bannerRatio === 'Landscape (2:1)' ? 'aspect-[2/1]' : (formData.bannerRatio ? ratioClasses[formData.bannerRatio as keyof typeof ratioClasses] : 'aspect-[2/1]');

  const bgGradients: Record<string, string> = {
    'Hotel': 'linear-gradient(135deg, #FF6B6B 0%, #EE5D88 100%)',
    'Accom': 'linear-gradient(135deg, #FF6B6B 0%, #EE5D88 100%)',
    'Transport': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'Flight': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
    'NFT': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
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
  
  // Neutral grey behind the key visual for every banner, so nothing tints the artwork
  const containerBackground = '#e9ebef';

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '0,0,0';
  };

  const overlayColor = formData.overlayColor || '#000000';
  const rgb = hexToRgb(overlayColor);
  const opacityStart = (formData.gradientOpacity ?? 100) / 100;
  const isLandscape21ForOverlay = formData.bannerRatio === 'Landscape (2:1)' || formData.bannerRatio === 'Landscape (3:1)';
  const stopPos = formData.overlayGradientStop ?? (isLandscape21ForOverlay ? 20 : 10); // Start of the fade
  const stopEnd = formData.overlayGradientEnd ?? (isLandscape21ForOverlay ? 70 : 100); // Where it has faded out

  const overlaySolid = formData.overlayMode === 'solid';
  const solidOp = (formData.overlaySolidOpacity ?? 100) / 100;
  const solidCov = formData.overlaySolidCoverage ?? 50;
  const solidBg = (dir: string) => `linear-gradient(${dir}, rgba(${rgb},${solidOp}) 0%, rgba(${rgb},${solidOp}) ${solidCov}%, transparent ${solidCov}%)`;
  // Solid + gradient fill: the gradient sits on its own Coverage-sized block so the hard edge survives
  const solidGrad = overlaySolid && formData.overlaySolidFill === 'gradient';
  const solidGradEl = (anchor: React.CSSProperties) => <div className="absolute" style={{ ...anchor, background: gradientStopsCss(formData.overlaySolidGradientStops ?? DEFAULT_OVERLAY_GRADIENT_STOPS, formData.overlaySolidGradientType, formData.overlaySolidGradientAngle ?? 90), opacity: solidOp }} />;
  const gradientStyle = {
      background: solidGrad ? 'none' : overlaySolid ? solidBg('90deg') : `linear-gradient(90deg, rgba(${rgb},${opacityStart}) 0%, rgba(${rgb},${opacityStart}) ${stopPos}%, rgba(${rgb},0) ${Math.max(stopPos + 1, stopEnd)}%)`,
      transform: 'translateZ(0)', // Fix Safari stacking context
  };
  // Optional second overlay layer: same colour and opacity, its own stop position
  const opacity2 = (formData.overlay2Opacity ?? 100) / 100;
  const gradientStyle2 = {
      background: `linear-gradient(90deg, rgba(${rgb},${opacity2}) 0%, rgba(${rgb},${opacity2}) ${formData.overlayGradientStop2 ?? 40}%, rgba(${rgb},0) ${Math.max((formData.overlayGradientStop2 ?? 40) + 1, formData.overlayGradientEnd2 ?? 100)}%)`,
      transform: 'translateZ(0)',
  };

  const renderHtml = (text: string | undefined, className: string, style?: React.CSSProperties) => {
    if (!text) return null;
    // Trailing newlines (even inside closing tags) would render as an empty extra line.
    const trimmed = text.replace(/\s+$/, '');
    if (!trimmed) return null;
    const htmlContent = tagsToHtml(trimmed, 'font-style: italic; display: inline-block; transform: skewX(-10deg); transform-origin: 0 100%;')
      .replace(/(?:\s|<br\/>)+((?:<\/span>\s*)*)$/, '$1');
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

  const isLandscape21 = formData.bannerRatio === 'Landscape (2:1)' || formData.bannerRatio === 'Landscape (3:1)';
  // Landscape logo defaults (original): 16px, 100%
  const lgPos = 16;
  const lgScale = 1;

  /**
   * Nudge label (prefix) next to / above the discount number.
   * `which` picks the first or second discount's nudge. In portrait the two-line presets are
   * not nudged with translateY, so the block centers cleanly against the number.
   */
  // `inline`: the same per-word styles on one centered row (nudge placed above the number)
  const renderLeftColumn = (fontScale = 1, forPortrait = false, which: 'first' | 'second' = 'first', inline = false) => {
    if (content.showPrefix === false) return null;
    const isSecond = which === 'second';
    const text = isSecond ? content.secondBenefitPrefix : content.mainBenefitPrefix;
    const pt = isSecond ? content.secondPrefixType : content.prefixType;
    const label = isSecond ? secondCurrencyLabel : currencyLabel;
    if (!text) return null;

    const lowerText = text.toLowerCase().trim();
    const lines = text.split('\n');
    const shouldAlignBottom = lines.length > 1;
    let contentNode;

    // Portrait nudge defaults to brand yellow (the picker overrides it); the second line (up to / from) stays white
    const styled = forPortrait || isLandscape21; // new nudge style: yellow headline word, white up to / from, 95% spacing
    const color = (isSecond ? (content.secondPrefixColor ?? content.prefixColor) : content.prefixColor) || (styled ? '#FEDD00' : 'white');
    const fs = Math.round(18 * fontScale);
    // Portrait presets default to 95% line spacing
    const lh = (forPortrait || isLandscape21) ? Math.round(fs * 0.95) : Math.round(22 * fontScale);
    const tyUp = (forPortrait || isLandscape21) ? 0 : Math.round(6 * fontScale); // the old 6px nudge on the first line made 2:1 lines overlap
    const base = 'font-banner';
    const line = (t: string, weight: 'bold' | 'normal', extra: React.CSSProperties = {}, first = false) => (
      <span
        className={`${weight === 'bold' ? 'font-bold' : 'font-normal'} ${base}`}
        style={{ color, fontSize: `${fs}px`, lineHeight: `${lh}px`, display: inline ? 'inline-block' : 'block', whiteSpace: 'nowrap', ...(first && tyUp && !inline ? { transform: `translateY(${tyUp}px)` } : {}), ...extra }}
      >{t}</span>
    );

    if (pt !== 'custom' && (lowerText === 'discount' || lowerText === 'diskon')) {
        contentNode = line(text, 'bold');
    } else if (pt !== 'custom' && (lowerText === 'discount up to' || lowerText === 'diskon hingga')) {
        const [w1, ...rest] = text.split(' ');
        contentNode = (<>{line(w1, 'bold', {}, true)}{line(rest.join(' '), 'normal', { color: 'white' })}</>);
    } else if (pt !== 'custom' && (lowerText === 'up to' || lowerText === 'hingga')) {
        contentNode = line(text, 'normal', styled ? { color: 'white' } : {});
    } else if (pt !== 'custom' && (lowerText === 'start from' || lowerText === 'mulai dari')) {
        // "Start" / "Mulai" bold, "from" / "dari" regular
        const [w1, ...rest] = text.split(' ');
        contentNode = (<>{line(w1, 'bold', {}, true)}{line(rest.join(' '), 'normal', styled ? { color: 'white' } : {})}</>);
    } else if (pt === 'instant_cashback') {
        const fontStyle: React.CSSProperties['fontStyle'] = lang === 'id' ? 'italic' : 'normal';
        contentNode = (<>{line('Instant', 'bold', { fontStyle }, true)}{line('cashback', 'bold', { fontStyle })}</>);
    } else if (pt === 'instant_cashback_upto') {
        const isID = lang === 'id';
        const fontStyle: React.CSSProperties['fontStyle'] = isID ? 'italic' : 'normal';
        const tight = { lineHeight: `${(forPortrait || isLandscape21) ? Math.round(fs * 0.95) : fs}px` };
        contentNode = (<>
            {line('Instant', 'bold', { fontStyle, ...tight }, true)}
            {line('cashback', 'bold', { fontStyle, ...tight })}
            {line(isID ? 'hingga' : 'up to', 'normal', { color: 'white', ...tight })}
        </>);
    } else {
        const isCustom = pt === 'custom' || pt === 'buy_x_get_y';
        const customSize = (content.prefixFontSize || 20) * fontScale;
        const isMultiline = lines.length >= 4;

        // Render the whole value at once: tags may span line breaks (e.g. <i>+ instant\ncashback</i>)
        contentNode = (
            <span
                className={`${base} ${contentOnly?.center ? 'text-center' : 'text-left'} whitespace-nowrap block`}
                style={{
                    color,
                    fontSize: isCustom ? `${customSize}px` : `${fs}px`,
                    lineHeight: isCustom ? (typeof content.prefixLineHeight === 'number' ? content.prefixLineHeight / 100 : '1.2') : `${lh}px`,
                }}
                dangerouslySetInnerHTML={{ __html: tagsToHtml(text) }}
            />
        );

        const rpFs = Math.round(15 * fontScale);
        const rpLh = Math.round(16 * fontScale);
        if (!forPortrait && isMultiline && label) {
            return (
                <div className="flex items-start gap-[4px] h-auto self-stretch text-left">
                    <div className="flex flex-col items-start self-end translate-y-[2px] mt-[0px] mr-[0px] mb-[6px] ml-[0px]">{contentNode}</div>
                    <span className={`font-bold ${textShadowClass} font-banner`} style={{ color, fontSize: `${rpFs}px`, lineHeight: `${rpLh}px`, marginTop: `${Math.round(6 * fontScale)}px`, marginLeft: `${Math.round(6 * fontScale)}px` }}>{label}</span>
                </div>
            );
        }
    }

    if (inline) {
      return <div className="flex flex-row flex-wrap items-baseline justify-center text-center" style={{ columnGap: `${Math.round(fs * 0.25)}px` }}>{contentNode}</div>;
    }

    if (forPortrait || isLandscape21) {
      // Currency is rendered next to the number (value group), so the prefix column holds text only
      return <div className="flex flex-col items-start justify-center">{contentNode}</div>;
    }

    return (
        <div className={`flex flex-col justify-end h-auto self-stretch ${contentOnly?.center ? 'items-center text-center' : 'items-end text-left'}`}>
            <div className={`flex flex-col mt-[0px] mr-[0px] mb-[6px] ml-[0px] ${contentOnly?.center ? 'items-center' : 'items-start'} ${shouldAlignBottom ? 'self-end' : ''}`} style={{ transform: `translateY(${Math.round(2 * fontScale)}px)` }}>{contentNode}</div>
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

  // Benefit block (nudge + number(s) + unit). `cs` = overall scale, `rowMax` = max row width in px (two-benefit fit),
  // `bleed` = how far the row may run past its container's padding.
  const renderBenefit = (cs: number, rowMax: number, bleed: number, align: 'center' | 'start' = 'center') => {
                      const amountBase = (content.discountAmountFontSize || 80) * 2;
                      const hasPrefix = !!content.mainBenefitPrefix && content.showPrefix !== false;

                      // One "currency + number + unit" group. `fit` shrinks the group so two benefits fit the canvas.
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

                      // Same preset bold/regular split as everywhere else (renderLeftColumn), just centered above the number instead of stacked to its left.
                      const renderTopLabel = (which: 'first' | 'second', s: number) => renderLeftColumn(2 * s, true, which, true);

                      if (!content.hasSecondDiscount && formData.nudgeOnTop) {
                        // Option: nudge centered above the number (same style as the two-benefit labels) — always
                        // centered regardless of `align`, since this composition only reads correctly centered.
                        return (
                          <div className="flex flex-col items-center w-full" style={{ marginTop: `${16 * cs}px` }}>
                            {hasPrefix && renderLeftColumn(2 * cs, true, 'first', true)}
                            <div style={{ marginTop: `${22 * cs}px` }}>{renderValue('first')}</div>
                          </div>
                        );
                      }

                      if (!content.hasSecondDiscount) {
                        // Label on the left, vertically centered against the number
                        return (
                          <div className="flex items-center justify-center" style={{ gap: `${12 * cs}px`, marginTop: `${16 * cs}px` }}>
                            {hasPrefix && renderLeftColumn(2 * cs, true)}
                            {renderValue('first')}
                          </div>
                        );
                      }

                      // Two benefits (Figma 80:430): label centered above each number, "+" between the numbers.
                      // Estimate the row width and shrink everything so it fits the canvas (12px edge padding).
                      const groupWidth = (cur: string, amount: string, unit?: string) =>
                        (cur ? cur.length * 18 + 4 : 0) + amount.length * (amountBase * 0.62 - 8) + (unit ? 44 : 0);
                      // The nudge label above each number can be wider than the number itself — count it too
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

                      // Pull the numbers up so the visible gap between the label and the digits is ~4px (the number's line box has built-in space above the glyphs)
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

  if (isPortrait) {
    return (
      <div className="flex justify-center w-full">{/* centers the fixed 360px banner in the Preview panel */}
      <div className={`flex flex-col gap-[8px] flex-shrink-0 ${className || ''}`} style={{ width: '360px', transform: `scale(${renderScale || 1})`, transformOrigin: 'top left' }} ref={ref}>
        {!hideHeader && (
          <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
            <div className="flex gap-[8px] items-center">
              <span className="text-[18px] leading-none shrink-0" role="img" aria-label={lang}>{lang === 'en' ? '🇺🇸' : '🇮🇩'}</span>
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
          <div data-canvas-w="720" style={{ position: 'absolute', top: 0, left: 0, width: '720px', height: '960px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
          <div className="relative w-full h-full isolate" style={{ background: containerBackground }}>
            {/* Background image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              {thumbnailUrl && !isImageLoaded && (
                <img src={thumbnailUrl} alt="Loading preview" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'blur(20px)', transform: 'scale(1.1)', willChange: 'filter, transform' }} draggable={false} crossOrigin="anonymous" />
              )}
              {!thumbnailUrl && !isImageLoaded && (
                <Skeleton className="w-full h-full absolute inset-0 z-0" />
              )}
              {isDraggable && !!onFormChange && !isPlaceholder ? (
                <ImageBox
                  wrapperStyle={imageStyle}
                  position={position} scale={scale}
                  onPositionChange={(p) => onFormChange({ keyVisualPosition: p })}
                  onScaleChange={(s) => onFormChange({ keyVisualScale: s })}
                >
                  <img
                    src={currentDisplayImage}
                    alt="Background"
                    style={{ display: 'block', width: 'auto', minWidth: '100%', height: 'auto', maxWidth: 'none', opacity: isImageLoaded ? 1 : 0, transition: 'opacity 500ms ease-in-out' }}
                    draggable={false}
                    crossOrigin="anonymous"
                    onLoad={() => setInternalImageLoaded(true)}
                  />
                </ImageBox>
              ) : (
              <img
                src={currentDisplayImage}
                alt="Background"
                style={{ ...imageStyle, opacity: isImageLoaded ? 1 : 0, transition: 'opacity 500ms ease-in-out', willChange: 'opacity' }}
                draggable={false}
                crossOrigin="anonymous"
                onLoad={() => setInternalImageLoaded(true)}
              />
              )}
            </div>

            {/* Gradient overlay — same controls as 2:1, direction bottom-to-top */}
            <div className="absolute bottom-0 left-0 right-0 h-[640px] z-10 pointer-events-none" style={{ background: solidGrad ? 'none' : overlaySolid ? solidBg('to top') : `linear-gradient(to top, rgba(${rgb},${opacityStart}) 0%, rgba(${rgb},${opacityStart}) ${stopPos}%, rgba(${rgb},0) ${Math.max(stopPos + 1, stopEnd)}%)`, transform: 'translateZ(0)' }}>{solidGrad && solidGradEl({ left: 0, right: 0, bottom: 0, height: `${solidCov}%` })}</div>
            {/* DLP Header mobile: iOS status bar + transparent top bar (joy-proto `status-bar/ios` + `top-transparent/icons`), built at 360 logical px and scaled 2x */}
            {formData.dlpRole === 'header-mobile' && formData.dlpNavbar !== false && (
              <div data-dlp-navbar className="absolute top-0 left-0 z-20 pointer-events-none" style={{ width: 360, transform: 'scale(2)', transformOrigin: 'top left', fontFamily: 'inherit' }}>
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
            {formData.overlay2Enabled && !overlaySolid && <div className="absolute bottom-0 left-0 right-0 h-[640px] z-10 pointer-events-none" style={{ background: `linear-gradient(to top, rgba(${rgb},${opacity2}) 0%, rgba(${rgb},${opacity2}) ${formData.overlayGradientStop2 ?? 40}%, rgba(${rgb},0) ${Math.max((formData.overlayGradientStop2 ?? 40) + 1, formData.overlayGradientEnd2 ?? 100)}%)`, transform: 'translateZ(0)' }} />}

            {/* Partner logo */}
            {formData.showPartnerLogo && (
              <div className="absolute right-0 z-20 pointer-events-none" style={{ top: `${formData.partnerLogoY ?? getDefaultPartnerLogoY(formData)}px`, transform: 'translateZ(0)' }}>
                <div className="flex items-center gap-[20px] px-[24px] py-[8px]" style={{ borderRadius: '40px 0 0 40px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', background: formData.partnerLogoBgEnabled === false ? 'transparent' : (formData.partnerLogoBg ?? '#FFFFFF'), transform: `translateZ(0) scale(${formData.partnerLogoScale ?? getDefaultPartnerLogoScale(formData)})`, transformOrigin: 'top right' }}>
                  {formData.partnerLogos.slice(0, 3).map((slot, idx) => {
                    const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                    const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                    return (
                      <div key={slot.id || idx} className="h-[40px] min-w-[80px] max-w-[160px] flex items-center justify-center">
                        <img src={imgSrc} alt={slot.logo || "Partner"} className="h-full w-auto object-contain" style={{ transform: `scale(${(formData.partnerLogoAssetScale ?? 100) / 100})` }} crossOrigin="anonymous" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Campaign logo */}
            {formData.showCampaignLogo && (
              <div className="absolute z-20 pointer-events-none" style={{ top: `${(formData.campaignLogoY ?? getDefaultCampaignLogoY(formData)) * 1.2}px`, left: `${(formData.campaignLogoX ?? 20) * 1.2}px`, transformOrigin: 'top left' }}>
                <div className="w-[86px] h-[43px] flex items-center justify-center" style={{ transform: `scale(${formData.campaignLogoScale ?? 1.6})`, transformOrigin: 'top left' }}>
                  <img src={formData.campaignLogo || exampleImage} alt="Campaign Logo" className="w-full h-full object-contain" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                </div>
              </div>
            )}

            {/* Portrait content — auto-layout column, 20px from canvas bottom, 24px gaps */}
            {(() => {
              const cs = (formData.portraitContentScale ?? 120) / 100;
              const defaultContentOffsetY = getDefaultPortraitContentOffsetY(formData, content);
              return (
                <div
                  className="absolute left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-[48px]"
                  style={{ bottom: '40px', gap: '0px' }}
                >
                  {/* Main content block — headline + benefit + labels, all scaled by cs */}
                  <BoundingBox
                    enabled={!!onFormChange}
                    className="flex flex-col items-center w-full"
                    style={{ gap: `${4 * cs}px`, transform: `translateY(${formData.portraitContentOffsetY ?? defaultContentOffsetY}px)` }}
                    offsetY={formData.portraitContentOffsetY ?? defaultContentOffsetY} offsetUnit={1} offsetMin={-200} offsetMax={200}
                    onOffsetChange={(v) => onFormChange?.({ portraitContentOffsetY: v })}
                    scale={formData.portraitContentScale ?? 120} scaleMin={60} scaleMax={200}
                    onScaleChange={(v) => onFormChange?.({ portraitContentScale: v })}
                  >
                    {/* Headline */}
                    <h3
                      className={`${textShadowClass} font-banner font-bold leading-[1.1] text-center w-full ${isTwoHeadlines ? 'line-clamp-2 break-words' : ''}`}
                      style={{ fontSize: `${(content.headlineFontSize || defaultHeadlineSize) * 2 * cs}px`, color: content.headlineColor || '#FEDD00' }}
                    >
                      {renderHtml(headlineText, "")}
                    </h3>

                    {/* Sub-headline / 2nd headline */}
                    {secondLineText && formData.headlineType !== '1 Headline' && (
                      <h3
                        className={`${textShadowClass} font-banner font-bold text-center w-full ${isTwoHeadlines ? 'leading-[1.1] line-clamp-2 break-words' : ''}`}
                        style={{ fontSize: isTwoHeadlines ? `${(content.headlineFontSize || defaultHeadlineSize) * 2 * cs}px` : `${(content.subHeadlineFontSize || 18) * 2 * cs}px`, color: content.subHeadlineColor || 'white' }}
                      >
                        {renderHtml(secondLineText, "")}
                      </h3>
                    )}

                    {/* Nudge / benefit row */}
                    {!isTwoHeadlines && formData.discountEnabled !== false && renderBenefit((formData.portraitContentScale ?? 120) / 100 * ((formData.portraitBenefitScale ?? 100) / 100), 720 - 12 * 2, 36)}

                    {/* Label discount */}
                    {content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${12 * cs}px`, marginTop: isTwoHeadlines ? `${28 * cs}px` : `${4 * cs}px` }}>
                        {content.labelDiscountType === 'With icon' && (
                          <div style={{ width: `${32 * cs}px`, height: `${32 * cs}px`, '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
                        )}
                        <div className={`font-bold ${textShadowClass} font-banner text-center`} style={{ fontSize: `${(content.labelDiscountFontSize || 28) * cs}px`, color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "")}</div>
                      </div>
                    )}

                    {/* Additional label */}
                    {content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
                      content.additionalLabelType === 'Voucher' ? (
                        <div className="inline-flex items-center font-banner" style={{ gap: `${8 * cs}px`, borderRadius: `${6 * cs}px`, padding: `${8 * cs}px ${10 * cs}px ${6 * cs}px`, marginTop: `${16 * cs}px`, backgroundColor: content.additionalLabelBackgroundColor || '#FFFFFF', color: content.additionalLabelTextColor || '#007BFF' }}>
                          <div className="font-normal leading-[1.15] text-left shrink-0" style={{ fontSize: `${(content.additionalLabelFontSize || 16) * 0.4 * cs}px` }}>
                            <div>{lang === 'id' ? 'Kode' : 'Promo'}</div>
                            <div>{lang === 'id' ? 'Promo:' : 'Code:'}</div>
                          </div>
                          <div className="font-bold uppercase tracking-tight leading-[0.8] whitespace-nowrap" style={{ fontSize: `${(content.additionalLabelFontSize || 16) * cs}px` }}>
                            {renderHtml(content.additionalLabelText, "") || 'VOUCHERCODE'}
                          </div>
                        </div>
                      ) : (
                      <div className="font-bold tracking-wider font-banner shadow-sm" style={{ fontSize: `${24 * cs}px`, borderRadius: '999px', padding: `${8 * cs}px ${24 * cs}px`, marginTop: `${16 * cs}px`, backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00', color: content.additionalLabelTextColor || '#0064D2' }}>
                        {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                      </div>
                      )
                    )}
                  </BoundingBox>

                  {/* CTA Button — fixed size (not affected by content scale) */}
                  {formData.showPortraitCta && formData.dlpRole !== 'header-mobile' && (() => {
                    const widthMode = formData.portraitCtaWidthMode ?? 'fixed';
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
                  {/* When T&C is off it is only hidden (visibility), so the content keeps the same position */}
                  <div className="text-center w-full" style={{ marginTop: formData.showPortraitCta && formData.dlpRole !== 'header-mobile' ? '24px' : '32px', visibility: content.termsAndCondition ? 'visible' : 'hidden' }}>
                    <div className="font-banner leading-[1.4]" style={{ fontSize: `${(content.termsFontSize || 11) * 2}px`, color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
                  </div>
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
      </div>
    );
  }

  // The 2:1 content column (headline, nudge/benefit, labels). Shared with the Desktop 5:1 banner via `contentOnly`.
  const landscapeContent = (
                 <BoundingBox
                     enabled={isLandscape21 && !!onFormChange}
                     style={isLandscape21 ? { transform: `translateY(${(formData.portraitContentOffsetY ?? getDefaultPortraitContentOffsetY(formData, content)) / 2}px) scale(${(formData.landscapeContentScale ?? getDefaultLandscapeContentScale(formData)) / 100})`, transformOrigin: 'left center' } : undefined}
                     selfScale={(formData.landscapeContentScale ?? getDefaultLandscapeContentScale(formData)) / 100}
                     className={`${contentOnly?.center ? '[&_h3]:!text-center' : ''} ${contentOnly?.verticalCenter ? '!mt-0' : ''} flex flex-col ${contentOnly?.center ? 'items-center' : 'items-start'} gap-[2px] w-full mr-[0px] mb-[0px] ml-[0px] ${formData.headlineType === '1 Headline' ? (formData.discountEnabled === false ? 'mt-[0px]' : content.hasSecondDiscount ? 'mt-[26px]' : 'mt-[32px]') : formData.headlineType === 'With Sub-Headline' ? (formData.discountEnabled === false ? 'mt-[0px]' : 'mt-[12px]') : 'mt-[12px]'}`}
                     offsetY={formData.portraitContentOffsetY ?? getDefaultPortraitContentOffsetY(formData, content)} offsetUnit={2} offsetMin={-200} offsetMax={200}
                     onOffsetChange={(v) => onFormChange?.({ portraitContentOffsetY: v })}
                     scale={formData.landscapeContentScale ?? getDefaultLandscapeContentScale(formData)} scaleMin={60} scaleMax={200}
                     onScaleChange={(v) => onFormChange?.({ landscapeContentScale: v })}
                   >
                     <HighlightWrapper active={highlights?.headlineDiff} label="Headline Changed">
                       <>
                         {headlineText && (
                             <h3 className={`${textShadowClass} font-banner font-bold leading-[1.1] mb-[0px] text-left ${formData.headlineType !== '1 Headline' ? 'mt-[4px]' : 'mt-[-4px]'} ${isTwoHeadlines ? 'line-clamp-2 w-full break-words' : ''}`} style={{ fontSize: `${content.headlineFontSize || defaultHeadlineSize}px`, color: content.headlineColor || '#FEDD00' }}>
                                 {renderHtml(headlineText, "")}
                             </h3>
                         )}
                         {secondLineText && formData.headlineType !== '1 Headline' && (
                            <h3 className={`${textShadowClass} font-banner font-bold text-left ${isTwoHeadlines ? 'leading-[1.1] mt-[4px] line-clamp-2 w-full break-words' : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[2px]' : '-mt-[4px]')}`} style={{ fontSize: isTwoHeadlines ? `${content.headlineFontSize || defaultHeadlineSize}px` : `${content.subHeadlineFontSize || 18}px`, color: content.subHeadlineColor || 'white' }}>
                                {renderHtml(secondLineText, "")}
                            </h3>
                         )}
                       </>
                     </HighlightWrapper>
                     {!isTwoHeadlines && !(formData.discountEnabled === false && !renderLeftColumn()) && (
                     <HighlightWrapper active={highlights?.nudgeDiff} label="Nudge Changed">
                       {isLandscape21 && (content.hasSecondDiscount || formData.nudgeOnTop) ? renderBenefit(0.5 * ((formData.portraitBenefitScale ?? 100) / 100), contentOnly ? contentOnly.width - 40 : 290, 0, contentOnly?.center ? 'center' : 'start') : (
                       // `zoom` (not `transform: scale`) so the scaled size also affects layout flow — otherwise the
                       // Additional Perks row below stays positioned for the UNSCALED height and the spacing between
                       // them never adjusts as portraitBenefitScale changes.
                       <div style={isLandscape21 ? { zoom: (formData.portraitBenefitScale ?? 100) / 100 } as React.CSSProperties : undefined}>
                       <div className={`flex ${content.mainBenefitPrefix && content.showPrefix !== false ? 'items-stretch' : 'items-baseline'} gap-[4px] ${formData.headlineType === '1 Headline' ? (content.hasSecondDiscount ? 'mt-[-4px]' : 'mt-[16px]') : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[10px]' : 'mt-[-6px]')}`}>
                         {renderLeftColumn()}
                         {formData.discountEnabled !== false && (
                         <div className="relative flex items-end">
                             {currencyLabel && !(content.prefixType === 'custom' && (content.mainBenefitPrefix || '').split('\n').length >= 4 && content.showPrefix !== false) && (
                                <span className={`text-[15px] font-bold ${textShadowClass} font-banner self-start mr-[2px] ml-[4px] ${formData.headlineType === '1 Headline' ? (content.hasSecondDiscount ? 'mt-[-4px]' : 'mt-[-10px]') : (formData.headlineType === 'With Sub-Headline' && !content.hasSecondDiscount ? 'mt-[0px]' : 'mt-[14px]')}`} style={{ color: content.discountAmountColor || 'white' }}>{currencyLabel}</span>
                             )}
                             {discountAmountText && <span className={`text-[80px] font-extrabold tracking-[-4px] ${textShadowClass} font-banner leading-[66px] ml-[4px] mt-[0px]`} style={{ color: content.discountAmountColor || 'white' }}>{discountAmountText}</span>}
                             {discountAmountText && content.unit && (
                                 content.unitDisplayType === 'icon' ? (
                                     <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 mt-[0px] mr-[0px] ml-[0px] ${content.unit === 'mio' ? (content.hasSecondDiscount ? 'w-[30px] h-[30px] mb-[9px] translate-x-[-4px]' : 'w-[30px] h-[30px] mb-[9px] ' + (formData.headlineType === '1 Headline' || formData.headlineType === 'With Sub-Headline' ? 'translate-x-[-2px]' : 'translate-x-[4px]')) : 'w-[24px] h-[24px] mb-[9px]'}`} style={{ backgroundColor: content.unitIconColor || '#FEE645', marginLeft: '-6px' }}>
                                         <span className="text-[15px] font-bold font-banner leading-none translate-y-[1px]" style={{ color: content.unitColor || unitBadgeAutoColor(formData) }}>{getUnitLabel(content.unit)}</span>
                                     </div>
                                 ) : (
                                     <span className={`text-[24px] font-bold ${textShadowClass} font-banner ml-[2px] mb-[4px]`} style={{ color: content.unitColor || 'white' }}>{getUnitLabel(content.unit)}</span>
                                 )
                             )}
                             {content.hasSecondDiscount && (
                                 <>
                                     <span className={`text-[48px] font-bold ${textShadowClass} font-banner mb-[8px] mr-[3px] ${content.unitDisplayType === 'icon' ? 'ml-[1px]' : 'ml-[4px]'}`} style={{ color: content.discountAmountColor || 'white' }}>+</span>
                                     {secondCurrencyLabel && (
                                         <span className={`text-[15px] font-bold ${textShadowClass} font-banner self-start mr-[2px] ml-[4px] ${formData.headlineType === '1 Headline' ? 'mt-[4px]' : 'mt-[10px]'}`} style={{ color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>{secondCurrencyLabel}</span>
                                     )}
                                     {secondDiscountAmountText && <span className={`text-[80px] font-extrabold tracking-[-4px] ${textShadowClass} font-banner leading-[66px]`} style={{ color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>{secondDiscountAmountText}</span>}
                                     {secondDiscountAmountText && content.secondDiscountUnit && (
                                         content.secondUnitDisplayType === 'icon' ? (
                                              <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 mt-[0px] mr-[8px] ml-[0px] ${content.secondDiscountUnit === 'mio' ? 'w-[30px] h-[30px] mb-[9px] translate-x-[0px]' : 'w-[24px] h-[24px] mb-[9px]'}`} style={{ backgroundColor: content.secondUnitIconColor || 'white', marginBottom: '8px', position: 'relative', top: '-2px', left: '-8px' }}>
                                                  <span className="text-[15px] font-bold font-banner leading-none translate-y-[1px]" style={{ color: content.secondUnitColor || content.unitColor || unitBadgeAutoColor(formData) }}>{getUnitLabel(content.secondDiscountUnit)}</span>
                                              </div>
                                         ) : (
                                              <span className={`text-[24px] font-bold ${textShadowClass} font-banner ml-[2px] mb-[2px]`} style={{ color: content.secondUnitColor || content.unitColor || 'white' }}>{getUnitLabel(content.secondDiscountUnit)}</span>
                                         )
                                     )}
                                 </>
                             )}
                         </div>
                         )}
                       </div>
                     </div>
                       )}
                     </HighlightWrapper>
                     )}
                     <HighlightWrapper active={highlights?.labelDiscountDiff} label="Additional Perks Changed">
                      {content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
                          <div className={`flex items-center gap-[6px] ${isTwoHeadlines ? 'mt-[14px]' : 'mt-[2px]'}`}>
                             {content.labelDiscountType === 'With icon' && (
                                 <div className="w-[16px] h-[16px]" style={{ '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
                             )}
                             <div className={`font-bold ${textShadowClass} font-banner`} style={{ fontSize: `${content.labelDiscountFontSize || 14}px`, color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "", { transform: 'translateY(0)' })}</div>
                          </div>
                      )}
                     </HighlightWrapper>
                     <HighlightWrapper active={highlights?.additionalLabelDiff} label="Additional Label Changed">
                      {content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
                          content.additionalLabelType === 'Voucher' ? (
                          <div
                             className="inline-flex items-center gap-[8px] font-banner mt-[8px]"
                             style={{ borderRadius: '6px', padding: '8px 10px 6px', backgroundColor: content.additionalLabelBackgroundColor || '#FFFFFF', color: content.additionalLabelTextColor || '#007BFF' }}
                          >
                             <div className="font-normal leading-[1.15] text-left shrink-0" style={{ fontSize: `${(content.additionalLabelFontSize || 16) * 0.4}px` }}>
                                 <div>{lang === 'id' ? 'Kode' : 'Promo'}</div>
                                 <div>{lang === 'id' ? 'Promo:' : 'Code:'}</div>
                             </div>
                             <div className="font-bold uppercase tracking-tight leading-[0.8] whitespace-nowrap" style={{ fontSize: `${content.additionalLabelFontSize || 16}px` }}>
                                 {renderHtml(content.additionalLabelText, "") || 'VOUCHERCODE'}
                             </div>
                          </div>
                          ) : (
                          <div
                             className={`text-[12px] font-bold px-[12px] py-[4px] rounded-[999px] tracking-wider font-banner shadow-sm mt-[8px]`}
                             style={{
                                 backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00',
                                 color: content.additionalLabelTextColor || '#0064D2'
                             }}
                          >
                             {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
                          </div>
                          )
                      )}
                     </HighlightWrapper>
                     {/* 2:1 CTA — same settings as the 3:4 CTA (colours, width mode); sizes are half of the 720px canvas values */}
                     {isLandscape21 && formData.showPortraitCta && (
                         <div
                             className="flex items-center justify-center font-bold font-banner whitespace-nowrap"
                             style={{
                                 backgroundColor: formData.ctaButtonColor || '#007BFF',
                                 color: formData.ctaTextColor || '#FFFFFF',
                                 fontSize: `${16 * ((formData.landscapeCtaScale ?? 80) / 100)}px`,
                                 borderRadius: `${8 * ((formData.landscapeCtaScale ?? 80) / 100)}px`,
                                 padding: `${12 * ((formData.landscapeCtaScale ?? 80) / 100)}px ${24 * ((formData.landscapeCtaScale ?? 80) / 100)}px`,
                                 marginTop: '12px',
                                 ...((formData.portraitCtaWidthMode ?? 'fixed') === 'fixed' ? { width: `${((formData.portraitCtaFixedWidth ?? 360) / 2) * ((formData.landscapeCtaScale ?? 80) / 100)}px` } : {}),
                             }}
                         >
                             {content.ctaText || (lang === 'en' ? 'Book Now' : 'Pesan Sekarang')}
                         </div>
                     )}
                     {formData.bannerStyle === 'Style 3 (Flagship/big campaign)' && (
                         <div className="mt-[16px] h-[36px] px-[20px] bg-[#0064D2] rounded-full text-white text-[14px] font-bold flex items-center shadow-lg cursor-default">Book Now</div>
                     )}
                 </BoundingBox>
  );

  if (contentOnly) {
    return (
      <div ref={ref} className="flex flex-col justify-center" style={{ width: contentOnly.width, height: 300, padding: '15px 20px', alignItems: contentOnly.center ? 'center' : 'flex-start' }}>
        {landscapeContent}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[8px] w-[600px] flex-shrink-0 ${className || ''}`} style={{ transform: `scale(${renderScale})`, transformOrigin: 'top left' }} ref={ref}>
      {!hideHeader && (
      <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
        <div className="flex gap-[8px] items-center">
           <span className="text-[18px] leading-none shrink-0" role="img" aria-label={lang}>{lang === 'en' ? '🇺🇸' : '🇮🇩'}</span>
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
            data-canvas-w="600"
            className={`w-full relative rounded-[12px] overflow-hidden ${currentRatioClass} isolate`} 
            style={{ 
                background: containerBackground, 
                cursor: isDraggable ? 'grab' : 'default',
                touchAction: 'none'
            }}
            onMouseDown={onMouseDown}
        >
         {/* TTD Highlight templates: background colour + polaroid photos instead of the full-bleed key visual and overlay */}
         {isPolaroidTemplate(formData) ? (
         <div className="absolute inset-0 z-0"><PolaroidCollage formData={formData} keyVisualUrl={previewUrl} showNumberBadges={showPolaroidBadges} /></div>
         ) : (<>
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
             
             {isDraggable && !!onFormChange && !isPlaceholder ? (
                <ImageBox
                    wrapperStyle={imageStyle}
                    position={position} scale={scale}
                    onPositionChange={(p) => onFormChange({ keyVisualPosition: p })}
                    onScaleChange={(s) => onFormChange({ keyVisualScale: s })}
                >
                    <img
                        src={currentDisplayImage}
                        alt="Background"
                        style={{ display: 'block', width: 'auto', minWidth: '100%', height: 'auto', maxWidth: 'none', opacity: isImageLoaded ? 1 : 0, transition: 'opacity 500ms ease-in-out' }}
                        draggable={false}
                        crossOrigin="anonymous"
                        onLoad={() => setInternalImageLoaded(true)}
                    />
                </ImageBox>
             ) : (
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
             )}
         </div>
         
         <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyle}>{solidGrad && solidGradEl({ left: 0, top: 0, bottom: 0, width: `${solidCov}%` })}</div>
         {formData.overlay2Enabled && !overlaySolid && <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyle2} />}
         </>)}

         <div className="absolute left-0 top-0 h-full w-[55%] z-20 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
             {/* 3:1 (TTD) gets 12px more room on the left than the 2:1 */}
             <div className={`h-full w-full ${formData.bannerRatio === 'Landscape (3:1)' ? 'pl-[32px]' : 'pl-[20px]'} pr-[20px] py-[15px] flex flex-col justify-center items-start`}>
                 {landscapeContent}
             </div>
             {content.termsAndCondition && (
                 <div className={`absolute ${formData.bannerRatio === 'Landscape (3:1)' ? 'bottom-[11px] left-[32px] max-w-[calc(100%-52px)]' : 'bottom-[15px] left-[20px] max-w-[calc(100%-40px)]'} z-30`}>
                     <HighlightWrapper active={highlights?.tncDiff} label="Terms & Conditions Changed">
                         <div className="text-[6px] leading-[1.4] font-banner" style={{ color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
                     </HighlightWrapper>
                 </div>
             )}
         </div>

         {/* Invisible copy of the polaroids above the content block: dragging a photo pans it inside its frame, even where it sits under the text */}
         {isPolaroidTemplate(formData) && isDraggable && onFormChange && (
            <div className="absolute inset-0 z-[25] pointer-events-none"><PolaroidCollage formData={formData} keyVisualUrl={previewUrl} onFormChange={onFormChange} handlesOnly /></div>
         )}

         {formData.showPartnerLogo && (
            <div className="absolute right-0 z-20 pointer-events-none" style={{ top: `${formData.partnerLogoY ?? 16}px`, transform: 'translateZ(0)' }}>
              <HighlightWrapper active={highlights?.partnerLogoDiff} label="Partner Logo Changed">
                <div className="flex items-center gap-[10px] h-[35px] pl-[20px] pr-[10px] rounded-l-full rounded-r-none overflow-hidden" style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.2)', background: formData.partnerLogoBgEnabled === false ? 'transparent' : (formData.partnerLogoBg ?? '#FFFFFF'), transform: `translateZ(0) scale(${formData.partnerLogoScale ?? lgScale})`, transformOrigin: 'top right' }}>
                    {formData.partnerLogos.slice(0, 3).map((slot, idx) => {
                         const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                         const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                         
                         return (
                         <div key={slot.id || idx} className="h-[27px] min-w-[66px] max-w-[132px] flex items-center justify-center" title={slot.logo || slot.type}>
                            <img src={imgSrc} alt={slot.logo || "Partner"} className="h-full w-auto object-contain" style={{ transform: `scale(${(formData.partnerLogoAssetScale ?? 100) / 100})` }} crossOrigin="anonymous" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                         </div>
                         );
                    })}
                </div>
              </HighlightWrapper>
            </div>
         )}
         {formData.showCampaignLogo && (
             <div className="absolute z-20 pointer-events-none" style={{ top: `${formData.campaignLogoY ?? lgPos}px`, left: `${formData.campaignLogoX ?? lgPos}px`, transform: 'translateZ(0)', transformOrigin: 'top left' }}>
               <HighlightWrapper active={highlights?.campaignLogoDiff} label="Campaign Logo Changed">
                 <div className="w-[72px] h-[36px] flex items-center justify-center" style={{ transform: `scale(${formData.campaignLogoScale ?? lgScale})`, transformOrigin: 'top left' }}>
                    <img src={formData.campaignLogo || exampleImage} alt="Campaign Logo" className="w-full h-full object-contain" onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
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