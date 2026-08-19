import { BannerFormData } from './types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { BannerFixed } from './BannerFixed';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { getPositionsForRender, loadDefaultPositions } from './utils/layoutUtils';

interface LivePreviewProps {
  formData: BannerFormData;
  onChange?: (updates: Partial<BannerFormData>) => void;
  currentStep: number;
  onControlsChange?: (controls: { isUnlocked: boolean; isSquare: boolean; onToggleLock: () => void; onResetPositions: () => void }) => void;
  activeTab?: 'en' | 'id';
  isTranslating?: boolean;
}

export function LivePreview({ formData, onChange, currentStep, onControlsChange, activeTab = 'en', isTranslating = false }: LivePreviewProps) {
  // Use formData position or default to center (50, 50)
  // Scale defaults to 100 if undefined
  const scale = formData.keyVisualScale || 100;
  const position = formData.keyVisualPosition || { x: 50, y: 50 };
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

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
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isDesktopEntryPoint = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)';
  // Desktop entry points (640px) use 1x; mobile entry points (320px) use 2x so they appear the same size
  const renderScale = isProductEntryPoint ? (isDesktopEntryPoint ? 1 : 2) : 1;

  // Element Drag Handler
  const handleElementMove = useCallback((key: string, x: number, y: number, w?: number, h?: number, lang?: 'en' | 'id') => {
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

  return (
    <div className="flex flex-col gap-[24px] w-full items-center overflow-x-auto pb-4">
      <div className="flex flex-col gap-[24px] w-full">
        <BannerFixed 
            formData={formData} 
            lang="en" 
            label="EN Translation" 
            scale={scale}
            renderScale={renderScale}
            position={position}
            onMouseDown={handleMouseDown}
            previewUrl={previewUrl}
            isDraggable={isDraggable}
            isUnlocked={isUnlocked}
            onElementMove={handleElementMove}
            onContentChange={handleContentChange}
            isShimmering={isTranslating && activeTab === 'id'}
        />
        <BannerFixed 
            formData={formData} 
            lang="id" 
            label="ID Translation" 
            scale={scale}
            renderScale={renderScale}
            position={position}
            onMouseDown={handleMouseDown}
            previewUrl={previewUrl}
            isDraggable={isDraggable}
            isUnlocked={isUnlocked}
            onElementMove={handleElementMove}
            onContentChange={handleContentChange}
            isShimmering={isTranslating && activeTab === 'en'}
        />
      </div>
    </div>
  );
}