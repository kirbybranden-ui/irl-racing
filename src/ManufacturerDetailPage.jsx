import React from "react";

const pageStyle = { minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif", padding: 24 };
const cardStyle = { background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 20, marginBottom: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };
function normalize(value) { return String(value || "").trim().toLowerCase(); }

export default function ManufacturerDetailPage({ drivers = [], manufacturerDrivers = [], manufacturerStandings = [], standings = [], selectedStanding = null, manufacturer = null, initialManufacturer = "", selectedManufacturer = "", seasonName = "" }) {
  const manufacturerKey = normalize(selectedManufacturer || initialManufacturer || selectedStanding?.manufacturer || manufacturer?.manufacturer);
  const standingsSource = manufacturerStandings.length ? manufacturerStandings : standings;
  const standing = selectedStanding || manufacturer || standingsSource.find((m) => normalize(m.manufacturer) === manufacturerKey) || null;
  const roster = (manufacturerDrivers.length ? manufacturerDrivers : drivers.filter((d) => normalize(d.manufacturer) === manufacturerKey))
    .filter((d) => !normalize(d.name).startsWith("inactive-"))
    .sort((a, b) => (b.points || 0) - (a.points || 0) || Number(a.number || 0) - Number(b.number || 0));
  const fallbackStanding = { manufacturer: selectedManufacturer || initialManufacturer || "Unknown Manufacturer", points: roster.reduce((sum, d) => sum + (d.points || 0), 0), wins: roster.reduce((sum, d) => sum + (d.wins || 0), 0), top3: roster.reduce((sum, d) => sum + (d.top3 || 0), 0), top5: roster.reduce((sum, d) => sum + (d.top5 || 0), 0), drivers: roster.length };
  const data = standing || fallbackStanding;

  return (
    <div style={pageStyle}><div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <button onClick={() => (window.location.href = "/standings")} style={{ background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", marginBottom: 18 }}>← Back to Standings</button>
      <div style={{ ...cardStyle, borderColor: "#d4af37" }}><div style={{ fontSize: 13, opacity: 0.72, marginBottom: 6 }}>{seasonName}</div><div style={{ fontSize: 38, fontWeight: 900 }}>{data.manufacturer}</div><div style={{ fontSize: 15, opacity: 0.72, marginTop: 6 }}>Manufacturer Detail Page</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 18 }}>{[["POINTS", data.points || 0], ["WINS", data.wins || 0], ["TOP 3", data.top3 || 0], ["TOP 5", data.top5 || 0], ["DRIVERS", data.drivers || roster.length]].map(([label, value]) => <div key={label} style={cardStyle}><div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div><div style={{ fontSize: 30, fontWeight: 900 }}>{value}</div></div>)}</div>
      <div style={cardStyle}><div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Drivers</div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th></tr></thead><tbody>{roster.map((d) => <tr key={d.id || d.number} style={{ cursor: "pointer" }} onClick={() => (window.location.href = `/driver/${d.number}`)}><td style={{ ...tdStyle, fontWeight: 900 }}>#{d.number}</td><td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>{d.name}</td><td style={tdStyle}>{d.team || "—"}</td><td style={{ ...tdStyle, fontWeight: 900 }}>{d.points || 0}</td><td style={tdStyle}>{d.wins || 0}</td><td style={tdStyle}>{d.top3 || 0}</td><td style={tdStyle}>{d.top5 || 0}</td><td style={tdStyle}>{d.dnfs || 0}</td></tr>)}{roster.length === 0 && <tr><td style={tdStyle} colSpan={8}>No drivers found for this manufacturer.</td></tr>}</tbody></table></div></div>
    </div></div>
  );
}
