import React, { useEffect, useMemo, useState } from "react";
import { getLeagueSession } from "./lib/leagueAuth";
import logo from "./assets/logo1.png";
import teamLogoB2J from "./assets/teams/B2J.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import teamLogoBWR from "./assets/teams/BWR.png";
import teamLogoBXM from "./assets/teams/BXM.png";
import { supabase } from "./lib/supabase";


const DEFAULT_START_PARK_RACES = [
  { name: "Daytona (Night)", date: "2026-05-16" },
  { name: "Charlotte", date: "2026-05-23" },
  { name: "Nashville", date: "2026-05-30" },
  { name: "Michigan", date: "2026-06-06" },
  { name: "Pocono", date: "2026-06-13" },
  { name: "Bristol (Night)", date: "2026-06-20" },
  { name: "Las Vegas", date: "2026-06-27" },
  { name: "Talladega", date: "2026-07-11" },
  { name: "North Wilkesboro", date: "2026-07-18" },
  { name: "Indianapolis", date: "2026-07-25" },
  { name: "New Hampshire", date: "2026-08-01" },
  { name: "Phoenix", date: "2026-08-08" },
  { name: "Richmond", date: "2026-08-15" },
  { name: "Kansas", date: "2026-08-22" },
  { name: "Texas", date: "2026-08-29" },
  { name: "Iowa", date: "2026-09-05" },
  { name: "Homestead", date: "2026-09-12" },
];

const DEVELOPMENT_SERIES_OPTIONS = [
  { value: "xfinity", label: "Xfinity Series" },
  { value: "truck", label: "Truck Series" },
  { value: "arca", label: "ARCA Series" },
];

const DEFAULT_SUBSTITUTE_DRIVERS = [
  {
    id: 103,
    number: null,
    name: "BusterTC007",
    manufacturer: null,
    team: "IND",
    series: "substitute",
    isSubstitute: true,
    driver_type: "substitute",
    status: "active",
  },
];

const DEFAULT_DEVELOPMENT_ASSIGNMENT_FORM = {
  driver_id: "",
  requested_series: "truck",
  race_name: "",
  request_note: "",
};

function getDevelopmentSeriesLabel(value) {
  const match = DEVELOPMENT_SERIES_OPTIONS.find((series) => series.value === String(value || "").toLowerCase());
  return match?.label || value || "Development Series";
}

function normalizeDevelopmentStatus(row) {
  const finalStatus = String(row?.final_status || "pending").toLowerCase();
  if (finalStatus === "approved") return { label: "Approved", color: "#4ade80" };
  if (finalStatus === "denied" || finalStatus === "cancelled") return { label: finalStatus === "cancelled" ? "Cancelled" : "Denied", color: "#f87171" };
  if (row?.requires_board_approval || String(row?.board_status || "").toLowerCase() === "pending") return { label: "Board Review", color: "#facc15" };
  if (String(row?.owner_status || "pending").toLowerCase() === "pending") return { label: "Owner Review", color: "#f59e0b" };
  return { label: "Pending", color: "#f59e0b" };
}



function getOwnerAssignmentStatusMeta(status) {
  const value = String(status || "pending").toLowerCase();
  if (["approved", "approved_pending_driver", "driver_accepted"].includes(value)) return { label: "Approved", color: "#4ade80", border: "#166534", background: "#102a16" };
  if (value === "driver_declined") return { label: "Declined / Cancelled", color: "#f87171", border: "#7f1d1d", background: "#2a1010" };
  if (value === "denied" || value === "rejected") return { label: "Denied", color: "#f87171", border: "#7f1d1d", background: "#2a1010" };
  if (value === "completed") return { label: "Completed", color: "#93c5fd", border: "#1d4ed8", background: "#0f1f3d" };
  if (value === "cancelled") return { label: "Cancelled", color: "#cbd5e1", border: "#475569", background: "#111827" };
  return { label: "Pending Admin", color: "#f59e0b", border: "#92400e", background: "#291b08" };
}

function getOwnerAssignmentTypeLabel(value) {
  const key = String(value || "substitute").toLowerCase();
  if (key === "development_call_up") return "Development Call-Up";
  if (key === "emergency_replacement") return "Emergency Replacement";
  if (key === "one_off_start") return "One-Off Start";
  if (key === "start_park") return "Start & Park";
  return "Substitute";
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

const teamLogos = {
  B2J: teamLogoB2J,
  MER: teamLogoMER,
  NLM: teamLogoNLM,
  MMS: teamLogoMMS,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  BWR: teamLogoBWR,
  BXM: teamLogoBXM,
  "BayouX Motorsports": teamLogoBXM,
};

const teamFullNames = {
  B2J: "B2J Motorsports",
    MER: "ME Racing",
    MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
    BWR: "Big Wheel Racing",
  IND: "Independent",
  Independent: "Independent",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
  BXM: "BayouX Motorsports",
  "BayouX Motorsports": "BayouX Motorsports",
};

const ownerNames = {
  B2J: "RookieVet",
    MMS: "Mayhem Motorsports Ownership Group",
  NLM: "Highlander",
  BWR: "JPC Racing",
    "19XI": "Bowhunter",
  "19XI Racing": "Bowhunter",
  Independent: "Free Agent Pool",
  IND: "Free Agent Pool",
  BXM: "Cajun",
  "BayouX Motorsports": "Cajun",
  MER: "Kevdinho",
  TMS: "Y2JTolbert",
  "Tolbert Motorsports": "Y2JTolbert",
};

const TEAM_STARTING_FUNDS = {
  1: 300000,
  2: 700000,
  3: 1000000,
  4: 1500000,
};

const TEAM_BUDGET_OVERRIDES = {
  B2J: 5000000,
  BMX: 700000,
  BXM: 700000,
  "BayouX Motorsports": 700000,
};

const TECHNICAL_ALLIANCE_COST = 50000;
const NUMBER_PURCHASE_PRICE = 5000;

function getTeamStartingBudget(driverCount, teamName = "") {
  if (TEAM_BUDGET_OVERRIDES[teamName]) {
    return TEAM_BUDGET_OVERRIDES[teamName];
  }

  if (driverCount <= 0) return 0;
  return TEAM_STARTING_FUNDS[driverCount] || TEAM_STARTING_FUNDS[4];
}

function sameTeamName(value, team) {
  const full = getTeamFullName(team);
  return String(value || "").trim().toLowerCase() === String(team || "").trim().toLowerCase()
    || String(value || "").trim().toLowerCase() === String(full || "").trim().toLowerCase();
}

const appShellStyle = { minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1180, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 12, letterSpacing: 0.4 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 13 };
const checkboxLabelStyle = { display: "flex", gap: 8, alignItems: "center", background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 800 };
const MIN_DRIVER_SALARY = 250000;
const MIN_CONTRACT_LENGTH = 1;
const OWNER_MINIMUM_SALARY = 500000;
const DEFAULT_CONTRACT_FORM = {
  driver_name: "",
  driver_number: "",
  manufacturer: "",
  salary: 250000,
  signing_bonus: 0,
  contract_length: 1,
  buyout_amount: 375000,
  brand_style: "Balanced",
  media_requirements: "",
  notes: "",
  expires_at: "",
  no_trade_clause: false,
  team_option: false,
  mutual_option: false,
  guaranteed_seat: false,
  championship_bonus: 0,
  win_bonus: 0,
};

const MASTER_ACCESS_CODE = "BCLADMINPASSWORD2026";

const OWNER_DRIVER_KEYS = {
  B2J: ["99", "RookieVet99", "rookievet99", "rookievet"],
  NLM: ["6", "Highlander713", "highlander713", "highlander"],
    BWR: ["97", "JPC_Racing", "jpc_racing", "jpc racing", "jpc"],
  "19XI": ["18", "bowhunter6758", "Bowhunter6758", "bowhunter"],
  "19XI Racing": ["18", "bowhunter6758", "Bowhunter6758", "bowhunter"],
  BMX: ["48", "CaJunThrottle28", "cajunthrottle28", "cajun"],
  BXM: ["48", "CaJunThrottle28", "cajunthrottle28", "cajun"],
  "BayouX Motorsports": ["48", "CaJunThrottle28", "cajunthrottle28", "cajun"],
  MER: ["24", "KEVDINHO7", "kevdinho7", "kevdinho"],
  KDM: ["24", "KEVDINHO7", "kevdinho7", "kevdinho"],
};


const OWNER_DRIVER_FALLBACK_CODES = {
  B2J: "ROOKIEVET9-ZG9GSY",
  NLM: "HIGHLANDER-TZDMLY",
    BWR: "JPCRACING-BWOHKI",
  "19XI": "BOWHUNTER6-7Y1FGM",
  "19XI Racing": "BOWHUNTER6-7Y1FGM",
  BXM: "CAJUNTHROT-VAKNYX",
  "BayouX Motorsports": "CAJUNTHROT-VAKNYX",
  MER: "KEVDINHO7-ZSDV6Y",
};


const DEFAULT_INDEPENDENT_PAYMENT_FORM = {
  driver_id: "",
  amount: 0,
  reason: "",
};


function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function clampScore(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function getManufacturerSatisfactionStatus(score) {
  if (score >= 90) return { label: "Elite Partner", color: "#4ade80", note: "Factory is all-in and willing to provide premium support." };
  if (score >= 80) return { label: "Strong", color: "#22c55e", note: "Manufacturer support is strong and expectations are high." };
  if (score >= 60) return { label: "Stable", color: "#d4af37", note: "Relationship is healthy, but results still matter." };
  if (score >= 40) return { label: "Concerned", color: "#f59e0b", note: "Factory pressure is building. Better weekends are needed." };
  return { label: "Critical", color: "#f87171", note: "Support is at risk without quick improvement." };
}

function getManufacturerSupportTier(score) {
  if (score >= 90) return "Tier 1 Factory Support";
  if (score >= 80) return "Priority Support";
  if (score >= 60) return "Standard Support";
  if (score >= 40) return "Reduced Support Watch";
  return "At-Risk Support";
}

function getManufacturerSupportAdjustment(score) {
  if (score >= 90) return 500000;
  if (score >= 80) return 250000;
  if (score >= 60) return 0;
  if (score >= 40) return -100000;
  return -250000;
}

function loadLocalOwnerAccessCodes() {
  try {
    const saved = localStorage.getItem("ownerPortalAccessCodes");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function loadIndependentDriverPayments() {
  try {
    const saved = localStorage.getItem("bclIndependentDriverPayments");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveIndependentDriverPayments(payments) {
  localStorage.setItem("bclIndependentDriverPayments", JSON.stringify(payments || []));
}


function loadLocalDriverFeedback() {
  try {
    const saved = localStorage.getItem("bclDriverFeedbackRatings");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function averageNumbers(values = []) {
  const clean = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (!clean.length) return null;
  return Math.round((clean.reduce((sum, value) => sum + value, 0) / clean.length) * 10) / 10;
}

function feedbackScoreToMorale(score) {
  if (score === null || score === undefined) return null;
  return Math.round(Math.max(0, Math.min(10, Number(score))) * 10);
}

async function loadRemoteOwnerAccessCodes() {
  const { data, error } = await supabase
    .from("owner_access_codes")
    .select("team, code, active")
    .eq("active", true);
  if (error) {
    console.error("Failed to load owner access codes:", error);
    return loadLocalOwnerAccessCodes();
  }
  const nextCodes = {};
  (data || []).forEach((row) => { if (row.team && row.code) nextCodes[row.team] = row.code; });
  localStorage.setItem("ownerPortalAccessCodes", JSON.stringify(nextCodes));
  return nextCodes;
}


async function loadTeamOwnerAssignments() {
  const { data, error } = await supabase
    .from("team_owner_assignments")
    .select("*");

  if (error) {
    console.error("Failed to load team owner assignments:", error);
    return [];
  }

  return data || [];
}

function getAssignedOwnerForTeam(team, assignments = []) {
  const normalizedTeam = String(team || "").trim().toLowerCase();
  const normalizedFullName = String(getTeamFullName(team) || "").trim().toLowerCase();

  return (assignments || []).find((assignment) => {
    const assignmentTeam = String(assignment.team || "").trim().toLowerCase();
    return assignmentTeam === normalizedTeam || assignmentTeam === normalizedFullName;
  }) || null;
}

async function loadRemoteOwnerDriverAccessCodes() {
  const localCodes = (() => {
    try {
      return JSON.parse(localStorage.getItem("driverProfileAccessCodes") || "{}");
    } catch {
      return {};
    }
  })();

  async function fetchCodes(selectColumns) {
    const { data, error } = await supabase
      .from("driver_access_codes")
      .select(selectColumns)
      .eq("active", true);

    if (error) {
      console.error(`Failed to load driver access codes for owner portal with ${selectColumns}:`, error);
      return null;
    }

    return data || [];
  }

  // Your current Supabase export shows driver_access_codes has: driver_number, driver_name, code, active.
  // Do NOT require temp_code here, because selecting a missing column causes Supabase to fail the whole query.
  let rows = await fetchCodes("driver_number, driver_name, code, active");

  // Optional fallback for a future schema if you later rename code to access_code.
  if (!rows) {
    rows = await fetchCodes("driver_number, driver_name, access_code, active");
  }

  if (!rows) {
    return localCodes;
  }

  const nextCodes = { ...localCodes };

  rows.forEach((row) => {
    const code = row.code || row.access_code;
    if (!code) return;

    if (row.driver_number) {
      nextCodes[String(row.driver_number).trim()] = code;
      nextCodes[String(row.driver_number).trim().toLowerCase()] = code;
    }

    if (row.driver_name) {
      nextCodes[String(row.driver_name).trim()] = code;
      nextCodes[String(row.driver_name).trim().toLowerCase()] = code;
    }
  });

  localStorage.setItem("driverProfileAccessCodes", JSON.stringify(nextCodes));
  return nextCodes;
}


function normalizeAccessCode(value) {
  return String(value || "").trim().toUpperCase();
}

function getOwnerDriverCodesForTeam(team, driverCodes = {}) {
  const keys = OWNER_DRIVER_KEYS[team] || OWNER_DRIVER_KEYS[getTeamFullName(team)] || [];
  const normalizedKeys = keys.map((key) => String(key || "").trim().toLowerCase());
  const codes = [];

  normalizedKeys.forEach((key) => {
    const direct = driverCodes[key] || driverCodes[key.toUpperCase()] || driverCodes[key.replace(/\s+/g, "_")];
    if (direct) codes.push(direct);
  });

  Object.entries(driverCodes || {}).forEach(([rawKey, code]) => {
    const key = String(rawKey || "").trim().toLowerCase();
    if (!code) return;

    const matchesOwnerKey = normalizedKeys.some((ownerKey) => {
      if (!ownerKey) return false;
      return key === ownerKey || key.includes(ownerKey) || ownerKey.includes(key);
    });

    if (matchesOwnerKey) codes.push(code);
  });

  return Array.from(new Set(codes.map(normalizeAccessCode).filter(Boolean)));
}


function getTeamFullName(team) {
  return teamFullNames[team] || team || "Team";
}

function getFinishPay(finishPos, raceName = "") {
  const finish = Number(finishPos);
  const track = String(raceName || "").toLowerCase();

  if (finish === 1) {
    if (track.includes("daytona")) return 750000;
    if (track.includes("charlotte")) return 500000;
    return 250000;
  }

  if (finish >= 2 && finish <= 3) return 50000;
  if (finish >= 4 && finish <= 5) return 20000;
  if (finish >= 6 && finish <= 10) return 10000;
  if (finish > 10) return 5000;
  return 0;
}

function buildTeamFinancialRow(team, drivers, teams, raceHistory, technicalAlliances = [], independentDriverPayments = []) {
  const teamDrivers = drivers.filter((driver) => (driver.team || "Independent") === team);
  const teamStanding = teams.find((standing) => standing.team === team) || {};
  let raceIncome = 0;
  let dnfCosts = 0;
  let penaltyCosts = 0;
  let starts = 0;
  const raceRows = [];

  raceHistory.forEach((race) => {
    (race.results || []).forEach((result) => {
      const driver = teamDrivers.find((item) => item.id === result.driverId);
      if (!driver) return;
      const payout = getFinishPay(result.finishPos, race.raceName);
      const dnfCost = result.dnf ? 100000 : 0;
      const penaltyCost = result.offense || Number(result.penaltyPoints) > 0 ? 25000 : 0;
      starts += 1;
      raceIncome += payout;
      dnfCosts += dnfCost;
      penaltyCosts += penaltyCost;
      raceRows.push({
        raceName: race.raceName,
        driver,
        finishPos: result.finishPos,
        payout,
        dnfCost,
        penaltyCost,
        net: payout - dnfCost - penaltyCost,
      });
    });
  });

  const acceptedAllianceCount = (technicalAlliances || []).filter((alliance) => {
    if (alliance.status !== "Accepted") return false;
    return sameTeamName(alliance.team, team) || sameTeamName(alliance.alliance_team, team);
  }).length;
  const allianceCosts = acceptedAllianceCount * TECHNICAL_ALLIANCE_COST;
  const independentPayouts = (independentDriverPayments || [])
    .filter((payment) => sameTeamName(payment.paid_by_team, team))
    .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  const startingBudget = getTeamStartingBudget(teamDrivers.length, team);
  const totalCosts = dnfCosts + penaltyCosts + allianceCosts + independentPayouts;
  const netRevenue = raceIncome - totalCosts;
  const projectedBudget = startingBudget + netRevenue;

  return {
    team,
    owner: ownerNames[team] || `${getTeamFullName(team)} Owner`,
    drivers: teamDrivers,
    points: teamStanding.points || 0,
    wins: teamStanding.wins || 0,
    top3: teamStanding.top3 || 0,
    top5: teamStanding.top5 || 0,
    starts,
    raceIncome,
    dnfCosts,
    penaltyCosts,
    allianceCosts,
    independentPayouts,
    totalCosts,
    startingBudget,
    netRevenue,
    projectedBudget,
    raceRows,
  };
}

export default function OwnersPage({ drivers = [], teams = [], raceHistory = [], seasonName = "", onApplyTeamTransaction = null }) {
  const availableTeams = useMemo(() => {
    const teamSet = new Set(drivers.map((driver) => driver.team || "Independent"));
    return Array.from(teamSet)
      .filter((team) => team !== "Independent" && team !== "IND")
      .sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [drivers]);

  const [selectedTeam, setSelectedTeam] = useState(() => localStorage.getItem("ownerPortalTeam") || availableTeams[0] || "B2J");
  const [accessCode, setAccessCode] = useState("");
  const [authorizedTeam, setAuthorizedTeam] = useState(() => localStorage.getItem("ownerPortalAuthorizedTeam") || "");
  const [error, setError] = useState("");
  const [ownerAccessCodes, setOwnerAccessCodes] = useState(loadLocalOwnerAccessCodes);
  const [teamFinance, setTeamFinance] = useState(null);
  const [contractOffers, setContractOffers] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [contractMessage, setContractMessage] = useState("");
  const [contractError, setContractError] = useState("");
  const [terminationBusyId, setTerminationBusyId] = useState("");
  const [contractForm, setContractForm] = useState(DEFAULT_CONTRACT_FORM);
  const [technicalAlliances, setTechnicalAlliances] = useState([]);
  const [independentDriverPayments, setIndependentDriverPayments] = useState(loadIndependentDriverPayments);
  const [independentPaymentForm, setIndependentPaymentForm] = useState(DEFAULT_INDEPENDENT_PAYMENT_FORM);
  const [independentPaymentMessage, setIndependentPaymentMessage] = useState("");
  const [independentPaymentError, setIndependentPaymentError] = useState("");
  const [alliancePartner, setAlliancePartner] = useState("");
  const [allianceMessage, setAllianceMessage] = useState("");
  const [allianceError, setAllianceError] = useState("");
  const [activeHqTab, setActiveHqTab] = useState("overview");
  const [driverFeedback, setDriverFeedback] = useState(loadLocalDriverFeedback);
  const [ownerTasks, setOwnerTasks] = useState([]);
  const [taskMessage, setTaskMessage] = useState("");
  const [taskError, setTaskError] = useState("");
  const [newTaskForm, setNewTaskForm] = useState({ title: "", description: "", reward: "", reward_value: 0, task_type: "Performance" });
  const [driverTasks, setDriverTasks] = useState([]);

  const [ownerDriverAssignments, setOwnerDriverAssignments] = useState([]);
  const [ownerDriverAssignmentMessage, setOwnerDriverAssignmentMessage] = useState("");
  const [ownerDriverAssignmentError, setOwnerDriverAssignmentError] = useState("");
  const [ownerDriverAssignmentLoading, setOwnerDriverAssignmentLoading] = useState(false);
  const [ownerDriverAssignmentForm, setOwnerDriverAssignmentForm] = useState({
    race_name: "",
    original_driver_id: "",
    assigned_driver_id: "",
    assignment_type: "substitute",
    owner_note: "",
  });
  const [driverTaskMessage, setDriverTaskMessage] = useState("");
  const [driverTaskError, setDriverTaskError] = useState("");
  const [newDriverTaskForm, setNewDriverTaskForm] = useState({ driver_number: "", title: "", description: "", reward: "", due_race: "" });
  const [teamRivalries, setTeamRivalries] = useState([]);
  const [rivalryMessage, setRivalryMessage] = useState("");
  const [rivalryError, setRivalryError] = useState("");
  const [teamMessageForm, setTeamMessageForm] = useState({
    recipient_mode: "team",
    driver_number: "",
    subject: "",
    message: "",
  });
  const [teamMessageStatus, setTeamMessageStatus] = useState("");
  const [teamMessageError, setTeamMessageError] = useState("");
  const [teamInboxMessages, setTeamInboxMessages] = useState([]);
  const [teamInboxLoading, setTeamInboxLoading] = useState(false);
  const [teamInterestRows, setTeamInterestRows] = useState([]);
  const [recruitingBoardRows, setRecruitingBoardRows] = useState([]);
  const [transferPortalEntries, setTransferPortalEntries] = useState([]);
  const [transferPortalMessage, setTransferPortalMessage] = useState("");
  const [signingBusyId, setSigningBusyId] = useState("");
  const [teamInterestMessage, setTeamInterestMessage] = useState("");
  const [teamInterestError, setTeamInterestError] = useState("");
  const [numberPool, setNumberPool] = useState([]);
  const [numberMarketMessage, setNumberMarketMessage] = useState("");
  const [numberMarketError, setNumberMarketError] = useState("");
  const [numberMarketBusy, setNumberMarketBusy] = useState("");
  const [teamTransferLogs, setTeamTransferLogs] = useState([]);
  const [teamTransferRequests, setTeamTransferRequests] = useState([]);
  const [teamTransferForm, setTeamTransferForm] = useState({
    mode: "send",
    deal_type: "general",
    to_team: "",
    amount: "",
    reason: "",
    terms: "",
    driver_id: "",
    new_number: "",
    new_manufacturer: "",
    number: "",
    assign_to_driver_id: "",
  });
  const [teamTransferMessage, setTeamTransferMessage] = useState("");
  const [teamTransferError, setTeamTransferError] = useState("");
  const [teamTransferBusy, setTeamTransferBusy] = useState(false);
  const [teamStartParkForm, setTeamStartParkForm] = useState({ driver_id: "", race_name: "", race_date: "", reason: "" });
  const [teamStartParkRequests, setTeamStartParkRequests] = useState([]);
  const [teamStartParkMessage, setTeamStartParkMessage] = useState("");
  const [teamStartParkError, setTeamStartParkError] = useState("");
  const [teamStartParkSubmitting, setTeamStartParkSubmitting] = useState(false);
  const [developmentTransactions, setDevelopmentTransactions] = useState([]);
  const [developmentStarts, setDevelopmentStarts] = useState([]);
  const [developmentForm, setDevelopmentForm] = useState(DEFAULT_DEVELOPMENT_ASSIGNMENT_FORM);
  const [developmentMessage, setDevelopmentMessage] = useState("");
  const [developmentError, setDevelopmentError] = useState("");
  const [developmentBusy, setDevelopmentBusy] = useState("");

  const [rivalryForm, setRivalryForm] = useState({
    rivalry_name: "",
    rivalry_type: "Individual Team Rivalry",
    team_a: "",
    team_b: "",
    teams_a: [],
    teams_b: [],
    manufacturer_a: "",
    manufacturer_b: "",
    storyline: "",
    rivalry_level: 50,
  });


  React.useEffect(() => {
    let isMounted = true;
    async function refreshCodes(event) {
      if (event && event.key !== "ownerPortalAccessCodes") return;
      const codes = await loadRemoteOwnerAccessCodes();
      if (isMounted) setOwnerAccessCodes(codes);
    }
    refreshCodes();
    window.addEventListener("storage", refreshCodes);
    window.addEventListener("focus", refreshCodes);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", refreshCodes);
      window.removeEventListener("focus", refreshCodes);
    };
  }, []);

  const safeSelectedTeam = availableTeams.includes(selectedTeam) ? selectedTeam : availableTeams[0] || selectedTeam;
  const selected = useMemo(() => buildTeamFinancialRow(safeSelectedTeam, drivers, teams, raceHistory, technicalAlliances, independentDriverPayments), [safeSelectedTeam, drivers, teams, raceHistory, technicalAlliances, independentDriverPayments]);
  const isAuthorized = authorizedTeam === safeSelectedTeam;

  useEffect(() => {
    if (isAuthorized || !safeSelectedTeam) return;
    const leagueSession = getLeagueSession();
    if (!leagueSession?.isOwner) return;
    const owned = (leagueSession.ownedTeams || []).map((t) => String(t).trim().toLowerCase());
    if (owned.includes(String(safeSelectedTeam).trim().toLowerCase())) {
      localStorage.setItem("ownerPortalAuthorizedTeam", safeSelectedTeam);
      setAuthorizedTeam(safeSelectedTeam);
    }
  }, [safeSelectedTeam, isAuthorized]);


  const availableDriversForOffers = useMemo(() => {
    return drivers
      .filter((driver) => !driver.retired)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [drivers]);

  const independentDriversForPayment = useMemo(() => {
    return drivers
      .filter((driver) => !driver.retired)
      .filter((driver) => {
        const team = String(driver.team || "Independent").trim().toLowerCase();
        return team === "independent" || team === "ind";
      })
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  const teamIndependentPayments = useMemo(() => {
    return (independentDriverPayments || [])
      .filter((payment) => sameTeamName(payment.paid_by_team, safeSelectedTeam))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [independentDriverPayments, safeSelectedTeam]);

  const ownerTeamName = getTeamFullName(safeSelectedTeam);
  const currentTeamBalance = Number(teamFinance?.balance ?? selected.projectedBudget ?? 0);

  const availableNumberRows = useMemo(() => {
    return (numberPool || [])
      .filter((row) => String(row.status || "available").toLowerCase() === "available")
      .sort((a, b) => Number(a.number) - Number(b.number));
  }, [numberPool]);

  const teamOwnedNumberRows = useMemo(() => {
    return (numberPool || [])
      .filter((row) => sameTeamName(row.owning_team, safeSelectedTeam) || sameTeamName(row.owning_team, ownerTeamName))
      .sort((a, b) => Number(a.number) - Number(b.number));
  }, [numberPool, safeSelectedTeam, ownerTeamName]);

  React.useEffect(() => {
    if (!isAuthorized) {
      setTeamInterestRows([]);
      setRecruitingBoardRows([]);
      return;
    }

    loadTeamInterestRows();
    loadRecruitingBoard();
    loadTransferPortalEntries();
    const interval = setInterval(() => {
      loadTeamInterestRows();
      loadRecruitingBoard();
      loadTransferPortalEntries();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized, safeSelectedTeam, ownerTeamName]);
  const pendingOfferCount = contractOffers.filter((offer) => offer.status === "Pending").length;
  const availableAlliancePartners = availableTeams.filter((team) => team !== safeSelectedTeam);
  const pendingAllianceCount = technicalAlliances.filter((alliance) => alliance.status === "Pending").length;

  const latestFeedbackByDriverNumber = useMemo(() => {
    const map = new Map();
    (driverFeedback || []).forEach((feedback) => {
      const key = String(feedback.driver_number || "").trim();
      if (!key) return;
      const current = map.get(key);
      const feedbackTime = new Date(feedback.created_at || 0).getTime();
      const currentTime = new Date(current?.created_at || 0).getTime();
      if (!current || feedbackTime >= currentTime) map.set(key, feedback);
    });
    return map;
  }, [driverFeedback]);

  const teamFeedback = useMemo(() => {
    return selected.drivers
      .map((driver) => latestFeedbackByDriverNumber.get(String(driver.number || "").trim()))
      .filter(Boolean);
  }, [selected.drivers, latestFeedbackByDriverNumber]);

  const submittedHappinessAverage = useMemo(() => averageNumbers(teamFeedback.map((feedback) => feedback.team_happiness)), [teamFeedback]);
  const submittedLeadershipAverage = useMemo(() => averageNumbers(teamFeedback.map((feedback) => feedback.leadership_confidence)), [teamFeedback]);
  const submittedCommunicationAverage = useMemo(() => averageNumbers(teamFeedback.map((feedback) => feedback.team_communication)), [teamFeedback]);

  const teamMoraleScore = useMemo(() => {
    const driverCount = selected.drivers.length || 1;
    const performanceBoost = Math.min(15, Number(selected.wins || 0) * 5 + Number(selected.top3 || 0) * 2);
    const costHit = Math.min(25, Math.round((Number(selected.dnfCosts || 0) + Number(selected.penaltyCosts || 0)) / 25000));
    const autoScore = Math.max(35, Math.min(100, 72 + performanceBoost - costHit + Math.min(8, driverCount)));
    const submittedScore = feedbackScoreToMorale(submittedHappinessAverage);
    if (submittedScore === null) return autoScore;
    return Math.round((autoScore * 0.45) + (submittedScore * 0.55));
  }, [selected.drivers.length, selected.wins, selected.top3, selected.dnfCosts, selected.penaltyCosts, submittedHappinessAverage]);

  const mediaPressureScore = useMemo(() => {
    const rivalryHeat = pendingAllianceCount * 6;
    const performanceHeat = Number(selected.wins || 0) > 0 ? 8 : 0;
    const penaltyHeat = Math.min(25, Math.round(Number(selected.penaltyCosts || 0) / 25000) * 4);
    return Math.max(10, Math.min(100, 28 + rivalryHeat + performanceHeat + penaltyHeat));
  }, [pendingAllianceCount, selected.wins, selected.penaltyCosts]);

  const franchiseValue = useMemo(() => {
    return Math.max(500000, Math.round(
      Number(selected.projectedBudget || 0) +
      Number(selected.points || 0) * 15000 +
      Number(selected.wins || 0) * 350000 +
      Number(selected.top3 || 0) * 90000 +
      selected.drivers.length * 175000 +
      activeContracts.filter((contract) => sameTeamName(contract.team || contract.created_by_team, safeSelectedTeam)).length * 125000 +
      teamMoraleScore * 5000
    ));
  }, [selected.projectedBudget, selected.points, selected.wins, selected.top3, selected.drivers.length, activeContracts, safeSelectedTeam, teamMoraleScore]);

  const ownerPowerRankings = useMemo(() => {
    return availableTeams.map((team) => {
      const row = buildTeamFinancialRow(team, drivers, teams, raceHistory, technicalAlliances, independentDriverPayments);
      const score =
        Number(row.points || 0) * 3 +
        Number(row.wins || 0) * 35 +
        Number(row.top3 || 0) * 12 +
        Math.round(Number(row.projectedBudget || 0) / 100000) +
        row.drivers.length * 8;
      return { team, score, row };
    }).sort((a, b) => b.score - a.score);
  }, [availableTeams, drivers, teams, raceHistory, technicalAlliances, independentDriverPayments]);

  const myOwnerRank = Math.max(1, ownerPowerRankings.findIndex((item) => item.team === safeSelectedTeam) + 1);

  const manufacturerContract = useMemo(() => {
    const counts = selected.drivers.reduce((acc, driver) => {
      const mfr = driver.manufacturer || "Unassigned";
      acc[mfr] = (acc[mfr] || 0) + 1;
      return acc;
    }, {});
    const manufacturer = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unassigned";
    const supportAmount = manufacturer === "Toyota" ? 750000 : manufacturer === "Chevrolet" ? 650000 : manufacturer === "Ford" ? 600000 : 250000;
    return {
      manufacturer,
      supportAmount,
      winBonus: manufacturer === "Toyota" ? 125000 : 100000,
      expectation: selected.drivers.length >= 4 ? "Win races and finish top 3 in owner standings" : "Build weekly speed and show growth",
    };
  }, [selected.drivers]);

  const manufacturerTeamMap = useMemo(() => {
    const map = { Toyota: [], Ford: [], Chevrolet: [] };
    availableTeams.forEach((team) => {
      const teamDrivers = drivers.filter((driver) => sameTeamName(driver.team, team));
      const counts = teamDrivers.reduce((acc, driver) => {
        const mfr = driver.manufacturer || "Unassigned";
        acc[mfr] = (acc[mfr] || 0) + 1;
        return acc;
      }, {});
      const mainManufacturer = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (map[mainManufacturer]) map[mainManufacturer].push(team);
    });
    return map;
  }, [availableTeams, drivers]);

  const visibleRivalries = useMemo(() => {
    const currentTeamNames = [safeSelectedTeam, ownerTeamName].map((item) => String(item || "").toLowerCase());
    const currentManufacturer = String(manufacturerContract.manufacturer || "").toLowerCase();

    return (teamRivalries || []).filter((rivalry) => {
      const rivalryType = String(rivalry.rivalry_type || rivalry.type || "Individual Team Rivalry");
      if (rivalryType === "Manufacturer Rivalry") {
        return [rivalry.manufacturer_a, rivalry.manufacturer_b].some((mfr) => String(mfr || "").toLowerCase() === currentManufacturer);
      }

      const rivalryTeams = [
        rivalry.team_a,
        rivalry.team_b,
        ...(Array.isArray(rivalry.teams_a) ? rivalry.teams_a : []),
        ...(Array.isArray(rivalry.teams_b) ? rivalry.teams_b : []),
      ].map((item) => String(item || "").toLowerCase());

      return currentTeamNames.some((team) => rivalryTeams.includes(team));
    });
  }, [teamRivalries, safeSelectedTeam, ownerTeamName, manufacturerContract.manufacturer]);

  const completedTaskCount = ownerTasks.filter((task) => task.completed).length;
  const openTaskCount = Math.max(0, ownerTasks.length - completedTaskCount);
  const taskCompletionRate = ownerTasks.length ? Math.round((completedTaskCount / ownerTasks.length) * 100) : 0;
  const openDriverTaskCount = driverTasks.filter((task) => String(task.status || "Assigned") !== "Completed").length;
  const completedDriverTaskCount = driverTasks.filter((task) => String(task.status || "") === "Completed").length;

  const cupDriverOptions = useMemo(() => {
    return (drivers || [])
      .filter((driver) => !driver.retired)
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);


  const teamOwnerDriverAssignments = useMemo(() => {
    const teamKeys = [safeSelectedTeam, ownerTeamName, getTeamFullName(safeSelectedTeam)]
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase());
    return (ownerDriverAssignments || [])
      .filter((row) => teamKeys.includes(String(row.team_key || "").trim().toLowerCase()) || teamKeys.includes(String(row.team_name || "").trim().toLowerCase()))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [ownerDriverAssignments, safeSelectedTeam, ownerTeamName]);

  const pendingOwnerDriverAssignmentCount = teamOwnerDriverAssignments.filter((row) => String(row.status || "pending").toLowerCase() === "pending").length;
  const waitingOwnerDriverAssignmentCount = 0;
  const acceptedOwnerDriverAssignmentCount = teamOwnerDriverAssignments.filter((row) => ["approved", "approved_pending_driver", "driver_accepted", "completed"].includes(String(row.status || "").toLowerCase())).length;

  const ownerAssignmentRaceOptions = DEFAULT_START_PARK_RACES;

  const selectedOwnerAssignmentOriginalDriver = useMemo(() => {
    return selected.drivers.find((driver) => String(driver.id || driver.number) === String(ownerDriverAssignmentForm.original_driver_id)) || selected.drivers[0] || null;
  }, [selected.drivers, ownerDriverAssignmentForm.original_driver_id]);

  const ownerAssignmentSubstituteOptions = useMemo(() => {
    const liveDrivers = Array.isArray(drivers) ? drivers : [];
    const mergedDrivers = [...liveDrivers];

    DEFAULT_SUBSTITUTE_DRIVERS.forEach((fallbackDriver) => {
      const alreadyLoaded = mergedDrivers.some((driver) =>
        String(driver?.id || "") === String(fallbackDriver.id) ||
        String(driver?.name || "").trim().toLowerCase() === fallbackDriver.name.toLowerCase()
      );

      if (!alreadyLoaded) mergedDrivers.push(fallbackDriver);
    });

    return mergedDrivers
      .filter((driver) => !driver?.retired)
      .filter((driver) => {
        const team = String(driver?.team || "").trim().toLowerCase();
        const role = String(driver?.driver_type || driver?.role || "").trim().toLowerCase();
        const status = String(driver?.status || "").trim().toLowerCase();
        const hasNoPermanentNumber = driver?.number === null || driver?.number === undefined || String(driver?.number).trim() === "";

        return driver?.isSubstitute === true
          || role.includes("substitute")
          || status.includes("substitute")
          || ((team === "ind" || team === "independent") && hasNoPermanentNumber);
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [drivers]);

  const developmentStartCounts = useMemo(() => {
    const counts = {};
    (developmentStarts || []).forEach((start) => {
      if (start?.counts_against_limit === false) return;
      const driverNumber = String(start.driver_number || "").trim();
      const series = String(start.series || "").toLowerCase();
      if (!driverNumber || !series) return;
      const key = `${driverNumber}-${series}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    (developmentTransactions || []).forEach((row) => {
      if (String(row.final_status || "").toLowerCase() !== "approved") return;
      if (row?.counts_against_limit === false) return;
      const driverNumber = String(row.driver_number || "").trim();
      const series = String(row.requested_series || row.current_series || "").toLowerCase();
      if (!driverNumber || !series) return;
      const key = `${driverNumber}-${series}`;
      counts[key] = Math.max(counts[key] || 0, 1);
    });
    return counts;
  }, [developmentStarts, developmentTransactions]);

  const teamDevelopmentTransactions = useMemo(() => {
    const teamKeys = [safeSelectedTeam, ownerTeamName, getTeamFullName(safeSelectedTeam)]
      .filter(Boolean)
      .map((item) => String(item).trim().toLowerCase());
    return (developmentTransactions || [])
      .filter((row) => {
        const requestedTeam = String(row.requested_team || "").trim().toLowerCase();
        const currentTeam = String(row.current_team || "").trim().toLowerCase();
        return teamKeys.includes(requestedTeam) || teamKeys.includes(currentTeam);
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [developmentTransactions, safeSelectedTeam, ownerTeamName]);

  const pendingDevelopmentRequests = useMemo(() => {
    return teamDevelopmentTransactions.filter((row) =>
      String(row.assignment_source || "driver_request") === "driver_request" &&
      String(row.owner_status || "pending").toLowerCase() === "pending" &&
      ["pending", ""].includes(String(row.final_status || "pending").toLowerCase())
    );
  }, [teamDevelopmentTransactions]);

  function getDriverDevelopmentStarts(driverNumber, series) {
    return developmentStartCounts[`${String(driverNumber || "").trim()}-${String(series || "").toLowerCase()}`] || 0;
  }

  const manufacturerSatisfaction = useMemo(() => {
    const selectedDriverIds = new Set(selected.drivers.map((driver) => String(driver.id)));
    const counts = selected.drivers.reduce((acc, driver) => {
      const mfr = driver.manufacturer || "Unassigned";
      acc[mfr] = (acc[mfr] || 0) + 1;
      return acc;
    }, {});

    const mainManufacturer = manufacturerContract.manufacturer || "Unassigned";
    const alignedDriverCount = counts[mainManufacturer] || 0;
    const totalDriverCount = selected.drivers.length || 0;
    const alignmentScore = totalDriverCount ? Math.round((alignedDriverCount / totalDriverCount) * 100) : 0;

    let stagePointTotal = 0;
    let top5Count = 0;
    let top10Count = 0;
    let dnfCount = 0;
    let penaltyCount = 0;
    let startCount = 0;

    (raceHistory || []).forEach((race) => {
      (race.results || []).forEach((result) => {
        if (!selectedDriverIds.has(String(result.driverId))) return;
        startCount += 1;
        const finish = Number(result.finishPos);
        if (finish > 0 && finish <= 5) top5Count += 1;
        if (finish > 0 && finish <= 10) top10Count += 1;
        if (result.dnf) dnfCount += 1;
        if (result.offense || Number(result.penaltyPoints || 0) > 0) penaltyCount += 1;
      });

      ["stage1", "stage2", "stage3", "stage1Results", "stage2Results", "stage3Results"].forEach((stageKey) => {
        const stageRows = Array.isArray(race[stageKey]) ? race[stageKey] : [];
        stageRows.forEach((stageResult, index) => {
          const driverId = stageResult.driverId || stageResult.id;
          if (!selectedDriverIds.has(String(driverId))) return;
          const explicitPoints = Number(stageResult.points);
          if (Number.isFinite(explicitPoints) && explicitPoints > 0) {
            stagePointTotal += explicitPoints;
          } else if (index < 10) {
            stagePointTotal += Math.max(1, 10 - index);
          }
        });
      });
    });

    const allianceBonus = (technicalAlliances || []).filter((alliance) => alliance.status === "Accepted").length * 3;
    const mediaBonus = Math.min(8, completedTaskCount + completedDriverTaskCount);
    const performanceScore =
      Number(selected.wins || 0) * 8 +
      top5Count * 3 +
      top10Count +
      Math.min(12, Math.round(stagePointTotal / 5));
    const penaltyHit = dnfCount * 7 + penaltyCount * 5;
    const moraleBonus = Math.round((teamMoraleScore - 70) / 5);
    const score = clampScore(62 + performanceScore + allianceBonus + mediaBonus + moraleBonus + Math.round((alignmentScore - 60) / 5) - penaltyHit);
    const supportAdjustment = getManufacturerSupportAdjustment(score);

    return {
      score,
      status: getManufacturerSatisfactionStatus(score),
      supportTier: getManufacturerSupportTier(score),
      supportAdjustment,
      adjustedSupportAmount: Math.max(0, Number(manufacturerContract.supportAmount || 0) + supportAdjustment),
      alignedDriverCount,
      totalDriverCount,
      alignmentScore,
      performanceScore,
      stagePointTotal,
      top5Count,
      top10Count,
      dnfCount,
      penaltyCount,
      startCount,
      allianceBonus,
      mediaBonus,
    };
  }, [selected.drivers, selected.wins, raceHistory, technicalAlliances, completedTaskCount, completedDriverTaskCount, teamMoraleScore, manufacturerContract.manufacturer, manufacturerContract.supportAmount]);

  const hqTabs = [
    ["overview", "Overview"],
    ["tasks", "Owner Tasks"],
    ["assignments", "Driver Assignments"],
    ["contracts", "Contracts"],
    ["morale", "Morale"],
    ["manufacturer", "Manufacturer"],
    ["messages", "Message Center"],
    ["startpark", "Start & Park"],
    ["transfers", "Team Transfers"],
    ["numbers", "Number Pool"],
    ["interest", "Team Interest"],
    ["recruiting", "Recruiting Board"],
    ["portal", "Transfer Portal"],
    ["development", "Development"],
    ["rivalries", "Rivalries"],
    ["media", "Media"],
    ["value", "Franchise Value"],
    ["rankings", "Power Rankings"],
  ];

  const tabButtonStyle = (tab) => ({
    ...(activeHqTab === tab ? primaryButtonStyle : secondaryButtonStyle),
    padding: "9px 12px",
    fontSize: 12,
  });

  async function loadNumberPool() {
    const { data, error } = await supabase
      .from("number_pool")
      .select("*")
      .order("number", { ascending: true });

    if (error) {
      console.error("Could not load number pool:", error);
      setNumberMarketError("Could not load number pool. Check number_pool table and RLS select policy.");
      setNumberPool([]);
      return;
    }

    setNumberMarketError("");
    setNumberPool(data || []);
  }

  async function purchaseNumber(numberRow) {
    setNumberMarketMessage("");
    setNumberMarketError("");

    if (!isAuthorized) {
      setNumberMarketError("Owner access required before purchasing a number.");
      return;
    }

    const carNumber = Number(numberRow?.number);
    if (!carNumber || carNumber < 1 || carNumber > 99) {
      setNumberMarketError("Choose a valid number from the league pool.");
      return;
    }

    const price = Number(numberRow?.purchase_price || NUMBER_PURCHASE_PRICE);
    const financeRow = await ensureTeamFinanceRow();

    if (!financeRow?.id) {
      setNumberMarketError("Could not find or create this team's finance row. Check team_finances insert/select policies.");
      return;
    }

    const financeBalance = Number(financeRow.balance || 0);

    if (financeBalance < price) {
      setNumberMarketError(`Not enough funds. #${carNumber} costs ${money(price)}.`);
      return;
    }

    const confirmed = window.confirm(`Purchase #${carNumber} for ${money(price)}? This will deduct funds from ${ownerTeamName}.`);
    if (!confirmed) return;

    setNumberMarketBusy(String(carNumber));

    const { data: freshRow, error: freshError } = await supabase
      .from("number_pool")
      .select("*")
      .eq("number", carNumber)
      .maybeSingle();

    if (freshError || !freshRow || String(freshRow.status || "").toLowerCase() !== "available") {
      console.error("Number availability check failed:", freshError);
      setNumberMarketError(`#${carNumber} is no longer available.`);
      setNumberMarketBusy("");
      await loadNumberPool();
      return;
    }

    const { error: numberError } = await supabase
      .from("number_pool")
      .update({
        status: "owned",
        owning_team: ownerTeamName,
        purchase_price: price,
        purchased_at: new Date().toISOString(),
        released_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", freshRow.id)
      .eq("status", "available");

    if (numberError) {
      console.error("Could not purchase number:", numberError);
      setNumberMarketError("Could not purchase number. Check number_pool update policy.");
      setNumberMarketBusy("");
      return;
    }

    const { error: financeError } = await supabase
      .from("team_finances")
      .update({
        balance: Number(financeRow.balance || 0) - price,
        number_pool_spent: Number(financeRow.number_pool_spent || 0) + price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", financeRow.id);

    if (financeError) {
      console.error("Number purchased but finance update failed:", financeError);
      setNumberMarketError("Number was purchased, but funds were not deducted. Check team_finances RLS and number_pool_spent column.");
      setNumberMarketBusy("");
      await loadNumberPool();
      await loadTeamFinance();
      return;
    }

    await supabase.from("number_transactions").insert([{
      number: carNumber,
      transaction_type: "purchase",
      from_team: "League Pool",
      to_team: ownerTeamName,
      amount: price,
      notes: `${ownerTeamName} purchased #${carNumber} from the league number pool.`,
      created_at: new Date().toISOString(),
    }]);

    setNumberMarketMessage(`${ownerTeamName} purchased #${carNumber} for ${money(price)}.`);
    setNumberMarketBusy("");
    await loadNumberPool();
    await loadTeamFinance();
  }

  async function releaseNumber(numberRow) {
    setNumberMarketMessage("");
    setNumberMarketError("");

    if (!isAuthorized) {
      setNumberMarketError("Owner access required before releasing a number.");
      return;
    }

    const carNumber = Number(numberRow?.number);
    if (!carNumber) return;

    if (!sameTeamName(numberRow?.owning_team, safeSelectedTeam) && !sameTeamName(numberRow?.owning_team, ownerTeamName)) {
      setNumberMarketError("You can only release numbers owned by your team.");
      return;
    }

    const confirmed = window.confirm(`Release #${carNumber} back to the league pool? No refund will be issued.`);
    if (!confirmed) return;

    setNumberMarketBusy(`release-${carNumber}`);

    const { error } = await supabase
      .from("number_pool")
      .update({
        status: "available",
        owning_team: null,
        assigned_driver_number: null,
        assigned_driver_name: null,
        released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", numberRow.id);

    if (error) {
      console.error("Could not release number:", error);
      setNumberMarketError("Could not release number. Check number_pool update policy.");
      setNumberMarketBusy("");
      return;
    }

    await supabase.from("number_transactions").insert([{
      number: carNumber,
      transaction_type: "release",
      from_team: ownerTeamName,
      to_team: "League Pool",
      amount: 0,
      notes: `${ownerTeamName} released #${carNumber} back to the league pool.`,
      created_at: new Date().toISOString(),
    }]);

    setNumberMarketMessage(`#${carNumber} released back to the league pool.`);
    setNumberMarketBusy("");
    await loadNumberPool();
  }

  async function loadTeamInterestRows() {
    if (!safeSelectedTeam) return;

    const teamKeys = Array.from(new Set([safeSelectedTeam, ownerTeamName, getTeamFullName(safeSelectedTeam)]
      .filter(Boolean)
      .map((item) => String(item))));

    const { data, error } = await supabase
      .from("team_interest")
      .select("*")
      .in("interested_team", teamKeys)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load team interest:", error);
      setTeamInterestError("Could not load team interest. Check team_interest select policy.");
      setTeamInterestRows([]);
      return;
    }

    setTeamInterestRows(data || []);
  }

  async function loadRecruitingBoard() {
    if (!safeSelectedTeam) return;

    const teamKeys = Array.from(new Set([safeSelectedTeam, ownerTeamName, getTeamFullName(safeSelectedTeam)]
      .filter(Boolean)
      .map((item) => String(item))));

    const { data, error } = await supabase
      .from("driver_recruiting_interest")
      .select("*")
      .in("interested_team", teamKeys)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load recruiting board:", error);
      setRecruitingBoardRows([]);
      return;
    }

    setRecruitingBoardRows(data || []);
  }

  async function removeFromRecruitingBoard(rowId) {
    const { error } = await supabase.from("driver_recruiting_interest").delete().eq("id", rowId);
    if (error) {
      console.error("Could not remove from recruiting board:", error);
      alert("Failed to remove driver from recruiting board.");
      return;
    }
    setRecruitingBoardRows((current) => current.filter((row) => row.id !== rowId));
  }

  async function loadTransferPortalEntries() {
    const { data, error } = await supabase
      .from("driver_portal_entries")
      .select("*")
      .eq("status", "open")
      .order("entered_at", { ascending: false });

    if (error) {
      console.error("Could not load transfer portal entries:", error);
      setTransferPortalEntries([]);
      return;
    }
    setTransferPortalEntries(data || []);
  }

  async function signPortalDriver(entry) {
    setTransferPortalMessage("");
    const driverContract = (activeContracts || []).find((c) => String(c.driver_number) === String(entry.driver_number));
    const cost = driverContract ? calculateContractTerminationCost(driverContract) : { remainingSalary: 0, buyout: 0, total: 0 };

    const confirmed = window.confirm(
      `Sign #${entry.driver_number} ${entry.driver_name} to ${getTeamFullName(safeSelectedTeam)}?\n\n` +
      (driverContract
        ? `Buyout owed to ${getTeamFullName(entry.current_team)}: ${money(cost.buyout)}\nThis will be deducted from your team funds and paid directly to their current team.`
        : `This driver has no active contract on file — signing is free.`)
    );
    if (!confirmed) return;

    setSigningBusyId(entry.id);

    if (driverContract && cost.buyout > 0) {
      const gainingFinance = teamFinance?.id ? teamFinance : await ensureTeamFinanceRow();
      if (!gainingFinance?.id) {
        setTransferPortalMessage("Could not load your team's finances. Try again.");
        setSigningBusyId("");
        return;
      }

      const { error: gainErr } = await supabase.from("team_finances").update({
        balance: Number(gainingFinance.balance || 0) - cost.buyout,
        buyout_spent: Number(gainingFinance.buyout_spent || 0) + cost.buyout,
        updated_at: new Date().toISOString(),
      }).eq("id", gainingFinance.id);

      if (gainErr) {
        console.error("Could not deduct buyout from gaining team:", gainErr);
        setTransferPortalMessage("Could not deduct the buyout from your team's funds. Signing cancelled.");
        setSigningBusyId("");
        return;
      }

      const { data: losingFinanceData } = await supabase
        .from("team_finances")
        .select("*")
        .eq("team", entry.current_team)
        .limit(1);
      const losingFinance = Array.isArray(losingFinanceData) && losingFinanceData.length ? losingFinanceData[0] : null;

      if (losingFinance?.id) {
        const { error: loseErr } = await supabase.from("team_finances").update({
          balance: Number(losingFinance.balance || 0) + cost.buyout,
          updated_at: new Date().toISOString(),
        }).eq("id", losingFinance.id);
        if (loseErr) console.error("Buyout deducted from gaining team, but could not credit the losing team:", loseErr);
      } else {
        console.error("Could not find a team_finances row for the losing team:", entry.current_team);
      }

      const { error: contractErr } = await supabase.from("contract_offers").update({
        status: "Terminated - Transfer Portal",
        termination_type: "Transfer Portal Buyout",
        termination_buyout: cost.buyout,
        terminated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq("id", driverContract.id);
      if (contractErr) console.error("Could not mark old contract terminated:", contractErr);
    }

    const { error: assignErr } = await supabase.from("driver_team_assignments").upsert({
      driver_number: String(entry.driver_number),
      driver_name: entry.driver_name,
      team: safeSelectedTeam,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "driver_number" });
    if (assignErr) console.error("Buyout processed, but driver_team_assignments was not updated:", assignErr);

    const { error: portalErr } = await supabase.from("driver_portal_entries").update({
      status: "signed",
      signed_by_team: safeSelectedTeam,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", entry.id);
    if (portalErr) console.error("Could not close portal entry:", portalErr);

    const { error: msgErr } = await supabase.from("league_messages").insert([{
      message_type: "contract",
      sender_type: "owner",
      sender_name: `${ownerNames[safeSelectedTeam] || ownerTeamName} / ${ownerTeamName}`,
      recipient_type: "driver",
      recipient_driver_number: String(entry.driver_number),
      recipient_team: entry.current_team,
      subject: "Signed Out of the Transfer Portal",
      message: `${getTeamFullName(safeSelectedTeam)} has signed you out of the Transfer Portal!${cost.buyout > 0 ? ` A buyout of ${money(cost.buyout)} was paid to ${getTeamFullName(entry.current_team)}.` : ""}`,
      archived: false,
      created_at: new Date().toISOString(),
    }]);
    if (msgErr) console.error("Could not send signing notice:", msgErr);

    setTransferPortalMessage(`Signed #${entry.driver_number} ${entry.driver_name}.${cost.buyout > 0 ? ` ${money(cost.buyout)} buyout paid to ${getTeamFullName(entry.current_team)}.` : ""}`);
    setSigningBusyId("");
    await loadTransferPortalEntries();
    await loadTeamFinance();
    await loadActiveContracts();
  }

  async function updateTeamInterestStatus(interestId, status) {
    setTeamInterestMessage("");
    setTeamInterestError("");

    const { error } = await supabase
      .from("team_interest")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", interestId);

    if (error) {
      console.error("Could not update team interest:", error);
      setTeamInterestError("Could not update team interest. Check team_interest update policy.");
      return;
    }

    setTeamInterestRows((current) => current.map((row) => row.id === interestId ? { ...row, status, updated_at: new Date().toISOString() } : row));
    setTeamInterestMessage(`Interest marked ${status}.`);
  }

  function updateContractField(field, value) {
    setContractForm((current) => ({ ...current, [field]: value }));
  }


  function updateTeamMessageField(field, value) {
    setTeamMessageForm((current) => ({ ...current, [field]: value }));
  }

  async function sendTeamMessage(event) {
    event?.preventDefault?.();
    setTeamMessageStatus("");
    setTeamMessageError("");

    if (!isAuthorized) {
      setTeamMessageError("Unlock Team HQ before sending messages.");
      return;
    }

    const body = String(teamMessageForm.message || "").trim();
    const subject = String(teamMessageForm.subject || "").trim();
    const mode = String(teamMessageForm.recipient_mode || "team");

    if (!body) {
      setTeamMessageError("Type a message before sending.");
      return;
    }

    if (body.length > 1200) {
      setTeamMessageError("Keep messages under 1,200 characters to save database space.");
      return;
    }

    const basePayload = {
      message_type: "team_hq",
      sender_type: "owner",
      sender_name: `${ownerNames[safeSelectedTeam] || ownerTeamName} / ${ownerTeamName}`,
      subject: subject || null,
      message: body,
      is_read: false,
      archived: false,
      created_at: new Date().toISOString(),
    };

    let payloads = [];

    if (mode === "driver") {
      const target = selected.drivers.find((driver) => String(driver.number) === String(teamMessageForm.driver_number));
      if (!target) {
        setTeamMessageError("Choose a driver from your team.");
        return;
      }
      payloads = [{
        ...basePayload,
        recipient_type: "driver",
        recipient_driver_number: String(target.number),
        recipient_team: safeSelectedTeam,
        recipient_manufacturer: target.manufacturer || null,
      }];
    } else {
      payloads = [{
        ...basePayload,
        recipient_type: "team",
        recipient_team: safeSelectedTeam,
      }];
    }

    const { error } = await supabase.from("league_messages").insert(payloads);

    if (error) {
      console.error("Could not send team message:", error);
      setTeamMessageError("Could not send message. Check league_messages insert policy and columns.");
      return;
    }

    setTeamMessageForm({ recipient_mode: "team", driver_number: "", subject: "", message: "" });
    setTeamMessageStatus(mode === "driver" ? "Message sent to driver." : "Message sent to your team.");
  }


  async function loadTeamInboxMessages() {
    if (!safeSelectedTeam || !isAuthorized) {
      setTeamInboxMessages([]);
      return;
    }

    setTeamInboxLoading(true);
    setTeamMessageError("");

    const { data, error } = await supabase
      .from("league_messages")
      .select("*")
      .or(`recipient_team.eq.${safeSelectedTeam},recipient_team.eq.${ownerTeamName}`)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      console.error("Could not load Team HQ messages:", error);
      setTeamMessageError("Could not load Team HQ inbox. Check league_messages select policy.");
      setTeamInboxMessages([]);
      setTeamInboxLoading(false);
      return;
    }

    setTeamInboxMessages(data || []);
    setTeamInboxLoading(false);
  }

  async function updateTeamMessageReadStatus(messageId, isRead) {
    if (!messageId) return;
    setTeamMessageStatus("");
    setTeamMessageError("");

    const { error } = await supabase
      .from("league_messages")
      .update({ is_read: Boolean(isRead) })
      .eq("id", messageId);

    if (error) {
      console.error("Could not update Team HQ message:", error);
      setTeamMessageError("Could not update message. Check league_messages update policy.");
      return;
    }

    setTeamInboxMessages((current) => current.map((message) => message.id === messageId ? { ...message, is_read: Boolean(isRead) } : message));
    setTeamMessageStatus(isRead ? "Message marked read." : "Message marked unread.");
  }

  async function markAllTeamMessagesRead() {
    const unreadIds = (teamInboxMessages || []).filter((message) => !message.is_read).map((message) => message.id).filter(Boolean);
    if (!unreadIds.length) {
      setTeamMessageStatus("No unread messages to mark read.");
      return;
    }

    setTeamMessageStatus("");
    setTeamMessageError("");
    const { error } = await supabase
      .from("league_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Could not mark Team HQ messages read:", error);
      setTeamMessageError("Could not mark all read. Check league_messages update policy.");
      return;
    }

    setTeamInboxMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, is_read: true } : message));
    setTeamMessageStatus("All Team HQ messages marked read.");
  }

  async function archiveTeamMessage(messageId) {
    if (!messageId) return;
    const { error } = await supabase
      .from("league_messages")
      .update({ archived: true })
      .eq("id", messageId);

    if (error) {
      console.error("Could not archive Team HQ message:", error);
      setTeamMessageError("Could not archive message. Check league_messages update policy.");
      return;
    }

    setTeamInboxMessages((current) => current.filter((message) => message.id !== messageId));
    setTeamMessageStatus("Message archived.");
  }

  useEffect(() => {
    if (activeHqTab !== "messages" || !isAuthorized) return;
    loadTeamInboxMessages();
    const interval = setInterval(loadTeamInboxMessages, 30000);
    return () => clearInterval(interval);
  }, [activeHqTab, isAuthorized, safeSelectedTeam, ownerTeamName]);

  function selectContractDriver(driverId) {
    const driver = drivers.find((item) => String(item.id) === String(driverId));
    if (!driver) {
      setContractForm((current) => ({ ...current, driver_name: "", driver_number: "", manufacturer: "" }));
      return;
    }

    setContractForm((current) => ({
      ...current,
      driver_name: driver.name || "",
      driver_number: driver.number || "",
      manufacturer: driver.manufacturer || "",
    }));
  }

  function updateIndependentPaymentField(field, value) {
    setIndependentPaymentForm((current) => ({ ...current, [field]: value }));
  }

  function submitIndependentDriverPayment() {
    setIndependentPaymentMessage("");
    setIndependentPaymentError("");

    if (!isAuthorized) {
      setIndependentPaymentError("Owner access required before paying an independent driver.");
      return;
    }

    const driver = drivers.find((item) => String(item.id) === String(independentPaymentForm.driver_id));
    const amount = Number(independentPaymentForm.amount) || 0;

    if (!driver) {
      setIndependentPaymentError("Select an independent driver before creating a payment.");
      return;
    }

    const driverTeam = String(driver.team || "Independent").trim().toLowerCase();
    if (driverTeam !== "independent" && driverTeam !== "ind") {
      setIndependentPaymentError("Only Independent/IND drivers can be paid from this tool.");
      return;
    }

    if (amount <= 0) {
      setIndependentPaymentError("Payment amount must be greater than $0.");
      return;
    }

    if (amount > currentTeamBalance) {
      setIndependentPaymentError("Payment amount exceeds your available team account balance.");
      return;
    }

    const payment = {
      id: `ind-pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      paid_by_team: ownerTeamName,
      paid_by_team_key: safeSelectedTeam,
      driver_id: driver.id,
      driver_name: driver.name || "",
      driver_number: driver.number || "",
      manufacturer: driver.manufacturer || "",
      amount,
      reason: independentPaymentForm.reason || "",
      created_at: new Date().toISOString(),
    };

    const nextPayments = [payment, ...(independentDriverPayments || [])];
    setIndependentDriverPayments(nextPayments);
    saveIndependentDriverPayments(nextPayments);
    setIndependentPaymentForm(DEFAULT_INDEPENDENT_PAYMENT_FORM);
    setIndependentPaymentMessage(`Payment recorded for #${payment.driver_number} ${payment.driver_name}.`);
  }

  function deleteIndependentDriverPayment(paymentId) {
    const nextPayments = (independentDriverPayments || []).filter((payment) => payment.id !== paymentId);
    setIndependentDriverPayments(nextPayments);
    saveIndependentDriverPayments(nextPayments);
  }

  async function loadDriverFeedback() {
    const { data, error: feedbackError } = await supabase
      .from("driver_feedback")
      .select("*")
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error("Failed to load driver feedback:", feedbackError);
      setDriverFeedback(loadLocalDriverFeedback());
      return;
    }

    const nextFeedback = data || [];
    setDriverFeedback(nextFeedback);
    localStorage.setItem("bclDriverFeedbackRatings", JSON.stringify(nextFeedback));
  }

  function getTeamFinanceKeys() {
    return Array.from(new Set([
      ownerTeamName,
      safeSelectedTeam,
      getTeamFullName(safeSelectedTeam),
    ].filter(Boolean).map((value) => String(value).trim())));
  }

  async function loadTeamFinance() {
    if (!safeSelectedTeam) return null;

    const financeKeys = getTeamFinanceKeys();

    const { data, error: financeError } = await supabase
      .from("team_finances")
      .select("*")
      .in("team", financeKeys)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (financeError) {
      console.error("Failed to load team finance:", financeError);
      setTeamFinance(null);
      return null;
    }

    const row = Array.isArray(data) && data.length ? data[0] : null;
    setTeamFinance(row || null);
    return row || null;
  }

  async function ensureTeamFinanceRow() {
    let financeRow = teamFinance?.id ? teamFinance : await loadTeamFinance();

    if (financeRow?.id) return financeRow;

    const startingBalance = Math.max(
      Number(selected?.projectedBudget || 0),
      getTeamStartingBudget(selected?.drivers?.length || 0, safeSelectedTeam),
      700000
    );

    const insertPayload = {
      team: ownerTeamName,
      balance: startingBalance,
      payroll_spent: 0,
      signing_bonus_spent: 0,
      buyout_spent: 0,
      number_pool_spent: 0,
      updated_at: new Date().toISOString(),
    };

    const { data: createdRow, error: createError } = await supabase
      .from("team_finances")
      .insert([insertPayload])
      .select("*")
      .maybeSingle();

    if (createError) {
      console.error("Could not create team finance row:", createError);
      setTeamFinance(null);
      return null;
    }

    setTeamFinance(createdRow || null);
    return createdRow || null;
  }

  function getFinanceKeysForTeam(team) {
    return Array.from(new Set([
      team,
      getTeamFullName(team),
    ].filter(Boolean).map((value) => String(value).trim())));
  }

  async function loadFinanceRowForTeam(team) {
    const financeKeys = getFinanceKeysForTeam(team);
    const { data, error } = await supabase
      .from("team_finances")
      .select("*")
      .in("team", financeKeys)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Failed to load finance row for ${team}:`, error);
      return null;
    }

    return Array.isArray(data) && data.length ? data[0] : null;
  }

  async function ensureFinanceRowForTeam(team) {
    const existing = await loadFinanceRowForTeam(team);
    if (existing?.id) return existing;

    const teamDriverCount = (drivers || []).filter((driver) => String(driver?.team || "") === String(team)).length;
    const startingBalance = Math.max(getTeamStartingBudget(teamDriverCount, team), 700000);

    const { data: createdRow, error } = await supabase
      .from("team_finances")
      .insert([{
        team,
        balance: startingBalance,
        payroll_spent: 0,
        signing_bonus_spent: 0,
        buyout_spent: 0,
        number_pool_spent: 0,
        updated_at: new Date().toISOString(),
      }])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(`Could not create finance row for ${team}:`, error);
      return null;
    }

    return createdRow || null;
  }

  async function loadTeamTransferLogs() {
    if (!safeSelectedTeam) return;

    const teamKeys = getFinanceKeysForTeam(safeSelectedTeam);
    if (ownerTeamName && !teamKeys.includes(ownerTeamName)) teamKeys.push(ownerTeamName);

    const { data, error } = await supabase
      .from("team_payment_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Could not load team transfer logs:", error);
      setTeamTransferLogs([]);
      return;
    }

    const mine = (data || []).filter((row) =>
      teamKeys.includes(String(row.from_team || "")) || teamKeys.includes(String(row.to_team || ""))
    );

    setTeamTransferLogs(mine);
  }

  function updateTeamTransferField(field, value) {
    setTeamTransferForm((current) => ({ ...current, [field]: value }));
  }

  function getDriverByTransferId(value) {
    const key = String(value || "");
    return (drivers || []).find((driver) => String(driver.id) === key || String(driver.number) === key || String(driver.name) === key) || null;
  }

  function getTransferTeamKeys(team) {
    return Array.from(new Set([team, getTeamFullName(team)].filter(Boolean).map((item) => String(item).trim())));
  }

  function currentTeamMatches(value) {
    return sameTeamName(value, safeSelectedTeam) || sameTeamName(value, ownerTeamName);
  }

  async function loadTeamTransferRequests() {
    if (!safeSelectedTeam) return;

    const teamKeys = Array.from(new Set([...getTransferTeamKeys(safeSelectedTeam), ...getTransferTeamKeys(ownerTeamName)]));
    const { data, error } = await supabase
      .from("team_payment_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      console.error("Could not load team payment requests:", error);
      setTeamTransferRequests([]);
      return;
    }

    setTeamTransferRequests((data || []).filter((row) =>
      teamKeys.includes(String(row.requested_by_team || "")) ||
      teamKeys.includes(String(row.requested_from_team || "")) ||
      teamKeys.includes(String(row.to_team || "")) ||
      teamKeys.includes(String(row.from_team || ""))
    ));
  }

  function buildFollowOnPayload({ dealType, payerTeam, receiverTeam, request = null }) {
    const driver = request ? null : getDriverByTransferId(teamTransferForm.driver_id);
    const source = request || {};
    if (dealType === "driver_buyout") {
      return {
        type: "driver_buyout",
        driver_id: source.driver_id || driver?.id || "",
        driver_number: source.driver_number || driver?.number || "",
        driver_name: source.driver_name || driver?.name || "",
        new_team: source.new_team || payerTeam,
        new_manufacturer: source.new_manufacturer || teamTransferForm.new_manufacturer || driver?.manufacturer || "",
        new_number: source.new_number || teamTransferForm.new_number || driver?.number || "",
      };
    }
    if (dealType === "number_sale") {
      return {
        type: "number_transfer",
        number: Number(source.number || teamTransferForm.number || 0),
        from_team: receiverTeam,
        to_team: payerTeam,
        assign_to_driver_id: source.assign_to_driver_id || teamTransferForm.assign_to_driver_id || "",
      };
    }
    return null;
  }

  async function applyNumberSaleFollowOn({ request, payerTeam, receiverTeam }) {
    const carNumber = Number(request?.number || 0);
    if (!carNumber) return;

    await supabase
      .from("number_pool")
      .update({
        status: "owned",
        owning_team: payerTeam,
        assigned_driver_number: request?.assign_to_driver_id || null,
        assigned_driver_name: request?.assign_to_driver_name || null,
        purchase_price: Number(request?.amount || 0),
        purchased_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("number", carNumber);

    await supabase.from("number_transactions").insert([{
      number: carNumber,
      transaction_type: "team_sale",
      from_team: receiverTeam,
      to_team: payerTeam,
      amount: Number(request?.amount || 0),
      notes: request?.terms || request?.reason || `#${carNumber} sold from ${receiverTeam} to ${payerTeam}.`,
      created_at: new Date().toISOString(),
    }]);
  }



  const startParkRaceOptions = DEFAULT_START_PARK_RACES.filter((race) => race.date && !getStartParkCutoffInfo(race.date).closed);

  function updateTeamStartParkRace(value) {
    const race = startParkRaceOptions.find((item) => item.name === value) || {};
    setTeamStartParkForm((current) => ({ ...current, race_name: value, race_date: race.date || "" }));
  }

  async function loadTeamStartParkRequests() {
    const { data, error } = await supabase
      .from("start_park_requests")
      .select("*")
      .eq("requested_by_team", ownerTeamName)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load team Start & Park requests:", error);
      setTeamStartParkRequests([]);
      return;
    }
    setTeamStartParkRequests(data || []);
  }

  useEffect(() => {
    if (!isAuthorized || !ownerTeamName) return;
    loadTeamStartParkRequests();
    const interval = setInterval(loadTeamStartParkRequests, 30000);
    return () => clearInterval(interval);
  }, [isAuthorized, ownerTeamName]);


  async function loadDevelopmentCenterData() {
    if (!isAuthorized) {
      setDevelopmentTransactions([]);
      setDevelopmentStarts([]);
      return;
    }

    setDevelopmentError("");

    const { data: transactionRows, error: transactionError } = await supabase
      .from("league_transactions")
      .select("*")
      .eq("transaction_type", "development_request")
      .order("created_at", { ascending: false });

    if (transactionError) {
      console.error("Could not load development requests:", transactionError);
      setDevelopmentError("Could not load development requests. Check league_transactions select policy.");
      setDevelopmentTransactions([]);
    } else {
      setDevelopmentTransactions(transactionRows || []);
    }

    const { data: startRows, error: startsError } = await supabase
      .from("developmental_starts")
      .select("*")
      .order("created_at", { ascending: false });

    if (startsError) {
      console.error("Could not load developmental starts:", startsError);
      setDevelopmentStarts([]);
    } else {
      setDevelopmentStarts(startRows || []);
    }
  }

  useEffect(() => {
    if (activeHqTab !== "development" || !isAuthorized) return;
    loadDevelopmentCenterData();
    const interval = setInterval(loadDevelopmentCenterData, 30000);
    return () => clearInterval(interval);
  }, [activeHqTab, isAuthorized, safeSelectedTeam, ownerTeamName]);

  function updateDevelopmentForm(field, value) {
    setDevelopmentForm((current) => ({ ...current, [field]: value }));
  }

  async function recordDevelopmentStartFromTransaction(row, override = {}) {
    if (!row?.driver_number || !row?.requested_series) return;

    const payload = {
      driver_number: String(row.driver_number || ""),
      driver_name: row.driver_name || "",
      cup_driver: true,
      series: String(row.requested_series || "").toLowerCase(),
      season: 2026,
      race_name: row.race_name || "",
      owner: ownerNames[safeSelectedTeam] || ownerTeamName,
      team: row.requested_team || ownerTeamName,
      points_eligible: false,
      payout_eligible: false,
      counts_against_limit: true,
      admin_override: Boolean(row.admin_override),
      admin_override_by: row.admin_override_by || null,
      admin_override_reason: row.admin_override_reason || null,
      created_at: new Date().toISOString(),
      ...override,
    };

    const { error } = await supabase.from("developmental_starts").insert([payload]);
    if (error) {
      console.error("Could not record developmental start:", error);
    }
  }

  async function submitOwnerDevelopmentAssignment(event) {
    event?.preventDefault?.();
    setDevelopmentMessage("");
    setDevelopmentError("");

    if (!isAuthorized) {
      setDevelopmentError("Unlock Team HQ before assigning a developmental ride.");
      return;
    }

    const driver = cupDriverOptions.find((item) => String(item.id || item.number) === String(developmentForm.driver_id));
    const requestedSeries = String(developmentForm.requested_series || "").toLowerCase();
    const raceName = String(developmentForm.race_name || "").trim();

    if (!driver) {
      setDevelopmentError("Choose a Cup driver to assign.");
      return;
    }
    if (!requestedSeries) {
      setDevelopmentError("Choose Xfinity, Truck, or ARCA.");
      return;
    }
    if (!raceName) {
      setDevelopmentError("Enter the developmental race name.");
      return;
    }

    const currentStarts = getDriverDevelopmentStarts(driver.number, requestedSeries);
    const requiresBoardApproval = currentStarts >= 2;

    const payload = {
      transaction_type: "development_request",
      driver_number: String(driver.number || ""),
      driver_name: driver.name || "",
      current_series: "cup",
      requested_series: requestedSeries,
      current_team: driver.team || "",
      requested_team: ownerTeamName,
      current_owner: driver.team ? ownerNames[driver.team] || getTeamFullName(driver.team) : "",
      requested_owner: ownerNames[safeSelectedTeam] || ownerTeamName,
      initiated_by: ownerNames[safeSelectedTeam] || ownerTeamName,
      owner_status: "approved",
      board_status: requiresBoardApproval ? "pending" : "approved",
      final_status: requiresBoardApproval ? "pending" : "approved",
      request_note: String(developmentForm.request_note || "").trim(),
      owner_note: requiresBoardApproval
        ? `Owner assigned ride. Driver already has ${currentStarts}/2 ${getDevelopmentSeriesLabel(requestedSeries)} starts; board approval required.`
        : `Owner assigned ride. Approved under 2-start limit (${currentStarts}/2 used before assignment).`,
      race_name: raceName,
      assignment_source: "owner_assignment",
      assigned_by: ownerNames[safeSelectedTeam] || ownerTeamName,
      requires_board_approval: requiresBoardApproval,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDevelopmentBusy("assign");
    const { data, error } = await supabase.from("league_transactions").insert([payload]).select("*").single();
    setDevelopmentBusy("");

    if (error) {
      console.error("Could not assign developmental ride:", error);
      setDevelopmentError("Could not assign developmental ride. Check league_transactions insert policy and required columns.");
      return;
    }

    if (!requiresBoardApproval) {
      await recordDevelopmentStartFromTransaction(data || payload);
    }

    setDevelopmentTransactions((current) => [data || payload, ...(current || [])]);
    setDevelopmentForm(DEFAULT_DEVELOPMENT_ASSIGNMENT_FORM);
    setDevelopmentMessage(requiresBoardApproval
      ? "Developmental ride assigned and sent to the board because the driver is over the 2-start limit."
      : "Developmental ride assigned and approved. It will show on the driver's profile.");
    await loadDevelopmentCenterData();
  }

  async function updateDevelopmentRequest(row, action) {
    setDevelopmentMessage("");
    setDevelopmentError("");

    if (!isAuthorized) {
      setDevelopmentError("Unlock Team HQ before reviewing developmental requests.");
      return;
    }

    const currentStarts = getDriverDevelopmentStarts(row.driver_number, row.requested_series);
    const requiresBoardApproval = currentStarts >= 2;
    const approved = action === "approve";

    const updatePayload = approved ? {
      owner_status: "approved",
      board_status: requiresBoardApproval ? "pending" : "approved",
      final_status: requiresBoardApproval ? "pending" : "approved",
      owner_note: requiresBoardApproval
        ? `Owner approved. Driver already has ${currentStarts}/2 ${getDevelopmentSeriesLabel(row.requested_series)} starts; board approval required.`
        : `Owner approved under 2-start limit (${currentStarts}/2 used before approval).`,
      requires_board_approval: requiresBoardApproval,
      updated_at: new Date().toISOString(),
    } : {
      owner_status: "denied",
      final_status: "denied",
      owner_note: "Owner denied developmental ride request.",
      requires_board_approval: false,
      updated_at: new Date().toISOString(),
    };

    setDevelopmentBusy(row.id || action);
    const { data, error } = await supabase
      .from("league_transactions")
      .update(updatePayload)
      .eq("id", row.id)
      .select("*")
      .single();
    setDevelopmentBusy("");

    if (error) {
      console.error("Could not update development request:", error);
      setDevelopmentError("Could not update request. Check league_transactions update policy.");
      return;
    }

    if (approved && !requiresBoardApproval) {
      await recordDevelopmentStartFromTransaction(data || { ...row, ...updatePayload });
    }

    setDevelopmentTransactions((current) => (current || []).map((item) => item.id === row.id ? (data || { ...item, ...updatePayload }) : item));
    setDevelopmentMessage(approved
      ? (requiresBoardApproval ? "Owner approved. Sent to board because driver is over the 2-start limit." : "Owner approved. The ride is now active on the driver profile.")
      : "Developmental ride request denied.");
    await loadDevelopmentCenterData();
  }

  async function submitTeamStartParkRequest(event) {
    event?.preventDefault?.();
    setTeamStartParkMessage("");
    setTeamStartParkError("");

    const driver = (selected?.drivers || []).find((item) => String(item.id || item.number) === String(teamStartParkForm.driver_id));
    if (!driver) {
      setTeamStartParkError("Choose a driver from your team.");
      return;
    }
    if (!teamStartParkForm.race_name || !teamStartParkForm.race_date) {
      setTeamStartParkError("Choose the race for the Start & Park request.");
      return;
    }
    const cutoff = getStartParkCutoffInfo(teamStartParkForm.race_date);
    if (cutoff.closed) {
      setTeamStartParkError("Start & Park requests are closed for this race. Deadline is Saturday at 9:00 PM ET.");
      return;
    }
    const duplicate = (teamStartParkRequests || []).find((request) =>
      String(request.race_name || "") === String(teamStartParkForm.race_name) &&
      String(request.driver_number || "") === String(driver.number || "") &&
      ["pending", "approved", "applied"].includes(String(request.status || "pending").toLowerCase())
    );
    if (duplicate) {
      setTeamStartParkError("This driver already has an active Start & Park request for that race.");
      return;
    }

    const payload = {
      race_name: teamStartParkForm.race_name,
      race_date: teamStartParkForm.race_date,
      driver_id: String(driver.id || ""),
      driver_number: String(driver.number || ""),
      driver_name: driver.name || "",
      team: driver.team || ownerTeamName,
      manufacturer: driver.manufacturer || "",
      requested_by_type: "team",
      requested_by_name: ownerNames[safeSelectedTeam] || getTeamFullName(ownerTeamName),
      requested_by_team: ownerTeamName,
      reason: String(teamStartParkForm.reason || "").trim(),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTeamStartParkSubmitting(true);
    const { data, error } = await supabase.from("start_park_requests").insert([payload]).select().single();
    setTeamStartParkSubmitting(false);

    if (error) {
      console.error("Could not submit team Start & Park request:", error);
      setTeamStartParkError("Could not submit request. Check start_park_requests insert policy and columns.");
      return;
    }

    await supabase.from("league_messages").insert([{
      message_type: "start_park_request",
      sender_type: "team",
      sender_name: getTeamFullName(ownerTeamName),
      recipient_type: "league",
      subject: `Start & Park Request: #${driver.number} ${driver.name}`,
      message: `${getTeamFullName(ownerTeamName)} requested Start & Park for #${driver.number} ${driver.name} at ${teamStartParkForm.race_name}.`,
      related_page: "/admin",
      related_id: data?.id || null,
      created_at: new Date().toISOString(),
    }]);

    setTeamStartParkRequests((current) => [data || payload, ...(current || [])]);
    setTeamStartParkForm({ driver_id: "", race_name: "", race_date: "", reason: "" });
    setTeamStartParkMessage("Start & Park request sent to Race Control. Approved cars go to the rear by request receipt order.");
  }

  async function createTeamPaymentRequest(event) {
    event?.preventDefault?.();
    setTeamTransferMessage("");
    setTeamTransferError("");

    if (!isAuthorized) {
      setTeamTransferError("Unlock Team HQ before requesting funds.");
      return;
    }

    const requestedFromTeam = String(teamTransferForm.to_team || "").trim();
    const amount = Math.round(Number(teamTransferForm.amount || 0));
    const dealType = String(teamTransferForm.deal_type || "general");
    const reason = String(teamTransferForm.reason || "").trim();
    const terms = String(teamTransferForm.terms || "").trim();
    const selectedDriver = getDriverByTransferId(teamTransferForm.driver_id);
    const selectedNumberRow = (numberPool || []).find((row) => String(row.number) === String(teamTransferForm.number));

    if (!requestedFromTeam) {
      setTeamTransferError("Choose which team you are requesting funds from.");
      return;
    }

    if (currentTeamMatches(requestedFromTeam)) {
      setTeamTransferError("Choose a different team.");
      return;
    }

    if (!amount || amount <= 0) {
      setTeamTransferError("Enter a valid request amount.");
      return;
    }

    if (dealType === "number_sale") {
      if (!selectedNumberRow?.id || !teamTransferForm.number) {
        setTeamTransferError("Choose one of your owned numbers to sell.");
        return;
      }
      if (!sameTeamName(selectedNumberRow.owning_team, safeSelectedTeam) && !sameTeamName(selectedNumberRow.owning_team, ownerTeamName)) {
        setTeamTransferError("You can only request payment for a number your team owns.");
        return;
      }
    }

    if (dealType === "driver_buyout" && !selectedDriver) {
      setTeamTransferError("Choose the driver involved in the buyout.");
      return;
    }

    const payload = {
      requested_by_team: ownerTeamName,
      requested_from_team: requestedFromTeam,
      amount,
      deal_type: dealType,
      reason,
      terms,
      status: "pending",
      driver_id: selectedDriver?.id ? String(selectedDriver.id) : null,
      driver_number: selectedDriver?.number ? String(selectedDriver.number) : null,
      driver_name: selectedDriver?.name || null,
      current_team: selectedDriver?.team || null,
      new_team: dealType === "driver_buyout" ? requestedFromTeam : null,
      new_manufacturer: teamTransferForm.new_manufacturer || selectedDriver?.manufacturer || null,
      new_number: teamTransferForm.new_number ? String(teamTransferForm.new_number) : null,
      number: teamTransferForm.number ? Number(teamTransferForm.number) : null,
      assign_to_driver_id: teamTransferForm.assign_to_driver_id ? String(teamTransferForm.assign_to_driver_id) : null,
      created_by: ownerNames[safeSelectedTeam] || ownerTeamName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTeamTransferBusy(true);
    const { error } = await supabase.from("team_payment_requests").insert([payload]);
    setTeamTransferBusy(false);

    if (error) {
      console.error("Could not create payment request:", error);
      setTeamTransferError("Could not create payment request. Check team_payment_requests insert policy and columns.");
      return;
    }

    await supabase.from("league_messages").insert([{
      message_type: "team_payment_request",
      sender_type: "team",
      sender_name: getTeamFullName(ownerTeamName),
      recipient_type: "team",
      recipient_team: requestedFromTeam,
      subject: `Payment Request: ${money(amount)} for ${dealType.replace(/_/g, " ")}`,
      message: `${getTeamFullName(ownerTeamName)} requested ${money(amount)}.${reason ? ` Reason: ${reason}` : ""}${terms ? ` Terms: ${terms}` : ""}`,
      related_page: "/owner",
      created_at: new Date().toISOString(),
    }]);

    setTeamTransferMessage(`Payment request sent to ${getTeamFullName(requestedFromTeam)}.`);
    setTeamTransferForm({ mode: "request", deal_type: "general", to_team: "", amount: "", reason: "", terms: "", driver_id: "", new_number: "", new_manufacturer: "", number: "", assign_to_driver_id: "" });
    await loadTeamTransferRequests();
  }

  async function completeTeamPayment({ toTeam, amount, reason, dealType = "general", request = null }) {
    const fromTeam = ownerTeamName || safeSelectedTeam;
    const roundedAmount = Math.round(Number(amount || 0));
    const timestamp = new Date().toISOString();

    const fromFinanceRow = await ensureFinanceRowForTeam(fromTeam);
    if (!fromFinanceRow?.id) {
      return { ok: false, message: "Could not find or create your team finance row. Check team_finances insert/select policies." };
    }

    const fromBalance = Number(fromFinanceRow.balance || 0);
    if (fromBalance < roundedAmount) {
      return { ok: false, message: `Not enough funds. Available balance is ${money(fromBalance)}.` };
    }

    const toFinanceRow = await ensureFinanceRowForTeam(toTeam);
    if (!toFinanceRow?.id) {
      return { ok: false, message: "Could not find or create the receiving team's finance row. Check team_finances insert/select policies." };
    }

    const { error: debitError } = await supabase
      .from("team_finances")
      .update({ balance: fromBalance - roundedAmount, updated_at: timestamp })
      .eq("id", fromFinanceRow.id);

    if (debitError) {
      console.error("Could not deduct team transfer funds:", debitError);
      return { ok: false, message: "Could not deduct funds from your team. Check team_finances update policy." };
    }

    const { error: creditError } = await supabase
      .from("team_finances")
      .update({ balance: Number(toFinanceRow.balance || 0) + roundedAmount, updated_at: timestamp })
      .eq("id", toFinanceRow.id);

    if (creditError) {
      console.error("Could not credit receiving team:", creditError);
      await supabase.from("team_finances").update({ balance: fromBalance, updated_at: new Date().toISOString() }).eq("id", fromFinanceRow.id);
      return { ok: false, message: "Receiving team credit failed. Your deduction was rolled back." };
    }

    const followOnPayload = buildFollowOnPayload({ dealType, payerTeam: fromTeam, receiverTeam: toTeam, request });

    if (dealType === "number_sale" && request) {
      await applyNumberSaleFollowOn({ request, payerTeam: fromTeam, receiverTeam: toTeam });
    }

    if (followOnPayload && typeof onApplyTeamTransaction === "function") {
      onApplyTeamTransaction(followOnPayload);
    }

    const logPayload = {
      from_team: fromTeam,
      to_team: toTeam,
      amount: roundedAmount,
      reason,
      deal_type: dealType,
      terms: request?.terms || teamTransferForm.terms || null,
      driver_id: followOnPayload?.driver_id || null,
      driver_name: followOnPayload?.driver_name || null,
      number: followOnPayload?.number || followOnPayload?.new_number || null,
      request_id: request?.id || null,
      created_by: ownerNames[safeSelectedTeam] || ownerNames[fromTeam] || "Team Owner",
      created_at: timestamp,
    };

    const { error: logError } = await supabase.from("team_payment_logs").insert([logPayload]);
    if (logError) console.error("Transfer completed but log failed:", logError);

    await supabase.from("league_messages").insert([{
      message_type: "team_transfer",
      sender_type: "team",
      sender_name: getTeamFullName(fromTeam),
      recipient_type: "team",
      recipient_team: toTeam,
      subject: `Team Transfer Received: ${money(roundedAmount)}`,
      message: `${getTeamFullName(fromTeam)} sent ${money(roundedAmount)} to ${getTeamFullName(toTeam)} for ${dealType.replace(/_/g, " ")}.${reason ? ` Reason: ${reason}` : ""}`,
      related_page: "/owner",
      created_at: timestamp,
    }]);

    return { ok: true, logError };
  }

  async function sendTeamTransfer(event) {
    event?.preventDefault?.();
    setTeamTransferMessage("");
    setTeamTransferError("");

    if (!isAuthorized) {
      setTeamTransferError("Unlock Team HQ before sending team funds.");
      return;
    }

    const toTeam = String(teamTransferForm.to_team || "").trim();
    const amount = Math.round(Number(teamTransferForm.amount || 0));
    const reason = String(teamTransferForm.reason || "").trim();
    const dealType = String(teamTransferForm.deal_type || "general");
    const selectedDriver = getDriverByTransferId(teamTransferForm.driver_id);

    if (!toTeam) {
      setTeamTransferError("Choose the team receiving the funds.");
      return;
    }

    if (currentTeamMatches(toTeam)) {
      setTeamTransferError("Choose a different team to receive the funds.");
      return;
    }

    if (!amount || amount <= 0) {
      setTeamTransferError("Enter a valid transfer amount.");
      return;
    }

    if (dealType === "number_sale") {
      setTeamTransferError("Number transfers must start as a request from the team selling the number. This prevents teams from stealing numbers.");
      return;
    }

    if (dealType === "driver_buyout") {
      if (!selectedDriver) {
        setTeamTransferError("Choose the driver being bought out.");
        return;
      }
      if (!teamTransferForm.new_number) {
        setTeamTransferError("The buying team must assign the driver's new number before payment.");
        return;
      }
    }

    const confirmed = window.confirm(`Send ${money(amount)} to ${getTeamFullName(toTeam)} now? Funds deduct immediately.`);
    if (!confirmed) return;

    setTeamTransferBusy(true);
    const result = await completeTeamPayment({ toTeam, amount, reason, dealType });
    setTeamTransferBusy(false);

    if (!result.ok) {
      setTeamTransferError(result.message);
      await loadTeamFinance();
      return;
    }

    setTeamTransferMessage(`${money(amount)} sent to ${getTeamFullName(toTeam)}. Funds deducted immediately.${dealType === "driver_buyout" ? " Driver team/manufacturer/number updated." : ""}`);
    setTeamTransferForm({ mode: "send", deal_type: "general", to_team: "", amount: "", reason: "", terms: "", driver_id: "", new_number: "", new_manufacturer: "", number: "", assign_to_driver_id: "" });
    await loadTeamFinance();
    await loadTeamTransferLogs();
    await loadTeamTransferRequests();
  }

  async function payTeamPaymentRequest(request) {
    setTeamTransferMessage("");
    setTeamTransferError("");

    if (!isAuthorized) {
      setTeamTransferError("Unlock Team HQ before paying requests.");
      return;
    }

    if (!currentTeamMatches(request?.requested_from_team)) {
      setTeamTransferError("Only the team that received the request can pay it.");
      return;
    }

    if (String(request?.status || "pending").toLowerCase() !== "pending") {
      setTeamTransferError("This request is no longer pending.");
      return;
    }

    if (request?.deal_type === "number_sale" && !request?.number) {
      setTeamTransferError("This number-sale request is missing the number.");
      return;
    }

    const confirmed = window.confirm(`Pay ${money(request.amount)} to ${getTeamFullName(request.requested_by_team)} now? Funds deduct immediately.`);
    if (!confirmed) return;

    setTeamTransferBusy(true);
    const result = await completeTeamPayment({
      toTeam: request.requested_by_team,
      amount: request.amount,
      reason: request.reason || request.terms || "Payment request",
      dealType: request.deal_type || "general",
      request,
    });

    if (!result.ok) {
      setTeamTransferBusy(false);
      setTeamTransferError(result.message);
      await loadTeamFinance();
      return;
    }

    await supabase
      .from("team_payment_requests")
      .update({ status: "paid", paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", request.id);

    setTeamTransferBusy(false);
    setTeamTransferMessage(`Request paid. ${money(request.amount)} deducted immediately.${request?.deal_type === "number_sale" ? ` #${request.number} transferred to your team.` : ""}`);
    await loadTeamFinance();
    await loadTeamTransferLogs();
    await loadTeamTransferRequests();
    await loadNumberPool();
  }

  async function declineTeamPaymentRequest(request) {
    if (!window.confirm("Decline this payment request?")) return;
    const { error } = await supabase
      .from("team_payment_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", request.id);
    if (error) {
      setTeamTransferError("Could not decline request. Check team_payment_requests update policy.");
      return;
    }
    setTeamTransferMessage("Payment request declined.");
    await loadTeamTransferRequests();
  }

  async function loadContractOffers() {
    if (!safeSelectedTeam) return;

    const { data, error: offersError } = await supabase
      .from("contract_offers")
      .select("*")
      .or(`team.eq.${ownerTeamName},created_by_team.eq.${ownerTeamName}`)
      .order("created_at", { ascending: false });

    if (offersError) {
      console.error("Failed to load contract offers:", offersError);
      setContractOffers([]);
      return;
    }

    setContractOffers(data || []);
  }

  async function loadActiveContracts() {
    const { data, error: activeContractsError } = await supabase
      .from("contract_offers")
      .select("*")
      .or("status.eq.Accepted,status.eq.Active,status.eq.accepted,status.eq.active")
      .order("created_at", { ascending: false });

    if (activeContractsError) {
      console.error("Failed to load active contracts:", activeContractsError);
      setActiveContracts([]);
      return;
    }

    setActiveContracts(data || []);
  }

  function canManageContract(contract) {
    if (!contract) return false;
    const contractTeam = contract.team || contract.created_by_team || "";
    return sameTeamName(contractTeam, safeSelectedTeam) || sameTeamName(contractTeam, ownerTeamName);
  }

  function calculateContractTerminationCost(contract) {
    const salary = Number(contract?.salary || 0);
    const contractLength = Math.max(1, Number(contract?.contract_length || 1));
    const remainingSalary = salary * contractLength;
    const fallbackBuyout = Math.round(salary * 1.5);
    const buyout = Number(contract?.buyout_amount ?? fallbackBuyout) || 0;
    return { remainingSalary, buyout, total: remainingSalary + buyout };
  }

  async function moveTerminatedDriverToFreeAgency(contract) {
    if (!contract?.driver_number) return;

    const payload = {
      driver_number: String(contract.driver_number),
      driver_name: contract.driver_name || "",
      team: "Independent",
      manufacturer: contract.manufacturer || "",
      contract_offer_id: contract.id || null,
      active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("driver_team_assignments")
      .upsert(payload, { onConflict: "driver_number" });

    if (error) {
      console.error("Contract terminated, but driver_team_assignments was not updated:", error);
    }
  }

  async function notifyDriverOfTermination(contract, type, note = "") {
    if (!contract?.driver_number) return;

    const message = type === "paid"
      ? `${ownerTeamName} has terminated your contract with a paid buyout. You have been moved to the free agent / Independent pool.`
      : `${ownerTeamName} has submitted a Board request to terminate your contract for cause. Reason: ${note}`;

    const { error } = await supabase.from("league_messages").insert([{
      message_type: "contract",
      sender_type: "owner",
      sender_name: `${ownerNames[safeSelectedTeam] || ownerTeamName} / ${ownerTeamName}`,
      recipient_type: "driver",
      recipient_driver_number: String(contract.driver_number),
      recipient_team: contract.team || contract.created_by_team || ownerTeamName,
      recipient_manufacturer: contract.manufacturer || null,
      subject: type === "paid" ? "Contract Terminated" : "For-Cause Termination Requested",
      message,
      archived: false,
      created_at: new Date().toISOString(),
    }]);

    if (error) console.error("Could not send termination Message Center notice:", error);
  }

  async function terminateContractPaidOut(contract) {
    setContractMessage("");
    setContractError("");

    if (!isAuthorized) {
      setContractError("Owner access required before terminating a contract.");
      return;
    }

    if (!canManageContract(contract)) {
      setContractError("You can only terminate contracts for your own team.");
      return;
    }

    const cost = calculateContractTerminationCost(contract);
    if (cost.total > currentTeamBalance) {
      setContractError(`This termination costs ${money(cost.total)}, but ${ownerTeamName} only has ${money(currentTeamBalance)} available.`);
      return;
    }

    const confirmed = window.confirm(
      `Terminate #${contract.driver_number || "—"} ${contract.driver_name || "this driver"}?\n\n` +
      `Remaining salary: ${money(cost.remainingSalary)}\n` +
      `Buyout: ${money(cost.buyout)}\n` +
      `Total due now: ${money(cost.total)}\n\n` +
      `This will mark the contract terminated, deduct funds, and move the driver to Independent / free agency.`
    );
    if (!confirmed) return;

    setTerminationBusyId(contract.id);

    const { error: contractUpdateError } = await supabase
      .from("contract_offers")
      .update({
        status: "Terminated - Paid Out",
        termination_type: "Paid Out",
        termination_cost: cost.total,
        termination_remaining_salary: cost.remainingSalary,
        termination_buyout: cost.buyout,
        terminated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contract.id);

    if (contractUpdateError) {
      console.error("Could not terminate contract:", contractUpdateError);
      setContractError("Could not terminate this contract. Run the contract termination SQL and check contract_offers update policy.");
      setTerminationBusyId("");
      return;
    }

    if (teamFinance?.id) {
      const { error: financeUpdateError } = await supabase
        .from("team_finances")
        .update({
          balance: Number(teamFinance.balance || 0) - cost.total,
          payroll_spent: Number(teamFinance.payroll_spent || 0) + cost.remainingSalary,
          buyout_spent: Number(teamFinance.buyout_spent || 0) + cost.buyout,
          updated_at: new Date().toISOString(),
        })
        .eq("id", teamFinance.id);

      if (financeUpdateError) {
        console.error("Contract terminated but finance update failed:", financeUpdateError);
        setContractError("Contract was terminated, but team funds were not deducted. Check team_finances RLS/update policy and buyout_spent column.");
        setTerminationBusyId("");
        await loadActiveContracts();
        return;
      }
    }

    await moveTerminatedDriverToFreeAgency(contract);
    await notifyDriverOfTermination(contract, "paid");

    setContractMessage(`Contract terminated. ${money(cost.total)} was deducted from ${ownerTeamName}, and the driver was moved to Independent / free agency.`);
    setTerminationBusyId("");
    await loadTeamFinance();
    await loadContractOffers();
    await loadActiveContracts();
  }

  async function requestForCauseTermination(contract) {
    setContractMessage("");
    setContractError("");

    if (!isAuthorized) {
      setContractError("Owner access required before requesting for-cause termination.");
      return;
    }

    if (!canManageContract(contract)) {
      setContractError("You can only request termination for your own team.");
      return;
    }

    const cause = window.prompt(`Reason for requesting for-cause termination of #${contract.driver_number || "—"} ${contract.driver_name || "this driver"}:`);
    const cleanCause = String(cause || "").trim();

    if (!cleanCause || cleanCause.length < 15) {
      setContractError("For-cause requests need a written reason of at least 15 characters.");
      return;
    }

    const confirmed = window.confirm(`Submit this for-cause termination request to the Board?`);
    if (!confirmed) return;

    setTerminationBusyId(contract.id);

    const priorNotes = String(contract.notes || "").trim();
    const boardNote = `[FOR-CAUSE TERMINATION REQUEST - ${new Date().toISOString()}]\nRequested by: ${ownerTeamName}\nCause: ${cleanCause}`;

    const { error } = await supabase
      .from("contract_offers")
      .update({
        status: "Termination Requested - For Cause",
        termination_type: "For Cause Requested",
        termination_cause: cleanCause,
        termination_requested_at: new Date().toISOString(),
        notes: priorNotes ? `${priorNotes}\n\n${boardNote}` : boardNote,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contract.id);

    if (error) {
      console.error("Could not request for-cause termination:", error);
      setContractError("Could not submit for-cause request. Run the contract termination SQL and check contract_offers update policy.");
      setTerminationBusyId("");
      return;
    }

    await notifyDriverOfTermination(contract, "cause", cleanCause);

    setContractMessage("For-cause termination request sent to the Board. No payout was deducted yet.");
    setTerminationBusyId("");
    await loadContractOffers();
    await loadActiveContracts();
  }

  async function loadTechnicalAlliances() {
    if (!safeSelectedTeam) return;

    const { data, error: allianceLoadError } = await supabase
      .from("technical_alliances")
      .select("*")
      .or(`team.eq.${ownerTeamName},alliance_team.eq.${ownerTeamName}`)
      .order("created_at", { ascending: false });

    if (allianceLoadError) {
      console.error("Failed to load technical alliances:", allianceLoadError);
      setTechnicalAlliances([]);
      return;
    }

    setTechnicalAlliances(data || []);
  }

  async function loadOwnerTasks() {
    if (!safeSelectedTeam) return;

    const { data, error: tasksLoadError } = await supabase
      .from("owner_tasks")
      .select("*")
      .in("team", [ownerTeamName, safeSelectedTeam])
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });

    if (tasksLoadError) {
      console.error("Failed to load owner tasks:", tasksLoadError);
      setTaskError("Could not load owner tasks. Check owner_tasks table RLS select policy.");
      setOwnerTasks([]);
      return;
    }

    setTaskError("");
    setOwnerTasks(data || []);
  }

  async function addOwnerTask(event) {
    event?.preventDefault?.();
    setTaskMessage("");
    setTaskError("");

    if (!isAuthorized) {
      setTaskError("Owner access required before creating tasks.");
      return;
    }

    const title = String(newTaskForm.title || "").trim();
    if (!title) {
      setTaskError("Task title is required.");
      return;
    }

    const payload = {
      team: ownerTeamName,
      title,
      description: String(newTaskForm.description || "").trim(),
      reward: String(newTaskForm.reward || "").trim(),
      completed: false,
      reward_value: Number(newTaskForm.reward_value || 0),
      task_type: String(newTaskForm.task_type || "Performance"),
      created_at: new Date().toISOString(),
    };

    const { error: insertTaskError } = await supabase.from("owner_tasks").insert([payload]);

    if (insertTaskError) {
      console.error("Could not create owner task:", insertTaskError);
      setTaskError("Could not create task. Check owner_tasks table RLS insert policy.");
      return;
    }

    setNewTaskForm({ title: "", description: "", reward: "", reward_value: 0, task_type: "Performance" });
    setTaskMessage("Owner task created.");
    await loadOwnerTasks();
  }

  async function toggleOwnerTask(task) {
    setTaskMessage("");
    setTaskError("");

    const { error: updateTaskError } = await supabase
      .from("owner_tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id);

    if (updateTaskError) {
      console.error("Could not update owner task:", updateTaskError);
      setTaskError("Could not update task. Check owner_tasks table RLS update policy.");
      return;
    }

    setOwnerTasks((current) => current.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item));
  }

  async function deleteOwnerTask(taskId) {
    if (!window.confirm("Delete this owner task?")) return;
    setTaskMessage("");
    setTaskError("");

    const { error: deleteTaskError } = await supabase
      .from("owner_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteTaskError) {
      console.error("Could not delete owner task:", deleteTaskError);
      setTaskError("Could not delete task. Check owner_tasks table RLS delete policy.");
      return;
    }

    setOwnerTasks((current) => current.filter((task) => task.id !== taskId));
    setTaskMessage("Owner task deleted.");
  }

  function addSuggestedTasks() {
    const suggestions = [
      { title: "Finish with one car inside the Top 10", description: "Set a weekly performance target for the next race weekend.", reward: "+5 team morale", reward_value: 5, task_type: "Performance" },
      { title: "Complete all assigned driver interviews", description: "Keep media activity strong and improve sponsor confidence.", reward: "+10 fan approval", reward_value: 10, task_type: "Media" },
      { title: "Avoid penalties this race week", description: "Keep the organization clean and reduce owner pressure.", reward: "$50,000 sponsor confidence bonus", reward_value: 50000, task_type: "Financial" },
      { title: "Keep driver happiness above 75", description: "Use feedback, communication, and owner support to protect morale.", reward: "+5 franchise value score", reward_value: 5, task_type: "Morale" },
    ];

    const firstEmptySuggestion = suggestions.find((suggestion) => !ownerTasks.some((task) => String(task.title || "").toLowerCase() === suggestion.title.toLowerCase()));
    if (!firstEmptySuggestion) {
      setTaskMessage("Suggested tasks already exist for this team.");
      return;
    }

    setNewTaskForm(firstEmptySuggestion);
    setActiveHqTab("tasks");
  }

  async function loadDriverTasks() {
    if (!safeSelectedTeam) return;

    const { data, error: driverTasksLoadError } = await supabase
      .from("driver_tasks")
      .select("*")
      .eq("team", ownerTeamName)
      .order("created_at", { ascending: false });

    if (driverTasksLoadError) {
      console.error("Failed to load driver assignments:", driverTasksLoadError);
      setDriverTaskError("Could not load driver assignments. Check driver_tasks table RLS select policy.");
      setDriverTasks([]);
      return;
    }

    setDriverTasks(data || []);
  }

  async function addDriverTask(event) {
    event.preventDefault();
    setDriverTaskMessage("");
    setDriverTaskError("");

    if (!isAuthorized) {
      setDriverTaskError("Owner access required before assigning driver tasks.");
      return;
    }

    const driver = selected.drivers.find((item) => String(item.number) === String(newDriverTaskForm.driver_number));

    if (!driver) {
      setDriverTaskError("Select one of your team drivers before assigning a task.");
      return;
    }

    if (!String(newDriverTaskForm.title || "").trim()) {
      setDriverTaskError("Driver assignment needs a title.");
      return;
    }

    const payload = {
      team: ownerTeamName,
      driver_number: String(driver.number || ""),
      driver_name: driver.name || "",
      title: String(newDriverTaskForm.title || "").trim(),
      description: String(newDriverTaskForm.description || "").trim(),
      reward: String(newDriverTaskForm.reward || "").trim(),
      status: "Assigned",
      assigned_by: ownerTeamName,
      due_race: String(newDriverTaskForm.due_race || "").trim(),
      created_at: new Date().toISOString(),
    };

    const { error: insertDriverTaskError } = await supabase.from("driver_tasks").insert([payload]);

    if (insertDriverTaskError) {
      console.error("Could not create driver assignment:", insertDriverTaskError);
      setDriverTaskError("Could not create driver assignment. Check driver_tasks table RLS insert policy.");
      return;
    }

    setNewDriverTaskForm({ driver_number: "", title: "", description: "", reward: "", due_race: "" });
    setDriverTaskMessage(`Assignment sent to #${payload.driver_number} ${payload.driver_name}.`);
    await loadDriverTasks();
  }



  async function loadOwnerDriverAssignments() {
    if (!safeSelectedTeam) return;
    setOwnerDriverAssignmentLoading(true);
    setOwnerDriverAssignmentError("");

    const { data, error: ownerAssignmentLoadError } = await supabase
      .from("owner_driver_assignments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (ownerAssignmentLoadError) {
      console.error("Could not load owner driver assignments:", ownerAssignmentLoadError);
      setOwnerDriverAssignments([]);
      setOwnerDriverAssignmentError("Could not load substitute requests. Check owner_driver_assignments select policy.");
      setOwnerDriverAssignmentLoading(false);
      return;
    }

    setOwnerDriverAssignments(data || []);
    setOwnerDriverAssignmentLoading(false);
  }

  function updateOwnerDriverAssignmentForm(field, value) {
    setOwnerDriverAssignmentForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOwnerDriverAssignment(event) {
    event.preventDefault();
    setOwnerDriverAssignmentMessage("");
    setOwnerDriverAssignmentError("");

    if (!isAuthorized) {
      setOwnerDriverAssignmentError("Owner access required before submitting a substitute request.");
      return;
    }

    const originalDriver = selected.drivers.find((driver) => String(driver.id || driver.number) === String(ownerDriverAssignmentForm.original_driver_id)) || selectedOwnerAssignmentOriginalDriver;
    const assignedDriver = ownerAssignmentSubstituteOptions.find((driver) =>
      String(driver?.id || driver?.number || driver?.name) === String(ownerDriverAssignmentForm.assigned_driver_id)
    );

    if (!String(ownerDriverAssignmentForm.race_name || "").trim()) {
      setOwnerDriverAssignmentError("Select the race for this assignment.");
      return;
    }

    if (!originalDriver) {
      setOwnerDriverAssignmentError("Select the original team driver/car being replaced.");
      return;
    }

    if (!assignedDriver) {
      setOwnerDriverAssignmentError("Select the substitute driver.");
      return;
    }

    if (String(originalDriver.id || originalDriver.number) === String(assignedDriver.id || assignedDriver.number)) {
      setOwnerDriverAssignmentError("The substitute driver must be different from the original driver.");
      return;
    }

    const payload = {
      series: "cup",
      race_id: String(ownerDriverAssignmentForm.race_name || "").trim(),
      race_name: String(ownerDriverAssignmentForm.race_name || "").trim(),
      team_key: safeSelectedTeam,
      team_name: ownerTeamName,
      owner_name: ownerNames[safeSelectedTeam] || ownerTeamName,
      car_number: String(originalDriver.number || ""),
      original_driver_id: originalDriver.id ? String(originalDriver.id) : null,
      original_driver_name: originalDriver.name || "",
      original_driver_number: String(originalDriver.number || ""),
      assigned_driver_id: assignedDriver.id ? String(assignedDriver.id) : null,
      assigned_driver_name: assignedDriver.name || "",
      assigned_driver_number: String(assignedDriver.number || ""),
      assignment_type: String(ownerDriverAssignmentForm.assignment_type || "substitute"),
      driver_points_awarded: false,
      original_driver_points_awarded: false,
      team_points_awarded: true,
      manufacturer_points_awarded: true,
      status: "pending",
      requested_by: ownerNames[safeSelectedTeam] || ownerTeamName,
      requested_by_role: "owner",
      owner_note: String(ownerDriverAssignmentForm.owner_note || "").trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: insertAssignmentError } = await supabase.from("owner_driver_assignments").insert([payload]);

    if (insertAssignmentError) {
      console.error("Could not submit substitute request:", insertAssignmentError);
      setOwnerDriverAssignmentError("Could not submit substitute request. Check owner_driver_assignments insert policy/columns.");
      return;
    }

    setOwnerDriverAssignmentForm({ race_name: "", original_driver_id: "", assigned_driver_id: "", assignment_type: "substitute", owner_note: "" });
    setOwnerDriverAssignmentMessage("Substitute request sent to Race Operations. Once admin approves, it is final.");
    await loadOwnerDriverAssignments();
  }

  async function cancelOwnerDriverAssignment(assignmentId) {
    if (!assignmentId) return;
    if (!window.confirm("Cancel this driver assignment request?")) return;
    setOwnerDriverAssignmentMessage("");
    setOwnerDriverAssignmentError("");

    const { error: cancelAssignmentError } = await supabase
      .from("owner_driver_assignments")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", assignmentId);

    if (cancelAssignmentError) {
      console.error("Could not cancel driver assignment:", cancelAssignmentError);
      setOwnerDriverAssignmentError("Could not cancel assignment. Check owner_driver_assignments update policy.");
      return;
    }

    setOwnerDriverAssignmentMessage("Driver assignment request cancelled.");
    await loadOwnerDriverAssignments();
  }

  async function updateDriverTaskStatus(taskId, status) {
    setDriverTaskMessage("");
    setDriverTaskError("");

    const { error: updateDriverTaskError } = await supabase
      .from("driver_tasks")
      .update({ status })
      .eq("id", taskId);

    if (updateDriverTaskError) {
      console.error("Could not update driver assignment:", updateDriverTaskError);
      setDriverTaskError("Could not update driver assignment. Check driver_tasks table RLS update policy.");
      return;
    }

    setDriverTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task));
  }

  async function deleteDriverTask(taskId) {
    if (!window.confirm("Delete this driver assignment?")) return;
    setDriverTaskMessage("");
    setDriverTaskError("");

    const { error: deleteDriverTaskError } = await supabase
      .from("driver_tasks")
      .delete()
      .eq("id", taskId);

    if (deleteDriverTaskError) {
      console.error("Could not delete driver assignment:", deleteDriverTaskError);
      setDriverTaskError("Could not delete driver assignment. Check driver_tasks table RLS delete policy.");
      return;
    }

    setDriverTasks((current) => current.filter((task) => task.id !== taskId));
    setDriverTaskMessage("Driver assignment deleted.");
  }

  function updateRivalryForm(field, value) {
    setRivalryForm((current) => ({ ...current, [field]: value }));
  }

  function updateRivalryTeamList(field, event) {
    const values = Array.from(event.target.selectedOptions, (option) => option.value);
    setRivalryForm((current) => ({ ...current, [field]: values }));
  }

  function getManufacturerTeams(manufacturer) {
    return manufacturerTeamMap[manufacturer] || [];
  }

  async function loadTeamRivalries() {
    const { data, error: rivalryLoadError } = await supabase
      .from("team_rivalries")
      .select("*")
      .order("created_at", { ascending: false });

    if (rivalryLoadError) {
      console.error("Failed to load team rivalries:", rivalryLoadError);
      setRivalryError("Could not load rivalries. Check team_rivalries table and RLS select policy.");
      setTeamRivalries([]);
      return;
    }

    setRivalryError("");
    setTeamRivalries(data || []);
  }

  async function createTeamRivalry(event) {
    event?.preventDefault?.();
    setRivalryMessage("");
    setRivalryError("");

    if (!isAuthorized) {
      setRivalryError("Owner access required before creating rivalries.");
      return;
    }

    const rivalryType = rivalryForm.rivalry_type || "Individual Team Rivalry";
    let payload = {
      rivalry_name: String(rivalryForm.rivalry_name || "").trim(),
      rivalry_type: rivalryType,
      storyline: String(rivalryForm.storyline || "").trim(),
      rivalry_level: Math.max(1, Math.min(100, Number(rivalryForm.rivalry_level || 50))),
      status: "Active",
      created_at: new Date().toISOString(),
    };

    if (rivalryType === "Manufacturer Rivalry") {
      const manufacturerA = String(rivalryForm.manufacturer_a || "").trim();
      const manufacturerB = String(rivalryForm.manufacturer_b || "").trim();

      if (!manufacturerA || !manufacturerB) {
        setRivalryError("Select both manufacturers before creating a manufacturer rivalry.");
        return;
      }

      if (manufacturerA === manufacturerB) {
        setRivalryError("A manufacturer cannot be in a rivalry with itself.");
        return;
      }

      const teamsA = getManufacturerTeams(manufacturerA).map(getTeamFullName);
      const teamsB = getManufacturerTeams(manufacturerB).map(getTeamFullName);

      payload = {
        ...payload,
        rivalry_name: payload.rivalry_name || `${manufacturerA} vs ${manufacturerB}`,
        manufacturer_a: manufacturerA,
        manufacturer_b: manufacturerB,
        teams_a: teamsA,
        teams_b: teamsB,
        team_a: `${manufacturerA} Camp`,
        team_b: `${manufacturerB} Camp`,
      };
    } else {
      const teamsA = (rivalryForm.teams_a && rivalryForm.teams_a.length ? rivalryForm.teams_a : rivalryForm.team_a ? [rivalryForm.team_a] : []).map(getTeamFullName);
      const teamsB = (rivalryForm.teams_b && rivalryForm.teams_b.length ? rivalryForm.teams_b : rivalryForm.team_b ? [rivalryForm.team_b] : []).map(getTeamFullName);

      if (teamsA.length === 0 || teamsB.length === 0) {
        setRivalryError("Select at least one team on each side of the rivalry.");
        return;
      }

      const overlap = teamsA.some((team) => teamsB.includes(team));
      if (overlap) {
        setRivalryError("The same team cannot be on both sides of a rivalry.");
        return;
      }

      payload = {
        ...payload,
        rivalry_name: payload.rivalry_name || `${teamsA.join(", ")} vs ${teamsB.join(", ")}`,
        team_a: teamsA[0],
        team_b: teamsB[0],
        teams_a: teamsA,
        teams_b: teamsB,
        manufacturer_a: null,
        manufacturer_b: null,
      };
    }

    const { error: insertRivalryError } = await supabase.from("team_rivalries").insert([payload]);

    if (insertRivalryError) {
      console.error("Could not create rivalry:", insertRivalryError);
      setRivalryError("Could not create rivalry. Check team_rivalries table columns and RLS insert policy.");
      return;
    }

    setRivalryForm({
      rivalry_name: "",
      rivalry_type: "Individual Team Rivalry",
      team_a: "",
      team_b: "",
      teams_a: [],
      teams_b: [],
      manufacturer_a: "",
      manufacturer_b: "",
      storyline: "",
      rivalry_level: 50,
    });
    setRivalryMessage("Rivalry created.");
    await loadTeamRivalries();
  }

  async function updateTeamRivalryStatus(rivalryId, status) {
    setRivalryMessage("");
    setRivalryError("");

    const { error: rivalryUpdateError } = await supabase
      .from("team_rivalries")
      .update({ status })
      .eq("id", rivalryId);

    if (rivalryUpdateError) {
      console.error("Could not update rivalry:", rivalryUpdateError);
      setRivalryError("Could not update rivalry status. Check RLS update policy.");
      return;
    }

    setTeamRivalries((current) => current.map((rivalry) => rivalry.id === rivalryId ? { ...rivalry, status } : rivalry));
    setRivalryMessage(`Rivalry marked ${String(status).toLowerCase()}.`);
  }

  async function deleteTeamRivalry(rivalryId) {
    if (!window.confirm("Delete this rivalry?")) return;
    setRivalryMessage("");
    setRivalryError("");

    const { error: rivalryDeleteError } = await supabase
      .from("team_rivalries")
      .delete()
      .eq("id", rivalryId);

    if (rivalryDeleteError) {
      console.error("Could not delete rivalry:", rivalryDeleteError);
      setRivalryError("Could not delete rivalry. Check RLS delete policy.");
      return;
    }

    setTeamRivalries((current) => current.filter((rivalry) => rivalry.id !== rivalryId));
    setRivalryMessage("Rivalry deleted.");
  }

  React.useEffect(() => {
    if (!isAuthorized) return;
    loadTeamFinance();
    loadContractOffers();
    loadActiveContracts();
    loadTechnicalAlliances();
    loadDriverFeedback();
    loadOwnerTasks();
    loadDriverTasks();
    loadOwnerDriverAssignments();
    loadTeamRivalries();
    loadNumberPool();
    loadTeamTransferLogs();
  }, [isAuthorized, ownerTeamName]);

  async function submitContractOffer() {
    setContractMessage("");
    setContractError("");

    if (!isAuthorized) {
      setContractError("Owner access required before creating contract offers.");
      return;
    }

    const salary = Number(contractForm.salary) || 0;
    const signingBonus = Number(contractForm.signing_bonus) || 0;
    const contractLength = Number(contractForm.contract_length) || 0;
    const buyoutAmount = Number(contractForm.buyout_amount) || 0;
    const championshipBonus = Number(contractForm.championship_bonus) || 0;
    const winBonus = Number(contractForm.win_bonus) || 0;
    const selectedDriver = drivers.find((driver) => driver.name === contractForm.driver_name);
    const isOwnerDriver = selectedDriver && String(selectedDriver.name || "").toLowerCase() === String(ownerNames[safeSelectedTeam] || "").toLowerCase();
    const totalImmediateCost = salary + signingBonus;

    if (!contractForm.driver_name.trim()) {
      setContractError("Select a driver before generating a contract offer.");
      return;
    }

    if (salary < MIN_DRIVER_SALARY) {
      setContractError("Minimum driver salary is $250,000.");
      return;
    }

    if (isOwnerDriver && salary < OWNER_MINIMUM_SALARY) {
      setContractError("Owner-drivers must take a minimum salary of $500,000.");
      return;
    }

    if (contractLength < MIN_CONTRACT_LENGTH) {
      setContractError("Minimum contract length is 1 season.");
      return;
    }

    if (signingBonus < 0 || championshipBonus < 0 || winBonus < 0 || buyoutAmount < 0) {
      setContractError("Contract money fields cannot be negative.");
      return;
    }

    if (buyoutAmount > salary * 1.5) {
      setContractError("Buyout cannot exceed 1.5x the current contract amount. Signing bonus is excluded from buyout.");
      return;
    }

    if (signingBonus > currentTeamBalance) {
      setContractError("Signing bonus cannot exceed the team account balance.");
      return;
    }

    if (totalImmediateCost > currentTeamBalance) {
      setContractError("Salary plus signing bonus exceeds your available team balance.");
      return;
    }

    const payload = {
      driver_name: contractForm.driver_name.trim(),
      driver_number: String(contractForm.driver_number || "").trim(),
      team: ownerTeamName,
      manufacturer: String(contractForm.manufacturer || "").trim(),
      salary,
      signing_bonus: signingBonus,
      contract_length: contractLength,
      buyout_amount: buyoutAmount,
      notes: contractForm.notes,
      status: "Pending",
      expires_at: contractForm.expires_at || null,
      created_by_team: ownerTeamName,
      no_trade_clause: Boolean(contractForm.no_trade_clause),
      team_option: Boolean(contractForm.team_option),
      mutual_option: Boolean(contractForm.mutual_option),
      championship_bonus: championshipBonus,
      win_bonus: winBonus,
      guaranteed_seat: Boolean(contractForm.guaranteed_seat),
      media_requirements: contractForm.media_requirements,
      brand_style: contractForm.brand_style,
    };

    const { error: insertError } = await supabase.from("contract_offers").insert([payload]);

    if (insertError) {
      console.error("Could not create contract offer:", insertError);
      setContractError("Could not create contract offer. Check that the contract_offers table exists and RLS allows inserts.");
      return;
    }

    setContractMessage(`Contract offer sent to ${payload.driver_name}'s driver page.`);
    setContractForm(DEFAULT_CONTRACT_FORM);
    await loadContractOffers();
    await loadActiveContracts();
  }

  async function withdrawContractOffer(offerId) {
    setContractMessage("");
    setContractError("");

    const { error: withdrawError } = await supabase
      .from("contract_offers")
      .update({ status: "Withdrawn", updated_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("created_by_team", ownerTeamName);

    if (withdrawError) {
      console.error("Could not withdraw offer:", withdrawError);
      setContractError("Could not withdraw this offer.");
      return;
    }

    setContractMessage("Contract offer withdrawn.");
    await loadContractOffers();
    await loadActiveContracts();
  }

  async function requestTechnicalAlliance() {
    setAllianceMessage("");
    setAllianceError("");

    if (!isAuthorized) {
      setAllianceError("Owner access required before requesting a technical alliance.");
      return;
    }

    if (!alliancePartner) {
      setAllianceError("Select a team to request a technical alliance with.");
      return;
    }

    const partnerName = getTeamFullName(alliancePartner);
    if (partnerName === ownerTeamName) {
      setAllianceError("A team cannot form a technical alliance with itself.");
      return;
    }

    const existing = technicalAlliances.find((alliance) => {
      const a = String(alliance.team || "").toLowerCase();
      const b = String(alliance.alliance_team || "").toLowerCase();
      const mine = ownerTeamName.toLowerCase();
      const partner = partnerName.toLowerCase();
      return (a === mine && b === partner) || (a === partner && b === mine);
    });

    if (existing && ["Pending", "Accepted"].includes(existing.status)) {
      setAllianceError(`There is already a ${existing.status.toLowerCase()} alliance with ${partnerName}.`);
      return;
    }

    const { error: allianceInsertError } = await supabase.from("technical_alliances").insert([{
      team: ownerTeamName,
      alliance_team: partnerName,
      cost_per_team: TECHNICAL_ALLIANCE_COST,
      status: "Pending",
    }]);

    if (allianceInsertError) {
      console.error("Could not request technical alliance:", allianceInsertError);
      setAllianceError("Could not request technical alliance. Check the technical_alliances table and RLS policies.");
      return;
    }

    setAlliancePartner("");
    setAllianceMessage(`Technical alliance request sent to ${partnerName}. No money is charged until they accept.`);
    await loadTechnicalAlliances();
  }

  async function updateTechnicalAllianceStatus(allianceId, status) {
    setAllianceMessage("");
    setAllianceError("");

    const { error: allianceUpdateError } = await supabase
      .from("technical_alliances")
      .update({ status })
      .eq("id", allianceId);

    if (allianceUpdateError) {
      console.error("Could not update technical alliance:", allianceUpdateError);
      setAllianceError("Could not update this technical alliance.");
      return;
    }

    setAllianceMessage(`Technical alliance ${status.toLowerCase()}.`);
    await loadTechnicalAlliances();
  }

  async function unlockTeam() {
    const enteredCode = normalizeAccessCode(accessCode);

    if (!enteredCode) {
      setError("Enter your owner driver password, temporary password, or master admin password.");
      return;
    }

    const latestOwnerCodes = await loadRemoteOwnerAccessCodes();
    const latestDriverCodes = await loadRemoteOwnerDriverAccessCodes();
    const teamOwnerAssignments = await loadTeamOwnerAssignments();
    setOwnerAccessCodes(latestOwnerCodes);

    const assignedOwner = getAssignedOwnerForTeam(safeSelectedTeam, teamOwnerAssignments);
    const assignedOwnerNumber = assignedOwner?.owner_driver_number ? String(assignedOwner.owner_driver_number).trim() : "";
    const assignedOwnerName = assignedOwner?.owner_driver_name ? String(assignedOwner.owner_driver_name).trim().toLowerCase() : "";

    const manualOwnerKeys = OWNER_DRIVER_KEYS[safeSelectedTeam] || OWNER_DRIVER_KEYS[getTeamFullName(safeSelectedTeam)] || [];
    const allOwnerKeys = [
      assignedOwnerNumber,
      assignedOwnerName,
      ...manualOwnerKeys,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim());

    const driverCodeValues = [];
    allOwnerKeys.forEach((key) => {
      const cleanKey = String(key).trim();
      const lowerKey = cleanKey.toLowerCase();
      if (latestDriverCodes[cleanKey]) driverCodeValues.push(latestDriverCodes[cleanKey]);
      if (latestDriverCodes[lowerKey]) driverCodeValues.push(latestDriverCodes[lowerKey]);
      if (latestDriverCodes[cleanKey.toUpperCase()]) driverCodeValues.push(latestDriverCodes[cleanKey.toUpperCase()]);
    });

    const expectedOwnerCode = normalizeAccessCode(
      latestOwnerCodes[safeSelectedTeam] ||
      latestOwnerCodes[getTeamFullName(safeSelectedTeam)] ||
      ownerAccessCodes[safeSelectedTeam] ||
      ownerAccessCodes[getTeamFullName(safeSelectedTeam)] ||
      ""
    );

    const hardFallbackCode = normalizeAccessCode(
      OWNER_DRIVER_FALLBACK_CODES[safeSelectedTeam] ||
      OWNER_DRIVER_FALLBACK_CODES[getTeamFullName(safeSelectedTeam)] ||
      ""
    );

    const allowedCodes = [
      normalizeAccessCode(MASTER_ACCESS_CODE),
      expectedOwnerCode,
      hardFallbackCode,
      ...driverCodeValues.map(normalizeAccessCode),
      ...getOwnerDriverCodesForTeam(safeSelectedTeam, latestDriverCodes),
    ].filter(Boolean);

    if (!allowedCodes.includes(enteredCode)) {
      const ownerNameForMessage =
        assignedOwner?.owner_driver_name ||
        (safeSelectedTeam === "B2J" ? "RookieVet99" : "the assigned owner driver");

      setError(`Incorrect code for this team. Use ${ownerNameForMessage}'s driver profile password, a temp password, or the master admin password.`);
      return;
    }

    localStorage.setItem("ownerPortalTeam", safeSelectedTeam);
    localStorage.setItem("ownerPortalAuthorizedTeam", safeSelectedTeam);
    setAuthorizedTeam(safeSelectedTeam);
    setError("");
  }

  function switchTeam(team) {
    setSelectedTeam(team);
    setAccessCode("");
    setError("");
    localStorage.setItem("ownerPortalTeam", team);
    if (authorizedTeam !== team) localStorage.removeItem("ownerPortalAuthorizedTeam");
    if (authorizedTeam !== team) setAuthorizedTeam("");
  }

  function lockPortal() {
    localStorage.removeItem("ownerPortalAuthorizedTeam");
    setAuthorizedTeam("");
    setAccessCode("");
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>Team HQ</div>
                <div style={{ opacity: 0.72, marginTop: 5 }}>{seasonName || "Active Season"} · Owner Command Center · Contracts · Morale · Franchise Mode</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>Standings</button>
              {isAuthorized && <button onClick={lockPortal} style={secondaryButtonStyle}>Lock Team View</button>}
            </div>
          </div>
        </div>

        <div style={{ ...sectionCardStyle, borderColor: isAuthorized ? "#d4af37" : "#3d4859" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TEAM HQ</div>
              <select value={safeSelectedTeam} onChange={(event) => switchTeam(event.target.value)} style={inputStyle}>
                {availableTeams.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
              </select>
            </div>
            {!isAuthorized && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>OWNER CODE</div>
                <input
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") unlockTeam(); }}
                  placeholder={`Enter ${getTeamFullName(safeSelectedTeam)} owner code`}
                  style={inputStyle}
                />
              </div>
            )}
            {!isAuthorized && <button onClick={unlockTeam} style={primaryButtonStyle}>Unlock My Team</button>}
          </div>
          {!isAuthorized && (
            <div style={{ marginTop: 14, fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
              Team HQ replaces the old owner portal. Owners unlock their team to manage contracts, budget, morale, alliances, and franchise systems.
            </div>
          )}
          {error && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{error}</div>}
        </div>

        {!isAuthorized ? (
          <div style={{ ...sectionCardStyle, textAlign: "center", padding: 34 }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Locked Team HQ</div>
            <div style={{ opacity: 0.72 }}>Unlock your team to view contracts, roster, budget, morale, manufacturer support, rivalries, and franchise value.</div>
          </div>
        ) : (
          <>
            <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #171b22 0%, #10141b 100%)", borderColor: "#d4af37" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  {teamLogos[selected.team] && (
                    <div style={{ width: 92, height: 92, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
                      <img src={teamLogos[selected.team]} alt={selected.team} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 900 }}>{getTeamFullName(selected.team)}</div>
                    <div style={{ opacity: 0.7, marginTop: 4 }}>Owner: {selected.owner}</div>
                    <div style={{ opacity: 0.55, fontSize: 12, marginTop: 4 }}>Only this team’s information is shown.</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>PROJECTED TEAM BUDGET</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: selected.projectedBudget >= selected.startingBudget ? "#4ade80" : "#f87171" }}>{money(selected.projectedBudget)}</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Starting Budget", value: money(selected.startingBudget) },
                { label: "Race Income", value: money(selected.raceIncome) },
                { label: "DNF Costs", value: money(selected.dnfCosts) },
                { label: "Penalty Costs", value: money(selected.penaltyCosts) },
                { label: "Alliance Cost", value: money(selected.allianceCosts) },
                { label: "Independent Driver Pay", value: money(selected.independentPayouts) },
                { label: "Net", value: money(selected.netRevenue), good: selected.netRevenue >= 0 },
                { label: "Active Contracts", value: activeContracts.length },
                { label: "Open Tasks", value: openTaskCount },
                { label: "Team Points", value: selected.points },
                { label: "Team Wins", value: selected.wins },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#131922", border: "1px solid #2d3643", borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: stat.good === undefined ? "white" : stat.good ? "#4ade80" : "#f87171" }}>{stat.value}</div>
                </div>
              ))}
            </div>

            <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {hqTabs.map(([tab, label]) => (
                  <button key={tab} onClick={() => setActiveHqTab(tab)} style={tabButtonStyle(tab)}>{label}</button>
                ))}
              </div>
            </div>

            {activeHqTab === "tasks" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>✅ Owner Tasks</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Weekly owner objectives for performance, morale, media, finances, and franchise growth.</div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button onClick={loadOwnerTasks} style={secondaryButtonStyle}>Refresh Tasks</button>
                    <button onClick={addSuggestedTasks} style={primaryButtonStyle}>Use Suggested Task</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Open Tasks</div><div style={{ fontSize: 28, fontWeight: 900 }}>{openTaskCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Completed</div><div style={{ fontSize: 28, fontWeight: 900 }}>{completedTaskCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Completion Rate</div><div style={{ fontSize: 28, fontWeight: 900 }}>{taskCompletionRate}%</div></div>
                </div>

                <form onSubmit={addOwnerTask} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TASK TITLE</div>
                      <input value={newTaskForm.title} onChange={(event) => setNewTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Finish with two cars in the Top 10" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TASK TYPE</div>
                      <select value={newTaskForm.task_type} onChange={(event) => setNewTaskForm((current) => ({ ...current, task_type: event.target.value }))} style={inputStyle}>
                        <option value="Performance">Performance</option>
                        <option value="Media">Media</option>
                        <option value="Morale">Morale</option>
                        <option value="Financial">Financial</option>
                        <option value="Development">Development</option>
                        <option value="Rivalry">Rivalry</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REWARD</div>
                      <input value={newTaskForm.reward} onChange={(event) => setNewTaskForm((current) => ({ ...current, reward: event.target.value }))} placeholder="+5 morale / $50,000 bonus" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REWARD VALUE</div>
                      <input type="number" value={newTaskForm.reward_value} onChange={(event) => setNewTaskForm((current) => ({ ...current, reward_value: event.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DESCRIPTION</div>
                    <textarea value={newTaskForm.description} onChange={(event) => setNewTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Explain what the owner needs to accomplish this week." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                  </div>
                  <button type="submit" style={{ ...primaryButtonStyle, marginTop: 12 }}>Add Owner Task</button>
                  {taskMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{taskMessage}</div>}
                  {taskError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{taskError}</div>}
                </form>

                {ownerTasks.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No owner tasks created yet. Add a task or click “Use Suggested Task.”</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    {ownerTasks.map((task) => (
                      <div key={task.id} style={{ background: task.completed ? "#102a16" : "#0f1319", border: `1px solid ${task.completed ? "#22c55e" : "#2c3440"}`, borderRadius: 14, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.65, textTransform: "uppercase" }}>{task.task_type || "Task"}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{task.completed ? "✅ " : "⬜ "}{task.title}</div>
                          </div>
                          <button onClick={() => toggleOwnerTask(task)} style={task.completed ? secondaryButtonStyle : primaryButtonStyle}>{task.completed ? "Mark Open" : "Complete"}</button>
                        </div>
                        {task.description && <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>{task.description}</div>}
                        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#d4af37" }}>Reward: {task.reward || "—"}</div>
                          <button onClick={() => deleteOwnerTask(task.id)} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeHqTab === "assignments" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🏁 Driver Assignment Center</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>
                      Submit substitute, emergency replacement, one-off start, development call-up, or start-and-park assignments for Race Operations approval.
                    </div>
                  </div>
                  <button type="button" onClick={loadOwnerDriverAssignments} style={secondaryButtonStyle}>Refresh Requests</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Pending Admin</div><div style={{ fontSize: 28, fontWeight: 900 }}>{pendingOwnerDriverAssignmentCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Admin Approved / Final</div><div style={{ fontSize: 28, fontWeight: 900 }}>{acceptedOwnerDriverAssignmentCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Accepted / Active</div><div style={{ fontSize: 28, fontWeight: 900 }}>{acceptedOwnerDriverAssignmentCount}</div></div>
                </div>

                <form onSubmit={submitOwnerDriverAssignment} style={{ background: "#0f1319", border: "1px solid #d4af37", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Submit Assignment Request</h3>
                  <div style={{ opacity: 0.68, fontSize: 13, marginBottom: 12 }}>
                    After admin approval, the assigned driver will receive this request in Driver HQ to accept or decline.
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RACE</div>
                      <select value={ownerDriverAssignmentForm.race_name} onChange={(event) => updateOwnerDriverAssignmentForm("race_name", event.target.value)} style={inputStyle}>
                        <option value="">Select race...</option>
                        {ownerAssignmentRaceOptions.map((race) => (
                          <option key={race.name} value={race.name}>{race.name}{race.date ? ` • ${race.date}` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>ORIGINAL TEAM DRIVER / CAR</div>
                      <select value={ownerDriverAssignmentForm.original_driver_id} onChange={(event) => updateOwnerDriverAssignmentForm("original_driver_id", event.target.value)} style={inputStyle}>
                        <option value="">Select original driver...</option>
                        {selected.drivers.map((driver) => (
                          <option key={`${driver.id || driver.number}-original`} value={driver.id || driver.number}>#{driver.number} {driver.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>ASSIGNED / SUBSTITUTE DRIVER</div>
                      <select value={ownerDriverAssignmentForm.assigned_driver_id} onChange={(event) => updateOwnerDriverAssignmentForm("assigned_driver_id", event.target.value)} style={inputStyle}>
                        <option value="">Select substitute...</option>
                        {ownerAssignmentSubstituteOptions.map((driver) => (
                          <option key={`${driver.id || driver.number || driver.name}-assigned`} value={driver.id || driver.number || driver.name}>
                            {driver.number ? `#${driver.number} ` : ""}{driver.name} • Substitute Driver
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>ASSIGNMENT TYPE</div>
                      <select value={ownerDriverAssignmentForm.assignment_type} onChange={(event) => updateOwnerDriverAssignmentForm("assignment_type", event.target.value)} style={inputStyle}>
                        <option value="substitute">Substitute</option>
                        <option value="development_call_up">Development Call-Up</option>
                        <option value="emergency_replacement">Emergency Replacement</option>
                        <option value="one_off_start">One-Off Start</option>
                        <option value="start_park">Start & Park</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>OWNER NOTE / REASON</div>
                    <textarea value={ownerDriverAssignmentForm.owner_note} onChange={(event) => updateOwnerDriverAssignmentForm("owner_note", event.target.value)} placeholder="Explain why this assignment is needed." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                  </div>
                  <button type="submit" style={{ ...primaryButtonStyle, marginTop: 12 }}>Submit to Race Operations</button>
                  {ownerDriverAssignmentMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{ownerDriverAssignmentMessage}</div>}
                  {ownerDriverAssignmentError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{ownerDriverAssignmentError}</div>}
                </form>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Assignment Requests</h3>
                  {ownerDriverAssignmentLoading && <div style={{ opacity: 0.7, fontSize: 13, fontWeight: 800 }}>Loading...</div>}
                </div>

                {teamOwnerDriverAssignments.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No substitute or driver assignment requests submitted yet.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
                    {teamOwnerDriverAssignments.map((assignment) => {
                      const statusMeta = getOwnerAssignmentStatusMeta(assignment.status);
                      const canCancel = ["pending"].includes(String(assignment.status || "pending").toLowerCase());
                      return (
                        <div key={assignment.id || `${assignment.race_name}-${assignment.original_driver_number}-${assignment.assigned_driver_number}`} style={{ background: statusMeta.background, border: `1px solid ${statusMeta.border}`, borderRadius: 14, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, textTransform: "uppercase" }}>{getOwnerAssignmentTypeLabel(assignment.assignment_type)} • {assignment.race_name || assignment.race_id || "Race"}</div>
                              <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>#{assignment.original_driver_number || assignment.car_number} → #{assignment.assigned_driver_number}</div>
                            </div>
                            <div style={{ color: statusMeta.color, fontWeight: 900, fontSize: 12, textAlign: "right" }}>{statusMeta.label}</div>
                          </div>
                          <div style={{ marginTop: 12, opacity: 0.84, lineHeight: 1.55 }}>
                            <div><strong>Original:</strong> #{assignment.original_driver_number || assignment.car_number} {assignment.original_driver_name || ""}</div>
                            <div><strong>Assigned:</strong> #{assignment.assigned_driver_number || ""} {assignment.assigned_driver_name || ""}</div>
                            {assignment.driver_response && <div><strong>Driver Response:</strong> {String(assignment.driver_response).toUpperCase()}</div>}
                            {assignment.owner_note && <div><strong>Note:</strong> {assignment.owner_note}</div>}
                          </div>
                          {canCancel && (
                            <div style={{ marginTop: 12 }}>
                              <button type="button" onClick={() => cancelOwnerDriverAssignment(assignment.id)} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Cancel Request</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid #2c3440" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Weekly Driver Tasks</h3>
                      <div style={{ opacity: 0.62, fontSize: 13, marginTop: 4 }}>This keeps the old weekly task tool separate from race substitution requests.</div>
                    </div>
                    <button onClick={loadDriverTasks} style={secondaryButtonStyle}>Refresh Tasks</button>
                  </div>

                  <form onSubmit={addDriverTask} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                        <select value={newDriverTaskForm.driver_number} onChange={(event) => setNewDriverTaskForm((current) => ({ ...current, driver_number: event.target.value }))} style={inputStyle}>
                          <option value="">Select driver...</option>
                          {selected.drivers.map((driver) => (
                            <option key={`${driver.number}-${driver.name}`} value={driver.number}>#{driver.number} {driver.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TASK TITLE</div>
                        <input value={newDriverTaskForm.title} onChange={(event) => setNewDriverTaskForm((current) => ({ ...current, title: event.target.value }))} placeholder="Finish inside the Top 10" style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DUE RACE</div>
                        <input value={newDriverTaskForm.due_race} onChange={(event) => setNewDriverTaskForm((current) => ({ ...current, due_race: event.target.value }))} placeholder="Daytona (Night)" style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REWARD</div>
                        <input value={newDriverTaskForm.reward} onChange={(event) => setNewDriverTaskForm((current) => ({ ...current, reward: event.target.value }))} placeholder="+$25,000 bonus / +5 morale" style={inputStyle} />
                      </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DESCRIPTION</div>
                      <textarea value={newDriverTaskForm.description} onChange={(event) => setNewDriverTaskForm((current) => ({ ...current, description: event.target.value }))} placeholder="Explain what this driver needs to accomplish." style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} />
                    </div>
                    <button type="submit" style={{ ...primaryButtonStyle, marginTop: 12 }}>Send Weekly Task</button>
                    {driverTaskMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{driverTaskMessage}</div>}
                    {driverTaskError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{driverTaskError}</div>}
                  </form>

                  {driverTasks.length === 0 ? (
                    <div style={{ opacity: 0.72 }}>No weekly driver tasks created yet.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                      {driverTasks.map((task) => {
                        const status = String(task.status || "Assigned");
                        const completed = status === "Completed";
                        return (
                          <div key={task.id} style={{ background: completed ? "#102a16" : "#0f1319", border: `1px solid ${completed ? "#22c55e" : "#2c3440"}`, borderRadius: 14, padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.65, textTransform: "uppercase" }}>#{task.driver_number} {task.driver_name} • {status}</div>
                                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{completed ? "✅ " : "🎯 "}{task.title}</div>
                              </div>
                              <button onClick={() => updateDriverTaskStatus(task.id, completed ? "Assigned" : "Completed")} style={completed ? secondaryButtonStyle : primaryButtonStyle}>{completed ? "Reopen" : "Complete"}</button>
                            </div>
                            {task.description && <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5, marginTop: 10 }}>{task.description}</div>}
                            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                              <div>
                                {task.due_race && <div style={{ fontSize: 12, opacity: 0.65 }}>Due: {task.due_race}</div>}
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#d4af37" }}>Reward: {task.reward || "—"}</div>
                              </div>
                              <button onClick={() => deleteDriverTask(task.id)} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Delete</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}


            {activeHqTab === "startpark" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🏁 Start & Park Requests</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Team HQ can request Start & Park before Saturday 9:00 PM ET. Admin approval places approved cars at the rear in order received.</div>
                  </div>
                  <button type="button" onClick={loadTeamStartParkRequests} style={secondaryButtonStyle}>Refresh</button>
                </div>

                <form onSubmit={submitTeamStartParkRequest} style={{ background: "#0f1319", border: "1px solid #d4af37", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>🏁 Request Start & Park</h3>
                  <div style={{ opacity: 0.68, fontSize: 13, marginBottom: 12 }}>Team HQ can request Start & Park for its drivers until Saturday 9:00 PM ET. Race Control approval places approved cars at the rear by receipt order.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                      <select value={teamStartParkForm.driver_id} onChange={(event) => setTeamStartParkForm((current) => ({ ...current, driver_id: event.target.value }))} style={inputStyle}>
                        <option value="">Select driver</option>
                        {(selected?.drivers || []).map((driver) => <option key={driver.id || driver.number} value={driver.id || driver.number}>#{driver.number} {driver.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RACE</div>
                      <select value={teamStartParkForm.race_name} onChange={(event) => updateTeamStartParkRace(event.target.value)} style={inputStyle}>
                        <option value="">Select race</option>
                        {startParkRaceOptions.map((race) => <option key={race.name} value={race.name}>{race.name} — deadline 9:00 PM ET</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REASON OPTIONAL</div>
                      <input value={teamStartParkForm.reason} onChange={(event) => setTeamStartParkForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Start & Park reason" style={inputStyle} maxLength={500} />
                    </div>
                  </div>
                  <button type="submit" disabled={teamStartParkSubmitting} style={{ ...primaryButtonStyle, marginTop: 14, opacity: teamStartParkSubmitting ? 0.65 : 1 }}>{teamStartParkSubmitting ? "Submitting..." : "Submit Start & Park Request"}</button>
                  {teamStartParkMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{teamStartParkMessage}</div>}
                  {teamStartParkError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{teamStartParkError}</div>}

                  <div style={{ overflowX: "auto", marginTop: 14 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Driver</th><th style={thStyle}>Requested</th><th style={thStyle}>Status</th></tr></thead>
                      <tbody>
                        {teamStartParkRequests.slice(0, 8).map((request) => <tr key={request.id || `${request.driver_number}-${request.created_at}`}><td style={tdStyle}>{request.race_name}</td><td style={tdStyle}>#{request.driver_number} {request.driver_name}</td><td style={tdStyle}>{request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</td><td style={{ ...tdStyle, fontWeight: 900 }}>{String(request.status || "pending").toUpperCase()}</td></tr>)}
                        {teamStartParkRequests.length === 0 && <tr><td style={tdStyle} colSpan={4}>No Start & Park requests from this team yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </form>

              </div>
            )}

            {activeHqTab === "transfers" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>💰 Team Deals & Transfers</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Use the dropdown to choose the deal type. Money deducts immediately when sent or when a request is paid.</div>
                  </div>
                  <button onClick={() => { loadTeamTransferLogs(); loadTeamTransferRequests(); }} style={secondaryButtonStyle}>Refresh</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>Current Team Balance</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80" }}>{money(currentTeamBalance)}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>Pending Requests</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{teamTransferRequests.filter((row) => String(row.status || "pending").toLowerCase() === "pending").length}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>Logged Transfers</div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{teamTransferLogs.length}</div>
                  </div>
                </div>


                <form onSubmit={submitTeamStartParkRequest} style={{ background: "#0f1319", border: "1px solid #d4af37", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>🏁 Request Start & Park</h3>
                  <div style={{ opacity: 0.68, fontSize: 13, marginBottom: 12 }}>Team HQ can request Start & Park for its drivers until Saturday 9:00 PM ET. Race Control approval places approved cars at the rear by receipt order.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                      <select value={teamStartParkForm.driver_id} onChange={(event) => setTeamStartParkForm((current) => ({ ...current, driver_id: event.target.value }))} style={inputStyle}>
                        <option value="">Select driver</option>
                        {(selected?.drivers || []).map((driver) => <option key={driver.id || driver.number} value={driver.id || driver.number}>#{driver.number} {driver.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RACE</div>
                      <select value={teamStartParkForm.race_name} onChange={(event) => updateTeamStartParkRace(event.target.value)} style={inputStyle}>
                        <option value="">Select race</option>
                        {startParkRaceOptions.map((race) => <option key={race.name} value={race.name}>{race.name} — deadline 9:00 PM ET</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REASON OPTIONAL</div>
                      <input value={teamStartParkForm.reason} onChange={(event) => setTeamStartParkForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Start & Park reason" style={inputStyle} maxLength={500} />
                    </div>
                  </div>
                  <button type="submit" disabled={teamStartParkSubmitting} style={{ ...primaryButtonStyle, marginTop: 14, opacity: teamStartParkSubmitting ? 0.65 : 1 }}>{teamStartParkSubmitting ? "Submitting..." : "Submit Start & Park Request"}</button>
                  {teamStartParkMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{teamStartParkMessage}</div>}
                  {teamStartParkError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{teamStartParkError}</div>}

                  <div style={{ overflowX: "auto", marginTop: 14 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Driver</th><th style={thStyle}>Requested</th><th style={thStyle}>Status</th></tr></thead>
                      <tbody>
                        {teamStartParkRequests.slice(0, 8).map((request) => <tr key={request.id || `${request.driver_number}-${request.created_at}`}><td style={tdStyle}>{request.race_name}</td><td style={tdStyle}>#{request.driver_number} {request.driver_name}</td><td style={tdStyle}>{request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</td><td style={{ ...tdStyle, fontWeight: 900 }}>{String(request.status || "pending").toUpperCase()}</td></tr>)}
                        {teamStartParkRequests.length === 0 && <tr><td style={tdStyle} colSpan={4}>No Start & Park requests from this team yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </form>

                <form onSubmit={teamTransferForm.mode === "request" ? createTeamPaymentRequest : sendTeamTransfer} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>ACTION</div>
                      <select value={teamTransferForm.mode} onChange={(event) => updateTeamTransferField("mode", event.target.value)} style={inputStyle}>
                        <option value="send">Send Funds Now</option>
                        <option value="request">Request Funds From Team</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DEAL TYPE</div>
                      <select value={teamTransferForm.deal_type} onChange={(event) => updateTeamTransferField("deal_type", event.target.value)} style={inputStyle}>
                        <option value="general">General Team Payment</option>
                        <option value="driver_buyout">Driver Contract Buyout</option>
                        <option value="number_sale">Number Sale / Transfer</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>{teamTransferForm.mode === "request" ? "REQUEST FROM / BUYER" : "SEND TO / RECEIVER"}</div>
                      <select value={teamTransferForm.to_team} onChange={(event) => updateTeamTransferField("to_team", event.target.value)} style={inputStyle}>
                        <option value="">Select team</option>
                        {availableTeams.filter((team) => team !== safeSelectedTeam && getTeamFullName(team) !== getTeamFullName(safeSelectedTeam)).map((team) => (
                          <option key={team} value={team}>{getTeamFullName(team)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>AMOUNT</div>
                      <input type="number" min="1" step="1" value={teamTransferForm.amount} onChange={(event) => updateTeamTransferField("amount", event.target.value)} placeholder="250000" style={inputStyle} />
                    </div>
                  </div>

                  {teamTransferForm.deal_type === "driver_buyout" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                        <select value={teamTransferForm.driver_id} onChange={(event) => updateTeamTransferField("driver_id", event.target.value)} style={inputStyle}>
                          <option value="">Select driver</option>
                          {availableDriversForOffers.map((driver) => (
                            <option key={driver.id || driver.number} value={driver.id || driver.number}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>BUYING TEAM ASSIGNS NEW NUMBER</div>
                        <input type="number" min="1" max="99" value={teamTransferForm.new_number} onChange={(event) => updateTeamTransferField("new_number", event.target.value)} placeholder="41" style={inputStyle} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>NEW MANUFACTURER</div>
                        <select value={teamTransferForm.new_manufacturer} onChange={(event) => updateTeamTransferField("new_manufacturer", event.target.value)} style={inputStyle}>
                          <option value="">Keep Current</option>
                          <option value="Chevrolet">Chevrolet</option>
                          <option value="Ford">Ford</option>
                          <option value="Toyota">Toyota</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {teamTransferForm.deal_type === "number_sale" && (
                    <div style={{ background: "#11161d", border: "1px solid #313947", borderRadius: 12, padding: 12, marginTop: 12 }}>
                      <div style={{ color: "#d4af37", fontWeight: 900, marginBottom: 10 }}>Number transfers must be requested by the selling team. The buyer can only pay the request; they cannot directly steal/claim the number.</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>NUMBER YOU ARE SELLING</div>
                          <select value={teamTransferForm.number} onChange={(event) => updateTeamTransferField("number", event.target.value)} style={inputStyle} disabled={teamTransferForm.mode !== "request"}>
                            <option value="">Select owned number</option>
                            {teamOwnedNumberRows.map((row) => <option key={row.id || row.number} value={row.number}>#{row.number} — {row.status || "owned"}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>BUYER ASSIGNS TO DRIVER OPTIONAL</div>
                          <select value={teamTransferForm.assign_to_driver_id} onChange={(event) => updateTeamTransferField("assign_to_driver_id", event.target.value)} style={inputStyle}>
                            <option value="">Do not assign yet</option>
                            {availableDriversForOffers.map((driver) => (
                              <option key={driver.id || driver.number} value={driver.id || driver.number}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REASON</div>
                      <input value={teamTransferForm.reason} onChange={(event) => updateTeamTransferField("reason", event.target.value)} placeholder="Buyout, alliance help, number sale..." style={inputStyle} maxLength={160} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TERMS</div>
                      <input value={teamTransferForm.terms} onChange={(event) => updateTeamTransferField("terms", event.target.value)} placeholder="Seller terms, payment conditions, notes..." style={inputStyle} maxLength={240} />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                    <button type="submit" disabled={teamTransferBusy} style={{ ...primaryButtonStyle, opacity: teamTransferBusy ? 0.65 : 1 }}>{teamTransferBusy ? "Working..." : teamTransferForm.mode === "request" ? "Send Payment Request" : "Send Funds Now"}</button>
                    <span style={{ opacity: 0.68, fontSize: 13 }}>Driver buyouts update roster after payment. Number sales transfer only after the seller's request is paid.</span>
                  </div>
                  {teamTransferMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{teamTransferMessage}</div>}
                  {teamTransferError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{teamTransferError}</div>}
                </form>

                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Pending / Recent Requests</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Status</th>
                          <th style={thStyle}>Requested By</th>
                          <th style={thStyle}>Requested From</th>
                          <th style={thStyle}>Type</th>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Follow-On</th>
                          <th style={thStyle}>Terms</th>
                          <th style={thStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamTransferRequests.map((row) => {
                          const status = String(row.status || "pending").toLowerCase();
                          const canPay = status === "pending" && currentTeamMatches(row.requested_from_team);
                          const canDecline = status === "pending" && (currentTeamMatches(row.requested_from_team) || currentTeamMatches(row.requested_by_team));
                          return (
                            <tr key={row.id || `${row.created_at}-${row.requested_by_team}-${row.requested_from_team}`}>
                              <td style={{ ...tdStyle, fontWeight: 900 }}>{status.toUpperCase()}</td>
                              <td style={tdStyle}>{getTeamFullName(row.requested_by_team)}</td>
                              <td style={tdStyle}>{getTeamFullName(row.requested_from_team)}</td>
                              <td style={tdStyle}>{String(row.deal_type || "general").replace(/_/g, " ")}</td>
                              <td style={{ ...tdStyle, fontWeight: 900 }}>{money(row.amount)}</td>
                              <td style={tdStyle}>{row.deal_type === "driver_buyout" ? `Driver: ${row.driver_name || row.driver_number || "—"} → ${getTeamFullName(row.new_team)}` : row.deal_type === "number_sale" ? `#${row.number} → ${getTeamFullName(row.requested_from_team)}` : "—"}</td>
                              <td style={tdStyle}>{row.terms || row.reason || "—"}</td>
                              <td style={tdStyle}>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  {canPay && <button onClick={() => payTeamPaymentRequest(row)} style={{ ...primaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Pay</button>}
                                  {canDecline && <button onClick={() => declineTeamPaymentRequest(row)} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Decline</button>}
                                  {!canPay && !canDecline && <span style={{ opacity: 0.6 }}>—</span>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {teamTransferRequests.length === 0 && <tr><td style={tdStyle} colSpan={8}>No payment requests yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <h3>Completed Transfer Log</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>From</th>
                        <th style={thStyle}>To</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Amount</th>
                        <th style={thStyle}>Reason / Terms</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamTransferLogs.map((row) => (
                        <tr key={row.id || `${row.created_at}-${row.from_team}-${row.to_team}`}>
                          <td style={tdStyle}>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                          <td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(row.from_team)}</td>
                          <td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(row.to_team)}</td>
                          <td style={tdStyle}>{String(row.deal_type || "general").replace(/_/g, " ")}</td>
                          <td style={{ ...tdStyle, fontWeight: 900, color: currentTeamMatches(row.from_team) ? "#f87171" : "#4ade80" }}>{currentTeamMatches(row.from_team) ? "-" : "+"}{money(row.amount)}</td>
                          <td style={tdStyle}>{row.terms || row.reason || "—"}</td>
                        </tr>
                      ))}
                      {teamTransferLogs.length === 0 && (
                        <tr><td style={tdStyle} colSpan={6}>No team transfers logged yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeHqTab === "numbers" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🔢 Number Pool</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Purchase available car numbers from the league pool for {money(NUMBER_PURCHASE_PRICE)} each. Active driver numbers are locked and do not appear as available.</div>
                  </div>
                  <button onClick={loadNumberPool} style={secondaryButtonStyle}>Refresh Numbers</button>
                </div>

                {numberMarketMessage && <div style={{ marginBottom: 12, color: "#4ade80", fontWeight: 900 }}>{numberMarketMessage}</div>}
                {numberMarketError && <div style={{ marginBottom: 12, color: "#f87171", fontWeight: 900 }}>{numberMarketError}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>TEAM BALANCE</div>
                    <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 4 }}>{money(currentTeamBalance)}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>NUMBER PRICE</div>
                    <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 4 }}>{money(NUMBER_PURCHASE_PRICE)}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>MY OWNED NUMBERS</div>
                    <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 4 }}>{teamOwnedNumberRows.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0 }}>My Team Numbers</h3>
                  {teamOwnedNumberRows.length === 0 ? (
                    <div style={{ opacity: 0.72 }}>No purchased numbers yet.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                      {teamOwnedNumberRows.map((row) => (
                        <div key={row.id || row.number} style={{ background: "#11161d", border: "1px solid #2c3440", borderRadius: 14, padding: 14, textAlign: "center" }}>
                          <div style={{ fontSize: 28, fontWeight: 1000, color: "#d4af37" }}>#{row.number}</div>
                          <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{String(row.status || "owned").toUpperCase()}</div>
                          {row.assigned_driver_name && <div style={{ fontSize: 11, marginTop: 6 }}>Assigned: {row.assigned_driver_name}</div>}
                          {String(row.status || "").toLowerCase() === "owned" && (
                            <button type="button" onClick={() => releaseNumber(row)} disabled={numberMarketBusy === `release-${row.number}`} style={{ ...dangerButtonStyle, marginTop: 10, padding: "7px 10px", fontSize: 12 }}>
                              {numberMarketBusy === `release-${row.number}` ? "Releasing..." : "Release"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 style={{ marginTop: 0 }}>Available League Numbers</h3>
                  {availableNumberRows.length === 0 ? (
                    <div style={{ opacity: 0.72 }}>No available numbers in the league pool.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                      {availableNumberRows.map((row) => {
                        const price = Number(row.purchase_price || NUMBER_PURCHASE_PRICE);
                        const disabled = Boolean(numberMarketBusy) || currentTeamBalance < price;
                        return (
                          <div key={row.id || row.number} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 12, textAlign: "center" }}>
                            <div style={{ fontSize: 26, fontWeight: 1000 }}>#{row.number}</div>
                            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>{money(price)}</div>
                            <button type="button" onClick={() => purchaseNumber(row)} disabled={disabled} style={{ ...(disabled ? secondaryButtonStyle : primaryButtonStyle), marginTop: 8, padding: "7px 10px", fontSize: 12, opacity: disabled ? 0.55 : 1 }}>
                              {numberMarketBusy === String(row.number) ? "Buying..." : "Buy"}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeHqTab === "interest" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🤝 Team Interest</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Drivers who have privately expressed interest in joining {getTeamFullName(safeSelectedTeam)}.</div>
                  </div>
                  <button onClick={loadTeamInterestRows} style={secondaryButtonStyle}>Refresh Interest</button>
                </div>

                {teamInterestMessage && <div style={{ marginBottom: 12, color: "#4ade80", fontWeight: 900 }}>{teamInterestMessage}</div>}
                {teamInterestError && <div style={{ marginBottom: 12, color: "#f87171", fontWeight: 900 }}>{teamInterestError}</div>}

                {teamInterestRows.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No drivers have expressed interest in this team yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {teamInterestRows.map((interest) => {
                      const status = String(interest.status || "Open");
                      const statusColor = status === "Closed" ? "#9ca3af" : status === "Contacted" ? "#60a5fa" : status === "Reviewed" ? "#d4af37" : "#4ade80";
                      return (
                        <div key={interest.id || `${interest.driver_number}-${interest.created_at}`} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 900 }}>#{interest.driver_number} {interest.driver_name}</div>
                              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Current: {getTeamFullName(interest.current_team || "Independent")} · {interest.current_manufacturer || "No manufacturer"}</div>
                              <div style={{ fontSize: 13, marginTop: 8, color: "#d4af37", fontWeight: 900 }}>Interest Level: {interest.interest_level || "Medium"}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <div style={{ display: "inline-flex", background: "#111827", border: `1px solid ${statusColor}`, color: statusColor, borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900 }}>{status}</div>
                              <div style={{ fontSize: 11, opacity: 0.55, marginTop: 7 }}>{interest.created_at ? new Date(interest.created_at).toLocaleString() : ""}</div>
                            </div>
                          </div>

                          {interest.message && (
                            <div style={{ marginTop: 12, background: "#11161d", border: "1px solid #252c38", borderRadius: 12, padding: 12, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                              {interest.message}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            <button type="button" onClick={() => updateTeamInterestStatus(interest.id, "Reviewed")} style={secondaryButtonStyle}>Mark Reviewed</button>
                            <button type="button" onClick={() => updateTeamInterestStatus(interest.id, "Contacted")} style={primaryButtonStyle}>Mark Contacted</button>
                            <button type="button" onClick={() => updateTeamInterestStatus(interest.id, "Closed")} style={dangerButtonStyle}>Close</button>
                            <button type="button" onClick={() => { setActiveHqTab("messages"); setTeamMessageForm({ recipient_mode: "driver", driver_number: String(interest.driver_number || ""), subject: `Re: Interest in ${getTeamFullName(safeSelectedTeam)}`, message: "" }); }} style={secondaryButtonStyle}>Message Driver</button>
                            <button type="button" onClick={() => { setActiveHqTab("contracts"); const target = drivers.find((driver) => String(driver.number) === String(interest.driver_number)); if (target) selectContractDriver(target.id); }} style={secondaryButtonStyle}>Start Contract Offer</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeHqTab === "recruiting" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🎯 Recruiting Board</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Drivers {getTeamFullName(safeSelectedTeam)} has flagged interest in from the Driver Market.</div>
                  </div>
                  <button onClick={loadRecruitingBoard} style={secondaryButtonStyle}>Refresh Board</button>
                </div>

                {recruitingBoardRows.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No drivers added to your recruiting board yet. Browse the Driver Market and tap "Add to Recruiting Board" or "Show Interest" on a driver's profile.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {recruitingBoardRows.map((row) => (
                      <div key={row.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 900 }}>#{row.driver_number} {row.driver_name}</div>
                            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Added by {row.owner_name || "Unknown"} · {row.created_at ? new Date(row.created_at).toLocaleDateString() : ""}</div>
                          </div>
                          <div style={{ display: "inline-flex", background: "#111827", border: "1px solid #d4af37", color: "#d4af37", borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 900, height: "fit-content" }}>
                            {row.interest_level || "interested"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                          <button type="button" onClick={() => { setActiveHqTab("messages"); setTeamMessageForm({ recipient_mode: "driver", driver_number: String(row.driver_number || ""), subject: `Recruiting interest from ${getTeamFullName(safeSelectedTeam)}`, message: "" }); }} style={secondaryButtonStyle}>Message Driver</button>
                          <button type="button" onClick={() => { setActiveHqTab("contracts"); const target = drivers.find((driver) => String(driver.number) === String(row.driver_number)); if (target) selectContractDriver(target.id); }} style={secondaryButtonStyle}>Start Contract Offer</button>
                          <button type="button" onClick={() => removeFromRecruitingBoard(row.id)} style={dangerButtonStyle}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeHqTab === "portal" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>🔄 Transfer Portal</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Drivers who have entered the portal and are open to signing elsewhere. Signing a driver under contract requires paying their buyout to their current team.</div>
                  </div>
                  <button onClick={loadTransferPortalEntries} style={secondaryButtonStyle}>Refresh Portal</button>
                </div>

                {transferPortalMessage && <div style={{ marginBottom: 12, color: "#4ade80", fontWeight: 900 }}>{transferPortalMessage}</div>}

                {transferPortalEntries.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No drivers are currently in the Transfer Portal.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {transferPortalEntries.map((entry) => {
                      const driverContract = (activeContracts || []).find((c) => String(c.driver_number) === String(entry.driver_number));
                      const cost = driverContract ? calculateContractTerminationCost(driverContract) : null;
                      const isOwnDriver = sameTeamName(entry.current_team, safeSelectedTeam) || sameTeamName(entry.current_team, ownerTeamName);
                      return (
                        <div key={entry.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 18, fontWeight: 900 }}>#{entry.driver_number} {entry.driver_name}</div>
                              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Currently: {getTeamFullName(entry.current_team)} · Entered {entry.entered_at ? new Date(entry.entered_at).toLocaleDateString() : ""}</div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              {cost ? (
                                <div style={{ fontSize: 18, fontWeight: 900, color: "#d4af37" }}>{money(cost.buyout)} buyout</div>
                              ) : (
                                <div style={{ fontSize: 13, fontWeight: 900, color: "#4ade80" }}>Free agent — no buyout</div>
                              )}
                            </div>
                          </div>

                          {entry.wishlist && (
                            <div style={{ marginTop: 12, background: "#11161d", border: "1px solid #252c38", borderRadius: 12, padding: 12, whiteSpace: "pre-wrap", lineHeight: 1.55, fontSize: 13.5 }}>
                              <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 900, marginBottom: 4, textTransform: "uppercase" }}>Wish List</div>
                              {entry.wishlist}
                            </div>
                          )}

                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            {isOwnDriver ? (
                              <div style={{ fontSize: 12.5, opacity: 0.65, fontWeight: 700 }}>This is your own driver testing the market.</div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => signPortalDriver(entry)}
                                disabled={signingBusyId === entry.id}
                                style={primaryButtonStyle}
                              >
                                {signingBusyId === entry.id ? "Signing..." : `Sign to ${getTeamFullName(safeSelectedTeam)}`}
                              </button>
                            )}
                            <button type="button" onClick={() => { setActiveHqTab("messages"); setTeamMessageForm({ recipient_mode: "driver", driver_number: String(entry.driver_number || ""), subject: `Interest from ${getTeamFullName(safeSelectedTeam)}`, message: "" }); }} style={secondaryButtonStyle}>Message Driver</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeHqTab === "messages" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>📩 Team Message Center</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Send official Team HQ messages to your full roster or to one driver.</div>
                  </div>
                </div>

                <form onSubmit={sendTeamMessage}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>SEND TO</div>
                      <select value={teamMessageForm.recipient_mode} onChange={(event) => updateTeamMessageField("recipient_mode", event.target.value)} style={inputStyle}>
                        <option value="team">Entire Team</option>
                        <option value="driver">Specific Driver</option>
                      </select>
                    </div>
                    {teamMessageForm.recipient_mode === "driver" && (
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                        <select value={teamMessageForm.driver_number} onChange={(event) => updateTeamMessageField("driver_number", event.target.value)} style={inputStyle}>
                          <option value="">Choose driver</option>
                          {selected.drivers.map((driver) => (
                            <option key={driver.id || driver.number} value={String(driver.number)}>#{driver.number} {driver.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>SUBJECT</div>
                      <input value={teamMessageForm.subject} onChange={(event) => updateTeamMessageField("subject", event.target.value)} placeholder="Strategy, meeting, contract, warning..." style={inputStyle} maxLength={120} />
                    </div>
                  </div>

                  <textarea value={teamMessageForm.message} onChange={(event) => updateTeamMessageField("message", event.target.value)} placeholder="Type your Team HQ message..." rows={6} style={{ ...inputStyle, resize: "vertical" }} maxLength={1200} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                    <button type="submit" style={primaryButtonStyle}>Send Team Message</button>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>{teamMessageForm.message.length}/1200 characters</div>
                  </div>
                  {teamMessageStatus && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{teamMessageStatus}</div>}
                  {teamMessageError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{teamMessageError}</div>}
                </form>

                <div style={{ marginTop: 22, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
                    <div>
                      <h3 style={{ margin: 0 }}>Team HQ Inbox</h3>
                      <div style={{ opacity: 0.65, fontSize: 13, marginTop: 4 }}>{teamInboxMessages.length} message{teamInboxMessages.length !== 1 ? "s" : ""} loaded · {teamInboxMessages.filter((message) => !message.is_read).length} unread</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={loadTeamInboxMessages} style={secondaryButtonStyle}>{teamInboxLoading ? "Refreshing..." : "Refresh"}</button>
                      <button type="button" onClick={markAllTeamMessagesRead} style={primaryButtonStyle}>Mark All Read</button>
                    </div>
                  </div>

                  {teamInboxMessages.length === 0 ? (
                    <div style={{ opacity: 0.72 }}>No Team HQ inbox messages yet.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {teamInboxMessages.map((message) => (
                        <div key={message.id || `${message.created_at}-${message.subject}`} style={{ background: message.is_read ? "#11161d" : "#2a240f", border: `1px solid ${message.is_read ? "#2c3440" : "#d4af37"}`, borderRadius: 12, padding: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 900 }}>{message.subject || "No subject"}</div>
                              <div style={{ opacity: 0.62, fontSize: 12, marginTop: 3 }}>From: {message.sender_name || message.sender_type || "League"} · {message.created_at ? new Date(message.created_at).toLocaleString() : ""}</div>
                            </div>
                            <span style={{ alignSelf: "flex-start", fontSize: 10, fontWeight: 900, padding: "3px 8px", borderRadius: 999, background: message.is_read ? "#102a16" : "#3a3200", color: message.is_read ? "#4ade80" : "#facc15" }}>{message.is_read ? "READ" : "UNREAD"}</span>
                          </div>
                          <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{message.message || ""}</div>
                          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                            {!message.is_read ? (
                              <button type="button" onClick={() => updateTeamMessageReadStatus(message.id, true)} style={secondaryButtonStyle}>Mark Read</button>
                            ) : (
                              <button type="button" onClick={() => updateTeamMessageReadStatus(message.id, false)} style={secondaryButtonStyle}>Mark Unread</button>
                            )}
                            <button type="button" onClick={() => archiveTeamMessage(message.id)} style={dangerButtonStyle}>Archive</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeHqTab === "overview" && (
              <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
                <h2 style={{ marginTop: 0 }}>Team HQ Overview</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Owner Power Rank</div><div style={{ fontSize: 30, fontWeight: 900 }}>#{myOwnerRank}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Team Morale</div><div style={{ fontSize: 30, fontWeight: 900 }}>{teamMoraleScore}/100</div><div style={{ opacity: 0.62, fontSize: 12, marginTop: 4 }}>{teamFeedback.length} driver feedback forms</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Franchise Value</div><div style={{ fontSize: 30, fontWeight: 900 }}>{money(franchiseValue)}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Media Pressure</div><div style={{ fontSize: 30, fontWeight: 900 }}>{mediaPressureScore}/100</div></div>
                </div>
              </div>
            )}

            {activeHqTab === "morale" && (
              <div style={sectionCardStyle}>
                <h2 style={{ marginTop: 0 }}>Driver Morale</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Avg Happiness</div><div style={{ fontSize: 26, fontWeight: 900 }}>{submittedHappinessAverage ?? "—"}/10</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Avg Leadership</div><div style={{ fontSize: 26, fontWeight: 900 }}>{submittedLeadershipAverage ?? "—"}/10</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Avg Communication</div><div style={{ fontSize: 26, fontWeight: 900 }}>{submittedCommunicationAverage ?? "—"}/10</div></div></div><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={thStyle}>Driver</th><th style={thStyle}>Morale</th><th style={thStyle}>Happiness</th><th style={thStyle}>Communication</th><th style={thStyle}>Leadership</th><th style={thStyle}>Latest Note</th><th style={thStyle}>Owner Action</th></tr></thead><tbody>
                  {selected.drivers.map((driver) => { const feedback = latestFeedbackByDriverNumber.get(String(driver.number || "").trim()); const feedbackMorale = feedbackScoreToMorale(feedback?.team_happiness); const score = feedbackMorale ?? Math.max(40, Math.min(100, teamMoraleScore + (Number(driver.points || 0) > 0 ? 5 : 0) - (Number(driver.dnfs || 0) * 5))); const status = score >= 80 ? "Happy" : score >= 65 ? "Neutral" : score >= 50 ? "Frustrated" : "At Risk"; return (
                    <tr key={driver.id}><td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td><td style={tdStyle}>{score}/100<br/><span style={{ opacity: 0.6, fontSize: 11 }}>{status}</span></td><td style={tdStyle}>{feedback?.team_happiness ?? "—"}/10</td><td style={tdStyle}>{feedback?.team_communication ?? "—"}/10</td><td style={tdStyle}>{feedback?.leadership_confidence ?? "—"}/10</td><td style={tdStyle}>{feedback?.comments || "—"}</td><td style={tdStyle}>{status === "Happy" ? "Keep current plan" : status === "Neutral" ? "Public support / bonus talk" : "Schedule owner meeting"}</td></tr>
                  ); })}
                </tbody></table></div>
              </div>
            )}

            {activeHqTab === "manufacturer" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Manufacturer Contract</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Factory support now reacts to performance, morale, penalties, alignment, media work, and alliances.</div>
                  </div>
                  <div style={{ background: "#0f1319", border: `1px solid ${manufacturerSatisfaction.status.color}`, borderRadius: 16, padding: "12px 16px", minWidth: 210 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>SATISFACTION STATUS</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: manufacturerSatisfaction.status.color }}>{manufacturerSatisfaction.status.label}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Manufacturer</div><div style={{ fontSize: 26, fontWeight: 900 }}>{manufacturerContract.manufacturer}</div></div>
                  <div style={{ background: "#0f1319", border: `1px solid ${manufacturerSatisfaction.status.color}`, borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Satisfaction</div><div style={{ fontSize: 32, fontWeight: 900, color: manufacturerSatisfaction.status.color }}>{manufacturerSatisfaction.score}/100</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Support Tier</div><div style={{ fontSize: 22, fontWeight: 900 }}>{manufacturerSatisfaction.supportTier}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Support Money</div><div style={{ fontSize: 26, fontWeight: 900 }}>{money(manufacturerSatisfaction.adjustedSupportAmount)}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Support Adjustment</div><div style={{ fontSize: 26, fontWeight: 900, color: manufacturerSatisfaction.supportAdjustment >= 0 ? "#4ade80" : "#f87171" }}>{manufacturerSatisfaction.supportAdjustment >= 0 ? "+" : ""}{money(manufacturerSatisfaction.supportAdjustment)}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Win Bonus</div><div style={{ fontSize: 26, fontWeight: 900 }}>{money(manufacturerContract.winBonus)}</div></div>
                </div>

                <div style={{ marginTop: 18, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 900 }}>Manufacturer Satisfaction Meter</div>
                    <span style={{ color: manufacturerSatisfaction.status.color, fontWeight: 900 }}>{manufacturerSatisfaction.score}%</span>
                  </div>
                  <div style={{ marginTop: 10, height: 14, borderRadius: 999, background: "#202734", overflow: "hidden" }}>
                    <div style={{ width: `${manufacturerSatisfaction.score}%`, height: "100%", background: manufacturerSatisfaction.status.color }} />
                  </div>
                  <div style={{ marginTop: 10, opacity: 0.76 }}>{manufacturerSatisfaction.status.note}</div>
                  <div style={{ marginTop: 8, opacity: 0.76 }}>Expectation: {manufacturerContract.expectation}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginTop: 16 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Brand Alignment</div><div style={{ fontSize: 24, fontWeight: 900 }}>{manufacturerSatisfaction.alignmentScore}%</div><div style={{ opacity: 0.62, fontSize: 12 }}>{manufacturerSatisfaction.alignedDriverCount}/{manufacturerSatisfaction.totalDriverCount || 0} drivers aligned</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Performance Score</div><div style={{ fontSize: 24, fontWeight: 900 }}>+{manufacturerSatisfaction.performanceScore}</div><div style={{ opacity: 0.62, fontSize: 12 }}>Wins, top 5s, top 10s, stage points</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Stage Points</div><div style={{ fontSize: 24, fontWeight: 900 }}>{manufacturerSatisfaction.stagePointTotal}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Top 5 / Top 10</div><div style={{ fontSize: 24, fontWeight: 900 }}>{manufacturerSatisfaction.top5Count} / {manufacturerSatisfaction.top10Count}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>DNFs</div><div style={{ fontSize: 24, fontWeight: 900, color: manufacturerSatisfaction.dnfCount ? "#f87171" : "#4ade80" }}>{manufacturerSatisfaction.dnfCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Penalties</div><div style={{ fontSize: 24, fontWeight: 900, color: manufacturerSatisfaction.penaltyCount ? "#f87171" : "#4ade80" }}>{manufacturerSatisfaction.penaltyCount}</div></div>
                </div>
              </div>
            )}

            {activeHqTab === "development" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Development Center</h2>
                    <p style={{ opacity: 0.72, margin: "6px 0 0", lineHeight: 1.45 }}>
                      Assign Cup drivers to Xfinity, Truck, or ARCA rides, approve driver requests, and track the 2-start developmental limit.
                    </p>
                  </div>
                  <button type="button" onClick={loadDevelopmentCenterData} style={secondaryButtonStyle}>Refresh Development</button>
                </div>

                {developmentMessage && <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", color: "#bbf7d0", borderRadius: 12, padding: 12, marginBottom: 12, fontWeight: 800 }}>{developmentMessage}</div>}
                {developmentError && <div style={{ background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.35)", color: "#fecaca", borderRadius: 12, padding: 12, marginBottom: 12, fontWeight: 800 }}>{developmentError}</div>}

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>PENDING REQUESTS</div>
                    <div style={{ fontSize: 30, fontWeight: 900 }}>{pendingDevelopmentRequests.length}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>APPROVED ASSIGNMENTS</div>
                    <div style={{ fontSize: 30, fontWeight: 900 }}>{teamDevelopmentTransactions.filter((row) => String(row.final_status || "").toLowerCase() === "approved").length}</div>
                  </div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                    <div style={{ opacity: 0.65, fontSize: 12 }}>BOARD REVIEW</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: "#facc15" }}>{teamDevelopmentTransactions.filter((row) => row.requires_board_approval && String(row.final_status || "pending").toLowerCase() === "pending").length}</div>
                  </div>
                </div>

                <form onSubmit={submitOwnerDevelopmentAssignment} style={{ background: "#10151d", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Assign Development Ride</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>CUP DRIVER</div>
                      <select value={developmentForm.driver_id} onChange={(event) => updateDevelopmentForm("driver_id", event.target.value)} style={inputStyle}>
                        <option value="">Select driver</option>
                        {cupDriverOptions.map((driver) => (
                          <option key={`${driver.id || driver.number}-dev`} value={driver.id || driver.number}>#{driver.number} {driver.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SERIES</div>
                      <select value={developmentForm.requested_series} onChange={(event) => updateDevelopmentForm("requested_series", event.target.value)} style={inputStyle}>
                        {DEVELOPMENT_SERIES_OPTIONS.map((series) => (
                          <option key={series.value} value={series.value}>{series.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RACE</div>
                      <select value={developmentForm.race_name} onChange={(event) => updateDevelopmentForm("race_name", event.target.value)} style={inputStyle}>
                        <option value="">Select race</option>
                        {DEFAULT_START_PARK_RACES.map((race) => (
                          <option key={`dev-${race.name}`} value={race.name}>{race.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>OWNER NOTE</div>
                    <textarea value={developmentForm.request_note} onChange={(event) => updateDevelopmentForm("request_note", event.target.value)} placeholder="Optional note for the driver market / board review" style={{ ...inputStyle, minHeight: 84 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
                    <div style={{ opacity: 0.68, fontSize: 12 }}>Under 2 starts: owner approval is final. At 2 starts: sent to board.</div>
                    <button type="submit" disabled={developmentBusy === "assign"} style={primaryButtonStyle}>{developmentBusy === "assign" ? "Assigning..." : "Assign Ride"}</button>
                  </div>
                </form>

                <div style={{ background: "#10151d", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Pending Driver Requests</h3>
                  {pendingDevelopmentRequests.length === 0 ? (
                    <p style={{ opacity: 0.68, marginBottom: 0 }}>No pending developmental ride requests for this team.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th style={thStyle}>Driver</th><th style={thStyle}>Series</th><th style={thStyle}>Race</th><th style={thStyle}>Starts Used</th><th style={thStyle}>Note</th><th style={thStyle}>Action</th></tr></thead>
                        <tbody>
                          {pendingDevelopmentRequests.map((row) => {
                            const used = getDriverDevelopmentStarts(row.driver_number, row.requested_series);
                            return (
                              <tr key={row.id}>
                                <td style={{ ...tdStyle, fontWeight: 900 }}>#{row.driver_number} {row.driver_name}</td>
                                <td style={tdStyle}>{getDevelopmentSeriesLabel(row.requested_series)}</td>
                                <td style={tdStyle}>{row.race_name || "—"}</td>
                                <td style={tdStyle}>{used}/2 {used >= 2 && <span style={{ color: "#facc15", fontWeight: 900 }}> Board</span>}</td>
                                <td style={tdStyle}>{row.request_note || "—"}</td>
                                <td style={tdStyle}>
                                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <button type="button" disabled={developmentBusy === row.id} onClick={() => updateDevelopmentRequest(row, "approve")} style={primaryButtonStyle}>Approve</button>
                                    <button type="button" disabled={developmentBusy === row.id} onClick={() => updateDevelopmentRequest(row, "deny")} style={dangerButtonStyle}>Deny</button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div style={{ background: "#10151d", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>
                  <h3 style={{ marginTop: 0 }}>Development Ride Board</h3>
                  {teamDevelopmentTransactions.length === 0 ? (
                    <p style={{ opacity: 0.68, marginBottom: 0 }}>No developmental rides or requests have been posted yet.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead><tr><th style={thStyle}>Driver</th><th style={thStyle}>Series</th><th style={thStyle}>Race</th><th style={thStyle}>Source</th><th style={thStyle}>Status</th><th style={thStyle}>Driver Points / Pay</th></tr></thead>
                        <tbody>
                          {teamDevelopmentTransactions.map((row) => {
                            const status = normalizeDevelopmentStatus(row);
                            return (
                              <tr key={row.id}>
                                <td style={{ ...tdStyle, fontWeight: 900 }}>#{row.driver_number} {row.driver_name}</td>
                                <td style={tdStyle}>{getDevelopmentSeriesLabel(row.requested_series)}</td>
                                <td style={tdStyle}>{row.race_name || "—"}</td>
                                <td style={tdStyle}>{String(row.assignment_source || "driver_request").replace(/_/g, " ")}</td>
                                <td style={tdStyle}><span style={{ color: status.color, fontWeight: 900 }}>{status.label}</span></td>
                                <td style={tdStyle}>0 driver points / 0 driver pay<br/><span style={{ opacity: 0.62, fontSize: 11 }}>Owner money remains active.</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeHqTab === "rivalries" && (
              <div style={sectionCardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <h2 style={{ marginTop: 0, marginBottom: 6 }}>Team Rivalries</h2>
                    <p style={{ opacity: 0.72, marginTop: 0 }}>Create individual team rivalries or full manufacturer wars.</p>
                  </div>
                  <button onClick={loadTeamRivalries} style={secondaryButtonStyle}>Refresh Rivalries</button>
                </div>

                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 16 }}>
                  <div style={{ opacity: 0.65, fontSize: 12 }}>CURRENT RIVALRY HEAT</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{Math.min(100, mediaPressureScore + visibleRivalries.length * 5)}/100</div>
                  <div style={{ opacity: 0.62, fontSize: 12, marginTop: 4 }}>{visibleRivalries.length} rivalry/rivalries connected to this team or manufacturer.</div>
                </div>

                <form onSubmit={createTeamRivalry} style={{ background: "#10151d", border: "1px solid #2c3440", borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Create Rivalry</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RIVALRY TYPE</div>
                      <select value={rivalryForm.rivalry_type} onChange={(event) => updateRivalryForm("rivalry_type", event.target.value)} style={inputStyle}>
                        <option value="Individual Team Rivalry">Individual Team Rivalry</option>
                        <option value="Manufacturer Rivalry">Manufacturer Rivalry</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RIVALRY NAME</div>
                      <input value={rivalryForm.rivalry_name} onChange={(event) => updateRivalryForm("rivalry_name", event.target.value)} placeholder="Example: Ford vs Toyota War" style={inputStyle} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RIVALRY LEVEL</div>
                      <input type="number" min="1" max="100" value={rivalryForm.rivalry_level} onChange={(event) => updateRivalryForm("rivalry_level", event.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {rivalryForm.rivalry_type === "Manufacturer Rivalry" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>MANUFACTURER A</div>
                        <select value={rivalryForm.manufacturer_a} onChange={(event) => updateRivalryForm("manufacturer_a", event.target.value)} style={inputStyle}>
                          <option value="">Select Manufacturer A</option>
                          <option value="Toyota">Toyota</option>
                          <option value="Ford">Ford</option>
                          <option value="Chevrolet">Chevrolet</option>
                        </select>
                        {rivalryForm.manufacturer_a && <div style={{ opacity: 0.62, fontSize: 12, marginTop: 6 }}>Teams: {(manufacturerTeamMap[rivalryForm.manufacturer_a] || []).map(getTeamFullName).join(", ") || "No teams found"}</div>}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>MANUFACTURER B</div>
                        <select value={rivalryForm.manufacturer_b} onChange={(event) => updateRivalryForm("manufacturer_b", event.target.value)} style={inputStyle}>
                          <option value="">Select Manufacturer B</option>
                          <option value="Toyota">Toyota</option>
                          <option value="Ford">Ford</option>
                          <option value="Chevrolet">Chevrolet</option>
                        </select>
                        {rivalryForm.manufacturer_b && <div style={{ opacity: 0.62, fontSize: 12, marginTop: 6 }}>Teams: {(manufacturerTeamMap[rivalryForm.manufacturer_b] || []).map(getTeamFullName).join(", ") || "No teams found"}</div>}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SIDE A TEAM(S)</div>
                        <select multiple value={rivalryForm.teams_a} onChange={(event) => updateRivalryTeamList("teams_a", event)} style={{ ...inputStyle, minHeight: 140 }}>
                          {availableTeams.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
                        </select>
                        <div style={{ opacity: 0.55, fontSize: 11, marginTop: 6 }}>Hold Command/Ctrl to select multiple teams.</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SIDE B TEAM(S)</div>
                        <select multiple value={rivalryForm.teams_b} onChange={(event) => updateRivalryTeamList("teams_b", event)} style={{ ...inputStyle, minHeight: 140 }}>
                          {availableTeams.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
                        </select>
                        <div style={{ opacity: 0.55, fontSize: 11, marginTop: 6 }}>Use this for team vs team or alliance vs alliance.</div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>STORYLINE / NOTES</div>
                    <textarea value={rivalryForm.storyline} onChange={(event) => updateRivalryForm("storyline", event.target.value)} placeholder="Example: Toyota camp believes Ford teams raced too aggressively at EchoPark." style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} />
                  </div>

                  {rivalryError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{rivalryError}</div>}
                  {rivalryMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{rivalryMessage}</div>}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <button type="submit" style={primaryButtonStyle}>Create Rivalry</button>
                    <button type="button" onClick={() => setRivalryForm({ rivalry_name: "", rivalry_type: "Individual Team Rivalry", team_a: "", team_b: "", teams_a: [], teams_b: [], manufacturer_a: "", manufacturer_b: "", storyline: "", rivalry_level: 50 })} style={secondaryButtonStyle}>Reset</button>
                  </div>
                </form>

                {visibleRivalries.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No rivalries connected to this team yet.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    {visibleRivalries.map((rivalry) => {
                      const type = rivalry.rivalry_type || "Individual Team Rivalry";
                      const sideA = type === "Manufacturer Rivalry" ? `${rivalry.manufacturer_a} Camp` : (Array.isArray(rivalry.teams_a) && rivalry.teams_a.length ? rivalry.teams_a.join(", ") : rivalry.team_a);
                      const sideB = type === "Manufacturer Rivalry" ? `${rivalry.manufacturer_b} Camp` : (Array.isArray(rivalry.teams_b) && rivalry.teams_b.length ? rivalry.teams_b.join(", ") : rivalry.team_b);
                      return (
                        <div key={rivalry.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                            <div style={{ fontWeight: 900, fontSize: 16 }}>{rivalry.rivalry_name || `${sideA} vs ${sideB}`}</div>
                            <span style={{ background: type === "Manufacturer Rivalry" ? "#7c2d12" : "#1e3a8a", borderRadius: 999, padding: "3px 9px", fontSize: 11, fontWeight: 900 }}>{type}</span>
                          </div>
                          <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.5 }}><strong>{sideA || "Side A"}</strong> vs <strong>{sideB || "Side B"}</strong></div>
                          <div style={{ marginTop: 10 }}>
                            <div style={{ opacity: 0.6, fontSize: 11 }}>HEAT LEVEL</div>
                            <div style={{ fontSize: 24, fontWeight: 900 }}>{rivalry.rivalry_level || 50}/100</div>
                          </div>
                          {rivalry.storyline && <div style={{ marginTop: 10, opacity: 0.78, fontSize: 13, lineHeight: 1.5 }}>{rivalry.storyline}</div>}
                          <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>Status: {rivalry.status || "Active"}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                            <button onClick={() => updateTeamRivalryStatus(rivalry.id, rivalry.status === "Active" ? "Paused" : "Active")} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>{rivalry.status === "Active" ? "Pause" : "Activate"}</button>
                            <button onClick={() => deleteTeamRivalry(rivalry.id)} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeHqTab === "media" && (
              <div style={sectionCardStyle}>
                <h2 style={{ marginTop: 0 }}>Owner Media Pressure</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Fan Approval</div><div style={{ fontSize: 26, fontWeight: 900 }}>{Math.max(35, 100 - mediaPressureScore + selected.wins * 8)}/100</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Sponsor Approval</div><div style={{ fontSize: 26, fontWeight: 900 }}>{Math.max(40, 90 - Math.round(mediaPressureScore / 2))}/100</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Media Heat</div><div style={{ fontSize: 26, fontWeight: 900 }}>{mediaPressureScore}/100</div></div>
                </div>
              </div>
            )}

            {activeHqTab === "value" && (
              <div style={sectionCardStyle}>
                <h2 style={{ marginTop: 0 }}>Franchise Value</h2>
                <div style={{ fontSize: 42, fontWeight: 900, color: "#d4af37" }}>{money(franchiseValue)}</div>
                <p style={{ opacity: 0.72 }}>Value is estimated from team budget, points, wins, top 3s, roster size, active contracts, and morale.</p>
              </div>
            )}

            {activeHqTab === "rankings" && (
              <div style={sectionCardStyle}>
                <h2 style={{ marginTop: 0 }}>Owner Power Rankings</h2>
                <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={thStyle}>Rank</th><th style={thStyle}>Team</th><th style={thStyle}>Owner Score</th><th style={thStyle}>Budget</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th></tr></thead><tbody>
                  {ownerPowerRankings.map((item, index) => (
                    <tr key={item.team}><td style={tdStyle}>#{index + 1}</td><td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(item.team)}</td><td style={tdStyle}>{item.score}</td><td style={tdStyle}>{money(item.row.projectedBudget)}</td><td style={tdStyle}>{item.row.points}</td><td style={tdStyle}>{item.row.wins}</td></tr>
                  ))}
                </tbody></table></div>
              </div>
            )}

            {activeHqTab === "contracts" && (
              <>
            <div style={{ ...sectionCardStyle, borderColor: "#b42318" }}>
              <h2 style={{ marginTop: 0 }}>🚨 Contract Termination / Driver Release</h2>
              <div style={{ opacity: 0.74, lineHeight: 1.6 }}>
                Owners can terminate their own active contracts. A paid termination deducts remaining salary plus buyout from the team account and moves the driver to Independent / free agency. A for-cause request sends the issue to the Board without deducting money immediately.
              </div>
              {contractError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{contractError}</div>}
              {contractMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{contractMessage}</div>}
            </div>
            <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: 6 }}>Active League Contracts</h2>
                  <div style={{ opacity: 0.68, fontSize: 13 }}>
                    This shows every accepted/active contract currently recorded in Supabase.
                  </div>
                </div>
                <button onClick={loadActiveContracts} style={secondaryButtonStyle}>Refresh Active Contracts</button>
              </div>

              {activeContracts.length === 0 ? (
                <div style={{ opacity: 0.72, marginTop: 12 }}>
                  No active or accepted contracts are currently listed. If a contract was only sent but not accepted, it will remain under My Contract Offers.
                </div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Driver</th>
                        <th style={thStyle}>Team</th>
                        <th style={thStyle}>Manufacturer</th>
                        <th style={thStyle}>Salary</th>
                        <th style={thStyle}>Bonus</th>
                        <th style={thStyle}>Length</th>
                        <th style={thStyle}>Buyout</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map((contract) => {
                        const canTerminate = canManageContract(contract);
                        const cost = calculateContractTerminationCost(contract);
                        return (
                          <tr key={contract.id}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || "—"} {contract.driver_name}</td>
                            <td style={tdStyle}>{contract.team || contract.created_by_team || "—"}</td>
                            <td style={tdStyle}>{contract.manufacturer || "—"}</td>
                            <td style={tdStyle}>{money(contract.salary)}</td>
                            <td style={tdStyle}>{money(contract.signing_bonus)}</td>
                            <td style={tdStyle}>{contract.contract_length || "—"} season{Number(contract.contract_length) === 1 ? "" : "s"}</td>
                            <td style={tdStyle}>{money(contract.buyout_amount)}</td>
                            <td style={{ ...tdStyle, fontWeight: 900, color: String(contract.status || "").includes("Terminated") ? "#f87171" : "#4ade80" }}>{contract.status}</td>
                            <td style={tdStyle}>
                              {canTerminate ? (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    disabled={terminationBusyId === contract.id}
                                    onClick={() => terminateContractPaidOut(contract)}
                                    title={`Cost: ${money(cost.total)}`}
                                    style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12, opacity: terminationBusyId === contract.id ? 0.6 : 1 }}
                                  >
                                    {terminationBusyId === contract.id ? "Processing..." : "Terminate / Pay Out"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={terminationBusyId === contract.id}
                                    onClick={() => requestForCauseTermination(contract)}
                                    style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12, opacity: terminationBusyId === contract.id ? 0.6 : 1 }}
                                  >
                                    For Cause Request
                                  </button>
                                </div>
                              ) : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Pay Independent Driver</h2>
                  <div style={{ opacity: 0.68, marginTop: 6, fontSize: 13 }}>
                    Record one-time payments to Independent/IND drivers. Payments subtract from this team’s projected budget.
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>AVAILABLE TEAM ACCOUNT</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#d4af37" }}>{money(currentTeamBalance)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>INDEPENDENT DRIVER</div>
                  <select
                    value={independentPaymentForm.driver_id}
                    onChange={(event) => updateIndependentPaymentField("driver_id", event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select independent driver</option>
                    {independentDriversForPayment.map((driver) => (
                      <option key={driver.id || driver.number || driver.name} value={driver.id}>
                        #{driver.number} {driver.name} · {driver.manufacturer || "—"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>PAYMENT AMOUNT</div>
                  <input
                    type="number"
                    min={1}
                    value={independentPaymentForm.amount}
                    onChange={(event) => updateIndependentPaymentField("amount", event.target.value)}
                    style={inputStyle}
                    placeholder="Example: 50000"
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REASON</div>
                  <input
                    value={independentPaymentForm.reason}
                    onChange={(event) => updateIndependentPaymentField("reason", event.target.value)}
                    style={inputStyle}
                    placeholder="Example: Daytona appearance bonus"
                  />
                </div>

                <button onClick={submitIndependentDriverPayment} style={primaryButtonStyle}>Pay Independent Driver</button>
              </div>

              {independentPaymentError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{independentPaymentError}</div>}
              {independentPaymentMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{independentPaymentMessage}</div>}

              <div style={{ marginTop: 16 }}>
                <h3 style={{ margin: "0 0 10px" }}>Independent Driver Payments From This Team</h3>
                {teamIndependentPayments.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No independent driver payments recorded by {ownerTeamName} yet.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Driver</th>
                          <th style={thStyle}>Amount</th>
                          <th style={thStyle}>Reason</th>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamIndependentPayments.map((payment) => (
                          <tr key={payment.id}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>#{payment.driver_number || "—"} {payment.driver_name}</td>
                            <td style={tdStyle}>{money(payment.amount)}</td>
                            <td style={tdStyle}>{payment.reason || "—"}</td>
                            <td style={tdStyle}>{payment.created_at ? new Date(payment.created_at).toLocaleDateString() : "—"}</td>
                            <td style={tdStyle}>
                              <button onClick={() => deleteIndependentDriverPayment(payment.id)} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: 0 }}>Generate Contract Offer</h2>
                  <div style={{ opacity: 0.68, marginTop: 6, fontSize: 13 }}>
                    Offers come from {ownerTeamName} and post to the selected driver page.
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>AVAILABLE TEAM ACCOUNT</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: "#d4af37" }}>{money(currentTeamBalance)}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                  <select
                    value={drivers.find((driver) => driver.name === contractForm.driver_name)?.id || ""}
                    onChange={(event) => selectContractDriver(event.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Select driver</option>
                    {availableDriversForOffers.map((driver) => (
                      <option key={driver.id || driver.number || driver.name} value={driver.id}>
                        #{driver.number} {driver.name} · {driver.team || "Free Agent"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER NUMBER</div>
                  <input value={contractForm.driver_number} onChange={(event) => updateContractField("driver_number", event.target.value)} style={inputStyle} placeholder="Driver number" />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>MANUFACTURER</div>
                  <input value={contractForm.manufacturer} onChange={(event) => updateContractField("manufacturer", event.target.value)} style={inputStyle} placeholder="Chevrolet / Ford / Toyota" />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SALARY</div>
                  <input type="number" min={250000} value={contractForm.salary} onChange={(event) => updateContractField("salary", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SIGNING BONUS</div>
                  <input type="number" min={0} value={contractForm.signing_bonus} onChange={(event) => updateContractField("signing_bonus", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>CONTRACT LENGTH</div>
                  <input type="number" min={1} value={contractForm.contract_length} onChange={(event) => updateContractField("contract_length", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>BUYOUT AMOUNT</div>
                  <input type="number" min={0} value={contractForm.buyout_amount} onChange={(event) => updateContractField("buyout_amount", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>WIN BONUS</div>
                  <input type="number" min={0} value={contractForm.win_bonus} onChange={(event) => updateContractField("win_bonus", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>CHAMPIONSHIP BONUS</div>
                  <input type="number" min={0} value={contractForm.championship_bonus} onChange={(event) => updateContractField("championship_bonus", event.target.value)} style={inputStyle} />
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>BRAND STYLE</div>
                  <select value={contractForm.brand_style} onChange={(event) => updateContractField("brand_style", event.target.value)} style={inputStyle}>
                    <option>Professional / Sponsor Friendly</option>
                    <option>Balanced</option>
                    <option>Aggressive / Edgy</option>
                    <option>Owner Defined</option>
                  </select>
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>OFFER EXPIRES</div>
                  <input type="date" value={contractForm.expires_at} onChange={(event) => updateContractField("expires_at", event.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginTop: 14 }}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={contractForm.no_trade_clause} onChange={(event) => updateContractField("no_trade_clause", event.target.checked)} />
                  No-trade clause
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={contractForm.team_option} onChange={(event) => updateContractField("team_option", event.target.checked)} />
                  Team option
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={contractForm.mutual_option} onChange={(event) => updateContractField("mutual_option", event.target.checked)} />
                  Mutual option
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={contractForm.guaranteed_seat} onChange={(event) => updateContractField("guaranteed_seat", event.target.checked)} />
                  Guaranteed seat
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginTop: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>MEDIA REQUIREMENTS / BRAND CONDUCT</div>
                  <textarea
                    value={contractForm.media_requirements}
                    onChange={(event) => updateContractField("media_requirements", event.target.value)}
                    placeholder="Example: professional, sponsor-friendly, edgy but within league rules, required interviews, Discord conduct, etc."
                    style={{ ...inputStyle, minHeight: 95, resize: "vertical" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>CONTRACT NOTES</div>
                  <textarea
                    value={contractForm.notes}
                    onChange={(event) => updateContractField("notes", event.target.value)}
                    placeholder="Add any special terms, expectations, storyline details, or owner notes."
                    style={{ ...inputStyle, minHeight: 95, resize: "vertical" }}
                  />
                </div>
              </div>

              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, marginTop: 14, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                <div><strong>Immediate Cost:</strong> {money((Number(contractForm.salary) || 0) + (Number(contractForm.signing_bonus) || 0))}</div>
                <div><strong>Max Buyout:</strong> {money((Number(contractForm.salary) || 0) * 1.5)}</div>
                <div><strong>Min Salary:</strong> {money(MIN_DRIVER_SALARY)}</div>
                <div><strong>Min Length:</strong> {MIN_CONTRACT_LENGTH} season</div>
              </div>

              {contractError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{contractError}</div>}
              {contractMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{contractMessage}</div>}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <button onClick={submitContractOffer} style={primaryButtonStyle}>Generate Contract Offer</button>
                <button onClick={() => { setContractForm(DEFAULT_CONTRACT_FORM); setContractError(""); setContractMessage(""); }} style={secondaryButtonStyle}>Reset Form</button>
              </div>
            </div>
              </>
            )}

            <div style={sectionCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: 6 }}>Technical Alliance Requests</h2>
                  <div style={{ opacity: 0.68, fontSize: 13 }}>Each accepted alliance costs both teams {money(TECHNICAL_ALLIANCE_COST)}.</div>
                </div>
                <button onClick={loadTechnicalAlliances} style={secondaryButtonStyle}>Refresh Alliances</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 10, marginTop: 14, alignItems: "end" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REQUEST ALLIANCE WITH</div>
                  <select value={alliancePartner} onChange={(event) => setAlliancePartner(event.target.value)} style={inputStyle}>
                    <option value="">Select partner team</option>
                    {availableAlliancePartners.map((team) => (
                      <option key={team} value={team}>{getTeamFullName(team)}</option>
                    ))}
                  </select>
                </div>
                <button onClick={requestTechnicalAlliance} style={primaryButtonStyle}>Request Alliance</button>
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>Pending Requests</div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{pendingAllianceCount}</div>
                </div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>
                  <div style={{ fontSize: 11, opacity: 0.65 }}>Accepted Alliance Cost</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: selected.allianceCosts ? "#f87171" : "white" }}>{money(selected.allianceCosts)}</div>
                </div>
              </div>

              {allianceError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{allianceError}</div>}
              {allianceMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{allianceMessage}</div>}

              {technicalAlliances.length === 0 ? (
                <div style={{ opacity: 0.72, marginTop: 12 }}>No technical alliance requests involving {ownerTeamName} yet.</div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Team</th>
                        <th style={thStyle}>Partner</th>
                        <th style={thStyle}>Cost Per Team</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicalAlliances.map((alliance) => {
                        const isIncoming = String(alliance.alliance_team || "").toLowerCase() === ownerTeamName.toLowerCase();
                        const isPending = alliance.status === "Pending";
                        return (
                          <tr key={alliance.id}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>{alliance.team}</td>
                            <td style={tdStyle}>{alliance.alliance_team}</td>
                            <td style={tdStyle}>{money(alliance.cost_per_team || TECHNICAL_ALLIANCE_COST)}</td>
                            <td style={{ ...tdStyle, fontWeight: 900, color: alliance.status === "Accepted" ? "#4ade80" : alliance.status === "Pending" ? "#d4af37" : "#f87171" }}>{alliance.status}</td>
                            <td style={tdStyle}>
                              {isPending && isIncoming ? (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button onClick={() => updateTechnicalAllianceStatus(alliance.id, "Accepted")} style={{ ...primaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Accept</button>
                                  <button onClick={() => updateTechnicalAllianceStatus(alliance.id, "Declined")} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Decline</button>
                                </div>
                              ) : isPending ? (
                                <button onClick={() => updateTechnicalAllianceStatus(alliance.id, "Cancelled")} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Cancel</button>
                              ) : "—"}
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: 6 }}>Active League Contracts</h2>
                  <div style={{ opacity: 0.68, fontSize: 13 }}>
                    View all accepted/active contracts currently recorded in the owner portal.
                  </div>
                </div>
                <button onClick={loadActiveContracts} style={secondaryButtonStyle}>Refresh Active Contracts</button>
              </div>

              {activeContracts.length === 0 ? (
                <div style={{ opacity: 0.72, marginTop: 12 }}>No active or accepted contracts are currently listed.</div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Driver</th>
                        <th style={thStyle}>Team</th>
                        <th style={thStyle}>Manufacturer</th>
                        <th style={thStyle}>Salary</th>
                        <th style={thStyle}>Bonus</th>
                        <th style={thStyle}>Length</th>
                        <th style={thStyle}>Buyout</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map((contract) => {
                        const canTerminate = canManageContract(contract);
                        const cost = calculateContractTerminationCost(contract);
                        return (
                          <tr key={contract.id}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || "—"} {contract.driver_name}</td>
                            <td style={tdStyle}>{contract.team || contract.created_by_team || "—"}</td>
                            <td style={tdStyle}>{contract.manufacturer || "—"}</td>
                            <td style={tdStyle}>{money(contract.salary)}</td>
                            <td style={tdStyle}>{money(contract.signing_bonus)}</td>
                            <td style={tdStyle}>{contract.contract_length || "—"} season{Number(contract.contract_length) === 1 ? "" : "s"}</td>
                            <td style={tdStyle}>{money(contract.buyout_amount)}</td>
                            <td style={{ ...tdStyle, fontWeight: 900, color: String(contract.status || "").includes("Terminated") ? "#f87171" : "#4ade80" }}>{contract.status}</td>
                            <td style={tdStyle}>
                              {canTerminate ? (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button
                                    type="button"
                                    disabled={terminationBusyId === contract.id}
                                    onClick={() => terminateContractPaidOut(contract)}
                                    title={`Cost: ${money(cost.total)}`}
                                    style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12, opacity: terminationBusyId === contract.id ? 0.6 : 1 }}
                                  >
                                    {terminationBusyId === contract.id ? "Processing..." : "Terminate / Pay Out"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={terminationBusyId === contract.id}
                                    onClick={() => requestForCauseTermination(contract)}
                                    style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12, opacity: terminationBusyId === contract.id ? 0.6 : 1 }}
                                  >
                                    For Cause Request
                                  </button>
                                </div>
                              ) : "—"}
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
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: 6 }}>My Contract Offers</h2>
                  <div style={{ opacity: 0.68, fontSize: 13 }}>{pendingOfferCount} pending offer{pendingOfferCount === 1 ? "" : "s"}</div>
                </div>
                <button onClick={loadContractOffers} style={secondaryButtonStyle}>Refresh Offers</button>
              </div>
              {contractOffers.length === 0 ? (
                <div style={{ opacity: 0.72, marginTop: 12 }}>No contract offers have been created by {ownerTeamName} yet.</div>
              ) : (
                <div style={{ overflowX: "auto", marginTop: 12 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Driver</th>
                        <th style={thStyle}>Salary</th>
                        <th style={thStyle}>Bonus</th>
                        <th style={thStyle}>Length</th>
                        <th style={thStyle}>Buyout</th>
                        <th style={thStyle}>Brand</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contractOffers.map((offer) => (
                        <tr key={offer.id}>
                          <td style={{ ...tdStyle, fontWeight: 900 }}>#{offer.driver_number || "—"} {offer.driver_name}</td>
                          <td style={tdStyle}>{money(offer.salary)}</td>
                          <td style={tdStyle}>{money(offer.signing_bonus)}</td>
                          <td style={tdStyle}>{offer.contract_length} season{Number(offer.contract_length) === 1 ? "" : "s"}</td>
                          <td style={tdStyle}>{money(offer.buyout_amount)}</td>
                          <td style={tdStyle}>{offer.brand_style || "—"}</td>
                          <td style={{ ...tdStyle, fontWeight: 900, color: offer.status === "Accepted" ? "#4ade80" : offer.status === "Pending" ? "#d4af37" : offer.status === "Declined" || offer.status === "Withdrawn" ? "#f87171" : "white" }}>{offer.status}</td>
                          <td style={tdStyle}>
                            {offer.status === "Pending" ? (
                              <button onClick={() => withdrawContractOffer(offer.id)} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Withdraw</button>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0 }}>My Team Roster</h2>
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
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.drivers.map((driver) => (
                      <tr key={driver.id} onClick={() => (window.location.pathname = `/driver/${driver.number}`)} style={{ cursor: "pointer" }}>
                        <td style={tdStyle}>#{driver.number}</td>
                        <td style={{ ...tdStyle, fontWeight: 800 }}>{driver.name}</td>
                        <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                        <td style={tdStyle}>{driver.points || 0}</td>
                        <td style={tdStyle}>{driver.wins || 0}</td>
                        <td style={tdStyle}>{driver.top3 || 0}</td>
                        <td style={tdStyle}>{driver.top5 || 0}</td>
                        <td style={tdStyle}>{driver.dnfs || 0}</td>
                        <td style={tdStyle}>{driver.retired ? "Retired" : "Active"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0 }}>My Race Financials</h2>
              {selected.raceRows.length === 0 ? (
                <div style={{ opacity: 0.72 }}>No race financial data yet for {getTeamFullName(selected.team)}.</div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Race</th>
                        <th style={thStyle}>Driver</th>
                        <th style={thStyle}>Finish</th>
                        <th style={thStyle}>Payout</th>
                        <th style={thStyle}>DNF Cost</th>
                        <th style={thStyle}>Penalty Cost</th>
                        <th style={thStyle}>Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.raceRows.map((row, index) => (
                        <tr key={`${row.raceName}-${row.driver.id}-${index}`}>
                          <td style={tdStyle}>{row.raceName}</td>
                          <td style={{ ...tdStyle, fontWeight: 800 }}>#{row.driver.number} {row.driver.name}</td>
                          <td style={tdStyle}>P{row.finishPos || "—"}</td>
                          <td style={tdStyle}>{money(row.payout)}</td>
                          <td style={{ ...tdStyle, color: row.dnfCost ? "#f87171" : "inherit" }}>{row.dnfCost ? money(row.dnfCost) : "—"}</td>
                          <td style={{ ...tdStyle, color: row.penaltyCost ? "#f87171" : "inherit" }}>{row.penaltyCost ? money(row.penaltyCost) : "—"}</td>
                          <td style={{ ...tdStyle, fontWeight: 900, color: row.net >= 0 ? "#4ade80" : "#f87171" }}>{money(row.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0 }}>My Team Finance Rules</h2>
              <div style={{ opacity: 0.72, marginBottom: 12 }}>Starting money now follows your roster-size rule: 1 driver = $300,000 · 2 drivers = $700,000 · 3 drivers = $1,000,000 · 4 drivers = $1,500,000.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏆 Standard win payout: <strong>{money(250000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏁 Daytona win: <strong>{money(750000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>👑 Charlotte win: <strong>{money(500000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🥉 Race top 3 payout: <strong>{money(50000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🔥 Race top 5 payout: <strong>{money(20000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>✅ Race top 10 payout: <strong>{money(10000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏁 Below top 10: <strong>{money(5000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>💥 DNF cost: <strong>{money(100000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🚨 Penalty cost: <strong>{money(25000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🤝 Technical alliance cost: <strong>{money(50000)}</strong> per team when accepted</div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>💵 Independent driver payments: <strong>Owner-entered amount</strong> deducted from team budget</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
