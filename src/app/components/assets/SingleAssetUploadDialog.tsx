import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { Loader2, Image as ImageIcon, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../ui/dialog';
import { AssetService } from '../../../services/assetService';
import { supabase } from '../../../utils/supabase/client';
import { Asset } from '../../types/asset';
import { getUserDisplayName } from '../../utils/userDisplay';
import { getAssetConstraints, normalizeCategoryName } from '../../utils/assetConstraints';

const FONT = { fontFamily: "'Tiket Odyssey Text', sans-serif" };

/** Loose name key: case-insensitive, ignores whitespace and punctuation ("Air Asia" == "AIRASIA"). */
export const assetNameKey = (name: string) => name.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

interface SingleAssetUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Asset category as stored (e.g. 'Campaign', 'Payment', 'Entity Logo', 'Others'). */
  category: string;
  /** Existing assets in this category, used for duplicate-name validation. */
  existingAssets: Asset[];
  initialName?: string;
  onUploaded: (asset: Asset) => void;
}

const formatBytes = (bytes: number) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/** Single-file version of the Add Asset page, shown as a modal. */
export function SingleAssetUploadDialog({ open, onOpenChange, category: rawCategory, existingAssets, initialName = '', onUploaded }: SingleAssetUploadDialogProps) {
  const category = normalizeCategoryName(rawCategory);
  const constraints = getAssetConstraints(category);

  const [assetName, setAssetName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState({ size: 'Auto', dimension: 'Auto', ratio: 'Auto' });
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  // Upload progress shown under the file: creeps toward 90% while the request runs (storage upload gives no byte progress), jumps on each finished step, green at 100%, red on failure
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setAssetName(initialName);
    setNameError(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileMetadata({ size: 'Auto', dimension: 'Auto', ratio: 'Auto' });
    setDimensionError(null);
    setIsUploading(false);
    setProgress(0);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [open, initialName]);

  const checkName = useCallback((name: string) => {
    const key = assetNameKey(name.trim());
    const exists = !!key && existingAssets.some(a => assetNameKey(a.name) === key);
    setNameError(exists ? 'Asset already exists' : null);
    return !exists;
  }, [existingAssets]);

  // Debounced validation on change
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => checkName(assetName), 300);
    return () => clearTimeout(t);
  }, [assetName, open, checkName]);

  const validateAndSetFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) { alert('Only .png and .jpg files are supported.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('File size must be less than 2MB.'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const d = gcd(w, h);
      const ratio = `${w / d}:${h / d}`;
      setFileMetadata({ size: formatBytes(file.size), dimension: `${w} x ${h}px`, ratio });
      if (constraints) {
        const ar = w / h;
        if (w < constraints.minWidth || h < constraints.minHeight) {
          setDimensionError(`Image is ${w} × ${h}px — minimum size is ${constraints.minWidth} × ${constraints.minHeight}px.`);
        } else if (ar < constraints.minRatio || ar > constraints.maxRatio) {
          setDimensionError(`Image ratio is ${ratio} — allowed ratio is ${constraints.ratioLabel}.`);
        } else {
          setDimensionError(null);
        }
      }
    };
    img.src = url;
    setSelectedFile(file);
    setPreviewUrl(url);
    setAssetName(prev => prev || file.name.split('.').slice(0, -1).join('.'));
  }, [constraints]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleUpload = async () => {
    const name = assetName.trim();
    if (!name || !selectedFile || !checkName(name)) return;
    setIsUploading(true);
    setUploadStatus('uploading');
    setProgress(5);
    const tick = setInterval(() => setProgress((p) => (p < 90 ? p + Math.max(1, Math.round((90 - p) / 10)) : p)), 200);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const uploaderName = getUserDisplayName(session.user, 'Unknown');
      const publicUrl = await AssetService.uploadAssetFile(selectedFile, category);
      setProgress((p) => Math.max(p, 75));
      const created = await AssetService.createAsset({
        name, category, image_url: publicUrl, created_by: session.user.id,
        ratio: fileMetadata.ratio, dimension: fileMetadata.dimension,
        file_size: fileMetadata.size, uploader_name: uploaderName,
      });
      clearInterval(tick);
      setProgress(100);
      setUploadStatus('done');
      await new Promise((res) => setTimeout(res, 600)); // let the user see the bar complete
      onUploaded(created);
    } catch {
      clearInterval(tick);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadDisabled = !selectedFile || !assetName.trim() || isUploading || uploadStatus === 'done' || !!dimensionError || !!nameError;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isUploading) onOpenChange(o); }}>
      <DialogContent className="max-w-[600px] p-[24px]" style={FONT}>
        <div className="flex flex-col items-start gap-[8px] pr-[24px]">
          <DialogTitle className="text-[20px] leading-[28px]">Upload new logo</DialogTitle>
          <DialogDescription asChild style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>
            <span className="inline-flex items-center rounded-[6px] bg-[#e7f2ff] px-[8px] py-[2px] text-[12px] leading-[16px] text-[#007BFF]">{category}</span>
          </DialogDescription>
        </div>

        <div className="mt-[8px]" style={FONT}>
          <label className="block text-[14px] font-medium text-[#71747d] mb-2">Asset name</label>
          <input
            type="text"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            onBlur={() => checkName(assetName)}
            placeholder="Enter asset name"
            style={FONT}
            className={`w-full px-3 py-2.5 rounded-[8px] border text-[14px] text-[#303135] focus:outline-none transition-colors placeholder:text-[#aeb2be] ${
              nameError ? 'border-[#d4183d] focus:border-[#d4183d]' : 'border-[#d8dce8] focus:border-[#007BFF]'
            }`}
          />
          {nameError && <p className="mt-1 text-[12px] text-[#d4183d]">{nameError}</p>}
        </div>

        <div className="mt-[16px]" style={FONT}>
          <label className="block text-[14px] font-bold text-[#303135] mb-1">Upload asset</label>
          <p className="text-[12px] text-[#71747d] mb-3">You can upload 1 file. Supported file format: .png or .jpg.</p>

          {constraints && (
            <div className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#E0EFFF] mb-3">
              <Info size={16} className="text-[#0064D2] shrink-0 mt-[1px]" />
              <div className="text-[12px] text-[#003D81] leading-[18px]">
                <span className="font-bold">Requirements:</span>{' '}
                {constraints.recommendation} Allowed ratio: {constraints.ratioLabel}. Max file size: 2 MB.
              </div>
            </div>
          )}

          {!previewUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-[160px] border border-dashed border-[#d8dce8] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#f8f9fd] transition-colors group"
            >
              <div className="w-10 h-10 mb-3 text-[#aeb2be] group-hover:text-[#007BFF] transition-colors">
                <ImageIcon size={40} strokeWidth={1.5} />
              </div>
              <span className="text-[14px] font-bold text-[#303135] group-hover:text-[#007BFF] transition-colors">Browse file</span>
              <span className="text-[12px] text-[#aeb2be] mt-1">or drag and drop a file here</span>
            </div>
          ) : (
            <div className="w-full h-[160px] border border-[#d8dce8] rounded-[8px] flex flex-col items-center justify-center bg-white">
              <div className="flex-1 flex items-center justify-center p-4 w-full h-full">
                <img src={previewUrl} alt="Preview" className="max-w-[80%] max-h-[90px] object-contain" />
              </div>
              <div className="mb-4 flex items-center gap-4">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[14px] font-bold text-[#007BFF] hover:underline">
                  Edit Assets
                </button>
              </div>
            </div>
          )}

          {dimensionError && (
            <div className="flex items-start gap-2 mt-2 p-2.5 rounded-[8px] bg-[#FFDFDF]">
              <AlertTriangle size={14} className="text-[#B81D1D] shrink-0 mt-[1px]" />
              <p className="text-[12px] text-[#8C1616] leading-[16px] font-medium">
                {dimensionError} Please upload a different image that meets the requirements.
              </p>
            </div>
          )}

          {uploadStatus !== 'idle' && (
            <div className="mt-3 flex flex-col gap-[6px]" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-[12px] leading-[16px]">
                <span className={`font-bold ${uploadStatus === 'error' ? 'text-[#d4183d]' : uploadStatus === 'done' ? 'text-[#0a8a4c]' : 'text-[#303135]'}`}>
                  {uploadStatus === 'uploading' ? 'Uploading…' : uploadStatus === 'done' ? 'Uploaded' : 'Upload failed. Please try again.'}
                </span>
                {uploadStatus !== 'error' && <span className="text-[#71747d]">{progress}%</span>}
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#e9ebef]">
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ease-out ${uploadStatus === 'error' ? 'bg-[#d4183d]' : uploadStatus === 'done' ? 'bg-[#0a8a4c]' : 'bg-[#007BFF]'}`}
                  style={{ width: `${uploadStatus === 'error' ? 100 : progress}%` }}
                />
              </div>
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".png,.jpg,.jpeg" className="hidden" />
        </div>

        <div className="mt-[24px] flex justify-end gap-3" style={FONT}>
          <button type="button" onClick={() => onOpenChange(false)} disabled={isUploading} className="px-6 py-2.5 rounded-[8px] bg-[#e7f2ff] text-[#007BFF] font-bold text-[14px] hover:bg-[#d0e4ff] transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploadDisabled}
            className="px-6 py-2.5 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors disabled:bg-[#d8dce8] disabled:text-[#aeb2be] disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            Upload
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
