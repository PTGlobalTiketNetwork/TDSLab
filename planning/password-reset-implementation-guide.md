# Password Reset Implementation Guide

## Overview

This document provides a comprehensive guide for implementing a password reset flow using Supabase Auth in React applications. The implementation follows email-based password recovery patterns with dedicated routes and proper session handling.

---

## Architecture Overview

### Flow Diagram

```
User Flow:
1. User clicks "Forgot Password?" on login page
2. User enters email address
3. System sends reset email via Supabase
4. User clicks link in email
5. Supabase validates and creates temporary session
6. User redirected to Update Password page
7. User enters new password
8. Password updated successfully
9. User signed out and redirected to login
```

### Technical Flow

```
Frontend (Forgot Password)
    ↓ (sends email + redirect URL)
Supabase Auth Service
    ↓ (sends email with magic link)
User Email Client
    ↓ (user clicks link)
Supabase Verification Endpoint
    ↓ (validates token, creates session, redirects)
Frontend (Update Password Route)
    ↓ (detects session from URL hash)
Supabase Client (processes hash)
    ↓ (updates password)
Supabase Auth Service
    ↓ (success)
Frontend (logout & redirect to login)
```

---

## Required Components

### 1. Supabase Client Configuration

**File**: `/utils/supabase/client.ts` or similar

**Critical Configuration**:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: {
      // CRITICAL: Enable session detection from URL hash
      detectSessionInUrl: true,
      
      // Use PKCE flow for better security
      flowType: 'pkce',
      
      // Optional: Configure storage
      storage: window.localStorage,
      
      // Optional: Auto refresh tokens
      autoRefreshToken: true,
      
      // Optional: Persist session
      persistSession: true
    }
  }
);
```

**Why `detectSessionInUrl: true` is critical:**
- Supabase embeds session tokens in URL hash after email verification
- Without this, the client won't automatically create a session
- The hash looks like: `#access_token=xxx&type=recovery`

---

### 2. Forgot Password Component

**File**: `/components/auth/ForgotPassword.tsx`

**Purpose**: 
- Collect user email
- Send password reset request to Supabase
- Provide user feedback

**Key Features**:
```typescript
interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // CRITICAL: Specify where to redirect after email verification
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // ... render form UI
}
```

**Important Notes**:
- Use `window.location.origin` for dynamic URL construction
- Always provide user feedback (loading, error, success states)
- Email validation is recommended but optional
- Disable submit button during loading

---

### 3. Update Password Page

**File**: `/pages/UpdatePasswordPage.tsx`

**Purpose**:
- Standalone page for password reset (not a modal/component)
- Works independently from main app session logic
- Handles password update and user feedback

**Key Features**:
```typescript
export function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength (optional but recommended)
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // CRITICAL: Sign out to clear recovery session
      await supabase.auth.signOut();

      // Show success message
      toast.success('Password updated successfully! Please login with your new password.');

      // Redirect to login
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // ... render form UI
}
```

**Important Notes**:
- Always validate password confirmation
- Consider password strength requirements
- Sign out after successful update to clear recovery session
- Provide clear success/error feedback
- Redirect to login after success

---

### 4. Route Configuration

**File**: `/App.tsx` or routing configuration

**CRITICAL IMPLEMENTATION ORDER**:

```typescript
function AppContent() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const location = useLocation();

  // ... auth setup

  // 1. Show loading state first
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // 2. CRITICAL: Check update password route BEFORE session check
  // This allows the page to render even when session exists
  if (location.pathname === '/auth/update-password') {
    return <UpdatePasswordPage />;
  }

  // 3. Then check for authenticated session
  if (!session) {
    return <AuthLayout>
      <Login /> {/* or ForgotPassword based on state */}
    </AuthLayout>;
  }

  // 4. Finally, render authenticated app
  return <MainApp />;
}
```

**Why order matters**:
1. When user clicks email link, Supabase creates a session from the hash
2. If you check `!session` first, user gets redirected to authenticated routes
3. By checking the path first, you ensure UpdatePasswordPage always renders

**Alternative with React Router v6**:
```typescript
<Routes>
  {/* Public route - accessible without session */}
  <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
  
  {/* Protected routes - require session */}
  <Route element={<RequireAuth />}>
    <Route path="/dashboard" element={<Dashboard />} />
    {/* ... other protected routes */}
  </Route>
  
  {/* Auth routes - redirect if session exists */}
  <Route element={<RequireNoAuth />}>
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<SignUp />} />
  </Route>
</Routes>
```

---

## Supabase Dashboard Configuration

### Required Settings

1. **Navigate to**: Supabase Dashboard → Your Project → Authentication → URL Configuration

2. **Add Redirect URL**:
   ```
   https://your-domain.com/auth/update-password
   ```

3. **Site URL** (optional but recommended):
   ```
   https://your-domain.com
   ```

4. **Email Templates** (optional customization):
   - Go to: Authentication → Email Templates
   - Select: "Reset Password"
   - Customize email content and styling
   - Variables available: `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.

### Important Notes

- **Do NOT** add trailing slash: `https://domain.com/auth/update-password/` ❌
- **Correct format**: `https://domain.com/auth/update-password` ✅
- **Multiple environments**: Add URLs for all environments (dev, staging, prod)
- **Localhost**: For development, add `http://localhost:3000/auth/update-password`

---

## Environment Variables

Required environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Custom redirect URL (if not using window.location.origin)
VITE_PASSWORD_RESET_REDIRECT_URL=https://your-domain.com/auth/update-password
```

**Usage in code**:
```typescript
const redirectUrl = import.meta.env.VITE_PASSWORD_RESET_REDIRECT_URL 
  || `${window.location.origin}/auth/update-password`;

await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl });
```

---

## Security Considerations

### 1. Rate Limiting
Supabase provides built-in rate limiting, but consider additional frontend validation:

```typescript
const [requestCount, setRequestCount] = useState(0);
const MAX_REQUESTS = 3;

const handleSubmit = async (e: React.FormEvent) => {
  if (requestCount >= MAX_REQUESTS) {
    setError('Too many requests. Please try again later.');
    return;
  }
  
  setRequestCount(prev => prev + 1);
  // ... rest of submit logic
};
```

### 2. Password Requirements
Enforce strong password requirements:

```typescript
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
};
```

### 3. Token Expiration
Supabase tokens expire after a set time (default: 1 hour). Inform users:

```typescript
<div className="text-sm text-gray-600">
  Reset link will expire in 1 hour. If expired, please request a new one.
</div>
```

### 4. Session Management
Always sign out after password update to clear recovery session:

```typescript
await supabase.auth.updateUser({ password });
await supabase.auth.signOut(); // CRITICAL
```

---

## User Experience Best Practices

### 1. Loading States
Always show loading indicators:

```typescript
<button disabled={loading}>
  {loading ? (
    <>
      <Spinner />
      Sending...
    </>
  ) : (
    'Send Reset Link'
  )}
</button>
```

### 2. Success Feedback
Provide clear success messages:

```typescript
{success && (
  <div className="bg-green-50 text-green-800 p-4 rounded">
    <p className="font-semibold">Check your email!</p>
    <p className="text-sm mt-1">
      We've sent a password reset link to {email}. 
      Click the link to reset your password.
    </p>
  </div>
)}
```

### 3. Error Handling
Handle common errors gracefully:

```typescript
const getErrorMessage = (error: any): string => {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address';
  }
  if (message.includes('user not found')) {
    // Security: Don't reveal if user exists
    return 'If an account exists with this email, you will receive a reset link';
  }
  if (message.includes('rate limit')) {
    return 'Too many requests. Please try again in a few minutes';
  }
  
  return 'Something went wrong. Please try again later';
};
```

### 4. Email Verification Status
Inform users about email delivery:

```typescript
<div className="text-sm text-gray-600 mt-4">
  <p>Didn't receive the email?</p>
  <ul className="list-disc ml-5 mt-2 space-y-1">
    <li>Check your spam folder</li>
    <li>Make sure the email address is correct</li>
    <li>Wait a few minutes and try again</li>
  </ul>
</div>
```

### 5. Password Visibility Toggle
Help users see what they're typing:

```typescript
const [showPassword, setShowPassword] = useState(false);

<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
  </button>
</div>
```

---

## Testing Checklist

### Functional Testing

- [ ] **Request reset email**
  - Valid email sends email
  - Invalid email shows appropriate error
  - Non-existent email shows generic success (security)
  
- [ ] **Email delivery**
  - Email arrives in inbox (not spam)
  - Email contains correct link
  - Link includes proper redirect URL
  
- [ ] **Click reset link**
  - Redirects to `/auth/update-password`
  - Page renders correctly
  - No automatic redirect to other pages
  
- [ ] **Update password**
  - Password validation works
  - Confirmation password must match
  - Successful update shows success message
  - User automatically signed out
  
- [ ] **Post-update**
  - Redirected to login page
  - Can login with new password
  - Cannot login with old password

### Edge Cases

- [ ] **Expired token**
  - Shows appropriate error message
  - Provides link to request new reset
  
- [ ] **Invalid token**
  - Handles gracefully
  - Shows user-friendly error
  
- [ ] **Multiple requests**
  - Rate limiting works
  - Latest link is valid
  
- [ ] **Session conflicts**
  - Works when user is already logged in
  - Works when user has no session
  
- [ ] **Browser refresh**
  - State preserved during password update
  - Can refresh update password page safely

### Security Testing

- [ ] **Token security**
  - Token not exposed in console logs
  - Token not stored in localStorage
  - Token expires appropriately
  
- [ ] **HTTPS enforcement**
  - Redirect URLs use HTTPS in production
  - No mixed content warnings
  
- [ ] **Password requirements**
  - Weak passwords rejected
  - Requirements clearly communicated

---

## Troubleshooting Guide

### Issue: "Page redirects to main app instead of update password page"

**Symptom**: After clicking email link, user lands on authenticated page (e.g., dashboard)

**Cause**: Session check happens before route check in App.tsx

**Solution**:
```typescript
// WRONG ORDER ❌
if (!session) return <Login />;
if (location.pathname === '/auth/update-password') return <UpdatePasswordPage />;

// CORRECT ORDER ✅
if (location.pathname === '/auth/update-password') return <UpdatePasswordPage />;
if (!session) return <Login />;
```

---

### Issue: "Session not created from email link"

**Symptom**: UpdatePasswordPage renders but no session exists

**Cause**: `detectSessionInUrl: true` not set in Supabase client

**Solution**:
```typescript
const supabase = createClient(url, key, {
  auth: {
    detectSessionInUrl: true, // Add this
  }
});
```

---

### Issue: "Redirect URL not authorized error"

**Symptom**: Error message: "redirect_to URL not allowed"

**Cause**: URL not added to Supabase Dashboard allowed list

**Solution**:
1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add exact URL (no trailing slash): `https://domain.com/auth/update-password`
3. Save and wait a few minutes for propagation

---

### Issue: "Email not received"

**Common Causes**:
1. **Email in spam folder** → Check spam/junk
2. **Email provider blocking** → Some providers block Supabase emails
3. **Incorrect email address** → Verify email is correct
4. **Supabase email quota exceeded** → Check Supabase dashboard for limits
5. **Email template disabled** → Verify in Authentication → Email Templates

**Solution**: 
- Configure custom SMTP in Supabase for production
- Use a reliable email service provider
- Add Supabase domain to email whitelist

---

### Issue: "Password update fails silently"

**Symptom**: No error shown but password not updated

**Debugging Steps**:
```typescript
try {
  const { data, error } = await supabase.auth.updateUser({ password });
  console.log('Update response:', { data, error }); // Add logging
  
  if (error) {
    console.error('Update error:', error);
    throw error;
  }
} catch (err) {
  console.error('Caught error:', err);
  setError(err.message);
}
```

**Common Causes**:
- Session expired → Request new reset link
- Invalid session type → Ensure recovery session is active
- Password too weak → Check Supabase password requirements

---

## Migration Guide (For Existing Apps)

### Step 1: Update Supabase Client

```typescript
// Before
export const supabase = createClient(url, key);

// After
export const supabase = createClient(url, key, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
```

### Step 2: Add Components

1. Create `ForgotPassword.tsx` component
2. Create `UpdatePasswordPage.tsx` page
3. Update routing in `App.tsx`

### Step 3: Update Login Component

Add forgot password link:
```typescript
<button 
  onClick={() => setView('forgot_password')}
  className="text-sm text-blue-600 hover:underline"
>
  Forgot password?
</button>
```

### Step 4: Configure Supabase Dashboard

Add redirect URL to allowed list (see configuration section)

### Step 5: Test Thoroughly

Follow testing checklist above

---

## Additional Resources

### Official Documentation
- [Supabase Auth: Reset Password](https://supabase.com/docs/guides/auth/auth-password-reset)
- [Supabase Auth: Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

### Related Patterns
- Email verification flow (similar pattern)
- Magic link authentication (similar pattern)
- Social OAuth redirect handling

### Community Examples
- [Supabase Auth Helpers (React)](https://github.com/supabase/auth-helpers)
- [Supabase Auth UI](https://github.com/supabase/auth-ui)

---

## Changelog

### Version 1.0 (Current Implementation)
- Email-based password reset
- Dedicated update password page
- Proper session handling
- Security best practices
- Comprehensive error handling

### Future Enhancements
- SMS-based password reset
- Two-factor authentication integration
- Password history validation
- Custom email templates with branding
- Multi-language support

---

## Support

For questions or issues:
1. Check troubleshooting guide above
2. Review Supabase Auth documentation
3. Check browser console for detailed errors
4. Verify Supabase Dashboard configuration
5. Test with different email providers

---

**Last Updated**: January 2026  
**Compatibility**: Supabase Auth v2.x, React 18+, React Router v6+
