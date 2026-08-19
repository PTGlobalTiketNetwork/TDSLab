import { Asset } from '../../types/asset';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import TdsIcImage from '../../../imports/TdsIcImage';
import svgPaths from '../../../imports/svg-3n792bvqad';
import { Maximize2, FolderInput } from 'lucide-react';
import { Download } from 'lucide-react';
import { Lightbox } from '../Lightbox';
import { formatStoredName } from '../../utils/userDisplay';

interface AssetInspectorProps {
  selectedAsset: Asset | null;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
}

export function AssetInspector({
  selectedAsset,
  onEdit,
  onDelete,
  onMove,
  onDownload,
}: AssetInspectorProps) {
  if (!selectedAsset) {
    return (
      <div className="w-[432px] h-screen bg-white border-l border-[#d8dce8] fixed right-0 top-0 flex flex-col items-center justify-center px-[32px] z-10">
        <div className="text-center">
          
          <h3 className="text-[18px] font-bold text-[#303135] mb-2">
            Please select an asset
          </h3>
          <p className="text-[14px] text-[#71747d]">
            To see the details here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[432px] h-[calc(100vh-100px)] bg-white border-l border-[#d8dce8] fixed right-0 top-[100px] overflow-y-auto z-10">
      <div className="flex flex-col gap-[24px] px-[32px] pt-[32px] pb-[32px]">
        {/* Preview Image & Actions */}
        <div className="flex flex-col gap-[16px] items-center w-full">
          {/* Preview Image with Checkerboard Background */}
          <Lightbox
            trigger={
                <button className="h-[180px] w-[360px] rounded-[12px] overflow-hidden border border-[#e8eaee] relative bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2nk5eX9z4AFePn5+f8zIAn+/////2eAAfz///+WYQDzg46ODtobgH7CQacBAIVT/wX866uAAAAAAElFTkSuQmCC')] group cursor-zoom-in focus:outline-none p-0">
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
                        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2nk5eX9z4AFePn5+f8zIAn+/////2eAAfz///+WYQDzg46ODtobgH7CQacBAIVT/wX866uAAAAAAElFTkSuQmCC')]"
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