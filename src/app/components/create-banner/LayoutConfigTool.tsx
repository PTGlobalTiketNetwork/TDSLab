import React from 'react';
import { BannerFormData, ContentTranslation } from './types';

interface LayoutConfigToolProps {
  formData: BannerFormData;
  currentContent: ContentTranslation;
}

export function LayoutConfigTool({ formData, currentContent }: LayoutConfigToolProps) {
  // Determine current nudge type
  const getNudgeType = () => {
    const prefix = currentContent.mainBenefitPrefix?.toLowerCase().trim();
    return prefix || 'none';
  };

  const currentNudgeType = getNudgeType();

  // Get nudge position if it exists
  const getNudgePosition = () => {
    if (!formData.elementPositions?.nudge) return null;
    return {
      x: formData.elementPositions.nudge.x,
      y: formData.elementPositions.nudge.y
    };
  };

  const nudgePosition = getNudgePosition();

  return (
    <div className="p-4 border-2 border-dashed border-red-300 rounded bg-red-50">
        <h3 className="font-bold text-red-600 mb-4 text-xs uppercase tracking-wider">Developer Tool: Layout Configuration</h3>
        <p className="text-[11px] text-red-500 mb-4">
            Use this to copy the current layout configuration. Adjust the layout in Live Preview (Unlocked), then copy the JSON below to set as defaults in code.
        </p>
        
        {/* Nudge Position Tracker */}
        {nudgePosition && currentNudgeType !== 'none' && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-xs text-amber-800">Nudge Position Tracker</span>
                    <span className="text-[10px] font-mono bg-amber-200 px-2 py-1 rounded">{currentNudgeType}</span>
                </div>
                <div className="relative group">
                    <pre className="text-[10px] bg-amber-100 text-amber-900 p-2 rounded font-mono">
                        {JSON.stringify({
                            nudgeType: currentNudgeType,
                            position: nudgePosition
                        }, null, 2)}
                    </pre>
                    <button 
                        onClick={() => {
                            const data = JSON.stringify({
                                nudgeType: currentNudgeType,
                                position: nudgePosition
                            }, null, 2);
                            navigator.clipboard.writeText(data);
                            alert(`Copied nudge position for: ${currentNudgeType}`);
                        }}
                        className="absolute top-2 right-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] px-2 py-1 rounded transition-colors"
                        type="button"
                    >
                        Copy Nudge
                    </button>
                </div>
                <p className="text-[9px] text-amber-700 mt-2 italic">
                    Switch between nudge types (discount, discount up to, up to, start from, etc.) and copy each position to set defaults.
                </p>
            </div>
        )}
        
        <div className="grid grid-cols-1 gap-4">
            {/* Mode 1 Config */}
            <div className={`p-3 border rounded ${!currentContent.hasSecondDiscount ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 opacity-60'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#303135]">Mode 1 (Single Discount)</span>
                    {!currentContent.hasSecondDiscount && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                {!currentContent.hasSecondDiscount ? (
                    <div className="relative group">
                        <pre className="text-[10px] h-40 overflow-auto bg-[#1e1e1e] text-[#a9b7c6] p-3 rounded font-mono leading-tight custom-scrollbar">
                            {JSON.stringify({
                                elementPositions: formData.elementPositions,
                                content: {
                                    headlineFontSize: currentContent.headlineFontSize,
                                    discountAmountFontSize: currentContent.discountAmountFontSize,
                                    currencyFontSize: currentContent.currencyFontSize,
                                    prefixFontSize: currentContent.prefixFontSize,
                                    additionalLabelFontSize: currentContent.additionalLabelFontSize,
                                    termsFontSize: currentContent.termsFontSize,
                                    showPrefix: currentContent.showPrefix,
                                    additionalLabel: currentContent.additionalLabel,
                                    termsAndCondition: currentContent.termsAndCondition,
                                }
                            }, null, 2)}
                        </pre>
                        <button 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify({
                                elementPositions: formData.elementPositions,
                                content: {
                                    headlineFontSize: currentContent.headlineFontSize,
                                    discountAmountFontSize: currentContent.discountAmountFontSize,
                                    currencyFontSize: currentContent.currencyFontSize,
                                    prefixFontSize: currentContent.prefixFontSize,
                                    additionalLabelFontSize: currentContent.additionalLabelFontSize,
                                    termsFontSize: currentContent.termsFontSize,
                                    showPrefix: currentContent.showPrefix,
                                    additionalLabel: currentContent.additionalLabel,
                                    termsAndCondition: currentContent.termsAndCondition,
                                }
                            }, null, 2))}
                            className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded transition-colors"
                            type="button"
                        >
                            Copy JSON
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500 italic p-4 text-center border-2 border-dashed rounded">
                    Switch to Single Discount mode to generate config
                    </div>
                )}
            </div>

            {/* Mode 2 Config */}
            <div className={`p-3 border rounded ${currentContent.hasSecondDiscount ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-100' : 'bg-gray-50 opacity-60'}`}>
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-sm text-[#303135]">Mode 2 (Double Discount)</span>
                    {currentContent.hasSecondDiscount && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">ACTIVE</span>}
                </div>
                {currentContent.hasSecondDiscount ? (
                    <div className="relative group">
                        <pre className="text-[10px] h-40 overflow-auto bg-[#1e1e1e] text-[#a9b7c6] p-3 rounded font-mono leading-tight custom-scrollbar">
                            {JSON.stringify({
                                elementPositions: formData.elementPositions,
                                content: {
                                    headlineFontSize: currentContent.headlineFontSize,
                                    discountAmountFontSize: currentContent.discountAmountFontSize,
                                    currencyFontSize: currentContent.currencyFontSize,
                                    prefixFontSize: currentContent.prefixFontSize,
                                    plusFontSize: currentContent.plusFontSize,
                                    additionalLabelFontSize: currentContent.additionalLabelFontSize,
                                    termsFontSize: currentContent.termsFontSize,
                                    showPrefix: currentContent.showPrefix,
                                    additionalLabel: currentContent.additionalLabel,
                                    termsAndCondition: currentContent.termsAndCondition,
                                }
                            }, null, 2)}
                        </pre>
                        <button 
                            onClick={() => navigator.clipboard.writeText(JSON.stringify({
                                elementPositions: formData.elementPositions,
                                content: {
                                    headlineFontSize: currentContent.headlineFontSize,
                                    discountAmountFontSize: currentContent.discountAmountFontSize,
                                    currencyFontSize: currentContent.currencyFontSize,
                                    prefixFontSize: currentContent.prefixFontSize,
                                    plusFontSize: currentContent.plusFontSize,
                                    additionalLabelFontSize: currentContent.additionalLabelFontSize,
                                    termsFontSize: currentContent.termsFontSize,
                                    showPrefix: currentContent.showPrefix,
                                    additionalLabel: currentContent.additionalLabel,
                                    termsAndCondition: currentContent.termsAndCondition,
                                }
                            }, null, 2))}
                            className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white text-[10px] px-2 py-1 rounded transition-colors"
                            type="button"
                        >
                            Copy JSON
                        </button>
                    </div>
                ) : (
                    <div className="text-xs text-gray-500 italic p-4 text-center border-2 border-dashed rounded">
                    Enable "Discount Amount 2" to generate config
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}