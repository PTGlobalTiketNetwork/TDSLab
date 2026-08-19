import React from 'react';
import { GenerativeResize } from '../components/tools/GenerativeResize';
import { Session } from '@supabase/supabase-js';

interface GenerativeResizePageProps {
  isSidebarCollapsed: boolean;
  session: Session | null;
}

export function GenerativeResizePage({ isSidebarCollapsed, session }: GenerativeResizePageProps) {
  return (
    <div className="px-[24px] py-[24px] min-h-screen bg-[#f8f9fd]">
      <GenerativeResize session={session} />
    </div>
  );
}
