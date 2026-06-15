import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo1.png";
import storySubmittedKick from "./assets/story-submitted-kick.png";
import teamLogoB2J from "./assets/teams/B2J.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoBOM from "./assets/teams/BOM.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import teamLogoBWR from "./assets/teams/BWR.png";
import teamLogoKDM from "./assets/teams/KDM.png";
import teamLogoBXM from "./assets/teams/BXM.png";
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
import PaintSchemeVotePage from "./PaintSchemeVotePage";
import InterviewsPage from "./InterviewsPage";
import PublicInterviewsPage from "./InterviewsPage_public_interview_center";
import NewsPage from "./NewsPage";
import NotificationsPage from "./NotificationsPage";
import StreamPage from "./pages/StreamPage";
import LeagueChatPage from "./LeagueChatPage";
import OwnersPage from "./OwnersPage.jsx";
// Team logos
const teamLogos = {
  "B2J MOTORSPORTS": teamLogoB2J,
  B2J: teamLogoB2J,
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
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  "Big Wheel Racing": teamLogoBWR,
  BWR: teamLogoBWR,
  "ME Racing": teamLogoMER,
  KDM: teamLogoMER,
  BMX: teamLogoBXM,
  BXM: teamLogoBXM,
  "BayouX Motorsports": teamLogoBXM,
};
const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";
// ─── Team Full Names ───────────────────────────────────────────────────────────
const teamFullNames = {
  B2J: "B2J Motorsports",
  "B2J MOTORSPORTS": "B2J Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt Sick6 Motorsports",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
  BWR: "Big Wheel Racing",
  KDM: "ME Racing",
  BMX: "BayouX Motorsports",
  BXM: "BayouX Motorsports",
  "BayouX Motorsports": "BayouX Motorsports",
  Independent: "Independent",
};
const teamBudgets = {
  B2J: 3500000,
  "B2J MOTORSPORTS": 3500000,
};

const INDEPENDENT_DRIVER_BASE_SALARY = 250000;
const LEAGUE_BANK_NAME = "Budweiser Cup League";
const APP_VERSION = "v1.7.3";

function getTeamBudget(teamAbbr) {
  return teamBudgets[teamAbbr] || teamBudgets[getTeamFullName(teamAbbr)?.toUpperCase?.()] || 0;
}

function getTeamFullName(teamAbbr) {
  return teamFullNames[teamAbbr] || teamAbbr;
}

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
function isInactivePlaceholderDriver(driver) {
  return String(driver?.name || "").trim().toLowerCase().startsWith("inactive-");
}

const removedDriverNumbers = new Set(["16", "66"]);
const removedDriverIds = new Set([13, 28, 66]);
const removedDriverNames = new Set(["vtfan_25", "undeadhelliday", "racingis_life87", "vanilla04gorilla"]);
const closedTeamKeys = new Set(["WSM", "WYATT SICK6 MOTORSPORTS", "Wyatt Sick6 Motorsports"]);

function isRemovedLeagueDriver(driver) {
  const numberKey = String(driver?.number ?? driver?.driver_number ?? "").trim();
  const idKey = Number(driver?.id ?? driver?.driver_id);
  const nameKey = String(driver?.name ?? driver?.driver_name ?? "").trim().toLowerCase();
  return removedDriverNumbers.has(numberKey) || removedDriverIds.has(idKey) || removedDriverNames.has(nameKey);
}

function isClosedLeagueTeam(team) {
  return closedTeamKeys.has(String(team || "").trim());
}

function realignLeagueDriver(driver) {
  if (!driver || isRemovedLeagueDriver(driver)) return null;
  const id = Number(driver.id ?? driver.driver_id);
  const nameKey = String(driver.name ?? driver.driver_name ?? "").trim().toLowerCase();

  if (id === 6 || nameKey === "kapsig") {
    return { ...driver, number: 14, team: "MER", manufacturer: "Chevrolet", manufacturerLogo: manufacturerLogos.Chevrolet || driver.manufacturerLogo };
  }
  if (id === 7 || id === 46 || nameKey === "kevdinho7" || nameKey === "bigdiehl21") {
    return { ...driver, team: "MER", manufacturer: "Chevrolet", manufacturerLogo: manufacturerLogos.Chevrolet || driver.manufacturerLogo };
  }
  if (id === 5 || nameKey === "ixgusty") {
    return { ...driver, number: 3, team: "19XI", manufacturer: "Toyota", manufacturerLogo: manufacturerLogos.Toyota || driver.manufacturerLogo };
  }
  if (id === 21 || nameKey === "yinzermob_86") {
    return { ...driver, number: 86, team: "MER", manufacturer: "Chevrolet", manufacturerLogo: manufacturerLogos.Chevrolet || driver.manufacturerLogo };
  }
  if (id === 34 || nameKey === "cajunthrottle28") {
    return { ...driver, number: 48, driver_number: driver.driver_number !== undefined ? 48 : driver.driver_number, team: "BXM", manufacturer: "Chevrolet", manufacturerLogo: manufacturerLogos.Chevrolet || driver.manufacturerLogo };
  }
  if (id === 54 || id === 35 || id === 102 || ["thecruiser54", "knighttrain41", "ghostracer388"].includes(nameKey)) {
    return { ...driver, team: "BXM", manufacturer: "Chevrolet", manufacturerLogo: manufacturerLogos.Chevrolet || driver.manufacturerLogo };
  }
  if (isClosedLeagueTeam(driver.team)) return { ...driver, team: "Independent" };
  return driver;
}

function realignLeagueDrivers(drivers = []) {
  return (Array.isArray(drivers) ? drivers : []).map(realignLeagueDriver).filter(Boolean);
}

function filterRemovedLeagueDrivers(drivers = []) {
  return Array.isArray(drivers) ? drivers.filter((driver) => !isRemovedLeagueDriver(driver)) : [];
}

function dedupeDriversByNumber(drivers) {
  if (!Array.isArray(drivers)) return [];
  drivers = filterRemovedLeagueDrivers(drivers);
  const preferredNamesByNumber = {
    80: "gumby_1919",
  };

  const byNumber = new Map();

  drivers.forEach((driver) => {
    if (!driver || driver.number === undefined || driver.number === null) return;
    const numberKey = String(Number(driver.number));
    const preferredName = preferredNamesByNumber[numberKey];
    const current = byNumber.get(numberKey);

    if (!current) {
      byNumber.set(numberKey, driver);
      return;
    }

    const driverName = String(driver.name || "").trim().toLowerCase();
    const currentName = String(current.name || "").trim().toLowerCase();

    if (preferredName && driverName === preferredName.toLowerCase()) {
      byNumber.set(numberKey, driver);
      return;
    }

    if (preferredName && currentName === preferredName.toLowerCase()) {
      return;
    }

    const driverHasData =
      Number(driver.points || 0) !== 0 ||
      Number(driver.wins || 0) !== 0 ||
      Number(driver.top3 || 0) !== 0 ||
      Number(driver.top5 || 0) !== 0 ||
      Number(driver.dnfs || 0) !== 0 ||
      Number(driver.fastestLaps || 0) !== 0 ||
      Number(driver.totalPenalties || 0) !== 0;

    const currentHasData =
      Number(current.points || 0) !== 0 ||
      Number(current.wins || 0) !== 0 ||
      Number(current.top3 || 0) !== 0 ||
      Number(current.top5 || 0) !== 0 ||
      Number(current.dnfs || 0) !== 0 ||
      Number(current.fastestLaps || 0) !== 0 ||
      Number(current.totalPenalties || 0) !== 0;

    if (driverHasData && !currentHasData) {
      byNumber.set(numberKey, driver);
    }
  });

  return Array.from(byNumber.values());
}

const defaultDrivers = [
  { id: 1,  number: 42, name: "AMP-GHOSTRIDER",           manufacturer: "Toyota",    team: "B2J", retired: true },
  { id: 2,  number: 99, name: "RookieVet99",               manufacturer: "Toyota",    team: "B2J"         },
  { id: 3,  number: 18, name: "bowhunter6758",             manufacturer: "Toyota",    team: "B2J"         },
  { id: 4,  number: 81, name: "HOLDEN2DX4EV3R",            manufacturer: "Toyota",    team: "B2J"         },
  { id: 6,  number: 14, name: "KapSig",                    manufacturer: "Chevrolet", team: "MER"         },
  { id: 9,  number: 19, name: "American_Hero216",          manufacturer: "Toyota",    team: "19XI"        },
  { id: 10, number: 67, name: "tallishsinter94",           manufacturer: "Toyota",    team: "19XI"        },
  { id: 5,  number: 3,  name: "ixGusty",                   manufacturer: "Toyota",    team: "19XI"        },
  { id: 34, number: 48, name: "CaJunThrottle28",           manufacturer: "Chevrolet", team: "BXM"         },
  { id: 54, number: 54, name: "TheCruiser54",              manufacturer: "Chevrolet", team: "BXM"         },
  { id: 35, number: 41, name: "KnightTrain41",             manufacturer: "Chevrolet", team: "BXM"         },
  { id: 102, number: 2, name: "Ghostracer388",             manufacturer: "Chevrolet", team: "BXM"         },
  { id: 7,  number: 24, name: "KEVDINHO7",                 manufacturer: "Chevrolet", team: "MER"         },
  { id: 46, number: 39, name: "BigDiehl21",                manufacturer: "Chevrolet", team: "MER"         },
  { id: 21, number: 86, name: "YinZerMOB_86",              manufacturer: "Chevrolet", team: "MER"         },
  { id: 8,  number: 38, name: "It's_tricky88",             manufacturer: "Chevrolet", team: "Independent", retired: true },
  { id: 11, number: 6,  name: "Highlander713",             manufacturer: "Ford",      team: "NLM"         },
  { id: 24, number: 21, name: "kevron-75",                 manufacturer: "Ford",      team: "NLM"         },
  { id: 23, number: 28, name: "Y2JTolbert",                manufacturer: "Ford",      team: "NLM"         },
  { id: 18, number: 72, name: "abajack91",                 manufacturer: "Ford",      team: "NLM"         },
  { id: 26, number: 7,  name: "gunszmb",                   manufacturer: "Ford",      team: "BWR"         },
  { id: 27, number: 97, name: "JPC_Racing",                manufacturer: "Ford",      team: "BWR"         },
  { id: 51, number: 51, name: "MARE951",                   manufacturer: "Ford",      team: "BWR"         },
  { id: 12, number: 23, name: "Orly_Revo23",               manufacturer: "Ford",      team: "MMS", retired: true },
  { id: 25, number: 80, name: "gumby_1919",                manufacturer: "Ford",      team: "MMS", retired: true },
];
const defaultRaces = [
  { name: "Preseason - Michigan", stageCount: 2, date: "2026-04-25" },
  { name: "Preseason - Dover", stageCount: 2, date: "2026-05-02" },
  { name: "Preseason - EchoPark Speedway", stageCount: 2, date: "2026-05-09" },
  { name: "Daytona (Night)", stageCount: 2, date: "2026-05-16" },
  { name: "Charlotte", stageCount: 3, date: "2026-05-23" },
  { name: "Nashville", stageCount: 2, date: "2026-05-30" },
  { name: "Michigan", stageCount: 2, date: "2026-06-06" },
  { name: "Pocono", stageCount: 2, date: "2026-06-13" },
  { name: "Bristol (Night)", stageCount: 2, date: "2026-06-20" },
  { name: "Las Vegas", stageCount: 2, date: "2026-06-27" },
  { name: "Talladega", stageCount: 2, date: "2026-07-11" },
  { name: "North Wilkesboro", stageCount: 2, date: "2026-07-18" },
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
function normalizeTrackName(name) {
  const raw = String(name || "").trim();
  const key = raw.toLowerCase();
  if (key === "preseason - wwt raceway" || key === "preseason - world wide technology raceway") {
    return "Preseason - EchoPark Speedway";
  }
  if (key === "wwt raceway" || key === "world wide technology raceway") {
    return "EchoPark Speedway";
  }
  if (key === "preseason - echpark speedway" || key === "preseason - echopark speedway") {
    return "Preseason - EchoPark Speedway";
  }
  if (key === "echpark speedway" || key === "echopark speedway") {
    return "EchoPark Speedway";
  }
  return raw;
}

function getEasternDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}


function getEasternNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

function getStartParkCutoffInfo(raceDate, now = new Date()) {
  if (!raceDate) return { closed: false, label: "Race date unavailable", dateKey: "", hour: 21, minute: 0 };
  const cutoffDateKey = String(raceDate).slice(0, 10);
  const easternNow = getEasternNowParts(now);
  const closed = easternNow.dateKey > cutoffDateKey ||
    (easternNow.dateKey === cutoffDateKey && (easternNow.hour > 21 || (easternNow.hour === 21 && easternNow.minute >= 0)));
  return {
    closed,
    label: `Deadline: Saturday ${cutoffDateKey} at 9:00 PM ET`,
    dateKey: cutoffDateKey,
    hour: 21,
    minute: 0,
  };
}

function wasStartParkRequestBeforeCutoff(request) {
  const raceDate = request?.race_date || request?.raceDate || "";
  const createdAt = request?.created_at || request?.createdAt || "";
  if (!raceDate || !createdAt) return true;
  const cutoffKey = `${String(raceDate).slice(0, 10)} 21:00`;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(createdAt));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const createdKey = `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
  return createdKey < cutoffKey;
}

function hasRaceRolledOver(track, date = new Date()) {
  if (!track?.date) return false;

  const easternNow = getEasternDateParts(date);
  const raceDate = String(track.date).slice(0, 10);

  if (easternNow.dateKey > raceDate) return true;
  if (easternNow.dateKey < raceDate) return false;

  return easternNow.hour > 22 || (easternNow.hour === 22 && easternNow.minute >= 0);
}

function getSortedTracksByDate(tracks = []) {
  return [...tracks].sort((a, b) => {
    if (a.date && b.date) return new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`);
    if (a.date) return -1;
    if (b.date) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

function getUpcomingRaceByDate(tracks = []) {
  const sortedTracks = getSortedTracksByDate(tracks);
  return sortedTracks.find((track) => !hasRaceRolledOver(track)) || null;
}

function isRaceCompleteByDateOrHistory(track, completedRaces = new Set()) {
  return completedRaces.has(track?.name) || hasRaceRolledOver(track);
}

function sanitizeTracks(rawTracks) {
  if (!Array.isArray(rawTracks)) return null;
  const cleaned = rawTracks
    .map((t) => {
      const name = normalizeTrackName(typeof t?.name === "string" ? t.name.trim() : "");
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
const racePositionInputStyle = {
  ...inputStyle,
  width: 110,
  minWidth: 110,
  maxWidth: 130,
  padding: "10px 12px",
  fontSize: 16,
  fontWeight: 800,
  textAlign: "center",
};
const racePenaltyInputStyle = {
  ...inputStyle,
  width: 130,
  minWidth: 130,
  maxWidth: 150,
  padding: "10px 12px",
  fontSize: 15,
  fontWeight: 800,
  textAlign: "center",
};
const raceNotesInputStyle = {
  ...inputStyle,
  width: 260,
  minWidth: 260,
  padding: "10px 12px",
  fontSize: 14,
};
const raceEntryThStyle = {
  ...thStyle,
  minWidth: 115,
  textAlign: "center",
};
const raceEntryTdStyle = {
  ...tdStyle,
  minWidth: 115,
};
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 220px" };
const teamBranding = {
  B2J: { logo: "B2J", accent: "#d4af37", dark: "#1b1b1b" },
  "B2J MOTORSPORTS": { logo: "B2J", accent: "#d4af37", dark: "#1b1b1b" },
  MER: { logo: "MER", accent: "#dc2626", dark: "#200a0a", fullName: "ME Racing" },
  MMS: { logo: "MMS", accent: "#9333ea", dark: "#150a2e", fullName: "Mayhem Motorsports" },
  NLM: { logo: "NLM", accent: "#f97316", dark: "#1f0e00", fullName: "Nine Line Motorsports" },
  "Independent": { logo: "IND", accent: "#808080", dark: "#2a2a2a" },
  BOM: { logo: "BOM", accent: "#d4af37", dark: "#1b1b1b" },
  WSM: { logo: "WSM", accent: "#3b82f6", dark: "#111827" },
  "19XI": { logo: "19XI", accent: "#8b5cf6", dark: "#160b2d", fullName: "19XI Racing" },
  "19XI Racing": { logo: "19XI", accent: "#8b5cf6", dark: "#160b2d", fullName: "19XI Racing" },
  BWR: { logo: "BWR", accent: "#2563eb", dark: "#0f172a", fullName: "Big Wheel Racing" },
  KDM: { logo: "MER", accent: "#ef4444", dark: "#1f1315", fullName: "ME Racing" },
  BMX: { logo: "BXM", accent: "#2563eb", dark: "#0f172a", fullName: "BayouX Motorsports" },
  BXM: { logo: "BXM", accent: "#2563eb", dark: "#0f172a", fullName: "BayouX Motorsports" },
  "BayouX Motorsports": { logo: "BXM", accent: "#2563eb", dark: "#0f172a", fullName: "BayouX Motorsports" },
  "Team C": { logo: "C", accent: "#ef4444", dark: "#1f1315" },
  "Team C": { logo: "C", accent: "#ef4444", dark: "#1f1315" },
  "Team D": { logo: "D", accent: "#22c55e", dark: "#0f1b14" },
};
function getTeamBranding(teamName) {
  return teamBranding[teamName] || { logo: teamName?.charAt(0)?.toUpperCase() || "?", accent: "#d4af37", dark: "#161a20" };
}

function AdminLoginPage() {
  const ADMIN_ACCESS_CODE = "BCLADMINPASSWORD2026";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    if (code.trim() === ADMIN_ACCESS_CODE) {
      sessionStorage.setItem("bcl-admin-auth", "true");
      sessionStorage.setItem("bcl-admin-auth-time", new Date().toISOString());
      localStorage.removeItem("bcl-admin-auth");
      localStorage.removeItem("bcl-admin-auth-time");
      window.location.pathname = "/admin";
      return;
    }
    setError("Invalid admin code.");
  };

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 760 }}>
        <div style={{ ...sectionCardStyle, marginTop: 40, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <img src={logo} alt="League Logo" style={{ height: 62 }} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>Admin Portal Login</div>
              <div style={{ opacity: 0.72, marginTop: 4 }}>Budweiser Cup League private dashboard</div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>
              ADMIN ACCESS CODE
            </label>
            <input
              type="password"
              value={code}
              onChange={(event) => { setCode(event.target.value); setError(""); }}
              placeholder="Enter admin access code"
              style={inputStyle}
              autoFocus
            />
            {error && <div style={{ color: "#f87171", marginTop: 10, fontWeight: 800 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button type="submit" style={primaryButtonStyle}>Unlock Admin Portal</button>
              <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
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
  return { ...driver, manufacturer: driver.manufacturer || "", manufacturerLogo: driver.manufacturerLogo || manufacturerLogos[driver.manufacturer] || null, startingPoints: 0, manualWins: 0, points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0, retired: driver.retired || false, notes: "" };
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
function getDefaultRoster() { return dedupeDriversByNumber(realignLeagueDrivers(defaultDrivers).map(makeDriverWithStats)); }
function getStagePoints(stageFinish) {
  if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
  return stagePointsTable[stageFinish - 1];
}

function downloadRaceHistoryCsv(raceHistory = [], seasonName = "") {
  if (!Array.isArray(raceHistory) || raceHistory.length === 0) {
    alert("No race history to download yet.");
    return;
  }

  const rows = raceHistory.flatMap((race) => {
    const results = Array.isArray(race.results) ? race.results : [];
    return results.map((result) => ({
      Season: seasonName || "",
      Race: race.raceName || "",
      StageCount: race.stageCount ?? "",
      Finish: result.finishPos ?? "",
      CarNumber: result.number ?? "",
      Driver: result.name || "",
      Team: getTeamFullName(result.team || ""),
      Manufacturer: result.manufacturer || "",
      FinishPoints: result.finishPoints ?? 0,
      Stage1Points: result.stage1Points ?? 0,
      Stage2Points: result.stage2Points ?? 0,
      Stage3Points: result.stage3Points ?? 0,
      FastestLap: result.fastestLap ? "Yes" : "No",
      DNF: result.dnf ? "Yes" : "No",
      StartPark: result.startPark ? "Yes" : "No",
      DNFReason: result.dnfReason || "",
      Offense: result.offense ? "Yes" : "No",
      OffenseNumber: result.offenseNumber ?? "",
      PenaltyPoints: result.penaltyPoints ?? 0,
      TotalRacePoints: result.totalRacePoints ?? 0,
    }));
  });

  if (rows.length === 0) {
    alert("Race history exists, but there are no driver results to download.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const safeSeasonName = String(seasonName || "season")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `budweiser-cup-race-history-${safeSeasonName}-${dateStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function makeLeagueBackupPayload({ tracks = [], seasons = [], activeSeasonId = "", reason = "manual-backup", raceSnapshot = null }) {
  return {
    backupVersion: 1,
    appName: "Budweiser Cup League",
    reason,
    backedUpAt: new Date().toISOString(),
    activeSeasonId,
    tracks,
    seasons,
    raceSnapshot,
  };
}

function downloadLeagueBackupFile(backupPayload, label = "backup") {
  const safeLabel = String(label || "backup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const dateStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `budweiser-cup-results-${safeLabel}-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function isValidLeagueBackup(backup) {
  return !!backup && Array.isArray(backup.seasons) && backup.seasons.length > 0 && !!backup.activeSeasonId;
}

async function createRaceDataBackup({ seasonSnapshot, raceSnapshot, backupType = "save-points" }) {
  try {
    const { error } = await supabase.from("race_data_backups").insert({
      backup_type: backupType,
      season_id: seasonSnapshot?.id || null,
      season_name: seasonSnapshot?.name || "Season",
      race_name: raceSnapshot?.raceName || seasonSnapshot?.selectedRace || "Race",
      snapshot: seasonSnapshot,
      race_snapshot: raceSnapshot,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Race data backup failed:", error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error("Race data backup crashed:", error);
    return { ok: false, error };
  }
}

function makeRaceResultsLedgerRows({ season, race, tracks = [] }) {
  if (!season || !race || !Array.isArray(race.results)) return [];

  const raceDate = (tracks || []).find((track) => track?.name === race.raceName)?.date || null;
  const rosterById = new Map((season.drivers || []).map((driver) => [String(driver.id), driver]));

  return race.results.map((result) => {
    const rosterDriver = rosterById.get(String(result.driverId)) || {};
    return {
      season_id: String(season.id || ""),
      season_name: season.name || "Season",
      race_name: race.raceName || "",
      race_date: raceDate,
      driver_id: String(result.driverId || rosterDriver.id || ""),
      driver_number: String(result.number || rosterDriver.number || ""),
      driver_name: result.name || rosterDriver.name || "",
      team: result.team || rosterDriver.team || "",
      manufacturer: result.manufacturer || rosterDriver.manufacturer || "",
      finish_pos: result.finishPos ?? null,
      finish_points: Number(result.finishPoints || 0),
      stage1_finish: result.stage1Pos ?? null,
      stage1_points: Number(result.stage1Points || 0),
      stage2_finish: result.stage2Pos ?? null,
      stage2_points: Number(result.stage2Points || 0),
      stage3_finish: result.stage3Pos ?? null,
      stage3_points: Number(result.stage3Points || 0),
      fastest_lap: Boolean(result.fastestLap),
      dnf: Boolean(result.dnf),
      start_park: Boolean(result.startPark),
      dnf_reason: result.dnfReason || null,
      offense: Boolean(result.offense),
      offense_number: Number(result.offenseNumber || 0),
      penalty_points: Number(result.penaltyPoints || 0),
      total_race_points: Number(result.totalRacePoints || 0),
      updated_at: new Date().toISOString(),
    };
  });
}

async function saveRaceResultsLedger({ season, race, tracks = [] }) {
  const rows = makeRaceResultsLedgerRows({ season, race, tracks });

  if (!rows.length) {
    return { ok: true, skipped: true };
  }

  try {
    const { error: deleteError } = await supabase
      .from("race_results")
      .delete()
      .eq("season_id", String(season.id || ""))
      .eq("race_name", race.raceName || "");

    if (deleteError) {
      console.error("Could not clear old race_results rows:", deleteError);
      return { ok: false, error: deleteError };
    }

    const { error: insertError } = await supabase
      .from("race_results")
      .insert(rows);

    if (insertError) {
      console.error("Could not save race_results ledger:", insertError);
      return { ok: false, error: insertError };
    }

    return { ok: true };
  } catch (error) {
    console.error("race_results ledger save crashed:", error);
    return { ok: false, error };
  }
}

async function syncAllRaceResultsLedger({ seasons = [], tracks = [] }) {
  try {
    for (const season of seasons || []) {
      for (const race of season?.raceHistory || []) {
        const result = await saveRaceResultsLedger({ season, race, tracks });
        if (!result.ok) return result;
      }
    }
    return { ok: true };
  } catch (error) {
    console.error("Full race_results sync crashed:", error);
    return { ok: false, error };
  }
}


function rebuildDriversFromHistory(history, driverRoster) {
  return driverRoster.map((baseDriver) => {
    let points = 0;
    let wins = 0;
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
    return { ...baseDriver, manufacturerLogo: baseDriver.manufacturerLogo || manufacturerLogos[baseDriver.manufacturer] || null, startingPoints: 0, manualWins: 0, points, wins, top3, top5, dnfs, fastestLaps, totalPenalties, retired: baseDriver.retired || false, notes: "" };
  });
}
function makeSeasonId() { return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function createEmptySeason(name, roster = getDefaultRoster()) {
  const dedupedRoster = dedupeDriversByNumber(roster);
  const cleanRoster = dedupedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0 }));
  return { id: makeSeasonId(), name: name || "New Season", createdAt: new Date().toISOString(), drivers: rebuildDriversFromHistory([], cleanRoster), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {}, raceHistory: [] };
}
function applyWsmClosureKdmTransfer(roster = [], history = []) {
  const isUndeadHelliday = (item = {}) => {
    const numberKey = String(item?.number ?? item?.driver_number ?? "").trim();
    const nameKey = String(item?.name ?? item?.driver_name ?? "").trim().toLowerCase();
    const idKey = String(item?.id ?? item?.driverId ?? item?.driver_id ?? "").trim();
    return numberKey === "66" || nameKey === "undeadhelliday" || idKey === "19";
  };

  const isBigDiehl = (item = {}) => {
    const numberKey = String(item?.number ?? item?.driver_number ?? "").trim();
    const nameKey = String(item?.name ?? item?.driver_name ?? "").trim().toLowerCase();
    const idKey = String(item?.id ?? item?.driverId ?? item?.driver_id ?? "").trim();
    return nameKey === "bigdiehl21" || idKey === "46" || numberKey === "46";
  };

  const normalizedRoster = Array.isArray(roster)
    ? roster
        .filter((driver) => !isUndeadHelliday(driver))
        .map((driver) => {
          if (isBigDiehl(driver)) {
            return {
              ...driver,
              id: 46,
              number: 39,
              name: "BigDiehl21",
              manufacturer: "Chevrolet",
              team: "MER",
              retired: false,
            };
          }
          return driver;
        })
    : [];

  const adjustedHistory = Array.isArray(history)
    ? history.map((race) => ({
        ...race,
        results: Array.isArray(race?.results)
          ? race.results
              .filter((result) => !isUndeadHelliday(result))
              .map((result) => {
                if (isBigDiehl(result)) {
                  return {
                    ...result,
                    driverId: 46,
                    number: 39,
                    name: "BigDiehl21",
                    manufacturer: "Chevrolet",
                    team: "MER",
                  };
                }
                return result;
              })
          : [],
      }))
    : [];

  return { roster: normalizedRoster, history: adjustedHistory };
}
function apply2026DriverNumberAdjustments(roster = [], history = []) {
  const wsmClosureTransfer = applyWsmClosureKdmTransfer(roster, history);
  const normalizedRoster = Array.isArray(wsmClosureTransfer.roster) ? wsmClosureTransfer.roster.map((driver) => ({ ...driver })) : [];
  const normalizedHistory = Array.isArray(wsmClosureTransfer.history) ? wsmClosureTransfer.history : [];

  const cajunDriver = normalizedRoster.find((driver) => {
    const nameKey = String(driver?.name || "").trim().toLowerCase();
    const numberKey = String(driver?.number ?? "").trim();
    return nameKey === "cajunthrottle28";
  });

  if (cajunDriver) {
    cajunDriver.number = 12;
    cajunDriver.manufacturer = cajunDriver.manufacturer || "Ford";
    cajunDriver.team = cajunDriver.team === "BMX" ? "BXM" : (cajunDriver.team || "BXM");
  }

  let knightDriver = normalizedRoster.find((driver) => String(driver?.name || "").trim().toLowerCase() === "knighttrain41");
  if (knightDriver) {
    knightDriver.number = 41;
    knightDriver.manufacturer = "Ford";
    knightDriver.team = "BXM";
  } else {
    knightDriver = {
      id: 3412,
      number: 41,
      name: "KnightTrain41",
      manufacturer: "Ford",
      team: "BXM",
      startingPoints: 0,
      manualWins: 0,
      retired: false,
    };
    normalizedRoster.push(knightDriver);
  }

  // Normalize MARE to Ford while keeping BWR roster placement.
  normalizedRoster.forEach((driver) => {
    const nameKey = String(driver?.name || "").trim().toLowerCase();
    if (nameKey === "mare951") {
      driver.manufacturer = "Ford";
      driver.team = driver.team || "BWR";
    }
  });

  // Normalize Cruiser so old saved #4 rows and newer #54 rows collapse into one driver.
  normalizedRoster.forEach((driver) => {
    const nameKey = String(driver?.name || "").trim().toLowerCase();
    if (nameKey === "thecruiser54") {
      driver.id = 54;
      driver.number = 54;
      driver.manufacturer = "Ford";
      driver.team = driver.team === "BMX" ? "BXM" : (driver.team || "BXM");
    }
  });

  const adjustedHistory = Array.isArray(normalizedHistory)
    ? normalizedHistory.map((race) => ({
        ...race,
        results: Array.isArray(race?.results)
          ? race.results.map((result) => {
              const resultName = String(result?.name || "").trim().toLowerCase();
              if (cajunDriver && String(result?.driverId) === String(cajunDriver.id)) {
                return { ...result, number: 12, name: cajunDriver.name || "CaJunThrottle28", manufacturer: cajunDriver.manufacturer || "Ford", team: cajunDriver.team || "BXM" };
              }
              if (resultName === "cajunthrottle28" && String(result?.number) === "34") {
                return { ...result, number: 12, manufacturer: result.manufacturer || "Ford", team: result.team === "BMX" ? "BXM" : (result.team || "BXM") };
              }
              if (resultName === "knighttrain41") {
                return { ...result, number: 41, manufacturer: "Ford", team: "BXM" };
              }
              if (resultName === "mare951") {
                return { ...result, manufacturer: "Ford", team: result.team || "BWR" };
              }
              if (resultName === "thecruiser54") {
                return { ...result, driverId: 54, number: 54, name: "TheCruiser54", manufacturer: "Ford", team: result.team === "BMX" ? "BXM" : (result.team || "BXM") };
              }
              return result;
            })
          : [],
      }))
    : [];

  return { roster: normalizedRoster, history: adjustedHistory };
}
function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource = Array.isArray(season?.drivers) && season.drivers.length > 0 ? season.drivers : getDefaultRoster();
  const normalizedHistory = Array.isArray(season?.raceHistory)
    ? season.raceHistory.map((race) => ({ ...race, raceName: normalizeTrackName(race.raceName) }))
    : [];
  const adjusted = apply2026DriverNumberAdjustments(rosterSource, normalizedHistory);
  const rosterOnly = dedupeDriversByNumber(adjusted.roster).map((d) => ({ id: d.id, number: Number(d.number), name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false, notes: "" }));
  const history = adjusted.history;
  return {
    id: season?.id || makeSeasonId(), name: season?.name || fallbackName, createdAt: season?.createdAt || new Date().toISOString(),
    drivers: rebuildDriversFromHistory(history, rosterOnly), selectedRace: normalizeTrackName(season?.selectedRace || ""),
    positions: season?.positions || {}, stage1: season?.stage1 || {}, stage2: season?.stage2 || {}, stage3: season?.stage3 || {},
    dnfMap: season?.dnfMap || {}, startParkMap: season?.startParkMap || {}, offenseMap: season?.offenseMap || {}, fastestLapMap: season?.fastestLapMap || {}, raceHistory: history,
  };
}
function buildLegacySeasonFromLocalStorage() {
  const keys = ["irl-drivers","irl-raceHistory","irl-selectedRace","irl-positions","irl-stage1","irl-stage2","irl-stage3","irl-dnfMap","irl-startParkMap"];
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
    const startParkMap = JSON.parse(localStorage.getItem("irl-startParkMap") || "null") || {};
    return sanitizeSeason({ id: makeSeasonId(), name: "Season 1", createdAt: new Date().toISOString(), drivers, raceHistory, selectedRace, positions, stage1, stage2, stage3, dnfMap, startParkMap, offenseMap: {}, fastestLapMap: {} });
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

function isUsableLeagueState(state) {
  return !!state && Array.isArray(state.seasons) && state.seasons.length > 0 && !!state.activeSeasonId;
}

function makeLeagueStateSignature({ seasons = [], activeSeasonId = "", tracks = [] }) {
  return JSON.stringify({ seasons, activeSeasonId, tracks });
}

function normalizeLoadedLeagueState(savedState) {
  if (!isUsableLeagueState(savedState)) return null;

  let cleanSeasons = savedState.seasons.map((season, index) => sanitizeSeason(season, `Season ${index + 1}`));
  cleanSeasons = patchMissingDrivers(cleanSeasons);

  if (!cleanSeasons.length) return null;

  const activeExists = cleanSeasons.some((season) => season.id === savedState.activeSeasonId);
  const cleanTracks = sanitizeTracks(savedState.tracks) || defaultRaces;

  return {
    seasons: cleanSeasons,
    activeSeasonId: activeExists ? savedState.activeSeasonId : cleanSeasons[0].id,
    tracks: cleanTracks,
  };
}

function LeaderboardOverlay({ drivers, preview = false, seasonName = "" }) {
  const cleanDrivers = dedupeDriversByNumber(drivers);
  const sorted = [...cleanDrivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
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

function AppUpdateBanner({ page = "all" }) {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBanner() {
      const { data, error } = await supabase
        .from("app_update_banners")
        .select("*")
        .in("page", ["all", page])
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;
      if (!error) setBanner(data || null);
    }

    loadBanner();
    return () => {
      isMounted = false;
    };
  }, [page]);

  if (!banner) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #d4af37 0%, #facc15 45%, #f59e0b 100%)",
        color: "#111",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 16,
        padding: "14px 20px",
        marginBottom: 20,
        fontWeight: 900,
        fontSize: 14,
        boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        lineHeight: 1.35,
      }}
    >
      <span style={{ fontSize: 18 }}>🚨</span>
      <span>{banner.message}</span>
    </div>
  );
}


const defaultTickerItems = [
  { category: "BREAKING", message: "MER and WSM have officially closed operations" },
  { category: "TRANSACTION", message: "BigDiehl21 signs with ME Racing and moves to the No. 39 Chevrolet" },
  { category: "TRANSACTION", message: "BayouX Motorsports updates KnightTrain41 to the No. 41 Ford" },
  { category: "TEAM UPDATE", message: "CaJunThrottle28 moves to the No. 48 Chevrolet for BXM" },
  { category: "RESULTS", message: "Michigan weekend complete — Pocono Raceway is up next" },
  { category: "APP UPDATE", message: "Driver password reset support, interview sync improvements, and Race Control groundwork added" },
];

function LeagueTicker({ page = "standings", fallbackItems = defaultTickerItems }) {
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTicker() {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("ticker_messages")
        .select("*")
        .eq("active", true)
        .in("page", ["all", page])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("pinned", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Could not load ticker messages:", error);
        setLoadError(true);
        setItems(fallbackItems || []);
        return;
      }

      setLoadError(false);
      setItems(data?.length ? data : (fallbackItems || []));
    }

    loadTicker();
    const interval = setInterval(loadTicker, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [page, fallbackItems]);

  const cleanItems = (items || [])
    .map((item) => ({
      category: String(item.category || item.type || "NEWS").trim().toUpperCase(),
      message: String(item.message || "").trim(),
      pinned: Boolean(item.pinned),
    }))
    .filter((item) => item.message);

  if (!cleanItems.length) return null;

  const tickerText = cleanItems
    .map((item) => `${item.pinned ? "📌 " : ""}${item.category}: ${item.message}`)
    .join("   •   ");

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #080b10 0%, #111827 50%, #080b10 100%)",
        border: "1px solid rgba(212,175,55,0.82)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 46 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #d4af37 0%, #f59e0b 100%)",
            color: "#111",
            padding: "12px 16px",
            fontWeight: 1000,
            letterSpacing: 0.8,
            fontSize: 13,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🏁 LEAGUE TICKER
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "inline-block",
              paddingLeft: "100%",
              whiteSpace: "nowrap",
              animation: "bcl-ticker-scroll 55s linear infinite",
              color: "#facc15",
              fontWeight: 900,
              fontSize: 14,
              textShadow: "0 1px 12px rgba(250,204,21,0.25)",
            }}
          >
            {tickerText}
            {loadError ? "   •   USING FALLBACK TICKER — CHECK SUPABASE TICKER_MESSAGES TABLE" : ""}
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes bcl-ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}



function MemorialDayPage({ drivers = [] }) {
  const [tributes, setTributes] = useState([]);
  const [form, setForm] = useState({
    driver_id: "",
    honoree_name: "",
    relationship: "",
    branch: "",
    accomplishments: "",
    story: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  async function loadTributes() {
    const { data, error } = await supabase
      .from("memorial_day_tributes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load memorial tributes:", error);
      try {
        setTributes(JSON.parse(localStorage.getItem("bclMemorialDayTributes") || "[]"));
      } catch {
        setTributes([]);
      }
      return;
    }

    setTributes(data || []);
  }

  useEffect(() => {
    loadTributes();
  }, []);
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitTribute(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const driver = activeDrivers.find((item) => String(item.id) === String(form.driver_id));

    if (!driver) {
      setError("Select your driver before submitting.");
      return;
    }

    if (!form.honoree_name.trim() || !form.story.trim()) {
      setError("Please add who you are driving for and a short story.");
      return;
    }

    const payload = {
      driver_id: String(driver.id),
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: getTeamFullName(driver.team || "Independent"),
      manufacturer: driver.manufacturer || "",
      honoree_name: form.honoree_name.trim(),
      relationship: form.relationship.trim(),
      branch: form.branch.trim(),
      accomplishments: form.accomplishments.trim(),
      story: form.story.trim(),
      status: "approved",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("memorial_day_tributes").insert([payload]);

    if (insertError) {
      console.error("Could not save memorial tribute:", insertError);
      try {
        const saved = JSON.parse(localStorage.getItem("bclMemorialDayTributes") || "[]");
        localStorage.setItem("bclMemorialDayTributes", JSON.stringify([{ ...payload, id: `local-${Date.now()}` }, ...saved]));
        setMessage("Tribute saved on this browser. Check Supabase table/RLS to make it visible everywhere.");
      } catch {
        setError("Could not save tribute. Check the memorial_day_tributes table and RLS policies.");
        return;
      }
    } else {
      setMessage("Memorial Day tribute submitted.");
    }

    setForm({
      driver_id: "",
      honoree_name: "",
      relationship: "",
      branch: "",
      accomplishments: "",
      story: "",
    });

    await loadTributes();
  }

  return (
    <div style={{ ...appShellStyle, background: "radial-gradient(circle at top left, rgba(30,64,175,0.32), transparent 34%), radial-gradient(circle at top right, rgba(185,28,28,0.28), transparent 32%), #07111f" }}>
      <div style={{ ...pageContainerStyle, maxWidth: 1180 }}>
        <div style={{ ...sectionCardStyle, border: "1px solid rgba(255,255,255,0.16)", background: "linear-gradient(135deg, rgba(127,29,29,0.82), rgba(15,23,42,0.96), rgba(30,64,175,0.78))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: "#facc15" }}>BUDWEISER CUP LEAGUE</div>
              <h1 style={{ margin: "8px 0", fontSize: 42, lineHeight: 1 }}>🇺🇸 Memorial Day Tribute Wall</h1>
              <p style={{ margin: 0, opacity: 0.86, maxWidth: 760 }}>
                Drivers can share who they are driving for and honor their service, sacrifice, and accomplishments.
              </p>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={submitTribute} style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Submit Driver Tribute</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>DRIVER</label>
              <select value={form.driver_id} onChange={(event) => updateField("driver_id", event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>#{driver.number} {driver.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>WHO ARE YOU DRIVING FOR?</label>
              <input value={form.honoree_name} onChange={(event) => updateField("honoree_name", event.target.value)} placeholder="Name of honoree" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>RELATIONSHIP</label>
              <input value={form.relationship} onChange={(event) => updateField("relationship", event.target.value)} placeholder="Father, grandfather, friend, etc." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>BRANCH / SERVICE</label>
              <input value={form.branch} onChange={(event) => updateField("branch", event.target.value)} placeholder="Army, Navy, Marines, Air Force, etc." style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>ACCOMPLISHMENTS</label>
            <input value={form.accomplishments} onChange={(event) => updateField("accomplishments", event.target.value)} placeholder="Service awards, deployments, family legacy, community impact..." style={inputStyle} />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SHORT STORY</label>
            <textarea value={form.story} onChange={(event) => updateField("story", event.target.value)} rows={5} placeholder="Tell the story of who you are honoring." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {message && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{message}</div>}
          {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}

          <div style={{ marginTop: 16 }}>
            <button type="submit" style={primaryButtonStyle}>Submit Tribute</button>
          </div>
        </form>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Tribute Wall</h2>
          {tributes.length === 0 ? (
            <div style={{ opacity: 0.72 }}>No tributes submitted yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {tributes.map((tribute) => (
                <div key={tribute.id || `${tribute.driver_name}-${tribute.honoree_name}`} style={{ background: "#0f1319", border: "1px solid #334155", borderRadius: 16, padding: 16 }}>
                  <div style={{ color: "#facc15", fontWeight: 900 }}>#{tribute.driver_number} {tribute.driver_name}</div>
                  <h3 style={{ margin: "8px 0" }}>Driving for {tribute.honoree_name}</h3>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>{tribute.relationship || "Honoree"} {tribute.branch ? `• ${tribute.branch}` : ""}</div>
                  {tribute.accomplishments && <p style={{ fontWeight: 800 }}>{tribute.accomplishments}</p>}
                  <p style={{ lineHeight: 1.45 }}>{tribute.story}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function DriverFeedbackPage({ drivers = [] }) {
  const [form, setForm] = useState({
    driver_id: "",
    team_happiness: 8,
    equipment_quality: 8,
    team_communication: 8,
    leadership_confidence: 8,
    manufacturer_support: 8,
    future_confidence: 8,
    comments: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers)
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const driver = activeDrivers.find((item) => String(item.id) === String(form.driver_id));
    if (!driver) {
      setError("Select your driver before submitting feedback.");
      return;
    }

    const payload = {
      driver_id: String(driver.id),
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: getTeamFullName(driver.team || "Independent"),
      team_key: driver.team || "Independent",
      manufacturer: driver.manufacturer || "",
      team_happiness: Number(form.team_happiness) || 0,
      equipment_quality: Number(form.equipment_quality) || 0,
      team_communication: Number(form.team_communication) || 0,
      leadership_confidence: Number(form.leadership_confidence) || 0,
      manufacturer_support: Number(form.manufacturer_support) || 0,
      future_confidence: Number(form.future_confidence) || 0,
      comments: form.comments || "",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("driver_feedback").insert([payload]);

    if (insertError) {
      console.error("Driver feedback Supabase insert failed:", insertError);
      try {
        const saved = JSON.parse(localStorage.getItem("bclDriverFeedbackRatings") || "[]");
        localStorage.setItem("bclDriverFeedbackRatings", JSON.stringify([{ ...payload, id: `local-${Date.now()}` }, ...saved]));
        setMessage("Feedback saved on this browser. Add the driver_feedback table in Supabase to make it visible everywhere.");
      } catch {
        setError("Could not save feedback. Check the driver_feedback Supabase table.");
        return;
      }
    } else {
      setMessage("Driver feedback submitted. Your owner will see the updated morale signals in Team HQ.");
    }

    setForm((current) => ({ ...current, comments: "" }));
  }

  const ratingFields = [
    ["team_happiness", "Team Happiness", "How happy are you with your organization?"],
    ["equipment_quality", "Equipment Quality", "How competitive is your equipment?"],
    ["team_communication", "Team Communication", "How well does your team work together?"],
    ["leadership_confidence", "Owner Leadership", "How confident are you in ownership?"],
    ["manufacturer_support", "Manufacturer Support", "How strong is manufacturer support?"],
    ["future_confidence", "Future Confidence", "Do you believe this team can win?"],
  ];

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 980 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 900 }}>Driver Feedback</div>
                <div style={{ opacity: 0.72, marginTop: 4 }}>Rate your team experience. These ratings feed Team HQ morale.</div>
              </div>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={submitFeedback} style={sectionCardStyle}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SELECT DRIVER</label>
          <select value={form.driver_id} onChange={(event) => updateField("driver_id", event.target.value)} style={inputStyle}>
            <option value="">Choose your driver</option>
            {activeDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)}</option>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginTop: 18 }}>
            {ratingFields.map(([field, label, help]) => (
              <div key={field} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 900 }}>{label}</div>
                  <div style={{ color: "#d4af37", fontWeight: 900 }}>{form[field]}/10</div>
                </div>
                <div style={{ opacity: 0.65, fontSize: 12, margin: "6px 0 10px" }}>{help}</div>
                <input type="range" min="1" max="10" value={form[field]} onChange={(event) => updateField(field, event.target.value)} style={{ width: "100%" }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>OPTIONAL COMMENT</label>
            <textarea value={form.comments} onChange={(event) => updateField("comments", event.target.value)} placeholder="What should ownership know?" rows={4} style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {message && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{message}</div>}
          {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button type="submit" style={primaryButtonStyle}>Submit Driver Feedback</button>
            <button type="button" onClick={() => (window.location.pathname = "/team-hq")} style={secondaryButtonStyle}>Open Team HQ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const trackOverviewData = {
  "Preseason - Michigan": {
    name: "Michigan International Speedway",
    location: "Brooklyn, Michigan",
    type: "D-shaped oval",
    length: "2.0 miles",
    turns: "4",
    banking: "18° turns, 12° frontstretch, 5° backstretch",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. The track is wide enough for multiple grooves, but overdriving corner exit can hurt right-side tire life.",
    notes: "Fast, wide, draft-heavy track where momentum matters. Drivers can move around to find clean air and manage long-run balance.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/michigan.jpg",
  },
  "Michigan": {
    name: "Michigan International Speedway",
    location: "Brooklyn, Michigan",
    type: "D-shaped oval",
    length: "2.0 miles",
    turns: "4",
    banking: "18° turns, 12° frontstretch, 5° backstretch",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Drivers can use several lanes, but long green-flag runs reward smooth throttle and clean corner exits.",
    notes: "Drafting and momentum are huge. The preferred lane can change as tires fall off.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/michigan.jpg",
  },
  "Preseason - Dover": {
    name: "Dover Motor Speedway",
    location: "Dover, Delaware",
    type: "Concrete oval",
    length: "1.0 mile",
    turns: "4",
    banking: "24° turns, 9° straights",
    pitSpeed: "35 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Concrete grip is strong, but rhythm mistakes and sliding off the corner can punish tires quickly.",
    notes: "Fast short-track feel with heavy compression into the corners. Track position and clean exits are critical.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/dover.jpg",
  },
  "Dover": {
    name: "Dover Motor Speedway",
    location: "Dover, Delaware",
    type: "Concrete oval",
    length: "1.0 mile",
    turns: "4",
    banking: "24° turns, 9° straights",
    pitSpeed: "35 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Drivers need to protect corner exit and avoid abusing the right front.",
    notes: "The Monster Mile rewards rhythm, discipline, and clean traffic management.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/dover.jpg",
  },
  "Preseason - EchoPark Speedway": {
    name: "EchoPark Speedway",
    location: "Hampton, Georgia",
    type: "Intermediate quad-oval",
    length: "1.54 miles",
    turns: "4",
    banking: "24° turns, 5° straights",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate to high. Long green-flag runs will punish right-side tires, especially in traffic and dirty air.",
    notes: "Fast, aggressive intermediate with pack-style drafting influence. Restarts, lane choice, and tire falloff can flip the race quickly.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/echoparkspeedway.jpg",
  },
  "EchoPark Speedway": {
    name: "EchoPark Speedway",
    location: "Hampton, Georgia",
    type: "Intermediate quad-oval",
    length: "1.54 miles",
    turns: "4",
    banking: "24° turns, 5° straights",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate to high. Tire saving matters once the field stretches out, but draft runs can create big swings on restarts.",
    notes: "Drivers need to balance aggression with tire management. The outside lane can build momentum, but mistakes in traffic are costly.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/echoparkspeedway.jpg",
  },
  "Daytona (Night)": {
    name: "Daytona International Speedway",
    location: "Daytona Beach, Florida",
    type: "Superspeedway tri-oval",
    length: "2.5 miles",
    turns: "4",
    banking: "31° turns, 18° tri-oval, 3° backstretch",
    pitSpeed: "55 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Low to moderate. Drafting, lane discipline, and pushing technique matter more than tire falloff.",
    notes: "Pack racing with huge runs. Survival, patience, and timing are key.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/daytona.jpg",
  },
  "Charlotte": {
    name: "Charlotte Motor Speedway",
    location: "Concord, North Carolina",
    type: "Quad-oval intermediate",
    length: "1.5 miles",
    turns: "4",
    banking: "24° turns, 5° straights",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate to high. Long-run speed depends on keeping the car stable in dirty air and saving right-side tires.",
    notes: "Clean air and momentum are important. Charlotte has 3 stage points in your league format.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/charlotte.jpg",
  },
  "Nashville": {
    name: "Nashville Superspeedway",
    location: "Lebanon, Tennessee",
    type: "Concrete D-shaped oval",
    length: "1.333 miles",
    turns: "4",
    banking: "14° turns, 9° frontstretch, 6° backstretch",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Concrete grip and traffic make throttle control important.",
    notes: "Momentum track with long corners and tricky traffic transitions.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/nashville.jpg",
  },
  "Pocono": {
    name: "Pocono Raceway",
    location: "Long Pond, Pennsylvania",
    type: "Triangular superspeedway",
    length: "2.5 miles",
    turns: "3",
    banking: "14° turn 1, 8° turn 2, 6° turn 3",
    pitSpeed: "55 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Each corner needs a different compromise, especially braking and exit drive.",
    notes: "Three unique corners. Turn 3 exit is critical for frontstretch speed.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/pocono.jpg",
  },
  "Bristol (Night)": {
    name: "Bristol Motor Speedway",
    location: "Bristol, Tennessee",
    type: "Concrete short track",
    length: "0.533 miles",
    turns: "4",
    banking: "24°-28° turns, 5°-9° straights",
    pitSpeed: "30 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Traffic, wheel spin, and overdriving corner entry can use tires up fast.",
    notes: "Short-track chaos. Rhythm, patience, and clean bumper discipline matter.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/bristol.jpg",
  },
  "Las Vegas": {
    name: "Las Vegas Motor Speedway",
    location: "Las Vegas, Nevada",
    type: "Intermediate oval",
    length: "1.5 miles",
    turns: "4",
    banking: "20° turns, 9° frontstretch, 9° backstretch",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Long-run balance and clean air make a big difference.",
    notes: "Momentum-based intermediate with multiple lanes as the run develops.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/lasvegas.jpg",
  },
  "Talladega": {
    name: "Talladega Superspeedway",
    location: "Talladega, Alabama",
    type: "Superspeedway tri-oval",
    length: "2.66 miles",
    turns: "4",
    banking: "33° turns, 16.5° tri-oval, 3° backstretch",
    pitSpeed: "55 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Low. Drafting, pushing, lane choice, and avoiding mistakes matter most.",
    notes: "Huge pack-racing track. Runs form quickly and decision-making is everything.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/talladega.jpg",
  },
  "North Wilkesboro": {
    name: "North Wilkesboro Speedway",
    location: "North Wilkesboro, North Carolina",
    type: "Short track oval",
    length: "0.625 miles",
    turns: "4",
    banking: "13° turns",
    pitSpeed: "30 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Tire conservation and throttle control are major factors.",
    notes: "Old-school short track with heavy braking, low grip, and tough passing.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/northwilkesboro.jpg",
  },
  "Indianapolis": {
    name: "Indianapolis Motor Speedway",
    location: "Speedway, Indiana",
    type: "Rectangular oval",
    length: "2.5 miles",
    turns: "4",
    banking: "9°12′ turns, nearly flat straights",
    pitSpeed: "55 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Braking stability and exit speed are critical because the corners are flat and narrow.",
    notes: "Precision track. Mistakes on corner exit cost speed for a long straightaway.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/indianapolis.jpg",
  },
  "New Hampshire": {
    name: "New Hampshire Motor Speedway",
    location: "Loudon, New Hampshire",
    type: "Flat oval",
    length: "1.058 miles",
    turns: "4",
    banking: "2°-7° turns, 1° straights",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate to high. Flat corners reward smooth braking and throttle pickup.",
    notes: "Track position and braking discipline are key. Passing can be difficult without a run.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/newhampshire.jpg",
  },
  "Phoenix": {
    name: "Phoenix Raceway",
    location: "Avondale, Arizona",
    type: "Dogleg oval",
    length: "1.0 mile",
    turns: "4",
    banking: "8°-11° turns, 3° backstretch, 10°-11° dogleg",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Drivers need to manage rear grip off the flat corners.",
    notes: "Restarts can get aggressive through the dogleg. Track position matters.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/phoenix.jpg",
  },
  "Richmond": {
    name: "Richmond Raceway",
    location: "Richmond, Virginia",
    type: "Short track D-shaped oval",
    length: "0.75 miles",
    turns: "4",
    banking: "14° turns, 8° frontstretch, 2° backstretch",
    pitSpeed: "40 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Long-run tire saving is one of the biggest keys.",
    notes: "Short-track strategy race. Smoothness and tire management create passing chances.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/richmond.jpg",
  },
  "Kansas": {
    name: "Kansas Speedway",
    location: "Kansas City, Kansas",
    type: "Intermediate tri-oval",
    length: "1.5 miles",
    turns: "4",
    banking: "17°-20° progressive turns, 9°-11° frontstretch, 5° backstretch",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. Multiple grooves open up, but dirty air still matters.",
    notes: "Progressive banking makes lane choice important over a long run.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/kansas.jpg",
  },
  "Texas": {
    name: "Texas Motor Speedway",
    location: "Fort Worth, Texas",
    type: "Intermediate oval",
    length: "1.5 miles",
    turns: "4",
    banking: "20° turns 1-2, 24° turns 3-4",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "Moderate. The two ends can feel different, so setup compromise matters.",
    notes: "Momentum and clean air are major. Restarts can decide track position quickly.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/texas.jpg",
  },
  "Iowa": {
    name: "Iowa Speedway",
    location: "Newton, Iowa",
    type: "Short oval",
    length: "0.875 miles",
    turns: "4",
    banking: "12°-14° progressive turns, 10° frontstretch, 4° backstretch",
    pitSpeed: "40 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. Progressive banking helps passing, but overdriving will burn tires quickly.",
    notes: "Short-track/intermediate mix with multiple lanes and heavy tire strategy.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/iowa.jpg",
  },
  "Homestead": {
    name: "Homestead-Miami Speedway",
    location: "Homestead, Florida",
    type: "Intermediate oval",
    length: "1.5 miles",
    turns: "4",
    banking: "18°-20° progressive turns, 4° straights",
    pitSpeed: "45 mph",
    restartZone: "Frontstretch restart zone before the start/finish line",
    tireWear: "High. The wall lane is fast, but tire saving and throttle control still matter.",
    notes: "Multiple grooves with major long-run falloff. Drivers can search for grip from bottom to wall.",
    imageUrl: "https://vistghrmmlnkfpcxjcwm.supabase.co/storage/v1/object/public/track-images/homestead.jpg",
  },
};


function ContractsPage({ drivers = [] }) {
  const [contracts, setContracts] = useState([]);
  const [independentPayments, setIndependentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payingDriverNumber, setPayingDriverNumber] = useState(null);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const formatMoney = (value) => {
    const safe = Number(value) || 0;
    return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  };

  const activeRoster = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver));
  }, [drivers]);

  const independentDrivers = useMemo(() => {
    return activeRoster
      .filter((driver) => String(driver.team || "").trim().toLowerCase() === "independent")
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [activeRoster]);

  async function loadContracts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contract_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load active contracts:", error);
      setError(error.message || "Could not load active contracts.");
      setContracts([]);
      setLoading(false);
      return;
    }

    const signedContracts = (data || []).filter((contract) => {
      const status = String(contract.status || "").trim().toLowerCase();
      return ["accepted", "active", "signed"].includes(status);
    });

    const byDriver = new Map();
    signedContracts.forEach((contract) => {
      const numberKey = String(contract.driver_number || "").trim();
      const nameKey = String(contract.driver_name || "").trim().toLowerCase();
      const key = numberKey || nameKey;
      if (!key) return;

      const existing = byDriver.get(key);
      if (!existing) {
        byDriver.set(key, contract);
        return;
      }

      const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const nextTime = new Date(contract.updated_at || contract.created_at || 0).getTime();
      if (nextTime >= existingTime) byDriver.set(key, contract);
    });

    setContracts(Array.from(byDriver.values()));
    setError("");
    setLoading(false);
  }

  async function loadIndependentPayments() {
    setPaymentsLoading(true);
    const { data, error } = await supabase
      .from("team_payments")
      .select("*")
      .eq("payment_type", "Independent Driver Base Salary")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load independent driver payments:", error);
      setPaymentError(error.message || "Could not load independent driver payments.");
      setIndependentPayments([]);
      setPaymentsLoading(false);
      return;
    }

    setIndependentPayments(data || []);
    setPaymentError("");
    setPaymentsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      await loadContracts();
      if (isMounted) await loadIndependentPayments();
    }

    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => {
      isMounted = false;
    };
  }, []);

  async function payIndependentDriver(driver) {
    if (!driver) return;

    const driverNumber = Number(driver.number);
    setPayingDriverNumber(driverNumber);
    setPaymentError("");

    const { error } = await supabase.from("team_payments").insert({
      driver_number: driverNumber,
      driver_name: driver.name,
      team_name: "Independent",
      paid_by: LEAGUE_BANK_NAME,
      payment_type: "Independent Driver Base Salary",
      amount: INDEPENDENT_DRIVER_BASE_SALARY,
      created_at: new Date().toISOString(),
    });

    setPayingDriverNumber(null);

    if (error) {
      console.error("Could not pay independent driver:", error);
      setPaymentError(error.message || "Could not pay independent driver. Check the team_payments table and RLS policies.");
      alert("Could not pay independent driver. Check the team_payments table and RLS policies.");
      return;
    }

    await loadIndependentPayments();
    alert(`${driver.name} has been paid ${formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)} from ${LEAGUE_BANK_NAME}.`);
  }

  const latestPaymentByDriver = useMemo(() => {
    const byDriver = new Map();
    (independentPayments || []).forEach((payment) => {
      const key = String(payment.driver_number || "").trim() || String(payment.driver_name || "").trim().toLowerCase();
      if (!key) return;
      const existing = byDriver.get(key);
      if (!existing) {
        byDriver.set(key, payment);
        return;
      }
      const existingTime = new Date(existing.created_at || 0).getTime();
      const nextTime = new Date(payment.created_at || 0).getTime();
      if (nextTime >= existingTime) byDriver.set(key, payment);
    });
    return byDriver;
  }, [independentPayments]);

  const contractedDriverNumbers = new Set(
    contracts.map((contract) => String(contract.driver_number || "").trim()).filter(Boolean)
  );

  const contractedDriverNames = new Set(
    contracts.map((contract) => String(contract.driver_name || "").trim().toLowerCase()).filter(Boolean)
  );

  const uncontractedDrivers = activeRoster
    .filter((driver) => {
      const numberKey = String(driver.number || "").trim();
      const nameKey = String(driver.name || "").trim().toLowerCase();
      return !contractedDriverNumbers.has(numberKey) && !contractedDriverNames.has(nameKey);
    })
    .sort((a, b) => {
      const teamCompare = getTeamFullName(a.team || "Independent").localeCompare(getTeamFullName(b.team || "Independent"));
      if (teamCompare !== 0) return teamCompare;
      return Number(a.number || 9999) - Number(b.number || 9999);
    });

  const totalIndependentPayroll = independentDrivers.length * INDEPENDENT_DRIVER_BASE_SALARY;
  const totalIndependentPaid = (independentPayments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 0.5 }}>Active Contracts</div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>Official Budweiser Cup League contract board</div>
              </div>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>
              Back to Standings
            </button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>LEAGUE-FUNDED INDEPENDENTS</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Independent Driver Base Salary</h2>
              <div style={{ opacity: 0.72, marginTop: 6 }}>
                Independent drivers are paid by {LEAGUE_BANK_NAME}, not by a team owner budget.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>BASE SALARY</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)}</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>SEASON PAYROLL</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(totalIndependentPayroll)}</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>PAYMENTS LOGGED</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(totalIndependentPaid)}</div>
              </div>
            </div>
          </div>

          {paymentError && (
            <div style={{ background: "#2a1212", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 14, padding: 14, fontWeight: 800, marginBottom: 14 }}>
              Payment error: {paymentError}
            </div>
          )}

          {independentDrivers.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              No independent drivers are currently listed on the active roster.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Paid By</th>
                    <th style={thStyle}>Base Salary</th>
                    <th style={thStyle}>Last Paid</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {independentDrivers.map((driver) => {
                    const lastPayment = latestPaymentByDriver.get(String(driver.number || "").trim());
                    return (
                      <tr key={`independent-pay-${driver.id || driver.number}`}>
                        <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                        <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                        <td style={tdStyle}>{LEAGUE_BANK_NAME}</td>
                        <td style={tdStyle}>{formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)}</td>
                        <td style={tdStyle}>
                          {paymentsLoading ? "Loading..." : lastPayment?.created_at ? new Date(lastPayment.created_at).toLocaleDateString() : "Not paid yet"}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => payIndependentDriver(driver)}
                            style={primaryButtonStyle}
                            disabled={payingDriverNumber === Number(driver.number)}
                          >
                            {payingDriverNumber === Number(driver.number) ? "Paying..." : "Pay Base Salary"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>SIGNED / ACCEPTED DEALS</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Active Driver Contracts</h2>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.65 }}>ACTIVE DEALS</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{contracts.length}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>Loading active contracts...</div>
          ) : error ? (
            <div style={{ background: "#2a1212", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 14, padding: 14, fontWeight: 800 }}>
              Could not load active contracts: {error}
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              No active contracts found yet. Accepted, active, and signed contract rows will show here.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Salary</th>
                    <th style={thStyle}>Signing Bonus</th>
                    <th style={thStyle}>Length</th>
                    <th style={thStyle}>Buyout</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const driver = activeRoster.find((d) => {
                      const numberMatch = String(d.number || "") === String(contract.driver_number || "");
                      const nameMatch = String(d.name || "").trim().toLowerCase() === String(contract.driver_name || "").trim().toLowerCase();
                      return numberMatch || nameMatch;
                    });

                    return (
                      <tr key={contract.id}>
                        <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || driver?.number || "—"} {contract.driver_name || driver?.name || "Unknown Driver"}</td>
                        <td style={tdStyle}>{getTeamFullName(contract.team || contract.team_name || contract.created_by_team || driver?.team || "Independent")}</td>
                        <td style={tdStyle}>{contract.manufacturer || driver?.manufacturer || "—"}</td>
                        <td style={tdStyle}>{formatMoney(contract.salary)}</td>
                        <td style={tdStyle}>{formatMoney(contract.signing_bonus)}</td>
                        <td style={tdStyle}>{contract.contract_length || contract.length || "—"} season{Number(contract.contract_length || contract.length) === 1 ? "" : "s"}</td>
                        <td style={tdStyle}>{formatMoney(contract.buyout_amount || contract.buyout)}</td>
                        <td style={{ ...tdStyle, fontWeight: 900, color: "#4ade80" }}>{contract.status || "Signed"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>FREE AGENTS / NO ACTIVE DEAL</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Drivers Without Active Contracts</h2>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.65 }}>UNSIGNED</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{uncontractedDrivers.length}</div>
            </div>
          </div>

          {uncontractedDrivers.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              Every active driver currently has an active contract.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uncontractedDrivers.map((driver) => (
                    <tr key={driver.id || driver.number}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team || "Independent")}</td>
                      <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                      <td style={{ ...tdStyle, color: "#fbbf24", fontWeight: 900 }}>No active contract</td>
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



const PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP = 150000;
const PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP = 750000;

function getPaintSchemePayout(position) {
  const pos = Number(position);
  if (pos === 1) return { team: 20000, driver: 5000 };
  if (pos === 2) return { team: 16000, driver: 4000 };
  if (pos === 3) return { team: 12000, driver: 3000 };
  if (pos === 4) return { team: 10000, driver: 2500 };
  if (pos === 5) return { team: 8000, driver: 2000 };
  if (pos >= 6 && pos <= 10) return { team: 6000, driver: 1500 };
  if (pos >= 11 && pos <= 20) return { team: 4000, driver: 1000 };
  if (pos >= 21 && pos <= 30) return { team: 2000, driver: 500 };
  if (pos >= 31 && pos <= 40) return { team: 1000, driver: 250 };
  return { team: 0, driver: 0 };
}

function getNextFridayMidnightDeadline(date = new Date()) {
  const easternParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(easternParts.map((part) => [part.type, part.value]));
  const currentUtc = new Date(`${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}-04:00`);
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[values.weekday] ?? 0;
  let daysUntilFriday = (5 - dayIndex + 7) % 7;
  const passedFridayMidnight = dayIndex === 5 && (Number(values.hour) > 0 || Number(values.minute) > 0 || Number(values.second) > 0);
  if (passedFridayMidnight) daysUntilFriday = 7;
  const deadline = new Date(currentUtc);
  deadline.setUTCDate(deadline.getUTCDate() + daysUntilFriday);
  deadline.setUTCHours(4, 0, 0, 0); // Friday 12:00 AM Eastern during the season.
  return deadline;
}

function getPaintUploadUpdatedAt(upload) {
  return upload.updated_at || upload.modified_at || upload.uploaded_at || upload.created_at || upload.inserted_at || null;
}

function isPaintUploadEligibleForPayout(upload, deadline = getNextFridayMidnightDeadline()) {
  const updatedAt = getPaintUploadUpdatedAt(upload);
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() <= new Date(deadline).getTime();
}

function getPaintSchemeSeasonPaidByTeam(payouts = []) {
  const paidByTeam = new Map();
  (payouts || []).forEach((payout) => {
    (payout.rows || []).forEach((row) => {
      const teamKey = String(row.team || "Independent");
      paidByTeam.set(teamKey, (paidByTeam.get(teamKey) || 0) + Number(row.teamPayout || 0));
    });
  });
  return paidByTeam;
}

function applyPaintSchemeTeamCaps(
  rows = [],
  weeklyCap = PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP,
  seasonCap = PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP,
  seasonPaidByTeam = new Map()
) {
  const weeklyPaidByTeam = new Map();
  return rows.map((row) => {
    const teamKey = String(row.team || "Independent");
    const alreadyPaidThisWeek = weeklyPaidByTeam.get(teamKey) || 0;
    const alreadyPaidThisSeason = seasonPaidByTeam.get(teamKey) || 0;
    const weeklyRemaining = Math.max(0, weeklyCap - alreadyPaidThisWeek);
    const seasonRemaining = Math.max(0, seasonCap - alreadyPaidThisSeason - alreadyPaidThisWeek);
    const capRemaining = Math.min(weeklyRemaining, seasonRemaining);
    const originalTeamPayout = Number(row.teamPayout || 0);
    const cappedTeamPayout = Math.min(originalTeamPayout, capRemaining);
    weeklyPaidByTeam.set(teamKey, alreadyPaidThisWeek + cappedTeamPayout);
    return {
      ...row,
      originalTeamPayout,
      teamPayout: cappedTeamPayout,
      teamWeeklyCapApplied: cappedTeamPayout < originalTeamPayout && weeklyRemaining <= seasonRemaining,
      teamSeasonCapApplied: cappedTeamPayout < originalTeamPayout && seasonRemaining < weeklyRemaining,
      teamCapApplied: cappedTeamPayout < originalTeamPayout,
      teamSeasonPaidBeforeAward: alreadyPaidThisSeason,
    };
  });
}

function buildPaintSchemePayoutRows(rankedUploads = [], drivers = [], deadline = getNextFridayMidnightDeadline(), seasonPayouts = []) {
  const rows = rankedUploads
    .filter((upload) => isPaintUploadEligibleForPayout(upload, deadline))
    .slice(0, 40)
    .map((upload, index) => {
      const rank = index + 1;
      const payout = getPaintSchemePayout(rank);
      const matchedDriver = (drivers || []).find((driver) =>
        String(driver.id) === String(upload.driver_id) ||
        String(driver.number) === String(upload.driver_number || upload.car_number || upload.number) ||
        String(driver.name || '').trim().toLowerCase() === String(upload.driver_name || upload.uploader_name || '').trim().toLowerCase()
      );
      return {
        rank,
        uploadId: upload.id,
        driverId: matchedDriver?.id || upload.driver_id || null,
        driverNumber: matchedDriver?.number || upload.driver_number || upload.car_number || upload.number || '',
        driverName: matchedDriver?.name || upload.driver_name || upload.uploader_name || 'Unknown Driver',
        team: matchedDriver?.team || upload.team || upload.team_key || 'Independent',
        votes: Number(upload.voteCount || 0),
        imageUrl: upload.image_url || upload.file_url || '',
        updatedAt: getPaintUploadUpdatedAt(upload),
        deadline: deadline.toISOString(),
        teamPayout: payout.team,
        driverPayout: payout.driver,
      };
    });
  return applyPaintSchemeTeamCaps(rows, PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP, PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP, getPaintSchemeSeasonPaidByTeam(seasonPayouts));
}

function getEasternDateTimePartsForPaintWinner(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

function shouldShowPreviousPaintWinner(date = new Date()) {
  const eastern = getEasternDateTimePartsForPaintWinner(date);

  // Hide starting Wednesday at 12:00 AM Eastern.
  // It will stay hidden Wednesday, Thursday, and Friday until a new race/weekend winner cycle starts.
  if (eastern.weekday === "Wed" || eastern.weekday === "Thu" || eastern.weekday === "Fri") return false;

  return true;
}

function getPreviousCompletedRaceForPaintWinner(tracks = [], date = new Date()) {
  const easternNow = getEasternDateTimePartsForPaintWinner(date);

  const sorted = [...(tracks || [])]
    .filter((track) => track?.date)
    .sort((a, b) => new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`));

  const completed = sorted.filter((track) => {
    const raceDate = String(track.date || "").slice(0, 10);
    if (!raceDate) return false;
    if (easternNow.dateKey > raceDate) return true;
    if (easternNow.dateKey < raceDate) return false;
    return easternNow.hour >= 22;
  });

  return completed[completed.length - 1] || null;
}

function getPaintUploadRaceForStandings(upload) {
  return upload?.race_id || upload?.race_week || upload?.race_name || "";
}

function isPaintImageUploadForStandings(upload) {
  const url = upload?.image_url || upload?.file_url || "";
  const fileType = String(upload?.file_type || "").toLowerCase();
  return fileType.startsWith("image/") || url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
}

function PaintSchemeWinnerStandingsCard({ tracks = [], drivers = [] }) {
  const [winner, setWinner] = useState(null);
  const [raceName, setRaceName] = useState("");
  const [loading, setLoading] = useState(true);

  const previousRace = useMemo(() => getPreviousCompletedRaceForPaintWinner(tracks), [JSON.stringify((tracks || []).map((track) => ({ name: track?.name, date: track?.date })))]);
  const previousRaceName = previousRace?.name || "";
  const driversKeyForPaintWinner = useMemo(() => JSON.stringify((drivers || []).map((driver) => ({ id: driver?.id, number: driver?.number, name: driver?.name, team: driver?.team }))), [drivers]);
  const showWinnerWindow = shouldShowPreviousPaintWinner();

  useEffect(() => {
    let isMounted = true;

    async function loadWinner() {
      if (!showWinnerWindow) {
        if (isMounted) {
          setWinner(null);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      if (!previousRaceName) {
        if (isMounted) {
          setWinner(null);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
        supabase.from("paint_scheme_votes").select("*").order("created_at", { ascending: false }),
      ]);

      if (uploadError || voteError) {
        console.error("Could not load previous paint scheme winner:", uploadError || voteError);
        if (isMounted) {
          setWinner(null);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      const raceUploads = (uploadData || [])
        .filter((upload) => isPaintImageUploadForStandings(upload))
        .filter((upload) => getPaintUploadRaceForStandings(upload) === previousRaceName);

      if (raceUploads.length === 0) {
        if (isMounted) {
          setWinner(null);
          setRaceName(previousRaceName);
          setLoading(false);
        }
        return;
      }

      const counts = new Map();
      (voteData || []).forEach((vote) => {
        const key = String(vote.upload_id || "");
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const sorted = [...raceUploads].sort((a, b) => {
        const voteDiff = (counts.get(String(b.id)) || 0) - (counts.get(String(a.id)) || 0);
        if (voteDiff !== 0) return voteDiff;
        return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
      });

      const winningUpload = sorted[0];
      const driver = (drivers || []).find((item) => String(item.id) === String(winningUpload.driver_id));
      const enrichedWinner = {
        ...winningUpload,
        voteCount: counts.get(String(winningUpload.id)) || 0,
        driverLabel: driver ? `#${driver.number} ${driver.name}` : winningUpload.driver_name || winningUpload.uploader_name || "Unknown Driver",
        teamLabel: driver?.team || winningUpload.team || winningUpload.team_key || "—",
        imageUrl: winningUpload.image_url || winningUpload.file_url || "",
      };

      if (isMounted) {
        setWinner(enrichedWinner);
        setRaceName(previousRaceName);
        setLoading(false);
      }
    }

    loadWinner();

    return () => {
      isMounted = false;
    };
  }, [previousRaceName, showWinnerWindow, driversKeyForPaintWinner]);

  if (loading || !winner) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,23,42,0.96))",
        border: "1px solid #d4af37",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
        display: "grid",
        gridTemplateColumns: "minmax(180px, 320px) 1fr",
        gap: 18,
        alignItems: "center",
      }}
    >
      <div style={{ borderRadius: 14, overflow: "hidden", background: "#0f1319", border: "1px solid rgba(255,255,255,0.12)" }}>
        <img src={winner.imageUrl} alt={winner.driverLabel} style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }} />
      </div>

      <div>
        <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase" }}>
          Previous Week Winner
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
          🎨 Paint Scheme of the Week
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>
          {winner.driverLabel}
        </div>
        <div style={{ opacity: 0.75, marginTop: 4 }}>
          {winner.teamLabel} • {raceName} • {winner.voteCount} votes
        </div>
        <div style={{ opacity: 0.62, fontSize: 12, marginTop: 10 }}>
          Display automatically hides Wednesday at 12:00 AM Eastern.
        </div>
      </div>
    </div>
  );
}



function PreviousRaceWinnerStandingsCard() {
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWinner() {
      const { data, error } = await supabase
        .from("previous_race_winner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Could not load previous race winner:", error);
        setWinner(null);
        return;
      }

      setWinner(data || null);
    }

    loadWinner();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!winner) return null;

  const mediaUrl = winner.media_url || winner.mediaUrl || "";
  const mediaType = winner.media_type || winner.mediaType || "";
  const raceName = winner.race_name || winner.raceName || "Last Race";
  const driverName = winner.driver_name || winner.name || "";
  const driverNumber = winner.driver_number || winner.number || "";
  const votePoints = winner.points || 0;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,23,42,0.96))",
        border: "1px solid #22c55e",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
      }}
    >
      {mediaUrl && (
        <div style={{ marginBottom: 14, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", background: "#0f1319" }}>
          {mediaType === "video" ? (
            <video controls src={mediaUrl} style={{ width: "100%", maxHeight: 420, display: "block", objectFit: "cover" }} />
          ) : (
            <img src={mediaUrl} alt={`${driverName} previous race winner`} style={{ width: "100%", maxHeight: 420, display: "block", objectFit: "cover" }} />
          )}
        </div>
      )}

      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase" }}>
        Previous Race Winner
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
        🏁 {raceName}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
        #{driverNumber} {driverName}
      </div>
      <div style={{ opacity: 0.75, marginTop: 4 }}>
        {winner.team || "—"} • {winner.manufacturer || "—"} • {votePoints} points
      </div>
      {winner.note && <div style={{ marginTop: 10, lineHeight: 1.5, opacity: 0.82 }}>{winner.note}</div>}
    </div>
  );
}


function PreviousRaceWinnerAdminPanel({ drivers = [], raceHistory = [] }) {
  const [form, setForm] = useState({ raceName: "", driverId: "", number: "", name: "", team: "", manufacturer: "", points: "", note: "", mediaUrl: "", mediaType: "" });
  const [savingWinner, setSavingWinner] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [winnerError, setWinnerError] = useState("");

  const [cloudinaryReady, setCloudinaryReady] = useState(Boolean(window.cloudinary));
  const imageWidgetRef = useRef(null);
  const videoWidgetRef = useRef(null);

  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
      return;
    }

    const existing = document.getElementById("cloudinary-widget-script");
    if (existing) {
      existing.addEventListener("load", () => setCloudinaryReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "cloudinary-widget-script";
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryReady(true);
    script.onerror = () => console.error("Cloudinary widget failed to load");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!cloudinaryReady || !window.cloudinary) return;

    imageWidgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "car_uploads",
        resourceType: "image",
        folder: "previous-race-winners",
        maxFileSize: 15000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
      },
      (error, result) => {
        if (error) {
          console.error("Previous race winner image upload failed:", error);
          alert("Image upload failed: " + (error.message || "Unknown error"));
          return;
        }

        if (result?.event === "success") {
          setForm((current) => ({
            ...current,
            mediaUrl: result.info.secure_url,
            mediaType: "image",
          }));
          alert("✅ Winner picture uploaded.");
        }
      }
    );

    videoWidgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "car_uploads",
        resourceType: "auto",
        folder: "previous-race-winners",
        maxFileSize: 200000000,
        clientAllowedFormats: ["mp4", "mov", "avi", "mkv", "webm"],
      },
      (error, result) => {
        if (error) {
          console.error("Previous race winner video upload failed:", error);
          alert("Video upload failed: " + (error.message || "Unknown error"));
          return;
        }

        if (result?.event === "success") {
          setForm((current) => ({
            ...current,
            mediaUrl: result.info.secure_url,
            mediaType: "video",
          }));
          alert("✅ Winner video uploaded.");
        }
      }
    );
  }, [cloudinaryReady]);

  function openWinnerImageUploader() {
    if (!cloudinaryReady || !imageWidgetRef.current) {
      alert("Uploader is still loading. Try again in a moment.");
      return;
    }
    imageWidgetRef.current.open();
  }

  function openWinnerVideoUploader() {
    if (!cloudinaryReady || !videoWidgetRef.current) {
      alert("Uploader is still loading. Try again in a moment.");
      return;
    }
    videoWidgetRef.current.open();
  }



  const latestRace = Array.isArray(raceHistory) && raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((result) => Number(result.finishPos) === 1 || result.isWin) || null;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedWinner() {
      const { data, error } = await supabase
        .from("previous_race_winner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Could not load saved previous race winner:", error);
        setWinnerError("Could not load saved winner. Check previous_race_winner RLS select policy.");
        return;
      }

      if (data) {
        setForm({
          raceName: data.race_name || "",
          driverId: data.driver_id || "",
          number: data.driver_number || "",
          name: data.driver_name || "",
          team: data.team || "",
          manufacturer: data.manufacturer || "",
          points: data.points || "",
          note: data.note || "",
          mediaUrl: data.media_url || "",
          mediaType: data.media_type || "",
        });
      }
    }

    loadSavedWinner();

    return () => {
      isMounted = false;
    };
  }, []);


  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseDriver(driverId) {
    const driver = (drivers || []).find((item) => String(item.id) === String(driverId));
    if (!driver) {
      updateField("driverId", driverId);
      return;
    }

    setForm((current) => ({
      ...current,
      driverId,
      number: driver.number || "",
      name: driver.name || "",
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
    }));
  }

  function autofillFromLatestRace() {
    if (!latestRace || !latestWinner) {
      alert("No race winner found in race history yet.");
      return;
    }

    setForm({
      raceName: latestRace.raceName || "",
      driverId: latestWinner.driverId || "",
      number: latestWinner.number || "",
      name: latestWinner.name || "",
      team: latestWinner.team || "",
      manufacturer: latestWinner.manufacturer || "",
      points: latestWinner.totalRacePoints ?? "",
      note: form.note || "",
      mediaUrl: form.mediaUrl || "",
      mediaType: form.mediaType || "",
    });
  }

  async function saveWinner() {
    setWinnerMessage("");
    setWinnerError("");

    if (!form.raceName || !form.name || !form.number) {
      alert("Add the race name, driver name, and number before saving.");
      return;
    }

    const payload = {
      id: 1,
      race_name: form.raceName || "",
      driver_id: form.driverId ? String(form.driverId) : null,
      driver_number: String(form.number || ""),
      driver_name: form.name || "",
      team: form.team || "",
      manufacturer: form.manufacturer || "",
      points: Number(form.points || 0),
      note: form.note || "",
      media_url: form.mediaUrl || "",
      media_type: form.mediaType || "",
      active: true,
      updated_at: new Date().toISOString(),
    };

    setSavingWinner(true);

    const { error } = await supabase
      .from("previous_race_winner")
      .upsert(payload, { onConflict: "id" });

    setSavingWinner(false);

    if (error) {
      console.error("Could not save previous race winner:", error);
      setWinnerError("Could not save winner. Check previous_race_winner table and RLS upsert policy.");
      alert("Could not save winner. Check previous_race_winner table and RLS policy.");
      return;
    }

    setWinnerMessage("Previous race winner saved to /standings.");
    alert("Previous race winner saved to /standings.");
  }

  async function clearWinner() {
    if (!window.confirm("Clear the previous race winner from standings?")) return;

    setWinnerMessage("");
    setWinnerError("");

    const { error } = await supabase
      .from("previous_race_winner")
      .delete()
      .eq("id", 1);

    if (error) {
      console.error("Could not clear previous race winner:", error);
      setWinnerError("Could not clear winner. Check previous_race_winner RLS delete policy.");
      alert("Could not clear winner. Check previous_race_winner RLS delete policy.");
      return;
    }

    setForm({ raceName: "", driverId: "", number: "", name: "", team: "", manufacturer: "", points: "", note: "", mediaUrl: "", mediaType: "" });
    setWinnerMessage("Previous race winner cleared from /standings.");
    alert("Previous race winner cleared.");
  }

  return (
    <div style={sectionCardStyle}>
      <h2 style={{ marginTop: 0 }}>🏁 Previous Race Winner</h2>
      <div style={{ opacity: 0.72, marginBottom: 14 }}>
        Feed the winner card shown on /standings. You can auto-fill from the latest saved race or enter it manually.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" onClick={autofillFromLatestRace} style={secondaryButtonStyle}>
          Auto-Fill From Latest Race
        </button>
        <button type="button" onClick={saveWinner} style={primaryButtonStyle}>
          {savingWinner ? "Saving..." : "Save Winner to Standings"}
        </button>
        <button type="button" onClick={clearWinner} style={dangerButtonStyle}>
          Clear Winner
        </button>
      </div>

      {winnerMessage && <div style={{ color: "#4ade80", marginBottom: 12, fontWeight: 900 }}>{winnerMessage}</div>}
      {winnerError && <div style={{ color: "#f87171", marginBottom: 12, fontWeight: 900 }}>{winnerError}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>RACE NAME</label>
          <input value={form.raceName || ""} onChange={(event) => updateField("raceName", event.target.value)} placeholder="Daytona (Night)" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SELECT DRIVER</label>
          <select value={form.driverId || ""} onChange={(event) => chooseDriver(event.target.value)} style={inputStyle}>
            <option value="">Manual / choose driver</option>
            {(drivers || []).map((driver) => (
              <option key={driver.id} value={driver.id}>#{driver.number} {driver.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>NUMBER</label>
          <input value={form.number || ""} onChange={(event) => updateField("number", event.target.value)} placeholder="16" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>DRIVER NAME</label>
          <input value={form.name || ""} onChange={(event) => updateField("name", event.target.value)} placeholder="Driver name" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>TEAM</label>
          <input value={form.team || ""} onChange={(event) => updateField("team", event.target.value)} placeholder="WSM" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>MANUFACTURER</label>
          <input value={form.manufacturer || ""} onChange={(event) => updateField("manufacturer", event.target.value)} placeholder="Chevrolet" style={inputStyle} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>POINTS</label>
          <input value={form.points || ""} onChange={(event) => updateField("points", event.target.value)} placeholder="55" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: 14, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 10 }}>WINNER MEDIA OPTIONAL</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button type="button" onClick={openWinnerImageUploader} style={{ ...secondaryButtonStyle, opacity: cloudinaryReady ? 1 : 0.6 }}>
            {cloudinaryReady ? "📷 Upload Winner Picture" : "⏳ Loading Uploader"}
          </button>
          <button type="button" onClick={openWinnerVideoUploader} style={{ ...secondaryButtonStyle, background: "#dc2626", border: "1px solid #ef4444", opacity: cloudinaryReady ? 1 : 0.6 }}>
            {cloudinaryReady ? "🎥 Upload Winner Video" : "⏳ Loading Uploader"}
          </button>
          {form.mediaUrl && (
            <button type="button" onClick={() => setForm((current) => ({ ...current, mediaUrl: "", mediaType: "" }))} style={dangerButtonStyle}>
              Remove Media
            </button>
          )}
        </div>

        {form.mediaUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
              Current media: {form.mediaType === "video" ? "Video" : "Picture"}
            </div>
            {form.mediaType === "video" ? (
              <video controls src={form.mediaUrl} style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid #2c3440" }} />
            ) : (
              <img src={form.mediaUrl} alt="Winner media preview" style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid #2c3440" }} />
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SHORT NOTE OPTIONAL</label>
        <textarea value={form.note || ""} onChange={(event) => updateField("note", event.target.value)} rows={3} placeholder="Example: Survived Daytona chaos and delivered WSM its first win." style={{ ...inputStyle, resize: "vertical" }} />
      </div>
    </div>
  );
}





function AdminLeagueMessageComposer({ drivers = [], teams = [] }) {
  const [form, setForm] = useState({
    recipient_type: "league",
    recipient_driver_number: "",
    recipient_team: "",
    recipient_manufacturer: "Toyota",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  const activeTeams = useMemo(() => {
    const teamSet = new Set();
    (teams || []).forEach((team) => {
      const key = team?.team || team;
      if (key && key !== "Independent" && key !== "IND") teamSet.add(key);
    });
    activeDrivers.forEach((driver) => {
      if (driver.team && driver.team !== "Independent" && driver.team !== "IND") teamSet.add(driver.team);
    });
    return Array.from(teamSet).sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [teams, activeDrivers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function sendAdminMessage(event) {
    event?.preventDefault?.();
    setStatus("");
    setError("");

    const body = String(form.message || "").trim();
    const subject = String(form.subject || "").trim();
    const recipientType = String(form.recipient_type || "league");

    if (!body) {
      setError("Type a message before sending.");
      return;
    }

    if (body.length > 1500) {
      setError("Keep admin messages under 1,500 characters to save database space.");
      return;
    }

    const basePayload = {
      message_type: recipientType === "manufacturer" ? "manufacturer" : recipientType === "owners" ? "owner_notice" : "race_control",
      sender_type: "admin",
      sender_name: recipientType === "manufacturer" ? `${form.recipient_manufacturer} Manufacturer Office` : "Race Control / League Board",
      subject: subject || null,
      message: body,
      is_read: false,
      archived: false,
      created_at: new Date().toISOString(),
    };

    let payload = { ...basePayload, recipient_type: recipientType };

    if (recipientType === "driver") {
      if (!form.recipient_driver_number) {
        setError("Choose a driver.");
        return;
      }
      const driver = activeDrivers.find((item) => String(item.number) === String(form.recipient_driver_number));
      payload = {
        ...payload,
        recipient_driver_number: String(form.recipient_driver_number),
        recipient_team: driver?.team || null,
        recipient_manufacturer: driver?.manufacturer || null,
      };
    }

    if (recipientType === "team") {
      if (!form.recipient_team) {
        setError("Choose a team.");
        return;
      }
      payload = { ...payload, recipient_team: form.recipient_team };
    }

    if (recipientType === "manufacturer") {
      if (!form.recipient_manufacturer) {
        setError("Choose a manufacturer.");
        return;
      }
      payload = { ...payload, recipient_manufacturer: form.recipient_manufacturer };
    }

    const { error: insertError } = await supabase.from("league_messages").insert([payload]);

    if (insertError) {
      console.error("Could not send admin message:", insertError);
      setError("Could not send message. Check league_messages insert policy and columns.");
      return;
    }

    setForm((current) => ({ ...current, subject: "", message: "" }));
    setStatus("League Message Center notice sent.");
  }

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>📢 League Message Center Sender</h2>
          <div style={{ opacity: 0.72, fontSize: 13, marginTop: 6 }}>Send official messages from the Board, Race Control, owners group, teams, or manufacturers.</div>
        </div>
        <button type="button" onClick={() => (window.location.pathname = "/message-center")} style={secondaryButtonStyle}>Open Public Message Center</button>
      </div>

      <form onSubmit={sendAdminMessage}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SEND TO</label>
            <select value={form.recipient_type} onChange={(event) => updateField("recipient_type", event.target.value)} style={inputStyle}>
              <option value="league">Entire League</option>
              <option value="owners">Owners Only</option>
              <option value="driver">Specific Driver</option>
              <option value="team">Specific Team</option>
              <option value="manufacturer">Manufacturer Group</option>
            </select>
          </div>

          {form.recipient_type === "driver" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER</label>
              <select value={form.recipient_driver_number} onChange={(event) => updateField("recipient_driver_number", event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id || driver.number} value={String(driver.number)}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)} / {driver.manufacturer}</option>
                ))}
              </select>
            </div>
          )}

          {form.recipient_type === "team" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>TEAM</label>
              <select value={form.recipient_team} onChange={(event) => updateField("recipient_team", event.target.value)} style={inputStyle}>
                <option value="">Choose team</option>
                {activeTeams.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
              </select>
            </div>
          )}

          {form.recipient_type === "manufacturer" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>MANUFACTURER</label>
              <select value={form.recipient_manufacturer} onChange={(event) => updateField("recipient_manufacturer", event.target.value)} style={inputStyle}>
                <option value="Toyota">Toyota</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SUBJECT</label>
            <input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Penalty, meeting, race control notice..." style={inputStyle} maxLength={120} />
          </div>
        </div>

        <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Type the official league message..." rows={5} style={{ ...inputStyle, resize: "vertical" }} maxLength={1500} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <button type="submit" style={primaryButtonStyle}>Send League Message</button>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{form.message.length}/1500 characters</div>
        </div>
        {status && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{status}</div>}
        {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}
      </form>
    </div>
  );
}


function AdminLeagueMessageDashboard({ drivers = [], teams = [] }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  function getRecipientLabel(message) {
    const type = String(message?.recipient_type || "").toLowerCase();
    if (message?.recipient_driver_number) {
      const driver = activeDrivers.find((item) => String(item.number) === String(message.recipient_driver_number));
      return `#${message.recipient_driver_number}${driver?.name ? ` ${driver.name}` : ""}`;
    }
    if (type === "team" || message?.recipient_team) return getTeamFullName(message.recipient_team || "Team");
    if (type === "manufacturer" || message?.recipient_manufacturer) return `${message.recipient_manufacturer || "Manufacturer"} Drivers`;
    if (type === "owners") return "Owners Only";
    if (type === "league") return "Entire League";
    return message?.recipient_type || "Unknown";
  }

  function getMessageCategory(message) {
    const type = String(message?.recipient_type || "").toLowerCase();
    if (type === "owners") return "owners";
    if (type === "team" || message?.recipient_team) return "team";
    if (type === "driver" || message?.recipient_driver_number) return "driver";
    if (type === "manufacturer" || message?.recipient_manufacturer) return "manufacturer";
    if (type === "league") return "league";
    return "other";
  }

  const filteredMessages = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    return (messages || [])
      .filter((message) => {
        if (filter !== "all" && getMessageCategory(message) !== filter) return false;
        if (!term) return true;
        const haystack = [
          message.subject,
          message.message,
          message.sender_name,
          message.recipient_type,
          message.recipient_driver_number,
          message.recipient_team,
          message.recipient_manufacturer,
          getRecipientLabel(message),
        ].join(" ").toLowerCase();
        return haystack.includes(term);
      });
  }, [messages, filter, search, activeDrivers]);

  const summary = useMemo(() => {
    const rows = messages || [];
    return {
      total: rows.length,
      unread: rows.filter((message) => !message.is_read).length,
      owners: rows.filter((message) => getMessageCategory(message) === "owners" || getMessageCategory(message) === "team").length,
      drivers: rows.filter((message) => getMessageCategory(message) === "driver").length,
      broadcasts: rows.filter((message) => ["league", "manufacturer"].includes(getMessageCategory(message))).length,
    };
  }, [messages]);

  async function loadAdminMessages() {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("league_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (loadError) {
      console.error("Could not load admin message dashboard:", loadError);
      setError("Could not load messages. Check league_messages select policy.");
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages(data || []);
    setLoading(false);
  }


  async function updateAdminMessageReadStatus(messageId, isRead) {
    if (!messageId) return;
    setStatus("");
    setError("");

    const { error: updateError } = await supabase
      .from("league_messages")
      .update({ is_read: Boolean(isRead) })
      .eq("id", messageId);

    if (updateError) {
      console.error("Could not update message read status:", updateError);
      setError("Could not update message read status. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, is_read: Boolean(isRead) } : message));
    setSelectedMessage((current) => current?.id === messageId ? { ...current, is_read: Boolean(isRead) } : current);
    setStatus(isRead ? "Message marked read." : "Message marked unread.");
  }

  async function markFilteredMessagesRead() {
    const unreadIds = (filteredMessages || []).filter((message) => !message.is_read && !message.archived).map((message) => message.id).filter(Boolean);
    if (!unreadIds.length) {
      setStatus("No unread messages in the current filter.");
      return;
    }

    setStatus("");
    setError("");
    const { error: updateError } = await supabase
      .from("league_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (updateError) {
      console.error("Could not mark filtered messages read:", updateError);
      setError("Could not mark filtered messages read. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, is_read: true } : message));
    setStatus("Filtered unread messages marked read.");
  }

  async function archiveMessage(messageId) {
    if (!messageId) return;
    if (!window.confirm("Archive this message from the admin dashboard?")) return;
    setStatus("");
    setError("");

    const { error: archiveError } = await supabase
      .from("league_messages")
      .update({ archived: true })
      .eq("id", messageId);

    if (archiveError) {
      console.error("Could not archive message:", archiveError);
      setError("Could not archive message. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, archived: true } : message));
    setStatus("Message archived.");
  }

  useEffect(() => {
    loadAdminMessages();
    const interval = setInterval(loadAdminMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid #3d4859" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>📬 Admin Message Dashboard</h2>
          <div style={{ opacity: 0.72, fontSize: 13, marginTop: 6 }}>
            Board view for messages sent to owners, teams, drivers, manufacturers, and the entire league.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={loadAdminMessages} style={secondaryButtonStyle} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Messages"}
          </button>
          <button type="button" onClick={markFilteredMessagesRead} style={primaryButtonStyle}>Mark Filtered Read</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>TOTAL</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.total}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>UNREAD</div><div style={{ fontSize: 24, fontWeight: 900, color: "#f87171" }}>{summary.unread}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>OWNERS / TEAMS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.owners}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>DRIVERS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.drivers}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>BROADCASTS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.broadcasts}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>FILTER</label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} style={inputStyle}>
            <option value="all">All Messages</option>
            <option value="owners">Owners Only</option>
            <option value="team">Teams</option>
            <option value="driver">Drivers</option>
            <option value="manufacturer">Manufacturers</option>
            <option value="league">Entire League</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SEARCH</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subject, recipient, team, driver..." style={inputStyle} />
        </div>
      </div>

      {status && <div style={{ color: "#4ade80", marginBottom: 12, fontWeight: 900 }}>{status}</div>}
      {error && <div style={{ color: "#f87171", marginBottom: 12, fontWeight: 900 }}>{error}</div>}

      {filteredMessages.length === 0 ? (
        <div style={{ opacity: 0.72 }}>No messages found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>To</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Read</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => {
                const archived = Boolean(message.archived);
                return (
                  <tr key={message.id} style={{ opacity: archived ? 0.45 : 1 }}>
                    <td style={tdStyle}>{message.created_at ? new Date(message.created_at).toLocaleString() : "—"}</td>
                    <td style={tdStyle}>{getRecipientLabel(message)}</td>
                    <td style={tdStyle}>{message.sender_name || message.sender_type || "League"}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 900 }}>{message.subject || "No subject"}</div>
                      <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>{String(message.message || "").slice(0, 90)}{String(message.message || "").length > 90 ? "..." : ""}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900, background: message.is_read ? "#102a16" : "#2a1111", color: message.is_read ? "#4ade80" : "#f87171", border: `1px solid ${message.is_read ? "#22c55e" : "#ef4444"}` }}>
                        {message.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setSelectedMessage(message)} style={secondaryButtonStyle}>View</button>
                        {!archived && (!message.is_read ? <button type="button" onClick={() => updateAdminMessageReadStatus(message.id, true)} style={secondaryButtonStyle}>Mark Read</button> : <button type="button" onClick={() => updateAdminMessageReadStatus(message.id, false)} style={secondaryButtonStyle}>Mark Unread</button>)}
                        {!archived && <button type="button" onClick={() => archiveMessage(message.id)} style={dangerButtonStyle}>Archive</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedMessage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.74)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#171b22", border: "1px solid #3d4859", borderRadius: 18, padding: 22, width: "min(760px, 100%)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{selectedMessage.subject || "No subject"}</div>
                <div style={{ opacity: 0.65, fontSize: 13, marginTop: 6 }}>
                  To: {getRecipientLabel(selectedMessage)} · From: {selectedMessage.sender_name || selectedMessage.sender_type || "League"}
                </div>
                <div style={{ opacity: 0.55, fontSize: 12, marginTop: 4 }}>{selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ""}</div>
              </div>
              <button type="button" onClick={() => setSelectedMessage(null)} style={secondaryButtonStyle}>Close</button>
            </div>
            <div style={{ marginTop: 18, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {selectedMessage.message || "No message body."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              <div>Type: {selectedMessage.message_type || "—"}</div>
              <div>Recipient Type: {selectedMessage.recipient_type || "—"}</div>
              <div>Team: {selectedMessage.recipient_team || "—"}</div>
              <div>Manufacturer: {selectedMessage.recipient_manufacturer || "—"}</div>
              <div>Archived: {selectedMessage.archived ? "Yes" : "No"}</div>
              <div>Read: {selectedMessage.is_read ? "Yes" : "No"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {!selectedMessage.is_read ? <button type="button" onClick={() => updateAdminMessageReadStatus(selectedMessage.id, true)} style={primaryButtonStyle}>Mark Read</button> : <button type="button" onClick={() => updateAdminMessageReadStatus(selectedMessage.id, false)} style={secondaryButtonStyle}>Mark Unread</button>}
              {!selectedMessage.archived && <button type="button" onClick={() => archiveMessage(selectedMessage.id)} style={dangerButtonStyle}>Archive</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LeagueMessageCenterLandingPage({ drivers = [] }) {
  const [selectedDriverNumber, setSelectedDriverNumber] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCounts() {
      const nextCounts = {};
      for (const driver of activeDrivers) {
        const driverNumber = String(driver.number || "");
        if (!driverNumber) continue;

        const { count, error: countError } = await supabase
          .from("league_messages")
          .select("*", { count: "exact", head: true })
          .or(`recipient_type.eq.league,recipient_driver_number.eq.${driverNumber},recipient_team.eq.${driver.team},recipient_manufacturer.eq.${driver.manufacturer}`)
          .eq("archived", false);

        if (!countError) nextCounts[driverNumber] = count || 0;
      }

      if (isMounted) setUnreadCounts(nextCounts);
    }

    if (activeDrivers.length) loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeDrivers]);

  async function unlockMessageCenter(event) {
    event?.preventDefault?.();
    setError("");

    const driver = activeDrivers.find((item) => String(item.number) === String(selectedDriverNumber));
    if (!driver) {
      setError("Choose your driver first.");
      return;
    }

    const enteredCode = String(driverCode || "").trim().toUpperCase();
    if (!enteredCode) {
      setError("Enter your driver access code.");
      return;
    }

    const { data, error: codeError } = await supabase
      .from("driver_access_codes")
      .select("driver_number, driver_name, code, active")
      .eq("active", true)
      .or(`driver_number.eq.${String(driver.number)},driver_name.ilike.${driver.name}`)
      .limit(10);

    if (codeError) {
      console.error("Could not verify driver access code:", codeError);
      setError("Could not verify access. Check driver_access_codes select policy.");
      return;
    }

    const match = (data || []).some((row) => {
      const rowDriverNumber = String(row.driver_number || "");
      const rowDriverName = String(row.driver_name || "").trim().toLowerCase();
      const rowCode = String(row.code || "").trim().toUpperCase();
      return (
        rowCode === enteredCode &&
        (rowDriverNumber === String(driver.number) || rowDriverName === String(driver.name || "").trim().toLowerCase())
      );
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";

    if (!match && !adminMatch) {
      setError("Incorrect driver access code.");
      return;
    }

    localStorage.setItem("driverProfileAuthorizedNumber", String(driver.number));
    window.location.pathname = `/driver/${driver.number}/messages`;
  }

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 980 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", letterSpacing: 1.4 }}>BUDWEISER CUP LEAGUE</div>
              <h1 style={{ margin: "6px 0", fontSize: 34 }}>📩 League Message Center</h1>
              <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.5 }}>
                Direct messages, Race Control notices, owner/team messages, contract alerts, and assignments all live here.
              </p>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={unlockMessageCenter} style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Login Required</h2>
          <p style={{ opacity: 0.72, lineHeight: 1.5 }}>
            Drivers can see message counts publicly, but must unlock their profile before reading or sending messages.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER</div>
              <select value={selectedDriverNumber} onChange={(event) => setSelectedDriverNumber(event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => {
                  const count = unreadCounts[String(driver.number)] || 0;
                  return (
                    <option key={driver.id || driver.number} value={driver.number}>
                      #{driver.number} {driver.name}{count ? ` — ${count} message${count === 1 ? "" : "s"}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER ACCESS CODE</div>
              <input
                type="password"
                value={driverCode}
                onChange={(event) => setDriverCode(event.target.value)}
                placeholder="Enter driver password"
                style={inputStyle}
              />
            </div>

            <button type="submit" style={primaryButtonStyle}>Open Message Center</button>
          </div>

          {error && <div style={{ color: "#f87171", fontWeight: 900, marginTop: 12 }}>{error}</div>}
        </form>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Message Counts</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
            {activeDrivers.map((driver) => {
              const count = unreadCounts[String(driver.number)] || 0;
              return (
                <button
                  key={driver.id || driver.number}
                  type="button"
                  onClick={() => setSelectedDriverNumber(String(driver.number))}
                  style={{
                    textAlign: "left",
                    background: count ? "rgba(239,68,68,0.12)" : "#0f1319",
                    border: count ? "1px solid #ef4444" : "1px solid #313947",
                    color: "white",
                    borderRadius: 12,
                    padding: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>#{driver.number} {driver.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                    {count ? `🔔 ${count} message${count === 1 ? "" : "s"}` : "No messages showing"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PublicStandings({ drivers, teams, manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [] }) {
  const [standingsTab, setStandingsTab] = useState("drivers");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [manualOnesToWatch, setManualOnesToWatch] = useState([]);
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

  useEffect(() => {
    let isMounted = true;
    async function loadManualOnesToWatch() {
      const { data, error } = await supabase
        .from("ones_to_watch")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (!error) setManualOnesToWatch(data || []);
    }
    loadManualOnesToWatch();
    const interval = setInterval(loadManualOnesToWatch, 5000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const sorted = dedupeDriversByNumber(drivers).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const [leader, second, third] = sorted;
  const totalPoints = sorted.reduce((s, d) => s + (d.points || 0), 0);
  const totalWins = sorted.reduce((s, d) => s + (d.wins || 0), 0);
  const totalDnfs = sorted.reduce((s, d) => s + (d.dnfs || 0), 0);
  // Sort tracks by date and roll the upcoming race after 10:00 PM Eastern on race day.
  const completedRaces = new Set((raceHistory || []).map(r => r.raceName));
  const sortedTracks = getSortedTracksByDate(tracks);
  const nextRace = getUpcomingRaceByDate(sortedTracks);

  const autoOnesToWatch = sorted
    .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
    .map((driver) => {
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((r) => r.driverId === driver.id);
          if (!result) return null;
          const finish = Number(result.finishPos || result.finish || result.position || 99);
          return { raceName: race.raceName, finish, dnf: !!result.dnf };
        })
        .filter(Boolean);

      const avgFinish = recentResults.length
        ? recentResults.reduce((sum, result) => sum + result.finish, 0) / recentResults.length
        : 99;
      const latestFinish = recentResults.length ? recentResults[recentResults.length - 1].finish : null;
      const recentTop5s = recentResults.filter((result) => result.finish <= 5).length;
      const recentDnfs = recentResults.filter((result) => result.dnf).length;
      const positionIndex = sorted.findIndex((d) => d.id === driver.id);
      const standingsRank = positionIndex >= 0 ? positionIndex + 1 : 99;

      const watchScore =
        (driver.points || 0) +
        (driver.wins || 0) * 35 +
        (driver.top3 || 0) * 12 +
        (driver.top5 || 0) * 7 +
        recentTop5s * 18 +
        Math.max(0, 25 - avgFinish) * 4 -
        recentDnfs * 15 -
        standingsRank * 2;

      let reason = "Building momentum";
      if (driver.wins > 0) reason = "Race-winning threat";
      else if (recentTop5s >= 2) reason = "Hot over the last 3 races";
      else if (avgFinish <= 6) reason = "Consistent front-runner";
      else if (standingsRank > 8 && recentTop5s >= 1) reason = "Underdog moving forward";
      else if ((driver.top5 || 0) > 0) reason = "Top-5 speed showing";

      return { ...driver, avgFinish, latestFinish, recentTop5s, standingsRank, watchScore, reason };
    })
    .sort((a, b) => b.watchScore - a.watchScore)
    .slice(0, 5);

  const manualWatchDrivers = manualOnesToWatch
    .map((pick) => {
      const driver = drivers.find((d) => Number(d.id) === Number(pick.driver_id));
      if (!driver) return null;
      const standingsRank = sorted.findIndex((d) => d.id === driver.id) + 1;
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((r) => r.driverId === driver.id);
          if (!result) return null;
          const finish = Number(result.finishPos || result.finish || result.position || 99);
          return { finish, dnf: !!result.dnf };
        })
        .filter(Boolean);
      const avgFinish = recentResults.length ? recentResults.reduce((sum, result) => sum + result.finish, 0) / recentResults.length : 99;
      const latestFinish = recentResults.length ? recentResults[recentResults.length - 1].finish : null;
      return {
        ...driver,
        reason: pick.reason || "League director watch pick",
        watchBadge: pick.badge || "DIRECTOR PICK",
        standingsRank: standingsRank > 0 ? standingsRank : "—",
        latestFinish,
        avgFinish,
        isManualWatchPick: true,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  const onesToWatch = manualWatchDrivers.length > 0 ? manualWatchDrivers : autoOnesToWatch;
  const onesToWatchMode = manualWatchDrivers.length > 0 ? "DIRECTOR PICKS" : "AUTO-UPDATES FROM RACE HISTORY";

  const getTrackOverview = (trackName) => {
    const rawName = String(trackName || "").trim();
    const cleanName = rawName.replace(/^Preseason - /i, "").trim();
    return trackOverviewData[rawName] || trackOverviewData[cleanName] || {
      name: rawName || "Track",
      location: "—",
      type: "Track data not added yet",
      length: "—",
      turns: "—",
      banking: "—",
      pitSpeed: "—",
      restartZone: "—",
      tireWear: "—",
      notes: "Add this track to trackOverviewData in App.jsx.",
      raceTip: "No iRacing recommendation has been added for this track yet.",
      imageUrl: "",
    };
  };
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
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 16, padding: "14px 18px", minWidth: 240 }}>
                <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>ACTIVE SEASON</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{seasonName || "—"}</div>
              </div>
              <button onClick={() => (window.location.pathname = "/streams")} style={{ background: "#9146ff", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>📡 Streams</button>
              <button onClick={() => (window.location.pathname = "/discord")} style={{ background: "#5865f2", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>💬 Discord</button>
              <button onClick={() => (window.location.pathname = "/news")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>📰 News</button>
              <button onClick={() => (window.location.pathname = "/interviews")} style={{ background: "#c8102e", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🎤 Interviews</button>
              <button onClick={() => (window.location.pathname = "/paint-scheme-vote")} style={{ background: "#f97316", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🎨 Paint Scheme Vote</button>
              <button onClick={() => (window.location.pathname = "/vote")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 1000, cursor: "pointer", fontSize: 14 }}>🗳️ League Vote</button>
              <button onClick={() => (window.location.pathname = "/team-hq")} style={{ background: "#0f766e", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>🏢 Team HQ</button>
              <button onClick={() => (window.location.pathname = "/contracts")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>📄 Active Contracts</button>
              <button onClick={() => (window.location.pathname = "/submit-story")} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>✍️ Add Story</button>
              <button onClick={() => (window.location.pathname = "/notifications")} style={{ background: "#222936", color: "white", border: "1px solid #3a4453", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>🔔 Notifications</button>
              <button onClick={() => (window.location.pathname = "/message-center")} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>📩 Message Center</button>
              <button onClick={() => (window.location.pathname = "/chat")} style={{ background: "#22c55e", color: "#07110b", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>💬 League Chat</button>
              <button onClick={() => { sessionStorage.removeItem("bcl-admin-auth"); sessionStorage.removeItem("bcl-admin-auth-time"); localStorage.removeItem("bcl-admin-auth"); localStorage.removeItem("bcl-admin-auth-time"); window.location.pathname = "/admin"; }} style={{ background: "#111827", color: "#d4af37", border: "1px solid #d4af37", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🔐 Admin Portal</button>
</div> {/* ✅ CLOSE BUTTON ROW */}
          </div>
        </div>
        <LeagueTicker page="standings" />
        <AppUpdateBanner page="standings" />
        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
        <PreviousRaceWinnerStandingsCard />

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
                  const completed = isRaceCompleteByDateOrHistory(track, completedRaces);
                  const isNext = track.name === nextRace?.name;
                  return (
                    <div key={track.name} onClick={() => setSelectedTrackInfo(getTrackOverview(track.name))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 12, background: isNext ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${isNext ? "#d4af37" : completed ? "#1a3a1a" : "#1e2530"}`, cursor: "pointer" }}>
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
        {selectedTrackInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
            <div style={{ background: "#151a22", border: "1px solid #d4af37", borderRadius: 22, padding: 24, maxWidth: 920, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>iRACING TRACK INFO</div>
                  <div style={{ fontSize: 32, fontWeight: 900, marginTop: 6, lineHeight: 1.05 }}>{selectedTrackInfo.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.65, marginTop: 5 }}>{selectedTrackInfo.location}</div>
                </div>
                <button onClick={() => setSelectedTrackInfo(null)} style={{ background: "none", border: "none", color: "white", fontSize: 30, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>

              {selectedTrackInfo.imageUrl && (
                <img
                  src={selectedTrackInfo.imageUrl}
                  alt={selectedTrackInfo.name}
                  style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 16, marginBottom: 18, border: "1px solid #2d3643", background: "#0f1319" }}
                />
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "TYPE", value: selectedTrackInfo.type },
                  { label: "LENGTH", value: selectedTrackInfo.length },
                  { label: "TURNS", value: selectedTrackInfo.turns },
                  { label: "BANKING", value: selectedTrackInfo.banking },
                  { label: "PIT SPEED", value: selectedTrackInfo.pitSpeed },
                  { label: "TIRE WEAR", value: selectedTrackInfo.tireWear },
                  { label: "RESTART ZONE", value: selectedTrackInfo.restartZone },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#0f1319", border: "1px solid #2d3643", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 11, opacity: 0.58, marginBottom: 5, fontWeight: 800 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, lineHeight: 1.35 }}>{item.value || "—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 14, padding: 16, marginBottom: 14, lineHeight: 1.55 }}>
                <strong>Track Characteristics:</strong> {selectedTrackInfo.notes || "—"}
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2d3643", borderRadius: 14, padding: 16, lineHeight: 1.55 }}>
                <strong>Race Recommendations:</strong> {selectedTrackInfo.raceTip || selectedTrackInfo.notes || "—"}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          {podiumCard(leader, 1)}{podiumCard(second, 2)}{podiumCard(third, 3)}
        </div>

        {onesToWatch.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #171b22 0%, #0f1319 100%)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 22, padding: 20, marginBottom: 22, boxShadow: "0 14px 34px rgba(212,175,55,0.10)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", right: -45, top: -45, width: 150, height: 150, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 16, position: "relative" }}>
              <div>
                <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>BROADCAST FEATURE</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>🔥 Ones to Watch</div>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Drivers trending on points, recent finishes, wins, top-5 speed, and momentum.</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>{onesToWatchMode}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, position: "relative" }}>
              {onesToWatch.map((driver, index) => {
                const brand = getTeamBranding(driver.team);
                return (
                  <div
                    key={driver.id}
                    onClick={() => handleDriverClick(driver.number)}
                    style={{ background: index === 0 ? `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)` : "#11161d", border: index === 0 ? `1px solid ${brand.accent}` : "1px solid #2a3240", borderRadius: 18, padding: 16, cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,0.22)", minHeight: 178 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.75 }}>#{index + 1} {driver.watchBadge || "WATCH LIST"}</div>
                      {renderTeamBadge(driver.team, 42)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.32)", border: "2px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                        {driver.number}
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{driver.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginTop: 2 }}>{getTeamFullName(driver.team)}</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, fontSize: 13, fontWeight: 800 }}>
                      {driver.reason}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { label: "RANK", value: `P${driver.standingsRank}` },
                        { label: "LAST", value: driver.latestFinish ? `P${driver.latestFinish}` : "—" },
                        { label: "AVG 3", value: driver.avgFinish < 99 ? driver.avgFinish.toFixed(1) : "—" },
                      ].map((stat) => (
                        <div key={stat.label} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 10, padding: 8 }}>
                          <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 900 }}>{stat.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 900 }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
          {[
            { key: "drivers", label: "Driver Standings" },
            { key: "teams", label: "Team Standings" },
            { key: "manufacturers", label: "Manufacturer Standings" },
            { key: "points", label: "Points & Penalties" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStandingsTab(tab.key)}
              style={{
                background: standingsTab === tab.key ? "#d4af37" : "#1f2937",
                color: standingsTab === tab.key ? "#111" : "white",
                border: standingsTab === tab.key ? "1px solid #d4af37" : "1px solid #3d4859",
                borderRadius: 12,
                padding: "12px 18px",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {standingsTab === "drivers" && (
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
        
        )}
        {standingsTab === "teams" && (
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
        
        )}
        {standingsTab === "manufacturers" && (
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
        )}

        {standingsTab === "points" && (
          <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Points & Penalties</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Race Finish Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Winner receives 55 points. 2nd receives 35 points, then points decrease by 1 per position through the field.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Stage Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Top 10 stage finishers receive points: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Penalty Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Penalty deductions increase by offense: 1st -5, 2nd -10, 3rd -15, 4th+ -25.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Total Formula</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Finish Points + Stage Points + Bonuses - Penalties = Total Points.</p>
              </div>
            </div>
          </div>
        )}

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
      (d) => !isRemovedLeagueDriver(d) && Number(d.number) !== 76 && !existingNums.has(String(d.number))
    );
    // Update any drivers whose name/number/manufacturer/team has changed in defaultDrivers
    const updatedDrivers = realignLeagueDrivers(season.drivers)
      .filter((d) => !isInactivePlaceholderDriver(d))
      .filter((d) => !isRemovedLeagueDriver(d))
      .filter((d) => Number(d.number) !== 76 && String(d.name || "").trim().toLowerCase() !== "bcr_ziggy5525")
      .map((d) => {
        const canonical =
          defaultDrivers.find((dd) => dd.id === d.id) ||
          defaultDrivers.find((dd) => String(dd.number) === String(d.number));
        let updatedTeam = d.team === "KRM" ? "Independent" : d.team;
        if (!canonical) {
          return { ...d, team: isClosedLeagueTeam(updatedTeam) ? "Independent" : updatedTeam };
        }
        return {
          ...d,
          id: canonical.id,
          name: canonical.name,
          number: canonical.number,
          manufacturer: canonical.manufacturer,
          team: canonical.team === "KRM" || isClosedLeagueTeam(canonical.team) ? "Independent" : canonical.team,
        };
      });
    if (missing.length === 0 && updatedDrivers.every((d, i) => d === season.drivers[i])) return season;
    const newRoster = dedupeDriversByNumber([
      ...updatedDrivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false, notes: "" })),
      ...missing.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: false, notes: "" })),
    ]);
    return { ...season, drivers: rebuildDriversFromHistory(season.raceHistory || [], newRoster) };
  });
}

function SubmitStoryPage() {
  const [authorName, setAuthorName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showKickGraphic, setShowKickGraphic] = useState(false);

  const submitStory = async (e) => {
    e.preventDefault();
    const cleanStory = storyText.trim();
    if (!cleanStory) {
      alert("Please type your story before submitting.");
      return;
    }
    setSaving(true);
    const payload = {
      author_name: authorName.trim() || null,
      driver_name: driverName.trim() || null,
      title: storyTitle.trim() || null,
      story: cleanStory,
      status: "Open",
    };
    const { error } = await supabase.from("story_submissions").insert(payload);
    setSaving(false);
    if (error) {
      console.error("Story submission failed:", error);
      alert("Could not submit the story. Make sure the story_submissions Supabase table exists.");
      return;
    }
    setAuthorName("");
    setDriverName("");
    setStoryTitle("");
    setStoryText("");
    setSubmitted(true);
    setShowKickGraphic(true);
  };

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 900 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logo} alt="League Logo" style={{ height: 48 }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>Submit a Story</div>
                <div style={{ opacity: 0.72, fontSize: 14 }}>Send news, rumors, driver notes, race recaps, or league storylines to the admins.</div>
              </div>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
          {submitted && (
            <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.45)", borderRadius: 14, padding: 14, marginBottom: 16, color: "#bbf7d0", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>Story submitted. The admins can now review it.</span>
              <button type="button" onClick={() => setShowKickGraphic(true)} style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>View Kick Graphic</button>
            </div>
          )}

          {showKickGraphic && (
            <div onClick={() => setShowKickGraphic(false)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.86)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(1100px, 96vw)", background: "#050505", border: "2px solid #ef4444", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 90px rgba(239,68,68,0.25)" }}>
                <button type="button" onClick={() => setShowKickGraphic(false)} aria-label="Close story submitted graphic" style={{ position: "absolute", top: 12, right: 12, zIndex: 2, width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.55)", color: "white", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
                <img src={storySubmittedKick} alt="Story submitted action graphic" style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          )}
          <form onSubmit={submitStory}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Your Name / PSN</div>
                <input style={inputStyle} value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Example: AMP-GHOSTRIDER" />
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Driver / Team Mentioned</div>
                <input style={inputStyle} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Example: #39 BigDiehl21 / MER" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Story Title</div>
              <input style={inputStyle} value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="Example: WSM adds a new Chevrolet to the garage" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Story Details</div>
              <textarea
                style={{ ...inputStyle, minHeight: 220, resize: "vertical", lineHeight: 1.45 }}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Type the full story, notes, quote, rumor, race recap, or announcement here."
              />
            </div>
            <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.65 : 1 }}>
              {saving ? "Submitting..." : "Submit Story"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StoriesAdminPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyLoadError, setStoryLoadError] = useState("");

  const loadStories = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    setStoryLoadError("");

    const { data, error } = await supabase
      .from("story_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load stories:", error);
      setStoryLoadError("Could not load stories. Check the story_submissions table and RLS select policy.");
      if (showLoading) setLoading(false);
      return;
    }

    setStories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      const { data, error } = await supabase
        .from("story_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load stories:", error);
        setStoryLoadError("Could not load stories. Check the story_submissions table and RLS select policy.");
      } else {
        setStories(data || []);
        setStoryLoadError("");
      }

      setLoading(false);
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateStoryStatus = async (storyId, status) => {
    const { error } = await supabase
      .from("story_submissions")
      .update({ status })
      .eq("id", storyId);
    if (error) {
      console.error("Failed to update story:", error);
      alert("Could not update that story.");
      return;
    }
    await loadStories({ showLoading: false });
  };

  const openStories = stories.filter((story) => String(story.status || "Open") === "Open");

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logo} alt="League Logo" style={{ height: 48 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 900 }}>Story Inbox</div>
                <div style={{ opacity: 0.72 }}>Review submitted league stories and mark them complete.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => loadStories({ showLoading: false })} style={secondaryButtonStyle}>Refresh</button>
              <button onClick={() => (window.location.pathname = "/admin")} style={secondaryButtonStyle}>Back to Admin</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12 }}>OPEN STORIES</div><div style={{ fontSize: 30, fontWeight: 900 }}>{openStories.length}</div></div>
          <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12 }}>TOTAL SUBMITTED</div><div style={{ fontSize: 30, fontWeight: 900 }}>{stories.length}</div></div>
        </div>

        {storyLoadError && (
          <div style={{ ...sectionCardStyle, borderColor: "#7f1d1d", color: "#f87171", fontWeight: 900 }}>
            {storyLoadError}
          </div>
        )}

        {loading ? (
          <div style={sectionCardStyle}>Loading stories...</div>
        ) : stories.length === 0 ? (
          <div style={sectionCardStyle}>No stories submitted yet.</div>
        ) : (
          stories.map((story) => (
            <div key={story.id} style={{ ...sectionCardStyle, borderColor: String(story.status || "Open") === "Open" ? "#d4af37" : "#2c3440" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{story.title || "Untitled Story"}</div>
                  <div style={{ opacity: 0.68, fontSize: 13, marginTop: 4 }}>
                    Submitted by {story.author_name || "Unknown"}{story.driver_name ? ` • ${story.driver_name}` : ""}{story.created_at ? ` • ${new Date(story.created_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div style={{ background: String(story.status || "Open") === "Open" ? "rgba(212,175,55,0.16)" : "rgba(34,197,94,0.12)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 12px", fontWeight: 900, height: "fit-content" }}>
                  {story.status || "Open"}
                </div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 14, padding: 14, whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: 12 }}>
                {story.story}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => updateStoryStatus(story.id, "Open")} style={secondaryButtonStyle}>Mark Open</button>
                <button onClick={() => updateStoryStatus(story.id, "Reviewed")} style={primaryButtonStyle}>Mark Reviewed</button>
                <button onClick={() => updateStoryStatus(story.id, "Archived")} style={dangerButtonStyle}>Archive</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/mwQ6DYuXB2";
const DEFAULT_DISCORD_RULES = [
  "Use your real league driver name or a recognizable nickname.",
  "Race control channels are for official league communication only during events.",
  "Keep driver media active, competitive, and sponsor-friendly.",
  "No harassment, hate speech, or personal attacks. Keep the trash talk racing-focused.",
  "Team channels are for team operations, practice notes, strategy, and owner communication.",
  "Appeals and incidents should go through the app or the proper Discord channel, not public arguments.",
];

function getDiscordSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("bcl-discord-settings") || "{}");
    const savedInviteUrl = String(saved.inviteUrl || "").trim();
    const inviteUrl = !savedInviteUrl || savedInviteUrl.includes("YOUR-LINK-HERE")
      ? DEFAULT_DISCORD_INVITE_URL
      : savedInviteUrl;
    return {
      inviteUrl,
      rulesText: saved.rulesText || DEFAULT_DISCORD_RULES.join("\n"),
      announcement: saved.announcement || "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
    };
  } catch {
    return {
      inviteUrl: DEFAULT_DISCORD_INVITE_URL,
      rulesText: DEFAULT_DISCORD_RULES.join("\n"),
      announcement: "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
    };
  }
}

function DiscordPage() {
  const settings = getDiscordSettings();
  const rules = String(settings.rulesText || "").split("\n").map((rule) => rule.trim()).filter(Boolean);
  const voiceChannels = [
    "🏁 Race Control",
    "🎙️ Driver Interviews",
    "📡 Broadcast Booth",
    "🔧 Garage / Practice",
    "🚗 Team Owner Meetings",
    "⚖️ Appeals Review Waiting Room",
    "🍻 League Hangout",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #1d2430 0%, #0d1117 42%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 24 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #5865f2 0%, #20233a 52%, #10141b 100%)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 24, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={logo} alt="League Logo" style={{ height: 64, filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))" }} />
              <div>
                <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>BCL DISCORD HUB</div>
                <div style={{ opacity: 0.82, marginTop: 8, fontSize: 16 }}>{settings.announcement}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => window.open(settings.inviteUrl, "_blank", "noopener,noreferrer")} style={{ background: "#ffffff", color: "#111827", border: "none", borderRadius: 12, padding: "13px 18px", fontWeight: 900, cursor: "pointer" }}>💬 Join Discord</button>
              <button onClick={() => (window.location.pathname = "/standings")} style={{ background: "rgba(0,0,0,0.28)", color: "white", border: "1px solid rgba(255,255,255,0.24)", borderRadius: 12, padding: "13px 18px", fontWeight: 800, cursor: "pointer" }}>Back to Standings</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>League Discord Rules</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {rules.map((rule, index) => (
                <div key={`${rule}-${index}`} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 12, padding: 12, lineHeight: 1.45 }}>
                  <strong style={{ color: "#d4af37" }}>#{index + 1}</strong> {rule}
                </div>
              ))}
            </div>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Suggested Voice Channels</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {voiceChannels.map((channel) => (
                <div key={channel} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 12, padding: 12, fontWeight: 800 }}>{channel}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



const PAYMENT_COMPLIANCE_OVERRIDE_KEY = "bclPaymentComplianceOverrides";

function getPaymentTimestamp(row) {
  if (!row || typeof row !== "object") return null;
  return (
    row.submitted_at ||
    row.submittedAt ||
    row.completed_at ||
    row.completedAt ||
    row.uploaded_at ||
    row.uploadedAt ||
    row.created_at ||
    row.createdAt ||
    row.updated_at ||
    row.updatedAt ||
    row.timestamp ||
    row.date ||
    row.inserted_at ||
    row.insertedAt ||
    row.published_at ||
    row.publishedAt ||
    null
  );
}

function formatPaymentTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function makeEasternIso(dateKey, time = "23:59") {
  // The 2026 league schedule is during Eastern daylight time, so -04:00 keeps the deadline aligned to ET.
  return `${dateKey}T${time}:00-04:00`;
}

function addDaysToDateKey(dateKey, days) {
  if (!dateKey) return "";
  const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWednesdayBeforeRaceDate(dateKey) {
  if (!dateKey) return "";
  const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00Z`);
  const day = date.getUTCDay();
  const daysBack = (day - 3 + 7) % 7;
  date.setUTCDate(date.getUTCDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function getRecordRaceName(row = {}) {
  row = row || {};
  return String(row.race_name || row.raceName || row.track_name || row.track || row.race || row.event_name || row.event || "").trim();
}

function getRecordDriverNumber(row = {}) {
  row = row || {};
  return String(row.driver_number || row.driverNumber || row.number || row.car_number || row.carNumber || row.driver_num || "").trim();
}

function getRecordDriverName(row = {}) {
  row = row || {};
  return String(row.driver_name || row.driverName || row.name || row.uploader_name || row.submitted_by || row.author_name || "").trim().toLowerCase();
}

function getRecordTeam(row = {}) {
  row = row || {};
  return String(row.team || row.team_key || row.team_abbr || row.team_name || "").trim();
}

function getInterviewKind(row = {}) {
  row = row || {};
  const raw = String(row.interview_type || row.type || row.category || row.kind || row.phase || row.title || row.prompt_type || "").toLowerCase();
  if (raw.includes("pre")) return "pre";
  if (raw.includes("post")) return "post";
  return "";
}

function interviewLooksAnswered(row = {}) {
  row = row || {};
  if (row.completed === true || row.submitted === true) return true;
  const status = String(row.status || "").toLowerCase();
  if (["answered", "complete", "completed", "submitted", "posted"].includes(status)) return true;
  const answerFields = [row.answer, row.answers, row.response, row.responses, row.body, row.notes, row.content];
  return answerFields.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return String(value || "").trim().length > 0;
  });
}

function recordMatchesDriver(row = {}, driver = {}) {
  const number = getRecordDriverNumber(row);
  const name = getRecordDriverName(row);
  const team = getRecordTeam(row);
  return (
    (number && String(driver.number) === number) ||
    (name && String(driver.name || "").trim().toLowerCase() === name) ||
    (team && String(driver.team || "") === team && !number && !name)
  );
}

function recordMatchesRace(row = {}, raceName = "") {
  const rowRace = getRecordRaceName(row).toLowerCase();
  const wanted = String(raceName || "").trim().toLowerCase();
  if (!wanted) return true;
  if (!rowRace) return true;
  return rowRace === wanted;
}

function getTeamPaymentOverride(overrides = [], teamKey = "", periodKey = "") {
  return (overrides || []).find((item) => String(item.team_key || item.team || "") === String(teamKey) && String(item.period_key || item.periodKey || "") === String(periodKey));
}

function buildPaymentComplianceRows({ teams = [], drivers = [], interviews = [], carUploads = [], overrides = [], previousRace = null, upcomingRace = null }) {
  interviews = (Array.isArray(interviews) ? interviews : []).filter((row) => row && typeof row === "object");
  carUploads = (Array.isArray(carUploads) ? carUploads : []).filter((row) => row && typeof row === "object");
  overrides = (Array.isArray(overrides) ? overrides : []).filter((row) => row && typeof row === "object");
  const previousRaceDate = previousRace?.date || "";
  const upcomingRaceDate = upcomingRace?.date || "";
  const previousRaceName = previousRace?.name || "";
  const upcomingRaceName = upcomingRace?.name || "";
  const paymentPeriodKey = `${previousRaceName || "no-previous"}__${upcomingRaceName || "no-upcoming"}`;
  const paintDeadlineIso = upcomingRaceDate ? makeEasternIso(getWednesdayBeforeRaceDate(upcomingRaceDate), "23:59") : "";
  const postDeadlineIso = previousRaceDate ? makeEasternIso(addDaysToDateKey(previousRaceDate, 4), "23:59") : "";
  const preDeadlineIso = upcomingRaceDate ? makeEasternIso(String(upcomingRaceDate).slice(0, 10), "20:30") : "";

  const eligibleTeams = (teams || [])
    .filter((team) => team?.team && team.team !== "Independent" && team.team !== "IND")
    .sort((a, b) => getTeamFullName(a.team).localeCompare(getTeamFullName(b.team)));

  return eligibleTeams.map((team) => {
    const teamDrivers = (drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver) && String(driver.team || "") === String(team.team))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));

    const driverChecks = teamDrivers.map((driver) => {
      const paintRecord = (carUploads || [])
        .filter((row) => recordMatchesDriver(row, driver) && recordMatchesRace(row, upcomingRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;
      const postRecord = (interviews || [])
        .filter((row) => getInterviewKind(row) === "post" && interviewLooksAnswered(row) && recordMatchesDriver(row, driver) && recordMatchesRace(row, previousRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;
      const preRecord = (interviews || [])
        .filter((row) => getInterviewKind(row) === "pre" && interviewLooksAnswered(row) && recordMatchesDriver(row, driver) && recordMatchesRace(row, upcomingRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;

      const paintAt = getPaymentTimestamp(paintRecord);
      const postAt = getPaymentTimestamp(postRecord);
      const preAt = getPaymentTimestamp(preRecord);

      return {
        driver,
        paintAt,
        postAt,
        preAt,
        paintMet: !!paintAt && (!paintDeadlineIso || new Date(paintAt) <= new Date(paintDeadlineIso)),
        postMet: !!postAt && (!postDeadlineIso || new Date(postAt) <= new Date(postDeadlineIso)),
        preMet: !!preAt && (!preDeadlineIso || new Date(preAt) <= new Date(preDeadlineIso)),
      };
    });

    const baseMet = teamDrivers.length > 0 && driverChecks.every((check) => check.paintMet && check.postMet && check.preMet);
    const override = getTeamPaymentOverride(overrides, team.team, paymentPeriodKey);
    const overrideStatus = override?.override_status || override?.status || "";
    const finalEligible = overrideStatus === "approved" ? true : overrideStatus === "denied" ? false : baseMet;

    return {
      teamKey: team.team,
      teamName: getTeamFullName(team.team),
      driverCount: teamDrivers.length,
      driverChecks,
      previousRaceName,
      upcomingRaceName,
      paymentPeriodKey,
      paintDeadlineIso,
      postDeadlineIso,
      preDeadlineIso,
      baseMet,
      finalEligible,
      override,
      overrideStatus,
    };
  });
}

function getVoteDeadlineStatus(deadline) {
  if (!deadline) return { closed: false, label: "No deadline set", remaining: "Open" };
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return { closed: false, label: "Invalid deadline", remaining: "Open" };
  const diff = deadlineDate.getTime() - Date.now();
  if (diff <= 0) return { closed: true, label: deadlineDate.toLocaleString(), remaining: "Voting Closed" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { closed: false, label: deadlineDate.toLocaleString(), remaining: `${days}d ${hours}h ${minutes}m left` };
}

function normalizeVoteRow(row = {}) {
  return {
    ...row,
    title: row.title || row.vote_title || "League Vote",
    description: row.description || row.vote_description || "",
    deadline: row.deadline || row.deadline_at || row.closes_at || row.ends_at || "",
    active: row.active !== false,
  };
}

function LeagueVotingPage({ drivers = [] }) {
  const [votes, setVotes] = useState([]);
  const [optionsByVote, setOptionsByVote] = useState({});
  const [responses, setResponses] = useState([]);
  const [selectedVoteId, setSelectedVoteId] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [driver, setDriver] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeDrivers = useMemo(() => dedupeDriversByNumber(drivers || []).filter((item) => !item.retired && !isInactivePlaceholderDriver(item)).sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999)), [drivers]);

  async function loadVotes() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("league_votes")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load league votes:", error);
      setError("Could not load league votes. Create the league_votes, league_vote_options, and league_vote_responses tables and check RLS policies.");
      setVotes([]);
      setLoading(false);
      return;
    }

    const cleanVotes = (data || []).map(normalizeVoteRow);
    setVotes(cleanVotes);
    if (!selectedVoteId && cleanVotes.length) setSelectedVoteId(cleanVotes[0].id);

    const voteIds = cleanVotes.map((vote) => vote.id).filter(Boolean);
    if (voteIds.length) {
      const [{ data: optionRows, error: optionError }, { data: responseRows, error: responseError }] = await Promise.all([
        supabase.from("league_vote_options").select("*").in("vote_id", voteIds).order("created_at", { ascending: true }),
        supabase.from("league_vote_responses").select("*").in("vote_id", voteIds),
      ]);

      if (optionError) console.error("Could not load vote options:", optionError);
      if (responseError) console.error("Could not load vote responses:", responseError);

      const grouped = {};
      (optionRows || []).forEach((option) => {
        const key = String(option.vote_id || "");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(option);
      });
      setOptionsByVote(grouped);
      setResponses(responseRows || []);
    } else {
      setOptionsByVote({});
      setResponses([]);
    }

    setLoading(false);
  }

  useEffect(() => { loadVotes(); }, []);

  const selectedVote = useMemo(() => votes.find((vote) => String(vote.id) === String(selectedVoteId)) || null, [votes, selectedVoteId]);
  const selectedOptions = selectedVote ? (optionsByVote[String(selectedVote.id)] || []) : [];
  const selectedStatus = getVoteDeadlineStatus(selectedVote?.deadline);
  const driverAlreadyVoted = !!(driver && selectedVote && responses.some((row) => String(row.vote_id) === String(selectedVote.id) && String(row.driver_number) === String(driver.number || driver.driver_number)));

  async function loginDriver(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const number = String(driverNumber || "").trim();
    const code = String(password || "").trim();
    if (!number || !code) {
      setError("Select your driver and enter your driver password.");
      return;
    }

    const { data, error } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    if (error) {
      console.error("Could not verify driver vote login:", error);
      setError("Could not verify access. Check driver_access_codes select policy and columns.");
      return;
    }

    const enteredCode = code.toUpperCase();
    const match = (data || []).find((row) => {
      const rowNumber = String(row.driver_number ?? row.car_number ?? "").trim();
      const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean);
      return rowNumber === number && possibleCodes.includes(enteredCode) && row.active !== false;
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";

    if (!match && !adminMatch) {
      setError("Invalid car number or driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((item) => String(item.number) === number) || {};
    const authRow = match || {};
    setDriver({ ...authRow, ...rosterDriver, number, driver_number: number, name: rosterDriver.name || authRow.driver_name || authRow.name || `#${number}` });
    setMessage(`Logged in as #${number}.`);
  }

  async function submitVote() {
    setMessage("");
    setError("");
    if (!driver) return setError("You must log in before voting.");
    if (!selectedVote) return setError("Select a vote first.");
    if (selectedStatus.closed) return setError("Voting is closed. The deadline has passed.");
    if (!selectedOptionId) return setError("Select an option before submitting your vote.");
    if (driverAlreadyVoted) return setError("You have already voted on this item.");

    const option = selectedOptions.find((item) => String(item.id) === String(selectedOptionId));
    const payload = {
      vote_id: selectedVote.id,
      option_id: selectedOptionId,
      option_text: option?.option_text || option?.label || "",
      driver_number: String(driver.number || driver.driver_number || ""),
      driver_name: driver.name || driver.driver_name || `#${driver.number || driver.driver_number}`,
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("league_vote_responses").insert(payload);
    if (error) {
      console.error("Could not submit vote:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) setError("You have already voted on this item.");
      else setError("Could not submit vote. Check league_vote_responses columns and RLS policies.");
      return;
    }

    setMessage("Vote submitted successfully.");
    setSelectedOptionId("");
    await loadVotes();
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #191d25 0%, #10141b 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 38 }}>🗳️ League Voting</h1>
              <p style={{ opacity: 0.76, marginBottom: 0 }}>Drivers must select their car and enter their password before voting. Deadlines lock automatically.</p>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 380px) 1fr", gap: 18, alignItems: "start" }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Driver Login</h2>
            {!driver ? (
              <form onSubmit={loginDriver} style={{ display: "grid", gap: 12 }}>
                <select value={driverNumber} onChange={(event) => setDriverNumber(event.target.value)} style={inputStyle}>
                  <option value="">Select Your Driver</option>
                  {activeDrivers.map((item) => (
                    <option key={item.id || item.number} value={String(item.number)}>
                      #{item.number} — {item.name} ({getTeamFullName(item.team)})
                    </option>
                  ))}
                </select>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Driver Password" style={inputStyle} />
                <button type="submit" style={primaryButtonStyle}>Log In To Vote</button>
              </form>
            ) : (
              <div style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>LOGGED IN</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>#{driver.number} {driver.name}</div>
                <button type="button" onClick={() => { setDriver(null); setPassword(""); setMessage("Logged out."); }} style={{ ...secondaryButtonStyle, marginTop: 12 }}>Log Out</button>
              </div>
            )}
            {message && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{message}</div>}
            {error && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{error}</div>}
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Open Votes</h2>
            {loading && <div>Loading votes...</div>}
            {!loading && votes.length === 0 && <div style={{ opacity: 0.72 }}>No active votes are open right now.</div>}
            {votes.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                <select value={selectedVoteId} onChange={(event) => { setSelectedVoteId(event.target.value); setSelectedOptionId(""); }} style={inputStyle}>
                  {votes.map((vote) => <option key={vote.id} value={vote.id}>{vote.title}</option>)}
                </select>

                {selectedVote && (
                  <div style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <h2 style={{ margin: 0 }}>{selectedVote.title}</h2>
                        {selectedVote.description && <p style={{ opacity: 0.78 }}>{selectedVote.description}</p>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: selectedStatus.closed ? "#f87171" : "#4ade80", fontWeight: 1000 }}>{selectedStatus.remaining}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>Deadline: {selectedStatus.label}</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                      {selectedOptions.map((option) => (
                        <label key={option.id} style={{ display: "flex", gap: 10, alignItems: "center", background: "#0b0f15", border: "1px solid #273140", borderRadius: 12, padding: 12, cursor: selectedStatus.closed ? "not-allowed" : "pointer" }}>
                          <input type="radio" disabled={selectedStatus.closed || driverAlreadyVoted} name="league-vote-option" value={option.id} checked={String(selectedOptionId) === String(option.id)} onChange={(event) => setSelectedOptionId(event.target.value)} />
                          <span style={{ fontWeight: 900 }}>{option.option_text || option.label}</span>
                        </label>
                      ))}
                    </div>

                    <button type="button" disabled={selectedStatus.closed || driverAlreadyVoted} onClick={submitVote} style={{ ...primaryButtonStyle, marginTop: 16, opacity: selectedStatus.closed || driverAlreadyVoted ? 0.55 : 1 }}>
                      {driverAlreadyVoted ? "Vote Already Submitted" : selectedStatus.closed ? "Voting Closed" : "Submit Vote"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminVotingPage({ drivers = [] }) {
  const [votes, setVotes] = useState([]);
  const [options, setOptions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", active: true, optionsText: "Yes\nNo\nAbstain" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function loadAdminVotes() {
    const [{ data: voteRows, error: voteError }, { data: optionRows }, { data: responseRows }] = await Promise.all([
      supabase.from("league_votes").select("*").order("created_at", { ascending: false }),
      supabase.from("league_vote_options").select("*").order("created_at", { ascending: true }),
      supabase.from("league_vote_responses").select("*").order("submitted_at", { ascending: false }),
    ]);
    if (voteError) {
      console.error("Could not load admin votes:", voteError);
      setError("Could not load votes. Check Supabase tables and RLS policies.");
      return;
    }
    setVotes((voteRows || []).map(normalizeVoteRow));
    setOptions(optionRows || []);
    setResponses(responseRows || []);
  }

  useEffect(() => { loadAdminVotes(); }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createVote(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    const title = form.title.trim();
    const optionLines = form.optionsText.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!title) return setError("Vote title is required.");
    if (!form.deadline) return setError("Deadline is required.");
    if (optionLines.length < 2) return setError("Add at least two vote options, one per line.");

    const deadlineIso = new Date(form.deadline).toISOString();
    const { data: insertedVote, error: voteError } = await supabase
      .from("league_votes")
      .insert({ title, description: form.description.trim(), deadline: deadlineIso, active: Boolean(form.active), created_at: new Date().toISOString() })
      .select("*")
      .single();

    if (voteError || !insertedVote) {
      console.error("Could not create vote:", voteError);
      setError("Could not create vote. Check league_votes insert policy and columns.");
      return;
    }

    const rows = optionLines.map((optionText) => ({ vote_id: insertedVote.id, option_text: optionText, created_at: new Date().toISOString() }));
    const { error: optionError } = await supabase.from("league_vote_options").insert(rows);
    if (optionError) {
      console.error("Could not create vote options:", optionError);
      setError("Vote was created, but options failed. Check league_vote_options policies and columns.");
      return;
    }

    setStatus("Vote created successfully.");
    setForm({ title: "", description: "", deadline: "", active: true, optionsText: "Yes\nNo\nAbstain" });
    await loadAdminVotes();
  }

  async function toggleVote(vote) {
    const { error } = await supabase.from("league_votes").update({ active: !vote.active }).eq("id", vote.id);
    if (error) return setError("Could not update vote active status.");
    await loadAdminVotes();
  }

  function getVoteOptions(voteId) {
    return options.filter((option) => String(option.vote_id) === String(voteId));
  }

  function getVoteResponses(voteId) {
    return responses.filter((response) => String(response.vote_id) === String(voteId));
  }

  function exportVoteCsv(vote) {
    const rows = getVoteResponses(vote.id);
    const csvRows = [["Vote", "Driver Number", "Driver", "Team", "Manufacturer", "Option", "Submitted At"], ...rows.map((row) => [vote.title, row.driver_number || "", row.driver_name || "", row.team || "", row.manufacturer || "", row.option_text || "", row.submitted_at || ""] )];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `league-vote-${String(vote.title || "vote").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0 }}>Admin Voting Control</h1>
              <div style={{ opacity: 0.72, marginTop: 6 }}>Create votes, set deadlines, close voting, and review/export results.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/vote")} style={primaryButtonStyle}>Open Public Vote Page</button>
              <button onClick={() => (window.location.pathname = "/admin")} style={secondaryButtonStyle}>Back to Admin</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 440px) 1fr", gap: 18, alignItems: "start" }}>
          <form onSubmit={createVote} style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Create New Vote</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Vote title" style={inputStyle} />
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Vote description" rows={4} style={inputStyle} />
              <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>DEADLINE</label>
              <input type="datetime-local" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} style={inputStyle} />
              <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>OPTIONS — ONE PER LINE</label>
              <textarea value={form.optionsText} onChange={(event) => updateForm("optionsText", event.target.value)} rows={7} style={inputStyle} />
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
                <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} /> Active immediately
              </label>
              <button type="submit" style={primaryButtonStyle}>Create Vote</button>
            </div>
            {status && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{status}</div>}
            {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}
          </form>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Vote Results</h2>
            <div style={{ display: "grid", gap: 14 }}>
              {votes.map((vote) => {
                const voteOptions = getVoteOptions(vote.id);
                const voteResponses = getVoteResponses(vote.id);
                const statusInfo = getVoteDeadlineStatus(vote.deadline);
                return (
                  <div key={vote.id} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{vote.title}</h3>
                        <div style={{ opacity: 0.72, marginTop: 4 }}>{vote.description}</div>
                        <div style={{ fontSize: 12, opacity: 0.68, marginTop: 6 }}>Deadline: {statusInfo.label} — {statusInfo.remaining}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "start" }}>
                        <button type="button" onClick={() => toggleVote(vote)} style={vote.active ? dangerButtonStyle : primaryButtonStyle}>{vote.active ? "Close" : "Reopen"}</button>
                        <button type="button" onClick={() => exportVoteCsv(vote)} style={secondaryButtonStyle}>Export CSV</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      {voteOptions.map((option) => {
                        const count = voteResponses.filter((row) => String(row.option_id) === String(option.id)).length;
                        const percent = voteResponses.length ? Math.round((count / voteResponses.length) * 100) : 0;
                        return (
                          <div key={option.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}><span>{option.option_text}</span><span>{count} vote(s) — {percent}%</span></div>
                            <div style={{ height: 10, background: "#0b0f15", borderRadius: 999, overflow: "hidden", marginTop: 4 }}><div style={{ width: `${percent}%`, height: "100%", background: "#d4af37" }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {votes.length === 0 && <div style={{ opacity: 0.72 }}>No votes created yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriverVoteReminderStrip({ driverNumber = "" }) {
  const [openVoteCount, setOpenVoteCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadOpenVoteReminders() {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("league_votes")
        .select("id,title,deadline,active")
        .eq("active", true)
        .gt("deadline", nowIso);
      if (!isMounted || error) return;
      setOpenVoteCount((data || []).length);
    }
    loadOpenVoteReminders();
    const interval = setInterval(loadOpenVoteReminders, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [driverNumber]);

  if (!openVoteCount) return null;

  return (
    <div style={{ minHeight: 0, background: "#0c0f14", padding: "0 20px 12px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(90deg, #d4af37 0%, #f59e0b 100%)", color: "#111", borderRadius: 14, padding: "12px 16px", fontWeight: 1000, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>🔔 {openVoteCount} league vote{openVoteCount === 1 ? "" : "s"} open — driver login required before the deadline.</span>
          <button type="button" onClick={() => (window.location.pathname = "/vote")} style={{ background: "#111827", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 900, cursor: "pointer" }}>Vote Now</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [seasons, setSeasons] = useState([]);
  const [openAppealCount, setOpenAppealCount] = useState(0);
  const [openStoryCount, setOpenStoryCount] = useState(0);
  const [activeSeasonId, setActiveSeasonId] = useState("");
  const [tracks, setTracks] = useState(defaultRaces);
  const backupFileInputRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const loadedStateSignatureRef = useRef("");
  const saveInFlightRef = useRef(false);
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
  const [dnfReasons, setDnfReasons] = useState({});
  const [newTrackName, setNewTrackName] = useState("");
  const [newTrackStageCount, setNewTrackStageCount] = useState(2);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [manualWatchPicks, setManualWatchPicks] = useState([]);
  const [ownerAssignments, setOwnerAssignments] = useState([]);
  const [selectedOwnerTeam, setSelectedOwnerTeam] = useState("");
  const [selectedOwnerDriverNumber, setSelectedOwnerDriverNumber] = useState("");
  const [ownerAssignmentMessage, setOwnerAssignmentMessage] = useState("");
  const [ownerAssignmentError, setOwnerAssignmentError] = useState("");
  const [watchDriverId, setWatchDriverId] = useState("");
  const [watchReason, setWatchReason] = useState("");
  const [watchBadge, setWatchBadge] = useState("DIRECTOR PICK");
  const [watchDisplayOrder, setWatchDisplayOrder] = useState("1");
  const [watchSaving, setWatchSaving] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [driverAccessCodes, setDriverAccessCodes] = useState([]);
  const [tickerMessages, setTickerMessages] = useState([]);
  const [tickerForm, setTickerForm] = useState({
    message: "",
    category: "NEWS",
    page: "standings",
    sort_order: "0",
    active: true,
    pinned: false,
    expires_at: "",
  });
  const [editingTickerId, setEditingTickerId] = useState(null);
  const [tickerStatus, setTickerStatus] = useState("");
  const [tickerError, setTickerError] = useState("");
  const [paintPayoutRace, setPaintPayoutRace] = useState("");
  const [paintPayoutRows, setPaintPayoutRows] = useState([]);
  const [paintPayoutStatus, setPaintPayoutStatus] = useState("");
  const [paintPayoutError, setPaintPayoutError] = useState("");
  const [paintPayoutLoading, setPaintPayoutLoading] = useState(false);
  const [paymentComplianceRows, setPaymentComplianceRows] = useState([]);
  const [paymentComplianceInterviews, setPaymentComplianceInterviews] = useState([]);
  const [paymentComplianceUploads, setPaymentComplianceUploads] = useState([]);
  const [paymentComplianceOverrides, setPaymentComplianceOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY) || "[]"); }
    catch { return []; }
  });
  const [paymentComplianceLoading, setPaymentComplianceLoading] = useState(false);
  const [paymentComplianceStatus, setPaymentComplianceStatus] = useState("");
  const [paymentComplianceError, setPaymentComplianceError] = useState("");
  const [ownerAccessCodes, setOwnerAccessCodes] = useState(() => {
    try {
      const saved = localStorage.getItem("ownerPortalAccessCodes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [discordInviteUrl, setDiscordInviteUrl] = useState(() => getDiscordSettings().inviteUrl);
  const [discordAnnouncement, setDiscordAnnouncement] = useState(() => getDiscordSettings().announcement);
  const [discordRulesText, setDiscordRulesText] = useState(() => getDiscordSettings().rulesText);
  const videoFileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const rawPath = window.location.pathname;
  const path = rawPath.toLowerCase();
  // ─── Computed values (must be before all hooks) ───────────────────────────
  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
  const drivers = realignLeagueDrivers(activeSeason?.drivers || []);
  const visibleDrivers = drivers.filter((d) => !isInactivePlaceholderDriver(d));
  const activeDrivers = visibleDrivers.filter((d) => !d.retired);
  const ownerPortalTeams = useMemo(() => {
    const fixedTeams = ["B2J", "19XI", "BXM", "MER", "NLM", "BWR", "MMS"];
    const liveTeams = visibleDrivers
      .map((driver) => driver.team || "Independent")
      .filter((team) => team !== "Independent" && team !== "IND");
    return Array.from(new Set([...fixedTeams, ...liveTeams]))
      .filter(Boolean)
      .sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [visibleDrivers]);
  const selectedRace = activeSeason?.selectedRace || "";
  const positions = activeSeason?.positions || {};
  const stage1 = activeSeason?.stage1 || {};
  const stage2 = activeSeason?.stage2 || {};
  const stage3 = activeSeason?.stage3 || {};
  const dnfMap = activeSeason?.dnfMap || {};
  const startParkMap = activeSeason?.startParkMap || {};
  const [startParkRequests, setStartParkRequests] = useState([]);
  const [startParkRequestStatus, setStartParkRequestStatus] = useState("");
  const [startParkRequestError, setStartParkRequestError] = useState("");
  const [startParkRequestsLoading, setStartParkRequestsLoading] = useState(false);
  const offenseMap = activeSeason?.offenseMap || {};
  const fastestLapMap = activeSeason?.fastestLapMap || {};
  const penaltyMap = activeSeason?.penaltyMap || {};
  const resultNotesMap = activeSeason?.resultNotesMap || {};
  const raceDrafts = activeSeason?.raceDrafts || [];
  const raceHistory = activeSeason?.raceHistory || [];
  const selectedRaceData = tracks.find((r) => r.name === selectedRace);
  const stageCount = selectedRaceData ? selectedRaceData.stageCount : 2;
  // ─── ALL 
  async function loadOwnerAssignments() {
    const { data, error } = await supabase
      .from("team_owner_assignments")
      .select("*")
      .order("team", { ascending: true });

    if (error) {
      console.error("Could not load team owner assignments:", error);
      setOwnerAssignmentError("Could not load owner assignments. Check the team_owner_assignments table and RLS select policy.");
      return;
    }

    setOwnerAssignments(data || []);
  }

  async function saveOwnerAssignment() {
    setOwnerAssignmentMessage("");
    setOwnerAssignmentError("");

    if (!selectedOwnerTeam || !selectedOwnerDriverNumber) {
      setOwnerAssignmentError("Select a team and an owner driver first.");
      return;
    }

    const ownerDriver = visibleDrivers.find((driver) => String(driver.number) === String(selectedOwnerDriverNumber));

    if (!ownerDriver) {
      setOwnerAssignmentError("Could not find that driver in the active roster.");
      return;
    }

    const payload = {
      team: selectedOwnerTeam,
      owner_driver_number: String(ownerDriver.number),
      owner_driver_name: ownerDriver.name || "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("team_owner_assignments")
      .upsert(payload, { onConflict: "team" });

    if (error) {
      console.error("Could not save team owner assignment:", error);
      setOwnerAssignmentError("Could not save owner assignment. Check the team_owner_assignments table and RLS upsert policy.");
      return;
    }

    setOwnerAssignmentMessage(`${ownerDriver.name} is now assigned as owner of ${getTeamFullName(selectedOwnerTeam)}.`);
    await loadOwnerAssignments();
  }


  async function loadTickerMessages() {
    setTickerError("");
    const { data, error } = await supabase
      .from("ticker_messages")
      .select("*")
      .order("pinned", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load ticker messages:", error);
      setTickerError("Could not load ticker messages. Create the ticker_messages table and check RLS policies.");
      return;
    }

    setTickerMessages(data || []);
  }

  function resetTickerForm() {
    setEditingTickerId(null);
    setTickerForm({
      message: "",
      category: "NEWS",
      page: "standings",
      sort_order: "0",
      active: true,
      pinned: false,
      expires_at: "",
    });
  }

  function editTickerMessage(item) {
    setEditingTickerId(item.id);
    setTickerForm({
      message: item.message || "",
      category: item.category || "NEWS",
      page: item.page || "standings",
      sort_order: String(item.sort_order ?? 0),
      active: item.active !== false,
      pinned: Boolean(item.pinned),
      expires_at: item.expires_at ? String(item.expires_at).slice(0, 16) : "",
    });
    setTickerStatus("");
    setTickerError("");
  }

  async function saveTickerMessage(event) {
    event?.preventDefault?.();
    setTickerStatus("");
    setTickerError("");

    if (!tickerForm.message.trim()) {
      setTickerError("Ticker message cannot be blank.");
      return;
    }

    const payload = {
      message: tickerForm.message.trim(),
      category: (tickerForm.category || "NEWS").trim().toUpperCase(),
      page: tickerForm.page || "standings",
      sort_order: Number(tickerForm.sort_order || 0),
      active: Boolean(tickerForm.active),
      pinned: Boolean(tickerForm.pinned),
      expires_at: tickerForm.expires_at ? new Date(tickerForm.expires_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (editingTickerId) {
      result = await supabase.from("ticker_messages").update(payload).eq("id", editingTickerId);
    } else {
      result = await supabase.from("ticker_messages").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }

    if (result.error) {
      console.error("Could not save ticker message:", result.error);
      setTickerError("Could not save ticker message. Check ticker_messages insert/update RLS policies.");
      return;
    }

    setTickerStatus(editingTickerId ? "Ticker message updated." : "Ticker message added.");
    resetTickerForm();
    await loadTickerMessages();
  }

  async function deleteTickerMessage(id) {
    if (!window.confirm("Delete this ticker message?")) return;
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase.from("ticker_messages").delete().eq("id", id);

    if (error) {
      console.error("Could not delete ticker message:", error);
      setTickerError("Could not delete ticker message. Check ticker_messages delete RLS policy.");
      return;
    }

    setTickerStatus("Ticker message deleted.");
    await loadTickerMessages();
  }

  async function toggleTickerActive(item) {
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase
      .from("ticker_messages")
      .update({ active: item.active === false, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      console.error("Could not update ticker active state:", error);
      setTickerError("Could not update ticker message. Check ticker_messages update RLS policy.");
      return;
    }

    await loadTickerMessages();
  }

  async function toggleTickerPinned(item) {
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase
      .from("ticker_messages")
      .update({ pinned: !item.pinned, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      console.error("Could not update ticker pinned state:", error);
      setTickerError("Could not update ticker pin. Check ticker_messages update RLS policy.");
      return;
    }

    await loadTickerMessages();
  }

  async function seedWeeklyTickerMessages() {
    setTickerStatus("");
    setTickerError("");

    const seedItems = [
      { category: "BREAKING", message: "MER and WSM have officially closed operations", page: "standings", sort_order: 1, active: true, pinned: true },
      { category: "TRANSACTION", message: "BigDiehl21 signs with ME Racing and moves to the No. 39 Chevrolet", page: "standings", sort_order: 2, active: true, pinned: true },
      { category: "TRANSACTION", message: "BayouX Motorsports updates KnightTrain41 to the No. 41 Ford", page: "standings", sort_order: 3, active: true, pinned: false },
      { category: "TEAM UPDATE", message: "CaJunThrottle28 moves to the No. 48 Chevrolet for BXM", page: "standings", sort_order: 4, active: true, pinned: false },
      { category: "RESULTS", message: "TheCruiser54 scores a podium for BXM at Michigan", page: "standings", sort_order: 5, active: true, pinned: false },
      { category: "RACE CONTROL", message: "Race Control Center, editable results, and penalty tools are in development", page: "standings", sort_order: 6, active: true, pinned: false },
      { category: "APP UPDATE", message: "Driver password reset support and interview sync improvements are now active", page: "standings", sort_order: 7, active: true, pinned: false },
      { category: "NEXT EVENT", message: "Pocono Raceway is up next for the Budweiser Cup League", page: "standings", sort_order: 8, active: true, pinned: false },
    ].map((item) => ({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));

    const { error } = await supabase.from("ticker_messages").insert(seedItems);

    if (error) {
      console.error("Could not seed ticker messages:", error);
      setTickerError("Could not seed ticker messages. Check ticker_messages table and insert RLS policy.");
      return;
    }

    setTickerStatus("Weekly ticker messages added.");
    await loadTickerMessages();
  }

// useEffect hooks (must be before any early returns) ───────────────
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSupabase() {
      try {
        const savedState = await loadLeagueState();
        if (!isMounted) return;

        const normalizedState = normalizeLoadedLeagueState(savedState);

        if (normalizedState) {
          setSeasons(normalizedState.seasons);
          setActiveSeasonId(normalizedState.activeSeasonId);
          setTracks(normalizedState.tracks);
          loadedStateSignatureRef.current = makeLeagueStateSignature(normalizedState);
        } else {
          // Emergency only: this keeps the app usable if Supabase is empty or unreachable,
          // but it does NOT automatically write defaults back over the real saved points.
          const fallbackState = loadInitialLeagueState();
          setSeasons(fallbackState.seasons || []);
          setActiveSeasonId(fallbackState.activeSeasonId || "");
          setTracks(fallbackState.tracks || defaultRaces);
          loadedStateSignatureRef.current = makeLeagueStateSignature(fallbackState);
        }
      } catch (error) {
        console.error("Supabase load failed. Defaults were NOT saved over league points:", error);
        if (!isMounted) return;
        const fallbackState = loadInitialLeagueState();
        setSeasons(fallbackState.seasons || []);
        setActiveSeasonId(fallbackState.activeSeasonId || "");
        setTracks(fallbackState.tracks || defaultRaces);
        loadedStateSignatureRef.current = makeLeagueStateSignature(fallbackState);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    hydrateFromSupabase();
    return () => { isMounted = false; };
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
    async function loadOpenStories() {
      const { count, error } = await supabase
        .from("story_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");
      if (!error) setOpenStoryCount(count || 0);
    }
    loadOpenStories();
    const interval = setInterval(loadOpenStories, 5000);
    return () => clearInterval(interval);
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
    loadTickerMessages();
    loadPaymentComplianceData();
    loadOwnerAssignments();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const cleanTracks = sanitizeTracks(tracks);
    const needsTrackMigration = JSON.stringify(cleanTracks) !== JSON.stringify(tracks);
    if (needsTrackMigration && cleanTracks && cleanTracks.length > 0) {
      setTracks(cleanTracks);
    }
  }, [tracks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!Array.isArray(seasons) || seasons.length === 0 || !activeSeasonId) return;

    const nextState = { seasons, activeSeasonId, tracks };
    const nextSignature = makeLeagueStateSignature(nextState);

    // This is the lock that prevents page load, refresh, failed Supabase loads,
    // or default/localStorage hydration from wiping the permanent points table.
    if (!loadedStateSignatureRef.current || nextSignature === loadedStateSignatureRef.current) return;

    const timeout = setTimeout(async () => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      try {
        await saveLeagueState(nextState);
        loadedStateSignatureRef.current = nextSignature;
      } catch (e) {
        console.error("Supabase save failed. Existing points were not cleared:", e);
      } finally {
        saveInFlightRef.current = false;
      }
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
    loadOwnerAccessCodes();
    loadDriverAccessCodes();
  }, []);

  const loadManualWatchPicks = async () => {
    const { data, error } = await supabase
      .from("ones_to_watch")
      .select("*")
      .order("active", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load ones_to_watch:", error);
      return;
    }
    setManualWatchPicks(data || []);
  };

  useEffect(() => {
    loadManualWatchPicks();
  }, []);

  useEffect(() => {
    const nextReasons = {};
    (activeSeason?.drivers || []).forEach((d) => { nextReasons[d.id] = ""; });
    setDnfReasons(nextReasons);
  }, [selectedRace, activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps
  const replaceActiveSeason = (next) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? next : s)));
  const patchActiveSeason = (patch) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? { ...s, ...patch } : s)));

  function applyOwnerPortalTeamTransaction(action = {}) {
    if (!action || !action.type) return;

    setSeasons((prev) => prev.map((season) => {
      if (season.id !== activeSeasonId) return season;

      const nextDrivers = (season.drivers || []).map((driver) => {
        const matchesDriver =
          String(driver.id || "") === String(action.driver_id || action.assign_to_driver_id || "") ||
          String(driver.number || "") === String(action.driver_number || "") ||
          String(driver.name || "").toLowerCase() === String(action.driver_name || "").toLowerCase();

        if (action.type === "driver_buyout" && matchesDriver) {
          return {
            ...driver,
            team: action.new_team || driver.team,
            manufacturer: action.new_manufacturer || driver.manufacturer,
            number: action.new_number ? Number(action.new_number) : driver.number,
            retired: false,
          };
        }

        if (action.type === "number_transfer" && String(driver.id || driver.number || "") === String(action.assign_to_driver_id || "")) {
          return {
            ...driver,
            team: action.to_team || driver.team,
            number: Number(action.number || driver.number),
            retired: false,
          };
        }

        return driver;
      });

      return { ...season, drivers: nextDrivers };
    }));
  }
  async function loadPaintSchemePayoutPreview(raceNameOverride = paintPayoutRace) {
    const raceName = raceNameOverride || getPreviousCompletedRaceForPaintWinner(tracks)?.name || selectedRace || "";
    setPaintPayoutRace(raceName);
    setPaintPayoutStatus("");
    setPaintPayoutError("");
    setPaintPayoutRows([]);

    if (!raceName) {
      setPaintPayoutError("Select a race first.");
      return [];
    }

    setPaintPayoutLoading(true);
    const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("paint_scheme_votes").select("*").eq("race_name", raceName).order("created_at", { ascending: false }),
    ]);
    setPaintPayoutLoading(false);

    if (uploadError || voteError) {
      console.error("Could not load paint scheme payout preview:", uploadError || voteError);
      setPaintPayoutError("Could not load paint scheme uploads/votes. Check car_uploads, paint_scheme_votes, and RLS policies.");
      return [];
    }

    const raceUploads = (uploadData || [])
      .filter((upload) => isPaintImageUploadForStandings(upload))
      .filter((upload) => getPaintUploadRaceForStandings(upload) === raceName);

    const counts = new Map();
    (voteData || []).forEach((vote) => {
      const key = String(vote.upload_id || vote.voted_upload_id || "");
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const deadline = getNextFridayMidnightDeadline(new Date());
    const rankedUploads = raceUploads
      .map((upload) => ({ ...upload, voteCount: counts.get(String(upload.id)) || 0 }))
      .sort((a, b) => {
        const voteDiff = Number(b.voteCount || 0) - Number(a.voteCount || 0);
        if (voteDiff !== 0) return voteDiff;
        return new Date(getPaintUploadUpdatedAt(b) || 0) - new Date(getPaintUploadUpdatedAt(a) || 0);
      });

    const ineligibleCount = rankedUploads.filter((upload) => !isPaintUploadEligibleForPayout(upload, deadline)).length;
    const rows = buildPaintSchemePayoutRows(rankedUploads, visibleDrivers, deadline, activeSeason?.paintSchemePayouts || []);
    setPaintPayoutRows(rows);
    if (!rows.length) setPaintPayoutStatus(`No eligible paint scheme uploads found for ${raceName}. Uploads must be updated by Friday at 12:00 AM ET.`);
    else if (ineligibleCount > 0) setPaintPayoutStatus(`${ineligibleCount} paint scheme upload(s) missed the Friday 12:00 AM ET deadline and were excluded from payout.`);
    return rows;
  }

  async function awardPaintSchemePayouts() {
    const raceName = paintPayoutRace || getPreviousCompletedRaceForPaintWinner(tracks)?.name || selectedRace || "";
    setPaintPayoutStatus("");
    setPaintPayoutError("");

    if (!raceName) {
      setPaintPayoutError("Select a race first.");
      return;
    }

    const alreadyPaid = (activeSeason?.paintSchemePayouts || []).some((payout) => payout.raceName === raceName);
    if (alreadyPaid) {
      setPaintPayoutError(`${raceName} has already been awarded. Remove the payout record before awarding again.`);
      return;
    }

    const rows = paintPayoutRows.length ? paintPayoutRows : await loadPaintSchemePayoutPreview(raceName);
    if (!rows.length) {
      setPaintPayoutError("No payout rows available.");
      return;
    }

    const totalTeam = rows.reduce((sum, row) => sum + Number(row.teamPayout || 0), 0);
    const totalDriver = rows.reduce((sum, row) => sum + Number(row.driverPayout || 0), 0);
    const confirmed = window.confirm(
      `Award paint scheme payouts for ${raceName}?\n\nTeam payouts: ${money(totalTeam)}\nDriver payouts: ${money(totalDriver)}\nRows: ${rows.length}`
    );
    if (!confirmed) return;

    const nextDrivers = (drivers || []).map((driver) => {
      const row = rows.find((item) =>
        String(item.driverId) === String(driver.id) ||
        String(item.driverNumber) === String(driver.number) ||
        String(item.driverName || '').trim().toLowerCase() === String(driver.name || '').trim().toLowerCase()
      );
      if (!row) return driver;
      return {
        ...driver,
        paintSchemeVotesReceived: Number(driver.paintSchemeVotesReceived || 0) + Number(row.votes || 0),
        paintSchemeSeasonVotes: Number(driver.paintSchemeSeasonVotes || 0) + Number(row.votes || 0),
        paintSchemeDriverEarnings: Number(driver.paintSchemeDriverEarnings || 0) + Number(row.driverPayout || 0),
        paintSchemeTeamEarnings: Number(driver.paintSchemeTeamEarnings || 0) + Number(row.teamPayout || 0),
        paintSchemeWins: Number(driver.paintSchemeWins || 0) + (row.rank === 1 ? 1 : 0),
        paintSchemeTop5s: Number(driver.paintSchemeTop5s || 0) + (row.rank <= 5 ? 1 : 0),
        paintSchemeTop10s: Number(driver.paintSchemeTop10s || 0) + (row.rank <= 10 ? 1 : 0),
        paintSchemeLastAwardedRace: raceName,
      };
    });

    const payoutRecord = {
      id: `paint-${Date.now()}`,
      raceName,
      awardedAt: new Date().toISOString(),
      rows,
      totalTeamPayout: totalTeam,
      totalDriverPayout: totalDriver,
      weeklyTeamPayoutCap: PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP,
      seasonTeamPayoutCap: PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP,
      deadlineRule: "Friday 12:00 AM ET. Uploads not updated by then are not eligible for payout.",
    };

    patchActiveSeason({
      drivers: nextDrivers,
      paintSchemePayouts: [...(activeSeason?.paintSchemePayouts || []), payoutRecord],
    });

    const auditRows = rows.map((row) => ({
      race_name: raceName,
      rank: row.rank,
      upload_id: row.uploadId,
      driver_id: row.driverId,
      driver_number: String(row.driverNumber || ""),
      driver_name: row.driverName,
      team: row.team,
      votes: row.votes,
      team_payout: row.teamPayout,
      original_team_payout: row.originalTeamPayout,
      team_cap_applied: row.teamCapApplied,
      team_weekly_cap_applied: row.teamWeeklyCapApplied,
      team_season_cap_applied: row.teamSeasonCapApplied,
      team_season_paid_before_award: row.teamSeasonPaidBeforeAward,
      driver_payout: row.driverPayout,
      updated_at_deadline: row.deadline,
      upload_updated_at: row.updatedAt,
      awarded_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("paint_scheme_payouts").insert(auditRows);
    if (error) {
      console.error("Paint scheme payout audit insert failed:", error);
      setPaintPayoutStatus(`Payout applied to league state, but audit table insert failed. Check paint_scheme_payouts RLS/table.`);
      return;
    }

    setPaintPayoutStatus(`Paint scheme payouts awarded for ${raceName}. Team total ${money(totalTeam)}. Driver total ${money(totalDriver)}.`);
  }

  const clearInputs = () => {
    patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {}, penaltyMap: {}, resultNotesMap: {} });
    setEditingRaceName(null);
  };
  const handleDownloadLeagueBackup = () => {
    const backupPayload = makeLeagueBackupPayload({
      tracks,
      seasons,
      activeSeasonId,
      reason: "manual-admin-backup",
      raceSnapshot: null,
    });

    downloadLeagueBackupFile(backupPayload, "manual-backup");
  };

  const handleRestoreLeagueBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!isValidLeagueBackup(backup)) {
        alert("This backup file is missing seasons or activeSeasonId.");
        return;
      }

      const cleanTracks = sanitizeTracks(backup.tracks) || tracks;
      const cleanSeasons = backup.seasons.map((season, index) => sanitizeSeason(season, `Season ${index + 1}`));
      const activeExists = cleanSeasons.some((season) => season.id === backup.activeSeasonId);
      const nextActiveSeasonId = activeExists ? backup.activeSeasonId : cleanSeasons[0].id;

      setTracks(cleanTracks);
      setSeasons(cleanSeasons);
      setActiveSeasonId(nextActiveSeasonId);

      localStorage.setItem("bcl-last-good-tracks", JSON.stringify(cleanTracks));
      localStorage.setItem("bcl-last-good-seasons", JSON.stringify(cleanSeasons));
      localStorage.setItem("bcl-last-good-activeSeasonId", nextActiveSeasonId);

      const restoredState = {
        tracks: cleanTracks,
        seasons: cleanSeasons,
        activeSeasonId: nextActiveSeasonId,
      };

      await saveLeagueState(restoredState);
      loadedStateSignatureRef.current = makeLeagueStateSignature(restoredState);

      const ledgerSyncResult = await syncAllRaceResultsLedger({
        seasons: cleanSeasons,
        tracks: cleanTracks,
      });

      if (!ledgerSyncResult.ok) {
        alert("Backup restored, but the race_results table did not fully sync. Check the race_results table/RLS.");
      } else {
        alert("Backup restored successfully and race_results table synced. Refresh the page if the standings do not update immediately.");
      }
    } catch (error) {
      console.error("Could not restore league backup:", error);
      alert("Could not restore this backup file. Make sure it is a Budweiser Cup League JSON backup.");
    } finally {
      event.target.value = "";
    }
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
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
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
          resetEditorStates();
          syncAllRaceResultsLedger({ seasons: cleanSeasons, tracks: cleanTracks && cleanTracks.length > 0 ? cleanTracks : tracks })
            .then((result) => {
              if (!result.ok) alert("Full league backup imported, but race_results table did not fully sync.");
              else alert("Full league backup imported and race_results table synced.");
            });
        } else if (parsed?.season) {
          const imported = sanitizeSeason(parsed.season, "Imported Season");
          if (!window.confirm(`Import season "${imported.name}"?`)) return;
          setSeasons((prev) => { const exists = prev.some((s) => s.id === imported.id); return exists ? prev.map((s) => s.id === imported.id ? imported : s) : [...prev, imported]; });
          setActiveSeasonId(imported.id); setRenameSeasonName(imported.name); resetEditorStates();
          syncAllRaceResultsLedger({ seasons: [imported], tracks })
            .then((result) => {
              if (!result.ok) alert("Season backup imported, but race_results table did not fully sync.");
              else alert("Season backup imported and race_results table synced.");
            });
        } else throw new Error("Invalid backup file.");
      } catch (err) { console.error("Import failed:", err); alert("Could not import that backup file."); }
      finally { if (event.target) event.target.value = ""; }
    };
    reader.readAsText(file);
  };
  const addManualWatchPick = async () => {
    if (!watchDriverId) { alert("Select a driver for Ones to Watch."); return; }
    const selectedDriver = drivers.find((d) => Number(d.id) === Number(watchDriverId));
    if (!selectedDriver) { alert("That driver could not be found."); return; }
    setWatchSaving(true);
    const payload = {
      driver_id: Number(watchDriverId),
      reason: watchReason.trim() || "League director watch pick",
      badge: watchBadge.trim() || "DIRECTOR PICK",
      display_order: Number(watchDisplayOrder) || 1,
      active: true,
    };
    const { error } = await supabase.from("ones_to_watch").insert(payload);
    setWatchSaving(false);
    if (error) { console.error("Failed to add Ones to Watch pick:", error); alert("Could not save the Ones to Watch pick. Make sure the Supabase table exists."); return; }
    setWatchDriverId("");
    setWatchReason("");
    setWatchBadge("DIRECTOR PICK");
    setWatchDisplayOrder(String((manualWatchPicks?.length || 0) + 2));
    await loadManualWatchPicks();
  };

  const toggleManualWatchPick = async (pick) => {
    const { error } = await supabase.from("ones_to_watch").update({ active: !pick.active }).eq("id", pick.id);
    if (error) { console.error("Failed to update Ones to Watch pick:", error); alert("Could not update this pick."); return; }
    await loadManualWatchPicks();
  };

  const deleteManualWatchPick = async (pickId) => {
    if (!window.confirm("Delete this Ones to Watch pick?")) return;
    const { error } = await supabase.from("ones_to_watch").delete().eq("id", pickId);
    if (error) { console.error("Failed to delete Ones to Watch pick:", error); alert("Could not delete this pick."); return; }
    await loadManualWatchPicks();
  };

  const resetSeason = () => {
    if (!activeSeason) return;
    if (!window.confirm(`Archive and reset "${activeSeason.name}"? A backup will download first.`)) return;
    downloadBackupObject({ app: "Budweiser Cup League", version: 2, archiveType: "season-reset-archive", archivedAt: new Date().toISOString(), season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}-archive`);
    const resetDrivers = activeSeason.drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: resetDrivers, raceHistory: [], selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {} });
    resetEditorStates();
  };
  const teamStandings = useMemo(() => {
    const teams = {};
    for (const d of visibleDrivers) {
      if (!teams[d.team]) teams[d.team] = { team: d.team, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0, budget: getTeamBudget(d.team) };
      teams[d.team].budget = getTeamBudget(d.team);
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

  const previousRaceForPayment = useMemo(() => {
    const lastPostedRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
    if (!lastPostedRace) return null;
    const track = tracks.find((item) => item.name === lastPostedRace.raceName) || {};
    return { name: lastPostedRace.raceName, date: track.date || lastPostedRace.raceDate || lastPostedRace.date || lastPostedRace.postedAt || lastPostedRace.savedAt || "" };
  }, [raceHistory, tracks]);
  const upcomingRaceForPayment = useMemo(() => getUpcomingRaceByDate(tracks) || tracks[0] || null, [tracks]);
  const paymentComplianceSummary = useMemo(() => buildPaymentComplianceRows({
    teams: teamStandings,
    drivers: visibleDrivers,
    interviews: paymentComplianceInterviews,
    carUploads: paymentComplianceUploads,
    overrides: paymentComplianceOverrides,
    previousRace: previousRaceForPayment,
    upcomingRace: upcomingRaceForPayment,
  }), [teamStandings, visibleDrivers, paymentComplianceInterviews, paymentComplianceUploads, paymentComplianceOverrides, previousRaceForPayment, upcomingRaceForPayment]);
  const saveOwnerAccessCodes = (nextCodes) => {
    setOwnerAccessCodes(nextCodes);
    localStorage.setItem("ownerPortalAccessCodes", JSON.stringify(nextCodes));
  };
  const loadOwnerAccessCodes = async () => {
    const { data, error } = await supabase
      .from("owner_access_codes")
      .select("team, code, active")
      .eq("active", true);
    if (error) {
      console.error("Failed to load owner access codes:", error);
      return;
    }
    const nextCodes = {};
    (data || []).forEach((row) => { if (row.team && row.code) nextCodes[row.team] = row.code; });
    saveOwnerAccessCodes(nextCodes);
  };
  const createOwnerCode = (team) => {
    const prefix = String(team || "TEAM").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "TEAM";
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  };
  const generateOwnerCode = async (team) => {
    const newCode = createOwnerCode(team);
    const nextCodes = { ...ownerAccessCodes, [team]: newCode };
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase.from("owner_access_codes").upsert(
      { team, code: newCode, active: true, updated_at: new Date().toISOString() },
      { onConflict: "team" }
    );
    if (error) {
      console.error("Owner code Supabase save failed:", error);
      alert("Code generated on this admin browser, but Supabase save failed. Make sure the owner_access_codes table exists.");
    } else {
      alert(`Owner code generated for ${getTeamFullName(team)}: ${newCode}`);
    }
  };
  const generateAllOwnerCodes = async () => {
    const nextCodes = { ...ownerAccessCodes };
    const rows = ownerPortalTeams.map((team) => {
      const code = createOwnerCode(team);
      nextCodes[team] = code;
      return { team, code, active: true, updated_at: new Date().toISOString() };
    });
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase.from("owner_access_codes").upsert(rows, { onConflict: "team" });
    if (error) {
      console.error("Owner codes Supabase save failed:", error);
      alert("Codes generated on this admin browser, but Supabase save failed. Make sure the owner_access_codes table exists.");
    } else {
      alert("Owner codes generated for all teams.");
    }
  };
  const clearOwnerCode = async (team) => {
    const nextCodes = { ...ownerAccessCodes };
    delete nextCodes[team];
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase
      .from("owner_access_codes")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("team", team);
    if (error) console.error("Failed to clear owner code:", error);
  };
  const copyOwnerCode = async (team) => {
    const code = ownerAccessCodes[team];
    if (!code) return;
    const message = `${getTeamFullName(team)} owner portal: go to /team-hq, select ${getTeamFullName(team)}, and use code ${code}`;
    try {
      await navigator.clipboard.writeText(message);
      alert("Owner code copied.");
    } catch {
      alert(message);
    }
  };

  const loadDriverAccessCodes = async () => {
    const { data, error } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load driver access codes:", error);
      return;
    }
    setDriverAccessCodes(data || []);
  };

  const createDriverAccessCode = (driver) => {
    const cleanName = String(driver?.name || "DRIVER").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10) || "DRIVER";
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${cleanName}-${randomPart}`;
  };

  const generateDriverAccessCode = async (driver) => {
    if (!driver) return;
    const code = createDriverAccessCode(driver);
    const { error } = await supabase.from("driver_access_codes").upsert(
      {
        driver_number: String(driver.number),
        driver_name: driver.name,
        code,
        active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "driver_number" }
    );
    if (error) {
      console.error("Driver access code save failed:", error);
      alert("Failed to generate driver code. Make sure driver_access_codes exists and has a unique driver_number constraint.");
      return;
    }
    await loadDriverAccessCodes();
    alert(`Driver access code generated for #${driver.number} ${driver.name}: ${code}`);
  };

  const clearDriverAccessCode = async (driver) => {
    if (!driver) return;
    const { error } = await supabase
      .from("driver_access_codes")
      .update({ active: false })
      .eq("driver_number", String(driver.number));
    if (error) {
      console.error("Failed to clear driver access code:", error);
      alert("Failed to clear driver code.");
      return;
    }
    await loadDriverAccessCodes();
  };

  const copyDriverAccessCode = async (driver, code) => {
    if (!driver || !code) return;
    const message = `Driver portal: go to /driver/${driver.number} and use code ${code}`;
    try {
      await navigator.clipboard.writeText(message);
      alert("Driver code copied.");
    } catch {
      alert(message);
    }
  };
  const handlePositionChange = (id, v) => patchActiveSeason({ positions: { ...positions, [id]: v === "" ? "" : Number(v) } });
  const handleStage1Change = (id, v) => patchActiveSeason({ stage1: { ...stage1, [id]: v === "" ? "" : Number(v) } });
  const handleStage2Change = (id, v) => patchActiveSeason({ stage2: { ...stage2, [id]: v === "" ? "" : Number(v) } });
  const handleStage3Change = (id, v) => patchActiveSeason({ stage3: { ...stage3, [id]: v === "" ? "" : Number(v) } });
  const handleDnfChange = (id, checked) => patchActiveSeason({ dnfMap: { ...dnfMap, [id]: checked } });
  const handleStartParkChange = (id, checked) => patchActiveSeason({ startParkMap: { ...startParkMap, [id]: checked } });

  async function loadStartParkRequests() {
    setStartParkRequestsLoading(true);
    const { data, error } = await supabase
      .from("start_park_requests")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Could not load Start & Park requests:", error);
      setStartParkRequestError("Could not load Start & Park requests. Run the start_park_requests SQL and check RLS select policy.");
      setStartParkRequests([]);
      setStartParkRequestsLoading(false);
      return;
    }

    setStartParkRequests(data || []);
    setStartParkRequestsLoading(false);
  }

  useEffect(() => {
    if (!isHydrated) return;
    loadStartParkRequests();
    const interval = setInterval(loadStartParkRequests, 30000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  async function updateStartParkRequestStatus(request, status) {
    setStartParkRequestStatus("");
    setStartParkRequestError("");
    if (status === "approved" && !wasStartParkRequestBeforeCutoff(request)) {
      setStartParkRequestError("This request was submitted after the Saturday 9:00 PM ET cutoff and cannot be approved.");
      return;
    }
    const patch = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "declined") patch.declined_at = new Date().toISOString();

    const { error } = await supabase
      .from("start_park_requests")
      .update(patch)
      .eq("id", request.id);

    if (error) {
      console.error("Could not update Start & Park request:", error);
      setStartParkRequestError("Could not update request. Check start_park_requests update policy.");
      return;
    }

    setStartParkRequestStatus(`Start & Park request ${status}.`);
    await loadStartParkRequests();
  }

  async function applyApprovedStartParkRequestsToRace() {
    setStartParkRequestStatus("");
    setStartParkRequestError("");

    if (!selectedRace) {
      setStartParkRequestError("Select a race before applying Start & Park requests.");
      return;
    }

    const approved = (startParkRequests || [])
      .filter((request) => String(request.status || "").toLowerCase() === "approved")
      .filter((request) => String(request.race_name || "") === String(selectedRace))
      .filter((request) => wasStartParkRequestBeforeCutoff(request))
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    if (!approved.length) {
      setStartParkRequestError("No approved Start & Park requests are waiting for this race.");
      return;
    }

    const nextPositions = { ...positions };
    const nextStartParkMap = { ...startParkMap };
    const nextStage1 = { ...stage1 };
    const nextStage2 = { ...stage2 };
    const nextStage3 = { ...stage3 };
    const nextNotes = { ...resultNotesMap };
    const totalStarters = activeDrivers.length || 0;

    approved.forEach((request, index) => {
      const driver = activeDrivers.find((item) => String(item.id) === String(request.driver_id) || String(item.number) === String(request.driver_number));
      if (!driver) return;
      const rearPosition = Math.max(1, totalStarters - approved.length + index + 1);
      nextPositions[driver.id] = rearPosition;
      nextStartParkMap[driver.id] = true;
      nextStage1[driver.id] = "";
      nextStage2[driver.id] = "";
      nextStage3[driver.id] = "";
      const note = `Start & Park approved by Race Control. Rear order ${index + 1} of ${approved.length} by request receipt.`;
      nextNotes[driver.id] = nextNotes[driver.id] ? `${nextNotes[driver.id]} | ${note}` : note;
    });

    patchActiveSeason({
      positions: nextPositions,
      startParkMap: nextStartParkMap,
      stage1: nextStage1,
      stage2: nextStage2,
      stage3: nextStage3,
      resultNotesMap: nextNotes,
    });

    const ids = approved.map((request) => request.id).filter(Boolean);
    if (ids.length) {
      await supabase
        .from("start_park_requests")
        .update({ status: "applied", applied_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in("id", ids);
    }

    setStartParkRequestStatus(`${approved.length} Start & Park request${approved.length === 1 ? "" : "s"} placed at the rear in order of receipt.`);
    await loadStartParkRequests();
  }

  const handleOffenseChange = (id, checked) => patchActiveSeason({ offenseMap: { ...offenseMap, [id]: checked } });
  const handleManualPenaltyChange = (id, value) => patchActiveSeason({ penaltyMap: { ...penaltyMap, [id]: value === "" ? "" : Number(value) } });
  const handleResultNoteChange = (id, value) => patchActiveSeason({ resultNotesMap: { ...resultNotesMap, [id]: value } });
  const handleFastestLapChange = (id) => patchActiveSeason({ fastestLapMap: fastestLapMap[id] ? {} : { [id]: true } });
  const moveDriverFinishPosition = (driverId, direction) => {
    const current = Number(positions[driverId] || 0);
    if (!current) return;
    const next = Math.max(1, Math.min(activeDrivers.length || 40, current + direction));
    const swappedDriver = activeDrivers.find((driver) => Number(positions[driver.id]) === next);
    const nextPositions = { ...positions, [driverId]: next };
    if (swappedDriver) nextPositions[swappedDriver.id] = current;
    patchActiveSeason({ positions: nextPositions });
  };
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
    const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 })), rosterDriver];
    patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
    setNewDriverName(""); setNewDriverNumber(""); setNewDriverManufacturer(""); setNewDriverTeam("");
  };
  const openEditDriver = (driver) => { setEditingDriverId(driver.id); setEditDriverForm({ name: driver.name, number: driver.number, manufacturer: driver.manufacturer || "", team: driver.team }); };
  const cancelEditDriver = () => { setEditingDriverId(null); setEditDriverForm({ name: "", number: "", manufacturer: "", team: "" }); };
  const saveDriverEdit = () => {
    if (!editingDriverId || !activeSeason) return;
    const name = editDriverForm.name.trim(), number = String(editDriverForm.number).trim(), manufacturer = editDriverForm.manufacturer.trim(), team = editDriverForm.team.trim();
    if (!name || !number || !manufacturer || !team) { alert("Please enter driver name, number, manufacturer, and team."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && d.name.toLowerCase() === name.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && String(d.number) === number)) { alert("A driver with that number already exists."); return; }
    const updatedRoster = drivers.map((d) => d.id === editingDriverId ? { ...d, name, number: Number(number), manufacturer, manufacturerLogo: manufacturerLogos[manufacturer] || null, team, startingPoints: 0, manualWins: 0 } : d);
    const updatedHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).map((r) => r.driverId === editingDriverId ? { ...r, name, number: Number(number), manufacturer, team } : r) }));
    const rosterOnly = updatedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(updatedHistory, rosterOnly), raceHistory: updatedHistory });
    cancelEditDriver();
  };
  const removeDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver || !window.confirm(`Remove ${driver.name}? This will also remove their results from race history.`)) return;
    const newRoster = drivers.filter((d) => d.id !== driverId).map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0 }));
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
      patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {}, penaltyMap: {}, resultNotesMap: {} });
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
      const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 })), newDriver];
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
  const buildRaceResultsFromCurrentInputs = () => {
    return drivers.map((driver) => {
      const finishPos = positions[driver.id];
      const stage1Pos = stage1[driver.id], stage2Pos = stage2[driver.id], stage3Pos = stage3[driver.id];
      const dnf = !!dnfMap[driver.id];
      const startPark = !!startParkMap[driver.id];
      const fastestLap = !!fastestLapMap[driver.id];
      const offense = !!offenseMap[driver.id];
      const manualPenaltyPoints = Number(penaltyMap[driver.id] || 0);
      const finishPoints = finishPos && finishPos >= 1 && finishPos <= pointsTable.length ? pointsTable[finishPos - 1] : 0;
      const stage1Points = startPark ? 0 : getStagePoints(stage1Pos), stage2Points = startPark ? 0 : getStagePoints(stage2Pos);
      const stage3Points = startPark ? 0 : (stageCount === 3 ? getStagePoints(stage3Pos) : 0);
      const fastestLapPoints = fastestLap ? 1 : 0;
      const priorOffenses = countPriorOffenses(raceHistory, driver.id, editingRaceName);
      const offenseNumber = offense ? priorOffenses + 1 : 0;
      const offensePenalty = offense ? getOffensePenaltyPoints(offenseNumber) : 0;
      const penaltyPoints = offensePenalty + manualPenaltyPoints;
      const totalRacePoints = finishPoints + stage1Points + stage2Points + stage3Points + fastestLapPoints - penaltyPoints;
      return {
        driverId: driver.id, name: driver.name, number: driver.number, team: driver.team, manufacturer: driver.manufacturer || "",
        finishPos: finishPos || null, stage1Pos: stage1Pos || null, stage2Pos: stage2Pos || null, stage3Pos: stageCount === 3 ? stage3Pos || null : null,
        finishPoints, stage1Points, stage2Points, stage3Points, fastestLap, fastestLapPoints,
        offense, offenseNumber, offensePenalty, manualPenaltyPoints, penaltyPoints, totalRacePoints,
        isWin: finishPos === 1, isTop3: finishPos >= 1 && finishPos <= 3, isTop5: finishPos >= 1 && finishPos <= 5,
        dnf, startPark, dnfReason: dnf ? (dnfReasons[driver.id] || "Unknown") : null,
        notes: resultNotesMap[driver.id] || "",
      };
    }).sort((a, b) => { if (a.finishPos === null) return 1; if (b.finishPos === null) return -1; return a.finishPos - b.finishPos; });
  };

  const buildRaceFromCurrentInputs = () => ({
    raceName: selectedRace,
    stageCount,
    results: buildRaceResultsFromCurrentInputs(),
    savedAt: new Date().toISOString(),
  });

  const saveResultsDraft = () => {
    if (!activeSeason) return;
    if (!selectedRace.trim()) { alert("Please select a race before saving a draft."); return; }
    const draft = {
      ...buildRaceFromCurrentInputs(),
      id: `draft-${selectedRace.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}`,
      status: "Draft",
      draftSavedAt: new Date().toISOString(),
      posted: false,
    };
    const nextDrafts = [draft, ...(raceDrafts || []).filter((item) => item.raceName !== selectedRace)];
    patchActiveSeason({ raceDrafts: nextDrafts });
    alert("Admin-only results draft saved. Standings were not updated.");
  };

  const loadResultsDraft = (draft) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, spm = {}, no = {}, nf = {}, nr = {}, pm = {}, notes = {};
    (draft.results || []).forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; spm[r.driverId] = !!r.startPark; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
      if (r.dnfReason) nr[r.driverId] = r.dnfReason;
      if (r.manualPenaltyPoints) pm[r.driverId] = r.manualPenaltyPoints;
      if (r.notes) notes[r.driverId] = r.notes;
    });
    setDnfReasons(nr);
    patchActiveSeason({ selectedRace: draft.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, startParkMap: spm, offenseMap: no, fastestLapMap: nf, penaltyMap: pm, resultNotesMap: notes });
    setEditingRaceName(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteResultsDraft = (draftId) => {
    if (!activeSeason || !window.confirm("Delete this admin-only results draft?")) return;
    patchActiveSeason({ raceDrafts: (raceDrafts || []).filter((draft) => draft.id !== draftId) });
  };

  const postResultsDraft = async (draft) => {
    if (!draft) return;
    loadResultsDraft(draft);
    setTimeout(() => submitResults(draft), 0);
  };

  const submitResults = async (draftOverride = null) => {
    if (!activeSeason) return;
    const raceToPost = draftOverride || buildRaceFromCurrentInputs();
    if (!raceToPost.raceName.trim()) { alert("Please select a race."); return; }
    if (raceHistory.some((r) => r.raceName === raceToPost.raceName && editingRaceName !== raceToPost.raceName)) { alert("That race has already been entered."); return; }
    const updatedRace = {
      ...raceToPost,
      status: "Posted",
      postedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };
    const newHistory = editingRaceName ? raceHistory.map((r) => r.raceName === editingRaceName ? updatedRace : r) : [...raceHistory, updatedRace];
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
    const rebuiltDrivers = rebuildDriversFromHistory(newHistory, rosterOnly);
    const updatedSeason = {
      ...activeSeason,
      raceHistory: newHistory,
      raceDrafts: (raceDrafts || []).filter((draft) => draft.id !== draftOverride?.id && draft.raceName !== updatedRace.raceName),
      drivers: rebuiltDrivers,
      selectedRace: "",
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      offenseMap: {},
      fastestLapMap: {},
      penaltyMap: {},
      resultNotesMap: {},
    };

    const updatedSeasons = seasons.map((season) => (season.id === activeSeasonId ? updatedSeason : season));

    replaceActiveSeason(updatedSeason);

    const automaticBackupPayload = makeLeagueBackupPayload({
      tracks,
      seasons: updatedSeasons,
      activeSeasonId,
      reason: editingRaceName ? "automatic-edit-race-results" : "automatic-post-race-results",
      raceSnapshot: updatedRace,
    });

    downloadLeagueBackupFile(automaticBackupPayload, editingRaceName ? "auto-edit-race-results" : "auto-post-race-results");

    const backupResult = await createRaceDataBackup({
      seasonSnapshot: updatedSeason,
      raceSnapshot: updatedRace,
      backupType: editingRaceName ? "edit-race-save-points" : "post-points-to-standings",
    });

    const ledgerResult = await saveRaceResultsLedger({
      season: updatedSeason,
      race: updatedRace,
      tracks,
    });

    if (!backupResult.ok && !ledgerResult.ok) {
      alert("Race points posted locally and a JSON backup downloaded, but Supabase backup AND race_results ledger failed. Check race_data_backups and race_results tables/RLS.");
    } else if (!backupResult.ok) {
      alert("Race points posted and race_results ledger updated, but the Supabase JSON backup failed. Check race_data_backups table/RLS.");
    } else if (!ledgerResult.ok) {
      alert("Race points posted and a JSON backup downloaded, but race_results ledger failed. Check race_results table/RLS.");
    } else {
      alert("Race results posted to standings.");
    }

    setEditingRaceName(null);
  };
  const handleEditRace = (race) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, spm = {}, no = {}, nf = {}, nr = {}, pm = {}, notes = {};
    race.results.forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; spm[r.driverId] = !!r.startPark; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
      if (r.dnfReason) nr[r.driverId] = r.dnfReason;
      if (r.manualPenaltyPoints) pm[r.driverId] = r.manualPenaltyPoints;
      if (r.notes) notes[r.driverId] = r.notes;
    });
    setDnfReasons(nr);
    patchActiveSeason({ selectedRace: race.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, startParkMap: spm, offenseMap: no, fastestLapMap: nf, penaltyMap: pm, resultNotesMap: notes });
    setEditingRaceName(race.raceName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteRace = (raceName) => {
    if (!activeSeason || !window.confirm(`Delete ${raceName}? This will recalculate the standings.`)) return;
    const newHistory = raceHistory.filter((r) => r.raceName !== raceName);
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly) });
    if (editingRaceName === raceName) clearInputs();
  };
  const offenseLog = raceHistory.flatMap((race) =>
    race.results.filter((r) => r.offense).map((r) => ({ raceName: race.raceName, number: r.number, name: r.name, offenseNumber: r.offenseNumber, penaltyPoints: r.penaltyPoints }))
  );
  const saveDiscordSettings = () => {
    const cleanUrl = discordInviteUrl.trim() || DEFAULT_DISCORD_INVITE_URL;
    const settings = {
      inviteUrl: cleanUrl,
      announcement: discordAnnouncement.trim() || "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
      rulesText: discordRulesText.trim() || DEFAULT_DISCORD_RULES.join("\n"),
    };
    localStorage.setItem("bcl-discord-settings", JSON.stringify(settings));
    setDiscordInviteUrl(settings.inviteUrl);
    setDiscordAnnouncement(settings.announcement);
    setDiscordRulesText(settings.rulesText);
    alert("Discord settings saved.");
  };

  async function exportAppDataJson() {
    const tablesToExport = [
      "league_state",
      "race_results",
      "race_data_backups",
      "interviews",
      "driver_access_codes",
      "team_owner_assignments",
      "team_finances",
      "contract_offers",
      "technical_alliances",
      "owner_tasks",
      "driver_tasks",
      "paint_scheme_votes",
      "start_park_requests",
      "streams",
      "ticker_messages",
      "app_update_banners",
      "league_messages",
      "appeals",
      "story_submissions",
      "memorial_day_tributes",
    ];

    const exportPayload = {
      exportVersion: 1,
      appVersion: APP_VERSION,
      appName: "Budweiser Cup League",
      exportedAt: new Date().toISOString(),
      purpose: "Accurate interview, media, standings, and league storyline context",
      activeSeasonId,
      activeSeasonName: activeSeason?.name || "",
      localState: {
        tracks,
        seasons,
        activeSeasonId,
        activeSeason,
        drivers: visibleDrivers,
        teamStandings,
        manufacturerStandings,
        raceHistory,
        selectedRace,
        ownerAssignments,
      },
      supabaseTables: {},
    };

    for (const table of tablesToExport) {
      try {
        const { data, error } = await supabase.from(table).select("*");

        if (error) {
          exportPayload.supabaseTables[table] = {
            ok: false,
            error: error.message,
            rows: [],
          };
        } else {
          exportPayload.supabaseTables[table] = {
            ok: true,
            count: Array.isArray(data) ? data.length : 0,
            rows: data || [],
          };
        }
      } catch (error) {
        exportPayload.supabaseTables[table] = {
          ok: false,
          error: error?.message || String(error),
          rows: [],
        };
      }
    }

    const dateStamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `budweiser-cup-app-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function loadPaymentComplianceData() {
    setPaymentComplianceLoading(true);
    setPaymentComplianceError("");
    setPaymentComplianceStatus("");

    // Do not order in Supabase here because some league tables use submitted_at instead of created_at.
    // We pull rows first, then sort in the browser using every supported timestamp field.
    const [{ data: interviewsData, error: interviewsError }, { data: uploadData, error: uploadError }, { data: overrideData, error: overrideError }] = await Promise.all([
      supabase.from("interviews").select("*"),
      supabase.from("car_uploads").select("*"),
      supabase.from("team_payment_overrides").select("*"),
    ]);

    if (interviewsError || uploadError) {
      console.error("Could not load payment compliance data:", interviewsError || uploadError);
      setPaymentComplianceError("Could not load interviews or paint uploads. Check interviews/car_uploads select policies.");
    }

    if (overrideError) {
      console.warn("Could not load team_payment_overrides; using local browser overrides instead.", overrideError);
    } else {
      setPaymentComplianceOverrides(overrideData || []);
      localStorage.setItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY, JSON.stringify(overrideData || []));
    }

    const sortNewest = (rows = []) => (Array.isArray(rows) ? rows : [])
      .filter((row) => row && typeof row === "object")
      .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0));

    setPaymentComplianceInterviews(sortNewest(interviewsData));
    setPaymentComplianceUploads(sortNewest(uploadData));
    setPaymentComplianceLoading(false);
    setPaymentComplianceStatus("Payment compliance tracker refreshed.");
  }

  async function savePaymentComplianceOverride(row, status) {
    const cleanStatus = status === "approved" || status === "denied" ? status : "";
    const payload = {
      team_key: row.teamKey,
      team_name: row.teamName,
      period_key: row.paymentPeriodKey,
      previous_race: row.previousRaceName || null,
      upcoming_race: row.upcomingRaceName || null,
      override_status: cleanStatus,
      override_reason: cleanStatus ? `Admin ${cleanStatus} payment override` : "Override cleared",
      updated_at: new Date().toISOString(),
    };

    const nextLocal = [payload, ...(paymentComplianceOverrides || []).filter((item) => !(String(item.team_key || item.team) === String(row.teamKey) && String(item.period_key || item.periodKey) === String(row.paymentPeriodKey)))].filter((item) => item.override_status);
    setPaymentComplianceOverrides(nextLocal);
    localStorage.setItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY, JSON.stringify(nextLocal));

    if (!cleanStatus) {
      const { error } = await supabase
        .from("team_payment_overrides")
        .delete()
        .eq("team_key", row.teamKey)
        .eq("period_key", row.paymentPeriodKey);
      if (error) console.warn("Could not clear override from Supabase; local override was cleared.", error);
      setPaymentComplianceStatus(`Payment override cleared for ${row.teamName}.`);
      return;
    }

    const { error } = await supabase
      .from("team_payment_overrides")
      .upsert(payload, { onConflict: "team_key,period_key" });

    if (error) {
      console.warn("Could not save override to Supabase; saved locally in this browser.", error);
      setPaymentComplianceStatus(`Payment override saved locally for ${row.teamName}. Create/check team_payment_overrides to sync it.`);
      return;
    }

    setPaymentComplianceStatus(`Payment override saved for ${row.teamName}.`);
  }

  function PaymentCompliancePanel({ mode = "admin" }) {
    const rows = paymentComplianceSummary;
    const allMet = rows.length > 0 && rows.every((row) => row.finalEligible);
    const isAdminMode = mode === "admin";

    return (
      <div style={sectionCardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Team Payment Compliance</h2>
            <p style={{ opacity: 0.75, margin: "8px 0 0", lineHeight: 1.45 }}>
              Paint schemes and previous-race post interviews are due Wednesday at 11:59 PM ET. Upcoming-race pre interviews are due Saturday at 8:30 PM ET.
            </p>
          </div>
          <button type="button" onClick={loadPaymentComplianceData} style={primaryButtonStyle} disabled={paymentComplianceLoading}>
            {paymentComplianceLoading ? "Refreshing..." : "Refresh Payment Tracker"}
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          <div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>PREVIOUS RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{previousRaceForPayment?.name || "—"}</div></div>
          <div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>UPCOMING RACE</div><div style={{ fontSize: 18, fontWeight: 900 }}>{upcomingRaceForPayment?.name || "—"}</div></div>
          <div style={statBoxStyle}><div style={{ opacity: 0.7, fontSize: 12, fontWeight: 900 }}>ALL TEAMS MET TIMELINES?</div><div style={{ fontSize: 18, fontWeight: 900, color: allMet ? "#4ade80" : "#f87171" }}>{allMet ? "YES" : "NO"}</div></div>
        </div>

        {paymentComplianceStatus && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{paymentComplianceStatus}</div>}
        {paymentComplianceError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{paymentComplianceError}</div>}

        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Team</th>
                <th style={thStyle}>Final Pay Status</th>
                <th style={thStyle}>Paint Scheme Deadline</th>
                <th style={thStyle}>Post Interview Deadline</th>
                <th style={thStyle}>Pre Interview Deadline</th>
                <th style={thStyle}>Driver Timestamp Details</th>
                {isAdminMode && <th style={thStyle}>Override</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td style={tdStyle} colSpan={isAdminMode ? 7 : 6}>No team compliance data loaded yet. Click refresh.</td></tr>
              ) : rows.map((row) => (
                <tr key={row.teamKey}>
                  <td style={{ ...tdStyle, fontWeight: 900 }}>{row.teamName}</td>
                  <td style={{ ...tdStyle, color: row.finalEligible ? "#4ade80" : "#f87171", fontWeight: 1000 }}>
                    {row.finalEligible ? "QUALIFIED" : "NOT QUALIFIED"}
                    {row.overrideStatus && <div style={{ fontSize: 12, color: "#facc15", marginTop: 4 }}>Override: {row.overrideStatus.toUpperCase()}</div>}
                  </td>
                  <td style={tdStyle}>{formatPaymentTimestamp(row.paintDeadlineIso)}</td>
                  <td style={tdStyle}>{formatPaymentTimestamp(row.postDeadlineIso)}</td>
                  <td style={tdStyle}>{formatPaymentTimestamp(row.preDeadlineIso)}</td>
                  <td style={{ ...tdStyle, minWidth: 420 }}>
                    {row.driverChecks.map((check) => (
                      <div key={check.driver.id} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ fontWeight: 900 }}>#{check.driver.number} {check.driver.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.84 }}>Paint: <b style={{ color: check.paintMet ? "#4ade80" : "#f87171" }}>{check.paintMet ? "MET" : "MISSED"}</b> — {formatPaymentTimestamp(check.paintAt)}</div>
                        <div style={{ fontSize: 12, opacity: 0.84 }}>Post: <b style={{ color: check.postMet ? "#4ade80" : "#f87171" }}>{check.postMet ? "MET" : "MISSED"}</b> — {formatPaymentTimestamp(check.postAt)}</div>
                        <div style={{ fontSize: 12, opacity: 0.84 }}>Pre: <b style={{ color: check.preMet ? "#4ade80" : "#f87171" }}>{check.preMet ? "MET" : "MISSED"}</b> — {formatPaymentTimestamp(check.preAt)}</div>
                      </div>
                    ))}
                  </td>
                  {isAdminMode && (
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => savePaymentComplianceOverride(row, "approved")} style={{ ...primaryButtonStyle, padding: "8px 10px" }}>Approve Pay</button>
                        <button type="button" onClick={() => savePaymentComplianceOverride(row, "denied")} style={{ ...dangerButtonStyle, padding: "8px 10px" }}>Deny Pay</button>
                        <button type="button" onClick={() => savePaymentComplianceOverride(row, "")} style={{ ...secondaryButtonStyle, padding: "8px 10px" }}>Clear</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const adminProtectedPaths = new Set(["/admin", "/appeals", "/admin/stories", "/stories", "/admin/live-control", "/admin/car-gallery", "/admin/interviews", "/admin/votes"]);
  const isAdminProtectedPath = adminProtectedPaths.has(path);
  const isAdminAuthenticated = sessionStorage.getItem("bcl-admin-auth") === "true";
  const logoutAdmin = () => {
    sessionStorage.removeItem("bcl-admin-auth");
    sessionStorage.removeItem("bcl-admin-auth-time");
    localStorage.removeItem("bcl-admin-auth");
    localStorage.removeItem("bcl-admin-auth-time");
    window.location.pathname = "/standings";
  };

  if (path === "/admin-login") return <AdminLoginPage />;
  if (isAdminProtectedPath && !isAdminAuthenticated) return <AdminLoginPage />;

  // Static pages (no Supabase data needed)
  if (path === "/files") return <FilesPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/submit-story") return <SubmitStoryPage />;
  if (path === "/appeals") return <AppealsPage />;
  if (path === "/admin/stories" || path === "/stories") return <StoriesAdminPage />;
  if (path === "/admin/live-control") {
  return <LiveControlPanel />;
}
  if (path === "/streams" || path === "/stream") {
  // Build next race from the schedule date and roll after 10:00 PM Eastern on race day.
  const sortedTracks = getSortedTracksByDate(tracks || []);
  const nextRace = getUpcomingRaceByDate(sortedTracks);

  // Track helper (uses your existing trackOverviewData)
  function getTrackOverview(race) {
    if (!race) return null;
    return trackOverviewData[race.name] || trackOverviewData[race.track] || null;
  }

  return (
    <StreamPage
      drivers={drivers}
      teams={teamStandings}
      manufacturers={manufacturerStandings}
      activeRace={nextRace}
      selectedTrack={getTrackOverview(nextRace)}
    />
  );
}
  if (path === "/news") return <NewsPage />;
  if (path === "/paint-scheme-vote") return <PaintSchemeVotePage drivers={visibleDrivers} tracks={tracks} />;
  if (path === "/vote" || path === "/league-vote" || path === "/voting") return <LeagueVotingPage drivers={visibleDrivers} />;
  if (path === "/notifications") return <NotificationsPage />;
  if (path === "/discord") return <DiscordPage />;
  if (path === "/interviews") return <PublicInterviewsPage />;
  if (path === "/driver-feedback") {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Driver Feedback Moved</h2>
            <div style={{ opacity: 0.75, lineHeight: 1.6 }}>
              Driver feedback now lives inside each protected driver profile so only the driver can submit morale ratings.
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={{ ...primaryButtonStyle, marginTop: 16 }}>
              Back to Standings
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Loading gate — all routes below this need Supabase data
  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;
  if (path === "/admin/car-gallery") {
    return (
      <CarGalleryPage
        drivers={drivers}
        tracks={tracks}
        enableDownload={true}
      />
    );
  }
  if (path === "/admin/interviews") return <InterviewsPage drivers={drivers} tracks={tracks} seasons={seasons} activeSeasonId={activeSeasonId} />;
  if (path === "/admin/votes") return <AdminVotingPage drivers={visibleDrivers} />;
  // Team detail page
  if (path.startsWith("/team/")) {
    const abbr = decodeURIComponent(rawPath.replace(/^\/team\//i, "").split("/")[0]);
    const normalizedTeam = String(abbr || "").toLowerCase();
    const selectedTeamDrivers = visibleDrivers.filter(
      (d) => String(d.team || "").toLowerCase() === normalizedTeam
    );
    const selectedTeamStanding = teamStandings.find(
      (t) => String(t.team || "").toLowerCase() === normalizedTeam
    ) || null;

    return (
      <TeamDetailPage
        key={`team-${abbr}-${activeSeasonId}-${raceHistory.length}-${selectedTeamStanding?.points || 0}`}
        drivers={visibleDrivers}
        teamDrivers={selectedTeamDrivers}
        teams={teamStandings}
        teamStandings={teamStandings}
        standings={teamStandings}
        selectedStanding={selectedTeamStanding}
        team={selectedTeamStanding}
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
    const normalizedManufacturer = String(mfrName || "").toLowerCase();
    const selectedManufacturerDrivers = visibleDrivers.filter(
      (d) => String(d.manufacturer || "").toLowerCase() === normalizedManufacturer
    );
    const selectedManufacturerStanding = manufacturerStandings.find(
      (m) => String(m.manufacturer || "").toLowerCase() === normalizedManufacturer
    ) || null;

    return (
      <ManufacturerDetailPage
        key={`manufacturer-${mfrName}-${activeSeasonId}-${raceHistory.length}-${selectedManufacturerStanding?.points || 0}`}
        drivers={visibleDrivers}
        manufacturerDrivers={selectedManufacturerDrivers}
        manufacturers={manufacturerStandings}
        manufacturerStandings={manufacturerStandings}
        standings={manufacturerStandings}
        selectedStanding={selectedManufacturerStanding}
        manufacturer={selectedManufacturerStanding}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        initialManufacturer={mfrName}
        selectedManufacturer={mfrName}
      />
    );
  }
  if (path.startsWith("/driver/")) {
    return (
      <>
        <div style={{ minHeight: 0, background: "#0c0f14", padding: "20px 20px 0" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <AppUpdateBanner page="driver" />
          </div>
        </div>
        <DriverVoteReminderStrip driverNumber={decodeURIComponent(rawPath.replace(/^\/driver\//i, "").split("/")[0])} />
        <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />
      </>
    );
  }
  if (path === "/owners" || path === "/team-hq") return (
    <>
      <OwnersPage
        drivers={visibleDrivers}
        teams={teamStandings}
        teamBudgets={teamBudgets}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        tracks={tracks}
        paymentCompliance={paymentComplianceSummary}
        onApplyTeamTransaction={applyOwnerPortalTeamTransaction}
      />
      <div style={{ ...appShellStyle, padding: "0 20px 20px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <PaymentCompliancePanel mode="team" />
        </div>
      </div>
    </>
  );
  if (path === "/contracts") return <ContractsPage drivers={visibleDrivers} />;
  if (path === "/memorial-day") return <MemorialDayPage drivers={visibleDrivers} />;

  if (path === "/chat") return <LeagueChatPage drivers={visibleDrivers} />;
  if (path === "/message-center") return <LeagueMessageCenterLandingPage drivers={visibleDrivers} />;
  if (path === "/" || path === "/standings") return <PublicStandings drivers={visibleDrivers} teams={teamStandings} manufacturerStandings={manufacturerStandings} seasonName={activeSeason?.name || ""} tracks={tracks} raceHistory={raceHistory} />;
  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") return <TickerOverlay drivers={visibleDrivers} teams={teamStandings} raceHistory={raceHistory} preview={viewMode === "overlay-ticker"} seasonName={activeSeason?.name || ""} />;
  if (path !== "/admin") {
    return <PublicStandings drivers={visibleDrivers} teams={teamStandings} manufacturerStandings={manufacturerStandings} seasonName={activeSeason?.name || ""} tracks={tracks} raceHistory={raceHistory} />;
  }
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
              <button onClick={() => (window.location.pathname = "/team-hq")} style={headerButtonStyle}>
                🏢 Team HQ
              </button>
              <button onClick={logoutAdmin} style={{ ...headerButtonStyle, border: "1px solid #b42318", color: "#fecaca" }}>
                Logout
              </button>
              <button onClick={() => (window.location.pathname = "/streams")} style={headerButtonStyle}>
                🎮 Streams
              </button>
              <button onClick={() => (window.location.pathname = "/discord")} style={headerButtonStyle}>
                💬 Discord
              </button>
              <button onClick={() => (window.location.pathname = "/news")} style={headerButtonStyle}>
                📰 News
              </button>
              <button onClick={() => (window.location.pathname = "/notifications")} style={headerButtonStyle}>
                🔔 Notifications
              </button>
              <button onClick={() => (window.location.pathname = "/appeals")} style={headerButtonStyle}>
                Appeals ({openAppealCount})
              </button>
              <button onClick={() => (window.location.pathname = "/admin/stories")} style={headerButtonStyle}>
                Stories ({openStoryCount})
              </button>
              <button onClick={() => (window.location.pathname = "/admin/car-gallery")} style={headerButtonStyle}>
                Car Gallery
              </button>
              <button onClick={() => (window.location.pathname = "/admin/interviews")} style={headerButtonStyle}>
                🎙️ Interviews
              </button>
              <button onClick={() => (window.location.pathname = "/admin/votes")} style={headerButtonStyle}>
                🗳️ Voting
              </button>
              <button onClick={exportAppDataJson} style={{ ...primaryButtonStyle, padding: "10px 14px" }}>
                ⬇️ Export App Data JSON
              </button>
            </div>
          </div>
        </div>

        <AdminLeagueMessageComposer drivers={visibleDrivers} teams={teamStandings} />

        <AdminLeagueMessageDashboard drivers={visibleDrivers} teams={teamStandings} />

        <PaymentCompliancePanel mode="admin" />

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Owner Assignments</h2>
          <p style={{ opacity: 0.75, marginTop: 0 }}>
            Assign which driver owns each team. That driver’s profile password will unlock the matching owner/team page. The admin master password still unlocks every team.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>TEAM</label>
              <select value={selectedOwnerTeam} onChange={(event) => setSelectedOwnerTeam(event.target.value)} style={inputStyle}>
                <option value="">Select team</option>
                {teamStandings
                  .filter((team) => team.team !== "Independent" && team.team !== "IND")
                  .map((team) => (
                    <option key={team.team} value={team.team}>{getTeamFullName(team.team)}</option>
                  ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>OWNER DRIVER</label>
              <select value={selectedOwnerDriverNumber} onChange={(event) => setSelectedOwnerDriverNumber(event.target.value)} style={inputStyle}>
                <option value="">Select owner driver</option>
                {visibleDrivers
                  .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
                  .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999))
                  .map((driver) => (
                    <option key={driver.id} value={driver.number}>#{driver.number} — {driver.name}</option>
                  ))}
              </select>
            </div>

            <button type="button" onClick={saveOwnerAssignment} style={primaryButtonStyle}>Save Owner Assignment</button>
          </div>

          {ownerAssignmentMessage && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentMessage}</div>}
          {ownerAssignmentError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentError}</div>}

          <div style={{ marginTop: 18, overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Assigned Owner Driver</th>
                  <th style={thStyle}>Driver #</th>
                </tr>
              </thead>
              <tbody>
                {ownerAssignments.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={3}>No owner assignments saved yet.</td></tr>
                ) : (
                  ownerAssignments.map((assignment) => (
                    <tr key={assignment.team}>
                      <td style={tdStyle}>{getTeamFullName(assignment.team)}</td>
                      <td style={tdStyle}>{assignment.owner_driver_name}</td>
                      <td style={tdStyle}>#{assignment.owner_driver_number}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* League Ticker Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🏁 League Ticker Banner</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                Manage the scrolling ticker shown at the top of /standings. Use categories like BREAKING, TRANSACTION, RACE CONTROL, APP UPDATE, and NEXT EVENT.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={loadTickerMessages} style={secondaryButtonStyle}>Refresh Ticker</button>
              <button type="button" onClick={seedWeeklyTickerMessages} style={primaryButtonStyle}>Add This Week's Headlines</button>
            </div>
          </div>

          <form onSubmit={saveTickerMessage} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Category</div>
                <select
                  style={inputStyle}
                  value={tickerForm.category}
                  onChange={(event) => setTickerForm((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="BREAKING">BREAKING</option>
                  <option value="NEWS">NEWS</option>
                  <option value="TRANSACTION">TRANSACTION</option>
                  <option value="TEAM UPDATE">TEAM UPDATE</option>
                  <option value="RACE CONTROL">RACE CONTROL</option>
                  <option value="RESULTS">RESULTS</option>
                  <option value="APP UPDATE">APP UPDATE</option>
                  <option value="NEXT EVENT">NEXT EVENT</option>
                  <option value="SPONSOR">SPONSOR</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Page</div>
                <select
                  style={inputStyle}
                  value={tickerForm.page}
                  onChange={(event) => setTickerForm((current) => ({ ...current, page: event.target.value }))}
                >
                  <option value="standings">/standings only</option>
                  <option value="all">All pages using ticker</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Sort Order</div>
                <input
                  type="number"
                  style={inputStyle}
                  value={tickerForm.sort_order}
                  onChange={(event) => setTickerForm((current) => ({ ...current, sort_order: event.target.value }))}
                />
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Auto-Expire</div>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={tickerForm.expires_at}
                  onChange={(event) => setTickerForm((current) => ({ ...current, expires_at: event.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Ticker Message</div>
              <input
                style={inputStyle}
                value={tickerForm.message}
                onChange={(event) => setTickerForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Example: WSM Motorsports closes operations • BigDiehl21 signs with MER"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={tickerForm.active}
                  onChange={(event) => setTickerForm((current) => ({ ...current, active: event.target.checked }))}
                />
                Active
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={tickerForm.pinned}
                  onChange={(event) => setTickerForm((current) => ({ ...current, pinned: event.target.checked }))}
                />
                Pin First
              </label>
              <button type="submit" style={primaryButtonStyle}>{editingTickerId ? "Save Ticker Message" : "Add Ticker Message"}</button>
              {editingTickerId && <button type="button" onClick={resetTickerForm} style={secondaryButtonStyle}>Cancel Edit</button>}
            </div>

            {tickerStatus && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{tickerStatus}</div>}
            {tickerError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{tickerError}</div>}
          </form>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Pinned</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Page</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickerMessages.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={8}>No ticker messages saved yet. Use “Add This Week's Headlines” to seed the current league ticker.</td></tr>
                ) : (
                  tickerMessages.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, color: item.active === false ? "#f87171" : "#4ade80", fontWeight: 900 }}>{item.active === false ? "Inactive" : "Active"}</td>
                      <td style={tdStyle}>{item.pinned ? "📌 Yes" : "—"}</td>
                      <td style={tdStyle}>{item.sort_order ?? 0}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{item.category || "NEWS"}</td>
                      <td style={tdStyle}>{item.message}</td>
                      <td style={tdStyle}>{item.page || "standings"}</td>
                      <td style={tdStyle}>{item.expires_at ? new Date(item.expires_at).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => editTickerMessage(item)} style={secondaryButtonStyle}>Edit</button>
                          <button type="button" onClick={() => toggleTickerActive(item)} style={secondaryButtonStyle}>{item.active === false ? "Activate" : "Disable"}</button>
                          <button type="button" onClick={() => toggleTickerPinned(item)} style={secondaryButtonStyle}>{item.pinned ? "Unpin" : "Pin"}</button>
                          <button type="button" onClick={() => deleteTickerMessage(item.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discord Settings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Discord Hub Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Invite Link</div>
              <input style={inputStyle} value={discordInviteUrl} onChange={(e) => setDiscordInviteUrl(e.target.value)} placeholder="https://discord.gg/your-link" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Page Announcement</div>
              <input style={inputStyle} value={discordAnnouncement} onChange={(e) => setDiscordAnnouncement(e.target.value)} placeholder="Join the league Discord..." />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Rules / Conduct Notes</div>
            <textarea
              style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.45 }}
              value={discordRulesText}
              onChange={(e) => setDiscordRulesText(e.target.value)}
              placeholder="One rule per line"
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveDiscordSettings} style={primaryButtonStyle}>Save Discord Settings</button>
            <button onClick={() => (window.location.pathname = "/discord")} style={secondaryButtonStyle}>View Discord Page</button>
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
        {/* Owner Access Code Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>💼 Owner Portal Access</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Admin sees all owner codes here. Owners use these codes on /team-hq and only unlock their own team view.</div>
            </div>
            <button onClick={generateAllOwnerCodes} style={primaryButtonStyle}>Generate Codes for All Teams</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Owner Code</th>
                  <th style={thStyle}>Drivers</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ownerPortalTeams.map((team) => {
                  const teamDrivers = visibleDrivers.filter((driver) => driver.team === team);
                  const code = ownerAccessCodes[team] || "";
                  return (
                    <tr key={team}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(team)}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 900, color: code ? "#d4af37" : "#f87171" }}>{code || "Not generated"}</td>
                      <td style={tdStyle}>{teamDrivers.map((driver) => `#${driver.number} ${driver.name}`).join(", ") || "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => generateOwnerCode(team)} style={secondaryButtonStyle}>{code ? "Regenerate" : "Generate"}</button>
                          <button onClick={() => copyOwnerCode(team)} disabled={!code} style={{ ...secondaryButtonStyle, opacity: code ? 1 : 0.45 }}>Copy</button>
                          <button onClick={() => clearOwnerCode(team)} disabled={!code} style={{ ...dangerButtonStyle, opacity: code ? 1 : 0.45 }}>Clear</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* Driver Access Code Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🔐 Driver Contract Access</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Generate driver passwords here. Drivers use these codes on their driver profile to unlock contract offers.</div>
            </div>
            <button onClick={loadDriverAccessCodes} style={secondaryButtonStyle}>Refresh Driver Codes</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Driver Code</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDrivers.map((driver) => {
                  const codeRow = driverAccessCodes.find((row) => String(row.driver_number) === String(driver.number) && row.active !== false);
                  const code = codeRow?.code || "";
                  return (
                    <tr key={driver.id}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team)} <span style={{ fontSize: 11, opacity: 0.55 }}>({driver.team})</span></td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 900, color: code ? "#d4af37" : "#f87171" }}>{code || "Not generated"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => generateDriverAccessCode(driver)} style={secondaryButtonStyle}>{code ? "Regenerate" : "Generate"}</button>
                          <button onClick={() => copyDriverAccessCode(driver, code)} disabled={!code} style={{ ...secondaryButtonStyle, opacity: code ? 1 : 0.45 }}>Copy</button>
                          <button onClick={() => clearDriverAccessCode(driver)} disabled={!code} style={{ ...dangerButtonStyle, opacity: code ? 1 : 0.45 }}>Clear</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <PreviousRaceWinnerAdminPanel drivers={visibleDrivers} raceHistory={raceHistory} />


        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🎨 Paint Scheme Payouts</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                Preview vote rankings, then award tiered payouts. Voting/payout eligibility closes Friday at 12:00 AM ET. Uploads not updated by then are excluded. Team payouts are capped at {money(PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP)} per team per week and {money(PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP)} per team per season. Payout tiers now start at {money(20000)} to the team and {money(5000)} to the driver for P1.
              </div>
            </div>
            <button onClick={() => loadPaintSchemePayoutPreview()} disabled={paintPayoutLoading} style={secondaryButtonStyle}>{paintPayoutLoading ? "Loading..." : "Preview Rankings"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Race / Vote Week</div>
              <select style={inputStyle} value={paintPayoutRace} onChange={(event) => setPaintPayoutRace(event.target.value)}>
                <option value="">Auto-select previous completed race</option>
                {(tracks || []).map((track) => <option key={track.name} value={track.name}>{track.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
              <button onClick={awardPaintSchemePayouts} disabled={!paintPayoutRows.length} style={{ ...primaryButtonStyle, opacity: paintPayoutRows.length ? 1 : 0.55 }}>Award Paint Scheme Payouts</button>
            </div>
          </div>
          {paintPayoutStatus && <div style={{ color: "#4ade80", fontWeight: 900, marginBottom: 10 }}>{paintPayoutStatus}</div>}
          {paintPayoutError && <div style={{ color: "#f87171", fontWeight: 900, marginBottom: 10 }}>{paintPayoutError}</div>}
          {paintPayoutRows.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Votes</th>
                    <th style={thStyle}>Updated By Deadline</th>
                    <th style={thStyle}>Team Payout</th>
                    <th style={thStyle}>Driver Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {paintPayoutRows.map((row) => (
                    <tr key={`${row.rank}-${row.uploadId}`}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>P{row.rank}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{row.driverNumber} {row.driverName}</td>
                      <td style={tdStyle}>{getTeamFullName(row.team)}</td>
                      <td style={tdStyle}>{row.votes}</td>
                      <td style={tdStyle}>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}</td>
                      <td style={{ ...tdStyle, color: "#4ade80", fontWeight: 900 }}>{money(row.teamPayout)}{row.teamWeeklyCapApplied ? <div style={{ color: "#fbbf24", fontSize: 11 }}>Weekly team cap applied</div> : null}{row.teamSeasonCapApplied ? <div style={{ color: "#fbbf24", fontSize: 11 }}>Season team cap applied</div> : null}</td>
                      <td style={{ ...tdStyle, color: "#d4af37", fontWeight: 900 }}>{money(row.driverPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ones to Watch Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🔥 Ones to Watch Manager</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Manual picks override the automatic /standings watch list. Turn all manual picks off to return to auto mode.</div>
            </div>
            <button onClick={loadManualWatchPicks} style={secondaryButtonStyle}>Refresh Picks</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Driver</div>
              <select style={inputStyle} value={watchDriverId} onChange={(e) => setWatchDriverId(e.target.value)}>
                <option value="">Select driver...</option>
                {visibleDrivers.map((d) => <option key={d.id} value={d.id}>#{d.number} {d.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Badge</div>
              <select style={inputStyle} value={watchBadge} onChange={(e) => setWatchBadge(e.target.value)}>
                <option value="DIRECTOR PICK">DIRECTOR PICK</option>
                <option value="HOT SEAT">HOT SEAT</option>
                <option value="MOMENTUM">MOMENTUM</option>
                <option value="UNDERDOG">UNDERDOG</option>
                <option value="REBOUND WATCH">REBOUND WATCH</option>
                <option value="TITLE THREAT">TITLE THREAT</option>
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Display Order</div>
              <input style={inputStyle} type="number" min="1" value={watchDisplayOrder} onChange={(e) => setWatchDisplayOrder(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>Reason / Storyline</div>
            <input style={inputStyle} value={watchReason} onChange={(e) => setWatchReason(e.target.value)} placeholder="Example: Coming off a podium and showing long-run speed" />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={addManualWatchPick} disabled={watchSaving} style={{ ...primaryButtonStyle, opacity: watchSaving ? 0.6 : 1 }}>{watchSaving ? "Saving..." : "Add to Ones to Watch"}</button>
            <button onClick={() => { setWatchDriverId(""); setWatchReason(""); setWatchBadge("DIRECTOR PICK"); setWatchDisplayOrder("1"); }} style={secondaryButtonStyle}>Clear Form</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Status</th><th style={thStyle}>Order</th><th style={thStyle}>Driver</th><th style={thStyle}>Badge</th><th style={thStyle}>Reason</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {manualWatchPicks.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, opacity: 0.7 }}>No manual picks yet. /standings will use the automatic watch list.</td></tr>
                ) : manualWatchPicks.map((pick) => {
                  const driver = drivers.find((d) => Number(d.id) === Number(pick.driver_id));
                  return (
                    <tr key={pick.id}>
                      <td style={{ ...tdStyle, color: pick.active ? "#4ade80" : "#f59e0b", fontWeight: 900 }}>{pick.active ? "ACTIVE" : "OFF"}</td>
                      <td style={tdStyle}>{pick.display_order || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{driver ? `#${driver.number} ${driver.name}` : `Driver ID ${pick.driver_id}`}</td>
                      <td style={tdStyle}>{pick.badge || "DIRECTOR PICK"}</td>
                      <td style={tdStyle}>{pick.reason || "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => toggleManualWatchPick(pick)} style={secondaryButtonStyle}>{pick.active ? "Turn Off" : "Activate"}</button>
                          <button onClick={() => deleteManualWatchPick(pick.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
        {/* Driver Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Management</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Enter driver name" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={newDriverNumber} onChange={(e) => setNewDriverNumber(e.target.value)} placeholder="Enter car number" type="number" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Manufacturer</div><select style={inputStyle} value={newDriverManufacturer} onChange={(e) => setNewDriverManufacturer(e.target.value)}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={newDriverTeam} onChange={(e) => setNewDriverTeam(e.target.value)} placeholder="e.g. B2J, 19XI, BXM, MER, NLM, BWR" /></div>
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
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={editDriverForm.team} onChange={(e) => setEditDriverForm({ ...editDriverForm, team: e.target.value })} placeholder="e.g. B2J, 19XI, BXM, MER, NLM, BWR" /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}><button onClick={saveDriverEdit} style={primaryButtonStyle}>Save Changes</button><button onClick={cancelEditDriver} style={secondaryButtonStyle}>Cancel</button></div>
            </div>
          )}
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
        {/* Start & Park Requests */}
        <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Start & Park Requests</h2>
              <div style={{ opacity: 0.72, fontSize: 13 }}>
                Drivers and Team HQ can request Start & Park until Saturday 9:00 PM ET. Admin approval places approved cars at the rear by request receipt order.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={loadStartParkRequests} style={secondaryButtonStyle}>{startParkRequestsLoading ? "Loading..." : "Refresh Requests"}</button>
              <button onClick={applyApprovedStartParkRequestsToRace} style={primaryButtonStyle}>Apply Approved to Selected Race</button>
            </div>
          </div>

          {startParkRequestError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{startParkRequestError}</div>}
          {startParkRequestStatus && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{startParkRequestStatus}</div>}

          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ ...tableStyle, minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Race</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Requested By</th>
                  <th style={thStyle}>Received</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).map((request, index) => {
                  const status = String(request.status || "pending").toLowerCase();
                  return (
                    <tr key={request.id || `${request.driver_number}-${request.created_at}`}>
                      <td style={tdStyle}>#{index + 1}</td>
                      <td style={tdStyle}>{request.race_name || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{request.driver_number} {request.driver_name}</td>
                      <td style={tdStyle}>{getTeamFullName(request.team || request.requested_by_team || "")}</td>
                      <td style={tdStyle}>{request.requested_by_type || "—"} · {request.requested_by_name || request.requested_by_team || "—"}</td>
                      <td style={tdStyle}>{request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>{request.reason || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: status === "approved" ? "#4ade80" : status === "declined" ? "#f87171" : status === "applied" ? "#d4af37" : "white" }}>{status.toUpperCase()}</td>
                      <td style={tdStyle}>
                        {status === "pending" ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => updateStartParkRequestStatus(request, "approved")} style={{ ...primaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Approve</button>
                            <button onClick={() => updateStartParkRequestStatus(request, "declined")} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Decline</button>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).length && (
                  <tr><td style={tdStyle} colSpan={9}>No Start & Park requests for the selected race.</td></tr>
                )}
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
            <table style={{ ...tableStyle, minWidth: 1550 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 72 }}>#</th><th style={{ ...thStyle, minWidth: 190 }}>Driver</th><th style={{ ...thStyle, minWidth: 170 }}>Team</th>
                  <th style={raceEntryThStyle}>Finish</th>
                  {stageCount >= 1 && <th style={raceEntryThStyle}>Stage 1</th>}
                  {stageCount >= 2 && <th style={raceEntryThStyle}>Stage 2</th>}
                  {stageCount === 3 && <th style={raceEntryThStyle}>Stage 3</th>}
                  <th style={{ ...thStyle, minWidth: 90 }}>DNF</th><th style={{ ...thStyle, minWidth: 120 }}>Start & Park</th><th style={{ ...thStyle, minWidth: 110 }}>Fastest Lap</th>
                  <th style={{ ...thStyle, minWidth: 110 }}>Offense</th><th style={{ ...thStyle, minWidth: 145 }}>Manual Penalty</th><th style={{ ...thStyle, minWidth: 120 }}>Points Preview</th><th style={{ ...thStyle, minWidth: 280 }}>Notes</th><th style={{ ...thStyle, minWidth: 90 }}>Move</th><th style={{ ...thStyle, minWidth: 120 }}>Offense #</th>
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
                      <td style={raceEntryTdStyle}><input type="number" min="1" max="40" style={racePositionInputStyle} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} /></td>
                      {stageCount >= 1 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} /></td>}
                      {stageCount >= 2 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} /></td>}
                      {stageCount === 3 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} /></td>}
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
                      <td style={tdStyle}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={!!startParkMap[driver.id]} onChange={(e) => handleStartParkChange(driver.id, e.target.checked)} />Start & Park
                        </label>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 5 }}>Finish points only; stage points zeroed.</div>
                      </td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="radio" name="fastestLap" checked={!!fastestLapMap[driver.id]} onChange={() => handleFastestLapChange(driver.id)} />FL +1</label></td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={!!offenseMap[driver.id]} onChange={(e) => handleOffenseChange(driver.id, e.target.checked)} />Offense</label></td>
                      <td style={tdStyle}><input type="number" min="0" style={racePenaltyInputStyle} value={penaltyMap[driver.id] || ""} onChange={(e) => handleManualPenaltyChange(driver.id, e.target.value)} placeholder="0" /></td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: "#d4af37" }}>{(() => { const fp = positions[driver.id] ? pointsTable[(Number(positions[driver.id]) || 1) - 1] || 0 : 0; const sp = startParkMap[driver.id] ? 0 : getStagePoints(stage1[driver.id]) + getStagePoints(stage2[driver.id]) + (stageCount === 3 ? getStagePoints(stage3[driver.id]) : 0); const fl = fastestLapMap[driver.id] ? 1 : 0; const op = thisOffense ? getOffensePenaltyPoints(thisOffense) : 0; const mp = Number(penaltyMap[driver.id] || 0); return fp + sp + fl - op - mp; })()}</td>
                      <td style={tdStyle}><input style={raceNotesInputStyle} value={resultNotesMap[driver.id] || ""} onChange={(e) => handleResultNoteChange(driver.id, e.target.value)} placeholder="Penalty note, ruling, etc." /></td>
                      <td style={tdStyle}><div style={{ display: "flex", gap: 6 }}><button type="button" onClick={() => moveDriverFinishPosition(driver.id, -1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↑</button><button type="button" onClick={() => moveDriverFinishPosition(driver.id, 1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↓</button></div></td>
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
            <button onClick={saveResultsDraft} style={secondaryButtonStyle}>Save Admin-Only Draft</button>
            <button onClick={() => submitResults()} style={primaryButtonStyle}>{editingRaceName ? "Update Posted Race" : "Post to Standings"}</button>
            {editingRaceName && <button onClick={clearInputs} style={secondaryButtonStyle}>Cancel Edit</button>}
            <button onClick={clearInputs} style={secondaryButtonStyle}>Clear Inputs</button>
            <button onClick={resetSeason} style={dangerButtonStyle}>Archive + Reset Active Season</button>
          </div>
        </div>
        {/* Admin-Only Results Drafts */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Admin-Only Results Drafts</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Drafts let you capture finishing points, penalties, DNFs, and notes without changing public standings. Post only when race control is ready.</div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Saved</th><th style={thStyle}>Leader</th><th style={thStyle}>Rows</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {(raceDrafts || []).length === 0 ? (
                  <tr><td style={tdStyle} colSpan={5}><div style={{ opacity: 0.7 }}>No private drafts saved.</div></td></tr>
                ) : (raceDrafts || []).map((draft) => {
                  const leader = (draft.results || []).find((result) => result.finishPos === 1) || (draft.results || [])[0];
                  return (
                    <tr key={draft.id || draft.raceName}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{draft.raceName}</td>
                      <td style={tdStyle}>{draft.draftSavedAt ? new Date(draft.draftSavedAt).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>{leader ? `#${leader.number} ${leader.name} (${leader.totalRacePoints} pts)` : "—"}</td>
                      <td style={tdStyle}>{(draft.results || []).length}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => loadResultsDraft(draft)} style={secondaryButtonStyle}>Load/Edit</button>
                          <button type="button" onClick={() => postResultsDraft(draft)} style={primaryButtonStyle}>Post to Standings</button>
                          <button type="button" onClick={() => deleteResultsDraft(draft.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Race History</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => downloadRaceHistoryCsv(raceHistory, activeSeason?.name || "Season")}
                style={primaryButtonStyle}
              >
                ⬇️ Download Race History CSV
              </button>
              <button
                type="button"
                onClick={handleDownloadLeagueBackup}
                style={secondaryButtonStyle}
              >
                💾 Backup Results
              </button>
              <button
                type="button"
                onClick={() => backupFileInputRef.current?.click()}
                style={secondaryButtonStyle}
              >
                ♻️ Restore From Backup
              </button>
              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json"
                onChange={handleRestoreLeagueBackup}
                style={{ display: "none" }}
              />
            </div>
          </div>
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
                            <th style={thStyle}>FL</th><th style={thStyle}>DNF</th><th style={thStyle}>Start & Park</th>
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
                              <td style={tdStyle}>{r.startPark ? "Yes" : "—"}</td>
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

