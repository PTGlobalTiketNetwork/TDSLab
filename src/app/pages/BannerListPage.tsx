import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { BannerService } from '../../services/bannerService';
import { Banner, ViewMode, ToastMessage } from '../../types/banner';
import { MainContent } from '../components/MainContent';
import { InspectorPanel } from '../components/InspectorPanel';
import { DeleteModal } from '../components/DeleteModal';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase/client';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';
import { useAllBannersPresence } from '../../hooks/useAllBannersPresence';
import { getUserDisplayName, getUserAvatarUrl } from '../utils/userDisplay';
import { OffscreenBannerRenderer, OffscreenBannerRendererHandle } from '../components/OffscreenBannerRenderer';
import { handoffStore } from '../../utils/indexedDB';
import { buildDlpZipManifest, dlpZipBaseName, buildTtdZipParams } from '../utils/bannerCapture';
import { TiketTabs } from '../components/ui/TiketTabs';
import { getBannerCategory } from '../components/CategoryBadge';
import { needsMigration, SETTINGS_VERSION } from '../components/create-banner/settingsVersion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

function withPreviewCacheBust(url: string, cacheBuster: string | number) {
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${url}${url.includes('?') ? '&' : '?'}t=${cacheBuster}`;
}

function getInspectorPreviewUrl(banner: Banner): string | null {
  const formData = banner.form_data as any;
  const rawUrl = formData?.keyVisualUrl || banner.imageUrl || null;
  if (!rawUrl) return null;

  const cacheBuster = banner.updatedAt ? new Date(banner.updatedAt).getTime() : banner.id;
  return withPreviewCacheBust(rawUrl, cacheBuster);
}

// Locked name prefixes: "<Vertical> - " (Promo Banner, DLP Assets) and "To Do - " (TTD Promo Asset).
const RENAME_PREFIX_RE = /^(General|Accom|Hotel|Flight|Transport|NFT|ToDos|Event|To Do) - /;

interface BannerListPageProps {
  session: Session | null;
  searchQuery: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  verticalFilter: string[];
  onVerticalFilterChange: (filter: string[]) => void;
  ratioFilter: string[];
  onRatioFilterChange: (filter: string[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  isSidebarCollapsed: boolean;
  onDataChange?: () => void;
}

const TTD_TEMPLATE_OPTIONS = ['Gradient', '2 Highlight', '3 Highlight'];
// TTD projects stamp the same template on every banner in form_data.ttd; missing = Gradient
const getTtdTemplateLabel = (b: Banner) => {
  const fd = (b as any).form_data;
  const t = fd?.ttd?.banner2x1?.ttdTemplate ?? fd?.ttd?.banner3x1?.ttdTemplate ?? fd?.ttd?.banner5x1?.ttdTemplate ?? fd?.ttdTemplate;
  return t === 'highlight-2' ? '2 Highlight' : t === 'highlight-3' ? '3 Highlight' : 'Gradient';
};

const VERTICAL_FILTER_OPTIONS = ['General', 'Accom', 'Flight', 'NFT', 'ToDos', 'Event'];
// Banners saved before the split still say "Transport": they show up under Flight
const normalizeVertical = (product?: string) => (product === 'Transport' ? 'Flight' : (product === 'Hotel' || product === 'Accommodation') ? 'Accom' : (product || ''));

export function BannerListPage({ 
  session, 
  searchQuery,
  viewMode,
  onViewModeChange,
  verticalFilter,
  onVerticalFilterChange,
  ratioFilter,
  onRatioFilterChange,
  sortBy,
  onSortChange,
  isSidebarCollapsed,
  onDataChange
}: BannerListPageProps) {
  const { category: categorySlug } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const navigate = useNavigate();

  const handleHighlightHandled = useCallback(() => {
    setSearchParams(prev => {
      if (!prev.has('highlight')) return prev;
      const next = new URLSearchParams(prev);
      next.delete('highlight');
      return next;
    }, { replace: true });
  }, [setSearchParams]);
  
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [selectedBannerIds, setSelectedBannerIds] = useState<Set<string>>(() => new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [migrateTarget, setMigrateTarget] = useState<{ banner: Banner; version?: number } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [bannersToDelete, setBannersToDelete] = useState<Banner[]>([]);
  const [preloadedPreviewUrls, setPreloadedPreviewUrls] = useState<Set<string>>(() => new Set());
  const offscreenRendererRef = useRef<OffscreenBannerRendererHandle>(null);

  // Map slug to Category Name
  const categoryMap: Record<string, string> = {
    'promo-banner': 'Promo Banner',
    'homepage-promo-banner': 'Homepage Promo Banner',
    'hero-landing-page-header': 'Hero Landing Page Header',
    'product-entry-point': 'Product Entry Point',
    'dlp-assets': 'DLP Assets',
    'ttd-promo-asset': 'TTD Promo Asset',
    'drafts': 'Drafts'
  };

  const activeCategory = categorySlug ? categoryMap[categorySlug] : 'Promo Banner';
  const isDraftsPage = activeCategory === 'Drafts';
  const isTtdPage = activeCategory === 'TTD Promo Asset';
  const [templateFilter, setTemplateFilter] = useState<string[]>([]);
  useEffect(() => { setTemplateFilter([]); }, [categorySlug]);

  // Drafts page: category tab ('all' or a category name)
  const DRAFT_TAB_CATEGORIES = ['Promo Banner', 'Product Entry Point', 'DLP Assets', 'TTD Promo Asset'];
  const [draftTab, setDraftTab] = useState<string>('all');
  useEffect(() => { setDraftTab('all'); }, [categorySlug]);

  // Load Banners
  useEffect(() => {
    if (session?.user?.id) {
      loadBanners();

      // Realtime Subscription (Broadcast Channel)
      const channel = supabase
        .channel('banner_updates')
        .on(
          'broadcast',
          { event: 'NEW_VERSION_SAVED' },
          async (event) => {
             const { bannerId } = event.payload;
             if (bannerId) {
                 // Fetch the latest data because broadcast payload doesn't contain full record
                 const latestBanner = await BannerService.getBanner(bannerId);
                 if (latestBanner) {
                     handleRealtimeUpdate(latestBanner);
                 }
             }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id]);

  const handleRealtimeUpdate = (updatedBanner: Banner) => {
      // Mark as syncing for visual feedback
      const bannerWithSyncState: Banner = {
          ...updatedBanner,
          isSyncing: true
      };

      setBanners(prevBanners => {
          const index = prevBanners.findIndex(b => b.id === bannerWithSyncState.id);
          
          // If it's a new banner (not in list), should we add it?
          // The requirements focused on "sync banner changes", but adding new ones is nice.
          // However, we might be in a filtered view (e.g. Drafts).
          // Let's stick to updating existing ones for now to avoid view-logic complexity.
          if (index === -1) return prevBanners;

          const isFromOtherUser = bannerWithSyncState.lastEditedById !== session?.user?.id;
          
          if (isFromOtherUser) {
              toast.custom((id) => (
                   <TiketSnackbar
                       id={id}
                       message={`${bannerWithSyncState.lastEditedByName || 'Someone'} saved a new version of ${bannerWithSyncState.name}.`}
                   />
               ));
          }

          const newBanners = [...prevBanners];
          newBanners[index] = bannerWithSyncState;
          return newBanners;
      });

      // Clear syncing state after 2 seconds
      setTimeout(() => {
          setBanners(prev => prev.map(b => 
              b.id === bannerWithSyncState.id ? { ...b, isSyncing: false } : b
          ));
      }, 2000);
  };

  const loadBanners = async () => {
    try {
      setIsLoading(true);
      const data = await BannerService.listBanners();
      setBanners(data);
    } catch (error) {
      console.error('Failed to load banners:', error);
      toast.custom((id) => (
            <TiketSnackbar
                id={id}
                message="Failed to load banners"
                variant="error"
            />
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter Banners
  const filteredBanners = useMemo(() => {
    let filtered = [...banners];

    if (activeCategory === 'Drafts') {
      filtered = filtered.filter(b => b.status === 'draft' && b.createdBy === session?.user.id);
      if (draftTab !== 'all') {
        filtered = filtered.filter(b => getBannerCategory(b) === draftTab);
      }
    } else {
      filtered = filtered.filter(b => b.status === 'published');
      if (activeCategory) {
         filtered = filtered.filter(b => b.category === activeCategory);
      }
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(banner =>
        banner.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // TTD Promo Asset: template filter replaces the Product/Ratio filters
    if (isTtdPage) {
        if (templateFilter.length > 0) filtered = filtered.filter(b => templateFilter.includes(getTtdTemplateLabel(b)));
    }

    // Filter by Vertical (Product)
    if (!isTtdPage && verticalFilter.length > 0) {
        filtered = filtered.filter(b => verticalFilter.includes(normalizeVertical(b.product)));
    }

    // Filter by Ratio (using form_data.bannerRatio)
    if (!isTtdPage && ratioFilter.length > 0) {
        filtered = filtered.filter(b => {
            const formData = (b as any).form_data;
            return !!formData?.bannerRatio && ratioFilter.includes(formData.bannerRatio);
        });
    }

    // Sort
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'created_at_desc':
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            case 'created_at_asc':
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            case 'updated_at_desc':
                return new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime();
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            case 'product_asc':
                return (a.product || '').localeCompare(b.product || '');
            default:
                return 0;
        }
    });

    return filtered;
  }, [banners, searchQuery, activeCategory, session, verticalFilter, ratioFilter, sortBy, draftTab, isTtdPage, templateFilter]);

  // DYNAMIC FACETING: Extract unique ratios and verticals from CURRENT page category
  const { availableRatios, availableVerticals } = useMemo(() => {
    let baseBanners = [...banners];
    
    // Filter by category first (before applying user filters)
    if (activeCategory === 'Drafts') {
      baseBanners = baseBanners.filter(b => b.status === 'draft' && b.createdBy === session?.user.id);
    } else {
      baseBanners = baseBanners.filter(b => b.status === 'published');
      if (activeCategory) {
         baseBanners = baseBanners.filter(b => b.category === activeCategory);
      }
    }
    
    // Extract unique ratios from form_data
    const ratiosSet = new Set<string>();
    baseBanners.forEach(b => {
      const formData = (b as any).form_data;
      if (formData?.bannerRatio) {
        ratiosSet.add(formData.bannerRatio);
      }
    });
    
    // Verticals are a fixed list (same as the create form); legacy "Transport" was split into Flight and NFT
    return {
      availableRatios: Array.from(ratiosSet).sort(),
      availableVerticals: VERTICAL_FILTER_OPTIONS
    };
  }, [banners, activeCategory, session]);

  useEffect(() => {
    const urls = Array.from(
      new Set(filteredBanners.map(getInspectorPreviewUrl).filter(Boolean) as string[]),
    );

    if (urls.length === 0) return;

    let cancelled = false;
    const timers: number[] = [];

    urls.forEach((url, index) => {
      const preload = () => {
        if (cancelled) return;

        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (cancelled) return;
          setPreloadedPreviewUrls(prev => {
            if (prev.has(url)) return prev;
            const next = new Set(prev);
            next.add(url);
            return next;
          });
        };
        img.onerror = () => {
          if (cancelled) return;
          setPreloadedPreviewUrls(prev => {
            if (!prev.has(url)) return prev;
            const next = new Set(prev);
            next.delete(url);
            return next;
          });
        };
        img.src = url;
      };

      // Start the first screenful immediately, then lightly stagger the rest.
      if (index < 12) {
        preload();
      } else {
        const timer = window.setTimeout(preload, (index - 11) * 120);
        timers.push(timer);
      }
    });

    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
    };
  }, [filteredBanners]);

  // Keyboard shortcuts for multi-select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedBannerIds.size < 2) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        e.preventDefault();
        clearMultiSelect();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        const bulk = banners.filter(b => selectedBannerIds.has(b.id));
        if (bulk.length > 0) {
          setBannerToDelete(null);
          setBannersToDelete(bulk);
          setDeleteModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBannerIds, banners]);

  // Duplicate an old-settings banner into a new draft on the current settings, then open that copy for editing.
  // The original is left untouched (and is not editable), so nothing already published changes.
  const migrateAndEdit = async (banner: Banner) => {
    try {
      const newId = crypto.randomUUID();
      const newName = `${banner.name}_v2`;
      await BannerService.saveBanner({
        id: newId,
        name: newName,
        category: banner.category,
        status: 'draft',
        form_data: { ...banner.form_data, bannerName: newName, settingsVersion: SETTINGS_VERSION },
        created_by: session!.user.id,
        image_url_en: banner.imageUrl,
        image_url_id: banner.imageUrl,
        product: banner.product,
        metadata: { dimension: banner.dimension, fileSize: banner.fileSize },
      } as any);
      const slug = Object.keys(categoryMap).find((key) => categoryMap[key] === banner.category) || 'promo-banner';
      await loadBanners();
      onDataChange?.();
      navigate(`/banners/${slug}/create?edit=${newId}`);
    } catch (error) {
      console.error('Migrate failed', error);
      toast.custom((id) => <TiketSnackbar id={id} message="Failed to create the migrated copy" variant="error" />);
    }
  };

  const handleEdit = (banner: Banner, version?: number) => {
    if (needsMigration(banner.form_data, banner.category)) {
      setMigrateTarget({ banner, version });
      return;
    }
    if (banner.status === 'draft' || banner.form_data) {
        // Construct edit URL
        const slug = Object.keys(categoryMap).find(key => categoryMap[key] === getBannerCategory(banner));
        let url = '';
        if (slug) {
            url = `/banners/${slug}/create?edit=${banner.id}`;
        } else {
             // Fallback?
             url = `/banners/promo-banner/create?edit=${banner.id}`;
        }
        
        if (version) {
            url += `&version=${version}`;
        }
        
        navigate(url);
    } else {
        toast.custom((id) => (
            <TiketSnackbar
                id={id}
                message="Edit feature for published banners coming soon!"
            />
        ));
    }
  };

  const handleDeleteClick = (banner: Banner) => {
    setBannersToDelete([]);
    setBannerToDelete(banner);
    setDeleteModalOpen(true);
  };

  const handleBulkDeleteClick = (bulkBanners: Banner[]) => {
    setBannerToDelete(null);
    setBannersToDelete(bulkBanners);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    const isBulk = bannersToDelete.length > 0;
    const targets = isBulk ? bannersToDelete : bannerToDelete ? [bannerToDelete] : [];
    if (targets.length === 0) return;

    try {
      setIsDeleting(true);
      const results = await Promise.allSettled(
        targets.map(b => BannerService.deleteBanner(b.id)),
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      const deletedIds = new Set(
        targets.filter((_, i) => results[i].status === 'fulfilled').map(b => b.id),
      );

      const updatedBanners = banners.filter(b => !deletedIds.has(b.id));
      setBanners(updatedBanners);

      if (isBulk) {
        const msg = failed > 0
          ? `Deleted ${succeeded} of ${targets.length} banners. ${failed} failed.`
          : `${succeeded} banners deleted.`;
        toast.custom((id) => <TiketSnackbar id={id} message={msg} variant={failed > 0 ? 'error' : 'default'} />);
        setSelectedBannerIds(new Set());
        setSelectedBannerId(null);
      } else {
        toast.custom((id) => (
          <TiketSnackbar id={id} message="Banner and all its history cleared. Shared assets preserved." />
        ));
        if (selectedBannerId && deletedIds.has(selectedBannerId)) {
          setSelectedBannerId(null);
        }
      }

      setDeleteModalOpen(false);
      setBannerToDelete(null);
      setBannersToDelete([]);
      onDataChange?.();

      if (activeCategory === 'Drafts') {
        const remainingDrafts = updatedBanners.filter(b => b.status === 'draft' && b.createdBy === session?.user.id);
        if (remainingDrafts.length === 0) {
          navigate('/banners/promo-banner');
        }
      }
    } catch (error) {
      console.error('Failed to delete banner(s):', error);
      toast.custom((id) => (
        <TiketSnackbar id={id} message="Failed to delete banner" variant="error" />
      ));
    } finally {
      setIsDeleting(false);
    }
  };

  const createBannerDuplicate = async (banner: Banner): Promise<string | null> => {
    if (!banner.form_data) return null;

    const newBannerId = crypto.randomUUID();
    const newName = `${banner.name}_copy`;

    const payload = {
      id: newBannerId,
      name: newName,
      category: banner.category,
      status: 'draft',
      form_data: {
        ...banner.form_data,
        bannerName: newName,
        last_step: 1,
      },
      created_by: session!.user.id,
      image_url_en: banner.imageUrl,
      image_url_id: banner.imageUrl,
      product: banner.product,
      metadata: {
        dimension: banner.dimension,
        fileSize: banner.fileSize,
      },
    };

    // @ts-ignore
    await BannerService.saveBanner(payload);
    return newBannerId;
  };

  // Rename from the context menu — updates the stored name (and form_data.bannerName) without opening the editor.
  // The fixed "<Vertical> - " / "To Do - " prefix stays locked; only the part after it is editable.
  const [renameTarget, setRenameTarget] = useState<{ banner: Banner; prefix: string; suffix: string; error?: string } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const openRename = (banner: Banner) => {
    const name = banner.name || '';
    const m = name.match(RENAME_PREFIX_RE);
    setRenameTarget({ banner, prefix: m ? m[0] : '', suffix: m ? name.slice(m[0].length) : name });
  };
  const handleRename = async () => {
    if (!renameTarget) return;
    const { banner, prefix } = renameTarget;
    const suffix = renameTarget.suffix.trim();
    if (!suffix) return;
    const name = `${prefix}${suffix}`;
    if (name === banner.name) { setRenameTarget(null); return; }
    setIsRenaming(true);
    try {
      // Same uniqueness rules as the editors: DLP / TTD projects within their own category, everything else across all banners.
      const category = getBannerCategory(banner);
      const perCategory = category === 'DLP Assets' || category === 'TTD Promo Asset';
      const all = await BannerService.listBanners();
      const taken = all.some((b) => b.id !== banner.id && (!perCategory || getBannerCategory(b) === category) && (b.name || '').trim().toLowerCase() === name.toLowerCase());
      if (taken) {
        setRenameTarget((t) => (t ? { ...t, error: perCategory ? `Name already exists in ${category}. Please choose another.` : 'Banner name already exists. Please choose another.' } : t));
        return;
      }
      await BannerService.patchBanner(banner.id, {
        name,
        ...(banner.form_data ? { form_data: { ...banner.form_data, bannerName: name } } : {}),
        ...(session?.user ? { last_edited_by_id: session.user.id, last_edited_by_name: getUserDisplayName(session.user, 'Unknown') } : {}),
      });
      setRenameTarget(null);
      await loadBanners();
      onDataChange?.();
      toast.custom((id) => <TiketSnackbar id={id} message={`Renamed to "${name}"`} />);
    } catch (error) {
      console.error('Rename failed:', error);
      toast.custom((id) => <TiketSnackbar id={id} message="Failed to rename" variant="error" />);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDuplicate = async (banner: Banner): Promise<void> => {
    try {
      const newBannerId = await createBannerDuplicate(banner);
      if (!newBannerId) {
        toast.custom((id) => (
          <TiketSnackbar
            id={id}
            message="Cannot duplicate this banner (missing form data)"
            variant="error"
          />
        ));
        return;
      }

      await loadBanners();
      onDataChange?.();

      toast.custom((id) => (
        <TiketSnackbar
          id={id}
          message="Banner duplicated to Drafts"
        />
      ), { duration: 4000 });

      navigate(`/banners/drafts?highlight=${newBannerId}`);
    } catch (error) {
      console.error("Duplicate failed", error);
      toast.custom((id) => (
        <TiketSnackbar
          id={id}
          message="Failed to duplicate banner"
          variant="error"
        />
      ));
      throw error; // Propagate error so button can reset state
    }
  };

  const handleDownload = async (banner: Banner, scaleFactor: number = 1) => {
      // Use offscreen vector rendering for true high-quality downloads (same method as InspectorPanel)
      if (offscreenRendererRef.current) {
          await offscreenRendererRef.current.downloadBanner(banner, scaleFactor);
      } else {
          console.error('OffscreenBannerRenderer not available');
          toast.custom((id) => (
            <TiketSnackbar id={id} message="Download system not ready. Please try again." variant="error" />
          ));
      }
  };

  const handleResize = async (banner: Banner) => {
    if (!offscreenRendererRef.current) {
      toast.custom((id) => <TiketSnackbar id={id} message="Resize preview is not ready. Please try again." variant="error" />);
      return;
    }

    const toastId = toast.custom((id) => (
      <TiketSnackbar id={id} message="Preparing the source banner..." variant="default" />
    ), { duration: Infinity });

    try {
      // Rebuild the banner from form_data and its key visual rather than passing
      // image_url_en, which may be an outdated export with the wrong background.
      const sourceBlob = await offscreenRendererRef.current.captureBannerForResize(banner);
      const handoffKey = crypto.randomUUID();
      await handoffStore.set(handoffKey, sourceBlob);
      window.location.href = `/tools/generative-resize?handoffKey=${handoffKey}&source=dashboard`;
    } catch (error) {
      console.error('Failed to prepare banner for resize', error);
      toast.dismiss(toastId);
      toast.custom((id) => (
        <TiketSnackbar id={id} message="Could not prepare this banner for resize. Please try again." variant="error" />
      ));
    }
  };

  const handlePublishToggle = (banner: Banner) => {
      // Optimistic update
      const newStatus = banner.status === 'published' ? 'draft' : 'published';
      setBanners(banners.map(b => 
        b.id === banner.id 
          ? { ...b, status: newStatus as any, isPublished: newStatus === 'published' }
          : b
      ));
      toast.custom((id) => <TiketSnackbar id={id} message={`Banner "${banner.name}" is now ${newStatus}`} />);
      onDataChange?.(); // Update counts
  };

  const handleRestore = async (banner: Banner, historyItem: any, newImageUrl?: string) => {
      if (!session?.user) return;
      
      try {
          const userName = getUserDisplayName(session.user, 'Unknown');
          const userAvatar = getUserAvatarUrl(session.user);
          
          const payload = {
              ...historyItem,
              last_edited_by_id: session.user.id,
              last_edited_by_name: userName,
              user_avatar: userAvatar,
              updated_at: new Date().toISOString(),
              restore_note: `Restored from Version ${historyItem.version}`
          };

          if (newImageUrl) {
              payload.image_url_en = newImageUrl;
              // Ensure legacy fields are also updated if they exist in the history item
              if (payload.imageUrl) payload.imageUrl = newImageUrl;
          }
          
          // The backend automatically snapshots the *current* master (e.g. v2) before saving this payload as new version (e.g. v3).
          // The new version will contain the content of 'historyItem' (v1).
          const updated = await BannerService.updateBanner(banner.id, payload);
          
          toast.custom((id) => <TiketSnackbar id={id} message={`Version ${historyItem.version} has been restored as Version ${updated.version || 'new'}`} />);
          
          loadBanners(); 
          onDataChange?.(); 
      } catch (e) {
          console.error("Restore failed", e);
          toast.custom((id) => <TiketSnackbar id={id} message="Failed to restore banner" variant="error" />);
      }
  };

  const handleSelectBanner = (bannerId: string, shiftKey: boolean) => {
    window.getSelection()?.removeAllRanges();

    if (shiftKey) {
      setSelectedBannerIds(prev => {
        const next = new Set(prev);
        if (next.size === 0 && selectedBannerId && selectedBannerId !== bannerId) {
          next.add(selectedBannerId);
        }
        if (next.has(bannerId)) next.delete(bannerId);
        else next.add(bannerId);

        const nextIds = Array.from(next);
        if (nextIds.length === 0) {
          setSelectedBannerId(null);
        } else if (next.has(bannerId)) {
          setSelectedBannerId(bannerId);
        } else {
          setSelectedBannerId(nextIds[nextIds.length - 1]);
        }

        return next;
      });
    } else if (selectedBannerId === bannerId && selectedBannerIds.size === 0) {
      // Clicking the selected card again unselects it
      setSelectedBannerId(null);
    } else {
      setSelectedBannerIds(new Set());
      setSelectedBannerId(bannerId);
    }
  };

  const clearMultiSelect = () => {
    setSelectedBannerIds(new Set());
    setSelectedBannerId(null);
  };

  // Esc unselects (unless a dialog is open, where Esc closes the dialog)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      setSelectedBannerIds(new Set());
      setSelectedBannerId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleBulkDuplicate = async (bulkBanners: Banner[]) => {
    const duplicatable = bulkBanners.filter(b => b.form_data);
    if (duplicatable.length === 0) {
      toast.custom((id) => <TiketSnackbar id={id} message="None of the selected banners can be duplicated" variant="error" />);
      return;
    }
    const createdIds: string[] = [];
    for (const banner of duplicatable) {
      try {
        const newId = await createBannerDuplicate(banner);
        if (newId) createdIds.push(newId);
      } catch (error) {
        console.error('Bulk duplicate item failed', error);
      }
    }
    if (createdIds.length > 0) {
      await loadBanners();
      onDataChange?.();
      clearMultiSelect();
      toast.custom((id) => <TiketSnackbar id={id} message={`${createdIds.length} banner(s) duplicated to Drafts`} />);
      navigate(`/banners/drafts?highlight=${createdIds[createdIds.length - 1]}`);
    } else {
      toast.custom((id) => <TiketSnackbar id={id} message="Failed to duplicate banners" variant="error" />);
    }
  };

  const handleBulkDownload = async (bulkBanners: Banner[]) => {
    const downloadable = bulkBanners.filter(b => b.form_data || b.imageUrl);
    if (downloadable.length === 0) {
      toast.custom((id) => <TiketSnackbar id={id} message="None of the selected banners have images" variant="error" />);
      return;
    }
    toast.custom((id) => <TiketSnackbar id={id} message={`Downloading ${downloadable.length} banner(s)...`} />);
    for (const banner of downloadable) {
      const dlp = banner.form_data?.dlp;
      // DLP Assets is a set of sub-banners: download it as one ZIP (same as its own "Download as ZIP"),
      // not a single PNG of just the thumbnail — every other category downloads as one banner.
      if (getBannerCategory(banner) === 'DLP Assets' && dlp) {
        if (offscreenRendererRef.current) {
          await offscreenRendererRef.current.downloadDlpZip({
            projectName: banner.name || 'DLP Assets',
            zipName: dlpZipBaseName((banner.form_data as any)?.verticalCategory === 'Hotel' ? 'Accom' : (banner.form_data as any)?.verticalCategory, banner.name || ''),
            scaleFactor: 2,
            banners: buildDlpZipManifest(dlp),
          });
        }
      } else if (getBannerCategory(banner) === 'TTD Promo Asset' && banner.form_data?.ttd) {
        await offscreenRendererRef.current?.downloadDlpZip(buildTtdZipParams(banner.form_data.ttd, banner.name || 'TTD Promo Asset', 2));
      } else {
        await handleDownload(banner, 2);
      }
      // Give the offscreen portal and browser download stack time to settle
      // before mounting the next banner capture.
      await new Promise(r => setTimeout(r, 1200));
    }
  };

  const handleBulkMoveToDrafts = async (bulkBanners: Banner[]) => {
    const published = bulkBanners.filter(b => b.status === 'published');
    if (published.length === 0) return;
    try {
      await Promise.allSettled(
        published.map(b => BannerService.patchBanner(b.id, { status: 'draft' })),
      );
      toast.custom((id) => <TiketSnackbar id={id} message={`${published.length} banner(s) moved to Drafts`} />);
      clearMultiSelect();
      await loadBanners();
      onDataChange?.();
    } catch (error) {
      console.error('Bulk move to drafts failed:', error);
      toast.custom((id) => <TiketSnackbar id={id} message="Failed to move banners" variant="error" />);
    }
  };

  const handleBulkPublish = async (bulkBanners: Banner[]) => {
    const drafts = bulkBanners.filter(b => b.status === 'draft');
    if (drafts.length === 0) return;
    try {
      await Promise.allSettled(
        drafts.map(b => BannerService.patchBanner(b.id, { status: 'published' })),
      );
      toast.custom((id) => <TiketSnackbar id={id} message={`${drafts.length} draft(s) published`} />);
      clearMultiSelect();
      await loadBanners();
      onDataChange?.();
    } catch (error) {
      console.error('Bulk publish failed:', error);
      toast.custom((id) => <TiketSnackbar id={id} message="Failed to publish banners" variant="error" />);
    }
  };

  const isMultiSelect = selectedBannerIds.size >= 2;
  const selectedBanners = useMemo(
    () => banners.filter(b => selectedBannerIds.has(b.id)),
    [banners, selectedBannerIds],
  );

  const selectedBanner = banners.find(b => b.id === selectedBannerId) || null;

  // Draft counts per category tab (before user filters)
  const draftTabItems = useMemo(() => {
    if (!isDraftsPage) return [];
    const drafts = banners.filter(b => b.status === 'draft' && b.createdBy === session?.user.id);
    const items = [{ id: 'all', label: `All (${drafts.length})` }];
    for (const cat of DRAFT_TAB_CATEGORIES) {
      const count = drafts.filter(b => getBannerCategory(b) === cat).length;
      if (count > 0) items.push({ id: cat, label: `${cat} (${count})` });
    }
    return items;
  }, [banners, isDraftsPage, session]);

  // If the active tab disappears (e.g. last draft of that type deleted), fall back to All
  useEffect(() => {
    if (draftTab !== 'all' && draftTabItems.length > 0 && !draftTabItems.some(i => i.id === draftTab)) {
      setDraftTab('all');
    }
  }, [draftTabItems, draftTab]);

  // Track presence for all visible banners
  const bannerIds = useMemo(() => filteredBanners.map(b => b.id), [filteredBanners]);
  const presenceMap = useAllBannersPresence(bannerIds);

  return (
    <>
        <OffscreenBannerRenderer ref={offscreenRendererRef} />
        <MainContent
          banners={filteredBanners}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          verticalFilter={verticalFilter}
          onVerticalFilterChange={onVerticalFilterChange}
          ratioFilter={ratioFilter}
          onRatioFilterChange={onRatioFilterChange}
          sortBy={sortBy}
          onSortChange={onSortChange}
          selectedBannerId={selectedBannerId}
          selectedBannerIds={selectedBannerIds}
          onSelectBanner={handleSelectBanner}
          isSidebarCollapsed={isSidebarCollapsed}
          isLoading={isLoading}
          searchQuery={searchQuery}
          highlightId={highlightId}
          onHighlightHandled={handleHighlightHandled}
          presenceMap={presenceMap}
          availableRatios={availableRatios}
          availableVerticals={availableVerticals}
          {...(isTtdPage ? { templateFilter, onTemplateFilterChange: setTemplateFilter, templateOptions: TTD_TEMPLATE_OPTIONS } : {})}
          onEditBanner={(banner) => handleEdit(banner)}
          onRenameBanner={openRename}
          onResizeBanner={handleResize}
          onDuplicateBanner={handleDuplicate}
          onDownloadBanner={handleDownload}
          onDeleteBanner={handleDeleteClick}
          onBulkDelete={handleBulkDeleteClick}
          onBulkDuplicate={handleBulkDuplicate}
          onBulkDownload={handleBulkDownload}
          onBulkMoveToDrafts={handleBulkMoveToDrafts}
          onBulkPublish={handleBulkPublish}
          onClearSelection={clearMultiSelect}
          showCategoryBadge={isDraftsPage}
          headerSlot={isDraftsPage && draftTabItems.length > 0 ? (
            <TiketTabs
              items={draftTabItems}
              activeId={draftTab}
              onChange={(id) => { setDraftTab(id); clearMultiSelect(); }}
            />
          ) : undefined}
        />
        <AlertDialog open={!!renameTarget} onOpenChange={(o) => { if (!o && !isRenaming) setRenameTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex flex-col gap-[6px]">
              <div className={`flex items-center w-full h-[44px] rounded-[8px] border bg-white ${renameTarget?.error ? 'border-[#d4183d]' : 'border-[#d8dce8] focus-within:border-[#007BFF]'}`}>
                {renameTarget?.prefix && <span className="pl-[12px] text-[14px] font-medium text-[#71747d] whitespace-nowrap select-none">{renameTarget.prefix}</span>}
                <input
                  autoFocus
                  value={renameTarget?.suffix ?? ''}
                  onChange={(e) => setRenameTarget((t) => (t ? { ...t, suffix: e.target.value, error: undefined } : t))}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleRename(); } }}
                  onFocus={(e) => e.currentTarget.select()}
                  className={`flex-1 min-w-0 h-full pr-[12px] ${renameTarget?.prefix ? 'pl-[4px]' : 'pl-[12px]'} bg-transparent outline-none text-[14px] font-medium text-[#303135]`}
                />
              </div>
              {renameTarget?.error && <span className="text-[12px] text-[#d4183d]">{renameTarget.error}</span>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRenaming}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isRenaming || !renameTarget?.suffix.trim() || !!renameTarget?.error}
                onClick={(e) => { e.preventDefault(); void handleRename(); }}
              >
                {isRenaming ? 'Saving...' : 'Rename'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={!!migrateTarget} onOpenChange={(o) => { if (!o) setMigrateTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>This banner uses the old settings</AlertDialogTitle>
              <AlertDialogDescription>
                The banner builder has new layouts and defaults. To edit this banner, a copy is created as a new draft on the latest settings.
                The original stays exactly as it is and can't be edited.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { const b = migrateTarget?.banner; setMigrateTarget(null); if (b) void migrateAndEdit(b); }}>Duplicate & edit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <InspectorPanel
          selectedBanner={isMultiSelect ? null : selectedBanner}
          selectedBanners={isMultiSelect ? selectedBanners : undefined}
          preloadedPreviewUrls={preloadedPreviewUrls}
          onEdit={handleEdit}
          onDownload={handleDownload}
          onDelete={handleDeleteClick}
          onPublishToggle={handlePublishToggle}
          onDuplicate={handleDuplicate}
          onRestore={handleRestore}
          onBulkDelete={handleBulkDeleteClick}
          onBulkDuplicate={handleBulkDuplicate}
          onBulkDownload={handleBulkDownload}
          onBulkMoveToDrafts={handleBulkMoveToDrafts}
          onBulkPublish={handleBulkPublish}
          onClearSelection={clearMultiSelect}
          session={session}
          renderer={offscreenRendererRef}
        />
        <DeleteModal
            isOpen={deleteModalOpen}
            banner={bannerToDelete}
            banners={bannersToDelete}
            onConfirm={handleDeleteConfirm}
            onCancel={() => { setDeleteModalOpen(false); setBannerToDelete(null); setBannersToDelete([]); }}
            isLoading={isDeleting}
        />
    </>
  );
}