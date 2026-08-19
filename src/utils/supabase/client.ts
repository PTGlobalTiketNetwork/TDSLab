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