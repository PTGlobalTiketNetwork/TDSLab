export interface BannerFormData {
  // Step 1: Configuration
  bannerName: string;
  bannerCategory: 'Promo Banner' | 'Homepage Promo Banner' | 'Hero Landing Page Header' | 'Product Entry Point';
  
  // Promo Banner Specific (Step 1)
  verticalCategory: 'General' | 'Hotel' | 'Transport' | 'ToDos' | 'Event' | '';
  bannerStyle: 'Style 3 (Flagship/big campaign)' | 'Style 2 (Thematic/tactical campaign)' | 'Style 1 (Regular promo campaign)';
  bannerRatio: 'Landscape (2:1)' | 'Landscape (16:9)' | 'Square (1:1)' | 'Portrait (3:4)' | 'Mobile (5:2)' | 'Mobile (4:1)' | 'Mobile (2:1 WhatsApp)' | 'Desktop (5:1)' | 'Desktop (8:1)';

  // Product Entry Point Specific
  platform?: 'Mobile' | 'Desktop';
  entryPointVariant?: 'with_cta' | 'no_cta';
  logoType?: 'Campaign' | 'Partner' | 'Brand';
  selectedLogoUrl?: string;
  showLogo?: boolean;
  logoScale?: number;

  // Legacy Step 1 Fields
  promoType?: 'Daily Promo' | 'Big Campaign';
  background?: 'General' | 'NHA' | 'ToDos' | 'Transports' | 'Manual';
  manualBackgroundFile?: File | null;
  headlineType: '1 Headline' | 'With Sub-Headline' | '2 Headlines';
  discountEnabled?: boolean; // Shared across both languages; defaults to true when undefined
  discountAmountType?: 'None' | '1 Number' | '2 Numbers';

  // Step 2: Content Nudge
  content: {
    en: ContentTranslation;
    id: ContentTranslation;
  };

  // Step 3: Visuals
  backgroundType?: 'color' | 'gradient' | 'image' | 'generate';
  backgroundColor?: string;
  backgroundGradientStops?: { id: string; color: string; position: number; opacity?: number }[]; // Position 0-100
  backgroundGradientType?: 'linear' | 'radial';
  backgroundGradientAngle?: number; // degrees
  backgroundGradientPosition?: { x: number; y: number }; // 0-100%
  
  keyVisualFile?: File | null; // This is the Main Background Image
  keyVisualUrl?: string; // For saved drafts/resuming
  keyVisualScale?: number; // 100 to 200
  keyVisualPosition?: { x: number; y: number }; // 0-100% position
  keyVisualRotation?: number; // -180 to 180 degrees
  keyVisualFlipH?: boolean;
  keyVisualFlipV?: boolean;
  gradientOpacity: number; // 0 to 100
  overlayColor?: string; // Hex color for gradient overlay
  overlayGradientStop?: number; // Position 0-100 for gradient stop
  
  stamp?: string; // or ID
  showStamp: boolean;
  campaignLogo?: string;
  campaignLogoScale?: number;
  partnerLogoScale?: number;
  campaignLogoX?: number;
  campaignLogoY?: number;
  partnerLogoY?: number;
  showCampaignLogo: boolean;
  partnerLogos: PartnerLogoSlot[];
  showPartnerLogo: boolean;
  showJhtLogo: boolean;
  
  // New Fields for Square/Strict Layout
  productIcon?: string;
  elementPositions?: Record<string, { x: number; y: number; width?: number; height?: number }>;
  
  // Portrait 3:4 — form-level settings (apply to both EN and ID)
  showPortraitCta?: boolean;
  ctaButtonColor?: string;
  portraitContentScale?: number; // 60–200, default 120
  portraitCtaWidthMode?: 'hugged' | 'fixed'; // default 'hugged'
  portraitCtaFixedWidth?: number; // canvas px, 200–480, default 480
  ctaTextColor?: string; // button text color, default #FFFFFF

  // Last Saved Step (for Draft Resume)
  last_step?: number;

  // Storage for element positions per language and nudge type
  savedElementPositions?: {
    en: Record<string, Record<string, { x: number; y: number; width?: number; height?: number }>>;
    id: Record<string, Record<string, { x: number; y: number; width?: number; height?: number }>>;
  };
}

export interface ContentTranslation {
  headline: string;
  subHeadline: string; // Made required but can be empty string
  ctaText?: string; // For Entry Point Banner / Portrait CTA label (per-lang text)
  secondHeadline?: string; // Persisted text for "2 Headlines" mode (Headline 2)
  
  // Prefix/Nudge Logic
  showPrefix?: boolean; // Toggle for showing/hiding nudge
  prefixType?: 'discount' | 'discount_upto' | 'upto' | 'start_from' | 'instant_cashback' | 'instant_cashback_upto' | 'custom';
  mainBenefitPrefix: string; // Used for prefix text
  
  // NEW V2 Fields (Replacing Main/Secondary/Badge)
  discountType: 'IDR' | 'Non-IDR';
  discountAmount: string;
  unit: 'K' | 'mio' | '%';
  unitDisplayType?: 'text' | 'icon';

  // Second Discount (1 Headline / With Sub-Headline)
  hasSecondDiscount?: boolean;
  secondDiscountType?: 'IDR' | 'Non-IDR';
  secondDiscountAmount?: string;
  secondDiscountUnit?: 'K' | 'mio' | '%';
  secondUnitDisplayType?: 'text' | 'icon';
  
  // Colors for Second Discount
  secondDiscountAmountColor?: string;
  secondUnitColor?: string;
  secondUnitIconColor?: string;
  
  labelDiscount: boolean;
  labelDiscountType: 'With icon' | 'Without icon';
  labelDiscountText: string;
  
  additionalLabel: boolean;
  additionalLabelType: 'Preset' | 'Custom';
  additionalLabelText: string;
  additionalLabelFontSize?: number; // Font size for additional label
  
  termsAndCondition: boolean;
  termsText: string;
  
  headlineFontSize?: number; // 32-50
  subHeadlineFontSize?: number; // Default 18
  currencyFontSize?: number; // Separate size for Rp symbol
  prefixFontSize?: number; // Custom Nudge Font Size
  prefixLineHeight?: number; // Custom Nudge vertical spacing, % (80-150). Undefined = auto
  discountAmountFontSize?: number; // Default 180
  plusFontSize?: number; // Default 60
  termsFontSize?: number; // Default 11
  savedFontSizes?: {
    '1 Headline'?: number;
    'With Sub-Headline'?: number;
    '2 Headlines'?: number;
  };

  // Color Customization
  headlineColor?: string;
  subHeadlineColor?: string;
  prefixColor?: string; // Nudge Type
  discountAmountColor?: string;
  unitColor?: string;
  unitIconColor?: string; // Unit Icon Circle Shape
  labelDiscountColor?: string;
  labelDiscountIconColor?: string;
  additionalLabelTextColor?: string;
  additionalLabelBackgroundColor?: string;
  termsColor?: string;

  // Deprecated / Legacy Fields (Keeping for safety until full migration)
  mainBenefitValue?: string;
  mainBenefitUnit?: string;
  mainBenefitType?: '3D Color' | 'Flat White';
  secondaryBenefit?: string;
  additionalBadge?: boolean;
  additionalBadgeText?: string;
  nudgeType?: 'Discount' | 'Discount up to' | 'Up to' | 'Start From';
  discountAmountLegacy?: string;
  unitLegacy?: string;
}

export interface PartnerLogoSlot {
  id: string;
  type: 'Payment' | 'Airlines' | 'Hotel' | 'Other' | 'Brand' | 'Partner' | 'Brand & Entity' | 'Product Icon';
  logo?: string;
}