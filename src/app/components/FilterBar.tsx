import { useState, useRef, useEffect } from 'react';
import { Check, X, Search } from 'lucide-react';
import svgPaths from '../../imports/svg-2akxad69hc';

interface FilterBarProps {
  verticalFilter: string[];
  onVerticalFilterChange: (filter: string[]) => void;
  ratioFilter: string[];
  onRatioFilterChange: (filter: string[]) => void;
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

/** Pill dropdown with a search box and checkboxes, so more than one option can be selected. Empty selection = all. */
export function MultiSelectFilter({ allLabel, pluralLabel, options, selected, onChange }: {
  allLabel: string;
  pluralLabel: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  useEffect(() => { if (!open) setQuery(''); }, [open]);

  const label = selected.length === 0 ? allLabel : selected.length === 1 ? selected[0] : `${selected.length} ${pluralLabel}`;
  const shown = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = (o: string) => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);

  const box = (checked: boolean) => (
    <span className={`size-[18px] shrink-0 rounded-[4px] border flex items-center justify-center ${checked ? 'bg-[#007BFF] border-[#007BFF]' : 'bg-white border-[#c0c3cf]'}`}>
      {checked && <Check size={12} className="text-white" strokeWidth={3} />}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="bg-white relative flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[18px]">
        <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
        <span className={`font-normal leading-[22px] text-[16px] text-nowrap relative ${selected.length ? 'text-[#007BFF]' : 'text-[#303135]'}`}>{label}</span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div className="absolute top-[48px] left-0 w-[280px] bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-clip flex flex-col items-start py-[8px]">
          <div className="w-full px-[12px] pb-[8px]">
            <div className="flex items-center gap-[8px] bg-[#f8f9fd] border border-[#e8eaee] rounded-[8px] px-[10px] py-[6px]">
              <Search size={14} className="text-[#71747d] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full bg-transparent outline-none text-[14px] text-[#303135] placeholder:text-[#71747d]"
              />
            </div>
          </div>
          <div className="w-full max-h-[300px] overflow-y-auto">
            {!query.trim() && (
              <div onClick={() => onChange([])} className="flex items-center gap-[12px] px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors">
                {box(selected.length === 0)}
                <span className={`font-normal leading-[20px] text-[14px] flex-1 ${selected.length === 0 ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>{allLabel}</span>
              </div>
            )}
            {shown.map((o) => {
              const isSelected = selected.includes(o);
              return (
                <div key={o} onClick={() => toggle(o)} className="flex items-center gap-[12px] px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors">
                  {box(isSelected)}
                  <span className={`font-normal leading-[20px] text-[14px] flex-1 ${isSelected ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>{o}</span>
                </div>
              );
            })}
            {shown.length === 0 && <div className="px-[16px] py-[10px] text-[14px] text-[#71747d]">No results</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Single-select pill dropdown, same look as the other filters (used outside the list page). */
export function PillSelect({ options, value, onChange, width = 200 }: {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const label = options.find((o) => o.value === value)?.label ?? '';

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="bg-white relative flex gap-[4px] items-center justify-center px-[12px] py-[8px] rounded-[18px]">
        <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[18px]" />
        <span className="font-normal leading-[22px] text-[#303135] text-[16px] text-nowrap relative">{label}</span>
        <ChevronDownIcon />
      </button>
      {open && (
        <div className="absolute top-[48px] left-0 bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-clip flex flex-col items-start py-[8px]" style={{ width }}>
          <div className="w-full max-h-[300px] overflow-y-auto">
            {options.map((o) => {
              const isSelected = o.value === value;
              return (
                <div
                  key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className="flex items-center justify-between px-[16px] py-[10px] w-full cursor-pointer hover:bg-[#f8f9fd] transition-colors"
                >
                  <span className={`font-normal leading-[20px] text-[14px] flex-1 ${isSelected ? 'text-[#007BFF] font-medium' : 'text-[#303135]'}`}>{o.label}</span>
                  {isSelected && (
                    <div className="bg-[#007BFF] rounded-full p-[2px] w-[20px] h-[20px] flex items-center justify-center shrink-0 ml-2">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  verticalFilter,
  onVerticalFilterChange,
  ratioFilter,
  onRatioFilterChange,
  sortBy,
  onSortChange,
  availableRatios,
  availableVerticals,
}: FilterBarProps) {
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort by';
  
  // Check if any filter is active
  const hasActiveFilters = verticalFilter.length > 0 || ratioFilter.length > 0;
  
  const handleClearAll = () => {
    onVerticalFilterChange([]);
    onRatioFilterChange([]);
  };

  return (
    // Left-side filters only; layout, pagination and view toggle come from ListToolbar
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

        <MultiSelectFilter allLabel="All Product" pluralLabel="Products" options={availableVerticals} selected={verticalFilter} onChange={onVerticalFilterChange} />
        <MultiSelectFilter allLabel="All Ratio" pluralLabel="Ratios" options={availableRatios} selected={ratioFilter} onChange={onRatioFilterChange} />
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-[6px] px-[12px] py-[6px] text-[#007BFF] hover:text-[#0056b3] text-[14px] font-medium transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
            <span>Clear All</span>
          </button>
        )}
    </>
  );
}
