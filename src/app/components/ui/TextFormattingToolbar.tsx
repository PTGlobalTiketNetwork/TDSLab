import { Slider } from './slider';
import { QuantityInput } from './QuantityInput';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { useState } from 'react';
import { ChevronDown, PaintBucket, Pipette, AlignVerticalSpaceAround, RotateCw } from 'lucide-react';

interface TextFormattingToolbarProps {
  activeWeight: string | null;
  onWeightChange: (weight: string) => void;
  fontSize?: number;
  onFontSizeChange?: (size: number) => void;
  minFontSize?: number;
  maxFontSize?: number;
  className?: string;
  activeColor?: string | null;
  onColorChange?: (color: string) => void;
  activeItalic?: boolean;
  onItalicToggle?: () => void;
  lineHeight?: number; // percent, undefined = auto
  onLineHeightChange?: (value: number | undefined) => void;
}

export function TextFormattingToolbar({
  activeWeight,
  onWeightChange,
  fontSize,
  onFontSizeChange,
  minFontSize = 12,
  maxFontSize = 100,
  className,
  activeColor,
  onColorChange,
  activeItalic,
  onItalicToggle,
  lineHeight,
  onLineHeightChange
}: TextFormattingToolbarProps) {
  const [customHex, setCustomHex] = useState('');

  const colors = [
    { name: 'White', value: '#FFFFFF' },
    { name: 'Tiket Blue', value: '#0064D2' },
    { name: 'Yellow', value: '#FFD600' },
    { name: 'Black', value: '#000000' }
  ];

  return (
    <div className={`flex items-center justify-between px-[8px] py-[6px] border-b border-[#f0f2f5] bg-[#f8f9fd] ${className || ''}`}>
         {/* Left: Font Weight Controls */}
         <div className="flex items-center gap-[4px]">
             <button
                 type="button"
                 onClick={() => onWeightChange('sb')}
                 className={`px-3 py-1.5 rounded text-[12px] font-semibold transition-colors ${
                     activeWeight === 'sb'
                     ? 'bg-[#E3EFFB] text-[#007BFF]'
                     : 'hover:bg-[#e9ebef] text-[#5e6066]'
                 }`}
                 title="Semi Bold"
             >
                 SemiBold
             </button>
             <button
                 type="button"
                 onClick={() => onWeightChange('b')}
                 className={`px-3 py-1.5 rounded text-[12px] font-bold transition-colors ${
                     activeWeight === 'b'
                     ? 'bg-[#E3EFFB] text-[#007BFF]'
                     : 'hover:bg-[#e9ebef] text-[#5e6066]'
                 }`}
                 title="Bold"
             >
                 Bold
             </button>
             <button
                 type="button"
                 onClick={() => onWeightChange('eb')}
                 className={`px-3 py-1.5 rounded text-[12px] font-extrabold transition-colors ${
                     activeWeight === 'eb'
                     ? 'bg-[#E3EFFB] text-[#007BFF]'
                     : 'hover:bg-[#e9ebef] text-[#5e6066]'
                 }`}
                 title="Extra Bold"
             >
                 ExtraBold
             </button>

             {/* Italic Toggle */}
             {onItalicToggle && (
               <button
                   type="button"
                   onClick={onItalicToggle}
                   className={`px-3 py-1.5 rounded text-[12px] italic transition-colors ${
                       activeItalic
                       ? 'bg-[#E3EFFB] text-[#007BFF]'
                       : 'hover:bg-[#e9ebef] text-[#5e6066]'
                   }`}
                   title="Italic"
                   style={{ fontFamily: 'serif' }}
               >
                   I
               </button>
             )}

             {/* Color Picker */}
             {onColorChange && (
               <>
                 <div className="w-[1px] h-[20px] bg-[#d8dce8] mx-1"></div>
                 <Popover>
                   <PopoverTrigger asChild>
                     <button 
                       className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#e9ebef] transition-colors"
                       title="Text Color"
                     >
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300 shadow-sm" 
                          style={{ backgroundColor: activeColor || '#000000' }}
                        />
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                     </button>
                   </PopoverTrigger>
                   <PopoverContent className="w-64 p-3" align="start">
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-4 gap-2">
                          {colors.map((c) => (
                            <button
                              key={c.value}
                              className={`w-8 h-8 rounded-full border shadow-sm transition-transform hover:scale-110 ${activeColor === c.value ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-200'}`}
                              style={{ backgroundColor: c.value }}
                              onClick={() => onColorChange(c.value)}
                              title={c.name}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <span className="text-xs text-gray-500 font-medium">Hex</span>
                          <div className="flex items-center flex-1 border rounded px-2 py-1 bg-white">
                            <span className="text-gray-400 text-xs mr-1">#</span>
                            <input 
                              type="text" 
                              className="w-full text-xs outline-none font-mono"
                              placeholder="000000"
                              maxLength={6}
                              value={customHex.replace('#', '')}
                              onChange={(e) => setCustomHex(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  let val = customHex;
                                  if (!val.startsWith('#')) val = '#' + val;
                                  if (/^#[0-9A-F]{6}$/i.test(val)) {
                                    onColorChange(val);
                                  }
                                }
                              }}
                              onBlur={() => {
                                if (customHex) {
                                  let val = customHex;
                                  if (!val.startsWith('#')) val = '#' + val;
                                  if (/^#[0-9A-F]{6}$/i.test(val)) {
                                    onColorChange(val);
                                  }
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                   </PopoverContent>
                 </Popover>
               </>
             )}

             {/* Vertical Spacing (line-height) */}
             {onLineHeightChange && (
               <>
                 <div className="w-[1px] h-[20px] bg-[#d8dce8] mx-1"></div>
                 <Popover>
                   <PopoverTrigger asChild>
                     <button
                       type="button"
                       className="flex items-center gap-1.5 px-2 py-1.5 rounded hover:bg-[#e9ebef] transition-colors text-[#5e6066]"
                       title="Vertical spacing"
                     >
                        <AlignVerticalSpaceAround className="w-4 h-4" />
                        <span className="text-[12px] font-medium">{typeof lineHeight === 'number' ? `${lineHeight}%` : 'Auto'}</span>
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                     </button>
                   </PopoverTrigger>
                   <PopoverContent className="w-56 p-3" align="start">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">Vertical spacing</span>
                          <button
                            type="button"
                            onClick={() => onLineHeightChange(undefined)}
                            className="flex items-center gap-1 text-[11px] font-medium text-[#71747d] hover:text-[#007BFF] transition-colors"
                            title="Reset to Auto"
                          >
                            <RotateCw size={11} /> Auto
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[typeof lineHeight === 'number' ? lineHeight : 100]}
                            min={80}
                            max={150}
                            step={5}
                            onValueChange={(vals) => onLineHeightChange(vals[0])}
                            className="w-full [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                          />
                          <span className="text-[12px] text-[#303135] font-medium w-[42px] text-right">{typeof lineHeight === 'number' ? `${lineHeight}%` : 'Auto'}</span>
                        </div>
                      </div>
                   </PopoverContent>
                 </Popover>
               </>
             )}
         </div>

         {/* Right: Font Size Controls */}
         {typeof fontSize === 'number' && onFontSizeChange && (
             <div className="flex items-center gap-3">
                 {/* Divider */}
                 <div className="w-[1px] h-[20px] bg-[#d8dce8]"></div>

                 <span className="text-[12px] text-[#71747d] font-medium">Size</span>
                 <Slider
                     value={[fontSize]}
                     min={minFontSize}
                     max={maxFontSize}
                     step={1}
                     onValueChange={(vals) => onFontSizeChange(vals[0])}
                     className="w-[100px] [&_[data-slot=slider-range]]:bg-[#007BFF] [&_[data-slot=slider-thumb]]:border-[#007BFF]"
                 />
                 <QuantityInput
                     value={fontSize}
                     min={minFontSize}
                     max={maxFontSize}
                     onChange={onFontSizeChange}
                     className="h-8"
                 />
             </div>
         )}
    </div>
  );
}
