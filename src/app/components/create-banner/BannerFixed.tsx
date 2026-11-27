import { forwardRef } from 'react';
import { BannerFormData } from './types';
import type { DiffHighlights } from '../../../utils/diffUtils';
import { BannerSquare } from './BannerSquare';
import { BannerLegacy } from './BannerLegacy';
import { BannerEntryPoint } from './BannerEntryPoint';
import { BannerDesktop51 } from './BannerDesktop51';

export interface BannerFixedProps {
    formData: BannerFormData; 
    lang: 'en' | 'id'; 
    label?: string;
    scale: number;
    position: { x: number, y: number };
    onMouseDown?: (e: React.MouseEvent) => void;
    previewUrl: string | null;
    isDraggable?: boolean;
    className?: string; // Allow override
    hideHeader?: boolean; // Option to hide flag/label
    renderScale?: number; // Zoom scale
    thumbnailUrl?: string; // Low-res thumbnail for progressive loading
    isImagePreloaded?: boolean; // External loading state to prevent flickering
    highlights?: DiffHighlights; // Visual diff highlighting
    isUnlocked?: boolean;
    onElementMove?: (key: string, x: number, y: number, w?: number, h?: number) => void;
    onContentChange?: (lang: 'en' | 'id', key: string, value: any) => void;
    fullSize?: boolean;
    hideBorder?: boolean;
    isShimmering?: boolean;
    onFormChange?: (updates: Partial<BannerFormData>) => void; // editor preview only: drag/scale the content with a bounding box
}

export const BannerFixed = forwardRef<HTMLDivElement, BannerFixedProps>((props, ref) => {
  const { formData } = props;
  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isSquare = formData.bannerRatio === 'Square (1:1)';

  if (isProductEntryPoint) {
      return <BannerEntryPoint ref={ref} {...props} />;
  }

  if (isPromoBanner && (formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)')) {
      return <BannerDesktop51 ref={ref} formData={formData} lang={props.lang} label={props.hideHeader ? undefined : props.label} previewUrl={props.previewUrl} fullSize={props.fullSize} onFormChange={props.onFormChange} isDraggable={props.isDraggable} onMouseDown={props.onMouseDown} />;
  }

  if (isPromoBanner && isSquare) {
      return <BannerSquare ref={ref} {...props} />;
  }

  return <BannerLegacy ref={ref} {...props} />;
});

BannerFixed.displayName = 'BannerFixed';
