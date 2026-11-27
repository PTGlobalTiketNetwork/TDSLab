export interface BannerFormData {
  // Step 1: Configuration
  bannerName: string;
  // DLP Assets project (category 'DLP Assets'): which assets were chosen and the form of each entry point banner
  dlp?: {
    header: { mobile: boolean; mobileRatio: '1:1' | '3:4'; desktop: boolean; desktopForm?: BannerFormData; mobileForm?: BannerFormData }; // desktopForm = Desktop 4:1 editor
    entryPoints: Partial<Record<'ep-mobile-2x1' | 'ep-mobile-3x4' | 'ep-desktop', BannerFormData>>;
  };
  settingsVersion?: number; // see settingsVersion.ts — missing = pre-rework banner
  bannerCategory: 'Promo Banner' | 'Homepage Promo Banner' | 'Hero Landing Page Header' | 'Product Entry Point' | 'DLP Assets';
  
  // Promo Banner Specific (Step 1)
  verticalCategory: 'General' | 'Accom' | 'Hotel' | 'Transport' | 'Flight' | 'NFT' | 'ToDos' | 'Event' | ''; // 'Transport' only for banners saved before the split
  bannerStyle: 'Style 3 (Flagship/big campaign)' | 'Style 2 (Thematic/tactical campaign)' | 'Style 1 (Regular promo campaign)';
  bannerRatio: 'Landscape (2:1)' | 'Landscape (16:9)' | 'Square (1:1)' | 'Portrait (3:4)' | 'Mobile (5:2)' | 'Mobile (4:1)' | 'Mobile (2:1 WhatsApp)' | 'Desktop (5:1)' | 'Desktop (4:1)' | 'Desktop (8:1)'; // 4:1 = DLP Header desktop (same layout as 5:1)

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
  keyVisualScale?: number; // 5 to 200, default 100
  keyVisualPosition?: { x: number; y: number }; // 0-100% position
  keyVisualRotation?: number; // -180 to 180 degrees
  keyVisualFlipH?: boolean;
  keyVisualFlipV?: boolean;
  gradientOpacity: number; // 0 to 100
  overlayColor?: string; // Hex color for gradient overlay
  overlayGradientStop?: number; // Position 0-100 for gradient stop
  overlayGradientEnd?: number; // where the overlay has faded out completely, default 100
  overlayGradientEnd2?: number; // same for the second layer, default 100
  overlay2Opacity?: number; // % opacity of the second overlay layer, default 100
  overlay2Enabled?: boolean; // second overlay layer (same colour/opacity, own stop position)
  overlay2Synced?: boolean; // when true, Overlay 2's Start/Stop always mirror Overlay 1's (only Opacity stays independent)
  overlayGradientStop2?: number; // stop position of the second layer, default 40

  headlineFormatSynced?: boolean; // when true, headline/sub-headline font size + weight/italic mirror between EN and ID

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
  squareContentScale?: number; // Square 1:1 (DLP header) content block scale, 60–200, default 100
  squareContentOffsetY?: number; // Square 1:1 (DLP header) content block Y offset, -200–200, default 0
  nudgeOnTop?: boolean; // single discount: nudge centered above the number instead of to its left (not 1:1)
  dlpRole?: 'header-mobile' | 'header-desktop'; // set by the DLP flow on its header banners
  dlpNavbar?: boolean; // DLP Header mobile 3:4: show the app navbar + safe area on top (default shown)
  provideDesktopBanner?: boolean; // 2:1 only — ship a Desktop (5:1) version together with this banner
  desktopCtaEnabled?: boolean; // 5:1 CTA button, default off
  desktopContentScale?: number; // 60–200, default 100
  desktopContentOffsetY?: number; // px on the 2000×400 canvas, default 0
  centerContentVertically?: boolean; // 2:1 / 3:4: centre the content block vertically, default false
  desktopVerticalCenter?: boolean; // 5:1: centre the content block vertically (ignores the 2:1 top margins), default true
  landscapeCtaScale?: number; // 2:1 mobile CTA size in %, 50–100, default 100
  desktopTncOffset?: { x: number; y: number }; // 5:1 T&C position offset in px on the 2000×400 canvas, default 0,0
  desktopTncWidth?: number; // 5:1 T&C box width in px (where the text wraps), default 720
  // 5:1 bundled with a 2:1 banner: logos are NOT derived from the 2:1 settings — own toggles, own position/scale, and the asset can be overridden
  desktopShowCampaignLogo?: boolean; // default off
  desktopCampaignLogo?: string; // asset override; empty = same asset as the Mobile (2:1) campaign logo
  desktopShowPartnerLogo?: boolean; // default off
  desktopPartnerLogoMode?: 'same' | 'custom'; // default 'same' (same assets as Mobile)
  desktopPartnerLogos?: PartnerLogoSlot[]; // used when mode is 'custom', up to 4
  desktopCampaignLogoMode?: 'sticky' | 'free'; // sticky = pill at the top-left like the partner logos, free = placed anywhere without background. Default sticky
  desktopCampaignLogoScale?: number; // %, default 100 — Free area only: scale of the campaign logo itself
  desktopPillScale?: number; // %, default 100 — the sticky top-left pill (campaign segment + partner logos); also scales the partner pill in Free mode
  desktopCampaignAssetScale?: number; // %, default 100 — size of the campaign logo inside its sticky segment (up to nearly edge to edge)
  desktopCampaignLogoX?: number; // px on the 2000×400 canvas, default 24
  desktopCampaignLogoY?: number; // px on the 2000×400 canvas, default 24 (110 when a partner pill is shown)
  desktopCampaignLogoBgEnabled?: boolean; // background behind the campaign logo, default true
  desktopCampaignLogoBg?: string; // default #007BFF (b400)
  desktopContentOffsetX?: number; // 5:1 content X offset in px, kept inside the free area (clamped by CTA / T&C columns)
  desktopPartnerAssetScale?: number; // %, default 100 — shrinks/grows the partner logos AND their spacing
  desktopTncFontSize?: number; // 5:1 T&C font size in px, default 20
  desktopGradientEnd?: number; // 5:1 overlay Stop: % from the RIGHT edge where it has faded out, default 100
  desktopOverlay2Enabled?: boolean; // 5:1 second overlay layer (same colour)
  desktopOverlay2Synced?: boolean; // when true, Overlay 2's Start/Stop always mirror Overlay 1's (only Opacity stays independent)
  desktopGradientStop2?: number; // default 80
  desktopGradientEnd2?: number; // default 100
  desktopOverlayOpacity?: number; // %, default 100
  desktopOverlay2Opacity?: number; // %, default 100
  desktopPartnerGap?: number; // px between partner logos, default 36 (never below 16)
  desktopOverlayColor?: string; // 5:1 overlay colour, default #000000
  desktopGradientStop?: number; // 5:1 overlay Start: % from the RIGHT edge where it begins to fade, default 66 (mirror of the 2:1 overlay)
  desktopKeyVisualScale?: number; // 5–250, default 100
  desktopKeyVisualPosition?: { x: number; y: number }; // % like the 2:1 key visual, default 50,50
  landscapeContentScale?: number; // 60–200, default 100 — scales the whole content block in 2:1
  portraitContentOffsetY?: number; // px on the 720×960 canvas, default 0 — nudges the block up/down (negative = up)
  portraitBenefitScale?: number; // 50–150, default 100 — scales only the discount/benefit row
  portraitCtaWidthMode?: 'hugged' | 'fixed'; // default 'hugged'
  portraitCtaFixedWidth?: number; // canvas px, 200–480, default 480
  ctaTextColor?: string; // button text color, default #FFFFFF
  currencySyncLangs?: boolean; // Keep currency choice identical in EN & ID, default true

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
  customPrefixText?: string; // Remembers the Custom nudge text while a preset nudge is selected

  // NEW V2 Fields (Replacing Main/Secondary/Badge)
  // Currency: 'IDR' renders "Rp" (legacy value kept for saved drafts), 'IDR_CODE' renders "IDR",
  // 'Custom' renders customCurrency, 'Non-IDR' renders no currency.
  discountType: CurrencyType;
  customCurrency?: string;
  discountAmount: string;
  unit: 'K' | 'mio' | '%' | ''; // '' = no unit (e.g. "SGD 50")
  unitDisplayType?: 'text' | 'icon';

  // Second Discount (1 Headline / With Sub-Headline)
  hasSecondDiscount?: boolean;
  secondPrefixType?: ContentTranslation['prefixType'];
  secondBenefitPrefix?: string;
  secondCustomPrefixText?: string;
  secondDiscountType?: CurrencyType;
  secondCustomCurrency?: string;
  secondDiscountAmount?: string;
  secondDiscountUnit?: 'K' | 'mio' | '%' | '';
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
  secondPrefixColor?: string; // Nudge Type 2 (falls back to prefixColor, then yellow)
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

export type CurrencyType = 'IDR' | 'IDR_CODE' | 'Custom' | 'Non-IDR';

export interface PartnerLogoSlot {
  id: string;
  type: 'Payment' | 'Airlines' | 'Hotel' | 'Other' | 'Brand' | 'Partner' | 'Brand & Entity' | 'Product Icon';
  logo?: string;
}