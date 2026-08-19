import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../../utils/supabase/client';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';

interface UpdatePasswordProps {
  onUpdateSuccess: () => void;
}

export function UpdatePassword({ onUpdateSuccess }: UpdatePasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match");
        return;
    }
    if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters");
        return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast.custom((t) => <TiketSnackbar id={t} message="Password updated successfully. Please log in again." variant="default" />);
      
      // Clear the hash from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      onUpdateSuccess();
    } catch (error: any) {
      const msg = error.message || 'Failed to update password';
      setErrorMsg(msg);
      toast.custom((t) => <TiketSnackbar id={t} message={msg} variant="error" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] bg-white p-[32px] rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-bold text-[#303135]">Update Password</h1>
        <p className="text-[14px] text-[#71747d]">
          Enter your new password below.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-[#fff0f0] border border-[#d4183d] rounded-[8px] p-[12px] flex items-start gap-[8px]">
          <div className="shrink-0 text-[#d4183d] mt-[2px]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5ZM8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M8 4C8.41421 4 8.75 4.33579 8.75 4.75V8.25C8.75 8.66421 8.41421 9 8 9C7.58579 9 7.25 8.66421 7.25 8.25V4.75C7.25 4.33579 7.58579 4 8 4Z" fill="currentColor"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M8 10.5C8.55228 10.5 9 10.9477 9 11.5C9 12.0523 8.55228 12.5 8 12.5C7.44772 12.5 7 12.0523 7 11.5C7 10.9477 7.44772 10.5 8 10.5Z" fill="currentColor"/>
            </svg>
          </div>
          <p className="text-[12px] text-[#303135] leading-[20px]">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleUpdate} className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-[#303135]">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none transition-all text-[14px]"
            placeholder="Enter new password"
            required
            minLength={6}
          />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-[#303135]">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none transition-all text-[14px]"
            placeholder="Confirm new password"
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#007BFF] hover:bg-[#0064D2] text-white font-medium py-[10px] rounded-[24px] transition-colors flex items-center justify-center gap-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="animate-spin" size={16} />}
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}