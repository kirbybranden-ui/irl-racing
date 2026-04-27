import React, { useState } from "react";

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 24,
};

const cardStyle = {
  background: "#151a22",
  border: "1px solid #2d3643",
  borderRadius: 22,
  padding: 20,
  marginBottom: 18,
  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
};

const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #313947",
  background: "#10141b",
  fontSize: 13,
};

const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #252c38",
  verticalAlign: "top",
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getTeamFullName(team) {
  const names = {
    JAM: "JA Motorsports",
    MER: "ME Racing",
    MMS: "Mayhem Motorsports",
    NLM: "Nine Line Motorsports",
    BOM: "Blue Oval Motorsports",
    Independent: "Independent",
  };

  return names[team] || team || "Unknown Team";
}

function getTrend(currentRank, previousRank) {
  if (!currentRank || !previousRank) return { label: "NEW", color: "#94a3b8" };
  if (currentRank < previousRank) return { label: `▲ +${previousRank - currentRank}`, color: "#4ade80" };
  if (currentRank > previousRank) return { label: `▼ -${currentRank - previousRank}`, color: "#f87171" };
  return { label: "—", color: "#d4af37" };
}

export default function TeamDetailPage({
  drivers = [],
  teamDrivers = [],
  raceHistory = [],
  initialTeam = "",
  selectedTeam = "",
  seasonName = "",
}) {
  const teamKey = normalize(selectedTeam || initialTeam);

  const roster = (teamDrivers.length
    ? teamDrivers
    : drivers.filter((d) => normalize(d.team) === teamKey)
  )
    .filter((d) => !normalize(d.name).startsWith("inactive-"))
    .sort(
      (a, b) =>
        (b.points || 0) - (a.points || 0) ||
        (b.wins || 0) - (a.wins || 0) ||
        Number(a.number || 0) - Number(b.number || 0)
    );

  const latestRace = raceHistory?.[raceHistory.length - 1] || null;
  const latestResults = latestRace?.results || [];

  const points = roster.reduce((s, d) => s + (Number(d.points) || 0), 0);
  const wins = roster.reduce((s, d) => s + (Number(d.wins) || 0), 0);
  const top3 = roster.reduce((s, d) => s + (Number(d.top3) || 0), 0);
  const top5 = roster.reduce((s, d) => s + (Number(d.top5) || 0), 0);
  const dnfs = roster.reduce((s, d) => s + (Number(d.dnfs) || 0), 0);
  const fastestLaps = roster.reduce((s, d) => s + (Number(d.fastestLaps) || 0), 0);
  const penalties = roster.reduce((s, d) => s + (Number(d.totalPenalties) || 0), 0);

  const teamRaceResults = raceHistory.flatMap((race) =>
    (race.results || [])
      .filter((r) => roster.some((d) => d.id === r.driverId))
      .map((r) => ({ ...r, raceName: race.raceName }))
  );

  const starts = teamRaceResults.length;
  const finishResults = teamRaceResults.filter((r) => Number(r.finishPos));

  const bestFinish = finishResults.length
    ? Math.min(...finishResults.map((r) => Number(r.finishPos)))
    : "—";

  const avgFinish = finishResults.length
    ? (
        finishResults.reduce((s, r) => s + Number(r.finishPos || 0), 0) /
        finishResults.length
      ).toFixed(1)
    : "—";

  const lastRacePoints = latestResults
    .filter((r) => roster.some((d) => d.id === r.driverId))
    .reduce((s, r) => s + (Number(r.totalRacePoints) || 0), 0);

  const teamGroups = {};

  drivers
    .filter((d) => !normalize(d.name).startsWith("inactive-"))
    .forEach((d) => {
      if (!teamGroups[d.team]) {
        teamGroups[d.team] = {
          team: d.team,
          current: 0,
          previous: 0,
        };
      }

      const lastResult = latestResults.find((r) => r.driverId === d.id);
      const lastPts = Number(lastResult?.totalRacePoints) || 0;

      teamGroups[d.team].current += Number(d.points) || 0;
      teamGroups[d.team].previous += (Number(d.points) || 0) - lastPts;
    });

  const currentRanks = Object.values(teamGroups)
    .sort((a, b) => b.current - a.current)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  const previousRanks = Object.values(teamGroups)
    .sort((a, b) => b.previous - a.previous)
    .map((t, i) => ({ ...t, rank: i + 1 }));

  const currentRank = currentRanks.find((t) => normalize(t.team) === teamKey)?.rank || null;
  const previousRank = previousRanks.find((t) => normalize(t.team) === teamKey)?.rank || null;
  const trend = getTrend(currentRank, previousRank);

  const topDriver = roster[0] || null;

  const [compareA, setCompareA] = useState(roster[0]?.id || "");
  const [compareB, setCompareB] = useState(roster[1]?.id || "");

  function getDriverRaceStats(driverId) {
    const results = raceHistory.flatMap((race) =>
      (race.results || [])
        .filter((r) => r.driverId === driverId)
        .map((r) => ({ ...r, raceName: race.raceName }))
    );

    const finishes = results.filter((r) => Number(r.finishPos));
    const latestRaceResult = latestResults.find((r) => r.driverId === driverId);

    return {
      starts: results.length,
      bestFinish: finishes.length
        ? Math.min(...finishes.map((r) => Number(r.finishPos)))
        : "—",
      avgFinish: finishes.length
        ? (
            finishes.reduce((s, r) => s + Number(r.finishPos || 0), 0) /
            finishes.length
          ).toFixed(1)
        : "—",
      lastRacePoints: latestRaceResult?.totalRacePoints || 0,
      lastRaceFinish: latestRaceResult?.finishPos
        ? `P${latestRaceResult.finishPos}`
        : "—",
    };
  }

  const driverA = roster.find((d) => d.id === Number(compareA) || d.id === compareA);
  const driverB = roster.find((d) => d.id === Number(compareB) || d.id === compareB);

  const statsA = driverA ? getDriverRaceStats(driverA.id) : null;
  const statsB = driverB ? getDriverRaceStats(driverB.id) : null;

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <button
          onClick={() => (window.location.href = "/standings")}
          style={{
            background: "#2a3140",
            color: "white",
            border: "1px solid #3d4859",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          ← Back to Standings
        </button>

        <div style={{ ...cardStyle, borderColor: "#d4af37" }}>
          <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 6 }}>
            {seasonName}
          </div>

          <div style={{ fontSize: 38, fontWeight: 900 }}>
            {getTeamFullName(selectedTeam || initialTeam)}
          </div>

          <div style={{ fontSize: 15, opacity: 0.72, marginTop: 6 }}>
            Live Team Analytics • Race Data • Trend Tracking • Driver Comparison
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {[
            ["RANK", currentRank ? `P${currentRank}` : "—"],
            ["TREND", trend.label],
            ["POINTS", points],
            ["LAST RACE PTS", lastRacePoints],
            ["WINS", wins],
            ["TOP 3", top3],
            ["TOP 5", top5],
            ["BEST FINISH", bestFinish === "—" ? "—" : `P${bestFinish}`],
            ["AVG FINISH", avgFinish],
            ["STARTS", starts],
            ["DNFs", dnfs],
            ["FASTEST LAPS", fastestLaps],
            ["PENALTIES", penalties ? `-${penalties}` : 0],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: label === "TREND" ? trend.color : "white",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Team Snapshot
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>TOP DRIVER</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#d4af37" }}>
                {topDriver ? `#${topDriver.number} ${topDriver.name}` : "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>LATEST RACE</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                {latestRace?.raceName || "No race entered yet"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>LIVE DATA STATUS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>
                Feeding From Driver + Race History
              </div>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Driver Comparison Tool
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
                DRIVER A
              </div>
              <select
                value={compareA}
                onChange={(e) => setCompareA(e.target.value)}
                style={inputStyle}
              >
                {roster.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.number} {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
                DRIVER B
              </div>
              <select
                value={compareB}
                onChange={(e) => setCompareB(e.target.value)}
                style={inputStyle}
              >
                {roster.map((d) => (
                  <option key={d.id} value={d.id}>
                    #{d.number} {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {driverA && driverB && statsA && statsB ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Stat</th>
                    <th style={thStyle}>
                      #{driverA.number} {driverA.name}
                    </th>
                    <th style={thStyle}>
                      #{driverB.number} {driverB.name}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {[
                    ["Points", driverA.points || 0, driverB.points || 0],
                    ["Wins", driverA.wins || 0, driverB.wins || 0],
                    ["Top 3", driverA.top3 || 0, driverB.top3 || 0],
                    ["Top 5", driverA.top5 || 0, driverB.top5 || 0],
                    ["DNFs", driverA.dnfs || 0, driverB.dnfs || 0],
                    ["Fastest Laps", driverA.fastestLaps || 0, driverB.fastestLaps || 0],
                    ["Penalties", driverA.totalPenalties || 0, driverB.totalPenalties || 0],
                    ["Starts", statsA.starts, statsB.starts],
                    [
                      "Best Finish",
                      statsA.bestFinish === "—" ? "—" : `P${statsA.bestFinish}`,
                      statsB.bestFinish === "—" ? "—" : `P${statsB.bestFinish}`,
                    ],
                    ["Average Finish", statsA.avgFinish, statsB.avgFinish],
                    ["Last Race Finish", statsA.lastRaceFinish, statsB.lastRaceFinish],
                    ["Last Race Points", statsA.lastRacePoints, statsB.lastRacePoints],
                  ].map(([label, a, b]) => (
                    <tr key={label}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{label}</td>
                      <td style={{ ...tdStyle, color: "#d4af37", fontWeight: 800 }}>
                        {a}
                      </td>
                      <td style={{ ...tdStyle, color: "#d4af37", fontWeight: 800 }}>
                        {b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ opacity: 0.7 }}>
              Select two drivers to compare.
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Latest Race Results
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Race</th>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Finish</th>
                  <th style={thStyle}>Race Pts</th>
                  <th style={thStyle}>Stage 1</th>
                  <th style={thStyle}>Stage 2</th>
                  <th style={thStyle}>Stage 3</th>
                  <th style={thStyle}>DNF</th>
                </tr>
              </thead>

              <tbody>
                {latestResults
                  .filter((r) => roster.some((d) => d.id === r.driverId))
                  .map((r) => (
                    <tr key={r.driverId}>
                      <td style={tdStyle}>{latestRace?.raceName || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{r.number}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>
                        {r.name}
                      </td>
                      <td style={tdStyle}>{r.finishPos ? `P${r.finishPos}` : "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        {r.totalRacePoints || 0}
                      </td>
                      <td style={tdStyle}>{r.stage1Points || 0}</td>
                      <td style={tdStyle}>{r.stage2Points || 0}</td>
                      <td style={tdStyle}>{r.stage3Points || 0}</td>
                      <td style={tdStyle}>{r.dnf ? "Yes" : "No"}</td>
                    </tr>
                  ))}

                {!latestRace && (
                  <tr>
                    <td style={tdStyle} colSpan={9}>
                      No race data entered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Drivers
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Manufacturer</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 3</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>DNFs</th>
                  <th style={thStyle}>FL</th>
                  <th style={thStyle}>Penalties</th>
                </tr>
              </thead>

              <tbody>
                {roster.map((d) => (
                  <tr
                    key={d.id || d.number}
                    style={{ cursor: "pointer" }}
                    onClick={() => (window.location.href = `/driver/${d.number}`)}
                  >
                    <td style={{ ...tdStyle, fontWeight: 900 }}>#{d.number}</td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>
                      {d.name}
                    </td>
                    <td style={tdStyle}>{d.manufacturer || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{d.points || 0}</td>
                    <td style={tdStyle}>{d.wins || 0}</td>
                    <td style={tdStyle}>{d.top3 || 0}</td>
                    <td style={tdStyle}>{d.top5 || 0}</td>
                    <td style={tdStyle}>{d.dnfs || 0}</td>
                    <td style={tdStyle}>{d.fastestLaps || 0}</td>
                    <td
                      style={{
                        ...tdStyle,
                        color: (d.totalPenalties || 0) > 0 ? "#f87171" : "white",
                      }}
                    >
                      {d.totalPenalties ? `-${d.totalPenalties}` : "0"}
                    </td>
                  </tr>
                ))}

                {roster.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      No drivers found for this team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
