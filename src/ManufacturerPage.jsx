import { useState, useMemo } from "react";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1200, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const statBoxStyle = { background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 16, textAlign: "center" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };

export default function ManufacturerPage({ manufacturerName, drivers = [], raceHistory = [] }) {
  const [compareManufacturers, setCompareManufacturers] = useState([manufacturerName]);

  // Get all active manufacturers
  const allManufacturers = [...new Set(drivers.map(d => d.manufacturer).filter(Boolean))].sort();

  // Get drivers for this manufacturer
  const mfgDrivers = drivers.filter(d => d.manufacturer === manufacturerName && !d.retired);

  // Calculate manufacturer stats
  const mfgStats = useMemo(() => {
    const stats = {
      totalPoints: 0,
      totalWins: 0,
      totalPodiums: 0,
      totalDNFs: 0,
      totalFastestLaps: 0,
      raceCount: 0,
      topPerformer: null,
      maxPoints: 0,
    };

    mfgDrivers.forEach(driver => {
      stats.totalPoints += driver.points || 0;
      stats.totalWins += driver.wins || 0;
      stats.totalPodiums += driver.podiums || 0;
      stats.totalDNFs += driver.dnfs || 0;
      stats.totalFastestLaps += driver.fastestLaps || 0;

      if (driver.points > stats.maxPoints) {
        stats.maxPoints = driver.points;
        stats.topPerformer = driver.name;
      }
    });

    stats.raceCount = raceHistory.length || 1;
    stats.avgPointsPerRace = (stats.totalPoints / stats.raceCount).toFixed(1);
    stats.winRate = mfgDrivers.length > 0 ? ((stats.totalWins / (stats.raceCount * mfgDrivers.length)) * 100).toFixed(1) : 0;

    return stats;
  }, [mfgDrivers, raceHistory]);

  // Driver stats
  const driverStats = mfgDrivers.map(driver => {
    const avgFinish = driver.races && driver.races.length > 0
      ? (driver.races.reduce((sum, r) => sum + (r.finishPos || 999), 0) / driver.races.length).toFixed(1)
      : "—";
    return { ...driver, avgFinish };
  }).sort((a, b) => b.points - a.points);

  // Comparison data
  const comparisonData = useMemo(() => {
    return compareManufacturers.map(mfg => {
      const mDrivers = drivers.filter(d => d.manufacturer === mfg && !d.retired);
      let mStats = {
        manufacturer: mfg,
        totalPoints: 0,
        totalWins: 0,
        driverCount: mDrivers.length,
      };
      mDrivers.forEach(d => {
        mStats.totalPoints += d.points || 0;
        mStats.totalWins += d.wins || 0;
      });
      mStats.avgPointsPerDriver = mDrivers.length > 0 ? (mStats.totalPoints / mDrivers.length).toFixed(1) : 0;
      return mStats;
    });
  }, [compareManufacturers, drivers]);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <button onClick={() => window.location.pathname = "/standings"} style={{ ...secondaryButtonStyle, marginBottom: 16 }}>← Back to Standings</button>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 32, fontWeight: 900 }}>{manufacturerName}</h1>
          <div style={{ opacity: 0.6, fontSize: 14 }}>{mfgDrivers.length} active driver{mfgDrivers.length !== 1 ? "s" : ""}</div>
        </div>

        {/* Manufacturer Stats Summary */}
        <div style={{ ...sectionCardStyle, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#d4af37" }}>{mfgStats.totalPoints}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Total Points</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#4ade80" }}>{mfgStats.totalWins}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Wins</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#60a5fa" }}>{mfgStats.avgPointsPerRace}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Avg Points/Race</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#f97316" }}>{mfgStats.winRate}%</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Win Rate</div>
          </div>
          <div style={statBoxStyle}>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{mfgStats.topPerformer || "—"}</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Top Performer</div>
          </div>
        </div>

        {/* Driver Roster */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Driver Roster</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {driverStats.map(driver => (
              <div key={driver.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 14, cursor: "pointer" }} onClick={() => window.location.pathname = `/driver/${driver.number}`}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>#{driver.number} {driver.name}</div>
                <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>{driver.team}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "#d4af37" }}>{driver.points}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Points</div>
                  </div>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "#4ade80" }}>{driver.wins}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Wins</div>
                  </div>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "#60a5fa" }}>{driver.podiums || 0}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Podiums</div>
                  </div>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: "#f97316" }}>{driver.dnfs || 0}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>DNFs</div>
                  </div>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{driver.fastestLaps || 0}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Fast Laps</div>
                  </div>
                  <div style={{ background: "#1a1f2e", padding: 8, borderRadius: 6 }}>
                    <div style={{ fontWeight: 700 }}>{driver.avgFinish}</div>
                    <div style={{ opacity: 0.6, fontSize: 11 }}>Avg Finish</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manufacturer Comparison */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Compare Manufacturers</h2>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Select manufacturers to compare:</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allManufacturers.map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setCompareManufacturers(prev =>
                      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                    );
                  }}
                  style={{
                    background: compareManufacturers.includes(m) ? "#d4af37" : "#2a3140",
                    color: compareManufacturers.includes(m) ? "#111" : "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2c3440" }}>
                  <th style={{ padding: 12, textAlign: "left", fontWeight: 700 }}>Manufacturer</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>Drivers</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>Total Points</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>Avg Points/Driver</th>
                  <th style={{ padding: 12, textAlign: "center", fontWeight: 700 }}>Wins</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map(comp => (
                  <tr key={comp.manufacturer} style={{ borderBottom: "1px solid #1a1f2e" }}>
                    <td style={{ padding: 12 }}>{comp.manufacturer}</td>
                    <td style={{ padding: 12, textAlign: "center" }}>{comp.driverCount}</td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 700, color: "#d4af37" }}>{comp.totalPoints}</td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 700, color: "#60a5fa" }}>{comp.avgPointsPerDriver}</td>
                    <td style={{ padding: 12, textAlign: "center", fontWeight: 700, color: "#4ade80" }}>{comp.totalWins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
