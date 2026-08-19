-- =====================================================================
-- Buku Tamu Digital — User Approval Migration
-- Adds an account status to public.profiles so that self-registered
-- accounts start as "pending" and must be approved by an admin.
--
-- Run ONCE in the Supabase SQL Editor. Idempotent (safe to re-run).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Add status column.
--    Default 'active' so existing users remain active automatically.
--    Rejected accounts are deleted, so only 'active' and 'pending' exist.
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists status text not null default 'active'
  check (status in ('active', 'pending'));

-- ---------------------------------------------------------------------
-- 2. handle_new_user() — mark SELF-REGISTERED accounts as 'pending'.
--    ADMIN-CREATED accounts (no self_registered metadata) stay 'active',
--    preserving the existing admin user creation flow.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, role, display_name, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'panitia'),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'self_registered' = 'true' then 'pending' else 'active' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 3. Tighten "Users can update own profile" so a user cannot flip their
--    own status/role (e.g. a pending user promoting themselves to active).
-- ---------------------------------------------------------------------
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

notify pgrst, 'reload schema';
