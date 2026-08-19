# CLAUDE.md

Panduan singkat untuk AI agent yang bekerja di repo ini. Detail fitur & design system ada di `README.md` — file ini hanya memuat hal yang tidak jelas dari struktur folder.

## Stack

React 18 + TypeScript + Vite 6, Tailwind CSS v4 (via `@tailwindcss/vite`), Radix UI + shadcn-style components, MUI (dipakai sebagian), Supabase (auth, storage, KV store), react-router-dom v7.

Package manager: **pnpm** (ada `pnpm-workspace.yaml` dan `pnpm.overrides` yang mem-pin vite ke 6.3.5).

```bash
pnpm install
pnpm dev      # vite dev server
pnpm build    # production build
```

Tidak ada test runner, linter, atau typecheck script di `package.json`. Verifikasi perubahan lewat `pnpm build` (Vite akan gagal pada error import/syntax).

## Peta direktori

| Path | Isi |
| --- | --- |
| `src/app/App.tsx` | Entry aplikasi, routing, global state |
| `src/app/pages/` | Halaman per rute (banner, asset, access management, dll) |
| `src/app/components/` | Komponen fitur; subfolder `assets/`, `auth/`, `create-banner/`, `inputs/`, `tools/` |
| `src/app/components/ui/` | Primitive shadcn/Radix (`button.tsx`, dll) + wrapper brand `Tiket*.tsx` — reuse, jangan tulis ulang |
| `src/services/` | Semua akses data (Supabase): `bannerService`, `assetService`, `accessService` |
| `src/context/` | React context: access, navigation blocker, global interaction, preloader |
| `src/config/` | Konstanta non-kode: preset AI model, layout banner, preset resize |
| `src/imports/` | Hasil import Figma, referensi saja — bukan komponen produksi |
| `supabase/functions/server/` | Edge function (Deno): API server + KV store |
| `planning/`, `plans/`, `guidelines/` | Spec & dokumen desain, sumber kebenaran untuk perilaku fitur |

## Konvensi

- Import pakai alias `@` → `src/` (lihat `vite.config.ts`).
- Skema `figma:asset/<file>` di-resolve oleh plugin custom ke `src/assets/`. Jangan pakai untuk aset baru — gunakan import biasa atau Supabase Storage.
- Komponen `PascalCase`, service/hook `camelCase`, styling lewat class Tailwind (hindari inline style).
- Akses data selalu lewat `src/services/*`, jangan panggil client Supabase langsung dari komponen.

## Akses & gating fitur AI

Model izinnya dua flag saja, dari `useAccess()` (`src/context/AccessContext.tsx`): `isWhitelisted` (semua fitur AI) dan `isAdmin` (tambahan halaman Settings). Gating-nya berlapis dua dan **keduanya wajib** — UI untuk pengalaman, server untuk penegakan.

### Lapis 1 — UI (menyembunyikan)

- Route di-gate dengan `<AccessGate>` / `<AccessGate adminOnly>` di `App.tsx`.
- **Setiap entry point AI juga wajib disembunyikan, bukan cuma di-redirect.** Route guard baru bekerja setelah user klik; tombol yang tetap terlihat lalu melempar user kembali ke dashboard adalah bug. Pola yang dipakai: `{isWhitelisted && <...>}`.
- Sudah ter-gate: tombol/menu Generative Resize di `BannerContextMenu`, `InspectorPanel`, dan `SuccessScreen`; tab Generate/Gallery di `FormStep3` dan `ImageInputSelector`; Auto Translate di `FormStep2`; menu Tools di `Sidebar`.
- `ImageInputSelector` memaksa `hideAITab`/`hideHistoryTab` untuk non-whitelist, jadi caller baru aman secara default.

### Lapis 2 — Edge function (menegakkan)

Anon key itu publik, jadi UI saja tidak membatasi biaya Replicate. Route berbayar dijaga `requireWhitelisted(c)` di `supabase/functions/server/index.tsx`:

```ts
const denied = await requireWhitelisted(c); if (denied) return denied;
```

Berlaku untuk 10 route: `generate-text`, `generate-image`, `start-generate-text`, `start-generate-image`, `check-prediction/:id`, `cancel-prediction/:id`, `utility/remove-background`, dan tiga route `generative-resize/history`. Balasannya 401 (tidak login) atau 403 (bukan whitelist).

**Konsekuensinya di klien:** route tersebut menolak anon key. Semua pemanggilnya wajib memakai `getAuthToken()` dari `src/utils/supabase/client.ts`, bukan `publicAnonKey`:

```ts
headers: { 'Authorization': `Bearer ${await getAuthToken()}` }
```

Route lain (`/upload`, `/delete-files`, `/banners`, `/assets`, `/activities`, `/signup`) masih terbuka dan tetap memakai anon key — belum di-gate, bukan berarti aman.

### Menjaga keduanya tetap sinkron

```bash
pnpm check:ai-access
```

Skrip `scripts/check-ai-access.mjs` gagal kalau ada route yang menyentuh `REPLICATE_API_TOKEN` tanpa guard, atau ada call site klien ke route ter-gate yang masih mengirim `publicAnonKey`. Jalankan setelah menambah endpoint AI baru.

## Secret & keamanan

- `utils/supabase/info.tsx` berisi project URL + **anon key** (publishable, aman ter-commit).
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dibaca dari env di edge function (`supabase/functions/server/`). Jangan pernah masuk ke bundle frontend.

## Git

Repo private: `PTGlobalTiketNetwork/TDSLab` (owner). Pekerjaan sehari-hari dilakukan sebagai collaborator `ryansetiawan-tiket` (akses write).

Akun dipatok **per-repo** di config lokal, terlepas dari akun aktif `gh` di mesin:

- `user.name` / `user.email` lokal = `ryansetiawan-tiket` / `ryan.setiawan@tiket.com`. Jangan timpa dengan config global.
- `credential.https://github.com.helper` lokal me-reset daftar helper global lalu memasang helper yang mengambil token `ryansetiawan-tiket` dari keyring `gh` (`gh auth token --user ...`). Push/fetch di repo ini selalu pakai akun itu; repo lain tetap ikut akun aktif `gh`.
- Perintah `gh` (mis. `gh pr create`) tidak ikut config repo — ia memakai akun aktif. Kalau butuh bertindak sebagai owner:
  ```bash
  GH_TOKEN=$(gh auth token --user PTGlobalTiketNetwork) gh <subcommand>
  ```
- Ganti akun pengerjaan = ubah dua config lokal di atas (identitas + helper) ke login akun lain; tidak perlu `gh auth switch`.
