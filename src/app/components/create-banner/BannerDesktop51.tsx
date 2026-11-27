import { forwardRef, useEffect, useRef, useState } from 'react';
import { BannerFormData } from './types';
import { BannerLegacy } from './BannerLegacy';
import { BoundingBox } from './components/BoundingBox';
import { ImageBox } from './components/ImageBox';
import { tagsToHtml, getDefaultDesktopContentScale, getDefaultDesktopCampaignAssetScale } from './utils/layoutUtils';
import exampleImage from 'figma:asset/c593b610d3877a5faf067379a77363d554217a35.png';

interface BannerDesktop51Props {
  formData: BannerFormData;
  lang: 'en' | 'id';
  label?: string;
  previewUrl: string | null;
  fullSize?: boolean; // export mode: render at the native 2000×400
  onFormChange?: (updates: Partial<BannerFormData>) => void; // editor preview: bounding box + key visual drag
  isDraggable?: boolean; // key visual can be dragged (Step 3)
  onMouseDown?: (e: React.MouseEvent) => void;
}

// Canvas of the Desktop 5:1 layout (Figma "Guideline Banner Desktop")
const W = 2000;
// Height per desktop ratio: 5:1 = 2000×400; 4:1 (DLP Header desktop) = 2000×500, same layout, more vertical room
const H_BY_RATIO: Partial<Record<BannerFormData['bannerRatio'], number>> = { 'Desktop (4:1)': 500 };
export const desktopCanvasHeight = (ratio?: BannerFormData['bannerRatio']) => (ratio && H_BY_RATIO[ratio]) || 400;
// The content block is the very same component as the 2:1 banner (headline, sub-headline, benefits, labels),
// drawn at its native 2:1 size and scaled up by K, so spacing and colours always match the mobile banner.
const K = 1.6;
const CONTENT_AREA_W = 782; // Figma content frame
const CONTENT_W = CONTENT_AREA_W / K;

/**
 * Desktop 5:1 banner. Content comes from the 2:1 component (BannerLegacy `contentOnly`);
 * this file only adds the 5:1 frame: full-bleed key visual + overlay, CTA and T&C.
 */
export const BannerDesktop51 = forwardRef<HTMLDivElement, BannerDesktop51Props>(({ formData, lang, label, previewUrl, fullSize, onFormChange, isDraggable }, ref) => {
  const content = formData.content[lang];
  const H = desktopCanvasHeight(formData.bannerRatio);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const update = () => { if (fullSize) { setScale(1); return; } const w = wrapRef.current?.clientWidth; if (w) setScale(w / W); };
    update();
    const ro = new ResizeObserver(update);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [fullSize]);

  // Default content scale: 180% for the DLP Header 4:1, else 140% (125% with a second discount)
  const defaultScale = getDefaultDesktopContentScale(formData);
  const cs = (formData.desktopContentScale ?? defaultScale) / 100;
  const showCta = formData.desktopCtaEnabled === true && formData.bannerRatio !== 'Desktop (4:1)'; // 4:1 (DLP Header) has no CTA
  const contentLeft = showCta ? 639 : 880;
  const half = 175 * cs; // ~ half of the visible content (headline / benefit), not the 782px box
  const xMin = 360 + half - (contentLeft + CONTENT_AREA_W / 2); // clear of the logo area on the left
  const xMax = (showCta ? 1480 : 1920) - half - (contentLeft + CONTENT_AREA_W / 2); // clear of the CTA on the right (T&C is only a small corner)
  const offsetX = Math.min(xMax, Math.max(xMin, formData.desktopContentOffsetX ?? 0));
  const offsetY = formData.desktopContentOffsetY ?? 0;
  const kvScale = (formData.desktopKeyVisualScale ?? 100) / 100;
  const kvPos = formData.desktopKeyVisualPosition ?? { x: 50, y: 50 }; // % — same positioning model as the 2:1 key visual
  // Stand alone 5:1 uses the generic logo fields; a 5:1 bundled with a 2:1 has its own (not derived from the 2:1) with optional asset override
  const standalone = formData.bannerRatio === 'Desktop (5:1)' || formData.bannerRatio === 'Desktop (4:1)';
  const showCampaign = standalone ? !!formData.showCampaignLogo : !!formData.desktopShowCampaignLogo;
  const campaignSrc = (standalone ? formData.campaignLogo : (formData.desktopCampaignLogo || formData.campaignLogo)) || exampleImage;
  const showPartnerOn = standalone ? !!formData.showPartnerLogo : !!formData.desktopShowPartnerLogo;
  const partners = standalone ? (formData.partnerLogos ?? []) : (formData.desktopPartnerLogoMode === 'custom' ? (formData.desktopPartnerLogos ?? []) : (formData.partnerLogos ?? []));
  const pillScale = formData.desktopPillScale ?? 100;
  const assetScale = (formData.desktopCampaignAssetScale ?? getDefaultDesktopCampaignAssetScale(formData)) / 100;
  const cLogoScale = formData.desktopCampaignLogoScale ?? 100;
  const cLogoX = formData.desktopCampaignLogoX ?? 24;
  const cLogoY = formData.desktopCampaignLogoY ?? 24;
  const tncWidth = formData.desktopTncWidth ?? 720;
  const tncOffset = formData.desktopTncOffset ?? { x: 0, y: 0 };
  const ovHex = (formData.desktopOverlayColor ?? '#000000').replace('#', '');
  const ovRgb = [0, 2, 4].map((i) => parseInt(ovHex.slice(i, i + 2) || '00', 16) || 0).join(',');
  // Overlay: same Opacity / Start / Stop model as the 2:1 overlay, mirrored (opaque at the right, under the content)
  const overlayBg = (opacity: number, start: number, stop: number) =>
    `linear-gradient(270deg, rgba(${ovRgb},${opacity}) 0%, rgba(${ovRgb},${opacity}) ${start}%, rgba(${ovRgb},0) ${Math.max(start + 1, stop)}%)`;
  const ctaText = content.ctaText || (lang === 'en' ? 'Book Now' : 'Pesan Sekarang'); // same text as the mobile CTA

  // Feed the 2:1 component: same content/settings, but force the 2:1 layout and drop what 5:1 draws itself (CTA, offsets)
  const mobileForm: BannerFormData = {
    ...formData,
    bannerCategory: 'Promo Banner',
    bannerRatio: 'Landscape (2:1)',
    showPortraitCta: false,
    landscapeContentScale: 100,
    portraitContentOffsetY: 0,
  };

  return (
    <div ref={ref} className="flex flex-col gap-[8px] w-full">
      {label && (
        <div className="bg-[#f2f8ff] rounded-[4px] p-[10px] w-full">
          <div className="flex gap-[8px] items-center">
            <span className="text-[18px] leading-none shrink-0" role="img" aria-label={lang}>{lang === 'en' ? '🇺🇸' : '🇮🇩'}</span>
            <p className="text-[16px] font-bold leading-[22px] text-[#71747d]">{label}</p>
          </div>
        </div>
      )}
      <div ref={wrapRef} className="relative overflow-hidden rounded-[12px]" style={{ height: H * scale, width: fullSize ? W : '100%' }}>
        <div data-canvas-w={W} className="absolute top-0 left-0 overflow-hidden" style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: 'top left', background: '#e9ebef' }}>
          {/* Key visual — full-bleed background like the 2:1 banner (position in %, scale in %), faded under the content */}
          {previewUrl && isDraggable && onFormChange ? (
            <ImageBox
              wrapperStyle={{ position: 'absolute', left: `${kvPos.x}%`, top: `${kvPos.y}%`, width: 'auto', minWidth: '100%', transform: `translate3d(-50%, -50%, 0) scale(${kvScale})` }}
              position={kvPos}
              scale={formData.desktopKeyVisualScale ?? 100} scaleMin={5} scaleMax={250}
              onPositionChange={(p) => onFormChange({ desktopKeyVisualPosition: p })}
              onScaleChange={(s) => onFormChange({ desktopKeyVisualScale: s })}
            >
              <img src={previewUrl} alt="Key visual" crossOrigin="anonymous" draggable={false} style={{ display: 'block', width: 'auto', minWidth: '100%', height: 'auto', maxWidth: 'none' }} />
            </ImageBox>
          ) : (
            <img
              src={previewUrl || exampleImage}
              alt="Key visual"
              crossOrigin="anonymous"
              draggable={false}
              className="absolute pointer-events-none select-none"
              style={previewUrl ? {
                left: `${kvPos.x}%`, top: `${kvPos.y}%`, width: 'auto', minWidth: '100%', height: 'auto', maxWidth: 'none',
                transform: `translate3d(-50%, -50%, 0) scale(${kvScale})`,
              } : {
                left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover',
              }}
            />
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: overlayBg((formData.desktopOverlayOpacity ?? 100) / 100, formData.desktopGradientStop ?? 45, formData.desktopGradientEnd ?? 80) }} />
          {formData.desktopOverlay2Enabled && <div className="absolute inset-0 pointer-events-none" style={{ background: overlayBg((formData.desktopOverlay2Opacity ?? 100) / 100, formData.desktopGradientStop2 ?? 80, formData.desktopGradientEnd2 ?? 100) }} />}

          {/* Content — the 2:1 component, scaled */}
          <BoundingBox
            enabled={!!onFormChange}
            className="absolute top-0 flex items-center justify-center z-[2]"
            style={{ left: contentLeft, width: CONTENT_AREA_W, height: H, transform: `translate(${offsetX}px, ${offsetY}px) scale(${cs})`, transformOrigin: 'center' }}
            selfScale={cs}
            offsetY={offsetY} offsetUnit={1} offsetMin={-(H / 2 - 50)} offsetMax={H / 2 - 50}
            onOffsetChange={(v) => onFormChange?.({ desktopContentOffsetY: v })}
            offsetX={offsetX} offsetXMin={xMin} offsetXMax={xMax}
            onOffsetXChange={(v) => onFormChange?.({ desktopContentOffsetX: v })}
            scale={formData.desktopContentScale ?? defaultScale} scaleMin={60} scaleMax={200}
            onScaleChange={(v) => onFormChange?.({ desktopContentScale: v })}
          >
            <div style={{ width: CONTENT_W, height: 300, transform: `scale(${K})`, transformOrigin: 'center', flexShrink: 0 }}>
              <BannerLegacy
                formData={mobileForm}
                lang={lang}
                scale={100}
                position={{ x: 50, y: 50 }}
                previewUrl={null}
                hideHeader
                contentOnly={{ width: CONTENT_W, center: true, verticalCenter: formData.desktopVerticalCenter !== false }}
              />
            </div>
          </BoundingBox>

          {/* Logos. Campaign logo: radio "sticky" (pill at the top-left, same template as the partner logos, own background colour)
              or "free" (placed anywhere, no background). One scale drives both the campaign and the partner logo. */}
          {(() => {
            // The pill is laid out at the default 160% asset size; "Partner asset size" only scales the logos inside it.
            const pa = 1.6;
            const logoScale = (formData.desktopPartnerAssetScale ?? 160) / 160;
            const pillBase: React.CSSProperties = { display: 'flex', alignItems: 'center', height: 52, paddingLeft: 32, paddingRight: 32, gap: 32, borderRadius: '0 43px 43px 0', width: 'fit-content' };
            const partnerGap = Math.max(16, (formData.desktopPartnerGap ?? 36) * pa); // spacing between assets: never tighter than 16px
            const partnerPill: React.CSSProperties = { ...pillBase, height: 'auto', minHeight: 52, paddingTop: Math.max(8, 10 * pa), paddingBottom: Math.max(8, 10 * pa), paddingLeft: Math.max(12, 20 * pa), paddingRight: Math.max(12, 20 * pa), gap: partnerGap };
            const campaignImg = <img src={campaignSrc} alt="Campaign logo" crossOrigin="anonymous" draggable={false} style={{ height: Math.min(48, 30 * assetScale), width: 'auto', maxWidth: Math.min(140, 110 * assetScale), objectFit: 'contain' }} onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />;
            const sticky = (formData.desktopCampaignLogoMode ?? 'sticky') === 'sticky';
            const showPartner = showPartnerOn && partners.length > 0;
            return (
              <>
                {(showPartner || (showCampaign && sticky)) && (
                  <div className="absolute z-[2] flex" style={{ left: 0, top: 24, transform: `scale(${pillScale / 100})`, transformOrigin: 'top left' }}>
                    {showCampaign && sticky && showPartner ? (
                      // Both on (Figma 83:743): one pill — campaign logo segment with a slanted edge, then the partner logos
                      <>
                        <div style={{ minHeight: 52, padding: '0 36px 0 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, flexShrink: 0, background: formData.desktopCampaignLogoBgEnabled === false ? '#FFFFFF' : (formData.desktopCampaignLogoBg ?? '#007BFF'), borderRadius: '0 100px 100px 0' }}>
                          <img src={campaignSrc} alt="Campaign logo" crossOrigin="anonymous" draggable={false} style={{ height: Math.min(48, 30 * assetScale), width: 'auto', maxWidth: Math.min(140, 110 * assetScale), objectFit: 'contain' }} onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                        </div>
                        <div style={{ ...partnerPill, marginLeft: -44, paddingLeft: 44 + Math.max(12, 16 * pa), background: formData.desktopPartnerLogoBgEnabled === false ? 'transparent' : (formData.desktopPartnerLogoBg ?? '#FFFFFF') }}>
                          {partners.slice(0, 4).map((slot, idx) => {
                            const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                            const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                            return <img key={slot.id || idx} src={imgSrc} alt="Partner" crossOrigin="anonymous" draggable={false} style={{ height: 34 * pa, width: 'auto', maxWidth: 140 * pa, objectFit: 'contain', transform: `scale(${logoScale})` }}  onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />;
                          })}
                        </div>
                      </>
                    ) : (
                      <>
                        {showCampaign && sticky && (
                          <div style={{ ...pillBase, paddingLeft: 24, paddingRight: 36, justifyContent: 'center', borderRadius: '0 100px 100px 0', background: formData.desktopCampaignLogoBgEnabled === false ? 'transparent' : (formData.desktopCampaignLogoBg ?? '#007BFF') }}>{campaignImg}</div>
                        )}
                        {showPartner && (
                          <div style={{ ...partnerPill, background: formData.desktopPartnerLogoBgEnabled === false ? 'transparent' : (formData.desktopPartnerLogoBg ?? '#FFFFFF') }}>
                            {partners.slice(0, 4).map((slot, idx) => {
                              const isUrl = slot.logo?.startsWith('http') || slot.logo?.startsWith('figma:');
                              const imgSrc = isUrl ? slot.logo : (slot.logo ? `https://placehold.co/132x66/0064D2/FFFFFF/png?text=${slot.logo.substring(0, 3).toUpperCase()}` : exampleImage);
                              return <img key={slot.id || idx} src={imgSrc} alt="Partner" crossOrigin="anonymous" draggable={false} style={{ height: 34 * pa, width: 'auto', maxWidth: 140 * pa, objectFit: 'contain', transform: `scale(${logoScale})` }}  onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />;
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                {showCampaign && !sticky && (
                  <BoundingBox
                    enabled={!!onFormChange}
                    className="absolute z-[3] flex items-center justify-center"
                    style={{ left: cLogoX, top: cLogoY, transform: `scale(${cLogoScale / 100})`, transformOrigin: 'top left' }}
                    selfScale={cLogoScale / 100}
                    offsetY={cLogoY} offsetUnit={1} offsetMin={-100} offsetMax={H - 20}
                    onOffsetChange={(v) => onFormChange?.({ desktopCampaignLogoY: v })}
                    offsetX={cLogoX} offsetXMin={-100} offsetXMax={1950}
                    onOffsetXChange={(v) => onFormChange?.({ desktopCampaignLogoX: v })}
                    scale={cLogoScale} scaleMin={30} scaleMax={400}
                    onScaleChange={(v) => onFormChange?.({ desktopCampaignLogoScale: v })}
                  >
                    <img src={campaignSrc} alt="Campaign logo" crossOrigin="anonymous" draggable={false} style={{ height: 120, width: 'auto', maxWidth: 520, objectFit: 'contain', display: 'block' }} onError={(e) => { const t = e.currentTarget; if (t.dataset.fallback) return; t.dataset.fallback = "1"; t.removeAttribute("crossorigin"); t.src = exampleImage; }} />
                  </BoundingBox>
                )}
              </>
            );
          })()}

          {/* CTA (right) — Figma 82:516 */}
          {showCta && (
            <div className="absolute flex items-center justify-center z-[2]" style={{ left: 1480, top: (H - 96) / 2, width: 400, height: 96, borderRadius: 16, background: formData.ctaButtonColor || '#007BFF' }}>
              <span className="font-banner font-bold text-center" style={{ fontSize: 44, lineHeight: 1.27, color: formData.ctaTextColor || '#FFFFFF', fontFeatureSettings: '"dlig" 1' }}>{ctaText}</span>
            </div>
          )}

          {/* T&C — right-hand column; drag / scale it with the bounding box */}
          {content.termsAndCondition && (
            <BoundingBox
              enabled={!!onFormChange}
              className="absolute font-banner z-[3] text-right"
              style={{ right: 36, bottom: 28, width: tncWidth, fontSize: formData.desktopTncFontSize ?? 20, lineHeight: 1.3, color: content.termsColor || 'rgba(255,255,255,0.8)', transform: `translate(${tncOffset.x}px, ${tncOffset.y}px)` }}
              offsetY={tncOffset.y} offsetUnit={1} offsetMin={-400} offsetMax={400}
              onOffsetChange={(v) => onFormChange?.({ desktopTncOffset: { x: tncOffset.x, y: v } })}
              offsetX={tncOffset.x} offsetXMin={-1900} offsetXMax={60}
              onOffsetXChange={(v) => onFormChange?.({ desktopTncOffset: { x: v, y: tncOffset.y } })}
              scale={100} scaleMin={100} scaleMax={100} onScaleChange={() => {}}
              widthMode={{ width: tncWidth, min: 120, max: 1400, onChange: (w) => onFormChange?.({ desktopTncWidth: w }) }}
            >
              <span dangerouslySetInnerHTML={{ __html: tagsToHtml(content.termsText || (lang === 'en' ? '*T&C apply' : '*S&K berlaku')) }} />
            </BoundingBox>
          )}
        </div>
      </div>
    </div>
  );
});

BannerDesktop51.displayName = 'BannerDesktop51';
