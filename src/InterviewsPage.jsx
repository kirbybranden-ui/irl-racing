import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const inputStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 };

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDriver, setFilterDriver] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    loadInterviews();
  }, []);

  async function loadInterviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .order("generated_at", { ascending: false });
    if (!error) setInterviews(data || []);
    setLoading(false);
  }

  async function deleteInterview(id) {
    if (!window.confirm("Delete this interview?")) return;
    await supabase.from("interviews").delete().eq("id", id);
    setInterviews(prev => prev.filter(i => i.id !== id));
  }

  const drivers  = [...new Set(interviews.map(i => i.driver_name).filter(Boolean))].sort();
  const races    = [...new Set(interviews.map(i => i.race_name).filter(Boolean))].sort();

  const filtered = interviews.filter(i => {
    if (filterDriver && i.driver_name !== filterDriver) return false;
    if (filterRace   && i.race_name   !== filterRace)   return false;
    if (filterType   && i.type        !== filterType)    return false;
    return true;
  });

  // Group by race for display
  const grouped = filtered.reduce((acc, interview) => {
    const key = interview.race_name || "Unknown Race";
    if (!acc[key]) acc[key] = [];
    acc[key].push(interview);
    return acc;
  }, {});

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>🎙️ Driver Interviews</h1>
            <div style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>{interviews.length} total interviews</div>
          </div>
          <button onClick={() => window.location.pathname = "/"} style={secondaryButtonStyle}>← Admin</button>
        </div>

        {/* Filters */}
        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={{ ...inputStyle, width: "100%" }} value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {drivers.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race</div>
              <select style={{ ...inputStyle, width: "100%" }} value={filterRace} onChange={e => setFilterRace(e.target.value)}>
                <option value="">All Races</option>
                {races.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Type</div>
              <select style={{ ...inputStyle, width: "100%" }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Pre & Post</option>
                <option value="pre">Pre-Race Only</option>
                <option value="post">Post-Race Only</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setFilterDriver(""); setFilterRace(""); setFilterType(""); }} style={{ ...secondaryButtonStyle, width: "100%" }}>
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={sectionCardStyle}>Loading interviews...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...sectionCardStyle, opacity: 0.7, textAlign: "center", padding: 40 }}>
            No interviews yet. They generate automatically when drivers visit their profile pages.
          </div>
        ) : (
          Object.entries(grouped).map(([raceName, raceInterviews]) => (
            <div key={raceName} style={sectionCardStyle}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, borderBottom: "1px solid #2c3440", paddingBottom: 12 }}>
                🏁 {raceName}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {raceInterviews.map(interview => {
                  const isPre = interview.type === "pre";
                  const qa = Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [];
                  return (
                    <div key={interview.id} style={{ background: "#0f1319", border: `1px solid ${isPre ? "#1e3a6e" : "#1a5c30"}`, borderRadius: 12, padding: 16 }}>
                      {/* Interview header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ background: isPre ? "#3b82f6" : "#22c55e", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                              {isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE"}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>
                              #{interview.driver_number} {interview.driver_name}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.5 }}>
                            Generated {new Date(interview.generated_at).toLocaleString()}
                          </div>
                        </div>
                        <button onClick={() => deleteInterview(interview.id)} style={dangerButtonStyle}>Delete</button>
                      </div>

                      {/* Q&A */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {qa.map((item, i) => (
                          <div key={i} style={{ borderLeft: `3px solid ${isPre ? "#3b82f6" : "#22c55e"}`, paddingLeft: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>Q: {item.question}</div>
                            <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>"{item.answer}"</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
