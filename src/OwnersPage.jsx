import React, { useMemo, useState } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoBOM from "./assets/teams/BOM.png";
import teamLogoWSM from "./assets/teams/WSM.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import teamLogoBWR from "./assets/teams/BWR.png";
import { supabase } from "./lib/supabase";

const teamLogos = {
  JAM: teamLogoJAM,
  MER: teamLogoMER,
  NLM: teamLogoNLM,
  MMS: teamLogoMMS,
  BOM: teamLogoBOM,
  WSM: teamLogoWSM,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  BWR: teamLogoBWR,
};

const teamFullNames = {
  JAM: "JA Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt Sick6 Motorsports",
  BWR: "Big Wheel Racing",
  IND: "Independent",
  Independent: "Independent",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
};

const ownerNames = {
  JAM: "JA Motorsports Ownership Group",
  MER: "ME Racing Ownership Group",
  MMS: "Mayhem Motorsports Ownership Group",
  NLM: "Nine Line Motorsports Ownership Group",
  BWR: "Big Wheel Racing Ownership Group",
  WSM: "Uncle_HowdySICK6",
  "19XI": "bowhunter6758",
  "19XI Racing": "bowhunter6758",
  BOM: "Blue Oval Motorsports",
  Independent: "Free Agent Pool",
  IND: "Free Agent Pool",
};

const TEAM_STARTING_FUNDS = {
  1: 300000,
  2: 700000,
  3: 1000000,
  4: 1500000,
};

const TEAM_BUDGET_OVERRIDES = {
  JAM: 5000000,
};

const TECHNICAL_ALLIANCE_COST = 50000;

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

export default function OwnersPage({ drivers = [], teams = [], raceHistory = [], seasonName = "" }) {
  const availableTeams = useMemo(() => {
    const teamSet = new Set(drivers.map((driver) => driver.team || "Independent"));
    return Array.from(teamSet)
      .filter((team) => team !== "Independent" && team !== "IND")
      .sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [drivers]);

  const [selectedTeam, setSelectedTeam] = useState(() => localStorage.getItem("ownerPortalTeam") || availableTeams[0] || "JAM");
  const [accessCode, setAccessCode] = useState("");
  const [authorizedTeam, setAuthorizedTeam] = useState(() => localStorage.getItem("ownerPortalAuthorizedTeam") || "");
  const [error, setError] = useState("");
  const [ownerAccessCodes, setOwnerAccessCodes] = useState(loadLocalOwnerAccessCodes);
  const [teamFinance, setTeamFinance] = useState(null);
  const [contractOffers, setContractOffers] = useState([]);
  const [activeContracts, setActiveContracts] = useState([]);
  const [contractMessage, setContractMessage] = useState("");
  const [contractError, setContractError] = useState("");
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
  const [driverTaskMessage, setDriverTaskMessage] = useState("");
  const [driverTaskError, setDriverTaskError] = useState("");
  const [newDriverTaskForm, setNewDriverTaskForm] = useState({ driver_number: "", title: "", description: "", reward: "", due_race: "" });
  const [teamRivalries, setTeamRivalries] = useState([]);
  const [rivalryMessage, setRivalryMessage] = useState("");
  const [rivalryError, setRivalryError] = useState("");
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

  function updateContractField(field, value) {
    setContractForm((current) => ({ ...current, [field]: value }));
  }

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

  async function loadTeamFinance() {
    if (!safeSelectedTeam) return;

    const { data, error: financeError } = await supabase
      .from("team_finances")
      .select("*")
      .eq("team", ownerTeamName)
      .maybeSingle();

    if (financeError) {
      console.error("Failed to load team finance:", financeError);
      setTeamFinance(null);
      return;
    }

    setTeamFinance(data || null);
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
    loadTeamRivalries();
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
    const latestCodes = await loadRemoteOwnerAccessCodes();
    setOwnerAccessCodes(latestCodes);
    const expected = String(latestCodes[safeSelectedTeam] || ownerAccessCodes[safeSelectedTeam] || "").trim().toUpperCase();
    if (!expected) {
      setError("No owner code has been generated for this team yet. Contact league admin.");
      return;
    }
    if (String(accessCode).trim().toUpperCase() !== expected) {
      setError("Incorrect owner code for this team.");
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
                    <h2 style={{ margin: 0 }}>🎯 Driver Assignments</h2>
                    <div style={{ opacity: 0.68, fontSize: 13, marginTop: 6 }}>Send weekly tasks directly to your drivers. They appear on each driver profile under Assignments.</div>
                  </div>
                  <button onClick={loadDriverTasks} style={secondaryButtonStyle}>Refresh Assignments</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Open Assignments</div><div style={{ fontSize: 28, fontWeight: 900 }}>{openDriverTaskCount}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}><div style={{ opacity: 0.65, fontSize: 12 }}>Completed</div><div style={{ fontSize: 28, fontWeight: 900 }}>{completedDriverTaskCount}</div></div>
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
                      <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>ASSIGNMENT TITLE</div>
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
                  <button type="submit" style={{ ...primaryButtonStyle, marginTop: 12 }}>Send Driver Assignment</button>
                  {driverTaskMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 800 }}>{driverTaskMessage}</div>}
                  {driverTaskError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{driverTaskError}</div>}
                </form>

                {driverTasks.length === 0 ? (
                  <div style={{ opacity: 0.72 }}>No driver assignments created yet.</div>
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
                <h2 style={{ marginTop: 0 }}>Driver Development Program</h2>
                <p style={{ opacity: 0.72 }}>Use this section for prospects, reserve drivers, test drivers, and future signings. Database saving can be added next with a development_drivers table.</p>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>Recommended next action: add a prospect form with name, number, potential rating, cost, and notes.</div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map((contract) => (
                        <tr key={contract.id}>
                          <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || "—"} {contract.driver_name}</td>
                          <td style={tdStyle}>{contract.team || contract.created_by_team || "—"}</td>
                          <td style={tdStyle}>{contract.manufacturer || "—"}</td>
                          <td style={tdStyle}>{money(contract.salary)}</td>
                          <td style={tdStyle}>{money(contract.signing_bonus)}</td>
                          <td style={tdStyle}>{contract.contract_length || "—"} season{Number(contract.contract_length) === 1 ? "" : "s"}</td>
                          <td style={tdStyle}>{money(contract.buyout_amount)}</td>
                          <td style={{ ...tdStyle, fontWeight: 900, color: "#4ade80" }}>{contract.status}</td>
                        </tr>
                      ))}
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
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map((contract) => (
                        <tr key={contract.id}>
                          <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || "—"} {contract.driver_name}</td>
                          <td style={tdStyle}>{contract.team || contract.created_by_team || "—"}</td>
                          <td style={tdStyle}>{contract.manufacturer || "—"}</td>
                          <td style={tdStyle}>{money(contract.salary)}</td>
                          <td style={tdStyle}>{money(contract.signing_bonus)}</td>
                          <td style={tdStyle}>{contract.contract_length || "—"} season{Number(contract.contract_length) === 1 ? "" : "s"}</td>
                          <td style={tdStyle}>{money(contract.buyout_amount)}</td>
                          <td style={{ ...tdStyle, fontWeight: 900, color: "#4ade80" }}>{contract.status}</td>
                        </tr>
                      ))}
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
