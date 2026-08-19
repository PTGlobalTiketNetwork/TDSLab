import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LogoTiketHorizontal from '../../imports/LogoTiketHorizontal-7-464';
import svgPaths from '../../imports/svg-aiibt4855e';
import svgPathsIcon from '../../imports/svg-z4vno468sm';
import TdsIcVerticals from '../../imports/TdsIcVerticals';
import TdsIcImage from '../../imports/TdsIcImage-2031-7588';
import RevIcFreeFuelTollParking from '../../imports/RevIcFreeFuelTollParking';
import { User } from 'lucide-react';
import { useMenuVisibility, ManagedMenuItem } from '../../context/MenuVisibilityContext';

interface SidebarProps {
  userName?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  onLogout?: () => void;
  draftCount?: number;
  activeItem?: string;
  onSelectItem?: (item: string) => void;
  bannerCounts?: Record<string, number>;
  assetCounts?: Record<string, number>;
  canUseTools?: boolean;
  canAccessSettings?: boolean;
}

function TdsIcHomeOff({ color = "#4D4F56" }: { color?: string }) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p27aea500} fill={color} />
      </svg>
    </div>
  );
}

function IconEmptyIcon({ color = "#4D4F56" }: { color?: string }) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <div className="absolute inset-0 rounded-[4px]" style={{ backgroundColor: color }} />
    </div>
  );
}

function TdsIcChevronUp() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p2ea41700} fill="#4D4F56" />
      </svg>
    </div>
  );
}

function IcChevronDownNavigation() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path d={svgPaths.p3504a860} fill="#4D4F56" />
      </svg>
    </div>
  );
}

function TdsIcSetting({ color = "#4D4F56" }: { color?: string }) {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path clipRule="evenodd" d={svgPaths.p5b9ca80} fill={color} fillRule="evenodd" />
      </svg>
    </div>
  );
}

function ChevronLeftIcon() {
  return (
    <div className="relative size-[32px]">
      <div className="absolute inset-[-18.75%_-25%_-31.25%_-25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
          <g>
            <g filter="url(#filter0_d_chevron_left)">
              <circle cx="24" cy="22" fill="white" r="16" />
            </g>
            <g>
              <path d={svgPathsIcon.p3078ca00} fill="#4D4F56" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="48" id="filter0_d_chevron_left" width="48" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_chevron_left" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_chevron_left" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <div className="relative size-[32px]">
      <div className="absolute inset-[-18.75%_-25%_-31.25%_-25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 48 48">
          <g>
            <g filter="url(#filter0_d_chevron_right)">
              <circle cx="24" cy="22" fill="white" r="16" />
            </g>
            <g transform="translate(48, 0) scale(-1, 1)">
              <path d={svgPathsIcon.p3078ca00} fill="#4D4F56" />
            </g>
          </g>
          <defs>
            <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="48" id="filter0_d_chevron_right" width="48" x="0" y="0">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
              <feOffset dy="2" />
              <feGaussianBlur stdDeviation="4" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.188235 0 0 0 0 0.192157 0 0 0 0 0.207843 0 0 0 0.16 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_chevron_right" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_chevron_right" mode="normal" result="shape" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

// SubMenuItem Component for cleaner code
interface SubMenuItemProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  indentLevel?: number;
  count?: number;
  isEmpty?: boolean;
  badge?: React.ReactNode;
}

function SubMenuItem({ label, isActive, onClick, indentLevel = 1, count, isEmpty, badge }: SubMenuItemProps) {
  const paddingLeft = indentLevel === 1 ? 'pl-[28px]' : 'pl-[56px]';
  const textColor = isActive ? 'text-[#007BFF]' : isEmpty ? 'text-[#B0B3B8]' : 'text-[#303135]';
  const fontWeight = isActive ? 'font-bold' : 'font-normal';
  
  return (
    <div className="bg-white flex flex-col items-end justify-center pl-[28px] pr-0 py-0 w-full cursor-pointer" onClick={onClick}>
      <div className={`${isActive ? 'bg-[#e7f2ff]' : 'bg-transparent hover:bg-gray-50'} flex flex-col items-start ${paddingLeft} pr-0 py-0 ${isActive ? 'rounded-bl-[8px] rounded-tl-[8px]' : ''} w-full transition-colors`}>
        <div className="bg-transparent flex flex-col items-start overflow-clip pl-0 pr-[36px] py-[10px] w-full">
          <div className="flex justify-between items-center w-full pr-[16px]">
            <div className="flex gap-[8px] items-center">
              <p className={`${fontWeight} ${textColor} leading-[20px] text-[14px]`}>
                {label}
              </p>
              {badge}
              {count !== undefined && count > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#007BFF] text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ 
  userName = "Michael Fernanlie", 
  isCollapsed = false, 
  onToggleCollapse, 
  onLogout,
  draftCount = 0,
  activeItem = 'Promo Banner',
  onSelectItem,
  bannerCounts = {},
  assetCounts = {},
  canUseTools = false,
  canAccessSettings = false
}: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isBannersActive = location.pathname.startsWith('/banners');
  const isLogoAssetsActive = location.pathname.startsWith('/assets');
  const { isVisible } = useMenuVisibility();

  const [isBannersExpanded, setIsBannersExpanded] = useState(false);
  const [isLogoAssetsExpanded, setIsLogoAssetsExpanded] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Effect to auto-expand menus based on activeItem
  useEffect(() => {
    if (['Promo Banner', 'Homepage Promo Banner', 'Hero Landing Page Header', 'Product Entry Point'].includes(activeItem)) {
      setIsBannersExpanded(true);
    } else if (['Campaign', 'Payment', 'Airlines', 'Hotel', 'Product Icon', 'Entity Logo', 'Others'].includes(activeItem)) {
      setIsLogoAssetsExpanded(true);
    } else if (activeItem === 'Image Generation' || activeItem === 'Generative Resize' || activeItem === 'Banner Translate') {
      setIsToolsExpanded(true);
    } else if (activeItem === 'AI Models' || activeItem === 'Access Management' || activeItem === 'Menu Management') {
      setIsSettingsExpanded(true);
    }
  }, [activeItem]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <div 
      className={`h-screen bg-white shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] flex flex-col fixed left-0 top-0 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'w-[268px]'
      }`}
    >
      {/* Logo */}
      <div className="h-[100px] relative flex items-center">
        {!isCollapsed && (
          <div className="h-[42px] ml-[28px] overflow-clip w-[168px]">
            <LogoTiketHorizontal />
          </div>
        )}
        
        {/* Collapse Toggle Button */}
        <button
          onClick={() => onToggleCollapse?.(!isCollapsed)}
          className="absolute size-[32px] flex items-center justify-center transition-all duration-300 right-[-16px] z-[51] top-1/2 -translate-y-1/2 cursor-pointer"
        >
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>
        
        {/* Separator */}
        <div className="absolute bg-[#d8dce8] h-px left-0 top-[100px] w-full" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto min-h-0 w-full">
        <div className="flex flex-col gap-[4px] items-start mt-[21px] pb-4">
        {/* Home */}
        <div className="bg-white flex flex-col items-start w-full">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
            <div className={`[grid-area:1_/_1] bg-transparent flex flex-col items-start overflow-clip py-[10px] ${
              isCollapsed ? 'ml-[30px] pl-0 pr-0' : 'ml-[28px] pl-0 pr-[8px] w-[240px]'
            }`}>
              <button
                onClick={() => {
                  // Rule A: Home Exception - Always navigate immediately
                  onSelectItem?.('Home');
                }}
                className={`flex gap-[8px] items-start w-full cursor-pointer transition-colors ${
                  isCollapsed ? 'hover:bg-gray-100 rounded-lg p-1' : ''
                }`}
              >
                <TdsIcHomeOff color={activeItem === 'Home' ? "#007BFF" : "#4D4F56"} />
                {!isCollapsed && (
                  <p className={`${activeItem === 'Home' ? 'font-bold text-[#007BFF]' : 'font-normal text-[#303135]'} font-['Tiket_Odyssey_Text:Regular',sans-serif] leading-[20px] text-[14px] w-[176px] text-left`}>
                    Home
                  </p>
                )}
              </button>
            </div>
            {/* Active Indicator Bar */}
            <div className={`[grid-area:1_/_1] ${activeItem === 'Home' ? 'bg-[#007BFF]' : 'bg-transparent'} h-[40px] ml-0 mt-0 w-[4px]`} />
          </div>
        </div>

        {/* Drafts */}
        {!isCollapsed && draftCount > 0 && (
           <SubMenuItem 
             label="Drafts" 
             isActive={activeItem === 'Drafts'} 
             onClick={() => onSelectItem?.('Drafts')}
             count={draftCount}
           />
        )}

        {/* Banners (Group) */}
        <div className="bg-white flex flex-col items-start w-full">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
            <div className={`[grid-area:1_/_1] bg-transparent flex flex-col items-start overflow-clip py-[10px] ${
              isCollapsed ? 'ml-[30px] pl-0 pr-0' : 'ml-[28px] pl-0 pr-[8px] w-[240px]'
            }`}>
              <button
                onClick={() => {
                  // Rule B: Other Menus Logic
                  if (isCollapsed) {
                    // Expand sidebar and this menu accordion
                    onToggleCollapse?.(false);
                    setIsBannersExpanded(true);
                    // DO NOT navigate
                  } else {
                    // Normal accordion toggle
                    setIsBannersExpanded(!isBannersExpanded);
                  }
                }}
                className={`flex gap-[8px] items-start w-full cursor-pointer transition-colors ${
                  isCollapsed ? 'hover:bg-gray-100 rounded-lg p-1' : ''
                }`}
              >
                <div className="size-[20px] shrink-0">
                  <TdsIcImage color={isBannersActive ? "#007BFF" : "#4D4F56"} />
                </div>
                {!isCollapsed && (
                  <>
                    <p className={`${isBannersActive ? 'font-bold text-[#007BFF]' : 'font-normal text-[#303135]'} leading-[20px] text-[14px] w-[176px] text-left`}>
                      Banners
                    </p>
                    {isBannersExpanded ? <TdsIcChevronUp /> : <IcChevronDownNavigation />}
                  </>
                )}
              </button>
            </div>
            {/* Active Indicator Bar */}
            <div className={`[grid-area:1_/_1] ${isBannersActive ? 'bg-[#007BFF]' : 'bg-transparent'} h-[40px] ml-0 mt-0 w-[4px]`} />
          </div>
        </div>

        {/* Sub-menu - Categories */}
        {!isCollapsed && isBannersExpanded && (
          <>
            {isVisible('Promo Banner') && (
              <SubMenuItem
                label="Promo Banner"
                isActive={activeItem === 'Promo Banner'}
                onClick={() => onSelectItem?.('Promo Banner')}
                isEmpty={!bannerCounts['Promo Banner']}
              />
            )}
            {isVisible('Product Entry Point') && (
              <SubMenuItem
                label="Product Entry Point"
                isActive={activeItem === 'Product Entry Point'}
                onClick={() => onSelectItem?.('Product Entry Point')}
                isEmpty={!bannerCounts['Product Entry Point']}
              />
            )}
            {isVisible('Homepage Promo Banner') && (
              <SubMenuItem
                label="Homepage Promo Banner"
                isActive={activeItem === 'Homepage Promo Banner'}
                onClick={() => onSelectItem?.('Homepage Promo Banner')}
                isEmpty={!bannerCounts['Homepage Promo Banner']}
              />
            )}
            {isVisible('Hero Landing Page Header') && (
              <SubMenuItem
                label="Hero Landing Page Header"
                isActive={activeItem === 'Hero Landing Page Header'}
                onClick={() => onSelectItem?.('Hero Landing Page Header')}
                isEmpty={!bannerCounts['Hero Landing Page Header']}
              />
            )}
          </>
        )}

        {/* Logo Assets */}
        <div className="bg-white flex flex-col items-start w-full">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
            <div className={`[grid-area:1_/_1] bg-transparent flex flex-col items-start overflow-clip py-[10px] ${
              isCollapsed ? 'ml-[30px] pl-0 pr-0' : 'ml-[28px] pl-0 pr-[8px] w-[240px]'
            }`}>
              <button
                onClick={() => {
                  // Rule B: Other Menus Logic
                  if (isCollapsed) {
                    // Expand sidebar and this menu accordion
                    onToggleCollapse?.(false);
                    setIsLogoAssetsExpanded(true);
                    // DO NOT navigate
                  } else {
                    // Normal accordion toggle
                    setIsLogoAssetsExpanded(!isLogoAssetsExpanded);
                  }
                }}
                className={`flex gap-[8px] items-start w-full cursor-pointer transition-colors ${
                  isCollapsed ? 'hover:bg-gray-100 rounded-lg p-1' : ''
                }`}
              >
                <div className="size-[20px] shrink-0">
                    <TdsIcVerticals color={isLogoAssetsActive ? "#007BFF" : "#4D4F56"} />
                </div>
                {!isCollapsed && (
                  <>
                    <p className={`${isLogoAssetsActive ? 'font-bold text-[#007BFF]' : 'font-normal text-[#303135]'} leading-[20px] text-[14px] w-[176px] text-left`}>
                      Logo Assets
                    </p>
                    {isLogoAssetsExpanded ? <TdsIcChevronUp /> : <IcChevronDownNavigation />}
                  </>
                )}
              </button>
            </div>
            {/* Active Indicator Bar */}
            <div className={`[grid-area:1_/_1] ${isLogoAssetsActive ? 'bg-[#007BFF]' : 'bg-transparent'} h-[40px] ml-0 mt-0 w-[4px]`} />
          </div>
          {/* Logo Assets Sub-menu */}
          {!isCollapsed && isLogoAssetsExpanded && (
            <div className="w-full">
              <SubMenuItem 
                label="Campaign" 
                isActive={activeItem === 'Campaign'} 
                onClick={() => onSelectItem?.('Campaign')} 
                isEmpty={!assetCounts['Campaign']}
              />
              
              <SubMenuItem 
                label="Payment" 
                isActive={activeItem === 'Payment'} 
                onClick={() => onSelectItem?.('Payment')} 
                isEmpty={!assetCounts['Payment']}
              />

              <SubMenuItem 
                label="Airlines" 
                isActive={activeItem === 'Airlines'} 
                onClick={() => onSelectItem?.('Airlines')} 
                isEmpty={!assetCounts['Airlines']}
              />

              <SubMenuItem 
                label="Hotel" 
                isActive={activeItem === 'Hotel'} 
                onClick={() => onSelectItem?.('Hotel')} 
                isEmpty={!assetCounts['Hotel']}
              />

              <SubMenuItem 
                label="Product Icon" 
                isActive={activeItem === 'Product Icon'} 
                onClick={() => onSelectItem?.('Product Icon')} 
                isEmpty={!assetCounts['Product Icon']}
              />

              <SubMenuItem
                label="Brand & Entity Logo"
                isActive={activeItem === 'Entity Logo'}
                onClick={() => onSelectItem?.('Entity Logo')}
                isEmpty={!assetCounts['Entity Logo']}
              />

              <SubMenuItem
                label="Partner"
                isActive={activeItem === 'Partner'}
                onClick={() => onSelectItem?.('Partner')}
                isEmpty={!assetCounts['Partner']}
              />

              <SubMenuItem
                label="Others"
                isActive={activeItem === 'Others'}
                onClick={() => onSelectItem?.('Others')}
                isEmpty={!assetCounts['Others']}
              />
            </div>
          )}
        </div>

        {/* Tools */}
        {canUseTools && <div className="bg-white flex flex-col items-start w-full">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
            <div className={`[grid-area:1_/_1] bg-transparent flex flex-col items-start overflow-clip py-[10px] ${
              isCollapsed ? 'ml-[30px] pl-0 pr-0' : 'ml-[28px] pl-0 pr-[8px] w-[240px]'
            }`}>
              <button
                onClick={() => {
                  // Rule B: Other Menus Logic
                  if (isCollapsed) {
                    // Expand sidebar and this menu accordion
                    onToggleCollapse?.(false);
                    setIsToolsExpanded(true);
                    // DO NOT navigate
                  } else {
                    // Normal accordion toggle
                    setIsToolsExpanded(!isToolsExpanded);
                  }
                }}
                className={`flex gap-[8px] items-start w-full cursor-pointer transition-colors ${
                  isCollapsed ? 'hover:bg-gray-100 rounded-lg p-1' : ''
                }`}
              >
                <div className={`size-[20px] shrink-0 flex items-center justify-center ${(activeItem === 'Image Generation' || activeItem === 'Generative Resize' || activeItem === 'Banner Translate') ? 'text-[#007BFF]' : 'text-[#4D4F56]'}`}>
                    <RevIcFreeFuelTollParking />
                </div>
                {!isCollapsed && (
                  <>
                    <p className={`${(activeItem === 'Image Generation' || activeItem === 'Generative Resize' || activeItem === 'Banner Translate') ? 'font-bold text-[#007BFF]' : 'font-normal text-[#303135]'} leading-[20px] text-[14px] text-left`}>
                      Tools
                    </p>
                    <span className="px-2 py-0.5 bg-[#007BFF] text-white text-[10px] font-bold rounded ml-2">ALPHA</span>
                    <div className="flex-1" />
                    {isToolsExpanded ? <TdsIcChevronUp /> : <IcChevronDownNavigation />}
                  </>
                )}
              </button>
            </div>
             {/* Active Indicator Bar for Tools - if any tool is active */}
             <div className={`[grid-area:1_/_1] ${(activeItem === 'Image Generation' || activeItem === 'Generative Resize' || activeItem === 'Banner Translate') ? 'bg-[#007BFF]' : 'bg-transparent'} h-[40px] ml-0 mt-0 w-[4px]`} />
          </div>

          {/* Tools Sub-menu */}
          {!isCollapsed && isToolsExpanded && (
            <div className="w-full">
              <SubMenuItem 
                label="Image Generation" 
                isActive={activeItem === 'Image Generation'} 
                onClick={() => onSelectItem?.('Image Generation')} 
              />
              <SubMenuItem 
                label="Generative Resize" 
                isActive={activeItem === 'Generative Resize'} 
                onClick={() => onSelectItem?.('Generative Resize')} 
              />
              <SubMenuItem 
                label="Banner Translate" 
                isActive={activeItem === 'Banner Translate'} 
                onClick={() => onSelectItem?.('Banner Translate')} 
              />
            </div>
          )}
        </div>}

        {/* Settings */}
        {canAccessSettings && <div className="bg-white flex flex-col items-start w-full">
          <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start w-full">
            <div className={`[grid-area:1_/_1] bg-transparent flex flex-col items-start overflow-clip py-[10px] ${
              isCollapsed ? 'ml-[30px] pl-0 pr-0' : 'ml-[28px] pl-0 pr-[8px] w-[240px]'
            }`}>
              <button
                onClick={() => {
                  // Rule B: Other Menus Logic
                  if (isCollapsed) {
                    // Expand sidebar and this menu accordion
                    onToggleCollapse?.(false);
                    setIsSettingsExpanded(true);
                    // DO NOT navigate
                  } else {
                    // Normal accordion toggle
                    setIsSettingsExpanded(!isSettingsExpanded);
                  }
                }}
                className={`flex gap-[8px] items-start w-full cursor-pointer transition-colors ${
                  isCollapsed ? 'hover:bg-gray-100 rounded-lg p-1' : ''
                }`}
              >
                <div className="size-[20px] shrink-0">
                    <TdsIcSetting color={(activeItem === 'AI Models' || activeItem === 'Access Management') ? "#007BFF" : "#4D4F56"} />
                </div>
                {!isCollapsed && (
                  <>
                    <p className={`${(activeItem === 'AI Models' || activeItem === 'Access Management') ? 'font-bold text-[#007BFF]' : 'font-normal text-[#303135]'} leading-[20px] text-[14px] w-[176px] text-left`}>
                      Settings
                    </p>
                    {isSettingsExpanded ? <TdsIcChevronUp /> : <IcChevronDownNavigation />}
                  </>
                )}
              </button>
            </div>
             {/* Active Indicator Bar for Settings */}
             <div className={`[grid-area:1_/_1] ${(activeItem === 'AI Models' || activeItem === 'Access Management' || activeItem === 'Menu Management') ? 'bg-[#007BFF]' : 'bg-transparent'} h-[40px] ml-0 mt-0 w-[4px]`} />
          </div>

          {/* Settings Sub-menu */}
          {!isCollapsed && isSettingsExpanded && (
            <div className="w-full">
              <SubMenuItem label="AI Models" isActive={activeItem === 'AI Models'} onClick={() => onSelectItem?.('AI Models')} />
              <SubMenuItem label="Access Management" isActive={activeItem === 'Access Management'} onClick={() => onSelectItem?.('Access Management')} />
              <SubMenuItem label="Menu Management" isActive={activeItem === 'Menu Management'} onClick={() => onSelectItem?.('Menu Management')} />
            </div>
          )}
        </div>}
      </div>
    </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="shrink-0 pl-[28px] pr-[16px] pb-[20px] pt-2 w-full bg-white z-10" ref={userMenuRef}>
          <div 
            className="cursor-pointer relative"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="flex flex-col gap-[4px] items-start w-full">
              <div className="font-normal text-[#71747d] text-[12px]">
                <p className="leading-[16px]">You're logged in as</p>
              </div>
              <div className="flex gap-[4px] items-center justify-between w-full">
                <div className="font-bold text-[#303135] text-[14px]">
                  <p className="leading-[20px]">{userName}</p>
                </div>
                <div className="relative shrink-0 size-[20px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <path d={svgPaths.p3504a860} fill="#4D4F56" />
                  </svg>
                </div>
              </div>
            </div>

            {showUserMenu && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-[8px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] border border-[#d8dce8] overflow-hidden z-50">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/profile');
                  }}
                  className="w-full text-left px-4 py-3 text-[#303135] hover:bg-gray-50 text-[14px] font-bold transition-colors border-b border-[#e8eaee] flex items-center gap-2"
                >
                  <User size={16} />
                  Profile
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onLogout?.();
                  }}
                  className="w-full text-left px-4 py-3 text-[#d4183d] hover:bg-[#ffebee] text-[14px] font-bold transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}