import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, Unlock, RotateCcw } from 'lucide-react';
import { BANNER_SPECS } from '../../../config/banner-layouts';
import { BannerFormData, ContentTranslation } from './types';
import { FormStepConfig } from './FormStepConfig';
import { FormStep2 } from './FormStep2';
import { FormStep3 } from './FormStep3';
import { LivePreview } from './LivePreview';
import { SuccessScreen } from './SuccessScreen';
import { BannerService } from '../../../services/bannerService';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { Header } from '../Header';
import { FontStyles } from './FontStyles';
import svgPaths from '../../../imports/svg-dropdown-chevron';
import { supabase } from '../../../utils/supabase/client';
import { TiketBreadcrumb, TiketStepper, TiketButton } from '../ui/tiket-ui';
import type { TiketStepItem } from '../ui/tiket-ui';
import { usePresence } from '../../../hooks/usePresence';
import { ComparisonModal } from './components/ComparisonModal';
import { Info } from 'lucide-react';
import { useNavigationBlocker } from '../../../context/NavigationBlockerContext';
import { NavigationBlockerDialog } from '../NavigationBlockerDialog';
import { Edit3, Save, Trash2 } from 'lucide-react';
import { getUserAvatarUrl } from '../../utils/userDisplay';

interface CreateBannerProps {
  onBack: (message?: string) => void;
  userName: string;
  userId?: string;
  userAvatar?: string;
  initialData?: BannerFormData;
  editingId?: string;
  initialStatus?: 'draft' | 'published';
  initialCategory?: string;
}

const initialFormDataBase: BannerFormData = {
  // Step 1: Configuration
  bannerName: '',
  bannerCategory: 'Promo Banner',
  
  // Promo Banner Specific
  verticalCategory: '',
  bannerStyle: 'Style 1 (Regular promo campaign)',
  bannerRatio: 'Landscape (2:1)',

  // Legacy Step 1 Fields
  promoType: 'Daily Promo',
  background: 'NHA',
  headlineType: '1 Headline',
  discountAmountType: '1 Number',
  
  // Step 2: Content Nudge
  content: {
    en: {
      headline: '',
      subHeadline: '',
      secondHeadline: '',
      mainBenefit: '',
      mainBenefitUnit: '',
      mainBenefitType: '3D Color',
      secondaryBenefit: '',
      additionalBadge: false,
      additionalBadgeText: '',
      
      nudgeType: 'Start from',
      prefixType: 'start_from',
      mainBenefitPrefix: 'Start from',
      discountType: 'IDR',
      discountAmount: '',
      unit: 'K',
      unitDisplayType: 'icon',
      unitIconColor: '#FEE645',
      labelDiscount: true,
      labelDiscountType: 'With icon',
      labelDiscountText: '',
      additionalLabel: false,
      additionalLabelType: 'Preset',
      additionalLabelText: 'Limited Offer',
      termsAndCondition: true,
      termsText: '',
      headlineFontSize: 24,
    },
    id: {
      headline: '',
      subHeadline: '',
      secondHeadline: '',
      mainBenefit: '',
      mainBenefitUnit: '',
      mainBenefitType: '3D Color',
      secondaryBenefit: '',
      additionalBadge: false,
      additionalBadgeText: '',

      nudgeType: 'Start from',
      prefixType: 'start_from',
      mainBenefitPrefix: 'Mulai dari',
      discountType: 'IDR',
      discountAmount: '',
      unit: 'Rb',
      unitDisplayType: 'icon',
      unitIconColor: '#FEE645',
      labelDiscount: true,
      labelDiscountType: 'With icon',
      labelDiscountText: '',
      additionalLabel: false,
      additionalLabelType: 'Preset',
      additionalLabelText: 'Limited Offer',
      termsAndCondition: true,
      termsText: '',
      headlineFontSize: 24,
    },
  },
  showStamp: false,
  showCampaignLogo: false,
  partnerLogos: [],
  showPartnerLogo: false,
  showJhtLogo: false,
  backgroundType: 'image',
  keyVisualScale: 100,
  keyVisualPosition: { x: 50, y: 50 },
};

export function CreateBanner({ 
  onBack, 
  userName, 
  userAvatar,
  initialData,
  editingId,
  initialStatus,
  initialCategory,
  embedded = false,
  fullWidth = false,
  userId,
}: CreateBannerProps & { embedded?: boolean; fullWidth?: boolean; userId?: string; userAvatar?: string }) {
  const { category: categorySlug } = useParams<{ category: string }>();
  const navigate = useNavigate();

  // Presence Logic
  const presenceUsers = usePresence(editingId, userId ? { id: userId, name: userName, avatar: userAvatar } : null);

  // Conflict Detection Logic
  useEffect(() => {
    if (!editingId || !userId) return;

    const channel = supabase.channel('banner_updates')
        .on(
            'broadcast',
            { event: 'NEW_VERSION_SAVED' },
            (payload) => {
                const { bannerId, userId: remoteUserId, userName: remoteUserName } = payload.payload;
                // Check if update is for this banner and NOT from current user
                if (bannerId === editingId && remoteUserId !== userId) {
                     setRemoteVersion({
                         userId: remoteUserId,
                         userName: remoteUserName || 'Unknown',
                         bannerId
                     });
                     // Optional: Show toast as well
                     // Use Custom Snackbar
                     toast.custom((t) => (
                        <TiketSnackbar 
                            id={t} 
                            message={`${remoteUserName || 'Someone'} has saved a new version.`} 
                            cta={{
                                label: 'View Changes',
                                onClick: () => setIsComparisonModalOpen(true)
                            }}
                        />
                     ));
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [editingId, userId]);

  // Display-only override — internal bannerCategory value stays unchanged.
  const categoryDisplayLabels: Record<string, string> = {
    'Hero Landing Page Header': 'Hero LP Header',
  };

  // Map URL slug to Category Name
  const categoryMap: Record<string, string> = {
    'promo-banner': 'Promo Banner',
    'homepage-promo-banner': 'Homepage Promo Banner',
    'hero-landing-page-header': 'Hero Landing Page Header',
    'product-entry-point': 'Product Entry Point',
  };

  // Determine Category: 
  // 1. Initial Data (Edit Mode)
  // 2. Initial Category Prop (Legacy)
  // 3. URL Param (Create Mode)
  const determinedCategory = useMemo(() => {
      if (initialData?.bannerCategory) return initialData.bannerCategory;
      if (initialCategory) return initialCategory;
      if (categorySlug && categoryMap[categorySlug]) return categoryMap[categorySlug];
      return 'Promo Banner'; // Default
  }, [initialData, initialCategory, categorySlug]);

  const [currentStep, setCurrentStep] = useState(() => {
      const savedStep = initialData?.last_step;
      const parsedStep = typeof savedStep === 'string' ? parseInt(savedStep, 10) : savedStep;
      
      if (parsedStep && !isNaN(parsedStep) && parsedStep > 0 && parsedStep <= 3) {
          return parsedStep;
      }
      return 1;
  });
  const [maxStepReached, setMaxStepReached] = useState(() => {
      const savedStep = initialData?.last_step;
      const parsedStep = typeof savedStep === 'string' ? parseInt(savedStep, 10) : savedStep;
      
      if (parsedStep && !isNaN(parsedStep) && parsedStep > 0 && parsedStep <= 3) {
          return parsedStep;
      }
      return 1;
  });
  const [formData, setFormData] = useState<BannerFormData>(() => {
      if (initialData) return initialData;
      
      // Customize defaults based on Category
      const base = JSON.parse(JSON.stringify(initialFormDataBase)); // Deep clone to avoid mutation
      if (determinedCategory === 'Product Entry Point') {
          base.content.en.headlineFontSize = 14;
          base.content.id.headlineFontSize = 14;
          base.backgroundColor = '#007BFF'; // Default B400
          base.keyVisualPosition = { x: 0, y: 0 };
          base.keyVisualScale = 100;
          
          // Clear defaults for Progressive Disclosure
          base.platform = undefined;
          base.bannerRatio = undefined; 
          base.entryPointVariant = undefined;
      }

      return {
          ...base,
          bannerCategory: determinedCategory as any
      };
  });
  const [isDone, setIsDone] = useState(false);
  const [errors, setErrors] = useState<{ bannerName?: string }>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  // Exit Confirmation State
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  // Validation State
  const [nameValidation, setNameValidation] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });

  // Overwrite Mode State
  const [isOverwriteModalOpen, setIsOverwriteModalOpen] = useState(false);
  const [isOverwriteMode, setIsOverwriteMode] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  // Conflict Detection State
  const [remoteVersion, setRemoteVersion] = useState<{
    userId: string;
    userName: string;
    bannerId: string;
  } | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const isDraft = initialStatus === 'draft';

  // Preview Controls State
  const [previewControls, setPreviewControls] = useState<{
    isUnlocked: boolean;
    isSquare: boolean;
    onToggleLock: () => void;
    onResetPositions: () => void;
  } | null>(null);

  // Translation State
  const [isTranslating, setIsTranslating] = useState(false);

  // Active Language Tab State (Lifted from FormStep2)
  const [activeTab, setActiveTab] = useState<'en' | 'id'>('en');

  // Navigation Blocker State
  const [showNavigationBlocker, setShowNavigationBlocker] = useState(false);
  const { hasUnsavedChanges, setHasUnsavedChanges, pendingNavigation, setPendingNavigation } = useNavigationBlocker();

  // Store initial state for change detection
  // We use a ref so it doesn't trigger re-renders, but we need it to be stable
  const initialBannerState = useRef<string>(JSON.stringify(initialData || {
      ...initialFormDataBase,
      bannerCategory: initialCategory
  }));

  // Change Detection Logic
  const hasChanges = useMemo(() => {
    // 1. Check if any file has been uploaded (Files are always changes since we don't load them from DB)
    if (formData.keyVisualFile || formData.manualBackgroundFile) {
        return true;
    }

    // 2. Compare JSON strings of the rest of the data
    // We create a copy without File objects to avoid inconsistencies
    const currentString = JSON.stringify({
        ...formData,
        keyVisualFile: undefined, 
        manualBackgroundFile: undefined
    });
    
    return currentString !== initialBannerState.current;
  }, [formData]);

  // Force Lock on Step 3
  useEffect(() => {
      if (currentStep === 3 && previewControls?.isUnlocked) {
          // We need to defer this slightly to ensure render cycle is complete or just call it
          // But onToggleLock is a function from LivePreview state. 
          // If we call it, it should trigger state update in LivePreview which will update previewControls via onControlsChange
          previewControls.onToggleLock();
          
          toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message="Elements locked for background editing" 
                variant="default"
            />
          ), { duration: 2000 });
      }
  }, [currentStep, previewControls?.isUnlocked]); // Only trigger when step changes to 3 or if it's unlocked while in step 3

  // Update navigation blocker context
  useEffect(() => {
    const isEssentialInfoFilled = formData.bannerName?.trim() && formData.verticalCategory;
    setHasUnsavedChanges(hasChanges && isEssentialInfoFilled);
  }, [hasChanges, formData.bannerName, formData.verticalCategory, setHasUnsavedChanges]);

  // Handle pending navigation when dialog closes
  useEffect(() => {
    if (pendingNavigation && showNavigationBlocker === false) {
      // Dialog was dismissed, so just cancel the navigation
      setPendingNavigation(null);
    }
  }, [showNavigationBlocker, pendingNavigation, setPendingNavigation]);

  // Monitor for pending navigation to show dialog
  useEffect(() => {
    if (pendingNavigation) {
      setShowNavigationBlocker(true);
    }
  }, [pendingNavigation]);

  const isNextDisabled = useMemo(() => {
      if (isSavingDraft) return true;
      
      if (currentStep === 1) {
          if (!formData.bannerName?.trim()) return true;
          // Check if vertical category is selected
          const vertical = formData.verticalCategory;
          if (!vertical || String(vertical).trim().length === 0) return true;
          
          if (nameValidation.status === 'checking') return true;
          if (nameValidation.status === 'invalid') return true;

          // Strict Validation for Product Entry Point
          if (formData.bannerCategory === 'Product Entry Point') {
               if (!formData.platform) return true;
               if (!formData.bannerRatio) return true;
               if (!formData.entryPointVariant) return true;
          }
      }
      
      if (currentStep === 3) {
          if (!hasChanges && !isDraft) return true;
      }
      
      return false;
  }, [
      isSavingDraft, 
      currentStep, 
      nameValidation.status, 
      hasChanges, 
      isDraft, 
      formData.bannerName, 
      formData.verticalCategory, 
      formData.bannerCategory,
      formData.platform,
      formData.bannerRatio,
      formData.entryPointVariant
  ]);

  const validateBannerName = async (name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
          setNameValidation({ status: 'idle' });
          return false;
      }

      // If name hasn't changed from initial and we are editing, it's valid (unless we want to re-validate)
      // Actually, checkBannerName with editingId should handle this.
      
      setNameValidation({ status: 'checking' });
      
      try {
          const check = await BannerService.checkBannerName(trimmedName);
          
          if (check.exists) {
              // If we are editing and the found ID matches our ID, it's valid (we own the name)
              if (editingId && check.id === editingId) {
                  setNameValidation({ status: 'valid' });
                  return true;
              } else {
                  setNameValidation({ 
                      status: 'invalid', 
                      message: 'Banner name already exists. Please choose another.' 
                  });
                  return false;
              }
          } else {
              setNameValidation({ status: 'valid' });
              return true;
          }
      } catch (error) {
          console.error("Name validation failed", error);
          // Fail open or closed? Let's fail open but warn? Or just stay idle?
          // Let's set invalid to be safe or show generic error.
          setNameValidation({ status: 'invalid', message: 'Validation failed. Please try again.' });
          return false;
      }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!formData.bannerName.trim()) {
        setErrors({ bannerName: 'Input field is required' });
        return;
      }
      
      // Perform validation if not already valid
      // Note: If user typed but didn't blur, status might be idle.
      // Or if user typed and blur is happening now.
      
      let isValid = nameValidation.status === 'valid';
      
      // If idle or invalid (but maybe user changed it and clicked next immediately?)
      // Actually if it's invalid, we shouldn't proceed.
      // If checking, we should wait? 
      // Simplified: Force check if not valid.
      
      if (nameValidation.status !== 'valid') {
          isValid = await validateBannerName(formData.bannerName);
      }
      
      if (!isValid) {
          return;
      }
    }

    if (currentStep < 3) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      if (nextStep > maxStepReached) {
        setMaxStepReached(nextStep);
      }
    } else {
      // Step 3: Finish Logic (Refactored)
      
      // CRITICAL: Check if there's a pending remote version that hasn't been synced
      if (remoteVersion) {
        // Force user to review changes before proceeding
        setIsComparisonModalOpen(true);
        toast.custom((t) => (
          <TiketSnackbar 
            id={t} 
            message="Please review changes from other users before finishing." 
            variant="error"
          />
        ));
        return;
      }
      
      const isEditing = !!editingId;
      // Compare with initial name. 
      // Note: initialData might be undefined if creating new, checking safely.
      // If initialData exists, use its name. Else empty string.
      const initialName = initialData?.bannerName || '';
      const isNameUnchanged = initialName === formData.bannerName;

      // Logic:
      // If Edit Mode (or Draft) AND Name is Unchanged -> Show Overwrite Confirmation
      // Else (New Banner OR Renamed) -> Save Immediately
      
      if (isEditing && isNameUnchanged) {
          setIsOverwriteModalOpen(true);
      } else {
          setIsOverwriteMode(false);
          setIsDone(true);
      }
    }
  };

  const handleOverwriteConfirm = () => {
      setIsOverwriteModalOpen(false);
      setIsOverwriteMode(true);
      setIsDone(true);
  };

  const confirmFinish = () => {
    setIsFinishModalOpen(false);
    setIsDone(true);
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGlobalCancel = () => {
      // If Banner Name or Vertical is missing, users can't save anyway, so just exit without confirmation
      const isEssentialInfoFilled = formData.bannerName?.trim() && formData.verticalCategory;
      
      if (hasChanges && isEssentialInfoFilled) {
          setIsExitModalOpen(true);
      } else {
          onBack();
      }
  };

  const handleStepClick = (stepId: number) => {
    // Allow jump if step is previously reached (non-linear navigation)
    // But if step 1 is invalid, can we jump? 
    // We should probably allow going back to step 1 to fix it. 
    // But going forward should be blocked if step 1 is invalid.
    
    // If we are on Step 1 and it's invalid, we can't leave unless we fix it? 
    // Actually standard stepper usually allows navigation if previously reached.
    // But let's stick to simple logic: Allow navigation if maxStepReached permits.
    if (stepId <= maxStepReached) {
      setCurrentStep(stepId);
    }
  };

  const updateFormData = useCallback((updates: Partial<BannerFormData>) => {
    setFormData(prev => {
        // Handle Category Switching Defaults
        if (updates.bannerCategory === 'Product Entry Point' && prev.bannerCategory !== 'Product Entry Point') {
             return {
                 ...prev,
                 ...updates,
                 backgroundColor: '#007BFF', // Default B400
                 content: {
                     ...prev.content,
                     en: { ...prev.content.en, headlineFontSize: 14 },
                     id: { ...prev.content.id, headlineFontSize: 14 }
                 }
             };
        }

        // Handle Ratio Switching to Mobile 5:2 (Product Entry Point)
        if (updates.bannerRatio === 'Mobile (5:2)') {
             return {
                 ...prev,
                 ...updates,
                 content: {
                     ...prev.content,
                     en: { ...prev.content.en, headlineFontSize: 14 },
                     id: { ...prev.content.id, headlineFontSize: 14 }
                 }
             };
        }

        // Check if we are in Square (1:1) mode
        const isSquare = (updates.bannerRatio === 'Square (1:1)') || (prev.bannerRatio === 'Square (1:1)' && !updates.bannerRatio);

        // Logic for Automatic Reset Position when switching 2nd discount mode
        if (isSquare && updates.content) {
            // Check if hasSecondDiscount changed for either language
            const prevEnHas = prev.content.en.hasSecondDiscount;
            const prevIdHas = prev.content.id.hasSecondDiscount;
            
            const newEnHas = updates.content.en?.hasSecondDiscount ?? prevEnHas;
            const newIdHas = updates.content.id?.hasSecondDiscount ?? prevIdHas;
            
            // If the state of second discount changed
            if (newEnHas !== prevEnHas || newIdHas !== prevIdHas) {
                const specs = (BANNER_SPECS as any)['Square (1:1)'];
                const hasSecondDiscount = newEnHas || newIdHas;
                const defaults = hasSecondDiscount ? specs.defaults : (specs.defaults_single || specs.defaults);
                const contentDefaults = hasSecondDiscount ? (specs.content_defaults || {}) : (specs.content_defaults_single || {});

                if (defaults) {
                    const newPositions: Record<string, any> = {};
                    Object.keys(defaults).forEach(key => {
                        if (defaults[key]) {
                            newPositions[key] = {
                                x: defaults[key].x,
                                y: defaults[key].y,
                                width: defaults[key].width,
                                height: defaults[key].height
                            };
                        }
                    });
                    
                    // Apply content defaults (Font sizes, Visibility)
                    const newContentEn = {
                        ...prev.content.en,
                        ...(updates.content?.en || {}),
                        ...contentDefaults
                    };
                    const newContentId = {
                        ...prev.content.id,
                        ...(updates.content?.id || {}),
                        ...contentDefaults
                    };
                    
                    // Return with new positions and content
                    return {
                        ...prev,
                        ...updates,
                        content: {
                            en: newContentEn,
                            id: newContentId
                        },
                        elementPositions: newPositions
                    };
                }
            }
        }

        // Clean State Logic for Ratio Switching
        if (updates.bannerRatio && updates.bannerRatio !== prev.bannerRatio) {
            const newRatio = updates.bannerRatio;
            
            // Product Entry Point Specific Logic
            if (prev.bannerCategory === 'Product Entry Point') {
                 // Reset Scale and Position on Ratio Change for Entry Points
                 return {
                     ...prev,
                     ...updates,
                     keyVisualScale: 100,
                     keyVisualPosition: { x: 0, y: 0 } // Default for Entry Point
                 };
            }

            // TypeScript safe access
            const specs = (BANNER_SPECS as any)[newRatio];

            if (newRatio === 'Square (1:1)' && specs) {
                // Detect Single vs Double Discount Mode from previous state
                // Note: If updates contains content, we should use that, but usually ratio switch doesn't change content simultaneously
                const hasSecondDiscount = prev.content.en.hasSecondDiscount || prev.content.id.hasSecondDiscount;
                const defaults = hasSecondDiscount ? specs.defaults : (specs.defaults_single || specs.defaults);
                const contentDefaults = hasSecondDiscount ? (specs.content_defaults || {}) : (specs.content_defaults_single || specs.content_defaults || {});
                
                // 1. Prepare Positions - Iterate all keys in defaults to ensure complete override
                const newPositions: Record<string, any> = {};
                Object.keys(defaults).forEach(key => {
                    if (defaults[key]) {
                        newPositions[key] = {
                            x: defaults[key].x,
                            y: defaults[key].y,
                            width: defaults[key].width,
                            height: defaults[key].height
                        };
                    }
                });

                // 2. Reset Content Styles (Font Size, Color)
                const resetContent = (prevContent: ContentTranslation) => ({
                    ...prevContent,
                    // Font Sizes: Prioritize contentDefaults, fallback to legacy defaults
                    headlineFontSize: contentDefaults.headlineFontSize ?? defaults.headline?.fontSize,
                    discountAmountFontSize: contentDefaults.discountAmountFontSize ?? defaults.discountAmount?.fontSize,
                    currencyFontSize: contentDefaults.currencyFontSize ?? defaults.currencySymbol?.fontSize,
                    prefixFontSize: contentDefaults.prefixFontSize ?? defaults.nudge?.fontSize,
                    additionalLabelFontSize: contentDefaults.additionalLabelFontSize ?? prevContent.additionalLabelFontSize,
                    
                    // Colors
                    headlineColor: defaults.headline?.color,
                    prefixColor: defaults.nudge?.color,
                    discountAmountColor: defaults.discountAmount?.color,
                    unitIconColor: defaults.unitIcon?.color,
                    termsColor: defaults.tnc?.color,
                    
                    // Toggles (if defined in defaults)
                    showPrefix: contentDefaults.showPrefix !== undefined ? contentDefaults.showPrefix : prevContent.showPrefix,
                    additionalLabel: contentDefaults.additionalLabel !== undefined ? contentDefaults.additionalLabel : prevContent.additionalLabel,
                    termsAndCondition: contentDefaults.termsAndCondition !== undefined ? contentDefaults.termsAndCondition : prevContent.termsAndCondition,
                });

                return {
                    ...prev,
                    ...updates,
                    headlineType: '1 Headline', // Force single headline mode for Square (1:1)
                    content: {
                        en: resetContent(prev.content.en),
                        id: resetContent(prev.content.id)
                    },
                    elementPositions: newPositions,
                    // 3. Reset Assets
                    productIcon: undefined, // Start fresh
                    showPartnerLogo: false, // Hide partner logos
                    partnerLogos: [], 
                    // 4. Reset Scale/Pos
                    keyVisualScale: 100,
                    keyVisualPosition: { x: 50, y: 50 },
                    // 5. Default Background Settings (Requested)
                    backgroundType: 'color',
                    backgroundColor: '#0064D2', // b500
                    gradientOpacity: 0
                };
            }

            const isLegacyPromoRatio = [
                'Landscape (2:1)',
                'Landscape (16:9)',
                'Portrait (3:4)'
            ].includes(newRatio);

            if (prev.bannerRatio === 'Square (1:1)' && isLegacyPromoRatio) {
                const resetLegacyContent = (prevContent: ContentTranslation) => ({
                    ...prevContent,
                    headlineFontSize: 24,
                    discountAmountFontSize: undefined,
                    currencyFontSize: undefined,
                    prefixFontSize: undefined,
                    additionalLabelFontSize: undefined,
                    termsFontSize: undefined,
                });

                return {
                    ...prev,
                    ...updates,
                    content: {
                        en: resetLegacyContent(prev.content.en),
                        id: resetLegacyContent(prev.content.id)
                    },
                    elementPositions: undefined,
                    productIcon: undefined,
                    backgroundType: 'image',
                    keyVisualScale: 100,
                    keyVisualPosition: { x: 50, y: 50 },
                    gradientOpacity: 100,
                    overlayGradientStop: prev.overlayGradientStop ?? 10,
                    overlayColor: prev.overlayColor || '#000000',
                };
            }
        }

        return { ...prev, ...updates };
    });
    
    // Reset validation state on name change (Separate effect logic moved here for safety)
    if (updates.bannerName !== undefined) {
        setErrors(prev => {
            if (prev.bannerName) return { ...prev, bannerName: undefined };
            return prev;
        });
        setNameValidation({ status: 'idle' });
    }
  }, []);

  const getSafeFormData = () => {
      // In Edit Mode, ensure Ratio and Style match the initial DB value to prevent corruption
      // UNLESS it is Product Entry Point, which allows changing Ratios.
      if (editingId && initialData) {
          const isEntryPoint = formData.bannerCategory === 'Product Entry Point';
          if (isEntryPoint) {
               return formData; // Allow changes to persist
          }

          return {
              ...formData,
              bannerRatio: initialData.bannerRatio,
              bannerStyle: initialData.bannerStyle
          };
      }
      return formData;
  };

  const performLogout = async () => {
      await supabase.auth.signOut();
  };

  const handleLogout = () => {
     if (isDone || !hasChanges) {
         performLogout();
     } else {
         setLogoutPending(true);
         setIsExitModalOpen(true);
     }
  };

  const handleSync = (remoteData: BannerFormData) => {
    setFormData(remoteData);
    setRemoteVersion(null);
    setIsComparisonModalOpen(false);
    toast.custom((t) => <TiketSnackbar id={t} message="Synced to latest version. You can continue editing." variant="default" />);
  };

  const handleOverwrite = () => {
    // User explicitly chose to overwrite remote version with their changes
    setRemoteVersion(null);
    setIsComparisonModalOpen(false);
    toast.custom((t) => <TiketSnackbar id={t} message="You will overwrite the latest version when you finish." variant="default" />);
  };

  if (isDone) {
    return (
      <SuccessScreen 
        formData={getSafeFormData()} 
        onBackToList={onBack}
        userName={userName}
        userAvatar={userAvatar}
        onSave={() => {
          onBack();
        }}
        overwriteMode={isOverwriteMode}
        editingId={editingId}
        initialStatus={initialStatus}
        onLogout={handleLogout}
      />
    );
  }

  const handleSaveDraft = async (shouldLogout = false) => {
    try {
      setIsSavingDraft(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error("Auth error:", authError);
        toast.custom((t) => <TiketSnackbar id={t} message="You must be logged in to save drafts" variant="error" />);
        setIsSavingDraft(false);
        return;
      }

      // Generate or use existing ID for Deterministic Filename
      // Fallback to Date.now() if crypto.randomUUID is not available
      const bannerId = editingId || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `draft-${Date.now()}`);

      // If there is a keyVisualFile, upload it first
      let keyVisualUrl = formData.keyVisualUrl || null;
      if (formData.keyVisualFile) {
         // Determine upload path based on file origin (AI vs Manual)
         const isAI = formData.keyVisualFile.name.startsWith('ai_generated_');
         const ext = formData.keyVisualFile.name.split('.').pop() || 'png';
         const uniqueFilename = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `bg-${Date.now()}`;
         let path = '';
         
         if (isAI) {
            // AI Generated: Use specific folder and unique UUID
            path = `Assets/AI_Generated/${uniqueFilename}.${ext}`;
         } else {
            // Manual Upload: Use standard ImageBG folder with unique UUID
            path = `Assets/ImageBG/${uniqueFilename}.${ext}`;
         }
         
         const { url } = await BannerService.uploadImage(formData.keyVisualFile, path);
         keyVisualUrl = url;
      }

      // Prepare data for saving
      const safeData = getSafeFormData();
      const draftData = {
        ...safeData,
        keyVisualFile: undefined, // Don't save File object
        manualBackgroundFile: undefined, // Don't save File object
        keyVisualUrl: keyVisualUrl, // Save URL instead
        last_step: currentStep // Save current step
      };

      // DETECT UPDATE VS CREATE FOR DRAFTS
      // If we are editing an existing banner (editingId exists), we MUST use updateBanner (PUT)
      // to trigger the logic on the backend.
      // The backend now intelligently handles drafts by NOT snapshotting history and NOT incrementing version.
      
      const bannerData = {
        id: bannerId, // Use the ID we generated/used
        name: formData.bannerName || 'Untitled Draft',
        category: formData.bannerCategory,
        status: 'draft' as const,
        form_data: draftData,
        created_by: user.id,
        user_avatar: getUserAvatarUrl(user) || userAvatar || null,
        image_url_en: keyVisualUrl || '', // Use raw asset as preview for now
        image_url_id: keyVisualUrl || '',
        product: formData.verticalCategory // Add product/vertical info
      };

      if (editingId) {
           await BannerService.updateBanner(editingId, bannerData);
           toast.custom((t) => <TiketSnackbar id={t} message="Draft updated successfully." />);
      } else {
           await BannerService.saveBanner(bannerData);
           toast.custom((t) => <TiketSnackbar id={t} message="Draft saved successfully." />);
      }

      if (shouldLogout) {
          await performLogout();
      } else if (!editingId) {
          onBack(); // Only go back if it was a new creation
      } else {
         // Stay on page if updating draft? Or go back? 
         // Request implied "Save as Draft" might want to exit. 
         // "When saving a draft, the toast should say: 'Draft updated successfully.'" 
         // usually implies staying or exiting. Let's exit to be consistent with previous behavior
         // unless user wants to keep editing. 
         // Actually, most "Save as Draft" buttons exit.
         onBack(); 
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to save draft" variant="error" />);
      setIsSavingDraft(false);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Select Layout';
      case 2: return 'Content nudge';
      case 3: return 'Key visual & logo';
      default: return '';
    }
  };

  const steps: TiketStepItem[] = [
    { id: 1, label: 'Select Layout' },
    { id: 2, label: 'Content nudge' },
    { id: 3, label: 'Key visual & logo' },
  ];

  return (
    <div className={`min-h-screen bg-[#f8f9fd] flex flex-col relative w-full overflow-x-hidden ${embedded ? 'pt-[100px]' : ''}`}>
      <FontStyles />
      {/* Top Menu / Header */}
      {!embedded && (
        <Header 
            fullWidth 
            showLogo 
            hideSearch 
            userName={userName} 
            userId={userId}
            userAvatar={userAvatar}
            onLogout={handleLogout}
            presenceUsers={presenceUsers}
        />
      )}

      {/* Conflict Alert */}
      {remoteVersion && (
        <div className={`fixed z-30 bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-center shadow-sm w-full gap-4 transition-all duration-300 ${embedded ? 'top-[0px]' : 'top-[100px]'}`}>
            <div className="flex items-center gap-2 text-blue-800">
                <Info size={18} />
                <span className="font-medium text-sm">{remoteVersion.userName} has just saved a new version of this banner.</span>
            </div>
            <button
                onClick={() => setIsComparisonModalOpen(true)}
                className="text-blue-600 font-bold text-sm hover:underline"
            >
                View Changes
            </button>
            <button
                onClick={() => setRemoteVersion(null)}
                className="ml-4 text-blue-400 hover:text-blue-600"
            >
                <span className="sr-only">Dismiss</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className={`${embedded ? '' : 'mt-[124px]'} w-full max-w-[1200px] mx-auto px-[24px] pb-[40px] flex flex-col gap-[24px]`}>
        
        {/* Breadcrumbs & Steps */}
        <div className="flex flex-col gap-[8px] items-start">
          <TiketBreadcrumb
            items={[
              { label: 'Banners' },
              { label: categoryDisplayLabels[formData.bannerCategory] || formData.bannerCategory, href: `/banners/${formData.bannerCategory}` },
              { label: editingId ? 'Edit Banner' : 'Create New Banner' },
            ]}
          />
          <TiketStepper
            steps={steps}
            currentStep={currentStep}
            maxStepReached={maxStepReached}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full flex min-h-[600px]">
           {/* Left Side: Form */}
           <div className="flex-1 flex flex-col border-r border-[#d8dce8] max-w-[680px]">
             {/* Header */}
             <div className="pt-[24px] px-[24px] pb-[16px] border-b border-[#d8dce8]">
               <h2 className="text-[18px] font-bold text-[#303135] leading-[24px]">
                  {getStepTitle()}
               </h2>
             </div>
             {/* Form Content */}
             <div className="p-[24px] flex-1">
                {currentStep === 1 && (
                  <FormStepConfig 
                    formData={formData} 
                    onChange={updateFormData} 
                    error={errors.bannerName || (nameValidation.status === 'invalid' ? nameValidation.message : undefined)}
                    validationState={nameValidation}
                    onValidateName={validateBannerName}
                    isEditMode={!!editingId}
                  />
                )}
                {currentStep === 2 && (
                  <FormStep2 
                    formData={formData} 
                    onChange={updateFormData} 
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isTranslating={isTranslating}
                    setIsTranslating={setIsTranslating}
                  />
                )}
                {currentStep === 3 && (
                  <FormStep3 formData={formData} onChange={updateFormData} />
                )}
             </div>
           </div>

           {/* Right Side: Preview */}
           <div className="flex-1 flex flex-col bg-white rounded-tr-[12px] rounded-br-[12px]">
              {/* Header */}
              <div className="pt-[24px] px-[24px] pb-[16px] border-b border-[#d8dce8] flex items-center justify-between">
                 <h2 className="text-[18px] font-bold text-[#303135] leading-[24px]">Preview</h2>
                 
                 {/* Lock/Unlock Controls - Only show for Square (1:1) */}
                 {previewControls?.isSquare && (
                   <div className="flex items-center gap-2">
                     {previewControls.isUnlocked && (
                       <button 
                         onClick={previewControls.onResetPositions}
                         className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                       >
                         <RotateCcw size={14} />
                         Reset Positions
                       </button>
                     )}
                     
                     <button 
                       onClick={previewControls.onToggleLock}
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                         previewControls.isUnlocked ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                       }`}
                     >
                       {previewControls.isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                     </button>
                   </div>
                 )}
              </div>
              {/* Preview Content */}
              <div className="p-[24px] flex flex-col gap-[24px]">
                 <LivePreview 
                   formData={formData} 
                   onChange={updateFormData} 
                   currentStep={currentStep + 1}
                   onControlsChange={setPreviewControls}
                   activeTab={activeTab}
                   isTranslating={isTranslating}
                 />
              </div>
           </div>
        </div>

        {/* Main CTA */}
        <div className="flex justify-between items-center w-full">
            {/* Left Group: Exit/Save Actions */}
            <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={handleGlobalCancel}
                  disabled={isSavingDraft}
                  className="h-[52px] px-[24px] bg-[#ffe5e5] rounded-[8px] flex items-center justify-center text-[18px] font-bold text-[#ef4444] hover:bg-[#fecaca] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                {currentStep >= 1 && hasChanges && formData.bannerName?.trim() && formData.verticalCategory && (
                    <button 
                      type="button"
                      onClick={() => handleSaveDraft(false)}
                      disabled={isSavingDraft}
                      className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] flex items-center justify-center text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff] transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-2"
                    >
                      {isSavingDraft && (
                         <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                         </svg>
                      )}
                      Save as Draft
                    </button>
                )}
            </div>

            {/* Right Group: Navigation Actions */}
            <div className="flex items-center gap-4">
                {currentStep > 1 && (
                    <button 
                      type="button"
                      onClick={handlePreviousStep}
                      disabled={isSavingDraft}
                      className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] flex items-center justify-center text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff] transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                )}

                <button 
                  type="button"
                  onClick={handleNext}
                  disabled={isNextDisabled}
                  title={currentStep === 3 && (!hasChanges && !isDraft) ? "No changes have been made." : ""}
                  className="h-[52px] min-w-[140px] px-6 bg-[#007BFF] rounded-[8px] flex items-center justify-center text-[18px] font-bold text-white hover:bg-[#0064D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nameValidation.status === 'checking' ? (
                     <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                     </svg>
                  ) : (
                     currentStep === 3 ? 'Finish' : 'Next'
                  )}
                </button>
            </div>
        </div>
      </div>
      {/* Finish Confirmation Modal */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#007BFF]">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                 </div>
                 <h3 className="text-[20px] font-bold text-[#303135]">
                    Finish Creation?
                 </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-[24px]">
              <p className="text-[16px] text-[#4D4F56] leading-relaxed">
                Please double check your work. Are you sure you want to finish creating this banner?
              </p>
              <div className="mt-4 bg-[#f8f9fd] p-4 rounded-lg">
                 <div className="text-sm text-[#71747d] mb-1">Banner Name</div>
                 <div className="font-bold text-[#303135]">{formData.bannerName || 'Untitled Banner'}</div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="h-[44px] px-[24px] bg-white border border-[#d8dce8] text-[#4D4F56] text-[16px] font-bold rounded-[8px] hover:bg-[#f4f7fe] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmFinish}
                className="h-[44px] px-[24px] bg-[#007BFF] text-white text-[16px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors shadow-sm"
              >
                Finish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      {isOverwriteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200 border-2 border-orange-100">
            {/* Header */}
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                 </div>
                 <h3 className="text-[20px] font-bold text-[#303135]">
                    Overwrite Existing Banner?
                 </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOverwriteModalOpen(false)}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-[24px]">
              <p className="text-[16px] text-[#4D4F56] leading-relaxed">
                You are about to update the existing banner <strong>'{formData.bannerName}'</strong>. Do you want to overwrite it or rename it?
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
              <button
                type="button"
                onClick={() => {
                    setIsOverwriteModalOpen(false);
                    setCurrentStep(1); // Go to Rename Step (Step 1)
                }}
                className="h-[44px] px-[24px] bg-white border border-[#d8dce8] text-[#4D4F56] text-[16px] font-bold rounded-[8px] hover:bg-[#f4f7fe] transition-colors"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={handleOverwriteConfirm}
                className="h-[44px] px-[24px] bg-orange-600 text-white text-[16px] font-bold rounded-[8px] hover:bg-orange-700 transition-colors shadow-sm"
              >
                Yes, Overwrite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle size={24} strokeWidth={2} />
                 </div>
                 <h3 className="text-[20px] font-bold text-[#303135]">
                    You have unsaved changes
                 </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsExitModalOpen(false);
                  setLogoutPending(false);
                }}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-[24px]">
              <p className="text-[16px] text-[#71747d] leading-relaxed">
                {logoutPending 
                   ? "The banner you created will be lost if you log out. Choose the action you want to take:"
                   : "The banner you created will be lost if you leave this page. Choose the action you want to take:"
                }
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 p-[24px] pt-0">
               <div className="flex gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                        setIsExitModalOpen(false);
                        setLogoutPending(false);
                    }}
                    className="flex-1 h-[48px] px-[24px] bg-[#e7f2ff] border border-[#e7f2ff] text-[#007bff] text-[16px] font-bold rounded-[8px] hover:bg-[#d1e6ff] transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit3 size={16} />
                    Continue Editing
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDraft(logoutPending)}
                    disabled={isSavingDraft}
                    className="flex-1 h-[48px] px-[24px] bg-[#007BFF] text-white text-[16px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingDraft ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save as Draft
                      </>
                    )}
                  </button>
               </div>
               <button
                type="button"
                onClick={() => {
                   if (logoutPending) performLogout();
                   else onBack();
                }}
                className="w-full h-[48px] px-[24px] text-[#d4183d] text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: '#FFDFDF', borderColor: '#FFDFDF' }}
              >
                <Trash2 size={16} />
                Discard Banner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {remoteVersion && (
        <ComparisonModal 
            isOpen={isComparisonModalOpen}
            onClose={() => setIsComparisonModalOpen(false)}
            currentFormData={formData}
            remoteBannerId={remoteVersion.bannerId}
            remoteUserName={remoteVersion.userName}
            onSync={handleSync}
            onOverwrite={handleOverwrite}
        />
      )}

      {/* Navigation Blocker Dialog */}
      {showNavigationBlocker && (
        <NavigationBlockerDialog
          isOpen={showNavigationBlocker}
          onClose={() => {
            setShowNavigationBlocker(false);
            setPendingNavigation(null);
          }}
          onDiscard={() => {
            setHasUnsavedChanges(false);
            setShowNavigationBlocker(false);
            if (pendingNavigation) {
              pendingNavigation();
              setPendingNavigation(null);
            }
          }}
          onContinueEditing={() => {
            setShowNavigationBlocker(false);
            setPendingNavigation(null);
          }}
          onSaveAsDraft={async () => {
            await handleSaveDraft(false);
            setHasUnsavedChanges(false);
            setShowNavigationBlocker(false);
            if (pendingNavigation) {
              pendingNavigation();
              setPendingNavigation(null);
            }
          }}
          isSaving={isSavingDraft}
        />
      )}
    </div>
  );
}