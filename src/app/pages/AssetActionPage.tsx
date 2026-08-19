import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AddAssetPage } from '../components/assets/AddAssetPage';
import { AssetService } from '../../services/assetService';
import { Asset } from '../../types/asset';

export const AssetActionPage = () => {
  const { category, assetId } = useParams();
  const navigate = useNavigate();
  
  const [initialData, setInitialData] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(!!assetId);

  useEffect(() => {
    if (assetId) {
        const fetchAsset = async () => {
            try {
                // Reuse listAssets logic
                const allAssets = await AssetService.listAssets();
                const asset = allAssets.find(a => a.id === assetId);
                
                if (asset) {
                    setInitialData(asset);
                } else {
                    console.error("Asset not found");
                    navigate(`/assets/${category}`);
                }
            } catch (err) {
                console.error("Error fetching asset", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAsset();
    }
  }, [assetId, navigate, category]);

  if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8f9fd]">
          <div className="w-8 h-8 border-4 border-[#0064D2] border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
  }

  return (
    <AddAssetPage 
        category={category || 'Campaign'}
        onBack={() => navigate(`/assets/${category}`)}
        onSuccess={() => navigate(`/assets/${category}`)}
        initialData={initialData}
        isSidebarCollapsed={false} // Sidebar is hidden in this layout mode usually
        fullWidth={true} // Force full width since sidebar is hidden
    />
  );
};
