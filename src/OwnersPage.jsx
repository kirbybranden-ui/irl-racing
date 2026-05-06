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

const startingBudgets = {
  JAM: 5000000,
  MER: 5000000,
  MMS: 5000000,
  NLM: 5000000,
  WSM: 5000000,
  "19XI": 5000000,
  "19XI Racing": 5000000,
  BOM: 5000000,
  Independent: 0,
  IND: 0,
};

const appShellStyle = { minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1180, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 12, letterSpacing: 0.4 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 13 };

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

function getFinishPay(finishPos) {
  const finish = Number(finishPos);
  if (finish === 1) return 250000;
  if (finish >= 2 && finish <= 3) return 100000;
  if (finish >= 4 && finish <= 5) return 75000;
  if (finish >= 6 && finish <= 10) return 25000;
  if (finish > 10) return 10000;
  return 0;
}

function buildTeamFinancialRow(team, drivers, teams, raceHistory) {
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
      const payout = getFinishPay(result.finishPos);
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

  const allianceCosts = team === "19XI" || team === "19XI Racing" ? 50000 : 0;
  const startingBudget = startingBudgets[team] ?? 5000000;
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
  const selected = useMemo(() => buildTeamFinancialRow(safeSelectedTeam, drivers, teams, raceHistory), [safeSelectedTeam, drivers, teams, raceHistory]);
  const isAuthorized = authorizedTeam === safeSelectedTeam;

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
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏆 Win payout: <strong>{money(250000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🥉 Top 3 payout: <strong>{money(100000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🔥 Top 5 payout: <strong>{money(75000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>✅ Top 10 payout: <strong>{money(25000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏁 Other finishers: <strong>{money(10000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>💥 DNF cost: <strong>{money(100000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🚨 Penalty cost: <strong>{money(25000)}</strong></div>
                <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🤝 19XI alliance cost: <strong>{money(50000)}</strong></div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
