import { useEffect, useMemo, useState } from "react";
import logo from "./assets/logo.png";

const defaultDrivers = [
  { id: 1, name: "AMP-GHOSTRIDER", number: "42", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 2, name: "ROOKIEVET99", number: "99", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 3, name: "BOWHUNTER6758", number: "18", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 4, name: "HOLDEN2DX4EV3R", number: "81", team: "JA MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 5, name: "SILVEREYEAC", number: "19", team: "SILVER RACING GROUP", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 6, name: "KEVDINHO7", number: "24", team: "KEVIN HO MOTORSPORTS", points: 0, wins: 0, top5: 0, top10: 0 },
  { id: 7, name: "TEST DRIVER", number: "04", team: "RFK RACING", points: 0, wins: 0, top5: 0, top10: 0 },
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

const appShellStyle = {
  minHeight: "100vh",
  background: "#0b0b0d",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: 24,
};

const sectionCardStyle = {
  background: "#16181d",
  border: "1px solid #2b2f36",
  borderRadius: 16,
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
};

const toolbarButtonStyle = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #3a404a",
  background: "#20242b",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const primaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #d4af37",
  background: "#d4af37",
  color: "#111",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #4a515d",
  background: "#22262d",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const dangerButtonStyle = {
  padding: "12px 18px",
  borderRadius: 10,
  border: "1px solid #7a2e2e",
  background: "#4b1f1f",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const tableHeaderStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #3a404a",
  textAlign: "left",
  background: "#20242b",
  fontSize: 14,
};

const tableCellStyle = {
  padding: "12px 10px",
  borderBottom: "1px solid #2f343c",
  fontSize: 14,
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  fontWeight: 700,
  color: "#cfd5df",
  marginBottom: 6,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #3a404a",
  background: "#111418",
  color: "white",
  boxSizing: "border-box",
};

function LeaderboardOverlay({ drivers }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points);
  const currentLeader = sortedDrivers[0] || null;
const totalDrivers = drivers.length;
const totalRacesEntered = raceHistory.length;
const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
const latestWinner =
  latestRace?.results?.find((result) => result.finishPos === 1) || null;

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
        <h1 style={{ margin: 0, color: "lime" }}>IRL Racing League</h1>
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
  const topDrivers = sortedDrivers;
  const topTeams = teams;
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
          animation: tickerScroll 45s linear infinite;
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

  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points);

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
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div
          style={{
            ...sectionCardStyle,
            marginBottom: 20,
            padding: 20,
            background: "linear-gradient(135deg, #17191f 0%, #101216 100%)",
            border: "1px solid #353b45",
          }}
        >
          <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 20,
  }}
>
  <div
    style={{
      ...sectionCardStyle,
      padding: 16,
      background: "#151922",
    }}
  >
    <div style={{ fontSize: 12, color: "#aeb6c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
      Current Leader
    </div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>
      {currentLeader ? `#${currentLeader.number} ${currentLeader.name}` : "—"}
    </div>
    <div style={{ marginTop: 6, color: "#d4af37", fontWeight: 700 }}>
      {currentLeader ? `${currentLeader.points} pts` : ""}
    </div>
  </div>

  <div
    style={{
      ...sectionCardStyle,
      padding: 16,
      background: "#151922",
    }}
  >
    <div style={{ fontSize: 12, color: "#aeb6c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
      Total Drivers
    </div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{totalDrivers}</div>
    <div style={{ marginTop: 6, color: "#c7ced8" }}>Active this season</div>
  </div>

  <div
    style={{
      ...sectionCardStyle,
      padding: 16,
      background: "#151922",
    }}
  >
    <div style={{ fontSize: 12, color: "#aeb6c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
      Races Entered
    </div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>{totalRacesEntered}</div>
    <div style={{ marginTop: 6, color: "#c7ced8" }}>Saved to race history</div>
  </div>

  <div
    style={{
      ...sectionCardStyle,
      padding: 16,
      background: "#151922",
    }}
  >
    <div style={{ fontSize: 12, color: "#aeb6c2", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
      Latest Winner
    </div>
    <div style={{ fontSize: 22, fontWeight: 700 }}>
      {latestWinner ? `#${latestWinner.number} ${latestWinner.name}` : "No winner yet"}
    </div>
    <div style={{ marginTop: 6, color: "#c7ced8" }}>
      {latestRace ? latestRace.raceName : "No races entered"}
    </div>
  </div>
</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={logo} alt="League Logo" style={{ height: 64, width: "auto" }} />
              <div>
                <h1 style={{ margin: 0, fontSize: 32 }}>IRL Racing League</h1>
                <p style={{ margin: "6px 0 0 0", color: "#c7ced8" }}>
                  Admin dashboard for standings, race entry, overlays, and penalties
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button onClick={() => setViewMode("admin")} style={toolbarButtonStyle}>
                Admin View
              </button>
              <button onClick={() => setViewMode("overlay-drivers")} style={toolbarButtonStyle}>
                Driver Overlay Preview
              </button>
              <button onClick={() => setViewMode("overlay-teams")} style={toolbarButtonStyle}>
                Team Overlay Preview
              </button>
              <button onClick={() => setViewMode("overlay-ticker")} style={toolbarButtonStyle}>
                Ticker Overlay Preview
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr",
            gap: 20,
            alignItems: "start",
            marginBottom: 20,
          }}
        >
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Driver Standings</h2>
              <span style={{ color: "#c7ced8", fontSize: 14 }}>{sortedDrivers.length} drivers</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Pos</th>
                    <th style={tableHeaderStyle}>#</th>
                    <th style={tableHeaderStyle}>Driver</th>
                    <th style={tableHeaderStyle}>Team</th>
                    <th style={tableHeaderStyle}>Pts</th>
                    <th style={tableHeaderStyle}>Wins</th>
                    <th style={tableHeaderStyle}>Top 5</th>
                    <th style={tableHeaderStyle}>Top 10</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDrivers.map((driver, index) => (
                    <tr key={driver.id}>
                      <td style={tableCellStyle}>{index + 1}</td>
                      <td style={tableCellStyle}>#{driver.number}</td>
                      <td style={tableCellStyle}>{driver.name}</td>
                      <td style={tableCellStyle}>{driver.team}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700 }}>{driver.points}</td>
                      <td style={tableCellStyle}>{driver.wins}</td>
                      <td style={tableCellStyle}>{driver.top5}</td>
                      <td style={tableCellStyle}>{driver.top10}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0 }}>Team Standings</h2>
              <span style={{ color: "#c7ced8", fontSize: 14 }}>{teamStandings.length} teams</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyle}>Pos</th>
                    <th style={tableHeaderStyle}>Team</th>
                    <th style={tableHeaderStyle}>Pts</th>
                    <th style={tableHeaderStyle}>Wins</th>
                    <th style={tableHeaderStyle}>Top 5</th>
                    <th style={tableHeaderStyle}>Top 10</th>
                    <th style={tableHeaderStyle}>Drivers</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStandings.map((team, index) => (
                    <tr key={team.team}>
                      <td style={tableCellStyle}>{index + 1}</td>
                      <td style={tableCellStyle}>{team.team}</td>
                      <td style={{ ...tableCellStyle, fontWeight: 700 }}>{team.points}</td>
                      <td style={tableCellStyle}>{team.wins}</td>
                      <td style={tableCellStyle}>{team.top5}</td>
                      <td style={tableCellStyle}>{team.top10}</td>
                      <td style={tableCellStyle}>{team.drivers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <h2 style={{ margin: 0 }}>Enter Race Results</h2>
            <div style={{ color: "#c7ced8", fontSize: 14 }}>
              {selectedRace ? `Stages for ${selectedRace}: ${stageCount}` : "Choose a race to begin"}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 320px)",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <label style={labelStyle}>Select Race</label>
              <select
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
                style={inputStyle}
              >
                <option value="">-- Choose a Race --</option>
                {races.map((race) => (
                  <option key={race.id} value={race.name}>
                    {race.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 16,
            }}
          >
            {drivers.map((driver) => (
              <div
                key={driver.id}
                style={{
                  background: "#111418",
                  border: "1px solid #2f343c",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>
                    #{driver.number} {driver.name}
                  </div>
                  <div style={{ color: "#b7bfca", fontSize: 13, marginTop: 4 }}>{driver.team}</div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: stageCount === 4 ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
                    gap: 12,
                  }}
                >
                  <div>
                    <label style={labelStyle}>Finish Position</label>
                    <input
                      type="number"
                      value={positions[driver.id] ?? ""}
                      onChange={(e) => handlePositionChange(driver.id, e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Stage 1 Finish</label>
                    <input
                      type="number"
                      value={stage1[driver.id] ?? ""}
                      onChange={(e) => handleStage1Change(driver.id, e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Stage 2 Finish</label>
                    <input
                      type="number"
                      value={stage2[driver.id] ?? ""}
                      onChange={(e) => handleStage2Change(driver.id, e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>Stage 3 Finish</label>
                    <input
                      type="number"
                      value={stage3[driver.id] ?? ""}
                      onChange={(e) => handleStage3Change(driver.id, e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {stageCount === 4 && (
                    <div>
                      <label style={labelStyle}>Stage 4 Finish</label>
                      <input
                        type="number"
                        value={stage4[driver.id] ?? ""}
                        onChange={(e) => handleStage4Change(driver.id, e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  )}

                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={labelStyle}>Penalty Preset</label>
                    <select
                      value={penalties[driver.id]?.label ?? "No Penalty"}
                      onChange={(e) => handlePenaltyPresetChange(driver.id, e.target.value)}
                      style={inputStyle}
                    >
                      {penaltyOptions.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginTop: 20,
            }}
          >
            <button onClick={submitResults} style={primaryButtonStyle}>
              Submit Race
            </button>
            <button onClick={clearInputs} style={secondaryButtonStyle}>
              Clear Inputs
            </button>
            <button onClick={resetSeason} style={dangerButtonStyle}>
              Reset Season
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Race History</h2>

            {raceHistory.length === 0 ? (
              <p style={{ color: "#c7ced8", marginBottom: 0 }}>No races entered yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 16 }}>
                {raceHistory.map((race, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#111418",
                      border: "1px solid #2f343c",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>
                      {race.raceName} ({race.stageCount} stages)
                    </h3>

                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>
                            <th style={tableHeaderStyle}>Fin</th>
                            <th style={tableHeaderStyle}>Driver</th>
                            <th style={tableHeaderStyle}>Team</th>
                            <th style={tableHeaderStyle}>S1</th>
                            <th style={tableHeaderStyle}>S2</th>
                            <th style={tableHeaderStyle}>S3</th>
                            {race.stageCount === 4 ? <th style={tableHeaderStyle}>S4</th> : null}
                            <th style={tableHeaderStyle}>Penalty</th>
                            <th style={tableHeaderStyle}>Earned</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.results.map((result, i) => (
                            <tr key={i}>
                              <td style={tableCellStyle}>P{result.finishPos ?? "-"}</td>
                              <td style={tableCellStyle}>
                                #{result.number} {result.name}
                              </td>
                              <td style={tableCellStyle}>{result.team}</td>
                              <td style={tableCellStyle}>{result.stage1Pos ?? "-"}</td>
                              <td style={tableCellStyle}>{result.stage2Pos ?? "-"}</td>
                              <td style={tableCellStyle}>{result.stage3Pos ?? "-"}</td>
                              {race.stageCount === 4 ? (
                                <td style={tableCellStyle}>{result.stage4Pos ?? "-"}</td>
                              ) : null}
                              <td style={tableCellStyle}>
                                -{result.penaltyPoints || 0}
                                {result.penaltyReason ? ` (${result.penaltyReason})` : ""}
                              </td>
                              <td style={{ ...tableCellStyle, fontWeight: 700 }}>{result.totalRacePoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Penalty Log</h2>

            {totalPenaltyLog.length === 0 ? (
              <p style={{ color: "#c7ced8", marginBottom: 0 }}>No penalties recorded yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {totalPenaltyLog.map((penalty, index) => (
                  <div
                    key={index}
                    style={{
                      background: "#111418",
                      border: "1px solid #2f343c",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{penalty.raceName}</div>
                    <div style={{ color: "#d9e0ea" }}>
                      #{penalty.number} {penalty.name}
                    </div>
                    <div style={{ color: "#ffb7b7", marginTop: 6 }}>
                      -{penalty.penaltyPoints} pts
                      {penalty.penaltyReason ? ` (${penalty.penaltyReason})` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
