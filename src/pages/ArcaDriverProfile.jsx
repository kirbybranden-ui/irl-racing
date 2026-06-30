import React, { useState } from "react";

export default function ArcaDriverProfile({ 
  driverNumber = "", 
  arcaDrivers = [], 
  arcaRaceHistory = [], 
  arcaTracks = [],
  activeSeason = null,
  onBack = () => window.history.back()
}) {
  const driver = arcaDrivers.find(d => String(d.number) === String(driverNumber));
  
  if (!driver) {
    return (
      <div style={{ padding: 20, textAlign: "center", background: "#f8f9fa", minHeight: "100vh" }}>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#111827" }}>Driver not found</div>
        <button onClick={onBack} style={{ marginTop: 20, padding: "10px 16px", background: "#006341", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 900 }}>← Back</button>
      </div>
    );
  }

  // Get driver's race results
  const driverRaces = arcaRaceHistory
    .map(race => {
      const result = (race.results || []).find(r => r.driverId === driver.id);
      return result ? { ...result, raceName: race.raceName, raceDate: race.raceDate } : null;
    })
    .filter(Boolean)
    .reverse();

  // Calculate stats
  const stats = {
    starts: driverRaces.length,
    wins: driverRaces.filter(r => r.finishPos === 1).length,
    top5: driverRaces.filter(r => r.finishPos && r.finishPos <= 5).length,
    top10: driverRaces.filter(r => r.finishPos && r.finishPos <= 10).length,
    dnfs: driverRaces.filter(r => r.dnf).length,
    points: driver.points || 0,
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div style={{ background: "#f8f9fa", minHeight: "100vh", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #006341 0%, #00e5a0 100%)", color: "#fff", padding: isMobile ? 16 : 24 }}>
        <button 
          onClick={onBack}
          style={{ 
            background: "rgba(255,255,255,0.2)", 
            color: "#fff", 
            border: "none", 
            padding: "8px 12px", 
            borderRadius: 8, 
            cursor: "pointer",
            fontWeight: 900,
            marginBottom: 16
          }}
        >
          ← Back
        </button>
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto", gap: 16, alignItems: "center" }}>
          <div style={{ 
            width: isMobile ? 60 : 80, 
            height: isMobile ? 60 : 80, 
            borderRadius: 16, 
            background: "rgba(255,255,255,0.2)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            fontWeight: 1000,
            fontSize: isMobile ? 28 : 36
          }}>
            #{driver.number}
          </div>
          
          <div>
            <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 1000, letterSpacing: -0.5 }}>{driver.name}</div>
            <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>{driver.team} • {driver.manufacturer}</div>
          </div>

          {!isMobile && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 32, fontWeight: 1000 }}>{driver.points}</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>POINTS</div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ padding: isMobile ? 12 : 20, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: isMobile ? 10 : 14 }}>
        {[
          { label: "Starts", value: stats.starts },
          { label: "Wins", value: stats.wins },
          { label: "Top 5", value: stats.top5 },
          { label: "Top 10", value: stats.top10 },
          { label: "DNFs", value: stats.dnfs },
        ].map(stat => (
          <div key={stat.label} style={{ 
            background: "#fff", 
            padding: isMobile ? 12 : 16, 
            borderRadius: 12, 
            border: "1px solid rgba(0,99,65,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 1000, color: "#006341" }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, fontWeight: 900 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Race History */}
      <div style={{ padding: isMobile ? 12 : 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase", color: "#006341" }}>Race History</div>
          <h2 style={{ margin: "6px 0 0", fontSize: isMobile ? 24 : 28, fontWeight: 1000, letterSpacing: -0.5 }}>ARCA Results</h2>
        </div>

        {driverRaces.length === 0 ? (
          <div style={{ 
            background: "#fff", 
            padding: 32, 
            borderRadius: 16, 
            textAlign: "center",
            border: "1px solid rgba(0,99,65,0.1)"
          }}>
            <div style={{ color: "#6b7280", fontWeight: 900 }}>No races yet</div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {driverRaces.map((race, idx) => (
              <div 
                key={`${race.raceName}-${idx}`}
                style={{ 
                  background: "#fff", 
                  padding: isMobile ? 12 : 16, 
                  borderRadius: 12, 
                  border: "1px solid rgba(0,99,65,0.1)",
                  display: "grid",
                  gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto auto auto",
                  gap: 12,
                  alignItems: "center"
                }}
              >
                <div style={{ 
                  width: 44, 
                  height: 44, 
                  borderRadius: "50%", 
                  background: race.dnf ? "#fee2e2" : "#dcfce7",
                  color: race.dnf ? "#991b1b" : "#166534",
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontWeight: 1000
                }}>
                  {race.dnf ? "DNF" : race.finishPos}
                </div>
                
                <div>
                  <div style={{ fontWeight: 900, color: "#111827" }}>{race.raceName}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{race.raceDate}</div>
                </div>

                {!isMobile && (
                  <>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, color: "#006341" }}>{race.finishPoints || 0}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>PTS</div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      {race.fastestLap && <span style={{ fontWeight: 900, color: "#d4af37" }}>⚡</span>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 900, fontSize: 12 }}>{race.penaltyPoints || 0}</div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>PEN</div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
