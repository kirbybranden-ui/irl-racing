import React, { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
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

const INTEREST_LEVELS = [
  { key: "watching", label: "Watching", score: 25 },
  { key: "interested", label: "Interested", score: 45 },
  { key: "warm", label: "Warm", score: 65 },
  { key: "hot", label: "Hot", score: 82 },
  { key: "top_target", label: "Top Target", score: 96 },
];

const CURRENT_TEAM_RE_SIGN_STATUS = [
  { key: "high_priority", label: "High Priority", score: 100 },
  { key: "would_like_back", label: "Would Like to Re-Sign", score: 85 },
  { key: "open_to_negotiations", label: "Open to Negotiations", score: 68 },
  { key: "undecided", label: "Undecided", score: 45 },
  { key: "not_expected_back", label: "Not Expected Back", score: 18 },
  { key: "moving_on", label: "Moving On", score: 0 },
];

function cleanNumber(value) {
  return String(value ?? "").replace("#", "").trim();
}

function getInterestScore(level) {
  return INTEREST_LEVELS.find((item) => item.key === level)?.score || 0;
}

function getReSignScore(status) {
  return CURRENT_TEAM_RE_SIGN_STATUS.find((item) => item.key === status)?.score || 0;
}

function getInterestLabel(level) {
  return INTEREST_LEVELS.find((item) => item.key === level)?.label || "Watching";
}

function getReSignLabel(status) {
  return CURRENT_TEAM_RE_SIGN_STATUS.find((item) => item.key === status)?.label || "Undecided";
}

function isExpiringDriver(driver) {
  const values = [
    driver.contractStatus,
    driver.contract_status,
    driver.contract?.status,
    driver.contract?.expiresAfterSeason,
    driver.contract?.seasonEnd,
    driver.contract?.expires_after_season,
    driver.expiresAfterSeason,
    driver.expires_after_season,
  ];

  return values.some((value) => {
    const text = String(value ?? "").toLowerCase();
    return value === true || text.includes("expir") || text.includes("end") || text.includes("2026");
  });
}

function makeRaceStatMap(raceHistory = [], drivers = [], startParkRequests = []) {
  const statMap = new Map();

  (drivers || []).forEach((driver) => {
    statMap.set(cleanNumber(driver.number), {
      racesEntered: 0,
      racesMissed: 0,
      missedNoNotice: 0,
      dnfs: 0,
      startParks: 0,
      penalties: 0,
      stagePoints: 0,
      stageWins: 0,
      averageFinish: null,
      finishTotal: 0,
      finishCount: 0,
    });
  });

  (raceHistory || []).forEach((race) => {
    const results = race.results || [];
    const resultNumbers = new Set(results.map((result) => cleanNumber(result.number || result.driverNumber || result.car_number)));

    (drivers || []).forEach((driver) => {
      const number = cleanNumber(driver.number);
      const stats = statMap.get(number);
      if (!stats) return;

      const result = results.find((item) => cleanNumber(item.number || item.driverNumber || item.car_number) === number);
      const approvedStartPark = (startParkRequests || []).some((request) => {
        const requestNumber = cleanNumber(request.driver_number || request.driverNumber || request.number);
        const requestRace = String(request.race_name || request.raceName || request.track || "").toLowerCase();
        const raceName = String(race.raceName || race.name || "").toLowerCase();
        const approved = String(request.status || "").toLowerCase() === "approved" || request.approved === true;
        return requestNumber === number && approved && (!requestRace || raceName.includes(requestRace) || requestRace.includes(raceName));
      });

      if (result) {
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
      } else if (!approvedStartPark && resultNumbers.size > 0) {
        stats.racesMissed += 1;
        stats.missedNoNotice += 1;
      }
    });
  });

  statMap.forEach((stats) => {
    stats.averageFinish = stats.finishCount ? (stats.finishTotal / stats.finishCount).toFixed(1) : "—";
  });

  return statMap;
}

function makePaintSchemeStatMap(paintSchemePayouts = [], drivers = []) {
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

function calculatePortalRating(driver, raceStats, paintStats) {
  const points = Number(driver.points || 0);
  const wins = Number(driver.wins || 0);
  const top5 = Number(driver.top5 || 0);
  const missedNoNotice = Number(raceStats?.missedNoNotice || 0);
  const dnfs = Number(raceStats?.dnfs || 0);
  const paintPoints = Number(paintStats?.paintSchemePoints || 0);

  let rating = 60;
  rating += Math.min(18, points / 20);
  rating += wins * 4;
  rating += top5 * 1.5;
  rating += Math.min(8, paintPoints / 5);
  rating -= missedNoNotice * 8;
  rating -= dnfs * 3;

  return Math.max(40, Math.min(99, Math.round(rating)));
}

function getStars(rating) {
  if (rating >= 92) return "★★★★★";
  if (rating >= 84) return "★★★★☆";
  if (rating >= 75) return "★★★☆☆";
  if (rating >= 65) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function getHappiness(driver, type) {
  const keys = type === "sponsor"
    ? ["sponsorHappiness", "sponsor_happiness", "manufacturerSatisfaction", "manufacturer_satisfaction"]
    : ["teamHappiness", "team_happiness", "morale", "teamMorale"];

  for (const key of keys) {
    if (driver[key] !== undefined && driver[key] !== null && driver[key] !== "") return driver[key];
  }

  return "Not Rated";
}

function getFrontRunners(driver, interestRows = [], reSignRows = []) {
  const driverNumber = cleanNumber(driver.number);

  const rows = (interestRows || [])
    .filter((row) => cleanNumber(row.driver_number || row.driverNumber || row.number) === driverNumber)
    .map((row) => ({
      team: row.interested_team || row.team || row.owner_team || "Unknown",
      label: getInterestLabel(row.interest_level || row.level || "watching"),
      score: getInterestScore(row.interest_level || row.level || "watching"),
      pitch: row.pitch || row.message || "",
      owner: row.owner_name || row.interested_owner || "",
      incumbent: false,
    }));

  const currentTeamStatus = (reSignRows || []).find((row) => {
    const rowNumber = cleanNumber(row.driver_number || row.driverNumber || row.number);
    return rowNumber === driverNumber;
  });

  rows.push({
    team: driver.team || "Independent",
    label: getReSignLabel(currentTeamStatus?.status || driver.reSignStatus || "undecided"),
    score: getReSignScore(currentTeamStatus?.status || driver.reSignStatus || "undecided"),
    pitch: currentTeamStatus?.message || "Current team has not issued a public re-signing statement.",
    owner: currentTeamStatus?.owner_name || "",
    incumbent: true,
  });

  return rows.sort((a, b) => b.score - a.score).slice(0, 5);
}

function InterestBar({ score }) {
  return (
    <div style={{ width: "100%", height: 12, background: "#0b1220", border: "1px solid #263244", borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(100, score))}%`,
          height: "100%",
          background: score >= 85 ? "#22c55e" : score >= 65 ? "#d4af37" : score >= 40 ? "#f59e0b" : "#ef4444",
        }}
      />
    </div>
  );
}

function DriverStatPill({ label, value }) {
  return (
    <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 10 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 1000, fontSize: 18, marginTop: 3 }}>{value}</div>
    </div>
  );
}

function PortalDriverCard({ driver, raceStats, paintStats, interestRows, reSignRows }) {
  const [expanded, setExpanded] = useState(false);
  const rating = calculatePortalRating(driver, raceStats, paintStats);
  const frontRunners = getFrontRunners(driver, interestRows, reSignRows);
  const leader = frontRunners[0];

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid rgba(212,175,55,0.28)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 240px", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000, letterSpacing: 1.2 }}>
            TRANSFER PORTAL ELIGIBLE
          </div>
          <h2 style={{ margin: "6px 0 4px", fontSize: 30 }}>
            #{driver.number} {driver.name}
          </h2>
          <div style={{ color: "#cbd5e1", fontWeight: 800 }}>
            {getTeamFullName(driver.team)} • {driver.manufacturer || "—"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 14 }}>
            <DriverStatPill label="Portal Rating" value={`${rating} ${getStars(rating)}`} />
            <DriverStatPill label="Points" value={driver.points || 0} />
            <DriverStatPill label="Wins" value={driver.wins || 0} />
            <DriverStatPill label="Top 5" value={driver.top5 || 0} />
            <DriverStatPill label="Missed No Notice" value={raceStats?.missedNoNotice || 0} />
            <DriverStatPill label="Paint Points" value={paintStats?.paintSchemePoints || 0} />
          </div>
        </div>

        <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, padding: 14 }}>
          <div style={{ color: "#94a3b8", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Front Runner</div>
          <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 4 }}>
            {leader ? getTeamFullName(leader.team) : "No Interest"}
          </div>
          <div style={{ color: leader?.incumbent ? "#d4af37" : "#cbd5e1", fontWeight: 900, fontSize: 13, marginTop: 4 }}>
            {leader?.incumbent ? "Current Team Re-Sign Interest" : leader?.label || "—"}
          </div>
          <div style={{ marginTop: 10 }}>
            <InterestBar score={leader?.score || 0} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button type="button" onClick={() => setExpanded((value) => !value)} style={secondaryButtonStyle}>
          {expanded ? "Hide Full Board" : "View Recruiting Board"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 420px)", gap: 16 }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Top Teams</h3>
            <div style={{ display: "grid", gap: 10 }}>
              {frontRunners.map((team, index) => (
                <div key={`${driver.number}-${team.team}-${index}`} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000 }}>
                        #{index + 1} {team.incumbent ? "INCUMBENT" : "CHALLENGER"}
                      </div>
                      <div style={{ fontWeight: 1000, fontSize: 18 }}>{getTeamFullName(team.team)}</div>
                      <div style={{ color: "#94a3b8", fontSize: 13 }}>{team.label}</div>
                    </div>
                    <strong>{team.score}%</strong>
                  </div>
                  <div style={{ marginTop: 9 }}><InterestBar score={team.score} /></div>
                  {team.pitch && <p style={{ color: "#cbd5e1", fontSize: 13, lineHeight: 1.45 }}>{team.pitch}</p>}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Full Driver Value</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <DriverStatPill label="Avg Finish" value={raceStats?.averageFinish || "—"} />
              <DriverStatPill label="Top 3" value={driver.top3 || 0} />
              <DriverStatPill label="Stage Points" value={raceStats?.stagePoints || 0} />
              <DriverStatPill label="Stage Wins" value={raceStats?.stageWins || 0} />
              <DriverStatPill label="Races Entered" value={raceStats?.racesEntered || 0} />
              <DriverStatPill label="Races Missed" value={raceStats?.racesMissed || 0} />
              <DriverStatPill label="DNFs" value={raceStats?.dnfs || 0} />
              <DriverStatPill label="Start & Parks" value={raceStats?.startParks || 0} />
              <DriverStatPill label="Penalties" value={raceStats?.penalties || 0} />
              <DriverStatPill label="Paint Wins" value={paintStats?.paintSchemeWins || 0} />
              <DriverStatPill label="Sponsor Happy" value={getHappiness(driver, "sponsor")} />
              <DriverStatPill label="Team Happy" value={getHappiness(driver, "team")} />
              <DriverStatPill label="Driver Earnings" value={money(paintStats?.driverPaintEarnings || driver.driverEarnings || 0)} />
              <DriverStatPill label="Team Earnings" value={money(paintStats?.teamPaintEarnings || driver.teamEarnings || 0)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransferPortalPage({
  drivers = [],
  raceHistory = [],
  startParkRequests = [],
  paintSchemePayouts = [],
  interestRows = [],
  reSignRows = [],
}) {
  const [filter, setFilter] = useState("");
  const [showAllDrivers, setShowAllDrivers] = useState(false);

  const raceStats = useMemo(() => makeRaceStatMap(raceHistory, drivers, startParkRequests), [raceHistory, drivers, startParkRequests]);
  const paintStats = useMemo(() => makePaintSchemeStatMap(paintSchemePayouts, drivers), [paintSchemePayouts, drivers]);

  const eligibleDrivers = useMemo(() => {
    return [...(drivers || [])]
      .filter((driver) => !driver.retired)
      .filter((driver) => showAllDrivers || isExpiringDriver(driver))
      .filter((driver) => {
        const search = filter.trim().toLowerCase();
        if (!search) return true;
        return (
          String(driver.name || "").toLowerCase().includes(search) ||
          String(driver.number || "").includes(search) ||
          String(driver.team || "").toLowerCase().includes(search) ||
          String(driver.manufacturer || "").toLowerCase().includes(search)
        );
      })
      .sort((a, b) => {
        const aRating = calculatePortalRating(a, raceStats.get(cleanNumber(a.number)), paintStats.get(cleanNumber(a.number)));
        const bRating = calculatePortalRating(b, raceStats.get(cleanNumber(b.number)), paintStats.get(cleanNumber(b.number)));
        return bRating - aRating;
      });
  }, [drivers, filter, showAllDrivers, raceStats, paintStats]);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div
          style={{
            ...sectionCardStyle,
            background: "linear-gradient(135deg, rgba(212,175,55,0.20), rgba(15,23,42,0.98))",
            border: "1px solid rgba(212,175,55,0.58)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 1000, letterSpacing: 1.4 }}>
                SILLY SEASON
              </div>
              <h1 style={{ margin: "8px 0", fontSize: 42, lineHeight: 1 }}>
                Transfer Portal Interest Board
              </h1>
              <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 780, lineHeight: 1.5 }}>
                Owners can pitch their teams and register interest. Official contracts stay locked until the end of the season, except the current team may offer an extension.
              </p>
            </div>

            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>
              Back to Standings
            </button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "center" }}>
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Search driver, number, team, manufacturer..."
              style={inputStyle}
            />

            <button type="button" onClick={() => setShowAllDrivers((value) => !value)} style={primaryButtonStyle}>
              {showAllDrivers ? "Show Expiring Only" : "Preview All Drivers"}
            </button>
          </div>

          <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
            Showing <strong style={{ color: "white" }}>{eligibleDrivers.length}</strong> driver{eligibleDrivers.length === 1 ? "" : "s"}.
            Drivers appear by default only when their contract is marked expiring/end-of-season.
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {eligibleDrivers.length === 0 ? (
            <div style={sectionCardStyle}>
              No expiring drivers found yet. Mark contracts as expiring, or use “Preview All Drivers.”
            </div>
          ) : (
            eligibleDrivers.map((driver) => {
              const number = cleanNumber(driver.number);
              return (
                <PortalDriverCard
                  key={`${driver.id || driver.number}-${driver.name}`}
                  driver={driver}
                  raceStats={raceStats.get(number)}
                  paintStats={paintStats.get(number)}
                  interestRows={interestRows}
                  reSignRows={reSignRows}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
