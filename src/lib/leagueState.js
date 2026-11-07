-- BRL performance: non-destructive lookup indexes for account and ownership checks.
-- These do not bypass any security policy or alter any account/financial data.
-- Run in Supabase SQL Editor once. Existing equivalent constraints/indexes are preserved.

CREATE INDEX IF NOT EXISTS brl_perf_owner_assignment_driver
  ON public.team_owner_assignments (owner_driver_id) WHERE owner_driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS brl_perf_manufacturer_reps_user
  ON public.brl_manufacturer_reps (user_id);

CREATE INDEX IF NOT EXISTS brl_perf_accounts_active_identity
  ON public.brl_accounts (auth_user_id) WHERE active = true;

CREATE INDEX IF NOT EXISTS brl_perf_career_teams_owner_active
  ON public.brl_career_teams (owner_user, season_id, code)
  WHERE status = 'approved';

ANALYZE public.team_owner_assignments;
ANALYZE public.brl_manufacturer_reps;
ANALYZE public.brl_accounts;
ANALYZE public.brl_career_teams;

-- Show confirmation without exposing member data.
SELECT indexname FROM pg_indexes
WHERE schemaname='public' AND indexname LIKE 'brl_perf_%'
ORDER BY indexname;
