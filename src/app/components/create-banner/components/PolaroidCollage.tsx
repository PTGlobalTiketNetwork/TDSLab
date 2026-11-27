import { useLayoutEffect, useRef, useState } from 'react';
import { BannerFormData } from '../types';
import { BoundingBox } from './BoundingBox';
import { oneShadeDarker } from '../ColorPicker';

// TTD Promo Asset "Highlight" templates (Figma file Fwm0u7aZDK9tOSi1YPI6VV, node 106:907).
// Each frame is placed by its centre in the Figma frame's own units, so one layout scales to any render size.
type Frame = { cx: number; cy: number; w: number; h: number; rot: number; border: number; shadowY: number };
type Layout = { w: number; h: number; frames: Frame[] }; // frames[i] shows photo i (0 = key visual); default layer order = frame order

const sq = (cx: number, cy: number, s: number, rot: number): Frame => ({ cx, cy, w: s, h: s, rot, border: s * 0.032, shadowY: 1 });
const wide = (cx: number, cy: number, w: number, h: number, rot: number, border: number): Frame => ({ cx, cy, w, h, rot, border, shadowY: 1 });

const LAYOUTS: Record<'2:1' | '3:1' | '5:1', Record<'highlight-2' | 'highlight-3', Layout>> = {
  '2:1': {
    // frame order = photo number (1/2/3); photo 2 sits further back (top), photo 3 sits in front of it (bottom-right)
    'highlight-3': { w: 360, h: 180, frames: [sq(235.97, 100.76, 107.49, 6.88), sq(283.02, 42.53, 104.46, -27.32), wide(319.99, 135.6, 121.82, 88.03, -9.64, 3.95)] },
    'highlight-2': { w: 360, h: 180, frames: [sq(256.17, 63.05, 123.03, 8), wide(301.56, 131.23, 145.5, 105.14, -9.64, 3.95)] },
  },
  '3:1': {
    'highlight-3': { w: 360, h: 120, frames: [sq(232.47, 67.79, 94.33, 6.88), sq(273.75, 16.69, 91.66, -27.32), wide(306.2, 98.36, 106.9, 77.25, -9.64, 3.46)] },
    'highlight-2': { w: 360, h: 120, frames: [sq(258.56, 34.19, 90.2, 8), wide(298.41, 89.82, 107.66, 77.8, -9.64, 3.46)] },
  },
  '5:1': {
    // Positions tuned in Figma (node 107:1092)
    'highlight-3': { w: 1000, h: 200, frames: [sq(136.56, 107.02, 146.4, 9.67), sq(235, 30.71, 154.58, -33.61), wide(289.1, 158.79, 180.27, 130.27, -9.64, 5.84)] },
    'highlight-2': { w: 1000, h: 200, frames: [sq(146.29, 65.91, 168.49, 8), wide(263.48, 139.22, 193.92, 140.13, -15.62, 5.26)] },
  },
};

export const DEFAULT_POLAROID_BG = '#007BFF'; // B400
export const DEFAULT_POLAROID_GRADIENT: NonNullable<BannerFormData['polaroidGradient']> = { angle: 90, stops: [{ color: '#007BFF', pos: 0 }, { color: '#0064D2', pos: 100 }] }; // B400 → B500
export const DEFAULT_CROP = { x: 50, y: 50, scale: 100 };
export const DEFAULT_GROUP = { scale: 100, x: 0, y: 0 };
export const OVERLAY_MAX_OPACITY = 80; // keep the overlay a background accent, never a full photo
export const DEFAULT_OVERLAY: NonNullable<BannerFormData['polaroidOverlay']> = { enabled: true, source: 'upload', opacity: 40, fadeStart: 15, fadeEnd: 60, x: 50, y: 50, scale: 100 };

// Polaroid layout version. v2 swapped highlight-3 frames 1 and 2 (frame order = photo number);
// forms saved before that have photo 2/3 data in each other's slots, so swap them back once.
export const POLAROID_LAYOUT_VERSION = 2;
const migrateCache = new WeakMap<BannerFormData, BannerFormData>();
export function migratePolaroidLayout(form: BannerFormData): BannerFormData {
  if (!form || typeof form !== 'object') return form;
  if ((form.polaroidLayoutVersion ?? 0) >= POLAROID_LAYOUT_VERSION) return form;
  const cached = migrateCache.get(form);
  if (cached) return cached;
  let out: BannerFormData = { ...form, polaroidLayoutVersion: POLAROID_LAYOUT_VERSION };
  if (form.ttdTemplate === 'highlight-3') {
    const swap = <T,>(a: T[] | undefined, i: number, j: number) => {
      if (!a) return a;
      const c = [...a];
      const len = Math.max(c.length, i + 1, j + 1);
      c.length = len;
      [c[i], c[j]] = [c[j], c[i]];
      // trim trailing holes so we don't introduce undefined entries
      while (c.length && c[c.length - 1] === undefined) c.pop();
      return c;
    };
    out = {
      ...out,
      polaroidImages: swap(form.polaroidImages, 0, 1),
      polaroidCrops: swap(form.polaroidCrops, 1, 2),
      polaroidRotations: swap(form.polaroidRotations, 1, 2),
      // Missing order meant the old default [0,1,2] in old frames, i.e. [0,2,1] in new photo indices.
      polaroidOrder: (form.polaroidOrder ?? [0, 1, 2]).map((i) => (i === 1 ? 2 : i === 2 ? 1 : i)),
    };
  }
  migrateCache.set(form, out);
  return out;
}
const savedCache = new WeakMap<BannerFormData, BannerFormData>();
// Applies migratePolaroidLayout to a saved banner's form_data, including nested TTD / DLP sub-forms.
export function migrateSavedFormData<T extends BannerFormData | undefined | null>(fd: T): T {
  if (!fd || typeof fd !== 'object') return fd;
  const hit = savedCache.get(fd as BannerFormData);
  if (hit) return hit as T;
  const m = (f?: BannerFormData) => (f ? migratePolaroidLayout(f) : f);
  let out = migratePolaroidLayout(fd as BannerFormData);
  if (out.ttd) {
    const ttd: any = { ...out.ttd };
    for (const k of Object.keys(ttd)) if (ttd[k] && typeof ttd[k] === 'object' && 'bannerRatio' in ttd[k]) ttd[k] = m(ttd[k]);
    out = { ...out, ttd };
  }
  if (out.dlp) {
    const eps: any = { ...(out.dlp.entryPoints ?? {}) };
    for (const k of Object.keys(eps)) eps[k] = m(eps[k]);
    out = { ...out, dlp: { ...out.dlp, entryPoints: eps, header: out.dlp.header && { ...out.dlp.header, desktopForm: m(out.dlp.header.desktopForm), mobileForm: m(out.dlp.header.mobileForm) } } };
  }
  savedCache.set(fd as BannerFormData, out);
  return out as T;
}

export const isPolaroidTemplate = (f: Pick<BannerFormData, 'ttdTemplate'>) => f.ttdTemplate === 'highlight-2' || f.ttdTemplate === 'highlight-3';
export const polaroidCount = (f: Pick<BannerFormData, 'ttdTemplate'>) => (f.ttdTemplate === 'highlight-3' ? 3 : f.ttdTemplate === 'highlight-2' ? 2 : 0);
// Layer order, front first, as frame indexes; falls back to the Figma order when it doesn't fit the current count.
export const polaroidOrder = (f: Pick<BannerFormData, 'ttdTemplate' | 'polaroidOrder'>) => {
  const n = polaroidCount(f);
  const o = (f.polaroidOrder ?? []).filter((i) => i < n);
  return o.length === n && new Set(o).size === n ? o : Array.from({ length: n }, (_, i) => i);
};

export const gradientCss = (g: NonNullable<BannerFormData['polaroidGradient']>) =>
  `linear-gradient(${g.angle}deg, ${[...g.stops].sort((a, b) => a.pos - b.pos).map((s) => `${s.color} ${s.pos}%`).join(', ')})`;
// 5:1 has the text on the right (photos on the left), so its gradient runs the other way: the colour that sits behind
// the text on 2:1/3:1 (stop 1, left) sits behind the text on 5:1 too (right).
export const polaroidBackground = (f: Pick<BannerFormData, 'polaroidBg' | 'polaroidBgMode' | 'polaroidGradient' | 'bannerRatio'>) => {
  if (f.polaroidBgMode !== 'gradient') return f.polaroidBg || DEFAULT_POLAROID_BG;
  const g = f.polaroidGradient ?? DEFAULT_POLAROID_GRADIENT;
  const mirrored = f.bannerRatio === 'Desktop (5:1)' || f.bannerRatio === 'Desktop (4:1)';
  return gradientCss(mirrored ? { ...g, stops: g.stops.map((st) => ({ ...st, pos: 100 - st.pos })) } : g);
};

/** Auto text colour inside the unit badge (%, k, rb…): one token darker than the banner's first background colour
 *  (b400 background → b500 text). The user can still pick their own colour. */
export const unitBadgeAutoColor = (f: BannerFormData) => oneShadeDarker(bannerBaseColor(f));

/** First colour of the banner's background: the Highlight template's solid colour / first gradient stop, otherwise
 *  the key-visual overlay colour (Overlay 1). */
export const bannerBaseColor = (f: BannerFormData) => {
  if (isPolaroidTemplate(f)) {
    if (f.polaroidBgMode === 'gradient') {
      const g = f.polaroidGradient ?? DEFAULT_POLAROID_GRADIENT;
      return [...g.stops].sort((a, b) => a.pos - b.pos)[0]?.color ?? DEFAULT_POLAROID_BG;
    }
    return f.polaroidBg || DEFAULT_POLAROID_BG;
  }
  return (f.bannerRatio === 'Desktop (5:1)' || f.bannerRatio === 'Desktop (4:1)' ? f.desktopOverlayColor : f.overlayColor) || '#000000';
};

const ratioKey = (ratio: BannerFormData['bannerRatio']) => (ratio === 'Landscape (3:1)' ? '3:1' : ratio === 'Desktop (5:1)' || ratio === 'Desktop (4:1)' ? '5:1' : '2:1');
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

interface Props {
  formData: BannerFormData;
  keyVisualUrl: string | null; // photo of frame 0
  onFormChange?: (updates: Partial<BannerFormData>) => void; // editor preview: bounding box for the group, double-click a photo to reposition it
  /** Invisible copy that only carries the bounding box / photo drag. The banner stacks it above its content block,
   *  so dragging a photo moves the polaroids even where they sit under the (draggable) text, while the visible
   *  polaroids stay behind the text. */
  handlesOnly?: boolean;
  /** Show a small "2"/"3" badge on the stacked/overlapping photos so they're easy to tell apart in every in-app
   *  preview (editor, dashboard summary cards, etc). Off only for the actual exported banner image. */
  showNumberBadges?: boolean;
}

// Group offset is stored in ‰ of the banner (so it means the same on every render size).
// X: the polaroids may reach into the text side, but cover at most 65% of the banner width — on 2:1/3:1 the group's
// left edge stays right of 35%, on 5:1 (text on the right) its right edge stays left of 65%.
const MAX_COVER = 0.65;
export const GROUP_Y_LIMIT = 250; // ±25% of the banner height
export const frameAspect = (formData: BannerFormData, frame: number) => {
  const f = LAYOUTS[ratioKey(formData.bannerRatio)][formData.ttdTemplate === 'highlight-3' ? 'highlight-3' : 'highlight-2'].frames[frame];
  return f ? f.w / f.h : 1;
};
/** Image placement inside a polaroid frame. The full image covers the frame (zoomed by `scale`); stored X/Y run
 *  CROP_MIN…CROP_MAX with 50 = centred. 0–100 pans across whatever sticks out (0 = left/top edge of the image,
 *  100 = right/bottom edge, frame always filled); beyond that the image slides further, up to half a frame. */
export const CROP_MIN = -25;
export const CROP_MAX = 125;
const OVERSHOOT = 2; // % of the frame per stored unit past 0/100 (25 units → 50% of the frame)
// UI shows the stored value as -150…150 % around the centre
export const cropToUi = (v: number) => Math.round((v - 50) * 2);
export const uiToCrop = (v: number) => 50 + v / 2;
type Crop = { x: number; y: number; scale: number; flipH?: boolean; flipV?: boolean };
export const cropStyle = (c: Crop): React.CSSProperties => {
  const px = clamp(c.x, 0, 100);
  const py = clamp(c.y, 0, 100);
  const left = ((100 - c.scale) * px) / 100 - (c.x - px) * OVERSHOOT;
  const top = ((100 - c.scale) * py) / 100 - (c.y - py) * OVERSHOOT;
  return {
    position: 'absolute',
    width: `${c.scale}%`,
    height: `${c.scale}%`,
    left: `${left}%`,
    top: `${top}%`,
    // Flip mirrors what the frame shows (around the frame's centre, not the image's), so the crop stays put
    ...(c.flipH || c.flipV ? {
      transform: `scale(${c.flipH ? -1 : 1}, ${c.flipV ? -1 : 1})`,
      transformOrigin: `${((50 - left) / c.scale) * 100}% ${((50 - top) / c.scale) * 100}%`,
    } : {}),
    maxWidth: 'none',
    objectFit: 'cover',
    objectPosition: `${px}% ${py}%`,
  };
};

// Natural image sizes, so a drag can move the image exactly with the pointer
const naturalSizes = new Map<string, { w: number; h: number }>();
export const naturalSize = (url: string) => {
  const known = naturalSizes.get(url);
  if (known) return known;
  const img = new Image();
  img.onload = () => naturalSizes.set(url, { w: img.naturalWidth, h: img.naturalHeight });
  img.src = url;
  return null;
};

/** Drag-to-pan for a photo inside a frame of `frameW`×`frameH` on-screen px: returns the new X/Y for a pointer delta. */
export const panCrop = (url: string | null | undefined, crop: Crop, frameW: number, frameH: number, dx: number, dy: number) => {
  // A flipped image moves the other way under the pointer
  if (crop.flipH) dx = -dx;
  if (crop.flipV) dy = -dy;
  const s = crop.scale / 100;
  const boxW = frameW * s;
  const boxH = frameH * s;
  // Below 100% the image box is smaller than the frame: 0–100 slides the whole box across the free space instead,
  // so it moves with the pointer (not against it)
  const shrunk = crop.scale < 100;
  if (shrunk) { dx = -dx; dy = -dy; }
  const nat = url && !shrunk ? naturalSize(url) : null;
  const cover = nat ? Math.max(boxW / nat.w, boxH / nat.h) : 1;
  // how far the image can travel per axis (px on screen); unknown size → assume only the zoom overflow
  const travelX = Math.max(1, shrunk ? frameW - boxW : nat ? nat.w * cover - frameW : boxW - frameW);
  const travelY = Math.max(1, shrunk ? frameH - boxH : nat ? nat.h * cover - frameH : boxH - frameH);
  // Work in on-screen pixels so the image follows the pointer 1:1 across the whole range (no jump at 0/100):
  // 0–100 maps onto the image's own travel, past that each unit is OVERSHOOT % of the frame.
  const toPx = (v: number, travel: number, frame: number) =>
    v < 0 ? (v * frame * OVERSHOOT) / 100 : v > 100 ? travel + ((v - 100) * frame * OVERSHOOT) / 100 : (v / 100) * travel;
  const fromPx = (p: number, travel: number, frame: number) =>
    p < 0 ? (p * 100) / (frame * OVERSHOOT) : p > travel ? 100 + ((p - travel) * 100) / (frame * OVERSHOOT) : (p / travel) * 100;
  const step = (v: number, d: number, travel: number, frame: number) =>
    Math.round(clamp(fromPx(toPx(v, travel, frame) - d, travel, frame), CROP_MIN, CROP_MAX) * 10) / 10;
  return { x: step(crop.x, dx, travelX, frameW), y: step(crop.y, dy, travelY, frameH) };
};
export const MAX_TILT = 8;
/** Uploaded photo zoom range (%). Below 100 the photo no longer fills its frame and the frame's grey shows around it. */
export const PHOTO_SCALE_MIN = 75;
export const PHOTO_SCALE_MAX = 300;

// Voucher decorations (Figma 115-3009): one shape, placed by its centre (% of banner), height in % of banner height
export const VOUCHER_PATH = 'M49.0916 24.2206C38.6262 40.0118 32.0027 50.4385 14.157 53.3117C13.4872 53.4195 12.8006 53.2026 12.3061 52.7381L9.88069 50.46C9.075 49.7032 9.61053 48.3508 10.7159 48.3508C11.808 48.3508 12.3499 47.0259 11.5708 46.2606L7.49055 42.2525C7.07191 41.8413 6.50854 41.6109 5.92171 41.6109H2.68975C1.8979 41.6109 1.16496 41.1926 0.762204 40.5108L0.311731 39.7483C-0.395309 38.5514 0.15122 37.0078 1.43806 36.4821C24.767 26.9509 20.5045 17.3703 23.0285 1.76196C23.3112 0.0140691 25.4403 -0.594274 26.6736 0.676217L29.83 3.92804C30.1748 4.28325 30.3922 4.74271 30.448 5.23457L31.204 11.8869C31.2772 12.531 31.626 13.1117 32.1601 13.4789L39.7841 18.7204C40.7081 19.3558 41.9695 19.1439 42.6354 18.2415C43.4186 17.1801 44.9795 17.1068 45.8587 18.0901L48.8959 21.4869C49.5753 22.2468 49.6547 23.3709 49.0916 24.2206Z';
const VOUCHER_VB = { w: 49.4654, h: 53.3389 };
export const DEFAULT_VOUCHER_COLOR = '#FFD300';
type VoucherSpot = { x: number; y: number; h: number; rot: number; flipY?: boolean };
const VOUCHER_SPOTS: Record<'2:1' | '3:1' | '5:1', { top: VoucherSpot; bottom: VoucherSpot }> = {
  '2:1': { top: { x: 46.8, y: -0.1, h: 21, rot: 167.89, flipY: true }, bottom: { x: 54.7, y: 94, h: 31, rot: 5.48 } },
  '3:1': { top: { x: 48.1, y: -0.7, h: 31, rot: 167.89, flipY: true }, bottom: { x: 44.5, y: 95.8, h: 24, rot: 5.48 } },
  '5:1': { top: { x: 43.2, y: -2.1, h: 27.5, rot: 167.89, flipY: true }, bottom: { x: 97.1, y: 86.9, h: 56, rot: 12.11 } },
}; // deg each card can be rotated away from its Figma angle

export function groupGeometry(formData: BannerFormData, scale: number) {
  const layout = LAYOUTS[ratioKey(formData.bannerRatio)][formData.ttdTemplate === 'highlight-3' ? 'highlight-3' : 'highlight-2'];
  // Bounds of the rotated frames (Figma px) — the group box the bounding box outlines
  const ext = layout.frames.map((f) => {
    const r = (f.rot * Math.PI) / 180;
    const hw = (f.w * Math.abs(Math.cos(r)) + f.h * Math.abs(Math.sin(r))) / 2;
    const hh = (f.w * Math.abs(Math.sin(r)) + f.h * Math.abs(Math.cos(r))) / 2;
    return { l: f.cx - hw, r: f.cx + hw, t: f.cy - hh, b: f.cy + hh };
  });
  const box = { l: Math.min(...ext.map((e) => e.l)), t: Math.min(...ext.map((e) => e.t)), r: Math.max(...ext.map((e) => e.r)), b: Math.max(...ext.map((e) => e.b)) };
  const s = scale / 100;
  const cx = (box.l + box.r) / 2;
  const left = cx - ((box.r - box.l) / 2) * s; // scaled edges, before the offset
  const right = cx + ((box.r - box.l) / 2) * s;
  const toPermille = (px: number) => Math.round((px / layout.w) * 1000);
  const textOnRight = ratioKey(formData.bannerRatio) === '5:1';
  const xRange: [number, number] = textOnRight
    ? [toPermille(-right), toPermille(layout.w * MAX_COVER - right)]
    : [toPermille(layout.w * (1 - MAX_COVER) - left), toPermille(layout.w - left)];
  return { layout, box, xRange };
}

/** Background + tilted polaroid photos. Fills its (positioned) parent; sits where the key visual and overlay usually go. */
export function PolaroidCollage({ formData, keyVisualUrl, onFormChange, handlesOnly, showNumberBadges = true }: Props) {
  const layout = LAYOUTS[ratioKey(formData.bannerRatio)][formData.ttdTemplate === 'highlight-3' ? 'highlight-3' : 'highlight-2'];
  const ref = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(1); // element px per Figma px
  const [canvasW, setCanvasW] = useState(layout.w); // the banner's own canvas px ([data-canvas-w]), used by the bounding box
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth) setK(el.clientWidth / layout.w);
      const c = el.closest('[data-canvas-w]') as HTMLElement | null;
      setCanvasW(Number(c?.dataset.canvasW) || el.clientWidth || layout.w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.w]);

  const srcs = [keyVisualUrl, ...(formData.polaroidImages ?? [])];
  srcs.forEach((u) => u && naturalSize(u)); // warm the size cache so the first drag already follows the pointer exactly
  const order = polaroidOrder(formData);
  const crops = formData.polaroidCrops ?? [];
  const group = formData.polaroidGroup ?? DEFAULT_GROUP;
  // The bounding box reports X and Y in two calls per pointer move; chain them through a ref so the second doesn't undo the first
  const latestGroup = useRef(group);
  latestGroup.current = group;
  const setGroup = (patch: Partial<typeof DEFAULT_GROUP>) => {
    const next = { ...latestGroup.current, ...patch };
    latestGroup.current = next;
    const [min, max] = groupGeometry(formData, next.scale).xRange;
    onFormChange?.({ polaroidGroup: { ...next, x: clamp(next.x, min, max) } });
  };

  const { box, xRange } = groupGeometry(formData, group.scale);
  const gx = clamp(group.x, xRange[0], xRange[1]); // stored value may predate a scale change
  const gy = clamp(group.y, -GROUP_Y_LIMIT, GROUP_Y_LIMIT); // or an older, wider Y limit

  // Drag a photo (after double-clicking it) to move its focus point, like panning a cropped image.
  // Drag a photo in the preview to move its focus point, like panning a cropped image.
  const startPan = (e: React.PointerEvent<HTMLDivElement>, frame: number) => {
    if (!onFormChange) return;
    e.preventDefault();
    e.stopPropagation();
    const root = ref.current!;
    const ratio = root.getBoundingClientRect().width / Math.max(1, root.offsetWidth); // on-screen px per element px
    const frameW = e.currentTarget.clientWidth * ratio; // inside the white border
    const frameH = e.currentTarget.clientHeight * ratio;
    const startCrop = crops[frame] ?? DEFAULT_CROP;
    const start = { px: e.clientX, py: e.clientY };
    let raf = 0;
    let last: PointerEvent | null = null;
    const move = (ev: PointerEvent) => { last = ev; if (!raf) raf = requestAnimationFrame(apply); }; // one form update per frame
    const apply = () => {
      raf = 0;
      const ev = last!;
      const next = Array.from({ length: Math.max(3, crops.length) }, (_, i) => crops[i] ?? DEFAULT_CROP);
      next[frame] = { ...startCrop, ...panCrop(srcs[frame], startCrop, frameW, frameH, ev.clientX - start.px, ev.clientY - start.py) };
      onFormChange({ polaroidCrops: next });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const canvasH = (canvasW * layout.h) / layout.w;
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none" style={{ background: handlesOnly ? 'transparent' : polaroidBackground(formData) }}>
      {/* Overlay image: between the background and the polaroids, fading out towards the text side */}
      {!handlesOnly && (() => {
        const o = formData.polaroidOverlay;
        const src = o?.enabled ? (o.source === 'photo1' ? keyVisualUrl : o.url) : null;
        if (!o || !src) return null;
        const towardsText = ratioKey(formData.bannerRatio) === '5:1' ? 'to right' : 'to left'; // starts at the photo side
        const mask = `linear-gradient(${towardsText}, #000 ${o.fadeStart}%, transparent ${Math.max(o.fadeStart + 1, o.fadeEnd)}%)`;
        return (
          <div className="absolute inset-0 overflow-hidden" style={{ opacity: Math.min(o.opacity, OVERLAY_MAX_OPACITY) / 100, WebkitMaskImage: mask, maskImage: mask }}>
            <img src={src} alt="" crossOrigin="anonymous" draggable={false} className="block select-none pointer-events-none" style={cropStyle(o)} />
          </div>
        );
      })()}
      {handlesOnly && onFormChange && formData.polaroidOverlay?.enabled && (() => {
        const o = { ...DEFAULT_OVERLAY, ...formData.polaroidOverlay };
        const src = o.source === 'photo1' ? keyVisualUrl : o.url;
        if (!src) return null;
        const reach = Math.min(o.fadeEnd, 45); // % of the width from the photo side; never over the text column
        const onRight = ratioKey(formData.bannerRatio) !== '5:1';
        const startOverlayPan = (e: React.PointerEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
          const r = ref.current!.getBoundingClientRect();
          const start = { px: e.clientX, py: e.clientY, crop: { x: o.x, y: o.y, scale: o.scale, flipH: o.flipH, flipV: o.flipV } };
          let raf = 0;
          let last: PointerEvent | null = null;
          const apply = () => {
            raf = 0;
            const ev = last!;
            onFormChange({ polaroidOverlay: { ...o, ...panCrop(src, start.crop, r.width, r.height, ev.clientX - start.px, ev.clientY - start.py) } });
          };
          const move = (ev: PointerEvent) => { last = ev; if (!raf) raf = requestAnimationFrame(apply); };
          const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
          window.addEventListener('pointermove', move);
          window.addEventListener('pointerup', up);
        };
        return (
          <div
            className="absolute top-0 bottom-0 cursor-move"
            style={{ [onRight ? 'right' : 'left']: 0, width: `${reach}%`, pointerEvents: 'auto', touchAction: 'none' }}
            onPointerDown={startOverlayPan}
            title="Drag to move the overlay image"
          />
        );
      })()}
      <BoundingBox
        enabled={false} // group is moved/scaled from the form only
        className="absolute"
        style={{
          left: box.l * k, top: box.t * k, width: (box.r - box.l) * k, height: (box.b - box.t) * k,
          transform: `translate(${(gx / 1000) * layout.w * k}px, ${(gy / 1000) * layout.h * k}px) scale(${group.scale / 100})`,
          transformOrigin: 'center',
        }}
        selfScale={group.scale / 100}
        offsetX={gx} offsetXUnit={1000 / canvasW} offsetXMin={xRange[0]} offsetXMax={xRange[1]}
        onOffsetXChange={(v) => setGroup({ x: v })}
        offsetY={gy} offsetUnit={1000 / canvasH} offsetMin={-GROUP_Y_LIMIT} offsetMax={GROUP_Y_LIMIT}
        onOffsetChange={(v) => setGroup({ y: v })}
        scale={group.scale} scaleMin={50} scaleMax={200}
        onScaleChange={(v) => setGroup({ scale: v })}
      >
        {/* Back to front by layer order (front first in polaroidOrder) */}
        {[...order].reverse().map((i) => {
          const f = layout.frames[i];
          const crop = crops[i] ?? DEFAULT_CROP;
          const rotDeg = f.rot + clamp(formData.polaroidRotations?.[i] ?? 0, -MAX_TILT, MAX_TILT);
          return (
            <div
              key={i}
              className={`absolute overflow-hidden ${onFormChange ? 'cursor-move hover:outline hover:outline-2 hover:outline-[#007BFF]' : ''}`}
              onPointerDown={(e) => startPan(e, i)}
              title={onFormChange ? 'Drag to reposition the photo' : undefined}
              style={{
                left: (f.cx - f.w / 2 - box.l) * k,
                top: (f.cy - f.h / 2 - box.t) * k,
                width: f.w * k,
                height: f.h * k,
                transform: `rotate(${rotDeg}deg)`,
                border: `${f.border * k}px solid ${handlesOnly ? 'transparent' : '#FFFFFF'}`,
                background: handlesOnly ? 'transparent' : '#D9D9D9',
                boxShadow: handlesOnly ? undefined : `0 ${f.shadowY * f.border * k}px ${f.border * 1.6 * k}px rgba(0,0,0,0.3)`,
                pointerEvents: onFormChange ? 'auto' : undefined,
                boxSizing: 'border-box',
                touchAction: 'none',
              }}
            >
              {srcs[i] && !handlesOnly && (
                <img
                  src={srcs[i]!}
                  alt={`Photo ${i + 1}`}
                  crossOrigin="anonymous"
                  draggable={false}
                  className="block select-none pointer-events-none"
                  style={cropStyle(crop)}
                />
              )}
              {/* Helps tell the stacked/overlapping photos apart */}
              {showNumberBadges && !handlesOnly && !srcs[i] && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-black/60 text-white text-[14px] font-bold leading-none"
                    style={{ transform: `rotate(${-rotDeg}deg)` }}
                  >
                    {i + 1}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </BoundingBox>
      {/* Voucher decorations: above the photos, below the logo / text (the whole collage sits under those) */}
      {!handlesOnly && (['top', 'bottom'] as const).map((pos) => {
        const v = formData.polaroidVouchers?.[pos];
        if (!v?.enabled) return null;
        const spot = VOUCHER_SPOTS[ratioKey(formData.bannerRatio)][pos];
        const hPx = ((spot.h * layout.h) / 100) * k * ((v.scale ?? 100) / 100);
        const wPx = (hPx * VOUCHER_VB.w) / VOUCHER_VB.h;
        return (
          <svg
            key={pos}
            viewBox={`0 0 ${VOUCHER_VB.w} ${VOUCHER_VB.h}`}
            width={wPx}
            height={hPx}
            className="absolute pointer-events-none"
            style={{
              left: `calc(${spot.x + (v.x ?? 0)}% - ${wPx / 2}px)`,
              top: `calc(${spot.y + (v.y ?? 0)}% - ${hPx / 2}px)`,
              transform: `rotate(${spot.rot + (v.rotate ?? 0)}deg)${spot.flipY ? ' scaleY(-1)' : ''}`,
              transformOrigin: 'center',
              overflow: 'visible',
            }}
          >
            <path d={VOUCHER_PATH} fill={v.color || DEFAULT_VOUCHER_COLOR} />
          </svg>
        );
      })}
    </div>
  );
}
