import React, { useState, useEffect } from "react";

export default function ArcaRaceResultsForm({
  race,
  drivers,
  onSave,
  onCancel,
  primaryButtonStyle,
  dangerButtonStyle,
  inputStyle,
  dnfReasons,
}) {
  const [results, setResults] = useState([]);
  const [savingResults, setSavingResults] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultError, setResultError] = useState("");

  useEffect(() => {
    if (drivers && drivers.length > 0) {
      const initialized = drivers.map((driver) => ({
        driver_number: driver.number,
        driver_name: driver.name,
        team: driver.team,
        position: null,
        status: "running",
        dnf_reason: "",
        fastest_lap: false,
        penalties: 0,
        notes: "",
      }));
      setResults(initialized);
    }
  }, [drivers]);

  function updateResult(driverNumber, field, value) {
    setResults((prev) =>
      prev.map((r) =>
        r.driver_number === driverNumber ? { ...r, [field]: value } : r
      )
    );
  }

  async function saveResults() {
    if (!race || !race.id) {
      setResultError("No race selected.");
      return;
    }

    setSavingResults(true);
    setResultError("");
    setResultMessage("");

    const finishedResults = results
      .filter((r) => r.position || r.status === "dnf")
      .sort((a, b) => {
        if (a.status === "dnf") return 1;
        if (b.status === "dnf") return -1;
        return (a.position || 999) - (b.position || 999);
      });

    if (finishedResults.length === 0) {
      setResultError("Enter at least one result.");
      setSavingResults(false);
      return;
    }

    try {
      await onSave({
        race_id: race.id,
        results: finishedResults,
      });
      setResultMessage(`✓ Saved ${finishedResults.length} results for ${race.name}`);
      setTimeout(() => onCancel(), 1500);
    } catch (err) {
      setResultError(err.message || "Could not save results.");
    } finally {
      setSavingResults(false);
    }
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>
        {race?.name || "Race"} - Enter Results
      </h3>

      <div style={{ background: "rgba(0,210,211,0.1)", border: "1px solid rgba(0,210,211,0.3)", borderRadius: 12, padding: 12, marginBottom: 20, fontSize: 13 }}>
        Enter finishing position for each driver. Leave blank if DNF. Mark fastest lap drivers.
      </div>

      <div style={{ overflowX: "auto", marginBottom: 20 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(255,255,255,0.2)" }}>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>#</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Driver</th>
              <th style={{ textAlign: "left", padding: 12, fontWeight: 900 }}>Team</th>
              <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Position</th>
              <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Status</th>
              <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>DNF Reason</th>
              <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Fastest Lap</th>
              <th style={{ textAlign: "center", padding: 12, fontWeight: 900 }}>Penalties</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.driver_number} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <td style={{ padding: 12, fontWeight: 900 }}>#{result.driver_number}</td>
                <td style={{ padding: 12 }}>{result.driver_name}</td>
                <td style={{ padding: 12, opacity: 0.8 }}>{result.team || "—"}</td>

                <td style={{ padding: 12, textAlign: "center" }}>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={result.position || ""}
                    onChange={(e) =>
                      updateResult(result.driver_number, "position", e.target.value ? parseInt(e.target.value) : null)
                    }
                    disabled={result.status === "dnf"}
                    placeholder="—"
                    style={{
                      ...inputStyle,
                      width: 60,
                      textAlign: "center",
                      opacity: result.status === "dnf" ? 0.5 : 1,
                    }}
                  />
                </td>

                <td style={{ padding: 12, textAlign: "center" }}>
                  <select
                    value={result.status}
                    onChange={(e) => updateResult(result.driver_number, "status", e.target.value)}
                    style={{ ...inputStyle, width: 100 }}
                  >
                    <option value="running">Finished</option>
                    <option value="dnf">DNF</option>
                  </select>
                </td>

                <td style={{ padding: 12, textAlign: "center" }}>
                  {result.status === "dnf" && (
                    <select
                      value={result.dnf_reason}
                      onChange={(e) => updateResult(result.driver_number, "dnf_reason", e.target.value)}
                      style={{ ...inputStyle, width: 140 }}
                    >
                      <option value="">Select reason</option>
                      {(dnfReasons || []).map((reason) => (
                        <option key={reason} value={reason}>
                          {reason}
                        </option>
                      ))}
                    </select>
                  )}
                </td>

                <td style={{ padding: 12, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={result.fastest_lap}
                    onChange={(e) => updateResult(result.driver_number, "fastest_lap", e.target.checked)}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                </td>

                <td style={{ padding: 12, textAlign: "center" }}>
                  <input
                    type="number"
                    min="0"
                    value={result.penalties || 0}
                    onChange={(e) => updateResult(result.driver_number, "penalties", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    style={{
                      ...inputStyle,
                      width: 60,
                      textAlign: "center",
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resultMessage && (
        <div style={{ marginBottom: 16, color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, padding: 12, fontWeight: 900 }}>
          {resultMessage}
        </div>
      )}
      {resultError && (
        <div style={{ marginBottom: 16, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: 12, fontWeight: 900 }}>
          {resultError}
        </div>
      )}

      <div style={{ display: "flex", gap: 12 }}>
        <button
          type="button"
          onClick={saveResults}
          disabled={savingResults}
          style={{
            ...primaryButtonStyle,
            opacity: savingResults ? 0.6 : 1,
            cursor: savingResults ? "not-allowed" : "pointer",
          }}
        >
          {savingResults ? "Saving..." : "Save Results"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ ...dangerButtonStyle }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
