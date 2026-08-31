-- =====================================================================
-- Idempotency Keys + Atomic CRUD RPC Functions
-- Prevents duplicate requests, duplicate activity logs.
-- Run AFTER migration.sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. IDEMPOTENCY KEYS TABLE
-- ---------------------------------------------------------------------
create table if not exists public.idempotency_keys (
  key        text primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  response   jsonb,
  status     text not null default 'processing'
               check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

alter table public.idempotency_keys enable row level security;

-- Users can only access their own keys (authenticated via RLS)
drop policy if exists "Users manage own idempotency keys" on public.idempotency_keys;
create policy "Users manage own idempotency keys"
  on public.idempotency_keys for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Index for cleanup
create index if not exists idx_idempotency_keys_expires
  on public.idempotency_keys(expires_at);

-- ---------------------------------------------------------------------
-- 2. GUEST CRUD — idempotent
-- ---------------------------------------------------------------------
create or replace function public.idempotent_guest(
  p_key       text,
  p_user_id   uuid,
  p_operation text,   -- 'create', 'update', 'delete'
  p_data      jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result      jsonb;
  v_guest_name  text;
  v_key_status  text;
  v_response    jsonb;
  v_is_new      boolean;
begin
  -- 1. Claim idempotency key
  -- Use ON CONFLICT DO UPDATE (no-op) so RETURNING xmax tells us
  -- whether this was a fresh INSERT (xmax=0) or a conflict UPDATE.
  insert into public.idempotency_keys (key, user_id, status)
  values (p_key, p_user_id, 'processing')
  on conflict (key) do update set key = excluded.key
  returning (xmax = 0) into v_is_new;

  -- If we did NOT insert a new row, check existing status
  if not v_is_new then
    select status, response into v_key_status, v_response
    from public.idempotency_keys where key = p_key;

    -- Already completed → return stored response (idempotent replay)
    if v_key_status = 'completed' then
      return v_response;
    end if;

    -- Still processing by another concurrent request → error
    if v_key_status = 'processing' then
      if exists (
        select 1 from public.idempotency_keys
        where key = p_key
          and status = 'processing'
          and created_at < now() - interval '5 minutes'
      ) then
        update public.idempotency_keys set status = 'failed' where key = p_key;
        update public.idempotency_keys set status = 'processing', user_id = p_user_id where key = p_key;
      else
        raise exception 'REQUEST_IN_PROGRESS';
      end if;
    end if;
  end if;

  -- 2. Perform CRUD operation
  case p_operation
    when 'create' then
      insert into public.guests (
        nama, instansi, no_hp, tujuan, nama_mahasiswa, alamat,
        kategori_tamu, status_kehadiran, acara_id, qr_token
      ) values (
        p_data->>'nama',
        nullif(p_data->>'instansi', ''),
        nullif(p_data->>'no_hp', ''),
        nullif(p_data->>'tujuan', ''),
        p_data->>'nama_mahasiswa',
        p_data->>'alamat',
        coalesce(p_data->>'kategori_tamu', 'reguler'),
        'tidak_hadir',
        (p_data->>'acara_id')::bigint,
        p_data->>'qr_token'
      )
      returning to_jsonb(guests.*) into v_result;

      insert into public.activities (action, detail, user_id)
      values (
        'create_guest',
        'Menambah tamu "' || coalesce(
          case
            when coalesce(p_data->>'kategori_tamu', 'reguler') = 'reguler'
              and p_data->>'nama_mahasiswa' is not null
              and p_data->>'nama_mahasiswa' <> ''
              and p_data->>'nama_mahasiswa' <> '-'
            then p_data->>'nama_mahasiswa'
            else p_data->>'nama'
          end, ''
        ) || '"',
        p_user_id
      );

    when 'update' then
      update public.guests set
        nama           = coalesce(p_data->>'nama', nama),
        instansi       = coalesce(p_data->>'instansi', instansi),
        no_hp          = case when p_data ? 'no_hp' then nullif(p_data->>'no_hp', '') else no_hp end,
        tujuan         = case when p_data ? 'tujuan' then nullif(p_data->>'tujuan', '') else tujuan end,
        nama_mahasiswa = coalesce(p_data->>'nama_mahasiswa', nama_mahasiswa),
        alamat         = coalesce(p_data->>'alamat', alamat),
        kategori_tamu  = coalesce(p_data->>'kategori_tamu', kategori_tamu),
        acara_id       = coalesce((p_data->>'acara_id')::bigint, acara_id)
      where id = (p_data->>'id')::bigint
      returning to_jsonb(guests.*) into v_result;

      insert into public.activities (action, detail, user_id)
      values (
        'update_guest',
        'Mengedit tamu "' || coalesce(
          case
            when coalesce((v_result->>'kategori_tamu')::text, 'reguler') = 'reguler'
              and (v_result->>'nama_mahasiswa')::text is not null
              and (v_result->>'nama_mahasiswa')::text <> ''
              and (v_result->>'nama_mahasiswa')::text <> '-'
            then (v_result->>'nama_mahasiswa')::text
            else (v_result->>'nama')::text
          end, ''
        ) || '"',
        p_user_id
      );

    when 'delete' then
      -- Get name before delete (prefer nama_mahasiswa for regular guests)
      select
        case
          when kategori_tamu = 'reguler'
            and nama_mahasiswa is not null
            and nama_mahasiswa <> ''
            and nama_mahasiswa <> '-'
          then nama_mahasiswa
          else nama
        end into v_guest_name
      from public.guests where id = (p_data->>'id')::bigint;

      delete from public.guests where id = (p_data->>'id')::bigint;

      insert into public.activities (action, detail, user_id)
      values (
        'delete_guest',
        'Menghapus tamu "' || coalesce(v_guest_name, '') || '"',
        p_user_id
      );

      v_result := jsonb_build_object('success', true);
    else
      raise exception 'Unknown guest operation: %', p_operation;
  end case;

  -- 3. Complete idempotency key (same transaction)
  update public.idempotency_keys
  set status = 'completed', response = v_result
  where key = p_key;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. EVENT CRUD — idempotent
-- ---------------------------------------------------------------------
create or replace function public.idempotent_event(
  p_key       text,
  p_user_id   uuid,
  p_operation text,   -- 'create', 'update', 'delete', 'update_status'
  p_data      jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result     jsonb;
  v_event_name text;
  v_key_status text;
  v_response   jsonb;
  v_is_new     boolean;
begin
  -- 1. Claim idempotency key
  insert into public.idempotency_keys (key, user_id, status)
  values (p_key, p_user_id, 'processing')
  on conflict (key) do update set key = excluded.key
  returning (xmax = 0) into v_is_new;

  if not v_is_new then
    select status, response into v_key_status, v_response
    from public.idempotency_keys where key = p_key;

    if v_key_status = 'completed' then
      return v_response;
    end if;

    if v_key_status = 'processing' then
      if exists (
        select 1 from public.idempotency_keys
        where key = p_key and status = 'processing'
          and created_at < now() - interval '5 minutes'
      ) then
        update public.idempotency_keys set status = 'failed' where key = p_key;
        update public.idempotency_keys set status = 'processing', user_id = p_user_id where key = p_key;
      else
        raise exception 'REQUEST_IN_PROGRESS';
      end if;
    end if;
  end if;

  -- 2. Perform operation
  case p_operation
    when 'create' then
      insert into public.events (
        nama_acara, slug, lokasi, tanggal_mulai, tanggal_selesai,
        jam_mulai, jam_selesai, grace_period_minutes, status, created_by
      ) values (
        p_data->>'nama_acara',
        p_data->>'slug',
        p_data->>'lokasi',
        (p_data->>'tanggal_mulai')::date,
        coalesce((p_data->>'tanggal_selesai')::date, (p_data->>'tanggal_mulai')::date),
        (p_data->>'jam_mulai')::time,
        coalesce((p_data->>'jam_selesai')::time, '17:00'),
        coalesce((p_data->>'grace_period_minutes')::int, 30),
        coalesce(p_data->>'status', 'akan_datang'),
        p_user_id
      )
      returning to_jsonb(events.*) into v_result;

      insert into public.activities (action, detail, user_id)
      values (
        'create_event',
        'Membuat acara "' || coalesce(p_data->>'nama_acara', '') || '"',
        p_user_id
      );

    when 'update' then
      update public.events set
        nama_acara           = coalesce(p_data->>'nama_acara', nama_acara),
        slug                 = coalesce(p_data->>'slug', slug),
        lokasi               = coalesce(p_data->>'lokasi', lokasi),
        tanggal_mulai        = coalesce((p_data->>'tanggal_mulai')::date, tanggal_mulai),
        tanggal_selesai      = coalesce((p_data->>'tanggal_selesai')::date, tanggal_selesai),
        jam_mulai            = coalesce((p_data->>'jam_mulai')::time, jam_mulai),
        jam_selesai          = coalesce((p_data->>'jam_selesai')::time, jam_selesai),
        grace_period_minutes = coalesce((p_data->>'grace_period_minutes')::int, grace_period_minutes)
      where id = (p_data->>'id')::bigint
      returning to_jsonb(events.*) into v_result;

      insert into public.activities (action, detail, user_id)
      values (
        'update_event',
        'Mengedit acara "' || coalesce((v_result->>'nama_acara')::text, '') || '"',
        p_user_id
      );

    when 'update_status' then
      update public.events set
        status = p_data->>'status'
      where id = (p_data->>'id')::bigint
      returning to_jsonb(events.*) into v_result;

      insert into public.activities (action, detail, user_id)
      values (
        'update_status',
        'Mengubah status "' || coalesce((v_result->>'nama_acara')::text, '')
          || '" menjadi "' || coalesce(p_data->>'status', '') || '"',
        p_user_id
      );

    when 'delete' then
      select nama_acara into v_event_name
      from public.events where id = (p_data->>'id')::bigint;

      delete from public.events where id = (p_data->>'id')::bigint;

      insert into public.activities (action, detail, user_id)
      values (
        'delete_event',
        'Menghapus acara "' || coalesce(v_event_name, '') || '"',
        p_user_id
      );

      v_result := jsonb_build_object('success', true);
    else
      raise exception 'Unknown event operation: %', p_operation;
  end case;

  -- 3. Complete idempotency key
  update public.idempotency_keys
  set status = 'completed', response = v_result
  where key = p_key;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 4. GUEST BULK DELETE — idempotent
-- ---------------------------------------------------------------------
create or replace function public.idempotent_guest_bulk_delete(
  p_key      text,
  p_user_id  uuid,
  p_acara_id bigint  -- null = delete all
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result    jsonb;
  v_key_status text;
  v_response  jsonb;
  v_detail    text;
  v_is_new    boolean;
begin
  insert into public.idempotency_keys (key, user_id, status)
  values (p_key, p_user_id, 'processing')
  on conflict (key) do update set key = excluded.key
  returning (xmax = 0) into v_is_new;

  if not v_is_new then
    select status, response into v_key_status, v_response
    from public.idempotency_keys where key = p_key;

    if v_key_status = 'completed' then return v_response; end if;

    if v_key_status = 'processing' then
      if exists (
        select 1 from public.idempotency_keys
        where key = p_key and status = 'processing'
          and created_at < now() - interval '5 minutes'
      ) then
        update public.idempotency_keys set status = 'failed' where key = p_key;
        update public.idempotency_keys set status = 'processing', user_id = p_user_id where key = p_key;
      else
        raise exception 'REQUEST_IN_PROGRESS';
      end if;
    end if;
  end if;

  -- Perform bulk delete
  if p_acara_id is not null then
    delete from public.guests where acara_id = p_acara_id;
    v_detail := 'Menghapus semua tamu di acara';
  else
    delete from public.guests where true;
    v_detail := 'Menghapus semua tamu';
  end if;

  insert into public.activities (action, detail, user_id)
  values ('delete_guest', v_detail, p_user_id);

  v_result := jsonb_build_object('success', true);

  update public.idempotency_keys
  set status = 'completed', response = v_result
  where key = p_key;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 5. GUEST IMPORT — idempotent
-- ---------------------------------------------------------------------
create or replace function public.idempotent_guest_import(
  p_key     text,
  p_user_id uuid,
  p_guests  jsonb,   -- array of guest objects
  p_count   int,     -- number of inserted guests
  p_skipped int      -- number of skipped duplicates
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result    jsonb;
  v_key_status text;
  v_response  jsonb;
  v_is_new    boolean;
begin
  insert into public.idempotency_keys (key, user_id, status)
  values (p_key, p_user_id, 'processing')
  on conflict (key) do update set key = excluded.key
  returning (xmax = 0) into v_is_new;

  if not v_is_new then
    select status, response into v_key_status, v_response
    from public.idempotency_keys where key = p_key;

    if v_key_status = 'completed' then return v_response; end if;

    if v_key_status = 'processing' then
      if exists (
        select 1 from public.idempotency_keys
        where key = p_key and status = 'processing'
          and created_at < now() - interval '5 minutes'
      ) then
        update public.idempotency_keys set status = 'failed' where key = p_key;
        update public.idempotency_keys set status = 'processing', user_id = p_user_id where key = p_key;
      else
        raise exception 'REQUEST_IN_PROGRESS';
      end if;
    end if;
  end if;

  -- Note: actual insert is done by the API route using Supabase JS client
  -- because import logic (dedup, normalization) is complex.
  -- This function only handles activity + key completion.

  insert into public.activities (action, detail, user_id)
  values (
    'import_guest',
    'Mengimpor ' || p_count || ' tamu dari CSV'
      || case when p_skipped > 0 then ' (' || p_skipped || ' duplikat dilewati)' else '' end,
    p_user_id
  );

  v_result := jsonb_build_object('count', p_count, 'skipped', p_skipped);

  update public.idempotency_keys
  set status = 'completed', response = v_result
  where key = p_key;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. GUEST RESET ATTENDANCE — idempotent
-- ---------------------------------------------------------------------
create or replace function public.idempotent_guest_reset(
  p_key      text,
  p_user_id  uuid,
  p_guest_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result    jsonb;
  v_guest     record;
  v_key_status text;
  v_response  jsonb;
  v_is_new    boolean;
begin
  insert into public.idempotency_keys (key, user_id, status)
  values (p_key, p_user_id, 'processing')
  on conflict (key) do update set key = excluded.key
  returning (xmax = 0) into v_is_new;

  if not v_is_new then
    select status, response into v_key_status, v_response
    from public.idempotency_keys where key = p_key;

    if v_key_status = 'completed' then return v_response; end if;

    if v_key_status = 'processing' then
      if exists (
        select 1 from public.idempotency_keys
        where key = p_key and status = 'processing'
          and created_at < now() - interval '5 minutes'
      ) then
        update public.idempotency_keys set status = 'failed' where key = p_key;
        update public.idempotency_keys set status = 'processing', user_id = p_user_id where key = p_key;
      else
        raise exception 'REQUEST_IN_PROGRESS';
      end if;
    end if;
  end if;

  -- Get current guest
  select id, nama, status_kehadiran, kategori_tamu, nama_mahasiswa into v_guest
  from public.guests where id = p_guest_id;

  if not found then
    raise exception 'GUEST_NOT_FOUND';
  end if;

  if v_guest.status_kehadiran = 'tidak_hadir' then
    raise exception 'ALREADY_NOT_PRESENT';
  end if;

  -- Reset attendance
  update public.guests set
    status_kehadiran = 'tidak_hadir',
    waktu_kedatangan = null,
    scanned_by       = null
  where id = p_guest_id
  returning to_jsonb(guests.*) into v_result;

  insert into public.activities (action, detail, user_id)
  values (
    'update_guest',
    'Koreksi status kehadiran tamu "' || coalesce(
      case
        when v_guest.kategori_tamu = 'reguler'
          and v_guest.nama_mahasiswa is not null
          and v_guest.nama_mahasiswa <> ''
          and v_guest.nama_mahasiswa <> '-'
        then v_guest.nama_mahasiswa
        else v_guest.nama
      end, v_guest.nama
    ) || '" menjadi tidak hadir',
    p_user_id
  );

  update public.idempotency_keys
  set status = 'completed', response = v_result
  where key = p_key;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------
-- 7. CLEANUP: delete expired keys (run periodically)
-- ---------------------------------------------------------------------
create or replace function public.cleanup_idempotency_keys()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.idempotency_keys
  where expires_at < now();
$$;

-- ---------------------------------------------------------------------
-- 8. GRANT EXECUTE permissions
-- ---------------------------------------------------------------------
grant execute on function public.idempotent_guest(text, uuid, text, jsonb) to authenticated;
grant execute on function public.idempotent_event(text, uuid, text, jsonb) to authenticated;
grant execute on function public.idempotent_guest_bulk_delete(text, uuid, bigint) to authenticated;
grant execute on function public.idempotent_guest_import(text, uuid, jsonb, int, int) to authenticated;
grant execute on function public.idempotent_guest_reset(text, uuid, bigint) to authenticated;
grant execute on function public.cleanup_idempotency_keys() to service_role;

-- Add to realtime publication (optional, for monitoring)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'idempotency_keys'
  ) then
    execute 'alter publication supabase_realtime add table public.idempotency_keys';
  end if;
end $$;

notify pgrst, 'reload schema';
