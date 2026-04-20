import React, { useState } from "react";
import logo from "./assets/logo1.png";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, boxSizing: "border-box" };
const containerStyle = { maxWidth: 500, width: "100%", background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", border: "1px solid #313947", borderRadius: 24, padding: 32, boxShadow: "0 14px 34px rgba(0,0,0,0.28)" };
const headerStyle = { display: "flex", alignItems: "center", gap: 16, marginBottom: 28, justifyContent: "center" };
const logoStyle = { height: 48, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" };
const titleStyle = { fontSize: 28, fontWeight: 900, letterSpacing: 0.5, lineHeight: 1.2 };
const subtitleStyle = { fontSize: 14, opacity: 0.76, marginTop: 4 };
const formGroupStyle = { marginBottom: 18 };
const labelStyle = { display: "block", marginBottom: 8, fontWeight: 700, fontSize: 13, opacity: 0.9 };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "12px 14px", boxSizing: "border-box", fontSize: 14, fontFamily: "Arial, sans-serif" };
const inputFocusStyle = { ...inputStyle, borderColor: "#d4af37", boxShadow: "0 0 12px rgba(212,175,55,0.2)" };
const submitButtonStyle = { width: "100%", background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "14px 16px", fontWeight: 800, cursor: "pointer", fontSize: 15, marginTop: 8 };
const successMessageStyle = { background: "rgba(34,197,94,0.15)", border: "1px solid #22c55e", borderRadius: 10, padding: 14, marginBottom: 18, color: "#22c55e", fontSize: 13, fontWeight: 700 };
const errorMessageStyle = { background: "rgba(248,113,113,0.15)", border: "1px solid #f87171", borderRadius: 10, padding: 14, marginBottom: 18, color: "#f87171", fontSize: 13, fontWeight: 700 };
const linkStyle = { color: "#d4af37", textDecoration: "none", fontWeight: 700, cursor: "pointer" };
const footerStyle = { marginTop: 24, textAlign: "center", opacity: 0.65, fontSize: 12 };

export default function WelcomePage() {
  const [driverName, setDriverName] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [teamName, setTeamName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validation
    if (!driverName.trim()) {
      setErrorMessage("Please enter your driver name.");
      return;
    }
    if (!carNumber.trim()) {
      setErrorMessage("Please enter your car number.");
      return;
    }
    if (!manufacturer.trim()) {
      setErrorMessage("Please enter your manufacturer.");
      return;
    }
    if (!teamName.trim()) {
      setErrorMessage("Please enter your team name.");
      return;
    }

    setSubmitting(true);

    try {
      // Save to Supabase pending_drivers table
      const { error } = await supabase.from("pending_drivers").insert({
        driver_name: driverName.trim(),
        car_number: Number(carNumber),
        manufacturer: manufacturer.trim(),
        team_name: teamName.trim(),
        status: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccessMessage("✓ Thank you! Your information has been submitted. The admin will review and add you to the league shortly.");
      setDriverName("");
      setCarNumber("");
      setManufacturer("");
      setTeamName("");

      setTimeout(() => {
        window.location.pathname = "/standings";
      }, 2500);
    } catch (err) {
      console.error("Submission error:", err);
      setErrorMessage("Failed to submit. Please try again or contact an admin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={appShellStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <img src={logo} alt="League Logo" style={logoStyle} />
          <div>
            <div style={titleStyle}>Welcome</div>
            <div style={subtitleStyle}>Budweiser Cup League</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {successMessage && <div style={successMessageStyle}>{successMessage}</div>}
          {errorMessage && <div style={errorMessageStyle}>{errorMessage}</div>}

          <div style={formGroupStyle}>
            <label style={labelStyle}>Driver Name *</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              style={focusedField === "name" ? inputFocusStyle : inputStyle}
              placeholder="Enter your driver name"
              disabled={submitting}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Car Number *</label>
            <input
              type="number"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              onFocus={() => setFocusedField("number")}
              onBlur={() => setFocusedField(null)}
              style={focusedField === "number" ? inputFocusStyle : inputStyle}
              placeholder="e.g., 46"
              disabled={submitting}
              min="1"
              max="999"
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Manufacturer *</label>
            <select
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              onFocus={() => setFocusedField("manufacturer")}
              onBlur={() => setFocusedField(null)}
              style={focusedField === "manufacturer" ? inputFocusStyle : inputStyle}
              disabled={submitting}
            >
              <option value="">Select a manufacturer</option>
              <option value="Chevrolet">Chevrolet</option>
              <option value="Ford">Ford</option>
              <option value="Toyota">Toyota</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Team Name *</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              onFocus={() => setFocusedField("team")}
              onBlur={() => setFocusedField(null)}
              style={focusedField === "team" ? inputFocusStyle : inputStyle}
              placeholder="Enter your team name"
              disabled={submitting}
            />
          </div>

          <button
            type="submit"
            style={submitButtonStyle}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Information"}
          </button>
        </form>

        <div style={footerStyle}>
          <div style={{ marginTop: 16, lineHeight: 1.6 }}>
            Already registered?{" "}
            <a
              style={linkStyle}
              onClick={() => (window.location.pathname = "/standings")}
            >
              View Standings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
