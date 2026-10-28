import React, { useState } from "react";
import { challengeEnabledForSeason } from "../../lib/inSeasonChallenge";

export default function InSeasonChallengeControl({ season, onSave }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const enabled = challengeEnabledForSeason(season);
  return <section aria-labelledby="challenge-control-title" style={{ padding: "20px 0", marginBottom: 24, borderTop: "2px solid #111216", borderBottom: "1px solid #d6d7d9", color: "#111216" }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
      <div><h2 id="challenge-control-title" style={{ margin: "0 0 6px", fontSize: 23 }}>In-Season Challenge</h2><p style={{ margin: 0, fontSize: 13 }}>{season?.name || "Current season"} · {enabled ? "On" : "Off"}</p></div>
      <button type="button" role="switch" aria-checked={enabled} aria-label="In-Season Challenge" disabled={busy || !season?.id || !onSave} onClick={async () => {
        setBusy(true); setError(""); setStatus("");
        try { await onSave(!enabled); setStatus(`In-Season Challenge turned ${enabled ? "off" : "on"}.`); }
        catch (failure) { setError(failure.message || "Could not save. Please try again."); }
        finally { setBusy(false); }
      }} style={{ minHeight: 46, padding: "12px 20px", border: 0, borderRadius: 4, fontWeight: 900, background: enabled ? "#111216" : "#d71920", color: "#fff", cursor: busy ? "wait" : "pointer" }}>{busy ? "Saving…" : `Turn ${enabled ? "Off" : "On"}`}</button>
    </div>
    <p style={{ margin: "12px 0 0", color: "#686b70", fontSize: 13, lineHeight: 1.5 }}>Controls challenge access and links on mobile and desktop. Race results are kept when it is off.</p>
    {status && <p role="status" style={{ margin: "10px 0 0", fontSize: 13 }}>{status}</p>}
    {error && <p role="alert" style={{ margin: "10px 0 0", color: "#b91c1c" }}>{error}</p>}
  </section>;
}
