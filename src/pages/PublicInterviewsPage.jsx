import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';
const GOLD = "#d4af37";
const TEXT_PRIMARY = "#1d1d1f";
const TEXT_SECONDARY = "#6e6e73";
const GLASS_BG = "rgba(255,255,255,0.7)";
const GLASS_BORDER = "1px solid rgba(0,0,0,0.06)";
const GLASS_SHADOW = "0 8px 30px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,0.6) inset";
const HAIRLINE = "1px solid rgba(0,0,0,0.08)";

const TYPE_ACCENTS = {
  pre: { color: "#0071e3", tint: "rgba(0,113,227,0.09)", label: "Pre-Race" },
  post: { color: "#af52de", tint: "rgba(175,82,222,0.09)", label: "Post-Race" },
  default: { color: "#ff9500", tint: "rgba(255,149,0,0.1)", label: "Interview" },
};

function getTypeAccent(interviewType) {
  const key = String(interviewType || "").toLowerCase();
  if (key.includes("pre")) return TYPE_ACCENTS.pre;
  if (key.includes("post")) return TYPE_ACCENTS.post;
  return TYPE_ACCENTS.default;
}

export default function PublicInterviewsPage({ seriesId = "cup" }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [raceFilter, setRaceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [seriesFilter, setSeriesFilter] = useState(seriesId);

  const removedDriverNumbers = new Set(["16"]);
  const removedDriverNames = new Set(["vtfan_25"]);

  function isRemovedLeagueInterview(interview) {
    const numberKey = String(interview?.driver_number ?? "").trim();
    const nameKey = String(interview?.driver_name ?? "").trim().toLowerCase();
    return removedDriverNumbers.has(numberKey) || removedDriverNames.has(nameKey);
  }

  useEffect(() => {
    loadInterviews();
  }, [seriesFilter]);

  async function loadInterviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("series", seriesFilter)
      .eq("answered", true)
      .order("generated_at", { ascending: false });

    if (error) {
      console.error("Could not load interviews:", error);
      setLoading(false);
      return;
    }

    setInterviews((data || []).filter((interview) => !isRemovedLeagueInterview(interview)));
    setLoading(false);
  }

  function getAnsweredPairs(interview) {
    const qa = interview.questions_and_answers;

    if (Array.isArray(qa)) {
      return qa.filter(
        (item) =>
          item &&
          item.question &&
          item.answer &&
          String(item.answer).trim() !== ""
      );
    }

    if (typeof qa === "string") {
      try {
        const parsed = JSON.parse(qa);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) =>
              item &&
              item.question &&
              item.answer &&
              String(item.answer).trim() !== ""
          );
        }
      } catch {
        return [];
      }
    }

    return [];
  }

  const answeredInterviews = useMemo(() => {
    return interviews
      .map((interview) => ({
        ...interview,
        answeredPairs: getAnsweredPairs(interview),
      }))
      .filter((interview) => interview.answeredPairs.length > 0);
  }, [interviews]);

  const races = useMemo(() => {
    return [
      "All",
      ...new Set(
        answeredInterviews
          .map((item) => item.race_name || item.race || "Unknown Race")
          .filter(Boolean)
      ),
    ];
  }, [answeredInterviews]);

  const filteredInterviews = useMemo(() => {
    return answeredInterviews.filter((interview) => {
      const driverText = `${interview.driver_name || ""} ${
        interview.driver_number || ""
      }`.toLowerCase();

      const qaText = interview.answeredPairs
        .map((pair) => `${pair.question} ${pair.answer}`)
        .join(" ")
        .toLowerCase();

      const raceName = interview.race_name || interview.race || "Unknown Race";

      const interviewType = String(
        interview.type || interview.interview_type || ""
      ).toLowerCase();

      const matchesSearch =
        driverText.includes(search.toLowerCase()) ||
        qaText.includes(search.toLowerCase());

      const matchesRace = raceFilter === "All" || raceName === raceFilter;

      const matchesType =
        typeFilter === "All" || interviewType.includes(typeFilter);

      return matchesSearch && matchesRace && matchesType;
    });
  }, [answeredInterviews, search, raceFilter, typeFilter]);

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
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
        <div
          style={{
            background: GLASS_BG,
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: GLASS_BORDER,
            borderRadius: 22,
            padding: 22,
            marginBottom: 22,
            boxShadow: GLASS_SHADOW,
          }}
        >
          <button
            onClick={() => (window.location.href = seriesFilter === "arca" ? "/series/arca/standings" : "/standings")}
            style={{
              background: "rgba(0,0,0,0.05)",
              color: TEXT_PRIMARY,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 999,
              padding: "9px 16px",
              fontWeight: 600,
              cursor: "pointer",
              marginBottom: 18,
              fontFamily: FONT_STACK,
              fontSize: 14,
            }}
          >
            ← Back to Standings
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 4 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: -0.8, color: TEXT_PRIMARY }}>
                Driver Interviews
              </h1>
              <p style={{ color: TEXT_SECONDARY, marginTop: 8, fontSize: 14.5 }}>
                Answered pre-race and post-race interviews from the Budweiser {seriesFilter === "arca" ? "ARCA" : "Cup"} League.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(0,0,0,0.05)",
                borderRadius: 999,
                padding: 4,
              }}
            >
              <button
                onClick={() => setSeriesFilter("cup")}
                style={{
                  background: seriesFilter === "cup" ? TEXT_PRIMARY : "transparent",
                  color: seriesFilter === "cup" ? "white" : TEXT_SECONDARY,
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: FONT_STACK,
                }}
              >
                Cup Series
              </button>
              <button
                onClick={() => setSeriesFilter("arca")}
                style={{
                  background: seriesFilter === "arca" ? TEXT_PRIMARY : "transparent",
                  color: seriesFilter === "arca" ? "white" : TEXT_SECONDARY,
                  border: "none",
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: FONT_STACK,
                }}
              >
                ARCA Series
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 22,
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search driver, number, question, or answer..."
            style={{
              flex: "1 1 280px",
              background: "rgba(0,0,0,0.04)",
              color: TEXT_PRIMARY,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: "11px 14px",
              fontFamily: FONT_STACK,
              fontSize: 14,
            }}
          />

          <select
            value={raceFilter}
            onChange={(event) => setRaceFilter(event.target.value)}
            style={{
              background: "rgba(0,0,0,0.04)",
              color: TEXT_PRIMARY,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: "11px 14px",
              fontFamily: FONT_STACK,
              fontSize: 14,
            }}
          >
            {races.map((race) => (
              <option key={race} value={race}>
                {race}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            style={{
              background: "rgba(0,0,0,0.04)",
              color: TEXT_PRIMARY,
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 12,
              padding: "11px 14px",
              fontFamily: FONT_STACK,
              fontSize: 14,
            }}
          >
            <option value="All">All Interviews</option>
            <option value="pre">Pre-Race</option>
            <option value="post">Post-Race</option>
          </select>
        </div>

        {loading ? (
          <div style={{ color: TEXT_SECONDARY, padding: 24 }}>Loading interviews...</div>
        ) : filteredInterviews.length === 0 ? (
          <div
            style={{
              background: GLASS_BG,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: GLASS_BORDER,
              borderRadius: 22,
              padding: 30,
              textAlign: "center",
              color: TEXT_SECONDARY,
              boxShadow: GLASS_SHADOW,
            }}
          >
            No answered interviews found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 18 }}>
            {filteredInterviews.map((interview) => {
              const raceName =
                interview.race_name || interview.race || "Unknown Race";

              const interviewType =
                interview.type || interview.interview_type || "Interview";

              const accent = getTypeAccent(interviewType);

              return (
                <div
                  key={interview.id || `${interview.driver_name}-${raceName}`}
                  style={{
                    background: GLASS_BG,
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: GLASS_BORDER,
                    borderLeft: `4px solid ${accent.color}`,
                    borderRadius: 22,
                    padding: 22,
                    boxShadow: GLASS_SHADOW,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.4, color: TEXT_PRIMARY }}>
                        #{interview.driver_number || "--"}{" "}
                        {interview.driver_name || "Unknown Driver"}
                      </h2>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: accent.tint,
                            color: accent.color,
                            borderRadius: 999,
                            padding: "4px 11px",
                            fontWeight: 700,
                            fontSize: 12,
                            textTransform: "uppercase",
                            letterSpacing: 0.4,
                          }}
                        >
                          {accent.label}
                        </span>
                        <span style={{ color: TEXT_SECONDARY, fontSize: 13.5 }}>{raceName}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: GOLD,
                        color: "#1d1d1f",
                        borderRadius: 999,
                        padding: "6px 14px",
                        fontWeight: 700,
                        fontSize: 12.5,
                        height: "fit-content",
                      }}
                    >
                      Answered
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 14 }}>
                    {interview.answeredPairs.map((pair, index) => (
                      <div
                        key={index}
                        style={{
                          background: accent.tint,
                          border: `1px solid ${accent.color}22`,
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <div style={{ color: accent.color, fontWeight: 700, fontSize: 14.5 }}>
                          Q: {pair.question}
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            lineHeight: 1.6,
                            color: TEXT_PRIMARY,
                            opacity: 0.88,
                            fontSize: 15,
                          }}
                        >
                          A: {pair.answer}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
