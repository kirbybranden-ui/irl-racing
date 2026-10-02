BEGIN;
ALTER TABLE public.brl_ai_sessions ADD COLUMN IF NOT EXISTS reporter_issues jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(reporter_issues)='array');

CREATE OR REPLACE FUNCTION public.brl_ai_finish_reporter_turn(target uuid, token uuid, reply_text text, closed boolean, flags jsonb, speaker text, issue jsonb DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.brl_ai_sessions; updated_message jsonb;
BEGIN
 IF speaker NOT IN ('pit','driver','story','grid','straight','champion','banter','fan','crew','josh','trevor','snider','burns','harvick','letarte') THEN RAISE EXCEPTION 'Unknown reporter.'; END IF;
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target FOR UPDATE;
 IF issue IS NOT NULL AND (jsonb_typeof(issue)<>'object' OR NOT EXISTS(
  SELECT 1 FROM jsonb_array_elements(s.messages) m WHERE m->>'role'='user' AND position(issue->>'quote' in m->>'text')>0
 )) THEN RAISE EXCEPTION 'Reporter issue requires an actual driver answer.'; END IF;
 -- Tag older turns before changing the session's current speaker.
 UPDATE public.brl_ai_sessions SET messages=coalesce((SELECT jsonb_agg(
  CASE WHEN m->>'role'='assistant' AND NOT(m ? 'reporter_id') THEN m||jsonb_build_object('reporter_id',s.persona) ELSE m END ORDER BY ord)
  FROM jsonb_array_elements(s.messages) WITH ORDINALITY AS turns(m,ord)), '[]') WHERE id=target;
 PERFORM public.brl_ai_finish_turn(target,token,reply_text,closed,flags);
 SELECT * INTO STRICT s FROM public.brl_ai_sessions WHERE id=target;
 updated_message:=(s.messages->-1)||jsonb_build_object('reporter_id',speaker);
 UPDATE public.brl_ai_sessions SET persona=speaker,
  messages=jsonb_set(messages,ARRAY[(jsonb_array_length(messages)-1)::text],updated_message),
  reporter_issues=CASE WHEN issue IS NOT NULL AND jsonb_array_length(flags)=0 AND NOT(reporter_issues @> jsonb_build_array(issue))
   THEN reporter_issues||jsonb_build_array(issue) ELSE reporter_issues END
 WHERE id=target RETURNING * INTO s;
 RETURN to_jsonb(s);
END; $$;
REVOKE ALL ON FUNCTION public.brl_ai_finish_reporter_turn(uuid,uuid,text,boolean,jsonb,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.brl_ai_finish_reporter_turn(uuid,uuid,text,boolean,jsonb,text,jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.brl_ai_assign_interviews() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb; season jsonb; t jsonb; race jsonb; d jsonb; s public.brl_ai_sessions;
 day date:=(now() AT TIME ZONE 'America/Chicago')::date; count_assigned integer:=0; n integer; event_kind text; previous_persona text; complained_about text; chosen_persona text; reporter_slot integer;
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
   SELECT persona INTO previous_persona FROM public.brl_ai_sessions
    WHERE season_id=season->>'id' AND driver_id=d->>'id' AND race_name<>t->>'name' AND kind IN ('pre','post')
    ORDER BY created_at DESC LIMIT 1;
   SELECT reporter_issues->-1->>'reporter_id' INTO complained_about FROM public.brl_ai_sessions
    WHERE season_id=season->>'id' AND driver_id=d->>'id' AND status='completed' AND kind IN ('pre','post')
    ORDER BY updated_at DESC LIMIT 1;
   reporter_slot:=1+((hashtextextended((season->>'id')||':'||(t->>'name')||':'||event_kind||':'||(d->>'id'),0)&2147483647)%array_length(reporters,1))::integer;
   chosen_persona:=reporters[reporter_slot];
   WHILE chosen_persona=previous_persona OR chosen_persona=complained_about LOOP
    reporter_slot:=1+(reporter_slot%array_length(reporters,1)); chosen_persona:=reporters[reporter_slot];
   END LOOP;
   -- A fresh complaint about Jamie can lead directly to a Regan follow-up.
   IF complained_about='pit' AND previous_persona='pit' THEN chosen_persona:='driver'; END IF;
   INSERT INTO public.brl_ai_sessions(season_id,driver_id,driver_name,race_name,kind,persona)
   VALUES(season->>'id',d->>'id',coalesce(d->>'name','Driver'),t->>'name',event_kind,
    chosen_persona)
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

COMMIT;
