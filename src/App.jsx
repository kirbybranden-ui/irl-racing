import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoBOM from "./assets/teams/BOM.png";
import teamLogoIND from "./assets/teams/IND.png";
import manufacturerChevrolet from "./assets/manufacturers/chevrolet.png";
import manufacturerFord from "./assets/manufacturers/ford.png";
import manufacturerToyota from "./assets/manufacturers/toyota.png";
import FilesPage from "./FilesPage";
import SubmitAppealPage from "./SubmitAppealPage";
import AppealsPage from "./AppealsPage";
import DriverProfilePage from "./DriverProfilePage";
import TeamDetailPage from "./TeamDetailPage";
import ManufacturerDetailPage from "./ManufacturerDetailPage";
import WelcomePage from "./WelcomePage";
import { supabase } from "./lib/supabase";
import CarGalleryPage from "./CarGalleryPage";
import InterviewsPage from "./InterviewsPage";
// Team logos
const teamLogos = {
  "JA MOTORSPORTS": teamLogoJAM,
  JAM: teamLogoJAM,
  "ME RACING": teamLogoMER,
  MER: teamLogoMER,
  "NINE LINE MOTORSPORTS": teamLogoNLM,
  "Nine Line Motorsports": teamLogoNLM,
  NLM: teamLogoNLM,
  "MAYHEM MOTORSPORTS": teamLogoMMS,
MMS: teamLogoMMS,
  "BLUE OVAL MOTORSPORTS": teamLogoBOM, 
  BOM: teamLogoBOM,
  "Independent": teamLogoIND,
  IND: teamLogoIND,
};
const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";
// ─── Team Full Names ───────────────────────────────────────────────────────────
const teamFullNames = {
  JAM: "JA Motorsports",
  "JA MOTORSPORTS": "JA Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  Independent: "Independent",
};
function getTeamFullName(teamAbbr) {
  return teamFullNames[teamAbbr] || teamAbbr;
}
function isInactivePlaceholderDriver(driver) {
  return String(driver?.name || "").trim().toLowerCase().startsWith("inactive-");
}
const defaultDrivers = [
  { id: 1,  number: 42, name: "AMP-GHOSTRIDER",           manufacturer: "Toyota",    team: "JAM"         },
  { id: 2,  number: 99, name: "RookieVet99",               manufacturer: "Toyota",    team: "JAM"         },
  { id: 3,  number: 18, name: "bowhunter6758",             manufacturer: "Toyota",    team: "JAM"         },
  { id: 4,  number: 81, name: "HOLDEN2DX4EV3R",            manufacturer: "Chevrolet", team: "JAM"         },
  { id: 5,  number: 3,  name: "ixGusty",                   manufacturer: "Toyota",    team: "Independent" },
  { id: 6,  number: 14, name: "KapSig",                    manufacturer: "Chevrolet", team: "MER"         },
  { id: 7,  number: 24, name: "KEVDINHO7",                 manufacturer: "Chevrolet", team: "MER"         },
  { id: 8,  number: 38, name: "It's_tricky88",             manufacturer: "Chevrolet", team: "Independent" },
  { id: 9,  number: 97, name: "American_Hero216",          manufacturer: "Ford",      team: "MMS"         },
  { id: 10, number: 67, name: "tallishsinter94",           manufacturer: "Toyota",    team: "Independent" },
  { id: 11, number: 6,  name: "Highlander713",             manufacturer: "Ford",      team: "NLM"         },
  { id: 12, number: 23, name: "Orly_Revo23",               manufacturer: "Ford",      team: "MMS"         },
  { id: 13, number: 87, name: "Racingis_life87",           manufacturer: "Chevrolet", team: "MER"         },
  { id: 16, number: 9,  name: "vtfan_25",                  manufacturer: "Ford",      team: "NLM"         },
  { id: 18, number: 72, name: "abajack91",                manufacturer: "Ford",       team: "BOM"         },
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
// Current NASCAR Cup Series points system: winner = 55, 2nd = 35, then -1 per position through 35th, 36th-40th = 1 point
const pointsTable = [
  55, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  16, 15, 14, 13, 12, 11, 10, 9, 8, 7,
  6, 5, 4, 3, 2, 1, 1, 1, 1, 1,
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
      return { name, stageCount: stages, date: t?.date || null };
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
  MER: { logo: "MER", accent: "#dc2626", dark: "#200a0a", fullName: "ME Racing" },
  MMS: { logo: "MMS", accent: "#9333ea", dark: "#150a2e", fullName: "Mayhem Motorsports" },
  NLM: { logo: "NLM", accent: "#f97316", dark: "#1f0e00", fullName: "Nine Line Motorsports" },
  "Independent": { logo: "IND", accent: "#808080", dark: "#2a2a2a" },
  BOM: { logo: "BOM", accent: "#d4af37", dark: "#1b1b1b" },
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
    <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", background: `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", fontSize: size * 0.28 }}>
      {brand.logo}
    </div>
  );
}
function makeDriverWithStats(driver) {
  return { ...driver, manufacturer: driver.manufacturer || "", manufacturerLogo: driver.manufacturerLogo || manufacturerLogos[driver.manufacturer] || null, startingPoints: Number(driver.startingPoints) || 0, manualWins: Number(driver.manualWins) || 0, points: Number(driver.startingPoints) || 0, wins: Number(driver.manualWins) || 0, top3: 0, top5: 0, dnfs: 0, retired: driver.retired || false, notes: driver.notes || "" };
}
function getDriverAchievements(driver) {
  const achievements = [];
  if (driver.wins >= 1) achievements.push({ badge: "🏆", name: "First Win", condition: driver.wins >= 1 });
  if (driver.wins >= 3) achievements.push({ badge: "🥇", name: "Hat Trick", condition: driver.wins >= 3 });
  if (driver.wins >= 5) achievements.push({ badge: "👑", name: "Dominator", condition: driver.wins >= 5 });
  if (driver.top3 >= 10) achievements.push({ badge: "🎯", name: "Podium Master", condition: driver.top3 >= 10 });
  if (driver.points >= 100) achievements.push({ badge: "⭐", name: "Century Club", condition: driver.points >= 100 });
  if (driver.fastestLaps >= 5) achievements.push({ badge: "⚡", name: "Speed Demon", condition: driver.fastestLaps >= 5 });
  return achievements;
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
    return { ...baseDriver, manufacturerLogo: baseDriver.manufacturerLogo || manufacturerLogos[baseDriver.manufacturer] || null, startingPoints: Number(baseDriver.startingPoints) || 0, manualWins: Number(baseDriver.manualWins) || 0, points, wins, top3, top5, dnfs, fastestLaps, totalPenalties, retired: baseDriver.retired || false, notes: baseDriver.notes || "" };
  });
}
function makeSeasonId() { return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function createEmptySeason(name, roster = getDefaultRoster()) {
  const cleanRoster = roster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
  return { id: makeSeasonId(), name: name || "New Season", createdAt: new Date().toISOString(), drivers: rebuildDriversFromHistory([], cleanRoster), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {}, raceHistory: [] };
}
function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource = Array.isArray(season?.drivers) && season.drivers.length > 0 ? season.drivers : getDefaultRoster();
  const rosterOnly = rosterSource.map((d) => ({ id: d.id, number: Number(d.number), name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false, notes: d.notes || "" }));
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
          <tbody>{sorted.map((d, i) => <tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}>{d.manufacturer || "—"}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td></tr>)}</tbody>
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
          <tbody>{teams.map((t, i) => <tr key={t.team} onClick={() => (window.location.href = `/team/${t.team}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{getTeamFullName(t.team)}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
function PublicStandings({ drivers, teams, manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [] }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const handleDriverClick = (number) => {
    window.location.pathname = `/driver/${number}`;
  };
  useEffect(() => {
    async function loadFeaturedVideo() {
      const { data } = await supabase
        .from("featured_video")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setFeaturedVideo(data || null);
    }
    loadFeaturedVideo();
  }, []);
  const sorted = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const [leader, second, third] = sorted;
  const totalPoints = sorted.reduce((s, d) => s + (d.points || 0), 0);
  const totalWins = sorted.reduce((s, d) => s + (d.wins || 0), 0);
  const totalDnfs = sorted.reduce((s, d) => s + (d.dnfs || 0), 0);
  // Sort tracks by date, mark completed ones
  const completedRaces = new Set((raceHistory || []).map(r => r.raceName));
  const sortedTracks = [...tracks].sort((a, b) => {
    if (a.date && b.date) return new Date(a.date) - new Date(b.date);
    return 0;
  });
  const nextRace = sortedTracks.find(t => !completedRaces.has(t.name));
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
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 18 }}>{getTeamFullName(driver.team)}</div>
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
          style={{ width: "100%", background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          View Full Profile
        </button>
      </div>
    );
  };
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: 24 }}>
        {/* ── Featured Video Banner ──────────────────────────────────── */}
        {featuredVideo && (
          <div style={{ background: "linear-gradient(135deg, #12151c 0%, #0c0f14 100%)", border: "1px solid #d4af37", borderRadius: 20, overflow: "hidden", marginBottom: 22, boxShadow: "0 14px 40px rgba(212,175,55,0.15)" }}>
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <span style={{ fontSize: 18 }}>🎬</span>
              <div style={{ flex: 1 }}>
                {featuredVideo.title && <div style={{ fontSize: 16, fontWeight: 800 }}>{featuredVideo.title}</div>}
                {featuredVideo.description && <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>{featuredVideo.description}</div>}
              </div>
              <div style={{ fontSize: 11, opacity: 0.45 }}>{new Date(featuredVideo.uploaded_at).toLocaleDateString()}</div>
            </div>
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
              {featuredVideo.video_url.includes("youtube.com") || featuredVideo.video_url.includes("youtu.be") ? (
                <iframe
                  src={featuredVideo.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : featuredVideo.video_url.includes("twitch.tv") ? (
                <iframe
                  src={`https://player.twitch.tv/?video=${featuredVideo.video_url.split("/").pop()}&parent=${window.location.hostname}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  crossOrigin="anonymous"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                  src={featuredVideo.video_url}
                />
              )}
            </div>
          </div>
        )}
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
          {/* Schedule tile */}
          <div
            onClick={() => setScheduleOpen(true)}
            style={{ background: "linear-gradient(135deg, #131922 0%, #0f141b 100%)", border: "1px solid #d4af37", borderRadius: 18, padding: 18, boxShadow: "0 10px 24px rgba(0,0,0,0.18)", cursor: "pointer", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
            <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>🏁 SCHEDULE</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
              {nextRace ? nextRace.name : "Season Complete"}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              {nextRace?.date ? new Date(nextRace.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
            </div>
            <div style={{ fontSize: 11, color: "#d4af37", marginTop: 6, fontWeight: 700 }}>View full schedule →</div>
          </div>
        </div>
        {/* Schedule modal */}
        {scheduleOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>🏁 Race Schedule</div>
                <button onClick={() => setScheduleOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sortedTracks.map((track, i) => {
                  const completed = completedRaces.has(track.name);
                  const isNext = track.name === nextRace?.name;
                  return (
                    <div key={track.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 12, background: isNext ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${isNext ? "#d4af37" : completed ? "#1a3a1a" : "#1e2530"}` }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: completed ? "#16a34a" : isNext ? "#d4af37" : "#1e2530", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: completed || isNext ? "#000" : "#666", flexShrink: 0 }}>
                        {completed ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: completed ? "#4ade80" : isNext ? "#d4af37" : "white" }}>{track.name}</div>
                        {track.date && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{new Date(track.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: completed ? "#4ade80" : isNext ? "#f59e0b" : "#555" }}>
                        {completed ? "COMPLETE" : isNext ? "NEXT" : "UPCOMING"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
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
                      <td style={tdStyle}>{getTeamFullName(driver.team)}</td>
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
        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Team Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Logo</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.team} onClick={() => (window.location.href = `/team/${team.team}`)} style={{ cursor: "pointer" }}>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{index + 1}</td>
                    <td style={tdStyle}>{renderTeamBadge(team.team, 42)}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{getTeamFullName(team.team)}</td>
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
                    <tr key={m.manufacturer} onClick={() => (window.location.href = `/manufacturer/${encodeURIComponent(m.manufacturer)}`)} style={{ cursor: "pointer" }}>
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
    ...teams.map((t, i) => `Team ${i+1}: ${getTeamFullName(t.team)} - ${t.points} pts`),
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
// ─── Patch any drivers from defaultDrivers that are missing from saved seasons ─
// This runs once after Supabase load so new roster additions always appear
// even when a season already exists in the database.
function patchMissingDrivers(cleanSeasons) {
  return cleanSeasons.map((season) => {
    const existingIds  = new Set(season.drivers.map((d) => d.id));
    const existingNums = new Set(season.drivers.map((d) => String(d.number)));
    const missing = defaultDrivers.filter(
      (d) => !existingIds.has(d.id) && !existingNums.has(String(d.number))
    );
    // Update any drivers whose name/number/manufacturer/team has changed in defaultDrivers
    const updatedDrivers = season.drivers
      .filter((d) => !isInactivePlaceholderDriver(d))
      .map((d) => {
        const canonical = defaultDrivers.find((dd) => dd.id === d.id);
        let updatedTeam = d.team === "KRM" ? "MER" : d.team;
        if (!canonical) {
          return { ...d, team: updatedTeam };
        }
        return {
          ...d,
          name: canonical.name,
          number: canonical.number,
          manufacturer: canonical.manufacturer,
          team: canonical.team === "KRM" ? "MER" : canonical.team,
        };
      });
    if (missing.length === 0 && updatedDrivers.every((d, i) => d === season.drivers[i])) return season;
    const newRoster = [
      ...updatedDrivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false, notes: d.notes || "" })),
      ...missing.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: false, notes: "" })),
    ];
    return { ...season, drivers: rebuildDriversFromHistory(season.raceHistory || [], newRoster) };
  });
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
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const videoFileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const rawPath = window.location.pathname;
  const path = rawPath.toLowerCase();
  // ─── Computed values (must be before all hooks) ───────────────────────────
  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
  const drivers = activeSeason?.drivers || [];
  const visibleDrivers = drivers.filter((d) => !isInactivePlaceholderDriver(d));
  const activeDrivers = visibleDrivers.filter((d) => !d.retired);
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
  // ─── ALL useEffect hooks (must be before any early returns) ───────────────
  useEffect(() => {
    let isMounted = true;
    async function hydrateFromSupabase() {
      try {
        const savedState = await loadLeagueState();
        if (!isMounted) return;
        if (savedState?.seasons && Array.isArray(savedState.seasons)) {
          let cleanSeasons = savedState.seasons.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
          cleanSeasons = patchMissingDrivers(cleanSeasons);
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
    // Poll every 3s on live pages so stats stay current without a manual refresh
    if (path === "/standings" || path.startsWith("/driver/") || path === "/overlay/drivers" || path === "/overlay/teams" || path === "/overlay/ticker") {
      interval = setInterval(hydrateFromSupabase, 3000);
    }
    return () => { isMounted = false; if (interval) clearInterval(interval); };
  }, []);
  useEffect(() => {
    async function loadOpenAppeals() {
      const { count, error } = await supabase
        .from("appeals")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");
      if (!error) setOpenAppealCount(count || 0);
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
      if (!error && data) setPendingDrivers(data);
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
  useEffect(() => {
    async function loadFeaturedVideo() {
      const { data } = await supabase
        .from("featured_video")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setFeaturedVideo(data || null);
    }
    loadFeaturedVideo();
  }, []);
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
  useEffect(() => {
    const nextNotes = {};
    (activeSeason?.drivers || []).forEach((d) => { nextNotes[d.id] = d.notes || ""; });
    setDriverNotes(nextNotes);
  }, [activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const nextReasons = {};
    (activeSeason?.drivers || []).forEach((d) => { nextReasons[d.id] = ""; });
    setDnfReasons(nextReasons);
  }, [selectedRace, activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps
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
    for (const d of visibleDrivers) {
      if (!teams[d.team]) teams[d.team] = { team: d.team, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      teams[d.team].points += d.points || 0; teams[d.team].wins += d.wins || 0;
      teams[d.team].top3 += d.top3 || 0; teams[d.team].top5 += d.top5 || 0; teams[d.team].drivers += 1;
    }
    return Object.values(teams).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.team.localeCompare(b.team));
  }, [visibleDrivers]);
  const manufacturerStandings = useMemo(() => {
    const mfrs = {};
    for (const d of visibleDrivers) {
      const mfr = d.manufacturer || "Unknown";
      if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      mfrs[mfr].points += d.points || 0; mfrs[mfr].wins += d.wins || 0;
      mfrs[mfr].top3 += d.top3 || 0; mfrs[mfr].top5 += d.top5 || 0; mfrs[mfr].drivers += 1;
    }
    return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.manufacturer.localeCompare(b.manufacturer));
  }, [visibleDrivers]);
  const sortedDrivers = [...visibleDrivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
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
      // Add to active season
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
      // Update pending driver status to approved
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
  // Static pages (no Supabase data needed)
  if (path === "/files") return <FilesPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/appeals") return <AppealsPage />;
  // Loading gate — all routes below this need Supabase data
  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;
  if (path === "/admin/car-gallery") return <CarGalleryPage drivers={drivers} tracks={tracks} />;
  if (path === "/admin/interviews") return <InterviewsPage drivers={drivers} tracks={tracks} seasons={seasons} activeSeasonId={activeSeasonId} />;
  // Team detail page
  if (path.startsWith("/team/")) {
    const abbr = decodeURIComponent(rawPath.replace(/^\/team\//i, "").split("/")[0]);
    return (
      <TeamDetailPage
        drivers={visibleDrivers}
        teams={teamStandings}
        teamStandings={teamStandings}
        standings={teamStandings}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        initialTeam={abbr}
        selectedTeam={abbr}
      />
    );
  }

  // Manufacturer detail page
  if (path.startsWith("/manufacturer/")) {
    const mfrName = decodeURIComponent(
      rawPath.replace(/^\/manufacturer\//i, "").split("/")[0]
    );
    return (
      <ManufacturerDetailPage
        drivers={visibleDrivers}
        manufacturers={manufacturerStandings}
        manufacturerStandings={manufacturerStandings}
        standings={manufacturerStandings}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        initialManufacturer={mfrName}
        selectedManufacturer={mfrName}
      />
    );
  }
  if (path.startsWith("/driver/")) return <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />;
  if (path === "/standings") return <PublicStandings drivers={visibleDrivers} teams={teamStandings} manufacturerStandings={manufacturerStandings} seasonName={activeSeason?.name || ""} tracks={tracks} raceHistory={raceHistory} />;
  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") return <TickerOverlay drivers={visibleDrivers} teams={teamStandings} raceHistory={raceHistory} preview={viewMode === "overlay-ticker"} seasonName={activeSeason?.name || ""} />;
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
              <button onClick={() => (window.location.pathname = "/admin/car-gallery")} style={headerButtonStyle}>
                Car Gallery
              </button>
              <button onClick={() => (window.location.pathname = "/admin/interviews")} style={headerButtonStyle}>
                🎙️ Interviews
              </button>
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
        {/* Featured Video */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>🎬 Featured Video</h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            Upload a pre-race hype video or race highlight. It appears at the top of the /standings page. Replaces any existing featured video.
          </div>
          {featuredVideo && (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{featuredVideo.title || "Untitled Video"}</div>
                  {featuredVideo.description && <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{featuredVideo.description}</div>}
                  <div style={{ fontSize: 11, opacity: 0.45 }}>Published {new Date(featuredVideo.uploaded_at).toLocaleString()}</div>
                </div>
                <button
                  style={dangerButtonStyle}
                  onClick={async () => {
                    if (!window.confirm("Remove the featured video from standings?")) return;
                    // Delete from storage if it's a Supabase file
                    if (featuredVideo.file_path) {
                      await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]);
                    }
                    await supabase.from("featured_video").delete().eq("id", featuredVideo.id);
                    setFeaturedVideo(null);
                  }}
                >
                  Remove
                </button>
              </div>
              <video controls crossOrigin="anonymous" style={{ width: "100%", maxHeight: 240, borderRadius: 8, background: "#000" }} src={featuredVideo.video_url} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Title (optional)</div>
              <input style={inputStyle} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. Preseason Michigan Highlights" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Description (optional)</div>
              <input style={inputStyle} value={videoDescription} onChange={e => setVideoDescription(e.target.value)} placeholder="e.g. Race recap — Season 1 opener" />
            </div>
          </div>
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/mp4,video/mov,video/quicktime,video/avi,video/webm"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setVideoUploading(true);
              try {
                const fileExt = file.name.split(".").pop();
                const fileName = `featured-${Date.now()}.${fileExt}`;
                const filePath = `featured/${fileName}`;
                // Upload to Supabase Storage
                const { error: storageError } = await supabase.storage
                  .from("car-uploads")
                  .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type || "video/mp4",
                  });
                if (storageError) throw storageError;
                const { data: urlData } = supabase.storage
                  .from("car-uploads")
                  .getPublicUrl(filePath);
                // Remove existing featured video
                if (featuredVideo) {
                  if (featuredVideo.file_path) await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]);
                  await supabase.from("featured_video").delete().eq("id", featuredVideo.id);
                }
                // Save to DB
                const { data: saved, error: dbError } = await supabase.from("featured_video").insert({
                  video_url: urlData.publicUrl,
                  file_path: filePath,
                  title: videoTitle.trim() || null,
                  description: videoDescription.trim() || null,
                  uploaded_at: new Date().toISOString(),
                }).select().single();
                if (dbError) throw dbError;
                setFeaturedVideo(saved);
                setVideoTitle(""); setVideoDescription("");
                alert("✅ Video uploaded and published to /standings!");
              } catch (err) {
                console.error("Video upload error:", err);
                alert(`Upload failed: ${err.message}`);
              }
              setVideoUploading(false);
              if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            }}
          />
          <button
            style={{ ...primaryButtonStyle, opacity: videoUploading ? 0.6 : 1 }}
            disabled={videoUploading}
            onClick={() => videoFileInputRef.current?.click()}
          >
            {videoUploading ? "⏳ Uploading..." : "📁 Choose Video File"}
          </button>
          {videoUploading && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>Uploading — large files may take a moment...</div>
          )}
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
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}><input type="number" style={inputStyle} value={startingPointsInputs[d.id] ?? "0"} onChange={(e) => setStartingPointsInputs((p) => ({ ...p, [d.id]: e.target.value }))} /></td><td style={{ ...tdStyle, fontWeight: 800 }}>{d.points}</td></tr>))}</tbody>
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
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}><input type="number" style={inputStyle} value={manualWinsInputs[d.id] ?? "0"} onChange={(e) => setManualWinsInputs((p) => ({ ...p, [d.id]: e.target.value }))} /></td><td style={{ ...tdStyle, fontWeight: 800 }}>{d.wins}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Driver Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Management</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Enter driver name" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={newDriverNumber} onChange={(e) => setNewDriverNumber(e.target.value)} placeholder="Enter car number" type="number" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Manufacturer</div><select style={inputStyle} value={newDriverManufacturer} onChange={(e) => setNewDriverManufacturer(e.target.value)}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={newDriverTeam} onChange={(e) => setNewDriverTeam(e.target.value)} placeholder="e.g. JAM, MER, KRM, MMS" /></div>
          </div>
          <div style={{ marginBottom: 18 }}><button onClick={addDriver} style={primaryButtonStyle}>Add Driver</button></div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.manufacturer || "—"}</td><td style={tdStyle}>{getTeamFullName(d.team)} <span style={{ fontSize: 11, opacity: 0.55 }}>({d.team})</span></td><td style={tdStyle}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => openEditDriver(d)} style={secondaryButtonStyle}>Edit</button>{d.retired ? (<button onClick={() => unretireDriver(d.id)} style={secondaryButtonStyle}>Unretire</button>) : (<button onClick={() => retireDriver(d.id)} style={{ ...secondaryButtonStyle, color: "#f59e0b", borderColor: "#f59e0b" }}>Retire</button>)}<button onClick={() => removeDriver(d.id)} style={dangerButtonStyle}>Remove</button></div></td></tr>))}</tbody>
            </table>
          </div>
          {editingDriverId && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #313947" }}>
              <h3 style={{ marginTop: 0 }}>Edit Driver</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={editDriverForm.name} onChange={(e) => setEditDriverForm({ ...editDriverForm, name: e.target.value })} /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={editDriverForm.number} onChange={(e) => setEditDriverForm({ ...editDriverForm, number: e.target.value })} type="number" /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Manufacturer</div><select style={inputStyle} value={editDriverForm.manufacturer} onChange={(e) => setEditDriverForm({ ...editDriverForm, manufacturer: e.target.value })}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={editDriverForm.team} onChange={(e) => setEditDriverForm({ ...editDriverForm, team: e.target.value })} placeholder="e.g. JAM, MER, KRM, MMS" /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}><button onClick={saveDriverEdit} style={primaryButtonStyle}>Save Changes</button><button onClick={cancelEditDriver} style={secondaryButtonStyle}>Cancel</button></div>
            </div>
          )}
        </div>
        {/* Driver Notes Manager */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Notes</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Add performance notes, observations, or reminders for each driver.</div>
          <div style={{ display: "grid", gap: 14 }}>
            {drivers.map((d) => (
              <div key={d.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>#{d.number} {d.name} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 12 }}>— {getTeamFullName(d.team)}</span></div>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={driverNotes[d.id] || ""}
                  onChange={(e) => setDriverNotes({ ...driverNotes, [d.id]: e.target.value })}
                  placeholder="Add notes about this driver..."
                />
              </div>
            ))}
          </div>
          <button onClick={saveDriverNotes} style={{ ...primaryButtonStyle, marginTop: 16 }}>Save All Notes</button>
        </div>
        {/* Pending Driver Signups */}
        {pendingDrivers.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Pending Driver Signups ({pendingDrivers.length})</h2>
            <div style={{ opacity: 0.78, marginBottom: 14 }}>New drivers have submitted their information. Review and approve them to add to the league.</div>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Driver Name</th><th style={thStyle}>#</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team</th><th style={thStyle}>Submitted</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {pendingDrivers.map((d) => (
                    <tr key={d.id}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{d.driver_name}</td>
                      <td style={tdStyle}>{d.car_number}</td>
                      <td style={tdStyle}>{d.manufacturer}</td>
                      <td style={tdStyle}>{d.team_name}</td>
                      <td style={{ ...tdStyle, fontSize: 12, opacity: 0.8 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => approvePendingDriver(d)} style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Approve</button>
                          <button onClick={() => rejectPendingDriver(d)} style={{ ...dangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Track Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Track Management</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Add or remove tracks from the race schedule. Stage count controls how many scoring stages each track has (1, 2, or 3).</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Track Name</div><input style={inputStyle} value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Example: Bristol Night Race" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Stage Count</div><select style={inputStyle} value={newTrackStageCount} onChange={(e) => setNewTrackStageCount(Number(e.target.value))}><option value={1}>1 stage</option><option value={2}>2 stages</option><option value={3}>3 stages</option></select></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <button onClick={addTrack} style={primaryButtonStyle}>Add Track</button>
            <button onClick={restoreDefaultTracks} style={secondaryButtonStyle}>Restore Default Schedule</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Track Name</th><th style={thStyle}>Stage Count</th><th style={thStyle}>Used in History?</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={4}><div style={{ opacity: 0.75 }}>No tracks defined. Add one above or restore the default schedule.</div></td></tr>
                ) : tracks.map((t) => {
                  const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === t.name));
                  return (
                    <tr key={t.name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{t.name}</td>
                      <td style={tdStyle}>
                        <select style={{ ...inputStyle, maxWidth: 160 }} value={t.stageCount} onChange={(e) => updateTrackStageCount(t.name, e.target.value)}>
                          <option value={1}>1 stage</option>
                          <option value={2}>2 stages</option>
                          <option value={3}>3 stages</option>
                        </select>
                      </td>
                      <td style={tdStyle}>{usedInHistory ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>Yes</span> : <span style={{ opacity: 0.7 }}>No</span>}</td>
                      <td style={tdStyle}><button onClick={() => removeTrack(t.name)} style={dangerButtonStyle}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Enter Race Results */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingRaceName ? `Edit Race: ${editingRaceName}` : "Enter Race Results"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race</label>
              <select style={inputStyle} value={selectedRace} onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}>
                <option value="">Select a race</option>
                {tracks.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Stage Setup</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", minHeight: 42 }}>{selectedRace ? `${stageCount} scoring stage${stageCount === 1 ? "" : "s"}` : "Select a race to view stage count"}</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th>
                  <th style={thStyle}>Finish</th>
                  {stageCount >= 1 && <th style={thStyle}>Stage 1</th>}
                  {stageCount >= 2 && <th style={thStyle}>Stage 2</th>}
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
                      <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{driver.number}</div></td>
                      <td style={tdStyle}>{driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team)} <span style={{ fontSize: 11, opacity: 0.5 }}>({driver.team})</span></td>
                      <td style={tdStyle}><input type="number" min="1" max="40" style={inputStyle} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} /></td>
                      {stageCount >= 1 && <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} /></td>}
                      {stageCount >= 2 && <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} /></td>}
                      {stageCount === 3 && <td style={tdStyle}><input type="number" min="1" max="10" style={inputStyle} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} /></td>}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" checked={!!dnfMap[driver.id]} onChange={(e) => handleDnfChange(driver.id, e.target.checked)} />DNF
                          </label>
                          {dnfMap[driver.id] && (
                            <select
                              style={{ ...inputStyle, fontSize: 12, padding: "6px 8px" }}
                              value={dnfReasons[driver.id] || ""}
                              onChange={(e) => setDnfReasons({ ...dnfReasons, [driver.id]: e.target.value })}
                            >
                              <option value="">Select reason...</option>
                              <option value="Mechanical">Mechanical Failure</option>
                              <option value="Crash">Crash/Incident</option>
                              <option value="Engine">Engine Failure</option>
                              <option value="Transmission">Transmission Issue</option>
                              <option value="Fuel">Fuel System</option>
                              <option value="Suspension">Suspension Damage</option>
                              <option value="Pit Stop">Pit Stop Error</option>
                              <option value="Other">Other</option>
                            </select>
                          )}
                        </div>
                      </td>
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
              <tbody>{sortedDrivers.map((d, i) => (<tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}{d.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td><td style={tdStyle}>{d.dnfs || 0}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Team Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>{teamStandings.map((t, i) => (<tr key={t.team} onClick={() => (window.location.href = `/team/${t.team}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{getTeamFullName(t.team)}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td><td style={tdStyle}>{t.drivers}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Manufacturer Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Manufacturer Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>{manufacturerStandings.map((m, i) => (<tr key={m.manufacturer} onClick={() => (window.location.href = `/manufacturer/${encodeURIComponent(m.manufacturer)}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{m.manufacturer}</td><td style={tdStyle}>{m.points}</td><td style={tdStyle}>{m.wins}</td><td style={tdStyle}>{m.top3}</td><td style={tdStyle}>{m.top5}</td><td style={tdStyle}>{m.drivers}</td></tr>))}</tbody>
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
                        <div style={{ opacity: 0.75 }}>{race.stageCount} scoring stage{race.stageCount === 1 ? "" : "s"}{winner ? ` • Winner: #${winner.number} ${winner.name}` : ""}</div>
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
                            <th style={thStyle}>Race Pts</th>
                            {race.stageCount >= 1 && <th style={thStyle}>S1</th>}
                            {race.stageCount >= 2 && <th style={thStyle}>S2</th>}
                            {race.stageCount === 3 && <th style={thStyle}>S3</th>}
                            <th style={thStyle}>FL</th><th style={thStyle}>DNF</th>
                            <th style={thStyle}>Offense</th><th style={thStyle}>Penalty</th><th style={thStyle}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.results.map((r) => (
                            <tr key={r.driverId}>
                              <td style={tdStyle}>{r.finishPos ?? "—"}</td>
                              <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{r.number}</div></td>
                              <td style={tdStyle}>{r.name}</td>
                              <td style={tdStyle}>{getTeamFullName(r.team)}</td>
                              <td style={tdStyle}>{r.finishPoints}</td>
                              {race.stageCount >= 1 && <td style={tdStyle}>{r.stage1Points}</td>}
                              {race.stageCount >= 2 && <td style={tdStyle}>{r.stage2Points}</td>}
                              {race.stageCount === 3 && <td style={tdStyle}>{r.stage3Points}</td>}
                              <td style={tdStyle}>{r.fastestLap ? "+1" : "—"}</td>
                              <td style={tdStyle}>{r.dnf ? (r.dnfReason ? `DNF (${r.dnfReason})` : "DNF") : "—"}</td>
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
