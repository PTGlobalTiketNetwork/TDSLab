import { BannerFormData } from '@/app/components/create-banner/types';

export interface DiffHighlights {
  headlineDiff: boolean;
  nudgeDiff: boolean;
  backgroundDiff: boolean;
  campaignLogoDiff: boolean;
  partnerLogoDiff: boolean;
  layoutDiff: boolean;
  labelDiscountDiff: boolean;
  additionalLabelDiff: boolean;
  tncDiff: boolean;
  // New specific fields for Square Banner
  productIconDiff: boolean;
  currency1Diff: boolean;
  currency2Diff: boolean;
  amount1Diff: boolean;
  amount2Diff: boolean;
  unit1Diff: boolean;
  unit2Diff: boolean;
  // Entry Point Banner specific fields
  entryPointVisualDiff: boolean; // Key visual/background for Entry Point
  entryPointBackgroundDiff: boolean; // Background specific for Entry Point
  entryPointLogoDiff: boolean;   // Logo for Entry Point (WhatsApp)
  entryPointCopyDiff: boolean;   // Copy text (for with_cta variant)
  entryPointCtaDiff: boolean;    // CTA button (for with_cta variant)
  entryPointHeadlineDiff: boolean; // Headline (for no_cta variant)
  entryPointSubtextDiff: boolean;  // Subtext (for no_cta variant)
}

/**
 * Calculate differences between two banner versions
 * Groups fields into visual zones for highlighting
 */
export function calculateDiff(
  versionA: BannerFormData,
  versionB: BannerFormData,
  language: 'en' | 'id' = 'en'
): DiffHighlights {
  const contentA = versionA.content?.[language];
  const contentB = versionB.content?.[language];

  // Helper to check if values are different
  const isDifferent = (a: any, b: any): boolean => {
    if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
      return JSON.stringify(a) !== JSON.stringify(b);
    }
    return a !== b;
  };

  // 1. HEADLINE DIFF
  // Check: headline, subHeadline, secondHeadline, headlineColor, headlineFontSize, font weight
  const headlineDiff = !!(
    isDifferent(contentA?.headline, contentB?.headline) ||
    isDifferent(contentA?.subHeadline, contentB?.subHeadline) ||
    isDifferent(contentA?.secondHeadline, contentB?.secondHeadline) ||
    isDifferent(contentA?.headlineColor, contentB?.headlineColor) ||
    isDifferent(contentA?.headlineFontSize, contentB?.headlineFontSize) ||
    isDifferent(contentA?.headlineFontWeight, contentB?.headlineFontWeight)
  );

  // 2. NUDGE DIFF
  // Check: mainBenefitPrefix, prefixType, prefixFontSize, prefixColor, showPrefix
  const nudgeDiff = !!(
    isDifferent(contentA?.mainBenefitPrefix, contentB?.mainBenefitPrefix) ||
    isDifferent(contentA?.prefixType, contentB?.prefixType) ||
    isDifferent(contentA?.prefixFontSize, contentB?.prefixFontSize) ||
    isDifferent(contentA?.prefixColor, contentB?.prefixColor) ||
    isDifferent(contentA?.showPrefix, contentB?.showPrefix) ||
    // Legacy fields that might still be relevant
    isDifferent(contentA?.nudgeType, contentB?.nudgeType) ||
    isDifferent(contentA?.mainBenefit, contentB?.mainBenefit)
  );

  // 3. BACKGROUND DIFF
  // Check: background, keyVisualUrl, keyVisualScale, keyVisualPosition, gradientOpacity
  const backgroundDiff = !!(
    isDifferent(versionA.background, versionB.background) ||
    isDifferent(versionA.keyVisualUrl, versionB.keyVisualUrl) ||
    isDifferent(versionA.keyVisualScale, versionB.keyVisualScale) ||
    isDifferent(versionA.keyVisualPosition, versionB.keyVisualPosition) ||
    isDifferent(versionA.gradientOpacity, versionB.gradientOpacity)
  );

  // 4. LOGO DIFF
  // Check: actual logo content changes (not just show/hide flags)
  // Only highlight if there's a real visual difference
  const campaignLogoDiff = (() => {
    // Check if campaign logo URL actually changed
    const campaignLogoChanged = 
      versionA.showCampaignLogo && versionB.showCampaignLogo &&
      isDifferent(versionA.campaignLogo, versionB.campaignLogo);
    
    // Check if campaign logo visibility changed (from visible to hidden or vice versa with content)
    const campaignLogoVisibilityChanged = 
      versionA.showCampaignLogo !== versionB.showCampaignLogo &&
      (versionA.campaignLogo || versionB.campaignLogo);
    
    return !!(
      campaignLogoChanged ||
      campaignLogoVisibilityChanged ||
      isDifferent(versionA.showStamp, versionB.showStamp) ||
      isDifferent(versionA.showJhtLogo, versionB.showJhtLogo) ||
      isDifferent(versionA.stamp, versionB.stamp)
    );
  })();

  const partnerLogoDiff = (() => {
    // Check if partner logos array actually changed (content, not just show/hide)
    const partnerLogosChanged = (() => {
      if (!versionA.showPartnerLogo && !versionB.showPartnerLogo) return false;
      if (versionA.showPartnerLogo !== versionB.showPartnerLogo) return true;
      
      const logosA = versionA.partnerLogos || [];
      const logosB = versionB.partnerLogos || [];
      
      // Different number of logos
      if (logosA.length !== logosB.length) return true;
      
      // Check each logo slot for actual content changes
      return logosA.some((logoA, index) => {
        const logoB = logosB[index];
        
        // Only consider it a change if the logo URL actually changed
        // Type changes without logo URL changes are not visually different
        const logoUrlA = logoA?.logo || '';
        const logoUrlB = logoB?.logo || '';
        
        // If both logos are empty/placeholder, type change doesn't matter
        if (!logoUrlA && !logoUrlB) return false;
        
        // If one has logo and the other doesn't, that's a visual change
        if (Boolean(logoUrlA) !== Boolean(logoUrlB)) return true;
        
        // If both have logos, check if URLs are different
        return logoUrlA !== logoUrlB;
      });
    })();
    
    return !!(
      partnerLogosChanged
    );
  })();

  // 5. LAYOUT DIFF
  // Check: bannerRatio, bannerStyle, headlineType, discountAmountType, elementPositions
  const layoutDiff = !!(
    isDifferent(versionA.bannerRatio, versionB.bannerRatio) ||
    isDifferent(versionA.bannerStyle, versionB.bannerStyle) ||
    isDifferent(versionA.headlineType, versionB.headlineType) ||
    isDifferent(versionA.discountAmountType, versionB.discountAmountType) ||
    isDifferent(versionA.elementPositions, versionB.elementPositions) ||
    isDifferent(versionA.savedElementPositions, versionB.savedElementPositions)
  );

  // 6. LABEL DISCOUNT DIFF
  // Check: labelDiscount, labelDiscountType, labelDiscountText
  const labelDiscountDiff = !!(
    isDifferent(contentA?.labelDiscount, contentB?.labelDiscount) ||
    isDifferent(contentA?.labelDiscountType, contentB?.labelDiscountType) ||
    isDifferent(contentA?.labelDiscountText, contentB?.labelDiscountText) ||
    isDifferent(contentA?.labelDiscountColor, contentB?.labelDiscountColor) ||
    isDifferent(contentA?.labelDiscountIconColor, contentB?.labelDiscountIconColor)
  );

  // 7. ADDITIONAL LABEL DIFF
  // Check: additionalLabel, additionalLabelType, additionalLabelText
  const additionalLabelDiff = !!(
    isDifferent(contentA?.additionalLabel, contentB?.additionalLabel) ||
    isDifferent(contentA?.additionalLabelType, contentB?.additionalLabelType) ||
    isDifferent(contentA?.additionalLabelText, contentB?.additionalLabelText) ||
    isDifferent(contentA?.additionalLabelTextColor, contentB?.additionalLabelTextColor) ||
    isDifferent(contentA?.additionalLabelBackgroundColor, contentB?.additionalLabelBackgroundColor) ||
    isDifferent(contentA?.additionalLabelFontSize, contentB?.additionalLabelFontSize)
  );

  // 8. TNC DIFF
  // Check: termsAndCondition, termsText
  const tncDiff = !!(
    isDifferent(contentA?.termsAndCondition, contentB?.termsAndCondition) ||
    isDifferent(contentA?.termsText, contentB?.termsText) ||
    isDifferent(contentA?.termsColor, contentB?.termsColor) ||
    isDifferent(contentA?.termsFontSize, contentB?.termsFontSize)
  );

  // 9. NEW: PRODUCT ICON DIFF
  const productIconDiff = !!(
    isDifferent(versionA.productIcon, versionB.productIcon)
  );

  // 10. NEW: CURRENCY 1 DIFF (Rp1)
  const currency1Diff = !!(
    isDifferent(contentA?.discountType, contentB?.discountType) ||
    isDifferent(contentA?.currencyFontSize, contentB?.currencyFontSize) ||
    isDifferent(contentA?.discountAmountColor, contentB?.discountAmountColor) // Color shared with amount?
  );

  // 11. NEW: CURRENCY 2 DIFF (Rp2)
  const currency2Diff = !!(
    isDifferent(contentA?.hasSecondDiscount, contentB?.hasSecondDiscount) ||
    isDifferent(contentA?.secondDiscountType, contentB?.secondDiscountType) ||
    isDifferent(contentA?.currencyFontSize, contentB?.currencyFontSize) ||
    isDifferent(contentA?.secondDiscountAmountColor, contentB?.secondDiscountAmountColor)
  );

  // 12. NEW: AMOUNT 1 DIFF
  const amount1Diff = !!(
    isDifferent(contentA?.discountAmount, contentB?.discountAmount) ||
    isDifferent(contentA?.discountAmountFontSize, contentB?.discountAmountFontSize) ||
    isDifferent(contentA?.discountAmountColor, contentB?.discountAmountColor)
  );

  // 13. NEW: AMOUNT 2 DIFF
  const amount2Diff = !!(
    isDifferent(contentA?.hasSecondDiscount, contentB?.hasSecondDiscount) ||
    isDifferent(contentA?.secondDiscountAmount, contentB?.secondDiscountAmount) ||
    isDifferent(contentA?.discountAmountFontSize, contentB?.discountAmountFontSize) || // Shared size usually
    isDifferent(contentA?.secondDiscountAmountColor, contentB?.secondDiscountAmountColor)
  );

  // 14. NEW: UNIT 1 DIFF
  const unit1Diff = !!(
    isDifferent(contentA?.unit, contentB?.unit) ||
    isDifferent(contentA?.unitDisplayType, contentB?.unitDisplayType) ||
    isDifferent(contentA?.unitColor, contentB?.unitColor) ||
    isDifferent(contentA?.unitIconColor, contentB?.unitIconColor)
  );

  // 15. NEW: UNIT 2 DIFF
  const unit2Diff = !!(
    isDifferent(contentA?.hasSecondDiscount, contentB?.hasSecondDiscount) ||
    isDifferent(contentA?.secondDiscountUnit, contentB?.secondDiscountUnit) ||
    isDifferent(contentA?.secondUnitDisplayType, contentB?.secondUnitDisplayType) ||
    isDifferent(contentA?.secondUnitColor, contentB?.secondUnitColor) ||
    isDifferent(contentA?.secondUnitIconColor, contentB?.secondUnitIconColor)
  );

  // 16. ENTRY POINT BACKGROUND DIFF
  const entryPointBackgroundDiff = !!(
    isDifferent(versionA.background, versionB.background) ||
    isDifferent(versionA.backgroundColor, versionB.backgroundColor) ||
    isDifferent(versionA.backgroundType, versionB.backgroundType) ||
    isDifferent(versionA.backgroundGradientStops, versionB.backgroundGradientStops) ||
    isDifferent(versionA.backgroundGradientType, versionB.backgroundGradientType) ||
    isDifferent(versionA.backgroundGradientAngle, versionB.backgroundGradientAngle) ||
    isDifferent(versionA.backgroundGradientPosition, versionB.backgroundGradientPosition) ||
    isDifferent(versionA.gradientOpacity, versionB.gradientOpacity)
  );

  // 17. ENTRY POINT VISUAL DIFF (Key Visual Only)
  const entryPointVisualDiff = !!(
    isDifferent(versionA.keyVisualUrl, versionB.keyVisualUrl) ||
    isDifferent((versionA.keyVisualScale ?? 100), (versionB.keyVisualScale ?? 100)) ||
    isDifferent((versionA.keyVisualPosition || {x:0,y:0}), (versionB.keyVisualPosition || {x:0,y:0})) ||
    isDifferent((versionA.keyVisualRotation ?? 0), (versionB.keyVisualRotation ?? 0))
  );

  // 18. ENTRY POINT LOGO DIFF
  const entryPointLogoDiff = !!(
    isDifferent(versionA.showLogo, versionB.showLogo) ||
    isDifferent(versionA.selectedLogoUrl, versionB.selectedLogoUrl) ||
    isDifferent((versionA.logoScale ?? 60), (versionB.logoScale ?? 60))
  );

  const isWhatsApp = versionA.bannerRatio === 'Mobile (2:1 WhatsApp)';
  const variant = versionA.entryPointVariant || 'with_cta';

  // Common text checks (used for both Copy and Headline depending on variant)
  const isHeadlineTextChanged = !!(
    isDifferent(contentA?.headline, contentB?.headline) ||
    isDifferent(contentA?.headlineColor, contentB?.headlineColor) ||
    isDifferent(contentA?.headlineFontSize, contentB?.headlineFontSize) ||
    isDifferent(contentA?.headlineFontWeight, contentB?.headlineFontWeight)
  );

  // 19. ENTRY POINT COPY DIFF
  // For WhatsApp or 'with_cta', the main text is considered "Copy"
  const entryPointCopyDiff = (isWhatsApp || variant === 'with_cta') && isHeadlineTextChanged;

  // 20. ENTRY POINT CTA DIFF
  const entryPointCtaDiff = !!(
    isDifferent(contentA?.ctaText, contentB?.ctaText) ||
    isDifferent(contentA?.ctaColor, contentB?.ctaColor) ||
    isDifferent(contentA?.ctaFontSize, contentB?.ctaFontSize) ||
    isDifferent(contentA?.ctaFontWeight, contentB?.ctaFontWeight)
  );

  // 21. ENTRY POINT HEADLINE DIFF
  // Only for 'no_cta' variant (and NOT WhatsApp), the main text is considered "Headline"
  const entryPointHeadlineDiff = (!isWhatsApp && variant === 'no_cta') && isHeadlineTextChanged;

  // 22. ENTRY POINT SUBTEXT DIFF
  const entryPointSubtextDiff = !!(
    isDifferent(contentA?.subHeadline, contentB?.subHeadline) ||
    isDifferent(contentA?.subHeadlineColor, contentB?.subHeadlineColor) ||
    isDifferent(contentA?.subHeadlineFontSize, contentB?.subHeadlineFontSize) ||
    isDifferent(contentA?.subHeadlineFontWeight, contentB?.subHeadlineFontWeight)
  );

  return {
    headlineDiff,
    nudgeDiff,
    backgroundDiff,
    campaignLogoDiff,
    partnerLogoDiff,
    layoutDiff,
    labelDiscountDiff,
    additionalLabelDiff,
    tncDiff,
    productIconDiff,
    currency1Diff,
    currency2Diff,
    amount1Diff,
    amount2Diff,
    unit1Diff,
    unit2Diff,
    entryPointVisualDiff,
    entryPointBackgroundDiff,
    entryPointLogoDiff,
    entryPointCopyDiff,
    entryPointCtaDiff,
    entryPointHeadlineDiff,
    entryPointSubtextDiff
  };
}

/**
 * Check if any differences exist between two versions
 */
export function hasAnyDifferences(highlights: DiffHighlights): boolean {
  return (
    highlights.headlineDiff ||
    highlights.nudgeDiff ||
    highlights.backgroundDiff ||
    highlights.campaignLogoDiff ||
    highlights.partnerLogoDiff ||
    highlights.layoutDiff ||
    highlights.labelDiscountDiff ||
    highlights.additionalLabelDiff ||
    highlights.tncDiff ||
    highlights.productIconDiff ||
    highlights.currency1Diff ||
    highlights.currency2Diff ||
    highlights.amount1Diff ||
    highlights.amount2Diff ||
    highlights.unit1Diff ||
    highlights.unit2Diff ||
    highlights.entryPointVisualDiff ||
    highlights.entryPointBackgroundDiff ||
    highlights.entryPointLogoDiff ||
    highlights.entryPointCopyDiff ||
    highlights.entryPointCtaDiff ||
    highlights.entryPointHeadlineDiff ||
    highlights.entryPointSubtextDiff
  );
}

/**
 * Get a list of changed areas for display
 */
export function getChangedAreas(highlights: DiffHighlights): string[] {
  const areasSet = new Set<string>();
  
  if (highlights.headlineDiff) areasSet.add('Headline');
  if (highlights.nudgeDiff) areasSet.add('Nudge');
  if (highlights.backgroundDiff) areasSet.add('Background');
  if (highlights.campaignLogoDiff) areasSet.add('Campaign Logo');
  if (highlights.partnerLogoDiff) areasSet.add('Partner Logo');
  if (highlights.layoutDiff) areasSet.add('Layout');
  if (highlights.labelDiscountDiff) areasSet.add('Label Discount');
  if (highlights.additionalLabelDiff) areasSet.add('Additional Label');
  if (highlights.tncDiff) areasSet.add('Terms');
  if (highlights.productIconDiff) areasSet.add('Product Icon');
  
  // Group discount related changes
  const hasDiscountChanges = 
    highlights.currency1Diff || highlights.currency2Diff || 
    highlights.amount1Diff || highlights.amount2Diff || 
    highlights.unit1Diff || highlights.unit2Diff;
    
  if (hasDiscountChanges) areasSet.add('Discount Info');
  
  // Entry Point Banner specific changes
  if (highlights.entryPointVisualDiff) areasSet.add('Visual');
  if (highlights.entryPointBackgroundDiff) areasSet.add('Background');
  if (highlights.entryPointLogoDiff) areasSet.add('Logo');
  if (highlights.entryPointCopyDiff) areasSet.add('Copy');
  if (highlights.entryPointCtaDiff) areasSet.add('CTA');
  if (highlights.entryPointHeadlineDiff) areasSet.add('Headline');
  if (highlights.entryPointSubtextDiff) areasSet.add('Subtext');
  
  return Array.from(areasSet);
}