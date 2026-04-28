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
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    setStreams(data || []);
  }

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [drivers]);

  const leader = sortedDrivers[0];
  const featuredDriver = sortedDrivers[1] || sortedDrivers[0];

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
        <div style={styles.liveBadge}>● LIVE</div>
      </header>

      <main style={styles.grid}>
        {/* STREAM */}
        <section style={{ ...card, gridColumn: "span 2" }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Race Broadcast</h2>
          </div>

          <div style={styles.videoBox}>
            {streams.length > 0 ? (
              <iframe
                src={getStreamEmbedUrl(streams[0].url || streams[0].stream_url)}
                style={{ width: "100%", height: "100%", border: "none" }}
                allowFullScreen
              />
            ) : (
              <div style={styles.videoText}>
                STREAM OFFLINE
                <span>No active stream</span>
              </div>
            )}
          </div>
        </section>

        {/* RACE INFO */}
        <section style={card}>
          <h2 style={styles.sectionTitle}>Race Info</h2>
          <InfoRow label="Event" value={activeRace?.name || "TBD"} />
          <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
        </section>

        {/* LEADER */}
        <section style={card}>
          <h2 style={styles.sectionTitle}>Points Leader</h2>
          {leader && <DriverFeature driver={leader} />}
        </section>

        {/* FEATURED */}
        <section style={card}>
          <h2 style={styles.sectionTitle}>Featured Driver</h2>
          {featuredDriver && <DriverFeature driver={featuredDriver} />}
        </section>

        {/* STANDINGS */}
        <section style={{ ...card, gridColumn: "span 2" }}>
          <h2 style={styles.sectionTitle}>Live Standings</h2>

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
                <tr key={d.id}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdStrong}>
                    #{d.number} {d.name}
                  </td>
                  <td style={styles.td}>{d.points || 0}</td>
                  <td style={styles.td}>{d.wins || 0}</td>
                  <td style={styles.td}>{d.top3 || 0}</td>
                  <td style={styles.td}>{d.top5 || 0}</td>
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

/* ---------- HELPERS ---------- */

function getStreamEmbedUrl(url = "") {
  if (!url) return "";

  if (url.includes("twitch.tv")) {
    const channel = url.split("twitch.tv/")[1]?.split(/[/?]/)[0];
    return `https://player.twitch.tv/?channel=${channel}&parent=irl-racing.vercel.app&parent=localhost`;
  }

  if (url.includes("youtube.com/watch?v=")) {
    const id = url.split("watch?v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${id}`;
  }

  if (url.includes("youtu.be/")) {
    const id = url.split("youtu.be/")[1];
    return `https://www.youtube.com/embed/${id}`;
  }

  return url;
}

function TickerBar({ messages }) {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerContent}>
        {messages.map((m, i) => (
          <span key={i} style={styles.tickerItem}>{m}</span>
        ))}
      </div>
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
      <div style={styles.driverNumber}>#{driver.number}</div>
      <div style={styles.driverName}>{driver.name}</div>

      <div style={styles.driverStats}>
        <div><strong>{driver.points}</strong><span>PTS</span></div>
        <div><strong>{driver.wins}</strong><span>WINS</span></div>
        <div><strong>{driver.top5}</strong><span>TOP 5</span></div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const styles = {
  page: { minHeight: "100vh", background: "#0d1117", color: "white" },
  header: { padding: 20, display: "flex", justifyContent: "space-between" },
  kicker: { color: "#d71920", fontWeight: 900 },
  title: { fontSize: 32 },
  liveBadge: { color: "#d71920", fontWeight: 900 },

  grid: { padding: 20, display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16 },

  videoBox: {
    height: 360,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
  },

  videoText: { textAlign: "center", fontWeight: 900 },

  table: { width: "100%" },
  th: { textAlign: "left" },
  td: { padding: 8 },
  tdStrong: { padding: 8, fontWeight: 900 },

  tickerWrap: { background: "#111", overflow: "hidden" },
  tickerContent: { display: "flex", animation: "scroll 25s linear infinite" },
  tickerItem: { marginRight: 40 },

  infoRow: { display: "flex", justifyContent: "space-between" },

  driverNumber: { fontSize: 40 },
  driverName: { fontWeight: 900 },
  driverStats: { display: "flex", gap: 10 },
};
