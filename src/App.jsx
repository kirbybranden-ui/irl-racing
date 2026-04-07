import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import teamLogoPMS from "./assets/teams/PMS.png";
import teamLogoBNR from "./assets/teams/BNR.png";

const teamLogos = {
  JAM: teamLogoJAM,
  PMS: teamLogoPMS,
  BNR: teamLogoBNR,
};
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

// Winston Cup points system
const pointsTable = [
  175, 170, 165, 160, 155, 150, 146, 142, 138, 134,
  130, 127, 124, 121, 118, 115, 112, 109, 106, 103,
  100, 97, 94, 91, 88, 85, 82, 79, 76, 73,
  70, 67, 64, 61, 58, 55, 52, 49, 46, 43,
];

const stagePointsTable = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

// Offense penalty points: 1st=-5, 2nd=-10, 3rd=-15, 4th+=-25
const offensePenaltyPoints = [5, 10, 15, 25];

function getOffensePenaltyPoints(offenseNumber) {
  if (offenseNumber <= 0) return 0;
  const idx = Math.min(offenseNumber, offensePenaltyPoints.length) - 1;
  return offensePenaltyPoints[idx];
}

function countPriorOffenses(raceHistory, driverId, excludeRaceName = null) {
  let count = 0;
  raceHistory.forEach((race) => {
    if (excludeRaceName && race.raceName === excludeRaceName) return;
    const result = race.results?.find((r) => r.driverId === driverId);
    if (result?.offense) count += 1;
  });
  return count;
}

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1400, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const headerButtonStyle = { background: "#222936", color: "white", border: "1px solid #3a4453", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const activeHeaderButtonStyle = { ...headerButtonStyle, background: "#d4af37", color: "#111", border: "1px solid #d4af37" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 220px" };

const teamBranding = {
  "Team A": { logo: "A", accent: "#d4af37", dark: "#1b1b1b" },
  "Team B": { logo: "B", accent: "#3b82f6", dark: "#111827" },
  "Team C": { logo: "C", accent: "#ef4444", dark: "#1f1315" },
  "Team D": { logo: "D", accent: "#22c55e", dark: "#0f1b14" },
};

function getTeamBranding(teamName) {
  return teamBranding[teamName] || { logo: teamName?.charAt(0)?.toUpperCase() || "?", accent: "#d4af37", dark: "#161a20" };
}

function renderTeamBadge(teamName, size = 44) {
  const brand = getTeamBranding(teamName);
  const logoSrc = teamLogos[teamName];
  if (logoSrc) {
    return (
      <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", background: "#111" }}>
        <img src={logoSrc} alt={teamName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", background: `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", fontSize: size * 0.38 }}>
      {brand.logo}
    </div>
  );
}

function makeDriverWithStats(driver) {
  return { ...driver, startingPoints: Number(driver.startingPoints) || 0, manualWins: Number(driver.manualWins) || 0, points: Number(driver.startingPoints) || 0, wins: Number(driver.manualWins) || 0, top3: 0, top5: 0, dnfs: 0, retired: driver.retired || false };
}

function getDefaultRoster() { return defaultDrivers.map(makeDriverWithStats); }

function getStagePoints(stageFinish) {
  if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
  return stagePointsTable[stageFinish - 1];
}

function rebuildDriversFromHistory(history, driverRoster) {
  return driverRoster.map((baseDriver) => {
    let points = Number(baseDriver.startingPoints) || 0;
    let wins = Number(baseDriver.manualWins) || 0;
    let top3 = 0, top5 = 0, dnfs = 0, fastestLaps = 0, totalPenalties = 0;
    history.forEach((race) => {
      const result = race.results?.find((r) => r.driverId === baseDriver.id);
      if (!result) return;
      points += result.totalRacePoints || 0;
      wins += result.isWin ? 1 : 0;
      top3 += result.isTop3 ? 1 : 0;
      top5 += result.isTop5 ? 1 : 0;
      dnfs += result.dnf ? 1 : 0;
      fastestLaps += result.fastestLap ? 1 : 0;
      totalPenalties += result.penaltyPoints || 0;
    });
    return { ...baseDriver, startingPoints: Number(baseDriver.startingPoints) || 0, manualWins: Number(baseDriver.manualWins) || 0, points, wins, top3, top5, dnfs, fastestLaps, totalPenalties, retired: baseDriver.retired || false };
  });
}

function makeSeasonId() { return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function createEmptySeason(name, roster = getDefaultRoster()) {
  const cleanRoster = roster.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
  return { id: makeSeasonId(), name: name || "New Season", createdAt: new Date().toISOString(), drivers: rebuildDriversFromHistory([], cleanRoster), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {}, raceHistory: [] };
}

function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource = Array.isArray(season?.drivers) && season.drivers.length > 0 ? season.drivers : getDefaultRoster();
  const rosterOnly = rosterSource.map((d) => ({ id: d.id, number: Number(d.number), name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
  const history = Array.isArray(season?.raceHistory) ? season.raceHistory : [];
  return {
    id: season?.id || makeSeasonId(), name: season?.name || fallbackName, createdAt: season?.createdAt || new Date().toISOString(),
    drivers: rebuildDriversFromHistory(history, rosterOnly), selectedRace: season?.selectedRace || "",
    positions: season?.positions || {}, stage1: season?.stage1 || {}, stage2: season?.stage2 || {}, stage3: season?.stage3 || {},
    dnfMap: season?.dnfMap || {}, offenseMap: season?.offenseMap || {}, fastestLapMap: season?.fastestLapMap || {}, raceHistory: history,
  };
}

function buildLegacySeasonFromLocalStorage() {
  const keys = ["irl-drivers","irl-raceHistory","irl-selectedRace","irl-positions","irl-stage1","irl-stage2","irl-stage3","irl-dnfMap"];
  const hasLegacy = keys.some((k) => localStorage.getItem(k));
  if (!hasLegacy) return createEmptySeason("Season 1");
  try {
    const drivers = JSON.parse(localStorage.getItem("irl-drivers") || "null") || getDefaultRoster();
    const raceHistory = JSON.parse(localStorage.getItem("irl-raceHistory") || "null") || [];
    const selectedRace = localStorage.getItem("irl-selectedRace") || "";
    const positions = JSON.parse(localStorage.getItem("irl-positions") || "null") || {};
    const stage1 = JSON.parse(localStorage.getItem("irl-stage1") || "null") || {};
    const stage2 = JSON.parse(localStorage.getItem("irl-stage2") || "null") || {};
    const stage3 = JSON.parse(localStorage.getItem("irl-stage3") || "null") || {};
    const dnfMap = JSON.parse(localStorage.getItem("irl-dnfMap") || "null") || {};
    return sanitizeSeason({ id: makeSeasonId(), name: "Season 1", createdAt: new Date().toISOString(), drivers, raceHistory, selectedRace, positions, stage1, stage2, stage3, dnfMap, offenseMap: {}, fastestLapMap: {} });
  } catch { return createEmptySeason("Season 1"); }
}

function loadInitialLeagueState() {
  try {
    const savedSeasons = localStorage.getItem("irl-seasons");
    const savedActiveSeasonId = localStorage.getItem("irl-activeSeasonId");
    if (savedSeasons) {
      const parsed = JSON.parse(savedSeasons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanSeasons = parsed.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
        const activeExists = cleanSeasons.some((s) => s.id === savedActiveSeasonId);
        return { seasons: cleanSeasons, activeSeasonId: activeExists ? savedActiveSeasonId : cleanSeasons[0].id };
      }
    }
  } catch { /* fall through */ }
  const legacySeason = buildLegacySeasonFromLocalStorage();
  return { seasons: [legacySeason], activeSeasonId: legacySeason.id };
}

function LeaderboardOverlay({ drivers, preview = false, seasonName = "" }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  return (
    <div style={{ minHeight: "100vh", background: preview ? "#111" : "transparent", color: "white", padding: 20, boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1000, background: "rgba(10,10,10,0.84)", border: "2px solid #d4af37", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#0f1218", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 28, fontWeight: 800 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={logo} alt="League Logo" style={{ height: 42 }} />Driver Standings</div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>
        <table style={tableStyle}><thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
          <tbody>{sorted.map((d, i) => <tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function TeamOverlay({ teams, preview = false, seasonName = "" }) {
  return (
    <div style={{ minHeight: "100vh", background: preview ? "#111" : "transparent", color: "white", padding: 20, boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 900, background: "rgba(10,10,10,0.84)", border: "2px solid #d4af37", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#0f1218", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 28, fontWeight: 800 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={logo} alt="League Logo" style={{ height: 42 }} />Team Standings</div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>
        <table style={tableStyle}><thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
          <tbody>{teams.map((t, i) => <tr key={t.team}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{t.team}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function PublicStandings({ drivers, teams, seasonName = "" }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const [leader, second, third] = sorted;
  const totalPoints = sorted.reduce((s, d) => s + (d.points || 0), 0);
  const totalWins = sorted.reduce((s, d) => s + (d.wins || 0), 0);
  const totalDnfs = sorted.reduce((s, d) => s + (d.dnfs || 0), 0);

  const podiumCard = (driver, place) => {
    if (!driver) return null;
    const brand = getTeamBranding(driver.team);
    const isLeader = place === 1;
    return (
      <div style={{ flex: "1 1 280px", background: isLeader ? `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)` : "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", color: "white", border: isLeader ? `1px solid ${brand.accent}` : "1px solid #313947", borderRadius: 22, padding: 22, boxShadow: "0 12px 28px rgba(0,0,0,0.28)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -24, right: -24, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, opacity: 0.85, marginBottom: 6 }}>{isLeader ? "POINTS LEADER" : `P${place}`}</div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>#{driver.number}</div>
          </div>
          {renderTeamBadge(driver.team, 54)}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{driver.name}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 18 }}>{driver.team}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
          {[{label:"POINTS",value:driver.points},{label:"WINS",value:driver.wins},{label:"TOP 3",value:driver.top3},{label:"TOP 5",value:driver.top5}].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: 24 }}>
        <div style={{ background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", border: "1px solid #313947", borderRadius: 24, padding: 26, marginBottom: 22, boxShadow: "0 14px 34px rgba(0,0,0,0.28)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img src={logo} alt="League Logo" style={{ height: 64, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.35))" }} />
              <div>
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 0.6, lineHeight: 1.05 }}>PERFORMANCE CUP LEAGUE</div>
                <div style={{ fontSize: 16, opacity: 0.76, marginTop: 6 }}>Broadcast Standings</div>
              </div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 16, padding: "14px 18px", minWidth: 240 }}>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>ACTIVE SEASON</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{seasonName || "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[{label:"DRIVERS",value:sorted.length},{label:"TEAMS",value:teams.length},{label:"TOTAL WINS",value:totalWins},{label:"TOTAL DNFS",value:totalDnfs},{label:"POINTS AWARDED",value:totalPoints}].map((item) => (
            <div key={item.label} style={{ background: "linear-gradient(135deg, #131922 0%, #0f141b 100%)", border: "1px solid #2d3643", borderRadius: 18, padding: 18, boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          {podiumCard(leader, 1)}{podiumCard(second, 2)}{podiumCard(third, 3)}
        </div>

        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Driver Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team Name</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th><th style={thStyle}>FL</th><th style={thStyle}>Penalties</th></tr></thead>
              <tbody>
                {sorted.map((driver, index) => {
                  const isLeader = index === 0;
                  return (
                    <tr key={driver.id} style={{ background: isLeader ? "rgba(212,175,55,0.10)" : "transparent" }}>
                      <td style={{ ...tdStyle, fontWeight: 900, color: isLeader ? "#f3d36a" : "white", fontSize: 16 }}>{index + 1}</td>
                      <td style={tdStyle}>{renderTeamBadge(driver.team, 38)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{driver.number}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{driver.name}{driver.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td>
                      <td style={tdStyle}>{driver.team}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{driver.points}</td>
                      <td style={tdStyle}>{driver.wins}</td>
                      <td style={tdStyle}>{driver.top3}</td>
                      <td style={tdStyle}>{driver.top5}</td>
                      <td style={tdStyle}>{driver.dnfs || 0}</td>
                      <td style={tdStyle}>{driver.fastestLaps || 0}</td>
                      <td style={{ ...tdStyle, color: (driver.totalPenalties || 0) > 0 ? "#f87171" : "inherit" }}>{driver.totalPenalties ? `-${driver.totalPenalties}` : "0"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Team Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Logo</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.team}>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{index + 1}</td>
                    <td style={tdStyle}>{renderTeamBadge(team.team, 42)}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{team.team}</td>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{team.points}</td>
                    <td style={tdStyle}>{team.wins}</td>
                    <td style={tdStyle}>{team.top3}</td>
                    <td style={tdStyle}>{team.top5}</td>
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

function TickerOverlay({ drivers, teams, raceHistory, preview = false, seasonName = "" }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points);
  const latestRace = raceHistory?.[raceHistory.length - 1];
  const winner = latestRace?.results?.find((r) => r.finishPos === 1);
  const tickerText = [
    seasonName ? `Season: ${seasonName}` : "Performance Cup League",
    winner ? `Latest Winner: #${winner.number} ${winner.name} (${latestRace.raceName})` : "No race winner yet",
    ...sorted.map((d, i) => `${i+1}. #${d.number} ${d.name} - ${d.points} pts`),
    ...teams.map((t, i) => `Team ${i+1}: ${t.team} - ${t.points} pts`),
  ].join("   •   ");

  return (
    <div style={{ width: "100%", minHeight: preview ? "100vh" : "80px", background: preview ? "#111" : "transparent", display: "flex", alignItems: preview ? "center" : "flex-start", justifyContent: "center", paddingTop: preview ? 20 : 0, boxSizing: "border-box" }}>
      <style>{`.ticker-bar{width:100%;overflow:hidden;background:rgba(0,0,0,0.82);border-top:2px solid #d4af37;border-bottom:2px solid #d4af37;height:80px;display:flex;align-items:center}.ticker-track{display:inline-flex;align-items:center;white-space:nowrap;min-width:max-content;animation:tickerScroll 45s linear infinite}.ticker-logo{height:30px;width:auto;margin-right:28px;vertical-align:middle}.ticker-text{display:inline-block;padding-right:120px;font-size:28px;font-weight:700;color:white}@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
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
  const [seasons, setSeasons] = useState(() => loadInitialLeagueState().seasons);
  const [activeSeasonId, setActiveSeasonId] = useState(() => loadInitialLeagueState().activeSeasonId);
  const [isHydrated, setIsHydrated] = useState(false);
  const [viewMode, setViewMode] = useState("admin");
  const [editingRaceName, setEditingRaceName] = useState(null);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [renameSeasonName, setRenameSeasonName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverNumber, setNewDriverNumber] = useState("");
  const [newDriverTeam, setNewDriverTeam] = useState("");
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editDriverForm, setEditDriverForm] = useState({ name: "", number: "", team: "" });
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
          const cleanSeasons = savedState.seasons.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
          if (cleanSeasons.length > 0) {
            setSeasons(cleanSeasons);
            const activeExists = cleanSeasons.some((s) => s.id === savedState.activeSeasonId);
            setActiveSeasonId(activeExists ? savedState.activeSeasonId : cleanSeasons[0].id);
          }
        }
      } catch (error) {
        console.error("Supabase load failed:", error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }
    hydrateFromSupabase();
    let interval = null;
    if (path === "/standings" || path === "/overlay/drivers" || path === "/overlay/teams" || path === "/overlay/ticker") {
      interval = setInterval(hydrateFromSupabase, 10000);
    }
    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => {
      saveLeagueState({ seasons, activeSeasonId }).catch((e) => console.error("Supabase save failed:", e));
    }, 250);
    return () => clearTimeout(timeout);
  }, [seasons, activeSeasonId, isHydrated]);

  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
  const drivers = activeSeason?.drivers || [];
  const activeDrivers = drivers.filter((d) => !d.retired);
  const selectedRace = activeSeason?.selectedRace || "";
  const positions = activeSeason?.positions || {};
  const stage1 = activeSeason?.stage1 || {};
  const stage2 = activeSeason?.stage2 || {};
  const stage3 = activeSeason?.stage3 || {};
  const dnfMap = activeSeason?.dnfMap || {};
  const offenseMap = activeSeason?.offenseMap || {};
  const fastestLapMap = activeSeason?.fastestLapMap || {};
  const raceHistory = activeSeason?.raceHistory || [];
  const selectedRaceData = races.find((r) => r.name === selectedRace);
  const stageCount = selectedRaceData ? selectedRaceData.stageCount : 2;

  const replaceActiveSeason = (next) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? next : s)));
  const patchActiveSeason = (patch) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? { ...s, ...patch } : s)));

  const clearInputs = () => {
    patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {} });
    setEditingRaceName(null);
  };

  const resetEditorStates = () => { setEditingRaceName(null); setEditingDriverId(null); setEditDriverForm({ name: "", number: "", team: "" }); };

  const downloadBackupObject = (payload, filePrefix = "pcl-backup") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportBackup = () => { if (!activeSeason) return; downloadBackupObject({ app: "Performance Cup League", version: 2, exportedAt: new Date().toISOString(), type: "single-season-backup", season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}`); };
  const exportAllSeasonsBackup = () => downloadBackupObject({ app: "Performance Cup League", version: 2, exportedAt: new Date().toISOString(), type: "full-league-backup", activeSeasonId, seasons }, "pcl-all-seasons-backup");

  const createSeason = () => {
    const trimmedName = newSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }
    if (seasons.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A season with that name already exists."); return; }
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
    const season = createEmptySeason(trimmedName, rosterOnly);
    setSeasons((prev) => [...prev, season]);
    setActiveSeasonId(season.id); setNewSeasonName(""); setRenameSeasonName(trimmedName); resetEditorStates();
  };

  const renameActiveSeason = () => {
    if (!activeSeason) return;
    const trimmedName = renameSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }
    if (seasons.some((s) => s.id !== activeSeason.id && s.name.toLowerCase() === trimmedName.toLowerCase())) { alert("Another season already has that name."); return; }
    patchActiveSeason({ name: trimmedName });
  };

  const switchSeason = (seasonId) => { setActiveSeasonId(seasonId); resetEditorStates(); };

  const deleteActiveSeason = () => {
    if (!activeSeason || seasons.length <= 1) { alert("You must keep at least one season."); return; }
    if (!window.confirm(`Delete season "${activeSeason.name}"? This cannot be undone.`)) return;
    const remaining = seasons.filter((s) => s.id !== activeSeason.id);
    setSeasons(remaining); setActiveSeasonId(remaining[0].id); setRenameSeasonName(remaining[0].name); resetEditorStates();
  };

  useEffect(() => { if (activeSeason?.name) setRenameSeasonName(activeSeason.name); }, [activeSeasonId, activeSeason?.name]);

  useEffect(() => {
    const nextInputs = {};
    (activeSeason?.drivers || []).forEach((d) => { nextInputs[d.id] = String(Number(d.startingPoints) || 0); });
    setStartingPointsInputs(nextInputs);
  }, [activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const nextInputs = {};
    (activeSeason?.drivers || []).forEach((d) => { nextInputs[d.id] = String(Number(d.manualWins) || 0); });
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
          if (!window.confirm("Importing this backup will replace all current seasons. Continue?")) return;
          const cleanSeasons = parsed.seasons.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
          if (cleanSeasons.length === 0) throw new Error("No seasons in backup.");
          const nextId = cleanSeasons.some((s) => s.id === parsed.activeSeasonId) ? parsed.activeSeasonId : cleanSeasons[0].id;
          setSeasons(cleanSeasons); setActiveSeasonId(nextId);
          setRenameSeasonName(cleanSeasons.find((s) => s.id === nextId)?.name || cleanSeasons[0].name);
          resetEditorStates(); alert("Full league backup imported.");
        } else if (parsed?.season) {
          const imported = sanitizeSeason(parsed.season, "Imported Season");
          if (!window.confirm(`Import season "${imported.name}"?`)) return;
          setSeasons((prev) => { const exists = prev.some((s) => s.id === imported.id); return exists ? prev.map((s) => s.id === imported.id ? imported : s) : [...prev, imported]; });
          setActiveSeasonId(imported.id); setRenameSeasonName(imported.name); resetEditorStates(); alert("Season backup imported.");
        } else throw new Error("Invalid backup file.");
      } catch (err) { console.error("Import failed:", err); alert("Could not import that backup file."); }
      finally { if (event.target) event.target.value = ""; }
    };
    reader.readAsText(file);
  };

  const resetSeason = () => {
    if (!activeSeason) return;
    if (!window.confirm(`Archive and reset "${activeSeason.name}"? A backup will download first.`)) return;
    downloadBackupObject({ app: "Performance Cup League", version: 2, archiveType: "season-reset-archive", archivedAt: new Date().toISOString(), season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}-archive`);
    const resetDrivers = activeSeason.drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: 0, manualWins: 0, points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: resetDrivers, raceHistory: [], selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {} });
    resetEditorStates();
  };

  const teamStandings = useMemo(() => {
    const teams = {};
    for (const d of drivers) {
      if (!teams[d.team]) teams[d.team] = { team: d.team, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      teams[d.team].points += d.points || 0; teams[d.team].wins += d.wins || 0;
      teams[d.team].top3 += d.top3 || 0; teams[d.team].top5 += d.top5 || 0; teams[d.team].drivers += 1;
    }
    return Object.values(teams).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.team.localeCompare(b.team));
  }, [drivers]);

  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const currentLeader = sortedDrivers[0] || null;
  const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((r) => r.finishPos === 1) || null;

  const applyStartingPointsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((d) => { const v = Number(startingPointsInputs[d.id]); return { id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number.isNaN(v) ? 0 : v, manualWins: Number(d.manualWins) || 0 }; });
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(raceHistory, updatedRoster) }); alert("Season starting points updated.");
  };

  const clearStartingPointsAdjustments = () => { const c = {}; drivers.forEach((d) => { c[d.id] = "0"; }); setStartingPointsInputs(c); };

  const applyManualWinsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((d) => { const v = Number(manualWinsInputs[d.id]); return { id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number.isNaN(v) ? 0 : v }; });
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(raceHistory, updatedRoster) }); alert("Manual wins updated.");
  };

  const clearManualWinsAdjustments = () => { const c = {}; drivers.forEach((d) => { c[d.id] = "0"; }); setManualWinsInputs(c); };

  const handlePositionChange = (id, v) => patchActiveSeason({ positions: { ...positions, [id]: v === "" ? "" : Number(v) } });
  const handleStage1Change = (id, v) => patchActiveSeason({ stage1: { ...stage1, [id]: v === "" ? "" : Number(v) } });
  const handleStage2Change = (id, v) => patchActiveSeason({ stage2: { ...stage2, [id]: v === "" ? "" : Number(v) } });
  const handleStage3Change = (id, v) => patchActiveSeason({ stage3: { ...stage3, [id]: v === "" ? "" : Number(v) } });
  const handleDnfChange = (id, checked) => patchActiveSeason({ dnfMap: { ...dnfMap, [id]: checked } });
  const handleOffenseChange = (id, checked) => patchActiveSeason({ offenseMap: { ...offenseMap, [id]: checked } });
  const handleFastestLapChange = (id) => patchActiveSeason({ fastestLapMap: fastestLapMap[id] ? {} : { [id]: true } });

  const retireDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    if (!window.confirm(`Retire ${driver.name}? They will be hidden from race entry but their stats will be preserved.`)) return;
    const updatedDrivers = drivers.map((d) => d.id === driverId ? { ...d, retired: true } : d);
    patchActiveSeason({ drivers: updatedDrivers });
    if (editingDriverId === driverId) cancelEditDriver();
  };

  const unretireDriver = (driverId) => {
    if (!activeSeason) return;
    const updatedDrivers = drivers.map((d) => d.id === driverId ? { ...d, retired: false } : d);
    patchActiveSeason({ drivers: updatedDrivers });
  };

  const addDriver = () => {
    const trimmedName = newDriverName.trim(), trimmedTeam = newDriverTeam.trim(), driverNumber = String(newDriverNumber).trim();
    if (!trimmedName || !trimmedTeam || !driverNumber) { alert("Please enter a driver name, number, and team."); return; }
    if (drivers.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => String(d.number) === driverNumber)) { alert("A driver with that number already exists."); return; }
    const rosterDriver = { id: Date.now(), number: Number(driverNumber), name: trimmedName, team: trimmedTeam, startingPoints: 0, manualWins: 0 };
    const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 })), rosterDriver];
    patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
    setNewDriverName(""); setNewDriverNumber(""); setNewDriverTeam("");
  };

  const openEditDriver = (driver) => { setEditingDriverId(driver.id); setEditDriverForm({ name: driver.name, number: driver.number, team: driver.team }); };
  const cancelEditDriver = () => { setEditingDriverId(null); setEditDriverForm({ name: "", number: "", team: "" }); };

  const saveDriverEdit = () => {
    if (!editingDriverId || !activeSeason) return;
    const name = editDriverForm.name.trim(), number = String(editDriverForm.number).trim(), team = editDriverForm.team.trim();
    if (!name || !number || !team) { alert("Please enter a driver name, number, and team."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && d.name.toLowerCase() === name.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && String(d.number) === number)) { alert("A driver with that number already exists."); return; }
    const updatedRoster = drivers.map((d) => d.id === editingDriverId ? { ...d, name, number: Number(number), team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 } : d);
    const updatedHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).map((r) => r.driverId === editingDriverId ? { ...r, name, number: Number(number), team } : r) }));
    const rosterOnly = updatedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(updatedHistory, rosterOnly), raceHistory: updatedHistory });
    cancelEditDriver();
  };

  const removeDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver || !window.confirm(`Remove ${driver.name}? This will also remove their results from race history.`)) return;
    const newRoster = drivers.filter((d) => d.id !== driverId).map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
    const newHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).filter((r) => r.driverId !== driverId) }));
    const np = { ...positions }, ns1 = { ...stage1 }, ns2 = { ...stage2 }, ns3 = { ...stage3 }, nd = { ...dnfMap }, no = { ...offenseMap }, nf = { ...fastestLapMap };
    delete np[driverId]; delete ns1[driverId]; delete ns2[driverId]; delete ns3[driverId]; delete nd[driverId]; delete no[driverId]; delete nf[driverId];
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(newHistory, newRoster), raceHistory: newHistory, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, offenseMap: no, fastestLapMap: nf });
    if (editingDriverId === driverId) cancelEditDriver();
  };

  const seasonOffenseCounts = useMemo(() => {
    const counts = {};
    drivers.forEach((d) => { counts[d.id] = countPriorOffenses(raceHistory, d.id, editingRaceName); });
    return counts;
  }, [raceHistory, drivers, editingRaceName]);

  const submitResults = () => {
    if (!activeSeason) return;
    if (!selectedRace.trim()) { alert("Please select a race."); return; }
    if (raceHistory.some((r) => r.raceName === selectedRace && editingRaceName !== selectedRace)) { alert("That race has already been entered."); return; }

    const raceResults = drivers.map((driver) => {
      const finishPos = positions[driver.id];
      const stage1Pos = stage1[driver.id], stage2Pos = stage2[driver.id], stage3Pos = stage3[driver.id];
      const dnf = !!dnfMap[driver.id];
      const fastestLap = !!fastestLapMap[driver.id];
      const offense = !!offenseMap[driver.id];
      const finishPoints = finishPos && finishPos >= 1 && finishPos <= pointsTable.length ? pointsTable[finishPos - 1] : 0;
      const stage1Points = getStagePoints(stage1Pos), stage2Points = getStagePoints(stage2Pos);
      const stage3Points = stageCount === 3 ? getStagePoints(stage3Pos) : 0;
      const fastestLapPoints = fastestLap ? 1 : 0;
      const priorOffenses = countPriorOffenses(raceHistory, driver.id, editingRaceName);
      const offenseNumber = offense ? priorOffenses + 1 : 0;
      const penaltyPoints = offense ? getOffensePenaltyPoints(offenseNumber) : 0;
      const totalRacePoints = finishPoints + stage1Points + stage2Points + stage3Points + fastestLapPoints - penaltyPoints;
      return {
        driverId: driver.id, name: driver.name, number: driver.number, team: driver.team,
        finishPos: finishPos || null, stage1Pos: stage1Pos || null, stage2Pos: stage2Pos || null, stage3Pos: stageCount === 3 ? stage3Pos || null : null,
        finishPoints, stage1Points, stage2Points, stage3Points, fastestLap, fastestLapPoints,
        offense, offenseNumber, penaltyPoints, totalRacePoints,
        isWin: finishPos === 1, isTop3: finishPos >= 1 && finishPos <= 3, isTop5: finishPos >= 1 && finishPos <= 5, dnf,
      };
    }).sort((a, b) => { if (a.finishPos === null) return 1; if (b.finishPos === null) return -1; return a.finishPos - b.finishPos; });

    const updatedRace = { raceName: selectedRace, stageCount, results: raceResults };
    const newHistory = editingRaceName ? raceHistory.map((r) => r.raceName === editingRaceName ? updatedRace : r) : [...raceHistory, updatedRace];
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {} });
    setEditingRaceName(null);
  };

  const handleEditRace = (race) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, no = {}, nf = {};
    race.results.forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
    });
    patchActiveSeason({ selectedRace: race.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, offenseMap: no, fastestLapMap: nf });
    setEditingRaceName(race.raceName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteRace = (raceName) => {
    if (!activeSeason || !window.confirm(`Delete ${raceName}? This will recalculate the standings.`)) return;
    const newHistory = raceHistory.filter((r) => r.raceName !== raceName);
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly) });
    if (editingRaceName === raceName) clearInputs();
  };

  const offenseLog = raceHistory.flatMap((race) =>
    race.results.filter((r) => r.offense).map((r) => ({ raceName: race.raceName, number: r.number, name: r.name, offenseNumber: r.offenseNumber, penaltyPoints: r.penaltyPoints }))
  );

  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;

  if (path === "/overlay/drivers" || viewMode === "overlay-drivers") return <LeaderboardOverlay drivers={drivers} preview={viewMode === "overlay-drivers"} seasonName={activeSeason?.name || ""} />;
  if (path === "/overlay/teams" || viewMode === "overlay-teams") return <TeamOverlay teams={teamStandings} preview={viewMode === "overlay-teams"} seasonName={activeSeason?.name || ""} />;
  if (path === "/standings") return <PublicStandings drivers={drivers} teams={teamStandings} seasonName={activeSeason?.name || ""} />;
  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") return <TickerOverlay drivers={drivers} teams={teamStandings} raceHistory={raceHistory} preview={viewMode === "overlay-ticker"} seasonName={activeSeason?.name || ""} />;

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>

        {/* Header */}
        <div style={{ ...sectionCardStyle, marginBottom: 20, padding: 20, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #353b45" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 54 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>Performance Cup League</div>
                <div style={{ opacity: 0.72 }}>Admin Dashboard</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["admin","overlay-drivers","overlay-teams","overlay-ticker"].map((mode) => (
                <button key={mode} style={viewMode === mode ? activeHeaderButtonStyle : headerButtonStyle} onClick={() => setViewMode(mode)}>
                  {mode === "admin" ? "Admin" : mode === "overlay-drivers" ? "Driver Overlay" : mode === "overlay-teams" ? "Team Overlay" : "Ticker Overlay"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Season Manager */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Manager</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Active Season</div><select style={inputStyle} value={activeSeasonId} onChange={(e) => switchSeason(e.target.value)}>{seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Create New Season</div><input style={inputStyle} value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} placeholder="Example: 2026 Regular Season" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Rename Active Season</div><input style={inputStyle} value={renameSeasonName} onChange={(e) => setRenameSeasonName(e.target.value)} placeholder="Rename current season" /></div>
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
            { label: "CURRENT LEADER", value: currentLeader ? `#${currentLeader.number} ${currentLeader.name}` : "—" },
            { label: "TOTAL DRIVERS", value: drivers.length },
            { label: "RACES ENTERED", value: raceHistory.length },
            { label: "LATEST WINNER", value: latestWinner ? `#${latestWinner.number} ${latestWinner.name}` : "—" },
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
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Export the active season, export all seasons, or import a backup.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={exportBackup} style={primaryButtonStyle}>Export Active Season</button>
            <button onClick={exportAllSeasonsBackup} style={secondaryButtonStyle}>Export All Seasons</button>
            <button onClick={() => importFileRef.current?.click()} style={secondaryButtonStyle}>Import Backup</button>
            <input ref={importFileRef} type="file" accept=".json,application/json" onChange={handleImportBackup} style={{ display: "none" }} />
          </div>
        </div>

        {/* Starting Points */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Starting Points</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Use this if starting the app mid-season. Future race entries will add on top of these values.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={applyStartingPointsAdjustments} style={primaryButtonStyle}>Save Starting Points</button>
            <button onClick={clearStartingPointsAdjustments} style={secondaryButtonStyle}>Clear to Zero</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Starting Points</th><th style={thStyle}>Current Total</th></tr></thead>
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}><input type="number" style={inputStyle} value={startingPointsInputs[d.id] ?? "0"} onChange={(e) => setStartingPointsInputs((p) => ({ ...p, [d.id]: e.target.value }))} /></td><td style={{ ...tdStyle, fontWeight: 800 }}>{d.points}</td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {/* Manual Wins */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Manual Wins Adjustment</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Use this if starting the app mid-season and drivers already have wins.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={applyManualWinsAdjustments} style={primaryButtonStyle}>Save Manual Wins</button>
            <button onClick={clearManualWinsAdjustments} style={secondaryButtonStyle}>Clear Wins to Zero</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Manual Wins</th><th style={thStyle}>Current Total Wins</th></tr></thead>
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}><input type="number" style={inputStyle} value={manualWinsInputs[d.id] ?? "0"} onChange={(e) => setManualWinsInputs((p) => ({ ...p, [d.id]: e.target.value }))} /></td><td style={{ ...tdStyle, fontWeight: 800 }}>{d.wins}</td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {/* Driver Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Management</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Enter driver name" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={newDriverNumber} onChange={(e) => setNewDriverNumber(e.target.value)} placeholder="Enter car number" type="number" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team</div><input style={inputStyle} value={newDriverTeam} onChange={(e) => setNewDriverTeam(e.target.value)} placeholder="Enter team name" /></div>
          </div>
          <div style={{ marginBottom: 18 }}><button onClick={addDriver} style={primaryButtonStyle}>Add Driver</button></div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => openEditDriver(d)} style={secondaryButtonStyle}>Edit</button>{d.retired ? (<button onClick={() => unretireDriver(d.id)} style={secondaryButtonStyle}>Unretire</button>) : (<button onClick={() => retireDriver(d.id)} style={{ ...secondaryButtonStyle, color: "#f59e0b", borderColor: "#f59e0b" }}>Retire</button>)}<button onClick={() => removeDriver(d.id)} style={dangerButtonStyle}>Remove</button></div></td></tr>))}</tbody>
            </table>
          </div>
          {editingDriverId && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #313947" }}>
              <h3 style={{ marginTop: 0 }}>Edit Driver</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={editDriverForm.name} onChange={(e) => setEditDriverForm({ ...editDriverForm, name: e.target.value })} /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={editDriverForm.number} onChange={(e) => setEditDriverForm({ ...editDriverForm, number: e.target.value })} type="number" /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team</div><input style={inputStyle} value={editDriverForm.team} onChange={(e) => setEditDriverForm({ ...editDriverForm, team: e.target.value })} /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}><button onClick={saveDriverEdit} style={primaryButtonStyle}>Save Changes</button><button onClick={cancelEditDriver} style={secondaryButtonStyle}>Cancel</button></div>
            </div>
          )}
        </div>

        {/* Enter Race Results */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingRaceName ? `Edit Race: ${editingRaceName}` : "Enter Race Results"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race</label>
              <select style={inputStyle} value={selectedRace} onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}>
                <option value="">Select a race</option>
                {races.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Stage Setup</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", minHeight: 42 }}>{selectedRace ? `${stageCount} scoring stages` : "Select a race to view stage count"}</div>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th>
                  <th style={thStyle}>Finish</th><th style={thStyle}>Stage 1</th><th style={thStyle}>Stage 2</th>
                  {stageCount === 3 && <th style={thStyle}>Stage 3</th>}
                  <th style={thStyle}>DNF</th><th style={thStyle}>Fastest Lap</th>
                  <th style={thStyle}>Offense</th><th style={thStyle}>Offense #</th>
                </tr>
              </thead>
              <tbody>
                {activeDrivers.map((driver) => {
                  const prior = seasonOffenseCounts[driver.id] || 0;
                  const thisOffense = offenseMap[driver.id] ? prior + 1 : null;
                  return (
                    <tr key={driver.id}>
                      <td style={tdStyle}>{driver.number}</td>
                      <td style={tdStyle}>{driver.name}</td>
                      <td style={tdStyle}>{driver.team}</td>
                      <td style={tdStyle}><input type="number" min="1" max="40" style={inputStyle} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} /></td>
                      <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} /></td>
                      <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} /></td>
                      {stageCount === 3 && <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} /></td>}
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={!!dnfMap[driver.id]} onChange={(e) => handleDnfChange(driver.id, e.target.checked)} />DNF</label></td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="radio" name="fastestLap" checked={!!fastestLapMap[driver.id]} onChange={() => handleFastestLapChange(driver.id)} />FL +1</label></td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={!!offenseMap[driver.id]} onChange={(e) => handleOffenseChange(driver.id, e.target.checked)} />Offense</label></td>
                      <td style={{ ...tdStyle, color: thisOffense ? "#f87171" : "inherit" }}>
                        {thisOffense ? `#${thisOffense} (-${getOffensePenaltyPoints(thisOffense)} pts)` : prior > 0 ? `${prior} prior` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button onClick={submitResults} style={primaryButtonStyle}>{editingRaceName ? "Update Race" : "Submit Results"}</button>
            {editingRaceName && <button onClick={clearInputs} style={secondaryButtonStyle}>Cancel Edit</button>}
            <button onClick={clearInputs} style={secondaryButtonStyle}>Clear Inputs</button>
            <button onClick={resetSeason} style={dangerButtonStyle}>Archive + Reset Active Season</button>
          </div>
        </div>

        {/* Driver Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th></tr></thead>
              <tbody>{sortedDrivers.map((d, i) => (<tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}{d.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td><td style={tdStyle}>{d.dnfs || 0}</td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {/* Team Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>{teamStandings.map((t, i) => (<tr key={t.team}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{t.team}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td><td style={tdStyle}>{t.drivers}</td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {/* Race History */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Race History</h2>
          {raceHistory.length === 0 ? <div style={{ opacity: 0.75 }}>No races entered yet.</div> : (
            <div style={{ display: "grid", gap: 16 }}>
              {raceHistory.map((race) => {
                const winner = race.results?.find((r) => r.finishPos === 1);
                return (
                  <div key={race.raceName} style={{ background: "#10141b", border: "1px solid #2b3441", borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{race.raceName}</div>
                        <div style={{ opacity: 0.75 }}>{race.stageCount} scoring stages{winner ? ` • Winner: #${winner.number} ${winner.name}` : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEditRace(race)} style={secondaryButtonStyle}>Edit</button>
                        <button onClick={() => handleDeleteRace(race.raceName)} style={dangerButtonStyle}>Delete</button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Finish</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th>
                            <th style={thStyle}>Race Pts</th><th style={thStyle}>S1</th><th style={thStyle}>S2</th>
                            {race.stageCount === 3 && <th style={thStyle}>S3</th>}
                            <th style={thStyle}>FL</th><th style={thStyle}>DNF</th>
                            <th style={thStyle}>Offense</th><th style={thStyle}>Penalty</th><th style={thStyle}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.results.map((r) => (
                            <tr key={r.driverId}>
                              <td style={tdStyle}>{r.finishPos ?? "—"}</td>
                              <td style={tdStyle}>{r.number}</td>
                              <td style={tdStyle}>{r.name}</td>
                              <td style={tdStyle}>{r.team}</td>
                              <td style={tdStyle}>{r.finishPoints}</td>
                              <td style={tdStyle}>{r.stage1Points}</td>
                              <td style={tdStyle}>{r.stage2Points}</td>
                              {race.stageCount === 3 && <td style={tdStyle}>{r.stage3Points}</td>}
                              <td style={tdStyle}>{r.fastestLap ? "+1" : "—"}</td>
                              <td style={tdStyle}>{r.dnf ? "DNF" : "—"}</td>
                              <td style={tdStyle}>{r.offense ? `#${r.offenseNumber}` : "—"}</td>
                              <td style={{ ...tdStyle, color: r.penaltyPoints > 0 ? "#f87171" : "inherit" }}>{r.penaltyPoints > 0 ? `-${r.penaltyPoints}` : "0"}</td>
                              <td style={{ ...tdStyle, fontWeight: 800 }}>{r.totalRacePoints}</td>
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

        {/* Offense Log */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Offense Log</h2>
          {offenseLog.length === 0 ? <div style={{ opacity: 0.75 }}>No offenses logged yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Offense #</th><th style={thStyle}>Penalty</th></tr></thead>
                <tbody>
                  {offenseLog.map((entry, i) => (
                    <tr key={`${entry.raceName}-${entry.number}-${i}`}>
                      <td style={tdStyle}>{entry.raceName}</td>
                      <td style={tdStyle}>{entry.number}</td>
                      <td style={tdStyle}>{entry.name}</td>
                      <td style={tdStyle}>#{entry.offenseNumber}</td>
                      <td style={{ ...tdStyle, color: "#f87171" }}>-{entry.penaltyPoints} pts</td>
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
