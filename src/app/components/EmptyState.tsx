import { ImageWithFallback } from './figma/ImageWithFallback';
import imgNoResult from "figma:asset/aad170de85df6fb4c68c5d99a55c7c842b2416dd.png";
import TdsSiGeneralError from '../../imports/TdsSiGeneralError404-2031-7672';

interface EmptyStateProps {
  type?: 'search' | 'empty';
}

export function EmptyState({ type = 'empty' }: EmptyStateProps) {
  if (type === 'search') {
    return (
      <div className="flex flex-col items-center justify-center py-[80px] px-[40px]">
        {/* Illustration */}
        <div className="w-[360px] h-[240px] mb-6">
          <img
            src={imgNoResult}
            alt="No results"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text */}
        <h3 className="text-[24px] font-bold text-[#303135] mb-2">
          Sorry no result
        </h3>
        <p className="text-[14px] text-[#71747d] text-center">
          Please try another assets name or key.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-[80px] px-[40px]">
      {/* Illustration */}
      <div className="w-[360px] h-[240px] mb-6">
        <TdsSiGeneralError />
      </div>

      {/* Text */}
      <h3 className="text-[24px] font-bold text-[#303135] mb-2">
        Nothing to see here
      </h3>
      <p className="text-[14px] text-[#71747d] text-center max-w-[400px]">
        Get started by creating a new banner or adding a new asset.
      </p>
    </div>
  );
}
