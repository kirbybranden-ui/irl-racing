import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { money } from "../../lib/career";
import "../../styles/teamBuilder.css";

export function OwnerBuildNotice({ teams, onBuild }) {
  if (!teams.length) return null;
  const unfinished = teams.filter(t => !t.owner_profile?.savedAt);
  return <section className="career-card team-build-notice">
    <div className="career-kicker">Ownership approved</div>
    <h2>{unfinished.length ? "You’re approved. Build your team." : "Your team headquarters"}</h2>
    <p>{unfinished.length ? "Set your team’s identity, arrange funding, and lease your car numbers before signing drivers. Your team is available here even with an empty roster." : "Update your team profile, review funding, and manage your roster from Owner HQ."}</p>
    {onBuild ? <button onClick={onBuild}>{unfinished.length ? "Build your team" : "Edit team profile"}</button> : <a href="/team-hq#team">{unfinished.length ? "Build your team →" : "Open Owner HQ →"}</a>}
  </section>;
}

export default function TeamBuilder({ team, data, onSaved, onStep }) {
  const profile = team.owner_profile || {};
  const [form, setForm] = useState(() => ({ name: team.name, bio: profile.bio || "", accent: profile.accent || "#d71920", dark: profile.dark || "#111216", logoDataUrl: profile.logoDataUrl || "" }));
  const [revision, setRevision] = useState(team.profile_revision || 0);
  const [busy, setBusy] = useState(false), [reading, setReading] = useState(false), [error, setError] = useState(""), [status, setStatus] = useState("");
  const set = (key, value) => { setForm(f => ({ ...f, [key]: value }));setStatus(""); };
  const account = (data.balances || []).find(b => b.kind === "team" && b.subject === team.code);
  const numbers = (data.numbers || []).filter(n => n.team_id === team.id && n.activeLease);
  async function readLogo(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");setStatus("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 262144) { setError("Choose a PNG, JPEG or WebP logo no larger than 256 KB.");event.target.value = "";return; }
    setReading(true);
    try {
      const url = await new Promise((resolve, reject) => { const reader = new FileReader();reader.onload = () => resolve(reader.result);reader.onerror = () => reject(new Error("The logo could not be read."));reader.readAsDataURL(file); });
      await new Promise((resolve, reject) => { const image = new Image();image.onload = resolve;image.onerror = () => reject(new Error("Choose a valid image file."));image.src = url; });
      set("logoDataUrl", url);
    } catch (failure) { setError(failure.message); } finally { setReading(false); }
  }
  async function save(event) {
    event.preventDefault();setBusy(true);setError("");setStatus("");
    try {
      const result = await supabase.rpc("brl_save_team_profile", { team_value: team.id, profile_value: form, expected_revision: revision });
      if (result.error) throw result.error;
      setRevision(result.data.revision);
      window.dispatchEvent(new Event("brl:bank-state-changed"));
      setStatus("Team profile saved.");
      await onSaved();
    } catch (failure) { setError(failure.message || "Your team profile could not be saved."); } finally { setBusy(false); }
  }
  return <section className="career-card team-builder" aria-label={`Build ${team.name}`}>
    <div className="career-kicker">Build your team / {team.code}</div><h2>Make it your team</h2>
    <p>{team.manufacturer} · {team.tier} charter · {team.capacity} approved {team.capacity === 1 ? "car" : "cars"}. Contact the super admin for manufacturer, team code, or charter changes.</p>
    <div className="team-builder-layout"><form className="career-form" onSubmit={save}>
      <fieldset disabled={busy || reading}><legend>Team identity</legend>
        <label>Team name<input required minLength={3} maxLength={100} value={form.name} onChange={e => set("name", e.target.value)} /></label>
        <label>Team profile<textarea maxLength={800} rows={4} value={form.bio} onChange={e => set("bio", e.target.value)} placeholder="Tell drivers about your team and what you’re building." /></label>
        <label>Team logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={readLogo} /></label><p className="career-muted">PNG, JPEG or WebP · up to 256 KB. A logo is optional.</p>
        <div className="career-form-grid"><label>Primary color<input type="color" value={form.accent} onChange={e => set("accent", e.target.value)} /></label><label>Secondary color<input type="color" value={form.dark} onChange={e => set("dark", e.target.value)} /></label></div>
      </fieldset>
      {error && <p role="alert" className="career-error">{error}</p>}{status && <p role="status">{status}</p>}
      <button disabled={busy || reading}>{reading ? "Reading logo…" : busy ? "Saving team…" : "Save team profile"}</button>
    </form><aside className="team-builder-preview" style={{ borderTopColor: form.accent }} aria-label="Team profile preview">
      <div className="team-builder-mark" style={{ backgroundColor: form.dark }}>{form.logoDataUrl ? <img src={form.logoDataUrl} alt={`${form.name} logo preview`} /> : <strong>{team.code}</strong>}</div>
      <div className="career-kicker">{team.manufacturer} / {team.code}</div><h3>{form.name || "Your team name"}</h3><p>{form.bio || "Your team story starts here."}</p><p>{team.occupied || 0} / {team.capacity} seats filled</p>
    </aside></div>
    <h3>Your next steps</h3><ol className="team-build-steps">
      <li><strong>{profile.savedAt ? "Profile saved" : "Save your team profile"}</strong><p>Choose your name, colors, and optional logo above.</p></li>
      <li><strong>Arrange team funding</strong><p>Balance {money(account?.balance)} · available {money(account?.available)}. Opening budgets and league loans require league approval.</p><button type="button" onClick={() => document.getElementById(`team-finance-${team.id}`)?.scrollIntoView({ behavior: "smooth" })}>View funding & loan options</button></li>
      <li><strong>Lease your numbers</strong><p>{numbers.length ? `Active leases: ${numbers.map(n => `#${n.number}`).join(", ")}.` : "No active number leases yet."} Your team must lease and fund its numbers each season.</p><button type="button" onClick={() => onStep("leases")}>Open number leases</button></li>
      <li><strong>{team.ready ? "Ready to recruit" : "Complete the league’s recruiting requirements"}</strong><p>{team.ready ? "Review driver seat applications and prepare contracts for your approved car limit." : "The league checks approval, available funds, active leases, and payment compliance before recruiting."}</p><button type="button" disabled={!team.ready} onClick={() => onStep("requests")}>Review seat applications</button></li>
    </ol>
  </section>;
}
