import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Edit3, Image as ImageIcon, Info, Maximize2, Save, Trash2, Upload, X } from 'lucide-react';
import { Header } from '../Header';
import { supabase } from '../../../utils/supabase/client';
import { TiketBreadcrumb, TiketStepper } from '../ui/tiket-ui';
import type { TiketStepItem } from '../ui/tiket-ui';
import { Checkbox as BaseCheckbox } from '../ui/checkbox';
import { DropdownSelect } from '../create-banner/components/DropdownSelect';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { BannerService } from '../../../services/bannerService';
import { CropAssetModal } from '../assets/CropAssetModal';
import { EntryPointEditor } from '../dlp-assets/EntryPointEditor';
import { LivePreview } from '../create-banner/LivePreview';
import { initialFormDataBase } from '../create-banner/CreateBanner';
import { OffscreenBannerRenderer, type OffscreenBannerRendererHandle } from '../OffscreenBannerRenderer';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { toast } from 'sonner';
import { getUserDisplayName } from '../../utils/userDisplay';
import { SETTINGS_VERSION } from '../create-banner/settingsVersion';
import { startCreationTimer, stopCreationTimer } from '../../../utils/creationTimer';
import type { BannerFormData } from '../create-banner/types';

// Blue like the Next button
const Checkbox = (props: React.ComponentProps<typeof BaseCheckbox>) => (
  <BaseCheckbox {...props} className="data-[state=checked]:bg-[#007BFF] data-[state=checked]:border-[#007BFF] border-[#c0c3cf]" />
);

const VERTICALS = ['General', 'Accom', 'Flight', 'NFT', 'ToDos', 'Event'].map((v) => ({ id: v, label: v }));

type BannerItemId = 'banner2x1' | 'banner3x1' | 'banner5x1';
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
  banner2x1: 'Banner 2:1',
  banner3x1: 'Banner 3:1',
  banner5x1: 'Banner 5:1',
};

const newItemForm = (ratio: BannerFormData['bannerRatio']): BannerFormData => ({
  ...JSON.parse(JSON.stringify(initialFormDataBase)),
  bannerCategory: 'Promo Banner', // Internal rendering/editing only — the project itself is saved as category 'TTD Promo Asset'
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

/**
 * TTD Promo Asset create flow. One bundled project with 4 mandatory items:
 * Banner 2:1 (Carousel / Single), Banner 3:1 (Global Search / Single), Banner 5:1 (Desktop), Vertical Icon.
 * Steps: 1 Select Option → 2 Setup Banners → 3 Summary.
 */
export function TtdPromoAssetFlow({ userName, userId, userAvatar, onBack, initialData, editingId, initialSeconds = 0 }: Props) {
  useEffect(() => {
    startCreationTimer(initialSeconds);
    return () => stopCreationTimer();
  }, []);
  const saved = initialData?.ttd;
  const [banner2x1Variant, setBanner2x1Variant] = useState<'Carousel' | 'Single'>(saved?.banner2x1.variant ?? 'Carousel');
  const [banner3x1Variant, setBanner3x1Variant] = useState<'Global Search' | 'Single'>(saved?.banner3x1.variant ?? 'Global Search');
  const [vertical, setVertical] = useState<string>(initialData?.verticalCategory === 'Hotel' ? 'Accom' : (initialData?.verticalCategory ?? ''));
  // Project name is templated as "<Vertical> - <name>": the user picks the vertical first and only types the part after the prefix
  const namePrefix = (v: string) => (v ? `${v} - ` : '');
  const [nameSuffix, setNameSuffix] = useState(() => {
    const name = initialData?.bannerName ?? '';
    return name.replace(/^(General|Accom|Hotel|Flight|NFT|ToDos|Event) - /, '');
  });
  const projectName = vertical && nameSuffix.trim() ? `${namePrefix(vertical)}${nameSuffix.trim()}` : '';
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const renderer = useRef<OffscreenBannerRendererHandle>(null);
  const [nameState, setNameState] = useState<{ status: 'idle' | 'checking' | 'valid' | 'invalid'; message?: string }>({ status: 'idle' });
  // Project names must be unique within TTD Promo Asset only (other categories may reuse a name)
  const validateName = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) { setNameState({ status: 'idle' }); return false; }
    setNameState({ status: 'checking' });
    try {
      const list = await BannerService.listBanners();
      const taken = list.some((b) => b.id !== editingId && b.category === 'TTD Promo Asset' && b.name.trim().toLowerCase() === trimmed.toLowerCase());
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
    banner2x1: saved?.banner2x1.form ?? newItemForm(ITEM_RATIO.banner2x1),
    banner3x1: saved?.banner3x1.form ?? newItemForm(ITEM_RATIO.banner3x1),
    banner5x1: saved?.banner5x1.form ?? newItemForm(ITEM_RATIO.banner5x1),
  }));
  const itemForm = (id: BannerItemId): BannerFormData => ({ ...itemForms[id], bannerRatio: ITEM_RATIO[id] });
  const itemChange = (id: BannerItemId, updates: Partial<BannerFormData>) => setItemForms((p) => ({ ...p, [id]: { ...p[id], bannerRatio: ITEM_RATIO[id], ...updates } }));

  // Vertical Icon: a simple square (1:1) image, uploaded (and cropped) once — no headline/CTA/background editing.
  const [verticalIconUrl, setVerticalIconUrl] = useState<string | undefined>(saved?.verticalIconUrl);
  const [verticalIconFile, setVerticalIconFile] = useState<File | null>(null);
  const [verticalIconPreview, setVerticalIconPreview] = useState<string | undefined>(saved?.verticalIconUrl);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const onPickIconFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };
  const onCropConfirm = (file: File) => {
    setVerticalIconFile(file);
    setVerticalIconPreview(URL.createObjectURL(file));
    setVerticalIconUrl(undefined); // superseded by the new file, uploaded on save
    setCropSrc(null);
  };

  const [openItem, setOpenItem] = useState<Record<string, boolean>>({}); // collapsed by default
  const [sizeOpen, setSizeOpen] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  // Editing an existing project: every step already has content, so unlock the whole stepper right away.
  const [maxIndex, setMaxIndex] = useState(() => (editingId ? 2 : 0));
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  const keys: StepKey[] = ['select', 'edit', 'summary'];
  const steps: TiketStepItem[] = keys.map((k, i) => ({ id: i + 1, label: STEP_LABEL[k] }));
  const current = keys[Math.min(index, keys.length - 1)];
  const isLast = index >= keys.length - 1;
  const goTo = (i: number) => { setIndex(i); setMaxIndex((m) => Math.max(m, i)); };

  const hasUnsavedChanges = !!vertical || !!projectName.trim() || !!verticalIconFile;

  const saveProject = async (status: 'draft' | 'published' = 'published') => {
    (status === 'draft' ? setIsSavingDraft : setIsSaving)(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.custom((t) => <TiketSnackbar id={t} message="You must be logged in to save" variant="error" />); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const userDisplay = getUserDisplayName(sessionData?.session?.user, userName || 'Unknown User');

      const id = editingId || crypto.randomUUID();
      const itemIds: BannerItemId[] = ['banner2x1', 'banner3x1', 'banner5x1'];

      // Upload key visual files once each; keep only URLs in the saved data
      const uploaded = new Map<File, string>();
      const items: Record<BannerItemId, BannerFormData> = {} as any;
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
        items[i] = { ...f, keyVisualUrl: url, keyVisualFile: undefined, bannerName: projectName.trim(), verticalCategory: vertical as BannerFormData['verticalCategory'] };
      }

      // Vertical Icon upload (if a new file was picked)
      let iconUrl = verticalIconUrl || '';
      if (verticalIconFile) {
        const up = await BannerService.uploadImage(verticalIconFile, `Assets/VerticalIcon/${crypto.randomUUID()}.png`);
        iconUrl = up.url;
      }

      // Thumbnail: the 2:1 banner, EN
      const thumb: Blob = await renderer.current!.captureBannerForResize({ id, name: projectName, form_data: items.banner2x1 } as any);
      const path = `TTD_Promo_Asset/${id}_en.png`;
      const up = await BannerService.uploadImage(thumb, path);

      const formData = {
        ...JSON.parse(JSON.stringify(initialFormDataBase)),
        bannerName: projectName.trim(),
        bannerCategory: 'TTD Promo Asset',
        verticalCategory: vertical,
        bannerRatio: ITEM_RATIO.banner2x1,
        settingsVersion: SETTINGS_VERSION,
        ttd: {
          banner2x1: { variant: banner2x1Variant, form: items.banner2x1 },
          banner3x1: { variant: banner3x1Variant, form: items.banner3x1 },
          banner5x1: { form: items.banner5x1 },
          verticalIconUrl: iconUrl,
        },
      };

      const data = {
        id,
        name: projectName.trim(),
        category: 'TTD Promo Asset',
        status,
        form_data: formData,
        created_by: user.id,
        creator_name: userDisplay,
        last_edited_by_id: user.id,
        last_edited_by_name: userDisplay,
        image_url_en: up.url,
        image_url_id: up.url,
        product: vertical,
        metadata: { dimension: 'TTD Promo Asset set', fileSize: `${(thumb.size / 1024).toFixed(2)} KB` },
      };
      if (editingId) await BannerService.updateBanner(editingId, data as any);
      else await BannerService.saveBanner(data as any);
      onBack(`"${projectName.trim()}" ${status === 'draft' ? 'saved as draft' : 'saved'}`);
    } catch (err) {
      console.error('TTD Promo Asset save failed', err);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to save TTD Promo Asset" variant="error" />);
    } finally {
      (status === 'draft' ? setIsSavingDraft : setIsSaving)(false);
    }
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

  const infoPopover = (title: string, body: React.ReactNode) => (
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
      <PopoverContent className="w-[280px] flex flex-col gap-[8px] text-[13px] text-[#303135]" align="start">
        <span className="text-[14px] font-bold text-[#303135]">{title}</span>
        {body}
      </PopoverContent>
    </Popover>
  );

  const variantRadios = <T extends string>(name: string, value: T, options: T[], onChange: (v: T) => void) => (
    <div className="flex gap-[24px] ml-[32px]">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-[8px] cursor-pointer text-[14px] text-[#303135]">
          <input type="radio" name={name} checked={value === opt} onChange={() => onChange(opt)} className="accent-[#007BFF] w-[16px] h-[16px]" />
          {opt}
        </label>
      ))}
    </div>
  );

  const iconUploader = (
    <div className="flex flex-col gap-[8px] p-[12px] rounded-[8px] border border-[#e9ebef]">
      <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
        <Checkbox checked disabled />
        <span className="text-[14px] font-medium text-[#303135]">Vertical Icon (1:1)</span>
      </div>
      <div className="ml-[32px] flex items-center gap-[12px]">
        {verticalIconPreview ? (
          <div className="relative w-[64px] h-[64px] rounded-[8px] overflow-hidden border border-[#d8dce8]">
            <img src={verticalIconPreview} alt="Vertical Icon" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-[64px] h-[64px] rounded-[8px] border border-dashed border-[#d8dce8] bg-[#f8f9fd] flex items-center justify-center text-[#aeb2be]">
            <ImageIcon size={20} />
          </div>
        )}
        <button
          type="button"
          onClick={() => iconInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff] transition-colors"
        >
          <Upload size={14} />
          {verticalIconPreview ? 'Change' : 'Upload'}
        </button>
        {verticalIconPreview && (
          <button
            type="button"
            onClick={() => { setVerticalIconFile(null); setVerticalIconPreview(undefined); setVerticalIconUrl(undefined); }}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-md text-[#71747d] hover:text-[#ef4444] hover:bg-[#ffe5e5] transition-colors"
            aria-label="Remove Vertical Icon"
          >
            <X size={14} />
          </button>
        )}
        <input
          ref={iconInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onPickIconFile(f); e.target.value = ''; }}
        />
      </div>
    </div>
  );

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
            {section('TTD Banner Package', 'All 4 items are required and bundled into one project.', (
              <div className="flex flex-col gap-[12px] p-[12px] rounded-[8px] border border-[#e9ebef]">
                <div className="flex flex-col gap-[4px]">
                  <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
                    <Checkbox checked disabled />
                    <span className="text-[14px] font-medium text-[#303135]">Banner 2:1 (Carousel / Single)</span>
                  </div>
                  {variantRadios('ttd-2x1-variant', banner2x1Variant, ['Carousel', 'Single'], setBanner2x1Variant)}
                </div>
                <div className="flex flex-col gap-[4px]">
                  <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
                    <Checkbox checked disabled />
                    <span className="text-[14px] font-medium text-[#303135]">Banner 3:1 (Global Search / Single)</span>
                  </div>
                  {variantRadios('ttd-3x1-variant', banner3x1Variant, ['Global Search', 'Single'], setBanner3x1Variant)}
                </div>
                <div className="flex items-center gap-[12px] px-[4px] py-[6px]">
                  <Checkbox checked disabled />
                  <span className="text-[14px] font-medium text-[#303135]">Banner 5:1 (Desktop)</span>
                </div>
                {iconUploader}
              </div>
            ), infoPopover('TTD Banner Package', (
              <p className="text-[12px] text-[#71747d] leading-[16px]">
                These 4 items ship together as one TTD Promo Asset project: Banner 2:1, Banner 3:1, Banner 5:1 (Desktop) and a square Vertical Icon. The Carousel/Single and Global Search/Single picks are placement tags only — they don't change the banner's layout.
              </p>
            )))}
          </div>
        );
      case 'edit': {
        const editors: BannerItemId[] = ['banner2x1', 'banner3x1', 'banner5x1'];
        const noteFor = (id: BannerItemId) => id === 'banner2x1' ? banner2x1Variant : id === 'banner3x1' ? banner3x1Variant : 'Desktop';
        return (
          <div className="flex flex-col gap-[16px]">
            {editors.map((id) => (
              <div key={id} className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] px-[24px]" style={{ '--ep-head-top': 'calc(var(--sticky-base, 0px) + 64px)' } as React.CSSProperties}>
                <div className="sticky top-[var(--ep-head-top)] z-[30] -mx-[24px] px-[24px] h-[56px] bg-white rounded-t-[12px] flex items-center justify-between gap-[12px]">
                  <span className="flex items-baseline gap-[8px]">
                    <span className="text-[16px] font-bold text-[#303135]">{ITEM_TITLE[id]}</span>
                    <span className="text-[13px] text-[#71747d]">{noteFor(id)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenItem((p) => ({ ...p, [id]: !p[id] }))}
                    className={`shrink-0 px-[16px] py-[6px] rounded-[8px] text-[14px] font-bold transition-colors ${openItem[id] ? 'bg-[#007BFF] text-white hover:bg-[#0064D2]' : 'bg-[#e7f2ff] text-[#007bff] hover:bg-[#d1e6ff]'}`}
                  >
                    {openItem[id] ? 'Save' : 'Edit'}
                  </button>
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
                    <EntryPointEditor formData={itemForm(id)} onChange={(u) => itemChange(id, u)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      case 'summary': {
        const previewCard = (id: BannerItemId, title: string) => (
          <div key={id} className="flex flex-col gap-[8px] w-full">
            <span className="text-[13px] font-bold text-[#303135]">{title}</span>
            <LivePreview formData={itemForm(id)} onChange={() => {}} currentStep={4} activeTab="en" deviceTab="all" compact />
          </div>
        );
        return (
          <div className="flex flex-col gap-[16px]">
            <div className="flex items-center gap-[12px]">
              <span className="text-[20px] font-bold text-[#303135]">{projectName.trim() || '-'}</span>
              {vertical && <span className="px-[12px] py-[4px] rounded-[8px] bg-[#e7f2ff] text-[#007bff] text-[14px] font-bold">{vertical}</span>}
            </div>
            <div className="flex flex-col gap-[24px]">
              {previewCard('banner2x1', `2:1 · ${banner2x1Variant}`)}
              {previewCard('banner3x1', `3:1 · ${banner3x1Variant}`)}
              {previewCard('banner5x1', '5:1 · Desktop')}
              <div className="flex flex-col gap-[8px] w-full">
                <span className="text-[13px] font-bold text-[#303135]">Vertical Icon</span>
                {verticalIconPreview ? (
                  <div className="w-[120px] h-[120px] rounded-[8px] overflow-hidden border border-[#d8dce8]">
                    <img src={verticalIconPreview} alt="Vertical Icon" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-[120px] h-[120px] rounded-[8px] border border-dashed border-[#d8dce8] bg-[#f8f9fd] flex items-center justify-center text-[#aeb2be]">
                    <ImageIcon size={24} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col relative w-full overflow-x-clip" style={{ '--sticky-base': '64px' } as React.CSSProperties}>
      <OffscreenBannerRenderer ref={renderer} />
      {cropSrc && (
        <CropAssetModal
          imageSrc={cropSrc}
          fileName="vertical-icon"
          aspect={1}
          onCancel={() => setCropSrc(null)}
          onConfirm={onCropConfirm}
        />
      )}
      <Header compact flat={scrolled} fullWidth showLogo hideSearch userName={userName} userId={userId} userAvatar={userAvatar} onLogout={() => supabase.auth.signOut()} />
      <div className="mt-[88px] w-full max-w-[1200px] mx-auto px-[24px] pb-[40px] flex flex-col gap-[24px]">
        <div ref={stepBarRef}
          className={`fixed top-[64px] left-0 right-0 z-[44] bg-white border-b border-[#e9ebef] ${stepBarShadow ? STICKY_SHADOW : ''} h-[64px] transition-all duration-200 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        >
          <div className="max-w-[1200px] mx-auto px-[24px] h-full flex flex-col justify-end pb-[16px] gap-[8px]">
            <span className="text-[16px] font-semibold leading-[20px] text-[#303135] truncate">{projectName.trim() || 'TTD Promo Asset'}</span>
            <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} size="compact" />
          </div>
        </div>
        <div className="flex flex-col gap-[8px] items-start">
          <TiketBreadcrumb items={[{ label: 'Banners' }, { label: 'TTD Promo Asset', onClick: () => onBack() }, { label: editingId ? 'Edit Banner' : 'Create New Banner' }]} />
          <TiketStepper steps={steps} currentStep={index + 1} maxStepReached={maxIndex + 1} onStepClick={(id) => goTo(id - 1)} />
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
              disabled={isSaving || isSavingDraft || nameState.status === 'checking' || (current === 'select' && (!vertical || !projectName.trim()))}
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
