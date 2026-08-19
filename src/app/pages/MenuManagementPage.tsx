import { LayoutList } from 'lucide-react';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';
import { useMenuVisibility, MANAGED_MENU_ITEMS, ManagedMenuItem } from '../../context/MenuVisibilityContext';
import { Switch } from '../components/ui/switch';

const MENU_DESCRIPTIONS: Record<ManagedMenuItem, string> = {
  'Promo Banner': 'Standard promotional banners for campaigns.',
  'Product Entry Point': 'Mobile and desktop entry point banners.',
  'Homepage Promo Banner': 'Banners displayed on the homepage promo section.',
  'Hero Landing Page Header': 'Full-width hero headers for landing pages.',
};

export function MenuManagementPage({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const { visibility, setVisibility, loading } = useMenuVisibility();

  const handleToggle = async (item: ManagedMenuItem, value: boolean) => {
    await setVisibility(item, value);
    toast.custom((id) => (
      <TiketSnackbar
        id={id}
        message={`"${item}" is now ${value ? 'visible' : 'hidden'} in the sidebar.`}
      />
    ));
  };

  return (
    <div className={`min-h-screen bg-[#f8f9fd] p-8 transition-all duration-300 ${isSidebarCollapsed ? 'ml-[80px]' : 'ml-[268px]'}`}>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-[8px] bg-[#e7f2ff] flex items-center justify-center">
              <LayoutList size={18} className="text-[#007BFF]" />
            </div>
            <h1 className="text-[24px] font-bold text-[#303135]">Menu Management</h1>
          </div>
          <p className="text-[14px] text-[#71747d]">
            Control which banner types are visible in the sidebar navigation for all users.
            Hidden items remain accessible via direct URL but won't appear in the menu.
          </p>
        </div>

        {/* Banner menu items */}
        <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.08)] overflow-hidden">
          <div className="px-[24px] py-[16px] border-b border-[#f0f2f7]">
            <h2 className="text-[14px] font-bold text-[#303135]">Banner Sub-Menu Items</h2>
            <p className="text-[12px] text-[#aeb2be] mt-0.5">Toggle to show or hide each item in the Banners section.</p>
          </div>

          <div className="divide-y divide-[#f0f2f7]">
            {MANAGED_MENU_ITEMS.map((item) => {
              const isOn = loading ? true : (visibility[item] ?? true);
              return (
                <div key={item} className="flex items-center justify-between px-[24px] py-[18px]">
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-[14px] font-medium ${isOn ? 'text-[#303135]' : 'text-[#aeb2be]'}`}>
                      {item}
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
              );
            })}
          </div>
        </div>

        <p className="text-[12px] text-[#aeb2be] text-center">
          Changes apply immediately to all users. This setting is stored globally.
        </p>
      </div>
    </div>
  );
}
