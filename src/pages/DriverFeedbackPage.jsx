import React, { useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";
import {
  dedupeDriversByNumber,
  isInactivePlaceholderDriver,
} from "../utils/driverHelpers";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
} from "../styles/sharedStyles";

export default function DriverFeedbackPage({ drivers = [] }) {
  const [form, setForm] = useState({
    driver_id: "",
    team_happiness: 8,
    equipment_quality: 8,
    team_communication: 8,
    leadership_confidence: 8,
    manufacturer_support: 8,
    future_confidence: 8,
    comments: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers)
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const driver = activeDrivers.find((item) => String(item.id) === String(form.driver_id));
    if (!driver) {
      setError("Select your driver before submitting feedback.");
      return;
    }

    const payload = {
      driver_id: String(driver.id),
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: getTeamFullName(driver.team || "Independent"),
      team_key: driver.team || "Independent",
      manufacturer: driver.manufacturer || "",
      team_happiness: Number(form.team_happiness) || 0,
      equipment_quality: Number(form.equipment_quality) || 0,
      team_communication: Number(form.team_communication) || 0,
      leadership_confidence: Number(form.leadership_confidence) || 0,
      manufacturer_support: Number(form.manufacturer_support) || 0,
      future_confidence: Number(form.future_confidence) || 0,
      comments: form.comments || "",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("driver_feedback").insert([payload]);

    if (insertError) {
      console.error("Driver feedback Supabase insert failed:", insertError);
      try {
        const saved = JSON.parse(localStorage.getItem("bclDriverFeedbackRatings") || "[]");
        localStorage.setItem("bclDriverFeedbackRatings", JSON.stringify([{ ...payload, id: `local-${Date.now()}` }, ...saved]));
        setMessage("Feedback saved on this browser. Add the driver_feedback table in Supabase to make it visible everywhere.");
      } catch {
        setError("Could not save feedback. Check the driver_feedback Supabase table.");
        return;
      }
    } else {
      setMessage("Driver feedback submitted. Your owner will see the updated morale signals in Team HQ.");
    }

    setForm((current) => ({ ...current, comments: "" }));
  }

  const ratingFields = [
    ["team_happiness", "Team Happiness", "How happy are you with your organization?"],
    ["equipment_quality", "Equipment Quality", "How competitive is your equipment?"],
    ["team_communication", "Team Communication", "How well does your team work together?"],
    ["leadership_confidence", "Owner Leadership", "How confident are you in ownership?"],
    ["manufacturer_support", "Manufacturer Support", "How strong is manufacturer support?"],
    ["future_confidence", "Future Confidence", "Do you believe this team can win?"],
  ];

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 980 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 900 }}>Driver Feedback</div>
                <div style={{ opacity: 0.72, marginTop: 4 }}>Rate your team experience. These ratings feed Team HQ morale.</div>
              </div>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={submitFeedback} style={sectionCardStyle}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SELECT DRIVER</label>
          <select value={form.driver_id} onChange={(event) => updateField("driver_id", event.target.value)} style={inputStyle}>
            <option value="">Choose your driver</option>
            {activeDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)}</option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 18 }}>
            {ratingFields.map(([field, label, help]) => (
              <div key={field} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 900 }}>{label}</div>
                  <div style={{ color: "#d4af37", fontWeight: 900 }}>{form[field]}/10</div>
                </div>
                <div style={{ opacity: 0.65, fontSize: 12, margin: "6px 0 10px" }}>{help}</div>
                <input type="range" min="1" max="10" value={form[field]} onChange={(event) => updateField(field, event.target.value)} style={{ width: "100%" }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>OPTIONAL COMMENT</label>
            <textarea value={form.comments} onChange={(event) => updateField("comments", event.target.value)} placeholder="What should ownership know?" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {message && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{message}</div>}
          {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button type="submit" style={primaryButtonStyle}>Submit Driver Feedback</button>
            <button type="button" onClick={() => (window.location.pathname = "/team-hq")} style={secondaryButtonStyle}>Open Team HQ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
