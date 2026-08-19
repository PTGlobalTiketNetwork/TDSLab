import { MetadataDiff } from '../../../../utils/metadataDiff';
import { Info } from 'lucide-react';

interface MetadataComparisonBarProps {
  diffs: MetadataDiff[];
  side: 'current' | 'remote';
}

export function MetadataComparisonBar({ diffs, side }: MetadataComparisonBarProps) {
  const changedDiffs = diffs.filter(d => d.hasChanged);

  if (changedDiffs.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <h6 className="font-bold text-[14px] text-[#303135]">
            Non-Visual Changes
          </h6>
        </div>

        <div className="space-y-2 ml-6">
          {changedDiffs.map((diff) => {
            const displayValue = side === 'current' ? diff.newValue : diff.oldValue;
            const otherValue = side === 'current' ? diff.oldValue : diff.newValue;

            return (
              <div key={diff.field} className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-[#71747d] text-xs uppercase">
                  {diff.label}
                </span>
                <div className="flex items-center gap-2">
                  {side === 'remote' && (
                    <>
                      <span className="text-[#303135] font-medium">
                        {String(displayValue || '—')}
                      </span>
                      <span className="text-[#71747d]">→</span>
                      <span className="font-semibold text-[#007BFF]">
                        {String(otherValue || '—')}
                      </span>
                    </>
                  )}
                  {side === 'current' && (
                    <>
                      <span className="line-through text-[#B0B3B8]">
                        {String(otherValue || '—')}
                      </span>
                      <span className="text-[#71747d]">→</span>
                      <span className="font-semibold text-[#007BFF]">
                        {String(displayValue || '—')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface MetadataOnlyChangesBannerProps {
  show: boolean;
}

export function MetadataOnlyChangesBanner({ show }: MetadataOnlyChangesBannerProps) {
  if (!show) return null;

  return (
    <div className="px-6 py-3 bg-amber-50 border-t border-b border-amber-200">
      <div className="flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <p className="text-[#71747d]">
          <span className="font-semibold text-[#303135]">Note:</span> Only metadata (Name/Vertical) was changed in this version. The visual design is identical.
        </p>
      </div>
    </div>
  );
}