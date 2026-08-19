# 🎨 Dashboard Manajemen Banner - Tiket.com Internal

Dashboard Banner Management tingkat tinggi (high-fidelity) yang dibangun dengan React, TypeScript, dan Tailwind CSS untuk mengelola banner promosi internal tiket.com.

![Dashboard Banner Management](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Enabled-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4.1-blue)

---

## ✨ Fitur Utama

### 🎯 UI/UX Features
- **Layout 4-Kolom** - Sidebar, Header, Main Content, dan Inspector Panel
- **Dual View Mode** - Toggle antara Grid View (Card) dan List View (Row)
- **Real-time Search** - Pencarian banner berdasarkan nama
- **Filter Produk** - Filter berdasarkan kategori (Accommodation, ToDos, Transport)
- **Inspector Panel Interaktif** - Preview, Edit, Download, Delete, dan Publish Toggle
- **Modal Konfirmasi** - Delete confirmation dengan preview banner
- **Toast Notifications** - Feedback visual untuk aksi user
- **Empty State** - Tampilan ketika hasil pencarian kosong

### 🛠️ Technical Features
- **State Management** - React hooks (useState, useMemo) untuk performa optimal
- **Type Safety** - Full TypeScript implementation
- **Responsive Design** - Siap untuk berbagai ukuran layar
- **Component-based** - Modular dan reusable components
- **Clean Code** - Separation of concerns dengan folder structure yang jelas

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.x
- npm atau pnpm

### Installation

```bash
# Clone repository (jika applicable)
# cd ke project directory

# Install dependencies
npm install
# atau
pnpm install
```

### Running the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
```

---

## 📂 Struktur Project

```
/
├── planning/                      # Dokumentasi perencanaan
│   ├── arsitektur.md             # Breakdown komponen
│   ├── struktur-data.md          # Data structure & TypeScript types
│   └── auth-dan-aset.md          # Panduan Supabase Auth & Custom Fonts
│
├── src/
│   ├── app/
│   │   ├── App.tsx               # 🔥 Main application entry point
│   │   └── components/
│   │       ├── Sidebar.tsx       # Navigasi vertikal
│   │       ├── Header.tsx        # Search bar & Create button
│   │       ├── MainContent.tsx   # Area konten utama
│   │       ├── FilterBar.tsx     # Filter & view switcher
│   │       ├── BannerCard.tsx    # Card untuk Grid View
│   │       ├── BannerRow.tsx     # Row untuk List View
│   │       ├── InspectorPanel.tsx# Detail banner (kanan)
│   │       ├── EmptyState.tsx    # No results screen
│   │       ├── DeleteModal.tsx   # Konfirmasi delete
│   │       └── Toast.tsx         # Notification system
│   │
│   ├── types/
│   │   └── banner.ts             # TypeScript interfaces
│   │
│   ├── data/
│   │   └── mockBanners.ts        # Mock data untuk development
│   │
│   ├── styles/
│   │   ├── fonts.css             # Custom font configuration
│   │   ├── theme.css             # Design tokens
│   │   └── tailwind.css          # Tailwind imports
│   │
│   └── imports/                   # Figma imported components (reference)
│
├── IMPLEMENTATION.md              # 📋 Panduan implementasi detail
└── README.md                      # 📖 File ini
```

---

## 🎨 Design System

### Warna Utama

```css
Primary Blue:    #007bff    /* Tombol, border aktif, highlights */
Background:      #f8f9fd    /* Main content area */
White:           #ffffff    /* Card, sidebar */
Text Primary:    #303135    /* Heading, body text */
Text Secondary:  #71747d    /* Labels, placeholder */
Border:          #e8eaee    /* Divider, card border */
Yellow Accent:   #FFCD00    /* Logo tiket.com */
Error Red:       #dc2626    /* Delete button */
```

### Typography

- **Font Family**: System fonts (siap untuk custom Tiket Odyssey Text)
- **Font Sizes**: 12px, 14px, 16px, 18px, 20px, 24px
- **Font Weights**: Regular (400), Bold (700)

### Layout Dimensions

- **Sidebar Width**: 268px (fixed)
- **Inspector Panel Width**: 432px (fixed)
- **Header Height**: 80px (fixed)
- **Main Content**: Flexible (responsive)

---

## 💻 Cara Menggunakan

### 1. Search Banner
- Ketik nama banner di search bar di header
- Klik icon X untuk clear search
- Hasil akan di-filter secara real-time

### 2. Filter by Product
- Klik dropdown "All Product" di FilterBar
- Pilih kategori: General, Accommodation, ToDos, atau Transport
- Banner akan di-filter sesuai kategori yang dipilih

### 3. Switch View Mode
- Klik icon Grid (⊞) untuk Grid View (Card layout)
- Klik icon List (≡) untuk List View (Row layout)
- Preference akan langsung diterapkan

### 4. Select Banner
- Klik pada banner card/row untuk memilih
- Border biru 3px akan muncul di banner terpilih
- Inspector Panel (kanan) akan menampilkan detail banner

### 5. Inspector Panel Actions

#### Edit Banner
- Klik tombol "Edit" dengan icon pencil
- Toast notification akan muncul (fitur coming soon)

#### Download Banner
- Klik tombol "Download" dengan icon download
- Toast "ID Translation has been downloaded" akan muncul

#### Delete Banner
- Klik tombol "Delete" dengan icon trash
- Modal konfirmasi akan muncul
- Klik "Delete Banner" untuk confirm atau "Cancel" untuk batal
- Banner akan dihapus dari list setelah konfirmasi

#### Publish Toggle
- Klik switch "Publish"
- Status publish banner akan diupdate
- Toast notification akan muncul

---

## 🔧 Konfigurasi & Customization

### Mock Data

Edit file `/src/data/mockBanners.ts` untuk mengubah data banner:

```typescript
{
  id: "banner-001",
  name: "OTW Hotel Promo",
  product: "Hotel",
  imageUrl: "figma:asset/...",
  dimension: "1080*540",
  fileSize: "128 kb",
  isPublished: true,
  // ... dst
}
```

### Custom Fonts

Lihat `/src/styles/fonts.css` untuk instruksi upload custom font:

1. Upload font files ke Supabase Storage bucket `make-9ee0fe87-fonts`
2. Update URL di `@font-face` declarations
3. Font akan otomatis ter-apply

### Supabase Auth Integration

Lihat `/planning/auth-dan-aset.md` untuk panduan lengkap:

1. Uncomment auth logic di `App.tsx`
2. Implementasikan login page
3. Connect dengan Supabase session

---

## 📊 Data Structure

### Banner Interface

```typescript
interface Banner {
  id: string;                    // Unique identifier
  name: string;                  // Banner name
  product: ProductCategory;      // Product category
  imageUrl: string;              // Banner image URL
  thumbnail: string;             // Thumbnail URL
  dimension: string;             // Image dimension (e.g., "1080*540")
  fileSize: string;              // File size (e.g., "128 kb")
  status: BannerStatus;          // draft | published | archived
  isPublished: boolean;          // Publish state
  createdAt: string;             // ISO date string
  updatedAt: string;             // ISO date string
  createdBy: string;             // User ID
  tags?: string[];               // Optional tags
  campaign?: CampaignType;       // daily_promo | big_campaign
}
```

Lihat `/src/types/banner.ts` untuk semua type definitions.

---

## 🎯 Next Steps / Future Enhancements

### High Priority
- [ ] **Backend Integration** - Connect dengan Supabase KV Store
- [ ] **Authentication** - Implementasi login/logout dengan Supabase Auth
- [ ] **Create New Banner** - Form untuk upload banner baru
- [ ] **Edit Banner** - Form untuk edit banner existing

### Medium Priority
- [ ] **Sort Functionality** - Implementasi sort by name, date, dll
- [ ] **Pagination** - Untuk handle large dataset
- [ ] **Bulk Actions** - Multi-select dan bulk delete/publish
- [ ] **Image Upload** - Direct upload ke Supabase Storage

### Low Priority
- [ ] **Banner Duplication** - Duplicate existing banner
- [ ] **Export Functionality** - Export banners to CSV/JSON
- [ ] **Analytics Dashboard** - View metrics untuk banner performance
- [ ] **Version History** - Track changes pada banner

---

## 🐛 Troubleshooting

### Banner images tidak muncul
**Problem**: Image menggunakan `figma:asset` scheme yang belum di-resolve

**Solution**: 
1. Images akan otomatis load dari Figma import
2. Untuk production, ganti dengan actual URLs dari Supabase Storage

### Custom font tidak load
**Problem**: Font placeholder belum dikonfigurasi

**Solution**: 
1. Upload font files ke Supabase Storage (lihat `/src/styles/fonts.css`)
2. Update `@font-face` URLs
3. Clear browser cache

### Search tidak bekerja
**Problem**: Case sensitivity atau typo

**Solution**: Search adalah case-insensitive. Pastikan banner name ada di mock data.

---

## 📚 Documentation

- **Arsitektur**: `/planning/arsitektur.md`
- **Data Structure**: `/planning/struktur-data.md`
- **Auth & Assets**: `/planning/auth-dan-aset.md`
- **Implementation Guide**: `/IMPLEMENTATION.md`

---

## 🤝 Contributing

### Code Style
- Use TypeScript untuk semua new components
- Follow existing component structure
- Use Tailwind CSS classes (no inline styles)
- Add proper TypeScript types

### Component Guidelines
- Komponen harus reusable dan modular
- Gunakan proper prop types
- Add comments untuk complex logic
- Follow naming conventions (PascalCase untuk components)

---

## 📄 License

Internal project untuk tiket.com

---

## 👨‍💻 Developer Notes

### State Management
- App.tsx mengelola global state (search, filter, selected banner, dll)
- Local state di-handle oleh masing-masing component
- useMemo digunakan untuk optimize filtered data

### Performance Optimization
- Filtered banners menggunakan useMemo
- Conditional rendering untuk modal dan toast
- Optimized re-renders dengan proper key props

### Accessibility
- Semantic HTML elements
- sr-only labels untuk screen readers
- Keyboard navigation support
- ARIA attributes where applicable

---

## 📞 Support

Untuk pertanyaan atau issue, silakan:
1. Check dokumentasi di folder `/planning`
2. Review `IMPLEMENTATION.md` untuk detail implementasi
3. Contact development team

---

**Built with ❤️ for tiket.com internal team**

Version: 1.0.0  
Last Updated: 2026-01-09
