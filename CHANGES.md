# Perubahan — branch `fix-copy-layout-banner-ratio-3x4`

Rangkuman buat diskusi. Bagian atas = kerjaan **25 Nov 2026**. Bagian bawah = rombakan layout banner (dibanding `main`), sudah ada sebelum tanggal itu.

---

# 25 Nov 2026

## Intinya

1. **Menu baru: DLP Assets** — satu project berisi DLP Header + Entry Point Banner (2:1, 3:4, 5:1), dengan stepper sendiri dan sudah bisa disimpan.
2. **Menu baru: Analytics (admin saja)** — hasil kerja pembuatan banner per minggu / bulan / tahun / semester / rentang bebas, bisa difilter per creator.
3. **Tracker waktu pembuatan** — mencatat waktu aktif saat bikin banner, dipakai untuk hitung jam hemat.
4. **Filter list lebih enak** — Product dan Ratio bisa pilih banyak (checkbox) dan ada search.
5. **Vertical "Transport" dipecah** — jadi Flight dan NFT, di semua dropdown dan filter.
6. **Panel kanan di list hanya muncul saat ada card terpilih** — bisa batal pilih lewat klik card lagi, klik area kosong, X, atau Esc.
7. **Menu Management dirapikan** — Homepage Promo Banner dan Hero LP Header dihapus; ada toggle untuk tombol Translate.
8. **Font seragam Tiket Odyssey** — tidak ada lagi teks yang belang.
9. **Rapi-rapi kecil** — card tanpa kotak dalam kotak, tombol warna token, bar stepper sticky, perbaikan pop-up actual size.

## Sedikit lebih detail

**DLP Assets**
- Langkah: Select Option → Setup DLP Header → Entry Point Banner → Summary. Langkah yang tidak dipilih otomatis hilang dari stepper.
- Select Option: Project Name (wajib, tidak boleh kembar di DLP Assets), Vertical, DLP Header (Mobile 1:1 atau 3:4 + Desktop 4:1, default dua-duanya aktif), dan Entry Point Banner (2:1, 3:4, 5:1).
- Entry Point Banner: satu accordion per ukuran, berisi form dan preview yang sama dengan Promo Banner (Content nudge + Key visual & logo). Saat tertutup tampil preview kecil + tombol See actual size.
- Tombol "Copy content from" di tiap accordion: menyalin teks, key visual, dan logo dari ukuran lain (layout tetap).
- Finish menyimpan project sebagai satu record (thumbnail dari banner pertama). Bisa diedit lagi dari list.
- **Belum:** isi Setup DLP Header masih placeholder; belum ada Save as Draft.

**Analytics**
- Rentang: Weekly, Monthly, Yearly, Semester (H1/H2 per tahun), Custom. Semua dibandingkan dengan periode sebelumnya.
- Kartu: banners created, assets delivered (EN + ID dihitung terpisah), estimated hours saved, avg time in tool, published.
- Grafik: tren (bar/area), rincian per kategori / vertical / ratio (bar, donut, pie), tabel per creator.
- Ada kalimat ringkasan siap pakai untuk CV + tombol copy.
- Jam hemat = (waktu manual per banner − waktu di tool) dijumlah per banner. Waktu manual adalah asumsi yang bisa diubah (default 30 menit).

**Tracker waktu**
- Satu detik dihitung hanya kalau tab terlihat dan ada aktivitas dalam 60 detik terakhir.
- Total disimpan di data banner setiap kali save; waktu lama dilanjutkan saat edit.
- Hanya berlaku untuk banner yang dibuat/diedit setelah fitur ini ada.

**Filter & list**
- Filter Product dan Ratio: checkbox banyak pilihan, search di dalam dropdown, Clear All.
- Daftar vertical tetap: General, Hotel, Flight, NFT, ToDos, Event. Banner lama "Transport" dihitung sebagai Flight saat difilter (data tidak diubah).
- Card di list: kotak abu-abu di dalam card dihapus supaya lebih bersih.

**Lain-lain**
- Reset to default di pengaturan overlay.
- Sisi kiri pill logo 5:1 konsisten antara "campaign saja" dan "campaign + partner".
- Tab EN/ID: shadow baru muncul setelah benar-benar menempel.
- Pop-up See actual size tidak lagi terpotong saat zoom in.

## File baru hari ini
- `pages/AnalyticsPage.tsx` — halaman Analytics
- `utils/creationTimer.ts` — tracker waktu
- `components/dlp-assets/DlpAssetsFlow.tsx`, `EntryPointEditor.tsx` — alur DLP Assets

## Perlu dicek besok
- Semua perubahan di atas baru lolos `pnpm build`, belum dites lama di browser.
- Panel detail di list untuk project DLP (ukuran, Resize) belum dicek.
- Isi Setup DLP Header, Save as Draft, dan migrasi banner "Transport" lama belum dikerjakan.
- Pemakaian tool lain (Resize, Translate, Image Generation) belum tercatat per user.

---

# Rombakan layout banner (sebelum 25 Nov 2026)

Dibanding `main`.

## Intinya

1. **Banner Desktop 5:1 (baru)** — bisa dibuat sendiri, atau ditambahkan ke banner 2:1 lewat "Add desktop version?".
2. **Layout 2:1 & 3:4 lebih fleksibel** — konten bisa diperbesar/dikecilkan, digeser, dan di-center vertikal. Ukuran tombol CTA 2:1 juga bisa diatur.
3. **Bisa 2 diskon sekaligus** — masing-masing punya teks nudge sendiri ("up to", "from", dll.).
4. **Mata uang & satuan lebih bebas** — Rp / IDR / custom / tanpa mata uang; satuan k, mio, rb, jt, %, atau kosong.
5. **Overlay bisa 2 lapis** — atur Opacity, Start, Stop per lapis, plus tombol Reset to default.
6. **Geser & resize langsung di preview** — konten, key visual, logo, dan T&C.
7. **Logo campaign & partner 5:1** — satu pill di kiri atas, atau campaign logo bebas ditaruh di mana saja.
8. **"Copy settings from…"** — salin pengaturan dari banner yang sudah ada.
9. **Banner lama tidak diedit langsung** — muncul pilihan "Duplicate & edit", jadi draft baru `_v2`. Banner asli aman.
10. **Header lebih ramping** — saat scroll muncul bar kecil berisi nama banner + langkah (stepper).
11. **Preview & halaman sukses** — tab All / Mobile / Desktop, zoom, dan tombol "Back to edit".
12. **Perbaikan teks** — format teks (bold, italic, warna) yang melewati baris baru sekarang tampil benar.

## Sedikit lebih detail

**Desktop 5:1**
- Ukuran 2000×400. Isi teksnya memakai tampilan yang sama dengan 2:1, jadi spasi dan warna selalu konsisten.
- Ada CTA di kanan dan T&C di kanan bawah. Konten otomatis tidak menabrak logo atau CTA.
- Pilihan ratio dikelompokkan jadi Mobile dan Desktop.
- Kalau dibundel dengan 2:1, toggle CTA / partner logo / campaign logo saling sinkron antara Mobile dan Desktop.

**2:1 & 3:4**
- Gaya nudge baru: kata utama kuning, "up to / from" putih.
- Perbaikan baris nudge yang bertumpuk di 2:1.
- Posisi default logo 3:4 diubah (20px, skala 160%).
- Abu-abu netral di belakang key visual supaya gambar tidak berubah warna.

**2 diskon**
- Label di atas tiap angka, tanda "+" di tengah, dan ukuran otomatis mengecil agar muat.
- Diskon 2 mulai dari pengaturan Diskon 1 supaya tidak isi dari nol.
- Ada pengaturan skala khusus baris diskon.

**Mata uang & satuan**
- Pilihan mata uang EN dan ID bisa disamakan (default aktif).
- Banner lama yang tersimpan sebagai "Rp" tetap tampil sama.

**Overlay**
- Pengaturan yang sama dipakai di 2:1/3:4 dan 5:1.
- Overlay 2 bisa menyalin pengaturan Overlay 1.
- Reset to default mengembalikan warna, Overlay 1, dan menghapus Overlay 2.

**Logo 5:1**
- Kalau campaign dan partner sama-sama aktif, keduanya digabung jadi satu pill dengan sisi miring.
- Sisi kiri pill kini konsisten antara "campaign saja" dan "campaign + partner".
- Ukuran logo, jarak partner, dan skala pill bisa diatur terpisah.

**Versi pengaturan**
- Banner lama (sebelum rombakan) ditandai versi lama. Saat dibuka dari list, muncul dialog sebelum dibuatkan salinan.

**Form**
- Tab EN/ID menempel di atas saat scroll.
- Teks custom nudge diingat per bahasa saat pindah preset.

## File baru
- `BannerDesktop51.tsx` — banner 5:1
- `BoundingBox.tsx`, `ImageBox.tsx` — geser/resize di preview
- `CopySettingsFrom.tsx` — salin pengaturan
- `settingsVersion.ts` — versi pengaturan banner
