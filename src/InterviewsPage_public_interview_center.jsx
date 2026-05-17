import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const pageStyle = {
  minHeight: "100vh",
  background: "#0c0f14",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const containerStyle = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: 20,
};

const heroStyle = {
  background: "linear-gradient(135deg, #171b22 0%, #10141b 100%)",
  border: "1px solid #2c3440",
  borderRadius: 18,
  padding: 22,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
};

const buttonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#222936",
  color: "white",
  border: "1px solid #3a4453",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 800,
  cursor: "pointer",
};

const inputStyle = {
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  minWidth: 230,
};

const cardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 16,
  padding: 18,
  marginBottom: 16,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};

const qaStyle = {
  background: "#0f1319",
  border: "1px solid #263041",
  borderRadius: 12,
  padding: 14,
  marginTop: 12,
};

function normalizeInterviewRows(rows = []) {
  return rows
    .filter((row) => row && row.answered === true)
    .map((row) => {
      const qa = Array.isArray(row.questions_and_answers)
        ? row.questions_and_answers.filter((item) => {
            const question = String(item?.question || "").trim();
            const answer = String(item?.answer || "").trim();
            return question && answer;
          })
        : [];

      return {
        ...row,
        questions_and_answers: qa,
      };
    })
    .filter((row) => row.questions_and_answers.length > 0);
}

function getInterviewTypeLabel(type) {
  const cleanType = String(type || "").toLowerCase();
  if (cleanType === "pre") return "🎤 PRE-RACE";
  if (cleanType === "post") return "🏆 POST-RACE";
  return "🎙️ INTERVIEW";
}

function getInterviewTypeColor(type) {
  const cleanType = String(type || "").toLowerCase();
  if (cleanType === "pre") return "#3b82f6";
  if (cleanType === "post") return "#22c55e";
  return "#d4af37";
}

export default function PublicInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRace, setSelectedRace] = useState("All Races");
  const [selectedType, setSelectedType] = useState("All Types");

  useEffect(() => {
    let isMounted = true;

    async function loadAnsweredInterviews() {
      setLoading(true);
      setError("");

      const { data, error: loadError } = await supabase
        .from("interviews")
        .select("*")
        .eq("answered", true)
        .order("created_at", { ascending: false });

      if (!isMounted) return;

      if (loadError) {
        console.error("Failed to load public interviews:", loadError);
        setError("Could not load interviews. Check the interviews table RLS select policy.");
        setInterviews([]);
        setLoading(false);
        return;
      }

      setInterviews(normalizeInterviewRows(data || []));
      setLoading(false);
    }

    loadAnsweredInterviews();

    const interval = setInterval(loadAnsweredInterviews, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const raceOptions = useMemo(() => {
    const races = Array.from(new Set(interviews.map((item) => item.race_name || "Unknown Race"))).sort();
    return ["All Races", ...races];
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return interviews.filter((item) => {
      const qaText = (item.questions_and_answers || [])
        .map((qa) => `${qa.question || ""} ${qa.answer || ""}`)
        .join(" ")
        .toLowerCase();

      const combined = `${item.driver_name || ""} ${item.driver_number || ""} ${item.race_name || ""} ${item.type || ""} ${qaText}`.toLowerCase();

      const matchesSearch = !searchText || combined.includes(searchText);
      const matchesRace = selectedRace === "All Races" || (item.race_name || "Unknown Race") === selectedRace;
      const matchesType = selectedType === "All Types" || String(item.type || "").toLowerCase() === selectedType;

      return matchesSearch && matchesRace && matchesType;
    });
  }, [interviews, search, selectedRace, selectedType]);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: "-0.03em" }}>🎙️ Driver Interview Center</div>
              <div style={{ opacity: 0.72, marginTop: 6 }}>Answered pre-race and post-race interviews from the Budweiser Cup League.</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>
                ← Standings
              </button>
              <button type="button" onClick={() => window.location.reload()} style={buttonStyle}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search driver, race, question, or quote..."
            style={{ ...inputStyle, flex: "1 1 280px" }}
          />

          <select value={selectedRace} onChange={(event) => setSelectedRace(event.target.value)} style={inputStyle}>
            {raceOptions.map((race) => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>

          <select value={selectedType} onChange={(event) => setSelectedType(event.target.value)} style={inputStyle}>
            <option value="All Types">All Types</option>
            <option value="pre">Pre-Race</option>
            <option value="post">Post-Race</option>
          </select>
        </div>

        {loading && <div style={cardStyle}>Loading answered interviews...</div>}
        {!loading && error && <div style={{ ...cardStyle, borderColor: "#7f1d1d", color: "#fecaca" }}>{error}</div>}
        {!loading && !error && filteredInterviews.length === 0 && (
          <div style={cardStyle}>No answered interviews found yet.</div>
        )}

        {!loading && !error && filteredInterviews.map((interview) => {
          const accent = getInterviewTypeColor(interview.type);

          return (
            <div key={interview.id} style={{ ...cardStyle, borderTop: `4px solid ${accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 950 }}>
                    #{interview.driver_number || "--"} {interview.driver_name || "Unknown Driver"}
                  </div>
                  <div style={{ opacity: 0.7, marginTop: 4 }}>{interview.race_name || "Budweiser Cup League"}</div>
                </div>

                <div style={{ background: accent, color: "white", borderRadius: 999, padding: "7px 12px", fontWeight: 900, fontSize: 12 }}>
                  {getInterviewTypeLabel(interview.type)}
                </div>
              </div>

              {(interview.questions_and_answers || []).map((qa, index) => (
                <div key={`${interview.id}-${index}`} style={qaStyle}>
                  <div style={{ color: "#facc15", fontWeight: 900, lineHeight: 1.5 }}>
                    Q: {qa.question}
                  </div>
                  <div style={{ marginTop: 10, lineHeight: 1.65, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>
                    <strong style={{ color: "white" }}>A:</strong> {qa.answer}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
