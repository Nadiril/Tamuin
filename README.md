# Tamuin

**Tamu masuk, semua tercatat.**

![Next.js](https://img.shields.io/badge/Next.js-16.2.7-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase)
![Recharts](https://img.shields.io/badge/Recharts-22CA9E?style=flat&logo=recharts)

**Tamuin** (sebelumnya *Buku Tamu Digital*) adalah platform digital untuk mengelola tamu acara, registrasi, QR Check-in, monitoring kehadiran, dan laporan. Dibangun untuk **STIKOM PGRI Banyuwangi**, sistem ini mendukung registrasi tamu mandiri via QR Code, scan kehadiran oleh panitia, serta dashboard admin yang lengkap.

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Multi-Event** | Kelola banyak acara dalam satu platform |
| **QR Code** | Setiap tamu mendapat QR Code unik untuk scan kehadiran |
| **Scan Kehadiran** | Panitia scan QR tamu untuk menandai hadir/terlambat |
| **Grace Period** | Konfigurasi toleransi keterlambatan per acara |
| **Registrasi Mandiri** | Panitia bisa daftar akun sendiri; status `pending` menunggu persetujuan admin |
| **User Approval** | Admin menyetujui/menolak akun panitia yang baru mendaftar |
| **Kategori Tamu** | Kategorisasi Reguler / VIP / VVIP beserta data mahasiswa & alamat |
| **Anti-Duplikat** | Cegah tamu ganda per acara (berdasarkan no HP / email) |
| **Periode Acara** | Pengelompokan acara per periode untuk section "Acara Terbaru" |
| **Pagination Tamu** | Daftar tamu di detail acara menggunakan pagination angka (10 item/halaman, mobile & desktop) |
| **Dashboard Admin** | CRUD event, guest, user, dan laporan lengkap |
| **Panel Panitia** | Scan QR, lihat history, dan daftar event |
| **Audit Activity** | Semua aktivitas tercatat real-time |
| **Export Excel** | Ekspor data tamu ke file XLSX |
| **Material 3 UI** | Design system Material 3 + Google Pixel-inspired, font Plus Jakarta Sans |

---

## Desain UI

**Tamuin** memakai **Material 3** sebagai design system dan **Google Pixel** sebagai visual inspiration.

- **Font** — Plus Jakarta Sans (dimuat self-hosted via `next/font/google`), dipetakan sebagai `--font-sans`.
- **Design tokens** — warna (primary, primary-container, surface, surface-variant, outline-variant, dst.), elevation, radius, dan tipografi didefinisikan terpusat di `src/app/globals.css`.
- **Surface hierarchy** — sidebar putih + top app bar, konten light neutral, kartu `glass-card` dengan border subtle & elevation halus.
- **Statistik** — kartu statistik selalu menampilkan **angka** (`0` saat kosong), bukan teks empty state seperti "Belum ada data".
- **"Acara Terbaru"** — preview **maksimal 4 acara** dari **periode aktif** (urutan dibuat terbaru) pada Dashboard admin, dengan tombol **"Lihat Semua →"** menuju Kelola Acara. Acara lama tidak dihapus dan tetap tampil penuh di Kelola Acara.
- **Responsive** — mobile 1 kolom, tablet portrait 2 kolom, tablet landscape/desktop hingga 4 kolom; tabel tamu berubah menjadi kartu di bawah `lg` (1024px) agar tidak ada horizontal scroll.

---

## Tech Stack

| Teknologi | Kegunaan |
|-----------|----------|
| [![Next.js](https://img.shields.io/badge/Next.js-16.2.7-000?logo=next.js)](https://nextjs.org) | React framework (App Router) |
| [![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)](https://react.dev) | UI library |
| [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss)](https://tailwindcss.com) | Utility-first CSS |
| [![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase)](https://supabase.com) | Auth, database, RLS, Realtime |
| [![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?logo=reactquery)](https://tanstack.com/query) | State management & data fetching |
| [![Recharts](https://img.shields.io/badge/Recharts-22CA9E?logo=recharts)](https://recharts.org) | Grafik & statistik |
| [![Lucide](https://img.shields.io/badge/Lucide_React-F56565?logo=lucide)](https://lucide.dev) | Ikon |
| [![QRCode](https://img.shields.io/badge/qrcode.react-000?logo=qrcode)](https://github.com/zpao/qrcode.react) | Generate QR Code |
| [![Zxing](https://img.shields.io/badge/zxing--wasm-000?logo=wasm)](https://github.com/nicolo-ribaudo/zxing-wasm) | Scan QR Code via WASM |
| [![SheetJS](https://img.shields.io/badge/SheetJS_(xlsx)-217346?logo=microsoftexcel)](https://sheetjs.com) | Export Excel |

---

## Struktur Folder

```
📦 tamuin
├── 📂 .next/                  # Build output (auto-generated)
├── 📂 .opencode/              # Agent instructions
├── 📂 node_modules/           # Dependencies
├── 📂 public/                 # Static assets
│   ├── 📂 templates/
│   │   └── template-data-tamu.csv
│   ├── Logo.webp
│   ├── Login Tamuku.webp
│   ├── login-tamuku.webp
│   └── zxing_reader.wasm      # WASM binary untuk QR scanning
├── 📂 src/
│   ├── 📂 app/                # Next.js App Router
│   │   ├── 📂 admin/
│   │   │   ├── 📂 (auth)/
│   │   │   │   └── login/         # Login admin
│   │   │   ├── 📂 (panel)/        # Protected admin panel
│   │   │   │   ├── 📂 dashboard/  # Statistik & grafik
│   │   │   │   ├── 📂 events/     # CRUD acara ([id] detail)
│   │   │   │   ├── 📂 guests/     # Daftar tamu
│   │   │   │   ├── 📂 laporan/    # Export laporan
│   │   │   │   ├── 📂 scan-qr/    # Scanner QR
│   │   │   │   ├── 📂 settings/   # Pengaturan
│   │   │   │   └── 📂 users/      # Manajemen user & approval
│   │   │   └── not-found.js       # 404 admin
│   │   ├── 📂 api/                # Route handlers (REST API)
│   │   │   ├── 📂 activities/
│   │   │   ├── 📂 admin/
│   │   │   │   └── reset-data/
│   │   │   ├── 📂 auth/
│   │   │   │   ├── login/
│   │   │   │   ├── logout/
│   │   │   │   └── session/
│   │   │   ├── 📂 events/
│   │   │   │   └── [id]/
│   │   │   ├── 📂 guests/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── reset-attendance/
│   │   │   │   ├── bulk-delete/
│   │   │   │   └── import/
│   │   │   ├── 📂 public/
│   │   │   │   ├── check-email/
│   │   │   │   ├── events/
│   │   │   │   ├── guests/
│   │   │   │   ├── register/
│   │   │   │   └── scan/[token]/
│   │   │   ├── 📂 scan/[token]/
│   │   │   └── 📂 users/
│   │   │       └── [id]/
│   │   ├── 📂 event/[slug]/       # Form registrasi tamu publik
│   │   ├── 📂 panitia/            # Panel panitia
│   │   │   ├── 📂 events/
│   │   │   ├── 📂 history/
│   │   │   ├── 📂 profile/
│   │   │   ├── 📂 register/
│   │   │   └── 📂 scan/
│   │   ├── 📂 scan/[token]/       # Halaman konfirmasi scan QR
│   │   ├── globals.css            # Material 3 design tokens
│   │   ├── icon.png
│   │   ├── layout.js              # Root layout
│   │   ├── page.js                # Halaman login/beranda
│   │   └── providers.jsx          # TanStack Query provider
│   ├── 📂 components/             # UI Components
│   │   ├── 📂 auth/
│   │   │   └── AuthForms.jsx      # Login + register form
│   │   ├── 📂 charts/
│   │   │   ├── AttendanceChart.jsx
│   │   │   └── AttendanceChartInner.jsx
│   │   ├── 📂 event/
│   │   │   └── GuestForm.jsx      # Form registrasi tamu
│   │   ├── 📂 panitia/
│   │   │   ├── PanitiaLayout.jsx
│   │   │   ├── PanitiaNavbar.jsx
│   │   │   └── PanitiaSidebar.jsx
│   │   ├── 📂 scan/
│   │   │   └── ScanConfirm.jsx    # Konfirmasi scan UI
│   │   ├── 📂 scanner/
│   │   │   └── QRScanner.jsx      # ZXing QR scanner
│   │   ├── ActivityFeed.jsx
│   │   ├── AuthGuard.jsx
│   │   ├── Button.jsx
│   │   ├── EventCard.jsx
│   │   ├── GuestTable.jsx
│   │   ├── Input.jsx
│   │   ├── Navbar.jsx
│   │   ├── SessionTimeout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   └── Toast.jsx
│   ├── 📂 hooks/
│   │   └── useIdleTimer.js
│   ├── 📂 lib/
│   │   ├── 📂 queries/            # TanStack Query hooks
│   │   │   ├── useActivitiesQuery.js
│   │   │   ├── useEventsQuery.js
│   │   │   ├── useGuestsQuery.js
│   │   │   ├── useProfileQuery.js
│   │   │   ├── useResetDataQuery.js
│   │   │   └── useUsersQuery.js
│   │   ├── 📂 realtime/           # Supabase Realtime
│   │   │   ├── manager.js         # Singleton channel manager
│   │   │   └── useRealtimeSubscription.js
│   │   ├── 📂 supabase/
│   │   │   ├── client.js          # Browser client (cookie handling)
│   │   │   ├── middleware.js       # Session middleware
│   │   │   └── server.js          # Server client (3 variants)
│   │   ├── api-helpers.js         # requireRole, sanitize, rate limiter, dedup
│   │   ├── event-status.js        # Attendance status computation
│   │   ├── format-time.js         # Time formatting (WIB)
│   │   └── token.js               # QR token generator
│   └── proxy.js                   # Dev proxy / middleware
├── 📂 supabase/                   # Database migrations
│   ├── migration.sql              # Core schema + RLS + trigger
│   ├── public_register_guest_scan.sql
│   ├── guest_dedup.sql            # Unique index anti-duplikat
│   ├── guest_instansi_optional.sql
│   ├── guest_kategori_migration.sql  # Kategori tamu VIP/VVIP
│   ├── event_period_migration.sql    # Periode acara
│   ├── event_period_backfill.sql
│   └── user_approval_migration.sql   # User approval workflow
├── .env.local
├── .gitignore
├── AGENTS.md
├── CHANGELOG.md
├── PRD.md
├── eslint.config.mjs
├── jsconfig.json                  # Path alias (@/ → ./src/*)
├── next.config.mjs
├── package.json
└── postcss.config.mjs
```

---

## Prerequisites

- **Node.js** v18+ (recommended v20+)
- **npm** v9+ (atau yarn/pnpm/bun)
- **Akun Supabase** (gratis di [supabase.com](https://supabase.com))

---

## Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/Nadiril/buku-tamu-digital.git
cd buku-tamu-digital
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon_key_anda
SUPABASE_SERVICE_ROLE_KEY=service_role_key_anda
```

Dapatkan credentials dari **Supabase Dashboard → Settings → API**.

### 4. Setup Database

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan file SQL berikut **secara berurutan**:

#### Urutan Migrasi

| No | File | Isi | Wajib? |
|----|------|-----|--------|
| 1 | `supabase/migration.sql` | Tabel (`profiles`, `events`, `guests`, `activities`), RLS policies, trigger auto-profile, view `events_with_guest_count`, function `register_guest_scan()` | Ya |
| 2 | `supabase/public_register_guest_scan.sql` | Function `public_register_guest_scan()` untuk self-scan tamu tanpa login (dipakai di `/api/public/scan/[token]`) | Ya |
| 3 | `supabase/guest_dedup.sql` | Unique index `(acara_id, no_hp)` & `(acara_id, email)` + bersihkan duplikat lama | Ya |
| 4 | `supabase/guest_instansi_optional.sql` | Kolom `instansi` di tabel `guests` diubah menjadi opsional (nullable) | Ya |
| 5 | `supabase/guest_kategori_migration.sql` | Kolom `kategori_tamu` (Reguler/VIP/VVIP), `nama_mahasiswa`, `alamat`; hapus kolom waktu duplikat + backfill data lama | Ya |
| 6 | `supabase/event_period_migration.sql` | Tabel `periodes` + kolom `events.periode_id` untuk pengelompokan "Acara Terbaru" di dashboard (auto-fill maks. 4 acara per periode) | Ya |
| 7 | `supabase/event_period_backfill.sql` | Menempatkan acara lama (dibuat sebelum migrasi periode, `periode_id` masih `NULL`) ke periode aktif | Opsional |
| 8 | `supabase/user_approval_migration.sql` | Kolom `status` di tabel `profiles` (default `active`; akun hasil registrasi mandiri berstatus `pending` sampai disetujui admin) | Ya |
| 9 | `supabase/idempotency_migration.sql` | Tabel `idempotency_keys` + fungsi RPC idempotent (`idempotent_guest`, `idempotent_event`, `idempotent_guest_bulk_delete`, `idempotent_guest_import`, `idempotent_guest_reset`) untuk mencegah request duplikat & log aktivitas | Ya |

**Cara menjalankan:**
1. Copy isi file `.sql`
2. Paste di SQL Editor Supabase
3. Klik **Run**
4. Lanjut ke file berikutnya setelah sukses

> **Catatan:** Semua file migrasi bersifat idempotent (aman dijalankan ulang). `event_period_migration.sql` **wajib dijalankan** — tanpa kolom `periode_id`, pembuatan acara baru akan gagal dan dashboard menampilkan "Belum ada acara aktif". `event_period_backfill.sql` hanya memproses acara ber-`periode_id NULL`, jadi aman dijalankan kapan pun.

### 5. Buat User Admin

Buat user via **Supabase Dashboard → Authentication → Add User**, lalu di SQL Editor:

```sql contoh
INSERT INTO public.profiles (id, username, role, display_name)
VALUES ('USER_UUID', 'admin@example.com', 'admin', 'Admin Utama');
```

---

## Menjalankan Aplikasi

### Development

```bash
npm run dev
```

Akses di [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## Cara Pakai

### Untuk Admin

1. **Login** → Buka `/`, masuk dengan email & password admin
2. **Dashboard** → Lihat statistik jumlah tamu, kehadiran, grafik, dan acara terbaru (maks. 4 acara dari periode aktif; gunakan **"Lihat Semua →"** untuk daftar lengkap)
3. **Events** → Buat, edit, hapus acara; atur status (`akan_datang`, `registrasi_dibuka`, `registrasi_ditutup`)
4. **Guests** → Lihat daftar tamu, tambah/edit/hapus tamu manual, export Excel
5. **Scan QR** → Scan QR Code tamu untuk verifikasi kehadiran
6. **Users** → Kelola akun panitia; **setujui akun baru** berstatus `pending` dari registrasi mandiri, ubah role, reset password, hapus akun
7. **Laporan** → Export data kehadiran ke Excel

### Untuk Panitia

1. **Login** → Masuk dengan akun panitia
2. **Scan** → Scan QR Code tamu saat acara berlangsung
3. **Events** → Lihat daftar acara yang sedang aktif
4. **History** → Riwayat scan yang sudah dilakukan

### Registrasi Mandiri & Persetujuan Akun

1. Panitia membuka halaman login (`/`) lalu memilih **"Buat Akun"** (atau buka `/panitia/register`)
2. Mengisi nama, email, dan password (minimal 8 karakter)
3. Akun dibuat dengan role `panitia` dan status **`pending`**
4. Admin menyetujui akun tersebut di **Panel Admin → Users** (ubah status menjadi `active`)
5. Setelah disetujui, panitia dapat login dan mengakses panel panitia

### Proses Scan QR

1. Tamu datang ke lokasi acara
2. Panitia scan QR Code tamu (bisa cetak atau tampilkan di HP)
3. Sistem menentukan status: **Hadir** (jika ≤ grace period) atau **Terlambat**
4. Tamu bisa konfirmasi via `/scan/[token]` (bisa di-forward ke tamu)

---

## API Routes

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/session` | Cek session |
| GET | `/api/events` | List events |
| POST | `/api/events` | Buat event |
| GET | `/api/events/[id]` | Detail event |
| PUT | `/api/events/[id]` | Update event |
| DELETE | `/api/events/[id]` | Hapus event |
| GET | `/api/guests` | List tamu |
| POST | `/api/guests` | Tambah tamu |
| GET | `/api/guests/[id]` | Detail tamu |
| PUT | `/api/guests/[id]` | Update tamu |
| DELETE | `/api/guests/[id]` | Hapus tamu |
| POST | `/api/guests/import` | Import tamu (Excel) |
| POST | `/api/guests/bulk-delete` | Hapus tamu secara massal |
| POST | `/api/guests/[id]/reset-attendance` | Reset status kehadiran tamu |
| GET | `/api/activities` | Log aktivitas |
| GET | `/api/users` | List user |
| POST | `/api/users` | Buat user |
| PUT | `/api/users/[id]` | Update user (role, status, password) |
| DELETE | `/api/users/[id]` | Hapus user |
| DELETE | `/api/admin/reset-data` | Reset semua data |
| GET | `/api/public/events` | Event publik |
| GET | `/api/public/guests` | Guest publik |
| POST | `/api/public/guests` | Registrasi tamu publik |
| POST | `/api/public/register` | Registrasi mandiri akun panitia (status `pending`) |
| POST | `/api/public/check-email` | Cek email terdaftar |
| GET | `/api/public/scan/[token]` | Cek data QR (publik) |
| POST | `/api/public/scan/[token]` | Konfirmasi scan publik |
| GET | `/api/scan/[token]` | Data scan (auth) |
| POST | `/api/scan/[token]` | Konfirmasi scan (auth) |

---

## Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  profiles   │     │   events    │     │   guests    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (uuid)   │◄────│ created_by  │     │ id (bigint) │
│ username    │     │ id (bigint) │     │ nama        │
│ role        │     │ nama_acara  │◄────│ acara_id    │
│ status      │     │ slug        │     │ kategori    │
│ display_name│     │ lokasi      │     │ instansi    │
│ no_hp       │     │ tgl_mulai   │     │ no_hp       │
│ created_at  │     │ tgl_selesai │     │ tujuan      │
└─────────────┘     │ jam_mulai   │     │ qr_token    │
                    │ jam_selesai │     │ status      │
┌─────────────┐     │ grace_period│     │ waktu_dtg   │
│ activities  │     │ status      │     │ scanned_by  │
├─────────────┤     │ periode_id  │────┐│ created_at  │
│ id (bigint) │     │ created_at  │    │└─────────────┘
│ action      │     └─────────────┘    │
│ detail      │                        │
│ timestamp   │                        │
│ user_id     │                        │
└─────────────┘                        │
                                       │
┌─────────────┐                        │
│  periodes   │◄───────────────────────┘
├─────────────┤
│ id (bigint) │
│ created_at  │
└─────────────┘
```

> **Relasi utama:** `profiles.created_by` → `events` · `events.id` → `guests.acara_id` · `guests.scanned_by` → `activities.user_id` · `events.periode_id` (nullable) → `periodes.id` untuk pengelompokan "Acara Terbaru" per periode/batch aktif.

---

## Scripts

| Script | Perintah | Deskripsi |
|--------|----------|-----------|
| dev | `npm run dev` | Jalankan development server (port 3000) |
| build | `npm run build` | Build untuk production |
| start | `npm run start` | Jalankan production server (port 3000) |
| lint | `npm run lint` | Jalankan ESLint |

---

## Dependencies Utama

```json
{
  "next": "16.2.7",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "@supabase/ssr": "^0.12.0",
  "@supabase/supabase-js": "^2.110.0",
  "@tanstack/react-query": "^5.101.4",
  "tailwindcss": "^4",
  "@tailwindcss/postcss": "^4",
  "lucide-react": "^1.22.0",
  "recharts": "^3.9.2",
  "qrcode.react": "^4.2.0",
  "@yudiel/react-qr-scanner": "^2.6.0",
  "xlsx": "^0.18.5"
}
```

---

## Environment Variables

| Variable | Deskripsi |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |

---

## Kontribusi

1. Fork repository
2. Buat branch baru: `git checkout -b fitur-anda`
3. Commit perubahan: `git commit -m "Add: fitur baru"`
4. Push: `git push origin fitur-anda`
5. Buat Pull Request

---

## Lisensi

Proyek ini menggunakan lisensi internal **STIKOM PGRI Banyuwangi**.

---

<p align="center">
  Dibuat dengan ❤️ oleh <a href="https://github.com/Nadiril">M. Nadiril Khoir</a><br>
  <sub>STIKOM PGRI Banyuwangi</sub>
</p>
