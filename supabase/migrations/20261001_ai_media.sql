BEGIN;
-- User-requested removal of previous interviews. New AI conversations live separately.
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS ai_session_id uuid;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS bonus_amount numeric DEFAULT 0;
ALTER TABLE public.interviews ADD COLUMN IF NOT EXISTS team text;
CREATE UNIQUE INDEX IF NOT EXISTS brl_interviews_ai_session ON public.interviews(ai_session_id);
DELETE FROM public.interviews WHERE ai_session_id IS NULL;
CREATE TABLE IF NOT EXISTS public.brl_ai_settings (
 id boolean PRIMARY KEY DEFAULT true CHECK (id), enabled boolean NOT NULL DEFAULT false,
 max_daily_requests integer NOT NULL DEFAULT 250 CHECK(max_daily_requests BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.brl_ai_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.brl_ai_usage (
 day date PRIMARY KEY, requests integer NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.brl_ai_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), season_id text NOT NULL, driver_id text NOT NULL,
 driver_name text NOT NULL, race_name text NOT NULL, kind text NOT NULL CHECK(kind IN ('pre','post','strategy')),
 persona text NOT NULL, status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed','review','hidden')),
 messages jsonb NOT NULL DEFAULT '[]', version integer NOT NULL DEFAULT 0,
 lease_token uuid, lease_until timestamptz, review_reasons jsonb NOT NULL DEFAULT '[]',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(season_id, driver_id, race_name, kind), CHECK(jsonb_typeof(messages)='array')
);
CREATE TABLE IF NOT EXISTS public.brl_ai_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_key text NOT NULL UNIQUE,
 season_id text NOT NULL, race_name text NOT NULL, kind text NOT NULL CHECK(kind IN ('recap','preview','interview')),
 session_id uuid REFERENCES public.brl_ai_sessions(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','done','failed','cancelled')),
 attempts integer NOT NULL DEFAULT 0, lease_token uuid, lease_until timestamptz,
 error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.brl_ai_articles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL UNIQUE REFERENCES public.brl_ai_jobs(id),
 season_id text NOT NULL, race_name text NOT NULL, category text NOT NULL, title text NOT NULL,
 content text NOT NULL, byline text NOT NULL, image_url text, quotes jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL CHECK(status IN ('published','review','hidden')),
 review_reasons jsonb NOT NULL DEFAULT '[]', source_snapshot jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brl_ai_jobs_pending ON public.brl_ai_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS brl_ai_sessions_driver ON public.brl_ai_sessions(driver_id, season_id);
CREATE INDEX IF NOT EXISTS brl_ai_articles_feed ON public.brl_ai_articles(status, created_at DESC);

ALTER TABLE public.brl_ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_ai_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_ai_articles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.brl_ai_settings, public.brl_ai_usage, public.brl_ai_sessions, public.brl_ai_jobs, public.brl_ai_articles FROM anon, authenticated;
GRANT SELECT ON public.brl_ai_settings, public.brl_ai_articles, public.brl_ai_sessions TO anon, authenticated;
GRANT SELECT ON public.brl_ai_jobs, public.brl_ai_usage TO authenticated;
GRANT UPDATE ON public.brl_ai_settings, public.brl_ai_articles, public.brl_ai_sessions TO authenticated;
GRANT ALL ON public.brl_ai_settings, public.brl_ai_usage, public.brl_ai_sessions, public.brl_ai_jobs, public.brl_ai_articles TO service_role;
DROP POLICY IF EXISTS ai_settings_read ON public.brl_ai_settings;
CREATE POLICY ai_settings_read ON public.brl_ai_settings FOR SELECT USING(true);
DROP POLICY IF EXISTS ai_settings_admin ON public.brl_ai_settings;
CREATE POLICY ai_settings_admin ON public.brl_ai_settings FOR UPDATE TO authenticated USING(public.brl_full_admin()) WITH CHECK(public.brl_full_admin());
DROP POLICY IF EXISTS ai_articles_read ON public.brl_ai_articles;
CREATE POLICY ai_articles_read ON public.brl_ai_articles FOR SELECT USING(status='published' OR public.brl_full_admin());
DROP POLICY IF EXISTS ai_articles_admin ON public.brl_ai_articles;
CREATE POLICY ai_articles_admin ON public.brl_ai_articles FOR UPDATE TO authenticated USING(public.brl_full_admin()) WITH CHECK(public.brl_full_admin());
CREATE OR REPLACE FUNCTION public.brl_ai_owns_driver(target_driver text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.brl_accounts WHERE active AND auth_user_id=auth.uid() AND driver_id=target_driver)
$$;
REVOKE ALL ON FUNCTION public.brl_ai_owns_driver(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.brl_ai_owns_driver(text) TO anon,authenticated;
DROP POLICY IF EXISTS ai_sessions_read ON public.brl_ai_sessions;
CREATE POLICY ai_sessions_read ON public.brl_ai_sessions FOR SELECT USING(
 (status='completed' AND kind IN ('pre','post')) OR public.brl_full_admin() OR
 public.brl_ai_owns_driver(brl_ai_sessions.driver_id)
);
DROP POLICY IF EXISTS ai_sessions_admin ON public.brl_ai_sessions;
CREATE POLICY ai_sessions_admin ON public.brl_ai_sessions FOR UPDATE TO authenticated USING(public.brl_full_admin()) WITH CHECK(public.brl_full_admin());
DROP POLICY IF EXISTS ai_jobs_admin ON public.brl_ai_jobs;
CREATE POLICY ai_jobs_admin ON public.brl_ai_jobs FOR SELECT TO authenticated USING(public.brl_full_admin());
DROP POLICY IF EXISTS ai_usage_admin ON public.brl_ai_usage;
CREATE POLICY ai_usage_admin ON public.brl_ai_usage FOR SELECT TO authenticated USING(public.brl_full_admin());

-- Atomic budget gate. Includes generation and moderation requests.
CREATE OR REPLACE FUNCTION public.brl_ai_take_budget() RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE allowed integer; used integer;
BEGIN
 SELECT max_daily_requests INTO allowed FROM public.brl_ai_settings WHERE id AND enabled;
 IF allowed IS NULL THEN RETURN false; END IF;
 INSERT INTO public.brl_ai_usage(day,requests) VALUES((now() AT TIME ZONE 'America/Chicago')::date,1)
 ON CONFLICT(day) DO UPDATE SET requests=public.brl_ai_usage.requests+1 WHERE public.brl_ai_usage.requests<allowed
 RETURNING requests INTO used;
 RETURN used IS NOT NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_queue_calendar(force_preview boolean DEFAULT false) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb; season jsonb; race jsonb; t jsonb; inserted integer:=0; n integer; day date:=(now() AT TIME ZONE 'America/Chicago')::date;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.brl_ai_settings WHERE id AND enabled) THEN RETURN 0; END IF;
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league';
 SELECT s INTO season FROM jsonb_array_elements(coalesce(state->'seasons','[]')) s WHERE s->>'id'=state->>'activeSeasonId';
 IF season IS NULL THEN RETURN 0; END IF;
 FOR race IN SELECT r FROM jsonb_array_elements(coalesce(season->'raceHistory','[]')) r LOOP
  IF lower(coalesce(race->>'status','')) IN ('pending','draft','rejected') OR jsonb_array_length(coalesce(race->'results','[]'))=0 THEN CONTINUE; END IF;
  -- One recap per event; corrections update the existing article via an explicit admin regeneration.
  INSERT INTO public.brl_ai_jobs(source_key,season_id,race_name,kind)
  VALUES('recap:'||(season->>'id')||':'||(race->>'raceName'),season->>'id',race->>'raceName','recap') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT; inserted:=inserted+n;
 END LOOP;
 FOR t IN SELECT r FROM jsonb_array_elements(coalesce(state->'tracks','[]')) r
  WHERE r->>'date' ~ '^\d{4}-\d{2}-\d{2}$'
  ORDER BY r->>'date' LOOP
  IF (t->>'date')::date<day THEN CONTINUE; END IF;
  IF NOT force_preview AND (t->>'date')::date>day+7 THEN EXIT; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(season->'raceHistory','[]')) r WHERE r->>'raceName'=t->>'name') THEN CONTINUE; END IF;
  INSERT INTO public.brl_ai_jobs(source_key,season_id,race_name,kind)
  VALUES('preview:'||(season->>'id')||':'||(t->>'name')||':'||(t->>'date'),season->>'id',t->>'name','preview') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS n=ROW_COUNT; inserted:=inserted+n;
  IF force_preview THEN EXIT; END IF;
 END LOOP;
 RETURN inserted;
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_claim_job() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.brl_ai_jobs;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.brl_ai_settings WHERE id AND enabled) THEN RETURN NULL; END IF;
 UPDATE public.brl_ai_jobs SET status='failed',error='Generation timed out after three attempts.',lease_until=NULL
 WHERE status='processing' AND lease_until<now() AND attempts>=3;
 SELECT * INTO j FROM public.brl_ai_jobs WHERE attempts<3 AND
 (status='pending' OR (status='processing' AND lease_until<now())) ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN NULL; END IF;
 UPDATE public.brl_ai_jobs SET status='processing',attempts=attempts+1,lease_token=gen_random_uuid(),lease_until=now()+interval '10 minutes',updated_at=now()
 WHERE id=j.id RETURNING * INTO j;
 RETURN to_jsonb(j);
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_reserve_turn(target uuid, expected_version integer, user_answer text, token uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions;
BEGIN
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target FOR UPDATE;
 IF s.status<>'active' THEN RAISE EXCEPTION 'This conversation is closed.'; END IF;
 IF s.version<>expected_version THEN RAISE EXCEPTION 'Conversation changed. Reload it before replying.'; END IF;
 IF s.lease_until>now() THEN RAISE EXCEPTION 'The interviewer is already responding. Try again shortly.'; END IF;
 IF user_answer IS NOT NULL THEN
  IF length(trim(user_answer)) NOT BETWEEN 1 AND 3000 THEN RAISE EXCEPTION 'Reply must contain 1–3000 characters.'; END IF;
  IF jsonb_array_length(s.messages)=0 OR s.messages->-1->>'role'<>'assistant' THEN RAISE EXCEPTION 'Wait for a question before answering.'; END IF;
  s.messages:=s.messages||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'role','user','text',trim(user_answer),'at',now()));
 END IF;
 UPDATE public.brl_ai_sessions SET messages=s.messages,version=version+1,lease_token=token,lease_until=now()+interval '3 minutes',updated_at=now()
 WHERE id=target RETURNING * INTO s;
 RETURN to_jsonb(s);
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_record_completion(target uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions;
BEGIN
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target;
 IF s.status='completed' AND s.kind<>'strategy' THEN
  INSERT INTO public.interviews(ai_session_id,driver_id,driver_name,driver_number,race_name,type,series,questions_and_answers,answered,generated_at,status,completed,bonus_amount,team)
  SELECT s.id, CASE WHEN s.driver_id ~ '^\d+$' THEN s.driver_id::bigint ELSE NULL END,s.driver_name,a.driver_number,s.race_name,s.kind,'cup',
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

CREATE OR REPLACE FUNCTION public.brl_ai_finish_turn(target uuid, token uuid, reply_text text, closed boolean, flags jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions;
BEGIN
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target FOR UPDATE;
 IF s.lease_token IS DISTINCT FROM token OR s.status<>'active' THEN RAISE EXCEPTION 'Conversation response expired.'; END IF;
 IF length(reply_text) NOT BETWEEN 1 AND 1600 OR jsonb_typeof(flags)<>'array' THEN RAISE EXCEPTION 'Invalid interviewer response.'; END IF;
 UPDATE public.brl_ai_sessions SET
 messages=messages||jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'role','assistant','text',reply_text,'at',now())),
 status=CASE WHEN jsonb_array_length(flags)>0 THEN 'review' WHEN closed THEN 'completed' ELSE 'active' END,
 review_reasons=flags, version=version+1,lease_token=NULL,lease_until=NULL,updated_at=now()
 WHERE id=target RETURNING * INTO s;
 PERFORM public.brl_ai_record_completion(s.id);
 RETURN to_jsonb(s);
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_review_session(target uuid,publish boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions;
BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target FOR UPDATE;
 IF s.status<>'review' THEN RAISE EXCEPTION 'This interview is not awaiting review.'; END IF;
 IF publish AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(s.messages) m WHERE m->>'role'='user') THEN RAISE EXCEPTION 'An interview needs a driver answer.'; END IF;
 UPDATE public.brl_ai_sessions SET status=CASE WHEN publish THEN 'completed' ELSE 'hidden' END,updated_at=now() WHERE id=target;
 IF publish THEN PERFORM public.brl_ai_record_completion(target); END IF;
END; $$;
REVOKE ALL ON FUNCTION public.brl_ai_review_session(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.brl_ai_review_session(uuid,boolean) TO authenticated;

-- Completion carries no bonus; old payment tools cannot create new interview bonuses.
CREATE OR REPLACE FUNCTION public.brl_interview_no_bonus() RETURNS trigger
LANGUAGE plpgsql SET search_path='' AS $$
BEGIN NEW.bonus_amount:=0; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS brl_interview_no_bonus ON public.interviews;
CREATE TRIGGER brl_interview_no_bonus BEFORE INSERT OR UPDATE OF bonus_amount ON public.interviews FOR EACH ROW EXECUTE FUNCTION public.brl_interview_no_bonus();

CREATE OR REPLACE FUNCTION public.brl_ai_publish_job(target uuid, token uuid, article jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.brl_ai_jobs; result uuid;
BEGIN
 SELECT * INTO STRICT j FROM public.brl_ai_jobs WHERE id=target FOR UPDATE;
 IF j.status<>'processing' OR j.lease_token IS DISTINCT FROM token THEN RAISE EXCEPTION 'Article job expired.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_ai_settings WHERE id AND enabled) THEN RAISE EXCEPTION 'Automation was paused before publication.'; END IF;
 INSERT INTO public.brl_ai_articles(job_id,season_id,race_name,category,title,content,byline,image_url,quotes,status,review_reasons,source_snapshot)
 VALUES(j.id,j.season_id,j.race_name,article->>'category',article->>'title',article->>'content',article->>'byline',article->>'image_url',coalesce(article->'quotes','[]'),article->>'status',coalesce(article->'review_reasons','[]'),coalesce(article->'source_snapshot','{}'))
 ON CONFLICT(job_id) DO UPDATE SET title=excluded.title,content=excluded.content,quotes=excluded.quotes,status=excluded.status,review_reasons=excluded.review_reasons,source_snapshot=excluded.source_snapshot,updated_at=now()
 RETURNING id INTO result;
 UPDATE public.brl_ai_jobs SET status='done',lease_until=NULL,error=NULL,updated_at=now() WHERE id=target;
 RETURN result;
END; $$;

CREATE OR REPLACE FUNCTION public.brl_ai_league_changed() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.data->'tracks' IS DISTINCT FROM OLD.data->'tracks' OR NEW.data->'seasons' IS DISTINCT FROM OLD.data->'seasons' OR NEW.data->>'activeSeasonId' IS DISTINCT FROM OLD.data->>'activeSeasonId' THEN
  PERFORM public.brl_ai_queue_calendar(false);
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS brl_ai_queue_after_results ON public.league_state;
CREATE TRIGGER brl_ai_queue_after_results AFTER UPDATE ON public.league_state FOR EACH ROW EXECUTE FUNCTION public.brl_ai_league_changed();

REVOKE ALL ON FUNCTION public.brl_ai_record_completion(uuid), public.brl_ai_take_budget(), public.brl_ai_queue_calendar(boolean), public.brl_ai_claim_job(), public.brl_ai_reserve_turn(uuid,integer,text,uuid), public.brl_ai_finish_turn(uuid,uuid,text,boolean,jsonb), public.brl_ai_publish_job(uuid,uuid,jsonb), public.brl_ai_league_changed() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brl_ai_record_completion(uuid), public.brl_ai_take_budget(), public.brl_ai_queue_calendar(boolean), public.brl_ai_claim_job(), public.brl_ai_reserve_turn(uuid,integer,text,uuid), public.brl_ai_finish_turn(uuid,uuid,text,boolean,jsonb), public.brl_ai_publish_job(uuid,uuid,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
