import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

const field = { width: "100%", boxSizing: "border-box", minHeight: 46, padding: "11px 12px", border: "1px solid #b7b8bc", borderRadius: 2, background: "#fff", color: "#111216", font: "inherit" };

export default function JoinRequestForm() {
  const [form, setForm] = useState({ driverName: "", carNumber: "", manufacturer: "", teamName: "" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const update = (key) => (event) => setForm((previous) => ({ ...previous, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    const number = Number(form.carNumber);
    if (!form.driverName.trim() || !Number.isInteger(number) || number < 1 || number > 999 || !form.manufacturer || !form.teamName.trim()) {
      setError("Enter your driver name, car number, manufacturer, and team.");
      return;
    }
    if (!supabase) { setError("Registration is temporarily unavailable. Please try again later."); return; }
    setSubmitting(true);
    try {
      const { error: saveError } = await supabase.from("pending_drivers").insert({
        driver_name: form.driverName.trim(), car_number: number,
        manufacturer: form.manufacturer, team_name: form.teamName.trim(),
        status: "pending", created_at: new Date().toISOString(),
      });
      if (saveError) throw saveError;
      setStatus("Request submitted. An admin will review it and add you to the driver roster. You can log in after your driver access is set up.");
      setForm({ driverName: "", carNumber: "", manufacturer: "", teamName: "" });
    } catch (saveError) {
      console.error("Could not submit join request:", saveError);
      setError("Could not submit your request. Please try again.");
    } finally { setSubmitting(false); }
  }

  return <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
    <label>Driver name<input style={field} value={form.driverName} onChange={update("driverName")} required maxLength={80} placeholder="Your driver name" /></label>
    <label>Car number<input style={field} type="number" min="1" max="999" value={form.carNumber} onChange={update("carNumber")} required placeholder="Preferred number" /></label>
    <label>Manufacturer<select style={field} value={form.manufacturer} onChange={update("manufacturer")} required><option value="">Select manufacturer</option><option>Chevrolet</option><option>Ford</option><option>Toyota</option><option>Other</option></select></label>
    <label>Team<input style={field} value={form.teamName} onChange={update("teamName")} required maxLength={80} placeholder="Team name or Independent" /></label>
    {error && <p role="alert" style={{ color: "#a31820", margin: 0 }}>{error}</p>}
    {status && <p role="status" style={{ color: "#176b37", margin: 0 }}>{status}</p>}
    <button type="submit" disabled={submitting} style={{ width: "100%", padding: 14, border: 0, borderRadius: 2, background: "#d71920", color: "white", fontWeight: 900, cursor: "pointer" }}>{submitting ? "Submitting…" : "Request to Join"}</button>
  </form>;
}
