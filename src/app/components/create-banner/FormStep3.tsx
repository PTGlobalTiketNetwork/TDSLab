import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { BannerFormData, PartnerLogoSlot } from './types';
import { getDefaultPartnerLogoScale, getDefaultPartnerLogoY, getDefaultCampaignLogoY, getDefaultDesktopCampaignAssetScale } from './utils/layoutUtils';
import { svgPaths } from './assets/Icons';
import { Slider } from '../ui/slider';
import { EditableSliderValue } from '../ui/EditableSliderValue';
import { Switch } from '../ui/switch';
import { DropdownSelect } from './components/DropdownSelect';
import { Radio } from './components/Radio';
import { Label } from '../ui/label';
import { Plus, Trash2, Upload, Image as ImageIcon, ZoomIn, Maximize2, Palette, Sparkles, Wand2, ChevronDown, RotateCw, RefreshCw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { Lightbox } from '../Lightbox';
import React, { useEffect, useRef, useState } from 'react';
import { AssetService } from '../../../services/assetService';
import { Asset } from '../../types/asset';
import { ImageInputSelector } from '../inputs/ImageInputSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ColorPicker } from './ColorPicker';
import { PolaroidVisualFields } from './components/PolaroidVisualFields';
import { isPolaroidTemplate } from './components/PolaroidCollage';
import { AIGenerator } from '../inputs/AIGenerator';
import { GradientEditor, DEFAULT_OVERLAY_GRADIENT_STOPS } from './components/GradientEditor';
import { StyledInput } from './components/FormElements';
import { HistorySelector } from './components/HistorySelector';
import { useAccess } from '../../../context/AccessContext';
import { SingleAssetUploadDialog } from '../assets/SingleAssetUploadDialog';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { toast } from 'sonner';

interface FormStep3Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
  deviceTab?: 'mobile' | 'desktop' | 'all'; // 2:1 + "Add desktop version?"
  onDeviceTabChange?: (tab: 'mobile' | 'desktop' | 'all') => void;
  /** Inside the DLP Entry Point editor: sticky tab bars match its "Content nudge" tab row (flat, no shadow/bleed, 43px tall) */
  embedded?: boolean;
}

export function FormStep3({ formData, onChange, deviceTab = 'mobile', onDeviceTabChange, embedded = false }: FormStep3Props) {
  const { isWhitelisted } = useAccess();
  // Sticky-bar shadow rule (see useStickyBar): shadow only when stuck AND bottom-most of the stack
  const deviceBarRef = useRef<HTMLDivElement>(null);
  const { shadow: deviceShadow } = useStickyBar(deviceBarRef);
  // Overlay accordions: 'o' = 2:1/3:4 overlay, 'd' = desktop 5:1 overlay
  const [overlayOpen, setOverlayOpen] = useState<Record<string, boolean>>({ o1: true, o2: true, d1: true, d2: true });
  const [assets, setAssets] = useState<Asset[]>([]);
  
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await AssetService.listAssets();
        setAssets(data);
      } catch (error) {
        console.error('Failed to fetch assets', error);
      }
    };
    fetchAssets();
    window.addEventListener('assets:changed', fetchAssets);
    return () => window.removeEventListener('assets:changed', fetchAssets);
  }, []);

  // Maps a dropdown/radio type to the stored asset category
  const toAssetCategory = (category: string) => {
    const isBrandEntity = category === 'Brand' || category === 'Brand & Entity';
    return category === 'Other' ? 'Others' : isBrandEntity ? 'Entity Logo' : category;
  };

  const getAssetsInCategory = (category: string) => {
    const isBrandEntity = category === 'Brand' || category === 'Brand & Entity';
    const targetCategory = toAssetCategory(category);
    return assets.filter(a => a.category === targetCategory || (isBrandEntity && a.category === 'brand-entity-logo'));
  };

  const getAssetOptions = (category: string) =>
    getAssetsInCategory(category)
      .map(a => ({ id: a.imageUrl, label: a.name }))
      .sort((a, b) => a.label.localeCompare(b.label));

  // Manual logo upload (from the Campaign / Partner logo dropdowns)
  const [uploadTarget, setUploadTarget] = useState<{ kind: 'campaign' } | { kind: 'partner'; slotId: string; type: string } | null>(null);
  const [uploadInitialName, setUploadInitialName] = useState('');
  const uploadType = uploadTarget?.kind === 'partner' ? uploadTarget.type : 'Campaign';

  const openLogoUpload = (target: NonNullable<typeof uploadTarget>, searchText: string) => {
    setUploadInitialName(searchText);
    setUploadTarget(target);
  };

  const handleLogoUploaded = async (created: Asset) => {
    const target = uploadTarget;
    setAssets(prev => [...prev, created]);
    try {
      setAssets(await AssetService.listAssets());
    } catch (error) {
      console.error('Failed to refresh assets', error);
    }
    if (target?.kind === 'campaign') onChange({ campaignLogo: created.imageUrl });
    else if (target?.kind === 'partner') updatePartnerSlot(target.slotId, 'logo', created.imageUrl);
    setUploadTarget(null);
    toast.custom((t) => <TiketSnackbar id={t} message={`"${created.name}" uploaded and selected`} />, { duration: 3000 });
  };

  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isWhatsAppRatio = formData.bannerRatio === 'Mobile (2:1 WhatsApp)';
  const isSquare = formData.bannerRatio === 'Square (1:1)';
  // Landscape (3:1) is a TTD Promo Asset ratio that clones the 2:1 layout onto a wider canvas — treated identically everywhere 2:1 is.
  const isLandscape21 = formData.bannerRatio === 'Landscape (2:1)' || formData.bannerRatio === 'Landscape (3:1)';
  // Portrait 3:4 logo defaults (2:1 and others keep 16px / 100%): campaign x/y 20px @160%, partner top 20px @160%
  const isPortraitRatio = formData.bannerRatio === 'Portrait (3:4)';
  const cScale = isPortraitRatio ? 1.6 : 1;
  const cPos = isPortraitRatio ? 20 : 16;
  const pScale = getDefaultPartnerLogoScale(formData);
  const pPos = getDefaultPartnerLogoY(formData);
  const cPosY = getDefaultCampaignLogoY(formData);
  
  const activeBackgroundTab = formData.backgroundType || 'image';

  const getLogoOptions = () => {
      const type = formData.logoType || 'Campaign';
      let filteredAssets: Asset[] = [];
      
      if (type === 'Campaign') {
          filteredAssets = assets.filter(a => a.category === 'Campaign');
      } else if (type === 'Brand') {
          // Check both 'Entity Logo' and 'brand-entity-logo' to cover legacy/slug variations
          filteredAssets = assets.filter(a => a.category === 'Entity Logo' || a.category === 'brand-entity-logo'); 
      } else if (type === 'Partner') {
          filteredAssets = assets.filter(a => ['Payment', 'Airlines', 'Hotel'].includes(a.category));
      }
      
      return filteredAssets
          .map(a => ({ id: a.imageUrl, label: a.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
  };

  // Determine effective tab
  // For Product Entry Point: Force color/gradient, default to color
  // For non-whitelisted users: fall back from 'generate'/'history' to 'image'
  const effectiveTab = isProductEntryPoint
      ? (activeBackgroundTab === 'color' || activeBackgroundTab === 'gradient' ? activeBackgroundTab : 'color')
      : (!isSquare && (activeBackgroundTab === 'color' || activeBackgroundTab === 'gradient'))
          ? 'image'
          : (!isWhitelisted && (activeBackgroundTab === 'generate' || activeBackgroundTab === 'history'))
              ? 'image'
              : activeBackgroundTab;

  const previewUrl = React.useMemo(() => {
    if (formData.keyVisualFile instanceof Blob) {
        try {
            return URL.createObjectURL(formData.keyVisualFile);
        } catch (e) {
            console.error("Failed to create object URL in Step 3", e);
            return null;
        }
    }
    return formData.keyVisualUrl || null;
  }, [formData.keyVisualFile, formData.keyVisualUrl]);

  // Clean up object URL
  React.useEffect(() => {
    return () => {
        if (formData.keyVisualFile instanceof Blob && previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    };
  }, [formData.keyVisualFile, previewUrl]);

  // Partner Logo Handlers
  const handlePartnerLogoToggle = (checked: boolean) => {
    if (checked && formData.partnerLogos.length === 0) {
      // Add initial slot if turning on and empty
      onChange({ 
        showPartnerLogo: true,
        partnerLogos: [{ id: Math.random().toString(36).substr(2, 9), type: 'Payment', logo: '' }] 
      });
    } else {
      onChange({ showPartnerLogo: checked });
    }
  };

  const addPartnerSlot = () => {
    if (formData.partnerLogos.length >= 3) return;
    const newSlot: PartnerLogoSlot = { id: Math.random().toString(36).substr(2, 9), type: 'Partner', logo: '' };
    onChange({ partnerLogos: [...formData.partnerLogos, newSlot] });
  };

  const removePartnerSlot = (id: string) => {
    const newSlots = formData.partnerLogos.filter(slot => slot.id !== id);
    onChange({ partnerLogos: newSlots });
    if (newSlots.length === 0) {
        onChange({ showPartnerLogo: false });
    }
  };

  const updatePartnerSlot = (id: string, field: keyof PartnerLogoSlot, value: any) => {
    const newSlots = formData.partnerLogos.map(slot => {
      if (slot.id === id) {
        // If type changes, clear the selected logo because options change
        const updates = { [field]: value };
        if (field === 'type') {
            updates.logo = '';
        }
        return { ...slot, ...updates };
      }
      return slot;
    });
    onChange({ partnerLogos: newSlots });
  };
  
  const handleTabChange = (val: string) => {
      const updates: Partial<BannerFormData> = { backgroundType: val as any };
      
      // If switching to gradient, set gradient overlay to 0% as requested
      if (val === 'gradient') {
          updates.gradientOpacity = 0;
          if (!formData.backgroundGradientStops || formData.backgroundGradientStops.length === 0) {
            updates.backgroundGradientStops = [
                { id: '1', color: '#5BAAFF', position: 0, opacity: 100 },
                { id: '2', color: '#007BFF', position: 100, opacity: 100 }
            ];
          }
      } else if (val === 'image') {
          // Optional: Reset to default if switching back to image? 
          // User didn't specify, but usually image needs overlay.
          // Let's leave it as is to not override user preference if they set it manually.
          if (formData.gradientOpacity === 0) {
             updates.gradientOpacity = 100; 
          }
      }
      
      onChange(updates);
  };

  // Overlay editor shared by the 2:1/3:4 overlay and the Desktop 5:1 overlay:
  // Color, then Overlay 1 and Overlay 2 as accordions (Opacity · Start · Stop); Overlay 2 can copy Overlay 1.
  type OverlayLayer = { opacity: number; start: number; stop: number; setOpacity: (v: number) => void; setStart: (v: number) => void; setStop: (v: number) => void };
  type GradStops = NonNullable<BannerFormData['overlaySolidGradientStops']>;
  const renderOverlayEditor = (cfg: { id: 'o' | 'd'; color: string; setColor: (v: string) => void; l1: OverlayLayer; enabled2: boolean; enable2: () => void; disable2: () => void; l2: OverlayLayer; synced: boolean; toggleSynced: () => void; reset: () => void; mode: 'fade' | 'solid'; setMode: (v: 'fade' | 'solid') => void; coverage: number; setCoverage: (v: number) => void; solidOpacity: number; setSolidOpacity: (v: number) => void; fill: 'color' | 'gradient'; setFill: (v: 'color' | 'gradient') => void; gradStops: GradStops; setGradStops: (v: GradStops) => void; gradType: 'linear' | 'radial'; setGradType: (v: 'linear' | 'radial') => void; gradAngle: number; setGradAngle: (v: number) => void }) => {
    const row = (label: string, value: number, min: number, onVal: (v: number) => void, disabled?: boolean) => (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-[#303135]">{label}</label>
          <span className={`text-[13px] font-semibold ${disabled ? 'text-[#9EA0A5]' : 'text-[#007BFF]'}`}>{value}%</span>
        </div>
        <Slider disabled={disabled} value={[value]} min={min} max={100} step={5} className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]" onValueChange={(val) => onVal(val[0])} />
      </div>
    );
    const card = (key: string, title: string, layer: OverlayLayer, extra?: React.ReactNode) => (
      <div className="rounded-[10px] border border-[#e9ebef] bg-white">
        <button type="button" onClick={() => setOverlayOpen((p) => ({ ...p, [key]: !p[key] }))} className="flex items-center justify-between w-full px-[12px] py-[10px] text-left">
          <span className="text-[14px] font-bold text-[#303135]">{title}</span>
          <div className="flex items-center gap-[8px]">
            {extra}
            <ChevronDown className={`w-[16px] h-[16px] transition-transform ${overlayOpen[key] ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {overlayOpen[key] && (
          <div className="flex flex-col gap-[12px] px-[12px] pb-[12px]">
            {row('Opacity', layer.opacity, 0, layer.setOpacity)}
            {row('Start', layer.start, 0, layer.setStart, key.endsWith('2') && cfg.synced)}
            {row('Stop', layer.stop, 10, layer.setStop, key.endsWith('2') && cfg.synced)}
            {key.endsWith('2') && (
              cfg.synced
                ? <span className="text-[12px] text-[#71747d]">Start/Stop follow Overlay 1 — turn off sync to set them separately.</span>
                : <button type="button" onClick={() => { layer.setOpacity(cfg.l1.opacity); layer.setStart(cfg.l1.start); layer.setStop(cfg.l1.stop); }} className="self-start text-[13px] font-semibold text-[#007BFF] hover:underline">Copy settings from Overlay 1</button>
            )}
          </div>
        )}
      </div>
    );
    return (
      <div className="flex flex-col gap-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex gap-[24px]">
            {([['fade', 'Fade'], ['solid', 'Solid']] as const).map(([val, text]) => (
              <Radio key={val} name={`overlayMode-${cfg.id}`} checked={cfg.mode === val} onChange={() => cfg.setMode(val)}>
                <span className="text-[14px] text-[#303135]">{text}</span>
              </Radio>
            ))}
          </div>
          <button type="button" onClick={cfg.reset} className="text-[13px] font-semibold text-[#007BFF] hover:underline">Reset to default</button>
        </div>
        {cfg.mode === 'fade' && (
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-[#303135]">Color</label>
          <div className="flex items-center gap-2 bg-[#F8F9FD] p-2 rounded-lg border border-[#d8dce8]">
            <ColorPicker
              value={cfg.color}
              onChange={cfg.setColor}
              trigger={
                <button type="button" className="flex items-center gap-2 w-full text-left">
                  <div className="relative w-[16px] h-[16px] rounded-full overflow-hidden border border-[#d8dce8] shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: cfg.color }} />
                  <span className="text-sm text-[#71747d] font-medium uppercase truncate">{cfg.color}</span>
                </button>
              }
            />
          </div>
          </div>
        )}
        {cfg.mode === 'solid' ? (
          <div className="rounded-[10px] border border-[#e9ebef] bg-white">
            <div className="px-[12px] py-[10px] text-[14px] font-bold text-[#303135]">Solid</div>
            <div className="flex flex-col gap-[12px] px-[12px] pb-[12px]">
              <div className="flex gap-[24px]">
                {([['color', 'Solid'], ['gradient', 'Linear gradient']] as const).map(([val, text]) => (
                  <Radio key={val} name={`overlaySolidFill-${cfg.id}`} checked={cfg.fill === val} onChange={() => cfg.setFill(val)}>
                    <span className="text-[14px] text-[#303135]">{text}</span>
                  </Radio>
                ))}
              </div>
              {cfg.fill === 'gradient'
                ? <GradientEditor stops={cfg.gradStops} onChange={cfg.setGradStops} type={cfg.gradType} onTypeChange={cfg.setGradType} angle={cfg.gradAngle} onAngleChange={cfg.setGradAngle} />
                : (
          <div className="flex items-center gap-2 bg-[#F8F9FD] p-2 rounded-lg border border-[#d8dce8]">
            <ColorPicker
              value={cfg.color}
              onChange={cfg.setColor}
              trigger={
                <button type="button" className="flex items-center gap-2 w-full text-left">
                  <div className="relative w-[16px] h-[16px] rounded-full overflow-hidden border border-[#d8dce8] shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: cfg.color }} />
                  <span className="text-sm text-[#71747d] font-medium uppercase truncate">{cfg.color}</span>
                </button>
              }
            />
          </div>
                )}
              {row('Coverage', cfg.coverage, 0, cfg.setCoverage)}
              {row('Opacity', cfg.solidOpacity, 0, cfg.setSolidOpacity)}
            </div>
          </div>
        ) : <>
        {card(`${cfg.id}1`, 'Overlay 1', cfg.l1)}
        {cfg.enabled2 && card(`${cfg.id}2`, 'Overlay 2', cfg.l2, (
          <>
            <div className="flex items-center gap-[6px]" onClick={(e) => e.stopPropagation()}>
              <span className="text-[12px] font-medium text-[#71747d]">Sync</span>
              <Switch checked={cfg.synced} onCheckedChange={() => cfg.toggleSynced()} className="data-[state=checked]:bg-[#007BFF]" />
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); cfg.disable2(); }} className="text-[#d4183d] hover:text-[#a3132f] transition-colors" title="Remove Overlay 2">
              <Trash2 size={14} />
            </button>
          </>
        ))}
        {!cfg.enabled2 && (
          <button type="button" onClick={cfg.enable2} className="self-start text-[14px] font-bold text-[#007BFF] hover:underline">+ Duplicate overlay</button>
        )}
        </>}
      </div>
    );
  };

  // Desktop 5:1 key visual (+ overlay): stand alone = inline, bundled with 2:1 = in the Desktop tab
  const desktopRatioLabel = formData.bannerRatio === 'Desktop (4:1)' ? '4:1' : '5:1';
  const isDesktopStandalone = formData.bannerCategory === 'Promo Banner' && (formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)');
  // TTD Highlight templates: background + polaroid photos replace the key visual and overlay cards
  const polaroid = isPolaroidTemplate(formData);
  const hasDesktopVersion = formData.bannerCategory === 'Promo Banner' && formData.bannerRatio === 'Landscape (2:1)' && !!formData.provideDesktopBanner;
  const desktopCampaignControls = (
      <div className="flex flex-col gap-[12px]">
        <div className="flex gap-[24px]">
          {([['sticky', 'Sticky top-left'], ['free', 'Free area']] as const).map(([val, text]) => (
            <Radio
              key={val}
              name="desktopCampaignLogoMode"
              checked={(formData.desktopCampaignLogoMode ?? 'sticky') === val}
              onChange={() => onChange({ desktopCampaignLogoMode: val })}
            >
              <span className="text-[14px] text-[#303135]">{text}</span>
            </Radio>
          ))}
        </div>
        {(() => {
          const sticky = (formData.desktopCampaignLogoMode ?? 'sticky') === 'sticky';
          const partnerOn = isDesktopStandalone ? !!formData.showPartnerLogo : !!formData.desktopShowPartnerLogo;
          const rows: [string, string, number, number, number][] = sticky
            ? [['Pill scale (campaign & partner logo)', 'desktopPillScale', 30, 300, 5], ['Campaign logo asset size', 'desktopCampaignAssetScale', 50, 200, 5]]
            : [['Campaign logo scale', 'desktopCampaignLogoScale', 30, 400, 5], ...(partnerOn ? [['Partner logo scale', 'desktopPillScale', 30, 300, 5] as [string, string, number, number, number]] : [])];
          return rows.map(([label, key, min, max, step]) => {
            const def = key === 'desktopCampaignAssetScale' ? getDefaultDesktopCampaignAssetScale(formData) : 100;
            return (
            <div key={key} className="flex flex-col gap-[8px]">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#303135]">{label}</span>
                <div className="flex items-center gap-[8px]">
                  <EditableSliderValue value={(formData as any)[key] ?? def} onChange={(v) => onChange({ [key]: v } as any)} suffix="%" min={min} max={max} className="text-[13px] font-semibold text-[#007BFF]" />
                  <button type="button" onClick={() => onChange({ [key]: def } as any)} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                </div>
              </div>
              <Slider min={min} max={max} step={step} value={[(formData as any)[key] ?? def]} onValueChange={([v]) => onChange({ [key]: v } as any)} className="w-full" />
            </div>
            );
          });
        })()}
        {(formData.desktopCampaignLogoMode ?? 'sticky') === 'sticky' ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-bold text-[#303135]">Background</span>
              <Switch
                checked={formData.desktopCampaignLogoBgEnabled !== false}
                onCheckedChange={(checked) => onChange({ desktopCampaignLogoBgEnabled: checked })}
                className="data-[state=checked]:bg-[#007BFF]"
              />
            </div>
            {formData.desktopCampaignLogoBgEnabled !== false && (
              <div className="flex items-start gap-[10px] flex-wrap">
                {([['N0', '#FFFFFF'], ['B100', '#E0EFFF'], ['Y500', '#FEDD00'], ['B400', '#007BFF'], ['B500', '#0064D2'], ['Black', '#000000']] as const).map(([name, hex]) => {
                  const active = (formData.desktopCampaignLogoBg ?? '#007BFF').toUpperCase() === hex;
                  return (
                    <button key={hex} type="button" title={name} onClick={() => onChange({ desktopCampaignLogoBg: hex })} className="flex flex-col items-center gap-[4px]">
                      <span className={`block w-[28px] h-[28px] rounded-full transition-all ${active ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`} style={{ backgroundColor: hex }} />
                      <span className={`text-[11px] leading-none ${active ? 'font-bold text-[#303135]' : 'text-[#71747d]'}`}>{name}</span>
                    </button>
                  );
                })}
                {/* Any other colour: same size as the presets, opens the standard picker (Tokens / Custom tabs) */}
                <ColorPicker
                  variant="chip"
                  chipActive={!['#FFFFFF', '#E0EFFF', '#FEDD00', '#007BFF', '#0064D2', '#000000'].includes((formData.desktopCampaignLogoBg ?? '#007BFF').toUpperCase())}
                  value={formData.desktopCampaignLogoBg ?? '#007BFF'}
                  onChange={(v) => onChange({ desktopCampaignLogoBg: v })}
                  defaultValue="#007BFF"
                />
              </div>
            )}
            <span className="text-[12px] text-[#71747d]">With a partner logo on, both share one pill at the top-left. Raise the asset size to make the logo fill its segment almost edge to edge.</span>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[#71747d]">No background — drag the logo in the preview to place it.</span>
            <button type="button" onClick={() => onChange({ desktopCampaignLogoX: 24, desktopCampaignLogoY: 24 })} className="text-[12px] font-semibold text-[#007BFF] hover:underline">Reset position</button>
          </div>
        )}
      </div>
  );

  // Stand-alone desktop banners (5:1 and DLP Header 4:1): no card around the settings, Scale / X / Y sit directly in the form.
  // (A 5:1 bundled with a 2:1 keeps its card in the Desktop tab.)
  const flatDesktop = isDesktopStandalone;
  const desktopCard = (
        <div className="flex flex-col gap-[20px]">
            {!polaroid && <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
            {flatDesktop && <span className="text-[14px] font-bold text-[#303135]">Key Visual</span>}
            {/* Same image as the Mobile tab (a single key visual for both) */}
            {previewUrl && (
                <div className="flex items-center gap-[12px] p-[8px] rounded-[8px] bg-[#f8f9fd] border border-[#e9ebef]">
                    <img src={previewUrl} alt="Key visual" className="w-[96px] h-[48px] object-cover rounded-[6px]" />
                    <div className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#303135]">Same as Mobile</span>
                        <span className="text-[12px] text-[#71747d]">Change the image in the Mobile tab.</span>
                    </div>
                </div>
            )}
            {!flatDesktop && (
            <div className="flex flex-col gap-[4px]">
                <span className="text-[14px] font-bold text-[#303135]">Desktop {desktopRatioLabel} key visual</span>
                <span className="text-[12px] text-[#71747d]">Works like the 2:1 key visual: full-bleed image, faded to black under the content.</span>
            </div>
            )}
            {/* Same flip fields as the Mobile key visual (it's the same image) — exposed here too since the desktop
                composition often needs its own orientation even though the asset is shared. */}
            <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-[#303135]">Flip</span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onChange({ desktopKeyVisualFlipH: !(formData.desktopKeyVisualFlipH ?? formData.keyVisualFlipH) })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${(formData.desktopKeyVisualFlipH ?? formData.keyVisualFlipH) ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                        title="Flip Horizontal"
                    >
                        <FlipHorizontal2 className="w-3.5 h-3.5" />
                        Horizontal
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange({ desktopKeyVisualFlipV: !(formData.desktopKeyVisualFlipV ?? formData.keyVisualFlipV) })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${(formData.desktopKeyVisualFlipV ?? formData.keyVisualFlipV) ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                        title="Flip Vertical"
                    >
                        <FlipVertical2 className="w-3.5 h-3.5" />
                        Vertical
                    </button>
                </div>
            </div>
            {([
                ['Scale', 'scale', 100, '%', 5, 250, 5],
                ['Position X', 'x', 50, '%', 0, 100, 1],
                ['Position Y', 'y', 50, '%', 0, 100, 1],
            ] as const).map(([label, k, def, unit, min, max, step]) => {
                const cur = Math.round(k === 'scale' ? (formData.desktopKeyVisualScale ?? def) : (formData.desktopKeyVisualPosition?.[k] ?? def)); // whole numbers only
                const set = (v: number) => k === 'scale'
                    ? onChange({ desktopKeyVisualScale: v })
                    : onChange({ desktopKeyVisualPosition: { x: formData.desktopKeyVisualPosition?.x ?? 50, y: formData.desktopKeyVisualPosition?.y ?? 50, [k]: v } });
                return (
                    <div key={k} className="flex flex-col gap-[8px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">{label}</span>
                            <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={cur} onChange={(v) => set(v)} suffix={unit} min={min} max={max} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button type="button" onClick={() => set(def)} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset">
                                    <RotateCw size={12} />
                                </button>
                            </div>
                        </div>
                        <Slider min={min} max={max} step={step} value={[cur]} onValueChange={([v]) => set(v)} className="w-full" />
                    </div>
                );
            })}
            </div>}
            {hasDesktopVersion && (
                <>
                    {/* Campaign logo for the 5:1 — own toggle/position/scale, asset can be overridden (e.g. a light version so it doesn't sink into the background) */}
                    <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">Campaign logo ({desktopRatioLabel})</span>
                            <Switch checked={!!formData.desktopShowCampaignLogo} onCheckedChange={(checked) => onChange({ desktopShowCampaignLogo: checked })} className="data-[state=checked]:bg-[#007BFF]" />
                        </div>
                        {formData.desktopShowCampaignLogo && (
                            <>
                                <DropdownSelect
                                    options={[{ id: '', label: formData.campaignLogo ? 'Same as Mobile' : 'Same as Mobile (none selected)' }, ...getAssetOptions('Campaign')]}
                                    value={formData.desktopCampaignLogo || ''}
                                    onChange={(val) => onChange({ desktopCampaignLogo: val })}
                                    placeholder="Same as Mobile"
                                />
                                {formData.desktopCampaignLogo && (
                                    <button type="button" onClick={() => onChange({ desktopCampaignLogo: '' })} className="self-start flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors">
                                        <RotateCw size={12} />
                                        Reset logo
                                    </button>
                                )}
                                <span className="text-[12px] text-[#71747d]">Pick another asset here to override the logo on the {desktopRatioLabel} only (e.g. a white version for a dark background).</span>
                                {desktopCampaignControls}
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">Partner logo ({desktopRatioLabel})</span>
                            <Switch checked={!!formData.desktopShowPartnerLogo} onCheckedChange={(checked) => onChange({ desktopShowPartnerLogo: checked })} className="data-[state=checked]:bg-[#007BFF]" />
                        </div>
                        {formData.desktopShowPartnerLogo && (
                            <>
                                <div className="flex flex-col gap-[8px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[14px] font-bold text-[#303135]">Scale (synced with campaign logo)</span>
                                        <div className="flex items-center gap-[8px]">
                                            <EditableSliderValue value={formData.desktopPillScale ?? 100} onChange={(v) => onChange({ desktopPillScale: v })} suffix="%" min={30} max={300} className="text-[13px] font-semibold text-[#007BFF]" />
                                            <button type="button" onClick={() => onChange({ desktopPillScale: 100 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                                        </div>
                                    </div>
                                    <Slider min={30} max={300} step={5} value={[formData.desktopPillScale ?? 100]} onValueChange={([v]) => onChange({ desktopPillScale: v })} className="w-full" />
                                </div>

                                    <div className="flex flex-col gap-[8px]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[14px] font-bold text-[#303135]">Partner asset size</span>
                                            <div className="flex items-center gap-[8px]">
                                                <EditableSliderValue value={formData.desktopPartnerAssetScale ?? 160} onChange={(v) => onChange({ desktopPartnerAssetScale: v })} suffix="%" min={50} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
                                                <button type="button" onClick={() => onChange({ desktopPartnerAssetScale: 160 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                                            </div>
                                        </div>
                                        <Slider min={50} max={200} step={5} value={[formData.desktopPartnerAssetScale ?? 160]} onValueChange={([v]) => onChange({ desktopPartnerAssetScale: v })} className="w-full" />
                                    </div>
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">Spacing between assets</span>
                            <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={formData.desktopPartnerGap ?? 36} onChange={(v) => onChange({ desktopPartnerGap: v })} suffix="px" min={16} max={80} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button type="button" onClick={() => onChange({ desktopPartnerGap: 36 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                            </div>
                        </div>
                        <Slider min={16} max={80} step={2} value={[formData.desktopPartnerGap ?? 36]} onValueChange={([v]) => onChange({ desktopPartnerGap: v })} className="w-full" />
                        <span className="text-[12px] text-[#71747d]">Never tighter than 16px.</span>
                    </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[14px] font-bold text-[#303135]">Background</span>
                                    <Switch
                                        checked={formData.desktopPartnerLogoBgEnabled !== false}
                                        onCheckedChange={(checked) => onChange({ desktopPartnerLogoBgEnabled: checked })}
                                        className="data-[state=checked]:bg-[#007BFF]"
                                    />
                                </div>
                                {formData.desktopPartnerLogoBgEnabled !== false && (
                                    <div className="flex items-start gap-[10px] flex-wrap">
                                        {([['N0', '#FFFFFF'], ['B100', '#E0EFFF'], ['Y500', '#FEDD00'], ['B400', '#007BFF'], ['B500', '#0064D2'], ['Black', '#000000']] as const).map(([name, hex]) => {
                                            const active = (formData.desktopPartnerLogoBg ?? '#FFFFFF').toUpperCase() === hex;
                                            return (
                                                <button key={hex} type="button" title={name} onClick={() => onChange({ desktopPartnerLogoBg: hex })} className="flex flex-col items-center gap-[4px]">
                                                    <span className={`block w-[28px] h-[28px] rounded-full transition-all ${active ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`} style={{ backgroundColor: hex }} />
                                                    <span className={`text-[11px] leading-none ${active ? 'font-bold text-[#303135]' : 'text-[#71747d]'}`}>{name}</span>
                                                </button>
                                            );
                                        })}
                                        <ColorPicker
                                            variant="chip"
                                            chipActive={!['#FFFFFF', '#E0EFFF', '#FEDD00', '#007BFF', '#0064D2', '#000000'].includes((formData.desktopPartnerLogoBg ?? '#FFFFFF').toUpperCase())}
                                            value={formData.desktopPartnerLogoBg ?? '#FFFFFF'}
                                            onChange={(v) => onChange({ desktopPartnerLogoBg: v })}
                                            defaultValue="#FFFFFF"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-[24px]">
                                    {([['same', 'Same as Mobile'], ['custom', 'Custom assets']] as const).map(([val, text]) => (
                                        <Radio
                                            key={val}
                                            name="desktopPartnerLogoMode"
                                            checked={(formData.desktopPartnerLogoMode ?? 'same') === val}
                                            onChange={() => onChange({ desktopPartnerLogoMode: val, ...(val === 'custom' && !(formData.desktopPartnerLogos?.length) ? { desktopPartnerLogos: [{ id: Math.random().toString(36).slice(2, 11), type: 'Payment', logo: '' }] } : {}) })}
                                        >
                                            <span className="text-[14px] text-[#303135]">{text}</span>
                                        </Radio>
                                    ))}
                                </div>
                                {(formData.desktopPartnerLogoMode ?? 'same') === 'custom' && (
                                    <div className="flex flex-col gap-[12px]">
                                        {(formData.desktopPartnerLogos ?? []).map((slot, index) => (
                                            <div key={slot.id} className="flex flex-col gap-[8px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[13px] text-[#303135]">Logo {index + 1}</span>
                                                    <div className="flex items-center gap-[8px]">
                                                        {slot.logo && <button type="button" onClick={() => onChange({ desktopPartnerLogos: (formData.desktopPartnerLogos ?? []).map((s) => s.id === slot.id ? { ...s, logo: '' } : s) })} className="flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135]"><RotateCw size={12} />Reset logo</button>}
                                                        <button type="button" onClick={() => onChange({ desktopPartnerLogos: (formData.desktopPartnerLogos ?? []).filter((s) => s.id !== slot.id) })} className="text-[#71747d] hover:text-[#d4183d]"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <DropdownSelect
                                                    options={(['Payment', 'Airlines', 'Hotel', 'Brand & Entity', 'Product Icon', 'Other'] as const).map((c) => ({ id: c, label: c }))}
                                                    value={slot.type}
                                                    onChange={(val) => onChange({ desktopPartnerLogos: (formData.desktopPartnerLogos ?? []).map((s) => s.id === slot.id ? { ...s, type: val as PartnerLogoSlot['type'], logo: '' } : s) })}
                                                    placeholder="Category"
                                                    disableSearch
                                                />
                                                <DropdownSelect
                                                    options={getAssetOptions(slot.type)}
                                                    value={slot.logo || ''}
                                                    onChange={(val) => onChange({ desktopPartnerLogos: (formData.desktopPartnerLogos ?? []).map((s) => s.id === slot.id ? { ...s, logo: val } : s) })}
                                                    placeholder="Select logo"
                                                />
                                            </div>
                                        ))}
                                        {(formData.desktopPartnerLogos ?? []).length < 4 && (
                                            <button type="button" onClick={() => onChange({ desktopPartnerLogos: [...(formData.desktopPartnerLogos ?? []), { id: Math.random().toString(36).slice(2, 11), type: 'Payment', logo: '' }] })} className="self-start text-[14px] font-bold text-[#007BFF] hover:underline">+ Add logo</button>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            {/* The whole overlay (color + Overlay 1 / 2) is one card, same style as the Campaign logo card */}
            {!polaroid && <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                <span className="text-[14px] font-bold text-[#303135]">Overlay</span>
                {renderOverlayEditor({
                    id: 'd',
                    color: formData.desktopOverlayColor ?? '#000000',
                    setColor: (v) => onChange({ desktopOverlayColor: v }),
                    l1: { opacity: formData.desktopOverlayOpacity ?? 100, start: formData.desktopGradientStop ?? 45, stop: formData.desktopGradientEnd ?? 80,
                          setOpacity: (v) => onChange({ desktopOverlayOpacity: v }),
                          setStart: (v) => onChange({ desktopGradientStop: v, ...(formData.desktopOverlay2Synced ? { desktopGradientStop2: v } : {}) }),
                          setStop: (v) => onChange({ desktopGradientEnd: v, ...(formData.desktopOverlay2Synced ? { desktopGradientEnd2: v } : {}) }) },
                    enabled2: !!formData.desktopOverlay2Enabled,
                    enable2: () => onChange({ desktopOverlay2Enabled: true, desktopOverlay2Synced: true, desktopOverlay2Opacity: formData.desktopOverlayOpacity ?? 100, desktopGradientStop2: formData.desktopGradientStop ?? 45, desktopGradientEnd2: formData.desktopGradientEnd ?? 80 }),
                    disable2: () => onChange({ desktopOverlay2Enabled: false }),
                    l2: { opacity: formData.desktopOverlay2Opacity ?? 100, start: formData.desktopGradientStop2 ?? 80, stop: formData.desktopGradientEnd2 ?? 100,
                          setOpacity: (v) => onChange({ desktopOverlay2Opacity: v }), setStart: (v) => onChange({ desktopGradientStop2: v }), setStop: (v) => onChange({ desktopGradientEnd2: v }) },
                    synced: !!formData.desktopOverlay2Synced,
                    toggleSynced: () => onChange({ desktopOverlay2Synced: !formData.desktopOverlay2Synced, ...(!formData.desktopOverlay2Synced ? { desktopGradientStop2: formData.desktopGradientStop ?? 45, desktopGradientEnd2: formData.desktopGradientEnd ?? 80 } : {}) }),
                    reset: () => onChange({ desktopOverlayColor: '#000000', desktopOverlayOpacity: 100, desktopGradientStop: 45, desktopGradientEnd: 80, desktopOverlay2Enabled: false, desktopOverlay2Synced: false, desktopOverlay2Opacity: 100, desktopGradientStop2: 80, desktopGradientEnd2: 100, desktopOverlayMode: 'fade', desktopOverlaySolidCoverage: 50, desktopOverlaySolidOpacity: 100, desktopOverlaySolidFill: 'color', desktopOverlaySolidGradientStops: DEFAULT_OVERLAY_GRADIENT_STOPS, desktopOverlaySolidGradientType: 'linear', desktopOverlaySolidGradientAngle: 90 }),
                    mode: formData.desktopOverlayMode ?? 'fade',
                    setMode: (v) => onChange({ desktopOverlayMode: v }),
                    coverage: formData.desktopOverlaySolidCoverage ?? 50,
                    setCoverage: (v) => onChange({ desktopOverlaySolidCoverage: v }),
                    solidOpacity: formData.desktopOverlaySolidOpacity ?? 100,
                    setSolidOpacity: (v) => onChange({ desktopOverlaySolidOpacity: v }),
                    fill: formData.desktopOverlaySolidFill ?? 'color',
                    setFill: (v) => onChange({ desktopOverlaySolidFill: v }),
                    gradStops: formData.desktopOverlaySolidGradientStops ?? DEFAULT_OVERLAY_GRADIENT_STOPS,
                    setGradStops: (v) => onChange({ desktopOverlaySolidGradientStops: v }),
                    gradType: formData.desktopOverlaySolidGradientType ?? 'linear',
                    setGradType: (v) => onChange({ desktopOverlaySolidGradientType: v }),
                    gradAngle: formData.desktopOverlaySolidGradientAngle ?? 90,
                    setGradAngle: (v) => onChange({ desktopOverlaySolidGradientAngle: v }),
                })}
            </div>}
        </div>
  );

  const deviceBar = hasDesktopVersion ? (
    <div ref={deviceBarRef} className={`flex sticky top-[var(--sticky-top,0px)] z-[42] bg-white ${deviceShadow ? STICKY_SHADOW : 'border-b border-[#e9ebef]'} ${embedded ? '-mx-[24px] px-[24px]' : '-mx-[24px] -mt-[24px] px-[24px]'}`}>
      {([['mobile', 'Mobile (2:1)'], ['desktop', 'Desktop (5:1)']] as const).map(([id, text]) => (
        <button
          key={id}
          type="button"
          onClick={() => onDeviceTabChange?.(id)}
          className={`px-[16px] ${embedded ? 'py-[10px]' : 'py-[12px]'} text-[14px] font-bold border-b-2 transition-colors ${(deviceTab === 'all' ? 'mobile' : deviceTab) === id ? 'text-[#007BFF] border-[#007BFF]' : 'text-[#71747d] border-transparent hover:text-[#303135]'}`}
        >
          {text}
        </button>
      ))}
    </div>
  ) : null;

  if (hasDesktopVersion && deviceTab === 'desktop') {
    return (
      <div className="flex flex-col gap-[20px] pb-[24px]">
        {deviceBar}
        {desktopCard}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[20px] pb-[24px]">
      {deviceBar}


      {/* Visual Illustration (Product Entry Point Only) */}
      {isProductEntryPoint && (
          <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
               <label className="text-[14px] font-bold text-[#303135]">
                  Visual Illustration
               </label>
               <div className="p-0">
                    {previewUrl ? (
                         <>
                         <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden border border-[#d8dce8] bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat group">
                            <img 
                                src={previewUrl} 
                                alt="Visual" 
                                className="w-full h-full object-contain"
                            />
                            <button 
                                type="button"
                                onClick={() => onChange({ keyVisualFile: null, keyVisualUrl: undefined })}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                         
                         {/* Scale Control for Visual Illustration */}
                         <div className="flex flex-col gap-[16px] mt-2">
                             {/* Scale */}
                            <div className="flex flex-col gap-[8px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-[14px] font-bold text-[#303135]">Image Scale</label>
                                    <div className="flex items-center gap-[8px]">
                                        <EditableSliderValue value={formData.keyVisualScale || 100} onChange={(v) => onChange({ keyVisualScale: v })} suffix="%" min={5} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
                                        <button type="button" onClick={() => onChange({ keyVisualScale: 100 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to 100%"><RotateCw size={12} /></button>
                                    </div>
                                </div>
                                <Slider
                                    value={[formData.keyVisualScale || 100]}
                                    min={5}
                                    max={200}
                                    step={1}
                                    className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                    onValueChange={(val) => onChange({ keyVisualScale: val[0] })}
                                />
                            </div>

                            {/* Flip */}
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-bold text-[#303135]">Flip</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChange({ keyVisualFlipH: !formData.keyVisualFlipH })}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipH ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                        title="Flip Horizontal"
                                    >
                                        <FlipHorizontal2 className="w-3.5 h-3.5" />
                                        Horizontal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ keyVisualFlipV: !formData.keyVisualFlipV })}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipV ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                        title="Flip Vertical"
                                    >
                                        <FlipVertical2 className="w-3.5 h-3.5" />
                                        Vertical
                                    </button>
                                </div>
                            </div>

                            {/* Rotation */}
                            <div className="flex flex-col gap-[8px]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[14px] font-bold text-[#303135]">Rotation</label>
                                        <RotateCw className="w-3.5 h-3.5 text-[#71747d]" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <StyledInput 
                                            type="number" 
                                            className="w-[60px] h-[28px] text-[12px] text-right pr-1 py-0 border-[#d8dce8] focus:border-[#007BFF]"
                                            value={formData.keyVisualRotation || 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                // Clamp between -180 and 180
                                                const clamped = Math.min(180, Math.max(-180, val));
                                                onChange({ keyVisualRotation: clamped });
                                            }}
                                            min={-180}
                                            max={180}
                                        />
                                        <span className="text-[12px] font-medium text-[#71747d]">deg</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-[#71747d] font-medium w-8 text-right">-180°</span>
                                    <Slider 
                                        value={[formData.keyVisualRotation || 0]} 
                                        min={-180}
                                        max={180} 
                                        step={1} 
                                        className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                        onValueChange={(val) => onChange({ keyVisualRotation: val[0] })}
                                    />
                                    <span className="text-[10px] text-[#71747d] font-medium w-8">180°</span>
                                </div>
                            </div>
                        </div>
                        </>
                    ) : (
                         <ImageInputSelector 
                            onAssetSelected={(file, url) => {
                                if (file) onChange({ keyVisualFile: file });
                                else if (url) onChange({ keyVisualUrl: url, keyVisualFile: null });
                            }}
                            accept="image/png, image/jpeg, image/webp"
                         />
                    )}
               </div>
          </div>
      )}
      
      {/* 1. Background Settings — Desktop (5:1/4:1) standalone always syncs its image from the Mobile tab instead (see desktopCard's "Same as Mobile" block) */}
      {polaroid && <PolaroidVisualFields formData={formData} onChange={onChange} />}
      {!isDesktopStandalone && !polaroid && <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
        <label className="text-[14px] font-bold text-[#303135]">
           Background Settings
        </label>
        
        <Tabs 
            value={effectiveTab} 
            onValueChange={handleTabChange}
            className="w-full"
        >
            <TabsList className="w-full justify-start border-b border-[#e9ebef] bg-transparent p-0 mb-4 h-auto rounded-none">
                {(isSquare || isProductEntryPoint) && formData.dlpRole !== 'header-mobile' && (
                    <>
                        <TabsTrigger
                            value="color"
                            className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                        >
                            <Palette size={16} />
                            Color
                        </TabsTrigger>
                        <TabsTrigger
                            value="gradient"
                            className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                        >
                            <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-400 to-purple-500" />
                            Gradient
                        </TabsTrigger>
                    </>
                )}
                {!isProductEntryPoint && (
                <>
                <TabsTrigger 
                    value="image"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <Upload size={16} />
                    Upload
                </TabsTrigger>
                {isWhitelisted && <TabsTrigger 
                    value="generate"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <Wand2 size={16} />
                    Generate
                </TabsTrigger>}
                {isWhitelisted && <TabsTrigger 
                    value="history"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <ImageIcon size={16} />
                    Gallery
                </TabsTrigger>}
                </>
                )}
            </TabsList>

            {(isSquare || isProductEntryPoint) && (
                <>
                    <TabsContent value="color" className="mt-0 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Solid Color</Label>
                            <div className="flex items-center gap-4 bg-[#F8F9FD] p-4 rounded-lg border border-[#d8dce8]">
                                <ColorPicker
                                    value={formData.backgroundColor || '#007BFF'}
                                    onChange={(color) => onChange({ backgroundColor: color })}
                                    trigger={
                                        <button type="button" className="flex items-center gap-4 w-full text-left">
                                            <div className="relative w-[16px] h-[16px] rounded-full overflow-hidden border border-[#d8dce8] shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: formData.backgroundColor || '#007BFF' }} />
                                            <span className="text-sm text-[#71747d] font-medium uppercase">
                                                {formData.backgroundColor || '#007BFF'}
                                            </span>
                                        </button>
                                    }
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="gradient" className="mt-0 flex flex-col gap-4">
                        <GradientEditor
                            stops={formData.backgroundGradientStops || [
                                { id: '1', color: '#5BAAFF', position: 0, opacity: 100 },
                                { id: '2', color: '#007BFF', position: 100, opacity: 100 }
                            ]}
                            onChange={(stops) => onChange({ backgroundGradientStops: stops })}
                            type={formData.backgroundGradientType || 'linear'}
                            onTypeChange={(type) => onChange({ backgroundGradientType: type })}
                            angle={formData.backgroundGradientAngle ?? 135}
                            onAngleChange={(angle) => onChange({ backgroundGradientAngle: angle })}
                        />
                    </TabsContent>
                </>
            )}

            <TabsContent value="image" className="mt-0">
                {previewUrl ? (
                    <div className="flex flex-col gap-[12px]">
                        <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden border border-[#d8dce8] group bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat">
                            <Lightbox
                                trigger={
                                    <button type="button" className="w-full h-full relative cursor-zoom-in border-none p-0 bg-transparent focus:outline-none">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                                            <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                                <Maximize2 className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </button>
                                }
                            >
                                <div className="relative w-full h-full flex items-center justify-center pointer-events-auto p-4">
                                    <img 
                                        src={previewUrl} 
                                        alt="Full Preview" 
                                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat"
                                        draggable={false}
                                    />
                                </div>
                            </Lightbox>

                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange({ keyVisualFile: null, keyVisualUrl: undefined });
                                }}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-600 z-10"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Scale Control */}
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-bold text-[#303135]">Image Scale</label>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={formData.keyVisualScale || 100} onChange={(v) => onChange({ keyVisualScale: v })} suffix="%" min={5} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ keyVisualScale: 100 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to 100%"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider
                                value={[formData.keyVisualScale || 100]}
                                min={5}
                                max={200}
                                step={1}
                                className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                onValueChange={(val) => onChange({ keyVisualScale: val[0] })}
                            />
                            <p className="text-[12px] text-[#71747d] mt-[4px]">
                                💡 Tip: You can drag the image in the preview to adjust its position.
                            </p>
                        </div>

                        {/* Flip */}
                        <div className="flex items-center justify-between">
                            <label className="text-[14px] font-bold text-[#303135]">Flip</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onChange({ keyVisualFlipH: !formData.keyVisualFlipH })}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipH ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                    title="Flip Horizontal"
                                >
                                    <FlipHorizontal2 className="w-3.5 h-3.5" />
                                    Horizontal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChange({ keyVisualFlipV: !formData.keyVisualFlipV })}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipV ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                    title="Flip Vertical"
                                >
                                    <FlipVertical2 className="w-3.5 h-3.5" />
                                    Vertical
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ImageInputSelector 
                        onAssetSelected={(file, url) => {
                            if (file) {
                                onChange({ keyVisualFile: file });
                            } else if (url) {
                                onChange({ keyVisualUrl: url, keyVisualFile: null });
                            }
                        }}
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        hideAITab={true}
                        hideHistoryTab={true}
                    />
                )}
            </TabsContent>

            {isWhitelisted && <TabsContent value="generate" className="mt-0">
                <div className="p-[24px] bg-[#F8F9FD] rounded-lg border border-[#d8dce8]">
                     <AIGenerator 
                        onAssetSelected={(file, url) => {
                            if (file) {
                                onChange({ 
                                    keyVisualFile: file, 
                                    backgroundType: 'image'
                                });
                            } else if (url) {
                                onChange({ 
                                    keyVisualUrl: url, 
                                    keyVisualFile: null,
                                    backgroundType: 'image'
                                });
                            }
                        }}
                     />
                </div>
            </TabsContent>}

            {isWhitelisted && <TabsContent value="history" className="mt-0">
                <div className="p-[24px] bg-[#F8F9FD] rounded-lg border border-[#d8dce8]">
                    <HistorySelector 
                        onSelect={(url) => {
                            onChange({ 
                                keyVisualUrl: url, 
                                keyVisualFile: null,
                                backgroundType: 'image'
                            });
                        }}
                    />
                </div>
            </TabsContent>}
        </Tabs>
      </div>}

      {/* 2. Gradient Overlay — Color, then per layer: Opacity · Start · Stop */}
      {isPromoBanner && !isDesktopStandalone && !polaroid && (() => {
          const defStart = isLandscape21 ? 20 : 10; // 2:1 default overlay: start 20, stop 70
          const defEnd = isLandscape21 ? 70 : 100;
          return (
          <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px] w-full">
             <label className="text-[14px] font-bold text-[#303135]">Gradient Overlay</label>
             <p className="text-[12px] text-[#71747d] -mt-[8px]">Adjust the gradient to ensure text readability. Start = where it begins to fade, Stop = where it has faded out.</p>
             {renderOverlayEditor({
                 id: 'o',
                 color: formData.overlayColor || '#000000',
                 setColor: (v) => onChange({ overlayColor: v }),
                 l1: { opacity: formData.gradientOpacity ?? 100, start: formData.overlayGradientStop ?? defStart, stop: formData.overlayGradientEnd ?? defEnd,
                       setOpacity: (v) => onChange({ gradientOpacity: v }),
                       setStart: (v) => onChange({ overlayGradientStop: v, ...(formData.overlay2Synced ? { overlayGradientStop2: v } : {}) }),
                       setStop: (v) => onChange({ overlayGradientEnd: v, ...(formData.overlay2Synced ? { overlayGradientEnd2: v } : {}) }) },
                 enabled2: !!formData.overlay2Enabled,
                 enable2: () => onChange({ overlay2Enabled: true, overlay2Synced: true, overlay2Opacity: formData.gradientOpacity ?? 100, overlayGradientStop2: formData.overlayGradientStop ?? defStart, overlayGradientEnd2: formData.overlayGradientEnd ?? defEnd }),
                 disable2: () => onChange({ overlay2Enabled: false }),
                 l2: { opacity: formData.overlay2Opacity ?? 100, start: formData.overlayGradientStop2 ?? 40, stop: formData.overlayGradientEnd2 ?? 100,
                       setOpacity: (v) => onChange({ overlay2Opacity: v }), setStart: (v) => onChange({ overlayGradientStop2: v }), setStop: (v) => onChange({ overlayGradientEnd2: v }) },
                 synced: !!formData.overlay2Synced,
                 toggleSynced: () => onChange({ overlay2Synced: !formData.overlay2Synced, ...(!formData.overlay2Synced ? { overlayGradientStop2: formData.overlayGradientStop ?? defStart, overlayGradientEnd2: formData.overlayGradientEnd ?? defEnd } : {}) }),
                 reset: () => onChange({ overlayColor: '#000000', gradientOpacity: 100, overlayGradientStop: defStart, overlayGradientEnd: defEnd, overlay2Enabled: false, overlay2Synced: false, overlay2Opacity: 100, overlayGradientStop2: 40, overlayGradientEnd2: 100, overlayMode: 'fade', overlaySolidCoverage: 50, overlaySolidOpacity: 100, overlaySolidFill: 'color', overlaySolidGradientStops: DEFAULT_OVERLAY_GRADIENT_STOPS, overlaySolidGradientType: 'linear', overlaySolidGradientAngle: 90 }),
                 mode: formData.overlayMode ?? 'fade',
                 setMode: (v) => onChange({ overlayMode: v }),
                 coverage: formData.overlaySolidCoverage ?? 50,
                 setCoverage: (v) => onChange({ overlaySolidCoverage: v }),
                 solidOpacity: formData.overlaySolidOpacity ?? 100,
                 setSolidOpacity: (v) => onChange({ overlaySolidOpacity: v }),
                 fill: formData.overlaySolidFill ?? 'color',
                 setFill: (v) => onChange({ overlaySolidFill: v }),
                 gradStops: formData.overlaySolidGradientStops ?? DEFAULT_OVERLAY_GRADIENT_STOPS,
                 setGradStops: (v) => onChange({ overlaySolidGradientStops: v }),
                 gradType: formData.overlaySolidGradientType ?? 'linear',
                 setGradType: (v) => onChange({ overlaySolidGradientType: v }),
                 gradAngle: formData.overlaySolidGradientAngle ?? 90,
                 setGradAngle: (v) => onChange({ overlaySolidGradientAngle: v }),
             })}
          </div>
          );
      })()}

      {/* 3. Logos Section */}
      <div className="flex flex-col gap-[20px] w-full">
        
        {/* Product Icon (Square Only) */}
        {isSquare && (
            <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                <div className="flex items-center justify-between">
                    <Label className="text-[14px] font-bold text-[#303135]">Product Icon</Label>
                </div>
                <DropdownSelect
                    options={getAssetOptions('Product Icon')}
                    value={formData.productIcon || ''}
                    onChange={(val) => onChange({ productIcon: val })}
                    placeholder="Select Product Icon"
                />
            </div>
        )}

        {isDesktopStandalone && desktopCard}

        {/* Campaign Logo */}
        {!isProductEntryPoint && (
        <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
            <div className="flex items-center justify-between">
                <Label htmlFor="show-campaign-logo" className="text-[14px] font-bold text-[#303135]">Campaign logo (optional)</Label>
                <Switch 
                    id="show-campaign-logo" 
                    checked={formData.showCampaignLogo}
                    onCheckedChange={(checked) => onChange({ showCampaignLogo: checked })}
                    className="data-[state=checked]:bg-[#007BFF]"
                />
            </div>
            {formData.showCampaignLogo && (
                <div className="flex flex-col gap-[12px]">
                    <DropdownSelect
                        options={getAssetOptions('Campaign')}
                        value={formData.campaignLogo || ''}
                        onChange={(val) => onChange({ campaignLogo: val })}
                        placeholder="Select Campaign logo"
                        onUploadNew={(q) => openLogoUpload({ kind: 'campaign' }, q)}
                    />
                    {formData.campaignLogo && (
                        <button type="button" onClick={() => onChange({ campaignLogo: '' })} className="self-start flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors">
                            <RotateCw size={12} />
                            Reset logo
                        </button>
                    )}
                    {isDesktopStandalone ? desktopCampaignControls : (
                    <div className="flex flex-col gap-[12px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-[#303135]">Transform</span>
                            <button
                                type="button"
                                onClick={() => onChange({ campaignLogoScale: cScale, campaignLogoX: cPos, campaignLogoY: cPosY })}
                                className="flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors"
                            >
                                <RotateCw size={12} />
                                Reset
                            </button>
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Scale</span>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={Math.round((formData.campaignLogoScale ?? cScale) * 100)} onChange={(v) => onChange({ campaignLogoScale: v / 100 })} suffix="%" min={50} max={500} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ campaignLogoScale: cScale })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset scale"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider
                                min={50}
                                max={500}
                                step={5}
                                value={[(formData.campaignLogoScale ?? cScale) * 100]}
                                onValueChange={([val]) => onChange({ campaignLogoScale: val / 100 })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Position X</span>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={formData.campaignLogoX ?? cPos} onChange={(v) => onChange({ campaignLogoX: v })} suffix="px" min={-100} max={400} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ campaignLogoX: cPos })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset position X"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider
                                min={-100}
                                max={400}
                                step={1}
                                value={[formData.campaignLogoX ?? cPos]}
                                onValueChange={([val]) => onChange({ campaignLogoX: val })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Position Y</span>
                                <div className="flex items-center gap-[8px]">
                                    <span className="text-[13px] font-semibold text-[#007BFF]">{formData.campaignLogoY ?? cPosY}px</span>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ campaignLogoY: formData.partnerLogoY ?? pPos })}
                                        className="text-[#71747d] hover:text-[#007BFF] transition-colors"
                                        title="Sync with Partner logo Position Y"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </div>
                            <Slider
                                min={-100}
                                max={400}
                                step={2}
                                value={[formData.campaignLogoY ?? cPosY]}
                                onValueChange={([val]) => onChange({ campaignLogoY: val })}
                                className="w-full"
                            />
                        </div>
                    </div>
                    )}
                </div>
            )}
        </div>
        )}

        {/* Partner Logo */}
        {(!isSquare || formData.dlpRole === 'header-mobile') && !isProductEntryPoint && (
        <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
            <div className="flex items-center justify-between">
                <Label htmlFor="show-partner-logo" className="text-[14px] font-bold text-[#303135]">Partner logo (optional)</Label>
                <Switch 
                    id="show-partner-logo" 
                    checked={formData.showPartnerLogo}
                    onCheckedChange={handlePartnerLogoToggle}
                    className="data-[state=checked]:bg-[#007BFF]"
                />
            </div>
            
            {formData.showPartnerLogo && (
                <div className="flex flex-col gap-[20px] pl-[4px]">
                    {formData.partnerLogos.map((slot, index) => (
                        <div key={slot.id} className={`flex flex-col gap-[12px] ${index > 0 ? 'border-t border-[#e9ebef] pt-[16px]' : ''}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] text-[#303135]">Slot {index + 1}</span>
                                {slot.logo && (
                                    <button
                                        type="button"
                                        onClick={() => updatePartnerSlot(slot.id, 'logo', '')}
                                        className="ml-auto mr-[8px] flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors"
                                        title="Clear the selected logo"
                                    >
                                        <RotateCw size={12} />
                                        Reset logo
                                    </button>
                                )}
                                {formData.partnerLogos.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => removePartnerSlot(slot.id)}
                                        className="text-[#71747d] hover:text-[#d4183d]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Type Selection */}
                            <div className="grid grid-cols-2 gap-x-[24px] gap-y-[12px]">
                                {(['Payment', 'Airlines', 'Hotel', 'Brand & Entity', 'Partner', 'Product Icon', 'Other'] as const).map(type => {
                                    const isBrandEntity = type === 'Brand & Entity';
                                    const targetCategory = type === 'Other' ? 'Others' : isBrandEntity ? 'Entity Logo' : type;
                                    const hasData = assets.some(a => a.category === targetCategory || (isBrandEntity && a.category === 'brand-entity-logo'));

                                    if (!hasData) return null;

                                    return (
                                        <Radio
                                            key={type}
                                            name={`partner-type-${slot.id}`}
                                            checked={slot.type === type}
                                            onChange={() => updatePartnerSlot(slot.id, 'type', type)}
                                        >
                                            <span className="text-[14px] text-[#303135]">{type}</span>
                                        </Radio>
                                    );
                                })}
                            </div>

                            {/* Logo Dropdown */}
                            <DropdownSelect
                                options={getAssetOptions(slot.type)}
                                value={slot.logo || ''}
                                onChange={(val) => updatePartnerSlot(slot.id, 'logo', val)}
                                placeholder="Select logo"
                                onUploadNew={(q) => openLogoUpload({ kind: 'partner', slotId: slot.id, type: slot.type }, q)}
                            />
                        </div>
                    ))}

                    {formData.partnerLogos.length < 3 && (
                    <button
                        type="button"
                        onClick={addPartnerSlot}
                        className="flex items-center justify-center gap-[6px] text-[#007BFF] font-bold text-[14px] mt-[8px] hover:underline"
                    >
                        <div className="bg-[#007BFF] rounded-full p-[2px]">
                            <Plus className="w-[12px] h-[12px] text-white" />
                        </div>
                        Add slot
                    </button>
                    )}

                    {!isDesktopStandalone && (
                    <div className="flex flex-col gap-[8px] pt-[4px] border-t border-[#e9ebef]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">Scale</span>
                            <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={Math.round((formData.partnerLogoScale ?? pScale) * 100)} onChange={(v) => onChange({ partnerLogoScale: v / 100 })} suffix="%" min={50} max={300} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button
                                    type="button"
                                    onClick={() => onChange({ partnerLogoScale: pScale })}
                                    className="text-[#71747d] hover:text-[#303135] transition-colors"
                                    title="Reset scale"
                                >
                                    <RotateCw size={12} />
                                </button>
                            </div>
                        </div>
                        <Slider
                            min={50}
                            max={300}
                            step={5}
                            value={[(formData.partnerLogoScale ?? pScale) * 100]}
                            onValueChange={([val]) => onChange({ partnerLogoScale: val / 100 })}
                            className="w-full"
                        />
                        <div className="flex items-center justify-between mt-[8px]">
                            <span className="text-[14px] font-bold text-[#303135]">Asset size</span>
                            <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={formData.partnerLogoAssetScale ?? 100} onChange={(v) => onChange({ partnerLogoAssetScale: v })} suffix="%" min={50} max={150} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button type="button" onClick={() => onChange({ partnerLogoAssetScale: 100 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                            </div>
                        </div>
                        <Slider min={50} max={150} step={5} value={[formData.partnerLogoAssetScale ?? 100]} onValueChange={([v]) => onChange({ partnerLogoAssetScale: v })} className="w-full" />
                        <span className="text-[12px] text-[#71747d]">Resizes the logos only — the pill keeps its size.</span>
                        <div className="flex items-center justify-between mt-[8px]">
                            <span className="text-[14px] font-bold text-[#303135]">Position Y</span>
                            <div className="flex items-center gap-[8px]">
                                <span className="text-[13px] font-semibold text-[#007BFF]">{formData.partnerLogoY ?? pPos}px</span>
                                <button
                                    type="button"
                                    onClick={() => onChange({ partnerLogoY: formData.campaignLogoY ?? cPos })}
                                    className="text-[#71747d] hover:text-[#007BFF] transition-colors"
                                    title="Sync with Campaign logo Position Y"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            </div>
                        </div>
                        <Slider
                            min={-100}
                            max={400}
                            step={2}
                            value={[formData.partnerLogoY ?? pPos]}
                            onValueChange={([val]) => onChange({ partnerLogoY: val })}
                            className="w-full"
                        />
                        <div className="flex items-center justify-between mt-[8px]">
                            <span className="text-[14px] font-bold text-[#303135]">Background</span>
                            <Switch
                                checked={formData.partnerLogoBgEnabled !== false}
                                onCheckedChange={(checked) => onChange({ partnerLogoBgEnabled: checked })}
                                className="data-[state=checked]:bg-[#007BFF]"
                            />
                        </div>
                        {formData.partnerLogoBgEnabled !== false && (
                            <div className="flex items-start gap-[10px] flex-wrap">
                                {([['N0', '#FFFFFF'], ['B100', '#E0EFFF'], ['Y500', '#FEDD00'], ['B400', '#007BFF'], ['B500', '#0064D2'], ['Black', '#000000']] as const).map(([name, hex]) => {
                                    const active = (formData.partnerLogoBg ?? '#FFFFFF').toUpperCase() === hex;
                                    return (
                                        <button key={hex} type="button" title={name} onClick={() => onChange({ partnerLogoBg: hex })} className="flex flex-col items-center gap-[4px]">
                                            <span className={`block w-[28px] h-[28px] rounded-full transition-all ${active ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`} style={{ backgroundColor: hex }} />
                                            <span className={`text-[11px] leading-none ${active ? 'font-bold text-[#303135]' : 'text-[#71747d]'}`}>{name}</span>
                                        </button>
                                    );
                                })}
                                <ColorPicker
                                    variant="chip"
                                    chipActive={!['#FFFFFF', '#E0EFFF', '#FEDD00', '#007BFF', '#0064D2', '#000000'].includes((formData.partnerLogoBg ?? '#FFFFFF').toUpperCase())}
                                    value={formData.partnerLogoBg ?? '#FFFFFF'}
                                    onChange={(v) => onChange({ partnerLogoBg: v })}
                                    defaultValue="#FFFFFF"
                                />
                            </div>
                        )}
                    </div>
                    )}
                    {isDesktopStandalone && (
                        <div className="flex flex-col gap-[8px] pt-[4px] border-t border-[#e9ebef]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Scale (synced with campaign logo)</span>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={formData.desktopPillScale ?? 100} onChange={(v) => onChange({ desktopPillScale: v })} suffix="%" min={30} max={300} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ desktopPillScale: 100 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider min={30} max={300} step={5} value={[formData.desktopPillScale ?? 100]} onValueChange={([v]) => onChange({ desktopPillScale: v })} className="w-full" />
                            <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Partner asset size</span>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={formData.desktopPartnerAssetScale ?? 160} onChange={(v) => onChange({ desktopPartnerAssetScale: v })} suffix="%" min={50} max={200} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ desktopPartnerAssetScale: 160 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider min={50} max={200} step={5} value={[formData.desktopPartnerAssetScale ?? 160]} onValueChange={([v]) => onChange({ desktopPartnerAssetScale: v })} className="w-full" />
                        </div>
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-bold text-[#303135]">Spacing between assets</span>
                            <div className="flex items-center gap-[8px]">
                                <EditableSliderValue value={formData.desktopPartnerGap ?? 36} onChange={(v) => onChange({ desktopPartnerGap: v })} suffix="px" min={16} max={80} className="text-[13px] font-semibold text-[#007BFF]" />
                                <button type="button" onClick={() => onChange({ desktopPartnerGap: 36 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset"><RotateCw size={12} /></button>
                            </div>
                        </div>
                        <Slider min={16} max={80} step={2} value={[formData.desktopPartnerGap ?? 36]} onValueChange={([v]) => onChange({ desktopPartnerGap: v })} className="w-full" />
                        <span className="text-[12px] text-[#71747d]">Never tighter than 16px.</span>
                    </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[14px] font-bold text-[#303135]">Background</span>
                                <Switch
                                    checked={formData.desktopPartnerLogoBgEnabled !== false}
                                    onCheckedChange={(checked) => onChange({ desktopPartnerLogoBgEnabled: checked })}
                                    className="data-[state=checked]:bg-[#007BFF]"
                                />
                            </div>
                            {formData.desktopPartnerLogoBgEnabled !== false && (
                                <div className="flex items-start gap-[10px] flex-wrap">
                                    {([['N0', '#FFFFFF'], ['B100', '#E0EFFF'], ['Y500', '#FEDD00'], ['B400', '#007BFF'], ['B500', '#0064D2'], ['Black', '#000000']] as const).map(([name, hex]) => {
                                        const active = (formData.desktopPartnerLogoBg ?? '#FFFFFF').toUpperCase() === hex;
                                        return (
                                            <button key={hex} type="button" title={name} onClick={() => onChange({ desktopPartnerLogoBg: hex })} className="flex flex-col items-center gap-[4px]">
                                                <span className={`block w-[28px] h-[28px] rounded-full transition-all ${active ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`} style={{ backgroundColor: hex }} />
                                                <span className={`text-[11px] leading-none ${active ? 'font-bold text-[#303135]' : 'text-[#71747d]'}`}>{name}</span>
                                            </button>
                                        );
                                    })}
                                    <ColorPicker
                                        variant="chip"
                                        chipActive={!['#FFFFFF', '#E0EFFF', '#FEDD00', '#007BFF', '#0064D2', '#000000'].includes((formData.desktopPartnerLogoBg ?? '#FFFFFF').toUpperCase())}
                                        value={formData.desktopPartnerLogoBg ?? '#FFFFFF'}
                                        onChange={(v) => onChange({ desktopPartnerLogoBg: v })}
                                        defaultValue="#FFFFFF"
                                    />
                                </div>
                            )}

                        </div>
                    )}

                </div>
            )}
        </div>
        )}

        <SingleAssetUploadDialog
            open={!!uploadTarget}
            onOpenChange={(o) => { if (!o) setUploadTarget(null); }}
            category={toAssetCategory(uploadType)}
            existingAssets={getAssetsInCategory(uploadType)}
            initialName={uploadInitialName}
            onUploaded={handleLogoUploaded}
        />

       {/* WhatsApp Variant Specific - Logo Logic */}
       {isProductEntryPoint && isWhatsAppRatio && (
           <div className="flex flex-col gap-[12px] rounded-[12px] border border-[#e9ebef] p-[16px]">
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-logo" className="text-[14px] font-bold text-[#303135]">Show Logo</Label>
                    <Switch 
                        id="show-logo" 
                        checked={formData.showLogo}
                        onCheckedChange={(checked) => onChange({ showLogo: checked })}
                        className="data-[state=checked]:bg-[#007BFF]"
                    />
                </div>
                
                {formData.showLogo && (
                    <div className="flex flex-col gap-[12px]">
                        {/* Logo Type & Selection Row */}
                        <div className="flex gap-[12px]">
                            {/* Logo Type */}
                            <div className="flex flex-col gap-[8px] flex-1">
                                <label className="text-[14px] font-medium text-[#303135]">Logo Type</label>
                                <DropdownSelect
                                    options={[
                                        { id: 'Campaign', label: 'Campaign Logo' },
                                        { id: 'Partner', label: 'Partner Logo' },
                                        { id: 'Brand', label: 'Entity Logo' }
                                    ]}
                                    value={formData.logoType || 'Campaign'}
                                    onChange={(val) => {
                                        onChange({ logoType: val as any, selectedLogoUrl: '' });
                                    }}
                                    placeholder="Select Type"
                                    disableSearch={true}
                                />
                            </div>

                            {/* Select Logo */}
                            <div className="flex flex-col gap-[8px] flex-1">
                                <label className="text-[14px] font-medium text-[#303135]">Select Logo</label>
                                <DropdownSelect
                                    options={getLogoOptions()}
                                    value={formData.selectedLogoUrl || ''}
                                    onChange={(val) => onChange({ selectedLogoUrl: val })}
                                    placeholder="Select Logo"
                                />
                            </div>
                        </div>

                        {/* Logo Scale */}
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-bold text-[#303135]">Logo Scale</label>
                                <div className="flex items-center gap-[8px]">
                                    <EditableSliderValue value={formData.logoScale ?? 60} onChange={(v) => onChange({ logoScale: v })} suffix="%" min={50} max={150} className="text-[13px] font-semibold text-[#007BFF]" />
                                    <button type="button" onClick={() => onChange({ logoScale: 60 })} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to 60%"><RotateCw size={12} /></button>
                                </div>
                            </div>
                            <Slider 
                                value={[formData.logoScale ?? 60]} 
                                min={50}
                                max={150} 
                                step={1} 
                                className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                onValueChange={(val) => onChange({ logoScale: val[0] })}
                            />
                        </div>
                    </div>
                )}
           </div>
       )}

      </div>

    </div>
  );
}