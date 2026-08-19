import svgPaths from '../../imports/svg-gczgbzzrga';
import svgPathsDropdown from '../../imports/svg-dropdown-chevron';
import { X, LogOut, User as UserIcon } from 'lucide-react';
import LogoTiketHorizontal from '../../imports/LogoTiketHorizontal-7-464';
import { ReactNode, useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useNavigationBlocker } from '../../context/NavigationBlockerContext';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

interface HeaderProps {
  title?: string;
  searchPlaceholder?: string;
  createButtonText?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  onCreateNew?: () => void;
  isSidebarCollapsed?: boolean;
  fullWidth?: boolean;
  showLogo?: boolean;
  hideControls?: boolean;
  hideSearch?: boolean;
  children?: ReactNode;
  userName?: string;
  userId?: string;
  userAvatar?: string;
  onLogout?: () => void;
  customTitle?: ReactNode;
  presenceUsers?: PresenceUser[];
}

function TdsIcSearch() {
  return (
    <div className="relative shrink-0 size-[20px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <path clipRule="evenodd" d={svgPaths.p8aebd00} fill="#AEB2BE" fillRule="evenodd" />
      </svg>
    </div>
  );
}

export function Header({ 
  title = "Banners",
  searchPlaceholder = "Search banner by name",
  createButtonText = "Create New Banner",
  searchQuery = "", 
  onSearchChange, 
  onCreateNew, 
  isSidebarCollapsed = false,
  fullWidth = false,
  showLogo = false,
  hideControls = false,
  hideSearch = false,
  children,
  userName,
  userId,
  userAvatar,
  onLogout,
  customTitle,
  presenceUsers = [],
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { blockNavigation } = useNavigationBlocker();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    const isCreatingBanner = location.pathname.includes('/create');
    
    if (isCreatingBanner) {
      const isBlocked = blockNavigation(() => navigate('/profile'));
      if (!isBlocked) {
        setIsMenuOpen(false);
        navigate('/profile');
      } else {
        setIsMenuOpen(false);
      }
    } else {
      setIsMenuOpen(false);
      navigate('/profile');
    }
  };

  return (
    <div className={`bg-white shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] flex gap-[40px] items-center pl-[40px] pr-[24px] py-[24px] fixed top-0 right-0 z-40 transition-all duration-300 h-[100px] box-border ${
      fullWidth ? 'left-0' : (isSidebarCollapsed ? 'left-[80px]' : 'left-[268px]')
    }`}>
      {/* Logo or Title */}
      {showLogo ? (
        <div className="w-[168px] h-[42px] overflow-hidden shrink-0">
          <LogoTiketHorizontal />
        </div>
      ) : customTitle ? (
        <div className="shrink-0">
          {customTitle}
        </div>
      ) : (
        <p className="font-bold leading-[30px] text-[#303135] text-[24px] shrink-0 whitespace-nowrap" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>
          {title}
        </p>
      )}

      {/* Content */}
      {children ? (
        <div className="flex-1 flex justify-end">
          {children}
        </div>
      ) : (
        <>
          {!hideControls && (
            <>
              {/* Search Bar */}
              {!hideSearch && (
              <div className="flex-1 bg-[#f4f7fe] rounded-[100px] border border-[#f4f7fe]">
                <div className="flex gap-[8px] items-center px-[12px] py-[10px]">
                  <TdsIcSearch />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="flex-1 h-[22px] bg-transparent text-[16px] leading-[22px] text-[#303135] placeholder:text-[#71747d] font-['Tiket_Odyssey_Text:Regular',sans-serif] focus:outline-none"
                  />
                  {searchQuery && onSearchChange && (
                    <button 
                      onClick={() => onSearchChange('')}
                      className="shrink-0 text-[#AEB2BE] hover:text-[#303135] transition-colors flex items-center justify-center"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
              )}

              {/* Create Button */}
              {onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="bg-[#007bff] h-[52px] px-[24px] py-[14px] rounded-[8px] shrink-0 hover:bg-[#0066cc] transition-colors"
                >
                  <p className="font-bold leading-[24px] text-[18px] text-white whitespace-nowrap" style={{ fontFamily: "'Tiket Odyssey Text', sans-serif", fontWeight: 700 }}>
                    {createButtonText}
                  </p>
                </button>
              )}
            </>
          )}

          {/* User Profile (Only shown when userName is provided, typical for Wizard mode) */}
          {userName && (
             <div className="flex-1 flex justify-end items-center gap-6">
                {/* Presence Avatars */}
                {presenceUsers && presenceUsers.length > 0 && (
                  <div className="flex items-center -space-x-2 mr-2">
                    {presenceUsers.map((user) => {
                      const isCurrentUser = userId && user.id === userId;
                      return (
                        <Tooltip key={user.id} delayDuration={0}>
                          <TooltipTrigger asChild>
                            <Avatar className="w-11 h-11 border-2 border-white shadow-sm relative hover:z-10 hover:scale-110 transition-all cursor-pointer">
                              <AvatarImage src={user.avatar} className="object-cover" />
                              <AvatarFallback 
                                className="text-[12px] font-bold text-white"
                                style={{ backgroundColor: user.color }}
                              >
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={8} className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded z-[100] shadow-lg">
                            <p>{user.name}{isCurrentUser ? ' (you)' : ''}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3 relative" ref={menuRef}>
                    <div className="flex flex-col items-start gap-[2px]">
                        <span className="text-[12px] text-[#71747d] leading-[16px]">You're logged in as</span>
                        <button 
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                          className="flex gap-[4px] items-center hover:opacity-80 transition-opacity focus:outline-none group"
                        >
                          <span className="text-[14px] font-bold text-[#303135] leading-[20px]">{userName}</span>
                          <div className={`w-[20px] h-[20px] transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}>
                            <svg viewBox="0 0 20 20" className="w-full h-full" fill="none">
                              <path d={svgPathsDropdown.p3504a860} fill="#979797" />
                            </svg>
                          </div>
                        </button>
                    </div>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className="absolute top-[100%] right-0 mt-2 w-[160px] bg-white rounded-lg shadow-[0px_4px_16px_rgba(0,0,0,0.1)] border border-[#e8eaee] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                         <button
                            onClick={handleProfileClick}
                            className="w-full text-left px-4 py-2 text-[14px] font-medium text-[#303135] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                         >
                            <UserIcon size={16} />
                            Profile
                         </button>
                         <div className="h-px bg-gray-100 my-1 mx-2" />
                         <button
                            onClick={() => {
                               setIsMenuOpen(false);
                               onLogout?.();
                            }}
                            className="w-full text-left px-4 py-2 text-[14px] font-medium text-[#d4183d] hover:bg-red-50 flex items-center gap-2 transition-colors"
                         >
                            <LogOut size={16} />
                            Log Out
                         </button>
                      </div>
                    )}
                </div>
             </div>
          )}
        </>
      )}
    </div>
  );
}