import { forwardRef, useRef, useImperativeHandle, useState, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { BannerFixed } from './create-banner/BannerFixed';
import { BannerFormData } from './create-banner/types';
import { getBase64FontCSS } from '../utils/fontCss';
import { captureBannerElement, ensureDataUrlForCapture, waitForRenderStable } from '../utils/bannerCapture';
import { Banner } from '../../types/banner';
import { toast } from 'sonner';
import { TiketSnackbar } from './ui/TiketSnackbar';
import { Loader2 } from 'lucide-react';

export interface OffscreenBannerRendererHandle {
  downloadBanner: (banner: Banner, scaleFactor: number) => Promise<void>;
  /** Capture the current EN banner composition for handoff to another tool. */
  captureBannerForResize: (banner: Banner) => Promise<Blob>;
}

export const OffscreenBannerRenderer = forwardRef<OffscreenBannerRendererHandle>((_, ref) => {
  const [renderState, setRenderState] = useState<{
    formData: BannerFormData;
    previewUrl: string | null;
    scale: number;
    position: { x: number; y: number };
    renderScale?: number;
    renderKey: string;
  } | null>(null);

  const enRef = useRef<HTMLDivElement>(null);
  const idRef = useRef<HTMLDivElement>(null);
  const resolveRenderRef = useRef<(() => void) | null>(null);

  // Called after BannerFixed mounts / updates
  const handleRendered = useCallback(() => {
    // Small delay to ensure children are painted
    setTimeout(() => {
      resolveRenderRef.current?.();
    }, 200);
  }, []);

  const captureElement = async (
    elRef: RefObject<HTMLDivElement | null>,
    banner: Banner,
    lang: 'en' | 'id',
    scaleFactor: number,
    base64FontCSS: string,
  ) => {
    if (!elRef.current) throw new Error(`${lang} banner ref not available`);
    const bannerElement = elRef.current.children[0] as HTMLElement;
    if (!bannerElement) throw new Error(`${lang} banner element not found`);

    const { dataUrl } = await captureBannerElement(bannerElement, {
      pixelRatio: scaleFactor,
      fontCss: base64FontCSS,
    });

    const link = document.createElement('a');
    link.download = `${banner.name || 'banner'}-${lang}-${scaleFactor}x.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadBanner = useCallback(async (banner: Banner, scaleFactor: number) => {
    const formData = banner.form_data as BannerFormData | undefined;

    if (!formData) {
      // Fallback: no form data, use legacy image fetch for both URLs
      await legacyDownload(banner, scaleFactor);
      return;
    }

    const scaleLabel = scaleFactor !== 1 ? ` at ${scaleFactor}x` : '';
    const loadingToast = toast.custom((t) => (
      <TiketSnackbar
        id={t}
        message={`Rendering banner${scaleLabel}...`}
        variant="default"
        icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
      />
    ), { duration: Infinity });

    try {
      // Inline background into a data URL so html-to-image can always paint
      // it (bypasses CORS and signed-URL timing issues inside foreignObject).
      const previewUrl = await ensureDataUrlForCapture(formData.keyVisualUrl || null, { strict: true });
      const scale = formData.keyVisualScale || 100;
      const position = formData.keyVisualPosition || { x: 50, y: 50 };

      // Calculate renderScale for Product Entry Point
      const isEntryPoint = formData.bannerCategory === 'Product Entry Point';
      const isDesktopEP = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)';
      const renderScale = isEntryPoint ? (isDesktopEP ? 600 / 640 : 1.875) : undefined;

      // 1. Mount offscreen BannerFixed for both languages
      setRenderState({
        formData,
        previewUrl,
        scale,
        position,
        renderScale,
        renderKey: `${banner.id}-${Date.now()}`,
      });

      // 2. Wait for React render + images to load
      await new Promise<void>((resolve) => {
        resolveRenderRef.current = resolve;
      });
      await waitForRenderStable();

      await document.fonts.ready;
      const base64FontCSS = await getBase64FontCSS();

      // 3. Capture EN (waits for image decode + validates output internally)
      await captureElement(enRef, banner, 'en', scaleFactor, base64FontCSS);

      // Brief delay before second download
      await new Promise((r) => setTimeout(r, 500));

      // 4. Capture ID
      await captureElement(idRef, banner, 'id', scaleFactor, base64FontCSS);

      toast.dismiss(loadingToast);
      toast.custom((t) => (
        <TiketSnackbar
          id={t}
          message={`EN & ID versions downloaded${scaleLabel} (vector quality)`}
          variant="default"
        />
      ), { duration: 3000 });
    } catch (err) {
      console.error('Offscreen download failed:', err);
      toast.dismiss(loadingToast);
      toast.custom((t) => (
        <TiketSnackbar id={t} message="Failed to download banner. Please try again." variant="error" />
      ));
    } finally {
      // Unmount offscreen banners to free memory
      setRenderState(null);
      resolveRenderRef.current = null;
      await waitForRenderStable();
    }
  }, []);

  const captureBannerForResize = useCallback(async (banner: Banner): Promise<Blob> => {
    const formData = banner.form_data as BannerFormData | undefined;

    // Static/legacy records do not have a composition to rebuild.
    if (!formData) {
      if (!banner.imageUrl) throw new Error('No image available for resize');
      const response = await fetch(banner.imageUrl);
      if (!response.ok) throw new Error('Could not load banner image');
      return response.blob();
    }

    try {
      // Inline the original key visual before capture so the rebuilt banner retains
      // the background selected in the source banner, not its stale exported thumbnail.
      const previewUrl = await ensureDataUrlForCapture(formData.keyVisualUrl || null, { strict: true });
      setRenderState({
        formData,
        previewUrl,
        scale: formData.keyVisualScale || 100,
        position: formData.keyVisualPosition || { x: 50, y: 50 },
        renderScale: formData.bannerCategory === 'Product Entry Point'
          ? ((formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)') ? 600 / 640 : 1.875)
          : undefined,
        renderKey: `${banner.id}-resize-${Date.now()}`,
      });

      await new Promise<void>((resolve) => {
        resolveRenderRef.current = resolve;
      });
      await waitForRenderStable();
      await document.fonts.ready;

      if (!enRef.current) throw new Error('Banner preview was not rendered');
      const bannerElement = enRef.current.children[0] as HTMLElement;
      if (!bannerElement) throw new Error('Banner preview element was not found');

      const { dataUrl } = await captureBannerElement(bannerElement, {
        pixelRatio: 3,
        fontCss: await getBase64FontCSS(),
      });
      const response = await fetch(dataUrl);
      return response.blob();
    } finally {
      setRenderState(null);
      resolveRenderRef.current = null;
      await waitForRenderStable();
    }
  }, []);

  useImperativeHandle(ref, () => ({ downloadBanner, captureBannerForResize }), [downloadBanner, captureBannerForResize]);

  return renderState
    ? createPortal(
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '600px',
            height: '2000px',
            zIndex: -9999,
            opacity: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
          // Trigger "rendered" after mount
          ref={(el) => {
            if (el) {
              // Wait for a frame to allow children to render
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  handleRendered();
                });
              });
            }
          }}
        >
          <BannerFixed
            key={`${renderState.renderKey}-en`}
            ref={enRef}
            formData={renderState.formData}
            lang="en"
            scale={renderState.scale}
            position={renderState.position}
            previewUrl={renderState.previewUrl}
            isDraggable={false}
            hideHeader={true}
            fullSize={true}
            renderScale={renderState.renderScale}
            isImagePreloaded={!!renderState.previewUrl}
          />
          <BannerFixed
            key={`${renderState.renderKey}-id`}
            ref={idRef}
            formData={renderState.formData}
            lang="id"
            scale={renderState.scale}
            position={renderState.position}
            previewUrl={renderState.previewUrl}
            isDraggable={false}
            hideHeader={true}
            fullSize={true}
            renderScale={renderState.renderScale}
            isImagePreloaded={!!renderState.previewUrl}
          />
        </div>,
        document.body,
      )
    : null;
});

OffscreenBannerRenderer.displayName = 'OffscreenBannerRenderer';

// Legacy fallback: fetch raster image and download (no vector rendering)
async function legacyDownload(banner: Banner, scaleFactor: number) {
  const enUrl = banner.imageUrl;
  const idUrl = (banner as any).image_url_id || null;

  if (!enUrl && !idUrl) {
    toast.custom((id) => (
      <TiketSnackbar id={id} message="No image available to download" variant="error" />
    ));
    return;
  }

  const scaleLabel = scaleFactor !== 1 ? ` at ${scaleFactor}x` : '';
  const loadingToast = toast.custom((id) => (
    <TiketSnackbar id={id} message={`Preparing download${scaleLabel}...`} />
  ), { duration: Infinity });

  const downloadSingle = async (imageUrl: string, lang: 'en' | 'id') => {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch ${lang} image`);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    let extension = 'png';
    if (blob.type === 'image/jpeg') extension = 'jpg';
    else if (blob.type === 'image/webp') extension = 'webp';
    link.download = `${banner.name || 'banner'}-${lang}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  try {
    if (enUrl) await downloadSingle(enUrl, 'en');
    if (enUrl && idUrl) await new Promise((r) => setTimeout(r, 500));
    if (idUrl) await downloadSingle(idUrl, 'id');

    toast.dismiss(loadingToast);
    const langLabel = enUrl && idUrl ? 'EN & ID' : enUrl ? 'EN' : 'ID';
    toast.custom((id) => (
      <TiketSnackbar id={id} message={`${langLabel} versions downloaded${scaleLabel}`} />
    ));
  } catch (error) {
    console.error('Download error:', error);
    toast.dismiss(loadingToast);
    toast.custom((id) => (
      <TiketSnackbar id={id} message="Failed to download banner images" variant="error" />
    ));
  }
}
