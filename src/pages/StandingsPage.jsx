import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { getLeagueSession, loginToLeague, logoutOfLeague, isBiometricAvailable, hasAnyDriverBiometricCredential, hasBiometricCredentialForDriver, registerDriverBiometric, loginWithBiometric } from "../lib/leagueAuth";
import logo from "../assets/logo1.png";
import ncsLogo from "../assets/series/NCS.png";
import arcaLogo from "../assets/series/AMS.png";
import {
  supabase } from "../lib/supabase"; import { teamLogos,
  manufacturerLogos,
  getTeamFullName,
  getTeamBranding } from "../data/teams"; import { trackOverviewData } from "../data/trackOverview"; import { dedupeDriversByNumber,
  isInactivePlaceholderDriver } from "../utils/driverHelpers"; import {   getUpcomingRaceByDate,
  getSortedTracksByDate,
  isRaceCompleteByDateOrHistory,
  normalizeTrackName,
  } from "../utils/raceHelpers"; import {   appShellStyle,
  pageContainerStyle,
  thStyle,
  tdStyle,
  sectionCardStyle,
} from "../styles/sharedStyles";

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

function renderManufacturerLogo(manufacturer, size = 72) {
  const name = String(manufacturer || "Unknown").trim();
  const logoSrc =
    manufacturerLogos?.[name] ||
    manufacturerLogos?.[name.toLowerCase()] ||
    manufacturerLogos?.[name.toUpperCase()];
  const colorMap = { Toyota: "#ef4444", Chevrolet: "#f59e0b", Ford: "#2563eb" };
  const color = colorMap[name] || "#6366f1";

  if (logoSrc) {
    return (
      <div
        style={{
          width: size,
          height: size,
          minWidth: size,
          borderRadius: 30,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(15,23,42,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 14,
          boxShadow: "0 18px 38px rgba(15,23,42,0.10)",
        }}
      >
        <img
          src={logoSrc}
          alt={`${name} logo`}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 24,
        background: `${color}18`,
        color,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 1000,
        fontSize: Math.max(18, size * 0.22),
        boxShadow: "0 14px 30px rgba(15,23,42,0.08)",
      }}
    >
      {name.slice(0, 3).toUpperCase()}
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



function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function downloadCsv(filename, rows = []) {
  if (!rows.length) return;
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function StandingsPage({ seriesId = "cup", drivers = [], teams = [], manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [], arcaDrivers = [], arcaRaceHistory = [], driverAccessCodes = [], supabase = null }) {
  const [standingsTab, setStandingsTab] = useState(seriesId === "arca" ? "arca-drivers" : "drivers");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [manualOnesToWatch, setManualOnesToWatch] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1200));
  const [arcaStandings, setArcaStandings] = useState([]);
  const [arcaTeamStandings, setArcaTeamStandings] = useState([]);
  const [arcaLoading, setArcaLoading] = useState(false);
  const [showInterviewsOverlay, setShowInterviewsOverlay] = useState(false);
  const [leagueSession, setLeagueSession] = useState(() => getLeagueSession());
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      setShowLoginModal(true);
    }
  }, []);

  function getPostLoginRedirect() {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("redirect");
  }

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 760;
  const isTablet = viewportWidth >= 760 && viewportWidth < 1040;

  function handleLeagueLogout() {
    logoutOfLeague();
    setLeagueSession(null);
  }

  const handleDriverClick = (number) => {
    window.location.pathname = `/driver/${number}`;
  };

  useEffect(() => {
    async function loadFeaturedVideo() {
      const { data } = await supabase
        .from("featured_video")
        .select("*")
        .eq("series", seriesId)
        .order("uploaded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setFeaturedVideo(data || null);
    }
    loadFeaturedVideo();
  }, [seriesId]);

  useEffect(() => {
    let isMounted = true;
    async function loadManualOnesToWatch() {
      const { data, error } = await supabase
        .from("ones_to_watch")
        .select("*")
        .eq("active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (!error) setManualOnesToWatch(data || []);
    }
    loadManualOnesToWatch();
    const interval = setInterval(loadManualOnesToWatch, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load ARCA Standings
  useEffect(() => {
    async function loadArcaStandings() {
      try {
        setArcaLoading(true);
        const { data: activeSeasonData } = await supabase
          .from("arca_seasons")
          .select("id")
          .eq("active", true)
          .single();

        if (!activeSeasonData) {
          setArcaLoading(false);
          return;
        }

        const { data: standings } = await supabase
          .from("arca_standings")
          .select("*")
          .eq("season_id", activeSeasonData.id)
          .order("points", { ascending: false });

        setArcaStandings(standings || []);

        // Calculate team standings
        const teamMap = {};
        (standings || []).forEach((driver) => {
          if (!teamMap[driver.team]) {
            teamMap[driver.team] = {
              team: driver.team,
              points: 0,
              wins: 0,
              top5: 0,
              drivers: [],
            };
          }
          teamMap[driver.team].points += driver.points || 0;
          teamMap[driver.team].wins += driver.wins || 0;
          teamMap[driver.team].top5 += driver.top5 || 0;
          teamMap[driver.team].drivers.push(driver);
        });

        const teams = Object.values(teamMap).sort((a, b) => b.points - a.points);
        setArcaTeamStandings(teams);
      } catch (err) {
        console.error("Error loading ARCA standings:", err);
      } finally {
        setArcaLoading(false);
      }
    }

    if (seriesId !== "arca") {
      loadArcaStandings();
    } else {
      // For ARCA, use the drivers prop we received from App.jsx
      setArcaStandings(drivers || []);
      
      // Calculate team standings from drivers
      const teamMap = {};
      (drivers || []).forEach((driver) => {
        if (!teamMap[driver.team]) {
          teamMap[driver.team] = {
            team: driver.team,
            points: 0,
            wins: 0,
            top5: 0,
            drivers: [],
          };
        }
        teamMap[driver.team].points += driver.points || 0;
        teamMap[driver.team].wins += driver.wins || 0;
        teamMap[driver.team].top5 += driver.top5 || 0;
        teamMap[driver.team].drivers.push(driver);
      });
      
      const teams = Object.values(teamMap).sort((a, b) => b.points - a.points);
      setArcaTeamStandings(teams);
    }
  }, [seriesId, drivers]);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !isInactivePlaceholderDriver(driver))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  }, [drivers]);

  const sorted = activeDrivers;

  const sortedArcaStandings = useMemo(() => {
    return [...(arcaStandings || [])].sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0) || (b.top5 || 0) - (a.top5 || 0));
  }, [arcaStandings]);
  const [leader, second, third] = sorted;
  const totalPoints = sorted.reduce((sum, driver) => sum + Number(driver.points || 0), 0);
  const totalWins = sorted.reduce((sum, driver) => sum + Number(driver.wins || 0), 0);
  const totalDnfs = sorted.reduce((sum, driver) => sum + Number(driver.dnfs || 0), 0);
  const completedRaces = new Set((raceHistory || []).map((race) => race.raceName));
  const sortedTracks = getSortedTracksByDate(tracks || []);
  const nextRace = getUpcomingRaceByDate(sortedTracks);
  const completedRaceCount = (raceHistory || []).length;
  const latestRace = (raceHistory || [])[Math.max(0, (raceHistory || []).length - 1)] || null;
  const latestWinner = latestRace?.results?.find((result) => Number(result.finishPos || result.finish || result.position) === 1 || result.isWin) || null;

  // ARCA last winner - ONLY from ARCA race history
  const arcaLatestRace = (arcaRaceHistory || [])[Math.max(0, (arcaRaceHistory || []).length - 1)] || null;
  const arcaLatestWinner = arcaLatestRace && arcaLatestRace.results ? arcaLatestRace.results.find((result) => Number(result.finishPos) === 1) : null;

  const teamRows = useMemo(() => {
    const sourceTeams = Array.isArray(teams) ? teams : [];
    return [...sourceTeams].sort((a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0));
  }, [teams]);

  const manufacturerRows = useMemo(() => {
    if (Array.isArray(manufacturerStandings) && manufacturerStandings.length > 0) {
      return [...manufacturerStandings].sort((a, b) => (b.points || 0) - (a.points || 0) || String(a.manufacturer || "").localeCompare(String(b.manufacturer || "")));
    }
    const mfrs = {};
    (drivers || []).forEach((driver) => {
      const mfr = driver.manufacturer || "Unknown";
      if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
      mfrs[mfr].points += Number(driver.points || 0);
      mfrs[mfr].wins += Number(driver.wins || 0);
      mfrs[mfr].top3 += Number(driver.top3 || 0);
      mfrs[mfr].top5 += Number(driver.top5 || 0);
      mfrs[mfr].drivers += 1;
    });
    return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || a.manufacturer.localeCompare(b.manufacturer));
  }, [manufacturerStandings, drivers]);

  const autoOnesToWatch = sorted
    .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
    .map((driver) => {
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((entry) => entry.driverId === driver.id);
          if (!result) return null;
          const finish = Number(result.finishPos || result.finish || result.position || 99);
          return { raceName: race.raceName, finish, dnf: !!result.dnf };
        })
        .filter(Boolean);

      const avgFinish = recentResults.length
        ? recentResults.reduce((sum, result) => sum + result.finish, 0) / recentResults.length
        : 99;
      const latestFinish = recentResults.length ? recentResults[recentResults.length - 1].finish : null;
      const recentTop5s = recentResults.filter((result) => result.finish <= 5).length;
      const recentDnfs = recentResults.filter((result) => result.dnf).length;
      const standingsRank = sorted.findIndex((item) => item.id === driver.id) + 1 || 99;

      const watchScore =
        Number(driver.points || 0) +
        Number(driver.wins || 0) * 35 +
        Number(driver.top3 || 0) * 12 +
        Number(driver.top5 || 0) * 7 +
        recentTop5s * 18 +
        Math.max(0, 25 - avgFinish) * 4 -
        recentDnfs * 15 -
        standingsRank * 2;

      let reason = "Building momentum";
      if (driver.wins > 0) reason = "Race-winning threat";
      else if (recentTop5s >= 2) reason = "Hot over the last 3 races";
      else if (avgFinish <= 6) reason = "Consistent front-runner";
      else if (standingsRank > 8 && recentTop5s >= 1) reason = "Underdog moving forward";
      else if ((driver.top5 || 0) > 0) reason = "Top-5 speed showing";

      return { ...driver, avgFinish, latestFinish, recentTop5s, standingsRank, watchScore, reason };
    })
    .sort((a, b) => b.watchScore - a.watchScore)
    .slice(0, 5);

  const manualWatchDrivers = manualOnesToWatch
    .map((pick) => {
      const driver = (drivers || []).find((item) => Number(item.id) === Number(pick.driver_id));
      if (!driver) return null;
      const standingsRank = sorted.findIndex((item) => item.id === driver.id) + 1;
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((entry) => entry.driverId === driver.id);
          if (!result) return null;
          const finish = Number(result.finishPos || result.finish || result.position || 99);
          return { finish, dnf: !!result.dnf };
        })
        .filter(Boolean);
      const avgFinish = recentResults.length ? recentResults.reduce((sum, result) => sum + result.finish, 0) / recentResults.length : 99;
      const latestFinish = recentResults.length ? recentResults[recentResults.length - 1].finish : null;
      return {
        ...driver,
        reason: pick.reason || "League director watch pick",
        watchBadge: pick.badge || "DIRECTOR PICK",
        standingsRank: standingsRank > 0 ? standingsRank : "—",
        latestFinish,
        avgFinish,
        isManualWatchPick: true,
      };
    })
    .filter(Boolean)
    .slice(0, 5);

  const onesToWatch = manualWatchDrivers.length > 0 ? manualWatchDrivers : autoOnesToWatch;
  const onesToWatchMode = manualWatchDrivers.length > 0 ? "DIRECTOR PICKS" : "LIVE PERFORMANCE WATCH";

  const getTrackOverview = (trackName) => {
    const rawName = String(trackName || "").trim();
    const cleanName = rawName.replace(/^Preseason - /i, "").trim();
    return trackOverviewData[rawName] || trackOverviewData[cleanName] || {
      name: rawName || "Track",
      location: "—",
      type: "Track data not added yet",
      length: "—",
      turns: "—",
      banking: "—",
      pitSpeed: "—",
      restartZone: "—",
      tireWear: "—",
      notes: "Add this track to trackOverviewData.",
      raceTip: "No iRacing recommendation has been added for this track yet.",
      imageUrl: "",
    };
  };

  const applePage = {
    minHeight: "100vh",
    background: "radial-gradient(circle at 10% 0%, rgba(0,122,255,0.16), transparent 28%), radial-gradient(circle at 82% 8%, rgba(255,149,0,0.15), transparent 26%), radial-gradient(circle at 50% 0%, rgba(88,86,214,0.10), transparent 36%), #f5f5f7",
    color: "#1d1d1f",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
  };

  const container = {
    maxWidth: 1440,
    margin: "0 auto",
    padding: isMobile ? "12px 10px 34px" : "22px clamp(14px, 2vw, 28px) 50px",
  };

  const glassCard = {
    background: "rgba(255,255,255,0.88)",
    border: "1px solid rgba(255,255,255,0.92)",
    borderRadius: 30,
    boxShadow: "0 24px 70px rgba(15,23,42,0.10)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
  };

  const pillButton = {
    border: "1px solid rgba(15,23,42,0.08)",
    background: "rgba(255,255,255,0.74)",
    color: "#1d1d1f",
    borderRadius: 999,
    padding: "11px 15px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
  };

  const publicMessageIconButtonStyle = {
    width: isMobile ? 44 : 50,
    height: isMobile ? 44 : 50,
    borderRadius: isMobile ? 14 : 16,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "linear-gradient(180deg, #007aff 0%, #5856d6 100%)",
    color: "#ffffff",
    boxShadow: "0 16px 38px rgba(0,122,255,0.26)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    position: "relative",
    fontSize: 20,
    fontWeight: 1000,
  };

  const publicMenuButtonStyle = {
    width: isMobile ? 44 : 50,
    height: isMobile ? 44 : 50,
    borderRadius: isMobile ? 14 : 16,
    border: "1px solid rgba(17,24,39,0.10)",
    background: "rgba(255,255,255,0.92)",
    boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    cursor: "pointer",
    position: "relative",
    zIndex: 100002,
  };

  const publicMenuLineStyle = {
    width: 22,
    height: 2,
    borderRadius: 999,
    background: "#111827",
  };

  const publicMenuBackdropStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 2147483000,
    background: "rgba(15,23,42,0.22)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const publicMenuPanelStyle = {
    position: "fixed",
    right: isMobile ? 10 : 24,
    top: isMobile ? 78 : 96,
    zIndex: 2147483001,
    width: isMobile ? "calc(100vw - 20px)" : "min(360px, calc(100vw - 48px))",
    background: "rgba(255,255,255,0.98)",
    border: "1px solid rgba(17,24,39,0.10)",
    borderRadius: 24,
    boxShadow: "0 28px 80px rgba(15,23,42,0.30)",
    padding: 12,
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
  };

  const navItems = [
    { label: "Streams", subtitle: "Live broadcasts", icon: "📡", route: "/streams" },
    { label: "News", subtitle: "League stories", icon: "📰", route: "/news" },
    { label: "Interviews", subtitle: "Driver media", icon: "🎤", route: seriesId === "arca" ? "/series/arca/interviews" : "/interviews" },
    { label: "Paint Scheme Vote", subtitle: "Weekly fan voting", icon: "🎨", route: "/paint-scheme-vote" },
    { label: "In-Season Bracket", subtitle: "Tournament hub", icon: "🏆", route: "/bracket" },
    { label: "League Vote", subtitle: "Polls and ballots", icon: "🗳️", route: "/vote" },
    { label: "Team HQ", subtitle: "Owner workspace", icon: "🏢", route: "/team-hq" },
    { label: "Active Contracts", subtitle: "Current agreements", icon: "📄", route: "/contracts" },
    { label: "Add Story", subtitle: "Submit content", icon: "✍️", route: "/submit-story" },
    { label: "Notifications", subtitle: "Public alerts", icon: "🔔", route: "/notifications" },
    { label: "League Chat", subtitle: "Community room", icon: "💬", route: "/chat" },
    { label: "Admin Portal", subtitle: "League control", icon: "🔐", route: "/admin" },
  ];

  const filteredNavItems = seriesId === "arca" ? navItems.filter(item => item.route === "/admin" || item.label === "Interviews" || item.label === "Team HQ") : navItems;

  const StatCard = ({ icon, label, value, detail, onClick, accent = "#007aff", tint = "rgba(0,122,255,0.12)" }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...glassCard,
        textAlign: "left",
        padding: isMobile ? 14 : 18,
        minHeight: isMobile ? 112 : 132,
        background: `linear-gradient(135deg, ${tint}, rgba(255,255,255,0.94))`,
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        transition: "transform 180ms ease, box-shadow 180ms ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 16, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 10px 24px ${accent}33` }}>
          {icon}
        </div>
        {onClick && <div style={{ opacity: 0.38, fontWeight: 900 }}>›</div>}
      </div>
      <div style={{ marginTop: isMobile ? 12 : 16, fontSize: 11, fontWeight: 950, letterSpacing: 1.1, color: "#4b5563", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: isMobile ? 20 : 24, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.5, color: "#111827" }}>{value || "—"}</div>
      {detail && <div style={{ marginTop: 6, fontSize: 13, color: "#374151", fontWeight: 750 }}>{detail}</div>}
    </button>
  );

  const DriverRow = ({ driver, index }) => {
    const brand = getTeamBranding(driver.team);
    const isLeader = index === 0;
    return (
      <div
        className="bcl-driver-row"
        style={{
          border: "1px solid rgba(15,23,42,0.08)",
          background: isLeader ? "linear-gradient(135deg, rgba(255,214,10,0.32), rgba(255,255,255,0.96))" : "rgba(255,255,255,0.94)",
          borderRadius: 24,
          padding: 16,
          width: "100%",
          textAlign: "left",
          boxShadow: isLeader ? "0 18px 44px rgba(212,175,55,0.18)" : "0 12px 30px rgba(15,23,42,0.07)",
          display: "grid",
          gridTemplateColumns: isMobile ? "auto 1fr auto" : (isTablet ? "auto auto minmax(220px, 1fr) repeat(3, minmax(66px, 0.55fr)) auto" : "auto auto minmax(180px, 1.4fr) repeat(6, minmax(70px, 0.65fr)) auto"),
          gap: isMobile ? 10 : 12,
          alignItems: "center",
          color: "#1d1d1f",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 16, background: isLeader ? "#1d1d1f" : "#f2f2f7", color: isLeader ? "#fff" : "#1d1d1f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>
          {index + 1}
        </div>
        {renderTeamBadge(driver.team, 44)}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: 950, lineHeight: 1 }}>#{driver.number}</span>
            <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.15 }}>{driver.name}</span>
            {driver.retired && <span style={{ fontSize: 11, borderRadius: 999, padding: "3px 8px", background: "#fff7ed", color: "#c2410c", fontWeight: 900 }}>R</span>}
          </div>
          <div style={{ marginTop: 5, fontSize: 13, color: "#6e6e73", fontWeight: 720 }}>{getTeamFullName(driver.team)} • {driver.manufacturer || "—"}</div>
          <div style={{ marginTop: 7, height: 5, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ width: `${leader?.points ? Math.max(4, Math.min(100, (Number(driver.points || 0) / Number(leader.points || 1)) * 100)) : 0}%`, height: "100%", borderRadius: 999, background: brand.accent }} />
          </div>
        </div>
        {([
          ["PTS", driver.points],
          ["W", driver.wins],
          ["T3", driver.top3],
          ["T5", driver.top5],
          ["DNF", driver.dnfs || 0],
          ["PEN", driver.totalPenalties ? `-${driver.totalPenalties}` : "0"],
        ]).filter(([label]) => !isMobile || ["PTS", "W", "T5"].includes(label)).filter(([label]) => !isTablet || ["PTS", "W", "T3"].includes(label)).map(([label, value]) => (
          <div key={label} style={{ background: "#f5f5f7", borderRadius: 16, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#86868b", fontWeight: 950 }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 950, color: label === "PEN" && String(value).startsWith("-") ? "#dc2626" : "#1d1d1f" }}>{value}</div>
          </div>
        ))}
      </div>
    );
  };

  const arcaLeaderPoints = sortedArcaStandings[0]?.points || 0;

  const ArcaDriverRow = ({ driver, index }) => {
    const brand = getTeamBranding(driver.team);
    const isLeader = index === 0;
    return (
      <div
        className="bcl-driver-row"
        style={{
          border: "1px solid rgba(15,23,42,0.08)",
          background: isLeader ? "linear-gradient(135deg, rgba(255,214,10,0.32), rgba(255,255,255,0.96))" : "rgba(255,255,255,0.94)",
          borderRadius: 24,
          padding: 16,
          width: "100%",
          textAlign: "left",
          boxShadow: isLeader ? "0 18px 44px rgba(212,175,55,0.18)" : "0 12px 30px rgba(15,23,42,0.07)",
          display: "grid",
          gridTemplateColumns: isMobile ? "auto 1fr auto" : (isTablet ? "auto auto minmax(220px, 1fr) repeat(3, minmax(66px, 0.55fr)) auto" : "auto auto minmax(180px, 1.4fr) repeat(5, minmax(70px, 0.65fr)) auto"),
          gap: isMobile ? 10 : 12,
          alignItems: "center",
          color: "#1d1d1f",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 16, background: isLeader ? "#1d1d1f" : "#f2f2f7", color: isLeader ? "#fff" : "#1d1d1f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>
          {index + 1}
        </div>
        {renderTeamBadge(driver.team, 44)}
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 22, fontWeight: 950, lineHeight: 1 }}>#{driver.number}</span>
            <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.15 }}>{driver.name}</span>
            {driver.retired && <span style={{ fontSize: 11, borderRadius: 999, padding: "3px 8px", background: "#fff7ed", color: "#c2410c", fontWeight: 900 }}>R</span>}
          </div>
          <div style={{ marginTop: 5, fontSize: 13, color: "#6e6e73", fontWeight: 720 }}>{driver.team} • ARCA Menards Series</div>
          <div style={{ marginTop: 7, height: 5, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ width: `${arcaLeaderPoints ? Math.max(4, Math.min(100, (Number(driver.points || 0) / Number(arcaLeaderPoints || 1)) * 100)) : 0}%`, height: "100%", borderRadius: 999, background: brand.accent }} />
          </div>
        </div>
        {([
          ["PTS", driver.points || 0],
          ["W", driver.wins || 0],
          ["T5", driver.top5 || 0],
          ["T10", driver.top10 || 0],
          ["DNF", driver.dnfs || 0],
        ]).filter(([label]) => !isMobile || ["PTS", "W", "T5"].includes(label)).filter(([label]) => !isTablet || ["PTS", "W", "T5"].includes(label)).map(([label, value]) => (
          <div key={label} style={{ background: "#f5f5f7", borderRadius: 16, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#86868b", fontWeight: 950 }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 950, color: "#1d1d1f" }}>{value}</div>
          </div>
        ))}
      </div>
    );
  };

  const CompactDriverCard = ({ driver, place }) => {
    if (!driver) return null;
    const brand = getTeamBranding(driver.team);
    return (
      <div
        style={{
          ...glassCard,
          padding: 18,
          textAlign: "left",
          minHeight: 178,
          position: "relative",
          overflow: "hidden",
          color: "#1d1d1f",
        }}
      >
        <div style={{ position: "absolute", right: -36, top: -38, width: 138, height: 138, borderRadius: "50%", background: `${brand.accent}22` }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "relative" }}>
          <div style={{ fontSize: 12, fontWeight: 950, letterSpacing: 1.2, color: "#6e6e73" }}>{place === 1 ? "POINTS LEADER" : `P${place}`}</div>
          {renderTeamBadge(driver.team, 48)}
        </div>
        <div style={{ marginTop: 18, fontSize: 38, lineHeight: 0.92, fontWeight: 1000, letterSpacing: -1.5 }}>#{driver.number}</div>
        <div style={{ marginTop: 10, fontSize: 20, fontWeight: 950 }}>{driver.name}</div>
        <div style={{ marginTop: 4, color: "#6e6e73", fontWeight: 750 }}>{getTeamFullName(driver.team)}</div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ padding: "7px 10px", borderRadius: 999, background: "#f5f5f7", fontWeight: 900 }}>{driver.points} pts</span>
          <span style={{ padding: "7px 10px", borderRadius: 999, background: "#f5f5f7", fontWeight: 900 }}>{driver.wins} wins</span>
        </div>
      </div>
    );
  };

  const TeamCard = ({ team, index }) => {
    const brand = getTeamBranding(team.team);
    return (
      <div
        style={{
          ...glassCard,
          padding: 18,
          textAlign: "left",
          display: "grid",
          gridTemplateColumns: isMobile ? "auto 1fr" : "auto auto 1fr auto",
          gap: isMobile ? 12 : 18,
          alignItems: "center",
          color: "#1d1d1f",
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 16, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>{index + 1}</div>
        {renderTeamBadge(team.team, 64)}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 950 }}>{getTeamFullName(team.team)}</div>
          <div style={{ marginTop: 5, color: "#6e6e73", fontWeight: 720 }}>{team.wins || 0} wins • {team.top5 || 0} top 5s</div>
          <div style={{ marginTop: 9, height: 6, borderRadius: 999, background: "#e5e7eb", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${teamRows[0]?.points ? Math.max(4, Math.min(100, (Number(team.points || 0) / Number(teamRows[0].points || 1)) * 100)) : 0}%`, background: brand.accent, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 26, fontWeight: 1000 }}>{team.points || 0}</div>
          <div style={{ fontSize: 12, color: "#86868b", fontWeight: 900 }}>POINTS</div>
        </div>
      </div>
    );
  };

  const ManufacturerCard = ({ item, index }) => {
    const manufacturerName = item.manufacturer || "Unknown";
    const colorMap = { Toyota: "#ef4444", Chevrolet: "#f59e0b", Ford: "#2563eb" };
    const color = colorMap[manufacturerName] || "#6366f1";
    return (
      <div
        style={{
          ...glassCard,
          padding: isMobile ? 18 : 24,
          textAlign: "center",
          minHeight: isMobile ? 230 : 280,
          color: "#1d1d1f",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ position: "absolute", right: -42, top: -42, width: 150, height: 150, borderRadius: "50%", background: `${color}1f` }} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          {renderManufacturerLogo(manufacturerName, isMobile ? 64 : 76)}
          <div style={{ width: 46, height: 46, borderRadius: 17, background: `${color}20`, color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>
            P{index + 1}
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, marginTop: 20, width: "100%" }}>
          <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 1000, letterSpacing: -1 }}>{manufacturerName}</div>
          <div style={{ marginTop: 8, fontSize: isMobile ? 34 : 42, fontWeight: 1000, letterSpacing: -1.4 }}>{item.points || 0}</div>
          <div style={{ color: "#86868b", fontWeight: 900, fontSize: 12, letterSpacing: 1.1 }}>MANUFACTURER POINTS</div>
          <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              ["WINS", item.wins || 0],
              ["TOP 5", item.top5 || 0],
              ["DRIVERS", item.drivers || 0],
            ].map(([label, value]) => (
              <div key={label} style={{ background: `${color}12`, border: `1px solid ${color}22`, borderRadius: 18, padding: "10px 8px" }}>
                <div style={{ fontSize: 17, fontWeight: 1000, color }}>{value}</div>
                <div style={{ marginTop: 2, fontSize: 10, color: "#6e6e73", fontWeight: 950, letterSpacing: 0.7 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const pointCards = [
    { title: "Race Finish Points", icon: "🏁", text: "Winner receives 55 points. Second receives 35 points, then points decrease by one per position through the field." },
    { title: "Stage Points", icon: "⭐", text: "Top 10 stage finishers receive 10, 9, 8, 7, 6, 5, 4, 3, 2, and 1 point." },
    { title: "Penalty Points", icon: "⚠️", text: "Penalty deductions increase by offense: 1st -5, 2nd -10, 3rd -15, and 4th or more -25." },
    { title: "Total Formula", icon: "🧮", text: "Finish Points + Stage Points + Bonuses - Penalties = Total Points." },
  ];

  function exportDriverStandingsCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    const rows = [["Position", "Number", "Driver", "Team", "Manufacturer", "Points", "Wins", "Top 3", "Top 5", "DNFs", "Penalty Points"]];
    sorted.forEach((driver, index) => {
      rows.push([
        index + 1,
        driver.number || "",
        driver.name || "",
        getTeamFullName(driver.team),
        driver.manufacturer || "",
        driver.points || 0,
        driver.wins || 0,
        driver.top3 || 0,
        driver.top5 || 0,
        driver.dnfs || 0,
        driver.totalPenalties || 0,
      ]);
    });
    downloadCsv(`bcl-driver-standings-${generated}.csv`, rows);
  }

  function exportTeamStandingsCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    const rows = [["Position", "Team", "Team Key", "Points", "Wins", "Top 3", "Top 5", "Drivers"]];
    teamRows.forEach((team, index) => {
      rows.push([
        index + 1,
        getTeamFullName(team.team),
        team.team || "",
        team.points || 0,
        team.wins || 0,
        team.top3 || 0,
        team.top5 || 0,
        team.drivers || team.driverCount || "",
      ]);
    });
    downloadCsv(`bcl-team-standings-${generated}.csv`, rows);
  }

  function exportManufacturerStandingsCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    const rows = [["Position", "Manufacturer", "Points", "Wins", "Top 3", "Top 5", "Drivers"]];
    manufacturerRows.forEach((item, index) => {
      rows.push([
        index + 1,
        item.manufacturer || "Unknown",
        item.points || 0,
        item.wins || 0,
        item.top3 || 0,
        item.top5 || 0,
        item.drivers || 0,
      ]);
    });
    downloadCsv(`bcl-manufacturer-standings-${generated}.csv`, rows);
  }

  function exportActiveStandingsCsv() {
    if (standingsTab === "teams") return exportTeamStandingsCsv();
    if (standingsTab === "manufacturers") return exportManufacturerStandingsCsv();
    if (standingsTab === "arca-drivers") return exportArcaDriverStandingsCsv();
    if (standingsTab === "arca-teams") return exportArcaTeamStandingsCsv();
    return exportDriverStandingsCsv();
  }

  function exportArcaDriverStandingsCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    const rows = [["Position", "Number", "Driver", "Team", "Points", "Wins", "Top 3", "Top 5", "DNFs"]];
    arcaStandings.forEach((driver, index) => {
      rows.push([
        index + 1,
        driver.driver_number || "",
        driver.driver_name || "",
        driver.team || "",
        driver.points || 0,
        driver.wins || 0,
        driver.top3 || 0,
        driver.top5 || 0,
        driver.dnfs || 0,
      ]);
    });
    downloadCsv(`arca-driver-standings-${generated}.csv`, rows);
  }

  function exportArcaTeamStandingsCsv() {
    const generated = new Date().toISOString().slice(0, 10);
    const rows = [["Position", "Team", "Points", "Wins", "Top 5", "Drivers"]];
    arcaTeamStandings.forEach((team, index) => {
      rows.push([
        index + 1,
        team.team || "",
        team.points || 0,
        team.wins || 0,
        team.top5 || 0,
        team.drivers?.length || 0,
      ]);
    });
    downloadCsv(`arca-team-standings-${generated}.csv`, rows);
  }

  return (
    <div style={applePage}>
      <div style={container}>
        <style>{`
          * { box-sizing: border-box; }
          @media (max-width: 760px) {
            .bcl-driver-row { min-width: 0 !important; }
            .bcl-scroll-safe { overflow-x: hidden !important; }
            button, a { -webkit-tap-highlight-color: transparent; }
          }
          @media (hover: hover) {
            .bcl-apple-button:hover { transform: translateY(-2px); box-shadow: 0 18px 45px rgba(15,23,42,0.12) !important; }
          }
        `}</style>

        <div style={{ ...glassCard, marginBottom: isMobile ? 10 : 16, padding: isMobile ? "12px" : "18px 20px", background: "rgba(255,255,255,0.82)", boxShadow: "0 18px 48px rgba(15,23,42,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: isMobile ? 10 : 14, flexWrap: "nowrap" }}>
            <div style={{ fontSize: isMobile ? 11 : 13, color: "#6e6e73", fontWeight: 950, letterSpacing: 1.1, textTransform: "uppercase" }}>{isMobile ? (seriesId === "arca" ? "ARCA" : "Cup") : (seriesId === "arca" ? "ARCA Control Center" : "Cup Control Center")}</div>
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
              <button
                type="button"
                aria-label="Go to league landing page"
                onClick={() => (window.location.pathname = "/")}
                style={{ ...publicMessageIconButtonStyle, background: "linear-gradient(180deg, #ffd60a 0%, #ff9f0a 100%)", boxShadow: "0 16px 38px rgba(255,159,10,0.30)" }}
                title="Home"
              >
                🏠
              </button>

              {leagueSession ? (
                <>
                  <button
                    type="button"
                    aria-label="Go to my profile"
                    onClick={() => (window.location.pathname = `/driver/${leagueSession.driverNumber}`)}
                    style={{ ...publicMessageIconButtonStyle, background: "linear-gradient(180deg, #34c759 0%, #248a3d 100%)", boxShadow: "0 16px 38px rgba(52,199,89,0.30)", width: isMobile ? 44 : "auto", paddingLeft: isMobile ? 0 : 16, paddingRight: isMobile ? 0 : 16 }}
                    title={`Signed in as #${leagueSession.driverNumber} ${leagueSession.driverName}`}
                  >
                    {isMobile ? "👤" : `👤 #${leagueSession.driverNumber} ${leagueSession.driverName}`}
                  </button>
                  <button
                    type="button"
                    aria-label="Log out"
                    onClick={handleLeagueLogout}
                    style={{ ...publicMessageIconButtonStyle, background: "rgba(0,0,0,0.06)", color: "#1d1d1f", boxShadow: "none" }}
                    title="Log out"
                  >
                    🚪
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  aria-label="Log in"
                  onClick={() => setShowLoginModal(true)}
                  style={{ ...publicMessageIconButtonStyle, background: "linear-gradient(180deg, #007aff 0%, #5856d6 100%)", boxShadow: "0 16px 38px rgba(0,122,255,0.30)", width: isMobile ? 44 : "auto", paddingLeft: isMobile ? 0 : 16, paddingRight: isMobile ? 0 : 16 }}
                  title="Log in"
                >
                  {isMobile ? "🔑" : "🔑 Log In"}
                </button>
              )}

              {seriesId !== "arca" && (
                <button
                  type="button"
                  aria-label="Open messages"
                  onClick={() => (window.location.pathname = "/message-center")}
                  style={publicMessageIconButtonStyle}
                  title="Messages"
                >
                  💬
                </button>
              )}

              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setPublicMenuOpen((open) => !open)}
                style={publicMenuButtonStyle}
                title="Menu"
              >
                <span style={publicMenuLineStyle} />
                <span style={publicMenuLineStyle} />
                <span style={publicMenuLineStyle} />
              </button>
            </div>
          </div>
        </div>

        {publicMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close public menu"
              onClick={() => setPublicMenuOpen(false)}
              style={publicMenuBackdropStyle}
            />
            <div style={publicMenuPanelStyle}>
              <div style={{ padding: "8px 10px 12px", borderBottom: "1px solid #e5e7eb", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>{seriesId === "arca" ? "ARCA Series" : "Cup Series"} Menu</div>
                <div style={{ fontSize: 20, fontWeight: 1000, color: "#111827" }}>League Pages</div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {filteredNavItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setPublicMenuOpen(false);
                      if (item.label === "Interviews") {
                        setShowInterviewsOverlay(true);
                      } else {
                        window.location.pathname = item.route;
                      }
                    }}
                    style={{
                      border: 0,
                      borderRadius: 14,
                      background: item.route === "/admin" ? "#111827" : "#f8fafc",
                      color: item.route === "/admin" ? "#ffffff" : "#111827",
                      padding: "12px 14px",
                      textAlign: "left",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <section style={{ ...glassCard, padding: isMobile ? 14 : "clamp(18px, 2.5vw, 26px)", marginBottom: isMobile ? 12 : 18, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 88% 0%, rgba(212,175,55,0.16), transparent 34%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(240px, 0.62fr)", gap: isMobile ? 12 : 20, alignItems: "center" }}>
            <div>
              <img
                src={seriesId === "arca" ? arcaLogo : ncsLogo}
                alt={seriesId === "arca" ? "ARCA Menards Series" : "NASCAR Cup Series"}
                style={{
                  display: "block",
                  width: isMobile ? "min(260px, 78vw)" : "min(420px, 92vw)",
                  maxHeight: isMobile ? 100 : 150,
                  objectFit: "contain",
                  margin: "4px 0 6px",
                  filter: "drop-shadow(0 18px 34px rgba(15,23,42,0.16))",
                }}
              />
            </div>
            <div style={{ ...glassCard, padding: 18, background: "rgba(255,255,255,0.62)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5), 0 18px 50px rgba(15,23,42,0.08)" }}>
              <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 950, letterSpacing: 1.15, textTransform: "uppercase" }}>Race Weekend</div>
              <div style={{ marginTop: 10, fontSize: isMobile ? 24 : 30, lineHeight: 1.02, fontWeight: 1000 }}>{nextRace?.name || "Season Complete"}</div>
              <div style={{ marginTop: 8, color: "#6e6e73", fontWeight: 800 }}>
                {nextRace?.date ? new Date(nextRace.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "All scheduled races complete"}
              </div>
              <button type="button" onClick={() => setScheduleOpen(true)} style={{ ...pillButton, marginTop: 16, background: "#1d1d1f", color: "white" }}>View Schedule →</button>
            </div>
          </div>
        </section>

        <AppUpdateBanner page="standings" />
        {featuredVideo && (
          <section style={{ ...glassCard, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ padding: 18, display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
              <span style={{ fontSize: 20 }}>🎬</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 950 }}>{featuredVideo.title || "Featured Video"}</div>
                {featuredVideo.description && <div style={{ color: "#6e6e73", fontWeight: 700, marginTop: 3 }}>{featuredVideo.description}</div>}
              </div>
            </div>
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
              {featuredVideo.video_url.includes("youtube.com") || featuredVideo.video_url.includes("youtu.be") ? (
                <iframe src={featuredVideo.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              ) : featuredVideo.video_url.includes("twitch.tv") ? (
                <iframe src={`https://player.twitch.tv/?video=${featuredVideo.video_url.split("/").pop()}&parent=${window.location.hostname}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
              ) : (
                <video controls crossOrigin="anonymous" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }} src={featuredVideo.video_url} />
              )}
            </div>
          </section>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(210px, 1fr))", gap: isMobile ? 10 : 14, marginBottom: isMobile ? 12 : 18 }}>
          <StatCard icon="🏆" label="Active Season" value={seasonName || "Season"} detail={`${completedRaceCount} races entered`} accent="#ff9f0a" tint="rgba(255,159,10,0.16)" />
          <StatCard icon="👑" label="Points Leader" value={leader ? `#${leader.number} ${leader.name}` : "—"} detail={leader ? `${leader.points} points` : "No leader yet"} accent="#5856d6" tint="rgba(88,86,214,0.14)" />
          <StatCard icon="👥" label="Active Drivers" value={sorted.length} detail={`${teams.length} teams`} accent="#34c759" tint="rgba(52,199,89,0.14)" />
          {seriesId !== "arca" && (
            <StatCard icon="🍾" label="Latest Winner" value={latestWinner ? `#${latestWinner.number || latestWinner.driverNumber || ""} ${latestWinner.name || latestWinner.driverName || "Winner"}` : "—"} detail={latestRace?.raceName || "No race posted"} accent="#ff3b30" tint="rgba(255,59,48,0.12)" />
          )}
        </div>

        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
        {seriesId !== "arca" && <PreviousRaceWinnerStandingsCard />}

        <button
          type="button"
          onClick={() => (window.location.pathname = "/driver-market")}
          style={{
            ...glassCard,
            width: "100%",
            textAlign: "left",
            padding: isMobile ? 16 : 22,
            marginBottom: isMobile ? 12 : 18,
            cursor: "pointer",
            color: "#1d1d1f",
            background: "linear-gradient(135deg, rgba(255,255,255,0.90), rgba(255,248,220,0.86))",
          }}
        >
          <div style={{ color: "#b45309", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Silly Season</div>
          <div style={{ marginTop: 6, fontSize: isMobile ? 24 : 30, fontWeight: 1000 }}>🔥 Driver Market</div>
          <div style={{ marginTop: 5, color: "#6e6e73", fontWeight: 720 }}>Scout drivers, track current-team re-sign interest, and follow the market before signing day.</div>
        </button>

        {onesToWatch.length > 0 && (
          <section style={{ ...glassCard, padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#b45309", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Broadcast Feature</div>
                <h2 style={{ margin: "5px 0 0", fontSize: isMobile ? 26 : 34, letterSpacing: -1.2 }}>🔥 Ones to Watch</h2>
              </div>
              <div style={{ color: "#86868b", fontWeight: 900, fontSize: 12 }}>{onesToWatchMode}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {onesToWatch.map((driver, index) => {
                const brand = getTeamBranding(driver.team);
                return (
                  <div key={driver.id} style={{ border: "1px solid rgba(15,23,42,0.08)", background: index === 0 ? `linear-gradient(135deg, ${brand.accent}22, rgba(255,255,255,0.92))` : "rgba(255,255,255,0.82)", borderRadius: 24, padding: 16, textAlign: "left", color: "#1d1d1f", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 1000, color: "#86868b", letterSpacing: 1 }}>{driver.watchBadge || `WATCH ${index + 1}`}</div>
                      {renderTeamBadge(driver.team, 42)}
                    </div>
                    <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 16, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>#{driver.number}</div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 950 }}>{driver.name}</div>
                        <div style={{ color: "#6e6e73", fontWeight: 720, fontSize: 12 }}>{getTeamFullName(driver.team)}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, padding: 12, borderRadius: 16, background: "#f5f5f7", fontWeight: 850 }}>{driver.reason}</div>
                    <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[["RANK", `P${driver.standingsRank}`], ["LAST", driver.latestFinish ? `P${driver.latestFinish}` : "—"], ["AVG 3", driver.avgFinish < 99 ? driver.avgFinish.toFixed(1) : "—"]].map(([label, value]) => (
                        <div key={label} style={{ background: "#fff", borderRadius: 14, padding: 9, textAlign: "center" }}>
                          <div style={{ fontSize: 10, color: "#86868b", fontWeight: 950 }}>{label}</div>
                          <div style={{ fontSize: 16, fontWeight: 1000 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div style={{ ...glassCard, padding: 10, marginBottom: 18, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(seriesId === "arca" ? [
            { key: "arca-drivers", label: "Driver Standings", icon: "🏎️" },
            { key: "arca-teams", label: "Teams", icon: "🏎️" },
            { key: "points", label: "Points System", icon: "📊" },
          ] : [
            { key: "drivers", label: "Driver Standings", icon: "👤" },
            { key: "teams", label: "Teams", icon: "🏢" },
            { key: "manufacturers", label: "Manufacturers", icon: "🏭" },
            { key: "points", label: "Points System", icon: "📊" },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStandingsTab(tab.key)}
              style={{
                flex: isMobile ? "1 1 calc(50% - 8px)" : "1 1 180px",
                border: "none",
                borderRadius: 999,
                padding: "13px 16px",
                    background: standingsTab === tab.key ? "linear-gradient(135deg, #007aff, #5856d6)" : "transparent",
                color: standingsTab === tab.key ? "#fff" : "#111827",
                fontWeight: 950,
                cursor: "pointer",
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div style={{ ...glassCard, padding: 12, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ color: "#6e6e73", fontWeight: 900, fontSize: 13 }}>
            Export standings for sharing, archiving, or spreadsheet review.
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={exportActiveStandingsCsv} style={{ ...pillButton, background: "#1d1d1f", color: "#ffffff" }}>
              Export Current Tab CSV
            </button>
            <button type="button" onClick={exportDriverStandingsCsv} style={pillButton}>
              Drivers CSV
            </button>
            <button type="button" onClick={exportTeamStandingsCsv} style={pillButton}>
              Teams CSV
            </button>
            <button type="button" onClick={exportManufacturerStandingsCsv} style={pillButton}>
              Manufacturers CSV
            </button>
            <button type="button" onClick={() => window.print()} style={pillButton}>
              Print Standings
            </button>
          </div>
        </div>

        {standingsTab === "drivers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Championship Table</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Driver Standings</h2>
              </div>
              <div style={{ color: "#6e6e73", fontWeight: 850 }}>{sorted.length} active drivers • {totalPoints} points awarded</div>
            </div>
            <div style={{ display: "grid", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
              {sorted.map((driver, index) => <DriverRow key={driver.id || driver.number} driver={driver} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "teams" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ color: "#34c759", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Organizations</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Team Standings</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {teamRows.map((team, index) => <TeamCard key={team.team || index} team={team} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "manufacturers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ color: "#ff9f0a", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Manufacturer Battle</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Manufacturer Standings</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(290px, 1fr))", gap: isMobile ? 12 : 16 }}>
              {manufacturerRows.map((item, index) => <ManufacturerCard key={item.manufacturer || index} item={item} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "arca-drivers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#006341", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>ARCA Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Driver Standings</h2>
              </div>
              <div style={{ color: "#6e6e73", fontWeight: 850 }}>{sortedArcaStandings.length} active drivers • {sortedArcaStandings.reduce((sum, d) => sum + Number(d.points || 0), 0)} points awarded</div>
            </div>
            <div style={{ display: "grid", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
              {sortedArcaStandings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(0,99,65,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No ARCA standings yet</div>
                </div>
              ) : (
                sortedArcaStandings.map((driver, index) => <ArcaDriverRow key={driver.id || driver.number} driver={driver} index={index} />)
              )}
            </div>
          </section>
        )}

        {standingsTab === "arca-teams" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#006341", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>ARCA Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Team Standings</h2>
              </div>
              <button type="button" onClick={() => exportArcaTeamStandingsCsv()} style={{ padding: "10px 16px", background: "#006341", color: "#fff", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 12, cursor: "pointer" }}>📥 Export CSV</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {arcaTeamStandings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(0,99,65,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No ARCA team standings yet</div>
                </div>
              ) : (
                arcaTeamStandings.map((team, index) => (
                  <div key={team.team} style={{ background: "linear-gradient(135deg, rgba(0,99,65,0.08), rgba(0,99,65,0.02))", border: "1px solid rgba(0,99,65,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto auto auto", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#006341", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 18 }}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>{team.team}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{team.drivers.length} drivers</div>
                      </div>
                      {!isMobile && (
                        <>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000, color: "#006341", fontSize: 18 }}>{team.points}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>PTS</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{team.wins}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>W</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{team.top5}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>T5</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {standingsTab === "points" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Rules Reference</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Points & Penalties</h2>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(290px, 1fr))", gap: isMobile ? 12 : 16 }}>
              {pointCards.map((card) => (
                <div key={card.title} style={{ background: "rgba(255,255,255,0.82)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 24, padding: 18, boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 16, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{card.icon}</div>
                  <h3 style={{ margin: "14px 0 8px", fontSize: 21 }}>{card.title}</h3>
                  <p style={{ margin: 0, color: "#6e6e73", lineHeight: 1.5, fontWeight: 720 }}>{card.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {scheduleOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.34)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: isMobile ? 10 : 20 }}>
            <div style={{ ...glassCard, background: "rgba(255,255,255,0.92)", padding: isMobile ? 14 : 22, maxWidth: 640, width: "100%", maxHeight: isMobile ? "92vh" : "84vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ color: "#86868b", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Cup Series</div>
                  <div style={{ fontSize: 30, fontWeight: 1000, letterSpacing: -1 }}>Race Schedule</div>
                </div>
                <button type="button" onClick={() => setScheduleOpen(false)} style={{ border: "none", background: "#f2f2f7", color: "#1d1d1f", width: 42, height: 42, borderRadius: 999, fontSize: 24, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {sortedTracks.map((track, index) => {
                  const completed = isRaceCompleteByDateOrHistory(track, completedRaces);
                  const isNext = track.name === nextRace?.name;
                  return (
                    <button key={`${track.name}-${index}`} type="button" onClick={() => setSelectedTrackInfo(getTrackOverview(track.name))} style={{ border: `1px solid ${isNext ? "rgba(212,175,55,0.50)" : "rgba(15,23,42,0.08)"}`, background: isNext ? "rgba(255,248,220,0.88)" : "rgba(255,255,255,0.86)", borderRadius: 20, padding: 14, textAlign: "left", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", cursor: "pointer", color: "#1d1d1f" }}>
                      <div style={{ width: 34, height: 34, borderRadius: 13, background: completed ? "#dcfce7" : isNext ? "#fef3c7" : "#f5f5f7", color: completed ? "#166534" : isNext ? "#92400e" : "#6e6e73", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>{completed ? "✓" : index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950 }}>{track.name}</div>
                        {track.date && <div style={{ marginTop: 3, color: "#6e6e73", fontWeight: 700, fontSize: 13 }}>{new Date(track.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 950, color: completed ? "#16a34a" : isNext ? "#b45309" : "#86868b" }}>{completed ? "COMPLETE" : isNext ? "NEXT" : "UPCOMING"}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {showInterviewsOverlay && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: isMobile ? 10 : 20 }}>
            <div style={{ background: "#0c0f14", color: "white", padding: isMobile ? 20 : 24, maxWidth: 1200, width: "100%", maxHeight: isMobile ? "92vh" : "88vh", overflowY: "auto", borderRadius: 16, border: "1px solid #2c3440" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>🎤 Driver Interviews</h2>
                  <p style={{ opacity: 0.65, marginTop: 6, fontSize: 14 }}>Answered pre-race and post-race interviews</p>
                </div>
                <button type="button" onClick={() => setShowInterviewsOverlay(false)} style={{ border: "none", background: "none", color: "white", fontSize: 32, cursor: "pointer", fontWeight: 300 }}>×</button>
              </div>

              {/* Search and Filters */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Search driver, number, question, or answer..."
                  style={{ flex: "1 1 280px", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", minWidth: 0 }}
                  onChange={(e) => {/* Would connect to filter state */}}
                />
                <select style={{ background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px" }}>
                  <option>All Races</option>
                </select>
                <select style={{ background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px" }}>
                  <option>All Interviews</option>
                  <option>Pre-Race</option>
                  <option>Post-Race</option>
                </select>
              </div>

              {/* Interviews List */}
              <div style={{ display: "grid", gap: 16 }}>
                <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 12, padding: 16 }}>
                  <p style={{ opacity: 0.65, textAlign: "center" }}>No interviews posted yet</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTrackInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: isMobile ? 10 : 20 }}>
            <div style={{ ...glassCard, background: "rgba(255,255,255,0.94)", padding: isMobile ? 14 : 22, maxWidth: 940, width: "100%", maxHeight: isMobile ? "92vh" : "88vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ color: "#86868b", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>iRacing Track Info</div>
                  <div style={{ fontSize: 36, fontWeight: 1000, marginTop: 6, letterSpacing: -1.2 }}>{selectedTrackInfo.name}</div>
                  <div style={{ color: "#6e6e73", fontWeight: 750, marginTop: 4 }}>{selectedTrackInfo.location}</div>
                </div>
                <button type="button" onClick={() => setSelectedTrackInfo(null)} style={{ border: "none", background: "#f2f2f7", color: "#1d1d1f", width: 42, height: 42, borderRadius: 999, fontSize: 24, cursor: "pointer" }}>×</button>
              </div>
              {selectedTrackInfo.imageUrl && <img src={selectedTrackInfo.imageUrl} alt={selectedTrackInfo.name} style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 24, marginBottom: 16 }} />}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
                {[
                  ["TYPE", selectedTrackInfo.type],
                  ["LENGTH", selectedTrackInfo.length],
                  ["TURNS", selectedTrackInfo.turns],
                  ["BANKING", selectedTrackInfo.banking],
                  ["PIT SPEED", selectedTrackInfo.pitSpeed],
                  ["TIRE WEAR", selectedTrackInfo.tireWear],
                  ["RESTART ZONE", selectedTrackInfo.restartZone],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: "#f5f5f7", borderRadius: 18, padding: 14 }}>
                    <div style={{ fontSize: 11, color: "#86868b", fontWeight: 1000 }}>{label}</div>
                    <div style={{ marginTop: 5, fontWeight: 950 }}>{value || "—"}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 20, padding: 16, lineHeight: 1.55, marginBottom: 12 }}>
                <strong>Track Characteristics:</strong> {selectedTrackInfo.notes || "—"}
              </div>
              <div style={{ background: "#fff", border: "1px solid rgba(15,23,42,0.08)", borderRadius: 20, padding: 16, lineHeight: 1.55 }}>
                <strong>Race Recommendations:</strong> {selectedTrackInfo.raceTip || selectedTrackInfo.notes || "—"}
              </div>
            </div>
          </div>
        )}

        {showLoginModal && (
          <LeagueLoginModal
            drivers={drivers}
            arcaDrivers={arcaDrivers}
            teams={teams}
            driverAccessCodes={driverAccessCodes}
            supabase={supabase}
            onClose={() => setShowLoginModal(false)}
            onSuccess={(session) => {
              setLeagueSession(session);
              setShowLoginModal(false);
              const redirectTo = getPostLoginRedirect();
              if (redirectTo) {
                window.location.href = redirectTo;
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function LeagueLoginModal({ drivers, arcaDrivers, teams, driverAccessCodes, supabase, onClose, onSuccess }) {
  const pageFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Inter', ui-sans-serif, 'Segoe UI', sans-serif";

  // step: "number" -> "password" -> "biometricOffer"
  const [step, setStep] = useState("number");
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasSavedBiometric, setHasSavedBiometric] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const [biometricError, setBiometricError] = useState("");
  const [pendingSession, setPendingSession] = useState(null);

  useEffect(() => {
    isBiometricAvailable().then(setBiometricAvailable);
    setHasSavedBiometric(hasAnyDriverBiometricCredential());
  }, []);

  function handleContinue(e) {
    e.preventDefault();
    setError("");
    if (!driverNumber.trim()) {
      setError("Enter your driver number.");
      return;
    }
    setStep("password");
  }

  async function handleSubmitPassword(e) {
    e.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setSubmitting(true);
    const result = await loginToLeague({
      driverNumber: driverNumber.trim(),
      password,
      driverAccessCodes,
      drivers,
      arcaDrivers,
      teams,
      supabase,
    });
    setSubmitting(false);

    if (!result.success) {
      setError(result.error || "Incorrect password.");
      return;
    }

    if (biometricAvailable && !hasBiometricCredentialForDriver(result.session.driverNumber)) {
      setPendingSession(result.session);
      setStep("biometricOffer");
      return;
    }

    onSuccess(result.session);
  }

  async function handleEnableBiometric() {
    if (!pendingSession) return;
    setBiometricBusy(true);
    setBiometricError("");
    try {
      await registerDriverBiometric(pendingSession.driverNumber, pendingSession.driverName);
      onSuccess(pendingSession);
    } catch (err) {
      console.error("Biometric setup failed:", err);
      setBiometricError("Could not set up Face ID / Touch ID on this device.");
      setBiometricBusy(false);
    }
  }

  function handleSkipBiometric() {
    if (pendingSession) onSuccess(pendingSession);
  }

  async function handleBiometricUnlock() {
    setBiometricBusy(true);
    setBiometricError("");
    try {
      const session = await loginWithBiometric({ drivers, arcaDrivers, teams, supabase });
      onSuccess(session);
    } catch (err) {
      console.error("Biometric unlock failed:", err);
      setBiometricError("Face ID / Touch ID didn't match. Enter your number and password instead.");
      setBiometricBusy(false);
    }
  }

  function handleBack() {
    setError("");
    setPassword("");
    setStep("number");
  }

  const appleFieldStyle = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 10,
    border: "1px solid #d2d2d7",
    background: "#ffffff",
    fontSize: 16,
    boxSizing: "border-box",
    fontFamily: pageFont,
    color: "#1d1d1f",
    outline: "none",
  };

  const applePillButton = (enabled) => ({
    width: "100%",
    marginTop: 18,
    border: 0,
    borderRadius: 10,
    padding: "13px 18px",
    background: enabled ? "#1d1d1f" : "#e8e8ed",
    color: enabled ? "#ffffff" : "#a1a1a6",
    fontWeight: 590,
    fontSize: 16,
    cursor: enabled ? "pointer" : "default",
    fontFamily: pageFont,
    transition: "background 150ms ease",
  });

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1200,
      padding: 20,
      fontFamily: pageFont,
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: 18,
        padding: "40px 36px 32px",
        maxWidth: 375,
        width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.30)",
        color: "#1d1d1f",
        position: "relative",
      }}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "#f5f5f7",
            border: "none",
            borderRadius: 999,
            width: 28,
            height: 28,
            color: "#6e6e73",
            fontSize: 15,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        {/* Apple-style centered glyph */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#f5f5f7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            border: "1px solid #e8e8ed",
          }}>
            {step === "biometricOffer" ? "🔓" : "🏁"}
          </div>
        </div>

        {step === "number" && (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, textAlign: "center", letterSpacing: "-0.01em" }}>
              Sign In
            </h1>
            <p style={{ margin: "6px 0 26px", fontSize: 13.5, color: "#6e6e73", textAlign: "center", lineHeight: 1.5 }}>
              Sign in with your driver number to access your profile and team.
            </p>

            {biometricAvailable && hasSavedBiometric && (
              <>
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={biometricBusy}
                  style={{
                    width: "100%",
                    border: "1px solid #d2d2d7",
                    borderRadius: 10,
                    padding: "12px 16px",
                    background: "#ffffff",
                    color: "#1d1d1f",
                    fontWeight: 590,
                    fontSize: 15,
                    cursor: biometricBusy ? "default" : "pointer",
                    fontFamily: pageFont,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    marginBottom: 18,
                  }}
                >
                  <span style={{ fontSize: 17 }}>🔓</span> {biometricBusy ? "Verifying…" : "Sign In with Face ID"}
                </button>
                {biometricError && <div style={{ color: "#d70015", fontWeight: 500, fontSize: 12.5, marginBottom: 12, textAlign: "center" }}>{biometricError}</div>}
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 18px" }}>
                  <div style={{ flex: 1, height: 1, background: "#e8e8ed" }} />
                  <div style={{ fontSize: 11.5, fontWeight: 590, color: "#a1a1a6" }}>or</div>
                  <div style={{ flex: 1, height: 1, background: "#e8e8ed" }} />
                </div>
              </>
            )}

            <form onSubmit={handleContinue}>
              <input
                type="text"
                value={driverNumber}
                onChange={(e) => setDriverNumber(e.target.value)}
                placeholder="Driver Number"
                style={appleFieldStyle}
                autoFocus
              />
              {error && <div style={{ color: "#d70015", fontWeight: 500, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
              <button type="submit" style={applePillButton(driverNumber.trim().length > 0)}>
                Continue
              </button>
            </form>
          </>
        )}

        {step === "password" && (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, textAlign: "center", letterSpacing: "-0.01em" }}>
              Enter Your Password
            </h1>
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: "block",
                margin: "8px auto 26px",
                background: "none",
                border: "none",
                color: "#0066cc",
                fontSize: 13.5,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: pageFont,
              }}
            >
              #{driverNumber.trim()} — Not you?
            </button>

            <form onSubmit={handleSubmitPassword}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                style={appleFieldStyle}
                autoFocus
              />
              {error && <div style={{ color: "#d70015", fontWeight: 500, fontSize: 12.5, marginTop: 10 }}>{error}</div>}
              <button type="submit" disabled={submitting} style={applePillButton(password.trim().length > 0 && !submitting)}>
                {submitting ? "Signing In…" : "Sign In"}
              </button>
            </form>
          </>
        )}

        {step === "biometricOffer" && (
          <>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, textAlign: "center", letterSpacing: "-0.01em" }}>
              Use Face ID to Sign In Faster?
            </h1>
            <p style={{ margin: "6px 0 26px", fontSize: 13.5, color: "#6e6e73", textAlign: "center", lineHeight: 1.5 }}>
              Skip your number and password next time on this device.
            </p>

            {biometricError && <div style={{ color: "#d70015", fontWeight: 500, fontSize: 12.5, marginBottom: 12, textAlign: "center" }}>{biometricError}</div>}

            <button
              type="button"
              onClick={handleEnableBiometric}
              disabled={biometricBusy}
              style={applePillButton(!biometricBusy)}
            >
              {biometricBusy ? "Setting Up…" : "Enable Face ID"}
            </button>
            <button
              type="button"
              onClick={handleSkipBiometric}
              disabled={biometricBusy}
              style={{
                width: "100%",
                marginTop: 10,
                border: "none",
                borderRadius: 10,
                padding: "13px 18px",
                background: "none",
                color: "#0066cc",
                fontWeight: 590,
                fontSize: 16,
                cursor: "pointer",
                fontFamily: pageFont,
              }}
            >
              Not Now
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
