import { Navigate } from 'react-router-dom';
import { useAccess } from '../../context/AccessContext';

export function AccessGate({ adminOnly = false, children }: { adminOnly?: boolean; children: React.ReactNode }) {
  const access = useAccess();
  if (access.loading) return <div className="grid min-h-[40vh] place-items-center text-sm text-[#71747d]">Checking access…</div>;
  if (!access.isWhitelisted || (adminOnly && !access.isAdmin)) return <Navigate to="/banners/promo-banner" replace />;
  return <>{children}</>;
}
