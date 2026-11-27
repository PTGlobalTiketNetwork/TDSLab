import { Asset } from '../../types/asset';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import TdsIcImage from '../../../imports/TdsIcImage';
import svgPaths from '../../../imports/svg-3n792bvqad';
import { Maximize2, FolderInput, X, Trash2 } from 'lucide-react';
import { Download } from 'lucide-react';
import { Lightbox } from '../Lightbox';
import { formatStoredName } from '../../utils/userDisplay';

interface AssetInspectorProps {
  selectedAsset: Asset | null;
  selectedAssets?: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onBulkMove?: (assets: Asset[]) => void;
  onBulkDownload?: (assets: Asset[]) => void;
  onBulkDelete?: (assets: Asset[]) => void;
  onClearSelection?: () => void;
}

export function AssetInspector({
  selectedAsset,
  selectedAssets,
  onEdit,
  onDelete,
  onMove,
  onDownload,
  onBulkMove,
  onBulkDownload,
  onBulkDelete,
  onClearSelection,
}: AssetInspectorProps) {
  // 2+ selected: switch to the bulk summary + actions panel (mirrors BannerListPage's InspectorPanel)
  if (selectedAssets && selectedAssets.length >= 2) {
    const count = selectedAssets.length;
    const categories = [...new Set(selectedAssets.map(a => a.category).filter(Boolean))];
    const noun = count === 1 ? 'asset' : 'assets';

    return (
      <div className="w-[432px] h-[calc(100vh-100px)] bg-white border-l border-[#d8dce8] fixed right-0 top-[100px] overflow-y-auto z-40 flex flex-col">
        <div className="p-[24px] border-b border-[#e8eaee]">
          <div className="flex items-center justify-between">
            <h3 className="text-[20px] font-bold text-[#303135]">{count} assets selected</h3>
            <button onClick={onClearSelection} className="text-[14px] text-[#007BFF] hover:text-[#0064D2] font-medium transition-colors">
              Deselect All
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-[24px] pt-[24px] pb-[24px]">
          {categories.length > 0 && (
            <div className="mb-4">
              <p className="text-[12px] font-medium text-[#71747d] mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span key={c} className="inline-flex items-center px-3 py-1 bg-[#f4f7fe] rounded-[6px] text-[12px] font-bold text-[#303135]">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#f8f9fd] rounded-[8px] p-[16px] max-h-[240px] overflow-y-auto mb-6">
            <p className="text-[12px] font-medium text-[#71747d] mb-2">Selected assets</p>
            <div className="space-y-2">
              {selectedAssets.map((a) => (
                <div key={a.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#007BFF] shrink-0" />
                  <p className="text-[13px] text-[#303135] truncate">{a.name}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[12px] font-medium text-[#71747d] mb-2">Bulk Actions</p>

            <button
              onClick={() => onBulkMove?.(selectedAssets)}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors"
            >
              <FolderInput className="size-4" />
              Move {count} {noun}
            </button>

            <button
              onClick={() => onBulkDownload?.(selectedAssets)}
              disabled={!selectedAssets.some((a) => a.imageUrl)}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="size-4" />
              Download {count} {noun}
            </button>

            <button
              onClick={onClearSelection}
              className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-medium text-[#303135] bg-[#f0f1f5] hover:bg-[#e4e5ea] transition-colors"
            >
              <X className="size-4" />
              Clear Selection
            </button>

            <div className="pt-2">
              <button
                onClick={() => onBulkDelete?.(selectedAssets)}
                className="w-full h-[40px] px-4 flex items-center gap-3 rounded-[8px] text-[14px] font-bold text-[#F15C59] bg-[#FFDFDF] hover:bg-[#FC9999] transition-colors"
              >
                <Trash2 className="size-4" />
                Delete {count} {noun}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nothing selected: no panel at all (the asset grid uses the full width), same as Banners' InspectorPanel
  if (!selectedAsset) {
    return null;
  }

  return (
    <div className="w-[432px] h-[calc(100vh-100px)] bg-white border-l border-[#d8dce8] fixed right-0 top-[100px] overflow-y-auto z-40">
      <div className="flex flex-col gap-[24px] px-[32px] pt-[32px] pb-[32px]">
        {/* Preview Image & Actions */}
        <div className="flex flex-col gap-[16px] items-center w-full">
          {/* Preview Image with Checkerboard Background */}
          <Lightbox
            trigger={
                <button className="h-[180px] w-[360px] rounded-[12px] overflow-hidden border border-[#e8eaee] relative checkerboard group cursor-zoom-in focus:outline-none p-0">
                    <div className="w-full h-full flex items-center justify-center p-4">
                        <ImageWithFallback
                          src={selectedAsset.imageUrl}
                          alt={selectedAsset.name}
                          className="max-w-full max-h-full object-contain pointer-events-none"
                        />
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-md border border-white/30 text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                             <Maximize2 className="w-6 h-6" />
                        </div>
                    </div>
                </button>
            }
          >
                 <div className="relative flex items-center justify-center p-4">
                     <img 
                        src={selectedAsset.imageUrl} 
                        alt={selectedAsset.name} 
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl checkerboard"
                        draggable={false}
                     />
                 </div>
          </Lightbox>

          {/* Action Buttons */}
          <div className="bg-[#f4f7fe] flex gap-[16px] items-center justify-center px-[24px] py-[8px] rounded-[56px]">
            {/* Edit */}
            <button
              onClick={() => onEdit(selectedAsset)}
              className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
            >
              <div className="size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p27010400} fill="#4D4F56" fillRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                Edit
              </span>
            </button>

            {/* Move */}
            {onMove && (
              <button
                onClick={() => onMove(selectedAsset)}
                className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
              >
                <div className="size-[24px]">
                  <FolderInput className="w-6 h-6 text-[#4D4F56]" />
                </div>
                <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                  Move
                </span>
              </button>
            )}

            {/* Download */}
            {onDownload && selectedAsset.imageUrl && (
              <button
                onClick={() => onDownload(selectedAsset)}
                className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
              >
                <div className="size-[24px]">
                  <Download className="w-6 h-6 text-[#4D4F56]" />
                </div>
                <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                  Download
                </span>
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => onDelete(selectedAsset)}
              className="flex flex-col gap-[4px] items-center p-[4px] w-[64px] cursor-pointer hover:bg-gray-200/50 rounded-lg transition-colors group"
            >
              <div className="size-[24px]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={svgPaths.p316f1e80} fill="#4D4F56" fillRule="evenodd" />
                </svg>
              </div>
              <span className="font-semibold leading-[16px] text-[#71747d] text-[12px] text-center">
                Delete
              </span>
            </button>
          </div>
        </div>

        {/* Asset Name */}
        <div className="flex flex-col gap-[8px] w-full">
          <h3 className="font-bold leading-[24px] text-[#303135] text-[18px]">
            {selectedAsset.name}
          </h3>
        </div>

        {/* Asset Info */}
        <div className="flex flex-col gap-[8px] w-[360px]">
          <h4 className="font-bold leading-[22px] text-[#71747d] text-[16px]">
            Asset Info
          </h4>
          
          <div className="flex gap-[8px] w-full mt-2">
            {/* Left Column Labels */}
            <div className="flex flex-col gap-[12px] w-[100px]">
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Ratio
              </p>
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Dimension
              </p>
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Uploader
              </p>
            </div>

            {/* Left Column Values */}
            <div className="flex flex-col gap-[12px] flex-1">
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {selectedAsset.ratio}
              </p>
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {selectedAsset.dimension}
              </p>
              <p className="font-bold leading-[20px] text-[#303135] text-[14px] truncate" title={formatStoredName(selectedAsset.uploaderName, '-')}>
                {formatStoredName(selectedAsset.uploaderName, '-')}
              </p>
            </div>

            {/* Right Column Labels */}
            <div className="flex flex-col gap-[12px] w-[80px]">
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                File size
              </p>
              <p className="font-normal leading-[20px] text-[#71747d] text-[14px]">
                Added on
              </p>
            </div>

            {/* Right Column Values */}
            <div className="flex flex-col gap-[12px] flex-1">
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {selectedAsset.fileSize}
              </p>
              <p className="font-bold leading-[20px] text-[#303135] text-[14px]">
                {selectedAsset.addedOn}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}