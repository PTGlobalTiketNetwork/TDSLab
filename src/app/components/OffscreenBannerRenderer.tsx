import { forwardRef, useRef, useImperativeHandle, useState, useCallback, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import JSZip from 'jszip';
import { BannerFixed } from './create-banner/BannerFixed';
import { BannerFormData } from './create-banner/types';
import { migrateSavedFormData } from './create-banner/components/PolaroidCollage';
import { getBase64FontCSS } from '../utils/fontCss';
import { captureBannerElement, DESKTOP_MAX_EXPORT_WIDTH, isDesktopBannerRatio, ensureDataUrlForCapture, sanitizeFileName, waitForRenderStable, type DlpZipBannerSpec } from '../utils/bannerCapture';
import { Banner } from '../../types/banner';
import { toast } from 'sonner';
import { TiketSnackbar } from './ui/TiketSnackbar';
import { Loader2 } from 'lucide-react';

export interface OffscreenBannerRendererHandle {
  downloadBanner: (banner: Banner, scaleFactor: number) => Promise<void>;
  /** Capture the current EN banner composition for handoff to another tool. */
  captureBannerForResize: (banner: Banner) => Promise<Blob>;
  /** DLP Assets: render every sub-banner's EN + ID and bundle them into one ZIP download. */
  downloadDlpZip: (params: { projectName: string; zipName?: string; scaleFactor: number; banners: DlpZipBannerSpec[]; extraFiles?: () => Promise<{ path: string; blob: Blob }[]> }) => Promise<void>;
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
      maxOutputWidth: desktopCap(banner.form_data as BannerFormData | undefined),
    });

    const link = document.createElement('a');
    link.download = `${banner.name || 'banner'}-${lang}-${scaleFactor}x.png`;
    link.href = dataUrl;
    link.click();
  };

  const downloadBanner = useCallback(async (banner: Banner, scaleFactor: number) => {
    const formData = migrateSavedFormData(banner.form_data as BannerFormData | undefined);

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
    const formData = migrateSavedFormData(banner.form_data as BannerFormData | undefined);

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

  // Mounts one formData's EN + ID offscreen, waits for the same render/decode/font settle
  // as the other single-banner captures above, and returns both as blobs. Looped sequentially
  // by downloadDlpZip below, one sub-banner at a time, to reuse this proven timing logic without
  // juggling several BannerFixed instances in parallel (which would race the shared renderState).
  const captureFormDataPair = useCallback(async (
    formData: BannerFormData,
    scaleFactor: number,
    base64FontCSS: string,
  ): Promise<{ en: Blob; id: Blob }> => {
    const previewUrl = await ensureDataUrlForCapture(formData.keyVisualUrl || null, { strict: true });
    const scale = formData.keyVisualScale || 100;
    const position = formData.keyVisualPosition || { x: 50, y: 50 };
    const isEntryPoint = formData.bannerCategory === 'Product Entry Point';
    const isDesktopEP = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)';
    const renderScale = isEntryPoint ? (isDesktopEP ? 600 / 640 : 1.875) : undefined;

    setRenderState({
      formData,
      previewUrl,
      scale,
      position,
      renderScale,
      renderKey: `dlp-zip-${Date.now()}-${Math.random()}`,
    });

    await new Promise<void>((resolve) => {
      resolveRenderRef.current = resolve;
    });
    await waitForRenderStable();
    await document.fonts.ready;

    if (!enRef.current || !idRef.current) throw new Error('Banner preview was not rendered');
    const enElement = enRef.current.children[0] as HTMLElement;
    const idElement = idRef.current.children[0] as HTMLElement;
    if (!enElement || !idElement) throw new Error('Banner preview element was not found');

    const en = await captureBannerElement(enElement, { pixelRatio: scaleFactor, fontCss: base64FontCSS, maxOutputWidth: desktopCap(formData) });
    // Brief delay before the second capture, mirroring the gap between EN/ID in downloadBanner.
    await new Promise((r) => setTimeout(r, 300));
    const id = await captureBannerElement(idElement, { pixelRatio: scaleFactor, fontCss: base64FontCSS, maxOutputWidth: desktopCap(formData) });

    return { en: en.blob, id: id.blob };
  }, []);

  const downloadDlpZip = useCallback(async (params: { projectName: string; zipName?: string; scaleFactor: number; banners: DlpZipBannerSpec[]; extraFiles?: () => Promise<{ path: string; blob: Blob }[]> }) => {
    const { projectName, scaleFactor, banners, extraFiles } = params;
    const scaleLabel = scaleFactor !== 1 ? ` at ${scaleFactor}x` : '';

    if (!banners.length && !extraFiles) {
      toast.custom((t) => <TiketSnackbar id={t} message="Nothing to download" variant="error" />);
      return;
    }

    const downloadBlob = (blob: Blob, filename: string) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    const loadingToast = toast.custom((t) => (
      <TiketSnackbar
        id={t}
        message={`Preparing ZIP${banners.length ? ` (${banners.length} banners)` : ''}${scaleLabel}...`}
        variant="default"
        icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
      />
    ), { duration: Infinity });

    // Render every banner first. One banner's render failing doesn't sink the whole batch —
    // we just skip it and still bundle/download whatever succeeded.
    const captured: { folder: string; en: Blob; id: Blob }[] = [];
    const failedFolders: string[] = [];

    try {
      const base64FontCSS = await getBase64FontCSS();

      for (const { folder, formData } of banners) {
        try {
          const { en, id } = await captureFormDataPair(formData, scaleFactor, base64FontCSS);
          captured.push({ folder, en, id });
        } catch (err) {
          console.error(`DLP ZIP: failed to render "${folder}":`, err);
          failedFolders.push(folder);
        }
      }

      // Non-banner files (e.g. the TTD Brand Icon PNG) go into the zip as-is.
      let extras: { path: string; blob: Blob }[] = [];
      if (extraFiles) {
        try {
          extras = await extraFiles();
        } catch (err) {
          console.error('ZIP: failed to render extra files:', err);
          failedFolders.push('extra files');
        }
      }

      if (!captured.length && !extras.length) {
        throw new Error('Every banner failed to render — nothing to download.');
      }

      try {
        const zip = new JSZip();
        for (const { folder, en, id } of captured) {
          const dir = zip.folder(folder);
          dir?.file('EN.png', en);
          dir?.file('ID.png', id);
        }
        for (const { path, blob } of extras) zip.file(path, blob);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${sanitizeFileName(params.zipName || projectName)}.zip`);

        toast.dismiss(loadingToast);
        const failedNote = failedFolders.length ? ` (${failedFolders.length} failed to render and were skipped)` : '';
        toast.custom((t) => (
          <TiketSnackbar id={t} message={`${captured.length * 2 + extras.length} files downloaded as ZIP${scaleLabel}${failedNote}`} variant={failedFolders.length ? 'error' : 'default'} />
        ), { duration: 4000 });
      } catch (zipErr) {
        // ZIP packaging itself failed (e.g. jszip/CSP/memory issue) — fall back to plain
        // individual PNG downloads for everything that did render, per user request.
        console.error('DLP ZIP: packaging failed, falling back to individual downloads:', zipErr);
        for (const { folder, en, id } of captured) {
          downloadBlob(en, `${sanitizeFileName(projectName)} - ${sanitizeFileName(folder)} - EN.png`);
          await new Promise((r) => setTimeout(r, 300));
          downloadBlob(id, `${sanitizeFileName(projectName)} - ${sanitizeFileName(folder)} - ID.png`);
          await new Promise((r) => setTimeout(r, 300));
        }
        for (const { path, blob } of extras) downloadBlob(blob, `${sanitizeFileName(projectName)} - ${sanitizeFileName(path)}`);
        toast.dismiss(loadingToast);
        toast.custom((t) => (
          <TiketSnackbar id={t} message={`ZIP packaging failed — downloaded ${captured.length} banners individually instead`} variant="error" />
        ), { duration: 4000 });
      }
    } catch (err) {
      console.error('DLP ZIP download failed:', err);
      toast.dismiss(loadingToast);
      const message = err instanceof Error ? err.message : 'Failed to download. Please try again.';
      toast.custom((t) => (
        <TiketSnackbar id={t} message={message} variant="error" />
      ));
    } finally {
      setRenderState(null);
      resolveRenderRef.current = null;
      await waitForRenderStable();
    }
  }, [captureFormDataPair]);

  useImperativeHandle(ref, () => ({ downloadBanner, captureBannerForResize, downloadDlpZip }), [downloadBanner, captureBannerForResize, downloadDlpZip]);

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
            showPolaroidBadges={false}
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
            showPolaroidBadges={false}
          />
        </div>,
        document.body,
      )
    : null;
});

OffscreenBannerRenderer.displayName = 'OffscreenBannerRenderer';

// Legacy fallback: fetch raster image and download (no vector rendering)
function desktopCap(formData?: BannerFormData | null): number | undefined {
  return isDesktopBannerRatio(formData?.bannerRatio) ? DESKTOP_MAX_EXPORT_WIDTH : undefined;
}

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
