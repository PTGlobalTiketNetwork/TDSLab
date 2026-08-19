import React from 'react';
import { BannerTranslate } from '../components/tools/BannerTranslate';
import { Session } from '@supabase/supabase-js';

interface BannerTranslatePageProps {
  isSidebarCollapsed: boolean;
  session: Session | null;
}

export function BannerTranslatePage({ isSidebarCollapsed, session }: BannerTranslatePageProps) {
  return (
    <div className="px-[24px] py-[24px] min-h-screen bg-[#f8f9fd]">
      <BannerTranslate session={session} />
    </div>
  );
}
