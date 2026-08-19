-- =====================================================================
-- Buku Tamu Digital — Event Period Backfill
-- Assigns legacy events (created BEFORE the period migration) to active
-- periods so they reappear on the Dashboard "Acara Terbaru" preview.
--
-- Why:
--   events.periode_id = NULL means "legacy / outside any period", so those
--   events are hidden from the Dashboard preview (but stay fully available
--   in "Kelola Acara"). If only a few new events were created after the
--   migration, the preview shows only those — e.g. just 1 card.
--
-- Behavior (deterministic, matches POST /api/events auto-fill):
--   - Legacy events (periode_id IS NULL) are grouped by created_at DESC.
--   - They fill the latest existing period while it has < 4 events;
--     otherwise a new period is started.
--
-- Idempotent & non-destructive: only touches rows with periode_id IS NULL.
-- Run AFTER supabase/event_period_migration.sql (or after it, any time).
-- =====================================================================

do $$
declare
  p_id bigint;
  cnt int;
  rec record;
begin
  -- Reuse the latest existing period if any (so post-migration events and
  -- backfilled legacy events stay in the same active batch when possible).
  select id into p_id
  from public.periodes
  order by created_at desc
  limit 1;

  for rec in
    select id
    from public.events
    where periode_id is null
    order by created_at desc
  loop
    if p_id is null then
      insert into public.periodes default values returning id into p_id;
    else
      select count(*) into cnt
      from public.events
      where periode_id = p_id;

      if cnt >= 4 then
        insert into public.periodes default values returning id into p_id;
      end if;
    end if;

    update public.events
    set periode_id = p_id
    where id = rec.id;
  end loop;
end $$;
