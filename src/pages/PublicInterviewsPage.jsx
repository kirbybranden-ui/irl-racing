import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { interviewPairs, mediaPersonas } from "../lib/aiMedia";
import "../styles/aiMedia.css";
export default function PublicInterviewsPage() {
  const [items, setItems] = useState([]), [strategy, setStrategy] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => {
    let active = true, checking = false;
    async function load() {
      if (checking || document.visibilityState === "hidden") return;
      checking = true;
      try {
        const state = await supabase.rpc("brl_read_league");
        if (state.error) throw state.error;
        const [interviews, briefings] = await Promise.all([
          supabase.from("brl_ai_sessions").select("id,driver_name,race_name,kind,persona,messages,updated_at")
            .eq("season_id", state.data.activeSeasonId).eq("status", "completed").in("kind", ["pre", "post"])
            .order("updated_at", { ascending: false }).limit(60),
          supabase.from("brl_ai_articles").select("id,title,content,byline,race_name,created_at")
            .eq("season_id", state.data.activeSeasonId).eq("status", "published").eq("category", "Track Strategy")
            .order("created_at", { ascending: false }).limit(12),
        ]);
        if (interviews.error || briefings.error) throw interviews.error || briefings.error;
        if (active) { setItems(interviews.data || []); setStrategy(briefings.data || []); setError(""); }
      } catch (e) { if (active) setError(e.message); }
      finally { checking = false; if (active) setLoading(false); }
    }
    load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", load); };
  }, []);
  return <main className="brl-ai-media">
    <p className="brl-ai-kicker">Inside the paddock</p><h1>Interviews & strategy.</h1>
    <p>Driver reactions and race-week advice from the crew-chief desk.</p><a href="/media">Open my assigned interviews</a>
    {loading && <p>Loading media…</p>}{error && <p role="alert">{error}</p>}
    {strategy.length > 0 && <section aria-label="Public race strategy"><h2>Larry Mac’s strategy desk · AI</h2>
      {strategy.map(s => <article key={s.id}><p>{s.byline} · {s.race_name}</p><h3>{s.title}</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{s.content}</p></article>)}</section>}
    <h2>Driver interviews</h2>
    {!loading && !error && !items.length && <p>Completed interviews will appear here automatically.</p>}
    {items.map(s => <article key={s.id}><p>{s.kind === "pre" ? "Pre-race" : "Post-race"} · {s.race_name} · {mediaPersonas.find(p => p[0] === s.persona)?.[1] || "BRL Reporter"} (AI)</p>
      <h3>{s.driver_name}</h3><details><summary>Read interview</summary>
        {interviewPairs(s.messages).map((p, i) => <div key={i}><p><strong>{p.question}</strong></p><p>{p.answer}</p></div>)}
        {s.messages?.at(-1)?.role === "assistant" && <p><strong>{mediaPersonas.find(p => p[0] === s.persona)?.[1] || "BRL Reporter"} (AI): </strong>{s.messages.at(-1).text}</p>}
      </details></article>)}
    <p className="brl-ai-notice">AI personas are inspired by NASCAR broadcasters, not the real people or endorsed by them. Driver answers are their own words.</p>
  </main>;
}
