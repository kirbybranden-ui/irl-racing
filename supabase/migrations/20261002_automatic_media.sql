BEGIN;
-- Add automatic assignments and public strategy coverage without deleting interviews.
ALTER TABLE public.brl_ai_jobs DROP CONSTRAINT IF EXISTS brl_ai_jobs_kind_check;
ALTER TABLE public.brl_ai_jobs ADD CONSTRAINT brl_ai_jobs_kind_check CHECK(kind IN ('recap','preview','interview','opening','strategy'));

CREATE OR REPLACE FUNCTION public.brl_ai_assign_interviews() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb; season jsonb; t jsonb; race jsonb; d jsonb; s public.brl_ai_sessions;
 day date:=(now() AT TIME ZONE 'America/Chicago')::date; count_assigned integer:=0; n integer; event_kind text;
 reporters text[]:=ARRAY['pit','driver','story','grid','straight','champion','banter','fan','josh','trevor','snider','burns','harvick'];
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.brl_ai_settings WHERE id AND enabled) THEN RETURN 0; END IF;
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league';
 SELECT value INTO season FROM jsonb_array_elements(coalesce(state->'seasons','[]')) WHERE value->>'id'=state->>'activeSeasonId';
 IF season IS NULL THEN RETURN 0; END IF;
 FOR t IN SELECT value FROM jsonb_array_elements(coalesce(state->'tracks','[]')) WHERE value->>'date' ~ '^\d{4}-\d{2}-\d{2}$' LOOP
  IF (t->>'date')::date < day-7 OR (t->>'date')::date > day+7 THEN CONTINUE; END IF;
  SELECT value INTO race FROM jsonb_array_elements(coalesce(season->'raceHistory','[]'))
   WHERE value->>'raceName'=t->>'name' AND lower(coalesce(value->>'status','')) NOT IN ('pending','draft','rejected')
    AND jsonb_array_length(coalesce(value->'results','[]'))>0 LIMIT 1;
  IF race IS NOT NULL THEN event_kind:='post';
  ELSIF (t->>'date')::date>=day THEN event_kind:='pre'; ELSE CONTINUE; END IF;
  IF event_kind='pre' THEN
   INSERT INTO public.brl_ai_jobs(source_key,season_id,race_name,kind)
   VALUES('strategy:'||(season->>'id')||':'||(t->>'name')||':'||(t->>'date'),season->>'id',t->>'name','strategy') ON CONFLICT DO NOTHING;
  END IF;
  FOR d IN SELECT value FROM jsonb_array_elements(coalesce(season->'drivers','[]'))
   WHERE coalesce(value->>'retired','false')<>'true' AND coalesce(value->>'id','')<>'' LOOP
   IF event_kind='post' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(race->'results') r WHERE r->>'driverId'=d->>'id') THEN CONTINUE; END IF;
   INSERT INTO public.brl_ai_sessions(season_id,driver_id,driver_name,race_name,kind,persona)
   VALUES(season->>'id',d->>'id',coalesce(d->>'name','Driver'),t->>'name',event_kind,
    reporters[1+((hashtextextended((season->>'id')||':'||(t->>'name')||':'||event_kind||':'||(d->>'id'),0)&2147483647)%array_length(reporters,1))::integer])
   ON CONFLICT(season_id,driver_id,race_name,kind) DO NOTHING;
   GET DIAGNOSTICS n=ROW_COUNT; count_assigned:=count_assigned+n;
   SELECT * INTO s FROM public.brl_ai_sessions WHERE season_id=season->>'id' AND driver_id=d->>'id' AND race_name=t->>'name' AND kind=event_kind;
   IF s.status='active' AND jsonb_array_length(s.messages)=0 THEN
    INSERT INTO public.brl_ai_jobs(source_key,season_id,race_name,kind,session_id)
    VALUES('opening:'||s.id::text,s.season_id,s.race_name,'opening',s.id) ON CONFLICT DO NOTHING;
   END IF;
  END LOOP;
 END LOOP;
 RETURN count_assigned;
END; $$;
REVOKE ALL ON FUNCTION public.brl_ai_assign_interviews() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brl_ai_assign_interviews() TO service_role;

CREATE OR REPLACE FUNCTION public.brl_ai_league_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.data->'tracks' IS DISTINCT FROM OLD.data->'tracks' OR NEW.data->'seasons' IS DISTINCT FROM OLD.data->'seasons' OR NEW.data->>'activeSeasonId' IS DISTINCT FROM OLD.data->>'activeSeasonId' THEN
  PERFORM public.brl_ai_queue_calendar(false);
  PERFORM public.brl_ai_assign_interviews();
 END IF;
 RETURN NEW;
END; $$;
-- $20 calendar-month allowance. Reserve before sending a paid API request.
ALTER TABLE public.brl_ai_settings ADD COLUMN IF NOT EXISTS monthly_budget_usd numeric NOT NULL DEFAULT 20 CHECK(monthly_budget_usd BETWEEN 0 AND 20);
CREATE TABLE IF NOT EXISTS public.brl_ai_monthly_usage (
 month date PRIMARY KEY, reserved_micro_usd bigint NOT NULL DEFAULT 0 CHECK(reserved_micro_usd>=0), paid_requests integer NOT NULL DEFAULT 0
);
ALTER TABLE public.brl_ai_monthly_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.brl_ai_monthly_usage FROM anon,authenticated;
GRANT SELECT ON public.brl_ai_monthly_usage TO authenticated;
GRANT ALL ON public.brl_ai_monthly_usage TO service_role;
DROP POLICY IF EXISTS ai_monthly_admin ON public.brl_ai_monthly_usage;
CREATE POLICY ai_monthly_admin ON public.brl_ai_monthly_usage FOR SELECT TO authenticated USING(public.brl_full_admin());
CREATE OR REPLACE FUNCTION public.brl_ai_reserve_monthly(cost_micro_usd bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE cap bigint; spent bigint; period date:=date_trunc('month',now() AT TIME ZONE 'America/Chicago')::date;
BEGIN
 IF cost_micro_usd<=0 OR cost_micro_usd>20000000 THEN RAISE EXCEPTION 'Invalid request allowance.'; END IF;
 SELECT floor(monthly_budget_usd*1000000)::bigint INTO cap FROM public.brl_ai_settings WHERE id AND enabled;
 IF cap IS NULL OR cost_micro_usd>cap THEN RETURN false; END IF;
 INSERT INTO public.brl_ai_monthly_usage(month) VALUES(period) ON CONFLICT DO NOTHING;
 UPDATE public.brl_ai_monthly_usage SET reserved_micro_usd=reserved_micro_usd+cost_micro_usd,paid_requests=paid_requests+1
 WHERE month=period AND reserved_micro_usd+cost_micro_usd<=cap RETURNING reserved_micro_usd INTO spent;
 RETURN spent IS NOT NULL;
END; $$;
REVOKE ALL ON FUNCTION public.brl_ai_reserve_monthly(bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brl_ai_reserve_monthly(bigint) TO service_role;

CREATE OR REPLACE FUNCTION public.brl_ai_record_completion(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions;
BEGIN
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target;
 IF s.status='completed' AND s.kind<>'strategy' THEN
  INSERT INTO public.interviews(ai_session_id,driver_id,driver_name,driver_number,race_name,type,series,questions_and_answers,answered,generated_at,status,completed,bonus_amount,team)
  SELECT s.id, CASE WHEN s.driver_id ~ '^\d+$' THEN s.driver_id::bigint ELSE NULL END,s.driver_name,CASE WHEN trim(a.driver_number::text) ~ '^[0-9]{1,3}$' THEN trim(a.driver_number::text)::integer ELSE NULL END,s.race_name,s.kind,'cup',
   (SELECT coalesce(jsonb_agg(jsonb_build_object('question',q.value->>'text','answer',s.messages->(q.ordinality::integer)->>'text')),'[]')
    FROM jsonb_array_elements(s.messages) WITH ORDINALITY q(value,ordinality)
    WHERE q.value->>'role'='assistant' AND s.messages->(q.ordinality::integer)->>'role'='user'),
   true,now(),'completed',true,0,(SELECT d->>'team' FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'id'=s.driver_id LIMIT 1)
  FROM public.brl_accounts a WHERE a.driver_id=s.driver_id
  ON CONFLICT(ai_session_id) DO NOTHING;
  INSERT INTO public.brl_ai_jobs(source_key,season_id,race_name,kind,session_id)
  VALUES('interview:'||s.id,s.season_id,s.race_name,'interview',s.id) ON CONFLICT DO NOTHING;
 END IF;
END; $$;


-- Queue current race-week assignments immediately; the existing worker handles them.
SELECT public.brl_ai_assign_interviews();
COMMIT;
