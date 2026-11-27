import { Image as ImageIcon } from 'lucide-react';
import type { BannerFormData } from '../create-banner/types';
import { TTD_ICON_GRADIENT, TTD_ICON_EDITOR_SIZE } from '../../utils/bannerCapture';

/** Read-only TTD Brand Icon: gradient circle + logo at its saved offset/scale (offsets are stored against the 140px editor). */
export function TtdBrandIconPreview({ ttd, size }: { ttd: NonNullable<BannerFormData['ttd']>; size: number }) {
  const [bottom, top] = TTD_ICON_GRADIENT[ttd.verticalIconTheme || 'default'];
  const k = size / TTD_ICON_EDITOR_SIZE;
  return (
    <div
      className="relative rounded-full overflow-hidden flex items-center justify-center shrink-0"
      style={{ width: size, height: size, backgroundImage: `linear-gradient(to top, ${bottom}, ${top})` }}
    >
      {ttd.verticalIconUrl ? (
        <img
          src={ttd.verticalIconUrl}
          alt="Brand Icon"
          draggable={false}
          className="absolute left-1/2 top-1/2 w-[66%] h-[66%] object-contain"
          style={{ transform: `translate(-50%, -50%) translate(${(ttd.verticalIconOffsetX ?? 0) * k}px, ${(ttd.verticalIconOffsetY ?? 0) * k}px) scale(${(ttd.verticalIconScale ?? 100) / 100})` }}
        />
      ) : (
        <ImageIcon size={24} className="text-[#aeb2be]" />
      )}
    </div>
  );
}
