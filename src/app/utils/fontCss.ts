// Font URLs used in @font-face declarations
const FONT_URLS = [
  { family: 'Tiket Odyssey Text', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts/TiketOdysseyText-Regular.woff2', weight: 400 },
  { family: 'Tiket Odyssey Text', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts/TiketOdysseyText-SemiBold.woff2', weight: 600 },
  { family: 'Tiket Odyssey Text', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts/TiketOdysseyText-Bold.woff2', weight: 700 },
  { family: 'Tiket Odyssey Text', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts/TiketOdysseyText-ExtraBold.woff2', weight: 800 },
  { family: 'Tiket Odyssey Display', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts_display/TiketOdysseyDisplay-Regular.woff2', weight: 400 },
  { family: 'Tiket Odyssey Display', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts_display/TiketOdysseyDisplay-SemiBold.woff2', weight: 600 },
  { family: 'Tiket Odyssey Display', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts_display/TiketOdysseyDisplay-Bold.woff2', weight: 700 },
  { family: 'Tiket Odyssey Display', url: 'https://rrrcbsjmcwlkndolwgst.supabase.co/storage/v1/object/public/fonts_display/TiketOdysseyDisplay-ExtraBold.woff2', weight: 800 },
];

// Legacy export with URL-based @font-face (kept for backward compatibility in non-capture contexts)
export const fontEmbedCSS = FONT_URLS.map(f => `
@font-face {
  font-family: '${f.family}';
  src: url('${f.url}') format('woff2');
  font-weight: ${f.weight};
  font-style: normal;
}`).join('\n');

// --- Base64 Embedded Font CSS for html-to-image capture ---
// html-to-image renders HTML inside an SVG foreignObject as a blob URL.
// External font URLs cannot be fetched from within that blob context,
// so we must inline the font data as base64 data URIs.

let _cachedBase64CSS: string | null = null;
let _cachePromise: Promise<string> | null = null;

async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${url} (${response.status})`);
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Returns @font-face CSS with fonts embedded as base64 data URIs.
 * Results are cached after the first call so fonts are only fetched once per session.
 * This MUST be used for any html-to-image / toPng capture to ensure fonts render correctly.
 */
export async function getBase64FontCSS(): Promise<string> {
  if (_cachedBase64CSS) return _cachedBase64CSS;
  if (_cachePromise) return _cachePromise;

  _cachePromise = (async () => {
    try {
      const results = await Promise.all(
        FONT_URLS.map(async (f) => {
          try {
            const dataUri = await fetchFontAsBase64(f.url);
            return `
@font-face {
  font-family: '${f.family}';
  src: url('${dataUri}') format('woff2');
  font-weight: ${f.weight};
  font-style: normal;
}`;
          } catch (err) {
            console.warn(`Failed to embed font ${f.family} ${f.weight}:`, err);
            // Fallback to URL-based (better than nothing)
            return `
@font-face {
  font-family: '${f.family}';
  src: url('${f.url}') format('woff2');
  font-weight: ${f.weight};
  font-style: normal;
}`;
          }
        })
      );
      _cachedBase64CSS = results.join('\n');
      return _cachedBase64CSS;
    } catch (err) {
      console.error('Failed to build base64 font CSS:', err);
      _cachePromise = null; // Allow retry on next call
      return fontEmbedCSS; // Fallback to URL-based
    }
  })();

  return _cachePromise;
}
