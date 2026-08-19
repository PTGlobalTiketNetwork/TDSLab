import { useState, useEffect } from 'react';
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
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [assetToMove, setAssetToMove] = useState<Asset | null>(null);
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

  const handleSelectAsset = (id: string) => {
    setSelectedAssetId(id);
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
    setAssetToDelete(asset);
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

  const handleDeleteConfirm = async () => {
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

  const selectedAsset = assets.find(a => a.id === selectedAssetId) || null;

  return (
    <>
      <AssetLibrary 
        assets={assets}
        category={category || 'Campaign'}
        searchQuery={searchQuery}
        selectedAssetId={selectedAssetId}
        onSelectAsset={handleSelectAsset}
        onEdit={handleEdit}
        onDownload={handleDownload}
        onDelete={handleDelete}
        onMove={handleMove}
        isSidebarCollapsed={false}
        isLoading={isLoading}
      />

      <AssetInspector 
         selectedAsset={selectedAsset}
         onEdit={handleEdit}
         onDelete={handleDelete}
         onMove={handleMove}
         onDownload={handleDownload}
      />

      <AssetDeleteModal
        isOpen={deleteModalOpen}
        asset={assetToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalOpen(false)}
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
};