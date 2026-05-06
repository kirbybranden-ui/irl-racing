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
const pageContainerStyle = { maxWidth: 1420, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 12, letterSpacing: 0.4 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 13 };

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function getTeamFullName(team) {
  return teamFullNames[team] || team;
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

export default function OwnersPage({ drivers = [], teams = [], raceHistory = [], seasonName = "" }) {
  const availableTeams = useMemo(() => {
    const teamSet = new Set(drivers.map((driver) => driver.team || "Independent"));
    return Array.from(teamSet).sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [drivers]);

  const [selectedTeam, setSelectedTeam] = useState(availableTeams[0] || "JAM");

  const financialRows = useMemo(() => {
    return availableTeams.map((team) => {
      const teamDrivers = drivers.filter((driver) => (driver.team || "Independent") === team);
      const teamStanding = teams.find((standing) => standing.team === team) || {};
      let raceIncome = 0;
      let dnfCosts = 0;
      let penaltyCosts = 0;
      let starts = 0;

      raceHistory.forEach((race) => {
        (race.results || []).forEach((result) => {
          const driver = teamDrivers.find((item) => item.id === result.driverId);
          if (!driver) return;
          starts += 1;
          raceIncome += getFinishPay(result.finishPos);
          if (result.dnf) dnfCosts += 100000;
          if (result.offense || Number(result.penaltyPoints) > 0) penaltyCosts += 25000;
        });
      });

      const allianceCosts = team === "19XI" || team === "19XI Racing" ? 50000 : 0;
      const startingBudget = startingBudgets[team] ?? 5000000;
      const netRevenue = raceIncome - dnfCosts - penaltyCosts - allianceCosts;
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
        startingBudget,
        netRevenue,
        projectedBudget,
      };
    }).sort((a, b) => b.projectedBudget - a.projectedBudget || b.points - a.points);
  }, [availableTeams, drivers, teams, raceHistory]);

  const selected = financialRows.find((row) => row.team === selectedTeam) || financialRows[0];
  const leagueTotals = financialRows.reduce((acc, row) => {
    acc.budget += row.projectedBudget;
    acc.income += row.raceIncome;
    acc.costs += row.dnfCosts + row.penaltyCosts + row.allianceCosts;
    acc.drivers += row.drivers.length;
    return acc;
  }, { budget: 0, income: 0, costs: 0, drivers: 0 });

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>Owners Portal</div>
                <div style={{ opacity: 0.72, marginTop: 5 }}>{seasonName || "Active Season"} · Budweiser Cup League</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/")} style={secondaryButtonStyle}>Admin</button>
              <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>Standings</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 20 }}>
          {[
            { label: "LEAGUE BUDGET VALUE", value: money(leagueTotals.budget) },
            { label: "RACE PAYOUTS EARNED", value: money(leagueTotals.income) },
            { label: "TOTAL COSTS", value: money(leagueTotals.costs) },
            { label: "ACTIVE DRIVERS", value: leagueTotals.drivers },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#131922", border: "1px solid #2d3643", borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
          <h2 style={{ marginTop: 0 }}>Team Owner View</h2>
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SELECT TEAM</div>
              <select value={selected?.team || selectedTeam} onChange={(event) => setSelectedTeam(event.target.value)} style={{ width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px" }}>
                {financialRows.map((row) => <option key={row.team} value={row.team}>{getTeamFullName(row.team)}</option>)}
              </select>
              {selected && teamLogos[selected.team] && (
                <div style={{ marginTop: 16, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, textAlign: "center" }}>
                  <img src={teamLogos[selected.team]} alt={selected.team} style={{ maxWidth: 130, maxHeight: 130, objectFit: "contain" }} />
                </div>
              )}
            </div>

            {selected && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900 }}>{getTeamFullName(selected.team)}</div>
                    <div style={{ opacity: 0.7, marginTop: 4 }}>Owner: {selected.owner}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>PROJECTED TEAM BUDGET</div>
                    <div style={{ fontSize: 30, fontWeight: 900, color: selected.projectedBudget >= selected.startingBudget ? "#4ade80" : "#f87171" }}>{money(selected.projectedBudget)}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Points", value: selected.points },
                    { label: "Wins", value: selected.wins },
                    { label: "Race Income", value: money(selected.raceIncome) },
                    { label: "DNF Costs", value: money(selected.dnfCosts) },
                    { label: "Penalty Costs", value: money(selected.penaltyCosts) },
                    { label: "Alliance Cost", value: money(selected.allianceCosts) },
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 900 }}>{stat.value}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ marginBottom: 10 }}>Driver Contracts / Roster</h3>
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
                          <td style={tdStyle}>{driver.retired ? "Retired" : "Active"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Owner Financial Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Rank</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Drivers</th>
                  <th style={thStyle}>Race Income</th>
                  <th style={thStyle}>Costs</th>
                  <th style={thStyle}>Net</th>
                  <th style={thStyle}>Projected Budget</th>
                  <th style={thStyle}>Points</th>
                </tr>
              </thead>
              <tbody>
                {financialRows.map((row, index) => {
                  const costs = row.dnfCosts + row.penaltyCosts + row.allianceCosts;
                  return (
                    <tr key={row.team} onClick={() => setSelectedTeam(row.team)} style={{ cursor: "pointer" }}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(row.team)}</td>
                      <td style={tdStyle}>{row.drivers.length}</td>
                      <td style={tdStyle}>{money(row.raceIncome)}</td>
                      <td style={{ ...tdStyle, color: costs > 0 ? "#f87171" : "inherit" }}>{money(costs)}</td>
                      <td style={{ ...tdStyle, color: row.netRevenue >= 0 ? "#4ade80" : "#f87171", fontWeight: 800 }}>{money(row.netRevenue)}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{money(row.projectedBudget)}</td>
                      <td style={tdStyle}>{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>League Finance Rules</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏆 Win payout: <strong>{money(250000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🥉 Top 3 payout: <strong>{money(100000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🔥 Top 5 payout: <strong>{money(75000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>✅ Top 10 payout: <strong>{money(25000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🏁 Other finishers: <strong>{money(10000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>💥 DNF cost: <strong>{money(100000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🚨 Penalty cost: <strong>{money(25000)}</strong></div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12 }}>🤝 Technical alliance: <strong>{money(50000)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
}
