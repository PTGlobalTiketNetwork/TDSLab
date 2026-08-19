# Plan: Portrait 3:4 — Full Feature Parity with Landscape 2:1

## Context

The portrait 3:4 banner currently renders basic elements (headline, nudge row, label discount, CTA, T&C) but is missing several features that the landscape 2:1 has. The user wants 100% feature parity, centered, same visual font/element sizes as landscape but in portrait format. Specific gaps:

1. **Sub-headline / 2 Headlines** — portrait always renders only one `h3`. Landscape conditionally renders `secondLineText` for "With Sub-Headline" and "2 Headlines" modes.
2. **Second discount row** (`hasSecondDiscount`) — portrait has no `+` second amount block.
3. **Additional label** (`additionalLabel`) — portrait has no pill badge.
4. **CTA not showing in ID version** — `showPortraitCta` and `ctaButtonColor` are stored in `ContentTranslation` (per-lang), so enabling in EN tab doesn't affect ID.
5. **Font/size mismatch** — portrait canvas is 720×960 displayed at 0.5×. To match the same visual size as landscape (600px at 1×), all pixel values must be **2×** the landscape values. Currently many are at 1.2× (wrong).
6. **Nudge row alignment** — needs `items-stretch` when prefix is present, `items-baseline` when absent (matching landscape), still center-justified for portrait.

---

## Fix 1: Move CTA toggle/color to form level (`types.ts` + `FormStep2.tsx` + `BannerLegacy.tsx`)

**`types.ts`:**
- Remove `showPortraitCta?: boolean` and `ctaButtonColor?: string` from `ContentTranslation`
- Add them to `BannerFormData`:
  ```ts
  showPortraitCta?: boolean;
  ctaButtonColor?: string;
  ```
- Keep `ctaText?: string` in `ContentTranslation` (text stays per-lang)

**`FormStep2.tsx`** (lines 1060–1087):
- Toggle reads `formData.showPortraitCta`, writes via `setFormData(prev => ({ ...prev, showPortraitCta: checked }))`
- Color picker reads `formData.ctaButtonColor`, writes via `setFormData(prev => ({ ...prev, ctaButtonColor: v }))`
- `ctaText` input stays on `currentContent` / `updateContent`

**`BannerLegacy.tsx`** portrait branch:
- Change `content.showPortraitCta` → `formData.showPortraitCta`
- Change `content.ctaButtonColor` → `formData.ctaButtonColor`

---

## Fix 2: All font/size values at 2× in portrait canvas

The 720×960 portrait canvas is displayed at 0.5×. To produce the same visual pixel sizes as the landscape 2:1 (600px at 1×), every pixel value in the portrait canvas must be `landscape_value × 2`.

| Element | Landscape | Portrait canvas | Visual at 0.5× |
|---|---|---|---|
| Headline font | `headlineFontSize \|\| 40` | `× 2` | same as form value |
| Sub-headline font | `subHeadlineFontSize \|\| 18` | `× 2` | same as form value |
| Discount number | 80px | 160px | 80px |
| Number `letterSpacing` | -4px | -8px | -4px |
| Number `lineHeight` | 66px | 132px | 66px |
| `Rp` symbol | 15px | 30px | 15px |
| Unit icon w/h | 24–30px | 48–60px | 24–30px |
| Unit text | 24px | 48px | 24px |
| `+` separator | 48px | 96px | 48px |
| Label discount icon | 16px | 32px | 16px |
| Label discount text | 14px | 28px | 14px |
| Additional label text | 12px | 24px | 12px |
| Additional label padding | `px-12 py-4` | `px-24 py-8` | same visual |
| Additional label radius | 10px | 20px | 10px |
| CTA height | — | 84px | 42px |
| CTA font | — | 28px | 14px |
| T&C text | 6px | 12px | 6px |
| Content bottom | 15px | 30px | 15px |

Current (wrong) scaling at 1.2× must be corrected to 2×.

---

## Fix 3: Add missing features to portrait canvas

Replace the current portrait content block (lines 401–452 in BannerLegacy.tsx) with a fully-featured version that mirrors the landscape column but centered.

The new content `div` uses `flex-col items-center gap-[4px] px-[24px]` (2× landscape's gap-[2px]) with specific margins on each element group matching 2× of landscape margins.

### Headline group (mirroring landscape lines 550–562)
```tsx
{/* Headline */}
<h3 className={`drop-shadow-md font-banner leading-[1.1] text-center w-full ${isTwoHeadlines ? 'font-bold line-clamp-2 break-words' : ''}`}
    style={{ fontSize: `${(content.headlineFontSize || defaultHeadlineSize) * 2}px`, color: content.headlineColor || 'white' }}>
  {renderHtml(headlineText, "")}
</h3>

{/* Sub-headline / 2nd headline */}
{secondLineText && formData.headlineType !== '1 Headline' && (
  <h3 className={`drop-shadow-md font-banner text-center w-full ${isTwoHeadlines ? 'leading-[1.1] font-bold line-clamp-2 break-words' : ''}`}
      style={{ fontSize: isTwoHeadlines ? `${(content.headlineFontSize || defaultHeadlineSize) * 2}px` : `${(content.subHeadlineFontSize || 18) * 2}px`, color: content.subHeadlineColor || 'white' }}>
    {renderHtml(secondLineText, "")}
  </h3>
)}
```

### Nudge / benefit row (mirroring landscape lines 564–604, gate `!isTwoHeadlines`)
```tsx
{!isTwoHeadlines && formData.discountEnabled !== false && (
  <div className={`flex ${content.mainBenefitPrefix && content.showPrefix !== false ? 'items-stretch' : 'items-baseline'} justify-center gap-[8px] mt-[16px]`}>
    {renderLeftColumn(2)}   {/* already correct — 2× prefix sizes */}
    <div className="relative flex items-end">
      {/* Rp when no prefix */}
      {content.discountType === 'IDR' && (!content.mainBenefitPrefix || content.showPrefix === false) && (
        <span className="text-[30px] font-bold drop-shadow-md font-banner self-start mr-[2px] ml-[4px] mt-[-20px]"
              style={{ color: content.discountAmountColor || 'white' }}>Rp</span>
      )}
      {/* Main number */}
      <span className="font-extrabold drop-shadow-md font-banner ml-[4px]"
            style={{ fontSize: `${(content.discountAmountFontSize || 80) * 2}px`, lineHeight: '132px', letterSpacing: '-8px', color: content.discountAmountColor || 'white' }}>
        {discountAmountText}
      </span>
      {/* Unit */}
      {content.unit && (
        content.unitDisplayType === 'icon' ? (
          <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 ${content.unit === 'mio' ? 'w-[60px] h-[60px] mb-[18px]' : 'w-[48px] h-[48px] mb-[18px]'}`}
               style={{ backgroundColor: content.unitIconColor || 'white', position: 'relative', left: '-12px' }}>
            <span className="text-[30px] font-bold leading-none" style={{ color: content.unitColor || '#0064D2' }}>{content.unit}</span>
          </div>
        ) : (
          <span className="text-[48px] font-bold drop-shadow-md font-banner ml-[4px] mb-[8px]"
                style={{ color: content.unitColor || 'white' }}>{content.unit}</span>
        )
      )}
      {/* Second discount */}
      {content.hasSecondDiscount && (
        <>
          <span className={`text-[96px] font-bold drop-shadow-md font-banner mb-[16px] mr-[6px] ${content.unitDisplayType === 'icon' ? 'ml-[2px]' : 'ml-[8px]'}`}
                style={{ color: content.discountAmountColor || 'white' }}>+</span>
          {content.secondDiscountType === 'IDR' && (
            <span className="text-[30px] font-bold drop-shadow-md font-banner self-start mr-[2px] ml-[4px] mt-[8px]"
                  style={{ color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>Rp</span>
          )}
          <span className="font-extrabold drop-shadow-md font-banner"
                style={{ fontSize: '160px', lineHeight: '132px', letterSpacing: '-8px', color: content.secondDiscountAmountColor || content.discountAmountColor || 'white' }}>
            {content.secondDiscountAmount || '0'}
          </span>
          {content.secondDiscountUnit && (
            content.secondUnitDisplayType === 'icon' ? (
              <div className={`flex items-center justify-center rounded-full shadow-lg shrink-0 z-10 ${content.secondDiscountUnit === 'mio' ? 'w-[60px] h-[60px] mb-[18px]' : 'w-[48px] h-[48px] mb-[18px]'}`}
                   style={{ backgroundColor: content.secondUnitIconColor || 'white', position: 'relative', left: '-16px' }}>
                <span className="text-[30px] font-bold leading-none" style={{ color: content.secondUnitColor || '#0064D2' }}>{content.secondDiscountUnit}</span>
              </div>
            ) : (
              <span className="text-[48px] font-bold drop-shadow-md font-banner ml-[4px] mb-[4px]"
                    style={{ color: content.secondUnitColor || content.unitColor || 'white' }}>{content.secondDiscountUnit}</span>
            )
          )}
        </>
      )}
    </div>
  </div>
)}
```

### Label discount (mirroring landscape lines 606–614)
```tsx
{content.labelDiscount && formData.headlineType !== 'With Sub-Headline' && (
  <div className={`flex items-center justify-center gap-[12px] ${isTwoHeadlines ? 'mt-[28px]' : 'mt-[4px]'}`}>
    {content.labelDiscountType === 'With icon' && (
      <div className="w-[32px] h-[32px]" style={{ '--fill-0': content.labelDiscountIconColor || 'white' } as React.CSSProperties}><TdsIcOvalPlus /></div>
    )}
    <div className="text-[28px] font-bold drop-shadow-md font-banner text-center"
         style={{ color: content.labelDiscountColor || 'white' }}>{renderHtml(labelDiscountText, "")}</div>
  </div>
)}
```

### Additional label (mirroring landscape lines 616–627)
```tsx
{content.additionalLabel && formData.headlineType !== 'With Sub-Headline' && (
  <div className="text-[24px] font-bold px-[24px] py-[8px] rounded-[20px] tracking-wider font-banner shadow-sm mt-[16px]"
       style={{ backgroundColor: content.additionalLabelBackgroundColor || '#FEDD00', color: content.additionalLabelTextColor || '#0064D2' }}>
    {renderHtml(content.additionalLabelText, "") || 'LIMITED OFFER'}
  </div>
)}
```

### CTA button (portrait-specific, form-level gating)
```tsx
{formData.showPortraitCta && (
  <div className="flex items-center justify-center font-bold font-banner w-full mt-[32px]"
       style={{ height: '84px', backgroundColor: formData.ctaButtonColor || '#007cff', color: '#FFFFFF', fontSize: '28px', borderRadius: '16px', maxWidth: '354px' }}>
    {content.ctaText || (lang === 'en' ? 'Book Now' : 'Pesan Sekarang')}
  </div>
)}
```

### T&C (bottom, same as current)
```tsx
{content.termsAndCondition && (
  <div className="text-center mt-[8px]">
    <div className="text-[12px] leading-[1.4] font-banner"
         style={{ color: content.termsColor || 'rgba(255,255,255,0.8)' }}>{renderHtml(termsText, "")}</div>
  </div>
)}
```

---

## Files to modify

1. **`src/app/components/create-banner/types.ts`** — move `showPortraitCta` / `ctaButtonColor` from `ContentTranslation` to `BannerFormData`
2. **`src/app/components/create-banner/FormStep2.tsx`** — update CTA toggle/color to read/write from `formData` instead of `currentContent`
3. **`src/app/components/create-banner/BannerLegacy.tsx`** — replace the portrait content block with the full-featured 2× version above

---

## Verification

1. Create portrait 3:4 banner; switch to "With Sub-Headline" → sub-headline appears centered
2. Switch to "2 Headlines" → both headlines appear at same size, centered
3. Enable "Discount Amount 2" toggle → second amount appears with `+` separator
4. Enable "Additional Label" → colored pill badge appears below label discount
5. Enable CTA in EN tab → button appears in BOTH EN and ID banners
6. Change CTA color → both EN and ID banners show same new color
7. Check all font sizes visually match the landscape 2:1 banner (at same form settings)
8. Check nudge prefix (Discount, Instant cashback etc.) renders correctly centered with proper alignment
