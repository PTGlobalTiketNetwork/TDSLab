import { useState, useEffect, useRef } from 'react';
import { BannerFormData } from './types';
import { BannerFixed } from './BannerFixed';
import { getBase64FontCSS } from '../../utils/fontCss';
import {
  captureBannerElement,
  ensureDataUrlForCapture,
  fileToDataUrl,
  waitForRenderStable,
} from '../../utils/bannerCapture';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { svgPaths } from './assets/Icons';
import LogoTiketHorizontal from '../../../imports/LogoTiketHorizontal-7-464';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { BannerService } from '../../../services/bannerService';
import { supabase } from '../../../utils/supabase/client';
import { Header } from '../Header';
import { handoffStore } from '../../../utils/indexedDB';
import TdsIcSparklingGeneral from '../../../imports/TdsIcSparklingGeneral-2104-16';
import { useGlobalInteraction } from '../../../context/GlobalInteractionContext';
import { useAccess } from '../../../context/AccessContext';
import { getUserDisplayName, getUserAvatarUrl } from '../../utils/userDisplay';

function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface SuccessScreenProps {
  formData: BannerFormData;
  onBackToList: () => void;
  onSave: () => void;
  userName: string;
  userAvatar?: string;
  overwriteMode?: boolean;
  editingId?: string;
  initialStatus?: 'draft' | 'published';
  onLogout?: () => void;
}

export function SuccessScreen({ 
  formData, 
  onBackToList, 
  onSave, 
  userName,
  userAvatar,
  overwriteMode,
  editingId,
  initialStatus,
  onLogout
}: SuccessScreenProps) {
  const { isWhitelisted } = useAccess();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Tracks which phase of the save pipeline we're in so the Save button can
  // give honest feedback: 'preparing' covers background inline + capture,
  // 'saving' covers upload + DB write.
  const [saveStage, setSaveStage] = useState<'idle' | 'preparing' | 'saving'>('idle');
  const [forceCaptureImageReady, setForceCaptureImageReady] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  
  // Refs for the fixed banner components
  const enBannerRef = useRef<HTMLDivElement>(null);
  const idBannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formData.keyVisualFile) {
        const url = URL.createObjectURL(formData.keyVisualFile);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    } else {
        setPreviewUrl(formData.keyVisualUrl || null);
    }
  }, [formData.keyVisualFile, formData.keyVisualUrl]);

  const { setBlocking } = useGlobalInteraction();

  // Preload fonts as base64 on mount so they're cached before any download/capture
  useEffect(() => {
    getBase64FontCSS().catch(() => {});
  }, []);

  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const renderScale = isProductEntryPoint ? 2 : 1;

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
        let captureBackground: string | null = previewUrl;
        if (formData.keyVisualFile) {
            captureBackground = await fileToDataUrl(formData.keyVisualFile);
        } else if (formData.keyVisualUrl) {
            captureBackground = await ensureDataUrlForCapture(formData.keyVisualUrl, { strict: true });
        }
        if (captureBackground && captureBackground !== previewUrl) {
            setPreviewUrl(captureBackground);
        }
        setForceCaptureImageReady(!!captureBackground);
        await waitForRenderStable();
        // ref.current is the BannerFixed root div
        // When hideHeader={true}, structure is:
        // div (root)
        //   div (Banner Content) -> children[0]
        // When hideHeader={false}, structure would be:
        // div (root)
        //   div (Header) -> children[0]
        //   div (Banner Content) -> children[1]

        await document.fonts.ready;
        const base64FontCSS = await getBase64FontCSS();

        const bannerElement = ref.current.children[0] as HTMLElement;

        if (!bannerElement) {
            console.error("Banner element not found in BannerFixed structure");
            toast.dismiss(loadingToast);
            return;
        }

        // Adjust pixelRatio based on renderScale
        // renderScale renders the element larger/smaller visually.
        // scaleFactor is the desired output scale relative to ORIGINAL size (1x).
        // If renderScale is 2 (element is 2x big), and we want 1x output, we need pixelRatio 0.5.
        const effectivePixelRatio = scaleFactor / renderScale;

        const { dataUrl } = await captureBannerElement(bannerElement, {
            pixelRatio: effectivePixelRatio,
            fontCss: base64FontCSS,
        });

        const link = document.createElement('a');
        link.download = `${formData.bannerName || 'banner'}-${lang}-${scaleFactor}x.png`;
        link.href = dataUrl;
        link.click();

        toast.dismiss(loadingToast);
        toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message={`${formData.bannerName || 'Banner'} - ${lang === 'en' ? 'EN' : 'ID'} Translation (${scaleFactor}x) has been downloaded.`}
                variant="default"
            />
        ), { position: 'bottom-center', duration: 3000 });

    } catch (err) {
        console.error('Download failed', err);
        toast.dismiss(loadingToast);
        toast.custom((t) => <TiketSnackbar id={t} message="Failed to download banner. Please try again." variant="error" />);
    } finally {
        setDownloadingItem(null);
        setForceCaptureImageReady(false);
    }
  };

  const handleSave = async (shouldRedirect = true, customSuccessMessage?: string) => {
    if (!enBannerRef.current || !idBannerRef.current) return;

    let savedSuccessfully = false;
    let finalVersion = 1;

    try {
      setIsSaving(true);
      setSaveStage('preparing');
      setForceCaptureImageReady(false);
      if (shouldRedirect) {
          toast.custom((t) => <TiketSnackbar id={t} message="Preparing banner..." variant="default" />);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.dismiss();
        setIsSaving(false);
        setSaveStage('idle');
        setForceCaptureImageReady(false);
        toast.custom((t) => <TiketSnackbar id={t} message="You must be logged in to save" variant="error" />);
        return;
      }

      // 0. Pre-process Background Image (Key Visual)
      // STRATEGY: Always capture from a data URL, regardless of whether the
      // user just uploaded a new file or we are re-publishing an existing
      // banner that only has `keyVisualUrl`. Remote URLs inside html-to-image's
      // SVG foreignObject often fail to decode in time, which produces
      // blank-background thumbnails. Embedding as data URL eliminates that
      // entire class of bug and also sidesteps CORS / signed-URL quirks.
      // Use strict:false so a CORS / signed-URL fetch failure doesn't abort the
      // whole save — we'll fall back to the original URL and let the capture
      // attempt proceed (the size-check in captureBannerElement guards against blanks).
      let captureBackground: string | null = previewUrl;
      if (formData.keyVisualFile) {
        captureBackground = await fileToDataUrl(formData.keyVisualFile);
      } else if (formData.keyVisualUrl) {
        captureBackground = await ensureDataUrlForCapture(formData.keyVisualUrl, { strict: false });
      }

      if (captureBackground && captureBackground !== previewUrl) {
        setPreviewUrl(captureBackground);
      }

      // Capture must not depend on BannerFixed's internal onLoad opacity state.
      // Once the source is known, force the render path to show the image, then
      // captureBannerElement waits for the actual <img> decode before snapshotting.
      setForceCaptureImageReady(!!captureBackground);
      await waitForRenderStable();

      // 1. Ensure fonts and capture each language with validation + retry.
      await document.fonts.ready;
      const base64FontCSS_save = await getBase64FontCSS();

      const scaleFactor = 1; // Standard quality (1x)
      const effectivePixelRatio = scaleFactor / renderScale;

      const enEl = enBannerRef.current?.children[0] as HTMLElement | undefined;
      const idEl = idBannerRef.current?.children[0] as HTMLElement | undefined;
      if (!enEl || !idEl) {
        throw new Error('[Step 1] Banner element not found in DOM — refs may not be mounted.');
      }

      const enResult = await captureBannerElement(enEl, { pixelRatio: effectivePixelRatio, fontCss: base64FontCSS_save });
      const idResult = await captureBannerElement(idEl, { pixelRatio: effectivePixelRatio, fontCss: base64FontCSS_save });

      const enBlob = enResult.blob;
      const idBlob = idResult.blob;
      const fileSize = formatBytes(enBlob.size);
      
      // STRICT DIMENSION MAPPING - Use Spec Constants
      const getDimensionsByRatio = (category: string, ratio: string | undefined) => {
        // DEBUG: Log the incoming ratio to console to verify
        console.log('Saving Ratio:', ratio); 

        if (category === 'Product Entry Point') {
          // Entry Point banners - use ratio key or label
          if (ratio === 'Mobile (2:1)' || ratio === 'mobile_2:1') return '320x160px';
          if (ratio === 'Mobile (4:1)' || ratio === 'mobile_4:1') return '320x80px';
          if (ratio === 'Mobile (2:1 WhatsApp)' || ratio === 'mobile_2:1_whatsapp') return '320x160px';
          if (ratio === 'Mobile (5:2)' || ratio === 'mobile_5:2') return '320x128px';
          return '320x128px'; // Default Mobile (5:2)
        } else {
          // Promo banners
          switch (ratio) {
            case 'Landscape (16:9)': return '600x338px';
            case 'Square (1:1)': return '600x600px';
            case 'Portrait (3:4)': return '720x960px';
            case 'Landscape (2:1)': return '600x300px';
            default: return '600x300px';
          }
        }
      };
      
      const dimension = getDimensionsByRatio(formData.bannerCategory, formData.bannerRatio);

      // 2. Determine ID and Paths (Deterministic Filename Strategy)
      // If editing existing banner/draft, use that ID.
      // If new, generate a UUID.
      const bannerId = editingId || crypto.randomUUID();

      // Path format: {FolderName}/{bannerId}_en.png
      // NOTE: We stripped user.id from path to follow prompt's "Target Filename" instruction strictly
      const folderName = formData.bannerCategory === 'Product Entry Point' ? 'Entry_Point_Banner' : 'Promo_Banner';
      
      const enPath = `${folderName}/${bannerId}_en.png`;
      const idPath = `${folderName}/${bannerId}_id.png`;

      // Capture is done; now we're in the upload + DB phase.
      setSaveStage('saving');
      if (shouldRedirect) {
          toast.dismiss();
          toast.custom((t) => <TiketSnackbar id={t} message="Saving banner..." variant="default" />);
      }

      // Upload generated banners
      let enUpload: { url: string; path: string };
      let idUpload: { url: string; path: string };
      try {
        [enUpload, idUpload] = await Promise.all([
          BannerService.uploadImage(enBlob, enPath),
          BannerService.uploadImage(idBlob, idPath)
        ]);
      } catch (uploadErr) {
        throw new Error(`[Step 2 - Upload thumbnail] ${uploadErr instanceof Error ? uploadErr.message : String(uploadErr)}`);
      }

      // 2.5 Upload Raw Background Image (Key Visual) if exists
      // We must upload this now since we skipped it in Step 0 (we used Base64 for capture only)
      let keyVisualUrl = formData.keyVisualUrl || '';
      if (formData.keyVisualFile) {
         // Determine upload path based on file origin (AI vs Manual)
         const isAI = formData.keyVisualFile.name.startsWith('ai_generated_');
         const ext = formData.keyVisualFile.name.split('.').pop() || 'png';
         const uniqueFilename = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `bg-${Date.now()}`;
         let bgPath = '';

         if (isAI) {
             bgPath = `Assets/AI_Generated/${uniqueFilename}.${ext}`;
         } else {
             bgPath = `Assets/ImageBG/${uniqueFilename}.${ext}`;
         }
         
         const { url } = await BannerService.uploadImage(formData.keyVisualFile, bgPath);
         keyVisualUrl = url;
      }

      // Update formData with the uploaded keyVisualUrl and remove the File object
      const finalFormData = {
          ...formData,
          keyVisualUrl: keyVisualUrl,
          keyVisualFile: undefined // Ensure File object is not saved
      };

      // 3. Save to DB
      // Get latest user info to ensure attribution is correct
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserName = getUserDisplayName(sessionData?.session?.user, userName || 'Unknown User');
      
      const currentUserAvatar = userAvatar 
          || getUserAvatarUrl(sessionData?.session?.user);

      const bannerData = {
        id: bannerId, // Ensure we pass the ID we generated
        name: formData.bannerName,
        category: formData.bannerCategory,
        status: 'published' as const, // Always published when saving from Success Screen
        form_data: finalFormData,
        created_by: user.id,
        creator_name: currentUserName, // Force consistency as requested
        last_edited_by_id: user.id,
        last_edited_by_name: currentUserName,
        user_avatar: currentUserAvatar, // Add user_avatar for activity log
        image_url_en: enUpload.url,
        image_url_id: idUpload.url,
        product: formData.verticalCategory,
        metadata: {
            dimension,
            fileSize
        }
      };

      // DETECT ORIGIN & SAVE LOGIC
      // 1. If 'published': Overwrite existing live banner -> UPDATE (Increments Version)
      // 2. If 'draft': Promotion -> UPDATE (Increments Version because status changes to published)
      // 3. If 'new' (null/undefined): Fresh creation -> INSERT (Version 1)

      if (editingId) {
           try {
             const result = await BannerService.updateBanner(editingId, bannerData);
             finalVersion = result.version;
           } catch (dbErr) {
             throw new Error(`[Step 3 - updateBanner] ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
           }
      } else {
           try {
             const result = await BannerService.saveBanner(bannerData);
             finalVersion = result.version;
           } catch (dbErr) {
             throw new Error(`[Step 3 - saveBanner] ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
           }
      }

      // Mark as saved before any post-save operations so a navigation error
      // (e.g. onSave() / onBack()) doesn't trigger the "Failed to save banner" toast.
      savedSuccessfully = true;

    } catch (error) {
      console.error('Save error:', error);
      toast.dismiss();
      setIsSaving(false);
      setSaveStage('idle');
      setForceCaptureImageReady(false);
      if (!savedSuccessfully) {
        toast.custom((t) => <TiketSnackbar id={t} message="Failed to save banner" variant="error" />);
      }
      throw error;
    }

    // Post-save: cleanup state and navigate. Intentionally outside the try-catch
    // so that any navigation error never surfaces as "Failed to save banner".
    toast.dismiss();
    setIsSaving(false);
    setSaveStage('idle');
    setForceCaptureImageReady(false);
    if (shouldRedirect) {
        toast.custom((t) => <TiketSnackbar id={t} message={`Banner saved as Version ${finalVersion}.`} variant="default" />);
        onSave();
    }
  };

  const handleLogoutAndSave = async () => {
      try {
          // Show saving toast that persists
          const toastId = toast.custom((t) => (
              <TiketSnackbar 
                  id={t} 
                  message="Saving banner and logging out..." 
                  icon={<Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              />
          ), { duration: Infinity });

          // Save without redirecting (we handle navigation/logout)
          await handleSave(false);

          toast.dismiss(toastId);
          if (onLogout) onLogout();
      } catch (error) {
          // Error already shown in handleSave
      }
  };

  const handleGenerativeResize = async () => {
    if (isResizing || isSaving || downloadingItem) return;

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

            // 1. Save Banner First (Background)
            try {
                await handleSave(false); 
            } catch (saveError) {
                 console.error("Auto-save failed before resize", saveError);
                 toast.dismiss(toastId);
                 toast.custom((t) => <TiketSnackbar id={t} message="Failed to save banner before resizing." variant="error" />);
                 setIsResizing(false);
                 setBlocking(false); // Unblock on error
                 return;
            }
            
            await document.fonts.ready;
            const base64FontCSS_resize = await getBase64FontCSS();
            setForceCaptureImageReady(true);
            await waitForRenderStable();

            // Use the EN banner content
            // Structure: div (root) -> children[0] (Banner Content) when hideHeader=true
            const bannerElement = enBannerRef.current.children[0] as HTMLElement;
            if (!bannerElement) throw new Error("Banner element not found");

            const { blob } = await captureBannerElement(bannerElement, {
                pixelRatio: 3 / renderScale, // FORCE 3x (adjusted for renderScale)
                fontCss: base64FontCSS_resize,
            });

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
            window.location.href = `/tools/generative-resize?handoffKey=${handoffKey}&source=creation`;

        } catch (e) {
            console.error("Failed to generate 3x", e);
            setIsResizing(false);
            setForceCaptureImageReady(false);
            setBlocking(false); // Unblock on error
            toast.dismiss();
            toast.custom((t) => <TiketSnackbar id={t} message="Failed to generate high-res asset." variant="error" />);
        }
    }
  };

  const scale = formData.keyVisualScale || 100;
  const position = formData.keyVisualPosition || { x: 50, y: 50 };

  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center pt-[124px] pb-[40px] px-[24px] relative">
      <Header 
        fullWidth 
        showLogo 
        hideControls={true}
        userName={userName} 
        onLogout={handleLogoutAndSave}
      />

        {/* Frame 3 container */}
        <div className="flex flex-col gap-[24px] items-start w-full max-w-[1300px]"> {/* Increased max-w to fit side-by-side 600px banners */}
            
            {/* Breadcrumbs */}
            <div className="flex gap-[8px] items-center text-[12px]">
                <span className="font-semibold text-[#71747d]">Banners</span>
                <span className="text-[#71747d] text-[14px]">{'>'}</span>
                <span className="font-bold text-[#71747d]">Create New Banner</span>
            </div>

            {/* Frame 5 (White Card) */}
            <div className="bg-white rounded-[8px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full flex flex-col items-center p-[32px] gap-[24px]">
                
                {/* Frame 2 (Banners) */}
                {/* Use flex-wrap to stack if screen is too small, but center them */}
                <div className="flex flex-wrap gap-[24px] items-start justify-center w-full">
                    
                    {/* EN Banner Wrapper */}
                    <div className="relative rounded-[12px] overflow-hidden shadow-sm border border-gray-100">
                        <BannerFixed 
                            ref={enBannerRef}
                            formData={formData} 
                            lang="en" 
                            label="EN Translation" 
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

                    {/* ID Banner Wrapper */}
                    <div className="relative rounded-[12px] overflow-hidden shadow-sm border border-gray-100">
                        <BannerFixed 
                            ref={idBannerRef}
                            formData={formData} 
                            lang="id" 
                            label="ID Translation" 
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

                </div>

            {/* Frame 4 (Text) */}
                <div className="flex flex-col gap-[8px] items-center text-center">
                    <h2 className="text-[24px] font-bold text-[#303135] leading-[30px]">Creation done ✨</h2>
                    <p className="text-[18px] font-normal text-[#303135] leading-[24px]">
                        {isWhitelisted ? 'Download or resize it with Generative Resize tool.' : 'Download your banner below.'}
                    </p>
                </div>

            </div>

            {/* Main CTA Buttons */}
            <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-[16px] justify-end w-full">
                <Popover>
                    <PopoverTrigger asChild>
                        <button 
                            disabled={isSaving || isResizing || !!downloadingItem}
                            className="h-[52px] px-[24px] rounded-[8px] bg-[#E7F2FF] text-[#007BFF] text-[18px] font-bold hover:bg-[#D1E6FF] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Download
                            <ChevronDown className="w-5 h-5" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-4 bg-white" align="end" sideOffset={8}>
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

                {isWhitelisted && (
                    <button 
                        onClick={handleGenerativeResize}
                        disabled={isResizing || isSaving || !!downloadingItem}
                        className="h-[52px] px-[24px] rounded-[8px] bg-[#E7F2FF] text-[#007BFF] text-[18px] font-bold hover:bg-[#D1E6FF] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <div className="w-5 h-5" style={{ '--fill-0': '#007BFF' } as React.CSSProperties}><TdsIcSparklingGeneral /></div>}
                        Resize
                    </button>
                )}

                <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving || isResizing || !!downloadingItem}
                    className="h-[52px] w-[200px] rounded-[8px] bg-[#007bff] text-white text-[18px] font-bold hover:bg-[#0069d9] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSaving && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {saveStage === 'preparing'
                        ? 'Preparing...'
                        : saveStage === 'saving'
                        ? 'Saving...'
                        : 'Save'}
                </button>
            </div>
            </div>

        </div>
    </div>
  );
}