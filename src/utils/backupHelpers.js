import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";

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
      race_date: raceDate,
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
