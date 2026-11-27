import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { AssetService } from '../../services/assetService';
import { Asset } from '../../types/asset';
import { AssetLibrary } from '../components/assets/AssetLibrary';
import { AssetInspector } from '../components/assets/AssetInspector';
import { AssetDeleteModal } from '../components/assets/AssetDeleteModal';
import { MoveAssetModal } from '../components/assets/MoveAssetModal';
import { toast } from 'sonner';
import { TiketSnackbar } from '../components/ui/TiketSnackbar';
import { supabase } from '../../utils/supabase/client';
import { getUserDisplayName } from '../utils/userDisplay';

export const AssetListPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(() => new Set());

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetsToDelete, setAssetsToDelete] = useState<Asset[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [assetToMove, setAssetToMove] = useState<Asset | null>(null);
  const [assetsToMove, setAssetsToMove] = useState<Asset[]>([]);
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
      console.error('Failed to load assets:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to load assets" variant="error" />);
    } finally {
      setIsLoading(false);
    }
  };

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
    navigate(`/assets/${category}/edit/${asset.id}`);
  };

  const handleDownload = async (asset: Asset) => {
    if (!asset.imageUrl) return;
    try {
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
      toast.custom((t) => <TiketSnackbar id={t} message={`Downloaded "${asset.name}"`} variant="default" />);
    } catch (error) {
      console.error('Failed to download asset:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to download asset" variant="error" />);
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
    setAssetsToMove([]);
    setAssetToMove(asset);
    setMoveModalOpen(true);
  };

  const handleBulkMove = (bulkAssets: Asset[]) => {
    setAssetToMove(null);
    setAssetsToMove(bulkAssets);
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
      setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, category: targetCategory } : a));
      toast.custom((t) => <TiketSnackbar id={t} message={`Asset "${asset.name}" moved to ${targetCategory}`} variant="default" />);
      setMoveModalOpen(false);
      setAssetToMove(null);
      if (selectedAssetId === asset.id) setSelectedAssetId(null);
    } catch (error) {
      console.error('Failed to move asset:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to move asset" variant="error" />);
    } finally {
      setIsMoving(false);
    }
  };

  const handleBulkMoveConfirm = async (bulkAssets: Asset[], targetCategory: string) => {
    try {
      setIsMoving(true);
      const { data: { session } } = await supabase.auth.getSession();
      const results = await Promise.allSettled(
        bulkAssets.map((a) => AssetService.updateAsset({
          id: a.id,
          category: targetCategory,
          last_edited_by_id: session?.user?.id,
          last_edited_by_name: session?.user ? getUserDisplayName(session.user, 'Unknown') : undefined,
        })),
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      const movedIds = new Set(bulkAssets.filter((_, i) => results[i].status === 'fulfilled').map((a) => a.id));
      setAssets(prev => prev.map(a => movedIds.has(a.id) ? { ...a, category: targetCategory } : a));
      const msg = failed > 0
        ? `Moved ${succeeded} of ${bulkAssets.length} assets to ${targetCategory}. ${failed} failed.`
        : `${succeeded} asset${succeeded === 1 ? '' : 's'} moved to ${targetCategory}`;
      toast.custom((t) => <TiketSnackbar id={t} message={msg} variant={failed > 0 ? 'error' : 'default'} />);
      setMoveModalOpen(false);
      setAssetsToMove([]);
      clearMultiSelect();
    } catch (error) {
      console.error('Failed to move assets:', error);
      toast.custom((t) => <TiketSnackbar id={t} message="Failed to move assets" variant="error" />);
    } finally {
      setIsMoving(false);
    }
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
        if (selectedAssetId === assetToDelete.id) setSelectedAssetId(null);
        setDeleteModalOpen(false);
        setAssetToDelete(null);
      } catch (error) {
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

  return (
    <>
      <AssetLibrary
        assets={assets}
        category={category || 'Campaign'}
        searchQuery={searchQuery}
        selectedAssetId={selectedAssetId}
        selectedAssetIds={selectedAssetIds}
        onSelectAsset={handleSelectAsset}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onMove={handleMove}
        isSidebarCollapsed={false}
        isLoading={isLoading}
        onClearSelection={clearMultiSelect}
      />

      <AssetInspector
         selectedAsset={isMultiSelect ? null : selectedAsset}
         selectedAssets={isMultiSelect ? selectedAssets : undefined}
         onEdit={handleEdit}
         onDelete={handleDelete}
         onMove={handleMove}
         onDownload={handleDownload}
         onBulkMove={handleBulkMove}
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
        assets={assetsToMove}
        onConfirm={handleMoveConfirm}
        onConfirmBulk={handleBulkMoveConfirm}
        onCancel={() => { setMoveModalOpen(false); setAssetToMove(null); setAssetsToMove([]); }}
        isLoading={isMoving}
      />
    </>
  );
};