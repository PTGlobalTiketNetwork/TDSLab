import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Loader2, RotateCcw, Edit2, X, Link, Link2Off, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, ChevronDown } from 'lucide-react';
import { BannerFixed } from './create-banner/BannerFixed';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Banner } from '../../types/banner';
import { BannerFormData } from './create-banner/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { compareMetadata, areVisualsIdentical, getChangesSummary } from '../../utils/metadataDiff';
import { MetadataComparisonBar, MetadataOnlyChangesBanner } from './create-banner/components/MetadataComparisonBar';
import { TiketTabs } from './ui/TiketTabs';
import { calculateDiff, hasAnyDifferences, getChangedAreas } from '../../utils/diffUtils';
import type { DiffHighlights } from '../../utils/diffUtils';

interface ComparisonViewerProps {
    isOpen: boolean;
    onClose: () => void;
    currentBanner: Banner;
    historyItem: any;
    historyItems: any[];
    onSelectHistoryItem: (item: any) => void;
    onRestore: (item: any) => void;
    onEdit: (version: number) => void;
    isRestoring: boolean;
    formatName: (name: string | undefined | null) => string;
}

export function ComparisonViewer({
    isOpen,
    onClose,
    currentBanner,
    historyItem,
    historyItems,
    onSelectHistoryItem,
    onRestore,
    onEdit,
    isRestoring,
    formatName
}: ComparisonViewerProps) {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 }); // Percentages (-50 to 50 or similar)
    const [isSynced, setIsSynced] = useState(true);
    
    // Independent states for when sync is off
    const [rightZoom, setRightZoom] = useState(1);
    const [rightPan, setRightPan] = useState({ x: 0, y: 0 });
    
    const [isDragging, setIsDragging] = useState(false);
    const lastMousePos = useRef<{ x: number, y: number } | null>(null);
    const activeDragSide = useRef<'left' | 'right' | null>(null);

    const leftContentRef = useRef<HTMLDivElement>(null);
    const rightContentRef = useRef<HTMLDivElement>(null);
    
    // Language state (NEW)
    const [activeLanguage, setActiveLanguage] = useState<'en' | 'id'>('en');
    
    // Highlight Changes Toggle
    const [highlightChanges, setHighlightChanges] = useState(false);

    // Reset view when opening or switching items
    useEffect(() => {
        if (isOpen) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setRightZoom(1);
            setRightPan({ x: 0, y: 0 });
        }
    }, [isOpen, historyItem?.version]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, historyItems, historyItem]);

    const handlePrev = () => {
        if (!historyItem) return;
        const currentIndex = historyItems.findIndex(h => h.version === historyItem.version);
        if (currentIndex < historyItems.length - 1) {
            onSelectHistoryItem(historyItems[currentIndex + 1]);
        }
    };

    const handleNext = () => {
        if (!historyItem) return;
        const currentIndex = historyItems.findIndex(h => h.version === historyItem.version);
        if (currentIndex > 0) {
            onSelectHistoryItem(historyItems[currentIndex - 1]);
        }
    };

    const handleZoom = (delta: number, side: 'left' | 'right') => {
        const factor = delta > 0 ? 1.1 : 0.9;
        
        if (isSynced) {
            setZoom(z => Math.max(0.1, Math.min(5, z * factor)));
            // Also sync right zoom state to keep them aligned when toggling sync
            setRightZoom(z => Math.max(0.1, Math.min(5, z * factor)));
        } else {
            if (side === 'left') {
                setZoom(z => Math.max(0.1, Math.min(5, z * factor)));
            } else {
                setRightZoom(z => Math.max(0.1, Math.min(5, z * factor)));
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent, side: 'left' | 'right') => {
        setIsDragging(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        activeDragSide.current = side;
    };

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !lastMousePos.current || !activeDragSide.current) return;

        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        const side = activeDragSide.current;
        const contentRef = side === 'left' ? leftContentRef : rightContentRef;
        
        if (contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            // Calculate percentage movement relative to the content size
            // We use the current zoom level to adjust sensitivity
            const currentZoom = isSynced ? zoom : (side === 'left' ? zoom : rightZoom);
            
            // Percentage delta: (pixels / (width * zoom)) * 100
            const pctX = (dx / (rect.width / currentZoom)) * 100;
            const pctY = (dy / (rect.height / currentZoom)) * 100;

            if (isSynced) {
                setPan(p => ({ x: p.x + pctX, y: p.y + pctY }));
                setRightPan(p => ({ x: p.x + pctX, y: p.y + pctY }));
            } else {
                if (side === 'left') {
                    setPan(p => ({ x: p.x + pctX, y: p.y + pctY }));
                } else {
                    setRightPan(p => ({ x: p.x + pctX, y: p.y + pctY }));
                }
            }
        }
    }, [isDragging, isSynced, zoom, rightZoom]);

    const handleMouseUp = () => {
        setIsDragging(false);
        lastMousePos.current = null;
        activeDragSide.current = null;
    };

    const handleReset = (side: 'left' | 'right') => {
        if (isSynced) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setRightZoom(1);
            setRightPan({ x: 0, y: 0 });
        } else {
            if (side === 'left') {
                setZoom(1);
                setPan({ x: 0, y: 0 });
            } else {
                setRightZoom(1);
                setRightPan({ x: 0, y: 0 });
            }
        }
    };

    // Metadata comparison - MUST be before early return to follow Rules of Hooks
    const metadataComparison = useMemo(() => {
        if (!historyItem || !currentBanner) return null;
        const currentFormData = (currentBanner as any).form_data || (currentBanner as any).formData;
        const historyFormData = historyItem.form_data;
        if (!currentFormData || !historyFormData) return null;
        return compareMetadata(currentFormData, historyFormData);
    }, [currentBanner, historyItem]);

    const visualIdentical = useMemo(() => {
        if (!historyItem || !currentBanner) return true;
        const currentFormData = (currentBanner as any).form_data || (currentBanner as any).formData;
        const historyFormData = historyItem.form_data;
        if (!currentFormData || !historyFormData) return true;
        return areVisualsIdentical(currentFormData, historyFormData);
    }, [currentBanner, historyItem]);

    const changesSummary = useMemo(() => {
        if (!metadataComparison) return null;
        return getChangesSummary(metadataComparison);
    }, [metadataComparison]);

    // Diff Highlights Calculation
    const diffHighlights: DiffHighlights = useMemo(() => {
        if (!historyItem || !currentBanner) return {
            headlineDiff: false,
            nudgeDiff: false,
            backgroundDiff: false,
            campaignLogoDiff: false,
            partnerLogoDiff: false,
            layoutDiff: false,
            labelDiscountDiff: false,
            additionalLabelDiff: false,
            tncDiff: false,
            productIconDiff: false,
            currency1Diff: false,
            currency2Diff: false,
            amount1Diff: false,
            amount2Diff: false,
            unit1Diff: false,
            unit2Diff: false,
            entryPointVisualDiff: false,
            entryPointCopyDiff: false,
            entryPointCtaDiff: false,
            entryPointHeadlineDiff: false,
            entryPointSubtextDiff: false,
        };
        
        const currentFormData = (currentBanner as any).form_data || (currentBanner as any).formData;
        const historyFormData = historyItem.form_data;
        
        if (!currentFormData || !historyFormData) return {
            headlineDiff: false,
            nudgeDiff: false,
            backgroundDiff: false,
            campaignLogoDiff: false,
            partnerLogoDiff: false,
            layoutDiff: false,
            labelDiscountDiff: false,
            additionalLabelDiff: false,
            tncDiff: false,
            productIconDiff: false,
            currency1Diff: false,
            currency2Diff: false,
            amount1Diff: false,
            amount2Diff: false,
            unit1Diff: false,
            unit2Diff: false,
            entryPointVisualDiff: false,
            entryPointCopyDiff: false,
            entryPointCtaDiff: false,
            entryPointHeadlineDiff: false,
            entryPointSubtextDiff: false,
        };
        
        return calculateDiff(currentFormData, historyFormData, activeLanguage);
    }, [currentBanner, historyItem, activeLanguage]);

    const hasDifferences = useMemo(() => {
        return hasAnyDifferences(diffHighlights);
    }, [diffHighlights]);

    const changedAreas = useMemo(() => {
        return getChangedAreas(diffHighlights);
    }, [diffHighlights]);

    // Helper to render banner content
    const renderBanner = (data: any, isCurrent: boolean, currentScale: number, currentPan: {x: number, y: number}, ref: React.RefObject<HTMLDivElement>) => {
        const formData = isCurrent 
            ? ((currentBanner as any).form_data || (currentBanner as any).formData) 
            : data?.form_data;
        
        const imageUrl = isCurrent ? currentBanner.imageUrl : null;
        
        // Detect Entry Point Banner and apply larger renderScale
        const isEntryPoint = formData?.bannerCategory === 'Product Entry Point';
        const renderScale = isEntryPoint ? 2 : 1; // 2x for Entry Point to make them more visible
        
        return (
            <div 
                ref={ref}
                style={{
                    transform: `translate(${currentPan.x}%, ${currentPan.y}%) scale(${currentScale})`,
                    transformOrigin: 'center',
                    transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
                className="w-full h-full flex items-center justify-center"
            >
                {formData ? (
                    <div className="shadow-lg relative">
                         {/* We pass scale 1 because we handle zoom via CSS transform */}
                         <BannerFixed 
                            formData={formData}
                            lang={activeLanguage}
                            scale={formData.keyVisualScale || 100}
                            position={formData.keyVisualPosition || { x: 50, y: 50 }}
                            previewUrl={formData.keyVisualUrl || null}
                            hideHeader={true}
                            highlights={highlightChanges ? diffHighlights : undefined}
                            renderScale={renderScale}
                         />
                         {/* Overlay to prevent interactions with banner content while dragging */}
                         <div className="absolute inset-0 z-10" />
                    </div>
                ) : (
                    imageUrl ? (
                        <ImageWithFallback 
                            src={imageUrl} 
                            alt="Banner" 
                            className="max-w-full max-h-full object-contain shadow-lg"
                            draggable={false}
                        />
                    ) : (
                         <div className="text-gray-400 p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            No visual data available
                         </div>
                    )
                )}
            </div>
        );
    };

    if (!isOpen || !historyItem) return null;

    const currentIndex = historyItems.findIndex(h => h.version === historyItem.version);
    const hasNext = currentIndex > 0;
    const hasPrev = currentIndex < historyItems.length - 1;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] w-[1400px] h-[90vh] bg-[#f8f9fd] p-0 overflow-hidden flex flex-col gap-0 border-none shadow-2xl">
                <DialogDescription className="sr-only">
                    Compare current banner version with version {historyItem.version}
                </DialogDescription>
                
                {/* Header */}
                <div className="h-16 px-6 bg-white border-b border-[#e8eaee] flex items-center justify-between shrink-0 z-20">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-lg font-bold text-[#303135]">Version Comparison</DialogTitle>
                        
                        {/* Highlight Changes Toggle */}
                        {hasDifferences && (
                          <div className="flex items-center gap-2 bg-[#f8f9fd] px-3 py-1.5 rounded-lg border border-[#d8dce8] ml-4">
                            <label htmlFor="highlight-toggle-viewer" className="text-xs font-medium text-[#303135] cursor-pointer select-none">
                              Highlight Changes
                            </label>
                            <button
                              id="highlight-toggle-viewer"
                              role="switch"
                              aria-checked={highlightChanges}
                              onClick={() => setHighlightChanges(!highlightChanges)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-1 ${
                                highlightChanges ? 'bg-[#007BFF]' : 'bg-[#d8dce8]'
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  highlightChanges ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        )}
                    </div>
                    
                    {/* Language Tabs (Centered) */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <TiketTabs
                            items={[
                                { id: 'en', label: 'EN Translation' },
                                { id: 'id', label: 'ID Translation' }
                            ]}
                            activeId={activeLanguage}
                            onChange={(id) => setActiveLanguage(id as 'en' | 'id')}
                            className="border-0"
                        />
                    </div>
                    
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Main Content */}
                <div 
                    className="flex-1 flex overflow-hidden relative select-none"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    {/* Left Panel: Current Version */}
                    <div className={`flex-1 bg-[#e5e5e5] relative overflow-hidden flex flex-col border-r border-white/50 transition-all duration-200 ${isDragging && isSynced ? 'ring-2 ring-inset ring-blue-500/50' : ''}`}>

                        <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
                            <span className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full shadow-md">
                                Current Version
                            </span>
                            
                            {/* Changes Detected Banner - Next to Current Version Chip */}
                            {highlightChanges && hasDifferences && (
                                <div className="bg-[#FFF4E6] border border-[#FFE0B2] px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#FF9800] animate-pulse" />
                                        <span className="text-xs font-semibold text-[#E65100]">Changes:</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {changedAreas.map((area) => (
                                            <span
                                                key={area}
                                                className="px-2 py-0.5 bg-[#FFE0B2] text-[#E65100] text-[10px] font-medium rounded-full"
                                            >
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div 
                            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center p-8 overflow-hidden"
                            onWheel={(e) => handleZoom(e.deltaY < 0 ? 1 : -1, 'left')}
                            onMouseDown={(e) => handleMouseDown(e, 'left')}
                        >
                            {renderBanner(currentBanner, true, zoom, pan, leftContentRef)}
                        </div>
                        
                        {/* Zoom Controls Overlay */}
                        <div className="absolute bottom-4 left-4 flex gap-1 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 z-10">
                             <button onClick={() => handleZoom(-1, 'left')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                                <ZoomOut size={16} />
                             </button>
                             <span className="text-xs font-mono w-12 flex items-center justify-center text-gray-600">
                                {Math.round(zoom * 100)}%
                             </span>
                             <button onClick={() => handleZoom(1, 'left')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                                <ZoomIn size={16} />
                             </button>
                             <div className="w-px bg-gray-200 my-1 mx-0.5" />
                             <button onClick={() => handleReset('left')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-medium text-gray-600" title="Reset Zoom">
                                Reset
                             </button>
                             <div className="w-px bg-gray-200 my-1 mx-0.5" />
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button 
                                            onClick={() => {
                                                setIsSynced(!isSynced);
                                                if (!isSynced) {
                                                    setRightZoom(zoom);
                                                    setRightPan(pan);
                                                }
                                            }}
                                            className={`p-1.5 rounded transition-colors ${isSynced ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >
                                            {isSynced ? <Link size={16} /> : <Link2Off size={16} />}
                                        </button>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        {isSynced ? 'Sync View On' : 'Sync View Off'}
                                    </TooltipContent>
                                </Tooltip>
                             </TooltipProvider>
                        </div>

                        {/* Metadata Comparison Overlay */}
                        {metadataComparison && changesSummary?.hasMetadataChanges && (
                            <div className="absolute bottom-4 right-4 max-w-[350px] z-10">
                                <MetadataComparisonBar diffs={metadataComparison} side="current" />
                            </div>
                        )}
                    </div>

                    {/* Right Panel: History Version */}
                    <div className={`flex-1 bg-[#e5e5e5] relative overflow-hidden flex flex-col transition-all duration-200 ${isDragging && isSynced ? 'ring-2 ring-inset ring-blue-500/50' : ''}`}>

                        <div className="absolute top-4 left-4 z-10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-full shadow-md flex items-center gap-2 transition-colors outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                                        Version {historyItem.version}
                                        <ChevronDown size={12} className="opacity-70" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="max-h-[300px] overflow-y-auto w-48">
                                    {historyItems.map((item, index) => (
                                        <DropdownMenuItem 
                                            key={`${item.version}-${index}`}
                                            onClick={() => onSelectHistoryItem(item)}
                                            className={`flex flex-col items-start gap-1 py-2 cursor-pointer ${item.version === historyItem.version ? "bg-gray-100" : ""}`}
                                        >
                                            <span className="font-medium">Version {item.version}</span>
                                            <span className="text-xs text-gray-500">
                                                 {new Date(item.updated_at || item.updatedAt).toLocaleDateString()}
                                            </span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur text-xs p-2 rounded-lg shadow-sm text-gray-600 border border-gray-200 text-right">
                            <div>{new Date(historyItem.updated_at || historyItem.updatedAt).toLocaleString()}</div>
                            <div>by <span className="font-semibold">{formatName(historyItem.last_edited_by_name || historyItem.creator_name)}</span></div>
                        </div>

                         {/* Navigation Arrows */}
                         <div className="absolute top-1/2 left-4 z-20 -translate-y-1/2">
                            <button 
                                onClick={handlePrev}
                                disabled={!hasPrev}
                                className="p-2 rounded-full bg-white/80 hover:bg-white shadow-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        </div>
                        <div className="absolute top-1/2 right-4 z-20 -translate-y-1/2">
                            <button 
                                onClick={handleNext}
                                disabled={!hasNext}
                                className="p-2 rounded-full bg-white/80 hover:bg-white shadow-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div 
                            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center p-8 overflow-hidden"
                            onWheel={(e) => handleZoom(e.deltaY < 0 ? 1 : -1, 'right')}
                            onMouseDown={(e) => handleMouseDown(e, 'right')}
                        >
                             {renderBanner(historyItem, false, isSynced ? zoom : rightZoom, isSynced ? pan : rightPan, rightContentRef)}
                        </div>

                        {/* Zoom Controls Overlay */}
                        {!isSynced && (
                            <div className="absolute bottom-4 left-4 flex gap-1 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1 z-10">
                                 <button onClick={() => handleZoom(-1, 'right')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                                    <ZoomOut size={16} />
                                 </button>
                                 <span className="text-xs font-mono w-12 flex items-center justify-center text-gray-600">
                                    {Math.round(rightZoom * 100)}%
                                 </span>
                                 <button onClick={() => handleZoom(1, 'right')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600">
                                    <ZoomIn size={16} />
                                 </button>
                                 <div className="w-px bg-gray-200 my-1 mx-0.5" />
                                 <button onClick={() => handleReset('right')} className="px-2 py-1 hover:bg-gray-100 rounded text-xs font-medium text-gray-600" title="Reset Zoom">
                                    Reset
                                 </button>
                            </div>
                        )}
                        
                        {/* Metadata Comparison Overlay */}
                        {metadataComparison && changesSummary?.hasMetadataChanges && (
                            <div className="absolute bottom-4 right-4 max-w-[350px] z-10">
                                <MetadataComparisonBar diffs={metadataComparison} side="remote" />
                            </div>
                        )}
                    </div>

                    {/* Sync Indicator (Centered) */}
                    {isSynced && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none opacity-0 transition-opacity duration-300" id="sync-indicator">
                             <div className="bg-blue-600 text-white p-2 rounded-full shadow-xl">
                                <Link size={24} />
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-16 px-6 bg-white border-t border-[#e8eaee] flex items-center justify-between shrink-0">
                    <div className="text-sm text-gray-500">
                        {isSynced ? 'Pan and zoom are synchronized' : 'Independent view mode'}
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => onRestore(historyItem)}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                            disabled={isRestoring}
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw size={16} />}
                            {isRestoring ? 'Restoring...' : 'Restore this Version'}
                        </button>
                        <button 
                            onClick={() => onEdit(historyItem.version)}
                            className="px-4 py-2 bg-[#007BFF] text-white rounded-lg text-sm font-bold hover:bg-[#0064D2] flex items-center gap-2"
                        >
                            Edit this Version
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}