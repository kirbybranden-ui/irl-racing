import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";

/**
 * Downloads race history as a CSV file.
 */
export function downloadRaceHistoryCsv(raceHistory = [], seasonName = "") {
  if (!Array.isArray(raceHistory) || raceHistory.length === 0) {
    alert("No race history to download yet.");
    return;
  }

  const headers = Object.keys(raceHistory[0]);
  const rows = raceHistory.map(row =>
    headers.map(h => JSON.stringify(row[h] ?? "")).join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = `${seasonName || "race-history"}.csv`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Creates a timestamped backup filename.
 */
export function createBackupFilename(prefix = "league-backup") {
  return `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
}

/**
 * Downloads arbitrary JSON data as a backup.
 */
export function downloadJsonBackup(data, prefix = "league-backup") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.href = url;
  link.download = createBackupFilename(prefix);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export { supabase, getTeamFullName };
