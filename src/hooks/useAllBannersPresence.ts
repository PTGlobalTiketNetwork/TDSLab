import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { PresenceUser } from './usePresence';

/**
 * Hook to track presence across all banners
 * Returns a map of bannerId -> array of active users
 */
export function useAllBannersPresence(bannerIds: string[]) {
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceUser[]>>({});

  useEffect(() => {
    if (!bannerIds || bannerIds.length === 0) {
      setPresenceMap({});
      return;
    }

    const channels: any[] = [];
    const newPresenceMap: Record<string, PresenceUser[]> = {};

    // Subscribe to presence channel for each banner
    bannerIds.forEach((bannerId) => {
      const channelName = `banner_presence:${bannerId}`;
      
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: 'dashboard_observer', // Special key for passive observers
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const newState = channel.presenceState();
          const activeUsers: PresenceUser[] = [];
          
          Object.keys(newState).forEach((key) => {
            // Skip the dashboard observer (ourselves)
            if (key === 'dashboard_observer') return;
            
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
          
          // Deduplicate by ID
          const uniqueUsers = Array.from(new Map(activeUsers.map(item => [item.id, item])).values());
          
          // Update the presence map for this specific banner
          setPresenceMap(prev => ({
            ...prev,
            [bannerId]: uniqueUsers
          }));
        })
        .subscribe();

      channels.push(channel);
    });

    return () => {
      channels.forEach(channel => {
        channel.unsubscribe();
      });
    };
  }, [bannerIds.join(',')]); // Re-subscribe when banner list changes

  return presenceMap;
}
