import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo1.png";
import ncsLogo from "./assets/series/NCS.png";
import nxsLogo from "./assets/series/NXS.png";
import ctsLogo from "./assets/series/CTS.png";
import amsLogo from "./assets/series/AMS.png";
import FilesPage from "./FilesPage";
import SubmitAppealPage from "./SubmitAppealPage";
import AppealsPage from "./AppealsPage";
import DriverProfilePage from "./DriverProfilePage";
import TeamDetailPage from "./TeamDetailPage";
import ManufacturerDetailPage from "./ManufacturerDetailPage";
import WelcomePage from "./WelcomePage";
import { supabase } from "./lib/supabase";
import CarGalleryPage from "./CarGalleryPage";
import PaintSchemeVotePage from "./PaintSchemeVotePage";
import InterviewsPage from "./InterviewsPage";
import PublicInterviewsPage from "./InterviewsPage_public_interview_center";
import NewsPage from "./NewsPage";
import NotificationsPage from "./NotificationsPage";
import StreamPage from "./pages/StreamPage";
import StandingsPage from "./pages/StandingsPage";
import ContractsPage from "./pages/ContractsPage";
import LeagueVotingPage from "./pages/LeagueVotingPage";
import AdminVotingPage from "./pages/AdminVotingPage";
import DriverFeedbackPage from "./pages/DriverFeedbackPage";
import OwnerHQPage from "./pages/OwnerHQPage";
import AdminPortal from "./pages/AdminPortal";
import LeagueMessageCenter from "./pages/LeagueMessageCenter";
import InSeasonTournamentPage from "./pages/InSeasonTournamentPage";
import DriverMarketPage from "./pages/DriverMarketPage";
import DevelopmentRequestsPage from "./pages/DevelopmentRequestsPage";
import LeagueChatPage from "./LeagueChatPage";
import OwnersPage from "./OwnersPage.jsx";
import { defaultDrivers } from "./data/drivers";
import { defaultRaces } from "./data/races";
import { trackOverviewData } from "./data/trackOverview";
import SeriesPortal from "./pages/series/SeriesPortal";
import SeriesLandingPage from "./pages/series/SeriesLandingPage";
import SeriesJoinPage from "./pages/series/SeriesJoinPage";
import {
  teamLogos,
  manufacturerLogos,
  teamBudgets,
  getTeamFullName,
  getTeamBudget,
  getTeamBranding,
} from "./data/teams";
import { pointsTable, stagePointsTable, offensePenaltyPoints } from "./data/points";
import {
  getOffensePenaltyPoints,
  countPriorOffenses,
  getStagePoints,
} from "./utils/scoringHelpers";
import {
  isInactivePlaceholderDriver,
  isRemovedLeagueDriver,
  realignLeagueDrivers,
  filterRemovedLeagueDrivers,
  dedupeDriversByNumber,
  makeDriverWithStats,
  getDriverAchievements,
  getDefaultRoster,
  rebuildDriversFromHistory,
  apply2026DriverNumberAdjustments,
} from "./utils/driverHelpers";
import {
  normalizeTrackName,
  getEasternDateParts,
  getEasternNowParts,
  getStartParkCutoffInfo,
  wasStartParkRequestBeforeCutoff,
  hasRaceRolledOver,
  getSortedTracksByDate,
  getUpcomingRaceByDate,
  isRaceCompleteByDateOrHistory,
  sanitizeTracks,
} from "./utils/raceHelpers";
import {
  makeSeasonId,
  createEmptySeason,
  sanitizeSeason,
  buildLegacySeasonFromLocalStorage,
  loadInitialLeagueState,
  isUsableLeagueState,
  makeLeagueStateSignature,
  normalizeLoadedLeagueState,
} from "./utils/leagueHelpers";
import {
  downloadRaceHistoryCsv,
  makeLeagueBackupPayload,
  downloadLeagueBackupFile,
  isValidLeagueBackup,
  createRaceDataBackup,
  makeRaceResultsLedgerRows,
  saveRaceResultsLedger,
  syncAllRaceResultsLedger,
} from "./utils/backupHelpers";
import { money } from "./utils/formatters";
import {
  INDEPENDENT_DRIVER_BASE_SALARY,
  LEAGUE_BANK_NAME,
  APP_VERSION,
} from "./data/appConfig";
import {
  normalizeMessageValue,
  getCurrentUserFromSession,
  canViewLeagueMessage,
  filterLeagueMessagesForSession,
} from "./utils/messagePermissions";
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  headerButtonStyle,
  activeHeaderButtonStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  dangerButtonStyle,
  inputStyle,
  racePositionInputStyle,
  racePenaltyInputStyle,
  raceNotesInputStyle,
  tableStyle,
  thStyle,
  tdStyle,
  raceEntryThStyle,
  raceEntryTdStyle,
  statBoxStyle,
} from "./styles/sharedStyles";
function AdminLoginPage() {
  const ADMIN_ACCESS_CODE = "BCLADMINPASSWORD2026";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    if (code.trim() === ADMIN_ACCESS_CODE) {
      sessionStorage.setItem("bcl-admin-auth", "true");
      sessionStorage.setItem("bcl-admin-auth-time", new Date().toISOString());
      localStorage.removeItem("bcl-admin-auth");
      localStorage.removeItem("bcl-admin-auth-time");
      window.location.pathname = "/admin";
      return;
    }
    setError("Invalid admin code.");
  };

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 760 }}>
        <div style={{ ...sectionCardStyle, marginTop: 40, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <img src={logo} alt="League Logo" style={{ height: 62 }} />
            <div>
              <div style={{ fontSize: 32, fontWeight: 900 }}>Admin Portal Login</div>
              <div style={{ opacity: 0.72, marginTop: 4 }}>Budweiser Cup League private dashboard</div>
            </div>
          </div>

          <form onSubmit={handleLogin}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>
              ADMIN ACCESS CODE
            </label>
            <input
              type="password"
              value={code}
              onChange={(event) => { setCode(event.target.value); setError(""); }}
              placeholder="Enter admin access code"
              style={inputStyle}
              autoFocus
            />
            {error && <div style={{ color: "#f87171", marginTop: 10, fontWeight: 800 }}>{error}</div>}
            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button type="submit" style={primaryButtonStyle}>Unlock Admin Portal</button>
              <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function renderTeamBadge(teamName, size = 44) {
  const brand = getTeamBranding(teamName);
  const logoSrc = teamLogos[teamName];
  if (logoSrc) {
    return (
      <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", background: "#111" }}>
        <img src={logoSrc} alt={teamName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", background: `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", fontSize: size * 0.28 }}>
      {brand.logo}
    </div>
  );
}

async function syncCruiserNumberAndNumberOwnership() {
  try {
    // Best-effort Supabase sync. If a table/column does not exist in your project, this will fail safely and the app will keep running.
    await supabase
      .from("number_pool")
      .upsert({ number: "54", team: "19XI", owner_team: "19XI", status: "owned", available: false, updated_at: new Date().toISOString() }, { onConflict: "number" });
  } catch (error) {
    console.warn("Could not sync No. 54 ownership to 19XI. Check number_pool columns/RLS if needed.", error);
  }
}



function LeaderboardOverlay({ drivers, preview = false, seasonName = "" }) {
  const cleanDrivers = dedupeDriversByNumber(drivers);
  const sorted = [...cleanDrivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  return (
    <div style={{ minHeight: "100vh", background: preview ? "#111" : "transparent", color: "white", padding: 20, boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1000, background: "rgba(10,10,10,0.84)", border: "2px solid #d4af37", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#0f1218", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 28, fontWeight: 800 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={logo} alt="League Logo" style={{ height: 42 }} />Driver Standings</div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>
        <table style={tableStyle}><thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Team</th><th style={thStyle}>Mfr</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
          <tbody>{sorted.map((d, i) => <tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={{...tdStyle, display: "flex", alignItems: "center", justifyContent: "center"}}><div style={{width: 32, height: 32, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", border: "2px solid #b8a059"}}>{d.number}</div></td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{getTeamFullName(d.team)}</td><td style={tdStyle}>{d.manufacturer || "—"}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td><td style={tdStyle}>{d.top3}</td><td style={tdStyle}>{d.top5}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
function TeamOverlay({ teams, preview = false, seasonName = "" }) {
  return (
    <div style={{ minHeight: "100vh", background: preview ? "#111" : "transparent", color: "white", padding: 20, boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 900, background: "rgba(10,10,10,0.84)", border: "2px solid #d4af37", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px", background: "#0f1218", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", fontSize: 28, fontWeight: 800 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={logo} alt="League Logo" style={{ height: 42 }} />Team Standings</div>
          <div style={{ fontSize: 14, opacity: 0.78 }}>{seasonName}</div>
        </div>
        <table style={tableStyle}><thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
          <tbody>{teams.map((t, i) => <tr key={t.team} onClick={() => (window.location.href = `/team/${t.team}`)} style={{ cursor: "pointer" }}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{getTeamFullName(t.team)}</td><td style={tdStyle}>{t.points}</td><td style={tdStyle}>{t.wins}</td><td style={tdStyle}>{t.top3}</td><td style={tdStyle}>{t.top5}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

function AppUpdateBanner({ page = "all" }) {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBanner() {
      const { data, error } = await supabase
        .from("app_update_banners")
        .select("*")
        .in("page", ["all", page])
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!isMounted) return;
      if (!error) setBanner(data || null);
    }

    loadBanner();
    return () => {
      isMounted = false;
    };
  }, [page]);

  if (!banner) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #d4af37 0%, #facc15 45%, #f59e0b 100%)",
        color: "#111",
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 16,
        padding: "14px 20px",
        marginBottom: 20,
        fontWeight: 900,
        fontSize: 14,
        boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        lineHeight: 1.35,
      }}
    >
      <span style={{ fontSize: 18 }}>🚨</span>
      <span>{banner.message}</span>
    </div>
  );
}


const defaultTickerItems = [
  { category: "TEAM UPDATE", message: "Current team roster cleaned up for the active season" },
  { category: "TRANSACTION", message: "BigDiehl21 signs with ME Racing and moves to the No. 39 Chevrolet" },
  { category: "TRANSACTION", message: "BayouX Motorsports updates KnightTrain41 to the No. 41 Ford" },
  { category: "TEAM UPDATE", message: "CaJunThrottle28 moves to the No. 48 Chevrolet for BXM" },
  { category: "RESULTS", message: "Michigan weekend complete — Pocono Raceway is up next" },
  { category: "APP UPDATE", message: "Driver password reset support, interview sync improvements, and Race Control groundwork added" },
];

function LeagueTicker({ page = "standings", fallbackItems = defaultTickerItems }) {
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadTicker() {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("ticker_messages")
        .select("*")
        .eq("active", true)
        .in("page", ["all", page])
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
        .order("pinned", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Could not load ticker messages:", error);
        setLoadError(true);
        setItems(fallbackItems || []);
        return;
      }

      setLoadError(false);
      setItems(data?.length ? data : (fallbackItems || []));
    }

    loadTicker();
    const interval = setInterval(loadTicker, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [page, fallbackItems]);

  const cleanItems = (items || [])
    .map((item) => ({
      category: String(item.category || item.type || "NEWS").trim().toUpperCase(),
      message: String(item.message || "").trim(),
      pinned: Boolean(item.pinned),
    }))
    .filter((item) => item.message);

  if (!cleanItems.length) return null;

  const tickerText = cleanItems
    .map((item) => `${item.pinned ? "📌 " : ""}${item.category}: ${item.message}`)
    .join("   •   ");

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #080b10 0%, #111827 50%, #080b10 100%)",
        border: "1px solid rgba(212,175,55,0.82)",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 18,
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", alignItems: "stretch", minHeight: 46 }}>
        <div
          style={{
            background: "linear-gradient(135deg, #d4af37 0%, #f59e0b 100%)",
            color: "#111",
            padding: "12px 16px",
            fontWeight: 1000,
            letterSpacing: 0.8,
            fontSize: 13,
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🏁 LEAGUE TICKER
        </div>
        <div style={{ flex: 1, overflow: "hidden", position: "relative", display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "inline-block",
              paddingLeft: "100%",
              whiteSpace: "nowrap",
              animation: "bcl-ticker-scroll 55s linear infinite",
              color: "#facc15",
              fontWeight: 900,
              fontSize: 14,
              textShadow: "0 1px 12px rgba(250,204,21,0.25)",
            }}
          >
            {tickerText}
            {loadError ? "   •   USING FALLBACK TICKER — CHECK SUPABASE TICKER_MESSAGES TABLE" : ""}
          </div>
        </div>
      </div>
      <style>
        {`
          @keyframes bcl-ticker-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}


function MemorialDayPage({ drivers = [] }) {
  const [tributes, setTributes] = useState([]);
  const [form, setForm] = useState({
    driver_id: "",
    honoree_name: "",
    relationship: "",
    branch: "",
    accomplishments: "",
    story: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  async function loadTributes() {
    const { data, error } = await supabase
      .from("memorial_day_tributes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load memorial tributes:", error);
      try {
        setTributes(JSON.parse(localStorage.getItem("bclMemorialDayTributes") || "[]"));
      } catch {
        setTributes([]);
      }
      return;
    }

    setTributes(data || []);
  }

  useEffect(() => {
    loadTributes();
  }, []);
  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitTribute(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const driver = activeDrivers.find((item) => String(item.id) === String(form.driver_id));

    if (!driver) {
      setError("Select your driver before submitting.");
      return;
    }

    if (!form.honoree_name.trim() || !form.story.trim()) {
      setError("Please add who you are driving for and a short story.");
      return;
    }

    const payload = {
      driver_id: String(driver.id),
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: getTeamFullName(driver.team || "Independent"),
      manufacturer: driver.manufacturer || "",
      honoree_name: form.honoree_name.trim(),
      relationship: form.relationship.trim(),
      branch: form.branch.trim(),
      accomplishments: form.accomplishments.trim(),
      story: form.story.trim(),
      status: "approved",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("memorial_day_tributes").insert([payload]);

    if (insertError) {
      console.error("Could not save memorial tribute:", insertError);
      try {
        const saved = JSON.parse(localStorage.getItem("bclMemorialDayTributes") || "[]");
        localStorage.setItem("bclMemorialDayTributes", JSON.stringify([{ ...payload, id: `local-${Date.now()}` }, ...saved]));
        setMessage("Tribute saved on this browser. Check Supabase table/RLS to make it visible everywhere.");
      } catch {
        setError("Could not save tribute. Check the memorial_day_tributes table and RLS policies.");
        return;
      }
    } else {
      setMessage("Memorial Day tribute submitted.");
    }

    setForm({
      driver_id: "",
      honoree_name: "",
      relationship: "",
      branch: "",
      accomplishments: "",
      story: "",
    });

    await loadTributes();
  }

  return (
    <div style={{ ...appShellStyle, background: "radial-gradient(circle at top left, rgba(30,64,175,0.32), transparent 34%), radial-gradient(circle at top right, rgba(185,28,28,0.28), transparent 32%), #07111f" }}>
      <div style={{ ...pageContainerStyle, maxWidth: 1180 }}>
        <div style={{ ...sectionCardStyle, border: "1px solid rgba(255,255,255,0.16)", background: "linear-gradient(135deg, rgba(127,29,29,0.82), rgba(15,23,42,0.96), rgba(30,64,175,0.78))" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 2, color: "#facc15" }}>BUDWEISER CUP LEAGUE</div>
              <h1 style={{ margin: "8px 0", fontSize: 42, lineHeight: 1 }}>🇺🇸 Memorial Day Tribute Wall</h1>
              <p style={{ margin: 0, opacity: 0.86, maxWidth: 760 }}>
                Drivers can share who they are driving for and honor their service, sacrifice, and accomplishments.
              </p>
            </div>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={submitTribute} style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Submit Driver Tribute</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>DRIVER</label>
              <select value={form.driver_id} onChange={(event) => updateField("driver_id", event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>#{driver.number} {driver.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>WHO ARE YOU DRIVING FOR?</label>
              <input value={form.honoree_name} onChange={(event) => updateField("honoree_name", event.target.value)} placeholder="Name of honoree" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>RELATIONSHIP</label>
              <input value={form.relationship} onChange={(event) => updateField("relationship", event.target.value)} placeholder="Father, grandfather, friend, etc." style={inputStyle} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>BRANCH / SERVICE</label>
              <input value={form.branch} onChange={(event) => updateField("branch", event.target.value)} placeholder="Army, Navy, Marines, Air Force, etc." style={inputStyle} />
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>ACCOMPLISHMENTS</label>
            <input value={form.accomplishments} onChange={(event) => updateField("accomplishments", event.target.value)} placeholder="Service awards, deployments, family legacy, community impact..." style={inputStyle} />
          </div>

          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>SHORT STORY</label>
            <textarea value={form.story} onChange={(event) => updateField("story", event.target.value)} rows={5} placeholder="Tell the story of who you are honoring." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          {message && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{message}</div>}
          {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}

          <div style={{ marginTop: 16 }}>
            <button type="submit" style={primaryButtonStyle}>Submit Tribute</button>
          </div>
        </form>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Tribute Wall</h2>
          {tributes.length === 0 ? (
            <div style={{ opacity: 0.72 }}>No tributes submitted yet.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
              {tributes.map((tribute) => (
                <div key={tribute.id || `${tribute.driver_name}-${tribute.honoree_name}`} style={{ background: "#0f1319", border: "1px solid #334155", borderRadius: 16, padding: 16 }}>
                  <div style={{ color: "#facc15", fontWeight: 900 }}>#{tribute.driver_number} {tribute.driver_name}</div>
                  <h3 style={{ margin: "8px 0" }}>Driving for {tribute.honoree_name}</h3>
                  <div style={{ opacity: 0.75, fontSize: 13 }}>{tribute.relationship || "Honoree"} {tribute.branch ? `• ${tribute.branch}` : ""}</div>
                  {tribute.accomplishments && <p style={{ fontWeight: 800 }}>{tribute.accomplishments}</p>}
                  <p style={{ lineHeight: 1.45 }}>{tribute.story}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


const PAINT_SCHEME_WEEKLY_DRIVER_PAYOUT = 10000;
const PAINT_SCHEME_SEASON_DRIVER_PAYOUT_CAP = 250000;

function getPaintSchemePayout(position) {
  const pos = Number(position);
  if (pos >= 1 && pos <= 40) return { team: 0, driver: PAINT_SCHEME_WEEKLY_DRIVER_PAYOUT };
  return { team: 0, driver: 0 };
}

function getNextFridayMidnightDeadline(date = new Date()) {
  const easternParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(easternParts.map((part) => [part.type, part.value]));
  const currentUtc = new Date(`${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}-04:00`);
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[values.weekday] ?? 0;
  let daysUntilFriday = (5 - dayIndex + 7) % 7;
  const passedFridayMidnight = dayIndex === 5 && (Number(values.hour) > 0 || Number(values.minute) > 0 || Number(values.second) > 0);
  if (passedFridayMidnight) daysUntilFriday = 7;
  const deadline = new Date(currentUtc);
  deadline.setUTCDate(deadline.getUTCDate() + daysUntilFriday);
  deadline.setUTCHours(4, 0, 0, 0); // Friday 12:00 AM Eastern during the season.
  return deadline;
}

function getPaintUploadUpdatedAt(upload) {
  return upload.updated_at || upload.modified_at || upload.uploaded_at || upload.created_at || upload.inserted_at || null;
}

function isPaintUploadEligibleForPayout(upload, deadline = getNextFridayMidnightDeadline()) {
  const updatedAt = getPaintUploadUpdatedAt(upload);
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() <= new Date(deadline).getTime();
}

function getPaintSchemeSeasonPaidByDriver(payouts = []) {
  const paidByDriver = new Map();
  (payouts || []).forEach((payout) => {
    (payout.rows || []).forEach((row) => {
      const driverKey = String(row.driverId || row.driverNumber || row.driverName || "Unknown Driver");
      paidByDriver.set(driverKey, (paidByDriver.get(driverKey) || 0) + Number(row.driverPayout || 0));
    });
  });
  return paidByDriver;
}

function applyPaintSchemeDriverSeasonCaps(
  rows = [],
  seasonCap = PAINT_SCHEME_SEASON_DRIVER_PAYOUT_CAP,
  seasonPaidByDriver = new Map()
) {
  const weeklyPaidByDriver = new Map();
  return rows.map((row) => {
    const driverKey = String(row.driverId || row.driverNumber || row.driverName || "Unknown Driver");
    const alreadyPaidThisWeek = weeklyPaidByDriver.get(driverKey) || 0;
    const alreadyPaidThisSeason = seasonPaidByDriver.get(driverKey) || 0;
    const seasonRemaining = Math.max(0, seasonCap - alreadyPaidThisSeason - alreadyPaidThisWeek);
    const originalDriverPayout = Number(row.driverPayout || 0);
    const cappedDriverPayout = Math.min(originalDriverPayout, seasonRemaining);
    weeklyPaidByDriver.set(driverKey, alreadyPaidThisWeek + cappedDriverPayout);
    return {
      ...row,
      teamPayout: 0,
      originalTeamPayout: 0,
      teamWeeklyCapApplied: false,
      teamSeasonCapApplied: false,
      teamCapApplied: false,
      teamSeasonPaidBeforeAward: 0,
      originalDriverPayout,
      driverPayout: cappedDriverPayout,
      driverSeasonCapApplied: cappedDriverPayout < originalDriverPayout,
      driverSeasonPaidBeforeAward: alreadyPaidThisSeason,
    };
  });
}

function buildPaintSchemePayoutRows(rankedUploads = [], drivers = [], deadline = getNextFridayMidnightDeadline(), seasonPayouts = []) {
  const rows = rankedUploads
    .filter((upload) => isPaintUploadEligibleForPayout(upload, deadline))
    .slice(0, 40)
    .map((upload, index) => {
      const rank = index + 1;
      const payout = getPaintSchemePayout(rank);
      const matchedDriver = (drivers || []).find((driver) =>
        String(driver.id) === String(upload.driver_id) ||
        String(driver.number) === String(upload.driver_number || upload.car_number || upload.number) ||
        String(driver.name || '').trim().toLowerCase() === String(upload.driver_name || upload.uploader_name || '').trim().toLowerCase()
      );
      return {
        rank,
        uploadId: upload.id,
        driverId: matchedDriver?.id || upload.driver_id || null,
        driverNumber: matchedDriver?.number || upload.driver_number || upload.car_number || upload.number || '',
        driverName: matchedDriver?.name || upload.driver_name || upload.uploader_name || 'Unknown Driver',
        team: matchedDriver?.team || upload.team || upload.team_key || 'Independent',
        votes: Number(upload.voteCount || 0),
        imageUrl: upload.image_url || upload.file_url || '',
        updatedAt: getPaintUploadUpdatedAt(upload),
        deadline: deadline.toISOString(),
        teamPayout: payout.team,
        driverPayout: payout.driver,
      };
    });
  return applyPaintSchemeDriverSeasonCaps(rows, PAINT_SCHEME_SEASON_DRIVER_PAYOUT_CAP, getPaintSchemeSeasonPaidByDriver(seasonPayouts));
}

function getEasternDateTimePartsForPaintWinner(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

function isPaintWinnerSpotlightWindow(date = new Date()) {
  const eastern = getEasternDateTimePartsForPaintWinner(date);
  const minutes = (Number(eastern.hour) || 0) * 60 + (Number(eastern.minute) || 0);

  // New BCL weekly timeline:
  // Paint voting winner gets the spotlight after voting closes Wednesday at 11:59 PM ET.
  // That spotlight stays up until race start Saturday at 9:30 PM ET.
  if (eastern.weekday === "Wed") return minutes >= (23 * 60 + 59);
  if (eastern.weekday === "Thu" || eastern.weekday === "Fri") return true;
  if (eastern.weekday === "Sat") return minutes < (21 * 60 + 30);
  return false;
}

function shouldShowPreviousPaintWinner(date = new Date()) {
  return isPaintWinnerSpotlightWindow(date);
}

function shouldShowPreviousRaceWinnerSpotlight(date = new Date()) {
  // Race winner owns the main spotlight from race start Saturday night
  // until the next paint scheme winner is revealed Wednesday night.
  return !isPaintWinnerSpotlightWindow(date);
}

function getPaintWinnerRaceForCurrentWeek(tracks = [], date = new Date()) {
  // Paint Scheme voting is for the upcoming race week.
  // Example: after Pocono, the Wednesday paint winner should be Bristol,
  // not Pocono. This keeps the spotlight tied to the next race on the schedule.
  return getUpcomingRaceByDate(tracks) || null;
}

function getPreviousCompletedRaceForPaintWinner(tracks = [], date = new Date()) {
  const easternNow = getEasternDateTimePartsForPaintWinner(date);

  const sorted = [...(tracks || [])]
    .filter((track) => track?.date)
    .sort((a, b) => new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`));

  const completed = sorted.filter((track) => {
    const raceDate = String(track.date || "").slice(0, 10);
    if (!raceDate) return false;
    if (easternNow.dateKey > raceDate) return true;
    if (easternNow.dateKey < raceDate) return false;
    return easternNow.hour >= 22;
  });

  return completed[completed.length - 1] || null;
}

function getPaintUploadRaceForStandings(upload) {
  return upload?.race_id || upload?.race_week || upload?.race_name || "";
}

function isPaintImageUploadForStandings(upload) {
  const url = upload?.image_url || upload?.file_url || "";
  const fileType = String(upload?.file_type || "").toLowerCase();
  return fileType.startsWith("image/") || url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
}

function PaintSchemeWinnerStandingsCard({ tracks = [], drivers = [] }) {
  const [winners, setWinners] = useState([]);
  const [raceName, setRaceName] = useState("");
  const [loading, setLoading] = useState(true);

  const spotlightRace = useMemo(() => getPaintWinnerRaceForCurrentWeek(tracks), [JSON.stringify((tracks || []).map((track) => ({ name: track?.name, date: track?.date }))) ]);
  const spotlightRaceName = spotlightRace?.name || "";
  const driversKeyForPaintWinner = useMemo(() => JSON.stringify((drivers || []).map((driver) => ({ id: driver?.id, number: driver?.number, name: driver?.name, team: driver?.team }))), [drivers]);
  const showWinnerWindow = shouldShowPreviousPaintWinner();

  useEffect(() => {
    let isMounted = true;

    async function loadWinner() {
      if (!showWinnerWindow) {
        if (isMounted) {
          setWinners([]);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      if (!spotlightRaceName) {
        if (isMounted) {
          setWinners([]);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
        supabase.from("paint_scheme_votes").select("*").order("created_at", { ascending: false }),
      ]);

      if (uploadError || voteError) {
        console.error("Could not load upcoming paint scheme winner:", uploadError || voteError);
        if (isMounted) {
          setWinners([]);
          setRaceName("");
          setLoading(false);
        }
        return;
      }

      const raceUploads = (uploadData || [])
        .filter((upload) => isPaintImageUploadForStandings(upload))
        .filter((upload) => normalizeTrackName(getPaintUploadRaceForStandings(upload)) === normalizeTrackName(spotlightRaceName));

      if (raceUploads.length === 0) {
        if (isMounted) {
          setWinners([]);
          setRaceName(spotlightRaceName);
          setLoading(false);
        }
        return;
      }

      const counts = new Map();
      (voteData || []).forEach((vote) => {
        const key = String(vote.upload_id || vote.voted_upload_id || vote.paint_scheme_id || vote.car_upload_id || "");
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const sorted = [...raceUploads].sort((a, b) => {
        const voteDiff = (counts.get(String(b.id)) || 0) - (counts.get(String(a.id)) || 0);
        if (voteDiff !== 0) return voteDiff;
        return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
      });

      const topVoteCount = counts.get(String(sorted[0]?.id)) || 0;

      if (topVoteCount <= 0) {
        if (isMounted) {
          setWinners([]);
          setRaceName(spotlightRaceName);
          setLoading(false);
        }
        return;
      }

      const winningUploads = sorted.filter((upload) => (counts.get(String(upload.id)) || 0) === topVoteCount);
      const enrichedWinners = winningUploads.map((winningUpload) => {
        const driver = (drivers || []).find((item) => String(item.id) === String(winningUpload.driver_id));
        return {
          ...winningUpload,
          voteCount: counts.get(String(winningUpload.id)) || 0,
          driverLabel: driver ? `#${driver.number} ${driver.name}` : winningUpload.driver_name || winningUpload.uploader_name || "Unknown Driver",
          teamLabel: driver?.team || winningUpload.team || winningUpload.team_key || "—",
          imageUrl: winningUpload.image_url || winningUpload.file_url || "",
        };
      });

      if (isMounted) {
        setWinners(enrichedWinners);
        setRaceName(spotlightRaceName);
        setLoading(false);
      }
    }

    loadWinner();

    return () => {
      isMounted = false;
    };
  }, [spotlightRaceName, showWinnerWindow, driversKeyForPaintWinner]);

  if (loading || winners.length === 0) return null;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(212,175,55,0.18), rgba(15,23,42,0.96))",
        border: "1px solid #d4af37",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
        display: "grid",
        gridTemplateColumns: winners.length > 1 ? "minmax(220px, 420px) 1fr" : "minmax(180px, 320px) 1fr",
        gap: 18,
        alignItems: "center",
      }}
    >
      <div style={{ borderRadius: 14, overflow: "hidden", background: "#0f1319", border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "grid", gridTemplateColumns: winners.length > 1 ? "1fr 1fr" : "1fr", gap: winners.length > 1 ? 8 : 0 }}>
          {winners.map((winner) => (
            <img key={winner.id} src={winner.imageUrl} alt={winner.driverLabel} style={{ width: "100%", height: 190, objectFit: "cover", display: "block", borderRadius: winners.length > 1 ? 10 : 0 }} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase" }}>
          Upcoming Race Paint Winner
        </div>
        <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
          🎨 Paint Scheme of the Week
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>
          {winners.map((winner) => winner.driverLabel).join(" + ")}
        </div>
        <div style={{ opacity: 0.75, marginTop: 4 }}>
          {raceName} • {winners.length > 1 ? "Tie winners" : winners[0]?.teamLabel} • {winners[0]?.voteCount || 0} votes
        </div>
        <div style={{ opacity: 0.62, fontSize: 12, marginTop: 10 }}>
          Paint winner spotlight runs Wednesday 11:59 PM ET through Saturday 9:30 PM ET.
        </div>
      </div>
    </div>
  );
}


function PreviousRaceWinnerStandingsCard() {
  const [winner, setWinner] = useState(null);
  const showRaceWinnerWindow = shouldShowPreviousRaceWinnerSpotlight();

  useEffect(() => {
    let isMounted = true;

    async function loadWinner() {
      const { data, error } = await supabase
        .from("previous_race_winner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Could not load previous race winner:", error);
        setWinner(null);
        return;
      }

      setWinner(data || null);
    }

    loadWinner();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!showRaceWinnerWindow || !winner) return null;

  const mediaUrl = winner.media_url || winner.mediaUrl || "";
  const mediaType = winner.media_type || winner.mediaType || "";
  const raceName = winner.race_name || winner.raceName || "Last Race";
  const driverName = winner.driver_name || winner.name || "";
  const driverNumber = winner.driver_number || winner.number || "";
  const votePoints = winner.points || 0;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,23,42,0.96))",
        border: "1px solid #22c55e",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
      }}
    >
      {mediaUrl && (
        <div style={{ marginBottom: 14, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.14)", background: "#0f1319" }}>
          {mediaType === "video" ? (
            <video controls src={mediaUrl} style={{ width: "100%", maxHeight: 420, display: "block", objectFit: "cover" }} />
          ) : (
            <img src={mediaUrl} alt={`${driverName} previous race winner`} style={{ width: "100%", maxHeight: 420, display: "block", objectFit: "cover" }} />
          )}
        </div>
      )}

      <div style={{ color: "#22c55e", fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase" }}>
        Previous Race Winner
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
        🏁 {raceName}
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
        #{driverNumber} {driverName}
      </div>
      <div style={{ opacity: 0.75, marginTop: 4 }}>
        {winner.team || "—"} • {winner.manufacturer || "—"} • {votePoints} points
      </div>
      {winner.note && <div style={{ marginTop: 10, lineHeight: 1.5, opacity: 0.82 }}>{winner.note}</div>}
    </div>
  );
}


function PreviousRaceWinnerAdminPanel({ drivers = [], raceHistory = [] }) {
  const [form, setForm] = useState({ raceName: "", driverId: "", number: "", name: "", team: "", manufacturer: "", points: "", note: "", mediaUrl: "", mediaType: "" });
  const [savingWinner, setSavingWinner] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState("");
  const [winnerError, setWinnerError] = useState("");

  const [cloudinaryReady, setCloudinaryReady] = useState(Boolean(window.cloudinary));
  const imageWidgetRef = useRef(null);
  const videoWidgetRef = useRef(null);

  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
      return;
    }

    const existing = document.getElementById("cloudinary-widget-script");
    if (existing) {
      existing.addEventListener("load", () => setCloudinaryReady(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "cloudinary-widget-script";
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryReady(true);
    script.onerror = () => console.error("Cloudinary widget failed to load");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!cloudinaryReady || !window.cloudinary) return;

    imageWidgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "car_uploads",
        resourceType: "image",
        folder: "previous-race-winners",
        maxFileSize: 15000000,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "gif"],
      },
      (error, result) => {
        if (error) {
          console.error("Previous race winner image upload failed:", error);
          alert("Image upload failed: " + (error.message || "Unknown error"));
          return;
        }

        if (result?.event === "success") {
          setForm((current) => ({
            ...current,
            mediaUrl: result.info.secure_url,
            mediaType: "image",
          }));
          alert("✅ Winner picture uploaded.");
        }
      }
    );

    videoWidgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "car_uploads",
        resourceType: "auto",
        folder: "previous-race-winners",
        maxFileSize: 200000000,
        clientAllowedFormats: ["mp4", "mov", "avi", "mkv", "webm"],
      },
      (error, result) => {
        if (error) {
          console.error("Previous race winner video upload failed:", error);
          alert("Video upload failed: " + (error.message || "Unknown error"));
          return;
        }

        if (result?.event === "success") {
          setForm((current) => ({
            ...current,
            mediaUrl: result.info.secure_url,
            mediaType: "video",
          }));
          alert("✅ Winner video uploaded.");
        }
      }
    );
  }, [cloudinaryReady]);

  function openWinnerImageUploader() {
    if (!cloudinaryReady || !imageWidgetRef.current) {
      alert("Uploader is still loading. Try again in a moment.");
      return;
    }
    imageWidgetRef.current.open();
  }

  function openWinnerVideoUploader() {
    if (!cloudinaryReady || !videoWidgetRef.current) {
      alert("Uploader is still loading. Try again in a moment.");
      return;
    }
    videoWidgetRef.current.open();
  }


  const latestRace = Array.isArray(raceHistory) && raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((result) => Number(result.finishPos) === 1 || result.isWin) || null;

  useEffect(() => {
    let isMounted = true;

    async function loadSavedWinner() {
      const { data, error } = await supabase
        .from("previous_race_winner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Could not load saved previous race winner:", error);
        setWinnerError("Could not load saved winner. Check previous_race_winner RLS select policy.");
        return;
      }

      if (data) {
        setForm({
          raceName: data.race_name || "",
          driverId: data.driver_id || "",
          number: data.driver_number || "",
          name: data.driver_name || "",
          team: data.team || "",
          manufacturer: data.manufacturer || "",
          points: data.points || "",
          note: data.note || "",
          mediaUrl: data.media_url || "",
          mediaType: data.media_type || "",
        });
      }
    }

    loadSavedWinner();

    return () => {
      isMounted = false;
    };
  }, []);


  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseDriver(driverId) {
    const driver = (drivers || []).find((item) => String(item.id) === String(driverId));
    if (!driver) {
      updateField("driverId", driverId);
      return;
    }

    setForm((current) => ({
      ...current,
      driverId,
      number: driver.number || "",
      name: driver.name || "",
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
    }));
  }

  function autofillFromLatestRace() {
    if (!latestRace || !latestWinner) {
      alert("No race winner found in race history yet.");
      return;
    }

    setForm({
      raceName: latestRace.raceName || "",
      driverId: latestWinner.driverId || "",
      number: latestWinner.number || "",
      name: latestWinner.name || "",
      team: latestWinner.team || "",
      manufacturer: latestWinner.manufacturer || "",
      points: latestWinner.totalRacePoints ?? "",
      note: form.note || "",
      mediaUrl: form.mediaUrl || "",
      mediaType: form.mediaType || "",
    });
  }

  async function saveWinner() {
    setWinnerMessage("");
    setWinnerError("");

    if (!form.raceName || !form.name || !form.number) {
      alert("Add the race name, driver name, and number before saving.");
      return;
    }

    const payload = {
      id: 1,
      race_name: form.raceName || "",
      driver_id: form.driverId ? String(form.driverId) : null,
      driver_number: String(form.number || ""),
      driver_name: form.name || "",
      team: form.team || "",
      manufacturer: form.manufacturer || "",
      points: Number(form.points || 0),
      note: form.note || "",
      media_url: form.mediaUrl || "",
      media_type: form.mediaType || "",
      active: true,
      updated_at: new Date().toISOString(),
    };

    setSavingWinner(true);

    const { error } = await supabase
      .from("previous_race_winner")
      .upsert(payload, { onConflict: "id" });

    setSavingWinner(false);

    if (error) {
      console.error("Could not save previous race winner:", error);
      setWinnerError("Could not save winner. Check previous_race_winner table and RLS upsert policy.");
      alert("Could not save winner. Check previous_race_winner table and RLS policy.");
      return;
    }

    setWinnerMessage("Previous race winner saved to /standings.");
    alert("Previous race winner saved to /standings.");
  }

  async function clearWinner() {
    if (!window.confirm("Clear the previous race winner from standings?")) return;

    setWinnerMessage("");
    setWinnerError("");

    const { error } = await supabase
      .from("previous_race_winner")
      .delete()
      .eq("id", 1);

    if (error) {
      console.error("Could not clear previous race winner:", error);
      setWinnerError("Could not clear winner. Check previous_race_winner RLS delete policy.");
      alert("Could not clear winner. Check previous_race_winner RLS delete policy.");
      return;
    }

    setForm({ raceName: "", driverId: "", number: "", name: "", team: "", manufacturer: "", points: "", note: "", mediaUrl: "", mediaType: "" });
    setWinnerMessage("Previous race winner cleared from /standings.");
    alert("Previous race winner cleared.");
  }

  const isWinnerMobile = typeof window !== "undefined" && window.innerWidth < 760;

  const winnerShellStyle = {
    background: "#f5f5f7",
    color: "#1d1d1f",
    border: "1px solid #e5e5ea",
    borderRadius: isWinnerMobile ? 24 : 34,
    padding: isWinnerMobile ? 14 : 22,
    boxShadow: "0 22px 60px rgba(0,0,0,0.08)",
  };

  const winnerHeroStyle = {
    position: "relative",
    overflow: "hidden",
    minHeight: isWinnerMobile ? 360 : 430,
    borderRadius: isWinnerMobile ? 22 : 32,
    padding: isWinnerMobile ? 20 : 34,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    background: form.mediaUrl
      ? "linear-gradient(180deg, rgba(0,0,0,0.20), rgba(0,0,0,0.76))"
      : "radial-gradient(circle at top left, #ffffff 0%, #e8eefc 34%, #111827 100%)",
    color: "#ffffff",
    boxShadow: "0 24px 55px rgba(15,23,42,0.24)",
  };

  const appleInputStyle = {
    ...inputStyle,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    minHeight: 46,
  };

  const appleLabelStyle = {
    display: "block",
    fontSize: 11,
    fontWeight: 1000,
    letterSpacing: 1.15,
    textTransform: "uppercase",
    color: "#6b7280",
    marginBottom: 8,
  };

  const appleActionRowStyle = {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 18,
  };

  const appleFormCardStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: isWinnerMobile ? 20 : 26,
    padding: isWinnerMobile ? 14 : 18,
    boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
  };

  return (
    <div style={winnerShellStyle}>
      <div style={{ display: "grid", gridTemplateColumns: isWinnerMobile ? "1fr" : "1.05fr 0.95fr", gap: isWinnerMobile ? 16 : 22, alignItems: "stretch" }}>
        <div style={winnerHeroStyle}>
          {form.mediaUrl && (
            form.mediaType === "video" ? (
              <video src={form.mediaUrl} muted playsInline autoPlay loop style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
            ) : (
              <img src={form.mediaUrl} alt="Winner media preview" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
            )
          )}
          <div style={{ position: "absolute", inset: 0, background: form.mediaUrl ? "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.82))" : "linear-gradient(180deg, rgba(15,23,42,0.04), rgba(15,23,42,0.74))", zIndex: 1 }} />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(16px)", fontSize: 12, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase" }}>
              🏁 Previous Race
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: isWinnerMobile ? 15 : 17, fontWeight: 900, opacity: 0.86, letterSpacing: 1.2, textTransform: "uppercase" }}>{form.raceName || "Race Weekend"}</div>
            <div style={{ marginTop: 8, fontSize: isWinnerMobile ? 44 : 64, lineHeight: 0.94, fontWeight: 1000, letterSpacing: isWinnerMobile ? -1.6 : -3.2 }}>
              #{form.number || "--"}<br />{form.name || "Winner"}
            </div>
            <div style={{ marginTop: 18, display: "flex", flexWrap: "wrap", gap: 10 }}>
              <span style={{ padding: "9px 12px", borderRadius: 999, background: "rgba(255,255,255,0.16)", backdropFilter: "blur(18px)", fontWeight: 900 }}>{form.team || "Team TBD"}</span>
              <span style={{ padding: "9px 12px", borderRadius: 999, background: "rgba(255,255,255,0.16)", backdropFilter: "blur(18px)", fontWeight: 900 }}>{form.manufacturer || "Manufacturer TBD"}</span>
              <span style={{ padding: "9px 12px", borderRadius: 999, background: "rgba(255,255,255,0.16)", backdropFilter: "blur(18px)", fontWeight: 900 }}>{form.points || "0"} pts</span>
            </div>
            {form.note && <div style={{ marginTop: 18, maxWidth: 620, fontSize: isWinnerMobile ? 14 : 16, lineHeight: 1.5, opacity: 0.9 }}>{form.note}</div>}
          </div>
        </div>

        <div style={appleFormCardStyle}>
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>Race Weekend Recap</div>
          <h2 style={{ margin: "5px 0 6px", fontSize: isWinnerMobile ? 28 : 38, lineHeight: 1.02, letterSpacing: -1.2 }}>Winner Spotlight</h2>
          <div style={{ color: "#6b7280", fontWeight: 750, lineHeight: 1.45 }}>Create the Apple-style winner feature that feeds the standings page.</div>

          <div style={appleActionRowStyle}>
            <button type="button" onClick={autofillFromLatestRace} style={{ ...secondaryButtonStyle, background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 999 }}>
              Auto-Fill Latest Race
            </button>
            <button type="button" onClick={saveWinner} style={{ ...primaryButtonStyle, borderRadius: 999 }}>
              {savingWinner ? "Saving..." : "Save Winner"}
            </button>
            <button type="button" onClick={clearWinner} style={{ ...dangerButtonStyle, borderRadius: 999 }}>
              Clear
            </button>
          </div>

          {winnerMessage && <div style={{ marginTop: 14, color: "#047857", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 14, padding: 12, fontWeight: 900 }}>{winnerMessage}</div>}
          {winnerError && <div style={{ marginTop: 14, color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 14, padding: 12, fontWeight: 900 }}>{winnerError}</div>}

          <div style={{ display: "grid", gridTemplateColumns: isWinnerMobile ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 12, marginTop: 18 }}>
            <div style={{ gridColumn: isWinnerMobile ? "auto" : "span 2" }}>
              <label style={appleLabelStyle}>Race Name</label>
              <input value={form.raceName || ""} onChange={(event) => updateField("raceName", event.target.value)} placeholder="Las Vegas" style={appleInputStyle} />
            </div>

            <div style={{ gridColumn: isWinnerMobile ? "auto" : "span 2" }}>
              <label style={appleLabelStyle}>Select Driver</label>
              <select value={form.driverId || ""} onChange={(event) => chooseDriver(event.target.value)} style={appleInputStyle}>
                <option value="">Manual / choose driver</option>
                {(drivers || []).map((driver) => (
                  <option key={driver.id} value={driver.id}>#{driver.number} {driver.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={appleLabelStyle}>Number</label>
              <input value={form.number || ""} onChange={(event) => updateField("number", event.target.value)} placeholder="21" style={appleInputStyle} />
            </div>
            <div>
              <label style={appleLabelStyle}>Points</label>
              <input value={form.points || ""} onChange={(event) => updateField("points", event.target.value)} placeholder="55" style={appleInputStyle} />
            </div>
            <div style={{ gridColumn: isWinnerMobile ? "auto" : "span 2" }}>
              <label style={appleLabelStyle}>Driver Name</label>
              <input value={form.name || ""} onChange={(event) => updateField("name", event.target.value)} placeholder="Driver name" style={appleInputStyle} />
            </div>
            <div>
              <label style={appleLabelStyle}>Team</label>
              <input value={form.team || ""} onChange={(event) => updateField("team", event.target.value)} placeholder="Nine Line Motorsports" style={appleInputStyle} />
            </div>
            <div>
              <label style={appleLabelStyle}>Manufacturer</label>
              <input value={form.manufacturer || ""} onChange={(event) => updateField("manufacturer", event.target.value)} placeholder="Toyota" style={appleInputStyle} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isWinnerMobile ? "1fr" : "0.9fr 1.1fr", gap: 14, marginTop: 16 }}>
        <div style={appleFormCardStyle}>
          <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase", color: "#6b7280", marginBottom: 10 }}>Winner Media</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={openWinnerImageUploader} style={{ ...secondaryButtonStyle, background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb", borderRadius: 999, opacity: cloudinaryReady ? 1 : 0.6 }}>
              {cloudinaryReady ? "Upload Picture" : "Loading Uploader"}
            </button>
            <button type="button" onClick={openWinnerVideoUploader} style={{ ...secondaryButtonStyle, background: "#111827", color: "#ffffff", border: "1px solid #111827", borderRadius: 999, opacity: cloudinaryReady ? 1 : 0.6 }}>
              {cloudinaryReady ? "Upload Video" : "Loading Uploader"}
            </button>
            {form.mediaUrl && (
              <button type="button" onClick={() => setForm((current) => ({ ...current, mediaUrl: "", mediaType: "" }))} style={{ ...dangerButtonStyle, borderRadius: 999 }}>
                Remove
              </button>
            )}
          </div>
          <div style={{ marginTop: 12, color: "#6b7280", fontWeight: 750, lineHeight: 1.45 }}>Use a winner car photo, burnout shot, reveal graphic, or short hype video.</div>
        </div>

        <div style={appleFormCardStyle}>
          <label style={appleLabelStyle}>Short Note Optional</label>
          <textarea value={form.note || ""} onChange={(event) => updateField("note", event.target.value)} rows={isWinnerMobile ? 4 : 5} placeholder="Example: Controlled the closing run and delivered a statement win under the lights." style={{ ...appleInputStyle, resize: "vertical", width: "100%" }} />
        </div>
      </div>
    </div>
  );
}


function AdminLeagueMessageComposer({ drivers = [], teams = [] }) {
  const [form, setForm] = useState({
    recipient_type: "league",
    recipient_driver_number: "",
    recipient_team: "",
    recipient_manufacturer: "Toyota",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  const activeTeams = useMemo(() => {
    const teamSet = new Set();
    (teams || []).forEach((team) => {
      const key = team?.team || team;
      if (key && key !== "Independent" && key !== "IND") teamSet.add(key);
    });
    activeDrivers.forEach((driver) => {
      if (driver.team && driver.team !== "Independent" && driver.team !== "IND") teamSet.add(driver.team);
    });
    return Array.from(teamSet).sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [teams, activeDrivers]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function sendAdminMessage(event) {
    event?.preventDefault?.();
    setStatus("");
    setError("");

    const body = String(form.message || "").trim();
    const subject = String(form.subject || "").trim();
    const recipientType = String(form.recipient_type || "league");

    if (!body) {
      setError("Type a message before sending.");
      return;
    }

    if (body.length > 1500) {
      setError("Keep admin messages under 1,500 characters to save database space.");
      return;
    }

    const basePayload = {
      message_type: recipientType === "manufacturer" ? "manufacturer" : recipientType === "owners" ? "owner_notice" : "race_control",
      sender_type: "admin",
      sender_name: recipientType === "manufacturer" ? `${form.recipient_manufacturer} Manufacturer Office` : "Race Control / League Board",
      subject: subject || null,
      message: body,
      is_read: false,
      archived: false,
      created_at: new Date().toISOString(),
    };

    let payload = { ...basePayload, recipient_type: recipientType };

    if (recipientType === "driver") {
      if (!form.recipient_driver_number) {
        setError("Choose a driver.");
        return;
      }
      const driver = activeDrivers.find((item) => String(item.number) === String(form.recipient_driver_number));
      payload = {
        ...payload,
        recipient_driver_number: String(form.recipient_driver_number),
        recipient_team: driver?.team || null,
        recipient_manufacturer: driver?.manufacturer || null,
      };
    }

    if (recipientType === "team") {
      if (!form.recipient_team) {
        setError("Choose a team.");
        return;
      }
      payload = { ...payload, recipient_team: form.recipient_team };
    }

    if (recipientType === "manufacturer") {
      if (!form.recipient_manufacturer) {
        setError("Choose a manufacturer.");
        return;
      }
      payload = { ...payload, recipient_manufacturer: form.recipient_manufacturer };
    }

    const { error: insertError } = await supabase.from("league_messages").insert([payload]);

    if (insertError) {
      console.error("Could not send admin message:", insertError);
      setError("Could not send message. Check league_messages insert policy and columns.");
      return;
    }

    setForm((current) => ({ ...current, subject: "", message: "" }));
    setStatus("League Message Center notice sent.");
  }

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>📢 League Message Center Sender</h2>
          <div style={{ opacity: 0.72, fontSize: 13, marginTop: 6 }}>Send official messages from the Board, Race Control, owners group, teams, or manufacturers.</div>
        </div>
        <button type="button" onClick={() => (window.location.pathname = "/message-center")} style={secondaryButtonStyle}>Open Public Message Center</button>
      </div>

      <form onSubmit={sendAdminMessage}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SEND TO</label>
            <select value={form.recipient_type} onChange={(event) => updateField("recipient_type", event.target.value)} style={inputStyle}>
              <option value="league">Entire League</option>
              <option value="owners">Owners Only</option>
              <option value="driver">Specific Driver</option>
              <option value="team">Specific Team</option>
              <option value="manufacturer">Manufacturer Group</option>
            </select>
          </div>

          {form.recipient_type === "driver" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER</label>
              <select value={form.recipient_driver_number} onChange={(event) => updateField("recipient_driver_number", event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => (
                  <option key={driver.id || driver.number} value={String(driver.number)}>#{driver.number} {driver.name} — {getTeamFullName(driver.team)} / {driver.manufacturer}</option>
                ))}
              </select>
            </div>
          )}

          {form.recipient_type === "team" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>TEAM</label>
              <select value={form.recipient_team} onChange={(event) => updateField("recipient_team", event.target.value)} style={inputStyle}>
                <option value="">Choose team</option>
                {activeTeams.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
              </select>
            </div>
          )}

          {form.recipient_type === "manufacturer" && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>MANUFACTURER</label>
              <select value={form.recipient_manufacturer} onChange={(event) => updateField("recipient_manufacturer", event.target.value)} style={inputStyle}>
                <option value="Toyota">Toyota</option>
                <option value="Ford">Ford</option>
                <option value="Chevrolet">Chevrolet</option>
              </select>
            </div>
          )}

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SUBJECT</label>
            <input value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Penalty, meeting, race control notice..." style={inputStyle} maxLength={120} />
          </div>
        </div>

        <textarea value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Type the official league message..." rows={5} style={{ ...inputStyle, resize: "vertical" }} maxLength={1500} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <button type="submit" style={primaryButtonStyle}>Send League Message</button>
          <div style={{ fontSize: 12, opacity: 0.65 }}>{form.message.length}/1500 characters</div>
        </div>
        {status && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{status}</div>}
        {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}
      </form>
    </div>
  );
}


function AdminLeagueMessageDashboard({ drivers = [], teams = [] }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  function getRecipientLabel(message) {
    const type = String(message?.recipient_type || "").toLowerCase();
    if (message?.recipient_driver_number) {
      const driver = activeDrivers.find((item) => String(item.number) === String(message.recipient_driver_number));
      return `#${message.recipient_driver_number}${driver?.name ? ` ${driver.name}` : ""}`;
    }
    if (type === "team" || message?.recipient_team) return getTeamFullName(message.recipient_team || "Team");
    if (type === "manufacturer" || message?.recipient_manufacturer) return `${message.recipient_manufacturer || "Manufacturer"} Drivers`;
    if (type === "owners") return "Owners Only";
    if (type === "league") return "Entire League";
    return message?.recipient_type || "Unknown";
  }

  const filteredMessages = useMemo(() => {
    const term = String(search || "").trim().toLowerCase();
    return (messages || [])
      .filter((message) => {
        if (filter !== "all" && getMessageCategory(message) !== filter) return false;
        if (!term) return true;
        const haystack = [
          message.subject,
          message.message,
          message.sender_name,
          message.recipient_type,
          message.recipient_driver_number,
          message.recipient_team,
          message.recipient_manufacturer,
          getRecipientLabel(message),
        ].join(" ").toLowerCase();
        return haystack.includes(term);
      });
  }, [messages, filter, search, activeDrivers]);

  const summary = useMemo(() => {
    const rows = messages || [];
    return {
      total: rows.length,
      unread: rows.filter((message) => !message.is_read).length,
      owners: rows.filter((message) => getMessageCategory(message) === "owners" || getMessageCategory(message) === "team").length,
      drivers: rows.filter((message) => getMessageCategory(message) === "driver").length,
      broadcasts: rows.filter((message) => ["league", "manufacturer"].includes(getMessageCategory(message))).length,
    };
  }, [messages]);

  async function loadAdminMessages() {
    setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("league_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (loadError) {
      console.error("Could not load admin message dashboard:", loadError);
      setError("Could not load messages. Check league_messages select policy.");
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages(filterLeagueMessagesForSession(data || [], currentDriverSession || driverSession || loggedInDriver || mobileSession || {}));
    setLoading(false);
  }


  async function updateAdminMessageReadStatus(messageId, isRead) {
    if (!messageId) return;
    setStatus("");
    setError("");

    const { error: updateError } = await supabase
      .from("league_messages")
      .update({ is_read: Boolean(isRead) })
      .eq("id", messageId);

    if (updateError) {
      console.error("Could not update message read status:", updateError);
      setError("Could not update message read status. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, is_read: Boolean(isRead) } : message));
    setSelectedMessage((current) => current?.id === messageId ? { ...current, is_read: Boolean(isRead) } : current);
    setStatus(isRead ? "Message marked read." : "Message marked unread.");
  }

  async function markFilteredMessagesRead() {
    const unreadIds = (filteredMessages || []).filter((message) => !message.is_read && !message.archived).map((message) => message.id).filter(Boolean);
    if (!unreadIds.length) {
      setStatus("No unread messages in the current filter.");
      return;
    }

    setStatus("");
    setError("");
    const { error: updateError } = await supabase
      .from("league_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (updateError) {
      console.error("Could not mark filtered messages read:", updateError);
      setError("Could not mark filtered messages read. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, is_read: true } : message));
    setStatus("Filtered unread messages marked read.");
  }

  async function archiveMessage(messageId) {
    if (!messageId) return;
    if (!window.confirm("Archive this message from the admin dashboard?")) return;
    setStatus("");
    setError("");

    const { error: archiveError } = await supabase
      .from("league_messages")
      .update({ archived: true })
      .eq("id", messageId);

    if (archiveError) {
      console.error("Could not archive message:", archiveError);
      setError("Could not archive message. Check league_messages update policy.");
      return;
    }

    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, archived: true } : message));
    setStatus("Message archived.");
  }

  useEffect(() => {
    loadAdminMessages();
    const interval = setInterval(loadAdminMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ ...sectionCardStyle, border: "1px solid #3d4859" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>📬 Admin Message Dashboard</h2>
          <div style={{ opacity: 0.72, fontSize: 13, marginTop: 6 }}>
            Board view for messages sent to owners, teams, drivers, manufacturers, and the entire league.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={loadAdminMessages} style={secondaryButtonStyle} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Messages"}
          </button>
          <button type="button" onClick={markFilteredMessagesRead} style={primaryButtonStyle}>Mark Filtered Read</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>TOTAL</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.total}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>UNREAD</div><div style={{ fontSize: 24, fontWeight: 900, color: "#f87171" }}>{summary.unread}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>OWNERS / TEAMS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.owners}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>DRIVERS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.drivers}</div></div>
        <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12, fontWeight: 900 }}>BROADCASTS</div><div style={{ fontSize: 24, fontWeight: 900 }}>{summary.broadcasts}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>FILTER</label>
          <select value={filter} onChange={(event) => setFilter(event.target.value)} style={inputStyle}>
            <option value="all">All Messages</option>
            <option value="owners">Owners Only</option>
            <option value="team">Teams</option>
            <option value="driver">Drivers</option>
            <option value="manufacturer">Manufacturers</option>
            <option value="league">Entire League</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>SEARCH</label>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search subject, recipient, team, driver..." style={inputStyle} />
        </div>
      </div>

      {status && <div style={{ color: "#4ade80", marginBottom: 12, fontWeight: 900 }}>{status}</div>}
      {error && <div style={{ color: "#f87171", marginBottom: 12, fontWeight: 900 }}>{error}</div>}

      {filteredMessages.length === 0 ? (
        <div style={{ opacity: 0.72 }}>No messages found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>To</th>
                <th style={thStyle}>From</th>
                <th style={thStyle}>Subject</th>
                <th style={thStyle}>Read</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.map((message) => {
                const archived = Boolean(message.archived);
                return (
                  <tr key={message.id} style={{ opacity: archived ? 0.45 : 1 }}>
                    <td style={tdStyle}>{message.created_at ? new Date(message.created_at).toLocaleString() : "—"}</td>
                    <td style={tdStyle}>{getRecipientLabel(message)}</td>
                    <td style={tdStyle}>{message.sender_name || message.sender_type || "League"}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 900 }}>{message.subject || "No subject"}</div>
                      <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>{String(message.message || "").slice(0, 90)}{String(message.message || "").length > 90 ? "..." : ""}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ display: "inline-flex", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900, background: message.is_read ? "#102a16" : "#2a1111", color: message.is_read ? "#4ade80" : "#f87171", border: `1px solid ${message.is_read ? "#22c55e" : "#ef4444"}` }}>
                        {message.is_read ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => setSelectedMessage(message)} style={secondaryButtonStyle}>View</button>
                        {!archived && (!message.is_read ? <button type="button" onClick={() => updateAdminMessageReadStatus(message.id, true)} style={secondaryButtonStyle}>Mark Read</button> : <button type="button" onClick={() => updateAdminMessageReadStatus(message.id, false)} style={secondaryButtonStyle}>Mark Unread</button>)}
                        {!archived && <button type="button" onClick={() => archiveMessage(message.id)} style={dangerButtonStyle}>Archive</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedMessage && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.74)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#171b22", border: "1px solid #3d4859", borderRadius: 18, padding: 22, width: "min(760px, 100%)", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.45)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{selectedMessage.subject || "No subject"}</div>
                <div style={{ opacity: 0.65, fontSize: 13, marginTop: 6 }}>
                  To: {getRecipientLabel(selectedMessage)} · From: {selectedMessage.sender_name || selectedMessage.sender_type || "League"}
                </div>
                <div style={{ opacity: 0.55, fontSize: 12, marginTop: 4 }}>{selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ""}</div>
              </div>
              <button type="button" onClick={() => setSelectedMessage(null)} style={secondaryButtonStyle}>Close</button>
            </div>
            <div style={{ marginTop: 18, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {selectedMessage.message || "No message body."}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 14, fontSize: 12, opacity: 0.75 }}>
              <div>Type: {selectedMessage.message_type || "—"}</div>
              <div>Recipient Type: {selectedMessage.recipient_type || "—"}</div>
              <div>Team: {selectedMessage.recipient_team || "—"}</div>
              <div>Manufacturer: {selectedMessage.recipient_manufacturer || "—"}</div>
              <div>Archived: {selectedMessage.archived ? "Yes" : "No"}</div>
              <div>Read: {selectedMessage.is_read ? "Yes" : "No"}</div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              {!selectedMessage.is_read ? <button type="button" onClick={() => updateAdminMessageReadStatus(selectedMessage.id, true)} style={primaryButtonStyle}>Mark Read</button> : <button type="button" onClick={() => updateAdminMessageReadStatus(selectedMessage.id, false)} style={secondaryButtonStyle}>Mark Unread</button>}
              {!selectedMessage.archived && <button type="button" onClick={() => archiveMessage(selectedMessage.id)} style={dangerButtonStyle}>Archive</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function TickerOverlay({ drivers, teams, raceHistory, preview = false, seasonName = "" }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points);
  const latestRace = raceHistory?.[raceHistory.length - 1];
  const winner = latestRace?.results?.find((r) => r.finishPos === 1);
  const tickerText = [
    seasonName ? `Season: ${seasonName}` : "Budweiser Cup League",
    winner ? `Latest Winner: #${winner.number} ${winner.name} (${latestRace.raceName})` : "No race winner yet",
    ...sorted.map((d, i) => `${i+1}. #${d.number} ${d.name} - ${d.points} pts`),
    ...teams.map((t, i) => `Team ${i+1}: ${getTeamFullName(t.team)} - ${t.points} pts`),
  ].join("   •   ");
  return (
    <div style={{ width: "100%", minHeight: preview ? "100vh" : "80px", background: preview ? "#111" : "transparent", display: "flex", alignItems: preview ? "center" : "flex-start", justifyContent: "center", paddingTop: preview ? 20 : 0, boxSizing: "border-box" }}>
      <style>{`.ticker-bar{width:100%;overflow:hidden;background:rgba(0,0,0,0.82);border-top:2px solid #d4af37;border-bottom:2px solid #d4af37;height:80px;display:flex;align-items:center}.ticker-track{display:inline-flex;align-items:center;white-space:nowrap;min-width:max-content;animation:tickerScroll 45s linear infinite}.ticker-logo{height:30px;width:auto;margin-right:28px;vertical-align:middle}.ticker-text{display:inline-block;padding-right:120px;font-size:28px;font-weight:700;color:white}@keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
      <div className="ticker-bar">
        <div className="ticker-track">
          <img src={logo} alt="League Logo" className="ticker-logo" />
          <span className="ticker-text">{tickerText}</span>
          <img src={logo} alt="League Logo" className="ticker-logo" />
          <span className="ticker-text">{tickerText}</span>
        </div>
      </div>
    </div>
  );
}
// ─── Patch any drivers from defaultDrivers that are missing from saved seasons ─
// This runs once after Supabase load so new roster additions always appear
// even when a season already exists in the database.
function patchMissingDrivers(cleanSeasons) {
  return cleanSeasons.map((season) => {
    const existingIds  = new Set(season.drivers.map((d) => d.id));
    const existingNums = new Set(season.drivers.map((d) => String(d.number)));
    const missing = defaultDrivers.filter(
      (d) => !isRemovedLeagueDriver(d) && Number(d.number) !== 76 && !existingNums.has(String(d.number))
    );
    // Update any drivers whose name/number/manufacturer/team has changed in defaultDrivers
    const updatedDrivers = realignLeagueDrivers(season.drivers)
      .filter((d) => !isInactivePlaceholderDriver(d))
      .filter((d) => !isRemovedLeagueDriver(d))
      .filter((d) => Number(d.number) !== 76 && String(d.name || "").trim().toLowerCase() !== "bcr_ziggy5525")
      .map((d) => {
        const canonical =
          defaultDrivers.find((dd) => dd.id === d.id) ||
          defaultDrivers.find((dd) => String(dd.number) === String(d.number));
        if (!canonical) {
          return { ...d };
        }
        return {
          ...d,
          id: canonical.id,
          name: canonical.name,
          number: canonical.number,
          manufacturer: canonical.manufacturer,
          team: canonical.team,
        };
      });
    if (missing.length === 0 && updatedDrivers.every((d, i) => d === season.drivers[i])) return season;
    const newRoster = dedupeDriversByNumber([
      ...updatedDrivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false, notes: "" })),
      ...missing.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: false, notes: "" })),
    ]);
    return { ...season, drivers: rebuildDriversFromHistory(season.raceHistory || [], newRoster) };
  });
}

function SubmitStoryPage() {
  const [authorName, setAuthorName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showKickGraphic, setShowKickGraphic] = useState(false);

  const submitStory = async (e) => {
    e.preventDefault();
    const cleanStory = storyText.trim();
    if (!cleanStory) {
      alert("Please type your story before submitting.");
      return;
    }
    setSaving(true);
    const payload = {
      author_name: authorName.trim() || null,
      driver_name: driverName.trim() || null,
      title: storyTitle.trim() || null,
      story: cleanStory,
      status: "Open",
    };
    const { error } = await supabase.from("story_submissions").insert(payload);
    setSaving(false);
    if (error) {
      console.error("Story submission failed:", error);
      alert("Could not submit the story. Make sure the story_submissions Supabase table exists.");
      return;
    }
    setAuthorName("");
    setDriverName("");
    setStoryTitle("");
    setStoryText("");
    setSubmitted(true);
    setShowKickGraphic(true);
  };

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 900 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logo} alt="League Logo" style={{ height: 48 }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>Submit a Story</div>
                <div style={{ opacity: 0.72, fontSize: 14 }}>Send news, rumors, driver notes, race recaps, or league storylines to the admins.</div>
              </div>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
          {submitted && (
            <div style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.45)", borderRadius: 14, padding: 14, marginBottom: 16, color: "#bbf7d0", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>Story submitted. The admins can now review it.</span>
              <button type="button" onClick={() => setShowKickGraphic(true)} style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>View Kick Graphic</button>
            </div>
          )}

          {showKickGraphic && (
            <div onClick={() => setShowKickGraphic(false)} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.86)", display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "min(1100px, 96vw)", background: "#050505", border: "2px solid #ef4444", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 90px rgba(239,68,68,0.25)" }}>
                <button type="button" onClick={() => setShowKickGraphic(false)} aria-label="Close story submitted graphic" style={{ position: "absolute", top: 12, right: 12, zIndex: 2, width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.25)", background: "rgba(0,0,0,0.55)", color: "white", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>×</button>
                <img src={logo} alt="Story submitted action graphic" style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          )}
          <form onSubmit={submitStory}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Your Name / PSN</div>
                <input style={inputStyle} value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Example: AMP-GHOSTRIDER" />
              </div>
              <div>
                <div style={{ marginBottom: 6, fontWeight: 800 }}>Driver / Team Mentioned</div>
                <input style={inputStyle} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Example: #39 BigDiehl21 / MER" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Story Title</div>
              <input style={inputStyle} value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="Example: B2J adds a new Toyota to the garage" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 6, fontWeight: 800 }}>Story Details</div>
              <textarea
                style={{ ...inputStyle, minHeight: 220, resize: "vertical", lineHeight: 1.45 }}
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Type the full story, notes, quote, rumor, race recap, or announcement here."
              />
            </div>
            <button type="submit" disabled={saving} style={{ ...primaryButtonStyle, opacity: saving ? 0.65 : 1 }}>
              {saving ? "Submitting..." : "Submit Story"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function StoriesAdminPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storyLoadError, setStoryLoadError] = useState("");

  const loadStories = async ({ showLoading = false } = {}) => {
    if (showLoading) setLoading(true);
    setStoryLoadError("");

    const { data, error } = await supabase
      .from("story_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load stories:", error);
      setStoryLoadError("Could not load stories. Check the story_submissions table and RLS select policy.");
      if (showLoading) setLoading(false);
      return;
    }

    setStories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    async function initialLoad() {
      const { data, error } = await supabase
        .from("story_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error("Failed to load stories:", error);
        setStoryLoadError("Could not load stories. Check the story_submissions table and RLS select policy.");
      } else {
        setStories(data || []);
        setStoryLoadError("");
      }

      setLoading(false);
    }

    initialLoad();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateStoryStatus = async (storyId, status) => {
    const { error } = await supabase
      .from("story_submissions")
      .update({ status })
      .eq("id", storyId);
    if (error) {
      console.error("Failed to update story:", error);
      alert("Could not update that story.");
      return;
    }
    await loadStories({ showLoading: false });
  };

  const openStories = stories.filter((story) => String(story.status || "Open") === "Open");

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logo} alt="League Logo" style={{ height: 48 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 900 }}>Story Inbox</div>
                <div style={{ opacity: 0.72 }}>Review submitted league stories and mark them complete.</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => loadStories({ showLoading: false })} style={secondaryButtonStyle}>Refresh</button>
              <button onClick={() => (window.location.pathname = "/admin")} style={secondaryButtonStyle}>Back to Admin</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 18 }}>
          <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12 }}>OPEN STORIES</div><div style={{ fontSize: 30, fontWeight: 900 }}>{openStories.length}</div></div>
          <div style={statBoxStyle}><div style={{ opacity: 0.65, fontSize: 12 }}>TOTAL SUBMITTED</div><div style={{ fontSize: 30, fontWeight: 900 }}>{stories.length}</div></div>
        </div>

        {storyLoadError && (
          <div style={{ ...sectionCardStyle, borderColor: "#7f1d1d", color: "#f87171", fontWeight: 900 }}>
            {storyLoadError}
          </div>
        )}

        {loading ? (
          <div style={sectionCardStyle}>Loading stories...</div>
        ) : stories.length === 0 ? (
          <div style={sectionCardStyle}>No stories submitted yet.</div>
        ) : (
          stories.map((story) => (
            <div key={story.id} style={{ ...sectionCardStyle, borderColor: String(story.status || "Open") === "Open" ? "#d4af37" : "#2c3440" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900 }}>{story.title || "Untitled Story"}</div>
                  <div style={{ opacity: 0.68, fontSize: 13, marginTop: 4 }}>
                    Submitted by {story.author_name || "Unknown"}{story.driver_name ? ` • ${story.driver_name}` : ""}{story.created_at ? ` • ${new Date(story.created_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div style={{ background: String(story.status || "Open") === "Open" ? "rgba(212,175,55,0.16)" : "rgba(34,197,94,0.12)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "8px 12px", fontWeight: 900, height: "fit-content" }}>
                  {story.status || "Open"}
                </div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 14, padding: 14, whiteSpace: "pre-wrap", lineHeight: 1.5, marginBottom: 12 }}>
                {story.story}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => updateStoryStatus(story.id, "Open")} style={secondaryButtonStyle}>Mark Open</button>
                <button onClick={() => updateStoryStatus(story.id, "Reviewed")} style={primaryButtonStyle}>Mark Reviewed</button>
                <button onClick={() => updateStoryStatus(story.id, "Archived")} style={dangerButtonStyle}>Archive</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


const DEFAULT_DISCORD_INVITE_URL = "https://discord.gg/mwQ6DYuXB2";
const DEFAULT_DISCORD_RULES = [
  "Use your real league driver name or a recognizable nickname.",
  "Race control channels are for official league communication only during events.",
  "Keep driver media active, competitive, and sponsor-friendly.",
  "No harassment, hate speech, or personal attacks. Keep the trash talk racing-focused.",
  "Team channels are for team operations, practice notes, strategy, and owner communication.",
  "Appeals and incidents should go through the app or the proper Discord channel, not public arguments.",
];

function getDiscordSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("bcl-discord-settings") || "{}");
    const savedInviteUrl = String(saved.inviteUrl || "").trim();
    const inviteUrl = !savedInviteUrl || savedInviteUrl.includes("YOUR-LINK-HERE")
      ? DEFAULT_DISCORD_INVITE_URL
      : savedInviteUrl;
    return {
      inviteUrl,
      rulesText: saved.rulesText || DEFAULT_DISCORD_RULES.join("\n"),
      announcement: saved.announcement || "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
    };
  } catch {
    return {
      inviteUrl: DEFAULT_DISCORD_INVITE_URL,
      rulesText: DEFAULT_DISCORD_RULES.join("\n"),
      announcement: "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
    };
  }
}

function DiscordPage() {
  const settings = getDiscordSettings();
  const rules = String(settings.rulesText || "").split("\n").map((rule) => rule.trim()).filter(Boolean);
  const voiceChannels = [
    "🏁 Race Control",
    "🎙️ Driver Interviews",
    "📡 Broadcast Booth",
    "🔧 Garage / Practice",
    "🚗 Team Owner Meetings",
    "⚖️ Appeals Review Waiting Room",
    "🍻 League Hangout",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #1d2430 0%, #0d1117 42%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: 24 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #5865f2 0%, #20233a 52%, #10141b 100%)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 24, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={logo} alt="League Logo" style={{ height: 64, filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))" }} />
              <div>
                <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>BCL DISCORD HUB</div>
                <div style={{ opacity: 0.82, marginTop: 8, fontSize: 16 }}>{settings.announcement}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => window.open(settings.inviteUrl, "_blank", "noopener,noreferrer")} style={{ background: "#ffffff", color: "#111827", border: "none", borderRadius: 12, padding: "13px 18px", fontWeight: 900, cursor: "pointer" }}>💬 Join Discord</button>
              <button onClick={() => (window.location.pathname = "/standings")} style={{ background: "rgba(0,0,0,0.28)", color: "white", border: "1px solid rgba(255,255,255,0.24)", borderRadius: 12, padding: "13px 18px", fontWeight: 800, cursor: "pointer" }}>Back to Standings</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>League Discord Rules</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {rules.map((rule, index) => (
                <div key={`${rule}-${index}`} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 12, padding: 12, lineHeight: 1.45 }}>
                  <strong style={{ color: "#d4af37" }}>#{index + 1}</strong> {rule}
                </div>
              ))}
            </div>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Suggested Voice Channels</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {voiceChannels.map((channel) => (
                <div key={channel} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 12, padding: 12, fontWeight: 800 }}>{channel}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const PAYMENT_COMPLIANCE_OVERRIDE_KEY = "bclPaymentComplianceOverrides";

function getPaymentTimestamp(row) {
  if (!row || typeof row !== "object") return null;
  return (
    row.submitted_at ||
    row.submittedAt ||
    row.completed_at ||
    row.completedAt ||
    row.uploaded_at ||
    row.uploadedAt ||
    row.created_at ||
    row.createdAt ||
    row.updated_at ||
    row.updatedAt ||
    row.timestamp ||
    row.date ||
    row.inserted_at ||
    row.insertedAt ||
    row.published_at ||
    row.publishedAt ||
    null
  );
}

function formatPaymentTimestamp(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function makeEasternIso(dateKey, time = "23:59") {
  // The 2026 league schedule is during Eastern daylight time, so -04:00 keeps the deadline aligned to ET.
  return `${dateKey}T${time}:00-04:00`;
}

function addDaysToDateKey(dateKey, days) {
  if (!dateKey) return "";
  const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWednesdayBeforeRaceDate(dateKey) {
  if (!dateKey) return "";
  const date = new Date(`${String(dateKey).slice(0, 10)}T12:00:00Z`);
  const day = date.getUTCDay();
  const daysBack = (day - 3 + 7) % 7;
  date.setUTCDate(date.getUTCDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function getRecordRaceName(row = {}) {
  row = row || {};
  return String(row.race_name || row.raceName || row.track_name || row.track || row.race || row.event_name || row.event || "").trim();
}

function getRecordDriverNumber(row = {}) {
  row = row || {};
  return String(row.driver_number || row.driverNumber || row.number || row.car_number || row.carNumber || row.driver_num || "").trim();
}

function getRecordDriverName(row = {}) {
  row = row || {};
  return String(row.driver_name || row.driverName || row.name || row.uploader_name || row.submitted_by || row.author_name || "").trim().toLowerCase();
}

function getRecordTeam(row = {}) {
  row = row || {};
  return String(row.team || row.team_key || row.team_abbr || row.team_name || "").trim();
}

function getInterviewKind(row = {}) {
  row = row || {};
  const raw = String(row.interview_type || row.type || row.category || row.kind || row.phase || row.title || row.prompt_type || "").toLowerCase();
  if (raw.includes("pre")) return "pre";
  if (raw.includes("post")) return "post";
  return "";
}

function interviewLooksAnswered(row = {}) {
  row = row || {};
  if (row.completed === true || row.submitted === true) return true;
  const status = String(row.status || "").toLowerCase();
  if (["answered", "complete", "completed", "submitted", "posted"].includes(status)) return true;
  const answerFields = [row.answer, row.answers, row.response, row.responses, row.body, row.notes, row.content];
  return answerFields.some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return String(value || "").trim().length > 0;
  });
}

function recordMatchesDriver(row = {}, driver = {}) {
  const number = getRecordDriverNumber(row);
  const name = getRecordDriverName(row);
  const team = getRecordTeam(row);
  return (
    (number && String(driver.number) === number) ||
    (name && String(driver.name || "").trim().toLowerCase() === name) ||
    (team && String(driver.team || "") === team && !number && !name)
  );
}

function recordMatchesRace(row = {}, raceName = "") {
  const rowRace = getRecordRaceName(row).toLowerCase();
  const wanted = String(raceName || "").trim().toLowerCase();
  if (!wanted) return true;
  if (!rowRace) return true;
  return rowRace === wanted;
}

function getTeamPaymentOverride(overrides = [], teamKey = "", periodKey = "") {
  return (overrides || []).find((item) => String(item.team_key || item.team || "") === String(teamKey) && String(item.period_key || item.periodKey || "") === String(periodKey));
}

function buildPaymentComplianceRows({ teams = [], drivers = [], interviews = [], carUploads = [], overrides = [], previousRace = null, upcomingRace = null }) {
  interviews = (Array.isArray(interviews) ? interviews : []).filter((row) => row && typeof row === "object");
  carUploads = (Array.isArray(carUploads) ? carUploads : []).filter((row) => row && typeof row === "object");
  overrides = (Array.isArray(overrides) ? overrides : []).filter((row) => row && typeof row === "object");
  const previousRaceDate = previousRace?.date || "";
  const upcomingRaceDate = upcomingRace?.date || "";
  const previousRaceName = previousRace?.name || "";
  const upcomingRaceName = upcomingRace?.name || "";
  const paymentPeriodKey = `${previousRaceName || "no-previous"}__${upcomingRaceName || "no-upcoming"}`;
  const paintDeadlineIso = upcomingRaceDate ? makeEasternIso(getWednesdayBeforeRaceDate(upcomingRaceDate), "23:59") : "";
  const postDeadlineIso = previousRaceDate ? makeEasternIso(addDaysToDateKey(previousRaceDate, 4), "23:59") : "";
  const preDeadlineIso = upcomingRaceDate ? makeEasternIso(String(upcomingRaceDate).slice(0, 10), "20:30") : "";

  const eligibleTeams = (teams || [])
    .filter((team) => team?.team && team.team !== "Independent" && team.team !== "IND")
    .sort((a, b) => getTeamFullName(a.team).localeCompare(getTeamFullName(b.team)));

  return eligibleTeams.map((team) => {
    const teamDrivers = (drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver) && String(driver.team || "") === String(team.team))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));

    const driverChecks = teamDrivers.map((driver) => {
      const paintRecord = (carUploads || [])
        .filter((row) => recordMatchesDriver(row, driver) && recordMatchesRace(row, upcomingRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;
      const postRecord = (interviews || [])
        .filter((row) => getInterviewKind(row) === "post" && interviewLooksAnswered(row) && recordMatchesDriver(row, driver) && recordMatchesRace(row, previousRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;
      const preRecord = (interviews || [])
        .filter((row) => getInterviewKind(row) === "pre" && interviewLooksAnswered(row) && recordMatchesDriver(row, driver) && recordMatchesRace(row, upcomingRaceName))
        .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0))[0] || null;

      const paintAt = getPaymentTimestamp(paintRecord);
      const postAt = getPaymentTimestamp(postRecord);
      const preAt = getPaymentTimestamp(preRecord);

      return {
        driver,
        paintAt,
        postAt,
        preAt,
        paintMet: !!paintAt && (!paintDeadlineIso || new Date(paintAt) <= new Date(paintDeadlineIso)),
        postMet: !!postAt && (!postDeadlineIso || new Date(postAt) <= new Date(postDeadlineIso)),
        preMet: !!preAt && (!preDeadlineIso || new Date(preAt) <= new Date(preDeadlineIso)),
      };
    });

    const baseMet = teamDrivers.length > 0 && driverChecks.every((check) => check.paintMet && check.postMet && check.preMet);
    const override = getTeamPaymentOverride(overrides, team.team, paymentPeriodKey);
    const overrideStatus = override?.override_status || override?.status || "";
    const finalEligible = overrideStatus === "approved" ? true : overrideStatus === "denied" ? false : baseMet;

    return {
      teamKey: team.team,
      teamName: getTeamFullName(team.team),
      driverCount: teamDrivers.length,
      driverChecks,
      previousRaceName,
      upcomingRaceName,
      paymentPeriodKey,
      paintDeadlineIso,
      postDeadlineIso,
      preDeadlineIso,
      baseMet,
      finalEligible,
      override,
      overrideStatus,
    };
  });
}

function DriverVoteReminderStrip({ driverNumber = "" }) {
  const [openVoteCount, setOpenVoteCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function loadOpenVoteReminders() {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("league_votes")
        .select("id,title,deadline,active")
        .eq("active", true)
        .gt("deadline", nowIso);
      if (!isMounted || error) return;
      setOpenVoteCount((data || []).length);
    }
    loadOpenVoteReminders();
    const interval = setInterval(loadOpenVoteReminders, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, [driverNumber]);

  if (!openVoteCount) return null;

  return (
    <div style={{ minHeight: 0, background: "#0c0f14", padding: "0 20px 12px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(90deg, #d4af37 0%, #f59e0b 100%)", color: "#111", borderRadius: 14, padding: "12px 16px", fontWeight: 1000, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>🔔 {openVoteCount} league vote{openVoteCount === 1 ? "" : "s"} open — driver login required before the deadline.</span>
          <button type="button" onClick={() => (window.location.pathname = "/vote")} style={{ background: "#111827", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 900, cursor: "pointer" }}>Vote Now</button>
        </div>
      </div>
    </div>
  );
}


function normalizeStreamUrl(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes("twitch.tv") || raw.includes("youtube.com") || raw.includes("youtu.be")) return `https://${raw}`;
  return raw;
}

function getStreamDriverLabel(stream = {}) {
  return stream.driver_name || stream.driver || stream.name || stream.streamer_name || stream.title || "League Stream";
}

function getStreamDriverNumber(stream = {}) {
  return stream.driver_number || stream.number || stream.car_number || stream.carNumber || "";
}

function getStreamTwitchUrl(stream = {}) {
  return normalizeStreamUrl(stream.twitch_url || stream.twitch || stream.twitch_link || stream.stream_url || stream.url || "");
}

function getStreamYoutubeUrl(stream = {}) {
  return normalizeStreamUrl(stream.youtube_url || stream.youtube || stream.youtube_link || stream.yt_url || "");
}


function MobilePaintSchemeVotesHub({ drivers = [], tracks = [], go, session = null }) {
  const [uploads, setUploads] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInDriver, setLoggedInDriver] = useState(null);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  useEffect(() => {
    if (session?.mode !== "driver") return;
    const number = String(session.driverNumber || "").trim();
    if (!number) return;
    const rosterDriver = activeDrivers.find((driver) => String(driver.number) === number) || {};
    setLoggedInDriver({
      ...rosterDriver,
      number,
      driver_number: number,
      name: session.driverName || rosterDriver.name || `#${number}`,
      team: session.team || rosterDriver.team || "",
      manufacturer: session.manufacturer || rosterDriver.manufacturer || "",
    });
    setDriverNumber(number);
  }, [session, activeDrivers]);

  async function loadPaintData() {
    setLoading(true);
    setError("");
    const [{ data: uploadRows, error: uploadError }, { data: voteRows, error: voteError }] = await Promise.all([
      supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("paint_scheme_votes").select("*").order("created_at", { ascending: false }),
    ]);

    if (uploadError || voteError) {
      console.error("Could not load mobile paint scheme voting data:", uploadError || voteError);
      setError("Could not load paint schemes. Check car_uploads, paint_scheme_votes, and RLS policies.");
      setUploads([]);
      setVotes([]);
    } else {
      setUploads(uploadRows || []);
      setVotes(voteRows || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPaintData();
  }, []);

  const normalizeTrack = (value) => String(value || "").trim().toLowerCase();
  const uploadTrackName = (upload) => getPaintUploadRaceForStandings(upload) || upload.race_name || upload.race || upload.track_name || upload.track || "Current Week";
  const uploadImageUrl = (upload) => upload.image_url || upload.file_url || upload.secure_url || upload.url || upload.photo_url || "";
  const uploadDriverNumber = (upload, rosterDriver) => String(rosterDriver?.number || upload.driver_number || upload.car_number || upload.number || "").trim();

  const paintEntries = useMemo(() => {
    const voteCounts = new Map();
    (votes || []).forEach((vote) => {
      const key = String(vote.upload_id || vote.voted_upload_id || vote.paint_scheme_id || vote.car_upload_id || "").trim();
      if (!key) return;
      voteCounts.set(key, (voteCounts.get(key) || 0) + 1);
    });

    return (uploads || [])
      .filter((upload) => isPaintImageUploadForStandings(upload))
      .map((upload) => {
        const rosterDriver = activeDrivers.find((driver) => String(driver.id) === String(upload.driver_id) || String(driver.number) === String(upload.driver_number || upload.car_number || upload.number));
        const imageUrl = uploadImageUrl(upload);
        const driverNumberValue = uploadDriverNumber(upload, rosterDriver);
        const driverName = rosterDriver?.name || upload.driver_name || upload.uploader_name || upload.name || (driverNumberValue ? `#${driverNumberValue}` : "Unknown Driver");
        return {
          ...upload,
          imageUrl,
          trackName: uploadTrackName(upload),
          driverNumberValue,
          driverName,
          driverLabel: driverNumberValue ? `#${driverNumberValue} ${driverName}` : driverName,
          teamLabel: getTeamFullName(rosterDriver?.team || upload.team || upload.team_key || "Independent"),
          manufacturerLabel: rosterDriver?.manufacturer || upload.manufacturer || "",
          voteCount: voteCounts.get(String(upload.id)) || 0,
          uploadedAt: upload.uploaded_at || upload.created_at || "",
        };
      })
      .filter((entry) => entry.imageUrl)
      .sort((a, b) => Number(b.voteCount || 0) - Number(a.voteCount || 0) || new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
  }, [uploads, votes, activeDrivers]);

  const trackOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    const add = (name) => {
      const clean = String(name || "").trim();
      if (!clean) return;
      const key = normalizeTrack(clean);
      if (seen.has(key)) return;
      seen.add(key);
      options.push(clean);
    };
    (tracks || []).forEach((track) => add(track?.name));
    (paintEntries || []).forEach((entry) => add(entry.trackName));
    return options;
  }, [tracks, paintEntries]);

  useEffect(() => {
    if (selectedTrack || !trackOptions.length) return;
    const spotlightRace = getPaintWinnerRaceForCurrentWeek(tracks);
    const preferred = trackOptions.find((option) => normalizeTrack(option) === normalizeTrack(spotlightRace?.name));
    setSelectedTrack(preferred || trackOptions[0]);
  }, [trackOptions, selectedTrack, tracks]);

  const visibleEntries = useMemo(() => {
    return (paintEntries || []).filter((entry) => !selectedTrack || normalizeTrack(entry.trackName) === normalizeTrack(selectedTrack));
  }, [paintEntries, selectedTrack]);

  const selectedEntry = visibleEntries.find((entry) => String(entry.id) === String(selectedUploadId)) || null;

  const existingPaintVote = useMemo(() => {
    if (!loggedInDriver || !selectedTrack) return null;
    const number = String(loggedInDriver.number || loggedInDriver.driver_number || "").trim();
    return (votes || []).find((vote) => {
      const voteDriverNumber = String(vote.driver_number || vote.voter_driver_number || vote.car_number || "").trim();
      const voteRace = vote.race_name || vote.race || vote.track_name || vote.track || "";
      return voteDriverNumber === number && normalizeTrack(voteRace) === normalizeTrack(selectedTrack);
    }) || null;
  }, [loggedInDriver, selectedTrack, votes]);

  const existingVoteUploadId = existingPaintVote
    ? String(existingPaintVote.upload_id || existingPaintVote.voted_upload_id || existingPaintVote.paint_scheme_id || existingPaintVote.car_upload_id || "").trim()
    : "";
  const driverAlreadyVoted = Boolean(existingPaintVote);
  const selectedIsCurrentVote = selectedEntry && existingVoteUploadId && String(selectedEntry.id) === existingVoteUploadId;
  const isPaintVoteAdmin = Boolean(loggedInDriver?.isAdmin || session?.mode === "admin" || session?.isAdmin);

  function isOwnPaintScheme(entry) {
    if (!loggedInDriver || !entry) return false;
    const voterNumber = String(loggedInDriver.number || loggedInDriver.driver_number || "").trim();
    const paintNumber = String(entry.driverNumberValue || entry.driver_number || entry.car_number || entry.number || "").trim();
    return Boolean(voterNumber && paintNumber && voterNumber === paintNumber);
  }

  const selectedIsOwnPaintScheme = selectedEntry ? isOwnPaintScheme(selectedEntry) : false;

  const voteAuditRows = useMemo(() => {
    const entriesById = new Map((paintEntries || []).map((entry) => [String(entry.id), entry]));
    return (votes || [])
      .filter((vote) => normalizeTrack(vote.race_name || vote.race || vote.track_name || vote.track) === normalizeTrack(selectedTrack))
      .map((vote) => {
        const votedId = String(vote.upload_id || vote.voted_upload_id || vote.paint_scheme_id || vote.car_upload_id || "").trim();
        const entry = entriesById.get(votedId) || {};
        return {
          id: vote.id || `${vote.driver_number || vote.voter_driver_number || "voter"}-${votedId}`,
          voterNumber: String(vote.driver_number || vote.voter_driver_number || vote.car_number || "").trim(),
          voterName: vote.driver_name || vote.voter_driver_name || "Unknown voter",
          selectedNumber: entry.driverNumberValue || vote.selected_driver_number || "",
          selectedName: entry.driverName || vote.selected_driver_name || "Unknown scheme",
          team: entry.teamLabel || "",
          createdAt: vote.updated_at || vote.created_at || "",
          selfVote: String(vote.driver_number || vote.voter_driver_number || "").trim() && String(entry.driverNumberValue || vote.selected_driver_number || "").trim() && String(vote.driver_number || vote.voter_driver_number || "").trim() === String(entry.driverNumberValue || vote.selected_driver_number || "").trim(),
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [votes, selectedTrack, paintEntries]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const number = String(driverNumber || "").trim();
    const code = String(password || "").trim();
    if (!number || !code) {
      setError("Select your driver and enter your driver password.");
      return;
    }

    const { data, error: accessError } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    if (accessError) {
      console.error("Could not verify paint vote login:", accessError);
      setError("Could not verify access. Check driver_access_codes select policy and columns.");
      return;
    }

    const enteredCode = code.toUpperCase();
    const match = (data || []).find((row) => {
      const rowNumber = String(row.driver_number ?? row.car_number ?? "").trim();
      const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean);
      return rowNumber === number && possibleCodes.includes(enteredCode) && row.active !== false;
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";
    if (!match && !adminMatch) {
      setError("Invalid car number or driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((driver) => String(driver.number) === number) || {};
    const authRow = match || {};
    setLoggedInDriver({
      ...authRow,
      ...rosterDriver,
      number,
      driver_number: number,
      name: rosterDriver.name || authRow.driver_name || authRow.name || `#${number}`,
      team: rosterDriver.team || authRow.team || "",
      manufacturer: rosterDriver.manufacturer || authRow.manufacturer || "",
      isAdmin: adminMatch,
    });
    setMessage(adminMatch ? `Admin QC mode unlocked as #${number}.` : `Logged in as #${number}. Select a paint scheme and cast your vote.`);
  }

  async function castVote(entry) {
    setError("");
    setMessage("");
    if (session?.mode === "guest") return setError("Guest access is view-only. Log in as a driver to vote.");
    if (!loggedInDriver) return setError("Log in before casting a vote.");
    if (!entry) return setError("Select a paint scheme before voting.");
    if (isOwnPaintScheme(entry)) return setError("You cannot vote for your own paint scheme.");

    const currentVoteId = existingVoteUploadId;
    if (currentVoteId && String(currentVoteId) === String(entry.id)) {
      return setMessage(`Your current vote is already ${entry.driverLabel}.`);
    }

    setSubmitting(true);
    const driverNum = String(loggedInDriver.number || loggedInDriver.driver_number || "").trim();
    const driverName = loggedInDriver.name || loggedInDriver.driver_name || `#${driverNum}`;
    const raceName = selectedTrack || entry.trackName || "Current Week";

    const payload = {
      voter_id: `${driverNum}-${raceName}`,
      upload_id: String(entry.id || ""),
      race_name: raceName,
      voter_driver_number: driverNum,
      voter_driver_name: driverName,
      voted_driver_number: String(entry.driverNumberValue || entry.driverNumber || ""),
      voted_driver_name: entry.driverName || entry.driverLabel || "",
      voted_team: entry.team || entry.teamName || entry.displayTeam || "Independent",
    };

    const { error: voteError } = existingPaintVote?.id
      ? await supabase.from("paint_scheme_votes").update(payload).eq("id", existingPaintVote.id)
      : await supabase.from("paint_scheme_votes").insert(payload);

    setSubmitting(false);

    if (voteError) {
      console.error("Could not submit/change paint scheme vote:", voteError);
      setError(`Could not submit vote: ${voteError?.message || "Check paint_scheme_votes columns and RLS policies."}`);
      return;
    }

    setSelectedUploadId("");
    setMessage(`${existingPaintVote?.id ? "Vote changed" : "Vote submitted"} for ${entry.driverLabel}.`);
    await loadPaintData();
  }

  const selectInputStyle = {
    width: "100%",
    minHeight: 48,
    background: "#020617",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: 14,
    padding: "12px 13px",
    fontSize: 15,
    fontWeight: 900,
    boxSizing: "border-box",
  };

  return (
    <div style={{ paddingBottom: 92 }}>
      <MobileHero
        kicker="Paint Scheme Vote"
        title="Scheme of the Week"
        subtitle={session?.mode === "guest" ? "Guest mode can view schemes and results. Log in as a driver to cast or change a vote." : "Pick a track, then tap a paint scheme to cast or change your vote."}
      />

      <MobileCard>
        <div style={mobileKickerStyle}>Driver Login</div>
        {session?.mode === "guest" ? (
          <div style={{ marginTop: 10, background: "#07111f", border: "1px solid #263244", borderRadius: 16, padding: 14 }}>
            <div style={{ color: "#fbbf24", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Guest View Only</div>
            <div style={{ color: "#aab3c2", fontSize: 13, marginTop: 6, lineHeight: 1.45 }}>You can view paint schemes and results, but you must log in as a driver to cast or change a vote.</div>
            <button type="button" onClick={() => { clearBclMobileSession(); window.location.reload(); }} style={{ ...mobileActionStyle, marginTop: 12, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}>Driver Login</button>
          </div>
        ) : !loggedInDriver ? (
          <form onSubmit={handleLogin} style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <select value={driverNumber} onChange={(event) => setDriverNumber(event.target.value)} style={selectInputStyle}>
              <option value="">Select Your Driver</option>
              {activeDrivers.map((driver) => (
                <option key={driver.id || driver.number} value={String(driver.number)}>
                  #{driver.number} — {driver.name} ({getTeamFullName(driver.team)})
                </option>
              ))}
            </select>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter driver password"
              style={selectInputStyle}
            />
            <button type="submit" style={{ ...mobileActionStyle, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}>
              Log In To Vote
            </button>
          </form>
        ) : (
          <div style={{ marginTop: 10, background: "#07111f", border: "1px solid #263244", borderRadius: 16, padding: 14 }}>
            <div style={{ color: "#4ade80", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>{isPaintVoteAdmin ? "Signed In • Vote QC" : "Signed In"}</div>
            <div style={{ fontSize: 22, fontWeight: 1000, marginTop: 4 }}>#{loggedInDriver.number} {loggedInDriver.name}</div>
            <div style={{ color: "#aab3c2", fontSize: 13, marginTop: 3 }}>{getTeamFullName(loggedInDriver.team || "Independent")} • {loggedInDriver.manufacturer || ""}</div>
            <button type="button" onClick={() => { setLoggedInDriver(null); setPassword(""); setMessage("Logged out."); }} style={{ ...mobileActionStyle, marginTop: 12, background: "#111827", color: "#fff", borderColor: "#263244" }}>Log Out</button>
          </div>
        )}
        {message && <div style={{ color: "#4ade80", fontWeight: 900, marginTop: 12, lineHeight: 1.35 }}>{message}</div>}
        {error && <div style={{ color: "#f87171", fontWeight: 900, marginTop: 12, lineHeight: 1.35 }}>{error}</div>}
      </MobileCard>

      <MobileCard>
        <div style={mobileKickerStyle}>Track</div>
        <select value={selectedTrack} onChange={(event) => { setSelectedTrack(event.target.value); setSelectedUploadId(""); }} style={{ ...selectInputStyle, marginTop: 10 }}>
          {trackOptions.length === 0 && <option value="">Current Week</option>}
          {trackOptions.map((track) => <option key={track} value={track}>{track}</option>)}
        </select>
      </MobileCard>

      <MobileStatGrid items={[
        ["Track", selectedTrack || "—"],
        ["Entries", visibleEntries.length],
        ["Votes", (votes || []).filter((vote) => normalizeTrack(vote.race_name || vote.race || vote.track_name || vote.track) === normalizeTrack(selectedTrack)).length],
        ["Status", driverAlreadyVoted ? "Vote Can Be Changed" : "Open"],
      ]} />

      {isPaintVoteAdmin && (
        <MobileCard>
          <div style={mobileKickerStyle}>Vote QC</div>
          <div style={{ color: "#aab3c2", fontSize: 13, lineHeight: 1.4, marginTop: 6 }}>
            Shows who voted and which paint scheme they picked for the selected track. Self-votes are blocked going forward.
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            {voteAuditRows.length === 0 ? (
              <div style={{ color: "#94a3b8", fontSize: 13 }}>No votes found for this track yet.</div>
            ) : voteAuditRows.map((row) => (
              <div key={row.id} style={{ background: row.selfVote ? "rgba(185,28,28,0.22)" : "#07111f", border: row.selfVote ? "1px solid #ef4444" : "1px solid #263244", borderRadius: 14, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#fff", fontWeight: 1000 }}>#{row.voterNumber || "—"} {row.voterName}</div>
                    <div style={{ color: "#aab3c2", fontSize: 12, marginTop: 3 }}>voted for #{row.selectedNumber || "—"} {row.selectedName}</div>
                    {row.team && <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{row.team}</div>}
                  </div>
                  <div style={{ color: row.selfVote ? "#fca5a5" : "#facc15", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", textAlign: "right" }}>
                    {row.selfVote ? "Self Vote" : "OK"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>
      )}

      {loading && <MobileCard>Loading paint schemes...</MobileCard>}
      {!loading && !visibleEntries.length && <MobileCard>No paint schemes found for this track yet.</MobileCard>}

      <MobileSectionTitle>Choose Paint Scheme</MobileSectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {visibleEntries.map((entry) => {
          const selected = String(entry.id) === String(selectedUploadId);
          const ownScheme = isOwnPaintScheme(entry);
          return (
            <article key={entry.id} style={{ background: selected ? "#18213a" : "#111827", border: selected ? "2px solid #d4af37" : "1px solid #263244", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 26px rgba(0,0,0,0.24)", opacity: ownScheme ? 0.72 : 1 }}>
              <button
                type="button"
                onClick={() => setSelectedUploadId(entry.id)}
                style={{ width: "100%", border: "none", background: "transparent", color: "#fff", padding: 0, textAlign: "left" }}
              >
                <img src={entry.imageUrl} alt={entry.driverLabel} style={{ width: "100%", maxHeight: 250, objectFit: "cover", display: "block" }} />
                <div style={{ padding: 14 }}>
                  <div style={{ color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 1 }}>{entry.trackName}</div>
                  <div style={{ fontSize: 21, fontWeight: 1000, marginTop: 5 }}>{entry.driverLabel}</div>
                  <div style={{ color: "#aab3c2", fontSize: 12, marginTop: 4 }}>{entry.teamLabel} • {entry.manufacturerLabel || "—"}</div>
                  <div style={{ color: "#facc15", fontWeight: 1000, marginTop: 8 }}>{entry.voteCount} votes</div>
                  {ownScheme && <div style={{ color: "#f87171", fontSize: 12, fontWeight: 1000, marginTop: 6 }}>Own paint scheme — voting disabled</div>}
                </div>
              </button>
              {loggedInDriver && selected && (
                <div style={{ padding: "0 14px 14px" }}>
                  <button
                    type="button"
                    disabled={submitting || selectedIsCurrentVote || ownScheme}
                    onClick={() => castVote(entry)}
                    style={{
                      ...mobileActionStyle,
                      background: selectedIsCurrentVote || ownScheme ? "#334155" : "#d4af37",
                      color: selectedIsCurrentVote || ownScheme ? "#cbd5e1" : "#111",
                      borderColor: selectedIsCurrentVote || ownScheme ? "#475569" : "#d4af37",
                      opacity: submitting ? 0.7 : 1,
                    }}
                  >
                    {ownScheme
                      ? "Cannot Vote For Own Scheme"
                      : selectedIsCurrentVote
                        ? "Current Vote"
                        : submitting
                          ? "Submitting..."
                          : driverAlreadyVoted
                            ? `Change Vote to ${entry.driverLabel}`
                            : `Cast Vote for ${entry.driverLabel}`}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function MobileStreamsPage({ drivers = [], teams = [], manufacturerStandings = [], activeRace = null, selectedTrack = null }) {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadStreams() {
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("streams")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("driver_number", { ascending: true });

        if (!isMounted) return;
        if (error) {
          console.error("Could not load streams:", error);
          setError("Could not load stream links. Check the streams table and RLS policies.");
          setStreams([]);
        } else {
          setStreams(Array.isArray(data) ? data : []);
        }
      } catch (caughtError) {
        if (!isMounted) return;
        console.error("Stream page crashed:", caughtError);
        setError("Could not load stream links.");
        setStreams([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadStreams();
    const interval = setInterval(loadStreams, 60000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const fallbackStreams = useMemo(() => {
    return (drivers || [])
      .filter((driver) => driver && !driver.retired && !isInactivePlaceholderDriver(driver))
      .map((driver) => ({
        id: `driver-${driver.id || driver.number}`,
        driver_name: driver.name,
        driver_number: driver.number,
        team: driver.team,
        manufacturer: driver.manufacturer,
        twitch_url: driver.twitch_url || driver.twitch || "",
        youtube_url: driver.youtube_url || driver.youtube || "",
        is_live: false,
      }))
      .filter((stream) => getStreamTwitchUrl(stream) || getStreamYoutubeUrl(stream));
  }, [drivers]);

  const sourceStreams = streams.length ? streams : fallbackStreams;
  const cleanStreams = sourceStreams
    .map((stream) => {
      const twitchUrl = getStreamTwitchUrl(stream);
      const youtubeUrl = getStreamYoutubeUrl(stream);
      const driverNumber = getStreamDriverNumber(stream);
      const driverName = getStreamDriverLabel(stream);
      const rosterDriver = (drivers || []).find((driver) => String(driver.number) === String(driverNumber) || String(driver.name || "").toLowerCase() === String(driverName || "").toLowerCase());
      return {
        ...stream,
        twitchUrl,
        youtubeUrl,
        driverNumber: driverNumber || rosterDriver?.number || "",
        driverName: driverName || rosterDriver?.name || "League Stream",
        team: stream.team || rosterDriver?.team || "",
        manufacturer: stream.manufacturer || rosterDriver?.manufacturer || "",
        isLive: Boolean(stream.is_live || stream.live || stream.status === "live"),
        isWatchParty: Boolean(stream.watch_party || stream.is_watch_party || stream.featured),
      };
    })
    .filter((stream) => stream.twitchUrl || stream.youtubeUrl);

  const filteredStreams = cleanStreams.filter((stream) => {
    if (filter === "live") return stream.isLive;
    if (filter === "twitch") return !!stream.twitchUrl;
    if (filter === "youtube") return !!stream.youtubeUrl;
    return true;
  });

  const watchParty = cleanStreams.find((stream) => stream.isWatchParty) || cleanStreams.find((stream) => stream.isLive) || cleanStreams[0];

  function openStream(url) {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <MobileHero
        kicker="Broadcast Center"
        title="League Streams"
        subtitle={activeRace ? `${activeRace.name || activeRace.track || "Race Night"} • Qualifying 9:15 PM • Race 9:30 PM ET` : "Twitch, YouTube, watch party, and driver streams."}
      />

      {watchParty && (
        <section style={mobileStreamHeroCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div style={mobileKickerStyle}>{watchParty.isLive ? "Live Now" : "Featured Stream"}</div>
            {watchParty.isLive && <span style={mobileLivePillStyle}>● LIVE</span>}
          </div>
          <h2 style={{ margin: "8px 0 6px", fontSize: 26, lineHeight: 1.02 }}>#{watchParty.driverNumber || "BCL"} {watchParty.driverName}</h2>
          <p style={{ margin: "0 0 14px", color: "#aab3c2", lineHeight: 1.4 }}>{watchParty.team ? getTeamFullName(watchParty.team) : "Budweiser Cup League"}{watchParty.manufacturer ? ` • ${watchParty.manufacturer}` : ""}</p>
          <div style={mobileStreamButtonGridStyle}>
            {watchParty.twitchUrl && <button type="button" onClick={() => openStream(watchParty.twitchUrl)} style={mobileTwitchButtonStyle}>Watch Twitch</button>}
            {watchParty.youtubeUrl && <button type="button" onClick={() => openStream(watchParty.youtubeUrl)} style={mobileYoutubeButtonStyle}>Watch YouTube</button>}
          </div>
        </section>
      )}

      <div style={mobileStreamFilterBarStyle}>
        {[
          ["all", "All"],
          ["live", "Live"],
          ["twitch", "Twitch"],
          ["youtube", "YouTube"],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => setFilter(key)}
            style={{ ...mobileStreamFilterChipStyle, background: filter === key ? "#d4af37" : "#121a26", color: filter === key ? "#111" : "#fff", borderColor: filter === key ? "#d4af37" : "#263244" }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <MobileCard><p style={{ margin: 0, color: "#aab3c2" }}>Loading stream cards...</p></MobileCard>}
      {!loading && error && <MobileCard><p style={{ margin: 0, color: "#fca5a5", lineHeight: 1.4 }}>{error}</p></MobileCard>}
      {!loading && !filteredStreams.length && (
        <MobileCard>
          <div style={mobileKickerStyle}>No Streams Found</div>
          <p style={{ margin: "8px 0 0", color: "#aab3c2", lineHeight: 1.45 }}>No stream links are available for this filter yet. Add Twitch or YouTube links from the full stream manager.</p>
        </MobileCard>
      )}

      <div style={mobileStreamListStyle}>
        {filteredStreams.map((stream, index) => (
          <article key={stream.id || `${stream.driverNumber}-${stream.driverName}-${index}`} style={mobileStreamCardStyle}>
            <div style={mobileStreamNumberStyle}>{stream.driverNumber ? `#${stream.driverNumber}` : "BCL"}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.08 }}>{stream.driverName}</h3>
                {stream.isLive && <span style={mobileLivePillSmallStyle}>LIVE</span>}
              </div>
              <p style={{ margin: "5px 0 0", color: "#9ca8ba", fontSize: 12, lineHeight: 1.35 }}>{stream.team ? getTeamFullName(stream.team) : "League Stream"}{stream.manufacturer ? ` • ${stream.manufacturer}` : ""}</p>
              <div style={mobileStreamLinksStyle}>
                {stream.twitchUrl && <button type="button" onClick={() => openStream(stream.twitchUrl)} style={mobileMiniTwitchButtonStyle}>Twitch</button>}
                {stream.youtubeUrl && <button type="button" onClick={() => openStream(stream.youtubeUrl)} style={mobileMiniYoutubeButtonStyle}>YouTube</button>}
              </div>
            </div>
          </article>
        ))}
      </div>

      <MobileCard>
        <div style={mobileKickerStyle}>Stream Manager</div>
        <p style={{ margin: "8px 0 12px", color: "#aab3c2", lineHeight: 1.45 }}>Need to add or edit links? Open the full stream manager in desktop mode.</p>
        <MobileAction label="Open Full Stream Manager" onClick={() => {
          if (typeof document !== "undefined") document.cookie = "bcl-force-desktop=1; path=/; max-age=2592000";
          window.location.href = "/streams";
        }} />
      </MobileCard>
    </>
  );
}


function getBclRoleFlagsForDriver(driver = {}, enteredAdminCode = false) {
  const possibleNames = [
    driver.name,
    driver.driver_name,
    driver.driverName,
    driver.display_name,
    driver.displayName,
    driver.username,
    driver.handle,
  ].map(normalizeBclName).filter(Boolean);

  const isNamedAdmin = possibleNames.some((name) => BCL_ADMIN_NAMES.has(name));
  const isNamedOwner = possibleNames.some((name) => BCL_OWNER_NAMES.has(name));

  const team = driver.team || "";
  const manufacturer = driver.manufacturer || "";

  return {
    role: enteredAdminCode || isNamedAdmin ? "admin" : (isNamedOwner ? "owner" : "driver"),
    isAdmin: enteredAdminCode || isNamedAdmin,
    isOwner: isNamedOwner,
    isDriver: true,
    team,
    manufacturer,
  };
}

function readBclMobileSession() {
  try {
    const raw = localStorage.getItem(BCL_MOBILE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.mode) return null;
    return parsed;
  } catch {
    return null;
  }
}


function useMobileViewport(maxWidth = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= maxWidth;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const check = () => setIsMobile(window.innerWidth <= maxWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, [maxWidth]);

  return isMobile;
}


const BCL_ADMIN_NAMES = new Set(["bowhunter6758", "bowhunter", "h0lden", "h0ld3n", "holden", "holden2dx4ev3r"]);
const BCL_OWNER_NAMES = new Set(["highlander", "highlander713", "bowhunter", "bowhunter6758", "rookie", "rookievet99", "jpc_racing", "cajun", "cajunthrottle28", "orly", "orly_revo23", "kevdinho", "kevdinho7"]);

function normalizeBclName(value) {
  return String(value || "").trim().toLowerCase();
}

const BCL_MOBILE_SESSION_KEY = "bcl-mobile-session-v1";

function saveBclMobileSession(session) {
  try {
    localStorage.setItem(BCL_MOBILE_SESSION_KEY, JSON.stringify({ ...session, savedAt: new Date().toISOString() }));
  } catch {
    // localStorage can be unavailable in private browsing; session still works in memory.
  }
}

function clearBclMobileSession() {
  try {
    localStorage.removeItem(BCL_MOBILE_SESSION_KEY);
  } catch {
    // ignore
  }
}

function MobileAccessGate({ drivers = [], onSession }) {
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  async function loginDriver(event) {
    event.preventDefault();
    setError("");
    const number = String(driverNumber || "").trim();
    const code = String(password || "").trim();
    if (!number || !code) {
      setError("Select your driver and enter your password.");
      return;
    }

    setLoading(true);
    const { data, error: accessError } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    if (accessError) {
      console.error("Could not verify mobile driver login:", accessError);
      setLoading(false);
      setError("Could not verify access. Check driver_access_codes select policy and columns.");
      return;
    }

    const enteredCode = code.toUpperCase();
    const match = (data || []).find((row) => {
      const rowNumber = String(row.driver_number ?? row.car_number ?? "").trim();
      const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean);
      return rowNumber === number && possibleCodes.includes(enteredCode) && row.active !== false;
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";
    if (!match && !adminMatch) {
      setLoading(false);
      setError("Invalid car number or driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((driver) => String(driver.number) === number) || {};
    const authRow = match || {};
    const driverForRoles = {
      ...authRow,
      ...rosterDriver,
      name: rosterDriver.name || authRow.driver_name || authRow.name || `#${number}`,
      team: rosterDriver.team || authRow.team || "",
      manufacturer: rosterDriver.manufacturer || authRow.manufacturer || "",
    };
    const roleFlags = getBclRoleFlagsForDriver(driverForRoles, Boolean(adminMatch));
    const session = {
      mode: "driver",
      role: roleFlags.role,
      driverId: rosterDriver.id || authRow.driver_id || authRow.id || null,
      driverNumber: number,
      driverName: driverForRoles.name,
      team: driverForRoles.team,
      manufacturer: driverForRoles.manufacturer,
      isAdmin: roleFlags.isAdmin,
      isOwner: roleFlags.isOwner,
      isDriver: true,
    };

    saveBclMobileSession(session);
    setLoading(false);
    onSession(session);
  }

  function continueAsGuest() {
    const session = { mode: "guest", displayName: "Guest" };
    saveBclMobileSession(session);
    onSession(session);
  }

  const selectInputStyle = {
    width: "100%",
    minHeight: 48,
    background: "#020617",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: 14,
    padding: "12px 13px",
    fontSize: 15,
    fontWeight: 900,
    boxSizing: "border-box",
  };

  return (
    <div style={mobileAppStyle}>
      <main style={{ ...mobileContentStyle, paddingTop: 28 }}>
        <MobileHero
          kicker="Budweiser Cup League"
          title="Choose Access"
          subtitle="Drivers can stay signed in on this device. Guests can view the app but cannot submit votes, interviews, appeals, messages, or other changes."
        />

        <MobileCard>
          <div style={mobileKickerStyle}>Driver Login</div>
          <form onSubmit={loginDriver} style={{ display: "grid", gap: 12, marginTop: 10 }}>
            <select value={driverNumber} onChange={(event) => setDriverNumber(event.target.value)} style={selectInputStyle}>
              <option value="">Select Your Driver</option>
              {activeDrivers.map((driver) => (
                <option key={driver.id || driver.number} value={String(driver.number)}>
                  #{driver.number} — {driver.name} ({getTeamFullName(driver.team)})
                </option>
              ))}
            </select>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter driver password"
              style={selectInputStyle}
            />
            {error && <div style={{ color: "#f87171", fontWeight: 900, lineHeight: 1.35 }}>{error}</div>}
            <button disabled={loading} type="submit" style={{ ...mobileActionStyle, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}>
              {loading ? "Checking..." : "Log In & Stay Signed In"}
            </button>
          </form>
        </MobileCard>

        <MobileCard>
          <div style={mobileKickerStyle}>Guest Access</div>
          <h2 style={{ margin: "5px 0 8px" }}>View Only</h2>
          <p style={{ color: "#aab3c2", lineHeight: 1.5, marginTop: 0 }}>
            Guests can view standings, news, streams, driver profiles, teams, and race information. Voting, interviews, appeals, messages, and owner tools stay locked.
          </p>
          <button type="button" onClick={continueAsGuest} style={{ ...mobileActionStyle, background: "#111827", color: "#ffffff", borderColor: "#334155" }}>
            Continue as Guest
          </button>
        </MobileCard>
      </main>
    </div>
  );
}

function MobileGuestLockedCard({ title = "Driver Login Required", go }) {
  return (
    <MobileCard>
      <div style={mobileKickerStyle}>Guest Mode</div>
      <h2 style={{ margin: "5px 0 8px" }}>{title}</h2>
      <p style={{ color: "#aab3c2", lineHeight: 1.5 }}>
        Guest access is view-only. Log in as a driver to submit votes, interviews, appeals, messages, or other changes.
      </p>
      <button
        type="button"
        onClick={() => {
          clearBclMobileSession();
          window.location.reload();
        }}
        style={{ ...mobileActionStyle, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}
      >
        Driver Login
      </button>
    </MobileCard>
  );
}


function MobileInterviewsHub({ session, go }) {
  const isGuest = session?.mode === "guest";
  const driverNumber = session?.driverNumber || session?.number || "";
  const driverName = session?.driverName || session?.displayName || "Driver";

  return (
    <>
      <MobileCard>
        <div style={mobileKickerStyle}>{isGuest ? "Guest View" : "Driver Interview Center"}</div>
        <h2 style={{ margin: "5px 0 8px" }}>
          {isGuest ? "Public Interviews" : `Logged in as #${driverNumber} ${driverName}`}
        </h2>
        <p style={{ color: "#aab3c2", lineHeight: 1.5, marginTop: 0 }}>
          {isGuest
            ? "Guests can read public interviews, but cannot submit pre-race or post-race interviews."
            : "Open your driver profile to submit pre-race and post-race interviews using the same form and logic as desktop."}
        </p>

        {isGuest ? (
          <button
            type="button"
            onClick={() => {
              clearBclMobileSession();
              window.location.reload();
            }}
            style={{ ...mobileActionStyle, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}
          >
            Driver Login to Submit Interview
          </button>
        ) : (
          <button
            type="button"
            onClick={() => go(`/driver/${driverNumber}`)}
            style={{ ...mobileActionStyle, background: "#d4af37", color: "#111", borderColor: "#d4af37" }}
          >
            Open My Interview Form
          </button>
        )}
      </MobileCard>

      <MobileCard>
        <div style={mobileKickerStyle}>Interview Archive</div>
        <p style={{ color: "#aab3c2", lineHeight: 1.45, margin: "5px 0 12px" }}>
          Latest public interviews are shown below.
        </p>
      </MobileCard>

      <MobileDataFrame>
        <PublicInterviewsPage />
      </MobileDataFrame>
    </>
  );
}

function MobileLeagueApp({
  path,
  rawPath,
  drivers = [],
  teams = [],
  manufacturerStandings = [],
  seasonName = "",
  tracks = [],
  raceHistory = [],
  seasons = [],
  activeSeason = null,
  activeSeasonId = "",
  paymentCompliance = null,
  onApplyTeamTransaction = () => {},
}) {
  const go = (to) => { window.location.href = to; };
  const sortedDrivers = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0));
  const sortedTeams = [...teams].sort((a, b) => (b.points || 0) - (a.points || 0));
  const sortedManufacturers = [...manufacturerStandings].sort((a, b) => (b.points || 0) - (a.points || 0));
  const upcomingRace = getUpcomingRaceByDate(tracks || []);
  const leader = sortedDrivers[0];
  const [mobileSession, setMobileSession] = useState(() => readBclMobileSession());
  const isGuestSession = mobileSession?.mode === "guest";

  function handleMobileLogout() {
    clearBclMobileSession();
    setMobileSession(null);
  }

  if (!mobileSession) {
    return <MobileAccessGate drivers={drivers} onSession={setMobileSession} />;
  }

  function getTrackOverview(race) {
    if (!race) return null;
    return trackOverviewData[race.name] || trackOverviewData[race.track] || null;
  }

  function frame(title, active, children) {
    return (
      <MobileLayout title={title} go={go} active={active} session={mobileSession} onLogout={handleMobileLogout}>
        {children}
        <LeagueStatusWidget tracks={tracks} seasonName={seasonName} mobile />
      </MobileLayout>
    );
  }

  function dataFrame(title, active, children) {
    return frame(title, active, <MobileDataFrame>{children}</MobileDataFrame>);
  }

  if (path === "/files") return dataFrame("Files", "more", <FilesPage />);
  if (path === "/welcome") return dataFrame("Welcome", "home", <WelcomePage />);
  if (path === "/submit-appeal") return dataFrame("Submit Appeal", "more", isGuestSession ? <MobileGuestLockedCard title="Appeals Require Driver Login" go={go} /> : <SubmitAppealPage />);
  if (path === "/submit-story") return dataFrame("Submit Story", "more", isGuestSession ? <MobileGuestLockedCard title="Story Submissions Require Driver Login" go={go} /> : <SubmitStoryPage />);
  if (path === "/appeals") return dataFrame("Appeals", "more", <AppealsPage />);
  if (path === "/news") return frame("News", "news", <MobileNewsFeed go={go} desktopArchive={<NewsPage />} />);
  if (path === "/paint-scheme-vote") return frame("Paint Scheme Votes", "votes", <MobilePaintSchemeVotesHub drivers={drivers} tracks={tracks} go={go} session={mobileSession} />);
  if (path === "/vote" || path === "/league-vote" || path === "/voting") return dataFrame("League Vote", "more", isGuestSession ? <MobileGuestLockedCard title="League Voting Requires Driver Login" go={go} /> : <LeagueVotingPage drivers={drivers} />);
  if (path === "/notifications") return dataFrame("Notifications", "more", <NotificationsPage />);
  if (path === "/interviews") return frame("Interviews", "interviews", <MobileInterviewsHub session={mobileSession} go={go} />);
  if (path === "/contracts") return dataFrame("Contracts", "more", <ContractsPage drivers={drivers} />);
  if (path === "/driver-market" || path === "/transfer-portal" || path === "/silly-season") return dataFrame("Driver Market", "more", <DriverMarketPage drivers={drivers || []} raceHistory={raceHistory || []} startParkRequests={[]} paintSchemePayouts={[]} />);
  if (path === "/development-requests" || path === "/developmental-requests" || path === "/dev-requests") return dataFrame("Development Requests", "more", (
    <DevelopmentRequestsPage
      leagueState={{ drivers: drivers || [], teams: teams || [] }}
      currentUser={mobileSession}
      isAdmin={Boolean(mobileSession?.isAdmin || mobileSession?.role === "admin" || mobileSession?.mode === "admin")}
      supabase={supabase}
      go={go}
    />
  ));
  if (path === "/memorial-day") return dataFrame("Memorial", "more", <MemorialDayPage drivers={drivers} />);
  if (path === "/tracks" || path === "/schedule" || path === "/season-schedule") {
    const sortedTracks = getSortedTracksByDate(tracks || []);
    const upcomingRace = getUpcomingRaceByDate(tracks || []);
    return frame("Season Tracks", "standings", (
      <>
        <MobileHero
          kicker="Season Schedule"
          title="Track List"
          subtitle="Tap a track card to view details and race information."
        />

        <MobileSectionTitle>Upcoming</MobileSectionTitle>
        {upcomingRace ? (
          <MobileCard>
            <div style={mobileKickerStyle}>Next Race</div>
            <h2 style={{ margin: "5px 0 6px", fontSize: 24 }}>{upcomingRace.name}</h2>
            <div style={{ color: "#aab3c2", fontSize: 13 }}>
              {upcomingRace.date || "Date TBD"} {upcomingRace.time ? `• ${upcomingRace.time}` : ""}
            </div>
          </MobileCard>
        ) : (
          <MobileCard>No upcoming race found.</MobileCard>
        )}

        <MobileSectionTitle>Full Season</MobileSectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingBottom: 90 }}>
          {sortedTracks.map((track, index) => {
            const overview = trackOverviewData[track.name] || trackOverviewData[track.track] || {};
            const isNext = upcomingRace && String(upcomingRace.name) === String(track.name);
            return (
              <button
                type="button"
                key={`${track.name}-${track.date || index}`}
                onClick={() => go(`/tracks?selected=${encodeURIComponent(track.name || "")}`)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: isNext ? "linear-gradient(135deg, rgba(212,175,55,0.24), #111827)" : "#111827",
                  color: "white",
                  border: isNext ? "1px solid #d4af37" : "1px solid #263244",
                  borderRadius: 16,
                  padding: 14,
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>
                      Race {index + 1}{isNext ? " • Upcoming" : ""}
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 1000, marginTop: 3 }}>{track.name}</div>
                    <div style={{ color: "#aab3c2", fontSize: 13, marginTop: 4 }}>
                      {track.date || "Date TBD"} {track.time ? `• ${track.time}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", color: "#cbd5e1", fontSize: 12 }}>
                    <div>{overview.length || overview.trackLength || ""}</div>
                    <div>{overview.banking || ""}</div>
                  </div>
                </div>

                {(overview.type || overview.pitSpeed || overview.restartZone) && (
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {overview.type && <span style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 999, padding: "5px 8px", fontSize: 11 }}>{overview.type}</span>}
                    {overview.pitSpeed && <span style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 999, padding: "5px 8px", fontSize: 11 }}>Pit {overview.pitSpeed}</span>}
                    {overview.restartZone && <span style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 999, padding: "5px 8px", fontSize: 11 }}>Restart {overview.restartZone}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </>
    ));
  }
  if (path === "/tournament" || path === "/in-season-tournament" || path === "/in-season-bracket" || path === "/bracket") {
    return dataFrame("Tournament", "standings", <InSeasonTournamentPage drivers={drivers} raceHistory={raceHistory} />);
  }
  if (path === "/chat") return dataFrame("League Chat", "more", isGuestSession ? <MobileGuestLockedCard title="League Chat Requires Driver Login" go={go} /> : <LeagueChatPage drivers={drivers} />);
  if (path === "/message-center") return frame("Messages", "more", <LeagueMessageCenter drivers={drivers} session={mobileSession} mobile go={go} />);
  if (path === "/discord") return dataFrame("Discord", "more", <DiscordPage />);
  if (path === "/stories") return dataFrame("Story Admin", "more", <StoriesAdminPage />);
  if (path === "/more" || path === "/menu") {
    return frame("More", "more", (
      <MobileFeatureHub
        go={go}
        drivers={drivers}
        teams={teams}
        manufacturerStandings={manufacturerStandings}
      />
    ));
  }

  if (path === "/streams" || path === "/stream") {
    return frame("Streams", "more", (
      <MobileStreamsPage
        drivers={drivers}
        teams={teams}
        manufacturerStandings={manufacturerStandings}
        activeRace={upcomingRace}
        selectedTrack={getTrackOverview(upcomingRace)}
      />
    ));
  }

  if (["/owner", "/owners"].includes(path)) {
    return dataFrame("Owner Login", "more", (
      <>
        <MobileHero
          kicker="Owner Portal"
          title="Owner Login"
          subtitle="Full Team HQ access with the same password/login and controls as desktop."
        />
        <OwnersPage
          drivers={drivers}
          teams={teams}
          teamBudgets={teamBudgets}
          raceHistory={raceHistory}
          seasonName={seasonName}
          tracks={tracks}
          paymentCompliance={paymentCompliance}
          onApplyTeamTransaction={onApplyTeamTransaction}
        />
      </>
    ));
  }

  if (["/team-hq", "/hq", "/teamhq"].includes(path)) {
    return frame("Team HQ", "more", <OwnerHQPage drivers={drivers} teams={teams} seasonName={seasonName} tracks={tracks} go={go} supabase={supabase} />);
  }

  if (path.startsWith("/team/")) {
    const abbr = decodeURIComponent(rawPath.replace(/^\/team\//i, "").split("/")[0]);
    const normalizedTeam = String(abbr || "").toLowerCase();
    const selectedTeamDrivers = drivers.filter((d) => String(d.team || "").toLowerCase() === normalizedTeam);
    const selectedTeamStanding = teams.find((t) => String(t.team || "").toLowerCase() === normalizedTeam) || null;
    return dataFrame("Team", "standings", (
      <TeamDetailPage
        key={`mobile-team-${abbr}-${activeSeasonId}-${raceHistory.length}-${selectedTeamStanding?.points || 0}`}
        drivers={drivers}
        teamDrivers={selectedTeamDrivers}
        teams={teams}
        teamStandings={teams}
        standings={teams}
        selectedStanding={selectedTeamStanding}
        team={selectedTeamStanding}
        raceHistory={raceHistory}
        seasonName={seasonName}
        initialTeam={abbr}
        selectedTeam={abbr}
      />
    ));
  }

  if (path.startsWith("/manufacturer/")) {
    const mfrName = decodeURIComponent(rawPath.replace(/^\/manufacturer\//i, "").split("/")[0]);
    const normalizedManufacturer = String(mfrName || "").toLowerCase();
    const selectedManufacturerDrivers = drivers.filter((d) => String(d.manufacturer || "").toLowerCase() === normalizedManufacturer);
    const selectedManufacturerStanding = manufacturerStandings.find((m) => String(m.manufacturer || "").toLowerCase() === normalizedManufacturer) || null;
    return dataFrame("Manufacturer", "standings", (
      <ManufacturerDetailPage
        key={`mobile-manufacturer-${mfrName}-${activeSeasonId}-${raceHistory.length}-${selectedManufacturerStanding?.points || 0}`}
        drivers={drivers}
        manufacturerDrivers={selectedManufacturerDrivers}
        manufacturers={manufacturerStandings}
        manufacturerStandings={manufacturerStandings}
        standings={manufacturerStandings}
        selectedStanding={selectedManufacturerStanding}
        manufacturer={selectedManufacturerStanding}
        raceHistory={raceHistory}
        seasonName={seasonName}
        initialManufacturer={mfrName}
        selectedManufacturer={mfrName}
      />
    ));
  }

  if (path.startsWith("/driver/")) {
    const driverNumber = decodeURIComponent(rawPath.replace(/^\/driver\//i, "").split("/")[0]);
    const selectedDriver = drivers.find((driver) => String(driver.number) === String(driverNumber));

    return dataFrame("Driver Profile", "standings", (
      <MobileDriverProfilePolished
        driver={selectedDriver}
        driverNumber={driverNumber}
        drivers={drivers}
        raceHistory={raceHistory}
        tracks={tracks}
        seasons={seasons}
        activeSeason={activeSeason}
        go={go}
      />
    ));
  }

  if (path === "/driver-feedback") {
    return frame("Driver Feedback", "more", (
      <MobileCard>
        <h2 style={{ marginTop: 0 }}>Driver Feedback Moved</h2>
        <p style={{ color: "#aab3c2", lineHeight: 1.5 }}>
          Driver feedback now lives inside each protected driver profile so only the driver can submit morale ratings.
        </p>
        <MobileAction label="Back to Standings" onClick={() => go("/standings")} />
      </MobileCard>
    ));
  }

  if (path === "/" || path === "/standings") {
    return (
      <MobileLayout title="Budweiser Cup" go={go} active="home" session={mobileSession} onLogout={handleMobileLogout}>
        <MobileHero
          kicker={seasonName || "Current Season"}
          title="Race Hub"
          subtitle={upcomingRace ? `${upcomingRace.name || upcomingRace.track || "Next Race"} • Saturday • 9:30 PM ET` : "Mobile league dashboard"}
        />
        <LeagueTicker page="standings" />
        <MobileWeekendRecap raceHistory={raceHistory} tracks={tracks} drivers={drivers} go={go} />
        <button
          type="button"
          onClick={() => go("/tracks")}
          style={{
            width: "100%",
            textAlign: "left",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: "pointer",
          }}
        >
          <MobileUpcomingRaceCard race={upcomingRace} selectedTrack={getTrackOverview(upcomingRace)} go={go} />
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 1000, margin: "-4px 0 12px 4px" }}>
            Tap upcoming track to view full season track list →
          </div>
        </button>

        <MobileCard>
          <div style={mobileKickerStyle}>Silly Season</div>
          <h2 style={{ margin: "5px 0 6px", fontSize: 24 }}>🔥 Driver Market</h2>
          <p style={{ color: "#aab3c2", lineHeight: 1.45, margin: "0 0 12px" }}>
            Scout drivers, track re-sign interest, and follow the market before signing day.
          </p>
          <button
            type="button"
            onClick={() => go("/driver-market")}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 14,
              border: "1px solid #d4af37",
              background: "#d4af37",
              color: "#111",
              fontWeight: 1000,
              cursor: "pointer",
            }}
          >
            Enter Driver Market
          </button>
        </MobileCard>
        <MobileTimelineSpotlightPanel tracks={tracks} drivers={drivers} go={go} seasonName={seasonName} />
        <MobileLatestNewsPreview go={go} />
        <MobileSectionTitle>Driver Standings</MobileSectionTitle>
        {leader && <MobileLeaderCard leader={leader} go={go} />}
        <MobileStandingsList drivers={sortedDrivers} go={go} />

        <MobileSectionTitle>Team Standings</MobileSectionTitle>
        {sortedTeams.map((team, index) => <MobileTeamRow key={`${team.team}-${index}`} team={team} index={index} />)}

        <MobileSectionTitle>Manufacturer Standings</MobileSectionTitle>
        {sortedManufacturers.map((manufacturer, index) => <MobileManufacturerRow key={`${manufacturer.manufacturer}-${index}`} manufacturer={manufacturer} index={index} />)}

        {raceHistory?.length > 0 && <MobileSectionTitle>Recent Race Results</MobileSectionTitle>}
        {(raceHistory || []).slice(-3).reverse().map((race) => <MobileRaceResultCard key={race.raceName} race={race} />)}
        <LeagueStatusWidget tracks={tracks} seasonName={seasonName} mobile />
      </MobileLayout>
    );
  }

  return dataFrame("Budweiser Cup", "standings", <StandingsPage drivers={drivers} teams={teams} manufacturerStandings={manufacturerStandings} seasonName={seasonName} tracks={tracks} raceHistory={raceHistory} />);
}


function MobileTimelineSpotlightPanel({ tracks = [], drivers = [], go, seasonName = "" }) {
  const upcomingRace = getPaintWinnerRaceForCurrentWeek(tracks || []);
  const bracketDrivers = useMemo(() => {
    return [...(drivers || [])]
      .filter((driver) => driver && !isRemovedLeagueDriver(driver))
      .filter((driver) => String(driver?.name || "").trim().toLowerCase() !== "orly_revo23")
      .filter((driver) => String(driver?.number || "").trim() !== "23")
      .sort((a, b) => (Number(b.points || 0) - Number(a.points || 0)) || (Number(b.wins || 0) - Number(a.wins || 0)))
      .slice(0, 20);
  }, [drivers]);

  const topSeed = bracketDrivers[0];
  const lastSeed = bracketDrivers[bracketDrivers.length - 1];

  return (
    <>
      <MobileSectionTitle>Race Week Spotlight</MobileSectionTitle>
      <MobileCard>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={mobileKickerStyle}>Paint Winner Window</div>
            <h2 style={{ margin: "4px 0 6px", fontSize: 20 }}>🎨 {upcomingRace?.name || "Upcoming Race"}</h2>
            <p style={{ margin: 0, color: "#aab3c2", lineHeight: 1.45, fontSize: 13 }}>
              Shows the upcoming race paint winner after Wednesday voting closes. If voting ties, all tied winners are shown.
            </p>
          </div>
          <button type="button" onClick={() => go("/paint-scheme-vote")} style={{ ...mobileActionStyle, width: "auto", padding: "9px 11px", fontSize: 12 }}>
            Vote
          </button>
        </div>
      </MobileCard>
      <div style={{ marginTop: 10 }}>
        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
      </div>

      <MobileSectionTitle>In-Season Tournament</MobileSectionTitle>
      <MobileCard>
        <div style={mobileKickerStyle}>{seasonName || "Season 1"} • Top 20</div>
        <h2 style={{ margin: "4px 0 6px", fontSize: 20 }}>🏆 Bracket Hub</h2>
        <p style={{ margin: 0, color: "#aab3c2", lineHeight: 1.45, fontSize: 13 }}>
          Mobile now links directly to the in-season bracket. Orly is excluded from the bracket field.
        </p>
        {topSeed && lastSeed && (
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", fontSize: 12 }}>
            <div style={{ background: "#0f1319", border: "1px solid #263244", borderRadius: 12, padding: 10 }}>
              <strong>#{topSeed.number}</strong><br />{topSeed.name}
            </div>
            <strong style={{ color: "#d4af37" }}>vs</strong>
            <div style={{ background: "#0f1319", border: "1px solid #263244", borderRadius: 12, padding: 10 }}>
              <strong>#{lastSeed.number}</strong><br />{lastSeed.name}
            </div>
          </div>
        )}
        <MobileAction label="Open Bracket" onClick={() => go("/bracket")} />
      </MobileCard>
    </>
  );
}

function MobileLeaderCard({ leader, go }) {
  if (!leader) return null;
  return (
    <button
      type="button"
      onClick={() => go(`/driver/${leader.number}`)}
      style={{ ...mobileCardStyle, width: "100%", textAlign: "left", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}
    >
      <div style={{ width: 60, height: 60, borderRadius: 18, background: "linear-gradient(135deg, #d4af37, #111827)", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 1000, border: "1px solid rgba(255,255,255,0.16)" }}>#{leader.number}</div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={mobileKickerStyle}>Points Leader</div>
        <strong style={{ display: "block", fontSize: 20, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leader.name}</strong>
        <span style={{ color: "#aab3c2", fontSize: 12 }}>{leader.team || "Independent"} • {leader.manufacturer || ""}</span>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 26, fontWeight: 1000 }}>{leader.points || 0}</div>
        <div style={{ color: "#aab3c2", fontSize: 10, fontWeight: 900 }}>PTS</div>
      </div>
    </button>
  );
}

function MobileUpcomingRaceCard({ race, selectedTrack, go }) {
  if (!race) return null;
  const trackName = race.name || race.track || "Next Race";
  const dateLabel = race.date ? new Date(`${String(race.date).slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Date TBA";
  const details = [
    selectedTrack?.length ? `${selectedTrack.length} mi` : null,
    selectedTrack?.banking ? selectedTrack.banking : null,
    selectedTrack?.pitSpeed ? `Pit ${selectedTrack.pitSpeed}` : null,
  ].filter(Boolean);

  return (
    <MobileCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={mobileKickerStyle}>Upcoming Race</div>
          <h2 style={{ margin: "4px 0 6px", fontSize: 22, lineHeight: 1.08 }}>{trackName}</h2>
          <p style={{ margin: 0, color: "#aab3c2", fontSize: 13 }}>{dateLabel} • Qualifying 9:15 PM ET • Race 9:30 PM ET</p>
        </div>
        <div style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.35)", color: "#facc15", borderRadius: 14, padding: "8px 10px", fontSize: 12, fontWeight: 1000 }}>🏁</div>
      </div>
      {selectedTrack?.imageUrl && (
        <div style={{ marginTop: 14, borderRadius: 18, overflow: "hidden", border: "1px solid rgba(255,255,255,0.12)", background: "#05070a" }}>
          <img
            src={selectedTrack.imageUrl}
            alt={trackName}
            style={{ width: "100%", height: 190, objectFit: "cover", display: "block" }}
            loading="lazy"
          />
        </div>
      )}
      {details.length > 0 && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>{details.map((item) => <span key={item} style={{ background: "#0f172a", border: "1px solid #263244", borderRadius: 999, padding: "6px 9px", color: "#d1d5db", fontSize: 11, fontWeight: 800 }}>{item}</span>)}</div>}
    </MobileCard>
  );
}

function MobileLatestNewsPreview({ go }) {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function normalizeAndLoad(tableName) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) return [];
      return (data || []).map((item) => ({
        id: `${tableName}-${item.id || item.title}`,
        title: item.title || item.headline || item.subject || "League News",
        category: item.category || item.type || "News",
        createdAt: item.created_at || item.published_at || item.submitted_at || item.updated_at || "",
        imageUrl: item.image_url || item.featured_image_url || item.media_url || item.photo_url || "",
      })).filter((item) => item.title);
    }

    async function loadPreview() {
      const tables = ["news", "story_submissions", "news_articles", "league_news", "published_news", "news_posts"];
      const results = await Promise.all(tables.map(normalizeAndLoad));
      if (!isMounted) return;
      const byTitle = new Map();
      results.flat().forEach((item) => {
        const key = String(item.title || "").trim().toLowerCase();
        if (key && !byTitle.has(key)) byTitle.set(key, item);
      });
      setArticles(Array.from(byTitle.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 3));
    }

    loadPreview();
    return () => { isMounted = false; };
  }, []);

  if (!articles.length) return null;

  return (
    <MobileCard>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={mobileKickerStyle}>Latest News</div>
          <h2 style={{ margin: "2px 0 0", fontSize: 20 }}>Top Stories</h2>
        </div>
        <button type="button" onClick={() => go("/news")} style={{ background: "#111827", color: "#facc15", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 900 }}>View All</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {articles.map((article) => (
          <button key={article.id} type="button" onClick={() => go("/news")} style={{ background: "#0b111a", color: "white", border: "1px solid #243044", borderRadius: 16, padding: 10, display: "grid", gridTemplateColumns: article.imageUrl ? "74px 1fr" : "1fr", gap: 10, textAlign: "left", cursor: "pointer" }}>
            {article.imageUrl && <img src={article.imageUrl} alt="" style={{ width: 74, height: 58, objectFit: "cover", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }} />}
            <div style={{ minWidth: 0 }}>
              <div style={{ color: "#d4af37", fontSize: 10, fontWeight: 1000, textTransform: "uppercase", marginBottom: 4 }}>{article.category}</div>
              <strong style={{ display: "block", fontSize: 14, lineHeight: 1.2 }}>{article.title}</strong>
            </div>
          </button>
        ))}
      </div>
    </MobileCard>
  );
}

function MobileLiveStreamsBanner({ go }) {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadStreams() {
      const { data, error } = await supabase
        .from("streams")
        .select("*")
        .order("is_live", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(4);
      if (!isMounted) return;
      if (error) {
        setStreams([]);
        return;
      }
      setStreams((data || []).filter((stream) => stream.active !== false));
    }
    loadStreams();
    return () => { isMounted = false; };
  }, []);

  if (!streams.length) return null;
  const liveCount = streams.filter((stream) => stream.is_live || stream.live).length;

  return (
    <MobileCard>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={mobileKickerStyle}>Streams</div>
          <h2 style={{ margin: "2px 0 4px", fontSize: 20 }}>{liveCount ? `${liveCount} Live Now` : "Driver Streams"}</h2>
          <p style={{ margin: 0, color: "#aab3c2", fontSize: 12 }}>{streams.slice(0, 3).map((stream) => stream.driver_name || stream.channel_name).filter(Boolean).join(" • ")}</p>
        </div>
        <button type="button" onClick={() => go("/streams")} style={{ background: liveCount ? "#dc2626" : "#111827", color: "white", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999, padding: "10px 12px", fontWeight: 1000, cursor: "pointer" }}>{liveCount ? "Watch" : "Open"}</button>
      </div>
    </MobileCard>
  );
}

function MobileWeekendRecap({ raceHistory = [], tracks = [], drivers = [], go }) {
  const [paintWinner, setPaintWinner] = useState(null);
  const [paintLoading, setPaintLoading] = useState(true);
  const [savedRaceWinner, setSavedRaceWinner] = useState(null);
  const showRaceWinnerWindow = shouldShowPreviousRaceWinnerSpotlight();

  useEffect(() => {
    let isMounted = true;

    async function loadSavedRaceWinner() {
      const { data, error } = await supabase
        .from("previous_race_winner")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Could not load mobile previous race winner media:", error);
        setSavedRaceWinner(null);
        return;
      }

      setSavedRaceWinner(data || null);
    }

    loadSavedRaceWinner();
    return () => {
      isMounted = false;
    };
  }, []);

  const lastRace = useMemo(() => {
    const history = Array.isArray(raceHistory) ? raceHistory.filter((race) => Array.isArray(race?.results) && race.results.length > 0) : [];
    return history.length ? history[history.length - 1] : null;
  }, [raceHistory]);

  const lastRaceWinner = useMemo(() => {
    const results = Array.isArray(lastRace?.results) ? lastRace.results : [];
    if (!results.length) return null;
    return results.find((result) => result?.isWin) ||
      results.find((result) => Number(result?.finishPos) === 1) ||
      [...results].sort((a, b) => Number(a?.finishPos || 999) - Number(b?.finishPos || 999))[0] ||
      null;
  }, [lastRace]);

  const paintRaceName = useMemo(() => {
    return getPreviousCompletedRaceForPaintWinner(tracks)?.name || lastRace?.raceName || lastRace?.name || "";
  }, [tracks, lastRace]);

  useEffect(() => {
    let isMounted = true;

    async function loadMobilePaintWinner() {
      setPaintLoading(true);

      const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
        supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
        supabase.from("paint_scheme_votes").select("*").order("created_at", { ascending: false }),
      ]);

      if (!isMounted) return;

      if (uploadError || voteError) {
        console.error("Could not load mobile paint scheme winner:", uploadError || voteError);
        setPaintWinner(null);
        setPaintLoading(false);
        return;
      }

      const uploads = (uploadData || [])
        .filter((upload) => isPaintImageUploadForStandings(upload))
        .filter((upload) => {
          const uploadRace = getPaintUploadRaceForStandings(upload);
          return paintRaceName ? uploadRace === paintRaceName : true;
        });

      const counts = new Map();
      (voteData || []).forEach((vote) => {
        if (paintRaceName && vote.race_name && vote.race_name !== paintRaceName) return;
        const key = String(vote.upload_id || vote.voted_upload_id || "");
        if (!key) return;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      const ranked = uploads
        .map((upload) => ({
          ...upload,
          voteCount: counts.get(String(upload.id)) || 0,
          imageUrl: upload.image_url || upload.file_url || "",
        }))
        .sort((a, b) => {
          const voteDiff = Number(b.voteCount || 0) - Number(a.voteCount || 0);
          if (voteDiff !== 0) return voteDiff;
          return new Date(b.uploaded_at || b.created_at || 0) - new Date(a.uploaded_at || a.created_at || 0);
        });

      const winningUpload = ranked[0] || null;
      if (!winningUpload) {
        setPaintWinner(null);
        setPaintLoading(false);
        return;
      }

      const driver = (drivers || []).find((item) => String(item.id) === String(winningUpload.driver_id));
      setPaintWinner({
        ...winningUpload,
        driverLabel: driver ? `#${driver.number} ${driver.name}` : winningUpload.driver_name || winningUpload.uploader_name || "Unknown Driver",
        teamLabel: driver?.team || winningUpload.team || winningUpload.team_key || "—",
        manufacturerLabel: driver?.manufacturer || winningUpload.manufacturer || "",
      });
      setPaintLoading(false);
    }

    loadMobilePaintWinner();
    return () => {
      isMounted = false;
    };
  }, [paintRaceName, JSON.stringify((drivers || []).map((driver) => ({ id: driver?.id, number: driver?.number, name: driver?.name, team: driver?.team, manufacturer: driver?.manufacturer })))]);

  // Once the paint scheme winner posts Wednesday night, the previous race winner should disappear.
  // The Bristol/upcoming race paint winner card below owns the home-page spotlight until race start.
  if (!showRaceWinnerWindow) return null;

  if (!lastRaceWinner && !savedRaceWinner && !paintWinner && !paintLoading) return null;

  const savedWinnerMediaUrl = savedRaceWinner?.media_url || savedRaceWinner?.mediaUrl || "";
  const savedWinnerMediaType = savedRaceWinner?.media_type || savedRaceWinner?.mediaType || "";
  const savedWinnerRaceName = savedRaceWinner?.race_name || savedRaceWinner?.raceName || "";
  const lastRaceName = savedWinnerRaceName || lastRace?.raceName || lastRace?.name || "Last Race";
  const winnerNumber = savedRaceWinner?.driver_number || savedRaceWinner?.number || lastRaceWinner?.number || lastRaceWinner?.driver_number || "";
  const winnerName = savedRaceWinner?.driver_name || savedRaceWinner?.name || lastRaceWinner?.name || lastRaceWinner?.driver_name || "Winner TBA";
  const winnerTeam = savedRaceWinner?.team || lastRaceWinner?.team || "—";
  const winnerManufacturer = savedRaceWinner?.manufacturer || lastRaceWinner?.manufacturer || "—";
  const winnerPoints = Number(savedRaceWinner?.points ?? lastRaceWinner?.totalRacePoints ?? lastRaceWinner?.points ?? 0);

  return (
    <section style={{ margin: "14px 0 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, margin: "0 2px 10px" }}>
        <div>
          <div style={mobileKickerStyle}>Weekend Recap</div>
          <h2 style={{ margin: "2px 0 0", fontSize: 20, lineHeight: 1.1 }}>Race Winners</h2>
        </div>
        <button
          type="button"
          onClick={() => go("/news")}
          style={{ background: "#111827", color: "#facc15", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, padding: "8px 10px", fontSize: 12, fontWeight: 900 }}
        >
          News
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <article style={{ ...mobileCardStyle, marginBottom: 0, padding: 0, overflow: "hidden" }}>
          <div style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(15,23,42,0.96))", padding: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ color: "#86efac", fontSize: 11, fontWeight: 1000, letterSpacing: 1.4, textTransform: "uppercase" }}>🏁 Last Race Winner</div>
            <h3 style={{ margin: "6px 0 2px", fontSize: 24, lineHeight: 1.05 }}>{lastRaceName}</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.68)", fontSize: 12 }}>Official most recent completed race result</p>
          </div>
          {savedWinnerMediaUrl && (
            <div style={{ background: "#070a0f", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {savedWinnerMediaType === "video" ? (
                <video controls src={savedWinnerMediaUrl} style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
              ) : (
                <img src={savedWinnerMediaUrl} alt={`${winnerName} race winner`} style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block" }} />
              )}
            </div>
          )}

          {(lastRaceWinner || savedRaceWinner) ? (
            <button
              type="button"
              onClick={() => winnerNumber && go(`/driver/${winnerNumber}`)}
              style={{ width: "100%", textAlign: "left", background: "transparent", color: "white", border: "none", padding: 14, display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{ width: 58, height: 58, borderRadius: 14, background: "linear-gradient(135deg, #22c55e, #0f172a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 1000, border: "1px solid rgba(255,255,255,0.14)" }}>#{winnerNumber}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: "block", fontSize: 18, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{winnerName}</strong>
                <span style={{ display: "block", color: "#aab3c2", fontSize: 12 }}>{winnerTeam} • {winnerManufacturer}</span>
                <span style={{ display: "block", color: "#86efac", fontSize: 12, fontWeight: 900, marginTop: 4 }}>{winnerPoints} race points</span>
              </div>
            </button>
          ) : (
            <div style={{ padding: 14, color: "#aab3c2" }}>No completed race winner found yet.</div>
          )}
        </article>
      </div>
    </section>
  );
}

function MobileFeatureHub({ go, drivers = [], teams = [], manufacturerStandings = [] }) {
  const featureGroups = [
    {
      title: "League",
      items: [
        { icon: "💬", label: "League Messages", desc: "Announcements, race control, owner messages, and direct messages", path: "/message-center" },
        { icon: "🗳", label: "League Voting", desc: "League polls and owner/driver votes", path: "/voting" },
        { icon: "📡", label: "Streams", desc: "Twitch, YouTube, watch party, and stream cards", path: "/streams" },
        { icon: "🔔", label: "Notifications", desc: "Driver and league reminders", path: "/notifications" },
        { icon: "💬", label: "League Chat", desc: "Mobile chat access", path: "/chat" },
        { icon: "🎮", label: "Discord", desc: "League Discord page", path: "/discord" },
      ],
    },
    {
      title: "Owner / Driver Tools",
      items: [
        { icon: "🔐", label: "Owner Login", desc: "Open the full owner portal", path: "/owner" },
        { icon: "🏢", label: "Team HQ", desc: "Owner login and full team controls", path: "/hq" },
        { icon: "📑", label: "Contracts", desc: "Contracts, offers, and driver agreements", path: "/contracts" },
        { icon: "⚖️", label: "Appeals", desc: "View league appeals page", path: "/appeals" },
      ],
    },
    {
      title: "Submissions / Admin Access",
      items: [
        { icon: "📝", label: "Submit Story", desc: "Send a story to league media", path: "/submit-story" },
        { icon: "⚖️", label: "Submit Appeal", desc: "File an appeal from mobile", path: "/submit-appeal" },
        { icon: "📁", label: "Files", desc: "League files and uploads", path: "/files" },
        { icon: "🛠", label: "Admin Portal", desc: "Opens the protected desktop admin portal", path: "/admin-login", desktop: true },
      ],
    },
  ];

  function openFeature(item) {
    if (item.desktop && typeof document !== "undefined") {
      document.cookie = "bcl-force-desktop=1; path=/; max-age=2592000";
    }
    go(item.path);
  }

  return (
    <>
      <MobileHero
        kicker="League Garage"
        title="More"
        subtitle="League messages, league voting, owner tools, streams, contracts, appeals, and admin access."
      />

      <MobileStatGrid
        items={[
          ["Drivers", drivers.length],
          ["Teams", teams.length],
          ["MFRs", manufacturerStandings.length],
        ]}
      />

      {featureGroups.map((group) => (
        <section key={group.title} style={mobileFeatureGroupStyle}>
          <MobileSectionTitle>{group.title}</MobileSectionTitle>
          <div style={mobileFeatureGridStyle}>
            {group.items.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => openFeature(item)}
                style={mobileFeatureButtonStyle}
              >
                <span style={mobileFeatureIconStyle}>{item.icon}</span>
                <span style={{ minWidth: 0 }}>
                  <strong style={mobileFeatureLabelStyle}>{item.label}</strong>
                  <small style={mobileFeatureDescStyle}>{item.desc}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}


function MobileNewsFeed({ go, desktopArchive = null }) {
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    function normalizeArticle(item = {}, source = "story_submissions") {
      const title = item.title || item.headline || item.story_title || item.subject || item.name || "League News Update";
      const body = item.story || item.story_text || item.body || item.content || item.article || item.message || item.description || item.summary || "";
      const createdAt = item.published_at || item.created_at || item.submitted_at || item.updated_at || item.date || item.timestamp || "";
      const author = item.author_name || item.author || item.submitted_by || item.created_by || item.writer || "BCL Media";
      const driver = item.driver_name || item.driver || item.driver_number || item.team || "";
      const status = item.status || item.state || (source === "story_submissions" ? "Submitted" : "Posted");
      const category = item.category || item.type || item.tag || "League News";
      const mainImage =
        item.image_url ||
        item.imageUrl ||
        item.photo_url ||
        item.thumbnail_url ||
        item.featured_image ||
        item.featured_image_url ||
        item.hero_image ||
        item.hero_image_url ||
        item.car_image_url ||
        item.media_url ||
        item.mediaUrl ||
        item.picture_url ||
        item.cover_url ||
        "";

      const extraImages = [
        mainImage,
        item.image_2_url,
        item.image2_url,
        item.second_image_url,
        item.photo_2_url,
        item.gallery_image_url,
      ].filter(Boolean);

      return {
        id: `${source}-${item.id || item.slug || title}-${createdAt}`,
        title: String(title || "League News Update").trim(),
        body: String(body || "").trim(),
        author: String(author || "BCL Media").trim(),
        driver: String(driver || "").trim(),
        status: String(status || "Posted").trim(),
        category: String(category || "League News").trim(),
        createdAt,
        source,
        imageUrl: mainImage,
        images: Array.from(new Set(extraImages)),
      };
    }

    function keepArticle(item = {}) {
      const status = String(item.status || item.state || "posted").trim().toLowerCase();
      if (["rejected", "declined", "hidden", "deleted"].includes(status)) return false;
      return Boolean(item.title || item.body);
    }

    async function loadTable(tableName) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) {
        console.warn(`Mobile news could not load ${tableName}:`, error);
        return [];
      }

      return (data || [])
        .map((item) => normalizeArticle(item, tableName))
        .filter(keepArticle);
    }

    async function loadMobileNews() {
      setLoading(true);
      setError("");

      const newsTables = [
        "news",
        "story_submissions",
        "news_articles",
        "league_news",
        "published_news",
        "news_posts",
      ];

      const results = await Promise.all(newsTables.map(loadTable));
      if (!isMounted) return;

      const byKey = new Map();
      results.flat().forEach((article) => {
        const key = `${String(article.title || "").trim().toLowerCase()}|${String(article.createdAt || "").slice(0, 10)}`;
        if (!byKey.has(key)) byKey.set(key, article);
      });

      const cleanArticles = Array.from(byKey.values()).sort((a, b) => {
        const bTime = new Date(b.createdAt || 0).getTime() || 0;
        const aTime = new Date(a.createdAt || 0).getTime() || 0;
        return bTime - aTime;
      });

      const latestFiveArticles = cleanArticles.slice(0, 5);
      setArticles(latestFiveArticles);
      setSelectedArticle(null);
      setLoading(false);
      if (!latestFiveArticles.length) {
        setError("No mobile news rows were found in the news tables. Showing the full News archive below.");
      }
    }

    loadMobileNews();
    return () => { isMounted = false; };
  }, []);

  function formatMobileDate(value) {
    if (!value) return "Recently";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function makeExcerpt(body = "", max = 125) {
    const clean = String(body || "").replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max).trim()}…`;
  }

  function renderArticleMedia(article) {
    const images = Array.isArray(article?.images) && article.images.length ? article.images : (article?.imageUrl ? [article.imageUrl] : []);
    if (!images.length) return <div style={mobileNewsDetailImageFallbackStyle}>🏁</div>;
    return (
      <div style={{ display: "grid", gap: 10 }}>
        {images.map((url, index) => (
          <img key={`${url}-${index}`} src={url} alt={article.title} style={mobileNewsDetailImageStyle} />
        ))}
      </div>
    );
  }

  if (selectedArticle) {
    return (
      <>
        <button type="button" onClick={() => setSelectedArticle(null)} style={mobileNewsBackButtonStyle}>← Back to latest stories</button>
        <article style={mobileNewsDetailCardStyle}>
          <div style={mobileNewsMetaRowStyle}>
            <span style={mobileNewsCategoryPillStyle}>{selectedArticle.category || "League News"}</span>
            <span>{formatMobileDate(selectedArticle.createdAt)}</span>
          </div>
          <h1 style={mobileNewsDetailTitleStyle}>{selectedArticle.title}</h1>
          {(selectedArticle.author || selectedArticle.driver) && (
            <div style={mobileNewsBylineStyle}>{selectedArticle.author}{selectedArticle.driver ? ` • ${selectedArticle.driver}` : ""}</div>
          )}
          <div style={{ margin: "14px 0" }}>{renderArticleMedia(selectedArticle)}</div>
          <div style={mobileNewsDetailBodyStyle}>{selectedArticle.body || "No story text was provided for this article."}</div>
        </article>
      </>
    );
  }

  return (
    <>
      <section style={mobileNewsMastheadStyle}>
        <div style={mobileNewsMastheadKickerStyle}>BCL NEWSROOM</div>
        <h1 style={mobileNewsMastheadTitleStyle}>Latest League News</h1>
        <p style={mobileNewsMastheadSubStyle}>The five most recent BCL stories. Tap a headline to read the full article and view photos.</p>
        <div style={mobileNewsMastheadActionsStyle}>
          <button type="button" onClick={() => go("/submit-story")} style={mobileNewsPrimaryButtonStyle}>Submit Story</button>
          <button type="button" onClick={() => window.location.reload()} style={mobileNewsGhostButtonStyle}>Refresh</button>
        </div>
      </section>

      <LeagueTicker page="news" />

      {loading && <MobileCard><strong>Loading news...</strong></MobileCard>}
      {error && !loading && <MobileCard><p style={{ margin: 0, color: "#fbbf24", fontWeight: 900 }}>{error}</p></MobileCard>}

      {!loading && articles.length > 0 && (
        <div style={{ margin: "4px 2px 12px", color: "#aab3c2", fontSize: 12, fontWeight: 900, letterSpacing: 0.7, textTransform: "uppercase" }}>
          Showing latest {articles.length} stories
        </div>
      )}

      <div style={mobileNewsHeadlineListStyle}>
        {articles.map((article, index) => (
          <button
            type="button"
            key={article.id || `${article.title}-${index}`}
            onClick={() => setSelectedArticle(article)}
            style={index === 0 ? mobileNewsHeadlineLeadButtonStyle : mobileNewsHeadlineButtonStyle}
          >
            {article.imageUrl && index === 0 && <img src={article.imageUrl} alt={article.title} style={mobileNewsHeadlineLeadImageStyle} />}
            <div style={{ minWidth: 0, textAlign: "left" }}>
              <div style={mobileNewsMetaRowStyle}>
                <span style={mobileNewsCategoryPillStyle}>{article.category || "League News"}</span>
                <span>{formatMobileDate(article.createdAt)}</span>
              </div>
              <h2 style={index === 0 ? mobileNewsHeadlineLeadTitleStyle : mobileNewsHeadlineTitleStyle}>{article.title}</h2>
              {article.body && <p style={mobileNewsHeadlineExcerptStyle}>{makeExcerpt(article.body, index === 0 ? 160 : 105)}</p>}
              <div style={mobileNewsReadMoreStyle}>Tap to read story →</div>
            </div>
          </button>
        ))}
      </div>

      {!articles.length && desktopArchive && !loading && (
        <div style={{ marginTop: 18 }}>
          <MobileSectionTitle>Full News Archive</MobileSectionTitle>
          <div style={mobileNewsArchiveShellStyle}>{desktopArchive}</div>
        </div>
      )}
    </>
  );
}

function MobileDataFrame({ children }) {
  return (
    <div className="bcl-mobile-data-frame" style={mobileDataFrameStyle}>
      <style>{mobileDataFrameCss}</style>
      {children}
    </div>
  );
}

function MobileRaceResultCard({ race }) {
  const winner = race?.results?.find((r) => Number(r.finishPos) === 1);
  const topFive = [...(race?.results || [])]
    .filter((r) => r.finishPos)
    .sort((a, b) => Number(a.finishPos) - Number(b.finishPos))
    .slice(0, 5);
  return (
    <MobileCard>
      <div style={mobileKickerStyle}>Race Results</div>
      <h2 style={{ margin: "4px 0 8px" }}>{race.raceName}</h2>
      {winner && <p style={{ margin: "0 0 10px", color: "#aab3c2" }}>Winner: #{winner.number} {winner.name}</p>}
      <div style={{ display: "grid", gap: 8 }}>
        {topFive.map((r) => (
          <div key={`${race.raceName}-${r.driverId}`} style={mobileSmallRowStyle}>
            <strong>{r.finishPos}. #{r.number} {r.name}</strong>
            <span>{r.totalRacePoints || 0} pts</span>
          </div>
        ))}
      </div>
    </MobileCard>
  );
}

function MobileLayout({ title, children, go, active, session = null, onLogout = () => {} }) {
  function openDesktopVersion() {
    if (typeof document !== "undefined") {
      document.cookie = "bcl-force-desktop=1; path=/; max-age=2592000";
    }
    window.location.reload();
  }

  return (
    <div style={mobileAppStyle}>
      <header style={mobileTopbarStyle}>
        <button type="button" onClick={() => go("/standings")} style={mobileLogoButtonStyle}>🏁</button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong style={{ fontSize: 16, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</strong>
          {session && (
            <span style={{ display: "block", color: "#9ca3af", fontSize: 10, fontWeight: 900, textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session.mode === "guest" ? "Guest View Only" : `#${session.driverNumber} ${session.driverName}`}
            </span>
          )}
        </div>
        <button type="button" onClick={() => go("/message-center")} style={mobileBellStyle} aria-label="League Messages">💬</button>
      </header>
      <main style={mobileContentStyle}>
        {session && (
          <div style={{ background: "rgba(15,23,42,0.92)", border: "1px solid #263244", borderRadius: 16, padding: "10px 12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: session.mode === "guest" ? "#fbbf24" : "#4ade80", fontSize: 10, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>
                {session.mode === "guest" ? "Guest Access" : "Driver Signed In"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {session.mode === "guest" ? "View-only mode" : `#${session.driverNumber} ${session.driverName}`}
              </div>
            </div>
            <button type="button" onClick={onLogout} style={{ background: "#111827", color: "#fff", border: "1px solid #334155", borderRadius: 12, padding: "8px 10px", fontSize: 12, fontWeight: 900 }}>
              Log Out
            </button>
          </div>
        )}
        {children}
        <div style={mobileDesktopSwitchCardStyle}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 1000, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 }}>Display Mode</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Mobile Version</div>
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 3 }}>Optimized for phones</div>
          </div>
          <button type="button" onClick={openDesktopVersion} style={mobileDesktopSwitchButtonStyle}>
            🖥 View Desktop
          </button>
        </div>
      </main>
      <nav style={mobileBottomNavStyle}>
        <MobileNavButton active={active === "standings" || active === "home"} icon="🏁" label="Home" onClick={() => go("/")} />
        <MobileNavButton active={active === "news"} icon="📰" label="News" onClick={() => go("/news")} />
        <MobileNavButton active={active === "votes"} icon="🎨" label="Votes" onClick={() => go("/paint-scheme-vote")} />
        <MobileNavButton active={active === "interviews"} icon="🎤" label="Interviews" onClick={() => go("/interviews")} />
        <MobileNavButton active={active === "more"} icon="☰" label="More" onClick={() => go("/more")} />
      </nav>
    </div>
  );
}
function MobileNavButton({ icon, label, onClick, active }) { return <button type="button" onClick={onClick} style={{ ...mobileNavButtonStyle, color: active ? "#d4af37" : "#ffffff" }}><span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 10 }}>{label}</span></button>; }
function MobileHero({ kicker, title, subtitle }) { return <section style={mobileHeroStyle}><div style={mobileKickerStyle}>{kicker}</div><h1 style={{ margin: "4px 0", fontSize: 28, lineHeight: 1.05 }}>{title}</h1>{subtitle && <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{subtitle}</p>}</section>; }
function MobileCard({ children }) { return <section style={mobileCardStyle}>{children}</section>; }
function MobileAction({ label, onClick, secondary = false }) { return <button type="button" onClick={onClick} style={{ ...mobileActionStyle, background: secondary ? "#111827" : "#d4af37", color: secondary ? "#ffffff" : "#111111", borderColor: secondary ? "#263244" : "#d4af37" }}>{label}</button>; }
function MobileStatGrid({ items }) { return <div style={mobileStatGridStyle}>{items.map(([label, value]) => <div key={label} style={mobileStatCardStyle}><div style={{ color: "#aab3c2", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</div><strong style={{ fontSize: 20 }}>{value}</strong></div>)}</div>; }
function MobileStandingsList({ drivers, go }) { return <div>{drivers.map((driver, index) => <button type="button" key={`${driver.number}-${driver.name}`} onClick={() => go(`/driver/${driver.number}`)} style={mobileDriverCardStyle}><div style={mobileRankStyle}>{index + 1}</div><div style={{ minWidth: 0 }}><strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>#{driver.number} {driver.name}</strong><span style={{ color: "#aab3c2", fontSize: 12 }}>{driver.team || "Independent"} • {driver.manufacturer || ""}</span></div><div style={mobilePointsStyle}>{driver.points || 0}<span style={{ display: "block", fontSize: 10, color: "#aab3c2" }}>PTS</span></div></button>)}</div>; }
function MobileSectionTitle({ children }) { return <h2 style={{ fontSize: 16, margin: "20px 2px 10px", color: "#ffffff" }}>{children}</h2>; }


function MobileDriverProfilePolished({ driver, driverNumber, raceHistory = [], tracks = [], seasons, activeSeason, go }) {
  const safeDriver = driver || { number: driverNumber, name: `Driver #${driverNumber}`, team: "", manufacturer: "" };
  const teamName = getTeamFullName(safeDriver.team || "Independent");
  const manufacturerLogo = manufacturerLogos[safeDriver.manufacturer] || safeDriver.manufacturerLogo || null;
  const teamLogo = teamLogos[safeDriver.team] || teamLogos[teamName] || null;

  const driverResults = (raceHistory || [])
    .map((race) => {
      const result = (race.results || []).find((entry) => {
        return String(entry.driverId) === String(safeDriver.id) || String(entry.number) === String(safeDriver.number);
      });
      if (!result) return null;
      return { race, result };
    })
    .filter(Boolean)
    .reverse()
    .slice(0, 5);

  const bestFinish = driverResults.length
    ? Math.min(...driverResults.map(({ result }) => Number(result.finishPos || result.finish || 999)))
    : null;

  const statCards = [
    { label: "Points", value: safeDriver.points || 0 },
    { label: "Wins", value: safeDriver.wins || 0 },
    { label: "Top 3", value: safeDriver.top3 || 0 },
    { label: "Top 5", value: safeDriver.top5 || 0 },
    { label: "DNFs", value: safeDriver.dnfs || 0 },
    { label: "Best Finish", value: bestFinish && bestFinish !== 999 ? bestFinish : "—" },
  ];

  return (
    <div style={{ paddingBottom: 90 }}>
      <AppUpdateBanner page="driver" />
      <DriverVoteReminderStrip driverNumber={driverNumber} />

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 24,
          border: "1px solid rgba(212,175,55,0.32)",
          background: "radial-gradient(circle at top left, rgba(212,175,55,0.25), transparent 34%), linear-gradient(135deg, #171b22 0%, #080b10 100%)",
          boxShadow: "0 20px 44px rgba(0,0,0,0.42)",
          padding: 18,
          marginBottom: 16,
        }}
      >
        <div style={{ position: "absolute", right: -18, top: -28, fontSize: 118, fontWeight: 1000, color: "rgba(255,255,255,0.055)", lineHeight: 1 }}>
          {safeDriver.number}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 22,
              background: "linear-gradient(135deg, #d4af37 0%, #111827 70%)",
              color: "#111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 1000,
              border: "2px solid rgba(255,255,255,0.16)",
              boxShadow: "0 12px 28px rgba(0,0,0,0.35)",
            }}
          >
            #{safeDriver.number}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: "#d4af37", fontSize: 11, fontWeight: 1000, letterSpacing: 1.1, textTransform: "uppercase" }}>
              Driver Profile
            </div>
            <h1 style={{ margin: "5px 0 6px", fontSize: 27, lineHeight: 1.02, fontWeight: 1000, wordBreak: "break-word" }}>
              {safeDriver.name}
            </h1>
            <div style={{ color: "#c6ceda", fontSize: 13, fontWeight: 800 }}>
              {teamName} • {safeDriver.manufacturer || "Manufacturer TBA"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, position: "relative", zIndex: 1 }}>
          {teamLogo && <img src={teamLogo} alt={teamName} style={{ width: 46, height: 46, borderRadius: 14, objectFit: "cover", background: "#111" }} />}
          {manufacturerLogo && <img src={manufacturerLogo} alt={safeDriver.manufacturer} style={{ width: 46, height: 46, borderRadius: 14, objectFit: "contain", background: "#ffffff", padding: 6, boxSizing: "border-box" }} />}
          <button type="button" onClick={() => go(`/team/${safeDriver.team || "Independent"}`)} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 14, padding: "10px 12px", fontWeight: 900 }}>
            Team Page
          </button>
        </div>
      </section>

      <MobileSectionTitle>Season Stats</MobileSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{ background: "#111827", border: "1px solid #263244", borderRadius: 18, padding: 14 }}>
            <div style={{ color: "#d4af37", fontSize: 24, fontWeight: 1000, lineHeight: 1 }}>{stat.value}</div>
            <div style={{ color: "#aab3c2", fontSize: 11, fontWeight: 900, textTransform: "uppercase", marginTop: 6 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <MobileSectionTitle>Quick Actions</MobileSectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <MobileAction label="🎤 Interviews" onClick={() => go("/interviews")} />
        <MobileAction label="🎨 Paint Vote" onClick={() => go("/paint-scheme-vote")} />
        <MobileAction label="💬 Messages" onClick={() => go("/message-center")} secondary />
        <MobileAction label="📺 Streams" onClick={() => go("/streams")} secondary />
      </div>

      <MobileSectionTitle>Recent Results</MobileSectionTitle>
      {driverResults.length === 0 ? (
        <MobileCard>
          <div style={{ color: "#aab3c2" }}>No recent results found for this driver yet.</div>
        </MobileCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {driverResults.map(({ race, result }) => (
            <div key={`${race.raceName}-${result.driverId}-${result.number}`} style={{ background: "#111827", border: "1px solid #263244", borderRadius: 18, padding: 14, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{race.raceName || race.name || "Race"}</div>
                <div style={{ color: "#aab3c2", fontSize: 12, marginTop: 4 }}>
                  {Number(result.totalRacePoints || 0)} pts{result.fastestLap ? " • Fastest Lap" : ""}{result.dnf ? " • DNF" : ""}
                </div>
              </div>
              <div style={{ background: "#d4af37", color: "#111", borderRadius: 14, minWidth: 54, padding: "9px 10px", textAlign: "center", fontWeight: 1000 }}>
                P{result.finishPos || result.finish || "—"}
              </div>
            </div>
          ))}
        </div>
      )}

      <MobileSectionTitle>Driver Portal</MobileSectionTitle>
      <MobileCard>
        <div style={{ color: "#aab3c2", fontSize: 13, lineHeight: 1.45, marginBottom: 12 }}>
          Full profile tools are below. Driver password requirements and existing desktop functionality are unchanged.
        </div>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 4 }}>
          <div style={{ minWidth: 360 }}>
            <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />
          </div>
        </div>
      </MobileCard>
    </div>
  );
}
function MobileTeamRow({ team, index }) { return <div style={mobileSmallRowStyle}><strong>{index + 1}. {team.team || team.name}</strong><span>{team.points || 0} pts</span></div>; }
function MobileManufacturerRow({ manufacturer, index }) { return <div style={mobileSmallRowStyle}><strong>{index + 1}. {manufacturer.manufacturer || manufacturer.name}</strong><span>{manufacturer.points || 0} pts</span></div>; }
function MobileRaceCard({ race }) { return <MobileCard><div style={mobileKickerStyle}>Next Race</div><h2 style={{ margin: "4px 0" }}>{race.name || race.track || "Race"}</h2><p style={{ color: "#aab3c2", margin: 0 }}>{race.date || "Date TBA"} • Qualifying 9:15 PM • Race 9:30 PM</p></MobileCard>; }


const mobileStreamHeroCardStyle = { background: "linear-gradient(135deg, #111827 0%, #070b10 100%)", border: "1px solid rgba(212,175,55,0.38)", borderRadius: 24, padding: 18, marginBottom: 14, boxShadow: "0 18px 42px rgba(0,0,0,0.36)" };
const mobileLivePillStyle = { background: "#dc2626", color: "white", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 1000, letterSpacing: 0.7 };
const mobileLivePillSmallStyle = { background: "#dc2626", color: "white", borderRadius: 999, padding: "4px 7px", fontSize: 10, fontWeight: 1000, letterSpacing: 0.5 };
const mobileStreamButtonGridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const mobileTwitchButtonStyle = { background: "#9146ff", color: "white", border: "none", borderRadius: 14, padding: "13px 12px", fontWeight: 1000, cursor: "pointer" };
const mobileYoutubeButtonStyle = { background: "#ff0033", color: "white", border: "none", borderRadius: 14, padding: "13px 12px", fontWeight: 1000, cursor: "pointer" };
const mobileStreamFilterBarStyle = { display: "flex", gap: 8, overflowX: "auto", WebkitOverflowScrolling: "touch", padding: "2px 2px 12px", marginBottom: 4 };
const mobileStreamFilterChipStyle = { flex: "0 0 auto", border: "1px solid #263244", borderRadius: 999, padding: "10px 13px", fontSize: 13, fontWeight: 1000, cursor: "pointer" };
const mobileStreamListStyle = { display: "grid", gap: 12, marginBottom: 14 };
const mobileStreamCardStyle = { background: "#101722", border: "1px solid #263244", borderRadius: 20, padding: 14, display: "flex", gap: 13, alignItems: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.24)" };
const mobileStreamNumberStyle = { width: 54, height: 54, borderRadius: 18, background: "linear-gradient(135deg, #d4af37, #7c5f12)", color: "#111", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, flex: "0 0 auto", fontSize: 15, boxShadow: "0 10px 20px rgba(212,175,55,0.12)" };
const mobileStreamLinksStyle = { display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" };
const mobileMiniTwitchButtonStyle = { background: "rgba(145,70,255,0.18)", color: "#d8c7ff", border: "1px solid rgba(145,70,255,0.48)", borderRadius: 999, padding: "8px 11px", fontSize: 12, fontWeight: 1000, cursor: "pointer" };
const mobileMiniYoutubeButtonStyle = { background: "rgba(255,0,51,0.16)", color: "#fecdd3", border: "1px solid rgba(255,0,51,0.45)", borderRadius: 999, padding: "8px 11px", fontSize: 12, fontWeight: 1000, cursor: "pointer" };

const mobileFeatureGroupStyle = { marginTop: 12 };
const mobileFeatureGridStyle = { display: "grid", gridTemplateColumns: "1fr", gap: 10 };
const mobileFeatureButtonStyle = { width: "100%", background: "linear-gradient(135deg, #101827 0%, #0c111a 100%)", color: "#ffffff", border: "1px solid #263244", borderRadius: 18, padding: "14px 14px", display: "grid", gridTemplateColumns: "42px 1fr", gap: 12, alignItems: "center", textAlign: "left", cursor: "pointer", boxShadow: "0 12px 30px rgba(0,0,0,0.22)" };
const mobileFeatureIconStyle = { width: 42, height: 42, borderRadius: 14, background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.24)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 };
const mobileFeatureLabelStyle = { display: "block", fontSize: 15, fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" };
const mobileFeatureDescStyle = { display: "block", marginTop: 3, color: "#9ca8ba", fontSize: 12, lineHeight: 1.35 };
const mobileNewsMastheadStyle = { background: "linear-gradient(180deg, #101827 0%, #0b1018 100%)", border: "1px solid rgba(212,175,55,0.32)", borderRadius: 22, padding: "22px 18px", marginBottom: 14, boxShadow: "0 18px 42px rgba(0,0,0,0.32)" };
const mobileNewsMastheadKickerStyle = { color: "#facc15", fontSize: 11, fontWeight: 1000, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 8 };
const mobileNewsMastheadTitleStyle = { margin: 0, fontSize: 32, lineHeight: 0.95, fontWeight: 1000, letterSpacing: -1.2 };
const mobileNewsMastheadSubStyle = { margin: "10px 0 0", color: "#aab3c2", fontSize: 14, lineHeight: 1.45 };
const mobileNewsMastheadActionsStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 };
const mobileNewsPrimaryButtonStyle = { background: "linear-gradient(135deg, #d4af37, #facc15)", color: "#111", border: "none", borderRadius: 14, padding: "12px 14px", fontWeight: 1000, fontSize: 14, cursor: "pointer" };
const mobileNewsGhostButtonStyle = { background: "#151c28", color: "#ffffff", border: "1px solid #2d3748", borderRadius: 14, padding: "12px 14px", fontWeight: 1000, fontSize: 14, cursor: "pointer" };
const mobileNewsFeedStyle = { display: "flex", flexDirection: "column", gap: 14, paddingBottom: 18 };
const mobileNewsLeadCardStyle = { background: "#0f141c", border: "1px solid rgba(212,175,55,0.38)", borderRadius: 24, overflow: "hidden", marginBottom: 18, boxShadow: "0 20px 46px rgba(0,0,0,0.42)" };
const mobileNewsLeadImageStyle = { width: "100%", height: 220, objectFit: "cover", display: "block", background: "#05070a" };
const mobileNewsLeadImageFallbackStyle = { height: 135, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, background: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(17,24,39,0.95))" };
const mobileNewsLeadContentStyle = { padding: "16px 16px 18px" };
const mobileNewsLeadTitleStyle = { margin: "8px 0 10px", fontSize: 27, lineHeight: 1.02, fontWeight: 1000, letterSpacing: -0.8, color: "#ffffff" };
const mobileNewsLeadExcerptStyle = { margin: "0 0 12px", color: "#d7dde8", fontSize: 15, lineHeight: 1.5 };
const mobileNewsArticleStyle = { background: "#101722", border: "1px solid #263244", borderRadius: 20, overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.28)" };
const mobileNewsCardImageStyle = { width: "100%", height: 150, objectFit: "cover", display: "block", background: "#05070a" };
const mobileNewsStoryContentStyle = { padding: "15px 15px 16px" };
const mobileNewsMetaRowStyle = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, color: "#9ca8ba", fontSize: 12, fontWeight: 900, marginBottom: 8 };
const mobileNewsCategoryPillStyle = { background: "rgba(212,175,55,0.14)", border: "1px solid rgba(212,175,55,0.5)", color: "#facc15", borderRadius: 999, padding: "5px 9px", textTransform: "uppercase", letterSpacing: 0.75, fontSize: 10, fontWeight: 1000, maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const mobileNewsTitleStyle = { margin: "0 0 7px", fontSize: 20, lineHeight: 1.12, fontWeight: 1000, letterSpacing: -0.35, color: "#ffffff" };
const mobileNewsBylineStyle = { color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.75, marginBottom: 9 };
const mobileNewsExcerptStyle = { margin: 0, color: "#cbd5e1", fontSize: 14, lineHeight: 1.48 };
const mobileNewsArchiveShellStyle = { overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 18, border: "1px solid #263244", background: "#0f141c" };

const mobileAppStyle = { minHeight: "100vh", background: "#080b10", color: "white", paddingBottom: 82, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const mobileTopbarStyle = { position: "sticky", top: 0, zIndex: 20, background: "#0c0f14", borderBottom: "1px solid #222936", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" };
const mobileLogoButtonStyle = { width: 44, height: 44, borderRadius: 999, border: "1px solid #2d3544", background: "#171c26", color: "white", fontSize: 18 };
const mobileBellStyle = { width: 44, height: 44, borderRadius: 999, border: "1px solid #2d3544", background: "#171c26", color: "white", fontSize: 20 };
const mobileContentStyle = { padding: 14 };
const mobileHeroStyle = { background: "linear-gradient(135deg, #c8102e, #111827)", borderRadius: 20, padding: 18, marginBottom: 14, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 30px rgba(0,0,0,0.25)" };
const mobileKickerStyle = { color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 1.3 };
const mobileCardStyle = { background: "#111827", border: "1px solid #263244", borderRadius: 16, padding: 14, marginBottom: 12 };
const mobileDriverCardStyle = { width: "100%", background: "#111827", color: "white", border: "1px solid #263244", borderRadius: 16, padding: 12, marginBottom: 10, display: "grid", gridTemplateColumns: "38px 1fr auto", alignItems: "center", gap: 10, textAlign: "left" };
const mobileRankStyle = { width: 34, height: 34, background: "#d4af37", color: "#111", borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 1000 };
const mobilePointsStyle = { fontWeight: 1000, fontSize: 19, textAlign: "right" };
const mobileBottomNavStyle = { position: "fixed", left: 0, right: 0, bottom: 0, background: "#0c0f14", borderTop: "1px solid #222936", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", padding: "7px 4px", zIndex: 30 };
const mobileDesktopSwitchCardStyle = { marginTop: 18, marginBottom: 84, background: "linear-gradient(135deg, rgba(212,175,55,0.10), rgba(15,19,25,0.96))", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 18, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, boxShadow: "0 12px 26px rgba(0,0,0,0.24)" };
const mobileDesktopSwitchButtonStyle = { border: "none", borderRadius: 999, padding: "11px 13px", background: "linear-gradient(135deg, #d4af37, #facc15)", color: "#111", fontWeight: 1000, fontSize: 12, whiteSpace: "nowrap", boxShadow: "0 10px 20px rgba(212,175,55,0.18)", cursor: "pointer" };
const mobileNavButtonStyle = { background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minHeight: 50, fontWeight: 800 };
const mobileActionStyle = { width: "100%", minHeight: 48, borderRadius: 14, border: "1px solid", padding: "12px 14px", fontWeight: 1000, marginBottom: 10 };
const mobileStatGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 };
const mobileStatCardStyle = { background: "#111827", border: "1px solid #263244", borderRadius: 16, padding: 12 };
const mobileSmallRowStyle = { background: "#111827", border: "1px solid #263244", borderRadius: 14, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" };

const mobileDataFrameStyle = { width: "100%", maxWidth: "100%", overflowX: "hidden", borderRadius: 18 };
const mobileDataFrameCss = `
  .bcl-mobile-data-frame, .bcl-mobile-data-frame * { box-sizing: border-box; }
  .bcl-mobile-data-frame { width: 100%; max-width: 100%; overflow-x: hidden; }
  .bcl-mobile-data-frame > div { max-width: 100% !important; width: 100% !important; }
  .bcl-mobile-data-frame table { width: 100% !important; min-width: 680px; }
  .bcl-mobile-data-frame input,
  .bcl-mobile-data-frame select,
  .bcl-mobile-data-frame textarea,
  .bcl-mobile-data-frame button { min-height: 44px; font-size: 16px; }
  .bcl-mobile-data-frame img, .bcl-mobile-data-frame video, .bcl-mobile-data-frame iframe { max-width: 100%; }
  .bcl-mobile-data-frame [style*="max-width: 1400px"],
  .bcl-mobile-data-frame [style*="max-width:1400px"] { max-width: 100% !important; }
  .bcl-mobile-data-frame [style*="padding: 20px"],
  .bcl-mobile-data-frame [style*="padding:20px"] { padding: 12px !important; }
  .bcl-mobile-data-frame [style*="overflow-x: auto"],
  .bcl-mobile-data-frame [style*="overflow-x:auto"] { -webkit-overflow-scrolling: touch; }
  @media (max-width: 768px) {
    .bcl-mobile-data-frame h1 { font-size: 28px !important; line-height: 1.05 !important; }
    .bcl-mobile-data-frame h2 { font-size: 22px !important; }
    .bcl-mobile-data-frame h3 { font-size: 18px !important; }
    .bcl-mobile-data-frame p, .bcl-mobile-data-frame div, .bcl-mobile-data-frame td, .bcl-mobile-data-frame th { line-height: 1.35; }
  }
`;


const mobileNewsHeadlineListStyle = { display: "grid", gap: 12, paddingBottom: 14 };
const mobileNewsHeadlineButtonStyle = { width: "100%", textAlign: "left", background: "#10151f", color: "white", border: "1px solid rgba(212,175,55,0.22)", borderRadius: 18, padding: 14, cursor: "pointer", boxShadow: "0 12px 30px rgba(0,0,0,0.22)" };
const mobileNewsHeadlineLeadButtonStyle = { ...mobileNewsHeadlineButtonStyle, padding: 0, overflow: "hidden", borderColor: "rgba(212,175,55,0.55)", background: "linear-gradient(180deg, #141a24 0%, #0d1118 100%)" };
const mobileNewsHeadlineLeadImageStyle = { width: "100%", height: 190, objectFit: "cover", display: "block", borderBottom: "1px solid rgba(212,175,55,0.25)" };
const mobileNewsHeadlineLeadTitleStyle = { margin: "10px 14px 6px", fontSize: 24, lineHeight: 1.05, fontWeight: 1000, letterSpacing: -0.4 };
const mobileNewsHeadlineTitleStyle = { margin: "8px 0 6px", fontSize: 18, lineHeight: 1.12, fontWeight: 1000, letterSpacing: -0.2 };
const mobileNewsHeadlineExcerptStyle = { margin: "0 0 8px", color: "#aab3c2", fontSize: 13, lineHeight: 1.45 };
const mobileNewsReadMoreStyle = { color: "#d4af37", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.6 };
const mobileNewsBackButtonStyle = { width: "100%", background: "#111827", color: "#ffffff", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 14, padding: "12px 14px", fontWeight: 1000, marginBottom: 12, cursor: "pointer", textAlign: "left" };
const mobileNewsDetailCardStyle = { background: "#0f141d", border: "1px solid rgba(212,175,55,0.28)", borderRadius: 22, padding: 16, boxShadow: "0 14px 34px rgba(0,0,0,0.32)", marginBottom: 22 };
const mobileNewsDetailTitleStyle = { margin: "10px 0 8px", fontSize: 28, lineHeight: 1.05, fontWeight: 1000, letterSpacing: -0.5 };
const mobileNewsDetailImageStyle = { width: "100%", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)", objectFit: "cover", maxHeight: 360 };
const mobileNewsDetailImageFallbackStyle = { height: 190, borderRadius: 18, background: "linear-gradient(135deg, #1b2330, #0c1017)", border: "1px solid rgba(212,175,55,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 54 };
const mobileNewsDetailBodyStyle = { whiteSpace: "pre-wrap", color: "#e5e7eb", fontSize: 16, lineHeight: 1.65 };


const NASCAR26_RELEASE_DATE = "2026-09-15T00:00:00-04:00";

function getCountdownParts(targetDate, now = new Date()) {
  const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  if (!Number.isFinite(diffMs)) return null;
  if (diffMs <= 0) return { expired: true, days: 0, hours: 0 };
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  return {
    expired: false,
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}

function formatMiniCountdown(parts) {
  if (!parts) return "—";
  if (parts.expired) return "AVAILABLE";
  if (parts.days > 0) return `${parts.days}d ${parts.hours}h`;
  return `${parts.hours}h`;
}

function LeagueStatusWidget({ tracks = [], seasonName = "", mobile = false }) {
  const [now, setNow] = useState(() => new Date());
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const upcomingRace = getUpcomingRaceByDate(tracks || []);
  const raceTarget = upcomingRace?.date ? `${String(upcomingRace.date).slice(0, 10)}T21:30:00-04:00` : null;
  const nascar26 = getCountdownParts(NASCAR26_RELEASE_DATE, now);
  const raceCountdown = raceTarget ? getCountdownParts(raceTarget, now) : null;
  const releasePlusTwoDays = new Date(new Date(NASCAR26_RELEASE_DATE).getTime() + 48 * 60 * 60 * 1000);
  const showNascar26 = now < releasePlusTwoDays;

  if (!showNascar26 && !upcomingRace) return null;

  const widgetStyle = {
    position: "fixed",
    right: mobile ? 10 : 12,
    bottom: mobile ? 78 : 12,
    zIndex: 99999,
    width: expanded ? (mobile ? 205 : 230) : (mobile ? 148 : 172),
    background: "rgba(10, 14, 20, 0.92)",
    border: "1px solid rgba(212,175,55,0.32)",
    borderRadius: 14,
    padding: expanded ? (mobile ? "10px 11px" : "12px 13px") : (mobile ? "7px 8px" : "9px 10px"),
    color: "white",
    boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
    backdropFilter: "blur(8px)",
    cursor: "pointer",
    fontFamily: "Arial, sans-serif",
    fontSize: mobile ? 10.5 : 12,
    opacity: 0.88,
  };

  const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, lineHeight: 1.25 };
  const labelStyle = { opacity: 0.78, fontWeight: 800, whiteSpace: "nowrap" };
  const valueStyle = { color: "#d4af37", fontWeight: 1000, whiteSpace: "nowrap" };

  return (
    <div
      style={widgetStyle}
      onClick={() => setExpanded((value) => !value)}
      title="League status"
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") setExpanded((value) => !value);
      }}
    >
      {showNascar26 && (
        <div style={rowStyle}>
          <span style={labelStyle}>🏁 NASCAR 26</span>
          <span style={valueStyle}>{formatMiniCountdown(nascar26)}</span>
        </div>
      )}
      {upcomingRace && (
        <div style={{ ...rowStyle, marginTop: showNascar26 ? 6 : 0 }}>
          <span style={labelStyle}>🏎️ {upcomingRace.name}</span>
          <span style={valueStyle}>{formatMiniCountdown(raceCountdown)}</span>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid rgba(255,255,255,0.12)", opacity: 0.86, lineHeight: 1.45 }}>
          <div>Release target: September 2026</div>
          {seasonName && <div>Season: {seasonName}</div>}
          {upcomingRace && <div>Race start: Saturday 9:30 PM ET</div>}
          <div style={{ marginTop: 4, fontSize: 11, opacity: 0.68 }}>Tap to collapse</div>
        </div>
      )}
    </div>
  );
}


function AppleSeriesPortalLanding() {
  const [showV3Details, setShowV3Details] = useState(false);

  const seriesCards = [
    {
      id: "cup",
      title: "Cup Series",
      eyebrow: "Premier Division",
      route: "/standings",
      image: ncsLogo,
      accent: "#007aff",
      gradient: "linear-gradient(135deg, rgba(0,122,255,0.92), rgba(10,132,255,0.55), rgba(0,0,0,0.82))",
      status: "Live Season",
      meta: "Standings • Teams • Race Center",
    },
    {
      id: "xfinity",
      title: "Xfinity Series",
      eyebrow: "Development Division",
      route: "/series/xfinity",
      image: nxsLogo,
      accent: "#a855f7",
      gradient: "linear-gradient(135deg, rgba(168,85,247,0.92), rgba(236,72,153,0.48), rgba(0,0,0,0.82))",
      status: "Series Portal",
      meta: "Drivers • Teams • Join Requests",
    },
    {
      id: "truck",
      title: "Truck Series",
      eyebrow: "Short Track Division",
      route: "/series/truck",
      image: ctsLogo,
      accent: "#ff9500",
      gradient: "linear-gradient(135deg, rgba(255,149,0,0.92), rgba(255,204,0,0.45), rgba(0,0,0,0.82))",
      status: "Series Portal",
      meta: "Schedule • Rosters • Media",
    },
    {
      id: "arca",
      title: "ARCA Series",
      eyebrow: "Entry Division",
      route: "/series/arca",
      image: amsLogo,
      accent: "#ff3b30",
      gradient: "linear-gradient(135deg, rgba(255,59,48,0.92), rgba(255,149,0,0.46), rgba(0,0,0,0.82))",
      status: "Series Portal",
      meta: "Numbers • Drivers • Development",
    },
  ];

  const openSeries = (route) => {
    window.location.pathname = route;
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(245,245,247,0.94) 36%, rgba(229,229,234,0.98) 100%)",
      color: "#1d1d1f",
      padding: "clamp(18px, 4vw, 42px)",
      boxSizing: "border-box",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
    }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          marginBottom: 26,
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.55))",
              boxShadow: "0 18px 42px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(255,255,255,0.7)",
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
            }}>
              <img src={logo} alt="Budweiser Motorsports" style={{ width: "82%", height: "82%", objectFit: "contain" }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(29,29,31,0.58)" }}>
                Budweiser Motorsports
              </div>
              <h1 style={{ margin: "4px 0 0", fontSize: "clamp(30px, 5vw, 58px)", lineHeight: 0.96, letterSpacing: "-0.055em" }}>
                Choose Your Series
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (window.location.pathname = "/admin-login")}
            style={{
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 999,
              padding: "12px 16px",
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              color: "#1d1d1f",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 14px 32px rgba(0,0,0,0.08)",
            }}
          >
            Admin Portal
          </button>
        </header>

        <section style={{
          marginBottom: 18,
          borderRadius: 30,
          padding: "clamp(18px, 3vw, 28px)",
          background: "linear-gradient(135deg, rgba(255,255,255,0.86), rgba(255,255,255,0.58))",
          border: "1px solid rgba(255,255,255,0.78)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            inset: "-40% -20% auto auto",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,122,255,0.18), rgba(255,59,48,0.08), transparent 68%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, alignItems: "stretch" }}>
            <div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: 999,
                  padding: "8px 11px",
                  background: "rgba(0,122,255,0.12)",
                  color: "#0057d9",
                  fontWeight: 1000,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>Version 3</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: 999,
                  padding: "8px 11px",
                  background: "rgba(52,199,89,0.12)",
                  color: "#147d35",
                  fontWeight: 1000,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>BRL Rebrand</span>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  borderRadius: 999,
                  padding: "8px 11px",
                  background: "rgba(255,149,0,0.14)",
                  color: "#9a5a00",
                  fontWeight: 1000,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>Expected Downtime: ~5 Days</span>
              </div>

              <h2 style={{ margin: 0, fontSize: "clamp(27px, 4vw, 46px)", lineHeight: 0.98, letterSpacing: "-0.055em", color: "#1d1d1f" }}>
                The next generation of Budweiser Racing League is coming.
              </h2>
              <p style={{ margin: "14px 0 0", maxWidth: 760, color: "rgba(29,29,31,0.72)", fontSize: "clamp(14px, 2vw, 17px)", lineHeight: 1.55, fontWeight: 750 }}>
                Budweiser Cup League will transition to <strong>Budweiser Racing League</strong> with Version 3, a complete platform redesign built to support Cup, Xfinity, Truck, and ARCA under one seamless league experience.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 10, marginTop: 18 }}>
                {[
                  ["Unified Login", "One access point across every series."],
                  ["Enhanced View", "Apple-inspired visuals and easier navigation."],
                  ["Season 2 Contracts", "More stability for owners and drivers."],
                  ["ARCA Ready", "Fully functional before its season begins."],
                ].map(([title, text]) => (
                  <div key={title} style={{
                    borderRadius: 20,
                    padding: 14,
                    background: "rgba(255,255,255,0.64)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
                  }}>
                    <div style={{ color: "#1d1d1f", fontSize: 13, fontWeight: 1000 }}>{title}</div>
                    <div style={{ marginTop: 5, color: "rgba(29,29,31,0.62)", fontSize: 12.5, fontWeight: 750, lineHeight: 1.35 }}>{text}</div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowV3Details((current) => !current)}
                style={{
                  marginTop: 18,
                  border: "1px solid rgba(0,122,255,0.20)",
                  borderRadius: 999,
                  padding: "11px 15px",
                  background: "rgba(0,122,255,0.10)",
                  color: "#0057d9",
                  fontWeight: 1000,
                  cursor: "pointer",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.72)",
                }}
              >
                {showV3Details ? "Hide Version 3 Details" : "Read More About Version 3"}
              </button>

              {showV3Details && (
                <div style={{
                  marginTop: 16,
                  borderRadius: 24,
                  padding: "16px",
                  background: "rgba(255,255,255,0.72)",
                  border: "1px solid rgba(0,0,0,0.06)",
                  boxShadow: "0 16px 34px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.78)",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(29,29,31,0.54)", marginBottom: 8 }}>Full Update Preview</div>
                  <h3 style={{ margin: "0 0 10px", fontSize: 24, lineHeight: 1.05, letterSpacing: "-0.04em" }}>What Version 3 is designed to accomplish</h3>
                  <div style={{ display: "grid", gap: 12, color: "rgba(29,29,31,0.72)", fontWeight: 760, lineHeight: 1.5, fontSize: 14 }}>
                    <p style={{ margin: 0 }}>
                      Version 3 is more than a visual refresh. The league is being rebuilt into the <strong>Budweiser Racing League</strong>, a unified platform designed to support Cup, Xfinity, Truck, and ARCA from one connected home.
                    </p>
                    <p style={{ margin: 0 }}>
                      The redesign will focus on a cleaner Apple-inspired view, easier navigation, improved mobile support, and a seamless login experience that connects every series without forcing drivers or owners to jump between separate systems.
                    </p>
                    <p style={{ margin: 0 }}>
                      Season 2 will also include a contract and team-ownership revamp. The goal is to give owners and drivers more stability through clearer logistical requirements, smaller and more controlled budgets, stronger fund management, and a better foundation for long-term team planning.
                    </p>
                    <p style={{ margin: 0 }}>
                      The ARCA Series will be fully functional before the start of its season, including driver and owner management, contracts, race operations, HR tools, PR tools, voting, standings, race history, and team/driver pages under the same league guidelines.
                    </p>
                    <p style={{ margin: 0 }}>
                      To complete the Version 3 migration and rebrand, the platform is expected to have approximately <strong>five days of scheduled downtime</strong> while data is secured, moved, tested, and deployed.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <aside style={{
              borderRadius: 26,
              padding: 18,
              background: "linear-gradient(180deg, rgba(29,29,31,0.92), rgba(44,44,46,0.86))",
              color: "white",
              boxShadow: "0 24px 55px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 18,
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.62 }}>Platform Upgrade</div>
                <div style={{ marginTop: 8, fontSize: 30, fontWeight: 1000, letterSpacing: "-0.045em", lineHeight: 1 }}>Version 3</div>
                <p style={{ margin: "10px 0 0", color: "rgba(255,255,255,0.72)", fontSize: 13.5, lineHeight: 1.45, fontWeight: 750 }}>
                  The migration will include redesigned contracts, smaller budgets, clearer logistical requirements, and a stronger foundation for league funds.
                </p>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, fontWeight: 900 }}><span style={{ opacity: 0.65 }}>Downtime</span><span>~5 Days</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, fontWeight: 900 }}><span style={{ opacity: 0.65 }}>New Identity</span><span>BRL</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13, fontWeight: 900 }}><span style={{ opacity: 0.65 }}>ARCA Launch</span><span>Fully Supported</span></div>
              </div>
            </aside>
          </div>
        </section>

        <div style={{
          borderRadius: 30,
          padding: "18px",
          background: "rgba(255,255,255,0.52)",
          border: "1px solid rgba(255,255,255,0.72)",
          boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: 16,
          }}>
            {seriesCards.map((series) => (
              <button
                key={series.id}
                type="button"
                onClick={() => openSeries(series.route)}
                aria-label={`Open ${series.title}`}
                style={{
                  minHeight: 260,
                  border: 0,
                  borderRadius: 28,
                  padding: 0,
                  overflow: "hidden",
                  position: "relative",
                  cursor: "pointer",
                  background: "transparent",
                  boxShadow: "0 18px 42px rgba(0,0,0,0.10)",
                  transform: "translateZ(0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={series.image}
                  alt={series.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    objectFit: "contain",
                    background: "transparent",
                  }}
                />
                <span style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.30), inset 0 1px 0 rgba(255,255,255,0.45)",
                  pointerEvents: "none",
                }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    // syncCruiserNumberAndNumberOwnership();
  }, []);

  const [seasons, setSeasons] = useState([]);
  const [openAppealCount, setOpenAppealCount] = useState(0);
  const [openStoryCount, setOpenStoryCount] = useState(0);
  const [activeSeasonId, setActiveSeasonId] = useState("");
  const [tracks, setTracks] = useState(defaultRaces);
  const backupFileInputRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const loadedStateSignatureRef = useRef("");
  const saveInFlightRef = useRef(false);
  const [viewMode, setViewMode] = useState("admin");
  const [editingRaceName, setEditingRaceName] = useState(null);
  const [newSeasonName, setNewSeasonName] = useState("");
  const [renameSeasonName, setRenameSeasonName] = useState("");
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverNumber, setNewDriverNumber] = useState("");
  const [newDriverManufacturer, setNewDriverManufacturer] = useState("");
  const [newDriverTeam, setNewDriverTeam] = useState("");
  const [editingDriverId, setEditingDriverId] = useState(null);
  const [editDriverForm, setEditDriverForm] = useState({ name: "", number: "", manufacturer: "", team: "" });
  const [dnfReasons, setDnfReasons] = useState({});
  const [newTrackName, setNewTrackName] = useState("");
  const [newTrackStageCount, setNewTrackStageCount] = useState(2);
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [manualWatchPicks, setManualWatchPicks] = useState([]);
  const [ownerAssignments, setOwnerAssignments] = useState([]);
  const [selectedOwnerTeam, setSelectedOwnerTeam] = useState("");
  const [selectedOwnerDriverNumber, setSelectedOwnerDriverNumber] = useState("");
  const [ownerAssignmentMessage, setOwnerAssignmentMessage] = useState("");
  const [ownerAssignmentError, setOwnerAssignmentError] = useState("");
  const [watchDriverId, setWatchDriverId] = useState("");
  const [watchReason, setWatchReason] = useState("");
  const [watchBadge, setWatchBadge] = useState("DIRECTOR PICK");
  const [watchDisplayOrder, setWatchDisplayOrder] = useState("1");
  const [watchSaving, setWatchSaving] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [driverAccessCodes, setDriverAccessCodes] = useState([]);
  const [tickerMessages, setTickerMessages] = useState([]);
  const [tickerForm, setTickerForm] = useState({
    message: "",
    category: "NEWS",
    page: "standings",
    sort_order: "0",
    active: true,
    pinned: false,
    expires_at: "",
  });
  const [editingTickerId, setEditingTickerId] = useState(null);
  const [tickerStatus, setTickerStatus] = useState("");
  const [tickerError, setTickerError] = useState("");
  const [paintPayoutRace, setPaintPayoutRace] = useState("");
  const [paintPayoutRows, setPaintPayoutRows] = useState([]);
  const [paintPayoutStatus, setPaintPayoutStatus] = useState("");
  const [paintPayoutError, setPaintPayoutError] = useState("");
  const [paintPayoutLoading, setPaintPayoutLoading] = useState(false);
  const [paymentComplianceRows, setPaymentComplianceRows] = useState([]);
  const [paymentComplianceInterviews, setPaymentComplianceInterviews] = useState([]);
  const [paymentComplianceUploads, setPaymentComplianceUploads] = useState([]);
  const [paymentComplianceOverrides, setPaymentComplianceOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY) || "[]"); }
    catch { return []; }
  });
  const [paymentComplianceLoading, setPaymentComplianceLoading] = useState(false);
  const [paymentComplianceStatus, setPaymentComplianceStatus] = useState("");
  const [paymentComplianceError, setPaymentComplianceError] = useState("");
  const [ownerAccessCodes, setOwnerAccessCodes] = useState(() => {
    try {
      const saved = localStorage.getItem("ownerPortalAccessCodes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [discordInviteUrl, setDiscordInviteUrl] = useState(() => getDiscordSettings().inviteUrl);
  const [discordAnnouncement, setDiscordAnnouncement] = useState(() => getDiscordSettings().announcement);
  const [discordRulesText, setDiscordRulesText] = useState(() => getDiscordSettings().rulesText);
  const videoFileInputRef = useRef(null);
  const importFileRef = useRef(null);
  const rawPath = window.location.pathname;
  const path = rawPath.toLowerCase();
  const isMobileViewport = useMobileViewport(768);
  const forceDesktop = typeof document !== "undefined" && document.cookie.includes("bcl-force-desktop=1");

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const existing = document.getElementById("bcl-return-mobile-button");
    if (!isMobileViewport || !forceDesktop) {
      if (existing) existing.remove();
      return undefined;
    }

    const button = existing || document.createElement("button");
    button.id = "bcl-return-mobile-button";
    button.type = "button";
    button.textContent = "📱 Return to Mobile Version";
    button.style.position = "fixed";
    button.style.right = "12px";
    button.style.bottom = "12px";
    button.style.zIndex = "999999";
    button.style.border = "1px solid rgba(212,175,55,0.7)";
    button.style.borderRadius = "999px";
    button.style.padding = "11px 14px";
    button.style.background = "linear-gradient(135deg, #d4af37, #facc15)";
    button.style.color = "#111";
    button.style.fontWeight = "1000";
    button.style.boxShadow = "0 12px 28px rgba(0,0,0,0.35)";
    button.style.cursor = "pointer";
    button.onclick = () => {
      document.cookie = "bcl-force-desktop=; path=/; max-age=0";
      window.location.reload();
    };
    if (!existing) document.body.appendChild(button);

    return () => {
      const cleanupButton = document.getElementById("bcl-return-mobile-button");
      if (cleanupButton) cleanupButton.remove();
    };
  }, [isMobileViewport, forceDesktop]);

  // ─── Computed values (must be before all hooks) ───────────────────────────
  const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
  const withLeagueStatusWidget = (page) => (<> {page} <LeagueStatusWidget tracks={tracks} seasonName={activeSeason?.name || ""} /> </>);
  const drivers = realignLeagueDrivers(activeSeason?.drivers || []);
  const visibleDrivers = drivers.filter((d) => !isInactivePlaceholderDriver(d));
  const activeDrivers = visibleDrivers.filter((d) => !d.retired);
  const ownerPortalTeams = useMemo(() => {
    const fixedTeams = ["B2J", "19XI", "BXM", "MER", "NLM", "BWR", "MMS"];
    const liveTeams = visibleDrivers
      .map((driver) => driver.team || "Independent")
      .filter((team) => team !== "Independent" && team !== "IND");
    return Array.from(new Set([...fixedTeams, ...liveTeams]))
      .filter(Boolean)
      .sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [visibleDrivers]);
  const selectedRace = activeSeason?.selectedRace || "";
  const positions = activeSeason?.positions || {};
  const stage1 = activeSeason?.stage1 || {};
  const stage2 = activeSeason?.stage2 || {};
  const stage3 = activeSeason?.stage3 || {};
  const dnfMap = activeSeason?.dnfMap || {};
  const startParkMap = activeSeason?.startParkMap || {};
  const [startParkRequests, setStartParkRequests] = useState([]);
  const [startParkRequestStatus, setStartParkRequestStatus] = useState("");
  const [startParkRequestError, setStartParkRequestError] = useState("");
  const [startParkRequestsLoading, setStartParkRequestsLoading] = useState(false);
  const offenseMap = activeSeason?.offenseMap || {};
  const fastestLapMap = activeSeason?.fastestLapMap || {};
  const penaltyMap = activeSeason?.penaltyMap || {};
  const resultNotesMap = activeSeason?.resultNotesMap || {};
  const raceDrafts = activeSeason?.raceDrafts || [];
  const raceHistory = activeSeason?.raceHistory || [];
  const selectedRaceData = tracks.find((r) => r.name === selectedRace);
  const stageCount = selectedRaceData ? selectedRaceData.stageCount : 2;
  // ─── ALL 
  async function loadOwnerAssignments() {
    const { data, error } = await supabase
      .from("team_owner_assignments")
      .select("*")
      .order("team", { ascending: true });

    if (error) {
      console.error("Could not load team owner assignments:", error);
      setOwnerAssignmentError("Could not load owner assignments. Check the team_owner_assignments table and RLS select policy.");
      return;
    }

    setOwnerAssignments(data || []);
  }

  async function saveOwnerAssignment() {
    setOwnerAssignmentMessage("");
    setOwnerAssignmentError("");

    if (!selectedOwnerTeam || !selectedOwnerDriverNumber) {
      setOwnerAssignmentError("Select a team and an owner driver first.");
      return;
    }

    const ownerDriver = visibleDrivers.find((driver) => String(driver.number) === String(selectedOwnerDriverNumber));

    if (!ownerDriver) {
      setOwnerAssignmentError("Could not find that driver in the active roster.");
      return;
    }

    const payload = {
      team: selectedOwnerTeam,
      owner_driver_number: String(ownerDriver.number),
      owner_driver_name: ownerDriver.name || "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("team_owner_assignments")
      .upsert(payload, { onConflict: "team" });

    if (error) {
      console.error("Could not save team owner assignment:", error);
      setOwnerAssignmentError("Could not save owner assignment. Check the team_owner_assignments table and RLS upsert policy.");
      return;
    }

    setOwnerAssignmentMessage(`${ownerDriver.name} is now assigned as owner of ${getTeamFullName(selectedOwnerTeam)}.`);
    await loadOwnerAssignments();
  }


  async function loadTickerMessages() {
    setTickerError("");
    const { data, error } = await supabase
      .from("ticker_messages")
      .select("*")
      .order("pinned", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load ticker messages:", error);
      setTickerError("Could not load ticker messages. Create the ticker_messages table and check RLS policies.");
      return;
    }

    setTickerMessages(data || []);
  }

  function resetTickerForm() {
    setEditingTickerId(null);
    setTickerForm({
      message: "",
      category: "NEWS",
      page: "standings",
      sort_order: "0",
      active: true,
      pinned: false,
      expires_at: "",
    });
  }

  function editTickerMessage(item) {
    setEditingTickerId(item.id);
    setTickerForm({
      message: item.message || "",
      category: item.category || "NEWS",
      page: item.page || "standings",
      sort_order: String(item.sort_order ?? 0),
      active: item.active !== false,
      pinned: Boolean(item.pinned),
      expires_at: item.expires_at ? String(item.expires_at).slice(0, 16) : "",
    });
    setTickerStatus("");
    setTickerError("");
  }

  async function saveTickerMessage(event) {
    event?.preventDefault?.();
    setTickerStatus("");
    setTickerError("");

    if (!tickerForm.message.trim()) {
      setTickerError("Ticker message cannot be blank.");
      return;
    }

    const payload = {
      message: tickerForm.message.trim(),
      category: (tickerForm.category || "NEWS").trim().toUpperCase(),
      page: tickerForm.page || "standings",
      sort_order: Number(tickerForm.sort_order || 0),
      active: Boolean(tickerForm.active),
      pinned: Boolean(tickerForm.pinned),
      expires_at: tickerForm.expires_at ? new Date(tickerForm.expires_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (editingTickerId) {
      result = await supabase.from("ticker_messages").update(payload).eq("id", editingTickerId);
    } else {
      result = await supabase.from("ticker_messages").insert([{ ...payload, created_at: new Date().toISOString() }]);
    }

    if (result.error) {
      console.error("Could not save ticker message:", result.error);
      setTickerError("Could not save ticker message. Check ticker_messages insert/update RLS policies.");
      return;
    }

    setTickerStatus(editingTickerId ? "Ticker message updated." : "Ticker message added.");
    resetTickerForm();
    await loadTickerMessages();
  }

  async function deleteTickerMessage(id) {
    if (!window.confirm("Delete this ticker message?")) return;
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase.from("ticker_messages").delete().eq("id", id);

    if (error) {
      console.error("Could not delete ticker message:", error);
      setTickerError("Could not delete ticker message. Check ticker_messages delete RLS policy.");
      return;
    }

    setTickerStatus("Ticker message deleted.");
    await loadTickerMessages();
  }

  async function toggleTickerActive(item) {
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase
      .from("ticker_messages")
      .update({ active: item.active === false, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      console.error("Could not update ticker active state:", error);
      setTickerError("Could not update ticker message. Check ticker_messages update RLS policy.");
      return;
    }

    await loadTickerMessages();
  }

  async function toggleTickerPinned(item) {
    setTickerStatus("");
    setTickerError("");

    const { error } = await supabase
      .from("ticker_messages")
      .update({ pinned: !item.pinned, updated_at: new Date().toISOString() })
      .eq("id", item.id);

    if (error) {
      console.error("Could not update ticker pinned state:", error);
      setTickerError("Could not update ticker pin. Check ticker_messages update RLS policy.");
      return;
    }

    await loadTickerMessages();
  }

  async function seedWeeklyTickerMessages() {
    setTickerStatus("");
    setTickerError("");

    const seedItems = [
      { category: "TEAM UPDATE", message: "Current team roster cleaned up for the active season", page: "standings", sort_order: 1, active: true, pinned: true },
      { category: "TRANSACTION", message: "BigDiehl21 signs with ME Racing and moves to the No. 39 Chevrolet", page: "standings", sort_order: 2, active: true, pinned: true },
      { category: "TRANSACTION", message: "BayouX Motorsports updates KnightTrain41 to the No. 41 Ford", page: "standings", sort_order: 3, active: true, pinned: false },
      { category: "TEAM UPDATE", message: "CaJunThrottle28 moves to the No. 48 Chevrolet for BXM", page: "standings", sort_order: 4, active: true, pinned: false },
      { category: "RESULTS", message: "TheCruiser54 moves to the No. 8 BXM Chevrolet", page: "standings", sort_order: 5, active: true, pinned: false },
      { category: "RACE CONTROL", message: "Race Control Center, editable results, and penalty tools are in development", page: "standings", sort_order: 6, active: true, pinned: false },
      { category: "APP UPDATE", message: "Driver password reset support and interview sync improvements are now active", page: "standings", sort_order: 7, active: true, pinned: false },
      { category: "NEXT EVENT", message: "Pocono Raceway is up next for the Budweiser Cup League", page: "standings", sort_order: 8, active: true, pinned: false },
    ].map((item) => ({ ...item, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));

    const { error } = await supabase.from("ticker_messages").insert(seedItems);

    if (error) {
      console.error("Could not seed ticker messages:", error);
      setTickerError("Could not seed ticker messages. Check ticker_messages table and insert RLS policy.");
      return;
    }

    setTickerStatus("Weekly ticker messages added.");
    await loadTickerMessages();
  }

// useEffect hooks (must be before any early returns) ───────────────
  useEffect(() => {
    let isMounted = true;

    async function hydrateFromSupabase() {
      try {
        const savedState = await loadLeagueState();
        if (!isMounted) return;

        const normalizedState = normalizeLoadedLeagueState(savedState, patchMissingDrivers);

        if (normalizedState) {
          setSeasons(normalizedState.seasons);
          setActiveSeasonId(normalizedState.activeSeasonId);
          setTracks(normalizedState.tracks);
          loadedStateSignatureRef.current = makeLeagueStateSignature(normalizedState);
        } else {
          // Emergency only: this keeps the app usable if Supabase is empty or unreachable,
          // but it does NOT automatically write defaults back over the real saved points.
          const fallbackState = loadInitialLeagueState();
          setSeasons(fallbackState.seasons || []);
          setActiveSeasonId(fallbackState.activeSeasonId || "");
          setTracks(fallbackState.tracks || defaultRaces);
          loadedStateSignatureRef.current = makeLeagueStateSignature(fallbackState);
        }
      } catch (error) {
        console.error("Supabase load failed. Defaults were NOT saved over league points:", error);
        if (!isMounted) return;
        const fallbackState = loadInitialLeagueState();
        setSeasons(fallbackState.seasons || []);
        setActiveSeasonId(fallbackState.activeSeasonId || "");
        setTracks(fallbackState.tracks || defaultRaces);
        loadedStateSignatureRef.current = makeLeagueStateSignature(fallbackState);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }

    hydrateFromSupabase();
    return () => { isMounted = false; };
  }, []);
  useEffect(() => {
    async function loadOpenAppeals() {
      const { count, error } = await supabase
        .from("appeals")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");
      if (!error) setOpenAppealCount(count || 0);
    }
    loadOpenAppeals();
  }, []);
  useEffect(() => {
    async function loadOpenStories() {
      const { count, error } = await supabase
        .from("story_submissions")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");
      if (!error) setOpenStoryCount(count || 0);
    }
    loadOpenStories();
    const interval = setInterval(loadOpenStories, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    const normalizeSeriesJoinRequests = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("series_join_requests") || "[]");
        return (Array.isArray(saved) ? saved : [])
          .filter((request) => String(request.status || "pending").toLowerCase() === "pending")
          .map((request) => ({
            ...request,
            id: `series-${request.id}`,
            original_id: request.id,
            request_source: "series_join_requests",
            driver_name: request.username || request.gamertag || "Pending Driver",
            car_number: request.preferredNumber || request.preferred_number || "",
            team_name: request.preferredTeam || request.preferred_team || "Independent",
            manufacturer: request.manufacturer || "",
            created_at: request.submittedAt || request.submitted_at || new Date().toISOString(),
            series_name: request.seriesName || request.series_name || request.seriesId || "League",
            notes: request.notes || "",
          }));
      } catch {
        return [];
      }
    };

    async function loadPendingDrivers() {
      const localRequests = normalizeSeriesJoinRequests();
      const { data, error } = await supabase
        .from("pending_drivers")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setPendingDrivers([...localRequests, ...data]);
      } else {
        setPendingDrivers(localRequests);
      }
    }
    loadPendingDrivers();
    const interval = setInterval(loadPendingDrivers, 5000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    loadTickerMessages();
    loadPaymentComplianceData();
    loadOwnerAssignments();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const cleanTracks = sanitizeTracks(tracks);
    const needsTrackMigration = JSON.stringify(cleanTracks) !== JSON.stringify(tracks);
    if (needsTrackMigration && cleanTracks && cleanTracks.length > 0) {
      setTracks(cleanTracks);
    }
  }, [tracks, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!Array.isArray(seasons) || seasons.length === 0 || !activeSeasonId) return;

    const nextState = { seasons, activeSeasonId, tracks };
    const nextSignature = makeLeagueStateSignature(nextState);

    // This is the lock that prevents page load, refresh, failed Supabase loads,
    // or default/localStorage hydration from wiping the permanent points table.
    if (!loadedStateSignatureRef.current || nextSignature === loadedStateSignatureRef.current) return;

    const timeout = setTimeout(async () => {
      if (saveInFlightRef.current) return;
      saveInFlightRef.current = true;
      try {
        await saveLeagueState(nextState);
        loadedStateSignatureRef.current = nextSignature;
      } catch (e) {
        console.error("Supabase save failed. Existing points were not cleared:", e);
      } finally {
        saveInFlightRef.current = false;
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [seasons, activeSeasonId, tracks, isHydrated]);
  useEffect(() => {
    async function loadFeaturedVideo() {
      const { data } = await supabase
        .from("featured_video")
        .select("*")
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setFeaturedVideo(data || null);
    }
    loadFeaturedVideo();
  }, []);

  useEffect(() => {
    loadOwnerAccessCodes();
    loadDriverAccessCodes();
  }, []);

  const loadManualWatchPicks = async () => {
    const { data, error } = await supabase
      .from("ones_to_watch")
      .select("*")
      .order("active", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load ones_to_watch:", error);
      return;
    }
    setManualWatchPicks(data || []);
  };

  useEffect(() => {
    loadManualWatchPicks();
  }, []);

  useEffect(() => {
    const nextReasons = {};
    (activeSeason?.drivers || []).forEach((d) => { nextReasons[d.id] = ""; });
    setDnfReasons(nextReasons);
  }, [selectedRace, activeSeasonId]); // eslint-disable-line react-hooks/exhaustive-deps
  const replaceActiveSeason = (next) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? next : s)));
  const patchActiveSeason = (patch) => setSeasons((prev) => prev.map((s) => (s.id === activeSeasonId ? { ...s, ...patch } : s)));

  function applyOwnerPortalTeamTransaction(action = {}) {
    if (!action || !action.type) return;

    setSeasons((prev) => prev.map((season) => {
      if (season.id !== activeSeasonId) return season;

      const nextDrivers = (season.drivers || []).map((driver) => {
        const matchesDriver =
          String(driver.id || "") === String(action.driver_id || action.assign_to_driver_id || "") ||
          String(driver.number || "") === String(action.driver_number || "") ||
          String(driver.name || "").toLowerCase() === String(action.driver_name || "").toLowerCase();

        if (action.type === "driver_buyout" && matchesDriver) {
          return {
            ...driver,
            team: action.new_team || driver.team,
            manufacturer: action.new_manufacturer || driver.manufacturer,
            number: action.new_number ? Number(action.new_number) : driver.number,
            retired: false,
          };
        }

        if (action.type === "number_transfer" && String(driver.id || driver.number || "") === String(action.assign_to_driver_id || "")) {
          return {
            ...driver,
            team: action.to_team || driver.team,
            number: Number(action.number || driver.number),
            retired: false,
          };
        }

        return driver;
      });

      return { ...season, drivers: nextDrivers };
    }));
  }
  async function loadPaintSchemePayoutPreview(raceNameOverride = paintPayoutRace) {
    const raceName = raceNameOverride || getPreviousCompletedRaceForPaintWinner(tracks)?.name || selectedRace || "";
    setPaintPayoutRace(raceName);
    setPaintPayoutStatus("");
    setPaintPayoutError("");
    setPaintPayoutRows([]);

    if (!raceName) {
      setPaintPayoutError("Select a race first.");
      return [];
    }

    setPaintPayoutLoading(true);
    const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("paint_scheme_votes").select("*").eq("race_name", raceName).order("created_at", { ascending: false }),
    ]);
    setPaintPayoutLoading(false);

    if (uploadError || voteError) {
      console.error("Could not load paint scheme payout preview:", uploadError || voteError);
      setPaintPayoutError("Could not load paint scheme uploads/votes. Check car_uploads, paint_scheme_votes, and RLS policies.");
      return [];
    }

    const raceUploads = (uploadData || [])
      .filter((upload) => isPaintImageUploadForStandings(upload))
      .filter((upload) => getPaintUploadRaceForStandings(upload) === raceName);

    const counts = new Map();
    (voteData || []).forEach((vote) => {
      const key = String(vote.upload_id || vote.voted_upload_id || "");
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const deadline = getNextFridayMidnightDeadline(new Date());
    const rankedUploads = raceUploads
      .map((upload) => ({ ...upload, voteCount: counts.get(String(upload.id)) || 0 }))
      .sort((a, b) => {
        const voteDiff = Number(b.voteCount || 0) - Number(a.voteCount || 0);
        if (voteDiff !== 0) return voteDiff;
        return new Date(getPaintUploadUpdatedAt(b) || 0) - new Date(getPaintUploadUpdatedAt(a) || 0);
      });

    const ineligibleCount = rankedUploads.filter((upload) => !isPaintUploadEligibleForPayout(upload, deadline)).length;
    const rows = buildPaintSchemePayoutRows(rankedUploads, visibleDrivers, deadline, activeSeason?.paintSchemePayouts || []);
    setPaintPayoutRows(rows);
    if (!rows.length) setPaintPayoutStatus(`No eligible paint scheme uploads found for ${raceName}. Uploads must be updated by Friday at 12:00 AM ET.`);
    else if (ineligibleCount > 0) setPaintPayoutStatus(`${ineligibleCount} paint scheme upload(s) missed the Friday 12:00 AM ET deadline and were excluded from payout.`);
    return rows;
  }

  async function awardPaintSchemePayouts() {
    const raceName = paintPayoutRace || getPreviousCompletedRaceForPaintWinner(tracks)?.name || selectedRace || "";
    setPaintPayoutStatus("");
    setPaintPayoutError("");

    if (!raceName) {
      setPaintPayoutError("Select a race first.");
      return;
    }

    const alreadyPaid = (activeSeason?.paintSchemePayouts || []).some((payout) => payout.raceName === raceName);
    if (alreadyPaid) {
      setPaintPayoutError(`${raceName} has already been awarded. Remove the payout record before awarding again.`);
      return;
    }

    const rows = paintPayoutRows.length ? paintPayoutRows : await loadPaintSchemePayoutPreview(raceName);
    if (!rows.length) {
      setPaintPayoutError("No payout rows available.");
      return;
    }

    const totalTeam = rows.reduce((sum, row) => sum + Number(row.teamPayout || 0), 0);
    const totalDriver = rows.reduce((sum, row) => sum + Number(row.driverPayout || 0), 0);
    const confirmed = window.confirm(
      `Award paint scheme payouts for ${raceName}?\n\nDriver payouts: ${money(totalDriver)}\nRows: ${rows.length}`
    );
    if (!confirmed) return;

    const nextDrivers = (drivers || []).map((driver) => {
      const row = rows.find((item) =>
        String(item.driverId) === String(driver.id) ||
        String(item.driverNumber) === String(driver.number) ||
        String(item.driverName || '').trim().toLowerCase() === String(driver.name || '').trim().toLowerCase()
      );
      if (!row) return driver;
      return {
        ...driver,
        paintSchemeVotesReceived: Number(driver.paintSchemeVotesReceived || 0) + Number(row.votes || 0),
        paintSchemeSeasonVotes: Number(driver.paintSchemeSeasonVotes || 0) + Number(row.votes || 0),
        paintSchemeDriverEarnings: Number(driver.paintSchemeDriverEarnings || 0) + Number(row.driverPayout || 0),
        paintSchemeTeamEarnings: Number(driver.paintSchemeTeamEarnings || 0) + Number(row.teamPayout || 0),
        paintSchemeWins: Number(driver.paintSchemeWins || 0) + (row.rank === 1 ? 1 : 0),
        paintSchemeTop5s: Number(driver.paintSchemeTop5s || 0) + (row.rank <= 5 ? 1 : 0),
        paintSchemeTop10s: Number(driver.paintSchemeTop10s || 0) + (row.rank <= 10 ? 1 : 0),
        paintSchemeLastAwardedRace: raceName,
      };
    });

    const payoutRecord = {
      id: `paint-${Date.now()}`,
      raceName,
      awardedAt: new Date().toISOString(),
      rows,
      totalTeamPayout: totalTeam,
      totalDriverPayout: totalDriver,
      weeklyDriverPayout: PAINT_SCHEME_WEEKLY_DRIVER_PAYOUT,
      seasonDriverPayoutCap: PAINT_SCHEME_SEASON_DRIVER_PAYOUT_CAP,
      deadlineRule: "Friday 12:00 AM ET. Uploads not updated by then are not eligible for payout.",
    };

    patchActiveSeason({
      drivers: nextDrivers,
      paintSchemePayouts: [...(activeSeason?.paintSchemePayouts || []), payoutRecord],
    });

    const auditRows = rows.map((row) => ({
      race_name: raceName,
      rank: row.rank,
      upload_id: row.uploadId,
      driver_id: row.driverId,
      driver_number: String(row.driverNumber || ""),
      driver_name: row.driverName,
      team: row.team,
      votes: row.votes,
      team_payout: row.teamPayout,
      original_team_payout: row.originalTeamPayout,
      team_cap_applied: row.teamCapApplied,
      team_weekly_cap_applied: row.teamWeeklyCapApplied,
      team_season_cap_applied: row.teamSeasonCapApplied,
      team_season_paid_before_award: row.teamSeasonPaidBeforeAward,
      driver_payout: row.driverPayout,
      updated_at_deadline: row.deadline,
      upload_updated_at: row.updatedAt,
      awarded_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("paint_scheme_payouts").insert(auditRows);
    if (error) {
      console.error("Paint scheme payout audit insert failed:", error);
      setPaintPayoutStatus(`Payout applied to league state, but audit table insert failed. Check paint_scheme_payouts RLS/table.`);
      return;
    }

    setPaintPayoutStatus(`Paint scheme payouts awarded for ${raceName}. Driver total ${money(totalDriver)}.`);
  }

  const clearInputs = () => {
    patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {}, penaltyMap: {}, resultNotesMap: {} });
    setEditingRaceName(null);
  };
  const handleDownloadLeagueBackup = () => {
    const backupPayload = makeLeagueBackupPayload({
      tracks,
      seasons,
      activeSeasonId,
      reason: "manual-admin-backup",
      raceSnapshot: null,
    });

    downloadLeagueBackupFile(backupPayload, "manual-backup");
  };

  const handleRestoreLeagueBackup = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!isValidLeagueBackup(backup)) {
        alert("This backup file is missing seasons or activeSeasonId.");
        return;
      }

      const cleanTracks = sanitizeTracks(backup.tracks) || tracks;
      const cleanSeasons = backup.seasons.map((season, index) => sanitizeSeason(season, `Season ${index + 1}`));
      const activeExists = cleanSeasons.some((season) => season.id === backup.activeSeasonId);
      const nextActiveSeasonId = activeExists ? backup.activeSeasonId : cleanSeasons[0].id;

      setTracks(cleanTracks);
      setSeasons(cleanSeasons);
      setActiveSeasonId(nextActiveSeasonId);

      localStorage.setItem("bcl-last-good-tracks", JSON.stringify(cleanTracks));
      localStorage.setItem("bcl-last-good-seasons", JSON.stringify(cleanSeasons));
      localStorage.setItem("bcl-last-good-activeSeasonId", nextActiveSeasonId);

      const restoredState = {
        tracks: cleanTracks,
        seasons: cleanSeasons,
        activeSeasonId: nextActiveSeasonId,
      };

      await saveLeagueState(restoredState);
      loadedStateSignatureRef.current = makeLeagueStateSignature(restoredState);

      const ledgerSyncResult = await syncAllRaceResultsLedger({
        seasons: cleanSeasons,
        tracks: cleanTracks,
      });

      if (!ledgerSyncResult.ok) {
        alert("Backup restored, but the race_results table did not fully sync. Check the race_results table/RLS.");
      } else {
        alert("Backup restored successfully and race_results table synced. Refresh the page if the standings do not update immediately.");
      }
    } catch (error) {
      console.error("Could not restore league backup:", error);
      alert("Could not restore this backup file. Make sure it is a Budweiser Cup League JSON backup.");
    } finally {
      event.target.value = "";
    }
  };

  const resetEditorStates = () => { setEditingRaceName(null); setEditingDriverId(null); setEditDriverForm({ name: "", number: "", team: "" }); };
  const downloadBackupObject = (payload, filePrefix = "pcl-backup") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filePrefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };
  const exportBackup = () => { if (!activeSeason) return; downloadBackupObject({ app: "Budweiser Cup League", version: 2, exportedAt: new Date().toISOString(), type: "single-season-backup", season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}`); };
  const exportAllSeasonsBackup = () => downloadBackupObject({ app: "Budweiser Cup League", version: 2, exportedAt: new Date().toISOString(), type: "full-league-backup", activeSeasonId, seasons, tracks }, "pcl-all-seasons-backup");
  const createSeason = () => {
    const trimmedName = newSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }
    if (seasons.some((s) => s.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A season with that name already exists."); return; }
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
    const season = createEmptySeason(trimmedName, rosterOnly);
    setSeasons((prev) => [...prev, season]);
    setActiveSeasonId(season.id); setNewSeasonName(""); setRenameSeasonName(trimmedName); resetEditorStates();
  };
  const renameActiveSeason = () => {
    if (!activeSeason) return;
    const trimmedName = renameSeasonName.trim();
    if (!trimmedName) { alert("Please enter a season name."); return; }
    if (seasons.some((s) => s.id !== activeSeason.id && s.name.toLowerCase() === trimmedName.toLowerCase())) { alert("Another season already has that name."); return; }
    patchActiveSeason({ name: trimmedName });
  };
  const switchSeason = (seasonId) => { setActiveSeasonId(seasonId); resetEditorStates(); };
  const deleteActiveSeason = () => {
    if (!activeSeason || seasons.length <= 1) { alert("You must keep at least one season."); return; }
    if (!window.confirm(`Delete season "${activeSeason.name}"? This cannot be undone.`)) return;
    const remaining = seasons.filter((s) => s.id !== activeSeason.id);
    setSeasons(remaining); setActiveSeasonId(remaining[0].id); setRenameSeasonName(remaining[0].name); resetEditorStates();
  };
  const handleImportBackup = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (Array.isArray(parsed?.seasons)) {
          if (!window.confirm("Importing this backup will replace all current seasons. Continue?")) return;
          const cleanSeasons = parsed.seasons.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
          if (cleanSeasons.length === 0) throw new Error("No seasons in backup.");
          const nextId = cleanSeasons.some((s) => s.id === parsed.activeSeasonId) ? parsed.activeSeasonId : cleanSeasons[0].id;
          setSeasons(cleanSeasons); setActiveSeasonId(nextId);
          const cleanTracks = sanitizeTracks(parsed.tracks);
          if (cleanTracks && cleanTracks.length > 0) setTracks(cleanTracks);
          setRenameSeasonName(cleanSeasons.find((s) => s.id === nextId)?.name || cleanSeasons[0].name);
          resetEditorStates();
          syncAllRaceResultsLedger({ seasons: cleanSeasons, tracks: cleanTracks && cleanTracks.length > 0 ? cleanTracks : tracks })
            .then((result) => {
              if (!result.ok) alert("Full league backup imported, but race_results table did not fully sync.");
              else alert("Full league backup imported and race_results table synced.");
            });
        } else if (parsed?.season) {
          const imported = sanitizeSeason(parsed.season, "Imported Season");
          if (!window.confirm(`Import season "${imported.name}"?`)) return;
          setSeasons((prev) => { const exists = prev.some((s) => s.id === imported.id); return exists ? prev.map((s) => s.id === imported.id ? imported : s) : [...prev, imported]; });
          setActiveSeasonId(imported.id); setRenameSeasonName(imported.name); resetEditorStates();
          syncAllRaceResultsLedger({ seasons: [imported], tracks })
            .then((result) => {
              if (!result.ok) alert("Season backup imported, but race_results table did not fully sync.");
              else alert("Season backup imported and race_results table synced.");
            });
        } else throw new Error("Invalid backup file.");
      } catch (err) { console.error("Import failed:", err); alert("Could not import that backup file."); }
      finally { if (event.target) event.target.value = ""; }
    };
    reader.readAsText(file);
  };
  const addManualWatchPick = async () => {
    if (!watchDriverId) { alert("Select a driver for Ones to Watch."); return; }
    const selectedDriver = drivers.find((d) => Number(d.id) === Number(watchDriverId));
    if (!selectedDriver) { alert("That driver could not be found."); return; }
    setWatchSaving(true);
    const payload = {
      driver_id: Number(watchDriverId),
      reason: watchReason.trim() || "League director watch pick",
      badge: watchBadge.trim() || "DIRECTOR PICK",
      display_order: Number(watchDisplayOrder) || 1,
      active: true,
    };
    const { error } = await supabase.from("ones_to_watch").insert(payload);
    setWatchSaving(false);
    if (error) { console.error("Failed to add Ones to Watch pick:", error); alert("Could not save the Ones to Watch pick. Make sure the Supabase table exists."); return; }
    setWatchDriverId("");
    setWatchReason("");
    setWatchBadge("DIRECTOR PICK");
    setWatchDisplayOrder(String((manualWatchPicks?.length || 0) + 2));
    await loadManualWatchPicks();
  };

  const toggleManualWatchPick = async (pick) => {
    const { error } = await supabase.from("ones_to_watch").update({ active: !pick.active }).eq("id", pick.id);
    if (error) { console.error("Failed to update Ones to Watch pick:", error); alert("Could not update this pick."); return; }
    await loadManualWatchPicks();
  };

  const deleteManualWatchPick = async (pickId) => {
    if (!window.confirm("Delete this Ones to Watch pick?")) return;
    const { error } = await supabase.from("ones_to_watch").delete().eq("id", pickId);
    if (error) { console.error("Failed to delete Ones to Watch pick:", error); alert("Could not delete this pick."); return; }
    await loadManualWatchPicks();
  };

  const resetSeason = () => {
    if (!activeSeason) return;
    if (!window.confirm(`Archive and reset "${activeSeason.name}"? A backup will download first.`)) return;
    downloadBackupObject({ app: "Budweiser Cup League", version: 2, archiveType: "season-reset-archive", archivedAt: new Date().toISOString(), season: activeSeason }, `pcl-${activeSeason.name.replace(/\s+/g, "-").toLowerCase()}-archive`);
    const resetDrivers = activeSeason.drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, points: 0, wins: 0, top3: 0, top5: 0, dnfs: 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: resetDrivers, raceHistory: [], selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {} });
    resetEditorStates();
  };
  const teamStandings = useMemo(() => {
    const teams = {};
    for (const d of visibleDrivers) {
      if (!teams[d.team]) teams[d.team] = { team: d.team, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0, budget: getTeamBudget(d.team) };
      teams[d.team].budget = getTeamBudget(d.team);
      teams[d.team].points += d.points || 0; teams[d.team].wins += d.wins || 0;
      teams[d.team].top3 += d.top3 || 0; teams[d.team].top5 += d.top5 || 0; teams[d.team].drivers += 1;
    }
    return Object.values(teams).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.team.localeCompare(b.team));
  }, [visibleDrivers]);
  const manufacturerStandings = useMemo(() => {
    const mfrs = {};
    for (const d of visibleDrivers) {
      const mfr = d.manufacturer || "Unknown";
      if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      mfrs[mfr].points += d.points || 0; mfrs[mfr].wins += d.wins || 0;
      mfrs[mfr].top3 += d.top3 || 0; mfrs[mfr].top5 += d.top5 || 0; mfrs[mfr].drivers += 1;
    }
    return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.manufacturer.localeCompare(b.manufacturer));
  }, [visibleDrivers]);
  const sortedDrivers = [...visibleDrivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const currentLeader = sortedDrivers[0] || null;
  const latestRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
  const latestWinner = latestRace?.results?.find((r) => r.finishPos === 1) || null;

  const previousRaceForPayment = useMemo(() => {
    const lastPostedRace = raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
    if (!lastPostedRace) return null;
    const track = tracks.find((item) => item.name === lastPostedRace.raceName) || {};
    return { name: lastPostedRace.raceName, date: track.date || lastPostedRace.raceDate || lastPostedRace.date || lastPostedRace.postedAt || lastPostedRace.savedAt || "" };
  }, [raceHistory, tracks]);
  const upcomingRaceForPayment = useMemo(() => getUpcomingRaceByDate(tracks) || tracks[0] || null, [tracks]);
  const paymentComplianceSummary = useMemo(() => buildPaymentComplianceRows({
    teams: teamStandings,
    drivers: visibleDrivers,
    interviews: paymentComplianceInterviews,
    carUploads: paymentComplianceUploads,
    overrides: paymentComplianceOverrides,
    previousRace: previousRaceForPayment,
    upcomingRace: upcomingRaceForPayment,
  }), [teamStandings, visibleDrivers, paymentComplianceInterviews, paymentComplianceUploads, paymentComplianceOverrides, previousRaceForPayment, upcomingRaceForPayment]);
  const saveOwnerAccessCodes = (nextCodes) => {
    setOwnerAccessCodes(nextCodes);
    localStorage.setItem("ownerPortalAccessCodes", JSON.stringify(nextCodes));
  };
  const loadOwnerAccessCodes = async () => {
    const { data, error } = await supabase
      .from("owner_access_codes")
      .select("team, code, active")
      .eq("active", true);
    if (error) {
      console.error("Failed to load owner access codes:", error);
      return;
    }
    const nextCodes = {};
    (data || []).forEach((row) => { if (row.team && row.code) nextCodes[row.team] = row.code; });
    saveOwnerAccessCodes(nextCodes);
  };
  const createOwnerCode = (team) => {
    const prefix = String(team || "TEAM").replace(/[^A-Z0-9]/gi, "").toUpperCase() || "TEAM";
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${randomPart}`;
  };
  const generateOwnerCode = async (team) => {
    const newCode = createOwnerCode(team);
    const nextCodes = { ...ownerAccessCodes, [team]: newCode };
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase.from("owner_access_codes").upsert(
      { team, code: newCode, active: true, updated_at: new Date().toISOString() },
      { onConflict: "team" }
    );
    if (error) {
      console.error("Owner code Supabase save failed:", error);
      alert("Code generated on this admin browser, but Supabase save failed. Make sure the owner_access_codes table exists.");
    } else {
      alert(`Owner code generated for ${getTeamFullName(team)}: ${newCode}`);
    }
  };
  const generateAllOwnerCodes = async () => {
    const nextCodes = { ...ownerAccessCodes };
    const rows = ownerPortalTeams.map((team) => {
      const code = createOwnerCode(team);
      nextCodes[team] = code;
      return { team, code, active: true, updated_at: new Date().toISOString() };
    });
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase.from("owner_access_codes").upsert(rows, { onConflict: "team" });
    if (error) {
      console.error("Owner codes Supabase save failed:", error);
      alert("Codes generated on this admin browser, but Supabase save failed. Make sure the owner_access_codes table exists.");
    } else {
      alert("Owner codes generated for all teams.");
    }
  };
  const clearOwnerCode = async (team) => {
    const nextCodes = { ...ownerAccessCodes };
    delete nextCodes[team];
    saveOwnerAccessCodes(nextCodes);
    const { error } = await supabase
      .from("owner_access_codes")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("team", team);
    if (error) console.error("Failed to clear owner code:", error);
  };
  const copyOwnerCode = async (team) => {
    const code = ownerAccessCodes[team];
    if (!code) return;
    const message = `${getTeamFullName(team)} owner portal: go to /team-hq, select ${getTeamFullName(team)}, and use code ${code}`;
    try {
      await navigator.clipboard.writeText(message);
      alert("Owner code copied.");
    } catch {
      alert(message);
    }
  };

  const loadDriverAccessCodes = async () => {
    const { data, error } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load driver access codes:", error);
      return;
    }
    setDriverAccessCodes(data || []);
  };

  const createDriverAccessCode = (driver) => {
    const cleanName = String(driver?.name || "DRIVER").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 10) || "DRIVER";
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${cleanName}-${randomPart}`;
  };

  const generateDriverAccessCode = async (driver) => {
    if (!driver) return;
    const code = createDriverAccessCode(driver);
    const { error } = await supabase.from("driver_access_codes").upsert(
      {
        driver_number: String(driver.number),
        driver_name: driver.name,
        code,
        active: true,
        created_at: new Date().toISOString(),
      },
      { onConflict: "driver_number" }
    );
    if (error) {
      console.error("Driver access code save failed:", error);
      alert("Failed to generate driver code. Make sure driver_access_codes exists and has a unique driver_number constraint.");
      return;
    }
    await loadDriverAccessCodes();
    alert(`Driver access code generated for #${driver.number} ${driver.name}: ${code}`);
  };

  const clearDriverAccessCode = async (driver) => {
    if (!driver) return;
    const { error } = await supabase
      .from("driver_access_codes")
      .update({ active: false })
      .eq("driver_number", String(driver.number));
    if (error) {
      console.error("Failed to clear driver access code:", error);
      alert("Failed to clear driver code.");
      return;
    }
    await loadDriverAccessCodes();
  };

  const copyDriverAccessCode = async (driver, code) => {
    if (!driver || !code) return;
    const message = `Driver portal: go to /driver/${driver.number} and use code ${code}`;
    try {
      await navigator.clipboard.writeText(message);
      alert("Driver code copied.");
    } catch {
      alert(message);
    }
  };
  const handlePositionChange = (id, v) => patchActiveSeason({ positions: { ...positions, [id]: v === "" ? "" : Number(v) } });
  const handleStage1Change = (id, v) => patchActiveSeason({ stage1: { ...stage1, [id]: v === "" ? "" : Number(v) } });
  const handleStage2Change = (id, v) => patchActiveSeason({ stage2: { ...stage2, [id]: v === "" ? "" : Number(v) } });
  const handleStage3Change = (id, v) => patchActiveSeason({ stage3: { ...stage3, [id]: v === "" ? "" : Number(v) } });
  const handleDnfChange = (id, checked) => patchActiveSeason({ dnfMap: { ...dnfMap, [id]: checked } });
  const handleStartParkChange = (id, checked) => patchActiveSeason({ startParkMap: { ...startParkMap, [id]: checked } });

  async function loadStartParkRequests() {
    setStartParkRequestsLoading(true);
    const { data, error } = await supabase
      .from("start_park_requests")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Could not load Start & Park requests:", error);
      setStartParkRequestError("Could not load Start & Park requests. Run the start_park_requests SQL and check RLS select policy.");
      setStartParkRequests([]);
      setStartParkRequestsLoading(false);
      return;
    }

    setStartParkRequests(data || []);
    setStartParkRequestsLoading(false);
  }

  useEffect(() => {
    if (!isHydrated) return;
    loadStartParkRequests();
    const interval = setInterval(loadStartParkRequests, 30000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  async function updateStartParkRequestStatus(request, status) {
    setStartParkRequestStatus("");
    setStartParkRequestError("");
    if (status === "approved" && !wasStartParkRequestBeforeCutoff(request)) {
      setStartParkRequestError("This request was submitted after the Saturday 9:00 PM ET cutoff and cannot be approved.");
      return;
    }
    const patch = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "approved") patch.approved_at = new Date().toISOString();
    if (status === "declined") patch.declined_at = new Date().toISOString();

    const { error } = await supabase
      .from("start_park_requests")
      .update(patch)
      .eq("id", request.id);

    if (error) {
      console.error("Could not update Start & Park request:", error);
      setStartParkRequestError("Could not update request. Check start_park_requests update policy.");
      return;
    }

    setStartParkRequestStatus(`Start & Park request ${status}.`);
    await loadStartParkRequests();
  }

  async function applyApprovedStartParkRequestsToRace() {
    setStartParkRequestStatus("");
    setStartParkRequestError("");

    if (!selectedRace) {
      setStartParkRequestError("Select a race before applying Start & Park requests.");
      return;
    }

    const approved = (startParkRequests || [])
      .filter((request) => String(request.status || "").toLowerCase() === "approved")
      .filter((request) => String(request.race_name || "") === String(selectedRace))
      .filter((request) => wasStartParkRequestBeforeCutoff(request))
      .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    if (!approved.length) {
      setStartParkRequestError("No approved Start & Park requests are waiting for this race.");
      return;
    }

    const nextPositions = { ...positions };
    const nextStartParkMap = { ...startParkMap };
    const nextStage1 = { ...stage1 };
    const nextStage2 = { ...stage2 };
    const nextStage3 = { ...stage3 };
    const nextNotes = { ...resultNotesMap };
    const totalStarters = activeDrivers.length || 0;

    approved.forEach((request, index) => {
      const driver = activeDrivers.find((item) => String(item.id) === String(request.driver_id) || String(item.number) === String(request.driver_number));
      if (!driver) return;
      const rearPosition = Math.max(1, totalStarters - approved.length + index + 1);
      nextPositions[driver.id] = rearPosition;
      nextStartParkMap[driver.id] = true;
      nextStage1[driver.id] = "";
      nextStage2[driver.id] = "";
      nextStage3[driver.id] = "";
      const note = `Start & Park approved by Race Control. Rear order ${index + 1} of ${approved.length} by request receipt.`;
      nextNotes[driver.id] = nextNotes[driver.id] ? `${nextNotes[driver.id]} | ${note}` : note;
    });

    patchActiveSeason({
      positions: nextPositions,
      startParkMap: nextStartParkMap,
      stage1: nextStage1,
      stage2: nextStage2,
      stage3: nextStage3,
      resultNotesMap: nextNotes,
    });

    const ids = approved.map((request) => request.id).filter(Boolean);
    if (ids.length) {
      await supabase
        .from("start_park_requests")
        .update({ status: "applied", applied_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .in("id", ids);
    }

    setStartParkRequestStatus(`${approved.length} Start & Park request${approved.length === 1 ? "" : "s"} placed at the rear in order of receipt.`);
    await loadStartParkRequests();
  }

  const handleOffenseChange = (id, checked) => patchActiveSeason({ offenseMap: { ...offenseMap, [id]: checked } });
  const handleManualPenaltyChange = (id, value) => patchActiveSeason({ penaltyMap: { ...penaltyMap, [id]: value === "" ? "" : Number(value) } });
  const handleResultNoteChange = (id, value) => patchActiveSeason({ resultNotesMap: { ...resultNotesMap, [id]: value } });
  const handleFastestLapChange = (id) => patchActiveSeason({ fastestLapMap: fastestLapMap[id] ? {} : { [id]: true } });
  const moveDriverFinishPosition = (driverId, direction) => {
    const current = Number(positions[driverId] || 0);
    if (!current) return;
    const next = Math.max(1, Math.min(activeDrivers.length || 40, current + direction));
    const swappedDriver = activeDrivers.find((driver) => Number(positions[driver.id]) === next);
    const nextPositions = { ...positions, [driverId]: next };
    if (swappedDriver) nextPositions[swappedDriver.id] = current;
    patchActiveSeason({ positions: nextPositions });
  };
  const retireDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver) return;
    if (!window.confirm(`Retire ${driver.name}? They will be hidden from race entry but their stats will be preserved.`)) return;
    const updatedDrivers = drivers.map((d) => d.id === driverId ? { ...d, retired: true } : d);
    patchActiveSeason({ drivers: updatedDrivers });
    if (editingDriverId === driverId) cancelEditDriver();
  };
  const unretireDriver = (driverId) => {
    if (!activeSeason) return;
    const updatedDrivers = drivers.map((d) => d.id === driverId ? { ...d, retired: false } : d);
    patchActiveSeason({ drivers: updatedDrivers });
  };
  const addDriver = () => {
    const trimmedName = newDriverName.trim(), trimmedTeam = newDriverTeam.trim(), trimmedManufacturer = newDriverManufacturer.trim(), driverNumber = String(newDriverNumber).trim();
    if (!trimmedName || !trimmedTeam || !trimmedManufacturer || !driverNumber) { alert("Please enter driver name, number, manufacturer, and team."); return; }
    if (drivers.some((d) => d.name.toLowerCase() === trimmedName.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => String(d.number) === driverNumber)) { alert("A driver with that number already exists."); return; }
    const rosterDriver = { id: Date.now(), number: Number(driverNumber), name: trimmedName, manufacturer: trimmedManufacturer, manufacturerLogo: manufacturerLogos[trimmedManufacturer] || null, team: trimmedTeam, startingPoints: 0, manualWins: 0 };
    const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 })), rosterDriver];
    patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
    setNewDriverName(""); setNewDriverNumber(""); setNewDriverManufacturer(""); setNewDriverTeam("");
  };
  const openEditDriver = (driver) => { setEditingDriverId(driver.id); setEditDriverForm({ name: driver.name, number: driver.number, manufacturer: driver.manufacturer || "", team: driver.team }); };
  const cancelEditDriver = () => { setEditingDriverId(null); setEditDriverForm({ name: "", number: "", manufacturer: "", team: "" }); };
  const saveDriverEdit = () => {
    if (!editingDriverId || !activeSeason) return;
    const name = editDriverForm.name.trim(), number = String(editDriverForm.number).trim(), manufacturer = editDriverForm.manufacturer.trim(), team = editDriverForm.team.trim();
    if (!name || !number || !manufacturer || !team) { alert("Please enter driver name, number, manufacturer, and team."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && d.name.toLowerCase() === name.toLowerCase())) { alert("A driver with that name already exists."); return; }
    if (drivers.some((d) => d.id !== editingDriverId && String(d.number) === number)) { alert("A driver with that number already exists."); return; }
    const updatedRoster = drivers.map((d) => d.id === editingDriverId ? { ...d, name, number: Number(number), manufacturer, manufacturerLogo: manufacturerLogos[manufacturer] || null, team, startingPoints: 0, manualWins: 0 } : d);
    const updatedHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).map((r) => r.driverId === editingDriverId ? { ...r, name, number: Number(number), manufacturer, team } : r) }));
    const rosterOnly = updatedRoster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer, manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 }));
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(updatedHistory, rosterOnly), raceHistory: updatedHistory });
    cancelEditDriver();
  };
  const removeDriver = (driverId) => {
    if (!activeSeason) return;
    const driver = drivers.find((d) => d.id === driverId);
    if (!driver || !window.confirm(`Remove ${driver.name}? This will also remove their results from race history.`)) return;
    const newRoster = drivers.filter((d) => d.id !== driverId).map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0 }));
    const newHistory = raceHistory.map((race) => ({ ...race, results: (race.results || []).filter((r) => r.driverId !== driverId) }));
    const np = { ...positions }, ns1 = { ...stage1 }, ns2 = { ...stage2 }, ns3 = { ...stage3 }, nd = { ...dnfMap }, no = { ...offenseMap }, nf = { ...fastestLapMap };
    delete np[driverId]; delete ns1[driverId]; delete ns2[driverId]; delete ns3[driverId]; delete nd[driverId]; delete no[driverId]; delete nf[driverId];
    replaceActiveSeason({ ...activeSeason, drivers: rebuildDriversFromHistory(newHistory, newRoster), raceHistory: newHistory, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, offenseMap: no, fastestLapMap: nf });
    if (editingDriverId === driverId) cancelEditDriver();
  };
  const addTrack = () => {
    const name = newTrackName.trim();
    const stageCount = Number(newTrackStageCount);
    if (!name) { alert("Please enter a track name."); return; }
    if (![1, 2, 3].includes(stageCount)) { alert("Stage count must be 1, 2, or 3."); return; }
    if (tracks.some((t) => t.name.toLowerCase() === name.toLowerCase())) { alert("A track with that name already exists."); return; }
    setTracks((prev) => [...prev, { name, stageCount }]);
    setNewTrackName("");
    setNewTrackStageCount(2);
  };
  const removeTrack = (trackName) => {
    const usedInHistory = seasons.some((s) => (s.raceHistory || []).some((r) => r.raceName === trackName));
    const warning = usedInHistory
      ? `Remove "${trackName}" from the track list? It already has race history in one or more seasons — that history will be preserved, but the track won't appear in the dropdown anymore.`
      : `Remove "${trackName}" from the track list?`;
    if (!window.confirm(warning)) return;
    setTracks((prev) => prev.filter((t) => t.name !== trackName));
    if (selectedRace === trackName) {
      patchActiveSeason({ selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, startParkMap: {}, offenseMap: {}, fastestLapMap: {}, penaltyMap: {}, resultNotesMap: {} });
      setEditingRaceName(null);
    }
  };
  const approvePendingDriver = async (pendingDriver) => {
    if (!activeSeason || !pendingDriver) return;
    if (!window.confirm(`Add ${pendingDriver.driver_name} (#${pendingDriver.car_number}) to the league?`)) return;
    try {
      // Add to active season
      const newDriver = {
        id: Date.now(),
        number: pendingDriver.car_number,
        name: pendingDriver.driver_name,
        manufacturer: pendingDriver.manufacturer || "",
        manufacturerLogo: manufacturerLogos[pendingDriver.manufacturer] || null,
        team: pendingDriver.team_name,
        startingPoints: 0,
        manualWins: 0,
        retired: false,
      };
      const newRoster = [...drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", manufacturerLogo: d.manufacturerLogo || null, team: d.team, startingPoints: 0, manualWins: 0 })), newDriver];
      patchActiveSeason({ drivers: rebuildDriversFromHistory(raceHistory, newRoster) });
      // Update pending driver status to approved
      if (pendingDriver.request_source === "series_join_requests") {
        const saved = JSON.parse(localStorage.getItem("series_join_requests") || "[]");
        const updated = saved.map((request) => String(request.id) === String(pendingDriver.original_id) ? { ...request, status: "approved", reviewedAt: new Date().toISOString() } : request);
        localStorage.setItem("series_join_requests", JSON.stringify(updated));
      } else {
        await supabase
          .from("pending_drivers")
          .update({ status: "approved" })
          .eq("id", pendingDriver.id);
      }
      setPendingDrivers((prev) => prev.filter((d) => d.id !== pendingDriver.id));
      alert(`${pendingDriver.driver_name} has been added to the league!`);
    } catch (err) {
      console.error("Error approving driver:", err);
      alert("Failed to approve driver. Please try again.");
    }
  };
  const rejectPendingDriver = async (pendingDriver) => {
    if (!window.confirm(`Reject ${pendingDriver.driver_name}?`)) return;
    try {
      if (pendingDriver.request_source === "series_join_requests") {
        const saved = JSON.parse(localStorage.getItem("series_join_requests") || "[]");
        const updated = saved.map((request) => String(request.id) === String(pendingDriver.original_id) ? { ...request, status: "rejected", reviewedAt: new Date().toISOString() } : request);
        localStorage.setItem("series_join_requests", JSON.stringify(updated));
      } else {
        await supabase
          .from("pending_drivers")
          .update({ status: "rejected" })
          .eq("id", pendingDriver.id);
      }
      setPendingDrivers((prev) => prev.filter((d) => d.id !== pendingDriver.id));
    } catch (err) {
      console.error("Error rejecting driver:", err);
    }
  };
  const updateTrackStageCount = (trackName, newCount) => {
    const stages = Number(newCount);
    if (![1, 2, 3].includes(stages)) return;
    setTracks((prev) => prev.map((t) => t.name === trackName ? { ...t, stageCount: stages } : t));
  };
  const restoreDefaultTracks = () => {
    if (!window.confirm("Restore the default 17-track schedule? Any custom tracks you've added will be removed (race history is preserved).")) return;
    setTracks(defaultRaces);
  };
  const seasonOffenseCounts = useMemo(() => {
    const counts = {};
    drivers.forEach((d) => { counts[d.id] = countPriorOffenses(raceHistory, d.id, editingRaceName); });
    return counts;
  }, [raceHistory, drivers, editingRaceName]);
  const buildRaceResultsFromCurrentInputs = () => {
    return drivers.map((driver) => {
      const finishPos = positions[driver.id];
      const stage1Pos = stage1[driver.id], stage2Pos = stage2[driver.id], stage3Pos = stage3[driver.id];
      const dnf = !!dnfMap[driver.id];
      const startPark = !!startParkMap[driver.id];
      const fastestLap = !!fastestLapMap[driver.id];
      const offense = !!offenseMap[driver.id];
      const manualPenaltyPoints = Number(penaltyMap[driver.id] || 0);
      const finishPoints = finishPos && finishPos >= 1 && finishPos <= pointsTable.length ? pointsTable[finishPos - 1] : 0;
      const stage1Points = startPark ? 0 : getStagePoints(stage1Pos), stage2Points = startPark ? 0 : getStagePoints(stage2Pos);
      const stage3Points = startPark ? 0 : (stageCount === 3 ? getStagePoints(stage3Pos) : 0);
      const fastestLapPoints = fastestLap ? 1 : 0;
      const priorOffenses = countPriorOffenses(raceHistory, driver.id, editingRaceName);
      const offenseNumber = offense ? priorOffenses + 1 : 0;
      const offensePenalty = offense ? getOffensePenaltyPoints(offenseNumber) : 0;
      const penaltyPoints = offensePenalty + manualPenaltyPoints;
      const totalRacePoints = finishPoints + stage1Points + stage2Points + stage3Points + fastestLapPoints - penaltyPoints;
      return {
        driverId: driver.id, name: driver.name, number: driver.number, team: driver.team, manufacturer: driver.manufacturer || "",
        finishPos: finishPos || null, stage1Pos: stage1Pos || null, stage2Pos: stage2Pos || null, stage3Pos: stageCount === 3 ? stage3Pos || null : null,
        finishPoints, stage1Points, stage2Points, stage3Points, fastestLap, fastestLapPoints,
        offense, offenseNumber, offensePenalty, manualPenaltyPoints, penaltyPoints, totalRacePoints,
        isWin: finishPos === 1, isTop3: finishPos >= 1 && finishPos <= 3, isTop5: finishPos >= 1 && finishPos <= 5,
        dnf, startPark, dnfReason: dnf ? (dnfReasons[driver.id] || "Unknown") : null,
        notes: resultNotesMap[driver.id] || "",
      };
    }).sort((a, b) => { if (a.finishPos === null) return 1; if (b.finishPos === null) return -1; return a.finishPos - b.finishPos; });
  };

  const buildRaceFromCurrentInputs = () => ({
    raceName: selectedRace,
    stageCount,
    results: buildRaceResultsFromCurrentInputs(),
    savedAt: new Date().toISOString(),
  });

  const saveResultsDraft = () => {
    if (!activeSeason) return;
    if (!selectedRace.trim()) { alert("Please select a race before saving a draft."); return; }
    const draft = {
      ...buildRaceFromCurrentInputs(),
      id: `draft-${selectedRace.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Date.now()}`,
      status: "Draft",
      draftSavedAt: new Date().toISOString(),
      posted: false,
    };
    const nextDrafts = [draft, ...(raceDrafts || []).filter((item) => item.raceName !== selectedRace)];
    patchActiveSeason({ raceDrafts: nextDrafts });
    alert("Admin-only results draft saved. Standings were not updated.");
  };

  const loadResultsDraft = (draft) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, spm = {}, no = {}, nf = {}, nr = {}, pm = {}, notes = {};
    (draft.results || []).forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; spm[r.driverId] = !!r.startPark; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
      if (r.dnfReason) nr[r.driverId] = r.dnfReason;
      if (r.manualPenaltyPoints) pm[r.driverId] = r.manualPenaltyPoints;
      if (r.notes) notes[r.driverId] = r.notes;
    });
    setDnfReasons(nr);
    patchActiveSeason({ selectedRace: draft.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, startParkMap: spm, offenseMap: no, fastestLapMap: nf, penaltyMap: pm, resultNotesMap: notes });
    setEditingRaceName(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteResultsDraft = (draftId) => {
    if (!activeSeason || !window.confirm("Delete this admin-only results draft?")) return;
    patchActiveSeason({ raceDrafts: (raceDrafts || []).filter((draft) => draft.id !== draftId) });
  };

  const postResultsDraft = async (draft) => {
    if (!draft) return;
    loadResultsDraft(draft);
    setTimeout(() => submitResults(draft), 0);
  };

  const submitResults = async (draftOverride = null) => {
    if (!activeSeason) return;
    const raceToPost = draftOverride || buildRaceFromCurrentInputs();
    if (!raceToPost.raceName.trim()) { alert("Please select a race."); return; }
    if (raceHistory.some((r) => r.raceName === raceToPost.raceName && editingRaceName !== raceToPost.raceName)) { alert("That race has already been entered."); return; }
    const updatedRace = {
      ...raceToPost,
      status: "Posted",
      postedAt: new Date().toISOString(),
      savedAt: new Date().toISOString(),
    };
    const newHistory = editingRaceName ? raceHistory.map((r) => r.raceName === editingRaceName ? updatedRace : r) : [...raceHistory, updatedRace];
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
    const rebuiltDrivers = rebuildDriversFromHistory(newHistory, rosterOnly);
    const updatedSeason = {
      ...activeSeason,
      raceHistory: newHistory,
      raceDrafts: (raceDrafts || []).filter((draft) => draft.id !== draftOverride?.id && draft.raceName !== updatedRace.raceName),
      drivers: rebuiltDrivers,
      selectedRace: "",
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      offenseMap: {},
      fastestLapMap: {},
      penaltyMap: {},
      resultNotesMap: {},
    };

    const updatedSeasons = seasons.map((season) => (season.id === activeSeasonId ? updatedSeason : season));

    replaceActiveSeason(updatedSeason);

    const automaticBackupPayload = makeLeagueBackupPayload({
      tracks,
      seasons: updatedSeasons,
      activeSeasonId,
      reason: editingRaceName ? "automatic-edit-race-results" : "automatic-post-race-results",
      raceSnapshot: updatedRace,
    });

    downloadLeagueBackupFile(automaticBackupPayload, editingRaceName ? "auto-edit-race-results" : "auto-post-race-results");

    const backupResult = await createRaceDataBackup({
      seasonSnapshot: updatedSeason,
      raceSnapshot: updatedRace,
      backupType: editingRaceName ? "edit-race-save-points" : "post-points-to-standings",
    });

    const ledgerResult = await saveRaceResultsLedger({
      season: updatedSeason,
      race: updatedRace,
      tracks,
    });

    if (!backupResult.ok && !ledgerResult.ok) {
      alert("Race points posted locally and a JSON backup downloaded, but Supabase backup AND race_results ledger failed. Check race_data_backups and race_results tables/RLS.");
    } else if (!backupResult.ok) {
      alert("Race points posted and race_results ledger updated, but the Supabase JSON backup failed. Check race_data_backups table/RLS.");
    } else if (!ledgerResult.ok) {
      alert("Race points posted and a JSON backup downloaded, but race_results ledger failed. Check race_results table/RLS.");
    } else {
      alert("Race results posted to standings.");
    }

    setEditingRaceName(null);
  };
  const handleEditRace = (race) => {
    const np = {}, ns1 = {}, ns2 = {}, ns3 = {}, nd = {}, spm = {}, no = {}, nf = {}, nr = {}, pm = {}, notes = {};
    race.results.forEach((r) => {
      np[r.driverId] = r.finishPos || ""; ns1[r.driverId] = r.stage1Pos || ""; ns2[r.driverId] = r.stage2Pos || ""; ns3[r.driverId] = r.stage3Pos || "";
      nd[r.driverId] = !!r.dnf; spm[r.driverId] = !!r.startPark; no[r.driverId] = !!r.offense;
      if (r.fastestLap) nf[r.driverId] = true;
      if (r.dnfReason) nr[r.driverId] = r.dnfReason;
      if (r.manualPenaltyPoints) pm[r.driverId] = r.manualPenaltyPoints;
      if (r.notes) notes[r.driverId] = r.notes;
    });
    setDnfReasons(nr);
    patchActiveSeason({ selectedRace: race.raceName, positions: np, stage1: ns1, stage2: ns2, stage3: ns3, dnfMap: nd, startParkMap: spm, offenseMap: no, fastestLapMap: nf, penaltyMap: pm, resultNotesMap: notes });
    setEditingRaceName(race.raceName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDeleteRace = (raceName) => {
    if (!activeSeason || !window.confirm(`Delete ${raceName}? This will recalculate the standings.`)) return;
    const newHistory = raceHistory.filter((r) => r.raceName !== raceName);
    const rosterOnly = drivers.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: 0, manualWins: 0, retired: d.retired || false }));
    replaceActiveSeason({ ...activeSeason, raceHistory: newHistory, drivers: rebuildDriversFromHistory(newHistory, rosterOnly) });
    if (editingRaceName === raceName) clearInputs();
  };
  const offenseLog = raceHistory.flatMap((race) =>
    race.results.filter((r) => r.offense).map((r) => ({ raceName: race.raceName, number: r.number, name: r.name, offenseNumber: r.offenseNumber, penaltyPoints: r.penaltyPoints }))
  );
  const saveDiscordSettings = () => {
    const cleanUrl = discordInviteUrl.trim() || DEFAULT_DISCORD_INVITE_URL;
    const settings = {
      inviteUrl: cleanUrl,
      announcement: discordAnnouncement.trim() || "Join the Budweiser Cup League Discord for race control, media, team rooms, and league updates.",
      rulesText: discordRulesText.trim() || DEFAULT_DISCORD_RULES.join("\n"),
    };
    localStorage.setItem("bcl-discord-settings", JSON.stringify(settings));
    setDiscordInviteUrl(settings.inviteUrl);
    setDiscordAnnouncement(settings.announcement);
    setDiscordRulesText(settings.rulesText);
    alert("Discord settings saved.");
  };

  async function exportAppDataJson() {
    const tablesToExport = [
      "league_state",
      "race_results",
      "race_data_backups",
      "interviews",
      "driver_access_codes",
      "team_owner_assignments",
      "team_finances",
      "contract_offers",
      "technical_alliances",
      "owner_tasks",
      "driver_tasks",
      "paint_scheme_votes",
      "start_park_requests",
      "streams",
      "ticker_messages",
      "app_update_banners",
      "league_messages",
      "appeals",
      "story_submissions",
      "memorial_day_tributes",
    ];

    const exportPayload = {
      exportVersion: 1,
      appVersion: APP_VERSION,
      appName: "Budweiser Cup League",
      exportedAt: new Date().toISOString(),
      purpose: "Accurate interview, media, standings, and league storyline context",
      activeSeasonId,
      activeSeasonName: activeSeason?.name || "",
      localState: {
        tracks,
        seasons,
        activeSeasonId,
        activeSeason,
        drivers: visibleDrivers,
        teamStandings,
        manufacturerStandings,
        raceHistory,
        selectedRace,
        ownerAssignments,
      },
      supabaseTables: {},
    };

    for (const table of tablesToExport) {
      try {
        const { data, error } = await supabase.from(table).select("*");

        if (error) {
          exportPayload.supabaseTables[table] = {
            ok: false,
            error: error.message,
            rows: [],
          };
        } else {
          exportPayload.supabaseTables[table] = {
            ok: true,
            count: Array.isArray(data) ? data.length : 0,
            rows: data || [],
          };
        }
      } catch (error) {
        exportPayload.supabaseTables[table] = {
          ok: false,
          error: error?.message || String(error),
          rows: [],
        };
      }
    }

    const dateStamp = new Date().toISOString().replace(/[:.]/g, "-");
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `budweiser-cup-app-export-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function loadPaymentComplianceData() {
    setPaymentComplianceLoading(true);
    setPaymentComplianceError("");
    setPaymentComplianceStatus("");

    // Do not order in Supabase here because some league tables use submitted_at instead of created_at.
    // We pull rows first, then sort in the browser using every supported timestamp field.
    const [{ data: interviewsData, error: interviewsError }, { data: uploadData, error: uploadError }, { data: overrideData, error: overrideError }] = await Promise.all([
      supabase.from("interviews").select("*"),
      supabase.from("car_uploads").select("*"),
      supabase.from("team_payment_overrides").select("*"),
    ]);

    if (interviewsError || uploadError) {
      console.error("Could not load payment compliance data:", interviewsError || uploadError);
      setPaymentComplianceError("Could not load interviews or paint uploads. Check interviews/car_uploads select policies.");
    }

    if (overrideError) {
      console.warn("Could not load team_payment_overrides; using local browser overrides instead.", overrideError);
    } else {
      setPaymentComplianceOverrides(overrideData || []);
      localStorage.setItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY, JSON.stringify(overrideData || []));
    }

    const sortNewest = (rows = []) => (Array.isArray(rows) ? rows : [])
      .filter((row) => row && typeof row === "object")
      .sort((a, b) => new Date(getPaymentTimestamp(b) || 0) - new Date(getPaymentTimestamp(a) || 0));

    setPaymentComplianceInterviews(sortNewest(interviewsData));
    setPaymentComplianceUploads(sortNewest(uploadData));
    setPaymentComplianceLoading(false);
    setPaymentComplianceStatus("Payment compliance tracker refreshed.");
  }

  async function savePaymentComplianceOverride(row, status) {
    const cleanStatus = status === "approved" || status === "denied" ? status : "";
    const payload = {
      team_key: row.teamKey,
      team_name: row.teamName,
      period_key: row.paymentPeriodKey,
      previous_race: row.previousRaceName || null,
      upcoming_race: row.upcomingRaceName || null,
      override_status: cleanStatus,
      override_reason: cleanStatus ? `Admin ${cleanStatus} payment override` : "Override cleared",
      updated_at: new Date().toISOString(),
    };

    const nextLocal = [payload, ...(paymentComplianceOverrides || []).filter((item) => !(String(item.team_key || item.team) === String(row.teamKey) && String(item.period_key || item.periodKey) === String(row.paymentPeriodKey)))].filter((item) => item.override_status);
    setPaymentComplianceOverrides(nextLocal);
    localStorage.setItem(PAYMENT_COMPLIANCE_OVERRIDE_KEY, JSON.stringify(nextLocal));

    if (!cleanStatus) {
      const { error } = await supabase
        .from("team_payment_overrides")
        .delete()
        .eq("team_key", row.teamKey)
        .eq("period_key", row.paymentPeriodKey);
      if (error) console.warn("Could not clear override from Supabase; local override was cleared.", error);
      setPaymentComplianceStatus(`Payment override cleared for ${row.teamName}.`);
      return;
    }

    const { error } = await supabase
      .from("team_payment_overrides")
      .upsert(payload, { onConflict: "team_key,period_key" });

    if (error) {
      console.warn("Could not save override to Supabase; saved locally in this browser.", error);
      setPaymentComplianceStatus(`Payment override saved locally for ${row.teamName}. Create/check team_payment_overrides to sync it.`);
      return;
    }

    setPaymentComplianceStatus(`Payment override saved for ${row.teamName}.`);
  }

  function PaymentCompliancePanel({ mode = "admin" }) {
    const rows = paymentComplianceSummary || [];
    const allMet = rows.length > 0 && rows.every((row) => row.finalEligible);
    const isAdminMode = mode === "admin";
    const qualifiedCount = rows.filter((row) => row.finalEligible).length;
    const needsReviewCount = Math.max(rows.length - qualifiedCount, 0);

    const applePanelStyle = {
      background: "linear-gradient(180deg, #f5f5f7 0%, #ffffff 72%)",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 30,
      padding: 22,
      color: "#1d1d1f",
      boxShadow: "0 22px 55px rgba(15, 23, 42, 0.10)",
    };

    const appleMetricStyle = {
      background: "rgba(255,255,255,0.88)",
      border: "1px solid rgba(0,0,0,0.07)",
      borderRadius: 22,
      padding: 16,
      boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
    };

    const applePill = (active, label) => (
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 11px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 1000,
        letterSpacing: 0.2,
        color: active ? "#0f6b2f" : "#9f1239",
        background: active ? "rgba(52,199,89,0.16)" : "rgba(255,59,48,0.12)",
        border: active ? "1px solid rgba(52,199,89,0.28)" : "1px solid rgba(255,59,48,0.22)",
      }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: active ? "#34c759" : "#ff3b30" }} />
        {label}
      </span>
    );

    const deadlineChip = (label, value) => (
      <div style={{
        background: "#f2f2f7",
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 16,
        padding: "10px 12px",
        minWidth: 145,
      }}>
        <div style={{ fontSize: 11, fontWeight: 1000, color: "#6e6e73", textTransform: "uppercase", letterSpacing: 0.7 }}>{label}</div>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 850, color: "#1d1d1f" }}>{formatPaymentTimestamp(value)}</div>
      </div>
    );

    const checkLine = (label, met, timestamp) => (
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "7px 0", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ color: "#6e6e73", fontSize: 12, fontWeight: 900 }}>{label}</div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: met ? "#0f6b2f" : "#b42318", fontSize: 12, fontWeight: 1000 }}>{met ? "MET" : "MISSED"}</div>
          <div style={{ color: "#6e6e73", fontSize: 11, fontWeight: 750 }}>{formatPaymentTimestamp(timestamp)}</div>
        </div>
      </div>
    );

    return (
      <div style={applePanelStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 1000, color: "#6e6e73", letterSpacing: 1.4, textTransform: "uppercase" }}>Finance Department</div>
            <h2 style={{ margin: "4px 0 0", fontSize: 30, letterSpacing: -1.1, color: "#1d1d1f" }}>Team Payment Compliance</h2>
            <p style={{ margin: "8px 0 0", color: "#6e6e73", lineHeight: 1.5, fontWeight: 750, maxWidth: 820 }}>
              Apple Wallet-style compliance cards for team payouts. Paint schemes and previous-race post interviews are due Wednesday at 11:59 PM ET. Upcoming-race pre interviews are due Saturday at 8:30 PM ET.
            </p>
          </div>
          <button type="button" onClick={loadPaymentComplianceData} style={{
            border: 0,
            borderRadius: 999,
            padding: "12px 16px",
            background: "#007aff",
            color: "white",
            fontWeight: 1000,
            boxShadow: "0 10px 22px rgba(0,122,255,0.24)",
            cursor: "pointer",
          }} disabled={paymentComplianceLoading}>
            {paymentComplianceLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
          <div style={appleMetricStyle}>
            <div style={{ color: "#6e6e73", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.9 }}>Previous Race</div>
            <div style={{ marginTop: 7, fontSize: 19, fontWeight: 1000, color: "#1d1d1f" }}>{previousRaceForPayment?.name || "—"}</div>
          </div>
          <div style={appleMetricStyle}>
            <div style={{ color: "#6e6e73", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.9 }}>Upcoming Race</div>
            <div style={{ marginTop: 7, fontSize: 19, fontWeight: 1000, color: "#1d1d1f" }}>{upcomingRaceForPayment?.name || "—"}</div>
          </div>
          <div style={appleMetricStyle}>
            <div style={{ color: "#6e6e73", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.9 }}>Qualified Teams</div>
            <div style={{ marginTop: 7, fontSize: 24, fontWeight: 1000, color: allMet ? "#0f6b2f" : "#1d1d1f" }}>{qualifiedCount} / {rows.length}</div>
          </div>
          <div style={appleMetricStyle}>
            <div style={{ color: "#6e6e73", fontSize: 12, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.9 }}>Needs Review</div>
            <div style={{ marginTop: 7, fontSize: 24, fontWeight: 1000, color: needsReviewCount ? "#b42318" : "#0f6b2f" }}>{needsReviewCount}</div>
          </div>
        </div>

        {paymentComplianceStatus && <div style={{ background: "rgba(52,199,89,0.13)", color: "#0f6b2f", borderRadius: 16, padding: 12, marginTop: 14, fontWeight: 900 }}>{paymentComplianceStatus}</div>}
        {paymentComplianceError && <div style={{ background: "rgba(255,59,48,0.11)", color: "#b42318", borderRadius: 16, padding: 12, marginTop: 14, fontWeight: 900 }}>{paymentComplianceError}</div>}

        <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
          {rows.length === 0 ? (
            <div style={{ ...appleMetricStyle, gridColumn: "1 / -1", color: "#6e6e73", fontWeight: 850 }}>
              No team compliance data loaded yet. Click Refresh.
            </div>
          ) : rows.map((row, index) => (
            <div key={row.teamKey} style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "0 18px 38px rgba(15,23,42,0.08)",
            }}>
              <div style={{
                minHeight: 118,
                padding: 18,
                color: "white",
                background: row.finalEligible
                  ? "linear-gradient(135deg, #1c1c1e, #34c759)"
                  : index % 2 === 0
                    ? "linear-gradient(135deg, #1c1c1e, #ff3b30)"
                    : "linear-gradient(135deg, #2c2c2e, #ff9500)",
                position: "relative",
              }}>
                <div style={{ position: "absolute", right: -35, top: -35, width: 125, height: 125, borderRadius: 999, background: "rgba(255,255,255,0.13)" }} />
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, position: "relative" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.78, letterSpacing: 1.2, textTransform: "uppercase" }}>Team Wallet</div>
                    <div style={{ marginTop: 5, fontSize: 22, fontWeight: 1000, letterSpacing: -0.4 }}>{row.teamName}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, fontWeight: 1000, opacity: 0.8 }}>Final Status</div>
                    <div style={{ marginTop: 5, fontSize: 14, fontWeight: 1000 }}>{row.finalEligible ? "QUALIFIED" : "NOT QUALIFIED"}</div>
                  </div>
                </div>
                {row.overrideStatus && (
                  <div style={{ marginTop: 15, display: "inline-flex", borderRadius: 999, background: "rgba(255,255,255,0.18)", padding: "7px 10px", fontSize: 12, fontWeight: 1000, position: "relative" }}>
                    Admin Override: {row.overrideStatus.toUpperCase()}
                  </div>
                )}
              </div>

              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  {applePill(row.finalEligible, row.finalEligible ? "Pay Approved" : "Payment Hold")}
                  {applePill(row.driverChecks?.every((check) => check.paintMet), "Paint")}
                  {applePill(row.driverChecks?.every((check) => check.postMet), "Post")}
                  {applePill(row.driverChecks?.every((check) => check.preMet), "Pre")}
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 13 }}>
                  {deadlineChip("Paint Due", row.paintDeadlineIso)}
                  {deadlineChip("Post Due", row.postDeadlineIso)}
                  {deadlineChip("Pre Due", row.preDeadlineIso)}
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  {(row.driverChecks || []).map((check) => (
                    <details key={check.driver.id} style={{
                      background: "#f5f5f7",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 18,
                      padding: "10px 12px",
                    }}>
                      <summary style={{ cursor: "pointer", fontWeight: 1000, color: "#1d1d1f" }}>#{check.driver.number} {check.driver.name}</summary>
                      <div style={{ marginTop: 8 }}>
                        {checkLine("Paint Scheme", check.paintMet, check.paintAt)}
                        {checkLine("Post Interview", check.postMet, check.postAt)}
                        {checkLine("Pre Interview", check.preMet, check.preAt)}
                      </div>
                    </details>
                  ))}
                </div>

                {isAdminMode && (
                  <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
                    <button type="button" onClick={() => savePaymentComplianceOverride(row, "approved")} style={{ border: 0, borderRadius: 999, padding: "10px 13px", background: "#34c759", color: "white", fontWeight: 1000, cursor: "pointer" }}>Approve Pay</button>
                    <button type="button" onClick={() => savePaymentComplianceOverride(row, "denied")} style={{ border: 0, borderRadius: 999, padding: "10px 13px", background: "#ff3b30", color: "white", fontWeight: 1000, cursor: "pointer" }}>Deny Pay</button>
                    <button type="button" onClick={() => savePaymentComplianceOverride(row, "")} style={{ border: "1px solid rgba(0,0,0,0.10)", borderRadius: 999, padding: "10px 13px", background: "white", color: "#1d1d1f", fontWeight: 1000, cursor: "pointer" }}>Clear</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const adminProtectedPaths = new Set(["/admin", "/appeals", "/admin/stories", "/stories", "/admin/live-control", "/admin/car-gallery", "/admin/interviews", "/admin/votes"]);
  const isAdminProtectedPath = adminProtectedPaths.has(path);
  const isAdminAuthenticated = sessionStorage.getItem("bcl-admin-auth") === "true";
  const logoutAdmin = () => {
    sessionStorage.removeItem("bcl-admin-auth");
    sessionStorage.removeItem("bcl-admin-auth-time");
    localStorage.removeItem("bcl-admin-auth");
    localStorage.removeItem("bcl-admin-auth-time");
    window.location.pathname = "/standings";
  };

  if (path === "/admin-login") {
    if (isAdminAuthenticated) {
      window.history.replaceState({}, "", "/admin");
      return null;
    }
    return <AdminLoginPage />;
  }
  if (isAdminProtectedPath && !isAdminAuthenticated) return <AdminLoginPage />;

  // Series Portal - new opening page for Cup, Xfinity, Trucks, and ARCA.
  // Existing Cup standings remain available at /standings.
  if (path === "/" || path === "/series") {
    return <AppleSeriesPortalLanding />;
  }

  // Mobile experience gate — phones use the NASCAR-style mobile shell for all non-admin / non-overlay routes.
  // Desktop routes below stay unchanged. Mobile routes render real app data in a phone-friendly shell.
  const mobileExcludedPaths = path.startsWith("/admin") || path.startsWith("/overlay") || path.startsWith("/series") || path === "/bracket";
  if (isMobileViewport && !forceDesktop && !mobileExcludedPaths) {
    if (!isHydrated) {
      return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading mobile league data...</div></div></div>;
    }

    return (
      <MobileLeagueApp
        path={path}
        rawPath={rawPath}
        drivers={visibleDrivers}
        teams={teamStandings}
        manufacturerStandings={manufacturerStandings}
        seasonName={activeSeason?.name || ""}
        tracks={tracks}
        raceHistory={raceHistory}
        seasons={seasons}
        activeSeason={activeSeason}
        activeSeasonId={activeSeasonId}
        paymentCompliance={paymentComplianceSummary}
        onApplyTeamTransaction={applyOwnerPortalTeamTransaction}
      />
    );
  }

  // Static desktop pages
  if (path === "/files") return <FilesPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/submit-story") return <SubmitStoryPage />;
  if (path === "/appeals") return <AppealsPage />;
  if (path === "/admin/stories" || path === "/stories") return <StoriesAdminPage />;
  if (path === "/admin/live-control") {
  return <LiveControlPanel />;
}
  if (path === "/streams" || path === "/stream") {
  // Build next race from the schedule date and roll after 10:00 PM Eastern on race day.
  const sortedTracks = getSortedTracksByDate(tracks || []);
  const nextRace = getUpcomingRaceByDate(sortedTracks);

  // Track helper (uses your existing trackOverviewData)
  function getTrackOverview(race) {
    if (!race) return null;
    return trackOverviewData[race.name] || trackOverviewData[race.track] || null;
  }

  return (
    <StreamPage
      drivers={drivers}
      teams={teamStandings}
      manufacturers={manufacturerStandings}
      activeRace={nextRace}
      selectedTrack={getTrackOverview(nextRace)}
    />
  );
}
  if (path === "/news") return withLeagueStatusWidget(<NewsPage />);
  if (path === "/paint-scheme-vote") return withLeagueStatusWidget(<PaintSchemeVotePage drivers={visibleDrivers} tracks={tracks} />);
  if (path === "/vote" || path === "/league-vote" || path === "/voting") return <LeagueVotingPage drivers={visibleDrivers} />;
  if (path === "/notifications") return withLeagueStatusWidget(<NotificationsPage />);
  if ((!isMobileViewport || forceDesktop) && path === "/discord") return <DiscordPage />;
  if ((!isMobileViewport || forceDesktop) && path === "/interviews") return <PublicInterviewsPage />;
  if ((!isMobileViewport || forceDesktop) && path === "/driver-feedback") {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Driver Feedback Moved</h2>
            <div style={{ opacity: 0.75, lineHeight: 1.6 }}>
              Driver feedback now lives inside each protected driver profile so only the driver can submit morale ratings.
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={{ ...primaryButtonStyle, marginTop: 16 }}>
              Back to Standings
            </button>
          </div>
        </div>
      </div>
    );
  }
  // Loading gate — all routes below this need Supabase data
  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;

  // Development series pages. These do not remove any existing Cup routes.
  if (path.startsWith("/series/") && path.endsWith("/join")) {
    const seriesId = decodeURIComponent(rawPath.split("/")[2] || "cup").toLowerCase();
    return (
      <SeriesJoinPage
        seriesId={seriesId}
        drivers={visibleDrivers}
        teams={teamStandings}
      />
    );
  }

  if (path.startsWith("/series/")) {
    const seriesId = decodeURIComponent(rawPath.split("/")[2] || "cup").toLowerCase();
    return (
      <SeriesLandingPage
        seriesId={seriesId}
        drivers={visibleDrivers}
        teams={teamStandings}
        raceHistory={raceHistory}
        driverAccessCodes={driverAccessCodes}
      />
    );
  }

  if (path === "/admin/car-gallery") {
    return (
      <CarGalleryPage
        drivers={drivers}
        tracks={tracks}
        enableDownload={true}
      />
    );
  }
  if (path === "/admin/interviews") return <InterviewsPage drivers={drivers} tracks={tracks} seasons={seasons} activeSeasonId={activeSeasonId} />;
  if (path === "/admin/votes") return <AdminVotingPage drivers={visibleDrivers} />;
  // Team detail page
  if (path.startsWith("/team/")) {
    const abbr = decodeURIComponent(rawPath.replace(/^\/team\//i, "").split("/")[0]);
    const normalizedTeam = String(abbr || "").toLowerCase();
    const selectedTeamDrivers = visibleDrivers.filter(
      (d) => String(d.team || "").toLowerCase() === normalizedTeam
    );
    const selectedTeamStanding = teamStandings.find(
      (t) => String(t.team || "").toLowerCase() === normalizedTeam
    ) || null;

    return (
      <TeamDetailPage
        key={`team-${abbr}-${activeSeasonId}-${raceHistory.length}-${selectedTeamStanding?.points || 0}`}
        drivers={visibleDrivers}
        teamDrivers={selectedTeamDrivers}
        teams={teamStandings}
        teamStandings={teamStandings}
        standings={teamStandings}
        selectedStanding={selectedTeamStanding}
        team={selectedTeamStanding}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        initialTeam={abbr}
        selectedTeam={abbr}
      />
    );
  }

  // Manufacturer detail page
  if (path.startsWith("/manufacturer/")) {
    const mfrName = decodeURIComponent(
      rawPath.replace(/^\/manufacturer\//i, "").split("/")[0]
    );
    const normalizedManufacturer = String(mfrName || "").toLowerCase();
    const selectedManufacturerDrivers = visibleDrivers.filter(
      (d) => String(d.manufacturer || "").toLowerCase() === normalizedManufacturer
    );
    const selectedManufacturerStanding = manufacturerStandings.find(
      (m) => String(m.manufacturer || "").toLowerCase() === normalizedManufacturer
    ) || null;

    return (
      <ManufacturerDetailPage
        key={`manufacturer-${mfrName}-${activeSeasonId}-${raceHistory.length}-${selectedManufacturerStanding?.points || 0}`}
        drivers={visibleDrivers}
        manufacturerDrivers={selectedManufacturerDrivers}
        manufacturers={manufacturerStandings}
        manufacturerStandings={manufacturerStandings}
        standings={manufacturerStandings}
        selectedStanding={selectedManufacturerStanding}
        manufacturer={selectedManufacturerStanding}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        initialManufacturer={mfrName}
        selectedManufacturer={mfrName}
      />
    );
  }
  if (path.startsWith("/driver/")) {
    return (
      <>
        <div style={{ minHeight: 0, background: "#0c0f14", padding: "20px 20px 0" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <AppUpdateBanner page="driver" />
          </div>
        </div>
        <DriverVoteReminderStrip driverNumber={decodeURIComponent(rawPath.replace(/^\/driver\//i, "").split("/")[0])} />
        <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />
      </>
    );
  }
  if (["/owners", "/owner", "/team-hq", "/hq", "/teamhq"].includes(path)) return (
    <>
      <OwnersPage
        drivers={visibleDrivers}
        teams={teamStandings}
        teamBudgets={teamBudgets}
        raceHistory={raceHistory}
        seasonName={activeSeason?.name || ""}
        tracks={tracks}
        paymentCompliance={paymentComplianceSummary}
        onApplyTeamTransaction={applyOwnerPortalTeamTransaction}
      />
      <div style={{ ...appShellStyle, padding: "0 20px 20px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto" }}>
          <PaymentCompliancePanel mode="team" />
        </div>
      </div>
    </>
  );
  if (path === "/contracts") return withLeagueStatusWidget(<ContractsPage drivers={visibleDrivers} />);
  if (path === "/memorial-day") return withLeagueStatusWidget(<MemorialDayPage drivers={visibleDrivers} />);

  if (path === "/chat") return withLeagueStatusWidget(<LeagueChatPage drivers={visibleDrivers} />);
  if (path === "/message-center") return withLeagueStatusWidget(<LeagueMessageCenter drivers={visibleDrivers} />);
  if (path === "/driver-market" || path === "/transfer-portal" || path === "/silly-season") return withLeagueStatusWidget(<DriverMarketPage drivers={visibleDrivers || []} raceHistory={raceHistory || []} startParkRequests={startParkRequests || []} paintSchemePayouts={[]} />);
  if (path === "/development-requests" || path === "/developmental-requests" || path === "/dev-requests") return withLeagueStatusWidget(
    <DevelopmentRequestsPage
      leagueState={{ drivers: visibleDrivers || [], teams: teamStandings || [] }}
      currentUser={{
        role: isAdminAuthenticated ? "admin" : "guest",
        isAdmin: isAdminAuthenticated,
        series: isAdminAuthenticated ? "cup" : "guest",
      }}
      isAdmin={isAdminAuthenticated}
      supabase={supabase}
      go={(to) => { window.location.href = to; }}
    />
  );
  if (path === "/tournament" || path === "/in-season-tournament" || path === "/in-season-bracket" || path === "/bracket") {
    return withLeagueStatusWidget(
      <InSeasonTournamentPage drivers={visibleDrivers} raceHistory={raceHistory} />
    );
  }
  if (path === "/standings") return withLeagueStatusWidget(<StandingsPage drivers={visibleDrivers} teams={teamStandings} manufacturerStandings={manufacturerStandings} seasonName={activeSeason?.name || ""} tracks={tracks} raceHistory={raceHistory} />);
  if (path === "/overlay/ticker" || viewMode === "overlay-ticker") return <TickerOverlay drivers={visibleDrivers} teams={teamStandings} raceHistory={raceHistory} preview={viewMode === "overlay-ticker"} seasonName={activeSeason?.name || ""} />;
  if (path !== "/admin") {
    return <StandingsPage drivers={visibleDrivers} teams={teamStandings} manufacturerStandings={manufacturerStandings} seasonName={activeSeason?.name || ""} tracks={tracks} raceHistory={raceHistory} />;
  }
  return (
    <AdminPortal
      AdminLeagueMessageComposer={AdminLeagueMessageComposer}
      AdminLeagueMessageDashboard={AdminLeagueMessageDashboard}
      PaymentCompliancePanel={PaymentCompliancePanel}
      PreviousRaceWinnerAdminPanel={PreviousRaceWinnerAdminPanel}
      activeDrivers={activeDrivers}
      activeHeaderButtonStyle={activeHeaderButtonStyle}
      activeSeason={activeSeason}
      activeSeasonId={activeSeasonId}
      addDriver={addDriver}
      addManualWatchPick={addManualWatchPick}
      addTrack={addTrack}
      appShellStyle={appShellStyle}
      applyApprovedStartParkRequestsToRace={applyApprovedStartParkRequestsToRace}
      approvePendingDriver={approvePendingDriver}
      awardPaintSchemePayouts={awardPaintSchemePayouts}
      backupFileInputRef={backupFileInputRef}
      cancelEditDriver={cancelEditDriver}
      clearDriverAccessCode={clearDriverAccessCode}
      clearInputs={clearInputs}
      clearOwnerCode={clearOwnerCode}
      copyDriverAccessCode={copyDriverAccessCode}
      copyOwnerCode={copyOwnerCode}
      createSeason={createSeason}
      currentLeader={currentLeader}
      dangerButtonStyle={dangerButtonStyle}
      deleteActiveSeason={deleteActiveSeason}
      deleteManualWatchPick={deleteManualWatchPick}
      deleteResultsDraft={deleteResultsDraft}
      deleteTickerMessage={deleteTickerMessage}
      discordAnnouncement={discordAnnouncement}
      discordInviteUrl={discordInviteUrl}
      discordRulesText={discordRulesText}
      dnfMap={dnfMap}
      dnfReasons={dnfReasons}
      downloadRaceHistoryCsv={downloadRaceHistoryCsv}
      driverAccessCodes={driverAccessCodes}
      drivers={drivers}
      editDriverForm={editDriverForm}
      editTickerMessage={editTickerMessage}
      editingDriverId={editingDriverId}
      editingRaceName={editingRaceName}
      editingTickerId={editingTickerId}
      exportAllSeasonsBackup={exportAllSeasonsBackup}
      exportAppDataJson={exportAppDataJson}
      exportBackup={exportBackup}
      fastestLapMap={fastestLapMap}
      featuredVideo={featuredVideo}
      generateAllOwnerCodes={generateAllOwnerCodes}
      generateDriverAccessCode={generateDriverAccessCode}
      generateOwnerCode={generateOwnerCode}
      getOffensePenaltyPoints={getOffensePenaltyPoints}
      getStagePoints={getStagePoints}
      getTeamFullName={getTeamFullName}
      handleDeleteRace={handleDeleteRace}
      handleDnfChange={handleDnfChange}
      handleDownloadLeagueBackup={handleDownloadLeagueBackup}
      handleEditRace={handleEditRace}
      handleFastestLapChange={handleFastestLapChange}
      handleImportBackup={handleImportBackup}
      handleManualPenaltyChange={handleManualPenaltyChange}
      handleOffenseChange={handleOffenseChange}
      handlePositionChange={handlePositionChange}
      handleRestoreLeagueBackup={handleRestoreLeagueBackup}
      handleResultNoteChange={handleResultNoteChange}
      handleStage1Change={handleStage1Change}
      handleStage2Change={handleStage2Change}
      handleStage3Change={handleStage3Change}
      handleStartParkChange={handleStartParkChange}
      headerButtonStyle={headerButtonStyle}
      importFileRef={importFileRef}
      inputStyle={inputStyle}
      isInactivePlaceholderDriver={isInactivePlaceholderDriver}
      latestWinner={latestWinner}
      loadDriverAccessCodes={loadDriverAccessCodes}
      loadManualWatchPicks={loadManualWatchPicks}
      loadPaintSchemePayoutPreview={loadPaintSchemePayoutPreview}
      loadResultsDraft={loadResultsDraft}
      loadStartParkRequests={loadStartParkRequests}
      loadTickerMessages={loadTickerMessages}
      logo={logo}
      logoutAdmin={logoutAdmin}
      manualWatchPicks={manualWatchPicks}
      manufacturerStandings={manufacturerStandings}
      money={money}
      moveDriverFinishPosition={moveDriverFinishPosition}
      newDriverManufacturer={newDriverManufacturer}
      newDriverName={newDriverName}
      newDriverNumber={newDriverNumber}
      newDriverTeam={newDriverTeam}
      newSeasonName={newSeasonName}
      newTrackName={newTrackName}
      newTrackStageCount={newTrackStageCount}
      offenseLog={offenseLog}
      offenseMap={offenseMap}
      openAppealCount={openAppealCount}
      openEditDriver={openEditDriver}
      openStoryCount={openStoryCount}
      ownerAccessCodes={ownerAccessCodes}
      ownerAssignmentError={ownerAssignmentError}
      ownerAssignmentMessage={ownerAssignmentMessage}
      ownerAssignments={ownerAssignments}
      ownerPortalTeams={ownerPortalTeams}
      pageContainerStyle={pageContainerStyle}
      paintPayoutError={paintPayoutError}
      paintPayoutLoading={paintPayoutLoading}
      paintPayoutRace={paintPayoutRace}
      paintPayoutRows={paintPayoutRows}
      paintPayoutStatus={paintPayoutStatus}
      patchActiveSeason={patchActiveSeason}
      penaltyMap={penaltyMap}
      pendingDrivers={pendingDrivers}
      pointsTable={pointsTable}
      positions={positions}
      postResultsDraft={postResultsDraft}
      primaryButtonStyle={primaryButtonStyle}
      raceDrafts={raceDrafts}
      raceEntryTdStyle={raceEntryTdStyle}
      raceEntryThStyle={raceEntryThStyle}
      raceHistory={raceHistory}
      raceNotesInputStyle={raceNotesInputStyle}
      racePenaltyInputStyle={racePenaltyInputStyle}
      racePositionInputStyle={racePositionInputStyle}
      rejectPendingDriver={rejectPendingDriver}
      removeDriver={removeDriver}
      removeTrack={removeTrack}
      renameActiveSeason={renameActiveSeason}
      renameSeasonName={renameSeasonName}
      resetSeason={resetSeason}
      resetTickerForm={resetTickerForm}
      restoreDefaultTracks={restoreDefaultTracks}
      resultNotesMap={resultNotesMap}
      retireDriver={retireDriver}
      saveDiscordSettings={saveDiscordSettings}
      saveDriverEdit={saveDriverEdit}
      saveOwnerAssignment={saveOwnerAssignment}
      saveResultsDraft={saveResultsDraft}
      saveTickerMessage={saveTickerMessage}
      seasonOffenseCounts={seasonOffenseCounts}
      seasons={seasons}
      secondaryButtonStyle={secondaryButtonStyle}
      sectionCardStyle={sectionCardStyle}
      seedWeeklyTickerMessages={seedWeeklyTickerMessages}
      selectedOwnerDriverNumber={selectedOwnerDriverNumber}
      selectedOwnerTeam={selectedOwnerTeam}
      selectedRace={selectedRace}
      setDiscordAnnouncement={setDiscordAnnouncement}
      setDiscordInviteUrl={setDiscordInviteUrl}
      setDiscordRulesText={setDiscordRulesText}
      setDnfReasons={setDnfReasons}
      setEditDriverForm={setEditDriverForm}
      setFeaturedVideo={setFeaturedVideo}
      setNewDriverManufacturer={setNewDriverManufacturer}
      setNewDriverName={setNewDriverName}
      setNewDriverNumber={setNewDriverNumber}
      setNewDriverTeam={setNewDriverTeam}
      setNewSeasonName={setNewSeasonName}
      setNewTrackName={setNewTrackName}
      setNewTrackStageCount={setNewTrackStageCount}
      setPaintPayoutRace={setPaintPayoutRace}
      setRenameSeasonName={setRenameSeasonName}
      setSelectedOwnerDriverNumber={setSelectedOwnerDriverNumber}
      setSelectedOwnerTeam={setSelectedOwnerTeam}
      setTickerForm={setTickerForm}
      setVideoDescription={setVideoDescription}
      setVideoTitle={setVideoTitle}
      setVideoUploading={setVideoUploading}
      setViewMode={setViewMode}
      setWatchBadge={setWatchBadge}
      setWatchDisplayOrder={setWatchDisplayOrder}
      setWatchDriverId={setWatchDriverId}
      setWatchReason={setWatchReason}
      sortedDrivers={sortedDrivers}
      stage1={stage1}
      stage2={stage2}
      stage3={stage3}
      stageCount={stageCount}
      startParkMap={startParkMap}
      startParkRequestError={startParkRequestError}
      startParkRequestStatus={startParkRequestStatus}
      startParkRequests={startParkRequests}
      startParkRequestsLoading={startParkRequestsLoading}
      statBoxStyle={statBoxStyle}
      submitResults={submitResults}
      supabase={supabase}
      switchSeason={switchSeason}
      tableStyle={tableStyle}
      tdStyle={tdStyle}
      teamStandings={teamStandings}
      thStyle={thStyle}
      tickerError={tickerError}
      tickerForm={tickerForm}
      tickerMessages={tickerMessages}
      tickerStatus={tickerStatus}
      toggleManualWatchPick={toggleManualWatchPick}
      toggleTickerActive={toggleTickerActive}
      toggleTickerPinned={toggleTickerPinned}
      tracks={tracks}
      unretireDriver={unretireDriver}
      updateStartParkRequestStatus={updateStartParkRequestStatus}
      updateTrackStageCount={updateTrackStageCount}
      videoDescription={videoDescription}
      videoFileInputRef={videoFileInputRef}
      videoTitle={videoTitle}
      videoUploading={videoUploading}
      viewMode={viewMode}
      visibleDrivers={visibleDrivers}
      watchBadge={watchBadge}
      watchDisplayOrder={watchDisplayOrder}
      watchDriverId={watchDriverId}
      watchReason={watchReason}
      watchSaving={watchSaving}
    />
  );}

