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

      if (!error) setNews(data || []);
      setLoading(false);
    }

    loadNews();
  }, []);

  const leadStory = news[0];
  const sideStories = news.slice(1, 4);
  const latestStories = news.slice(4);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#111820",
          borderBottom: "3px solid #d4af37",
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
            <div style={{ fontSize: 26, fontWeight: 900 }}>
              BUDWEISER CUP NEWS
            </div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>
              Race reports • league updates • driver headlines
            </div>
          </div>
        </div>

        <button
          onClick={() => (window.location.pathname = "/standings")}
          style={{
            background: "#d4af37",
            color: "#111",
            border: "none",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          Back to Standings
        </button>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 24 }}>
        {loading ? (
          <div>Loading news...</div>
        ) : news.length === 0 ? (
          <div
            style={{
              background: "#151a22",
              border: "1px solid #2d3643",
              borderRadius: 18,
              padding: 40,
              textAlign: "center",
            }}
          >
            No news posts yet.
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: 20,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #1b2330 0%, #10151d 100%)",
                  border: "1px solid #2d3643",
                  borderRadius: 22,
                  padding: 26,
                  minHeight: 330,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  boxShadow: "0 14px 34px rgba(0,0,0,0.35)",
                }}
              >
                <div
                  style={{
                    color: "#d4af37",
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 10,
                  }}
                >
                  TOP STORY
                </div>
                <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>
                  {leadStory.title}
                </div>
                <div style={{ opacity: 0.6, fontSize: 13, marginTop: 12 }}>
                  {new Date(leadStory.created_at).toLocaleString()}
                </div>
                <p style={{ fontSize: 17, lineHeight: 1.55, marginTop: 18 }}>
                  {leadStory.content}
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sideStories.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      background: "#151a22",
                      border: "1px solid #2d3643",
                      borderRadius: 16,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{
                        color: "#d4af37",
                        fontSize: 11,
                        fontWeight: 900,
                        marginBottom: 8,
                      }}
                    >
                      HEADLINE
                    </div>
                    <div style={{ fontSize: 19, fontWeight: 900 }}>
                      {post.title}
                    </div>
                    <p style={{ opacity: 0.75, fontSize: 14, lineHeight: 1.45 }}>
                      {post.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#151a22",
                border: "1px solid #2d3643",
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 16 }}>
                Latest News
              </div>

              {[leadStory, ...sideStories, ...latestStories].map((post) => (
                <div
                  key={post.id}
                  style={{
                    borderTop: "1px solid #2d3643",
                    padding: "18px 0",
                  }}
                >
                  <div style={{ fontSize: 21, fontWeight: 900 }}>
                    {post.title}
                  </div>
                  <div style={{ opacity: 0.5, fontSize: 12, margin: "6px 0" }}>
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                  <div style={{ opacity: 0.82, lineHeight: 1.55 }}>
                    {post.content}
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
