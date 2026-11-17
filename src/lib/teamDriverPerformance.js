/** Current-season Cup driver results for the Owner HQ performance dashboard.
 *  The caller must supply the ACTIVE season's roster and race history only.
 *  Historical seasons, ARCA, and preseason races are deliberately excluded.
 */
const normalize = (value) => String(value ?? "").trim().toLowerCase();
const finite = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
const validFinish = (value) => { const n = finite(value); return n !== null && n > 0 ? n : null; };
const average = (values) => values.length ? values.reduce((sum, n) => sum + n, 0) / values.length : null;
const median = (values) => {
  if (!values.length) return null;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
};

export function isOfficialSeasonRace(race) {
  const name = String(race?.raceName || race?.name || "").trim();
  return !race?.isPreseason && !race?.preseason && !/^pre[\s-]?season\b/i.test(name) && Array.isArray(race?.results);
}

function findDriverResult(race, driver) {
  const name = normalize(driver?.name || driver?.gamertag);
  const id = normalize(driver?.id);
  // Gamertag is the durable identity for renamed car numbers. Driver IDs are
  // used only for legacy results without a recorded gamertag.
  const result = (race?.results || []).find((row) => {
    const resultName = normalize(row?.name || row?.driverName);
    return resultName ? Boolean(name) && resultName === name : Boolean(id) && normalize(row?.driverId) === id;
  });
  if (!result) return null;
  // Posted BRL race rows may include non-starters with no finishing position.
  // A recorded DNF still counts as a start.
  if (validFinish(result.finishPos ?? result.finish) === null && result.dnf !== true && result.startPark !== true) return null;
  // Don't credit results earned while the driver was racing for another team.
  if (result.team && normalize(result.team) !== normalize(driver.team)) return null;
  return result;
}

export function buildTeamDriverPerformance(drivers = [], raceHistory = [], teamCode = "") {
  const roster = (Array.isArray(drivers) ? drivers : []).filter((driver) =>
    normalize(driver?.team) === normalize(teamCode) &&
    normalize(driver?.series || "cup") === "cup" &&
    driver?.retired !== true &&
    !driver?.isSubstitute
  );
  const races = (Array.isArray(raceHistory) ? raceHistory : []).filter(isOfficialSeasonRace);
  return roster.map((driver) => {
    const results = races.flatMap((race, index) => {
      const result = findDriverResult(race, driver);
      if (!result) return [];
      const finish = validFinish(result.finishPos ?? result.finish);
      return [{
        raceName: race.raceName || race.name || `Race ${index + 1}`,
        date: race.date || race.raceDate || race.postedAt || race.savedAt || "",
        finish,
        points: finite(result.totalRacePoints),
        dnf: result.dnf === true,
        fastestLap: result.fastestLap === true,
        penaltyPoints: finite(result.penaltyPoints),
        notes: result.dnfReason || result.notes || "",
      }];
    });
    const finishes = results.map((r) => r.finish).filter((n) => n !== null);
    const recent = results.slice(-5);
    const recentFinishes = recent.map((r) => r.finish).filter((n) => n !== null);
    const firstFive = results.slice(0, 5).map((r) => r.finish).filter((n) => n !== null);
    const count = (test) => results.filter(test).length;
    const starts = results.length;
    const racePoints = results.reduce((sum, r) => sum + (r.points || 0), 0);
    const points = finite(driver.points) ?? racePoints;
    return {
      id: String(driver.id ?? driver.name),
      name: driver.name || driver.gamertag || "Unknown driver",
      number: driver.number,
      team: driver.team,
      points,
      starts,
      wins: count((r) => !r.dnf && r.finish === 1),
      top3: count((r) => !r.dnf && r.finish !== null && r.finish <= 3),
      top5: count((r) => !r.dnf && r.finish !== null && r.finish <= 5),
      top10: count((r) => !r.dnf && r.finish !== null && r.finish <= 10),
      dnfs: count((r) => r.dnf),
      fastestLaps: count((r) => r.fastestLap),
      penaltyPoints: results.reduce((sum, r) => sum + (r.penaltyPoints || 0), 0),
      avgFinish: average(finishes),
      medianFinish: median(finishes),
      bestFinish: finishes.length ? Math.min(...finishes) : null,
      recentAvg: average(recentFinishes),
      firstFiveAvg: average(firstFive),
      finishRate: starts ? (starts - count((r) => r.dnf)) / starts * 100 : null,
      pointsPerStart: starts ? points / starts : null,
      results,
    };
  });
}
