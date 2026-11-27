import { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Plus, Sparkles, RefreshCw, Loader2, Check, X, Trash2, ZoomIn, Dices, Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { BannerService } from '../../../services/bannerService';
import { Lightbox } from '../Lightbox';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { DotLottiePlayer } from '@dotlottie/react-player';
import { projectId } from '../../../../utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';

import { useAccess } from '../../../context/AccessContext';
import { AI_MODELS, DEFAULT_MODEL_ID } from '../../../config/ai-models';
import { AIGenerator } from './AIGenerator';
import { HistorySelector } from '../create-banner/components/HistorySelector';

interface ImageInputSelectorProps {
  onAssetSelected: (file: File | null, url?: string) => void;
  accept?: string;
  maxSizeMB?: number;
  hideAITab?: boolean;
  hideHistoryTab?: boolean;
}

const convertToSupportedFormat = async (file: File): Promise<File> => {
    const supportedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (supportedTypes.includes(file.type)) return file;

    return new Promise((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file); 
                return;
            }
            
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                if (!blob) {
                    resolve(file);
                    return;
                }
                const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
                const newFile = new File([blob], newName, { type: 'image/png' });
                resolve(newFile);
            }, 'image/png');
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            // If browser can't read it, return original and let server handle (or fail)
            resolve(file); 
        };
        
        img.src = url;
    });
};

export function ImageInputSelector({ 
  onAssetSelected, 
  accept = "image/png, image/jpeg, image/jpg, image/webp",
  maxSizeMB = 50,
  hideAITab: hideAITabProp = false,
  hideHistoryTab: hideHistoryTabProp = false
}: ImageInputSelectorProps) {
  // Generate and Gallery are AI features: non-whitelisted accounts never see them,
  // regardless of what the caller asks for.
  const { isWhitelisted } = useAccess();
  const hideAITab = hideAITabProp || !isWhitelisted;
  const hideHistoryTab = hideHistoryTabProp || !isWhitelisted;

  const [activeTab, setActiveTab] = useState('upload');
  
  // Upload Mode State
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Paste without clicking first (a click opens the file browser): while the pointer is over the drop zone, ⌘V / Ctrl+V lands here.
  // Only the hovered zone takes it, so several empty pickers on one page never fight over the same paste.
  const [dropHover, setDropHover] = useState(false);
  const validateRef = useRef<(f: File) => void>(() => {});
  useEffect(() => {
    if (!dropHover) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items || []).find((item) => item.type.startsWith('image/'))?.getAsFile();
      if (file) { e.preventDefault(); validateRef.current(file); }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [dropHover]);

  // -- Upload Handlers (Standard) --
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  validateRef.current = (f: File) => { void validateAndSelect(f); };
  const validateAndSelect = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.custom((t) => <TiketSnackbar id={t} message={`File size must be less than ${maxSizeMB}MB`} variant="error" />);
      return;
    }
    
    const processedFile = await convertToSupportedFormat(file);
    onAssetSelected(processedFile);
  };

  return (
    <div className="w-full flex flex-col">
      {/* Tab Header - Only show if AI Tab is NOT hidden */}
      {(!hideAITab || !hideHistoryTab) && (
          <div className="w-full">
            <div className="w-full flex border-b border-[#e8eaee] pt-4">
            <button 
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 pb-3 px-4 text-[14px] font-medium transition-all relative flex items-center gap-2 justify-center text-center ${
                activeTab === 'upload'
                    ? 'text-[#007BFF] font-semibold border-b-2 border-[#007BFF]'
                    : 'text-[#71747d] hover:text-[#303135] border-b-2 border-transparent hover:border-[#d8dce8]'
                }`}
            >
                <Upload className="w-4 h-4" />
                Upload File
            </button>
            {!hideAITab && (
            <button 
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 pb-3 px-4 text-[14px] font-medium transition-all relative flex items-center gap-2 justify-center text-center ${
                activeTab === 'ai'
                    ? 'text-[#007BFF] font-semibold border-b-2 border-[#007BFF]'
                    : 'text-[#71747d] hover:text-[#303135] border-b-2 border-transparent hover:border-[#d8dce8]'
                }`}
            >
                <Sparkles className="w-4 h-4" />
                Generate
            </button>
            )}
            {!hideHistoryTab && (
            <button 
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 pb-3 px-4 text-[14px] font-medium transition-all relative flex items-center gap-2 justify-center text-center ${
                activeTab === 'history'
                    ? 'text-[#007BFF] font-semibold border-b-2 border-[#007BFF]'
                    : 'text-[#71747d] hover:text-[#303135] border-b-2 border-transparent hover:border-[#d8dce8]'
                }`}
            >
                <ImageIcon className="w-4 h-4" />
                Gallery
            </button>
            )}
            </div>
        </div>
      )}

      {/* Tab 1: Upload (Always visible if active or if hideAITab/HistoryTab is true and activeTab matches, effectively default) */}
      {(activeTab === 'upload' || (hideAITab && hideHistoryTab)) && (
         <div
           onDrop={handleDrop}
           onDragOver={(e) => e.preventDefault()}
           onMouseEnter={() => setDropHover(true)}
           onMouseLeave={() => setDropHover(false)}
           tabIndex={0}
           // Drop zone look (dashed B400 outline on B100) so it reads as "drop, paste or click to browse"; the whole box opens the file browser
           onClick={(e) => { if (!(e.target as HTMLElement).closest('button')) fileInputRef.current?.click(); }}
           className="mt-[16px] p-[24px] flex gap-[16px] items-center animate-in fade-in duration-300 focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-2 rounded-[12px] border-2 border-dashed border-[#007BFF] bg-[#E0EFFF]/50 cursor-pointer hover:bg-[#E0EFFF] transition-colors"
         >
              <div className="w-[80px] h-[80px] bg-white rounded-[8px] flex items-center justify-center text-[#99CAFF] shrink-0">
                  <div className="relative">
                      <ImageIcon className="w-[32px] h-[32px]" />
                      <div className="absolute -bottom-1 -right-1 bg-[#99CAFF] rounded-full p-[2px]">
                          <Plus className="w-[10px] h-[10px] text-white" />
                      </div>
                  </div>
              </div>

              <div className="flex flex-col gap-[4px] flex-1">
                  <p className="text-[16px] text-[#303135] font-medium">Max file size {maxSizeMB} MB</p>
                  <p className="text-[14px] text-[#71747d] leading-[20px] min-h-[60px]">
                    {/* Reserves space for up to 3 wrapped lines so switching the hover/non-hover text below never changes the box height, at any container width */}
                    Recommended file type PNG, JPG, WebP — or{' '}
                    <span className="font-bold text-[#007BFF]">{dropHover ? 'press now to paste your copied image' : 'hover here and paste an image from your clipboard'}</span>{' '}
                    <kbd className="inline-flex items-center px-[6px] py-[1px] rounded-[4px] border border-[#99CAFF] bg-white text-[12px] font-semibold text-[#007BFF] align-middle">{typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘V' : 'Ctrl+V'}</kbd>
                  </p>
                  
                  <div className="mt-[4px]">
                      <input 
                          type="file" 
                          className="hidden" 
                          accept={accept}
                          onChange={handleFileChange}
                          ref={fileInputRef}
                      />
                      <Button 
                          type="button"
                          variant="link"
                          className="p-0 h-auto font-bold text-[#007BFF] text-[14px] hover:no-underline hover:text-[#0064D2]"
                          onClick={() => fileInputRef.current?.click()}
                      >
                          <Upload className="w-[16px] h-[16px] mr-2" />
                          Browse File
                      </Button>
                  </div>
              </div>
         </div>
      )}

      {/* Tab 2: AI Generation */}
      {!hideAITab && activeTab === 'ai' && (
         <div className="p-[24px]">
            <AIGenerator onAssetSelected={onAssetSelected} />
         </div>
      )}

      {/* Tab 3: History */}
      {!hideHistoryTab && activeTab === 'history' && (
         <div className="p-[24px]">
            <HistorySelector 
                onSelect={(url) => onAssetSelected(null, url)}
            />
         </div>
      )}
    </div>
  );
}