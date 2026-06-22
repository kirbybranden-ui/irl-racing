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

function getLevelLabel(level, fallback = "Watching") {
  return INTEREST_LEVELS.find((item) => item.key === level)?.label || fallback;
}

function getLevelScore(level) {
  return INTEREST_LEVELS.find((item) => item.key === level)?.score || 0;
}

function getReSignLabel(level) {
  return RE_SIGN_LEVELS.find((item) => item.key === level)?.label || "Undecided";
}

function getReSignScore(level) {
  return RE_SIGN_LEVELS.find((item) => item.key === level)?.score || 45;
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

function starsFromRating(rating) {
  if (rating >= 92) return "★★★★★";
  if (rating >= 84) return "★★★★☆";
  if (rating >= 75) return "★★★☆☆";
  if (rating >= 65) return "★★☆☆☆";
  return "★☆☆☆☆";
}

function raceResultMap(raceHistory = [], drivers = [], startParkRequests = []) {
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

function paintStatMap(paintSchemePayouts = [], drivers = []) {
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

function happinessValue(driver, type) {
  const keys = type === "sponsor"
    ? ["sponsorHappiness", "sponsor_happiness", "manufacturerSatisfaction", "manufacturer_satisfaction"]
    : ["teamHappiness", "team_happiness", "morale", "teamMorale"];

  for (const key of keys) {
    if (driver[key] !== undefined && driver[key] !== null && driver[key] !== "") return driver[key];
  }

  return "Not Rated";
}

function calculateRating(driver, raceStats, paintStats) {
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
      label: getLevelLabel(row.interest_level || row.level || "watching"),
      score: getLevelScore(row.interest_level || row.level || "watching"),
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

function DriverPortalCard({ driver, raceStats, paintStats, interestRows, reSignRows }) {
  const [open, setOpen] = useState(false);
  const rating = calculateRating(driver, raceStats, paintStats);
  const board = makeInterestBoard(driver, interestRows, reSignRows);
  const leader = board[0];

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid rgba(212,175,55,0.35)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(230px, 320px)", gap: 16 }}>
        <div>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000, letterSpacing: 1.4 }}>TRANSFER PORTAL ELIGIBLE</div>
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

export default function TransferPortalPage({
  drivers = [],
  raceHistory = [],
  startParkRequests = [],
  paintSchemePayouts = [],
  interestRows = [],
  reSignRows = [],
}) {
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(false);

  const raceStats = useMemo(() => raceResultMap(raceHistory, drivers, startParkRequests), [raceHistory, drivers, startParkRequests]);
  const paintStats = useMemo(() => paintStatMap(paintSchemePayouts, drivers), [paintSchemePayouts, drivers]);

  const portalDrivers = useMemo(() => {
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
        const ar = calculateRating(a, raceStats.get(cleanNumber(a.number)), paintStats.get(cleanNumber(a.number)));
        const br = calculateRating(b, raceStats.get(cleanNumber(b.number)), paintStats.get(cleanNumber(b.number)));
        return br - ar;
      });
  }, [drivers, filter, showAll, raceStats, paintStats]);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(15,23,42,0.98))", border: "1px solid rgba(212,175,55,0.62)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 1000, letterSpacing: 1.5 }}>SILLY SEASON</div>
              <h1 style={{ margin: "8px 0", fontSize: 44, lineHeight: 1 }}>Transfer Portal</h1>
              <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 780, lineHeight: 1.5 }}>
                NCAA-style interest board. Owners can recruit and pitch, but official contracts stay locked until the offseason.
                Current teams can mark re-signing interest.
              </p>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back</button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "center" }}>
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search driver, number, team, manufacturer..." style={inputStyle} />
            <button type="button" onClick={() => setShowAll((value) => !value)} style={primaryButtonStyle}>
              {showAll ? "Show Expiring Only" : "Preview All Drivers"}
            </button>
          </div>
          <div style={{ marginTop: 12, color: "#94a3b8", fontSize: 13 }}>
            Showing <strong style={{ color: "white" }}>{portalDrivers.length}</strong> drivers.
          </div>
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {portalDrivers.length === 0 ? (
            <div style={sectionCardStyle}>No expiring drivers found yet. Mark contracts as expiring, or use Preview All Drivers.</div>
          ) : (
            portalDrivers.map((driver) => {
              const number = cleanNumber(driver.number);
              return (
                <DriverPortalCard
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
