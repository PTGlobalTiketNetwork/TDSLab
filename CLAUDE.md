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

## Secret & keamanan

- `utils/supabase/info.tsx` berisi project URL + **anon key** (publishable, aman ter-commit).
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dibaca dari env di edge function (`supabase/functions/server/`). Jangan pernah masuk ke bundle frontend.

## Git

Repo private: `PTGlobalTiketNetwork/TDSLab`. Akun GitHub dipatok **per-repo**, terlepas dari akun aktif `gh` di mesin:

- `user.name` / `user.email` di-set di config lokal repo (noreply email akun `PTGlobalTiketNetwork`). Jangan timpa dengan config global.
- `credential.https://github.com.helper` lokal me-reset daftar helper global lalu memasang helper yang mengambil token akun `PTGlobalTiketNetwork` dari keyring `gh` (`gh auth token --user ...`). Jadi push/fetch di repo ini selalu pakai akun tersebut; repo lain tetap ikut akun aktif `gh`.
- Untuk perintah `gh` di repo ini (mis. `gh pr create`), akun aktif tetap berlaku — override sesaat dengan:
  ```bash
  GH_TOKEN=$(gh auth token --user PTGlobalTiketNetwork) gh <subcommand>
  ```
