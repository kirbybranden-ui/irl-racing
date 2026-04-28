import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const card = {
  background: "linear-gradient(180deg, #171c25, #0f131a)",
  border: "1px solid #2b3442",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 10px 30px rgba(0,0,0,.35)",
};

export default function StreamPage({
  drivers = [],
  teams = [],
  manufacturers = [],
  activeRace = null,
  selectedTrack = null,
}) {
  const [banners, setBanners] = useState([]);
  const [streams, setStreams] = useState([]);
  const [selectedReplay, setSelectedReplay] = useState(null);

  useEffect(() => {
    loadBanners();
    loadStreams();
  }, []);

  async function loadBanners() {
    const { data } = await supabase
      .from("app_update_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setBanners(data || []);
  }

  async function loadStreams() {
    const { data } = await supabase
      .from("streams")
      .select("*")
      .order("created_at", { ascending: false });

    const cleanData = data || [];
    setStreams(cleanData);

    const firstReplay = cleanData.find((s) => !s.is_active);
    setSelectedReplay(firstReplay || null);
  }

  const activeStreams = streams.filter((s) => s.is_active);
  const replayStreams = streams.filter((s) => !s.is_active);

  const replaysByRace = replayStreams.reduce((groups, stream) => {
    const race = stream.race_name || stream.race || stream.event || "Other Replays";
    if (!groups[race]) groups[race] = [];
    groups[race].push(stream);
    return groups;
  }, {});

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [drivers]);

  const leader = sortedDrivers[0];

  const tickerMessages =
    banners.length > 0
      ? banners.map((b) => `${b.title || "League Update"} — ${b.message}`)
      : [
          "Welcome to the Budweiser Cup League broadcast center",
          "Live timing, standings, race updates, and league news will appear here",
        ];

  return (
    <div style={styles.page}>
      <TickerBar messages={tickerMessages} />

      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>BUDWEISER CUP LEAGUE</div>
          <h1 style={styles.title}>Broadcast Stream Center</h1>
        </div>
        <div style={styles.liveBadge}>● LIVE HUB</div>
      </header>

      <main style={styles.grid}>
        <section style={{ ...card, gridColumn: "span 2" }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Race Broadcast</h2>
            <span style={styles.smallBadge}>{activeStreams.length} Live Streams</span>
          </div>

          {activeStreams.length > 0 ? (
            <div style={styles.streamGrid}>
              {activeStreams.map((stream) => (
                <div key={stream.id} style={styles.streamCard}>
                  <div style={styles.streamHeader}>
                    <strong>{stream.title || stream.streamer_name || stream.race_name || "Race Stream"}</strong>
                    <span style={styles.livePill}>LIVE</span>
                  </div>

                  <div style={styles.streamVideo}>
                    <iframe
                      src={getStreamEmbedUrl(stream)}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.videoBox}>
              <div style={styles.videoText}>
                STREAM OFFLINE
                <span>No active streams found</span>
              </div>
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={styles.sectionTitle}>Race Info</h2>
          <InfoRow label="Event" value={activeRace?.name || "TBD"} />
          <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
          <InfoRow label="Length" value={selectedTrack?.length || "TBD"} />
          <InfoRow label="Pit Speed" value={selectedTrack?.pitSpeed || "TBD"} />
        </section>

        <section style={card}>
          <h2 style={styles.sectionTitle}>Points Leader</h2>
          {leader ? <DriverFeature driver={leader} /> : <EmptyText text="No driver data loaded." />}
        </section>

        <section style={{ ...card, gridColumn: "span 3" }}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Race Replay Theater</h2>
              <p style={styles.muted}>Previous races grouped by race event.</p>
            </div>
            <span style={styles.smallBadge}>{replayStreams.length} Replays</span>
          </div>

          {selectedReplay ? (
            <div style={styles.replayHero}>
              <div style={styles.replayPlayer}>
                <iframe
                  src={getStreamEmbedUrl(selectedReplay)}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              </div>

              <div style={styles.replayInfo}>
                <div style={styles.replayEyebrow}>NOW PLAYING</div>
                <h3 style={styles.replayTitle}>
                  {selectedReplay.title || selectedReplay.race_name || "Race Replay"}
                </h3>
                <p style={styles.replayDescription}>
                  {selectedReplay.description ||
                    "Full race replay from the Budweiser Cup League broadcast archive."}
                </p>

                <div style={styles.replayMeta}>
                  <span>{selectedReplay.race_name || "Race Replay"}</span>
                  <span>
                    {selectedReplay.streamer_name ||
                      selectedReplay.driver_name ||
                      selectedReplay.channel ||
                      "Broadcast Archive"}
                  </span>
                  <span>
                    {selectedReplay.created_at
                      ? new Date(selectedReplay.created_at).toLocaleDateString()
                      : "Archive"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyText text="No previous race replays found." />
          )}

          {Object.entries(replaysByRace).map(([raceName, raceStreams]) => (
            <div key={raceName} style={{ marginBottom: 26 }}>
              <h3 style={styles.rowTitle}>{raceName}</h3>

              <div style={styles.netflixRow}>
                {raceStreams.map((stream) => (
                  <button
                    key={stream.id}
                    onClick={() => setSelectedReplay(stream)}
                    style={{
                      ...styles.replayCard,
                      border:
                        selectedReplay?.id === stream.id
                          ? "2px solid #d71920"
                          : "1px solid #2b3442",
                    }}
                  >
                    <div style={styles.thumbnail}>
                      {stream.thumbnail_url ? (
                        <img
                          src={stream.thumbnail_url}
                          alt={stream.title || stream.race_name || "Race replay"}
                          style={styles.thumbnailImg}
                        />
                      ) : (
                        <div style={styles.thumbnailFallback}>BCL</div>
                      )}
                      <div style={styles.playBadge}>▶</div>
                    </div>

                    <div style={styles.replayCardBody}>
                      <strong>{stream.title || "Race Broadcast"}</strong>
                      <span>
                        {stream.streamer_name ||
                          stream.driver_name ||
                          stream.channel ||
                          "Replay"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section style={{ ...card, gridColumn: "span 3" }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Live Standings</h2>
            <span style={styles.smallBadge}>Top 10</span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>POS</th>
                <th style={styles.th}>DRIVER</th>
                <th style={styles.th}>PTS</th>
                <th style={styles.th}>WINS</th>
                <th style={styles.th}>TOP 3</th>
                <th style={styles.th}>TOP 5</th>
                <th style={styles.th}>DNF</th>
              </tr>
            </thead>

            <tbody>
              {sortedDrivers.slice(0, 10).map((d, i) => (
                <tr key={d.id || d.name}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdStrong}>
                    #{d.number} {d.name}
                  </td>
                  <td style={styles.td}>{d.points || 0}</td>
                  <td style={styles.td}>{d.wins || 0}</td>
                  <td style={styles.td}>{d.top3 || 0}</td>
                  <td style={styles.td}>{d.top5 || d.top5s || 0}</td>
                  <td style={styles.td}>{d.dnfs || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

function getStreamEmbedUrl(stream = {}) {
  const raw =
    stream.url ||
    stream.stream_url ||
    stream.twitch_url ||
    stream.youtube_url ||
    stream.channel ||
    "";

  if (!raw) return "";

  const value = String(raw).trim();

  if (value.includes("player.twitch.tv")) {
    return value.includes("parent=")
      ? value
      : `${value}&parent=irl-racing.vercel.app&parent=localhost`;
  }

  if (value.includes("twitch.tv")) {
    const channel = value.split("twitch.tv/")[1]?.split(/[/?]/)[0];
    return `https://player.twitch.tv/?channel=${channel}&parent=irl-racing.vercel.app&parent=localhost`;
  }

  if (value.includes("youtube.com/watch?v=")) {
    const id = value.split("watch?v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (value.includes("youtu.be/")) {
    const id = value.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (!value.includes("http")) {
    return `https://player.twitch.tv/?channel=${value}&parent=irl-racing.vercel.app&parent=localhost`;
  }

  return value;
}

function TickerBar({ messages }) {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerLabel}>LIVE</div>
      <div style={styles.tickerTrack}>
        <div style={styles.tickerContent}>
          {messages.map((m, i) => (
            <span key={i} style={styles.tickerItem}>
              {m}
            </span>
          ))}
        </div>
      </div>

      <style>
        {`
          @keyframes tickerScroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}
      </style>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.infoRow}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DriverFeature({ driver }) {
  return (
    <div>
      <div style={styles.driverNumber}>#{driver.number || "--"}</div>
      <div style={styles.driverName}>{driver.name || "Unknown Driver"}</div>
      <div style={styles.driverTeam}>{driver.team || "Independent"}</div>

      <div style={styles.driverStats}>
        <div>
          <strong>{driver.points || 0}</strong>
          <span>PTS</span>
        </div>
        <div>
          <strong>{driver.wins || 0}</strong>
          <span>WINS</span>
        </div>
        <div>
          <strong>{driver.top5 || driver.top5s || 0}</strong>
          <span>TOP 5</span>
        </div>
      </div>
    </div>
  );
}

function EmptyText({ text }) {
  return <p style={{ color: "#9ca3af", margin: 0 }}>{text}</p>;
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1d2735 0%, #0d1117 42%, #05070a 100%)",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  tickerWrap: {
    height: 44,
    display: "flex",
    alignItems: "center",
    background: "#07090d",
    borderBottom: "2px solid #d71920",
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  tickerLabel: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    padding: "0 18px",
    background: "#d71920",
    color: "white",
    fontWeight: 900,
  },

  tickerTrack: {
    flex: 1,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },

  tickerContent: {
    display: "inline-block",
    animation: "tickerScroll 35s linear infinite",
  },

  tickerItem: {
    display: "inline-block",
    marginRight: 60,
    fontWeight: 800,
    textTransform: "uppercase",
    fontSize: 14,
  },

  header: {
    padding: "28px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },

  kicker: {
    color: "#d71920",
    fontWeight: 900,
    letterSpacing: 2,
    fontSize: 13,
  },

  title: {
    margin: "4px 0",
    fontSize: 38,
    lineHeight: 1,
  },

  liveBadge: {
    background: "#10151f",
    border: "1px solid #d71920",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
  },

  grid: {
    padding: "0 30px 40px",
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr",
    gap: 18,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 900,
  },

  smallBadge: {
    background: "#202938",
    color: "#cbd5e1",
    border: "1px solid #334155",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
  },

  muted: {
    margin: "6px 0 0",
    color: "#9ca3af",
    fontSize: 14,
  },

  videoBox: {
    height: 360,
    borderRadius: 16,
    background: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  videoText: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: 900,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  streamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },

  streamCard: {
    background: "#07090d",
    border: "1px solid #2b3442",
    borderRadius: 16,
    overflow: "hidden",
  },

  streamHeader: {
    padding: "10px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    background: "#10151f",
  },

  streamVideo: {
    height: 220,
    background: "#000",
  },

  livePill: {
    background: "#d71920",
    color: "white",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
  },

  replayHero: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 18,
    marginBottom: 22,
  },

  replayPlayer: {
    height: 420,
    background: "#000",
    borderRadius: 18,
    overflow: "hidden",
    border: "1px solid #2b3442",
  },

  replayInfo: {
    background:
      "linear-gradient(135deg, rgba(215,25,32,.25), rgba(255,255,255,.04))",
    border: "1px solid #334155",
    borderRadius: 18,
    padding: 20,
  },

  replayEyebrow: {
    color: "#d71920",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 2,
  },

  replayTitle: {
    fontSize: 30,
    margin: "10px 0",
    lineHeight: 1.05,
  },

  replayDescription: {
    color: "#cbd5e1",
    lineHeight: 1.5,
  },

  replayMeta: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginTop: 18,
    color: "#94a3b8",
    fontSize: 13,
  },

  rowTitle: {
    margin: "6px 0 12px",
    fontSize: 18,
  },

  netflixRow: {
    display: "flex",
    gap: 14,
    overflowX: "auto",
    paddingBottom: 8,
  },

  replayCard: {
    minWidth: 260,
    maxWidth: 260,
    background: "#080b10",
    color: "white",
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
  },

  thumbnail: {
    height: 145,
    background:
      "linear-gradient(135deg, rgba(215,25,32,.4), rgba(212,175,55,.18)), #111827",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  thumbnailFallback: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 2,
  },

  playBadge: {
    position: "absolute",
    left: 12,
    bottom: 12,
    background: "rgba(0,0,0,.65)",
    border: "1px solid rgba(255,255,255,.25)",
    borderRadius: 999,
    padding: "6px 9px",
    fontSize: 13,
  },

  replayCardBody: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    color: "#94a3b8",
    fontSize: 12,
    padding: "10px 8px",
    borderBottom: "1px solid #334155",
  },

  td: {
    padding: "11px 8px",
    borderBottom: "1px solid #1f2937",
    color: "#d1d5db",
  },

  tdStrong: {
    padding: "11px 8px",
    borderBottom: "1px solid #1f2937",
    fontWeight: 900,
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    padding: "10px 0",
    borderBottom: "1px solid #222b38",
    color: "#aab3c2",
  },

  driverNumber: {
    fontSize: 46,
    fontWeight: 900,
    lineHeight: 1,
  },

  driverName: {
    fontSize: 22,
    fontWeight: 900,
    marginTop: 4,
  },

  driverTeam: {
    color: "#aab3c2",
    marginTop: 4,
  },

  driverStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 18,
  },
};
