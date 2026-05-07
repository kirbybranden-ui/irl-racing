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
};

const teamFullNames = {
  JAM: "JA Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt Sick6 Motorsports",
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

const TECHNICAL_ALLIANCE_COST = 50000;

function getTeamStartingBudget(driverCount) {
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

function buildTeamFinancialRow(team, drivers, teams, raceHistory, technicalAlliances = []) {
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
  const startingBudget = getTeamStartingBudget(teamDrivers.length);
  const totalCosts = dnfCosts + penaltyCosts + allianceCosts;
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
  const [contractMessage, setContractMessage] = useState("");
  const [contractError, setContractError] = useState("");
  const [contractForm, setContractForm] = useState(DEFAULT_CONTRACT_FORM);
  const [technicalAlliances, setTechnicalAlliances] = useState([]);
  const [alliancePartner, setAlliancePartner] = useState("");
  const [allianceMessage, setAllianceMessage] = useState("");
  const [allianceError, setAllianceError] = useState("");


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
  const selected = useMemo(() => buildTeamFinancialRow(safeSelectedTeam, drivers, teams, raceHistory, technicalAlliances), [safeSelectedTeam, drivers, teams, raceHistory, technicalAlliances]);
  const isAuthorized = authorizedTeam === safeSelectedTeam;


  const availableDriversForOffers = useMemo(() => {
    return drivers
      .filter((driver) => !driver.retired)
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }, [drivers]);

  const ownerTeamName = getTeamFullName(safeSelectedTeam);
  const currentTeamBalance = Number(teamFinance?.balance ?? selected.projectedBudget ?? 0);
  const pendingOfferCount = contractOffers.filter((offer) => offer.status === "Pending").length;
  const availableAlliancePartners = availableTeams.filter((team) => team !== safeSelectedTeam);
  const pendingAllianceCount = technicalAlliances.filter((alliance) => alliance.status === "Pending").length;

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
    loadTechnicalAlliances();
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
  }


  async function acceptCounterOffer(offer) {
    setContractMessage("");
    setContractError("");

    const counterSalary = Number(offer.counter_salary || offer.salary || 0);
    const counterBonus = Number(offer.counter_bonus || offer.signing_bonus || 0);
    const counterLength = Number(offer.counter_contract_length || offer.contract_length || 1);
    const counterBuyout = Number(offer.counter_buyout_amount || offer.buyout_amount || 0);
    const totalImmediateCost = counterSalary + counterBonus;

    if (counterSalary < MIN_DRIVER_SALARY) {
      setContractError("Counter salary must be at least $250,000.");
      return;
    }

    if (counterLength < MIN_CONTRACT_LENGTH) {
      setContractError("Counter contract length must be at least 1 season.");
      return;
    }

    if (counterBonus < 0 || counterBuyout < 0) {
      setContractError("Counter offer money fields cannot be negative.");
      return;
    }

    if (counterBuyout > counterSalary * 1.5) {
      setContractError("Counter buyout cannot exceed 1.5x the contract amount.");
      return;
    }

    if (counterBonus > currentTeamBalance) {
      setContractError("Counter signing bonus cannot exceed the team account balance.");
      return;
    }

    if (totalImmediateCost > currentTeamBalance) {
      setContractError("Counter salary plus signing bonus exceeds your available team balance.");
      return;
    }

    const { error: acceptError } = await supabase
      .from("contract_offers")
      .update({
        salary: counterSalary,
        signing_bonus: counterBonus,
        contract_length: counterLength,
        buyout_amount: counterBuyout,
        status: "Pending",
        notes: offer.counter_notes ? `${offer.notes || ""}

OWNER APPROVED COUNTER TERMS: ${offer.counter_notes}`.trim() : offer.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id)
      .or(`team.eq.${ownerTeamName},created_by_team.eq.${ownerTeamName}`);

    if (acceptError) {
      console.error("Could not accept counter offer:", acceptError);
      setContractError("Could not accept counter offer. Check contract_offers RLS update policy.");
      return;
    }

    setContractMessage("Counter offer approved and sent back to the driver as a pending offer.");
    await loadContractOffers();
  }

  async function declineCounterOffer(offer) {
    setContractMessage("");
    setContractError("");

    if (!window.confirm(`Decline counter offer from ${offer.driver_name}?`)) return;

    const { error: declineError } = await supabase
      .from("contract_offers")
      .update({ status: "Declined", updated_at: new Date().toISOString() })
      .eq("id", offer.id)
      .or(`team.eq.${ownerTeamName},created_by_team.eq.${ownerTeamName}`);

    if (declineError) {
      console.error("Could not decline counter offer:", declineError);
      setContractError("Could not decline counter offer. Check contract_offers RLS update policy.");
      return;
    }

    setContractMessage("Counter offer declined.");
    await loadContractOffers();
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
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>Owners Portal</div>
                <div style={{ opacity: 0.72, marginTop: 5 }}>{seasonName || "Active Season"} · Private Team View</div>
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
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>OWNER TEAM</div>
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
              Owners only see the team they unlock. Owner codes are generated and managed from the admin portal.
            </div>
          )}
          {error && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{error}</div>}
        </div>

        {!isAuthorized ? (
          <div style={{ ...sectionCardStyle, textAlign: "center", padding: 34 }}>
            <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Locked Owner View</div>
            <div style={{ opacity: 0.72 }}>Unlock your team to view roster, budget, payouts, penalties, and race financials.</div>
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
                { label: "Net", value: money(selected.netRevenue), good: selected.netRevenue >= 0 },
                { label: "Team Points", value: selected.points },
                { label: "Team Wins", value: selected.wins },
              ].map((stat) => (
                <div key={stat.label} style={{ background: "#131922", border: "1px solid #2d3643", borderRadius: 16, padding: 16 }}>
                  <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: stat.good === undefined ? "white" : stat.good ? "#4ade80" : "#f87171" }}>{stat.value}</div>
                </div>
              ))}
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
                      {contractOffers.map((offer) => {
                        const isCountered = offer.status === "Countered";
                        return (
                          <tr key={offer.id}>
                            <td style={{ ...tdStyle, fontWeight: 900 }}>
                              #{offer.driver_number || "—"} {offer.driver_name}
                              {isCountered && (
                                <div style={{ marginTop: 8, background: "#11161d", border: "1px solid #2c3440", borderRadius: 10, padding: 10, fontWeight: 400 }}>
                                  <div style={{ fontWeight: 900, color: "#d4af37", marginBottom: 6 }}>Counter Offer Received</div>
                                  <div><strong>Counter Salary:</strong> {money(offer.counter_salary)}</div>
                                  <div><strong>Counter Bonus:</strong> {money(offer.counter_bonus)}</div>
                                  <div><strong>Counter Length:</strong> {offer.counter_contract_length || "—"} season{Number(offer.counter_contract_length) === 1 ? "" : "s"}</div>
                                  <div><strong>Counter Buyout:</strong> {money(offer.counter_buyout_amount)}</div>
                                  {offer.counter_notes && <div style={{ marginTop: 6, lineHeight: 1.45 }}><strong>Driver Notes:</strong> {offer.counter_notes}</div>}
                                </div>
                              )}
                            </td>
                            <td style={tdStyle}>{money(offer.salary)}</td>
                            <td style={tdStyle}>{money(offer.signing_bonus)}</td>
                            <td style={tdStyle}>{offer.contract_length} season{Number(offer.contract_length) === 1 ? "" : "s"}</td>
                            <td style={tdStyle}>{money(offer.buyout_amount)}</td>
                            <td style={tdStyle}>{offer.brand_style || "—"}</td>
                            <td style={{ ...tdStyle, fontWeight: 900, color: offer.status === "Accepted" ? "#4ade80" : offer.status === "Pending" || offer.status === "Countered" ? "#d4af37" : offer.status === "Declined" || offer.status === "Withdrawn" ? "#f87171" : "white" }}>{offer.status}</td>
                            <td style={tdStyle}>
                              {offer.status === "Pending" ? (
                                <button onClick={() => withdrawContractOffer(offer.id)} style={{ ...secondaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Withdraw</button>
                              ) : offer.status === "Countered" ? (
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button onClick={() => acceptCounterOffer(offer)} style={{ ...primaryButtonStyle, background: "#22c55e", padding: "7px 10px", fontSize: 12 }}>Accept Counter</button>
                                  <button onClick={() => declineCounterOffer(offer)} style={{ ...secondaryButtonStyle, background: "#7f1d1d", border: "1px solid #991b1b", padding: "7px 10px", fontSize: 12 }}>Decline Counter</button>
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
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
