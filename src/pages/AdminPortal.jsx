/**
 * ARCA ADMIN OPERATIONS SECTION
 * Add this to AdminPortal.jsx
 * 
 * 1. Add to AdminPortal function parameters:
 *    arcaRaces, setArcaRaces, arcaDrivers, setArcaDrivers, arcaSeasons, setArcaSeasons,
 *    saveArcaRace, saveArcaRaceResults, arcaSelectedRace, setArcaSelectedRace
 * 
 * 2. Add state variables near top (around line 241):
 *    const [arcaOperationsTab, setArcaOperationsTab] = useState("overview");
 *    const [editingArcaRaceId, setEditingArcaRaceId] = useState(null);
 *    const [editingArcaRaceName, setEditingArcaRaceName] = useState("");
 *    const [arcaRaceResults, setArcaRaceResults] = useState({});
 * 
 * 3. Add function near openRaceOperations (around line 500):
 */

function openArcaOperations(tab = "overview") {
  setArcaOperationsTab(tab);
}

/**
 * 4. Add to dashboardCards array (around line 800):
 */

const arcaCard = {
  title: "ARCA Series",
  icon: "🏎️",
  value: arcaRaces?.length > 0 ? `${arcaRaces.length} races` : "Ready",
  meta: arcaSelectedRace ? `Active: ${arcaSelectedRace.name}` : "No active race",
  text: "Manage ARCA races, results, drivers, and standings.",
  action: () => openArcaOperations("overview"),
  gradient: "linear-gradient(135deg, #00b894 0%, #00d2d3 45%, #0984e3 100%)",
};

/**
 * 5. Add to the return JSX, before Race Operations section (around line 1400):
 */

{/* ARCA SERIES SECTION */}
{arcaOperationsTab && (
  <div style={{ ...appShellStyle, minHeight: "100vh" }}>
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 48, fontWeight: 1000, margin: 0 }}>🏎️ ARCA Series</h1>
        <button type="button" onClick={() => setArcaOperationsTab(null)} style={{ ...dangerButtonStyle, padding: "10px 16px" }}>
          Close
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          ["overview", "📊 Overview"],
          ["races", "🏁 Races"],
          ["standings", "📈 Standings"],
          ["drivers", "👥 Drivers"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setArcaOperationsTab(key)}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: arcaOperationsTab === key ? "2px solid #00d2d3" : "1px solid rgba(255,255,255,0.2)",
              background: arcaOperationsTab === key ? "rgba(0,210,211,0.2)" : "rgba(255,255,255,0.05)",
              color: "white",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {arcaOperationsTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,210,211,0.3)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Total Races</div>
            <div style={{ fontSize: 36, fontWeight: 1000 }}>{arcaRaces?.length || 0}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,210,211,0.3)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Total Drivers</div>
            <div style={{ fontSize: 36, fontWeight: 1000 }}>{arcaDrivers?.length || 0}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(0,210,211,0.3)", borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 8 }}>Active Season</div>
            <div style={{ fontSize: 18, fontWeight: 1000 }}>{arcaSeasons?.find((s) => s.active)?.name || "None"}</div>
          </div>
        </div>
      )}

      {/* RACES TAB */}
      {arcaOperationsTab === "races" && (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Manage ARCA Races</h2>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
            {arcaRaces && arcaRaces.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Race</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Track</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Date</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Results</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {arcaRaces.map((race) => (
                    <tr key={race.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: 12 }}>{race.name}</td>
                      <td style={{ padding: 12 }}>{race.track}</td>
                      <td style={{ padding: 12, opacity: 0.8 }}>{race.date || "TBD"}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>{(race.results || []).length > 0 ? "✓" : "—"}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setArcaSelectedRace(race);
                            setArcaOperationsTab("results");
                          }}
                          style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}
                        >
                          Enter Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>No races scheduled. Add races from the Races tab.</div>
            )}
          </div>
        </div>
      )}

      {/* STANDINGS TAB */}
      {arcaOperationsTab === "standings" && (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>ARCA Driver Standings</h2>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
            {arcaDrivers && arcaDrivers.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Pos</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>#</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Driver</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Team</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Points</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Wins</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Top 5</th>
                  </tr>
                </thead>
                <tbody>
                  {arcaDrivers
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .map((driver, idx) => (
                      <tr key={driver.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                        <td style={{ padding: 12, fontWeight: 900 }}>{idx + 1}</td>
                        <td style={{ padding: 12 }}>#{driver.number}</td>
                        <td style={{ padding: 12 }}>{driver.name}</td>
                        <td style={{ padding: 12, opacity: 0.8 }}>{driver.team || "—"}</td>
                        <td style={{ padding: 12, textAlign: "center", fontWeight: 900 }}>{driver.points || 0}</td>
                        <td style={{ padding: 12, textAlign: "center" }}>{driver.wins || 0}</td>
                        <td style={{ padding: 12, textAlign: "center" }}>{driver.top5 || 0}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>No drivers loaded.</div>
            )}
          </div>
        </div>
      )}

      {/* DRIVERS TAB */}
      {arcaOperationsTab === "drivers" && (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>ARCA Driver Roster</h2>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
            {arcaDrivers && arcaDrivers.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>#</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Driver</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Team</th>
                    <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Manufacturer</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Status</th>
                    <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Cup Driver</th>
                  </tr>
                </thead>
                <tbody>
                  {arcaDrivers.map((driver) => (
                    <tr key={driver.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                      <td style={{ padding: 12, fontWeight: 900 }}>#{driver.number}</td>
                      <td style={{ padding: 12 }}>{driver.name}</td>
                      <td style={{ padding: 12 }}>{driver.team || "—"}</td>
                      <td style={{ padding: 12 }}>{driver.manufacturer || "—"}</td>
                      <td style={{ padding: 12, textAlign: "center", opacity: 0.8 }}>{driver.status}</td>
                      <td style={{ padding: 12, textAlign: "center" }}>{driver.isCupDriver ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 40, textAlign: "center", opacity: 0.6 }}>No drivers loaded.</div>
            )}
          </div>
        </div>
      )}
    </div>
  </div>
)}
