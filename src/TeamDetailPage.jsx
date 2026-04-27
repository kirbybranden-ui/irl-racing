import { useState, useMemo } from "react";

const TEAM_COLORS = {
  JAM: "#d4af37",
  MER: "#dc2626",
  MMS: "#9333ea",
  NLM: "#f97316",
  BOM: "#3b82f6",
  IND: "#6b7280",
};

const TEAM_NAMES = {
  JAM: "JA Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  IND: "Independent",
};

const POINTS_MAP = [
  40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18,
  17,
];

function getWinstonPoints(pos) {
  if (pos >= 1 && pos <= 20) return POINTS_MAP[pos - 1];
  return 0;
}

function computeTeamStats(teamAbbr, drivers, raceHistory) {
  const teamDriverIds = new Set(
    drivers.filter((d) => d.team === teamAbbr).map((d) => d.id)
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
    races = 0,
    totalFinishPos = 0,
    finishCount = 0;

  const raceResults = []; // { raceName, points, avgPos }

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

    teamDriverIds.forEach((driverId) => {
      const pos = positions[driverId];
      if (pos !== undefined) {
        const rp = getWinstonPoints(pos);
        const s1 = stage1[driverId] || 0;
        const s2 = stage2[driverId] || 0;
        const s3 = stage3[driverId] || 0;
        const stagePts = s1 + s2 + s3;
        const fl = fastestLapMap[driverId] ? 1 : 0;
        const offense = offenseMap[driverId] || 0;
        let penalty = 0;
        if (offense === 1) penalty = 5;
        else if (offense === 2) penalty = 10;
        else if (offense === 3) penalty = 15;
        else if (offense >= 4) penalty = 25;

        const total = rp + stagePts + fl - penalty;
        points += total;
        racePts += total;
        stagePoints += stagePts;
        penalties += penalty;
        if (fl) fastestLaps++;

        if (dnfMap[driverId]) {
          dnfs++;
        } else if (pos >= 1) {
          totalFinishPos += pos;
          finishCount++;
          raceFinishSum += pos;
          raceFinishCount++;
          if (pos === 1) wins++;
          if (pos <= 3) top3++;
          if (pos <= 5) top5++;
          if (pos <= 10) top10++;
        }
        races++;
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
    races,
    avgFinish: finishCount > 0 ? totalFinishPos / finishCount : 0,
    raceResults,
    driverCount: teamDriverIds.size,
  };
}

function StatBox({ label, value, sub, color }) {
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
      {sub && <div style={{ color: "#666", fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

function RecommendationCard({ type, title, body }) {
  const styles = {
    warning: { border: "#ef4444", icon: "⚠️", bg: "rgba(239,68,68,0.08)" },
    opportunity: { border: "#3b82f6", icon: "💡", bg: "rgba(59,130,246,0.08)" },
    positive: { border: "#22c55e", icon: "✅", bg: "rgba(34,197,94,0.08)" },
    info: { border: "#a855f7", icon: "ℹ️", bg: "rgba(168,85,247,0.08)" },
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
          {value}
          {suffix}
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
            background: color || "#d4af37",
            height: "100%",
            borderRadius: 4,
            transition: "width 0.4s",
          }}
        />
      </div>
    </div>
  );
}

export default function TeamDetailPage({ drivers = [], teamStandings = [], raceHistory = [], initialTeam }) {
  const allTeams = useMemo(
    () => [...new Set(drivers.map((d) => d.team).filter(Boolean))].sort(),
    [drivers]
  );

  const [selectedTeam, setSelectedTeam] = useState(
    initialTeam && allTeams.includes(initialTeam)
      ? initialTeam
      : allTeams[0] || "JAM"
  );

  const teamColor = TEAM_COLORS[selectedTeam] || "#d4af37";

  // Compute stats for ALL teams
  const allTeamStats = useMemo(() => {
    const map = {};
    allTeams.forEach((t) => {
      map[t] = computeTeamStats(t, drivers, raceHistory);
    });
    return map;
  }, [allTeams, drivers, raceHistory]);

  const stats = allTeamStats[selectedTeam] || {};

  // League averages across teams
  const leagueAvg = useMemo(() => {
    const vals = Object.values(allTeamStats);
    if (!vals.length) return {};
    const n = vals.length;
    return {
      points: vals.reduce((s, v) => s + v.points, 0) / n,
      wins: vals.reduce((s, v) => s + v.wins, 0) / n,
      top5: vals.reduce((s, v) => s + v.top5, 0) / n,
      top10: vals.reduce((s, v) => s + v.top10, 0) / n,
      stagePoints: vals.reduce((s, v) => s + v.stagePoints, 0) / n,
      dnfs: vals.reduce((s, v) => s + v.dnfs, 0) / n,
      penalties: vals.reduce((s, v) => s + v.penalties, 0) / n,
      fastestLaps: vals.reduce((s, v) => s + v.fastestLaps, 0) / n,
      avgFinish: vals.reduce((s, v) => s + v.avgFinish, 0) / n,
    };
  }, [allTeamStats]);

  // Sorted standings
  const sortedStandings = useMemo(() => {
    return [...allTeams]
      .map((t) => ({
        abbr: t,
        name: TEAM_NAMES[t] || t,
        color: TEAM_COLORS[t] || "#888",
        ...allTeamStats[t],
      }))
      .sort((a, b) => b.points - a.points)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }, [allTeams, allTeamStats]);

  const selectedRank =
    sortedStandings.find((t) => t.abbr === selectedTeam)?.rank || "-";

  // Team drivers with individual stats
  const teamDrivers = useMemo(() => {
    return drivers
      .filter((d) => d.team === selectedTeam)
      .map((driver) => {
        let pts = 0,
          wins = 0,
          top5 = 0,
          stagePts = 0,
          dnfs = 0,
          finishSum = 0,
          finishCount = 0;
        raceHistory.forEach((race) => {
          const pos = (race.positions || {})[driver.id];
          if (pos === undefined) return;
          const rp = getWinstonPoints(pos);
          const s1 = (race.stage1 || {})[driver.id] || 0;
          const s2 = (race.stage2 || {})[driver.id] || 0;
          const s3 = (race.stage3 || {})[driver.id] || 0;
          const sp = s1 + s2 + s3;
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
  }, [drivers, selectedTeam, raceHistory]);

  const totalTeamPoints = teamDrivers.reduce((s, d) => s + d.points, 0);

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = [];
    const rank = selectedRank;
    const teamName = TEAM_NAMES[selectedTeam] || selectedTeam;

    if (typeof rank === "number" && rank === 1) {
      recs.push({
        type: "positive",
        title: "Championship Leader",
        body: `${teamName} is currently leading the championship. Consistency is key — keep minimizing DNFs and collecting stage points.`,
      });
    } else if (typeof rank === "number" && rank <= 3) {
      const leader = sortedStandings[0];
      const gap = leader.points - stats.points;
      recs.push({
        type: "opportunity",
        title: `Only ${gap} Points from the Lead`,
        body: `${teamName} is P${rank} in the standings. Targeting ${Math.ceil(gap / (raceHistory.length || 1))} extra points per remaining race could close the gap.`,
      });
    } else if (typeof rank === "number" && rank > 3) {
      const p3 = sortedStandings[2];
      if (p3) {
        const gap = p3.points - stats.points;
        recs.push({
          type: "warning",
          title: `${gap} Points Back of Top 3`,
          body: `${teamName} needs to close ${gap} points to reach P3. Focus on maximizing stage points (currently ${stats.stagePoints} vs. league avg ${leagueAvg.stagePoints?.toFixed(0)}).`,
        });
      }
    }

    if (stats.dnfs > leagueAvg.dnfs * 1.3) {
      recs.push({
        type: "warning",
        title: "DNF Rate Above Average",
        body: `${teamName} has ${stats.dnfs} DNFs vs. a league average of ${leagueAvg.dnfs?.toFixed(1)}. Each DNF costs roughly 30–40 points on average. Improving mechanical reliability could be a game-changer.`,
      });
    } else if (stats.dnfs === 0 && raceHistory.length > 2) {
      recs.push({
        type: "positive",
        title: "Zero DNFs — Excellent Reliability",
        body: `${teamName} has completed every race this season. This reliability advantage translates directly to consistent points accumulation.`,
      });
    }

    if (stats.penalties > leagueAvg.penalties * 1.3) {
      recs.push({
        type: "warning",
        title: "Penalty Points Costing You",
        body: `${teamName} has lost ${stats.penalties} points to penalties — above the league average of ${leagueAvg.penalties?.toFixed(0)}. Reducing on-track incidents would provide an immediate points boost.`,
      });
    }

    if (stats.stagePoints < leagueAvg.stagePoints * 0.8 && raceHistory.length > 1) {
      recs.push({
        type: "opportunity",
        title: "Stage Points Opportunity",
        body: `${teamName} is collecting ${stats.stagePoints} stage points vs. a league average of ${leagueAvg.stagePoints?.toFixed(0)}. Running in the top 10 during stage ends could add significant points each week.`,
      });
    }

    if (stats.fastestLaps < leagueAvg.fastestLaps * 0.5 && raceHistory.length > 2) {
      recs.push({
        type: "opportunity",
        title: "Fastest Lap Bonus Under-Utilized",
        body: `${teamName} has earned only ${stats.fastestLaps} fastest lap bonus points. Each fastest lap is a free +1 — pitting for fresh tires late in races when in a points position can grab this.`,
      });
    }

    // Driver imbalance check
    if (teamDrivers.length >= 2) {
      const maxPts = Math.max(...teamDrivers.map((d) => d.points));
      const minPts = Math.min(...teamDrivers.map((d) => d.points));
      const topDriver = teamDrivers[0];
      const lastDriver = teamDrivers[teamDrivers.length - 1];
      if (maxPts > 0 && minPts / maxPts < 0.5) {
        recs.push({
          type: "info",
          title: "Driver Points Imbalance",
          body: `${topDriver.name} is carrying a significant portion of the team's points. Elevating ${lastDriver.name}'s performance could double the team's scoring opportunities.`,
        });
      }
    }

    if (stats.wins > leagueAvg.wins * 1.5) {
      recs.push({
        type: "positive",
        title: "Strong Win Rate",
        body: `${teamName} is winning at a pace well above average. Keep leveraging pit strategy and clean air to convert top-5 finishes into wins.`,
      });
    }

    if (recs.length === 0) {
      recs.push({
        type: "info",
        title: "Early Season",
        body: `More race data will unlock detailed recommendations. Check back after a few more races.`,
      });
    }

    return recs;
  }, [selectedTeam, selectedRank, stats, leagueAvg, teamDrivers, sortedStandings, raceHistory]);

  const maxRacePts = Math.max(...(stats.raceResults || []).map((r) => r.points), 1);
  const maxDriverPts = Math.max(...teamDrivers.map((d) => d.points), 1);

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
              background: teamColor,
              borderRadius: 3,
            }}
          />
          <div>
            <div style={{ color: "#aaa", fontSize: 13, marginBottom: 2 }}>
              Team Analytics
            </div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>
              {TEAM_NAMES[selectedTeam] || selectedTeam}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <select
              value={selectedTeam}
              onChange={(e) => {
                setSelectedTeam(e.target.value);
                window.history.pushState({}, "", `/team/${e.target.value}`);
              }}
              style={{
                background: "#1a1a2e",
                color: "#fff",
                border: `1px solid ${teamColor}`,
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 14,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {allTeams.map((t) => (
                <option key={t} value={t}>
                  {TEAM_NAMES[t] || t} ({t})
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
          <StatBox label="RANK" value={`P${selectedRank}`} color={teamColor} />
          <StatBox label="POINTS" value={stats.points || 0} color="#fff" />
          <StatBox label="WINS" value={stats.wins || 0} color="#fbbf24" />
          <StatBox label="TOP 5" value={stats.top5 || 0} color="#60a5fa" />
          <StatBox label="TOP 10" value={stats.top10 || 0} color="#818cf8" />
          <StatBox
            label="STAGE PTS"
            value={stats.stagePoints || 0}
            color="#34d399"
          />
          <StatBox
            label="AVG FINISH"
            value={stats.avgFinish > 0 ? stats.avgFinish.toFixed(1) : "—"}
            color="#f9a8d4"
          />
          <StatBox label="DNFs" value={stats.dnfs || 0} color="#f87171" />
        </div>

        {/* Two-column layout */}
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
            <div
              style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}
            >
              vs. League Average
            </div>
            {[
              {
                label: "Points",
                val: stats.points,
                avg: leagueAvg.points,
                fmt: (v) => Math.round(v),
              },
              {
                label: "Wins",
                val: stats.wins,
                avg: leagueAvg.wins,
                fmt: (v) => v.toFixed(1),
              },
              {
                label: "Top 5s",
                val: stats.top5,
                avg: leagueAvg.top5,
                fmt: (v) => v.toFixed(1),
              },
              {
                label: "Stage Points",
                val: stats.stagePoints,
                avg: leagueAvg.stagePoints,
                fmt: (v) => Math.round(v),
              },
              {
                label: "Avg Finish",
                val: stats.avgFinish,
                avg: leagueAvg.avgFinish,
                fmt: (v) => v.toFixed(1),
                lowerIsBetter: true,
              },
              {
                label: "DNFs",
                val: stats.dnfs,
                avg: leagueAvg.dnfs,
                fmt: (v) => v.toFixed(1),
                lowerIsBetter: true,
              },
              {
                label: "Penalties",
                val: stats.penalties,
                avg: leagueAvg.penalties,
                fmt: (v) => v.toFixed(1),
                lowerIsBetter: true,
              },
            ].map(({ label, val, avg, fmt, lowerIsBetter }) => {
              const better = lowerIsBetter ? val < avg : val > avg;
              const diff = val - (avg || 0);
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
                  <span style={{ color: "#fff", fontWeight: 600 }}>
                    {fmt(val || 0)}
                  </span>
                  <span
                    style={{
                      color: better ? "#22c55e" : "#ef4444",
                      fontSize: 12,
                      minWidth: 60,
                      textAlign: "right",
                    }}
                  >
                    {sign}
                    {fmt(diff)} vs avg
                  </span>
                </div>
              );
            })}
          </div>

          {/* Championship Standings */}
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}>
              Championship Standings
            </div>
            {sortedStandings.map((team) => {
              const isSelected = team.abbr === selectedTeam;
              return (
                <div
                  key={team.abbr}
                  onClick={() => {
                    setSelectedTeam(team.abbr);
                    window.history.pushState({}, "", `/team/${team.abbr}`);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    marginBottom: 4,
                    cursor: "pointer",
                    background: isSelected
                      ? `${team.color}22`
                      : "transparent",
                    border: isSelected
                      ? `1px solid ${team.color}55`
                      : "1px solid transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <span
                    style={{
                      color: "#666",
                      fontSize: 12,
                      width: 20,
                      textAlign: "right",
                    }}
                  >
                    {team.rank}
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: team.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 400,
                      color: isSelected ? "#fff" : "#ccc",
                    }}
                  >
                    {team.name}
                  </span>
                  <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                    {team.points}
                  </span>
                  <span style={{ color: "#666", fontSize: 11, minWidth: 32 }}>
                    {team.wins}W
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
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}>
            Driver Roster — Points Breakdown
          </div>
          {teamDrivers.length === 0 ? (
            <div style={{ color: "#666", fontSize: 13 }}>No drivers found for this team.</div>
          ) : (
            teamDrivers.map((driver) => {
              const sharePct =
                totalTeamPoints > 0
                  ? ((driver.points / totalTeamPoints) * 100).toFixed(1)
                  : 0;
              return (
                <div
                  key={driver.id}
                  style={{
                    background: "#0d0d1a",
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 12,
                    border: `1px solid ${teamColor}33`,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    (window.location.href = `/driver/${driver.number}`)
                  }
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
                          background: teamColor,
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
                        {driver.manufacturer}
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
                  {/* Points share bar */}
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
                          background: teamColor,
                          height: "100%",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span style={{ color: "#666", fontSize: 11, minWidth: 40 }}>
                      {sharePct}% of team
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Head-to-Head Teammate Comparison */}
        {teamDrivers.length >= 2 && (
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}>
              Teammate Head-to-Head
            </div>
            {[
              { key: "points", label: "Championship Points" },
              { key: "wins", label: "Race Wins" },
              { key: "top5", label: "Top 5 Finishes" },
              { key: "stagePoints", label: "Stage Points" },
              { key: "dnfs", label: "DNFs", lowerIsBetter: true },
            ].map(({ key, label, lowerIsBetter }) => {
              const total = teamDrivers.reduce((s, d) => s + (d[key] || 0), 0);
              return (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#888",
                      marginBottom: 4,
                    }}
                  >
                    <span>{label}</span>
                  </div>
                  {teamDrivers.slice(0, 4).map((driver, idx) => (
                    <BarRow
                      key={driver.id}
                      label={`#${driver.number} ${driver.name.split(" ")[1] || driver.name}`}
                      value={driver[key] || 0}
                      max={Math.max(...teamDrivers.map((d) => d[key] || 0), 1)}
                      color={
                        lowerIsBetter && (driver[key] || 0) > 0
                          ? "#f87171"
                          : teamColor
                      }
                    />
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Race-by-Race Performance */}
        {stats.raceResults && stats.raceResults.length > 0 && (
          <div
            style={{
              background: "#111122",
              borderRadius: 12,
              padding: 20,
              border: "1px solid #222",
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}>
              Race-by-Race Points
            </div>
            {stats.raceResults.map((r) => (
              <BarRow
                key={r.raceName}
                label={r.raceName}
                value={r.points}
                max={maxRacePts}
                color={teamColor}
              />
            ))}
          </div>
        )}

        {/* Recommendations */}
        <div
          style={{
            background: "#111122",
            borderRadius: 12,
            padding: 20,
            border: "1px solid #222",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 15, color: teamColor }}>
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
