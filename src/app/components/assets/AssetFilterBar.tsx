import { Check } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import svgPaths from '../../../imports/svg-2akxad69hc';
import checkboxSvgPaths from '../../../imports/svg-quh4u2q8jl';

interface AssetFilterBarProps {
  productFilter: string;
  onProductFilterChange: (filter: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const productOptions: string[] = [
  "General",
  "Hotel",
  "Flight",
  "NFT",
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


export function AssetFilterBar({
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

  // Left-side filters only; layout, pagination and view toggle come from ListToolbar
  return (
    <>
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
              {sortOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => {
                    onSortChange(option.value);
                    setIsSortDropdownOpen(false);
                  }}
                  className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors relative"
                >
                  {/* Single-select: blue label + check on the right (same as the banner list sort), not a checkbox */}
                  <span className={`font-normal leading-[20px] text-[14px] flex-1 ${sortBy === option.value ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>
                    {option.label}
                  </span>
                  {sortBy === option.value && (
                    <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

    </>
  );
}
