/**
 * TiketSelect Component
 * 
 * Source of Truth: Vertical Category dropdown in FormStepConfig
 * 
 * Features:
 * - Custom dropdown with search functionality
 * - Rounded corners, hover states
 * - Check icon for selected option
 * - Optional "Add New" action
 * - Click outside to close
 * 
 * @example
 * <TiketSelect
 *   options={[
 *     { id: 'hotel', label: 'Hotel' },
 *     { id: 'flight', label: 'Flight' }
 *   ]}
 *   value="hotel"
 *   onChange={(value) => setCategory(value)}
 *   placeholder="Select vertical"
 * />
 */

import { useState, useRef, useEffect } from 'react';
import chevronPaths from '../../../imports/svg-dropdown-chevron';
import iconPaths from '../../../imports/svg-dropdown-icons';

export interface TiketSelectOption {
  id: string;
  label: string;
  render?: React.ReactNode; // Optional custom render for dropdown list
  renderSelected?: React.ReactNode; // Optional custom render for selected view
}

export interface TiketSelectProps {
  options: TiketSelectOption[];
  value: string;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  disabled?: boolean;
}

function TdsIcChevronDown() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={chevronPaths.p3504a860} fill="#4D4F56" />
      </svg>
    </div>
  );
}

function TdsIcSearch() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path clipRule="evenodd" d={iconPaths.p8aebd00} fill="#AEB2BE" fillRule="evenodd" />
      </svg>
    </div>
  );
}

function TdsIcOvalCheck() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path clipRule="evenodd" d={iconPaths.p2096e280} fill="#007BFF" fillRule="evenodd" />
      </svg>
    </div>
  );
}

export function TiketSelect({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = "Select option",
  className = "",
  showSearch = true,
  disabled = false
}: TiketSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.id === value);
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative w-full ${className} ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`} ref={dropdownRef}>
      {/* Trigger Box */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-white relative rounded-[8px] shrink-0 w-full ${disabled ? 'cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
      >
        <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
            <div className="content-stretch flex flex-col grow items-start overflow-hidden relative min-w-0">
               {selectedOption ? (
                  <>
                   <div className="leading-[1.34] text-[#71747d] text-[12px] w-full overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                     {placeholder}
                   </div>
                   <div className="leading-[1.43] text-[14px] w-full text-[#303135] overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                     {selectedOption.renderSelected ?? selectedOption.label}
                   </div>
                  </>
               ) : (
                  <div className="leading-[1.43] text-[#71747d] text-[14px] w-full overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                    {placeholder}
                  </div>
               )}
            </div>
            <TdsIcChevronDown />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-hidden flex flex-col pb-[8px]">
          
          {/* Search Box */}
          {showSearch && (
          <div className="p-[12px]">
            <div className="bg-[#f4f7fe] relative rounded-[100px] w-full flex items-center px-[12px] py-[10px] gap-[8px]">
              <TdsIcSearch />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent border-none outline-none text-[16px] text-[#303135] placeholder:text-[#71747d] w-full"
                style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}
                autoFocus
              />
            </div>
          </div>
          )}

          {/* Options List */}
          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-[12px] py-[12px] hover:bg-[#f4f7fe] cursor-pointer"
              >
                <span className="text-[16px] text-[#303135] leading-[1.38] w-full" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                  {option.render ?? option.label}
                </span>
                {value === option.id && <TdsIcOvalCheck />}
              </div>
            ))}

            {/* Empty State */}
            {filteredOptions.length === 0 && (
              <div className="px-[12px] py-[16px] text-[14px] leading-[1.43] text-[#71747d]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                No results found
              </div>
            )}

            {/* Add New Option */}
            {onAddNew && (
              <div
                onClick={() => {
                  onAddNew();
                  setIsOpen(false); 
                }}
                className="flex items-center gap-[4px] px-[12px] py-[12px] hover:bg-[#f4f7fe] cursor-pointer"
              >
                <span className="text-[16px] text-[#303135] leading-[1.38]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 400 }}>
                  + Add New
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
