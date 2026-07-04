import React, { useMemo, useState } from "react";
import { getTeamFullName } from "../data/teams";
import { money } from "../utils/formatters";
import { getLeagueSession } from "../lib/leagueAuth";

const appleFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const appShellStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(245,245,247,0.94) 36%, rgba(229,229,234,0.98) 100%)",
  color: "#1d1d1f",
  fontFamily: appleFont,
};
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 20 };
const sectionCardStyle = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60))",
  border: "1px solid rgba(255,255,255,0.78)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 20,
  boxShadow: "0 20px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};
const primaryButtonStyle = {
  background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "11px 18px",
  fontWeight: 900,
  fontFamily: appleFont,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,122,255,0.24)",
};
const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.72)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 999,
  padding: "11px 18px",
  fontWeight: 900,
  fontFamily: appleFont,
  cursor: "pointer",
};
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.72)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: "11px 13px",
  boxSizing: "border-box",
  fontFamily: appleFont,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
};

// Score-driven "heat" ramp — matches the existing interest-level naming
// (Watching -> Top Target) with intensity that reads at a glance, the
// same idea as Apple Stocks' color-coded % change.
function heatColor(score) {
  if (score >= 90) return { text: "#c62d24", soft: "rgba(255,59,48,0.12)", ring: "rgba(255,59,48,0.30)" };
  if (score >= 75) return { text: "#c2410c", soft: "rgba(255,149,0,0.14)", ring: "rgba(255,149,0,0.32)" };
  if (score >= 55) return { text: "#9a5a00", soft: "rgba(255,214,10,0.16)", ring: "rgba(255,214,10,0.35)" };
  if (score >= 35) return { text: "#0057d9", soft: "rgba(0,122,255,0.10)", ring: "rgba(0,122,255,0.26)" };
  return { text: "#6e6e73", soft: "rgba(0,0,0,0.05)", ring: "rgba(0,0,0,0.10)" };
}

// Performance-rating ramp (green/gold/orange/red), same semantic tiers as
// before, mapped to Apple's system colors.
function ratingColor(score) {
  if (score >= 85) return "#147d35";
  if (score >= 65) return "#9a5a00";
  if (score >= 40) return "#c2410c";
  return "#c62d24";
}

const MARKET_TABS = ["Overview", "Transfer Portal", "Scouting", "Recruiting", "Rumor Mill", "Contracts", "History"];

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
  const color = ratingColor(score);
  return (
    <div style={{ height: 8, background: "rgba(0,0,0,0.06)", borderRadius: 999, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.max(0, Math.min(100, score))}%`, background: color, borderRadius: 999, transition: "width 0.3s" }} />
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 12 }}>
      <div style={{ color: "#6e6e73", fontSize: 10.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 950, color: "#1d1d1f" }}>{value}</div>
    </div>
  );
}

function TeamBoardRow({ team, index }) {
  const heat = heatColor(team.score);
  return (
    <div style={{ background: index === 0 ? "rgba(52,199,89,0.08)" : "rgba(0,0,0,0.03)", border: index === 0 ? "1px solid rgba(52,199,89,0.30)" : "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ color: index === 0 ? "#147d35" : "#6e6e73", fontSize: 11, fontWeight: 950, letterSpacing: "0.04em" }}>
            {index === 0 ? "🥇 FRONT RUNNER" : `#${index + 1} ${team.incumbent ? "INCUMBENT" : "CHALLENGER"}`}
          </div>
          <div style={{ fontSize: 18, fontWeight: 950, color: "#1d1d1f" }}>{getTeamFullName(team.team)}</div>
          <span style={{ display: "inline-block", marginTop: 4, background: heat.soft, color: heat.text, borderRadius: 999, padding: "3px 10px", fontSize: 11.5, fontWeight: 900 }}>{team.label}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 950, color: heat.text }}>{team.score}%</div>
      </div>
      <div style={{ marginTop: 10 }}><Meter score={team.score} /></div>
      {team.pitch && <p style={{ color: "#3a3a3c", lineHeight: 1.5, fontSize: 13, fontWeight: 600, marginBottom: 0, marginTop: 8 }}>{team.pitch}</p>}
    </div>
  );
}

function DriverMarketCard({ driver, raceStats, paintStats, interestRows, reSignRows, mode = "scouting", session = null, onExpressInterest }) {
  const [open, setOpen] = useState(false);
  const rating = calculateDriverMarketRating(driver, raceStats, paintStats);
  const board = makeInterestBoard(driver, interestRows, reSignRows);
  const leader = board[0];
  const heat = heatColor(leader?.score || 0);
  const ratingClr = ratingColor(rating);
  const expiring = isExpiringDriver(driver);

  const myTeam = session?.isOwner ? (session.ownedTeams || [])[0] : null;
  const alreadyAdded = myTeam ? board.some((row) => !row.incumbent && row.team === myTeam) : false;
  const actionLabel = mode === "recruiting" ? "Show Interest" : "Add to Recruiting Board";

  return (
    <div style={{ ...sectionCardStyle, padding: 0, overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 18,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontFamily: appleFont,
        }}
      >
        <div style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: `${ratingClr}18`,
          color: ratingClr,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 950,
          fontSize: 16,
          flexShrink: 0,
        }}>
          {rating}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 17, fontWeight: 950, color: "#1d1d1f" }}>#{driver.number} {driver.name}</span>
            {expiring && <span style={{ background: "rgba(255,149,0,0.14)", color: "#9a5a00", borderRadius: 999, padding: "2px 9px", fontSize: 10.5, fontWeight: 900 }}>EXPIRING</span>}
          </div>
          <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>
            {getTeamFullName(driver.team)} • {driver.manufacturer || "—"}
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <span style={{ display: "inline-block", background: heat.soft, color: heat.text, borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 900 }}>
            {leader?.label || "No Interest"}
          </span>
          <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 700, marginTop: 4 }}>{leader ? (leader.incumbent ? "Current team" : getTeamFullName(leader.team)) : "—"}</div>
        </div>

        <div style={{ color: "#c7c7cc", fontSize: 20, fontWeight: 900, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>›</div>
      </button>

      {open && (
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => onExpressInterest?.(driver)}
              disabled={alreadyAdded}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "11px 18px",
                background: alreadyAdded ? "rgba(0,0,0,0.06)" : "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
                color: alreadyAdded ? "#6e6e73" : "#ffffff",
                fontWeight: 900,
                fontFamily: appleFont,
                cursor: alreadyAdded ? "default" : "pointer",
                boxShadow: alreadyAdded ? "none" : "0 12px 28px rgba(0,122,255,0.24)",
              }}
            >
              {alreadyAdded ? "✓ Already on Your Board" : `+ ${actionLabel}`}
            </button>
            {!session?.isOwner && (
              <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 700, marginTop: 8 }}>Sign in as a team owner to {mode === "recruiting" ? "show interest" : "add drivers to your recruiting board"}.</div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 18 }}>
            <StatBox label="Overall" value={`${rating} ${starsFromRating(rating)}`} />
            <StatBox label="Points" value={driver.points || 0} />
            <StatBox label="Wins" value={driver.wins || 0} />
            <StatBox label="Top 5" value={driver.top5 || 0} />
            <StatBox label="Missed No Notice" value={raceStats?.missedNoNotice || 0} />
            <StatBox label="Paint Points" value={paintStats?.paintSchemePoints || 0} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 400px)", gap: 18 }}>
            <div>
              <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 950 }}>Top Teams</h3>
              <div style={{ display: "grid", gap: 10 }}>
                {board.map((team, index) => <TeamBoardRow key={`${driver.number}-${team.team}-${index}`} team={team} index={index} />)}
              </div>
            </div>

            <div>
              <h3 style={{ marginTop: 0, fontSize: 15, fontWeight: 950 }}>Driver Value</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
    <div style={{ display: "grid", gap: 10 }}>
      {rumors.map((rumor, index) => (
        <div
          key={`${rumor}-${index}`}
          style={{
            ...sectionCardStyle,
            marginBottom: 0,
            padding: 16,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
            background: index === 0 ? "linear-gradient(135deg, rgba(255,59,48,0.06), rgba(255,255,255,0.85))" : sectionCardStyle.background,
            border: index === 0 ? "1px solid rgba(255,59,48,0.22)" : sectionCardStyle.border,
          }}
        >
          <span style={{
            flexShrink: 0,
            display: "inline-block",
            background: index === 0 ? "rgba(255,59,48,0.12)" : "rgba(0,122,255,0.10)",
            color: index === 0 ? "#c62d24" : "#0057d9",
            borderRadius: 999,
            padding: "5px 11px",
            fontSize: 10.5,
            fontWeight: 950,
            letterSpacing: "0.04em",
            marginTop: 2,
          }}>
            {index === 0 ? "BREAKING" : "RUMOR MILL"}
          </span>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1d1d1f", lineHeight: 1.4 }}>{rumor}</div>
        </div>
      ))}
    </div>
  );
}

const prestigeTierColors = {
  Elite: { bg: "#fff7ed", color: "#c2410c" },
  Prestigious: { bg: "#eff6ff", color: "#1d4ed8" },
  Good: { bg: "#f0fdf4", color: "#15803d" },
  Developing: { bg: "#f5f5f7", color: "#6b7280" },
};

const prestigeTierOrder = ["Elite", "Prestigious", "Good", "Developing"];

function TeamPrestigeTierLegend() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
      <span style={{ color: "#6e6e73", fontSize: 12, fontWeight: 800 }}>Tier ranking (best to developing):</span>
      {prestigeTierOrder.map((tierName, index) => {
        const tierStyle = prestigeTierColors[tierName];
        return (
          <React.Fragment key={tierName}>
            <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 950, letterSpacing: "0.04em", borderRadius: 999, padding: "4px 12px", background: tierStyle.bg, color: tierStyle.color }}>{tierName}</span>
            {index < prestigeTierOrder.length - 1 && <span style={{ color: "#c7c7cc", fontSize: 13, fontWeight: 900 }}>›</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TeamGradesPanel({ teamPrestigeRows = [] }) {
  const rows = [...(teamPrestigeRows || [])].sort((a, b) => Number(b.prestige || 0) - Number(a.prestige || 0));

  if (!rows.length) {
    return (
      <div style={sectionCardStyle}>
        <div style={{ color: "#6e6e73", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em" }}>TEAM PRESTIGE</div>
        <p style={{ color: "#6e6e73", fontSize: 13, fontWeight: 700, marginTop: 8, marginBottom: 0 }}>Prestige tiers haven't been calculated yet this season — check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      <TeamPrestigeTierLegend />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        {rows.map((team) => {
          const tierStyle = prestigeTierColors[team.tier] || prestigeTierColors.Developing;
          return (
            <div key={team.team} style={sectionCardStyle}>
              <div style={{ color: "#6e6e73", fontSize: 11, fontWeight: 900, letterSpacing: "0.04em" }}>TEAM PRESTIGE</div>
              <h3 style={{ margin: "6px 0", fontSize: 20, fontWeight: 950, color: "#1d1d1f" }}>{getTeamFullName(team.team)}</h3>
              <span style={{ display: "inline-block", fontSize: 11.5, fontWeight: 950, letterSpacing: "0.04em", borderRadius: 999, padding: "4px 12px", background: tierStyle.bg, color: tierStyle.color }}>{team.tier || "Developing"}</span>
              <div style={{ marginTop: 10 }}><Meter score={Number(team.prestige || 0)} /></div>
              <div style={{ marginTop: 10, color: "#6e6e73", fontSize: 12.5, fontWeight: 700 }}>
                {team.manufacturer || "Unknown"} • Score {team.prestige ?? 0}
              </div>
            </div>
          );
        })}
      </div>
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
  supabase = null,
}) {
  const [activeTab, setActiveTab] = useState("Overview");
  const [filter, setFilter] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [session] = useState(() => getLeagueSession());
  const [localInterestRows, setLocalInterestRows] = useState(interestRows);
  const [portalEntries, setPortalEntries] = useState([]);
  const [portalDeadline, setPortalDeadline] = useState(null);
  const [deadlineInput, setDeadlineInput] = useState("");
  const isAdmin = typeof window !== "undefined" && sessionStorage.getItem("bcl-admin-auth") === "true";

  React.useEffect(() => {
    if (!supabase) return;
    async function loadPortalData() {
      const { data: entries } = await supabase
        .from("driver_portal_entries")
        .select("*")
        .eq("status", "open")
        .order("entered_at", { ascending: false });
      setPortalEntries(entries || []);

      const { data: settings } = await supabase
        .from("transfer_portal_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (settings?.signing_deadline) {
        setPortalDeadline(settings.signing_deadline);
        setDeadlineInput(new Date(settings.signing_deadline).toISOString().slice(0, 16));
      }
    }
    loadPortalData();
    const interval = setInterval(loadPortalData, 30000);
    return () => clearInterval(interval);
  }, [supabase]);

  async function savePortalDeadline() {
    if (!supabase || !deadlineInput) return;
    const iso = new Date(deadlineInput).toISOString();
    const { error } = await supabase
      .from("transfer_portal_settings")
      .update({ signing_deadline: iso, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) {
      console.error("Could not save signing deadline:", error);
      alert("Failed to save the signing deadline.");
      return;
    }
    setPortalDeadline(iso);
  }

  async function handleExpressInterest(driver) {
    if (!session?.isOwner) {
      const redirect = typeof window !== "undefined" ? window.location.pathname : "/driver-market";
      window.location.href = `/standings?login=1&redirect=${encodeURIComponent(redirect)}`;
      return;
    }

    const myTeam = (session.ownedTeams || [])[0];
    if (!myTeam || !supabase) return;

    const newRow = {
      driver_number: String(driver.number),
      driver_name: driver.name,
      interested_team: myTeam,
      owner_name: session.driverName,
      interest_level: "interested",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("driver_recruiting_interest").insert(newRow);
    if (error) {
      console.error("Could not save recruiting interest:", error);
      alert("Failed to add driver to your recruiting board.");
      return;
    }

    setLocalInterestRows((current) => [...current, newRow]);
  }

  const raceStats = useMemo(() => makeRaceStats(raceHistory, drivers, startParkRequests), [raceHistory, drivers, startParkRequests]);
  const paintStats = useMemo(() => makePaintStats(paintSchemePayouts, drivers), [paintSchemePayouts, drivers]);
  const teamGrades = useMemo(() => makeTeamGrades(drivers, raceStats, paintStats), [drivers, raceStats, paintStats]);

  // Real, saved prestige tiers (Elite/Prestigious/Good/Developing) computed in
  // the admin portal — this is the authoritative source the "Team Prestige"
  // panel below should reflect, rather than the legacy ad-hoc teamGrades score.
  const [teamPrestigeRows, setTeamPrestigeRows] = useState([]);
  React.useEffect(() => {
    if (!supabase) return;
    async function loadTeamPrestige() {
      const { data, error } = await supabase.from("team_prestige").select("*");
      if (error) {
        console.error("Could not load team_prestige:", error);
        return;
      }
      setTeamPrestigeRows(data || []);
    }
    loadTeamPrestige();
  }, [supabase]);

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
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#9a5a00", fontSize: 12, fontWeight: 950, letterSpacing: "0.06em" }}>2026 SILLY SEASON</div>
              <h1 style={{ margin: "6px 0", fontSize: "clamp(30px, 4vw, 40px)", fontWeight: 950, letterSpacing: "-0.03em", color: "#1d1d1f" }}>Driver Market</h1>
              <p style={{ margin: 0, color: "#6e6e73", maxWidth: 850, lineHeight: 1.5, fontWeight: 600, fontSize: 14 }}>
                Scouting, recruiting interest, current-team re-signing status, rumor mill, contract visibility, and signing-day preparation.
              </p>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back</button>
          </div>
        </div>

        <div style={{ ...sectionCardStyle, padding: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
          {MARKET_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: "1 1 auto",
                border: 0,
                borderRadius: 18,
                padding: "10px 14px",
                fontWeight: 900,
                fontSize: 13,
                fontFamily: appleFont,
                cursor: "pointer",
                background: activeTab === tab ? "#ffffff" : "transparent",
                color: activeTab === tab ? "#1d1d1f" : "#6e6e73",
                boxShadow: activeTab === tab ? "0 8px 20px rgba(15,23,42,0.10)" : "none",
              }}
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
              <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 950 }}>Top Market Drivers</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
                {topDrivers.map((driver) => {
                  const number = cleanNumber(driver.number);
                  const rating = calculateDriverMarketRating(driver, raceStats.get(number), paintStats.get(number));
                  const clr = ratingColor(rating);
                  return (
                    <div key={`top-${driver.number}`} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 14 }}>
                      <div style={{ color: clr, fontWeight: 950, fontSize: 13 }}>{starsFromRating(rating)}</div>
                      <h3 style={{ margin: "6px 0 4px", fontSize: 17, fontWeight: 950, color: "#1d1d1f" }}>#{driver.number} {driver.name}</h3>
                      <div style={{ color: "#6e6e73", fontSize: 12.5, fontWeight: 700 }}>{getTeamFullName(driver.team)} • {driver.manufacturer || "—"}</div>
                      <div style={{ marginTop: 10, fontSize: 24, fontWeight: 950, color: clr }}>{rating} OVR</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <TeamGradesPanel teamPrestigeRows={teamPrestigeRows} />
          </div>
        )}

        {activeTab === "Transfer Portal" && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(255,255,255,0.85))" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 950, letterSpacing: "0.06em" }}>SIGNING DEADLINE</div>
                  <div style={{ fontSize: 22, fontWeight: 950, color: "#1d1d1f", marginTop: 4 }}>
                    {portalDeadline ? new Date(portalDeadline).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }) : "Not set yet"}
                  </div>
                  <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 4 }}>
                    Any driver still in the portal after this date automatically stays with their current team.
                  </div>
                </div>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input type="datetime-local" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} style={{ ...inputStyle, width: "auto" }} />
                    <button type="button" onClick={savePortalDeadline} style={primaryButtonStyle}>Save Deadline</button>
                  </div>
                )}
              </div>
            </div>

            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 950 }}>Coming Due</h2>
              <p style={{ marginTop: 0, color: "#6e6e73", fontSize: 13, fontWeight: 700 }}>Drivers whose contracts are expiring and eligible to enter the portal.</p>
              {marketDrivers.filter(isExpiringDriver).length === 0 ? (
                <div style={{ color: "#6e6e73", fontWeight: 700 }}>No drivers currently coming due.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                  {marketDrivers.filter(isExpiringDriver).map((driver) => (
                    <div key={`due-${driver.number}`} style={{ background: "rgba(255,149,0,0.08)", border: "1px solid rgba(255,149,0,0.25)", borderRadius: 16, padding: 12 }}>
                      <div style={{ fontWeight: 950, color: "#1d1d1f", fontSize: 15 }}>#{driver.number} {driver.name}</div>
                      <div style={{ fontSize: 12, color: "#9a5a00", fontWeight: 800, marginTop: 2 }}>{getTeamFullName(driver.team)} • Contract Expiring</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={sectionCardStyle}>
              <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 950 }}>In the Portal</h2>
              <p style={{ marginTop: 0, color: "#6e6e73", fontSize: 13, fontWeight: 700 }}>Drivers actively testing the market. Owners can add these drivers to their recruiting board, or sign them directly from Team HQ.</p>
              {portalEntries.length === 0 ? (
                <div style={{ color: "#6e6e73", fontWeight: 700 }}>No drivers are currently in the Transfer Portal.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {portalEntries.map((entry) => {
                    const interestCount = localInterestRows.filter((row) => String(row.driver_number) === String(entry.driver_number)).length;
                    const driverRecord = marketDrivers.find((d) => String(d.number) === String(entry.driver_number));
                    return (
                      <div key={entry.id} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                          <div>
                            <div style={{ fontSize: 17, fontWeight: 950, color: "#1d1d1f" }}>#{entry.driver_number} {entry.driver_name}</div>
                            <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>Currently: {getTeamFullName(entry.current_team)} • Entered {new Date(entry.entered_at).toLocaleDateString()}</div>
                          </div>
                          <span style={{ background: "rgba(0,122,255,0.10)", color: "#0057d9", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 900, height: "fit-content" }}>
                            {interestCount} team{interestCount === 1 ? "" : "s"} interested
                          </span>
                        </div>
                        {entry.wishlist && (
                          <div style={{ marginTop: 10, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 12, padding: 12, fontSize: 13, color: "#3a3a3c", fontWeight: 600, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                            {entry.wishlist}
                          </div>
                        )}
                        {driverRecord && (
                          <button
                            type="button"
                            onClick={() => handleExpressInterest(driverRecord)}
                            style={{ ...primaryButtonStyle, marginTop: 12 }}
                          >
                            + Add to Recruiting Board
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
                  interestRows={localInterestRows}
                  reSignRows={reSignRows}
                  mode="scouting"
                  session={session}
                  onExpressInterest={handleExpressInterest}
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
                  interestRows={localInterestRows}
                  reSignRows={reSignRows}
                  mode="recruiting"
                  session={session}
                  onExpressInterest={handleExpressInterest}
                />
              );
            })}
          </div>
        )}

        {activeTab === "Rumor Mill" && (
          <RumorMill marketDrivers={marketDrivers} interestRows={localInterestRows} reSignRows={reSignRows} raceStats={raceStats} paintStats={paintStats} />
        )}

        {activeTab === "Contracts" && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 950 }}>Contract Rules</h2>
            <p style={{ color: "#3a3a3c", lineHeight: 1.6, fontWeight: 600, fontSize: 14 }}>
              Owners may register interest and pitch their team during the season. Official new contracts remain locked until the offseason.
              The current team may mark re-signing interest and may offer an extension before the market opens.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <StatBox label="Outside Teams" value="Interest Only" />
              <StatBox label="Current Team" value="Can Re-Sign" />
              <StatBox label="Signing Day" value="Locked" />
              <StatBox label="Public Interest" value="Configurable" />
            </div>
          </div>
        )}

        {activeTab === "History" && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, fontSize: 18, fontWeight: 950 }}>Driver Market History</h2>
            <p style={{ color: "#3a3a3c", lineHeight: 1.6, fontWeight: 600, fontSize: 14 }}>
              This area will track signings, previous teams, contract moves, re-signings, and signing day history once the first offseason market opens.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
