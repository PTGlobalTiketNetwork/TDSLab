# Arsitektur Komponen Dashboard Banner Management

## Overview
Dashboard Banner Management menggunakan arsitektur 4-kolom layout yang terdiri dari Sidebar, Header, Main Content Area, dan Inspector Panel.

## Breakdown Komponen

### 1. Sidebar (Navigasi Vertikal - Lebar: 268px)
**Lokasi:** Fixed di sisi kiri layar

**Sub-komponen:**
- **Logo Section**
  - Logo Tiket.com horizontal
  - Tombol collapse/expand sidebar (icon chevron)
  
- **Navigation Menu**
  - Home (icon: home)
  - Banners (expandable, icon: empty/custom, **ACTIVE STATE**)
    - Daily Promo (sub-menu, **HIGHLIGHTED**)
    - Big Campaign (sub-menu)
  - Logo Assets (expandable, icon: empty/custom)
  - Settings (expandable, icon: setting)

- **User Info Section** (Bottom Fixed)
  - Label: "You're logged in as"
  - Nama user: Michael Fernanlie
  - Chevron dropdown untuk user menu

**State Management:**
- Active menu item (Banners)
- Active sub-menu (Daily Promo)
- Expanded/collapsed state untuk setiap parent menu
- User session state (logged in/out)

---

### 2. Header Bar (Top - Height: 100px)
**Lokasi:** Fixed di atas main content, offset left 268px

**Sub-komponen:**
- **Breadcrumb/Title Section**
  - Title: "Banners" (H1 - 24px Bold)
  - Back button (optional, terlihat di beberapa view)

- **Search Bar** (Central, Flexible Width)
  - Input field dengan placeholder "Search banner by name"
  - Icon search (left)
  - Clear button (right, muncul saat ada input)
  - Background: #F4F7FE
  - Border-radius: 100px (pill shape)

- **Primary Action Button** (Right)
  - "Create New Banner" 
  - Background: #007BFF (Primary Blue)
  - Padding: 14px 24px
  - Border-radius: 8px

**State Management:**
- Search query string
- Search input focus state

---

### 3. Main Content Area (Center - Flexible Width)
**Lokasi:** Antara Sidebar dan Inspector Panel

**Sub-komponen:**
- **Filter Bar**
  - "Sort by" dropdown (default, name, date, etc)
  - "All Product" dropdown filter:
    - All Product
    - Accommodation
    - ToDos
    - Transports
  - Background: White dengan border #D8DCE8

- **View Toggle** (Grid/List)
  - Grid View: Card layout (2 kolom)
  - List View: Table row layout

- **Banner Cards (Grid View)**
  - Thumbnail preview (aspect ratio ~16:9)
  - Banner title
  - Border: 2px solid transparent (3px #007BFF saat selected)
  - Border-radius: 8px
  - Hover effect: subtle shadow

- **Banner List Rows (List View)**
  - Row number
  - Small thumbnail
  - Banner title
  - Border: 2px solid transparent (3px #007BFF saat selected)

- **Empty State**
  - Illustration (no result image)
  - Title: "Sorry no result"
  - Subtitle: "Please try another assets name or key."

**State Management:**
- Current view mode (grid/list)
- Selected banner ID
- Filter selections (sort by, product category)
- Filtered banner list

---

### 4. Inspector Panel (Right Sidebar - Width: 432px)
**Lokasi:** Fixed di sisi kanan layar

**Sub-komponen:**

#### Default State (No Selection)
- Empty message: "Please select image"
- Subtitle: "To see the details here"

#### Active State (Banner Selected)
- **Preview Section**
  - Large banner preview image
  - Aspect ratio preserved
  - Background: White

- **Action Buttons** (Icon + Label)
  - Edit (icon: pencil)
  - Download (icon: download)
  - Delete (icon: trash)
  - Publish Toggle (switch/toggle component)

- **Asset Info Section**
  - Product: Badge/label (e.g., "Hotel")
  - File size: "128 kb"
  - Dimension: "1080*540"
  - Added on: "20 Oct 2022"

**State Management:**
- Selected banner data
- Publish status (toggle state)
- Delete confirmation modal trigger

---

## Component Tree Structure

```
App.tsx
├── Sidebar
│   ├── Logo
│   ├── CollapseButton
│   ├── NavigationMenu
│   │   ├── MenuItem (Home)
│   │   ├── MenuItem (Banners - expandable)
│   │   │   ├── SubMenuItem (Daily Promo)
│   │   │   └── SubMenuItem (Big Campaign)
│   │   ├── MenuItem (Logo Assets - expandable)
│   │   └── MenuItem (Settings - expandable)
│   └── UserInfo
│
├── Header
│   ├── BreadcrumbTitle
│   ├── SearchBar
│   └── CreateButton
│
├── MainContent
│   ├── FilterBar
│   │   ├── SortByDropdown
│   │   └── ProductFilterDropdown
│   ├── ViewToggle (conditionally renders below)
│   ├── GridView (conditional)
│   │   └── BannerCard[]
│   ├── ListView (conditional)
│   │   └── BannerRow[]
│   └── EmptyState (conditional)
│
├── InspectorPanel
│   ├── EmptySelection (conditional)
│   └── BannerDetail (conditional)
│       ├── PreviewImage
│       ├── ActionButtons
│       └── AssetInfo
│
├── DeleteModal (conditional)
└── Toast (conditional)
```

---

## Layout Specifications

### Grid System
- Sidebar: 268px fixed
- Main Content: `calc(100vw - 268px - 432px)` atau flexible
- Inspector Panel: 432px fixed (conditional)
- Header: Full width minus sidebar

### Responsive Behavior
- Desktop (>= 1440px): Full 4-column layout
- Tablet/Laptop (<= 1440px): Inspector panel menjadi overlay/modal
- Mobile: Out of scope untuk prototype ini

---

## State Flow Diagram

```
User Action → Component State Update → UI Re-render

Examples:
1. Click Banner Card → setSelectedBannerId → Inspector Panel shows detail
2. Change Product Filter → setProductFilter → Filter banner list → Re-render grid/list
3. Toggle Publish → Update banner publish status → Show toast notification
4. Click Delete → Show modal → Confirm → Delete banner → Update list → Hide inspector
5. Search Input → setSearchQuery → Filter banner list → Show empty state if no results
```

---

## Teknologi & Libraries

### Core
- React (functional components + hooks)
- TypeScript (untuk type safety)

### State Management
- useState untuk local component state
- useContext untuk global state (user session, selected banner)
- Custom hooks untuk reusable logic (useSearch, useFilter)

### UI Components
- Tailwind CSS untuk styling
- Custom components dari Figma import (akan direfactor untuk interaktivity)
- lucide-react untuk icons

### Backend Integration
- Supabase Client untuk auth
- Supabase Storage untuk banner images
- Key-Value store untuk banner metadata

---

## File Structure

```
/src
  /app
    App.tsx (main entry)
    /components
      /sidebar
        Sidebar.tsx
        NavigationMenu.tsx
        UserInfo.tsx
      /header
        Header.tsx
        SearchBar.tsx
      /main
        FilterBar.tsx
        GridView.tsx
        ListView.tsx
        BannerCard.tsx
        BannerRow.tsx
        EmptyState.tsx
      /inspector
        InspectorPanel.tsx
        BannerDetail.tsx
        ActionButtons.tsx
        AssetInfo.tsx
      /modals
        DeleteConfirmModal.tsx
      /toast
        Toast.tsx
    /hooks
      useAuth.tsx
      useBanners.tsx
      useSearch.tsx
  /imports (Figma generated - akan digunakan sebagai referensi visual)
  /styles
    theme.css
    fonts.css
  /utils
    /supabase
      client.ts
```

---

## Notes
- Semua komponen menggunakan Tailwind CSS classes sesuai design system tiket.com
- Font custom: "Tiket Odyssey Text" (Regular, Bold)
- Shadow values mengikuti design tokens dari Figma
- Border radius values: 4px, 8px, 18px, 100px
