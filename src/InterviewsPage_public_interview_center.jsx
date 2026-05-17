import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const pageContainerStyle = {
  minHeight: "100vh",
  background: "#0b1020",
  color: "white",
  padding: "24px",
  fontFamily: "Arial, sans-serif",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "12px",
  marginBottom: "24px",
};

const titleStyle = {
  fontSize: "2.2rem",
  fontWeight: 900,
  margin: 0,
};

const subTextStyle = {
  color: "#9ca3af",
  marginTop: 6,
};

const buttonStyle = {
  background: "#c8102e",
  color: "white",
  border: "none",
  padding: "10px 16px",
  borderRadius: "10px",
  fontWeight: 700,
  cursor: "pointer",
};

const controlsRowStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "20px",
};

const inputStyle = {
  background: "#111827",
  color: "white",
  border: "1px solid #374151",
  borderRadius: "10px",
  padding: "10px 14px",
  minWidth: "240px",
};

const selectStyle = {
  background: "#111827",
  color: "white",
  border: "1px solid #374151",
  borderRadius: "10px",
  padding: "10px 14px",
};

const gridStyle = {
  display: "grid",
  gap: "16px",
};

const cardStyle = {
  background: "#111827",
  border: "1px solid #1f2937",
  borderRadius: "18px",
  padding: "20px",
  boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
};

const driverHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "10px",
  marginBottom: "12px",
};

const raceBadgeStyle = {
  background: "#c8102e",
  color: "white",
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "0.85rem",
  fontWeight: 700,
};

const questionStyle = {
  marginTop: "12px",
  lineHeight: 1.6,
  color: "#e5e7eb",
};

const answerStyle = {
  marginTop: "10px",
  lineHeight: 1.7,
  color: "#f9fafb",
  background: "#0f172a",
  borderLeft: "4px solid #c8102e",
  padding: "14px",
  borderRadius: "10px",
};

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRace, setSelectedRace] = useState("All Races");

  useEffect(() => {
    loadInterviews();
  }, []);

  async function loadInterviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load interviews:", error);
      setLoading(false);
      return;
    }

    const answeredOnly = (data || []).filter(
      (item) => item.answer && item.answer.trim() !== ""
    );

    setInterviews(answeredOnly);
    setLoading(false);
  }

  const races = useMemo(() => {
    const unique = Array.from(
      new Set(interviews.map((item) => item.race_name || "Unknown Race"))
    );

    return ["All Races", ...unique];
  }, [interviews]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((item) => {
      const matchesSearch =
        `${item.driver_name || ""} ${item.question || ""} ${item.answer || ""}`
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesRace =
        selectedRace === "All Races"
          ? true
          : (item.race_name || "Unknown Race") === selectedRace;

      return matchesSearch && matchesRace;
    });
  }, [interviews, search, selectedRace]);

  return (
    <div style={pageContainerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>🎤 Driver Interview Center</h1>

          <p style={subTextStyle}>
            Public driver interviews from the Budweiser Cup League.
          </p>
        </div>

        <button
          style={buttonStyle}
          onClick={() => (window.location.href = "/standings")}
        >
          ← Back to Standings
        </button>
      </div>

      <div style={controlsRowStyle}>
        <input
          type="text"
          placeholder="Search drivers or interview quotes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={inputStyle}
        />

        <select
          value={selectedRace}
          onChange={(e) => setSelectedRace(e.target.value)}
          style={selectStyle}
        >
          {races.map((race) => (
            <option key={race} value={race}>
              {race}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading interviews...</p>
      ) : filteredInterviews.length === 0 ? (
        <p>No answered interviews found.</p>
      ) : (
        <div style={gridStyle}>
          {filteredInterviews.map((item) => (
            <div key={item.id} style={cardStyle}>
              <div style={driverHeaderStyle}>
                <div>
                  <h2 style={{ margin: 0 }}>
                    #{item.driver_number || "--"} {item.driver_name || "Unknown Driver"}
                  </h2>

                  <div style={{ color: "#9ca3af", marginTop: 4 }}>
                    {item.team || "Independent"}
                  </div>
                </div>

                <div style={raceBadgeStyle}>
                  {item.race_name || "Budweiser Cup League"}
                </div>
              </div>

              <div style={questionStyle}>
                <strong>Q:</strong> {item.question}
              </div>

              <div style={answerStyle}>
                <strong>A:</strong> {item.answer}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
