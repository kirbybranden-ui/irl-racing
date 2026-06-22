import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import { teamLogos, getTeamFullName, getTeamBranding } from "../data/teams";
import { trackOverviewData } from "../data/trackOverview";
import { dedupeDriversByNumber, isInactivePlaceholderDriver } from "../utils/driverHelpers";
import {
  getUpcomingRaceByDate,
  getSortedTracksByDate,
  isRaceCompleteByDateOrHistory,
} from "../utils/raceHelpers";
import {
  appShellStyle,
  pageContainerStyle,
  thStyle,
  tdStyle,
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


export default function StandingsPage({ drivers, teams, manufacturerStandings = [], seasonName = "", tracks = [], raceHistory = [] }) {
  const [standingsTab, setStandingsTab] = useState("drivers");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [selectedTrackInfo, setSelectedTrackInfo] = useState(null);
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
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  const sorted = dedupeDriversByNumber(drivers).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  const [leader, second, third] = sorted;
  const totalPoints = sorted.reduce((s, d) => s + (d.points || 0), 0);
  const totalWins = sorted.reduce((s, d) => s + (d.wins || 0), 0);
  const totalDnfs = sorted.reduce((s, d) => s + (d.dnfs || 0), 0);
  // Sort tracks by date and roll the upcoming race after 10:00 PM Eastern on race day.
  const completedRaces = new Set((raceHistory || []).map(r => r.raceName));
  const sortedTracks = getSortedTracksByDate(tracks);
  const nextRace = getUpcomingRaceByDate(sortedTracks);

  const autoOnesToWatch = sorted
    .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
    .map((driver) => {
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((r) => r.driverId === driver.id);
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
      const positionIndex = sorted.findIndex((d) => d.id === driver.id);
      const standingsRank = positionIndex >= 0 ? positionIndex + 1 : 99;

      const watchScore =
        (driver.points || 0) +
        (driver.wins || 0) * 35 +
        (driver.top3 || 0) * 12 +
        (driver.top5 || 0) * 7 +
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
      const driver = drivers.find((d) => Number(d.id) === Number(pick.driver_id));
      if (!driver) return null;
      const standingsRank = sorted.findIndex((d) => d.id === driver.id) + 1;
      const recentResults = (raceHistory || [])
        .slice(-3)
        .map((race) => {
          const result = race.results?.find((r) => r.driverId === driver.id);
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
  const onesToWatchMode = manualWatchDrivers.length > 0 ? "DIRECTOR PICKS" : "AUTO-UPDATES FROM RACE HISTORY";

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
      notes: "Add this track to trackOverviewData in App.jsx.",
      raceTip: "No iRacing recommendation has been added for this track yet.",
      imageUrl: "",
    };
  };
  const podiumCard = (driver, place) => {
    if (!driver) return null;
    const brand = getTeamBranding(driver.team);
    const isLeader = place === 1;
    return (
      <div style={{ flex: "1 1 280px", background: isLeader ? `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)` : "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", color: "white", border: isLeader ? `1px solid ${brand.accent}` : "1px solid #313947", borderRadius: 22, padding: 22, boxShadow: "0 12px 28px rgba(0,0,0,0.28)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -24, right: -24, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, opacity: 0.85, marginBottom: 6 }}>{isLeader ? "POINTS LEADER" : `P${place}`}</div>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>#{driver.number}</div>
          </div>
          {renderTeamBadge(driver.team, 54)}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{driver.name}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 18 }}>{getTeamFullName(driver.team)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
          {[{label:"POINTS",value:driver.points},{label:"WINS",value:driver.wins},{label:"TOP 3",value:driver.top3},{label:"TOP 5",value:driver.top5}].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: 12 }}>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{stat.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{stat.value}</div>
            </div>
          ))}
        </div>
        <button
          onClick={() => handleDriverClick(driver.number)}
          style={{ width: "100%", background: "rgba(0,0,0,0.3)", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
        >
          View Full Profile
        </button>
      </div>
    );
  };
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1520, margin: "0 auto", padding: 24 }}>
        {/* ── Featured Video Banner ──────────────────────────────────── */}
        {featuredVideo && (
          <div style={{ background: "linear-gradient(135deg, #12151c 0%, #0c0f14 100%)", border: "1px solid #d4af37", borderRadius: 20, overflow: "hidden", marginBottom: 22, boxShadow: "0 14px 40px rgba(212,175,55,0.15)" }}>
            <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <span style={{ fontSize: 18 }}>🎬</span>
              <div style={{ flex: 1 }}>
                {featuredVideo.title && <div style={{ fontSize: 16, fontWeight: 800 }}>{featuredVideo.title}</div>}
                {featuredVideo.description && <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>{featuredVideo.description}</div>}
              </div>
              <div style={{ fontSize: 11, opacity: 0.45 }}>{new Date(featuredVideo.uploaded_at).toLocaleDateString()}</div>
            </div>
            <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000" }}>
              {featuredVideo.video_url.includes("youtube.com") || featuredVideo.video_url.includes("youtu.be") ? (
                <iframe
                  src={featuredVideo.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : featuredVideo.video_url.includes("twitch.tv") ? (
                <iframe
                  src={`https://player.twitch.tv/?video=${featuredVideo.video_url.split("/").pop()}&parent=${window.location.hostname}`}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              ) : (
                <video
                  controls
                  crossOrigin="anonymous"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                  src={featuredVideo.video_url}
                />
              )}
            </div>
          </div>
        )}
        <div style={{ background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", border: "1px solid #313947", borderRadius: 24, padding: 26, marginBottom: 22, boxShadow: "0 14px 34px rgba(0,0,0,0.28)", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "absolute", right: -60, top: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <img src={logo} alt="League Logo" style={{ height: 64, filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.35))" }} />
              <div>
                <div style={{ fontSize: 38, fontWeight: 900, letterSpacing: 0.6, lineHeight: 1.05 }}>BUDWEISER CUP LEAGUE</div>
                <div style={{ fontSize: 16, opacity: 0.76, marginTop: 6 }}>Broadcast Standings</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 16, padding: "14px 18px", minWidth: 240 }}>
                <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>ACTIVE SEASON</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>{seasonName || "—"}</div>
              </div>
              <button onClick={() => (window.location.pathname = "/streams")} style={{ background: "#9146ff", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>📡 Streams</button>
              <button onClick={() => (window.location.pathname = "/discord")} style={{ background: "#5865f2", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>💬 Discord</button>
              <button onClick={() => (window.location.pathname = "/news")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>📰 News</button>
              <button onClick={() => (window.location.pathname = "/interviews")} style={{ background: "#c8102e", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🎤 Interviews</button>
              <button onClick={() => (window.location.pathname = "/paint-scheme-vote")} style={{ background: "#f97316", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🎨 Paint Scheme Vote</button>
              <button onClick={() => (window.location.pathname = "/bracket")} style={{ background: "#7c3aed", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 1000, cursor: "pointer", fontSize: 14 }}>🏆 In-Season Bracket</button>
              <button onClick={() => (window.location.pathname = "/vote")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 1000, cursor: "pointer", fontSize: 14 }}>🗳️ League Vote</button>
              <button onClick={() => (window.location.pathname = "/team-hq")} style={{ background: "#0f766e", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>🏢 Team HQ</button>
              <button onClick={() => (window.location.pathname = "/contracts")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>📄 Active Contracts</button>
              <button onClick={() => (window.location.pathname = "/submit-story")} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>✍️ Add Story</button>
              <button onClick={() => (window.location.pathname = "/notifications")} style={{ background: "#222936", color: "white", border: "1px solid #3a4453", borderRadius: 12, padding: "12px 18px", fontWeight: 800, cursor: "pointer", fontSize: 14 }}>🔔 Notifications</button>
              <button onClick={() => (window.location.pathname = "/message-center")} style={{ background: "#ef4444", color: "white", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>📩 Message Center</button>
              <button onClick={() => (window.location.pathname = "/chat")} style={{ background: "#22c55e", color: "#07110b", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>💬 League Chat</button>
              <button onClick={() => { sessionStorage.removeItem("bcl-admin-auth"); sessionStorage.removeItem("bcl-admin-auth-time"); localStorage.removeItem("bcl-admin-auth"); localStorage.removeItem("bcl-admin-auth-time"); window.location.pathname = "/admin"; }} style={{ background: "#111827", color: "#d4af37", border: "1px solid #d4af37", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", fontSize: 14 }}>🔐 Admin Portal</button>
</div> {/* ✅ CLOSE BUTTON ROW */}
          </div>
        </div>
        <LeagueTicker page="standings" />
        <AppUpdateBanner page="standings" />
        <PaintSchemeWinnerStandingsCard tracks={tracks} drivers={drivers} />
        <PreviousRaceWinnerStandingsCard />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[{label:"DRIVERS",value:sorted.length},{label:"TEAMS",value:teams.length},{label:"TOTAL WINS",value:totalWins},{label:"TOTAL DNFS",value:totalDnfs},{label:"POINTS AWARDED",value:totalPoints}].map((item) => (
            <div key={item.label} style={{ background: "linear-gradient(135deg, #131922 0%, #0f141b 100%)", border: "1px solid #2d3643", borderRadius: 18, padding: 18, boxShadow: "0 10px 24px rgba(0,0,0,0.18)" }}>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{item.value}</div>
            </div>
          ))}
          {/* Schedule tile */}
          <div
            onClick={() => setScheduleOpen(true)}
            style={{ background: "linear-gradient(135deg, #131922 0%, #0f141b 100%)", border: "1px solid #d4af37", borderRadius: 18, padding: 18, boxShadow: "0 10px 24px rgba(0,0,0,0.18)", cursor: "pointer", position: "relative", overflow: "hidden" }}
          >
            <div style={{ position: "absolute", top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
            <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 8 }}>🏁 SCHEDULE</div>
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>
              {nextRace ? nextRace.name : "Season Complete"}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              {nextRace?.date ? new Date(nextRace.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
            </div>
            <div style={{ fontSize: 11, color: "#d4af37", marginTop: 6, fontWeight: 700 }}>View full schedule →</div>
          </div>
        </div>
        {/* Schedule modal */}
        {scheduleOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
            <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 900 }}>🏁 Race Schedule</div>
                <button onClick={() => setScheduleOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {sortedTracks.map((track, i) => {
                  const completed = isRaceCompleteByDateOrHistory(track, completedRaces);
                  const isNext = track.name === nextRace?.name;
                  return (
                    <div key={track.name} onClick={() => setSelectedTrackInfo(getTrackOverview(track.name))} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", borderRadius: 12, background: isNext ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${isNext ? "#d4af37" : completed ? "#1a3a1a" : "#1e2530"}`, cursor: "pointer" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: completed ? "#16a34a" : isNext ? "#d4af37" : "#1e2530", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: completed || isNext ? "#000" : "#666", flexShrink: 0 }}>
                        {completed ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: completed ? "#4ade80" : isNext ? "#d4af37" : "white" }}>{track.name}</div>
                        {track.date && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{new Date(track.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</div>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: completed ? "#4ade80" : isNext ? "#f59e0b" : "#555" }}>
                        {completed ? "COMPLETE" : isNext ? "NEXT" : "UPCOMING"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {selectedTrackInfo && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: 20 }}>
            <div style={{ background: "#151a22", border: "1px solid #d4af37", borderRadius: 22, padding: 24, maxWidth: 920, width: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.55)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>iRACING TRACK INFO</div>
                  <div style={{ fontSize: 32, fontWeight: 900, marginTop: 6, lineHeight: 1.05 }}>{selectedTrackInfo.name}</div>
                  <div style={{ fontSize: 13, opacity: 0.65, marginTop: 5 }}>{selectedTrackInfo.location}</div>
                </div>
                <button onClick={() => setSelectedTrackInfo(null)} style={{ background: "none", border: "none", color: "white", fontSize: 30, cursor: "pointer", lineHeight: 1 }}>×</button>
              </div>

              {selectedTrackInfo.imageUrl && (
                <img
                  src={selectedTrackInfo.imageUrl}
                  alt={selectedTrackInfo.name}
                  style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 16, marginBottom: 18, border: "1px solid #2d3643", background: "#0f1319" }}
                />
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 18 }}>
                {[
                  { label: "TYPE", value: selectedTrackInfo.type },
                  { label: "LENGTH", value: selectedTrackInfo.length },
                  { label: "TURNS", value: selectedTrackInfo.turns },
                  { label: "BANKING", value: selectedTrackInfo.banking },
                  { label: "PIT SPEED", value: selectedTrackInfo.pitSpeed },
                  { label: "TIRE WEAR", value: selectedTrackInfo.tireWear },
                  { label: "RESTART ZONE", value: selectedTrackInfo.restartZone },
                ].map((item) => (
                  <div key={item.label} style={{ background: "#0f1319", border: "1px solid #2d3643", borderRadius: 14, padding: 14 }}>
                    <div style={{ fontSize: 11, opacity: 0.58, marginBottom: 5, fontWeight: 800 }}>{item.label}</div>
                    <div style={{ fontWeight: 800, lineHeight: 1.35 }}>{item.value || "—"}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 14, padding: 16, marginBottom: 14, lineHeight: 1.55 }}>
                <strong>Track Characteristics:</strong> {selectedTrackInfo.notes || "—"}
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2d3643", borderRadius: 14, padding: 16, lineHeight: 1.55 }}>
                <strong>Race Recommendations:</strong> {selectedTrackInfo.raceTip || selectedTrackInfo.notes || "—"}
              </div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          {podiumCard(leader, 1)}{podiumCard(second, 2)}{podiumCard(third, 3)}
        </div>

        {onesToWatch.length > 0 && (
          <div style={{ background: "linear-gradient(135deg, #171b22 0%, #0f1319 100%)", border: "1px solid rgba(212,175,55,0.45)", borderRadius: 22, padding: 20, marginBottom: 22, boxShadow: "0 14px 34px rgba(212,175,55,0.10)", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", right: -45, top: -45, width: 150, height: 150, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 14, flexWrap: "wrap", marginBottom: 16, position: "relative" }}>
              <div>
                <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 900, letterSpacing: 1 }}>BROADCAST FEATURE</div>
                <div style={{ fontSize: 28, fontWeight: 900, marginTop: 4 }}>🔥 Ones to Watch</div>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Drivers trending on points, recent finishes, wins, top-5 speed, and momentum.</div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800 }}>{onesToWatchMode}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, position: "relative" }}>
              {onesToWatch.map((driver, index) => {
                const brand = getTeamBranding(driver.team);
                return (
                  <div
                    key={driver.id}
                    onClick={() => handleDriverClick(driver.number)}
                    style={{ background: index === 0 ? `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)` : "#11161d", border: index === 0 ? `1px solid ${brand.accent}` : "1px solid #2a3240", borderRadius: 18, padding: 16, cursor: "pointer", boxShadow: "0 10px 24px rgba(0,0,0,0.22)", minHeight: 178 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.75 }}>#{index + 1} {driver.watchBadge || "WATCH LIST"}</div>
                      {renderTeamBadge(driver.team, 42)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(0,0,0,0.32)", border: "2px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                        {driver.number}
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{driver.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.72, marginTop: 2 }}>{getTeamFullName(driver.team)}</div>
                      </div>
                    </div>
                    <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 12, padding: "10px 12px", marginBottom: 10, fontSize: 13, fontWeight: 800 }}>
                      {driver.reason}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        { label: "RANK", value: `P${driver.standingsRank}` },
                        { label: "LAST", value: driver.latestFinish ? `P${driver.latestFinish}` : "—" },
                        { label: "AVG 3", value: driver.avgFinish < 99 ? driver.avgFinish.toFixed(1) : "—" },
                      ].map((stat) => (
                        <div key={stat.label} style={{ background: "rgba(0,0,0,0.22)", borderRadius: 10, padding: 8 }}>
                          <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 900 }}>{stat.label}</div>
                          <div style={{ fontSize: 16, fontWeight: 900 }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
          {[
            { key: "drivers", label: "Driver Standings" },
            { key: "teams", label: "Team Standings" },
            { key: "manufacturers", label: "Manufacturer Standings" },
            { key: "points", label: "Points & Penalties" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStandingsTab(tab.key)}
              style={{
                background: standingsTab === tab.key ? "#d4af37" : "#1f2937",
                color: standingsTab === tab.key ? "#111" : "white",
                border: standingsTab === tab.key ? "1px solid #d4af37" : "1px solid #3d4859",
                borderRadius: 12,
                padding: "12px 18px",
                fontWeight: 900,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {standingsTab === "drivers" && (
<div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Driver Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Team</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Team Name</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>DNFs</th><th style={thStyle}>FL</th><th style={thStyle}>Penalties</th></tr></thead>
              <tbody>
                {sorted.map((driver, index) => {
                  const isLeader = index === 0;
                  return (
                    <tr key={driver.id} style={{ background: isLeader ? "rgba(212,175,55,0.10)" : "transparent", cursor: "pointer" }} onClick={() => handleDriverClick(driver.number)}>
                      <td style={{ ...tdStyle, fontWeight: 900, color: isLeader ? "#f3d36a" : "white", fontSize: 16 }}>{index + 1}</td>
                      <td style={tdStyle}>{renderTeamBadge(driver.team, 38)}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{width: 36, height: 36, borderRadius: "50%", background: "#404854", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: "#fff", border: "2px solid #b8a059"}}>{driver.number}</div></td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>{driver.name}{driver.retired && <span style={{ marginLeft: 6, fontSize: 11, background: "#2a3140", color: "#f59e0b", borderRadius: 6, padding: "2px 6px", fontWeight: 700 }}>R</span>}</td>
                      <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team)}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{driver.points}</td>
                      <td style={tdStyle}>{driver.wins}</td>
                      <td style={tdStyle}>{driver.top3}</td>
                      <td style={tdStyle}>{driver.top5}</td>
                      <td style={tdStyle}>{driver.dnfs || 0}</td>
                      <td style={tdStyle}>{driver.fastestLaps || 0}</td>
                      <td style={{ ...tdStyle, color: (driver.totalPenalties || 0) > 0 ? "#f87171" : "inherit" }}>{driver.totalPenalties ? `-${driver.totalPenalties}` : "0"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        )}
        {standingsTab === "teams" && (
<div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Team Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Logo</th><th style={thStyle}>Team</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th></tr></thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.team} onClick={() => (window.location.href = `/team/${team.team}`)} style={{ cursor: "pointer" }}>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{index + 1}</td>
                    <td style={tdStyle}>{renderTeamBadge(team.team, 42)}</td>
                    <td style={{ ...tdStyle, fontWeight: 800 }}>{getTeamFullName(team.team)}</td>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{team.points}</td>
                    <td style={tdStyle}>{team.wins}</td>
                    <td style={tdStyle}>{team.top3}</td>
                    <td style={tdStyle}>{team.top5}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        )}
        {standingsTab === "manufacturers" && (
<div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Manufacturer Standings</div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>Manufacturer</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th><th style={thStyle}>Top 3</th><th style={thStyle}>Top 5</th><th style={thStyle}>Drivers</th></tr></thead>
              <tbody>
                {(() => {
                  const mfrs = {};
                  for (const d of drivers) {
                    const mfr = d.manufacturer || "Unknown";
                    if (!mfrs[mfr]) mfrs[mfr] = { manufacturer: mfr, points: 0, wins: 0, top3: 0, top5: 0, drivers: 0 };
                    mfrs[mfr].points += d.points || 0; mfrs[mfr].wins += d.wins || 0;
                    mfrs[mfr].top3 += d.top3 || 0; mfrs[mfr].top5 += d.top5 || 0; mfrs[mfr].drivers += 1;
                  }
                  return Object.values(mfrs).sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.manufacturer.localeCompare(b.manufacturer)).map((m, i) => (
                    <tr key={m.manufacturer} onClick={() => (window.location.href = `/manufacturer/${encodeURIComponent(m.manufacturer)}`)} style={{ cursor: "pointer" }}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{i + 1}</td>
                      <td style={{ ...tdStyle, fontWeight: 800 }}>{m.manufacturer}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{m.points}</td>
                      <td style={tdStyle}>{m.wins}</td>
                      <td style={tdStyle}>{m.top3}</td>
                      <td style={tdStyle}>{m.top5}</td>
                      <td style={tdStyle}>{m.drivers}</td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {standingsTab === "points" && (
          <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 22, padding: 18, marginBottom: 22, boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
            <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>Points & Penalties</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Race Finish Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Winner receives 55 points. 2nd receives 35 points, then points decrease by 1 per position through the field.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Stage Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Top 10 stage finishers receive points: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Penalty Points</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Penalty deductions increase by offense: 1st -5, 2nd -10, 3rd -15, 4th+ -25.</p>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                <h3 style={{ marginTop: 0, color: "#d4af37" }}>Total Formula</h3>
                <p style={{ opacity: 0.82, lineHeight: 1.5 }}>Finish Points + Stage Points + Bonuses - Penalties = Total Points.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
