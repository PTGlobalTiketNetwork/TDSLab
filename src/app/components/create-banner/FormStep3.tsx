import { BannerFormData, PartnerLogoSlot } from './types';
import { svgPaths } from './assets/Icons';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { DropdownSelect } from './components/DropdownSelect';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Plus, Trash2, Upload, Image as ImageIcon, ZoomIn, Maximize2, Palette, Sparkles, Wand2, RotateCw, RefreshCw, FlipHorizontal2, FlipVertical2 } from 'lucide-react';
import { Lightbox } from '../Lightbox';
import React, { useEffect, useState } from 'react';
import { AssetService } from '../../../services/assetService';
import { Asset } from '../../types/asset';
import { ImageInputSelector } from '../inputs/ImageInputSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ColorPicker } from './ColorPicker';
import { AIGenerator } from '../inputs/AIGenerator';
import { GradientEditor } from './components/GradientEditor';
import { StyledInput } from './components/FormElements';
import { HistorySelector } from './components/HistorySelector';
import { useAccess } from '../../../context/AccessContext';

interface FormStep3Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
}

export function FormStep3({ formData, onChange }: FormStep3Props) {
  const { isWhitelisted } = useAccess();
  const [assets, setAssets] = useState<Asset[]>([]);
  
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const data = await AssetService.listAssets();
        setAssets(data);
      } catch (error) {
        console.error('Failed to fetch assets', error);
      }
    };
    fetchAssets();
  }, []);

  const getAssetOptions = (category: string) => {
    const isBrandEntity = category === 'Brand' || category === 'Brand & Entity';
    const targetCategory = category === 'Other' ? 'Others' : isBrandEntity ? 'Entity Logo' : category;
    return assets
      .filter(a => a.category === targetCategory || (isBrandEntity && a.category === 'brand-entity-logo'))
      .map(a => ({ id: a.imageUrl, label: a.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  const isPromoBanner = formData.bannerCategory === 'Promo Banner';
  const isProductEntryPoint = formData.bannerCategory === 'Product Entry Point';
  const isWhatsAppRatio = formData.bannerRatio === 'Mobile (2:1 WhatsApp)';
  const isSquare = formData.bannerRatio === 'Square (1:1)';
  
  const activeBackgroundTab = formData.backgroundType || 'image';

  const getLogoOptions = () => {
      const type = formData.logoType || 'Campaign';
      let filteredAssets: Asset[] = [];
      
      if (type === 'Campaign') {
          filteredAssets = assets.filter(a => a.category === 'Campaign');
      } else if (type === 'Brand') {
          // Check both 'Entity Logo' and 'brand-entity-logo' to cover legacy/slug variations
          filteredAssets = assets.filter(a => a.category === 'Entity Logo' || a.category === 'brand-entity-logo'); 
      } else if (type === 'Partner') {
          filteredAssets = assets.filter(a => ['Payment', 'Airlines', 'Hotel'].includes(a.category));
      }
      
      return filteredAssets
          .map(a => ({ id: a.imageUrl, label: a.name }))
          .sort((a, b) => a.label.localeCompare(b.label));
  };

  // Determine effective tab
  // For Product Entry Point: Force color/gradient, default to color
  // For non-whitelisted users: fall back from 'generate'/'history' to 'image'
  const effectiveTab = isProductEntryPoint
      ? (activeBackgroundTab === 'color' || activeBackgroundTab === 'gradient' ? activeBackgroundTab : 'color')
      : (!isSquare && (activeBackgroundTab === 'color' || activeBackgroundTab === 'gradient'))
          ? 'image'
          : (!isWhitelisted && (activeBackgroundTab === 'generate' || activeBackgroundTab === 'history'))
              ? 'image'
              : activeBackgroundTab;

  const previewUrl = React.useMemo(() => {
    if (formData.keyVisualFile instanceof Blob) {
        try {
            return URL.createObjectURL(formData.keyVisualFile);
        } catch (e) {
            console.error("Failed to create object URL in Step 3", e);
            return null;
        }
    }
    return formData.keyVisualUrl || null;
  }, [formData.keyVisualFile, formData.keyVisualUrl]);

  // Clean up object URL
  React.useEffect(() => {
    return () => {
        if (formData.keyVisualFile instanceof Blob && previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    };
  }, [formData.keyVisualFile, previewUrl]);

  // Partner Logo Handlers
  const handlePartnerLogoToggle = (checked: boolean) => {
    if (checked && formData.partnerLogos.length === 0) {
      // Add initial slot if turning on and empty
      onChange({ 
        showPartnerLogo: true,
        partnerLogos: [{ id: Math.random().toString(36).substr(2, 9), type: 'Payment', logo: '' }] 
      });
    } else {
      onChange({ showPartnerLogo: checked });
    }
  };

  const addPartnerSlot = () => {
    if (formData.partnerLogos.length >= 3) return;
    const newSlot: PartnerLogoSlot = { id: Math.random().toString(36).substr(2, 9), type: 'Payment', logo: '' };
    onChange({ partnerLogos: [...formData.partnerLogos, newSlot] });
  };

  const removePartnerSlot = (id: string) => {
    const newSlots = formData.partnerLogos.filter(slot => slot.id !== id);
    onChange({ partnerLogos: newSlots });
    if (newSlots.length === 0) {
        onChange({ showPartnerLogo: false });
    }
  };

  const updatePartnerSlot = (id: string, field: keyof PartnerLogoSlot, value: any) => {
    const newSlots = formData.partnerLogos.map(slot => {
      if (slot.id === id) {
        // If type changes, clear the selected logo because options change
        const updates = { [field]: value };
        if (field === 'type') {
            updates.logo = '';
        }
        return { ...slot, ...updates };
      }
      return slot;
    });
    onChange({ partnerLogos: newSlots });
  };
  
  const handleTabChange = (val: string) => {
      const updates: Partial<BannerFormData> = { backgroundType: val as any };
      
      // If switching to gradient, set gradient overlay to 0% as requested
      if (val === 'gradient') {
          updates.gradientOpacity = 0;
          if (!formData.backgroundGradientStops || formData.backgroundGradientStops.length === 0) {
            updates.backgroundGradientStops = [
                { id: '1', color: '#5BAAFF', position: 0, opacity: 100 },
                { id: '2', color: '#007BFF', position: 100, opacity: 100 }
            ];
          }
      } else if (val === 'image') {
          // Optional: Reset to default if switching back to image? 
          // User didn't specify, but usually image needs overlay.
          // Let's leave it as is to not override user preference if they set it manually.
          if (formData.gradientOpacity === 0) {
             updates.gradientOpacity = 100; 
          }
      }
      
      onChange(updates);
  };

  return (
    <div className="flex flex-col gap-[40px] pb-[24px]">

      {/* Visual Illustration (Product Entry Point Only) */}
      {isProductEntryPoint && (
          <div className="flex flex-col gap-[16px] w-full">
               <label className="text-[16px] font-bold leading-[22px] text-[#303135]">
                  Visual Illustration
               </label>
               <div className="p-0">
                    {previewUrl ? (
                         <>
                         <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden border border-[#d8dce8] bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat group">
                            <img 
                                src={previewUrl} 
                                alt="Visual" 
                                className="w-full h-full object-contain"
                            />
                            <button 
                                type="button"
                                onClick={() => onChange({ keyVisualFile: null, keyVisualUrl: undefined })}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                         </div>
                         
                         {/* Scale Control for Visual Illustration */}
                         <div className="flex flex-col gap-[16px] mt-2">
                             {/* Scale */}
                            <div className="flex flex-col gap-[8px]">
                                <div className="flex items-center justify-between">
                                    <label className="text-[14px] font-medium text-[#303135]">Image Scale</label>
                                    <span className="text-[14px] font-bold text-[#007BFF]">{formData.keyVisualScale || 100}%</span>
                                </div>
                                <Slider
                                    value={[formData.keyVisualScale || 100]}
                                    min={10}
                                    max={200}
                                    step={1}
                                    className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                    onValueChange={(val) => onChange({ keyVisualScale: val[0] })}
                                />
                            </div>

                            {/* Flip */}
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-medium text-[#303135]">Flip</label>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChange({ keyVisualFlipH: !formData.keyVisualFlipH })}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipH ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                        title="Flip Horizontal"
                                    >
                                        <FlipHorizontal2 className="w-3.5 h-3.5" />
                                        Horizontal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ keyVisualFlipV: !formData.keyVisualFlipV })}
                                        className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipV ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                        title="Flip Vertical"
                                    >
                                        <FlipVertical2 className="w-3.5 h-3.5" />
                                        Vertical
                                    </button>
                                </div>
                            </div>

                            {/* Rotation */}
                            <div className="flex flex-col gap-[8px]">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <label className="text-[14px] font-medium text-[#303135]">Rotation</label>
                                        <RotateCw className="w-3.5 h-3.5 text-[#71747d]" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <StyledInput 
                                            type="number" 
                                            className="w-[60px] h-[28px] text-[12px] text-right pr-1 py-0 border-[#d8dce8] focus:border-[#007BFF]"
                                            value={formData.keyVisualRotation || 0}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                // Clamp between -180 and 180
                                                const clamped = Math.min(180, Math.max(-180, val));
                                                onChange({ keyVisualRotation: clamped });
                                            }}
                                            min={-180}
                                            max={180}
                                        />
                                        <span className="text-[12px] font-medium text-[#71747d]">deg</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] text-[#71747d] font-medium w-8 text-right">-180°</span>
                                    <Slider 
                                        value={[formData.keyVisualRotation || 0]} 
                                        min={-180}
                                        max={180} 
                                        step={1} 
                                        className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                        onValueChange={(val) => onChange({ keyVisualRotation: val[0] })}
                                    />
                                    <span className="text-[10px] text-[#71747d] font-medium w-8">180°</span>
                                </div>
                            </div>
                        </div>
                        </>
                    ) : (
                         <ImageInputSelector 
                            onAssetSelected={(file, url) => {
                                if (file) onChange({ keyVisualFile: file });
                                else if (url) onChange({ keyVisualUrl: url, keyVisualFile: null });
                            }}
                            accept="image/png, image/jpeg, image/webp"
                         />
                    )}
               </div>
          </div>
      )}
      
      {/* 1. Background Settings */}
      <div className="flex flex-col gap-[16px] w-full">
        <label className="text-[16px] font-bold leading-[22px] text-[#303135]">
           Background Settings
        </label>
        
        <Tabs 
            value={effectiveTab} 
            onValueChange={handleTabChange}
            className="w-full"
        >
            <TabsList className="w-full justify-start border-b border-[#e9ebef] bg-transparent p-0 mb-4 h-auto rounded-none">
                {(isSquare || isProductEntryPoint) && (
                    <>
                        <TabsTrigger 
                            value="color" 
                            className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                        >
                            <Palette size={16} />
                            Color
                        </TabsTrigger>
                        <TabsTrigger 
                            value="gradient"
                            className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                        >
                            <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-blue-400 to-purple-500" />
                            Gradient
                        </TabsTrigger>
                    </>
                )}
                {!isProductEntryPoint && (
                <>
                <TabsTrigger 
                    value="image"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <Upload size={16} />
                    Upload
                </TabsTrigger>
                {isWhitelisted && <TabsTrigger 
                    value="generate"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <Wand2 size={16} />
                    Generate
                </TabsTrigger>}
                {isWhitelisted && <TabsTrigger 
                    value="history"
                    className="gap-2 px-[16px] py-[12px] rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] font-bold data-[state=active]:bg-transparent shadow-none transition-colors hover:text-[#303135]"
                >
                    <ImageIcon size={16} />
                    Gallery
                </TabsTrigger>}
                </>
                )}
            </TabsList>

            {(isSquare || isProductEntryPoint) && (
                <>
                    <TabsContent value="color" className="mt-0 flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Solid Color</Label>
                            <div className="flex items-center gap-4 bg-[#F8F9FD] p-4 rounded-lg border border-[#d8dce8]">
                                <ColorPicker 
                                    value={formData.backgroundColor || '#007BFF'} 
                                    onChange={(color) => onChange({ backgroundColor: color })} 
                                />
                                <span className="text-sm text-[#71747d] font-medium uppercase">
                                    {formData.backgroundColor || '#007BFF'}
                                </span>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="gradient" className="mt-0 flex flex-col gap-4">
                        <GradientEditor
                            stops={formData.backgroundGradientStops || [
                                { id: '1', color: '#5BAAFF', position: 0, opacity: 100 },
                                { id: '2', color: '#007BFF', position: 100, opacity: 100 }
                            ]}
                            onChange={(stops) => onChange({ backgroundGradientStops: stops })}
                            type={formData.backgroundGradientType || 'linear'}
                            onTypeChange={(type) => onChange({ backgroundGradientType: type })}
                            angle={formData.backgroundGradientAngle ?? 135}
                            onAngleChange={(angle) => onChange({ backgroundGradientAngle: angle })}
                        />
                    </TabsContent>
                </>
            )}

            <TabsContent value="image" className="mt-0">
                {previewUrl ? (
                    <div className="flex flex-col gap-[12px]">
                        <div className="relative w-full h-[200px] rounded-[12px] overflow-hidden border border-[#d8dce8] group bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat">
                            <Lightbox
                                trigger={
                                    <button type="button" className="w-full h-full relative cursor-zoom-in border-none p-0 bg-transparent focus:outline-none">
                                        <img 
                                            src={previewUrl} 
                                            alt="Preview" 
                                            className="w-full h-full object-contain"
                                        />
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
                                        src={previewUrl} 
                                        alt="Full Preview" 
                                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl bg-[url('https://make-div-r2.s3.amazonaws.com/assets/transparent-bg.png')] bg-repeat"
                                        draggable={false}
                                    />
                                </div>
                            </Lightbox>

                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange({ keyVisualFile: null, keyVisualUrl: undefined });
                                }}
                                className="absolute top-4 right-4 bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-red-600 z-10"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Scale Control */}
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-medium text-[#303135]">Image Scale</label>
                                <span className="text-[14px] font-bold text-[#007BFF]">{formData.keyVisualScale || 100}%</span>
                            </div>
                            <Slider
                                value={[formData.keyVisualScale || 100]}
                                min={10}
                                max={200}
                                step={1}
                                className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                onValueChange={(val) => onChange({ keyVisualScale: val[0] })}
                            />
                            <p className="text-[12px] text-[#71747d] mt-[4px]">
                                💡 Tip: You can drag the image in the preview to adjust its position.
                            </p>
                        </div>

                        {/* Flip */}
                        <div className="flex items-center justify-between">
                            <label className="text-[14px] font-medium text-[#303135]">Flip</label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onChange({ keyVisualFlipH: !formData.keyVisualFlipH })}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipH ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                    title="Flip Horizontal"
                                >
                                    <FlipHorizontal2 className="w-3.5 h-3.5" />
                                    Horizontal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChange({ keyVisualFlipV: !formData.keyVisualFlipV })}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-[6px] border text-[12px] transition-colors ${formData.keyVisualFlipV ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]' : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'}`}
                                    title="Flip Vertical"
                                >
                                    <FlipVertical2 className="w-3.5 h-3.5" />
                                    Vertical
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <ImageInputSelector 
                        onAssetSelected={(file, url) => {
                            if (file) {
                                onChange({ keyVisualFile: file });
                            } else if (url) {
                                onChange({ keyVisualUrl: url, keyVisualFile: null });
                            }
                        }}
                        accept="image/png, image/jpeg, image/jpg"
                        hideAITab={true}
                        hideHistoryTab={true}
                    />
                )}
            </TabsContent>

            {isWhitelisted && <TabsContent value="generate" className="mt-0">
                <div className="p-[24px] bg-[#F8F9FD] rounded-lg border border-[#d8dce8]">
                     <AIGenerator 
                        onAssetSelected={(file, url) => {
                            if (file) {
                                onChange({ 
                                    keyVisualFile: file, 
                                    backgroundType: 'image'
                                });
                            } else if (url) {
                                onChange({ 
                                    keyVisualUrl: url, 
                                    keyVisualFile: null,
                                    backgroundType: 'image'
                                });
                            }
                        }}
                     />
                </div>
            </TabsContent>}

            {isWhitelisted && <TabsContent value="history" className="mt-0">
                <div className="p-[24px] bg-[#F8F9FD] rounded-lg border border-[#d8dce8]">
                    <HistorySelector 
                        onSelect={(url) => {
                            onChange({ 
                                keyVisualUrl: url, 
                                keyVisualFile: null,
                                backgroundType: 'image'
                            });
                        }}
                    />
                </div>
            </TabsContent>}
        </Tabs>
      </div>

      {/* 2. Gradient Overlay Slider */}
      {isPromoBanner && (
          <div className="flex flex-col gap-[16px] w-full">
             <div className="flex items-center justify-between">
                <label className="text-[16px] font-bold text-[#303135]">Gradient Overlay</label>
                <span className="text-[14px] font-bold text-[#007BFF]">{formData.gradientOpacity ?? 100}%</span>
             </div>
             <p className="text-[14px] text-[#71747d] -mt-[12px]">Adjust opacity of the gradient to ensure text readability.</p>
             
             <Slider 
                defaultValue={[formData.gradientOpacity ?? 100]} 
                value={[formData.gradientOpacity ?? 100]}
                max={100} 
                step={5} 
                className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                onValueChange={(val) => onChange({ gradientOpacity: val[0] })}
             />

             {/* Overlay Color & Stop */}
             <div className="flex items-center gap-4 mt-2">
                <div className="flex flex-col gap-2 flex-1">
                     <label className="text-[14px] font-medium text-[#303135]">Color</label>
                     <div className="flex items-center gap-2 bg-[#F8F9FD] p-2 rounded-lg border border-[#d8dce8]">
                         <ColorPicker 
                             value={formData.overlayColor || '#000000'} 
                             onChange={(color) => onChange({ overlayColor: color })} 
                         />
                         <span className="text-sm text-[#71747d] font-medium uppercase truncate">
                             {formData.overlayColor || '#000000'}
                         </span>
                     </div>
                </div>
                <div className="flex flex-col gap-2 flex-1">
                     <div className="flex items-center justify-between">
                        <label className="text-[14px] font-medium text-[#303135]">Stop Position</label>
                        <span className="text-[12px] font-bold text-[#007BFF]">{formData.overlayGradientStop ?? 10}%</span>
                     </div>
                     <Slider 
                        value={[formData.overlayGradientStop ?? 10]} 
                        max={100} 
                        step={5} 
                        className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                        onValueChange={(val) => onChange({ overlayGradientStop: val[0] })}
                     />
                </div>
             </div>
          </div>
      )}

      {/* 3. Logos Section */}
      <div className="flex flex-col gap-[24px] w-full pt-[8px] border-t border-[#d8dce8]">
        
        {/* Product Icon (Square Only) */}
        {isSquare && (
            <div className="flex flex-col gap-[12px]">
                <div className="flex items-center justify-between">
                    <Label className="text-[16px] font-bold text-[#303135]">Product Icon</Label>
                </div>
                <DropdownSelect
                    options={getAssetOptions('Product Icon')}
                    value={formData.productIcon || ''}
                    onChange={(val) => onChange({ productIcon: val })}
                    placeholder="Select Product Icon"
                />
            </div>
        )}

        {/* Campaign Logo */}
        {!isProductEntryPoint && (
        <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
                <Label htmlFor="show-campaign-logo" className="text-[16px] font-bold text-[#303135]">Campaign logo (optional)</Label>
                <Switch 
                    id="show-campaign-logo" 
                    checked={formData.showCampaignLogo}
                    onCheckedChange={(checked) => onChange({ showCampaignLogo: checked })}
                    className="data-[state=checked]:bg-[#007BFF]"
                />
            </div>
            {formData.showCampaignLogo && (
                <div className="flex flex-col gap-[12px]">
                    <DropdownSelect
                        options={getAssetOptions('Campaign')}
                        value={formData.campaignLogo || ''}
                        onChange={(val) => onChange({ campaignLogo: val })}
                        placeholder="Select Campaign logo"
                    />
                    <div className="flex flex-col gap-[12px]">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-[#303135]">Transform</span>
                            <button
                                type="button"
                                onClick={() => onChange({ campaignLogoScale: 1, campaignLogoX: 16, campaignLogoY: 16 })}
                                className="flex items-center gap-[4px] text-[12px] font-medium text-[#71747d] hover:text-[#303135] transition-colors"
                            >
                                <RotateCw size={12} />
                                Reset
                            </button>
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-[#71747d]">Scale</span>
                                <span className="text-[13px] font-medium text-[#303135]">{Math.round((formData.campaignLogoScale ?? 1) * 100)}%</span>
                            </div>
                            <Slider
                                min={50}
                                max={500}
                                step={5}
                                value={[(formData.campaignLogoScale ?? 1) * 100]}
                                onValueChange={([val]) => onChange({ campaignLogoScale: val / 100 })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-[#71747d]">Position X</span>
                                <span className="text-[13px] font-medium text-[#303135]">{formData.campaignLogoX ?? 16}px</span>
                            </div>
                            <Slider
                                min={-100}
                                max={400}
                                step={1}
                                value={[formData.campaignLogoX ?? 16]}
                                onValueChange={([val]) => onChange({ campaignLogoX: val })}
                                className="w-full"
                            />
                        </div>
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[13px] font-medium text-[#71747d]">Position Y</span>
                                <div className="flex items-center gap-[8px]">
                                    <span className="text-[13px] font-medium text-[#303135]">{formData.campaignLogoY ?? 16}px</span>
                                    <button
                                        type="button"
                                        onClick={() => onChange({ campaignLogoY: formData.partnerLogoY ?? 20 })}
                                        className="text-[#71747d] hover:text-[#007BFF] transition-colors"
                                        title="Sync with Partner logo Position Y"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </div>
                            <Slider
                                min={-100}
                                max={400}
                                step={1}
                                value={[formData.campaignLogoY ?? 16]}
                                onValueChange={([val]) => onChange({ campaignLogoY: val })}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
        )}

        {/* Partner Logo */}
        {!isSquare && !isProductEntryPoint && (
        <div className="flex flex-col gap-[12px]">
            <div className="flex items-center justify-between">
                <Label htmlFor="show-partner-logo" className="text-[16px] font-bold text-[#303135]">Partner logo (optional)</Label>
                <Switch 
                    id="show-partner-logo" 
                    checked={formData.showPartnerLogo}
                    onCheckedChange={handlePartnerLogoToggle}
                    className="data-[state=checked]:bg-[#007BFF]"
                />
            </div>
            
            {formData.showPartnerLogo && (
                <div className="flex flex-col gap-[20px] pl-[4px]">
                    {formData.partnerLogos.map((slot, index) => (
                        <div key={slot.id} className="flex flex-col gap-[12px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[14px] text-[#303135]">Slot {index + 1}</span>
                                {formData.partnerLogos.length > 1 && (
                                    <button 
                                        type="button"
                                        onClick={() => removePartnerSlot(slot.id)}
                                        className="text-[#71747d] hover:text-[#d4183d]"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Type Selection */}
                            <RadioGroup 
                                value={slot.type} 
                                onValueChange={(val) => updatePartnerSlot(slot.id, 'type', val)}
                                className="flex gap-[24px]"
                            >
                                {(['Payment', 'Airlines', 'Hotel', 'Brand & Entity', 'Partner', 'Product Icon', 'Other'] as const).map(type => {
                                    const isBrandEntity = type === 'Brand & Entity';
                                    const targetCategory = type === 'Other' ? 'Others' : isBrandEntity ? 'Entity Logo' : type;
                                    const hasData = assets.some(a => a.category === targetCategory || (isBrandEntity && a.category === 'brand-entity-logo'));
                                    
                                    if (!hasData) return null;

                                    return (
                                        <div key={type} className="flex items-center space-x-2">
                                            <RadioGroupItem 
                                                value={type} 
                                                id={`p-${type.toLowerCase()}-${slot.id}`} 
                                                className="text-[#007BFF] border-[#007BFF] [&_svg]:fill-[#007BFF]"
                                            />
                                            <Label htmlFor={`p-${type.toLowerCase()}-${slot.id}`} className="font-normal text-[#303135]">{type}</Label>
                                        </div>
                                    );
                                })}
                            </RadioGroup>

                            {/* Logo Dropdown */}
                            <DropdownSelect
                                options={getAssetOptions(slot.type)}
                                value={slot.logo || ''}
                                onChange={(val) => updatePartnerSlot(slot.id, 'logo', val)}
                                placeholder="Select logo"
                            />
                        </div>
                    ))}

                    {formData.partnerLogos.length < 3 && (
                    <button
                        type="button"
                        onClick={addPartnerSlot}
                        className="flex items-center justify-center gap-[6px] text-[#007BFF] font-bold text-[14px] mt-[8px] hover:underline"
                    >
                        <div className="bg-[#007BFF] rounded-full p-[2px]">
                            <Plus className="w-[12px] h-[12px] text-white" />
                        </div>
                        Add slot
                    </button>
                    )}

                    <div className="flex flex-col gap-[8px] pt-[4px] border-t border-[#e9ebef]">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-medium text-[#71747d]">Scale</span>
                            <div className="flex items-center gap-[8px]">
                                <span className="text-[13px] font-medium text-[#303135]">{Math.round((formData.partnerLogoScale ?? 1) * 100)}%</span>
                                <button
                                    type="button"
                                    onClick={() => onChange({ partnerLogoScale: 1 })}
                                    className="text-[#71747d] hover:text-[#303135] transition-colors"
                                    title="Reset scale"
                                >
                                    <RotateCw size={12} />
                                </button>
                            </div>
                        </div>
                        <Slider
                            min={50}
                            max={300}
                            step={5}
                            value={[(formData.partnerLogoScale ?? 1) * 100]}
                            onValueChange={([val]) => onChange({ partnerLogoScale: val / 100 })}
                            className="w-full"
                        />
                        <div className="flex items-center justify-between mt-[8px]">
                            <span className="text-[13px] font-medium text-[#71747d]">Position Y</span>
                            <div className="flex items-center gap-[8px]">
                                <span className="text-[13px] font-medium text-[#303135]">{formData.partnerLogoY ?? 20}px</span>
                                <button
                                    type="button"
                                    onClick={() => onChange({ partnerLogoY: formData.campaignLogoY ?? 16 })}
                                    className="text-[#71747d] hover:text-[#007BFF] transition-colors"
                                    title="Sync with Campaign logo Position Y"
                                >
                                    <RefreshCw size={12} />
                                </button>
                            </div>
                        </div>
                        <Slider
                            min={-100}
                            max={400}
                            step={1}
                            value={[formData.partnerLogoY ?? 20]}
                            onValueChange={([val]) => onChange({ partnerLogoY: val })}
                            className="w-full"
                        />
                    </div>
                </div>
            )}
        </div>
        )}

       {/* WhatsApp Variant Specific - Logo Logic */}
       {isProductEntryPoint && isWhatsAppRatio && (
           <div className="flex flex-col gap-[12px] pt-[8px] border-t border-[#d8dce8]">
                <div className="flex items-center justify-between">
                    <Label htmlFor="show-logo" className="text-[16px] font-bold text-[#303135]">Show Logo</Label>
                    <Switch 
                        id="show-logo" 
                        checked={formData.showLogo}
                        onCheckedChange={(checked) => onChange({ showLogo: checked })}
                        className="data-[state=checked]:bg-[#007BFF]"
                    />
                </div>
                
                {formData.showLogo && (
                    <div className="flex flex-col gap-[12px]">
                        {/* Logo Type & Selection Row */}
                        <div className="flex gap-[12px]">
                            {/* Logo Type */}
                            <div className="flex flex-col gap-[8px] flex-1">
                                <label className="text-[14px] font-medium text-[#303135]">Logo Type</label>
                                <DropdownSelect
                                    options={[
                                        { id: 'Campaign', label: 'Campaign Logo' },
                                        { id: 'Partner', label: 'Partner Logo' },
                                        { id: 'Brand', label: 'Entity Logo' }
                                    ]}
                                    value={formData.logoType || 'Campaign'}
                                    onChange={(val) => {
                                        onChange({ logoType: val as any, selectedLogoUrl: '' });
                                    }}
                                    placeholder="Select Type"
                                    disableSearch={true}
                                />
                            </div>

                            {/* Select Logo */}
                            <div className="flex flex-col gap-[8px] flex-1">
                                <label className="text-[14px] font-medium text-[#303135]">Select Logo</label>
                                <DropdownSelect
                                    options={getLogoOptions()}
                                    value={formData.selectedLogoUrl || ''}
                                    onChange={(val) => onChange({ selectedLogoUrl: val })}
                                    placeholder="Select Logo"
                                />
                            </div>
                        </div>

                        {/* Logo Scale */}
                        <div className="flex flex-col gap-[8px]">
                            <div className="flex items-center justify-between">
                                <label className="text-[14px] font-medium text-[#303135]">Logo Scale</label>
                                <span className="text-[14px] font-bold text-[#007BFF]">{formData.logoScale ?? 60}%</span>
                            </div>
                            <Slider 
                                value={[formData.logoScale ?? 60]} 
                                min={50}
                                max={150} 
                                step={1} 
                                className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                                onValueChange={(val) => onChange({ logoScale: val[0] })}
                            />
                        </div>
                    </div>
                )}
           </div>
       )}

      </div>

    </div>
  );
}