import { useState, useEffect, useMemo } from 'react';
import { Banner, ViewMode } from '../../types/banner';
import { BannerCard } from './BannerCard';
import { BannerRow } from './BannerRow';
import { BannerContextMenu } from './BannerContextMenu';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { CustomPagination } from './ui/CustomPagination';
import { PresenceUser } from '../../hooks/usePresence';

import { Skeleton } from './ui/skeleton';

interface MainContentProps {
  banners: Banner[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  verticalFilter: string;
  onVerticalFilterChange: (filter: string) => void;
  ratioFilter: string;
  onRatioFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedBannerId: string | null;
  selectedBannerIds?: Set<string>;
  onSelectBanner: (id: string, shiftKey: boolean) => void;
  isSidebarCollapsed?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  highlightId?: string | null;
  presenceMap?: Record<string, PresenceUser[]>;
  availableRatios: string[];
  availableVerticals: string[];
  onEditBanner?: (banner: Banner) => void;
  onResizeBanner?: (banner: Banner) => void;
  onDuplicateBanner?: (banner: Banner) => void;
  onDownloadBanner?: (banner: Banner, scaleFactor: number) => void;
  onDeleteBanner?: (banner: Banner) => void;
  onBulkDelete?: (banners: Banner[]) => void;
  onBulkDuplicate?: (banners: Banner[]) => void;
  onBulkDownload?: (banners: Banner[]) => void;
  onBulkMoveToDrafts?: (banners: Banner[]) => void;
  onBulkPublish?: (banners: Banner[]) => void;
  onClearSelection?: () => void;
}

export function MainContent({
  banners,
  viewMode,
  onViewModeChange,
  verticalFilter,
  onVerticalFilterChange,
  ratioFilter,
  onRatioFilterChange,
  sortBy,
  onSortChange,
  selectedBannerId,
  selectedBannerIds,
  onSelectBanner,
  isSidebarCollapsed = false,
  isLoading = false,
  searchQuery = '',
  highlightId,
  presenceMap,
  availableRatios,
  availableVerticals,
  onEditBanner,
  onResizeBanner,
  onDuplicateBanner,
  onDownloadBanner,
  onDeleteBanner,
  onBulkDelete,
  onBulkDuplicate,
  onBulkDownload,
  onBulkMoveToDrafts,
  onBulkPublish,
  onClearSelection,
}: MainContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when banners change (due to filtering)
  useEffect(() => {
    if (!highlightId) {
        setCurrentPage(1);
    }
  }, [banners, highlightId]);

  // Handle Highlight
  useEffect(() => {
      if (highlightId && banners.length > 0) {
          const index = banners.findIndex(b => b.id === highlightId);
          if (index !== -1) {
              const page = Math.floor(index / itemsPerPage) + 1;
              setCurrentPage(page);
              onSelectBanner(highlightId, false);
              
              // Scroll logic
              setTimeout(() => {
                  const element = document.getElementById(`banner-card-${highlightId}`);
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
  }, [highlightId, banners]);

  const totalItems = banners.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const currentBanners = banners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasContextActions = onEditBanner || onResizeBanner || onDuplicateBanner || onDownloadBanner || onDeleteBanner;

  const isMultiSelect = selectedBannerIds && selectedBannerIds.size >= 2;
  const bulkBanners = useMemo(
    () => (isMultiSelect ? banners.filter(b => selectedBannerIds!.has(b.id)) : []),
    [banners, selectedBannerIds, isMultiSelect],
  );

  const isBannerSelected = (id: string) => {
    if (selectedBannerIds && selectedBannerIds.size > 0) {
      return selectedBannerIds.has(id);
    }
    return selectedBannerId === id;
  };

  return (
    <div className="mr-[432px] px-[24px] py-[24px] min-h-full bg-[#f8f9fd] max-w-full transition-all duration-300">
      <FilterBar
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        verticalFilter={verticalFilter}
        onVerticalFilterChange={onVerticalFilterChange}
        ratioFilter={ratioFilter}
        onRatioFilterChange={onRatioFilterChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        availableRatios={availableRatios}
        availableVerticals={availableVerticals}
      />

      {isLoading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 items-start auto-rows-min">
            {Array.from({ length: 8 }).map((_, i) => (
               <div key={i} className="bg-white flex flex-col gap-[12px] p-[16px] rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] w-full h-full">
                   <Skeleton className="w-full h-[180px] rounded-[12px]" />
                   <div className="flex items-center justify-between gap-2 mt-auto">
                       <Skeleton className="h-[24px] w-3/4 rounded-[4px]" />
                       <Skeleton className="h-[20px] w-[40px] rounded-full" />
                   </div>
               </div>
            ))}
          </div>
        ) : (
          <div className="space-y-[16px]">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-[20px] p-[16px] bg-white rounded-[12px] shadow-sm border border-[#e9ebef]">
                    <Skeleton className="h-[60px] w-[120px] rounded-[8px]" />
                    <div className="flex-1 space-y-2">
                         <Skeleton className="h-[16px] w-1/3" />
                         <Skeleton className="h-[14px] w-1/4" />
                    </div>
                </div>
            ))}
          </div>
        )
      ) : banners.length === 0 ? (
        <EmptyState type={searchQuery ? 'search' : 'empty'} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 items-start auto-rows-min">
          {currentBanners.map((banner) => {
            const selected = isBannerSelected(banner.id);
            const isInMultiSelection = isMultiSelect && selectedBannerIds!.has(banner.id);
            return hasContextActions ? (
              <BannerContextMenu
                key={banner.id}
                banner={banner}
                bulkBanners={isInMultiSelection ? bulkBanners : undefined}
                onEdit={onEditBanner}
                onResize={onResizeBanner}
                onDuplicate={onDuplicateBanner}
                onDownload={onDownloadBanner}
                onDelete={onDeleteBanner}
                onBulkDelete={onBulkDelete}
                onBulkDuplicate={onBulkDuplicate}
                onBulkDownload={onBulkDownload}
                onBulkMoveToDrafts={onBulkMoveToDrafts}
                onBulkPublish={onBulkPublish}
                onClearSelection={onClearSelection}
              >
                <div className="h-full w-full">
                  <BannerCard
                    banner={banner}
                    isSelected={selected}
                    onClick={(e) => onSelectBanner(banner.id, e.shiftKey)}
                    activeEditors={presenceMap?.[banner.id] || []}
                  />
                </div>
              </BannerContextMenu>
            ) : (
              <BannerCard
                key={banner.id}
                banner={banner}
                isSelected={selected}
                onClick={(e) => onSelectBanner(banner.id, e.shiftKey)}
                activeEditors={presenceMap?.[banner.id] || []}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-[16px]">
          {currentBanners.map((banner, index) => {
            const selected = isBannerSelected(banner.id);
            const isInMultiSelection = isMultiSelect && selectedBannerIds!.has(banner.id);
            return hasContextActions ? (
              <BannerContextMenu
                key={banner.id}
                banner={banner}
                bulkBanners={isInMultiSelection ? bulkBanners : undefined}
                onEdit={onEditBanner}
                onResize={onResizeBanner}
                onDuplicate={onDuplicateBanner}
                onDownload={onDownloadBanner}
                onDelete={onDeleteBanner}
                onBulkDelete={onBulkDelete}
                onBulkDuplicate={onBulkDuplicate}
                onBulkDownload={onBulkDownload}
                onBulkMoveToDrafts={onBulkMoveToDrafts}
                onBulkPublish={onBulkPublish}
                onClearSelection={onClearSelection}
              >
                <div className="w-full">
                  <BannerRow
                    banner={banner}
                    index={(currentPage - 1) * itemsPerPage + index}
                    isSelected={selected}
                    onClick={(e) => onSelectBanner(banner.id, e.shiftKey)}
                  />
                </div>
              </BannerContextMenu>
            ) : (
              <BannerRow
                key={banner.id}
                banner={banner}
                index={(currentPage - 1) * itemsPerPage + index}
                isSelected={selected}
                onClick={(e) => onSelectBanner(banner.id, e.shiftKey)}
              />
            );
          })}
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