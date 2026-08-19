import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { supabase } from '../../../utils/supabase/client';
import { toast } from 'sonner';
import { TiketSnackbar } from '../ui/TiketSnackbar';

interface SignUpProps {
  onSwitchToLogin: () => void;
  onSignUpSuccess: () => void;
}

export function SignUp({ onSwitchToLogin, onSignUpSuccess }: SignUpProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call the server endpoint for signup
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-67753e13/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sign up');
      }

      // Auto login after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast.custom((t) => <TiketSnackbar id={t} message="Account created successfully!" variant="default" />);
      onSignUpSuccess();
    } catch (error: any) {
      console.error(error);
      toast.custom((t) => <TiketSnackbar id={t} message={error.message || 'Error signing up'} variant="error" />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] bg-white p-[32px] rounded-[12px] shadow-[0px_2px_8px_0px_rgba(48,49,53,0.16)] flex flex-col gap-[24px]">
      <div className="flex flex-col gap-[8px]">
        <h1 className="text-[24px] font-bold text-[#303135]">Sign Up</h1>
        <p className="text-[14px] text-[#71747d]">
          Create an account to manage your banners.
        </p>
      </div>

      <form onSubmit={handleSignUp} className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-[#303135]">Full Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none transition-all text-[14px]"
            placeholder="John Doe"
            required
          />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-[#303135]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none transition-all text-[14px]"
            placeholder="name@company.com"
            required
          />
        </div>

        <div className="flex flex-col gap-[8px]">
          <label className="text-[14px] font-medium text-[#303135]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-[12px] py-[10px] rounded-[8px] border border-[#d8dce8] focus:border-[#007BFF] focus:ring-1 focus:ring-[#007BFF] outline-none transition-all text-[14px]"
            placeholder="Create a password"
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
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="text-center text-[14px] text-[#71747d]">
        Already have an account?{' '}
        <button
          onClick={onSwitchToLogin}
          className="text-[#007BFF] font-medium hover:underline"
        >
          Log In
        </button>
      </div>
    </div>
  );
}