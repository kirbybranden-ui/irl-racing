import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useLeagueAccess } from "../../lib/roleAccess";
import { callMedia, mediaPersonas } from "../../lib/aiMedia";
import "../../styles/aiMedia.css";

export default function MediaCenter({ strategyOnly = false }) {
  const { access, loading: accessLoading } = useLeagueAccess();
  const [state, setState] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [enabled, setEnabled] = useState(false);
  const [race, setRace] = useState("");
  const [kind, setKind] = useState(strategyOnly ? "strategy" : "pre");
  const [persona, setPersona] = useState("pit");
  const [selected, setSelected] = useState(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const end = useRef(null);
  const syncUntil = useRef(0);

  async function load() {
    if (!access?.driverId) { setLoading(false); return; }
    setLoading(true);
    try {
      const league = await supabase.rpc("brl_read_league");
      if (league.error) throw league.error;
      const data = league.data;
      const [mine, settings] = await Promise.all([
        supabase.from("brl_ai_sessions").select("*").eq("driver_id", String(access.driverId)).eq("season_id", data.activeSeasonId).order("updated_at", { ascending: false }),
        supabase.from("brl_ai_settings").select("enabled").eq("id", true).single(),
      ]);
      if (mine.error || settings.error) throw mine.error || settings.error;
      setState(data); setSessions(mine.data || []); setEnabled(settings.data.enabled);
      setSelected(current => current ? (mine.data || []).find(s => s.id === current.id) || current : null);
      setRace(current => current || (data.tracks || []).find(t => t.date >= new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year:"numeric",month:"2-digit",day:"2-digit" }).format(new Date()))?.name || data.tracks?.[0]?.name || "");
    } catch (e) { setError(e.message || "Media desk could not load."); }
    finally { setLoading(false); }
  }
  useEffect(() => { setSelected(null); setSessions([]); load(); }, [access?.driverId]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [selected?.version]);

  // A function can finish saving after its browser request has disconnected.
  // Read saved turns while waiting, without reloading or generating another turn.
  useEffect(() => {
    if (!access?.driverId || !state?.activeSeasonId) return;
    let active = true;
    let checking = false;
    async function syncConversation() {
      if (checking || document.visibilityState === "hidden") return;
      if (!busy && Date.now() > syncUntil.current) return;
      checking = true;
      try {
        const { data, error: readError } = await supabase.from("brl_ai_sessions").select("*")
          .eq("driver_id", String(access.driverId)).eq("season_id", state.activeSeasonId)
          .order("updated_at", { ascending: false });
        if (readError || !active) return;
        setSessions(data || []);
        setSelected(current => {
          const saved = (data || []).find(s => s.id === current?.id);
          return saved && saved.version >= current.version ? saved : current;
        });
      } catch { /* Keep the transcript visible during temporary network failures. */ }
      finally { checking = false; }
    }
    const timer = window.setInterval(syncConversation, 3000);
    window.addEventListener("focus", syncConversation);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", syncConversation); };
  }, [access?.driverId, state?.activeSeasonId, busy]);

  async function action(type) {
    if (lock.current) return;
    lock.current = true; syncUntil.current = Date.now() + 120000; setBusy(true); setError("");
    try {
      const result = await callMedia(type === "start" ? { action: type, raceName: race, kind, persona } : { action: type, sessionId: selected.id, version: selected.version, ...(type === "answer" ? { answer } : {}) });
      setSelected(result.session); setAnswer("");
      setSessions(previous => [result.session, ...previous.filter(s => s.id !== result.session.id)]);
    } catch (e) { setError(e.message); await load(); }
    finally { lock.current = false; setBusy(false); }
  }
  const activeSeason = state?.seasons?.find(s => s.id === state.activeSeasonId);
  const interviewHost = mediaPersonas.find(p => p[0] === selected?.persona);
  const pending = selected?.status === "active" && (!selected.messages.length || selected.messages.at(-1)?.role === "user");
  const selectedSessions = sessions.filter(s => strategyOnly ? s.kind === "strategy" : true);

  return <section className="brl-ai-media" aria-label="BRL media conversation">
    <header><span className="brl-ai-kicker">{strategyOnly ? "The crew-chief desk" : "BRL media desk"}</span><h2>{strategyOnly ? "Talk strategy." : "Your story. Your words."}</h2><p>{strategyOnly ? "50% races. 3× fuel consumption. 3× tire wear. Tell the crew-chief AI what the car is doing." : "One question at a time. React, explain, celebrate, or speak your mind."}</p></header>
    {error && <p className="brl-ai-error" role="alert">{error}</p>}
    {accessLoading || loading ? <p>Loading media desk…</p> : !access?.driverId ? <p><a href="/standings?login=1">Log in as a driver</a> to start a conversation.</p> : <>
      {!enabled && <p className="brl-ai-notice">The admin has paused AI media. Your saved conversations remain available.</p>}
      <form className="brl-ai-start" onSubmit={e => { e.preventDefault(); action("start"); }}>
        <label>Race<select value={race} onChange={e => setRace(e.target.value)} disabled={busy}>{(state?.tracks || []).map(t => <option key={t.name} value={t.name}>{t.name} · {t.date}</option>)}</select></label>
        {!strategyOnly && <label>Conversation<select value={kind} onChange={e => setKind(e.target.value)} disabled={busy}><option value="pre">Pre-race interview</option><option value="post">Post-race interview</option><option value="strategy">Strategy & car handling</option></select></label>}
        {kind !== "strategy" && <label>Interviewer<select value={persona} onChange={e => setPersona(e.target.value)} disabled={busy}>{mediaPersonas.filter(p => p[0] !== "crew").map(p => <option key={p[0]} value={p[0]}>{p[1]} · {p[2]}</option>)}</select></label>}
        <button disabled={busy || !enabled || !race || (kind === "post" && !activeSeason?.raceHistory?.some(r => r.raceName === race))}>{busy ? "Connecting…" : "Start / continue conversation"}</button>
        {kind === "post" && !activeSeason?.raceHistory?.some(r => r.raceName === race) && <small>Post-race interviews open after the admin publishes results.</small>}
      </form>
      {selected && <div className="brl-ai-conversation">
        <div className="brl-ai-conversation-heading"><div><strong>{interviewHost?.[1] || "BRL interviewer"} (AI)</strong><small>{selected.race_name} · {selected.kind === "strategy" ? "Strategy" : selected.kind === "pre" ? "Pre-race" : "Post-race"}</small></div><span>{selected.status === "completed" ? "Complete" : selected.status === "review" ? "Awaiting review" : selected.status === "hidden" ? "Closed" : "In conversation"}</span></div>
        <div className="brl-ai-transcript" aria-live="polite">{selected.messages.map(m => <div className={`brl-ai-turn brl-ai-turn--${m.role}`} key={m.id}><strong>{m.role === "user" ? selected.driver_name : interviewHost?.[1]}{m.role !== "user" && " (AI)"}</strong><p>{m.text}</p></div>)}{busy && <p role="status">The interviewer is responding…</p>}<div ref={end} /></div>
        {selected.status === "active" && enabled && (pending ? <div className="brl-ai-actions"><p>Your answer is saved. Continue to get the next response.</p><button disabled={busy} onClick={() => action("resume")}>Retry interviewer response</button></div> : <form onSubmit={e => { e.preventDefault(); action("answer"); }}><label htmlFor="brl-media-answer">Your reply</label><textarea id="brl-media-answer" value={answer} onChange={e => setAnswer(e.target.value)} maxLength={3000} rows={4} disabled={busy} placeholder="Say it in your own words…" /><div className="brl-ai-actions"><button disabled={busy || !answer.trim()}>Send reply</button><button type="button" className="brl-ai-secondary" disabled={busy || !selected.messages.some(m => m.role === "user")} onClick={() => action("finish")}>Wrap up interview</button><small>{answer.length}/3000</small></div></form>)}
        {selected.status === "completed" && selected.kind !== "strategy" && <p className="brl-ai-notice">Media interview completed. No interview bonus is paid. Your words can appear in league coverage.</p>}
        {selected.status === "review" && <p className="brl-ai-notice">The admin will review this conversation before it is shared publicly.</p>}
        {selected.kind === "strategy" && <small>Strategy conversations stay private to you and full admins. Suggestions are practice guidance, not measured telemetry.</small>}
      </div>}
      {selectedSessions.length > 0 && <div className="brl-ai-history"><h3>Saved conversations</h3>{selectedSessions.map(s => <button className="brl-ai-history-row" key={s.id} onClick={() => { setSelected(s); setAnswer(""); setError(""); }} disabled={busy}><span>{s.race_name}<small>{s.kind} · {mediaPersonas.find(p => p[0] === s.persona)?.[1]}</small></span><span>{s.status}</span></button>)}</div>}
    </>}
    <footer>AI personas inspired by NASCAR broadcasters; not the real people or endorsed by them. Driver answers are their own. Media completion is a contract obligation, not a paid bonus.</footer>
  </section>;
}
