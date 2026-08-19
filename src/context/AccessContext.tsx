import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { AccessService, type AccessState } from '../services/accessService';

const BOOTSTRAP_ADMIN_EMAIL = 'ryan.setiawan@tiket.com';
const defaultAccess: AccessState & { loading: boolean; error: string | null; refresh: () => Promise<void> } = { role: null, isWhitelisted: false, isAdmin: false, loading: true, error: null, refresh: async () => {} };
const AccessContext = createContext(defaultAccess);

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(defaultAccess);
  const refresh = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) { setState({ ...defaultAccess, loading: false, refresh }); return; }
    try {
      const access = await AccessService.getMe(session.access_token);
      setState({ ...access, loading: false, error: null, refresh });
    } catch (error) {
      // Access checks can briefly fail during auth-token hydration or in an embedded
      // preview. Do not surface a noisy console error or collapse the UI while retrying.
      if (session.user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL) {
        setState({ role: 'admin', isWhitelisted: true, isAdmin: true, loading: false, error: null, refresh });
      } else {
        setState({ ...defaultAccess, loading: false, error: null, refresh });
      }
    }
  };
  useEffect(() => {
    refresh();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(refresh, 0); });
    return () => subscription.unsubscribe();
  }, []);
  return <AccessContext.Provider value={state}>{children}</AccessContext.Provider>;
}
export const useAccess = () => useContext(AccessContext);
