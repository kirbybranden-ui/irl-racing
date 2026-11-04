import { MemberRegistrationLog } from "../career/JoinDate";
import CharterAdmin from "../career/CharterControls";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { careerRead, careerAction } from "../../lib/career";
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
      const result = await careerAction(action, payload);
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
      <NumberLeaseCenter admin data={data} owned={[]} busy={busy} run={run} />
    </details>
  </section>;
}
