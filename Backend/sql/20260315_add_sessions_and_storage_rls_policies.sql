-- Fix RLS failures when saving session rows and uploading recordings.
--
-- Why this exists:
-- - Web and Android save sessions in public.sessions and media in storage bucket session-recordings.
-- - Without matching RLS policies, Supabase returns:
--   "new row violates row-level security policy" (often HTTP 400 from Storage API).
--
-- This migration is idempotent and safe to re-run.

-- Ensure target bucket exists.
insert into storage.buckets (id, name, public)
values ('session-recordings', 'session-recordings', true)
on conflict (id) do nothing;

-- Sessions table policies (user can only read/write own rows).
alter table public.sessions enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'sessions_select_own'
  ) then
    create policy sessions_select_own
      on public.sessions
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'sessions_insert_own'
  ) then
    create policy sessions_insert_own
      on public.sessions
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'sessions_update_own'
  ) then
    create policy sessions_update_own
      on public.sessions
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'sessions'
      and policyname = 'sessions_delete_own'
  ) then
    create policy sessions_delete_own
      on public.sessions
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end $$;

-- Storage policies for session-recordings bucket.
-- Path convention enforced by app: <user_id>/<kind>/<timestamp>-<random>.<ext>

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'session_recordings_insert_own'
  ) then
    create policy session_recordings_insert_own
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'session-recordings'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'session_recordings_select_own'
  ) then
    create policy session_recordings_select_own
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'session-recordings'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'session_recordings_update_own'
  ) then
    create policy session_recordings_update_own
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'session-recordings'
        and auth.uid()::text = (storage.foldername(name))[1]
      )
      with check (
        bucket_id = 'session-recordings'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'session_recordings_delete_own'
  ) then
    create policy session_recordings_delete_own
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'session-recordings'
        and auth.uid()::text = (storage.foldername(name))[1]
      );
  end if;
end $$;
