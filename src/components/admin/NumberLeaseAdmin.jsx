import { MemberRegistrationLog } from "../career/JoinDate";
import CharterAdmin from "../career/CharterControls";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { careerRead, careerAction } from "../../lib/career";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/career";
import NumberLeaseCenter from "../career/NumberLeaseCenter";
import "../../styles/career.css";

export default function NumberLeaseAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const generation=useRef(0);
  const load=useCallback(async()=>{const ticket=++generation.current;const value=await careerRead();if(ticket===generation.current)setData(value);return value;},[]);
  useEffect(()=>{let live=true;const refresh=()=>load().catch(e=>{if(live)setError(e.message);});refresh();window.addEventListener("focus",refresh);const timer=setInterval(refresh,30000);return()=>{live=false;generation.current++;clearInterval(timer);window.removeEventListener("focus",refresh);};},[load]);
  async function run(action, payload) {
    if (!data?.isSuperAdmin || busy) return null;
    setBusy(true); setError(""); setStatus("");
    try {
      let result;
      if(action === "admin_direct_number_lease") {
        const response = await supabase.rpc("brl_admin_direct_number_lease", {payload});
        if(response.error) throw response.error;
        result = response.data;
      } else result = await careerAction(action, payload);
      await load(); setStatus("Saved successfully.");
      return result;
    } catch (e) { setError(e.message); return null; }
    finally { setBusy(false); }
  }
  if (!data?.isSuperAdmin) return error ? <p role="alert">Lease administration could not load: {error}</p> : null;
  return <section className="career">
    {error && <p role="alert" className="career-error">{error}</p>}
    {status && <p role="status">{status}</p>}
    <button disabled={busy} onClick={()=>load().catch(e=>setError(e.message))}>Refresh requests</button>
    <MemberRegistrationLog data={data} busy={busy} run={run}/>
    <CharterAdmin data={data} busy={busy} run={run}/>
    <details>
      <summary><strong>Number lease administration · {(data.leases||[]).filter(l=>l.status==="requested"&&l.terms?.workflow==="owner-request-v1").length} pending</strong></summary>
      <p>Review number requests, approve the team charge, and review driver number-change requests. Owners choose initial numbers through their driver contracts.</p>
      <DirectLease data={data} busy={busy} run={run}/>
      <NumberLeaseCenter admin data={data} owned={[]} busy={busy} run={run} />
    </details>
  </section>;
}

function DirectLease({data,busy,run}) {
 const teams=(data.teams||[]).filter(t=>t.status==="approved"&&t.season_id===data.seasonId);
 const available=(data.pool||[]).filter(n=>n.status==="available");
 const cfg=data.leaseSettings;
 return <form className="career-form career-card" onSubmit={async e=>{e.preventDefault();const form=e.currentTarget;const f=new FormData(form);const result=await run("admin_direct_number_lease",{teamId:String(f.get("teamId")),number:Number(f.get("number")),expectedFee:Number(cfg.fee),expectedEnd:cfg.ends_on,reason:String(f.get("reason")),financialOverride:f.get("override")==="on"});if(result?.status==="active")form.reset();}}>
 <h2>Lease a number on behalf of a team</h2><p>Super Admin authorization replaces the owner request and signature. Approval charges the team and activates the lease immediately.</p>
 <label>Team<select name="teamId" required defaultValue=""><option value="">Select approved team</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}</select></label>
 <label>Available number<select name="number" required defaultValue=""><option value="">Choose number</option>{available.map(n=><option key={n.number} value={n.number}>#{n.number}</option>)}</select></label>
 <p>Fee: {cfg?.fee?money(cfg.fee):"Not published"} · Through {cfg?.ends_on||"Not published"}</p>
 <label><input type="checkbox" name="override"/> Bypass team funding-review requirement (actual available funds still required)</label>
 <label>Administrative reason<textarea name="reason" required minLength={10} maxLength={2000}/></label>
 <label><input type="checkbox" required/> I authorize the displayed team charge and immediate lease activation.</label>
 <button disabled={busy||!teams.length||!available.length||!(Number(cfg?.fee)>0)||!cfg?.ends_on}>Approve &amp; activate lease</button></form>;
}
