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

  useEffect(() => {
    loadBanners();

    const channel = supabase
      .channel("stream-app-update-banners")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_update_banners" },
        () => loadBanners()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadBanners() {
    const { data, error } = await supabase
      .from("app_update_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (!error) setBanners(data || []);
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
          "Welcome to the Budweiser Cup League broadcast center"
          "Live timing, standings, race updates, and league news will appear here",
        ];

  return (
    <div style={styles.page}>
      <TickerBar messages={tickerMessages} />

      <header style={styles.header}>
        <div>
          <div style={styles.kicker}>BUDWEISER CUP LEAGUE</div>
          <h1 style={styles.title}>Broadcast Stream Center</h1>
          <p style={styles.subtitle}>
            Live race hub, league updates, standings, track data, and broadcast
            information in one place.
          </p>
        </div>

        <div style={styles.liveBadge}>● LIVE CONTROL</div>
      </header>

      <main style={styles.grid}>
        <section style={{ ...card, gridColumn: "span 2" }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Race Broadcast</h2>
            <span style={styles.smallBadge}>
              {activeRace?.name || "Race Feed"}
            </span>
          </div>

          <div style={styles.videoBox}>
            <div style={styles.videoText}>
              STREAM WINDOW
              <span>Embed Twitch / YouTube / OBS feed here</span>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Race Info</h2>
          </div>

          <InfoRow label="Event" value={activeRace?.name || "Next Race TBD"} />
          <InfoRow
            label="Track"
            value={selectedTrack?.name || activeRace?.track || "Not selected"}
          />
          <InfoRow
            label="Race Length"
            value={activeRace?.length || "75% with stages"}
          />
          <InfoRow
            label="Status"
            value={activeRace?.status || "Pre-Race / Live"}
          />
        </section>

        <section style={card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Current Points Leader</h2>
          </div>

          {leader ? (
            <DriverFeature driver={leader} label="Championship Leader" />
          ) : (
            <EmptyText text="No driver data loaded." />
          )}
        </section>

        <section style={card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Featured Driver</h2>
          </div>

          {featuredDriver ? (
            <DriverFeature driver={featuredDriver} label="Driver Spotlight" />
          ) : (
            <EmptyText text="No featured driver available." />
          )}
        </section>

        <section style={{ ...card, gridColumn: "span 2" }}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Live Standings</h2>
            <span style={styles.smallBadge}>Top 10</span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>POS</th>
                <th style={styles.th}>DRIVER</th>
                <th style={styles.th}>TEAM</th>
                <th style={styles.th}>PTS</th>
                <th style={styles.th}>WINS</th>
                <th style={styles.th}>TOP 5</th>
              </tr>
            </thead>
            <tbody>
              {sortedDrivers.slice(0, 10).map((driver, index) => (
                <tr key={driver.id || driver.name}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.tdStrong}>
                    #{driver.number} {driver.name}
                  </td>
                  <td style={styles.td}>{driver.team || "Independent"}</td>
                  <td style={styles.td}>{driver.points || 0}</td>
                  <td style={styles.td}>{driver.wins || 0}</td>
                  <td style={styles.td}>{driver.top5s || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Track Overview</h2>
          </div>

          <InfoRow label="Track" value={selectedTrack?.name || "TBD"} />
          <InfoRow label="Length" value={selectedTrack?.length || "TBD"} />
          <InfoRow label="Turns" value={selectedTrack?.turns || "TBD"} />
          <InfoRow label="Banking" value={selectedTrack?.banking || "TBD"} />
          <InfoRow
            label="Pit Speed"
            value={selectedTrack?.pitSpeed || "TBD"}
          />
          <InfoRow
            label="Tire Wear"
            value={selectedTrack?.tireWear || "TBD"}
          />
        </section>

        <section style={card}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>League Updates</h2>
          </div>

          <div style={styles.newsList}>
            {banners.length > 0 ? (
              banners.slice(0, 5).map((item) => (
                <div key={item.id} style={styles.newsItem}>
                  <strong>{item.title || "League Update"}</strong>
                  <p>{item.message}</p>
                </div>
              ))
            ) : (
              <EmptyText text="No active league updates." />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function TickerBar({ messages }) {
  return (
    <div style={styles.tickerWrap}>
      <div style={styles.tickerLabel}>LIVE</div>
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

function DriverFeature({ driver, label }) {
  return (
    <div>
      <div style={styles.featureLabel}>{label}</div>
      <div style={styles.driverNumber}>#{driver.number || "--"}</div>
      <div style={styles.driverName}>{driver.name || "Unknown Driver"}</div>
      <div style={styles.driverTeam}>{driver.team || "Independent"}</div>

      <div style={styles.driverStats}>
        <div>
          <strong>{driver.points || 0}</strong>
          <span>Points</span>
        </div>
        <div>
          <strong>{driver.wins || 0}</strong>
          <span>Wins</span>
        </div>
        <div>
          <strong>{driver.top5s || 0}</strong>
          <span>Top 5</span>
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
    marginRight: 60,
    fontWeight: 800,
    textTransform: "uppercase",
    fontSize: 14,
    letterSpacing: 0.5,
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

  subtitle: {
    margin: 0,
    color: "#aab3c2",
    maxWidth: 720,
  },

  liveBadge: {
    background: "#10151f",
    border: "1px solid #d71920",
    color: "#fff",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
    whiteSpace: "nowrap",
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
    fontSize: 18,
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

  videoBox: {
    height: 360,
    borderRadius: 16,
    border: "1px solid #303a49",
    background:
      "linear-gradient(135deg, rgba(215,25,32,.25), rgba(255,255,255,.04)), #080b10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  videoText: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 2,
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

  featureLabel: {
    color: "#d71920",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1.5,
    marginBottom: 8,
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

  newsList: {
    display: "grid",
    gap: 10,
  },

  newsItem: {
    background: "#101722",
    border: "1px solid #283244",
    borderRadius: 12,
    padding: 12,
  },
};
