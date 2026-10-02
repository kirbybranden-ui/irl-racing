-- Run AFTER deploying brl-media and adding the matching Edge Function secret.
-- Enable pg_cron, pg_net and Vault in Supabase before running this file.
-- Replace this ONE placeholder with the SAME random secret used for BRL_AI_WORKER_SECRET.
DO $$
DECLARE value text := 'REPLACE_WITH_YOUR_RANDOM_WORKER_SECRET'; existing uuid;
BEGIN
 IF value='REPLACE_WITH_YOUR_RANDOM_WORKER_SECRET' OR length(value)<32 THEN
  RAISE EXCEPTION 'Replace the worker secret placeholder with at least 32 random characters.';
 END IF;
 SELECT id INTO existing FROM vault.secrets WHERE name='brl_ai_worker_secret' LIMIT 1;
 IF existing IS NULL THEN PERFORM vault.create_secret(value,'brl_ai_worker_secret','BRL AI worker authentication');
 ELSE PERFORM vault.update_secret(existing,value,'brl_ai_worker_secret','BRL AI worker authentication'); END IF;
END $$;
SELECT cron.schedule('brl-ai-media-every-5-minutes','*/5 * * * *',
$job$
 SELECT net.http_post(
  url := 'https://vistghrmmlnkfpcxjcwm.supabase.co/functions/v1/brl-media',
  headers := jsonb_build_object('Content-Type','application/json','x-brl-worker',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='brl_ai_worker_secret' LIMIT 1)),
  body := '{"action":"worker"}'::jsonb,
  timeout_milliseconds := 110000
 ) WHERE EXISTS(SELECT 1 FROM public.brl_ai_settings WHERE id AND enabled);
$job$);
-- Pausing in Admin > PR > AI Media stops scheduled requests and publication.
