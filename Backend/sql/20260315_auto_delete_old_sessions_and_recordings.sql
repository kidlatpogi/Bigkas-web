-- Auto-delete sessions and recordings older than 14 days.
--
-- This keeps Supabase Storage usage under control by removing old media,
-- and deletes matching old session rows from public.sessions.
--
-- Notes:
-- - Uses pg_cron when available. If pg_cron is unavailable on the project plan,
--   keep the function and trigger it manually from SQL editor as needed.
-- - Idempotent and safe to re-run.

do $do$
begin
  create extension if not exists pg_cron;
exception
  when insufficient_privilege then
    raise notice 'No privilege to create pg_cron extension; cleanup can still be run manually.';
end $do$;

create or replace function public.cleanup_old_sessions_and_recordings(retention_days integer default 14)
returns jsonb
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  cutoff timestamptz := now() - make_interval(days => greatest(retention_days, 1));
  deleted_storage_count integer := 0;
  deleted_sessions_count integer := 0;
begin
  -- Delete old storage objects first to avoid stale media files.
  with deleted_objects as (
    delete from storage.objects
    where bucket_id = 'session-recordings'
      and created_at < cutoff
    returning 1
  )
  select count(*) into deleted_storage_count from deleted_objects;

  -- Delete old sessions from DB.
  with deleted_sessions as (
    delete from public.sessions
    where created_at < cutoff
    returning 1
  )
  select count(*) into deleted_sessions_count from deleted_sessions;

  return jsonb_build_object(
    'cutoff', cutoff,
    'deleted_storage_objects', deleted_storage_count,
    'deleted_sessions', deleted_sessions_count
  );
end;
$$;

revoke all on function public.cleanup_old_sessions_and_recordings(integer) from public;
grant execute on function public.cleanup_old_sessions_and_recordings(integer) to service_role;

-- Schedule cleanup daily at 03:15 UTC.
do $do$
begin
  if exists (select 1 from cron.job where jobname = 'cleanup-old-sessions-and-recordings') then
    perform cron.unschedule('cleanup-old-sessions-and-recordings');
  end if;

  perform cron.schedule(
    'cleanup-old-sessions-and-recordings',
    '15 3 * * *',
    $job$select public.cleanup_old_sessions_and_recordings(14);$job$
  );
exception
  when undefined_table then
    -- cron.job can be unavailable on some plans even if extension create is ignored.
    raise notice 'pg_cron metadata table not available; run cleanup_old_sessions_and_recordings manually.';
  when insufficient_privilege then
    raise notice 'No privilege to schedule pg_cron job; run cleanup_old_sessions_and_recordings manually.';
end $do$;
