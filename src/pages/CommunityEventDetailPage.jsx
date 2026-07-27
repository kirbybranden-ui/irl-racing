import React, { useEffect, useMemo, useState } from "react";
import { canManageEvent, EVENT_ROLE_TEMPLATES, getSessionDisplayName, getSessionKey } from "../utils/communityEventAccess";

const shell = { minHeight: "100vh", background: "#f3f4f6", color: "#111827", padding: "24px" };
const wrap = { maxWidth: 1320, margin: "0 auto" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "white", color: "#111827" };
const primary = { border: 0, borderRadius: 10, padding: "10px 14px", background: "#111827", color: "white", fontWeight: 900, cursor: "pointer" };
const secondary = { ...primary, background: "white", color: "#111827", border: "1px solid #d1d5db" };
const danger = { ...primary, background: "#b91c1c" };
const label = { display: "grid", gap: 6, fontWeight: 800, fontSize: 13 };
const tabs = ["Overview", "Roster", "Schedule", "Results", "Standings", "Staff", "Settings"];
const finishPoints = [40,35,34,33,32,31,30,29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1];

function stagePoints(position) { return position >= 1 && position <= 10 ? 11 - position : 0; }
function totalForResult(row) {
  if (row.dns || row.disqualified) return 0 - (Number(row.penalty_points) || 0);
  const finish = Number(row.finish_position);
  const base = finish > 0 ? (finishPoints[finish - 1] ?? 1) : 0;
  const stages = [row.stage1_position, row.stage2_position, row.stage3_position, row.stage4_position].reduce((sum, value) => sum + stagePoints(Number(value)), 0);
  const bonus = (row.fastest_lap ? 1 : 0) + (row.led_lap ? 1 : 0) + (row.most_laps_led ? 1 : 0);
  return base + stages + bonus - (Number(row.penalty_points) || 0);
}
function fmt(value) { return value ? new Date(value).toLocaleString() : "Not set"; }

export default function CommunityEventDetailPage({ supabase, eventId, drivers = [], currentSession }) {
  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [races, setRaces] = useState([]);
  const [results, setResults] = useState([]);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [external, setExternal] = useState({ display_name: "", driver_number: "", manufacturer: "", team_name: "", email: "" });
  const [raceForm, setRaceForm] = useState({ name: "", track_name: "", scheduled_at: "", stage_count: 2, laps: "" });
  const [selectedRaceId, setSelectedRaceId] = useState("");
  const [resultDrafts, setResultDrafts] = useState({});
  const [staffForm, setStaffForm] = useState({ user_key: "", display_name: "", role_key: "race_director" });

  const sessionKey = getSessionKey(currentSession);
  const displayName = getSessionDisplayName(currentSession);
  const currentDriver = drivers.find((driver) => {
    const candidates = [driver.id, driver.name, driver.username, driver.gamerTag, driver.gamertag]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());
    return candidates.includes(sessionKey);
  });

  async function loadAll() {
    setLoading(true); setError("");
    const [eventRes, memberRes, staffRes, raceRes, resultRes] = await Promise.all([
      supabase.from("community_events").select("*").eq("id", eventId).single(),
      supabase.from("community_event_members").select("*").eq("event_id", eventId).order("created_at"),
      supabase.from("community_event_staff").select("*").eq("event_id", eventId).order("created_at"),
      supabase.from("community_event_races").select("*").eq("event_id", eventId).order("race_number"),
      supabase.from("community_event_results").select("*").eq("event_id", eventId),
    ]);
    const firstError = [eventRes, memberRes, staffRes, raceRes, resultRes].find((res) => res.error)?.error;
    if (firstError) setError(firstError.message);
    setEvent(eventRes.data || null); setMembers(memberRes.data || []); setStaff(staffRes.data || []); setRaces(raceRes.data || []); setResults(resultRes.data || []);
    if (!selectedRaceId && raceRes.data?.length) setSelectedRaceId(String(raceRes.data[0].id));
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, [eventId]);

  const isOwner = event && String(event.created_by || "").toLowerCase() === sessionKey;
  const can = (permission) => event && canManageEvent(event, staff, currentSession, permission);
  const selectedRace = races.find((race) => String(race.id) === String(selectedRaceId));
  const acceptedMembers = members.filter((member) => member.is_active && member.invite_status !== "removed" && member.invite_status !== "declined");
  const selfMember = currentDriver
    ? members.find((member) => String(member.driver_id || "") === String(currentDriver.id))
    : null;
  const isSignedUp = Boolean(selfMember?.is_active && selfMember?.invite_status === "accepted");
  const registrationDeadlinePassed = Boolean(
    event?.registration_deadline && new Date(event.registration_deadline).getTime() < Date.now()
  );
  const rosterIsFull = acceptedMembers.length >= Number(event?.max_drivers || 0);
  const registrationIsOpen = Boolean(
    event?.status === "registration" &&
    event?.visibility !== "invite_only" &&
    !registrationDeadlinePassed &&
    (!rosterIsFull || isSignedUp)
  );
  const standings = useMemo(() => {
    const map = new Map(acceptedMembers.map((member) => [member.id, { member, points: 0, wins: 0, starts: 0, top5: 0 }]));
    results.forEach((row) => {
      const item = map.get(row.member_id); if (!item) return;
      item.points += Number(row.total_points) || 0; item.starts += row.dns ? 0 : 1;
      if (Number(row.finish_position) === 1) item.wins += 1;
      if (Number(row.finish_position) > 0 && Number(row.finish_position) <= 5) item.top5 += 1;
    });
    return [...map.values()].sort((a,b) => b.points - a.points || b.wins - a.wins);
  }, [acceptedMembers, results]);

  async function audit(action, entityType, entityId, details = {}) {
    await supabase.from("community_event_audit_log").insert({ event_id: eventId, actor_key: sessionKey || displayName, action, entity_type: entityType, entity_id: entityId ? String(entityId) : null, details });
  }
  function notify(text) { setMessage(text); setTimeout(() => setMessage(""), 3500); }

  async function signUpForEvent() {
    setError("");
    if (!sessionKey) return setError("Sign in as a driver before registering.");
    if (!currentDriver) return setError("Your login is not connected to a driver profile.");
    if (event.visibility === "invite_only") return setError("This event is invite only.");
    if (event.status !== "registration") return setError("Registration is not currently open.");
    if (registrationDeadlinePassed) return setError("The registration deadline has passed.");
    if (rosterIsFull && !isSignedUp) return setError("This event roster is full.");

    const payload = {
      event_id: eventId,
      driver_id: String(currentDriver.id),
      display_name: currentDriver.name || currentDriver.username || displayName,
      driver_number: String(currentDriver.number || ""),
      manufacturer: currentDriver.manufacturer || "",
      team_name: currentDriver.team || "",
      member_type: "existing",
      invite_status: "accepted",
      is_active: true,
      joined_at: new Date().toISOString(),
    };

    const request = selfMember
      ? supabase.from("community_event_members").update(payload).eq("id", selfMember.id)
      : supabase.from("community_event_members").insert(payload);
    const { error: signupError } = await request;
    if (signupError) return setError(signupError.message);

    await audit("driver_registered", "member", currentDriver.id, { display_name: payload.display_name });
    await loadAll();
    notify("You are registered to run this event.");
  }

  async function withdrawFromEvent() {
    setError("");
    if (!selfMember || !isSignedUp) return;
    if (["active", "completed"].includes(event.status)) {
      return setError("You cannot withdraw after the event has started. Contact the event host.");
    }
    const { error: withdrawError } = await supabase
      .from("community_event_members")
      .update({ invite_status: "removed", is_active: false })
      .eq("id", selfMember.id);
    if (withdrawError) return setError(withdrawError.message);
    await audit("driver_withdrew", "member", selfMember.id, { display_name: selfMember.display_name });
    await loadAll();
    notify("You have withdrawn from this event.");
  }

  async function addExistingDriver() {
    if (!can("event.roster")) return setError("You do not have roster permission.");
    const driver = drivers.find((item) => String(item.id) === String(selectedDriverId)); if (!driver) return;
    const { error: addError } = await supabase.from("community_event_members").insert({ event_id: eventId, driver_id: String(driver.id), display_name: driver.name || driver.username || `Driver #${driver.number}`, driver_number: String(driver.number || ""), manufacturer: driver.manufacturer || "", team_name: driver.team || "", member_type: "existing", invite_status: "accepted", joined_at: new Date().toISOString() });
    if (addError) return setError(addError.message);
    await audit("added_member", "member", driver.id, { display_name: driver.name }); setSelectedDriverId(""); await loadAll(); notify("Driver added.");
  }
  async function addExternalDriver() {
    if (!external.display_name.trim()) return setError("Enter the new driver's name.");
    const { data, error: addError } = await supabase.from("community_event_members").insert({ event_id: eventId, ...external, display_name: external.display_name.trim(), member_type: "external", invite_status: "accepted", joined_at: new Date().toISOString() }).select("*").single();
    if (addError) return setError(addError.message);
    await audit("added_external_member", "member", data.id, { display_name: data.display_name }); setExternal({ display_name: "", driver_number: "", manufacturer: "", team_name: "", email: "" }); await loadAll(); notify("New driver added.");
  }
  async function removeMember(id) { if (!can("event.roster")) return; await supabase.from("community_event_members").update({ invite_status: "removed", is_active: false }).eq("id", id); await audit("removed_member", "member", id); await loadAll(); }

  async function addRace() {
    if (!raceForm.name.trim() || !raceForm.track_name.trim()) return setError("Enter the race and track names.");
    const { data, error: raceError } = await supabase.from("community_event_races").insert({ event_id: eventId, race_number: races.length + 1, name: raceForm.name.trim(), track_name: raceForm.track_name.trim(), scheduled_at: raceForm.scheduled_at || null, stage_count: Number(raceForm.stage_count) || 0, laps: raceForm.laps ? Number(raceForm.laps) : null }).select("*").single();
    if (raceError) return setError(raceError.message);
    await audit("added_race", "race", data.id, { name: data.name }); setRaceForm({ name: "", track_name: "", scheduled_at: "", stage_count: 2, laps: "" }); await loadAll(); setSelectedRaceId(data.id); notify("Race added.");
  }
  async function deleteRace(id) { if (!can("event.schedule")) return; await supabase.from("community_event_races").delete().eq("id", id); await audit("deleted_race", "race", id); await loadAll(); }

  function draftFor(memberId) {
    const existing = results.find((row) => row.race_id === selectedRaceId && row.member_id === memberId) || {};
    return resultDrafts[memberId] || { finish_position: existing.finish_position || "", stage1_position: existing.stage1_position || "", stage2_position: existing.stage2_position || "", stage3_position: existing.stage3_position || "", stage4_position: existing.stage4_position || "", penalty_points: existing.penalty_points || 0, fastest_lap: !!existing.fastest_lap, led_lap: !!existing.led_lap, most_laps_led: !!existing.most_laps_led, dnf: !!existing.dnf, dns: !!existing.dns, disqualified: !!existing.disqualified };
  }
  function updateDraft(memberId, patch) { setResultDrafts((prev) => ({ ...prev, [memberId]: { ...draftFor(memberId), ...patch } })); }
  async function saveResults() {
    if (!selectedRace) return setError("Select a race.");
    const rows = acceptedMembers.map((member) => { const draft = draftFor(member.id); const total = totalForResult(draft); return { event_id: eventId, race_id: selectedRace.id, member_id: member.id, ...draft, finish_position: draft.finish_position ? Number(draft.finish_position) : null, stage1_position: draft.stage1_position ? Number(draft.stage1_position) : null, stage2_position: draft.stage2_position ? Number(draft.stage2_position) : null, stage3_position: draft.stage3_position ? Number(draft.stage3_position) : null, stage4_position: draft.stage4_position ? Number(draft.stage4_position) : null, penalty_points: Number(draft.penalty_points) || 0, base_points: 0, stage_points: 0, bonus_points: 0, total_points: total } });
    const { error: saveError } = await supabase.from("community_event_results").upsert(rows, { onConflict: "race_id,member_id" }); if (saveError) return setError(saveError.message);
    await supabase.from("community_event_races").update({ status: "completed" }).eq("id", selectedRace.id); await audit("saved_results", "race", selectedRace.id, { entries: rows.length }); setResultDrafts({}); await loadAll(); notify("Results and standings updated.");
  }

  async function addStaff() {
    if (!staffForm.user_key.trim()) return setError("Enter the staff member's username or login key.");
    const payload = { event_id: eventId, user_key: staffForm.user_key.trim().toLowerCase(), display_name: staffForm.display_name.trim() || staffForm.user_key.trim(), role_key: staffForm.role_key, permissions: EVENT_ROLE_TEMPLATES[staffForm.role_key] || {} };
    const { error: staffError } = await supabase.from("community_event_staff").upsert(payload, { onConflict: "event_id,user_key,role_key" }); if (staffError) return setError(staffError.message);
    await audit("added_staff", "staff", payload.user_key, { role: payload.role_key }); setStaffForm({ user_key: "", display_name: "", role_key: "race_director" }); await loadAll(); notify("Staff access updated.");
  }
  async function removeStaff(id) { if (!can("event.staff")) return; await supabase.from("community_event_staff").delete().eq("id", id); await loadAll(); }

  async function saveSettings() { const { error: saveError } = await supabase.from("community_events").update(event).eq("id", eventId); if (saveError) return setError(saveError.message); await audit("updated_settings", "event", eventId); await loadAll(); notify("Event settings saved."); }
  async function deleteEvent() { if (!isOwner || !window.confirm("Delete this event and all of its results?")) return; await supabase.from("community_events").delete().eq("id", eventId); window.location.pathname = "/community-events"; }

  if (loading) return <div style={shell}><div style={wrap}><div style={card}>Loading event…</div></div></div>;
  if (!event) return <div style={shell}><div style={wrap}><div style={card}>Event not found.</div></div></div>;

  const renderTab = () => {
    if (tab === "Overview") return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
      {[['Status',event.status],['Series',event.series_type],['Starts',fmt(event.starts_at)],['Roster',`${acceptedMembers.length} / ${event.max_drivers}`],['Races',races.length],['Prize pool',`$${Number(event.prize_pool || 0).toLocaleString()}`]].map(([a,b]) => <div key={a} style={card}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{a}</div><div style={{ fontSize: 23, fontWeight: 900, marginTop: 8 }}>{b}</div></div>)}
      <div style={{ ...card, gridColumn: "1 / -1" }}><h3 style={{ marginTop: 0 }}>Description</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.description || "No description yet."}</div><h3>Rules</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.rules || "No rules posted yet."}</div></div>
    </div>;
    if (tab === "Roster") return <div style={{ display: "grid", gap: 16 }}>
      {can("event.roster") && <div style={card}><h3 style={{ marginTop: 0 }}>Add Existing BRL Driver</h3><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><select style={{ ...input, flex: 1, minWidth: 240 }} value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}><option value="">Select driver…</option>{drivers.filter((d) => !members.some((m) => String(m.driver_id) === String(d.id))).map((d) => <option key={d.id} value={d.id}>#{d.number} {d.name || d.username}</option>)}</select><button style={primary} onClick={addExistingDriver}>Add Driver</button></div><h3>Add New / External Driver</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>{Object.keys(external).map((key) => <input key={key} style={input} placeholder={key.replaceAll('_',' ')} value={external[key]} onChange={(e) => setExternal({ ...external, [key]: e.target.value })} />)}</div><button style={{ ...primary, marginTop: 10 }} onClick={addExternalDriver}>Add New Driver</button></div>}
      <div style={card}><h3 style={{ marginTop: 0 }}>Event Roster</h3>{acceptedMembers.map((m) => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #eee" }}><div><b>#{m.driver_number || '—'} {m.display_name}</b><div style={{ color: "#6b7280", fontSize: 13 }}>{m.member_type} · {m.manufacturer || 'No manufacturer'} · {m.team_name || 'Independent'}</div></div>{can("event.roster") && <button style={danger} onClick={() => removeMember(m.id)}>Remove</button>}</div>)}</div>
    </div>;
    if (tab === "Schedule") return <div style={{ display: "grid", gap: 16 }}>{can("event.schedule") && <div style={card}><h3 style={{ marginTop: 0 }}>Add Race</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}><input style={input} placeholder="Race name" value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}/><input style={input} placeholder="Track" value={raceForm.track_name} onChange={(e) => setRaceForm({ ...raceForm, track_name: e.target.value })}/><input style={input} type="datetime-local" value={raceForm.scheduled_at} onChange={(e) => setRaceForm({ ...raceForm, scheduled_at: e.target.value })}/><input style={input} type="number" min="0" max="4" placeholder="Stages" value={raceForm.stage_count} onChange={(e) => setRaceForm({ ...raceForm, stage_count: e.target.value })}/><input style={input} type="number" placeholder="Laps" value={raceForm.laps} onChange={(e) => setRaceForm({ ...raceForm, laps: e.target.value })}/></div><button style={{ ...primary, marginTop: 10 }} onClick={addRace}>Add Race</button></div>}<div style={card}>{races.map((r) => <div key={r.id} style={{ display:"flex",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid #eee" }}><div><b>Race {r.race_number}: {r.name}</b><div style={{ color:"#6b7280" }}>{r.track_name} · {fmt(r.scheduled_at)} · {r.stage_count} stages · {r.status}</div></div>{can("event.schedule") && <button style={danger} onClick={() => deleteRace(r.id)}>Delete</button>}</div>)}</div></div>;
    if (tab === "Results") return <div style={card}><div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"end",flexWrap:"wrap" }}><label style={{ ...label, minWidth:260 }}>Race<select style={input} value={selectedRaceId} onChange={(e) => { setSelectedRaceId(e.target.value); setResultDrafts({}); }}>{races.map((r) => <option key={r.id} value={r.id}>Race {r.race_number}: {r.name}</option>)}</select></label>{can("event.results") && <button style={primary} onClick={saveResults}>Save Results</button>}</div>{!selectedRace ? <p>Add a race first.</p> : <div style={{ overflowX:"auto",marginTop:16 }}><table style={{ width:"100%",borderCollapse:"collapse",minWidth:980 }}><thead><tr>{['Driver','Finish','S1','S2','S3','S4','Penalty','Fast Lap','Led Lap','Most Led','DNF','DNS','DQ','Points'].map(h => <th key={h} style={{ textAlign:"left",padding:8,borderBottom:"2px solid #ddd" }}>{h}</th>)}</tr></thead><tbody>{acceptedMembers.map((m) => { const d=draftFor(m.id); return <tr key={m.id}><td style={{ padding:8,borderBottom:"1px solid #eee",fontWeight:800 }}>#{m.driver_number} {m.display_name}</td>{['finish_position','stage1_position','stage2_position','stage3_position','stage4_position','penalty_points'].map(k => <td key={k} style={{ padding:5 }}><input disabled={!can("event.results")} style={{ ...input,width:68,padding:7 }} type="number" value={d[k]} onChange={(e)=>updateDraft(m.id,{[k]:e.target.value})}/></td>)}{['fastest_lap','led_lap','most_laps_led','dnf','dns','disqualified'].map(k => <td key={k} style={{ padding:8,textAlign:"center" }}><input disabled={!can("event.results")} type="checkbox" checked={d[k]} onChange={(e)=>updateDraft(m.id,{[k]:e.target.checked})}/></td>)}<td style={{ padding:8,fontWeight:900 }}>{totalForResult(d)}</td></tr>})}</tbody></table></div>}</div>;
    if (tab === "Standings") return <div style={card}><h3 style={{ marginTop:0 }}>Tournament Standings</h3>{standings.map((s,i) => <div key={s.member.id} style={{ display:"grid",gridTemplateColumns:"45px 1fr repeat(4,80px)",gap:10,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center" }}><b>{i+1}</b><b>#{s.member.driver_number} {s.member.display_name}</b><span>{s.points} pts</span><span>{s.wins} wins</span><span>{s.top5} top 5</span><span>{s.starts} starts</span></div>)}</div>;
    if (tab === "Staff") return <div style={{ display:"grid",gap:16 }}>{can("event.staff") && <div style={card}><h3 style={{ marginTop:0 }}>Assign Event Staff</h3><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10 }}><input style={input} placeholder="Login username / key" value={staffForm.user_key} onChange={(e)=>setStaffForm({...staffForm,user_key:e.target.value})}/><input style={input} placeholder="Display name" value={staffForm.display_name} onChange={(e)=>setStaffForm({...staffForm,display_name:e.target.value})}/><select style={input} value={staffForm.role_key} onChange={(e)=>setStaffForm({...staffForm,role_key:e.target.value})}>{Object.keys(EVENT_ROLE_TEMPLATES).map(k=><option key={k} value={k}>{k.replaceAll('_',' ')}</option>)}</select></div><button style={{ ...primary,marginTop:10 }} onClick={addStaff}>Assign Role</button></div>}<div style={card}>{staff.map((s)=><div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid #eee" }}><div><b>{s.display_name}</b><div style={{ color:"#6b7280" }}>{s.role_key.replaceAll('_',' ')} · {s.user_key}</div></div>{can("event.staff") && s.role_key!=="owner" && <button style={danger} onClick={()=>removeStaff(s.id)}>Remove</button>}</div>)}</div></div>;
    if (tab === "Settings") return <div style={card}><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12 }}><label style={label}>Name<input style={input} disabled={!can("event.settings")} value={event.name} onChange={(e)=>setEvent({...event,name:e.target.value})}/></label><label style={label}>Status<select style={input} disabled={!can("event.settings")} value={event.status} onChange={(e)=>setEvent({...event,status:e.target.value})}>{['draft','registration','active','completed','cancelled'].map(v=><option key={v}>{v}</option>)}</select></label><label style={label}>Visibility<select style={input} disabled={!can("event.settings")} value={event.visibility} onChange={(e)=>setEvent({...event,visibility:e.target.value})}>{['public','invite_only','unlisted'].map(v=><option key={v}>{v}</option>)}</select></label><label style={label}>Max drivers<input style={input} type="number" disabled={!can("event.settings")} value={event.max_drivers} onChange={(e)=>setEvent({...event,max_drivers:Number(e.target.value)})}/></label><label style={label}>Prize pool ($)<input style={input} type="number" disabled={!can("event.settings")} value={event.prize_pool} onChange={(e)=>setEvent({...event,prize_pool:Number(e.target.value)})}/></label><label style={label}>Discord URL<input style={input} disabled={!can("event.settings")} value={event.discord_url||''} onChange={(e)=>setEvent({...event,discord_url:e.target.value})}/></label></div><label style={{ ...label,marginTop:12 }}>Description<textarea style={{ ...input,minHeight:90 }} disabled={!can("event.settings")} value={event.description||''} onChange={(e)=>setEvent({...event,description:e.target.value})}/></label><label style={{ ...label,marginTop:12 }}>Rules<textarea style={{ ...input,minHeight:130 }} disabled={!can("event.settings")} value={event.rules||''} onChange={(e)=>setEvent({...event,rules:e.target.value})}/></label>{can("event.settings") && <button style={{ ...primary,marginTop:14 }} onClick={saveSettings}>Save Settings</button>}{isOwner && <button style={{ ...danger,marginTop:14,marginLeft:10 }} onClick={deleteEvent}>Delete Event</button>}</div>;
    return null;
  };

  return <div style={shell}><div style={wrap}><div style={{ display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap",marginBottom:16 }}><div><button style={{ ...secondary,padding:"7px 10px",marginBottom:10 }} onClick={()=>window.location.pathname="/community-events"}>← Community Events</button><h1 style={{ margin:0 }}>{event.name}</h1><div style={{ color:"#6b7280",marginTop:6 }}>{event.event_type.replaceAll('_',' ')} · hosted by {event.created_by}</div></div><span style={{ padding:"7px 11px",borderRadius:999,background:"white",border:"1px solid #ddd",fontWeight:900 }}>{event.status}</span></div>{message && <div style={{ ...card,background:"#f0fdf4",borderColor:"#86efac",marginBottom:12 }}>{message}</div>}{error && <div style={{ ...card,background:"#fef2f2",borderColor:"#fca5a5",marginBottom:12 }}>{error}</div>}
      {!isOwner && (
        <div style={{ ...card, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{isSignedUp ? "You are registered" : "Want to run this event?"}</div>
            <div style={{ color: "#6b7280", marginTop: 4 }}>
              {isSignedUp
                ? `You are on the roster as #${selfMember?.driver_number || currentDriver?.number || "—"} ${selfMember?.display_name || displayName}.`
                : event.visibility === "invite_only"
                  ? "This event is invite only."
                  : event.status !== "registration"
                    ? "Registration is not currently open."
                    : registrationDeadlinePassed
                      ? "The registration deadline has passed."
                      : rosterIsFull
                        ? "The event roster is full."
                        : currentDriver
                          ? `${acceptedMembers.length} of ${event.max_drivers} spots are filled.`
                          : "Sign in with a linked driver profile to register."}
            </div>
          </div>
          {isSignedUp ? (
            <button type="button" style={secondary} onClick={withdrawFromEvent}>Withdraw</button>
          ) : (
            <button type="button" style={{ ...primary, opacity: registrationIsOpen && currentDriver ? 1 : 0.55 }} disabled={!registrationIsOpen || !currentDriver} onClick={signUpForEvent}>Sign Up to Race</button>
          )}
        </div>
      )}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16 }}>{tabs.map((name)=><button key={name} style={tab===name?primary:secondary} onClick={()=>setTab(name)}>{name}</button>)}</div>{renderTab()}</div></div>;
}
