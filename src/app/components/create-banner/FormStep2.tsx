import { unitBadgeAutoColor } from './components/PolaroidCollage';
import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles, RotateCw } from 'lucide-react';
import { useAccess } from '../../../context/AccessContext';
import { useMenuVisibility } from '../../../context/MenuVisibilityContext';
import { BannerFormData, ContentTranslation } from './types';
import { Radio } from './components/Radio';
import { ColorPicker } from './ColorPicker';
import { RichTextEditor } from './components/RichTextEditor';
import { StyledInput } from './components/FormElements';
import { Switch } from '../ui/switch';
import { EditableSliderValue } from '../ui/EditableSliderValue';
import { DropdownSelect } from './components/DropdownSelect';
import { LayoutConfigTool } from './LayoutConfigTool';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { prefixOptions, loadDefaultPositions, CURRENCY_OPTIONS, getUnitLabel, getDefaultPortraitContentOffsetY, getDefaultLandscapeContentScale, getDefaultDesktopContentScale, analyzeUniformFormat, applyUniformFormat, stripFontSizeTags, NEW_LANDSCAPE_21_CONTENT_SCALE, NUDGE_TYPES_WITHOUT_AMOUNT, FREE_TEXT_PREFIX_TYPES } from './utils/layoutUtils';
import { projectId } from '../../../../utils/supabase/info';
import { getAuthToken } from '../../../utils/supabase/client';
import { toast } from 'sonner';
import { AI_MODELS, DEFAULT_TEXT_MODEL_ID } from '../../../config/ai-models';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { SegmentedControl } from '../ui/SegmentedControl';

interface FormStep2Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
  activeTab: 'en' | 'id';
  onTabChange: (tab: 'en' | 'id') => void;
  isTranslating?: boolean;
  setIsTranslating?: (val: boolean) => void;
  deviceTab?: 'mobile' | 'desktop' | 'all'; // 2:1 + "Add desktop version?": which version is being edited
  onDeviceTabChange?: (tab: 'mobile' | 'desktop' | 'all') => void;
  /** Inside the DLP Entry Point editor: sticky tab bars match its "Content nudge" tab row (flat, no shadow/bleed, 43px tall) */
  embedded?: boolean;
}

export function FormStep2({ formData, onChange, activeTab, onTabChange, isTranslating: propIsTranslating, setIsTranslating: propSetIsTranslating, deviceTab = 'mobile', onDeviceTabChange, embedded = false }: FormStep2Props) {
  const { isWhitelisted, isAdmin } = useAccess();
  const { isVisible: isMenuVisible } = useMenuVisibility();

  // Sticky-bar shadow rule (see useStickyBar): shadow only when stuck AND bottom-most of the stack
  const langBarRef = useRef<HTMLDivElement>(null);
  const { shadow: langShadow } = useStickyBar(langBarRef);
  const deviceBarRef = useRef<HTMLDivElement>(null);
  const { shadow: deviceShadow } = useStickyBar(deviceBarRef);

  // Use prop state if available, otherwise fallback to local (for backward compatibility or isolation)
  const [localIsTranslating, setLocalIsTranslating] = useState(false);
  const [collapsed, setCollapsed] = useState<{ d1: boolean; d2: boolean }>({ d1: false, d2: false });
  const renderCollapseHeader = (key: 'd1' | 'd2', title: string, summary: string) => (
    <button
      type="button"
      onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
      className="flex items-center justify-between w-full py-[4px] text-left"
    >
      <span className="text-[14px] font-bold text-[#303135]">{title}{collapsed[key] && summary ? <span className="ml-[8px] font-medium text-[#71747d]">{summary}</span> : null}</span>
      <svg className={`w-[16px] h-[16px] transition-transform ${collapsed[key] ? '' : 'rotate-180'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    </button>
  );
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

      if (FREE_TEXT_PREFIX_TYPES.includes(sourceContent.prefixType)) {
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
                  'Authorization': `Bearer ${await getAuthToken()}`
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
    const currencySync = formData.currencySyncLangs !== false;

    // Sync logic for specific fields
    Object.keys(updates).forEach((key) => {
        const k = key as keyof ContentTranslation;
        const val = updates[k];

        if (k === 'prefixType') {
            otherUpdates.prefixType = val as any;
            if (!FREE_TEXT_PREFIX_TYPES.includes(val as string)) {
                 // Find equivalent text for the other language
                 const option = prefixOptions[otherTab].find(o => o.id === val);
                 if (option) {
                     otherUpdates.mainBenefitPrefix = option.value;
                 }
            } else {
                 // Restore the other language's own custom text instead of wiping it
                 otherUpdates.mainBenefitPrefix = formData.content[otherTab].customPrefixText || '';
            }
        }
        else if (k === 'secondPrefixType') {
            otherUpdates.secondPrefixType = val as any;
            otherUpdates.secondBenefitPrefix = FREE_TEXT_PREFIX_TYPES.includes(val as string)
                ? (formData.content[otherTab].secondCustomPrefixText || '')
                : (prefixOptions[otherTab].find(o => o.id === val)?.value || '');
        }
        else if (k === 'discountAmount') otherUpdates.discountAmount = val as string;
        else if (currencySync && k === 'discountType') otherUpdates.discountType = val as any;
        else if (currencySync && k === 'customCurrency') otherUpdates.customCurrency = val as string;
        else if (currencySync && k === 'secondCustomCurrency') otherUpdates.secondCustomCurrency = val as string;
        else if (k === 'unit') {
             const map = activeTab === 'en' ? unitMapEnToId : unitMapIdToEn;
             const mapped = val === '' ? '' : map[val as string];
             if (mapped !== undefined) otherUpdates.unit = mapped as any;
        }
        else if (k === 'unitDisplayType') otherUpdates.unitDisplayType = val as any;
        else if (k === 'hasSecondDiscount') otherUpdates.hasSecondDiscount = val as boolean;
        else if (currencySync && k === 'secondDiscountType') otherUpdates.secondDiscountType = val as any;
        else if (k === 'secondDiscountAmount') otherUpdates.secondDiscountAmount = val as string;
        else if (k === 'secondDiscountUnit') {
             const map = activeTab === 'en' ? unitMapEnToId : unitMapIdToEn;
             const mapped = val === '' ? '' : map[val as string];
             if (mapped !== undefined) otherUpdates.secondDiscountUnit = mapped as any;
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

        // Sync headline size/style (weight, italic) when the toggle is on — size is a plain
        // field so it always mirrors; weight/italic only mirror when applied to the WHOLE
        // headline text (not a partial selection), since the two languages have different words.
        else if (formData.headlineFormatSynced && (k === 'headlineFontSize' || k === 'subHeadlineFontSize')) {
            (otherUpdates as any)[k] = val;
            // Clear any leftover per-character size override on the other language's text — otherwise it keeps
            // rendering at its old size regardless of the new block-level size the Size field now shows.
            const textKey = k === 'headlineFontSize' ? 'headline' : 'subHeadline';
            const otherText = formData.content[otherTab][textKey] || '';
            (otherUpdates as any)[textKey] = stripFontSizeTags(otherText);
        }
        else if (formData.headlineFormatSynced && (k === 'headline' || k === 'subHeadline' || k === 'secondHeadline')) {
            const format = analyzeUniformFormat(val as string);
            if (format) {
                const otherText = formData.content[otherTab][k as 'headline' | 'subHeadline' | 'secondHeadline'] || '';
                (otherUpdates as any)[k] = applyUniformFormat(stripFontSizeTags(otherText), format);
            }
        }

        // Sync Additional Perks size/style (weight, italic) when the toggle is on — same pattern as the headline sync above.
        else if (formData.labelDiscountFormatSynced && k === 'labelDiscountFontSize') {
            (otherUpdates as any)[k] = val;
            otherUpdates.labelDiscountText = stripFontSizeTags(formData.content[otherTab].labelDiscountText || '');
        }
        else if (formData.labelDiscountFormatSynced && k === 'labelDiscountText') {
            const format = analyzeUniformFormat(val as string);
            const otherText = formData.content[otherTab].labelDiscountText || '';
            otherUpdates.labelDiscountText = format ? applyUniformFormat(stripFontSizeTags(otherText), format) : stripFontSizeTags(otherText);
        }

        // Sync Colors
        else if (k === 'headlineColor') otherUpdates.headlineColor = val as string;
        else if (k === 'subHeadlineColor') otherUpdates.subHeadlineColor = val as string;
        else if (k === 'prefixColor') otherUpdates.prefixColor = val as string;
        else if (k === 'secondPrefixColor') otherUpdates.secondPrefixColor = val as string;
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
             // Preset labels and voucher codes are the same in both languages
             const type = updates.additionalLabelType ?? formData.content[activeTab].additionalLabelType;
             const isPreset = type === 'Preset' || type === 'Voucher';
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
  // DLP Mobile Header 1:1 draws the 3:4 content block, so it gets the 3:4 controls (nudge position, unit icon, benefit scale)
  const isDlpSquare = isSquare && formData.dlpRole === 'header-mobile';
  const isPortrait = formData.bannerRatio === 'Portrait (3:4)';
  // 3:4 and 1:1 render Additional Perks at 28 by default, the landscape layouts at 14
  const perksDefaultSize = isPortrait || isSquare ? 28 : 14;
  // Landscape (3:1) is a TTD Promo Asset ratio that clones the 2:1 layout onto a wider canvas — treated identically everywhere 2:1 is.
  const isLandscape21 = formData.bannerRatio === 'Landscape (2:1)' || formData.bannerRatio === 'Landscape (3:1)';
  // Portrait 3:4 and Landscape 2:1 share the Discount 1/2 cards, per-discount nudge, benefit scale and content position
  // DLP Header desktop: the 5:1 layout on a 4:1 canvas, no CTA
  const isDesktop41 = formData.bannerRatio === 'Desktop (4:1)';
  const desktopRatioLabel = isDesktop41 ? '4:1' : '5:1';
  const isDesktop51 = formData.bannerCategory === 'Promo Banner' && (formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)');
  const hasDesktopVersion = formData.bannerRatio === 'Landscape (2:1)' && !!formData.provideDesktopBanner;
  const usesBenefitCards = isPortrait || isDlpSquare || isLandscape21 || isDesktop51;
  // Scale / position sliders exist for 3:4 and 2:1 only (Desktop 5:1 has its own in the Desktop 5:1 card)
  const usesScaleSliders = usesBenefitCards && !isDesktop51 && !isDlpSquare; // DLP 1:1 has its own square scale/position sliders
  // Desktop 5:1 content scale default: 140% with one discount, 125% with two
  // Desktop 5:1 content X: free area between the logos (left) and the CTA (right); T&C is only a small corner so it doesn't limit it
  const desktopHalf = 175 * ((formData.desktopContentScale ?? getDefaultDesktopContentScale(formData)) / 100);
  const desktopCtaOn = formData.desktopCtaEnabled === true && !isDesktop41; // 4:1 has no CTA
  const desktopYMax = isDesktop41 ? 200 : 150; // half the canvas height (400 / 500) minus 50
  const desktopCenter = (desktopCtaOn ? 639 : 880) + 391;
  const desktopXMin = Math.round(360 + desktopHalf - desktopCenter);
  const desktopXMax = Math.round((desktopCtaOn ? 1480 : 1920) - desktopHalf - desktopCenter);
  const desktopScaleDefault = getDefaultDesktopContentScale(formData);
  const isSlim = formData.bannerRatio === 'Mobile (4:1)';
  const isWhatsAppRatio = formData.bannerRatio === 'Mobile (2:1 WhatsApp)';

  const headlineTypes = ['1 Headline', 'With Sub-Headline', '2 Headlines'];

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
      const cur = formData.content[activeTab];
      const other = formData.content[otherLang];

      // Remember free-text (Custom / Buy X get Y) when leaving it, restore it when coming back (per language)
      const curCustom = FREE_TEXT_PREFIX_TYPES.includes(cur.prefixType) ? (cur.mainBenefitPrefix || '') : (cur.customPrefixText || '');
      const otherCustom = FREE_TEXT_PREFIX_TYPES.includes(other.prefixType) ? (other.mainBenefitPrefix || '') : (other.customPrefixText || '');
      if (FREE_TEXT_PREFIX_TYPES.includes(optionId)) value = curCustom || value;
      const mappedValue = FREE_TEXT_PREFIX_TYPES.includes(optionId) ? (otherCustom || otherOption?.value || '') : (otherOption?.value || '');

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
      if (!newPositions && isSquare && !FREE_TEXT_PREFIX_TYPES.includes(optionId)) {
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
      
      // Nudge types like "Buy X get X" imply there's no numeric discount — force amount/unit off
      const forcesNoAmount = NUDGE_TYPES_WITHOUT_AMOUNT.includes(optionId);
      const noAmountOverrides = forcesNoAmount ? { discountType: 'Non-IDR' as const, unit: '' as const } : {};

      // 3. Update Content
      const newContent = {
           ...formData.content,
           [activeTab]: {
               ...formData.content[activeTab],
               prefixType: optionId as any,
               mainBenefitPrefix: value,
               customPrefixText: curCustom,
               prefixFontSize: newFontSize,
               ...noAmountOverrides
           },
           [otherLang]: {
               ...formData.content[otherLang],
               prefixType: mappedId as any,
               mainBenefitPrefix: mappedValue,
               customPrefixText: otherCustom,
               ...noAmountOverrides
           }
      };

      onChange({
          content: newContent,
          elementPositions: newPositions || formData.elementPositions,
          savedElementPositions: updatedSaved
      });
  };

  // Currency picker (Rp / IDR / Custom / None) shared by Discount Amount 1 and 2
  const renderCurrencyPicker = (which: 'first' | 'second') => {
    const isSecond = which === 'second';
    const selected = (isSecond ? currentContent.secondDiscountType : currentContent.discountType) || 'Non-IDR';
    const customValue = (isSecond ? currentContent.secondCustomCurrency : currentContent.customCurrency) || '';
    // "None" only hides the currency; the amount and unit stay as they are.
    const setType = (v: ContentTranslation['discountType']) =>
      updateContent(isSecond ? { secondDiscountType: v } : { discountType: v });
    return (
      <div className="flex flex-col gap-[8px]">
        <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
          {CURRENCY_OPTIONS.map((opt) => (
            <Radio
              key={opt.value}
              name={`${isSecond ? 'discountType2' : 'discountType'}-${activeTab}`}
              checked={selected === opt.value}
              onChange={() => setType(opt.value)}
            >
              <span className="text-[14px] text-[#303135]">{opt.label}</span>
            </Radio>
          ))}
        </div>
        {selected === 'Custom' && (
          <StyledInput
            type="text"
            value={customValue}
            onChange={(e) => {
              const v = e.target.value.toUpperCase().slice(0, 5);
              updateContent(isSecond ? { secondCustomCurrency: v } : { customCurrency: v });
            }}
            placeholder="e.g. USD, S$, ¥"
            maxLength={5}
          />
        )}
      </div>
    );
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

  const renderNudge1 = () => (
               <div className="flex flex-col gap-[12px]">
                   <div className="flex items-center justify-between">
                       <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">Nudge Type</label>
                            <ColorPicker value={currentContent.prefixColor} onChange={(v) => updateContent({ prefixColor: v })} defaultValue="#FEDD00" />
                       </div>
                       <Switch 
                           checked={currentContent.showPrefix !== false}
                           onCheckedChange={(checked) => updateContent({ showPrefix: checked })}
                           className="data-[state=checked]:bg-[#007BFF]"
                       />
                   </div>
                   {/* Nudge position (single discount; with two discounts the nudges are always above their numbers) */}
                   {currentContent.showPrefix !== false && (!isSquare || isDlpSquare) && !currentContent.hasSecondDiscount && (
                       <label className="flex items-center gap-[8px] text-[13px] text-[#303135]">
                           <Switch
                               checked={!!formData.nudgeOnTop}
                               onCheckedChange={(checked) => onChange({ nudgeOnTop: checked })}
                               className="data-[state=checked]:bg-[#007BFF]"
                           />
                           Place nudge above the number
                       </label>
                   )}
                   
                   {currentContent.showPrefix !== false && (
                   <>
                   <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px]">
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
                   {FREE_TEXT_PREFIX_TYPES.includes(currentContent.prefixType) && (
                       <div className="flex flex-col mt-[8px]">
                           <RichTextEditor
                               value={currentContent.mainBenefitPrefix || ''}
                               onChange={(val) => updateContent({ mainBenefitPrefix: val, customPrefixText: val })}
                               onGlobalColorChange={(v) => updateContent({ prefixColor: v })}
                               placeholder={activeTab === 'en' ? "Enter custom prefix" : "Tulis prefix kustom"}
                               fontSize={currentContent.prefixFontSize || 20}
                               defaultFontSize={20}
                               onFontSizeChange={(val) => updateContent({ prefixFontSize: val })}
                               minFontSize={14}
                               maxFontSize={48}
                               lineHeight={currentContent.prefixLineHeight}
                               onLineHeightChange={(val) => updateContent({ prefixLineHeight: val })}
                           />
                       </div>
                   )}
                   </>
                   )}
               </div>
  );

  // Desktop layout card: only the bundled 2:1 + 5:1 has layout sliders. CTA and T&C get their own cards.
  const desktopSettingsCard = !hasDesktopVersion ? null : (
                <div className="flex flex-col gap-[24px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                  <div className="flex flex-col gap-[4px]">
                    <span className="text-[14px] font-bold text-[#303135]">Desktop {desktopRatioLabel}</span>
                    <span className="text-[12px] text-[#71747d]">Layout settings for the Desktop {desktopRatioLabel} banner. Headline, nudge, discount and T&C are shared with the rest of this banner.</span>
                  </div>

                  {hasDesktopVersion && (<>
                  {([
                    ['Content Scale', 'desktopContentScale', desktopScaleDefault, '%', 60, 200, 5],
                    ['Content Position X', 'desktopContentOffsetX', 0, 'px', desktopXMin, desktopXMax, 2],
                    ['Content Position Y', 'desktopContentOffsetY', 0, 'px', -desktopYMax, desktopYMax, 2],
                  ] as const).map(([label, key, def, unit, min, max, step]) => (
                    <div key={key} className="flex flex-col gap-[8px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[14px] font-bold text-[#303135]">{label}</label>
                        <div className="flex items-center gap-[8px]">
                          <EditableSliderValue value={(formData as any)[key] ?? def} onChange={(v) => onChange({ [key]: v } as any)} suffix={unit} min={min} max={max} className="text-[13px] font-semibold text-[#007BFF]" />
                          <button type="button" onClick={() => onChange({ [key]: def } as any)} className="text-[#71747d] hover:text-[#303135] transition-colors" title={`Reset to ${def}${unit}`}>
                            <RotateCw size={12} />
                          </button>
                        </div>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={(formData as any)[key] ?? def} onChange={(e) => onChange({ [key]: Number(e.target.value) } as any)} className="w-full accent-[#007BFF]" />
                    </div>
                  ))}
                  </>)}
                  {hasDesktopVersion && (<>
                  <div className="border-t border-[#e9ebef]" />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <label className="text-[14px] font-bold text-[#303135]">Center content vertically</label>
                      <span className="text-[12px] text-[#71747d]">Ignores the extra top spacing the 2:1 layout uses.</span>
                    </div>
                    <Switch
                      checked={formData.desktopVerticalCenter !== false}
                      onCheckedChange={(checked) => onChange({ desktopVerticalCenter: checked })}
                      className="data-[state=checked]:bg-[#007BFF]"
                    />
                  </div>

                  </>)}


                </div>
  );

  const desktopCtaCard = isDesktop41 ? null : (
                  <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                    <div className="flex items-center justify-between">
                      <label className="text-[14px] font-bold text-[#303135]">CTA Button</label>
                      <Switch
                        checked={formData.desktopCtaEnabled === true}
                        onCheckedChange={(checked) => onChange({ desktopCtaEnabled: checked })}
                        className="data-[state=checked]:bg-[#007BFF]"
                      />
                    </div>
                    {formData.desktopCtaEnabled === true && (
                      <>
                      <StyledInput
                        type="text"
                        placeholder={activeTab === 'en' ? 'Book Now' : 'Pesan Sekarang'}
                        value={currentContent.ctaText || ''}
                        onChange={(e) => updateContent({ ctaText: e.target.value })}
                      />
                      {/* Same button / text colour settings as the mobile CTA (shared fields) */}
                      {/* Button Color | Text Color — popover triggers */}
                      <div className="flex items-center gap-[8px]">
                        <div className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135]">
                              <span>Button Color</span>
                              <ColorPicker value={formData.ctaButtonColor} onChange={(v) => onChange({ ctaButtonColor: v })} defaultValue="#007BFF" />
                            </div>

                        <span className="text-[#d1d5db] select-none">|</span>

                        <div className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135]">
                              <span>Text Color</span>
                              <ColorPicker value={formData.ctaTextColor} onChange={(v) => onChange({ ctaTextColor: v })} defaultValue="#FFFFFF" />
                            </div>
                      </div>

                      </>
                    )}
                  </div>
  );

  // T&C card. On desktop banners the T&C font size + position reset live inside it.
  const termsCard = (desktopTnc: boolean) => (
              <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
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
                      <div className="flex flex-col mt-[8px] animate-in fade-in slide-in-from-top-2 duration-200">
                          <RichTextEditor
                              value={currentContent.termsText || ''}
                              onChange={(val) => updateContent({ termsText: val })}
                              onGlobalColorChange={(v) => updateContent({ termsColor: v })}
                              placeholder={activeTab === 'en' ? "*T&C apply" : "*S&K berlaku"}
                              {...(desktopTnc ? {
                                  fontSize: formData.desktopTncFontSize ?? 20,
                                  defaultFontSize: 20,
                                  onFontSizeChange: (v: number) => onChange({ desktopTncFontSize: v }),
                                  minFontSize: 10,
                                  maxFontSize: 80,
                              } : {})}
                          />
                          {desktopTnc && (
                              <div className="flex items-center justify-between gap-[8px] mt-[8px]">
                                  <span className="text-[12px] text-[#71747d]">Drag the T&C in the preview to move it; drag its left corners to widen the area it wraps in.</span>
                                  <button type="button" onClick={() => onChange({ desktopTncOffset: { x: 0, y: 0 }, desktopTncWidth: 720 })} className="shrink-0 text-[12px] font-semibold text-[#007BFF] hover:underline">Reset position & width</button>
                              </div>
                          )}
                      </div>
                  )}
              </div>
  );

  // Headline Type (global, not per language): first row of the headline box
  const headlineTypePicker = (
          <div className="flex flex-col gap-[10px]">
              <label className="text-[14px] font-bold text-[#303135]">Headline Type</label>
              <div className="flex flex-wrap gap-x-[20px] gap-y-[8px]">
                  {headlineTypes.map((type) => (
                      <Radio key={type} name="headlineType" checked={formData.headlineType === type} onChange={() => handleHeadlineTypeChange(type)}>
                          <span className="text-[14px] text-[#303135]">{type}</span>
                      </Radio>
                  ))}
              </div>
          </div>
  );

  // EN / ID tabs (sticky)
  const langTabs = (
    <>
      <div ref={langBarRef} className={`flex justify-between items-center sticky z-[43] bg-white ${embedded ? 'py-[8px]' : 'py-[12px]'} -mx-[24px] px-[24px] ${langShadow ? STICKY_SHADOW : 'border-b border-[#e9ebef]'}`} style={{ top: hasDesktopVersion ? `calc(var(--sticky-top, 0px) + ${embedded ? 43 : 46}px)` : 'var(--sticky-top, 0px)' }}>

        <SegmentedControl
          items={[
            { id: 'en', label: <span className="flex items-center gap-[6px]"><span role="img" aria-label="en">🇺🇸</span> EN</span> },
            { id: 'id', label: <span className="flex items-center gap-[6px]"><span role="img" aria-label="id">🇮🇩</span> ID</span> },
          ]}
          activeId={activeTab}
          onChange={(id) => handleTabChange(id as 'en' | 'id')}
        />

        <div className="flex items-center gap-[8px]">
        {/* Auto Translate Button — whitelisted users only, and can be hidden in Menu Management */}
        {isWhitelisted && isMenuVisible('Auto Translate', isAdmin) && (
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
      </div>

    </>
  );

  // Mobile | Desktop — same tab style as EN/ID, above them when the 2:1 banner also has a desktop version
  const deviceBar = hasDesktopVersion ? (
    <div ref={deviceBarRef} className={`flex sticky top-[var(--sticky-top,0px)] z-[42] bg-white ${deviceShadow ? STICKY_SHADOW : 'border-b border-[#e9ebef]'} ${embedded ? '-mx-[24px] px-[24px]' : '-mx-[24px] -mt-[24px] px-[24px]'}`}>
      {([['mobile', 'Mobile (2:1)'], ['desktop', 'Desktop (5:1)']] as const).map(([id, text]) => (
        <button
          key={id}
          type="button"
          onClick={() => onDeviceTabChange?.(id)}
          className={`px-[16px] ${embedded ? 'py-[10px]' : 'py-[12px]'} text-[14px] font-bold border-b-2 transition-colors ${(deviceTab === 'all' ? 'mobile' : deviceTab) === id ? 'text-[#007BFF] border-[#007BFF]' : 'text-[#71747d] border-transparent hover:text-[#303135]'}`}
        >
          {text}
        </button>
      ))}
    </div>
  ) : null;

  if (hasDesktopVersion && deviceTab === 'desktop') {
    return (
      <div className="flex flex-col gap-[20px]">
        {deviceBar}
        {langTabs}
        {desktopSettingsCard}
        {desktopCtaCard}
        {termsCard(true)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px]">
      {deviceBar}

      {/* Developer Tool - Disabled for production */}
      {/* 
      {isPromoBanner && isSquare && (
         <LayoutConfigTool formData={formData} currentContent={currentContent} />
      )}
      */}
      
      {/* Content Layout box — groups the scale / position sliders and the vertical-centre toggle */}
      {(isDesktop51 || isPortrait || isLandscape21 || usesScaleSliders || (isSquare && formData.dlpRole === 'header-mobile')) && (
      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
      <span className="text-[14px] font-bold text-[#303135]">Content Layout</span>
      {/* Desktop 5:1 (stand alone): scale + position at the top, same as 2:1 and 3:4 */}
      {isDesktop51 && (
        <div className="flex flex-col gap-[16px]">
          {([
                    ['Content Scale', 'desktopContentScale', desktopScaleDefault, '%', 60, 200, 5],
                    ['Content Position X', 'desktopContentOffsetX', 0, 'px', desktopXMin, desktopXMax, 2],
                    ['Content Position Y', 'desktopContentOffsetY', 0, 'px', -desktopYMax, desktopYMax, 2],
                  ] as const).map(([label, key, def, unit, min, max, step]) => (
                    <div key={key} className="flex flex-col gap-[8px]">
                      <div className="flex items-center justify-between">
                        <label className="text-[14px] font-bold text-[#303135]">{label}</label>
                        <div className="flex items-center gap-[8px]">
                          <EditableSliderValue value={(formData as any)[key] ?? def} onChange={(v) => onChange({ [key]: v } as any)} suffix={unit} min={min} max={max} className="text-[13px] font-semibold text-[#007BFF]" />
                          <button type="button" onClick={() => onChange({ [key]: def } as any)} className="text-[#71747d] hover:text-[#303135] transition-colors" title={`Reset to ${def}${unit}`}>
                            <RotateCw size={12} />
                          </button>
                        </div>
                      </div>
                      <input type="range" min={min} max={max} step={step} value={(formData as any)[key] ?? def} onChange={(e) => onChange({ [key]: Number(e.target.value) } as any)} className="w-full accent-[#007BFF]" />
                    </div>
          ))}
        </div>
      )}

      {/* Square 1:1 (DLP Mobile Header): content scale + position, same UI as 3:4 */}
      {isSquare && formData.dlpRole === 'header-mobile' && (
        <div className="flex flex-col gap-[16px]">
          {([
            ['Content Scale', 'squareContentScale', 100, '%', 60, 200, 5],
            ['Content Position Y', 'squareContentOffsetY', 0, 'px', -200, 200, 2],
          ] as const).map(([label, key, def, unit, min, max, step]) => (
            <div key={key} className="flex flex-col gap-[8px]">
              <div className="flex items-center justify-between">
                <label className="text-[14px] font-bold text-[#303135]">{label}</label>
                <div className="flex items-center gap-[8px]">
                  <EditableSliderValue value={formData[key] ?? def} onChange={(v) => onChange({ [key]: v })} suffix={unit} min={min} max={max} className="text-[13px] font-semibold text-[#007BFF]" />
                  <button type="button" onClick={() => onChange({ [key]: def })} className="text-[#71747d] hover:text-[#303135] transition-colors" title={`Reset to ${def}${unit}`}>
                    <RotateCw size={12} />
                  </button>
                </div>
              </div>
              <input type="range" min={min} max={max} step={step} value={formData[key] ?? def} onChange={(e) => onChange({ [key]: Number(e.target.value) })} className="w-full accent-[#007BFF]" />
            </div>
          ))}
        </div>
      )}

      {/* Portrait content scale slider — placed at top, before headline */}
      {isPortrait && (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[#303135]">Content Scale</label>
            <div className="flex items-center gap-[8px]">
              <EditableSliderValue value={formData.portraitContentScale ?? 120} onChange={(v) => onChange({ portraitContentScale: v })} suffix="%" min={60} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
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

      {/* Landscape 2:1 overall content scale */}
      {isLandscape21 && (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[#303135]">Content Scale</label>
            <div className="flex items-center gap-[8px]">
              <EditableSliderValue value={formData.landscapeContentScale ?? getDefaultLandscapeContentScale(formData)} onChange={(v) => onChange({ landscapeContentScale: v })} suffix="%" min={60} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
              <button type="button" onClick={() => onChange({ landscapeContentScale: formData.bannerRatio === 'Landscape (2:1)' ? NEW_LANDSCAPE_21_CONTENT_SCALE : getDefaultLandscapeContentScale(formData) })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to default">
                <RotateCw size={12} />
              </button>
            </div>
          </div>
          <input type="range" min={60} max={200} step={5} value={formData.landscapeContentScale ?? getDefaultLandscapeContentScale(formData)} onChange={(e) => onChange({ landscapeContentScale: Number(e.target.value) })} className="w-full accent-[#007BFF]" />
          <div className="flex justify-between text-[11px] text-[#71747d]">
            <span>60%</span>
            <span>100%</span>
            <span>200%</span>
          </div>
        </div>
      )}

      {/* Portrait content position — manual offset of the headline/benefit block */}
      {usesScaleSliders && (
        <div className="flex flex-col gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-bold text-[#303135]">Content Position Y</label>
              <div className="flex items-center gap-[8px]">
                <EditableSliderValue value={formData.portraitContentOffsetY ?? getDefaultPortraitContentOffsetY(formData, currentContent)} onChange={(v) => onChange({ portraitContentOffsetY: v })} suffix="px" min={-200} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
                <button type="button" onClick={() => onChange({ portraitContentOffsetY: getDefaultPortraitContentOffsetY(formData, currentContent) })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to default">
                  <RotateCw size={12} />
                </button>
              </div>
            </div>
            <input type="range" min={-200} max={200} step={2} value={formData.portraitContentOffsetY ?? getDefaultPortraitContentOffsetY(formData, currentContent)} onChange={(e) => onChange({ portraitContentOffsetY: Number(e.target.value) })} className="w-full accent-[#007BFF]" />
          </div>
        </div>
      )}

      {/* Centre the content block vertically — under the scale/position sliders for 2:1, 3:4 and Desktop 5:1 */}
      {isDesktop51 && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-[14px] font-bold text-[#303135]">Center content vertically</label>
            <span className="text-[12px] text-[#71747d]">{isDesktop51 ? 'Ignores the extra top spacing the 2:1 layout uses.' : 'Centers the content block in the banner.'}</span>
          </div>
          <Switch
            checked={isDesktop51 ? formData.desktopVerticalCenter !== false : !!formData.centerContentVertically}
            onCheckedChange={(checked) => onChange(isDesktop51 ? { desktopVerticalCenter: checked } : { centerContentVertically: checked })}
            className="data-[state=checked]:bg-[#007BFF]"
          />
        </div>
      )}
      </div>
      )}

      {langTabs}

      {/* Text shadow: one switch for every text layer of the banner (headline, benefit, labels). Off by default (missing = off), for every banner. */}
      <label className="flex items-center justify-between gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] cursor-pointer">
        <div className="flex flex-col">
          <span className="text-[14px] font-bold text-[#303135]">Text shadow</span>
          <span className="text-[12px] text-[#71747d]">Soft drop shadow behind the headline, benefit and labels.</span>
        </div>
        <Switch
          checked={formData.textShadow === true}
          onCheckedChange={(checked) => onChange({ textShadow: checked })}
          className="data-[state=checked]:bg-[#007BFF]"
        />
      </label>

      {/* PRODUCT ENTRY POINT FIELDS */}
      {isProductEntryPoint && (
          <div className="flex flex-col gap-[20px] animate-in fade-in slide-in-from-bottom-4 duration-300">
               
               {/* Headline */}
               <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
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
                            <ColorPicker value={currentContent.headlineColor || '#FEDD00'} onChange={(v) => updateContent({ headlineColor: v })} />
                        </div>
                    </div>

                    <RichTextEditor
                        value={currentContent.headline || ''}
                        onChange={(val) => updateContent({ headline: val })}
                        onGlobalColorChange={(v) => updateContent({ headlineColor: v })}
                        globalColor={currentContent.headlineColor || '#FEDD00'}
                        placeholder={
                            activeTab === 'en' ? "Headline Goes Here" : "Tulis Headline Disini"
                        }
                        fontSize={currentContent.headlineFontSize || (isSlim ? 11 : (isWhatsAppRatio ? 12 : 14))}
                        defaultFontSize={isSlim ? 11 : (isWhatsAppRatio ? 12 : 14)}
                        onFontSizeChange={(val) => updateContent({ headlineFontSize: val })}
                        minFontSize={formData.bannerRatio === 'Mobile (4:1)' ? 10 : 10}
                        maxFontSize={formData.bannerRatio === 'Mobile (4:1)' ? 18 : 20}
                    />
               </div>

               {/* Variant Specific Fields */}
               {!isWhatsAppRatio && (
                   formData.entryPointVariant === 'with_cta' ? (
                       // CTA Input
                       <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
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
                       <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
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
        <div className="flex flex-col gap-[20px] animate-in fade-in slide-in-from-bottom-4 duration-300">
           
           {/* Dynamic Headline Section */}
           <div className="flex flex-col gap-[16px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                {headlineTypePicker}
                <div className="border-t border-[#e9ebef]" />
                
                {/* Headline 1 */}
                <div className="flex flex-col gap-[8px]">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">
                                {formData.headlineType === '2 Headlines' ? 'Headline 1 (Rec. 5 words)' : 'Headline (Rec. 5 words)'}
                            </label>
                            <ColorPicker value={currentContent.headlineColor || '#FEDD00'} onChange={(v) => updateContent({ headlineColor: v })} />
                        </div>
                        <label className="flex items-center gap-[6px] text-[12px] font-semibold text-[#5e6066] cursor-pointer" title="Mirrors headline font size, weight and italic between EN and ID">
                            Sync style with {activeTab === 'en' ? 'ID' : 'EN'}
                            <Switch
                                checked={!!formData.headlineFormatSynced}
                                onCheckedChange={(checked) => {
                                    const otherTab = activeTab === 'en' ? 'id' : 'en';
                                    const otherUpdates: Partial<ContentTranslation> = {};
                                    if (checked) {
                                        // Turning sync on adopts this language's CURRENT style on the other one right away, instead of
                                        // only mirroring future edits (which left the other language's old style in place until next edit).
                                        otherUpdates.headlineFontSize = currentContent.headlineFontSize;
                                        otherUpdates.subHeadlineFontSize = currentContent.subHeadlineFontSize;
                                        (['headline', 'subHeadline', 'secondHeadline'] as const).forEach((k) => {
                                            // Always strip any leftover per-character size override on the other language's text — the
                                            // block-level size above is now authoritative, so an old <fs> tag would otherwise keep
                                            // part of that text rendering at its stale size regardless of what the Size field shows.
                                            const otherText = stripFontSizeTags(formData.content[otherTab][k] || '');
                                            const format = analyzeUniformFormat(currentContent[k] || '');
                                            otherUpdates[k] = format ? applyUniformFormat(otherText, format) : otherText;
                                        });
                                    }
                                    onChange({
                                        headlineFormatSynced: checked,
                                        content: { ...formData.content, [otherTab]: { ...formData.content[otherTab], ...otherUpdates } },
                                    });
                                }}
                                className="data-[state=checked]:bg-[#007BFF]"
                            />
                        </label>
                    </div>

                    <RichTextEditor
                        value={currentContent.headline || ''}
                        onChange={(val) => updateContent({ headline: val })}
                        onGlobalColorChange={(v) => updateContent({ headlineColor: v })}
                        globalColor={currentContent.headlineColor || '#FEDD00'}
                        placeholder={
                            activeTab === 'en' ? "Headline Goes Here" : "Tulis Headline Disini"
                        }
                        fontSize={currentContent.headlineFontSize || 24}
                        defaultFontSize={formData.headlineType === '2 Headlines' ? 26 : 24}
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
                        minFontSize={16}
                        maxFontSize={48}
                    />
                </div>

                {/* Headline 2 or Sub-Headline */}
                {formData.headlineType !== '1 Headline' && (
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center gap-[8px]">
                            <label className="text-[14px] font-bold text-[#303135]">
                                {formData.headlineType === '2 Headlines' ? 'Headline 2 (Rec. 5 words)' : 'Sub-headline (Rec. 5 words)'}
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
                                defaultFontSize={18}
                                onFontSizeChange={(val) => updateContent({ subHeadlineFontSize: val })}
                                minFontSize={16}
                                maxFontSize={48}
                            />
                        )}
                    </div>
                )}
           </div>

          {/* NEW FIELDS START HERE */}
          <div className="flex flex-col gap-[20px]">

              {/* Discount Amount & Unit - Hidden for 2 Headlines, Optional for 1 Headline */}
              {formData.headlineType !== '2 Headlines' && (
              <div className="flex flex-col gap-[16px] rounded-[12px] border border-[#e9ebef] p-[16px]">
              <div className="flex items-center justify-between">
                  <label className="text-[14px] font-bold text-[#303135]">Discount Amount & Unit</label>
                  <Switch
                      checked={formData.discountEnabled !== false}
                      onCheckedChange={(checked) => {
                          if (checked) { onChange({ discountEnabled: true }); return; }
                          const off = { showPrefix: false, unitDisplayType: 'text', secondUnitDisplayType: 'text' } as Partial<ContentTranslation>;
                          const content = { ...formData.content } as typeof formData.content;
                          (Object.keys(content) as (keyof typeof content)[]).forEach((lang) => { content[lang] = { ...content[lang], ...off }; });
                          onChange({ discountEnabled: false, nudgeOnTop: false, content });
                      }}
                      className="data-[state=checked]:bg-[#007BFF]"
                  />
              </div>
              {formData.discountEnabled !== false && (
              <>
      {/* Benefit-only scale (2:1, 3:4, Desktop 5:1 / 4:1) — affects just the discount/nudge row */}
      {usesBenefitCards && (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center justify-between">
            <label className="text-[14px] font-bold text-[#303135]">Benefit Scale</label>
            <div className="flex items-center gap-[8px]">
              <EditableSliderValue value={formData.portraitBenefitScale ?? 100} onChange={(v) => onChange({ portraitBenefitScale: v })} suffix="%" min={50} max={150} className="text-[13px] font-semibold text-[#007BFF]" />
              <button
                type="button"
                onClick={() => onChange({ portraitBenefitScale: 100 })}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
                title="Reset to 100%"
              >
                <RotateCw size={12} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min={50}
            max={150}
            step={5}
            value={formData.portraitBenefitScale ?? 100}
            onChange={(e) => onChange({ portraitBenefitScale: Number(e.target.value) })}
            className="w-full accent-[#007BFF]"
          />
          <div className="flex justify-between text-[11px] text-[#71747d]">
            <span>50%</span>
            <span>100%</span>
            <span>150%</span>
          </div>
        </div>
      )}
              <div className="flex flex-col gap-[24px] rounded-[12px] border border-[#e9ebef] p-[16px]">
              {currentContent.hasSecondDiscount && renderCollapseHeader('d1', 'Discount 1', `${currentContent.discountAmount || ''}${getUnitLabel(currentContent.unit)}`)}
              <div className={`flex flex-col gap-[24px] ${currentContent.hasSecondDiscount && collapsed.d1 ? 'hidden' : ''}`}>
              {/* Nudge Type Selection (Prefix) - Hidden for 2 Headlines */}
              {formData.headlineType !== '2 Headlines' && renderNudge1()}
              {formData.headlineType !== '2 Headlines' && currentContent.showPrefix !== false && <div className="border-t border-[#e9ebef]" />}
              {/* Discount Amount */}
              <div className="flex flex-col gap-[8px]">
                  <div className="flex flex-wrap items-center justify-between gap-[8px]">
                      <div className="flex items-center gap-[8px]">
                          <label className="text-[14px] font-bold text-[#303135]">{currentContent.hasSecondDiscount ? 'Discount Amount 1' : 'Discount Amount'}</label>
                          <ColorPicker value={currentContent.discountAmountColor} onChange={(v) => updateContent({ discountAmountColor: v })} />
                      </div>
                      <label className="flex items-center gap-[8px] text-[12px] text-[#71747d]">
                          Same currency for EN & ID
                          <Switch
                              checked={formData.currencySyncLangs !== false}
                              onCheckedChange={(checked) => {
                                  if (!checked) { onChange({ currencySyncLangs: false }); return; }
                                  // Turning sync on copies the active language's currency to the other one
                                  const otherTab = activeTab === 'en' ? 'id' : 'en';
                                  onChange({
                                      currencySyncLangs: true,
                                      content: {
                                          ...formData.content,
                                          [otherTab]: {
                                              ...formData.content[otherTab],
                                              discountType: currentContent.discountType,
                                              customCurrency: currentContent.customCurrency,
                                              secondDiscountType: currentContent.secondDiscountType,
                                              secondCustomCurrency: currentContent.secondCustomCurrency,
                                          },
                                      },
                                  });
                              }}
                              className="data-[state=checked]:bg-[#007BFF]"
                          />
                      </label>
                  </div>
                  {renderCurrencyPicker('first')}
                  {(
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
                  )}
              </div>

              {/* Unit */}
              {(
              <>
              <div className="border-t border-[#e9ebef]" />
              <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center gap-[8px]">
                      <label className="text-[14px] font-bold text-[#303135]">Unit</label>
                      <ColorPicker value={currentContent.unitColor} onChange={(v) => updateContent({ unitColor: v })} defaultValue={currentContent.unitDisplayType === 'icon' ? unitBadgeAutoColor(formData) : '#FFFFFF'} />
                      
                      {currentContent.unitDisplayType === 'icon' && (!isSquare || isDlpSquare) && (
                          <div className="flex items-center gap-[4px] ml-[12px] border-l pl-[12px] border-[#d8dce8]">
                              <span className="text-[12px] text-[#71747d]">Icon Bg:</span>
                              <ColorPicker value={currentContent.unitIconColor} onChange={(v) => updateContent({ unitIconColor: v })} defaultValue="#FEE645" />
                          </div>
                      )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
                      <Radio
                          name={`unit-${activeTab}`}
                          checked={!currentContent.unit}
                          onChange={() => updateContent({ unit: '' })}
                      >
                          <span className="text-[14px] text-[#303135]">None</span>
                      </Radio>
                      {(activeTab === 'en' ? ['K', 'mio', '%'] : ['Rb', 'Jt', '%']).map((u) => (
                          <Radio 
                              key={u}
                              name={`unit-${activeTab}`}
                              checked={currentContent.unit === u}
                              onChange={() => updateContent({ unit: u as any })}
                          >
                              <span className="text-[14px] text-[#303135]">{getUnitLabel(u)}</span>
                          </Radio>
                      ))}

                      {/* Unit Display Type (Icon Toggle) - Hidden for Square ratio */}
                      {(!isSquare || isDlpSquare) && (
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
              </>
              )}

              </div>
              </div>
              {/* Second Discount Section */}
              <div className="flex flex-col gap-[12px] pt-[8px]">
                {currentContent.hasSecondDiscount ? (
                  <div className="flex flex-col gap-[24px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                  <div className="flex items-center gap-[8px]">
                      <div className="flex-1 min-w-0">
                          {renderCollapseHeader('d2', 'Discount 2', `${currentContent.secondDiscountAmount || ''}${getUnitLabel(currentContent.secondDiscountUnit)}`)}
                      </div>
                      <button
                          type="button"
                          onClick={() => updateContent({ hasSecondDiscount: false })}
                          className="shrink-0 p-[8px] text-[#9EA0A5] hover:text-[#FF5630] transition-colors"
                          title="Remove second discount"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                  </div>
                  <div className={`flex flex-col gap-[24px] animate-in fade-in slide-in-from-top-4 duration-300 ${collapsed.d2 ? 'hidden' : ''}`}>
                      {/* Nudge for the second benefit — shown above its number in the 3:4 layout */}
                      {usesBenefitCards && currentContent.showPrefix !== false && (
                          <div className="flex flex-col gap-[8px]">
                              <div className="flex items-center gap-[8px]">
                                  <label className="text-[14px] font-bold text-[#303135]">Nudge Type 2</label>
                                  <ColorPicker value={currentContent.secondPrefixColor ?? currentContent.prefixColor} onChange={(v) => updateContent({ secondPrefixColor: v })} defaultValue="#FEDD00" />
                              </div>
                              <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px]">
                                  {currentPrefixOptions.map((option) => (
                                      <Radio
                                          key={option.id}
                                          name={`secondPrefixType-${activeTab}`}
                                          checked={currentContent.secondPrefixType === option.id}
                                          onChange={() => {
                                              const prev = currentContent;
                                              const custom = FREE_TEXT_PREFIX_TYPES.includes(prev.secondPrefixType) ? (prev.secondBenefitPrefix || '') : (prev.secondCustomPrefixText || '');
                                              const noAmountOverrides = NUDGE_TYPES_WITHOUT_AMOUNT.includes(option.id) ? { secondDiscountType: 'Non-IDR' as const, secondDiscountUnit: '' as const } : {};
                                              updateContent({
                                                  secondPrefixType: option.id as any,
                                                  secondBenefitPrefix: FREE_TEXT_PREFIX_TYPES.includes(option.id) ? (custom || option.value) : option.value,
                                                  secondCustomPrefixText: custom,
                                                  ...noAmountOverrides
                                              });
                                          }}
                                      >
                                          <span className="text-[14px] text-[#303135]">{option.label}</span>
                                      </Radio>
                                  ))}
                              </div>
                              {FREE_TEXT_PREFIX_TYPES.includes(currentContent.secondPrefixType) && (
                                  <RichTextEditor
                                      value={currentContent.secondBenefitPrefix || ''}
                                      onChange={(val) => updateContent({ secondBenefitPrefix: val, secondCustomPrefixText: val })}
                                      onGlobalColorChange={(v) => updateContent({ secondPrefixColor: v })}
                                      placeholder={activeTab === 'en' ? "Enter custom prefix" : "Tulis prefix kustom"}
                                      fontSize={currentContent.prefixFontSize || 20}
                               defaultFontSize={20}
                                      onFontSizeChange={(val) => updateContent({ prefixFontSize: val })}
                                      minFontSize={14}
                                      maxFontSize={48}
                                      lineHeight={currentContent.prefixLineHeight}
                                      onLineHeightChange={(val) => updateContent({ prefixLineHeight: val })}
                                  />
                              )}
                          </div>
                      )}
                      {usesBenefitCards && currentContent.showPrefix !== false && <div className="border-t border-[#e9ebef]" />}
                      {/* Amount 2 */}
                      <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-[8px]">
                                  <label className="text-[14px] font-bold text-[#303135]">Discount Amount 2</label>
                                  <ColorPicker value={currentContent.secondDiscountAmountColor} onChange={(v) => updateContent({ secondDiscountAmountColor: v })} />
                              </div>
                          </div>
                          {renderCurrencyPicker('second')}
                          {(
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
                          )}
                      </div>

                      {/* Unit 2 */}
                      {(
                      <>
                      <div className="border-t border-[#e9ebef]" />
                      <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center gap-[8px]">
                              <label className="text-[14px] font-bold text-[#303135]">Unit</label>
                              <ColorPicker value={currentContent.secondUnitColor} onChange={(v) => updateContent({ secondUnitColor: v })} defaultValue="#0064D2" />
                              
                              {/* Show Icon Color Picker if Icon mode is active OR if we are in Square mode (which defaults to Icon) */}
                              {(currentContent.secondUnitDisplayType === 'icon' || (isSquare && !isDlpSquare)) && (
                                  <div className="flex items-center gap-[4px] ml-[12px] border-l pl-[12px] border-[#d8dce8]">
                                      <span className="text-[12px] text-[#71747d]">Icon Bg:</span>
                                      <ColorPicker value={currentContent.secondUnitIconColor ?? currentContent.unitIconColor} onChange={(v) => updateContent({ secondUnitIconColor: v })} defaultValue="#FEE645" />
                                  </div>
                              )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
                              <Radio
                                  name={`unit2-${activeTab}`}
                                  checked={!currentContent.secondDiscountUnit}
                                  onChange={() => updateContent({ secondDiscountUnit: '' })}
                              >
                                  <span className="text-[14px] text-[#303135]">None</span>
                              </Radio>
                              {(activeTab === 'en' ? ['K', 'mio', '%'] : ['Rb', 'Jt', '%']).map((u) => (
                                  <Radio 
                                      key={u}
                                      name={`unit2-${activeTab}`}
                                      checked={currentContent.secondDiscountUnit === u}
                                      onChange={() => updateContent({ secondDiscountUnit: u as any })}
                                  >
                                      <span className="text-[14px] text-[#303135]">{getUnitLabel(u)}</span>
                                  </Radio>
                              ))}

                              {/* Unit Display Type (Icon Toggle) - Only show for non-Square */}
                              {(!isSquare || isDlpSquare) && (
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
                      </>
                      )}
                  </div>
                  </div>
              ) : (
                  <button
                      type="button"
                      onClick={() => {
                          // Default the second nudge to the first one's preset (Custom text is not copied)
                          const pt = currentContent.prefixType;
                          const preset = pt && pt !== 'custom' ? currentPrefixOptions.find(o => o.id === pt) : undefined;
                          updateContent({
                              hasSecondDiscount: true,
                              secondDiscountAmount: '',
                              // Start from the same settings as Discount 1 (currency, unit, icon style, colors)
                              secondDiscountType: currentContent.discountType || 'IDR',
                              secondCustomCurrency: currentContent.customCurrency,
                              secondDiscountUnit: currentContent.unit || '',
                              secondUnitDisplayType: currentContent.unitDisplayType || 'icon',
                              secondUnitIconColor: currentContent.unitIconColor || '#FEE645',
                              secondUnitColor: currentContent.unitColor,
                              secondDiscountAmountColor: currentContent.discountAmountColor,
                              ...(currentContent.secondPrefixType ? {} : preset ? { secondPrefixType: preset.id as any, secondBenefitPrefix: preset.value } : {}),
                          });
                      }}
                      className="text-[14px] font-bold text-[#007BFF] hover:text-[#0064D2] transition-colors self-center py-2"
                  >
                      + Add More Discount
                  </button>
              )}
              </div>
              </>
              )}
              </div>
              )}

              {/* Additional Perks (labelDiscount) - Hidden for 'With Sub-Headline' and 'Square (1:1)' */}
              {(!isSquare || formData.dlpRole === 'header-mobile') && formData.headlineType !== 'With Sub-Headline' && (
              <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-[8px]">
                          <label className="text-[14px] font-bold text-[#303135]">Additional Info/Perks (optional)</label>
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
                      <div className="flex flex-col gap-[12px] animate-in fade-in slide-in-from-top-2 duration-200">
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

                              <label className="ml-auto flex items-center gap-[6px] text-[12px] font-semibold text-[#5e6066] cursor-pointer" title="Mirrors Additional Perks font size, weight and italic between EN and ID">
                                  Sync style with {activeTab === 'en' ? 'ID' : 'EN'}
                                  <Switch
                                      checked={!!formData.labelDiscountFormatSynced}
                                      onCheckedChange={(checked) => {
                                          const otherTab = activeTab === 'en' ? 'id' : 'en';
                                          const otherUpdates: Partial<ContentTranslation> = {};
                                          if (checked) {
                                              otherUpdates.labelDiscountFontSize = currentContent.labelDiscountFontSize;
                                              const otherText = stripFontSizeTags(formData.content[otherTab].labelDiscountText || '');
                                              const format = analyzeUniformFormat(currentContent.labelDiscountText || '');
                                              otherUpdates.labelDiscountText = format ? applyUniformFormat(otherText, format) : otherText;
                                          }
                                          onChange({
                                              labelDiscountFormatSynced: checked,
                                              content: { ...formData.content, [otherTab]: { ...formData.content[otherTab], ...otherUpdates } },
                                          });
                                      }}
                                      className="data-[state=checked]:bg-[#007BFF]"
                                  />
                              </label>
                          </div>

                          <div className="flex flex-col">
                              <RichTextEditor
                                  value={currentContent.labelDiscountText || ''}
                                  onChange={(val) => updateContent({ labelDiscountText: val })}
                                  onGlobalColorChange={(v) => updateContent({ labelDiscountColor: v })}
                                  placeholder={activeTab === 'en' ? "Add Additional Perks" : "Tambahkan Perks Tambahan"}
                                  singleLine
                                  fontSize={currentContent.labelDiscountFontSize || perksDefaultSize}
                                  defaultFontSize={perksDefaultSize}
                                  onFontSizeChange={(val) => updateContent({ labelDiscountFontSize: val })}
                                  minFontSize={10}
                                  maxFontSize={28}
                              />
                          </div>
                      </div>
                  )}
              </div>
              )}

              {/* Additional Label - Hidden for 'With Sub-Headline' */}
              {formData.headlineType !== 'With Sub-Headline' && (
              <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                  <div className="flex items-center justify-between">
                      <label className="text-[14px] font-bold text-[#303135]">Additional Label (optional)</label>
                      <Switch 
                          checked={currentContent.additionalLabel}
                          onCheckedChange={(checked) => updateContent({ additionalLabel: checked })}
                          className="data-[state=checked]:bg-[#007BFF]"
                      />
                  </div>
                  
                  {currentContent.additionalLabel && (
                      <div className="flex flex-col gap-[12px] animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="flex gap-[16px]">
                              <div className="flex items-center gap-[8px]">
                                  <span className="text-[12px] text-[#71747d]">Text:</span>
                                  <ColorPicker value={currentContent.additionalLabelTextColor} onChange={(v) => updateContent({ additionalLabelTextColor: v })} defaultValue="#0064D2" />
                              </div>
                              <div className="flex items-center gap-[8px]">
                                  <span className="text-[12px] text-[#71747d]">Bg:</span>
                                  <ColorPicker value={currentContent.additionalLabelBackgroundColor} onChange={(v) => updateContent({ additionalLabelBackgroundColor: v })} defaultValue={currentContent.additionalLabelType === 'Voucher' ? '#FFFFFF' : '#FEDD00'} />
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
                              <Radio
                                  name={`additionalLabelType-${activeTab}`}
                                  checked={currentContent.additionalLabelType === 'Voucher'}
                                  onChange={() => updateContent({ additionalLabelType: 'Voucher', additionalLabelText: 'VOUCHERCODE', additionalLabelTextColor: '#007BFF', additionalLabelBackgroundColor: '#FFFFFF', additionalLabelFontSize: 16 })}
                              >
                                  <span className="text-[14px] text-[#303135]">Voucher</span>
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
                                      defaultFontSize={14}
                                      onFontSizeChange={(val) => updateContent({ additionalLabelFontSize: val })}
                                      minFontSize={10}
                                      maxFontSize={24}
                                  />
                              </div>
                          ) : currentContent.additionalLabelType === 'Voucher' ? (
                              <div className="flex flex-col gap-[4px]">
                                  <RichTextEditor
                                      value={currentContent.additionalLabelText || ''}
                                      onChange={(val) => updateContent({ additionalLabelText: val })}
                                      onGlobalColorChange={(v) => updateContent({ additionalLabelTextColor: v })}
                                      placeholder="VOUCHERCODE"
                                      singleLine
                                      maxLength={19}
                                      fontSize={currentContent.additionalLabelFontSize || 16}
                                      defaultFontSize={16}
                                      onFontSizeChange={(val) => updateContent({ additionalLabelFontSize: val })}
                                      minFontSize={16}
                                      maxFontSize={40}
                                  />
                                  <span className="text-[11px] text-[#9EA0A5]">Max 19 characters — always shown in UPPERCASE</span>
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

              {isDesktop51 && desktopCtaCard}

              {/* CTA Button (optional) for 3:4 and 2:1 — form-level so it applies to both EN and ID */}
              {(isPortrait || isLandscape21) && formData.dlpRole !== 'header-mobile' && ( /* DLP Mobile Header (3:4 / 1:1) has no CTA */
                <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                  <div className="flex items-center justify-between">
                    <label className="text-[14px] font-bold text-[#303135]">CTA Button (optional)</label>
                    <Switch
                      checked={formData.showPortraitCta || false}
                      onCheckedChange={(checked) => onChange({ showPortraitCta: checked })}
                      className="data-[state=checked]:bg-[#007cff]"
                    />
                  </div>
                  {formData.showPortraitCta && (
                    <div className="flex flex-col gap-[12px] mt-[8px] animate-in fade-in slide-in-from-top-2 duration-200">

                      {/* Button Color | Text Color — popover triggers */}
                      <div className="flex items-center gap-[8px]">
                        <div className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135]">
                              <span>Button Color</span>
                              <ColorPicker value={formData.ctaButtonColor} onChange={(v) => onChange({ ctaButtonColor: v })} defaultValue="#007BFF" />
                            </div>

                        <span className="text-[#d1d5db] select-none">|</span>

                        <div className="flex items-center gap-[6px] text-[13px] font-semibold text-[#303135]">
                              <span>Text Color</span>
                              <ColorPicker value={formData.ctaTextColor} onChange={(v) => onChange({ ctaTextColor: v })} defaultValue="#FFFFFF" />
                            </div>
                      </div>

                      {/* Button size — 2:1 mobile only, scale down */}
                      {isLandscape21 && (
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between">
                            <label className="text-[14px] font-bold text-[#303135]">Button Size</label>
                            <div className="flex items-center gap-[8px]">
                              <EditableSliderValue value={formData.landscapeCtaScale ?? 80} onChange={(v) => onChange({ landscapeCtaScale: v })} suffix="%" min={50} max={100} className="text-[13px] font-semibold text-[#007BFF]" />
                              <button type="button" onClick={() => onChange({ landscapeCtaScale: 80 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to 80%">
                                <RotateCw size={12} />
                              </button>
                            </div>
                          </div>
                          <input type="range" min={50} max={100} step={5} value={formData.landscapeCtaScale ?? 80} onChange={(e) => onChange({ landscapeCtaScale: Number(e.target.value) })} className="w-full accent-[#007BFF]" />
                        </div>
                      )}

                      {/* Button Width — Tiket DS Radio */}
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[14px] font-bold text-[#303135]">Button Width</label>
                        <div className="flex flex-wrap items-center gap-x-[24px] gap-y-[8px]">
                          {(['hugged', 'fixed'] as const).map((mode) => (
                            <Radio
                              key={mode}
                              name="portraitCtaWidthMode"
                              checked={(formData.portraitCtaWidthMode ?? 'fixed') === mode}
                              onChange={() => onChange({ portraitCtaWidthMode: mode })}
                            >
                              <span className="text-[14px]">{mode === 'hugged' ? 'Hugged' : 'Fixed Width'}</span>
                            </Radio>
                          ))}
                        </div>
                        {(formData.portraitCtaWidthMode ?? 'fixed') === 'fixed' && (
                          <div className="flex flex-col gap-[6px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[14px] font-bold text-[#303135]">Width</span>
                              <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={formData.portraitCtaFixedWidth ?? (isLandscape21 ? 360 : 480)} onChange={(v) => onChange({ portraitCtaFixedWidth: v })} suffix="px" min={200} max={480} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button
                                  type="button"
                                  onClick={() => onChange({ portraitCtaFixedWidth: isLandscape21 ? 360 : 480 })}
                                  className="text-[#71747d] hover:text-[#303135] transition-colors"
                                  title="Reset to default"
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
                              value={formData.portraitCtaFixedWidth ?? (isLandscape21 ? 360 : 480)}
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

              {termsCard(isDesktop41 || isDesktop51)}

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