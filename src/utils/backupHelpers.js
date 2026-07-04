import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";

function normalizeSupabaseDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
}

function logSupabaseError(label, error, rows = null) {
  console.error(`${label} — message:`, error?.message || error);
  console.error(`${label} — details:`, error?.details ?? null);
  console.error(`${label} — hint:`, error?.hint ?? null);
  console.error(`${label} — code:`, error?.code ?? null);
  if (rows) {
    console.error(`${label} — sample row:`, Array.isArray(rows) ? rows[0] : rows);
  }
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDriverNumber(row = {}) {
  return String(
    row.driver_number ||
      row.car_number ||
      row.number ||
      row.driverNumber ||
      row.carNumber ||
      ""
  );
}

function getDriverName(row = {}) {
  return String(row.driver_name || row.name || row.driverName || "");
}

function getDriverKey(row = {}) {
  return getDriverNumber(row) || getDriverName(row) || String(row.driver_id || row.driverId || "");
}

function getRacePoints(row = {}) {
  return toNumber(
    row.total_race_points ??
      row.totalRacePoints ??
      row.total_points ??
      row.totalPoints ??
      row.points ??
      toNumber(row.race_points ?? row.racePoints, 0) +
        toNumber(row.stage_points ?? row.stagePoints, 0),
    0
  );
}

function getFinishPosition(row = {}) {
  return toNumber(row.finish_pos ?? row.finish_position ?? row.finishPos, 999);
}

export function createBackupFilename(prefix = "league-backup", extension = "json") {
  const safePrefix =
    String(prefix || "league-backup")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "league-backup";

  const safeExtension = String(extension || "json").replace(/^\./, "");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return `${safePrefix}-${timestamp}.${safeExtension}`;
}

export function downloadJsonBackup(filename, data) {
  const blob = new Blob([JSON.stringify(data ?? {}, null, 2)], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename || createBackupFilename("league-backup", "json");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function downloadRaceHistoryCsv(raceHistory = [], seasonName = "") {
  if (!Array.isArray(raceHistory) || raceHistory.length === 0) {
    alert("No race history to download yet.");
    return;
  }

  const rows = raceHistory.flatMap((race) => {
    const results = Array.isArray(race.results) ? race.results : [];

    return results.map((result) => ({
      Season: seasonName || "",
      Race: race.raceName || "",
      StageCount: race.stageCount ?? "",
      Finish: result.finishPos ?? "",
      CarNumber: result.number ?? "",
      Driver: result.name || "",
      Team: getTeamFullName(result.team || ""),
      Manufacturer: result.manufacturer || "",
      FinishPoints: result.finishPoints ?? 0,
      Stage1Points: result.stage1Points ?? 0,
      Stage2Points: result.stage2Points ?? 0,
      Stage3Points: result.stage3Points ?? 0,
      FastestLap: result.fastestLap ? "Yes" : "No",
      DNF: result.dnf ? "Yes" : "No",
      StartPark: result.startPark ? "Yes" : "No",
      DNFReason: result.dnfReason || "",
      Offense: result.offense ? "Yes" : "No",
      OffenseNumber: result.offenseNumber ?? "",
      PenaltyPoints: result.penaltyPoints ?? 0,
      TotalRacePoints: result.totalRacePoints ?? 0,
    }));
  });

  if (rows.length === 0) {
    alert("Race history exists, but there are no driver results to download.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const safeSeasonName = String(seasonName || "season")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `budweiser-cup-race-history-${safeSeasonName}-${dateStamp}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function makeLeagueBackupPayload({
  tracks = [],
  seasons = [],
  activeSeasonId = "",
  reason = "manual-backup",
  raceSnapshot = null,
}) {
  return {
    backupVersion: 1,
    appName: "Budweiser Cup League",
    reason,
    backedUpAt: new Date().toISOString(),
    activeSeasonId,
    tracks,
    seasons,
    raceSnapshot,
  };
}

export function downloadLeagueBackupFile(backupPayload, label = "backup") {
  const safeLabel = String(label || "backup")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const dateStamp = new Date().toISOString().replace(/[:.]/g, "-");
  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `budweiser-cup-results-${safeLabel}-${dateStamp}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function isValidLeagueBackup(backup) {
  return (
    !!backup &&
    Array.isArray(backup.seasons) &&
    backup.seasons.length > 0 &&
    !!backup.activeSeasonId
  );
}

export async function createRaceDataBackup({
  seasonSnapshot,
  raceSnapshot,
  backupType = "save-points",
}) {
  try {
    const { error } = await supabase.from("race_data_backups").insert({
      backup_type: backupType,
      season_id: seasonSnapshot?.id || null,
      season_name: seasonSnapshot?.name || "Season",
      race_name: raceSnapshot?.raceName || seasonSnapshot?.selectedRace || "Race",
      snapshot: seasonSnapshot,
      race_snapshot: raceSnapshot,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Race data backup failed:", error);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (error) {
    console.error("Race data backup crashed:", error);
    return { ok: false, error };
  }
}

export function makeRaceResultsLedgerRows({ season, race, tracks = [] }) {
  if (!season || !race || !Array.isArray(race.results)) return [];

  const raceDate =
    (tracks || []).find((track) => track?.name === race.raceName)?.date || null;

  const rosterById = new Map(
    (season.drivers || []).map((driver) => [String(driver.id), driver])
  );

  return race.results.map((result) => {
    const rosterDriver = rosterById.get(String(result.driverId)) || {};

    return {
      season_id: String(season.id || ""),
      season_name: season.name || "Season",
      race_name: race.raceName || "",
      race_date: normalizeSupabaseDate(raceDate),
      driver_id: String(result.driverId || rosterDriver.id || ""),
      driver_number: String(result.number || rosterDriver.number || ""),
      driver_name: result.name || rosterDriver.name || "",
      team: result.team || rosterDriver.team || "",
      manufacturer: result.manufacturer || rosterDriver.manufacturer || "",
      finish_pos: result.finishPos ?? null,
      finish_points: toNumber(result.finishPoints, 0),
      stage1_finish: result.stage1Pos ?? null,
      stage1_points: toNumber(result.stage1Points, 0),
      stage2_finish: result.stage2Pos ?? null,
      stage2_points: toNumber(result.stage2Points, 0),
      stage3_finish: result.stage3Pos ?? null,
      stage3_points: toNumber(result.stage3Points, 0),
      fastest_lap: Boolean(result.fastestLap),
      dnf: Boolean(result.dnf),
      start_park: Boolean(result.startPark),
      dnf_reason: result.dnfReason || null,
      offense: Boolean(result.offense),
      offense_number: toNumber(result.offenseNumber, 0),
      penalty_points: toNumber(result.penaltyPoints, 0),
      total_race_points: toNumber(result.totalRacePoints, 0),
      updated_at: new Date().toISOString(),
    };
  });
}

export async function saveRaceResultsLedger({ season, race, tracks = [] }) {
  const rows = makeRaceResultsLedgerRows({ season, race, tracks });

  if (!rows.length) return { ok: true, skipped: true };

  try {
    const { error: deleteError } = await supabase
      .from("race_results")
      .delete()
      .eq("season_id", String(season.id || ""))
      .eq("race_name", race.raceName || "");

    if (deleteError) {
      console.error("Could not clear old race_results rows:", deleteError);
      return { ok: false, error: deleteError };
    }

    const { error: insertError } = await supabase.from("race_results").insert(rows);

    if (insertError) {
      console.error("Could not save race_results ledger:", insertError);
      return { ok: false, error: insertError };
    }

    return { ok: true };
  } catch (error) {
    console.error("race_results ledger save crashed:", error);
    return { ok: false, error };
  }
}

export async function syncAllRaceResultsLedger({ seasons = [], tracks = [] }) {
  try {
    for (const season of seasons || []) {
      for (const race of season?.raceHistory || []) {
        const result = await saveRaceResultsLedger({ season, race, tracks });
        if (!result.ok) return result;
      }
    }

    return { ok: true };
  } catch (error) {
    console.error("Full race_results sync crashed:", error);
    return { ok: false, error };
  }
}

export function makeArcaRaceResultsLedgerRows({ season, race, tracks = [] }) {
  if (!season || !race || !Array.isArray(race.results)) return [];

  const raceDate =
    race.raceDate ||
    race.date ||
    (tracks || []).find((track) => track?.name === race.raceName)?.date ||
    null;

  const rosterById = new Map(
    (season.drivers || season.arcaDrivers || []).map((driver) => [String(driver.id), driver])
  );

  return race.results.map((result) => {
    const rosterDriver = rosterById.get(String(result.driverId)) || {};
    const finishPoints = toNumber(result.finishPoints ?? result.racePoints, 0);
    const stagePoints =
      toNumber(result.stagePoints, 0) +
      toNumber(result.stage1Points, 0) +
      toNumber(result.stage2Points, 0) +
      toNumber(result.stage3Points, 0);
    const totalRacePoints = toNumber(
      result.totalRacePoints ?? result.total_points ?? result.points,
      finishPoints + stagePoints - toNumber(result.penaltyPoints, 0)
    );

    return {
      season_id: String(season.id || ""),
      season_name: season.name || "ARCA Season",
      race_name: race.raceName || race.name || "",
      race_date: normalizeSupabaseDate(raceDate),
      driver_id: String(result.driverId || rosterDriver.id || ""),
      driver_number: String(result.number || result.driver_number || rosterDriver.number || ""),
      driver_name: result.name || result.driver_name || rosterDriver.name || "",
      team: result.team || rosterDriver.team || "",
      manufacturer: result.manufacturer || rosterDriver.manufacturer || "",
      finish_pos: result.finishPos ?? result.finish_position ?? null,
      finish_points: finishPoints,
      fastest_lap: Boolean(result.fastestLap),
      dnf: Boolean(result.dnf),
      dnf_reason: result.dnfReason || null,
      offense: Boolean(result.offense),
      offense_number: toNumber(result.offenseNumber, 0),
      penalty_points: toNumber(result.penaltyPoints, 0),
      total_race_points: totalRacePoints,
      total_points: totalRacePoints,
      race_points: finishPoints,
      stage_points: stagePoints,
      updated_at: new Date().toISOString(),
    };
  });
}

export async function rebuildArcaStandingsFromResults() {
  try {
    const { data: results, error: loadError } = await supabase
      .from("arca_results")
      .select("*");

    if (loadError) {
      logSupabaseError("Could not load arca_results for standings rebuild", loadError);
      return { ok: false, table: "arca_results", error: loadError };
    }

    const standingsMap = new Map();

    for (const result of results || []) {
      const key = getDriverKey(result);
      if (!key) continue;

      const driverNumber = getDriverNumber(result);
      const driverName = getDriverName(result);
      const finish = getFinishPosition(result);
      const points = getRacePoints(result);

      const current = standingsMap.get(key) || {
        driver_number: driverNumber,
        car_number: driverNumber,
        driver_name: driverName,
        team: result.team || "",
        manufacturer: result.manufacturer || "",
        points: 0,
        wins: 0,
        top5: 0,
        top10: 0,
        starts: 0,
        stage_wins: 0,
        playoff_points: 0,
        updated_at: new Date().toISOString(),
      };

      current.driver_number = current.driver_number || driverNumber;
      current.car_number = current.car_number || driverNumber;
      current.driver_name = current.driver_name || driverName;
      current.team = current.team || result.team || "";
      current.manufacturer = current.manufacturer || result.manufacturer || "";
      current.points += points;
      current.starts += 1;
      if (finish === 1) current.wins += 1;
      if (finish <= 5) current.top5 += 1;
      if (finish <= 10) current.top10 += 1;

      standingsMap.set(key, current);
    }

    const standings = Array.from(standingsMap.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.top5 !== a.top5) return b.top5 - a.top5;
      return b.top10 - a.top10;
    });

    const rows = standings.map((driver) => ({
      driver_number: String(driver.driver_number || driver.car_number || ""),
      car_number: String(driver.car_number || driver.driver_number || ""),
      driver_name: driver.driver_name || "",
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
      points: toNumber(driver.points, 0),
      wins: toNumber(driver.wins, 0),
      top5: toNumber(driver.top5, 0),
      top10: toNumber(driver.top10, 0),
      starts: toNumber(driver.starts, 0),
      stage_wins: toNumber(driver.stage_wins, 0),
      playoff_points: toNumber(driver.playoff_points, 0),
      updated_at: new Date().toISOString(),
    }));

    const { error: deleteError } = await supabase
      .from("arca_standings")
      .delete()
      .neq("driver_number", "__never_match__");

    if (deleteError) {
      logSupabaseError("Could not clear old arca_standings", deleteError, rows);
      return { ok: false, table: "arca_standings", error: deleteError };
    }

    if (!rows.length) return { ok: true, data: [] };

    const { data, error: insertError } = await supabase
      .from("arca_standings")
      .insert(rows)
      .select();

    if (insertError) {
      logSupabaseError("Could not rebuild arca_standings", insertError, rows);
      return { ok: false, table: "arca_standings", error: insertError };
    }

    return { ok: true, data };
  } catch (error) {
    console.error("ARCA standings rebuild crashed:", error);
    return { ok: false, error };
  }
}

export async function saveArcaRaceResultsLedger({ season, race, tracks = [] }) {
  const rows = makeArcaRaceResultsLedgerRows({ season, race, tracks });

  if (!rows.length) return { ok: true, skipped: true };

  try {
    const { error: deleteError } = await supabase
      .from("arca_results")
      .delete()
      .eq("season_id", String(season.id || ""))
      .eq("race_name", race.raceName || race.name || "");

    if (deleteError) {
      logSupabaseError("Could not clear old arca_results rows", deleteError, rows);
      return { ok: false, table: "arca_results", error: deleteError };
    }

    const { error: insertError } = await supabase.from("arca_results").insert(rows);

    if (insertError) {
      logSupabaseError("Could not save arca_results ledger", insertError, rows);
      return { ok: false, table: "arca_results", error: insertError };
    }

    const standingsResult = await rebuildArcaStandingsFromResults();
    if (!standingsResult.ok) return standingsResult;

    return { ok: true };
  } catch (error) {
    console.error("arca_results ledger save crashed:", error);
    return { ok: false, error };
  }
}

export async function syncAllArcaRaceResultsLedger({ seasons = [], tracks = [] }) {
  try {
    for (const season of seasons || []) {
      for (const race of season?.arcaRaceHistory || []) {
        const rows = makeArcaRaceResultsLedgerRows({ season, race, tracks });
        if (!rows.length) continue;

        const { error: deleteError } = await supabase
          .from("arca_results")
          .delete()
          .eq("season_id", String(season.id || ""))
          .eq("race_name", race.raceName || race.name || "");

        if (deleteError) {
          logSupabaseError("Could not clear old arca_results rows", deleteError, rows);
          return { ok: false, table: "arca_results", error: deleteError };
        }

        const { error: insertError } = await supabase.from("arca_results").insert(rows);

        if (insertError) {
          logSupabaseError("Could not save arca_results ledger", insertError, rows);
          return { ok: false, table: "arca_results", error: insertError };
        }
      }
    }

    return await rebuildArcaStandingsFromResults();
  } catch (error) {
    console.error("Full arca_results sync crashed:", error);
    return { ok: false, error };
  }
}

export async function saveArcaStandings({ season, arcaDrivers = [] } = {}) {
  if (!Array.isArray(arcaDrivers) || arcaDrivers.length === 0) {
    return await rebuildArcaStandingsFromResults();
  }

  const rows = arcaDrivers
    .map((driver) => ({
      driver_number: String(driver.number || driver.driver_number || driver.car_number || ""),
      car_number: String(driver.car_number || driver.driver_number || driver.number || ""),
      driver_name: driver.name || driver.driver_name || "",
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
      points: toNumber(driver.points, 0),
      wins: toNumber(driver.wins, 0),
      top5: toNumber(driver.top5, 0),
      top10: toNumber(driver.top10, 0),
      starts: toNumber(driver.starts, 0),
      stage_wins: toNumber(driver.stage_wins || driver.stageWins, 0),
      playoff_points: toNumber(driver.playoff_points || driver.playoffPoints, 0),
      updated_at: new Date().toISOString(),
    }))
    .filter((row) => row.driver_number || row.driver_name);

  try {
    const { error: deleteError } = await supabase
      .from("arca_standings")
      .delete()
      .neq("driver_number", "__never_match__");

    if (deleteError) {
      logSupabaseError("Could not clear old arca_standings", deleteError, rows);
      return { ok: false, table: "arca_standings", error: deleteError };
    }

    if (!rows.length) return { ok: true, skipped: true };

    const { data, error } = await supabase
      .from("arca_standings")
      .insert(rows)
      .select();

    if (error) {
      logSupabaseError("Could not save arca_standings", error, rows);
      return { ok: false, table: "arca_standings", error };
    }

    return { ok: true, data };
  } catch (error) {
    console.error("arca_standings save crashed:", error);
    return { ok: false, error };
  }
}

// Persists computed team prestige tiers/scores. Only touches the prestige-
// scoring columns (team, manufacturer, tier, prestige, performance/interview/
// upload scores, driver_count, updated_at) — existing manually-curated columns
// on this table (championships, fan_popularity, reputation, wins) are left
// untouched since they aren't included in the upsert payload.
export async function saveTeamPrestige(rows = []) {
  try {
    if (!Array.isArray(rows) || !rows.length) return { ok: true, skipped: true };

    const payload = rows.map((row) => ({
      team: row.team,
      manufacturer: row.manufacturer || null,
      tier: row.tier || null,
      prestige: Math.round(row.compositeScore || 0),
      performance_score: Math.round(row.performanceScore || 0),
      interview_score: Math.round(row.interviewScore || 0),
      upload_score: Math.round(row.uploadScore || 0),
      driver_count: Math.round(row.driverCount || 0),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from("team_prestige")
      .upsert(payload, { onConflict: "team" })
      .select();

    if (error) {
      logSupabaseError("Could not save team_prestige", error, payload);
      return { ok: false, table: "team_prestige", error };
    }

    return { ok: true, data };
  } catch (error) {
    console.error("team_prestige save crashed:", error);
    return { ok: false, error };
  }
}
