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

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

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
  const feedStories = news.filter((post) => post.id !== leadStory?.id);

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

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 20px 60px" }}>
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
            {/* Hero / Top Story — full-bleed image, chip overlay, big headline below */}
            <div
              style={{
                background: GLASS_BG,
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: GLASS_BORDER,
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: GLASS_SHADOW,
                marginBottom: 28,
              }}
            >
              {leadStory.image_url && (
                <div style={{ position: "relative" }}>
                  <img
                    src={leadStory.image_url}
                    alt={leadStory.title}
                    style={{
                      width: "100%",
                      height: 380,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      background: "rgba(29,29,31,0.72)",
                      backdropFilter: "blur(10px)",
                      color: GOLD,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      padding: "6px 12px",
                      borderRadius: 999,
                    }}
                  >
                    {leadStory.category || "Top Story"}
                  </span>
                </div>
              )}

              <div style={{ padding: "22px 26px 28px" }}>
                {!leadStory.image_url && (
                  <div
                    style={{
                      color: GOLD,
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 10,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                    }}
                  >
                    {leadStory.category || "Top Story"}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 10,
                    fontSize: 12.5,
                    color: TEXT_SECONDARY,
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: TEXT_PRIMARY }}>Budweiser Cup League</span>
                  <span>•</span>
                  <span>{timeAgo(leadStory.created_at)}</span>
                </div>

                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    marginBottom: 14,
                    letterSpacing: -0.8,
                    color: TEXT_PRIMARY,
                  }}
                >
                  {leadStory.title}
                </div>

                <div
                  style={{
                    fontSize: 16.5,
                    lineHeight: 1.6,
                    color: TEXT_PRIMARY,
                    opacity: 0.85,
                    whiteSpace: "pre-line",
                    fontWeight: 400,
                  }}
                >
                  {leadStory.content}
                </div>
              </div>
            </div>

            {/* Feed — single continuous stream of story rows, Apple News list style */}
            {feedStories.length > 0 && (
              <div
                style={{
                  background: GLASS_BG,
                  backdropFilter: "blur(24px) saturate(180%)",
                  WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  border: GLASS_BORDER,
                  borderRadius: 24,
                  boxShadow: GLASS_SHADOW,
                  overflow: "hidden",
                }}
              >
                {feedStories.map((post, index) => (
                  <div
                    key={post.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      padding: "20px 24px",
                      borderTop: index === 0 ? "none" : HAIRLINE,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                        }}
                      >
                        <span
                          style={{
                            color: GOLD,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          {post.category || "News"}
                        </span>
                        <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}>•</span>
                        <span style={{ color: TEXT_SECONDARY, fontWeight: 500 }}>
                          {timeAgo(post.created_at)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          color: TEXT_PRIMARY,
                          letterSpacing: -0.3,
                          lineHeight: 1.25,
                          marginBottom: 6,
                        }}
                      >
                        {post.title}
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color: TEXT_SECONDARY,
                          lineHeight: 1.5,
                          whiteSpace: "pre-line",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {post.content}
                      </div>
                    </div>

                    {post.image_url && (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        style={{
                          width: 92,
                          height: 92,
                          objectFit: "cover",
                          borderRadius: 14,
                          border: "1px solid rgba(0,0,0,0.06)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
