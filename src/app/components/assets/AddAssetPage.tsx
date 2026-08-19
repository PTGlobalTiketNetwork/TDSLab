import { useState, useRef, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import { Loader2, Upload, X, Image as ImageIcon, AlertTriangle, Info, Crop, CheckCircle2, Layers } from 'lucide-react';
import { CropAssetModal } from './CropAssetModal';
import { AssetService } from '../../../services/assetService';
import { supabase } from '../../../utils/supabase/client';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Asset } from '../../types/asset';
import { Header } from '../Header';
import { getUserDisplayName } from '../../utils/userDisplay';
import { getAssetConstraints, normalizeCategoryName } from '../../utils/assetConstraints';

interface AddAssetPageProps {
  category: string;
  onBack: () => void;
  onSuccess: () => void;
  initialData?: Asset | null;
  isSidebarCollapsed: boolean;
  fullWidth?: boolean;
  userName?: string;
}

type UploadState = 'idle' | 'selected' | 'uploading' | 'success';
type UploadMode = 'single' | 'bulk';
type BulkFileStatus = 'pending' | 'uploading' | 'success' | 'error';

interface BulkFile {
  id: string;
  file: File;
  name: string;
  previewUrl: string;
  dimension: string;
  ratio: string;
  size: string;
  validationError: string | null;
  status: BulkFileStatus;
  errorMessage?: string;
}

export function AddAssetPage({ category: rawCategory, onBack, onSuccess, initialData, isSidebarCollapsed, fullWidth = false, userName }: AddAssetPageProps) {
  const category = normalizeCategoryName(rawCategory);
  const isEditMode = !!initialData;

  // Mode — bulk only available when adding (not editing)
  const [mode, setMode] = useState<UploadMode>('single');

  // ─── Single upload state ────────────────────────────────────────────────────
  const [assetName, setAssetName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileMetadata, setFileMetadata] = useState<{ size: string; dimension: string; ratio: string }>({
    size: 'Auto', dimension: 'Auto', ratio: 'Auto',
  });
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  // ─── Bulk upload state ──────────────────────────────────────────────────────
  const [bulkFiles, setBulkFiles] = useState<BulkFile[]>([]);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  // ─── Guard state ────────────────────────────────────────────────────────────
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  // Initialize form for edit mode
  useEffect(() => {
    if (initialData) {
      setAssetName(initialData.name);
      setPreviewUrl(initialData.imageUrl);
      setFileMetadata({ size: initialData.fileSize, dimension: initialData.dimension, ratio: initialData.ratio });
      setUploadState('selected');
    }
  }, [initialData]);

  const hasChanges = useMemo(() => {
    if (mode === 'bulk') return bulkFiles.length > 0;
    if (initialData) return selectedFile !== null || assetName !== initialData.name;
    return selectedFile !== null || assetName !== '';
  }, [mode, initialData, selectedFile, assetName, bulkFiles]);

  const performLogout = async () => { await supabase.auth.signOut(); };

  const handleLogout = () => {
    if (hasChanges) { setLogoutPending(true); setIsExitModalOpen(true); }
    else performLogout();
  };

  const handleCancel = () => {
    if (hasChanges) { setLogoutPending(false); setIsExitModalOpen(true); }
    else onBack();
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

  const readImageMeta = (file: File): Promise<{ dimension: string; ratio: string; validationError: string | null }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth, h = img.naturalHeight;
        const d = gcd(w, h);
        const ratio = `${w / d}:${h / d}`;
        const dimension = `${w} x ${h}px`;
        const constraints = getAssetConstraints(category);
        let validationError: string | null = null;
        if (constraints) {
          const ar = w / h;
          if (w < constraints.minWidth || h < constraints.minHeight) {
            validationError = `${w}×${h}px — min ${constraints.minWidth}×${constraints.minHeight}px.`;
          } else if (ar < constraints.minRatio || ar > constraints.maxRatio) {
            validationError = `Ratio ${ratio} — allowed ${constraints.ratioLabel}.`;
          }
        }
        resolve({ dimension, ratio, validationError });
      };
      img.src = URL.createObjectURL(file);
    });

  // ─── Single upload logic ─────────────────────────────────────────────────────
  const validateAndSetFile = useCallback((file: File) => {
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Only .png and .jpg files are supported.'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB.'); return;
    }
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const d = gcd(w, h);
      setFileMetadata({ size: formatBytes(file.size), dimension: `${w} x ${h}px`, ratio: `${w / d}:${h / d}` });
      const constraints = getAssetConstraints(category);
      if (constraints) {
        const ar = w / h;
        const rd = gcd(w, h);
        const ratioDisplay = `${w / rd}:${h / rd}`;
        if (w < constraints.minWidth || h < constraints.minHeight) {
          setDimensionError(`Image is ${w} × ${h}px — minimum size is ${constraints.minWidth} × ${constraints.minHeight}px.`);
        } else if (ar < constraints.minRatio || ar > constraints.maxRatio) {
          setDimensionError(`Image ratio is ${ratioDisplay} — allowed ratio is ${constraints.ratioLabel}.`);
        } else {
          setDimensionError(null);
        }
      }
    };
    img.src = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadState('selected');
    if (!assetName) setAssetName(file.name.split('.').slice(0, -1).join('.'));
  }, [assetName, category]);

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
    setNameError(null);
    if (!assetName || (!selectedFile && !initialData)) return;
    try {
      const { data: existing } = await supabase.from('logo_assets').select('id').eq('category', category).ilike('name', assetName).maybeSingle();
      if (existing && (!initialData || existing.id !== initialData.id)) {
        setNameError('Asset name already exists in this category. Please use a different name.'); return;
      }
      setUploadState('uploading');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      const uploaderName = getUserDisplayName(session.user, 'Unknown');
      let publicUrl = initialData?.imageUrl;
      if (selectedFile) publicUrl = await AssetService.uploadAssetFile(selectedFile, category);
      if (!publicUrl) throw new Error('No image URL');
      if (initialData) {
        await AssetService.updateAsset({
          id: initialData.id, name: assetName, image_url: publicUrl, category,
          ratio: selectedFile ? fileMetadata.ratio : initialData.ratio,
          dimension: selectedFile ? fileMetadata.dimension : initialData.dimension,
          file_size: selectedFile ? fileMetadata.size : initialData.fileSize,
          uploader_name: initialData.uploaderName || uploaderName,
          last_edited_by_id: session.user.id, last_edited_by_name: uploaderName,
        });
      } else {
        await AssetService.createAsset({
          name: assetName, category, image_url: publicUrl, created_by: session.user.id,
          ratio: fileMetadata.ratio, dimension: fileMetadata.dimension,
          file_size: fileMetadata.size, uploader_name: uploaderName,
        });
      }
      setUploadState('success');
    } catch {
      alert('Failed to upload asset. Please try again.');
      setUploadState('selected');
    }
  };

  const handleReset = () => {
    setAssetName(''); setSelectedFile(null); setPreviewUrl(null);
    setUploadState('idle'); setDimensionError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ─── Bulk upload logic ───────────────────────────────────────────────────────
  const formatBulkName = (filename: string): string => {
    const withoutExt = filename.split('.').slice(0, -1).join('.');
    const stripped = withoutExt
      .replace(/^tds_ic_product_5o_/i, '')
      .replace(/^tds_bc_/i, '')
      .replace(/^ot_logo_/i, '');
    return stripped
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const addBulkFiles = async (files: FileList) => {
    const valid = Array.from(files).filter(f =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type) && f.size <= 2 * 1024 * 1024
    );
    const newEntries: BulkFile[] = await Promise.all(valid.map(async (file) => {
      const { dimension, ratio, validationError } = await readImageMeta(file);
      return {
        id: Math.random().toString(36).slice(2),
        file,
        name: formatBulkName(file.name),
        previewUrl: URL.createObjectURL(file),
        dimension,
        ratio,
        size: formatBytes(file.size),
        validationError,
        status: 'pending' as BulkFileStatus,
      };
    }));
    setBulkFiles(prev => [...prev, ...newEntries]);
    if (bulkInputRef.current) bulkInputRef.current.value = '';
  };

  const handleBulkDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) addBulkFiles(e.dataTransfer.files);
  };

  const removeBulkFile = (id: string) => {
    setBulkFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateBulkName = (id: string, name: string) => {
    setBulkFiles(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  };

  const handleBulkUpload = async () => {
    const uploadable = bulkFiles.filter(f => f.status === 'pending' && !f.validationError && f.name.trim());
    if (!uploadable.length) return;
    setIsBulkUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Not authenticated'); setIsBulkUploading(false); return; }
    const uploaderName = getUserDisplayName(session.user, 'Unknown');

    for (const bf of uploadable) {
      setBulkFiles(prev => prev.map(f => f.id === bf.id ? { ...f, status: 'uploading' } : f));
      try {
        const publicUrl = await AssetService.uploadAssetFile(bf.file, category);
        await AssetService.createAsset({
          name: bf.name.trim(), category, image_url: publicUrl,
          created_by: session.user.id, ratio: bf.ratio,
          dimension: bf.dimension, file_size: bf.size, uploader_name: uploaderName,
        });
        setBulkFiles(prev => prev.map(f => f.id === bf.id ? { ...f, status: 'success' } : f));
      } catch {
        setBulkFiles(prev => prev.map(f => f.id === bf.id ? { ...f, status: 'error', errorMessage: 'Upload failed' } : f));
      }
    }
    setIsBulkUploading(false);
    setBulkDone(true);
  };

  const bulkSuccessCount = bulkFiles.filter(f => f.status === 'success').length;
  const bulkErrorCount = bulkFiles.filter(f => f.status === 'error').length;
  const bulkReadyCount = bulkFiles.filter(f => f.status === 'pending' && !f.validationError && f.name.trim()).length;
  const constraints = getAssetConstraints(category);

  const containerClass = `flex flex-col items-center pt-[140px] pb-[140px] px-6 min-h-screen bg-[#f8f9fd] transition-all duration-300 ${
    fullWidth ? 'ml-0' : (isSidebarCollapsed ? 'ml-[80px]' : 'ml-[268px]')
  }`;

  // ─── Single success screen ───────────────────────────────────────────────────
  if (uploadState === 'success') {
    return (
      <div className={`flex flex-col items-center justify-center pt-[140px] pb-[140px] px-6 min-h-screen bg-[#f8f9fd] transition-all duration-300 ${fullWidth ? 'ml-0' : (isSidebarCollapsed ? 'ml-[80px]' : 'ml-[268px]')}`}>
        <div className="w-full max-w-[600px] mb-6 flex items-center text-[12px] text-[#71747d] font-medium">
          <span className="cursor-pointer hover:text-[#007BFF]" onClick={handleCancel}>Logo Asset</span>
          <span className="mx-2">&gt;</span>
          <span className="cursor-pointer hover:text-[#007BFF]" onClick={handleCancel}>{category}</span>
          <span className="mx-2">&gt;</span>
          <span className="text-[#303135]">{isEditMode ? 'Edit Asset' : 'Add Asset'}</span>
        </div>
        <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full max-w-[600px] p-[40px] flex flex-col items-center">
          <div className="mb-6 h-[80px] w-[200px] flex items-center justify-center">
            <ImageWithFallback src={previewUrl || ''} alt="Uploaded Asset" className="max-w-full max-h-full object-contain" />
          </div>
          <h2 className="text-[24px] font-bold text-[#303135] mb-2">{isEditMode ? 'Asset Updated' : 'File Uploaded'}</h2>
          <p className="text-[14px] text-[#71747d] mb-8">You can already use the asset.</p>
          <div className="flex gap-3 w-full justify-center">
            {!isEditMode && (
              <button onClick={handleReset} className="px-6 py-2.5 rounded-[8px] bg-[#e7f2ff] text-[#007BFF] font-bold text-[14px] hover:bg-[#d0e4ff] transition-colors">
                Add more
              </button>
            )}
            <button onClick={onSuccess} className="px-6 py-2.5 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors shadow-sm">
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Header title="Add Asset" fullWidth={true} showLogo={true} hideControls={true} userName={userName} onLogout={handleLogout} />

      {/* Breadcrumbs */}
      <div className="w-full max-w-[600px] mb-6 flex items-center text-[12px] text-[#71747d] font-medium">
        <span className="cursor-pointer hover:text-[#007BFF]" onClick={handleCancel}>Logo Asset</span>
        <span className="mx-2">&gt;</span>
        <span className="cursor-pointer hover:text-[#007BFF]" onClick={handleCancel}>{category}</span>
        <span className="mx-2">&gt;</span>
        <span className="text-[#303135]">{isEditMode ? 'Edit Asset' : 'Add Asset'}</span>
      </div>

      <div className="w-full max-w-[600px] mb-4 flex items-center justify-between">
        <h1 className="text-[24px] font-bold text-[#303135]">{isEditMode ? 'Edit Asset' : 'Add Asset'}</h1>

        {/* Mode toggle — only in add mode */}
        {!isEditMode && (
          <div className="flex items-center bg-[#f0f2f7] rounded-[8px] p-[3px] gap-[2px]">
            <button
              onClick={() => setMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-bold transition-colors ${
                mode === 'single' ? 'bg-white text-[#303135] shadow-sm' : 'text-[#71747d] hover:text-[#303135]'
              }`}
            >
              <Upload size={13} />
              Single
            </button>
            <button
              onClick={() => setMode('bulk')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-bold transition-colors ${
                mode === 'bulk' ? 'bg-white text-[#303135] shadow-sm' : 'text-[#71747d] hover:text-[#303135]'
              }`}
            >
              <Layers size={13} />
              Bulk
            </button>
          </div>
        )}
      </div>

      {/* ── SINGLE MODE ─────────────────────────────────────────────────────── */}
      {mode === 'single' && (
        <>
          <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full max-w-[600px] p-[24px]">
            {/* Asset name */}
            <div className="mb-6">
              <label className="block text-[14px] font-medium text-[#71747d] mb-2">Asset name</label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => { setAssetName(e.target.value); if (nameError) setNameError(null); }}
                placeholder="Enter asset name"
                className={`w-full px-3 py-2.5 rounded-[8px] border text-[14px] text-[#303135] focus:outline-none transition-colors placeholder:text-[#aeb2be] ${
                  nameError ? 'border-[#d4183d] focus:border-[#d4183d]' : 'border-[#d8dce8] focus:border-[#007BFF]'
                }`}
              />
              {nameError && <p className="mt-1 text-[12px] text-[#d4183d]">{nameError}</p>}
            </div>

            <div className="mb-8">
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

              {uploadState === 'idle' ? (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[180px] border border-dashed border-[#d8dce8] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#f8f9fd] transition-colors group"
                >
                  <div className="w-10 h-10 mb-3 text-[#aeb2be] group-hover:text-[#007BFF] transition-colors">
                    <ImageIcon size={40} strokeWidth={1.5} />
                  </div>
                  <span className="text-[14px] font-bold text-[#303135] group-hover:text-[#007BFF] transition-colors">Browse file</span>
                </div>
              ) : (
                <div className="w-full h-[180px] border border-[#d8dce8] rounded-[8px] flex flex-col items-center justify-center bg-white relative">
                  <div className="flex-1 flex items-center justify-center p-4 w-full h-full">
                    {previewUrl && <img src={previewUrl} alt="Preview" className="max-w-[80%] max-h-[100px] object-contain" />}
                  </div>
                  <div className="mb-4 flex items-center gap-4">
                    {previewUrl && (
                      <button onClick={() => setIsCropOpen(true)} className="flex items-center gap-1 text-[14px] font-bold text-[#007BFF] hover:underline">
                        <Crop size={14} /> Crop Asset
                      </button>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="text-[14px] font-bold text-[#007BFF] hover:underline">
                      {isEditMode ? 'Change Asset' : 'Edit Assets'}
                    </button>
                  </div>
                </div>
              )}

              {isCropOpen && previewUrl && (() => {
                const c = getAssetConstraints(category);
                const isFixed = c && c.minRatio === c.maxRatio;
                const ratioOptions = isFixed ? undefined : [{ label: '1:1', value: 1 }, { label: '2:1', value: 2 }, { label: '5:1', value: 5 }];
                return (
                  <CropAssetModal
                    imageSrc={previewUrl}
                    fileName={selectedFile?.name || initialData?.name || 'asset'}
                    aspect={isFixed ? c?.minRatio : undefined}
                    ratioOptions={ratioOptions}
                    defaultRatio={ratioOptions ? 2 : undefined}
                    onCancel={() => setIsCropOpen(false)}
                    onConfirm={(file) => { setIsCropOpen(false); validateAndSetFile(file); }}
                  />
                );
              })()}

              {dimensionError && (
                <div className="flex items-start gap-2 mt-2 p-2.5 rounded-[8px] bg-[#FFDFDF]">
                  <AlertTriangle size={14} className="text-[#B81D1D] shrink-0 mt-[1px]" />
                  <p className="text-[12px] text-[#8C1616] leading-[16px] font-medium">
                    {dimensionError} Please upload a different image that meets the requirements.
                  </p>
                </div>
              )}

              <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".png,.jpg,.jpeg" className="hidden" />
            </div>
          </div>

          <div className="w-full max-w-[600px] mt-6 flex justify-end gap-3">
            <button onClick={handleCancel} disabled={uploadState === 'uploading'} className="px-6 py-2.5 rounded-[8px] bg-[#e7f2ff] text-[#007BFF] font-bold text-[14px] hover:bg-[#d0e4ff] transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={(!selectedFile && !initialData) || !assetName || uploadState === 'uploading' || !!dimensionError}
              className="px-6 py-2.5 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors disabled:bg-[#d8dce8] disabled:text-[#aeb2be] disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploadState === 'uploading' && <Loader2 size={16} className="animate-spin" />}
              {isEditMode ? 'Update' : 'Upload'}
            </button>
          </div>
        </>
      )}

      {/* ── BULK MODE ────────────────────────────────────────────────────────── */}
      {mode === 'bulk' && (
        <>
          <div className="bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full max-w-[600px] p-[24px]">
            <label className="block text-[14px] font-bold text-[#303135] mb-1">Upload assets</label>
            <p className="text-[12px] text-[#71747d] mb-3">Select multiple files at once. Supported format: .png or .jpg. Max 2 MB each.</p>

            {constraints && (
              <div className="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#E0EFFF] mb-4">
                <Info size={16} className="text-[#0064D2] shrink-0 mt-[1px]" />
                <div className="text-[12px] text-[#003D81] leading-[18px]">
                  <span className="font-bold">Requirements:</span>{' '}
                  {constraints.recommendation} Allowed ratio: {constraints.ratioLabel}. Max file size: 2 MB.
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDrop={handleBulkDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => bulkInputRef.current?.click()}
              className="w-full h-[140px] border border-dashed border-[#d8dce8] rounded-[8px] flex flex-col items-center justify-center cursor-pointer hover:bg-[#f8f9fd] transition-colors group mb-4"
            >
              <div className="w-9 h-9 mb-2 text-[#aeb2be] group-hover:text-[#007BFF] transition-colors">
                <Layers size={36} strokeWidth={1.5} />
              </div>
              <span className="text-[14px] font-bold text-[#303135] group-hover:text-[#007BFF] transition-colors">Browse files</span>
              <span className="text-[12px] text-[#aeb2be] mt-1">or drag and drop multiple files here</span>
            </div>
            <input
              type="file"
              ref={bulkInputRef}
              onChange={(e) => { if (e.target.files?.length) addBulkFiles(e.target.files); }}
              accept=".png,.jpg,.jpeg"
              multiple
              className="hidden"
            />

            {/* File list */}
            {bulkFiles.length > 0 && (
              <div className="flex flex-col gap-3 mt-2">
                {bulkFiles.map((bf) => (
                  <div
                    key={bf.id}
                    className={`flex items-center gap-3 p-3 rounded-[8px] border ${
                      bf.status === 'success' ? 'border-[#d1f0e0] bg-[#f4fdf8]'
                      : bf.status === 'error' ? 'border-[#ffd4d4] bg-[#fff8f8]'
                      : bf.validationError ? 'border-[#ffd4d4] bg-[#fff8f8]'
                      : 'border-[#e9ebef] bg-white'
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="w-[56px] h-[40px] rounded-[4px] bg-[#f0f2f7] flex items-center justify-center overflow-hidden shrink-0">
                      <img src={bf.previewUrl} alt={bf.name} className="max-w-full max-h-full object-contain" />
                    </div>

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      {bf.status === 'pending' ? (
                        <input
                          type="text"
                          value={bf.name}
                          onChange={(e) => updateBulkName(bf.id, e.target.value)}
                          placeholder="Asset name"
                          className="w-full text-[13px] font-medium text-[#303135] bg-transparent border-b border-[#d8dce8] focus:border-[#007BFF] focus:outline-none pb-0.5 placeholder:text-[#aeb2be]"
                        />
                      ) : (
                        <p className="text-[13px] font-medium text-[#303135] truncate">{bf.name}</p>
                      )}
                      <p className="text-[11px] text-[#aeb2be] mt-0.5">{bf.dimension} · {bf.size}</p>
                      {bf.validationError && bf.status === 'pending' && (
                        <p className="text-[11px] text-[#d4183d] mt-0.5 flex items-center gap-1">
                          <AlertTriangle size={10} /> {bf.validationError}
                        </p>
                      )}
                      {bf.status === 'error' && (
                        <p className="text-[11px] text-[#d4183d] mt-0.5">{bf.errorMessage}</p>
                      )}
                    </div>

                    {/* Status / remove */}
                    <div className="shrink-0">
                      {bf.status === 'uploading' && <Loader2 size={18} className="animate-spin text-[#007BFF]" />}
                      {bf.status === 'success' && <CheckCircle2 size={18} className="text-[#1a9e5f]" />}
                      {bf.status === 'error' && <AlertTriangle size={18} className="text-[#d4183d]" />}
                      {bf.status === 'pending' && !isBulkUploading && (
                        <button onClick={() => removeBulkFile(bf.id)} className="text-[#aeb2be] hover:text-[#303135] transition-colors">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bulk done summary */}
            {bulkDone && (bulkSuccessCount > 0 || bulkErrorCount > 0) && (
              <div className={`mt-4 p-3 rounded-[8px] text-[13px] font-medium flex items-center gap-2 ${bulkErrorCount > 0 ? 'bg-[#fff3cd] text-[#856404]' : 'bg-[#d1f0e0] text-[#0d6e3f]'}`}>
                <CheckCircle2 size={15} />
                {bulkSuccessCount} uploaded successfully{bulkErrorCount > 0 ? `, ${bulkErrorCount} failed` : ''}.
              </div>
            )}
          </div>

          <div className="w-full max-w-[600px] mt-6 flex justify-end gap-3">
            <button onClick={handleCancel} disabled={isBulkUploading} className="px-6 py-2.5 rounded-[8px] bg-[#e7f2ff] text-[#007BFF] font-bold text-[14px] hover:bg-[#d0e4ff] transition-colors disabled:opacity-50">
              Cancel
            </button>
            {bulkDone ? (
              <button onClick={onSuccess} className="px-6 py-2.5 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors shadow-sm">
                Back to List
              </button>
            ) : (
              <button
                onClick={handleBulkUpload}
                disabled={isBulkUploading || bulkReadyCount === 0}
                className="px-6 py-2.5 rounded-[8px] bg-[#007BFF] text-white font-bold text-[14px] hover:bg-[#0064D2] transition-colors disabled:bg-[#d8dce8] disabled:text-[#aeb2be] disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isBulkUploading && <Loader2 size={16} className="animate-spin" />}
                Upload {bulkReadyCount > 0 ? `${bulkReadyCount} file${bulkReadyCount > 1 ? 's' : ''}` : 'All'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Exit confirmation modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-[12px] w-[540px] shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-[24px] border-b border-[#e8eaee]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <AlertTriangle size={24} strokeWidth={2} />
                </div>
                <h3 className="text-[20px] font-bold text-[#303135]">Unsaved Changes</h3>
              </div>
              <button onClick={() => setIsExitModalOpen(false)} className="text-[#71747d] hover:text-[#303135] transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-[24px]">
              <p className="text-[16px] text-[#4D4F56] leading-relaxed">
                {logoutPending ? 'You have unsaved changes. Do you want to discard them and log out?' : 'You have unsaved changes. Do you want to discard them?'}
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 p-[24px] border-t border-[#e8eaee]">
              <button onClick={() => { if (logoutPending) performLogout(); else onBack(); }} className="h-[44px] px-[24px] bg-transparent text-[#d4183d] text-[16px] font-bold rounded-[8px] hover:bg-red-50 transition-colors">
                {logoutPending ? 'Discard & Logout' : 'Discard Changes'}
              </button>
              <button onClick={() => { setIsExitModalOpen(false); setLogoutPending(false); }} className="h-[44px] px-[24px] bg-[#e7f2ff] text-[#007bff] text-[16px] font-bold rounded-[8px] hover:bg-[#d1e6ff] transition-colors">
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
