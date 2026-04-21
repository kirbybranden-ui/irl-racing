import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import manufacturerChevrolet from "./assets/manufacturers/chevrolet.png";
import manufacturerFord from "./assets/manufacturers/ford.png";
import manufacturerToyota from "./assets/manufacturers/toyota.png";
import FilesPage from "./FilesPage";
import SubmitAppealPage from "./SubmitAppealPage";
import AppealsPage from "./AppealsPage";
import DriverProfilePage from "./DriverProfilePage";
import WelcomePage from "./WelcomePage";
import { supabase } from "./lib/supabase";

// Team logos
const teamLogos = {
  "JA MOTORSPORTS": teamLogoJAM,
  JAM: teamLogoJAM,
};
const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";
const defaultDrivers = [
  { id: 1, number: 42, name: "AMP-GHOSTRIDER", manufacturer: "Toyota", team: "JAM" },
  { id: 2, number: 99, name: "RookieVet99", manufacturer: "Toyota", team: "JAM" },
  { id: 3, number: 18, name: "bowhunter6758", manufacturer: "Toyota", team: "JAM" },
  { id: 4, number: 81, name: "HOLDEN2DX4EV3R", manufacturer: "Chevrolet", team: "JAM" },
  { id: 5, number: 3, name: "ixGusty", manufacturer: "Toyota", team: "None" },
  { id: 6, number: 14, name: "KapSig", manufacturer: "Chevrolet", team: "None" },
  { id: 7, number: 24, name: "KEVDINHO7", manufacturer: "Chevrolet", team: "None" },
  { id: 8, number: 38, name: "It's_tricky88", manufacturer: "Toyota", team: "None" },
  { id: 9, number: 97, name: "American_Hero216", manufacturer: "Ford", team: "None" },
];
const defaultRaces = [
  { name: "Preseason - Michigan", stageCount: 2, date: "2026-04-25" },
  { name: "Preseason - Dover", stageCount: 2, date: "2026-05-02" },
  { name: "Preseason - WWT Raceway", stageCount: 2, date: "2026-05-09" },
  { name: "Daytona (Night)", stageCount: 2, date: "2026-05-16" },
  { name: "Charlotte", stageCount: 3, date: "2026-05-23" },
  { name: "Nashville", stageCount: 2, date: "2026-05-30" },
  { name: "Michigan", stageCount: 2, date: "2026-06-06" },
  { name: "Pocono", stageCount: 2, date: "2026-06-13" },
  { name: "Bristol (Night)", stageCount: 2, date: "2026-06-20" },
  { name: "Las Vegas", stageCount: 2, date: "2026-06-27" },
  { name: "Talladega", stageCount: 2, date: "2026-07-11" },
  { name: "North Wilksboro", stageCount: 2, date: "2026-07-18" },
  { name: "Indianapolis", stageCount: 2, date: "2026-07-25" },
  { name: "New Hampshire", stageCount: 2, date: "2026-08-01" },
  { name: "Phoenix", stageCount: 2, date: "2026-08-08" },
  { name: "Richmond", stageCount: 2, date: "2026-08-15" },
  { name: "Kansas", stageCount: 2, date: "2026-08-22" },
  { name: "Texas", stageCount: 2, date: "2026-08-29" },
  { name: "Iowa", stageCount: 2, date: "2026-09-05" },
  { name: "Homestead", stageCount: 2, date: "2026-09-12" },
];
// Winston Cup points system
const pointsTable = [
  40, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  16, 15, 14, 13, 12, 11, 10, 9, 8, 7,
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
function sanitizeTracks(rawTracks) {
  if (!Array.isArray(rawTracks)) return null;
  const cleaned = rawTracks
    .map((t) => {
      const name = typeof t?.name === "string" ? t.name.trim() : "";
      const stageCount = Number(t?.stageCount);
      if (!name) return null;
      const stages = [1, 2, 3].includes(stageCount) ? stageCount : 2;
      return { name, stageCount: stages };
    })
    .filter(Boolean);
  // De-dupe by name (case-insensitive)
  const seen = new Set();
  const deduped = [];
  cleaned.forEach((t) => {
    const key = t.name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deduped.push(t); }
  });
  return deduped;
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
  JAM: { logo: "JAM", accent: "#d4af37", dark: "#1b1b1b" },
  "JA MOTORSPORTS": { logo: "JA", accent: "#d4af37", dark: "#1b1b1b" },
  "None": { logo: "N", accent: "#808080", dark: "#2a2a2a" },
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
  return { ...driver, manufacturer: driver.manufacturer || "", manufacturerLogo: driver.manufacturerLogo || manufacturerLogos[driver.manufacturer] || null, startingPoints: Number(driver.startingPoints) || 0, manualWins: Number(driver.manualWins) || 0, points: Number(driver.startingPoints) || 0, wins: Number(driver.manualWins) || 0, top3: 0, top5: 0, dnfs: 0, retired: driver.retired || false, notes: driver.notes || "" };
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
    return { ...baseDriver, manufacturerLogo: baseDriver.manufacturerLogo || manufacturerLogos[baseDriver.manufacturer] || null, startingPoints: Number(baseDriver.startingPoints) || 0, manualWins: Number(baseDriver.manualWins) || 0, points, wins, top3, top5, dnfs, fastestLaps, totalPenalties, retired: baseDriver.retired || false };
  });
}
function makeSeasonId() { return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function createEmptySeason(name, roster = getDefaultRoster()) {
  const cleanRoster = roster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
  return { id: makeSeasonId(), name: name || "New Season", createdAt: new Date().toISOString(), drivers: rebuildDriversFromHistory([], cleanRoster), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {}, raceHistory: [] };
}
function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource = Array.isArray(season?.drivers) && season.drivers.length > 0 ? season.drivers : getDefaultRoster();
  const rosterOnly = rosterSource.map((d) => ({ id: d.id, number: Number(d.number), name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
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
  let tracks = defaultRaces;
  try {
    const savedTracks = localStorage.getItem("irl-tracks");
    if (savedTracks) {
      const parsed = sanitizeTracks(JSON.parse(savedTracks));
      if (parsed && parsed.length > 0) tracks = parsed;
    }
  } catch { /* fall through */ }
  try {
    const savedSeasons = localStorage.getItem("irl-seasons");
    const savedActiveSeasonId = localStorage.getItem("irl-activeSeasonId");
    if (savedSeasons) {
      const parsed = JSON.parse(savedSeasons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanSeasons = parsed.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
        const activeExists = cleanSeasons.some((s) => s.id === savedActiveSeasonId);
        return { seasons: cleanSeasons, activeSeasonId: activeExists ? savedActiveSeasonId : cleanSeasons[0].id, tracks };
      }
    }
  } catch { /* fall through */ }
  const legacySeason = buildLegacySeasonFromLocalStorage();
  return { seasons: [legacySeason], activeSeasonId: legacySeason.id, tracks };
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
        <table style={tableStyle}><thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Mfr</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
          <tbody>{sorted.map((d, i) => <tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.team}</td><td style={tdStyle}>{d.manufacturer || "—"}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td></tr>)}</tbody>
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
  const handleDriverClick = (number) => {
    window.location.pathname = `/driver/${number}`;
  };

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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
          {[{label:"POINTS",value:driver.points},{label:"WINS",value:driver.wins},{label:"TOP 3",value:driver.top3},{label:"TOP 5",value:driver.top5}].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>
        <button 
          onClick={() => handleDriverClick(driver.number)}
          style={{ width: "100%", background: "rgba(0,0,0,0.3)", color: "white", border: `1px solid rgba(255,255,255,0.3)`, borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          View Full Profile
        </button>
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
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 0.6, lineHeight: 1.05 }}>BUDWEISER CUP LEAGUE</div>
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
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team Name</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th><th style={thStyle}>FL</th><th style={thStyle}>Penalties</th></tr></thead>
              <tbody>
                {sorted.map((driver, index) => {
                  const isLeader = index === 0;
                  return (
                    <tr key={driver.id} style={{ background: isLeader ? "rgba(212,175,55,0.10)" : "transparent", cursor: "pointer" }} onClick={() => handleDriverClick(driver.number)}>
                      <td style={{ ...tdStyle, fontWeight: 900, color: isLeader ? "#f3d36a" : "white", fontSize: 16 }}>{index + 1}</td>
                      <td style={tdStyle}>{renderTeamBadge(driver.team, 38)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{driver.number}</div></td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>{driver.name}{driver.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td>
                      <td style={tdStyle}>{driver.manufacturer || "—"}</td>
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
        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Manufacturer Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>
                {(() => {
                  const mfrs = {};
                  for (const d of drivers) {
                    const mfr = d.manufacturer || "Unknown";
                    if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
                    mfrs[mfr].points += d.points || 0; mfrs[mfr].wins += d.wins || 0;
                    mfrs[mfr].top3 += d.top3 || 0; mfrs[mfr].top5 += d.top5 || 0; mfrs[mfr].drivers += 1;
                  }
                  return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.manufacturer.localeCompare(b.manufacturer)).map((m, i) => (
                    <tr key={m.manufacturer}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{m.manufacturer}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{m.points}</td>
                      <td style={tdStyle}>{m.wins}</td>
                      <td style={tdStyle}>{m.top3}</td>
                      <td style={tdStyle}>{m.top5}</td>
                      <td style={tdStyle}>{m.drivers}</td>
                    </tr>
                  ));
                })()}
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
    seasonName ? `Season: ${seasonName}` : "Budweiser Cup League",
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
function CarGalleryPageComponent({ drivers = [], tracks = [] }) {
  const [uploads, setUploads] = React.useState([]);
  const [filteredUploads, setFilteredUploads] = React.useState([]);
  const [selectedDriver, setSelectedDriver] = React.useState("");
  const [selectedRace, setSelectedRace] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) { setUploads([]); setFilteredUploads([]); return; }
      const response = await fetch(`${supabaseUrl}/rest/v1/car_uploads?order=uploaded_at.desc`, { headers: { "apikey": supabaseAnonKey, "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setUploads(Array.isArray(data) ? data : []);
      setFilteredUploads(Array.isArray(data) ? data : []);
    } catch (err) { setUploads([]); setFilteredUploads([]); }
    finally { setLoading(false); }
  };

  React.useEffect(() => {
    let filtered = [...uploads];
    if (selectedDriver) filtered = filtered.filter(u => String(u.driver_id) === selectedDriver);
    if (selectedRace) filtered = filtered.filter(u => u.race_id === selectedRace);
    setFilteredUploads(filtered);
  }, [uploads, selectedDriver, selectedRace]);

  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-photo";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (uploadId, filePath) => {
    if (!window.confirm("Delete this upload?")) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/storage/v1/object/car-uploads/${filePath}`, { method: "DELETE", headers: { "apikey": supabaseAnonKey } });
      await fetch(`${supabaseUrl}/rest/v1/car_uploads?id=eq.${uploadId}`, { method: "DELETE", headers: { "apikey": supabaseAnonKey, "Content-Type": "application/json" } });
      setUploads(uploads.filter(u => u.id !== uploadId));
      alert("Upload deleted!");
    } catch (err) { alert("Error deleting upload"); }
  };

  const isImageFile = (type) => type && type.startsWith("image/");
  const isVideoFile = (type) => type && type.startsWith("video/");

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <button onClick={() => window.history.back()} style={{ background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>← Back</button>
          <h1 style={{ marginTop: 0 }}>Car Gallery</h1>
        </div>
        {loading ? <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18 }}>Loading...</div> : filteredUploads.length === 0 ? <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, textAlign: "center", opacity: 0.75 }}>No uploads</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filteredUploads.map(upload => {
            const driver = drivers.find(d => d.id === upload.driver_id);
            return (
              <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27" }}>
                  {isImageFile(upload.file_type) ? <img src={upload.file_url} alt="Car" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : isVideoFile(upload.file_type) ? <video style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}><source src={upload.file_url} type={upload.file_type} /></video> : <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f27", color: "#666" }}>📄</div>}
                </div>
                <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: 8 }}><div style={{ fontSize: 12, opacity: 0.7 }}>DRIVER</div><div style={{ fontWeight: 700 }}>{driver ? `#${driver.number}` : "Unknown"}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, opacity: 0.7 }}>RACE</div><div>{upload.race_id}</div></div>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button onClick={() => handleDownload(upload.file_url, upload.file_name)} style={{ flex: 1, background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Download</button>
                    <button onClick={() => handleDelete(upload.id, upload.file_path)} style={{ flex: 1, background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
export default function App() {
  const [seasons, setSeasons] = useState(() => loadInitialLeagueState().seasons);
  const [openAppealCount, setOpenAppealCount] = useState(0);
  const [activeSeasonId, setActiveSeasonId] = useState(() => loadInitialLeagueState().activeSeasonId);
  const [tracks, setTracks] = useState(() => loadInitialLeagueState().tracks);
  const [isHydrated, setIsHydrated] = useState(false);
  const [viewMode, setViewMode] = useState("admin");
  const [editingRaceName, setEditingRaceName] = useState(null);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [renameSeasonName, setRenameSeasonName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverNumber, setNewDriverNumber] = useState("");
  const [newDriverManufacturer, setNewDriverManufacturer] = useState("");
  const [newDriverTeam, setNewDriverTeam] = useState("");
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editDriverForm, setEditDriverForm] = useState({ name: "", number: "", manufacturer: "", team: "" });
  const [driverNotes, setDriverNotes] = useState({});
  const [dnfReasons, setDnfReasons] = useState({});
  const [startingPointsInputs, setStartingPointsInputs] = useState({});
  const [manualWinsInputs, setManualWinsInputs] = useState({});
  const [newTrackName, setNewTrackName] = useState("");
  const [newTrackStageCount, setNewTrackStageCount] = useState(2);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const importFileRef = useRef(null);
  const path = window.location.pathname.toLowerCase();

  if (path === "/files") return <FilesPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/appeals") return <AppealsPage />;
  if (path.startsWith("/driver/")) {
    const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
    return <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />;
  }

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
        const cleanTracks = sanitizeTracks(savedState?.tracks);
        if (cleanTracks && cleanTracks.length > 0) setTracks(cleanTracks);
      } catch (error) {
        console.error("Supabase load failed:", error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }
    hydrateFromSupabase();
    let interval = null;
    if (path === "/standings" || path === "/overlay/drivers" || path === "/overlay/teams" || path === "/overlay/ticker") {
      interval = setInterval(hydrateFromSupabase, 2000);
    }
    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, []);
  useEffect(() => {
    async function loadOpenAppeals() {
      const { count, error } = await supabase
        .from("appeals")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");

      if (!error) {
        setOpenAppealCount(count || 0);
      }
    }

    loadOpenAppeals();
  }, []);
  useEffect(() => {
    async function loadPendingDrivers() {
      const { data, error } = await supabase
        .from("pending_drivers")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPendingDrivers(data);
      }
    }

    loadPendingDrivers();
    const interval = setInterval(loadPendingDrivers, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => {
      saveLeagueState({ seasons, activeSeasonId, tracks }).catch((e) => console.error("Supabase save failed:", e));
    }, 250);
    return () => clearTimeout(timeout);
  }, [seasons, activeSeasonId, tracks, isHydrated]);
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
  const selectedRaceData = tracks.find((r) => r.name === selectedRace);
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
  const exportBackup = () => { if (!activeSeason) return; downloadBackupObject({ app: "Budweiser Cup League", version: 2, exportedAt: new Date().toISOString(), type: "single-season-backup", season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}`); };
  const exportAllSeasonsBackup = () => downloadBackupObject({ app: "Budweiser Cup League", version: 2, exportedAt: new Date().toISOString(), type: "full-league-backup", activeSeasonId, seasons, tracks }, "pcl-all-seasons-backup");
  const createSeason = () => {
    const trimmedName = newSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }
    if (seasons.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A season with that name already exists."); return; }
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
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
  }, [activeSeasonId]);
  useEffect(() => {
    const nextInputs = {};
    (activeSeason?.drivers || []).forEach((d) => { nextInputs[d.id] = String(Number(d.manualWins) || 0); });
    setManualWinsInputs(nextInputs);
  }, [activeSeasonId]);
  useEffect(() => {
    const nextNotes = {};
    (activeSeason?.drivers || []).forEach((d) => { nextNotes[d.id] = d.notes || ""; });
    setDriverNotes(nextNotes);
  }, [activeSeasonId]);
  useEffect(() => {
    const nextReasons = {};
    (activeSeason?.drivers || []).forEach((d) => { nextReasons[d.id] = ""; });
    setDnfReasons(nextReasons);
  }, [selectedRace, activeSeasonId]);
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
          const cleanTracks = sanitizeTracks(parsed.tracks);
          if (cleanTracks && cleanTracks.length > 0) setTracks(cleanTracks);
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
    downloadBackupObject({ app: "Budweiser Cup League", version: 2, archiveType: "season-reset-archive", archivedAt: new Date().toISOString(), season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}-archive`);
    const resetDrivers = activeSeason.drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0 }));
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
  const manufacturerStandings = useMemo(() => {
    const mfrs = {};
    for (const d of drivers) {
      const mfr = d.manufacturer || "Unknown";
      if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      mfrs[mfr].points += d.points || 0; mfrs[mfr].wins += d.wins || 0;
      mfrs[mfr].top3 += d.top3 || 0; mfrs[mfr].top5 += d.top5 || 0; mfrs[mfr].drivers += 1;
    }
    return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.manufacturer.localeCompare(b.manufacturer));
  }, [drivers]);
  const sortedDrivers = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const currentLeader = sortedDrivers[0] || null;
  const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((r) => r.finishPos === 1) || null;
  const applyStartingPointsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((d) => { const v = Number(startingPointsInputs[d.id]); return { id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number.isNaN(v) ? 0 : v, manualWins: Number(d.manualWins) || 0 }; });
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(raceHistory, updatedRoster) }); alert("Season starting points updated.");
  };
  const clearStartingPointsAdjustments = () => { const c = {}; drivers.forEach((d) => { c[d.id] = "0"; }); setStartingPointsInputs(c); };
  const applyManualWinsAdjustments = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((d) => { const v = Number(manualWinsInputs[d.id]); return { id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number.isNaN(v) ? 0 : v }; });
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
    const trimmedName = newDriverName.trim(), trimmedTeam = newDriverTeam.trim(), trimmedManufacturer = newDriverManufacturer.trim(), driverNumber = String(newDriverNumber).trim();
    if (!trimmedName || !trimmedTeam || !trimmedManufacturer || !driverNumber) { alert("Please enter driver name, number, manufacturer, and team."); return; }
    if (drivers.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => String(d.number) === driverNumber)) { alert("A driver with that number already exists."); return; }
    const rosterDriver = { id: Date.now(), number: Number(driverNumber), name: trimmedName, manufacturer: trimmedManufacturer, manufacturerLogo: manufacturerLogos[trimmedManufacturer] || null, team: trimmedTeam, startingPoints: 0, manualWins: 0 };
    const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 })), rosterDriver];
    patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
    setNewDriverName(""); setNewDriverNumber(""); setNewDriverManufacturer(""); setNewDriverTeam("");
  };
  const openEditDriver = (driver) => { setEditingDriverId(driver.id); setEditDriverForm({ name: driver.name, number: driver.number, manufacturer: driver.manufacturer || "", team: driver.team }); };
  const cancelEditDriver = () => { setEditingDriverId(null); setEditDriverForm({ name: "", number: "", manufacturer: "", team: "" }); };
  const saveDriverNotes = () => {
    if (!activeSeason) return;
    const updatedRoster = drivers.map((d) => ({ ...d, notes: driverNotes[d.id] || "" }));
    const rosterOnly = updatedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false, notes: d.notes || "" }));
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(raceHistory, rosterOnly) });
    alert("Driver notes saved!");
  };
  const saveDriverEdit = () => {
    if (!editingDriverId || !activeSeason) return;
    const name = editDriverForm.name.trim(), number = String(editDriverForm.number).trim(), manufacturer = editDriverForm.manufacturer.trim(), team = editDriverForm.team.trim();
    if (!name || !number || !manufacturer || !team) { alert("Please enter driver name, number, manufacturer, and team."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && d.name.toLowerCase() === name.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && String(d.number) === number)) { alert("A driver with that number already exists."); return; }
    const updatedRoster = drivers.map((d) => d.id === editingDriverId ? { ...d, name, number: Number(number), manufacturer, manufacturerLogo: manufacturerLogos[manufacturer] || null, team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 } : d);
    const updatedHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).map((r) => r.driverId === editingDriverId ? { ...r, name, number: Number(number), manufacturer, team } : r) }));
    const rosterOnly = updatedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(updatedHistory, rosterOnly), raceHistory: updatedHistory });
    cancelEditDriver();
  };
  const removeDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver || !window.confirm(`Remove ${driver.name}? This will also remove their results from race history.`)) return;
    const newRoster = drivers.filter((d) => d.id !== driverId).map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
    const newHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).filter((r) => r.driverId !== driverId) }));
    const np = { ...positions }, ns1 = { ...stage1 }, ns2 = { ...stage2 }, ns3 = { ...stage3 }, nd = { ...dnfMap }, no = { ...offenseMap }, nf = { ...fastestLapMap };
    delete np[driverId]; delete ns1[driverId]; delete ns2[driverId]; delete ns3[driverId]; delete nd[driverId]; delete no[driverId]; delete nf[driverId];
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(newHistory, newRoster), raceHistory: newHistory, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, offenseMap: no, fastestLapMap: nf });
    if (editingDriverId === driverId) cancelEditDriver();
  };
  const addTrack = () => {
    const name = newTrackName.trim();
    const stageCount = Number(newTrackStageCount);
    if (!name) { alert("Please enter a track name."); return; }
    if (![1, 2, 3].includes(stageCount)) { alert("Stage count must be 1, 2, or 3."); return; }
    if (tracks.some((t) => t.name.toLowerCase() === name.toLowerCase())) { alert("A track with that name already exists."); return; }
    setTracks((prev) => [...prev, { name, stageCount }]);
    setNewTrackName("");
    setNewTrackStageCount(2);
  };
  const removeTrack = (trackName) => {
    const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === trackName));
    const warning = usedInHistory
      ? `Remove "${trackName}" from the track list? It already has race history in one or more seasons — that history will be preserved, but the track won't appear in the dropdown anymore.`
      : `Remove "${trackName}" from the track list?`;
    if (!window.confirm(warning)) return;
    setTracks((prev) => prev.filter((t) => t.name !== trackName));
    if (selectedRace === trackName) {
      patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {} });
      setEditingRaceName(null);
    }
  };
  const approvePendingDriver = async (pendingDriver) => {
    if (!activeSeason || !pendingDriver) return;
    if (!window.confirm(`Add ${pendingDriver.driver_name} (#${pendingDriver.car_number}) to the league?`)) return;

    try {
      const newDriver = {
        id: Date.now(),
        number: pendingDriver.car_number,
        name: pendingDriver.driver_name,
        manufacturer: pendingDriver.manufacturer || "",
        manufacturerLogo: manufacturerLogos[pendingDriver.manufacturer] || null,
        team: pendingDriver.team_name,
        startingPoints: 0,
        manualWins: 0,
        retired: false,
      };
      const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 })), newDriver];
      patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });

      await supabase
        .from("pending_drivers")
        .update({ status: "approved" })
        .eq("id", pendingDriver.id);

      setPendingDrivers((prev) => prev.filter((d) => d.id !== pendingDriver.id));
      alert(`${pendingDriver.driver_name} has been added to the league!`);
    } catch (err) {
      console.error("Error approving driver:", err);
      alert("Failed to approve driver. Please try again.");
    }
  };
  const rejectPendingDriver = async (pendingDriver) => {
    if (!window.confirm(`Reject ${pendingDriver.driver_name}?`)) return;

    try {
      await supabase
        .from("pending_drivers")
        .update({ status: "rejected" })
        .eq("id", pendingDriver.id);

      setPendingDrivers((prev) => prev.filter((d) => d.id !== pendingDriver.id));
    } catch (err) {
      console.error("Error rejecting driver:", err);
    }
  };
  const updateTrackStageCount = (trackName, newCount) => {
    const stages = Number(newCount);
    if (![1, 2, 3].includes(stages)) return;
    setTracks((prev) => prev.map((t) => t.name === trackName ? { ...t, stageCount: stages } : t));
  };
  const restoreDefaultTracks = () => {
    if (!window.confirm("Restore the default 17-track schedule? Any custom tracks you've added will be removed (race history is preserved).")) return;
    setTracks(defaultRaces);
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
        isWin: finishPos === 1, isTop3: finishPos >= 1 && finishPos <= 3, isTop5: finishPos >= 1 && finishPos <= 5, dnf, dnfReason: dnf ? (dnfReasons[driver.id] || "Unknown") : null,
      };
    }).sort((a, b) => { if (a.finishPos === null) return 1; if (b.finishPos === null) return -1; return a.finishPos - b.finishPos; });
    const updatedRace = { raceName: selectedRace, stageCount, results: raceResults };
    const newHistory = editingRaceName ? raceHistory.map((r) => r.raceName === editingRaceName ? updatedRace : r) : [...raceHistory, updatedRace];
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {} });
    setEditingRaceName(null);
  };
  const handleEditRace = (race) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, no = {}, nf = {}, nr = {};
    race.results.forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
      if (r.dnfReason) nr[r.driverId] = r.dnfReason;
    });
    setDnfReasons(nr);
    patchActiveSeason({ selectedRace: race.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, offenseMap: no, fastestLapMap: nf });
    setEditingRaceName(race.raceName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteRace = (raceName) => {
    if (!activeSeason || !window.confirm(`Delete ${raceName}? This will recalculate the standings.`)) return;
    const newHistory = raceHistory.filter((r) => r.raceName !== raceName);
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly) });
    if (editingRaceName === raceName) clearInputs();
  };
  const offenseLog = raceHistory.flatMap((race) =>
    race.results.filter((r) => r.offense).map((r) => ({ raceName: race.raceName, number: r.number, name: r.name, offenseNumber: r.offenseNumber, penaltyPoints: r.penaltyPoints }))
  );
  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;
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
                <div style={{ fontSize: 30, fontWeight: 800 }}>Budweiser Cup League</div>
                <div style={{ opacity: 0.72 }}>Admin Dashboard</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["admin","overlay-ticker"].map((mode) => (
                <button key={mode} style={viewMode === mode ? activeHeaderButtonStyle : headerButtonStyle} onClick={() => setViewMode(mode)}>
                  {mode === "admin" ? "Admin" : "Ticker Overlay"}
                </button>
              ))}
              <button onClick={() => (window.location.pathname = "/standings")} style={headerButtonStyle}>
                Standings
              </button>
              <button onClick={() => (window.location.pathname = "/appeals")} style={headerButtonStyle}>
                Appeals ({openAppealCount})
              </button>
            </div>
          </div>
        </div>
        {/* Rest of admin dashboard continues... */}
        <div style={sectionCardStyle}>
          <h2>Admin Dashboard</h2>
          <p>Welcome! Select an option from the header to manage your league.</p>
        </div>
      </div>
    </div>
  );
}
