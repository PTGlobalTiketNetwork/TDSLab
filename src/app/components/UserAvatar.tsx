import { useState } from 'react';
import { PresenceUser } from '../../hooks/usePresence';

interface UserAvatarProps {
  user?: PresenceUser;
  src?: string;
  name?: string;
  size?: number;
  showTooltip?: boolean;
  className?: string;
}

export function UserAvatar({ 
  user, 
  src, 
  name, 
  size = 24, 
  showTooltip = true, 
  className = '' 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [showTooltipState, setShowTooltipState] = useState(false);

  // Support both user object (for presence) and direct props (for activity/history)
  const avatarSrc = src || user?.avatar;
  const displayName = name || user?.name || 'User';
  const userColor = user?.color;

  // Get initials from name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 1).toUpperCase();
  };

  // Generate a consistent color from a string (name or id)
  const getColorFromString = (str: string): string => {
    const avatarColors = [
      '#E53935', // red
      '#D81B60', // pink
      '#8E24AA', // purple
      '#5E35B1', // deep purple
      '#3949AB', // indigo
      '#1E88E5', // blue
      '#039BE5', // light blue
      '#00ACC1', // cyan
      '#00897B', // teal
      '#43A047', // green
      '#7CB342', // light green
      '#F4511E', // deep orange
      '#6D4C41', // brown
      '#546E7A', // blue grey
      '#EF6C00', // orange
      '#C0CA33', // lime
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; // Convert to 32bit integer
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  const initials = getInitials(displayName);
  const fallbackColor = userColor || getColorFromString(displayName);
  const shouldShowImage = avatarSrc && !imageError;

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      {/* Avatar */}
      <div 
        className="rounded-full ring-2 ring-white flex items-center justify-center overflow-hidden bg-gray-100"
        style={{ 
          width: size, 
          height: size,
          backgroundColor: shouldShowImage ? 'transparent' : fallbackColor
        }}
      >
        {shouldShowImage ? (
          <img
            src={avatarSrc}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span 
            className="text-white font-bold select-none"
            style={{ fontSize: size * 0.4 }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showTooltipState && user && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none">
          {user.name} is editing...
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

interface AvatarStackProps {
  users: PresenceUser[];
  maxVisible?: number;
  size?: number;
}

export function AvatarStack({ users, maxVisible = 3, size = 24 }: AvatarStackProps) {
  if (!users || users.length === 0) return null;

  const visibleUsers = users.slice(0, maxVisible);
  const remainingCount = users.length - maxVisible;

  return (
    <div className="flex items-center">
      {visibleUsers.map((user, index) => (
        <div 
          key={user.id} 
          className={index > 0 ? '-ml-2' : ''}
          style={{ zIndex: visibleUsers.length - index }}
        >
          <UserAvatar user={user} size={size} />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div 
          className="-ml-2 rounded-full ring-2 ring-white flex items-center justify-center bg-gray-400"
          style={{ 
            width: size, 
            height: size,
            zIndex: 0
          }}
        >
          <span 
            className="text-white font-bold select-none"
            style={{ fontSize: size * 0.4 }}
          >
            +{remainingCount}
          </span>
        </div>
      )}
    </div>
  );
}