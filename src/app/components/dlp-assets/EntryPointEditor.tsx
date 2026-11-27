import { useEffect, useRef, useState } from 'react';
import { useStickyBar, STICKY_SHADOW } from '@/hooks/useStickyBar';
import { BannerFormData } from '../create-banner/types';
import { FormStep2 } from '../create-banner/FormStep2';
import { FormStep3 } from '../create-banner/FormStep3';
import { LivePreview } from '../create-banner/LivePreview';
import { RadioScope } from '../create-banner/components/Radio';

interface Props {
  formData: BannerFormData;
  onChange: (updates: Partial<BannerFormData>) => void;
  tabsExtra?: React.ReactNode; // right side of the tab bar
}

/**
 * Entry Point Banner editor. Same forms and preview as the Promo Banner flow
 * (Content nudge, Key visual & logo, Live preview) with the layout fixed by the caller.
 */
export function EntryPointEditor({ formData, onChange, tabsExtra }: Props) {
  const [sub, setSub] = useState<'content' | 'visual'>('content');
  const [activeTab, setActiveTab] = useState<'en' | 'id'>('en');
  const [deviceTab, setDeviceTab] = useState<'mobile' | 'desktop'>('mobile');
  const [previewTab, setPreviewTab] = useState<'mobile' | 'desktop' | 'all'>('all');
  const [isTranslating, setIsTranslating] = useState(false);

  // On small screens the preview stays pinned above the form for every ratio (desktop: EN / ID side by side; taller ratios are capped to half the viewport and scroll inside).
  // The form's own sticky bars (EN / ID tabs…) must then sit below it, so measure the pinned preview's height.
  const previewRef = useRef<HTMLDivElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const { shadow: tabBarShadow } = useStickyBar(tabBarRef);
  const [wide, setWide] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 1024px)').matches);
  const [pinnedH, setPinnedH] = useState(0);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  // Below 1200px the 3:4 DLP preview is shrunk to half its usual size cap so it stops crowding the form.
  const [under1200, setUnder1200] = useState(() => typeof window === 'undefined' || window.matchMedia('(max-width: 1199px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1199px)');
    const on = () => setUnder1200(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    const el = previewRef.current;
    if (!el || wide) { setPinnedH(0); return; }
    const ro = new ResizeObserver(() => setPinnedH(el.offsetHeight));
    ro.observe(el);
    setPinnedH(el.offsetHeight);
    return () => ro.disconnect();
  }, [wide, sub, activeTab, previewTab]);

  return (
    <RadioScope>
    <div className="flex flex-col gap-[16px] lg:gap-0">
      {/* Sticky right under the card title row (56px) when inside the DLP flow */}
      <div ref={tabBarRef} className={`sticky top-[calc(var(--ep-head-top,0px)+56px)] z-[29] bg-white flex items-center justify-between -mx-[24px] px-[24px] ${tabBarShadow ? STICKY_SHADOW : 'border-b border-[#e9ebef]'}`}>
        <div className="flex">
        {([['content', 'Content Nudge'], ['visual', 'Visual & Logo']] as const).map(([id, text]) => (
          <button key={id} type="button" onClick={() => setSub(id)}
            className={`px-[16px] pt-[10px] pb-[7px] text-[16px] leading-[22px] font-bold border-b-[3px] rounded-t-[3px] transition-colors ${sub === id ? 'text-[#007BFF] border-[#007BFF]' : 'text-[#71747d] border-transparent hover:text-[#303135]'}`}>
            {text}
          </button>
        ))}
        </div>
        {tabsExtra}
      </div>
      {/* Below lg the preview stacks above the form so neither column gets squeezed (pinned) */}
      <div className="flex flex-col gap-[24px] lg:flex-row lg:gap-0" style={{ '--sticky-top': 'calc(var(--ep-head-top, var(--sticky-base, 0px)) + 56px + 43px)' } as React.CSSProperties}>
        <div
          className="flex-1 min-w-0 flex flex-col lg:max-w-[680px] lg:pr-[24px] lg:pt-[16px]"
          style={pinnedH ? { '--sticky-top': `calc(var(--ep-head-top, var(--sticky-base, 0px)) + 56px + 43px + ${pinnedH}px)` } as React.CSSProperties : undefined}
        >
          {sub === 'content' ? (
            <FormStep2
              formData={formData}
              onChange={onChange}
              activeTab={activeTab}
              deviceTab={deviceTab}
              onDeviceTabChange={setDeviceTab}
              onTabChange={setActiveTab}
              isTranslating={isTranslating}
              setIsTranslating={setIsTranslating}
              embedded
            />
          ) : (
            <FormStep3 formData={formData} onChange={onChange} deviceTab={deviceTab} onDeviceTabChange={setDeviceTab} embedded />
          )}
        </div>

        {/* Divider: self-stretch so it always spans the full row height, unlike the border-r it replaces which only matched the shorter column's own content height */}
        <div className="hidden lg:block w-px self-stretch bg-[#d8dce8] shrink-0" />

        <div
          ref={previewRef}
          // Full-width + opaque: this is the element that stays pinned (sticky) while the form scrolls underneath it, so it must fully cover whatever scrolls past — the size cap below lives on an inner wrapper instead, so it never leaves transparent gutters exposing the scrolled content.
          className="flex-1 min-w-0 flex flex-col gap-[16px] order-first border-b border-[#e9ebef] lg:order-none lg:pb-0 lg:border-b-0 lg:pl-[24px] lg:sticky lg:top-[var(--sticky-top)] lg:self-start sticky top-[var(--sticky-top)] z-[28] bg-white pb-[12px] pt-[8px] lg:pt-[16px] w-full"
        >
          <h2 className="text-[18px] font-bold text-[#303135] leading-[24px]">Preview</h2>
          <div
            // No scrolling inside the pinned preview. Tall ratios are narrowed so the pair never gets taller than ~viewport height — on short desktop windows it keeps the 3:4/1:1 preview from pushing the form down.
            style={{ maxWidth: formData.bannerRatio === 'Portrait (3:4)' ? (under1200 ? 'calc(34vh + 8px)' : 'calc(68vh + 16px)') : formData.bannerRatio === 'Square (1:1)' ? 'calc(90vh + 16px)' : undefined, marginInline: 'auto', width: '100%' }}
          >
            <LivePreview
              formData={formData}
              onChange={onChange}
              currentStep={sub === 'content' ? 3 : 4}
              activeTab={activeTab}
              deviceTab={previewTab}
              onDeviceTabChange={setPreviewTab}
              isTranslating={isTranslating}
              embedded
            />
          </div>
        </div>
      </div>
    </div>
    </RadioScope>
  );
}
