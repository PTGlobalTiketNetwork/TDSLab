/**
 * Version of the banner layout/settings model.
 *  1 (or missing) = banners made before the 2:1/3:4/5:1 rework (new defaults, desktop 5:1, bounding boxes, overlay layers …)
 *  2 = current
 * Banners below the current version are not edited in place: the list offers "Duplicate & migrate" instead,
 * so the original (and anything already published from it) stays exactly as it was.
 */
export const SETTINGS_VERSION = 2;

const LEGACY_LAYOUT_RATIOS = ['Landscape (2:1)', 'Landscape (16:9)', 'Portrait (3:4)'];

/** True for saved Promo Banners whose rendering/settings predate the current version. */
export function needsMigration(formData: any, category?: string): boolean {
  if (!formData) return false;
  if ((category ?? formData.bannerCategory) !== 'Promo Banner') return false;
  if (!LEGACY_LAYOUT_RATIOS.includes(formData.bannerRatio)) return false;
  return (formData.settingsVersion ?? 1) < SETTINGS_VERSION;
}
