import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";

function downloadTextFile(filename, contents, mimeType = "text/plain;charset=utf-8;") {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function safeSlug(value = "file") {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "file";
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function createBackupFilename(prefix = "league-backup", extension = "json") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeSlug(prefix)}-${timestamp}.${extension}`;
}

export function downloadJsonBackup(filename, data) {
  downloadTextFile(
    filename || createBackupFilename("league-backup", "json"),
    JSON.stringify(data ?? {}, null, 2),
    "application/json;charset=utf-8;"
  );
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
      Race: race.raceName || race.name || "",
      StageCount: race.stageCount ?? "",
      Finish: result.finishPos ?? result.finish ?? "",
      CarNumber: result.number ?? result.carNumber ?? "",
      Driver: result.name || result.driverName || result.driver || "",
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
      TotalRacePoints: result.totalRacePoints ?? result.points ?? 0,
    }));
  });

  if (rows.length === 0) {
    alert("Race history exists, but there are no driver results to download.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");

  const dateStamp = new Date().toISOString().slice(0, 10);
  downloadTextFile(
    `budweiser-cup-race-history-${safeSlug(seasonName || "season")}-${dateStamp}.csv`,
    csv,
    "text/csv;charset=utf-8;"
  );
}

export function makeLeagueBackupPayload({
  tracks = [],
  seasons = [],
  activeSeasonId = "",
  reason = "manual-backup",
  raceSnapshot = null,
} = {}) {
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
  downloadJsonBackup(
    `budweiser-cup-results-${safeSlug(label)}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    backupPayload
  );
}

export function isValidLeagueBackup(backup) {
  return !!backup && Array.isArray(backup.seasons) && backup.seasons.length > 0 && !!backup.activeSeasonId;
}

export async function createRaceDataBackup({
  seasonSnapshot,
  raceSnapshot,
  backupType = "save-points",
} = {}) {
  try {
    const { error } = await supabase.from("race_data_backups").insert({
      backup_type: backupType,
      season_id: seasonSnapshot?.id || null,
      season_name: seasonSnapshot?.name || "Season",
      race_name: raceSnapshot?.raceName || raceSnapshot?.name || seasonSnapshot?.selectedRace || "Race",
      snapshot: seasonSnapshot || null,
      race_snapshot: raceSnapshot || null,
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

function normalizeRaceResultRow(result = {}, race = {}, season = {}) {
  return {
    season_id: season?.id || race?.seasonId || null,
    season_name: season?.name || race?.seasonName || "Season",
    race_name: race?.raceName || race?.name || season?.selectedRace || "Race",
    race_date: race?.raceDate || race?.date || null,
    finish_pos: result?.finishPos ?? result?.finish ?? null,
    car_number: String(result?.number ?? result?.carNumber ?? ""),
    driver_name: result?.name || result?.driverName || result?.driver || "",
    team: result?.team || "",
    manufacturer: result?.manufacturer || "",
    finish_points: result?.finishPoints ?? 0,
    stage1_points: result?.stage1Points ?? 0,
    stage2_points: result?.stage2Points ?? 0,
    stage3_points: result?.stage3Points ?? 0,
    penalty_points: result?.penaltyPoints ?? 0,
    total_race_points: result?.totalRacePoints ?? result?.points ?? 0,
    fastest_lap: !!result?.fastestLap,
    dnf: !!result?.dnf,
    start_park: !!result?.startPark,
    dnf_reason: result?.dnfReason || null,
    offense: !!result?.offense,
    offense_number: result?.offenseNumber ?? null,
    created_at: new Date().toISOString(),
  };
}

function normalizeArcaRaceResultRow(result = {}, race = {}, season = {}) {
  const base = normalizeRaceResultRow(result, race, season);
  return {
    ...base,
    series: "ARCA",
  };
}

export function makeRaceResultsLedgerRows(race = {}, season = {}) {
  const results = Array.isArray(race?.results) ? race.results : [];
  return results.map((result) => normalizeRaceResultRow(result, race, season));
}

export async function saveRaceResultsLedger(rows = []) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (validRows.length === 0) return { ok: true, data: [] };

  try {
    const { data, error } = await supabase.from("race_results_ledger").insert(validRows).select();
    if (error) {
      console.error("Could not save race_results_ledger:", error);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (error) {
    console.error("Could not save race_results_ledger:", error);
    return { ok: false, error };
  }
}

export async function syncAllRaceResultsLedger(raceHistory = [], season = {}) {
  const rows = (Array.isArray(raceHistory) ? raceHistory : []).flatMap((race) =>
    makeRaceResultsLedgerRows(race, season)
  );
  return saveRaceResultsLedger(rows);
}

export function makeArcaRaceResultsLedgerRows(race = {}, season = {}) {
  const results = Array.isArray(race?.results) ? race.results : [];
  return results.map((result) => normalizeArcaRaceResultRow(result, race, season));
}

export async function saveArcaRaceResultsLedger(rows = []) {
  const validRows = Array.isArray(rows) ? rows : [];
  if (validRows.length === 0) return { ok: true, data: [] };

  try {
    const { data, error } = await supabase.from("arca_results").insert(validRows).select();
    if (error) {
      console.error("Could not save arca_results:", error);
      return { ok: false, error };
    }
    return { ok: true, data };
  } catch (error) {
    console.error("Could not save arca_results:", error);
    return { ok: false, error };
  }
}

export async function syncAllArcaRaceResultsLedger(raceHistory = [], season = {}) {
  const rows = (Array.isArray(raceHistory) ? raceHistory : []).flatMap((race) =>
    makeArcaRaceResultsLedgerRows(race, season)
  );
  return saveArcaRaceResultsLedger(rows);
}
