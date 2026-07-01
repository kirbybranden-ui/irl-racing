import React, { useState } from "react";
import { ReportIssueModal } from "../components/ReportIssueModal";

const SERIES = [
  { id: "cup", name: "Cup Series", sub: "Main Budweiser Cup League" },
  { id: "xfinity", name: "Xfinity Series", sub: "Upper developmental series" },
  { id: "trucks", name: "Craftsman Truck Series", sub: "Developmental truck division" },
  { id: "arca", name: "ARCA Menards Series", sub: "Entry developmental ladder" },
];

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #2a0505 0%, #050505 46%, #020202 100%)",
  color: "white",
  padding: "34px 18px",
};

const wrapStyle = { maxWidth: 1180, margin: "0 auto" };
const cardStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 22,
  padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
};

export default function SeriesPortal() {
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const go = (to) => { window.location.href = to; };

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        <div style={{ ...cardStyle, textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#facc15", fontWeight: 900 }}>
            Budweiser Cup League
          </div>
          <h1 style={{ fontSize: "clamp(34px, 7vw, 72px)", margin: "10px 0 8px", lineHeight: 0.95 }}>
            Budweiser Motorsports
          </h1>
          <p style={{ fontSize: 18, fontWeight: 1000, color: "#facc15", margin: "0 0 12px" }}>
            One League. Four National Series. One Career.
          </p>
          <p style={{ opacity: 0.86, maxWidth: 860, margin: "0 auto", lineHeight: 1.7 }}>
            The Budweiser Cup League is built different: not just weekly races, but a full motorsports ecosystem with team ownership, driver contracts, development rides, media duties, race results, standings, finances, paint scheme voting, and a true ladder from ARCA to Trucks to Xfinity to Cup. Every race matters. Every decision has consequences. Every championship is earned.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
          {SERIES.map((series) => (
            <button
              key={series.id}
              type="button"
              onClick={() => go(`/series/${series.id}`)}
              style={{
                ...cardStyle,
                minHeight: 170,
                textAlign: "left",
                cursor: "pointer",
                color: "white",
                background: "linear-gradient(145deg, rgba(185,28,28,0.95), rgba(17,24,39,0.94))",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 1000 }}>{series.name}</div>
              <div style={{ marginTop: 10, opacity: 0.78, fontWeight: 700 }}>{series.sub}</div>
              <div style={{ marginTop: 26, fontWeight: 1000, color: "#facc15" }}>ENTER →</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button type="button" onClick={() => go("/standings")} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", background: "#111827", color: "white", fontWeight: 900 }}>
            View Current Cup Standings
          </button>
          <button type="button" onClick={() => go("/admin")} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.16)", background: "#7f1d1d", color: "white", fontWeight: 900 }}>
            Admin Portal
          </button>
          <button type="button" onClick={() => setIsReportingIssue(true)} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid #ef4444", background: "#050505", color: "#fca5a5", fontWeight: 900 }}>
            🐛 Report Issue
          </button>
        </div>
      </div>

      <ReportIssueModal
        isOpen={isReportingIssue}
        onClose={() => setIsReportingIssue(false)}
        driverNumber=""
        driverName="Guest User"
        series="cup"
      />
    </div>
  );
}
