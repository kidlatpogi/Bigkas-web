-- Persist video recording URL for cross-platform session replay.
--
-- This allows Analysis Result pages (web/android) to replay past session videos,
-- not just the currently completed in-memory recording.

alter table public.sessions
  add column if not exists video_url text;

comment on column public.sessions.video_url is
  'Public URL to uploaded session video file in Supabase Storage bucket session-recordings.';
