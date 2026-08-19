import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, Loader2 } from 'lucide-react';
import { Slider } from '../ui/slider';

export interface RatioOption {
  label: string;
  value: number;
}

interface CropAssetModalProps {
  imageSrc: string;
  fileName?: string;
  aspect?: number; // fixed aspect when ratioOptions is not provided (e.g. 1 for Product Icon)
  ratioOptions?: RatioOption[]; // when provided, user picks from these
  defaultRatio?: number;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

async function getCroppedFile(imageSrc: string, area: Area, fileName: string): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(
    image,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height
  );

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png', 0.95)
  );

  const safeName = fileName.replace(/\.[^.]+$/, '') + '-cropped.png';
  return new File([blob], safeName, { type: 'image/png' });
}

export function CropAssetModal({ imageSrc, fileName = 'asset', aspect, ratioOptions, defaultRatio, onCancel, onConfirm }: CropAssetModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState<number>(
    defaultRatio ?? ratioOptions?.[0]?.value ?? aspect ?? 1
  );

  const effectiveAspect = ratioOptions ? selectedRatio : aspect;

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    try {
      setIsProcessing(true);
      const file = await getCroppedFile(imageSrc, croppedArea, fileName);
      onConfirm(file);
    } catch (e) {
      console.error('Crop failed', e);
      alert('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-[12px] shadow-xl w-full max-w-[640px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f0f2f5]">
          <h3 className="text-[18px] font-bold text-[#303135]">Crop Asset</h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-[#f5f6fa] text-[#71747d]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative w-full h-[360px] bg-[#1a1d23]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={effectiveAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            objectFit="contain"
          />
        </div>

        {ratioOptions && ratioOptions.length > 0 && (
          <div className="px-6 py-3 flex items-center gap-3 border-t border-[#f0f2f5]">
            <span className="text-[12px] font-medium text-[#71747d]">Ratio</span>
            <div className="flex items-center gap-2">
              {ratioOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSelectedRatio(opt.value)}
                  className={`px-3 py-1 rounded-[6px] border text-[12px] font-medium transition-colors ${
                    selectedRatio === opt.value
                      ? 'bg-[#E3EFFB] text-[#007BFF] border-[#007BFF]'
                      : 'bg-white text-[#5e6066] border-[#d8dce8] hover:bg-[#f5f6fa]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-4 flex items-center gap-4 border-t border-[#f0f2f5]">
          <span className="text-[12px] font-medium text-[#71747d]">Zoom</span>
          <Slider
            value={[zoom]}
            min={1}
            max={4}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1 [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
          />
          <span className="text-[12px] font-bold text-[#007BFF] w-12 text-right">{zoom.toFixed(2)}x</span>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3 border-t border-[#f0f2f5] bg-[#f8f9fd]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isProcessing}
            className="px-5 py-2 rounded-[8px] bg-[#e7f2ff] text-[#007BFF] font-bold text-[14px] hover:bg-[#d0e4ff] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!croppedArea || isProcessing}
            className="px-5 py-2 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors disabled:bg-[#d8dce8] disabled:text-[#aeb2be] flex items-center gap-2"
          >
            {isProcessing && <Loader2 size={14} className="animate-spin" />}
            Apply Crop
          </button>
        </div>
      </div>
    </div>
  );
}
