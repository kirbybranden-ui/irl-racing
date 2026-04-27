import { useState, useMemo } from "react";

const MFR_COLORS = {
  Chevrolet: "#fbbf24",
  Ford:      "#3b82f6",
  Toyota:    "#ef4444",
};

const POINTS_MAP = [
  40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18,
  17,
];

function getWinstonPoints(pos) {
  if (pos >= 1 && pos <= 20) return POINTS_MAP[pos - 1];
  return 0;
}

function computeMfrStats(mfr, drivers, raceHistory) {
  const mfrDriverIds = new Set(
    drivers.filter((d) => d.manufacturer === mfr).map((d) => d.id)
  );

  let points = 0,
    wins = 0,
    top3 = 0,
    top5 = 0,
    top10 = 0,
    stagePoints = 0,
    dnfs = 0,
    penalties = 0,
    fastestLaps = 0,
    finishSum = 0,
    finishCount = 0;

  const raceResults = [];

  raceHistory.forEach((race) => {
    const positions = race.positions || {};
    const stage1 = race.stage1 || {};
    const stage2 = race.stage2 || {};
    const stage3 = race.stage3 || {};
    const dnfMap = race.dnfMap || {};
    const offenseMap = race.offenseMap || {};
    const fastestLapMap = race.fastestLapMap || {};

    let racePts = 0;
    let raceFinishSum = 0;
    let raceFinishCount = 0;

    mfrDriverIds.forEach((driverId) => {
      const pos = positions[driverId];
      if (pos === undefined) return;
      const rp = getWinstonPoints(pos);
      const sp = (stage1[driverId] || 0) + (stage2[driverId] || 0) + (stage3[driverId] || 0);
      const fl = fastestLapMap[driverId] ? 1 : 0;
      const offense = offenseMap[driverId] || 0;
      let pen = 0;
      if (offense === 1) pen = 5;
      else if (offense === 2) pen = 10;
      else if (offense === 3) pen = 15;
      else if (offense >= 4) pen = 25;

      const total = rp + sp + fl - pen;
      points += total;
      racePts += total;
      stagePoints += sp;
      penalties += pen;
      if (fl) fastestLaps++;

      if (dnfMap[driverId]) {
        dnfs++;
      } else if (pos >= 1) {
        finishSum += pos;
        finishCount++;
        raceFinishSum += pos;
        raceFinishCount++;
        if (pos === 1) wins++;
        if (pos <= 3) top3++;
        if (pos <= 5) top5++;
        if (pos <= 10) top10++;
      }
    });

    if (raceFinishCount > 0) {
      raceResults.push({
        raceName: race.name || race.id,
        points: racePts,
        avgPos: raceFinishSum / raceFinishCount,
      });
    }
  });

  return {
    points,
    wins,
    top3,
    top5,
    top10,
    stagePoints,
    dnfs,
    penalties,
    fastestLaps,
    avgFinish: finishCount > 0 ? finishSum / finishCount : 0,
    raceResults,
    driverCount: mfrDriverIds.size,
  };
}

function StatBox({ label, value, color }) {
  return (
    <div
      style={{
        background: "#1a1a2e",
        border: `1px solid ${color || "#333"}`,
        borderRadius: 10,
        padding: "14px 18px",
        minWidth: 110,
        flex: 1,
      }}
    >
      <div style={{ color: "#aaa", fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color || "#fff", fontSize: 26, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function RecommendationCard({ type, title, body }) {
  const styles = {
    warning:     { border: "#ef4444", icon: "⚠️", bg: "rgba(239,68,68,0.08)" },
    opportunity: { border: "#3b82f6", icon: "💡", bg: "rgba(59,130,246,0.08)" },
    positive:    { border: "#22c55e", icon: "✅", bg: "rgba(34,197,94,0.08)" },
    info:        { border: "#a855f7", icon: "ℹ️", bg: "rgba(168,85,247,0.08)" },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      style={{
        border: `1px solid ${s.border}`,
        background: s.bg,
        borderRadius: 10,
        padding: "12px 16px",
        marginBottom: 10,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#fff" }}>
        {s.icon} {title}
      </div>
      <div style={{ color: "#ccc", fontSize: 13, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

function BarRow({ label, value, max, color, suffix = "" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 3,
          color: "#ccc",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "#fff", fontWeight: 600 }}>
          {value}{suffix}
        </span>
      </div>
      <div
        style={{
          background: "#222",
          borderRadius: 4,
          height: 8,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: color || "#fbbf24",
            height: "100%",
            borderRadius: 4,
            transition: "width 0.4s",
          }}
        />
      </div>
    </div>
  );
}

export default function ManufacturerDetailPage({
  drivers = [],
  manufacturerStandings = [],
  raceHistory = [],
  initialManufacturer,
}) {
  const allMfrs = useMemo(
    () => [...new Set(drivers.map((d) => d.manufacturer).filter(Boolean))].sort(),
    [drivers]
  );

  const [selectedMfr, setSelectedMfr] = useState(
    initialManufacturer && allMfrs.includes(initialManufacturer)
      ? initialManufacturer
      : allMfrs[0] || "Chevrolet"
  );

  const mfrColor = MFR_COLORS[selectedMfr] || "#fbbf24";

  // Compute stats for all manufacturers
  const allMfrStats = useMemo(() => {
    const map = {};
    allMfrs.forEach((m) => {
      map[m] = computeMfrStats(m, drivers, raceHistory);
    });
    return map;
  }, [allMfrs, drivers, raceHistory]);

  const stats = allMfrStats[selectedMfr] || {};

  // League averages across manufacturers
  const leagueAvg = useMemo(() => {
    const vals = Object.values(allMfrStats);
    if (!vals.length) return {};
    const n = vals.length;
    return {
      points:      vals.reduce((s, v) => s + v.points, 0) / n,
      wins:        vals.reduce((s, v) => s + v.wins, 0) / n,
      top5:        vals.reduce((s, v) => s + v.top5, 0) / n,
      top10:       vals.reduce((s, v) => s + v.top10, 0) / n,
      stagePoints: vals.reduce((s, v) => s + v.stagePoints, 0) / n,
      dnfs:        vals.reduce((s, v) => s + v.dnfs, 0) / n,
      penalties:   vals.reduce((s, v) => s + v.penalties, 0) / n,
      fastestLaps: vals.reduce((s, v) => s + v.fastestLaps, 0) / n,
      avgFinish:   vals.reduce((s, v) => s + v.avgFinish, 0) / n,
    };
  }, [allMfrStats]);

  // Sorted manufacturer standings
  const sortedStandings = useMemo(() => {
    return [...allMfrs]
      .map((m) => ({
        name: m,
        color: MFR_COLORS[m] || "#888",
        ...allMfrStats[m],
      }))
      .sort((a, b) => b.points - a.points)
      .map((m, i) => ({ ...m, rank: i + 1 }));
  }, [allMfrs, allMfrStats]);

  const selectedRank = sortedStandings.find((m) => m.name === selectedMfr)?.rank || "-";

  // Drivers for selected manufacturer
  const mfrDrivers = useMemo(() => {
    return drivers
      .filter((d) => d.manufacturer === selectedMfr)
      .map((driver) => {
        let pts = 0, wins = 0, top5 = 0, stagePts = 0, dnfs = 0,
          finishSum = 0, finishCount = 0;
        raceHistory.forEach((race) => {
          const pos = (race.positions || {})[driver.id];
          if (pos === undefined) return;
          const rp = getWinstonPoints(pos);
          const sp =
            ((race.stage1 || {})[driver.id] || 0) +
            ((race.stage2 || {})[driver.id] || 0) +
            ((race.stage3 || {})[driver.id] || 0);
          const fl = (race.fastestLapMap || {})[driver.id] ? 1 : 0;
          const offense = (race.offenseMap || {})[driver.id] || 0;
          let pen = 0;
          if (offense === 1) pen = 5;
          else if (offense === 2) pen = 10;
          else if (offense === 3) pen = 15;
          else if (offense >= 4) pen = 25;
          pts += rp + sp + fl - pen;
          stagePts += sp;
          if ((race.dnfMap || {})[driver.id]) {
            dnfs++;
          } else if (pos >= 1) {
            finishSum += pos;
            finishCount++;
            if (pos === 1) wins++;
            if (pos <= 5) top5++;
          }
        });
        return {
          ...driver,
          points: pts,
          wins,
          top5,
          stagePoints: stagePts,
          dnfs,
          avgFinish: finishCount > 0 ? finishSum / finishCount : 0,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [drivers, selectedMfr, raceHistory]);

  const totalMfrPoints = mfrDrivers.reduce((s, d) => s + d.points, 0);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    const rank = selectedRank;

    if (typeof rank === "number" && rank === 1) {
      recs.push({
        type: "positive",
        title: "Manufacturer Championship Leader",
        body: `${selectedMfr} is leading the manufacturer standings. Continue leveraging your depth of drivers to maximize points at every race.`,
      });
    } else {
      const leader = sortedStandings[0];
      if (leader && leader.name !== selectedMfr) {
        const gap = leader.points - (stats.points || 0);
        recs.push({
          type: "opportunity",
          title: `${gap} Points Behind ${leader.name}`,
          body: `${selectedMfr} is P${rank} in the manufacturer standings. Gaining ${Math.ceil(gap / Math.max(raceHistory.length, 1))} more points per race could close this deficit. Every stage point counts.`,
        });
      }
    }

    if ((stats.dnfs || 0) > (leagueAvg.dnfs || 0) * 1.3) {
      recs.push({
        type: "warning",
        title: "High DNF Rate for Manufacturer",
        body: `${selectedMfr} cars have ${stats.dnfs} combined DNFs vs. a league average of ${(leagueAvg.dnfs || 0).toFixed(1)}. Reliability improvements across the manufacturer's teams could be a major points swing.`,
      });
    } else if ((stats.dnfs || 0) === 0 && raceHistory.length > 2) {
      recs.push({
        type: "positive",
        title: "Perfect Reliability Record",
        body: `${selectedMfr} has zero DNFs this season. This mechanical reliability is a major competitive advantage in a long championship fight.`,
      });
    }

    if ((stats.stagePoints || 0) < (leagueAvg.stagePoints || 0) * 0.8 && raceHistory.length > 1) {
      recs.push({
        type: "opportunity",
        title: "Stage Points Below Average",
        body: `${selectedMfr} is averaging ${stats.stagePoints} total stage points vs. a league average of ${(leagueAvg.stagePoints || 0).toFixed(0)}. A stronger mid-race strategy across teams could unlock significant extra points.`,
      });
    }

    if ((stats.penalties || 0) > (leagueAvg.penalties || 0) * 1.3) {
      recs.push({
        type: "warning",
        title: "Manufacturer Penalty Points",
        body: `${selectedMfr} drivers have collectively lost ${stats.penalties} points to penalties — above the league average of ${(leagueAvg.penalties || 0).toFixed(0)}. Cleaner racing across all teams would provide an immediate improvement.`,
      });
    }

    if ((stats.wins || 0) > (leagueAvg.wins || 0) * 1.5) {
      recs.push({
        type: "positive",
        title: "Dominant Win Rate",
        body: `${selectedMfr} is winning races at a well above-average rate. Capitalize on this speed advantage by also prioritizing stage points and avoiding incidents to maximize manufacturer points.`,
      });
    }

    if ((stats.fastestLaps || 0) > (leagueAvg.fastestLaps || 0) * 1.3) {
      recs.push({
        type: "positive",
        title: "Speed Advantage Evident",
        body: `${selectedMfr} leads in fastest lap bonuses with ${stats.fastestLaps}. This raw pace edge is a valuable asset — translate it into more race wins and stage point finishes.`,
      });
    }

    // Driver imbalance
    if (mfrDrivers.length >= 2) {
      const maxPts = Math.max(...mfrDrivers.map((d) => d.points));
      const minPts = Math.min(...mfrDrivers.map((d) => d.points));
      if (maxPts > 0 && minPts / maxPts < 0.4) {
        const topDriver = mfrDrivers[0];
        const lowDriver = mfrDrivers[mfrDrivers.length - 1];
        recs.push({
          type: "info",
          title: "Uneven Driver Contribution",
          body: `${topDriver.name} is carrying a large share of ${selectedMfr}'s manufacturer points. Improving ${lowDriver.name}'s results would strengthen the manufacturer's standings defense.`,
        });
      }
    }

    if (recs.length === 0) {
      recs.push({
        type: "info",
        title: "More Data Needed",
        body: "Complete a few more races to unlock detailed manufacturer recommendations.",
      });
    }

    return recs;
  }, [selectedMfr, selectedRank, stats, leagueAvg, mfrDrivers, sortedStandings, raceHistory]);

  const maxRacePts = Math.max(...(stats.raceResults || []).map((r) => r.points), 1);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d1a",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "24px 16px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: 6,
              height: 52,
              background: mfrColor,
              borderRadius: 3,
            }}
          />
          <div>
            <div style={{ color: "#aaa", fontSize: 13, marginBottom: 2 }}>
              Manufacturer Analytics
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{selectedMfr}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <select
              value={selectedMfr}
              onChange={(e) => {
                setSelectedMfr(e.target.value);
                window.history.pushState(
                  {},
                  "",
                  `/manufacturer/${encodeURIComponent(e.target.value)}`
                );
              }}
              style={{
                background: "#1a1a2e",
                color: "#fff",
                border: `1px solid ${mfrColor}`,
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {allMfrs.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stat Boxes */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 28,
          }}
        >
          <StatBox label="RANK" value={`P${selectedRank}`} color={mfrColor} />
          <StatBox label="POINTS" value={stats.points || 0} color="#fff" />
          <StatBox label="WINS" value={stats.wins || 0} color="#fbbf24" />
          <StatBox label="TOP 5" value={stats.top5 || 0} color="#60a5fa" />
          <StatBox label="TOP 10" value={stats.top10 || 0} color="#818cf8" />
          <StatBox label="STAGE PTS" value={stats.stagePoints || 0} color="#34d399" />
          <StatBox
            label="AVG FINISH"
            value={stats.avgFinish > 0 ? stats.avgFinish.toFixed(1) : "—"}
            color="#f9a8d4"
          />
          <StatBox label="DNFs" value={stats.dnfs || 0} color="#f87171" />
          <StatBox label="DRIVERS" value={stats.driverCount || 0} color="#c4b5fd" />
        </div>

        {/* Two-column: vs League Avg + Standings */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* vs League Average */}
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
              vs. League Average
            </div>
            {[
              { label: "Points",       val: stats.points,      avg: leagueAvg.points,      fmt: (v) => Math.round(v) },
              { label: "Wins",         val: stats.wins,        avg: leagueAvg.wins,        fmt: (v) => v.toFixed(1) },
              { label: "Top 5s",       val: stats.top5,        avg: leagueAvg.top5,        fmt: (v) => v.toFixed(1) },
              { label: "Stage Points", val: stats.stagePoints, avg: leagueAvg.stagePoints, fmt: (v) => Math.round(v) },
              { label: "Avg Finish",   val: stats.avgFinish,   avg: leagueAvg.avgFinish,   fmt: (v) => v.toFixed(1), lowerIsBetter: true },
              { label: "DNFs",         val: stats.dnfs,        avg: leagueAvg.dnfs,        fmt: (v) => v.toFixed(1), lowerIsBetter: true },
              { label: "Penalties",    val: stats.penalties,   avg: leagueAvg.penalties,   fmt: (v) => v.toFixed(1), lowerIsBetter: true },
              { label: "Fastest Laps", val: stats.fastestLaps, avg: leagueAvg.fastestLaps, fmt: (v) => v.toFixed(1) },
            ].map(({ label, val, avg, fmt, lowerIsBetter }) => {
              const v = val || 0;
              const a = avg || 0;
              const better = lowerIsBetter ? v < a : v > a;
              const diff = v - a;
              const sign = diff >= 0 ? "+" : "";
              return (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "7px 0",
                    borderBottom: "1px solid #1e1e35",
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#aaa" }}>{label}</span>
                  <span style={{ color: "#fff", fontWeight: 600 }}>{fmt(v)}</span>
                  <span
                    style={{
                      color: better ? "#22c55e" : "#ef4444",
                      fontSize: 12,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {sign}{fmt(diff)} vs avg
                  </span>
                </div>
              );
            })}
          </div>

          {/* Manufacturer Standings */}
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
              Manufacturer Standings
            </div>
            {sortedStandings.map((mfr) => {
              const isSelected = mfr.name === selectedMfr;
              return (
                <div
                  key={mfr.name}
                  onClick={() => {
                    setSelectedMfr(mfr.name);
                    window.history.pushState(
                      {},
                      "",
                      `/manufacturer/${encodeURIComponent(mfr.name)}`
                    );
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    marginBottom: 6,
                    cursor: "pointer",
                    background: isSelected ? `${mfr.color}22` : "transparent",
                    border: isSelected
                      ? `1px solid ${mfr.color}55`
                      : "1px solid transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{ color: "#666", fontSize: 12, width: 20, textAlign: "right" }}
                  >
                    {mfr.rank}
                  </span>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: mfr.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? "#fff" : "#ccc",
                    }}
                  >
                    {mfr.name}
                  </span>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>
                    {mfr.points}
                  </span>
                  <span style={{ color: "#666", fontSize: 12, minWidth: 36 }}>
                    {mfr.wins}W
                  </span>
                  <span style={{ color: "#555", fontSize: 11 }}>
                    {mfr.driverCount}d
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Roster */}
        <div
          style={{
            background: "#111122",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #222",
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
            {selectedMfr} Drivers — Points Breakdown
          </div>
          {mfrDrivers.length === 0 ? (
            <div style={{ color: "#666", fontSize: 13 }}>No drivers found.</div>
          ) : (
            mfrDrivers.map((driver) => {
              const sharePct =
                totalMfrPoints > 0
                  ? ((driver.points / totalMfrPoints) * 100).toFixed(1)
                  : 0;
              return (
                <div
                  key={driver.id}
                  onClick={() =>
                    (window.location.href = `/driver/${driver.number}`)
                  }
                  style={{
                    background: "#0d0d1a",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 12,
                    border: `1px solid ${mfrColor}33`,
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          background: mfrColor,
                          color: "#000",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        #{driver.number}
                      </span>
                      <span style={{ fontWeight: 700 }}>{driver.name}</span>
                      <span style={{ color: "#666", fontSize: 12 }}>
                        {driver.team}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 13,
                        color: "#ccc",
                      }}
                    >
                      <span>
                        <strong style={{ color: "#fff" }}>{driver.points}</strong> pts
                      </span>
                      <span>
                        <strong style={{ color: "#fbbf24" }}>{driver.wins}</strong>W
                      </span>
                      <span>
                        <strong style={{ color: "#60a5fa" }}>{driver.top5}</strong> T5
                      </span>
                      <span>
                        <strong style={{ color: "#34d399" }}>{driver.stagePoints}</strong> SP
                      </span>
                      {driver.dnfs > 0 && (
                        <span>
                          <strong style={{ color: "#f87171" }}>{driver.dnfs}</strong> DNF
                        </span>
                      )}
                      {driver.avgFinish > 0 && (
                        <span>
                          Avg:{" "}
                          <strong style={{ color: "#f9a8d4" }}>
                            {driver.avgFinish.toFixed(1)}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        flex: 1,
                        background: "#222",
                        borderRadius: 4,
                        height: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${sharePct}%`,
                          background: mfrColor,
                          height: "100%",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span style={{ color: "#666", fontSize: 11, minWidth: 50 }}>
                      {sharePct}% of mfr
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cross-Manufacturer Driver Comparison */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginBottom: 24,
          }}
        >
          {/* Points by driver bar */}
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
              Driver Points Contribution
            </div>
            {mfrDrivers.map((driver) => (
              <BarRow
                key={driver.id}
                label={`#${driver.number} ${driver.name.split(" ").pop()}`}
                value={driver.points}
                max={Math.max(...mfrDrivers.map((d) => d.points), 1)}
                color={mfrColor}
              />
            ))}
          </div>

          {/* Race-by-race performance */}
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
              Race-by-Race Points
            </div>
            {(stats.raceResults || []).length === 0 ? (
              <div style={{ color: "#666", fontSize: 13 }}>No race data yet.</div>
            ) : (
              stats.raceResults.map((r) => (
                <BarRow
                  key={r.raceName}
                  label={r.raceName}
                  value={r.points}
                  max={maxRacePts}
                  color={mfrColor}
                />
              ))
            )}
          </div>
        </div>

        {/* Manufacturer Comparison Table */}
        <div
          style={{
            background: "#111122",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #222",
            marginBottom: 24,
            overflowX: "auto",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
            Manufacturer Comparison
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#666", borderBottom: "1px solid #222" }}>
                {["Manufacturer", "Pts", "Wins", "Top 5", "Top 10", "Stage Pts", "DNFs", "Penalties", "Avg Finish", "Drivers"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: h === "Manufacturer" ? "left" : "right",
                        padding: "6px 10px",
                        fontWeight: 600,
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {sortedStandings.map((mfr) => {
                const isSelected = mfr.name === selectedMfr;
                return (
                  <tr
                    key={mfr.name}
                    onClick={() => {
                      setSelectedMfr(mfr.name);
                      window.history.pushState(
                        {},
                        "",
                        `/manufacturer/${encodeURIComponent(mfr.name)}`
                      );
                    }}
                    style={{
                      background: isSelected ? `${mfr.color}18` : "transparent",
                      cursor: "pointer",
                      borderBottom: "1px solid #1a1a2e",
                      transition: "background 0.15s",
                    }}
                  >
                    <td style={{ padding: "9px 10px" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          fontWeight: isSelected ? 700 : 400,
                          color: isSelected ? mfr.color : "#ccc",
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: mfr.color,
                            flexShrink: 0,
                          }}
                        />
                        {mfr.name}
                      </span>
                    </td>
                    {[
                      mfr.points,
                      mfr.wins,
                      mfr.top5,
                      mfr.top10,
                      mfr.stagePoints,
                      mfr.dnfs,
                      mfr.penalties,
                      mfr.avgFinish > 0 ? mfr.avgFinish.toFixed(1) : "—",
                      mfr.driverCount,
                    ].map((v, i) => (
                      <td
                        key={i}
                        style={{
                          textAlign: "right",
                          padding: "9px 10px",
                          color: isSelected ? "#fff" : "#aaa",
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {v}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Recommendations */}
        <div
          style={{
            background: "#111122",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #222",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: mfrColor }}>
            Smart Recommendations
          </div>
          {recommendations.map((rec, i) => (
            <RecommendationCard key={i} {...rec} />
          ))}
        </div>
      </div>
    </div>
  );
}
