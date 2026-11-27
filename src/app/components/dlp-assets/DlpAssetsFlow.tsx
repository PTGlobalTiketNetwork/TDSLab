import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeftRight, Copy, Eye, EyeOff, Maximize2, AlertTriangle, Edit3, Trash2, Info, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '../ui/dialog';
import { Header } from '../Header';
import { supabase } from '../../../utils/supabase/client';
import { TiketBreadcrumb, TiketStepper } from '../ui/tiket-ui';
import type { TiketStepItem } from '../ui/tiket-ui';
import { Checkbox as BaseCheckbox } from '../ui/checkbox';
import { DropdownSelect } from '../create-banner/components/DropdownSelect';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { BannerService } from '../../../services/bannerService';
import { EntryPointEditor } from './EntryPointEditor';
import { LivePreview } from '../create-banner/LivePreview';
import { initialFormDataBase } from '../create-banner/CreateBanner';
import { OffscreenBannerRenderer, type OffscreenBannerRendererHandle } from '../OffscreenBannerRenderer';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { toast } from 'sonner';
import { getUserDisplayName } from '../../utils/userDisplay';
import { SETTINGS_VERSION } from '../create-banner/settingsVersion';
import { SegmentedControl } from '../ui/SegmentedControl';
import { startCreationTimer, stopCreationTimer } from '../../../utils/creationTimer';
import { buildDlpZipManifest } from '../../utils/bannerCapture';
import { Download } from 'lucide-react';
import type { BannerFormData } from '../create-banner/types';
import type { Banner } from '../../../types/banner';

// Blue like the Next button
const Checkbox = (props: React.ComponentProps<typeof BaseCheckbox>) => (
  <BaseCheckbox {...props} className="data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF] border-[#c0c3cf]" />
);

const VERTICALS = ['General', 'Accom', 'Flight', 'NFT', 'ToDos', 'Event'].map((v) => ({ id: v, label: v }));

const EP_RATIO: Record<string, BannerFormData['bannerRatio']> = {
  'ep-mobile-2x1': 'Landscape (2:1)',
  'ep-mobile-3x4': 'Portrait (3:4)',
  'ep-desktop': 'Desktop (5:1)',
  'hdr-desktop-4x1': 'Desktop (4:1)', // DLP Header desktop: the 5:1 layout on a 4:1 canvas
};

const newEntryForm = (ratio: BannerFormData['bannerRatio']): BannerFormData => ({
  ...JSON.parse(JSON.stringify(initialFormDataBase)),
  bannerCategory: 'Promo Banner',
  bannerRatio: ratio,
});

interface Props {
  userName: string;
  userId?: string;
  userAvatar?: string;
  onBack: (message?: string) => void;
  initialData?: BannerFormData; // editing a saved project
  editingId?: string;
  initialSeconds?: number; // active time already spent on this project
}

type OptionId = 'hdr-mobile' | 'hdr-desktop-4x1' | 'ep-mobile-2x1' | 'ep-mobile-3x4' | 'ep-desktop';
type StepKey = 'select' | 'header' | 'entry' | 'summary';

const OPTION_LABEL: Record<OptionId, string> = {
  'hdr-mobile': 'Mobile',
  'hdr-desktop-4x1': 'Desktop 4:1',
  'ep-mobile-2x1': 'Single/Carousel - 2:1 (Landscape)',
  'ep-mobile-3x4': 'Single/Carousel - 3:4 (Portrait)',
  'ep-desktop': 'Desktop - Single - 5:1 (Desktop)',
};

const STEP_LABEL: Record<StepKey, string> = {
  select: 'Select Option',
  header: 'Setup DLP Header',
  entry: 'Entry Point Banner',
  summary: 'Summary',
};

/**
 * DLP Assets create flow (placeholder content).
 * Steps: 1 Select Option → 2 Setup DLP Header → 3a/3b/3c Entry Point Banner (only the checked ones) → 4 Summary.
 */
export function DlpAssetsFlow({ userName, userId, userAvatar, onBack, initialData, editingId, initialSeconds = 0 }: Props) {
  useEffect(() => {
    startCreationTimer(initialSeconds);
    return () => stopCreationTimer();
  }, []);
  const saved = initialData?.dlp;
  const [picked, setPicked] = useState<Partial<Record<OptionId, boolean>>>(() => saved ? {
    'hdr-mobile': saved.header.mobile,
    'hdr-desktop-4x1': saved.header.desktop,
    'ep-mobile-2x1': !!saved.entryPoints['ep-mobile-2x1'],
    'ep-mobile-3x4': !!saved.entryPoints['ep-mobile-3x4'],
    'ep-desktop': !!saved.entryPoints['ep-desktop'],
  } : { 'hdr-mobile': true, 'hdr-desktop-4x1': true }); // DLP Header: Mobile and Desktop are both required (see forcedOn)
  const [mobileRatio, setMobileRatio] = useState<'1:1' | '3:4'>(saved?.header.mobileRatio ?? '1:1');
  const [vertical, setVertical] = useState<string>(initialData?.verticalCategory === 'Hotel' ? 'Accom' : (initialData?.verticalCategory ?? ''));
  // Project name is templated as "<Vertical> - <name>": the user picks the vertical first and only types the part after the prefix
  const namePrefix = (v: string) => (v ? `${v} - ` : '');
  const [nameSuffix, setNameSuffix] = useState(() => {
    const saved = initialData?.bannerName ?? '';
    return saved.replace(/^(General|Accom|Hotel|Flight|NFT|ToDos|Event) - /, '');
  });
  const projectName = vertical && nameSuffix.trim() ? `${namePrefix(vertical)}${nameSuffix.trim()}` : '';
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const renderer = useRef<OffscreenBannerRendererHandle>(null);
  const [nameState, setNameState] = useState<{ status: 'idle' | 'checking' | 'valid' | 'invalid'; message?: string }>({ status: 'idle' });
  // Project names must be unique within DLP Assets only (other categories may reuse a name)
  const validateName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { setNameState({ status: 'idle' }); return false; }
    setNameState({ status: 'checking' });
    try {
      const list = await BannerService.listBanners();
      const taken = list.some((b) => b.id !== editingId && b.category === 'DLP Assets' && b.name.trim().toLowerCase() === trimmed.toLowerCase());
      if (taken) { setNameState({ status: 'invalid', message: 'Project name already exists in DLP Assets. Please choose another.' }); return false; }
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
  // Desktop ratios (5:1 / 4:1) keep their own "desktop*" overlay fields instead of the shared mobile ones.
  const isDesktopId = (id: string) => id === 'hdr-desktop-4x1' || id === 'ep-desktop';
  // Copies content (headline, discount, labels, T&C) and visuals (key visual, campaign logo, partner logos, overlay color + layer count) from one entry point to another.
  // Layout stays as it is in the target: key visual scale/position, content scale/position, overlay gradient/opacity and logo positions are per ratio.
  const copyUpdates = (from: string, to: string): Partial<BannerFormData> => {
    const src = epForm(from);
    // Overlay color/layer-count are shared concepts but live in different fields for mobile vs desktop ratios — read from whichever side the source is, write to whichever side the target is.
    const overlayColor = isDesktopId(from) ? src.desktopOverlayColor : src.overlayColor;
    const overlay2Enabled = isDesktopId(from) ? src.desktopOverlay2Enabled : src.overlay2Enabled;
    const overlayUpdates: Partial<BannerFormData> = isDesktopId(to)
      ? { desktopOverlayColor: overlayColor, desktopOverlay2Enabled: overlay2Enabled }
      : { overlayColor, overlay2Enabled };
    return {
      ...JSON.parse(JSON.stringify({
        content: src.content,
        headlineType: src.headlineType,
        discountEnabled: src.discountEnabled,
        showCampaignLogo: src.showCampaignLogo,
        campaignLogo: src.campaignLogo,
        showPartnerLogo: src.showPartnerLogo,
        partnerLogos: src.partnerLogos,
        keyVisualUrl: src.keyVisualUrl,
        keyVisualRotation: src.keyVisualRotation,
        keyVisualFlipH: src.keyVisualFlipH,
        keyVisualFlipV: src.keyVisualFlipV,
        ...overlayUpdates,
      })),
      keyVisualFile: src.keyVisualFile, // File object: shared, not cloned
    };
  };
  const EDITOR_TITLE: Record<string, string> = { 'ep-mobile-2x1': '2:1 Mobile', 'ep-mobile-3x4': '3:4 Mobile', 'ep-desktop': '5:1 Desktop', 'hdr-desktop-4x1': '4:1 Desktop Header' };
  const editorTitle = (id: string) => id === 'hdr-mobile' ? `${mobileRatio} Mobile Header` : EDITOR_TITLE[id];
  const [copyDialog, setCopyDialog] = useState<{ to: string; from: string } | null>(null);
  const applyCopy = () => {
    if (!copyDialog) return;
    epChange(copyDialog.to, copyUpdates(copyDialog.from, copyDialog.to));
    setCopyDialog(null);
  };
  // "Apply to…": push a header's content down to other banners (the other header and / or entry points)
  const [applyDialog, setApplyDialog] = useState<{ from: string; targets: string[]; preview: string } | null>(null);
  const applyToTargets = () => {
    if (!applyDialog) return;
    applyDialog.targets.forEach((t) => epChange(t, copyUpdates(applyDialog.from, t)));
    setApplyDialog(null);
  };
  const [sizeOpen, setSizeOpen] = useState<Record<string, boolean>>({});
  const [openEp, setOpenEp] = useState<Record<string, boolean>>({}); // collapsed by default
  const [index, setIndex] = useState(0);
  // Editing an existing project: every step already has content, so unlock the whole stepper right away instead of making the user click through Next each time.
  const [maxIndex, setMaxIndex] = useState(() => {
    if (!editingId) return 0;
    const hasEntryInit = !!(picked['ep-mobile-2x1'] || picked['ep-mobile-3x4'] || picked['ep-desktop']);
    return 2 + (hasEntryInit ? 1 : 0); // select + header + [entry] + summary, 0-indexed
  });
  // Summary step: DLP Header vs Entry Point Banner segmented control, each with its own "All / …" filter chips
  const [summarySection, setSummarySection] = useState<'header' | 'entry'>('header');
  const [summaryHeaderFilter, setSummaryHeaderFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [summaryEntryFilter, setSummaryEntryFilter] = useState<string>('all');

  const toggle = (id: OptionId) => setPicked((p) => ({ ...p, [id]: !p[id] }));

  const hasEntry = !!(picked['ep-mobile-2x1'] || picked['ep-mobile-3x4'] || picked['ep-desktop']);
  const hasHeader = true; // DLP Header (Mobile + Desktop) is required
  const keys: StepKey[] = ['select', ...(hasHeader ? ['header' as const] : []), ...(hasEntry ? ['entry' as const] : []), 'summary'];
  const [epForms, setEpForms] = useState<Record<string, BannerFormData>>(() => ({
    ...(saved?.entryPoints ?? {}),
    ...(saved?.header.desktopForm ? { 'hdr-desktop-4x1': saved.header.desktopForm } : {}),
    ...(saved?.header.mobileForm ? { 'hdr-mobile': saved.header.mobileForm } : {}),
  }) as Record<string, BannerFormData>);
  // Header mobile follows the 1:1 / 3:4 pick from step 1
  const epRatio = (id: string): BannerFormData['bannerRatio'] => id === 'hdr-mobile' ? (mobileRatio === '1:1' ? 'Square (1:1)' : 'Portrait (3:4)') : EP_RATIO[id];
  const epForm = (id: string): BannerFormData => ({ ...(epForms[id] ?? newEntryForm(epRatio(id))), bannerRatio: epRatio(id), ...(id === 'hdr-mobile' ? { dlpRole: 'header-mobile' as const } : id === 'hdr-desktop-4x1' ? { dlpRole: 'header-desktop' as const } : {}) });
  const epChange = (id: string, updates: Partial<BannerFormData>) => setEpForms((p) => ({ ...p, [id]: { ...(p[id] ?? newEntryForm(epRatio(id))), bannerRatio: epRatio(id), ...updates } }));

  const steps: TiketStepItem[] = keys.map((k, i) => ({ id: i + 1, label: STEP_LABEL[k] }));
  const current = keys[Math.min(index, keys.length - 1)];
  const anyPicked = Object.values(picked).some(Boolean);
  const isLast = index >= keys.length - 1;

  // Saves the whole project as one DLP Assets record. Key visuals are uploaded first, the thumbnail is the first entry point banner.
  const saveProject = async (status: 'draft' | 'published' = 'published') => {
    (status === 'draft' ? setIsSavingDraft : setIsSaving)(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.custom((t) => <TiketSnackbar id={t} message="You must be logged in to save" variant="error" />); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const userDisplay = getUserDisplayName(sessionData?.session?.user, userName || 'Unknown User');

      const id = editingId || crypto.randomUUID();
      const epIds = (['ep-mobile-2x1', 'ep-mobile-3x4', 'ep-desktop'] as const).filter((e) => picked[e]);
      const editorIds = [...epIds, 'hdr-mobile' as const, 'hdr-desktop-4x1' as const];

      // Upload key visual files once each; keep only URLs in the saved data
      const uploaded = new Map<File, string>();
      const entryPoints: Record<string, BannerFormData> = {};
      for (const e of editorIds) {
        const f = epForm(e);
        let url = f.keyVisualUrl || '';
        if (f.keyVisualFile) {
          if (!uploaded.has(f.keyVisualFile)) {
            const ext = f.keyVisualFile.name.split('.').pop() || 'png';
            const up = await BannerService.uploadImage(f.keyVisualFile, `Assets/ImageBG/${crypto.randomUUID()}.${ext}`);
            uploaded.set(f.keyVisualFile, up.url);
          }
          url = uploaded.get(f.keyVisualFile)!;
        }
        entryPoints[e] = { ...f, keyVisualUrl: url, keyVisualFile: undefined, bannerName: projectName.trim(), verticalCategory: vertical as BannerFormData['verticalCategory'] };
      }

      // Thumbnail: the DLP Header (mobile) banner, EN
      const thumbId = 'hdr-mobile';
      const thumb: Blob = await renderer.current!.captureBannerForResize({ id, name: projectName, form_data: entryPoints[thumbId] } as any);
      const path = `DLP_Assets/${id}_en.png`;
      const up = await BannerService.uploadImage(thumb, path);

      const formData = {
        ...JSON.parse(JSON.stringify(initialFormDataBase)),
        bannerName: projectName.trim(),
        bannerCategory: 'DLP Assets',
        verticalCategory: vertical,
        bannerRatio: epRatio(thumbId),
        settingsVersion: SETTINGS_VERSION,
        dlp: {
          header: { mobile: true, mobileRatio, desktop: true, desktopForm: entryPoints['hdr-desktop-4x1'], mobileForm: entryPoints['hdr-mobile'] },
          entryPoints: Object.fromEntries(epIds.map((e) => [e, entryPoints[e]])),
        },
      };

      const data = {
        id,
        name: projectName.trim(),
        category: 'DLP Assets',
        status,
        form_data: formData,
        created_by: user.id,
        creator_name: userDisplay,
        last_edited_by_id: user.id,
        last_edited_by_name: userDisplay,
        image_url_en: up.url,
        image_url_id: up.url,
        product: vertical,
        metadata: { dimension: 'DLP set', fileSize: `${(thumb.size / 1024).toFixed(2)} KB` },
      };
      if (editingId) await BannerService.updateBanner(editingId, data as any);
      else await BannerService.saveBanner(data as any);
      onBack(`"${projectName.trim()}" ${status === 'draft' ? 'saved as draft' : 'saved'}`);
    } catch (err) {
      console.error('DLP save failed', err);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to save DLP Assets" variant="error" />);
    } finally {
      (status === 'draft' ? setIsSavingDraft : setIsSaving)(false);
    }
  };

  // Summary step: "Download as ZIP" — same scale-factor picks as the single-banner download,
  // but one zip containing every sub-banner's EN + ID instead of per-language PNGs.
  const [zipScaleOpen, setZipScaleOpen] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  // Summary step: download a single sub-banner's EN + ID PNGs (no ZIP) from its preview card.
  const [cardDownloadOpen, setCardDownloadOpen] = useState<string | null>(null);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const downloadCard = async (id: string, title: string, scaleFactor: number) => {
    setCardDownloadOpen(null);
    setDownloadingCardId(id);
    try {
      const banner = { name: `${projectName.trim() || 'DLP Assets'} - ${title}`, form_data: epForm(id) } as unknown as Banner;
      await renderer.current?.downloadBanner(banner, scaleFactor);
    } finally {
      setDownloadingCardId(null);
    }
  };
  const downloadZip = async (scaleFactor: number) => {
    setZipScaleOpen(false);
    setIsZipping(true);
    try {
      const epIds = (['ep-mobile-2x1', 'ep-mobile-3x4', 'ep-desktop'] as const).filter((e) => picked[e]);
      const dlp = {
        header: { mobile: true, mobileRatio, desktop: true, desktopForm: epForm('hdr-desktop-4x1'), mobileForm: epForm('hdr-mobile') },
        entryPoints: Object.fromEntries(epIds.map((e) => [e, epForm(e)])),
      };
      const banners = buildDlpZipManifest(dlp);
      await renderer.current?.downloadDlpZip({ projectName: projectName.trim() || 'DLP Assets', scaleFactor, banners });
    } finally {
      setIsZipping(false);
    }
  };

  const goTo = (i: number) => { setIndex(i); setMaxIndex((m) => Math.max(m, i)); };

  const option = (id: OptionId, note?: string) => (
    <label key={id} className="flex items-center gap-[12px] px-[4px] py-[6px] rounded-[6px] cursor-pointer hover:bg-[#f8f9fd]">
      <Checkbox checked={!!picked[id]} onCheckedChange={() => toggle(id)} />
      <div className="flex flex-col">
        <span className="text-[14px] font-medium text-[#303135]">{OPTION_LABEL[id]}</span>
        {note && <span className="text-[12px] text-[#71747d]">{note}</span>}
      </div>
    </label>
  );

  // Size preview for the info popovers: a box at the real aspect ratio laid out like the actual banner —
  // tall ratios put the content at the bottom over the key visual, wide ones put the text block on one side and the key visual on the other.
  const ratioThumb = (ratio: string, name: string, w: number, h: number, contentShare: number, side: 'bottom' | 'left' | 'right' = 'bottom') => {
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
        <div
          className="relative overflow-hidden rounded-[6px] border border-[#d8dce8] bg-gradient-to-br from-[#cfe4ff] to-[#9cc8ff]"
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
        <span className="text-[12px] font-bold text-[#303135] leading-[16px]">{ratio}</span>
        <span className="text-[11px] text-[#71747d] leading-[14px] -mt-[8px]">{name}</span>
      </div>
    );
  };

  const infoPopover = (title: string, body: React.ReactNode, width = 'w-[320px]') => (
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

  const placeholder = (text: string) => (
    <div className="flex items-center justify-center h-[240px] text-center text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8] px-[24px]">{text}</div>
  );

  const selected = (ids: OptionId[]) => ids.filter((i) => picked[i]).map((i) => (i === 'hdr-mobile' ? `Mobile ${mobileRatio}` : OPTION_LABEL[i]));
  const headerIds: OptionId[] = ['hdr-mobile', 'hdr-desktop-4x1'];

  const body = () => {
    switch (current) {
      case 'select':
        return (
          <div className="flex flex-col gap-[32px]">
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Vertical</label>
              <DropdownSelect
                options={VERTICALS}
                value={vertical}
                onChange={(v) => {
                  setVertical(v);
                  // Prefix changed, so the full name changed: re-check uniqueness
                  const full = v && nameSuffix.trim() ? `${namePrefix(v)}${nameSuffix.trim()}` : '';
                  setNameState({ status: 'idle' });
                  if (full) void validateName(full);
                }}
                placeholder="Select vertical"
              />
            </div>
            <div className="flex flex-col gap-[8px]">
              <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Project Name</label>
              <div
                className={`relative flex items-center w-full rounded-[8px] border transition-all ${!vertical ? 'bg-[#F8F9FD] border-[#d8dce8]' : nameState.status === 'invalid' ? 'bg-white border-[#ff5c5c] ring-1 ring-[#ff5c5c]' : 'bg-white border-[#d8dce8] focus-within:border-[#007BFF] focus-within:ring-1 focus-within:ring-[#007BFF]'}`}
              >
                {vertical && <span className="pl-[12px] text-[14px] font-medium text-[#71747d] whitespace-nowrap select-none">{namePrefix(vertical)}</span>}
                <input
                  type="text"
                  value={nameSuffix}
                  disabled={!vertical}
                  onChange={(e) => { setNameSuffix(e.target.value); setNameState({ status: 'idle' }); }}
                  onBlur={() => { void validateName(projectName); }}
                  placeholder={vertical ? 'Enter project name' : 'Select a vertical first'}
                  className={`flex-1 min-w-0 py-[10px] pr-10 ${vertical ? 'pl-[4px]' : 'pl-[12px]'} bg-transparent outline-none text-[14px] font-medium font-sans placeholder:text-[#9EA0A5] disabled:text-[#9EA0A5]`}
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
            {section('DLP Header', 'Required. Mobile: pick 1:1 or 3:4. Desktop: 4:1.', (
              <div className="flex flex-col gap-[8px] p-[12px] rounded-[8px] border border-[#e9ebef]">
                <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
                  <Checkbox checked disabled />
                  <span className="text-[14px] font-medium text-[#303135]">Mobile</span>
                </div>
                <div className="flex gap-[24px] ml-[32px]">
                  {(['1:1', '3:4'] as const).map((r) => (
                    <label key={r} className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#303135]">
                      <input type="radio" name="dlp-mobile-ratio" checked={mobileRatio === r} onChange={() => setMobileRatio(r)} className="accent-[#007BFF] w-[16px] h-[16px]" />
                      {r}
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
                  <Checkbox checked disabled />
                  <span className="text-[14px] font-medium text-[#303135]">{OPTION_LABEL['hdr-desktop-4x1']}</span>
                </div>
              </div>
            ), infoPopover('DLP Header sizes', (
              <div className="flex items-end gap-[16px]">
                {ratioThumb('1:1', 'Mobile · Square', 1, 1, 0.34)}
                {ratioThumb('3:4', 'Mobile · Portrait', 3, 4, 0.42)}
                {ratioThumb('4:1', 'Desktop', 4, 1, 0.55, 'right')}
              </div>
            ), 'w-auto'))}
            {section('Entry Point Banner', 'Pick the sizes you need. Each one is set up separately.', (
              <div className="flex flex-col gap-[4px] p-[12px] rounded-[8px] border border-[#e9ebef]">
                {option('ep-mobile-2x1')}
                {option('ep-mobile-3x4')}
                {option('ep-desktop')}
              </div>
            ), infoPopover('Entry Point Banner sizes', (
              <div className="flex items-end gap-[16px]">
                {ratioThumb('2:1', 'Landscape', 2, 1, 0.55, 'left')}
                {ratioThumb('3:4', 'Portrait', 3, 4, 0.42)}
                {ratioThumb('5:1', 'Desktop', 5, 1, 0.5, 'left')}
              </div>
            ), 'w-auto'))}
          </div>
        );
      case 'header':
      case 'entry': {
        const isHeader = current === 'header';
        const eps = (['ep-mobile-2x1', 'ep-mobile-3x4', 'ep-desktop'] as OptionId[]).filter((i) => picked[i]);
        // Editors on this step; content can be copied from any other editor (header ↔ entry points)
        const editors: OptionId[] = isHeader ? ['hdr-mobile', 'hdr-desktop-4x1'] : eps;
        if (!isHeader && !eps.length) return placeholder('No Entry Point Banner selected. Go back to Select Option to add one, or continue.');
        const meta: Record<string, { title: string; note: string }> = {
          'ep-mobile-2x1': { title: '2:1', note: 'Mobile · Carousel / Single' },
          'ep-mobile-3x4': { title: '3:4', note: 'Mobile · Carousel' },
          'ep-desktop': { title: '5:1', note: 'Desktop · Single banner' },
          'hdr-desktop-4x1': { title: '4:1', note: 'Desktop · DLP Header' },
          'hdr-mobile': { title: mobileRatio, note: 'Mobile · DLP Header' },
        };
        // Entry points can only copy FROM a header ("Copy from header" in the editor tabs).
        // A header is the root: it only pushes its content DOWN to other banners ("Apply to…", next to Edit in the card header).
        const copyButton = (id: OptionId) => {
          if (id.startsWith('hdr-')) return null; // headers are the root: no "Copy content from" (they use "Apply to…" instead)
          const pullSource = id === 'ep-desktop' ? 'hdr-desktop-4x1' : 'hdr-mobile';
          const btn = 'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-colors';
          return (
            <div className="flex items-center gap-[8px]">
              <button type="button" onClick={() => setCopyDialog({ to: id, from: pullSource })} className={`${btn} bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff]`}>
                <Copy size={14} />
                Copy from header
              </button>
            </div>
          );
        };
        return (
          <div className="flex flex-col gap-[16px]">
            {editors.map((id) => (
              <div key={id} className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] px-[24px]" style={{ '--ep-head-top': 'calc(var(--sticky-base, 0px) + 64px)' } as React.CSSProperties}>
                {/* Sticky while scrolling: sits under the fixed header (64px) + fixed stepper bar (64px); the editor tabs stick right below it */}
                <div className="sticky top-[var(--ep-head-top)] z-[30] -mx-[24px] px-[24px] h-[56px] bg-white rounded-t-[12px] flex items-center justify-between gap-[12px]">
                  <span className="flex items-baseline gap-[8px]">
                    <span className="text-[16px] font-bold text-[#303135]">{meta[id].title}</span>
                    <span className="text-[13px] text-[#71747d]">{meta[id].note}</span>
                  </span>
                  <div className="flex items-center gap-[8px] shrink-0">
                  {id === 'hdr-mobile' && (
                    <button
                      type="button"
                      onClick={() => epChange('hdr-mobile', { dlpNavbar: epForm('hdr-mobile').dlpNavbar === false })}
                      aria-pressed={epForm('hdr-mobile').dlpNavbar !== false}
                      title={epForm('hdr-mobile').dlpNavbar !== false ? 'Hide navbar' : 'Show navbar'}
                      className={`flex items-center gap-2 px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold border transition-colors bg-white ${epForm('hdr-mobile').dlpNavbar !== false ? 'border-[#007bff] text-[#007bff] hover:bg-[#f2f8ff]' : 'border-[#d8dce8] text-[#71747d] hover:bg-[#f8f9fd]'}`}
                    >
                      {epForm('hdr-mobile').dlpNavbar !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                      Navbar
                    </button>
                  )}
                  {id.startsWith('hdr-') && (
                    <button
                      type="button"
                      onClick={() => setApplyDialog({ from: id, targets: [], preview: '' })}
                      className="flex items-center gap-2 px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold border border-[#007bff] text-[#007bff] bg-white hover:bg-[#f2f8ff] transition-colors"
                    >
                      <ArrowLeftRight size={14} />
                      Apply to…
                    </button>
                  )}
                  {/* Edit opens the editor, Save closes it (changes are kept in the project and written when the project is saved) */}
                  <button
                    type="button"
                    onClick={() => setOpenEp((p) => ({ ...p, [id]: !p[id] }))}
                    className={`shrink-0 px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold transition-colors ${openEp[id] ? 'bg-[#007BFF] text-white hover:bg-[#0064D2]' : 'bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff]'}`}
                  >
                    {openEp[id] ? 'Save' : 'Edit'}
                  </button>
                  </div>
                </div>
                {!openEp[id] && (
                  <div className="pb-[16px] flex flex-col gap-[12px]">
                    <div className="mx-auto w-full">
                      <LivePreview formData={epForm(id)} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact actualSizeOpen={!!sizeOpen[id]} onActualSizeOpenChange={(o) => setSizeOpen((p) => ({ ...p, [id]: o }))} />
                    </div>
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setSizeOpen((p) => ({ ...p, [id]: true }))} className="p-2 rounded-md bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] transition-colors" title="Preview full size" aria-label="Preview full size">
                        <Maximize2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
                {openEp[id] && (
                  <div className="flex flex-col gap-[16px] pb-[16px]">
                    <EntryPointEditor formData={epForm(id)} onChange={(u) => epChange(id, u)} tabsExtra={copyButton(id)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      case 'summary': {
        const entryRatios: [string, string][] = [['ep-mobile-2x1', '2:1'], ['ep-mobile-3x4', '3:4'], ['ep-desktop', '5:1']].filter(([id]) => picked[id as OptionId]) as [string, string][];
        const chip = (active: boolean, label: string, onClick: () => void) => (
          <button key={label} type="button" onClick={onClick} className={`px-[14px] py-[6px] rounded-full text-[13px] font-bold border transition-colors ${active ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-white text-[#71747d] border-[#d8dce8] hover:bg-[#f8f9fd]'}`}>
            {label}
          </button>
        );
        // Full width, stacked one per row: LivePreview's own fitZoom (via ResizeObserver) needs a stable container to measure —
        // side by side in a flex-wrap row, cards fight each other for width and glitch/overlap.
        // The navbar overlay is a preview-only aid for the editor steps (never baked into the exported asset,
        // see bannerCapture.ts's data-dlp-navbar filter) — Summary previews what gets exported, so hide it here too.
        const previewCard = (id: string, title: string) => (
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
                <PopoverContent className="w-[220px] p-4 bg-white" align="end" sideOffset={8}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Download EN + ID</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 1.5, 2, 3].map((factor) => (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => downloadCard(id, title, factor)}
                          className="px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300"
                        >
                          {factor}x
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <LivePreview formData={{ ...epForm(id), dlpNavbar: false }} onChange={() => {}} currentStep={4} activeTab="en" deviceTab="all" compact />
          </div>
        );
        const entryPointLabels = selected(['ep-mobile-2x1', 'ep-mobile-3x4', 'ep-desktop']);
        const hasEntryPoints = entryPointLabels.length > 0;
        const activeSection = hasEntryPoints ? summarySection : 'header';
        return (
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center justify-between gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <span className="text-[20px] font-bold text-[#303135]">{projectName.trim() || '-'}</span>
                {vertical && <span className="px-[12px] py-[4px] rounded-[8px] bg-[#e7f2ff] text-[#007bff] text-[14px] font-bold">{vertical}</span>}
              </div>
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
                <PopoverContent className="w-[220px] p-4 bg-white" align="end" sideOffset={8}>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Export size</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 1.5, 2, 3].map((factor) => (
                        <button
                          key={factor}
                          type="button"
                          onClick={() => downloadZip(factor)}
                          className="px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300"
                        >
                          {factor}x
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-[16px]">
              <SegmentedControl
                items={[{ id: 'header', label: 'DLP Header' }, ...(hasEntryPoints ? [{ id: 'entry', label: 'Entry Point Banner' }] : [])]}
                activeId={activeSection}
                onChange={(id) => setSummarySection(id as 'header' | 'entry')}
                fullWidth
              />
              {activeSection === 'header' ? (
                <>
                  <div className="flex gap-[8px]">
                    {chip(summaryHeaderFilter === 'all', 'All', () => setSummaryHeaderFilter('all'))}
                    {chip(summaryHeaderFilter === 'mobile', 'Mobile', () => setSummaryHeaderFilter('mobile'))}
                    {chip(summaryHeaderFilter === 'desktop', 'Desktop', () => setSummaryHeaderFilter('desktop'))}
                  </div>
                  <div className="flex flex-col gap-[24px]">
                    {(summaryHeaderFilter === 'all' || summaryHeaderFilter === 'mobile') && previewCard('hdr-mobile', `Mobile ${mobileRatio}`)}
                    {(summaryHeaderFilter === 'all' || summaryHeaderFilter === 'desktop') && previewCard('hdr-desktop-4x1', 'Desktop 4:1')}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-[8px]">
                    {chip(summaryEntryFilter === 'all', 'All', () => setSummaryEntryFilter('all'))}
                    {entryRatios.map(([id, label]) => chip(summaryEntryFilter === id, label, () => setSummaryEntryFilter(id)))}
                  </div>
                  <div className="flex flex-col gap-[24px]">
                    {entryRatios.length === 0
                      ? placeholder('No Entry Point Banner selected.')
                      : entryRatios.filter(([id]) => summaryEntryFilter === 'all' || summaryEntryFilter === id).map(([id, label]) => previewCard(id, label))}
                  </div>
                </>
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
      {/* Copy content (pull): an entry point can only copy from a header; a header can copy from the other header */}
      <Dialog open={!!copyDialog} onOpenChange={(o) => { if (!o) setCopyDialog(null); }}>
        <DialogContent className="w-[min(1100px,96vw)] max-w-none sm:max-w-none max-h-[92vh] overflow-auto p-[24px]">
          <DialogTitle className="text-[18px] font-bold text-[#303135]">{copyDialog && copyDialog.to.startsWith('hdr-') ? 'Copy content from the other header' : 'Copy content from the DLP Header'}</DialogTitle>
          {copyDialog && (() => {
            const sources = (['hdr-mobile', 'hdr-desktop-4x1'] as const).filter((o) => o !== copyDialog.to);
            const fromForm = epForm(copyDialog.from);
            const newForm = { ...epForm(copyDialog.to), ...copyUpdates(copyDialog.from, copyDialog.to) } as BannerFormData;
            const pane = (title: string, f: BannerFormData) => (
              <div className="flex flex-col gap-[8px] min-w-0">
                <span className="text-[14px] font-bold text-[#303135]">{title}</span>
                <LivePreview formData={f} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact />
              </div>
            );
            return (
              <div className="flex flex-col gap-[20px]">
                {sources.length > 1 && (
                  <div className="flex flex-col gap-[8px]">
                    <span className="text-[13px] text-[#71747d]">Copy from</span>
                    <div className="flex flex-wrap gap-[8px]">
                      {sources.map((o) => (
                        <button key={o} type="button" onClick={() => setCopyDialog({ ...copyDialog, from: o })}
                          className={`px-[12px] py-[6px] rounded-full text-[14px] font-bold border transition-colors ${copyDialog.from === o ? 'bg-[#007BFF] text-white border-[#007BFF]' : 'bg-white text-[#303135] border-[#d8dce8] hover:bg-[#f8f9fd]'}`}>
                          {editorTitle(o)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-[16px] items-start">
                  {pane(`EN / ID (from) · ${editorTitle(copyDialog.from)}`, fromForm)}
                  <ArrowRight className="hidden lg:block w-[24px] h-[24px] text-[#71747d] mt-[40px]" />
                  {pane(`EN / ID (new) · ${editorTitle(copyDialog.to)}`, newForm)}
                </div>
                <p className="text-[12px] text-[#71747d]">Copies the content (headline, discount, labels, T&C) and visuals (key visual, logos). Layout, positions and scale stay as they are in {editorTitle(copyDialog.to)}.</p>
                <div className="flex justify-end gap-[8px]">
                  <button type="button" onClick={() => setCopyDialog(null)} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold text-[#303135] hover:bg-[#f8f9fd]">Cancel</button>
                  <button type="button" onClick={applyCopy} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold bg-[#007BFF] text-white hover:bg-[#0064D2]">Copy content</button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* Apply to… (push): send a header's content down to the other banners */}
      <Dialog open={!!applyDialog} onOpenChange={(o) => { if (!o) setApplyDialog(null); }}>
        <DialogContent className="w-[min(1100px,96vw)] max-w-none sm:max-w-none max-h-[92vh] overflow-auto p-[24px]">
          <DialogTitle className="text-[18px] font-bold text-[#303135]">{applyDialog ? `Apply ${editorTitle(applyDialog.from)} to other banners` : ''}</DialogTitle>
          {applyDialog && (() => {
            const targetsAll = (['hdr-mobile', 'hdr-desktop-4x1', 'ep-mobile-2x1', 'ep-mobile-3x4', 'ep-desktop'] as const).filter((o) => o !== applyDialog.from && (o.startsWith('hdr') || picked[o]));
            const toggleTarget = (t: string) => {
              const next = applyDialog.targets.includes(t) ? applyDialog.targets.filter((x) => x !== t) : [...applyDialog.targets, t];
              setApplyDialog({ ...applyDialog, targets: next, preview: next.includes(applyDialog.preview) ? applyDialog.preview : (next[0] ?? applyDialog.preview) });
            };
            const fromForm = epForm(applyDialog.from);
            const previewTarget = applyDialog.preview || applyDialog.from;
            const newForm = { ...epForm(previewTarget), ...copyUpdates(applyDialog.from, previewTarget) } as BannerFormData;
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
                          {on ? '✓ ' : ''}{editorTitle(t)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {applyDialog.targets.length > 0 && applyDialog.targets.length > 1 && (
                  <div className="flex flex-wrap items-center gap-[8px]">
                    <span className="text-[13px] text-[#71747d]">Preview of</span>
                    {applyDialog.targets.map((t) => (
                      <button key={t} type="button" onClick={() => setApplyDialog({ ...applyDialog, preview: t })}
                        className={`px-[10px] py-[4px] rounded-md text-[13px] font-bold ${applyDialog.preview === t ? 'bg-[#e7f2ff] text-[#007BFF]' : 'text-[#71747d] hover:bg-[#f8f9fd]'}`}>
                        {editorTitle(t)}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-[16px] items-start">
                  <div className="flex flex-col gap-[8px] min-w-0">
                    <span className="text-[14px] font-bold text-[#303135]">EN / ID (from) · {editorTitle(applyDialog.from)}</span>
                    <LivePreview formData={fromForm} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact />
                  </div>
                  <ArrowRight className="hidden lg:block w-[24px] h-[24px] text-[#71747d] mt-[40px]" />
                  <div className="flex flex-col gap-[8px] min-w-0">
                    <span className="text-[14px] font-bold text-[#303135]">EN / ID (new) · {applyDialog.targets.length ? editorTitle(applyDialog.preview) : '—'}</span>
                    {applyDialog.targets.length ? (
                      <LivePreview formData={newForm} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact />
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-center text-[13px] text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8] px-[16px]">Pick at least one banner to apply to</div>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#71747d]">Overwrites the content (headline, discount, labels, T&C) and visuals (key visual, logos) of the selected banners. Their layout, positions and scale stay as they are.</p>
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
            <span className="text-[16px] font-semibold leading-[20px] text-[#303135] truncate">{projectName.trim() || 'DLP Assets'}</span>
            <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} size="compact" />
          </div>
        </div>
        <div className="flex flex-col gap-[8px] items-start">
          <TiketBreadcrumb items={[{ label: 'Banners' }, { label: 'DLP Assets', onClick: () => onBack() }, { label: editingId ? 'Edit Banner' : 'Create New Banner' }]} />
          <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} />
        </div>
        <div className={current === 'entry' || current === 'header' ? 'w-full' : 'bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full p-[24px] min-h-[400px]'}>
          {body()}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                const hasChanges = anyPicked || !!vertical || !!projectName.trim();
                if (hasChanges) setIsExitModalOpen(true);
                else onBack();
              }}
              className="h-[52px] px-[24px] bg-[#ffe5e5] rounded-[8px] text-[18px] font-bold text-[#ef4444] hover:bg-[#fecaca] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || isSavingDraft || nameState.status === 'checking' || !vertical || !projectName.trim()}
              onClick={async () => {
                if (!(await validateName(projectName))) return;
                await saveProject('draft');
              }}
              className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDraft ? 'Saving...' : 'Save Draft'}
            </button>
          </div>
          <div className="flex items-center gap-4">
            {index > 0 && (
              <button type="button" onClick={() => setIndex(index - 1)} className="h-[52px] px-[24px] bg-[#e7f2ff] rounded-[8px] text-[18px] font-bold text-[#007bff] hover:bg-[#d1e6ff]">Previous</button>
            )}
            <button
              type="button"
              disabled={isSaving || isSavingDraft || nameState.status === 'checking' || (current === 'select' && (!anyPicked || !vertical || !projectName.trim()))}
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
            {/* Header */}
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle size={24} strokeWidth={2} />
                 </div>
                 <h3 className="text-[20px] font-bold text-[#303135]">
                    You have unsaved changes
                 </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExitModalOpen(false)}
                className="text-[#71747d] hover:text-[#303135] transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-[24px]">
              <p className="text-[16px] text-[#71747d] leading-relaxed">
                The banner you created will be lost if you leave this page. Choose the action you want to take:
              </p>
            </div>

            {/* Footer: same behavior as the Promo Banner flow's exit modal — Continue Editing / Save Draft side by side, Discard full width below */}
            <div className="flex flex-col gap-2 p-[24px] pt-0">
               <div className="flex gap-2 w-full">
                 <button
                   type="button"
                   onClick={() => setIsExitModalOpen(false)}
                   className="flex-1 h-[48px] px-[24px] bg-[#e7f2ff] border border-[#e7f2ff] text-[#007bff] text-[16px] font-bold rounded-[8px] hover:bg-[#d1e6ff] transition-colors flex items-center justify-center gap-2"
                 >
                   <Edit3 size={16} />
                   Continue Editing
                 </button>
                 <button
                   type="button"
                   disabled={isSavingDraft || !vertical || !projectName.trim()}
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
                onClick={() => onBack()}
                className="w-full h-[48px] px-[24px] text-[#d4183d] text-[16px] font-bold rounded-[8px] transition-colors flex items-center justify-center gap-2"
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
