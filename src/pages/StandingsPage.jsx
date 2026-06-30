import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import ncsLogo from "../assets/series/NCS.png";
import arcaLogo from "../assets/series/ARCA.png";
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
        <img src={logoSrc} alt={`${name} logo`} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
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

      if (!isMounted) return;

      if (uploadError || voteError) {
        setLoading(false);
        return;
      }

      const uploadsForRace = (uploadData || []).filter((upload) => {
        const raceUploadId = getPaintUploadRaceForStandings(upload);
        return raceUploadId && raceUploadId.toLowerCase().includes(spotlightRaceName.toLowerCase());
      });

      if (!uploadsForRace.length) {
        setLoading(false);
        setWinners([]);
        setRaceName(spotlightRaceName);
        return;
      }

      const imageUploads = uploadsForRace.filter(isPaintImageUploadForStandings);

      const winnerIds = new Set();
      const voteMap = {};
      (voteData || []).forEach((vote) => {
        const uploadIdStr = String(vote.upload_id || vote.uploadId || "");
        voteMap[uploadIdStr] = (voteMap[uploadIdStr] || 0) + 1;
      });

      const sortedByVotes = imageUploads.sort((a, b) => {
        const aIdStr = String(a.id || "");
        const bIdStr = String(b.id || "");
        return (voteMap[bIdStr] || 0) - (voteMap[aIdStr] || 0);
      });

      const topVotedUpload = sortedByVotes[0];
      if (topVotedUpload) {
        const driverId = topVotedUpload.driver_id || topVotedUpload.driverId || topVotedUpload.user_id || topVotedUpload.userId;
        if (driverId) winnerIds.add(driverId);
      }

      const winnersArray = Array.from(winnerIds)
        .map((driverId) => drivers.find((d) => d.id === driverId || String(d.number) === String(driverId)))
        .filter(Boolean);

      setWinners(winnersArray);
      setRaceName(spotlightRaceName);
      setLoading(false);
    }

    loadWinner();
  }, [spotlightRaceName, driversKeyForPaintWinner, showWinnerWindow]);

  if (!showWinnerWindow) return null;

  if (loading) return null;

  if (!winners.length) return null;

  const winner = winners[0];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(250,204,21,0.16), rgba(15,23,42,0.96))",
        border: "1px solid #fcc15e",
        borderRadius: 18,
        padding: 16,
        marginBottom: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.24)",
      }}
    >
      <div style={{ color: "#facc15", fontSize: 12, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase" }}>Paint Scheme Winner</div>
      <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>🎨 {raceName}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 8 }}>
        #{winner.number} {winner.name}
      </div>
      <div style={{ opacity: 0.75, marginTop: 4 }}>
        {winner.team || "—"} • {winner.manufacturer || "—"} • {(voteMap?.[String(topVotedUpload?.id || "")] || 0)} votes
      </div>
    </div>
  );
}


function PreviousRaceWinnerStandingsCard({ seriesId = "cup", raceHistory = [] }) {
  const [winner, setWinner] = useState(null);

  const showRaceWinnerWindow = shouldShowPreviousRaceWinnerSpotlight();

  useEffect(() => {
    if (!showRaceWinnerWindow) {
      setWinner(null);
      return;
    }

    // Get the last race from raceHistory
    const latestRace = raceHistory && raceHistory.length > 0 ? raceHistory[raceHistory.length - 1] : null;
    if (!latestRace) {
      setWinner(null);
      return;
    }

    // Find the first-place finisher
    const firstPlace = latestRace.results?.find(
      (result) => Number(result.finishPos || result.finish || result.position) === 1 || result.isWin
    );

    setWinner(firstPlace || null);
  }, [showRaceWinnerWindow, JSON.stringify(raceHistory)]);

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

export default function StandingsPage({ seriesId = "cup", drivers = [], teams = [], manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [] }) {
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
  const [arcaRaceHistory, setArcaRaceHistory] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = viewportWidth < 760;
  const isTablet = viewportWidth >= 760 && viewportWidth < 1040;

  const handleDriverClick = (number) => {
    window.location.pathname = `/driver/${number}`;
  };

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

    loadArcaStandings();
  }, []);

  // Load ARCA Race History for last winner
  useEffect(() => {
    async function loadArcaRaceHistory() {
      try {
        const { data } = await supabase
          .from("arca_races")
          .select("*")
          .order("race_date", { ascending: false })
          .limit(10);
        setArcaRaceHistory(data || []);
      } catch (err) {
        console.error("Error loading ARCA race history:", err);
      }
    }

    if (seriesId === "arca") {
      loadArcaRaceHistory();
    }
  }, [seriesId]);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !isInactivePlaceholderDriver(driver))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  }, [drivers]);

  const sorted = activeDrivers;
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

  // ARCA last winner
  const arcaLatestWinner = arcaRaceHistory && arcaRaceHistory.length > 0 
    ? arcaRaceHistory[0]?.results?.find?.((result) => Number(result.finishPos || result.finish || result.position) === 1 || result.isWin)
    : null;

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
        recentTop5s * 20 -
        Number(driver.top10 || 0) * 1 -
        recentDnfs * 5;

      return {
        ...driver,
        watchScore,
        standingsRank,
        latestFinish,
        avgFinish,
        reason: `${recentTop5s > 0 ? `${recentTop5s}T5 in last 3` : "Consistent performer"}`,
        watchBadge: `WATCH ${Math.floor((watchScore / 500) * 5) + 1}`,
      };
    })
    .sort((a, b) => b.watchScore - a.watchScore)
    .slice(0, 6);

  const onesToWatch = manualOnesToWatch && manualOnesToWatch.length > 0 ? manualOnesToWatch : autoOnesToWatch;
  const onesToWatchMode = manualOnesToWatch && manualOnesToWatch.length > 0 ? "MANUAL" : "AUTO";

  const glassCard = {
    borderRadius: 24,
    border: "1px solid rgba(15,23,42,0.08)",
    boxShadow: "0 18px 48px rgba(15,23,42,0.04)",
    background: "rgba(255,255,255,0.86)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
  };

  const pillButton = {
    borderRadius: 999,
    border: "1px solid rgba(15,23,42,0.08)",
    padding: "12px 18px",
    fontWeight: 900,
    fontSize: 13,
    cursor: "pointer",
    background: "rgba(255,255,255,0.86)",
    color: "#1d1d1f",
    boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
  };

  const publicMenuLineStyle = {
    width: 22,
    height: 2,
    background: "#111827",
    borderRadius: 1,
  };

  const publicMenuButtonStyle = {
    border: "none",
    background: "rgba(255,255,255,0.86)",
    borderRadius: "50%",
    width: 42,
    height: 42,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    cursor: "pointer",
  };

  const publicMessageIconButtonStyle = {
    border: "none",
    borderRadius: "50%",
    width: 42,
    height: 42,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    cursor: "pointer",
  };

  const publicMenuBackdropStyle = {
    position: "fixed",
    inset: 0,
    background: "transparent",
    zIndex: 999,
    border: "none",
    padding: 0,
  };

  const publicMenuPanelStyle = {
    position: "fixed",
    top: isMobile ? 88 : 92,
    right: isMobile ? 10 : 18,
    background: "rgba(255,255,255,0.92)",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(15,23,42,0.16)",
    border: "1px solid rgba(15,23,42,0.06)",
    padding: 0,
    zIndex: 1001,
    width: isMobile ? "calc(100vw - 20px)" : 280,
  };

  const navItems = [
    { icon: "👤", label: "Driver Market", route: "/driver-market" },
    { icon: "🏁", label: "League Standings", route: "/standings" },
    { icon: "🎙️", label: "Driver Interviews", route: "/interviews" },
    { icon: "📊", label: "Team Analytics", route: "/analytics" },
    { icon: "⚙️", label: "Admin Panel", route: "/admin" },
  ];

  const pointCards = [
    { icon: "🏆", title: "Win (1st Place)", text: "Driver gains 34 points for a win. +1 bonus for leading laps." },
    { icon: "🔝", title: "Poles & Laps", text: "Pole position awards 4 points. Each lap led gains +1 point." },
    { icon: "📈", title: "Finish Bonuses", text: "Top 5 finishes are rewarded. 5th place = 12 pts, Top 10 = 6 pts." },
    { icon: "⚠️", title: "Penalties", text: "DNF = 0 points. Lapped/tail end finishes get a scaled point reduction." },
  ];

  const getTrackOverview = (trackName) => {
    return trackOverviewData.find((track) => track.name === trackName) || {};
  };

  const exportDriverStandingsCsv = () => {
    if (seriesId === "arca") {
      const rows = [
        ["Pos", "Number", "Driver", "Team", "Points", "Wins", "Top 5", "DNF"],
        ...arcaStandings.map((driver, idx) => [
          idx + 1,
          driver.number || "—",
          driver.name || "—",
          driver.team || "—",
          driver.points || 0,
          driver.wins || 0,
          driver.top5 || 0,
          driver.dnfs || 0,
        ]),
      ];
      downloadCsv("ARCA-Driver-Standings.csv", rows);
    } else {
      const rows = [
        ["Pos", "Number", "Driver", "Team", "Points", "Wins", "Top 3", "Top 5"],
        ...sorted.map((driver, idx) => [
          idx + 1,
          driver.number || "—",
          driver.name || "—",
          driver.team || "—",
          driver.points || 0,
          driver.wins || 0,
          driver.top3 || 0,
          driver.top5 || 0,
        ]),
      ];
      downloadCsv("Cup-Driver-Standings.csv", rows);
    }
  };

  const exportTeamStandingsCsv = () => {
    const rows = [
      ["Pos", "Team", "Points", "Wins", "Top 5"],
      ...teamRows.map((team, idx) => [
        idx + 1,
        team.team || "—",
        team.points || 0,
        team.wins || 0,
        team.top5 || 0,
      ]),
    ];
    downloadCsv("Team-Standings.csv", rows);
  };

  const exportArcaTeamStandingsCsv = () => {
    const rows = [
      ["Pos", "Team", "Points", "Wins", "Top 5"],
      ...arcaTeamStandings.map((team, idx) => [
        idx + 1,
        team.team || "—",
        team.points || 0,
        team.wins || 0,
        team.top5 || 0,
      ]),
    ];
    downloadCsv("ARCA-Team-Standings.csv", rows);
  };

  const StatCard = ({ icon, label, value, detail, onClick, accent = "#007aff", tint = "rgba(0,122,255,0.14)" }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...glassCard,
        padding: isMobile ? "12px 14px" : "14px 16px",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
        background: `linear-gradient(135deg, ${tint}, rgba(255,255,255,0.82))`,
        border: `1px solid ${accent}30`,
        color: "#1d1d1f",
      }}
    >
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ marginTop: 8, fontSize: 11, fontWeight: 1000, color: accent, letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: isMobile ? 16 : 18, fontWeight: 900, lineHeight: 1.2 }}>{value}</div>
      <div style={{ marginTop: 4, fontSize: 12, color: "#6e6e73", fontWeight: 700 }}>{detail}</div>
    </button>
  );

  return (
    <div style={{ ...appShellStyle, background: "linear-gradient(180deg, #f8f9fa 0%, #fff 40%, #f0f0f4 100%)" }}>
      <style>{`
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
            <div style={{ fontSize: isMobile ? 11 : 13, color: "#6e6e73", fontWeight: 950, letterSpacing: 1.1, textTransform: "uppercase" }}>
              {isMobile ? (seriesId === "arca" ? "ARCA" : "Cup") : (seriesId === "arca" ? "ARCA Control Center" : "Cup Control Center")}
            </div>
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

              <button
                type="button"
                aria-label="Open messages"
                onClick={() => (window.location.pathname = "/message-center")}
                style={publicMessageIconButtonStyle}
                title="Messages"
              >
                💬
              </button>

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
                <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: 1.5, textTransform: "uppercase", color: "#6b7280" }}>
                  {seriesId === "arca" ? "ARCA Series Menu" : "Cup Series Menu"}
                </div>
                <div style={{ fontSize: 20, fontWeight: 1000, color: "#111827" }}>League Pages</div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setPublicMenuOpen(false);
                      window.location.pathname = item.route;
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
          <StatCard icon="👑" label="Points Leader" value={seriesId === "arca" ? (arcaStandings[0] ? `#${arcaStandings[0].number} ${arcaStandings[0].name}` : "—") : (leader ? `#${leader.number} ${leader.name}` : "—")} detail={seriesId === "arca" ? (arcaStandings[0] ? `${arcaStandings[0].points} points` : "No leader yet") : (leader ? `${leader.points} points` : "No leader yet")} onClick={() => seriesId === "arca" && arcaStandings[0] && handleDriverClick(arcaStandings[0].number)} accent="#5856d6" tint="rgba(88,86,214,0.14)" />
          <StatCard icon="👥" label="Active Drivers" value={seriesId === "arca" ? arcaStandings.length : sorted.length} detail={seriesId === "arca" ? `${arcaTeamStandings.length} teams` : `${teams.length} teams`} accent="#34c759" tint="rgba(52,199,89,0.14)" />
          <StatCard icon="🍾" label="Latest Winner" value={seriesId === "arca" ? (arcaLatestWinner ? `#${arcaLatestWinner.number || arcaLatestWinner.driverNumber || ""} ${arcaLatestWinner.name || arcaLatestWinner.driverName || "Winner"}` : "—") : (latestWinner ? `#${latestWinner.number || latestWinner.driverNumber || ""} ${latestWinner.name || latestWinner.driverName || "Winner"}` : "—")} detail={seriesId === "arca" ? (arcaRaceHistory[0]?.race_name || "No race posted") : (latestRace?.raceName || "No race posted")} accent="#ff3b30" tint="rgba(255,59,48,0.12)" />
        </div>

        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
        <PreviousRaceWinnerStandingsCard seriesId={seriesId} raceHistory={seriesId === "arca" ? arcaRaceHistory : raceHistory} />

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
                  <button key={driver.id} type="button" onClick={() => handleDriverClick(driver.number)} style={{ border: "1px solid rgba(15,23,42,0.08)", background: index === 0 ? `linear-gradient(135deg, ${brand.accent}22, rgba(255,255,255,0.92))` : "rgba(255,255,255,0.82)", borderRadius: 24, padding: 16, textAlign: "left", cursor: "pointer", color: "#1d1d1f", boxShadow: "0 12px 30px rgba(15,23,42,0.06)" }}>
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
                  </button>
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
            <button type="button" onClick={exportDriverStandingsCsv} style={{ ...pillButton, background: "#1d1d1f", color: "#ffffff" }}>
              Export Current Tab CSV
            </button>
            <button type="button" onClick={exportTeamStandingsCsv} style={pillButton}>
              Teams CSV
            </button>
          </div>
        </div>

        {standingsTab === "drivers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Cup Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Driver Standings</h2>
              </div>
              <button type="button" onClick={() => exportDriverStandingsCsv()} style={{ padding: "10px 16px", background: "#5856d6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 12, cursor: "pointer" }}>📥 Export CSV</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {sorted.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(88,86,214,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No driver standings yet</div>
                </div>
              ) : (
                sorted.map((driver, index) => (
                  <div key={driver.id} style={{ background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(88,86,214,0.02))", border: "1px solid rgba(88,86,214,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto auto auto auto", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#5856d6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 18 }}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>#{driver.number} {driver.name}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{driver.team}</div>
                      </div>
                      {!isMobile && (
                        <>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000, color: "#5856d6", fontSize: 18 }}>{driver.points}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>PTS</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.wins}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>W</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.top5}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>T5</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.dnfs}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>DNF</div>
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

        {standingsTab === "teams" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Cup Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Team Standings</h2>
              </div>
              <button type="button" onClick={() => exportTeamStandingsCsv()} style={{ padding: "10px 16px", background: "#5856d6", color: "#fff", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 12, cursor: "pointer" }}>📥 Export CSV</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {teamRows.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(88,86,214,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No team standings yet</div>
                </div>
              ) : (
                teamRows.map((team, index) => (
                  <div key={team.team} style={{ background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(88,86,214,0.02))", border: "1px solid rgba(88,86,214,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto auto auto", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#5856d6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 18 }}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>{team.team}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{team.drivers?.length || 0} drivers</div>
                      </div>
                      {!isMobile && (
                        <>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000, color: "#5856d6", fontSize: 18 }}>{team.points}</div>
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

        {standingsTab === "manufacturers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Cup Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Manufacturer Standings</h2>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {manufacturerRows.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(88,86,214,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No manufacturer standings yet</div>
                </div>
              ) : (
                manufacturerRows.map((mfr, index) => (
                  <div key={mfr.manufacturer} style={{ background: "linear-gradient(135deg, rgba(88,86,214,0.08), rgba(88,86,214,0.02))", border: "1px solid rgba(88,86,214,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto auto auto auto", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#5856d6", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 18 }}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {renderManufacturerLogo(mfr.manufacturer, 40)}
                            <div>{mfr.manufacturer}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{mfr.drivers} drivers</div>
                      </div>
                      {!isMobile && (
                        <>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000, color: "#5856d6", fontSize: 18 }}>{mfr.points}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>PTS</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{mfr.wins}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>W</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{mfr.top3}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>T3</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{mfr.top5}</div>
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

        {standingsTab === "arca-drivers" && (
          <section style={{ ...glassCard, padding: isMobile ? 14 : 18, marginBottom: isMobile ? 14 : 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#006341", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>ARCA Series</div>
                <h2 style={{ margin: "4px 0 0", fontSize: isMobile ? 27 : 34, letterSpacing: -1.2 }}>Driver Standings</h2>
              </div>
              <button type="button" onClick={() => exportDriverStandingsCsv()} style={{ padding: "10px 16px", background: "#006341", color: "#fff", border: "none", borderRadius: 8, fontWeight: 900, fontSize: 12, cursor: "pointer" }}>📥 Export CSV</button>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {arcaStandings.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", background: "rgba(0,99,65,0.04)", borderRadius: 12 }}>
                  <div style={{ color: "#6b7280", fontWeight: 900 }}>No ARCA driver standings yet</div>
                </div>
              ) : (
                arcaStandings.map((driver, index) => (
                  <div key={driver.id} style={{ background: "linear-gradient(135deg, rgba(0,99,65,0.08), rgba(0,99,65,0.02))", border: "1px solid rgba(0,99,65,0.2)", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "auto 1fr auto auto auto auto", gap: 16, alignItems: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#006341", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000, fontSize: 18 }}>{index + 1}</div>
                      <div>
                        <div style={{ fontWeight: 950, fontSize: 16 }}>#{driver.number} {driver.name}</div>
                        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{driver.team}</div>
                      </div>
                      {!isMobile && (
                        <>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000, color: "#006341", fontSize: 18 }}>{driver.points}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>PTS</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.wins}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>W</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.top5}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>T5</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 1000 }}>{driver.dnfs}</div>
                            <div style={{ fontSize: 11, color: "#6b7280" }}>DNF</div>
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
                  <div style={{ color: "#86868b", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>
                    {seriesId === "arca" ? "ARCA Series" : "Cup Series"}
                  </div>
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
      </div>
    </div>
  );
}
