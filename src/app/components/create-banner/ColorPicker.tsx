import { useState, useMemo, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { StyledInput } from './components/FormElements';
import { Button } from '../ui/button';
import { Search, Pipette } from 'lucide-react';

interface ColorToken {
  name: string;
  value: string;
  family: string;
}

export const colorTokens: ColorToken[] = [
  // Red
  { name: 'n900', value: '#18191B', family: 'Neutral' },
  { name: 'n800', value: '#303135', family: 'Neutral' },
  { name: 'n700', value: '#4D4F56', family: 'Neutral' },
  { name: 'n600', value: '#71747D', family: 'Neutral' },
  { name: 'n500', value: '#8C909E', family: 'Neutral' },
  { name: 'n400', value: '#AEB2BE', family: 'Neutral' },
  { name: 'n300', value: '#C0C3CF', family: 'Neutral' },
  { name: 'n200', value: '#D8DCE8', family: 'Neutral' },
  { name: 'n100', value: '#F4F7FE', family: 'Neutral' },
  { name: 'n50', value: '#F8F9FD', family: 'Neutral' },
  { name: 'n0', value: '#FFFFFF', family: 'Neutral' },
  { name: 'n0-80', value: '#FFFFFFCC', family: 'Neutral' },
  { name: 'black-80', value: '#000000CC', family: 'Neutral' },

  { name: 'b900', value: '#001833', family: 'Blue' },
  { name: 'b800', value: '#002A58', family: 'Blue' },
  { name: 'b700', value: '#003D81', family: 'Blue' },
  { name: 'b600', value: '#004FA7', family: 'Blue' },
  { name: 'b500', value: '#0064D2', family: 'Blue' },
  { name: 'b400', value: '#007BFF', family: 'Blue' },
  { name: 'b300', value: '#5BAAFF', family: 'Blue' },
  { name: 'b200', value: '#A3CFFF', family: 'Blue' },
  { name: 'b100', value: '#E0EFFF', family: 'Blue' },

  { name: 'y900', value: '#3D3500', family: 'Yellow' },
  { name: 'y800', value: '#6C5E00', family: 'Yellow' },
  { name: 'y700', value: '#AD9700', family: 'Yellow' },
  { name: 'y600', value: '#E5C700', family: 'Yellow' },
  { name: 'y500', value: '#FEDD00', family: 'Yellow' },
  { name: 'y400', value: '#FEE645', family: 'Yellow' },
  { name: 'y300', value: '#FEEC73', family: 'Yellow' },
  { name: 'y200', value: '#FEF2A2', family: 'Yellow' },
  { name: 'y100', value: '#FEF8D0', family: 'Yellow' },

  { name: 'r900', value: '#380909', family: 'Red' },
  { name: 'r800', value: '#610F0F', family: 'Red' },
  { name: 'r700', value: '#8C1616', family: 'Red' },
  { name: 'r600', value: '#B81D1D', family: 'Red' },
  { name: 'r500', value: '#E52424', family: 'Red' },
  { name: 'r400', value: '#F15C59', family: 'Red' },
  { name: 'r300', value: '#FC7474', family: 'Red' },
  { name: 'r200', value: '#FC9999', family: 'Red' },
  { name: 'r100', value: '#FFDFDF', family: 'Red' },

  { name: 'g900', value: '#022612', family: 'Green' },
  { name: 'g800', value: '#054A24', family: 'Green' },
  { name: 'g700', value: '#076A33', family: 'Green' },
  { name: 'g600', value: '#088942', family: 'Green' },
  { name: 'g500', value: '#0BAE54', family: 'Green' },
  { name: 'g400', value: '#3CCC7D', family: 'Green' },
  { name: 'g300', value: '#66CC94', family: 'Green' },
  { name: 'g200', value: '#A8E5C4', family: 'Green' },
  { name: 'g100', value: '#E2FBED', family: 'Green' },

  { name: 't900', value: '#092227', family: 'Turquoise' },
  { name: 't800', value: '#14353C', family: 'Turquoise' },
  { name: 't700', value: '#174F59', family: 'Turquoise' },
  { name: 't600', value: '#148692', family: 'Turquoise' },
  { name: 't500', value: '#10A4AF', family: 'Turquoise' },
  { name: 't400', value: '#30B6C5', family: 'Turquoise' },
  { name: 't300', value: '#7CD4E4', family: 'Turquoise' },
  { name: 't200', value: '#9FDFED', family: 'Turquoise' },
  { name: 't100', value: '#E0F1F5', family: 'Turquoise' },

  { name: 'o900', value: '#662E00', family: 'Orange' },
  { name: 'o800', value: '#8F4000', family: 'Orange' },
  { name: 'o700', value: '#B85300', family: 'Orange' },
  { name: 'o600', value: '#E06500', family: 'Orange' },
  { name: 'o500', value: '#FF7200', family: 'Orange' },
  { name: 'o400', value: '#FF841F', family: 'Orange' },
  { name: 'o300', value: '#FFA55C', family: 'Orange' },
  { name: 'o200', value: '#FFC799', family: 'Orange' },
  { name: 'o100', value: '#FFE9D6', family: 'Orange' },

  { name: 'p900', value: '#210671', family: 'Purple' },
  { name: 'p800', value: '#311093', family: 'Purple' },
  { name: 'p700', value: '#4C15CB', family: 'Purple' },
  { name: 'p600', value: '#7846EC', family: 'Purple' },
  { name: 'p500', value: '#9770F0', family: 'Purple' },
  { name: 'p400', value: '#AE90F3', family: 'Purple' },
  { name: 'p300', value: '#C9B5F7', family: 'Purple' },
  { name: 'p200', value: '#E4DAFB', family: 'Purple' },
  { name: 'p100', value: '#F1EDFD', family: 'Purple' },

  { name: 'm900', value: '#330724', family: 'Magenta' },
  { name: 'm800', value: '#460C32', family: 'Magenta' },
  { name: 'm700', value: '#8C1865', family: 'Magenta' },
  { name: 'm600', value: '#C0218B', family: 'Magenta' },
  { name: 'm500', value: '#DE3FA9', family: 'Magenta' },
  { name: 'm400', value: '#E76FBF', family: 'Magenta' },
  { name: 'm300', value: '#ED96D0', family: 'Magenta' },
  { name: 'm200', value: '#F6CBE8', family: 'Magenta' },
  { name: 'm100', value: '#FCEEF7', family: 'Magenta' },
];

/** One step darker in the design tokens (b400 → b500, r600 → r700). Colours that aren't a token are darkened a little
 *  instead. Used for "auto" text colours that sit on top of a colour (e.g. the unit badge text vs. the banner background). */
export function oneShadeDarker(hex: string): string {
  const token = colorTokens.find((t) => t.value.toLowerCase() === hex.toLowerCase());
  if (token) {
    const m = /^([a-z]+)(\d+)$/.exec(token.name);
    const darker = m && colorTokens.find((t) => t.name === `${m[1]}${Number(m[2]) + 100}`);
    return darker ? darker.value : token.value;
  }
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return hex;
  return '#' + m.slice(1, 4).map((c) => Math.round(parseInt(c, 16) * 0.8).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Last 10 custom colours picked in any ColorPicker, newest first (per browser).
const HISTORY_KEY = 'tdslab:color-history';
const HISTORY_MAX = 10;
const readHistory = (): string[] => {
  try { const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); return Array.isArray(v) ? v.filter((c) => typeof c === 'string') : []; } catch { return []; }
};
const pushHistory = (color: string) => {
  const c = color.toUpperCase();
  const next = [c, ...readHistory().filter((h) => h.toUpperCase() !== c)].slice(0, HISTORY_MAX);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
  return next;
};

// HSL <-> hex for the H / S / L sliders in the Custom tab
const hexToHsl = (hex: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const [r, g, b] = m.slice(1, 4).map((c) => parseInt(c, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round(h * 60), Math.round(sat * 100), Math.round(l * 100)];
};
const hslToHex = (h: number, sat: number, l: number) => {
  const s1 = sat / 100, l1 = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s1 * Math.min(l1, 1 - l1);
  const f = (n: number) => l1 - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return '#' + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
};

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  defaultValue?: string;
  /** 'chip': same size as a preset swatch (28px) with a caption underneath, for use inside a row of preset chips.
   *  `chipActive` marks it as the selected one (ring + shows the current colour; otherwise a neutral rainbow). */
  variant?: 'dot' | 'chip' | 'bar';
  /** 'bar': full-width bordered row (dot + hex); the whole row opens the picker. */
  chipLabel?: string;
  chipActive?: boolean;
  /** Custom trigger element (e.g. a gradient stop handle) instead of the dot/chip; hides the hex caption. */
  trigger?: React.ReactNode;
}

export function ColorPicker({ value, onChange, defaultValue = '#ffffff', variant = 'dot', chipLabel = 'Custom', chipActive = false, trigger }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'custom'>('tokens');
  
  const currentColor = value || defaultValue;
  const [history, setHistory] = useState<string[]>([]);
  const openedWith = useRef(currentColor);
  const activeSwatchRef = useRef<HTMLButtonElement>(null);
  // Record the colour on close when it changed to a custom (non-token) hex, so it can be picked again without remembering the code
  // Custom picks (wheel, hex input, eyedropper) are saved once the user pauses for a moment, not only when the popover closes
  const recordTimer = useRef<ReturnType<typeof setTimeout>>();
  const record = (c: string) => {
    if (!/^#[0-9a-f]{6}$/i.test(c) || colorTokens.some((t) => t.value.toLowerCase() === c.toLowerCase())) return;
    setHistory(pushHistory(c));
  };
  const pickCustom = (c: string) => {
    onChange(c);
    clearTimeout(recordTimer.current);
    recordTimer.current = setTimeout(() => record(c), 700);
  };
  const handleOpenChange = (open: boolean) => {
    if (open) { openedWith.current = currentColor; setHistory(readHistory()); }
    else if (currentColor.toLowerCase() !== openedWith.current.toLowerCase()) { clearTimeout(recordTimer.current); record(currentColor); }
    setIsOpen(open);
  };
  // Native screen eyedropper (Chromium/Edge); hidden where the browser doesn't support it.
  const canEyedrop = typeof window !== 'undefined' && 'EyeDropper' in window;
  const pickFromScreen = async () => {
    try {
      const result = await new (window as any).EyeDropper().open();
      pickCustom(String(result.sRGBHex).toUpperCase());
    } catch {
      // cancelled with Esc
    }
  };

  const filteredTokens = useMemo(() => {
    if (!search) return colorTokens;
    const lowerSearch = search.toLowerCase();
    return colorTokens.filter(
      (t) => 
        t.name.toLowerCase().includes(lowerSearch) || 
        t.value.toLowerCase().includes(lowerSearch) ||
        t.family.toLowerCase().includes(lowerSearch)
    );
  }, [search]);

  // Group tokens by family
  const groupedTokens = useMemo(() => {
    const groups: Record<string, ColorToken[]> = {};
    filteredTokens.forEach(token => {
      if (!groups[token.family]) groups[token.family] = [];
      groups[token.family].push(token);
    });
    return groups;
  }, [filteredTokens]);

  const matchedToken = colorTokens.find(t => t.value.toLowerCase() === currentColor.toLowerCase());
  const displayValue = matchedToken ? matchedToken.name.toUpperCase() : currentColor;

  // Scroll the currently selected swatch into view as soon as the popover opens, instead of
  // always landing scrolled to the top (the colour can be many families down the list).
  useEffect(() => {
    if (!isOpen || activeTab !== 'tokens') return;
    const id = window.setTimeout(() => {
      activeSwatchRef.current?.scrollIntoView({ block: 'center' });
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen, activeTab]);

  return (
    <div className={variant === 'bar' && !trigger ? 'flex flex-1 min-w-0 items-center' : 'flex items-center gap-[8px]'}>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          {trigger ? trigger : variant === 'chip' ? (
            <button type="button" title="Custom colour" className="flex flex-col items-center gap-[4px]">
              <span
                className={`block w-[28px] h-[28px] rounded-full transition-all ${chipActive ? 'ring-2 ring-offset-1 ring-[#303135] scale-110' : 'ring-1 ring-[#e0e0e0]'}`}
                style={{ background: chipActive ? currentColor : 'conic-gradient(#FF5C5C, #FEDD00, #3CCC7D, #30B6C5, #007BFF, #9770F0, #DE3FA9, #FF5C5C)' }}
              />
              <span className={`text-[11px] leading-none ${chipActive ? 'font-bold text-[#303135]' : 'text-[#71747d]'}`}>{chipLabel}</span>
            </button>
          ) : variant === 'bar' ? (
            <button type="button" title="Pick color" className="flex items-center gap-2 w-full min-w-0 text-left bg-[#F8F9FD] p-2 rounded-lg border border-[#d8dce8] hover:border-[#b9bfcc] transition-colors">
              <span className="block w-[16px] h-[16px] rounded-full border border-[#d8dce8] shrink-0 shadow-sm" style={{ backgroundColor: currentColor }} />
              <span className="text-[12px] text-[#9EA0A5] font-mono uppercase truncate">{displayValue}</span>
            </button>
          ) : (
            <button type="button" title="Pick color" className="group flex items-center gap-[8px] cursor-pointer">
              <span className="block relative w-[16px] h-[16px] rounded-full overflow-hidden border border-[#d8dce8] shrink-0 shadow-sm group-hover:scale-110 transition-transform" style={{ backgroundColor: currentColor }} />
              <span className="text-[12px] text-[#9EA0A5] font-mono uppercase">{displayValue}</span>
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 max-h-[var(--radix-popover-content-available-height)] overflow-y-auto" align="start" collisionPadding={8}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="flex items-center justify-between border-b border-[#e9ebef] px-4">
              <TabsList className="h-12 w-full justify-start gap-4 bg-transparent p-0">
                <TabsTrigger 
                  value="tokens" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] border-0 border-b-2 border-transparent hover:text-[#303135] rounded-none h-full px-4 font-bold bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-0 focus-visible:border-b-2 focus-visible:border-transparent data-[state=active]:focus-visible:border-[#007BFF]"
                >
                  Tokens
                </TabsTrigger>
                <TabsTrigger 
                  value="custom" 
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-[#007BFF] data-[state=active]:text-[#007BFF] text-[#71747d] border-0 border-b-2 border-transparent hover:text-[#303135] rounded-none h-full px-4 font-bold bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:border-0 focus-visible:border-b-2 focus-visible:border-transparent data-[state=active]:focus-visible:border-[#007BFF]"
                >
                  Custom
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4">
              {(history.length > 0 || activeTab === 'custom') && (
                <div className="flex flex-col gap-2 mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground">Recent</h4>
                  {history.length === 0 && <span className="text-xs text-[#9EA0A5]">Colours you pick here show up for next time.</span>}
                  <div className="flex flex-wrap gap-2">
                    {history.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={`relative w-6 h-6 rounded-full border border-black/10 hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]/50 focus-visible:ring-offset-1 ${currentColor.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-[#007BFF] ring-offset-2' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onChange(c)}
                        title={c}
                      >
                        {currentColor.toLowerCase() === c.toLowerCase() && <span className="absolute inset-0 m-auto w-2 h-2 bg-white rounded-full border-2 border-[#007BFF]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <TabsContent value="tokens" className="mt-0 flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <StyledInput 
                    placeholder="Search color name or hex..." 
                    className="pl-8" 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                
                <div className="h-[280px] overflow-y-auto pr-2 -mr-2 flex flex-col gap-4">
                  {Object.entries(groupedTokens).map(([family, tokens]) => (
                    <div key={family}>
                      <h4 className="text-xs font-semibold text-muted-foreground mb-2">{family}</h4>
                      <div className="grid grid-cols-6 gap-2">
                        {tokens.map((token) => {
                          const isActive = currentColor.toLowerCase() === token.value.toLowerCase();
                          return (
                          <button
                            type="button"
                            key={token.name}
                            ref={isActive ? activeSwatchRef : undefined}
                            className={`group relative w-8 h-8 rounded-full border border-black/5 hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#007BFF]/50 focus-visible:ring-offset-2 ${isActive ? '!ring-2 !ring-[#007BFF] !ring-offset-2' : ''}`}
                            style={{ background: `linear-gradient(${token.value}, ${token.value}), repeating-conic-gradient(#d8dce8 0% 25%, #fff 0% 50%) 50% / 8px 8px` }}
                            onClick={() => {
                              onChange(token.value);
                              // setIsOpen(false); // Optional: close on selection
                            }}
                            title={`${token.name} (${token.value})`}
                          >
                            {isActive && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full border-2 border-[#007BFF]" />
                              </div>
                            )}
                          </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredTokens.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No colors found
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="mt-0 flex flex-col gap-4 items-center">
                <HexColorPicker color={currentColor} onChange={pickCustom} className="!w-full !h-[200px]" />

                {/* H / S / L sliders: fine-tune the same colour numerically */}
                {(() => {
                  const [h, sat, l] = hexToHsl(currentColor);
                  const rows: [string, number, number, string, (v: number) => string][] = [
                    ['H', h, 360, 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)', (v) => hslToHex(v, sat, l)],
                    ['S', sat, 100, `linear-gradient(to right, ${hslToHex(h, 0, l)}, ${hslToHex(h, 100, l)})`, (v) => hslToHex(h, v, l)],
                    ['L', l, 100, `linear-gradient(to right, #000, ${hslToHex(h, sat, 50)}, #fff)`, (v) => hslToHex(h, sat, v)],
                  ];
                  return (
                    <div className="flex flex-col gap-2 w-full">
                      {rows.map(([label, val, max, track, toHex]) => (
                        <div key={label} className="flex items-center gap-2">
                          <span className="w-3 text-xs font-semibold text-[#71747d]">{label}</span>
                          <input
                            type="range"
                            min={0}
                            max={max}
                            value={val}
                            onChange={(e) => pickCustom(toHex(Number(e.target.value)))}
                            className="flex-1 h-[10px] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[16px] [&::-webkit-slider-thumb]:h-[16px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.3)] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white"
                            style={{ background: track }}
                          />
                          <input
                            type="number"
                            min={0}
                            max={max}
                            value={val}
                            onChange={(e) => pickCustom(toHex(Math.max(0, Math.min(max, Number(e.target.value) || 0))))}
                            className="w-[48px] h-[28px] px-[6px] rounded-md border border-[#d8dce8] text-xs text-right outline-none focus:border-[#007BFF]"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                <div className="flex gap-2 w-full items-center">
                  <div className="w-10 h-10 rounded-md border border-[#d8dce8] shrink-0" style={{ backgroundColor: currentColor }} />
                  {canEyedrop && (
                    <button
                      type="button"
                      onClick={pickFromScreen}
                      title="Pick a colour from the screen"
                      className="w-10 h-10 shrink-0 rounded-md border border-[#d8dce8] flex items-center justify-center text-[#4d4f56] hover:bg-[#f4f7fe] hover:text-[#007BFF] transition-colors"
                    >
                      <Pipette size={16} />
                    </button>
                  )}
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">#</span>
                    <StyledInput 
                      value={currentColor.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9A-Fa-f]{0,8}$/.test(val)) {
                          pickCustom(`#${val}`);
                        }
                      }}
                      className="pl-6 uppercase"
                      maxLength={8}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}