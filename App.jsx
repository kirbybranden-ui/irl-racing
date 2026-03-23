import { useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png";

const defaultDrivers = [
  { id: 1, name: "AMP-GHOSTRIDER", number: "42", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 2, name: "ROOKIEVET99", number: "99", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 3, name: "BOWHUNTER6758", number: "18", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 4, name: "HOLDEN2DX4EV3R", number: "81", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 5, name: "SILVEREYEAC", number: "19", team: "SILVER RACING GROUP", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 6, name: "KEVDINHO7", number: "24", team: "KEVIN HO MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
];

const races = [
  { id: 1, name: "Daytona", stageCount: 3 },
  { id: 2, name: "Las Vegas", stageCount: 3 },
  { id: 3, name: "Richmond", stageCount: 3 },
  { id: 4, name: "Charlotte", stageCount: 4 },
  { id: 5, name: "Talladega", stageCount: 3 },
  { id: 6, name: "Texas", stageCount: 3 },
  { id: 7, name: "Michigan", stageCount: 3 },
  { id: 8, name: "Phoenix", stageCount: 3 },
  { id: 9, name: "Nashville", stageCount: 3 },
  { id: 10, name: "Pocono", stageCount: 3 },
  { id: 11, name: "Indianapolis Oval", stageCount: 3 },
  { id: 12, name: "Dover", stageCount: 3 },
  { id: 13, name: "Iowa", stageCount: 3 },
  { id: 14, name: "Daytona 2", stageCount: 3 },
  { id: 15, name: "Homestead", stageCount: 3 },
];

const penaltyOptions = [
  { label: "No Penalty", points: 0, reason: "" },
  { label: "Jump Start", points: 5, reason: "Jump Start" },
  { label: "Passing Under Caution", points: 10, reason: "Passing Under Caution" },
  { label: "Avoidable Contact", points: 15, reason: "Avoidable Contact" },
  { label: "Brake-Checking", points: 15, reason: "Brake-Checking" },
  { label: "Blocking Causing Wreck", points: 15, reason: "Blocking Causing Wreck" },
  { label: "Fall-Back Restart Violation", points: 10, reason: "Fall-Back Restart Violation" },
  { label: "Ignoring Black Flag", points: 25, reason: "Ignoring Black Flag" },
  { label: "Intentional Wrecking", points: 25, reason: "Intentional Wrecking" },
  { label: "Other Minor Penalty", points: 5, reason: "Other Minor Penalty" },
  { label: "Other Major Penalty", points: 15, reason: "Other Major Penalty" },
];

const pointsTable = [
  40, 35, 33, 31, 29,
  27, 25, 23, 21, 20,
  19, 18, 17, 16, 15,
  14, 13, 12, 11, 10,
];

const stagePointsTable = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

function LeaderboardOverlay({ drivers }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points);

  return (
    <div
      style={{
        background: "transparent",
        color: "white",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 520,
          background: "rgba(0, 0, 0, 0.78)",
          border: "2px solid #d4af37",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #111 0%, #222 100%)",
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.12)",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: 0.5,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img src={logo} alt="League Logo" style={{ height: 38, width: "auto" }} />
          <span>IRL Racing League Standings</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 18px", fontWeight: 700 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 70px 1fr 86px", gap: 12 }}>
            <span>POS</span>
            <span>NO.</span>
            <span>DRIVER</span>
            <span>PTS</span>
          </div>
        </div>

        {sorted.map((driver, index) => (
          <div
            key={driver.id}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 70px 1fr 86px",
              gap: 12,
              padding: "12px 18px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: index % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              fontSize: 18,
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 700 }}>{index + 1}</span>
            <span>#{driver.number}</span>
            <span style={{ fontWeight: 700 }}>{driver.name}</span>
            <span style={{ fontWeight: 700 }}>{driver.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamOverlay({ teams }) {
  return (
    <div
      style={{
        background: "transparent",
        color: "white",
        minHeight: "100vh",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: 620,
          background: "rgba(0, 0, 0, 0.78)",
          border: "2px solid #d4af37",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #111 0%, #222 100%)",
            padding: "14px 18px",
            fontWeight: 700,
            fontSize: 24,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img src={logo} alt="League Logo" style={{ height: 38, width: "auto" }} />
          <span>IRL Team Standings</span>
        </div>

        <div style={{ background: "rgba(255,255,255,0.06)", padding: "10px 18px", fontWeight: 700 }}>
          <div style={{ display: "grid", gridTemplateColumns: "56px 1fr 90px 72px", gap: 12 }}>
            <span>POS</span>
            <span>TEAM</span>
            <span>PTS</span>
            <span>WINS</span>
          </div>
        </div>

        {teams.map((team, index) => (
          <div
            key={team.team}
            style={{
              display: "grid",
              gridTemplateColumns: "56px 1fr 90px 72px",
              gap: 12,
              padding: "12px 18px",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: index % 2 === 0 ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              fontSize: 18,
            }}
          >
            <span style={{ fontWeight: 700 }}>{index + 1}</span>
            <span style={{ fontWeight: 700 }}>{team.team}</span>
            <span style={{ fontWeight: 700 }}>{team.points}</span>
            <span>{team.wins}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicStandings({ drivers, teams }) {
  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points);

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#111",
        color: "white",
        minHeight: "100vh",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <img src={logo} alt="League Logo" style={{ height: 64, width: "auto" }} />
        <h1 style={{ margin: 0 }}>IRL Racing League Standings</h1>
      </div>

      <h2 style={{ marginTop: 20 }}>Driver Standings</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1a1a" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Pos</th>
              <th style={tableHeaderStyle}>#</th>
              <th style={tableHeaderStyle}>Name</th>
              <th style={tableHeaderStyle}>Team</th>
              <th style={tableHeaderStyle}>Points</th>
              <th style={tableHeaderStyle}>Wins</th>
              <th style={tableHeaderStyle}>Top 5</th>
              <th style={tableHeaderStyle}>Top 10</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((d, i) => (
              <tr key={d.id}>
                <td style={tableCellStyle}>{i + 1}</td>
                <td style={tableCellStyle}>#{d.number}</td>
                <td style={tableCellStyle}>{d.name}</td>
                <td style={tableCellStyle}>{d.team}</td>
                <td style={tableCellStyle}>{d.points}</td>
                <td style={tableCellStyle}>{d.wins}</td>
                <td style={tableCellStyle}>{d.top5}</td>
                <td style={tableCellStyle}>{d.top10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: 30 }}>Team Standings</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#1a1a1a" }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Pos</th>
              <th style={tableHeaderStyle}>Team</th>
              <th style={tableHeaderStyle}>Points</th>
              <th style={tableHeaderStyle}>Wins</th>
              <th style={tableHeaderStyle}>Top 5</th>
              <th style={tableHeaderStyle}>Top 10</th>
              <th style={tableHeaderStyle}>Drivers</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.team}>
                <td style={tableCellStyle}>{i + 1}</td>
                <td style={tableCellStyle}>{t.team}</td>
                <td style={tableCellStyle}>{t.points}</td>
                <td style={tableCellStyle}>{t.wins}</td>
                <td style={tableCellStyle}>{t.top5}</td>
                <td style={tableCellStyle}>{t.top10}</td>
                <td style={tableCellStyle}>{t.drivers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TickerOverlay({ drivers, teams, raceHistory, preview = false }) {
  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points);
  const topDrivers = sortedDrivers.slice(0, 5);
  const topTeams = teams.slice(0, 3);
  const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;

  const tickerItems = [
    "IRL Racing League",
    latestRace ? `Latest Race: ${latestRace.raceName}` : "No race results yet",
    ...topDrivers.map(
      (driver, index) => `P${index + 1} #${driver.number} ${driver.name} - ${driver.points} pts`
    ),
    ...topTeams.map(
      (team, index) => `Team P${index + 1} ${team.team} - ${team.points} pts`
    ),
  ];

  const tickerText = tickerItems.join("   •   ");

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: preview ? "#111" : "transparent",
        display: "flex",
        alignItems: "flex-end",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        body {
          margin: 0;
          overflow: hidden;
        }

        .ticker-bar {
          width: 100%;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.88);
          border-top: 2px solid #d4af37;
          border-bottom: 2px solid #d4af37;
          padding: 12px 0;
          white-space: nowrap;
        }

        .ticker-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          min-width: max-content;
          animation: tickerScroll 25s linear infinite;
        }

        .ticker-logo {
          height: 30px;
          width: auto;
          margin-right: 28px;
          vertical-align: middle;
        }

        .ticker-text {
          display: inline-block;
          padding-right: 120px;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }

        @keyframes tickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      <div className="ticker-bar">
        <div className="ticker-track">
          <img src={logo} alt="League Logo" className="ticker-logo" />
          <span className="ticker-text">{tickerText}</span>
          <img src={logo} alt="League Logo" className="ticker-logo" />
          <span className="ticker-text">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: "10px",
  borderBottom: "1px solid #444",
  textAlign: "left",
  background: "#222",
};

const tableCellStyle = {
  padding: "10px",
  borderBottom: "1px solid #333",
};

export default function App() {
  const [drivers, setDrivers] = useState(() => {
    const saved = localStorage.getItem("irl-drivers");
    return saved ? JSON.parse(saved) : defaultDrivers;
  });

  const [selectedRace, setSelectedRace] = useState(() => localStorage.getItem("irl-selectedRace") || "");
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem("irl-positions");
    return saved ? JSON.parse(saved) : {};
  });
  const [stage1, setStage1] = useState(() => {
    const saved = localStorage.getItem("irl-stage1");
    return saved ? JSON.parse(saved) : {};
  });
  const [stage2, setStage2] = useState(() => {
    const saved = localStorage.getItem("irl-stage2");
    return saved ? JSON.parse(saved) : {};
  });
  const [stage3, setStage3] = useState(() => {
    const saved = localStorage.getItem("irl-stage3");
    return saved ? JSON.parse(saved) : {};
  });
  const [stage4, setStage4] = useState(() => {
    const saved = localStorage.getItem("irl-stage4");
    return saved ? JSON.parse(saved) : {};
  });
  const [penalties, setPenalties] = useState(() => {
    const saved = localStorage.getItem("irl-penalties");
    return saved ? JSON.parse(saved) : {};
  });
  const [raceHistory, setRaceHistory] = useState(() => {
    const saved = localStorage.getItem("irl-raceHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [viewMode, setViewMode] = useState("admin");

  const path = window.location.pathname.toLowerCase();

  const selectedRaceData = races.find((race) => race.name === selectedRace);
  const stageCount = selectedRaceData ? selectedRaceData.stageCount : 3;

  useEffect(() => {
    localStorage.setItem("irl-drivers", JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem("irl-selectedRace", selectedRace);
  }, [selectedRace]);

  useEffect(() => {
    localStorage.setItem("irl-positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem("irl-stage1", JSON.stringify(stage1));
  }, [stage1]);

  useEffect(() => {
    localStorage.setItem("irl-stage2", JSON.stringify(stage2));
  }, [stage2]);

  useEffect(() => {
    localStorage.setItem("irl-stage3", JSON.stringify(stage3));
  }, [stage3]);

  useEffect(() => {
    localStorage.setItem("irl-stage4", JSON.stringify(stage4));
  }, [stage4]);

  useEffect(() => {
    localStorage.setItem("irl-penalties", JSON.stringify(penalties));
  }, [penalties]);

  useEffect(() => {
    localStorage.setItem("irl-raceHistory", JSON.stringify(raceHistory));
  }, [raceHistory]);

  const teamStandings = useMemo(() => {
    const teams = {};
    for (const driver of drivers) {
      if (!teams[driver.team]) {
        teams[driver.team] = {
          team: driver.team,
          points: 0,
          wins: 0,
          top5: 0,
          top10: 0,
          drivers: 0,
        };
      }
      teams[driver.team].points += driver.points;
      teams[driver.team].wins += driver.wins;
      teams[driver.team].top5 += driver.top5;
      teams[driver.team].top10 += driver.top10;
      teams[driver.team].drivers += 1;
    }
    return Object.values(teams).sort((a, b) => b.points - a.points);
  }, [drivers]);

  const handlePositionChange = (driverId, value) =>
    setPositions({ ...positions, [driverId]: Number(value) });

  const handleStage1Change = (driverId, value) =>
    setStage1({ ...stage1, [driverId]: Number(value) });

  const handleStage2Change = (driverId, value) =>
    setStage2({ ...stage2, [driverId]: Number(value) });

  const handleStage3Change = (driverId, value) =>
    setStage3({ ...stage3, [driverId]: Number(value) });

  const handleStage4Change = (driverId, value) =>
    setStage4({ ...stage4, [driverId]: Number(value) });

  const handlePenaltyPresetChange = (driverId, selectedLabel) => {
    const selectedPenalty = penaltyOptions.find((option) => option.label === selectedLabel);
    setPenalties({
      ...penalties,
      [driverId]: selectedPenalty || { label: "No Penalty", points: 0, reason: "" },
    });
  };

  const getStagePoints = (stageFinish) => {
    if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
    return stagePointsTable[stageFinish - 1];
  };

  const clearInputs = () => {
    setSelectedRace("");
    setPositions({});
    setStage1({});
    setStage2({});
    setStage3({});
    setStage4({});
    setPenalties({});
  };

  const resetSeason = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset the full season? This will erase standings, race history, penalties, and stats."
    );
    if (!confirmed) return;

    setDrivers(defaultDrivers);
    setRaceHistory([]);
    clearInputs();

    localStorage.removeItem("irl-drivers");
    localStorage.removeItem("irl-selectedRace");
    localStorage.removeItem("irl-positions");
    localStorage.removeItem("irl-stage1");
    localStorage.removeItem("irl-stage2");
    localStorage.removeItem("irl-stage3");
    localStorage.removeItem("irl-stage4");
    localStorage.removeItem("irl-penalties");
    localStorage.removeItem("irl-raceHistory");
  };

  const submitResults = () => {
    if (!selectedRace.trim()) {
      alert("Please select a race.");
      return;
    }

    const raceAlreadyExists = raceHistory.some((race) => race.raceName === selectedRace);
    if (raceAlreadyExists) {
      alert("That race has already been entered.");
      return;
    }

    const raceResults = [];

    const updatedDrivers = drivers.map((driver) => {
      const finishPos = positions[driver.id];
      const stage1Pos = stage1[driver.id];
      const stage2Pos = stage2[driver.id];
      const stage3Pos = stage3[driver.id];
      const stage4Pos = stage4[driver.id];

      const finishPoints =
        finishPos && finishPos >= 1 && finishPos <= pointsTable.length
          ? pointsTable[finishPos - 1]
          : 0;

      const stage1Points = getStagePoints(stage1Pos);
      const stage2Points = getStagePoints(stage2Pos);
      const stage3Points = getStagePoints(stage3Pos);
      const stage4Points = stageCount === 4 ? getStagePoints(stage4Pos) : 0;

      const selectedPenalty = penalties[driver.id] || { label: "No Penalty", points: 0, reason: "" };
      const penaltyPoints = selectedPenalty.points || 0;
      const penaltyReason = selectedPenalty.reason || "";

      const totalRacePoints =
        finishPoints + stage1Points + stage2Points + stage3Points + stage4Points - penaltyPoints;

      const isWin = finishPos === 1;
      const isTop5 = finishPos >= 1 && finishPos <= 5;
      const isTop10 = finishPos >= 1 && finishPos <= 10;

      raceResults.push({
        driverId: driver.id,
        name: driver.name,
        number: driver.number,
        team: driver.team,
        finishPos: finishPos || null,
        stage1Pos: stage1Pos || null,
        stage2Pos: stage2Pos || null,
        stage3Pos: stage3Pos || null,
        stage4Pos: stageCount === 4 ? stage4Pos || null : null,
        finishPoints,
        stage1Points,
        stage2Points,
        stage3Points,
        stage4Points,
        penaltyPoints,
        penaltyReason,
        totalRacePoints,
        isWin,
        isTop5,
        isTop10,
      });

      return {
        ...driver,
        points: driver.points + totalRacePoints,
        wins: driver.wins + (isWin ? 1 : 0),
        top5: driver.top5 + (isTop5 ? 1 : 0),
        top10: driver.top10 + (isTop10 ? 1 : 0),
      };
    });

    setDrivers(updatedDrivers);
    setRaceHistory([
      ...raceHistory,
      {
        raceName: selectedRace,
        stageCount,
        results: raceResults.sort((a, b) => {
          if (a.finishPos === null) return 1;
          if (b.finishPos === null) return -1;
          return a.finishPos - b.finishPos;
        }),
      },
    ]);

    clearInputs();
  };

  const totalPenaltyLog = raceHistory.flatMap((race) =>
    race.results
      .filter((result) => result.penaltyPoints > 0)
      .map((result) => ({
        raceName: race.raceName,
        number: result.number,
        name: result.name,
        penaltyPoints: result.penaltyPoints,
        penaltyReason: result.penaltyReason,
      }))
  );

  if (path === "/overlay/drivers" || viewMode === "overlay-drivers") {
    return <LeaderboardOverlay drivers={drivers} />;
  }

  if (path === "/overlay/teams" || viewMode === "overlay-teams") {
    return <TeamOverlay teams={teamStandings} />;
  }

  if (path === "/standings") {
    return <PublicStandings drivers={drivers} teams={teamStandings} />;
  }

  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") {
    return (
      <TickerOverlay
        drivers={drivers}
        teams={teamStandings}
        raceHistory={raceHistory}
        preview={viewMode === "overlay-ticker"}
      />
    );
  }

  return (
    <div style={{ padding: "24px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        <img src={logo} alt="League Logo" style={{ height: 60, width: "auto" }} />
        <h1 style={{ margin: 0 }}>IRL Racing League</h1>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={() => setViewMode("admin")} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Admin View
        </button>
        <button onClick={() => setViewMode("overlay-drivers")} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Driver Overlay Preview
        </button>
        <button onClick={() => setViewMode("overlay-teams")} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Team Overlay Preview
        </button>
        <button onClick={() => setViewMode("overlay-ticker")} style={{ padding: "10px 16px", cursor: "pointer" }}>
          Ticker Overlay Preview
        </button>
      </div>

      <h2>Season Standings</h2>
      <ul>
        {[...drivers].sort((a, b) => b.points - a.points).map((driver, index) => (
          <li key={driver.id}>
            {index + 1}. #{driver.number} {driver.name} ({driver.team}) - {driver.points} pts | Wins: {driver.wins} | Top 5s: {driver.top5} | Top 10s: {driver.top10}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "24px" }}>Team Standings</h2>
      <ul>
        {teamStandings.map((team, index) => (
          <li key={team.team}>
            {index + 1}. {team.team} - {team.points} pts | Wins: {team.wins} | Top 5s: {team.top5} | Top 10s: {team.top10} | Drivers: {team.drivers}
          </li>
        ))}
      </ul>

      <h2 style={{ marginTop: "24px" }}>Enter Race Results</h2>

      <div style={{ marginBottom: "16px" }}>
        <label>
          Select Race:
          <select
            value={selectedRace}
            onChange={(e) => setSelectedRace(e.target.value)}
            style={{ marginLeft: "8px", padding: "4px" }}
          >
            <option value="">-- Choose a Race --</option>
            {races.map((race) => (
              <option key={race.id} value={race.name}>
                {race.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedRace && <p style={{ fontWeight: "bold" }}>Stages for {selectedRace}: {stageCount}</p>}

      <div>
        {drivers.map((driver) => (
          <div
            key={driver.id}
            style={{
              marginBottom: "16px",
              padding: "12px",
              border: "1px solid #ccc",
              borderRadius: "8px",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              #{driver.number} {driver.name}
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>
                Finish Position:
                <input
                  type="number"
                  value={positions[driver.id] ?? ""}
                  onChange={(e) => handlePositionChange(driver.id, e.target.value)}
                  style={{ marginLeft: "8px", padding: "4px", width: "70px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>
                Stage 1 Finish:
                <input
                  type="number"
                  value={stage1[driver.id] ?? ""}
                  onChange={(e) => handleStage1Change(driver.id, e.target.value)}
                  style={{ marginLeft: "8px", padding: "4px", width: "70px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>
                Stage 2 Finish:
                <input
                  type="number"
                  value={stage2[driver.id] ?? ""}
                  onChange={(e) => handleStage2Change(driver.id, e.target.value)}
                  style={{ marginLeft: "8px", padding: "4px", width: "70px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label>
                Stage 3 Finish:
                <input
                  type="number"
                  value={stage3[driver.id] ?? ""}
                  onChange={(e) => handleStage3Change(driver.id, e.target.value)}
                  style={{ marginLeft: "8px", padding: "4px", width: "70px" }}
                />
              </label>
            </div>

            {stageCount === 4 && (
              <div style={{ marginBottom: "8px" }}>
                <label>
                  Stage 4 Finish:
                  <input
                    type="number"
                    value={stage4[driver.id] ?? ""}
                    onChange={(e) => handleStage4Change(driver.id, e.target.value)}
                    style={{ marginLeft: "8px", padding: "4px", width: "70px" }}
                  />
                </label>
              </div>
            )}

            <div>
              <label>
                Penalty Preset:
                <select
                  value={penalties[driver.id]?.label ?? "No Penalty"}
                  onChange={(e) => handlePenaltyPresetChange(driver.id, e.target.value)}
                  style={{ marginLeft: "8px", padding: "4px", width: "260px" }}
                >
                  {penaltyOptions.map((option) => (
                    <option key={option.label} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <button onClick={submitResults} style={{ marginTop: "16px", padding: "10px 16px", cursor: "pointer" }}>
        Submit Race
      </button>
      <button onClick={clearInputs} style={{ marginLeft: "10px", padding: "10px 16px", cursor: "pointer" }}>
        Clear Inputs
      </button>
      <button onClick={resetSeason} style={{ marginLeft: "10px", padding: "10px 16px", cursor: "pointer" }}>
        Reset Season
      </button>

      <h2 style={{ marginTop: "32px" }}>Race History</h2>
      {raceHistory.length === 0 ? (
        <p>No races entered yet.</p>
      ) : (
        raceHistory.map((race, index) => (
          <div
            key={index}
            style={{
              marginBottom: "24px",
              padding: "12px",
              border: "1px solid #aaa",
              borderRadius: "8px",
            }}
          >
            <h3>
              {race.raceName} ({race.stageCount} stages)
            </h3>
            <ul>
              {race.results.map((result, i) => (
                <li key={i}>
                  P{result.finishPos ?? "-"} - #{result.number} {result.name} ({result.team}) | S1: {result.stage1Pos ?? "-"} | S2: {result.stage2Pos ?? "-"} | S3: {result.stage3Pos ?? "-"}
                  {race.stageCount === 4 ? ` | S4: ${result.stage4Pos ?? "-"}` : ""}
                  {" | "}Penalty: -{result.penaltyPoints || 0}
                  {result.penaltyReason ? ` (${result.penaltyReason})` : ""}
                  {" | "}Earned: {result.totalRacePoints} pts
                </li>
              ))}
            </ul>
          </div>
        ))
      )}

      <h2 style={{ marginTop: "32px" }}>Penalty Log</h2>
      {totalPenaltyLog.length === 0 ? (
        <p>No penalties recorded yet.</p>
      ) : (
        <ul>
          {totalPenaltyLog.map((penalty, index) => (
            <li key={index}>
              {penalty.raceName} - #{penalty.number} {penalty.name}: -{penalty.penaltyPoints} pts
              {penalty.penaltyReason ? ` (${penalty.penaltyReason})` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}