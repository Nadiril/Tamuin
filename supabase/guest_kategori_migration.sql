-- =====================================================================
-- guest_kategori_migration.sql
-- 1. Tambah kolom nama_mahasiswa & alamat pada tabel guests
-- 2. Hapus kolom waktu duplikat (waktu_registrasi & created_at)
-- 3. Backfill data lama
-- Idempotent: aman dijalankan ulang di SQL Editor Supabase.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom baru
-- Aturan bisnis:
--   - kategori_tamu = 'reguler' -> nama_mahasiswa diisi nama mahasiswa
--   - kategori_tamu = 'vip'/'vvip' -> nama_mahasiswa disimpan sebagai '-'
--   - alamat diisi untuk semua kategori
-- Enforced di aplikasi (API layer) dan dicerminkan pada backfill di bawah.
-- ---------------------------------------------------------------------
alter table if exists public.guests
  add column if not exists nama_mahasiswa text,
  add column if not exists alamat text;

-- ---------------------------------------------------------------------
-- 2. Hapus kolom waktu duplikat
-- Keduanya identik (default now()). Kode aplikasi tidak lagi memakai
-- keduanya; urutan data memakai id (identity = urutan insert).
-- ---------------------------------------------------------------------
alter table if exists public.guests
  drop column if exists waktu_registrasi,
  drop column if exists created_at;

-- ---------------------------------------------------------------------
-- 3. Backfill data lama
-- ---------------------------------------------------------------------
update public.guests
set nama_mahasiswa = nama
where kategori_tamu = 'reguler'
  and (nama_mahasiswa is null or nama_mahasiswa = '');

update public.guests
set nama_mahasiswa = '-'
where kategori_tamu in ('vip', 'vvip')
  and (nama_mahasiswa is null or nama_mahasiswa = '');