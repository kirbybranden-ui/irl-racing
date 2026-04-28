import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNews() {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("News load failed:", error);
      }

      setNews(data || []);
      setLoading(false);
    }

    loadNews();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
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
              📰 League News
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
          <button
            onClick={() => (window.location.pathname = "/streams")}
            style={{
              background: "#9146ff",
              color: "white",
              border: "none",
              borderRadius: 10,
              padding: "8px 14px",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Streams
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
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
            Loading news...
          </div>
        ) : news.length === 0 ? (
          <div
            style={{
              background: "#171b22",
              border: "1px solid #2c3440",
              borderRadius: 16,
              padding: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📰</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
              No News Posted Yet
            </div>
            <div style={{ color: "#888", fontSize: 14 }}>
              Add posts to the Supabase news table to publish league updates.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {news.map((post) => (
              <article
                key={post.id}
                style={{
                  background: "linear-gradient(135deg, #151a22 0%, #10141b 100%)",
                  border: "1px solid #2d3643",
                  borderRadius: 18,
                  padding: 22,
                  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
                }}
              >
                <div style={{ fontSize: 12, color: "#d4af37", fontWeight: 900, marginBottom: 8 }}>
                  LEAGUE NEWS
                </div>
                <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>{post.title}</h1>
                <div style={{ fontSize: 12, opacity: 0.55, marginBottom: 16 }}>
                  {post.created_at ? new Date(post.created_at).toLocaleString() : ""}
                </div>
                <div style={{ fontSize: 16, lineHeight: 1.6, whiteSpace: "pre-wrap", opacity: 0.92 }}>
                  {post.content}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
