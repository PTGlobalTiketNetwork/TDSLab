import { useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { BannerFormData } from '../types';
import { DropdownSelect } from './DropdownSelect';
import { BannerService } from '../../../../services/bannerService';
import { TiketSnackbar } from '../../ui/TiketSnackbar';
import { Dialog, DialogContent, DialogTitle } from '../../ui/dialog';
import { LivePreview } from '../LivePreview';

// Fields that belong to the banner being created and must survive a copy (incl. whether it ships a Desktop 5:1 next to the 2:1)
const KEEP_KEYS = ['bannerName', 'bannerCategory', 'bannerRatio', 'platform', 'entryPointVariant', 'verticalCategory', 'bannerStyle', 'provideDesktopBanner', 'elementPositions', 'savedElementPositions', 'last_step'] as const;

interface Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
}

/** "Copy settings from…" — pick an existing banner and copy its content + settings into the one being created. */
export function CopySettingsFrom({ formData, onChange }: Props) {
  const [banners, setBanners] = useState<{ id: string; label: string; form: any }[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || banners.length) return;
    BannerService.listBanners()
      .then((list) => setBanners(
        list
          .filter((b: any) => b.form_data && b.category === 'Promo Banner') // Promo Banners only (not DLP / Entry Point / other categories)
          .map((b: any) => ({ id: b.id, label: `${b.name} · ${b.form_data.bannerRatio || ''}${b.status === 'draft' ? ' (draft)' : ''}`, form: b.form_data })),
      ))
      .catch(() => toast.custom((id) => <TiketSnackbar id={id} message="Failed to load banners" variant="error" />));
  }, [open, banners.length]);

  const [selectedId, setSelectedId] = useState('');
  const selected = banners.find((b) => b.id === selectedId);

  // What the banner being created will look like after copying (name, category, ratio… stay as set)
  const afterForm = useMemo(() => {
    if (!selected) return null;
    // Same result as applying it: the reference is merged over the current project, which keeps what the reference doesn't have
    const updates: Record<string, any> = { ...formData, ...selected.form };
    KEEP_KEYS.forEach((k) => { updates[k] = (formData as any)[k]; });
    updates.keyVisualFile = undefined;
    updates.manualBackgroundFile = undefined;
    // The Desktop 5:1 next to a 2:1 has its own logo switches. A reference made before that (or without a desktop version)
    // doesn't carry them, so the desktop would lose its logos: follow the mobile logos in that case.
    if (formData.provideDesktopBanner) {
      if (selected.form.desktopShowCampaignLogo === undefined) updates.desktopShowCampaignLogo = !!updates.showCampaignLogo;
      if (selected.form.desktopShowPartnerLogo === undefined) updates.desktopShowPartnerLogo = !!updates.showPartnerLogo;
    }
    return updates;
  }, [selected, formData]);

  // Reference as it is (left); the current project before / after copying (right)
  const refForm = selected ? ({ ...selected.form, keyVisualFile: undefined, manualBackgroundFile: undefined } as BannerFormData) : null;
  const [view, setView] = useState<'before' | 'after'>('after');

  const close = () => { setOpen(false); setSelectedId(''); setView('after'); };
  const apply = () => {
    if (!afterForm) return;
    onChange(afterForm as Partial<BannerFormData>);
    close();
    toast.custom((tid) => <TiketSnackbar id={tid} message="Settings copied. Review them in the next steps." />);
  };

  const pane = (title: React.ReactNode, f: BannerFormData | null, empty: string) => (
    <div className="flex flex-col gap-[8px] min-w-0">
      <div className="flex items-center justify-between gap-[8px] min-h-[28px]">{title}</div>
      {f ? (
        <LivePreview formData={f} onChange={() => {}} currentStep={3} activeTab="en" deviceTab="all" compact hideDeviceTabs />
      ) : (
        <div className="flex items-center justify-center h-[200px] text-center text-[13px] text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8] px-[16px]">{empty}</div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <div className="flex items-center justify-between">
        <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Copy settings from (optional)</label>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-3 py-1.5 rounded-md text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        >
          Copy settings from…
        </button>
      </div>
      <span className="text-[12px] text-[#71747d]">Copies content (headline, nudge, discounts, labels, T&C), colors, scale/position and key visual. Name, category, ratio and layout style stay as you set them.</span>

      <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
        <DialogContent className="w-[min(1100px,96vw)] max-w-none sm:max-w-none max-h-[92vh] overflow-auto p-[24px]">
          <DialogTitle className="text-[18px] font-bold text-[#303135]">Copy settings from</DialogTitle>
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[8px]">
              <span className="text-[13px] text-[#71747d]">Reference project</span>
              <DropdownSelect
                options={banners.map(({ id, label }) => ({ id, label }))}
                value={selectedId}
                onChange={setSelectedId}
                placeholder={banners.length ? 'Select a banner' : 'Loading banners…'}
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-[16px] items-start">
              {pane(
                <span className="text-[14px] font-bold text-[#303135] truncate">Reference{selected ? ` · ${selected.label}` : ''}</span>,
                refForm,
                'Pick a reference project',
              )}
              <ArrowRight className="hidden lg:block w-[24px] h-[24px] text-[#71747d] mt-[40px]" />
              {pane(
                <>
                  <span className="text-[14px] font-bold text-[#303135]">Current project</span>
                  <div className="flex rounded-[8px] bg-[#f2f4f8] p-[2px] shrink-0">
                    {(['before', 'after'] as const).map((v) => (
                      <button key={v} type="button" onClick={() => setView(v)}
                        className={`px-[12px] py-[4px] rounded-[6px] text-[13px] font-bold capitalize transition-colors ${view === v ? 'bg-white text-[#007BFF] shadow-sm' : 'text-[#71747d]'}`}>
                        {v}
                      </button>
                    ))}
                  </div>
                </>,
                view === 'before' ? formData : (afterForm as BannerFormData | null),
                'Pick a reference project to preview the result',
              )}
            </div>
            <div className="flex justify-end gap-[8px]">
              <button type="button" onClick={close} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold text-[#303135] hover:bg-[#f8f9fd]">Cancel</button>
              <button type="button" onClick={apply} disabled={!afterForm} className="px-[16px] py-[8px] rounded-[8px] text-[14px] font-bold bg-[#007BFF] text-white hover:bg-[#0064D2] disabled:opacity-40 disabled:cursor-not-allowed">Copy settings</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
