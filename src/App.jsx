import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo.png";
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";

const defaultDrivers = [
  { id: 1, number: 64, name: "AMP-GHOSTRIDER", team: "JAM" },
  { id: 2, number: 46, name: "RookieVet99", team: "JAM" },
  { id: 3, number: 18, name: "bowhunter6758", team: "JAM" },
  { id: 4, number: 81, name: "HOLDEN2DX4EV3R", team: "JAM" },
  { id: 5, number: 60, name: "tropicalakari", team: "PMS" },
  { id: 6, number: 61, name: "Lamloc", team: "PMS" },
  { id: 7, number: 14, name: "KAPSIG", team: "PMS" },
  { id: 8, number: 88, name: "BLUEDREAM2YT2010", team: "PMS" },
  { id: 9, number: 10, name: "Jimmy Diimes.", team: "BNR" },
  { id: 10, number: 4, name: "segregated-Chimp", team: "BNR" },
  { id: 11, number: 27, name: "TheCoachDan", team: "BNR" },
  { id: 12, number: 94, name: "all-boston-sport", team: "BNR" },
  { id: 13, number: 19, name: "Silvereyeac", team: "None" },
  { id: 14, number: 24, name: "Kevdinho7", team: "None" },
];

const races = [
  { name: "Daytona (R1)", stageCount: 2 },
  { name: "Echopark", stageCount: 2 },
  { name: "Las Vegas (R1)", stageCount: 2 },
  { name: "Dover (R1)", stageCount: 2 },
  { name: "Talladega (R1)", stageCount: 2 },
  { name: "Texas", stageCount: 2 },
  { name: "Charlotte", stageCount: 3 },
  { name: "Michigan", stageCount: 2 },
  { name: "Homestead Miami", stageCount: 2 },
  { name: "Indianapolis", stageCount: 2 },
  { name: "Daytona (R2)", stageCount: 2 },
  { name: "Dover (R2)", stageCount: 2 },
  { name: "New Hampshire", stageCount: 2 },
  { name: "Kansas", stageCount: 2 },
  { name: "Las Vegas (R2)", stageCount: 2 },
  { name: "Talladega (R2)", stageCount: 2 },
  { name: "Phoenix", stageCount: 2 },
];

const pointsTable = [
  40, 35, 34, 33, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18,
  17,
];

const stagePointsTable = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

const penaltyOptions = [
  { label: "No Penalty", points: 0, reason: "" },
  { label: "Tail End", points: 5, reason: "Tail end of longest line" },
  { label: "Pass Through", points: 10, reason: "Pass through penalty" },
  { label: "Stop and Go", points: 15, reason: "Stop and go penalty" },
  { label: "Lap Penalty", points: 20, reason: "One lap penalty" },
];

const appShellStyle = {
  minHeight: "100vh",
  background: "#0c0f14",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: 20,
};

const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 16,
  padding: 18,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};

const headerButtonStyle = {
  background: "#222936",
  color: "white",
  border: "1px solid #3a4453",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

const activeHeaderButtonStyle = {
  ...headerButtonStyle,
  background: "#d4af37",
  color: "#111",
  border: "1px solid #d4af37",
};

const primaryButtonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#2a3140",
  color: "white",
  border: "1px solid #3d4859",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: "#b42318",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  boxSizing: "border-box",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
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

const statBoxStyle = {
  background: "#11161d",
  border: "1px solid #2a3240",
  borderRadius: 14,
  padding: 16,
  flex: "1 1 220px",
};

const teamBranding = {
  "Team A": { logo: "A", accent: "#d4af37", dark: "#1b1b1b" },
  "Team B": { logo: "B", accent: "#3b82f6", dark: "#111827" },
  "Team C": { logo: "C", accent: "#ef4444", dark: "#1f1315" },
  "Team D": { logo: "D", accent: "#22c55e", dark: "#0f1b14" },
};

function getTeamBranding(teamName) {
  return (
    teamBranding[teamName] || {
      logo: teamName?.charAt(0)?.toUpperCase() || "?",
      accent: "#d4af37",
      dark: "#161a20",
    }
  );
}

// FIX #6: renderTeamBadge moved to module scope so both App and PublicStandings can use it
function renderTeamBadge(teamName, size = 44) {
  const brand = getTeamBranding(teamName);
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        color: "white",
        border: "2px solid rgba(255,255,255,0.15)",
        boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
        fontSize: size * 0.38,
      }}
    >
      {brand.logo}
    </div>
  );
}

function makeDriverWithStats(driver) {
  return {
    ...driver,
    startingPoints: Number(driver.startingPoints) || 0,
    manualWins: Number(driver.manualWins) || 0,
    points: Number(driver.startingPoints) || 0,
    wins: Number(driver.manualWins) || 0,
    top5: 0,
    top10: 0,
    dnfs: 0,
  };
}

function getDefaultRoster() {
  return defaultDrivers.map(makeDriverWithStats);
}

function getStagePoints(stageFinish) {
  if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
  return stagePointsTable[stageFinish - 1];
}

function rebuildDriversFromHistory(history, driverRoster) {
  return driverRoster.map((baseDriver) => {
    let points = Number(baseDriver.startingPoints) || 0;
    let wins = Number(baseDriver.manualWins) || 0;
    let top5 = 0;
    let top10 = 0;
    let dnfs = 0;

    history.forEach((race) => {
      const result = race.results?.find((r) => r.driverId === baseDriver.id);
      if (!result) return;

      points += result.totalRacePoints || 0;
      wins += result.isWin ? 1 : 0;
      top5 += result.isTop5 ? 1 : 0;
      top10 += result.isTop10 ? 1 : 0;
      dnfs += result.dnf ? 1 : 0;
    });

    return {
      ...baseDriver,
      startingPoints: Number(baseDriver.startingPoints) || 0,
      manualWins: Number(baseDriver.manualWins) || 0,
      points,
      wins,
      top5,
      top10,
      dnfs,
    };
  });
}

function makeSeasonId() {
  return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptySeason(name, roster = getDefaultRoster()) {
  const cleanRoster = roster.map((driver) => ({
    id: driver.id,
    number: driver.number,
    name: driver.name,
    team: driver.team,
    startingPoints: Number(driver.startingPoints) || 0,
    manualWins: Number(driver.manualWins) || 0,
  }));

  return {
    id: makeSeasonId(),
    name: name || "New Season",
    createdAt: new Date().toISOString(),
    drivers: rebuildDriversFromHistory([], cleanRoster),
    selectedRace: "",
    positions: {},
    stage1: {},
    stage2: {},
    stage3: {},
    dnfMap: {},
    penalties: {},
    raceHistory: [],
  };
}

function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource =
    Array.isArray(season?.drivers) && season.drivers.length > 0
      ? season.drivers
      : getDefaultRoster();

  const rosterOnly = rosterSource.map((driver) => ({
    id: driver.id,
    number: Number(driver.number),
    name: driver.name,
    team: driver.team,
    startingPoints: Number(driver.startingPoints) || 0,
    manualWins: Number(driver.manualWins) || 0,
  }));

  const history = Array.isArray(season?.raceHistory) ? season.raceHistory : [];

  return {
    id: season?.id || makeSeasonId(),
    name: season?.name || fallbackName,
    createdAt: season?.createdAt || new Date().toISOString(),
    drivers: rebuildDriversFromHistory(history, rosterOnly),
    selectedRace: season?.selectedRace || "",
    positions: season?.positions || {},
    stage1: season?.stage1 || {},
    stage2: season?.stage2 || {},
    stage3: season?.stage3 || {},
    dnfMap: season?.dnfMap || {},
    penalties: season?.penalties || {},
    raceHistory: history,
  };
}

function buildLegacySeasonFromLocalStorage() {
  const savedDrivers = localStorage.getItem("irl-drivers");
  const savedRaceHistory = localStorage.getItem("irl-raceHistory");
  const savedSelectedRace = localStorage.getItem("irl-selectedRace");
  const savedPositions = localStorage.getItem("irl-positions");
  const savedStage1 = localStorage.getItem("irl-stage1");
  const savedStage2 = localStorage.getItem("irl-stage2");
  const savedStage3 = localStorage.getItem("irl-stage3");
  const savedDnfMap = localStorage.getItem("irl-dnfMap");
  const savedPenalties = localStorage.getItem("irl-penalties");

  const hasLegacyData =
    savedDrivers ||
    savedRaceHistory ||
    savedSelectedRace ||
    savedPositions ||
    savedStage1 ||
    savedStage2 ||
    savedStage3 ||
    savedDnfMap ||
    savedPenalties;

  if (!hasLegacyData) {
    return createEmptySeason("Season 1");
  }

  let drivers = getDefaultRoster();
  let raceHistory = [];
  let selectedRace = "";
  let positions = {};
  let stage1 = {};
  let stage2 = {};
  let stage3 = {};
  let dnfMap = {};
  let penalties = {};

  try {
    drivers = savedDrivers ? JSON.parse(savedDrivers) : getDefaultRoster();
    raceHistory = savedRaceHistory ? JSON.parse(savedRaceHistory) : [];
    selectedRace = savedSelectedRace || "";
    positions = savedPositions ? JSON.parse(savedPositions) : {};
    stage1 = savedStage1 ? JSON.parse(savedStage1) : {};
    stage2 = savedStage2 ? JSON.parse(savedStage2) : {};
    stage3 = savedStage3 ? JSON.parse(savedStage3) : {};
    dnfMap = savedDnfMap ? JSON.parse(savedDnfMap) : {};
    penalties = savedPenalties ? JSON.parse(savedPenalties) : {};
  } catch (error) {
    return createEmptySeason("Season 1");
  }

  return sanitizeSeason({
    id: makeSeasonId(),
    name: "Season 1",
    createdAt: new Date().toISOString(),
    drivers,
    raceHistory,
    selectedRace,
    positions,
    stage1,
    stage2,
    stage3,
    dnfMap,
    penalties,
  });
}

// FIX #3: moved into a plain function (not called directly in component body)
// so it can be used as a useState lazy initializer
function loadInitialLeagueState() {
  try {
    const savedSeasons = localStorage.getItem("irl-seasons");
    const savedActiveSeasonId = localStorage.getItem("irl-activeSeasonId");

    if (savedSeasons) {
      const parsed = JSON.parse(savedSeasons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanSeasons = parsed.map((season, index) =>
          sanitizeSeason(season, `Season ${index + 1}`)
        );
        const activeExists = cleanSeasons.some(
          (season) => season.id === savedActiveSeasonId
        );
        return {
          seasons: cleanSeasons,
          activeSeasonId: activeExists
            ? savedActiveSeasonId
            : cleanSeasons[0].id,
        };
      }
    }
  } catch (error) {
    // fall through
  }

  const legacySeason = buildLegacySeasonFromLocalStorage();
  return {
    seasons: [legacySeason],
    activeSeasonId: legacySeason.id,
  };
}

function LeaderboardOverlay({ drivers, preview = false, seasonName = "" }) {
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.top5 !== a.top5) return b.top5 - a.top5;
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: preview ? "#111" : "transparent",
        color: "white",
        padding: 20,
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          background: "rgba(10,10,10,0.84)",
          border: "2px solid #d4af37",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            background: "#0f1218",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="League Logo" style={{ height: 42 }} />
            Driver Standings
          </div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>#</th>
              <th style={thStyle}>Driver</th>
              <th style={thStyle}>Team</th>
              <th style={thStyle}>Points</th>
              <th style={thStyle}>Wins</th>
              <th style={thStyle}>Top 5</th>
              <th style={thStyle}>Top 10</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((driver, index) => (
              <tr key={driver.id}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}>{driver.number}</td>
                <td style={tdStyle}>{driver.name}</td>
                <td style={tdStyle}>{driver.team}</td>
                <td style={tdStyle}>{driver.points}</td>
                <td style={tdStyle}>{driver.wins}</td>
                <td style={tdStyle}>{driver.top5}</td>
                <td style={tdStyle}>{driver.top10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamOverlay({ teams, preview = false, seasonName = "" }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: preview ? "#111" : "transparent",
        color: "white",
        padding: 20,
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          background: "rgba(10,10,10,0.84)",
          border: "2px solid #d4af37",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            background: "#0f1218",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 28,
            fontWeight: 800,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="League Logo" style={{ height: 42 }} />
            Team Standings
          </div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Pos</th>
              <th style={thStyle}>Team</th>
              <th style={thStyle}>Points</th>
              <th style={thStyle}>Wins</th>
              <th style={thStyle}>Top 5</th>
              <th style={thStyle}>Top 10</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.team}>
                <td style={tdStyle}>{index + 1}</td>
                <td style={tdStyle}>{team.team}</td>
                <td style={tdStyle}>{team.points}</td>
                <td style={tdStyle}>{team.wins}</td>
                <td style={tdStyle}>{team.top5}</td>
                <td style={tdStyle}>{team.top10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PublicStandings({ drivers, teams, seasonName = "" }) {
  const sortedDrivers = [...drivers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.top5 !== a.top5) return b.top5 - a.top5;
    return a.name.localeCompare(b.name);
  });

  const leader = sortedDrivers[0];
  const second = sortedDrivers[1];
  const third = sortedDrivers[2];

  const totalPoints = sortedDrivers.reduce(
    (sum, driver) => sum + (driver.points || 0),
    0
  );
  const totalWins = sortedDrivers.reduce(
    (sum, driver) => sum + (driver.wins || 0),
    0
  );
  const totalDnfs = sortedDrivers.reduce(
    (sum, driver) => sum + (driver.dnfs || 0),
    0
  );

  const podiumCard = (driver, place) => {
    if (!driver) return null;
    const brand = getTeamBranding(driver.team);
    const isLeader = place === 1;

    return (
      <div
        style={{
          flex: "1 1 280px",
          background: isLeader
            ? `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`
            : "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)",
          color: "white",
          border: isLeader
            ? `1px solid ${brand.accent}`
            : "1px solid #313947",
          borderRadius: 22,
          padding: 22,
          boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -24,
            right: -24,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1,
                opacity: 0.85,
                marginBottom: 6,
              }}
            >
              {isLeader ? "POINTS LEADER" : `P${place}`}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>
              #{driver.number}
            </div>
          </div>
          {renderTeamBadge(driver.team, 54)}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>
          {driver.name}
        </div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 18 }}>
          {driver.team}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 10,
          }}
        >
          {[
            { label: "POINTS", value: driver.points },
            { label: "WINS", value: driver.wins },
            { label: "TOP 5", value: driver.top5 },
            { label: "TOP 10", value: driver.top10 },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(0,0,0,0.22)",
                borderRadius: 14,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)",
            border: "1px solid #313947",
            borderRadius: 24,
            padding: 26,
            marginBottom: 22,
            boxShadow: "0 14px 34px rgba(0,0,0,0.28)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -60,
              top: -60,
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(212,175,55,0.08)",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img
                src={logo}
                alt="League Logo"
                style={{
                  height: 64,
                  filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.35))",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    letterSpacing: 0.6,
                    lineHeight: 1.05,
                  }}
                >
                  IRL RACING LEAGUE
                </div>
                <div style={{ fontSize: 16, opacity: 0.76, marginTop: 6 }}>
                  Broadcast Standings
                </div>
              </div>
            </div>
            <div
              style={{
                background: "#0f1319",
                border: "1px solid #2a3240",
                borderRadius: 16,
                padding: "14px 18px",
                minWidth: 240,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>
                ACTIVE SEASON
              </div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>
                {seasonName || "—"}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 24,
          }}
        >
          {[
            { label: "DRIVERS", value: sortedDrivers.length },
            { label: "TEAMS", value: teams.length },
            { label: "TOTAL WINS", value: totalWins },
            { label: "TOTAL DNFS", value: totalDnfs },
            { label: "POINTS AWARDED", value: totalPoints },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "linear-gradient(135deg, #131922 0%, #0f141b 100%)",
                border: "1px solid #2d3643",
                borderRadius: 18,
                padding: 18,
                boxShadow: "0 10px 24px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {podiumCard(leader, 1)}
          {podiumCard(second, 2)}
          {podiumCard(third, 3)}
        </div>

        <div
          style={{
            background: "#151a22",
            border: "1px solid #2d3643",
            borderRadius: 22,
            padding: 18,
            marginBottom: 22,
            boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Driver Standings
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team Name</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>Top 10</th>
                  <th style={thStyle}>DNFs</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map((driver, index) => {
                  const isLeader = index === 0;
                  return (
                    <tr
                      key={driver.id}
                      style={{
                        background: isLeader
                          ? "rgba(212, 175, 55, 0.10)"
                          : "transparent",
                      }}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 900,
                          color: isLeader ? "#f3d36a" : "white",
                          fontSize: 16,
                        }}
                      >
                        {index + 1}
                      </td>
                      <td style={tdStyle}>{renderTeamBadge(driver.team, 38)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {driver.number}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>
                        {driver.name}
                      </td>
                      <td style={tdStyle}>{driver.team}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        {driver.points}
                      </td>
                      <td style={tdStyle}>{driver.wins}</td>
                      <td style={tdStyle}>{driver.top5}</td>
                      <td style={tdStyle}>{driver.top10}</td>
                      <td style={tdStyle}>{driver.dnfs || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            background: "#151a22",
            border: "1px solid #2d3643",
            borderRadius: 22,
            padding: 18,
            boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Team Standings
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>Logo</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>Top 10</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.team}>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{index + 1}</td>
                    <td style={tdStyle}>{renderTeamBadge(team.team, 42)}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{team.team}</td>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>
                      {team.points}
                    </td>
                    <td style={tdStyle}>{team.wins}</td>
                    <td style={tdStyle}>{team.top5}</td>
                    <td style={tdStyle}>{team.top10}</td>
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

function TickerOverlay({
  drivers,
  teams,
  raceHistory,
  preview = false,
  seasonName = "",
}) {
  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points);
  const latestRace = raceHistory?.[raceHistory.length - 1];
  const winner = latestRace?.results?.find((r) => r.finishPos === 1);

  const tickerText = [
    seasonName ? `Season: ${seasonName}` : "IRL Racing League",
    winner
      ? `Latest Winner: #${winner.number} ${winner.name} (${latestRace.raceName})`
      : "No race winner yet",
    ...sortedDrivers.map(
      (driver, index) =>
        `${index + 1}. #${driver.number} ${driver.name} - ${driver.points} pts`
    ),
    ...teams.map(
      (team, index) => `Team ${index + 1}: ${team.team} - ${team.points} pts`
    ),
  ].join("   •   ");

  return (
    <div
      style={{
        width: "100%",
        minHeight: preview ? "100vh" : "80px",
        background: preview ? "#111" : "transparent",
        display: "flex",
        alignItems: preview ? "center" : "flex-start",
        justifyContent: "center",
        paddingTop: preview ? 20 : 0,
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .ticker-bar {
          width: 100%;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.82);
          border-top: 2px solid #d4af37;
          border-bottom: 2px solid #d4af37;
          height: 80px;
          display: flex;
          align-items: center;
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
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
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
  // FIX #3: use lazy initializer so loadInitialLeagueState runs only once on mount
  const [seasons, setSeasons] = useState(
    () => loadInitialLeagueState().seasons
  );
  const [activeSeasonId, setActiveSeasonId] = useState(
    () => loadInitialLeagueState().activeSeasonId
  );
  const [isHydrated, setIsHydrated] = useState(false);

  const [viewMode, setViewMode] = useState("admin");
  const [editingRaceName, setEditingRaceName] = useState(null);

  const [newSeasonName, setNewSeasonName] = useState("");
  const [renameSeasonName, setRenameSeasonName] = useState("");

  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverNumber, setNewDriverNumber] = useState("");
  const [newDriverTeam, setNewDriverTeam] = useState("");

  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editDriverForm, setEditDriverForm] = useState({
    name: "",
    number: "",
    team: "",
  });

  const [startingPointsInputs, setStartingPointsInputs] = useState({});
  const [manualWinsInputs, setManualWinsInputs] = useState({});

  const importFileRef = useRef(null);
  const path = window.location.pathname.toLowerCase();

  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSupabase() {
      try {
        const savedState = await loadLeagueState();
        if (!isMounted) return;

        if (savedState?.seasons && Array.isArray(savedState.seasons)) {
          const cleanSeasons = savedState.seasons.map((season, index) =>
            sanitizeSeason(season, `Season ${index + 1}`)
          );

          if (cleanSeasons.length > 0) {
            setSeasons(cleanSeasons);
            const activeExists = cleanSeasons.some(
              (season) => season.id === savedState.activeSeasonId
            );
            setActiveSeasonId(
              activeExists ? savedState.activeSeasonId : cleanSeasons[0].id
            );
          }
        }
      } catch (error) {
        console.error("Supabase load failed:", error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    hydrateFromSupabase();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => {
      saveLeagueState({ seasons, activeSeasonId }).catch((error) => {
        console.error("Supabase save failed:", error);
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [seasons, activeSeasonId, isHydrated]);

  const activeSeason =
    seasons.find((season) => season.id === activeSeasonId) ||
    seasons[0] ||
    null;

  const drivers = activeSeason?.drivers || [];
  const selectedRace = activeSeason?.selectedRace || "";
  const positions = activeSeason?.positions || {};
  const stage1 = activeSeason?.stage1 || {};
  const stage2 = activeSeason?.stage2 || {};
  const stage3 = activeSeason?.stage3 || {};
  const dnfMap = activeSeason?.dnfMap || {};
  const penalties = activeSeason?.penalties || {};
  const raceHistory = activeSeason?.raceHistory || [];

  const selectedRaceData = races.find((race) => race.name === selectedRace);
  const stageCount = selectedRaceData ? selectedRaceData.stageCount : 2;

  const replaceActiveSeason = (nextSeason) => {
    setSeasons((prev) =>
      prev.map((season) => (season.id === activeSeasonId ? nextSeason : season))
    );
  };

  const patchActiveSeason = (patch) => {
    setSeasons((prev) =>
      prev.map((season) =>
        season.id === activeSeasonId ? { ...season, ...patch } : season
      )
    );
  };

  const clearInputs = () => {
    patchActiveSeason({
      selectedRace: "",
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      penalties: {},
    });
    setEditingRaceName(null);
  };

  const resetEditorStates = () => {
    setEditingRaceName(null);
    setEditingDriverId(null);
    setEditDriverForm({ name: "", number: "", team: "" });
  };

  const downloadBackupObject = (payload, filePrefix = "irl-racing-backup") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `${filePrefix}-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportBackup = () => {
    if (!activeSeason) return;
    downloadBackupObject(
      {
        app: "IRL Racing League",
        version: 2,
        exportedAt: new Date().toISOString(),
        type: "single-season-backup",
        season: activeSeason,
      },
      `irl-racing-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}`
    );
  };

  const exportAllSeasonsBackup = () => {
    downloadBackupObject(
      {
        app: "IRL Racing League",
        version: 2,
        exportedAt: new Date().toISOString(),
        type: "full-league-backup",
        activeSeasonId,
        seasons,
      },
      "irl-racing-all-seasons-backup"
    );
  };

  const createSeason = () => {
    const trimmedName = newSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }

    const nameExists = seasons.some(
      (season) => season.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) { alert("A season with that name already exists."); return; }

    const rosterOnly = drivers.map((driver) => ({
      id: driver.id,
      number: driver.number,
      name: driver.name,
      team: driver.team,
      startingPoints: Number(driver.startingPoints) || 0,
      manualWins: Number(driver.manualWins) || 0,
    }));

    const season = createEmptySeason(trimmedName, rosterOnly);
    setSeasons((prev) => [...prev, season]);
    setActiveSeasonId(season.id);
    setNewSeasonName("");
    setRenameSeasonName(trimmedName);
    resetEditorStates();
  };

  const renameActiveSeason = () => {
    if (!activeSeason) return;
    const trimmedName = renameSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }

    const duplicate = seasons.some(
      (season) =>
        season.id !== activeSeason.id &&
        season.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) { alert("Another season already has that name."); return; }

    patchActiveSeason({ name: trimmedName });
  };

  const switchSeason = (seasonId) => {
    setActiveSeasonId(seasonId);
    resetEditorStates();
  };

  const deleteActiveSeason = () => {
    if (!activeSeason) return;
    if (seasons.length <= 1) { alert("You must keep at least one season."); return; }

    const confirmed = window.confirm(
      `Delete season "${activeSeason.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    const remaining = seasons.filter((season) => season.id !== activeSeason.id);
    setSeasons(remaining);
    setActiveSeasonId(remaining[0].id);
    setRenameSeasonName(remaining[0].name);
    resetEditorStates();
  };

  useEffect(() => {
    if (activeSeason?.name) setRenameSeasonName(activeSeason.name);
  }, [activeSeasonId, activeSeason?.name]);

  // FIX #7: depend only on activeSeasonId, not the unstable drivers array reference
  useEffect(() => {
    const currentDrivers = activeSeason?.drivers || [];
    const nextInputs = {};
    currentDrivers.forEach((driver) => {
      nextInputs[driver.id] = String(Number(driver.startingPoints) || 0);
    });
    setStartingPointsInputs(nextInputs);
  }, [activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const currentDrivers = activeSeason?.drivers || [];
    const nextInputs = {};
    currentDrivers.forEach((driver) => {
      nextInputs[driver.id] = String(Number(driver.manualWins) || 0);
    });
    setManualWinsInputs(nextInputs);
  }, [activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);

        if (Array.isArray(parsed?.seasons)) {
          const confirmed = window.confirm(
            "Importing this backup will replace all current seasons. Continue?"
          );
          if (!confirmed) return;

          const cleanSeasons = parsed.seasons.map((season, index) =>
            sanitizeSeason(season, `Season ${index + 1}`)
          );
          if (cleanSeasons.length === 0) throw new Error("Backup contains no seasons.");

          const nextActiveSeasonId = cleanSeasons.some(
            (season) => season.id === parsed.activeSeasonId
          )
            ? parsed.activeSeasonId
            : cleanSeasons[0].id;

          setSeasons(cleanSeasons);
          setActiveSeasonId(nextActiveSeasonId);
          setRenameSeasonName(
            cleanSeasons.find((s) => s.id === nextActiveSeasonId)?.name ||
              cleanSeasons[0].name
          );
          resetEditorStates();
          alert("Full league backup imported.");
        } else if (parsed?.season) {
          const importedSeason = sanitizeSeason(parsed.season, "Imported Season");
          const confirmed = window.confirm(
            `Import season "${importedSeason.name}" into your league?`
          );
          if (!confirmed) return;

          setSeasons((prev) => {
            const exists = prev.some((s) => s.id === importedSeason.id);
            return exists
              ? prev.map((s) => (s.id === importedSeason.id ? importedSeason : s))
              : [...prev, importedSeason];
          });

          setActiveSeasonId(importedSeason.id);
          setRenameSeasonName(importedSeason.name);
          resetEditorStates();
          alert("Season backup imported.");
        } else {
          throw new Error("Invalid backup file.");
        }
      } catch (error) {
        console.error("Import failed:", error);
        alert("Could not import that backup file.");
      } finally {
        if (event.target) event.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const resetSeason = () => {
    if (!activeSeason) return;
    const confirmed = window.confirm(
      `Archive and reset "${activeSeason.name}"? A backup file will download first, then standings, race history, penalties, and stats will be cleared.`
    );
    if (!confirmed) return;

    downloadBackupObject(
      {
        app: "IRL Racing League",
        version: 2,
        archiveType: "season-reset-archive",
        archivedAt: new Date().toISOString(),
        season: activeSeason,
      },
      `irl-racing-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}-archive`
    );

    const resetDrivers = activeSeason.drivers.map((driver) => ({
      id: driver.id,
      number: driver.number,
      name: driver.name,
      team: driver.team,
      startingPoints: 0,
      manualWins: 0,
      points: 0,
      wins: 0,
      top5: 0,
      top10: 0,
      dnfs: 0,
    }));

    replaceActiveSeason({
      ...activeSeason,
      drivers: resetDrivers,
      raceHistory: [],
      selectedRace: "",
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      penalties: {},
    });
    resetEditorStates();
  };

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
      teams[driver.team].points += driver.points || 0;
      teams[driver.team].wins += driver.wins || 0;
      teams[driver.team].top5 += driver.top5 || 0;
      teams[driver.team].top10 += driver.top10 || 0;
      teams[driver.team].drivers += 1;
    }
    return Object.values(teams).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.top5 !== a.top5) return b.top5 - a.top5;
      return a.team.localeCompare(b.team);
    });
  }, [drivers]);

  const sortedDrivers = [...drivers].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.top5 !== a.top5) return b.top5 - a.top5;
    return a.name.localeCompare(b.name);
  });

  const currentLeader = sortedDrivers[0] || null;
  const totalDrivers = drivers.length;
  const totalRacesEntered = raceHistory.length;
  const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((r) => r.finishPos === 1) || null;

  const handleStartingPointsInputChange = (driverId, value) => {
    setStartingPointsInputs((prev) => ({ ...prev, [driverId]: value }));
  };

  const applyStartingPointsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((driver) => {
      const rawValue = startingPointsInputs[driver.id];
      const parsedValue = rawValue === "" || rawValue === undefined ? 0 : Number(rawValue);
      return {
        id: driver.id,
        number: driver.number,
        name: driver.name,
        team: driver.team,
        startingPoints: Number.isNaN(parsedValue) ? 0 : parsedValue,
        manualWins: Number(driver.manualWins) || 0,
      };
    });
    replaceActiveSeason({
      ...activeSeason,
      drivers: rebuildDriversFromHistory(raceHistory, updatedRoster),
    });
    alert("Season starting points updated.");
  };

  const clearStartingPointsAdjustments = () => {
    const cleared = {};
    drivers.forEach((driver) => { cleared[driver.id] = "0"; });
    setStartingPointsInputs(cleared);
  };

  const handleManualWinsInputChange = (driverId, value) => {
    setManualWinsInputs((prev) => ({ ...prev, [driverId]: value }));
  };

  const applyManualWinsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((driver) => {
      const rawValue = manualWinsInputs[driver.id];
      const parsedValue = rawValue === "" || rawValue === undefined ? 0 : Number(rawValue);
      return {
        id: driver.id,
        number: driver.number,
        name: driver.name,
        team: driver.team,
        startingPoints: Number(driver.startingPoints) || 0,
        manualWins: Number.isNaN(parsedValue) ? 0 : parsedValue,
      };
    });
    replaceActiveSeason({
      ...activeSeason,
      drivers: rebuildDriversFromHistory(raceHistory, updatedRoster),
    });
    alert("Manual wins updated.");
  };

  const clearManualWinsAdjustments = () => {
    const cleared = {};
    drivers.forEach((driver) => { cleared[driver.id] = "0"; });
    setManualWinsInputs(cleared);
  };

  const handlePositionChange = (driverId, value) =>
    patchActiveSeason({
      positions: { ...positions, [driverId]: value === "" ? "" : Number(value) },
    });

  const handleStage1Change = (driverId, value) =>
    patchActiveSeason({
      stage1: { ...stage1, [driverId]: value === "" ? "" : Number(value) },
    });

  const handleStage2Change = (driverId, value) =>
    patchActiveSeason({
      stage2: { ...stage2, [driverId]: value === "" ? "" : Number(value) },
    });

  const handleStage3Change = (driverId, value) =>
    patchActiveSeason({
      stage3: { ...stage3, [driverId]: value === "" ? "" : Number(value) },
    });

  const handleDnfChange = (driverId, checked) =>
    patchActiveSeason({ dnfMap: { ...dnfMap, [driverId]: checked } });

  const handlePenaltyPresetChange = (driverId, selectedLabel) => {
    const selectedPenalty = penaltyOptions.find((o) => o.label === selectedLabel);
    patchActiveSeason({
      penalties: {
        ...penalties,
        [driverId]: selectedPenalty || { label: "No Penalty", points: 0, reason: "" },
      },
    });
  };

  const addDriver = () => {
    const trimmedName = newDriverName.trim();
    const trimmedTeam = newDriverTeam.trim();
    const driverNumber = String(newDriverNumber).trim();

    if (!trimmedName || !trimmedTeam || !driverNumber) {
      alert("Please enter a driver name, number, and team.");
      return;
    }
    if (drivers.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("A driver with that name already exists.");
      return;
    }
    if (drivers.some((d) => String(d.number) === driverNumber)) {
      alert("A driver with that number already exists.");
      return;
    }

    const rosterDriver = {
      id: Date.now(),
      number: Number(driverNumber),
      name: trimmedName,
      team: trimmedTeam,
      startingPoints: 0,
      manualWins: 0,
    };

    const newRoster = [
      ...drivers.map((d) => ({
        id: d.id,
        number: d.number,
        name: d.name,
        team: d.team,
        startingPoints: Number(d.startingPoints) || 0,
        manualWins: Number(d.manualWins) || 0,
      })),
      rosterDriver,
    ];

    patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
    setNewDriverName("");
    setNewDriverNumber("");
    setNewDriverTeam("");
  };

  const openEditDriver = (driver) => {
    setEditingDriverId(driver.id);
    setEditDriverForm({ name: driver.name, number: driver.number, team: driver.team });
  };

  const cancelEditDriver = () => {
    setEditingDriverId(null);
    setEditDriverForm({ name: "", number: "", team: "" });
  };

  const saveDriverEdit = () => {
    if (!editingDriverId || !activeSeason) return;

    const trimmedName = editDriverForm.name.trim();
    const trimmedNumber = String(editDriverForm.number).trim();
    const trimmedTeam = editDriverForm.team.trim();

    if (!trimmedName || !trimmedNumber || !trimmedTeam) {
      alert("Please enter a driver name, number, and team.");
      return;
    }
    if (drivers.some((d) => d.id !== editingDriverId && d.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert("A driver with that name already exists.");
      return;
    }
    if (drivers.some((d) => d.id !== editingDriverId && String(d.number) === trimmedNumber)) {
      alert("A driver with that number already exists.");
      return;
    }

    const updatedRoster = drivers.map((driver) =>
      driver.id === editingDriverId
        ? {
            ...driver,
            name: trimmedName,
            number: Number(trimmedNumber),
            team: trimmedTeam,
            startingPoints: Number(driver.startingPoints) || 0,
            manualWins: Number(driver.manualWins) || 0,
          }
        : driver
    );

    const updatedHistory = raceHistory.map((race) => ({
      ...race,
      results: (race.results || []).map((result) =>
        result.driverId === editingDriverId
          ? { ...result, name: trimmedName, number: Number(trimmedNumber), team: trimmedTeam }
          : result
      ),
    }));

    const rosterOnly = updatedRoster.map((driver) => ({
      id: driver.id,
      number: driver.number,
      name: driver.name,
      team: driver.team,
      startingPoints: Number(driver.startingPoints) || 0,
      manualWins: Number(driver.manualWins) || 0,
    }));

    replaceActiveSeason({
      ...activeSeason,
      drivers: rebuildDriversFromHistory(updatedHistory, rosterOnly),
      raceHistory: updatedHistory,
    });
    cancelEditDriver();
  };

  const removeDriver = (driverId) => {
    if (!activeSeason) return;
    const driverToRemove = drivers.find((d) => d.id === driverId);
    if (!driverToRemove) return;

    const confirmed = window.confirm(
      `Remove ${driverToRemove.name}? This will also remove their results from race history.`
    );
    if (!confirmed) return;

    const newRoster = drivers
      .filter((d) => d.id !== driverId)
      .map((d) => ({
        id: d.id,
        number: d.number,
        name: d.name,
        team: d.team,
        startingPoints: Number(d.startingPoints) || 0,
        manualWins: Number(d.manualWins) || 0,
      }));

    const newHistory = raceHistory.map((race) => ({
      ...race,
      results: (race.results || []).filter((r) => r.driverId !== driverId),
    }));

    const nextPositions = { ...positions };
    const nextStage1 = { ...stage1 };
    const nextStage2 = { ...stage2 };
    const nextStage3 = { ...stage3 };
    const nextDnfMap = { ...dnfMap };
    const nextPenalties = { ...penalties };

    delete nextPositions[driverId];
    delete nextStage1[driverId];
    delete nextStage2[driverId];
    delete nextStage3[driverId];
    delete nextDnfMap[driverId];
    delete nextPenalties[driverId];

    replaceActiveSeason({
      ...activeSeason,
      drivers: rebuildDriversFromHistory(newHistory, newRoster),
      raceHistory: newHistory,
      positions: nextPositions,
      stage1: nextStage1,
      stage2: nextStage2,
      stage3: nextStage3,
      dnfMap: nextDnfMap,
      penalties: nextPenalties,
    });

    if (editingDriverId === driverId) cancelEditDriver();
  };

  const submitResults = () => {
    if (!activeSeason) return;
    if (!selectedRace.trim()) { alert("Please select a race."); return; }

    // FIX #2: corrected duplicate race check logic
    const raceAlreadyExists = raceHistory.some(
      (race) => race.raceName === selectedRace && editingRaceName !== selectedRace
    );
    if (raceAlreadyExists) { alert("That race has already been entered."); return; }

    const raceResults = drivers
      .map((driver) => {
        const finishPos = positions[driver.id];
        const stage1Pos = stage1[driver.id];
        const stage2Pos = stage2[driver.id];
        const stage3Pos = stage3[driver.id];
        const dnf = !!dnfMap[driver.id];

        const finishPoints =
          finishPos && finishPos >= 1 && finishPos <= pointsTable.length
            ? pointsTable[finishPos - 1]
            : 0;

        const stage1Points = getStagePoints(stage1Pos);
        const stage2Points = getStagePoints(stage2Pos);
        const stage3Points = stageCount === 3 ? getStagePoints(stage3Pos) : 0;

        const selectedPenalty = penalties[driver.id] || {
          label: "No Penalty",
          points: 0,
          reason: "",
        };
        const penaltyPoints = selectedPenalty.points || 0;
        const penaltyReason = selectedPenalty.reason || "";

        const totalRacePoints =
          finishPoints + stage1Points + stage2Points + stage3Points - penaltyPoints;

        const isWin = finishPos === 1;
        const isTop5 = finishPos >= 1 && finishPos <= 5;
        const isTop10 = finishPos >= 1 && finishPos <= 10;

        return {
          driverId: driver.id,
          name: driver.name,
          number: driver.number,
          team: driver.team,
          finishPos: finishPos || null,
          stage1Pos: stage1Pos || null,
          stage2Pos: stage2Pos || null,
          stage3Pos: stageCount === 3 ? stage3Pos || null : null,
          finishPoints,
          stage1Points,
          stage2Points,
          stage3Points,
          penaltyPoints,
          penaltyReason,
          totalRacePoints,
          isWin,
          isTop5,
          isTop10,
          dnf,
        };
      })
      .sort((a, b) => {
        if (a.finishPos === null) return 1;
        if (b.finishPos === null) return -1;
        return a.finishPos - b.finishPos;
      });

    const updatedRace = { raceName: selectedRace, stageCount, results: raceResults };

    const newHistory = editingRaceName
      ? raceHistory.map((race) =>
          race.raceName === editingRaceName ? updatedRace : race
        )
      : [...raceHistory, updatedRace];

    const rosterOnly = drivers.map((driver) => ({
      id: driver.id,
      number: driver.number,
      name: driver.name,
      team: driver.team,
      startingPoints: Number(driver.startingPoints) || 0,
      manualWins: Number(driver.manualWins) || 0,
    }));

    replaceActiveSeason({
      ...activeSeason,
      raceHistory: newHistory,
      drivers: rebuildDriversFromHistory(newHistory, rosterOnly),
      selectedRace: "",
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      penalties: {},
    });
    setEditingRaceName(null);
  };

  const handleEditRace = (race) => {
    const newPositions = {};
    const newStage1 = {};
    const newStage2 = {};
    const newStage3 = {};
    const newDnfMap = {};
    const newPenalties = {};

    race.results.forEach((result) => {
      newPositions[result.driverId] = result.finishPos || "";
      newStage1[result.driverId] = result.stage1Pos || "";
      newStage2[result.driverId] = result.stage2Pos || "";
      newStage3[result.driverId] = result.stage3Pos || "";
      newDnfMap[result.driverId] = !!result.dnf;

      if (result.penaltyPoints && result.penaltyPoints > 0) {
        const matchingPenalty =
          penaltyOptions.find((o) => o.points === result.penaltyPoints) || {
            label: "Custom Penalty",
            points: result.penaltyPoints,
            reason: result.penaltyReason || "",
          };
        newPenalties[result.driverId] = matchingPenalty;
      }
    });

    patchActiveSeason({
      selectedRace: race.raceName,
      positions: newPositions,
      stage1: newStage1,
      stage2: newStage2,
      stage3: newStage3,
      dnfMap: newDnfMap,
      penalties: newPenalties,
    });
    setEditingRaceName(race.raceName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRace = (raceName) => {
    if (!activeSeason) return;
    const confirmed = window.confirm(
      `Delete ${raceName}? This will recalculate the standings.`
    );
    if (!confirmed) return;

    const newHistory = raceHistory.filter((race) => race.raceName !== raceName);
    const rosterOnly = drivers.map((driver) => ({
      id: driver.id,
      number: driver.number,
      name: driver.name,
      team: driver.team,
      startingPoints: Number(driver.startingPoints) || 0,
      manualWins: Number(driver.manualWins) || 0,
    }));

    replaceActiveSeason({
      ...activeSeason,
      raceHistory: newHistory,
      drivers: rebuildDriversFromHistory(newHistory, rosterOnly),
    });

    if (editingRaceName === raceName) clearInputs();
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

  // FIX #8: show loading until Supabase hydration completes
  if (!isHydrated) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>Loading league data...</div>
        </div>
      </div>
    );
  }

  // FIX #1: route guards appear exactly once, before the admin return
  if (path === "/overlay/drivers" || viewMode === "overlay-drivers") {
    return (
      <LeaderboardOverlay
        drivers={drivers}
        preview={viewMode === "overlay-drivers"}
        seasonName={activeSeason?.name || ""}
      />
    );
  }

  if (path === "/overlay/teams" || viewMode === "overlay-teams") {
    return (
      <TeamOverlay
        teams={teamStandings}
        preview={viewMode === "overlay-teams"}
        seasonName={activeSeason?.name || ""}
      />
    );
  }

  if (path === "/standings") {
    return (
      <PublicStandings
        drivers={drivers}
        teams={teamStandings}
        seasonName={activeSeason?.name || ""}
      />
    );
  }

  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") {
    return (
      <TickerOverlay
        drivers={drivers}
        teams={teamStandings}
        raceHistory={raceHistory}
        preview={viewMode === "overlay-ticker"}
        seasonName={activeSeason?.name || ""}
      />
    );
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>

        {/* Header */}
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 54 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>
                  IRL Racing League
                </div>
                <div style={{ opacity: 0.72 }}>Admin Dashboard</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["admin", "overlay-drivers", "overlay-teams", "overlay-ticker"].map(
                (mode) => (
                  <button
                    key={mode}
                    style={viewMode === mode ? activeHeaderButtonStyle : headerButtonStyle}
                    onClick={() => setViewMode(mode)}
                  >
                    {mode === "admin"
                      ? "Admin"
                      : mode === "overlay-drivers"
                      ? "Driver Overlay"
                      : mode === "overlay-teams"
                      ? "Team Overlay"
                      : "Ticker Overlay"}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Season Manager */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Manager</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Active Season</div>
              <select
                style={inputStyle}
                value={activeSeasonId}
                onChange={(e) => switchSeason(e.target.value)}
              >
                {seasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Create New Season</div>
              <input
                style={inputStyle}
                value={newSeasonName}
                onChange={(e) => setNewSeasonName(e.target.value)}
                placeholder="Example: 2026 Regular Season"
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Rename Active Season</div>
              <input
                style={inputStyle}
                value={renameSeasonName}
                onChange={(e) => setRenameSeasonName(e.target.value)}
                placeholder="Rename current season"
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={createSeason} style={primaryButtonStyle}>Create Season</button>
            <button onClick={renameActiveSeason} style={secondaryButtonStyle}>Save Season Name</button>
            <button onClick={deleteActiveSeason} style={dangerButtonStyle}>Delete Active Season</button>
          </div>
        </div>

        {/* Stat Boxes */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          {[
            { label: "ACTIVE SEASON", value: activeSeason?.name || "—" },
            {
              label: "CURRENT LEADER",
              value: currentLeader ? `#${currentLeader.number} ${currentLeader.name}` : "—",
            },
            { label: "TOTAL DRIVERS", value: totalDrivers },
            { label: "RACES ENTERED", value: totalRacesEntered },
            {
              label: "LATEST WINNER",
              value: latestWinner ? `#${latestWinner.number} ${latestWinner.name}` : "—",
            },
          ].map((stat) => (
            <div key={stat.label} style={statBoxStyle}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Backup & Restore */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Backup & Restore</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>
            Export the active season, export all seasons, import a backup, or archive and reset the active season.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={exportBackup} style={primaryButtonStyle}>Export Active Season</button>
            <button onClick={exportAllSeasonsBackup} style={secondaryButtonStyle}>Export All Seasons</button>
            <button onClick={() => importFileRef.current?.click()} style={secondaryButtonStyle}>
              Import Backup
            </button>
            <input
              ref={importFileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportBackup}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Season Starting Points */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Starting Points</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>
            Use this if you are starting the app mid-season. Enter each driver&apos;s current
            total points before the next race. Future race entries will add on top of these values automatically.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={applyStartingPointsAdjustments} style={primaryButtonStyle}>
              Save Starting Points
            </button>
            <button onClick={clearStartingPointsAdjustments} style={secondaryButtonStyle}>
              Clear to Zero
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Starting Points</th>
                  <th style={thStyle}>Current Total</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tdStyle}>{driver.number}</td>
                    <td style={tdStyle}>{driver.name}</td>
                    <td style={tdStyle}>{driver.team}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        style={inputStyle}
                        value={startingPointsInputs[driver.id] ?? "0"}
                        onChange={(e) =>
                          handleStartingPointsInputChange(driver.id, e.target.value)
                        }
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{driver.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manual Wins */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Manual Wins Adjustment</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>
            Use this if you are starting the app mid-season and need to enter each
            driver&apos;s current win total before the next race.
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={applyManualWinsAdjustments} style={primaryButtonStyle}>
              Save Manual Wins
            </button>
            <button onClick={clearManualWinsAdjustments} style={secondaryButtonStyle}>
              Clear Wins to Zero
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Manual Wins</th>
                  <th style={thStyle}>Current Total Wins</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tdStyle}>{driver.number}</td>
                    <td style={tdStyle}>{driver.name}</td>
                    <td style={tdStyle}>{driver.team}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        style={inputStyle}
                        value={manualWinsInputs[driver.id] ?? "0"}
                        onChange={(e) =>
                          handleManualWinsInputChange(driver.id, e.target.value)
                        }
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{driver.wins}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Driver Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Management</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div>
              <input
                style={inputStyle}
                value={newDriverName}
                onChange={(e) => setNewDriverName(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div>
              <input
                style={inputStyle}
                value={newDriverNumber}
                onChange={(e) => setNewDriverNumber(e.target.value)}
                placeholder="Enter car number"
                type="number"
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Team</div>
              <input
                style={inputStyle}
                value={newDriverTeam}
                onChange={(e) => setNewDriverTeam(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <button onClick={addDriver} style={primaryButtonStyle}>Add Driver</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tdStyle}>{driver.number}</td>
                    <td style={tdStyle}>{driver.name}</td>
                    <td style={tdStyle}>{driver.team}</td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => openEditDriver(driver)} style={secondaryButtonStyle}>
                          Edit
                        </button>
                        <button onClick={() => removeDriver(driver.id)} style={dangerButtonStyle}>
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editingDriverId && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #313947" }}>
              <h3 style={{ marginTop: 0 }}>Edit Driver</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div>
                  <input
                    style={inputStyle}
                    value={editDriverForm.name}
                    onChange={(e) =>
                      setEditDriverForm({ ...editDriverForm, name: e.target.value })
                    }
                    placeholder="Driver name"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div>
                  <input
                    style={inputStyle}
                    value={editDriverForm.number}
                    onChange={(e) =>
                      setEditDriverForm({ ...editDriverForm, number: e.target.value })
                    }
                    placeholder="Car number"
                    type="number"
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 6, fontWeight: 700 }}>Team</div>
                  <input
                    style={inputStyle}
                    value={editDriverForm.team}
                    onChange={(e) =>
                      setEditDriverForm({ ...editDriverForm, team: e.target.value })
                    }
                    placeholder="Team name"
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={saveDriverEdit} style={primaryButtonStyle}>Save Changes</button>
                <button onClick={cancelEditDriver} style={secondaryButtonStyle}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Enter Race Results */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>
            {editingRaceName ? `Edit Race: ${editingRaceName}` : "Enter Race Results"}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race</label>
              <select
                style={inputStyle}
                value={selectedRace}
                onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}
              >
                <option value="">Select a race</option>
                {races.map((race) => (
                  <option key={race.name} value={race.name}>
                    {race.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>
                Stage Setup
              </label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", minHeight: 42 }}>
                {selectedRace
                  ? `${stageCount} scoring stages`
                  : "Select a race to view stage count"}
              </div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Finish</th>
                  <th style={thStyle}>Stage 1</th>
                  <th style={thStyle}>Stage 2</th>
                  {stageCount === 3 && <th style={thStyle}>Stage 3</th>}
                  <th style={thStyle}>DNF</th>
                  <th style={thStyle}>Penalty</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td style={tdStyle}>{driver.number}</td>
                    <td style={tdStyle}>{driver.name}</td>
                    <td style={tdStyle}>{driver.team}</td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="1"
                        max="40"
                        style={inputStyle}
                        value={positions[driver.id] || ""}
                        onChange={(e) => handlePositionChange(driver.id, e.target.value)}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        style={inputStyle}
                        value={stage1[driver.id] || ""}
                        onChange={(e) => handleStage1Change(driver.id, e.target.value)}
                      />
                    </td>
                    <td style={tdStyle}>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        style={inputStyle}
                        value={stage2[driver.id] || ""}
                        onChange={(e) => handleStage2Change(driver.id, e.target.value)}
                      />
                    </td>
                    {stageCount === 3 && (
                      <td style={tdStyle}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          style={inputStyle}
                          value={stage3[driver.id] || ""}
                          onChange={(e) => handleStage3Change(driver.id, e.target.value)}
                        />
                      </td>
                    )}
                    <td style={tdStyle}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input
                          type="checkbox"
                          checked={!!dnfMap[driver.id]}
                          onChange={(e) => handleDnfChange(driver.id, e.target.checked)}
                        />
                        DNF
                      </label>
                    </td>
                    <td style={tdStyle}>
                      <select
                        style={inputStyle}
                        value={penalties[driver.id]?.label || "No Penalty"}
                        onChange={(e) =>
                          handlePenaltyPresetChange(driver.id, e.target.value)
                        }
                      >
                        {penaltyOptions.map((option) => (
                          <option key={option.label} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button onClick={submitResults} style={primaryButtonStyle}>
              {editingRaceName ? "Update Race" : "Submit Results"}
            </button>
            {editingRaceName && (
              <button onClick={clearInputs} style={secondaryButtonStyle}>
                Cancel Edit
              </button>
            )}
            <button onClick={clearInputs} style={secondaryButtonStyle}>
              Clear Inputs
            </button>
            <button onClick={resetSeason} style={dangerButtonStyle}>
              Archive + Reset Active Season
            </button>
          </div>
        </div>

        {/* Driver Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>Top 10</th>
                  <th style={thStyle}>DNFs</th>
                </tr>
              </thead>
              <tbody>
                {sortedDrivers.map((driver, index) => (
                  <tr key={driver.id}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>{driver.number}</td>
                    <td style={tdStyle}>{driver.name}</td>
                    <td style={tdStyle}>{driver.team}</td>
                    <td style={tdStyle}>{driver.points}</td>
                    <td style={tdStyle}>{driver.wins}</td>
                    <td style={tdStyle}>{driver.top5}</td>
                    <td style={tdStyle}>{driver.top10}</td>
                    <td style={tdStyle}>{driver.dnfs || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Team Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Pos</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>Top 10</th>
                  <th style={thStyle}>Drivers</th>
                </tr>
              </thead>
              <tbody>
                {teamStandings.map((team, index) => (
                  <tr key={team.team}>
                    <td style={tdStyle}>{index + 1}</td>
                    <td style={tdStyle}>{team.team}</td>
                    <td style={tdStyle}>{team.points}</td>
                    <td style={tdStyle}>{team.wins}</td>
                    <td style={tdStyle}>{team.top5}</td>
                    <td style={tdStyle}>{team.top10}</td>
                    <td style={tdStyle}>{team.drivers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Race History */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Race History</h2>
          {raceHistory.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No races entered yet.</div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {raceHistory.map((race) => {
                const winner = race.results?.find((r) => r.finishPos === 1);
                return (
                  <div
                    key={race.raceName}
                    style={{
                      background: "#10141b",
                      border: "1px solid #2b3441",
                      borderRadius: 14,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{race.raceName}</div>
                        <div style={{ opacity: 0.75 }}>
                          {race.stageCount} scoring stages
                          {winner ? ` • Winner: #${winner.number} ${winner.name}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => handleEditRace(race)} style={secondaryButtonStyle}>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRace(race.raceName)}
                          style={dangerButtonStyle}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Finish</th>
                            <th style={thStyle}>#</th>
                            <th style={thStyle}>Driver</th>
                            <th style={thStyle}>Team</th>
                            <th style={thStyle}>Race Pts</th>
                            <th style={thStyle}>Stage 1</th>
                            <th style={thStyle}>Stage 2</th>
                            {race.stageCount === 3 && <th style={thStyle}>Stage 3</th>}
                            <th style={thStyle}>DNF</th>
                            <th style={thStyle}>Penalty</th>
                            <th style={thStyle}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.results.map((result) => (
                            <tr key={result.driverId}>
                              <td style={tdStyle}>{result.finishPos ?? "—"}</td>
                              <td style={tdStyle}>{result.number}</td>
                              <td style={tdStyle}>{result.name}</td>
                              <td style={tdStyle}>{result.team}</td>
                              <td style={tdStyle}>{result.finishPoints}</td>
                              <td style={tdStyle}>{result.stage1Points}</td>
                              <td style={tdStyle}>{result.stage2Points}</td>
                              {race.stageCount === 3 && (
                                <td style={tdStyle}>{result.stage3Points}</td>
                              )}
                              <td style={tdStyle}>{result.dnf ? "DNF" : "—"}</td>
                              <td style={tdStyle}>
                                {result.penaltyPoints > 0 ? `-${result.penaltyPoints}` : "0"}
                              </td>
                              <td style={tdStyle}>{result.totalRacePoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Penalty Log */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Penalty Log</h2>
          {totalPenaltyLog.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No penalties logged yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Race</th>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Penalty</th>
                    <th style={thStyle}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {totalPenaltyLog.map((entry, index) => (
                    <tr key={`${entry.raceName}-${entry.number}-${index}`}>
                      <td style={tdStyle}>{entry.raceName}</td>
                      <td style={tdStyle}>{entry.number}</td>
                      <td style={tdStyle}>{entry.name}</td>
                      <td style={tdStyle}>-{entry.penaltyPoints}</td>
                      <td style={tdStyle}>{entry.penaltyReason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
