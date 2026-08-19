import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

// Create a single instance of the Supabase client to avoid "Multiple GoTrueClient instances" warning
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Critical: This detects password recovery hash fragments from email links
      flowType: 'pkce' // Use PKCE flow for better security
    }
  }
);

/**
 * Bearer token for edge-function calls. AI routes reject the anon key because
 * the server checks whitelist membership against the caller's user id, so any
 * call to those routes must carry a real session JWT. Falls back to the anon
 * key for pre-auth routes (e.g. /signup) and for signed-out callers, which the
 * server will then reject with 401 rather than silently spending credits.
 */
export async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || publicAnonKey;
}