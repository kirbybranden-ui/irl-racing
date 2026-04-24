import { useEffect, useState, useMemo } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const inputStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", width: "100%", resize: "vertical" };
const selectStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", width: "100%" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const blueButtonStyle = { background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const greenButtonStyle = { background: "#16a34a", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };

const emptyQA = () => [
  { question: "", answer: "" },
  { question: "", answer: "" },
  { question: "", answer: "" },
];

export default function InterviewsPage({ drivers = [], tracks = [], seasons = [], activeSeasonId = "" }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Filter state
  const [filterDriver, setFilterDriver] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterType, setFilterType] = useState("");

  // Form state
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [interviewType, setInterviewType] = useState("pre");
  const [qa, setQa] = useState(emptyQA());

  // Auto-detect next upcoming race
  const nextRace = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return [...tracks]
      .filter(t => t.date)
      .map(t => ({ ...t, dateObj: new Date(t.date + "T12:00:00") }))
      .sort((a, b) => a.dateObj - b.dateObj)
      .find(t => { const d = new Date(t.dateObj); d.setHours(0, 0, 0, 0); return d >= today; });
  }, [tracks]);

  useEffect(() => {
    if (nextRace && !selectedRace) setSelectedRace(nextRace.name);
  }, [nextRace]);

  useEffect(() => { loadInterviews(); }, []);

  async function loadInterviews() {
    setLoading(true);
    const { data, error } = await supabase
      .from("interviews").select("*").order("generated_at", { ascending: false });
    if (!error) setInterviews(data || []);
    setLoading(false);
  }

  async function deleteInterview(id) {
    if (!window.confirm("Delete this interview?")) return;
    await supabase.from("interviews").delete().eq("id", id);
    setInterviews(prev => prev.filter(i => i.id !== id));
  }

  function updateQA(index, field, value) {
    setQa(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  }

  async function saveInterview() {
    if (!selectedDriverId) { setSaveStatus("⚠️ Please select a driver."); return; }
    if (!selectedRace) { setSaveStatus("⚠️ Please select a race."); return; }
    const filled = qa.filter(q => q.question.trim() && q.answer.trim());
    if (filled.length === 0) { setSaveStatus("⚠️ Please fill in at least one question and answer."); return; }

    const driver = drivers.find(d => String(d.id) === String(selectedDriverId));
    if (!driver) { setSaveStatus("⚠️ Driver not found."); return; }

    // Check for existing
    const exists = interviews.some(
      i => String(i.driver_id) === String(driver.id) && i.race_name === selectedRace && i.type === interviewType
    );
    if (exists) {
      setSaveStatus(`⚠️ A ${interviewType}-race interview for ${driver.name} at ${selectedRace} already exists. Delete it first to replace.`);
      return;
    }

    setSaving(true);
    setSaveStatus("");

    const { data: saved, error } = await supabase.from("interviews").insert({
      driver_id: driver.id,
      driver_name: driver.name,
      driver_number: driver.number,
      race_name: selectedRace,
      type: interviewType,
      questions_and_answers: filled,
      generated_at: new Date().toISOString(),
    }).select().single();

    if (error) {
      setSaveStatus(`❌ Failed to save: ${error.message}`);
    } else {
      setInterviews(prev => [saved, ...prev]);
      setQa(emptyQA());
      setSaveStatus(`✅ ${interviewType === "pre" ? "Pre" : "Post"}-race interview for ${driver.name} published to their profile!`);
    }
    setSaving(false);
  }

  const allDriverNames = [...new Set(interviews.map(i => i.driver_name).filter(Boolean))].sort();
  const allRaces = [...new Set(interviews.map(i => i.race_name).filter(Boolean))].sort();

  const filtered = interviews.filter(i => {
    if (filterDriver && i.driver_name !== filterDriver) return false;
    if (filterRace && i.race_name !== filterRace) return false;
    if (filterType && i.type !== filterType) return false;
    return true;
  });

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

        {/* Create Interview Form */}
        <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Create Interview</h2>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 20 }}>
            Fill in 3 questions and answers. Publishes instantly to the driver's profile page.
          </div>

          {/* Driver / Race / Type row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={selectStyle} value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}>
                <option value="">Select driver...</option>
                {[...drivers].filter(d => !d.retired).sort((a, b) => a.number - b.number).map(d => (
                  <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Race {nextRace && <span style={{ color: "#d4af37", fontWeight: 400 }}>— next: {nextRace.name}</span>}
              </div>
              <select style={selectStyle} value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
                <option value="">Select race...</option>
                {[...tracks].sort((a, b) => {
                  if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                  return a.name.localeCompare(b.name);
                }).map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name}{t.date ? ` (${new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}
                    {t.name === nextRace?.name ? " ← Next" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Interview Type</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setInterviewType("pre")}
                  style={{ ...interviewType === "pre" ? blueButtonStyle : secondaryButtonStyle, flex: 1, fontSize: 13 }}
                >
                  🎤 Pre-Race
                </button>
                <button
                  onClick={() => setInterviewType("post")}
                  style={{ ...interviewType === "post" ? greenButtonStyle : secondaryButtonStyle, flex: 1, fontSize: 13 }}
                >
                  🏆 Post-Race
                </button>
              </div>
            </div>
          </div>

          {/* 3 Q&A rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            {qa.map((item, i) => (
              <div key={i} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12, color: interviewType === "pre" ? "#3b82f6" : "#22c55e" }}>
                  Question {i + 1}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>Q</div>
                  <textarea
                    rows={2}
                    style={inputStyle}
                    placeholder={`Type question ${i + 1}...`}
                    value={item.question}
                    onChange={e => updateQA(i, "question", e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, opacity: 0.7 }}>A</div>
                  <textarea
                    rows={3}
                    style={inputStyle}
                    placeholder="Type the driver's answer..."
                    value={item.answer}
                    onChange={e => updateQA(i, "answer", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              style={{ ...primaryButtonStyle, opacity: saving ? 0.6 : 1 }}
              disabled={saving}
              onClick={saveInterview}
            >
              {saving ? "Saving..." : "📤 Publish Interview"}
            </button>
            <button
              style={secondaryButtonStyle}
              onClick={() => { setQa(emptyQA()); setSaveStatus(""); }}
            >
              Clear
            </button>
          </div>

          {saveStatus && (
            <div style={{ marginTop: 14, fontSize: 13, padding: "10px 14px", background: "#0a0d12", borderRadius: 10, border: "1px solid #2c3440", lineHeight: 1.5 }}>
              {saveStatus}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={selectStyle} value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {allDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race</div>
              <select style={selectStyle} value={filterRace} onChange={e => setFilterRace(e.target.value)}>
                <option value="">All Races</option>
                {allRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Type</div>
              <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
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

        {/* Interview List */}
        {loading ? (
          <div style={sectionCardStyle}>Loading interviews...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...sectionCardStyle, opacity: 0.7, textAlign: "center", padding: 40 }}>
            No interviews yet. Create one above.
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ background: isPre ? "#3b82f6" : "#22c55e", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                              {isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE"}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>#{interview.driver_number} {interview.driver_name}</span>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.5 }}>{new Date(interview.generated_at).toLocaleString()}</div>
                        </div>
                        <button onClick={() => deleteInterview(interview.id)} style={dangerButtonStyle}>Delete</button>
                      </div>
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
