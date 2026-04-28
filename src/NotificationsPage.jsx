import { useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

const inputStyle = {
  width: "100%",
  margin: "8px 0 16px",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #313947",
  background: "#0f1319",
  color: "white",
  boxSizing: "border-box",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  background: "#0f1319",
  border: "1px solid #2d3643",
  borderRadius: 12,
  marginBottom: 10,
  cursor: "pointer",
};

export default function NotificationsPage() {
  const [form, setForm] = useState({
    driver_number: "",
    driver_name: "",
    phone_or_email: "",
    notify_race_results: true,
    notify_news: true,
    notify_streams: true,
    notify_pre_race: true,
    notify_post_race: true,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitSignup(e) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      driver_number: String(form.driver_number).trim(),
      driver_name: String(form.driver_name).trim(),
      phone_or_email: String(form.phone_or_email).trim(),
    };

    const { error } = await supabase.from("notification_signups").insert([payload]);
    setSubmitting(false);

    if (error) {
      console.error("Notification signup failed:", error);
      alert("Signup failed. Check your Supabase table columns and RLS policy.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", borderBottom: "3px solid #d4af37", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="League Logo" style={{ height: 48 }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Notification Signup</div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Pick the Budweiser Cup League alerts you want to receive</div>
          </div>
        </div>

        <button onClick={() => (window.location.pathname = "/standings")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 900, cursor: "pointer" }}>
          Back to Standings
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto", padding: 24 }}>
        {submitted ? (
          <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 34, textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: 0 }}>You’re signed up</h2>
            <p style={{ opacity: 0.75 }}>Your notification preferences were saved.</p>
            <button onClick={() => (window.location.pathname = "/standings")} style={{ marginTop: 14, background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }}>
              Return to Standings
            </button>
          </div>
        ) : (
          <form onSubmit={submitSignup} style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 24, boxShadow: "0 14px 34px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Driver Information</div>
            <div style={{ opacity: 0.65, fontSize: 13, marginBottom: 20 }}>Sign up by driver name and number so admins know who each signup belongs to.</div>

            <label style={{ fontWeight: 800 }}>Driver Number</label>
            <input value={form.driver_number} onChange={(e) => updateField("driver_number", e.target.value)} required style={inputStyle} placeholder="42" />

            <label style={{ fontWeight: 800 }}>Driver Name</label>
            <input value={form.driver_name} onChange={(e) => updateField("driver_name", e.target.value)} required style={inputStyle} placeholder="AMP-GHOSTRIDER" />

            <label style={{ fontWeight: 800 }}>Email or Phone</label>
            <input value={form.phone_or_email} onChange={(e) => updateField("phone_or_email", e.target.value)} required style={inputStyle} placeholder="name@email.com or phone number" />

            <div style={{ fontSize: 22, fontWeight: 900, margin: "10px 0 12px" }}>Alert Preferences</div>

            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_race_results} onChange={(e) => updateField("notify_race_results", e.target.checked)} />🏁 Race results</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_news} onChange={(e) => updateField("notify_news", e.target.checked)} />📰 News updates</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_streams} onChange={(e) => updateField("notify_streams", e.target.checked)} />📡 Live streams</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_pre_race} onChange={(e) => updateField("notify_pre_race", e.target.checked)} />🎤 Pre-race interviews</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_post_race} onChange={(e) => updateField("notify_post_race", e.target.checked)} />🎙️ Post-race interviews</label>

            <button type="submit" disabled={submitting} style={{ marginTop: 18, width: "100%", background: submitting ? "#6b7280" : "#d4af37", color: "#111", border: "none", borderRadius: 14, padding: 15, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer", fontSize: 15 }}>
              {submitting ? "Saving..." : "Sign Up for Notifications"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
