# Perubahan

Rangkuman buat diskusi. Semua PR dibuat oleh **yojdottix** dan sudah **merged** ke `main` (26–28 Nov 2026).

> **PR #13 tidak ada** di repo `PTGlobalTiketNetwork/TDSLab` (nomor itu tidak terpakai sebagai PR maupun issue), jadi tidak masuk rangkuman ini.

| PR | Judul | Branch | File | Merged |
| --- | --- | --- | --- | --- |
| #11 | Unify DLP/Promo/Entry Point list, editor and preview UX | `DLP-Header-Feature` | 66 | 27 Nov 2026 |
| #12 | Fix Menu Management page UI: centering, layout, and switch color | `menu-management-fix-ui` | 9 | 27 Nov 2026 |
| #14 | TTD Promo Asset flow + shared banner editor polish | `TTD-Promo-Assets` | 38 | 27 Nov 2026 |
| #15 | TTD polaroid Highlight templates and editor polish | `feat/ttd-polaroid-templates` | 20 | 27 Nov 2026 |
| #16 | Banner editor polish: auto-save drafts, To Do vouchers, voucher badge, overlay solid mode | `fix-nudge-type-grouping` | 35 | 28 Nov 2026 |

---

# PR #11 — DLP Assets + list/editor jadi seragam

## Intinya

1. **Menu baru: DLP Assets** — satu project berisi DLP Header (Mobile 1:1/3:4 + Desktop 4:1) dan Entry Point Banner (2:1, 3:4, 5:1), dengan stepper sendiri, bisa disimpan, diedit lagi, dan di-download sebagai ZIP.
2. **Menu baru: Analytics (admin saja)** — hasil pembuatan banner per minggu / bulan / tahun / semester / rentang bebas, bisa difilter per creator.
3. **Tracker waktu pembuatan** — mencatat waktu aktif saat bikin banner, dipakai untuk hitung jam hemat di Analytics.
4. **Banner Desktop 5:1 (baru)** — bisa dibuat sendiri, atau ditambahkan ke banner 2:1 lewat "Add desktop version?".
5. **Halaman list seragam** — toolbar, pagination, dan segmented control yang sama di Logo Assets, Promo Banner, Product Entry Point, DLP Assets, dan Drafts.
6. **Sticky bar konsisten** — shadow baru muncul saat benar-benar menempel, dan lebar bar sampai ke tepi.
7. **Product Entry Point disamakan** — penamaan (vertical dulu, ada prefix) dan ukuran preview sama dengan Promo Banner/DLP.
8. **Layout 2:1 & 3:4 lebih fleksibel** — skala/posisi konten, 2 diskon, mata uang & satuan bebas, overlay 2 lapis, geser/resize langsung di preview.

## Sedikit lebih detail

**DLP Assets**
- Langkah: Select Option → Setup DLP Header → Entry Point Banner → Summary. Langkah yang tidak dipilih hilang dari stepper.
- Project Name wajib dan tidak boleh kembar di DLP Assets; nama diawali prefix vertical ("General - …").
- Entry Point Banner: satu accordion per ukuran, form dan preview sama dengan Promo Banner. Ada "Copy content from" untuk menyalin teks, key visual, dan logo dari ukuran lain.
- Summary: preview semua banner + **Download as ZIP** (pilih 1x / 1.5x / 2x / 3x), atau download per banner (EN + ID).
- Panel kanan di list punya switcher Mobile / Desktop untuk preview header.

**Analytics & tracker**
- Kartu: banners created, assets delivered (EN + ID dihitung terpisah), estimated hours saved, avg time in tool, published.
- Grafik tren, rincian per kategori / vertical / ratio, tabel per creator, plus kalimat ringkasan siap copy.
- Waktu dihitung hanya saat tab terlihat dan ada aktivitas dalam 60 detik terakhir.

**Desktop 5:1**
- Ukuran 2000×400, teks memakai tampilan yang sama dengan 2:1. CTA di kanan, T&C di kanan bawah.
- Logo campaign & partner: satu pill di kiri atas, atau campaign logo bebas ditaruh di mana saja.

**Editor banner**
- 2 diskon sekaligus, masing-masing dengan nudge sendiri ("up to", "from", …).
- Mata uang Rp / IDR / custom / tanpa mata uang; satuan k, mio, rb, jt, %, atau kosong.
- Overlay bisa 2 lapis (Opacity, Start, Stop) + Reset to default.
- Bounding box untuk geser & resize konten, key visual, logo, dan T&C di preview.
- "Copy settings from…" untuk menyalin pengaturan dari banner lain.
- Banner lama tidak diedit langsung: muncul "Duplicate & edit" yang membuat draft baru.

**Lain-lain**
- Filter Product & Ratio bisa pilih banyak + search; vertical "Transport" dipecah jadi Flight dan NFT.
- Analytics: judul/subjudul dobel dihapus, kartu ringkasan diganti nama.
- DLP sub-banner editor: header "Preview" ditambah, divider/layout yang bocor dibenahi.
- Shadow CTA dihapus, wording bulk action untuk DLP ("DLP" bukan "banners"), fallback upload logo.
- Font seragam Tiket Odyssey.

## File baru
- `components/dlp-assets/DlpAssetsFlow.tsx`, `EntryPointEditor.tsx` — alur DLP Assets
- `pages/AnalyticsPage.tsx` — halaman Analytics
- `utils/creationTimer.ts` — tracker waktu
- `create-banner/BannerDesktop51.tsx` — banner 5:1
- `create-banner/components/BoundingBox.tsx`, `ImageBox.tsx`, `CopySettingsFrom.tsx`
- `create-banner/settingsVersion.ts` — versi pengaturan banner
- `ui/ListToolbar.tsx`, `ui/SegmentedControl.tsx`, `hooks/useStickyBar.ts` — komponen list & sticky bar
- `assets/SingleAssetUploadDialog.tsx` — upload asset baru langsung dari form

---

# PR #12 — Menu Management dirapikan

## Intinya

1. **Halaman center dengan benar** — margin selebar sidebar yang dobel dihapus, jadi konten di tengah area konten (sama seperti `/settings/access`).
2. **Header lebih simpel** — cukup judul halaman, tanpa ikon dan deskripsi.
3. **Translate dipisah** — punya kartu sendiri "Fitur", terpisah dari daftar sub-menu banner. Mematikannya hanya menyembunyikan tombol Translate di form banner.
4. **Switch warna biru tiket** — semua toggle di aplikasi kini `#007BFF` saat aktif (sebelumnya hitam).
5. **TTD Promo Asset didaftarkan** — sebagai item menu yang bisa diatur di Menu Management dan sebagai pilihan kategori di create banner.

---

# PR #14 — TTD Promo Asset + perapian editor bersama

## Intinya

1. **Menu baru: TTD Promo Asset** — satu project berisi Banner 2:1, 3:1, 5:1 (Desktop), dan Brand Icon. Pilih yang dibutuhkan saja.
2. **Download ZIP untuk TTD** — dari Summary, panel kanan di list, dan bulk download, sama seperti DLP.
3. **Partner logo lebih fleksibel di semua ratio** — warna background pill dan "Asset size" yang hanya membesarkan logo (pill tetap).
4. **Default & form 5:1 dirapikan** — partner logo 160%, campaign logo 145%, CTA dan T&C punya kartu sendiri.
5. **Rename dari menu klik kanan** — untuk semua kategori, prefix nama terkunci, dan ada cek nama kembar.
6. **Menu Management per item** — bisa diatur admin-only dan badge NEW tanpa ubah kode.
7. **Banyak perbaikan UI** — eyedropper, upload WebP + paste, panel kanan, dropdown, grid list, dan lain-lain.

## Sedikit lebih detail

**TTD Promo Asset**
- Langkah: Select → Edit → Summary. Nama project diawali prefix terkunci **"To Do - "** dan tidak boleh kembar di TTD Promo Asset.
- Banner 3:1 adalah ratio baru (layout 2:1 di kanvas lebih lebar), hanya dipakai TTD.
- Default khusus TTD: partner logo langsung aktif, slot 1 kategori Partner, content scale 2:1 = 125%, 3:1 = 105%, 5:1 = 150%.
- **Brand Icon** (dulu "Vertical Icon"):
  - Pilih background lingkaran Default (biru) atau Brand Days OTW (kuning).
  - Logo bisa digeser & di-resize (bounding box + slider Scale / Position X / Position Y).
  - Export **144px** (2x = 288, 3x = 432).
  - Remove background jalan di browser, **tanpa token AI**.
- Info popover "TTD Banner Package" pakai thumbnail visual: 5:1 teks di kanan, Brand Icon berupa lingkaran.
- Panel kanan di list: switcher item yang dipilih (2:1 / 3:1 / 5:1 / Brand Icon), ukuran preview 3:1 sudah benar.
- Isi ZIP: `01 Banner 2x1`, `02 Banner 3x1`, `03 Banner 5x1 (Desktop)` (masing-masing EN + ID) dan `04 Brand Icon/Brand Icon.png`.

**Partner logo (Promo Banner, DLP, TTD)**
- Background pill: toggle + preset (N0, B100, Y500, B400, B500, Black) + warna custom. Default tetap putih.
- "Asset size" (50–150%) di 2:1, 3:1, 3:4, 1:1: hanya logo yang membesar, ukuran pill tetap.
- 5:1 / 4:1: "Partner asset size" juga hanya membesarkan logo; pill tetap di ukuran default.
- Drop shadow di bawah pill dihapus (sekarang flat di semua ratio, sama dengan 5:1).
- Pilihan kategori logo (Payment, Airlines, …) tidak lagi meluber keluar panel.

**5:1**
- Default partner logo 160% dan campaign logo asset size 145% (DLP 4:1 tetap 100%).
- Pill partner punya padding atas-bawah, tidak mepet lagi.
- Form: CTA Button dan Terms and Condition masing-masing punya kartu sendiri; ukuran font T&C pindah ke toolbar rich editor T&C (sama seperti DLP 4:1).

**Editor banner**
- Mata uang "None" hanya menyembunyikan Rp/IDR; angka diskon tetap tampil.
- Format nudge (bold/regular) seragam di Promo, DLP, dan TTD.
- Eyedropper di tab Custom semua color picker (Chrome/Edge).
- Chevron back di stepper mundur satu langkah; konfirmasi keluar hanya dari langkah 1.
- DLP: tidak ada konfirmasi keluar kalau project masih kosong.

**List & aplikasi**
- **Rename** di menu klik kanan untuk semua kategori:
  - Prefix "<Vertical> - " / "To Do - " terkunci, hanya bagian setelahnya yang bisa diubah.
  - Cek nama kembar: DLP & TTD per kategori, lainnya di semua banner.
- **Perbaikan simpan:** Rename, Move to Drafts, dan Publish Drafts (bulk) sebelumnya gagal karena server butuh record lengkap — sekarang digabung ke record tersimpan dulu.
- **Upload:** semua uploader gambar terima WebP dan bisa paste dari clipboard.
- **Panel kanan:** tidak lagi tembus border card yang terpilih (Inspector dan Asset Inspector).
- **Dropdown:** teks panjang dipotong dengan "…".
- **Asset Library:** klik area kosong menutup panel kanan.
- **Grid list:** card tidak lagi besar-kecil saat panel kanan terbuka.
- **Halaman "Asset Updated":** posisi di atas, tidak di tengah layar.
- **Remove Background** di halaman Add/Edit Asset jalan di browser tanpa token AI.

**Menu Management**
- Tiap item menu bisa diatur **admin-only** dan **badge NEW** lewat toggle.
- TTD Promo Asset default admin-only selama masih dikembangkan.

## File baru
- `components/ttd-promo-asset/TtdPromoAssetFlow.tsx` — alur TTD Promo Asset
- `components/ttd-promo-asset/TtdBrandIconPreview.tsx` — preview Brand Icon di panel kanan
- `utils/removeWhiteBackground.ts` — hapus background putih di browser (tanpa AI)

## Perlu dicek
- Semua perubahan di PR #14 baru lolos `pnpm build` dan `pnpm check:ai-access`; checklist test plan di PR belum dites di browser.
- Ukuran Brand Icon 144px dan default-default baru sebaiknya dikonfirmasi ke design.

---

# PR #15 — Template Highlight (polaroid) untuk TTD

## Intinya

1. **Template baru di TTD Promo Asset** — Gradient (tampilan lama), Highlight 2 Image, Highlight 3 Image untuk 2:1, 3:1, dan 5:1. Brand Icon tidak berubah.
2. **Highlight** — background solid atau linear gradient (default B400) dengan foto polaroid miring sesuai Figma. Foto 1 = key visual.
3. **Per foto** — crop dengan drag, zoom, X/Y, flip H/V, tilt, urutan layer (drag untuk reorder).
4. **Overlay image** opsional di antara background dan polaroid (gambar sendiri atau Foto 1, opacity, fade, crop, flip).
5. **5:1** — layout dan gradient dicerminkan (teks di kanan).

## Sedikit lebih detail

**TTD**
- Semua item terpilih default, edit langsung buka Setup Banners, satu editor terbuka sekaligus.
- Project disimpan dengan product `ToDos` (project lama tanpa product kini terbaca ToDos, bukan Accom).
- 3:1: konten dan T&C geser 12px ke kanan, T&C 4px lebih bawah. Tab Inspector "Brand Icon" jadi "Icon".

**Bersama (Promo Banner, DLP, TTD)**
- Toggle **Text shadow** di Content Nudge, default off (banner lama ikut hilang shadow-nya sampai dinyalakan).
- Teks badge unit (%, k, rb) default satu token lebih gelap dari warna background pertama.
- Preview editor 2:1/3:1: 3 level zoom, default stacked 75%.
- 5:1: key visual ikut Flip H/V; benefit row center di area yang terlihat.
- Upload gambar: drop zone dashed, klik di mana saja untuk browse, hover + ⌘V untuk paste.
- Dialog upload logo: Erase background (putih) dengan undo; "Edit Assets" jadi "Change asset".
- Banner 2:1 baru default content scale 125%.

**DLP**
- Satu editor terbuka sekaligus; edit project lama buka di langkah setup pertama.

---

# PR #16 — Auto-save, voucher To Do, dan perapian editor

## Intinya

1. **Auto-save draft** di Promo Banner, DLP, dan To Do — kerjaan aman kalau halaman ter-refresh.
2. **Voucher dekoratif di To Do** (Visual & Logo) — bentuk tiket di tepi atas & bawah banner Highlight.
3. **Badge Voucher Code** — label "Promo Code:" / "Kode Promo:" + kode, dengan divider putus-putus.
4. **Overlay Fade / Solid** — overlay bisa blok warna solid atau linear gradient, bukan hanya fade.
5. **Scale foto & overlay image 50–300%** — di bawah 100% gambar tidak lagi terpotong jadi kotak.
6. **Color picker** — seluruh bar bisa diklik, maksimal 8 warna recent.
7. **Header & sticky bar** — header builder 80px dengan divider saat sticky bar muncul; sticky bar padding 16px atas-bawah.
8. **Export desktop maks 1600px**, nama ZIP DLP `DLP (<Product>) - <Nama project>.zip`.

## Sedikit lebih detail

**Auto-save**
- Simpan otomatis 5 detik setelah edit terakhir, setelah field wajib Save Draft terisi. Ada indikator "Saving…" / "Draft saved hh:mm".
- Satu record draft dipakai ulang oleh auto-save, Save Draft, dan Publish — tidak ada duplikat.
- Ada peringatan browser kalau keluar halaman dengan perubahan belum tersimpan.
- Discard pada project baru menghapus draft hasil auto-save.
- Auto-save di DLP & To Do tidak render/upload thumbnail (traffic); thumbnail dibuat saat Save Draft / Publish manual.

**Voucher (To Do, template Highlight)**
- Switch utama untuk menyalakan/mematikan keduanya, plus toggle per bentuk (Top / Bottom).
- Satu warna untuk kedua voucher (default #FFD300).
- Slider urut Scale (75–120%), Position X/Y (±5%), Rotation (±15°), dengan default per ratio (2:1, 3:1, 5:1) dan tombol "Reset slider to default".
- "Apply to…" hanya membawa on/off dan warna; posisi, rotasi, scale tetap per ukuran.
- Urutan section di Visual & Logo: Photos → Overlay image → Voucher.

**Badge Voucher Code (Additional Info)**
- Pilihan Label: Preset / Custom / Voucher. Voucher default "VOUCHERCODE", maks 19 karakter, teks #007BFF di atas putih.
- Padding 8px atas, 6px bawah, 10px kiri-kanan; tanpa drop shadow.
- Divider vertikal putus-putus 6 dash (0.5px), dash pertama & terakhir menempel tepi; ikut warna teks.

**Foto polaroid (To Do)**
- Thumbnail tidak bisa di-pan; drag thumbnail ke foto lain untuk tukar gambar. Double-click atau ikon expand membuka preview ukuran penuh.
- Badge nomor hanya muncul di slot kosong. Tilt ±8°; Foto 1 di Highlight 2 default miring 8°.
- Drag foto yang diperkecil (<100%) kini mengikuti kursor, termasuk melewati tepi frame.
- Highlight 3: posisi foto 1/2 ditukar sesuai Figma (project lama otomatis dimigrasi).

**Editor banner (semua flow)**
- Teks Perks: ukuran bisa diatur, toggle "Sync style" di baris Icon.
- Rich text: ukuran saat semua teks terpilih mengubah ukuran blok; batas karakter juga saat paste.
- Mematikan Discount Amount & Unit ikut mematikan prefix, nudge di atas angka, dan ikon unit.
- Tinggi headline EN/ID sama saat diskon mati; jarak 2 headline 4px; "Max 5 words" jadi "Rec. 5 words".
- Slot partner baru default Partner, antar slot ada divider.
- Desktop 5:1 punya Flip sendiri.

**List & lain-lain**
- List TTD: filter "All Template" (Gradient / 2 Highlight / 3 Highlight) menggantikan Product/Ratio.
- Analytics: range Daily dengan grafik per jam.
- Upload asset: ikon hapus kotak di kanan atas, teks "Browse file or paste from clipboard", logo baru langsung muncul di form.
- Color picker: urutan Neutral, Blue, Yellow, Red; swatch transparan pakai checkerboard; hex 8 digit.

## File baru
- `hooks/useAutoSaveDraft.tsx` — hook auto-save + indikator

## Perlu dicek
- Semua perubahan di PR #16 baru lolos `pnpm build`; belum dites di browser.
- Saat merge, status check PR "unstable" (kemungkinan preview Vercel) — cek deploy `main`.
- Auto-save **tidak** membuat/meng-upload thumbnail (hemat traffic); thumbnail diperbarui saat Save Draft / Publish manual. Draft baru yang hanya ter-auto-save belum punya thumbnail di list.
- Divider 0.5px bisa terlihat samar di layar 1x.
