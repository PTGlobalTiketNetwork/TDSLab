import { Switch } from '../../ui/switch';
import { Dialog, DialogContent, DialogTitle } from '../../ui/dialog';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, FlipHorizontal2, FlipVertical2, GripVertical, Loader2, Maximize2, RotateCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { BannerFormData } from '../types';
import { ColorPicker } from '../ColorPicker';
import { Slider } from '../../ui/slider';
import { ImageInputSelector } from '../../inputs/ImageInputSelector';
import { BannerService } from '../../../../services/bannerService';
import { LinearGradientEditor } from './LinearGradientEditor';
import { DEFAULT_CROP, DEFAULT_GROUP, DEFAULT_OVERLAY, OVERLAY_MAX_OPACITY, GROUP_Y_LIMIT, MAX_TILT, CropImg, cropToUi, uiToCrop, panCrop, frameAspect, groupGeometry, DEFAULT_POLAROID_BG, DEFAULT_POLAROID_GRADIENT, polaroidOrder, PHOTO_SCALE_MIN, PHOTO_SCALE_MAX, DEFAULT_VOUCHER_COLOR } from './PolaroidCollage';

interface Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
}

/**
 * "Visual & Logo" fields for the TTD Highlight templates: background (solid or linear gradient), the collage as a group
 * (scale + X/Y) and one image per polaroid. Photos are listed front layer first; drag a row (or use the arrows) to change
 * which photo sits in front. Source 0 is the regular key visual (keyVisualFile/keyVisualUrl), so it survives switching
 * back to the Gradient template.
 */
export function PolaroidVisualFields({ formData, onChange }: Props) {
  const order = polaroidOrder(formData);
  const [uploading, setUploading] = useState<number | null>(null);
  const [imgDragFrom, setImgDragFrom] = useState<number | null>(null);
  const [imgDragOver, setImgDragOver] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const keyVisualPreview = useMemo(
    () => (formData.keyVisualFile instanceof Blob ? URL.createObjectURL(formData.keyVisualFile) : formData.keyVisualUrl || null),
    [formData.keyVisualFile, formData.keyVisualUrl],
  );
  useEffect(() => () => { if (keyVisualPreview?.startsWith('blob:')) URL.revokeObjectURL(keyVisualPreview); }, [keyVisualPreview]);

  const srcOf = (src: number) => (src === 0 ? keyVisualPreview : formData.polaroidImages?.[src - 1] || null);
  const setExtra = (src: number, url: string) => {
    const next = [...(formData.polaroidImages ?? [])];
    next[src - 1] = url;
    onChange({ polaroidImages: next });
  };
  // Photos 2 and 3 are uploaded right away, so the form only ever holds URLs for them.
  const pickExtra = async (src: number, file: File | null, url?: string) => {
    if (url) { setExtra(src, url); return; }
    if (!file) return;
    setUploading(src);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const up = await BannerService.uploadImage(file, `Assets/ImageBG/${crypto.randomUUID()}.${ext}`);
      setExtra(src, up.url);
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= order.length) return;
    const next = [...order];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ polaroidOrder: next });
  };

  // Swap which uploaded image sits in which photo slot (drag thumbnail onto thumbnail), leaving each slot's
  // own crop/scale/rotation/layer order untouched — only the picture itself moves.
  const getImage = (src: number): { file?: File | null; url?: string } =>
    src === 0
      ? { file: formData.keyVisualFile ?? null, url: formData.keyVisualFile ? undefined : formData.keyVisualUrl }
      : { url: formData.polaroidImages?.[src - 1] || undefined };
  const swapImages = (a: number, b: number) => {
    if (a === b) return;
    const imgA = getImage(a);
    const imgB = getImage(b);
    const updates: Partial<BannerFormData> = {};
    const apply = (src: number, img: { file?: File | null; url?: string }) => {
      if (src === 0) {
        updates.keyVisualFile = img.file ?? null;
        updates.keyVisualUrl = img.file ? undefined : img.url;
      } else {
        const next = updates.polaroidImages ? [...updates.polaroidImages] : [...(formData.polaroidImages ?? [])];
        next[src - 1] = img.url || '';
        updates.polaroidImages = next;
      }
    };
    apply(a, imgB);
    apply(b, imgA);
    onChange(updates);
  };

  const crop = (src: number) => formData.polaroidCrops?.[src] ?? DEFAULT_CROP;
  const setCrop = (src: number, patch: Partial<NonNullable<BannerFormData['polaroidCrops']>[number]>) => {
    const next = Array.from({ length: Math.max(3, formData.polaroidCrops?.length ?? 0) }, (_, i) => formData.polaroidCrops?.[i] ?? DEFAULT_CROP);
    next[src] = { ...next[src], ...patch };
    onChange({ polaroidCrops: next });
  };
  const overlay = { ...DEFAULT_OVERLAY, enabled: false, ...formData.polaroidOverlay };
  const setOverlay = (patch: Partial<typeof overlay>) => onChange({ polaroidOverlay: { ...overlay, ...patch } });
  // Own overlay image: uploaded right away, like photos 2 and 3
  const pickOverlay = async (file: File | null, url?: string) => {
    if (url) { setOverlay({ url }); return; }
    if (!file) return;
    setUploading(-1);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const up = await BannerService.uploadImage(file, `Assets/ImageBG/${crypto.randomUUID()}.${ext}`);
      setOverlay({ url: up.url });
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(null);
    }
  };
  const panOverlayThumb = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || !overlay.url) return;
    e.preventDefault();
    const { clientWidth: w, clientHeight: h } = e.currentTarget;
    const start = { px: e.clientX, py: e.clientY, crop: { x: overlay.x, y: overlay.y, scale: overlay.scale, flipH: overlay.flipH, flipV: overlay.flipV } };
    let raf = 0;
    let last: PointerEvent | null = null;
    const apply = () => { raf = 0; const ev = last!; setOverlay(panCrop(overlay.url, start.crop, w, h, ev.clientX - start.px, ev.clientY - start.py)); };
    const move = (ev: PointerEvent) => { last = ev; if (!raf) raf = requestAnimationFrame(apply); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const group = formData.polaroidGroup ?? DEFAULT_GROUP;
  const { xRange } = groupGeometry(formData, group.scale);
  // Scaling up moves the group's edge, so keep X inside the allowed range afterwards
  const setGroup = (patch: Partial<typeof DEFAULT_GROUP>) => {
    const next = { ...group, ...patch };
    const [min, max] = groupGeometry(formData, next.scale).xRange;
    onChange({ polaroidGroup: { ...next, x: Math.min(max, Math.max(min, next.x)) } });
  };

  // Flip left–right / top–bottom, same buttons as the key visual's in Background Settings
  const flipButtons = (v: { flipH?: boolean; flipV?: boolean }, set: (p: { flipH?: boolean; flipV?: boolean }) => void) => (
    <div className="flex items-center gap-[8px]">
      {([['flipH', 'Flip horizontal', FlipHorizontal2], ['flipV', 'Flip vertical', FlipVertical2]] as const).map(([k, title, Icon]) => (
        <button
          key={k}
          type="button"
          onClick={() => set({ [k]: !v[k] })}
          className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${v[k] ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
          title={title}
        >
          <Icon className="w-3.5 h-3.5" />
          {k === 'flipH' ? 'Flip H' : 'Flip V'}
        </button>
      ))}
    </div>
  );

  const slider = (label: string, value: number, unit: string, min: number, max: number, def: number, set: (v: number) => void) => (
    <div className="flex flex-col gap-[6px]">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#303135]">{label}</span>
        <div className="flex items-center gap-[8px]">
          <span className="text-[13px] font-semibold text-[#007BFF]">{Math.round(value)}{unit}</span>
          <button type="button" onClick={() => set(def)} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
        </div>
      </div>
      <Slider min={min} max={max} step={unit === '%' && max <= 100 && min < 0 ? 0.5 : 1} value={[value]} onValueChange={([v]) => set(v)} className="w-full" />
    </div>
  );

  const photoRow = (src: number, layer: number) => {
    const url = srcOf(src);
    const c = crop(src);
    return (
      <div
        key={src}
        onDragOver={(e) => { if (imgDragFrom !== null) { e.preventDefault(); setImgDragOver(src); } }}
        onDragLeave={() => setImgDragOver((v) => (v === src ? null : v))}
        onDrop={(e) => { e.preventDefault(); if (imgDragFrom !== null) swapImages(imgDragFrom, src); setImgDragFrom(null); setImgDragOver(null); }}
        className={`flex flex-col gap-[12px] rounded-[10px] border p-[12px] bg-white transition-colors ${imgDragOver === src && imgDragFrom !== src ? 'border-[#007BFF] bg-[#f2f8ff]' : 'border-[#e9ebef]'} ${imgDragFrom === src ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-[8px]">
          <GripVertical
            size={16}
            className="text-[#9EA0A5] cursor-grab shrink-0"
            draggable={!!url}
            onDragStart={(e) => { if (!url) { e.preventDefault(); return; } setImgDragFrom(src); e.dataTransfer.effectAllowed = 'move'; }}
            onDragEnd={() => { setImgDragFrom(null); setImgDragOver(null); }}
            title="Drag onto another photo to swap the uploaded image"
          />
          <span className="text-[13px] font-bold text-[#303135] flex-1">Photo {src + 1} <span className="font-normal text-[#71747d]">· {layer === 0 ? 'front' : layer === order.length - 1 ? 'back' : 'middle'}</span></span>
          <button type="button" onClick={() => move(layer, layer - 1)} disabled={layer === 0} className="p-[4px] rounded-[6px] text-[#5e6066] hover:bg-[#f5f6fa] disabled:opacity-30" title="Bring forward"><ChevronUp size={14} /></button>
          <button type="button" onClick={() => move(layer, layer + 1)} disabled={layer === order.length - 1} className="p-[4px] rounded-[6px] text-[#5e6066] hover:bg-[#f5f6fa] disabled:opacity-30" title="Send backward"><ChevronDown size={14} /></button>
        </div>
        {url ? (
          <div className="flex gap-[12px]">
            <div
              className="relative w-[120px] shrink-0 self-start rounded-[6px] overflow-hidden border border-[#d8dce8] bg-[#f8f9fd] cursor-grab"
              style={{ aspectRatio: String(frameAspect(formData, src)) }}
              draggable
              onDragStart={(e) => { setImgDragFrom(src); e.dataTransfer.effectAllowed = 'move'; }}
              onDragEnd={() => { setImgDragFrom(null); setImgDragOver(null); }}
              onDoubleClick={() => setPreviewUrl(url)}
              title="Double-click to view full size · drag onto another photo to swap"
            >
              <img src={url} alt={`Photo ${src + 1}`} className="w-full h-full object-cover pointer-events-none select-none" draggable={false} />
              <button
                type="button"
                onClick={() => setPreviewUrl(url)}
                className="absolute top-[4px] left-[4px] bg-white/90 p-[4px] rounded-full shadow-sm hover:text-[#007BFF] transition-colors"
                title="View full size"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => (src === 0 ? onChange({ keyVisualFile: null, keyVisualUrl: undefined }) : setExtra(src, ''))}
                className="absolute top-[4px] right-[4px] bg-white/90 p-[4px] rounded-full shadow-sm hover:text-red-600 transition-colors"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-[8px]">
              {flipButtons(c, (p) => setCrop(src, p))}
              {slider('Scale', c.scale, '%', PHOTO_SCALE_MIN, PHOTO_SCALE_MAX, 100, (v) => setCrop(src, { scale: v }))}
              {slider('Position X', cropToUi(c.x), '%', -150, 150, 0, (v) => setCrop(src, { x: uiToCrop(v) }))}
              {slider('Position Y', cropToUi(c.y), '%', -150, 150, 0, (v) => setCrop(src, { y: uiToCrop(v) }))}
              {slider('Rotation', formData.polaroidRotations?.[src] ?? 0, '°', -MAX_TILT, MAX_TILT, 0, (v) => {
                const next = Array.from({ length: 3 }, (_, i) => formData.polaroidRotations?.[i] ?? 0);
                next[src] = v;
                onChange({ polaroidRotations: next });
              })}
            </div>
          </div>
        ) : uploading === src ? (
          <div className="flex items-center justify-center h-[90px] rounded-[8px] border border-dashed border-[#d8dce8] text-[#71747d] gap-[8px]">
            <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
          </div>
        ) : (
          <ImageInputSelector
            accept="image/png, image/jpeg, image/webp"
            onAssetSelected={(file, u) => {
              if (src === 0) {
                if (file) onChange({ keyVisualFile: file });
                else if (u) onChange({ keyVisualUrl: u, keyVisualFile: null });
              } else void pickExtra(src, file, u);
            }}
          />
        )}
      </div>
    );
  };

  type Voucher = NonNullable<NonNullable<BannerFormData['polaroidVouchers']>['top']>;
  const setVoucher = (pos: 'top' | 'bottom', patch: Partial<Voucher>) =>
    onChange({ polaroidVouchers: { ...formData.polaroidVouchers, [pos]: { ...formData.polaroidVouchers?.[pos], ...patch } } });
  const voucherCard = (pos: 'top' | 'bottom') => {
    const v = formData.polaroidVouchers?.[pos] ?? {};
    return (
      <div key={pos} className="flex flex-col gap-[12px] rounded-[10px] border border-[#e9ebef] p-[12px] bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#303135]">{pos === 'top' ? 'Top voucher' : 'Bottom voucher'}</span>
          <Switch checked={!!v.enabled} onCheckedChange={(checked) => setVoucher(pos, { enabled: checked })} className="data-[state=checked]:bg-[#007BFF]" />
        </div>
        {v.enabled && (
          <>
            {slider('Scale', v.scale ?? 100, '%', 75, 120, 100, (scale) => setVoucher(pos, { scale }))}
            {slider('Position X', v.x ?? 0, '%', -5, 5, 0, (x) => setVoucher(pos, { x }))}
            {slider('Position Y', v.y ?? 0, '%', -5, 5, 0, (y) => setVoucher(pos, { y }))}
            {slider('Rotation', v.rotate ?? 0, '°', -15, 15, 0, (rotate) => setVoucher(pos, { rotate }))}
          </>
        )}
      </div>
    );
  };

  const isGradient = formData.polaroidBgMode === 'gradient';
  const vouchersOn = !!(formData.polaroidVouchers?.top?.enabled || formData.polaroidVouchers?.bottom?.enabled);
  return (
    <>
      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <label className="text-[14px] font-bold text-[#303135]">Background</label>
        <div className="flex gap-[8px]">
          {([['solid', 'Solid'], ['gradient', 'Gradient']] as const).map(([id, text]) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ polaroidBgMode: id, ...(id === 'gradient' && !formData.polaroidGradient ? { polaroidGradient: { ...DEFAULT_POLAROID_GRADIENT, stops: [{ color: formData.polaroidBg || DEFAULT_POLAROID_BG, pos: 0 }, DEFAULT_POLAROID_GRADIENT.stops[1]] } } : {}) })}
              className={`px-[12px] py-[6px] rounded-[8px] text-[13px] font-bold border transition-colors ${(id === 'gradient') === isGradient ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
            >
              {text}
            </button>
          ))}
        </div>
        {isGradient ? (
          <LinearGradientEditor value={formData.polaroidGradient ?? DEFAULT_POLAROID_GRADIENT} onChange={(g) => onChange({ polaroidGradient: g })} />
        ) : (
          <ColorPicker value={formData.polaroidBg || DEFAULT_POLAROID_BG} onChange={(v) => onChange({ polaroidBg: v })} defaultValue={DEFAULT_POLAROID_BG} />
        )}
      </div>

      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-[#303135]">Visual content</label>
          <button
            type="button"
            onClick={() => onChange({ polaroidGroup: undefined })}
            disabled={group.scale === DEFAULT_GROUP.scale && group.x === DEFAULT_GROUP.x && group.y === DEFAULT_GROUP.y}
            className="flex items-center gap-[4px] text-[13px] font-semibold text-[#007BFF] hover:underline disabled:text-[#9EA0A5] disabled:no-underline"
          >
            <RotateCw size={12} /> Reset to original
          </button>
        </div>
        <p className="text-[12px] text-[#71747d] -mt-[8px]">Moves and scales all polaroids together.</p>
        {slider('Scale', group.scale, '%', 50, 200, 100, (v) => setGroup({ scale: v }))}
        {slider('Position X', Math.min(xRange[1], Math.max(xRange[0], group.x)) / 10, '%', xRange[0] / 10, xRange[1] / 10, 0, (v) => setGroup({ x: Math.round(v * 10) }))}
        {slider('Position Y', Math.min(GROUP_Y_LIMIT, Math.max(-GROUP_Y_LIMIT, group.y)) / 10, '%', -GROUP_Y_LIMIT / 10, GROUP_Y_LIMIT / 10, 0, (v) => setGroup({ y: Math.round(v * 10) }))}
      </div>

      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <label className="text-[14px] font-bold text-[#303135]">Photos</label>
        <p className="text-[12px] text-[#71747d] -mt-[8px]">One image per polaroid. Drag a row to change which photo sits in front. Drag a photo in the preview (or its thumbnail here) to reposition the image inside its frame; scroll on the thumbnail to zoom.</p>
        {order.map((src, layer) => photoRow(src, layer))}
      </div>

      {/* Overlay image: sits between the background and the polaroids, fading out towards the text. Off by default. */}
      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-[14px] font-bold text-[#303135]">Overlay image</label>
            <span className="text-[12px] text-[#71747d]">A faded image behind the polaroids for extra depth.</span>
          </div>
          <Switch
            checked={!!overlay.enabled}
            onCheckedChange={(checked) => setOverlay({ enabled: checked })}
            className="data-[state=checked]:bg-[#007BFF]"
          />
        </div>
        {overlay.enabled && (
          <>
            <div className="flex gap-[8px]">
              {([['upload', 'Own image'], ['photo1', 'Same as Photo 1']] as const).map(([id, text]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOverlay({ source: id })}
                  className={`px-[12px] py-[6px] rounded-[8px] text-[13px] font-bold border transition-colors ${overlay.source === id ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                >
                  {text}
                </button>
              ))}
            </div>
            {overlay.source === 'upload' && (overlay.url ? (
              // Banner-shaped thumbnail with the same crop as the banner: drag to move the image
              <div
                className="relative w-full rounded-[8px] overflow-hidden border border-[#d8dce8] bg-[#f8f9fd] cursor-move"
                style={{ aspectRatio: formData.bannerRatio === 'Landscape (3:1)' ? '3' : formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)' ? '5' : '2', touchAction: 'none' }}
                onPointerDown={panOverlayThumb}
                title="Drag to move the overlay image"
              >
                <CropImg src={overlay.url} alt="Overlay" className="pointer-events-none select-none" crop={overlay} draggable={false} />
                <button type="button" onClick={() => setOverlay({ url: undefined })} className="absolute top-[6px] right-[6px] bg-white/90 p-[4px] rounded-full shadow-sm hover:text-red-600 transition-colors" title="Remove image">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : uploading === -1 ? (
              <div className="flex items-center justify-center h-[100px] rounded-[8px] border border-dashed border-[#d8dce8] text-[#71747d] gap-[8px]">
                <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
              </div>
            ) : (
              <ImageInputSelector accept="image/png, image/jpeg, image/webp" onAssetSelected={(file, u) => void pickOverlay(file, u)} />
            ))}
            {slider('Opacity', Math.min(overlay.opacity, OVERLAY_MAX_OPACITY), '%', 0, OVERLAY_MAX_OPACITY, DEFAULT_OVERLAY.opacity, (v) => setOverlay({ opacity: v }))}
            {slider('Fade start', overlay.fadeStart, '%', 0, 100, DEFAULT_OVERLAY.fadeStart, (v) => setOverlay({ fadeStart: v, fadeEnd: Math.max(v + 1, overlay.fadeEnd) }))}
            {slider('Fade end', overlay.fadeEnd, '%', 1, 100, DEFAULT_OVERLAY.fadeEnd, (v) => setOverlay({ fadeEnd: v, fadeStart: Math.min(v - 1, overlay.fadeStart) }))}
            {flipButtons(overlay, setOverlay)}
            {slider('Scale', overlay.scale, '%', PHOTO_SCALE_MIN, PHOTO_SCALE_MAX, 100, (v) => setOverlay({ scale: v }))}
            {slider('Position X', cropToUi(overlay.x), '%', -150, 150, 0, (v) => setOverlay({ x: uiToCrop(v) }))}
            {slider('Position Y', cropToUi(overlay.y), '%', -150, 150, 0, (v) => setOverlay({ y: uiToCrop(v) }))}
          </>
        )}
      </div>

      <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <label className="text-[14px] font-bold text-[#303135]">Voucher</label>
            <span className="text-[12px] text-[#71747d]">Ticket shapes peeking in from the top and bottom edge.</span>
          </div>
          <Switch
            checked={vouchersOn}
            onCheckedChange={(checked) => onChange({ polaroidVouchers: { ...formData.polaroidVouchers, top: { ...formData.polaroidVouchers?.top, enabled: checked }, bottom: { ...formData.polaroidVouchers?.bottom, enabled: checked } } })}
            className="data-[state=checked]:bg-[#007BFF]"
          />
        </div>
        {vouchersOn && (
          <>
        <div className="flex justify-end -mt-[4px]">
          <button
            type="button"
            onClick={() => onChange({ polaroidVouchers: Object.fromEntries((['top', 'bottom'] as const).map((k) => {
              const { x, y, rotate, scale, ...rest } = formData.polaroidVouchers?.[k] ?? {};
              return [k, rest];
            })) })}
            disabled={(['top', 'bottom'] as const).every((k) => { const v = formData.polaroidVouchers?.[k]; return !v?.x && !v?.y && !v?.rotate && (v?.scale ?? 100) === 100; })}
            className="flex items-center gap-[4px] text-[13px] font-semibold text-[#007BFF] hover:underline disabled:text-[#9EA0A5] disabled:no-underline"
          >
            <RotateCw size={12} /> Reset to default
          </button>
        </div>
          <ColorPicker
            value={(formData.polaroidVouchers?.top?.color || formData.polaroidVouchers?.bottom?.color || DEFAULT_VOUCHER_COLOR)}
            onChange={(c) => onChange({ polaroidVouchers: { ...formData.polaroidVouchers, top: { ...formData.polaroidVouchers?.top, color: c }, bottom: { ...formData.polaroidVouchers?.bottom, color: c } } })}
            defaultValue={DEFAULT_VOUCHER_COLOR}
            trigger={
              <button type="button" className="flex items-center gap-2 w-full text-left bg-[#F8F9FD] p-2 rounded-lg border border-[#d8dce8] hover:border-[#b9bfcc]">
                <div className="w-[16px] h-[16px] rounded-full border border-[#d8dce8] shrink-0 shadow-sm" style={{ backgroundColor: (formData.polaroidVouchers?.top?.color || formData.polaroidVouchers?.bottom?.color || DEFAULT_VOUCHER_COLOR) }} />
                <span className="text-sm text-[#71747d] font-medium uppercase truncate">{(formData.polaroidVouchers?.top?.color || formData.polaroidVouchers?.bottom?.color || DEFAULT_VOUCHER_COLOR)}</span>
              </button>
            }
          />
        {voucherCard('top')}
        {voucherCard('bottom')}
          </>
        )}
      </div>
      <Dialog open={!!previewUrl} onOpenChange={(o) => { if (!o) setPreviewUrl(null); }}>
        <DialogContent className="max-w-[90vw] w-auto p-[16px]">
          <DialogTitle className="sr-only">Photo preview</DialogTitle>
          {previewUrl && <img src={previewUrl} alt="Full size" className="max-w-[85vw] max-h-[80vh] object-contain mx-auto" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
