import { useState, useEffect } from 'react';
import { Check, Shield, Zap, Sparkles, Wrench } from 'lucide-react';
import { AI_MODELS, DEFAULT_MODEL_ID, DEFAULT_TEXT_MODEL_ID, AIModel } from '../../config/ai-models';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';

export function SettingsPage({ isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
  const [activeImageModelId, setActiveImageModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [activeTextModelId, setActiveTextModelId] = useState<string>(DEFAULT_TEXT_MODEL_ID);
  const [activeUtilityModelId, setActiveUtilityModelId] = useState<string>('background-remover');

  useEffect(() => {
    // Load Image Model (with fallback to legacy key)
    let savedImage = localStorage.getItem('active_image_model');
    if (!savedImage) {
        savedImage = localStorage.getItem('active_model_id');
    }
    if (savedImage && AI_MODELS[savedImage]) {
      setActiveImageModelId(savedImage);
    }

    // Load Text Model
    const savedText = localStorage.getItem('active_text_model');
    if (savedText && AI_MODELS[savedText]) {
      setActiveTextModelId(savedText);
    }

    // Load Utility Model
    const savedUtility = localStorage.getItem('active_utility_model');
    if (savedUtility && AI_MODELS[savedUtility]) {
      setActiveUtilityModelId(savedUtility);
    }
  }, []);

  const handleActivateImage = (id: string) => {
    setActiveImageModelId(id);
    localStorage.setItem('active_image_model', id);
    // Also update legacy key for compatibility
    localStorage.setItem('active_model_id', id);
    toast.custom((toastId) => (
      <TiketSnackbar id={toastId} message={`Active image model changed to ${AI_MODELS[id].name}`} />
    ));
  };

  const handleActivateText = (id: string) => {
    setActiveTextModelId(id);
    localStorage.setItem('active_text_model', id);
    toast.custom((toastId) => (
      <TiketSnackbar id={toastId} message={`Active text model changed to ${AI_MODELS[id].name}`} />
    ));
  };

  const handleActivateUtility = (id: string) => {
    setActiveUtilityModelId(id);
    localStorage.setItem('active_utility_model', id);
    toast.custom((toastId) => (
      <TiketSnackbar id={toastId} message={`Active utility model changed to ${AI_MODELS[id].name}`} />
    ));
  };

  const imageModels = Object.values(AI_MODELS).filter(m => m.type === 'image');
  const textModels = Object.values(AI_MODELS).filter(m => m.type === 'text');
  const utilityModels = Object.values(AI_MODELS).filter(m => m.type === 'utility');

  const renderModelCard = (model: AIModel, isActive: boolean, onActivate: (id: string) => void) => (
    <Card key={model.id} className={`transition-all ${isActive ? 'border-[#007BFF] ring-1 ring-[#007BFF]' : 'hover:border-[#d8dce8]'}`}>
        <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                        {model.name}
                        {isActive && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                Active
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                        {model.description}
                    </CardDescription>
                </div>
                <div className="text-xl font-normal text-[#303135] text-[18px]">
                    {model.cost}
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-[#71747d]">
                {model.type === 'image' ? (
                    <>
                        <div className={`flex items-center gap-2 ${model.features.resolution ? 'text-slate-700 font-medium' : 'text-slate-400 decoration-slate-300'}`}>
                            <Zap className="w-4 h-4" />
                            <span>Resolution Control</span>
                        </div>
                        <div className={`flex items-center gap-2 ${model.features.safety_filter ? 'text-slate-700 font-medium' : 'text-slate-400 decoration-slate-300'}`}>
                            <Shield className="w-4 h-4" />
                            <span>Safety Filter</span>
                        </div>
                    </>
                ) : model.type === 'text' ? (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Sparkles className="w-4 h-4" />
                        <span>Advanced Reasoning</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Wrench className="w-4 h-4" />
                        <span>Utility Tool</span>
                    </div>
                )}
            </div>
            <Button 
                onClick={() => onActivate(model.id)}
                disabled={isActive}
                variant={isActive ? "secondary" : "default"}
                className={isActive ? "bg-green-50 text-green-700 border border-green-200" : "bg-[#007BFF] hover:bg-[#0064D2]"}
            >
                {isActive ? (
                    <>
                        <Check className="w-4 h-4 mr-2" />
                        Active Model
                    </>
                ) : (
                    "Activate"
                )}
            </Button>
        </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fd] p-8 transition-all duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#303135]">AI Model Settings</h1>
          <p className="text-[#71747d] mt-2">Manage the AI models used for image and text generation.</p>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#303135]">Image Generation Models</h2>
            <div className="grid gap-6">
                {imageModels.map((model) => renderModelCard(model, activeImageModelId === model.id, handleActivateImage))}
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#303135]">Text Generation Models</h2>
            <div className="grid gap-6">
                {textModels.map((model) => renderModelCard(model, activeTextModelId === model.id, handleActivateText))}
            </div>
        </div>

        <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#303135]">Utility Models</h2>
            <div className="grid gap-6">
                {utilityModels.map((model) => renderModelCard(model, activeUtilityModelId === model.id, handleActivateUtility))}
            </div>
        </div>

      </div>
    </div>
  );
}
