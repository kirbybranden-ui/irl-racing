import { storePasswordTicket } from "../../lib/passwordRecovery";
import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { refreshLeagueAccess } from "../../lib/roleAccess";
import { functionError } from "../../lib/career";
import "../../styles/career.css";
export default function JoinRequestForm() {
  const [form, setForm] = useState({ gamertag: "", password: "", confirm: "", kind: "driver", code: "", name: "", manufacturer: "Toyota", requestedCapacity: 1, adultConfirmed: false });
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [status, setStatus] = useState("");
  const field = (key, value) => setForm(current => ({ ...current, [key]: value }));
  return <form className="career-form" onSubmit={async event => {
    event.preventDefault();setError("");setStatus("");
    setBusy(true);
    try {
      const { data, error: failure } = await supabase.functions.invoke("brl-register", { body: { adultConfirmed: form.adultConfirmed, gamertag: form.gamertag.trim(), kind: form.kind, team: { code: form.code.trim().toUpperCase(), name: form.name.trim(), manufacturer: form.manufacturer, requestedCapacity: form.kind === "independent" ? 1 : Number(form.requestedCapacity) } } });
      if (failure) throw new Error(await functionError(failure, "Registration failed."));
      if (data?.error) throw new Error(data.error);
      if (data?.ticket) storePasswordTicket(form.gamertag, data.ticket);
      if (data?.session) { const { error: sessionError } = await supabase.auth.setSession(data.session);if (sessionError) throw sessionError;await refreshLeagueAccess();window.location.assign("/career"); }
      else setStatus(data?.message || "Registered. Sign in using your gamertag.");
    } catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }}>
    <p className="career-notice">Use your racing-platform <strong>gamertag as your name</strong>, exactly as it appears in the game. It identifies you on applications, the roster, contracts, and signatures. Do not enter your legal name in this field.</p>
    <label className="career-check"><input required type="checkbox" checked={form.adultConfirmed} onChange={e=>field("adultConfirmed",e.target.checked)}/>I am at least 18 years old. I understand that I must personally accept the <a href="/user-agreement" target="_blank" rel="noreferrer">User Agreement</a> before league access.</label>
    <label>Gamertag<input required minLength={3} maxLength={80} autoComplete="username" value={form.gamertag} onChange={e => field("gamertag", e.target.value)} /></label>
    <p>You will choose your password after acceptance. Return to the login screen on this same browser and enter your gamertag; it will show Set up a password automatically. The admin never needs to issue your password.</p>
    <label>I am applying as<select value={form.kind} onChange={e => field("kind", e.target.value)}><option value="driver">Driver seeking a team seat</option><option value="owner">Team owner — super-admin approval required</option><option value="independent">Independent owner/driver — super-admin approval required</option></select></label>
    {form.kind !== "driver" && <><label>Proposed team name<input required minLength={3} maxLength={100} value={form.name} onChange={e => field("name", e.target.value)} /></label><label>Team code<input required minLength={2} maxLength={20} pattern="[A-Za-z0-9_-]{2,20}" value={form.code} onChange={e => field("code", e.target.value)} placeholder="Example: 19XI" /></label><label>Manufacturer<select value={form.manufacturer} onChange={e => field("manufacturer", e.target.value)}><option>Toyota</option><option>Ford</option><option>Chevrolet</option></select></label>{form.kind === "owner" && <label>Requested number of cars<select value={form.requestedCapacity} onChange={e => field("requestedCapacity", e.target.value)}>{[1,2,3,4].map(n=><option key={n} value={n}>{n} {n===1?"car":"cars"}</option>)}</select></label>}<p>The super admin approves your car limit and assigns the charter tier and manufacturer alliance. Your request does not reserve a charter.</p></>}
    <p className="career-muted">Registration does not grant an active race seat. Owners need super-admin approval; drivers need a team-owned number and a contract signed by both parties. Car numbers are assigned during contracting.</p>
    {error && <p role="alert" className="career-error">{error}</p>}{status && <p role="status">{status}</p>}
    <button type="submit" disabled={busy}>{busy ? "Creating application…" : "Register & submit application"}</button>
  </form>;
}
