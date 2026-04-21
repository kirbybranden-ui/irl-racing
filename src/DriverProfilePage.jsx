import React, { useState, useMemo } from "react";
import logo from "./assets/logo1.png";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 160px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };

function AppealModal({ isOpen, onClose, driverId, driverName, driverNumber }) {
  const [appealType, setAppealType] = useState("offense");
  const [raceContext, setRaceContext] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert("Please describe your appeal.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("appeals").insert({
        driver_number: driverNumber,
        driver_name: driverName,
        appeal_type: appealType,
        race_context: raceContext.trim(),
        description: description.trim(),
        status: "Open",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert("Appeal submitted successfully!");
      setAppealType("offense");
      setRaceContext("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error("Appeal submission error:", err);
      alert("Failed to submit appeal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 28, maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>File an Appeal</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: 0 }}>×</button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Appeal Type</label>
          <select style={inputStyle} value={appealType} onChange={(e) => setAppealType(e.target.value)}>
            <option value="offense">Challenge an offense penalty</option>
            <option value="result">Dispute race results/finishing position</option>
            <option value="points">Request manual points adjustment</option>
            <option value="general">General league question</option>
          </select>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race (optional)</label>
          <input style={inputStyle} value={raceContext} onChange={(e) => setRaceContext(e.target.value)} placeholder="E.g., Daytona (R1)" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain your appeal in detail..." />
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSubmit} style={primaryButtonStyle} disabled={submitting}>{submitting ? "Submitting..." : "Submit Appeal"}</button>
          <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function DriverProfilePage({ seasons, activeSeason }) {
  const pathParts = window.location.pathname.split("/");
  const driverNumber = pathParts[2];

  const allSeasons = Array.isArray(seasons) ? seasons : [];
  const currentActiveSeason = activeSeason && typeof activeSeason === "object" ? activeSeason : null;

  const initialSeasonId = currentActiveSeason?.id || allSeasons[0]?.id || null;
  const [selectedSeasonId, setSelectedSeasonId] = useState(initialSeasonId);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);

  const selectedSeason = selectedSeasonId && allSeasons.length > 0 
    ? allSeasons.find((s) => s && s.id === selectedSeasonId) 
    : null;

  const driver = selectedSeason && selectedSeason.drivers
    ? selectedSeason.drivers.find((d) => d && String(d.number) === String(driverNumber))
    : null;

  if (!selectedSeason) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <button onClick={() => window.location.pathname = "/standings"} style={secondaryButtonStyle}>← Back to Standings</button>
            <div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>Select a Season:</div>
            {allSeasons.length > 0 ? (
              <select 
                style={inputStyle} 
                value={selectedSeasonId || ""} 
                onChange={(e) => setSelectedSeasonId(e.target.value)}
              >
                <option value="">-- Choose a season --</option>
                {allSeasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            ) : (
              <div style={{ opacity: 0.75 }}>No seasons loaded. Try refreshing the page.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <button onClick={() => window.location.pathname = "/standings"} style={secondaryButtonStyle}>← Back to Standings</button>
            <div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>Driver #{driverNumber} not found in {selectedSeason?.name}</div>
            {allSeasons.length > 1 && (
              <div>
                <div style={{ marginBottom: 8, fontSize: 12, opacity: 0.8 }}>Try another season:</div>
                <select 
                  style={inputStyle} 
                  value={selectedSeasonId || ""} 
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                >
                  {allSeasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const offenseLog = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return (selectedSeason.raceHistory || []).flatMap((race) =>
      (race.results || [])
        .filter((r) => r && r.driverId === driver.id && r.offense)
        .map((r) => ({ raceName: race.raceName, ...r }))
    );
  }, [selectedSeason, driver]);

  const raceBreakdown = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return (selectedSeason.raceHistory || [])
      .map((race) => {
        const result = (race.results || []).find((r) => r && r.driverId === driver.id);
        return { raceName: race.raceName, stageCount: race.stageCount, ...result };
      })
      .filter((r) => r.driverId === driver.id);
  }, [selectedSeason, driver]);

  const seasonIndex = allSeasons.findIndex((s) => s && s.id === selectedSeasonId);

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, position: "relative" }}>
        {/* Manufacturer Logo - Top Left */}
        <div style={{ position: "absolute", top: 20, left: 20, width: 90, height: 90, borderRadius: 8, background: "#1a1e27", border: "2px solid #404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: "#b8a059", textAlign: "center", padding: 6, boxSizing: "border-box", zIndex: 10 }}>
          {driver.manufacturer || "—"}
        </div>

        <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <button onClick={() => window.location.pathname = "/standings"} style={{ ...secondaryButtonStyle, marginBottom: 12 }}>← Back to Standings</button>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{driver.name}</div>
                <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>#{driver.number}</div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>{driver.team}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>SEASON</div>
              {allSeasons.length > 0 ? (
                <select 
                  style={{ ...inputStyle, maxWidth: 240, marginBottom: 12 }} 
                  value={selectedSeasonId || ""} 
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                >
                  {allSeasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>—</div>
              )}
              {seasonIndex > 0 && <div style={{ fontSize: 12, opacity: 0.6 }}>Joined in {selectedSeason.name}</div>}
            </div>
          </div>
        </div>

        {/* Large Centered Manufacturer Logo */}
        <div style={{ ...sectionCardStyle, marginBottom: 20, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 280 }}>
          {driver.manufacturerLogo ? (
            <img src={driver.manufacturerLogo} alt={driver.manufacturer} style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }} />
          ) : (
            <div style={{ fontWeight: 700, fontSize: 18, color: "#b8a059", textAlign: "center" }}>{driver.manufacturer || "No Manufacturer"}</div>
          )}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {[
            { label: "POINTS", value: driver.points || 0 },
            { label: "WINS", value: driver.wins || 0 },
            { label: "TOP 3", value: driver.top3 || 0 },
            { label: "TOP 5", value: driver.top5 || 0 },
            { label: "DNFs", value: driver.dnfs || 0 },
            { label: "PENALTIES", value: driver.totalPenalties ? `-${driver.totalPenalties}` : "0" },
          ].map((stat) => (
            <div key={stat.label} style={statBoxStyle}>
              <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setIsAppealModalOpen(true)} style={primaryButtonStyle}>File an Appeal</button>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Race-by-Race Breakdown</h2>
          {raceBreakdown.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No races entered yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Race</th>
                    <th style={thStyle}>Finish</th>
                    <th style={thStyle}>Race Pts</th>
                    <th style={thStyle}>Stage 1</th>
                    <th style={thStyle}>Stage 2</th>
                    <th style={thStyle}>FL</th>
                    <th style={thStyle}>DNF</th>
                    <th style={thStyle}>Offense</th>
                    <th style={thStyle}>Penalty</th>
                    <th style={thStyle}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {raceBreakdown.map((race) => (
                    <tr key={race.raceName}>
                      <td style={tdStyle}>{race.raceName}</td>
                      <td style={tdStyle}>{race.finishPos ?? "—"}</td>
                      <td style={tdStyle}>{race.finishPoints || 0}</td>
                      <td style={tdStyle}>{race.stage1Points || 0}</td>
                      <td style={tdStyle}>{race.stage2Points || 0}</td>
                      <td style={tdStyle}>{race.fastestLap ? "+1" : "—"}</td>
                      <td style={tdStyle}>{race.dnf ? "DNF" : "—"}</td>
                      <td style={tdStyle}>{race.offense ? `#${race.offenseNumber}` : "—"}</td>
                      <td style={{ ...tdStyle, color: (race.penaltyPoints || 0) > 0 ? "#f87171" : "inherit" }}>{(race.penaltyPoints || 0) > 0 ? `-${race.penaltyPoints}` : "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{race.totalRacePoints || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {offenseLog.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Offense History</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Race</th>
                    <th style={thStyle}>Offense #</th>
                    <th style={thStyle}>Penalty Points</th>
                  </tr>
                </thead>
                <tbody>
                  {offenseLog.map((entry, idx) => (
                    <tr key={`${entry.raceName}-${idx}`}>
                      <td style={tdStyle}>{entry.raceName}</td>
                      <td style={tdStyle}>#{entry.offenseNumber}</td>
                      <td style={{ ...tdStyle, color: "#f87171", fontWeight: 700 }}>-{entry.penaltyPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} driverId={driver.id} driverName={driver.name} driverNumber={driver.number} />
    </div>
  );
}
