-- =====================================================================
-- public_register_guest_scan()
-- Companion to register_guest_scan(), but for unauthenticated
-- self-scanning (guest clicks QR link on phone).
--
-- The only difference from register_guest_scan():
--   ✅ No role/authentication check — anyone with the QR token can call it
--   ✅ All timing validation uses database now() — never trusts client clock
--   ✅ Row locking via FOR UPDATE prevents double-registration
--   ✅ Activities are logged without a user_id (since the caller is unknown)
--   ✅ Rate limiting should be applied at the API route layer
-- =====================================================================

create or replace function public.public_register_guest_scan(p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_guest public.guests%rowtype;
  v_event public.events%rowtype;
  v_now timestamptz := now();
  v_event_start timestamptz;
  v_grace_cutoff timestamptz;
  v_event_end timestamptz;
  v_new_status text;
begin
  -- 1. Look up the guest by QR token with row lock.
  select * into v_guest
  from public.guests
  where qr_token = p_qr_token
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'invalid_qr',
      'message', 'QR Code tidak dikenali dalam sistem.'
    );
  end if;

  -- 2. Load the associated event.
  select * into v_event
  from public.events
  where id = v_guest.acara_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error_code', 'event_not_found',
      'message', 'Acara untuk tamu ini tidak ditemukan.'
    );
  end if;

  -- 3. Registration must be open.
  if v_event.status <> 'registrasi_dibuka' then
    return jsonb_build_object(
      'success', false,
      'error_code', 'registration_not_open',
      'message', 'Registrasi untuk acara ini belum dibuka atau sudah ditutup.'
    );
  end if;

  -- 4. Compute time boundaries.
  v_event_start  := (v_event.tanggal_mulai + v_event.jam_mulai) AT TIME ZONE 'Asia/Jakarta';
  v_grace_cutoff := v_event_start + make_interval(mins => v_event.grace_period_minutes);
  v_event_end    := (v_event.tanggal_selesai + v_event.jam_selesai) AT TIME ZONE 'Asia/Jakarta';

  -- 5. Hard cutoff — event has ended.
  if v_now > v_event_end then
    insert into public.activities (action, detail)
    values (
      'scan_rejected_event_ended',
      format('Tamu "%s" dari "%s" mencoba check-in setelah acara "%s" berakhir', v_guest.nama, v_guest.instansi, v_event.nama_acara)
    );
    return jsonb_build_object(
      'success', false,
      'error_code', 'event_ended',
      'message', 'Acara sudah selesai. Tidak dapat melakukan registrasi kehadiran.'
    );
  end if;

  -- 6. Already registered.
  if v_guest.status_kehadiran <> 'tidak_hadir' then
    return jsonb_build_object(
      'success', false,
      'error_code', 'already_registered',
      'message', format('Anda sudah tercatat sebagai %s.', case v_guest.status_kehadiran when 'hadir' then 'Hadir' when 'terlambat' then 'Terlambat' else v_guest.status_kehadiran end),
      'guest', jsonb_build_object(
        'id', v_guest.id,
        'nama', v_guest.nama,
        'status_kehadiran', v_guest.status_kehadiran,
        'waktu_kedatangan', v_guest.waktu_kedatangan
      )
    );
  end if;

  -- 7. On-time vs late.
  if v_now <= v_grace_cutoff then
    v_new_status := 'hadir';
  else
    v_new_status := 'terlambat';
  end if;

  update public.guests
  set
    status_kehadiran = v_new_status,
    waktu_kedatangan = v_now
  where id = v_guest.id;

  insert into public.activities (action, detail)
  values (
    'guest_self_scanned',
    format('Tamu "%s" dari "%s" self check-in %s pukul %s di "%s"',
      case
        when v_guest.kategori_tamu = 'reguler'
          and v_guest.nama_mahasiswa is not null
          and v_guest.nama_mahasiswa <> ''
          and v_guest.nama_mahasiswa <> '-'
        then v_guest.nama_mahasiswa
        else v_guest.nama
      end,
      v_guest.instansi,
      case when v_new_status = 'terlambat' then 'terlambat' else 'tepat waktu' end,
      to_char(v_now AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'),
      v_event.nama_acara)
  );

  return jsonb_build_object(
    'success', true,
    'status_kehadiran', v_new_status,
    'guest', jsonb_build_object(
      'id', v_guest.id,
      'nama', v_guest.nama,
      'instansi', v_guest.instansi,
      'kategori_tamu', v_guest.kategori_tamu,
      'status_kehadiran', v_new_status,
      'waktu_kedatangan', v_now
    )
  );
end;
$$;

-- Grant execute to public so unauthenticated guests can self-scan.
-- All validation is done server-side regardless of the caller's auth state.
grant execute on function public.public_register_guest_scan(text) to public;

notify pgrst, 'reload schema';
