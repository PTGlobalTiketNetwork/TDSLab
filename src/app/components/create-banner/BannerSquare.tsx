import { BannerFormData } from './types';
import { DraggableItem } from './utils/DraggableItem';
import type { DiffHighlights } from '../../../utils/diffUtils';
import exampleImage from 'figma:asset/605b8d8048aad59b933d3ed10d18a40a444d8fd6.png';
import { forwardRef, useState, useEffect, useRef, ForwardedRef } from 'react';
import { Skeleton } from '../ui/skeleton';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { getPositionsForRender } from './utils/layoutUtils';

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
  
  const defaults = {
      en: {
          headline: 'Headline Goes Here \nmax 2 lines',
          termsText: '*T&C apply',
      },
      id: {
          headline: 'Tulis Headline Disini \nmaks 2 baris',
          termsText: '*S&K berlaku',
      }
  };

  const currentDefaults = defaults[lang];
  const headlineText = content.headline || currentDefaults.headline;
  
  // Use explicit check for Discount Amount to show placeholder '50'
  const discountAmountText = content.discountAmount || '50';
  
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
    'Transport': 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)',
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

  // Calculate gradient positions to allow full transition from Invisible (0%) to Solid (100%)
  const gradientStart = (stopPos * 2) - 100;
  const gradientEnd = stopPos * 2;

  const gradientStyle = {
      background: `linear-gradient(to top, rgba(${rgb},${opacityStart}) ${gradientStart}%, rgba(${rgb},0) ${gradientEnd}%)`,
      transform: 'translateZ(0)', // Fix Safari stacking context
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
        <div className="absolute inset-0 pointer-events-none z-10" style={gradientStyle} />

        {/* Strict Layout Elements */}
        
        {/* Headline - Dynamic Size */}
        <DraggableItem id="headline" {...getPos('headline')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'headline'} onClick={() => setSelectedId('headline')}>
                <HighlightWrapper active={highlights?.headlineDiff} label="Headline Changed">
                <div style={{ textAlign: 'center', position: 'relative', whiteSpace: 'nowrap' }}>
                <h3 className="font-banner font-bold leading-[1.1] drop-shadow-md" 
                    style={{ fontSize: `${content.headlineFontSize || 36}px`, color: content.headlineColor || '#FFFFFF' }}>
                    {renderHtml(headlineText, "")}
                </h3>
                {isUnlocked && selectedId === 'headline' && (
                <ResizeHandle onResizeStart={() => handleFontResizeStart(content.headlineFontSize || 36)} onResize={(d) => handleFontResize(d, 'headlineFontSize')} />
                )}
                </div>
                </HighlightWrapper>
        </DraggableItem>

        {/* Discount Amount - Dynamic Size */}
        {formData.discountEnabled !== false && (
        <DraggableItem id="discountAmount" {...getPos('discountAmount')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'discountAmount'} onClick={() => setSelectedId('discountAmount')}>
                <HighlightWrapper active={highlights?.amount1Diff} label="Amount Changed">
                <div style={{ textAlign: 'center', position: 'relative' }}>
                <span className="font-banner font-extrabold tracking-[-10px] drop-shadow-md leading-[0.8]" 
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
        {content.showPrefix !== false && (
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

                        // Preset: Start from — both words bold
                        if (lowerText === 'start from') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Start</span>
                            <span className="font-banner font-bold -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>from</span>
                            </div>
                        );
                        }

                        // Preset: Mulai dari — both words bold
                        if (lowerText === 'mulai dari') {
                        return (
                            <div className="flex flex-col gap-0 leading-tight">
                            <span className="font-banner font-bold" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>Mulai</span>
                            <span className="font-banner font-bold -mt-[6px]" style={{ fontSize: `${fontSize}px`, color: content.prefixColor || '#FFFFFF' }}>dari</span>
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
        {content.discountType === 'IDR' && (
            <DraggableItem key="currencySymbol" id="currencySymbol" {...getPos('currencySymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'currencySymbol'} onClick={() => setSelectedId('currencySymbol')}>
                    <HighlightWrapper active={highlights?.currency1Diff} label="Currency Changed">
                    <div style={{ position: 'relative' }}>
                    <span className="font-banner font-bold leading-none drop-shadow-md" 
                            style={{ 
                                fontSize: `${content.currencyFontSize || 36}px`,
                                color: content.discountAmountColor || '#FFFFFF' 
                            }}>
                            Rp
                    </span>
                    {isUnlocked && selectedId === 'currencySymbol' && (
                        <ResizeHandle onResizeStart={() => handleFontResizeStart(content.currencyFontSize || 36)} onResize={(d) => handleFontResize(d, 'currencyFontSize')} />
                    )}
                    </div>
                    </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Unit Icon */}
        {content.unit && formData.discountEnabled !== false && (
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
                                color: content.unitColor || '#0064D2' 
                            }}>
                            {content.unit}
                    </span>
                    {isUnlocked && selectedId === 'unitIcon' && (
                        <ResizeHandle onResizeStart={() => handleContainerResizeStart(getPos('unitIcon').width || 64)} onResize={(d) => handleContainerResize(d, 'unitIcon')} />
                    )}
                </div>
                </HighlightWrapper>
            </DraggableItem>
        )}

        {/* Second Discount Elements - Only shown when hasSecondDiscount is true */}
        {content.hasSecondDiscount && formData.discountEnabled !== false && (
            <>
                {/* Plus Symbol */}
                <DraggableItem key="plusSymbol" id="plusSymbol" {...getPos('plusSymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'plusSymbol'} onClick={() => setSelectedId('plusSymbol')}>
                        <div style={{ position: 'relative' }}>
                        <span className="font-banner font-bold leading-none drop-shadow-md" 
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
                {content.secondDiscountType === 'IDR' && (
                    <DraggableItem key="secondCurrencySymbol" id="secondCurrencySymbol" {...getPos('secondCurrencySymbol')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} isSelected={selectedId === 'secondCurrencySymbol'} onClick={() => setSelectedId('secondCurrencySymbol')}>
                            <HighlightWrapper active={highlights?.currency2Diff} label="2nd Currency Changed">
                            <div style={{ position: 'relative' }}>
                            <span className="font-banner font-bold leading-none drop-shadow-md" 
                                    style={{ 
                                        fontSize: `${content.currencyFontSize || 36}px`,
                                        color: content.secondDiscountAmountColor || '#FFFFFF' 
                                    }}>
                                    Rp
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
                        <span className="font-banner font-extrabold tracking-[-10px] drop-shadow-md leading-[0.8]" 
                                style={{ fontSize: `${content.discountAmountFontSize || 180}px`, color: content.secondDiscountAmountColor || '#FFFFFF' }}>
                                {content.secondDiscountAmount || '50'}
                        </span>
                        {isUnlocked && selectedId === 'secondDiscountAmount' && (
                            <ResizeHandle onResizeStart={() => handleFontResizeStart(content.discountAmountFontSize || 180)} onResize={(d) => handleFontResize(d, 'discountAmountFontSize')} />
                        )}
                        </div>
                        </HighlightWrapper>
                </DraggableItem>

                {/* Second Unit Icon - Same size as first unit */}
                {content.secondDiscountUnit && (
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
                                        color: content.secondUnitColor || '#0064D2' 
                                    }}>
                                    {content.secondDiscountUnit}
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

        {/* Campaign Logo */}
        {formData.showCampaignLogo && (
            <DraggableItem id="campaignLogo" {...getPos('campaignLogo')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}}>
                <HighlightWrapper active={highlights?.campaignLogoDiff} label="Campaign Logo Changed">
                <img src={formData.campaignLogo || exampleImage} className="object-contain" 
                        style={{ height: getPos('campaignLogo').height || 60, width: 'auto' }} />
                </HighlightWrapper>
            </DraggableItem>
        )}
        
        {/* Additional Info (Label) */}
        {content.additionalLabel && (
            <DraggableItem id="additionalInfo" {...getPos('additionalInfo')} width={undefined} height={undefined} isUnlocked={isUnlocked} onMove={handleItemMove} containerSize={{w: 600, h: 600}} centered={true} isSelected={selectedId === 'additionalInfo'} onClick={() => setSelectedId('additionalInfo')}>
                    <HighlightWrapper active={highlights?.additionalLabelDiff} label="Label Changed">
                    <div 
                        className="font-bold px-[16px] py-[6px] rounded-[10px] tracking-wider font-banner shadow-sm whitespace-nowrap flex items-center justify-center relative"
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
                    </HighlightWrapper>
            </DraggableItem>
        )}

        {/* TNC - Dynamic Size */}
        {content.termsAndCondition && (
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
           <div className="h-[16px] w-[24px] relative shrink-0">
             <img src={lang === 'en' ? "https://flagcdn.com/w40/us.png" : "https://flagcdn.com/w40/id.png"} alt={lang} className="w-full h-full object-cover rounded-[2px]" crossOrigin="anonymous" />
           </div>
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