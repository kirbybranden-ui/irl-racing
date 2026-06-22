import { defaultRaces } from "../data/races";
import {
  dedupeDriversByNumber,
  getDefaultRoster,
  rebuildDriversFromHistory,
  apply2026DriverNumberAdjustments,
  isRemovedLeagueDriver,
} from "./driverHelpers";
import { normalizeTrackName, sanitizeTracks } from "./raceHelpers";

export function makeSeasonId() {
  return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptySeason(name, roster = getDefaultRoster()) {
  const dedupedRoster = dedupeDriversByNumber(roster);

  const cleanRoster = dedupedRoster.map((driver) => ({
    id: driver.id,
    number: driver.number,
    name: driver.name,
    manufacturer: driver.manufacturer || "",
    team: driver.team,
    startingPoints: 0,
    manualWins: 0,
  }));

  return {
    id: makeSeasonId(),
    name: name || "New Season",
    createdAt: new Date().toISOString(),
    drivers: rebuildDriversFromHistory([], cleanRoster),
    selectedRace: "",
    positions: {},
    stage1: {},
    stage2: {},
    stage3: {},
    dnfMap: {},
    startParkMap: {},
    offenseMap: {},
    fastestLapMap: {},
    raceHistory: [],
  };
}

export function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource =
    Array.isArray(season?.drivers) && season.drivers.length > 0
      ? season.drivers
      : getDefaultRoster();

  const normalizedHistory = Array.isArray(season?.raceHistory)
    ? season.raceHistory.map((race) => ({
        ...race,
        raceName: normalizeTrackName(race.raceName),
      }))
    : [];

  const adjusted = apply2026DriverNumberAdjustments(rosterSource, normalizedHistory);

  const rosterOnly = dedupeDriversByNumber(adjusted.roster).map((driver) => ({
    id: driver.id,
    number: Number(driver.number),
    name: driver.name,
    manufacturer: driver.manufacturer || "",
    team: driver.team,
    startingPoints: 0,
    manualWins: 0,
    retired: driver.retired || false,
    notes: "",
  }));

  const history = (adjusted.history || []).map((race) => ({
    ...race,
    results: Array.isArray(race?.results)
      ? race.results.filter((result) => !isRemovedLeagueDriver(result))
      : [],
  }));

  return {
    id: season?.id || makeSeasonId(),
    name: season?.name || fallbackName,
    createdAt: season?.createdAt || new Date().toISOString(),
    drivers: rebuildDriversFromHistory(history, rosterOnly),
    selectedRace: normalizeTrackName(season?.selectedRace || ""),
    positions: season?.positions || {},
    stage1: season?.stage1 || {},
    stage2: season?.stage2 || {},
    stage3: season?.stage3 || {},
    dnfMap: season?.dnfMap || {},
    startParkMap: season?.startParkMap || {},
    offenseMap: season?.offenseMap || {},
    fastestLapMap: season?.fastestLapMap || {},
    raceHistory: history,
  };
}

export function buildLegacySeasonFromLocalStorage() {
  const keys = [
    "irl-drivers",
    "irl-raceHistory",
    "irl-selectedRace",
    "irl-positions",
    "irl-stage1",
    "irl-stage2",
    "irl-stage3",
    "irl-dnfMap",
    "irl-startParkMap",
  ];

  const hasLegacy = keys.some((key) => localStorage.getItem(key));

  if (!hasLegacy) return createEmptySeason("Season 1");

  try {
    const drivers = JSON.parse(localStorage.getItem("irl-drivers") || "null") || getDefaultRoster();
    const raceHistory = JSON.parse(localStorage.getItem("irl-raceHistory") || "null") || [];
    const selectedRace = localStorage.getItem("irl-selectedRace") || "";
    const positions = JSON.parse(localStorage.getItem("irl-positions") || "null") || {};
    const stage1 = JSON.parse(localStorage.getItem("irl-stage1") || "null") || {};
    const stage2 = JSON.parse(localStorage.getItem("irl-stage2") || "null") || {};
    const stage3 = JSON.parse(localStorage.getItem("irl-stage3") || "null") || {};
    const dnfMap = JSON.parse(localStorage.getItem("irl-dnfMap") || "null") || {};
    const startParkMap = JSON.parse(localStorage.getItem("irl-startParkMap") || "null") || {};

    return sanitizeSeason({
      id: makeSeasonId(),
      name: "Season 1",
      createdAt: new Date().toISOString(),
      drivers,
      raceHistory,
      selectedRace,
      positions,
      stage1,
      stage2,
      stage3,
      dnfMap,
      startParkMap,
      offenseMap: {},
      fastestLapMap: {},
    });
  } catch {
    return createEmptySeason("Season 1");
  }
}

export function loadInitialLeagueState() {
  let tracks = defaultRaces;

  try {
    const savedTracks = localStorage.getItem("irl-tracks");

    if (savedTracks) {
      const parsed = sanitizeTracks(JSON.parse(savedTracks));

      if (parsed && parsed.length > 0) tracks = parsed;
    }
  } catch {
    // fall through
  }

  try {
    const savedSeasons = localStorage.getItem("irl-seasons");
    const savedActiveSeasonId = localStorage.getItem("irl-activeSeasonId");

    if (savedSeasons) {
      const parsed = JSON.parse(savedSeasons);

      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanSeasons = parsed.map((season, index) =>
          sanitizeSeason(season, `Season ${index + 1}`)
        );

        const activeExists = cleanSeasons.some(
          (season) => season.id === savedActiveSeasonId
        );

        return {
          seasons: cleanSeasons,
          activeSeasonId: activeExists ? savedActiveSeasonId : cleanSeasons[0].id,
          tracks,
        };
      }
    }
  } catch {
    // fall through
  }

  const legacySeason = buildLegacySeasonFromLocalStorage();

  return {
    seasons: [legacySeason],
    activeSeasonId: legacySeason.id,
    tracks,
  };
}

export function isUsableLeagueState(state) {
  return !!state && Array.isArray(state.seasons) && state.seasons.length > 0 && !!state.activeSeasonId;
}

export function makeLeagueStateSignature({ seasons = [], activeSeasonId = "", tracks = [] }) {
  return JSON.stringify({ seasons, activeSeasonId, tracks });
}

export function normalizeLoadedLeagueState(savedState, patchMissingDriversFn = null) {
  if (!isUsableLeagueState(savedState)) return null;

  let cleanSeasons = savedState.seasons.map((season, index) =>
    sanitizeSeason(season, `Season ${index + 1}`)
  );

  if (typeof patchMissingDriversFn === "function") {
    cleanSeasons = patchMissingDriversFn(cleanSeasons);
  }

  if (!cleanSeasons.length) return null;

  const activeExists = cleanSeasons.some(
    (season) => season.id === savedState.activeSeasonId
  );

  const cleanTracks = sanitizeTracks(savedState.tracks) || defaultRaces;

  return {
    seasons: cleanSeasons,
    activeSeasonId: activeExists ? savedState.activeSeasonId : cleanSeasons[0].id,
    tracks: cleanTracks,
  };
}
