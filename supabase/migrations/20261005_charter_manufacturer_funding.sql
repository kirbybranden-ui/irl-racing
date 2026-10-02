-- BRL charter funding update. Run AFTER 20261004_league_banking.sql.
-- All new earnings originate with manufacturers. Loans/refunds remain financing/corrections.
BEGIN;
DO $$ BEGIN IF to_regclass('public.brl_bank_settings') IS NULL THEN RAISE EXCEPTION 'Run the league banking SQL first.'; END IF; END $$;
CREATE TABLE IF NOT EXISTS public.brl_bank_funding_policy(
 id boolean PRIMARY KEY DEFAULT true CHECK(id),initial_season text NOT NULL,
 premier_base numeric NOT NULL DEFAULT 700000,standard_base numeric NOT NULL DEFAULT 600000,independent_base numeric NOT NULL DEFAULT 450000,
 premier_weekly numeric NOT NULL DEFAULT 20000,standard_weekly numeric NOT NULL DEFAULT 18000,independent_weekly numeric NOT NULL DEFAULT 16000,
 team_title_premium numeric NOT NULL DEFAULT 75000,driver_title_premium numeric NOT NULL DEFAULT 50000,
 win_bonus numeric NOT NULL DEFAULT 10000,task_budget numeric NOT NULL DEFAULT 100000);
INSERT INTO public.brl_bank_funding_policy(id,initial_season) SELECT true,data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league' ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS public.brl_bank_charters(
 season_id text NOT NULL,manufacturer text NOT NULL CHECK(manufacturer IN('Toyota','Ford','Chevrolet')),
 slot integer NOT NULL CHECK(slot BETWEEN 1 AND 4),tier text NOT NULL CHECK(tier IN('premier','standard','independent')),
 capacity integer NOT NULL,team text,team_champion boolean NOT NULL DEFAULT false,driver_champion boolean NOT NULL DEFAULT false,
 PRIMARY KEY(season_id,manufacturer,slot),UNIQUE(season_id,team),
 CHECK((slot IN(1,2) AND tier='premier' AND capacity=4) OR(slot=3 AND tier='standard' AND capacity=3) OR(slot=4 AND tier='independent' AND capacity=1)));
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS charter_tier text;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS seat_capacity integer;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS weekly_per_seat numeric NOT NULL DEFAULT 0;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS team_title_premium numeric NOT NULL DEFAULT 0;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS driver_title_premium numeric NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.brl_bank_team_code(team_value text) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN upper(code) IN('B2J','B2J MOTORSPORTS','JA MOTORSPORTS') THEN 'JAM' ELSE upper(code) END FROM
 (SELECT coalesce(l.data->'customTeamBranding'->team_value->>'identifier',l.data->'registeredTeams'->team_value->>'identifier',team_value) code FROM public.league_state l WHERE l.season_name='irl-league') q $$;
CREATE OR REPLACE FUNCTION public.brl_bank_seat_count(team_value text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT count(*)::integer FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'team'=team_value AND coalesce(d->>'retired','false')<>'true' $$;
CREATE OR REPLACE FUNCTION public.brl_bank_race_count(season_value text) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT greatest(1,count(*)::integer) FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(coalesce(l.data->'tracks','[]')) t
 WHERE l.season_name='irl-league' AND l.data->>'activeSeasonId'=season_value AND coalesce(t->>'phase','')<>'Preseason' AND t->>'name' NOT ILIKE 'Preseason%' $$;
CREATE OR REPLACE FUNCTION public.brl_bank_camp_rank(season_value text,team_value text,race_value text DEFAULT NULL) RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH camp AS(SELECT manufacturer FROM public.brl_bank_agreements WHERE season_id=season_value AND team=team_value),
 scores AS(SELECT a.team,coalesce(avg(coalesce((r->>'teamPoints')::numeric,(r->>'totalRacePoints')::numeric,0)),0) score
 FROM public.brl_bank_agreements a JOIN camp ON camp.manufacturer=a.manufacturer
 LEFT JOIN public.brl_bank_races br ON br.season_id=a.season_id AND NOT coalesce((br.snapshot->>'bankingBaseline')::boolean,false)
 AND (race_value IS NULL OR br.race_name=race_value)
 AND NOT EXISTS(SELECT 1 FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(coalesce(l.data->'tracks','[]')) t WHERE l.season_name='irl-league' AND t->>'name'=br.race_name AND(coalesce(t->>'phase','')='Preseason' OR t->>'name' ILIKE 'Preseason%'))
 LEFT JOIN LATERAL jsonb_array_elements(coalesce(br.snapshot->'results','[]')) r ON r->>'team'=a.team
 WHERE a.season_id=season_value AND a.status<>'dropped' GROUP BY a.team),
 ranked AS(SELECT team,dense_rank() OVER(ORDER BY score DESC)::integer rank_value FROM scores)
 SELECT rank_value FROM ranked WHERE team=team_value $$;
CREATE OR REPLACE FUNCTION public.brl_bank_rank_bonus(rank_value integer) RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path='' AS $$ SELECT CASE rank_value WHEN 1 THEN 3000 WHEN 2 THEN 2000 WHEN 3 THEN 1000 ELSE 500 END::numeric $$;
-- Vacant/unused seats stay reserved, including Ford's missing premier charter.
CREATE OR REPLACE FUNCTION public.brl_bank_vacancy_reserve(manufacturer_value text,season_value text) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(sum((c.capacity-least(c.capacity,public.brl_bank_seat_count(c.team)))*
 ((CASE c.tier WHEN 'premier' THEN p.premier_base/4 WHEN 'standard' THEN p.standard_base/3 ELSE p.independent_base END)+
 19*(CASE c.tier WHEN 'premier' THEN p.premier_weekly WHEN 'standard' THEN p.standard_weekly ELSE p.independent_weekly END+3000))),0)
 FROM public.brl_bank_charters c CROSS JOIN public.brl_bank_funding_policy p WHERE c.manufacturer=manufacturer_value AND c.season_id=season_value $$;
CREATE OR REPLACE FUNCTION public.brl_bank_funding_reserve(manufacturer_value text,season_value text) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT public.brl_bank_vacancy_reserve(manufacturer_value,season_value)+
 coalesce((SELECT sum(base_funding*(1-cut_percent/100.0)) FROM public.brl_bank_agreements WHERE season_id=season_value AND manufacturer=manufacturer_value AND funded_at IS NULL AND status='active' AND charter_tier IS NOT NULL),0)+
 coalesce((SELECT sum(public.brl_bank_seat_count(a.team)*(a.weekly_per_seat+3000*19.0/public.brl_bank_race_count(season_value))*greatest(0,public.brl_bank_race_count(season_value)-(SELECT count(*) FROM public.brl_bank_races br WHERE br.season_id=season_value AND NOT coalesce((br.snapshot->>'bankingBaseline')::boolean,false) AND NOT EXISTS(SELECT 1 FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') t WHERE l.season_name='irl-league' AND t->>'name'=br.race_name AND(t->>'phase'='Preseason' OR t->>'name' ILIKE 'Preseason%'))))) FROM public.brl_bank_agreements a WHERE a.season_id=season_value AND a.manufacturer=manufacturer_value AND a.status='active'),0)+
 coalesce((SELECT sum(reward) FROM public.brl_bank_tasks WHERE season_id=season_value AND manufacturer=manufacturer_value AND status IN('offered','accepted')),0) $$;
CREATE TABLE IF NOT EXISTS public.brl_bank_manufacturer_budgets(season_id text NOT NULL,manufacturer text NOT NULL,amount numeric NOT NULL CHECK(amount>0 AND amount<=8000000),approved_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(season_id,manufacturer));
CREATE OR REPLACE FUNCTION public.brl_bank_manufacturer_spent(manufacturer_value text,season_value text) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT greatest(0,-coalesce(sum(e.amount),0)) FROM public.brl_bank_entries e JOIN public.brl_bank_transactions t ON t.id=e.transaction_id JOIN public.brl_bank_accounts a ON a.id=e.account_id WHERE a.kind='manufacturer' AND a.subject=manufacturer_value AND t.season_id=season_value AND t.category NOT IN('Season operating budget','Opening balance') $$;
CREATE OR REPLACE FUNCTION public.brl_bank_manufacturer_cash(manufacturer_value text,season_value text) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT greatest(0,least(coalesce((SELECT balance FROM public.brl_bank_accounts WHERE kind='manufacturer' AND subject=manufacturer_value),0),coalesce((SELECT amount FROM public.brl_bank_manufacturer_budgets WHERE season_id=season_value AND manufacturer=manufacturer_value),0)-public.brl_bank_manufacturer_spent(manufacturer_value,season_value))) $$;
CREATE OR REPLACE FUNCTION public.brl_bank_budget(kind_value text,subject_value text,season_value text,value numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE previous numeric; top_up numeric; account_id uuid; BEGIN
 IF NOT public.brl_full_admin() OR kind_value NOT IN('treasury','manufacturer') OR value<=0 OR value::text IN('NaN','Infinity','-Infinity') OR season_value<>(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') THEN RAISE EXCEPTION 'Full admin and a valid current-season budget required.';END IF;
 IF kind_value='treasury' THEN IF value>25000000 THEN RAISE EXCEPTION 'Treasury budget exceeds the limit.';END IF;PERFORM public.brl_bank_post(public.brl_bank_account('external','season-budgets'),public.brl_bank_account(kind_value,subject_value),value,'season-budget:'||season_value||':'||kind_value||':'||subject_value,'Season operating budget','Approved fixed operating allocation',season_value);RETURN;END IF;
 IF subject_value NOT IN('Ford','Toyota','Chevrolet') OR value>8000000 THEN RAISE EXCEPTION 'Manufacturer budget ceiling is $8 million per season.';END IF;
 PERFORM pg_advisory_xact_lock(61004001);
 SELECT amount INTO previous FROM public.brl_bank_manufacturer_budgets WHERE season_id=season_value AND manufacturer=subject_value;
 IF FOUND THEN IF previous<>value THEN RAISE EXCEPTION 'A manufacturer budget has already been approved for this season.';END IF;RETURN;END IF;
 account_id:=public.brl_bank_account('manufacturer',subject_value);PERFORM id FROM public.brl_bank_accounts WHERE id=account_id FOR UPDATE;
 top_up:=greatest(0,value-public.brl_bank_manufacturer_spent(subject_value,season_value)-(SELECT balance FROM public.brl_bank_accounts WHERE id=account_id));
 INSERT INTO public.brl_bank_manufacturer_budgets VALUES(season_value,subject_value,value,now());
 IF top_up>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('external','season-budgets'),account_id,top_up,'charter-season-budget:'||season_value||':'||subject_value,'Season operating budget','Top up to the approved annual ceiling; existing cash and spending counted',season_value);END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_prepare_charters() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s text; m text; i integer; team_value text; code text; dest_slot integer; BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 SELECT data->>'activeSeasonId' INTO s FROM public.league_state WHERE season_name='irl-league';
 FOREACH m IN ARRAY ARRAY['Ford','Toyota','Chevrolet'] LOOP FOR i IN 1..4 LOOP
 INSERT INTO public.brl_bank_charters(season_id,manufacturer,slot,tier,capacity) VALUES(s,m,i,CASE WHEN i<3 THEN 'premier' WHEN i=3 THEN 'standard' ELSE 'independent' END,CASE WHEN i<3 THEN 4 WHEN i=3 THEN 3 ELSE 1 END) ON CONFLICT DO NOTHING;
 END LOOP; END LOOP;
 FOR team_value,m IN SELECT d->>'team',min(d->>'manufacturer') FROM jsonb_array_elements(public.brl_roster()) d WHERE coalesce(d->>'retired','false')<>'true' AND coalesce(d->>'team','') NOT IN('','Independent','IND') GROUP BY d->>'team' LOOP
 IF m NOT IN('Toyota','Ford','Chevrolet') THEN CONTINUE; END IF;
 code:=public.brl_bank_team_code(team_value);
 dest_slot:=CASE code WHEN 'NLM' THEN 1 WHEN 'NINE LINE MOTORSPORTS' THEN 1 WHEN 'JAM' THEN 1 WHEN '19XI' THEN 2 WHEN '19XI RACING' THEN 2 WHEN 'BXM' THEN 1 WHEN 'BAYOUX MOTORSPORTS' THEN 1 WHEN 'RMS' THEN 2 WHEN 'KMS' THEN 3 WHEN 'MER' THEN 3 WHEN 'ME RACING' THEN 3 WHEN 'T4M' THEN 4 WHEN 'T4 MOTORSPORTS' THEN 4 WHEN 'LIFTEDSOUR' THEN 4 WHEN 'G-BUSK' THEN 4 ELSE NULL END;
 IF dest_slot IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.brl_bank_charters WHERE season_id=s AND team=team_value) THEN
 UPDATE public.brl_bank_charters SET team=team_value WHERE season_id=s AND manufacturer=m AND slot=dest_slot AND team IS NULL;
 END IF;
 END LOOP;
 -- Initial-season championship facts supplied by the league. Never automatically repeat in later seasons.
 UPDATE public.brl_bank_charters SET team_champion=true,driver_champion=true WHERE season_id=(SELECT initial_season FROM public.brl_bank_funding_policy) AND manufacturer='Ford' AND slot=1 AND public.brl_bank_team_code(team) IN('NLM','NINE LINE MOTORSPORTS');
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_bootstrap() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s text; d jsonb; c public.brl_bank_charters; p public.brl_bank_funding_policy; amount numeric; goals jsonb; BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 PERFORM public.brl_bank_prepare_charters(); SELECT data->>'activeSeasonId' INTO s FROM public.league_state WHERE season_name='irl-league';SELECT * INTO p FROM public.brl_bank_funding_policy;
 PERFORM public.brl_bank_account('treasury','league','League Treasury');PERFORM public.brl_bank_account('external','opening');PERFORM public.brl_bank_account('external','career');
 FOREACH c.manufacturer IN ARRAY ARRAY['Ford','Toyota','Chevrolet'] LOOP PERFORM public.brl_bank_account('manufacturer',c.manufacturer,c.manufacturer); END LOOP;
 FOR d IN SELECT value FROM jsonb_array_elements(public.brl_roster()) LOOP PERFORM public.brl_bank_account('driver',d->>'id',d->>'name');PERFORM public.brl_bank_account('team',coalesce(d->>'team','Independent')); END LOOP;
 FOR c IN SELECT * FROM public.brl_bank_charters WHERE season_id=s AND team IS NOT NULL LOOP
 IF public.brl_bank_seat_count(c.team)>c.capacity THEN RAISE EXCEPTION 'Team % exceeds its % charter capacity of %.',c.team,c.tier,c.capacity; END IF;
 IF public.brl_bank_seat_count(c.team)=0 THEN CONTINUE; END IF;
 amount:=round((CASE c.tier WHEN 'premier' THEN p.premier_base WHEN 'standard' THEN p.standard_base ELSE p.independent_base END)*public.brl_bank_seat_count(c.team)/c.capacity,2)+CASE WHEN c.team_champion THEN p.team_title_premium ELSE 0 END+CASE WHEN c.driver_champion THEN p.driver_title_premium ELSE 0 END;
 goals:=jsonb_build_array(jsonb_build_object('metric','camp_rank','target',CASE WHEN c.team_champion THEN 1 WHEN c.tier='premier' THEN 2 WHEN c.tier='standard' THEN 3 ELSE 4 END,'label','Meet your funding performance target within '||c.manufacturer));
 goals:=goals||CASE public.brl_bank_team_code(c.team)
 WHEN 'NLM' THEN '[{"metric":"team_championship","target":1,"label":"Achievement goal: defend the team championship"},{"metric":"chase","target":2,"label":"Achievement goal: qualify two drivers for the Chase"}]'::jsonb
 WHEN 'BXM' THEN '[{"metric":"wins","target":1,"label":"Achievement goal: earn a race win"}]'::jsonb
 WHEN 'RMS' THEN '[{"metric":"top5","target":5,"label":"Achievement goal: earn five top-five finishes"}]'::jsonb
 WHEN 'JAM' THEN '[{"metric":"team_rank","target":5,"label":"Achievement goal: top five in overall team points"},{"metric":"chase","target":1,"label":"Achievement goal: qualify a driver for the Chase"}]'::jsonb
 ELSE '[{"metric":"top10","target":1,"label":"Achievement goal: earn top-ten finishes"}]'::jsonb END;
 INSERT INTO public.brl_bank_agreements(season_id,team,manufacturer,base_funding,funding_at,expectations,charter_tier,seat_capacity,weekly_per_seat,team_title_premium,driver_title_premium)
 VALUES(s,c.team,c.manufacturer,amount,now(),goals,c.tier,c.capacity,CASE c.tier WHEN 'premier' THEN p.premier_weekly WHEN 'standard' THEN p.standard_weekly ELSE p.independent_weekly END*19.0/public.brl_bank_race_count(s),CASE WHEN c.team_champion THEN p.team_title_premium ELSE 0 END,CASE WHEN c.driver_champion THEN p.driver_title_premium ELSE 0 END)
 ON CONFLICT(season_id,team) DO UPDATE SET manufacturer=excluded.manufacturer,base_funding=excluded.base_funding,expectations=excluded.expectations,charter_tier=excluded.charter_tier,seat_capacity=excluded.seat_capacity,weekly_per_seat=excluded.weekly_per_seat,team_title_premium=excluded.team_title_premium,driver_title_premium=excluded.driver_title_premium WHERE public.brl_bank_agreements.funded_at IS NULL;
 UPDATE public.brl_bank_agreements SET charter_tier=c.tier,seat_capacity=c.capacity,weekly_per_seat=CASE c.tier WHEN 'premier' THEN p.premier_weekly WHEN 'standard' THEN p.standard_weekly ELSE p.independent_weekly END*19.0/public.brl_bank_race_count(s),expectations=goals WHERE season_id=s AND team=c.team;
 IF EXISTS(SELECT 1 FROM public.brl_bank_agreements WHERE season_id=s AND team=c.team AND funded_at IS NOT NULL AND base_funding<>amount) THEN PERFORM public.brl_bank_notice('charter-funded-review:'||s||':'||c.team,s,c.team,NULL,'Existing funded agreement retained','The charter policy does not repay an already-funded base agreement. An admin must review any adjustment separately.'); END IF;
 END LOOP;
 UPDATE public.brl_bank_agreements a SET weekly_per_seat=0,charter_tier=NULL WHERE season_id=s AND NOT EXISTS(SELECT 1 FROM public.brl_bank_charters charter_row WHERE charter_row.season_id=s AND charter_row.team=a.team);
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_assign_charter(manufacturer_value text,slot_value integer,team_value text,team_title boolean DEFAULT false,driver_title boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s text; c public.brl_bank_charters; BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 SELECT data->>'activeSeasonId' INTO s FROM public.league_state WHERE season_name='irl-league';SELECT * INTO STRICT c FROM public.brl_bank_charters WHERE season_id=s AND manufacturer=manufacturer_value AND slot=slot_value FOR UPDATE;
 IF c.team IS DISTINCT FROM nullif(team_value,'') AND c.team IS NOT NULL AND EXISTS(SELECT 1 FROM public.brl_bank_agreements WHERE season_id=s AND team=c.team AND funded_at IS NOT NULL) THEN RAISE EXCEPTION 'A funded charter requires an audited offseason change.'; END IF;
 IF nullif(team_value,'') IS NOT NULL THEN
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'team'=team_value AND d->>'manufacturer'=manufacturer_value) OR EXISTS(SELECT 1 FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'team'=team_value AND d->>'manufacturer'<>manufacturer_value) THEN RAISE EXCEPTION 'Select a current team from this manufacturer.'; END IF;
 IF public.brl_bank_seat_count(team_value)>c.capacity THEN RAISE EXCEPTION 'Roster exceeds charter seat capacity.'; END IF;
 END IF;
 IF team_title AND EXISTS(SELECT 1 FROM public.brl_bank_charters WHERE season_id=s AND team_champion AND team IS DISTINCT FROM team_value) THEN RAISE EXCEPTION 'Only one defending team champion is allowed.'; END IF;
 IF driver_title AND EXISTS(SELECT 1 FROM public.brl_bank_charters WHERE season_id=s AND driver_champion AND team IS DISTINCT FROM team_value) THEN RAISE EXCEPTION 'Only one defending driver champion is allowed.'; END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_agreements WHERE season_id=s AND team=team_value AND funded_at IS NOT NULL) AND (c.team_champion IS DISTINCT FROM team_title OR c.driver_champion IS DISTINCT FROM driver_title) THEN RAISE EXCEPTION 'Already-funded championship premiums require an audited adjustment.'; END IF;
 UPDATE public.brl_bank_charters SET team=nullif(team_value,''),team_champion=team_title,driver_champion=driver_title WHERE season_id=s AND manufacturer=manufacturer_value AND slot=slot_value;
 PERFORM public.brl_bank_bootstrap();
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_charter_amount(season_value text,team_value text) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT round((CASE c.tier WHEN 'premier' THEN p.premier_base WHEN 'standard' THEN p.standard_base ELSE p.independent_base END)*least(c.capacity,public.brl_bank_seat_count(c.team))/c.capacity,2)+CASE WHEN c.team_champion THEN p.team_title_premium ELSE 0 END+CASE WHEN c.driver_champion THEN p.driver_title_premium ELSE 0 END
 FROM public.brl_bank_charters c CROSS JOIN public.brl_bank_funding_policy p WHERE c.season_id=season_value AND c.team=team_value $$;
CREATE OR REPLACE FUNCTION public.brl_bank_apply_charter_funding(team_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.brl_bank_agreements; c public.brl_bank_charters; p public.brl_bank_funding_policy; target numeric; difference numeric; src uuid; dst uuid; tax numeric; BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.';END IF;
 PERFORM pg_advisory_xact_lock(61004001);
 SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE team=team_value AND season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') FOR UPDATE;
 IF a.funded_at IS NULL THEN RAISE EXCEPTION 'No adjustment is needed; this agreement has not been funded.';END IF;
 SELECT * INTO STRICT c FROM public.brl_bank_charters WHERE team=team_value AND season_id=a.season_id;SELECT * INTO p FROM public.brl_bank_funding_policy;
 target:=public.brl_bank_charter_amount(a.season_id,a.team);difference:=round((target-a.base_funding)*(1-a.cut_percent/100.0),2);
 IF difference=0 THEN RETURN;END IF;
 IF difference<0 THEN RAISE EXCEPTION 'A smaller funded allocation requires an audited refund review.';END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_transactions WHERE event_key='charter-adjustment:'||a.id) THEN RAISE EXCEPTION 'This agreement already received its one-time charter adjustment.';END IF;
 src:=public.brl_bank_account('manufacturer',a.manufacturer);dst:=public.brl_bank_account('team',a.team);PERFORM id FROM public.brl_bank_accounts WHERE id=src FOR UPDATE;
 IF public.brl_bank_manufacturer_cash(a.manufacturer,a.season_id)-public.brl_bank_funding_reserve(a.manufacturer,a.season_id)<difference THEN RAISE EXCEPTION 'Manufacturer needs sufficient uncommitted funds for this adjustment.';END IF;
 PERFORM public.brl_bank_post(src,dst,difference,'charter-adjustment:'||a.id,'Charter funding adjustment','Admin-approved increase to the revised charter agreement',a.season_id);
 SELECT funding_tax_rate INTO tax FROM public.brl_bank_settings WHERE id;IF tax>0 THEN PERFORM public.brl_bank_post(dst,public.brl_bank_account('treasury','league'),round(difference*tax,2),'charter-adjustment-tax:'||a.id,'Manufacturer funding tax','Tax on charter funding adjustment',a.season_id);END IF;
 UPDATE public.brl_bank_agreements SET base_funding=target,team_title_premium=CASE WHEN c.team_champion THEN p.team_title_premium ELSE 0 END,driver_title_premium=CASE WHEN c.driver_champion THEN p.driver_title_premium ELSE 0 END WHERE id=a.id;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_bonus(team_value text,contract_value uuid,value numeric,reason_value text,reference uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.brl_bank_contracts; result uuid; existing public.brl_bank_payments; BEGIN
 IF NOT public.brl_can_team(team_value) THEN RAISE EXCEPTION 'Team ownership required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RAISE EXCEPTION 'Banking is paused.'; END IF;
 IF value<=0 OR value::text IN('NaN','Infinity','-Infinity') OR length(trim(reason_value))<3 THEN RAISE EXCEPTION 'Enter a positive bonus and a reason.'; END IF;
 SELECT * INTO STRICT c FROM public.brl_bank_contracts WHERE id=contract_value AND team=team_value AND status='active';
 PERFORM id FROM public.brl_bank_accounts WHERE kind='team' AND subject=team_value FOR UPDATE;
 SELECT * INTO existing FROM public.brl_bank_payments WHERE event_key='owner-bonus:'||reference;
 IF FOUND THEN IF existing.contract_id<>contract_value OR existing.amount<>round(value,2) OR existing.description<>'Owner-approved bonus: '||reason_value THEN RAISE EXCEPTION 'Bonus reference already used.'; END IF;RETURN existing.id;END IF;
 IF public.brl_bank_available(public.brl_bank_account('team',team_value))<round(value,2) THEN RAISE EXCEPTION 'Bonus would use funds reserved for existing compensation.'; END IF;
 INSERT INTO public.brl_bank_payments(contract_id,season_id,team,driver_id,kind,amount,due_at,event_key,description) VALUES(c.id,c.season_id,c.team,c.driver_id,'bonus',round(value,2),now(),'owner-bonus:'||reference,'Owner-approved bonus: '||reason_value) RETURNING id INTO result;
 IF NOT public.brl_bank_pay(result) THEN RAISE EXCEPTION 'Bonus could not be paid.'; END IF;
 PERFORM public.brl_bank_notice('owner-bonus-notice:'||reference,c.season_id,c.team,c.driver_id,'Owner-approved bonus',reason_value||' · gross '||round(value,2));RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_block_state_paint_awards() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE new_season jsonb; old_season jsonb; BEGIN
 IF NEW.data->>'activeSeasonId'=OLD.data->>'activeSeasonId' THEN
 SELECT sn INTO new_season FROM jsonb_array_elements(coalesce(NEW.data->'seasons','[]')) sn WHERE sn->>'id'=NEW.data->>'activeSeasonId';
 SELECT sn INTO old_season FROM jsonb_array_elements(coalesce(OLD.data->'seasons','[]')) sn WHERE sn->>'id'=OLD.data->>'activeSeasonId';
 IF jsonb_array_length(coalesce(new_season->'paintSchemePayouts','[]'))>jsonb_array_length(coalesce(old_season->'paintSchemePayouts','[]')) THEN RAISE EXCEPTION 'Paint-scheme cash awards are disabled. Use contract payments or an owner-approved bonus.';END IF;
 END IF;RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS brl_no_extra_paint_awards ON public.league_state;
CREATE TRIGGER brl_no_extra_paint_awards BEFORE UPDATE ON public.league_state FOR EACH ROW EXECUTE FUNCTION public.brl_bank_block_state_paint_awards();
CREATE OR REPLACE FUNCTION public.brl_bank_block_paint_payout() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'Paint schemes are recognition only. Driver payments require a contract or owner-approved bonus.'; END; $$;
DO $$ BEGIN IF to_regclass('public.paint_scheme_payouts') IS NOT NULL THEN EXECUTE 'DROP TRIGGER IF EXISTS brl_no_paint_payout ON public.paint_scheme_payouts';EXECUTE 'CREATE TRIGGER brl_no_paint_payout BEFORE INSERT ON public.paint_scheme_payouts FOR EACH ROW EXECUTE FUNCTION public.brl_bank_block_paint_payout()';END IF;END $$;

CREATE OR REPLACE FUNCTION public.brl_bank_tick() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb; sn jsonb; race jsonb; t jsonb; r jsonb; d jsonb; a public.brl_bank_agreements; p public.brl_bank_payments; task public.brl_bank_tasks; src uuid; dest uuid; treasury uuid; season_value text; team_value text; prize numeric; done integer:=0; fresh boolean; count_races integer; review_period integer; progress numeric; achieved numeric; goal jsonb; pass boolean; review_detail text; next_date date; media_due timestamptz; missing integer; tax_rate numeric; taxable numeric; account_row public.brl_bank_accounts; rankings jsonb; qid uuid; obligation record; due_time timestamptz; required_purse numeric; expected_fees numeric; camp_position integer; mfr text; ready boolean;
BEGIN
 IF NOT public.brl_full_admin() AND coalesce(current_setting('role',true),'')<>'service_role' THEN RAISE EXCEPTION 'Full admin or worker required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RETURN jsonb_build_object('enabled',false); END IF;
 PERFORM pg_advisory_xact_lock(61004001);
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league'; season_value:=state->>'activeSeasonId';
 SELECT value INTO sn FROM jsonb_array_elements(coalesce(state->'seasons','[]')) WHERE value->>'id'=season_value;
 treasury:=public.brl_bank_account('treasury','league','League Treasury');
 FOR a IN SELECT * FROM public.brl_bank_agreements WHERE season_id=season_value AND funded_at IS NULL AND status='active' AND charter_tier IS NOT NULL AND funding_at<=now() LOOP
  src:=public.brl_bank_account('manufacturer',a.manufacturer); dest:=public.brl_bank_account('team',a.team);
  IF a.charter_tier IS NOT NULL AND public.brl_bank_manufacturer_cash(a.manufacturer,a.season_id)-public.brl_bank_vacancy_reserve(a.manufacturer,a.season_id)>=round(a.base_funding*(1-a.cut_percent/100.0),2) THEN
   PERFORM public.brl_bank_post(src,dest,round(a.base_funding*(1-a.cut_percent/100.0),2),'manufacturer-base:'||a.id,'Manufacturer funding','Preseason base agreement',a.season_id);
   SELECT funding_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id; IF a.base_funding>0 AND tax_rate>0 THEN PERFORM public.brl_bank_post(dest,treasury,round(a.base_funding*(1-a.cut_percent/100.0)*tax_rate,2),'manufacturer-base-tax:'||a.id,'Manufacturer funding tax','5% manufacturer funding tax',a.season_id); END IF; UPDATE public.brl_bank_agreements SET funded_at=now() WHERE id=a.id;
  ELSE PERFORM public.brl_bank_notice('manufacturer-budget:'||a.id,a.season_id,a.team,NULL,'Manufacturer funding pending','The manufacturer budget cannot yet cover its agreement. Admin action required.'); END IF;
 END LOOP;
 FOR p IN SELECT * FROM public.brl_bank_payments WHERE status='scheduled' ORDER BY due_at,id LOOP
  IF p.due_at<=now()+interval '3 days' THEN PERFORM public.brl_bank_notice('payment-reminder:'||p.id,p.season_id,p.team,p.driver_id,'Payment due',p.description||' · '||p.amount||' · '||p.due_at); END IF;
  IF p.due_at<=now() THEN IF public.brl_bank_pay(p.id) THEN done:=done+1; ELSE PERFORM public.brl_bank_notice('payment-overdue:'||p.id,p.season_id,p.team,p.driver_id,'Payment overdue',p.description||' remains unpaid. Driver compensation arrears block team points.'); END IF; END IF;
 END LOOP;
 FOR race IN SELECT value FROM jsonb_array_elements(coalesce(sn->'raceHistory','[]')) WHERE lower(coalesce(value->>'status','')) NOT IN('pending','draft','rejected') LOOP
  IF jsonb_array_length(coalesce(race->'results','[]'))=0 OR (race->>'startedAt')::timestamptz>now() THEN CONTINUE; END IF;
  IF EXISTS(SELECT 1 FROM public.brl_bank_races br WHERE br.season_id=season_value AND br.race_name=race->>'raceName') THEN IF EXISTS(SELECT 1 FROM public.brl_bank_races br WHERE br.season_id=season_value AND br.race_name=race->>'raceName' AND NOT coalesce((br.snapshot->>'bankingBaseline')::boolean,false) AND br.snapshot->'results' IS DISTINCT FROM race->'results') THEN PERFORM public.brl_bank_notice('race-correction:'||season_value||':'||(race->>'raceName'),season_value,NULL,NULL,'Race financial correction requires review','Posted results changed after money settled. Admin must record a financial correction; no duplicate payout will be made.'); END IF; CONTINUE; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(state->'tracks') tt WHERE tt->>'name'=race->>'raceName' AND(tt->>'phase'='Preseason' OR tt->>'name' ILIKE 'Preseason%')) THEN
   INSERT INTO public.brl_bank_races(season_id,race_name,started_at,snapshot) VALUES(season_value,race->>'raceName',coalesce((race->>'startedAt')::timestamptz,now()),race||'{"preseason":true}'::jsonb) ON CONFLICT DO NOTHING;CONTINUE;
  END IF;
  ready:=true;
  FOR mfr IN SELECT DISTINCT ag.manufacturer FROM public.brl_bank_agreements ag JOIN jsonb_array_elements(race->'results') rr ON rr->>'team'=ag.team WHERE ag.season_id=season_value LOOP
   SELECT coalesce(sum((ag.weekly_per_seat+3000*19.0/public.brl_bank_race_count(season_value))*(1-ag.cut_percent/100.0)+CASE WHEN coalesce(rr->>'dnf','false')<>'true' AND(rr->>'finishPos')::integer=1 THEN (SELECT win_bonus*19.0/public.brl_bank_race_count(season_value) FROM public.brl_bank_funding_policy) ELSE 0 END),0)
   INTO required_purse FROM jsonb_array_elements(race->'results') rr JOIN public.brl_bank_agreements ag ON ag.team=rr->>'team' AND ag.season_id=season_value WHERE ag.manufacturer=mfr AND ag.status='active' AND ag.charter_tier IS NOT NULL;
   IF public.brl_bank_manufacturer_cash(mfr,season_value)-public.brl_bank_vacancy_reserve(mfr,season_value)-coalesce((SELECT sum(base_funding*(1-cut_percent/100.0)) FROM public.brl_bank_agreements WHERE season_id=season_value AND manufacturer=mfr AND funded_at IS NULL AND status='active' AND charter_tier IS NOT NULL),0)-coalesce((SELECT sum(reward) FROM public.brl_bank_tasks WHERE season_id=season_value AND manufacturer=mfr AND status IN('offered','accepted')),0)<required_purse THEN
    ready:=false;PERFORM public.brl_bank_notice('manufacturer-race-budget:'||season_value||':'||(race->>'raceName')||':'||mfr,season_value,NULL,NULL,'Manufacturer race funding pending',mfr||' needs sufficient approved funding. Vacant charter and accepted task allocations remain protected.');
   END IF;
  END LOOP;
  IF NOT ready THEN CONTINUE; END IF;
  INSERT INTO public.brl_bank_races(season_id,race_name,started_at,snapshot) VALUES(season_value,race->>'raceName',coalesce((race->>'startedAt')::timestamptz,now()),race) ON CONFLICT DO NOTHING; GET DIAGNOSTICS count_races=ROW_COUNT;
  IF count_races=0 THEN CONTINUE; END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(race->'results') LOOP
   team_value:=coalesce(r->>'team','Independent'); dest:=public.brl_bank_account('team',team_value);
   PERFORM public.brl_bank_post(dest,treasury,round(10000*19.0/public.brl_bank_race_count(season_value),2),'entry:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'Entry fee','Race entry',season_value,race->>'raceName',true);
   IF r->>'dnf'='true' THEN
    PERFORM public.brl_bank_post(dest,treasury,50000,'dnf:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'DNF fee','Driver quit/disconnected: no points',season_value,race->>'raceName',true);
    INSERT INTO public.brl_bank_cases(season_id,team,driver_id,race_name,kind,reason) VALUES(season_value,team_value,r->>'driverId',race->>'raceName','dnf','Confirm voluntary quitting or approved internet/power exemption');
   END IF;
   SELECT * INTO a FROM public.brl_bank_agreements WHERE season_id=season_value AND team=team_value AND status='active' AND charter_tier IS NOT NULL;
   IF FOUND AND public.brl_bank_seat_count(team_value)<=a.seat_capacity THEN
    src:=public.brl_bank_account('manufacturer',a.manufacturer);camp_position:=public.brl_bank_camp_rank(season_value,team_value,race->>'raceName');
    prize:=round((a.weekly_per_seat+CASE WHEN coalesce(r->>'dnf','false')='true' THEN 0 ELSE public.brl_bank_rank_bonus(camp_position)*19.0/public.brl_bank_race_count(season_value) END)*(1-a.cut_percent/100.0),2);
    IF coalesce(r->>'dnf','false')<>'true' AND(r->>'finishPos')::integer=1 THEN prize:=prize+round((SELECT win_bonus*19.0/public.brl_bank_race_count(season_value) FROM public.brl_bank_funding_policy),2); END IF;
    IF prize>0 THEN
     PERFORM public.brl_bank_post(src,dest,prize,'manufacturer-weekly:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'Manufacturer weekly support','Charter participation, '||a.manufacturer||' camp rank '||camp_position||CASE WHEN coalesce(r->>'dnf','false')<>'true' AND(r->>'finishPos')::integer=1 THEN ' and race win bonus' ELSE '' END,season_value,race->>'raceName');
     SELECT funding_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id;
     IF tax_rate>0 THEN PERFORM public.brl_bank_post(dest,treasury,round(prize*tax_rate,2),'manufacturer-weekly-tax:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'Manufacturer funding tax','Tax on weekly manufacturer funding',season_value,race->>'raceName'); END IF;
    END IF;
   ELSE PERFORM public.brl_bank_notice('charter-missing:'||season_value||':'||team_value,season_value,team_value,NULL,'Charter funding unavailable','A valid charter and roster capacity are required for manufacturer weekly support.');
   END IF;
  END LOOP;
  FOR d IN SELECT value FROM jsonb_array_elements(coalesce(sn->'drivers','[]')) WHERE coalesce(value->>'retired','false')<>'true' LOOP
   IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(race->'results') rr WHERE rr->>'driverId'=d->>'id') THEN INSERT INTO public.brl_bank_cases(season_id,team,driver_id,race_name,kind,reason) VALUES(season_value,coalesce(d->>'team','Independent'),d->>'id',race->>'raceName','attendance','Absent from approved results. Confirm no-call/no-show or excuse; no automatic misconduct assumption.') ON CONFLICT DO NOTHING; END IF;
  END LOOP;
 END LOOP;
 IF to_regclass('public.brl_ai_sessions') IS NOT NULL THEN
  FOR obligation IN EXECUTE 'SELECT id,driver_id,race_name,kind FROM public.brl_ai_sessions WHERE season_id=$1 AND kind IN(''pre'',''post'') AND status=''active''' USING season_value LOOP
   SELECT value INTO t FROM jsonb_array_elements(state->'tracks') tt WHERE tt->>'name'=obligation.race_name;
   IF t IS NULL THEN CONTINUE; END IF;
   due_time:=CASE WHEN obligation.kind='pre' THEN ((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York' ELSE (((t->>'date')::date+((3-extract(dow FROM (t->>'date')::date)::integer+7)%7))||' 23:59:59')::timestamp AT TIME ZONE 'America/New_York' END;
   IF due_time<now() AND EXISTS(SELECT 1 FROM public.brl_bank_contracts cc WHERE cc.season_id=season_value AND cc.driver_id=obligation.driver_id AND cc.role<>'owner' AND cc.status='active') THEN
    SELECT rr->>'team' INTO team_value FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'id'=obligation.driver_id;
    qid:=NULL; INSERT INTO public.brl_bank_cases(season_id,team,driver_id,race_name,kind,reason,payload) VALUES(season_value,coalesce(team_value,'Independent'),obligation.driver_id,obligation.race_name,'media','Assigned '||obligation.kind||'-race interview was not completed by the contractual deadline',jsonb_build_object('media_kind',obligation.kind)) ON CONFLICT DO NOTHING RETURNING id INTO qid;
    IF qid IS NOT NULL THEN PERFORM public.brl_bank_decide(qid,true); END IF;
   END IF;
  END LOOP;
 END IF;
 -- Optional tasks settle once against approved results; failure never creates a fine.
 FOR task IN SELECT * FROM public.brl_bank_tasks WHERE status IN('offered','accepted') LOOP
  SELECT snapshot INTO race FROM public.brl_bank_races WHERE season_id=task.season_id AND race_name=task.race_name;
  IF task.status='offered' AND task.deadline<=now() THEN UPDATE public.brl_bank_tasks SET status='expired' WHERE id=task.id; CONTINUE; END IF;
  IF task.status<>'accepted' OR race IS NULL THEN CONTINUE; END IF;
  SELECT count(*) INTO achieved FROM jsonb_array_elements(race->'results') rr WHERE rr->>'team'=task.team AND coalesce(rr->>'dnf','false')<>'true' AND CASE task.metric WHEN 'wins' THEN (rr->>'finishPos')::integer=1 WHEN 'top5' THEN (rr->>'finishPos')::integer BETWEEN 1 AND 5 WHEN 'top10' THEN (rr->>'finishPos')::integer BETWEEN 1 AND 10 ELSE false END;
  IF achieved>=task.target THEN
   src:=public.brl_bank_account('manufacturer',task.manufacturer); IF (SELECT balance FROM public.brl_bank_accounts WHERE id=src)-public.brl_bank_vacancy_reserve(task.manufacturer,task.season_id)>=task.reward THEN PERFORM public.brl_bank_post(src,public.brl_bank_account('team',task.team),task.reward,'task:'||task.id,'Manufacturer task',task.title,task.season_id,task.race_name); SELECT funding_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id; IF tax_rate>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('team',task.team),treasury,round(task.reward*tax_rate,2),'task-tax:'||task.id,'Manufacturer funding tax','5% manufacturer task income tax',task.season_id); END IF; UPDATE public.brl_bank_tasks SET status='completed' WHERE id=task.id; END IF;
  ELSE UPDATE public.brl_bank_tasks SET status='failed' WHERE id=task.id; END IF;
 END LOOP;
 SELECT count(*) INTO count_races FROM public.brl_bank_races br WHERE br.season_id=season_value AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(state->'tracks') tt WHERE tt->>'name'=br.race_name AND (tt->>'phase'='Preseason' OR tt->>'name' ILIKE 'Preseason%'));
 review_period:=count_races/3; IF count_races>0 AND now()>(SELECT max(((tt->>'date')||' 23:59')::timestamp AT TIME ZONE 'America/New_York') FROM jsonb_array_elements(state->'tracks') tt) THEN review_period:=ceil(count_races/3.0)+1; END IF;
 FOR a IN SELECT * FROM public.brl_bank_agreements WHERE season_id=season_value AND status='active' LOOP
  IF review_period>0 AND NOT EXISTS(SELECT 1 FROM public.brl_bank_reviews WHERE season_id=season_value AND team=a.team AND public.brl_bank_reviews.period=review_period) THEN
   pass:=true; review_detail:='Three-race expectation checkpoint'; progress:=least(1,count_races/20.0);
   FOR goal IN SELECT value FROM jsonb_array_elements(a.expectations) LOOP
    IF goal->>'metric'='camp_rank' THEN achieved:=public.brl_bank_camp_rank(season_value,a.team);IF coalesce(achieved,999)>(goal->>'target')::integer THEN pass:=false;END IF;END IF;
   END LOOP;
   review_detail:='Funding reviewed within '||a.manufacturer||'; average team points per driver start, no cross-manufacturer ranking';
   INSERT INTO public.brl_bank_reviews VALUES(season_value,a.team,review_period,pass,review_detail);
   IF NOT pass THEN UPDATE public.brl_bank_agreements SET failed_reviews=failed_reviews+1,good_reviews=0 WHERE id=a.id RETURNING * INTO a; PERFORM public.brl_bank_notice('review:'||a.id||':'||review_period,season_value,a.team,NULL,'Manufacturer performance warning','Missed agreed progress checkpoint. Owner corrective action required.');
    IF a.failed_reviews>=3 THEN PERFORM public.brl_bank_cut(a.id,least(30,(a.failed_reviews-2)*10),'Repeated failed performance checkpoints','review-cut:'||a.id||':'||review_period); END IF;
    IF a.failed_reviews>=6 THEN UPDATE public.brl_bank_agreements SET status='termination_review' WHERE id=a.id; INSERT INTO public.brl_bank_cases(season_id,team,kind,reason) VALUES(season_value,a.team,'termination','Six failed review periods: manufacturer requests termination'); END IF;
   ELSE UPDATE public.brl_bank_agreements SET good_reviews=good_reviews+1 WHERE id=a.id; PERFORM public.brl_bank_recover(a.id,'performance-recovery:'||a.id||':'||review_period);
   END IF;
  END IF;
  -- Offseason payroll default freezes signing and requests manufacturer termination.
  IF EXISTS(SELECT 1 FROM public.brl_bank_contracts c WHERE c.team=a.team AND c.season_id=season_value AND c.term_end<now()) AND EXISTS(SELECT 1 FROM public.brl_bank_payments pp WHERE pp.team=a.team AND pp.kind<>'loan' AND pp.status='scheduled' AND pp.due_at<now()) THEN UPDATE public.brl_bank_agreements SET status='termination_review' WHERE id=a.id; INSERT INTO public.brl_bank_cases(season_id,team,kind,reason) VALUES(season_value,a.team,'termination','Offseason unpaid driver compensation: credit obligation breach'); END IF;
 END LOOP;
 IF now()>(SELECT max(((tt->>'date')||' 23:59')::timestamp AT TIME ZONE 'America/New_York') FROM jsonb_array_elements(state->'tracks') tt WHERE coalesce(tt->>'phase','')<>'Preseason' AND tt->>'name' NOT ILIKE 'Preseason%') THEN
  SELECT asset_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id;
  FOR account_row IN SELECT * FROM public.brl_bank_accounts WHERE kind='team' LOOP
   taxable:=greatest(0,public.brl_bank_available(account_row.id)+account_row.asset_value);
   INSERT INTO public.brl_bank_tax_assessments(season_id,team,basis,amount) VALUES(season_value,account_row.subject,taxable,round(taxable*tax_rate,2)) ON CONFLICT DO NOTHING; GET DIAGNOSTICS missing=ROW_COUNT;
   IF missing>0 AND taxable*tax_rate>0 THEN PERFORM public.brl_bank_post(account_row.id,treasury,round(taxable*tax_rate,2),'asset-tax:'||season_value||':'||account_row.subject,'Asset tax','Annual tax on net owned assets; committed obligations excluded',season_value,NULL,true); END IF;
  END LOOP;
 END IF;
 RETURN jsonb_build_object('enabled',true,'paymentsPosted',done,'processedRaces',count_races);
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_read(account uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_accounts; BEGIN
 IF NOT public.brl_bank_account_allowed(account) THEN RAISE EXCEPTION 'This account is private.'; END IF;
 SELECT * INTO STRICT a FROM public.brl_bank_accounts WHERE id=account;
 RETURN jsonb_build_object('fundingPolicy',CASE WHEN a.kind='team' THEN (SELECT to_jsonb(g)||jsonb_build_object('campRank',public.brl_bank_camp_rank(g.season_id,g.team),'raceWeeks',public.brl_bank_race_count(g.season_id)) FROM public.brl_bank_agreements g WHERE g.team=a.subject AND g.season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league')) ELSE NULL END,'charters',CASE WHEN public.brl_full_admin() THEN coalesce((SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('filledSeats',public.brl_bank_seat_count(c.team),'plannedFunding',public.brl_bank_charter_amount(c.season_id,c.team),'fundedFunding',(SELECT g.base_funding FROM public.brl_bank_agreements g WHERE g.season_id=c.season_id AND g.team=c.team AND g.funded_at IS NOT NULL))) FROM public.brl_bank_charters c WHERE c.season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league')),'[]') ELSE '[]'::jsonb END,'manufacturerBudget',CASE WHEN a.kind='manufacturer' THEN jsonb_build_object('approved',(SELECT amount FROM public.brl_bank_manufacturer_budgets WHERE manufacturer=a.subject AND season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league')),'spent',public.brl_bank_manufacturer_spent(a.subject,(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league')),'remaining',public.brl_bank_manufacturer_cash(a.subject,(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league'))) ELSE NULL END,'manufacturerReserve',CASE WHEN a.kind='manufacturer' THEN public.brl_bank_funding_reserve(a.subject,(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league')) ELSE NULL END,'account',to_jsonb(a),'available',public.brl_bank_available(account),'credit',CASE WHEN a.kind='team' THEN public.brl_bank_credit(a.subject) ELSE NULL END,
 'transactions',coalesce((SELECT jsonb_agg(row) FROM (SELECT t.*,e.amount,e.balance_after FROM public.brl_bank_entries e JOIN public.brl_bank_transactions t ON t.id=e.transaction_id WHERE e.account_id=account ORDER BY t.created_at DESC,e.id DESC LIMIT 200) row),'[]'),
 'payments',coalesce((SELECT jsonb_agg(p ORDER BY p.due_at) FROM public.brl_bank_payments p WHERE (a.kind='team' AND p.team=a.subject) OR (a.kind='driver' AND p.driver_id=a.subject)),'[]'),
 'contracts',coalesce((SELECT jsonb_agg(c ORDER BY c.created_at DESC) FROM public.brl_bank_contracts c WHERE (a.kind='team' AND c.team=a.subject) OR (a.kind='driver' AND c.driver_id=a.subject)),'[]'),
 'reportCard',CASE WHEN a.kind='driver' THEN jsonb_build_object('missedMedia',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='media' AND status='approved'),'noCallNoShow',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='attendance' AND status='approved'),'confirmedDnfs',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='dnf' AND status='approved' AND coalesce(payload->>'excused','false')<>'true'),'conduct',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='conduct' AND status='approved')) ELSE NULL END,
 'agreements',coalesce((SELECT jsonb_agg(g) FROM public.brl_bank_agreements g WHERE a.kind='team' AND g.team=a.subject),'[]'),
 'tasks',coalesce((SELECT jsonb_agg(t ORDER BY t.created_at DESC) FROM public.brl_bank_tasks t WHERE a.kind='team' AND t.team=a.subject),'[]'),
 'notices',coalesce((SELECT jsonb_agg(n) FROM (SELECT * FROM public.brl_bank_notices WHERE (a.kind='team' AND team=a.subject) OR (a.kind='driver' AND driver_id=a.subject) OR (a.kind='treasury' AND public.brl_full_admin() AND team IS NULL AND driver_id IS NULL) ORDER BY created_at DESC LIMIT 30) n),'[]'),
 'cases',coalesce((SELECT jsonb_agg(c ORDER BY c.created_at DESC) FROM public.brl_bank_cases c WHERE (a.kind='team' AND c.team=a.subject) OR (a.kind='driver' AND c.driver_id=a.subject)),'[]'));
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_task_offer(team_value text,race_value text,title_value text,description_value text,metric_value text,target_value integer,reward_value numeric,deadline_value timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_agreements; reserved numeric; cash numeric; manufacturer_account uuid; BEGIN
 IF coalesce(current_setting('role',true),'')<>'service_role' AND NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Manufacturer worker required.'; END IF;
 SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE team=team_value AND season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') AND status='active' FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.brl_bank_races WHERE season_id=a.season_id AND race_name=race_value) THEN RAISE EXCEPTION 'Task cannot be offered for a settled race.'; END IF;
 manufacturer_account:=public.brl_bank_account('manufacturer',a.manufacturer); PERFORM id FROM public.brl_bank_accounts WHERE id=manufacturer_account FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') t WHERE l.season_name='irl-league' AND t->>'name'=race_value AND deadline_value=((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York') THEN RAISE EXCEPTION 'Task must match a scheduled race and its acceptance deadline.'; END IF;
 IF target_value>(SELECT count(*) FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=team_value AND coalesce(rr->>'retired','false')<>'true') THEN RAISE EXCEPTION 'Task exceeds active roster size.'; END IF;
 IF metric_value NOT IN('wins','top5','top10') OR target_value<1 OR target_value>4 OR reward_value NOT IN(5000,10000,15000,20000,25000) OR deadline_value<=now() OR length(title_value)>160 OR length(description_value)>1000 THEN RAISE EXCEPTION 'Task exceeds manufacturer rules.'; END IF;
 reserved:=public.brl_bank_funding_reserve(a.manufacturer,a.season_id);
 cash:=public.brl_bank_manufacturer_cash(a.manufacturer,a.season_id);
 IF coalesce(cash,0)-reserved<reward_value OR coalesce((SELECT sum(reward) FROM public.brl_bank_tasks WHERE season_id=a.season_id AND manufacturer=a.manufacturer AND status IN('offered','accepted','completed')),0)+reward_value>(SELECT task_budget FROM public.brl_bank_funding_policy) THEN RAISE EXCEPTION 'Manufacturer task budget or protected funding allocation exhausted.'; END IF;
 INSERT INTO public.brl_bank_tasks(season_id,team,manufacturer,race_name,title,description,metric,target,reward,deadline,event_key) VALUES(a.season_id,a.team,a.manufacturer,race_value,title_value,description_value,metric_value,target_value,reward_value,deadline_value,'manufacturer-task:'||a.season_id||':'||a.team||':'||race_value) ON CONFLICT DO NOTHING;
 PERFORM public.brl_bank_notice('task-offer:'||a.season_id||':'||a.team||':'||race_value,a.season_id,a.team,NULL,'Manufacturer challenge offered',title_value||'. Accept or decline before qualifying. Reward '||reward_value||' credits; no failure fine.');
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_task_candidates() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE state jsonb; result jsonb; BEGIN
 IF coalesce(current_setting('role',true),'')<>'service_role' AND NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Manufacturer worker required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RETURN '[]'; END IF;
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league';
 SELECT coalesce(jsonb_agg(row),'[]') INTO result FROM (SELECT a.team,a.manufacturer,a.expectations,t->>'name' AS race_name,((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York' AS deadline FROM public.brl_bank_agreements a CROSS JOIN LATERAL jsonb_array_elements(state->'tracks') t WHERE a.season_id=state->>'activeSeasonId' AND a.status='active' AND a.charter_tier IS NOT NULL AND coalesce((SELECT sum(reward) FROM public.brl_bank_tasks WHERE season_id=a.season_id AND manufacturer=a.manufacturer AND status IN('offered','accepted','completed')),0)<(SELECT task_budget FROM public.brl_bank_funding_policy) AND ((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York' BETWEEN now() AND now()+interval '7 days' AND NOT EXISTS(SELECT 1 FROM public.brl_bank_tasks x WHERE x.season_id=a.season_id AND x.team=a.team AND x.race_name=t->>'name') AND NOT EXISTS(SELECT 1 FROM public.brl_bank_races br WHERE br.season_id=a.season_id AND br.race_name=t->>'name') AND public.brl_bank_manufacturer_cash(a.manufacturer,a.season_id)-public.brl_bank_funding_reserve(a.manufacturer,a.season_id)>=5000 ORDER BY t->>'date',a.team LIMIT 1) row;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_move(season_value text,driver_value text,team_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE m text; BEGIN IF team_value NOT IN('Independent','IND') AND EXISTS(SELECT 1 FROM public.brl_bank_charters c WHERE c.season_id=season_value AND c.team=team_value AND public.brl_bank_seat_count(team_value)+(CASE WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'id'=driver_value AND d->>'team'=team_value) THEN 0 ELSE 1 END)>c.capacity) THEN RAISE EXCEPTION 'Destination charter has no available seats.';END IF; SELECT manufacturer INTO m FROM public.brl_bank_agreements WHERE season_id=season_value AND team=team_value AND status<>'dropped'; UPDATE public.league_state SET updated_at=now(),data=jsonb_set(data,'{seasons}',(SELECT jsonb_agg(CASE WHEN sn->>'id'=season_value THEN jsonb_set(sn,'{drivers}',(SELECT jsonb_agg(CASE WHEN d->>'id'=driver_value THEN d||jsonb_build_object('team',team_value,'manufacturer',coalesce(m,''),'manufacturerLogo',NULL) ELSE d END) FROM jsonb_array_elements(sn->'drivers') d)) ELSE sn END) FROM jsonb_array_elements(data->'seasons') sn)) WHERE season_name='irl-league'; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_decide(case_id uuid,approve boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.brl_bank_cases; c public.brl_bank_contracts; a public.brl_bank_agreements; value numeric; remaining numeric; earned numeric; paid_salary numeric; account_id uuid; period_end timestamptz; j integer; result jsonb; forecast numeric; roster_count integer; race_count integer;
BEGIN
 IF NOT public.brl_full_admin() AND coalesce(current_setting('role',true),'')<>'service_role' THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 SELECT * INTO STRICT q FROM public.brl_bank_cases WHERE id=case_id FOR UPDATE;
 IF q.status<>'pending' THEN RAISE EXCEPTION 'Request already decided.'; END IF;
 IF NOT approve THEN UPDATE public.brl_bank_cases SET status='denied',resolved_at=now() WHERE id=q.id; RETURN; END IF;
 SELECT * INTO a FROM public.brl_bank_agreements WHERE season_id=q.season_id AND team=q.team;
 IF q.kind='loan' THEN
  result:=public.brl_bank_credit(q.team);
  IF (result->>'score')::integer<40 OR q.amount<=0 OR q.amount>250000 THEN RAISE EXCEPTION 'Loan requires credit score 40+, maximum $250,000.'; END IF;
  SELECT count(*) INTO roster_count FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=q.team AND coalesce(rr->>'retired','false')<>'true';
  SELECT count(*) INTO race_count FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') tt WHERE l.season_name='irl-league' AND (tt->>'date')::date BETWEEN current_date AND current_date+30;
  SELECT balance+roster_count*race_count*greatest(0,coalesce((SELECT weekly_per_seat FROM public.brl_bank_agreements WHERE team=q.team AND season_id=q.season_id AND status='active'),0)*.95-10000*19.0/public.brl_bank_race_count(q.season_id))-coalesce((SELECT sum(amount-paid) FROM public.brl_bank_payments WHERE team=q.team AND status='scheduled' AND due_at<=now()+interval '30 days'),0) INTO forecast FROM public.brl_bank_accounts WHERE kind='team' AND subject=q.team;
  IF coalesce(forecast,0)<round(q.amount*1.1/3,2) THEN RAISE EXCEPTION 'Projected cash after payroll cannot support the first loan installment.'; END IF;
  value:=q.amount; PERFORM public.brl_bank_post(public.brl_bank_account('treasury','league'),public.brl_bank_account('team',q.team),value,'loan:'||q.id,'Loan','Approved team loan',q.season_id);
  FOR j IN 1..3 LOOP INSERT INTO public.brl_bank_payments(season_id,team,kind,amount,due_at,event_key,description) VALUES(q.season_id,q.team,'loan',CASE WHEN j=3 THEN round(value*1.1,2)-2*round(value*1.1/3,2) ELSE round(value*1.1/3,2) END,now()+j*interval '30 days','loan:'||q.id||':'||j,'Loan installment including 10% fixed-term interest'); END LOOP;
 ELSIF q.kind IN ('release','buyout','reduction','trade') THEN
  SELECT * INTO STRICT c FROM public.brl_bank_contracts WHERE id::text=q.payload->>'contract_id' AND team=q.team FOR UPDATE;
  IF c.status<>'active' THEN RAISE EXCEPTION 'Contract is not active.'; END IF;
  remaining:=public.brl_bank_unearned(c.id); IF remaining IS NULL THEN RAISE EXCEPTION 'Contract term dates are required.'; END IF;
  SELECT coalesce(sum(paid),0) INTO paid_salary FROM public.brl_bank_payments WHERE contract_id=c.id AND kind='salary'; earned:=c.total-remaining;
  IF q.kind='trade' THEN
   IF q.driver_agreed_at IS NULL THEN RAISE EXCEPTION 'No-trade protection requires driver consent.'; END IF;
   IF coalesce(q.payload->>'destination_team','')='' THEN RAISE EXCEPTION 'Destination team required.'; END IF;
   IF EXISTS(SELECT 1 FROM public.brl_bank_payments WHERE team=q.payload->>'destination_team' AND status='scheduled' AND due_at<now()) THEN RAISE EXCEPTION 'Destination team is under a signing freeze.'; END IF;
   IF (SELECT coalesce(sum(amount-paid),0) FROM public.brl_bank_payments WHERE contract_id=c.id AND status='scheduled')>public.brl_bank_available(public.brl_bank_account('team',q.payload->>'destination_team')) THEN RAISE EXCEPTION 'Destination cannot fund the contract.'; END IF;
   IF (SELECT count(*) FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=q.payload->>'destination_team' AND coalesce(rr->>'retired','false')<>'true')>=4 THEN RAISE EXCEPTION 'Destination team has four drivers.'; END IF;
   PERFORM public.brl_bank_move(c.season_id,c.driver_id,q.payload->>'destination_team');
   UPDATE public.brl_bank_contracts SET team=q.payload->>'destination_team' WHERE id=c.id;
   UPDATE public.brl_bank_payments SET team=q.payload->>'destination_team' WHERE contract_id=c.id AND status='scheduled';
  ELSIF q.kind='reduction' THEN
   IF q.driver_agreed_at IS NULL THEN RAISE EXCEPTION 'Driver must agree to the reduction.'; END IF;
   IF now()<=c.term_end OR q.amount<=0 OR q.amount>c.total*.1 THEN RAISE EXCEPTION 'Offseason reduction must be positive and at most 10%% of agreed total compensation.'; END IF;
   IF EXISTS(SELECT 1 FROM public.brl_bank_cases WHERE driver_id=c.driver_id AND kind='reduction' AND status='approved') THEN RAISE EXCEPTION 'One-time reduction has already been used.'; END IF;
   -- A reduction authorizes a lower future offer, never confiscates earned pay.
   PERFORM public.brl_bank_notice('reduction:'||q.id,q.season_id,q.team,c.driver_id,'Future pay reduction approved','Maximum next-contract reduction authorized: '||q.amount||'. Existing earned compensation remains owed.');
  ELSE
   IF q.kind='buyout' THEN PERFORM public.brl_bank_post(public.brl_bank_account('driver',c.driver_id),public.brl_bank_account('team',c.team),round(remaining*1.5,2),'buyout:'||q.id,'Buyout','Driver early-exit buyout',c.season_id); value:=greatest(0,earned-paid_salary);
   ELSE value:=greatest(0,earned+remaining*.5-paid_salary); END IF;
   UPDATE public.brl_bank_payments SET status='cancelled' WHERE contract_id=c.id AND status='scheduled';
   IF value>0 THEN INSERT INTO public.brl_bank_payments(contract_id,season_id,team,driver_id,kind,amount,due_at,event_key,description) VALUES(c.id,c.season_id,c.team,c.driver_id,'settlement',round(value,2),now(),'release:'||q.id,'Early release: earned arrears plus agreed settlement'); END IF;
   UPDATE public.brl_bank_contracts SET status='released' WHERE id=c.id;
   -- Record roster release through the official league state, preserving race snapshots.
   UPDATE public.league_state SET updated_at=now(),data=jsonb_set(data,'{seasons}',(SELECT jsonb_agg(CASE WHEN sn->>'id'=c.season_id THEN jsonb_set(sn,'{drivers}',(SELECT jsonb_agg(CASE WHEN d->>'id'=c.driver_id THEN d||jsonb_build_object('team','Independent') ELSE d END) FROM jsonb_array_elements(sn->'drivers') d)) ELSE sn END) FROM jsonb_array_elements(data->'seasons') sn)) WHERE season_name='irl-league';
  END IF;
 ELSIF q.kind='bankruptcy' THEN
  IF q.payload->>'chapter' NOT IN ('7','13') THEN RAISE EXCEPTION 'Choose Chapter 7 closure or Chapter 13 repayment plan.'; END IF;
  IF q.payload->>'chapter'='7' THEN
   FOR c IN SELECT * FROM public.brl_bank_contracts WHERE team=q.team AND status='active' FOR UPDATE LOOP
    remaining:=coalesce(public.brl_bank_unearned(c.id),c.total); SELECT coalesce(sum(paid),0) INTO paid_salary FROM public.brl_bank_payments WHERE contract_id=c.id AND kind='salary'; value:=greatest(0,c.total-remaining+remaining*.5-paid_salary);
    UPDATE public.brl_bank_payments SET status='cancelled' WHERE contract_id=c.id AND status='scheduled';
    IF value>0 THEN INSERT INTO public.brl_bank_payments(contract_id,season_id,team,driver_id,kind,amount,due_at,event_key,description) VALUES(c.id,c.season_id,c.team,c.driver_id,'settlement',round(value,2),now(),'chapter7:'||q.id||':'||c.id,'Chapter 7 driver compensation claim'); END IF;
    UPDATE public.brl_bank_contracts SET status='released' WHERE id=c.id; IF c.role<>'owner' THEN PERFORM public.brl_bank_move(c.season_id,c.driver_id,'Independent'); END IF;
   END LOOP;
   UPDATE public.brl_bank_agreements SET status='dropped' WHERE id=a.id;
  END IF;
  PERFORM public.brl_bank_notice('bankruptcy:'||q.id,q.season_id,q.team,NULL,'Bankruptcy approved',CASE WHEN q.payload->>'chapter'='7' THEN 'Closure: driver claims remain payable pending admin settlement. No new contracts.' ELSE 'Restructuring: approved repayment plan required; existing driver debt and point restrictions remain.' END);
 ELSIF q.kind='termination' THEN
  UPDATE public.brl_bank_agreements SET status='dropped' WHERE id=a.id;
  UPDATE public.league_state SET updated_at=now(),data=jsonb_set(data,'{seasons}',(SELECT jsonb_agg(CASE WHEN sn->>'id'=q.season_id THEN jsonb_set(sn,'{drivers}',(SELECT jsonb_agg(CASE WHEN d->>'team'=q.team THEN d||jsonb_build_object('manufacturer','','manufacturerLogo',NULL) ELSE d END) FROM jsonb_array_elements(sn->'drivers') d)) ELSE sn END) FROM jsonb_array_elements(data->'seasons') sn)) WHERE season_name='irl-league';
  PERFORM public.brl_bank_notice('termination:'||q.id,q.season_id,q.team,NULL,'Manufacturer partnership terminated',q.reason||'. Unpaid driver obligations remain owed.');
 ELSIF q.kind IN('attendance','media') THEN
  IF q.payload->>'excused'='true' THEN UPDATE public.brl_bank_cases SET status='resolved',resolved_at=now() WHERE id=q.id; RETURN; END IF;
  SELECT count(*)+1 INTO j FROM public.brl_bank_cases WHERE team=q.team AND season_id=q.season_id AND kind IN('attendance','media','dnf') AND status='approved' AND coalesce(payload->>'excused','false')<>'true';
  PERFORM public.brl_bank_notice('attendance:'||q.id,q.season_id,q.team,q.driver_id,CASE WHEN q.kind='media' THEN 'Missed contractual media obligation' ELSE 'Unacceptable no-call/no-show' END,q.reason||'. Season team incidents: '||j||'. Owner corrective action required.');
  IF j>=6 AND a.id IS NOT NULL AND a.status='active' THEN UPDATE public.brl_bank_agreements SET status='termination_review' WHERE id=a.id; INSERT INTO public.brl_bank_cases(season_id,team,kind,reason) VALUES(q.season_id,q.team,'termination','Repeated confirmed attendance/media breaches'); END IF;
  IF j>=3 AND a.id IS NOT NULL THEN PERFORM public.brl_bank_cut(a.id,least(30,(j-2)*10),'Repeated no-call/no-shows','attendance-cut:'||q.id); END IF;
 ELSIF q.kind='dnf' THEN
  IF q.payload->>'excused'='true' THEN
   IF EXISTS(SELECT 1 FROM public.brl_bank_transactions WHERE event_key='dnf:'||q.season_id||':'||q.race_name||':'||q.driver_id) THEN PERFORM public.brl_bank_post(public.brl_bank_account('treasury','league'),public.brl_bank_account('team',q.team),50000,'dnf-excuse:'||q.season_id||':'||q.race_name||':'||q.driver_id,'Correction','Approved internet/power DNF fee exemption',q.season_id,q.race_name,true); END IF;
  ELSE
   PERFORM public.brl_bank_notice('dnf-conduct:'||q.id,q.season_id,q.team,q.driver_id,'Manufacturer reliability warning','Confirmed voluntary DNF. Owner must address race commitment; the incident remains on the driver report card.');
   SELECT count(*)+1 INTO j FROM public.brl_bank_cases WHERE team=q.team AND season_id=q.season_id AND kind IN('attendance','media','dnf') AND status='approved' AND coalesce(payload->>'excused','false')<>'true';
   IF j>=3 AND a.id IS NOT NULL THEN PERFORM public.brl_bank_cut(a.id,least(30,(j-2)*10),'Repeated confirmed commitment breaches','attendance-cut:'||q.id); END IF;
   IF j>=6 AND a.id IS NOT NULL AND a.status='active' THEN UPDATE public.brl_bank_agreements SET status='termination_review' WHERE id=a.id; INSERT INTO public.brl_bank_cases(season_id,team,kind,reason) VALUES(q.season_id,q.team,'termination','Repeated confirmed commitment breaches'); END IF;
   SELECT * INTO c FROM public.brl_bank_contracts WHERE season_id=q.season_id AND driver_id=q.driver_id AND team=q.team AND status='active' AND role<>'owner';
   IF c.dnf_share>0 AND EXISTS(SELECT 1 FROM public.brl_bank_transactions WHERE event_key='dnf:'||q.season_id||':'||q.race_name||':'||q.driver_id) AND NOT EXISTS(SELECT 1 FROM public.brl_bank_transactions WHERE event_key='dnf-excuse:'||q.season_id||':'||q.race_name||':'||q.driver_id) THEN PERFORM public.brl_bank_post(public.brl_bank_account('driver',q.driver_id),public.brl_bank_account('team',q.team),round(50000*c.dnf_share,2),'dnf-share:'||q.season_id||':'||q.race_name||':'||q.driver_id,'DNF reimbursement','Contracted share of the actual team DNF fee',q.season_id,q.race_name,true); END IF;
  END IF;
 ELSIF q.kind='conduct' THEN
  IF q.amount<=0 OR q.amount>50000 THEN RAISE EXCEPTION 'Conduct fine must be $1–$50,000.'; END IF;
  PERFORM public.brl_bank_post(public.brl_bank_account('driver',q.driver_id),public.brl_bank_account('treasury','league'),q.amount,'conduct:'||q.id,'Conduct fine',q.reason,q.season_id,q.race_name,true);
 END IF;
 UPDATE public.brl_bank_cases SET status='approved',resolved_at=now() WHERE id=q.id;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_recover(agreement uuid,key_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_agreements; refund numeric; source uuid; tax numeric; BEGIN SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE id=agreement FOR UPDATE; IF a.good_reviews<2 OR a.performance_cut=0 THEN RETURN; END IF; refund:=round(a.base_funding*greatest(0,a.cut_percent-a.discipline_cut)/100,2); source:=public.brl_bank_account('manufacturer',a.manufacturer); IF refund>0 AND a.funded_at IS NOT NULL THEN IF public.brl_bank_manufacturer_cash(a.manufacturer,a.season_id)-public.brl_bank_vacancy_reserve(a.manufacturer,a.season_id)<refund THEN RETURN; END IF; PERFORM public.brl_bank_post(source,public.brl_bank_account('team',a.team),refund,key_value,'Performance funding restored','Two successful performance checkpoints; disciplinary cuts remain',a.season_id); SELECT funding_tax_rate INTO tax FROM public.brl_bank_settings WHERE id; IF tax>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('team',a.team),public.brl_bank_account('treasury','league'),round(refund*tax,2),key_value||':tax','Manufacturer funding tax','Tax on restored manufacturer funding',a.season_id); END IF; END IF; UPDATE public.brl_bank_agreements SET performance_cut=0,cut_percent=discipline_cut,failed_reviews=0 WHERE id=a.id; PERFORM public.brl_bank_notice(key_value||':notice',a.season_id,a.team,NULL,'Performance standing restored','Two successful performance checkpoints. Confirmed attendance/media violations and their funding cuts remain on record.'); END; $$;

CREATE OR REPLACE FUNCTION public.brl_bank_transfer(team_value text,destination_team text,value numeric,reason_value text,reference uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN RAISE EXCEPTION 'Direct team funding is disabled. Manufacturer earnings, protected loans and contract buyouts use their dedicated workflows.'; END; $$;
ALTER TABLE public.brl_bank_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_bank_funding_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brl_bank_manufacturer_budgets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.brl_bank_charters,public.brl_bank_funding_policy,public.brl_bank_manufacturer_budgets FROM anon,authenticated;
DO $$ DECLARE f record;BEGIN FOR f IN SELECT p.oid::regprocedure sig,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN('brl_bank_team_code','brl_bank_seat_count','brl_bank_race_count','brl_bank_camp_rank','brl_bank_rank_bonus','brl_bank_vacancy_reserve','brl_bank_funding_reserve','brl_bank_prepare_charters','brl_bank_assign_charter','brl_bank_bonus','brl_bank_block_paint_payout','brl_bank_block_state_paint_awards','brl_bank_charter_amount','brl_bank_apply_charter_funding','brl_bank_manufacturer_spent','brl_bank_manufacturer_cash') LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.sig);EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.sig);
 IF f.proname IN('brl_bank_assign_charter','brl_bank_bonus','brl_bank_apply_charter_funding') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig);END IF;
END LOOP;END $$;
-- Preparation is reversible. Installing this update does not move money.
UPDATE public.brl_bank_settings SET enabled=false WHERE id;
COMMIT;
