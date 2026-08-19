import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Trash2, ZoomIn, Info, Loader2, ChevronDown, ChevronUp, Languages, Copy, XCircle, ArrowRight, Settings2, AlertTriangle, ArrowLeftRight, Pencil } from 'lucide-react';
import { InstantLottie } from '../ui/InstantLottie';
import { Skeleton } from '../ui/skeleton';
import { TiketButton } from '../ui/TiketButton';
import { TiketSelect } from '../ui/TiketSelect';
import { TiketTextarea, TiketInput } from '../ui/TiketInput';
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
import { Lightbox } from '../Lightbox';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { AVAILABLE_RESOLUTIONS, AVAILABLE_RATIOS } from '../../../config/generative-resize-presets';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { supabase } from '../../../utils/supabase/client';
import TdsSiGeneralError from '../../../imports/TdsSiGeneralError404-2031-7672';
import TdsIcSparklingGeneral from '../../../imports/TdsIcSparklingGeneral';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { UserAvatar } from '../UserAvatar';
import { copyToClipboard } from '../../../utils/clipboard';
import { Session } from '@supabase/supabase-js';
import { getUserDisplayName, getUserAvatarUrl, formatStoredName } from '../../utils/userDisplay';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

const FLAG_US = "https://flagcdn.com/w40/us.png";
const FLAG_ID = "https://flagcdn.com/w40/id.png";

const LANGUAGE_PAIRS = [
    { 
        id: 'en-id', 
        label: 'English → Indonesian',
        render: (
            <div className="flex items-center gap-2">
                <img src={FLAG_US} alt="US" className="w-5 h-3.5 object-cover rounded-[2px]" />
                <span className="text-[#303135]">English</span>
                <ArrowRight className="w-4 h-4 text-[#71747d]" />
                <img src={FLAG_ID} alt="ID" className="w-5 h-3.5 object-cover rounded-[2px]" />
                <span className="text-[#303135]">Indonesian</span>
            </div>
        ),
        renderSelected: (
            <div className="flex items-center gap-2 w-full overflow-hidden">
                <img src={FLAG_US} alt="US" className="w-5 h-3.5 object-cover rounded-[2px] shrink-0" />
                <span className="text-[#303135] shrink-0">English</span>
                <ArrowRight className="w-4 h-4 text-[#71747d] shrink-0" />
                <img src={FLAG_ID} alt="ID" className="w-5 h-3.5 object-cover rounded-[2px] shrink-0" />
                <span className="text-[#303135] truncate">Indonesian</span>
            </div>
        )
    },
    { 
        id: 'id-en', 
        label: 'Indonesian → English',
        render: (
            <div className="flex items-center gap-2">
                <img src={FLAG_ID} alt="ID" className="w-5 h-3.5 object-cover rounded-[2px]" />
                <span className="text-[#303135]">Indonesian</span>
                <ArrowRight className="w-4 h-4 text-[#71747d]" />
                <img src={FLAG_US} alt="US" className="w-5 h-3.5 object-cover rounded-[2px]" />
                <span className="text-[#303135]">English</span>
            </div>
        ),
        renderSelected: (
            <div className="flex items-center gap-2 w-full overflow-hidden">
                <img src={FLAG_ID} alt="ID" className="w-5 h-3.5 object-cover rounded-[2px] shrink-0" />
                <span className="text-[#303135] shrink-0">Indonesian</span>
                <ArrowRight className="w-4 h-4 text-[#71747d] shrink-0" />
                <img src={FLAG_US} alt="US" className="w-5 h-3.5 object-cover rounded-[2px] shrink-0" />
                <span className="text-[#303135] truncate">English</span>
            </div>
        )
    }
];

interface HistoryItem {
  id: string;
  image_url: string;
  original_image_url: string;
  prompt: string;
  ratio: string;
  resolution: string;
  created_by: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  task_type?: 'resize' | 'translate';
  source_lang?: string;
  target_lang?: string;
}

interface BannerTranslateProps {
  session: Session | null;
}

export function BannerTranslate({ session }: BannerTranslateProps) {
  const user = session?.user || null;
  
  // Controls
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tempInputPath, setTempInputPath] = useState<string | null>(null);
  const [tempInputUrl, setTempInputUrl] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [languagePair, setLanguagePair] = useState<string>('en-id');
  
  const sourceLang = languagePair === 'en-id' ? 'English' : 'Indonesian';
  const targetLang = languagePair === 'en-id' ? 'Indonesian' : 'English';

  const [targetRatio, setTargetRatio] = useState<string>('match_input_image');
  const [excludedWords, setExcludedWords] = useState<string>('');
  const [resolution, setResolution] = useState<string>('2K');
  const [prompt, setPrompt] = useState<string>('');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Ratio Guard State
  const [sourceDimensions, setSourceDimensions] = useState<{width: number, height: number} | null>(null);
  const [isRatioWarningOpen, setIsRatioWarningOpen] = useState(false);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState<string>('');
  
  // UI States
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [historyLightboxOpen, setHistoryLightboxOpen] = useState(false);
  const [historyLightboxIndex, setHistoryLightboxIndex] = useState(0);
  const [currentImageMeta, setCurrentImageMeta] = useState<{ width: number; height: number; size: string | null } | null>(null);
  
  // Delete Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Restore/Redirect State
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRedirectingToEdit, setIsRedirectingToEdit] = useState(false);
  
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
  const [historyFilterLang, setHistoryFilterLang] = useState('all');
  const [historyFilterResolution, setHistoryFilterResolution] = useState('all');
  const [historySort, setHistorySort] = useState('newest');
  const [availableHistoryLangs, setAvailableHistoryLangs] = useState<string[]>([]);
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

  // Auto-generate translation prompt
  useEffect(() => {
    let newPrompt = `Translate all text from ${sourceLang} to ${targetLang}. Preserve layout and style.`;
    
    if (excludedWords.trim()) {
        newPrompt += ` DO NOT translate: [ ${excludedWords} ].`;
    }
    
    setPrompt(newPrompt);
  }, [sourceLang, targetLang, excludedWords]);

  // Handle URL Params for Navigation/Handoff
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const imageUrl = searchParams.get('imageUrl');
    const sLang = searchParams.get('sourceLang');
    const tLang = searchParams.get('targetLang');

    if (imageUrl) {
        setPreviewUrl(imageUrl);
        setTempInputUrl(imageUrl);
        setIsUploaded(true);
        
        // Detect Dimensions
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => {
            setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        };
    }

    if (sLang && tLang) {
        if (sLang === 'English' && tLang === 'Indonesian') setLanguagePair('en-id');
        else if (sLang === 'Indonesian' && tLang === 'English') setLanguagePair('id-en');
    }

  }, []);

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
      setTempInputUrl(null);
      setTempInputPath(null);
      setIsUploaded(false);

      setSourceFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setGeneratedImage(null);
      setError(null);

      // Detect Dimensions
      const img = new Image();
      img.src = url;
      img.onload = () => {
          setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
  };

  const clearSourceImage = async () => {
       setSourceFile(null);
       setPreviewUrl(null);
       setTempInputUrl(null);
       setTempInputPath(null);
       setIsUploaded(false);
       setGeneratedImage(null);
       setSourceDimensions(null);
       
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
    const path = `Assets/Tools/BannerTranslate/TempInput/${filename}`;
    
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
      
      setTempInputPath(path);
      setTempInputUrl(data.url);
      setIsUploaded(true);
      
      return data.url;
    } catch (e) {
      setError("Failed to upload source image");
      return null;
    }
  };

  const getClosestRatioLabel = (width: number, height: number) => {
      const currentRatio = width / height;
      let closest = null;
      let minDiff = Number.MAX_VALUE;

      AVAILABLE_RATIOS.forEach(r => {
          if (r.value === 'match_input_image') return;
          const [w, h] = r.value.split(':').map(Number);
          const ratioVal = w / h;
          const diff = Math.abs(currentRatio - ratioVal);
          if (diff < minDiff) {
              minDiff = diff;
              closest = r.label;
          }
      });
      return closest || 'Custom Ratio';
  };

  const handleTranslateClick = () => {
      if (targetRatio === 'match_input_image') {
          executeGeneration();
          return;
      }

      if (sourceDimensions) {
          const currentRatio = sourceDimensions.width / sourceDimensions.height;
          const [targetW, targetH] = targetRatio.split(':').map(Number);
          const targetRatioVal = targetW / targetH;

          // Check for mismatch (using 0.1 threshold)
          if (Math.abs(currentRatio - targetRatioVal) > 0.1) {
              setIsRatioWarningOpen(true);
              return;
          }
      }
      
      executeGeneration();
  };

  const executeGeneration = async () => {
    if (!sourceFile && !tempInputUrl) return;
    if (!user) return;
    
    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);
    setIsRatioWarningOpen(false); // Close warning if open
    isCancelledRef.current = false;

    try {
        let fileUrl = tempInputUrl;

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
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                aspect_ratio: targetRatio,
                resolution: resolution,
                image_input: [fileUrl], // ONLY source image
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
            throw new Error(startData.error || `Failed to start translation with status: ${startRes.status}`);
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
                throw new Error("Translation is taking longer than expected. Please check your history later.");
            }

            // Wait 3 seconds between polls
            await new Promise(resolve => setTimeout(resolve, 3000));

            const pollRes = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, {
                headers: {
                    'Authorization': `Bearer ${publicAnonKey}`,
                }
            });

            if (!pollRes.ok) {
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

            await saveResultToStorage(generatedUrl, targetRatio);
        } else if (status === 'canceled' && isCancelledRef.current) {
             // Silent exit for intentional cancellation
             return;
        } else {
            throw new Error(errorMsg || `Translation failed with status: ${status}`);
        }

    } catch (e: any) {
        const msg = e.message || "An error occurred during translation.";
        setError(msg);
        setErrorModalMessage(msg);
        setIsErrorModalOpen(true);
        console.error('Translation error:', e);
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
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!res.ok) throw new Error("Failed to cancel");
      
      setIsGenerating(false);
      setCurrentPredictionId(null);
      // Silent cancellation
    } catch (e: any) {
      console.error("Failed to cancel translation", e);
    } finally {
      setIsCancelling(false);
    }
  };

  const saveResultToStorage = async (url: string, ratio: string) => {
    try {
        const imgRes = await fetch(url);
        const blob = await imgRes.blob();
        const file = new File([blob], `translated_${Date.now()}.jpg`, { type: 'image/jpeg' });

        const filename = `translated_${Date.now()}_${user.id}.jpg`;
        const path = `Assets/Tools/BannerTranslate/Output/${filename}`;
        
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

        const historyItem: Partial<HistoryItem> = {
            image_url: finalUrl,
            original_image_url: tempInputPath || '', 
            prompt,
            ratio,
            resolution,
            created_by: user.id,
            user_name: getUserDisplayName(user),
            user_avatar: getUserAvatarUrl(user),
            task_type: 'translate',
            source_lang: sourceLang,
            target_lang: targetLang
        };

        await fetch(`${SERVER_URL}/generative-resize/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        });

        fetchHistory();

    } catch (e) {
        console.error("Failed to save result", e);
    }
  };

  // Normalize language for consistent filtering and display
  const normalizeLang = (lang: string | undefined) => {
    if (!lang) return '';
    const lower = lang.toLowerCase();
    if (lower === 'id' || lower === 'indonesian') return 'Indonesian';
    if (lower === 'en' || lower === 'english') return 'English';
    return lang;
  };

  // History Fetching - Filter by task_type='translate'
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
        const queryParams = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITEMS_PER_PAGE.toString(),
            sort: historySort,
            taskType: 'translate' // Only show translation history
        });

        if (historyTab === 'my_history' && user) {
            queryParams.append('userId', user.id);
        }
        
        // Note: We do NOT filter targetLang on server-side to allow client-side handling of mixed data ('id' vs 'Indonesian')
        // if (historyFilterLang !== 'all') {
        //    queryParams.append('targetLang', historyFilterLang);
        // }

        if (historyFilterResolution !== 'all') {
            queryParams.append('resolution', historyFilterResolution);
        }

        const res = await fetch(`${SERVER_URL}/generative-resize/history?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        });

        if (!res.ok) throw new Error("Failed to fetch history");

        const result = await res.json();
        
        const processFiltered = (items: HistoryItem[]) => {
            let filtered = items.filter(i => i.task_type === 'translate');
            
            // Robust Client-side Language Filter
            if (historyFilterLang !== 'all') {
                filtered = filtered.filter(i => normalizeLang(i.target_lang) === normalizeLang(historyFilterLang));
            }
            return filtered;
        };

        if (Array.isArray(result)) {
             const filtered = processFiltered(result);
             setHistoryItems(filtered);
             setTotalItems(filtered.length);
        } else {
             const filtered = processFiltered(result.data || []);
             setHistoryItems(filtered);
             setTotalItems(result.total || filtered.length);
             // We still rely on facets if available, but might need to adjust them if they return mixed codes
             if (result.facets) {
                 setAvailableHistoryLangs(result.facets.targetLangs || []);
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
  }, [currentPage, historyTab, historyFilterLang, historyFilterResolution, historySort, user]);

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
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
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
        fetchHistory(); // Revert optimistic update
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
        
        const img = new Image();
        img.src = url;
        img.onload = () => {
            setCurrentImageMeta(prev => ({ ...prev, width: img.naturalWidth, height: img.naturalHeight, size: prev?.size || null }));
        };

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
                <label className="text-[14px] font-bold text-[#303135]">Source Image</label>
                <div 
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors relative ${
                        isDragging ? 'border-[#007BFF] bg-[#eff6ff]' : 'border-[#d8dce8] hover:bg-gray-50'
                    } ${isGenerating ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                    onClick={() => !isGenerating && document.getElementById('source-upload')?.click()}
                    onDragOver={!isGenerating ? handleDragOver : undefined}
                    onDragLeave={!isGenerating ? handleDragLeave : undefined}
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
                            <img src={previewUrl} alt="Source" className="max-w-full max-h-[200px] w-auto h-auto object-contain rounded-md" />
                            
                            {/* Remove Button */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    clearSourceImage();
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

            {/* Language Settings */}
            <div className="flex flex-col gap-2">
                <label className="text-[14px] font-bold text-[#303135]">Language</label>
                <TiketSelect 
                    options={LANGUAGE_PAIRS}
                    value={languagePair}
                    onChange={setLanguagePair}
                    showSearch={false}
                    disabled={isGenerating}
                />
            </div>

            {/* Ratio and Resolution Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Ratio */}
                <div className="flex flex-col gap-2">
                    <label className="text-[14px] font-bold text-[#303135]">Ratio</label>
                    <TiketSelect 
                        options={AVAILABLE_RATIOS.map(r => ({ id: r.value, label: r.label }))}
                        value={targetRatio}
                        onChange={setTargetRatio}
                        showSearch={false}
                        disabled={isGenerating}
                    />
                </div>

                {/* Resolution */}
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

            {/* Advanced Settings (Unified) */}
            <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full border border-[#e9ebef] rounded-lg bg-gray-50/50"
                disabled={isGenerating}
            >
                <CollapsibleTrigger disabled={isGenerating} className={`flex items-center justify-between w-full p-4 font-bold text-[14px] text-[#303135] hover:bg-gray-100/50 transition-colors rounded-lg ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <span className="flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-[#007BFF]" />
                        Advanced Settings
                    </span>
                    {isAdvancedOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#71747d]" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-[#71747d]" />
                    )}
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4 pt-0 flex flex-col gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="h-[1px] w-full bg-[#e9ebef]" />
                    
                    {/* Exclude Words */}
                    <div className="flex flex-col gap-2">
                         <label className="text-[12px] font-bold text-[#303135]">Exclude Words / Branding</label>
                         <TiketInput
                            value={excludedWords}
                            onChange={(e) => setExcludedWords(e.target.value)}
                            placeholder="e.g. Limited Deals, BCA, gopay"
                            className="text-[13px]"
                            disabled={isGenerating}
                         />
                         <span className="text-[11px] text-[#71747d]">Comma separated words to keep original.</span>
                    </div>

                    {/* Prompt */}
                    <div className="flex flex-col gap-2">
                         <label className="text-[12px] font-bold text-[#303135]">Raw AI Instruction</label>
                         <TiketTextarea
                             value={prompt}
                             onChange={(e) => setPrompt(e.target.value)}
                             rows={4}
                             className="text-[13px] min-h-[80px]"
                             disabled={isGenerating}
                         />
                    </div>
                </CollapsibleContent>
            </Collapsible>

            {/* Generate Button */}
            <TiketButton
                onClick={isGenerating ? handleCancelGeneration : handleTranslateClick}
                disabled={(!isGenerating && !previewUrl) || isCancelling}
                className="w-full"
                variant={isGenerating ? "alert" : "primary"}
            >
                {isGenerating ? (
                    <span className="flex items-center gap-2">
                        {isCancelling ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            "Cancel Translation"
                        )}
                    </span>
                ) : (
                    <span className="flex items-center gap-2">
                        <Languages className="w-4 h-4" />
                        Translate
                    </span>
                )}
            </TiketButton>

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
                        download={`translated_banner.jpg`}
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
                            {["Translating text content...", "Preserving layout and styles...", "Maintaining visual consistency...", "Finalizing translation..."][loadingTextIndex]}
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
                            <span className="absolute top-2 left-2 bg-[#007BFF] text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm z-10">Translated</span>
                            {/* Blinking Orange Outline */}
                            <div className="absolute inset-0 border-2 border-[#FF7F00] rounded-lg animate-pulse pointer-events-none z-20" />
                            <img src={generatedImage} className="w-full h-full object-contain" alt="Translated" />
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
                      alt={lightboxIndex === 0 ? "Original" : "Translated"} 
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
                        placeholder="Languages"
                        options={[
                            { id: 'all', label: 'Languages' },
                            { id: 'English', label: 'English' },
                            { id: 'Indonesian', label: 'Indonesian' }
                        ]}
                        value={historyFilterLang}
                        onChange={(val) => { setHistoryFilterLang(val); setCurrentPage(1); }}
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
         ) : filteredHistory.length === 0 ? (
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
                                    {item.target_lang && (
                                        <span className="px-2 py-0.5 text-[10px] rounded backdrop-blur-md bg-blue-600/80 text-white font-medium">
                                            {normalizeLang(item.target_lang)}
                                        </span>
                                    )}
                                    {item.resolution && (
                                        <span className="px-2 py-0.5 text-[10px] rounded backdrop-blur-md bg-black/60 text-white">
                                            {item.resolution}
                                        </span>
                                    )}
                                </div>

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                    <div className="w-full text-white">
                                        <p className="text-[10px] opacity-80">{formatStoredName(item.user_name, 'Anonymous')}</p>
                                        <p className="text-[11px] font-medium mt-0.5">{timeAgo(item.created_at)}</p>
                                    </div>
                                </div>

                                {/* Download - Bottom Right (Visible on Hover) */}
                                <button 
                                    className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/80 z-20 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(item.image_url, `translated_${item.id}.jpg`);
                                    }}
                                    title="Download"
                                >
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalItems > ITEMS_PER_PAGE && (
                    <div className="flex justify-center mt-8">
                        <TiketPagination
                            currentPage={currentPage}
                            totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                            onPageChange={(page) => {
                                setCurrentPage(page);
                                galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                        />
                    </div>
                )}
             </>
         )}
      </div>

      {/* Error Modal */}
      <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-gray-900">
                      Translation Failed
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-500">
                      {errorModalMessage || "An unexpected error occurred. Please try again."}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogAction 
                      onClick={() => setIsErrorModalOpen(false)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                      Got it
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      {/* Ratio Warning Modal */}
      <AlertDialog open={isRatioWarningOpen} onOpenChange={setIsRatioWarningOpen}>
          <AlertDialogContent className="sm:max-w-[425px]">
              <AlertDialogHeader className="flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold text-gray-900">
                      Ratio Mismatch Detected
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-500">
                      You are translating a <span className="font-bold text-gray-800">{sourceDimensions ? getClosestRatioLabel(sourceDimensions.width, sourceDimensions.height) : 'Custom'}</span> banner 
                      into a <span className="font-bold text-gray-800">{AVAILABLE_RATIOS.find(r => r.value === targetRatio)?.label || targetRatio}</span> format. 
                      This may cause the layout to stretch or crop. Do you want to continue?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row gap-3 sm:justify-center w-full">
                  <AlertDialogCancel className="w-full mt-0">Change Settings</AlertDialogCancel>
                  <AlertDialogAction 
                      onClick={executeGeneration}
                      className="w-full bg-[#007BFF] hover:bg-blue-700 text-white"
                  >
                      Proceed Anyway
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

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
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">File Size</p>
                              <div className="text-sm font-medium text-gray-900">
                                  {currentImageMeta?.size || <Skeleton className="h-5 w-24" />}
                              </div>
                          </div>
                          
                          {/* Translation Info */}
                          <div className="col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Translation</p>
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                      {normalizeLang(filteredHistory[historyLightboxIndex].source_lang) || 'Auto'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">
                                      {normalizeLang(filteredHistory[historyLightboxIndex].target_lang) || 'Unknown'}
                                  </span>
                              </div>
                          </div>
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
                          onClick={() => handleDownload(filteredHistory[historyLightboxIndex].image_url, `translated_${filteredHistory[historyLightboxIndex].id}.jpg`)}
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
                               {isRestoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                               {isRestoring ? 'Loading...' : 'Translate'}
                           </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-2 z-[150]" align="end">
                            <div className="flex flex-col gap-1">
                                <button 
                                    onClick={() => {
                                        setIsRestoring(true);
                                        // Small delay for visual feedback
                                        setTimeout(() => {
                                            setPreviewUrl(filteredHistory[historyLightboxIndex].image_url);
                                            setTempInputUrl(filteredHistory[historyLightboxIndex].image_url);
                                            setLanguagePair('en-id');
                                            setIsUploaded(true);
                                            setHistoryLightboxOpen(false);
                                            
                                            // Update dimensions
                                            const img = new Image();
                                            img.src = filteredHistory[historyLightboxIndex].image_url;
                                            img.onload = () => setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                                            
                                            setIsRestoring(false);
                                        }, 500);
                                    }}
                                    disabled={isRestoring}
                                    className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">🇺🇸 English</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span className="flex items-center gap-2">🇮🇩 Indonesian</span>
                                    {isRestoring && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsRestoring(true);
                                        setTimeout(() => {
                                            setPreviewUrl(filteredHistory[historyLightboxIndex].image_url);
                                            setTempInputUrl(filteredHistory[historyLightboxIndex].image_url);
                                            setLanguagePair('id-en');
                                            setIsUploaded(true);
                                            setHistoryLightboxOpen(false);

                                            // Update dimensions
                                            const img = new Image();
                                            img.src = filteredHistory[historyLightboxIndex].image_url;
                                            img.onload = () => setSourceDimensions({ width: img.naturalWidth, height: img.naturalHeight });
                                            
                                            setIsRestoring(false);
                                        }, 500);
                                    }}
                                    disabled={isRestoring}
                                    className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="flex items-center gap-2">🇮🇩 Indonesian</span>
                                    <ArrowRight className="w-3 h-3 text-gray-400" />
                                    <span className="flex items-center gap-2">🇺🇸 English</span>
                                    {isRestoring && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                                </button>
                            </div>
                        </PopoverContent>
                      </Popover>

                      {user && filteredHistory[historyLightboxIndex].created_by === user.id && (
                          <button 
                              className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-100"
                              onClick={(e) => {
                                  e.stopPropagation();
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

      <DeleteConfirmDialog 
        open={deleteConfirmOpen} 
        onOpenChange={setDeleteConfirmOpen} 
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
      
    </div>
  );
}