import React, { useEffect, useRef, useState } from 'react';
import { List, ChevronDown } from 'lucide-react';
import gridSvgPaths from '../../../imports/svg-avczeqk0mg';
import { CustomPagination } from './CustomPagination';
import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';

/**
 * Shared list-page conventions (reference: Logo Assets list).
 * Every paginated list page uses these so they look and behave the same.
 */
/** Multiples of 12 so a full page always fills every row at 2, 3, 4 or 6 columns. */
export const LIST_PAGE_SIZE_OPTIONS = [12, 24, 48, 96] as const;
export const LIST_PAGE_SIZE = 24;
const PAGE_SIZE_KEY = 'tdslab:listPageSize';

/** Items-per-page choice shared by every list page, remembered per browser. */
export function useListPageSize(): [number, (n: number) => void] {
  const [size, setSize] = useState<number>(() => {
    try {
      const v = Number(localStorage.getItem(PAGE_SIZE_KEY));
      return (LIST_PAGE_SIZE_OPTIONS as readonly number[]).includes(v) ? v : LIST_PAGE_SIZE;
    } catch { return LIST_PAGE_SIZE; }
  });
  const update = (n: number) => {
    setSize(n);
    try { localStorage.setItem(PAGE_SIZE_KEY, String(n)); } catch { /* storage unavailable */ }
  };
  return [size, update];
}
/** Width of the right-hand inspector panel; list content gets this margin only while it is open. */
export const LIST_INSPECTOR_MARGIN = 'mr-[432px]';
/**
 * Page wrapper: full width, inspector margin only when a side panel is open.
 * `flex flex-col min-h-full` + the bottom bar's `mt-auto sticky bottom-0` is the sticky-footer
 * pattern: ListPaginationBottom sits flush at the bottom of the (full-viewport-height) scrolling
 * `<main>` when content is short, and stays pinned to the bottom of the screen while scrolling
 * when content is tall — so "Show" + pagination follow the viewport instead of living at the
 * literal end of a long page.
 */
export const listPageClass = (inspectorOpen: boolean) =>
  `${inspectorOpen ? LIST_INSPECTOR_MARGIN : ''} flex flex-col px-[24px] pt-[12px] min-h-full bg-[#f8f9fd]`;
export const LIST_GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-x-[20px] gap-y-[20px]';
export const LIST_STACK_CLASS = 'space-y-[16px]';
export const LIST_SKELETON_GRID_COUNT = 9;
export const LIST_SKELETON_ROW_COUNT = 6;

export type ListViewMode = 'grid' | 'list';

export interface ListPagination {
  currentPage: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  /** Shows the "Show [n]" items-per-page select when set */
  onItemsPerPageChange?: (n: number) => void;
}

interface ListToolbarProps {
  /** Left side: filters / sort / search */
  children?: React.ReactNode;
  /** Rendered inside the sticky bar above the filter row (e.g. category tabs) so it sticks with it */
  top?: React.ReactNode;
  /** Unused here — kept so callers can pass the same object to both ListToolbar and ListPaginationBottom without conditionals. "Show" + "Showing x–y of n" + pagination now live in ListPaginationBottom, at the bottom. */
  pagination?: ListPagination | null;
  viewMode?: ListViewMode;
  onViewModeChange?: (mode: ListViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: { viewMode: ListViewMode; onViewModeChange: (m: ListViewMode) => void }) {
  const btn = (active: boolean) =>
    `px-[12px] py-[10px] flex items-center justify-center rounded-[6px] transition-all font-bold text-[14px] leading-[20px] ${
      active ? 'bg-white text-[#007bff] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]' : 'bg-transparent text-[#71747d] hover:bg-[#e9ebef]'
    }`;
  return (
    <div className="flex items-center gap-[8px] shrink-0">
      <span className="text-[14px] text-[#303135] font-sans">View :</span>
      <div className="flex items-center gap-[4px] bg-[#f4f7fe] rounded-[8px] p-[4px]">
        <button type="button" aria-label="Grid view" onClick={() => onViewModeChange('grid')} className={btn(viewMode === 'grid')}>
          <div className="relative size-[18px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
              <path clipRule="evenodd" d={gridSvgPaths.p28557400} fill="currentColor" fillRule="evenodd" />
            </svg>
          </div>
        </button>
        <button type="button" aria-label="List view" onClick={() => onViewModeChange('list')} className={btn(viewMode === 'list')}>
          <List size={18} />
        </button>
      </div>
    </div>
  );
}

/**
 * "Show [n]" + "Showing x–y of n" + page numbers, as one group — sticky to the bottom of the
 * scrolling `<main>` (see listPageClass: flex-col + min-h-full + this bar's mt-auto). Place it as
 * the last element of the list page, after the grid/rows.
 */
export function ListPaginationBottom({ pagination }: { pagination?: ListPagination | null }) {
  if (!pagination || pagination.totalItems === 0) return null;
  const perPage = pagination.itemsPerPage ?? LIST_PAGE_SIZE;
  return (
    <div className="sticky bottom-0 z-[35] mt-auto -mx-[24px] px-[24px] py-[12px] bg-[#f8f9fd] border-t border-[#e9ebef] flex items-center justify-end gap-[16px] md:gap-[24px] flex-wrap">
      {pagination.onItemsPerPageChange && (
        <label className="flex items-center gap-[8px] text-[14px] text-[#303135] shrink-0">
          Show
          {/* appearance-none + its own chevron: the native arrow sits flush against the border with no room for pr to push it in */}
          <span className="relative inline-flex items-center">
            <select
              value={perPage}
              onChange={(e) => { pagination.onItemsPerPageChange!(Number(e.target.value)); pagination.onPageChange(1); }}
              className="h-[36px] rounded-[8px] border border-[#d8dce8] bg-white appearance-none pl-[12px] pr-[32px] text-[14px] font-bold text-[#303135] cursor-pointer focus:outline-none focus:border-[#007BFF]"
            >
              {LIST_PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-[10px] text-[#71747d]" />
          </span>
        </label>
      )}
      <CustomPagination
        inline
        currentPage={pagination.currentPage}
        totalPages={Math.max(1, Math.ceil(pagination.totalItems / perPage))}
        onPageChange={pagination.onPageChange}
        totalItems={pagination.totalItems}
        itemsPerPage={perPage}
      />
    </div>
  );
}

/**
 * Sticky list toolbar: left = filters, right = view toggle ("Show" + "Showing x–y of n" + the page
 * numbers live at the bottom instead, via ListPaginationBottom — see listPageClass).
 * Sticks to the top of the scrolling <main>; casts STICKY_SHADOW only while stuck
 * (sentinel + IntersectionObserver feeds the shared useStickyBar shadow rule).
 * Must be a direct child of a `px-[24px]` list page wrapper (see listPageClass).
 */
export function ListToolbar({ children, top, viewMode, onViewModeChange }: ListToolbarProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = sentinel.closest('main');
    const observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { root, threshold: 0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const { shadow } = useStickyBar(barRef, stuck);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px -mb-px" />
      <div
        ref={barRef}
        className={`sticky top-0 z-[35] -mx-[24px] px-[24px] py-[12px] mb-[12px] bg-[#f8f9fd] transition-shadow ${shadow ? STICKY_SHADOW : ''}`}
      >
        {top && <div className="mb-[12px]">{top}</div>}
        {/* flex-wrap on the row itself (not just inside each side): when the left filters wrap to several
            lines, the right cluster drops to its own line below instead of vertically centering into the
            middle of the wrapped filters (which looked like it was overlapping them). */}
        <div className="flex items-start justify-between gap-x-[16px] gap-y-[8px] flex-wrap">
          <div className="flex gap-[8px] items-center min-w-0 flex-wrap">{children}</div>
          {viewMode && onViewModeChange && <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />}
        </div>
      </div>
    </>
  );
}
