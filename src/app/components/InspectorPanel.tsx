import { Banner } from '../../types/banner';
import { ImageWithFallback } from './figma/ImageWithFallback';
import svgPaths from '../../imports/svg-3n792bvqad';
import TdsIcImage from '../../imports/TdsIcImage';
import TdsIcCopy from '../../imports/TdsIcCopy';
import RevIcSave from '../../imports/RevIcSave';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { ChevronDown, Maximize2, Loader2, Check, Sparkles, Eye, RotateCcw, Edit2, X, Save, Copy, Download, Trash2, FileDown, Send } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Lightbox } from './Lightbox';
import { Skeleton } from './ui/skeleton';
import { TiketSnackbar } from './ui/TiketSnackbar';
import { BannerFixed } from './create-banner/BannerFixed';
import { BannerFormData } from './create-banner/types';
import { handoffStore } from '../../utils/indexedDB';
import { fontEmbedCSS, getBase64FontCSS } from '../utils/fontCss';
import {
  captureBannerElement,
  ensureDataUrlForCapture,
  waitForRenderStable,
} from '../utils/bannerCapture';
import TdsIcSparklingGeneral from '../../imports/TdsIcSparklingGeneral-2104-16';
import { useGlobalInteraction } from '../../context/GlobalInteractionContext';
import { getUserDisplayName, getUserAvatarUrl, formatStoredName } from '../utils/userDisplay';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { History, Clock } from 'lucide-react';
import { BannerService } from '../../services/bannerService';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/dialog';
import { ComparisonViewer } from './ComparisonViewer';
import { Session } from '@supabase/supabase-js';
import { TiketTabs } from './ui/TiketTabs';

interface InspectorPanelProps {
  selectedBanner: Banner | null;
  selectedBanners?: Banner[];
  preloadedPreviewUrls?: Set<string>;
  onEdit: (banner: Banner, version?: number) => void;
  onDownload: (banner: Banner) => void;
  onDelete: (banner: Banner) => void;
  onPublishToggle: (banner: Banner) => void;
  onDuplicate: (banner: Banner) => Promise<void>;
  onRestore: (banner: Banner, historyItem: any, newImageUrl?: string) => Promise<void>;
  onBulkDelete?: (banners: Banner[]) => void;
  onBulkDuplicate?: (banners: Banner[]) => void;
  onBulkDownload?: (banners: Banner[]) => void;
  onBulkMoveToDrafts?: (banners: Banner[]) => void;
  onBulkPublish?: (banners: Banner[]) => void;
  onClearSelection?: () => void;
  session: Session | null;
}

export function InspectorPanel({
  selectedBanner,
  selectedBanners,
  preloadedPreviewUrls,
  onEdit,
  onDownload: _onDownloadLegacy,
  onDelete,
  onPublishToggle,
  onDuplicate,
  onRestore,
  onBulkDelete,
  onBulkDuplicate,
  onBulkDownload,
  onBulkMoveToDrafts,
  onBulkPublish,
  onClearSelection,
  session
}: InspectorPanelProps) {
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDuplicateSuccess, setIsDuplicateSuccess] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [previewHistoryItem, setPreviewHistoryItem] = useState<any | null>(null);
  const [restoreItem, setRestoreItem] = useState<any | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'success' | 'error'>('saving');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [capturePreviewUrl, setCapturePreviewUrl] = useState<string | null>(null);
  const [forceCaptureImageReady, setForceCaptureImageReady] = useState(false);
  const [loadedPreviewImageUrl, setLoadedPreviewImageUrl] = useState<string | null>(null);
  
  // Language state for preview
  const [viewLanguage, setViewLanguage] = useState<'en' | 'id'>('en');
  
  const enBannerRef = useRef<HTMLDivElement>(null);
  const idBannerRef = useRef<HTMLDivElement>(null);
  const notifiedUpdatesRef = useRef<Set<string>>(new Set());
  const previewContainerRef = useRef<HTMLDivElement>(null);
  // 432px panel − 2×32px content padding − 2×16px button padding = 336px
  const [previewContainerWidth, setPreviewContainerWidth] = useState(336);

  const { setBlocking } = useGlobalInteraction();

  // Preload fonts as base64 on mount so they're cached before any download/capture
  useEffect(() => {
    getBase64FontCSS().catch(() => {});
  }, []);

  // Measure preview container width for CSS-based scaling (avoids SVG foreignObject rendering issues).
  // useLayoutEffect reads clientWidth synchronously after DOM commit but before paint, so the
  // correct scale is known on the very first render — eliminating the layout-jump flicker that
  // is especially pronounced on tall banners (Portrait 3:4 height-to-width ratio is 1.33×).
  useLayoutEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;
    const w = el.clientWidth;
    if (w > 0) setPreviewContainerWidth(w);
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next && next > 0) setPreviewContainerWidth(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedBanner?.id]);

  // Reset notification when switching to a different banner
  useEffect(() => {
      setShowUpdateNotification(false);
  }, [selectedBanner?.id]);

  // Watch for external updates (Syncing)
  useEffect(() => {
      if (selectedBanner?.isSyncing && selectedBanner?.id && selectedBanner?.updatedAt) {
          // Create unique key for this update event (banner ID + timestamp)
          const updateKey = `${selectedBanner.id}-${selectedBanner.updatedAt}`;
          
          // Only show notification if we haven't already shown it for this specific update
          if (!notifiedUpdatesRef.current.has(updateKey)) {
              notifiedUpdatesRef.current.add(updateKey);
              setShowUpdateNotification(true);
              
              // Auto dismiss after 5 seconds
              const timer = setTimeout(() => setShowUpdateNotification(false), 5000);
              return () => clearTimeout(timer);
          }
      }
  }, [selectedBanner?.isSyncing, selectedBanner?.updatedAt, selectedBanner?.id]);

  useEffect(() => {
      setHistoryItems([]); // Reset history items immediately to prevent UI flash
      if (selectedBanner) {
          setIsLoadingHistory(true);
          BannerService.getHistory(selectedBanner.id)
            .then(setHistoryItems)
            .catch((err) => {
                console.warn('Failed to fetch history:', err);
                // Fail silently or set empty
                setHistoryItems([]);
            })
            .finally(() => setIsLoadingHistory(false));
      }
  }, [selectedBanner?.id]);

  
  // ... existing code ...


  const dateValue = selectedBanner?.status === 'draft' ? selectedBanner.updatedAt : selectedBanner?.createdAt;

  // Cache busting logic
  const cacheBuster = selectedBanner && (selectedBanner as any).updatedAt ? new Date((selectedBanner as any).updatedAt).getTime() : selectedBanner?.id || 'preview';
  const rawImageUrl = selectedBanner?.imageUrl;
  const selectedFormData = selectedBanner?.form_data as BannerFormData | undefined;
  const selectedKeyVisualUrl = selectedFormData?.keyVisualUrl || null;
  const previewImageSource = capturePreviewUrl || selectedKeyVisualUrl || rawImageUrl;
  const withCacheBust = (url: string) => (
    url.startsWith('data:') || url.startsWith('blob:')
      ? url
      : `${url}${url.includes('?') ? '&' : '?'}t=${cacheBuster}`
  );
  const imageUrlWithCacheBust = rawImageUrl ? withCacheBust(rawImageUrl) : undefined;
  const previewImageUrlWithCacheBust = previewImageSource ? withCacheBust(previewImageSource) : undefined;
  const isPreviewBackgroundLoaded = !previewImageUrlWithCacheBust
    || preloadedPreviewUrls?.has(previewImageUrlWithCacheBust)
    || loadedPreviewImageUrl === previewImageUrlWithCacheBust;
  const showPreviewLoading = !!previewImageUrlWithCacheBust && !isPreviewBackgroundLoaded;

  useEffect(() => {
    if (!previewImageUrlWithCacheBust) {
        setLoadedPreviewImageUrl(null);
        return;
    }

    if (preloadedPreviewUrls?.has(previewImageUrlWithCacheBust)) {
        setLoadedPreviewImageUrl(previewImageUrlWithCacheBust);
        return;
    }
    
    setLoadedPreviewImageUrl(null);

    const img = new Image();
    const expectedUrl = previewImageUrlWithCacheBust;
    img.src = expectedUrl;
    
    const handleLoad = () => {
        setLoadedPreviewImageUrl(expectedUrl);
    };
    const handleError = () => {
        setLoadedPreviewImageUrl(null);
    };
    
    img.onload = handleLoad;
    img.onerror = handleError;
    
    return () => {
        img.onload = null;
        img.onerror = null;
    };
  }, [previewImageUrlWithCacheBust, preloadedPreviewUrls]);

  // Reset duplicate states when selected banner changes
  useEffect(() => {
    setIsDuplicating(false);
    setIsDuplicateSuccess(false);
  }, [selectedBanner?.id]);

  const handleDuplicateClick = async () => {
      if (!selectedBanner || isDuplicating) return;
      try {
          setIsDuplicating(true);
          await onDuplicate(selectedBanner);
          setIsDuplicating(false);
          setIsDuplicateSuccess(true);
          
          // Revert back to copy icon after 3 seconds
          setTimeout(() => {
              setIsDuplicateSuccess(false);
          }, 3000);
      } catch (error) {
          setIsDuplicating(false);
      }
  };

  const handleGenerativeResize = async () => {
      if (isResizing) return;

      // Case 1: Dynamic Banner (with Form Data - draft or published)
      // We can generate 3x on the fly
      if (formData && enBannerRef.current) {
          try {
              setIsResizing(true);
              setBlocking(true); // Block UI interactions
              const toastId = toast.custom((t) => (
                  <TiketSnackbar 
                      id={t} 
                      message="Processing..." 
                      icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  />
              ), { duration: Infinity });

              // Wait for render stability
              await document.fonts.ready;
              const base64FontCSS = await getBase64FontCSS();
              await new Promise(resolve => setTimeout(resolve, 1000));

              const bannerElement = enBannerRef.current.children[0] as HTMLElement;
              if (!bannerElement) throw new Error("Banner element not found");

              const dataUrl = await toPng(bannerElement, { 
                  cacheBust: false,
                  useCORS: true, 
                  fontEmbedCSS: base64FontCSS,
                  skipFonts: true,
                  pixelRatio: 3, // FORCE 3x
                  style: { transform: 'none', transformOrigin: 'top left' }
              });

              // Convert to Blob
              const res = await fetch(dataUrl);
              const blob = await res.blob();

              // Store in IndexedDB
              const handoffKey = crypto.randomUUID();
              await handoffStore.set(handoffKey, blob);

              // Update toast to redirecting
              toast.dismiss(toastId);
              toast.custom((t) => (
                  <TiketSnackbar 
                      id={t} 
                      message="Redirecting..." 
                      icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                  />
              ), { duration: Infinity });

              // Redirect with key
              window.location.href = `/tools/generative-resize?handoffKey=${handoffKey}&source=dashboard`;
              // Note: setBlocking(false) is not needed because page will reload/redirect

          } catch (e) {
              console.error("Failed to generate 3x", e);
              setIsResizing(false);
              setBlocking(false); // Unblock on error
              toast.dismiss();
              toast.custom((t) => <TiketSnackbar id={t} message="Failed to generate high-res asset. Trying standard fallback..." variant="error" />);
              
              // Fallback to URL if generation failed
              if (selectedBanner?.imageUrl) {
                   window.location.href = `/tools/generative-resize?imageUrl=${encodeURIComponent(selectedBanner.imageUrl)}&source=dashboard`;
              }
          }
          return;
      }

      // Case 2: Static Image (Uploaded) - No Form Data
      // Fallback to URL logic
      if (!selectedBanner?.imageUrl) {
        toast.custom((t) => (
             <TiketSnackbar id={t} message="No image available for this banner" variant="error" />
        ));
        return;
      }

      // Standard URL Logic (Legacy/Uploaded)
      // Use the logic we just fixed (let GenerativeResize handle fallback)
      setBlocking(true); // Block before redirect
      window.location.href = `/tools/generative-resize?imageUrl=${encodeURIComponent(selectedBanner.imageUrl)}&source=dashboard`;
  };

  if (selectedBanners && selectedBanners.length >= 2) {
    const count = selectedBanners.length;
    const categories = [...new Set(selectedBanners.map(b => b.category).filter(Boolean))];
    const products = [...new Set(selectedBanners.map(b => b.product).filter(Boolean))];
    const hasDuplicatable = selectedBanners.some(b => b.form_data);
    const hasDownloadable = selectedBanners.some(b => b.imageUrl);
    const hasPublished = selectedBanners.some(b => b.status === 'published');
    const hasDrafts = selectedBanners.some(b => b.status === 'draft');

    return (
      <div className="w-[432px] h-screen bg-white border-l border-[#e8eaee] fixed right-0 top-0 flex flex-col">
        <div className="p-[24px] border-b border-[#e8eaee]">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#303135]">
              {count} banners selected
            </h3>
            <button
              onClick={onClearSelection}
              className="text-[14px] text-[#007BFF] hover:text-[#0064D2] font-medium transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-[24px] pt-[48px] pb-[24px]">
          <div className="space-y-4 mb-6">
            {categories.length > 0 && (
              <div>
                <p className="text-[12px] font-medium text-[#71747d] mb-1">Categories</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <span key={cat} className="px-2 py-0.5 bg-[#f0f1f5] text-[12px] text-[#303135] rounded-full">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {products.length > 0 && (
              <div>
                <p className="text-[12px] font-medium text-[#71747d] mb-1">Products</p>
                <div className="flex flex-wrap gap-1.5">
                  {products.map(prod => (
                    <span key={prod} className="px-2 py-0.5 bg-[#f0f1f5] text-[12px] text-[#303135] rounded-full">
                      {prod}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#f8f9fd] rounded-[8px] p-[16px] max-h-[240px] overflow-y-auto mb-6">
            <p className="text-[12px] font-medium text-[#71747d] mb-2">Selected banners</p>
            <div className="space-y-2">
              {selectedBanners.map(b => (
                <div key={b.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#007BFF] shrink-0" />
                  <p className="text-[13px] text-[#303135] truncate">{b.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-medium text-[#71747d] mb-2">Bulk Actions</p>

            <button
              onClick={() => onBulkDuplicate?.(selectedBanners)}
              disabled={!hasDuplicatable}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Copy className="size-4" />
              Duplicate {count} banners
            </button>

            <button
              onClick={() => onBulkDownload?.(selectedBanners)}
              disabled={!hasDownloadable}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-4" />
              Download {count} banners
            </button>

            {hasPublished && (
              <button
                onClick={() => onBulkMoveToDrafts?.(selectedBanners)}
                className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors"
              >
                <FileDown className="size-4" />
                Move to Drafts
              </button>
            )}

            {hasDrafts && (
              <button
                onClick={() => onBulkPublish?.(selectedBanners)}
                className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors"
              >
                <Send className="size-4" />
                Publish Drafts
              </button>
            )}

            <button
              onClick={onClearSelection}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors"
            >
              <X className="size-4" />
              Clear Selection
            </button>

            <div className="pt-2">
              <button
                onClick={() => onBulkDelete?.(selectedBanners)}
                className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-bold text-[#F15C59] bg-[#FFDFDF] hover:bg-[#FC9999] transition-colors"
              >
                <Trash2 className="size-4" />
                Delete {count} banners
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedBanner) {
    return (
      <div className="w-[432px] h-screen bg-white border-l border-[#e8eaee] fixed right-0 top-0 flex flex-col items-center justify-center px-[32px]">
        <div className="text-center">
          
          <h3 className="text-[18px] font-bold text-[#303135] mb-2">
            Please select image
          </h3>
          <p className="text-[14px] text-[#71747d]">
            To see the details here
          </p>
        </div>
      </div>
    );
  }

  const handleDownload = async (lang: 'en' | 'id', scaleFactor: number) => {
    const downloadId = `${lang}-${scaleFactor}`;
    const ref = lang === 'en' ? enBannerRef : idBannerRef;
    if (!ref.current) return;

    // Show loading toast
    const loadingToast = toast.custom((t) => (
        <TiketSnackbar 
            id={t} 
            message="Downloading image, please wait..." 
            variant="default"
            icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />} 
        />
    ), { duration: Infinity });

    try {
        setDownloadingItem(downloadId);
        
        // Ensure fonts and layout are stable before capturing
        // Increased delay to 1000ms to allow complex layouts/fonts to fully settle
        await document.fonts.ready;
        const base64FontCSS = await getBase64FontCSS();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const bannerElement = ref.current.children[0] as HTMLElement;
        
        if (!bannerElement) {
            console.error("Banner element not found in BannerFixed structure");
            toast.dismiss(loadingToast);
            return;
        }

        const dataUrl = await toPng(bannerElement, { 
            cacheBust: false,
            useCORS: true, 
            fontEmbedCSS: base64FontCSS,
            skipFonts: true,
            pixelRatio: scaleFactor, 
            style: {
                transform: 'none', 
                transformOrigin: 'top left'
            }
        });
        
        const link = document.createElement('a');
        link.download = `${selectedBanner.name || 'banner'}-${lang}-${scaleFactor}x.png`;
        link.href = dataUrl;
        link.click();

        toast.dismiss(loadingToast);
        toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message={`${selectedBanner.name || 'Banner'} - ${lang === 'en' ? 'EN' : 'ID'} Translation (${scaleFactor}x) has been downloaded.`}
                variant="default"
            />
        ), { position: 'bottom-center', duration: 3000 });

    } catch (err) {
        console.error('Download failed', err);
        toast.dismiss(loadingToast);
        toast.custom((t) => <TiketSnackbar id={t} message="Failed to download banner. Please try again." variant="error" />);
    } finally {
        setDownloadingItem(null);
    }
  };

  const formatDate = (isoDate: string) => {
    if (!isoDate) return '-';
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatTime = (isoDate: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDimension = (banner: Banner) => {
    // STRICT DIMENSION MAPPING - Use Spec Constants as Fallback
    const getDimensionsByRatio = (category: string, ratio: string | undefined) => {
      if (category === 'Product Entry Point') {
        // Entry Point banners - use ratio key or label
        if (ratio === 'Mobile (2:1)' || ratio === 'mobile_2:1') return '320x160px';
        if (ratio === 'Mobile (4:1)' || ratio === 'mobile_4:1') return '320x80px';
        if (ratio === 'Mobile (5:2)' || ratio === 'mobile_5:2') return '320x128px';
        return '320x128px'; // Default Mobile (5:2)
      } else {
        // Promo banners
        switch (ratio) {
          case 'Landscape (16:9)': return '600x338px';
          case 'Square (1:1)': return '600x600px';
          case 'Portrait (3:4)': return '360x480px';
          case 'Landscape (2:1)': return '600x300px';
          default: return '600x300px';
        }
      }
    };

    // Try metadata.dimension first
    const metadataDimension = (banner.metadata as any)?.dimension;
    if (metadataDimension && metadataDimension !== 'undefined') {
      return metadataDimension;
    }

    // Fallback to dimension property
    if (banner.dimension && banner.dimension !== 'undefined') {
      return banner.dimension;
    }
    
    // Calculate dimension from form_data (handles old banners with incorrect saved data)
    const formData = banner.form_data as any;
    if (formData) {
      const category = formData.bannerCategory || banner.category;
      const ratio = formData.bannerRatio;
      return getDimensionsByRatio(category, ratio);
    }

    // Final fallback
    if (banner.category === 'Product Entry Point') return '320x128px';
    if (banner.category === 'Promo Banner') return '600x300px';
    return '-';
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatName = (name: string | undefined | null) => {
      if (!name) return 'Unknown';
      return formatStoredName(name, 'Unknown');
  };

  const dateLabel = selectedBanner.status === 'draft' ? 'Created' : 'Added on';

  // Prepare form data for hidden rendering
  // If we are restoring, we MUST use the history item's data to capture the correct visual state
  const effectiveBanner = restoreItem || selectedBanner;
  const formData = effectiveBanner.form_data as BannerFormData | undefined;
  
  const previewUrl = capturePreviewUrl || formData?.keyVisualUrl || null;
  const scale = formData?.keyVisualScale || 100;
  const position = formData?.keyVisualPosition || { x: 50, y: 50 };

  const handleRestoreClick = async (historyItem: any) => {
      if (isRestoring) return;
      
      // If no form data (static banner), skip capture and just restore metadata
      if (!historyItem.form_data) {
           await onRestore(selectedBanner, historyItem);
           return;
      }

      try {
          // 1. Set state to trigger hidden render with item's data
          setRestoreItem(historyItem);
          setIsRestoring(true);
          
          // Show loading toast
          const toastId = toast.custom((t) => (
               <TiketSnackbar 
                   id={t} 
                   message={`Restoring Version ${historyItem.version}...`} 
                   icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
               />
          ), { duration: Infinity });
      
          // 2. Wait for render (fonts, layout, images)
          // We need a slight delay to ensure the hidden component has re-rendered with new data
          await new Promise(r => setTimeout(r, 100)); // React render cycle
          await document.fonts.ready;
          const base64FontCSS_restore = await getBase64FontCSS();
          await new Promise(r => setTimeout(r, 1000)); // Image load safety buffer
          
          // 3. Capture Visual
          if (!enBannerRef.current) throw new Error("Render failed");
          
          // The hidden container has 2 children: en and id. We want 'en' (index 0 or 1 depending on impl).
          // Checking the JSX: 
          // <BannerFixed ref={enBannerRef} ... /> 
          // Actually ref is on the component. But BannerFixed uses forwardRef?
          // Let's check BannerFixed. If it forwards ref to the wrapper div, then current IS the wrapper.
          // In handleGenerativeResize: `enBannerRef.current.children[1] as HTMLElement`
          // Assuming structure is correct based on existing code.
          
          const bannerElement = enBannerRef.current.children[0] as HTMLElement;
          if (!bannerElement) throw new Error("Banner element not found");
          
          const dataUrl = await toPng(bannerElement, {
               cacheBust: true,
               useCORS: true,
               fontEmbedCSS: base64FontCSS_restore,
               skipFonts: true,
               pixelRatio: 2, // 2x for dashboard quality
               style: { transform: 'none', transformOrigin: 'top left' }
          });
          
          // 4. Upload to Supabase
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          
          // Overwrite the master image
          const isEntryPoint = selectedBanner.category === 'Product Entry Point' || formData?.bannerCategory === 'Product Entry Point';
          const folderName = isEntryPoint ? 'Entry_Point_Banner' : 'Promo_Banner';
          const path = `${folderName}/${selectedBanner.id}_en.png`;
          // We don't need the returned URL since it's the same path, but good to have
          const { url } = await BannerService.uploadImage(blob, path);
          
          // 5. Trigger Restore Logic (DB Update)
          await onRestore(selectedBanner, historyItem, url);
          
          toast.dismiss(toastId);
          // Success toast is handled in parent or we can do it here
          
      } catch (e) {
          console.error("Restore capture failed", e);
          toast.dismiss();
          toast.custom((t) => <TiketSnackbar id={t} message="Restore failed" variant="error" />);
      } finally {
          setIsRestoring(false);
          setRestoreItem(null);
          setPreviewHistoryItem(null); // Close dialog if open
      }
  };

  const handleQuickSave = async () => {
      if (isSaving || !session?.user) return;
      
      // Only allow Quick Save for draft banners with form_data
      if (selectedBanner.status !== 'draft' || !formData) {
          toast.custom((t) => <TiketSnackbar id={t} message="Quick Save is only available for draft banners" variant="error" />);
          return;
      }

      // Open dialog and start save process
      setShowSaveDialog(true);
      setSaveStatus('saving');
      setIsSaving(true);
      setCapturePreviewUrl(null);
      setForceCaptureImageReady(false);

      try {
          // Match the Success Screen pipeline: capture from an inlined
          // background and force the render path to show the decoded image.
          const captureBackground = formData.keyVisualUrl
              ? await ensureDataUrlForCapture(formData.keyVisualUrl, { strict: true })
              : null;

          if (captureBackground) {
              setCapturePreviewUrl(captureBackground);
          }
          setForceCaptureImageReady(!!captureBackground);
          await waitForRenderStable();

          await document.fonts.ready;
          const base64FontCSS_save = await getBase64FontCSS();
          
          // Capture Visuals
          if (!enBannerRef.current || !idBannerRef.current) throw new Error("Render failed");
          
          const enBannerElement = enBannerRef.current.children[0] as HTMLElement;
          const idBannerElement = idBannerRef.current.children[0] as HTMLElement;
          if (!enBannerElement || !idBannerElement) throw new Error("Banner element not found");
          
          const effectivePixelRatio = 2 / (renderScale || 1);
          const enResult = await captureBannerElement(enBannerElement, {
              pixelRatio: effectivePixelRatio,
              fontCss: base64FontCSS_save,
          });
          const idResult = await captureBannerElement(idBannerElement, {
              pixelRatio: effectivePixelRatio,
              fontCss: base64FontCSS_save,
          });
          
          // Upload generated images
          const isEntryPoint = selectedBanner.category === 'Product Entry Point' || formData?.bannerCategory === 'Product Entry Point';
          const folderName = isEntryPoint ? 'Entry_Point_Banner' : 'Promo_Banner';
          const enPath = `${folderName}/${selectedBanner.id}_en.png`;
          const idPath = `${folderName}/${selectedBanner.id}_id.png`;
          const [enUpload, idUpload] = await Promise.all([
              BannerService.uploadImage(enResult.blob, enPath),
              BannerService.uploadImage(idResult.blob, idPath),
          ]);
          
          // Calculate file size
          const fileSizeKB = Math.round(enResult.blob.size / 1024);
          const fileSize = fileSizeKB < 1024 ? `${fileSizeKB} KB` : `${(fileSizeKB / 1024).toFixed(2)} MB`;
          
          // Get dimension from formData
          const getDimensionFromFormData = () => {
              if (formData.bannerCategory === 'Product Entry Point') {
                  // Entry Point banners
                  if (formData.bannerRatio === 'Mobile (2:1)' || formData.bannerRatio === 'mobile_2:1') {
                      return '320x160px';
                  } else if (formData.bannerRatio === 'Mobile (4:1)' || formData.bannerRatio === 'mobile_4:1') {
                      return '320x80px';
                  } else if (formData.bannerRatio === 'Mobile (2:1 WhatsApp)' || formData.bannerRatio === 'mobile_2:1_whatsapp') {
                      return '320x160px';
                  } else {
                      // Default to Mobile (5:2)
                      return '320x128px';
                  }
              } else if (formData.bannerRatio) {
                  // Promo banners
                  switch (formData.bannerRatio) {
                      case 'Landscape (16:9)': return '600x338px';
                      case 'Square (1:1)': return '600x600px';
                      case 'Portrait (3:4)': return '360x480px';
                      case 'Landscape (2:1)': return '600x300px';
                      default: return '600x300px';
                  }
              }
              return '600x300px';
          };
          
          // Get user info
          const userName = getUserDisplayName(session.user, 'Unknown');
          
          // Update banner to published status - preserve all fields from draft
          // If creator_name is empty (from incomplete draft), use current user's name
          const userAvatar = getUserAvatarUrl(session.user);
          const finalFormData = {
              ...formData,
              keyVisualFile: undefined,
              manualBackgroundFile: undefined,
          };
          
          await BannerService.updateBanner(selectedBanner.id, {
              name: selectedBanner.name,
              category: selectedBanner.category,
              product: selectedBanner.product,
              status: 'published',
              form_data: finalFormData,
              image_url_en: enUpload.url,
              image_url_id: idUpload.url,
              created_by: selectedBanner.createdBy || session.user.id,
              creator_name: selectedBanner.creatorName || userName,
              last_edited_by_id: session.user.id,
              last_edited_by_name: userName,
              user_avatar: userAvatar,
              metadata: {
                  dimension: getDimensionFromFormData(),
                  fileSize: fileSize
              }
          });
          
          // Success state
          setSaveStatus('success');
          
          // Wait a bit to show success message then redirect
          await new Promise(r => setTimeout(r, 1500));
          
          // Redirect to the correct category tab
          const categoryParam = encodeURIComponent(selectedBanner.category);
          window.location.href = `/banners?tab=published&category=${categoryParam}`;
          
      } catch (e) {
          console.error("Quick Save failed", e);
          setSaveStatus('error');
          setSaveErrorMessage(e instanceof Error ? e.message : 'Failed to save banner');
      } finally {
          setIsSaving(false);
          setCapturePreviewUrl(null);
          setForceCaptureImageReady(false);
      }
  };

  const getPreviewStyle = () => {
      // 0. Category Check - Specific override for Product Entry Point
      if (formData?.bannerCategory === 'Product Entry Point') {
           return { aspectRatio: '5/2' };
      }

      // 1. FormData
      if (formData?.bannerRatio) {
          switch (formData.bannerRatio) {
              case 'Square (1:1)': return { aspectRatio: '1/1' };
              case 'Portrait (3:4)': return { aspectRatio: '3/4' };
              case 'Landscape (16:9)': return { aspectRatio: '16/9' };
              case 'Landscape (2:1)': return { aspectRatio: '2/1' };
          }
      }

      // 2. Dimension Property
      const dim = selectedBanner.dimension; // e.g., "600x600px"
      if (dim) {
          const parts = dim.toLowerCase().replace('px', '').split('x');
          if (parts.length === 2) {
              const w = parseFloat(parts[0]);
              const h = parseFloat(parts[1]);
              if (!isNaN(w) && !isNaN(h) && h !== 0) {
                  return { aspectRatio: `${w}/${h}` };
              }
          }
      }
      
      return { aspectRatio: '2/1' };
  };
  
  // Calculate Render Scale for Product Entry Point
  const isEntryPoint = formData?.bannerCategory === 'Product Entry Point';
  const isDesktopEntryPoint = formData?.bannerRatio === 'Desktop (5:1)' || formData?.bannerRatio === 'Desktop (8:1)';
  // Mobile entry points are 320px wide → scale to 600px. Desktop are 640px → scale down to 600px.
  const renderScale = isEntryPoint ? (isDesktopEntryPoint ? 600 / 640 : 1.875) : undefined;

  // Calculate native banner dimensions for CSS-based preview scaling
  const getNativeBannerDimensions = () => {
    const isPortraitRatio = formData?.bannerRatio === 'Portrait (3:4)';
    const nativeWidth = isPortraitRatio ? 360 : 600;
    let nativeHeight = isPortraitRatio ? 480 : 300;
    if (formData) {
      if (isEntryPoint) {
        if (formData.bannerRatio === 'Desktop (5:1)') {
          nativeHeight = Math.round(128 * (600 / 640)); // ~120
        } else if (formData.bannerRatio === 'Desktop (8:1)') {
          nativeHeight = Math.round(80 * (600 / 640)); // 75
        } else if (formData.bannerRatio === 'Mobile (2:1)' || formData.bannerRatio === 'mobile_2:1') {
          nativeHeight = 300;
        } else if (formData.bannerRatio === 'Mobile (4:1)' || formData.bannerRatio === 'mobile_4:1') {
          nativeHeight = 150;
        } else {
          nativeHeight = 240;
        }
      } else if (!isPortraitRatio) {
        switch (formData.bannerRatio) {
          case 'Landscape (16:9)': nativeHeight = 337.5; break;
          case 'Square (1:1)': nativeHeight = 600; break;
          case 'Landscape (2:1)':
          default: nativeHeight = 300; break;
        }
      }
    }
    return { nativeWidth, nativeHeight };
  };
  const { nativeWidth, nativeHeight } = getNativeBannerDimensions();
  const previewScale = previewContainerWidth / nativeWidth;

  return (
    <div className="w-[432px] h-screen bg-white border-l border-[#d8dce8] fixed right-0 top-0 overflow-y-auto">
      {/* Hidden Banner Rendering for Downloads - Optimized for reliable html-to-image capture */}
      {formData && (
        <div style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            width: '600px', 
            height: '2000px', 
            zIndex: -9999, 
            opacity: 0, 
            pointerEvents: 'none', 
            overflow: 'hidden' 
        }}>
           <BannerFixed 
                ref={enBannerRef}
                formData={formData} 
                lang="en" 
                scale={scale}
                position={position}
                previewUrl={previewUrl}
                isDraggable={false} 
                hideHeader={true}
                fullSize={true}
                renderScale={renderScale}
                isImagePreloaded={forceCaptureImageReady ? true : undefined}
            />
            <BannerFixed 
                ref={idBannerRef}
                formData={formData} 
                lang="id" 
                scale={scale}
                position={position}
                previewUrl={previewUrl}
                isDraggable={false} 
                hideHeader={true}
                fullSize={true}
                renderScale={renderScale}
                isImagePreloaded={forceCaptureImageReady ? true : undefined}
            />
        </div>
      )}

      {/* Content Container */}
      <div className="flex flex-col gap-[24px] px-[32px] pt-[132px] pb-[32px]">
        
        {/* Sync Notification */}
        {showUpdateNotification && (
           <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
               <Sparkles className="w-4 h-4 shrink-0" />
               <div className="text-sm">
                   <span className="font-semibold block">Update Received!</span>
                   <span className="text-xs opacity-90">
                       This banner was just updated by {formatStoredName(selectedBanner?.lastEditedByName, 'someone')}.
                   </span>
               </div>
               <button onClick={() => setShowUpdateNotification(false)} className="ml-auto hover:bg-blue-100 p-1 rounded transition-colors">
                   <X className="w-4 h-4" />
               </button>
           </div>
        )}

        {/* Version History Button */}
        <div className="flex justify-end">
            {/* Popover moved to Asset Info section */}
            
            {/* History Preview Modal - Comparison Viewer */}
            <ComparisonViewer
                isOpen={!!previewHistoryItem}
                onClose={() => setPreviewHistoryItem(null)}
                currentBanner={selectedBanner}
                historyItem={previewHistoryItem}
                historyItems={historyItems}
                onSelectHistoryItem={setPreviewHistoryItem}
                onRestore={handleRestoreClick}
                onEdit={(version) => {
                    onEdit(selectedBanner, version);
                    setPreviewHistoryItem(null);
                }}
                isRestoring={isRestoring}
                formatName={formatName}
            />
        </div>

        {/* Preview Image & Actions */}
        <div className="flex flex-col gap-[16px] items-center w-full mx-[0px] my-[-16px]">
          {/* Language Tabs - Only show for dynamic banners with form_data */}
          {formData && (
            <TiketTabs
              items={[
                { id: 'en', label: 'EN' },
                { id: 'id', label: 'ID' }
              ]}
              activeId={viewLanguage}
              onChange={(id) => setViewLanguage(id as 'en' | 'id')}
              className="w-full justify-center"
            />
          )}
          
          {/* Preview Image */}
          <Lightbox
            hasLanguageSwitcher={!!formData}
            currentLanguage={viewLanguage}
            onLanguageChange={(lang) => setViewLanguage(lang)}
            trigger={
              <button 
                className="w-full min-h-[120px] bg-gray-50 flex items-center justify-center rounded-lg border border-gray-100 p-4 relative group cursor-zoom-in focus:outline-none text-left"
              >
                {formData ? (
                   <div ref={previewContainerRef} className="relative w-full overflow-hidden shadow-sm rounded-xl" style={{ aspectRatio: `${nativeWidth}/${nativeHeight}` }}>
                     {/* EN Preview - CSS transform scaling (avoids SVG foreignObject rendering quirks) */}
                     <div 
                       className="absolute top-0 left-0 pointer-events-none" 
                       style={{ 
                         width: `${nativeWidth}px`,
                         transform: `scale(${previewScale})`,
                         transformOrigin: 'top left',
                         opacity: viewLanguage === 'en' ? 1 : 0,
                         transition: 'opacity 150ms ease-in-out',
                         willChange: 'opacity',
                         visibility: viewLanguage === 'en' ? 'visible' : 'hidden'
                       }}
                     >
                       <BannerFixed
                        key={`preview-en-${selectedBanner.id}-${selectedKeyVisualUrl || rawImageUrl || 'none'}`}
                         formData={formData}
                         lang="en"
                         scale={scale}
                         position={position}
                         previewUrl={previewUrl}
                        isImagePreloaded={isPreviewBackgroundLoaded}
                         hideHeader={true}
                         fullSize={true}
                         renderScale={renderScale}
                       />
                     </div>
                     
                     {/* ID Preview */}
                     <div 
                       className="absolute top-0 left-0 pointer-events-none" 
                       style={{ 
                         width: `${nativeWidth}px`,
                         transform: `scale(${previewScale})`,
                         transformOrigin: 'top left',
                         opacity: viewLanguage === 'id' ? 1 : 0,
                         transition: 'opacity 150ms ease-in-out',
                         willChange: 'opacity',
                         visibility: viewLanguage === 'id' ? 'visible' : 'hidden'
                       }}
                     >
                       <BannerFixed
                        key={`preview-id-${selectedBanner.id}-${selectedKeyVisualUrl || rawImageUrl || 'none'}`}
                         formData={formData}
                         lang="id"
                         scale={scale}
                         position={position}
                         previewUrl={previewUrl}
                        isImagePreloaded={isPreviewBackgroundLoaded}
                         hideHeader={true}
                         fullSize={true}
                         renderScale={renderScale}
                       />
                     </div>
                   </div>
                ) : (
                    <ImageWithFallback
                      src={imageUrlWithCacheBust}
                      alt={selectedBanner.name}
                      className="w-full h-auto max-h-[300px] object-contain pointer-events-none"
                    />
                )}
                
                {showPreviewLoading && (
                    <div
                      className="absolute inset-4 z-30 overflow-hidden rounded-xl border border-[#d8dce8] bg-[#f8f9fd] shadow-sm"
                      role="status"
                      aria-live="polite"
                      aria-label="Loading banner preview"
                    >
                      <style dangerouslySetInnerHTML={{__html: `
                        @keyframes inspector-preview-shimmer {
                          0% { transform: translateX(-100%); }
                          100% { transform: translateX(100%); }
                        }
                        @media (prefers-reduced-motion: reduce) {
                          .inspector-preview-shimmer { animation: none !important; }
                        }
                      `}} />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,123,255,0.14),transparent_34%),linear-gradient(135deg,#ffffff_0%,#eef6ff_48%,#f8f9fd_100%)]" />
                      <div className="inspector-preview-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent" style={{ animation: 'inspector-preview-shimmer 1.4s ease-in-out infinite' }} />
                      <div className="absolute left-[7%] top-[15%] h-[16%] w-[56%] rounded-full bg-white/80 shadow-sm" />
                      <div className="absolute left-[7%] top-[39%] h-[12%] w-[34%] rounded-full bg-white/60" />
                      <div className="absolute bottom-[14%] left-[7%] h-[10%] w-[22%] rounded-full bg-[#007BFF]/15" />
                      <div className="absolute right-[7%] top-[16%] h-[18%] w-[22%] rounded-full bg-white/85 shadow-sm" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/35 backdrop-blur-[2px]">
                        <Loader2 className="h-5 w-5 animate-spin text-[#007BFF]" />
                        <span className="text-[12px] font-semibold text-[#4d4f56]">
                          Preparing preview...
                        </span>
                      </div>
                    </div>
                )}

                {/* Hover Overlay */}
                {!showPreviewLoading && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 rounded-lg">
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                         <Maximize2 className="w-6 h-6" />
                    </div>
                </div>
                )}
              </button>
            }
          >
             {formData ? (
                 <div className="relative" style={{ transform: 'scale(2.5)', transformOrigin: 'center' }}>
                   {/* EN Lightbox - Hidden/Shown based on language */}
                   <div 
                     className="rounded-xl overflow-hidden shadow-2xl bg-transparent" 
                     style={{ 
                       opacity: viewLanguage === 'en' ? 1 : 0,
                       transition: 'opacity 150ms ease-in-out',
                       willChange: 'opacity',
                       position: viewLanguage === 'en' ? 'relative' : 'absolute',
                       pointerEvents: viewLanguage === 'en' ? 'auto' : 'none',
                       top: 0,
                       left: 0,
                       visibility: viewLanguage === 'en' ? 'visible' : 'hidden'
                     }}
                   >
                     <BannerFixed
                        key={`lightbox-en-${selectedBanner.id}-${selectedKeyVisualUrl || rawImageUrl || 'none'}`}
                         formData={formData}
                         lang="en"
                         scale={scale}
                         position={position}
                         previewUrl={previewUrl}
                         thumbnailUrl={imageUrlWithCacheBust}
                        isImagePreloaded={isPreviewBackgroundLoaded}
                         hideHeader={true}
                         hideBorder={true}
                         renderScale={renderScale}
                     />
                   </div>
                   
                   {/* ID Lightbox - Hidden/Shown based on language */}
                   <div 
                     className="rounded-xl overflow-hidden shadow-2xl bg-transparent" 
                     style={{ 
                       opacity: viewLanguage === 'id' ? 1 : 0,
                       transition: 'opacity 150ms ease-in-out',
                       willChange: 'opacity',
                       position: viewLanguage === 'id' ? 'relative' : 'absolute',
                       pointerEvents: viewLanguage === 'id' ? 'auto' : 'none',
                       top: 0,
                       left: 0,
                       visibility: viewLanguage === 'id' ? 'visible' : 'hidden'
                     }}
                   >
                     <BannerFixed
                        key={`lightbox-id-${selectedBanner.id}-${selectedKeyVisualUrl || rawImageUrl || 'none'}`}
                         formData={formData}
                         lang="id"
                         scale={scale}
                         position={position}
                         previewUrl={previewUrl}
                         thumbnailUrl={imageUrlWithCacheBust}
                        isImagePreloaded={isPreviewBackgroundLoaded}
                         hideHeader={true}
                         hideBorder={true}
                         renderScale={renderScale}
                     />
                   </div>
                 </div>
             ) : (
                 <img 
                    src={imageUrlWithCacheBust} 
                    alt={selectedBanner.name} 
                    className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                    draggable={false}
                 />
             )}
          </Lightbox>

          {/* Action Buttons */}
          <div className="bg-[#f4f7fe] flex gap-[12px] items-start px-[16px] py-[8px] rounded-[56px]">
            {/* Edit */}
            <button
              onClick={() => onEdit(selectedBanner)}
              className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
            >
              <div className="size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p27010400} fill="#4D4F56" fillRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                Edit
              </span>
            </button>

            {/* Quick Save (for drafts) or Generative Resize (for published) */}
            {selectedBanner.status === 'draft' && formData ? (
              <button
                onClick={handleQuickSave}
                disabled={isSaving}
                className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save and publish banner"
              >
                <div className="size-[24px] text-[#4D4F56] flex items-center justify-center">
                   {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <RevIcSave />}
                </div>
                <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                  {isSaving ? 'Saving...' : 'Save'}
                </span>
              </button>
            ) : (
              <button
                onClick={handleGenerativeResize}
                disabled={isResizing}
                className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Resize with AI"
              >
                <div className="size-[24px] text-[#4D4F56] flex items-center justify-center">
                   {isResizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <TdsIcSparklingGeneral />}
                </div>
                <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                  {isResizing ? '... ' : 'Resize'}
                </span>
              </button>
            )}

            {/* Duplicate */}
            <button
              onClick={handleDuplicateClick}
              disabled={isDuplicating || isDuplicateSuccess}
              className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <div className="size-[24px] flex items-center justify-center">
                 {isDuplicating ? (
                     <Loader2 className="w-5 h-5 animate-spin text-[#007BFF]" />
                 ) : isDuplicateSuccess ? (
                     <Check className="w-6 h-6 text-green-500" />
                 ) : (
                     <TdsIcCopy />
                 )}
              </div>
              <span className={`font-semibold leading-[16px] text-[12px] text-center ${isDuplicateSuccess ? 'text-green-600' : 'text-[#71747d]'}`}>
                {isDuplicating ? 'Copying...' : isDuplicateSuccess ? 'Copied' : 'Duplicate'}
              </span>
            </button>

            {/* Download - Only show if not draft */}
            {selectedBanner.status !== 'draft' && formData && (
             <Popover>
                <PopoverTrigger asChild>
                    <button
                      className="flex flex-col gap-[4px] items-center p-[4px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
                    >
                      <div className="size-[24px]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                          <path clipRule="evenodd" d={svgPaths.p34d29200} fill="#4D4F56" fillRule="evenodd" />
                        </svg>
                      </div>
                      <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center flex items-center gap-1">
                        Download <ChevronDown className="w-3 h-3" />
                      </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4 bg-white" align="center" sideOffset={8}>
                    <div className="flex flex-col gap-4">
                        {/* EN Section */}
                        <div className="flex flex-col gap-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🇬🇧 English Version</span>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 1.5, 2, 3].map(factor => (
                                    <button 
                                        key={`en-${factor}`}
                                        onClick={() => handleDownload('en', factor)}
                                        disabled={!!downloadingItem}
                                        className={`px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px] ${downloadingItem && downloadingItem !== `en-${factor}` ? 'opacity-50' : ''}`}
                                    >
                                        {downloadingItem === `en-${factor}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        ) : (
                                            `${factor}x`
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="h-px bg-gray-200 w-full" />
                        
                        {/* ID Section */}
                        <div className="flex flex-col gap-3">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">🇮🇩 Bahasa Indonesia Version</span>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 1.5, 2, 3].map(factor => (
                                    <button 
                                        key={`id-${factor}`}
                                        onClick={() => handleDownload('id', factor)}
                                        disabled={!!downloadingItem}
                                        className={`px-2 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-[6px] hover:bg-gray-200 transition-colors border border-transparent hover:border-gray-300 disabled:cursor-not-allowed flex items-center justify-center min-w-[40px] ${downloadingItem && downloadingItem !== `id-${factor}` ? 'opacity-50' : ''}`}
                                    >
                                        {downloadingItem === `id-${factor}` ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                        ) : (
                                            `${factor}x`
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </PopoverContent>
             </Popover>
            )}

            {/* Delete */}
            <button
              onClick={() => onDelete(selectedBanner)}
              className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
            >
              <div className="size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p316f1e80} fill="#4D4F56" fillRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                Delete
              </span>
            </button>



          </div>
        </div>

        {/* Banner Title */}
        <div className="flex flex-col gap-[8px] w-full">
          <h3 className="font-bold leading-[24px] text-[#303135] text-[18px]">
            {selectedBanner.name}
          </h3>
        </div>

        {/* Asset Info */}
        <div className="flex flex-col gap-[8px] w-[360px]">
          <h4 className="font-bold leading-[22px] text-[#71747d] text-[16px]">
            Asset Info
          </h4>
          
          <div className="flex gap-[8px] w-full">
            {/* Left Column Labels */}
            <div className="flex flex-col gap-[8px] w-[72px]">
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Product
              </p>
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Dimension
              </p>
              {selectedBanner.status !== 'draft' && (
                <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                    Creator
                </p>
              )}
            </div>

            {/* Left Column Values */}
            <div className="flex flex-col gap-[8px] flex-1">
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {selectedBanner.product}
              </p>
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {getDimension(selectedBanner)}
              </p>
              {selectedBanner.status !== 'draft' && (
                <p className="font-bold leading-[20px] text-[#303135] text-[14px] truncate" title={formatName(selectedBanner.creatorName)}>
                    {formatName(selectedBanner.creatorName) || '-'}
                </p>
              )}
            </div>

            {/* Right Column Labels */}
            <div className="flex flex-col gap-[8px] w-[72px]">
              {selectedBanner.status !== 'draft' && (
                <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                  File size
                </p>
              )}
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                {dateLabel}
              </p>
            </div>

            {/* Right Column Values */}
            <div className="flex flex-col gap-[8px] flex-1">
              {selectedBanner.status !== 'draft' && (
                <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                  {selectedBanner.fileSize}
                </p>
              )}
              <div className="flex flex-col">
                <span className="font-bold leading-[20px] text-[#303135] text-[14px]">
                    {formatDate(dateValue)}
                </span>
                <span className="font-bold leading-[20px] text-[#303135] text-[14px]">
                    {formatTime(dateValue)}
                </span>
              </div>
            </div>
          </div>

          {(historyItems.length > 0 || (selectedBanner.version || 1) > 1) && (
            <>
              {/* Divider */}
              <div className="h-px bg-[#e8eaee] w-full my-[10px] mx-[0px]" />

              <div className="flex gap-[8px] w-full">
                 {/* Left Column Labels - Bottom */}
                <div className="flex flex-col gap-[8px] w-[72px]">
                   <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                    Version
                  </p>
                </div>

                {/* Left Column Values - Bottom */}
                <div className="flex flex-col gap-[8px] flex-1">
                  <div className="flex items-center gap-2">
                      <span className="font-bold leading-[20px] text-[#303135] text-[14px]">
                        v{selectedBanner.version || 1}
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                            <button className="text-blue-600 hover:text-blue-800 flex items-center justify-center transition-colors w-5 h-5 rounded hover:bg-blue-50 cursor-pointer" title="View version history">
                                <History className="w-3.5 h-3.5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] max-h-[400px] overflow-y-auto p-0" align="start">
                            <div className="p-3 border-b bg-gray-50 flex items-center justify-between sticky top-0 z-10">
                                <span className="font-semibold text-sm text-gray-700">History</span>
                                {isLoadingHistory ? (
                                    <Skeleton className="h-3 w-16" />
                                ) : (
                                    <span className="text-xs text-gray-500">{historyItems.length} versions</span>
                                )}
                            </div>
                            {isLoadingHistory ? (
                                <div className="divide-y">
                                    {[1, 2, 3].map((i) => (
                                        <div key={`skeleton-${i}`} className="p-3 flex flex-col gap-2">
                                            <div className="flex justify-between items-center">
                                                <Skeleton className="h-4 w-20" />
                                                <Skeleton className="h-3 w-12" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Skeleton className="h-3 w-3 rounded-full" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                            <Skeleton className="h-3 w-24 mt-1" />
                                        </div>
                                    ))}
                                </div>
                            ) : historyItems.length === 0 ? (
                                <div className="p-8 text-center text-gray-500 text-sm">No history available</div>
                            ) : (
                                <div className="divide-y">
                                    {historyItems.map((item, index) => (
                                        <div 
                                            key={item.version || `history-${index}`} 
                                            className="p-3 hover:bg-gray-50 transition-colors flex flex-col gap-1 group/item relative cursor-pointer"
                                            onClick={() => setPreviewHistoryItem(item)}
                                        >
                                            <div className="flex justify-between items-center h-6">
                                                <span className="font-medium text-gray-900 text-sm">Version {item.version}</span>
                                                <span className="text-xs text-gray-500">{getRelativeTime(item.updated_at || item.updatedAt)}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(item.updated_at || item.updatedAt).toLocaleString()}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Edited by <span className="font-medium">{formatName(item.last_edited_by_name || item.creator_name)}</span>
                                            </div>
                                            {item.restore_note && (
                                                <div className="mt-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md inline-block w-fit">
                                                    {item.restore_note}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Right Column Labels - Bottom */}
                <div className="flex flex-col gap-[8px] w-[72px]">
                   <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                    Last Edited
                  </p>
                </div>

                {/* Right Column Values - Bottom */}
                <div className="flex flex-col gap-[8px] flex-1">
                  <div className="text-[14px] leading-[20px]">
                     <span 
                        className="text-gray-500 hover:text-gray-700 cursor-default transition-colors"
                        title={(() => {
                            const d = new Date(selectedBanner.updatedAt || selectedBanner.createdAt);
                            return `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                        })()}
                     >
                        {getRelativeTime(selectedBanner.updatedAt || selectedBanner.createdAt)}
                     </span>
                     <span className="text-gray-400 mx-1">by</span>
                     <span className="font-semibold text-gray-900 truncate inline-block align-bottom max-w-[120px]" title={formatName(selectedBanner.lastEditedByName || selectedBanner.creatorName)}>
                        {formatName(selectedBanner.lastEditedByName || selectedBanner.creatorName)}
                     </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={(open) => {
          // Only allow closing on error state
          if (saveStatus === 'error' && !open) {
              setShowSaveDialog(false);
              setSaveErrorMessage('');
          }
      }}>
          <DialogContent 
              className="w-[420px] max-w-[90vw]" 
              hideCloseButton={saveStatus !== 'error'}
              onPointerDownOutside={(e) => {
                  // Prevent closing on overlay click unless error
                  if (saveStatus !== 'error') {
                      e.preventDefault();
                  }
              }}
              onEscapeKeyDown={(e) => {
                  // Prevent closing on Esc key unless error
                  if (saveStatus !== 'error') {
                      e.preventDefault();
                  }
              }}
          >
              <div className="flex flex-col items-center gap-6 py-4">
                  {/* Icon/Animation */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-50">
                      {saveStatus === 'saving' && (
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      )}
                      {saveStatus === 'success' && (
                          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                              <Check className="w-8 h-8 text-green-600" />
                          </div>
                      )}
                      {saveStatus === 'error' && (
                          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                              <X className="w-8 h-8 text-red-600" />
                          </div>
                      )}
                  </div>

                  {/* Title and Description */}
                  <div className="text-center space-y-2">
                      <DialogTitle className="text-xl font-bold text-[#303135]">
                          {saveStatus === 'saving' && 'Saving Banner'}
                          {saveStatus === 'success' && 'Banner Published!'}
                          {saveStatus === 'error' && 'Publishing Failed'}
                      </DialogTitle>
                      <DialogDescription className="text-sm text-[#71747d] max-w-[320px]">
                          {saveStatus === 'saving' && 'Please wait while we save and publish your banner. This may take a few moments.'}
                          {saveStatus === 'success' && 'Your banner has been successfully published and is now available in the banner list.'}
                          {saveStatus === 'error' && saveErrorMessage}
                      </DialogDescription>
                  </div>

                  {/* Action Button (only for error state) */}
                  {saveStatus === 'error' && (
                      <button
                          onClick={() => {
                              setShowSaveDialog(false);
                              setSaveErrorMessage('');
                          }}
                          className="px-6 py-2 bg-[#007BFF] text-white font-semibold rounded-lg hover:bg-[#0056b3] transition-colors"
                      >
                          Close
                      </button>
                  )}

                  {/* Progress indicator for saving */}
                  {saveStatus === 'saving' && (
                      <div className="w-full max-w-[280px] h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
}