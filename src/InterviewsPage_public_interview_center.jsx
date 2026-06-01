import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [raceFilter, setRaceFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const removedDriverNumbers = new Set(["16"]);
  const removedDriverNames = new Set(["vtfan_25"]);

  function isRemovedLeagueInterview(interview) {
    const numberKey = String(interview?.driver_number ?? "").trim();
    const nameKey = String(interview?.driver_name ?? "").trim().toLowerCase();
    return removedDriverNumbers.has(numberKey) || removedDriverNames.has(nameKey);
  }

  useEffect(() => {
    loadInterviews();
  }, []);

  async function loadInterviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
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
        background: "#0c0f14",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
        <div
          style={{
            background: "#171b22",
            border: "1px solid #2c3440",
            borderRadius: 16,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <button
            onClick={() => (window.location.href = "/standings")}
            style={{
              background: "#2a3140",
              color: "white",
              border: "1px solid #3d4859",
              borderRadius: 10,
              padding: "10px 16px",
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            ← Back to Standings
          </button>

          <h1 style={{ margin: 0, fontSize: 36 }}>🎤 Driver Interviews</h1>

          <p style={{ opacity: 0.75, marginTop: 8 }}>
            Answered pre-race and post-race interviews from the Budweiser Cup
            League.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search driver, number, question, or answer..."
            style={{
              flex: "1 1 280px",
              background: "#0f1319",
              color: "white",
              border: "1px solid #313947",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          />

          <select
            value={raceFilter}
            onChange={(event) => setRaceFilter(event.target.value)}
            style={{
              background: "#0f1319",
              color: "white",
              border: "1px solid #313947",
              borderRadius: 10,
              padding: "10px 12px",
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
              background: "#0f1319",
              color: "white",
              border: "1px solid #313947",
              borderRadius: 10,
              padding: "10px 12px",
            }}
          >
            <option value="All">All Interviews</option>
            <option value="pre">Pre-Race</option>
            <option value="post">Post-Race</option>
          </select>
        </div>

        {loading ? (
          <div>Loading interviews...</div>
        ) : filteredInterviews.length === 0 ? (
          <div
            style={{
              background: "#171b22",
              border: "1px solid #2c3440",
              borderRadius: 16,
              padding: 20,
            }}
          >
            No answered interviews found.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {filteredInterviews.map((interview) => {
              const raceName =
                interview.race_name || interview.race || "Unknown Race";

              const interviewType =
                interview.type || interview.interview_type || "Interview";

              return (
                <div
                  key={interview.id || `${interview.driver_name}-${raceName}`}
                  style={{
                    background: "#171b22",
                    border: "1px solid #2c3440",
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      marginBottom: 14,
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0 }}>
                        #{interview.driver_number || "--"}{" "}
                        {interview.driver_name || "Unknown Driver"}
                      </h2>

                      <div style={{ opacity: 0.7, marginTop: 4 }}>
                        {interviewType} • {raceName}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#d4af37",
                        color: "#111",
                        borderRadius: 999,
                        padding: "6px 12px",
                        fontWeight: 900,
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
                          background: "#0f1319",
                          border: "1px solid #252c38",
                          borderRadius: 12,
                          padding: 14,
                        }}
                      >
                        <div style={{ color: "#d4af37", fontWeight: 900 }}>
                          Q: {pair.question}
                        </div>

                        <div
                          style={{
                            marginTop: 10,
                            lineHeight: 1.6,
                            color: "#f3f4f6",
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
