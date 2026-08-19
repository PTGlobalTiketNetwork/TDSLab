import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

export interface LightboxProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  children: React.ReactNode;
  hasNavigation?: boolean;
  onNavigate?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalSlides?: number;
  panel?: React.ReactNode;
  // Language switcher props
  hasLanguageSwitcher?: boolean;
  currentLanguage?: 'en' | 'id';
  onLanguageChange?: (lang: 'en' | 'id') => void;
}

export function Lightbox({ isOpen, onOpenChange, trigger, children, hasNavigation, onNavigate, currentIndex = 0, totalSlides = 0, panel, hasLanguageSwitcher, currentLanguage, onLanguageChange }: LightboxProps) {
    const [internalOpen, setInternalOpen] = React.useState(false);
    const isControlled = isOpen !== undefined;
    const openState = isControlled ? isOpen : internalOpen;

    const [scale, setScale] = React.useState(1);
    const [position, setPosition] = React.useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = React.useState(false);
    const dragStartRef = React.useRef<{ x: number; y: number } | null>(null);
    const hasDraggedRef = React.useRef(false);

    // Reset when closing
    React.useEffect(() => {
        if (openState === false) { 
             const timer = setTimeout(() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [openState]);
    
    // Keyboard Navigation
    React.useEffect(() => {
        if (!openState || !hasNavigation) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) onNavigate?.('prev');
            } else if (e.key === 'ArrowRight') {
                 if (currentIndex < (totalSlides - 1)) onNavigate?.('next');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openState, hasNavigation, currentIndex, totalSlides, onNavigate]);

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(newOpen);
        }
        
        if (!newOpen) {
             const timer = setTimeout(() => {
                setScale(1);
                setPosition({ x: 0, y: 0 });
            }, 200);
        }
        onOpenChange?.(newOpen);
    };

    const handleZoom = (delta: number) => {
        setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    };

    const reset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const onWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = -e.deltaY / 1000;
        setScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    };

    const onMouseDown = (e: React.MouseEvent) => {
        if (scale > 1) {
            setIsDragging(true);
            hasDraggedRef.current = false;
            dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
            e.preventDefault();
        }
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging && dragStartRef.current) {
            e.preventDefault();
            hasDraggedRef.current = true;
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const onMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
        // Don't reset hasDraggedRef here immediately if we need it for onClick
        // But onClick fires after onMouseUp
    };

    return (
        <DialogPrimitive.Root open={openState} onOpenChange={handleOpenChange}>
            {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay 
                    className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" 
                />
                <DialogPrimitive.Content 
                    className="fixed inset-0 z-[60] flex items-start justify-start outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') handleOpenChange(false);
                    }}
                >
                    <DialogPrimitive.Title className="sr-only">Image Lightbox</DialogPrimitive.Title>
                    <DialogPrimitive.Description className="sr-only">Zoom and pan to view details</DialogPrimitive.Description>
                    
                    {/* Main Image Area */}
                    <div 
                        className="relative flex-1 h-full overflow-hidden"
                        onClick={() => handleOpenChange(false)}
                    >
                        {/* Close Button - Absolute in Image Area */}
                        <button
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                handleOpenChange(false); 
                            }}
                            className="absolute top-6 right-6 z-[70] bg-black/40 hover:bg-black/60 text-white rounded-full p-2 backdrop-blur-sm transition-colors cursor-pointer"
                        >
                            <X className="w-8 h-8" />
                        </button>

                        {/* Language Switcher - Top Center */}
                        {hasLanguageSwitcher && currentLanguage && onLanguageChange && (
                            <div 
                                className="absolute top-6 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 p-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => onLanguageChange('en')}
                                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${
                                        currentLanguage === 'en' 
                                            ? 'bg-white text-gray-900' 
                                            : 'hover:bg-white/10 text-white/70'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => onLanguageChange('id')}
                                    className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${
                                        currentLanguage === 'id' 
                                            ? 'bg-white text-gray-900' 
                                            : 'hover:bg-white/10 text-white/70'
                                    }`}
                                >
                                    ID
                                </button>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        {hasNavigation && (
                            <>
                                {currentIndex > 0 && (
                                    <button
                                        className="absolute left-6 top-1/2 -translate-y-1/2 z-[70] p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate?.('prev');
                                        }}
                                    >
                                        <ChevronLeft className="w-8 h-8" />
                                    </button>
                                )}
                                {currentIndex < (totalSlides - 1) && (
                                    <button
                                        className="absolute right-6 top-1/2 -translate-y-1/2 z-[70] p-3 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-colors cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate?.('next');
                                        }}
                                    >
                                        <ChevronRight className="w-8 h-8" />
                                    </button>
                                )}
                            </>
                        )}

                        {/* Content Area */}
                        <div 
                            className="relative w-full h-full flex items-center justify-center"
                            onWheel={onWheel}
                            onMouseDown={onMouseDown}
                            onMouseMove={onMouseMove}
                            onMouseUp={onMouseUp}
                            onMouseLeave={onMouseUp}
                        >
                            <div 
                                style={{ 
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                    cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                                }}
                                className="transition-transform duration-75 ease-linear will-change-transform flex items-center justify-center select-none"
                                onClick={(e) => {
                                    if (!hasDraggedRef.current) {
                                        e.stopPropagation();
                                    }
                                    e.stopPropagation();
                                }}
                            >
                                {children}
                            </div>
                        </div>

                        {/* Controls Bar - Absolute Bottom Center */}
                        <div 
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-4 px-6 py-3 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => handleZoom(-0.5)}
                                className="hover:text-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                                disabled={scale <= 0.1}
                            >
                                <ZoomOut className="w-5 h-5" />
                            </button>

                            <span className="min-w-[48px] text-center font-mono text-sm select-none">
                                {Math.round(scale * 100)}%
                            </span>

                            <button 
                                onClick={() => handleZoom(0.5)}
                                className="hover:text-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                                disabled={scale >= 5}
                            >
                                <ZoomIn className="w-5 h-5" />
                            </button>

                            <div className="w-px h-4 bg-white/20 mx-2" />

                            <button 
                                onClick={reset}
                                className="hover:text-gray-300 transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Reset
                            </button>
                        </div>
                    </div>

                    {/* Sidebar Panel */}
                    {panel && (
                        <div 
                            className="hidden md:flex w-[320px] lg:w-[400px] h-full bg-white border-l border-gray-200 flex-col shadow-2xl z-[80] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {panel}
                        </div>
                    )}

                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}