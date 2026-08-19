# Revamp V2 Specifications & Architecture

## 1. Assets & Fonts (Supabase Integration)
We will inject custom fonts via a dynamic `<style>` block.
**Bucket:** `fonts_display`
**Base URL:** `https://${projectId}.supabase.co/storage/v1/object/public/fonts_display/`

**Font Family:** `TiketOdyssey`
- Regular (400)
- SemiBold (600)
- Bold (700)
- ExtraBold (800)

**Utility Class:** `.font-banner`

## 2. Wizard State Schema Updates

### Step 1: Configuration
- **Vertical Category:** Drives the Color Palette.
  - Hotel: `#E92E9E`
  - Transport: `#00ADC5`
  - ToDo: `#B164FF`
  - Event: `#FF5CBA`
- **Layout Style:** `Style 2 (Tactical)` vs `Style 3 (Regular Immersive)`
- **Ratio:** `16:9`, `1:1`, `3:4`

### Step 2: Content
- **Main Benefit Logic:**
  - Prefix (Small)
  - Value (Huge Number)
  - Unit (Medium)
  - Style: `3D Color` (Uses Vertical Color + Stroke) vs `Flat White`.

### Step 3: Visuals
- **Background Image:** User uploaded file.
- **Gradient Overlay:** Opacity/Visibility slider.
  - CSS: `linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)`

## 3. Preview Engine Specs (PDF Compliance)
- **Safe Zone:** Content occupies Left 55%.
- **Typography:**
  - Headline: `text-3xl`, White, Drop Shadow.
  - Benefit: `text-7xl`, ExtraBold.
- **Colors:** strictly mapped to Vertical Category.
