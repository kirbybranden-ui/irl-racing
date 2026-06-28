import React, { useMemo } from "react";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
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

function DriverCard({ driver, status = "", entry = null }) {
  const resultLabel = entry
    ? entry.ineligible
      ? entry.reason
      : `Finished P${entry.finish}`
    : "";

  return (
    <div
      style={{
        background: "#0f1319",
        border: entry?.ineligible ? "1px solid #f87171" : "1px solid #2c3440",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900 }}>
        {driver ? `SEED #${driver.seed}` : "TBD"}
      </div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>
        {driverLabel(driver)}
      </div>
      <div style={{ opacity: 0.72, fontSize: 13, marginTop: 4 }}>
        {driver ? `${getTeamFullName(driver.team)} • ${driver.manufacturer || "—"}` : "Awaiting result"}
      </div>
      {resultLabel && (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: entry?.ineligible ? "#f87171" : "#93c5fd" }}>
          {resultLabel}
        </div>
      )}
      {status && (
        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900, color: status === "ADVANCES" ? "#4ade80" : "#f87171" }}>
          {status}
        </div>
      )}
    </div>
  );
}

function MatchupCard({ title, driverA, driverB, winner, entryA, entryB }) {
  return (
    <div style={sectionCardStyle}>
      <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1.2 }}>
        {title}
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        <DriverCard
          driver={driverA}
          entry={entryA}
          status={winner && cleanNumber(winner.number) === cleanNumber(driverA?.number) ? "ADVANCES" : ""}
        />
        <div style={{ textAlign: "center", fontWeight: 900, opacity: 0.65 }}>VS</div>
        <DriverCard
          driver={driverB}
          entry={entryB}
          status={winner && cleanNumber(winner.number) === cleanNumber(driverB?.number) ? "ADVANCES" : ""}
        />
      </div>

      <div style={{ marginTop: 12, padding: 10, borderRadius: 12, background: "#111827", border: "1px solid #263244" }}>
        <span style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>WINNER: </span>
        <span style={{ fontWeight: 900 }}>{driverLabel(winner)}</span>
      </div>
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

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div
          style={{
            ...sectionCardStyle,
            background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(15,23,42,0.98))",
            border: "1px solid rgba(212,175,55,0.65)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 1000, letterSpacing: 1.5 }}>
                BUDWEISER CUP LEAGUE
              </div>
              <h1 style={{ margin: "8px 0", fontSize: 40, lineHeight: 1 }}>
                🏆 2026 In-Season Tournament
              </h1>
              <p style={{ margin: 0, opacity: 0.82 }}>
                Starts this weekend at Las Vegas. Seeds are based on current championship standings. Substitute starts and substitute wins do not advance a bracket seed.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>
                Back to Standings
              </button>
              <button type="button" onClick={() => window.print()} style={primaryButtonStyle}>
                Print Bracket
              </button>
            </div>
          </div>
        </div>

        {champion && (
          <div style={{ ...sectionCardStyle, border: "1px solid #d4af37", background: "#111827" }}>
            <div style={{ color: "#d4af37", fontWeight: 1000, fontSize: 13 }}>TOURNAMENT CHAMPION</div>
            <h2 style={{ margin: "8px 0 0", fontSize: 34 }}>
              🏆 {driverLabel(champion)}
            </h2>
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              {getTeamFullName(champion.team)} • {champion.manufacturer || "—"}
            </div>
          </div>
        )}

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Tournament Schedule</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
            {TOURNAMENT_RACES.map((item) => (
              <div key={item.round} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 12 }}>
                <div style={{ color: "#d4af37", fontWeight: 900, fontSize: 12 }}>{item.round}</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>{item.race}</div>
                {item.matchups && <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>{item.matchups.join(" • ")}</div>}
              </div>
            ))}
          </div>
        </div>

        {rounds.map((round) => (
          <div key={round.title}>
            <h2 style={{ margin: "28px 0 12px", fontSize: 26 }}>{round.title}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
              {round.matchups.map((matchup, index) => (
                <MatchupCard
                  key={`${round.title}-${index}`}
                  title={`Matchup ${index + 1}`}
                  driverA={matchup.a}
                  driverB={matchup.b}
                  winner={matchup.winner}
                  entryA={matchup.aEntry}
                  entryB={matchup.bEntry}
                />
              ))}
            </div>
          </div>
        ))}

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}

export default InSeasonTournamentPage;
