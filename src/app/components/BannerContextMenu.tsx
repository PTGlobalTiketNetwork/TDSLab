import { ReactNode, useMemo } from 'react';
import { Banner } from '../../types/banner';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuTrigger,
} from './ui/context-menu';
import { Edit2, Scaling, Copy, Download, Trash2, FileDown, Send, X } from 'lucide-react';
import { useAccess } from '../../context/AccessContext';

const DOWNLOAD_SCALES = [
  { factor: 1, label: '1x', description: 'Standard' },
  { factor: 1.5, label: '1.5x', description: 'Medium' },
  { factor: 2, label: '2x', description: 'High' },
  { factor: 3, label: '3x', description: 'Ultra' },
] as const;

interface BannerContextMenuProps {
  banner: Banner;
  children: ReactNode;
  bulkBanners?: Banner[];
  onEdit?: (banner: Banner) => void;
  onResize?: (banner: Banner) => void;
  onDuplicate?: (banner: Banner) => void;
  onDownload?: (banner: Banner, scaleFactor: number) => void;
  onDelete?: (banner: Banner) => void;
  onBulkDelete?: (banners: Banner[]) => void;
  onBulkDuplicate?: (banners: Banner[]) => void;
  onBulkDownload?: (banners: Banner[]) => void;
  onBulkMoveToDrafts?: (banners: Banner[]) => void;
  onBulkPublish?: (banners: Banner[]) => void;
  onClearSelection?: () => void;
}

export function BannerContextMenu({
  banner,
  children,
  bulkBanners,
  onEdit,
  onResize,
  onDuplicate,
  onDownload,
  onDelete,
  onBulkDelete,
  onBulkDuplicate,
  onBulkDownload,
  onBulkMoveToDrafts,
  onBulkPublish,
  onClearSelection,
}: BannerContextMenuProps) {
  const { isWhitelisted } = useAccess();
  const hasFormData = !!(banner as any).form_data;
  const hasImage = !!banner.imageUrl;
  const nativeDims = useMemo(() => getNativeDimensions(banner), [banner]);

  const isBulk = bulkBanners && bulkBanners.length >= 2;
  const bulkCount = isBulk ? bulkBanners.length : 0;
  const bulkHasDuplicatable = isBulk && bulkBanners.some(b => b.form_data);
  const bulkHasDownloadable = isBulk && bulkBanners.some(b => b.imageUrl);
  const bulkHasPublished = isBulk && bulkBanners.some(b => b.status === 'published');
  const bulkHasDrafts = isBulk && bulkBanners.some(b => b.status === 'draft');

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-[220px]">
        {isBulk ? (
          <>
            <div className="px-2 py-1.5 text-[11px] font-semibold text-muted-foreground">
              {bulkCount} banners selected
            </div>
            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={(e) => { e.stopPropagation(); onBulkDuplicate?.(bulkBanners); }}
              disabled={!bulkHasDuplicatable}
              className="gap-3"
            >
              <Copy className="size-4" />
              <span>Duplicate {bulkCount} banners</span>
            </ContextMenuItem>

            <ContextMenuItem
              onClick={(e) => { e.stopPropagation(); onBulkDownload?.(bulkBanners); }}
              disabled={!bulkHasDownloadable}
              className="gap-3"
            >
              <Download className="size-4" />
              <span>Download {bulkCount} banners</span>
            </ContextMenuItem>

            {bulkHasPublished && (
              <ContextMenuItem
                onClick={(e) => { e.stopPropagation(); onBulkMoveToDrafts?.(bulkBanners); }}
                className="gap-3"
              >
                <FileDown className="size-4" />
                <span>Move to Drafts</span>
              </ContextMenuItem>
            )}

            {bulkHasDrafts && (
              <ContextMenuItem
                onClick={(e) => { e.stopPropagation(); onBulkPublish?.(bulkBanners); }}
                className="gap-3"
              >
                <Send className="size-4" />
                <span>Publish Drafts</span>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={(e) => { e.stopPropagation(); onClearSelection?.(); }}
              className="gap-3"
            >
              <X className="size-4" />
              <span>Clear selection</span>
            </ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuItem
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); onBulkDelete?.(bulkBanners); }}
              className="gap-3"
            >
              <Trash2 className="size-4" />
              <span>Delete {bulkCount} banners</span>
            </ContextMenuItem>
          </>
        ) : (
          <>
            <ContextMenuItem
              onClick={(e) => { e.stopPropagation(); onEdit?.(banner); }}
              disabled={!hasFormData}
              className="gap-3"
            >
              <Edit2 className="size-4" />
              <span>Edit</span>
              <ContextMenuShortcut>E</ContextMenuShortcut>
            </ContextMenuItem>

            {isWhitelisted && (
              <ContextMenuItem
                onClick={(e) => { e.stopPropagation(); onResize?.(banner); }}
                disabled={!hasFormData && !hasImage}
                className="gap-3"
              >
                <Scaling className="size-4" />
                <span>Resize</span>
                <ContextMenuShortcut>R</ContextMenuShortcut>
              </ContextMenuItem>
            )}

            <ContextMenuSeparator />

            <ContextMenuItem
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(banner); }}
              disabled={!hasFormData}
              className="gap-3"
            >
              <Copy className="size-4" />
              <span>Duplicate</span>
              <ContextMenuShortcut>D</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuSub>
              <ContextMenuSubTrigger disabled={!hasImage} className="gap-3">
                <Download className="size-4" />
                <span>Download</span>
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-[220px]">
                <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Downloads EN & ID versions
                </div>
                {DOWNLOAD_SCALES.map(({ factor, label, description }) => {
                  const outputDims = nativeDims
                    ? `${Math.round(nativeDims.w * factor)}x${Math.round(nativeDims.h * factor)}`
                    : null;
                  return (
                    <ContextMenuItem
                      key={factor}
                      onClick={(e) => { e.stopPropagation(); onDownload?.(banner, factor); }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm w-[32px]">{label}</span>
                        <span className="text-xs text-muted-foreground">{description}</span>
                      </div>
                      {outputDims && (
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">{outputDims}</span>
                      )}
                    </ContextMenuItem>
                  );
                })}
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuItem
              variant="destructive"
              onClick={(e) => { e.stopPropagation(); onDelete?.(banner); }}
              className="gap-3"
            >
              <Trash2 className="size-4" />
              <span>Delete</span>
              <ContextMenuShortcut>&#9003;</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function getNativeDimensions(banner: Banner): { w: number; h: number } | null {
  const formData = (banner as any).form_data;
  if (formData) {
    const category = formData.bannerCategory;
    const ratio = formData.bannerRatio;
    const nativeW = 600;

    if (category === 'Product Entry Point') {
      if (ratio === 'Mobile (2:1)' || ratio === 'mobile_2:1') return { w: 320, h: 160 };
      if (ratio === 'Mobile (4:1)' || ratio === 'mobile_4:1') return { w: 320, h: 80 };
      return { w: 320, h: 128 };
    }

    switch (ratio) {
      case 'Square (1:1)': return { w: nativeW, h: nativeW };
      case 'Portrait (3:4)': return { w: 720, h: 960 };
      case 'Landscape (16:9)': return { w: nativeW, h: Math.round(nativeW * 9 / 16) };
      case 'Landscape (2:1)':
      default: return { w: nativeW, h: 300 };
    }
  }

  // Parse from dimension string e.g. "600x300px"
  const dim = banner.dimension;
  if (dim) {
    const parts = dim.toLowerCase().replace('px', '').split('x');
    if (parts.length === 2) {
      const w = parseInt(parts[0]);
      const h = parseInt(parts[1]);
      if (!isNaN(w) && !isNaN(h)) return { w, h };
    }
  }

  return null;
}