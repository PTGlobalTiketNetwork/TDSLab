import React from 'react';
import { ImageGeneration } from '../components/tools/ImageGeneration';
import { Session } from '@supabase/supabase-js';

interface ImageGenerationPageProps {
  isSidebarCollapsed: boolean;
  session: Session | null;
}

export function ImageGenerationPage({ isSidebarCollapsed, session }: ImageGenerationPageProps) {
  return (
    <div className="px-[24px] py-[24px] min-h-screen bg-[#f8f9fd]">
      <ImageGeneration session={session} />
    </div>
  );
}
