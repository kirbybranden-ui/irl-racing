import { defaultDrivers } from "../data/drivers";
import { manufacturerLogos } from "../data/teams";

export function isInactivePlaceholderDriver(driver) {
  return String(driver?.name || "").trim().toLowerCase().startsWith("inactive-");
}

export const removedDriverNumbers = new Set(["16", "38", "42", "66", "80", "86"]);
export const removedDriverIds = new Set([1, 8, 13, 21, 25, 28, 66]);
export const removedDriverNames = new Set([
  "vtfan_25",
  "undeadhelliday",
  "racingis_life87",
  "vanilla04gorilla",
  "gumby_1919",
  "gumby",
  "yinzermob_86",
  "yinzer",
  "it's_tricky88",
  "its_tricky88",
  "itstricky88",
]);

export function isRemovedLeagueDriver(driver) {
  const nameKey = String(driver?.name ?? driver?.driver_name ?? "").trim().toLowerCase();

  return removedDriverNames.has(nameKey);
}

export function realignLeagueDriver(driver) {
  if (!driver || isRemovedLeagueDriver(driver)) return null;
  return driver;
}

export function realignLeagueDrivers(drivers = []) {
  return (Array.isArray(drivers) ? drivers : [])
    .map(realignLeagueDriver)
    .filter(Boolean);
}

export function filterRemovedLeagueDrivers(drivers = []) {
  return Array.isArray(drivers)
    ? drivers.filter((driver) => !isRemovedLeagueDriver(driver))
    : [];
}

export function dedupeDriversByNumber(drivers) {
  if (!Array.isArray(drivers)) return [];

  drivers = filterRemovedLeagueDrivers(drivers);
  const byNumber = new Map();

  drivers.forEach((driver) => {
    if (!driver || driver.number === undefined || driver.number === null) return;

    const numberKey = String(Number(driver.number));
    const current = byNumber.get(numberKey);

    if (!current) {
      byNumber.set(numberKey, driver);
      return;
    }

    const driverHasData =
      Number(driver.points || 0) !== 0 ||
      Number(driver.wins || 0) !== 0 ||
      Number(driver.top3 || 0) !== 0 ||
      Number(driver.top5 || 0) !== 0 ||
      Number(driver.dnfs || 0) !== 0 ||
      Number(driver.fastestLaps || 0) !== 0 ||
      Number(driver.totalPenalties || 0) !== 0;

    const currentHasData =
      Number(current.points || 0) !== 0 ||
      Number(current.wins || 0) !== 0 ||
      Number(current.top3 || 0) !== 0 ||
      Number(current.top5 || 0) !== 0 ||
      Number(current.dnfs || 0) !== 0 ||
      Number(current.fastestLaps || 0) !== 0 ||
      Number(current.totalPenalties || 0) !== 0;

    if (driverHasData && !currentHasData) {
      byNumber.set(numberKey, driver);
    }
  });

  return Array.from(byNumber.values());
}

export function makeDriverWithStats(driver) {
  return {
    ...driver,
    manufacturer: driver.manufacturer || "",
    manufacturerLogo: driver.manufacturerLogo || manufacturerLogos[driver.manufacturer] || null,
    startingPoints: 0,
    manualWins: 0,
    points: 0,
    wins: 0,
    top3: 0,
    top5: 0,
    dnfs: 0,
    retired: driver.retired || false,
    notes: "",
  };
}

export function getDriverAchievements(driver) {
  const achievements = [];

  if (driver.wins >= 1) achievements.push({ badge: "🏆", name: "First Win", condition: true });
  if (driver.wins >= 3) achievements.push({ badge: "🥇", name: "Hat Trick", condition: true });
  if (driver.wins >= 5) achievements.push({ badge: "👑", name: "Dominator", condition: true });
  if (driver.top3 >= 10) achievements.push({ badge: "🎯", name: "Podium Master", condition: true });
  if (driver.points >= 100) achievements.push({ badge: "⭐", name: "Century Club", condition: true });
  if (driver.fastestLaps >= 5) achievements.push({ badge: "⚡", name: "Speed Demon", condition: true });

  return achievements;
}

export function getDefaultRoster() {
  return dedupeDriversByNumber(
    realignLeagueDrivers(defaultDrivers).map(makeDriverWithStats)
  );
}

export function rebuildDriversFromHistory(history, driverRoster) {
  return driverRoster.map((baseDriver) => {
    let points = 0;
    let wins = 0;
    let top3 = 0;
    let top5 = 0;
    let dnfs = 0;
    let fastestLaps = 0;
    let totalPenalties = 0;

    history.forEach((race) => {
      const result = race.results?.find((r) => r.driverId === baseDriver.id);
      if (!result) return;

      points += result.totalRacePoints || 0;
      wins += result.isWin ? 1 : 0;
      top3 += result.isTop3 ? 1 : 0;
      top5 += result.isTop5 ? 1 : 0;
      dnfs += result.dnf ? 1 : 0;
      fastestLaps += result.fastestLap ? 1 : 0;
      totalPenalties += result.penaltyPoints || 0;
    });

    return {
      ...baseDriver,
      manufacturerLogo: baseDriver.manufacturerLogo || manufacturerLogos[baseDriver.manufacturer] || null,
      startingPoints: 0,
      manualWins: 0,
      points,
      wins,
      top3,
      top5,
      dnfs,
      fastestLaps,
      totalPenalties,
      retired: baseDriver.retired || false,
      notes: "",
    };
  });
}

export function apply2026DriverNumberAdjustments(roster = [], history = []) {
  return { roster: Array.isArray(roster) ? roster : [], history: Array.isArray(history) ? history : [] };
}
