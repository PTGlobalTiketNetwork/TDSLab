import { useState, useRef, useEffect } from 'react';
import { Upload, Plus, Sparkles, Loader2, X, Maximize2, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';
import { BannerService } from '../../../services/bannerService';
import { Lightbox } from '../Lightbox';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { DotLottiePlayer } from '@dotlottie/react-player';
import { projectId } from '../../../../utils/supabase/info';
import { getAuthToken } from '../../../utils/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { AI_MODELS, DEFAULT_MODEL_ID } from '../../../config/ai-models';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;

interface ReferenceImage {
  id: string;
  url: string;
  path: string;
}

interface AIGeneratorProps {
  onAssetSelected: (file: File | null, url?: string) => void;
}

export function AIGenerator({ onAssetSelected }: AIGeneratorProps) {
  // AI Mode State
  const [activeModelId, setActiveModelId] = useState(DEFAULT_MODEL_ID);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('2K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPredictionId, setCurrentPredictionId] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem('active_model_id');
    if (saved && AI_MODELS[saved]) {
      setActiveModelId(saved);
    }
  }, []);

  const currentModel = AI_MODELS[activeModelId] || AI_MODELS[DEFAULT_MODEL_ID];

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Dirty State Detection - Track last generated parameters
  const [lastGeneratedPrompt, setLastGeneratedPrompt] = useState('');
  const [lastGeneratedAspectRatio, setLastGeneratedAspectRatio] = useState('');
  const [lastGeneratedRefCount, setLastGeneratedRefCount] = useState(0);

  // Reference Images State
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const refInputRef = useRef<HTMLInputElement>(null);

  // Track references for cleanup on unmount
  const referenceImagesRef = useRef<ReferenceImage[]>([]);

  // Calculate if current state differs from last generation
  const isDirty = 
    prompt.trim() !== lastGeneratedPrompt ||
    aspectRatio !== lastGeneratedAspectRatio ||
    referenceImages.length !== lastGeneratedRefCount;

  useEffect(() => {
    referenceImagesRef.current = referenceImages;
  }, [referenceImages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const paths = referenceImagesRef.current.map(img => img.path);
      if (paths.length > 0) {
        console.log('Cleaning up temporary reference images on unmount...', paths);
        BannerService.deleteFiles(paths).catch(err => console.error('Unmount cleanup failed', err));
      }
    };
  }, []);

  // -- Reference Image Handlers --
  const handleReferenceSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    // Filter for valid types (Safety Net: Only allow PNG and JPG/JPEG)
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const files: File[] = [];
    let hasInvalidFiles = false;

    for (let i = 0; i < rawFiles.length; i++) {
        if (validTypes.includes(rawFiles[i].type)) {
            files.push(rawFiles[i]);
        } else {
            hasInvalidFiles = true;
        }
    }

    if (hasInvalidFiles) {
        toast.custom((t) => <TiketSnackbar id={t} message="Some files were skipped. Only PNG and JPG/JPEG formats are supported for reference images." variant="error" />);
    }

    if (files.length === 0) return;

    if (referenceImages.length + files.length > 14) {
      toast.custom((t) => <TiketSnackbar id={t} message="Maximum 14 reference images allowed" variant="error" />);
      return;
    }

    setIsUploadingRef(true);
    const newRefs: ReferenceImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        
        const uniqueId = crypto.randomUUID();
        const ext = file.name.split('.').pop();
        const path = `Assets/AI_References/${uniqueId}.${ext}`;

        // Upload via Service (Server Proxy) to bypass RLS
        const { url } = await BannerService.uploadImage(file, path);

        newRefs.push({
          id: uniqueId,
          url: url,
          path: path
        });
      }

      setReferenceImages(prev => [...prev, ...newRefs]);
    } catch (error) {
      console.error('Error uploading reference:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to upload reference image" variant="error" />);
    } finally {
      setIsUploadingRef(false);
      if (refInputRef.current) refInputRef.current.value = '';
    }
  };

  const removeReference = async (id: string, path: string) => {
    try {
      // Remove from UI immediately
      setReferenceImages(prev => prev.filter(img => img.id !== id));
      
      // Remove from Storage via Service
      await BannerService.deleteFiles([path]);
    } catch (error) {
      console.error('Error removing reference:', error);
    }
  };

  // -- AI Generation --
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
      toast.custom((t) => <TiketSnackbar id={t} message="Please enter a prompt" variant="error" />);
      return;
    }

    setIsGenerating(true);
    setImageError(false);
    setGeneratedImageUrl(null);
    isCancelledRef.current = false;
    setCurrentPredictionId(null);

    try {
      const options = {
        prompt,
        aspect_ratio: aspectRatio,
        resolution: currentModel.features.resolution ? resolution : undefined,
        image_input: referenceImages.length > 0 ? referenceImages.map(r => r.url) : undefined,
        modelId: activeModelId
      };

      // 1. Start generation
      const startRes = await fetch(`${SERVER_URL}/start-generate-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!startRes.ok) {
        const err = await startRes.json();
        throw new Error(err.error || 'Failed to start image generation');
      }

      const { predictionId } = await startRes.json();
      setCurrentPredictionId(predictionId);

      // 2. Poll for results
      const maxAttempts = 300; // 600s
      const pollInterval = 2000;
      
      let status = 'starting';
      let output = null;
      let errorMsg = null;

      const startTime = Date.now();
      const maxWaitTime = 10 * 60 * 1000; // 10 min

      while (status !== 'succeeded' && status !== 'failed' && status !== 'canceled') {
         if (isCancelledRef.current) {
             console.log('Generation cancelled by user');
             return;
         }

         if (Date.now() - startTime > maxWaitTime) {
             throw new Error('Generation timed out');
         }

         await new Promise(resolve => setTimeout(resolve, pollInterval));

         const pollRes = await fetch(`${SERVER_URL}/check-prediction/${predictionId}`, {
             headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
         });

         // Auth failures are permanent; retrying them would spin until timeout.
         if (pollRes.status === 401 || pollRes.status === 403) throw new Error('You do not have access to AI generation.');
         if (!pollRes.ok) continue;

         const data = await pollRes.json();
         status = data.status;
         output = data.output;
         errorMsg = data.error;
      }

      if (status === 'succeeded') {
          let finalUrl = "";
          if (Array.isArray(output) && output.length > 0) {
              finalUrl = output[0];
          } else if (typeof output === "string") {
              finalUrl = output;
          }
          
          if (!finalUrl) throw new Error('No output URL found');
          
          setGeneratedImageUrl(finalUrl);

          // Update dirty state tracking
          setLastGeneratedPrompt(prompt);
          setLastGeneratedAspectRatio(aspectRatio);
          setLastGeneratedRefCount(referenceImages.length);

      } else if (status === 'canceled' && isCancelledRef.current) {
          // Silent exit
          return;
      } else {
          throw new Error(errorMsg || `Generation ${status}`);
      }

    } catch (error: any) {
      console.error('Generation failed:', error);
      toast.custom((t) => <TiketSnackbar id={t} message={error.message || "Failed to generate image"} variant="error" />);
    } finally {
      setIsGenerating(false);
      setCurrentPredictionId(null);
    }
  };

  const handleUseImage = async () => {
    if (!generatedImageUrl) return;

    try {
      setIsProcessing(true);
      
      // 1. Fetch the image as a Blob
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      
      // 2. Create Local File Object (Deferred Upload)
      const uuid = crypto.randomUUID();
      // Prefix with 'ai_generated_' to trigger correct folder logic in parent
      const fileName = `ai_generated_${uuid}.png`;
      const file = new File([blob], fileName, { type: "image/png" });
      
      // 3. Create Local Preview URL
      const localUrl = URL.createObjectURL(file);

      // 4. Pass to parent (File + Local URL)
      onAssetSelected(file, localUrl);

      // 5. Cleanup References (Immediate Cleanup upon selection)
      const paths = referenceImages.map(img => img.path);
      if (paths.length > 0) {
        console.log('Finalizing: Cleaning up reference images...', paths);
        await BannerService.deleteFiles(paths);
        setReferenceImages([]); // Clear state
        referenceImagesRef.current = []; // Clear ref
      }

    } catch (error) {
      console.error('Failed to process generated image:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to process generated image." variant="error" />);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {/* Prompt Section */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-[#303135]">
                Prompt
            </label>
            <Textarea
                placeholder="Describe your image..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                className="min-h-[80px] resize-none focus-visible:ring-[#007BFF] bg-white border-[#d8dce8] disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>

        {/* Generation Settings */}
        <div className="space-y-4 border-t border-[#eff1f6] pt-4">
            <h3 className="text-sm font-semibold text-[#303135] flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#007BFF]" />
                Generation Settings
            </h3>

            {/* Reference Images */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-[#71747d] flex justify-between">
                    <span>Reference Images (Optional)</span>
                    <span className="text-[#a1a4ac]">{referenceImages.length} / 14</span>
                </label>
                
                {referenceImages.length === 0 ? (
                    <div 
                        onClick={() => !isGenerating && refInputRef.current?.click()}
                        className={`w-full h-[60px] rounded-md border border-dashed border-[#d8dce8] bg-[#f8f9fd] flex items-center justify-center gap-2 transition-all text-[#71747d] ${
                            isGenerating 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-[#eff1f6] hover:border-[#007BFF] hover:text-[#007BFF] cursor-pointer'
                        }`}
                    >
                        {isUploadingRef ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                <span className="text-xs font-medium">Drop up to 14 images (PNG, JPG)</span>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-2">
                        {referenceImages.map((img) => (
                            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden border border-[#eff1f6] group bg-slate-50">
                                <img src={img.url} alt="Reference" className={`w-full h-full object-cover ${isGenerating ? 'opacity-70' : ''}`} />
                                {!isGenerating && (
                                    <button 
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeReference(img.id, img.path);
                                        }}
                                        className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {referenceImages.length < 14 && (
                            <div 
                                onClick={() => !isGenerating && refInputRef.current?.click()}
                                className={`aspect-square rounded-md border border-dashed border-[#d8dce8] bg-[#f8f9fd] flex flex-col items-center justify-center transition-all text-[#71747d] ${
                                    isGenerating
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-[#eff1f6] hover:border-[#007BFF] hover:text-[#007BFF] cursor-pointer'
                                }`}
                            >
                                {isUploadingRef ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                <input 
                    type="file" 
                    multiple 
                    accept="image/png, image/jpeg, image/jpg" 
                    className="hidden" 
                    ref={refInputRef}
                    onChange={handleReferenceSelect}
                />
            </div>

                <div className={`grid gap-4 ${currentModel.features.resolution ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-[#71747d]">Aspect Ratio</label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isGenerating}>
                            <SelectTrigger className="h-9 text-xs bg-white border-[#d8dce8]">
                                <SelectValue placeholder="Select ratio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                                <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
                                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                                <SelectItem value="2:3">2:3</SelectItem>
                                <SelectItem value="3:2">3:2</SelectItem>
                                <SelectItem value="3:4">3:4</SelectItem>
                                <SelectItem value="4:3">4:3</SelectItem>
                                <SelectItem value="4:5">4:5</SelectItem>
                                <SelectItem value="5:4">5:4</SelectItem>
                                <SelectItem value="match_input_image">Match Input</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {currentModel.features.resolution && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-[#71747d]">Resolution</label>
                            <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                                <SelectTrigger className="h-9 text-xs bg-white border-[#d8dce8]">
                                    <SelectValue placeholder="Select resolution" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1K">1K</SelectItem>
                                    <SelectItem value="2K">2K (Default)</SelectItem>
                                    <SelectItem value="4K">4K</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
            {isGenerating ? (
                <Button 
                    type="button"
                    onClick={handleCancelGeneration}
                    disabled={isCancelling}
                    className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto relative"
                >
                    {isCancelling ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Cancelling...
                        </>
                    ) : (
                        <>
                            <Ban className="w-4 h-4 mr-2" />
                            Cancel Generation
                        </>
                    )}
                </Button>
            ) : (
                <Button 
                    type="button"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isUploadingRef}
                    className={`bg-[#007BFF] hover:bg-[#0064D2] text-white w-full sm:w-auto relative ${
                    isDirty && generatedImageUrl ? 'ring-2 ring-[#007BFF] ring-offset-2' : ''
                    }`}
                >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Image
                    {isDirty && generatedImageUrl && (
                    <span className="ml-2 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-semibold animate-pulse">
                        Changed
                    </span>
                    )}
                </Button>
            )}
        </div>

        {/* Result Area */}
        {(generatedImageUrl || isGenerating) && (
            <div className="mt-2 border-t border-[#eff1f6] pt-4 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-[#71747d] mb-2 block">
                    Result
                </label>
                
                <div className="relative w-full aspect-[2/1] bg-[#f8f9fd] rounded-lg border border-[#eff1f6] overflow-hidden flex items-center justify-center group bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-white/80 backdrop-blur-sm pb-8">
                        <div className="w-[240px] h-[240px]">
                            <DotLottiePlayer
                                src={`https://${projectId}.supabase.co/storage/v1/object/public/Lottie/tman_checkout.lottie`}
                                loop
                                autoplay
                                className="w-full h-full"
                            />
                        </div>
                        <span className="text-sm text-[#71747d] font-medium mt-[-16px] relative z-10">Dreaming up your image...</span>
                        </div>
                    ) : generatedImageUrl ? (
                        <>
                        {imageError ? (
                            <div className="flex flex-col items-center justify-center p-4 text-center bg-white/80 backdrop-blur-sm rounded-lg">
                                <p className="text-red-500 font-medium mb-2">Failed to load image</p>
                                <p className="text-xs text-gray-500 break-all">{generatedImageUrl}</p>
                            </div>
                        ) : (
                            <Lightbox
                            trigger={
                                <button type="button" className="w-full h-full relative cursor-zoom-in border-none p-0 bg-transparent focus:outline-none">
                                    <img 
                                        src={generatedImageUrl} 
                                        alt="Generated" 
                                        className={`w-full h-full object-contain transition-opacity duration-300 ${
                                            isDirty ? 'opacity-50' : 'opacity-100'
                                        }`}
                                        onError={() => setImageError(true)}
                                    />
                                    {isDirty && (
                                        <div className="absolute top-3 left-3 bg-amber-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-md font-medium shadow-lg flex items-center gap-1.5">
                                        <Sparkles className="w-3 h-3" />
                                        Settings changed - Generate again
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[2px]">
                                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            <Maximize2 className="w-6 h-6" />
                                        </div>
                                    </div>
                                </button>
                            }
                            >
                                <div className="relative w-full h-full flex items-center justify-center pointer-events-auto p-4">
                                    <img 
                                        src={generatedImageUrl} 
                                        alt="Full Preview" 
                                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat"
                                        draggable={false}
                                    />
                                </div>
                            </Lightbox>
                        )}
                        
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                                type="button"
                                onClick={handleUseImage}
                                disabled={isProcessing}
                                className="bg-[#007BFF] hover:bg-[#0064D2] text-white shadow-lg"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Use Image
                                    </>
                                )}
                            </Button>
                        </div>
                        </>
                    ) : null}
                </div>
            </div>
        )}
    </div>
  );
}