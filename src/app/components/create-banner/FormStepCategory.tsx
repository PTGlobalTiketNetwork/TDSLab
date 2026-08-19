import { BannerFormData } from './types';

interface FormStepCategoryProps {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
}

export function FormStepCategory({ formData, onChange }: FormStepCategoryProps) {
  // Banner Categories
  const bannerCategories = [
    { 
      id: 'Promo Banner', 
      label: 'Promo Banner', 
      description: 'Standard promotional banner with vertical themes.',
      active: true,
    },
    { 
      id: 'Homepage Promo Banner', 
      label: 'Homepage Promo Banner', 
      description: 'Full width banner for homepage campaigns.',
      active: false,
    },
    { 
      id: 'Hero Landing Page Header', 
      label: 'Hero Landing Page Header', 
      description: 'Large header for landing pages.',
      active: false,
    },
    { 
      id: 'Product Entry Point', 
      label: 'Product Entry Point', 
      description: 'Small entry points for specific products.',
      active: true,
    },
  ];

  return (
    <div className="flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[4px]">
         <h3 className="text-[16px] font-bold text-[#303135]">Select Banner Category</h3>
         <p className="text-[14px] text-[#71747d]">Choose the type of banner you want to create.</p>
      </div>

      <div className="flex flex-col gap-[12px]">
        {bannerCategories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => cat.active && onChange({ bannerCategory: cat.id as any })}
            className={`
              relative flex flex-col p-[16px] rounded-[12px] border cursor-pointer transition-all
              ${formData.bannerCategory === cat.id 
                ? 'border-[#007BFF] bg-[#f2f7fd] shadow-sm ring-1 ring-[#007BFF]' 
                : cat.active 
                  ? 'border-[#e9ebef] bg-white hover:border-[#b0b3b9] hover:shadow-sm' 
                  : 'border-[#e9ebef] bg-[#f8f9fd] cursor-not-allowed opacity-60'}
            `}
          >
            <div className="flex justify-between items-center">
              <div className="flex flex-col gap-[4px]">
                <span className={`text-[16px] font-bold ${cat.active ? 'text-[#303135]' : 'text-[#71747d]'}`}>
                  {cat.label}
                </span>
                <p className="text-[14px] text-[#71747d] leading-[1.4]">
                  {cat.description}
                </p>
              </div>

              {!cat.active && (
                 <span className="text-[10px] px-[8px] py-[4px] bg-[#e9ebef] rounded-[4px] text-[#71747d] font-bold ml-4 whitespace-nowrap">WIP</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
