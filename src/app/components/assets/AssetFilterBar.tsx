import { useState, useRef, useEffect } from 'react';
import { List, Search } from 'lucide-react';
import { AssetViewMode } from '../../types/asset';
import svgPaths from '../../../imports/svg-2akxad69hc';
import gridSvgPaths from '../../../imports/svg-avczeqk0mg';
import checkboxSvgPaths from '../../../imports/svg-quh4u2q8jl';

interface AssetFilterBarProps {
  viewMode: AssetViewMode;
  onViewModeChange: (mode: AssetViewMode) => void;
  productFilter: string;
  onProductFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const productOptions: string[] = [
  "General",
  "Hotel",
  "Transport",
  "ToDos",
  "Event",
];

const sortOptions = [
  { label: 'Date Created (Newest)', value: 'created_at_desc' },
  { label: 'Date Created (Oldest)', value: 'created_at_asc' },
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
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

function SelectionControlCheckbox({ checked }: { checked: boolean }) {
  if (checked) {
    return (
      <div className="relative shrink-0 size-[24px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g>
            <rect fill="#007BFF" height="19" rx="1.5" stroke="#007BFF" width="19" x="2.5" y="2.5" />
            <path clipRule="evenodd" d={checkboxSvgPaths.pd617e00} fill="white" fillRule="evenodd" />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="relative rounded-[4px] shrink-0 size-[24px]">
      <div className="absolute bg-white border border-[#aeb2be] border-solid inset-[8.33%] rounded-[2px]" />
    </div>
  );
}

export function AssetFilterBar({
  viewMode,
  onViewModeChange,
  productFilter,
  onProductFilterChange,
  sortBy,
  onSortChange,
}: AssetFilterBarProps) {
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = productOptions.filter(option => 
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort by';

  return (
    <div className="flex items-center justify-between mb-[18px] mx-[0px] my-[12px] mt-[6px] mr-[0px] ml-[0px]">
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
            <div className="absolute top-[48px] left-0 w-[240px] bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-20 overflow-clip flex flex-col items-start py-[8px]">
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortDropdownOpen(false);
                  }}
                  className="flex items-center gap-[8px] px-[12px] py-[12px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                >
                  <SelectionControlCheckbox checked={sortBy === option.value} />
                  <span className="font-normal leading-[20px] text-[#303135] text-[14px] flex-1">
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Filter - REMOVED for Asset Logo */}
        {/* <div className="relative" ref={dropdownRef}> */}
          {/* ... */}
        {/* </div> */}
      </div>

      {/* Right - View Toggle */}
      <div className="flex items-center gap-[8px]">
        <span className="text-[14px] text-[#303135] font-['Tiket_Odyssey_Text:Regular',sans-serif]">View :</span>
        <div className="flex items-center gap-[4px] bg-[#f4f7fe] rounded-[8px] p-[4px]">
          <div className="relative">
            <div className="absolute border-[#d8dce8] border-[0.5px] border-solid inset-[-0.25px] pointer-events-none rounded-[8.25px]" />
          </div>
          <button
            onClick={() => onViewModeChange('grid')}
            className={`px-[12px] py-[10px] flex items-center justify-center rounded-[6px] transition-all font-bold text-[14px] leading-[20px] ${
              viewMode === 'grid'
                ? 'bg-white text-[#007bff] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
                : 'bg-transparent text-[#71747d] hover:bg-[#e9ebef]'
            }`}
            style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
          >
            <div className="relative size-[18px]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                  <path clipRule="evenodd" d={gridSvgPaths.p28557400} fill="currentColor" fillRule="evenodd" />
              </svg>
            </div>
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-[12px] py-[10px] flex items-center justify-center rounded-[6px] transition-all font-bold text-[14px] leading-[20px] ${
              viewMode === 'list'
                ? 'bg-white text-[#007bff] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]'
                : 'bg-transparent text-[#71747d] hover:bg-[#e9ebef]'
            }`}
            style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}
          >
            <List size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}