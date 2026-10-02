BEGIN;
CREATE TABLE IF NOT EXISTS public.brl_bank_settings(id boolean PRIMARY KEY DEFAULT true CHECK(id),enabled boolean NOT NULL DEFAULT false,career_expense_rate numeric NOT NULL DEFAULT 0 CHECK(career_expense_rate BETWEEN 0 AND 1),created_at timestamptz DEFAULT now());
INSERT INTO public.brl_bank_settings(id) VALUES(true) ON CONFLICT DO NOTHING;
ALTER TABLE public.brl_bank_settings ADD COLUMN IF NOT EXISTS activated_at timestamptz;
ALTER TABLE public.brl_bank_settings ADD COLUMN IF NOT EXISTS driver_tax_rate numeric NOT NULL DEFAULT .05 CHECK(driver_tax_rate BETWEEN 0 AND 1);
ALTER TABLE public.brl_bank_settings ADD COLUMN IF NOT EXISTS funding_tax_rate numeric NOT NULL DEFAULT .05 CHECK(funding_tax_rate BETWEEN 0 AND 1);
ALTER TABLE public.brl_bank_settings ADD COLUMN IF NOT EXISTS asset_tax_rate numeric NOT NULL DEFAULT .05 CHECK(asset_tax_rate BETWEEN 0 AND 1);
CREATE TABLE IF NOT EXISTS public.brl_bank_accounts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),kind text NOT NULL CHECK(kind IN ('team','driver','manufacturer','treasury','external')),subject text NOT NULL,name text NOT NULL,balance numeric(18,2) NOT NULL DEFAULT 0,UNIQUE(kind,subject));
ALTER TABLE public.brl_bank_accounts ADD COLUMN IF NOT EXISTS asset_value numeric(18,2) NOT NULL DEFAULT 0 CHECK(asset_value>=0);
CREATE TABLE IF NOT EXISTS public.brl_bank_transactions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_key text NOT NULL UNIQUE,category text NOT NULL,description text NOT NULL,season_id text,race_name text,created_at timestamptz NOT NULL DEFAULT now(),actor uuid,metadata jsonb NOT NULL DEFAULT '{}');
CREATE TABLE IF NOT EXISTS public.brl_bank_entries(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,transaction_id uuid NOT NULL REFERENCES public.brl_bank_transactions(id),account_id uuid NOT NULL REFERENCES public.brl_bank_accounts(id),amount numeric(18,2) NOT NULL,balance_after numeric(18,2) NOT NULL,UNIQUE(transaction_id,account_id));
CREATE TABLE IF NOT EXISTS public.brl_bank_contracts(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id text NOT NULL,team text NOT NULL,driver_id text NOT NULL,driver_name text NOT NULL,role text NOT NULL CHECK(role IN ('driver','franchise','owner')),total numeric(18,2) NOT NULL CHECK(total>0),schedule_type text NOT NULL CHECK(schedule_type IN ('lump','three','weekly')),schedule jsonb NOT NULL,no_trade boolean NOT NULL DEFAULT true,dnf_share numeric NOT NULL DEFAULT 0 CHECK(dnf_share BETWEEN 0 AND .5),status text NOT NULL DEFAULT 'offered' CHECK(status IN ('offered','active','declined','released','expired')),created_by uuid,accepted_at timestamptz,created_at timestamptz DEFAULT now());
ALTER TABLE public.brl_bank_contracts DROP CONSTRAINT IF EXISTS brl_bank_contracts_season_id_driver_id_role_key;
CREATE UNIQUE INDEX IF NOT EXISTS brl_bank_live_contract ON public.brl_bank_contracts(season_id,driver_id,role) WHERE status IN('offered','active');
CREATE TABLE IF NOT EXISTS public.brl_bank_payments(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),contract_id uuid REFERENCES public.brl_bank_contracts(id),season_id text NOT NULL,team text NOT NULL,driver_id text,kind text NOT NULL CHECK(kind IN ('salary','bonus','settlement','loan')),amount numeric(18,2) NOT NULL CHECK(amount>0),paid numeric(18,2) NOT NULL DEFAULT 0 CHECK(paid>=0 AND paid<=amount),due_at timestamptz NOT NULL,paid_at timestamptz,event_key text NOT NULL UNIQUE,status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','paid','cancelled')),description text NOT NULL,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.brl_bank_agreements(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id text NOT NULL,team text NOT NULL,manufacturer text NOT NULL,base_funding numeric(18,2) NOT NULL CHECK(base_funding>=0),funding_at timestamptz NOT NULL,funded_at timestamptz,cut_percent integer NOT NULL DEFAULT 0 CHECK(cut_percent BETWEEN 0 AND 30),failed_reviews integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','termination_review','dropped')),expectations jsonb NOT NULL DEFAULT '[]',UNIQUE(season_id,team));
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS performance_cut integer NOT NULL DEFAULT 0;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS discipline_cut integer NOT NULL DEFAULT 0;
ALTER TABLE public.brl_bank_agreements ADD COLUMN IF NOT EXISTS good_reviews integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS public.brl_bank_tasks(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id text NOT NULL,team text NOT NULL,manufacturer text NOT NULL,race_name text NOT NULL,title text NOT NULL,description text NOT NULL,metric text NOT NULL CHECK(metric IN ('wins','top5','top10','media')),target integer NOT NULL CHECK(target BETWEEN 1 AND 4),reward numeric(18,2) NOT NULL CHECK(reward BETWEEN 5000 AND 25000),deadline timestamptz NOT NULL,status text NOT NULL DEFAULT 'offered' CHECK(status IN ('offered','accepted','declined','completed','failed','expired')),accepted_at timestamptz,event_key text NOT NULL UNIQUE,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.brl_bank_cases(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id text NOT NULL,team text NOT NULL,driver_id text,race_name text,kind text NOT NULL CHECK(kind IN ('media','attendance','dnf','conduct','loan','bankruptcy','release','buyout','reduction','termination','trade')),status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','denied','resolved')),amount numeric(18,2) NOT NULL DEFAULT 0,payload jsonb NOT NULL DEFAULT '{}',reason text NOT NULL,created_by uuid,created_at timestamptz DEFAULT now(),resolved_at timestamptz);
ALTER TABLE public.brl_bank_cases DROP CONSTRAINT IF EXISTS brl_bank_cases_kind_check;
ALTER TABLE public.brl_bank_cases ADD CONSTRAINT brl_bank_cases_kind_check CHECK(kind IN('media','attendance','dnf','conduct','loan','bankruptcy','release','buyout','reduction','termination','trade'));
CREATE UNIQUE INDEX IF NOT EXISTS brl_bank_media_once ON public.brl_bank_cases(season_id,driver_id,race_name,(payload->>'media_kind')) WHERE kind='media';
CREATE UNIQUE INDEX IF NOT EXISTS brl_bank_dnf_once ON public.brl_bank_cases(season_id,driver_id,race_name) WHERE kind='dnf';
CREATE UNIQUE INDEX IF NOT EXISTS brl_bank_attendance_once ON public.brl_bank_cases(season_id,driver_id,race_name) WHERE kind='attendance';
CREATE TABLE IF NOT EXISTS public.brl_bank_notices(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),season_id text,team text,driver_id text,title text NOT NULL,detail text NOT NULL,event_key text NOT NULL UNIQUE,created_at timestamptz DEFAULT now());
CREATE TABLE IF NOT EXISTS public.brl_bank_races(season_id text NOT NULL,race_name text NOT NULL,started_at timestamptz NOT NULL,snapshot jsonb NOT NULL,processed_at timestamptz DEFAULT now(),PRIMARY KEY(season_id,race_name));
CREATE TABLE IF NOT EXISTS public.brl_bank_reviews(season_id text NOT NULL,team text NOT NULL,period integer NOT NULL,passed boolean NOT NULL,detail text NOT NULL,PRIMARY KEY(season_id,team,period));
CREATE INDEX IF NOT EXISTS brl_bank_due ON public.brl_bank_payments(due_at) WHERE status='scheduled';
CREATE OR REPLACE FUNCTION public.brl_bank_my_driver() RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT driver_id FROM public.brl_accounts WHERE auth_user_id=auth.uid() AND active $$;
CREATE OR REPLACE FUNCTION public.brl_bank_account_allowed(account uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT EXISTS(SELECT 1 FROM public.brl_bank_accounts a WHERE a.id=account AND(public.brl_full_admin() OR (a.kind='team' AND public.brl_can_team(a.subject)) OR (a.kind='driver' AND a.subject=public.brl_bank_my_driver()) OR a.kind='treasury')) $$;
CREATE OR REPLACE FUNCTION public.brl_bank_account(kind_value text,subject_value text,label text DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result uuid; BEGIN INSERT INTO public.brl_bank_accounts(kind,subject,name) VALUES(kind_value,subject_value,coalesce(label,subject_value)) ON CONFLICT(kind,subject) DO NOTHING; SELECT id INTO result FROM public.brl_bank_accounts WHERE kind=kind_value AND subject=subject_value; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_post(source uuid,destination uuid,value numeric,key_value text,category_value text,description_value text,season_value text DEFAULT NULL,race_value text DEFAULT NULL,overdraft boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tx uuid; available numeric; from_kind text;
BEGIN
 IF source=destination OR value<=0 OR value<>round(value,2) THEN RAISE EXCEPTION 'Invalid transfer.'; END IF;
 -- All transfers lock the same account order; unique event keys make retries safe.
 PERFORM id FROM public.brl_bank_accounts WHERE id IN(source,destination) ORDER BY id FOR UPDATE;
 SELECT id INTO tx FROM public.brl_bank_transactions WHERE event_key=key_value; IF FOUND THEN RETURN tx; END IF;
 SELECT balance,kind INTO STRICT available,from_kind FROM public.brl_bank_accounts WHERE id=source;
 IF available<value AND NOT overdraft AND from_kind<>'external' THEN RAISE EXCEPTION 'Insufficient funds.'; END IF;
 INSERT INTO public.brl_bank_transactions(event_key,category,description,season_id,race_name,actor) VALUES(key_value,category_value,description_value,season_value,race_value,auth.uid()) RETURNING id INTO tx;
 UPDATE public.brl_bank_accounts SET balance=balance-value WHERE id=source;
 UPDATE public.brl_bank_accounts SET balance=balance+value WHERE id=destination;
 INSERT INTO public.brl_bank_entries(transaction_id,account_id,amount,balance_after) SELECT tx,id,CASE WHEN id=source THEN -value ELSE value END,balance FROM public.brl_bank_accounts WHERE id IN(source,destination);
 RETURN tx;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_available(account uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT a.balance-coalesce((SELECT sum(p.amount-p.paid) FROM public.brl_bank_payments p WHERE p.team=a.subject AND a.kind='team' AND p.status='scheduled'),0) FROM public.brl_bank_accounts a WHERE a.id=account $$;
CREATE OR REPLACE FUNCTION public.brl_bank_seed(team_or_kind text,subject_value text,value numeric,label text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF; IF team_or_kind NOT IN ('team','driver','manufacturer','treasury') THEN RAISE EXCEPTION 'Invalid account.'; END IF; PERFORM public.brl_bank_post(public.brl_bank_account('external','opening'),public.brl_bank_account(team_or_kind,subject_value,label),value,'opening:'||team_or_kind||':'||subject_value,'Opening balance','Approved opening balance'); END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_offer(season_value text,team_value text,driver_value text,role_value text,total_value numeric,method text,payment_schedule jsonb,share numeric DEFAULT 0) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result uuid; name_value text; count_value integer; total_schedule numeric; floor_value numeric;
BEGIN
 IF NOT public.brl_can_team(team_value) THEN RAISE EXCEPTION 'Team ownership required.'; END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_payments WHERE team=team_value AND status='scheduled' AND due_at<now() AND paid<amount) THEN RAISE EXCEPTION 'Signing frozen: pay overdue driver obligations first.'; END IF;
 IF season_value<>(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') THEN RAISE EXCEPTION 'Contract must belong to the active season.'; END IF;
 SELECT d->>'name' INTO name_value FROM jsonb_array_elements(public.brl_roster()) d WHERE d->>'id'=driver_value;
 IF name_value IS NULL THEN RAISE EXCEPTION 'Driver not found.'; END IF;
 IF role_value NOT IN ('driver','franchise','owner') THEN RAISE EXCEPTION 'Invalid contract role.'; END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_cases WHERE team=team_value AND kind='bankruptcy' AND status='approved') THEN RAISE EXCEPTION 'Bankruptcy signing freeze requires admin resolution.'; END IF;
 floor_value:=CASE role_value WHEN 'franchise' THEN 750000 WHEN 'owner' THEN 500000 ELSE 250000 END;
 IF total_value<floor_value AND NOT EXISTS(SELECT 1 FROM public.brl_bank_cases rq JOIN public.brl_bank_contracts prior ON prior.id::text=rq.payload->>'contract_id' WHERE rq.driver_id=driver_value AND rq.kind='reduction' AND rq.status='approved' AND prior.role=role_value AND total_value>=prior.total-rq.amount AND total_value>=floor_value*.9) THEN RAISE EXCEPTION 'Below the salary floor.'; END IF;
 IF role_value='owner' AND NOT EXISTS(SELECT 1 FROM public.team_owner_assignments WHERE team=team_value AND owner_driver_id=driver_value) THEN RAISE EXCEPTION 'Management compensation belongs to the assigned owner.'; END IF;
 IF role_value='franchise' AND EXISTS(SELECT 1 FROM public.team_owner_assignments WHERE team=team_value AND owner_driver_id=driver_value) THEN RAISE EXCEPTION 'Franchise driver must be a non-owner.'; END IF;
 IF jsonb_typeof(payment_schedule)<>'array' THEN RAISE EXCEPTION 'Payment schedule required.'; END IF;
 SELECT count(*),sum((p->>'amount')::numeric) INTO count_value,total_schedule FROM jsonb_array_elements(payment_schedule) p;
 IF total_schedule<>total_value OR count_value<1 OR (method='lump' AND count_value<>1) OR (method='three' AND count_value<>3) OR method NOT IN ('lump','three','weekly') THEN RAISE EXCEPTION 'Scheduled payments must equal total compensation and match the method.'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(payment_schedule) p WHERE (p->>'amount')::numeric<=0 OR (p->>'amount')::numeric<>round((p->>'amount')::numeric,2) OR (p->>'due_at')::timestamptz<now()) THEN RAISE EXCEPTION 'Amounts must be positive, with future payment dates.'; END IF;
 IF (SELECT count(DISTINCT p->>'due_at') FROM jsonb_array_elements(payment_schedule) p)<>count_value THEN RAISE EXCEPTION 'Installment dates must be distinct.'; END IF;
 IF method='weekly' AND EXISTS(SELECT 1 FROM (SELECT (p->>'due_at')::timestamptz dt,lag((p->>'due_at')::timestamptz) OVER(ORDER BY (p->>'due_at')::timestamptz) prior FROM jsonb_array_elements(payment_schedule) p) q WHERE prior IS NOT NULL AND dt-prior<>interval '7 days') THEN RAISE EXCEPTION 'Weekly payments must be seven days apart.'; END IF;
 IF total_value>public.brl_bank_available(public.brl_bank_account('team',team_value)) THEN RAISE EXCEPTION 'Insufficient uncommitted funds to reserve this contract.'; END IF;
 INSERT INTO public.brl_bank_contracts(season_id,team,driver_id,driver_name,role,total,schedule_type,schedule,dnf_share,created_by) VALUES(season_value,team_value,driver_value,name_value,role_value,total_value,method,payment_schedule,share,auth.uid()) RETURNING id INTO result;
 UPDATE public.brl_bank_contracts SET term_start=(SELECT min(((t->>'date')||' 00:00')::timestamp AT TIME ZONE 'America/New_York') FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') t WHERE l.season_name='irl-league' AND coalesce(t->>'phase','')<>'Preseason' AND t->>'name' NOT ILIKE 'Preseason%'),term_end=(SELECT max(((t->>'date')||' 23:59')::timestamp AT TIME ZONE 'America/New_York') FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') t WHERE l.season_name='irl-league' AND coalesce(t->>'phase','')<>'Preseason' AND t->>'name' NOT ILIKE 'Preseason%') WHERE id=result;
 PERFORM public.brl_bank_notice('contract-offer:'||result,season_value,team_value,driver_value,'Contract offer awaiting your decision','Review '||role_value||' compensation of '||total_value||' and every payment date before accepting.');
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_move(season_value text,driver_value text,team_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE m text; BEGIN SELECT manufacturer INTO m FROM public.brl_bank_agreements WHERE season_id=season_value AND team=team_value AND status<>'dropped'; UPDATE public.league_state SET updated_at=now(),data=jsonb_set(data,'{seasons}',(SELECT jsonb_agg(CASE WHEN sn->>'id'=season_value THEN jsonb_set(sn,'{drivers}',(SELECT jsonb_agg(CASE WHEN d->>'id'=driver_value THEN d||jsonb_build_object('team',team_value,'manufacturer',coalesce(m,''),'manufacturerLogo',NULL) ELSE d END) FROM jsonb_array_elements(sn->'drivers') d)) ELSE sn END) FROM jsonb_array_elements(data->'seasons') sn)) WHERE season_name='irl-league'; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_accept(contract uuid,accept boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE c public.brl_bank_contracts; p jsonb; a uuid; BEGIN
 SELECT * INTO STRICT c FROM public.brl_bank_contracts WHERE id=contract FOR UPDATE;
 IF c.driver_id<>public.brl_bank_my_driver() THEN RAISE EXCEPTION 'Only the named driver can agree to compensation.'; END IF;
 IF c.status<>'offered' THEN RAISE EXCEPTION 'Offer already answered.'; END IF;
 IF NOT accept THEN UPDATE public.brl_bank_contracts SET status='declined' WHERE id=contract; RETURN; END IF;
 a:=public.brl_bank_account('team',c.team); PERFORM id FROM public.brl_bank_accounts WHERE id=a FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.brl_bank_payments WHERE team=c.team AND status='scheduled' AND due_at<now()) THEN RAISE EXCEPTION 'Signing frozen for overdue compensation.'; END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_cases WHERE team=c.team AND kind='bankruptcy' AND status='approved') THEN RAISE EXCEPTION 'Bankruptcy signing freeze.'; END IF;
 IF c.total>public.brl_bank_available(a) THEN RAISE EXCEPTION 'Team no longer has enough available funds.'; END IF;
 IF c.role<>'owner' AND EXISTS(SELECT 1 FROM public.brl_bank_contracts WHERE season_id=c.season_id AND driver_id=c.driver_id AND role IN('driver','franchise') AND status='active') THEN RAISE EXCEPTION 'Driver already has an active contract.'; END IF;
 IF c.role<>'owner' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'id'=c.driver_id AND rr->>'team'=c.team) AND (SELECT count(*) FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=c.team AND coalesce(rr->>'retired','false')<>'true')>=4 THEN RAISE EXCEPTION 'Team already has four drivers.'; END IF;
 UPDATE public.brl_bank_contracts SET status='active',accepted_at=now() WHERE id=c.id;
 FOR p IN SELECT value FROM jsonb_array_elements(c.schedule) LOOP
 INSERT INTO public.brl_bank_payments(contract_id,season_id,team,driver_id,kind,amount,due_at,event_key,description) VALUES(c.id,c.season_id,c.team,c.driver_id,'salary',(p->>'amount')::numeric,(p->>'due_at')::timestamptz,'salary:'||c.id||':'||(p->>'due_at'),c.role||' salary: '||c.driver_name);
 END LOOP;
 IF c.role<>'owner' THEN PERFORM public.brl_bank_move(c.season_id,c.driver_id,c.team); END IF;
 PERFORM public.brl_bank_notice('contract-accepted:'||c.id,c.season_id,c.team,c.driver_id,'Compensation agreement accepted','Payments will run on the agreed dates. Total compensation reserved: '||c.total);
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_pay(payment uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE p public.brl_bank_payments; src uuid; dst uuid; tx uuid; rate numeric; tax_rate numeric; BEGIN
 SELECT * INTO STRICT p FROM public.brl_bank_payments WHERE id=payment FOR UPDATE;
 IF p.status<>'scheduled' THEN RETURN false; END IF;
 src:=public.brl_bank_account('team',p.team); dst:=CASE WHEN p.kind='loan' THEN public.brl_bank_account('treasury','league') ELSE public.brl_bank_account('driver',p.driver_id) END;
 PERFORM id FROM public.brl_bank_accounts WHERE id IN(src,dst) ORDER BY id FOR UPDATE;
 IF (SELECT balance FROM public.brl_bank_accounts WHERE id=src)<p.amount-p.paid THEN RETURN false; END IF;
 tx:=public.brl_bank_post(src,dst,p.amount-p.paid,p.event_key,'Payroll',p.description,p.season_id);
 IF p.kind IN ('salary','bonus','settlement') THEN SELECT driver_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id; IF tax_rate>0 THEN PERFORM public.brl_bank_post(dst,public.brl_bank_account('treasury','league'),round((p.amount-p.paid)*tax_rate,2),p.event_key||':tax','Income tax','5% personal income tax',p.season_id); END IF; SELECT career_expense_rate INTO rate FROM public.brl_bank_settings WHERE id; IF rate>0 THEN PERFORM public.brl_bank_post(dst,public.brl_bank_account('external','career'),round((p.amount-p.paid)*rate,2),p.event_key||':career','Career expenses','Contract income career expenses',p.season_id); END IF; END IF;
 UPDATE public.brl_bank_payments SET paid=amount,status='paid',paid_at=now() WHERE id=p.id; RETURN true;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_credit(team_value text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ DECLARE late integer; historical_late integer; good integer; debt numeric; assets numeric; roster_score integer; score integer; BEGIN
 SELECT count(*) FILTER(WHERE status='scheduled' AND due_at<now()),count(*) FILTER(WHERE status='paid' AND paid_at<=due_at) INTO late,good FROM public.brl_bank_payments WHERE team=team_value;
 SELECT count(*) INTO historical_late FROM public.brl_bank_payments WHERE team=team_value AND status='paid' AND paid_at>due_at;
 SELECT coalesce(sum(amount-paid),0) INTO debt FROM public.brl_bank_payments WHERE team=team_value AND status='scheduled';
 SELECT coalesce(balance+asset_value,0) INTO assets FROM public.brl_bank_accounts WHERE kind='team' AND subject=team_value;
 SELECT coalesce(sum(least(10,coalesce((d->>'wins')::integer,0)*2+coalesce((d->>'top5')::integer,0))),0) INTO roster_score FROM jsonb_array_elements(public.brl_roster()) d WHERE EXISTS(SELECT 1 FROM public.brl_bank_contracts c WHERE c.driver_id=d->>'id' AND c.team=team_value AND c.status='active' AND c.role<>'owner');
 score:=greatest(0,least(100,65+least(good,10)+least(roster_score,15)+CASE WHEN assets>debt THEN 10 ELSE 0 END-late*20-least(historical_late*5,25)-(SELECT count(*)*10 FROM public.brl_bank_cases WHERE team=team_value AND kind='bankruptcy' AND status='approved')));
 RETURN jsonb_build_object('score',score,'grade',CASE WHEN score>=90 THEN 'A' WHEN score>=75 THEN 'B' WHEN score>=60 THEN 'C' WHEN score>=40 THEN 'D' ELSE 'F' END,'overdue',late,'committed',debt,'cash',assets,'rosterStrength',roster_score);
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_request(team_value text,kind_value text,reason_value text,amount_value numeric DEFAULT 0,details jsonb DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result uuid; drv text:=public.brl_bank_my_driver(); BEGIN
 IF NOT public.brl_can_team(team_value) AND NOT(kind_value='buyout' AND EXISTS(SELECT 1 FROM public.brl_bank_contracts WHERE id::text=details->>'contract_id' AND driver_id=drv AND team=team_value AND status='active')) THEN RAISE EXCEPTION 'Team ownership or named contract driver required.'; END IF;
 IF kind_value NOT IN ('loan','bankruptcy','release','buyout','reduction','trade') OR length(trim(reason_value))<3 THEN RAISE EXCEPTION 'Request and reason required.'; END IF;
 INSERT INTO public.brl_bank_cases(season_id,team,driver_id,kind,amount,payload,reason,created_by) SELECT data->>'activeSeasonId',team_value,coalesce((SELECT driver_id FROM public.brl_bank_contracts WHERE id::text=details->>'contract_id' AND team=team_value),drv),kind_value,amount_value,details,reason_value,auth.uid() FROM public.league_state WHERE season_name='irl-league' RETURNING id INTO result; RETURN result;
END; $$;
ALTER TABLE public.brl_bank_contracts ADD COLUMN IF NOT EXISTS term_start timestamptz;
ALTER TABLE public.brl_bank_contracts ADD COLUMN IF NOT EXISTS term_end timestamptz;
ALTER TABLE public.brl_bank_cases ADD COLUMN IF NOT EXISTS driver_agreed_at timestamptz;
CREATE OR REPLACE FUNCTION public.brl_bank_unearned(contract uuid) RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT round(total*greatest(0,least(1,extract(epoch FROM(term_end-now()))/nullif(extract(epoch FROM(term_end-term_start)),0))),2) FROM public.brl_bank_contracts WHERE id=contract $$;
CREATE OR REPLACE FUNCTION public.brl_bank_consent(case_id uuid,agree boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE c public.brl_bank_cases; BEGIN SELECT * INTO STRICT c FROM public.brl_bank_cases WHERE id=case_id FOR UPDATE; IF c.driver_id<>public.brl_bank_my_driver() OR c.kind NOT IN ('reduction','trade') OR c.status<>'pending' THEN RAISE EXCEPTION 'Only the named driver can answer this request.'; END IF; UPDATE public.brl_bank_cases SET driver_agreed_at=CASE WHEN agree THEN now() ELSE NULL END,status=CASE WHEN agree THEN 'pending' ELSE 'denied' END WHERE id=case_id; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_agreement(season_value text,team_value text,manufacturer_value text,funding numeric,funding_date timestamptz,goals jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 IF manufacturer_value NOT IN ('Toyota','Ford','Chevrolet') OR funding<0 OR jsonb_typeof(goals)<>'array' THEN RAISE EXCEPTION 'Invalid agreement.'; END IF;
 IF EXISTS(SELECT 1 FROM public.brl_bank_agreements WHERE season_id=season_value AND team=team_value AND funded_at IS NOT NULL) THEN RAISE EXCEPTION 'Funded agreements cannot be overwritten.'; END IF;
 INSERT INTO public.brl_bank_agreements(season_id,team,manufacturer,base_funding,funding_at,expectations) VALUES(season_value,team_value,manufacturer_value,funding,funding_date,goals) ON CONFLICT(season_id,team) DO UPDATE SET manufacturer=excluded.manufacturer,base_funding=excluded.base_funding,funding_at=excluded.funding_at,expectations=excluded.expectations;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_notice(key_value text,season_value text,team_value text,driver_value text,title_value text,detail_value text) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ INSERT INTO public.brl_bank_notices(event_key,season_id,team,driver_id,title,detail) VALUES(key_value,season_value,team_value,driver_value,title_value,detail_value) ON CONFLICT DO NOTHING $$;
CREATE OR REPLACE FUNCTION public.brl_bank_cut(agreement uuid,desired integer,reason_value text,key_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_agreements; diff numeric; tax numeric; BEGIN
 SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE id=agreement FOR UPDATE;
 IF key_value LIKE 'attendance-cut:%' THEN UPDATE public.brl_bank_agreements SET discipline_cut=greatest(discipline_cut,least(30,desired)) WHERE id=a.id; ELSE UPDATE public.brl_bank_agreements SET performance_cut=greatest(performance_cut,least(30,desired)) WHERE id=a.id; END IF; SELECT greatest(performance_cut,discipline_cut) INTO desired FROM public.brl_bank_agreements WHERE id=a.id; diff:=round(a.base_funding*(desired-a.cut_percent)/100,2);
 IF diff>0 AND a.funded_at IS NOT NULL THEN PERFORM public.brl_bank_post(public.brl_bank_account('team',a.team),public.brl_bank_account('manufacturer',a.manufacturer),diff,key_value,'Manufacturer clawback',reason_value,a.season_id,NULL,true); SELECT funding_tax_rate INTO tax FROM public.brl_bank_settings WHERE id; IF tax>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('treasury','league'),public.brl_bank_account('team',a.team),round(diff*tax,2),key_value||':tax-refund','Funding tax adjustment','Tax credit for returned manufacturer funding',a.season_id,NULL,true); END IF; END IF;
 UPDATE public.brl_bank_agreements SET cut_percent=desired WHERE id=a.id;
 PERFORM public.brl_bank_notice(key_value||':notice',a.season_id,a.team,NULL,'Manufacturer funding reduced',reason_value||' · Base funding reduction: '||desired||'%. Attendance reductions do not automatically recover.');
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_recover(agreement uuid,key_value text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_agreements; refund numeric; source uuid; tax numeric; BEGIN SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE id=agreement FOR UPDATE; IF a.good_reviews<2 OR a.performance_cut=0 THEN RETURN; END IF; refund:=round(a.base_funding*greatest(0,a.cut_percent-a.discipline_cut)/100,2); source:=public.brl_bank_account('manufacturer',a.manufacturer); IF refund>0 AND a.funded_at IS NOT NULL THEN IF (SELECT balance FROM public.brl_bank_accounts WHERE id=source)<refund THEN RETURN; END IF; PERFORM public.brl_bank_post(source,public.brl_bank_account('team',a.team),refund,key_value,'Performance funding restored','Two successful performance checkpoints; disciplinary cuts remain',a.season_id); SELECT funding_tax_rate INTO tax FROM public.brl_bank_settings WHERE id; IF tax>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('team',a.team),public.brl_bank_account('treasury','league'),round(refund*tax,2),key_value||':tax','Manufacturer funding tax','Tax on restored manufacturer funding',a.season_id); END IF; END IF; UPDATE public.brl_bank_agreements SET performance_cut=0,cut_percent=discipline_cut,failed_reviews=0 WHERE id=a.id; PERFORM public.brl_bank_notice(key_value||':notice',a.season_id,a.team,NULL,'Performance standing restored','Two successful performance checkpoints. Confirmed attendance/media violations and their funding cuts remain on record.'); END; $$;
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
  SELECT balance+roster_count*race_count*15000-coalesce((SELECT sum(amount-paid) FROM public.brl_bank_payments WHERE team=q.team AND status='scheduled' AND due_at<=now()+interval '30 days'),0) INTO forecast FROM public.brl_bank_accounts WHERE kind='team' AND subject=q.team;
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
CREATE OR REPLACE FUNCTION public.brl_bank_admin_case(team_value text,driver_value text,race_value text,kind_value text,reason_value text,amount_value numeric DEFAULT 0,details jsonb DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE result uuid; BEGIN IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF; INSERT INTO public.brl_bank_cases(season_id,team,driver_id,race_name,kind,reason,amount,payload,created_by) SELECT data->>'activeSeasonId',team_value,driver_value,race_value,kind_value,reason_value,amount_value,details,auth.uid() FROM public.league_state WHERE season_name='irl-league' RETURNING id INTO result; RETURN result; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_accept_task(task uuid,accept boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE t public.brl_bank_tasks; BEGIN SELECT * INTO STRICT t FROM public.brl_bank_tasks WHERE id=task FOR UPDATE; IF NOT public.brl_can_team(t.team) THEN RAISE EXCEPTION 'Team ownership required.'; END IF; IF t.status<>'offered' OR t.deadline<=now() THEN RAISE EXCEPTION 'Offer closed.'; END IF; IF accept AND (SELECT count(*) FROM public.brl_bank_tasks WHERE team=t.team AND status='accepted')>=2 THEN RAISE EXCEPTION 'Two active task limit.'; END IF; UPDATE public.brl_bank_tasks SET status=CASE WHEN accept THEN 'accepted' ELSE 'declined' END,accepted_at=CASE WHEN accept THEN now() ELSE NULL END WHERE id=t.id; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_stamp_race() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sn jsonb; old_sn jsonb; race jsonb; old_race jsonb; r jsonb; d jsonb; team_value text; started timestamptz; amended jsonb; races jsonb; seasons jsonb:='[]'; roster jsonb; points numeric;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RETURN NEW; END IF;
 FOR sn IN SELECT value FROM jsonb_array_elements(coalesce(NEW.data->'seasons','[]')) LOOP
  IF sn->>'id'<>NEW.data->>'activeSeasonId' THEN seasons:=seasons||jsonb_build_array(sn); CONTINUE; END IF;
  SELECT value INTO old_sn FROM jsonb_array_elements(coalesce(OLD.data->'seasons','[]')) WHERE value->>'id'=sn->>'id'; races:='[]';
  FOR race IN SELECT value FROM jsonb_array_elements(coalesce(sn->'raceHistory','[]')) LOOP
   SELECT value INTO old_race FROM jsonb_array_elements(coalesce(old_sn->'raceHistory','[]')) WHERE value->>'raceName'=race->>'raceName';
   started:=coalesce((old_race->>'startedAt')::timestamptz,(race->>'startedAt')::timestamptz,(SELECT ((t->>'date')||' 21:30:00')::timestamp AT TIME ZONE 'America/New_York' FROM jsonb_array_elements(coalesce(NEW.data->'tracks','[]')) t WHERE t->>'name'=race->>'raceName' AND t->>'date' ~ '^\d{4}-\d{2}-\d{2}$' LIMIT 1),(race->>'postedAt')::timestamptz,(race->>'savedAt')::timestamptz,now()); amended:='[]';
   FOR r IN SELECT value FROM jsonb_array_elements(coalesce(race->'results','[]')) LOOP
    team_value:=coalesce(r->>'team',(SELECT dd->>'team' FROM jsonb_array_elements(coalesce(sn->'drivers','[]')) dd WHERE dd->>'id'=r->>'driverId' LIMIT 1),'Independent');
    r:=r||jsonb_build_object('team',team_value);
    IF coalesce(r->>'dnf','false')='true' THEN r:=r||jsonb_build_object('totalRacePoints',0,'finishPoints',0,'stage1Points',0,'stage2Points',0,'stage3Points',0,'fastestLapPoints',0,'isWin',false,'isTop3',false,'isTop5',false); END IF;
    IF old_race IS NOT NULL AND (SELECT rr ? 'teamPointsEligible' FROM jsonb_array_elements(coalesce(old_race->'results','[]')) rr WHERE rr->>'driverId'=r->>'driverId' LIMIT 1) THEN
     r:=r||jsonb_build_object('teamPointsEligible',(SELECT (rr->>'teamPointsEligible')::boolean FROM jsonb_array_elements(old_race->'results') rr WHERE rr->>'driverId'=r->>'driverId' LIMIT 1));
    ELSE
     r:=r||jsonb_build_object('teamPointsEligible',NOT EXISTS(SELECT 1 FROM public.brl_bank_payments p WHERE p.team=team_value AND p.kind IN('salary','bonus','settlement') AND p.status<>'cancelled' AND p.due_at<started AND (p.paid_at IS NULL OR p.paid_at>started)));
    END IF;
    r:=r||jsonb_build_object('teamPoints',CASE WHEN (r->>'teamPointsEligible')::boolean THEN coalesce((r->>'totalRacePoints')::numeric,0) ELSE 0 END); amended:=amended||jsonb_build_array(r);
   END LOOP;
   race:=race||jsonb_build_object('results',amended,'startedAt',started); races:=races||jsonb_build_array(race);
  END LOOP;
  roster:='[]'; FOR d IN SELECT value FROM jsonb_array_elements(coalesce(sn->'drivers','[]')) LOOP
   SELECT coalesce(sum((rr->>'totalRacePoints')::numeric),0) INTO points FROM jsonb_array_elements(races) rc CROSS JOIN LATERAL jsonb_array_elements(rc->'results') rr WHERE rr->>'driverId'=d->>'id';
   d:=d||jsonb_build_object('points',points,'wins',(SELECT count(*) FROM jsonb_array_elements(races) rc CROSS JOIN LATERAL jsonb_array_elements(rc->'results') rr WHERE rr->>'driverId'=d->>'id' AND rr->>'isWin'='true'),'top3',(SELECT count(*) FROM jsonb_array_elements(races) rc CROSS JOIN LATERAL jsonb_array_elements(rc->'results') rr WHERE rr->>'driverId'=d->>'id' AND rr->>'isTop3'='true'),'top5',(SELECT count(*) FROM jsonb_array_elements(races) rc CROSS JOIN LATERAL jsonb_array_elements(rc->'results') rr WHERE rr->>'driverId'=d->>'id' AND rr->>'isTop5'='true')); roster:=roster||jsonb_build_array(d);
  END LOOP;
  seasons:=seasons||jsonb_build_array(sn||jsonb_build_object('raceHistory',races,'drivers',roster));
 END LOOP;
 NEW.data:=jsonb_set(NEW.data,'{seasons}',seasons); RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS brl_bank_score_rules ON public.league_state;
CREATE TRIGGER brl_bank_score_rules BEFORE UPDATE ON public.league_state FOR EACH ROW EXECUTE FUNCTION public.brl_bank_stamp_race();
CREATE TABLE IF NOT EXISTS public.brl_bank_tax_assessments(season_id text NOT NULL,team text NOT NULL,basis numeric NOT NULL,amount numeric NOT NULL,assessed_at timestamptz DEFAULT now(),PRIMARY KEY(season_id,team));
CREATE OR REPLACE FUNCTION public.brl_bank_tick() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE state jsonb; sn jsonb; race jsonb; t jsonb; r jsonb; d jsonb; a public.brl_bank_agreements; p public.brl_bank_payments; task public.brl_bank_tasks; src uuid; dest uuid; treasury uuid; season_value text; team_value text; prize numeric; done integer:=0; fresh boolean; count_races integer; review_period integer; progress numeric; achieved numeric; goal jsonb; pass boolean; review_detail text; next_date date; media_due timestamptz; missing integer; tax_rate numeric; taxable numeric; account_row public.brl_bank_accounts; rankings jsonb; qid uuid; obligation record; due_time timestamptz; required_purse numeric; expected_fees numeric;
BEGIN
 IF NOT public.brl_full_admin() AND coalesce(current_setting('role',true),'')<>'service_role' THEN RAISE EXCEPTION 'Full admin or worker required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RETURN jsonb_build_object('enabled',false); END IF;
 PERFORM pg_advisory_xact_lock(61004001);
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league'; season_value:=state->>'activeSeasonId';
 SELECT value INTO sn FROM jsonb_array_elements(coalesce(state->'seasons','[]')) WHERE value->>'id'=season_value;
 treasury:=public.brl_bank_account('treasury','league','League Treasury');
 FOR a IN SELECT * FROM public.brl_bank_agreements WHERE funded_at IS NULL AND status='active' AND funding_at<=now() LOOP
  src:=public.brl_bank_account('manufacturer',a.manufacturer); dest:=public.brl_bank_account('team',a.team);
  IF (SELECT balance FROM public.brl_bank_accounts WHERE id=src)>=round(a.base_funding*(1-a.cut_percent/100.0),2) THEN
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
  SELECT coalesce(sum(20000+CASE WHEN rr->>'dnf'='true' THEN 0 ELSE 5000+CASE WHEN (rr->>'finishPos')::integer=1 THEN 20000 WHEN (rr->>'finishPos')::integer BETWEEN 2 AND 3 THEN 10000 WHEN (rr->>'finishPos')::integer BETWEEN 4 AND 5 THEN 7500 WHEN (rr->>'finishPos')::integer BETWEEN 6 AND 10 THEN 5000 WHEN (rr->>'finishPos')::integer BETWEEN 11 AND 15 THEN 2000 ELSE 0 END END),0),coalesce(sum(10000+CASE WHEN rr->>'dnf'='true' THEN 50000 ELSE 0 END),0) INTO required_purse,expected_fees FROM jsonb_array_elements(race->'results') rr;
  IF (SELECT balance FROM public.brl_bank_accounts WHERE id=treasury)+expected_fees<required_purse THEN PERFORM public.brl_bank_notice('treasury-budget:'||season_value||':'||(race->>'raceName'),season_value,NULL,NULL,'Race payout awaiting treasury budget','Approve adequate treasury funding before race finances can settle. Payroll processing continues.'); CONTINUE; END IF;
  INSERT INTO public.brl_bank_races(season_id,race_name,started_at,snapshot) VALUES(season_value,race->>'raceName',coalesce((race->>'startedAt')::timestamptz,now()),race) ON CONFLICT DO NOTHING; GET DIAGNOSTICS count_races=ROW_COUNT;
  IF count_races=0 THEN CONTINUE; END IF;
  FOR r IN SELECT value FROM jsonb_array_elements(race->'results') LOOP
   team_value:=coalesce(r->>'team','Independent'); dest:=public.brl_bank_account('team',team_value);
   PERFORM public.brl_bank_post(dest,treasury,10000,'entry:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'Entry fee','Race entry',season_value,race->>'raceName',true);
   IF r->>'dnf'='true' THEN
    PERFORM public.brl_bank_post(dest,treasury,50000,'dnf:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'DNF fee','Driver quit/disconnected: no points',season_value,race->>'raceName',true);
    INSERT INTO public.brl_bank_cases(season_id,team,driver_id,race_name,kind,reason) VALUES(season_value,team_value,r->>'driverId',race->>'raceName','dnf','Confirm voluntary quitting or approved internet/power exemption');
   END IF;
   prize:=20000+CASE WHEN r->>'dnf'='true' THEN 0 ELSE 5000+CASE WHEN (r->>'finishPos')::integer=1 THEN 20000 WHEN (r->>'finishPos')::integer BETWEEN 2 AND 3 THEN 10000 WHEN (r->>'finishPos')::integer BETWEEN 4 AND 5 THEN 7500 WHEN (r->>'finishPos')::integer BETWEEN 6 AND 10 THEN 5000 WHEN (r->>'finishPos')::integer BETWEEN 11 AND 15 THEN 2000 ELSE 0 END END;
   PERFORM public.brl_bank_post(treasury,dest,prize,'purse:'||season_value||':'||(race->>'raceName')||':'||(r->>'driverId'),'Race purse','Approved race payout',season_value,race->>'raceName');
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
   src:=public.brl_bank_account('manufacturer',task.manufacturer); IF (SELECT balance FROM public.brl_bank_accounts WHERE id=src)>=task.reward THEN PERFORM public.brl_bank_post(src,public.brl_bank_account('team',task.team),task.reward,'task:'||task.id,'Manufacturer task',task.title,task.season_id,task.race_name); SELECT funding_tax_rate INTO tax_rate FROM public.brl_bank_settings WHERE id; IF tax_rate>0 THEN PERFORM public.brl_bank_post(public.brl_bank_account('team',task.team),treasury,round(task.reward*tax_rate,2),'task-tax:'||task.id,'Manufacturer funding tax','5% manufacturer task income tax',task.season_id); END IF; UPDATE public.brl_bank_tasks SET status='completed' WHERE id=task.id; END IF;
  ELSE UPDATE public.brl_bank_tasks SET status='failed' WHERE id=task.id; END IF;
 END LOOP;
 SELECT count(*) INTO count_races FROM public.brl_bank_races br WHERE br.season_id=season_value AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(state->'tracks') tt WHERE tt->>'name'=br.race_name AND (tt->>'phase'='Preseason' OR tt->>'name' ILIKE 'Preseason%'));
 review_period:=count_races/3; IF count_races>0 AND now()>(SELECT max(((tt->>'date')||' 23:59')::timestamp AT TIME ZONE 'America/New_York') FROM jsonb_array_elements(state->'tracks') tt) THEN review_period:=ceil(count_races/3.0)+1; END IF;
 FOR a IN SELECT * FROM public.brl_bank_agreements WHERE season_id=season_value AND status='active' LOOP
  IF review_period>0 AND NOT EXISTS(SELECT 1 FROM public.brl_bank_reviews WHERE season_id=season_value AND team=a.team AND public.brl_bank_reviews.period=review_period) THEN
   pass:=true; review_detail:='Three-race expectation checkpoint'; progress:=least(1,count_races/20.0);
   FOR goal IN SELECT value FROM jsonb_array_elements(a.expectations) LOOP
    IF goal->>'metric' IN('chase','team_rank','team_championship') THEN
     IF goal->>'metric'='chase' AND now()>(SELECT min(((tt->>'date')||' 00:00')::timestamp AT TIME ZONE 'America/New_York') FROM jsonb_array_elements(state->'tracks') tt WHERE tt->>'phase'='Chase') THEN
      SELECT count(*) INTO achieved FROM public.brl_bank_milestones ms JOIN LATERAL jsonb_array_elements(public.brl_roster()) dd ON dd->>'id'=ms.driver_id WHERE ms.season_id=season_value AND ms.chase_qualified AND dd->>'team'=a.team; IF achieved<(goal->>'target')::integer THEN pass:=false; END IF;
     ELSIF goal->>'metric' IN('team_rank','team_championship') AND now()>(SELECT max(((tt->>'date')||' 23:59')::timestamp AT TIME ZONE 'America/New_York') FROM jsonb_array_elements(state->'tracks') tt) THEN
      SELECT rank INTO achieved FROM (SELECT team,rank() OVER(ORDER BY points DESC,wins DESC) rank FROM (SELECT rr->>'team' team,sum(coalesce((rr->>'teamPoints')::numeric,(rr->>'totalRacePoints')::numeric,0)) points,count(*) FILTER(WHERE rr->>'isWin'='true') wins FROM public.brl_bank_races br CROSS JOIN LATERAL jsonb_array_elements(br.snapshot->'results') rr WHERE br.season_id=season_value GROUP BY rr->>'team') scores) ranks WHERE team=a.team;
      IF coalesce(achieved,999)>(CASE WHEN goal->>'metric'='team_championship' THEN 1 ELSE (goal->>'target')::integer END) THEN pass:=false; END IF;
     END IF;
    END IF;

    IF goal->>'metric' IN('wins','top5','top10') THEN
     SELECT count(*) INTO achieved FROM public.brl_bank_races br CROSS JOIN LATERAL jsonb_array_elements(br.snapshot->'results') rr WHERE br.season_id=season_value AND rr->>'team'=a.team AND coalesce(rr->>'dnf','false')<>'true' AND CASE goal->>'metric' WHEN 'wins' THEN (rr->>'finishPos')::integer=1 WHEN 'top5' THEN (rr->>'finishPos')::integer BETWEEN 1 AND 5 ELSE (rr->>'finishPos')::integer BETWEEN 1 AND 10 END;
     IF achieved<floor((goal->>'target')::numeric*progress) THEN pass:=false; END IF;
    END IF;
   END LOOP;
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
CREATE TABLE IF NOT EXISTS public.brl_bank_milestones(season_id text NOT NULL,driver_id text NOT NULL,chase_qualified boolean NOT NULL DEFAULT false,PRIMARY KEY(season_id,driver_id));
CREATE OR REPLACE FUNCTION public.brl_bank_public_goals() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT coalesce(jsonb_agg(jsonb_build_object('team',team,'manufacturer',manufacturer,'expectations',expectations,'status',status,'performanceWarnings',failed_reviews)),'[]') FROM public.brl_bank_agreements WHERE season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') AND status<>'dropped' $$;
CREATE OR REPLACE FUNCTION public.brl_bank_task_offer(team_value text,race_value text,title_value text,description_value text,metric_value text,target_value integer,reward_value numeric,deadline_value timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_agreements; reserved numeric; cash numeric; manufacturer_account uuid; BEGIN
 IF coalesce(current_setting('role',true),'')<>'service_role' AND NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Manufacturer worker required.'; END IF;
 SELECT * INTO STRICT a FROM public.brl_bank_agreements WHERE team=team_value AND season_id=(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') AND status='active' FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.brl_bank_races WHERE season_id=a.season_id AND race_name=race_value) THEN RAISE EXCEPTION 'Task cannot be offered for a settled race.'; END IF;
 manufacturer_account:=public.brl_bank_account('manufacturer',a.manufacturer); PERFORM id FROM public.brl_bank_accounts WHERE id=manufacturer_account FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'tracks') t WHERE l.season_name='irl-league' AND t->>'name'=race_value AND deadline_value=((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York') THEN RAISE EXCEPTION 'Task must match a scheduled race and its acceptance deadline.'; END IF;
 IF target_value>(SELECT count(*) FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=team_value AND coalesce(rr->>'retired','false')<>'true') THEN RAISE EXCEPTION 'Task exceeds active roster size.'; END IF;
 IF metric_value NOT IN('wins','top5','top10') OR target_value<1 OR target_value>4 OR reward_value NOT IN(5000,10000,15000,20000,25000) OR deadline_value<=now() OR length(title_value)>160 OR length(description_value)>1000 THEN RAISE EXCEPTION 'Task exceeds manufacturer rules.'; END IF;
 SELECT coalesce(sum(reward),0) INTO reserved FROM public.brl_bank_tasks WHERE manufacturer=a.manufacturer AND status IN('offered','accepted'); SELECT reserved+coalesce(sum(base_funding*(1-cut_percent/100.0)),0) INTO reserved FROM public.brl_bank_agreements WHERE manufacturer=a.manufacturer AND funded_at IS NULL AND status='active';
 SELECT balance INTO cash FROM public.brl_bank_accounts WHERE kind='manufacturer' AND subject=a.manufacturer;
 IF coalesce(cash,0)-reserved<reward_value THEN RAISE EXCEPTION 'Manufacturer cannot reserve the task reward.'; END IF;
 INSERT INTO public.brl_bank_tasks(season_id,team,manufacturer,race_name,title,description,metric,target,reward,deadline,event_key) VALUES(a.season_id,a.team,a.manufacturer,race_value,title_value,description_value,metric_value,target_value,reward_value,deadline_value,'manufacturer-task:'||a.season_id||':'||a.team||':'||race_value) ON CONFLICT DO NOTHING;
 PERFORM public.brl_bank_notice('task-offer:'||a.season_id||':'||a.team||':'||race_value,a.season_id,a.team,NULL,'Manufacturer challenge offered',title_value||'. Accept or decline before qualifying. Reward '||reward_value||' credits; no failure fine.');
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_task_candidates() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE state jsonb; result jsonb; BEGIN
 IF coalesce(current_setting('role',true),'')<>'service_role' AND NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Manufacturer worker required.'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND enabled) THEN RETURN '[]'; END IF;
 SELECT data INTO state FROM public.league_state WHERE season_name='irl-league';
 SELECT coalesce(jsonb_agg(row),'[]') INTO result FROM (SELECT a.team,a.manufacturer,a.expectations,t->>'name' AS race_name,((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York' AS deadline FROM public.brl_bank_agreements a CROSS JOIN LATERAL jsonb_array_elements(state->'tracks') t WHERE a.season_id=state->>'activeSeasonId' AND a.status='active' AND ((t->>'date')||' 21:00')::timestamp AT TIME ZONE 'America/New_York' BETWEEN now() AND now()+interval '7 days' AND NOT EXISTS(SELECT 1 FROM public.brl_bank_tasks x WHERE x.season_id=a.season_id AND x.team=a.team AND x.race_name=t->>'name') AND NOT EXISTS(SELECT 1 FROM public.brl_bank_races br WHERE br.season_id=a.season_id AND br.race_name=t->>'name') AND (SELECT balance FROM public.brl_bank_accounts WHERE kind='manufacturer' AND subject=a.manufacturer)-coalesce((SELECT sum(reward) FROM public.brl_bank_tasks WHERE manufacturer=a.manufacturer AND status IN('offered','accepted')),0)-coalesce((SELECT sum(base_funding*(1-cut_percent/100.0)) FROM public.brl_bank_agreements WHERE manufacturer=a.manufacturer AND funded_at IS NULL AND status='active'),0)>=5000 ORDER BY t->>'date',a.team LIMIT 1) row;
 RETURN result;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_bootstrap() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE d jsonb; team_value text; manufacturer_value text; size integer; season_value text; goals jsonb; BEGIN
 IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF;
 SELECT data->>'activeSeasonId' INTO season_value FROM public.league_state WHERE season_name='irl-league';
 PERFORM public.brl_bank_account('treasury','league','League Treasury'); PERFORM public.brl_bank_account('external','opening'); PERFORM public.brl_bank_account('external','career');
 FOREACH manufacturer_value IN ARRAY ARRAY['Ford','Chevrolet','Toyota'] LOOP PERFORM public.brl_bank_account('manufacturer',manufacturer_value,manufacturer_value); END LOOP;
 FOR d IN SELECT value FROM jsonb_array_elements(public.brl_roster()) LOOP PERFORM public.brl_bank_account('driver',d->>'id',d->>'name'); PERFORM public.brl_bank_account('team',coalesce(d->>'team','Independent')); END LOOP;
 FOR team_value IN SELECT DISTINCT value->>'team' FROM jsonb_array_elements(public.brl_roster()) WHERE coalesce(value->>'retired','false')<>'true' AND coalesce(value->>'team','') NOT IN ('','Independent') LOOP
  SELECT count(*),max(rr->>'manufacturer') INTO size,manufacturer_value FROM jsonb_array_elements(public.brl_roster()) rr WHERE rr->>'team'=team_value AND coalesce(rr->>'retired','false')<>'true';
  IF manufacturer_value NOT IN('Ford','Chevrolet','Toyota') THEN CONTINUE; END IF;
  goals:=CASE upper(coalesce((SELECT coalesce(l.data->'customTeamBranding'->public.brl_team_key(team_value)->>'identifier',l.data->'registeredTeams'->public.brl_team_key(team_value)->>'identifier') FROM public.league_state l WHERE l.season_name='irl-league'),public.brl_team_key(team_value))) WHEN 'NLM' THEN '[{"metric":"team_championship","target":1,"label":"Win the team championship again"},{"metric":"chase","target":2,"label":"Qualify two drivers for the Chase"}]'::jsonb WHEN 'BXM' THEN '[{"metric":"wins","target":1,"label":"Earn at least one race win"}]'::jsonb WHEN 'RMS' THEN '[{"metric":"top5","target":5,"label":"Earn five top-five finishes"}]'::jsonb WHEN 'JAM' THEN '[{"metric":"team_rank","target":5,"label":"Finish top five in team points"},{"metric":"chase","target":1,"label":"Qualify at least one driver for the Chase"}]'::jsonb ELSE '[{"metric":"top10","target":1,"label":"Earn top-ten finishes"}]'::jsonb END;
  INSERT INTO public.brl_bank_agreements(season_id,team,manufacturer,base_funding,funding_at,expectations) VALUES(season_value,team_value,manufacturer_value,CASE size WHEN 1 THEN 460000 WHEN 2 THEN 420000 WHEN 3 THEN 380000 ELSE 600000 END,now(),goals) ON CONFLICT DO NOTHING;
 END LOOP;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_read(account uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$ DECLARE a public.brl_bank_accounts; BEGIN
 IF NOT public.brl_bank_account_allowed(account) THEN RAISE EXCEPTION 'This account is private.'; END IF;
 SELECT * INTO STRICT a FROM public.brl_bank_accounts WHERE id=account;
 RETURN jsonb_build_object('account',to_jsonb(a),'available',public.brl_bank_available(account),'credit',CASE WHEN a.kind='team' THEN public.brl_bank_credit(a.subject) ELSE NULL END,
 'transactions',coalesce((SELECT jsonb_agg(row) FROM (SELECT t.*,e.amount,e.balance_after FROM public.brl_bank_entries e JOIN public.brl_bank_transactions t ON t.id=e.transaction_id WHERE e.account_id=account ORDER BY t.created_at DESC,e.id DESC LIMIT 200) row),'[]'),
 'payments',coalesce((SELECT jsonb_agg(p ORDER BY p.due_at) FROM public.brl_bank_payments p WHERE (a.kind='team' AND p.team=a.subject) OR (a.kind='driver' AND p.driver_id=a.subject)),'[]'),
 'contracts',coalesce((SELECT jsonb_agg(c ORDER BY c.created_at DESC) FROM public.brl_bank_contracts c WHERE (a.kind='team' AND c.team=a.subject) OR (a.kind='driver' AND c.driver_id=a.subject)),'[]'),
 'reportCard',CASE WHEN a.kind='driver' THEN jsonb_build_object('missedMedia',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='media' AND status='approved'),'noCallNoShow',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='attendance' AND status='approved'),'confirmedDnfs',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='dnf' AND status='approved' AND coalesce(payload->>'excused','false')<>'true'),'conduct',(SELECT count(*) FROM public.brl_bank_cases WHERE driver_id=a.subject AND kind='conduct' AND status='approved')) ELSE NULL END,
 'agreements',coalesce((SELECT jsonb_agg(g) FROM public.brl_bank_agreements g WHERE a.kind='team' AND g.team=a.subject),'[]'),
 'tasks',coalesce((SELECT jsonb_agg(t ORDER BY t.created_at DESC) FROM public.brl_bank_tasks t WHERE a.kind='team' AND t.team=a.subject),'[]'),
 'notices',coalesce((SELECT jsonb_agg(n) FROM (SELECT * FROM public.brl_bank_notices WHERE (a.kind='team' AND team=a.subject) OR (a.kind='driver' AND driver_id=a.subject) OR (a.kind='treasury' AND public.brl_full_admin() AND team IS NULL AND driver_id IS NULL) ORDER BY created_at DESC LIMIT 30) n),'[]'),
 'cases',coalesce((SELECT jsonb_agg(c ORDER BY c.created_at DESC) FROM public.brl_bank_cases c WHERE (a.kind='team' AND c.team=a.subject) OR (a.kind='driver' AND c.driver_id=a.subject)),'[]'));
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_case_note(case_id uuid,note text,excused boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() OR length(trim(note))<3 THEN RAISE EXCEPTION 'Admin reason required.'; END IF; UPDATE public.brl_bank_cases SET reason=note,payload=payload||jsonb_build_object('excused',excused) WHERE id=case_id AND status='pending'; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_transfer(team_value text,destination_team text,value numeric,reason_value text,reference uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE src uuid; dst uuid; BEGIN
 IF NOT public.brl_can_team(team_value) OR value<=0 OR length(trim(reason_value))<3 OR team_value=destination_team THEN RAISE EXCEPTION 'Team authorization and valid transfer details required.'; END IF;
 src:=public.brl_bank_account('team',team_value); SELECT id INTO STRICT dst FROM public.brl_bank_accounts WHERE kind='team' AND subject=destination_team; PERFORM id FROM public.brl_bank_accounts WHERE id IN(src,dst) ORDER BY id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.brl_bank_transactions WHERE event_key='team-transfer:'||reference) THEN RETURN; END IF;
 IF value>public.brl_bank_available(src) THEN RAISE EXCEPTION 'Transfer exceeds available funds after commitments.'; END IF;
 PERFORM public.brl_bank_post(src,dst,value,'team-transfer:'||reference,'Team transfer',reason_value,(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league'));
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_number(team_value text,number_value integer,buy boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE row_value jsonb; src uuid; cost numeric:=10000; BEGIN
 IF NOT public.brl_can_team(team_value) OR number_value NOT BETWEEN 1 AND 99 THEN RAISE EXCEPTION 'Team authorization and valid number required.'; END IF;
 IF to_regclass('public.number_pool') IS NULL THEN RAISE EXCEPTION 'Install the league number pool first.'; END IF;
 SELECT to_jsonb(n) INTO STRICT row_value FROM public.number_pool n WHERE number::text=number_value::text FOR UPDATE;
 src:=public.brl_bank_account('team',team_value); PERFORM id FROM public.brl_bank_accounts WHERE id=src FOR UPDATE;
 IF buy THEN
  IF lower(row_value->>'status')<>'available' OR cost>public.brl_bank_available(src) THEN RAISE EXCEPTION 'Number unavailable or insufficient available funds.'; END IF;
  UPDATE public.number_pool SET status='owned',owning_team=team_value,purchase_price=cost,purchased_at=now(),released_at=NULL,updated_at=now() WHERE number::text=number_value::text;
  PERFORM public.brl_bank_post(src,public.brl_bank_account('treasury','league'),cost,'number-purchase:'||gen_random_uuid(),'Number purchase','Purchase #'||number_value);
  UPDATE public.brl_bank_accounts SET asset_value=asset_value+cost WHERE id=src;
 ELSE
  IF NOT public.brl_can_team(row_value->>'owning_team') OR NOT EXISTS(SELECT 1 FROM public.brl_bank_accounts WHERE id=src AND subject=row_value->>'owning_team') THEN RAISE EXCEPTION 'Only the owning team can release this number.'; END IF;
  IF row_value->>'assigned_driver_number' IS NOT NULL THEN RAISE EXCEPTION 'Admin must clear a driver assignment before releasing their number.'; END IF;
  UPDATE public.number_pool SET status='available',owning_team=NULL,released_at=now(),updated_at=now() WHERE number::text=number_value::text;
  UPDATE public.brl_bank_accounts SET asset_value=greatest(0,asset_value-coalesce((row_value->>'purchase_price')::numeric,cost)) WHERE id=src;
  PERFORM public.brl_bank_post(public.brl_bank_account('treasury','league'),src,round(coalesce((row_value->>'purchase_price')::numeric,cost)*.5,2),'number-release:'||gen_random_uuid(),'Number refund','50% release refund for #'||number_value,NULL,NULL,true);
 END IF;
END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_budget(kind_value text,subject_value text,season_value text,value numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() OR kind_value NOT IN('treasury','manufacturer') OR value<=0 OR value>25000000 OR season_value<>(SELECT data->>'activeSeasonId' FROM public.league_state WHERE season_name='irl-league') THEN RAISE EXCEPTION 'Admin-approved current-season operating budget required, maximum $25 million.'; END IF; PERFORM public.brl_bank_post(public.brl_bank_account('external','season-budgets'),public.brl_bank_account(kind_value,subject_value),value,'season-budget:'||season_value||':'||kind_value||':'||subject_value,'Season operating budget','Approved fixed season sponsorship/operating allocation',season_value); END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_adjust(source uuid,destination uuid,value numeric,reason_value text,reference uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() OR length(trim(reason_value))<8 THEN RAISE EXCEPTION 'Full admin and a specific correction reason required.'; END IF; PERFORM public.brl_bank_post(source,destination,value,'admin-correction:'||reference,'Correction',reason_value,NULL,NULL,true); END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_assets(account uuid,value numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() OR value<0 THEN RAISE EXCEPTION 'Admin asset valuation required.'; END IF; UPDATE public.brl_bank_accounts SET asset_value=value WHERE id=account AND kind='team'; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_configure(enable boolean,career_rate numeric) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF; IF career_rate<0 OR career_rate>(SELECT 1-driver_tax_rate FROM public.brl_bank_settings WHERE id) THEN RAISE EXCEPTION 'Tax plus career expenses cannot exceed compensation.'; END IF; IF enable AND NOT EXISTS(SELECT 1 FROM public.brl_bank_settings WHERE id AND activated_at IS NOT NULL) THEN
 INSERT INTO public.brl_bank_races(season_id,race_name,started_at,snapshot) SELECT sn->>'id',r->>'raceName',coalesce((r->>'startedAt')::timestamptz,(r->>'savedAt')::timestamptz,now()),r||jsonb_build_object('bankingBaseline',true) FROM public.league_state l CROSS JOIN LATERAL jsonb_array_elements(l.data->'seasons') sn CROSS JOIN LATERAL jsonb_array_elements(coalesce(sn->'raceHistory','[]')) r WHERE l.season_name='irl-league' AND sn->>'id'=l.data->>'activeSeasonId' ON CONFLICT DO NOTHING;
 END IF; UPDATE public.brl_bank_settings SET enabled=enable,career_expense_rate=career_rate,activated_at=CASE WHEN enable THEN coalesce(activated_at,now()) ELSE activated_at END WHERE id; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_milestone(season_value text,driver_value text,qualified boolean) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() THEN RAISE EXCEPTION 'Full admin required.'; END IF; INSERT INTO public.brl_bank_milestones VALUES(season_value,driver_value,qualified) ON CONFLICT(season_id,driver_id) DO UPDATE SET chase_qualified=excluded.chase_qualified; END; $$;
CREATE OR REPLACE FUNCTION public.brl_bank_resolve(case_id uuid,note text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN IF NOT public.brl_full_admin() OR length(trim(note))<3 THEN RAISE EXCEPTION 'Admin resolution reason required.'; END IF; UPDATE public.brl_bank_cases SET status='resolved',payload=payload||jsonb_build_object('resolution',note),resolved_at=now() WHERE id=case_id; END; $$;
-- No financial table accepts direct browser writes. Every mutation goes through a checked RPC.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['brl_bank_settings','brl_bank_accounts','brl_bank_transactions','brl_bank_entries','brl_bank_contracts','brl_bank_payments','brl_bank_agreements','brl_bank_tasks','brl_bank_cases','brl_bank_notices','brl_bank_races','brl_bank_reviews','brl_bank_milestones','brl_bank_tax_assessments'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t); EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t); EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
  EXECUTE format('DROP POLICY IF EXISTS bank_admin ON public.%I',t); EXECUTE format('CREATE POLICY bank_admin ON public.%I FOR SELECT TO authenticated USING(public.brl_full_admin())',t);
 END LOOP;
END; $$;
DROP POLICY IF EXISTS bank_account_read ON public.brl_bank_accounts;
CREATE POLICY bank_account_read ON public.brl_bank_accounts FOR SELECT TO authenticated USING(public.brl_bank_account_allowed(id));
DROP POLICY IF EXISTS bank_settings_read ON public.brl_bank_settings;
CREATE POLICY bank_settings_read ON public.brl_bank_settings FOR SELECT TO authenticated USING(true);
DO $$ DECLARE f record; BEGIN
 FOR f IN SELECT p.oid::regprocedure AS sig,p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'brl_bank_%' LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.sig); EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',f.sig);
 IF f.proname IN('brl_bank_my_driver','brl_bank_account_allowed','brl_bank_seed','brl_bank_offer','brl_bank_accept','brl_bank_request','brl_bank_consent','brl_bank_agreement','brl_bank_decide','brl_bank_admin_case','brl_bank_accept_task','brl_bank_tick','brl_bank_bootstrap','brl_bank_read','brl_bank_public_goals','brl_bank_configure','brl_bank_milestone','brl_bank_resolve','brl_bank_assets','brl_bank_case_note','brl_bank_transfer','brl_bank_number','brl_bank_budget','brl_bank_adjust') THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',f.sig); END IF;
 END LOOP;
END; $$;
COMMIT;
