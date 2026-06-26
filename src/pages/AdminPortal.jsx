import React, { useEffect, useState } from "react";

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
  const goAdmin = () => {
    if (window.location.pathname !== "/admin") {
      window.location.pathname = "/admin";
      return;
    }
    if (typeof setViewMode === "function") setViewMode("admin");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };


  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [adminMessagesOpen, setAdminMessagesOpen] = useState(false);
  const [adminComposerOpen, setAdminComposerOpen] = useState(false);
  const [adminUnreadMessages, setAdminUnreadMessages] = useState([]);
  const [adminMessagesLoading, setAdminMessagesLoading] = useState(false);
  const [adminMessagesError, setAdminMessagesError] = useState("");
  const [financeTransactions, setFinanceTransactions] = useState([]);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeError, setFinanceError] = useState("");
  const [financeDepartmentOpen, setFinanceDepartmentOpen] = useState(false);
  const [publicRelationsOpen, setPublicRelationsOpen] = useState(false);
  const [publicRelationsTab, setPublicRelationsTab] = useState("overview");
  const [hrDepartmentOpen, setHrDepartmentOpen] = useState(false);
  const [hrTab, setHrTab] = useState("overview");
  const [raceOperationsOpen, setRaceOperationsOpen] = useState(false);
  const [raceOperationsTab, setRaceOperationsTab] = useState("overview");
  const [hrLocalRefresh, setHrLocalRefresh] = useState(0);
  const [financeAction, setFinanceAction] = useState("overview");
  const [financeActionStatus, setFinanceActionStatus] = useState("");
  const [financeActionError, setFinanceActionError] = useState("");
  const [financeContracts, setFinanceContracts] = useState([]);
  const [financeContractsLoading, setFinanceContractsLoading] = useState(false);
  const [hrAccessStatus, setHrAccessStatus] = useState("");
  const [hrAccessError, setHrAccessError] = useState("");
  const [selectedAccessDriverNumber, setSelectedAccessDriverNumber] = useState("");
  const [accessCodeModalDriverNumber, setAccessCodeModalDriverNumber] = useState("");
  const [showAccessCodePassword, setShowAccessCodePassword] = useState(false);
  const [financeForm, setFinanceForm] = useState({ driverId: "", team: "", amount: "", reason: "", note: "" });
  const [adminViewportWidth, setAdminViewportWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setAdminViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isAdminMobile = adminViewportWidth < 760;
  const adminUnreadCount = adminUnreadMessages.length;

  const accessDrivers = (visibleDrivers || drivers || []).filter((driver) => driver?.number && !isInactivePlaceholderDriver?.(driver));
  const selectedAccessDriver = accessDrivers.find((driver) => String(driver.number) === String(selectedAccessDriverNumber)) || accessDrivers[0] || null;
  const selectedAccessCodeRow = selectedAccessDriver
    ? (driverAccessCodes || []).find((row) => String(row.driver_number) === String(selectedAccessDriver.number) && row.active !== false)
    : null;
  const selectedAccessCode = selectedAccessCodeRow?.code || "";
  const accessCodeModalDriver = accessDrivers.find((driver) => String(driver.number) === String(accessCodeModalDriverNumber)) || null;
  const accessCodeModalRow = accessCodeModalDriver
    ? (driverAccessCodes || []).find((row) => String(row.driver_number) === String(accessCodeModalDriver.number) && row.active !== false)
    : null;
  const accessCodeModalCode = accessCodeModalRow?.code || "";

  useEffect(() => {
    if (!accessDrivers.length) {
      if (selectedAccessDriverNumber) setSelectedAccessDriverNumber("");
      return;
    }
    const stillExists = accessDrivers.some((driver) => String(driver.number) === String(selectedAccessDriverNumber));
    if (!selectedAccessDriverNumber || !stillExists) {
      setSelectedAccessDriverNumber(String(accessDrivers[0].number));
    }
  }, [accessDrivers.map((driver) => String(driver.number)).join("|"), selectedAccessDriverNumber]);

  function getAdminMessageRecipientLabel(message) {
    const type = String(message?.recipient_type || "").toLowerCase();
    if (message?.recipient_driver_number) return `#${message.recipient_driver_number}`;
    if (type === "team" || message?.recipient_team) return getTeamFullName(message.recipient_team || "Team");
    if (type === "manufacturer" || message?.recipient_manufacturer) return `${message.recipient_manufacturer || "Manufacturer"} Drivers`;
    if (type === "owners") return "Owners Only";
    if (type === "league") return "Entire League";
    return message?.recipient_type || "League";
  }

  async function resetSingleDriverAccessCode(driver) {
    if (!driver) return;
    setHrAccessError("");
    setHrAccessStatus(`Resetting access code for #${driver.number} ${driver.name}...`);
    try {
      await generateDriverAccessCode?.(driver);
      await loadDriverAccessCodes?.();
      setHrAccessStatus(`Access code reset for #${driver.number} ${driver.name}.`);
    } catch (error) {
      console.error("Could not reset driver access code:", error);
      setHrAccessError("Could not reset that driver code. Check driver_access_codes permissions or try again.");
      setHrAccessStatus("");
    }
  }

  async function resetAllDriverAccessCodes() {
    const resetCandidates = (visibleDrivers || []).filter((driver) => driver?.number && !isInactivePlaceholderDriver?.(driver));
    if (!resetCandidates.length) {
      setHrAccessError("No active drivers found to reset.");
      return;
    }
    const ok = window.confirm(`Reset contract access codes for ${resetCandidates.length} active drivers? This will replace their current codes.`);
    if (!ok) return;
    setHrAccessError("");
    setHrAccessStatus(`Resetting ${resetCandidates.length} driver access codes...`);
    try {
      for (const driver of resetCandidates) {
        await generateDriverAccessCode?.(driver);
      }
      await loadDriverAccessCodes?.();
      setHrAccessStatus(`Reset complete. ${resetCandidates.length} driver access codes were regenerated.`);
    } catch (error) {
      console.error("Could not reset all driver access codes:", error);
      setHrAccessError("Could not reset all driver codes. Some may have changed; refresh and verify the list.");
      setHrAccessStatus("");
    }
  }

  async function clearAllDriverAccessCodes() {
    const activeCodeRows = (driverAccessCodes || []).filter((row) => row?.active !== false);
    if (!activeCodeRows.length) {
      setHrAccessError("There are no active driver codes to clear.");
      return;
    }
    const ok = window.confirm(`Clear ${activeCodeRows.length} active driver access codes? Drivers will lose contract access until new codes are generated.`);
    if (!ok) return;
    setHrAccessError("");
    setHrAccessStatus(`Clearing ${activeCodeRows.length} driver access codes...`);
    try {
      for (const row of activeCodeRows) {
        const driver = (visibleDrivers || drivers || []).find((item) => String(item.number) === String(row.driver_number)) || { number: row.driver_number, name: row.driver_name || "Driver" };
        await clearDriverAccessCode?.(driver);
      }
      await loadDriverAccessCodes?.();
      setHrAccessStatus(`Clear complete. ${activeCodeRows.length} driver access codes were removed.`);
    } catch (error) {
      console.error("Could not clear all driver access codes:", error);
      setHrAccessError("Could not clear all driver codes. Refresh and verify the list.");
      setHrAccessStatus("");
    }
  }

  async function loadAdminUnreadMessages() {
    if (!supabase) return;
    setAdminMessagesLoading(true);
    setAdminMessagesError("");

    const { data, error } = await supabase
      .from("league_messages")
      .select("*")
      .eq("is_read", false)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(75);

    if (error) {
      console.error("Could not load admin unread messages:", error);
      setAdminMessagesError("Could not load unread messages. Check league_messages select policy.");
      setAdminUnreadMessages([]);
      setAdminMessagesLoading(false);
      return;
    }

    setAdminUnreadMessages(data || []);
    setAdminMessagesLoading(false);
  }

  async function markAdminMessageRead(messageId) {
    if (!messageId || !supabase) return;
    const { error } = await supabase
      .from("league_messages")
      .update({ is_read: true })
      .eq("id", messageId);

    if (error) {
      console.error("Could not mark admin message read:", error);
      setAdminMessagesError("Could not mark message read. Check league_messages update policy.");
      return;
    }

    setAdminUnreadMessages((current) => current.filter((message) => message.id !== messageId));
  }

  function openAdminMessages() {
    setAdminMessagesOpen(true);
    setAdminComposerOpen(false);
    loadAdminUnreadMessages();
  }

  async function loadFinanceDepartment() {
    if (!supabase) return;
    setFinanceLoading(true);
    setFinanceError("");

    const { data, error } = await supabase
      .from("league_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(75);

    if (error) {
      setFinanceError("Could not load league transactions. Check league_transactions select policy.");
      setFinanceTransactions([]);
      setFinanceLoading(false);
      return;
    }

    setFinanceTransactions(data || []);
    setFinanceLoading(false);
  }

  function openHrDepartment(section = "overview") {
    setHrDepartmentOpen(true);
    setHrTab(section);
    setAdminMenuOpen(false);
    loadDriverAccessCodes?.();
    loadFinanceContracts?.();
  }

  function openFinanceDepartment(section = "overview") {
    setFinanceDepartmentOpen(true);
    setFinanceAction(section);
    loadFinanceDepartment();
    loadFinanceContracts();
  }

  function openRaceOperations() {
    setRaceOperationsOpen(true);
    setAdminMenuOpen(false);
  }

  function openPublicRelations(tab = "overview") {
    setPublicRelationsOpen(true);
    setPublicRelationsTab(tab);
    if (typeof loadTickerMessages === "function") loadTickerMessages();
  }

  function updateFinanceForm(key, value) {
    setFinanceForm((prev) => ({ ...prev, [key]: value }));
  }

  function getDriverDisplayName(driverId) {
    const driver = (visibleDrivers || drivers || []).find((d) => String(d.id) === String(driverId));
    if (!driver) return "Selected Driver";
    return `#${driver.number} ${driver.name}`;
  }

  function getDriverTeam(driverId) {
    const driver = (visibleDrivers || drivers || []).find((d) => String(d.id) === String(driverId));
    return driver?.team || financeForm.team || "League";
  }

  async function loadFinanceContracts() {
    if (!supabase) return;
    setFinanceContractsLoading(true);
    const { data, error } = await supabase
      .from("contract_offers")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      console.warn("Finance contracts load skipped", error);
      setFinanceContracts([]);
      setFinanceContractsLoading(false);
      return;
    }
    setFinanceContracts(data || []);
    setFinanceContractsLoading(false);
  }

  async function recordFinanceTransaction(kind, multiplier = 1) {
    setFinanceActionStatus("");
    setFinanceActionError("");

    const amount = Math.abs(Number(financeForm.amount || (financeAction === "paint" ? 10000 : 0)));
    if (!amount || amount <= 0) {
      setFinanceActionError("Enter a valid dollar amount.");
      return;
    }

    const driverLabel = financeForm.driverId ? getDriverDisplayName(financeForm.driverId) : "League";
    const teamLabel = financeForm.driverId ? getDriverTeam(financeForm.driverId) : financeForm.team || "League";
    const signedAmount = amount * multiplier;
    const payload = {
      type: kind,
      category: kind,
      amount: signedAmount,
      driver_id: financeForm.driverId || null,
      driver_name: driverLabel,
      team: teamLabel,
      note: financeForm.note || financeForm.reason || kind,
      reason: financeForm.reason || kind,
      created_at: new Date().toISOString(),
    };

    if (!supabase) {
      setFinanceActionError("Supabase is not connected, so the transaction could not be saved.");
      return;
    }

    let { error } = await supabase.from("league_transactions").insert([payload]);
    if (error) {
      const fallbackPayload = {
        type: kind,
        amount: signedAmount,
        team: teamLabel,
        note: `${driverLabel} — ${financeForm.note || financeForm.reason || kind}`,
        created_at: new Date().toISOString(),
      };
      const fallback = await supabase.from("league_transactions").insert([fallbackPayload]);
      error = fallback.error;
    }

    if (error) {
      console.error("Finance transaction save error", error);
      setFinanceActionError("Could not save finance transaction. Check league_transactions columns/RLS policy.");
      return;
    }

    setFinanceActionStatus(`${kind} saved for ${driverLabel}.`);
    setFinanceForm({ driverId: "", team: "", amount: "", reason: "", note: "" });
    loadFinanceDepartment();
  }

  const getFinanceAmount = (item) => Number(item?.amount ?? item?.value ?? item?.transaction_amount ?? item?.payout ?? 0) || 0;
  const getFinanceType = (item) => String(item?.type || item?.category || item?.transaction_type || item?.reason || "Transaction");
  const getFinanceTeam = (item) => item?.team || item?.team_abbr || item?.team_name || item?.from_team || item?.to_team || "League";
  const getFinanceNote = (item) => item?.note || item?.notes || item?.description || item?.memo || item?.reason || "League finance activity";
  const getFinanceDate = (item) => item?.created_at || item?.submitted_at || item?.paid_at || item?.updated_at;

  useEffect(() => {
    loadAdminUnreadMessages();
    loadFinanceDepartment();
    const interval = setInterval(loadAdminUnreadMessages, 60000);
    return () => clearInterval(interval);
  }, [supabase]);

  const adminMenuItems = [
    { label: "Admin Home", action: goAdmin, primary: true },
    { label: "Human Resources", action: () => openHrDepartment("overview"), primary: true },
    { label: "Finance Department", action: () => openFinanceDepartment("overview"), primary: true },
    { label: "Public Relations", action: () => openPublicRelations("overview"), primary: true },
    { label: "Race Operations", action: openRaceOperations, primary: true },
    { label: "Ticker Overlay", action: () => setViewMode("overlay-ticker") },
    { label: "Standings", action: () => (window.location.pathname = "/standings") },
    { label: "Streams", action: () => (window.location.pathname = "/streams") },
    { label: "Discord", action: () => (window.location.pathname = "/discord") },
    { label: "News", action: () => (window.location.pathname = "/news") },
    { label: "Notifications", action: () => (window.location.pathname = "/notifications") },
    { label: `Appeals (${openAppealCount || 0})`, action: () => (window.location.pathname = "/appeals") },
    { label: `Stories (${openStoryCount || 0})`, action: () => (window.location.pathname = "/admin/stories") },
    { label: "Car Gallery", action: () => (window.location.pathname = "/admin/car-gallery") },
    { label: "Interviews", action: () => (window.location.pathname = "/admin/interviews") },
    { label: "Voting", action: () => (window.location.pathname = "/admin/votes") },
    { label: "Export App Data JSON", action: exportAppDataJson, primary: true },
    { label: "Logout", action: logoutAdmin, danger: true },
  ];

  const adminQuickTiles = [
    { title: "Race Operations", text: "Track management, race input, race drafts, race history, and offense log.", action: openRaceOperations },
    { title: "Messages", text: "Unread inbox, league broadcasts, owner notices, and create-message tools.", action: openAdminMessages },
    { title: "Backup Center", text: "Export, import, restore, and protect league data.", action: () => document.getElementById("admin-backup-center")?.scrollIntoView({ behavior: "smooth", block: "start" }) },
  ];


  const financeTeamWallets = (teamStandings || [])
    .filter((team) => team.team && team.team !== "Independent" && team.team !== "IND")
    .map((team) => ({
      team: team.team,
      name: getTeamFullName(team.team),
      balance: Number(team.budget ?? team.balance ?? team.cash ?? team.money ?? 0) || 0,
      drivers: Number(team.drivers ?? team.driverCount ?? team.count ?? 0) || 0,
    }));

  const financeTransactionTotal = financeTransactions.reduce((sum, item) => sum + getFinanceAmount(item), 0);
  const financeRecentPayouts = financeTransactions.filter((item) => /payout|paint|bonus|race|salary|contract|fine|penalty/i.test(getFinanceType(item) + " " + getFinanceNote(item))).slice(0, 8);

  const seriesJoinRequests = (() => {
    hrLocalRefresh;
    try {
      if (typeof window === "undefined") return [];
      return JSON.parse(localStorage.getItem("series_join_requests") || "[]");
    } catch {
      return [];
    }
  })();

  const pendingSeriesJoinRequests = seriesJoinRequests.filter((request) => {
    return String(request?.status || "pending").toLowerCase() === "pending";
  });

  const pendingHrRequestCount = (pendingDrivers || []).length + pendingSeriesJoinRequests.length;

  function updateSeriesJoinRequestStatus(requestId, status) {
    try {
      const next = seriesJoinRequests.map((request) =>
        String(request.id) === String(requestId)
          ? { ...request, status, reviewedAt: new Date().toISOString() }
          : request
      );
      localStorage.setItem("series_join_requests", JSON.stringify(next));
      setHrLocalRefresh((value) => value + 1);
    } catch (error) {
      console.error("Could not update series join request", error);
      alert("Could not update the league join request. Check local storage and try again.");
    }
  }

  const applePageStyle = {
    ...appShellStyle,
    background:
      "radial-gradient(circle at top left, rgba(255,255,255,0.10), transparent 32%), linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)",
    color: "#111827",
    minHeight: "100vh",
  };

  const appleContainerStyle = {
    ...pageContainerStyle,
    color: "#111827",
  };

  const appleCardStyle = {
    ...sectionCardStyle,
    background: "rgba(255,255,255,0.78)",
    color: "#111827",
    border: "1px solid rgba(255,255,255,0.72)",
    borderRadius: 28,
    boxShadow: "0 24px 70px rgba(15,23,42,0.16)",
    backdropFilter: "blur(18px)",
  };

  const adminNavButtonStyle = {
    border: "1px solid rgba(17,24,39,0.10)",
    background: "rgba(255,255,255,0.72)",
    color: "#111827",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 8px 22px rgba(15,23,42,0.08)",
  };

  const adminPrimaryNavButtonStyle = {
    ...adminNavButtonStyle,
    background: "#111827",
    color: "white",
    border: "1px solid #111827",
  };

  const adminReadableCardStyle = {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
    padding: 20,
    marginBottom: 20,
  };

  const adminReadableSubCardStyle = {
    background: "#f8fafc",
    color: "#111827",
    border: "1px solid #dbe3ee",
    borderRadius: 16,
    padding: 16,
  };

  const adminInputStyle = {
    width: "100%",
    boxSizing: "border-box",
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #9ca3af",
    borderRadius: 12,
    padding: "11px 12px",
    fontSize: 15,
    fontWeight: 700,
    outline: "none",
  };

  const adminTableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    overflow: "hidden",
  };

  const adminThStyle = {
    background: "#111827",
    color: "#ffffff",
    padding: "12px 10px",
    textAlign: "left",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    borderBottom: "1px solid #d1d5db",
    whiteSpace: "nowrap",
  };

  const adminTdStyle = {
    color: "#111827",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 650,
    verticalAlign: "top",
  };

  const adminPrimaryButtonStyle = {
    background: "#111827",
    color: "#ffffff",
    border: "1px solid #111827",
    borderRadius: 12,
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
  };

  const adminSecondaryButtonStyle = {
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #9ca3af",
    borderRadius: 12,
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
  };

  const adminDangerButtonStyle = {
    background: "#b42318",
    color: "#ffffff",
    border: "1px solid #b42318",
    borderRadius: 12,
    padding: "11px 14px",
    fontWeight: 900,
    cursor: "pointer",
  };

  const adminMutedTextStyle = { color: "#4b5563" };

  const adminMenuButtonStyle = {
    width: 50,
    height: 50,
    borderRadius: 16,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
  };

  const adminMenuLineStyle = {
    width: 22,
    height: 2,
    borderRadius: 999,
    background: "#111827",
  };

  const adminMenuPanelStyle = {
    position: "absolute",
    right: 0,
    top: 62,
    zIndex: 20,
    width: "min(360px, calc(100vw - 48px))",
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(17,24,39,0.10)",
    borderRadius: 24,
    boxShadow: "0 28px 80px rgba(15,23,42,0.22)",
    padding: 12,
    backdropFilter: "blur(18px)",
  };

  const adminTileStyle = {
    background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    boxShadow: "0 14px 38px rgba(15,23,42,0.08)",
    padding: 20,
    textAlign: "left",
    cursor: "pointer",
    minHeight: 138,
  };

  const adminTileKickerStyle = {
    width: 38,
    height: 5,
    borderRadius: 999,
    background: "#111827",
    marginBottom: 16,
  };

  const adminMessageIconButtonStyle = {
    position: "relative",
    width: 54,
    height: 54,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.75)",
    background: "linear-gradient(180deg, #34d399 0%, #10b981 100%)",
    color: "white",
    boxShadow: "0 16px 38px rgba(16,185,129,0.30)",
    cursor: "pointer",
    fontSize: 27,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const adminMessageBadgeStyle = {
    position: "absolute",
    top: -7,
    right: -7,
    minWidth: 24,
    height: 24,
    padding: "0 7px",
    borderRadius: 999,
    background: "#ef4444",
    color: "white",
    border: "2px solid white",
    fontSize: 12,
    fontWeight: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 18px rgba(239,68,68,0.28)",
  };


  const appleMessagesOverlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(0, 0, 0, 0.34)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px",
    overflowY: "auto",
  };

  const appleMessagesShellStyle = {
    width: "min(1120px, 100%)",
    height: "min(760px, calc(100vh - 36px))",
    background: "#f5f5f7",
    color: "#111827",
    borderRadius: 34,
    border: "1px solid rgba(255,255,255,0.88)",
    boxShadow: "0 36px 110px rgba(0,0,0,0.32)",
    overflow: "hidden",
    display: "grid",
    gridTemplateColumns: "minmax(260px, 340px) 1fr",
  };

  const appleMessagesSidebarStyle = {
    background: "rgba(255,255,255,0.72)",
    borderRight: "1px solid #d8d8dc",
    padding: 18,
    overflowY: "auto",
  };

  const appleMessagesMainStyle = {
    background: "#ffffff",
    padding: 22,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  };

  const appleMessagesTitleRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  };

  const appleMessagesTrafficButtonStyle = {
    width: 14,
    height: 14,
    borderRadius: 999,
    border: 0,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
  };

  const appleMessagesSegmentStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
    background: "#e9e9ed",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  };

  const appleMessagesSegmentButtonStyle = (active) => ({
    border: 0,
    borderRadius: 11,
    padding: "10px 12px",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#111827" : "#6b7280",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: active ? "0 6px 16px rgba(0,0,0,0.08)" : "none",
  });

  const appleComposeButtonStyle = {
    width: "100%",
    border: 0,
    borderRadius: 18,
    padding: "13px 14px",
    background: "linear-gradient(180deg, #34c759 0%, #24a846 100%)",
    color: "white",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: "0 12px 28px rgba(52,199,89,0.24)",
    marginBottom: 12,
  };

  const appleMessageThreadStyle = {
    width: "100%",
    border: 0,
    borderRadius: 18,
    background: "#ffffff",
    color: "#111827",
    padding: 14,
    textAlign: "left",
    cursor: "pointer",
    boxShadow: "0 10px 24px rgba(15,23,42,0.07)",
    marginBottom: 10,
  };


  const walletDepartmentStyle = {
    ...adminReadableCardStyle,
    padding: 24,
    background: "linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)",
    border: "1px solid #e5e7eb",
    boxShadow: "0 22px 60px rgba(15,23,42,0.10)",
  };

  const walletCardStyle = {
    border: 0,
    borderRadius: 28,
    padding: 22,
    color: "white",
    minHeight: 158,
    boxShadow: "0 22px 45px rgba(15,23,42,0.18)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  };

  const walletLightCardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 14px 34px rgba(15,23,42,0.07)",
  };

  const walletTransactionRowStyle = {
    display: "grid",
    gridTemplateColumns: "44px 1fr auto",
    gap: 12,
    alignItems: "center",
    padding: "13px 0",
    borderBottom: "1px solid #eef0f4",
  };

  const walletIconStyle = {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #34c759, #30d158)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 21,
    boxShadow: "0 8px 18px rgba(52,199,89,0.25)",
  };

  const appleMessageBubbleStyle = {
    alignSelf: "flex-start",
    maxWidth: "760px",
    background: "#e9e9ee",
    color: "#111827",
    borderRadius: "24px 24px 24px 7px",
    padding: "14px 16px",
    lineHeight: 1.55,
    whiteSpace: "pre-wrap",
    fontWeight: 650,
  };

  const financeOverlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 9000,
    background: "rgba(245,245,247,0.94)",
    backdropFilter: "blur(24px)",
    overflowY: "auto",
    padding: "28px 18px",
  };

  const financeShellStyle = {
    maxWidth: 1240,
    margin: "0 auto",
    background: "#f5f5f7",
    border: "1px solid rgba(17,24,39,0.10)",
    borderRadius: 34,
    boxShadow: "0 30px 90px rgba(15,23,42,0.22)",
    padding: 22,
  };

  const financeSegmentButtonStyle = (active) => ({
    border: 0,
    borderRadius: 999,
    padding: "11px 15px",
    background: active ? "#111827" : "rgba(255,255,255,0.82)",
    color: active ? "#fff" : "#111827",
    fontWeight: 1000,
    cursor: "pointer",
    boxShadow: active ? "0 10px 22px rgba(15,23,42,0.18)" : "0 4px 12px rgba(15,23,42,0.08)",
  });

  const financeActionCardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
    boxShadow: "0 10px 28px rgba(15,23,42,0.08)",
  };


  const prHeroCardStyle = {
    ...walletCardStyle,
    minHeight: 176,
    background: "linear-gradient(135deg, #111827 0%, #1d4ed8 48%, #7c3aed 100%)",
  };

  const prCardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 26,
    padding: 20,
    boxShadow: "0 16px 42px rgba(15,23,42,0.08)",
  };

  const prIconStyle = {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: "linear-gradient(135deg, #007aff, #5856d6)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    boxShadow: "0 12px 24px rgba(0,122,255,0.22)",
  };

  const prListRowStyle = {
    display: "grid",
    gridTemplateColumns: isAdminMobile ? "44px 1fr" : "52px 1fr auto",
    gap: isAdminMobile ? 10 : 12,
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #eef0f4",
  };

  const prDepartmentShellStyle = {
    ...financeShellStyle,
    width: "100%",
    maxWidth: 1240,
    borderRadius: isAdminMobile ? 22 : 34,
    padding: isAdminMobile ? 14 : 22,
  };

  const prDepartmentHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: isAdminMobile ? "flex-start" : "center",
    gap: 14,
    flexWrap: "nowrap",
    marginBottom: 18,
  };

  const prTitleStyle = {
    margin: "2px 0 0",
    fontSize: isAdminMobile ? 30 : 42,
    letterSpacing: isAdminMobile ? -0.8 : -1.6,
    lineHeight: 1.04,
  };

  const prTabBarStyle = {
    display: "flex",
    gap: 10,
    overflowX: "auto",
    paddingBottom: 8,
    marginBottom: 18,
    WebkitOverflowScrolling: "touch",
  };

  const prOverviewGridStyle = {
    display: "grid",
    gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(235px, 1fr))",
    gap: 14,
    marginTop: 16,
  };

  const prMobileStackStyle = {
    display: "grid",
    gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  };


  return (
    <div style={applePageStyle}>
      <div style={appleContainerStyle}>
        {/* Header */}
        <div style={{ ...appleCardStyle, marginBottom: 22, padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 62, height: 62, borderRadius: 18, background: "linear-gradient(135deg, #111827, #3b4252)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 18px 35px rgba(15,23,42,0.18)", overflow: "hidden" }}>
                <img src={logo} alt="League Logo" style={{ height: 50, objectFit: "contain" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", opacity: 0.62 }}>Budweiser Motorsports</div>
                <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -1 }}>Admin Portal</div>
                <div style={{ opacity: 0.68, marginTop: 2 }}>League control center · drivers · teams · race operations</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                aria-label="Open admin messages"
                onClick={openAdminMessages}
                style={adminMessageIconButtonStyle}
                title="Messages"
              >
                💬
                {adminUnreadCount > 0 && <span style={adminMessageBadgeStyle}>{adminUnreadCount > 99 ? "99+" : adminUnreadCount}</span>}
              </button>

              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  aria-label="Open admin menu"
                  onClick={() => setAdminMenuOpen((open) => !open)}
                  style={adminMenuButtonStyle}
                >
                  <span style={adminMenuLineStyle} />
                  <span style={adminMenuLineStyle} />
                  <span style={adminMenuLineStyle} />
                </button>

                {adminMenuOpen && (
                  <div style={adminMenuPanelStyle}>
                  <div style={{ padding: "8px 10px 12px", borderBottom: "1px solid #e5e7eb", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>Admin Menu</div>
                    <div style={{ fontSize: 20, fontWeight: 1000, color: "#111827" }}>League Control</div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    {adminMenuItems.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setAdminMenuOpen(false);
                          item.action?.();
                        }}
                        style={{
                          border: 0,
                          borderRadius: 14,
                          background: item.primary ? "#111827" : item.danger ? "#fff1f2" : "#f8fafc",
                          color: item.primary ? "#ffffff" : item.danger ? "#b42318" : "#111827",
                          padding: "12px 14px",
                          textAlign: "left",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ ...adminReadableCardStyle, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.6, textTransform: "uppercase", color: "#6b7280" }}>Command Center</div>
              <h2 style={{ margin: "4px 0 0", fontSize: 30, letterSpacing: -0.8 }}>Quick Admin Tiles</h2>
              <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 650 }}>Everything important is grouped into cleaner Apple-style cards instead of a crowded button bar.</p>
            </div>
            <button onClick={goAdmin} style={adminPrimaryButtonStyle}>Refresh Admin Home</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: 14 }}>
            {adminQuickTiles.map((tile) => (
              <button key={tile.title} type="button" onClick={tile.action} style={adminTileStyle}>
                <div style={adminTileKickerStyle} />
                <div style={{ fontSize: 20, fontWeight: 1000, marginBottom: 8, letterSpacing: -0.3 }}>{tile.title}</div>
                <div style={{ color: "#4b5563", fontWeight: 650, lineHeight: 1.45 }}>{tile.text}</div>
              </button>
            ))}
          </div>
        </div>


        {publicRelationsOpen && (
          <div style={financeOverlayStyle}>
            <div style={prDepartmentShellStyle}>
              <div style={prDepartmentHeaderStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", color: "#6b7280" }}>Board Workspace</div>
                  <h1 style={prTitleStyle}>Public Relations</h1>
                  <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 750, maxWidth: 760 }}>Board posting center for ticker promos, previous race winner spotlights, featured media, Ones to Watch, stories, and interviews.</p>
                </div>
                <button type="button" onClick={() => setPublicRelationsOpen(false)} style={{ flex: "0 0 auto", border: 0, borderRadius: 999, background: "#ffffff", color: "#111827", width: isAdminMobile ? 42 : 46, height: isAdminMobile ? 42 : 46, fontSize: 23, fontWeight: 1000, cursor: "pointer", boxShadow: "0 8px 20px rgba(15,23,42,0.12)" }}>×</button>
              </div>


              <div style={prTabBarStyle}>
                {[
                  ["overview", "PR Home"],
                  ["ticker", "Ticker"],
                  ["winner", "Race Winner"],
                  ["media", "Featured Media"],
                  ["watch", "Ones to Watch"],
                  ["stories", "Stories"],
                  ["interviews", "Interviews"],
                ].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setPublicRelationsTab(key)} style={{ ...financeSegmentButtonStyle(publicRelationsTab === key), flex: "0 0 auto" }}>{label}</button>
                ))}
              </div>

              {publicRelationsTab === "overview" && (
                <div>
                  <div style={prHeroCardStyle}>
                    <div style={{ position: "absolute", right: -40, top: -40, width: 150, height: 150, borderRadius: 999, background: "rgba(255,255,255,0.12)" }} />
                    <div>
                      <div style={{ opacity: 0.78, fontWeight: 1000, letterSpacing: 1.7, textTransform: "uppercase", fontSize: 12 }}>Board PR Department</div>
                      <div style={{ fontSize: isAdminMobile ? 28 : 36, fontWeight: 1000, letterSpacing: -1.2, marginTop: 10 }}>Create. Review. Publish.</div>
                    </div>
                    <div style={{ opacity: 0.88, fontWeight: 850 }}>Internal board tools for every public-facing league post</div>
                  </div>

                  <div style={prOverviewGridStyle}>
                    {[
                      ["📣", "Ticker Promotions", `${tickerMessages?.filter?.((m) => m.active !== false)?.length || 0} active messages`, "ticker"],
                      ["🏆", "Race Winner", latestWinner ? `Latest: #${latestWinner.number || ""} ${latestWinner.name || latestWinner.driver || "Winner"}` : "Manage winner spotlight", "winner"],
                      ["✨", "Featured Media", featuredVideo ? (featuredVideo.title || "Featured media live") : "Post a photo or video", "media"],
                      ["🔥", "Ones to Watch", `${manualWatchPicks?.filter?.((p) => p.active !== false)?.length || 0} active picks`, "watch"],
                      ["📰", "Stories", `${openStoryCount || 0} open stories`, "stories"],
                      ["🎤", "Interviews", "Pre-race and post-race media", "interviews"],
                    ].map(([icon, title, text, tab]) => (
                      <button key={title} type="button" onClick={() => setPublicRelationsTab(tab)} style={{ ...prCardStyle, textAlign: "left", cursor: "pointer" }}>
                        <div style={prIconStyle}>{icon}</div>
                        <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 14, letterSpacing: -0.4 }}>{title}</div>
                        <div style={{ color: "#6b7280", fontWeight: 750, marginTop: 6, lineHeight: 1.45 }}>{text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {publicRelationsTab === "ticker" && (
                <div style={prCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Ticker Promotions</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 28, letterSpacing: -0.7 }}>Board Ticker Posts</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>Create and manage the ticker posts that the board wants displayed across the league app.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={loadTickerMessages} style={adminSecondaryButtonStyle}>Refresh</button>
                      <button type="button" onClick={seedWeeklyTickerMessages} style={adminPrimaryButtonStyle}>Add Weekly Headlines</button>
                    </div>
                  </div>

                  <form onSubmit={saveTickerMessage} style={{ background: "#f5f5f7", border: "1px solid #e5e7eb", borderRadius: 22, padding: 16, marginBottom: 16 }}>
                    <div style={prMobileStackStyle}>
                      <label style={{ fontWeight: 900 }}>Category
                        <select style={{ ...adminInputStyle, marginTop: 6 }} value={tickerForm.category} onChange={(event) => setTickerForm((current) => ({ ...current, category: event.target.value }))}>
                          <option value="BREAKING">BREAKING</option><option value="NEWS">NEWS</option><option value="TRANSACTION">TRANSACTION</option><option value="TEAM UPDATE">TEAM UPDATE</option><option value="RACE CONTROL">RACE CONTROL</option><option value="RESULTS">RESULTS</option><option value="APP UPDATE">APP UPDATE</option><option value="NEXT EVENT">NEXT EVENT</option><option value="SPONSOR">SPONSOR</option>
                        </select>
                      </label>
                      <label style={{ fontWeight: 900 }}>Page
                        <select style={{ ...adminInputStyle, marginTop: 6 }} value={tickerForm.page} onChange={(event) => setTickerForm((current) => ({ ...current, page: event.target.value }))}>
                          <option value="standings">/standings only</option><option value="all">All pages using ticker</option>
                        </select>
                      </label>
                      <label style={{ fontWeight: 900 }}>Sort Order
                        <input type="number" style={{ ...adminInputStyle, marginTop: 6 }} value={tickerForm.sort_order} onChange={(event) => setTickerForm((current) => ({ ...current, sort_order: event.target.value }))} />
                      </label>
                      <label style={{ fontWeight: 900 }}>Auto-Expire
                        <input type="datetime-local" style={{ ...adminInputStyle, marginTop: 6 }} value={tickerForm.expires_at} onChange={(event) => setTickerForm((current) => ({ ...current, expires_at: event.target.value }))} />
                      </label>
                    </div>
                    <label style={{ display: "block", fontWeight: 900, marginTop: 12 }}>Ticker Message
                      <input style={{ ...adminInputStyle, marginTop: 6 }} value={tickerForm.message} onChange={(event) => setTickerForm((current) => ({ ...current, message: event.target.value }))} placeholder="Example: Las Vegas race week is live • Playoff pressure is building" />
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}><input type="checkbox" checked={tickerForm.active} onChange={(event) => setTickerForm((current) => ({ ...current, active: event.target.checked }))} />Active</label>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}><input type="checkbox" checked={tickerForm.pinned} onChange={(event) => setTickerForm((current) => ({ ...current, pinned: event.target.checked }))} />Pin First</label>
                      <button type="submit" style={adminPrimaryButtonStyle}>{editingTickerId ? "Save Ticker Message" : "Add Ticker Message"}</button>
                      {editingTickerId && <button type="button" onClick={resetTickerForm} style={adminSecondaryButtonStyle}>Cancel Edit</button>}
                    </div>
                    {tickerStatus && <div style={{ color: "#047857", marginTop: 12, fontWeight: 900 }}>{tickerStatus}</div>}
                    {tickerError && <div style={{ color: "#b42318", marginTop: 12, fontWeight: 900 }}>{tickerError}</div>}
                  </form>

                  <div style={{ maxHeight: 460, overflowY: "auto" }}>
                    {(tickerMessages || []).length === 0 ? (
                      <div style={{ color: "#6b7280", fontWeight: 800, padding: 16 }}>No ticker messages saved yet.</div>
                    ) : tickerMessages.map((item) => (
                      <div key={item.id} style={prListRowStyle}>
                        <div style={{ ...prIconStyle, background: item.active === false ? "linear-gradient(135deg, #8e8e93, #636366)" : "linear-gradient(135deg, #34c759, #30d158)" }}>{item.pinned ? "📌" : "📣"}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 1000, color: "#111827" }}>{item.category || "NEWS"}</div>
                          <div style={{ color: "#4b5563", fontWeight: 750, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.message}</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <button type="button" onClick={() => editTickerMessage(item)} style={adminSecondaryButtonStyle}>Edit</button>
                          <button type="button" onClick={() => toggleTickerActive(item)} style={adminSecondaryButtonStyle}>{item.active === false ? "Activate" : "Disable"}</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {publicRelationsTab === "winner" && (
                <div style={prCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Board Winner Spotlight</div>
                  <h2 style={{ margin: "3px 0 14px", fontSize: 28, letterSpacing: -0.7 }}>Previous Race Winner Post</h2>
                  <PreviousRaceWinnerAdminPanel drivers={visibleDrivers} raceHistory={raceHistory} />
                </div>
              )}

              {publicRelationsTab === "media" && (
                <div style={prCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Featured Media</div>
                  <h2 style={{ margin: "3px 0 6px", fontSize: 28, letterSpacing: -0.7 }}>Photos & Videos</h2>
                  <p style={{ margin: "0 0 16px", color: "#4b5563", fontWeight: 700 }}>Post the media the board wants featured: race hype videos, winner photos, paint scheme images, promo graphics, and recap clips.</p>
                  {featuredVideo && (
                    <div style={{ background: "#f5f5f7", border: "1px solid #e5e7eb", borderRadius: 28, padding: 18, marginBottom: 18, boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase", color: "#6b7280" }}>Currently Featured</div>
                          <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.5 }}>{featuredVideo.title || "Untitled Media"}</div>
                          {featuredVideo.description && <div style={{ color: "#6b7280", fontWeight: 700, marginTop: 3 }}>{featuredVideo.description}</div>}
                        </div>
                        <button style={adminDangerButtonStyle} onClick={async () => { if (!window.confirm("Remove the featured media?")) return; if (featuredVideo.file_path) await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]); await supabase.from("featured_video").delete().eq("id", featuredVideo.id); setFeaturedVideo(null); }}>Remove</button>
                      </div>
                      {String(featuredVideo.file_path || featuredVideo.video_url || "").match(/\.(png|jpg|jpeg|gif|webp|avif)$/i) ? (
                        <img alt={featuredVideo.title || "Featured media"} src={featuredVideo.video_url} style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 22, background: "#111" }} />
                      ) : (
                        <video controls crossOrigin="anonymous" style={{ width: "100%", maxHeight: 360, borderRadius: 22, background: "#000" }} src={featuredVideo.video_url} />
                      )}
                    </div>
                  )}
                  <div style={{ ...prMobileStackStyle, marginBottom: 14 }}>
                    <div>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>Title</div>
                      <input style={{ ...adminInputStyle, marginTop: 6 }} value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. Las Vegas Winner Photo" />
                    </div>
                    <div>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>Description</div>
                      <input style={{ ...adminInputStyle, marginTop: 6 }} value={videoDescription} onChange={e => setVideoDescription(e.target.value)} placeholder="e.g. Race recap, promo, photo, or playoff preview" />
                    </div>
                  </div>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,video/mp4,video/mov,video/quicktime,video/avi,video/webm"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setVideoUploading(true);
                      try {
                        const fileExt = file.name.split(".").pop();
                        const isImage = file.type?.startsWith("image/");
                        const fileName = `featured-media-${Date.now()}.${fileExt}`;
                        const filePath = `featured/${fileName}`;
                        const { error: storageError } = await supabase.storage.from("car-uploads").upload(filePath, file, {
                          cacheControl: "3600",
                          upsert: false,
                          contentType: file.type || (isImage ? "image/jpeg" : "video/mp4"),
                        });
                        if (storageError) throw storageError;
                        const { data: urlData } = supabase.storage.from("car-uploads").getPublicUrl(filePath);
                        if (featuredVideo) {
                          if (featuredVideo.file_path) await supabase.storage.from("car-uploads").remove([featuredVideo.file_path]);
                          await supabase.from("featured_video").delete().eq("id", featuredVideo.id);
                        }
                        const { data: saved, error: dbError } = await supabase.from("featured_video").insert({
                          video_url: urlData.publicUrl,
                          file_path: filePath,
                          title: videoTitle.trim() || (isImage ? "Featured Photo" : "Featured Video"),
                          description: videoDescription.trim() || null,
                          uploaded_at: new Date().toISOString(),
                        }).select().single();
                        if (dbError) throw dbError;
                        setFeaturedVideo(saved);
                        setVideoTitle("");
                        setVideoDescription("");
                        alert(`✅ ${isImage ? "Photo" : "Video"} posted to Featured Media.`);
                      } catch (err) {
                        console.error("Featured media upload error:", err);
                        alert(`Upload failed: ${err.message}`);
                      }
                      setVideoUploading(false);
                      if (videoFileInputRef.current) videoFileInputRef.current.value = "";
                    }}
                  />
                  <button type="button" disabled={videoUploading} onClick={() => videoFileInputRef.current?.click()} style={{ ...adminPrimaryButtonStyle, opacity: videoUploading ? 0.65 : 1 }}>{videoUploading ? "Uploading..." : "Post Photo or Video"}</button>
                </div>
              )}

              {publicRelationsTab === "watch" && (
                <div style={prCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Ones to Watch</div>
                  <h2 style={{ margin: "3px 0 6px", fontSize: 28, letterSpacing: -0.7 }}>Race Weekend Storylines</h2>
                  <p style={{ margin: "0 0 16px", color: "#4b5563", fontWeight: 700 }}>Choose the drivers the board wants promoted on the standings page. Manual picks override the automatic watch list.</p>
                  <div style={{ ...prMobileStackStyle, marginBottom: 14 }}>
                    <div>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>Driver</div>
                      <select style={adminInputStyle} value={watchDriverId} onChange={(e) => setWatchDriverId(e.target.value)}>
                        <option value="">Select driver...</option>
                        {visibleDrivers.map((d) => <option key={d.id} value={d.id}>#{d.number} {d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>Badge</div>
                      <select style={adminInputStyle} value={watchBadge} onChange={(e) => setWatchBadge(e.target.value)}>
                        <option value="DIRECTOR PICK">DIRECTOR PICK</option>
                        <option value="HOT SEAT">HOT SEAT</option>
                        <option value="MOMENTUM">MOMENTUM</option>
                        <option value="UNDERDOG">UNDERDOG</option>
                        <option value="REBOUND WATCH">REBOUND WATCH</option>
                        <option value="TITLE THREAT">TITLE THREAT</option>
                      </select>
                    </div>
                    <div>
                      <div style={{ marginBottom: 6, fontWeight: 900 }}>Display Order</div>
                      <input style={adminInputStyle} type="number" min="1" value={watchDisplayOrder} onChange={(e) => setWatchDisplayOrder(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ marginBottom: 6, fontWeight: 900 }}>Reason / Storyline</div>
                    <input style={adminInputStyle} value={watchReason} onChange={(e) => setWatchReason(e.target.value)} placeholder="Example: Coming off a podium and showing long-run speed" />
                  </div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                    <button onClick={addManualWatchPick} disabled={watchSaving} style={{ ...adminPrimaryButtonStyle, opacity: watchSaving ? 0.6 : 1 }}>{watchSaving ? "Saving..." : "Add to Ones to Watch"}</button>
                    <button onClick={loadManualWatchPicks} style={adminSecondaryButtonStyle}>Refresh Picks</button>
                    <button onClick={() => { setWatchDriverId(""); setWatchReason(""); setWatchBadge("DIRECTOR PICK"); setWatchDisplayOrder("1"); }} style={adminSecondaryButtonStyle}>Clear Form</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                    {manualWatchPicks.length === 0 ? (
                      <div style={{ padding: 18, borderRadius: 22, background: "#f5f5f7", color: "#6b7280", fontWeight: 800 }}>No manual picks yet. The standings page will use the automatic watch list.</div>
                    ) : manualWatchPicks.map((pick) => {
                      const driver = drivers.find((d) => Number(d.id) === Number(pick.driver_id));
                      return (
                        <div key={pick.id} style={{ padding: 18, borderRadius: 26, background: pick.active ? "linear-gradient(135deg, #ffffff, #f5f5f7)" : "#f5f5f7", border: "1px solid #e5e7eb", boxShadow: pick.active ? "0 16px 40px rgba(15, 23, 42, 0.08)" : "none" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, color: pick.active ? "#34c759" : "#8e8e93" }}>{pick.active ? "ACTIVE" : "OFF"}</div>
                            <div style={{ fontSize: 12, fontWeight: 1000, color: "#6b7280" }}>#{pick.display_order || "—"}</div>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.4, marginTop: 8 }}>{driver ? `#${driver.number} ${driver.name}` : `Driver ID ${pick.driver_id}`}</div>
                          <div style={{ display: "inline-flex", padding: "6px 10px", borderRadius: 999, background: "#111827", color: "#fff", fontSize: 11, fontWeight: 1000, marginTop: 10 }}>{pick.badge || "DIRECTOR PICK"}</div>
                          <p style={{ color: "#4b5563", fontWeight: 700, lineHeight: 1.45 }}>{pick.reason || "No storyline added."}</p>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <button onClick={() => toggleManualWatchPick(pick)} style={adminSecondaryButtonStyle}>{pick.active ? "Turn Off" : "Activate"}</button>
                            <button onClick={() => deleteManualWatchPick(pick.id)} style={adminDangerButtonStyle}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {publicRelationsTab === "stories" && (
                <div style={prCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Stories</div>
                  <h2 style={{ margin: "3px 0 6px", fontSize: 28, letterSpacing: -0.7 }}>Board Story Desk</h2>
                  <p style={{ color: "#4b5563", fontWeight: 750 }}>Review, write, and publish stories from the board workspace.</p>
                  <button type="button" onClick={() => (window.location.pathname = "/admin/stories")} style={adminPrimaryButtonStyle}>Open Stories Manager ({openStoryCount || 0})</button>
                </div>
              )}

              {publicRelationsTab === "interviews" && (
                <div style={prCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Interviews</div>
                  <h2 style={{ margin: "3px 0 6px", fontSize: 28, letterSpacing: -0.7 }}>Board Interview Desk</h2>
                  <p style={{ color: "#4b5563", fontWeight: 750 }}>Review interview submissions and prepare the media content the board wants posted.</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button type="button" onClick={() => (window.location.pathname = "/admin/interviews")} style={adminPrimaryButtonStyle}>Open Interview Admin</button>
                    <button type="button" onClick={() => openFinanceDepartment("interview")} style={adminSecondaryButtonStyle}>Pay Interviews in Finance</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {raceOperationsOpen && (
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
                  ["tracks", "Track Management", (tracks || []).length, "Update schedule tracks and stage counts."],
                  ["input", "Race Input", selectedRace ? "Active" : "Ready", "Enter finishes, stages, penalties, DNFs, and fastest lap."],
                  ["history", "Previous Race Results", raceHistory.length, "Open the race archive and download single races or the season."],
                  ["drafts", "Saved Drafts", (raceDrafts || []).length, "Load, post, or delete admin-only race drafts."],
                  ["offenses", "Offense Log", offenseLog.length, "Review season offense penalties."],
                ].map(([key, label, value, description]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRaceOperationsTab(key)}
                    style={{
                      ...walletLightCardStyle,
                      padding: 18,
                      textAlign: "left",
                      cursor: "pointer",
                      border: raceOperationsTab === key ? "2px solid #111827" : walletLightCardStyle.border || "1px solid rgba(15,23,42,0.10)",
                      boxShadow: raceOperationsTab === key ? "0 18px 38px rgba(15,23,42,0.18)" : walletLightCardStyle.boxShadow,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, textTransform: "uppercase", color: "#6b7280" }}>{label}</div>
                    <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -1, marginTop: 8 }}>{value}</div>
                    <div style={{ marginTop: 8, color: "#4b5563", fontSize: 13, fontWeight: 750, lineHeight: 1.35 }}>{description}</div>
                  </button>
                ))}
              </div>

              {raceOperationsTab === "overview" && (
                <div style={adminReadableCardStyle}>
                  <h2 style={{ marginTop: 0 }}>Race Operations Hub</h2>
                  <div style={{ opacity: 0.78 }}>Choose a tile above. Track Management and Previous Race Results are tucked away until you need them, keeping this page focused for race night.</div>
                </div>
              )}

        {/* Track Management */}
        {raceOperationsTab === "tracks" && <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>Track Management</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Add or remove tracks from the race schedule. Stage count controls how many scoring stages each track has (1, 2, or 3).</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Track Name</div><input style={adminInputStyle} value={newTrackName} onChange={(e) => setNewTrackName(e.target.value)} placeholder="Example: Bristol Night Race" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Stage Count</div><select style={adminInputStyle} value={newTrackStageCount} onChange={(e) => setNewTrackStageCount(Number(e.target.value))}><option value={1}>1 stage</option><option value={2}>2 stages</option><option value={3}>3 stages</option></select></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
            <button onClick={addTrack} style={adminPrimaryButtonStyle}>Add Track</button>
            <button onClick={restoreDefaultTracks} style={adminSecondaryButtonStyle}>Restore Default Schedule</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={adminTableStyle}>
              <thead><tr><th style={adminThStyle}>Track Name</th><th style={adminThStyle}>Stage Count</th><th style={adminThStyle}>Used in History?</th><th style={adminThStyle}>Actions</th></tr></thead>
              <tbody>
                {tracks.length === 0 ? (
                  <tr><td style={adminTdStyle} colSpan={4}><div style={{ opacity: 0.75 }}>No tracks defined. Add one above or restore the default schedule.</div></td></tr>
                ) : tracks.map((t) => {
                  const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === t.name));
                  return (
                    <tr key={t.name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{t.name}</td>
                      <td style={adminTdStyle}>
                        <select style={{ ...inputStyle, maxWidth: 160 }} value={t.stageCount} onChange={(e) => updateTrackStageCount(t.name, e.target.value)}>
                          <option value={1}>1 stage</option>
                          <option value={2}>2 stages</option>
                          <option value={3}>3 stages</option>
                        </select>
                      </td>
                      <td style={adminTdStyle}>{usedInHistory ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>Yes</span> : <span style={{ opacity: 0.7 }}>No</span>}</td>
                      <td style={adminTdStyle}><button onClick={() => removeTrack(t.name)} style={adminDangerButtonStyle}>Remove</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}
        {/* Start & Park Requests moved into Human Resources > Start & Park. */}

        {/* Enter Race Results */}
        {raceOperationsTab === "input" && <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>{editingRaceName ? `Edit Race: ${editingRaceName}` : "Enter Race Results"}</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14, marginBottom: 18 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Race</label>
              <select style={adminInputStyle} value={selectedRace} onChange={(e) => patchActiveSeason({ selectedRace: e.target.value })}>
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
                      <td style={adminTdStyle}>{driver.name}</td>
                      <td style={adminTdStyle}>{getTeamFullName(driver.team)} <span style={{ fontSize: 11, opacity: 0.5 }}>({driver.team})</span></td>
                      <td style={raceEntryTdStyle}><input type="number" min="1" max="40" style={racePositionInputStyle} value={positions[driver.id] || ""} onChange={(e) => handlePositionChange(driver.id, e.target.value)} /></td>
                      {stageCount >= 1 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage1[driver.id] || ""} onChange={(e) => handleStage1Change(driver.id, e.target.value)} /></td>}
                      {stageCount >= 2 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage2[driver.id] || ""} onChange={(e) => handleStage2Change(driver.id, e.target.value)} /></td>}
                      {stageCount === 3 && <td style={raceEntryTdStyle}><input type="number" min="1" max="10" style={racePositionInputStyle} value={stage3[driver.id] || ""} onChange={(e) => handleStage3Change(driver.id, e.target.value)} /></td>}
                      <td style={adminTdStyle}>
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
                      <td style={adminTdStyle}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={!!startParkMap[driver.id]} onChange={(e) => handleStartParkChange(driver.id, e.target.checked)} />Start & Park
                        </label>
                        <div style={{ fontSize: 11, opacity: 0.65, marginTop: 5 }}>Finish points only; stage points zeroed.</div>
                      </td>
                      <td style={adminTdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="radio" name="fastestLap" checked={!!fastestLapMap[driver.id]} onChange={() => handleFastestLapChange(driver.id)} />FL +1</label></td>
                      <td style={adminTdStyle}><label style={{ display: "flex", alignItems: "center", gap: 8 }}><input type="checkbox" checked={!!offenseMap[driver.id]} onChange={(e) => handleOffenseChange(driver.id, e.target.checked)} />Offense</label></td>
                      <td style={adminTdStyle}><input type="number" min="0" style={racePenaltyInputStyle} value={penaltyMap[driver.id] || ""} onChange={(e) => handleManualPenaltyChange(driver.id, e.target.value)} placeholder="0" /></td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: "#d4af37" }}>{(() => { const fp = positions[driver.id] ? pointsTable[(Number(positions[driver.id]) || 1) - 1] || 0 : 0; const sp = startParkMap[driver.id] ? 0 : getStagePoints(stage1[driver.id]) + getStagePoints(stage2[driver.id]) + (stageCount === 3 ? getStagePoints(stage3[driver.id]) : 0); const fl = fastestLapMap[driver.id] ? 1 : 0; const op = thisOffense ? getOffensePenaltyPoints(thisOffense) : 0; const mp = Number(penaltyMap[driver.id] || 0); return fp + sp + fl - op - mp; })()}</td>
                      <td style={adminTdStyle}><input style={raceNotesInputStyle} value={resultNotesMap[driver.id] || ""} onChange={(e) => handleResultNoteChange(driver.id, e.target.value)} placeholder="Penalty note, ruling, etc." /></td>
                      <td style={adminTdStyle}><div style={{ display: "flex", gap: 6 }}><button type="button" onClick={() => moveDriverFinishPosition(driver.id, -1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↑</button><button type="button" onClick={() => moveDriverFinishPosition(driver.id, 1)} style={{ ...secondaryButtonStyle, padding: "6px 9px" }}>↓</button></div></td>
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
            <button onClick={saveResultsDraft} style={adminSecondaryButtonStyle}>Save Admin-Only Draft</button>
            <button onClick={() => submitResults()} style={adminPrimaryButtonStyle}>{editingRaceName ? "Update Posted Race" : "Post to Standings"}</button>
            {editingRaceName && <button onClick={clearInputs} style={adminSecondaryButtonStyle}>Cancel Edit</button>}
            <button onClick={clearInputs} style={adminSecondaryButtonStyle}>Clear Inputs</button>
            <button onClick={resetSeason} style={adminDangerButtonStyle}>Archive + Reset Active Season</button>
          </div>
        </div>}
        {/* Admin-Only Results Drafts */}
        {raceOperationsTab === "drafts" && <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>Admin-Only Results Drafts</h2>
          <div style={{ opacity: 0.78, marginBottom: 14 }}>Drafts let you capture finishing points, penalties, DNFs, and notes without changing public standings. Post only when race control is ready.</div>
          <div style={{ overflowX: "auto" }}>
            <table style={adminTableStyle}>
              <thead><tr><th style={adminThStyle}>Race</th><th style={adminThStyle}>Saved</th><th style={adminThStyle}>Leader</th><th style={adminThStyle}>Rows</th><th style={adminThStyle}>Actions</th></tr></thead>
              <tbody>
                {(raceDrafts || []).length === 0 ? (
                  <tr><td style={adminTdStyle} colSpan={5}><div style={{ opacity: 0.7 }}>No private drafts saved.</div></td></tr>
                ) : (raceDrafts || []).map((draft) => {
                  const leader = (draft.results || []).find((result) => result.finishPos === 1) || (draft.results || [])[0];
                  return (
                    <tr key={draft.id || draft.raceName}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{draft.raceName}</td>
                      <td style={adminTdStyle}>{draft.draftSavedAt ? new Date(draft.draftSavedAt).toLocaleString() : "—"}</td>
                      <td style={adminTdStyle}>{leader ? `#${leader.number} ${leader.name} (${leader.totalRacePoints} pts)` : "—"}</td>
                      <td style={adminTdStyle}>{(draft.results || []).length}</td>
                      <td style={adminTdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={() => loadResultsDraft(draft)} style={adminSecondaryButtonStyle}>Load/Edit</button>
                          <button type="button" onClick={() => postResultsDraft(draft)} style={adminPrimaryButtonStyle}>Post to Standings</button>
                          <button type="button" onClick={() => deleteResultsDraft(draft.id)} style={adminDangerButtonStyle}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>}
        {/* Race History */}
        {raceOperationsTab === "history" && <div style={adminReadableCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>Race History</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => downloadRaceHistoryCsv(raceHistory, activeSeason?.name || "Season")}
                style={adminPrimaryButtonStyle}
              >
                ⬇️ Download Race History CSV
              </button>
              <button
                type="button"
                onClick={handleDownloadLeagueBackup}
                style={adminSecondaryButtonStyle}
              >
                💾 Backup Results
              </button>
              <button
                type="button"
                onClick={() => backupFileInputRef.current?.click()}
                style={adminSecondaryButtonStyle}
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
                        <button onClick={() => downloadRaceHistoryCsv([race], race.raceName || "Race")} style={adminSecondaryButtonStyle}>Download</button>
                        <button onClick={() => handleEditRace(race)} style={adminSecondaryButtonStyle}>Edit</button>
                        <button onClick={() => handleDeleteRace(race.raceName)} style={adminDangerButtonStyle}>Delete</button>
                      </div>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table style={adminTableStyle}>
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
                          {race.results.map((r) => (
                            <tr key={r.driverId}>
                              <td style={adminTdStyle}>{r.finishPos ?? "—"}</td>
                              <td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{r.number}</div></td>
                              <td style={adminTdStyle}>{r.name}</td>
                              <td style={adminTdStyle}>{getTeamFullName(r.team)}</td>
                              <td style={adminTdStyle}>{r.finishPoints}</td>
                              {race.stageCount >= 1 && <td style={adminTdStyle}>{r.stage1Points}</td>}
                              {race.stageCount >= 2 && <td style={adminTdStyle}>{r.stage2Points}</td>}
                              {race.stageCount === 3 && <td style={adminTdStyle}>{r.stage3Points}</td>}
                              <td style={adminTdStyle}>{r.fastestLap ? "+1" : "—"}</td>
                              <td style={adminTdStyle}>{r.dnf ? (r.dnfReason ? `DNF (${r.dnfReason})` : "DNF") : "—"}</td>
                              <td style={adminTdStyle}>{r.startPark ? "Yes" : "—"}</td>
                              <td style={adminTdStyle}>{r.offense ? `#${r.offenseNumber}` : "—"}</td>
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
        </div>}
        {/* Offense Log */}
        {raceOperationsTab === "offenses" && <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>Offense Log</h2>
          {offenseLog.length === 0 ? <div style={{ opacity: 0.75 }}>No offenses logged yet.</div> : (
            <div style={{ overflowX: "auto" }}>
              <table style={adminTableStyle}>
                <thead><tr><th style={adminThStyle}>Race</th><th style={adminThStyle}>#</th><th style={adminThStyle}>Driver</th><th style={adminThStyle}>Offense #</th><th style={adminThStyle}>Penalty</th></tr></thead>
                <tbody>
                  {offenseLog.map((entry, i) => (
                    <tr key={`${entry.raceName}-${entry.number}-${i}`}>
                      <td style={adminTdStyle}>{entry.raceName}</td>
                      <td style={adminTdStyle}>{entry.number}</td>
                      <td style={adminTdStyle}>{entry.name}</td>
                      <td style={adminTdStyle}>#{entry.offenseNumber}</td>
                      <td style={{ ...tdStyle, color: "#b42318" }}>-{entry.penaltyPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}

            </div>
          </div>
        )}

        {hrDepartmentOpen && (
          <div style={financeOverlayStyle}>
            <div style={financeShellStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", color: "#6b7280" }}>Admin Menu</div>
                  <h1 style={{ margin: "2px 0 0", fontSize: isAdminMobile ? 34 : 42, letterSpacing: -1.6 }}>Human Resources</h1>
                  <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 750 }}>People operations for drivers, owners, assignments, access, appeals, and contracts.</p>
                </div>
                <button type="button" onClick={() => setHrDepartmentOpen(false)} style={{ border: 0, borderRadius: 999, background: "#ffffff", color: "#111827", width: 46, height: 46, fontSize: 23, fontWeight: 1000, cursor: "pointer", boxShadow: "0 8px 20px rgba(15,23,42,0.12)" }}>×</button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {[
                  ["overview", "HR Home"],
                  ["drivers", "Driver Assignments"],
                  ["owners", "Owner Assignments"],
                  ["access", "Access Codes"],
                  ["appeals", "Appeals"],
                  ["contracts", "Contracts"],
                  ["startpark", "Start & Park"],
                ].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setHrTab(key)} style={financeSegmentButtonStyle(hrTab === key)}>{label}</button>
                ))}
              </div>

              {hrTab === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(5, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
                    {[
                      ["Active Drivers", visibleDrivers?.length || drivers?.length || 0],
                      ["Team Owners", ownerPortalTeams?.length || 0],
                      ["Open Appeals", openAppealCount || 0],
                      ["Contracts", financeContracts?.length || 0],
                      ["Start & Park", (startParkRequests || []).filter((request) => String(request.status || "pending").toLowerCase() === "pending").length],
                      ["Join Requests", pendingHrRequestCount],
                    ].map(([label, value]) => (
                      <div key={label} style={{ ...walletLightCardStyle, padding: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, textTransform: "uppercase", color: "#6b7280" }}>{label}</div>
                        <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -1, marginTop: 8 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, minmax(240px, 1fr))", gap: 14 }}>
                    {[
                      ["👤", "Driver Assignments", "Assign drivers to teams, edit numbers, manufacturers, and active status.", "drivers"],
                      ["🏢", "Team Owner Assignments", "Manage owner access and team-owner responsibility.", "owners"],
                      ["🔐", "Access & Security", "Driver passwords, owner codes, account access, and security controls.", "access"],
                      ["⚖️", "Appeals", "Review open appeals and move them through the board workflow.", "appeals"],
                      ["📑", "Contracts", "View driver contracts, statuses, salary records, and team obligations.", "contracts"],
                      ["🟨", "Start & Park", "Approve, decline, and apply Start & Park requests from drivers and owners.", "startpark"],
                      ["➕", "Add / Approve Drivers", "Add new drivers and approve pending signup requests directly inside HR.", "drivers"],
                    ].map(([icon, title, text, tab]) => (
                      <button key={title} type="button" onClick={() => setHrTab(tab)} style={{ ...prCardStyle, textAlign: "left", cursor: "pointer" }}>
                        <div style={prIconStyle}>{icon}</div>
                        <div style={{ fontSize: 21, fontWeight: 1000, marginTop: 14, letterSpacing: -0.4 }}>{title}</div>
                        <div style={{ color: "#6b7280", fontWeight: 750, marginTop: 6, lineHeight: 1.45 }}>{text}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hrTab === "drivers" && (
                <div style={walletLightCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Driver Assignments</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Driver Roster</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>Quick view of each driver, team, number, and manufacturer.</p>
                    </div>
                  </div>

                  <div style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 21, letterSpacing: -0.4 }}>Add Driver</h3>
                    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(4, minmax(170px, 1fr))", gap: 12, marginBottom: 12 }}>
                      <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Driver Name</div><input style={adminInputStyle} value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)} placeholder="Enter driver name" /></div>
                      <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Number</div><input style={adminInputStyle} value={newDriverNumber} onChange={(e) => setNewDriverNumber(e.target.value)} placeholder="Car number" /></div>
                      <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Manufacturer</div><select style={adminInputStyle} value={newDriverManufacturer} onChange={(e) => setNewDriverManufacturer(e.target.value)}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
                      <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Team</div><input style={adminInputStyle} value={newDriverTeam} onChange={(e) => setNewDriverTeam(e.target.value)} placeholder="B2J, 19XI, BXM..." /></div>
                    </div>
                    <button type="button" onClick={addDriver} style={adminPrimaryButtonStyle}>Add Driver</button>
                  </div>

                  <div style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 }}>
                    <h3 style={{ margin: "0 0 6px", fontSize: 21, letterSpacing: -0.4 }}>Pending Driver Requests ({pendingHrRequestCount})</h3>
                    <p style={{ margin: "0 0 12px", color: "#6b7280", fontWeight: 750 }}>All league and series request-to-join submissions feed into this HR queue.</p>
                    {pendingHrRequestCount === 0 ? (
                      <div style={{ borderRadius: 20, padding: 16, background: "#f5f5f7", color: "#6b7280", fontWeight: 850 }}>No pending league join requests right now.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 10 }}>
                        {(pendingDrivers || []).map((d) => (
                          <div key={d.id} style={{ ...walletTransactionRowStyle, alignItems: isAdminMobile ? "flex-start" : "center", flexDirection: isAdminMobile ? "column" : "row" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={walletIconStyle}>#{d.car_number || "?"}</div>
                              <div>
                                <div style={{ fontWeight: 1000 }}>{d.driver_name || "Pending Driver"}</div>
                                <div style={{ color: "#6b7280", fontWeight: 750, fontSize: 13 }}>{d.series_name || "League"} · {d.manufacturer || "Manufacturer TBD"} · {d.team_name || "Team TBD"}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: isAdminMobile ? 0 : "auto" }}>
                              <button onClick={() => approvePendingDriver(d)} style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Approve</button>
                              <button onClick={() => rejectPendingDriver(d)} style={{ ...dangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Reject</button>
                            </div>
                          </div>
                        ))}
                        {pendingSeriesJoinRequests.map((request) => (
                          <div key={request.id} style={{ ...walletTransactionRowStyle, alignItems: isAdminMobile ? "flex-start" : "center", flexDirection: isAdminMobile ? "column" : "row" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={walletIconStyle}>#{request.preferredNumber || "?"}</div>
                              <div>
                                <div style={{ fontWeight: 1000 }}>{request.username || request.gamertag || "Pending League Request"}</div>
                                <div style={{ color: "#6b7280", fontWeight: 750, fontSize: 13 }}>{request.seriesName || request.seriesId || "Series TBD"} · {request.preferredTeam || "Team TBD"} · {request.role || "Driver"}</div>
                                {request.notes && <div style={{ color: "#4b5563", fontWeight: 700, fontSize: 13, marginTop: 4 }}>{request.notes}</div>}
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: isAdminMobile ? 0 : "auto" }}>
                              <button onClick={() => updateSeriesJoinRequestStatus(request.id, "approved")} style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Approve</button>
                              <button onClick={() => updateSeriesJoinRequestStatus(request.id, "denied")} style={{ ...dangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Deny</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {editingDriverId && (
                    <div style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16, marginBottom: 14 }}>
                      <h3 style={{ margin: "0 0 12px", fontSize: 21, letterSpacing: -0.4 }}>Edit Driver</h3>
                      <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(4, minmax(170px, 1fr))", gap: 12, marginBottom: 12 }}>
                        <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Driver Name</div><input style={adminInputStyle} value={editDriverForm.name} onChange={(e) => setEditDriverForm({ ...editDriverForm, name: e.target.value })} /></div>
                        <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Number</div><input style={adminInputStyle} value={editDriverForm.number} onChange={(e) => setEditDriverForm({ ...editDriverForm, number: e.target.value })} /></div>
                        <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Manufacturer</div><select style={adminInputStyle} value={editDriverForm.manufacturer} onChange={(e) => setEditDriverForm({ ...editDriverForm, manufacturer: e.target.value })}><option value="">Select manufacturer</option><option value="Chevrolet">Chevrolet</option><option value="Ford">Ford</option><option value="Toyota">Toyota</option><option value="Other">Other</option></select></div>
                        <div><div style={{ marginBottom: 6, fontWeight: 900, color: "#374151" }}>Team</div><input style={adminInputStyle} value={editDriverForm.team} onChange={(e) => setEditDriverForm({ ...editDriverForm, team: e.target.value })} /></div>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button onClick={saveDriverEdit} style={adminPrimaryButtonStyle}>Save Changes</button><button onClick={cancelEditDriver} style={adminSecondaryButtonStyle}>Cancel</button></div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(245px, 1fr))", gap: 12, maxHeight: 520, overflowY: "auto" }}>
                    {(visibleDrivers || drivers || []).map((driver) => (
                      <div key={driver.id || driver.number} style={{ borderRadius: 24, padding: 16, background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 12px 30px rgba(15,23,42,0.07)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ width: 48, height: 48, borderRadius: 16, background: "#111827", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>#{driver.number}</div>
                          <div style={{ fontSize: 12, fontWeight: 1000, color: driver.retired ? "#ff3b30" : "#34c759" }}>{driver.retired ? "INACTIVE" : "ACTIVE"}</div>
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 12, letterSpacing: -0.4 }}>{driver.name}</div>
                        <div style={{ color: "#6b7280", fontWeight: 800, marginTop: 4 }}>{getTeamFullName(driver.team)} · {driver.manufacturer || "Manufacturer TBD"}</div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                          <button onClick={() => openEditDriver(driver)} style={{ ...adminSecondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Edit</button>
                          {driver.retired ? (<button onClick={() => unretireDriver(driver.id)} style={{ ...adminSecondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Unretire</button>) : (<button onClick={() => retireDriver(driver.id)} style={{ ...adminSecondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Retire</button>)}
                          <button onClick={() => removeDriver(driver.id)} style={{ ...adminDangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Remove</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hrTab === "owners" && (
                <div style={walletLightCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Team Owner Assignments</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Owner Assignment Center</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>Assign which driver owns each team. The assigned driver password unlocks that owner portal.</p>
                    </div>
                  </div>

                  <div style={{ borderRadius: 26, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16, marginBottom: 16, boxShadow: "0 14px 34px rgba(15,23,42,0.07)" }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 21, letterSpacing: -0.4 }}>Assign Team Owner</h3>
                    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(3, minmax(190px, 1fr))", gap: 12, alignItems: "end" }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#6b7280", marginBottom: 8 }}>TEAM</label>
                        <select value={selectedOwnerTeam} onChange={(event) => setSelectedOwnerTeam(event.target.value)} style={adminInputStyle}>
                          <option value="">Select team</option>
                          {(teamStandings || [])
                            .filter((team) => team.team !== "Independent" && team.team !== "IND")
                            .map((team) => (
                              <option key={team.team} value={team.team}>{getTeamFullName(team.team)}</option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#6b7280", marginBottom: 8 }}>OWNER DRIVER</label>
                        <select value={selectedOwnerDriverNumber} onChange={(event) => setSelectedOwnerDriverNumber(event.target.value)} style={adminInputStyle}>
                          <option value="">Select owner driver</option>
                          {(visibleDrivers || [])
                            .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
                            .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999))
                            .map((driver) => (
                              <option key={driver.id || driver.number} value={driver.number}>#{driver.number} — {driver.name}</option>
                            ))}
                        </select>
                      </div>

                      <button type="button" onClick={saveOwnerAssignment} style={adminPrimaryButtonStyle}>Save Owner Assignment</button>
                    </div>
                    {ownerAssignmentMessage && <div style={{ color: "#047857", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentMessage}</div>}
                    {ownerAssignmentError && <div style={{ color: "#b42318", marginTop: 12, fontWeight: 900 }}>{ownerAssignmentError}</div>}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                    {(ownerPortalTeams || []).map((team) => {
                      const teamDrivers = (visibleDrivers || []).filter((driver) => driver.team === team);
                      const assignment = (ownerAssignments || []).find((item) => String(item.team) === String(team));
                      return (
                        <div key={team} style={{ borderRadius: 26, padding: 18, color: "white", background: "linear-gradient(135deg, #1c1c1e, #3a3a3c)", boxShadow: "0 16px 38px rgba(15,23,42,0.16)" }}>
                          <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.75, letterSpacing: 1.3 }}>{team}</div>
                          <div style={{ fontSize: 22, fontWeight: 1000, marginTop: 8 }}>{getTeamFullName(team)}</div>
                          <div style={{ marginTop: 10, borderRadius: 18, padding: "10px 12px", background: "rgba(255,255,255,0.13)", fontWeight: 900 }}>
                            Owner: {assignment?.owner_driver_name ? `#${assignment.owner_driver_number} ${assignment.owner_driver_name}` : "Not assigned"}
                          </div>
                          <div style={{ opacity: 0.82, fontWeight: 800, marginTop: 10 }}>{teamDrivers.length} team drivers</div>
                          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.82 }}>{teamDrivers.map((driver) => `#${driver.number} ${driver.name}`).join(" · ") || "No drivers assigned"}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {hrTab === "access" && (
                <div style={walletLightCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Access & Security</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Access Codes</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>Driver codes and owner portal codes live here for quick HR review.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={loadDriverAccessCodes} style={adminSecondaryButtonStyle}>Refresh Driver Codes</button>
                      <button type="button" onClick={generateAllOwnerCodes} style={adminPrimaryButtonStyle}>Generate Owner Codes</button>
                    </div>
                  </div>
                  {hrAccessStatus ? (
                    <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 16, background: "#ecfdf5", color: "#065f46", fontWeight: 900 }}>{hrAccessStatus}</div>
                  ) : null}
                  {hrAccessError ? (
                    <div style={{ marginBottom: 12, padding: "10px 12px", borderRadius: 16, background: "#fef2f2", color: "#991b1b", fontWeight: 900 }}>{hrAccessError}</div>
                  ) : null}
                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "1.35fr 0.65fr", gap: 14 }}>
                    <div style={{ borderRadius: 30, background: "#ffffff", border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 18px 45px rgba(15,23,42,0.08)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", padding: 16, borderBottom: "1px solid #eef2f7", background: "linear-gradient(180deg, #ffffff, #f8fafc)" }}>
                        <div>
                          <h3 style={{ margin: 0, letterSpacing: -0.25 }}>Driver Contract Access</h3>
                          <div style={{ marginTop: 4, color: "#6b7280", fontSize: 13, fontWeight: 750 }}>Apple Contacts-style access list. Click a driver to manage their contract password.</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button type="button" onClick={resetAllDriverAccessCodes} style={adminPrimaryButtonStyle}>Reset All</button>
                          <button type="button" onClick={clearAllDriverAccessCodes} style={dangerButtonStyle}>Clear All</button>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "320px 1fr", minHeight: 520 }}>
                        <div style={{ borderRight: isAdminMobile ? "none" : "1px solid #eef2f7", borderBottom: isAdminMobile ? "1px solid #eef2f7" : "none", background: "#f9fafb", maxHeight: isAdminMobile ? 320 : 560, overflowY: "auto" }}>
                          {(accessDrivers || []).map((driver) => {
                            const codeRow = (driverAccessCodes || []).find((row) => String(row.driver_number) === String(driver.number) && row.active !== false);
                            const isSelected = selectedAccessDriver && String(selectedAccessDriver.number) === String(driver.number);
                            const initials = String(driver.name || "?").split(/\s|_/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "D";
                            return (
                              <button
                                key={driver.id || driver.number}
                                type="button"
                                onClick={() => {
                                  setSelectedAccessDriverNumber(String(driver.number));
                                  setAccessCodeModalDriverNumber(String(driver.number));
                                  setShowAccessCodePassword(false);
                                }}
                                style={{
                                  width: "100%",
                                  border: "none",
                                  borderBottom: "1px solid #eef2f7",
                                  background: isSelected ? "#e8f1ff" : "transparent",
                                  padding: "12px 14px",
                                  display: "grid",
                                  gridTemplateColumns: "46px 1fr auto",
                                  gap: 12,
                                  alignItems: "center",
                                  textAlign: "left",
                                  cursor: "pointer"
                                }}
                              >
                                <div style={{ width: 46, height: 46, borderRadius: 16, background: isSelected ? "linear-gradient(135deg, #007aff, #5ac8fa)" : "linear-gradient(135deg, #d1d5db, #f3f4f6)", color: isSelected ? "white" : "#111827", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>
                                  {initials}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 1000, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>#{driver.number} {driver.name}</div>
                                  <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getTeamFullName(driver.team)} · {driver.manufacturer || "Manufacturer TBD"}</div>
                                </div>
                                <div style={{ width: 10, height: 10, borderRadius: 999, background: codeRow?.code ? "#34c759" : "#ff3b30" }} title={codeRow?.code ? "Code active" : "No code"} />
                              </button>
                            );
                          })}
                          {!accessDrivers.length && (
                            <div style={{ padding: 18, color: "#6b7280", fontWeight: 800 }}>No active drivers found.</div>
                          )}
                        </div>

                        <div style={{ padding: isAdminMobile ? 14 : 18, background: "#ffffff" }}>
                          <div style={{ borderRadius: 28, background: "linear-gradient(180deg, #f9fafb, #ffffff)", border: "1px solid #eef2f7", padding: 18 }}>
                            <h3 style={{ margin: "0 0 8px", letterSpacing: -0.25 }}>Select a Driver</h3>
                            <p style={{ margin: 0, color: "#6b7280", fontWeight: 800, lineHeight: 1.45 }}>Click a name from the list to open their contract access card.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  {accessCodeModalDriver ? (
                    <div style={{ position: "fixed", inset: 0, zIndex: 10050, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }} onClick={() => { setAccessCodeModalDriverNumber(""); setShowAccessCodePassword(false); }}>
                      <div style={{ width: "min(560px, 100%)", borderRadius: 34, background: "#f5f5f7", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 34px 110px rgba(0,0,0,0.35)", overflow: "hidden" }} onClick={(event) => event.stopPropagation()}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,0.82)" }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.2, textTransform: "uppercase", color: "#6b7280" }}>Contract Access</div>
                            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.4 }}>#{accessCodeModalDriver.number} {accessCodeModalDriver.name}</div>
                          </div>
                          <button type="button" onClick={() => { setAccessCodeModalDriverNumber(""); setShowAccessCodePassword(false); }} aria-label="Close access card" style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid #d1d5db", background: "#ffffff", color: "#111827", fontWeight: 1000, fontSize: 18, cursor: "pointer" }}>×</button>
                        </div>
                        <div style={{ padding: 18 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                            <div style={{ width: 72, height: 72, borderRadius: 25, background: "linear-gradient(135deg, #007aff, #5ac8fa)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 22 }}>#{accessCodeModalDriver.number}</div>
                            <div>
                              <div style={{ color: "#111827", fontWeight: 1000, fontSize: 18 }}>{getTeamFullName(accessCodeModalDriver.team)}</div>
                              <div style={{ color: "#6b7280", fontWeight: 850, marginTop: 4 }}>{accessCodeModalDriver.manufacturer || "Manufacturer TBD"}</div>
                            </div>
                          </div>
                          <div style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                            <div style={{ padding: "15px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid #eef2f7" }}>
                              <div>
                                <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 1000, letterSpacing: 1.1, textTransform: "uppercase" }}>Password</div>
                                <div style={{ marginTop: 6, fontFamily: "monospace", fontSize: 24, fontWeight: 1000, color: accessCodeModalCode ? "#111827" : "#ef4444", letterSpacing: accessCodeModalCode && !showAccessCodePassword ? 2 : 0 }}>{accessCodeModalCode ? (showAccessCodePassword ? accessCodeModalCode : "••••••••••••") : "Not generated"}</div>
                              </div>
                              <div style={{ padding: "6px 10px", borderRadius: 999, background: accessCodeModalCode ? "#ecfdf5" : "#fef2f2", color: accessCodeModalCode ? "#047857" : "#b42318", fontWeight: 1000, fontSize: 12 }}>{accessCodeModalCode ? "ACTIVE" : "MISSING"}</div>
                            </div>
                            <div style={{ padding: 16, display: "grid", gap: 10 }}>
                              <button type="button" onClick={() => setShowAccessCodePassword((value) => !value)} disabled={!accessCodeModalCode} style={{ ...secondaryButtonStyle, width: "100%", justifyContent: "center", opacity: accessCodeModalCode ? 1 : 0.45 }}>{showAccessCodePassword ? "Hide Password" : "Reveal Password"}</button>
                              <button type="button" onClick={() => { setShowAccessCodePassword(false); resetSingleDriverAccessCode(accessCodeModalDriver); }} style={{ ...adminPrimaryButtonStyle, width: "100%", justifyContent: "center" }}>{accessCodeModalCode ? "Reset Code" : "Generate Code"}</button>
                              <button type="button" onClick={() => copyDriverAccessCode(accessCodeModalDriver, accessCodeModalCode)} disabled={!accessCodeModalCode} style={{ ...secondaryButtonStyle, width: "100%", justifyContent: "center", opacity: accessCodeModalCode ? 1 : 0.45 }}>Copy Code</button>
                              <button type="button" onClick={() => { setShowAccessCodePassword(false); clearDriverAccessCode(accessCodeModalDriver); }} disabled={!accessCodeModalCode} style={{ ...dangerButtonStyle, width: "100%", justifyContent: "center", opacity: accessCodeModalCode ? 1 : 0.45 }}>Disable Access</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                    <div style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16 }}>
                      <h3 style={{ marginTop: 0 }}>Owner Portal Access</h3>
                      <p style={{ marginTop: -4, color: "#6b7280", fontSize: 13, fontWeight: 750 }}>Owners use their driver password as their owner password. Legacy owner codes are shown here only for review.</p>
                      <div style={{ display: "grid", gap: 8, maxHeight: 420, overflowY: "auto" }}>
                        {(ownerPortalTeams || []).map((team) => (
                          <div key={team} style={walletTransactionRowStyle}>
                            <div style={walletIconStyle}>🏢</div>
                            <div><div style={{ fontWeight: 1000 }}>{getTeamFullName(team)}</div><div style={{ color: "#6b7280", fontWeight: 750, fontSize: 13 }}>{team}</div></div>
                            <div style={{ fontFamily: "monospace", fontWeight: 1000 }}>{ownerAccessCodes[team] || "Driver Code"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hrTab === "appeals" && (
                <div style={walletLightCardStyle}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Appeals</div>
                  <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Board Appeal Queue</h2>
                  <p style={{ color: "#4b5563", fontWeight: 750 }}>Open appeals remain managed by the appeals page, but HR now owns the people/discipline view.</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", marginTop: 16 }}>
                    <div style={{ padding: "14px 18px", borderRadius: 20, background: "#ffffff", border: "1px solid #e5e7eb", fontWeight: 1000 }}>{openAppealCount || 0} open appeals</div>
                    <button type="button" onClick={() => (window.location.pathname = "/appeals")} style={adminPrimaryButtonStyle}>Open Appeals</button>
                  </div>
                </div>
              )}

              {hrTab === "startpark" && (
                <div style={walletLightCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Start & Park</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Start & Park Requests</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>HR manages driver availability requests, owner requests, approvals, denials, and race application.</p>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button type="button" onClick={loadStartParkRequests} style={adminSecondaryButtonStyle}>{startParkRequestsLoading ? "Loading..." : "Refresh"}</button>
                      <button type="button" onClick={applyApprovedStartParkRequestsToRace} style={adminPrimaryButtonStyle}>Apply Approved</button>
                    </div>
                  </div>

                  {startParkRequestError && <div style={{ marginBottom: 12, color: "#b42318", fontWeight: 900 }}>{startParkRequestError}</div>}
                  {startParkRequestStatus && <div style={{ marginBottom: 12, color: "#047857", fontWeight: 900 }}>{startParkRequestStatus}</div>}

                  <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                    {(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).map((request, index) => {
                      const status = String(request.status || "pending").toLowerCase();
                      const statusColor = status === "approved" ? "#34c759" : status === "declined" ? "#ff3b30" : status === "applied" ? "#007aff" : "#ff9f0a";
                      return (
                        <div key={request.id || `${request.driver_number}-${request.created_at}`} style={{ borderRadius: 28, background: "#ffffff", border: "1px solid #e5e7eb", padding: 18, boxShadow: "0 14px 34px rgba(15,23,42,0.08)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                            <div style={{ width: 54, height: 54, borderRadius: 18, background: "linear-gradient(135deg, #111827, #374151)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>#{request.driver_number || "?"}</div>
                            <div style={{ padding: "6px 10px", borderRadius: 999, background: `${statusColor}20`, color: statusColor, fontWeight: 1000, fontSize: 12 }}>{status.toUpperCase()}</div>
                          </div>
                          <div style={{ fontSize: 21, fontWeight: 1000, marginTop: 14 }}>{request.driver_name || "Driver"}</div>
                          <div style={{ color: "#6b7280", fontWeight: 800, marginTop: 4 }}>{request.race_name || selectedRace || "Race TBD"}</div>
                          <div style={{ marginTop: 10, color: "#374151", fontWeight: 750, lineHeight: 1.45 }}>{request.reason || "No reason provided."}</div>
                          <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280", fontWeight: 750 }}>Requested by {request.requested_by_type || "—"} · {request.requested_by_name || request.requested_by_team || "—"}</div>
                          {request.created_at && <div style={{ marginTop: 4, fontSize: 12, color: "#9ca3af", fontWeight: 800 }}>Received {new Date(request.created_at).toLocaleString()}</div>}
                          {status === "pending" && (
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                              <button onClick={() => updateStartParkRequestStatus(request, "approved")} style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>Approve</button>
                              <button onClick={() => updateStartParkRequestStatus(request, "declined")} style={{ ...dangerButtonStyle, padding: "8px 12px", fontSize: 12 }}>Decline</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!(startParkRequests || []).filter((request) => !selectedRace || String(request.race_name || "") === String(selectedRace)).length && (
                    <div style={{ borderRadius: 22, background: "#ffffff", border: "1px solid #e5e7eb", padding: 18, color: "#6b7280", fontWeight: 800 }}>No Start & Park requests for the selected race.</div>
                  )}
                </div>
              )}

              {hrTab === "contracts" && (
                <div style={walletLightCardStyle}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Contracts</div>
                      <h2 style={{ margin: "3px 0 0", fontSize: 26, letterSpacing: -0.6 }}>Contract Records</h2>
                      <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>HR owns contract status. Finance still handles payments and money movement.</p>
                    </div>
                    <button type="button" onClick={loadFinanceContracts} style={adminSecondaryButtonStyle}>Refresh Contracts</button>
                  </div>
                  {financeContractsLoading ? (
                    <div style={{ color: "#6b7280", fontWeight: 800 }}>Loading contracts...</div>
                  ) : (financeContracts || []).length === 0 ? (
                    <div style={{ color: "#6b7280", fontWeight: 800 }}>No contract records found yet.</div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: isAdminMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                      {financeContracts.map((contract, index) => (
                        <div key={contract.id || index} style={{ borderRadius: 24, background: "#ffffff", border: "1px solid #e5e7eb", padding: 16, boxShadow: "0 12px 30px rgba(15,23,42,0.07)" }}>
                          <div style={{ fontSize: 12, fontWeight: 1000, color: "#6b7280", letterSpacing: 1.2 }}>{contract.status || "STATUS UNKNOWN"}</div>
                          <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 8 }}>{contract.driver_name || contract.driver || contract.driver_number || "Contract Offer"}</div>
                          <div style={{ color: "#6b7280", fontWeight: 800, marginTop: 4 }}>{contract.team || contract.team_abbr || "Team"}</div>
                          <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 12 }}>{money(Number(contract.salary || contract.amount || contract.value || contract.signing_bonus || 0) || 0)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {financeDepartmentOpen && (
          <div style={financeOverlayStyle}>
            <div style={financeShellStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", color: "#6b7280" }}>Admin Menu</div>
                  <h1 style={{ margin: "2px 0 0", fontSize: 42, letterSpacing: -1.6 }}>Finance Department</h1>
                  <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 750 }}>Apple Wallet-style control center for fines, payouts, contracts, team wallets, and money history.</p>
                </div>
                <button type="button" onClick={() => setFinanceDepartmentOpen(false)} style={{ border: 0, borderRadius: 999, background: "#ffffff", color: "#111827", width: 46, height: 46, fontSize: 23, fontWeight: 1000, cursor: "pointer", boxShadow: "0 8px 20px rgba(15,23,42,0.12)" }}>×</button>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
                {[
                  ["overview", "Wallets"],
                  ["fine", "Fine Driver"],
                  ["interview", "Pay Interviews"],
                  ["paint", "Pay Paint Schemes"],
                  ["contracts", "Contracts"],
                  ["compliance", "Team Compliance"],
                  ["transactions", "Transactions"],
                ].map(([key, label]) => (
                  <button key={key} type="button" onClick={() => setFinanceAction(key)} style={financeSegmentButtonStyle(financeAction === key)}>{label}</button>
                ))}
              </div>

              <div id="admin-finance-department" style={walletDepartmentStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", color: "#6b7280" }}>Finance Department</div>
              <h2 style={{ margin: "4px 0 0", fontSize: 34, letterSpacing: -1 }}>Apple Wallet-style League Money Center</h2>
              <p style={{ margin: "8px 0 0", color: "#4b5563", fontWeight: 650, maxWidth: 850 }}>
                All money controls live here: team wallets, payouts, paint scheme awards, penalties, contract money, transaction history, and finance audits. This replaces sending admins to Team HQ for money items.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={loadFinanceDepartment} style={adminSecondaryButtonStyle}>{financeLoading ? "Refreshing..." : "Refresh Finance"}</button>
              <button type="button" onClick={() => setFinanceAction("paint")} style={adminPrimaryButtonStyle}>Paint Payouts</button>
            </div>
          </div>

          {financeAction !== "overview" && financeAction !== "transactions" && financeAction !== "compliance" && (
            <div style={{ ...financeActionCardStyle, marginBottom: 20 }}>
              {financeAction === "contracts" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Contracts</div>
                      <h3 style={{ margin: "3px 0 0", fontSize: 25, letterSpacing: -0.5 }}>Driver Contract Money</h3>
                    </div>
                    <button type="button" onClick={loadFinanceContracts} style={adminSecondaryButtonStyle}>{financeContractsLoading ? "Refreshing..." : "Refresh Contracts"}</button>
                  </div>
                  {financeContractsLoading ? (
                    <div style={{ color: "#6b7280", fontWeight: 800 }}>Loading contracts...</div>
                  ) : financeContracts.length === 0 ? (
                    <div style={{ color: "#6b7280", fontWeight: 800 }}>No contract records found. This will show contract offers once contract data exists in Supabase.</div>
                  ) : (
                    <div style={{ display: "grid", gap: 10, maxHeight: 420, overflowY: "auto" }}>
                      {financeContracts.map((contract, index) => (
                        <div key={contract.id || index} style={walletTransactionRowStyle}>
                          <div style={{ ...walletIconStyle, background: "#111827" }}>✍︎</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 1000 }}>{contract.driver_name || contract.driver || contract.driver_number || "Contract Offer"}</div>
                            <div style={{ color: "#6b7280", fontWeight: 750, fontSize: 13 }}>{contract.team || contract.team_abbr || "Team"} · {contract.status || "status unknown"}</div>
                          </div>
                          <div style={{ fontWeight: 1000 }}>{money(Number(contract.salary || contract.amount || contract.value || contract.signing_bonus || 0) || 0)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Finance Action</div>
                  <h3 style={{ margin: "3px 0 12px", fontSize: 25, letterSpacing: -0.5 }}>
                    {financeAction === "fine" ? "Fine Driver" : financeAction === "interview" ? "Pay Interview" : "Pay Paint Scheme"}
                  </h3>
                  <div style={prMobileStackStyle}>
                    <label style={{ fontWeight: 900 }}>
                      Driver
                      <select value={financeForm.driverId} onChange={(event) => updateFinanceForm("driverId", event.target.value)} style={{ ...adminInputStyle, marginTop: 6 }}>
                        <option value="">Select driver</option>
                        {(visibleDrivers || drivers || []).map((driver) => (
                          <option key={driver.id} value={driver.id}>#{driver.number} {driver.name}</option>
                        ))}
                      </select>
                    </label>
                    <label style={{ fontWeight: 900 }}>
                      Amount
                      <input type="number" min="0" value={financeForm.amount || (financeAction === "paint" ? "10000" : "")} onChange={(event) => updateFinanceForm("amount", event.target.value)} placeholder={financeAction === "paint" ? "10000" : "Amount"} style={{ ...adminInputStyle, marginTop: 6 }} />
                    </label>
                    <label style={{ fontWeight: 900 }}>
                      Reason
                      <input value={financeForm.reason} onChange={(event) => updateFinanceForm("reason", event.target.value)} placeholder={financeAction === "fine" ? "Penalty / conduct / no-show" : financeAction === "interview" ? "Pre-race / post-race interview" : "Paint scheme payout"} style={{ ...adminInputStyle, marginTop: 6 }} />
                    </label>
                  </div>
                  <label style={{ display: "block", fontWeight: 900, marginTop: 12 }}>
                    Notes
                    <textarea value={financeForm.note} onChange={(event) => updateFinanceForm("note", event.target.value)} placeholder="Optional finance note" style={{ ...adminInputStyle, minHeight: 82, marginTop: 6 }} />
                  </label>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {financeAction === "fine" ? (
                      <button type="button" onClick={() => recordFinanceTransaction("Driver Fine", -1)} style={adminDangerButtonStyle}>Apply Fine</button>
                    ) : financeAction === "interview" ? (
                      <button type="button" onClick={() => recordFinanceTransaction("Interview Payout", 1)} style={adminPrimaryButtonStyle}>Pay Interview</button>
                    ) : (
                      <button type="button" onClick={() => recordFinanceTransaction("Paint Scheme Payout", 1)} style={adminPrimaryButtonStyle}>Pay Paint Scheme</button>
                    )}
                    <button type="button" onClick={() => setFinanceForm({ driverId: "", team: "", amount: "", reason: "", note: "" })} style={adminSecondaryButtonStyle}>Clear</button>
                  </div>
                  {financeActionStatus && <div style={{ color: "#047857", fontWeight: 900, marginTop: 12 }}>{financeActionStatus}</div>}
                  {financeActionError && <div style={{ color: "#b42318", fontWeight: 900, marginTop: 12 }}>{financeActionError}</div>}
                </div>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
            <div style={{ ...walletCardStyle, background: "linear-gradient(135deg, #111827, #374151)" }}>
              <div style={{ position: "absolute", right: -35, top: -35, width: 120, height: 120, borderRadius: 999, background: "rgba(255,255,255,0.10)" }} />
              <div>
                <div style={{ opacity: 0.72, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12 }}>League Wallet</div>
                <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -1, marginTop: 10 }}>{money(financeTransactionTotal)}</div>
              </div>
              <div style={{ opacity: 0.8, fontWeight: 800 }}>Recent transaction net</div>
            </div>

            <div style={{ ...walletCardStyle, background: "linear-gradient(135deg, #007aff, #5e5ce6)" }}>
              <div>
                <div style={{ opacity: 0.78, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12 }}>Paint Program</div>
                <div style={{ fontSize: 32, fontWeight: 1000, letterSpacing: -1, marginTop: 10 }}>$10,000</div>
              </div>
              <div style={{ opacity: 0.86, fontWeight: 800 }}>$250,000 season max per driver</div>
            </div>

            <div style={{ ...walletCardStyle, background: "linear-gradient(135deg, #34c759, #0a7f3f)" }}>
              <div>
                <div style={{ opacity: 0.78, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", fontSize: 12 }}>Team Wallets</div>
                <div style={{ fontSize: 34, fontWeight: 1000, letterSpacing: -1, marginTop: 10 }}>{financeTeamWallets.length}</div>
              </div>
              <div style={{ opacity: 0.86, fontWeight: 800 }}>Active organization accounts</div>
            </div>
          </div>

          {financeError && <div style={{ background: "#fff1f2", color: "#b42318", borderRadius: 16, padding: 14, fontWeight: 900, marginBottom: 16 }}>{financeError}</div>}

          {financeAction === "compliance" && (
            <div style={{ ...walletLightCardStyle, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Team Payment Compliance</div>
                  <h3 style={{ margin: "3px 0 0", fontSize: 25, letterSpacing: -0.5 }}>Owner / Team Money Checklist</h3>
                  <p style={{ margin: "6px 0 0", color: "#4b5563", fontWeight: 700 }}>All payment compliance now lives inside the Finance Department instead of the admin home screen.</p>
                </div>
                <button type="button" onClick={loadFinanceDepartment} style={adminSecondaryButtonStyle}>Refresh Finance</button>
              </div>
              <PaymentCompliancePanel mode="admin" />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.9fr) minmax(320px, 1.1fr)", gap: 16 }}>
            <div style={walletLightCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Team Cards</div>
                  <h3 style={{ margin: "3px 0 0", fontSize: 24, letterSpacing: -0.5 }}>Wallet Stack</h3>
                </div>
                <span style={{ background: "#f2f2f7", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 1000 }}>{financeTeamWallets.length} teams</span>
              </div>
              <div style={{ display: "grid", gap: 10, maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
                {financeTeamWallets.length === 0 ? (
                  <div style={{ color: "#6b7280", fontWeight: 750, padding: 14 }}>No team wallet data found yet.</div>
                ) : financeTeamWallets.map((wallet, index) => (
                  <div key={wallet.team} style={{ borderRadius: 20, padding: 16, color: "white", background: index % 3 === 0 ? "linear-gradient(135deg, #1c1c1e, #3a3a3c)" : index % 3 === 1 ? "linear-gradient(135deg, #007aff, #64d2ff)" : "linear-gradient(135deg, #af52de, #ff2d55)", boxShadow: "0 12px 26px rgba(15,23,42,0.13)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 1000, fontSize: 18 }}>{wallet.name}</div>
                        <div style={{ opacity: 0.78, fontSize: 12, fontWeight: 850, marginTop: 3 }}>{wallet.team}</div>
                      </div>
                      <div style={{ textAlign: "right", fontWeight: 1000 }}>{money(wallet.balance)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={walletLightCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#6b7280" }}>Recent Money Activity</div>
                  <h3 style={{ margin: "3px 0 0", fontSize: 24, letterSpacing: -0.5 }}>Transactions</h3>
                </div>
                <span style={{ background: "#f2f2f7", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 1000 }}>{financeTransactions.length} loaded</span>
              </div>

              {financeLoading ? (
                <div style={{ color: "#6b7280", fontWeight: 800, padding: 18 }}>Loading finance activity...</div>
              ) : financeRecentPayouts.length === 0 ? (
                <div style={{ color: "#6b7280", fontWeight: 750, padding: 14 }}>No recent finance transactions found yet.</div>
              ) : (
                <div style={{ maxHeight: 390, overflowY: "auto", paddingRight: 4 }}>
                  {financeRecentPayouts.map((item, index) => {
                    const amount = getFinanceAmount(item);
                    const date = getFinanceDate(item);
                    return (
                      <div key={item.id || `${getFinanceType(item)}-${index}`} style={walletTransactionRowStyle}>
                        <div style={walletIconStyle}>$</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 1000, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getFinanceType(item)}</div>
                          <div style={{ color: "#6b7280", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{getFinanceTeam(item)} · {getFinanceNote(item)}</div>
                          {date && <div style={{ color: "#9ca3af", fontWeight: 750, fontSize: 12, marginTop: 2 }}>{new Date(date).toLocaleString()}</div>}
                        </div>
                        <div style={{ fontWeight: 1000, color: amount < 0 ? "#ff3b30" : "#34c759", whiteSpace: "nowrap" }}>{money(amount)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
              </div>
            </div>
          </div>
        )}

        <div id="admin-media-center" />

        {adminMessagesOpen && (
          <div style={appleMessagesOverlayStyle}>
            <div style={appleMessagesShellStyle}>
              <aside style={appleMessagesSidebarStyle}>
                <div style={appleMessagesTitleRowStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button type="button" aria-label="Close messages" onClick={() => setAdminMessagesOpen(false)} style={{ ...appleMessagesTrafficButtonStyle, background: "#ff5f57" }} />
                    <span style={{ ...appleMessagesTrafficButtonStyle, background: "#ffbd2e" }} />
                    <span style={{ ...appleMessagesTrafficButtonStyle, background: "#28c840" }} />
                  </div>
                  <button type="button" onClick={loadAdminUnreadMessages} style={{ border: 0, background: "transparent", color: "#007aff", fontWeight: 1000, cursor: "pointer" }}>
                    {adminMessagesLoading ? "Refreshing" : "Refresh"}
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ ...adminMessageIconButtonStyle, width: 52, height: 52, borderRadius: 15, cursor: "default", fontSize: 25 }}>💬</div>
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 1000, letterSpacing: -1 }}>Messages</div>
                    <div style={{ color: "#6b7280", fontWeight: 800, fontSize: 13 }}>{adminUnreadCount} unread</div>
                  </div>
                </div>

                <button type="button" onClick={() => setAdminComposerOpen(true)} style={appleComposeButtonStyle}>＋ New Message</button>

                <div style={appleMessagesSegmentStyle}>
                  <button type="button" onClick={() => setAdminComposerOpen(false)} style={appleMessagesSegmentButtonStyle(!adminComposerOpen)}>Unread</button>
                  <button type="button" onClick={() => setAdminComposerOpen(true)} style={appleMessagesSegmentButtonStyle(adminComposerOpen)}>Compose</button>
                </div>

                {adminMessagesError && <div style={{ color: "#b42318", fontWeight: 900, marginBottom: 12, background: "#fff1f2", borderRadius: 14, padding: 12 }}>{adminMessagesError}</div>}

                {adminMessagesLoading ? (
                  <div style={{ color: "#6b7280", fontWeight: 900, padding: 12 }}>Loading unread messages...</div>
                ) : adminUnreadMessages.length === 0 ? (
                  <div style={{ background: "#ffffff", borderRadius: 18, padding: 16, color: "#6b7280", fontWeight: 850, boxShadow: "0 8px 20px rgba(15,23,42,0.06)" }}>
                    No unread messages right now.
                  </div>
                ) : (
                  <div>
                    {adminUnreadMessages.map((message) => (
                      <button key={message.id} type="button" style={appleMessageThreadStyle} onClick={() => setAdminComposerOpen(false)}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ fontWeight: 1000, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{message.subject || "No subject"}</div>
                          <span style={{ width: 10, height: 10, borderRadius: 999, background: "#007aff", flex: "0 0 auto" }} />
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 850, marginTop: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {message.sender_name || message.sender_type || "League"} → {getAdminMessageRecipientLabel(message)}
                        </div>
                        <div style={{ color: "#8a8a8e", fontSize: 12, fontWeight: 700, marginTop: 4 }}>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</div>
                      </button>
                    ))}
                  </div>
                )}
              </aside>

              <main style={appleMessagesMainStyle}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottom: "1px solid #e5e7eb", paddingBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase", color: "#8a8a8e" }}>Admin Communication</div>
                    <h2 style={{ margin: "2px 0 0", fontSize: 32, letterSpacing: -1 }}>{adminComposerOpen ? "Create Message" : "Unread Inbox"}</h2>
                  </div>
                  <button type="button" onClick={() => setAdminMessagesOpen(false)} style={{ border: 0, borderRadius: 999, background: "#f2f2f7", color: "#111827", width: 42, height: 42, fontSize: 20, fontWeight: 1000, cursor: "pointer" }}>×</button>
                </div>

                {adminComposerOpen ? (
                  <div style={{ background: "#f5f5f7", borderRadius: 26, padding: 18, border: "1px solid #e5e7eb" }}>
                    <AdminLeagueMessageComposer drivers={visibleDrivers} teams={teamStandings} />
                  </div>
                ) : adminUnreadMessages.length === 0 ? (
                  <div style={{ flex: 1, display: "grid", placeItems: "center", textAlign: "center", color: "#6b7280" }}>
                    <div>
                      <div style={{ fontSize: 58, marginBottom: 10 }}>💬</div>
                      <div style={{ fontSize: 24, fontWeight: 1000, color: "#111827" }}>All caught up</div>
                      <div style={{ fontWeight: 800, marginTop: 6 }}>Unread admin messages will appear here.</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 18 }}>
                    {adminUnreadMessages.map((message) => (
                      <div key={message.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
                          <div>
                            <div style={{ fontSize: 22, fontWeight: 1000, letterSpacing: -0.4 }}>{message.subject || "No subject"}</div>
                            <div style={{ color: "#6b7280", fontSize: 13, fontWeight: 850, marginTop: 4 }}>
                              From {message.sender_name || message.sender_type || "League"} · To {getAdminMessageRecipientLabel(message)}
                            </div>
                            <div style={{ color: "#8a8a8e", fontSize: 12, fontWeight: 700, marginTop: 3 }}>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</div>
                          </div>
                          <button type="button" onClick={() => markAdminMessageRead(message.id)} style={{ border: 0, borderRadius: 999, padding: "10px 14px", background: "#007aff", color: "white", fontWeight: 1000, cursor: "pointer" }}>Mark Read</button>
                        </div>
                        <div style={appleMessageBubbleStyle}>{message.message || "No message body."}</div>
                      </div>
                    ))}
                  </div>
                )}
              </main>
            </div>
          </div>
        )}

        {/* Team Owner Assignments moved into Human Resources > Owner Assignments. */}

        {/* League Ticker Manager moved into Public Relations > Ticker. */}

        {/* Discord Settings */}
        <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>Discord Hub Settings</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Invite Link</div>
              <input style={adminInputStyle} value={discordInviteUrl} onChange={(e) => setDiscordInviteUrl(e.target.value)} placeholder="https://discord.gg/your-link" />
            </div>
            <div>
              <div style={{ marginBottom: 6, fontWeight: 700 }}>Discord Page Announcement</div>
              <input style={adminInputStyle} value={discordAnnouncement} onChange={(e) => setDiscordAnnouncement(e.target.value)} placeholder="Join the league Discord..." />
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
            <button onClick={saveDiscordSettings} style={adminPrimaryButtonStyle}>Save Discord Settings</button>
            <button onClick={() => (window.location.pathname = "/discord")} style={adminSecondaryButtonStyle}>View Discord Page</button>
          </div>
        </div>
        {/* Season Manager */}
        <div style={adminReadableCardStyle}>
          <h2 style={{ marginTop: 0 }}>Season Manager</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Active Season</div><select style={adminInputStyle} value={activeSeasonId} onChange={(e) => switchSeason(e.target.value)}>{seasons.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Create New Season</div><input style={adminInputStyle} value={newSeasonName} onChange={(e) => setNewSeasonName(e.target.value)} placeholder="Example: 2026 Regular Season" /></div>
            <div><div style={{ marginBottom: 6, fontWeight: 700 }}>Rename Active Season</div><input style={adminInputStyle} value={renameSeasonName} onChange={(e) => setRenameSeasonName(e.target.value)} placeholder="Rename current season" /></div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={createSeason} style={adminPrimaryButtonStyle}>Create Season</button>
            <button onClick={renameActiveSeason} style={adminSecondaryButtonStyle}>Save Season Name</button>
            <button onClick={deleteActiveSeason} style={adminDangerButtonStyle}>Delete Active Season</button>
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
        {/* Owner Portal Access moved into Human Resources > Access Codes. */}

        {/* Driver Contract Access moved into Human Resources > Access Codes. */}

        {/* Human Resources controls removed from Admin Home. Use the Human Resources menu item. */}

        {/* Race Operations moved out of Admin Home. Use the Race Operations menu item. */}
      </div>
    </div>
  );

}
