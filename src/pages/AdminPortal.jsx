import React from "react";

export default function AdminPortal({
  AdminLeagueMessageComposer,
  AdminLeagueMessageDashboard,
  PaymentCompliancePanel,
  PreviousRaceWinnerAdminPanel,
  activeDrivers,
  activeHeaderButtonStyle,
  activeSeason,
  activeSeasonId,
  addDriver,
  addManualWatchPick,
  addTrack,
  appShellStyle,
  applyApprovedStartParkRequestsToRace,
  approvePendingDriver,
  awardPaintSchemePayouts,
  backupFileInputRef,
  cancelEditDriver,
  clearDriverAccessCode,
  clearInputs,
  clearOwnerCode,
  copyDriverAccessCode,
  copyOwnerCode,
  createSeason,
  currentLeader,
  dangerButtonStyle,
  deleteActiveSeason,
  deleteManualWatchPick,
  deleteResultsDraft,
  deleteTickerMessage,
  discordAnnouncement,
  discordInviteUrl,
  discordRulesText,
  dnfMap,
  dnfReasons,
  downloadRaceHistoryCsv,
  driverAccessCodes,
  drivers,
  editDriverForm,
  editTickerMessage,
  editingDriverId,
  editingRaceName,
  editingTickerId,
  exportAllSeasonsBackup,
  exportAppDataJson,
  exportBackup,
  fastestLapMap,
  featuredVideo,
  generateAllOwnerCodes,
  generateDriverAccessCode,
  generateOwnerCode,
  getOffensePenaltyPoints,
  getStagePoints,
  getTeamFullName,
  handleDeleteRace,
  handleDnfChange,
  handleDownloadLeagueBackup,
  handleEditRace,
  handleFastestLapChange,
  handleImportBackup,
  handleManualPenaltyChange,
  handleOffenseChange,
  handlePositionChange,
  handleRestoreLeagueBackup,
  handleResultNoteChange,
  handleStage1Change,
  handleStage2Change,
  handleStage3Change,
  handleStartParkChange,
  headerButtonStyle,
  importFileRef,
  inputStyle,
  isInactivePlaceholderDriver,
  latestWinner,
  loadDriverAccessCodes,
  loadManualWatchPicks,
  loadPaintSchemePayoutPreview,
  loadResultsDraft,
  loadStartParkRequests,
  loadTickerMessages,
  logo,
  logoutAdmin,
  manualWatchPicks,
  manufacturerStandings,
  money,
  moveDriverFinishPosition,
  newDriverManufacturer,
  newDriverName,
  newDriverNumber,
  newDriverTeam,
  newSeasonName,
  newTrackName,
  newTrackStageCount,
  offenseLog,
  offenseMap,
  openAppealCount,
  openEditDriver,
  openStoryCount,
  ownerAccessCodes,
  ownerAssignmentError,
  ownerAssignmentMessage,
  ownerAssignments,
  ownerPortalTeams,
  pageContainerStyle,
  paintPayoutError,
  paintPayoutLoading,
  paintPayoutRace,
  paintPayoutRows,
  paintPayoutStatus,
  patchActiveSeason,
  penaltyMap,
  pendingDrivers,
  pointsTable,
  positions,
  postResultsDraft,
  primaryButtonStyle,
  raceDrafts,
  raceEntryTdStyle,
  raceEntryThStyle,
  raceHistory,
  raceNotesInputStyle,
  racePenaltyInputStyle,
  racePositionInputStyle,
  rejectPendingDriver,
  removeDriver,
  removeTrack,
  renameActiveSeason,
  renameSeasonName,
  resetSeason,
  resetTickerForm,
  restoreDefaultTracks,
  resultNotesMap,
  retireDriver,
  saveDiscordSettings,
  saveDriverEdit,
  saveOwnerAssignment,
  saveResultsDraft,
  saveTickerMessage,
  seasonOffenseCounts,
  seasons,
  secondaryButtonStyle,
  sectionCardStyle,
  seedWeeklyTickerMessages,
  selectedOwnerDriverNumber,
  selectedOwnerTeam,
  selectedRace,
  setDiscordAnnouncement,
  setDiscordInviteUrl,
  setDiscordRulesText,
  setDnfReasons,
  setEditDriverForm,
  setFeaturedVideo,
  setNewDriverManufacturer,
  setNewDriverName,
  setNewDriverNumber,
  setNewDriverTeam,
  setNewSeasonName,
  setNewTrackName,
  setNewTrackStageCount,
  setPaintPayoutRace,
  setRenameSeasonName,
  setSelectedOwnerDriverNumber,
  setSelectedOwnerTeam,
  setTickerForm,
  setVideoDescription,
  setVideoTitle,
  setVideoUploading,
  setViewMode,
  setWatchBadge,
  setWatchDisplayOrder,
  setWatchDriverId,
  setWatchReason,
  sortedDrivers,
  stage1,
  stage2,
  stage3,
  stageCount,
  startParkMap,
  startParkRequestError,
  startParkRequestStatus,
  startParkRequests,
  startParkRequestsLoading,
  statBoxStyle,
  submitResults,
  supabase,
  switchSeason,
  tableStyle,
  tdStyle,
  teamStandings,
  thStyle,
  tickerError,
  tickerForm,
  tickerMessages,
  tickerStatus,
  toggleManualWatchPick,
  toggleTickerActive,
  toggleTickerPinned,
  tracks,
  unretireDriver,
  updateStartParkRequestStatus,
  updateTrackStageCount,
  videoDescription,
  videoFileInputRef,
  videoTitle,
  videoUploading,
  viewMode,
  visibleDrivers,
  watchBadge,
  watchDisplayOrder,
  watchDriverId,
  watchReason,
  watchSaving
}) {
  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        {/* Header */}
        <div style={{ ...sectionCardStyle, marginBottom: 20, padding: 20, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #353b45" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 54 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>Budweiser Cup League</div>
                <div style={{ opacity: 0.72 }}>Admin Dashboard</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {["admin","overlay-ticker"].map((mode) => (
                <button key={mode} style={viewMode === mode ? activeHeaderButtonStyle : headerButtonStyle} onClick={() => setViewMode(mode)}>
                  {mode === "admin" ? "Admin" : "Ticker Overlay"}
                </button>
              ))}
              <button onClick={() => (window.location.pathname = "/standings")} style={headerButtonStyle}>
                Standings
              </button>
              <button onClick={() => (window.location.pathname = "/team-hq")} style={headerButtonStyle}>
                🏢 Team HQ
              </button>
              <button onClick={logoutAdmin} style={{ ...headerButtonStyle, border: "1px solid #b42318", color: "#fecaca" }}>
                Logout
              </button>
              <button onClick={() => (window.location.pathname = "/streams")} style={headerButtonStyle}>
                🎮 Streams
              </button>
              <button onClick={() => (window.location.pathname = "/discord")} style={headerButtonStyle}>
                💬 Discord
              </button>
              <button onClick={() => (window.location.pathname = "/news")} style={headerButtonStyle}>
                📰 News
              </button>
              <button onClick={() => (window.location.pathname = "/notifications")} style={headerButtonStyle}>
                🔔 Notifications
              </button>
              <button onClick={() => (window.location.pathname = "/appeals")} style={headerButtonStyle}>
                Appeals ({openAppealCount})
              </button>
              <button onClick={() => (window.location.pathname = "/admin/stories")} style={headerButtonStyle}>
                Stories ({openStoryCount})
              </button>
              <button onClick={() => (window.location.pathname = "/admin/car-gallery")} style={headerButtonStyle}>
                Car Gallery
              </button>
              <button onClick={() => (window.location.pathname = "/admin/interviews")} style={headerButtonStyle}>
                🎙️ Interviews
              </button>
              <button onClick={() => (window.location.pathname = "/admin/votes")} style={headerButtonStyle}>
                🗳️ Voting
              </button>
              <button onClick={exportAppDataJson} style={{ ...primaryButtonStyle, padding: "10px 14px" }}>
                ⬇️ Export App Data JSON
              </button>
            </div>
          </div>
        </div>

        <AdminLeagueMessageComposer drivers={visibleDrivers} teams={teamStandings} />

        <AdminLeagueMessageDashboard drivers={visibleDrivers} teams={teamStandings} />

        <PaymentCompliancePanel mode="admin" />

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Owner Assignments</h2>
          <p style={{ opacity: 0.75, marginTop: 0 }}>
            Assign which driver owns each team. That driver’s profile password will unlock the matching owner/team page. The admin master password still unlocks every team.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>TEAM</label>
              <select value={selectedOwnerTeam} onChange={(event) => setSelectedOwnerTeam(event.target.value)} style={inputStyle}>
                <option value="">Select team</option>
                {teamStandings
                  .filter((team) => team.team !== "Independent" && team.team !== "IND")
                  .map((team) => (
                    <option key={team.team} value={team.team}>{getTeamFullName(team.team)}</option>
                  ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>OWNER DRIVER</label>
              <select value={selectedOwnerDriverNumber} onChange={(event) => setSelectedOwnerDriverNumber(event.target.value)} style={inputStyle}>
                <option value="">Select owner driver</option>
                {visibleDrivers
                  .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
                  .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999))
                  .map((driver) => (
                    <option key={driver.id} value={driver.number}>#{driver.number} — {driver.name}</option>
                  ))}
              </select>
            </div>

            <button type="button" onClick={saveOwnerAssignment} style={primaryButtonStyle}>Save Owner Assignment</button>
          </div>

          {ownerAssignmentMessage && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentMessage}</div>}
          {ownerAssignmentError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentError}</div>}

          <div style={{ marginTop: 18, overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Assigned Owner Driver</th>
                  <th style={thStyle}>Driver #</th>
                </tr>
              </thead>
              <tbody>
                {ownerAssignments.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={3}>No owner assignments saved yet.</td></tr>
                ) : (
                  ownerAssignments.map((assignment) => (
                    <tr key={assignment.team}>
                      <td style={tdStyle}>{getTeamFullName(assignment.team)}</td>
                      <td style={tdStyle}>{assignment.owner_driver_name}</td>
                      <td style={tdStyle}>#{assignment.owner_driver_number}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>


        {/* League Ticker Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🏁 League Ticker Banner</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                Manage the scrolling ticker shown at the top of /standings. Use categories like BREAKING, TRANSACTION, RACE CONTROL, APP UPDATE, and NEXT EVENT.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={loadTickerMessages} style={secondaryButtonStyle}>Refresh Ticker</button>
              <button type="button" onClick={seedWeeklyTickerMessages} style={primaryButtonStyle}>Add This Week's Headlines</button>
            </div>
          </div>

          <form onSubmit={saveTickerMessage} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Category</div>
                <select
                  style={inputStyle}
                  value={tickerForm.category}
                  onChange={(event) => setTickerForm((current) => ({ ...current, category: event.target.value }))}
                >
                  <option value="BREAKING">BREAKING</option>
                  <option value="NEWS">NEWS</option>
                  <option value="TRANSACTION">TRANSACTION</option>
                  <option value="TEAM UPDATE">TEAM UPDATE</option>
                  <option value="RACE CONTROL">RACE CONTROL</option>
                  <option value="RESULTS">RESULTS</option>
                  <option value="APP UPDATE">APP UPDATE</option>
                  <option value="NEXT EVENT">NEXT EVENT</option>
                  <option value="SPONSOR">SPONSOR</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Page</div>
                <select
                  style={inputStyle}
                  value={tickerForm.page}
                  onChange={(event) => setTickerForm((current) => ({ ...current, page: event.target.value }))}
                >
                  <option value="standings">/standings only</option>
                  <option value="all">All pages using ticker</option>
                </select>
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Sort Order</div>
                <input
                  type="number"
                  style={inputStyle}
                  value={tickerForm.sort_order}
                  onChange={(event) => setTickerForm((current) => ({ ...current, sort_order: event.target.value }))}
                />
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Auto-Expire</div>
                <input
                  type="datetime-local"
                  style={inputStyle}
                  value={tickerForm.expires_at}
                  onChange={(event) => setTickerForm((current) => ({ ...current, expires_at: event.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Ticker Message</div>
              <input
                style={inputStyle}
                value={tickerForm.message}
                onChange={(event) => setTickerForm((current) => ({ ...current, message: event.target.value }))}
                placeholder="Example: B2J Motorsports announces a driver update • BigDiehl21 signs with MER"
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={tickerForm.active}
                  onChange={(event) => setTickerForm((current) => ({ ...current, active: event.target.checked }))}
                />
                Active
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800 }}>
                <input
                  type="checkbox"
                  checked={tickerForm.pinned}
                  onChange={(event) => setTickerForm((current) => ({ ...current, pinned: event.target.checked }))}
                />
                Pin First
              </label>
              <button type="submit" style={primaryButtonStyle}>{editingTickerId ? "Save Ticker Message" : "Add Ticker Message"}</button>
              {editingTickerId && <button type="button" onClick={resetTickerForm} style={secondaryButtonStyle}>Cancel Edit</button>}
            </div>

            {tickerStatus && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{tickerStatus}</div>}
            {tickerError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{tickerError}</div>}
          </form>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Pinned</th>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Message</th>
                  <th style={thStyle}>Page</th>
                  <th style={thStyle}>Expires</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickerMessages.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={8}>No ticker messages saved yet. Use “Add This Week's Headlines” to seed the current league ticker.</td></tr>
                ) : (
                  tickerMessages.map((item) => (
                    <tr key={item.id}>
                      <td style={{ ...tdStyle, color: item.active === false ? "#f87171" : "#4ade80", fontWeight: 900 }}>{item.active === false ? "Inactive" : "Active"}</td>
                      <td style={tdStyle}>{item.pinned ? "📌 Yes" : "—"}</td>
                      <td style={tdStyle}>{item.sort_order ?? 0}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{item.category || "NEWS"}</td>
                      <td style={tdStyle}>{item.message}</td>
                      <td style={tdStyle}>{item.page || "standings"}</td>
                      <td style={tdStyle}>{item.expires_at ? new Date(item.expires_at).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => editTickerMessage(item)} style={secondaryButtonStyle}>Edit</button>
                          <button type="button" onClick={() => toggleTickerActive(item)} style={secondaryButtonStyle}>{item.active === false ? "Activate" : "Disable"}</button>
                          <button type="button" onClick={() => toggleTickerPinned(item)} style={secondaryButtonStyle}>{item.pinned ? "Unpin" : "Pin"}</button>
                          <button type="button" onClick={() => deleteTickerMessage(item.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Discord Settings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Discord Hub Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Invite Link</div>
              <input style={inputStyle} value={discordInviteUrl} onChange={(e) => setDiscordInviteUrl(e.target.value)} placeholder="https://discord.gg/your-link" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Page Announcement</div>
              <input style={inputStyle} value={discordAnnouncement} onChange={(e) => setDiscordAnnouncement(e.target.value)} placeholder="Join the league Discord..." />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Rules / Conduct Notes</div>
            <textarea
              style={{ ...inputStyle, minHeight: 130, resize: "vertical", lineHeight: 1.45 }}
              value={discordRulesText}
              onChange={(e) => setDiscordRulesText(e.target.value)}
              placeholder="One rule per line"
            />
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={saveDiscordSettings} style={primaryButtonStyle}>Save Discord Settings</button>
            <button onClick={() => (window.location.pathname = "/discord")} style={secondaryButtonStyle}>View Discord Page</button>
          </div>
        </div>
        {/* Season Manager */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Manager</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Active Season</div><select style={inputStyle} value={activeSeasonId} onChange={(e) => switchSeason(e.target.value)}>{seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Create New Season</div><input style={inputStyle} value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} placeholder="Example: 2026 Regular Season" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Rename Active Season</div><input style={inputStyle} value={renameSeasonName} onChange={(e) => setRenameSeasonName(e.target.value)} placeholder="Rename current season" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={createSeason} style={primaryButtonStyle}>Create Season</button>
            <button onClick={renameActiveSeason} style={secondaryButtonStyle}>Save Season Name</button>
            <button onClick={deleteActiveSeason} style={dangerButtonStyle}>Delete Active Season</button>
          </div>
        </div>
        {/* Stat Boxes */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          {[
            { label: "ACTIVE SEASON", value: activeSeason?.name || "—" },
            { label: "CURRENT LEADER", value: currentLeader ? `#${currentLeader.number} ${currentLeader.name}` : "—" },
            { label: "TOTAL DRIVERS", value: drivers.length },
            { label: "RACES ENTERED", value: raceHistory.length },
            { label: "LATEST WINNER", value: latestWinner ? `#${latestWinner.number} ${latestWinner.name}` : "—" },
          ].map((stat) => (
            <div key={stat.label} style={statBoxStyle}>
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{stat.value}</div>
            </div>
          ))}
        </div>
        {/* Owner Access Code Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>💼 Owner Portal Access</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Admin sees all owner codes here. Owners use these codes on /team-hq and only unlock their own team view.</div>
            </div>
            <button onClick={generateAllOwnerCodes} style={primaryButtonStyle}>Generate Codes for All Teams</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Owner Code</th>
                  <th style={thStyle}>Drivers</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ownerPortalTeams.map((team) => {
                  const teamDrivers = visibleDrivers.filter((driver) => driver.team === team);
                  const code = ownerAccessCodes[team] || "";
                  return (
                    <tr key={team}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{getTeamFullName(team)}</td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 900, color: code ? "#d4af37" : "#f87171" }}>{code || "Not generated"}</td>
                      <td style={tdStyle}>{teamDrivers.map((driver) => `#${driver.number} ${driver.name}`).join(", ") || "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => generateOwnerCode(team)} style={secondaryButtonStyle}>{code ? "Regenerate" : "Generate"}</button>
                          <button onClick={() => copyOwnerCode(team)} disabled={!code} style={{ ...secondaryButtonStyle, opacity: code ? 1 : 0.45 }}>Copy</button>
                          <button onClick={() => clearOwnerCode(team)} disabled={!code} style={{ ...dangerButtonStyle, opacity: code ? 1 : 0.45 }}>Clear</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>


        {/* Driver Access Code Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🔐 Driver Contract Access</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Generate driver passwords here. Drivers use these codes on their driver profile to unlock contract offers.</div>
            </div>
            <button onClick={loadDriverAccessCodes} style={secondaryButtonStyle}>Refresh Driver Codes</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Driver Code</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDrivers.map((driver) => {
                  const codeRow = driverAccessCodes.find((row) => String(row.driver_number) === String(driver.number) && row.active !== false);
                  const code = codeRow?.code || "";
                  return (
                    <tr key={driver.id}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team)} <span style={{ fontSize: 11, opacity: 0.55 }}>({driver.team})</span></td>
                      <td style={{ ...tdStyle, fontFamily: "monospace", fontWeight: 900, color: code ? "#d4af37" : "#f87171" }}>{code || "Not generated"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => generateDriverAccessCode(driver)} style={secondaryButtonStyle}>{code ? "Regenerate" : "Generate"}</button>
                          <button onClick={() => copyDriverAccessCode(driver, code)} disabled={!code} style={{ ...secondaryButtonStyle, opacity: code ? 1 : 0.45 }}>Copy</button>
                          <button onClick={() => clearDriverAccessCode(driver)} disabled={!code} style={{ ...dangerButtonStyle, opacity: code ? 1 : 0.45 }}>Clear</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <PreviousRaceWinnerAdminPanel drivers={visibleDrivers} raceHistory={raceHistory} />


        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🎨 Paint Scheme Payouts</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
                Preview vote rankings, then award tiered payouts. Voting/payout eligibility closes Friday at 12:00 AM ET. Uploads not updated by then are excluded. Team payouts are capped at {money(PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP)} per team per week and {money(PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP)} per team per season. Payout tiers now start at {money(20000)} to the team and {money(5000)} to the driver for P1.
              </div>
            </div>
            <button onClick={() => loadPaintSchemePayoutPreview()} disabled={paintPayoutLoading} style={secondaryButtonStyle}>{paintPayoutLoading ? "Loading..." : "Preview Rankings"}</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Race / Vote Week</div>
              <select style={inputStyle} value={paintPayoutRace} onChange={(event) => setPaintPayoutRace(event.target.value)}>
                <option value="">Auto-select previous completed race</option>
                {(tracks || []).map((track) => <option key={track.name} value={track.name}>{track.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "end", gap: 10, flexWrap: "wrap" }}>
              <button onClick={awardPaintSchemePayouts} disabled={!paintPayoutRows.length} style={{ ...primaryButtonStyle, opacity: paintPayoutRows.length ? 1 : 0.55 }}>Award Paint Scheme Payouts</button>
            </div>
          </div>
          {paintPayoutStatus && <div style={{ color: "#4ade80", fontWeight: 900, marginBottom: 10 }}>{paintPayoutStatus}</div>}
          {paintPayoutError && <div style={{ color: "#f87171", fontWeight: 900, marginBottom: 10 }}>{paintPayoutError}</div>}
          {paintPayoutRows.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Rank</th>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Votes</th>
                    <th style={thStyle}>Updated By Deadline</th>
                    <th style={thStyle}>Team Payout</th>
                    <th style={thStyle}>Driver Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {paintPayoutRows.map((row) => (
                    <tr key={`${row.rank}-${row.uploadId}`}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>P{row.rank}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{row.driverNumber} {row.driverName}</td>
                      <td style={tdStyle}>{getTeamFullName(row.team)}</td>
                      <td style={tdStyle}>{row.votes}</td>
                      <td style={tdStyle}>{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}</td>
                      <td style={{ ...tdStyle, color: "#4ade80", fontWeight: 900 }}>{money(row.teamPayout)}{row.teamWeeklyCapApplied ? <div style={{ color: "#fbbf24", fontSize: 11 }}>Weekly team cap applied</div> : null}{row.teamSeasonCapApplied ? <div style={{ color: "#fbbf24", fontSize: 11 }}>Season team cap applied</div> : null}</td>
                      <td style={{ ...tdStyle, color: "#d4af37", fontWeight: 900 }}>{money(row.driverPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ones to Watch Manager */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: 0 }}>🔥 Ones to Watch Manager</h2>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>Manual picks override the automatic /standings watch list. Turn all manual picks off to return to auto mode.</div>
            </div>
            <button onClick={loadManualWatchPicks} style={secondaryButtonStyle}>Refresh Picks</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Driver</div>
              <select style={inputStyle} value={watchDriverId} onChange={(e) => setWatchDriverId(e.target.value)}>
                <option value="">Select driver...</option>
                {visibleDrivers.map((d) => <option key={d.id} value={d.id}>#{d.number} {d.name}</option>)}
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Badge</div>
              <select style={inputStyle} value={watchBadge} onChange={(e) => setWatchBadge(e.target.value)}>
                <option value="DIRECTOR PICK">DIRECTOR PICK</option>
                <option value="HOT SEAT">HOT SEAT</option>
                <option value="MOMENTUM">MOMENTUM</option>
                <option value="UNDERDOG">UNDERDOG</option>
                <option value="REBOUND WATCH">REBOUND WATCH</option>
                <option value="TITLE THREAT">TITLE THREAT</option>
              </select>
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Display Order</div>
              <input style={inputStyle} type="number" min="1" value={watchDisplayOrder} onChange={(e) => setWatchDisplayOrder(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>Reason / Storyline</div>
            <input style={inputStyle} value={watchReason} onChange={(e) => setWatchReason(e.target.value)} placeholder="Example: Coming off a podium and showing long-run speed" />
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={addManualWatchPick} disabled={watchSaving} style={{ ...primaryButtonStyle, opacity: watchSaving ? 0.6 : 1 }}>{watchSaving ? "Saving..." : "Add to Ones to Watch"}</button>
            <button onClick={() => { setWatchDriverId(""); setWatchReason(""); setWatchBadge("DIRECTOR PICK"); setWatchDisplayOrder("1"); }} style={secondaryButtonStyle}>Clear Form</button>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Status</th><th style={thStyle}>Order</th><th style={thStyle}>Driver</th><th style={thStyle}>Badge</th><th style={thStyle}>Reason</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {manualWatchPicks.length === 0 ? (
                  <tr><td colSpan={6} style={{ ...tdStyle, opacity: 0.7 }}>No manual picks yet. /standings will use the automatic watch list.</td></tr>
                ) : manualWatchPicks.map((pick) => {
                  const driver = drivers.find((d) => Number(d.id) === Number(pick.driver_id));
                  return (
                    <tr key={pick.id}>
                      <td style={{ ...tdStyle, color: pick.active ? "#4ade80" : "#f59e0b", fontWeight: 900 }}>{pick.active ? "ACTIVE" : "OFF"}</td>
                      <td style={tdStyle}>{pick.display_order || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{driver ? `#${driver.number} ${driver.name}` : `Driver ID ${pick.driver_id}`}</td>
                      <td style={tdStyle}>{pick.badge || "DIRECTOR PICK"}</td>
                      <td style={tdStyle}>{pick.reason || "—"}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => toggleManualWatchPick(pick)} style={secondaryButtonStyle}>{pick.active ? "Turn Off" : "Activate"}</button>
                          <button onClick={() => deleteManualWatchPick(pick.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Featured Video */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>🎬 Featured Video</h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
            Upload a pre-race hype video or race highlight. It appears at the top of the /standings page. Replaces any existing featured video.
          </div>
          {featuredVideo && (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{featuredVideo.title || "Untitled Video"}</div>
                  {featuredVideo.description && <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{featuredVideo.description}</div>}
                  <div style={{ fontSize: 11, opacity: 0.45 }}>Published {new Date(featuredVideo.uploaded_at).toLocaleString()}</div>
                </div>
                <button
                  style={dangerButtonStyle}
                  onClick={async () => {
                    if (!window.confirm("Remove the featured video from standings?")) return;
                    // Delete from storage if it's a Supabase file
                    if (featuredVideo.file_path) {
                      await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]);
                    }
                    await supabase.from("featured_video").delete().eq("id", featuredVideo.id);
                    setFeaturedVideo(null);
                  }}
                >
                  Remove
                </button>
              </div>
              <video controls crossOrigin="anonymous" style={{ width: "100%", maxHeight: 240, borderRadius: 8, background: "#000" }} src={featuredVideo.video_url} />
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Title (optional)</div>
              <input style={inputStyle} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. Preseason Michigan Highlights" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Description (optional)</div>
              <input style={inputStyle} value={videoDescription} onChange={e => setVideoDescription(e.target.value)} placeholder="e.g. Race recap — Season 1 opener" />
            </div>
          </div>
          <input
            ref={videoFileInputRef}
            type="file"
            accept="video/mp4,video/mov,video/quicktime,video/avi,video/webm"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setVideoUploading(true);
              try {
                const fileExt = file.name.split(".").pop();
                const fileName = `featured-${Date.now()}.${fileExt}`;
                const filePath = `featured/${fileName}`;
                // Upload to Supabase Storage
                const { error: storageError } = await supabase.storage
                  .from("car-uploads")
                  .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type || "video/mp4",
                  });
                if (storageError) throw storageError;
                const { data: urlData } = supabase.storage
                  .from("car-uploads")
                  .getPublicUrl(filePath);
                // Remove existing featured video
                if (featuredVideo) {
                  if (featuredVideo.file_path) await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]);
                  await supabase.from("featured_video").delete().eq("id", featuredVideo.id);
                }
                // Save to DB
                const { data: saved, error: dbError } = await supabase.from("featured_video").insert({
                  video_url: urlData.publicUrl,
                  file_path: filePath,
                  title: videoTitle.trim() || null,
                  description: videoDescription.trim() || null,
                  uploaded_at: new Date().toISOString(),
                }).select().single();
                if (dbError) throw dbError;
                setFeaturedVideo(saved);
                setVideoTitle(""); setVideoDescription("");
                alert("✅ Video uploaded and published to /standings!");
              } catch (err) {
                console.error("Video upload error:", err);
                alert(`Upload failed: ${err.message}`);
              }
              setVideoUploading(false);
              if (videoFileInputRef.current) videoFileInputRef.current.value = "";
            }}
          />
          <button
            style={{ ...primaryButtonStyle, opacity: videoUploading ? 0.6 : 1 }}
            disabled={videoUploading}
            onClick={() => videoFileInputRef.current?.click()}
          >
            {videoUploading ? "⏳ Uploading..." : "📁 Choose Video File"}
          </button>
          {videoUploading && (
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>Uploading — large files may take a moment...</div>
          )}
        </div>
        {/* Backup & Restore */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Backup & Restore</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Export the active season, export all seasons, or import a backup.</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={exportBackup} style={primaryButtonStyle}>Export Active Season</button>
            <button onClick={exportAllSeasonsBackup} style={secondaryButtonStyle}>Export All Seasons</button>
            <button onClick={() => importFileRef.current?.click()} style={secondaryButtonStyle}>Import Backup</button>
            <input ref={importFileRef} type="file" accept=".json,application/json" onChange={handleImportBackup} style={{ display: "none" }} />
          </div>
        </div>
        {/* Driver Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Management</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Enter driver name" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={newDriverNumber} onChange={(e) => setNewDriverNumber(e.target.value)} placeholder="Enter car number" type="number" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Manufacturer</div><select style={inputStyle} value={newDriverManufacturer} onChange={(e) => setNewDriverManufacturer(e.target.value)}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={newDriverTeam} onChange={(e) => setNewDriverTeam(e.target.value)} placeholder="e.g. B2J, 19XI, BXM, MER, NLM, BWR" /></div>
          </div>
          <div style={{ marginBottom: 18 }}><button onClick={addDriver} style={primaryButtonStyle}>Add Driver</button></div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>{drivers.map((d) => (<tr key={d.id}><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.manufacturer || "—"}</td><td style={tdStyle}>{getTeamFullName(d.team)} <span style={{ fontSize: 11, opacity: 0.55 }}>({d.team})</span></td><td style={tdStyle}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button onClick={() => openEditDriver(d)} style={secondaryButtonStyle}>Edit</button>{d.retired ? (<button onClick={() => unretireDriver(d.id)} style={secondaryButtonStyle}>Unretire</button>) : (<button onClick={() => retireDriver(d.id)} style={{ ...secondaryButtonStyle, color: "#f59e0b", borderColor: "#f59e0b" }}>Retire</button>)}<button onClick={() => removeDriver(d.id)} style={dangerButtonStyle}>Remove</button></div></td></tr>))}</tbody>
            </table>
          </div>
          {editingDriverId && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid #313947" }}>
              <h3 style={{ marginTop: 0 }}>Edit Driver</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Driver Name</div><input style={inputStyle} value={editDriverForm.name} onChange={(e) => setEditDriverForm({ ...editDriverForm, name: e.target.value })} /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Number</div><input style={inputStyle} value={editDriverForm.number} onChange={(e) => setEditDriverForm({ ...editDriverForm, number: e.target.value })} type="number" /></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Manufacturer</div><select style={inputStyle} value={editDriverForm.manufacturer} onChange={(e) => setEditDriverForm({ ...editDriverForm, manufacturer: e.target.value })}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
                <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Team (abbreviation)</div><input style={inputStyle} value={editDriverForm.team} onChange={(e) => setEditDriverForm({ ...editDriverForm, team: e.target.value })} placeholder="e.g. B2J, 19XI, BXM, MER, NLM, BWR" /></div>
              </div>
              <div style={{ display: "flex", gap: 10 }}><button onClick={saveDriverEdit} style={primaryButtonStyle}>Save Changes</button><button onClick={cancelEditDriver} style={secondaryButtonStyle}>Cancel</button></div>
            </div>
          )}
        </div>
        {/* Pending Driver Signups */}
        {pendingDrivers.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Pending Driver Signups ({pendingDrivers.length})</h2>
            <div style={{ opacity: 0.78, marginBottom: 14 }}>New drivers have submitted their information. Review and approve them to add to the league.</div>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Driver Name</th><th style={thStyle}>#</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team</th><th style={thStyle}>Submitted</th><th style={thStyle}>Actions</th></tr></thead>
                <tbody>
                  {pendingDrivers.map((d) => (
                    <tr key={d.id}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{d.driver_name}</td>
                      <td style={tdStyle}>{d.car_number}</td>
                      <td style={tdStyle}>{d.manufacturer}</td>
                      <td style={tdStyle}>{d.team_name}</td>
                      <td style={{ ...tdStyle, fontSize: 12, opacity: 0.8 }}>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => approvePendingDriver(d)} style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Approve</button>
                          <button onClick={() => rejectPendingDriver(d)} style={{ ...dangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Track Management */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Track Management</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Add or remove tracks from the race schedule. Stage count controls how many scoring stages each track has (1, 2, or 3).</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Track Name</div><input style={inputStyle} value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Example: Bristol Night Race" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Stage Count</div><select style={inputStyle} value={newTrackStageCount} onChange={(e) => setNewTrackStageCount(Number(e.target.value))}><option value={1}>1 stage</option><option value={2}>2 stages</option><option value={3}>3 stages</option></select></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <button onClick={addTrack} style={primaryButtonStyle}>Add Track</button>
            <button onClick={restoreDefaultTracks} style={secondaryButtonStyle}>Restore Default Schedule</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Track Name</th><th style={thStyle}>Stage Count</th><th style={thStyle}>Used in History?</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr><td style={tdStyle} colSpan={4}><div style={{ opacity: 0.75 }}>No tracks defined. Add one above or restore the default schedule.</div></td></tr>
                ) : tracks.map((t) => {
                  const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === t.name));
                  return (
                    <tr key={t.name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{t.name}</td>
                      <td style={tdStyle}>
                        <select style={{ ...inputStyle, maxWidth: 160 }} value={t.stageCount} onChange={(e) => updateTrackStageCount(t.name, e.target.value)}>
                          <option value={1}>1 stage</option>
                          <option value={2}>2 stages</option>
                          <option value={3}>3 stages</option>
                        </select>
                      </td>
                      <td style={tdStyle}>{usedInHistory ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>Yes</span> : <span style={{ opacity: 0.7 }}>No</span>}</td>
                      <td style={tdStyle}><button onClick={() => removeTrack(t.name)} style={dangerButtonStyle}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Start & Park Requests */}
        <div style={{ ...sectionCardStyle, borderColor: "#d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 6 }}>Start & Park Requests</h2>
              <div style={{ opacity: 0.72, fontSize: 13 }}>
                Drivers and Team HQ can request Start & Park until Saturday 9:00 PM ET. Admin approval places approved cars at the rear by request receipt order.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={loadStartParkRequests} style={secondaryButtonStyle}>{startParkRequestsLoading ? "Loading..." : "Refresh Requests"}</button>
              <button onClick={applyApprovedStartParkRequestsToRace} style={primaryButtonStyle}>Apply Approved to Selected Race</button>
            </div>
          </div>

          {startParkRequestError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{startParkRequestError}</div>}
          {startParkRequestStatus && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{startParkRequestStatus}</div>}

          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table style={{ ...tableStyle, minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Race</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Team</th>
                  <th style={thStyle}>Requested By</th>
                  <th style={thStyle}>Received</th>
                  <th style={thStyle}>Reason</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).map((request, index) => {
                  const status = String(request.status || "pending").toLowerCase();
                  return (
                    <tr key={request.id || `${request.driver_number}-${request.created_at}`}>
                      <td style={tdStyle}>#{index + 1}</td>
                      <td style={tdStyle}>{request.race_name || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{request.driver_number} {request.driver_name}</td>
                      <td style={tdStyle}>{getTeamFullName(request.team || request.requested_by_team || "")}</td>
                      <td style={tdStyle}>{request.requested_by_type || "—"} · {request.requested_by_name || request.requested_by_team || "—"}</td>
                      <td style={tdStyle}>{request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>{request.reason || "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: status === "approved" ? "#4ade80" : status === "declined" ? "#f87171" : status === "applied" ? "#d4af37" : "white" }}>{status.toUpperCase()}</td>
                      <td style={tdStyle}>
                        {status === "pending" ? (
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => updateStartParkRequestStatus(request, "approved")} style={{ ...primaryButtonStyle, padding: "7px 10px", fontSize: 12 }}>Approve</button>
                            <button onClick={() => updateStartParkRequestStatus(request, "declined")} style={{ ...dangerButtonStyle, padding: "7px 10px", fontSize: 12 }}>Decline</button>
                          </div>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {!(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).length && (
                  <tr><td style={tdStyle} colSpan={9}>No Start & Park requests for the selected race.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enter Race Results */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingRaceName ? `Edit Race: ${editingRaceName}` : "Enter Race Results"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race</label>
              <select style={inputStyle} value={selectedRace} onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}>
                <option value="">Select a race</option>
                {tracks.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Stage Setup</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", minHeight: 42 }}>{selectedRace ? `${stageCount} scoring stage${stageCount === 1 ? "" : "s"}` : "Select a race to view stage count"}</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...tableStyle, minWidth: 1550 }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, minWidth: 72 }}>#</th><th style={{ ...thStyle, minWidth: 190 }}>Driver</th><th style={{ ...thStyle, minWidth: 170 }}>Team</th>
                  <th style={raceEntryThStyle}>Finish</th>
                  {stageCount >= 1 && <th style={raceEntryThStyle}>Stage 1</th>}
                  {stageCount >= 2 && <th style={raceEntryThStyle}>Stage 2</th>}
                  {stageCount === 3 && <th style={raceEntryThStyle}>Stage 3</th>}
                  <th style={{ ...thStyle, minWidth: 90 }}>DNF</th><th style={{ ...thStyle, minWidth: 120 }}>Start & Park</th><th style={{ ...thStyle, minWidth: 110 }}>Fastest Lap</th>
                  <th style={{ ...thStyle, minWidth: 110 }}>Offense</th><th style={{ ...thStyle, minWidth: 145 }}>Manual Penalty</th><th style={{ ...thStyle, minWidth: 120 }}>Points Preview</th><th style={{ ...thStyle, minWidth: 280 }}>Notes</th><th style={{ ...thStyle, minWidth: 90 }}>Move</th><th style={{ ...thStyle, minWidth: 120 }}>Offense #</th>
                </tr>
              </thead>
              <tbody>
                {activeDrivers.map((driver) => {
                  const prior = seasonOffenseCounts[driver.id] || 0;
                  const thisOffense = offenseMap[driver.id] ? prior + 1 : null;
                  return (
                    <tr key={driver.id}>
                      <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{driver.number}</div></td>
                      <td style={tdStyle}>{driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team)} <span style={{ fontSize: 11, opacity: 0.5 }}>({driver.team})</span></td>
                      <td style={raceEntryTdStyle}><input type="number" min="1" max="40" style={racePositionInputStyle} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} /></td>
                      {stageCount >= 1 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} /></td>}
                      {stageCount >= 2 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} /></td>}
                      {stageCount === 3 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} /></td>}
                      <td style={tdStyle}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="checkbox" checked={!!dnfMap[driver.id]} onChange={(e) => handleDnfChange(driver.id, e.target.checked)} />DNF
                          </label>
                          {dnfMap[driver.id] && (
                            <select
                              style={{ ...inputStyle, fontSize: 12, padding: "6px 8px" }}
                              value={dnfReasons[driver.id] || ""}
                              onChange={(e) => setDnfReasons({ ...dnfReasons, [driver.id]: e.target.value })}
                            >
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
                      </td>
                      <td style={tdStyle}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={!!startParkMap[driver.id]} onChange={(e) => handleStartParkChange(driver.id, e.target.checked)} />Start & Park
                        </label>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 5 }}>Finish points only; stage points zeroed.</div>
                      </td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="radio" name="fastestLap" checked={!!fastestLapMap[driver.id]} onChange={() => handleFastestLapChange(driver.id)} />FL +1</label></td>
                      <td style={tdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={!!offenseMap[driver.id]} onChange={(e) => handleOffenseChange(driver.id, e.target.checked)} />Offense</label></td>
                      <td style={tdStyle}><input type="number" min="0" style={racePenaltyInputStyle} value={penaltyMap[driver.id] || ""} onChange={(e) => handleManualPenaltyChange(driver.id, e.target.value)} placeholder="0" /></td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: "#d4af37" }}>{(() => { const fp = positions[driver.id] ? pointsTable[(Number(positions[driver.id]) || 1) - 1] || 0 : 0; const sp = startParkMap[driver.id] ? 0 : getStagePoints(stage1[driver.id]) + getStagePoints(stage2[driver.id]) + (stageCount === 3 ? getStagePoints(stage3[driver.id]) : 0); const fl = fastestLapMap[driver.id] ? 1 : 0; const op = thisOffense ? getOffensePenaltyPoints(thisOffense) : 0; const mp = Number(penaltyMap[driver.id] || 0); return fp + sp + fl - op - mp; })()}</td>
                      <td style={tdStyle}><input style={raceNotesInputStyle} value={resultNotesMap[driver.id] || ""} onChange={(e) => handleResultNoteChange(driver.id, e.target.value)} placeholder="Penalty note, ruling, etc." /></td>
                      <td style={tdStyle}><div style={{ display: "flex", gap: 6 }}><button type="button" onClick={() => moveDriverFinishPosition(driver.id, -1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↑</button><button type="button" onClick={() => moveDriverFinishPosition(driver.id, 1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↓</button></div></td>
                      <td style={{ ...tdStyle, color: thisOffense ? "#f87171" : "inherit" }}>
                        {thisOffense ? `#${thisOffense} (-${getOffensePenaltyPoints(thisOffense)} pts)` : prior > 0 ? `${prior} prior` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button onClick={saveResultsDraft} style={secondaryButtonStyle}>Save Admin-Only Draft</button>
            <button onClick={() => submitResults()} style={primaryButtonStyle}>{editingRaceName ? "Update Posted Race" : "Post to Standings"}</button>
            {editingRaceName && <button onClick={clearInputs} style={secondaryButtonStyle}>Cancel Edit</button>}
            <button onClick={clearInputs} style={secondaryButtonStyle}>Clear Inputs</button>
            <button onClick={resetSeason} style={dangerButtonStyle}>Archive + Reset Active Season</button>
          </div>
        </div>
        {/* Admin-Only Results Drafts */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Admin-Only Results Drafts</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Drafts let you capture finishing points, penalties, DNFs, and notes without changing public standings. Post only when race control is ready.</div>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Saved</th><th style={thStyle}>Leader</th><th style={thStyle}>Rows</th><th style={thStyle}>Actions</th></tr></thead>
              <tbody>
                {(raceDrafts || []).length === 0 ? (
                  <tr><td style={tdStyle} colSpan={5}><div style={{ opacity: 0.7 }}>No private drafts saved.</div></td></tr>
                ) : (raceDrafts || []).map((draft) => {
                  const leader = (draft.results || []).find((result) => result.finishPos === 1) || (draft.results || [])[0];
                  return (
                    <tr key={draft.id || draft.raceName}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{draft.raceName}</td>
                      <td style={tdStyle}>{draft.draftSavedAt ? new Date(draft.draftSavedAt).toLocaleString() : "—"}</td>
                      <td style={tdStyle}>{leader ? `#${leader.number} ${leader.name} (${leader.totalRacePoints} pts)` : "—"}</td>
                      <td style={tdStyle}>{(draft.results || []).length}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => loadResultsDraft(draft)} style={secondaryButtonStyle}>Load/Edit</button>
                          <button type="button" onClick={() => postResultsDraft(draft)} style={primaryButtonStyle}>Post to Standings</button>
                          <button type="button" onClick={() => deleteResultsDraft(draft.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Driver Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th></tr></thead>
              <tbody>{sortedDrivers.map((d, i) => (<tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}{d.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td><td style={tdStyle}>{d.dnfs || 0}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Team Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Team Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>{teamStandings.map((t, i) => (<tr key={t.team} onClick={() => (window.location.href = `/team/${t.team}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{getTeamFullName(t.team)}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td><td style={tdStyle}>{t.drivers}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Manufacturer Standings */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Manufacturer Standings</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>{manufacturerStandings.map((m, i) => (<tr key={m.manufacturer} onClick={() => (window.location.href = `/manufacturer/${encodeURIComponent(m.manufacturer)}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{m.manufacturer}</td><td style={tdStyle}>{m.points}</td><td style={tdStyle}>{m.wins}</td><td style={tdStyle}>{m.top3}</td><td style={tdStyle}>{m.top5}</td><td style={tdStyle}>{m.drivers}</td></tr>))}</tbody>
            </table>
          </div>
        </div>
        {/* Race History */}
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Race History</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => downloadRaceHistoryCsv(raceHistory, activeSeason?.name || "Season")}
                style={primaryButtonStyle}
              >
                ⬇️ Download Race History CSV
              </button>
              <button
                type="button"
                onClick={handleDownloadLeagueBackup}
                style={secondaryButtonStyle}
              >
                💾 Backup Results
              </button>
              <button
                type="button"
                onClick={() => backupFileInputRef.current?.click()}
                style={secondaryButtonStyle}
              >
                ♻️ Restore From Backup
              </button>
              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json"
                onChange={handleRestoreLeagueBackup}
                style={{ display: "none" }}
              />
            </div>
          </div>
          {raceHistory.length === 0 ? <div style={{ opacity: 0.75 }}>No races entered yet.</div> : (
            <div style={{ display: "grid", gap: 16 }}>
              {raceHistory.map((race) => {
                const winner = race.results?.find((r) => r.finishPos === 1);
                return (
                  <div key={race.raceName} style={{ background: "#10141b", border: "1px solid #2b3441", borderRadius: 14, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800 }}>{race.raceName}</div>
                        <div style={{ opacity: 0.75 }}>{race.stageCount} scoring stage{race.stageCount === 1 ? "" : "s"}{winner ? ` • Winner: #${winner.number} ${winner.name}` : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleEditRace(race)} style={secondaryButtonStyle}>Edit</button>
                        <button onClick={() => handleDeleteRace(race.raceName)} style={dangerButtonStyle}>Delete</button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Finish</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th>
                            <th style={thStyle}>Race Pts</th>
                            {race.stageCount >= 1 && <th style={thStyle}>S1</th>}
                            {race.stageCount >= 2 && <th style={thStyle}>S2</th>}
                            {race.stageCount === 3 && <th style={thStyle}>S3</th>}
                            <th style={thStyle}>FL</th><th style={thStyle}>DNF</th><th style={thStyle}>Start & Park</th>
                            <th style={thStyle}>Offense</th><th style={thStyle}>Penalty</th><th style={thStyle}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {race.results.map((r) => (
                            <tr key={r.driverId}>
                              <td style={tdStyle}>{r.finishPos ?? "—"}</td>
                              <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{r.number}</div></td>
                              <td style={tdStyle}>{r.name}</td>
                              <td style={tdStyle}>{getTeamFullName(r.team)}</td>
                              <td style={tdStyle}>{r.finishPoints}</td>
                              {race.stageCount >= 1 && <td style={tdStyle}>{r.stage1Points}</td>}
                              {race.stageCount >= 2 && <td style={tdStyle}>{r.stage2Points}</td>}
                              {race.stageCount === 3 && <td style={tdStyle}>{r.stage3Points}</td>}
                              <td style={tdStyle}>{r.fastestLap ? "+1" : "—"}</td>
                              <td style={tdStyle}>{r.dnf ? (r.dnfReason ? `DNF (${r.dnfReason})` : "DNF") : "—"}</td>
                              <td style={tdStyle}>{r.startPark ? "Yes" : "—"}</td>
                              <td style={tdStyle}>{r.offense ? `#${r.offenseNumber}` : "—"}</td>
                              <td style={{ ...tdStyle, color: r.penaltyPoints > 0 ? "#f87171" : "inherit" }}>{r.penaltyPoints > 0 ? `-${r.penaltyPoints}` : "0"}</td>
                              <td style={{ ...tdStyle, fontWeight: 800 }}>{r.totalRacePoints}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Offense Log */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Offense Log</h2>
          {offenseLog.length === 0 ? <div style={{ opacity: 0.75 }}>No offenses logged yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Offense #</th><th style={thStyle}>Penalty</th></tr></thead>
                <tbody>
                  {offenseLog.map((entry, i) => (
                    <tr key={`${entry.raceName}-${entry.number}-${i}`}>
                      <td style={tdStyle}>{entry.raceName}</td>
                      <td style={tdStyle}>{entry.number}</td>
                      <td style={tdStyle}>{entry.name}</td>
                      <td style={tdStyle}>#{entry.offenseNumber}</td>
                      <td style={{ ...tdStyle, color: "#f87171" }}>-{entry.penaltyPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
