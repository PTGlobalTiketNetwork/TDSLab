import { BannerFormData } from './types';
import { Radio } from './components/Radio';
import { StyledInput } from './components/FormElements';
import { cn } from '../ui/utils';
import { DropdownSelect } from './components/DropdownSelect';
import { useState } from 'react';
import { AddCategoryDialog } from './components/AddCategoryDialog';

interface FormStepConfigProps {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
  error?: string;
  validationState?: {
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  };
  onValidateName?: (name: string) => void;
  isEditMode?: boolean;
}

export function FormStepConfig({ formData, onChange, error, validationState, onValidateName, isEditMode = false }: FormStepConfigProps) {
  // Vertical Categories for Promo Banner
  // Use state but initialize safely. We can memoize if needed but state is fine.
  const [verticalCategories, setVerticalCategories] = useState([
    { id: 'General', label: 'General' },
    { id: 'Hotel', label: 'Hotel' },
    { id: 'Transport', label: 'Transport' },
    { id: 'ToDos', label: 'ToDos' },
    { id: 'Event', label: 'Event' },
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleAddNewVertical = () => {
    setIsAddDialogOpen(true);
  };

  const onAddCategory = (newCategory: string) => {
      const id = newCategory.trim();
      const label = newCategory.trim();
      
      // Check if already exists
      if (!verticalCategories.find(v => v.id.toLowerCase() === id.toLowerCase())) {
        setVerticalCategories([...verticalCategories, { id, label }]);
        // Automatically select the new category
        onChange({ verticalCategory: id as any });
      }
  };

  // Banner Styles
  const bannerStyles = [
    'Style 1 (Regular promo campaign)',
    'Style 2 (Thematic/tactical campaign)',
    'Style 3 (Flagship/big campaign)'
  ];

  // Banner Ratios
  const bannerRatios = [
    'Landscape (2:1)',
    'Square (1:1)',
    'Portrait (3:4)'
  ];

  // Logic to determine if fields are locked in Edit Mode
  // Product Entry Point allows changing fields even in Edit Mode
  const isLocked = isEditMode && formData.bannerCategory !== 'Product Entry Point';

  const handleRatioChange = (ratio: string) => {
    let newFontSize = 14; // Default for 5:2 and 2:1
    let updates: Partial<BannerFormData> = { bannerRatio: ratio as any };

    if (ratio === 'Mobile (4:1)') {
      newFontSize = 11;
      updates.entryPointVariant = 'with_cta';
    } else if (ratio === 'Mobile (2:1 WhatsApp)') {
      newFontSize = 12;
      updates.entryPointVariant = 'default';
    } else if (ratio === 'Desktop (5:1)') {
      newFontSize = 16;
      updates.entryPointVariant = 'with_cta';
    } else if (ratio === 'Desktop (8:1)') {
      newFontSize = 13;
      updates.entryPointVariant = 'with_cta';
    }

    // Update font size for both languages immediately
    if (formData.content) {
      updates.content = {
        en: {
          ...formData.content.en,
          headlineFontSize: newFontSize
        },
        id: {
          ...formData.content.id,
          headlineFontSize: newFontSize
        }
      };
    }

    onChange(updates);
  };

  // If not Promo Banner or Product Entry Point, show placeholder
  if (formData.bannerCategory !== 'Promo Banner' && formData.bannerCategory !== 'Product Entry Point') {
      // Display-only override — internal bannerCategory value stays unchanged.
      const categoryDisplayLabels: Record<string, string> = {
          'Hero Landing Page Header': 'Hero LP Header',
      };
      const categoryLabel = categoryDisplayLabels[formData.bannerCategory] || formData.bannerCategory;
      return (
          <div className="flex flex-col items-center justify-center h-[300px] text-center text-[#71747d] bg-[#f8f9fd] rounded-[8px] border border-dashed border-[#d8dce8]">
              <p>Configuration for <strong>{categoryLabel}</strong> is currently under development.</p>
          </div>
      );
  }

  // --- PRODUCT ENTRY POINT FLOW ---
  if (formData.bannerCategory === 'Product Entry Point') {
      return (
          <div className="flex flex-col gap-[32px] pb-[24px]">
              
              {/* Banner Name */}
              <div className="flex flex-col gap-[8px] w-full">
                  <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Banner Name</label>
                  <div className="relative w-full">
                      <StyledInput
                          type="text"
                          value={formData.bannerName}
                          onChange={(e) => onChange({ bannerName: e.target.value })}
                          placeholder="Enter banner name"
                          className={cn(
                              error && "border-[#ff5c5c] ring-1 ring-[#ff5c5c] focus:border-[#ff5c5c] focus:ring-[#ff5c5c]",
                              "pr-10" 
                          )}
                      />
                      {/* Validation Icons */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {validationState?.status === 'valid' && (
                              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                          )}
                          {validationState?.status === 'invalid' && (
                              <svg className="h-5 w-5 text-[#ff5c5c]" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                          )}
                      </div>
                  </div>
                  {error && (
                      <span className="text-[12px] text-[#ff5c5c] leading-[16px]">{error}</span>
                  )}
              </div>

              {/* Vertical Category (Dropdown) - Added for Validation */}
              <div className="flex flex-col gap-[8px] w-full">
                  <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Vertical</label>
                  <DropdownSelect
                    options={verticalCategories}
                    value={formData.verticalCategory}
                    onChange={(value) => onChange({ verticalCategory: value as any })}
                    placeholder="Select vertical"
                  />
              </div>

              <div className="w-full h-[1px] bg-[#e9ebef]" />

              {/* Platform Selection */}
              <div className="flex flex-col gap-[12px] w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Platform</label>
                  <div className="flex gap-[16px]">
                      <Radio
                          name="platform"
                          checked={formData.platform === 'Mobile'}
                          onChange={() => onChange({ platform: 'Mobile' })}
                      >
                          <span className="text-[14px] text-[#303135]">Mobile App</span>
                      </Radio>
                      <Radio
                          name="platform"
                          checked={formData.platform === 'Desktop'}
                          onChange={() => onChange({ platform: 'Desktop' })}
                      >
                          <span className="text-[14px] text-[#303135]">Desktop / Mobile Web</span>
                      </Radio>
                  </div>
              </div>

              {/* Ratio Selection */}
              {formData.platform && (
              <div className="flex flex-col gap-[12px] w-full animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Ratio</label>
                  <div className="flex gap-[16px] flex-wrap">
                      {formData.platform === 'Mobile' ? (
                          <>
                              <Radio
                                  name="ratio-mobile"
                                  checked={formData.bannerRatio === 'Mobile (5:2)'}
                                  onChange={() => handleRatioChange('Mobile (5:2)')}
                              >
                                  <span className="text-[14px] text-[#303135]">5:2 (Compact)</span>
                              </Radio>
                              <Radio
                                  name="ratio-mobile-2-1"
                                  checked={formData.bannerRatio === 'Mobile (2:1)'}
                                  onChange={() => handleRatioChange('Mobile (2:1)')}
                              >
                                  <span className="text-[14px] text-[#303135]">2:1 (Standard)</span>
                              </Radio>
                              <Radio
                                  name="ratio-mobile-4-1"
                                  checked={formData.bannerRatio === 'Mobile (4:1)'}
                                  onChange={() => handleRatioChange('Mobile (4:1)')}
                              >
                                  <span className="text-[14px] text-[#303135]">4:1 (Slim)</span>
                              </Radio>
                              <Radio
                                  name="ratio-mobile-2-1-whatsapp"
                                  checked={formData.bannerRatio === 'Mobile (2:1 WhatsApp)'}
                                  onChange={() => handleRatioChange('Mobile (2:1 WhatsApp)')}
                              >
                                  <span className="text-[14px] text-[#303135]">2:1 (WhatsApp)</span>
                              </Radio>
                          </>
                      ) : (
                         <>
                              <Radio
                                  name="ratio-desktop-5-1"
                                  checked={formData.bannerRatio === 'Desktop (5:1)'}
                                  onChange={() => handleRatioChange('Desktop (5:1)')}
                              >
                                  <span className="text-[14px] text-[#303135]">5:1 (Ultra Wide)</span>
                              </Radio>
                              <Radio
                                  name="ratio-desktop-8-1"
                                  checked={formData.bannerRatio === 'Desktop (8:1)'}
                                  onChange={() => handleRatioChange('Desktop (8:1)')}
                              >
                                  <span className="text-[14px] text-[#303135]">8:1 (Strip)</span>
                              </Radio>
                         </>
                      )}
                  </div>
              </div>
              )}

              {/* Variant Selection */}
              {(formData.bannerRatio === 'Mobile (5:2)' || formData.bannerRatio === 'Mobile (2:1)' || formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (8:1)') && (
                  <div className="flex flex-col gap-[12px] w-full animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Variant</label>
                      <div className="flex gap-[16px]">
                          <Radio
                              name="variant"
                              checked={formData.entryPointVariant === 'with_cta'}
                              onChange={() => onChange({ entryPointVariant: 'with_cta' })}
                          >
                              <span className="text-[14px] text-[#303135]">With CTA Button</span>
                          </Radio>
                          <Radio
                              name="variant"
                              checked={formData.entryPointVariant === 'no_cta'}
                              onChange={() => onChange({ entryPointVariant: 'no_cta' })}
                          >
                              <span className="text-[14px] text-[#303135]">No CTA (Text Only)</span>
                          </Radio>
                      </div>
                  </div>
              )}

          </div>
      );
  }

  const isLandscape = formData.bannerRatio === 'Landscape (2:1)';

  return (
    <div className="flex flex-col gap-[32px] pb-[24px]">
      
      {/* Banner Name */}
      <div className="flex flex-col gap-[8px] w-full">
        <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Banner Name</label>
        <div className="relative w-full">
          <StyledInput
            type="text"
            value={formData.bannerName}
            onChange={(e) => onChange({ bannerName: e.target.value })}
            placeholder="Enter banner name"
            className={cn(
                error && "border-[#ff5c5c] ring-1 ring-[#ff5c5c] focus:border-[#ff5c5c] focus:ring-[#ff5c5c]",
                "pr-10" // Space for icon
            )}
          />
          {/* Validation Icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
             {validationState?.status === 'valid' && (
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
             )}
             {validationState?.status === 'invalid' && (
                <svg className="h-5 w-5 text-[#ff5c5c]" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
             )}
          </div>
        </div>
        {error && (
            <span className="text-[12px] text-[#ff5c5c] leading-[16px]">{error}</span>
        )}
      </div>

      <div className="w-full h-[1px] bg-[#e9ebef]" />

      {/* Vertical Category (Dropdown) */}
      <div className="flex flex-col gap-[8px] w-full">
          <label className="text-[14px] font-bold leading-[20px] text-[#303135]">Vertical</label>
          <DropdownSelect
            options={verticalCategories}
            value={formData.verticalCategory}
            onChange={(value) => onChange({ verticalCategory: value as any })}
            // onAddNew={handleAddNewVertical} // Disabled for now
            placeholder="Select vertical"
          />
      </div>

      {/* Banner Ratio */}
       <div className="flex flex-col gap-[12px] w-full">
          <label className="text-[14px] font-bold leading-[20px] text-[#303135]">
              Banner Ratio
              {isLocked && <span className="ml-2 text-[12px] font-normal text-[#71747d]">(Cannot be changed in edit mode)</span>}
          </label>
          <div className="flex gap-[16px]" title={isLocked ? "Cannot change layout structure in Edit mode. Please create a new banner." : ""}>
              {bannerRatios.map((ratio) => {
                  const isAvailable = ratio === 'Landscape (2:1)' || ratio === 'Square (1:1)' || ratio === 'Portrait (3:4)';
                  const isDisabled = !isAvailable || isLocked;
                  return (
                    <div key={ratio} className={isLocked ? "opacity-60 cursor-not-allowed" : ""}>
                        <Radio
                            name="bannerRatio"
                            checked={formData.bannerRatio === ratio}
                            onChange={() => !isDisabled && onChange({ bannerRatio: ratio as any })}
                            disabled={isDisabled}
                            className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                        >
                            <span className="text-[14px] text-[#303135]">{ratio}</span>
                        </Radio>
                    </div>
                  );
              })}
          </div>
      </div>

      {/* Layout Style (Conditional - Only for Landscape) */}
      {isLandscape && (
          <div className="flex flex-col gap-[12px] w-full">
              <label className="text-[14px] font-bold leading-[20px] text-[#303135]">
                  Layout Style
                  {isLocked && <span className="ml-2 text-[12px] font-normal text-[#71747d]">(Cannot be changed in edit mode)</span>}
              </label>
              <div className="flex flex-col gap-[12px]" title={isLocked ? "Cannot change layout structure in Edit mode. Please create a new banner." : ""}>
                  {bannerStyles.map((style) => {
                      const isAvailable = style === 'Style 1 (Regular promo campaign)';
                      const isDisabled = !isAvailable || isLocked;
                      return (
                        <div key={style} className={isLocked ? "opacity-60 cursor-not-allowed" : ""}>
                            <Radio
                                name="bannerStyle"
                                checked={formData.bannerStyle === style}
                                onChange={() => !isDisabled && onChange({ bannerStyle: style as any })}
                                disabled={isDisabled}
                                className={isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                            >
                                <span className="text-[14px] text-[#303135]">{style}</span>
                            </Radio>
                        </div>
                      );
                  })}
              </div>
          </div>
      )}

      <AddCategoryDialog 
        isOpen={isAddDialogOpen} 
        onClose={() => setIsAddDialogOpen(false)} 
        onAdd={onAddCategory} 
      />

    </div>
  );
}