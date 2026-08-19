import { Home } from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import { GenerativeResizePage } from './pages/GenerativeResizePage';
import { BannerTranslatePage } from './pages/BannerTranslatePage';
import { ImageGenerationPage } from './pages/ImageGenerationPage';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase/client';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { UpdatePassword } from './components/auth/UpdatePassword';
import { AuthLayout } from './components/auth/AuthLayout';
import { BannerService } from '../services/bannerService';
import { AssetService } from '../services/assetService';
import { ViewMode } from '../types/banner';
import { svgPaths } from './components/create-banner/assets/Icons';
import { AddAssetPage } from './components/assets/AddAssetPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccessManagementPage } from './pages/AccessManagementPage';
import { Toaster } from 'sonner';
import { AssetPreloaderProvider } from '../context/AssetPreloader';
import { GlobalInteractionProvider } from '../context/GlobalInteractionContext';
import { NavigationBlockerProvider } from '../context/NavigationBlockerContext';
import { Info, X } from 'lucide-react';
import { BannerListPage } from './pages/BannerListPage';
import { CreateBannerPage } from './pages/CreateBannerPage';
import { AssetLibraryPage } from './pages/AssetLibraryPage';
import { CreateBannerTypeModal } from './components/CreateBannerTypeModal';
import { getUserDisplayName, getUserAvatarUrl } from './utils/userDisplay';
import { AccessProvider, useAccess } from '../context/AccessContext';
import { AccessGate } from './components/AccessGate';
import { MenuVisibilityProvider } from '../context/MenuVisibilityContext';
import { MenuManagementPage } from './pages/MenuManagementPage';

// Browser detection utility
function isChromeBrowser(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();
  const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent) && !/opr/.test(userAgent);
  return isChrome;
}

function AddAssetWrapper({ isSidebarCollapsed, userName, userAvatar }: { isSidebarCollapsed: boolean, userName: string, userAvatar?: string }) {
    const { category } = useParams<{ category: string }>();
    const navigate = useNavigate();
    return (
        <AddAssetPage 
            category={category || 'Others'}
            onBack={() => navigate(`/assets/${category}`)}
            onSuccess={() => navigate(`/assets/${category}`)}
            isSidebarCollapsed={isSidebarCollapsed}
            fullWidth={true} 
            userName={userName}
            userAvatar={userAvatar}
        />
    );
}

function AppContent() {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [authLoading, setAuthLoading] = useState(true);

  // Global UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // View Options (Persisted at App level for continuity)
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [verticalFilter, setVerticalFilter] = useState<string>("All");
  const [ratioFilter, setRatioFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>('created_at_desc');

  // Counters (Fetched here for Sidebar)
  const [bannerCounts, setBannerCounts] = useState<Record<string, number>>({});
  const [assetCounts, setAssetCounts] = useState<Record<string, number>>({});
  const [draftCount, setDraftCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const access = useAccess();

  // Auth Effects
  useEffect(() => {
    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) {
        setSession(session);
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 Auth event:', event, 'Session exists:', !!session);
      
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        setSession(null);
        navigate('/');
        setAuthView('login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setSession(session);
      } else {
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fetch Counts
  const fetchCounts = useCallback(() => {
      if (session?.user?.id) {
        // Fetch Banner Counts
        BannerService.listBanners().then(banners => {
            const counts: Record<string, number> = {};
            let drafts = 0;
            banners.forEach(b => {
                if (b.status === 'published' && b.category) {
                    counts[b.category] = (counts[b.category] || 0) + 1;
                } else if (b.status === 'draft' && b.createdBy === session.user.id) {
                    drafts++;
                }
            });
            setBannerCounts(counts);
            setDraftCount(drafts);
        });

        // Fetch Asset Counts
        AssetService.listAssets().then(assets => {
            const counts: Record<string, number> = {};
            const mainCategories = ['Payment', 'Airlines', 'Hotel', 'Campaign'];
            assets.forEach(a => {
                let category = a.category;
                if (category === 'product-icon') category = 'Product Icon';
                if (category === 'brand-entity-logo') category = 'Entity Logo';

                if (mainCategories.includes(category) || category === 'Product Icon' || category === 'Entity Logo' || category === 'Partner') {
                    counts[category] = (counts[category] || 0) + 1;
                } else {
                    counts['Others'] = (counts['Others'] || 0) + 1;
                }
            });
            setAssetCounts(counts);
        });
      }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts, location.pathname]); // Re-fetch on navigation roughly covers updates

  // Derived Active Sidebar Item
  const activeSidebarItem = useMemo(() => {
      const path = location.pathname;
      
      if (path === '/home' || path === '/') {
          return 'Home';
      }
      if (path.includes('/banners/')) {
          const slug = path.split('/banners/')[1].split('/')[0];
          const map: Record<string, string> = {
            'promo-banner': 'Promo Banner',
            'homepage-promo-banner': 'Homepage Promo Banner',
            'hero-landing-page-header': 'Hero Landing Page Header',
            'product-entry-point': 'Product Entry Point',
            'drafts': 'Drafts'
          };
          return map[slug] || 'Promo Banner';
      }
      if (path.includes('/assets/')) {
          const slug = decodeURIComponent(path.split('/assets/')[1].split('/')[0]);
          if (slug === 'product-icon') return 'Product Icon';
          if (slug === 'brand-entity-logo') return 'Entity Logo';
          // Assets map? Assuming simple pass-through or mapping needed if slugs differ from titles
          return slug.charAt(0).toUpperCase() + slug.slice(1);
      }
      if (path === '/settings/access') {
          return 'Access Management';
      }
      if (path === '/settings/menu') {
          return 'Menu Management';
      }
      if (path.includes('/settings/')) {
          return 'AI Models';
      }
      if (path.includes('/tools/generative-resize')) {
          return 'Generative Resize';
      }
      if (path.includes('/tools/banner-translate')) {
          return 'Banner Translate';
      }
      if (path.includes('/tools/image-generation')) {
          return 'Image Generation';
      }
      return 'Promo Banner';
  }, [location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSidebarSelect = (item: string) => {
      
      if (item === 'Home') {
          navigate('/home');
          return;
      }

      // Map Item Name to URL Slug
      const bannerMap: Record<string, string> = {
        'Promo Banner': 'promo-banner',
        'Homepage Promo Banner': 'homepage-promo-banner',
        'Hero Landing Page Header': 'hero-landing-page-header',
        'Product Entry Point': 'product-entry-point',
        'Drafts': 'drafts'
      };
      
      const assetMap: Record<string, string> = {
          'Campaign': 'Campaign',
          'Payment': 'Payment',
          'Airlines': 'Airlines',
          'Hotel': 'Hotel',
          'Product Icon': 'product-icon',
          'Entity Logo': 'brand-entity-logo',
          'Partner': 'Partner',
          'Others': 'Others'
      };

      if (item === 'AI Models') { navigate('/settings/ai-models'); return; }
      if (item === 'Access Management') { navigate('/settings/access'); return; }
      if (item === 'Menu Management') { navigate('/settings/menu'); return; }

      if (item === 'Generative Resize') {
          navigate('/tools/generative-resize');
          return;
      }

      if (item === 'Banner Translate') {
          navigate('/tools/banner-translate');
          return;
      }

      if (item === 'Image Generation') {
          navigate('/tools/image-generation');
          return;
      }

      if (bannerMap[item]) {
          navigate(`/banners/${bannerMap[item]}`);
      } else if (assetMap[item]) {
          navigate(`/assets/${assetMap[item]}`);
      } else {
          // Default
          navigate(`/banners/promo-banner`);
      }
  };

  const handleCreateNew = () => {
      if (location.pathname.includes('/assets')) {
          const currentSlug = location.pathname.split('/assets/')[1]?.split('/')[0] || 'Campaign';
          navigate(`/assets/${currentSlug}/add`);
      } else if (activeSidebarItem === 'Drafts') {
          // Open modal for Drafts page
          setIsCreateModalOpen(true);
      } else {
          // Direct navigation for specific banner category pages
          const currentSlug = location.pathname.split('/banners/')[1]?.split('/')[0] || 'promo-banner';
          navigate(`/banners/${currentSlug}/create`);
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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fd]">
      <div className="w-8 h-8 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  // Check if this is the update password route BEFORE checking session
  // This allows password reset to work even when session exists
  if (location.pathname === '/auth/update-password') {
    console.log('✅ Rendering UpdatePasswordPage - path matched');
    return <UpdatePasswordPage />;
  }

  if (!session) {
    return (
      <AuthLayout>
        {authView === 'login' ? (
          <Login 
            onSwitchToSignUp={() => setAuthView('signup')} 
            onSwitchToForgotPassword={() => setAuthView('forgot_password')}
            onLoginSuccess={() => {}} 
          />
        ) : authView === 'signup' ? (
          <SignUp 
            onSwitchToLogin={() => setAuthView('login')}
            onSignUpSuccess={() => {}} 
          />
        ) : (
            <ForgotPassword 
               onBackToLogin={() => setAuthView('login')}
            />
        )}
      </AuthLayout>
    );
  }

  const userName = getUserDisplayName(session.user);
  const userAvatar = getUserAvatarUrl(session.user);
  const isCreatingBanner = location.pathname.includes('/create');
  const isAssetMode = location.pathname.includes('/assets');
  const isAddingAsset = isAssetMode && location.pathname.includes('/add');
  const isProfilePage = location.pathname === '/profile';
  
  // Hide sidebar in wizard modes (creating banner or adding asset) or profile page
  const isWizardMode = isCreatingBanner || isAddingAsset || isProfilePage;

  const headerCustomTitle = (activeSidebarItem === 'Generative Resize' || activeSidebarItem === 'Banner Translate' || activeSidebarItem === 'Image Generation') ? (
    <div className="flex items-center gap-4">
      <p className="text-[24px] font-bold text-[#303135]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}>{activeSidebarItem}</p>
      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-700 text-[12px] rounded-full border border-yellow-200">
          <Info className="w-3 h-3" />
          Experimental Feature
      </div>
    </div>
) : undefined;

  const isNotChrome = !isChromeBrowser();

  return (
    <div className="min-h-screen bg-[#f8f9fd]">
      {/* Browser Warning Banner */}
      {isNotChrome && showBrowserWarning && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between fixed top-0 left-0 right-0 z-50 text-sm shadow-md">
          <div className="flex items-center gap-2 flex-1 justify-center">
            <Info className="w-4 h-4 shrink-0" />
            <span className="font-medium">
              For the best experience, please use <strong>Google Chrome</strong>. Some features may not work optimally in other browsers.
            </span>
          </div>
          <button 
            onClick={() => setShowBrowserWarning(false)}
            className="ml-4 p-1 hover:bg-amber-600 rounded transition-colors shrink-0"
            aria-label="Close warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isWizardMode && (
        <>
          <Sidebar 
              userName={userName}
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={setIsSidebarCollapsed}
              onLogout={handleLogout}
              draftCount={draftCount}
              activeItem={activeSidebarItem}
              onSelectItem={handleSidebarSelect}
              bannerCounts={bannerCounts}
              assetCounts={assetCounts}
              canUseTools={access.isWhitelisted}
              canAccessSettings={access.isAdmin}
          />
          <Header
            title={activeSidebarItem === 'Drafts' ? 'Drafts' : activeSidebarItem}
            customTitle={headerCustomTitle}
            searchPlaceholder={isAssetMode ? "Search asset by name" : "Search banner by name"}
            createButtonText={isAssetMode ? "Add Asset" : "Create New Banner"}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateNew={handleCreateNew}
            isSidebarCollapsed={isSidebarCollapsed}
            fullWidth={false}
            showLogo={false}
            hideControls={activeSidebarItem === 'AI Models' || activeSidebarItem === 'Access Management' || activeSidebarItem === 'Generative Resize' || activeSidebarItem === 'Banner Translate' || activeSidebarItem === 'Image Generation' || activeSidebarItem === 'Home'}
          />
        </>
      )}

      <main 
        className={`fixed bottom-0 right-0 overflow-y-auto bg-[#f8f9fd] transition-all duration-300 ${!isWizardMode ? (isSidebarCollapsed ? 'left-[80px] top-[100px]' : 'left-[268px] top-[100px]') : 'left-0 top-0'} ${isNotChrome && showBrowserWarning ? 'mt-[40px]' : ''}`}
        style={{ 
          top: !isWizardMode 
            ? (isNotChrome && showBrowserWarning ? 'calc(100px + 40px)' : '100px')
            : (isNotChrome && showBrowserWarning ? '40px' : '0')
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home session={session} />} />
          
          <Route 
            path="/banners/:category" 
            element={
                <BannerListPage 
                    session={session}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    verticalFilter={verticalFilter}
                    onVerticalFilterChange={setVerticalFilter}
                    ratioFilter={ratioFilter}
                    onRatioFilterChange={setRatioFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    isSidebarCollapsed={isSidebarCollapsed}
                    onDataChange={fetchCounts}
                />
            } 
          />
        <Route 
            path="/banners/:category/create" 
            element={<CreateBannerPage userName={userName} userId={session?.user?.id} userAvatar={userAvatar} />} 
        />

        <Route 
            path="/assets/:category" 
            element={
                <AssetLibraryPage 
                    searchQuery={searchQuery}
                    isSidebarCollapsed={isSidebarCollapsed}
                />
            } 
        />
        <Route 
            path="/assets/:category/add" 
            element={
                <AddAssetWrapper isSidebarCollapsed={isSidebarCollapsed} userName={userName} userAvatar={userAvatar} />
            } 
        />
        
        <Route 
            path="/settings/ai-models" 
            element={<AccessGate adminOnly><SettingsPage isSidebarCollapsed={isSidebarCollapsed} /></AccessGate>} 
        />

        <Route path="/settings/access" element={<AccessGate adminOnly><AccessManagementPage /></AccessGate>} />
        <Route path="/settings/menu" element={<AccessGate adminOnly><MenuManagementPage isSidebarCollapsed={isSidebarCollapsed} /></AccessGate>} />
        <Route 
            path="/tools/generative-resize" 
            element={<AccessGate><GenerativeResizePage isSidebarCollapsed={isSidebarCollapsed} session={session} /></AccessGate>} 
        />
        <Route 
            path="/tools/banner-translate" 
            element={<AccessGate><BannerTranslatePage isSidebarCollapsed={isSidebarCollapsed} session={session} /></AccessGate>} 
        />
        <Route 
            path="/tools/image-generation" 
            element={<AccessGate><ImageGenerationPage isSidebarCollapsed={isSidebarCollapsed} session={session} /></AccessGate>} 
        />

        <Route path="/profile" element={<ProfilePage />} />

        <Route path="*" element={<Navigate to="/banners/promo-banner" replace />} />
      </Routes>
      </main>

      {/* CREATE BANNER TYPE MODAL - for Drafts page */}
      {isCreateModalOpen && (
        <CreateBannerTypeModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSelectType={handleSelectBannerType}
        />
      )}

      <Toaster position="bottom-center" toastOptions={{ style: { marginBottom: '40px' }, unstyled: true }} />
    </div>
  );
}

export default function App() {
    return (
        <BrowserRouter>
            <AccessProvider>
            <MenuVisibilityProvider>
            <GlobalInteractionProvider>
                <NavigationBlockerProvider>
                    <AssetPreloaderProvider>
                        <AppContent />
                    </AssetPreloaderProvider>
                </NavigationBlockerProvider>
            </GlobalInteractionProvider>
            </MenuVisibilityProvider>
            </AccessProvider>
        </BrowserRouter>
    );
}