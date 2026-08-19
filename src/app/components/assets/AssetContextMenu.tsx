import { ReactNode } from 'react';
import { Asset } from '../../types/asset';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '../ui/context-menu';
import { Edit2, Download, Trash2, FolderInput } from 'lucide-react';

interface AssetContextMenuProps {
  asset: Asset;
  children: ReactNode;
  onEdit?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
}

export function AssetContextMenu({
  asset,
  children,
  onEdit,
  onDownload,
  onDelete,
  onMove,
}: AssetContextMenuProps) {
  const hasImage = !!asset.imageUrl;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-[200px]">
        {/* Edit */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(asset);
          }}
          className="gap-3"
        >
          <Edit2 className="size-4" />
          <span>Edit</span>
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Move to */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onMove?.(asset);
          }}
          className="gap-3"
        >
          <FolderInput className="size-4" />
          <span>Move to</span>
          <ContextMenuShortcut>M</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Download */}
        <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            onDownload?.(asset);
          }}
          disabled={!hasImage}
          className="gap-3"
        >
          <Download className="size-4" />
          <span>Download</span>
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Delete */}
        <ContextMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(asset);
          }}
          className="gap-3"
        >
          <Trash2 className="size-4" />
          <span>Delete</span>
          <ContextMenuShortcut>&#9003;</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}