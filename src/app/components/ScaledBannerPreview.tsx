import { useState, useEffect, useRef } from 'react';
import { BannerFixed } from './create-banner/BannerFixed';
import { BannerFormData } from './create-banner/types';

// Keep source-background load state across pagination/remounts. The URL already
// includes the banner's updated timestamp, so a changed banner naturally gets a new key.
const loadedPreviewUrls = new Set<string>();
const previewCacheKey = (url: string) => `banner-preview-loaded:${url}`;

function isPreviewCached(url: string) {
  if (loadedPreviewUrls.has(url)) return true;

  try {
    return sessionStorage.getItem(previewCacheKey(url)) === '1';
  } catch {
    return false;
  }
}

function rememberPreview(url: string) {
  loadedPreviewUrls.add(url);
  try {
    sessionStorage.setItem(previewCacheKey(url), '1');
  } catch {
    // Browsing must continue if storage is unavailable or full.
  }
}

const getBannerHeight = (ratio: string | undefined) => {
  switch (ratio) {
    case 'Landscape (16:9)': return 337.5;
    case 'Square (1:1)': return 600;
    case 'Portrait (3:4)': return 800;
    case 'Landscape (2:1)':
    default: return 300;
  }
};

interface ScaledBannerPreviewProps {
  formData: BannerFormData;
  previewUrl: string | null;
  className?: string;
  /** How the banner should fit: 'contain' fits entirely, 'cover' fills and crops */
  fit?: 'contain' | 'cover';
}

/**
 * Renders a BannerFixed component at its native 600px width, then CSS-scales it
 * to fit the parent container. This avoids SVG foreignObject rendering quirks
 * (shifted text, different CSS box-sizing, font metric differences).
 */
export function ScaledBannerPreview({
  formData,
  previewUrl,
  className = '',
  fit = 'contain',
}: ScaledBannerPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isPreviewImageLoaded, setIsPreviewImageLoaded] = useState(() => (
    previewUrl ? isPreviewCached(previewUrl) : false
  ));

  useEffect(() => {
    if (!previewUrl) {
      setIsPreviewImageLoaded(false);
      return;
    }

    if (isPreviewCached(previewUrl)) {
      setIsPreviewImageLoaded(true);
      return;
    }

    let isActive = true;
    const image = new Image();
    const finish = () => {
      rememberPreview(previewUrl);
      if (isActive) setIsPreviewImageLoaded(true);
    };
    const fail = () => {
      if (isActive) setIsPreviewImageLoaded(false);
    };

    image.onload = finish;
    image.onerror = fail;
    image.src = previewUrl;

    // Browser cache can satisfy the request synchronously after src assignment.
    if (image.complete && image.naturalWidth > 0) finish();

    return () => {
      isActive = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [previewUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // Initial measure
    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isDesktopEntryPoint = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)';
  const isPortrait = formData.bannerRatio === 'Portrait (3:4)';
  const nativeWidth = isPortrait ? 360 : 600;
  let nativeHeight = isPortrait ? 480 : 300;
  let renderScale: number | undefined = undefined;

  if (isEntryPoint) {
    if (isDesktopEntryPoint) {
      // Desktop banners are 640px wide; scale down to fit the 600px nativeWidth slot
      renderScale = 600 / 640; // ≈ 0.9375
      nativeHeight = formData.bannerRatio === 'Desktop (8:1)' ? Math.round(80 * renderScale) : Math.round(128 * renderScale);
    } else {
      renderScale = 1.875; // 600 / 320
      if (formData.bannerRatio === 'Mobile (2:1)' || formData.bannerRatio === 'mobile_2:1') {
        nativeHeight = 160 * 1.875; // 300
      } else if (formData.bannerRatio === 'Mobile (4:1)' || formData.bannerRatio === 'mobile_4:1') {
        nativeHeight = 80 * 1.875; // 150
      } else {
        nativeHeight = 128 * 1.875; // 240 (Mobile 5:2)
      }
    }
  } else if (!isPortrait) {
    nativeHeight = getBannerHeight(formData.bannerRatio);
  }

  const { width: cw, height: ch } = containerSize;
  const scaleX = cw / nativeWidth;
  const scaleY = ch / nativeHeight;
  const scale = fit === 'cover' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const scaledW = nativeWidth * scale;
  const scaledH = nativeHeight * scale;

  // Center the scaled banner in the container
  const offsetX = (cw - scaledW) / 2;
  const offsetY = (ch - scaledH) / 2;

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {cw > 0 && ch > 0 && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: `${nativeWidth}px`,
            height: `${nativeHeight}px`,
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          <BannerFixed
            formData={formData}
            lang="en"
            scale={formData.keyVisualScale || 100}
            position={formData.keyVisualPosition || { x: 50, y: 50 }}
            previewUrl={previewUrl}
            hideHeader={true}
            fullSize={true}
            renderScale={renderScale}
            isImagePreloaded={previewUrl ? isPreviewImageLoaded : undefined}
          />
        </div>
      )}
      {previewUrl && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 z-20 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 transition-opacity duration-300 ease-out ${
            isPreviewImageLoaded ? 'pointer-events-none opacity-0' : 'animate-pulse opacity-100'
          }`}
        >
          <div className="absolute inset-x-[18%] bottom-[18%] h-px bg-blue-200/70" />
        </div>
      )}
    </div>
  );
}
