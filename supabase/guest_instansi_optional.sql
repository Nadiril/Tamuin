-- Make instansi column optional (nullable)
-- Tabel Istansi diubah menjadi opsional (nullable) untuk mengakomodasi tamu yang tidak memiliki instansi terkait.
alter table if exists public.guests
  alter column instansi drop not null;