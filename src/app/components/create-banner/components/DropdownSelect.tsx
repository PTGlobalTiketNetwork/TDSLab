import { useState, useRef, useEffect } from 'react';
import chevronPaths from '../../../../imports/svg-dropdown-chevron';
import iconPaths from '../../../../imports/svg-dropdown-icons';

interface Option {
  id: string;
  label: string;
}

interface DropdownSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onAddNew?: () => void;
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
  placeholder = "Select option",
  disableSearch = false
}: DropdownSelectProps) {
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
    <div className="relative w-full" ref={dropdownRef}>
      {/* Trigger Box */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white relative rounded-[8px] shrink-0 w-full cursor-pointer"
      >
        <div className="absolute border border-[#d8dce8] border-solid inset-0 pointer-events-none rounded-[8px]" />
        <div className="flex flex-row items-center size-full">
          <div className="content-stretch flex gap-[12px] items-center px-[16px] py-[12px] relative w-full">
            <div className="content-stretch flex flex-col grow items-start overflow-clip relative shrink-0">
               {selectedOption ? (
                  <>
                   {/* Placeholder small label if needed, but design shows just filled text or placeholder */}
                   {/* Based on attachment 2, if selected, it shows "Placeholder" as label and "Filled text" as value? 
                       Wait, the design "Text Group" in Forms02Dropdown shows "Placeholder" then "FilledText".
                       But commonly this is "Label" then "Value". 
                       The prompt screenshot 2 shows "Placeholder" (small) and "Filled text" (large).
                       Let's assume the top small text is the field label (which is outside this component in the parent form usually),
                       OR it's a floating label. 
                       However, the attachment 1 shows just "Placeholder".
                       The attachment 2 shows "Placeholder" (small) + "Filled text". 
                       This looks like a floating label or a value with label.
                       BUT the parent component `FormStepConfig` ALREADY has a label "Vertical".
                       So I should probably just show the Value.
                       Let's stick to the simpler "Value" only for now, or "Placeholder" if empty.
                       Actually, let's implement the "Text Group" from the Figma import if value is selected.
                   */}
                   {/* If I look at the `TextGroup` in Figma import:
                       Placeholder: text-[#71747d] text-[12px]
                       FilledText: text-[#303135] text-[14px]
                       
                       If I use this pattern:
                   */}
                   {selectedOption && (
                     <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.34] text-[#71747d] text-[12px] w-full overflow-hidden text-ellipsis whitespace-nowrap">
                       {placeholder}
                     </p>
                   )}
                   <p className={`font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.43] text-[14px] w-full ${selectedOption ? 'text-[#303135]' : 'text-[#71747d]'}`}>
                     {selectedOption ? selectedOption.label : placeholder}
                   </p>
                  </>
               ) : (
                  <p className="font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.43] text-[#71747d] text-[14px] w-full">
                    {placeholder}
                  </p>
               )}
            </div>
            <TdsIcChevronDown />
          </div>
        </div>
      </div>
      
      {/* Helper text from Figma design */}
      {/* The helper text is outside the box in the Figma import, so I'll leave it to the parent if needed, 
          but the Figma import included it. The user snippet selected ONLY the select element, so I won't add helper text here. */}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] z-50 overflow-hidden flex flex-col pb-[8px]">
          
          {/* Search Box */}
          {!disableSearch && (
          <div className="p-[12px]">
            <div className="bg-[#f4f7fe] relative rounded-[100px] w-full flex items-center px-[12px] py-[10px] gap-[8px]">
              <TdsIcSearch />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="bg-transparent border-none outline-none text-[16px] text-[#303135] placeholder:text-[#71747d] w-full font-['Tiket_Odyssey_Text:Regular',sans-serif]"
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
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className="flex items-center justify-between px-[12px] py-[12px] hover:bg-[#f4f7fe] cursor-pointer"
              >
                <span className="text-[16px] text-[#303135] font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38]">
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
                <span className="text-[16px] text-[#303135] font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[1.38]">
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
