import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RotateCw } from 'lucide-react';
import { useAccess } from '../../../context/AccessContext';
import { BannerFormData, ContentTranslation } from './types';
import { Radio } from './components/Radio';
import { ColorPicker } from './ColorPicker';
import { RichTextEditor } from './components/RichTextEditor';
import { StyledInput } from './components/FormElements';
import { Switch } from '../ui/switch';
import { DropdownSelect } from './components/DropdownSelect';
import { LayoutConfigTool } from './LayoutConfigTool';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { prefixOptions, loadDefaultPositions } from './utils/layoutUtils';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { toast } from 'sonner';
import { AI_MODELS, DEFAULT_TEXT_MODEL_ID } from '../../../config/ai-models';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';

interface FormStep2Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
  activeTab: 'en' | 'id';
  onTabChange: (tab: 'en' | 'id') => void;
  isTranslating?: boolean;
  setIsTranslating?: (val: boolean) => void;
}

export function FormStep2({ formData, onChange, activeTab, onTabChange, isTranslating: propIsTranslating, setIsTranslating: propSetIsTranslating }: FormStep2Props) {
  const { isWhitelisted } = useAccess();

  // Use prop state if available, otherwise fallback to local (for backward compatibility or isolation)
  const [localIsTranslating, setLocalIsTranslating] = useState(false);
  const isTranslating = propIsTranslating !== undefined ? propIsTranslating : localIsTranslating;
  const setIsTranslating = propSetIsTranslating || setLocalIsTranslating;

  // ADAPTIVE DEFAULTS FOR PRODUCT ENTRY POINT (4:1 RATIO)
  // Ensure we use useEffect to react to ratio changes from Step 1
  useEffect(() => {
      if (formData.bannerCategory === 'Product Entry Point') {
          const isSlim = formData.bannerRatio === 'Mobile (4:1)';
          const isWhatsApp = formData.bannerRatio === 'Mobile (2:1 WhatsApp)';
          const targetSize = isSlim ? 11 : (isWhatsApp ? 12 : 14);
          
          // Only update if current size is different from target (to avoid loop, though standard usage shouldn't loop)
          // We check 'en' as the master trigger, but sync 'id' as well if they match or if it's initial load
          const currentEnSize = formData.content.en.headlineFontSize;
          const currentIdSize = formData.content.id.headlineFontSize;
          
          if (currentEnSize !== targetSize || currentIdSize !== targetSize) {
               onChange({
                   content: {
                       ...formData.content,
                       en: { ...formData.content.en, headlineFontSize: targetSize },
                       id: { ...formData.content.id, headlineFontSize: targetSize }
                   }
               });
          }
      }
  }, [formData.bannerCategory, formData.bannerRatio]); // Run when ratio changes

  const handleAutoTranslate = async () => {
      const sourceLang = activeTab === 'en' ? 'English' : 'Indonesian';
      const targetLang = activeTab === 'en' ? 'Indonesian' : 'English';
      const targetTab = activeTab === 'en' ? 'id' : 'en';

      // Smart Filtering: Collect only active fields
      const sourceContent = formData.content[activeTab];
      const payload: any = {
          headline: sourceContent.headline
      };

      if (formData.headlineType !== '1 Headline') {
          payload.subHeadline = sourceContent.subHeadline;
      }
      
      // Product Entry Point: Include Sub-headline if variant is no_cta
      if (formData.bannerCategory === 'Product Entry Point' && formData.entryPointVariant === 'no_cta') {
          payload.subHeadline = sourceContent.subHeadline;
      }

      if (formData.headlineType === '2 Headlines') {
          payload.secondHeadline = sourceContent.secondHeadline;
      }
      // Note: labelDiscountText usually isn't editable text in some versions, but if it is:
      // Assuming 'labelDiscountText' exists in content type, if not we skip.
      // Based on prompt: "labelDiscountText: Send ONLY if labelDiscount === true"
      if (sourceContent.labelDiscount && (sourceContent as any).labelDiscountText) {
          payload.labelDiscountText = (sourceContent as any).labelDiscountText;
      }
      
      if (sourceContent.additionalLabel && sourceContent.additionalLabelType === 'Custom') {
          payload.additionalLabelText = sourceContent.additionalLabelText;
      }
      
      if (sourceContent.termsAndCondition) {
           // Mapping termsText if exists
           payload.termsText = (sourceContent as any).termsText;
      }

      if (sourceContent.prefixType === 'custom') {
          payload.nudgeText = sourceContent.mainBenefitPrefix;
      }

      // Entry Point CTA
      if (sourceContent.ctaText) {
          payload.ctaText = sourceContent.ctaText;
      }

      setIsTranslating(true);
      try {
          const textModelId = localStorage.getItem('active_text_model') || DEFAULT_TEXT_MODEL_ID;

          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-67753e13/generate-text`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({
                  prompt_json: payload,
                  source_lang: sourceLang,
                  target_lang: targetLang,
                  modelId: textModelId
              })
          });

          if (!res.ok) {
              const text = await res.text();
              let err;
              try {
                  err = JSON.parse(text);
              } catch (e) {
                  err = { error: text || `Request failed with status ${res.status}` };
              }
              console.error("❌ Auto translate API error:", err);
              if (err.details) {
                  console.error("❌ Prediction details/logs:", err.details);
              }
              if (err.prediction_id) {
                  console.error("❌ Prediction ID:", err.prediction_id);
              }
              throw new Error(err.error || "Translation failed");
          }

          const data = await res.json();
          const translated = JSON.parse(data.text);

          // Merge Logic
          const updates: any = {};
          if (translated.headline) updates.headline = translated.headline;
          if (translated.subHeadline) updates.subHeadline = translated.subHeadline;
          if (translated.secondHeadline) updates.secondHeadline = translated.secondHeadline;
          if (translated.labelDiscountText) updates.labelDiscountText = translated.labelDiscountText;
          if (translated.additionalLabelText) updates.additionalLabelText = translated.additionalLabelText;
          if (translated.termsText) updates.termsText = translated.termsText;
          if (translated.nudgeText) updates.mainBenefitPrefix = translated.nudgeText;
          if (translated.ctaText) updates.ctaText = translated.ctaText;

          onChange({
              content: {
                  ...formData.content,
                  [targetTab]: {
                      ...formData.content[targetTab],
                      ...updates
                  }
              }
          });

          onTabChange(targetTab);
          toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message="Content translated successfully!" 
                variant="default"
            />
          ));

      } catch (err: any) {
          console.error("❌ Auto translate error:", err);
          const errorMessage = err?.message || "Failed to translate content.";
          toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message={errorMessage} 
                variant="error"
            />
          ));
      } finally {
          setIsTranslating(false);
      }
  };

  // Removed local activeTab state, using props instead
  
  const updateContent = (updates: Partial<ContentTranslation>) => {
    const otherTab = activeTab === 'en' ? 'id' : 'en';
    const otherUpdates: Partial<ContentTranslation> = {};
    const unitMapEnToId: Record<string, string> = { 'K': 'Rb', 'mio': 'Jt', '%': '%' };
    const unitMapIdToEn: Record<string, string> = { 'Rb': 'K', 'Jt': 'mio', '%': '%' };

    // Sync logic for specific fields
    Object.keys(updates).forEach((key) => {
        const k = key as keyof ContentTranslation;
        const val = updates[k];

        if (k === 'prefixType') {
            otherUpdates.prefixType = val as any;
            if (val !== 'custom') {
                 // Find equivalent text for the other language
                 const option = prefixOptions[otherTab].find(o => o.id === val);
                 if (option) {
                     otherUpdates.mainBenefitPrefix = option.value;
                 }
            } else {
                 otherUpdates.mainBenefitPrefix = '';
            }
        }
        else if (k === 'discountAmount') otherUpdates.discountAmount = val as string;
        else if (k === 'discountType') otherUpdates.discountType = val as any;
        else if (k === 'unit') {
             const map = activeTab === 'en' ? unitMapEnToId : unitMapIdToEn;
             const mapped = map[val as string];
             if (mapped) otherUpdates.unit = mapped as any;
        }
        else if (k === 'unitDisplayType') otherUpdates.unitDisplayType = val as any;
        else if (k === 'hasSecondDiscount') otherUpdates.hasSecondDiscount = val as boolean;
        else if (k === 'secondDiscountType') otherUpdates.secondDiscountType = val as any;
        else if (k === 'secondDiscountAmount') otherUpdates.secondDiscountAmount = val as string;
        else if (k === 'secondDiscountUnit') {
             const map = activeTab === 'en' ? unitMapEnToId : unitMapIdToEn;
             const mapped = map[val as string];
             if (mapped) otherUpdates.secondDiscountUnit = mapped as any;
        }
        else if (k === 'secondUnitDisplayType') otherUpdates.secondUnitDisplayType = val as any;
        else if (k === 'secondDiscountAmountColor') otherUpdates.secondDiscountAmountColor = val as string;
        else if (k === 'secondUnitColor') otherUpdates.secondUnitColor = val as string;
        else if (k === 'secondUnitIconColor') otherUpdates.secondUnitIconColor = val as string;
        
        else if (k === 'labelDiscount') otherUpdates.labelDiscount = val as boolean;
        else if (k === 'labelDiscountType') otherUpdates.labelDiscountType = val as any;
        else if (k === 'labelDiscountIconColor') otherUpdates.labelDiscountIconColor = val as string;
        else if (k === 'additionalLabel') otherUpdates.additionalLabel = val as boolean;
        else if (k === 'additionalLabelType') otherUpdates.additionalLabelType = val as any;
        else if (k === 'additionalLabelTextColor') otherUpdates.additionalLabelTextColor = val as string;
        else if (k === 'additionalLabelBackgroundColor') otherUpdates.additionalLabelBackgroundColor = val as string;
        else if (k === 'additionalLabelFontSize') otherUpdates.additionalLabelFontSize = val as number;
        else if (k === 'termsAndCondition') otherUpdates.termsAndCondition = val as boolean;
        else if (k === 'termsColor') otherUpdates.termsColor = val as string;

        // Sync Colors
        else if (k === 'headlineColor') otherUpdates.headlineColor = val as string;
        else if (k === 'subHeadlineColor') otherUpdates.subHeadlineColor = val as string;
        else if (k === 'prefixColor') otherUpdates.prefixColor = val as string;
        else if (k === 'prefixFontSize') otherUpdates.prefixFontSize = val as number;
        else if (k === 'discountAmountColor') otherUpdates.discountAmountColor = val as string;
        else if (k === 'unitColor') otherUpdates.unitColor = val as string;
        else if (k === 'unitIconColor') otherUpdates.unitIconColor = val as string;
        else if (k === 'labelDiscountColor') otherUpdates.labelDiscountColor = val as string;
        else if (k === 'labelDiscountIconColor') otherUpdates.labelDiscountIconColor = val as string;
        else if (k === 'additionalLabelTextColor') otherUpdates.additionalLabelTextColor = val as string;
        else if (k === 'additionalLabelBackgroundColor') otherUpdates.additionalLabelBackgroundColor = val as string;
        else if (k === 'termsColor') otherUpdates.termsColor = val as string;

        // Sync preset text for Additional Label
        else if (k === 'additionalLabelText') {
             const isPreset = (updates.additionalLabelType === 'Preset') || 
                              (!updates.additionalLabelType && formData.content[activeTab].additionalLabelType === 'Preset');
             if (isPreset) {
                 otherUpdates.additionalLabelText = val as string;
             }
        }
    });

    onChange({
      content: {
        ...formData.content,
        [activeTab]: {
          ...formData.content[activeTab],
          ...updates,
        },
        [otherTab]: {
          ...formData.content[otherTab],
          ...otherUpdates,
        }
      },
    });
  };

  const currentContent = formData.content[activeTab];
  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isSquare = formData.bannerRatio === 'Square (1:1)';
  const isPortrait = formData.bannerRatio === 'Portrait (3:4)';
  const isSlim = formData.bannerRatio === 'Mobile (4:1)';
  const isWhatsAppRatio = formData.bannerRatio === 'Mobile (2:1 WhatsApp)';

  const headlineTypes = isSquare 
      ? ['1 Headline'] // Only single headline for Square (1:1)
      : ['1 Headline', 'With Sub-Headline', '2 Headlines'];

  const currentPrefixOptions = prefixOptions[activeTab];

  const handleTabChange = (newTab: 'en' | 'id') => {
      if (activeTab === newTab) return;

      const currentNudgeId = formData.content[activeTab].prefixType || 'custom';
      const updatedSaved = {
          en: { ...(formData.savedElementPositions?.en || {}) },
          id: { ...(formData.savedElementPositions?.id || {}) }
      };
      
      // Save current positions
      if (formData.elementPositions) {
          updatedSaved[activeTab][currentNudgeId] = formData.elementPositions;
      }

      // Load next positions
      const nextNudgeId = formData.content[newTab].prefixType || 'custom';
      let nextPositions = updatedSaved[newTab][nextNudgeId];

      if (!nextPositions && isSquare) {
          const hasDouble = formData.content.en.hasSecondDiscount || formData.content.id.hasSecondDiscount;
          nextPositions = loadDefaultPositions(newTab, nextNudgeId, hasDouble);
      }

      onChange({
          savedElementPositions: updatedSaved,
          elementPositions: nextPositions || formData.elementPositions
      });

      onTabChange(newTab);
  };

  const handlePrefixChange = (optionId: string, value: string) => {
      const otherLang = activeTab === 'en' ? 'id' : 'en';
      
      // Sync ID is 1:1 because option IDs are same ('discount', 'upto', etc)
      const mappedId = optionId; 
      const otherOption = prefixOptions[otherLang].find(o => o.id === mappedId);
      const mappedValue = otherOption?.value || '';

      // 1. Save current positions for OLD nudge type
      const oldNudgeId = formData.content[activeTab].prefixType || 'custom';
      const updatedSaved = {
          en: { ...(formData.savedElementPositions?.en || {}) },
          id: { ...(formData.savedElementPositions?.id || {}) }
      };
      
      if (formData.elementPositions) {
          updatedSaved[activeTab][oldNudgeId] = formData.elementPositions;
      }

      // 2. Load positions for NEW nudge type
      let newPositions = updatedSaved[activeTab][optionId];
      let newFontSize = currentContent.prefixFontSize; 
      
      const hasDouble = currentContent.hasSecondDiscount;

      // If no saved positions, try defaults
      if (!newPositions && isSquare && optionId !== 'custom') {
           const defaults = loadDefaultPositions(activeTab, optionId, hasDouble);
           if (defaults) {
               newPositions = defaults;
               
               // Get font size from defaults
               const specs = (BANNER_SPECS as any)['Square (1:1)'];
               const nudgeDefaults = activeTab === 'en' ? specs?.nudge_defaults_en : specs?.nudge_defaults_id;
               const activeConfig = nudgeDefaults?.[value.toLowerCase()];
               if (activeConfig?.prefixFontSize) {
                   newFontSize = activeConfig.prefixFontSize;
               }
           }
      }
      
      // 3. Update Content
      const newContent = {
           ...formData.content,
           [activeTab]: {
               ...formData.content[activeTab],
               prefixType: optionId as any,
               mainBenefitPrefix: value,
               prefixFontSize: newFontSize
           },
           [otherLang]: {
               ...formData.content[otherLang],
               prefixType: mappedId as any,
               mainBenefitPrefix: mappedValue,
           }
      };

      onChange({
          content: newContent,
          elementPositions: newPositions || formData.elementPositions,
          savedElementPositions: updatedSaved
      });
  };

  const handleHeadlineTypeChange = (type: string) => {
    const newContent = { 
        ...formData.content,
        en: { ...formData.content.en },
        id: { ...formData.content.id }
    };
    
    const setFontSizeDefaults = (lang: 'en' | 'id') => {
        // Font Size Logic with Persistence
        const savedSizes = newContent[lang].savedFontSizes || {};
        let targetSize = 24; // Default for 1 Headline & With Sub-Headline

        if (savedSizes[type]) {
             targetSize = savedSizes[type]!;
        } else {
             if (type === '2 Headlines') {
                 targetSize = 26;
             } else {
                 targetSize = 24;
             }
        }

        newContent[lang].headlineFontSize = targetSize;
        newContent[lang].savedFontSizes = savedSizes;
    };

    setFontSizeDefaults('en');
    setFontSizeDefaults('id');

    onChange({ 
        headlineType: type as any,
        content: newContent
    });
  };

  // Helper for select all on focus if value matches default
  const handleFocusSelect = (e: React.FocusEvent<HTMLDivElement>, defaultValue: string) => {
      if (e.currentTarget.textContent === defaultValue) {
           const range = document.createRange();
           range.selectNodeContents(e.currentTarget);
           const sel = window.getSelection();
           sel?.removeAllRanges();
           sel?.addRange(range);
      }
  };

  return (
    <div className="flex flex-col gap-[24px]">

      {/* Developer Tool - Disabled for production */}
      {/* 
      {isPromoBanner && isSquare && (
         <LayoutConfigTool formData={formData} currentContent={currentContent} />
      )}
      */}
      
      {/* Portrait content scale slider — placed at top, before headline */}
      {isPortrait && (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[#303135]">Content Scale</label>
            <div className="flex items-center gap-[8px]">
              <span className="text-[13px] font-semibold text-[#007BFF]">{formData.portraitContentScale ?? 120}%</span>
              <button
                type="button"
                onClick={() => onChange({ portraitContentScale: 120 })}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
                title="Reset to 120%"
              >
                <RotateCw size={12} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min={60}
            max={200}
            step={5}
            value={formData.portraitContentScale ?? 120}
            onChange={(e) => onChange({ portraitContentScale: Number(e.target.value) })}
            className="w-full accent-[#007BFF]"
          />
          <div className="flex justify-between text-[11px] text-[#71747d]">
            <span>60%</span>
            <span>120%</span>
            <span>200%</span>
          </div>
        </div>
      )}

      {/* Headline Type Selection (Global) */}
      {isPromoBanner && (
          <div className="flex flex-col gap-[12px]">
              <label className="text-[14px] font-bold text-[#303135]">Headline Type</label>
              <div className="flex gap-[24px]">
                  {headlineTypes.map((type) => (
                      <Radio
                          key={type}
                          name="headlineType"
                          checked={formData.headlineType === type}
                          onChange={() => handleHeadlineTypeChange(type)}
                      >
                          <span className="text-[14px] text-[#303135]">{type}</span>
                      </Radio>
                  ))}
              </div>
          </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[#e9ebef] justify-between items-center">
        <div className="flex">
            <button
            type="button"
            onClick={() => handleTabChange('en')}
            className={`px-[16px] py-[12px] text-[14px] font-bold border-b-2 transition-colors ${
                activeTab === 'en'
                ? 'text-[#007BFF] border-[#007BFF]'
                : 'text-[#71747d] border-transparent hover:text-[#303135]'
            }`}
            >
            EN Translation
            </button>
            <button
            type="button"
            onClick={() => handleTabChange('id')}
            className={`px-[16px] py-[12px] text-[14px] font-bold border-b-2 transition-colors ${
                activeTab === 'id'
                ? 'text-[#007BFF] border-[#007BFF]'
                : 'text-[#71747d] border-transparent hover:text-[#303135]'
            }`}
            >
            ID Translation
            </button>
        </div>

        {/* Auto Translate Button — whitelisted users only */}
        {isWhitelisted && (
          <button
              type="button"
              onClick={handleAutoTranslate}
              disabled={isTranslating}
              className="flex items-center gap-2 text-[14px] font-bold text-[#007BFF] hover:bg-[#e6f2ff] px-3 py-2 rounded-md transition-colors disabled:opacity-50 mr-2"
          >
              <Sparkles className={`w-4 h-4 ${isTranslating ? 'animate-pulse' : ''}`} />
              {isTranslating ? 'Translating...' : (activeTab === 'en' ? 'Translate to ID' : 'Translate to EN')}
          </button>
        )}
      </div>

      {/* PRODUCT ENTRY POINT FIELDS */}
      {isProductEntryPoint && (
          <div className="flex flex-col gap-[24px] animate-in fade-in slide-in-from-bottom-4 duration-300">
               
               {/* Headline */}
               <div className="flex flex-col gap-[8px]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">
                                {isWhatsAppRatio 
                                    ? 'Copy (Max 4 lines)'
                                    : (formData.entryPointVariant === 'with_cta' 
                                        ? (isSlim ? 'Copy (Max 2 lines)' : 'Copy (Max 3 lines)') 
                                        : 'Headline (Max 2 lines)')
                                }
                            </label>
                            <ColorPicker value={currentContent.headlineColor || '#FFFFFF'} onChange={(v) => updateContent({ headlineColor: v })} />
                        </div>
                    </div>

                    <RichTextEditor
                        value={currentContent.headline || ''}
                        onChange={(val) => updateContent({ headline: val })}
                        onGlobalColorChange={(v) => updateContent({ headlineColor: v })}
                        placeholder={
                            activeTab === 'en' ? "Headline Goes Here" : "Tulis Headline Disini"
                        }
                        fontSize={currentContent.headlineFontSize || (isSlim ? 11 : (isWhatsAppRatio ? 12 : 14))}
                        onFontSizeChange={(val) => updateContent({ headlineFontSize: val })}
                        minFontSize={formData.bannerRatio === 'Mobile (4:1)' ? 10 : 10}
                        maxFontSize={formData.bannerRatio === 'Mobile (4:1)' ? 18 : 20}
                    />
               </div>

               {/* Variant Specific Fields */}
               {!isWhatsAppRatio && (
                   formData.entryPointVariant === 'with_cta' ? (
                       // CTA Input
                       <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center gap-[8px]">
                                <label className="text-[14px] font-bold text-[#303135]">CTA Label</label>
                                <span className="text-[12px] text-[#71747d]">(e.g. Book Now)</span>
                            </div>
                            <StyledInput
                                type="text"
                                value={currentContent.ctaText || ''}
                                onChange={(e) => updateContent({ ctaText: e.target.value })}
                                placeholder={activeTab === 'en' ? "Book Now" : "Pesan Sekarang"}
                            />
                       </div>
                   ) : (
                       // Sub-headline Input
                       <div className="flex flex-col gap-[8px]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-[8px]">
                                    <label className="text-[14px] font-bold text-[#303135]">Subtext (Max 3 lines)</label>
                                    <ColorPicker value={currentContent.subHeadlineColor || '#FFFFFF'} onChange={(v) => updateContent({ subHeadlineColor: v })} />
                                </div>
                            </div>
                            <RichTextEditor
                                value={currentContent.subHeadline || ''}
                                onChange={(val) => updateContent({ subHeadline: val })}
                                onGlobalColorChange={(v) => updateContent({ subHeadlineColor: v })}
                                placeholder={activeTab === 'en' ? "Sub-headline" : "Sub-judul"}
                                fontSize={12}
                                onFontSizeChange={() => {}} // Fixed size for subheadline in this layout usually
                                minFontSize={10}
                                maxFontSize={14}
                            />
                       </div>
                   )
               )}
          </div>
      )}

      {isPromoBanner ? (
        // PROMO BANNER FIELDS (Revamp V2)
        <div className="flex flex-col gap-[24px] animate-in fade-in slide-in-from-bottom-4 duration-300">
           
           {/* Dynamic Headline Section */}
           <div className="flex flex-col gap-[16px]">
                
                {/* Headline 1 */}
                <div className="flex flex-col gap-[8px]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">
                                {formData.headlineType === '2 Headlines' ? 'Headline 1 (Max 5 words)' : 'Headline (Max 5 words)'}
                            </label>
                            <ColorPicker value={currentContent.headlineColor} onChange={(v) => updateContent({ headlineColor: v })} />
                        </div>
                    </div>

                    <RichTextEditor
                        value={currentContent.headline || ''}
                        onChange={(val) => updateContent({ headline: val })}
                        onGlobalColorChange={(v) => updateContent({ headlineColor: v })}
                        placeholder={
                            activeTab === 'en' ? "Headline Goes Here" : "Tulis Headline Disini"
                        }
                        fontSize={currentContent.headlineFontSize || 24}
                        onFontSizeChange={(val) => {
                            const saved = currentContent.savedFontSizes || {};
                            updateContent({ 
                                headlineFontSize: val,
                                savedFontSizes: {
                                    ...saved,
                                    [formData.headlineType]: val
                                }
                            });
                        }}
                        minFontSize={formData.headlineType === '2 Headlines' ? 26 : (formData.headlineType === '1 Headline' ? 18 : 24)}
                        maxFontSize={100}
                    />
                </div>

                {/* Headline 2 or Sub-Headline */}
                {formData.headlineType !== '1 Headline' && (
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">
                                {formData.headlineType === '2 Headlines' ? 'Headline 2 (Max 5 words)' : 'Sub-headline (Max 5 words)'}
                            </label>
                            <ColorPicker value={currentContent.subHeadlineColor} onChange={(v) => updateContent({ subHeadlineColor: v })} />
                        </div>
                        {formData.headlineType === '2 Headlines' ? (
                             <RichTextEditor
                                value={currentContent.secondHeadline || ''}
                                onChange={(val) => updateContent({ secondHeadline: val })}
                                onGlobalColorChange={(v) => updateContent({ subHeadlineColor: v })}
                                placeholder={activeTab === 'en' ? "Second Headline Goes Here" : "Tulis Headline Kedua Disini"}
                            />
                        ) : (
                            <RichTextEditor
                                value={currentContent.subHeadline || ''}
                                onChange={(val) => updateContent({ subHeadline: val })}
                                onGlobalColorChange={(v) => updateContent({ subHeadlineColor: v })}
                                placeholder={activeTab === 'en' ? "Sub-headline Goes Here" : "Tulis Sub-headline Disini"}
                                fontSize={currentContent.subHeadlineFontSize || 18}
                                onFontSizeChange={(val) => updateContent({ subHeadlineFontSize: val })}
                                minFontSize={10}
                                maxFontSize={40}
                            />
                        )}
                    </div>
                )}
           </div>

           {/* Nudge Type Selection (Prefix) - Hidden for 2 Headlines */}
           {formData.headlineType !== '2 Headlines' && (
               <div className="flex flex-col gap-[8px]">
                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">Nudge Type</label>
                            <ColorPicker value={currentContent.prefixColor} onChange={(v) => updateContent({ prefixColor: v })} />
                       </div>
                       <Switch 
                           checked={currentContent.showPrefix !== false}
                           onCheckedChange={(checked) => updateContent({ showPrefix: checked })}
                           className="data-[state=checked]:bg-[#007BFF]"
                       />
                   </div>
                   
                   {currentContent.showPrefix !== false && (
                   <>
                   <div className="flex flex-wrap gap-x-[24px] gap-y-[12px]">
                       {currentPrefixOptions.map((option) => (
                           <Radio
                               key={option.id}
                               name={`prefixType-${activeTab}`}
                               checked={currentContent.prefixType === option.id}
                               onChange={() => handlePrefixChange(option.id, option.value)}
                           >
                               <span className="text-[14px] text-[#303135]">{option.label}</span>
                           </Radio>
                       ))}
                   </div>
                   
                   {/* Custom Prefix Input with Toolbar */}
                   {currentContent.prefixType === 'custom' && (
                       <div className="flex flex-col mt-[8px]">
                           <RichTextEditor
                               value={currentContent.mainBenefitPrefix || ''}
                               onChange={(val) => updateContent({ mainBenefitPrefix: val })}
                               onGlobalColorChange={(v) => updateContent({ prefixColor: v })}
                               placeholder={activeTab === 'en' ? "Enter custom prefix" : "Tulis prefix kustom"}
                               fontSize={currentContent.prefixFontSize || 20}
                               onFontSizeChange={(val) => updateContent({ prefixFontSize: val })}
                               minFontSize={14}
                               maxFontSize={24}
                               lineHeight={currentContent.prefixLineHeight}
                               onLineHeightChange={(val) => updateContent({ prefixLineHeight: val })}
                           />
                       </div>
                   )}
                   </>
                   )}
               </div>
           )}

          {/* NEW FIELDS START HERE */}
          <div className="flex flex-col gap-[24px] border-t border-[#e9ebef] pt-[24px]">
              
              {/* Discount Amount & Unit - Hidden for 2 Headlines, Optional for 1 Headline */}
              {formData.headlineType !== '2 Headlines' && (
              <>
              <div className="flex items-center justify-between">
                  <label className="text-[14px] font-bold text-[#303135]">Discount Amount & Unit (optional)</label>
                  <Switch
                      checked={formData.discountEnabled !== false}
                      onCheckedChange={(checked) => onChange({ discountEnabled: checked })}
                      className="data-[state=checked]:bg-[#007BFF]"
                  />
              </div>
              {formData.discountEnabled !== false && (
              <>
              {/* Discount Amount */}
              <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                      <label className="text-[14px] font-bold text-[#303135]">{currentContent.hasSecondDiscount ? 'Discount Amount 1' : 'Discount Amount'}</label>
                      <ColorPicker value={currentContent.discountAmountColor} onChange={(v) => updateContent({ discountAmountColor: v })} />
                  </div>
                  <div className="flex gap-[24px]">
                      <Radio 
                          name={`discountType-${activeTab}`}
                          checked={currentContent.discountType === 'IDR'}
                          onChange={() => updateContent({ discountType: 'IDR' })}
                      >
                          <span className="text-[14px] text-[#303135]">IDR</span>
                      </Radio>
                      <Radio 
                          name={`discountType-${activeTab}`}
                          checked={currentContent.discountType === 'Non-IDR'}
                          onChange={() => updateContent({ discountType: 'Non-IDR' })}
                      >
                          <span className="text-[14px] text-[#303135]">Non-IDR</span>
                      </Radio>
                  </div>
                  <div className="relative">
                      <StyledInput
                          type="text"
                          value={currentContent.discountAmount || ''}
                          onChange={(e) => {
                              const value = e.target.value;
                              // Only allow numbers and limit to 3 characters
                              if (value === '' || /^\d{0,3}$/.test(value)) {
                                  updateContent({ discountAmount: value });
                              }
                          }}
                          placeholder="50"
                          maxLength={3} 
                      />
                      <span className="absolute right-[12px] top-[50%] -translate-y-[50%] text-[12px] text-[#9EA0A5]">
                          {currentContent.discountAmount?.length || 0}/3
                      </span>
                  </div>
              </div>

              {/* Unit */}
              <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                      <label className="text-[14px] font-bold text-[#303135]">Unit</label>
                      <ColorPicker value={currentContent.unitColor} onChange={(v) => updateContent({ unitColor: v })} defaultValue="#0064D2" />
                      
                      {currentContent.unitDisplayType === 'icon' && !isSquare && (
                          <div className="flex items-center gap-[4px] ml-[12px] border-l pl-[12px] border-[#d8dce8]">
                              <span className="text-[12px] text-[#71747d]">Icon Bg:</span>
                              <ColorPicker value={currentContent.unitIconColor} onChange={(v) => updateContent({ unitIconColor: v })} defaultValue="#ffffff" />
                          </div>
                      )}
                  </div>
                  
                  <div className="flex items-center gap-[24px]">
                      {(activeTab === 'en' ? ['K', 'mio', '%'] : ['Rb', 'Jt', '%']).map((u) => (
                          <Radio 
                              key={u}
                              name={`unit-${activeTab}`}
                              checked={currentContent.unit === u}
                              onChange={() => updateContent({ unit: u as any })}
                          >
                              <span className="text-[14px] text-[#303135]">{u}</span>
                          </Radio>
                      ))}

                      {/* Unit Display Type (Icon Toggle) - Hidden for Square ratio */}
                      {!isSquare && (
                      <div className="flex items-center gap-[12px]">
                          <Switch 
                              checked={currentContent.unitDisplayType === 'icon'}
                              onCheckedChange={(checked) => updateContent({ unitDisplayType: checked ? 'icon' : 'text' })}
                              className="data-[state=checked]:bg-[#007BFF]"
                          />
                          <label className="text-[14px] font-medium text-[#303135]">Icon</label>
                      </div>
                      )}
                  </div>
              </div>

              {/* Second Discount Section */}
              <div className="flex flex-col gap-[12px] pt-[8px]">
                {currentContent.hasSecondDiscount ? (
                  <div className="flex flex-col gap-[24px] animate-in fade-in slide-in-from-top-4 duration-300">
                      {/* Amount 2 */}
                      <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-[8px]">
                                  <label className="text-[14px] font-bold text-[#303135]">Discount Amount 2</label>
                                  <ColorPicker value={currentContent.secondDiscountAmountColor} onChange={(v) => updateContent({ secondDiscountAmountColor: v })} />
                              </div>
                              <button 
                                  type="button"
                                  onClick={() => updateContent({ hasSecondDiscount: false })}
                                  className="text-[#9EA0A5] hover:text-[#FF5630] transition-colors"
                                  title="Remove second discount"
                              >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </button>
                          </div>
                          <div className="flex gap-[24px]">
                              <Radio 
                                  name={`discountType2-${activeTab}`}
                                  checked={currentContent.secondDiscountType === 'IDR'}
                                  onChange={() => updateContent({ secondDiscountType: 'IDR' })}
                              >
                                  <span className="text-[14px] text-[#303135]">IDR</span>
                              </Radio>
                              <Radio 
                                  name={`discountType2-${activeTab}`}
                                  checked={currentContent.secondDiscountType === 'Non-IDR' || !currentContent.secondDiscountType}
                                  onChange={() => updateContent({ secondDiscountType: 'Non-IDR' })}
                              >
                                  <span className="text-[14px] text-[#303135]">Non-IDR</span>
                              </Radio>
                          </div>
                          <div className="relative">
                              <StyledInput
                                  type="text"
                                  placeholder="50"
                                  value={currentContent.secondDiscountAmount || ''}
                                  onChange={(e) => {
                                      const val = e.target.value;
                                      if (val.length <= 3 && /^\d*$/.test(val)) {
                                          updateContent({ secondDiscountAmount: val });
                                      }
                                  }}
                              />
                              <span className="absolute right-[12px] top-[50%] -translate-y-[50%] text-[12px] text-[#9EA0A5]">
                                  {currentContent.secondDiscountAmount?.length || 0}/3
                              </span>
                          </div>
                      </div>

                      {/* Unit 2 */}
                      <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center gap-[8px]">
                              <label className="text-[14px] font-bold text-[#303135]">Unit</label>
                              <ColorPicker value={currentContent.secondUnitColor} onChange={(v) => updateContent({ secondUnitColor: v })} defaultValue="#0064D2" />
                              
                              {/* Show Icon Color Picker if Icon mode is active OR if we are in Square mode (which defaults to Icon) */}
                              {(currentContent.secondUnitDisplayType === 'icon' || isSquare) && (
                                  <div className="flex items-center gap-[4px] ml-[12px] border-l pl-[12px] border-[#d8dce8]">
                                      <span className="text-[12px] text-[#71747d]">Icon Bg:</span>
                                      <ColorPicker value={currentContent.secondUnitIconColor} onChange={(v) => updateContent({ secondUnitIconColor: v })} defaultValue="#ffffff" />
                                  </div>
                              )}
                          </div>

                          <div className="flex items-center gap-[24px]">
                              {(activeTab === 'en' ? ['K', 'mio', '%'] : ['Rb', 'Jt', '%']).map((u) => (
                                  <Radio 
                                      key={u}
                                      name={`unit2-${activeTab}`}
                                      checked={currentContent.secondDiscountUnit === u}
                                      onChange={() => updateContent({ secondDiscountUnit: u as any })}
                                  >
                                      <span className="text-[14px] text-[#303135]">{u}</span>
                                  </Radio>
                              ))}

                              {/* Unit Display Type (Icon Toggle) - Only show for non-Square */}
                              {!isSquare && (
                              <div className="flex items-center gap-[12px]">
                                  <Switch 
                                      checked={currentContent.secondUnitDisplayType === 'icon'}
                                      onCheckedChange={(checked) => updateContent({ secondUnitDisplayType: checked ? 'icon' : 'text' })}
                                      className="data-[state=checked]:bg-[#007BFF]"
                                  />
                                  <label className="text-[14px] font-medium text-[#303135]">Icon</label>
                              </div>
                              )}
                          </div>
                      </div>
                  </div>
              ) : (
                  <button
                      type="button"
                      onClick={() => updateContent({ hasSecondDiscount: true, secondDiscountAmount: '', secondDiscountUnit: '%' })}
                      className="text-[14px] font-bold text-[#007BFF] hover:text-[#0064D2] transition-colors self-center py-2"
                  >
                      + Add More Discount
                  </button>
              )}
              </div>
              </>
              )}
              </>
              )}

              {/* Label Discount - Hidden for 'With Sub-Headline' and 'Square (1:1)' */}
              {!isSquare && formData.headlineType !== 'With Sub-Headline' && (
              <div className="flex flex-col gap-[12px] p-[0px] mt-[16px] mr-[0px] mb-[0px] ml-[0px]">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                          <label className="text-[14px] font-bold text-[#303135]">Label Discount (optional)</label>
                          {currentContent.labelDiscount && (
                               <ColorPicker value={currentContent.labelDiscountColor} onChange={(v) => updateContent({ labelDiscountColor: v })} />
                          )}
                      </div>
                      <Switch 
                          checked={currentContent.labelDiscount}
                          onCheckedChange={(checked) => updateContent({ 
                              labelDiscount: checked,
                              labelDiscountType: checked ? 'With icon' : currentContent.labelDiscountType 
                          })}
                          className="data-[state=checked]:bg-[#007BFF]"
                      />
                  </div>
                  
                  {currentContent.labelDiscount && (
                      <div className="flex flex-col gap-[12px] pl-[8px] border-l-2 border-[#e9ebef] animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-[12px]">
                              <div className="flex items-center gap-[12px]">
                                  <Switch 
                                      checked={currentContent.labelDiscountType === 'With icon'}
                                      onCheckedChange={(checked) => updateContent({ labelDiscountType: checked ? 'With icon' : 'Without icon' })}
                                      className="data-[state=checked]:bg-[#007BFF]"
                                  />
                                  <span className="text-[14px] text-[#303135]">Icon</span>
                              </div>
                              
                              {currentContent.labelDiscountType === 'With icon' && (
                                  <div className="flex items-center gap-[4px] ml-[8px]">
                                       <span className="text-[12px] text-[#71747d]">Icon Color:</span>
                                       <ColorPicker value={currentContent.labelDiscountIconColor} onChange={(v) => updateContent({ labelDiscountIconColor: v })} />
                                  </div>
                              )}
                          </div>
                          
                          <div className="flex flex-col">
                              <RichTextEditor
                                  value={currentContent.labelDiscountText || ''}
                                  onChange={(val) => updateContent({ labelDiscountText: val })}
                                  onGlobalColorChange={(v) => updateContent({ labelDiscountColor: v })}
                                  placeholder={activeTab === 'en' ? "Add Label Discount" : "Tambahkan Label Diskon"}
                                  singleLine
                              />
                          </div>
                      </div>
                  )}
              </div>
              )}

              {/* Additional Label - Hidden for 'With Sub-Headline' */}
              {formData.headlineType !== 'With Sub-Headline' && (
              <div className="flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                      <label className="text-[14px] font-bold text-[#303135]">Additional Label (optional)</label>
                      <Switch 
                          checked={currentContent.additionalLabel}
                          onCheckedChange={(checked) => updateContent({ additionalLabel: checked })}
                          className="data-[state=checked]:bg-[#007BFF]"
                      />
                  </div>
                  
                  {currentContent.additionalLabel && (
                      <div className="flex flex-col gap-[12px] pl-[8px] border-l-2 border-[#e9ebef] animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex gap-[16px]">
                              <div className="flex items-center gap-[8px]">
                                  <span className="text-[12px] text-[#71747d]">Text:</span>
                                  <ColorPicker value={currentContent.additionalLabelTextColor} onChange={(v) => updateContent({ additionalLabelTextColor: v })} defaultValue="#0064D2" />
                              </div>
                              <div className="flex items-center gap-[8px]">
                                  <span className="text-[12px] text-[#71747d]">Bg:</span>
                                  <ColorPicker value={currentContent.additionalLabelBackgroundColor} onChange={(v) => updateContent({ additionalLabelBackgroundColor: v })} defaultValue="#FEDD00" />
                              </div>
                          </div>

                          {/* Type Selection */}
                          <div className="flex gap-[24px]">
                              <Radio 
                                  name={`additionalLabelType-${activeTab}`}
                                  checked={currentContent.additionalLabelType === 'Preset'}
                                  onChange={() => updateContent({ additionalLabelType: 'Preset' })}
                              >
                                  <span className="text-[14px] text-[#303135]">Preset</span>
                              </Radio>
                              <Radio 
                                  name={`additionalLabelType-${activeTab}`}
                                  checked={currentContent.additionalLabelType === 'Custom'}
                                  onChange={() => updateContent({ additionalLabelType: 'Custom' })}
                              >
                                  <span className="text-[14px] text-[#303135]">Custom</span>
                              </Radio>
                          </div>

                          {/* Input based on Type */}
                          {currentContent.additionalLabelType === 'Custom' ? (
                              <div className="flex flex-col">
                                  <RichTextEditor
                                      value={currentContent.additionalLabelText || ''}
                                      onChange={(val) => updateContent({ additionalLabelText: val })}
                                      onGlobalColorChange={(v) => updateContent({ additionalLabelTextColor: v })}
                                      onFocus={(e) => {
                                          const presets = ['Limited Offer', 'Special Promo', 'Flash Sale', 'Best Price'];
                                          if (presets.includes(e.currentTarget.textContent || '')) {
                                              const range = document.createRange();
                                              range.selectNodeContents(e.currentTarget);
                                              const sel = window.getSelection();
                                              sel?.removeAllRanges();
                                              sel?.addRange(range);
                                          }
                                      }}
                                      placeholder="Limited Offer"
                                      singleLine
                                      fontSize={currentContent.additionalLabelFontSize || 14}
                                      onFontSizeChange={(val) => updateContent({ additionalLabelFontSize: val })}
                                      minFontSize={10}
                                      maxFontSize={24}
                                  />
                              </div>
                          ) : (
                              <DropdownSelect
                                  options={[
                                      { id: 'Limited Offer', label: 'Limited Offer' },
                                      { id: 'Special Promo', label: 'Special Promo' },
                                      { id: 'Flash Sale', label: 'Flash Sale' },
                                      { id: 'Best Price', label: 'Best Price' }
                                  ]}
                                  value={currentContent.additionalLabelText || ''}
                                  onChange={(val) => updateContent({ additionalLabelText: val })}
                                  placeholder="Select label"
                              />
                          )}
                      </div>
                  )}
              </div>
              )}

              {/* Portrait CTA Button (optional) — form-level so it applies to both EN and ID */}
              {isPortrait && (
                <div className="flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-bold text-[#303135]">CTA Button (optional)</label>
                    <Switch
                      checked={formData.showPortraitCta || false}
                      onCheckedChange={(checked) => onChange({ showPortraitCta: checked })}
                      className="data-[state=checked]:bg-[#007cff]"
                    />
                  </div>
                  {formData.showPortraitCta && (
                    <div className="flex flex-col gap-[12px] mt-[8px] pl-[8px] border-l-2 border-[#e9ebef] animate-in fade-in slide-in-from-top-2 duration-200">

                      {/* Button Color | Text Color — popover triggers */}
                      <div className="flex items-center gap-[8px]">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135] hover:opacity-80 transition-opacity">
                              <span>Button Color</span>
                              <span className="w-[18px] h-[18px] rounded-full ring-1 ring-[#d1d5db] shrink-0" style={{ backgroundColor: formData.ctaButtonColor || '#007BFF' }} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-[12px]" align="start">
                            <div className="flex gap-[8px]">
                              {([
                                { token: 'b100', hex: '#E6F2FF' },
                                { token: 'b400', hex: '#007BFF' },
                                { token: 'b500', hex: '#0064D2' },
                                { token: 'y500', hex: '#FEDD00' },
                                { token: 'n0',   hex: '#FFFFFF' },
                                { token: 'r500', hex: '#E52424' },
                              ] as const).map(({ token, hex }) => (
                                <button key={token} type="button" title={token}
                                  onClick={() => onChange({ ctaButtonColor: hex })}
                                  className={`w-[28px] h-[28px] rounded-full transition-all ${(formData.ctaButtonColor || '#007BFF') === hex ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`}
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>

                        <span className="text-[#d1d5db] select-none">|</span>

                        <Popover>
                          <PopoverTrigger asChild>
                            <button type="button" className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135] hover:opacity-80 transition-opacity">
                              <span>Text Color</span>
                              <span className="w-[18px] h-[18px] rounded-full ring-1 ring-[#d1d5db] shrink-0" style={{ backgroundColor: formData.ctaTextColor || '#FFFFFF' }} />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-[12px]" align="start">
                            <div className="flex gap-[8px]">
                              {([
                                { token: 'n0',   hex: '#FFFFFF' },
                                { token: 'b400', hex: '#007BFF' },
                                { token: 'b700', hex: '#003D81' },
                                { token: 'b500', hex: '#0064D2' },
                                { token: 'y400', hex: '#FEE645' },
                                { token: 'n900', hex: '#18191B' },
                              ] as const).map(({ token, hex }) => (
                                <button key={token} type="button" title={token}
                                  onClick={() => onChange({ ctaTextColor: hex })}
                                  className={`w-[28px] h-[28px] rounded-full transition-all ${(formData.ctaTextColor || '#FFFFFF') === hex ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`}
                                  style={{ backgroundColor: hex }}
                                />
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Button Width — Tiket DS Radio */}
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[14px] font-bold text-[#303135]">Button Width</label>
                        <div className="flex items-center gap-[24px]">
                          {(['hugged', 'fixed'] as const).map((mode) => (
                            <Radio
                              key={mode}
                              name="portraitCtaWidthMode"
                              checked={(formData.portraitCtaWidthMode ?? 'hugged') === mode}
                              onChange={() => onChange({ portraitCtaWidthMode: mode })}
                            >
                              <span className="text-[14px]">{mode === 'hugged' ? 'Hugged' : 'Fixed Width'}</span>
                            </Radio>
                          ))}
                        </div>
                        {(formData.portraitCtaWidthMode ?? 'hugged') === 'fixed' && (
                          <div className="flex flex-col gap-[6px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[12px] text-[#71747d]">Width</span>
                              <div className="flex items-center gap-[8px]">
                                <span className="text-[12px] font-semibold text-[#007BFF]">{formData.portraitCtaFixedWidth ?? 480}px</span>
                                <button
                                  type="button"
                                  onClick={() => onChange({ portraitCtaFixedWidth: 480 })}
                                  className="text-[#71747d] hover:text-[#303135] transition-colors"
                                  title="Reset to 480px"
                                >
                                  <RotateCw size={12} />
                                </button>
                              </div>
                            </div>
                            <input
                              type="range"
                              min={200}
                              max={480}
                              step={10}
                              value={formData.portraitCtaFixedWidth ?? 480}
                              onChange={(e) => onChange({ portraitCtaFixedWidth: Number(e.target.value) })}
                              className="w-full accent-[#007BFF]"
                            />
                            <div className="flex justify-between text-[11px] text-[#71747d]">
                              <span>200px</span><span>480px</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Text field — at the bottom per spec */}
                      <StyledInput
                        type="text"
                        value={currentContent.ctaText || ''}
                        onChange={(e) => updateContent({ ctaText: e.target.value })}
                        placeholder={activeTab === 'en' ? 'Book Now' : 'Pesan Sekarang'}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Terms and Condition */}
              <div className="flex flex-col gap-[12px]">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                          <label className="text-[14px] font-bold text-[#303135]">Terms and Condition (optional)</label>
                          {currentContent.termsAndCondition && (
                               <ColorPicker value={currentContent.termsColor} onChange={(v) => updateContent({ termsColor: v })} defaultValue="#ffffff" />
                          )}
                      </div>
                      <Switch 
                          checked={currentContent.termsAndCondition}
                          onCheckedChange={(checked) => updateContent({ termsAndCondition: checked })}
                          className="data-[state=checked]:bg-[#007BFF]"
                      />
                  </div>

                  {currentContent.termsAndCondition && (
                      <div className="flex flex-col mt-[8px] pl-[8px] border-l-2 border-[#e9ebef] animate-in fade-in slide-in-from-top-2 duration-200">
                          <RichTextEditor
                              value={currentContent.termsText || ''}
                              onChange={(val) => updateContent({ termsText: val })}
                              onGlobalColorChange={(v) => updateContent({ termsColor: v })}
                              placeholder={activeTab === 'en' ? "*T&C apply" : "*S&K berlaku"}
                          />
                      </div>
                  )}
              </div>

          </div>
          {/* END NEW FIELDS */}

        </div>
      ) : (
        // LEGACY FIELDS PLACEHOLDER - Hide for Product Entry Point
        !isProductEntryPoint && (
            <div className="flex flex-col gap-[24px] opacity-50 pointer-events-none">
                <p className="text-center text-[#71747d]">Select "Promo Banner" in Step 1 to edit content.</p>
            </div>
        )
      )}
    </div>
  );
}