import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AssetService } from '../../services/assetService';
import { Asset } from '../../types/asset';
import { AssetLibrary } from '../components/assets/AssetLibrary';
import { AssetInspector } from '../components/assets/AssetInspector';
import { AddAssetPage } from '../components/assets/AddAssetPage';
import { AssetDeleteModal } from '../components/assets/AssetDeleteModal';
import { MoveAssetModal } from '../components/assets/MoveAssetModal';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';
import { supabase } from '../../utils/supabase/client';
import { getUserDisplayName } from '../utils/userDisplay';

interface AssetLibraryPageProps {
  searchQuery: string;
  isSidebarCollapsed: boolean;
}

export function AssetLibraryPage({ searchQuery, isSidebarCollapsed }: AssetLibraryPageProps) {
  const { category } = useParams<{ category: string }>();
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get('highlight');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetsToDelete, setAssetsToDelete] = useState<Asset[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [assetToMove, setAssetToMove] = useState<Asset | null>(null);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await AssetService.listAssets();
      setAssets(data);
    } catch (error) {
      console.error('Failed to load assets', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Click selects just one asset (replacing the selection). Shift-click adds/removes it from a multi-selection.
  const handleSelectAsset = (id: string, shiftKey: boolean) => {
    window.getSelection()?.removeAllRanges();

    if (shiftKey) {
      setSelectedAssetIds(prev => {
        const next = new Set(prev);
        if (next.size === 0 && selectedAssetId && selectedAssetId !== id) {
          next.add(selectedAssetId);
        }
        if (next.has(id)) next.delete(id);
        else next.add(id);

        const nextIds = Array.from(next);
        if (nextIds.length === 0) {
          setSelectedAssetId(null);
        } else if (next.has(id)) {
          setSelectedAssetId(id);
        } else {
          setSelectedAssetId(nextIds[nextIds.length - 1]);
        }

        return next;
      });
    } else if (selectedAssetId === id && selectedAssetIds.size === 0) {
      // Clicking the selected card again unselects it
      setSelectedAssetId(null);
    } else {
      setSelectedAssetIds(new Set());
      setSelectedAssetId(id);
    }
  };

  const clearMultiSelect = () => {
    setSelectedAssetIds(new Set());
    setSelectedAssetId(null);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setIsAdding(true);
  };

  const downloadOne = async (asset: Asset) => {
    if (!asset.imageUrl) return;
    const response = await fetch(asset.imageUrl);
    const blob = await response.blob();
    const ext = asset.imageUrl.split('.').pop()?.split('?')[0] || 'png';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async (asset: Asset) => {
    if (!asset.imageUrl) return;
    try {
      await downloadOne(asset);
      toast.custom((t) => <TiketSnackbar id={t} message={`Downloaded "${asset.name}"`} variant="default" />);
    } catch (error) {
      console.error('Failed to download asset:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to download asset" variant="error" />);
    }
  };

  const handleBulkDownload = async (bulkAssets: Asset[]) => {
    const downloadable = bulkAssets.filter((a) => a.imageUrl);
    if (downloadable.length === 0) {
      toast.custom((t) => <TiketSnackbar id={t} message="None of the selected assets have images" variant="error" />);
      return;
    }
    toast.custom((t) => <TiketSnackbar id={t} message={`Downloading ${downloadable.length} asset${downloadable.length === 1 ? '' : 's'}...`} variant="default" />);
    // Sequential downloads with a short delay so the browser doesn't block multiple simultaneous downloads.
    for (const asset of downloadable) {
      try {
        await downloadOne(asset);
      } catch (error) {
        console.error(`Failed to download asset "${asset.name}":`, error);
      }
      await new Promise((r) => setTimeout(r, 400));
    }
  };

  const handleDelete = (asset: Asset) => {
    setAssetsToDelete([]);
    setAssetToDelete(asset);
    setDeleteModalOpen(true);
  };

  const handleBulkDelete = (bulkAssets: Asset[]) => {
    setAssetToDelete(null);
    setAssetsToDelete(bulkAssets);
    setDeleteModalOpen(true);
  };

  const handleMove = (asset: Asset) => {
    setAssetToMove(asset);
    setMoveModalOpen(true);
  };

  const handleMoveConfirm = async (asset: Asset, targetCategory: string) => {
    try {
      setIsMoving(true);
      const { data: { session } } = await supabase.auth.getSession();
      await AssetService.updateAsset({
        id: asset.id,
        category: targetCategory,
        last_edited_by_id: session?.user?.id,
        last_edited_by_name: session?.user ? getUserDisplayName(session.user, 'Unknown') : undefined,
      });
      // Update local state
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, category: targetCategory } : a));
      toast.custom((t) => <TiketSnackbar id={t} message={`Asset "${asset.name}" moved to ${targetCategory}`} variant="default" />);
      setMoveModalOpen(false);
      setAssetToMove(null);
      if (selectedAssetId === asset.id) {
        setSelectedAssetId(null);
      }
    } catch (error) {
      console.error('Failed to move asset:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to move asset" variant="error" />);
    } finally {
      setIsMoving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    const isBulk = assetsToDelete.length > 0;
    if (isBulk) {
      try {
        setIsDeleting(true);
        const results = await Promise.allSettled(assetsToDelete.map((a) => AssetService.deleteAsset(a.id)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.length - succeeded;
        const deletedIds = new Set(assetsToDelete.filter((_, i) => results[i].status === 'fulfilled').map((a) => a.id));
        setAssets(prev => prev.filter((a) => !deletedIds.has(a.id)));
        const msg = failed > 0
          ? `Deleted ${succeeded} of ${assetsToDelete.length} assets. ${failed} failed.`
          : `${succeeded} asset${succeeded === 1 ? '' : 's'} deleted`;
        toast.custom((t) => <TiketSnackbar id={t} message={msg} variant={failed > 0 ? 'error' : 'default'} />);
        clearMultiSelect();
        setDeleteModalOpen(false);
        setAssetsToDelete([]);
      } catch (error) {
        toast.custom((t) => <TiketSnackbar id={t} message="Failed to delete assets" variant="error" />);
      } finally {
        setIsDeleting(false);
      }
      return;
    }

    if (assetToDelete) {
        try {
            setIsDeleting(true);
            await AssetService.deleteAsset(assetToDelete.id);
            setAssets(assets.filter(a => a.id !== assetToDelete.id));
            toast.custom((t) => <TiketSnackbar id={t} message={`Asset "${assetToDelete.name}" has been deleted`} variant="default" />);
            if (selectedAssetId === assetToDelete.id) {
                setSelectedAssetId(null);
            }
            setDeleteModalOpen(false);
            setAssetToDelete(null);
        } catch (error) {
            console.error('Failed to delete asset:', error);
            toast.custom((t) => <TiketSnackbar id={t} message="Failed to delete asset" variant="error" />);
        } finally {
            setIsDeleting(false);
        }
    }
  };

  // Esc unselects (unless a dialog is open, where Esc closes the dialog)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
      clearMultiSelect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isMultiSelect = selectedAssetIds.size >= 2;
  const selectedAssets = useMemo(
    () => assets.filter((a) => selectedAssetIds.has(a.id)),
    [assets, selectedAssetIds],
  );

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;

  if (isAdding) {
      return (
        <AddAssetPage
            category={category || 'Others'}
            onBack={() => {
                setIsAdding(false);
                setEditingAsset(null);
            }}
            onSuccess={() => {
                // AddAssetPage already shows its own "Asset updated/File uploaded successfully" toast
                loadAssets();
                setIsAdding(false);
                setEditingAsset(null);
            }}
            initialData={editingAsset}
            isSidebarCollapsed={isSidebarCollapsed}
            fullWidth={true}
        />
      );
  }

  return (
    <>
      <AssetLibrary
        assets={assets}
        category={category || 'Others'}
        searchQuery={searchQuery}
        selectedAssetId={selectedAssetId}
        selectedAssetIds={selectedAssetIds}
        onSelectAsset={handleSelectAsset}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onMove={handleMove}
        isSidebarCollapsed={isSidebarCollapsed}
        isLoading={isLoading}
        highlightId={highlightId}
        onClearSelection={clearMultiSelect}
      />
      <AssetInspector
         selectedAsset={isMultiSelect ? null : selectedAsset}
         selectedAssets={isMultiSelect ? selectedAssets : undefined}
         onEdit={handleEdit}
         onDelete={handleDelete}
         onMove={handleMove}
         onDownload={handleDownload}
         onBulkDownload={handleBulkDownload}
         onBulkDelete={handleBulkDelete}
         onClearSelection={clearMultiSelect}
      />
      <AssetDeleteModal
        isOpen={deleteModalOpen}
        asset={assetToDelete}
        assets={assetsToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteModalOpen(false); setAssetToDelete(null); setAssetsToDelete([]); }}
        isLoading={isDeleting}
      />
      <MoveAssetModal
        isOpen={moveModalOpen}
        asset={assetToMove}
        onConfirm={handleMoveConfirm}
        onCancel={() => { setMoveModalOpen(false); setAssetToMove(null); }}
        isLoading={isMoving}
      />
    </>
  );
}
