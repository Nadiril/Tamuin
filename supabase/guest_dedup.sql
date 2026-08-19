-- =====================================================================
-- CEGAH DUPLIKAT TAMU
-- Satu orang (berdasarkan no_hp / email) hanya boleh terdaftar
-- sekali dalam satu acara (acara_id).
-- =====================================================================

-- 1. Pastikan kolom email ada (idempotent; aman jika email_migration.sql sudah dijalankan)
alter table if exists public.guests
  add column if not exists email text;

-- 2. Bersihkan duplikat lama: pertahankan baris terlama (id terkecil)
--    per (acara_id, no_hp) dan per (acara_id, lower(email)).
delete from public.guests g
using (
  select acara_id, no_hp, min(id) as keep_id
  from public.guests
  where no_hp is not null and no_hp <> ''
  group by acara_id, no_hp
  having count(*) > 1
) d
where g.acara_id = d.acara_id
  and g.no_hp = d.no_hp
  and g.id <> d.keep_id;

delete from public.guests g
using (
  select acara_id, lower(email) as em, min(id) as keep_id
  from public.guests
  where email is not null and email <> ''
  group by acara_id, lower(email)
  having count(*) > 1
) d
where g.acara_id = d.acara_id
  and lower(g.email) = d.em
  and g.id <> d.keep_id;

-- 3. Index unik parsial sebagai pengaman utama (mencegah duplikat saat insert bersamaan)
create unique index if not exists uq_guests_acara_no_hp
  on public.guests(acara_id, no_hp)
  where no_hp is not null and no_hp <> '';

create unique index if not exists uq_guests_acara_email
  on public.guests(acara_id, email)
  where email is not null and email <> '';
