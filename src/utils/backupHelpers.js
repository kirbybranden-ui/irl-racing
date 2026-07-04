import { supabase } from "../lib/supabase";

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
  if (rows) console.error(`${label} — sample row:`, Array.isArray(rows) ? rows[0] : rows);
}
import { getTeamFullName } from "../data/teams";

export function createBackupFilename(prefix = "league-backup", extension = "json") {
  const safePrefix = String(prefix || "league-backup")
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
 
  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });
 
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
      finish_points: Number(result.finishPoints || 0),
      stage1_finish: result.stage1Pos ?? null,
      stage1_points: Number(result.stage1Points || 0),
      stage2_finish: result.stage2Pos ?? null,
      stage2_points: Number(result.stage2Points || 0),
      stage3_finish: result.stage3Pos ?? null,
      stage3_points: Number(result.stage3Points || 0),
      fastest_lap: Boolean(result.fastestLap),
      dnf: Boolean(result.dnf),
      start_park: Boolean(result.startPark),
      dnf_reason: result.dnfReason || null,
      offense: Boolean(result.offense),
      offense_number: Number(result.offenseNumber || 0),
      penalty_points: Number(result.penaltyPoints || 0),
      total_race_points: Number(result.totalRacePoints || 0),
      updated_at: new Date().toISOString(),
    };
  });
}
 
export async function saveRaceResultsLedger({ season, race, tracks = [] }) {
  const rows = makeRaceResultsLedgerRows({ season, race, tracks });
 
  if (!rows.length) {
    return { ok: true, skipped: true };
  }
 
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
 
// ARCA SERIES FUNCTIONS (Mirror of Cup)
 
export function makeArcaRaceResultsLedgerRows({ season, race, tracks = [] }) {
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
      finish_points: Number(result.finishPoints || 0),
      fastest_lap: Boolean(result.fastestLap),
      dnf: Boolean(result.dnf),
      dnf_reason: result.dnfReason || null,
      offense: Boolean(result.offense),
      offense_number: Number(result.offenseNumber || 0),
      penalty_points: Number(result.penaltyPoints || 0),
      total_race_points: Number(result.totalRacePoints || 0),
      updated_at: new Date().toISOString(),
    };
  });
}
 
export async function saveArcaRaceResultsLedger({ season, race, tracks = [] }) {
  const rows = makeArcaRaceResultsLedgerRows({ season, race, tracks });
 
  if (!rows.length) {
    return { ok: true, skipped: true };
  }
 
  try {
    const { error: deleteError } = await supabase
      .from("arca_results")
      .delete()
      .eq("season_id", String(season.id || ""))
      .eq("race_name", race.raceName || "");
 
    if (deleteError) {
      logSupabaseError("Could not clear old arca_results rows", deleteError, rows);
      return { ok: false, table: "arca_results", error: deleteError };
    }
 
    const { error: insertError } = await supabase.from("arca_results").insert(rows);
 
    if (insertError) {
      logSupabaseError("Could not save arca_results ledger", insertError, rows);
      return { ok: false, table: "arca_results", error: insertError };
    }
 
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
        const result = await saveArcaRaceResultsLedger({ season, race, tracks });
 
        if (!result.ok) return result;
      }
    }
 
    return { ok: true };
  } catch (error) {
    console.error("Full arca_results sync crashed:", error);
    return { ok: false, error };
  }
}
 
/**
 * Writes the aggregated per-driver totals to arca_standings — the table
 * StandingsPage.jsx actually reads from. saveArcaRaceResultsLedger() only
 * writes the race-by-race arca_results ledger and never touched this table,
 * which is why posted results weren't showing up on the standings page.
 *
 * NOTE: this upserts on (season_id, driver_number). If arca_standings doesn't
 * already have a unique constraint on that pair, add one in Supabase, or
 * this will insert duplicate rows on every re-post instead of updating them.
 */
export async function saveArcaStandings({ season, arcaDrivers = [] }) {
  if (!Array.isArray(arcaDrivers) || arcaDrivers.length === 0) {
    return { ok: true, skipped: true };
  }

  // IMPORTANT:
  // arca_standings.id is a UUID in Supabase.
  // arca_standings.season_id is also currently a UUID in Supabase.
  // The app uses local season IDs like "season-1779120609648-pkzdb2",
  // so we DO NOT send id or season_id to Supabase here.
  const rows = arcaDrivers.map((driver, index) => ({
    season_name: season?.name || "Season",
    driver_number: String(driver.number || driver.driver_number || driver.car_number || ""),
    car_number: String(driver.number || driver.driver_number || driver.car_number || ""),
    driver_name: driver.name || driver.driver_name || "",
    team: driver.team || "",
    manufacturer: driver.manufacturer || "",
    points: Number(driver.points || 0),
    wins: Number(driver.wins || 0),
    top3: Number(driver.top3 || 0),
    top5: Number(driver.top5 || 0),
    top10: Number(driver.top10 || 0),
    dnfs: Number(driver.dnfs || 0),
    starts: Number(driver.starts || 0),
    stage_wins: Number(driver.stage_wins || driver.stageWins || 0),
    playoff_points: Number(driver.playoff_points || driver.playoffPoints || 0),
    position: Number(driver.position || index + 1),
    updated_at: new Date().toISOString(),
  }));

  try {
    // Replace the current ARCA standings snapshot instead of upserting against
    // season_id. This avoids UUID errors from local season IDs.
    const { error: deleteError } = await supabase
      .from("arca_standings")
      .delete()
      .neq("driver_number", "__never_match__");

    if (deleteError) {
      logSupabaseError("Could not clear old arca_standings", deleteError, rows);
      return { ok: false, table: "arca_standings", error: deleteError };
    }

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
 













































