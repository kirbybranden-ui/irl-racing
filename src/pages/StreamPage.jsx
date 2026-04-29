import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

export default function StreamPage({
  drivers = [],
  teams = [],
  manufacturers = [],
  activeRace = null,
  selectedTrack = null,
}) {
  const [streams, setStreams] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadStreams();
    loadBanners();
  }, []);

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
  async function loadBanners() {
    const { data } = await supabase
      .from("app_update_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setBanners(data || []);
  }

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [drivers]);

  const leader = sortedDrivers[0];

 const tickerMessages =
  banners.length > 0
    ? banners.map((story) =>
        `${story.title || "League Story"} — ${
          story.summary || story.message || story.body || ""
        }`
      )

  return (
    <div style={styles.page}>
      <TickerBar messages={tickerMessages} />

      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>BUDWEISER CUP LEAGUE</div>
          <h1 style={styles.title}>RaceDay Stream Center</h1>
          <p style={styles.subtitle}>
            Live driver POVs, race information, standings, and broadcast updates.
          </p>
        </div>

        <div style={styles.livePanel}>
          <div style={styles.liveText}>LIVE</div>
          <div style={styles.liveCount}>{streams.length}</div>
          <div style={styles.liveSub}>Active Streams</div>
        </div>
      </header>

      <main style={styles.layout}>
        <section style={styles.mainColumn}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Race Broadcast</h2>
              <p style={styles.sectionSub}>Driver onboard cameras</p>
            </div>
            <span style={styles.redBadge}>{streams.length} LIVE</span>
          </div>

          {streams.length > 0 ? (
            <div style={styles.streamGrid}>
              {streams.map((stream) => (
                <div key={stream.id} style={styles.streamCard}>
                  <div style={styles.streamTop}>
                    <div>
                      <div style={styles.streamName}>
                        {stream.display_name ||
                          stream.title ||
                          stream.channel_name ||
                          "Driver Stream"}
                      </div>
                      <div style={styles.streamMeta}>
                        {stream.race_name || activeRace?.name || "Race Broadcast"}
                      </div>
                    </div>
                    <span style={styles.livePill}>LIVE</span>
                  </div>

                  <div style={styles.videoBox}>
                    <iframe
                      src={getTwitchEmbed(stream.channel_name)}
                      title={stream.display_name || stream.channel_name}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyBox}>
              <h2>No active streams</h2>
              <p>Turn streams on in Supabase by setting is_active to true.</p>
            </div>
          )}
        </section>

        <aside style={styles.sideColumn}>
          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Race Info</h3>
            <InfoRow label="Event" value={activeRace?.name || "TBD"} />
            <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
            <InfoRow label="Length" value={selectedTrack?.length || "TBD"} />
            <InfoRow label="Pit Speed" value={selectedTrack?.pitSpeed || "TBD"} />
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Points Leader</h3>
            {leader ? (
              <div>
                <div style={styles.driverNumber}>#{leader.number}</div>
                <div style={styles.driverName}>{leader.name}</div>
                <div style={styles.driverTeam}>{leader.team || "Independent"}</div>

                <div style={styles.statGrid}>
                  <Stat label="PTS" value={leader.points || 0} />
                  <Stat label="WINS" value={leader.wins || 0} />
                  <Stat label="TOP 5" value={leader.top5 || leader.top5s || 0} />
                </div>
              </div>
            ) : (
              <p style={styles.muted}>No driver data loaded.</p>
            )}
          </section>

          <section style={styles.card}>
            <h3 style={styles.cardTitle}>Top 10 Standings</h3>

            <div style={styles.standingsList}>
              {sortedDrivers.slice(0, 10).map((driver, index) => (
                <div key={driver.id || driver.name} style={styles.standingRow}>
                  <span style={styles.position}>{index + 1}</span>
                  <span style={styles.driverMini}>
                    #{driver.number} {driver.name}
                  </span>
                  <strong>{driver.points || 0}</strong>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
}

function getTwitchEmbed(channel) {
  if (!channel) return "";

  const hostname =
    typeof window !== "undefined"
      ? window.location.hostname
      : "irl-racing.vercel.app";

  return `https://player.twitch.tv/?channel=${channel}&parent=${hostname}`;
}

function TickerBar({ messages }) {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerLabel}>NEWS</div>
      <div style={styles.tickerTrack}>
        <div style={styles.tickerContent}>
          {messages.map((message, index) => (
            <span key={index} style={styles.tickerItem}>
              {message}
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

function Stat({ label, value }) {
  return (
    <div style={styles.statBox}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #1b2533 0%, #0b0f15 45%, #05070a 100%)",
    color: "white",
    fontFamily: "Arial, sans-serif",
  },

  tickerWrap: {
    height: 46,
    display: "flex",
    alignItems: "center",
    background: "#05070a",
    borderBottom: "3px solid #d71920",
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },

  tickerLabel: {
    height: "100%",
    background: "#d71920",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    fontWeight: 900,
    letterSpacing: 1,
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
    marginRight: 70,
    fontSize: 14,
    fontWeight: 900,
    textTransform: "uppercase",
  },

  hero: {
    padding: "30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    borderBottom: "1px solid #1f2937",
  },

  kicker: {
    color: "#d71920",
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: 2,
  },

  title: {
    margin: "4px 0",
    fontSize: 42,
    lineHeight: 1,
    fontWeight: 900,
  },

  subtitle: {
    margin: 0,
    color: "#aab3c2",
  },

  livePanel: {
    background: "#10151f",
    border: "1px solid #334155",
    borderRadius: 18,
    padding: "16px 22px",
    minWidth: 150,
    textAlign: "center",
  },

  liveText: {
    color: "#d71920",
    fontSize: 13,
    fontWeight: 900,
  },

  liveCount: {
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1,
  },

  liveSub: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 700,
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 2.4fr) minmax(320px, 0.9fr)",
    gap: 20,
    padding: 30,
  },

  mainColumn: {
    background: "#10151f",
    border: "1px solid #2b3442",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 12px 32px rgba(0,0,0,.35)",
  },

  sideColumn: {
    display: "grid",
    gap: 18,
    alignContent: "start",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
  },

  sectionSub: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: 13,
  },

  redBadge: {
    background: "#d71920",
    color: "white",
    padding: "7px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },

  streamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 16,
  },

  streamCard: {
    background: "#07090d",
    border: "1px solid #263140",
    borderRadius: 16,
    overflow: "hidden",
  },

  streamTop: {
    padding: "12px 14px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(90deg, #151c27, #0f141c)",
    borderBottom: "1px solid #263140",
  },

  streamName: {
    fontWeight: 900,
    fontSize: 15,
  },

  streamMeta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 3,
  },

  livePill: {
    background: "#d71920",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 11,
    fontWeight: 900,
  },

  videoBox: {
    height: 230,
    background: "#000",
  },

  emptyBox: {
    height: 280,
    background: "#07090d",
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#94a3b8",
  },

  card: {
    background: "#10151f",
    border: "1px solid #2b3442",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,.28)",
  },

  cardTitle: {
    margin: "0 0 14px",
    fontSize: 18,
    fontWeight: 900,
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 0",
    borderBottom: "1px solid #263140",
    color: "#aab3c2",
    fontSize: 14,
  },

  driverNumber: {
    fontSize: 46,
    fontWeight: 900,
    lineHeight: 1,
  },

  driverName: {
    fontSize: 20,
    fontWeight: 900,
    marginTop: 4,
  },

  driverTeam: {
    color: "#94a3b8",
    marginTop: 3,
  },

  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginTop: 16,
  },

  statBox: {
    background: "#07090d",
    border: "1px solid #263140",
    borderRadius: 12,
    padding: 10,
    textAlign: "center",
  },

  standingsList: {
    display: "grid",
    gap: 8,
  },

  standingRow: {
    display: "grid",
    gridTemplateColumns: "32px 1fr auto",
    gap: 10,
    alignItems: "center",
    padding: "9px 0",
    borderBottom: "1px solid #263140",
  },

  position: {
    color: "#d71920",
    fontWeight: 900,
  },

  driverMini: {
    fontSize: 13,
    fontWeight: 800,
  },

  muted: {
    color: "#94a3b8",
  },
};
