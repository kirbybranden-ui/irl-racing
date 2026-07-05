import React, { useMemo } from "react";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  GOLD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  HAIRLINE,
  RED,
} from "../styles/sharedStyles";
import { getTeamFullName } from "../data/teams";

const TOURNAMENT_RACES = [
  { round: "Play-In", race: "Las Vegas", matchups: ["13-20", "14-19", "15-18", "16-17"] },
  { round: "Round of 16", race: "Talladega" },
  { round: "Quarterfinals", race: "North Wilkesboro" },
  { round: "Semifinals", race: "Indianapolis" },
  { round: "Championship", race: "New Hampshire" },
];

function cleanNumber(value) {
  return String(value ?? "").replace("#", "").trim();
}

function getRaceResultMap(raceHistory = [], raceName = "") {
  const race = (raceHistory || []).find((item) =>
    String(item.raceName || item.name || "").toLowerCase().includes(String(raceName).toLowerCase())
  );

  const map = new Map();

  (race?.results || []).forEach((result) => {
    const key = cleanNumber(result.number || result.driverNumber || result.car_number);
    map.set(key, {
      finish: Number(result.finishPos || result.finish || result.position || 999),
      result,
    });
  });

  return map;
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getResultDriverName(result = {}) {
  return (
    result.driverName ||
    result.driver_name ||
    result.name ||
    result.driver ||
    result.assigned_driver_name ||
    result.substitute_driver_name ||
    result.subDriverName ||
    ""
  );
}

function hasSubstituteFlag(result = {}) {
  const text = [
    result.assignment_type,
    result.assignmentType,
    result.driver_type,
    result.driverType,
    result.status,
    result.role,
    result.source,
    result.note,
    result.notes,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  return (
    result.is_substitute === true ||
    result.isSubstitute === true ||
    result.substitute === true ||
    result.used_substitute === true ||
    result.usedSubstitute === true ||
    text.includes("substitute") ||
    text.includes("sub-only") ||
    text.includes("sub only") ||
    text.includes("sub driver")
  );
}

function isSubstituteResultForSeed(result = {}, seededDriver = {}) {
  if (!result || !seededDriver) return false;

  const seededNumber = cleanNumber(seededDriver.number);
  const originalNumber = cleanNumber(result.original_driver_number || result.originalDriverNumber || result.original_car_number || result.originalCarNumber);
  const assignedNumber = cleanNumber(result.assigned_driver_number || result.assignedDriverNumber || result.substitute_driver_number || result.subDriverNumber);
  const resultNumber = cleanNumber(result.number || result.driverNumber || result.car_number);

  const seededName = normalizeName(seededDriver.name);
  const resultName = normalizeName(getResultDriverName(result));
  const originalName = normalizeName(result.original_driver_name || result.originalDriverName);
  const assignedName = normalizeName(result.assigned_driver_name || result.assignedDriverName || result.substitute_driver_name || result.subDriverName);

  const explicitSub = hasSubstituteFlag(result);
  const originalCarMatchesSeed = originalNumber && originalNumber === seededNumber;
  const sameCarAsSeed = resultNumber && resultNumber === seededNumber;
  const assignedDriverIsDifferent =
    (assignedNumber && assignedNumber !== seededNumber) ||
    (assignedName && seededName && assignedName !== seededName);

  const resultNameIsDifferent = resultName && seededName && resultName !== seededName;
  const originalNameMatchesSeed = originalName && seededName && originalName === seededName;

  return Boolean(
    explicitSub ||
    (originalCarMatchesSeed && assignedDriverIsDifferent) ||
    (sameCarAsSeed && originalNameMatchesSeed && resultNameIsDifferent) ||
    (sameCarAsSeed && originalCarMatchesSeed && resultNameIsDifferent)
  );
}

function getEligibleRaceEntry(driver, resultMap) {
  if (!driver) return null;
  const entry = resultMap.get(cleanNumber(driver.number));
  if (!entry) return null;

  if (isSubstituteResultForSeed(entry.result, driver)) {
    return {
      ...entry,
      ineligible: true,
      reason: "Substitute start/win does not count for the In-Season Tournament.",
    };
  }

  return {
    ...entry,
    ineligible: false,
    reason: "",
  };
}

function decideMatchup(driverA, driverB, resultMap) {
  const aEntry = getEligibleRaceEntry(driverA, resultMap);
  const bEntry = getEligibleRaceEntry(driverB, resultMap);
  const aEligible = aEntry && !aEntry.ineligible;
  const bEligible = bEntry && !bEntry.ineligible;

  let winner = null;
  if (aEligible && bEligible) {
    winner = aEntry.finish <= bEntry.finish ? driverA : driverB;
  } else if (aEligible) {
    winner = driverA;
  } else if (bEligible) {
    winner = driverB;
  }

  return {
    a: driverA,
    b: driverB,
    winner,
    aEntry,
    bEntry,
  };
}

function makeSeeds(drivers = []) {
  return [...(drivers || [])]
    .filter((driver) => !driver.retired)
    .sort((a, b) =>
      Number(b.points || 0) - Number(a.points || 0) ||
      Number(b.wins || 0) - Number(a.wins || 0) ||
      Number(b.top5 || 0) - Number(a.top5 || 0) ||
      String(a.name || "").localeCompare(String(b.name || ""))
    )
    .slice(0, 20)
    .map((driver, index) => ({
      ...driver,
      seed: index + 1,
    }));
}

function driverLabel(driver) {
  if (!driver) return "TBD";
  return `#${driver.number} ${driver.name}`;
}


function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, rows = []) {
  if (!rows.length) return;
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function makeBracketExportRows(rounds = [], champion = null) {
  const rows = [[
    "Round",
    "Matchup",
    "Driver A Seed",
    "Driver A Number",
    "Driver A Name",
    "Driver A Team",
    "Driver A Finish",
    "Driver A Status",
    "Driver B Seed",
    "Driver B Number",
    "Driver B Name",
    "Driver B Team",
    "Driver B Finish",
    "Driver B Status",
    "Winner Seed",
    "Winner Number",
    "Winner Name",
    "Winner Team",
  ]];

  rounds.forEach((round) => {
    (round.matchups || []).forEach((matchup, index) => {
      rows.push([
        round.title,
        `Matchup ${index + 1}`,
        matchup.a?.seed || "",
        matchup.a?.number || "",
        matchup.a?.name || "TBD",
        matchup.a ? getTeamFullName(matchup.a.team) : "",
        matchup.aEntry?.finish || "",
        matchup.aEntry?.ineligible ? matchup.aEntry.reason : (matchup.aEntry ? "Eligible" : "No result"),
        matchup.b?.seed || "",
        matchup.b?.number || "",
        matchup.b?.name || "TBD",
        matchup.b ? getTeamFullName(matchup.b.team) : "",
        matchup.bEntry?.finish || "",
        matchup.bEntry?.ineligible ? matchup.bEntry.reason : (matchup.bEntry ? "Eligible" : "No result"),
        matchup.winner?.seed || "",
        matchup.winner?.number || "",
        matchup.winner?.name || "TBD",
        matchup.winner ? getTeamFullName(matchup.winner.team) : "",
      ]);
    });
  });

  rows.push([]);
  rows.push(["Champion", "", champion?.seed || "", champion?.number || "", champion?.name || "TBD", champion ? getTeamFullName(champion.team) : ""]);
  return rows;
}

function DriverCard({ driver, status = "", entry = null }) {
  const resultLabel = entry
    ? entry.ineligible
      ? entry.reason
      : `P${entry.finish}`
    : "";

  const isDecided = status === "ADVANCES" || status === "ELIMINATED";
  const isWinner = status === "ADVANCES";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 0",
        opacity: isDecided && !isWinner ? 0.45 : 1,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
          {driver ? `SEED #${driver.seed}` : "TBD"}
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: isWinner ? 700 : 600,
            color: TEXT_PRIMARY,
            letterSpacing: -0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {driverLabel(driver)}
          {isWinner && <span style={{ color: GOLD, fontSize: 10 }}>●</span>}
        </div>
        <div
          style={{
            color: TEXT_SECONDARY,
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {driver ? getTeamFullName(driver.team) : "Awaiting result"}
        </div>
      </div>

      {resultLabel && (
        <div style={{ fontSize: 12, fontWeight: 600, color: entry?.ineligible ? RED : TEXT_SECONDARY, flexShrink: 0 }}>
          {resultLabel}
        </div>
      )}
    </div>
  );
}

function MatchupCard({ driverA, driverB, winner, entryA, entryB }) {
  const aStatus = winner ? (cleanNumber(winner.number) === cleanNumber(driverA?.number) ? "ADVANCES" : "ELIMINATED") : "";
  const bStatus = winner ? (cleanNumber(winner.number) === cleanNumber(driverB?.number) ? "ADVANCES" : "ELIMINATED") : "";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.85)",
        border: HAIRLINE,
        borderRadius: 20,
        padding: "14px 18px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
        minWidth: 260,
        flexShrink: 0,
        scrollSnapAlign: "start",
      }}
    >
      <DriverCard driver={driverA} entry={entryA} status={aStatus} />
      <div style={{ height: 1, background: "rgba(0,0,0,0.07)" }} />
      <DriverCard driver={driverB} entry={entryB} status={bStatus} />
    </div>
  );
}

function InSeasonTournamentPage({ drivers = [], raceHistory = [] }) {
  const seeds = useMemo(() => makeSeeds(drivers), [drivers]);

  const bySeed = useMemo(() => {
    const map = new Map();
    seeds.forEach((driver) => map.set(driver.seed, driver));
    return map;
  }, [seeds]);

  const vegasResults = getRaceResultMap(raceHistory, "Las Vegas");
  const talladegaResults = getRaceResultMap(raceHistory, "Talladega");
  const wilkesboroResults = getRaceResultMap(raceHistory, "North Wilkesboro");
  const indyResults = getRaceResultMap(raceHistory, "Indianapolis");
  const newHampshireResults = getRaceResultMap(raceHistory, "New Hampshire");

  const playIn = [
    [bySeed.get(13), bySeed.get(20)],
    [bySeed.get(14), bySeed.get(19)],
    [bySeed.get(15), bySeed.get(18)],
    [bySeed.get(16), bySeed.get(17)],
  ].map(([a, b]) => decideMatchup(a, b, vegasResults));

  const roundOf16 = [
    [bySeed.get(1), playIn[3]?.winner],
    [bySeed.get(8), playIn[0]?.winner],
    [bySeed.get(4), bySeed.get(5)],
    [bySeed.get(2), playIn[2]?.winner],
    [bySeed.get(7), bySeed.get(10)],
    [bySeed.get(3), playIn[1]?.winner],
    [bySeed.get(6), bySeed.get(11)],
    [bySeed.get(9), bySeed.get(12)],
  ].map(([a, b]) => decideMatchup(a, b, talladegaResults));

  const quarterfinals = [
    [roundOf16[0]?.winner, roundOf16[1]?.winner],
    [roundOf16[2]?.winner, roundOf16[3]?.winner],
    [roundOf16[4]?.winner, roundOf16[5]?.winner],
    [roundOf16[6]?.winner, roundOf16[7]?.winner],
  ].map(([a, b]) => decideMatchup(a, b, wilkesboroResults));

  const semifinals = [
    [quarterfinals[0]?.winner, quarterfinals[1]?.winner],
    [quarterfinals[2]?.winner, quarterfinals[3]?.winner],
  ].map(([a, b]) => decideMatchup(a, b, indyResults));

  const championship = [
    decideMatchup(semifinals[0]?.winner, semifinals[1]?.winner, newHampshireResults),
  ];

  const champion = championship[0]?.winner;

  const rounds = [
    { title: "Play-In — Las Vegas", matchups: playIn },
    { title: "Round of 16 — Talladega", matchups: roundOf16 },
    { title: "Quarterfinals — North Wilkesboro", matchups: quarterfinals },
    { title: "Semifinals — Indianapolis", matchups: semifinals },
    { title: "Championship — New Hampshire", matchups: championship },
  ];

  function exportBracketCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    downloadCsv(`bcl-in-season-bracket-${generated}.csv`, makeBracketExportRows(rounds, champion));
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div
          style={{
            ...sectionCardStyle,
            background: "linear-gradient(135deg, rgba(212,175,55,0.12), rgba(255,255,255,0.85))",
            border: `1px solid ${GOLD}55`,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
                Budweiser Cup League
              </div>
              <h1 style={{ margin: "8px 0", fontSize: 38, lineHeight: 1.05, fontWeight: 700, letterSpacing: -1, color: TEXT_PRIMARY }}>
                🏆 2026 In-Season Tournament
              </h1>
              <p style={{ margin: 0, color: TEXT_SECONDARY, fontSize: 14.5 }}>
                Starts this weekend at Las Vegas. Seeds are based on current championship standings. Substitute starts and substitute wins do not advance a bracket seed.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>
                Back to Standings
              </button>
              <button type="button" onClick={exportBracketCsv} style={secondaryButtonStyle}>
                Export Bracket CSV
              </button>
              <button type="button" onClick={() => window.print()} style={primaryButtonStyle}>
                Print Bracket
              </button>
            </div>
          </div>
        </div>

        {champion && (
          <div style={{ ...sectionCardStyle, border: `1px solid ${GOLD}`, background: "rgba(212,175,55,0.08)" }}>
            <div style={{ color: GOLD, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5 }}>Tournament Champion</div>
            <h2 style={{ margin: "8px 0 0", fontSize: 32, fontWeight: 700, letterSpacing: -0.8, color: TEXT_PRIMARY }}>
              🏆 {driverLabel(champion)}
            </h2>
            <div style={{ color: TEXT_SECONDARY, marginTop: 4, fontSize: 14.5 }}>
              {getTeamFullName(champion.team)} • {champion.manufacturer || "—"}
            </div>
          </div>
        )}

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, fontSize: 20, fontWeight: 600, letterSpacing: -0.3, color: TEXT_PRIMARY }}>Tournament Schedule</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {TOURNAMENT_RACES.map((item) => (
              <div key={item.round} style={{ background: "rgba(0,0,0,0.03)", border: HAIRLINE, borderRadius: 16, padding: 12 }}>
                <div style={{ color: GOLD, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>{item.round}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4, color: TEXT_PRIMARY }}>{item.race}</div>
                {item.matchups && <div style={{ color: TEXT_SECONDARY, fontSize: 12, marginTop: 4 }}>{item.matchups.join(" • ")}</div>}
              </div>
            ))}
          </div>
        </div>

        {rounds.map((round, roundIndex) => (
          <div key={round.title}>
            <div style={sectionCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                <div>
                  <div style={{ color: GOLD, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                    Round {roundIndex + 1} of {rounds.length}
                  </div>
                  <h2 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, letterSpacing: -0.6, color: TEXT_PRIMARY }}>
                    {round.title}
                  </h2>
                </div>
                <div style={{ color: TEXT_SECONDARY, fontSize: 13, fontWeight: 500 }}>
                  {round.matchups.length} matchup{round.matchups.length === 1 ? "" : "s"}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  overflowX: "auto",
                  paddingBottom: 6,
                  scrollSnapType: "x proximity",
                }}
              >
                {round.matchups.map((matchup, index) => (
                  <MatchupCard
                    key={`${round.title}-${index}`}
                    driverA={matchup.a}
                    driverB={matchup.b}
                    winner={matchup.winner}
                    entryA={matchup.aEntry}
                    entryB={matchup.bEntry}
                  />
                ))}
              </div>
            </div>

            {roundIndex < rounds.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", color: GOLD, fontSize: 20, margin: "-8px 0 4px" }}>
                ⌄
              </div>
            )}
          </div>
        ))}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

export default InSeasonTournamentPage;
