import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import teamLogoB2J from "../assets/teams/B2J.png";
import teamLogoMER from "../assets/teams/ME.png";
import teamLogoNLM from "../assets/teams/NLM.png";
import teamLogoMMS from "../assets/teams/MMS.png";
import teamLogoIND from "../assets/teams/IND.png";
import teamLogo19XI from "../assets/teams/19XI.png";
import teamLogoBWR from "../assets/teams/BWR.png";
import teamLogoBXM from "../assets/teams/BXM.png";

const ADMIN_ACCESS_CODE = "BCLADMINPASSWORD2026";
const JPC_RACING_YOUTUBE_URL = "https://youtube.com/@jpc_racing/live";
const JPC_RACING_PROFILE_URL = "https://youtube.com/@jpc_racing";

const teamLogos = {
  B2J: teamLogoB2J,
  "B2J Motorsports": teamLogoB2J,
  "B2J MOTORSPORTS": teamLogoB2J,
  MER: teamLogoMER,
  "ME Racing": teamLogoMER,
  NLM: teamLogoNLM,
  "Nine Line Motorsports": teamLogoNLM,
  MMS: teamLogoMMS,
  "Mayhem Motorsports": teamLogoMMS,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  BWR: teamLogoBWR,
  "Big Wheel Racing": teamLogoBWR,
  BXM: teamLogoBXM,
  "BayouX Motorsports": teamLogoBXM,
};

const teamFullNames = {
  B2J: "B2J Motorsports",
    MER: "ME Racing",
    NLM: "Nine Line Motorsports",
  MMS: "Mayhem Motorsports",
    BWR: "Big Wheel Racing",
  BXM: "BayouX Motorsports",
  "19XI": "19XI Racing",
  IND: "Independent",
  Independent: "Independent",
};

const DEFAULT_STREAM_FORM = {
  id: "",
  driver_id: "",
  driver_number: "",
  driver_name: "",
  display_name: "",
  title: "",
  team: "",
  manufacturer: "",
  platform: "twitch",
  stream_type: "driver",
  channel_name: "",
  stream_url: "",
  youtube_url: "",
  race_name: "",
  is_active: true,
  featured: false,
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}


const CLOSED_TEAM_KEYS = new Set(["WSM", "WYATT SICK6 MOTORSPORTS", "Wyatt Sick6 Motorsports"]);
const OUT_DRIVER_IDS = new Set([13, 28, 66]);
const OUT_DRIVER_NAMES = new Set(["racingis_life87", "vanilla04gorilla", "undeadhelliday", "vtfan_25"]);

function realignLeagueDriver(driver) {
  if (!driver) return null;
  const id = Number(driver.id ?? driver.driver_id);
  const nameKey = String(driver.name ?? driver.driver_name ?? "").trim().toLowerCase();
  if (OUT_DRIVER_IDS.has(id) || OUT_DRIVER_NAMES.has(nameKey)) return null;
  if (id === 6 || nameKey === "kapsig") return { ...driver, number: 14, team: "MER", manufacturer: "Chevrolet" };
  if (id === 7 || id === 46 || nameKey === "kevdinho7" || nameKey === "bigdiehl21") return { ...driver, team: "MER", manufacturer: "Chevrolet" };
  if (id === 5 || nameKey === "ixgusty") return { ...driver, number: 3, team: "19XI", manufacturer: "Toyota" };
  if (id === 21 || nameKey === "yinzermob_86") return { ...driver, number: 86, team: "MER", manufacturer: "Chevrolet" };
  if (id === 34 || nameKey === "cajunthrottle28") return { ...driver, number: 48, driver_number: driver.driver_number !== undefined ? 48 : driver.driver_number, team: "BXM", manufacturer: "Chevrolet" };
  if (id === 54 || id === 35 || id === 102 || ["thecruiser54", "knighttrain41", "ghostracer388"].includes(nameKey)) return { ...driver, team: "BXM", manufacturer: "Chevrolet" };
  if (CLOSED_TEAM_KEYS.has(String(driver.team || "").trim())) return { ...driver, team: "Independent" };
  return driver;
}

function realignLeagueDrivers(drivers = []) {
  return (Array.isArray(drivers) ? drivers : []).map(realignLeagueDriver).filter(Boolean);
}


function getTeamFullName(team) {
  return teamFullNames[team] || team || "Independent";
}

function getTeamLogo(team) {
  return teamLogos[team] || teamLogos[getTeamFullName(team)] || teamLogos.Independent;
}

function getDriverKey(driver) {
  return String(driver?.id || driver?.number || driver?.name || "");
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return Boolean(value);
}

function getStreamDriver(stream, activeDrivers = []) {
  const driverNumber = String(stream?.driver_number || stream?.number || "").trim();
  const driverId = String(stream?.driver_id || "").trim();
  const driverName = normalize(stream?.driver_name || stream?.display_name || stream?.name);

  return activeDrivers.find((driver) => {
    if (driverId && String(driver.id) === driverId) return true;
    if (driverNumber && String(driver.number) === driverNumber) return true;
    if (driverName && normalize(driver.name) === driverName) return true;
    return false;
  }) || null;
}

function getTwitchEmbed(channel) {
  if (!channel) return "";
  const clean = String(channel).replace("https://www.twitch.tv/", "").replace("https://twitch.tv/", "").split("/")[0].trim();
  const hostname = typeof window !== "undefined" ? window.location.hostname : "irl-racing.vercel.app";
  return `https://player.twitch.tv/?channel=${encodeURIComponent(clean)}&parent=${hostname}`;
}

function isYouTubeChannelLiveUrl(urlOrId) {
  const raw = String(urlOrId || "").trim().toLowerCase();
  return raw.includes("youtube.com/@") && raw.endsWith("/live");
}

function getYouTubeEmbed(urlOrId) {
  if (!urlOrId) return "";
  const raw = String(urlOrId).trim();
  if (isYouTubeChannelLiveUrl(raw)) return "";
  let id = raw;

  try {
    const url = new URL(raw);
    if (url.hostname.includes("youtu.be")) id = url.pathname.replace("/", "");
    else if (url.searchParams.get("v")) id = url.searchParams.get("v");
    else if (url.pathname.includes("/embed/")) id = url.pathname.split("/embed/")[1]?.split("/")[0] || raw;
    else if (url.pathname.includes("/live/")) id = url.pathname.split("/live/")[1]?.split("/")[0] || raw;
  } catch {
    id = raw;
  }

  return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
}

function getExternalLink(stream) {
  const platform = String(stream?.platform || "twitch").toLowerCase();
  if (platform === "youtube") return stream.youtube_url || stream.stream_url || stream.channel_name || "";
  const channel = stream.channel_name || stream.stream_url || "";
  if (String(channel).startsWith("http")) return channel;
  return channel ? `https://www.twitch.tv/${channel}` : "";
}

function getEmbedSrc(stream) {
  const platform = String(stream?.platform || "twitch").toLowerCase();
  if (platform === "youtube") return getYouTubeEmbed(stream.youtube_url || stream.stream_url || stream.channel_name);
  return getTwitchEmbed(stream.channel_name || stream.stream_url);
}

function getPlatformLabel(stream) {
  const platform = String(stream?.platform || "twitch").toLowerCase();
  if (platform === "youtube") return "YOUTUBE";
  return "TWITCH";
}

export default function StreamPage({
  drivers = [],
  teams = [],
  manufacturers = [],
  activeRace = null,
  selectedTrack = null,
}) {
  const [streams, setStreams] = useState([]);
  const [banners, setBanners] = useState([]);
  const [teamFilter, setTeamFilter] = useState("all");
  const [manufacturerFilter, setManufacturerFilter] = useState("all");
  const [sortMode, setSortMode] = useState("points");
  const [selectedFeaturedId, setSelectedFeaturedId] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(() => sessionStorage.getItem("stream-admin-unlocked") === "true");
  const [adminCode, setAdminCode] = useState("");
  const [streamForm, setStreamForm] = useState(DEFAULT_STREAM_FORM);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showMobileAdmin, setShowMobileAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const handleChange = () => setIsMobile(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener?.("change", handleChange);
    return () => mediaQuery.removeEventListener?.("change", handleChange);
  }, []);

  const activeDrivers = useMemo(() => realignLeagueDrivers(drivers), [drivers]);

  useEffect(() => {
    loadStreams();
    loadBanners();
  }, []);

  async function loadStreams() {
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Stream load error:", error);
      setStreams([]);
      return;
    }

    setStreams(data || []);
  }

  async function loadBanners() {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("News ticker load error:", error);
      setBanners([]);
      return;
    }

    setBanners(data || []);
  }

  const streamsWithDefaults = useMemo(() => {
    const hasJpc = streams.some((stream) => {
      const number = String(stream.driver_number || stream.number || "").trim();
      const name = normalize(stream.driver_name || stream.display_name || stream.title || stream.name);
      return number === "97" || name.includes("jpc_racing") || name.includes("jpc racing");
    });

    if (hasJpc) return streams;

    return [
      ...streams,
      {
        id: "jpc-racing-youtube-fallback",
        driver_id: 27,
        driver_number: "97",
        driver_name: "JPC_Racing",
        display_name: "#97 JPC_Racing",
        title: "JPC_Racing YouTube Live",
        team: "BWR",
        manufacturer: "Ford",
        platform: "youtube",
        stream_type: "driver",
        channel_name: JPC_RACING_PROFILE_URL,
        stream_url: JPC_RACING_YOUTUBE_URL,
        youtube_url: JPC_RACING_YOUTUBE_URL,
        race_name: activeRace?.name || selectedTrack?.name || null,
        is_active: true,
        featured: false,
        fallback: true,
      },
    ];
  }, [streams, activeRace?.name, selectedTrack?.name]);

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0));
  }, [drivers]);

  const driverStreamRows = useMemo(() => {
    return sortedDrivers.map((driver) => {
      const stream = streamsWithDefaults.find((item) => {
        const streamDriver = getStreamDriver(item, drivers);
        return streamDriver && String(streamDriver.id) === String(driver.id);
      }) || streamsWithDefaults.find((item) => String(item.driver_number || "") === String(driver.number || ""));

      return {
        driver,
        stream,
        isLive: Boolean(stream?.is_active),
        team: driver.team || stream?.team || "Independent",
        manufacturer: driver.manufacturer || stream?.manufacturer || "",
      };
    });
  }, [sortedDrivers, streamsWithDefaults, drivers]);

  const activeStreams = streamsWithDefaults.filter((stream) => stream.is_active !== false);

  const featuredStreams = useMemo(() => {
    const featured = activeStreams.filter((stream) => stream.featured || stream.stream_type === "official" || stream.stream_type === "watch_party");
    return featured.length ? featured : activeStreams.slice(0, 1);
  }, [activeStreams]);

  const selectedFeatured = useMemo(() => {
    if (selectedFeaturedId) return activeStreams.find((stream) => String(stream.id) === String(selectedFeaturedId)) || featuredStreams[0] || null;
    return featuredStreams[0] || null;
  }, [selectedFeaturedId, activeStreams, featuredStreams]);

  const teamOptions = useMemo(() => {
    const teamSet = new Set();
    [...drivers, ...streamsWithDefaults].forEach((item) => {
      const team = item.team || getStreamDriver(item, drivers)?.team;
      if (team && team !== "Independent" && team !== "IND") teamSet.add(team);
    });
    return Array.from(teamSet).sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [drivers, streamsWithDefaults]);

  const manufacturerOptions = useMemo(() => {
    const mfrSet = new Set();
    [...drivers, ...streamsWithDefaults].forEach((item) => {
      const mfr = item.manufacturer || getStreamDriver(item, drivers)?.manufacturer;
      if (mfr) mfrSet.add(mfr);
    });
    return Array.from(mfrSet).sort();
  }, [drivers, streamsWithDefaults]);

  const filteredRows = useMemo(() => {
    const rows = driverStreamRows.filter(({ driver, team, manufacturer }) => {
      const teamOk = teamFilter === "all" || normalize(team) === normalize(teamFilter) || normalize(getTeamFullName(team)) === normalize(teamFilter);
      const mfrOk = manufacturerFilter === "all" || normalize(manufacturer) === normalize(manufacturerFilter);
      return teamOk && mfrOk && !String(driver?.name || "").toLowerCase().startsWith("inactive-");
    });

    return rows.sort((a, b) => {
      if (sortMode === "live") return Number(b.isLive) - Number(a.isLive) || (Number(b.driver.points) || 0) - (Number(a.driver.points) || 0);
      if (sortMode === "number") return (Number(a.driver.number) || 9999) - (Number(b.driver.number) || 9999);
      if (sortMode === "name") return String(a.driver.name || "").localeCompare(String(b.driver.name || ""));
      if (sortMode === "team") return getTeamFullName(a.team).localeCompare(getTeamFullName(b.team));
      return (Number(b.driver.points) || 0) - (Number(a.driver.points) || 0);
    });
  }, [driverStreamRows, teamFilter, manufacturerFilter, sortMode]);

  const liveDriverRows = filteredRows.filter((row) => row.isLive);
  const leader = sortedDrivers[0];

  const tickerMessages = banners.length > 0
    ? banners.map((story) => `${story.title || "League Story"} — ${story.summary || story.message || story.body || ""}`)
    : [
        "Budweiser Cup League Broadcast Center",
        "Driver POVs, watch parties, team filters, manufacturer filters, and live race coverage",
      ];

  function unlockAdmin(event) {
    event?.preventDefault?.();
    if (adminCode.trim() !== ADMIN_ACCESS_CODE) {
      setAdminError("Invalid admin code.");
      return;
    }
    sessionStorage.setItem("stream-admin-unlocked", "true");
    setAdminUnlocked(true);
    setAdminCode("");
    setAdminError("");
  }

  function updateStreamForm(field, value) {
    setStreamForm((current) => ({ ...current, [field]: value }));
  }

  function selectDriverForStream(driverId) {
    const driver = drivers.find((item) => String(item.id) === String(driverId));
    if (!driver) {
      setStreamForm((current) => ({ ...current, driver_id: "", driver_number: "", driver_name: "" }));
      return;
    }

    setStreamForm((current) => ({
      ...current,
      driver_id: String(driver.id || ""),
      driver_number: String(driver.number || ""),
      driver_name: driver.name || "",
      display_name: current.display_name || `#${driver.number} ${driver.name}`,
      team: driver.team || current.team || "",
      manufacturer: driver.manufacturer || current.manufacturer || "",
    }));
  }

  function editStream(stream) {
    const driver = getStreamDriver(stream, activeDrivers);
    setStreamForm({
      ...DEFAULT_STREAM_FORM,
      id: stream.id || "",
      driver_id: String(stream.driver_id || driver?.id || ""),
      driver_number: String(stream.driver_number || driver?.number || ""),
      driver_name: stream.driver_name || driver?.name || "",
      display_name: stream.display_name || stream.title || stream.channel_name || "",
      title: stream.title || "",
      team: stream.team || driver?.team || "",
      manufacturer: stream.manufacturer || driver?.manufacturer || "",
      platform: stream.platform || "twitch",
      stream_type: stream.stream_type || "driver",
      channel_name: stream.channel_name || "",
      stream_url: stream.stream_url || "",
      youtube_url: stream.youtube_url || "",
      race_name: stream.race_name || activeRace?.name || selectedTrack?.name || "",
      is_active: stream.is_active !== false,
      featured: Boolean(stream.featured),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveStream(event) {
    event?.preventDefault?.();
    setAdminMessage("");
    setAdminError("");

    const platform = String(streamForm.platform || "twitch").toLowerCase();
    const channelOrUrl = platform === "youtube"
      ? String(streamForm.youtube_url || streamForm.stream_url || streamForm.channel_name || "").trim()
      : String(streamForm.channel_name || streamForm.stream_url || "").trim();

    if (!channelOrUrl) {
      setAdminError(platform === "youtube" ? "Add a YouTube URL or video ID." : "Add a Twitch channel name.");
      return;
    }

    const driver = drivers.find((item) => String(item.id) === String(streamForm.driver_id));
    const payload = {
      driver_id: streamForm.driver_id || driver?.id || null,
      driver_number: streamForm.driver_number || driver?.number || null,
      driver_name: streamForm.driver_name || driver?.name || null,
      display_name: streamForm.display_name || streamForm.title || channelOrUrl,
      title: streamForm.title || streamForm.display_name || channelOrUrl,
      team: streamForm.team || driver?.team || null,
      manufacturer: streamForm.manufacturer || driver?.manufacturer || null,
      platform,
      stream_type: streamForm.stream_type || "driver",
      channel_name: platform === "youtube" ? streamForm.channel_name || null : channelOrUrl.replace("https://www.twitch.tv/", "").replace("https://twitch.tv/", ""),
      stream_url: streamForm.stream_url || (platform === "youtube" ? channelOrUrl : null),
      youtube_url: platform === "youtube" ? channelOrUrl : streamForm.youtube_url || null,
      race_name: streamForm.race_name || activeRace?.name || selectedTrack?.name || null,
      is_active: parseBoolean(streamForm.is_active),
      featured: parseBoolean(streamForm.featured),
      updated_at: new Date().toISOString(),
    };

    setBusy(true);
    const query = streamForm.id
      ? supabase.from("streams").update(payload).eq("id", streamForm.id).select().single()
      : supabase.from("streams").insert([{ ...payload, created_at: new Date().toISOString() }]).select().single();

    const { error } = await query;
    setBusy(false);

    if (error) {
      console.error("Stream save error:", error);
      setAdminError("Could not save stream. Check streams table columns and RLS policies.");
      return;
    }

    setStreamForm(DEFAULT_STREAM_FORM);
    setAdminMessage(streamForm.id ? "Stream updated." : "Stream added.");
    await loadStreams();
  }

  async function toggleStreamActive(stream) {
    const { error } = await supabase
      .from("streams")
      .update({ is_active: !stream.is_active, updated_at: new Date().toISOString() })
      .eq("id", stream.id);

    if (error) {
      console.error("Stream active toggle error:", error);
      setAdminError("Could not update stream status.");
      return;
    }
    await loadStreams();
  }

  async function setFeaturedStream(stream) {
    setAdminError("");
    if (stream.fallback) {
      setSelectedFeaturedId(String(stream.id));
      return;
    }
    const { error: clearError } = await supabase.from("streams").update({ featured: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    if (clearError) console.warn("Could not clear featured streams:", clearError);

    const { error } = await supabase
      .from("streams")
      .update({ featured: true, is_active: true, updated_at: new Date().toISOString() })
      .eq("id", stream.id);

    if (error) {
      console.error("Featured stream error:", error);
      setAdminError("Could not set featured stream.");
      return;
    }
    setSelectedFeaturedId(String(stream.id));
    await loadStreams();
  }

  if (isMobile) {
    const mobileFeatured = selectedFeatured || activeStreams[0] || null;

    return (
      <div style={mobileStyles.page}>
        <TickerBar messages={tickerMessages} />

        <header style={mobileStyles.header}>
          <div style={mobileStyles.kicker}>BUDWEISER CUP LEAGUE</div>
          <div style={mobileStyles.title}>Streams</div>
          <div style={mobileStyles.subtitle}>Driver POVs, official feeds, Twitch, YouTube, and watch parties.</div>

          <div style={mobileStyles.summaryRow}>
            <div style={mobileStyles.summaryCard}>
              <strong>{activeStreams.length}</strong>
              <span>Active</span>
            </div>
            <div style={mobileStyles.summaryCard}>
              <strong>{liveDriverRows.length}</strong>
              <span>Live Drivers</span>
            </div>
            <div style={mobileStyles.summaryCard}>
              <strong>{filteredRows.length}</strong>
              <span>Shown</span>
            </div>
          </div>
        </header>

        <main style={mobileStyles.content}>
          <section style={mobileStyles.card}>
            <div style={mobileStyles.sectionTop}>
              <div>
                <div style={mobileStyles.sectionTitle}>Featured Broadcast</div>
                <div style={mobileStyles.sectionSub}>{mobileFeatured?.race_name || activeRace?.name || selectedTrack?.name || "Race broadcast hub"}</div>
              </div>
              <span style={mobileStyles.platformBadge}>{mobileFeatured ? getPlatformLabel(mobileFeatured) : "OFFLINE"}</span>
            </div>

            {mobileFeatured ? (
              <>
                <div style={mobileStyles.featuredBox}>
                  <div style={mobileStyles.featuredName}>
                    {mobileFeatured.display_name || mobileFeatured.title || mobileFeatured.channel_name || "Featured Stream"}
                  </div>
                  <div style={mobileStyles.featuredMeta}>
                    {(mobileFeatured.stream_type || "driver").replace("_", " ").toUpperCase()} • {mobileFeatured.team || "League Feed"}
                  </div>
                  {getExternalLink(mobileFeatured) && (
                    <a href={getExternalLink(mobileFeatured)} target="_blank" rel="noreferrer" style={mobileStyles.watchPrimary}>
                      Open {getPlatformLabel(mobileFeatured)}
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div style={mobileStyles.emptyBox}>No featured stream selected.</div>
            )}
          </section>

          <section style={mobileStyles.card}>
            <div style={mobileStyles.sectionTitle}>Filters</div>
            <div style={mobileStyles.filterStack}>
              <label style={mobileStyles.label}>Team
                <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} style={mobileStyles.input}>
                  <option value="all">All Teams</option>
                  {teamOptions.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
                </select>
              </label>

              <label style={mobileStyles.label}>Manufacturer
                <select value={manufacturerFilter} onChange={(event) => setManufacturerFilter(event.target.value)} style={mobileStyles.input}>
                  <option value="all">All Manufacturers</option>
                  {manufacturerOptions.map((mfr) => <option key={mfr} value={mfr}>{mfr}</option>)}
                </select>
              </label>

              <label style={mobileStyles.label}>Sort
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={mobileStyles.input}>
                  <option value="points">Points</option>
                  <option value="live">Live First</option>
                  <option value="number">Driver Number</option>
                  <option value="name">Driver Name</option>
                  <option value="team">Team</option>
                </select>
              </label>
            </div>
          </section>

          <section style={mobileStyles.card}>
            <div style={mobileStyles.sectionTop}>
              <div>
                <div style={mobileStyles.sectionTitle}>Driver Streams</div>
                <div style={mobileStyles.sectionSub}>Tap a card to watch or open the stream link.</div>
              </div>
              <span style={mobileStyles.liveBadge}>{liveDriverRows.length} LIVE</span>
            </div>

            <div style={mobileStyles.streamList}>
              {filteredRows.map(({ driver, stream, isLive, team, manufacturer }) => {
                const logo = getTeamLogo(team);
                const externalLink = stream ? getExternalLink(stream) : "";
                return (
                  <article key={driver.id || driver.number || driver.name} style={mobileStyles.streamCard}>
                    <div style={mobileStyles.driverRow}>
                      <img src={logo} alt={team} style={mobileStyles.teamLogo} />
                      <div style={mobileStyles.carNumber}>#{driver.number}</div>
                      <span style={isLive ? mobileStyles.livePill : mobileStyles.offlinePill}>{isLive ? "LIVE" : "OFFLINE"}</span>
                    </div>

                    <div style={mobileStyles.driverName}>{driver.name}</div>
                    <div style={mobileStyles.driverMeta}>{getTeamFullName(team)} • {manufacturer || "Manufacturer TBD"}</div>

                    <div style={mobileStyles.statsRow}>
                      <div><strong>{driver.points || 0}</strong><span>PTS</span></div>
                      <div><strong>{driver.wins || 0}</strong><span>WINS</span></div>
                      <div><strong>{driver.top5 || driver.top5s || 0}</strong><span>TOP 5</span></div>
                    </div>

                    {stream ? (
                      <div style={mobileStyles.actionRow}>
                        <button type="button" onClick={() => setSelectedFeaturedId(String(stream.id))} style={mobileStyles.watchButton}>
                          Feature
                        </button>
                        {externalLink && (
                          <a href={externalLink} target="_blank" rel="noreferrer" style={mobileStyles.openButton}>
                            Open {getPlatformLabel(stream)}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={mobileStyles.noStream}>No stream link added</div>
                    )}
                  </article>
                );
              })}
            </div>

            {!filteredRows.length && <div style={mobileStyles.emptyBox}>No drivers match these filters.</div>}
          </section>

          <section style={mobileStyles.card}>
            <div style={mobileStyles.sectionTitle}>Watch Party</div>
            {activeStreams.filter((stream) => stream.stream_type === "watch_party" || stream.stream_type === "official").slice(0, 6).map((stream) => (
              <button key={stream.id} onClick={() => setSelectedFeaturedId(String(stream.id))} style={mobileStyles.watchPartyButton}>
                <span>{stream.display_name || stream.title || stream.channel_name}</span>
                <strong>{getPlatformLabel(stream)}</strong>
              </button>
            ))}
            {!activeStreams.some((stream) => stream.stream_type === "watch_party" || stream.stream_type === "official") && (
              <div style={mobileStyles.muted}>No watch party feed is active yet.</div>
            )}
          </section>

          <section style={mobileStyles.card}>
            <button type="button" onClick={() => setShowMobileAdmin((current) => !current)} style={mobileStyles.adminToggle}>
              {showMobileAdmin ? "Hide Stream Manager" : "Admin Stream Manager"}
            </button>

            {showMobileAdmin && (
              <div style={{ marginTop: 12 }}>
                <AdminStreamManager
                  adminUnlocked={adminUnlocked}
                  adminCode={adminCode}
                  setAdminCode={setAdminCode}
                  unlockAdmin={unlockAdmin}
                  streamForm={streamForm}
                  updateStreamForm={updateStreamForm}
                  selectDriverForStream={selectDriverForStream}
                  saveStream={saveStream}
                  adminMessage={adminMessage}
                  adminError={adminError}
                  busy={busy}
                  drivers={drivers}
                  teamOptions={teamOptions}
                  manufacturerOptions={manufacturerOptions}
                  streams={streams}
                  editStream={editStream}
                  toggleStreamActive={toggleStreamActive}
                  setFeaturedStream={setFeaturedStream}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <TickerBar messages={tickerMessages} />

      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>BUDWEISER CUP LEAGUE</div>
          <h1 style={styles.title}>Broadcast Center</h1>
          <p style={styles.subtitle}>Driver POVs, official broadcasts, watch parties, Twitch, YouTube, and live race filters.</p>
        </div>

        <div style={styles.livePanel}>
          <div style={styles.liveText}>LIVE NOW</div>
          <div style={styles.liveCount}>{activeStreams.length}</div>
          <div style={styles.liveSub}>Active Feeds</div>
        </div>
      </header>

      <main style={styles.layout}>
        <section style={styles.mainColumn}>
          <AdminStreamManager
            adminUnlocked={adminUnlocked}
            adminCode={adminCode}
            setAdminCode={setAdminCode}
            unlockAdmin={unlockAdmin}
            streamForm={streamForm}
            updateStreamForm={updateStreamForm}
            selectDriverForStream={selectDriverForStream}
            saveStream={saveStream}
            adminMessage={adminMessage}
            adminError={adminError}
            busy={busy}
            drivers={drivers}
            teamOptions={teamOptions}
            manufacturerOptions={manufacturerOptions}
            streams={streams}
            editStream={editStream}
            toggleStreamActive={toggleStreamActive}
            setFeaturedStream={setFeaturedStream}
          />

          <section style={styles.featuredCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Featured Broadcast / Watch Party</h2>
                <p style={styles.sectionSub}>{selectedFeatured?.race_name || activeRace?.name || selectedTrack?.name || "Race broadcast hub"}</p>
              </div>
              <span style={styles.redBadge}>{selectedFeatured ? getPlatformLabel(selectedFeatured) : "OFFLINE"}</span>
            </div>

            {selectedFeatured ? (
              <>
                <div style={styles.featuredPlayer}>
                  {getEmbedSrc(selectedFeatured) ? (
                    <iframe
                      src={getEmbedSrc(selectedFeatured)}
                      title={selectedFeatured.display_name || selectedFeatured.title || "Featured Broadcast"}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                  ) : (
                    <div style={styles.youtubeFallback}>
                      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>YouTube channel live link</div>
                      <p style={{ color: "#94a3b8", maxWidth: 520, textAlign: "center" }}>YouTube handle live pages cannot always be embedded without a video ID. Open the live page to see whether JPC_Racing is currently broadcasting.</p>
                      <a href={getExternalLink(selectedFeatured)} target="_blank" rel="noreferrer" style={styles.watchButton}>Open YouTube Live</a>
                    </div>
                  )}
                </div>

                <div style={styles.featuredFooter}>
                  <div>
                    <div style={styles.featuredTitle}>{selectedFeatured.display_name || selectedFeatured.title || selectedFeatured.channel_name || "Featured Stream"}</div>
                    <div style={styles.featuredMeta}>{String(selectedFeatured.stream_type || "driver").replace("_", " ").toUpperCase()} • {selectedFeatured.team || "League Feed"}</div>
                  </div>
                  {getExternalLink(selectedFeatured) && (
                    <a href={getExternalLink(selectedFeatured)} target="_blank" rel="noreferrer" style={styles.watchButton}>Open Stream</a>
                  )}
                </div>
              </>
            ) : (
              <div style={styles.emptyBox}>
                <h2>No featured broadcast selected</h2>
                <p>Use Admin Stream Manager to set an official feed or watch party.</p>
              </div>
            )}
          </section>

          <section style={styles.filtersCard}>
            <div style={styles.filterGrid}>
              <label style={styles.filterLabel}>Team
                <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} style={styles.input}>
                  <option value="all">All Teams</option>
                  {teamOptions.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
                </select>
              </label>

              <label style={styles.filterLabel}>Manufacturer
                <select value={manufacturerFilter} onChange={(event) => setManufacturerFilter(event.target.value)} style={styles.input}>
                  <option value="all">All Manufacturers</option>
                  {manufacturerOptions.map((mfr) => <option key={mfr} value={mfr}>{mfr}</option>)}
                </select>
              </label>

              <label style={styles.filterLabel}>Sort
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={styles.input}>
                  <option value="points">Points</option>
                  <option value="live">Live First</option>
                  <option value="number">Driver Number</option>
                  <option value="name">Driver Name</option>
                  <option value="team">Team</option>
                </select>
              </label>
            </div>
          </section>

          <section style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Driver Stream Cards</h2>
                <p style={styles.sectionSub}>Sorted by {sortMode === "points" ? "points" : sortMode}. Cards include driver number, team, logo, manufacturer, and stream status.</p>
              </div>
              <span style={styles.redBadge}>{liveDriverRows.length} LIVE</span>
            </div>

            <div style={styles.driverGrid}>
              {filteredRows.map(({ driver, stream, isLive, team, manufacturer }) => (
                <DriverStreamCard
                  key={driver.id || driver.number || driver.name}
                  driver={driver}
                  stream={stream}
                  isLive={isLive}
                  team={team}
                  manufacturer={manufacturer}
                  onWatch={() => stream && setSelectedFeaturedId(String(stream.id))}
                />
              ))}
            </div>

            {!filteredRows.length && <div style={styles.emptySmall}>No drivers match these filters.</div>}
          </section>
        </section>

        <aside style={styles.sideColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Race Info</h3>
            <InfoRow label="Event" value={activeRace?.name || "TBD"} />
            <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
            <InfoRow label="Length" value={selectedTrack?.length || "TBD"} />
            <InfoRow label="Turns" value={selectedTrack?.turns || "TBD"} />
            <InfoRow label="Banking" value={selectedTrack?.banking || "TBD"} />
            <InfoRow label="Pit Speed" value={selectedTrack?.pitSpeed || "TBD"} />
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Watch Party</h3>
            {activeStreams.filter((stream) => stream.stream_type === "watch_party" || stream.stream_type === "official").slice(0, 6).map((stream) => (
              <button key={stream.id} onClick={() => setSelectedFeaturedId(String(stream.id))} style={styles.watchPartyButton}>
                <span>{stream.display_name || stream.title || stream.channel_name}</span>
                <strong>{getPlatformLabel(stream)}</strong>
              </button>
            ))}
            {!activeStreams.some((stream) => stream.stream_type === "watch_party" || stream.stream_type === "official") && (
              <p style={styles.muted}>No watch party feed is active yet.</p>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Points Leader</h3>
            {leader ? (
              <>
                <div style={styles.driverNumber}>#{leader.number}</div>
                <div style={styles.driverName}>{leader.name}</div>
                <div style={styles.driverTeam}>{getTeamFullName(leader.team || "Independent")}</div>
                <div style={styles.statGrid}>
                  <Stat label="PTS" value={leader.points || 0} />
                  <Stat label="WINS" value={leader.wins || 0} />
                  <Stat label="TOP 5" value={leader.top5 || leader.top5s || 0} />
                </div>
              </>
            ) : <p style={styles.muted}>No driver data loaded.</p>}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Live Drivers</h3>
            {liveDriverRows.slice(0, 12).map(({ driver, stream }) => (
              <button key={driver.id || driver.number} onClick={() => stream && setSelectedFeaturedId(String(stream.id))} style={styles.liveRow}>
                <span>#{driver.number} {driver.name}</span>
                <strong>{driver.points || 0}</strong>
              </button>
            ))}
            {!liveDriverRows.length && <p style={styles.muted}>No driver POVs are live.</p>}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Top 10 Standings</h3>
            {sortedDrivers.slice(0, 10).map((driver, index) => (
              <div key={driver.id || driver.name} style={styles.standingRow}>
                <span style={styles.position}>{index + 1}</span>
                <span style={styles.driverMini}>#{driver.number} {driver.name}</span>
                <strong>{driver.points || 0}</strong>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

function AdminStreamManager({
  adminUnlocked,
  adminCode,
  setAdminCode,
  unlockAdmin,
  streamForm,
  updateStreamForm,
  selectDriverForStream,
  saveStream,
  adminMessage,
  adminError,
  busy,
  drivers,
  teamOptions,
  manufacturerOptions,
  streams,
  editStream,
  toggleStreamActive,
  setFeaturedStream,
}) {
  return (
    <section style={styles.adminCard}>
      <div style={styles.sectionHeader}>
        <div>
          <h2 style={styles.sectionTitle}>Admin Stream Manager</h2>
          <p style={styles.sectionSub}>Add/edit Twitch links, YouTube links, official broadcasts, and watch parties.</p>
        </div>
        <span style={styles.darkBadge}>{adminUnlocked ? "UNLOCKED" : "ADMIN"}</span>
      </div>

      {!adminUnlocked ? (
        <form onSubmit={unlockAdmin} style={styles.adminLoginRow}>
          <input type="password" placeholder="Admin code" value={adminCode} onChange={(event) => setAdminCode(event.target.value)} style={styles.input} />
          <button type="submit" style={styles.primaryButton}>Unlock</button>
        </form>
      ) : (
        <>
          <form onSubmit={saveStream} style={styles.adminFormGrid}>
            <label style={styles.filterLabel}>Driver
              <select value={streamForm.driver_id} onChange={(event) => selectDriverForStream(event.target.value)} style={styles.input}>
                <option value="">Official / Watch Party / No Driver</option>
                {drivers.slice().sort((a, b) => Number(a.number || 999) - Number(b.number || 999)).map((driver) => (
                  <option key={getDriverKey(driver)} value={driver.id}>#{driver.number} {driver.name}</option>
                ))}
              </select>
            </label>

            <label style={styles.filterLabel}>Display Name
              <input value={streamForm.display_name} onChange={(event) => updateStreamForm("display_name", event.target.value)} style={styles.input} placeholder="#18 Bowhunter6758" />
            </label>

            <label style={styles.filterLabel}>Stream Type
              <select value={streamForm.stream_type} onChange={(event) => updateStreamForm("stream_type", event.target.value)} style={styles.input}>
                <option value="driver">Driver POV</option>
                <option value="official">Official Broadcast</option>
                <option value="watch_party">Watch Party</option>
              </select>
            </label>

            <label style={styles.filterLabel}>Platform
              <select value={streamForm.platform} onChange={(event) => updateStreamForm("platform", event.target.value)} style={styles.input}>
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>

            <label style={styles.filterLabel}>Twitch Channel
              <input value={streamForm.channel_name} onChange={(event) => updateStreamForm("channel_name", event.target.value)} style={styles.input} placeholder="twitch_channel_name" />
            </label>

            <label style={styles.filterLabel}>YouTube URL / Video ID
              <input value={streamForm.youtube_url} onChange={(event) => updateStreamForm("youtube_url", event.target.value)} style={styles.input} placeholder="https://youtube.com/watch?v=..." />
            </label>

            <label style={styles.filterLabel}>Team
              <select value={streamForm.team} onChange={(event) => updateStreamForm("team", event.target.value)} style={styles.input}>
                <option value="">No Team</option>
                {teamOptions.map((team) => <option key={team} value={team}>{getTeamFullName(team)}</option>)}
              </select>
            </label>

            <label style={styles.filterLabel}>Manufacturer
              <select value={streamForm.manufacturer} onChange={(event) => updateStreamForm("manufacturer", event.target.value)} style={styles.input}>
                <option value="">No Manufacturer</option>
                {manufacturerOptions.map((mfr) => <option key={mfr} value={mfr}>{mfr}</option>)}
              </select>
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={parseBoolean(streamForm.is_active)} onChange={(event) => updateStreamForm("is_active", event.target.checked)} /> Active
            </label>

            <label style={styles.checkboxLabel}>
              <input type="checkbox" checked={parseBoolean(streamForm.featured)} onChange={(event) => updateStreamForm("featured", event.target.checked)} /> Featured
            </label>

            <div style={styles.adminActions}>
              <button type="submit" disabled={busy} style={styles.primaryButton}>{busy ? "Saving..." : streamForm.id ? "Update Stream" : "Add Stream"}</button>
              <button type="button" onClick={() => window.location.reload()} style={styles.secondaryButton}>Refresh</button>
            </div>
          </form>

          <div style={styles.adminStreamList}>
            {streams.slice(0, 12).map((stream) => (
              <div key={stream.id} style={styles.adminStreamRow}>
                <div>
                  <strong>{stream.display_name || stream.title || stream.channel_name || "Stream"}</strong>
                  <div style={styles.adminMeta}>{getPlatformLabel(stream)} • {stream.stream_type || "driver"} • {stream.is_active ? "Active" : "Inactive"}</div>
                </div>
                <div style={styles.rowActions}>
                  <button onClick={() => editStream(stream)} style={styles.smallButton}>Edit</button>
                  <button onClick={() => toggleStreamActive(stream)} style={styles.smallButton}>{stream.is_active ? "Disable" : "Enable"}</button>
                  <button onClick={() => setFeaturedStream(stream)} style={styles.smallButton}>Feature</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {adminMessage && <div style={styles.success}>{adminMessage}</div>}
      {adminError && <div style={styles.error}>{adminError}</div>}
    </section>
  );
}

function DriverStreamCard({ driver, stream, isLive, team, manufacturer, onWatch }) {
  const logo = getTeamLogo(team);
  return (
    <div style={{ ...styles.driverCard, borderColor: isLive ? "#d71920" : "#263140" }}>
      <div style={styles.driverCardTop}>
        <img src={logo} alt={team} style={styles.teamLogo} />
        <div style={styles.numberBlock}>#{driver.number}</div>
        <span style={isLive ? styles.livePill : styles.offlinePill}>{isLive ? "LIVE" : "OFFLINE"}</span>
      </div>

      <div style={styles.driverCardName}>{driver.name}</div>
      <div style={styles.driverCardMeta}>{getTeamFullName(team)} • {manufacturer || "Manufacturer TBD"}</div>

      <div style={styles.cardStatsRow}>
        <Stat label="PTS" value={driver.points || 0} />
        <Stat label="WINS" value={driver.wins || 0} />
        <Stat label="TOP 5" value={driver.top5 || driver.top5s || 0} />
      </div>

      {stream ? (
        <button onClick={onWatch} style={styles.watchButtonFull}>Watch {getPlatformLabel(stream)}</button>
      ) : (
        <div style={styles.noStream}>No stream link added</div>
      )}
    </div>
  );
}

function TickerBar({ messages }) {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerLabel}>STREAMS</div>
      <div style={styles.tickerTrack}>
        <div style={styles.tickerInner}>
          {messages.map((message, index) => <span key={index} style={styles.tickerItem}>{message}</span>)}
        </div>
      </div>
      <style>{`@keyframes scrollTicker { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }`}</style>
    </div>
  );
}

function InfoRow({ label, value }) {
  return <div style={styles.infoRow}><span>{label}</span><strong>{value}</strong></div>;
}

function Stat({ label, value }) {
  return <div style={styles.statBox}><strong>{value}</strong><span>{label}</span></div>;
}

const mobileStyles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #05070a 0%, #0b0f15 55%, #05070a 100%)",
    color: "white",
    fontFamily: "Arial, sans-serif",
    paddingBottom: 90,
  },
  header: {
    padding: "18px 14px 14px",
    borderBottom: "1px solid #1f2937",
    background: "linear-gradient(135deg, #111827 0%, #07090d 100%)",
  },
  kicker: { color: "#d71920", fontSize: 11, fontWeight: 900, letterSpacing: 1.5 },
  title: { fontSize: 34, fontWeight: 1000, lineHeight: 1, marginTop: 4 },
  subtitle: { color: "#aab3c2", fontSize: 13, lineHeight: 1.35, marginTop: 6 },
  summaryRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
    marginTop: 14,
  },
  summaryCard: {
    background: "#10151f",
    border: "1px solid #263140",
    borderRadius: 14,
    padding: 10,
    textAlign: "center",
    display: "grid",
    gap: 3,
  },
  content: { padding: 12, display: "grid", gap: 12 },
  card: {
    background: "#10151f",
    border: "1px solid #263140",
    borderRadius: 18,
    padding: 14,
    boxShadow: "0 12px 30px rgba(0,0,0,.35)",
  },
  sectionTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: 1000 },
  sectionSub: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  platformBadge: {
    background: "#d71920",
    color: "white",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  liveBadge: {
    background: "#d71920",
    color: "white",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 11,
    fontWeight: 1000,
    whiteSpace: "nowrap",
  },
  featuredBox: {
    background: "#07090d",
    border: "1px solid #334155",
    borderRadius: 16,
    padding: 14,
    display: "grid",
    gap: 8,
  },
  featuredName: { fontSize: 20, fontWeight: 1000 },
  featuredMeta: { color: "#94a3b8", fontSize: 12, textTransform: "uppercase", fontWeight: 800 },
  watchPrimary: {
    display: "block",
    textAlign: "center",
    background: "#d71920",
    color: "white",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 1000,
    textDecoration: "none",
    marginTop: 6,
  },
  filterStack: { display: "grid", gap: 10, marginTop: 10 },
  label: { display: "grid", gap: 6, fontSize: 11, fontWeight: 1000, color: "#cbd5e1", textTransform: "uppercase" },
  input: {
    width: "100%",
    background: "#07090d",
    color: "white",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "12px 12px",
    boxSizing: "border-box",
    fontSize: 15,
  },
  streamList: { display: "grid", gap: 12 },
  streamCard: {
    background: "#07090d",
    border: "1px solid #263140",
    borderRadius: 18,
    padding: 14,
    display: "grid",
    gap: 10,
  },
  driverRow: { display: "flex", alignItems: "center", gap: 10 },
  teamLogo: { width: 42, height: 42, borderRadius: "50%", objectFit: "cover", border: "1px solid #334155", background: "#111" },
  carNumber: { fontSize: 30, fontWeight: 1000, lineHeight: 1 },
  livePill: { marginLeft: "auto", background: "#d71920", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 1000 },
  offlinePill: { marginLeft: "auto", background: "#334155", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 1000, color: "#cbd5e1" },
  driverName: { fontSize: 19, fontWeight: 1000 },
  driverMeta: { color: "#94a3b8", fontSize: 13 },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  actionRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  watchButton: {
    background: "#263140",
    color: "white",
    border: "1px solid #334155",
    borderRadius: 12,
    padding: "11px 12px",
    fontWeight: 1000,
  },
  openButton: {
    background: "#d71920",
    color: "white",
    borderRadius: 12,
    padding: "11px 12px",
    fontWeight: 1000,
    textDecoration: "none",
    textAlign: "center",
  },
  noStream: {
    color: "#94a3b8",
    background: "#111827",
    borderRadius: 12,
    padding: "11px 12px",
    textAlign: "center",
    fontWeight: 800,
  },
  watchPartyButton: {
    width: "100%",
    background: "#07090d",
    color: "white",
    border: "1px solid #263140",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    cursor: "pointer",
    marginTop: 8,
    textAlign: "left",
  },
  muted: { color: "#94a3b8", marginTop: 8 },
  emptyBox: { background: "#07090d", borderRadius: 14, padding: 18, color: "#94a3b8", textAlign: "center" },
  adminToggle: {
    width: "100%",
    background: "#d71920",
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "13px 14px",
    fontWeight: 1000,
    fontSize: 15,
  },
};

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(circle at top, #1b2533 0%, #0b0f15 45%, #05070a 100%)", color: "white", fontFamily: "Arial, sans-serif" },
  tickerWrap: { height: 46, display: "flex", alignItems: "center", background: "#05070a", borderBottom: "3px solid #d71920", overflow: "hidden", position: "sticky", top: 0, zIndex: 50 },
  tickerLabel: { height: "100%", background: "#d71920", padding: "0 20px", display: "flex", alignItems: "center", fontWeight: 900, letterSpacing: 1 },
  tickerTrack: { flex: 1, overflow: "hidden", whiteSpace: "nowrap" },
  tickerInner: { display: "inline-block", whiteSpace: "nowrap", animation: "scrollTicker 32s linear infinite" },
  tickerItem: { display: "inline-block", marginRight: 70, fontSize: 14, fontWeight: 900, textTransform: "uppercase" },
  hero: { padding: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, borderBottom: "1px solid #1f2937" },
  kicker: { color: "#d71920", fontSize: 13, fontWeight: 900, letterSpacing: 2 },
  title: { margin: "4px 0", fontSize: 42, lineHeight: 1, fontWeight: 900 },
  subtitle: { margin: 0, color: "#aab3c2" },
  livePanel: { background: "#10151f", border: "1px solid #334155", borderRadius: 18, padding: "16px 22px", minWidth: 150, textAlign: "center" },
  liveText: { color: "#d71920", fontSize: 13, fontWeight: 900 },
  liveCount: { fontSize: 42, fontWeight: 900, lineHeight: 1 },
  liveSub: { color: "#94a3b8", fontSize: 12, fontWeight: 700 },
  layout: { display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: 20, padding: 20, alignItems: "start" },
  mainColumn: { display: "grid", gap: 16 },
  sideColumn: { display: "grid", gap: 16 },
  sectionCard: { background: "#10151f", border: "1px solid #2b3442", borderRadius: 16, padding: 16, boxShadow: "0 12px 32px rgba(0,0,0,.35)" },
  featuredCard: { background: "#10151f", border: "1px solid #d71920", borderRadius: 16, padding: 16, boxShadow: "0 12px 32px rgba(0,0,0,.35)" },
  filtersCard: { background: "#10151f", border: "1px solid #2b3442", borderRadius: 16, padding: 16 },
  adminCard: { background: "#10151f", border: "1px solid #334155", borderRadius: 16, padding: 16, boxShadow: "0 12px 32px rgba(0,0,0,.35)" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" },
  sectionTitle: { margin: 0, fontSize: 24, fontWeight: 900 },
  sectionSub: { margin: "4px 0 0", color: "#94a3b8", fontSize: 13 },
  redBadge: { background: "#d71920", color: "white", padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 900 },
  darkBadge: { background: "#263140", color: "white", padding: "7px 12px", borderRadius: 999, fontSize: 12, fontWeight: 900 },
  featuredPlayer: { height: 460, background: "#000", borderRadius: 14, overflow: "hidden", border: "1px solid #263140" },
  youtubeFallback: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, background: "#07090d" },
  featuredFooter: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 12, flexWrap: "wrap" },
  featuredTitle: { fontSize: 19, fontWeight: 900 },
  featuredMeta: { color: "#94a3b8", fontSize: 13, marginTop: 3 },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 },
  filterLabel: { display: "grid", gap: 6, fontSize: 12, fontWeight: 900, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5 },
  input: { width: "100%", background: "#07090d", color: "white", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" },
  adminLoginRow: { display: "grid", gridTemplateColumns: "1fr auto", gap: 10 },
  adminFormGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 },
  checkboxLabel: { display: "flex", alignItems: "center", gap: 8, background: "#07090d", border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", fontWeight: 900 },
  adminActions: { display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" },
  primaryButton: { background: "#d71920", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 900, cursor: "pointer" },
  secondaryButton: { background: "#263140", color: "white", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontWeight: 900, cursor: "pointer" },
  smallButton: { background: "#263140", color: "white", border: "1px solid #334155", borderRadius: 8, padding: "7px 9px", fontWeight: 900, cursor: "pointer", fontSize: 12 },
  adminStreamList: { display: "grid", gap: 8, marginTop: 14 },
  adminStreamRow: { display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", background: "#07090d", border: "1px solid #263140", borderRadius: 12, padding: 10, flexWrap: "wrap" },
  rowActions: { display: "flex", gap: 6, flexWrap: "wrap" },
  adminMeta: { color: "#94a3b8", fontSize: 12, marginTop: 3 },
  success: { marginTop: 10, color: "#4ade80", fontWeight: 900 },
  error: { marginTop: 10, color: "#f87171", fontWeight: 900 },
  driverGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 },
  driverCard: { background: "#07090d", border: "1px solid #263140", borderRadius: 16, padding: 14, display: "grid", gap: 10 },
  driverCardTop: { display: "flex", alignItems: "center", gap: 10 },
  teamLogo: { width: 44, height: 44, borderRadius: "50%", objectFit: "cover", background: "#111", border: "1px solid #334155" },
  numberBlock: { fontSize: 28, fontWeight: 900, lineHeight: 1 },
  livePill: { marginLeft: "auto", background: "#d71920", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900 },
  offlinePill: { marginLeft: "auto", background: "#334155", borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900, color: "#cbd5e1" },
  driverCardName: { fontSize: 18, fontWeight: 900 },
  driverCardMeta: { color: "#94a3b8", fontSize: 13 },
  cardStatsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  watchButton: { background: "#d71920", color: "white", textDecoration: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 900 },
  watchButtonFull: { background: "#d71920", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 900, cursor: "pointer" },
  noStream: { color: "#94a3b8", background: "#111827", borderRadius: 10, padding: "10px 12px", textAlign: "center", fontWeight: 800 },
  emptyBox: { minHeight: 280, background: "#07090d", borderRadius: 16, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#94a3b8", textAlign: "center" },
  emptySmall: { background: "#07090d", borderRadius: 14, padding: 20, color: "#94a3b8", textAlign: "center" },
  card: { background: "#10151f", border: "1px solid #2b3442", borderRadius: 16, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,.28)" },
  cardTitle: { margin: "0 0 12px", fontWeight: 900, fontSize: 18 },
  infoRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 0", borderBottom: "1px solid #263140", color: "#aab3c2", fontSize: 14 },
  driverNumber: { fontSize: 42, fontWeight: 900, lineHeight: 1 },
  driverName: { fontSize: 18, fontWeight: 800, marginTop: 5 },
  driverTeam: { color: "#94a3b8", marginTop: 3 },
  statGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 },
  statBox: { background: "#07090d", border: "1px solid #263140", borderRadius: 12, padding: 10, textAlign: "center", display: "grid", gap: 3 },
  watchPartyButton: { width: "100%", background: "#07090d", color: "white", border: "1px solid #263140", borderRadius: 10, padding: 10, display: "flex", justifyContent: "space-between", gap: 8, cursor: "pointer", marginBottom: 8, textAlign: "left" },
  liveRow: { width: "100%", background: "#07090d", color: "white", border: "1px solid #263140", borderRadius: 10, padding: "8px 10px", display: "flex", justifyContent: "space-between", gap: 8, cursor: "pointer", marginBottom: 7, textAlign: "left" },
  standingRow: { display: "grid", gridTemplateColumns: "30px 1fr auto", gap: 8, padding: "7px 0", borderBottom: "1px solid #263140", alignItems: "center" },
  position: { color: "#d71920", fontWeight: 900 },
  driverMini: { fontSize: 13, fontWeight: 700 },
  muted: { color: "#94a3b8" },
};
