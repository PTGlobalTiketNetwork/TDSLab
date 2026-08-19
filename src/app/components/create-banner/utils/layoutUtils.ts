import { BANNER_SPECS } from '../../../../config/banner-layouts';
import { BannerFormData } from '../types';

export const prefixOptions = {
    en: [
      { id: 'discount', label: 'Discount', value: 'Discount' },
      { id: 'discount_upto', label: 'Discount up to', value: 'Discount up to' },
      { id: 'upto', label: 'Up to', value: 'Up to' },
      { id: 'start_from', label: 'Start from', value: 'Start from' },
      { id: 'instant_cashback', label: 'Instant cashback', value: 'Instant\ncashback' },
      { id: 'instant_cashback_upto', label: 'Instant cashback up to', value: 'Instant\ncashback\nup to' },
      { id: 'custom', label: 'Custom', value: '' },
    ],
    id: [
      { id: 'discount', label: 'Diskon', value: 'Diskon' },
      { id: 'discount_upto', label: 'Diskon hingga', value: 'Diskon hingga' },
      { id: 'upto', label: 'Hingga', value: 'Hingga' },
      { id: 'start_from', label: 'Mulai dari', value: 'Mulai dari' },
      { id: 'instant_cashback', label: 'Instant cashback', value: 'Instant\ncashback' },
      { id: 'instant_cashback_upto', label: 'Instant cashback hingga', value: 'Instant\ncashback\nhingga' },
      { id: 'custom', label: 'Custom', value: '' },
    ],
};

export const loadDefaultPositions = (lang: 'en' | 'id', nudgeId: string, hasSecondDiscount: boolean = false) => {
    const specs = (BANNER_SPECS as any)['Square (1:1)'];
    if (!specs) return {};

    const nudgeDefaults = lang === 'en' ? specs?.nudge_defaults_en : specs?.nudge_defaults_id;
    
    // Get text value for lookup
    const option = prefixOptions[lang].find(o => o.id === nudgeId);
    const nudgeValue = option?.value.toLowerCase();
    
    const specificDefaults = nudgeDefaults?.[nudgeValue];
    
    // Determine base defaults based on discount mode
    let baseDefaultsKey = hasSecondDiscount ? 'defaults' : 'defaults_single';
    
    // Check for ID-specific defaults override
    if (lang === 'id' && specs[`${baseDefaultsKey}_id`]) {
        baseDefaultsKey += '_id';
    }

    const baseDefaults = specs[baseDefaultsKey] || specs.defaults || {};

    // Only apply nudge specific defaults if we are in Single Discount mode.
    // Double discount mode uses its own fixed layout and shouldn't be affected by these overrides.
    if (specificDefaults && !hasSecondDiscount) {
        return {
            ...baseDefaults,
            nudge: { ...baseDefaults.nudge, ...specificDefaults.nudge },
            discountAmount: { ...baseDefaults.discountAmount, ...specificDefaults.discountAmount },
            currencySymbol: { ...baseDefaults.currencySymbol, ...specificDefaults.currencySymbol },
            unitIcon: { ...baseDefaults.unitIcon, ...specificDefaults.unitIcon },
        };
    }
    return baseDefaults;
};

export const getPositionsForRender = (formData: BannerFormData, lang: 'en' | 'id') => {
    const content = formData.content[lang];
    const nudgeId = content.prefixType || 'custom';
    const hasSecondDiscount = formData.content.en.hasSecondDiscount || formData.content.id.hasSecondDiscount;
    
    // 1. Try saved positions
    const saved = formData.savedElementPositions?.[lang]?.[nudgeId];
    if (saved) return saved;

    // 2. Fallback to defaults
    // Only applies if we are in Square mode, otherwise defaults are different
    // Assuming Square for now as this logic is mostly for Square Nudge
    if (formData.bannerRatio === 'Square (1:1)') {
         return loadDefaultPositions(lang, nudgeId, hasSecondDiscount);
    }

    return formData.elementPositions || {};
};
