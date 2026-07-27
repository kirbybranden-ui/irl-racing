import React, { useEffect, useMemo, useState } from "react";
import { canManageEvent, EVENT_ROLE_TEMPLATES, getSessionDisplayName, getSessionKey } from "../utils/communityEventAccess";

const shell = { minHeight: "100vh", background: "#f3f4f6", color: "#111827", padding: "24px" };
const wrap = { maxWidth: 1320, margin: "0 auto" };
const card = { background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 20 };
const input = { width: "100%", boxSizing: "border-box", border: "1px solid #d1d5db", borderRadius: 10, padding: "10px 12px", fontSize: 14, background: "white", color: "#111827" };
const primary = { border: 0, borderRadius: 10, padding: "10px 14px", background: "#111827", color: "white", fontWeight: 900, cursor: "pointer" };
const secondary = { ...primary, background: "white", color: "#111827", border: "1px solid #d1d5db" };
const danger = { ...primary, background: "#b91c1c" };
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(17,24,39,.68)", zIndex: 9999, display: "grid", placeItems: "center", padding: 18 };
const modalCard = { ...card, width: "min(760px, 96vw)", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,.3)" };
const DRIVER_AGREEMENT_VERSION = "driver-v1.1";
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
  const [showDriverTerms, setShowDriverTerms] = useState(false);
  const [driverChecks, setDriverChecks] = useState(Array(11).fill(false));
  const [driverFinal, setDriverFinal] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showGuestTerms, setShowGuestTerms] = useState(false);
  const [guestChecks, setGuestChecks] = useState(Array(11).fill(false));
  const [guestFinal, setGuestFinal] = useState(false);
  const [guestForm, setGuestForm] = useState({ display_name: "", gamertag: "", platform: "PlayStation", email: "", discord: "", driver_number: "" });

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
  const acceptedMembers = members.filter((member) => member.is_active && member.invite_status === "accepted");
  const pendingGuestMembers = members.filter((member) => member.is_active && member.member_type === "external" && member.invite_status === "pending");
  const acceptedGuestCount = acceptedMembers.filter((member) => member.member_type === "external").length;
  const guestCapacityReached = acceptedGuestCount >= Number(event?.max_guest_drivers || 0);
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

  function requestSignUp() {
    setError("");
    if (!sessionKey) return setError("Sign in as a driver before registering.");
    if (!currentDriver) return setError("Your login is not connected to a driver profile.");
    if (event.visibility === "invite_only") return setError("This event is invite only.");
    if (event.status !== "registration") return setError("Registration is not currently open.");
    if (registrationDeadlinePassed) return setError("The registration deadline has passed.");
    if (rosterIsFull && !isSignedUp) return setError("This event roster is full.");
    const termsCount = Number(event.entry_fee || 0) > 0 ? 11 : 6;
    setDriverChecks(Array(termsCount).fill(false));
    setDriverFinal(false);
    setShowDriverTerms(true);
  }

  async function signUpForEvent(termsAccepted = false) {
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

    if (!termsAccepted) return setError("You must accept the event participation terms before registering.");

    if (termsAccepted) {
      const { error: agreementError } = await supabase.from("community_event_agreements").insert({
        event_id: eventId,
        user_key: sessionKey,
        driver_id: String(currentDriver.id),
        display_name: payload.display_name,
        user_role: "driver",
        agreement_version: DRIVER_AGREEMENT_VERSION,
        agreement_type: Number(event.entry_fee || 0) > 0 ? "driver_paid_event" : "driver_event",
        accepted_at: new Date().toISOString(),
        registration_status: "accepted",
        payment_status: "pending",
        metadata: { entry_fee: Number(event.entry_fee) || 0, refund_policy: event.refund_policy || "" }
      });
      if (agreementError) return setError(`Registration was not completed because your agreement could not be recorded: ${agreementError.message}`);
    }

    const request = selfMember
      ? supabase.from("community_event_members").update(payload).eq("id", selfMember.id)
      : supabase.from("community_event_members").insert(payload);
    const { error: signupError } = await request;
    if (signupError) return setError(signupError.message);

    await audit("driver_registered", "member", currentDriver.id, { display_name: payload.display_name });
    setShowDriverTerms(false);
    await loadAll();
    notify("You are registered to run this event.");
  }


  function requestGuestRegistration() {
    setError("");
    if (!event.allow_guest_drivers) return setError("This event is not accepting non-league guest drivers.");
    if (event.visibility === "invite_only") return setError("This event is invite only.");
    if (event.status !== "registration") return setError("Registration is not currently open.");
    if (registrationDeadlinePassed) return setError("The registration deadline has passed.");
    if (rosterIsFull) return setError("This event roster is full.");
    if (guestCapacityReached) return setError("All guest driver spots are filled.");
    if (!guestForm.display_name.trim()) return setError("Enter your name.");
    if (!guestForm.gamertag.trim()) return setError("Enter your racing gamertag.");
    if (!guestForm.email.trim() || !guestForm.email.includes("@")) return setError("Enter a valid email address.");
    const termsCount = Number(event.entry_fee || 0) > 0 ? 11 : 6;
    setGuestChecks(Array(termsCount).fill(false));
    setGuestFinal(false);
    setShowGuestTerms(true);
  }

  async function submitGuestRegistration(termsAccepted = false) {
    setError("");
    if (!termsAccepted) return setError("You must accept the event participation terms before registering.");
    if (!event.allow_guest_drivers) return setError("This event is not accepting non-league guest drivers.");
    if (event.status !== "registration" || registrationDeadlinePassed) return setError("Registration is not currently open.");
    if (rosterIsFull || guestCapacityReached) return setError("No guest driver spots remain.");

    const cleanEmail = guestForm.email.trim().toLowerCase();
    const duplicate = members.find((member) =>
      member.member_type === "external" &&
      member.is_active &&
      (String(member.email || "").toLowerCase() === cleanEmail ||
       String(member.gamertag || "").toLowerCase() === guestForm.gamertag.trim().toLowerCase())
    );
    if (duplicate) return setError("A guest registration using that email or gamertag already exists for this event.");

    const inviteStatus = event.guest_approval_required ? "pending" : "accepted";
    const userKey = `guest:${cleanEmail}:${eventId}`;
    const payload = {
      event_id: eventId,
      driver_id: null,
      display_name: guestForm.display_name.trim(),
      gamertag: guestForm.gamertag.trim(),
      platform: guestForm.platform,
      email: cleanEmail,
      discord: guestForm.discord.trim(),
      driver_number: guestForm.driver_number.trim(),
      manufacturer: "",
      team_name: "Guest Driver",
      member_type: "external",
      invite_status: inviteStatus,
      is_active: true,
      joined_at: inviteStatus === "accepted" ? new Date().toISOString() : null,
    };

    const { data: memberData, error: memberError } = await supabase
      .from("community_event_members")
      .insert(payload)
      .select("*")
      .single();
    if (memberError) return setError(memberError.message);

    const { error: agreementError } = await supabase.from("community_event_agreements").insert({
      event_id: eventId,
      user_key: userKey,
      display_name: payload.display_name,
      user_role: "driver",
      agreement_version: DRIVER_AGREEMENT_VERSION,
      agreement_type: Number(event.entry_fee || 0) > 0 ? "guest_paid_event" : "guest_event",
      accepted_at: new Date().toISOString(),
      registration_status: inviteStatus,
      payment_status: "pending",
      metadata: {
        entry_fee: Number(event.entry_fee) || 0,
        refund_policy: event.refund_policy || "",
        member_id: memberData.id,
        gamertag: payload.gamertag,
        platform: payload.platform,
      }
    });
    if (agreementError) {
      await supabase.from("community_event_members").delete().eq("id", memberData.id);
      return setError(`Registration was not completed because your agreement could not be recorded: ${agreementError.message}`);
    }

    await audit("guest_registration_submitted", "member", memberData.id, { display_name: payload.display_name, gamertag: payload.gamertag, status: inviteStatus });
    setShowGuestTerms(false);
    setShowGuestForm(false);
    setGuestForm({ display_name: "", gamertag: "", platform: "PlayStation", email: "", discord: "", driver_number: "" });
    await loadAll();
    notify(inviteStatus === "accepted" ? "Guest registration accepted. You are on the roster." : "Guest registration submitted for host approval.");
  }

  async function updateGuestRequest(member, inviteStatus) {
    if (!can("event.roster")) return setError("You do not have roster permission.");
    const patch = {
      invite_status: inviteStatus,
      is_active: inviteStatus !== "declined",
      joined_at: inviteStatus === "accepted" ? new Date().toISOString() : member.joined_at,
    };
    const { error: updateError } = await supabase.from("community_event_members").update(patch).eq("id", member.id);
    if (updateError) return setError(updateError.message);
    await supabase.from("community_event_agreements")
      .update({ registration_status: inviteStatus })
      .eq("event_id", eventId)
      .eq("user_key", `guest:${String(member.email || "").toLowerCase()}:${eventId}`);
    await audit(`guest_${inviteStatus}`, "member", member.id, { display_name: member.display_name, gamertag: member.gamertag });
    await loadAll();
    notify(inviteStatus === "accepted" ? "Guest driver approved." : "Guest registration declined.");
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
      {[['Status',event.status],['Series',event.series_type],['Starts',fmt(event.starts_at)],['Roster',`${acceptedMembers.length} / ${event.max_drivers}`],['Entry fee',`$${Number(event.entry_fee || 0).toLocaleString()}`],['Prize pool',`$${Number(event.prize_pool || 0).toLocaleString()}`]].map(([a,b]) => <div key={a} style={card}><div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900, textTransform: "uppercase" }}>{a}</div><div style={{ fontSize: 23, fontWeight: 900, marginTop: 8 }}>{b}</div></div>)}
      <div style={{ ...card, gridColumn: "1 / -1" }}><h3 style={{ marginTop: 0 }}>Description</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.description || "No description yet."}</div>{Number(event.entry_fee || 0) > 0 && <><h3>Payment Method</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.payment_method || "Contact the host."}</div><h3>Prize Distribution</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.prize_distribution || "Not posted."}</div><h3>Refund Policy</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.refund_policy || "No refund policy posted."}</div></>}<h3>Rules</h3><div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{event.rules || "No rules posted yet."}</div></div>
    </div>;
    if (tab === "Roster") return <div style={{ display: "grid", gap: 16 }}>
      {can("event.roster") && <div style={card}>
        <h3 style={{ marginTop: 0 }}>Add Existing BRL Driver</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <select style={{ ...input, flex: 1, minWidth: 240 }} value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)}><option value="">Select driver…</option>{drivers.filter((d) => !members.some((m) => String(m.driver_id) === String(d.id))).map((d) => <option key={d.id} value={d.id}>#{d.number} {d.name || d.username}</option>)}</select>
          <button style={primary} onClick={addExistingDriver}>Add Driver</button>
        </div>
        <h3>Add Guest Manually</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10 }}>{Object.keys(external).map((key) => <input key={key} style={input} placeholder={key.replaceAll('_',' ')} value={external[key]} onChange={(e) => setExternal({ ...external, [key]: e.target.value })} />)}</div>
        <button style={{ ...primary, marginTop: 10 }} onClick={addExternalDriver}>Add Guest</button>
      </div>}
      {can("event.roster") && pendingGuestMembers.length > 0 && <div style={{ ...card, borderColor: "#f59e0b" }}>
        <h3 style={{ marginTop: 0 }}>Pending Guest Registrations ({pendingGuestMembers.length})</h3>
        {pendingGuestMembers.map((m) => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #eee", flexWrap: "wrap" }}>
          <div><b>{m.display_name} · {m.gamertag || "No gamertag"}</b><div style={{ color: "#6b7280", fontSize: 13 }}>{m.platform || "Platform not listed"} · {m.email}</div></div>
          <div style={{ display: "flex", gap: 8 }}><button style={primary} onClick={() => updateGuestRequest(m, "accepted")}>Approve</button><button style={danger} onClick={() => updateGuestRequest(m, "declined")}>Decline</button></div>
        </div>)}
      </div>}
      <div style={card}><h3 style={{ marginTop: 0 }}>Event Roster</h3>{acceptedMembers.map((m) => <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #eee" }}><div><b>#{m.driver_number || '—'} {m.display_name}</b>{m.member_type === "external" && <span style={{ marginLeft: 8, padding: "3px 7px", borderRadius: 999, background: "#eef2ff", fontSize: 11, fontWeight: 900 }}>GUEST</span>}<div style={{ color: "#6b7280", fontSize: 13 }}>{m.member_type === "external" ? `${m.gamertag || "Guest"} · ${m.platform || "Platform not listed"}` : `${m.manufacturer || 'No manufacturer'} · ${m.team_name || 'Independent'}`}</div></div>{can("event.roster") && <button style={danger} onClick={() => removeMember(m.id)}>Remove</button>}</div>)}</div>
    </div>;
    if (tab === "Schedule") return <div style={{ display: "grid", gap: 16 }}>{can("event.schedule") && <div style={card}><h3 style={{ marginTop: 0 }}>Add Race</h3><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10 }}><input style={input} placeholder="Race name" value={raceForm.name} onChange={(e) => setRaceForm({ ...raceForm, name: e.target.value })}/><input style={input} placeholder="Track" value={raceForm.track_name} onChange={(e) => setRaceForm({ ...raceForm, track_name: e.target.value })}/><input style={input} type="datetime-local" value={raceForm.scheduled_at} onChange={(e) => setRaceForm({ ...raceForm, scheduled_at: e.target.value })}/><input style={input} type="number" min="0" max="4" placeholder="Stages" value={raceForm.stage_count} onChange={(e) => setRaceForm({ ...raceForm, stage_count: e.target.value })}/><input style={input} type="number" placeholder="Laps" value={raceForm.laps} onChange={(e) => setRaceForm({ ...raceForm, laps: e.target.value })}/></div><button style={{ ...primary, marginTop: 10 }} onClick={addRace}>Add Race</button></div>}<div style={card}>{races.map((r) => <div key={r.id} style={{ display:"flex",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid #eee" }}><div><b>Race {r.race_number}: {r.name}</b><div style={{ color:"#6b7280" }}>{r.track_name} · {fmt(r.scheduled_at)} · {r.stage_count} stages · {r.status}</div></div>{can("event.schedule") && <button style={danger} onClick={() => deleteRace(r.id)}>Delete</button>}</div>)}</div></div>;
    if (tab === "Results") return <div style={card}><div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"end",flexWrap:"wrap" }}><label style={{ ...label, minWidth:260 }}>Race<select style={input} value={selectedRaceId} onChange={(e) => { setSelectedRaceId(e.target.value); setResultDrafts({}); }}>{races.map((r) => <option key={r.id} value={r.id}>Race {r.race_number}: {r.name}</option>)}</select></label>{can("event.results") && <button style={primary} onClick={saveResults}>Save Results</button>}</div>{!selectedRace ? <p>Add a race first.</p> : <div style={{ overflowX:"auto",marginTop:16 }}><table style={{ width:"100%",borderCollapse:"collapse",minWidth:980 }}><thead><tr>{['Driver','Finish','S1','S2','S3','S4','Penalty','Fast Lap','Led Lap','Most Led','DNF','DNS','DQ','Points'].map(h => <th key={h} style={{ textAlign:"left",padding:8,borderBottom:"2px solid #ddd" }}>{h}</th>)}</tr></thead><tbody>{acceptedMembers.map((m) => { const d=draftFor(m.id); return <tr key={m.id}><td style={{ padding:8,borderBottom:"1px solid #eee",fontWeight:800 }}>#{m.driver_number} {m.display_name}</td>{['finish_position','stage1_position','stage2_position','stage3_position','stage4_position','penalty_points'].map(k => <td key={k} style={{ padding:5 }}><input disabled={!can("event.results")} style={{ ...input,width:68,padding:7 }} type="number" value={d[k]} onChange={(e)=>updateDraft(m.id,{[k]:e.target.value})}/></td>)}{['fastest_lap','led_lap','most_laps_led','dnf','dns','disqualified'].map(k => <td key={k} style={{ padding:8,textAlign:"center" }}><input disabled={!can("event.results")} type="checkbox" checked={d[k]} onChange={(e)=>updateDraft(m.id,{[k]:e.target.checked})}/></td>)}<td style={{ padding:8,fontWeight:900 }}>{totalForResult(d)}</td></tr>})}</tbody></table></div>}</div>;
    if (tab === "Standings") return <div style={card}><h3 style={{ marginTop:0 }}>Tournament Standings</h3>{standings.map((s,i) => <div key={s.member.id} style={{ display:"grid",gridTemplateColumns:"45px 1fr repeat(4,80px)",gap:10,padding:"12px 0",borderBottom:"1px solid #eee",alignItems:"center" }}><b>{i+1}</b><b>#{s.member.driver_number} {s.member.display_name}</b><span>{s.points} pts</span><span>{s.wins} wins</span><span>{s.top5} top 5</span><span>{s.starts} starts</span></div>)}</div>;
    if (tab === "Staff") return <div style={{ display:"grid",gap:16 }}>{can("event.staff") && <div style={card}><h3 style={{ marginTop:0 }}>Assign Event Staff</h3><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10 }}><input style={input} placeholder="Login username / key" value={staffForm.user_key} onChange={(e)=>setStaffForm({...staffForm,user_key:e.target.value})}/><input style={input} placeholder="Display name" value={staffForm.display_name} onChange={(e)=>setStaffForm({...staffForm,display_name:e.target.value})}/><select style={input} value={staffForm.role_key} onChange={(e)=>setStaffForm({...staffForm,role_key:e.target.value})}>{Object.keys(EVENT_ROLE_TEMPLATES).map(k=><option key={k} value={k}>{k.replaceAll('_',' ')}</option>)}</select></div><button style={{ ...primary,marginTop:10 }} onClick={addStaff}>Assign Role</button></div>}<div style={card}>{staff.map((s)=><div key={s.id} style={{ display:"flex",justifyContent:"space-between",padding:"11px 0",borderBottom:"1px solid #eee" }}><div><b>{s.display_name}</b><div style={{ color:"#6b7280" }}>{s.role_key.replaceAll('_',' ')} · {s.user_key}</div></div>{can("event.staff") && s.role_key!=="owner" && <button style={danger} onClick={()=>removeStaff(s.id)}>Remove</button>}</div>)}</div></div>;
    if (tab === "Settings") return <div style={card}><div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12 }}><label style={label}>Name<input style={input} disabled={!can("event.settings")} value={event.name} onChange={(e)=>setEvent({...event,name:e.target.value})}/></label><label style={label}>Status<select style={input} disabled={!can("event.settings")} value={event.status} onChange={(e)=>setEvent({...event,status:e.target.value})}>{['draft','registration','active','completed','cancelled'].map(v=><option key={v}>{v}</option>)}</select></label><label style={label}>Visibility<select style={input} disabled={!can("event.settings")} value={event.visibility} onChange={(e)=>setEvent({...event,visibility:e.target.value})}>{['public','invite_only','unlisted'].map(v=><option key={v}>{v}</option>)}</select></label><label style={label}>Max drivers<input style={input} type="number" disabled={!can("event.settings")} value={event.max_drivers} onChange={(e)=>setEvent({...event,max_drivers:Number(e.target.value)})}/></label><label style={{ ...label, display:"flex",alignItems:"center",gap:10 }}><span>Allow guest drivers</span><input type="checkbox" disabled={!can("event.settings")} checked={!!event.allow_guest_drivers} onChange={(e)=>setEvent({...event,allow_guest_drivers:e.target.checked})}/></label>{event.allow_guest_drivers && <label style={label}>Max guest drivers<input style={input} type="number" min="0" disabled={!can("event.settings")} value={event.max_guest_drivers || 0} onChange={(e)=>setEvent({...event,max_guest_drivers:Number(e.target.value)})}/></label>}{event.allow_guest_drivers && <label style={{ ...label, display:"flex",alignItems:"center",gap:10 }}><span>Require guest approval</span><input type="checkbox" disabled={!can("event.settings")} checked={event.guest_approval_required !== false} onChange={(e)=>setEvent({...event,guest_approval_required:e.target.checked})}/></label>}<label style={label}>Entry fee ($)<input style={input} type="number" min="0" step="0.01" disabled={!can("event.settings")} value={event.entry_fee || 0} onChange={(e)=>setEvent({...event,entry_fee:Number(e.target.value)})}/></label><label style={label}>Prize pool ($)<input style={input} type="number" disabled={!can("event.settings")} value={event.prize_pool} onChange={(e)=>setEvent({...event,prize_pool:Number(e.target.value)})}/></label><label style={label}>Payment method<input style={input} disabled={!can("event.settings")} value={event.payment_method||''} onChange={(e)=>setEvent({...event,payment_method:e.target.value})}/></label><label style={label}>Discord URL<input style={input} disabled={!can("event.settings")} value={event.discord_url||''} onChange={(e)=>setEvent({...event,discord_url:e.target.value})}/></label></div><label style={{ ...label,marginTop:12 }}>Description<textarea style={{ ...input,minHeight:90 }} disabled={!can("event.settings")} value={event.description||''} onChange={(e)=>setEvent({...event,description:e.target.value})}/></label><label style={{ ...label,marginTop:12 }}>Prize distribution<textarea style={{ ...input,minHeight:90 }} disabled={!can("event.settings")} value={event.prize_distribution||''} onChange={(e)=>setEvent({...event,prize_distribution:e.target.value})}/></label><label style={{ ...label,marginTop:12 }}>Refund policy<textarea style={{ ...input,minHeight:90 }} disabled={!can("event.settings")} value={event.refund_policy||''} onChange={(e)=>setEvent({...event,refund_policy:e.target.value})}/></label><label style={{ ...label,marginTop:12 }}>Rules<textarea style={{ ...input,minHeight:130 }} disabled={!can("event.settings")} value={event.rules||''} onChange={(e)=>setEvent({...event,rules:e.target.value})}/></label>{can("event.settings") && <button style={{ ...primary,marginTop:14 }} onClick={saveSettings}>Save Settings</button>}{isOwner && <button style={{ ...danger,marginTop:14,marginLeft:10 }} onClick={deleteEvent}>Delete Event</button>}</div>;
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
            <button type="button" style={{ ...primary, opacity: registrationIsOpen && currentDriver ? 1 : 0.55 }} disabled={!registrationIsOpen || !currentDriver} onClick={requestSignUp}>{Number(event.entry_fee || 0) > 0 ? `Review Terms & Register ($${Number(event.entry_fee).toLocaleString()})` : "Review Terms & Sign Up"}</button>
          )}
        </div>
      )}
      {event.allow_guest_drivers && !isOwner && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div><div style={{ fontWeight: 900, fontSize: 18 }}>Not a BRL league driver?</div><div style={{ color: "#6b7280", marginTop: 4 }}>Guest drivers may apply to run this event. {event.guest_approval_required ? "The event host must approve the registration." : "Approved registrations are added immediately."}</div><div style={{ color: "#6b7280", marginTop: 3 }}>{acceptedGuestCount} of {event.max_guest_drivers || 0} guest spots filled.</div></div>
            <button type="button" style={{ ...secondary, opacity: registrationIsOpen && !guestCapacityReached ? 1 : .55 }} disabled={!registrationIsOpen || guestCapacityReached} onClick={() => setShowGuestForm((value) => !value)}>{showGuestForm ? "Close Guest Form" : "Register as Guest"}</button>
          </div>
          {showGuestForm && <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
            <label style={label}>Name<input style={input} value={guestForm.display_name} onChange={(e)=>setGuestForm({...guestForm,display_name:e.target.value})}/></label>
            <label style={label}>Racing gamertag<input style={input} value={guestForm.gamertag} onChange={(e)=>setGuestForm({...guestForm,gamertag:e.target.value})}/></label>
            <label style={label}>Platform<select style={input} value={guestForm.platform} onChange={(e)=>setGuestForm({...guestForm,platform:e.target.value})}><option>PlayStation</option><option>Xbox</option><option>PC</option><option>Other</option></select></label>
            <label style={label}>Email<input style={input} type="email" value={guestForm.email} onChange={(e)=>setGuestForm({...guestForm,email:e.target.value})}/></label>
            <label style={label}>Discord (optional)<input style={input} value={guestForm.discord} onChange={(e)=>setGuestForm({...guestForm,discord:e.target.value})}/></label>
            <label style={label}>Preferred number (optional)<input style={input} value={guestForm.driver_number} onChange={(e)=>setGuestForm({...guestForm,driver_number:e.target.value})}/></label>
            <div style={{ gridColumn:"1 / -1" }}><button type="button" style={primary} onClick={requestGuestRegistration}>Review Terms & Submit</button></div>
          </div>}
        </div>
      )}
      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginBottom:16 }}>{tabs.map((name)=><button key={name} style={tab===name?primary:secondary} onClick={()=>setTab(name)}>{name}</button>)}</div>{renderTab()}
      {showGuestTerms && (
        <div style={modalOverlay} role="dialog" aria-modal="true" aria-label="Guest event driver agreement">
          <div style={modalCard}>
            <h2 style={{ marginTop: 0 }}>BRL Guest Driver Agreement</h2>
            <div style={{ ...card, background: "#f9fafb", marginBottom: 12 }}><b>{event.name}</b><div style={{ marginTop: 5 }}>Guest: <b>{guestForm.display_name}</b> ({guestForm.gamertag})</div>{Number(event.entry_fee || 0) > 0 ? <><div>Entry fee: <b>${Number(event.entry_fee || 0).toLocaleString()}</b></div><div>Payment method: {event.payment_method || "Contact the host"}</div><div>Refund policy: {event.refund_policy || "Not posted"}</div></> : <div>Free event — no entry fee.</div>}</div>
            {(Number(event.entry_fee || 0) > 0 ? [
              "I understand this is an independently hosted event and may not be an official BRL-sanctioned competition.",
              `I understand this event requires an entry fee of $${Number(event.entry_fee || 0).toLocaleString()}.`,
              "I am responsible for submitting payment directly to the event host using the posted method.",
              "I understand BRL does not process, collect, hold, or distribute entry fees.",
              "I have read and agree to the host's event rules.",
              "I have read and accept the posted refund policy.",
              "I agree to compete fairly and follow BRL and event-specific conduct standards.",
              "I understand failure to appear may result in forfeiture of my entry fee under the posted refund policy.",
              "I understand prize payouts are the responsibility of the event host.",
              "I understand BRL is not responsible for payment disputes, refunds, cancellations, or prize distribution.",
              "I certify that I am legally eligible to enter a paid competition and will comply with all applicable laws and age requirements."
            ] : [
              "I understand this is an independently hosted event and may not be an official BRL-sanctioned competition.",
              "I have read and agree to the host's event rules.",
              "I agree to compete fairly and follow BRL and event-specific conduct standards.",
              "I understand that repeated no-shows or disruptive conduct may result in removal.",
              "I understand BRL may remove or suspend events that violate league standards.",
              "I understand registration confirms my intent to participate in the posted event schedule."
            ]).map((text,index)=><label key={text} style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"9px 0",fontWeight:700 }}><input type="checkbox" checked={guestChecks[index]} onChange={(e)=>setGuestChecks(items=>items.map((v,i)=>i===index?e.target.checked:v))}/><span>{text}</span></label>)}
            <label style={{ display:"flex",gap:10,alignItems:"flex-start",padding:"14px 0",borderTop:"1px solid #e5e7eb",fontWeight:900 }}><input type="checkbox" checked={guestFinal} onChange={(e)=>setGuestFinal(e.target.checked)}/><span>I have read, understand, and agree to all terms above.</span></label>
            <div style={{ display:"flex",justifyContent:"flex-end",gap:10 }}><button type="button" style={secondary} onClick={()=>setShowGuestTerms(false)}>Cancel</button><button type="button" style={{ ...primary,opacity:guestChecks.every(Boolean)&&guestFinal?1:.5 }} disabled={!guestChecks.every(Boolean)||!guestFinal} onClick={()=>submitGuestRegistration(true)}>Accept & Submit Registration</button></div>
          </div>
        </div>
      )}
      {showDriverTerms && (
        <div style={modalOverlay} role="dialog" aria-modal="true" aria-label="Paid event driver agreement">
          <div style={modalCard}>
            <h2 style={{ marginTop: 0 }}>BRL Event Driver Agreement</h2>
            <div style={{ ...card, background: "#f9fafb", marginBottom: 12 }}>
              <b>{event.name}</b>
              {Number(event.entry_fee || 0) > 0 ? (<>
                <div style={{ marginTop: 5 }}>Entry fee: <b>${Number(event.entry_fee || 0).toLocaleString()}</b></div>
                <div>Payment method: {event.payment_method || "Contact the host"}</div>
                <div>Prize distribution: {event.prize_distribution || "Not posted"}</div>
                <div>Refund policy: {event.refund_policy || "Not posted"}</div>
              </>) : <div style={{ marginTop: 5 }}>Free event — no entry fee.</div>}
            </div>
            {(Number(event.entry_fee || 0) > 0 ? [
              "I understand this is an independently hosted event and may not be an official BRL-sanctioned competition.",
              `I understand this event requires an entry fee of $${Number(event.entry_fee || 0).toLocaleString()}.`,
              "I am responsible for submitting payment directly to the event host using the posted method.",
              "I understand BRL does not process, collect, hold, or distribute entry fees.",
              "I have read and agree to the host's event rules.",
              "I have read and accept the posted refund policy.",
              "I agree to compete fairly and follow BRL and event-specific conduct standards.",
              "I understand failure to appear may result in forfeiture of my entry fee under the posted refund policy.",
              "I understand prize payouts are the responsibility of the event host.",
              "I understand BRL is not responsible for payment disputes, refunds, cancellations, or prize distribution.",
              "I certify that I am legally eligible to enter a paid competition and will comply with all applicable laws and age requirements."
            ] : [
              "I understand this is an independently hosted event and may not be an official BRL-sanctioned competition.",
              "I have read and agree to the host's event rules.",
              "I agree to compete fairly and follow BRL and event-specific conduct standards.",
              "I understand that repeated no-shows or disruptive conduct may result in removal from the event or league discipline.",
              "I understand BRL may remove or suspend events that violate league standards.",
              "I understand registration confirms my intent to participate in the posted event schedule."
            ]).map((text, index) => (
              <label key={text} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "9px 0", fontWeight: 700 }}>
                <input type="checkbox" checked={driverChecks[index]} onChange={(e) => setDriverChecks((items) => items.map((v, i) => i === index ? e.target.checked : v))} />
                <span>{text}</span>
              </label>
            ))}
            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "14px 0", borderTop: "1px solid #e5e7eb", fontWeight: 900 }}>
              <input type="checkbox" checked={driverFinal} onChange={(e) => setDriverFinal(e.target.checked)} />
              <span>I have read, understand, and agree to all terms above.</span>
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" style={secondary} onClick={() => setShowDriverTerms(false)}>Cancel</button>
              <button type="button" style={{ ...primary, opacity: driverChecks.every(Boolean) && driverFinal ? 1 : .5 }} disabled={!driverChecks.every(Boolean) || !driverFinal} onClick={() => signUpForEvent(true)}>Accept & Register</button>
            </div>
          </div>
        </div>
      )}
</div></div>;
}
