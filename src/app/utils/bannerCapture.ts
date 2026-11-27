import { toPng } from 'html-to-image';
import { getBase64FontCSS } from './fontCss';
import type { BannerFormData } from '../components/create-banner/types';

/**
 * Bytes floor for any captured banner PNG. Anything smaller than this is
 * almost certainly blank / missing background and we should refuse to save it.
 */
const ABSOLUTE_MIN_CAPTURE_BYTES = 4096;

/** Approx minimum bytes per output pixel for a non-empty banner PNG. */
const MIN_BYTES_PER_PIXEL = 0.02;

/**
 * Converts a remote image URL into a `data:` URI. Short-circuits if the input
 * is already a `data:` / `blob:` URL. This is the primary defense against
 * blank thumbnails: html-to-image renders inside an SVG foreignObject whose
 * blob origin cannot reliably fetch remote images before capture, so we
 * inline the background before rendering.
 */
export async function fetchAsDataUrl(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;

  const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`);
  }
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Returns a capture-safe version of the given image URL, converting remote
 * URLs into data URIs. Falls back to the original URL if conversion fails,
 * so callers can still attempt a best-effort capture.
 */
export async function ensureDataUrlForCapture(
  url: string | null | undefined,
  options: { strict?: boolean } = {},
): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  try {
    return await fetchAsDataUrl(url);
  } catch (err) {
    if (options.strict) {
      throw err;
    }
    console.warn('[bannerCapture] Could not inline image, using remote URL', err);
    return url;
  }
}

/**
 * Converts a `File`/`Blob` into a data URL. Used for the "user just uploaded
 * a file" capture path.
 */
export function fileToDataUrl(file: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

/**
 * Waits until every `<img>` inside `element` is decoded (or has settled with
 * error) before resolving. Rejects after `timeoutMs` so we never block
 * forever on a broken image.
 */
export async function waitForImagesDecoded(
  element: HTMLElement,
  timeoutMs = 8000,
): Promise<void> {
  const images = Array.from(element.querySelectorAll('img'));
  if (images.length === 0) return;

  const settleOne = (img: HTMLImageElement): Promise<void> => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();

    if (typeof img.decode === 'function') {
      return img.decode().catch(
        () =>
          new Promise<void>((res) => {
            const done = () => res();
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
          }),
      );
    }

    return new Promise<void>((res) => {
      const done = () => res();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  };

  const all = Promise.all(images.map(settleOne)).then(() => undefined);
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(
      () => reject(new Error(`waitForImagesDecoded timed out after ${timeoutMs}ms`)),
      timeoutMs,
    ),
  );

  await Promise.race([all, timeout]);
}

/** Yields for two animation frames so queued React state + layout are flushed. */
export function waitForRenderStable(): Promise<void> {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

function estimateMinBytes(pixelWidth: number, pixelHeight: number): number {
  const area = Math.max(1, pixelWidth * pixelHeight);
  return Math.max(ABSOLUTE_MIN_CAPTURE_BYTES, Math.floor(area * MIN_BYTES_PER_PIXEL));
}

export interface CaptureBannerOptions {
  /** Final output pixel ratio passed to html-to-image. Defaults to 1. */
  pixelRatio?: number;
  /** Pre-fetched base64 font CSS. If omitted, utility loads it itself. */
  fontCss?: string;
  /** Override the min-bytes validation. Useful for non-banner contexts. */
  minBytes?: number;
  /** Inline style overrides passed to html-to-image. */
  style?: Partial<CSSStyleDeclaration>;
}

export interface CaptureResult {
  blob: Blob;
  dataUrl: string;
  bytes: number;
}

/**
 * Captures a DOM element into a PNG blob with:
 *   - Embedded base64 fonts (so text renders correctly inside foreignObject)
 *   - Image decode wait (so background imagery is actually painted)
 *   - Layout settle (2 rAFs)
 *   - Size validation (refuses blank/near-blank captures)
 *   - Automatic retry with exponential backoff
 */
export async function captureBannerElement(
  element: HTMLElement,
  options: CaptureBannerOptions = {},
  maxAttempts = 2,
): Promise<CaptureResult> {
  const fontCss = options.fontCss ?? (await getBase64FontCSS());
  const pixelRatio = options.pixelRatio ?? 1;

  const rect = element.getBoundingClientRect();
  const minBytes =
    options.minBytes ??
    estimateMinBytes(
      Math.round(rect.width * pixelRatio),
      Math.round(rect.height * pixelRatio),
    );

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await waitForImagesDecoded(element);
      await waitForRenderStable();

      const dataUrl = await toPng(element, {
        cacheBust: false,
        useCORS: true,
        fontEmbedCSS: fontCss,
        skipFonts: true,
        pixelRatio,
        // DLP Header's navbar overlay (data-dlp-navbar, see BannerLegacy.tsx) is a preview-only visual aid for
        // the editor — it must never end up baked into the exported/downloaded asset.
        filter: (node) => !(node instanceof HTMLElement && node.hasAttribute('data-dlp-navbar')),
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          ...(options.style as Record<string, string> | undefined),
        },
      });

      const blob = await (await fetch(dataUrl)).blob();

      if (blob.size < minBytes) {
        throw new Error(
          `Captured image too small (${blob.size} bytes, expected >= ${minBytes}). ` +
            'Background likely missing.',
        );
      }

      return { blob, dataUrl, bytes: blob.size };
    } catch (err) {
      lastError = err;
      console.warn(
        `[bannerCapture] capture attempt ${attempt}/${maxAttempts} failed:`,
        err,
      );
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to capture banner after retries');
}

export interface DlpZipBannerSpec {
  /** Zip folder path, already numbered, e.g. "01 Header/Mobile" — JSZip nests on "/". */
  folder: string;
  formData: BannerFormData;
}

/**
 * Orders the sub-banners of a DLP Assets project for the "download as ZIP"
 * feature: "01 Header" (Mobile/Desktop subfolders) then "02 Banner Entry Point"
 * (2x1/3x4/5x1 subfolders, each in a fixed ratio order).
 */
export function buildDlpZipManifest(dlp: NonNullable<BannerFormData['dlp']>): DlpZipBannerSpec[] {
  const list: DlpZipBannerSpec[] = [];

  if (dlp.header.mobile && dlp.header.mobileForm) {
    list.push({ folder: '01 Header/Mobile', formData: dlp.header.mobileForm });
  }
  if (dlp.header.desktop && dlp.header.desktopForm) {
    list.push({ folder: '01 Header/Desktop', formData: dlp.header.desktopForm });
  }

  const epOrder: { key: 'ep-mobile-2x1' | 'ep-mobile-3x4' | 'ep-desktop'; label: string }[] = [
    { key: 'ep-mobile-2x1', label: '2x1 (Landscape)' },
    { key: 'ep-mobile-3x4', label: '3x4 (Portrait)' },
    { key: 'ep-desktop', label: '5x1 (Desktop)' },
  ];
  for (const { key, label } of epOrder) {
    const form = dlp.entryPoints[key];
    if (form) list.push({ folder: `02 Banner Entry Point/${label}`, formData: form });
  }

  return list;
}

/** TTD Promo Asset ZIP order: the picked banners, each with EN + ID. The Brand Icon is added separately (see renderTtdVerticalIcon). */
export function buildTtdZipManifest(ttd: NonNullable<BannerFormData['ttd']>): DlpZipBannerSpec[] {
  const order: { key: 'banner2x1' | 'banner3x1' | 'banner5x1'; label: string }[] = [
    { key: 'banner2x1', label: '01 Banner 2x1' },
    { key: 'banner3x1', label: '02 Banner 3x1' },
    { key: 'banner5x1', label: '03 Banner 5x1 (Desktop)' },
  ];
  return order.filter(({ key }) => ttd[key]).map(({ key, label }) => ({ folder: label, formData: ttd[key]! }));
}

// Bottom → top colours of the Brand Icon circle (same as the editor's `linear-gradient(to top, …)`).
export const TTD_ICON_GRADIENT: Record<'default' | 'brand-days-otw', [string, string]> = {
  default: ['#ECF8FF', '#CEEAFF'],
  'brand-days-otw': ['#FEF8D0', '#FEF2A2'],
};
export const TTD_ICON_EDITOR_SIZE = 140; // px — offsets are stored against the editor's 140px circle
export const TTD_ICON_EXPORT_SIZE = 144; // px at 1x; 2x = 288, 3x = 432

/** Draws the TTD Brand Icon (gradient circle + positioned logo) to a transparent square PNG. */
export async function renderTtdVerticalIcon(ttd: NonNullable<BannerFormData['ttd']>, scaleFactor: number): Promise<Blob> {
  const size = Math.round(TTD_ICON_EXPORT_SIZE * scaleFactor);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const [bottom, top] = TTD_ICON_GRADIENT[ttd.verticalIconTheme || 'default'];
  const grad = ctx.createLinearGradient(0, size, 0, 0);
  grad.addColorStop(0, bottom);
  grad.addColorStop(1, top);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  if (ttd.verticalIconUrl) {
    const res = await fetch(ttd.verticalIconUrl);
    const img = await createImageBitmap(await res.blob());
    const k = size / TTD_ICON_EDITOR_SIZE;
    const box = size * 0.66 * ((ttd.verticalIconScale ?? 100) / 100);
    const fit = Math.min(box / img.width, box / img.height); // object-contain
    const w = img.width * fit;
    const h = img.height * fit;
    const cx = size / 2 + (ttd.verticalIconOffsetX ?? 0) * k;
    const cy = size / 2 + (ttd.verticalIconOffsetY ?? 0) * k;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to export Brand Icon'))), 'image/png'));
}

/** Sanitizes a project name for use as a filesystem/zip entry name. */
export function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || 'DLP Assets';
}

/** downloadDlpZip params for a TTD Promo Asset project: the picked banners + the Brand Icon PNG (when picked). */
export function buildTtdZipParams(ttd: NonNullable<BannerFormData['ttd']>, projectName: string, scaleFactor: number) {
  return {
    projectName,
    scaleFactor,
    banners: buildTtdZipManifest(ttd),
    ...(ttd.verticalIconUrl !== undefined
      ? { extraFiles: async () => [{ path: '04 Brand Icon/Brand Icon.png', blob: await renderTtdVerticalIcon(ttd, scaleFactor) }] }
      : {}),
  };
}
