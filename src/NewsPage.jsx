import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const GOLD = "#d4af37";
const TEXT_PRIMARY = "#1d1d1f";
const TEXT_SECONDARY = "#6e6e73";
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BG_STRONG = "rgba(255,255,255,0.85)";
const GLASS_BORDER = "1px solid rgba(0,0,0,0.06)";
const GLASS_SHADOW = "0 8px 30px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.6) inset";
const HAIRLINE = "1px solid rgba(0,0,0,0.08)";

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
        background: "linear-gradient(180deg, #f5f5f7 0%, #ffffff 40%, #f5f5f7 100%)",
        color: TEXT_PRIMARY,
        fontFamily: FONT_STACK,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          background: GLASS_BG_STRONG,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="League Logo" style={{ height: 44 }} />
          <div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: -0.5,
                color: TEXT_PRIMARY,
              }}
            >
              Budweiser Cup News
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
              Race recaps • driver headlines • league updates
            </div>
          </div>
        </div>

        <button
          onClick={() => (window.location.pathname = "/standings")}
          style={{
            background: TEXT_PRIMARY,
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: FONT_STACK,
          }}
        >
          Back to Standings
        </button>
      </div>

      <div style={{ maxWidth: 1450, margin: "0 auto", padding: 24 }}>
        {loading ? (
          <div style={{ color: TEXT_SECONDARY, padding: 24 }}>Loading news...</div>
        ) : news.length === 0 ? (
          <div
            style={{
              background: GLASS_BG,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: GLASS_BORDER,
              borderRadius: 22,
              padding: 40,
              textAlign: "center",
              color: TEXT_SECONDARY,
              boxShadow: GLASS_SHADOW,
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
                  background: GLASS_BG,
                  backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  border: GLASS_BORDER,
                  borderRadius: 24,
                  padding: 28,
                  boxShadow: GLASS_SHADOW,
                }}
              >
                <div
                  style={{
                    color: GOLD,
                    fontSize: 13,
                    fontWeight: 700,
                    marginBottom: 12,
                    letterSpacing: 1,
                    textTransform: "uppercase",
                  }}
                >
                  {leadStory.category || "Top Story"}
                </div>

                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 700,
                    lineHeight: 1.05,
                    marginBottom: 18,
                    letterSpacing: -1.2,
                    color: TEXT_PRIMARY,
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
                      borderRadius: 20,
                      border: "1px solid rgba(0,0,0,0.06)",
                      marginBottom: 18,
                      boxShadow: "0 16px 36px rgba(0,0,0,0.12)",
                    }}
                  />
                )}

                <div style={{ color: TEXT_SECONDARY, fontSize: 12.5, marginBottom: 16, fontWeight: 500 }}>
                  {new Date(leadStory.created_at).toLocaleString()}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    lineHeight: 1.65,
                    color: TEXT_PRIMARY,
                    opacity: 0.88,
                    whiteSpace: "pre-line",
                    fontWeight: 400,
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
                      background: GLASS_BG,
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: GLASS_BORDER,
                      borderRadius: 18,
                      padding: 16,
                      boxShadow: GLASS_SHADOW,
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
                          borderRadius: 14,
                          marginBottom: 12,
                          border: "1px solid rgba(0,0,0,0.06)",
                        }}
                      />
                    )}

                    <div
                      style={{
                        color: GOLD,
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {post.category || "Headline"}
                    </div>

                    <div
                      style={{
                        fontSize: 19,
                        fontWeight: 600,
                        color: TEXT_PRIMARY,
                        letterSpacing: -0.3,
                        lineHeight: 1.2,
                      }}
                    >
                      {post.title}
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        color: TEXT_SECONDARY,
                        lineHeight: 1.5,
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
                background: GLASS_BG,
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: GLASS_BORDER,
                borderRadius: 22,
                padding: 22,
                boxShadow: GLASS_SHADOW,
              }}
            >
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  marginBottom: 12,
                  color: TEXT_PRIMARY,
                  letterSpacing: -0.6,
                }}
              >
                Latest News
              </div>

              {news.map((post) => (
                <div
                  key={post.id}
                  style={{
                    borderTop: HAIRLINE,
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
                        borderRadius: 14,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    />
                  )}

                  <div>
                    <div
                      style={{
                        color: GOLD,
                        fontSize: 11,
                        fontWeight: 700,
                        marginBottom: 6,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {post.category || "News"}
                    </div>

                    <div
                      style={{
                        fontSize: 21,
                        fontWeight: 600,
                        color: TEXT_PRIMARY,
                        letterSpacing: -0.3,
                        lineHeight: 1.2,
                      }}
                    >
                      {post.title}
                    </div>

                    <div style={{ color: TEXT_SECONDARY, fontSize: 12, margin: "6px 0", fontWeight: 500 }}>
                      {new Date(post.created_at).toLocaleString()}
                    </div>

                    <div
                      style={{
                        color: TEXT_PRIMARY,
                        opacity: 0.82,
                        lineHeight: 1.55,
                        whiteSpace: "pre-line",
                        fontSize: 15,
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
