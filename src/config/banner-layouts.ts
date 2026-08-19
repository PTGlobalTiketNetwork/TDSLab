export const BANNER_SPECS = {
  'Square (1:1)': {
    width: 600, 
    height: 600, 
    safeArea: 24,
    defaults: {
      headline: { x: 300, y: 120, width: 268, height: 80 },
      discountAmount: { x: 160, y: 273, width: 240, height: 144 },
      nudge: { x: 47, y: 298, width: 280, height: 96 },
      currencySymbol: { x: 27, y: 268, width: 60, height: 50 },
      unitIcon: { x: 223, y: 316, width: 64, height: 64 },
      plusSymbol: { x: 302, y: 276, width: 60, height: 80 },
      secondCurrencySymbol: { x: 316, y: 265, width: 80, height: 60 },
      secondDiscountAmount: { x: 445, y: 271, width: 260, height: 180 },
      secondUnitIcon: { x: 544, y: 307, width: 64, height: 64 },
      productIcon: { x: 476, y: 24, width: 100, height: 100 },
      additionalInfo: { x: 300, y: 433, width: 180, height: 34 },
      tnc: { x: 300, y: 542, width: 300, height: 34 },
      campaignLogo: { x: 27, y: 44, width: 208, height: 60 }
    },
    content_defaults: {
      headlineFontSize: 50,
      discountAmountFontSize: 148,
      currencyFontSize: 32,
      prefixFontSize: 24,
      additionalLabelFontSize: 27,
      showPrefix: false,
      additionalLabel: true,
      termsAndCondition: true
    },
    content_defaults_single: {
      headlineFontSize: 50,
      discountAmountFontSize: 228,
      currencyFontSize: 36,
      prefixFontSize: 30,
      additionalLabelFontSize: 25,
      showPrefix: true,
      additionalLabel: true,
      termsAndCondition: true
    },
    defaults_single: {
      headline: { x: 300, y: 117, width: 268, height: 80 },
      discountAmount: { x: 311, y: 260, width: 240, height: 144 },
      nudge: { x: 91, y: 347, width: 280, height: 96 },
      currencySymbol: { x: 114, y: 255, width: 60, height: 50 },
      unitIcon: { x: 423, y: 336, width: 85, height: 85 },
      productIcon: { x: 476, y: 24, width: 100, height: 100 },
      additionalInfo: { x: 300, y: 453, width: 180, height: 34 },
      tnc: { x: 300, y: 542, width: 300, height: 34 },
      campaignLogo: { x: 27, y: 44, width: 208, height: 60 }
    },
    // ID Specific Defaults (Headline shifted down 6px)
    defaults_id: {
      headline: { x: 300, y: 120, width: 268, height: 80 },
      discountAmount: { x: 160, y: 273, width: 240, height: 144 },
      nudge: { x: 47, y: 298, width: 280, height: 96 },
      currencySymbol: { x: 27, y: 268, width: 60, height: 50 },
      unitIcon: { x: 223, y: 316, width: 64, height: 64 },
      plusSymbol: { x: 302, y: 276, width: 60, height: 80 },
      secondCurrencySymbol: { x: 316, y: 265, width: 80, height: 60 },
      secondDiscountAmount: { x: 445, y: 271, width: 260, height: 180 },
      secondUnitIcon: { x: 544, y: 307, width: 64, height: 64 },
      productIcon: { x: 476, y: 24, width: 100, height: 100 },
      additionalInfo: { x: 300, y: 433, width: 180, height: 34 },
      tnc: { x: 300, y: 542, width: 300, height: 34 },
      campaignLogo: { x: 27, y: 44, width: 208, height: 60 }
    },
    defaults_single_id: {
      headline: { x: 300, y: 123, width: 268, height: 80 },
      discountAmount: { x: 311, y: 260, width: 240, height: 144 },
      nudge: { x: 91, y: 347, width: 280, height: 96 },
      currencySymbol: { x: 114, y: 255, width: 60, height: 50 },
      unitIcon: { x: 423, y: 336, width: 85, height: 85 },
      productIcon: { x: 476, y: 24, width: 100, height: 100 },
      additionalInfo: { x: 300, y: 453, width: 180, height: 34 },
      tnc: { x: 300, y: 542, width: 300, height: 34 },
      campaignLogo: { x: 27, y: 44, width: 208, height: 60 }
    },
    // Nudge-specific defaults for English
    nudge_defaults_en: {
      'discount': {
        nudge: { x: 81, y: 356 },
        discountAmount: { x: 351, y: 263 },
        currencySymbol: { x: 165, y: 254 },
        unitIcon: { x: 468, y: 335 },
        prefixFontSize: 30
      },
      'discount up to': {
        nudge: { x: 76, y: 356 },
        discountAmount: { x: 351, y: 263 },
        currencySymbol: { x: 165, y: 254 },
        unitIcon: { x: 468, y: 335 },
        prefixFontSize: 30
      },
      'up to': {
        nudge: { x: 96, y: 348 },
        discountAmount: { x: 324, y: 264 },
        currencySymbol: { x: 135, y: 258 },
        unitIcon: { x: 437, y: 336 },
        prefixFontSize: 35
      },
      'start from': {
        nudge: { x: 96, y: 348 },
        discountAmount: { x: 324, y: 264 },
        currencySymbol: { x: 135, y: 258 },
        unitIcon: { x: 437, y: 336 },
        prefixFontSize: 35
      }
    },
    // Nudge-specific defaults for Indonesian
    nudge_defaults_id: {
      'diskon': {
        nudge: { x: 90, y: 357 },
        discountAmount: { x: 336, y: 264 },
        currencySymbol: { x: 138, y: 255 },
        unitIcon: { x: 450, y: 335 },
        prefixFontSize: 30
      },
      'diskon hingga': {
        nudge: { x: 96, y: 348 },
        discountAmount: { x: 332, y: 262 },
        currencySymbol: { x: 141, y: 259 },
        unitIcon: { x: 441, y: 337 },
        prefixFontSize: 30
      },
      'hingga': {
        nudge: { x: 92, y: 349 },
        discountAmount: { x: 332, y: 262 },
        currencySymbol: { x: 141, y: 259 },
        unitIcon: { x: 441, y: 337 },
        prefixFontSize: 30
      },
      'mulai dari': {
        nudge: { x: 109, y: 347 },
        discountAmount: { x: 330, y: 262 },
        currencySymbol: { x: 141, y: 259 },
        unitIcon: { x: 435, y: 337 },
        prefixFontSize: 30
      }
    }
  },
  'Landscape (2:1)': {
     // Placeholder defaults matching current implicit defaults or just empty for now if not strictly requested
     width: 1200,
     height: 600,
     safeArea: 24,
     defaults: {
        // ... existing defaults
     }
  }
};

export const ENTRY_POINT_SPECS = {
  'mobile_5:2': {
    width: 320, 
    height: 128, 
    safeArea: 12,
    variants: ['with_cta', 'no_cta'],
    defaultVariant: 'with_cta',
    elements: {
      visual: { x: 0, y: 0, w: 140, h: 128, zIndex: 0 }, // Left side visual
      contentArea: { x: 156, y: 12, w: 152, h: 104, zIndex: 10 }, // Right side container (16px gap from visual)
      headline: { fontSize: 14, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 12, lineHeight: 1.2, color: '#FFFFFF' },
      ctaButton: { w: 113, h: 28, radius: 6, bg: '#FFFFFF', color: '#0064D2', fontSize: 12 }
    }
  },
  'mobile_2:1': {
    width: 320, 
    height: 160, 
    safeArea: 12,
    variants: ['with_cta', 'no_cta'],
    defaultVariant: 'with_cta',
    elements: {
      visual: { x: 0, y: 0, w: 140, h: 160, zIndex: 0 }, // Left side visual (taller)
      contentArea: { x: 156, y: 12, w: 152, h: 136, zIndex: 10 }, // Right side container (taller content area)
      headline: { fontSize: 14, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 12, lineHeight: 1.2, color: '#FFFFFF' },
      ctaButton: { w: 113, h: 28, radius: 6, bg: '#FFFFFF', color: '#0064D2', fontSize: 12 }
    }
  },
  'mobile_4:1': {
    width: 320, 
    height: 80, 
    safeArea: 12,
    variants: ['with_cta'],
    defaultVariant: 'with_cta',
    elements: {
      visual: { x: 0, y: 0, w: 100, h: 80, zIndex: 0 }, // Left side visual (Anchor left-bottom)
      contentArea: { x: 112, y: 0, w: 196, h: 80, zIndex: 10 }, // Right side (Vertically centered)
      headline: { fontSize: 11, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 10, lineHeight: 1.2, color: '#FFFFFF' }, // Fallback if needed
      ctaButton: { w: 108, h: 24, radius: 4, bg: '#FFFFFF', color: '#0064D2', fontSize: 11 }
    }
  },
  'mobile_2:1_whatsapp': {
    width: 320,
    height: 160,
    safeArea: 12,
    variants: ['default'],
    defaultVariant: 'default',
    elements: {
      visual: { x: 180, y: 0, w: 140, h: 160, zIndex: 0 }, // Right side visual
      contentArea: { x: 12, y: 12, w: 156, h: 136, zIndex: 10 }, // Left side container
      headline: { fontSize: 12, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 12, lineHeight: 1.2, color: '#FFFFFF' },
      ctaButton: { w: 0, h: 0, radius: 0, bg: 'transparent', color: 'transparent', fontSize: 0 }
    }
  },
  'desktop_5:1': {
    width: 640,
    height: 128,
    safeArea: 16,
    variants: ['with_cta', 'no_cta'],
    defaultVariant: 'with_cta',
    elements: {
      visual: { x: 0, y: 0, w: 180, h: 128, zIndex: 0 }, // Left side visual
      contentArea: { x: 200, y: 0, w: 424, h: 128, zIndex: 10 }, // Right content area
      headline: { fontSize: 16, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 13, lineHeight: 1.3, color: '#FFFFFF' },
      ctaButton: { w: 130, h: 32, radius: 6, bg: '#FFFFFF', color: '#0064D2', fontSize: 13 }
    }
  },
  'desktop_8:1': {
    width: 640,
    height: 80,
    safeArea: 12,
    variants: ['with_cta', 'no_cta'],
    defaultVariant: 'with_cta',
    elements: {
      visual: { x: 0, y: 0, w: 100, h: 80, zIndex: 0 }, // Left side visual (slim)
      contentArea: { x: 116, y: 0, w: 508, h: 80, zIndex: 10 }, // Right content area
      headline: { fontSize: 13, lineHeight: 1.2, color: '#FFFFFF' },
      subHeadline: { fontSize: 11, lineHeight: 1.2, color: '#FFFFFF' },
      ctaButton: { w: 120, h: 28, radius: 4, bg: '#FFFFFF', color: '#0064D2', fontSize: 12 }
    }
  }
};