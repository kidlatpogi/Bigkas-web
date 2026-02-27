-- Bigkas: Exponential Login Backoff columns for profiles
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lockout_until timestamptz NULL;

COMMENT ON COLUMN public.profiles.failed_login_attempts
  IS 'Consecutive failed password login attempts tracked by backend auth route.';

COMMENT ON COLUMN public.profiles.lockout_until
  IS 'If set to a future timestamp, login attempts are blocked until this time.';

CREATE INDEX IF NOT EXISTS idx_profiles_lockout_until
  ON public.profiles (lockout_until);