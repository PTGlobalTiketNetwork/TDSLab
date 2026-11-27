import { BannerFormData } from './types';
import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { BannerFixed } from './BannerFixed';
import { BannerDesktop51 } from './BannerDesktop51';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Lock, Unlock, RotateCcw, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import { BANNER_SPECS, ENTRY_POINT_SPECS } from '../../../config/banner-layouts';
import { getPositionsForRender, loadDefaultPositions, NEW_LANDSCAPE_21_CONTENT_SCALE } from './utils/layoutUtils';

interface LivePreviewProps {
  formData: BannerFormData;
  onChange?: (updates: Partial<BannerFormData>) => void;
  currentStep: number;
  onControlsChange?: (controls: { isUnlocked: boolean; isSquare: boolean; onToggleLock: () => void; onResetPositions: () => void }) => void;
  activeTab?: 'en' | 'id';
  deviceTab?: 'mobile' | 'desktop' | 'all';
  onDeviceTabChange?: (tab: 'mobile' | 'desktop' | 'all') => void;
  isTranslating?: boolean;
  actualSizeOpen?: boolean;
  onActualSizeOpenChange?: (open: boolean) => void;
  embedded?: boolean; // inside the DLP accordion editor: 2:1 side by side + "Preview full size" (no zoom bar), like 3:4
  hideDeviceTabs?: boolean; // hide the All / Mobile / Desktop tab bar (e.g. inside the copy dialog)
  compact?: boolean; // small embedded preview: 2:1 shows EN / ID side by side with "Preview full size" instead of the zoom bar
}

export function LivePreview({ formData, onChange, currentStep, onControlsChange, activeTab = 'en', deviceTab = 'mobile', onDeviceTabChange, isTranslating = false, compact = false, hideDeviceTabs = false, embedded = false, actualSizeOpen, onActualSizeOpenChange }: LivePreviewProps) {
  // Use formData position or default to center (50, 50)
  // Scale defaults to 100 if undefined
  const scale = formData.keyVisualScale || 100;
  const position = formData.keyVisualPosition || { x: 50, y: 50 };
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Side-by-side layout: shrink to fit the panel by default; "Actual size" shows the real export pixels (portrait is previewed at 0.5x)
  const [actualSizeInternal, setActualSizeInternal] = useState(false);
  const actualSize = actualSizeOpen ?? actualSizeInternal; // can be driven from outside (button placed by the caller)
  const setActualSize = (o: boolean) => {
    if (o) setModalDevice(deviceTab === 'desktop' ? 'desktop' : 'mobile'); // start on the tab being looked at ('All' starts on Mobile)
    setActualSizeInternal(o); onActualSizeOpenChange?.(o);
  };
  const [modalDevice, setModalDevice] = useState<'mobile' | 'desktop'>('mobile'); // Mobile | Desktop tabs inside the full-size popup (2:1 + 5:1)
  const [modalZoom, setModalZoom] = useState(50); // % of actual (720×960) size
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitZoom, setFitZoom] = useState(1);
  const isPortraitRatio = formData.bannerRatio === 'Portrait (3:4)';
  const isLandscape21 = formData.bannerRatio === 'Landscape (2:1)' || formData.bannerRatio === 'Landscape (3:1)';
  const isSquareRatio = formData.bannerRatio === 'Square (1:1)';
  // 2:1, 3:4 and 1:1 all show EN and ID side by side (fit to the panel, "Preview full size" for the real size) — same behavior everywhere, not just in the DLP/compact views.
  // 2:1/3:1/3:4 and the 1:1 DLP Mobile Header: zoom in = EN and ID stacked (ID under EN) at the full panel width, zoom out = side by side
  const canStack = (isLandscape21 || isPortraitRatio || isSquareRatio) && !compact; // every 2:1/3:1/1:1/3:4 editor preview (Promo, DLP, TTD); the small collapsed/summary cards always stay side by side
  // 0 = side by side, 1 = stacked at 75% of the panel width (default), 2 = stacked at the full panel width
  const [zoomLevel, setZoomLevel] = useState<0 | 1 | 2>(1);
  const isStacked = canStack && zoomLevel > 0;
  const sideBySide = (isPortraitRatio || isLandscape21 || isSquareRatio) && !isStacked;
  const isDesktopStandalone = formData.bannerCategory === 'Promo Banner' && (formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)');
  const hasDesktop = formData.bannerRatio === 'Landscape (2:1)' && !!formData.provideDesktopBanner;
  // shared with the tabs in the form; 'all' shows both previews (2:1 first, then 5:1)
  const showDesktop = hasDesktop && deviceTab !== 'mobile';
  const showMobile = !hasDesktop || deviceTab !== 'desktop';
  const [landscapeZoom, setLandscapeZoom] = useState(75); // % — 2:1 preview zoom

  // Use Refs for mutable drag state so listeners don't need to be recreated
  const dragState = useRef({
      isDragging: false,
      startX: 0,
      startY: 0,
      initialX: 50,
      initialY: 50,
      containerW: 1,
      containerH: 1
  });

  // Keep a ref to onChange to avoid stale closures in event listeners
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Keep a ref to formData to avoid stale closures in reset callback
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Handle Preview URL creation/revocation
  useEffect(() => {
    if (formData.keyVisualFile instanceof Blob) {
        try {
            const url = URL.createObjectURL(formData.keyVisualFile);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Failed to create object URL for keyVisualFile", e);
            setPreviewUrl(null);
        }
    } else if (formData.keyVisualUrl) {
        setPreviewUrl(formData.keyVisualUrl);
    } else {
        setPreviewUrl(null);
    }
  }, [formData.keyVisualFile, formData.keyVisualUrl]);

  // Persistent Event Handlers for Background Image
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const state = dragState.current;
    if (!state.isDragging || !onChangeRef.current) return;
    
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    
    // Sensitivity: 1 pixel drag = (100 / dimension)% movement
    // We safeguard against 0 division just in case
    const sensitivityX = state.containerW > 0 ? (100 / state.containerW) : 0.2;
    const sensitivityY = state.containerH > 0 ? (100 / state.containerH) : 0.2;
    
    let newX = state.initialX + (deltaX * sensitivityX);
    let newY = state.initialY + (deltaY * sensitivityY);
    
    onChangeRef.current({ keyVisualPosition: { x: newX, y: newY } });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (dragState.current.isDragging) {
        dragState.current.isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
    // Clean up global listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only allow dragging in Step 4 AND if a file is uploaded or url exists
    if (currentStep !== 4 || (!formData.keyVisualFile && !formData.keyVisualUrl)) return;
    
    // If elements are unlocked, maybe we shouldn't drag background? 
    // Or maybe background drag is only if clicking on background?
    // BannerFixed should handle propagation stops.
    
    e.preventDefault();  

    const target = e.currentTarget as HTMLElement;
    
    dragState.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
        containerW: target.offsetWidth,
        containerH: target.offsetHeight
    };
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [position, handleMouseMove, handleMouseUp, currentStep, formData.keyVisualFile, formData.keyVisualUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);

  const isDraggable = currentStep === 4 && (!!formData.keyVisualFile || !!formData.keyVisualUrl);
  const isSquare = formData.bannerRatio === 'Square (1:1)';
  const previewFormData = currentStep === 1 && isSquare && !formData.keyVisualFile && !formData.keyVisualUrl
    ? { ...formData, backgroundType: 'image' as const }
    : formData;
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isDesktopEntryPoint = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)';
  // Desktop entry points (640px) use 1x; mobile entry points (320px) use 2x so they appear the same size
  const renderScale = isProductEntryPoint ? (isDesktopEntryPoint ? 1 : 2) : 1;

  // Element Drag Handler
  const handleElementMove = useCallback((key: string, x0: number, y0: number, w0?: number, h0?: number, lang?: 'en' | 'id') => {
      // Positions are always whole numbers (no decimals)
      const x = Math.round(x0), y = Math.round(y0);
      const w = typeof w0 === 'number' ? Math.round(w0) : w0, h = typeof h0 === 'number' ? Math.round(h0) : h0;
      // Special handling for top-level properties
      if (key === 'backgroundGradientPosition') {
          onChange?.({ backgroundGradientPosition: { x, y } });
          return;
      }
      if (key === 'keyVisualPosition') {
          onChange?.({ keyVisualPosition: { x, y } });
          return;
      }

      const targetLang = lang || activeTab;
      
      // Get base positions for the specific language
      // This ensures we start with correct defaults or saved positions
      const currentPositions = getPositionsForRender(formData, targetLang);
      
      const currentPos = currentPositions[key] || {};
      
      const newPositions = {
          ...currentPositions,
          [key]: { 
              ...currentPos, 
              x, 
              y,
              ...(w !== undefined ? { width: w } : {}),
              ...(h !== undefined ? { height: h } : {})
          }
      };
      
      // Construct updates
      const updates: Partial<BannerFormData> = {};
      const nudgeId = formData.content[targetLang].prefixType || 'custom';
      
      // 1. Update Saved Positions
      const updatedSaved = {
          en: { ...(formData.savedElementPositions?.en || {}) },
          id: { ...(formData.savedElementPositions?.id || {}) }
      };
      updatedSaved[targetLang][nudgeId] = newPositions;
      updates.savedElementPositions = updatedSaved;

      // 2. Update elementPositions IF the language matches activeTab
      // This keeps FormStep2 logic consistent
      if (targetLang === activeTab) {
          updates.elementPositions = newPositions;
      }
      
      onChange?.(updates);
  }, [formData, onChange, activeTab]);

  const handleResetPositions = useCallback(() => {
      const currentFormData = formDataRef.current;
      const lang = activeTab; // Use prop
      
      // Get the correct Nudge ID
      const nudgeId = currentFormData.content[lang].prefixType || 'custom';
      
      // Check for double discount
      const hasDouble = currentFormData.content.en.hasSecondDiscount || currentFormData.content.id.hasSecondDiscount;
      
      // Load defaults specifically for this Lang + Nudge + Mode
      const defaults = loadDefaultPositions(lang, nudgeId, hasDouble);
      
      if (defaults && Object.keys(defaults).length > 0) {
           const newPositions: Record<string, any> = {};
           
           // Copy structure to ensure no reference issues
           Object.keys(defaults).forEach(key => {
               if (defaults[key]) {
                   newPositions[key] = { ...defaults[key] };
               }
           });

           // Update Saved Positions for this specific Nudge
           const updatedSaved = {
               en: { ...(currentFormData.savedElementPositions?.en || {}) },
               id: { ...(currentFormData.savedElementPositions?.id || {}) }
           };
           updatedSaved[lang][nudgeId] = newPositions;
           
           onChangeRef.current?.({ 
               elementPositions: newPositions, // Update current view
               savedElementPositions: updatedSaved // Update storage
           });
      }
  }, [activeTab]);

  // Handle direct content updates from preview (e.g. resizing)
  const handleContentChange = useCallback((lang: 'en' | 'id', key: string, value: any) => {
      const currentContent = formDataRef.current.content;
      onChangeRef.current?.({
          content: {
              ...currentContent,
              [lang]: {
                  ...currentContent[lang],
                  [key]: value
              }
          }
      });
  }, []);

  // Update controls
  useEffect(() => {
    if (onControlsChange) {
      onControlsChange({
        isUnlocked,
        isSquare,
        onToggleLock: () => setIsUnlocked(!isUnlocked),
        onResetPositions: handleResetPositions
      });
    }
  }, [isUnlocked, isSquare, onControlsChange, handleResetPositions]);

  // Entry Point mobile previews (renderScale 2x) are fixed-pixel-width and stack EN/ID vertically (not side by side),
  // so unlike sideBySide ratios they need the full available width, not half of it, to fit without being cropped.
  const fitsToWidth = isProductEntryPoint;
  // Known intrinsic px width (not measured from the DOM): the DOM width would already reflect any
  // zoom we previously applied to this same subtree, which feeds back into the next measurement and
  // can spiral the fit down toward 0 (the preview collapsing to a speck). A fixed reference width sidesteps that.
  let entryPointRatioKey: keyof typeof ENTRY_POINT_SPECS = 'mobile_5:2';
  if (formData.bannerRatio === 'Mobile (2:1)') entryPointRatioKey = 'mobile_2:1';
  if (formData.bannerRatio === 'Mobile (4:1)') entryPointRatioKey = 'mobile_4:1';
  if (formData.bannerRatio === 'Mobile (2:1 WhatsApp)') entryPointRatioKey = 'mobile_2:1_whatsapp';
  if (formData.bannerRatio === 'Desktop (5:1)') entryPointRatioKey = 'desktop_5:1';
  if (formData.bannerRatio === 'Desktop (8:1)') entryPointRatioKey = 'desktop_8:1';
  const entryPointNaturalWidth = ENTRY_POINT_SPECS[entryPointRatioKey].width * renderScale;

  // Layout effect: fit before the first paint, otherwise a freshly mounted preview (e.g. switching the Summary tab) flashes at 100% and then snaps to the fitted size
  useLayoutEffect(() => {
    const update = () => {
      const avail = wrapRef.current?.clientWidth;
      if (fitsToWidth) {
        if (avail) setFitZoom(Math.max(0.1, Math.min(1, (avail - 16) / entryPointNaturalWidth)));
        return;
      }
      const natural = measureRef.current?.scrollWidth;
      if (avail && natural && (sideBySide || isStacked)) {
        const divisor = sideBySide ? 2 : 1;
        // TTD zoom in: each banner at 75% of the panel width (full width felt too big)
        const z = ((avail - 16) / divisor / natural) * (isStacked && zoomLevel === 1 ? 0.75 : 1);
        setFitZoom(compact ? z : Math.min(1, z)); // compact (DLP cards): scale up/down so EN + ID fill the width edge to edge
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [formData.bannerRatio, formData.bannerCategory, compact, sideBySide, isStacked, zoomLevel, fitsToWidth, entryPointNaturalWidth]);

  const zoom = (sideBySide || fitsToWidth || isStacked) ? fitZoom : 1;

  // Back to the default layout: undoes accidental drags / scales made with the bounding boxes in the preview
  const resetLayout = () => {
    const mobile = { keyVisualPosition: { x: 50, y: 50 }, keyVisualScale: 100, portraitContentScale: undefined, portraitContentOffsetY: undefined, landscapeContentScale: formData.bannerRatio === 'Landscape (2:1)' ? NEW_LANDSCAPE_21_CONTENT_SCALE : undefined, squareContentScale: undefined, squareContentOffsetY: undefined };
    const desktop = {
      desktopContentScale: undefined, desktopContentOffsetX: undefined, desktopContentOffsetY: undefined,
      desktopKeyVisualPosition: undefined, desktopKeyVisualScale: undefined,
      desktopCampaignLogoX: undefined, desktopCampaignLogoY: undefined, desktopCampaignLogoScale: undefined,
      desktopTncOffset: undefined, desktopTncWidth: undefined,
    };
    const doMobile = !isDesktopStandalone && !(hasDesktop && deviceTab === 'desktop');
    const doDesktop = isDesktopStandalone || showDesktop;
    onChange?.({ ...(doMobile ? mobile : {}), ...(doDesktop ? desktop : {}) } as Partial<BannerFormData>);
    if (isSquare && doMobile) handleResetPositions();
  };

  return (
    <div className="flex flex-col gap-[12px] w-full min-w-0 pb-4">
      {hasDesktop && !hideDeviceTabs && (
        <div className="flex border-b border-[#e9ebef] sticky top-[var(--sticky-top,0px)] z-30 bg-white -mt-[24px] -mx-[24px] px-[24px]">
      {([['all', 'All'], ['mobile', 'Mobile (2:1)'], ['desktop', 'Desktop (5:1)']] as const).map(([id, text]) => (
        <button
          key={id}
          type="button"
          onClick={() => onDeviceTabChange?.(id)}
          className={`px-[16px] py-[12px] text-[14px] font-bold border-b-2 transition-colors ${deviceTab === id ? 'text-[#007BFF] border-[#007BFF]' : 'text-[#71747d] border-transparent hover:text-[#303135]'}`}
        >
          {text}
        </button>
      ))}
    </div>
      )}
      {showDesktop && (
        <div className={compact ? 'flex flex-row gap-[12px] w-full order-2' : 'flex flex-col gap-[24px] w-full order-2'}>
          <BannerDesktop51 formData={formData} lang="en" label="EN" previewUrl={previewUrl} onFormChange={onChange} isDraggable={isDraggable} />
          <BannerDesktop51 formData={formData} lang="id" label="ID" previewUrl={previewUrl} onFormChange={onChange} isDraggable={isDraggable} />
        </div>
      )}
      {!compact && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={resetLayout}
            className="p-2 rounded-md bg-[#f2f4f8] text-[#303135] hover:bg-[#e6e9f0] transition-colors"
            title="Reset to default (position and scale of the content, key visual and logos)"
            aria-label="Reset to default"
          >
            <RotateCcw size={16} />
          </button>
          {canStack && (
            <>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z > 0 ? ((z - 1) as 0 | 1) : z))}
                disabled={zoomLevel === 0}
                className="p-2 rounded-md bg-[#f2f4f8] text-[#303135] hover:bg-[#e6e9f0] disabled:opacity-40 disabled:hover:bg-[#f2f4f8] transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => (z < 2 ? ((z + 1) as 1 | 2) : z))}
                disabled={zoomLevel === 2}
                className="p-2 rounded-md bg-[#f2f4f8] text-[#303135] hover:bg-[#e6e9f0] disabled:opacity-40 disabled:hover:bg-[#f2f4f8] transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </>
          )}
          {(sideBySide || isStacked || isDesktopStandalone || showDesktop) && (
            <button
              type="button"
              onClick={() => setActualSize(true)}
              className="p-2 rounded-md bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] transition-colors"
              title="Preview full size"
              aria-label="Preview full size"
            >
              <Maximize2 size={16} />
            </button>
          )}
        </div>
      )}
      <div ref={wrapRef} className={`w-full ${compact || embedded ? '' : 'overflow-x-auto overflow-y-hidden'} ${compact && isPortraitRatio ? 'max-w-[75%] mx-auto' : ''} ${showMobile ? '' : 'hidden'}`}>
      <div className={sideBySide ? "flex flex-row items-start gap-[16px] w-max mx-auto" : isStacked ? "flex flex-col items-start gap-[16px] w-max mx-auto" : (embedded && isDesktopStandalone) ? "flex flex-row gap-[12px] w-full lg:flex-col lg:gap-[24px]" : "flex flex-col gap-[24px] w-full"} style={(sideBySide || fitsToWidth || isStacked) ? { zoom } : isLandscape21 ? { zoom: landscapeZoom / 100 } : undefined}>
      <div ref={measureRef} className="flex flex-col w-full min-w-0">
        <BannerFixed 
            formData={previewFormData} 
            lang="en" 
            label="EN" 
            scale={scale}
            renderScale={renderScale}
            position={position}
            onMouseDown={handleMouseDown}
            previewUrl={previewUrl}
            isDraggable={isDraggable}
            isUnlocked={isUnlocked}
            onElementMove={handleElementMove}
            onContentChange={handleContentChange}
            onFormChange={onChange}
            isShimmering={isTranslating && activeTab === 'id'}
        />
      </div>
      <div className="flex flex-col w-full min-w-0">
        <BannerFixed 
            formData={previewFormData} 
            lang="id" 
            label="ID" 
            scale={scale}
            renderScale={renderScale}
            position={position}
            onMouseDown={handleMouseDown}
            previewUrl={previewUrl}
            isDraggable={isDraggable}
            isUnlocked={isUnlocked}
            onElementMove={handleElementMove}
            onContentChange={handleContentChange}
            onFormChange={onChange}
            isShimmering={isTranslating && activeTab === 'en'}
        />
      </div>
      </div>
      </div>
      {(sideBySide || isDesktopStandalone || showDesktop || hasDesktop) && (
        <Dialog open={actualSize} onOpenChange={(o) => { setActualSize(o); if (!o) setModalZoom(50); }}>
          <DialogContent className="w-auto max-w-[96vw] sm:max-w-[96vw] max-h-[92vh] overflow-auto p-[24px]">
            <DialogTitle className="sr-only">Actual size preview</DialogTitle>
            {hasDesktop && (
              <div className="flex border-b border-[#e9ebef] mb-[16px]">
                {([['mobile', 'Mobile (2:1)'], ['desktop', 'Desktop (5:1)']] as const).map(([id, text]) => (
                  <button key={id} type="button" onClick={() => setModalDevice(id)}
                    className={`px-[16px] py-[10px] text-[14px] font-bold border-b-2 transition-colors ${modalDevice === id ? 'text-[#007BFF] border-[#007BFF]' : 'text-[#71747d] border-transparent hover:text-[#303135]'}`}>
                    {text}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 mb-[16px]">
              <button type="button" onClick={() => setModalZoom(z => Math.max(25, z - 25))} disabled={modalZoom <= 25} className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 disabled:opacity-40" title="Zoom out"><ZoomOut size={16} /></button>
              <span className="text-sm font-bold text-[#303135] w-[48px] text-center">{modalZoom}%</span>
              <button type="button" onClick={() => setModalZoom(z => Math.min(300, z + 25))} disabled={modalZoom >= 300} className="p-1.5 rounded-md bg-gray-50 hover:bg-gray-100 disabled:opacity-40" title="Zoom in"><ZoomIn size={16} /></button>
              <button type="button" onClick={() => setModalZoom(50)} className="px-2 py-1 rounded-md text-sm font-bold text-blue-600 hover:bg-blue-50">Reset</button>
            </div>
            {(isDesktopStandalone || (hasDesktop && modalDevice === 'desktop')) ? (
              // Desktop 5:1 is drawn at its native 2000×400, so zoom = the percentage (default 50%)
              <div className="flex flex-col gap-[16px] w-max" style={{ zoom: modalZoom / 100 }}>
                {(['en', 'id'] as const).map(l => (
                  <BannerDesktop51 key={l} formData={formData} lang={l} label={l === 'en' ? 'EN' : 'ID'} previewUrl={previewUrl} fullSize />
                ))}
              </div>
            ) : (
            /* Preview is drawn at 0.5x of the 720×960 export (1:1: 400px for 600px), so zoom 2 (1:1: 1.5) shows real pixels */
            <div className="flex flex-row items-start gap-[24px] w-max" style={{ zoom: (isSquareRatio ? 1.5 : 2) * modalZoom / 100 }}>
              {(['en', 'id'] as const).map(l => (
                <BannerFixed
                  key={l}
                  formData={formData}
                  lang={l}
                  label={l === 'en' ? 'EN' : 'ID'}
                  scale={scale}
                  renderScale={renderScale}
                  position={position}
                  previewUrl={previewUrl}
                />
              ))}
            </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
