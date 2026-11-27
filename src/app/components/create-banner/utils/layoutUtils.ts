import { BANNER_SPECS } from '../../../../config/banner-layouts';
import { BannerFormData, CurrencyType } from '../types';

/**
 * Converts the rich-text storage tags (<sb>, <b>, <eb>, <r>, <i>, <c v="">) and newlines into HTML.
 * Works on the whole string at once so tags that span multiple lines stay intact.
 */
export const tagsToHtml = (
    text: string,
    italicStyle = 'font-style: italic',
) =>
    text
        .replace(/\n/g, '<br/>')
        .replace(/<sb>/g, '<span style="font-weight: 600">')
        .replace(/<\/sb>/g, '</span>')
        .replace(/<b>/g, '<span style="font-weight: 700">')
        .replace(/<\/b>/g, '</span>')
        .replace(/<eb>/g, '<span style="font-weight: 800">')
        .replace(/<\/eb>/g, '</span>')
        .replace(/<r>/g, '<span style="font-weight: 400">')
        .replace(/<\/r>/g, '</span>')
        .replace(/<i>/g, `<span style="${italicStyle}">`)
        .replace(/<\/i>/g, '</span>')
        .replace(/<c v="(.*?)">/g, '<span style="color: $1">')
        .replace(/<\/c>/g, '</span>');

/** Text shown before the discount number. 'IDR' is the legacy value and renders as "Rp". */
export const getCurrencyLabel = (type: CurrencyType | undefined, customCurrency?: string): string => {
    switch (type) {
        case 'IDR': return 'Rp';
        case 'IDR_CODE': return 'IDR';
        case 'Custom': return (customCurrency || '').trim();
        default: return '';
    }
};


/** DLP Header 3:4 partner logo defaults: Y 194px (vs. 20px for Promo 3:4) and 120% scale (vs. 160%). */
export const getDefaultPartnerLogoY = (formData: Pick<BannerFormData, 'dlpRole'>): number =>
    formData.dlpRole === 'header-mobile' ? 194 : 20;
/** Partner logo scale default: 120% for the DLP Header mobile (3:4/1:1), 160% for Portrait (3:4) or Desktop (5:1) — shared by Promo Banner, DLP and TTD — else 100%. */
export const getDefaultPartnerLogoScale = (formData: Pick<BannerFormData, 'dlpRole' | 'bannerRatio'>): number =>
    formData.dlpRole === 'header-mobile' ? 1.2 : ((formData.bannerRatio === 'Portrait (3:4)' || formData.bannerRatio === 'Desktop (5:1)') ? 1.6 : 1);
/** DLP Header 3:4 campaign logo Y default: 180px (vs. 20px for Promo 3:4). */
export const getDefaultCampaignLogoY = (formData: Pick<BannerFormData, 'dlpRole'>): number =>
    formData.dlpRole === 'header-mobile' ? 180 : 20;

/**
 * DLP Header 3:4 content block Y offset default: -36px when the banner has nothing below the
 * headline/benefit block (no additional perks label, no additional label, no CTA) so the content
 * sits lower/centered instead of leaving empty space; 0 otherwise (and for non-DLP 3:4 banners).
 */
export const getDefaultPortraitContentOffsetY = (
    formData: Pick<BannerFormData, 'headlineType' | 'showPortraitCta' | 'dlpRole' | 'bannerRatio' | 'showCampaignLogo'>,
    content: { labelDiscount?: string; additionalLabel?: boolean },
): number => {
    // Banner 3:1 (TTD Promo Asset): content sits slightly higher by default (-16px); a campaign
    // logo needs that room at the top, so the content drops back down to 0 while it's shown.
    if (formData.bannerRatio === 'Landscape (3:1)') return formData.showCampaignLogo ? 0 : -16;
    if (formData.dlpRole !== 'header-mobile') return 0;
    const hasLabelDiscount = !!content.labelDiscount && formData.headlineType !== 'With Sub-Headline';
    const hasAdditionalLabel = !!content.additionalLabel && formData.headlineType !== 'With Sub-Headline';
    const hasExtras = hasLabelDiscount || hasAdditionalLabel; // DLP header never shows a CTA
    return hasExtras ? 0 : -36;
};

/** Landscape content block scale default: 105% for Banner 3:1 (TTD Promo Asset — this ratio is exclusive to it), else 100%. */
/** Content scale stamped on every new 2:1 banner (Promo Banner, DLP, TTD). Not used as the render fallback,
 *  so 2:1 banners saved before this default (no landscapeContentScale) keep rendering at 100%. */
export const NEW_LANDSCAPE_21_CONTENT_SCALE = 125;

export const getDefaultLandscapeContentScale = (
    formData: Pick<BannerFormData, 'bannerRatio'>,
): number => (formData.bannerRatio === 'Landscape (3:1)' ? 105 : 100);

/** Desktop 5:1/4:1 content scale default: 180% for the DLP Header 4:1, else 140% (125% with a second discount). */
export const getDefaultDesktopContentScale = (
    formData: Pick<BannerFormData, 'dlpRole' | 'content'>,
): number => {
    if (formData.dlpRole === 'header-desktop') return 180;
    return (formData.content.en.hasSecondDiscount || formData.content.id.hasSecondDiscount) ? 125 : 140;
};

/** Campaign logo size inside its sticky pill: 145% on the 5:1 (stand alone or bundled with a 2:1), 100% on the DLP Header 4:1. */
export const getDefaultDesktopCampaignAssetScale = (formData: Pick<BannerFormData, 'bannerRatio'>): number =>
    formData.bannerRatio === 'Desktop (4:1)' ? 100 : 145;

const WEIGHT_TAGS = ['sb', 'b', 'eb', 'r'] as const;
type WeightTag = typeof WEIGHT_TAGS[number];

const matchFullWrap = (s: string, tag: string): string | null => {
    const m = s.match(new RegExp(`^<${tag}>([\\s\\S]*)</${tag}>$`));
    return m ? m[1] : null;
};

/**
 * Reads the weight/italic formatting of a headline string, but only when it is applied
 * uniformly to the WHOLE string (e.g. select-all then click Bold) — the common case for
 * these short headline fields. Returns null when formatting is mixed/partial, so callers
 * know not to touch the other language's text.
 */
export const analyzeUniformFormat = (text: string): { weight: WeightTag | null; italic: boolean } | null => {
    const unwrapWeight = (s: string): { rest: string; weight: WeightTag | null } => {
        for (const tag of WEIGHT_TAGS) {
            const inner = matchFullWrap(s, tag);
            if (inner !== null) return { rest: inner, weight: tag === 'r' ? null : tag };
        }
        return { rest: s, weight: undefined as unknown as null };
    };

    let weight: WeightTag | null | undefined;
    let italic = false;
    let rest = text.trim();

    const first = unwrapWeight(rest);
    if (first.weight !== undefined) {
        weight = first.weight;
        rest = first.rest;
        const innerItalic = matchFullWrap(rest, 'i');
        if (innerItalic !== null) { italic = true; rest = innerItalic; }
    } else {
        const innerItalic = matchFullWrap(rest, 'i');
        if (innerItalic !== null) {
            italic = true;
            rest = innerItalic;
            const second = unwrapWeight(rest);
            weight = second.weight ?? null;
            rest = second.rest;
        } else {
            weight = null;
        }
    }

    // Anything left inside still carrying tags means mixed/partial formatting — bail out.
    if (/<(sb|b|eb|r|i|c)[ >]/.test(rest)) return null;
    return { weight: weight ?? null, italic };
};

/** Strips weight (sb/b/eb/r) and italic (i) wrapper tags, keeping the raw text (and any `<c>` colour tags) intact. */
export const stripWeightItalicTags = (text: string): string => text.replace(/<\/?(sb|b|eb|r|i)>/g, '');

/** Re-applies a uniform weight/italic format (as read by `analyzeUniformFormat`) to a plain-ish headline string. */
export const applyUniformFormat = (text: string, format: { weight: WeightTag | null; italic: boolean }): string => {
    let out = stripWeightItalicTags(text);
    if (format.italic) out = `<i>${out}</i>`;
    if (format.weight) out = `<${format.weight}>${out}</${format.weight}>`;
    return out;
};

export const CURRENCY_OPTIONS: { value: CurrencyType; label: string }[] = [
    { value: 'IDR', label: 'Rp' },
    { value: 'IDR_CODE', label: 'IDR' },
    { value: 'Custom', label: 'Custom' },
    { value: 'Non-IDR', label: 'None' },
];

/** Display text for stored unit values. Stored values stay K/mio/Rb/Jt for saved drafts. */
export const UNIT_LABEL: Record<string, string> = { K: 'k', mio: 'mio', Rb: 'rb', Jt: 'jt', '%': '%' };
export const getUnitLabel = (unit?: string) => (unit ? UNIT_LABEL[unit] ?? unit : '');

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
