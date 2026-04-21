import React, { useState, useMemo } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import { supabase } from "./lib/supabase";
import CarUploadComponent from "./CarUploadComponent";

// Team logos
const teamLogos = {
  "JA MOTORSPORTS": teamLogoJAM,
  JAM: teamLogoJAM,
};

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

export default function DriverProfilePage({ seasons, activeSeason, tracks = [] }) {
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

  // Calculate all stats
  const careerStats = useMemo(() => {
    let totalWins = 0, totalPoints = 0, totalPodiums = 0, totalRaces = 0;
    allSeasons.forEach(season => {
      const d = season.drivers?.find(dr => dr.id === driver.id);
      if (d) {
        totalWins += d.wins || 0;
        totalPoints += d.points || 0;
        totalPodiums += d.top3 || 0;
        totalRaces += (season.raceHistory || []).filter(r => r.results?.some(res => res.driverId === driver.id)).length;
      }
    });
    return { wins: totalWins, points: totalPoints, podiums: totalPodiums, races: totalRaces };
  }, [allSeasons, driver.id]);

  const recentForm = useMemo(() => {
    return (selectedSeason.raceHistory || [])
      .filter(r => r.results?.some(res => res.driverId === driver.id))
      .slice(-5)
      .map(r => {
        const result = r.results.find(res => res.driverId === driver.id);
        return { race: r.raceName, points: result?.totalRacePoints || 0, finish: result?.finishPos };
      });
  }, [selectedSeason, driver.id]);

  const consistencyRating = useMemo(() => {
    const finishes = raceBreakdown.filter(r => r.finishPos).map(r => r.finishPos);
    if (finishes.length === 0) return { avg: 0, best: "—", worst: "—" };
    const avg = (finishes.reduce((a, b) => a + b, 0) / finishes.length).toFixed(1);
    return { avg, best: Math.min(...finishes), worst: Math.max(...finishes) };
  }, [raceBreakdown]);

  const personalRecords = useMemo(() => {
    let bestFinish = Infinity, fastestLapCount = 0, highestPointsRace = 0;
    raceBreakdown.forEach(r => {
      if (r.finishPos) bestFinish = Math.min(bestFinish, r.finishPos);
      if (r.fastestLap) fastestLapCount++;
      if (r.totalRacePoints) highestPointsRace = Math.max(highestPointsRace, r.totalRacePoints);
    });
    return { bestFinish: bestFinish === Infinity ? "—" : bestFinish, fastestLaps: fastestLapCount, highestRacePoints: highestPointsRace };
  }, [raceBreakdown]);

  const streaks = useMemo(() => {
    let currentWinStreak = 0, longestWinStreak = 0, currentPodiumStreak = 0, longestPodiumStreak = 0, currentDnfStreak = 0, longestDnfStreak = 0;
    raceBreakdown.forEach(r => {
      if (r.isWin) { currentWinStreak++; longestWinStreak = Math.max(longestWinStreak, currentWinStreak); } else currentWinStreak = 0;
      if (r.isTop3) { currentPodiumStreak++; longestPodiumStreak = Math.max(longestPodiumStreak, currentPodiumStreak); } else currentPodiumStreak = 0;
      if (r.dnf) { currentDnfStreak++; longestDnfStreak = Math.max(longestDnfStreak, currentDnfStreak); } else currentDnfStreak = 0;
    });
    return { currentWins: currentWinStreak, longestWins: longestWinStreak, currentPodiums: currentPodiumStreak, longestPodiums: longestPodiumStreak, currentDnfs: currentDnfStreak, longestDnfs: longestDnfStreak };
  }, [raceBreakdown]);

  const driverRanking = useMemo(() => {
    const sorted = [...(selectedSeason.drivers || [])].sort((a, b) => b.points - a.points);
    return sorted.findIndex(d => d.id === driver.id) + 1;
  }, [selectedSeason, driver.id]);

  const pointsGap = useMemo(() => {
    const sorted = [...(selectedSeason.drivers || [])].sort((a, b) => b.points - a.points);
    const driverIdx = sorted.findIndex(d => d.id === driver.id);
    if (driverIdx === 0) return { ahead: 0, behind: 0 };
    const ahead = sorted[driverIdx - 1].points - driver.points;
    const behind = driverIdx < sorted.length - 1 ? driver.points - sorted[driverIdx + 1].points : 0;
    return { ahead, behind };
  }, [selectedSeason, driver.id]);

  const teamStats = useMemo(() => {
    const teammate = (selectedSeason.drivers || []).find(d => d.team === driver.team && d.id !== driver.id);
    if (!teammate) return null;
    return { name: teammate.name, number: teammate.number, points: teammate.points, wins: teammate.wins, top3: teammate.top3 };
  }, [selectedSeason, driver.id]);

  const trackStats = useMemo(() => {
    const tracks = {};
    raceBreakdown.forEach(r => {
      const track = r.raceName;
      if (!tracks[track]) tracks[track] = { races: 0, points: 0, finish: [] };
      tracks[track].races++;
      tracks[track].points += r.totalRacePoints || 0;
      if (r.finishPos) tracks[track].finish.push(r.finishPos);
    });
    const sorted = Object.entries(tracks).sort((a, b) => b[1].points - a[1].points);
    return { best: sorted[0], worst: sorted[sorted.length - 1], total: sorted.length };
  }, [raceBreakdown]);

  const pointsProjection = useMemo(() => {
    const racesCompleted = raceBreakdown.length;
    const totalTracks = selectedSeason.raceHistory?.length || 0;
    if (racesCompleted === 0) return "—";
    const avgPointsPerRace = driver.points / racesCompleted;
    const projected = Math.round(avgPointsPerRace * totalTracks);
    return projected;
  }, [driver.points, raceBreakdown, selectedSeason]);

  const achievementProgress = useMemo(() => {
    const achievements = [
      { name: "First Win", current: driver.wins, target: 1, emoji: "🏆" },
      { name: "Hat Trick", current: driver.wins, target: 3, emoji: "🥇" },
      { name: "Dominator", current: driver.wins, target: 5, emoji: "👑" },
      { name: "Podium Master", current: driver.top3, target: 10, emoji: "🎯" },
      { name: "Century Club", current: driver.points, target: 100, emoji: "⭐" },
      { name: "Speed Demon", current: driver.fastestLaps || 0, target: 5, emoji: "⚡" },
    ];
    return achievements.filter(a => a.current < a.target);
  }, [driver.wins, driver.top3, driver.points, driver.fastestLaps]);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div>
              <button onClick={() => window.location.pathname = "/standings"} style={{ ...secondaryButtonStyle, marginBottom: 12 }}>← Back to Standings</button>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{driver.name}</div>
                <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>#{driver.number}</div>
                <div style={{ fontSize: 14, opacity: 0.8, marginTop: 2 }}>{driver.team}</div>
              </div>
            </div>
            
            {/* Team Logo - Left Center */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 140, height: 140, borderRadius: 8, background: "#0f1319", border: "1px solid #2c3440" }}>
              {teamLogos[driver.team] ? (
                <img src={teamLogos[driver.team]} alt={driver.team} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
              ) : (
                <div style={{ fontWeight: 700, fontSize: 12, color: "#b8a059", textAlign: "center", padding: 8 }}>{driver.team || "—"}</div>
              )}
            </div>
            
            {/* Medium Manufacturer Logo - Center */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 140, height: 140, borderRadius: 8, background: "#0f1319", border: "1px solid #2c3440" }}>
              {driver.manufacturerLogo ? (
                <img src={driver.manufacturerLogo} alt={driver.manufacturer} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
              ) : (
                <div style={{ fontWeight: 700, fontSize: 12, color: "#b8a059", textAlign: "center", padding: 8 }}>{driver.manufacturer || "—"}</div>
              )}
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

        {/* Achievements */}
        {(() => {
          const achievements = [
            { badge: "🏆", name: "First Win", condition: driver.wins >= 1 },
            { badge: "🥇", name: "Hat Trick", condition: driver.wins >= 3 },
            { badge: "👑", name: "Dominator", condition: driver.wins >= 5 },
            { badge: "🎯", name: "Podium Master", condition: driver.top3 >= 10 },
            { badge: "⭐", name: "Century Club", condition: driver.points >= 100 },
            { badge: "⚡", name: "Speed Demon", condition: driver.fastestLaps >= 5 },
          ].filter(a => a.condition);
          
          return achievements.length > 0 && (
            <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Achievements</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {achievements.map((a, i) => (
                  <div key={i} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12, textAlign: "center", minWidth: 90 }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{a.badge}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{a.name}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div style={{ marginBottom: 20 }}>
          <button onClick={() => setIsAppealModalOpen(true)} style={primaryButtonStyle}>File an Appeal</button>
        </div>

        {driver.notes && (
          <div style={{ ...sectionCardStyle, marginBottom: 20, background: "#1a1f27", borderLeft: "4px solid #d4af37" }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Admin Notes</h3>
            <div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>{driver.notes}</div>
          </div>
        )}

        {/* Car Upload Component */}

        {/* Season Stats Overview */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Season Overview</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>RANKING</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#d4af37" }}>P{driverRanking}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>PROJECTION</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{pointsProjection} pts</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Full season estimate</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>AVG FINISH</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{consistencyRating.avg}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Consistency</div>
            </div>
          </div>

          {pointsGap.ahead > 0 && (
            <div style={{ background: "#2a3140", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>📊 <strong>{pointsGap.ahead} points</strong> behind P{driverRanking - 1}</div>
            </div>
          )}
          {pointsGap.behind > 0 && (
            <div style={{ background: "#2a3140", borderRadius: 8, padding: 12 }}>
              <div style={{ fontSize: 13, opacity: 0.8 }}>📊 <strong>{pointsGap.behind} point lead</strong> over P{driverRanking + 1}</div>
            </div>
          )}
        </div>

        {/* Personal Records */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Personal Records</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>BEST FINISH</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#d4af37" }}>{personalRecords.bestFinish}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>FASTEST LAPS</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#d4af37" }}>{personalRecords.fastestLaps}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>BEST RACE</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#d4af37" }}>{personalRecords.highestRacePoints}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>points</div>
            </div>
          </div>
        </div>

        {/* Streaks */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Current Streaks</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: streaks.currentWins > 0 ? "#1a3a1a" : "#0f1319", border: `1px solid ${streaks.currentWins > 0 ? "#4ade80" : "#2c3440"}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>WIN STREAK 🏆</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentWins}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Best: {streaks.longestWins}</div>
            </div>
            <div style={{ background: streaks.currentPodiums > 0 ? "#1a3a1a" : "#0f1319", border: `1px solid ${streaks.currentPodiums > 0 ? "#4ade80" : "#2c3440"}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>PODIUM STREAK 🎯</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentPodiums}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Best: {streaks.longestPodiums}</div>
            </div>
            <div style={{ background: streaks.currentDnfs > 0 ? "#3a1a1a" : "#0f1319", border: `1px solid ${streaks.currentDnfs > 0 ? "#f87171" : "#2c3440"}`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>DNF STREAK 💥</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentDnfs}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Worst: {streaks.longestDnfs}</div>
            </div>
          </div>
        </div>

        {/* Career Stats */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Career Stats (All Seasons)</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>CAREER WINS</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{careerStats.wins}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>CAREER POINTS</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{careerStats.points}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>PODIUMS</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{careerStats.podiums}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>RACES</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{careerStats.races}</div>
            </div>
          </div>
        </div>

        {/* Consistency Analysis */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Consistency Analysis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>AVERAGE FINISH</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>P{consistencyRating.avg}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>BEST - WORST</div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>P{consistencyRating.best} - P{consistencyRating.worst}</div>
              <div style={{ fontSize: 10, opacity: 0.6 }}>Range</div>
            </div>
          </div>
        </div>

        {/* Track Stats */}
        {trackStats.best && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Track Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={{ background: "#1a3a1a", border: "1px solid #4ade80", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, color: "#4ade80" }}>BEST TRACK 🏁</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{trackStats.best[0]}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{trackStats.best[1].points} pts in {trackStats.best[1].races} races</div>
              </div>
              <div style={{ background: "#3a1a1a", border: "1px solid #f87171", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, color: "#f87171" }}>WORST TRACK 🚩</div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{trackStats.worst[0]}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{trackStats.worst[1].points} pts in {trackStats.worst[1].races} races</div>
              </div>
            </div>
          </div>
        )}

        {/* Teammate Comparison */}
        {teamStats && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Teammate Comparison</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{driver.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Points: {driver.points}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Wins: {driver.wins}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {driver.top3}</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>#{teamStats.number} {teamStats.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Points: {teamStats.points}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Wins: {teamStats.wins}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {teamStats.top3}</div>
              </div>
            </div>
          </div>
        )}

        {/* Achievement Milestones */}
        {achievementProgress.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Achievement Progress</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {achievementProgress.map((a, i) => {
                const progress = Math.round((a.current / a.target) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{a.emoji} {a.name}</span>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>{a.current}/{a.target}</span>
                    </div>
                    <div style={{ background: "#0f1319", borderRadius: 8, height: 8, overflow: "hidden" }}>
                      <div style={{ background: "#d4af37", height: "100%", width: `${progress}%`, transition: "width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent Form Chart */}
        {recentForm.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Recent Form (Last 5 Races)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
              {recentForm.map((r, i) => (
                <div key={i} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{r.race.split("(")[0].trim().substring(0, 8)}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{r.points}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>P{r.finish || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
