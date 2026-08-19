import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

export const MANAGED_MENU_ITEMS = [
  'Promo Banner',
  'Product Entry Point',
  'Homepage Promo Banner',
  'Hero Landing Page Header',
] as const;

export type ManagedMenuItem = (typeof MANAGED_MENU_ITEMS)[number];
type VisibilityMap = Record<ManagedMenuItem, boolean>;

const DEFAULT_VISIBILITY: VisibilityMap = {
  'Promo Banner': true,
  'Product Entry Point': true,
  'Homepage Promo Banner': true,
  'Hero Landing Page Header': true,
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
  isVisible: (item: ManagedMenuItem) => boolean;
  setVisibility: (item: ManagedMenuItem, visible: boolean) => Promise<void>;
  loading: boolean;
}

const MenuVisibilityContext = createContext<MenuVisibilityContextValue>({
  visibility: DEFAULT_VISIBILITY,
  isVisible: () => true,
  setVisibility: async () => {},
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

export function MenuVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibilityState] = useState<VisibilityMap>(DEFAULT_VISIBILITY);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const applyAndCache = useCallback((raw: unknown) => {
    if (raw && typeof raw === 'object') {
      const merged = { ...DEFAULT_VISIBILITY, ...(raw as Partial<VisibilityMap>) };
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
          pushToPublicStorage({ ...DEFAULT_VISIBILITY, ...(data.value as Partial<VisibilityMap>) });
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

  const setVisibility = useCallback(async (item: ManagedMenuItem, visible: boolean) => {
    const next = { ...visibility, [item]: visible };
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

  const isVisible = useCallback(
    (item: ManagedMenuItem) => visibility[item] ?? true,
    [visibility]
  );

  return (
    <MenuVisibilityContext.Provider value={{ visibility, isVisible, setVisibility, loading }}>
      {children}
    </MenuVisibilityContext.Provider>
  );
}

export const useMenuVisibility = () => useContext(MenuVisibilityContext);
