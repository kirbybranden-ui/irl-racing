import React, { useMemo } from "react";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1200, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const headerButtonStyle = { background: "#222936", color: "white", border: "1px solid #3a4453", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 160px" };

function getMfrColor(mfr) {
  const colors = {
    Chevrolet: "#dc2626",
    Ford: "#2563eb",
    Toyota: "#ef4444",
  };
  return colors[mfr] || "#8b5cf6";
}

export default function ManufacturerDetailPage({ drivers = [], manufacturerStandings = [] }) {
  const mfrName = window.location.pathname.split("/manufacturer/")[1];
  
  const mfrData = manufacturerStandings.find(m => m.manufacturer === mfrName);
  const mfrDrivers = drivers.filter(d => d.manufacturer === mfrName && !d.retired);
  const mfrColor = getMfrColor(mfrName);

  // Calculate league averages for comparison
  const avgStats = useMemo(() => {
    if (drivers.length === 0) return { points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0 };
    const active = drivers.filter(d => !d.retired);
    return {
      points: active.reduce((s, d) => s + d.points, 0) / active.length,
      wins: active.reduce((s, d) => s + d.wins, 0) / active.length,
      top3: active.reduce((s, d) => s + d.top3, 0) / active.length,
      top5: active.reduce((s, d) => s + d.top5, 0) / active.length,
      dnfs: active.reduce((s, d) => s + d.dnfs, 0) / active.length,
    };
  }, [drivers]);

  const sorted = [...mfrDrivers].sort((a, b) => b.points - a.points || b.wins - a.wins);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${mfrColor} 0%, rgba(0,0,0,0.3) 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 24,
                color: "white",
                border: `3px solid ${mfrColor}`,
              }}
            >
              {mfrName.charAt(0)}
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>{mfrName}</h1>
              <div style={{ opacity: 0.6, marginTop: 4 }}>Manufacturer Performance Overview</div>
            </div>
          </div>
          <button onClick={() => (window.location.pathname = "/standings")} style={headerButtonStyle}>← Back to Standings</button>
        </div>

        {/* Quick Stats */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 24 }}>
          {[
            { label: "DRIVERS", value: mfrDrivers.length },
            { label: "POINTS", value: mfrData?.points || 0 },
            { label: "WINS", value: mfrData?.wins || 0 },
            { label: "TOP 3", value: mfrData?.top3 || 0 },
            { label: "TOP 5", value: mfrData?.top5 || 0 },
            { label: "DNFs", value: mfrDrivers.reduce((s, d) => s + d.dnfs, 0) },
          ].map(stat => (
            <div key={stat.label} style={statBoxStyle}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Manufacturer vs League Average */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>📊 {mfrName} vs League Average (per driver)</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Metric</th>
                  <th style={thStyle}>{mfrName}</th>
                  <th style={thStyle}>League Avg</th>
                  <th style={thStyle}>Difference</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Points per Driver", mfrVal: mfrData?.points ? (mfrData.points / mfrDrivers.length).toFixed(1) : 0, leagueVal: avgStats.points.toFixed(1) },
                  { label: "Wins per Driver", mfrVal: mfrData?.wins ? (mfrData.wins / mfrDrivers.length).toFixed(2) : 0, leagueVal: avgStats.wins.toFixed(2) },
                  { label: "Top 3 Finishes per Driver", mfrVal: mfrData?.top3 ? (mfrData.top3 / mfrDrivers.length).toFixed(2) : 0, leagueVal: avgStats.top3.toFixed(2) },
                  { label: "Top 5 Finishes per Driver", mfrVal: mfrData?.top5 ? (mfrData.top5 / mfrDrivers.length).toFixed(2) : 0, leagueVal: avgStats.top5.toFixed(2) },
                  { label: "DNFs per Driver", mfrVal: (mfrDrivers.reduce((s, d) => s + d.dnfs, 0) / mfrDrivers.length).toFixed(2), leagueVal: avgStats.dnfs.toFixed(2) },
                ].map((row, i) => {
                  const diff = parseFloat(row.mfrVal) - parseFloat(row.leagueVal);
                  const diffColor = diff > 0 ? "#4ade80" : "#f87171";
                  return (
                    <tr key={i}>
                      <td style={tdStyle}>{row.label}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{row.mfrVal}</td>
                      <td style={{ ...tdStyle, opacity: 0.7 }}>{row.leagueVal}</td>
                      <td style={{ ...tdStyle, color: diffColor, fontWeight: 700 }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manufacturer Ranking */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>🏆 How {mfrName} Stacks Up</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Manufacturer</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 3</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>Drivers</th>
                </tr>
              </thead>
              <tbody>
                {manufacturerStandings.map((mfr, idx) => {
                  const isThisMfr = mfr.manufacturer === mfrName;
                  const mfrColor2 = getMfrColor(mfr.manufacturer);
                  return (
                    <tr key={mfr.manufacturer} style={{ background: isThisMfr ? "rgba(212,175,55,0.12)" : "transparent" }}>
                      <td style={{ ...tdStyle, fontWeight: 900, color: isThisMfr ? "#d4af37" : "white" }}>{idx + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 6,
                              background: `linear-gradient(135deg, ${mfrColor2} 0%, rgba(0,0,0,0.2) 100%)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 12,
                              color: "white",
                              border: `2px solid ${mfrColor2}`,
                            }}
                          >
                            {mfr.manufacturer.charAt(0)}
                          </div>
                          <span style={{ fontWeight: isThisMfr ? 800 : 600 }}>{mfr.manufacturer}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: isThisMfr ? 800 : 600 }}>{mfr.points}</td>
                      <td style={tdStyle}>{mfr.wins}</td>
                      <td style={tdStyle}>{mfr.top3}</td>
                      <td style={tdStyle}>{mfr.top5}</td>
                      <td style={tdStyle}>{mfr.drivers}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manufacturer Drivers */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>👥 {mfrName} Drivers</h2>
          {sorted.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No active drivers using {mfrName}.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Points</th>
                    <th style={thStyle}>Wins</th>
                    <th style={thStyle}>Top 3</th>
                    <th style={thStyle}>Top 5</th>
                    <th style={thStyle}>DNFs</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(driver => (
                    <tr key={driver.id}>
                      <td style={{ ...tdStyle, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059" }}>
                          {driver.number}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{driver.name}</td>
                      <td style={tdStyle}>{driver.team || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{driver.points}</td>
                      <td style={tdStyle}>{driver.wins}</td>
                      <td style={tdStyle}>{driver.top3}</td>
                      <td style={tdStyle}>{driver.top5}</td>
                      <td style={tdStyle}>{driver.dnfs || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Insights */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 12 }}>💡 Quick Insights</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, lineHeight: 1.6 }}>
            {mfrDrivers.length > 0 ? (
              <>
                <div>
                  <strong>Average Points per Driver:</strong> {(mfrData?.points ? (mfrData.points / mfrDrivers.length).toFixed(1) : 0)} 
                  {avgStats.points > 0 && ` (${((((mfrData?.points || 0) / mfrDrivers.length) / avgStats.points * 100 - 100).toFixed(0))}% vs league avg)`}
                </div>
                <div>
                  <strong>Top Driver:</strong> {sorted[0]?.name} with {sorted[0]?.points} points
                </div>
                {mfrData && (
                  <div>
                    <strong>Win Rate:</strong> {mfrData.wins} wins across {mfrDrivers.length} drivers
                  </div>
                )}
              </>
            ) : (
              <div style={{ opacity: 0.7 }}>No data available for this manufacturer.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
