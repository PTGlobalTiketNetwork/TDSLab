import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const MANAGED_MENU_ITEMS = [
  'Promo Banner',
  'Product Entry Point',
  'DLP Assets',
  'TTD Promo Asset',
  'Auto Translate',
] as const;

export type ManagedMenuItem = (typeof MANAGED_MENU_ITEMS)[number];

// Items that can show a "NEW" badge in the sidebar — toggled from Menu Management instead of code.
export const BADGE_CAPABLE_MENU_ITEMS: ManagedMenuItem[] = ['DLP Assets', 'TTD Promo Asset'];

export interface MenuItemConfig {
  visible: boolean;
  adminOnly: boolean;
  showNewBadge: boolean;
}

type VisibilityMap = Record<ManagedMenuItem, MenuItemConfig>;

const DEFAULT_VISIBILITY: VisibilityMap = {
  'Promo Banner': { visible: true, adminOnly: false, showNewBadge: false },
  'Product Entry Point': { visible: true, adminOnly: false, showNewBadge: false },
  'DLP Assets': { visible: true, adminOnly: false, showNewBadge: true },
  'TTD Promo Asset': { visible: true, adminOnly: true, showNewBadge: true },
  'Auto Translate': { visible: true, adminOnly: false, showNewBadge: false },
};

const DB_KEY = 'banner_menu_visibility';
const LOCAL_KEY = 'menu_visibility_cache';
const CHANNEL_NAME = 'menu-visibility-settings';
const STORAGE_PATH = 'settings/menu-visibility.json';
const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-67753e13`;
// Public URL — no auth needed, readable by everyone
const PUBLIC_SETTINGS_URL = `https://${projectId}.supabase.co/storage/v1/object/public/Banners/${STORAGE_PATH}`;

interface MenuVisibilityContextValue {
  visibility: VisibilityMap;
  /** `isAdmin` gates items marked `adminOnly` — omit (or pass false) to check as a non-admin viewer. */
  isVisible: (item: ManagedMenuItem, isAdmin?: boolean) => boolean;
  showNewBadge: (item: ManagedMenuItem) => boolean;
  setVisibility: (item: ManagedMenuItem, visible: boolean) => Promise<void>;
  setAdminOnly: (item: ManagedMenuItem, adminOnly: boolean) => Promise<void>;
  setShowNewBadge: (item: ManagedMenuItem, showNewBadge: boolean) => Promise<void>;
  loading: boolean;
}

const MenuVisibilityContext = createContext<MenuVisibilityContextValue>({
  visibility: DEFAULT_VISIBILITY,
  isVisible: () => true,
  showNewBadge: () => false,
  setVisibility: async () => {},
  setAdminOnly: async () => {},
  setShowNewBadge: async () => {},
  loading: true,
});

function readLocalCache(): VisibilityMap | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw) as VisibilityMap;
  } catch {}
  return null;
}

function writeLocalCache(v: VisibilityMap) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(v)); } catch {}
}

/** Write visibility JSON to public Supabase Storage via the Edge Function (service role). */
async function pushToPublicStorage(data: VisibilityMap) {
  try {
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const form = new FormData();
    form.append('file', blob, 'menu-visibility.json');
    form.append('path', STORAGE_PATH);
    await fetch(`${SERVER_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${publicAnonKey}` },
      body: form,
    });
  } catch {}
}

/** Fetch visibility from the public Storage URL (no auth needed). */
async function fetchFromPublicStorage(): Promise<VisibilityMap | null> {
  try {
    const res = await fetch(`${PUBLIC_SETTINGS_URL}?t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      return json as VisibilityMap;
    }
  } catch {}
  return null;
}

/** Each item's stored value may still be the legacy plain boolean (pre-adminOnly/showNewBadge) — normalize to a config object per item instead of overwriting a whole item with the default. */
function normalizeVisibilityMap(raw: unknown): VisibilityMap {
  const rawMap = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return MANAGED_MENU_ITEMS.reduce((acc, item) => {
    const existing = rawMap[item];
    if (typeof existing === 'boolean') {
      acc[item] = { ...DEFAULT_VISIBILITY[item], visible: existing };
    } else if (existing && typeof existing === 'object') {
      acc[item] = { ...DEFAULT_VISIBILITY[item], ...(existing as Partial<MenuItemConfig>) };
    } else {
      acc[item] = DEFAULT_VISIBILITY[item];
    }
    return acc;
  }, {} as VisibilityMap);
}

export function MenuVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibilityState] = useState<VisibilityMap>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const applyAndCache = useCallback((raw: unknown) => {
    if (raw && typeof raw === 'object') {
      const merged = normalizeVisibilityMap(raw);
      setVisibilityState(merged);
      writeLocalCache(merged);
    }
  }, []);

  useEffect(() => {
    // Realtime broadcast for instant propagation (no RLS needed for broadcast)
    const ch = supabase.channel(CHANNEL_NAME);
    channelRef.current = ch;
    ch.on('broadcast', { event: 'visibility-update' }, ({ payload }) => {
      if (payload?.data) applyAndCache(payload.data);
    });
    ch.subscribe();

    const load = async () => {
      // 1. Try public Storage URL — works for ALL users, no auth required
      const fromStorage = await fetchFromPublicStorage();
      if (fromStorage) {
        applyAndCache(fromStorage);
        setLoading(false);
        return;
      }

      // 2. Try DB directly (works for admin / if table RLS allows authenticated reads)
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', DB_KEY)
          .maybeSingle();

        if (!error && data?.value) {
          applyAndCache(data.value);
          // Sync to public storage so all users get it next time
          pushToPublicStorage(normalizeVisibilityMap(data.value));
          setLoading(false);
          return;
        }
      } catch {}

      // 3. Fallback: localStorage cache from a previous broadcast
      const cached = readLocalCache();
      if (cached) applyAndCache(cached);

      setLoading(false);
    };

    load();

    return () => {
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [applyAndCache]);

  const updateItemConfig = useCallback(async (item: ManagedMenuItem, patch: Partial<MenuItemConfig>) => {
    const next = {
      ...visibility,
      [item]: { ...(visibility[item] ?? DEFAULT_VISIBILITY[item]), ...patch },
    };
    setVisibilityState(next);
    writeLocalCache(next);

    // Push to public storage first so all users get the new state on next load
    await pushToPublicStorage(next);

    // Broadcast to currently connected users for immediate effect
    channelRef.current?.send({
      type: 'broadcast',
      event: 'visibility-update',
      payload: { data: next },
    });

    // Persist to DB for durability / audit
    try {
      await supabase.from('app_settings').upsert(
        { key: DB_KEY, value: next, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    } catch {}
  }, [visibility]);

  const setVisibility = useCallback(
    (item: ManagedMenuItem, visible: boolean) => updateItemConfig(item, { visible }),
    [updateItemConfig]
  );

  const setAdminOnly = useCallback(
    (item: ManagedMenuItem, adminOnly: boolean) => updateItemConfig(item, { adminOnly }),
    [updateItemConfig]
  );

  const setShowNewBadge = useCallback(
    (item: ManagedMenuItem, showNewBadge: boolean) => updateItemConfig(item, { showNewBadge }),
    [updateItemConfig]
  );

  const isVisible = useCallback(
    (item: ManagedMenuItem, isAdmin: boolean = false) => {
      const cfg = visibility[item] ?? DEFAULT_VISIBILITY[item];
      if (!cfg.visible) return false;
      if (cfg.adminOnly && !isAdmin) return false;
      return true;
    },
    [visibility]
  );

  const showNewBadge = useCallback(
    (item: ManagedMenuItem) => (visibility[item] ?? DEFAULT_VISIBILITY[item]).showNewBadge,
    [visibility]
  );

  return (
    <MenuVisibilityContext.Provider value={{ visibility, isVisible, showNewBadge, setVisibility, setAdminOnly, setShowNewBadge, loading }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
}

export const useMenuVisibility = () => useContext(MenuVisibilityContext);
