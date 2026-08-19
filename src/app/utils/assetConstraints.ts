// Shared asset dimension/ratio constraint logic

export type AssetConstraint = {
  label: string;
  minWidth: number;
  minHeight: number;
  maxRatio: number; // width / height
  minRatio: number; // width / height
  ratioLabel: string;
  recommendation: string;
};

export const ALL_ASSET_CATEGORIES = [
  'Campaign',
  'Payment',
  'Airlines',
  'Hotel',
  'Product Icon',
  'Entity Logo',
  'Partner',
  'Others',
] as const;

export type AssetCategory = (typeof ALL_ASSET_CATEGORIES)[number];

export const getAssetConstraints = (category: string): AssetConstraint | null => {
  const normalised = category.toLowerCase().replace(/\s+/g, '-');

  // Product Icon -> must be square
  if (normalised === 'product-icon') {
    return {
      label: 'Product Icon',
      minWidth: 140,
      minHeight: 140,
      minRatio: 0.95, // 1:1 with 5% tolerance
      maxRatio: 1.05,
      ratioLabel: '1:1 (Square)',
      recommendation: 'Minimum 140 x 140px, square ratio (1:1).',
    };
  }

  // Logo assets: Campaign, Payment, Airlines, Hotel, Entity Logo, Partner, Others
  const logoCategories = ['campaign', 'payment', 'airlines', 'hotel', 'brand-entity-logo', 'partner', 'others'];
  if (logoCategories.includes(normalised)) {
    return {
      label: 'Logo Asset',
      minWidth: 132,
      minHeight: 66,
      minRatio: 1.0,
      maxRatio: 5.0,
      ratioLabel: '1:1 - 5:1 (Square to Landscape)',
      recommendation: 'Minimum 132 x 66px, landscape ratio recommended (e.g. 2:1).',
    };
  }

  return null;
};

/**
 * Parse a dimension string like "200 x 200px" into { width, height }.
 * Returns null if parsing fails.
 */
export const parseDimension = (dimension: string): { width: number; height: number } | null => {
  if (!dimension || dimension === 'Auto') return null;
  // Match patterns like "200 x 200px", "200x200", "200 × 200px"
  const match = dimension.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  return { width: parseInt(match[1], 10), height: parseInt(match[2], 10) };
};

/**
 * Validate whether an asset (by its dimension) meets a target category's constraints.
 * Returns null if valid, or an error message string if invalid.
 */
export const validateAssetForCategory = (
  dimension: string,
  targetCategory: string
): string | null => {
  const constraints = getAssetConstraints(targetCategory);
  if (!constraints) return null; // no constraints = always valid

  const parsed = parseDimension(dimension);
  if (!parsed) {
    return 'Unable to determine asset dimensions. Please re-upload the asset with valid dimension metadata.';
  }

  const { width, height } = parsed;
  const actualRatio = width / height;

  if (width < constraints.minWidth || height < constraints.minHeight) {
    return `Asset is ${width} x ${height}px — ${targetCategory} requires minimum ${constraints.minWidth} x ${constraints.minHeight}px.`;
  }

  if (actualRatio < constraints.minRatio || actualRatio > constraints.maxRatio) {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(width, height);
    const ratioDisplay = `${width / d}:${height / d}`;
    return `Asset ratio is ${ratioDisplay} — ${targetCategory} requires ${constraints.ratioLabel}.`;
  }

  return null;
};

/** Map URL slug to stored category name */
export const normalizeCategoryName = (slug: string): string => {
  const map: Record<string, string> = {
    'product-icon': 'Product Icon',
    'brand-entity-logo': 'Entity Logo',
  };
  return map[slug] || slug;
};

/** Map stored category name to URL slug */
export const categoryToSlug = (category: string): string => {
  const map: Record<string, string> = {
    'Product Icon': 'product-icon',
    'Entity Logo': 'brand-entity-logo',
  };
  return map[category] || category;
};