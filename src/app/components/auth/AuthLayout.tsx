import { ReactNode } from 'react';
import LogoTiketHorizontal from '../../../imports/LogoTiketHorizontal-7-464';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fd] flex flex-col items-center justify-center p-4">
      <div className="mb-8 w-[200px]">
        <LogoTiketHorizontal />
      </div>
      {children}
    </div>
  );
}
