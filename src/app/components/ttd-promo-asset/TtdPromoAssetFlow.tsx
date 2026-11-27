import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { useEffect, useRef, useState } from 'react';
import { useAutoSaveDraft, AutoSaveIndicator } from '@/hooks/useAutoSaveDraft';
import { AlertTriangle, ArrowLeftRight, ArrowRight, Download, Edit3, Eraser, Image as ImageIcon, Info, Loader2, Maximize2, RotateCw, Save, Trash2 } from 'lucide-react';
import { Header } from '../Header';
import { supabase } from '../../../utils/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { TiketBreadcrumb, TiketStepper } from '../ui/tiket-ui';
import type { TiketStepItem } from '../ui/tiket-ui';
import { Checkbox as BaseCheckbox } from '../ui/checkbox';
import { EditableSliderValue } from '../ui/EditableSliderValue';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { BannerService } from '../../../services/bannerService';
import { AssetService } from '../../../services/assetService';
import type { Asset } from '../../types/asset';
import { SingleAssetUploadDialog } from '../assets/SingleAssetUploadDialog';
import { DropdownSelect } from '../create-banner/components/DropdownSelect';
import { BoundingBox } from '../create-banner/components/BoundingBox';
import { EntryPointEditor } from '../dlp-assets/EntryPointEditor';
import { PolaroidCollage, migrateSavedFormData } from '../create-banner/components/PolaroidCollage';
import { LivePreview } from '../create-banner/LivePreview';
import { initialFormDataBase } from '../create-banner/CreateBanner';
import { OffscreenBannerRenderer, type OffscreenBannerRendererHandle } from '../OffscreenBannerRenderer';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { toast } from 'sonner';
import { getUserDisplayName } from '../../utils/userDisplay';
import { SETTINGS_VERSION } from '../create-banner/settingsVersion';
import { startCreationTimer, stopCreationTimer } from '../../../utils/creationTimer';
import type { BannerFormData } from '../create-banner/types';
import type { Banner } from '../../../types/banner';
import { buildTtdZipParams, DESKTOP_EXPORT_CAP_NOTE } from '../../utils/bannerCapture';
import { removeWhiteBackground } from '../../utils/removeWhiteBackground';

// Blue like the Next button
const Checkbox = (props: React.ComponentProps<typeof BaseCheckbox>) => (
  <BaseCheckbox {...props} className="data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF] border-[#c0c3cf]" />
);

type BannerItemId = 'banner2x1' | 'banner3x1' | 'banner5x1';
type OptionId = BannerItemId | 'vertical-icon';
type StepKey = 'select' | 'edit' | 'summary';

const STEP_LABEL: Record<StepKey, string> = {
  select: 'Select Option',
  edit: 'Setup Banners',
  summary: 'Summary',
};

const ITEM_RATIO: Record<BannerItemId, BannerFormData['bannerRatio']> = {
  banner2x1: 'Landscape (2:1)',
  banner3x1: 'Landscape (3:1)',
  banner5x1: 'Desktop (5:1)',
};

const ITEM_TITLE: Record<BannerItemId, string> = {
  banner2x1: 'Banner 2:1 (Single/Carousel)',
  banner3x1: 'Banner 3:1 (Single/Global Search)',
  banner5x1: 'Banner 5:1 (Single - Desktop)',
};

type TtdTemplate = NonNullable<BannerFormData['ttdTemplate']>;
const TEMPLATES: { id: TtdTemplate; label: string; hint: string }[] = [
  { id: 'gradient', label: 'Gradient', hint: 'Full-bleed key visual with a gradient overlay' },
  { id: 'highlight-2', label: 'Highlight 2 Image', hint: 'Solid background with 2 polaroid photos' },
  { id: 'highlight-3', label: 'Highlight 3 Image', hint: 'Solid background with 3 polaroid photos' },
];

const OPTION_LABEL: Record<OptionId, string> = {
  ...ITEM_TITLE,
  'vertical-icon': 'Brand Icon (1:1)',
};

// Brand Icon circle background themes (Figma file Fwm0u7aZDK9tOSi1YPI6VV, node 104:553).
type IconTheme = 'default' | 'brand-days-otw';
const ICON_THEME_GRADIENT: Record<IconTheme, string> = {
  default: 'linear-gradient(to top, #ECF8FF, #CEEAFF)',
  'brand-days-otw': 'linear-gradient(to top, #FEF8D0, #FEF2A2)',
};
const ICON_THEME_LABEL: Record<IconTheme, string> = {
  default: 'Default',
  'brand-days-otw': 'Brand Days OTW',
};

// Banner 5:1 keeps its own "desktop*" overlay fields instead of the shared ones — same split as DLP's header desktop.
const isDesktopItem = (id: BannerItemId) => id === 'banner5x1';

const newItemForm = (ratio: BannerFormData['bannerRatio']): BannerFormData => {
  const base = JSON.parse(JSON.stringify(initialFormDataBase));
  return {
    ...base,
    bannerCategory: 'Promo Banner', // Internal rendering/editing only — the project itself is saved as category 'TTD Promo Asset'
    bannerRatio: ratio,
    showPartnerLogo: true, // TTD banners default to showing the partner logo (vs. off by default for plain Promo Banner)
    // Slot 1 defaults to the 'Partner' category (vs. 'Payment' for plain Promo Banner) — TTD logos come from the Partner library.
    partnerLogos: [{ id: Math.random().toString(36).slice(2, 11), type: 'Partner' as const, logo: '' }],
    // TTD Promo Asset banners default T&C off (vs on by default for plain Promo Banner).
    content: {
      en: { ...base.content.en, termsAndCondition: false },
      id: { ...base.content.id, termsAndCondition: false },
    },
    // Banner 5:1 default content scale is 150% for TTD (vs the shared Desktop 5:1 default used by plain Promo Banner).
    ...(ratio === 'Desktop (5:1)' ? { desktopContentScale: 150 } : {}),
    // 2:1 gets the shared 125% from initialFormDataBase; 3:1 (exclusive to TTD) stays at its own 105% default.
    ...(ratio === 'Landscape (3:1)' ? { landscapeContentScale: undefined } : {}),
  };
};

interface Props {
  userName: string;
  userId?: string;
  userAvatar?: string;
  onBack: (message?: string) => void;
  initialData?: BannerFormData; // editing a saved project
  editingId?: string;
  initialSeconds?: number; // active time already spent on this project
}

/**
 * TTD Promo Asset create flow. One project, pick any combination of 4 items:
 * Banner 2:1, Banner 3:1, Banner 5:1 (Desktop), Brand Icon.
 * Steps: 1 Select Option → 2 Setup Banners → 3 Summary.
 */
export function TtdPromoAssetFlow({ userName, userId, userAvatar, onBack, initialData, editingId, initialSeconds = 0 }: Props) {
  useEffect(() => {
    startCreationTimer(initialSeconds);
    return () => stopCreationTimer();
  }, []);
  const saved = migrateSavedFormData(initialData)?.ttd;
  const [picked, setPicked] = useState<Partial<Record<OptionId, boolean>>>(() => saved ? {
    banner2x1: !!saved.banner2x1,
    banner3x1: !!saved.banner3x1,
    banner5x1: !!saved.banner5x1,
    'vertical-icon': !!saved.verticalIconUrl,
  } : { banner2x1: true, banner3x1: true, banner5x1: true, 'vertical-icon': true }); // new project: the whole package is picked by default
  const toggle = (id: OptionId) => setPicked((p) => ({ ...p, [id]: !p[id] }));
  const anyPicked = Object.values(picked).some(Boolean);

  // Project name is always prefixed "To Do - " (this flow's own vertical is fixed); the user only types the part after it.
  const NAME_PREFIX = 'To Do - ';
  const [nameSuffix, setNameSuffix] = useState(() => (initialData?.bannerName ?? '').replace(/^To Do - /, ''));
  const projectName = nameSuffix.trim() ? `${NAME_PREFIX}${nameSuffix.trim()}` : '';
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  // Draft record id: the edited record, or one reserved on the first (auto/manual) save of a new project
  const draftIdRef = useRef<string | undefined>(editingId);
  const draftExistsRef = useRef(!!editingId);
  const [autoSavedNewId, setAutoSavedNewId] = useState<string | undefined>(undefined);
  const renderer = useRef<OffscreenBannerRendererHandle>(null);
  const [nameState, setNameState] = useState<{ status: 'idle' | 'checking' | 'valid' | 'invalid'; message?: string }>({ status: 'idle' });
  // Project names must be unique within TTD Promo Asset only (other categories may reuse a name)
  const validateName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { setNameState({ status: 'idle' }); return false; }
    setNameState({ status: 'checking' });
    try {
      const list = await BannerService.listBanners();
      const taken = list.some((b) => b.id !== draftIdRef.current && b.category === 'TTD Promo Asset' && b.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (taken) { setNameState({ status: 'invalid', message: 'Project name already exists in TTD Promo Asset. Please choose another.' }); return false; }
      setNameState({ status: 'valid' });
      return true;
    } catch {
      setNameState({ status: 'invalid', message: 'Validation failed. Please try again.' });
      return false;
    }
  };
  const [scrolled, setScrolled] = useState(false);
  const stepBarRef = useRef<HTMLDivElement>(null);
  const { shadow: stepBarShadow } = useStickyBar(stepBarRef, scrolled);
  useEffect(() => {
    const onScroll = (e: Event) => {
      const t = e.target as HTMLElement | Document | null;
      setScrolled(Math.max(window.scrollY, (t && (t as HTMLElement).scrollTop) || 0) > 80);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, []);

  const [itemForms, setItemForms] = useState<Record<BannerItemId, BannerFormData>>(() => ({
    banner2x1: saved?.banner2x1 ?? newItemForm(ITEM_RATIO.banner2x1),
    banner3x1: saved?.banner3x1 ?? newItemForm(ITEM_RATIO.banner3x1),
    banner5x1: saved?.banner5x1 ?? newItemForm(ITEM_RATIO.banner5x1),
  }));
  // Template is picked once in Select Option and stamped on every banner (Brand Icon is unaffected).
  const [template, setTemplate] = useState<TtdTemplate>(() => saved?.banner2x1?.ttdTemplate ?? saved?.banner3x1?.ttdTemplate ?? saved?.banner5x1?.ttdTemplate ?? 'gradient');
  const itemForm = (id: BannerItemId): BannerFormData => ({ ...itemForms[id], bannerRatio: ITEM_RATIO[id], ttdTemplate: template });
  const itemChange = (id: BannerItemId, updates: Partial<BannerFormData>) => setItemForms((p) => ({ ...p, [id]: { ...p[id], bannerRatio: ITEM_RATIO[id], ...updates } }));

  // "Apply to…": push one banner's content (headline, discount, labels, logos, key visual) down to any other picked banner(s).
  // Layout stays as it is in each target: key visual scale/position, content scale/position, overlay and logo positions are per banner.
  const copyUpdates = (from: BannerItemId, to: BannerItemId): Partial<BannerFormData> => {
    const src = itemForm(from);
    const overlayColor = isDesktopItem(from) ? src.desktopOverlayColor : src.overlayColor;
    const overlay2Enabled = isDesktopItem(from) ? src.desktopOverlay2Enabled : src.overlay2Enabled;
    const overlayMode = isDesktopItem(from) ? src.desktopOverlayMode : src.overlayMode;
    const solidCoverage = isDesktopItem(from) ? src.desktopOverlaySolidCoverage : src.overlaySolidCoverage;
    const solidOpacity = isDesktopItem(from) ? src.desktopOverlaySolidOpacity : src.overlaySolidOpacity;
    const solidFill = isDesktopItem(from) ? src.desktopOverlaySolidFill : src.overlaySolidFill;
    const solidGradientStops = isDesktopItem(from) ? src.desktopOverlaySolidGradientStops : src.overlaySolidGradientStops;
    const solidGradientType = isDesktopItem(from) ? src.desktopOverlaySolidGradientType : src.overlaySolidGradientType;
    const solidGradientAngle = isDesktopItem(from) ? src.desktopOverlaySolidGradientAngle : src.overlaySolidGradientAngle;
    const overlayUpdates: Partial<BannerFormData> = isDesktopItem(to)
      ? { desktopOverlayColor: overlayColor, desktopOverlay2Enabled: overlay2Enabled, desktopOverlayMode: overlayMode, desktopOverlaySolidCoverage: solidCoverage, desktopOverlaySolidOpacity: solidOpacity, desktopOverlaySolidFill: solidFill, desktopOverlaySolidGradientStops: solidGradientStops, desktopOverlaySolidGradientType: solidGradientType, desktopOverlaySolidGradientAngle: solidGradientAngle }
      : { overlayColor, overlay2Enabled, overlayMode, overlaySolidCoverage: solidCoverage, overlaySolidOpacity: solidOpacity, overlaySolidFill: solidFill, overlaySolidGradientStops: solidGradientStops, overlaySolidGradientType: solidGradientType, overlaySolidGradientAngle: solidGradientAngle };
    return {
      ...JSON.parse(JSON.stringify({
        content: src.content,
        headlineFormatSynced: src.headlineFormatSynced,
        labelDiscountFormatSynced: src.labelDiscountFormatSynced,
        headlineType: src.headlineType,
        textShadow: src.textShadow,
        discountEnabled: src.discountEnabled,
        showCampaignLogo: src.showCampaignLogo,
        campaignLogo: src.campaignLogo,
        showPartnerLogo: src.showPartnerLogo,
        partnerLogos: src.partnerLogos,
        keyVisualUrl: src.keyVisualUrl,
        keyVisualRotation: src.keyVisualRotation,
        // Desktop 5:1 has its own flip (falls back to the mobile one when unset)
        ...(() => {
          const fh = isDesktopItem(from) ? (src.desktopKeyVisualFlipH ?? src.keyVisualFlipH) : src.keyVisualFlipH;
          const fv = isDesktopItem(from) ? (src.desktopKeyVisualFlipV ?? src.keyVisualFlipV) : src.keyVisualFlipV;
          return isDesktopItem(to) ? { desktopKeyVisualFlipH: fh, desktopKeyVisualFlipV: fv } : { keyVisualFlipH: fh, keyVisualFlipV: fv };
        })(),
        polaroidImages: src.polaroidImages,
        polaroidBg: src.polaroidBg,
        polaroidBgMode: src.polaroidBgMode,
        polaroidGradient: src.polaroidGradient,
        polaroidOrder: src.polaroidOrder,
        polaroidCrops: src.polaroidCrops,
        polaroidRotations: src.polaroidRotations,
        polaroidOverlay: src.polaroidOverlay,
        // Only the voucher colour travels: each size keeps its own on/off, position, rotation and scale
        ...(() => {
          const color = src.polaroidVouchers?.top?.color || src.polaroidVouchers?.bottom?.color;
          const dst = itemForm(to).polaroidVouchers;
          return color ? { polaroidVouchers: { ...dst, top: { ...dst?.top, color }, bottom: { ...dst?.bottom, color } } } : {};
        })(),
        ...overlayUpdates,
      })),
      keyVisualFile: src.keyVisualFile, // File object: shared, not cloned
    };
  };
  const [applyDialog, setApplyDialog] = useState<{ from: BannerItemId; targets: BannerItemId[]; preview: BannerItemId } | null>(null);
  const applyToTargets = () => {
    if (!applyDialog) return;
    applyDialog.targets.forEach((t) => itemChange(t, copyUpdates(applyDialog.from, t)));
    toast.custom((t) => <TiketSnackbar id={t} message="Content copied, adjust in other ratio manually." />, { duration: 4000 });
    setApplyDialog(null);
  };

  // Brand Icon: a simple square (1:1) image — same "pick from library or upload new" pattern as
  // Campaign/Partner logos in FormStep3, reusing the existing 'Partner' asset category.
  const [verticalIconUrl, setVerticalIconUrl] = useState<string | undefined>(saved?.verticalIconUrl);
  const [verticalIconTheme, setVerticalIconTheme] = useState<IconTheme>(saved?.verticalIconTheme || 'default');
  const [iconScale, setIconScale] = useState<number>(saved?.verticalIconScale ?? 100);
  const [iconOffsetX, setIconOffsetX] = useState<number>(saved?.verticalIconOffsetX ?? 0);
  const [iconOffsetY, setIconOffsetY] = useState<number>(saved?.verticalIconOffsetY ?? 0);
  const [assets, setAssets] = useState<Asset[]>([]);
  useEffect(() => {
    const load = () => AssetService.listAssets().then(setAssets).catch((err) => console.error('Failed to fetch assets', err));
    load();
    // Pick up assets uploaded elsewhere (e.g. the Partner-logo slot pickers) without a reload
    window.addEventListener('assets:changed', load);
    return () => window.removeEventListener('assets:changed', load);
  }, []);
  const iconAssetOptions = assets
    .filter((a) => a.category === 'Partner')
    .map((a) => ({ id: a.imageUrl, label: a.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const [iconUploadOpen, setIconUploadOpen] = useState(false);
  const [iconUploadInitialName, setIconUploadInitialName] = useState('');
  const handleIconUploaded = async (created: Asset) => {
    setAssets((prev) => [...prev, created]);
    try { setAssets(await AssetService.listAssets()); } catch (err) { console.error('Failed to refresh assets', err); }
    setVerticalIconUrl(created.imageUrl);
    setIconUploadOpen(false);
    toast.custom((t) => <TiketSnackbar id={t} message={`"${created.name}" uploaded and selected`} />, { duration: 3000 });
  };
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  // Client-side only (no AI token cost): fades near-white pixels to transparent, then stores the result.
  const handleRemoveBackground = async () => {
    if (!verticalIconUrl) return;
    setIsRemovingBg(true);
    try {
      const blob = await removeWhiteBackground(verticalIconUrl);
      const up = await BannerService.uploadImage(blob, `Assets/ImageBG/${crypto.randomUUID()}.png`);
      setVerticalIconUrl(up.url);
    } catch (err: any) {
      toast.custom((t) => <TiketSnackbar id={t} message={err?.message || 'Failed to remove background'} variant="error" />);
    } finally {
      setIsRemovingBg(false);
    }
  };

  const [openItem, setOpenItem] = useState<Record<string, boolean>>({}); // collapsed by default
  const [sizeOpen, setSizeOpen] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(() => (editingId ? 1 : 0)); // editing opens straight on Setup Banners (Select Option stays one click back)
  // Editing an existing project: every step already has content, so unlock the whole stepper right away.
  const [maxIndex, setMaxIndex] = useState(() => (editingId ? 2 : 0));
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const keys: StepKey[] = ['select', 'edit', 'summary'];
  const steps: TiketStepItem[] = keys.map((k, i) => ({ id: i + 1, label: STEP_LABEL[k] }));
  const current = keys[Math.min(index, keys.length - 1)];
  const isLast = index >= keys.length - 1;
  const goTo = (i: number) => { setIndex(i); setMaxIndex((m) => Math.max(m, i)); };

  // Picking items / naming the project is just required wizard setup, not "a banner you made" — only warn once there's
  // actual content to lose: a banner's fields differ from its fresh default (or saved baseline, when editing), an image
  // was uploaded this session, or a vertical icon was picked.
  const stripFile = (f: BannerFormData) => JSON.stringify({ ...f, keyVisualFile: undefined });
  const itemFormsKey = (forms: Record<BannerItemId, BannerFormData>) => JSON.stringify({ banner2x1: stripFile(forms.banner2x1), banner3x1: stripFile(forms.banner3x1), banner5x1: stripFile(forms.banner5x1) });
  // State (not refs) so an auto-save can move the baseline
  const [baseline, setBaseline] = useState(() => ({ forms: itemFormsKey(itemForms), iconUrl: verticalIconUrl }));
  const hasUnsavedChanges =
    !!itemForms.banner2x1.keyVisualFile || !!itemForms.banner3x1.keyVisualFile || !!itemForms.banner5x1.keyVisualFile ||
    itemFormsKey(itemForms) !== baseline.forms ||
    verticalIconUrl !== baseline.iconUrl;
  // Stepper's back chevron: previous step while mid-flow, exit (with unsaved-changes confirm) only from the first step.
  // Summary step downloads — same as DLP Assets: one ZIP with every picked item, or one banner's EN + ID.
  const [zipScaleOpen, setZipScaleOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [cardDownloadOpen, setCardDownloadOpen] = useState<string | null>(null);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const currentTtd = (): NonNullable<BannerFormData['ttd']> => ({
    ...(picked.banner2x1 ? { banner2x1: itemForm('banner2x1') } : {}),
    ...(picked.banner3x1 ? { banner3x1: itemForm('banner3x1') } : {}),
    ...(picked.banner5x1 ? { banner5x1: itemForm('banner5x1') } : {}),
    ...(picked['vertical-icon'] ? { verticalIconUrl: verticalIconUrl || '', verticalIconTheme, verticalIconScale: iconScale, verticalIconOffsetX: iconOffsetX, verticalIconOffsetY: iconOffsetY } : {}),
  });
  const downloadCard = async (id: BannerItemId, title: string, scaleFactor: number) => {
    setCardDownloadOpen(null);
    setDownloadingCardId(id);
    try {
      const banner = { name: `${projectName.trim() || 'TTD Promo Asset'} - ${title}`, form_data: itemForm(id) } as unknown as Banner;
      await renderer.current?.downloadBanner(banner, scaleFactor);
    } finally {
      setDownloadingCardId(null);
    }
  };
  const downloadZip = async (scaleFactor: number) => {
    setZipScaleOpen(false);
    setIsZipping(true);
    try {
      await renderer.current?.downloadDlpZip(buildTtdZipParams(currentTtd(), projectName.trim() || 'TTD Promo Asset', scaleFactor));
    } finally {
      setIsZipping(false);
    }
  };

  const stepperBack = () => {
    if (index > 0) setIndex(index - 1);
    else if (hasUnsavedChanges) setIsExitModalOpen(true);
    else onBack();
  };

  // silent = auto-save: no navigation, no toasts (errors are thrown to the auto-save hook)
  const saveProject = async (status: 'draft' | 'published' = 'published', { silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      (status === 'draft' ? setIsSavingDraft : setIsSaving)(true);
      await autoSave.waitForIdle();
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (silent) throw new Error('Not logged in');
        toast.custom((t) => <TiketSnackbar id={t} message="You must be logged in to save" variant="error" />); return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const userDisplay = getUserDisplayName(sessionData?.session?.user, userName || 'Unknown User');

      // Reserve the record id before any await so auto-save / manual save / publish all target the same record
      if (!draftIdRef.current) draftIdRef.current = crypto.randomUUID();
      const id = draftIdRef.current;
      const formsSnapshot = itemForms;
      const iconSnapshot = verticalIconUrl;
      const itemIds = (['banner2x1', 'banner3x1', 'banner5x1'] as const).filter((i) => picked[i]);

      // Upload key visual files once each; keep only URLs in the saved data
      const uploaded = new Map<File, string>();
      const items: Partial<Record<BannerItemId, BannerFormData>> = {};
      for (const i of itemIds) {
        const f = itemForm(i);
        let url = f.keyVisualUrl || '';
        if (f.keyVisualFile) {
          if (!uploaded.has(f.keyVisualFile)) {
            const ext = f.keyVisualFile.name.split('.').pop() || 'png';
            const up = await BannerService.uploadImage(f.keyVisualFile, `Assets/ImageBG/${crypto.randomUUID()}.${ext}`);
            uploaded.set(f.keyVisualFile, up.url);
          }
          url = uploaded.get(f.keyVisualFile)!;
        }
        items[i] = { ...f, keyVisualUrl: url, keyVisualFile: undefined, bannerName: projectName.trim() };
      }

      // Thumbnail: the first picked banner, EN (falls back to a blank 2:1 canvas if only the Brand Icon was picked)
      const thumbId = itemIds[0] ?? 'banner2x1';
      const thumb: Blob = await renderer.current!.captureBannerForResize({ id, name: projectName, form_data: items[thumbId] ?? itemForm(thumbId) } as any);
      const path = `TTD_Promo_Asset/${id}_en.png`;
      const up = await BannerService.uploadImage(thumb, path);

      const formData = {
        ...JSON.parse(JSON.stringify(initialFormDataBase)),
        bannerName: projectName.trim(),
        bannerCategory: 'TTD Promo Asset',
        verticalCategory: 'ToDos',
        bannerRatio: ITEM_RATIO[thumbId],
        settingsVersion: SETTINGS_VERSION,
        ttd: {
          ...(items.banner2x1 ? { banner2x1: items.banner2x1 } : {}),
          ...(items.banner3x1 ? { banner3x1: items.banner3x1 } : {}),
          ...(items.banner5x1 ? { banner5x1: items.banner5x1 } : {}),
          ...(picked['vertical-icon'] ? { verticalIconUrl: verticalIconUrl || '', verticalIconTheme, verticalIconScale: iconScale, verticalIconOffsetX: iconOffsetX, verticalIconOffsetY: iconOffsetY } : {}),
        },
      };

      const data = {
        id,
        name: projectName.trim(),
        category: 'TTD Promo Asset',
        status,
        product: 'ToDos', // TTD is always the To Do vertical (without it the list falls back to 'Accom')
        form_data: formData,
        created_by: user.id,
        creator_name: userDisplay,
        last_edited_by_id: user.id,
        last_edited_by_name: userDisplay,
        image_url_en: up.url,
        image_url_id: up.url,
        metadata: { dimension: 'TTD Promo Asset set', fileSize: `${(thumb.size / 1024).toFixed(2)} KB` },
      };
      if (draftExistsRef.current) await BannerService.updateBanner(id, data as any);
      else {
        await BannerService.saveBanner(data as any);
        draftExistsRef.current = true;
        if (!editingId) setAutoSavedNewId(id);
      }
      if (silent) {
        // Swap uploaded Files for their URLs (no re-upload next time) and move the unsaved-changes baseline to what was saved
        const swap = (f: BannerFormData) => (f.keyVisualFile && uploaded.has(f.keyVisualFile) ? { ...f, keyVisualUrl: uploaded.get(f.keyVisualFile)!, keyVisualFile: undefined } : f);
        const swapAll = (forms: Record<BannerItemId, BannerFormData>) => ({ banner2x1: swap(forms.banner2x1), banner3x1: swap(forms.banner3x1), banner5x1: swap(forms.banner5x1) });
        if (uploaded.size) setItemForms((p) => swapAll(p));
        setBaseline({ forms: itemFormsKey(swapAll(formsSnapshot)), iconUrl: iconSnapshot });
        return;
      }
      onBack(`"${projectName.trim()}" ${status === 'draft' ? 'saved as draft' : 'saved'}`);
    } catch (err) {
      if (silent) throw err;
      console.error('TTD Promo Asset save failed', err);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to save TTD Promo Asset" variant="error" />);
    } finally {
      if (!silent) (status === 'draft' ? setIsSavingDraft : setIsSaving)(false);
    }
  };

  // Auto-save to Drafts: same requirements as the manual Save Draft (project name, name not taken)
  const autoSave = useAutoSaveDraft({
    enabled: !isSaving && !isSavingDraft && !!projectName.trim() && nameState.status !== 'invalid' && nameState.status !== 'checking',
    isDirty: hasUnsavedChanges,
    changeKey: { itemForms, picked, template, verticalIconUrl, verticalIconTheme, iconScale, iconOffsetX, iconOffsetY, nameSuffix },
    save: () => saveProject('draft', { silent: true }),
  });
  // Discard: a new project that only exists as an auto-saved draft is deleted again
  const discard = () => {
    autoSave.stop();
    const id = autoSavedNewId || (!editingId && draftExistsRef.current ? draftIdRef.current : undefined);
    if (id) BannerService.deleteBanner(id).catch((err) => console.error('Failed to delete auto-saved draft:', err));
    onBack();
  };

  const section = (title: string, hint: string, children: React.ReactNode, info?: React.ReactNode) => (
    <div className="flex flex-col gap-[12px]">
      <div className="flex flex-col">
        <div className="flex items-center gap-[6px]">
          <span className="text-[16px] font-bold text-[#303135]">{title}</span>
          {info}
        </div>
        <span className="text-[12px] leading-[16px] text-[#71747d] mt-[4px]">{hint}</span>
      </div>
      {children}
    </div>
  );

  const infoPopover = (title: string, body: React.ReactNode, width = 'w-[280px]') => (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full text-[#71747d] hover:text-[#007BFF] hover:bg-[#e7f2ff] transition-colors shrink-0"
          aria-label={`About ${title}`}
        >
          <Info size={14} />
        </button>
      </PopoverTrigger>
      <PopoverContent className={`${width} flex flex-col gap-[12px] text-[13px] text-[#303135]`} align="start">
        <span className="text-[14px] font-bold text-[#303135]">{title}</span>
        {body}
      </PopoverContent>
    </Popover>
  );

  // Mini visual ratio thumbnail (mock banner with gradient bg + content bars) — same look as DLP's own info popovers.
  const ratioThumb = (ratio: string, name: string, w: number, h: number, contentShare: number, side: 'bottom' | 'left' | 'right' | 'icon' = 'bottom') => {
    const scale = 120 / Math.max(w, h * 1.2);
    const icon = (cls: string) => <svg className={`absolute text-white/80 ${cls}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></svg>;
    const bars = (
      <>
        <span className="h-[4px] w-[60%] rounded-full bg-[#fedd00]" />
        <span className="h-[3px] w-[40%] rounded-full bg-white/80" />
      </>
    );
    return (
      <div key={ratio} className="flex flex-col items-center gap-[8px]">
        {side === 'icon' ? (
          // Brand Icon: the circle background with the logo slot (grey square) in the middle
          <div className="flex items-center justify-center" style={{ width: Math.round(w * scale), height: Math.round(h * scale) }}>
            <div className="w-[80px] h-[80px] rounded-full flex items-center justify-center" style={{ backgroundImage: ICON_THEME_GRADIENT.default }}>
              <span className="w-[44px] h-[44px] rounded-[6px] bg-[#c0c3cf]" />
            </div>
          </div>
        ) : (
        <div
          className="relative overflow-hidden rounded-[6px] border border-[#d8dce8] bg-[#007BFF]"
          style={{ width: Math.round(w * scale), height: Math.round(h * scale) }}
        >
          {side === 'bottom' ? (
            <>
              {icon('left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2')}
              <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end gap-[3px] pb-[6px] bg-gradient-to-t from-[#303135]/85 to-transparent" style={{ height: `${contentShare * 100}%` }}>{bars}</div>
            </>
          ) : (
            <>
              {icon(`top-1/2 -translate-y-1/2 ${side === 'left' ? 'right-[22%] translate-x-1/2' : 'left-[22%] -translate-x-1/2'}`)}
              <div
                className={`absolute inset-y-0 ${side === 'left' ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'} from-[#303135]/90 from-60% to-transparent flex flex-col justify-center gap-[3px] ${side === 'left' ? 'items-start pl-[8px]' : 'items-start pl-[14px]'}`}
                style={{ width: `${contentShare * 100}%` }}
              >{bars}</div>
            </>
          )}
        </div>
        )}
        <span className="text-[12px] font-bold text-[#303135] leading-[16px]">{ratio}</span>
        <span className="text-[11px] text-[#71747d] leading-[14px] -mt-[8px]">{name}</span>
      </div>
    );
  };

  // Mini 2:1 mock of each template: text bars on the left, key visual + overlay or tilted polaroids on the right
  const templateThumb = (id: TtdTemplate) => {
    const bars = (
      <div className="absolute left-[8%] top-1/2 -translate-y-1/2 flex flex-col gap-[3px] w-[40%]">
        <div className="h-[5px] rounded-full bg-white/90 w-full" />
        <div className="h-[5px] rounded-full bg-[#fdd703] w-[70%]" />
        <div className="h-[3px] rounded-full bg-white/70 w-[80%]" />
      </div>
    );
    return (
      <div className="relative w-full aspect-[2/1] rounded-[6px] overflow-hidden" style={{ background: '#007BFF' }}>
        {id === 'gradient' && <div className="absolute inset-0 bg-gradient-to-r from-[#303135]/90 from-40% to-transparent" />}
        {/* The real 2:1 polaroid layout (empty frames), so the thumbnail matches the banner exactly */}
        {id !== 'gradient' && <PolaroidCollage formData={{ bannerRatio: 'Landscape (2:1)', ttdTemplate: id, polaroidBg: '#007BFF' } as BannerFormData} keyVisualUrl={null} showNumberBadges={false} />}
        {bars}
      </div>
    );
  };

  const option = (id: OptionId, note?: string) => (
    <label key={id} className="flex items-center gap-[12px] px-[4px] py-[6px] rounded-[6px] cursor-pointer hover:bg-[#f8f9fd]">
      <Checkbox checked={!!picked[id]} onCheckedChange={() => toggle(id)} />
      <div className="flex flex-col">
        <span className="text-[14px] font-medium text-[#303135]">{OPTION_LABEL[id]}</span>
        {note && <span className="text-[12px] text-[#71747d]">{note}</span>}
      </div>
    </label>
  );

  const axisSlider = (label: string, value: number, onChange: (v: number) => void, reset: number, min = -60, max = 60) => (
    <div className="flex flex-col gap-[4px]">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-[#71747d]">{label}</span>
        <div className="flex items-center gap-[6px]">
          <EditableSliderValue value={value} onChange={onChange} suffix={label === 'Scale' ? '%' : 'px'} min={min} max={max} className="text-[12px] font-semibold text-[#007BFF]" />
          <button type="button" onClick={() => onChange(reset)} className="text-[#71747d] hover:text-[#303135] transition-colors" title="Reset to default">
            <RotateCw size={11} />
          </button>
        </div>
      </div>
      <input type="range" min={min} max={max} step={label === 'Scale' ? 5 : 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#007BFF]" />
    </div>
  );

  const iconUploader = (
    <div className="flex flex-col gap-[16px]">
      <span className="text-[16px] font-bold text-[#303135]">Brand Icon (1:1)</span>

      <div className="flex items-stretch gap-[16px]">
        <div
          data-canvas-w={140}
          className="relative w-[140px] h-[140px] rounded-full overflow-hidden flex items-center justify-center shrink-0"
          style={{ backgroundImage: ICON_THEME_GRADIENT[verticalIconTheme] }}
        >
          {verticalIconUrl ? (
            <BoundingBox
              enabled
              style={{
                position: 'absolute', left: '50%', top: '50%', width: '66%', height: '66%',
                transform: `translate(-50%, -50%) translate(${iconOffsetX}px, ${iconOffsetY}px) scale(${iconScale / 100})`,
              }}
              offsetY={iconOffsetY} offsetUnit={1} offsetMin={-60} offsetMax={60} onOffsetChange={setIconOffsetY}
              offsetX={iconOffsetX} offsetXUnit={1} offsetXMin={-60} offsetXMax={60} onOffsetXChange={setIconOffsetX}
              scale={iconScale} scaleMin={40} scaleMax={200} onScaleChange={setIconScale}
            >
              <img src={verticalIconUrl} alt="Brand Icon" className="w-full h-full object-contain" draggable={false} />
            </BoundingBox>
          ) : (
            <ImageIcon size={24} className="text-[#aeb2be]" />
          )}
        </div>

        <div className="flex items-start gap-[16px] flex-1 min-w-0">
          <div className="flex flex-col gap-[12px] p-[16px] rounded-[8px] border border-[#e9ebef] flex-1 min-w-0">
            <span className="text-[16px] font-bold text-[#303135]">Logo</span>
            <DropdownSelect
              options={iconAssetOptions}
              value={verticalIconUrl || ''}
              onChange={(val) => setVerticalIconUrl(val)}
              placeholder="Select from Partner library"
              onUploadNew={(q) => { setIconUploadInitialName(q); setIconUploadOpen(true); }}
            />
            <div className="flex items-center gap-[12px]">
              {verticalIconUrl && (
                <button type="button" onClick={() => { setVerticalIconUrl(undefined); setIconOffsetX(0); setIconOffsetY(0); setIconScale(100); }} className="flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors">
                  <RotateCw size={12} />
                  Reset
                </button>
              )}
              {verticalIconUrl && (
                <button
                  type="button"
                  disabled={isRemovingBg}
                  onClick={handleRemoveBackground}
                  className="flex items-center gap-[4px] text-[12px] font-medium text-[#007bff] hover:text-[#0064D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Useful when a partner logo still has a white background instead of transparent"
                >
                  {isRemovingBg ? <Loader2 size={12} className="animate-spin" /> : <Eraser size={12} />}
                  {isRemovingBg ? 'Removing background…' : 'Remove background'}
                </button>
              )}
            </div>
            {axisSlider('Scale', iconScale, setIconScale, 100, 40, 200)}
            {axisSlider('Position X', iconOffsetX, setIconOffsetX, 0)}
            {axisSlider('Position Y', iconOffsetY, setIconOffsetY, 0)}
          </div>

          {/* Background — behind the logo, so it comes after it in reading order */}
          <div className="flex flex-col gap-[8px] p-[16px] rounded-[8px] border border-[#e9ebef] flex-1 min-w-0">
            <span className="text-[16px] font-bold text-[#303135]">Background</span>
            <div className="flex items-center gap-[24px]">
              {(Object.keys(ICON_THEME_GRADIENT) as IconTheme[]).map((theme) => (
                <label key={theme} className="flex items-center gap-[8px] cursor-pointer">
                  <input
                    type="radio"
                    name="vertical-icon-theme"
                    checked={verticalIconTheme === theme}
                    onChange={() => setVerticalIconTheme(theme)}
                    className="sr-only"
                  />
                  <span
                    className={`w-[32px] h-[32px] rounded-full shrink-0 border-2 transition-colors ${verticalIconTheme === theme ? 'border-[#007BFF]' : 'border-transparent'}`}
                    style={{ padding: 3, backgroundClip: 'content-box', backgroundImage: ICON_THEME_GRADIENT[theme] }}
                  />
                  <span className={`text-[14px] ${verticalIconTheme === theme ? 'font-bold text-[#303135]' : 'font-medium text-[#71747d]'}`}>
                    {ICON_THEME_LABEL[theme]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const placeholder = (text: string) => (
    <div className="flex items-center justify-center h-[240px] text-center text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8] px-[24px]">{text}</div>
  );

  const body = () => {
    switch (current) {
      case 'select':
        return (
          <div className="flex flex-col gap-[32px]">
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Project Name</label>
              <div
                className={`relative flex items-center w-full rounded-[8px] border transition-all ${nameState.status === 'invalid' ? 'bg-white border-[#ff5c5c] ring-1 ring-[#ff5c5c]' : 'bg-white border-[#d8dce8] focus-within:border-[#007BFF] focus-within:ring-1 focus-within:ring-[#007BFF]'}`}
              >
                <span className="pl-[12px] text-[14px] font-medium text-[#71747d] whitespace-nowrap select-none">{NAME_PREFIX}</span>
                <input
                  type="text"
                  value={nameSuffix}
                  onChange={(e) => { setNameSuffix(e.target.value); setNameState({ status: 'idle' }); }}
                  onBlur={() => { void validateName(projectName); }}
                  placeholder="Enter project name"
                  className="flex-1 min-w-0 py-[10px] pr-10 pl-[4px] bg-transparent outline-none text-[14px] font-medium font-sans placeholder:text-[#9EA0A5]"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {nameState.status === 'valid' && (
                    <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  )}
                  {nameState.status === 'checking' && <div className="h-4 w-4 border-2 border-[#007BFF] border-t-transparent rounded-full animate-spin" />}
                </div>
              </div>
              {nameState.status === 'invalid' && <span className="text-[12px] text-[#ff5c5c] leading-[16px]">{nameState.message}</span>}
            </div>
            {section('Template', 'Applies to Banner 2:1, 3:1 and 5:1. Brand Icon stays as it is.', (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[12px]">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id)}
                    className={`flex flex-col gap-[8px] p-[12px] rounded-[8px] border text-left transition-colors ${template === t.id ? 'border-[#007BFF] bg-[#f2f8ff] ring-1 ring-[#007BFF]' : 'border-[#e9ebef] hover:bg-[#f8f9fd]'}`}
                  >
                    {templateThumb(t.id)}
                    <span className="text-[14px] font-bold text-[#303135]">{t.label}</span>
                    <span className="text-[12px] leading-[16px] text-[#71747d]">{t.hint}</span>
                  </button>
                ))}
              </div>
            ))}
            {section('TTD Banner Package', 'Pick the items you need. Each one is set up separately.', (
              <div className="flex flex-col gap-[4px] p-[12px] rounded-[8px] border border-[#e9ebef]">
                {option('banner2x1')}
                {option('banner3x1')}
                {option('banner5x1')}
                {option('vertical-icon')}
              </div>
            ), infoPopover('TTD Banner Package', (
              <div className="flex items-end gap-[16px]">
                {ratioThumb('2:1', 'Single/Carousel', 2, 1, 0.55, 'left')}
                {ratioThumb('3:1', 'Single/Global Search', 3, 1, 0.5, 'left')}
                {ratioThumb('5:1', 'Single - Desktop', 5, 1, 0.45, 'right')}
                {ratioThumb('1:1', 'Brand Icon', 1, 1, 0, 'icon')}
              </div>
            ), 'w-auto'))}
          </div>
        );
      case 'edit': {
        const editors: BannerItemId[] = (['banner2x1', 'banner3x1', 'banner5x1'] as const).filter((i) => picked[i]);
        if (!editors.length && !picked['vertical-icon']) return placeholder('Nothing selected. Go back to Select Option to add an item, or continue.');
        return (
          <div className="flex flex-col gap-[16px]">
            {editors.map((id) => (
              <div key={id} data-ttd-card className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] px-[24px] scroll-mt-[calc(var(--sticky-base,0px)+72px)]" style={{ '--ep-head-top': 'calc(var(--sticky-base, 0px) + 64px)' } as React.CSSProperties}>
                <div className="sticky top-[var(--ep-head-top)] z-[30] -mx-[24px] px-[24px] h-[56px] bg-white rounded-t-[12px] flex items-center justify-between gap-[12px]">
                  <span className="text-[16px] font-bold text-[#303135]">{ITEM_TITLE[id]}</span>
                  <div className="flex items-center gap-[8px] shrink-0">
                    {editors.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setApplyDialog({ from: id, targets: [], preview: editors.find((e) => e !== id)! })}
                        className="flex items-center gap-2 px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold border border-[#007bff] text-[#007bff] bg-white hover:bg-[#f2f8ff] transition-colors"
                      >
                        <ArrowLeftRight size={14} />
                        Apply to…
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        // Only one banner open at a time: opening one closes the others
                        const opening = !openItem[id];
                        setOpenItem(opening ? { [id]: true } : {});
                        // Closing a card above shifts this one up, so bring its header back into view
                        if (opening) { const card = (e.currentTarget as HTMLElement).closest('[data-ttd-card]'); requestAnimationFrame(() => card?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
                      }}
                      className={`px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold transition-colors ${openItem[id] ? 'bg-[#007BFF] text-white hover:bg-[#0064D2]' : 'bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff]'}`}
                    >
                      {openItem[id] ? 'Save' : 'Edit'}
                    </button>
                  </div>
                </div>
                {!openItem[id] && (
                  <div className="pb-[16px] flex flex-col gap-[12px]">
                    <div className="mx-auto w-full">
                      <LivePreview formData={itemForm(id)} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact actualSizeOpen={!!sizeOpen[id]} onActualSizeOpenChange={(o) => setSizeOpen((p) => ({ ...p, [id]: o }))} />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setSizeOpen((p) => ({ ...p, [id]: true }))} className="p-2 rounded-md bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] transition-colors" title="Preview full size" aria-label="Preview full size">
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {openItem[id] && (
                  <div className="flex flex-col gap-[16px] pb-[16px]">
                    <EntryPointEditor formData={itemForm(id)} onChange={(u) => itemChange(id, u)} previewMaxWidth="calc(55vh + 16px)" />
                  </div>
                )}
              </div>
            ))}
            {picked['vertical-icon'] && (
              <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] p-[24px]">
                {iconUploader}
              </div>
            )}
          </div>
        );
      }
      case 'summary': {
        const scalePicker = (onPick: (factor: number) => void, label: string, showCapNote = true) => (
          <PopoverContent className="w-[220px] p-4 bg-white" align="end" sideOffset={8}>
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 1.5, 2, 3].map((factor) => (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => onPick(factor)}
                    className="px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300"
                  >
                    {factor}x
                  </button>
                ))}
              </div>
              {showCapNote && <p className="text-[11px] text-gray-500">{DESKTOP_EXPORT_CAP_NOTE}</p>}
            </div>
          </PopoverContent>
        );
        const previewCard = (id: BannerItemId, title: string) => (
          <div key={id} className="flex flex-col gap-[8px] w-full">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#303135]">{title}</span>
              <Popover open={cardDownloadOpen === id} onOpenChange={(o) => setCardDownloadOpen(o ? id : null)}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={downloadingCardId === id}
                    className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-[#007bff] bg-[#e7f2ff] hover:bg-[#d1e6ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Download this banner (EN + ID)"
                  >
                    <Download size={14} />
                  </button>
                </PopoverTrigger>
                {scalePicker((factor) => downloadCard(id, title, factor), 'Download EN + ID', /desktop|5:1|4:1/i.test(`${id} ${title}`))}
              </Popover>
            </div>
            <LivePreview formData={itemForm(id)} onChange={() => {}} currentStep={4} activeTab="en" deviceTab="all" compact />
          </div>
        );
        return (
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between gap-[12px]">
              <span className="text-[20px] font-bold text-[#303135]">{projectName.trim() || '-'}</span>
              {anyPicked && (
                <Popover open={zipScaleOpen} onOpenChange={setZipScaleOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={isZipping}
                      className="flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Download size={16} />
                      {isZipping ? 'Preparing ZIP...' : 'Download as ZIP'}
                    </button>
                  </PopoverTrigger>
                  {scalePicker(downloadZip, 'Export size')}
                </Popover>
              )}
            </div>
            <div className="flex flex-col gap-[24px]">
              {!anyPicked && placeholder('Nothing selected.')}
              {picked.banner2x1 && previewCard('banner2x1', '2:1')}
              {picked.banner3x1 && previewCard('banner3x1', '3:1')}
              {picked.banner5x1 && previewCard('banner5x1', '5:1 · Desktop')}
              {picked['vertical-icon'] && (
                <div className="flex flex-col gap-[8px] w-full">
                  <span className="text-[13px] font-bold text-[#303135]">Brand Icon</span>
                  <div
                    className="w-[120px] h-[120px] rounded-full overflow-hidden flex items-center justify-center"
                    style={{ backgroundImage: ICON_THEME_GRADIENT[verticalIconTheme] }}
                  >
                    {verticalIconUrl ? (
                      <img
                        src={verticalIconUrl}
                        alt="Brand Icon"
                        className="w-[66%] h-[66%] object-contain"
                        style={{ transform: `translate(${iconOffsetX * (120 / 140)}px, ${iconOffsetY * (120 / 140)}px) scale(${iconScale / 100})` }}
                      />
                    ) : (
                      <ImageIcon size={24} className="text-[#aeb2be]" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col relative w-full overflow-x-clip" style={{ '--sticky-base': '64px' } as React.CSSProperties}>
      <OffscreenBannerRenderer ref={renderer} />
      <SingleAssetUploadDialog
        open={iconUploadOpen}
        onOpenChange={setIconUploadOpen}
        category="Partner"
        existingAssets={assets.filter((a) => a.category === 'Partner')}
        initialName={iconUploadInitialName}
        onUploaded={handleIconUploaded}
      />
      {/* Apply to…: push one banner's content down to other picked banners */}
      <Dialog open={!!applyDialog} onOpenChange={(o) => { if (!o) setApplyDialog(null); }}>
        <DialogContent className="w-[min(1100px,96vw)] max-w-none sm:max-w-none max-h-[92vh] overflow-auto p-[24px]">
          <DialogTitle className="text-[18px] font-bold text-[#303135]">{applyDialog ? `Apply ${ITEM_TITLE[applyDialog.from]} to other banners` : ''}</DialogTitle>
          {applyDialog && (() => {
            const targetsAll = (['banner2x1', 'banner3x1', 'banner5x1'] as const).filter((o) => o !== applyDialog.from && picked[o]);
            const toggleTarget = (t: BannerItemId) => {
              const next = applyDialog.targets.includes(t) ? applyDialog.targets.filter((x) => x !== t) : [...applyDialog.targets, t];
              setApplyDialog({ ...applyDialog, targets: next, preview: next.includes(applyDialog.preview) ? applyDialog.preview : (next[0] ?? applyDialog.preview) });
            };
            const fromForm = itemForm(applyDialog.from);
            const previewTarget = applyDialog.targets.includes(applyDialog.preview) ? applyDialog.preview : applyDialog.from;
            const newForm = { ...itemForm(previewTarget), ...copyUpdates(applyDialog.from, previewTarget) } as BannerFormData;
            return (
              <div className="flex flex-col gap-[20px]">
                <div className="flex flex-col gap-[8px]">
                  <span className="text-[13px] text-[#71747d]">Apply to</span>
                  <div className="flex flex-wrap gap-[8px]">
                    {targetsAll.map((t) => {
                      const on = applyDialog.targets.includes(t);
                      return (
                        <button key={t} type="button" onClick={() => toggleTarget(t)}
                          className={`px-[12px] py-[6px] rounded-full text-[14px] font-bold border transition-colors ${on ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-white text-[#303135] border-[#d8dce8] hover:bg-[#f8f9fd]'}`}>
                          {on ? '✓ ' : ''}{ITEM_TITLE[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {applyDialog.targets.length > 1 && (
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="text-[13px] text-[#71747d]">Preview of</span>
                    {applyDialog.targets.map((t) => (
                      <button key={t} type="button" onClick={() => setApplyDialog({ ...applyDialog, preview: t })}
                        className={`px-[10px] py-[4px] rounded-md text-[13px] font-bold ${applyDialog.preview === t ? 'bg-[#e7f2ff] text-[#007BFF]' : 'text-[#71747d] hover:bg-[#f8f9fd]'}`}>
                        {ITEM_TITLE[t]}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-[16px] items-start">
                  <div className="flex flex-col gap-[8px] min-w-0">
                    <span className="text-[14px] font-bold text-[#303135]">EN / ID (from) · {ITEM_TITLE[applyDialog.from]}</span>
                    <LivePreview formData={fromForm} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact />
                  </div>
                  <ArrowRight className="hidden lg:block w-[24px] h-[24px] text-[#71747d] mt-[40px]" />
                  <div className="flex flex-col gap-[8px] min-w-0">
                    <span className="text-[14px] font-bold text-[#303135]">EN / ID (new) · {applyDialog.targets.length ? ITEM_TITLE[previewTarget] : '—'}</span>
                    {applyDialog.targets.length ? (
                      <LivePreview formData={newForm} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact />
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-center text-[13px] text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8] px-[16px]">Pick at least one banner to apply to</div>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#71747d]">Overwrites the content (headline, discount, labels, logos, key visual) of the selected banners. Their layout, positions and scale stay as they are.</p>
                <div className="flex justify-end gap-[8px]">
                  <button type="button" onClick={() => setApplyDialog(null)} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold text-[#303135] hover:bg-[#f8f9fd]">Cancel</button>
                  <button type="button" onClick={applyToTargets} disabled={!applyDialog.targets.length} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold bg-[#007BFF] text-white hover:bg-[#0064D2] disabled:opacity-40 disabled:cursor-not-allowed">Apply to {applyDialog.targets.length || ''} banner{applyDialog.targets.length === 1 ? '' : 's'}</button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      <Header compact flat={scrolled} fullWidth showLogo hideSearch userName={userName} userId={userId} userAvatar={userAvatar} onLogout={() => supabase.auth.signOut()} />
      <div className="mt-[88px] w-full max-w-[1200px] mx-auto px-[24px] pb-[40px] flex flex-col gap-[24px]">
        <div ref={stepBarRef}
          className={`fixed top-[64px] left-0 right-0 z-[44] bg-white border-b border-[#e9ebef] ${stepBarShadow ? STICKY_SHADOW : ''} h-[64px] transition-all duration-200 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        >
          <div className="max-w-[1200px] mx-auto px-[24px] h-full flex flex-col justify-end pb-[16px] gap-[8px]">
            <span className="text-[16px] font-semibold leading-[20px] text-[#303135] truncate">{projectName.trim() || 'TTD Promo Asset'}</span>
            <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} size="compact" onBack={stepperBack} />
          </div>
        </div>
        <div className="flex flex-col gap-[8px] items-start">
          <TiketBreadcrumb items={[{ label: 'Banners' }, { label: 'TTD Promo Asset', onClick: () => onBack() }, { label: editingId ? 'Edit Banner' : 'Create New Banner' }]} />
          <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} onBack={stepperBack} />
        </div>
        <div className={current === 'edit' ? 'w-full' : 'bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full p-[24px] min-h-[400px]'}>
          {body()}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { if (hasUnsavedChanges) setIsExitModalOpen(true); else onBack(); }}
              className="h-[52px] px-[24px] bg-[#ffe5e5] rounded-[8px] text-[18px] font-bold text-[#ef4444] hover:bg-[#fecaca] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || isSavingDraft || nameState.status === 'checking' || !projectName.trim()}
              onClick={async () => {
                if (!(await validateName(projectName))) return;
                await saveProject('draft');
              }}
              className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
            <AutoSaveIndicator status={autoSave.status} lastSavedAt={autoSave.lastSavedAt} />
          </div>
          <div className="flex items-center gap-4">
            {index > 0 && (
              <button type="button" onClick={() => setIndex(index - 1)} className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff]">Previous</button>
            )}
            <button
              type="button"
              disabled={isSaving || isSavingDraft || nameState.status === 'checking' || (current === 'select' && (!anyPicked || !projectName.trim()))}
              onClick={async () => {
                if (current === 'select' && !(await validateName(projectName))) return;
                if (isLast) await saveProject('published'); else goTo(index + 1);
              }}
              className="h-[52px] min-w-[140px] px-6 bg-[#007BFF] rounded-[8px] text-[18px] font-bold text-white hover:bg-[#0064D2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : (isLast ? 'Finish' : 'Next')}
            </button>
          </div>
        </div>
      </div>

      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] w-[480px] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle size={24} strokeWidth={2} />
                 </div>
                 <h3 className="text-[20px] font-bold text-[#303135]">You have unsaved changes</h3>
              </div>
              <button type="button" onClick={() => setIsExitModalOpen(false)} className="text-[#71747d] hover:text-[#303135] transition-colors">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="p-[24px]">
              <p className="text-[16px] text-[#71747d] leading-relaxed">
                The banner you created will be lost if you leave this page. Choose the action you want to take:
              </p>
            </div>
            <div className="flex flex-col gap-2 p-[24px] pt-0">
               <div className="flex gap-2 w-full">
                 <button type="button" onClick={() => setIsExitModalOpen(false)} className="flex-1 h-[48px] px-[24px] bg-[#e7f2ff] border border-[#e7f2ff] text-[#007bff] text-[16px] font-bold rounded-[8px] hover:bg-[#d1e6ff] transition-colors flex items-center justify-center gap-2">
                   <Edit3 size={16} />
                   Continue Editing
                 </button>
                 <button
                   type="button"
                   disabled={isSavingDraft || !projectName.trim()}
                   onClick={async () => {
                     if (!(await validateName(projectName))) return;
                     setIsExitModalOpen(false);
                     await saveProject('draft');
                   }}
                   className="flex-1 h-[48px] px-[24px] bg-[#007BFF] text-white text-[16px] font-bold rounded-[8px] hover:bg-[#0064D2] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {isSavingDraft ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       Saving...
                     </>
                   ) : (
                     <>
                       <Save size={16} />
                       Save Draft
                     </>
                   )}
                 </button>
               </div>
               <button
                type="button"
                disabled={isSaving || isSavingDraft}
                onClick={discard}
                className="w-full h-[48px] px-[24px] text-[#d4183d] text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#FFDFDF', borderColor: '#FFDFDF' }}
              >
                <Trash2 size={16} />
                Discard Banner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
