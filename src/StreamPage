import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

export default function StreamPage() {
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("streams")
        .select("*")
        .order("created_at", { ascending: true });
      setStreams(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const count = streams.length;
  const gridCols =
    count === 1 ? "1fr"
    : count === 2 ? "1fr 1fr"
    : count <= 4 ? "1fr 1fr"
    : "1fr 1fr 1fr";

  const parent = window.location.hostname;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)",
          borderBottom: "1px solid #2d3643",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="League Logo" style={{ height: 46 }} />
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 0.4 }}>
              BUDWEISER CUP LEAGUE
            </div>
            <div style={{ fontSize: 13, opacity: 0.65, marginTop: 2 }}>
              🎮 Live Streams
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => (window.location.pathname = "/standings")}
            style={{
              background: "#222936",
              color: "white",
              border: "1px solid #3a4453",
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Standings
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1600, margin: "0 auto", padding: "24px 16px" }}>
        {loading ? (
          <div
            style={{
              background: "#171b22",
              border: "1px solid #2c3440",
              borderRadius: 16,
              padding: 40,
              textAlign: "center",
              color: "#888",
            }}
          >
            Loading streams...
          </div>
        ) : count === 0 ? (
          <div
            style={{
              background: "#171b22",
              border: "1px solid #2c3440",
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📡</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              No Streams Configured
            </div>
            <div style={{ color: "#888", fontSize: 14 }}>
              An admin can add Twitch channels from the admin dashboard.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 13, color: "#888" }}>
                {count} stream{count !== 1 ? "s" : ""} configured
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "#ef4444",
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                LIVE
              </div>
            </div>
            <style>{`
              @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
              }
            `}</style>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 14,
              }}
            >
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  style={{
                    background: "#0f1319",
                    border: "1px solid #2c3440",
                    borderRadius: 14,
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Stream label */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "#0c1018",
                      borderBottom: "1px solid #1e2530",
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "#9146ff",
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      {stream.display_name || stream.channel_name}
                    </span>
                    <span style={{ color: "#888", fontSize: 12 }}>
                      twitch.tv/{stream.channel_name}
                    </span>
                    <a
                      href={`https://twitch.tv/${stream.channel_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: "auto",
                        color: "#9146ff",
                        fontSize: 12,
                        textDecoration: "none",
                        fontWeight: 700,
                      }}
                    >
                      Open ↗
                    </a>
                  </div>
                  {/* Twitch embed */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      paddingBottom: "56.25%",
                      background: "#000",
                    }}
                  >
                    <iframe
                      src={`https://player.twitch.tv/?channel=${stream.channel_name}&parent=${parent}&autoplay=false`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                      }}
                      allowFullScreen
                      title={stream.display_name || stream.channel_name}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
