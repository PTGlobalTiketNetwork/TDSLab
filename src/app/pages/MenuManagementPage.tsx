import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';
import { useMenuVisibility, MANAGED_MENU_ITEMS, ManagedMenuItem, BADGE_CAPABLE_MENU_ITEMS } from '../../context/MenuVisibilityContext';
import { Switch } from '../components/ui/switch';

const MENU_DESCRIPTIONS: Record<ManagedMenuItem, string> = {
  'Promo Banner': 'Standard promotional banners for campaigns.',
  'Product Entry Point': 'Mobile and desktop entry point banners.',
  'DLP Assets': 'DLP header and entry point banners in one set.',
  'TTD Promo Asset': 'TTD promo asset banners.',
  'Auto Translate': 'Show the "Translate to EN / ID" button in the banner form.',
};

// Display-only labels — keys must stay the internal ManagedMenuItem values used for storage/comparison.
const MENU_LABELS: Record<ManagedMenuItem, string> = {
  'Promo Banner': 'Promo Banner',
  'Product Entry Point': 'Product Entry Point',
  'DLP Assets': 'DLP Assets',
  'TTD Promo Asset': 'TTD Promo Asset',
  'Auto Translate': 'Translate',
};

const BANNER_MENU_ITEMS = MANAGED_MENU_ITEMS.filter((item) => item !== 'Auto Translate');

export function MenuManagementPage(_props: { isSidebarCollapsed?: boolean }) {
  const { visibility, setVisibility, setAdminOnly, setShowNewBadge, loading } = useMenuVisibility();

  const handleToggle = async (item: ManagedMenuItem, value: boolean) => {
    await setVisibility(item, value);
    toast.custom((id) => (
      <TiketSnackbar
        id={id}
        message={`"${MENU_LABELS[item]}" is now ${value ? 'visible' : 'hidden'} ${item === 'Auto Translate' ? 'in the banner form' : 'in the sidebar'}.`}
      />
    ));
  };

  const handleAdminOnlyToggle = async (item: ManagedMenuItem, value: boolean) => {
    await setAdminOnly(item, value);
    toast.custom((id) => (
      <TiketSnackbar
        id={id}
        message={`"${MENU_LABELS[item]}" is now ${value ? 'visible to admins only' : 'visible to everyone'}.`}
      />
    ));
  };

  const handleBadgeToggle = async (item: ManagedMenuItem, value: boolean) => {
    await setShowNewBadge(item, value);
    toast.custom((id) => (
      <TiketSnackbar
        id={id}
        message={`"NEW" badge is now ${value ? 'on' : 'off'} for "${MENU_LABELS[item]}".`}
      />
    ));
  };

  const renderRow = (item: ManagedMenuItem) => {
    const cfg = visibility[item];
    const isOn = loading ? true : (cfg?.visible ?? true);
    const isAdminOnly = loading ? false : (cfg?.adminOnly ?? false);
    const hasNewBadge = loading ? false : (cfg?.showNewBadge ?? false);
    const canToggleBadge = BADGE_CAPABLE_MENU_ITEMS.includes(item);

    return (
      <div key={item} className="flex flex-col gap-3 py-[18px] px-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className={`text-[14px] font-medium ${isOn ? 'text-[#303135]' : 'text-[#aeb2be]'}`}>
              {MENU_LABELS[item]}
            </span>
            <span className="text-[12px] text-[#aeb2be]">{MENU_DESCRIPTIONS[item]}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <span className={`text-[12px] font-medium ${isOn ? 'text-[#1a9e5f]' : 'text-[#aeb2be]'}`}>
              {loading ? '—' : (isOn ? 'Visible' : 'Hidden')}
            </span>
            <Switch
              checked={isOn}
              disabled={loading}
              onCheckedChange={(val) => handleToggle(item, val)}
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch
              className="scale-75"
              checked={isAdminOnly}
              disabled={loading}
              onCheckedChange={(val) => handleAdminOnlyToggle(item, val)}
            />
            <span className="text-[12px] text-[#aeb2be]">Admin only</span>
          </label>
          {canToggleBadge && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                className="scale-75"
                checked={hasNewBadge}
                disabled={loading}
                onCheckedChange={(val) => handleBadgeToggle(item, val)}
              />
              <span className="text-[12px] text-[#aeb2be]">"NEW" badge</span>
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-[24px] font-bold text-[#303135]">Menu Management</h1>

        {/* Banner menu items */}
        <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.08)] overflow-hidden">
          <div className="px-[24px] py-[16px] border-b border-[#f0f2f7]">
            <h2 className="text-[14px] font-bold text-[#303135]">Banner Sub-Menu Items</h2>
            <p className="text-[12px] text-[#aeb2be] mt-0.5">Toggle to show or hide each item in the Banners section.</p>
          </div>

          <div className="divide-y divide-[#f0f2f7]">
            {BANNER_MENU_ITEMS.map(renderRow)}
          </div>
        </div>

        {/* Feature items */}
        <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.08)] overflow-hidden">
          <div className="px-[24px] py-[16px] border-b border-[#f0f2f7]">
            <h2 className="text-[14px] font-bold text-[#303135]">Fitur</h2>
            <p className="text-[12px] text-[#aeb2be] mt-0.5">Toggle to show or hide each feature.</p>
          </div>

          <div className="divide-y divide-[#f0f2f7]">
            {renderRow('Auto Translate')}
          </div>
        </div>

        <p className="text-[12px] text-[#aeb2be] text-center">
          Changes apply immediately to all users. This setting is stored globally.
        </p>
      </div>
    </div>
  );
}
