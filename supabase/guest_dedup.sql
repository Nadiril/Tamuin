-- =====================================================================
-- CEGAH DUPLIKAT TAMU
-- Satu orang (berdasarkan no_hp) hanya boleh terdaftar
-- sekali dalam satu acara (acara_id).
-- =====================================================================

-- 1. Bersihkan duplikat lama: pertahankan baris terlama (id terkecil)
--    per (acara_id, no_hp).
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

-- 2. Index unik parsial sebagai pengaman utama (mencegah duplikat saat insert bersamaan)
create unique index if not exists uq_guests_acara_no_hp
  on public.guests(acara_id, no_hp)
  where no_hp is not null and no_hp <> '';