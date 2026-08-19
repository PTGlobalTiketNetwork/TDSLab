# Anti-Flickering Fix untuk Language Switching

## ✅ Problem Identified

Flickering hitam terjadi saat berpindah bahasa (EN ⟷ ID) karena:

1. **Separate Loading States**: Setiap `BannerFixed` component (EN dan ID) punya state `isImageLoaded` sendiri
2. **State Reset on Mount**: Ketika component pertama kali render, state `isImageLoaded = false`
3. **Blur Thumbnail Muncul Lagi**: Karena state reset, blurred thumbnail/skeleton muncul lagi saat switch
4. **Background Sama**: EN dan ID menggunakan `previewUrl` yang SAMA, tapi masing-masing tidak "tahu" bahwa image sudah loaded

## ✅ Solution Implemented

### **1. BannerFixed Component Updated**

**Added New Prop**: `isImagePreloaded?: boolean`

**New Loading Logic**:
```typescript
// Use external preloaded state if available, otherwise use internal state
const [internalImageLoaded, setInternalImageLoaded] = useState(false);
const isImageLoaded = isImagePreloaded !== undefined ? isImagePreloaded : internalImageLoaded;

// Only reset internal state if not using external preload state
useEffect(() => {
    if (isImagePreloaded === undefined) {
        setInternalImageLoaded(false);
    }
}, [currentDisplayImage, isImagePreloaded]);
```

**How It Works**:
- If `isImagePreloaded` prop is provided → use it (shared state from parent)
- If NOT provided → fallback to internal state (legacy behavior)
- This allows parent (InspectorPanel) to manage ONE loading state for BOTH EN and ID

### **2. InspectorPanel Integration Required**

You need to add shared loading state di InspectorPanel dan pass ke both BannerFixed components.

**Step 1: Add Shared Image Loading State** (~line 53):
```typescript
const [isImageLoading, setIsImageLoading] = useState(false);
const [isBackgroundImageLoaded, setIsBackgroundImageLoaded] = useState(false); // ← ADD THIS
```

**Step 2: Pre-load Background Image** (~line 121):
```typescript
useEffect(() => {
  if (!imageUrlWithCacheBust) {
      setIsImageLoading(false);
      setIsBackgroundImageLoaded(false); // ← ADD THIS
      return;
  }
  
  setIsImageLoading(true);
  setIsBackgroundImageLoaded(false); // ← ADD THIS
  
  const img = new Image();
  img.src = imageUrlWithCacheBust;
  
  const handleLoad = () => {
      setIsImageLoading(false);
      setIsBackgroundImageLoaded(true); // ← ADD THIS
  };
  const handleError = () => {
      setIsImageLoading(false);
      setIsBackgroundImageLoaded(false); // ← ADD THIS
  };
  
  img.onload = handleLoad;
  img.onerror = handleError;
  
  return () => {
      img.onload = null;
      img.onerror = null;
  };
}, [imageUrlWithCacheBust]);
```

**Step 3: Pass to Lightbox BannerFixed Components** (~line 796 and ~820):

For EN:
```tsx
<BannerFixed
    formData={formData}
    lang="en"
    scale={scale}
    position={position}
    previewUrl={previewUrl}
    thumbnailUrl={imageUrlWithCacheBust}       // ← ADD THIS
    isImagePreloaded={isBackgroundImageLoaded} // ← ADD THIS
    hideHeader={true}
/>
```

For ID:
```tsx
<BannerFixed
    formData={formData}
    lang="id"
    scale={scale}
    position={position}
    previewUrl={previewUrl}
    thumbnailUrl={imageUrlWithCacheBust}       // ← ADD THIS
    isImagePreloaded={isBackgroundImageLoaded} // ← ADD THIS
    hideHeader={true}
/>
```

**Step 4: Pass to Preview Thumbnail BannerFixed** (~line 708 and ~748):

For EN thumbnail:
```tsx
<BannerFixed
    formData={formData}
    lang="en"
    scale={scale}
    position={position}
    previewUrl={previewUrl}
    isImagePreloaded={isBackgroundImageLoaded} // ← ADD THIS
    hideHeader={true}
/>
```

For ID thumbnail:
```tsx
<BannerFixed
    formData={formData}
    lang="id"
    scale={scale}
    position={position}
    previewUrl={previewUrl}
    isImagePreloaded={isBackgroundImageLoaded} // ← ADD THIS
    hideHeader={true}
/>
```

## How The Fix Works

### Before (Flickering):
1. User clicks EN/ID tab
2. Component opacity toggles
3. Image loading state resets → `isImageLoaded = false`
4. Blurred thumbnail shows again
5. Image loads again (even though it's cached)
6. **Result**: Flickering blur effect

### After (No Flickering):
1. Parent pre-loads background image once
2. Sets shared state `isBackgroundImageLoaded = true`
3. Both EN and ID components receive `isImagePreloaded={true}`
4. User clicks EN/ID tab
5. Component opacity toggles smoothly
6. No blur because both know image is already loaded
7. **Result**: Instant, smooth switching

## Benefits

✅ **Zero Flickering**: No blur/skeleton flash when switching languages  
✅ **Shared State**: One source of truth for image loading  
✅ **Browser Cache Leveraging**: Image loads once, used by both EN/ID  
✅ **Backward Compatible**: Still works without `isImagePreloaded` prop  
✅ **Performance**: No unnecessary re-renders or image reloads  

## Testing Checklist

- [ ] Add `isBackgroundImageLoaded` state to InspectorPanel
- [ ] Update `useEffect` to track background image loading
- [ ] Pass `thumbnailUrl` to all 4 BannerFixed instances
- [ ] Pass `isImagePreloaded` to all 4 BannerFixed instances
- [ ] Test EN ⟷ ID switching in Inspector thumbnail
- [ ] Test EN ⟷ ID switching in Lightbox
- [ ] Verify no flickering on first load
- [ ] Verify no flickering on subsequent switches
