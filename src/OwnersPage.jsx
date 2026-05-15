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

  const hqTabs = [
    ["overview", "Overview"],
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

  React.useEffect(() => {
    if (!isAuthorized) return;
    loadTeamFinance();
    loadContractOffers();
    loadActiveContracts();
    loadTechnicalAlliances();
    loadDriverFeedback();
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
                <h2 style={{ marginTop: 0 }}>Manufacturer Contract</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Manufacturer</div><div style={{ fontSize: 26, fontWeight: 900 }}>{manufacturerContract.manufacturer}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Support Money</div><div style={{ fontSize: 26, fontWeight: 900 }}>{money(manufacturerContract.supportAmount)}</div></div>
                  <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}><div style={{ opacity: 0.65 }}>Win Bonus</div><div style={{ fontSize: 26, fontWeight: 900 }}>{money(manufacturerContract.winBonus)}</div></div>
                </div>
                <div style={{ marginTop: 12, opacity: 0.76 }}>Expectation: {manufacturerContract.expectation}</div>
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
                <h2 style={{ marginTop: 0 }}>Team Rivalries</h2>
                <p style={{ opacity: 0.72 }}>Rivalries can be built from technical alliances, incidents, and owner media comments.</p>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16 }}>Current rivalry heat: {mediaPressureScore}/100</div>
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
