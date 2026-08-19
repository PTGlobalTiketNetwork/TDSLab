import { useState, useMemo } from 'react';
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

const colorTokens: ColorToken[] = [
  // Red
  { name: 'r900', value: '#380909', family: 'Red' },
  { name: 'r800', value: '#610F0F', family: 'Red' },
  { name: 'r700', value: '#8C1616', family: 'Red' },
  { name: 'r600', value: '#B81D1D', family: 'Red' },
  { name: 'r500', value: '#E52424', family: 'Red' },
  { name: 'r400', value: '#F15C59', family: 'Red' },
  { name: 'r300', value: '#FC7474', family: 'Red' },
  { name: 'r200', value: '#FC9999', family: 'Red' },
  { name: 'r100', value: '#FFDFDF', family: 'Red' },
  // Yellow
  { name: 'y900', value: '#3D3500', family: 'Yellow' },
  { name: 'y800', value: '#6C5E00', family: 'Yellow' },
  { name: 'y700', value: '#AD9700', family: 'Yellow' },
  { name: 'y600', value: '#E5C700', family: 'Yellow' },
  { name: 'y500', value: '#FEDD00', family: 'Yellow' },
  { name: 'y400', value: '#FEE645', family: 'Yellow' },
  { name: 'y300', value: '#FEEC73', family: 'Yellow' },
  { name: 'y200', value: '#FEF2A2', family: 'Yellow' },
  { name: 'y100', value: '#FEF8D0', family: 'Yellow' },
  // Blue
  { name: 'b900', value: '#001833', family: 'Blue' },
  { name: 'b800', value: '#002A58', family: 'Blue' },
  { name: 'b700', value: '#003D81', family: 'Blue' },
  { name: 'b600', value: '#004FA7', family: 'Blue' },
  { name: 'b500', value: '#0064D2', family: 'Blue' },
  { name: 'b400', value: '#007BFF', family: 'Blue' },
  { name: 'b300', value: '#5BAAFF', family: 'Blue' },
  { name: 'b200', value: '#A3CFFF', family: 'Blue' },
  { name: 'b100', value: '#E0EFFF', family: 'Blue' },
  // Green
  { name: 'g900', value: '#022612', family: 'Green' },
  { name: 'g800', value: '#054A24', family: 'Green' },
  { name: 'g700', value: '#076A33', family: 'Green' },
  { name: 'g600', value: '#088942', family: 'Green' },
  { name: 'g500', value: '#0BAE54', family: 'Green' },
  { name: 'g400', value: '#3CCC7D', family: 'Green' },
  { name: 'g300', value: '#66CC94', family: 'Green' },
  { name: 'g200', value: '#A8E5C4', family: 'Green' },
  { name: 'g100', value: '#E2FBED', family: 'Green' },
  // Neutral
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
  // Turquoise
  { name: 't900', value: '#092227', family: 'Turquoise' },
  { name: 't800', value: '#14353C', family: 'Turquoise' },
  { name: 't700', value: '#174F59', family: 'Turquoise' },
  { name: 't600', value: '#148692', family: 'Turquoise' },
  { name: 't500', value: '#10A4AF', family: 'Turquoise' },
  { name: 't400', value: '#30B6C5', family: 'Turquoise' },
  { name: 't300', value: '#7CD4E4', family: 'Turquoise' },
  { name: 't200', value: '#9FDFED', family: 'Turquoise' },
  { name: 't100', value: '#E0F1F5', family: 'Turquoise' },
  // Orange
  { name: 'o900', value: '#4B3601', family: 'Orange' },
  { name: 'o800', value: '#644802', family: 'Orange' },
  { name: 'o700', value: '#A17402', family: 'Orange' },
  { name: 'o600', value: '#C99103', family: 'Orange' },
  { name: 'o500', value: '#F1AE04', family: 'Orange' },
  { name: 'o400', value: '#FCBD1C', family: 'Orange' },
  { name: 'o300', value: '#FDD05E', family: 'Orange' },
  { name: 'o200', value: '#FDE19B', family: 'Orange' },
  { name: 'o100', value: '#FEF3D7', family: 'Orange' },
  // Purple
  { name: 'p900', value: '#210671', family: 'Purple' },
  { name: 'p800', value: '#311093', family: 'Purple' },
  { name: 'p700', value: '#4C15CB', family: 'Purple' },
  { name: 'p600', value: '#7846EC', family: 'Purple' },
  { name: 'p500', value: '#9770F0', family: 'Purple' },
  { name: 'p400', value: '#AE90F3', family: 'Purple' },
  { name: 'p300', value: '#C9B5F7', family: 'Purple' },
  { name: 'p200', value: '#E4DAFB', family: 'Purple' },
  { name: 'p100', value: '#F1EDFD', family: 'Purple' },
  // Magenta
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

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  defaultValue?: string;
}

export function ColorPicker({ value, onChange, defaultValue = '#ffffff' }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'custom'>('tokens');
  
  const currentColor = value || defaultValue;

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

  return (
    <div className="flex items-center gap-[8px]">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div 
            className="relative w-[16px] h-[16px] rounded-full overflow-hidden border border-[#d8dce8] shrink-0 shadow-sm cursor-pointer hover:scale-110 transition-transform" 
            title="Pick color"
            style={{ backgroundColor: currentColor }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
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
                        {tokens.map((token) => (
                          <button
                            type="button"
                            key={token.name}
                            className="group relative w-8 h-8 rounded-full border border-black/5 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:ring-offset-2"
                            style={{ backgroundColor: token.value }}
                            onClick={() => {
                              onChange(token.value);
                              // setIsOpen(false); // Optional: close on selection
                            }}
                            title={`${token.name} (${token.value})`}
                          >
                            {currentColor.toLowerCase() === token.value.toLowerCase() && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                              </div>
                            )}
                          </button>
                        ))}
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
                <HexColorPicker color={currentColor} onChange={onChange} className="!w-full !h-[200px]" />
                
                <div className="flex gap-2 w-full items-center">
                  <div className="w-10 h-10 rounded-md border border-[#d8dce8]" style={{ backgroundColor: currentColor }} />
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">#</span>
                    <StyledInput 
                      value={currentColor.replace('#', '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                          onChange(`#${val}`);
                        }
                      }}
                      className="pl-6 uppercase"
                      maxLength={6}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </PopoverContent>
      </Popover>
      <span className="text-[12px] text-[#9EA0A5] font-mono uppercase">
        {displayValue}
      </span>
    </div>
  );
}