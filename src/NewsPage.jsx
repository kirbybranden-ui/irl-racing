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

      console.log("NEWS DATA:", data);
      console.log("NEWS ERROR:", error);

      if (!error) setNews(data || []);
      setLoading(false);
    }

    loadNews();
  }, []);

  const featured = news.find((post) => post.is_featured);
  const leadStory = featured || news[0];
  const otherStories = news.filter((post) => post.id !== leadStory?.id);
  const sideStories = otherStories.slice(0, 3);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#080b10",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: "#151a22",
          borderBottom: "4px solid #d4af37",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="League Logo" style={{ height: 48 }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>
              BUDWEISER CUP NEWS
            </div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>
              Race recaps • driver headlines • league updates
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

      <div style={{ maxWidth: 1450, margin: "0 auto", padding: 24 }}>
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
                  padding: 24,
                  boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    color: "#d4af37",
                    fontSize: 13,
                    fontWeight: 900,
                    marginBottom: 10,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {leadStory.category || "Top Story"}
                </div>

                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    lineHeight: 1,
                    marginBottom: 16,
                  }}
                >
                  {leadStory.title}
                </div>

                {leadStory.image_url && (
                  <img
                    src={leadStory.image_url}
                    alt={leadStory.title}
                    style={{
                      width: "100%",
                      maxHeight: 620,
                      objectFit: "cover",
                      borderRadius: 18,
                      border: "1px solid #2d3643",
                      marginBottom: 16,
                      boxShadow: "0 16px 36px rgba(0,0,0,0.45)",
                    }}
                  />
                )}

                <div style={{ opacity: 0.55, fontSize: 12, marginBottom: 14 }}>
                  {new Date(leadStory.created_at).toLocaleString()}
                </div>

                <div
                  style={{
                    fontSize: 17,
                    lineHeight: 1.6,
                    opacity: 0.9,
                    whiteSpace: "pre-line",
                  }}
                >
                  {leadStory.content}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {sideStories.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      background: "#151a22",
                      border: "1px solid #2d3643",
                      borderRadius: 16,
                      padding: 16,
                    }}
                  >
                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        style={{
                          width: "100%",
                          height: 135,
                          objectFit: "cover",
                          borderRadius: 12,
                          marginBottom: 12,
                          border: "1px solid #2d3643",
                        }}
                      />
                    )}

                    <div
                      style={{
                        color: "#d4af37",
                        fontSize: 11,
                        fontWeight: 900,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      {post.category || "Headline"}
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 900 }}>
                      {post.title}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        opacity: 0.75,
                        lineHeight: 1.45,
                        marginTop: 8,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {post.content}
                    </div>
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
              <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 12 }}>
                Latest News
              </div>

              {news.map((post) => (
                <div
                  key={post.id}
                  style={{
                    borderTop: "1px solid #2d3643",
                    padding: "18px 0",
                    display: "grid",
                    gridTemplateColumns: post.image_url ? "180px 1fr" : "1fr",
                    gap: 16,
                  }}
                >
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      style={{
                        width: "100%",
                        height: 105,
                        objectFit: "cover",
                        borderRadius: 12,
                        border: "1px solid #2d3643",
                      }}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        color: "#d4af37",
                        fontSize: 11,
                        fontWeight: 900,
                        marginBottom: 6,
                        textTransform: "uppercase",
                      }}
                    >
                      {post.category || "News"}
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 900 }}>
                      {post.title}
                    </div>

                    <div style={{ opacity: 0.5, fontSize: 12, margin: "6px 0" }}>
                      {new Date(post.created_at).toLocaleString()}
                    </div>

                    <div
                      style={{
                        opacity: 0.82,
                        lineHeight: 1.55,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {post.content}
                    </div>
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
