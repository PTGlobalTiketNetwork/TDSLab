import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import chevronPaths from '../../../../imports/svg-dropdown-chevron';
import iconPaths from '../../../../imports/svg-dropdown-icons';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';

interface Option {
  id: string;
  label: string;
}

interface DropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onAddNew?: () => void;
  /** Shows a sticky "Upload new logo" row; receives the current search text (to prefill the asset name). */
  onUploadNew?: (searchText: string) => void;
  uploadNewLabel?: string;
  placeholder?: string;
  disableSearch?: boolean;
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

export function DropdownSelect({
  options,
  value,
  onChange,
  onAddNew,
  onUploadNew,
  uploadNewLabel = 'Upload new logo',
  placeholder = "Select option",
  disableSearch = false
}: DropdownSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);
  
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="w-full">
      {/* Trigger Box */}
      <PopoverTrigger asChild>
      <button type="button" className="bg-white relative rounded-[8px] shrink-0 w-full cursor-pointer text-left">
        <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
            <div className="content-stretch flex flex-col grow items-start overflow-clip relative shrink-0 min-w-0">
               {selectedOption ? (
                  <>
                   <p className="font-sans leading-[1.34] text-[#71747d] text-[12px] w-full overflow-hidden text-ellipsis whitespace-nowrap">
                     {placeholder}
                   </p>
                   <p className="font-sans leading-[1.43] text-[14px] w-full overflow-hidden text-ellipsis whitespace-nowrap text-[#303135]">
                     {selectedOption.label}
                   </p>
                  </>
               ) : (
                  <p className="font-sans leading-[1.43] text-[#71747d] text-[14px] w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {placeholder}
                  </p>
               )}
            </div>
            <TdsIcChevronDown />
          </div>
        </div>
      </button>
      </PopoverTrigger>
      
      {/* Helper text from Figma design */}
      {/* The helper text is outside the box in the Figma import, so I'll leave it to the parent if needed, 
          but the Figma import included it. The user snippet selected ONLY the select element, so I won't add helper text here. */}

      {/* Dropdown Menu */}
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        onOpenAutoFocus={(event) => {
          if (!disableSearch) {
            event.preventDefault();
            searchInputRef.current?.focus();
          }
        }}
        className="w-[var(--radix-popover-trigger-width)] max-h-[var(--radix-popover-content-available-height)] overflow-hidden rounded-[12px] border-0 bg-white p-0 shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)]"
      >
        <div className="flex max-h-[var(--radix-popover-content-available-height)] flex-col overflow-hidden pb-[8px]">
          
          {/* Search Box */}
          {!disableSearch && (
          <div className="shrink-0 p-[12px]">
            <div className="bg-[#f4f7fe] relative rounded-[100px] w-full flex items-center px-[12px] py-[10px] gap-[8px]">
              <TdsIcSearch />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent border-none outline-none text-[16px] text-[#303135] placeholder:text-[#71747d] w-full font-['Tiket_Odyssey_Text:Regular',sans-serif]"
              />
            </div>
          </div>
          )}

          {/* Options List */}
          <div className="min-h-0 max-h-[240px] flex-1 overflow-y-auto custom-scrollbar">
            {onUploadNew && filteredOptions.length === 0 && (
              <div className="px-[12px] py-[12px] text-[14px] text-[#71747d]" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}>
                {searchQuery.trim() ? `No results for "${searchQuery.trim()}"` : 'No logos yet'}
              </div>
            )}
            {filteredOptions.map((option) => (
              <div
                key={option.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-[12px] py-[12px] hover:bg-[#f4f7fe] cursor-pointer"
              >
                <span className="text-[16px] text-[#303135] font-sans leading-[1.38]">
                  {option.label}
                </span>
                {value === option.id && <TdsIcOvalCheck />}
              </div>
            ))}
            
            {/* Add New Option */}
            {onAddNew && (
              <div
                onClick={() => {
                  onAddNew();
                  // Don't close immediately, or do? User said "popup", so probably fine to keep open or close.
                  // Usually close and open modal.
                  setIsOpen(false); 
                }}
                className="flex items-center gap-[4px] px-[12px] py-[12px] hover:bg-[#f4f7fe] cursor-pointer"
              >
                <span className="text-[16px] text-[#303135] font-sans leading-[1.38]">
                  + Add New
                </span>
              </div>
            )}
          </div>

          {onUploadNew && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onUploadNew(searchQuery.trim());
                setIsOpen(false);
                setSearchQuery('');
              }}
              className="flex items-center gap-[8px] px-[12px] pt-[12px] pb-[4px] border-t border-[#e9ebef] hover:bg-[#f4f7fe] cursor-pointer text-[#007BFF]"
              style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
            >
              <Upload size={16} />
              <span className="text-[14px] font-bold leading-[1.43]">{uploadNewLabel}</span>
            </div>
          )}
        </div>
      </PopoverContent>
      </div>
    </Popover>
  );
}
