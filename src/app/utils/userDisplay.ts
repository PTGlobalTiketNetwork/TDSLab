/**
 * Utility to consistently resolve user display name and avatar
 * from Supabase auth user metadata.
 * 
 * Priority: full_name > name > email prefix > fallback
 */

interface UserLike {
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
  email?: string;
}

/**
 * Get the display name for a user, checking all possible metadata fields.
 * @param user - Supabase auth user object
 * @param fallback - Fallback string if no name is found (default: 'User')
 */
export function getUserDisplayName(user: UserLike | null | undefined, fallback = 'User'): string {
  if (!user) return fallback;
  
  const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
  if (fullName) return fullName;
  
  // If falling back to email, format it nicely
  if (user.email) {
    return formatStoredName(user.email, fallback);
  }
  
  return fallback;
}

/**
 * Get the avatar URL for a user, checking all possible metadata fields.
 * @param user - Supabase auth user object
 */
export function getUserAvatarUrl(user: UserLike | null | undefined): string | null {
  if (!user) return null;
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
}

/**
 * Format a stored name that might be an email address into a readable display name.
 * Converts "glen.brandon@tiket.com" → "Glen Brandon"
 * Converts "agung.nugroho@tiket.com" → "Agung Nugroho"
 * Passes through non-email names unchanged.
 * 
 * @param name - The stored name (could be email or display name)
 * @param fallback - Fallback string if name is empty/null
 */
export function formatStoredName(name: string | null | undefined, fallback = 'Unknown'): string {
  if (!name) return fallback;
  
  // Check if the name looks like an email address
  if (name.includes('@')) {
    const localPart = name.split('@')[0];
    // Convert "glen.brandon" or "glen_brandon" or "glen-brandon" to "Glen Brandon"
    return localPart
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  return name;
}