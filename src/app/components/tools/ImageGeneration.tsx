import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, Info, Loader2, Sparkles, AlertTriangle, XCircle, Search, Trash2, Upload, Copy, Eraser, Crop, Layers, ArrowLeft, RefreshCcw, Scissors, Plus, Camera } from 'lucide-react';
import { InstantLottie } from '../ui/InstantLottie';
import { TiketButton } from '../ui/TiketButton';
import { TiketSwitch } from '../ui/TiketSwitch';
import { TiketSelect } from '../ui/TiketSelect';
import { TiketTextarea } from '../ui/TiketInput';
import { TiketTabs } from '../ui/TiketTabs';
import { TiketPagination } from '../ui/TiketPagination';
import { Lightbox } from '../Lightbox';
import { DeleteConfirmDialog } from '../DeleteConfirmDialog';
import { Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { getAuthToken } from '../../../utils/supabase/client';
import TdsIcSparklingGeneral from '../../../imports/TdsIcSparklingGeneral';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { AVAILABLE_RESOLUTIONS, AVAILABLE_RATIOS } from '../../../config/generative-resize-presets';
import { getCameraPrompt } from '../../../config/smart-adapt-presets';
import { UserAvatar } from '../UserAvatar';
import { Skeleton } from '../ui/skeleton';
import { copyToClipboard } from '../../../utils/clipboard';
import { Slider } from '../ui/slider';
import { getUserDisplayName, getUserAvatarUrl, formatStoredName } from '../../utils/userDisplay';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

const calculateAspectRatio = (width: number, height: number): string => {
    if (!width || !height) return 'Original';
    
    const ratios = [
        { w: 1, h: 1, label: '1:1' },
        { w: 16, h: 9, label: '16:9' },
        { w: 9, h: 16, label: '9:16' },
        { w: 4, h: 3, label: '4:3' },
        { w: 3, h: 4, label: '3:4' },
        { w: 3, h: 2, label: '3:2' },
        { w: 2, h: 3, label: '2:3' },
        { w: 21, h: 9, label: '21:9' },
        { w: 9, h: 21, label: '9:21' }
    ];

    const targetRatio = width / height;
    
    // Find closest standard ratio
    const closest = ratios.reduce((prev, curr) => {
        const currDiff = Math.abs((curr.w / curr.h) - targetRatio);
        const prevDiff = Math.abs((prev.w / prev.h) - targetRatio);
        return currDiff < prevDiff ? curr : prev;
    });

    // Check tolerance (e.g. 0.05)
    if (Math.abs((closest.w / closest.h) - targetRatio) < 0.05) {
        return closest.label;
    }

    // Fallback: simplified fraction
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
};

const getImageDimensions = (url: string): Promise<{ width: number; height: number; ratio: string }> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            resolve({ width: w, height: h, ratio: calculateAspectRatio(w, h) });
        };
        img.onerror = () => {
             resolve({ width: 0, height: 0, ratio: 'Original' });
        };
        img.src = url;
    });
};



// Merge custom ratio with imported ones
const RATIO_OPTIONS = [
  { id: 'match_input_image', label: 'Match Input Image' },
  ...AVAILABLE_RATIOS.filter(r => r.value !== 'match_input_image').map(r => ({ id: r.value, label: r.label }))
];

const RESOLUTION_OPTIONS = [
  { id: '1K', label: '1K (Standard)' },
  { id: '2K', label: '2K (High Quality)' },
  { id: '4K', label: '4K (Ultra High)' },
];

interface HistoryItem {
  id: string;
  image_url: string;
  original_image_url?: string;
  prompt: string;
  ratio: string;
  resolution: string;
  created_by: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
  task_type?: string;
}

export interface InputImage {
  id: string;
  file: File;
  preview: string;
  serverUrl?: string;
  serverPath?: string;
}

interface ImageGenerationProps {
  session: Session | null;
}

// --- Sub-Components for Tab Locking Refactor ---

interface CreateFormProps {
  prompt: string;
  setPrompt: (v: string) => void;
  selectedModel: string;
  inputImages: InputImage[];
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeInputImage: (id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  ratio: string;
  setRatio: (v: string) => void;
  resolution: string;
  setResolution: (v: string) => void;
  isGenerating: boolean;
  isCancelling: boolean;
  handleGenerate: () => void;
  handleCancelGeneration: () => void;
  error?: string | null;
  isProcessing: boolean;
}

const ImageGenerationCreateForm = ({
  prompt, setPrompt, selectedModel, inputImages, handleImageSelect, removeInputImage,
  handleDragOver, handleDragLeave, handleDrop, isDragOver,
  ratio, setRatio, resolution, setResolution,
  isGenerating, isCancelling, handleGenerate, handleCancelGeneration, error, isProcessing
}: CreateFormProps) => {
  return (
    <>
      {/* Prompt Input */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
            <label className="text-[14px] font-bold text-[#303135]">Prompt</label>
            <span className="text-[11px] text-gray-400 font-normal">Model: {selectedModel}</span>
        </div>
        <TiketTextarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          rows={4}
          className="w-full text-[14px]"
          disabled={isProcessing}
        />
      </div>

      {/* Reference Image Input */}
      <div className="flex flex-col gap-2">
         <div className="flex justify-between items-center">
             <label className="text-[14px] font-bold text-[#303135]">Reference Images</label>
             <span className="text-[12px] text-gray-500">{inputImages.length}/14</span>
         </div>
         
         <div className="flex flex-wrap gap-2">
             {/* Empty State / Full Width Drop Zone */}
             {inputImages.length === 0 ? (
                 <div 
                     className={`w-full min-h-[200px] p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                         isDragOver ? 'border-[#007BFF] bg-[#eff6ff]' : 'border-[#d8dce8] hover:bg-gray-50'
                     } ${isProcessing ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                     onClick={() => !isProcessing && document.getElementById('reference-upload')?.click()}
                     onDragOver={!isProcessing ? handleDragOver : undefined}
                     onDragLeave={!isProcessing ? handleDragLeave : undefined}
                     onDrop={!isProcessing ? handleDrop : undefined}
                 >
                     <div className="bg-[#E5F2FF] p-3 rounded-full mb-2">
                         <Upload className="w-6 h-6 text-[#007BFF]" />
                     </div>
                     <span className="text-[14px] text-[#007BFF] font-medium">Click to upload reference images</span>
                     <span className="text-[12px] text-[#71747d]">or drag and drop</span>
                     <span className="text-[12px] text-[#71747d] mt-1">Up to 14 images supported</span>
                 </div>
             ) : (
                 <>
                     {/* Existing Thumbnails */}
                     {inputImages.map((img) => (
                         <div key={img.id} className={`relative w-[100px] h-[100px] group animate-in fade-in zoom-in-95 duration-200 ${isProcessing ? 'opacity-50' : ''}`}>
                             <img src={img.preview} alt="Reference" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                             <button 
                                 onClick={() => !isProcessing && removeInputImage(img.id)}
                                 className={`absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 cursor-pointer ${isProcessing ? 'hidden' : ''}`}
                             >
                                 <XCircle className="w-4 h-4 text-red-500 fill-white" />
                             </button>
                         </div>
                     ))}

                     {/* Add Button (Small Square) */}
                     {inputImages.length < 14 && (
                         <div 
                             className={`w-[100px] h-[100px] border-2 border-dashed border-[#d8dce8] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors hover:border-blue-300 group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                             onClick={() => !isProcessing && document.getElementById('reference-upload')?.click()}
                             title="Add more images"
                         >
                             <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                         </div>
                     )}
                 </>
             )}

             <input 
                 type="file" 
                 id="reference-upload" 
                 className="hidden" 
                 accept="image/*" 
                 multiple 
                 onChange={handleImageSelect} 
                 disabled={inputImages.length >= 14 || isProcessing}
             />
         </div>
      </div>

      {/* Ratio & Resolution Dropdowns */}
      <div className="grid grid-cols-2 gap-4">
          {/* Ratio Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-[#303135]">Aspect Ratio</label>
            <TiketSelect
              value={ratio}
              onChange={(value) => setRatio(value)}
              options={RATIO_OPTIONS}
              placeholder="Select ratio"
              showSearch={false}
              disabled={isProcessing}
            />
          </div>

          {/* Resolution Dropdown */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-bold text-[#303135]">Resolution</label>
            <TiketSelect
              value={resolution}
              onChange={(value) => setResolution(value)}
              options={RESOLUTION_OPTIONS}
              placeholder="Select resolution"
              showSearch={false}
              disabled={isProcessing}
            />
          </div>
      </div>

      {/* Generate Button */}
      <TiketButton
        onClick={isGenerating ? handleCancelGeneration : handleGenerate}
        disabled={(!isGenerating && (!prompt.trim() || (ratio === 'match_input_image' && inputImages.length === 0))) || isCancelling}
        className="w-full"
        variant={isGenerating ? "alert" : "primary"}
        size="large"
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
        ) : (
          <div className="flex items-center gap-2">
             <Sparkles className="w-4 h-4" />
             Generate Image
          </div>
        )}
      </TiketButton>
      
      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
           <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
           <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </>
  );
}

interface EditFormProps {
  editInputImages: InputImage[];
  handleEditImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeEditInputImage: (id: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  isProcessing: boolean;
  isRemovingBg: boolean;
  handleRemoveBackground: () => void;
  editRatio: string;
  handleEditRatioChange: (v: string) => void;
  editPrompt: string;
  setEditPrompt: (v: string) => void;
  isGenerating: boolean;
  handleCancelGeneration: () => void;
  handleEditGenerate: () => void;
  isCancelling: boolean;
  error?: string | null;
  cameraAngle: number;
  handleCameraAngleChange: (v: number[]) => void;
  isRotationEnabled: boolean;
  setIsRotationEnabled: (v: boolean) => void;
}

const ImageGenerationEditForm = ({
  editInputImages, handleEditImageSelect, removeEditInputImage,
  handleDragOver, handleDragLeave, handleDrop, isDragOver, isProcessing,
  isRemovingBg, handleRemoveBackground,
  editRatio, handleEditRatioChange,
  editPrompt, setEditPrompt,
  isGenerating, handleCancelGeneration, handleEditGenerate, isCancelling, error,
  cameraAngle, handleCameraAngleChange,
  isRotationEnabled, setIsRotationEnabled
}: EditFormProps) => {
  return (
    <>
       {/* Source Image */}
       <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <label className="text-[14px] font-bold text-[#303135]">Source Image</label>
                <span className="text-[12px] text-gray-500">{editInputImages.length}/14</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
                {/* Empty State / Full Width Drop Zone */}
                {editInputImages.length === 0 ? (
                    <div 
                        className={`w-full min-h-[200px] p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${
                            isDragOver ? 'border-[#007BFF] bg-[#eff6ff]' : 'border-[#d8dce8] hover:bg-gray-50'
                        } ${isProcessing ? 'opacity-50 pointer-events-none cursor-not-allowed' : ''}`}
                        onClick={() => !isProcessing && document.getElementById('edit-source-upload')?.click()}
                        onDragOver={!isProcessing ? handleDragOver : undefined}
                        onDragLeave={!isProcessing ? handleDragLeave : undefined}
                        onDrop={!isProcessing ? handleDrop : undefined}
                    >
                        <div className="bg-[#E5F2FF] p-3 rounded-full mb-2">
                            <Upload className="w-6 h-6 text-[#007BFF]" />
                        </div>
                        <span className="text-[14px] text-[#007BFF] font-medium">Click to upload image</span>
                        <span className="text-[12px] text-[#71747d]">or drag and drop</span>
                        <span className="text-[12px] text-[#71747d] mt-1">JPG or PNG up to 10MB</span>
                    </div>
                ) : (
                    <>
                        {/* Existing Thumbnails */}
                        {editInputImages.map((img) => (
                            <div key={img.id} className={`relative w-[100px] h-[100px] group animate-in fade-in zoom-in-95 duration-200 ${isProcessing ? 'opacity-50' : ''}`}>
                                <img src={img.preview} alt="Source" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                                <button 
                                    onClick={() => !isProcessing && removeEditInputImage(img.id)}
                                    className={`absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-50 cursor-pointer ${isProcessing ? 'hidden' : ''}`}
                                >
                                    <XCircle className="w-4 h-4 text-red-500 fill-white" />
                                </button>
                            </div>
                        ))}

                        {/* Add Button (Small Square) */}
                        {editInputImages.length < 14 && (
                            <div 
                                className={`w-[100px] h-[100px] border-2 border-dashed border-[#d8dce8] rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors hover:border-blue-300 group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                onClick={() => !isProcessing && document.getElementById('edit-source-upload')?.click()}
                                title="Add more images"
                            >
                                <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        )}
                    </>
                )}

                <input 
                    type="file" 
                    id="edit-source-upload" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleEditImageSelect} 
                    disabled={isProcessing}
                />
            </div>
        </div>

        {/* Tool 1: Background Removal */}
         <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col gap-3 mt-2">
             <div className="flex items-center gap-2 text-[#303135] font-bold text-sm">
                 <Eraser className="w-4 h-4 text-[#007BFF]" />
                 Background Remover
             </div>
             <TiketButton 
                 variant="secondary" 
                 size="small" 
                 className="w-full bg-white border-gray-300 hover:bg-gray-100"
                 onClick={handleRemoveBackground}
                 disabled={isProcessing || editInputImages.length === 0}
             >
                 {isRemovingBg ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Layers className="w-3 h-3 mr-2" />}
                 Remove Background
             </TiketButton>
             {editInputImages.length > 1 && (
                 <p className="text-[10px] text-gray-500 italic text-center">
                     *Only the first image will be processed for background removal
                 </p>
             )}
         </div>

         {/* Tool 2: Composition */}
         <div className="flex flex-col gap-2">
             <div className="flex items-center gap-2 text-[#303135] font-bold text-sm">
                 <Crop className="w-4 h-4 text-[#007BFF]" />
                 Composition & Expand
             </div>
             <TiketSelect
                 value={editRatio}
                 onChange={handleEditRatioChange}
                 options={RATIO_OPTIONS}
                 placeholder="Target Aspect Ratio"
                 disabled={isProcessing}
             />
             
             {/* Camera Perspective Control */}
             <div className="p-3 bg-gray-50/50 rounded-lg border border-gray-100 flex flex-col gap-3">
                 <div className="flex justify-between items-center">
                     <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#303135]">
                         <Camera className="w-3.5 h-3.5 text-gray-500" />
                         Subject Rotation
                     </div>
                     <TiketSwitch 
                        checked={isRotationEnabled}
                        onCheckedChange={setIsRotationEnabled}
                        disabled={isProcessing}
                     />
                 </div>
                 
                 {isRotationEnabled && (
                    <div className="px-1 animate-in fade-in slide-in-from-top-2 duration-200">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-[11px] font-medium text-gray-600">Rotate Main Subject</span>
                            <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-gray-200 text-[#007BFF] max-w-[150px] truncate" title={getCameraPrompt(cameraAngle) || "Front View"}>
                                {cameraAngle === 0 ? "Front" : `${cameraAngle > 0 ? 'Right' : 'Left'} ${Math.abs(cameraAngle)}°`}
                            </span>
                         </div>
                         <Slider 
                             value={[cameraAngle]} 
                             min={-180} 
                             max={180} 
                             step={15} 
                             className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                             onValueChange={handleCameraAngleChange}
                             disabled={isProcessing}
                         />
                         <div className="flex justify-between mt-1 text-[9px] text-gray-400 font-medium">
                             <span>-180°</span>
                             <span>0°</span>
                             <span>+180��</span>
                         </div>
                         <p className="text-[10px] text-gray-500 mt-2 text-center italic border-t border-gray-100 pt-1">
                             "{getCameraPrompt(cameraAngle) || "Front view, straight-on camera angle."}"
                         </p>
                    </div>
                 )}
                 {!isRotationEnabled && (
                    <p className="text-[10px] text-gray-400 italic">
                        AI will attempt to rotate the subject. Background may remain static.
                    </p>
                 )}
             </div>
         </div>

         {/* Tool 3: Advanced Prompt */}
         <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-[#303135]">Advanced Edit Prompt</label>
              <TiketTextarea
                   value={editPrompt}
                   onChange={(e) => setEditPrompt(e.target.value)}
                   rows={4}
                   className="text-[14px]"
                   disabled={isProcessing}
                   placeholder={(isRotationEnabled || editRatio !== 'match_input_image') 
                       ? "Click Generate to apply settings, or type here to add more changes..."
                       : "Describe the changes you want to make..."}
              />
              
              {/* Active Settings Chips */}
              {(editRatio !== 'match_input_image' || isRotationEnabled) && (
                  <div className="flex flex-wrap gap-2 mt-1">
                      {editRatio !== 'match_input_image' && (
                          <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1 font-medium flex items-center gap-1">
                              📐 Resize: {editRatio}
                          </span>
                      )}
                      {isRotationEnabled && (
                          <span className="text-xs bg-blue-50 text-blue-700 rounded-full px-3 py-1 font-medium flex items-center gap-1">
                              🎥 Camera: {cameraAngle}°
                          </span>
                      )}
                  </div>
              )}
         </div>

         {/* Action */}
          <TiketButton
             onClick={isGenerating ? handleCancelGeneration : handleEditGenerate}
             disabled={(!isGenerating && ((!editPrompt.trim() && editRatio === 'match_input_image' && !isRotationEnabled) || editInputImages.length === 0)) || isCancelling}
             className="w-full"
             variant={isGenerating ? "alert" : "primary"}
             size="large"
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
             ) : (
               <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Edit
               </div>
             )}
           </TiketButton>

           {/* Error Message */}
           {error && (
             <div className="p-3 bg-red-50 rounded-lg border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
             </div>
           )}
    </>
  );
}

export function ImageGeneration({ session }: ImageGenerationProps) {
  const user = session?.user || null;

  // Form state
  const [prompt, setPrompt] = useState<string>('');
  const [ratio, setRatio] = useState<string>('1:1');
  const [resolution, setResolution] = useState<string>('2K');
  const [inputImages, setInputImages] = useState<InputImage[]>([]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelledRef = useRef(false);

  // Edit Tab State
  const [toolTab, setToolTab] = useState('generate');
  const [editInputImages, setEditInputImages] = useState<InputImage[]>([]);
  const [editPrompt, setEditPrompt] = useState<string>('');
  const [editRatio, setEditRatio] = useState<string>('match_input_image');
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [cameraAngle, setCameraAngle] = useState(0);
  const [isRotationEnabled, setIsRotationEnabled] = useState(false);

  // Check URL Params for Edit Mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        const sourceUrl = params.get('source_url');

        if (tab === 'edit') {
            setToolTab('edit');
            if (sourceUrl) {
                setEditInputImages([{
                    id: `url-source-${Date.now()}`,
                    file: new File([], 'source.png'),
                    preview: sourceUrl,
                    serverUrl: sourceUrl
                }]);
                setEditRatio('match_input_image');
            }
        }
    }
  }, []);

  // Auto-fill Edit Source
  useEffect(() => {
    if (generatedImage && editInputImages.length === 0) {
       // Convert string URL to InputImage structure
       setEditInputImages([{
           id: 'generated-result',
           file: new File([], 'generated.png'), // Dummy file
           preview: generatedImage,
           serverUrl: generatedImage
       }]);
    }
    // Removed logic that auto-copied prompt to editPrompt
    // if (prompt && !editPrompt) {
    //    setEditPrompt(prompt);
    // }
  }, [generatedImage, prompt]);

  const handleEditRatioChange = (newRatio: string) => {
      setEditRatio(newRatio);
  };

  const handleCameraAngleChange = (values: number[]) => {
      const newAngle = values[0];
      setCameraAngle(newAngle);
  };

  const handleUseAsInput = () => {
      if (generatedImage) {
          setEditInputImages([{
             id: `generated-${Date.now()}`,
             file: new File([], 'generated.png'), 
             preview: generatedImage,
             serverUrl: generatedImage
          }]);
          setEditPrompt(''); // Clear prompt instead of inheriting
          setToolTab('edit');
          setEditRatio('match_input_image');
          toast.custom((t) => (
             <TiketSnackbar id={t} message="Result set as input source" variant="default" />
          ));
      }
  };

  const handleRemoveBackgroundFromResult = async () => {
      if (!generatedImage) return;
      
      // Use existing bg removal logic but targeting the result
      setIsRemovingBg(true);
      setError(null);
      
      try {
          const res = await fetch(`${SERVER_URL}/utility/remove-background`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${await getAuthToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  image: generatedImage,
                  format: 'png',
                  background_type: 'rgba'
              })
          });

          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Background removal failed");
          }

          const data = await res.json();
          if (data.url) {
              setGeneratedImage(data.url);
              
              // Calculate dimensions
              const dims = await getImageDimensions(data.url);
              
              await saveResultToStorage(data.url, generatedImage, 'remove_background', {
                  ratio: dims.ratio,
                  resolution: dims.width ? `${dims.width}x${dims.height}` : 'Original',
                  prompt: 'Background Removal'
              });
              toast.custom((t) => (
                 <TiketSnackbar id={t} message="Background removed successfully" variant="default" />
              ));
          }
      } catch (e: any) {
          setError(e.message || "Failed to remove background");
          toast.custom((t) => (
             <TiketSnackbar id={t} message={e.message || "Failed to remove background"} variant="error" />
          ));
      } finally {
          setIsRemovingBg(false);
      }
  };

  const handleEditImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const availableSlots = 14 - editInputImages.length;
      const filesToAdd = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        toast.custom((t) => (
             <TiketSnackbar id={t} message={`Only ${availableSlots} more images allowed (Max 14)`} variant="warning" />
        ));
      }

      const newImages = filesToAdd.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));

      setEditInputImages(prev => [...prev, ...newImages]);
    }
    // Reset input
    e.target.value = '';
  };

  const removeEditInputImage = (id: string) => {
    setEditInputImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const handleRemoveBackground = async () => {
      if (editInputImages.length === 0) {
          setError('Please provide a source image');
          return;
      }

      setIsRemovingBg(true);
      setError(null);
      
      try {
          // Use the first image for BG removal as it is a single image operation usually
          let targetImage = editInputImages[0];
          let imageUrl = targetImage.serverUrl;
          
          // Upload if local file
          if (!imageUrl) {
              const { url } = await uploadInputImage(targetImage.file);
              imageUrl = url;
              // Update state with new URL
              setEditInputImages(prev => prev.map(img => img.id === targetImage.id ? { ...img, serverUrl: url } : img));
          }

          if (!imageUrl) throw new Error("Failed to get image URL");

          const res = await fetch(`${SERVER_URL}/utility/remove-background`, {
              method: 'POST',
              headers: {
                  'Authorization': `Bearer ${await getAuthToken()}`,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  image: imageUrl,
                  format: 'png',
                  background_type: 'rgba'
              })
          });

          if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || "Background removal failed");
          }

          const data = await res.json();
          if (data.url) {
              setGeneratedImage(data.url);
              // We don't save to history for background removal as per common utility behavior, 
              // or should we? The prompt "This action does NOT use the text prompt" suggests it's a utility.
              // I'll save it to storage so the user can download it properly, then history.
              
              const dims = await getImageDimensions(data.url);

              await saveResultToStorage(data.url, imageUrl, 'remove_background', {
                  ratio: dims.ratio,
                  resolution: dims.width ? `${dims.width}x${dims.height}` : 'Original',
                  prompt: 'Background Removal'
              });
          }

      } catch (e: any) {
          setError(e.message || "Failed to remove background");
          toast.custom((t) => (
             <TiketSnackbar id={t} message={e.message || "Failed to remove background"} variant="error" />
          ));
      } finally {
          setIsRemovingBg(false);
      }
  };

  const handleEditGenerate = async () => {
    const hasTechnicalModifiers = editRatio !== 'match_input_image' || isRotationEnabled;

    if (!editPrompt.trim() && !hasTechnicalModifiers) {
        setError('Please enter a prompt or configure edit settings');
        return;
    }
    if (editInputImages.length === 0) {
        setError('Please provide a source image');
        return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);
    isCancelledRef.current = false;

    try {
        // Upload all images if needed
        const currentInputImages = [...editInputImages];
        const uploadedImageUrls: string[] = [];
        const newPaths: string[] = [];

        const updatedInputImages = await Promise.all(currentInputImages.map(async (img) => {
            if (img.serverUrl) {
                return img;
            } else {
                const { url, path } = await uploadInputImage(img.file);
                newPaths.push(path);
                return { ...img, serverUrl: url, serverPath: path };
            }
        }));

        setEditInputImages(updatedInputImages);

         // Track paths for cleanup
        if (newPaths.length > 0) {
            uploadedTempPathsRef.current.push(...newPaths);
        }

        // Collect URLs
        updatedInputImages.forEach(img => {
            if (img.serverUrl) uploadedImageUrls.push(img.serverUrl);
        });

        if (uploadedImageUrls.length === 0) throw new Error("Failed to get image URLs");

        // Construct Final Prompt
        let finalPrompt = editPrompt.trim();
        
        // 1. Add Camera Prompt
        if (isRotationEnabled) {
            const cameraInstruction = getCameraPrompt(cameraAngle);
            if (cameraInstruction) {
                finalPrompt = `Cinematic camera angle change: ${cameraInstruction} ${finalPrompt}`;
            }
        }
        
        // 2. Add Resize Prompt (Prepend to ensure it's prioritized)
        if (editRatio !== 'match_input_image') {
            const resizeInstruction = `Expand image to ${editRatio}. Seamlessly extend background. Keep main subject centered.`;
            finalPrompt = `${resizeInstruction} ${finalPrompt}`;
        }
        
        finalPrompt = finalPrompt.trim();

        // Determine aspect ratio
        let finalAspectRatio = editRatio;
        if (editRatio === 'match_input_image' && editInputImages.length > 0) {
            try {
                const img = editInputImages[0];
                const url = img.preview || img.serverUrl;
                if (url) {
                    const dims = await getImageDimensions(url);
                    if (dims.ratio && dims.ratio !== 'Original') {
                        finalAspectRatio = dims.ratio;
                    } else {
                        finalAspectRatio = '1:1';
                    }
                }
            } catch (e) {
                console.error("Error calculating aspect ratio", e);
                finalAspectRatio = '1:1';
            }
        } else if (editRatio === 'match_input_image') {
             finalAspectRatio = '1:1';
        }

        // Use standard generation endpoint
        const startRes = await fetch(`${SERVER_URL}/start-generate-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${await getAuthToken()}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: finalPrompt,
              aspect_ratio: finalAspectRatio,
              resolution: resolution,
              modelId: 'nano-banana-pro',
              image_input: uploadedImageUrls
            })
        });

        // ... Reuse existing polling logic ...
        // To avoid code duplication, I should refactor polling. 
        // For now, I will duplicate for speed and safety as requested "Senior Architect".
        // Actually, I can just call handleGenerate logic if I update state? 
        // No, state is different.
        
        // (Duplicated Polling Logic for safety)
        let startData;
        try { const text = await startRes.text(); startData = text ? JSON.parse(text) : {}; } catch (e) { throw new Error(`Invalid JSON`); }
        
        if (!startRes.ok) throw new Error(startData.error || "Failed start");
        const predictionId = startData.predictionId;

        // Store prediction ID for cancellation
        setCurrentPredictionId(predictionId);

        const startTime = Date.now();
        let status = startData.status;
        let output = null;

        while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
            // Check if generation was cancelled
            if (isCancelledRef.current) {
                console.log('Generation was cancelled, stopping poll');
                return;
            }
            
            if (Date.now() - startTime > 300000) throw new Error('Timed out');
            await new Promise(r => setTimeout(r, 3000));
            const pollRes = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, { headers: { 'Authorization': `Bearer ${await getAuthToken()}` } });
            // Auth failures are permanent; retrying them would spin until timeout.
            if (pollRes.status === 401 || pollRes.status === 403) throw new Error('You do not have access to AI generation.');
            if (!pollRes.ok) continue;
            const pollData = await pollRes.json();
            status = pollData.status;
            output = pollData.output;
        }

        if (status === 'succeeded') {
            const url = Array.isArray(output) ? output[0] : output;
            setGeneratedImage(url);
            await saveResultToStorage(url, uploadedImageUrls[0], 'expand', {
                ratio: editRatio,
                resolution: resolution,
                prompt: finalPrompt
            });
        } else {
            throw new Error("Generation failed");
        }

    } catch (e: any) {
        setError(e.message);
        toast.custom((t) => (<TiketSnackbar id={t} message={e.message} variant="error" />));
    } finally {
        setIsGenerating(false);
        setCurrentPredictionId(null);
    }
  };

  // History State
  const [allHistory, setAllHistory] = useState<HistoryItem[]>([]); // Store all fetched items
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]); // Legacy state ref (keep for now to minimize breakage, but will override)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState('my_history');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0); // This will track filtered length
  const ITEMS_PER_PAGE = 12;
  const galleryRef = useRef<HTMLDivElement>(null);

  // Cleanup Ref
  const uploadedTempPathsRef = useRef<string[]>([]);

  // Filters
  const [historyFilterRatio, setHistoryFilterRatio] = useState('all');
  const [historyFilterResolution, setHistoryFilterResolution] = useState('all');
  const [historySort, setHistorySort] = useState('newest');

  // --- Derived State (Client-Side Filtering & Pagination) ---
  
  const processedHistory = useMemo(() => {
      let filtered = [...allHistory];

      // 1. Filter by Ratio
      if (historyFilterRatio !== 'all') {
          filtered = filtered.filter(item => item.ratio === historyFilterRatio);
      }

      // 2. Filter by Resolution
      if (historyFilterResolution !== 'all') {
          filtered = filtered.filter(item => item.resolution === historyFilterResolution);
      }

      // 3. Sort
      if (historySort === 'newest') {
          filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
          filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }

      return filtered;
  }, [allHistory, historyFilterRatio, historyFilterResolution, historySort]);

  // Update total items for pagination
  useEffect(() => {
      setTotalItems(processedHistory.length);
      // Reset to page 1 if current page is out of bounds
      if (currentPage > Math.ceil(processedHistory.length / ITEMS_PER_PAGE)) {
          setCurrentPage(1);
      }
  }, [processedHistory.length]);

  const displayedHistory = useMemo(() => {
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      return processedHistory.slice(start, end);
  }, [processedHistory, currentPage]);

  // Dynamic Filter Options
  const availableRatios = useMemo(() => {
      const ratios = new Set(allHistory.map(item => item.ratio).filter(Boolean));
      // Always include standard options if they exist in data OR if we want to force them? 
      // User said "sesuai data yang ada aja" (according to existing data only).
      // So we map the existing ratios to the label format if possible, or just use the value.
      
      const existingRatios = Array.from(ratios);
      const options = existingRatios.map(r => {
          const preset = RATIO_OPTIONS.find(opt => opt.id === r);
          return { id: r, label: preset ? preset.label : r };
      });
      return options;
  }, [allHistory]);

  const availableResolutions = useMemo(() => {
      const resolutions = new Set(allHistory.map(item => item.resolution).filter(Boolean));
      const existingResolutions = Array.from(resolutions);
      const options = existingResolutions.map(r => {
          const preset = RESOLUTION_OPTIONS.find(opt => opt.id === r);
          return { id: r, label: preset ? preset.label : r };
      });
      return options;
  }, [allHistory]);


  // Lightbox & Dialogs
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentImageMeta, setCurrentImageMeta] = useState<{ width: number; height: number; size: string | null } | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Default Model
  const selectedModel = 'nano-banana-pro';

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

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  useEffect(() => {
    if (isLightboxOpen && processedHistory[lightboxIndex]) {
        const url = processedHistory[lightboxIndex].image_url;
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
  }, [lightboxIndex, isLightboxOpen, processedHistory]);

  // Load History on Mount (Refresh only on user/tab change)
  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, historyTab]); // Removed filters from dependencies to avoid refetching

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (uploadedTempPathsRef.current.length > 0) {
        deleteFiles(uploadedTempPathsRef.current);
      }
    };
  }, []);

  const deleteFiles = async (paths: string[]) => {
    try {
      await fetch(`${SERVER_URL}/delete-files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paths })
      });
    } catch (e) {
      console.error("Failed to cleanup files", e);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const availableSlots = 14 - inputImages.length;
      const filesToAdd = files.slice(0, availableSlots);

      if (files.length > availableSlots) {
        toast.custom((t) => (
             <TiketSnackbar id={t} message={`Only ${availableSlots} more images allowed (Max 14)`} variant="warning" />
        ));
      }

      const newImages = filesToAdd.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));

      setInputImages(prev => [...prev, ...newImages]);
    }
    // Reset input
    e.target.value = '';
  };

  const removeInputImage = (id: string) => {
    setInputImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const uploadInputImage = async (file: File) => {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const path = `Assets/Tools/ImageGeneration/TempInput/${filename}`;
    
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
      return { url: data.url, path };
    } catch (e) {
      console.error("Failed to upload input image", e);
      throw e;
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (ratio === 'match_input_image' && inputImages.length === 0) {
      setError('Please upload at least one reference image to use "Match Input Image"');
      return;
    }

    if (!user) {
      setError('Please login to generate images');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setError(null);
    isCancelledRef.current = false;

    try {
      // 1. Upload Input Images if needed
      const currentInputImages = [...inputImages];
      const uploadedImageUrls: string[] = [];
      const newPaths: string[] = [];
      
      const updatedInputImages = await Promise.all(currentInputImages.map(async (img) => {
          if (img.serverUrl) {
              return img;
          } else {
              const { url, path } = await uploadInputImage(img.file);
              newPaths.push(path);
              return { ...img, serverUrl: url, serverPath: path };
          }
      }));

      // Update state with uploaded info
      setInputImages(updatedInputImages);

      // Track paths for cleanup
      if (newPaths.length > 0) {
          uploadedTempPathsRef.current.push(...newPaths);
      }

      // Collect URLs for payload
      updatedInputImages.forEach(img => {
          if (img.serverUrl) uploadedImageUrls.push(img.serverUrl);
      });

      console.log("Generating with payload:", {
          prompt,
          aspect_ratio: ratio,
          resolution,
          modelId: selectedModel,
          image_input: uploadedImageUrls
      });

      // 2. Start generation
      const startRes = await fetch(`${SERVER_URL}/start-generate-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: prompt,
          aspect_ratio: ratio,
          resolution: resolution, // This should be "2K" string
          modelId: selectedModel,
          image_input: uploadedImageUrls
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
        throw new Error('Server returned success but no prediction ID');
      }

      // Store prediction ID for cancellation
      setCurrentPredictionId(predictionId);

      // 3. Poll for completion
      const startTime = Date.now();
      const maxWaitTime = 5 * 60 * 1000; // 5 minutes
      let status = startData.status;
      let output = null;
      let errorMsg = null;

      while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
        // Check if generation was cancelled
        if (isCancelledRef.current) {
          console.log('Generation was cancelled, stopping poll');
          return;
        }

        if (Date.now() - startTime > maxWaitTime) {
          throw new Error('Generation is taking longer than expected. Please check your history later.');
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        const pollRes = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`,
          }
        });

        if (!pollRes.ok) {
          // Auth failures are permanent; retrying them would spin until timeout.
          if (pollRes.status === 401 || pollRes.status === 403) throw new Error('You do not have access to AI generation.');
          console.error('Polling failed, retrying...');
          continue;
        }

        const pollData = await pollRes.json();
        status = pollData.status;
        output = pollData.output;
        errorMsg = pollData.error;
      }

      if (status === 'succeeded') {
        let generatedUrl = '';
        if (Array.isArray(output) && output.length > 0) {
          generatedUrl = output[0];
        } else if (typeof output === 'string') {
          generatedUrl = output;
        }

        if (!generatedUrl) {
          throw new Error('Server returned success but no image URL');
        }

        setGeneratedImage(generatedUrl);
        await saveResultToStorage(generatedUrl, uploadedImageUrls[0] || undefined, 'generation', {
            ratio: ratio,
            resolution: resolution,
            prompt: prompt
        });

      } else if (status === 'canceled' && isCancelledRef.current) {
         // Silent exit for intentional cancellation
         return;
      } else {
        throw new Error(errorMsg || `Generation failed with status: ${status}`);
      }

    } catch (e: any) {
      const msg = e.message || 'An error occurred during generation.';
      setError(msg);
      toast.custom((t) => (
         <TiketSnackbar id={t} message={msg} variant="error" />
      ));
    } finally {
      setIsGenerating(false);
      setCurrentPredictionId(null);
    }
  };

  const saveResultToStorage = async (url: string, originalUrl?: string, taskType: string = 'generation', meta?: { ratio?: string, resolution?: string, prompt?: string }) => {
    if (!user) return;
    try {
        // Generate UUID
        const uuid = crypto.randomUUID();

        // 1. Fetch the image
        const imgRes = await fetch(url);
        const blob = await imgRes.blob();
        const file = new File([blob], `${uuid}.png`, { type: 'image/png' });

        // 2. Upload to Final Output
        const path = `Assets/Tools/ImageGeneration/Output/${uuid}.png`;
        
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
        const historyItem = {
            id: uuid,
            image_url: finalUrl,
            original_image_url: originalUrl, 
            prompt: meta?.prompt || prompt,
            ratio: meta?.ratio || ratio,
            resolution: meta?.resolution || resolution,
            created_by: user.id,
            user_name: getUserDisplayName(user),
            user_avatar: getUserAvatarUrl(user),
            task_type: taskType,
            created_at: new Date().toISOString()
        };

        await fetch(`${SERVER_URL}/generative-resize/history`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${await getAuthToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(historyItem)
        });

        fetchHistory(); 

    } catch (e) {
        console.error("Failed to save result", e);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
        // Fetch ALL history (limit 1000) for client-side filtering
        const queryParams = new URLSearchParams({
            limit: '1000', 
            sort: 'newest', // Default sort from server
            taskType: 'all' // Ensure we get all relevant tasks (generation, expand, remove_background)
        });

        if (historyTab === 'my_history' && user) {
            queryParams.append('userId', user.id);
        }
        
        // Note: We removed server-side filtering params (ratio, resolution) 
        // to support "dynamic filter options based on data"

        const res = await fetch(`${SERVER_URL}/generative-resize/history?${queryParams.toString()}`, {
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
        });

        if (!res.ok) throw new Error("Failed to fetch history");

        const result = await res.json();
        
        // Filter for relevant tasks
        const validTasks = ['generation', 'expand', 'remove_background', 'image_generation'];
        
        let rawItems: HistoryItem[] = [];

        if (Array.isArray(result)) {
             rawItems = result;
        } else {
             rawItems = result.data || [];
        }

        // Include items with valid task_type OR missing task_type (legacy)
        const validItems = rawItems.filter(i => {
            const type = i.task_type;
            return !type || validTasks.includes(type);
        });

        setAllHistory(validItems);
        // setHistoryItems(validItems); // Deprecated in favor of displayedHistory

    } catch (e) {
        console.error("Failed to fetch history", e);
    } finally {
        setIsLoadingHistory(false);
    }
  };

  const handleDeleteHistory = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
        // Delete from DB
        const res = await fetch(`${SERVER_URL}/generative-resize/history/${itemToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
        });

        if (!res.ok) throw new Error("Failed to delete");

        toast.custom((t) => (
             <TiketSnackbar id={t} message="Image deleted from history" variant="default" />
        ));
        
        setDeleteConfirmOpen(false);
        setIsLightboxOpen(false); // Close lightbox
        fetchHistory();
    } catch (e) {
        toast.custom((t) => (
             <TiketSnackbar id={t} message="Failed to delete image" variant="error" />
        ));
    } finally {
        setIsDeleting(false);
        setItemToDelete(null);
    }
  };

  const handleDownloadImage = async (url: string, filename: string) => {
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
    } catch (e) {
        console.error("Download failed", e);
        toast.custom((t) => (
             <TiketSnackbar id={t} message="Download failed" variant="error" />
        ));
        // Fallback
        window.open(url, '_blank');
    }
  };

  // Drag & Drop
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      
      const isEditTab = toolTab === 'edit';
      const currentImages = isEditTab ? editInputImages : inputImages;
      const setImages = isEditTab ? setEditInputImages : setInputImages;

      const availableSlots = 14 - currentImages.length;
      const filesToAdd = files.slice(0, availableSlots);
      
      if (filesToAdd.length === 0) return;

      if (files.length > availableSlots) {
         toast.custom((t) => (
             <TiketSnackbar id={t} message={`Only ${availableSlots} more images allowed`} variant="warning" />
        ));
      }

      const newImages = filesToAdd.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file)
      }));

      setImages(prev => [...prev, ...newImages]);
    }
  };

  const isProcessing = isGenerating || isRemovingBg;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1200px] mx-auto pb-[80px] pt-[0px] px-0">
      
      {/* Main Tool */}
      <div className="flex flex-col lg:flex-row gap-6 mx-[0px] my-[24px]">
        
        {/* Left Panel: Configuration */}
        <div className="w-full lg:w-[400px] flex flex-col gap-6 bg-white p-6 rounded-xl border border-[#e9ebef] shadow-sm h-fit">
          
          <TiketTabs 
                items={[
                    { id: 'generate', label: 'Create' },
                    { id: 'edit', label: 'Edit' }
                ]}
                activeId={toolTab}
                onChange={setToolTab}
                className="w-full"
                fullWidth={true}
                disabled={isProcessing}
           />
          
          {toolTab === 'generate' ? (
              <ImageGenerationCreateForm 
                  prompt={prompt}
                  setPrompt={setPrompt}
                  selectedModel={selectedModel}
                  inputImages={inputImages}
                  handleImageSelect={handleImageSelect}
                  removeInputImage={removeInputImage}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  isDragOver={isDragOver}
                  ratio={ratio}
                  setRatio={setRatio}
                  resolution={resolution}
                  setResolution={setResolution}
                  isGenerating={isGenerating}
                  isCancelling={isCancelling}
                  handleGenerate={handleGenerate}
                  handleCancelGeneration={handleCancelGeneration}
                  error={error}
                  isProcessing={isProcessing}
              />
          ) : (
              <ImageGenerationEditForm 
                  editInputImages={editInputImages}
                  handleEditImageSelect={handleEditImageSelect}
                  removeEditInputImage={removeEditInputImage}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  isDragOver={isDragOver}
                  isProcessing={isProcessing}
                  isRemovingBg={isRemovingBg}
                  handleRemoveBackground={handleRemoveBackground}
                  editRatio={editRatio}
                  handleEditRatioChange={handleEditRatioChange}
                  editPrompt={editPrompt}
                  setEditPrompt={setEditPrompt}
                  isGenerating={isGenerating}
                  handleCancelGeneration={handleCancelGeneration}
                  handleEditGenerate={handleEditGenerate}
                  isCancelling={isCancelling}
                  error={error}
                  cameraAngle={cameraAngle}
                  handleCameraAngleChange={handleCameraAngleChange}
                  isRotationEnabled={isRotationEnabled}
                  setIsRotationEnabled={setIsRotationEnabled}
              />
          )}
        </div>

        {/* Right Panel: Result */}
        <div className="flex-1 bg-white p-6 rounded-xl border border-[#e9ebef] shadow-sm flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#303135]">Result</h3>
                {generatedImage && !isGenerating && (
                    <div className="flex items-center gap-2">
                         <div className="flex items-center gap-2 mr-2 border-r border-gray-200 pr-2">
                             <TiketButton 
                                 variant="secondary" 
                                 size="small" 
                                 onClick={handleUseAsInput}
                                 className="h-8 text-xs gap-1.5 px-3"
                                 title="Use as source for further editing"
                             >
                                 <RefreshCcw className="w-3.5 h-3.5" />
                                 Edit This
                             </TiketButton>
                             <TiketButton 
                                 variant="secondary" 
                                 size="small" 
                                 onClick={handleRemoveBackgroundFromResult}
                                 className="h-8 text-xs gap-1.5 px-3"
                                 title="Remove background from this result"
                             >
                                 <Scissors className="w-3.5 h-3.5" />
                                 Remove BG
                             </TiketButton>
                         </div>
                         
                        <a 
                            href={generatedImage} 
                            download={`generated_image.jpg`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-[#007BFF] text-[14px] font-bold hover:underline ml-2"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </a>
                    </div>
                )}
             </div>

             <div className="flex-1 bg-[rgb(255,255,255)] rounded-lg border border-[#EFF1F6] flex items-center justify-center min-h-[400px] relative overflow-hidden">
                {isGenerating || isRemovingBg ? (
                     <div className="flex flex-col items-center justify-center gap-2">
                         <InstantLottie className="w-[240px] h-[240px]" />
                         <p className="text-[14px] text-[#71747d] -mt-6 font-medium animate-pulse min-w-[200px] text-center">
                            {isRemovingBg ? "Removing background..." : ["Dreaming up concepts...", "Mixing colors...", "Refining details...", "Polishing pixels..."][loadingTextIndex]}
                         </p>
                     </div>
                ) : generatedImage ? (
                    <div 
                        className="w-full h-full p-4 flex items-center justify-center cursor-pointer relative group"
                        onClick={() => {
                            setLightboxIndex(0);
                            setIsLightboxOpen(true);
                        }}
                    >
                         <img src={generatedImage} className="max-w-full max-h-full object-contain rounded-lg shadow-sm" alt="Generated" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                             <div className="bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-sm text-sm font-medium">
                                Click to Expand
                             </div>
                         </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/50 rounded-lg">
                        <div className="w-[140px] h-[140px] mb-4" style={{ '--fill-0': '#D8DCE8' } as React.CSSProperties}>
                            <TdsIcSparklingGeneral />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Your generated image will appear here</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure settings and click Generate Image to start</p>
                    </div>
                )}
             </div>
        </div>
      </div>

      {/* History Gallery */}
      <div ref={galleryRef} className="flex flex-col gap-6 pt-8 border-t border-[#d8dce8]">
         <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold text-[#303135]">History Gallery</h2>
         </div>

         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TiketTabs 
            items={[
              { id: 'my_history', label: 'My History' },
              { id: 'team_history', label: 'Team History' }
            ]}
            activeId={historyTab}
            onChange={setHistoryTab}
          />
             
             <div className="flex gap-3">
                 <div className="w-[140px]">
                     <TiketSelect 
                         value={historyFilterRatio}
                         onChange={setHistoryFilterRatio}
                         options={[{ id: 'all', label: 'Ratios' }, ...availableRatios]}
                         placeholder="Ratios"
                     />
                 </div>
                 <div className="w-[140px]">
                     <TiketSelect 
                         value={historyFilterResolution}
                         onChange={setHistoryFilterResolution}
                         options={[{ id: 'all', label: 'Resolutions' }, ...availableResolutions]}
                         placeholder="Resolutions"
                     />
                 </div>
                 <div className="w-[160px]">
                     <TiketSelect 
                         value={historySort}
                         onChange={setHistorySort}
                         options={[
                             { id: 'newest', label: 'Newest First' },
                             { id: 'oldest', label: 'Oldest First' }
                         ]}
                         placeholder="Sort By"
                     />
                 </div>
             </div>
         </div>

         {isLoadingHistory ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                 {[1,2,3,4,5,6].map(i => (
                     <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
                 ))}
             </div>
         ) : displayedHistory.length > 0 ? (
             <>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {displayedHistory.map((item, index) => {
                         // Calculate global index for lightbox
                         const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + index;
                         return (
                         <div key={item.id} 
                             className="group relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                             onClick={() => {
                                 setLightboxIndex(globalIndex);
                                 setIsLightboxOpen(true);
                             }}
                             style={{ aspectRatio: item.ratio === '16:9' ? '16/9' : item.ratio === '9:16' ? '9/16' : item.ratio === '3:2' ? '3/2' : item.ratio === '2:3' ? '2/3' : item.ratio === '4:3' ? '4/3' : '1/1' }}
                         >
                             <img src={item.image_url} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                             
                             {/* Overlay */}
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 pointer-events-none">
                                 {/* Top Left: Info */}
                                 <div className="text-white text-xs flex flex-col items-start gap-0.5">
                                     <p className="font-medium drop-shadow-md">{item.resolution}</p>
                                     <p className="text-white/90 text-[10px] drop-shadow-md">{item.ratio}</p>

                                 </div>

                                 {/* Bottom Right: Download */}
                                 <div className="flex justify-end">
                                     <button 
                                         onClick={(e) => {
                                             e.stopPropagation();
                                             handleDownloadImage(item.image_url, `generated-${item.id}.jpg`);
                                         }}
                                         className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors cursor-pointer pointer-events-auto"
                                         title="Download"
                                     >
                                         <Download className="w-4 h-4" />
                                     </button>
                                 </div>
                             </div>
                             

                         </div>
                     )})}
                 </div>
                 
                 {/* Pagination */}
                 {totalItems > ITEMS_PER_PAGE && (
                     <div className="flex justify-center mt-4">
                         <TiketPagination 
                             currentPage={currentPage}
                             totalPages={Math.ceil(totalItems / ITEMS_PER_PAGE)}
                             onPageChange={setCurrentPage}
                         />
                     </div>
                 )}
             </>
         ) : (
             <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                 <Search className="w-8 h-8 mb-3 opacity-20" />
                 <p>No history found</p>
             </div>
         )}
      </div>

      {/* Lightbox for viewing images */}
      {processedHistory.length > 0 && (
          <Lightbox
              isOpen={isLightboxOpen}
              onOpenChange={setIsLightboxOpen}
              currentIndex={lightboxIndex}
              totalSlides={processedHistory.length}
              hasNavigation={true}
              onNavigate={(dir) => {
                  if (dir === 'next') setLightboxIndex(prev => Math.min(prev + 1, processedHistory.length - 1));
                  if (dir === 'prev') setLightboxIndex(prev => Math.max(prev - 1, 0));
              }}
              panel={processedHistory[lightboxIndex] ? (
                <div className="flex flex-col h-full w-full">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-center relative">
                        <h3 className="text-lg font-bold text-gray-900">Asset Details</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
                        {/* Creator & Task Type Badge */}
                        <div className="flex items-center gap-3">
                             <UserAvatar 
                                 src={processedHistory[lightboxIndex].user_avatar}
                                 name={formatStoredName(processedHistory[lightboxIndex].user_name, 'User')}
                                 size={40}
                                 showTooltip={false}
                             />
                             <div>
                                <p className="text-sm font-medium text-gray-900">{formatStoredName(processedHistory[lightboxIndex].user_name, 'Unknown')}</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{timeAgo(processedHistory[lightboxIndex].created_at)}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                                        processedHistory[lightboxIndex].task_type === 'remove_background' 
                                            ? 'bg-purple-50 text-purple-600 border-purple-100' 
                                            : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                        {processedHistory[lightboxIndex].task_type === 'remove_background' ? 'Background Removal' : 'AI Generation'}
                                    </span>
                                </div>
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
                                <p className="text-sm font-medium text-gray-900">{processedHistory[lightboxIndex].ratio}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">File Size</p>
                                <div className="text-sm font-medium text-gray-900">
                                    {currentImageMeta?.size || <Skeleton className="h-5 w-24" />}
                                </div>
                            </div>
                        </div>

                        {/* Prompt (Hidden for Background Removal) */}
                        {processedHistory[lightboxIndex].task_type !== 'remove_background' && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Prompt</p>
                                     <button 
                                        onClick={async () => {
                                            const success = await copyToClipboard(processedHistory[lightboxIndex].prompt);
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
                                    {processedHistory[lightboxIndex].prompt}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Area */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col gap-2">
                         <button 
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm"
                            onClick={() => {
                                setIsLightboxOpen(false);
                                window.location.href = `/tools/image-generation?tab=edit&source_url=${encodeURIComponent(processedHistory[lightboxIndex].image_url)}`;
                            }}
                         >
                            <ArrowLeft className="w-4 h-4" />
                            Edit
                         </button>

                         <button 
                            className="w-full flex items-center justify-center gap-2 p-2.5 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm"
                            onClick={() => handleDownloadImage(processedHistory[lightboxIndex].image_url, `generated-${processedHistory[lightboxIndex].id}.jpg`)}
                         >
                            <Download className="w-4 h-4" />
                            Download Image
                        </button>
                        
                        {user && processedHistory[lightboxIndex].created_by === user.id && (
                            <button 
                                className="w-full flex items-center justify-center gap-2 p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm border border-red-100"
                                onClick={(e) => {
                                    e.stopPropagation(); 
                                    const item = processedHistory[lightboxIndex];
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
               <div className="flex items-center justify-center w-full h-full p-4">
                  <img 
                      key={lightboxIndex} 
                      src={processedHistory[lightboxIndex]?.image_url} 
                      alt="Full View" 
                      className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200" 
                  />
               </div>
          </Lightbox>
      )}

      {/* Delete Confirmation */}
      <DeleteConfirmDialog 
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          onConfirm={handleDeleteHistory}
          isLoading={isDeleting}
          title="Delete Image"
          description="Are you sure you want to delete this image? This action cannot be undone."
      />
    </div>
  );
}
