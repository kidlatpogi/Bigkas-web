-- Bigkas: Token-based script generation system
-- Safe to run multiple times.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS generation_tokens integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS regeneration_tokens integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS last_generated_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS token_reset_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.generation_tokens
  IS 'Daily token allowance for new script generations.';

COMMENT ON COLUMN public.profiles.regeneration_tokens
  IS 'Daily token allowance for regenerate actions.';

COMMENT ON COLUMN public.profiles.last_generated_at
  IS 'Timestamp of latest successful generation/regeneration for 60-second cooldown.';

COMMENT ON COLUMN public.profiles.token_reset_at
  IS 'Timestamp when daily tokens were last reset.';

CREATE INDEX IF NOT EXISTS idx_profiles_last_generated_at
  ON public.profiles (last_generated_at);
