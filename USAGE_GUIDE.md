# 📖 Panduan Penggunaan Dashboard Banner Management

## Selamat Datang! 👋

Panduan ini akan membantu Anda memahami cara menggunakan Dashboard Banner Management tiket.com.

---

## 🎯 Overview Dashboard

Dashboard terdiri dari 4 area utama:

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Search Bar & Create Button                            │
├──────┬─────────────────────────────────────────────┬────────────┤
│      │                                             │            │
│  S   │         MAIN CONTENT                        │ INSPECTOR  │
│  I   │  ┌─────────────────────────────┐            │  PANEL     │
│  D   │  │ FilterBar: Sort & Product   │            │            │
│  E   │  └─────────────────────────────┘            │  Preview   │
│  B   │                                             │  Actions   │
│  A   │  Grid View / List View                      │  Info      │
│  R   │  [Banner Cards atau Banner Rows]            │            │
│      │                                             │            │
│      │                                             │            │
└──────┴─────────────────────────────────────────────┴────────────┘
```

---

## 1️⃣ SIDEBAR (Kiri)

### 🏠 Navigation Menu

**Menu Aktif**: Banners > Daily Promo

```
Home
Banners ▼                    ← Expanded
  ► Daily Promo             ← Active (highlighted biru)
  ► Big Campaign
Logo Assets ▼
Settings ▼
```

### 👤 User Info (Bawah Sidebar)

```
You're logged in as
Michael Fernanlie ▼
```

**Tips**:
- Klik menu untuk expand/collapse
- Menu aktif ditandai dengan highlight biru
- User dropdown akan menampilkan opsi logout (future)

---

## 2️⃣ HEADER (Atas)

### 🔍 Search Bar

```
┌─────────────────────────────────────────────┐
│  🔍  Search banner by name              ✕   │
└─────────────────────────────────────────────┘
```

**Cara Pakai**:
1. Klik pada search bar
2. Ketik nama banner (misal: "Hotel", "Car rental", "Flight")
3. Hasil akan di-filter secara real-time
4. Klik ✕ untuk clear search

**Contoh Pencarian**:
- Ketik "Hotel" → akan muncul "OTW Hotel Promo"
- Ketik "Car" → akan muncul "Car rental promo 1"
- Ketik "xyz" → akan muncul Empty State "Sorry no result"

### ➕ Create Button

```
┌──────────────────────┐
│ Create New Banner    │
└──────────────────────┘
```

**Status**: Coming soon (akan menampilkan toast notification)

---

## 3️⃣ MAIN CONTENT (Tengah)

### 🎚️ Filter Bar

```
┌──────────┐  ┌──────────────┐         ┌──────┐
│ Sort by ▼│  │ All Product ▼│         │⊞│ ≡ │
└──────────┘  └──────────────┘         └──────┘
                                       View Toggle
```

#### Sort By (Placeholder)
- Fitur coming soon

#### Product Filter
Klik "All Product" untuk memilih:
- ☑ General (All products)
- ☐ Accommodation (Hotel, dll)
- ☐ ToDos
- ☐ Transports (Flight, Car Rental, Train)

**Cara Pakai**:
1. Klik dropdown "All Product"
2. Pilih checkbox kategori yang diinginkan
3. Banner akan di-filter otomatis
4. Dropdown akan close setelah memilih

#### View Toggle
- **Grid View (⊞)**: Tampilan card besar (2 kolom)
- **List View (≡)**: Tampilan list dengan nomor urut

---

### 📋 Grid View (Default)

```
┌──────────────────┐  ┌──────────────────┐
│  [Banner Image]  │  │  [Banner Image]  │
│  OTW Hotel Promo │  │  Car rental...   │
└──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  [Banner Image]  │  │  [Banner Image]  │
│  Flight promo... │  │  First time user │
└──────────────────┘  └──────────────────┘
```

**Features**:
- Hover untuk melihat shadow effect
- Klik untuk select (border biru 3px)
- Preview thumbnail besar
- Aspect ratio 2:1

---

### 📑 List View

```
┌──────────────────────────────────────────────┐
│ 01  [📷]  OTW Hotel Promo                    │
├──────────────────────────────────────────────┤
│ 02  [📷]  Car rental promo 1                 │
├──────────────────────────────────────────────┤
│ 03  [📷]  Flight promo Sriwijaya, NAM air    │
├──────────────────────────────────────────────┤
│ 04  [📷]  First time user                    │
└──────────────────────────────────────────────┘
```

**Features**:
- Numbering otomatis (01, 02, 03...)
- Small thumbnail di kiri
- Hover untuk shadow effect
- Klik untuk select (border biru 3px)

---

### 🚫 Empty State

Muncul ketika:
- Search tidak menemukan hasil
- Filter menghasilkan 0 banner

```
        🧗‍♂️ [Ilustrasi Pendaki]
        
        Sorry no result
        
    Please try another assets name or key.
```

**Cara Keluar dari Empty State**:
- Clear search query (klik ✕)
- Ubah filter product ke "All Product"

---

## 4️⃣ INSPECTOR PANEL (Kanan)

Muncul ketika banner dipilih.

### Default State (No Selection)

```
┌────────────────────────┐
│                        │
│       🖼️               │
│                        │
│  Please select image   │
│  To see the details    │
│      here              │
│                        │
└────────────────────────┘
```

### Active State (Banner Selected)

```
┌────────────────────────┐
│   [Banner Preview]     │  ← Large preview
├────────────────────────┤
│  ✏️    ⬇️    🗑️    📌  │  ← Action buttons
│ Edit Download Delete   │
│              Publish   │
├────────────────────────┤
│  OTW Hotel Promo       │  ← Banner name
│                        │
│  Asset Info            │
│  Product:      Hotel   │
│  File size:    128 kb  │
│  Dimension: 1080*540   │
│  Added on: 20 Oct 2022 │
└────────────────────────┘
```

---

### 🎬 Actions di Inspector Panel

#### 1. ✏️ Edit
**Fungsi**: Edit banner (coming soon)

**Cara Pakai**:
1. Pilih banner
2. Klik tombol "Edit"
3. Toast notification akan muncul

**Status**: Placeholder (akan mengarah ke edit form)

---

#### 2. ⬇️ Download
**Fungsi**: Download banner translation

**Cara Pakai**:
1. Pilih banner
2. Klik tombol "Download"
3. Toast hitam muncul: "ID Translation has been downloaded"
4. Toast akan hilang otomatis setelah 3 detik

**Expected Behavior**:
```
┌─────────────────────────────────────┐
│ ✓ ID Translation has been downloaded│  ← Toast (bottom center)
└─────────────────────────────────────┘
```

---

#### 3. 🗑️ Delete
**Fungsi**: Hapus banner

**Cara Pakai**:
1. Pilih banner
2. Klik tombol "Delete"
3. Modal konfirmasi muncul:

```
┌─────────────────────────────────────┐
│ Delete Banner                    ✕  │
├─────────────────────────────────────┤
│ Are you sure you want to delete     │
│ this banner?                        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ OTW Hotel Promo                 │ │
│ │ Hotel • 1080*540                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ⚠️ This action cannot be undone.    │
├─────────────────────────────────────┤
│           [ Cancel ] [ Delete ]     │
└─────────────────────────────────────┘
```

4. Klik "Delete Banner" untuk confirm
5. Banner akan dihapus dari list
6. Inspector Panel kembali ke default state
7. Toast muncul: "Banner [name] has been deleted"

**Tips**: Klik "Cancel" atau ✕ untuk batal

---

#### 4. 📌 Publish Toggle
**Fungsi**: Toggle status publish banner

**Cara Pakai**:
1. Pilih banner
2. Lihat toggle switch "Publish"
3. Klik untuk toggle ON/OFF
4. Status banner akan update
5. Toast muncul: "Banner [name] has been published/unpublished"

**Visual States**:
- ON (Biru): Banner published
- OFF (Abu-abu): Banner unpublished

---

## 📊 Workflow Contoh

### Scenario 1: Mencari dan Download Banner Hotel

```
1. Ketik "Hotel" di search bar
   → Banner "OTW Hotel Promo" muncul

2. Klik banner tersebut
   → Inspector Panel shows detail

3. Klik tombol "Download"
   → Toast: "ID Translation has been downloaded"
```

---

### Scenario 2: Filter Banner Transport dan Delete

```
1. Klik dropdown "All Product"
   → Pilih checkbox "Transports"

2. Banner Flight dan Car Rental muncul
   → Pilih "Car rental promo 1"

3. Klik tombol "Delete" di Inspector Panel
   → Modal konfirmasi muncul

4. Klik "Delete Banner"
   → Banner dihapus, toast muncul
```

---

### Scenario 3: Switch View dan Toggle Publish

```
1. Klik icon List (≡) di FilterBar
   → View berubah ke List View

2. Klik banner "First time user"
   → Inspector Panel shows detail

3. Lihat toggle "Publish" (saat ini OFF)
   → Klik toggle

4. Toggle berubah ON (biru)
   → Toast: "Banner ... has been published"
```

---

## ⌨️ Keyboard Shortcuts (Future)

Coming soon:
- `Ctrl + F`: Focus search bar
- `Esc`: Close modal/clear search
- `Del`: Delete selected banner
- `↑/↓`: Navigate banner list

---

## 🎨 Visual Indicators

### Border Colors
- **No Selection**: Transparent border (atau #d8dce8 saat hover)
- **Selected**: Border biru 3px (#007bff)

### Button States
- **Default**: Abu-abu (#4D4F56)
- **Hover**: Biru (#007bff)
- **Delete Hover**: Merah (#dc2626)

### Toast Types
- **Success**: Dark background (#1f2937) + green icon
- **Info**: Dark background (#1f2937) + blue icon
- **Error**: Dark background (#1f2937) + red icon (future)

---

## 💡 Tips & Tricks

### Performance Tips
1. **Search Efficiency**: Search adalah case-insensitive dan real-time
2. **Filter Kombinasi**: Kombinasikan search + product filter untuk hasil akurat
3. **View Preference**: Grid untuk preview visual, List untuk scan cepat

### UI/UX Tips
1. **Clear Search**: Gunakan ✕ button, lebih cepat dari backspace
2. **Quick Select**: Di List View, easier untuk klik banner berurutan
3. **Batch Actions**: Untuk delete multiple, lakukan satu per satu saat ini (bulk delete coming soon)

---

## 🐛 Common Issues & Solutions

### Issue 1: Banner tidak bisa di-select
**Solution**: Pastikan klik di area card/row, bukan di luar

### Issue 2: Empty state terus muncul
**Solution**: 
- Clear search query
- Reset filter ke "All Product"

### Issue 3: Inspector Panel kosong
**Solution**: Klik salah satu banner untuk memilih

### Issue 4: Modal tidak bisa di-close
**Solution**: 
- Klik tombol Cancel
- Klik ✕ di pojok kanan atas modal
- Klik area di luar modal (backdrop)

---

## 📱 Responsive Behavior

### Desktop (>= 1440px)
- Full 4-column layout
- Inspector Panel fixed di kanan

### Laptop/Tablet (< 1440px)
- Inspector Panel menjadi overlay/modal (future)
- Sidebar bisa di-collapse (future)

### Mobile
- Out of scope untuk prototype ini
- Akan dikembangkan di fase berikutnya

---

## 🔄 Data Updates

### Real-time Updates
- Search: Instant filtering
- Filter: Instant filtering
- Delete: Immediate removal dari list
- Publish Toggle: Immediate state change

### Persistence
- Saat ini: In-memory (page refresh akan reset)
- Future: Supabase backend untuk persistence

---

## 📞 Need Help?

Jika mengalami kesulitan:

1. **Check README.md** - Dokumentasi utama
2. **Check IMPLEMENTATION.md** - Detail teknis
3. **Check /planning folder** - Arsitektur & data structure
4. **Contact Dev Team** - Untuk support lebih lanjut

---

## 🎉 Selamat Menggunakan!

Dashboard Banner Management siap digunakan untuk:
- ✅ Mengelola banner promosi
- ✅ Filter dan search banner
- ✅ Preview banner details
- ✅ Download translation
- ✅ Manage publish status
- ✅ Delete banner yang tidak diperlukan

---

**Happy Managing! 🚀**

Version: 1.0.0  
Last Updated: 2026-01-09
