import { useState, useRef, useEffect } from 'react';
import { List, Check, X } from 'lucide-react';
import { ViewMode } from '../../types/banner';
import svgPaths from '../../imports/svg-2akxad69hc';
import gridSvgPaths from '../../imports/svg-avczeqk0mg';

interface FilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  verticalFilter: string;
  onVerticalFilterChange: (filter: string) => void;
  ratioFilter: string;
  onRatioFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  availableRatios: string[];
  availableVerticals: string[];
}

const sortOptions = [
  { label: 'Date Created (Newest)', value: 'created_at_desc' },
  { label: 'Date Created (Oldest)', value: 'created_at_asc' },
  { label: 'Last Updated (Recently Edited)', value: 'updated_at_desc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Product / Vertical', value: 'product_asc' },
];

function ChevronDownIcon() {
  return (
    <div className="relative shrink-0 size-[16px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <path d={svgPaths.pd996a00} fill="#4D4F56" />
      </svg>
    </div>
  );
}

export function FilterBar({
  viewMode,
  onViewModeChange,
  verticalFilter,
  onVerticalFilterChange,
  ratioFilter,
  onRatioFilterChange,
  sortBy,
  onSortChange,
  availableRatios,
  availableVerticals,
}: FilterBarProps) {
  const [isVerticalDropdownOpen, setIsVerticalDropdownOpen] = useState(false);
  const [isRatioDropdownOpen, setIsRatioDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const ratioDropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsVerticalDropdownOpen(false);
      }
      if (ratioDropdownRef.current && !ratioDropdownRef.current.contains(event.target as Node)) {
        setIsRatioDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort by';
  
  // Check if any filter is active
  const hasActiveFilters = verticalFilter !== 'All' || ratioFilter !== 'All';
  
  const handleClearAll = () => {
    onVerticalFilterChange('All');
    onRatioFilterChange('All');
  };

  return (
    <div className="flex items-center justify-between mx-[0px] my-[6px] p-[0px] mt-[6px] mr-[0px] mb-[18px] ml-[0px]">
      {/* Left - Filters */}
      <div className="flex gap-[8px] items-start">
        {/* Sort by */}
        <div className="relative" ref={sortDropdownRef}>
          <button 
            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            className="bg-white relative flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[18px]"
          >
            <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <span className="font-normal leading-[22px] text-[#303135] text-[16px] text-nowrap relative">
              {currentSortLabel}
            </span>
            <ChevronDownIcon />
          </button>

          {isSortDropdownOpen && (
            <div className="absolute top-[48px] left-0 w-[240px] bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-clip flex flex-col items-start py-[8px]">
              {sortOptions.map((option) => {
                const isSelected = sortBy === option.value;
                return (
                <div
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                >
                  <span className={`font-normal leading-[20px] text-[14px] flex-1 ${isSelected ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                    {option.label}
                  </span>
                  {isSelected && (
                      <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                          <Check size={12} className="text-white" strokeWidth={3} />
                      </div>
                  )}
                </div>
              )})}
            </div>
          )}
        </div>

        {/* Vertical Filter */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsVerticalDropdownOpen(!isVerticalDropdownOpen)}
            className="bg-white relative flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[18px]"
          >
            <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <span className="font-normal leading-[22px] text-[#303135] text-[16px] text-nowrap relative">
              {verticalFilter === "All" ? "All Product" : verticalFilter}
            </span>
            <ChevronDownIcon />
          </button>

          {isVerticalDropdownOpen && (
            <div className="absolute top-[48px] left-0 w-[280px] bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-clip flex flex-col items-start py-[8px]">
              
              <div className="w-full max-h-[300px] overflow-y-auto">
                 {/* "All" Option */}
                  <div
                    onClick={() => {
                      onVerticalFilterChange("All");
                      setIsVerticalDropdownOpen(false);
                    }}
                    className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                  >
                      <span className={`font-normal leading-[20px] text-[14px] flex-1 ${verticalFilter === "All" ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                        All Product
                      </span>
                      {verticalFilter === "All" && (
                        <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                            <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                  </div>

                  {availableVerticals.map((option) => {
                    const isSelected = verticalFilter === option;
                    return (
                    <div
                      key={option}
                      onClick={() => {
                        onVerticalFilterChange(option);
                        setIsVerticalDropdownOpen(false);
                      }}
                      className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                    >
                      <span className={`font-normal leading-[20px] text-[14px] flex-1 ${isSelected ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                            <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  )})}
              </div>
            </div>
          )}
        </div>

        {/* Ratio Filter */}
        <div className="relative" ref={ratioDropdownRef}>
          <button
            onClick={() => setIsRatioDropdownOpen(!isRatioDropdownOpen)}
            className="bg-white relative flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[18px]"
          >
            <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
            <span className="font-normal leading-[22px] text-[#303135] text-[16px] text-nowrap relative">
              {ratioFilter === "All" ? "All Ratio" : ratioFilter}
            </span>
            <ChevronDownIcon />
          </button>

          {isRatioDropdownOpen && (
            <div className="absolute top-[48px] left-0 w-[280px] bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-clip flex flex-col items-start py-[8px]">
              
              <div className="w-full max-h-[300px] overflow-y-auto">
                 {/* "All" Option */}
                  <div
                    onClick={() => {
                      onRatioFilterChange("All");
                      setIsRatioDropdownOpen(false);
                    }}
                    className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                  >
                      <span className={`font-normal leading-[20px] text-[14px] flex-1 ${ratioFilter === "All" ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                        All Ratio
                      </span>
                      {ratioFilter === "All" && (
                        <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                            <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                  </div>

                  {availableRatios.map((option) => {
                    const isSelected = ratioFilter === option;
                    return (
                    <div
                      key={option}
                      onClick={() => {
                        onRatioFilterChange(option);
                        setIsRatioDropdownOpen(false);
                      }}
                      className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                    >
                      <span className={`font-normal leading-[20px] text-[14px] flex-1 ${isSelected ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                            <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  )})}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Clear All + View Toggle */}
      <div className="flex items-center gap-[12px]">
        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-[6px] px-[12px] py-[6px] text-[#007BFF] hover:text-[#0056b3] text-[14px] font-medium transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
            <span>Clear All</span>
          </button>
        )}
        
        {/* View Toggle */}
        <div className="flex items-center gap-[4px] bg-[#f4f7fe] border border-[#d8dce8] rounded-[8px] p-[4px]">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`w-[36px] h-[32px] flex items-center justify-center rounded-[6px] transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#007BFF] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
                : 'text-[#71747d] hover:bg-[#e8ebf5]'
            }`}
          >
            <div className="relative size-[18px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={gridSvgPaths.p28557400} fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`w-[36px] h-[32px] flex items-center justify-center rounded-[6px] transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#007BFF] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
                : 'text-[#71747d] hover:bg-[#e8ebf5]'
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}