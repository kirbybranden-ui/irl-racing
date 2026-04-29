import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function StreamPage() {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    loadStreams();
  }, []);

  async function loadStreams() {
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setStreams([]);
      return;
    }

    setStreams(data || []);
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>LIVE STREAMS</h1>

      <div style={styles.grid}>
        {streams.length > 0 ? (
          streams.map((stream) => (
            <div key={stream.id} style={styles.card}>
              <div style={styles.header}>
                <strong>
                  {stream.display_name ||
                    stream.title ||
                    stream.channel_name}
                </strong>
                <span style={styles.live}>LIVE</span>
              </div>

              <div style={styles.video}>
                <iframe
                  src={getTwitchEmbed(stream.channel_name)}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allowFullScreen
                />
              </div>
            </div>
          ))
        ) : (
          <div style={styles.empty}>No live streams found</div>
        )}
      </div>
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

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "white",
    padding: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: 900,
    marginBottom: 20,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 16,
  },

  card: {
    background: "#111",
    borderRadius: 12,
    overflow: "hidden",
    border: "1px solid #333",
  },

  header: {
    padding: 10,
    display: "flex",
    justifyContent: "space-between",
    background: "#1a1a1a",
  },

  video: {
    height: 220,
    background: "#000",
  },

  live: {
    background: "#d71920",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },

  empty: {
    textAlign: "center",
    padding: 40,
    opacity: 0.6,
  },
};
