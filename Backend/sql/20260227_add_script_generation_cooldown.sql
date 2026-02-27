-- Bigkas: Script Generation Cooldown Tracking
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_script_generated_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.last_script_generated_at
  IS 'Timestamp of last AI script generation request. Used for 60-second cooldown enforcement.';

CREATE INDEX IF NOT EXISTS idx_profiles_last_script_generated
  ON public.profiles (last_script_generated_at);
