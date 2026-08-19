# Changelog

Semua perubahan penting pada proyek **Tamuin** (sebelumnya *Buku Tamu Digital*) dicatat di sini.

Format mengacu pada [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/), dan proyek ini mengikuti [Semantic Versioning](https://semver.org/lang/id/).

---

## [Unreleased] — 2026-08-18

### Ditambahkan
- **Registrasi mandiri** — halaman login kini memiliki mode *"Buat Akun"* sehingga panitia dapat mendaftar sendiri tanpa bantuan admin.
  - Endpoint baru `POST /api/public/register` dengan rate limiting dan validasi server-side (nama, format email, password ≥ 8 karakter).
  - Endpoint baru `POST /api/public/check-email` untuk cek ketersediaan email sebelum mendaftar.
  - Halaman baru `/panitia/register` sebagai form pendaftaran akun panitia.
  - Migrasi `supabase/user_approval_migration.sql`: kolom `status` pada tabel `profiles` (default `active`; akun hasil registrasi mandiri berstatus `pending`).
  - Panel admin **Users** kini mendukung persetujuan akun (`pending` → `active`), penolakan, dan reset password.
- **Kategori Tamu** (Reguler / VIP / VVIP) dengan field `nama_mahasiswa` & `alamat` pada form tamu, import Excel, dan badge kategori di daftar tamu — migrasi `supabase/guest_kategori_migration.sql`.
- **Periode Acara** — konsep periode/batch untuk section "Acara Terbaru" pada Dashboard — migrasi `supabase/event_period_migration.sql`.
  - `POST /api/events` otomatis menempatkan acara baru ke periode aktif (maks. 4 acara per periode; jika penuh, dibuatkan periode baru).
  - Dashboard admin menampilkan preview maks. 4 acara dari periode terbaru dengan tombol **"Lihat Semua →"** menuju Kelola Acara dan empty state "Belum ada acara aktif".
  - Filter dashboard dinormalkan (`(e.periode_id ?? null)`), sehingga aman bila migration belum dijalankan.
- **Design system Material 3** — token warna, elevation, radius, dan tipografi terpusat di `globals.css`; komponen UI (`Button`, `Input`, `Toast`, `Navbar`, `Sidebar`, `StatCard`, `EventCard`, `GuestTable`) diselaraskan ke Material 3 + Google Pixel-inspired dengan font Plus Jakarta Sans.
- **Pencegahan duplikat tamu** — unique index `(acara_id, no_hp)` dan `(acara_id, email)` beserta pembersihan data lama — migrasi `supabase/guest_dedup.sql`.
- Kolom `instansi` pada tabel `guests` menjadi opsional — migrasi `supabase/guest_instansi_optional.sql`.
- Helper server-side terpusat `src/lib/api-helpers.js` (`requireRole`, `sanitize`, rate limiter, `normalizeEmail`, `findDuplicateGuest`) dan `src/lib/format-time.js`.

### Diubah
- **UI Refinement** — penyelarasan tampilan Admin & Panitia tanpa rebrand:
  - Konten panel memakai `max-w-[1440px]` + padding `p-4 sm:p-6 lg:p-8` yang konsisten.
  - Kartu panitia diseragamkan ke `glass-card` (satu design language admin–panitia).
  - Grid acara adaptif (1/2/3/4 kolom sesuai jumlah), `GuestTable` memakai kartu di < `lg` dan tabel di ≥ `lg` agar tidak horizontal scroll.
  - Sidebar tetap putih; active nav memakai primary container; navbar menjadi M3 top app bar.
- **Statistik hanya angka** — kartu statistik menampilkan nilai numerik (`0` saat kosong), bukan teks empty state seperti "Belum ada data"; prop `trend` yang tidak terpakai dihapus.
- **EventCard mode preview** — pada dashboard menampilkan "Lihat Detail →" (tanpa aksi registrasi/kelola) dengan urutan info Tanggal → Lokasi → Tamu.
- **Rebranding** — "Buku Tamu Digital" → **Tamuin** dengan tagline *"Tamu masuk, semua tercatat."*
  - Wordmark, tagline, dan `alt` logo pada halaman login, sidebar admin & panitia, serta halaman publik event.
  - Metadata halaman (title, description, Open Graph, Twitter) pada `layout.js` root, admin, dan panitia.
  - Template email di `src/lib/email.js` (nama pengirim, footer, dan nama aplikasi).
  - Dokumentasi `README.md` dan `PRD.md`.
- Form tamu (publik & admin) mendukung kategori, alamat, dan nama mahasiswa; export Excel ikut memetakan kolom kategori.
- API `PUT /api/guests/[id]` mendukung field kategori/alamat dengan proteksi duplikat via `findDuplicateGuest`.
- Hapus endpoint usang `GET /api/events/stats` (statistik kini disajikan via React Query).
- Hapus folder `plans/` (dokumen perencanaan usang).

### Diperbaiki
- Dropdown status pada `EventCard` tidak lagi tertimpa/terpotong oleh card — `overflow-hidden` dihapus dari root card, sudut atas tetap membulat via `rounded-t-[calc(0.75rem-1px)]` pada top bar.
- Dashboard menampilkan "Belum ada acara aktif" saat kolom `periode_id` belum tersedia (migration belum dijalankan) — filter dinormalkan dengan `(e.periode_id ?? null)`.

---

## [0.4.1] — 2026-08-18

### Diubah
- `PRD.md` diperbarui: deskripsi produk, latar belakang, tujuan, persona pengguna, dan solusi yang diusulkan lebih lengkap.
- Komponen QR menggunakan `QRCodeCanvas` (qrcode.react) untuk rendering yang lebih baik serta fungsi download QR.
- Hilangkan URL QR Code yang tampil pada `GuestTable` agar UI lebih bersih.
- README diperbarui (menghapus detail registrasi tamu yang sudah tidak relevan pada saat itu).
- Footer pada halaman login/beranda serta judul lama dikomentari demi kejelasan.

### Diperbaiki
- Deskripsi di halaman beranda (`HomePage`) diperjelas dan diperbarui.
- Log hasil scan tamu diperkaya dengan status check-in (`hadir`/`terlambat`) dan waktu yang lebih detail.

## [0.4.0] — 2026-08-01

### Ditambahkan
- Autentikasi guard pada `PanitiaLayout` (`AuthGuard`) untuk pengamanan akses panel panitia.
- Penamaan dan versi proyek diperbarui pada `package.json` (v0.4.1).

### Diubah
- README menghapus fitur "Registrasi Mandiri" (fitur tersebut dikembalikan lagi pada rilis `Unreleased` dengan skema persetujuan admin).

## [0.3.0] — 2026-07-31

### Ditambahkan
- Pembaca QR berbasis **ZXing WASM** (`QRScanner`).
- Icon aplikasi.
- Endpoint API untuk scan tamu dan manajemen user.

### Diubah
- `HomePage` dibungkus `Suspense` untuk penanganan loading yang lebih baik.

## [0.2.0] — 2026-07-30

### Ditambahkan
- Skeleton/loading state pada dashboard admin.
- Filter acara dan peningkatan loading state pada dashboard panitia.
- Dokumentasi teknis: patch update dan implementasi session cookie.

## [0.1.0] — 2026-07-25

### Ditambahkan
- Autentikasi guard dan manajemen session timeout.
- Optimistic updates untuk aktivitas, event, dan mutasi tamu.

### Diubah
- **Refactor besar**: migrasi state management dari Context API ke **TanStack React Query**.
- Refactor skema database dan fungsi registrasi tamu (`register_guest_scan()`).
- Perbaikan `proxy.js`.

---

## Versi Awal — 2026-06-03 s/d 2026-07-15

### Ditambahkan
- Inisialisasi proyek dari Create Next App.
- Halaman dan komponen manajemen event & tamu (`EventCard`, `GuestTable`, dll.).
- Halaman manajemen tamu dengan fitur **import Excel** (SheetJS).
- **Activity feed** dan fitur **scanner**.
- Logo dan gaya judul pada halaman login/beranda.
- Role `staff`/`panitia` pada `profiles`.

### Diubah
- PRD diperjelas dan dipersingkat.
- Refactor fase kedua: status registrasi event, penanganan status event, dan error response.
- Komponen manajemen guest dan event diperbarui untuk fungsionalitas yang lebih baik.
