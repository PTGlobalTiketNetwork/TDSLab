import { UpdatePassword } from '@/app/components/auth/UpdatePassword';
import { AuthLayout } from '@/app/components/auth/AuthLayout';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/utils/supabase/client';

export function UpdatePasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout>
      <UpdatePassword 
        onUpdateSuccess={async () => {
          // Sign out user after password update
          await supabase.auth.signOut();
          // Navigate to login page
          navigate('/', { replace: true });
        }} 
      />
    </AuthLayout>
  );
}
