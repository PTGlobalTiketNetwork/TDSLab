import { Banner } from '../../types/banner';

/** Resolve a banner's category from `category`, falling back to form_data.bannerCategory. */
export function getBannerCategory(banner: Banner): string {
  const fd = banner.form_data as { bannerCategory?: string } | null | undefined;
  return banner.category || fd?.bannerCategory || 'Promo Banner';
}

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="inline-flex shrink-0 items-center bg-[#e7f2ff] text-[#007bff] text-[12px] font-bold leading-[16px] rounded-[6px] px-[8px] py-[2px] whitespace-nowrap"
      style={{ fontFamily: "'Tiket Odyssey Text', sans-serif" }}
    >
      {category}
    </span>
  );
}
