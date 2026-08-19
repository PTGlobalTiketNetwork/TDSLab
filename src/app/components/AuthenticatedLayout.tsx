import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet, useParams, useLocation, useNavigate } from 'react-router-dom';
import { Asset } from '../../types/asset';
import { svgPaths } from './create-banner/assets/Icons';
import { CreateBannerTypeModal } from './CreateBannerTypeModal';

interface AuthenticatedLayoutProps {
  userName: string;
  onLogout: () => void;
  draftCount: number;
  bannerCounts: Record<string, number>;
  assetCounts: Record<string, number>;
}

export const AuthenticatedLayout = ({ 
  userName, 
  onLogout, 
  draftCount,
  bannerCounts,
  assetCounts
}: AuthenticatedLayoutProps) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { category } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const isCreatingBanner = location.pathname.includes('/create') || location.pathname.includes('/edit');
  const isAddingAsset = location.pathname.includes('/add');
  const isAssetMode = location.pathname.includes('/assets');

  // Determine active item from URL
  const activeSidebarItem = category || (location.pathname.includes('Drafts') ? 'Drafts' : 'Promo Banner');
  
  // Check if we're on Drafts page
  const isDraftsPage = activeSidebarItem === 'Drafts' || location.pathname.includes('/banners/Drafts');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // You might want to pass this down or use a context/url-param for search
  };

  const handleCreateNew = () => {
    if (isAssetMode) {
      navigate(`/assets/${category || 'Campaign'}/add`);
    } else if (isDraftsPage) {
      // Open modal for Drafts page
      setIsCreateModalOpen(true);
    } else {
      // Direct navigation for specific banner category pages
      navigate(`/banners/${category || 'Promo Banner'}/create`);
    }
  };

  const handleSelectBannerType = (type: 'promo' | 'entry-point') => {
    setIsCreateModalOpen(false);
    if (type === 'promo') {
      navigate('/banners/promo-banner/create');
    } else {
      navigate('/banners/product-entry-point/create');
    }
  };

  const handleSidebarSelect = (item: string) => {
    if (item === 'Drafts') {
        navigate('/banners/Drafts');
        return;
    }

    const ASSET_CATEGORIES = ['Campaign', 'Payment', 'Airlines', 'Hotel', 'Product Icon', 'Entity Logo', 'Partner', 'Others'];
    if (ASSET_CATEGORIES.includes(item)) {
        navigate(`/assets/${item}`);
    } else {
        navigate(`/banners/${item}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fd]">
      {!isAddingAsset && !isCreatingBanner && (
        <Sidebar 
            userName={userName}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={setIsSidebarCollapsed}
            onLogout={onLogout}
            draftCount={draftCount}
            activeItem={activeSidebarItem}
            onSelectItem={handleSidebarSelect}
            bannerCounts={bannerCounts}
            assetCounts={assetCounts}
        />
      )}

      <Header
        title={isAssetMode ? activeSidebarItem : (activeSidebarItem === 'Drafts' ? 'Drafts' : activeSidebarItem)}
        searchPlaceholder={isAssetMode ? "Search asset by name" : "Search banner by name"}
        createButtonText={isAssetMode ? "Add Asset" : "Create New Banner"}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onCreateNew={handleCreateNew}
        isSidebarCollapsed={isSidebarCollapsed}
        fullWidth={isAddingAsset || isCreatingBanner}
        showLogo={isCreatingBanner}
      >
        {isCreatingBanner && (
            <div className="flex flex-col items-end gap-[4px]">
              <div className="flex gap-[4px] items-center">
                 <span className="text-[12px] text-[#71747d] leading-[16px]">You’re logged in as</span>
              </div>
              <div className="flex gap-[4px] items-center">
                 <span className="text-[14px] font-bold text-[#303135] leading-[20px]">{userName}</span>
                 <div className="w-[20px] h-[20px]">
                   <svg viewBox="0 0 20 20" className="w-full h-full" fill="none">
                     <path d={svgPaths.p3504a860} fill="#979797" />
                   </svg>
                 </div>
              </div>
            </div>
        )}
      </Header>

      <Outlet context={{ searchQuery, setSearchQuery }} />
      {isCreateModalOpen && (
        <CreateBannerTypeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSelectType={handleSelectBannerType}
        />
      )}
    </div>
  );
};