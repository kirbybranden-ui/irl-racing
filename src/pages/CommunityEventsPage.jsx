import React, { useEffect, useMemo, useState } from "react";
import { getSessionDisplayName, getSessionKey } from "../utils/communityEventAccess";

const shell = { minHeight: "100vh", background: "#f3f4f6", color: "#111827", padding: "24px" };
const wrap = { maxWidth: 1280, margin: "0 auto" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "11px 12px", fontSize: 15, background: "white", color: "#111827" };
const label = { display: "grid", gap: 6, fontWeight: 800, fontSize: 13 };
const primary = { border: 0, borderRadius: 11, padding: "11px 15px", background: "#111827", color: "white", fontWeight: 900, cursor: "pointer" };
const secondary = { ...primary, background: "white", color: "#111827", border: "1px solid #d1d5db" };

const EVENT_TYPES = [
  ["mini_tournament", "Mini Tournament"],
  ["championship", "Championship"],
  ["fun_run", "Fun Run"],
  ["knockout", "Knockout"],
  ["invitational", "Invitational"],
  ["team_event", "Team Event"],
  ["custom", "Custom"],
];

function slugify(value) {
  return String(value || "event")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 54);
}

function formatDate(value) {
  if (!value) return "Date not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date not set" : date.toLocaleString();
}

export default function CommunityEventsPage({ supabase, drivers = [], currentSession }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    event_type: "mini_tournament",
    series_type: "mixed",
    visibility: "public",
    max_drivers: 24,
    starts_at: "",
    registration_deadline: "",
    rules: "",
    stage_points_enabled: true,
    entry_fee: 0,
    prize_pool: 0,
  });

  const sessionKey = getSessionKey(currentSession);
  const displayName = getSessionDisplayName(currentSession);
  const currentDriver = drivers.find((driver) => {
    const candidates = [driver.id, driver.name, driver.username, driver.gamerTag, driver.gamertag]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());
    return candidates.includes(sessionKey);
  });

  async function loadEvents({ quiet = false } = {}) {
    if (!quiet) setLoading(true);
    setError("");
    const { data, error: loadError } = await supabase
      .from("community_events")
      .select("*")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setEvents(data || []);
    if (!quiet) setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return events;
    return events.filter((event) => [event.name, event.description, event.event_type, event.series_type]
      .some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [events, search]);

  async function createEvent() {
    setMessage("");
    setError("");
    if (!sessionKey) {
      setError("You must be signed in as a league member to create an event.");
      return;
    }
    if (!form.name.trim()) {
      setError("Enter an event name.");
      return;
    }
    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 7)}`;
    const payload = {
      ...form,
      name: form.name.trim(),
      slug,
      description: form.description.trim(),
      rules: form.rules.trim(),
      max_drivers: Number(form.max_drivers) || 24,
      entry_fee: Number(form.entry_fee) || 0,
      prize_pool: Number(form.prize_pool) || 0,
      starts_at: form.starts_at || null,
      registration_deadline: form.registration_deadline || null,
      status: "draft",
      created_by: sessionKey,
      created_by_driver_id: currentDriver?.id ? String(currentDriver.id) : null,
    };
    const { data, error: createError } = await supabase
      .from("community_events")
      .insert(payload)
      .select("*")
      .single();
    if (createError) {
      setError(createError.message);
      return;
    }
    await supabase.from("community_event_staff").insert({
      event_id: data.id,
      user_key: sessionKey,
      display_name: displayName,
      role_key: "owner",
      permissions: {},
    });
    await supabase.from("community_event_audit_log").insert({
      event_id: data.id,
      actor_key: sessionKey,
      action: "created_event",
      entity_type: "event",
      entity_id: data.id,
      details: { name: data.name },
    });
    setMessage("Event created. Opening the host dashboard…");
    window.location.pathname = `/community-events/${data.id}`;
  }

  return (
    <div style={shell}>
      <div style={wrap}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase", color: "#6b7280" }}>Budweiser Racing League</div>
            <h1 style={{ margin: "5px 0 4px", fontSize: 34 }}>Community Events</h1>
            <div style={{ color: "#6b7280" }}>Create and operate separate tournaments without changing official BRL standings.</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" style={secondary} onClick={() => (window.location.pathname = "/standings")}>Back to League</button>
            <button type="button" style={primary} onClick={() => setShowCreate((value) => !value)}>+ Create Event</button>
          </div>
        </div>

        {message && <div style={{ ...card, borderColor: "#86efac", background: "#f0fdf4", marginBottom: 14 }}>{message}</div>}
        {error && <div style={{ ...card, borderColor: "#fca5a5", background: "#fef2f2", marginBottom: 14 }}>{error}</div>}

        {showCreate && (
          <div style={{ ...card, marginBottom: 20 }}>
            <h2 style={{ marginTop: 0 }}>Create a Community Event</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              <label style={label}>Event name<input style={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Thursday Night Shootout" /></label>
              <label style={label}>Event type<select style={input} value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })}>{EVENT_TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
              <label style={label}>Series<select style={input} value={form.series_type} onChange={(e) => setForm({ ...form, series_type: e.target.value })}><option value="mixed">Mixed / Custom</option><option value="cup">Cup</option><option value="xfinity">Xfinity</option><option value="trucks">Trucks</option><option value="arca">ARCA</option></select></label>
              <label style={label}>Visibility<select style={input} value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}><option value="public">Public</option><option value="invite_only">Invite only</option><option value="unlisted">Unlisted</option></select></label>
              <label style={label}>Maximum drivers<input style={input} type="number" min="2" max="100" value={form.max_drivers} onChange={(e) => setForm({ ...form, max_drivers: e.target.value })} /></label>
              <label style={label}>First race<input style={input} type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} /></label>
              <label style={label}>Registration deadline<input style={input} type="datetime-local" value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} /></label>
              <label style={label}>Entry fee ($)<input style={input} type="number" min="0" step="0.01" value={form.entry_fee} onChange={(e) => setForm({ ...form, entry_fee: e.target.value })} /></label>
              <label style={label}>Prize pool ($)<input style={input} type="number" min="0" step="0.01" value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} /></label>
            </div>
            <label style={{ ...label, marginTop: 14 }}>Description<textarea style={{ ...input, minHeight: 90 }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <label style={{ ...label, marginTop: 14 }}>Rules<textarea style={{ ...input, minHeight: 120 }} value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} /></label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, fontWeight: 800 }}><input type="checkbox" checked={form.stage_points_enabled} onChange={(e) => setForm({ ...form, stage_points_enabled: e.target.checked })} /> Enable stage points</label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}><button type="button" style={secondary} onClick={() => setShowCreate(false)}>Cancel</button><button type="button" style={primary} onClick={createEvent}>Create & Manage</button></div>
          </div>
        )}

        <div style={{ ...card, padding: 14, marginBottom: 16 }}><input style={input} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events…" /></div>

        {loading ? <div style={card}>Loading community events…</div> : filtered.length === 0 ? <div style={card}>No events found. Create the first one.</div> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))", gap: 16 }}>
            {filtered.map((event) => (
              <button key={event.id} type="button" onClick={() => (window.location.pathname = `/community-events/${event.id}`)} style={{ ...card, textAlign: "left", cursor: "pointer", font: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><span style={{ fontSize: 12, fontWeight: 900, textTransform: "uppercase", color: "#6b7280" }}>{event.event_type.replaceAll("_", " ")}</span><span style={{ padding: "4px 8px", borderRadius: 999, background: "#f3f4f6", fontSize: 12, fontWeight: 900 }}>{event.status}</span></div>
                <h3 style={{ margin: "14px 0 8px", fontSize: 21 }}>{event.name}</h3>
                <div style={{ color: "#6b7280", minHeight: 42 }}>{event.description || "No description yet."}</div>
                <div style={{ marginTop: 16, display: "grid", gap: 5, fontSize: 13 }}><div><b>Series:</b> {event.series_type}</div><div><b>Starts:</b> {formatDate(event.starts_at)}</div><div><b>Capacity:</b> {event.max_drivers} drivers</div></div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
