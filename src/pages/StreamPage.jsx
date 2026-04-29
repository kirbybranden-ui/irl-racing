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

  async function loadStreams() {
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .eq("is_active", true)
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
      : [
          "Budweiser Cup League broadcast center",
          "Live streams, standings, race info, and league updates all in one place",
        ];

  return (
    <div style={styles.page}>
      <TickerBar messages={tickerMessages} />

      <header style={styles.hero}>
        <div>
          <div style={styles.kicker}>BUDWEISER CUP LEAGUE</div>
          <h1 style={styles.title}>RaceDay Stream Center</h1>
        </div>

        <div style={styles.livePanel}>
          <div style={styles.liveText}>LIVE</div>
          <div style={styles.liveCount}>{streams.length}</div>
          <div style={styles.liveSub}>Active Streams</div>
        </div>
      </header>

      <main style={styles.layout}>
        <section style={styles.mainColumn}>
          <h2 style={styles.sectionTitle}>Race Broadcast</h2>

          {streams.length > 0 ? (
            <div style={styles.streamGrid}>
              {streams.map((stream) => (
                <div key={stream.id} style={styles.streamCard}>
                  <div style={styles.streamTop}>
                    <strong>
                      {stream.display_name ||
                        stream.title ||
                        stream.channel_name}
                    </strong>
                    <span style={styles.livePill}>LIVE</span>
                  </div>

                  <div style={styles.videoBox}>
                    <iframe
                      src={getTwitchEmbed(stream.channel_name)}
                      style={{ width: "100%", height: "100%", border: "none" }}
                      allowFullScreen
                      title={stream.channel_name}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyBox}>No active streams</div>
          )}
        </section>

        <aside style={styles.sideColumn}>
          <div style={styles.card}>
            <h3>Race Info</h3>
            <InfoRow label="Event" value={activeRace?.name || "TBD"} />
            <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
          </div>

          <div style={styles.card}>
            <h3>Points Leader</h3>
            {leader ? (
              <>
                <div style={styles.driverNumber}>#{leader.number}</div>
                <div>{leader.name}</div>
                <div>{leader.points} pts</div>
              </>
            ) : (
              <p>No data</p>
            )}
          </div>

          <div style={styles.card}>
            <h3>Top 10</h3>
            {sortedDrivers.slice(0, 10).map((d, i) => (
              <div key={d.id} style={styles.row}>
                <span>{i + 1}</span>
                <span>
                  #{d.number} {d.name}
                </span>
                <strong>{d.points}</strong>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}

function getTwitchEmbed(channel) {
  if (!channel) return "";
  const hostname = window.location.hostname;
  return `https://player.twitch.tv/?channel=${channel}&parent=${hostname}`;
}

function TickerBar({ messages }) {
  return (
    <div style={styles.ticker}>
      <div style={styles.tickerInner}>
        {messages.map((m, i) => (
          <span key={i} style={styles.tickerItem}>
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={styles.row}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const styles = {
  page: { background: "#0b0f15", color: "white", minHeight: "100vh" },
  hero: { padding: 20, display: "flex", justifyContent: "space-between" },
  title: { fontSize: 32 },
  kicker: { color: "#d71920", fontWeight: 900 },
  livePanel: { textAlign: "center" },
  liveText: { color: "#d71920" },
  liveCount: { fontSize: 30 },
  layout: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 20,
    padding: 20,
  },
  mainColumn: { background: "#111", padding: 15, borderRadius: 10 },
  sideColumn: { display: "grid", gap: 15 },
  card: { background: "#111", padding: 15, borderRadius: 10 },
  streamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: 15,
  },
  streamCard: { background: "#000", borderRadius: 10 },
  streamTop: {
    display: "flex",
    justifyContent: "space-between",
    padding: 10,
  },
  videoBox: { height: 200 },
  livePill: { background: "red", padding: "4px 8px", borderRadius: 10 },
  ticker: { background: "#d71920", overflow: "hidden", whiteSpace: "nowrap" },
  tickerInner: {
    display: "inline-block",
    animation: "ticker 20s linear infinite",
  },
  tickerItem: { marginRight: 40 },
  driverNumber: { fontSize: 40 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 5,
  },
  emptyBox: { padding: 40, textAlign: "center" },
  sectionTitle: { marginBottom: 10 },
};
