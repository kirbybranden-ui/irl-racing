import React from "react";

/**
 * Race Operations remains part of the Admin Portal user experience,
 * but its large UI is isolated here so AdminPortal.jsx stays manageable.
 */
export default function RaceOperations({
  activeDrivers,
  activeSeason,
  addTrack,
  adminDangerButtonStyle,
  adminInputStyle,
  adminPrimaryButtonStyle,
  adminReadableCardStyle,
  adminSecondaryButtonStyle,
  adminTableStyle,
  adminTdStyle,
  adminThStyle,
  clearInputs,
  deleteResultsDraft,
  dnfMap,
  dnfReasons,
  downloadRaceHistoryCsv,
  editingRaceName,
  fastestLapMap,
  financeOverlayStyle,
  financeShellStyle,
  getOffensePenaltyPoints,
  getStagePoints,
  getTeamFullName,
  handleDeleteRace,
  handleDnfChange,
  handleEditRace,
  handleFastestLapChange,
  handleManualPenaltyChange,
  handleOffenseChange,
  handlePositionChange,
  handleResultNoteChange,
  handleStage1Change,
  handleStage2Change,
  handleStage3Change,
  handleStartParkChange,
  inputStyle,
  isAdminMobile,
  loadResultsDraft,
  moveDriverFinishPosition,
  newTrackName,
  newTrackStageCount,
  offenseLog,
  offenseMap,
  patchActiveSeason,
  penaltyMap,
  pointsTable,
  positions,
  postResultsDraft,
  raceDrafts,
  raceHistory,
  raceNotesInputStyle,
  raceOperationsTab,
  racePenaltyInputStyle,
  racePositionInputStyle,
  removeTrack,
  resetSeason,
  restoreDefaultTracks,
  resultNotesMap,
  saveResultsDraft,
  seasonOffenseCounts,
  seasons,
  secondaryButtonStyle,
  selectedRace,
  setDnfReasons,
  setNewTrackName,
  setNewTrackStageCount,
  setRaceOperationsOpen,
  setRaceOperationsTab,
  stage1,
  stage2,
  stage3,
  stageCount,
  startParkMap,
  submitResults,
  tdStyle,
  tracks,
  updateTrackStageCount,
}) {
  return (
    <div style={financeOverlayStyle}>
      <div style={financeShellStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", color: "#6b7280" }}>Admin Menu</div>
            <h1 style={{ margin: "2px 0 0", fontSize: isAdminMobile ? 34 : 42, letterSpacing: -1.6 }}>Race Operations</h1>
            <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 750 }}>Track management, race input, drafts, race history, backups, and offense tracking now live here.</p>
          </div>
          <button type="button" onClick={() => setRaceOperationsOpen(false)} style={{ border: 0, borderRadius: 999, background: "#ffffff", color: "#111827", width: 46, height: 46, fontSize: 23, fontWeight: 1000, cursor: "pointer", boxShadow: "0 8px 20px rgba(15,23,42,0.12)" }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, minmax(180px, 1fr))", gap: 14, marginBottom: 18 }}>
          {[
            ["tracks", "Track Management", "🏁", `${(tracks || []).length} Tracks`, "Schedule + stages", "Update schedule tracks and stage counts.", "linear-gradient(135deg, #34c759 0%, #30d158 45%, #0a7f3f 100%)"],
            ["input", "Race Input", "🏎️", selectedRace ? "Active" : "Ready", selectedRace || "Select a race", "Enter finishes, stages, penalties, DNFs, and fastest lap.", "linear-gradient(135deg, #007aff 0%, #5ac8fa 45%, #5856d6 100%)"],
            ["history", "Previous Race Results", "📚", `${raceHistory.length} Races`, "Season archive", "Open the race archive and download single races or the season.", "linear-gradient(135deg, #ff9500 0%, #ffcc00 48%, #ff3b30 100%)"],
            ["drafts", "Saved Drafts", "📄", `${(raceDrafts || []).length} Draft${(raceDrafts || []).length === 1 ? "" : "s"}`, "Private race control", "Resume, post, or delete admin-only race drafts.", "linear-gradient(135deg, #af52de 0%, #ff2d55 52%, #5856d6 100%)"],
            ["offenses", "Offense Log", "⚠️", `${offenseLog.length} Open`, "Season discipline", "Review season offense penalties.", "linear-gradient(135deg, #ff3b30 0%, #ff2d55 50%, #8e8e93 100%)"],
            ["voting", "Voting", "🗳️", "Admin", "League votes", "Create and review league votes from Race Operations.", "linear-gradient(135deg, #5856d6 0%, #007aff 48%, #32ade6 100%)"],
          ].map(([key, label, icon, value, meta, description, gradient]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRaceOperationsTab(key)}
              style={{
                padding: 18,
                minHeight: 156,
                textAlign: "left",
                cursor: "pointer",
                borderRadius: 30,
                border: raceOperationsTab === key ? "2px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.38)",
                background: gradient,
                color: "#ffffff",
                boxShadow: raceOperationsTab === key ? "0 22px 46px rgba(15,23,42,0.28)" : "0 16px 34px rgba(15,23,42,0.18)",
                transform: raceOperationsTab === key ? "translateY(-2px)" : "translateY(0)",
                transition: "transform 160ms ease, box-shadow 160ms ease, border 160ms ease",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top right, rgba(255,255,255,0.38), transparent 36%)", pointerEvents: "none" }} />
              <div style={{ position: "relative", zIndex: 1, minHeight: 118, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, textTransform: "uppercase", color: "rgba(255,255,255,0.82)" }}>{label}</div>
                  <div style={{ width: 36, height: 36, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)" }}>{icon}</div>
                </div>
                <div style={{ fontSize: 30, fontWeight: 1000, letterSpacing: -1, marginTop: 12, color: "#ffffff" }}>{value}</div>
                <div style={{ marginTop: 2, color: "rgba(255,255,255,0.76)", fontSize: 12, fontWeight: 1000 }}>{meta}</div>
                <div style={{ marginTop: "auto", paddingTop: 10, color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{description}</div>
              </div>
            </button>
          ))}
        </div>

        {raceOperationsTab === "overview" && (
          <div style={adminReadableCardStyle}>
            <h2 style={{ marginTop: 0 }}>Race Operations Hub</h2>
            <div style={{ opacity: 0.78 }}>Choose a tile above. Track Management, Race Input, Voting, and Previous Race Results are tucked away until you need them, keeping this page focused for race night.</div>
          </div>
        )}

        {raceOperationsTab === "voting" && (
          <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 26, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.75)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#5856d6" }}>Race Operations</div>
                <h2 style={{ margin: "3px 0 6px", fontSize: isAdminMobile ? 30 : 38, letterSpacing: -1.35 }}>Voting</h2>
                <div style={{ color: "#6b7280", fontWeight: 750, maxWidth: 720 }}>Create, review, and manage league votes from Race Operations instead of keeping voting in the main admin menu.</div>
              </div>
              <div style={{ width: 58, height: 58, borderRadius: 20, background: "linear-gradient(135deg, #5856d6, #32ade6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "0 14px 28px rgba(88,86,214,0.24)" }}>🗳️</div>
            </div>
            <div style={{ marginTop: 18, borderRadius: 28, padding: 18, background: "linear-gradient(135deg, rgba(88,86,214,0.12), rgba(255,255,255,0.92))", border: "1px solid rgba(88,86,214,0.18)", boxShadow: "0 14px 35px rgba(15,23,42,0.08)" }}>
              <h3 style={{ margin: 0, fontSize: 24, letterSpacing: -0.5 }}>League Vote Manager</h3>
              <p style={{ margin: "8px 0 16px", color: "#6b7280", fontWeight: 800, lineHeight: 1.45 }}>Voting stays under race control so paint schemes, league votes, and race-week polls do not clutter the admin menu.</p>
              <button type="button" onClick={() => (window.location.pathname = "/admin/votes")} style={{ ...adminPrimaryButtonStyle, borderRadius: 18 }}>Open Voting Manager</button>
            </div>
          </div>
        )}

            {/* Track Management */}
            {raceOperationsTab === "tracks" && <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 26, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.75)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#34c759" }}>Race Operations</div>
        <h2 style={{ margin: "3px 0 6px", fontSize: isAdminMobile ? 30 : 38, letterSpacing: -1.35 }}>Track Management</h2>
        <div style={{ color: "#6b7280", fontWeight: 750, maxWidth: 720 }}>Update the race schedule only when needed. Stage counts feed race input and scoring setup.</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(52,199,89,0.12)", color: "#166534", fontWeight: 1000, fontSize: 13 }}>{tracks.length} Tracks</div>
        <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(0,122,255,0.10)", color: "#1d4ed8", fontWeight: 1000, fontSize: 13 }}>{tracks.filter((t) => Number(t.stageCount) === 3).length} 3-Stage</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "minmax(280px, 0.85fr) minmax(420px, 1.45fr)", gap: 16, alignItems: "start" }}>
      <div style={{ borderRadius: 30, padding: 18, background: "linear-gradient(135deg, rgba(52,199,89,0.16), rgba(255,255,255,0.92))", border: "1px solid rgba(52,199,89,0.22)", boxShadow: "0 14px 35px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 13, fontWeight: 1000, color: "#166534", letterSpacing: 0.4 }}>Add Track</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Track Name</div>
          <input style={{ ...adminInputStyle, borderRadius: 18, background: "rgba(255,255,255,0.88)" }} value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Example: Bristol Night Race" />
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Stage Count</div>
          <select style={{ ...adminInputStyle, borderRadius: 18, background: "rgba(255,255,255,0.88)" }} value={newTrackStageCount} onChange={(e) => setNewTrackStageCount(Number(e.target.value))}>
            <option value={1}>1 stage</option>
            <option value={2}>2 stages</option>
            <option value={3}>3 stages</option>
          </select>
        </div>
        <button onClick={addTrack} style={{ ...adminPrimaryButtonStyle, width: "100%", marginTop: 14, borderRadius: 18 }}>Add Track</button>
        <button onClick={restoreDefaultTracks} style={{ ...adminSecondaryButtonStyle, width: "100%", marginTop: 10, borderRadius: 18 }}>Restore Default Schedule</button>
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12, fontWeight: 750, lineHeight: 1.35 }}>Tip: keep this tucked away unless the league schedule or stage format changes.</div>
      </div>

      <div style={{ borderRadius: 30, overflow: "hidden", background: "rgba(255,255,255,0.86)", border: "1px solid rgba(229,231,235,0.95)", boxShadow: "0 14px 35px rgba(15,23,42,0.07)" }}>
        <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1.2fr 0.6fr 0.7fr 0.7fr", gap: 10, padding: "12px 16px", background: "rgba(243,244,246,0.72)", color: "#6b7280", fontSize: 12, fontWeight: 1000, letterSpacing: 0.8, textTransform: "uppercase" }}>
          <div>Track</div>
          {!isAdminMobile && <div>Stages</div>}
          {!isAdminMobile && <div>History</div>}
          {!isAdminMobile && <div style={{ textAlign: "right" }}>Action</div>}
        </div>

        <div style={{ display: "grid" }}>
          {tracks.length === 0 ? (
            <div style={{ padding: 18, color: "#6b7280", fontWeight: 750 }}>No tracks defined. Add one on the left or restore the default schedule.</div>
          ) : tracks.map((t) => {
            const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === t.name));
            return (
              <div key={t.name} style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1.2fr 0.6fr 0.7fr 0.7fr", gap: 10, alignItems: "center", padding: "14px 16px", borderTop: "1px solid rgba(229,231,235,0.75)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 16, background: "linear-gradient(135deg, #34c759, #30d158)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, boxShadow: "0 10px 20px rgba(52,199,89,0.24)" }}>🏁</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 1000, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
                    {isAdminMobile && <div style={{ marginTop: 5, color: "#6b7280", fontSize: 12, fontWeight: 800 }}>{t.stageCount} stage{Number(t.stageCount) === 1 ? "" : "s"} • {usedInHistory ? "Used in history" : "Not used yet"}</div>}
                  </div>
                </div>

                <div style={{ display: isAdminMobile ? "none" : "block" }}>
                  <select style={{ ...adminInputStyle, maxWidth: 150, borderRadius: 16, padding: "9px 11px" }} value={t.stageCount} onChange={(e) => updateTrackStageCount(t.name, e.target.value)}>
                    <option value={1}>1 stage</option>
                    <option value={2}>2 stages</option>
                    <option value={3}>3 stages</option>
                  </select>
                </div>

                <div style={{ display: isAdminMobile ? "none" : "block" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: usedInHistory ? "rgba(255,149,0,0.14)" : "rgba(142,142,147,0.12)", color: usedInHistory ? "#b45309" : "#6b7280", fontWeight: 1000, fontSize: 12 }}>{usedInHistory ? "Used" : "Unused"}</span>
                </div>

                <div style={{ display: "flex", justifyContent: isAdminMobile ? "flex-start" : "flex-end", gap: 8, flexWrap: "wrap" }}>
                  {isAdminMobile && (
                    <select style={{ ...adminInputStyle, maxWidth: 150, borderRadius: 16, padding: "9px 11px" }} value={t.stageCount} onChange={(e) => updateTrackStageCount(t.name, e.target.value)}>
                      <option value={1}>1 stage</option>
                      <option value={2}>2 stages</option>
                      <option value={3}>3 stages</option>
                    </select>
                  )}
                  <button onClick={() => removeTrack(t.name)} style={{ ...adminDangerButtonStyle, borderRadius: 16, padding: "9px 12px" }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
            </div>}
            {/* Start & Park Requests moved into Human Resources > Start & Park. */}

            {/* Enter Race Results */}
            {raceOperationsTab === "input" && <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 28, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,250,252,0.94))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.78)" }}>
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <h2 style={{ margin: 0, fontSize: isAdminMobile ? 30 : 42, letterSpacing: -1.5, lineHeight: 1 }}>{editingRaceName ? `Edit Race: ${editingRaceName}` : "Race Results"}</h2>
      <div style={{ color: "#6b7280", fontWeight: 750, maxWidth: 760, margin: "10px auto 0", lineHeight: 1.45 }}>Enter official finishing order, stage points, DNFs, penalties, fastest lap, and race-control notes for the selected race.</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: selectedRace ? "rgba(52,199,89,0.14)" : "rgba(142,142,147,0.12)", color: selectedRace ? "#15803d" : "#6b7280", fontWeight: 1000, fontSize: 13 }}>{selectedRace ? "Race Selected" : "Select Race"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(0,122,255,0.12)", color: "#1d4ed8", fontWeight: 1000, fontSize: 13 }}>{activeDrivers.length} Drivers</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(88,86,214,0.12)", color: "#4338ca", fontWeight: 1000, fontSize: 13 }}>{selectedRace ? `${stageCount} Stage${stageCount === 1 ? "" : "s"}` : "Stage Setup"}</span>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "minmax(280px, 0.75fr) minmax(420px, 1.25fr)", gap: 16, alignItems: "stretch", marginBottom: 20 }}>
      <div style={{ borderRadius: 30, padding: 18, background: "linear-gradient(160deg, rgba(0,122,255,0.12), rgba(90,200,250,0.10))", border: "1px solid rgba(0,122,255,0.16)", boxShadow: "0 14px 34px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.1, textTransform: "uppercase", color: "#1d4ed8", marginBottom: 10 }}>Current Race</div>
        <select style={{ ...adminInputStyle, borderRadius: 18, minHeight: 46, background: "rgba(255,255,255,0.88)", fontWeight: 850 }} value={selectedRace} onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}>
          <option value="">Select a race</option>
          {tracks.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
        </select>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <span style={{ padding: "8px 11px", borderRadius: 999, background: "rgba(255,255,255,0.78)", color: "#111827", fontWeight: 950, fontSize: 12 }}>{selectedRace || "No race selected"}</span>
          <span style={{ padding: "8px 11px", borderRadius: 999, background: "rgba(255,255,255,0.78)", color: "#111827", fontWeight: 950, fontSize: 12 }}>{selectedRace ? `${stageCount} scoring stage${stageCount === 1 ? "" : "s"}` : "Stage count pending"}</span>
        </div>
      </div>

      <div style={{ borderRadius: 30, padding: 18, background: "rgba(255,255,255,0.82)", border: "1px solid rgba(226,232,240,0.9)", boxShadow: "0 14px 34px rgba(15,23,42,0.07)" }}>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.1, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>Race Control</div>
        <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, 1fr)", gap: 10 }}>
          <button onClick={saveResultsDraft} style={{ ...adminSecondaryButtonStyle, borderRadius: 18, minHeight: 48 }}>Save Draft</button>
          <button onClick={() => submitResults()} style={{ ...adminPrimaryButtonStyle, borderRadius: 18, minHeight: 48 }}>{editingRaceName ? "Update Posted Race" : "Post Official Results"}</button>
          <button onClick={clearInputs} style={{ ...adminSecondaryButtonStyle, borderRadius: 18, minHeight: 48 }}>{editingRaceName ? "Cancel / Clear" : "Clear Inputs"}</button>
        </div>
        <div style={{ marginTop: 12, color: "#6b7280", fontWeight: 700, fontSize: 13 }}>Use each driver card for finish position and stage points. Open More for DNFs, penalties, notes, and offense tracking.</div>
      </div>
    </div>

    <div style={{ display: "grid", gap: 12 }}>
      {activeDrivers.map((driver) => {
        const prior = seasonOffenseCounts[driver.id] || 0;
        const thisOffense = offenseMap[driver.id] ? prior + 1 : null;
        const fp = positions[driver.id] ? pointsTable[(Number(positions[driver.id]) || 1) - 1] || 0 : 0;
        const sp = startParkMap[driver.id] ? 0 : getStagePoints(stage1[driver.id]) + getStagePoints(stage2[driver.id]) + (stageCount === 3 ? getStagePoints(stage3[driver.id]) : 0);
        const fl = fastestLapMap[driver.id] ? 1 : 0;
        const op = thisOffense ? getOffensePenaltyPoints(thisOffense) : 0;
        const mp = Number(penaltyMap[driver.id] || 0);
        const previewPoints = fp + sp + fl - op - mp;
        return (
          <details key={driver.id} style={{ borderRadius: 26, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(226,232,240,0.92)", boxShadow: "0 12px 28px rgba(15,23,42,0.06)", overflow: "hidden" }}>
            <summary style={{ listStyle: "none", cursor: "pointer", padding: isAdminMobile ? 14 : 16, display: "grid", gridTemplateColumns: isAdminMobile ? "52px 1fr" : "58px 1.1fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(145deg, #374151, #111827)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 14, color: "#fff", border: "2px solid #d4af37", boxShadow: "0 8px 18px rgba(17,24,39,0.18)" }}>{driver.number}</div>
              <div>
                <div style={{ fontWeight: 1000, color: "#111827", letterSpacing: -0.2 }}>{driver.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 800 }}>{getTeamFullName(driver.team)} <span style={{ opacity: 0.62 }}>({driver.team})</span></div>
              </div>
              <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#6b7280", fontWeight: 900 }} onClick={(e) => e.stopPropagation()}>Finish
                <input type="number" min="1" max="40" style={{ ...racePositionInputStyle, borderRadius: 16, background: "#f8fafc", minHeight: 42 }} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} />
              </label>
              {stageCount >= 1 && <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#6b7280", fontWeight: 900 }} onClick={(e) => e.stopPropagation()}>Stage 1
                <input type="number" min="1" max="10" style={{ ...racePositionInputStyle, borderRadius: 16, background: "#f8fafc", minHeight: 42 }} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} />
              </label>}
              {stageCount >= 2 && <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#6b7280", fontWeight: 900 }} onClick={(e) => e.stopPropagation()}>Stage 2
                <input type="number" min="1" max="10" style={{ ...racePositionInputStyle, borderRadius: 16, background: "#f8fafc", minHeight: 42 }} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} />
              </label>}
              {stageCount === 3 && <label style={{ display: "grid", gap: 5, fontSize: 12, color: "#6b7280", fontWeight: 900 }} onClick={(e) => e.stopPropagation()}>Stage 3
                <input type="number" min="1" max="10" style={{ ...racePositionInputStyle, borderRadius: 16, background: "#f8fafc", minHeight: 42 }} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} />
              </label>}
              <div style={{ display: "flex", justifyContent: isAdminMobile ? "flex-start" : "flex-end", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "8px 11px", borderRadius: 999, background: "rgba(52,199,89,0.12)", color: "#15803d", fontWeight: 1000, fontSize: 12 }}>{previewPoints} pts</span>
                <span style={{ padding: "8px 11px", borderRadius: 999, background: "rgba(142,142,147,0.12)", color: "#6b7280", fontWeight: 1000, fontSize: 12 }}>More</span>
              </div>
            </summary>

            <div style={{ borderTop: "1px solid rgba(226,232,240,0.9)", padding: isAdminMobile ? 14 : 16, background: "linear-gradient(180deg, rgba(248,250,252,0.96), rgba(255,255,255,0.96))" }}>
              <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(4, minmax(180px, 1fr))", gap: 12 }}>
                <div style={{ borderRadius: 20, padding: 13, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.9)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}><input type="checkbox" checked={!!dnfMap[driver.id]} onChange={(e) => handleDnfChange(driver.id, e.target.checked)} />DNF</label>
                  {dnfMap[driver.id] && (
                    <select style={{ ...inputStyle, fontSize: 12, padding: "8px 10px", borderRadius: 14, marginTop: 10 }} value={dnfReasons[driver.id] || ""} onChange={(e) => setDnfReasons({ ...dnfReasons, [driver.id]: e.target.value })}>
                      <option value="">Select reason...</option>
                      <option value="Mechanical">Mechanical Failure</option>
                      <option value="Crash">Crash/Incident</option>
                      <option value="Engine">Engine Failure</option>
                      <option value="Transmission">Transmission Issue</option>
                      <option value="Fuel">Fuel System</option>
                      <option value="Suspension">Suspension Damage</option>
                      <option value="Pit Stop">Pit Stop Error</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div style={{ borderRadius: 20, padding: 13, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.9)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}><input type="checkbox" checked={!!startParkMap[driver.id]} onChange={(e) => handleStartParkChange(driver.id, e.target.checked)} />Start & Park</label>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700, marginTop: 8 }}>Finish points only; stage points zeroed.</div>
                </div>
                <div style={{ borderRadius: 20, padding: 13, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.9)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}><input type="radio" name="fastestLap" checked={!!fastestLapMap[driver.id]} onChange={() => handleFastestLapChange(driver.id)} />Fastest Lap +1</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900, marginTop: 10 }}><input type="checkbox" checked={!!offenseMap[driver.id]} onChange={(e) => handleOffenseChange(driver.id, e.target.checked)} />Offense</label>
                  <div style={{ fontSize: 12, color: thisOffense ? "#dc2626" : "#6b7280", fontWeight: 800, marginTop: 8 }}>{thisOffense ? `Offense #${thisOffense} (-${getOffensePenaltyPoints(thisOffense)} pts)` : prior > 0 ? `${prior} prior offense(s)` : "No prior offenses"}</div>
                </div>
                <div style={{ borderRadius: 20, padding: 13, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(226,232,240,0.9)" }}>
                  <label style={{ display: "grid", gap: 7, fontSize: 12, color: "#6b7280", fontWeight: 900 }}>Manual Penalty
                    <input type="number" min="0" style={{ ...racePenaltyInputStyle, borderRadius: 14, background: "#f8fafc" }} value={penaltyMap[driver.id] || ""} onChange={(e) => handleManualPenaltyChange(driver.id, e.target.value)} placeholder="0" />
                  </label>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1fr auto", gap: 12, marginTop: 12, alignItems: "center" }}>
                <input style={{ ...raceNotesInputStyle, borderRadius: 18, background: "#f8fafc", minHeight: 46 }} value={resultNotesMap[driver.id] || ""} onChange={(e) => handleResultNoteChange(driver.id, e.target.value)} placeholder="Race-control notes, penalty ruling, incident detail..." />
                <div style={{ display: "flex", gap: 8, justifyContent: isAdminMobile ? "flex-start" : "flex-end" }}>
                  <button type="button" onClick={() => moveDriverFinishPosition(driver.id, -1)} style={{ ...secondaryButtonStyle, borderRadius: 14, padding: "9px 12px" }}>Move Up</button>
                  <button type="button" onClick={() => moveDriverFinishPosition(driver.id, 1)} style={{ ...secondaryButtonStyle, borderRadius: 14, padding: "9px 12px" }}>Move Down</button>
                </div>
              </div>
            </div>
          </details>
        );
      })}
    </div>

    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
      <button onClick={saveResultsDraft} style={{ ...adminSecondaryButtonStyle, borderRadius: 18 }}>Save Admin-Only Draft</button>
      <button onClick={() => submitResults()} style={{ ...adminPrimaryButtonStyle, borderRadius: 18 }}>{editingRaceName ? "Update Posted Race" : "Post to Standings"}</button>
      {editingRaceName && <button onClick={clearInputs} style={{ ...adminSecondaryButtonStyle, borderRadius: 18 }}>Cancel Edit</button>}
      <button onClick={clearInputs} style={{ ...adminSecondaryButtonStyle, borderRadius: 18 }}>Clear Inputs</button>
      <button onClick={resetSeason} style={{ ...adminDangerButtonStyle, borderRadius: 18 }}>Archive + Reset Active Season</button>
    </div>
            </div>}
            {/* Admin-Only Results Drafts */}
            {raceOperationsTab === "drafts" && <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 26, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.75)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#af52de" }}>Race Control</div>
        <h2 style={{ margin: "2px 0 0", fontSize: isAdminMobile ? 30 : 38, letterSpacing: -1.2 }}>Saved Drafts</h2>
        <p style={{ margin: "8px 0 0", color: "#6b7280", fontWeight: 800, maxWidth: 720 }}>Private scoring notes for unfinished races. Resume a draft, post official results, or remove old race-control work.</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(175,82,222,0.12)", color: "#7e22ce", fontWeight: 1000, fontSize: 13 }}>{(raceDrafts || []).length} Draft{(raceDrafts || []).length === 1 ? "" : "s"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(0,122,255,0.10)", color: "#1d4ed8", fontWeight: 1000, fontSize: 13 }}>Admin Only</span>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "minmax(280px, 0.85fr) minmax(420px, 1.45fr)", gap: 16, alignItems: "start" }}>
      <div style={{ borderRadius: 30, padding: 18, background: "linear-gradient(135deg, rgba(175,82,222,0.16), rgba(255,255,255,0.92))", border: "1px solid rgba(175,82,222,0.22)", boxShadow: "0 14px 35px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 13, fontWeight: 1000, color: "#7e22ce", letterSpacing: 0.4 }}>Draft Queue</div>
        <div style={{ width: 58, height: 58, borderRadius: 20, background: "linear-gradient(135deg, #af52de, #5856d6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 24, margin: "16px 0 14px", boxShadow: "0 14px 26px rgba(88,86,214,0.25)" }}>📄</div>
        <h3 style={{ margin: 0, fontSize: 22, letterSpacing: -0.5 }}>Race Notes</h3>
        <p style={{ margin: "8px 0 0", color: "#6b7280", fontWeight: 800, lineHeight: 1.45 }}>Drafts do not touch standings until they are posted as official results.</p>
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,0.74)", border: "1px solid rgba(255,255,255,0.82)" }}><span style={{ color: "#6b7280", fontWeight: 900 }}>Saved Drafts</span><b>{(raceDrafts || []).length}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,0.74)", border: "1px solid rgba(255,255,255,0.82)" }}><span style={{ color: "#6b7280", fontWeight: 900 }}>Visibility</span><b>Private</b></div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {(raceDrafts || []).length === 0 ? (
          <div style={{ borderRadius: 30, padding: isAdminMobile ? 20 : 26, background: "rgba(255,255,255,0.86)", border: "1px solid rgba(229,231,235,0.92)", boxShadow: "0 14px 34px rgba(15,23,42,0.08)", color: "#4b5563", fontWeight: 850 }}>
            <div style={{ width: 48, height: 48, borderRadius: 18, background: "rgba(175,82,222,0.12)", color: "#7e22ce", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>📄</div>
            <div style={{ fontWeight: 1000, color: "#111827", fontSize: 20 }}>No private drafts saved</div>
            <div style={{ marginTop: 6 }}>Use <b>Save Admin-Only Draft</b> from Race Input when you need to pause scoring before posting official results.</div>
          </div>
        ) : (raceDrafts || []).map((draft) => {
          const draftResults = draft.results || [];
          const leader = draftResults.find((result) => Number(result.finishPos) === 1) || draftResults[0];
          const completedDrivers = draftResults.filter((result) => result.finishPos !== "" && result.finishPos !== null && result.finishPos !== undefined).length;
          const readyToPost = draftResults.length > 0 && completedDrivers === draftResults.length;
          return (
            <div key={draft.id || draft.raceName} style={{ borderRadius: 30, padding: isAdminMobile ? 18 : 20, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(229,231,235,0.92)", boxShadow: "0 14px 34px rgba(15,23,42,0.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 14, minWidth: 0, alignItems: "center" }}>
                  <div style={{ width: 54, height: 54, borderRadius: 20, background: "linear-gradient(135deg, #af52de, #5856d6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 24, boxShadow: "0 12px 24px rgba(88,86,214,0.24)", flexShrink: 0 }}>📄</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 1000, color: "#111827", fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{draft.raceName || "Race Results Draft"}</div>
                    <div style={{ marginTop: 4, color: "#6b7280", fontWeight: 800, fontSize: 13 }}>{draft.draftSavedAt ? `Saved ${new Date(draft.draftSavedAt).toLocaleString()}` : "Saved time unavailable"}</div>
                  </div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", padding: "9px 12px", borderRadius: 999, background: readyToPost ? "rgba(52,199,89,0.12)" : "rgba(255,149,0,0.12)", color: readyToPost ? "#166534" : "#9a3412", fontWeight: 1000, fontSize: 12 }}>{readyToPost ? "Ready to Post" : "In Progress"}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
                <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Completed</div><div style={{ marginTop: 4, fontWeight: 1000, color: "#111827" }}>{completedDrivers}/{draftResults.length || 0} Drivers</div></div>
                <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Leader</div><div style={{ marginTop: 4, fontWeight: 1000, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leader ? `#${leader.number} ${leader.name}` : "—"}</div></div>
                <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Rows</div><div style={{ marginTop: 4, fontWeight: 1000, color: "#111827" }}>{draftResults.length || 0} Scored</div></div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" onClick={() => loadResultsDraft(draft)} style={{ ...adminSecondaryButtonStyle, borderRadius: 16, padding: "10px 14px" }}>Resume</button>
                <button type="button" onClick={() => postResultsDraft(draft)} style={{ ...adminPrimaryButtonStyle, borderRadius: 16, padding: "10px 14px" }}>Post Official Results</button>
                <button type="button" onClick={() => deleteResultsDraft(draft.id)} style={{ ...adminDangerButtonStyle, borderRadius: 16, padding: "10px 14px" }}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
            </div>}
            {/* Race History */}
            {raceOperationsTab === "history" && <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 26, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.75)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#ff9500" }}>Race Operations</div>
        <h2 style={{ margin: "3px 0 6px", fontSize: isAdminMobile ? 30 : 38, letterSpacing: -1.35 }}>Previous Race Results</h2>
        <div style={{ color: "#6b7280", fontWeight: 750, maxWidth: 720 }}>Season results are tucked into a clean race archive. Download one race, edit history, or export the whole season from one place.</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(255,149,0,0.12)", color: "#9a3412", fontWeight: 1000, fontSize: 13 }}>{raceHistory.length} Races</div>
        <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(0,122,255,0.10)", color: "#1d4ed8", fontWeight: 1000, fontSize: 13 }}>{raceHistory.reduce((sum, race) => sum + ((race.results || []).length || 0), 0)} Result Rows</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "minmax(280px, 0.85fr) minmax(420px, 1.45fr)", gap: 16, alignItems: "start" }}>
      <div style={{ borderRadius: 30, padding: 18, background: "linear-gradient(135deg, rgba(255,149,0,0.16), rgba(255,255,255,0.92))", border: "1px solid rgba(255,149,0,0.22)", boxShadow: "0 14px 35px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 13, fontWeight: 1000, color: "#9a3412", letterSpacing: 0.4 }}>Season Archive</div>
        <div style={{ marginTop: 12, color: "#374151", fontWeight: 900, lineHeight: 1.35 }}>Previous race results are stored here instead of cluttering the standings page.</div>
        <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={() => downloadRaceHistoryCsv(raceHistory, activeSeason?.name || "Season")} style={{ ...adminPrimaryButtonStyle, width: "100%", borderRadius: 18 }}>Download Full Season CSV</button>
        </div>
        <div style={{ marginTop: 12, color: "#6b7280", fontSize: 12, fontWeight: 750, lineHeight: 1.35 }}>Tip: use the per-race download button when you only need one event.</div>
      </div>

      <div style={{ borderRadius: 30, overflow: "hidden", background: "rgba(255,255,255,0.86)", border: "1px solid rgba(229,231,235,0.95)", boxShadow: "0 14px 35px rgba(15,23,42,0.07)" }}>
        <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1.2fr 0.7fr 0.7fr 0.9fr", gap: 10, padding: "12px 16px", background: "rgba(243,244,246,0.72)", color: "#6b7280", fontSize: 12, fontWeight: 1000, letterSpacing: 0.8, textTransform: "uppercase" }}>
          <div>Race</div>
          {!isAdminMobile && <div>Winner</div>}
          {!isAdminMobile && <div>Entries</div>}
          {!isAdminMobile && <div style={{ textAlign: "right" }}>Action</div>}
        </div>

        <div style={{ display: "grid" }}>
          {raceHistory.length === 0 ? (
            <div style={{ padding: 18, color: "#6b7280", fontWeight: 750 }}>No races entered yet. Race results will appear here after you post them.</div>
          ) : raceHistory.map((race, raceIndex) => {
            const results = race.results || [];
            const winner = results.find((r) => Number(r.finishPos) === 1) || results[0];
            const podium = results.filter((r) => Number(r.finishPos || 0) >= 1 && Number(r.finishPos || 0) <= 3).sort((a, b) => Number(a.finishPos || 99) - Number(b.finishPos || 99));
            const penaltyCount = results.filter((r) => Number(r.penaltyPoints || 0) > 0 || r.offense).length;
            const dnfCount = results.filter((r) => r.dnf).length;
            return (
              <details key={race.raceName || raceIndex} style={{ borderTop: "1px solid rgba(229,231,235,0.75)", background: "rgba(255,255,255,0.72)" }}>
                <summary style={{ listStyle: "none", cursor: "pointer", display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1.2fr 0.7fr 0.7fr 0.9fr", gap: 10, alignItems: "center", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 16, background: "linear-gradient(135deg, #ff9500, #ffcc00)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, boxShadow: "0 10px 20px rgba(255,149,0,0.24)" }}>{raceIndex + 1}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1000, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{race.raceName}</div>
                      {isAdminMobile && <div style={{ marginTop: 5, color: "#6b7280", fontSize: 12, fontWeight: 800 }}>{winner ? `Winner #${winner.number} ${winner.name}` : "No winner listed"} • {results.length} entries</div>}
                    </div>
                  </div>

                  <div style={{ display: isAdminMobile ? "none" : "block", color: "#111827", fontWeight: 900, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{winner ? `#${winner.number} ${winner.name}` : "—"}</div>

                  <div style={{ display: isAdminMobile ? "none" : "block" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: "rgba(0,122,255,0.10)", color: "#1d4ed8", fontWeight: 1000, fontSize: 12 }}>{results.length} Drivers</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: isAdminMobile ? "flex-start" : "flex-end", gap: 8, flexWrap: "wrap", marginTop: isAdminMobile ? 12 : 0 }}>
                    <button type="button" onClick={(e) => { e.preventDefault(); downloadRaceHistoryCsv([race], race.raceName || "Race"); }} style={{ ...adminSecondaryButtonStyle, borderRadius: 16, padding: "9px 12px" }}>Download</button>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        await Promise.resolve(handleEditRace(race));
                        setRaceOperationsTab("input");

                        window.requestAnimationFrame(() => {
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        });
                      }}
                      style={{
                        ...adminSecondaryButtonStyle,
                        borderRadius: 16,
                        padding: "9px 12px",
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); handleDeleteRace(race.raceName); }} style={{ ...adminDangerButtonStyle, borderRadius: 16, padding: "9px 12px" }}>Remove</button>
                  </div>
                </summary>

                <div style={{ padding: "0 16px 16px" }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: "rgba(255,149,0,0.14)", color: "#9a3412", fontWeight: 1000, fontSize: 12 }}>{race.stageCount} Stage{Number(race.stageCount) === 1 ? "" : "s"}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: dnfCount ? "rgba(255,59,48,0.12)" : "rgba(142,142,147,0.12)", color: dnfCount ? "#b42318" : "#6b7280", fontWeight: 1000, fontSize: 12 }}>{dnfCount} DNF</span>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: penaltyCount ? "rgba(255,59,48,0.12)" : "rgba(142,142,147,0.12)", color: penaltyCount ? "#b42318" : "#6b7280", fontWeight: 1000, fontSize: 12 }}>{penaltyCount} Penalties</span>
                    {podium.map((r) => (
                      <span key={`${race.raceName}-${r.driverId}-podium`} style={{ display: "inline-flex", alignItems: "center", padding: "8px 11px", borderRadius: 999, background: r.finishPos === 1 ? "rgba(255,204,0,0.2)" : "rgba(229,231,235,0.72)", color: "#111827", fontWeight: 1000, fontSize: 12 }}>P{r.finishPos} · #{r.number} {r.name}</span>
                    ))}
                  </div>

                  <div style={{ overflowX: "auto", borderRadius: 24, border: "1px solid rgba(229,231,235,0.92)", background: "rgba(248,250,252,0.88)" }}>
                    <table style={{ ...adminTableStyle, minWidth: 980 }}>
                      <thead>
                        <tr>
                          <th style={adminThStyle}>Finish</th><th style={adminThStyle}>#</th><th style={adminThStyle}>Driver</th><th style={adminThStyle}>Team</th>
                          <th style={adminThStyle}>Race Pts</th>
                          {race.stageCount >= 1 && <th style={adminThStyle}>S1</th>}
                          {race.stageCount >= 2 && <th style={adminThStyle}>S2</th>}
                          {race.stageCount === 3 && <th style={adminThStyle}>S3</th>}
                          <th style={adminThStyle}>FL</th><th style={adminThStyle}>DNF</th><th style={adminThStyle}>Start & Park</th>
                          <th style={adminThStyle}>Offense</th><th style={adminThStyle}>Penalty</th><th style={adminThStyle}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r) => (
                          <tr key={r.driverId}>
                            <td style={{ ...adminTdStyle, fontWeight: 1000 }}>{r.finishPos ?? "—"}</td>
                            <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #111827, #4b5563)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#fff", border: "2px solid rgba(255,204,0,0.78)"}}>{r.number}</div></td>
                            <td style={{ ...adminTdStyle, fontWeight: 900 }}>{r.name}</td>
                            <td style={adminTdStyle}>{getTeamFullName(r.team)}</td>
                            <td style={adminTdStyle}>{r.finishPoints}</td>
                            {race.stageCount >= 1 && <td style={adminTdStyle}>{r.stage1Points}</td>}
                            {race.stageCount >= 2 && <td style={adminTdStyle}>{r.stage2Points}</td>}
                            {race.stageCount === 3 && <td style={adminTdStyle}>{r.stage3Points}</td>}
                            <td style={adminTdStyle}>{r.fastestLap ? "+1" : "—"}</td>
                            <td style={adminTdStyle}>{r.dnf ? (r.dnfReason ? `DNF (${r.dnfReason})` : "DNF") : "—"}</td>
                            <td style={adminTdStyle}>{r.startPark ? "Yes" : "—"}</td>
                            <td style={adminTdStyle}>{r.offense ? `#${r.offenseNumber}` : "—"}</td>
                            <td style={{ ...tdStyle, color: r.penaltyPoints > 0 ? "#dc2626" : "inherit", fontWeight: 900 }}>{r.penaltyPoints > 0 ? `-${r.penaltyPoints}` : "0"}</td>
                            <td style={{ ...tdStyle, fontWeight: 1000 }}>{r.totalRacePoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
            </div>}
            {/* Offense Log */}
            {raceOperationsTab === "offenses" && <div style={{ ...adminReadableCardStyle, padding: isAdminMobile ? 18 : 26, borderRadius: 34, background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92))", boxShadow: "0 22px 60px rgba(15,23,42,0.12)", border: "1px solid rgba(255,255,255,0.75)" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#ff3b30" }}>Race Control</div>
        <h2 style={{ margin: "2px 0 0", fontSize: isAdminMobile ? 30 : 38, letterSpacing: -1.2 }}>Offense Log</h2>
        <p style={{ margin: "8px 0 0", color: "#6b7280", fontWeight: 800, maxWidth: 720 }}>Incident cards for penalties, repeat offenses, and race-control discipline history.</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: offenseLog.length ? "rgba(255,59,48,0.12)" : "rgba(52,199,89,0.12)", color: offenseLog.length ? "#b42318" : "#15803d", fontWeight: 1000, fontSize: 13 }}>{offenseLog.length} Offense{offenseLog.length === 1 ? "" : "s"}</span>
        <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "rgba(142,142,147,0.12)", color: "#6b7280", fontWeight: 1000, fontSize: 13 }}>Season Log</span>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "minmax(280px, 0.85fr) minmax(420px, 1.45fr)", gap: 16, alignItems: "start" }}>
      <div style={{ borderRadius: 30, padding: 18, background: "linear-gradient(135deg, rgba(255,59,48,0.14), rgba(255,255,255,0.92))", border: "1px solid rgba(255,59,48,0.22)", boxShadow: "0 14px 35px rgba(15,23,42,0.08)" }}>
        <div style={{ fontSize: 13, fontWeight: 1000, color: "#b42318", letterSpacing: 0.4 }}>Discipline Summary</div>
        <div style={{ width: 58, height: 58, borderRadius: 20, background: "linear-gradient(135deg, #ff3b30, #ff9500)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 24, margin: "16px 0 14px", boxShadow: "0 14px 26px rgba(255,59,48,0.22)" }}>⚠️</div>
        <h3 style={{ margin: 0, fontSize: 22, letterSpacing: -0.5 }}>Race Control</h3>
        <p style={{ margin: "8px 0 0", color: "#6b7280", fontWeight: 800, lineHeight: 1.45 }}>Every posted offense becomes a card so discipline history is easy to scan.</p>
        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,0.74)", border: "1px solid rgba(255,255,255,0.82)" }}><span style={{ color: "#6b7280", fontWeight: 900 }}>Total Offenses</span><b>{offenseLog.length}</b></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 18, background: "rgba(255,255,255,0.74)", border: "1px solid rgba(255,255,255,0.82)" }}><span style={{ color: "#6b7280", fontWeight: 900 }}>Penalty Points</span><b>-{offenseLog.reduce((sum, entry) => sum + Number(entry.penaltyPoints || 0), 0)}</b></div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {offenseLog.length === 0 ? (
          <div style={{ borderRadius: 30, padding: isAdminMobile ? 20 : 26, background: "rgba(255,255,255,0.86)", border: "1px solid rgba(229,231,235,0.92)", boxShadow: "0 14px 34px rgba(15,23,42,0.08)", color: "#4b5563", fontWeight: 850 }}>
            <div style={{ width: 48, height: 48, borderRadius: 18, background: "rgba(52,199,89,0.12)", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 1000, color: "#111827", fontSize: 20 }}>No offenses logged</div>
            <div style={{ marginTop: 6 }}>Penalties marked in Race Input will appear here after results are posted.</div>
          </div>
        ) : offenseLog.map((entry, i) => {
          const penaltyValue = Number(entry.penaltyPoints || 0);
          const severe = penaltyValue >= 25 || Number(entry.offenseNumber || 0) >= 3;
          const warning = penaltyValue > 0 && !severe;
          return (
            <details key={`${entry.raceName}-${entry.number}-${i}`} style={{ borderRadius: 30, padding: 0, background: "rgba(255,255,255,0.88)", border: "1px solid rgba(229,231,235,0.92)", boxShadow: "0 14px 34px rgba(15,23,42,0.08)", overflow: "hidden" }}>
              <summary style={{ listStyle: "none", cursor: "pointer", padding: isAdminMobile ? 18 : 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                    <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg, #111827, #4b5563)", color: "#fff", border: "2px solid rgba(255,204,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 15, flexShrink: 0 }}>{entry.number}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 1000, color: "#111827", fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.name || "Driver"}</div>
                      <div style={{ marginTop: 4, color: "#6b7280", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.raceName || "Race"}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "9px 12px", borderRadius: 999, background: severe ? "rgba(255,59,48,0.12)" : warning ? "rgba(255,149,0,0.12)" : "rgba(142,142,147,0.12)", color: severe ? "#b42318" : warning ? "#9a3412" : "#6b7280", fontWeight: 1000, fontSize: 12 }}>{severe ? "Major" : warning ? "Penalty" : "Logged"}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", padding: "9px 12px", borderRadius: 999, background: "rgba(255,59,48,0.12)", color: "#b42318", fontWeight: 1000, fontSize: 12 }}>-{penaltyValue} pts</span>
                  </div>
                </div>
              </summary>
              <div style={{ padding: isAdminMobile ? "0 18px 18px" : "0 20px 20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, 1fr)", gap: 10, borderTop: "1px solid rgba(229,231,235,0.78)", paddingTop: 16 }}>
                  <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Offense</div><div style={{ marginTop: 4, fontWeight: 1000, color: "#111827" }}>#{entry.offenseNumber || i + 1}</div></div>
                  <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Penalty</div><div style={{ marginTop: 4, fontWeight: 1000, color: penaltyValue ? "#b42318" : "#111827" }}>-{penaltyValue} points</div></div>
                  <div style={{ padding: "12px 14px", borderRadius: 18, background: "rgba(248,250,252,0.9)", border: "1px solid rgba(229,231,235,0.78)" }}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>Status</div><div style={{ marginTop: 4, fontWeight: 1000, color: "#111827" }}>{severe ? "Review Required" : "Served"}</div></div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
            </div>}


      </div>
    </div>
  );
}
