import { useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

export default function NotificationsPage() {
  const [form, setForm] = useState({
    driver_number: "",
    driver_name: "",
    phone_or_email: "",
    notify_race_results: true,
    notify_news: true,
    notify_streams: true,
  });

  const [submitted, setSubmitted] = useState(false);

  async function submitSignup(e) {
    e.preventDefault();

    const { error } = await supabase.from("notification_signups").insert([form]);

    if (error) {
      alert("Signup failed. Check Supabase permissions.");
      console.error(error);
      return;
    }

    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f14", color: "white", fontFamily: "Arial" }}>
      <div style={{ background: "#151a22", borderBottom: "3px solid #d4af37", padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={logo} alt="Logo" style={{ height: 44 }} />
          <div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>Notification Signup</div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Choose what league alerts you want</div>
          </div>
        </div>

        <button onClick={() => (window.location.pathname = "/standings")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 900 }}>
          Back
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
        {submitted ? (
          <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 18, padding: 30, textAlign: "center" }}>
            <h2>✅ You’re signed up</h2>
            <p style={{ opacity: 0.75 }}>Your notification preferences were saved.</p>
          </div>
        ) : (
          <form onSubmit={submitSignup} style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 18, padding: 24 }}>
            <label>Driver Number</label>
            <input value={form.driver_number} onChange={(e) => setForm({ ...form, driver_number: e.target.value })} required style={inputStyle} placeholder="42" />

            <label>Driver Name</label>
            <input value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} required style={inputStyle} placeholder="AMP-GHOSTRIDER" />

            <label>Email or Phone</label>
            <input value={form.phone_or_email} onChange={(e) => setForm({ ...form, phone_or_email: e.target.value })} required style={inputStyle} placeholder="name@email.com" />

            <div style={{ marginTop: 20 }}>
              <label><input type="checkbox" checked={form.notify_race_results} onChange={(e) => setForm({ ...form, notify_race_results: e.target.checked })} /> Race results</label><br />
              <label><input type="checkbox" checked={form.notify_news} onChange={(e) => setForm({ ...form, notify_news: e.target.checked })} /> News updates</label><br />
              <label><input type="checkbox" checked={form.notify_streams} onChange={(e) => setForm({ ...form, notify_streams: e.target.checked })} /> Live streams</label>
            </div>

            <button type="submit" style={{ marginTop: 22, width: "100%", background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: 14, fontWeight: 900 }}>
              Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  margin: "8px 0 16px",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #313947",
  background: "#0f1319",
  color: "white",
};
