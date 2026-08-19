# Wizard State Schema

This document outlines the state management for the "Create New Banner" wizard, specifically designed to support multiple banner types including the new "Promo Banner" (V2).

## State Object Structure

The central state object `BannerFormData` is designed to be generic while allowing for specific configurations based on `bannerCategory`.

```typescript
interface BannerFormData {
  // --- Step 1: Configuration ---
  bannerName: string;
  bannerCategory: 'Promo Banner' | 'Homepage Promo Banner' | 'Hero Landing Page Header' | 'Pop Up Banner' | 'Product Entry Point';
  
  // -- Category Specific Configuration --
  // These fields are populated based on the selected bannerCategory.
  
  // For 'Promo Banner':
  verticalCategory?: 'Hotel' | 'Transport' | 'ToDos' | 'Event';
  bannerStyle?: 'Style 2 (Tactical)' | 'Style 3 (Regular Immersive)';
  bannerRatio?: 'Landscape (16:9)' | 'Square (1:1)' | 'Portrait (3:4)';

  // For future categories (e.g., Hero Landing Page):
  // heroLayout?: 'Full Bleed' | 'Contained';
  
  // --- Legacy / Shared Fields (Step 1) ---
  // These may be deprecated or reused depending on the category.
  promoType?: 'Daily Promo' | 'Big Campaign';
  background?: 'General' | 'NHA' | 'ToDos' | 'Transports' | 'Manual';
  manualBackgroundFile?: File | null;
  headlineType?: '1 Headline' | 'With sub-headline' | '2 Headlines';
  discountAmountType?: 'None' | '1 Number' | '2 Numbers';

  // --- Step 2: Content Nudge ---
  content: {
    en: ContentTranslation;
    id: ContentTranslation;
  };

  // --- Step 3: Visuals ---
  keyVisualFile?: File | null;
  stamp?: string;
  showStamp: boolean;
  campaignLogo?: string;
  showCampaignLogo: boolean;
  partnerLogos: PartnerLogoSlot[];
  showPartnerLogo: boolean;
  showJhtLogo: boolean;
}
```

## Content Translation Object

The `ContentTranslation` object holds the localized text and configuration for the banner content.

```typescript
interface ContentTranslation {
  // Shared
  headline: string; // Max 5 words for Promo Banner

  // -- Promo Banner Specific --
  mainBenefit?: string; // e.g. "50%"
  mainBenefitUnit?: string; // e.g. "Off"
  mainBenefitType?: '3D Color' | 'Flat White';
  secondaryBenefit?: string; // e.g. "+ Extra Cashback"
  additionalBadge?: boolean;
  additionalBadgeText?: string;

  // -- Legacy Fields --
  nudgeType?: 'Discount' | 'Discount up to' | 'Up to' | 'Start From';
  discountAmount?: string;
  unit?: 'K' | 'mio' | 'Rb' | 'jt' | '%';
  labelDiscount?: boolean;
  labelDiscountType?: 'With icon' | 'Without icon';
  labelDiscountText?: string;
  additionalLabel?: boolean;
  additionalLabelText?: string;
  termsAndCondition?: boolean;
  termsText?: string;
}
```

## Workflow Logic

### Step 1: Configuration
1.  **Banner Category Selection**: The user selects a category (e.g., "Promo Banner").
2.  **Conditional Rendering**: 
    -   If "Promo Banner" is selected, show: Vertical Category, Banner Style, Banner Ratio.
    -   Other categories are currently disabled/WIP.

### Step 2: Content
1.  **Field Visibility**: 
    -   If `bannerCategory === 'Promo Banner'`, show the Promo Banner specific fields (Headline, Main Benefit, Secondary Benefit, Additional Badge).
    -   Hide legacy fields for this category.

### Step 3: Visuals
1.  **Key Visual**: Mandatory for Promo Banner. Acts as the background image.
2.  **Logos**: Standard logic applies.

## Database Considerations
-   The `banner_category` field should be added to the `banners` table in Supabase.
-   The `content` JSONB column in Supabase should flexible enough to store the varying structure of `ContentTranslation`.
