import { useState, useMemo, useEffect } from 'react';
import { Asset, AssetViewMode } from '../../types/asset';
import { AssetFilterBar } from './AssetFilterBar';
import { AssetCard } from './AssetCard';
import { AssetRow } from './AssetRow';
import { AssetContextMenu } from './AssetContextMenu';
import { EmptyState } from '../EmptyState';
import { CustomPagination } from '../ui/CustomPagination';

import { Skeleton } from '../ui/skeleton';

interface AssetLibraryProps {
  assets: Asset[];
  category: string;
  searchQuery: string;
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
  onEdit?: (asset: Asset) => void;
  onDownload?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onMove?: (asset: Asset) => void;
  isSidebarCollapsed?: boolean;
  isLoading?: boolean;
  highlightId?: string | null;
}

export function AssetLibrary({
  assets,
  category,
  searchQuery,
  selectedAssetId,
  onSelectAsset,
  onEdit,
  onDownload,
  onDelete,
  onMove,
  isSidebarCollapsed = false,
  isLoading = false,
  highlightId,
}: AssetLibraryProps) {
  const [viewMode, setViewMode] = useState<AssetViewMode>('grid');
  const [productFilter, setProductFilter] = useState("All");
  const [sortBy, setSortBy] = useState("created_at_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAssets = useMemo(() => {
      let filtered = [...assets];
      
      // Normalize slug to stored category name
      const slugToCategoryMap: Record<string, string> = {
        'product-icon': 'Product Icon',
        'brand-entity-logo': 'Entity Logo',
      };
      const normalizedCategory = slugToCategoryMap[category] || category;

      // Filter by Category
      if (normalizedCategory && normalizedCategory !== 'Others') { 
         filtered = filtered.filter(a => a.category === normalizedCategory);
      } else if (normalizedCategory === 'Others') {
          // Logic for others if needed
          filtered = filtered.filter(a => !['Payment', 'Airlines', 'Hotel', 'Campaign', 'Product Icon', 'Entity Logo'].includes(a.category));
      }

      // Filter by Search
      if (searchQuery) {
          filtered = filtered.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
      }
      
      // Sorting
       filtered.sort((a, b) => {
        switch (sortBy) {
            case 'created_at_desc':
                return new Date(b.addedOn).getTime() - new Date(a.addedOn).getTime();
            case 'created_at_asc':
                return new Date(a.addedOn).getTime() - new Date(b.addedOn).getTime();
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'name_desc':
                return b.name.localeCompare(a.name);
            default:
                return 0;
        }
       });

      return filtered;
  }, [assets, category, searchQuery, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    if (!highlightId) {
        setCurrentPage(1);
    }
  }, [filteredAssets, highlightId]);

  // Handle Highlight
  useEffect(() => {
    if (highlightId && filteredAssets.length > 0) {
        const index = filteredAssets.findIndex(a => a.id === highlightId);
        if (index !== -1) {
            const page = Math.floor(index / itemsPerPage) + 1;
            setCurrentPage(page);
            onSelectAsset(highlightId);
            
            // Scroll logic
            setTimeout(() => {
                const element = document.getElementById(`asset-card-${highlightId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Add a temporary flash effect
                    element.style.transition = 'box-shadow 0.5s';
                    element.style.boxShadow = '0 0 0 4px rgba(0, 123, 255, 0.5)';
                    setTimeout(() => {
                        element.style.boxShadow = '';
                    }, 2000);
                }
            }, 300);
        }
    }
  }, [highlightId, filteredAssets]);

  const totalItems = filteredAssets.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentAssets = filteredAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="mr-[432px] px-[24px] py-[24px] min-h-full bg-[#f8f9fd]">
      <AssetFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        productFilter={productFilter}
        onProductFilterChange={setProductFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {isLoading ? (
        viewMode === 'grid' ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-[20px] gap-y-[20px]">
                {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-[12px] p-[16px] h-[160px] flex flex-col justify-between border border-[#d8dce8]">
                        <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                             <Skeleton className="w-[120px] h-[60px] rounded-[4px]" />
                        </div>
                        <div className="mt-2 h-[20px] flex items-center">
                            <Skeleton className="h-[14px] w-1/2 rounded-[4px]" />
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="space-y-[16px]">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-[20px] p-[16px] bg-white rounded-[12px]">
                        <Skeleton className="h-[40px] w-[40px] rounded-[8px]" />
                        <Skeleton className="h-[16px] w-1/3" />
                    </div>
                ))}
            </div>
        )
      ) : filteredAssets.length === 0 ? (
        <EmptyState type={searchQuery ? 'search' : 'empty'} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-x-[20px] gap-y-[20px]">
          {currentAssets.map((asset) => (
            <AssetContextMenu
              key={asset.id}
              asset={asset}
              onEdit={onEdit}
              onDownload={onDownload}
              onDelete={onDelete}
              onMove={onMove}
            >
              <AssetCard
                asset={asset}
                isSelected={selectedAssetId === asset.id}
                onClick={() => onSelectAsset(asset.id)}
              />
            </AssetContextMenu>
          ))}
        </div>
      ) : (
        <div className="space-y-[16px]">
          {currentAssets.map((asset, index) => (
            <AssetContextMenu
              key={asset.id}
              asset={asset}
              onEdit={onEdit}
              onDownload={onDownload}
              onDelete={onDelete}
              onMove={onMove}
            >
              <AssetRow
                asset={asset}
                index={(currentPage - 1) * itemsPerPage + index}
                isSelected={selectedAssetId === asset.id}
                onClick={() => onSelectAsset(asset.id)}
              />
            </AssetContextMenu>
          ))}
        </div>
      )}

      {totalItems > 0 && (
        <CustomPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}