# Integrasi Supabase Auth & Custom Font Configuration

## Overview
Dokumen ini menjelaskan integrasi Supabase Authentication untuk user session management dan konfigurasi pemuatan Custom Font dari Supabase Storage.

---

## 1. Supabase Authentication Integration

### Setup & Configuration

#### 1.1 Supabase Client Initialization

File: `/utils/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabaseAnonKey = publicAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

#### 1.2 Auth Hook

File: `/src/app/hooks/useAuth.tsx`

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '/utils/supabase/client';

interface User {
  id: string;
  email: string;
  name: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || 'Michael Fernanlie'
        });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || 'Michael Fernanlie'
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
  };
}
```

---

### Authentication Flow

#### Login Page (Optional - untuk prototype gunakan mock session)

```typescript
// File: /src/app/components/auth/LoginPage.tsx

import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (error) {
      console.error('Login error:', error.message);
      // Show toast error
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f9fd]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-6">Login to Dashboard</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 border rounded mb-4"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 border rounded mb-6"
        />
        <button
          type="submit"
          className="w-full bg-[#007bff] text-white p-3 rounded font-bold"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
```

#### Protected Dashboard Route

```typescript
// File: /src/app/App.tsx

import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // UNTUK PROTOTYPE: Skip login, langsung tampilkan dashboard dengan mock user
  // Uncomment line di bawah untuk enable actual auth:
  // if (!user) return <LoginPage />;

  return <Dashboard user={user || { 
    id: 'mock-user-001', 
    email: 'michael.fernanlie@tiket.com', 
    name: 'Michael Fernanlie' 
  }} />;
}
```

---

### Sidebar User Info Display

```typescript
// File: /src/app/components/sidebar/UserInfo.tsx

import { useAuth } from '../../hooks/useAuth';

export function UserInfo() {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Use mock user if no auth session
  const displayUser = user || { 
    name: 'Michael Fernanlie', 
    email: 'michael.fernanlie@tiket.com' 
  };

  const handleSignOut = async () => {
    await signOut();
    // Redirect or show login page
  };

  return (
    <div className="px-[28px] py-4 border-t border-[#d8dce8]">
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-[#71747d] leading-[16px]">
          You're logged in as
        </p>
        <div className="flex items-center justify-between">
          <p className="font-bold text-[14px] text-[#303135] leading-[20px]">
            {displayUser.name}
          </p>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-[#4D4F56]"
          >
            {/* Chevron icon */}
          </button>
        </div>
      </div>
      
      {/* Dropdown menu (optional) */}
      {isDropdownOpen && (
        <div className="mt-2 bg-white border rounded shadow-lg">
          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 2. Custom Font Configuration

### Font dari Supabase Storage

#### 2.1 Storage Bucket Setup (Backend - Server Side)

File: `/supabase/functions/server/index.tsx`

```typescript
import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { createClient } from 'npm:@supabase/supabase-js';

const app = new Hono();

app.use('*', cors());

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Create fonts bucket on startup
async function initializeFontsBucket() {
  const bucketName = 'make-9ee0fe87-fonts';
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, {
      public: true, // Public bucket untuk fonts
      fileSizeLimit: 5242880, // 5MB limit
      allowedMimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2']
    });
    console.log(`Created fonts bucket: ${bucketName}`);
  }
}

// Initialize on server start
initializeFontsBucket();

// Route untuk get font URL
app.get('/make-server-9ee0fe87/fonts/:fontName', async (c) => {
  const fontName = c.req.param('fontName');
  const bucketName = 'make-9ee0fe87-fonts';
  
  // Get public URL (karena bucket public)
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fontName);
  
  return c.json({ url: data.publicUrl });
});

Deno.serve(app.fetch);
```

#### 2.2 Font CSS Configuration

File: `/src/styles/fonts.css`

```css
/* 
  Custom Font: Tiket Odyssey Text
  Akan di-load dari Supabase Storage bucket
  
  INSTRUKSI KONFIGURASI:
  1. Upload font files ke Supabase Storage bucket 'make-9ee0fe87-fonts':
     - TiketOdyssey-Regular.woff2
     - TiketOdyssey-Bold.woff2
  
  2. Dapatkan public URL dari font files
  
  3. Update @font-face src URL di bawah dengan actual URLs
*/

/* Tiket Odyssey Text - Regular */
@font-face {
  font-family: 'Tiket Odyssey Text';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  /* PLACEHOLDER: Replace dengan actual Supabase Storage URL */
  src: url('https://[PROJECT_ID].supabase.co/storage/v1/object/public/make-9ee0fe87-fonts/TiketOdyssey-Regular.woff2') format('woff2');
}

/* Tiket Odyssey Text - Bold */
@font-face {
  font-family: 'Tiket Odyssey Text';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  /* PLACEHOLDER: Replace dengan actual Supabase Storage URL */
  src: url('https://[PROJECT_ID].supabase.co/storage/v1/object/public/make-9ee0fe87-fonts/TiketOdyssey-Bold.woff2') format('woff2');
}

/* Fallback: Gunakan system fonts jika custom fonts gagal load */
body {
  font-family: 'Tiket Odyssey Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', 
               'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
               'Droid Sans', 'Helvetica Neue', sans-serif;
}
```

#### 2.3 Alternative: Inline Base64 Fonts (Temporary Solution)

Jika Supabase Storage belum dikonfigurasi, gunakan Base64 encoding sebagai temporary solution:

```css
/* fonts.css - Base64 embedded fonts */

@font-face {
  font-family: 'Tiket Odyssey Text';
  font-weight: 400;
  src: url(data:font/woff2;base64,[BASE64_STRING_HERE]) format('woff2');
}

@font-face {
  font-family: 'Tiket Odyssey Text';
  font-weight: 700;
  src: url(data:font/woff2;base64,[BASE64_STRING_HERE]) format('woff2');
}
```

**Note**: Base64 approach akan membuat file CSS sangat besar. Hanya gunakan untuk prototyping.

#### 2.4 Update Tailwind Config (jika menggunakan Tailwind v3)

**CATATAN**: Project ini menggunakan Tailwind v4, jadi font configuration via theme.css

File: `/src/styles/theme.css`

```css
/* Add custom font family CSS variable */
@layer base {
  :root {
    --font-tiket: 'Tiket Odyssey Text', sans-serif;
  }
}

/* Apply to body and common elements */
body {
  font-family: var(--font-tiket);
}

/* Heading defaults */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-tiket);
  font-weight: 700;
}

p, span, div {
  font-family: var(--font-tiket);
  font-weight: 400;
}
```

---

## 3. Environment Variables Setup

### Required Environment Variables

```env
# Supabase (Already configured)
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_ANON_KEY=[PUBLIC_ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Optional: untuk custom configuration
SUPABASE_FONTS_BUCKET=make-9ee0fe87-fonts
SUPABASE_BANNERS_BUCKET=make-9ee0fe87-banners
```

---

## 4. Upload Custom Font ke Supabase Storage

### Menggunakan Supabase Dashboard:

1. Login ke Supabase Dashboard
2. Pilih project
3. Navigate ke Storage → Buckets
4. Buat bucket baru: `make-9ee0fe87-fonts` (public bucket)
5. Upload font files:
   - TiketOdyssey-Regular.woff2
   - TiketOdyssey-Bold.woff2
6. Copy public URLs untuk setiap file
7. Update `/src/styles/fonts.css` dengan URLs tersebut

### Menggunakan Supabase CLI (Advanced):

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Upload font files
supabase storage upload make-9ee0fe87-fonts/TiketOdyssey-Regular.woff2 ./fonts/TiketOdyssey-Regular.woff2
supabase storage upload make-9ee0fe87-fonts/TiketOdyssey-Bold.woff2 ./fonts/TiketOdyssey-Bold.woff2

# Get public URLs
supabase storage get-url make-9ee0fe87-fonts/TiketOdyssey-Regular.woff2
supabase storage get-url make-9ee0fe87-fonts/TiketOdyssey-Bold.woff2
```

---

## 5. Testing & Verification

### Auth Testing Checklist:

- [ ] User dapat login dengan credentials yang valid
- [ ] Session persist setelah page refresh
- [ ] User info ditampilkan di sidebar bottom
- [ ] Sign out functionality works
- [ ] Protected routes redirect ke login jika not authenticated

### Font Loading Testing Checklist:

- [ ] Font 'Tiket Odyssey Text' Regular loaded successfully
- [ ] Font 'Tiket Odyssey Text' Bold loaded successfully
- [ ] Fallback fonts works jika custom font gagal load
- [ ] Font rendering konsisten di semua browsers
- [ ] No CORS errors di browser console

### Browser DevTools Verification:

```javascript
// Check di browser console
// 1. Verify font loaded
document.fonts.check('16px Tiket Odyssey Text'); // should return true

// 2. Check auth session
console.log(await supabase.auth.getSession());

// 3. Check current user
console.log(await supabase.auth.getUser());
```

---

## 6. Troubleshooting

### Font tidak muncul:

**Problem**: Font custom tidak load, fallback font yang digunakan

**Solutions**:
1. Check CORS headers di Supabase Storage bucket settings
2. Verify public URL accessible di browser
3. Check browser console untuk error messages
4. Pastikan font format correct (woff2 recommended)
5. Clear browser cache

### Auth Session tidak persist:

**Problem**: User harus login ulang setelah refresh

**Solutions**:
1. Check localStorage untuk supabase session
2. Verify SUPABASE_ANON_KEY correct
3. Check token expiration time
4. Implement session refresh logic

### CORS Errors:

**Problem**: CORS error saat fetch font atau API

**Solutions**:
1. Add CORS headers di Supabase Storage bucket
2. Enable CORS di Edge Functions
3. Whitelist domain di Supabase dashboard

---

## 7. Production Checklist

Sebelum deploy ke production:

- [ ] Replace semua mock data dengan actual Supabase data
- [ ] Upload production-ready font files ke Supabase Storage
- [ ] Update font URLs di fonts.css dengan production URLs
- [ ] Configure proper CORS policies
- [ ] Set up proper error handling untuk auth failures
- [ ] Implement rate limiting untuk auth endpoints
- [ ] Add analytics tracking untuk user sessions
- [ ] Test di multiple browsers and devices
- [ ] Configure session timeout policies
- [ ] Set up email confirmation flow (disable email_confirm: true)

---

## Notes

1. **Prototype Mode**: Untuk development awal, gunakan mock user data dan skip actual authentication. Enable auth di fase berikutnya.

2. **Font Loading**: Prioritas gunakan Supabase Storage untuk fonts. Jika belum ready, gunakan system fonts temporary atau embedded Base64.

3. **Security**: NEVER expose SUPABASE_SERVICE_ROLE_KEY di frontend. Hanya gunakan di server-side code.

4. **Performance**: Font files harus di-optimize (woff2 format, subset jika possible) untuk fast loading.

5. **Accessibility**: Ensure fallback fonts provide similar reading experience jika custom fonts gagal load.
