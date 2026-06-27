import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import ncsLogo from "../assets/series/NCS.png";
import {
  supabase } from "../lib/supabase"; import { teamLogos,
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


export default function StandingsPage({ drivers = [], teams = [], manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [] }) {
  const [standingsTab, setStandingsTab] = useState("drivers");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [manualOnesToWatch, setManualOnesToWatch] = useState([]);

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
    padding: "22px clamp(14px, 2vw, 28px) 50px",
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

  const navItems = [
    { label: "Streams", subtitle: "Live broadcasts", icon: "📡", route: "/streams" },
    { label: "News", subtitle: "League stories", icon: "📰", route: "/news" },
    { label: "Interviews", subtitle: "Driver media", icon: "🎤", route: "/interviews" },
    { label: "Paint Scheme Vote", subtitle: "Weekly fan voting", icon: "🎨", route: "/paint-scheme-vote" },
    { label: "In-Season Bracket", subtitle: "Tournament hub", icon: "🏆", route: "/bracket" },
    { label: "League Vote", subtitle: "Polls and ballots", icon: "🗳️", route: "/vote" },
    { label: "Team HQ", subtitle: "Owner workspace", icon: "🏢", route: "/team-hq" },
    { label: "Active Contracts", subtitle: "Current agreements", icon: "📄", route: "/contracts" },
    { label: "Add Story", subtitle: "Submit content", icon: "✍️", route: "/submit-story" },
    { label: "Notifications", subtitle: "Public alerts", icon: "🔔", route: "/notifications" },
    { label: "Message Center", subtitle: "League inbox", icon: "📩", route: "/message-center" },
    { label: "League Chat", subtitle: "Community room", icon: "💬", route: "/chat" },
    { label: "Admin Portal", subtitle: "League control", icon: "🔐", route: "/admin" },
  ];

  const StatCard = ({ icon, label, value, detail, onClick, accent = "#007aff", tint = "rgba(0,122,255,0.12)" }) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...glassCard,
        textAlign: "left",
        padding: 18,
        minHeight: 132,
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
      <div style={{ marginTop: 16, fontSize: 11, fontWeight: 950, letterSpacing: 1.1, color: "#4b5563", textTransform: "uppercase" }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 24, lineHeight: 1.05, fontWeight: 950, letterSpacing: -0.5, color: "#111827" }}>{value || "—"}</div>
      {detail && <div style={{ marginTop: 6, fontSize: 13, color: "#374151", fontWeight: 750 }}>{detail}</div>}
    </button>
  );

  const DriverRow = ({ driver, index }) => {
    const brand = getTeamBranding(driver.team);
    const isLeader = index === 0;
    return (
      <button
        type="button"
        onClick={() => handleDriverClick(driver.number)}
        className="bcl-driver-row"
        style={{
          border: "1px solid rgba(15,23,42,0.08)",
          background: isLeader ? "linear-gradient(135deg, rgba(255,214,10,0.32), rgba(255,255,255,0.96))" : "rgba(255,255,255,0.94)",
          borderRadius: 24,
          padding: 16,
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          boxShadow: isLeader ? "0 18px 44px rgba(212,175,55,0.18)" : "0 12px 30px rgba(15,23,42,0.07)",
          display: "grid",
          gridTemplateColumns: "auto auto minmax(180px, 1.4fr) repeat(6, minmax(70px, 0.65fr)) auto",
          gap: 12,
          alignItems: "center",
          color: "#1d1d1f",
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 14, background: isLeader ? "#1d1d1f" : "#f2f2f7", color: isLeader ? "#fff" : "#1d1d1f", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>
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
        {[
          ["PTS", driver.points],
          ["W", driver.wins],
          ["T3", driver.top3],
          ["T5", driver.top5],
          ["DNF", driver.dnfs || 0],
          ["PEN", driver.totalPenalties ? `-${driver.totalPenalties}` : "0"],
        ].map(([label, value]) => (
          <div key={label} style={{ background: "#f5f5f7", borderRadius: 16, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#86868b", fontWeight: 950 }}>{label}</div>
            <div style={{ marginTop: 3, fontSize: 18, fontWeight: 950, color: label === "PEN" && String(value).startsWith("-") ? "#dc2626" : "#1d1d1f" }}>{value}</div>
          </div>
        ))}
        <div style={{ color: "#86868b", fontSize: 22, fontWeight: 900 }}>›</div>
      </button>
    );
  };

  const CompactDriverCard = ({ driver, place }) => {
    if (!driver) return null;
    const brand = getTeamBranding(driver.team);
    return (
      <button
        type="button"
        onClick={() => handleDriverClick(driver.number)}
        style={{
          ...glassCard,
          padding: 18,
          textAlign: "left",
          cursor: "pointer",
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
      </button>
    );
  };

  const TeamCard = ({ team, index }) => {
    const brand = getTeamBranding(team.team);
    return (
      <button
        type="button"
        onClick={() => (window.location.href = `/team/${team.team}`)}
        style={{
          ...glassCard,
          padding: 18,
          textAlign: "left",
          cursor: "pointer",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          gap: 14,
          alignItems: "center",
          color: "#1d1d1f",
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 14, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 950 }}>{index + 1}</div>
        {renderTeamBadge(team.team, 50)}
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
      </button>
    );
  };

  const ManufacturerCard = ({ item, index }) => {
    const colorMap = { Toyota: "#ef4444", Chevrolet: "#f59e0b", Ford: "#2563eb" };
    const color = colorMap[item.manufacturer] || "#6366f1";
    return (
      <button
        type="button"
        onClick={() => (window.location.href = `/manufacturer/${encodeURIComponent(item.manufacturer)}`)}
        style={{
          ...glassCard,
          padding: 20,
          textAlign: "left",
          cursor: "pointer",
          minHeight: 180,
          color: "#1d1d1f",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", right: -42, top: -42, width: 140, height: 140, borderRadius: "50%", background: `${color}1f` }} />
        <div style={{ width: 46, height: 46, borderRadius: 17, background: `${color}20`, color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 1000 }}>P{index + 1}</div>
        <div style={{ marginTop: 18, fontSize: 28, fontWeight: 1000 }}>{item.manufacturer}</div>
        <div style={{ marginTop: 4, color: "#6e6e73", fontWeight: 750 }}>{item.drivers || 0} drivers • {item.wins || 0} wins</div>
        <div style={{ marginTop: 16, fontSize: 34, fontWeight: 1000 }}>{item.points || 0}</div>
        <div style={{ color: "#86868b", fontWeight: 900, fontSize: 12 }}>MANUFACTURER POINTS</div>
      </button>
    );
  };

  const pointCards = [
    { title: "Race Finish Points", icon: "🏁", text: "Winner receives 55 points. Second receives 35 points, then points decrease by one per position through the field." },
    { title: "Stage Points", icon: "⭐", text: "Top 10 stage finishers receive 10, 9, 8, 7, 6, 5, 4, 3, 2, and 1 point." },
    { title: "Penalty Points", icon: "⚠️", text: "Penalty deductions increase by offense: 1st -5, 2nd -10, 3rd -15, and 4th or more -25." },
    { title: "Total Formula", icon: "🧮", text: "Finish Points + Stage Points + Bonuses - Penalties = Total Points." },
  ];

  return (
    <div style={applePage}>
      <div style={container}>
        <style>{`
          @media (max-width: 920px) {
            .bcl-driver-row { grid-template-columns: 1fr !important; min-width: 0 !important; }
            .bcl-driver-row-stats { grid-template-columns: repeat(3, 1fr) !important; }
          }
          .bcl-apple-button:hover { transform: translateY(-2px); box-shadow: 0 18px 45px rgba(15,23,42,0.12) !important; }
        `}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
          <button type="button" onClick={() => (window.location.pathname = "/")} style={{ ...pillButton, display: "inline-flex", alignItems: "center", gap: 8 }}>
            ← Series Hub
          </button>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button type="button" onClick={() => (window.location.pathname = "/message-center")} style={{ ...pillButton, background: "linear-gradient(135deg, #007aff, #5856d6)", color: "#fff", border: "none" }}>📩 Messages</button>
            <button type="button" onClick={() => setPublicMenuOpen(true)} style={{ ...pillButton, background: "rgba(255,255,255,0.96)", color: "#111827" }}>☰ Menu</button>
          </div>
        </div>

        {publicMenuOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999999, display: "flex" }}>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setPublicMenuOpen(false)}
              style={{ position: "absolute", inset: 0, border: "none", background: "rgba(15,23,42,0.28)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", cursor: "default" }}
            />
            <aside style={{ position: "relative", width: "min(390px, calc(100vw - 28px))", height: "calc(100vh - 28px)", margin: 14, borderRadius: 30, background: "rgba(255,255,255,0.90)", border: "1px solid rgba(255,255,255,0.86)", boxShadow: "0 30px 90px rgba(15,23,42,0.26)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", padding: 18, overflowY: "auto", color: "#1d1d1f" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#86868b", fontWeight: 950, letterSpacing: 1.2, textTransform: "uppercase" }}>Cup Series</div>
                  <div style={{ fontSize: 28, fontWeight: 1000, letterSpacing: -0.8 }}>Menu</div>
                </div>
                <button type="button" onClick={() => setPublicMenuOpen(false)} style={{ width: 38, height: 38, borderRadius: 999, border: "1px solid rgba(15,23,42,0.08)", background: "#f5f5f7", color: "#1d1d1f", fontSize: 22, fontWeight: 900, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => (window.location.pathname = item.route)}
                    style={{ display: "grid", gridTemplateColumns: "44px 1fr auto", gap: 12, alignItems: "center", width: "100%", textAlign: "left", border: "1px solid rgba(15,23,42,0.07)", background: "rgba(255,255,255,0.72)", borderRadius: 20, padding: 12, cursor: "pointer", color: "#1d1d1f", boxShadow: "0 10px 25px rgba(15,23,42,0.05)" }}
                  >
                    <span style={{ width: 44, height: 44, borderRadius: 16, background: "#f5f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{item.icon}</span>
                    <span>
                      <span style={{ display: "block", fontSize: 16, fontWeight: 950 }}>{item.label}</span>
                      <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "#86868b", fontWeight: 750 }}>{item.subtitle}</span>
                    </span>
                    <span style={{ color: "#86868b", fontSize: 22, fontWeight: 900 }}>›</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        )}

        <section style={{ ...glassCard, padding: "clamp(18px, 2.5vw, 26px)", marginBottom: 18, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 88% 0%, rgba(212,175,55,0.16), transparent 34%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(240px, 0.62fr)", gap: 20, alignItems: "center" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 999, background: "rgba(255,255,255,0.72)", border: "1px solid rgba(15,23,42,0.07)", fontSize: 12, color: "#6e6e73", fontWeight: 950, letterSpacing: 1.2, textTransform: "uppercase" }}>
                🏁 Cup Series Standings
              </div>
              <img
                src={ncsLogo}
                alt="NASCAR Cup Series"
                style={{
                  display: "block",
                  width: "min(420px, 92vw)",
                  maxHeight: 150,
                  objectFit: "contain",
                  margin: "18px 0 10px",
                  filter: "drop-shadow(0 18px 34px rgba(15,23,42,0.16))",
                }}
              />
              <p style={{ margin: 0, maxWidth: 720, color: "#6e6e73", fontSize: "clamp(15px, 1.7vw, 18px)", lineHeight: 1.45, fontWeight: 720 }}>
                Championship standings, race weekend status, team performance, and manufacturer battles in one clean Cup Series view.
              </p>
            </div>
            <div style={{ ...glassCard, padding: 18, background: "rgba(255,255,255,0.62)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.5), 0 18px 50px rgba(15,23,42,0.08)" }}>
              <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 950, letterSpacing: 1.15, textTransform: "uppercase" }}>Race Weekend</div>
              <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.02, fontWeight: 1000 }}>{nextRace?.name || "Season Complete"}</div>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 18 }}>
          <StatCard icon="🏆" label="Active Season" value={seasonName || "Season"} detail={`${completedRaceCount} races entered`} accent="#ff9f0a" tint="rgba(255,159,10,0.16)" />
          <StatCard icon="👑" label="Points Leader" value={leader ? `#${leader.number} ${leader.name}` : "—"} detail={leader ? `${leader.points} points` : "No leader yet"} onClick={() => leader && handleDriverClick(leader.number)} accent="#5856d6" tint="rgba(88,86,214,0.14)" />
          <StatCard icon="👥" label="Active Drivers" value={sorted.length} detail={`${teams.length} teams`} accent="#34c759" tint="rgba(52,199,89,0.14)" />
          <StatCard icon="🏁" label="Current Race" value={nextRace?.name || "Complete"} detail={nextRace?.date ? new Date(nextRace.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Season finished"} onClick={() => setScheduleOpen(true)} accent="#007aff" tint="rgba(0,122,255,0.14)" />
          <StatCard icon="🍾" label="Latest Winner" value={latestWinner ? `#${latestWinner.number || latestWinner.driverNumber || ""} ${latestWinner.name || latestWinner.driverName || "Winner"}` : "—"} detail={latestRace?.raceName || "No race posted"} accent="#ff3b30" tint="rgba(255,59,48,0.12)" />
        </div>

        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
        <PreviousRaceWinnerStandingsCard />

        <button
          type="button"
          onClick={() => (window.location.pathname = "/driver-market")}
          style={{
            ...glassCard,
            width: "100%",
            textAlign: "left",
            padding: 22,
            marginBottom: 18,
            cursor: "pointer",
            color: "#1d1d1f",
            background: "linear-gradient(135deg, rgba(255,255,255,0.90), rgba(255,248,220,0.86))",
          }}
        >
          <div style={{ color: "#b45309", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Silly Season</div>
          <div style={{ marginTop: 6, fontSize: 30, fontWeight: 1000 }}>🔥 Driver Market</div>
          <div style={{ marginTop: 5, color: "#6e6e73", fontWeight: 720 }}>Scout drivers, track current-team re-sign interest, and follow the market before signing day.</div>
        </button>

        {onesToWatch.length > 0 && (
          <section style={{ ...glassCard, padding: 20, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <div style={{ color: "#b45309", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Broadcast Feature</div>
                <h2 style={{ margin: "5px 0 0", fontSize: 34, letterSpacing: -1.2 }}>🔥 Ones to Watch</h2>
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
          {[
            { key: "drivers", label: "Driver Standings", icon: "👤" },
            { key: "teams", label: "Teams", icon: "🏢" },
            { key: "manufacturers", label: "Manufacturers", icon: "🏭" },
            { key: "points", label: "Points System", icon: "📊" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStandingsTab(tab.key)}
              style={{
                flex: "1 1 180px",
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

        {standingsTab === "drivers" && (
          <section style={{ ...glassCard, padding: 18, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <div style={{ color: "#2563eb", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Championship Table</div>
                <h2 style={{ margin: "4px 0 0", fontSize: 34, letterSpacing: -1.2 }}>Driver Standings</h2>
              </div>
              <div style={{ color: "#6e6e73", fontWeight: 850 }}>{sorted.length} active drivers • {totalPoints} points awarded</div>
            </div>
            <div style={{ display: "grid", gap: 10, overflowX: "auto", paddingBottom: 2 }}>
              {sorted.map((driver, index) => <DriverRow key={driver.id || driver.number} driver={driver} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "teams" && (
          <section style={{ ...glassCard, padding: 18, marginBottom: 20 }}>
            <div style={{ color: "#34c759", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Organizations</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: 34, letterSpacing: -1.2 }}>Team Standings</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {teamRows.map((team, index) => <TeamCard key={team.team || index} team={team} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "manufacturers" && (
          <section style={{ ...glassCard, padding: 18, marginBottom: 20 }}>
            <div style={{ color: "#ff9f0a", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Manufacturer Battle</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: 34, letterSpacing: -1.2 }}>Manufacturer Standings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {manufacturerRows.map((item, index) => <ManufacturerCard key={item.manufacturer || index} item={item} index={index} />)}
            </div>
          </section>
        )}

        {standingsTab === "points" && (
          <section style={{ ...glassCard, padding: 18, marginBottom: 20 }}>
            <div style={{ color: "#5856d6", fontSize: 12, fontWeight: 1000, letterSpacing: 1.3, textTransform: "uppercase" }}>Rules Reference</div>
            <h2 style={{ margin: "4px 0 16px", fontSize: 34, letterSpacing: -1.2 }}>Points & Penalties</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
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
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.34)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ ...glassCard, background: "rgba(255,255,255,0.92)", padding: 22, maxWidth: 640, width: "100%", maxHeight: "84vh", overflowY: "auto" }}>
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

        {selectedTrackInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.38)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
            <div style={{ ...glassCard, background: "rgba(255,255,255,0.94)", padding: 22, maxWidth: 940, width: "100%", maxHeight: "88vh", overflowY: "auto" }}>
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
