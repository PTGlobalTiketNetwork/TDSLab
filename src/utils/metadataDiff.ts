import { BannerFormData } from '../app/components/create-banner/types';

export interface MetadataField {
  key: keyof BannerFormData;
  label: string;
}

export const METADATA_FIELDS: MetadataField[] = [
  { key: 'bannerName', label: 'Banner Name' },
  { key: 'verticalCategory', label: 'Vertical' },
  { key: 'promoType', label: 'Promo Type' },
  { key: 'bannerRatio', label: 'Banner Ratio' },
  { key: 'bannerStyle', label: 'Banner Style' },
];

export interface MetadataDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  hasChanged: boolean;
}

/**
 * Compare metadata fields between two versions of BannerFormData
 * Returns array of differences
 */
export function compareMetadata(
  currentData: BannerFormData,
  remoteData: BannerFormData
): MetadataDiff[] {
  const diffs: MetadataDiff[] = [];

  METADATA_FIELDS.forEach(({ key, label }) => {
    const currentValue = currentData[key];
    const remoteValue = remoteData[key];

    // Normalize values for comparison (handle undefined/null)
    const normalizedCurrent = currentValue ?? '';
    const normalizedRemote = remoteValue ?? '';

    const hasChanged = normalizedCurrent !== normalizedRemote;

    diffs.push({
      field: key,
      label,
      oldValue: remoteValue,
      newValue: currentValue,
      hasChanged,
    });
  });

  return diffs;
}

/**
 * Check if all visual elements are identical (text content, images, colors, etc.)
 */
export function areVisualsIdentical(
  currentData: BannerFormData,
  remoteData: BannerFormData
): boolean {
  // Visual fields to compare
  const visualFields: (keyof BannerFormData)[] = [
    'headline_en',
    'headline_id',
    'body_en',
    'body_id',
    'cta_en',
    'cta_id',
    'keyVisualUrl',
    'keyVisualScale',
    'keyVisualPosition',
    'backgroundColor',
    'textColor',
    'headlineColor',
    'ctaBackgroundColor',
    'ctaTextColor',
    'labelBackgroundColor',
    'labelTextColor',
    'headlineAlignment',
    'bodyAlignment',
    'ctaAlignment',
  ];

  // Check if all visual fields are the same
  for (const field of visualFields) {
    const currentValue = currentData[field];
    const remoteValue = remoteData[field];

    // Deep comparison for objects (like position)
    if (typeof currentValue === 'object' && typeof remoteValue === 'object') {
      if (JSON.stringify(currentValue) !== JSON.stringify(remoteValue)) {
        return false;
      }
    } else {
      // Simple comparison for primitives
      if (currentValue !== remoteValue) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Get summary of changes
 */
export function getChangesSummary(diffs: MetadataDiff[]): {
  hasMetadataChanges: boolean;
  changedFieldsCount: number;
} {
  const changedFields = diffs.filter(d => d.hasChanged);
  
  return {
    hasMetadataChanges: changedFields.length > 0,
    changedFieldsCount: changedFields.length,
  };
}
