import React, { useMemo, useState } from "react";
import { getTeamFullName } from "../data/teams";
import { money } from "../utils/formatters";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
} from "../styles/sharedStyles";

const MARKET_TABS = ["Overview", "Scouting", "Recruiting", "Rumor Mill", "Contracts", "History"];

const INTEREST_LEVELS = [
  { key: "watching", label: "Watching", score: 24 },
  { key: "interested", label: "Interested", score: 45 },
  { key: "very_interested", label: "Very Interested", score: 66 },
  { key: "hot", label: "Hot", score: 82 },
  { key: "top_target", label: "Top Target", score: 96 },
];

const RE_SIGN_LEVELS = [
  { key: "high_priority", label: "High Priority", score: 100 },
  { key: "would_like_back", label: "Would Like Back", score: 86 },
  { key: "open_to_negotiations", label: "Open to Negotiations", score: 68 },
  { key: "undecided", label: "Undecided", score: 45 },
  { key: "not_expected_back", label: "Not Expected Back", score: 18 },
  { key: "moving_on", label: "Moving On", score: 0 },
];

function cleanNumber(value) {
  return String(value ?? "").replace("#", "").trim();
}

function isExpiringDriver(driver) {
  const values = [
    driver.contractStatus,
    driver.contract_status,
    driver.contract?.status,
    driver.contract?.expiresAfterSeason,
    driver.contract?.expires_after_season,
    driver.expiresAfterSeason,
    driver.expires_after_season,
    driver.contract?.seasonEnd,
  ];

  return values.some((value) => {
    const text = String(value ?? "").toLowerCase();
    return value === true || text.includes("expir") || text.includes("end") || text.includes("2026");
  });
}

function getInterestScore(level) {
  return INTEREST_LEVELS.find((item) => item.key === level)?.score || 0;
}

function getInterestLabel(level) {
  return INTEREST_LEVELS.find((item) => item.key === level)?.label || "Watching";
}

function getReSignScore(level) {
  return RE_SIGN_LEVELS.find((item) => item.key === level)?.score || 45;
}

function getReSignLabel(level) {
  return RE_SIGN_LEVELS.find((item) => item.key === level)?.label || "Undecided";
}

function starsFromRating(rating) {
  if (rating >= 92) return "★★★★★";
  if (rating >= 84) return "★★★★☆";
  if (rating >= 75) return "★★★☆☆";
  if (rating >= 65) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function gradeFromScore(score) {
  if (score >= 94) return "A+";
  if (score >= 88) return "A";
  if (score >= 82) return "B+";
  if (score >= 76) return "B";
  if (score >= 68) return "C+";
  if (score >= 60) return "C";
  return "D";
}

function happinessValue(driver, type) {
  const keys = type === "sponsor"
    ? ["sponsorHappiness", "sponsor_happiness", "manufacturerSatisfaction", "manufacturer_satisfaction"]
    : ["teamHappiness", "team_happiness", "morale", "teamMorale"];

  for (const key of keys) {
    if (driver[key] !== undefined && driver[key] !== null && driver[key] !== "") return driver[key];
  }

  return "Not Rated";
}

function makeRaceStats(raceHistory = [], drivers = [], startParkRequests = []) {
  const map = new Map();

  (drivers || []).forEach((driver) => {
    map.set(cleanNumber(driver.number), {
      racesEntered: 0,
      racesMissed: 0,
      missedNoNotice: 0,
      dnfs: 0,
      startParks: 0,
      penalties: 0,
      stagePoints: 0,
      stageWins: 0,
      finishTotal: 0,
      finishCount: 0,
      averageFinish: "—",
    });
  });

  (raceHistory || []).forEach((race) => {
    const results = race.results || [];
    if (!results.length) return;

    (drivers || []).forEach((driver) => {
      const number = cleanNumber(driver.number);
      const stats = map.get(number);
      if (!stats) return;

      const result = results.find((item) => cleanNumber(item.number || item.driverNumber || item.car_number) === number);
      const raceName = String(race.raceName || race.name || "").toLowerCase();

      const approvedStartPark = (startParkRequests || []).some((request) => {
        const requestNumber = cleanNumber(request.driver_number || request.driverNumber || request.number);
        const requestRace = String(request.race_name || request.raceName || request.track || "").toLowerCase();
        const approved = String(request.status || "").toLowerCase() === "approved" || request.approved === true;
        return requestNumber === number && approved && (!requestRace || raceName.includes(requestRace) || requestRace.includes(raceName));
      });

      if (!result) {
        if (!approvedStartPark) {
          stats.racesMissed += 1;
          stats.missedNoNotice += 1;
        }
        return;
      }

      stats.racesEntered += 1;

      const finish = Number(result.finishPos || result.finish || result.position || 0);
      if (finish > 0) {
        stats.finishTotal += finish;
        stats.finishCount += 1;
      }

      if (result.dnf) stats.dnfs += 1;
      if (result.startPark) stats.startParks += 1;
      if (result.offense || Number(result.penaltyPoints || 0) > 0) stats.penalties += 1;

      const s1 = Number(result.stage1Points || result.stage1_points || 0);
      const s2 = Number(result.stage2Points || result.stage2_points || 0);
      const s3 = Number(result.stage3Points || result.stage3_points || 0);
      stats.stagePoints += s1 + s2 + s3;

      if (Number(result.stage1) === 1) stats.stageWins += 1;
      if (Number(result.stage2) === 1) stats.stageWins += 1;
      if (Number(result.stage3) === 1) stats.stageWins += 1;
    });
  });

  map.forEach((stats) => {
    stats.averageFinish = stats.finishCount ? (stats.finishTotal / stats.finishCount).toFixed(1) : "—";
  });

  return map;
}

function makePaintStats(paintSchemePayouts = [], drivers = []) {
  const map = new Map();

  (drivers || []).forEach((driver) => {
    map.set(cleanNumber(driver.number), {
      paintSchemePoints: 0,
      paintSchemeWins: 0,
      driverPaintEarnings: 0,
      teamPaintEarnings: 0,
    });
  });

  (paintSchemePayouts || []).forEach((week) => {
    (week.rows || week.payoutRows || []).forEach((row) => {
      const number = cleanNumber(row.driverNumber || row.driver_number || row.number);
      const stats = map.get(number);
      if (!stats) return;

      const rank = Number(row.rank || row.position || 0);
      const points = rank === 1 ? 10 : rank === 2 ? 9 : rank === 3 ? 8 : rank === 4 ? 7 : rank === 5 ? 6 : rank <= 10 ? 4 : rank <= 20 ? 2 : rank ? 1 : 0;

      stats.paintSchemePoints += points;
      if (rank === 1) stats.paintSchemeWins += 1;
      stats.driverPaintEarnings += Number(row.driverPayout || row.driver_payout || 0);
      stats.teamPaintEarnings += Number(row.teamPayout || row.team_payout || 0);
    });
  });

  return map;
}

function calculateDriverMarketRating(driver, raceStats, paintStats) {
  let rating = 58;
  rating += Math.min(22, Number(driver.points || 0) / 18);
  rating += Number(driver.wins || 0) * 5;
  rating += Number(driver.top3 || 0) * 2;
  rating += Number(driver.top5 || 0);
  rating += Math.min(8, Number(raceStats?.stagePoints || 0) / 8);
  rating += Math.min(7, Number(paintStats?.paintSchemePoints || 0) / 6);
  rating -= Number(raceStats?.missedNoNotice || 0) * 9;
  rating -= Number(raceStats?.dnfs || 0) * 3;
  rating -= Number(raceStats?.penalties || 0) * 2;

  return Math.max(40, Math.min(99, Math.round(rating)));
}

function makeInterestBoard(driver, interestRows = [], reSignRows = []) {
  const number = cleanNumber(driver.number);

  const board = (interestRows || [])
    .filter((row) => cleanNumber(row.driver_number || row.driverNumber || row.number) === number)
    .map((row) => ({
      team: row.interested_team || row.team || row.owner_team || "Unknown",
      owner: row.owner_name || row.interested_owner || "",
      label: getInterestLabel(row.interest_level || row.level || "watching"),
      score: getInterestScore(row.interest_level || row.level || "watching"),
      pitch: row.pitch || row.message || "",
      incumbent: false,
    }));

  const reSign = (reSignRows || []).find((row) => cleanNumber(row.driver_number || row.driverNumber || row.number) === number);
  const status = reSign?.status || driver.reSignStatus || driver.re_sign_status || "undecided";

  board.push({
    team: driver.team || "Independent",
    owner: reSign?.owner_name || "",
    label: getReSignLabel(status),
    score: getReSignScore(status),
    pitch: reSign?.message || "Current team has not made its re-signing position public yet.",
    incumbent: true,
  });

  return board.sort((a, b) => b.score - a.score).slice(0, 5);
}

function makeTeamGrades(drivers = [], raceStats = new Map(), paintStats = new Map()) {
  const byTeam = new Map();

  (drivers || []).forEach((driver) => {
    const team = driver.team || "Independent";
    if (!byTeam.has(team)) {
      byTeam.set(team, {
        team,
        drivers: 0,
        points: 0,
        wins: 0,
        top5: 0,
        missedNoNotice: 0,
        paintPoints: 0,
      });
    }

    const entry = byTeam.get(team);
    const number = cleanNumber(driver.number);
    const rs = raceStats.get(number) || {};
    const ps = paintStats.get(number) || {};

    entry.drivers += 1;
    entry.points += Number(driver.points || 0);
    entry.wins += Number(driver.wins || 0);
    entry.top5 += Number(driver.top5 || 0);
    entry.missedNoNotice += Number(rs.missedNoNotice || 0);
    entry.paintPoints += Number(ps.paintSchemePoints || 0);
  });

  return Array.from(byTeam.values()).map((team) => {
    const score = Math.max(40, Math.min(100,
      58 +
      Math.min(18, team.points / 55) +
      team.wins * 4 +
      team.top5 +
      Math.min(8, team.paintPoints / 8) -
      team.missedNoNotice * 4
    ));

    return {
      ...team,
      score: Math.round(score),
      grade: gradeFromScore(score),
    };
  }).sort((a, b) => b.score - a.score);
}

function Meter({ score }) {
  const color = score >= 85 ? "#22c55e" : score >= 65 ? "#d4af37" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ height: 12, background: "#07111f", border: "1px solid #263244", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, score))}%`, background: color }} />
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: "#0d131f", border: "1px solid #263244", borderRadius: 14, padding: 12 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 19, fontWeight: 1000 }}>{value}</div>
    </div>
  );
}

function TeamBoardRow({ team, index }) {
  return (
    <div style={{ background: index === 0 ? "linear-gradient(135deg, rgba(34,197,94,0.16), #0f1319)" : "#0f1319", border: index === 0 ? "1px solid rgba(34,197,94,0.55)" : "1px solid #263244", borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000 }}>
            {index === 0 ? "🥇 FRONT RUNNER" : `#${index + 1} ${team.incumbent ? "INCUMBENT" : "CHALLENGER"}`}
          </div>
          <div style={{ fontSize: 20, fontWeight: 1000 }}>{getTeamFullName(team.team)}</div>
          <div style={{ color: team.incumbent ? "#d4af37" : "#cbd5e1", fontSize: 13, fontWeight: 900 }}>{team.label}</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 1000 }}>{team.score}%</div>
      </div>
      <div style={{ marginTop: 10 }}><Meter score={team.score} /></div>
      {team.pitch && <p style={{ color: "#cbd5e1", lineHeight: 1.45, fontSize: 13, marginBottom: 0 }}>{team.pitch}</p>}
    </div>
  );
}

function DriverMarketCard({ driver, raceStats, paintStats, interestRows, reSignRows }) {
  const [open, setOpen] = useState(false);
  const rating = calculateDriverMarketRating(driver, raceStats, paintStats);
  const board = makeInterestBoard(driver, interestRows, reSignRows);
  const leader = board[0];

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid rgba(212,175,55,0.35)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(230px, 320px)", gap: 16 }}>
        <div>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000, letterSpacing: 1.4 }}>
            {isExpiringDriver(driver) ? "TRANSFER MARKET ELIGIBLE" : "SCOUTING PROFILE"}
          </div>
          <h2 style={{ margin: "7px 0 4px", fontSize: 34, lineHeight: 1 }}>
            #{driver.number} {driver.name}
          </h2>
          <div style={{ color: "#cbd5e1", fontWeight: 900 }}>
            {getTeamFullName(driver.team)} • {driver.manufacturer || "—"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginTop: 16 }}>
            <StatBox label="Overall" value={`${rating} ${starsFromRating(rating)}`} />
            <StatBox label="Points" value={driver.points || 0} />
            <StatBox label="Wins" value={driver.wins || 0} />
            <StatBox label="Top 5" value={driver.top5 || 0} />
            <StatBox label="Missed No Notice" value={raceStats?.missedNoNotice || 0} />
            <StatBox label="Paint Points" value={paintStats?.paintSchemePoints || 0} />
          </div>
        </div>

        <div style={{ background: "#0f1319", border: "1px solid #263244", borderRadius: 18, padding: 16 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Current Leader</div>
          <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 4 }}>{leader ? getTeamFullName(leader.team) : "No Interest"}</div>
          <div style={{ color: leader?.incumbent ? "#d4af37" : "#cbd5e1", fontSize: 13, fontWeight: 900, marginTop: 4 }}>
            {leader?.incumbent ? "Current Team Re-Sign Interest" : leader?.label || "—"}
          </div>
          <div style={{ marginTop: 12 }}><Meter score={leader?.score || 0} /></div>
          <button type="button" onClick={() => setOpen((value) => !value)} style={{ ...primaryButtonStyle, width: "100%", marginTop: 14 }}>
            {open ? "Hide Board" : "View Board"}
          </button>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 430px)", gap: 18 }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Top Teams</h3>
            <div style={{ display: "grid", gap: 12 }}>
              {board.map((team, index) => <TeamBoardRow key={`${driver.number}-${team.team}-${index}`} team={team} index={index} />)}
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Driver Value</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <StatBox label="Average Finish" value={raceStats?.averageFinish || "—"} />
              <StatBox label="Top 3" value={driver.top3 || 0} />
              <StatBox label="Stage Points" value={raceStats?.stagePoints || 0} />
              <StatBox label="Stage Wins" value={raceStats?.stageWins || 0} />
              <StatBox label="Races Entered" value={raceStats?.racesEntered || 0} />
              <StatBox label="Races Missed" value={raceStats?.racesMissed || 0} />
              <StatBox label="DNFs" value={raceStats?.dnfs || 0} />
              <StatBox label="Start & Parks" value={raceStats?.startParks || 0} />
              <StatBox label="Penalties" value={raceStats?.penalties || 0} />
              <StatBox label="Paint Wins" value={paintStats?.paintSchemeWins || 0} />
              <StatBox label="Sponsor Happy" value={happinessValue(driver, "sponsor")} />
              <StatBox label="Team Happy" value={happinessValue(driver, "team")} />
              <StatBox label="Driver Earned" value={money(paintStats?.driverPaintEarnings || driver.driverEarnings || 0)} />
              <StatBox label="Team Earned" value={money(paintStats?.teamPaintEarnings || driver.teamEarnings || 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RumorMill({ marketDrivers = [], interestRows = [], reSignRows = [], raceStats, paintStats }) {
  const rumors = marketDrivers.slice(0, 8).map((driver, index) => {
    const board = makeInterestBoard(driver, interestRows, reSignRows);
    const leader = board[0];
    const rating = calculateDriverMarketRating(driver, raceStats.get(cleanNumber(driver.number)), paintStats.get(cleanNumber(driver.number)));

    if (leader?.incumbent && leader.score >= 85) {
      return `Report: ${getTeamFullName(driver.team)} views #${driver.number} ${driver.name} as a major re-signing priority.`;
    }

    if (leader && !leader.incumbent && leader.score >= 80) {
      return `Rumor: ${getTeamFullName(leader.team)} has emerged as a serious threat to land #${driver.number} ${driver.name}.`;
    }

    if (rating >= 90) {
      return `League Sources: Multiple owners are expected to monitor #${driver.number} ${driver.name} if the market opens.`;
    }

    if (Number(raceStats.get(cleanNumber(driver.number))?.missedNoNotice || 0) > 0) {
      return `Market Watch: Reliability questions could impact #${driver.number} ${driver.name}'s value after missed races without notice.`;
    }

    return `Scouting Note: #${driver.number} ${driver.name} remains a driver to watch entering silly season.`;
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rumors.map((rumor, index) => (
        <div key={`${rumor}-${index}`} style={{ ...sectionCardStyle, background: index === 0 ? "linear-gradient(135deg, rgba(212,175,55,0.18), #111827)" : "#111827" }}>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000, letterSpacing: 1.2 }}>
            {index === 0 ? "BREAKING" : "RUMOR MILL"}
          </div>
          <div style={{ fontSize: 19, fontWeight: 900, marginTop: 6 }}>{rumor}</div>
        </div>
      ))}
    </div>
  );
}

function TeamGradesPanel({ teamGrades }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
      {teamGrades.map((team) => (
        <div key={team.team} style={sectionCardStyle}>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000 }}>TEAM PRESTIGE</div>
          <h3 style={{ margin: "6px 0", fontSize: 24 }}>{getTeamFullName(team.team)}</h3>
          <div style={{ fontSize: 42, fontWeight: 1000 }}>{team.grade}</div>
          <Meter score={team.score} />
          <div style={{ marginTop: 10, color: "#cbd5e1", fontSize: 13 }}>
            {team.wins} wins • {team.points} pts • {team.paintPoints} media pts
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DriverMarketPage({
  drivers = [],
  raceHistory = [],
  startParkRequests = [],
  paintSchemePayouts = [],
  interestRows = [],
  reSignRows = [],
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(true);

  const raceStats = useMemo(() => makeRaceStats(raceHistory, drivers, startParkRequests), [raceHistory, drivers, startParkRequests]);
  const paintStats = useMemo(() => makePaintStats(paintSchemePayouts, drivers), [paintSchemePayouts, drivers]);
  const teamGrades = useMemo(() => makeTeamGrades(drivers, raceStats, paintStats), [drivers, raceStats, paintStats]);

  const marketDrivers = useMemo(() => {
    return [...(drivers || [])]
      .filter((driver) => !driver.retired)
      .filter((driver) => showAll || isExpiringDriver(driver))
      .filter((driver) => {
        const q = filter.trim().toLowerCase();
        if (!q) return true;
        return (
          String(driver.name || "").toLowerCase().includes(q) ||
          String(driver.number || "").includes(q) ||
          String(driver.team || "").toLowerCase().includes(q) ||
          String(driver.manufacturer || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ar = calculateDriverMarketRating(a, raceStats.get(cleanNumber(a.number)), paintStats.get(cleanNumber(a.number)));
        const br = calculateDriverMarketRating(b, raceStats.get(cleanNumber(b.number)), paintStats.get(cleanNumber(b.number)));
        return br - ar;
      });
  }, [drivers, filter, showAll, raceStats, paintStats]);

  const topDrivers = marketDrivers.slice(0, 5);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(15,23,42,0.98))", border: "1px solid rgba(212,175,55,0.62)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 1000, letterSpacing: 1.5 }}>2026 SILLY SEASON</div>
              <h1 style={{ margin: "8px 0", fontSize: 46, lineHeight: 1 }}>Driver Market</h1>
              <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 850, lineHeight: 1.5 }}>
                Scouting, recruiting interest, current-team re-signing status, rumor mill, contract visibility, and signing-day preparation.
              </p>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back</button>
          </div>
        </div>

        <div style={{ ...sectionCardStyle, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {MARKET_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={activeTab === tab ? primaryButtonStyle : secondaryButtonStyle}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "center" }}>
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search driver, number, team, manufacturer..." style={inputStyle} />
            <button type="button" onClick={() => setShowAll((value) => !value)} style={secondaryButtonStyle}>
              {showAll ? "Expiring Only" : "Show All"}
            </button>
          </div>
        </div>

        {activeTab === "Overview" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0 }}>Top Market Drivers</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                {topDrivers.map((driver) => {
                  const number = cleanNumber(driver.number);
                  const rating = calculateDriverMarketRating(driver, raceStats.get(number), paintStats.get(number));
                  return (
                    <div key={`top-${driver.number}`} style={{ background: "#0f1319", border: "1px solid #263244", borderRadius: 16, padding: 14 }}>
                      <div style={{ color: "#d4af37", fontWeight: 1000 }}>{starsFromRating(rating)}</div>
                      <h3 style={{ margin: "5px 0" }}>#{driver.number} {driver.name}</h3>
                      <div style={{ color: "#cbd5e1", fontSize: 13 }}>{getTeamFullName(driver.team)} • {driver.manufacturer || "—"}</div>
                      <div style={{ marginTop: 10, fontSize: 26, fontWeight: 1000 }}>{rating} OVR</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <TeamGradesPanel teamGrades={teamGrades} />
          </div>
        )}

        {activeTab === "Scouting" && (
          <div style={{ display: "grid", gap: 16 }}>
            {marketDrivers.map((driver) => {
              const number = cleanNumber(driver.number);
              return (
                <DriverMarketCard
                  key={`${driver.id || driver.number}-${driver.name}`}
                  driver={driver}
                  raceStats={raceStats.get(number)}
                  paintStats={paintStats.get(number)}
                  interestRows={interestRows}
                  reSignRows={reSignRows}
                />
              );
            })}
          </div>
        )}

        {activeTab === "Recruiting" && (
          <div style={{ display: "grid", gap: 16 }}>
            {marketDrivers.map((driver) => {
              const number = cleanNumber(driver.number);
              return (
                <DriverMarketCard
                  key={`recruiting-${driver.id || driver.number}-${driver.name}`}
                  driver={driver}
                  raceStats={raceStats.get(number)}
                  paintStats={paintStats.get(number)}
                  interestRows={interestRows}
                  reSignRows={reSignRows}
                />
              );
            })}
          </div>
        )}

        {activeTab === "Rumor Mill" && (
          <RumorMill marketDrivers={marketDrivers} interestRows={interestRows} reSignRows={reSignRows} raceStats={raceStats} paintStats={paintStats} />
        )}

        {activeTab === "Contracts" && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Contract Rules</h2>
            <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
              Owners may register interest and pitch their team during the season. Official new contracts remain locked until the offseason.
              The current team may mark re-signing interest and may offer an extension before the market opens.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <StatBox label="Outside Teams" value="Interest Only" />
              <StatBox label="Current Team" value="Can Re-Sign" />
              <StatBox label="Signing Day" value="Locked" />
              <StatBox label="Public Interest" value="Configurable" />
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Driver Market History</h2>
            <p style={{ color: "#cbd5e1" }}>
              This area will track signings, previous teams, contract moves, re-signings, and signing day history once the first offseason market opens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
