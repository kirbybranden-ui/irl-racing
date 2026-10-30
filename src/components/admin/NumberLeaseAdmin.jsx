import { MemberRegistrationLog } from "../career/JoinDate";
import CharterAdmin from "../career/CharterControls";
import React, { useEffect, useState } from "react";
import { careerRead, careerAction } from "../../lib/career";
import NumberLeaseCenter from "../career/NumberLeaseCenter";
import "../../styles/career.css";

export default function NumberLeaseAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    let live = true;
    careerRead().then(value => { if (live) setData(value); }).catch(e => { if (live) setError(e.message); });
    return () => { live = false; };
  }, []);
  async function run(action, payload) {
    if (!data?.isSuperAdmin || busy) return null;
    setBusy(true); setError(""); setStatus("");
    try {
      const result = await careerAction(action, payload);
      setData(await careerRead()); setStatus("Saved successfully.");
      return result;
    } catch (e) { setError(e.message); return null; }
    finally { setBusy(false); }
  }
  if (!data?.isSuperAdmin) return error ? <p role="alert">Lease administration could not load: {error}</p> : null;
  return <section className="career">
    {error && <p role="alert" className="career-error">{error}</p>}
    {status && <p role="status">{status}</p>}
    <MemberRegistrationLog data={data}/>
    <CharterAdmin data={data} busy={busy} run={run}/>
    <details>
      <summary><strong>Super-admin number lease administration</strong></summary>
      <p>Publish league terms, fund manufacturer programs, review leases and authorize number changes. Team requests and signatures remain in Owner HQ.</p>
      <NumberLeaseCenter admin data={data} owned={[]} busy={busy} run={run} />
    </details>
  </section>;
}
