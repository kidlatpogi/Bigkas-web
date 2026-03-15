-- Add audio_url column used by web client session persistence flow.
--
-- Storage requirement:
-- 1) Create Supabase Storage bucket named "session-recordings".
-- 2) Allow authenticated users to upload/read their own files.
-- 3) Web app uploads to path pattern: <user_id>/<kind>/<timestamp>-<random>.<ext>
--
-- This migration is idempotent and safe to re-run.

alter table public.sessions
  add column if not exists audio_url text;

comment on column public.sessions.audio_url is
  'Public URL to uploaded session audio file in Supabase Storage bucket session-recordings.';
