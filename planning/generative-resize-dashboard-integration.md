# Generative Resize - Dashboard Integration Plan

## Objective
Integrate the Dashboard's Asset Inspector with the Generative Resize tool. Users should be able to select an asset (banner) in the dashboard and send it directly to the Generative Resize tool for processing.

## Constraints & Requirements
1.  **Trigger:** New button in `AssetInspector` (between Edit and Delete/Duplicate).
2.  **Input Source:** MUST use the **3x** resolution version of the image.
    *   *Strategy:* Append `@3x` to the filename before the extension (e.g., `image.png` -> `image@3x.png`).
3.  **UI Feedback:**
    *   Handle loading states.
    *   Handle error states (e.g., if 3x image doesn't exist).
    *   Indicate "Source: Dashboard" in the Generative Resize UI.

## Components to Modify

### 1. `src/app/components/assets/AssetInspector.tsx`
*   **Action:** Add a "Resize" button to the action bar.
*   **Logic:**
    *   Generate the 3x URL from the current asset's `imageUrl`.
    *   Navigate to `/tools/generative-resize` with query parameters:
        *   `imageUrl`: The 3x URL.
        *   `source`: `dashboard`.

### 2. `src/app/components/tools/GenerativeResize.tsx`
*   **Action:** Enhance the `handleDashboardHandoff` effect and UI state.
*   **State Changes:**
    *   New state: `isFromDashboard` (boolean).
    *   New state: `isLoadingSource` (boolean) - to handle the verify/fetch of the 3x image.
*   **Logic:**
    *   On mount, if `source=dashboard`:
        *   Set `isLoadingSource = true`.
        *   Attempt to fetch/verify the image at `imageUrl`.
        *   If success: Set as `tempInputUrl` and `previewUrl`.
        *   If failure (404): Show error "High-resolution (3x) version not found" and potentially fallback or allow manual upload.
*   **UI Changes:**
    *   Display a badge/indicator overlay on the source preview: "✨ Dashboard Asset (3x)".
    *   Show loading spinner while verifying the remote image.

## Detailed Implementation Steps

1.  **Modify `AssetInspector.tsx`**:
    *   Import `Sparkles` icon from `lucide-react`.
    *   Implement `getHighResUrl(url)` helper.
    *   Insert button in the JSX.

2.  **Modify `GenerativeResize.tsx`**:
    *   Update `useEffect` for parsing URL params.
    *   Add validation fetch for the image to ensure it loads.
    *   Update the `Left Panel` > `File Upload` section to handle the "From Dashboard" state (read-only mode or embellished mode).

## Robustness Checks
*   **404 Handling:** If the 3x image doesn't exist in the bucket, the tool should alert the user rather than showing a broken image.
*   **IndexedDB Handoff:** Since 3x assets are generated on the fly (Drafts/Templates) and are large, we use IndexedDB to pass the Blob from Dashboard to Generative Resize.
    *   `InspectorPanel` generates 3x Blob -> Stores in IDB -> Redirects with `?handoffKey=...`
    *   `GenerativeResize` reads IDB -> Converts to File -> Sets as `sourceFile`.
*   **Robust Fallback:** If IDB fails or for legacy assets, fallback to URL.
*   **Security:** Ensure the URL passed is valid.

## Correction/Update
Initial implementation targeted `AssetInspector.tsx` (Logo Assets).
Correct target is `InspectorPanel.tsx` (Banners).
The plan has been adjusted during execution to target the correct component.
User requirements remain the same (3x image logic, loading/error states).
