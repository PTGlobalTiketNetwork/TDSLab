import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Trash2, ZoomIn, Info, Loader2, ChevronRight, ChevronDown, Copy, Sparkles, ChevronUp, Layout, Grid3X3, ArrowRightLeft, MoveHorizontal, MoveVertical, AlertTriangle, XCircle, Languages, ArrowRight, Pencil } from 'lucide-react';
import { InstantLottie } from '../ui/InstantLottie';
import { Skeleton } from '../ui/skeleton';
import { TiketButton } from '../ui/TiketButton';
import { TiketSelect } from '../ui/TiketSelect';
import { TiketTextarea } from '../ui/TiketInput';
import { TiketTabs } from '../ui/TiketTabs';
import { TiketPagination } from '../ui/TiketPagination';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Lightbox } from '../Lightbox';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { AVAILABLE_RATIOS, AVAILABLE_RESOLUTIONS, generateResizePrompt } from '../../../config/generative-resize-presets';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { supabase, getAuthToken } from '../../../utils/supabase/client';
import TdsSiGeneralError from '../../../imports/TdsSiGeneralError404-2031-7672';
import TdsIcSparklingGeneral from '../../../imports/TdsIcSparklingGeneral';
import { toast } from 'sonner';
import { handoffStore } from '../../../utils/indexedDB';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { UserAvatar } from '../UserAvatar';
import { copyToClipboard } from '../../../utils/clipboard';
import { getUserDisplayName, getUserAvatarUrl, formatStoredName } from '../../utils/userDisplay';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;


interface HistoryItem {
  id: string;
  image_url: string;
  original_image_url: string;
  prompt: string;
  ratio: string;
  resolution: string;
  created_by: string;
  created_at: string;
  user_name?: string; // For display
  user_avatar?: string;
  task_type?: 'resize' | 'translate';
}

import { Session } from '@supabase/supabase-js';

interface GenerativeResizeProps {
  session: Session | null;
}

export function GenerativeResize({ session }: GenerativeResizeProps) {
  const user = session?.user || null;
  
  // Controls
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tempInputPath, setTempInputPath] = useState<string | null>(null);
  const [tempInputUrl, setTempInputUrl] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [ratio, setRatio] = useState<string>('1:1');
  const [resolution, setResolution] = useState<string>('2K');
  const [prompt, setPrompt] = useState<string>(generateResizePrompt('1:1'));
  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Composition Controls State
  const [isCompositionOpen, setIsCompositionOpen] = useState(false);
  const [composition, setComposition] = useState<string>('center');
  const [pinLogos, setPinLogos] = useState<boolean>(true);
  const [adaptBackground, setAdaptBackground] = useState<boolean>(false);
  const [showRatioWarning, setShowRatioWarning] = useState(false);
  const [ratioWarningType, setRatioWarningType] = useState<'same' | 'different'>('same');

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');

  // Dashboard Integration State
  const [isFromDashboard, setIsFromDashboard] = useState(false);
  const [isLoadingSource, setIsLoadingSource] = useState(false);
  
  // UI States
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [historyLightboxOpen, setHistoryLightboxOpen] = useState(false);
  const [historyLightboxIndex, setHistoryLightboxIndex] = useState(0);
  const [currentImageMeta, setCurrentImageMeta] = useState<{ width: number; height: number; size: string | null } | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false); // New state for redirect feedback
  const [isRedirectingToEdit, setIsRedirectingToEdit] = useState(false);
  
  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelledRef = useRef(false);

  // History
  const [historyTab, setHistoryTab] = useState('my_history');
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyFilterRatio, setHistoryFilterRatio] = useState('all');
  const [historyFilterResolution, setHistoryFilterResolution] = useState('all');
  const [historySort, setHistorySort] = useState('newest');
  const [availableHistoryRatios, setAvailableHistoryRatios] = useState<string[]>([]);
  const [availableHistoryResolutions, setAvailableHistoryResolutions] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 12;
  const galleryRef = useRef<HTMLDivElement>(null);

  // Ref for cleanup
  const tempPathRef = useRef<string | null>(null);

  // Load User - Using session prop now
  /*
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);
  */

  // Dashboard Handoff Integration (Hybrid)
  useEffect(() => {
    const handleDashboardHandoff = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const urlParam = searchParams.get('imageUrl');
        const sourceParam = searchParams.get('source');
        const handoffKey = searchParams.get('handoffKey');
        
        if (handoffKey) {
             setIsFromDashboard(true);
             setIsLoadingSource(true);
             try {
                 const blob = await handoffStore.get(handoffKey);
                 if (blob) {
                     const file = new File([blob], "dashboard_asset_3x.png", { type: "image/png" });
                     const objectUrl = URL.createObjectURL(file);
                     
                     // Treat as a local file upload so it gets uploaded to server upon generation
                     setSourceFile(file);
                     setPreviewUrl(objectUrl);
                     setIsUploaded(false);
                     setTempInputUrl(null); 
                     
                     // Cleanup IDB
                     await handoffStore.delete(handoffKey);
                 } else {
                     throw new Error("Asset not found in storage");
                 }
             } catch (e) {
                 console.error("Handoff failed", e);
                 setError("Failed to retrieve high-resolution asset.");
             } finally {
                 setIsLoadingSource(false);
             }
             return;
        }

        if (urlParam) {
            if (sourceParam === 'dashboard') {
                setIsFromDashboard(true);
                setIsLoadingSource(true);
                
                // Verify the high-res image exists
                let finalUrl = urlParam;
                try {
                    const res = await fetch(urlParam, { method: 'HEAD' });
                    if (!res.ok) {
                         // Fallback logic: Try to remove @3x if present
                         // This handles cases where 3x doesn't exist OR if signed URL became invalid due to path change
                         if (urlParam.includes('@3x')) {
                             const fallbackUrl = urlParam.replace('@3x', '');
                             try {
                                 // Verify fallback
                                 const resFallback = await fetch(fallbackUrl, { method: 'HEAD' });
                                 if (resFallback.ok) {
                                     finalUrl = fallbackUrl;
                                     toast.custom((t) => (
                                        <TiketSnackbar 
                                            id={t}
                                            message="High-resolution (3x) version not found. Using standard resolution." 
                                            variant="default"
                                        />
                                     ));
                                 } else {
                                     // Both failed
                                     throw new Error("Both 3x and standard resolution check failed");
                                 }
                             } catch (fallbackError) {
                                 // If fallback fetch fails (e.g. CORS), we might still try to use it if it's the original URL
                                 // But since we can't verify, we'll assume it's risky.
                                 // However, often HEAD fails but GET works or img tag works.
                                 // Let's assume the fallback URL (original) is correct and just warn.
                                 console.warn("Fallback verification failed, attempting to use fallback URL anyway", fallbackError);
                                 finalUrl = fallbackUrl;
                                 toast.custom((t) => (
                                    <TiketSnackbar 
                                        id={t}
                                        message="Using standard resolution (verification skipped)." 
                                        variant="default"
                                    />
                                 ));
                             }
                         } else {
                             setError("Could not load high-resolution (3x) image from dashboard. Please upload manually.");
                             setIsLoadingSource(false);
                             return;
                         }
                    }
                } catch (e) {
                    // Network error or CORS on primary URL
                     if (urlParam.includes('@3x')) {
                         console.warn("Primary 3x verification failed, trying fallback...", e);
                         const fallbackUrl = urlParam.replace('@3x', '');
                         finalUrl = fallbackUrl;
                         toast.custom((t) => (
                            <TiketSnackbar 
                                id={t}
                                message="High-resolution check failed. Using standard resolution." 
                                variant="default"
                            />
                         ));
                     } else {
                         console.warn("Could not verify image headers, attempting load...", e);
                     }
                }
                
                setIsLoadingSource(false);
                setPreviewUrl(finalUrl);
                setTempInputUrl(finalUrl);
            } else {
                setPreviewUrl(urlParam);
                setTempInputUrl(urlParam);
            }
            
            setIsUploaded(true);
        }
    };
    
    handleDashboardHandoff();
  }, []);

  // Update Ref
  useEffect(() => {
    tempPathRef.current = tempInputPath;
  }, [tempInputPath]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tempPathRef.current) {
        deleteFile(tempPathRef.current);
      }
    };
  }, []);

  // Loading Text Cycle
  useEffect(() => {
      if (isGenerating) {
          const interval = setInterval(() => {
              setLoadingTextIndex(prev => (prev + 1) % 4);
          }, 2000);
          return () => clearInterval(interval);
      } else {
          setLoadingTextIndex(0);
      }
  }, [isGenerating]);

  const deleteFile = async (path: string) => {
    try {
      await fetch(`${SERVER_URL}/delete-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paths: [path] })
      });
    } catch (e) {
      console.error("Failed to cleanup file", e);
    }
  };

  const processFile = async (file: File) => {
      // Local Preview Strategy: 
      // 1. Do NOT upload yet.
      // 2. Set file to state for deferred upload.
      // 3. Show local preview immediately.

      // Cleanup previous state if needed
      setTempInputUrl(null);
      setTempInputPath(null);
      setIsUploaded(false);

      setSourceFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setGeneratedImage(null); // Reset result
      setError(null);
  };

  const clearSourceImage = async () => {
       setSourceFile(null);
       setPreviewUrl(null);
       setTempInputUrl(null);
       setTempInputPath(null);
       setIsUploaded(false);
       setGeneratedImage(null);
       
       // Optional: We could trigger a delete for the temp path if it was uploaded, 
       // but since we want "local first", we might not even have uploaded it yet.
       // If isUploaded was true, we could clean up.
       if (tempInputPath) {
           await deleteFile(tempInputPath);
       }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       processFile(e.dataTransfer.files[0]);
    }
  };

  const uploadTempFile = async (file: File) => {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = `Assets/Tools/GenerativeResize/TempInput/${filename}`;
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', path);

    try {
      const res = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: formData
      });
      
      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      
      // Update state to reflect upload success
      setTempInputPath(path);
      setTempInputUrl(data.url);
      setIsUploaded(true);
      
      return data.url;
    } catch (e) {
      setError("Failed to upload source image");
      return null;
    }
  };

  // Helper: Get numeric ratio
  const getRatioValue = (r: string): number => {
    if (r === 'match_input_image') return -1; // Special value
    const [w, h] = r.split(':').map(Number);
    return w / h;
  };

  // Helper: Get orientation category
  const getOrientation = (r: string): 'square' | 'landscape' | 'portrait' | 'match' => {
    if (r === 'match_input_image') return 'match';
    const val = getRatioValue(r);
    if (Math.abs(val - 1) < 0.01) return 'square';
    return val > 1 ? 'landscape' : 'portrait';
  };

  // Effect: Update Prompt when controls change
  useEffect(() => {
    // Resize Prompt Logic
    let newPrompt = generateResizePrompt(ratio);
    
    // Composition
    switch (composition) {
        case 'split-left': // Text Left / Image Right (User sees "Text Left") -> Image on Right
            newPrompt += " Position the main subject to the right, leaving negative space on the left for text.";
            break;
        case 'split-right': // Image Left / Text Right (User sees "Text Right") -> Image on Left
            newPrompt += " Position the main subject to the left, leaving negative space on the right for text.";
            break;
        case 'split-top': // Text Top / Image Bottom
            newPrompt += " Position the main subject at the bottom, leaving negative space at the top for text.";
            break;
        case 'split-bottom': // Image Top / Text Bottom
            newPrompt += " Position the main subject at the top, leaving negative space at the bottom for text.";
            break;
        case 'center':
        default:
            newPrompt += " Keep the main subject centered.";
            break;
    }

    // Toggles
    if (pinLogos) {
        newPrompt += " Keep logos and badges anchored to the corners.";
    }
    if (adaptBackground) {
        newPrompt += " Adjust background gradient direction to match new orientation.";
    }

    setPrompt(newPrompt);
  }, [ratio, composition, pinLogos, adaptBackground]);

  // Effect: Reset incompatible composition options when ratio changes
  useEffect(() => {
     const orient = getOrientation(ratio);
     // If switching to Square, force Center
     if (orient === 'square' && composition !== 'center') {
         setComposition('center');
     } 
     // If switching to Landscape, ensure we're not using Portrait options
     else if (orient === 'landscape' && (composition === 'split-top' || composition === 'split-bottom')) {
         setComposition('center');
     } 
     // If switching to Portrait, ensure we're not using Landscape options
     else if (orient === 'portrait' && (composition === 'split-left' || composition === 'split-right')) {
         setComposition('center');
     }
  }, [ratio]);

  const executeGeneration = async () => {
    if (!sourceFile && !tempInputUrl) return; // Must have either a local file or a remote URL
    if (!user) return;
    
    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);
    isCancelledRef.current = false;

    try {
        let fileUrl = tempInputUrl;

        // Deferred Upload Logic
        if (sourceFile && !isUploaded) {
           fileUrl = await uploadTempFile(sourceFile);
        }
        
        if (!fileUrl) {
            throw new Error("Failed to upload image to server");
        }

        // Start async generation
        const startRes = await fetch(`${SERVER_URL}/start-generate-image`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                aspect_ratio: ratio,
                resolution: resolution,
                image_input: [fileUrl],
                modelId: 'nano-banana-pro'
            })
        });

        let startData;
        try {
            const text = await startRes.text();
            startData = text ? JSON.parse(text) : {};
        } catch (jsonError) {
            throw new Error(`Server response was not valid JSON. Status: ${startRes.status}`);
        }

        if (!startRes.ok) {
            throw new Error(startData.error || `Failed to start generation with status: ${startRes.status}`);
        }

        const predictionId = startData.predictionId;
        if (!predictionId) {
             throw new Error("Server returned success but no prediction ID");
        }

        // Store prediction ID for cancellation
        setCurrentPredictionId(predictionId);

        // Poll for completion with extended timeout (5 minutes)
        const startTime = Date.now();
        const maxWaitTime = 5 * 60 * 1000; // 5 minutes
        let status = startData.status;
        let output = null;
        let errorMsg = null;

        while (status !== "succeeded" && status !== "failed" && status !== "canceled") {
            // Check if generation was cancelled
            if (isCancelledRef.current) {
                console.log('Generation was cancelled, stopping poll');
                return;
            }

            if (Date.now() - startTime > maxWaitTime) {
                throw new Error("Generation is taking longer than expected. Please check your history later.");
            }

            // Wait 3 seconds between polls
            await new Promise(resolve => setTimeout(resolve, 3000));

            const pollRes = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`,
                }
            });

            if (!pollRes.ok) {
                // Auth failures are permanent; retrying them would spin until timeout.
                if (pollRes.status === 401 || pollRes.status === 403) throw new Error('You do not have access to AI generation.');
                console.error("Polling failed, retrying...");
                continue; // Retry on poll failure
            }

            const pollData = await pollRes.json();
            status = pollData.status;
            output = pollData.output;
            errorMsg = pollData.error;
        }

        if (status === "succeeded") {
            let generatedUrl = "";
            if (Array.isArray(output) && output.length > 0) {
                generatedUrl = output[0];
            } else if (typeof output === "string") {
                generatedUrl = output;
            }

            if (!generatedUrl) {
                throw new Error("Server returned success but no image URL");
            }

            setGeneratedImage(generatedUrl);

            // Save Result to Supabase (Proxy via server upload)
            await saveResultToStorage(generatedUrl);
        } else if (status === 'canceled' && isCancelledRef.current) {
             // Silent exit for intentional cancellation
             return;
        } else {
            throw new Error(errorMsg || `Generation failed with status: ${status}`);
        }

    } catch (e: any) {
        const msg = e.message || "An error occurred during generation.";
        setError(msg);
        setErrorModalMessage(msg);
        setIsErrorModalOpen(true);
    } finally {
        setIsGenerating(false);
        setCurrentPredictionId(null);
    }
  };

  const handleCancelGeneration = async () => {
    if (!currentPredictionId) return;
    
    isCancelledRef.current = true;
    setIsCancelling(true);
    try {
      const res = await fetch(`${SERVER_URL}/cancel-prediction/${currentPredictionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`
        }
      });

      if (!res.ok) throw new Error("Failed to cancel");
      
      setIsGenerating(false);
      setCurrentPredictionId(null);
      // Silent cancellation
    } catch (e: any) {
      console.error("Failed to cancel generation", e);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleGenerateClick = async () => {
      // Skip guard for special match mode
      if (ratio === 'match_input_image') {
          executeGeneration();
          return;
      }

      // Ratio Guard Logic
      if (previewUrl) {
          const img = new Image();
          img.src = previewUrl;
          await new Promise<void>((resolve) => {
              img.onload = () => {
                  const sourceRatio = img.naturalWidth / img.naturalHeight;
                  const targetRatioVal = getRatioValue(ratio);
                  
                  // Tolerance 0.05
                  const isSameRatio = Math.abs(sourceRatio - targetRatioVal) < 0.05;

                  // Resize Mode: warn if same ratio
                  if (isSameRatio) {
                      setRatioWarningType('same');
                      setShowRatioWarning(true);
                  } else {
                      executeGeneration();
                  }
                  resolve();
              };
              img.onerror = () => {
                  executeGeneration(); // Proceed on error
                  resolve();
              };
          });
      } else {
          executeGeneration();
      }
  };

  const saveResultToStorage = async (url: string) => {
    try {
        // 1. Fetch the image from Replicate
        const imgRes = await fetch(url);
        const blob = await imgRes.blob();
        const file = new File([blob], `generated_${Date.now()}.jpg`, { type: 'image/jpeg' });

        // 2. Upload to Final Output
        const filename = `generated_${Date.now()}_${user.id}.jpg`;
        const path = `Assets/Tools/GenerativeResize/Output/${filename}`;
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);

        const uploadRes = await fetch(`${SERVER_URL}/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
            body: formData
        });

        if (!uploadRes.ok) throw new Error("Failed to save output");
        const uploadData = await uploadRes.json();
        const finalUrl = uploadData.url;

        // 3. Save to History
        const historyItem: Partial<HistoryItem> = {
            image_url: finalUrl,
            original_image_url: tempInputPath || '', 
            prompt,
            ratio,
            resolution,
            created_by: user.id,
            user_name: getUserDisplayName(user),
            user_avatar: getUserAvatarUrl(user),
            task_type: 'resize'
        };

        await fetch(`${SERVER_URL}/generative-resize/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        });

        fetchHistory(); // Refresh history

    } catch (e) {
        console.error("Failed to save result", e);
    }
  };

  // History Fetching - Filter by task_type='resize'
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
        const queryParams = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString(),
            sort: historySort,
            taskType: 'resize' // Only show resize history
        });

        if (historyTab === 'my_history' && user) {
            queryParams.append('userId', user.id);
        }
        if (historyFilterRatio !== 'all') {
            queryParams.append('ratio', historyFilterRatio);
        }
        if (historyFilterResolution !== 'all') {
            queryParams.append('resolution', historyFilterResolution);
        }

        const res = await fetch(`${SERVER_URL}/generative-resize/history?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
        });

        if (!res.ok) throw new Error("Failed to fetch history");

        const result = await res.json();
        
        // Handle both old format (array) and new format (object with data/total)
        if (Array.isArray(result)) {
             // Client-side safety filter: resize OR legacy (no task_type), AND exclude 'match_input_image'
             const filtered = result.filter(i => (!i.task_type || i.task_type === 'resize') && i.ratio !== 'match_input_image');
             setHistoryItems(filtered);
             setTotalItems(filtered.length);
        } else {
             // Client-side safety filter: resize OR legacy (no task_type), AND exclude 'match_input_image'
             const filtered = (result.data || []).filter((i: HistoryItem) => (!i.task_type || i.task_type === 'resize') && i.ratio !== 'match_input_image');
             setHistoryItems(filtered);
             setTotalItems(result.total || filtered.length);
             if (result.facets) {
                 setAvailableHistoryRatios(result.facets.ratios || []);
                 setAvailableHistoryResolutions(result.facets.resolutions || []);
             }
        }

    } catch (e) {
        console.error("Failed to fetch history", e);
    } finally {
        setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentPage, historyTab, historyFilterRatio, historyFilterResolution, historySort, user]);

  // Filter History - Logic now handled by server
  const filteredHistory = historyItems;

  const timeAgo = (dateString: string) => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return "Just now";
    } catch (e) {
        return dateString;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
        // Optimistic delete
        setHistoryItems(prev => prev.filter(i => i.id !== itemToDelete.id));
        setTotalItems(prev => prev - 1);
        
        // Close both dialogs
        setDeleteConfirmOpen(false);
        setHistoryLightboxOpen(false);
        
        await fetch(`${SERVER_URL}/generative-resize/history/${itemToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
        });
        
        toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message="Asset deleted successfully" 
                variant="default"
            />
        ));
    } catch (e) {
        console.error("Delete failed", e);
        toast.custom((t) => (
            <TiketSnackbar 
                id={t}
                message="Failed to delete asset" 
                variant="error"
            />
        ));
        fetchHistory(); // Revert optimistic update on failure
    } finally {
        setIsDeleting(false);
        setItemToDelete(null);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(url, '_blank');
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (historyLightboxOpen && filteredHistory[historyLightboxIndex]) {
        const url = filteredHistory[historyLightboxIndex].image_url;
        setCurrentImageMeta(null);
        
        // Get Dimensions
        const img = new Image();
        img.src = url;
        img.onload = () => {
            setCurrentImageMeta(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight, size: prev?.size || null }));
        };

        // Get File Size
        fetch(url, { method: 'HEAD' })
            .then(res => {
                const size = res.headers.get('content-length');
                if (size) {
                    setCurrentImageMeta(prev => ({ 
                        width: prev?.width || 0, 
                        height: prev?.height || 0, 
                        size: formatBytes(parseInt(size)) 
                    }));
                }
            })
            .catch(e => console.error("Failed to get file size", e));
    }
  }, [historyLightboxIndex, historyLightboxOpen, filteredHistory]);

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto pb-[80px] pt-[0px] px-0">
      
      {/* Main Tool */}
      <div className="flex flex-col lg:flex-row gap-6 mx-[0px] my-[24px]">
        
        {/* Left Panel: Controls */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 bg-white p-6 rounded-xl border border-[#e9ebef] shadow-sm h-fit">
            
            {/* File Upload */}
            <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <label className="text-[14px] font-bold text-[#303135]">Source Image</label>
                    {isFromDashboard && (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> from Dashboard
                        </span>
                    )}
                </div>
                <div 
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
                        isDragging ? 'border-[#007BFF] bg-[#eff6ff]' : 'border-[#d8dce8] hover:bg-gray-50'
                    } ${isGenerating ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                    onClick={() => !isGenerating && document.getElementById('source-upload')?.click()}
                    onDragOver={!isGenerating ? handleDragOver : undefined}
                    onDrop={!isGenerating ? handleDrop : undefined}
                >
                    <input 
                        type="file" 
                        id="source-upload" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isGenerating}
                    />
                    {previewUrl ? (
                         <div className="w-full relative flex items-center justify-center group">
                            <img src={previewUrl} alt="Source" className={`max-w-full max-h-[200px] w-auto h-auto object-contain rounded-md ${isLoadingSource ? 'opacity-50 blur-sm' : ''}`} />
                            
                            {isLoadingSource && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 text-[#007BFF] animate-spin" />
                                </div>
                            )}
                            
                            {/* Remove Button */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearSourceImage();
                                    // Also clear URL params to prevent reloading
                                    window.history.replaceState({}, '', window.location.pathname);
                                    setIsFromDashboard(false);
                                }}
                                className={`absolute top-[-10px] right-[-10px] bg-white text-gray-500 p-1.5 rounded-full shadow-md border border-gray-200 hover:text-red-500 hover:border-red-200 transition-colors z-10 ${isGenerating ? 'hidden' : ''}`}
                                title="Remove Image"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                    ) : (
                        <>
                            <div className="bg-[#E5F2FF] p-3 rounded-full mb-2">
                                <Upload className="w-6 h-6 text-[#007BFF]" />
                            </div>
                            <span className="text-[14px] text-[#007BFF] font-medium">Click to upload image</span>
                            <span className="text-[12px] text-[#71747d]">or drag and drop</span>
                            <span className="text-[12px] text-[#71747d] mt-1">JPG or PNG up to 10MB</span>
                        </>
                    )}
                </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-bold text-[#303135]">Ratio</label>
                    <TiketSelect 
                        options={AVAILABLE_RATIOS.map(r => ({ id: r.value, label: r.label }))}
                        value={ratio}
                        onChange={(val) => {
                            setRatio(val);
                            setPrompt(generateResizePrompt(val));
                        }}
                        showSearch={false}
                        disabled={isGenerating}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-bold text-[#303135]">Resolution</label>
                    <TiketSelect 
                        options={AVAILABLE_RESOLUTIONS.map(r => ({ id: r.value, label: r.label.replace(' - Default', '') }))}
                        value={resolution}
                        onChange={setResolution}
                        showSearch={false}
                        disabled={isGenerating}
                    />
                </div>
            </div>

            {/* Composition Controls */}
            <Collapsible
                open={isCompositionOpen}
                onOpenChange={setIsCompositionOpen}
                className="w-full border border-[#e9ebef] rounded-lg bg-gray-50/50"
                disabled={isGenerating}
            >
                <CollapsibleTrigger disabled={isGenerating} className={`flex items-center justify-between w-full p-4 font-bold text-[14px] text-[#303135] hover:bg-gray-100/50 transition-colors rounded-lg ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className="flex items-center gap-2">
                        <Layout className="w-4 h-4 text-[#007BFF]" />
                        Composition Controls
                    </span>
                    {isCompositionOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#71747d]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[#71747d]" />
                    )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                        <div className="h-[1px] w-full bg-[#e9ebef] mb-2" />
                        
                        {/* Composition Mode */}
                        <div className="flex flex-col gap-3">
                            <label className="text-[12px] font-semibold text-[#71747d] uppercase tracking-wider">
                                Focus & Layout
                            </label>
                            <RadioGroup value={composition} onValueChange={setComposition} className="grid grid-cols-1 gap-2" disabled={isGenerating}>
                                {/* Center - Always Available */}
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="center" id="comp-center" />
                                    <Label htmlFor="comp-center" className="text-[14px] flex items-center gap-2 cursor-pointer">
                                        <Grid3X3 className="w-4 h-4 text-[#71747d]" />
                                        Center Focus (Default)
                                    </Label>
                                </div>

                                {/* Landscape Options */}
                                {getOrientation(ratio) === 'landscape' && (
                                    <>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="split-left" id="comp-split-left" />
                                        <Label htmlFor="comp-split-left" className="text-[14px] flex items-center gap-2 cursor-pointer">
                                            <ArrowRightLeft className="w-4 h-4 text-[#71747d]" />
                                            Split: Text Left / Image Right
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="split-right" id="comp-split-right" />
                                        <Label htmlFor="comp-split-right" className="text-[14px] flex items-center gap-2 cursor-pointer">
                                            <ArrowRightLeft className="w-4 h-4 text-[#71747d]" />
                                            Split: Image Left / Text Right
                                        </Label>
                                    </div>
                                    </>
                                )}

                                {/* Portrait Options */}
                                {getOrientation(ratio) === 'portrait' && (
                                    <>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="split-top" id="comp-split-top" />
                                        <Label htmlFor="comp-split-top" className="text-[14px] flex items-center gap-2 cursor-pointer">
                                            <MoveVertical className="w-4 h-4 text-[#71747d]" />
                                            Split: Text Top / Image Bottom
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="split-bottom" id="comp-split-bottom" />
                                        <Label htmlFor="comp-split-bottom" className="text-[14px] flex items-center gap-2 cursor-pointer">
                                            <MoveVertical className="w-4 h-4 text-[#71747d]" />
                                            Split: Image Top / Text Bottom
                                        </Label>
                                    </div>
                                    </>
                                )}
                            </RadioGroup>
                        </div>

                        {/* Toggles */}
                        <div className="flex flex-col gap-3 mt-2">
                            <label className="text-[12px] font-semibold text-[#71747d] uppercase tracking-wider">
                                Adjustments
                            </label>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="pin-logos" 
                                    checked={pinLogos} 
                                    onCheckedChange={(c) => setPinLogos(c === true)} 
                                    disabled={isGenerating}
                                />
                                <Label htmlFor="pin-logos" className="text-[14px] cursor-pointer">
                                    Pin Logos to Corners
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="adapt-bg" 
                                    checked={adaptBackground} 
                                    onCheckedChange={(c) => setAdaptBackground(c === true)} 
                                    disabled={isGenerating}
                                />
                                <Label htmlFor="adapt-bg" className="text-[14px] cursor-pointer">
                                    Adapt Background Flow
                                </Label>
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>

            {/* Prompt */}
            <div className="flex flex-col gap-2">
                 <button 
                    type="button"
                    onClick={() => setIsPromptVisible(!isPromptVisible)}
                    className="flex items-center gap-1.5 text-[#007BFF] hover:text-[#0056b3] transition-colors w-fit text-sm font-medium"
                    disabled={isGenerating}
                 >
                    {isPromptVisible ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    Advanced: Edit AI Prompt
                 </button>
                 
                 {isPromptVisible && (
                     <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                         <TiketTextarea 
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-[120px] text-[14px]"
                            disabled={isGenerating}
                         />
                     </div>
                 )}
            </div>

            {/* Action */}
            <TiketButton 
                variant={isGenerating ? "alert" : "primary"} 
                size="large" 
                className="w-full"
                onClick={isGenerating ? handleCancelGeneration : handleGenerateClick}
                disabled={(!isGenerating && (!sourceFile && !tempInputUrl)) || isCancelling}
            >
                {isGenerating ? (
                    <div className="flex items-center gap-2">
                        {isCancelling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            "Cancel Generation"
                        )}
                    </div>
                ) : "Generate"}
            </TiketButton>

            {/* Deprecated inline error - kept for minor warnings if needed, but error modal is primary for generation failures */}
            {error && !isErrorModalOpen && (
                <div className="p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">
                    {error}
                </div>
            )}
        </div>

        {/* Right Panel: Comparison */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-[#e9ebef] shadow-sm flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#303135]">Result</h3>
                {generatedImage && !isGenerating && (
                    <a 
                        href={generatedImage} 
                        download={`generated_resize.jpg`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[#007BFF] text-[14px] font-bold hover:underline"
                    >
                        <Download className="w-4 h-4" />
                        Download Result
                    </a>
                )}
             </div>

             <div className="flex-1 bg-[rgb(255,255,255)] rounded-lg border border-[#EFF1F6] flex items-center justify-center min-h-[400px] relative overflow-hidden">
                {isGenerating ? (
                     <div className="flex flex-col items-center justify-center gap-2">
                         <InstantLottie className="w-[240px] h-[240px]" />
                         <p className="text-[14px] text-[#71747d] -mt-6 font-medium animate-pulse min-w-[200px] text-center">
                            {["Analyzing image structure...", "Extending canvas boundaries...", "Enhancing details...", "Polishing pixels..."][loadingTextIndex]}
                         </p>
                     </div>
                ) : generatedImage ? (
                    <div className="w-full h-full flex gap-1 p-4">
                        {/* Comparison View */}
                         <div 
                            className="flex-1 h-full relative group cursor-pointer"
                            onClick={() => {
                                setLightboxIndex(0);
                                setIsLightboxOpen(true);
                            }}
                         >
                            <span className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm z-10">Original</span>
                            <img src={previewUrl!} className="w-full h-full object-contain" alt="Original" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="text-white w-8 h-8 drop-shadow-md" />
                            </div>
                         </div>
                         <div className="w-[1px] bg-[#d8dce8]"></div>
                         <div 
                            className="flex-1 h-full relative group cursor-pointer"
                            onClick={() => {
                                setLightboxIndex(1);
                                setIsLightboxOpen(true);
                            }}
                         >
                            <span className="absolute top-2 left-2 bg-[#007BFF] text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm z-10">Generated</span>
                            {/* Blinking Orange Outline */}
                            <div className="absolute inset-0 border-2 border-[#FF7F00] rounded-lg animate-pulse pointer-events-none z-20" />
                            <img src={generatedImage} className="w-full h-full object-contain" alt="Generated" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <ZoomIn className="text-white w-8 h-8 drop-shadow-md" />
                            </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/50 rounded-lg">
                        <div className="w-[140px] h-[140px] mb-4" style={{ '--fill-0': '#D8DCE8' } as React.CSSProperties}>
                            <TdsIcSparklingGeneral />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No Result Yet</h3>
                        <p className="text-sm text-gray-500 mt-1">Upload an image to start the magic.</p>
                    </div>
                )}
             </div>
        </div>

      </div>

      {/* Result Lightbox */}
      {generatedImage && (
          <Lightbox
              isOpen={isLightboxOpen}
              onOpenChange={setIsLightboxOpen}
              hasNavigation={true}
              currentIndex={lightboxIndex}
              totalSlides={2}
              onNavigate={(dir) => {
                  if (dir === 'next') setLightboxIndex(1);
                  if (dir === 'prev') setLightboxIndex(0);
              }}
          >
               <div className="flex items-center justify-center w-full h-full p-4">
                  <img 
                      key={lightboxIndex} 
                      src={lightboxIndex === 0 ? previewUrl! : generatedImage} 
                      alt={lightboxIndex === 0 ? "Original" : "Generated"} 
                      className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                  />
               </div>
          </Lightbox>
      )}

      {/* History Gallery */}
      <div ref={galleryRef} className="flex flex-col gap-6 pt-8 border-t border-[#d8dce8]">
         <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-[#303135]">History Gallery</h2>
         </div>
         
         {/* Filters */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <TiketTabs 
                items={[
                    { id: 'my_history', label: 'My History' },
                    { id: 'team_history', label: 'Team History' }
                ]}
                activeId={historyTab}
                onChange={(id) => { setHistoryTab(id); setCurrentPage(1); }}
            />

            <div className="flex items-center gap-3">
                 <div className="w-[150px]">
                    <TiketSelect 
                        placeholder="Ratios"
                        options={[
                            { id: 'all', label: 'Ratios' }, 
                            ...availableHistoryRatios
                                .filter(r => r !== 'match_input_image') // Exclude 'Match Input Image' as it's typically an artifact
                                .map(r => {
                                const known = AVAILABLE_RATIOS.find(ar => ar.value === r);
                                return { id: r, label: known ? known.label : r };
                            })
                        ]}
                        value={historyFilterRatio}
                        onChange={(val) => { setHistoryFilterRatio(val); setCurrentPage(1); }}
                        showSearch={false}
                    />
                 </div>
                 <div className="w-[150px]">
                    <TiketSelect 
                        placeholder="Resolutions"
                        options={[
                            { id: 'all', label: 'Resolutions' }, 
                            ...availableHistoryResolutions.map(r => {
                                const known = AVAILABLE_RESOLUTIONS.find(ar => ar.value === r);
                                return { id: r, label: known ? known.label.replace(' - Default', '') : r };
                            })
                        ]}
                        value={historyFilterResolution}
                        onChange={(val) => { setHistoryFilterResolution(val); setCurrentPage(1); }}
                        showSearch={false}
                    />
                 </div>
                 <div className="w-[150px]">
                    <TiketSelect 
                        placeholder="Sort By"
                        options={[
                            { id: 'newest', label: 'Newest First' },
                            { id: 'oldest', label: 'Oldest First' }
                        ]}
                        value={historySort}
                        onChange={(val) => { setHistorySort(val); setCurrentPage(1); }}
                        showSearch={false}
                    />
                 </div>
            </div>
         </div>

         {/* Grid */}
         {isLoadingHistory ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {Array.from({ length: 8 }).map((_, i) => (
                     <div key={i} className="group relative rounded-xl overflow-hidden bg-white border border-[#e9ebef] shadow-sm">
                         <Skeleton className="w-full aspect-[4/3]" />
                         <div className="absolute top-2 right-2 flex flex-row gap-1 z-10">
                            <Skeleton className="w-[30px] h-[16px] rounded bg-black/20" />
                            <Skeleton className="w-[30px] h-[16px] rounded bg-black/20" />
                         </div>
                     </div>
                 ))}
             </div>
         ) : (
             <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredHistory.map((item, index) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden bg-white border border-[#e9ebef] shadow-sm hover:shadow-md transition-all">
                            {/* Thumbnail */}
                            <div 
                                className="aspect-[4/3] relative bg-gray-100 overflow-hidden cursor-pointer"
                                onClick={() => {
                                    setHistoryLightboxIndex(index);
                                    setHistoryLightboxOpen(true);
                                }}
                            >
                                <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                
                                {/* Badges - Top Right */}
                                <div className="absolute top-2 right-2 flex flex-row gap-1 items-center z-10 pointer-events-none">
                                    {item.task_type && (
                                        <span className={`px-2 py-0.5 text-[10px] rounded backdrop-blur-md w-fit ${item.task_type === 'translate' ? 'bg-blue-600/80 text-white' : 'bg-black/60 text-white'}`}>
                                            {item.task_type === 'translate' ? 'Translate' : item.ratio}
                                        </span>
                                    )}
                                    {!item.task_type && (
                                         <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] rounded backdrop-blur-md w-fit">{item.ratio}</span>
                                    )}
                                    <span className="px-2 py-0.5 bg-black/60 text-white text-[10px] rounded backdrop-blur-md w-fit">{item.resolution}</span>
                                </div>

                                {/* Download - Bottom Right (Visible on Hover) */}
                                <button 
                                    className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 z-20 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(item.image_url, `generated_${item.id}.jpg`);
                                    }}
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {filteredHistory.length === 0 && (
                        <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-[360px] h-[240px] mb-6">
                                <TdsSiGeneralError />
                            </div>
                            <h3 className="text-[24px] font-bold text-[#303135] mb-2">
                                Nothing to see here
                            </h3>
                            <p className="text-[14px] text-[#71747d]">
                                Start generating images to see your history here.
                            </p>
                        </div>
                    )}
                </div>

                {totalItems > ITEMS_PER_PAGE && (
                    <TiketPagination 
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                        totalItems={totalItems}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={(page) => {
                            setCurrentPage(page);
                            galleryRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    />
                )}
             </>
         )}
      </div>

      {/* History Lightbox - Asset Inspector */}
      {filteredHistory.length > 0 && (
          <Lightbox
            isOpen={historyLightboxOpen}
            onOpenChange={setHistoryLightboxOpen}
            hasNavigation={true}
            currentIndex={historyLightboxIndex}
            totalSlides={filteredHistory.length}
            onNavigate={(dir) => {
                if (dir === 'next') setHistoryLightboxIndex(prev => Math.min(prev + 1, filteredHistory.length - 1));
                if (dir === 'prev') setHistoryLightboxIndex(prev => Math.max(prev - 1, 0));
            }}
            panel={filteredHistory[historyLightboxIndex] ? (
                <div className="flex flex-col h-full w-full">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Asset Details</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                        {/* Creator */}
                        <div className="flex items-center gap-3">
                             <UserAvatar 
                                 src={filteredHistory[historyLightboxIndex].user_avatar}
                                 name={formatStoredName(filteredHistory[historyLightboxIndex].user_name, 'User')}
                                 size={40}
                                 showTooltip={false}
                             />
                             <div>
                                <p className="text-sm font-medium text-gray-900">{formatStoredName(filteredHistory[historyLightboxIndex].user_name, 'Unknown')}</p>
                                <p className="text-xs text-gray-500">{timeAgo(filteredHistory[historyLightboxIndex].created_at)}</p>
                             </div>
                        </div>
                        
                        {/* Metadata */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Resolution</p>
                                <div className="text-sm font-medium text-gray-900">
                                    {currentImageMeta ? `${currentImageMeta.width} x ${currentImageMeta.height}` : <Skeleton className="h-5 w-24" />}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Ratio</p>
                                <p className="text-sm font-medium text-gray-900">{filteredHistory[historyLightboxIndex].ratio}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">File Size</p>
                                <div className="text-sm font-medium text-gray-900">
                                    {currentImageMeta?.size || <Skeleton className="h-5 w-24" />}
                                </div>
                            </div>
                            
                            {/* Translation Info */}
                            {filteredHistory[historyLightboxIndex].task_type === 'translate' && (() => {
                                const prompt = filteredHistory[historyLightboxIndex].prompt;
                                const match = prompt.match(/Translate all content text from (.*?) to (.*?)\./);
                                if (match) {
                                    const source = match[1];
                                    const target = match[2];
                                    
                                    const getFlag = (lang: string) => {
                                        if (lang.includes('English')) return "https://flagcdn.com/w40/us.png";
                                        if (lang.includes('Indonesian')) return "https://flagcdn.com/w40/id.png";
                                        return null; // For auto or other
                                    };

                                    return (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Translation</p>
                                            <div className="flex items-center gap-2">
                                                {getFlag(source) ? (
                                                    <div className="w-5 h-3.5 relative shadow-sm rounded-sm overflow-hidden flex-shrink-0">
                                                        <img src={getFlag(source)!} alt={source} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                     <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-center">{source}</span>
                                                )}
                                                
                                                <ArrowRight className="w-3 h-3 text-gray-400" />
                                                
                                                {getFlag(target) ? (
                                                    <div className="w-5 h-3.5 relative shadow-sm rounded-sm overflow-hidden flex-shrink-0">
                                                        <img src={getFlag(target)!} alt={target} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-center">{target}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>

                        {/* Prompt */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Prompt</p>
                                 <button 
                                    onClick={async () => {
                                        const success = await copyToClipboard(filteredHistory[historyLightboxIndex].prompt);
                                        if (success) {
                                            toast.custom((t) => <TiketSnackbar id={t} message="Prompt copied!" variant="default" />);
                                        } else {
                                            toast.custom((t) => <TiketSnackbar id={t} message="Copy failed" variant="error" />);
                                        }
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                 >
                                    <Copy className="w-3 h-3" /> Copy
                                </button>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 leading-relaxed max-h-[300px] overflow-y-auto">
                                {filteredHistory[historyLightboxIndex].prompt}
                            </div>
                        </div>
                    </div>

                    {/* Action Area */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                         <button 
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm"
                            onClick={() => handleDownload(filteredHistory[historyLightboxIndex].image_url, `generated_${filteredHistory[historyLightboxIndex].id}.jpg`)}
                         >
                            <Download className="w-4 h-4" />
                            Download Image
                        </button>

                        <button 
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                                setIsRedirectingToEdit(true);
                                window.location.href = `/tools/image-generation?tab=edit&source_url=${encodeURIComponent(filteredHistory[historyLightboxIndex].image_url)}`;
                            }}
                            disabled={isRedirectingToEdit}
                        >
                            {isRedirectingToEdit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Pencil className="w-4 h-4" />
                            )}
                            {isRedirectingToEdit ? 'Redirecting...' : 'Edit'}
                        </button>

                        {/* Translate Action */}
                        <Popover>
                        <PopoverTrigger asChild>
                            <button className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm border border-blue-200 shadow-sm">
                                {isRedirecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                                {isRedirecting ? 'Redirecting...' : 'Translate'}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-2 z-[150]" align="end">
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => {
                                        setIsRedirecting(true);
                                        window.location.href = `/tools/banner-translate?imageUrl=${encodeURIComponent(filteredHistory[historyLightboxIndex].image_url)}&sourceLang=English&targetLang=Indonesian`;
                                    }}
                                    disabled={isRedirecting}
                                    className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">🇺🇸 English</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span className="flex items-center gap-2">🇮🇩 Indonesian</span>
                                    {isRedirecting && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsRedirecting(true);
                                        window.location.href = `/tools/banner-translate?imageUrl=${encodeURIComponent(filteredHistory[historyLightboxIndex].image_url)}&sourceLang=Indonesian&targetLang=English`;
                                    }}
                                    disabled={isRedirecting}
                                    className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">🇮🇩 Indonesian</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span className="flex items-center gap-2">🇺🇸 English</span>
                                    {isRedirecting && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                </button>
                            </div>
                        </PopoverContent>
                        </Popover>

                        {user && filteredHistory[historyLightboxIndex].created_by === user.id && (
                            <button 
                                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-100"
                                onClick={(e) => {
                                    e.stopPropagation(); // Prevent lightbox close
                                    const item = filteredHistory[historyLightboxIndex];
                                    setItemToDelete(item);
                                    setDeleteConfirmOpen(true);
                                }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Asset
                            </button>
                        )}
                    </div>
                </div>
            ) : null}
          >
              {filteredHistory[historyLightboxIndex] && (
                   <img 
                      src={filteredHistory[historyLightboxIndex].image_url} 
                      alt="Full View" 
                      className="max-w-full max-h-[90vh] object-contain shadow-xl" 
                   />
              )}
          </Lightbox>
      )}

      {/* Ratio Warning Dialog */}
      <AlertDialog open={showRatioWarning} onOpenChange={setShowRatioWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
                {ratioWarningType === 'same' ? "Same Aspect Ratio Detected" : "Different Aspect Ratio Detected"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {ratioWarningType === 'same' 
                ? "You are resizing to the same ratio as the original image. The result might look identical unless you changed the prompt or composition settings. Continue?"
                : "You selected a different ratio for translation. This might distort the layout. Do you want to proceed?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRatioWarning(false)}>Change Settings</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                setShowRatioWarning(false);
                executeGeneration();
            }}>
                Generate Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocking Error Modal */}
      <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-gray-900">
                      Generation Failed
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-500">
                      {errorModalMessage || "An unexpected error occurred. Please try again."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="sm:justify-center mt-4">
                  <AlertDialogAction 
                      onClick={() => setIsErrorModalOpen(false)}
                      className="w-full bg-gray-900 hover:bg-gray-800"
                  >
                      Close
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog 
        open={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen} 
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />

    </div>
  );
}
