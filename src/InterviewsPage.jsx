import { useEffect, useState, useMemo } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const inputStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", width: "100%" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const blueButtonStyle = { background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const greenButtonStyle = { background: "#16a34a", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };

const teamFullNames = {
  JAM: "JA Motorsports", MER: "ME Racing", KRM: "Kevin Racing Motorsports",
  MMS: "Mayhem Motorsports", NLM: "Nine Line Motorsports", Independent: "Independent",
};
function getTeamFullName(t) { return teamFullNames[t] || t; }

export default function InterviewsPage({ drivers = [], tracks = [], seasons = [], activeSeasonId = "" }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDriver, setFilterDriver] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterType, setFilterType] = useState("");

  // Generate section state
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState("");

  const activeSeason = seasons.find(s => s.id === activeSeasonId) || seasons[0] || null;

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

  async function generateInterview(type) {
    if (!selectedDriverId) { setGenerateStatus("⚠️ Please select a driver."); return; }
    if (!selectedRace) { setGenerateStatus("⚠️ Please select a race."); return; }

    const driver = drivers.find(d => String(d.id) === String(selectedDriverId));
    if (!driver) { setGenerateStatus("⚠️ Driver not found."); return; }

    // Check if already exists
    const exists = interviews.some(
      i => String(i.driver_id) === String(driver.id) && i.race_name === selectedRace && i.type === type
    );
    if (exists) {
      setGenerateStatus(`⚠️ A ${type}-race interview for ${driver.name} at ${selectedRace} already exists.`);
      return;
    }

    setGenerating(true);
    setGenerateStatus(`⏳ Generating ${type === "pre" ? "pre" : "post"}-race interview for #${driver.number} ${driver.name}...`);

    const hasTeam = driver.team && driver.team !== "Independent";
    const teamName = getTeamFullName(driver.team);
    const teammates = hasTeam
      ? (activeSeason?.drivers || []).filter(d => d.team === driver.team && d.id !== driver.id)
      : [];
    const sorted = [...(activeSeason?.drivers || [])].sort((a, b) => b.points - a.points);
    const ranking = sorted.findIndex(d => d.id === driver.id) + 1;
    const raceHistory = activeSeason?.raceHistory || [];

    let prompt = "";
    if (type === "pre") {
      prompt = `You are a motorsports journalist interviewing ${driver.name}, driver of the #${driver.number} ${driver.manufacturer}${hasTeam ? ` for ${teamName}` : " as an independent driver"} in the Budweiser Cup League iRacing series.

This is a PRE-RACE interview the day before the ${selectedRace}.
${hasTeam && teammates.length > 0 ? `Teammate(s): ${teammates.map(t => `#${t.number} ${t.name}`).join(", ")}.` : ""}
Current season: P${ranking} in standings, ${driver.points} points, ${driver.wins} wins.

Generate 4 varied pre-race interview questions and in-character answers. Mix expectations, strategy, car setup, and competitive goals. Answers in first person, authentic racing driver style, 2-3 sentences each. Make it specific to this race and unique.

Respond ONLY with a valid JSON array, no markdown or backticks:
[{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}]`;
    } else {
      const latestRace = raceHistory.find(r => r.raceName === selectedRace);
      const result = latestRace?.results?.find(r => r.driverId === driver.id);
      const resultContext = result
        ? `Race result: Finished P${result.finishPos || "unknown"}${result.dnf ? ` (DNF)` : ""}${result.isWin ? " — WON THE RACE! 🏆" : ""}. Earned ${result.totalRacePoints} points${result.fastestLap ? ", set fastest lap" : ""}.`
        : `No recorded result for this driver at this race.`;

      prompt = `You are a motorsports journalist interviewing ${driver.name}, driver of the #${driver.number} ${driver.manufacturer}${hasTeam ? ` for ${teamName}` : " as an independent driver"} in the Budweiser Cup League iRacing series.

This is a POST-RACE interview after the ${selectedRace}.
${resultContext}
Season standings: P${ranking} with ${driver.points} total points, ${driver.wins} wins across ${raceHistory.length} races.
${hasTeam && teammates.length > 0 ? `Teammate(s): ${teammates.map(t => `#${t.number} ${t.name} (${t.points} pts)`).join(", ")}.` : ""}

Generate 4 varied post-race interview questions and in-character answers. Reference the actual result, car performance, season outlook. Answers in first person, authentic racing driver style, 2-3 sentences each.

Respond ONLY with a valid JSON array, no markdown or backticks:
[{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."},{"question":"...","answer":"..."}]`;
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const aiData = await res.json();
      const text = aiData.content?.[0]?.text || "[]";
      const qa = JSON.parse(text.replace(/```json|```/g, "").trim());

      const { data: saved, error } = await supabase.from("interviews").insert({
        driver_id: driver.id,
        driver_name: driver.name,
        driver_number: driver.number,
        race_name: selectedRace,
        type,
        questions_and_answers: qa,
        generated_at: new Date().toISOString()
      }).select().single();

      if (error) throw error;
      setInterviews(prev => [saved, ...prev]);
      setGenerateStatus(`✅ ${type === "pre" ? "Pre" : "Post"}-race interview for ${driver.name} generated and published to their driver profile!`);
    } catch (err) {
      console.error("Generation failed:", err);
      setGenerateStatus(`❌ Generation failed: ${err.message}`);
    }
    setGenerating(false);
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

        {/* Generate Section */}
        <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Generate Interview</h2>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>
            Manually generate a pre or post-race interview for any driver. Publishes instantly to their driver profile. Will not overwrite an existing interview.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={inputStyle} value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}>
                <option value="">Select a driver...</option>
                {[...drivers]
                  .filter(d => !d.retired)
                  .sort((a, b) => a.number - b.number)
                  .map(d => (
                    <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                Race {nextRace && <span style={{ color: "#d4af37", fontWeight: 400, fontSize: 11 }}>— auto-selected: {nextRace.name}</span>}
              </div>
              <select style={inputStyle} value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
                <option value="">Select a race...</option>
                {[...tracks]
                  .sort((a, b) => {
                    if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                    return a.name.localeCompare(b.name);
                  })
                  .map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name}{t.date ? ` (${new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}
                      {t.name === nextRace?.name ? " ← Next" : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
            <button
              style={{ ...blueButtonStyle, opacity: generating ? 0.6 : 1 }}
              disabled={generating}
              onClick={() => generateInterview("pre")}
            >
              {generating ? "⏳ Generating..." : "🎤 Generate Pre-Race Interview"}
            </button>
            <button
              style={{ ...greenButtonStyle, opacity: generating ? 0.6 : 1 }}
              disabled={generating}
              onClick={() => generateInterview("post")}
            >
              {generating ? "⏳ Generating..." : "🏆 Generate Post-Race Interview"}
            </button>
          </div>

          {generateStatus && (
            <div style={{ fontSize: 13, padding: "10px 14px", background: "#0f1319", borderRadius: 10, border: "1px solid #2c3440", lineHeight: 1.5 }}>
              {generateStatus}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={inputStyle} value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {allDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race</div>
              <select style={inputStyle} value={filterRace} onChange={e => setFilterRace(e.target.value)}>
                <option value="">All Races</option>
                {allRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Type</div>
              <select style={inputStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
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
            No interviews yet. Use the Generate section above or they auto-generate when drivers visit their profile pages.
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
                          <div style={{ fontSize: 11, opacity: 0.5 }}>Generated {new Date(interview.generated_at).toLocaleString()}</div>
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
