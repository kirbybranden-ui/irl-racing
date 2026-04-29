import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function LiveControlPanel() {
  const [streams, setStreams] = useState([]);
  const [raceName, setRaceName] = useState("Preseason - Michigan");
  const [newStream, setNewStream] = useState({
    title: "",
    display_name: "",
    channel_name: "",
  });

  useEffect(() => {
    loadStreams();
  }, []);

  async function loadStreams() {
    const { data, error } = await supabase
      .from("streams")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setStreams(data || []);
  }

  async function toggleStream(stream) {
    await supabase
      .from("streams")
      .update({
        is_active: !stream.is_active,
        race_name: raceName,
      })
      .eq("id", stream.id);

    loadStreams();
  }

  async function endAllStreams() {
    await supabase.from("streams").update({ is_active: false }).neq("id", 0);
    loadStreams();
  }

  async function goLiveForRace() {
    await supabase
      .from("streams")
      .update({ is_active: true, race_name: raceName })
      .in(
        "id",
        streams.map((s) => s.id)
      );

    loadStreams();
  }

  async function addStream() {
    if (!newStream.channel_name.trim()) return;

    await supabase.from("streams").insert({
      title: newStream.title || `${newStream.channel_name} Stream`,
      display_name: newStream.display_name || newStream.channel_name,
      channel_name: newStream.channel_name,
      race_name: raceName,
      is_active: false,
    });

    setNewStream({ title: "", display_name: "", channel_name: "" });
    loadStreams();
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Live Control Panel</h1>

      <section style={styles.card}>
        <h2>Race Control</h2>

        <label style={styles.label}>Current Race</label>
        <input
          style={styles.input}
          value={raceName}
          onChange={(e) => setRaceName(e.target.value)}
          placeholder="Preseason - Michigan"
        />

        <div style={styles.buttonRow}>
          <button style={styles.liveButton} onClick={goLiveForRace}>
            Go Live With All Streams
          </button>

          <button style={styles.dangerButton} onClick={endAllStreams}>
            End Broadcast
          </button>
        </div>
      </section>

      <section style={styles.card}>
        <h2>Add Stream</h2>

        <div style={styles.formGrid}>
          <input
            style={styles.input}
            placeholder="Title: Bowhunter Stream"
            value={newStream.title}
            onChange={(e) =>
              setNewStream({ ...newStream, title: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Display Name: Bowhunter"
            value={newStream.display_name}
            onChange={(e) =>
              setNewStream({ ...newStream, display_name: e.target.value })
            }
          />

          <input
            style={styles.input}
            placeholder="Twitch Channel: bowhunter6758"
            value={newStream.channel_name}
            onChange={(e) =>
              setNewStream({ ...newStream, channel_name: e.target.value })
            }
          />
        </div>

        <button style={styles.primaryButton} onClick={addStream}>
          Add Stream
        </button>
      </section>

      <section style={styles.card}>
        <h2>Stream Status</h2>

        <div style={styles.streamGrid}>
          {streams.map((stream) => (
            <div key={stream.id} style={styles.streamCard}>
              <div>
                <strong>{stream.display_name || stream.title}</strong>
                <p>{stream.channel_name}</p>
                <p>{stream.race_name || "No race assigned"}</p>
              </div>

              <button
                onClick={() => toggleStream(stream)}
                style={stream.is_active ? styles.dangerButton : styles.liveButton}
              >
                {stream.is_active ? "Turn Off" : "Go Live"}
              </button>

              <span style={stream.is_active ? styles.liveBadge : styles.offBadge}>
                {stream.is_active ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0d1117",
    color: "white",
    padding: 24,
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: 36,
    fontWeight: 900,
    marginBottom: 20,
  },
  card: {
    background: "#151a22",
    border: "1px solid #2d3643",
    borderRadius: 18,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    color: "#aaa",
    fontWeight: 700,
  },
  input: {
    width: "100%",
    background: "#0f1319",
    color: "white",
    border: "1px solid #313947",
    borderRadius: 10,
    padding: "11px 12px",
    boxSizing: "border-box",
  },
  buttonRow: {
    display: "flex",
    gap: 12,
    marginTop: 16,
    flexWrap: "wrap",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 14,
  },
  primaryButton: {
    background: "#d4af37",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "11px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  liveButton: {
    background: "#16a34a",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dangerButton: {
    background: "#b42318",
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  streamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  streamCard: {
    background: "#0f1319",
    border: "1px solid #313947",
    borderRadius: 14,
    padding: 14,
    display: "grid",
    gap: 12,
  },
  liveBadge: {
    color: "#22c55e",
    fontWeight: 900,
  },
  offBadge: {
    color: "#94a3b8",
    fontWeight: 900,
  },
};
