import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  onlineAt: string;
}

const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
];

const getColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

export function usePresence(bannerId: string | undefined, currentUser: { id: string; name: string; avatar?: string } | null) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!bannerId || !currentUser) return;

    const channelName = `banner_presence:${bannerId}`;
    
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeUsers: PresenceUser[] = [];
        
        Object.keys(newState).forEach((key) => {
          const presences = newState[key] as any[];
          presences.forEach((presence) => {
             activeUsers.push({
               id: presence.user_id,
               name: presence.user_name,
               color: presence.color,
               avatar: presence.avatar,
               onlineAt: presence.online_at
             });
          });
        });
        
        // Deduplicate by ID just in case, though key should handle it
        const uniqueUsers = Array.from(new Map(activeUsers.map(item => [item.id, item])).values());
        setUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            user_name: currentUser.name,
            color: getColor(currentUser.name),
            avatar: currentUser.avatar,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [bannerId, currentUser?.id, currentUser?.name, currentUser?.avatar]);

  return users;
}