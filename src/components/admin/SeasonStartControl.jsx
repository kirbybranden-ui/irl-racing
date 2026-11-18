import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { buildScheduleView } from "../../utils/scheduleView";

/** The selected race is the first non-preseason points race; the database remains authoritative. */
export default function SeasonStartControl({ access, tracks = [], activeSeasonId }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const events = useMemo(() => buildScheduleView(tracks).events.filter(event =>
    event.date && !/pre[ -]?season/i.test(`${event.phase} ${event.name}`)
  ), [tracks]);
  const firstRace = events[0] || null;
  const [selected, setSelected] = useState("");
  const selectedRace = events.find(event => `${event.name}|${event.date.iso}` === selected);
  const isDaytona = event => /daytona/i.test(`${event.name} ${event.track?.eventLabel || ""}`);
  const validSelection = Boolean(firstRace && selectedRace && selectedRace === firstRace && isDaytona(selectedRace));

  async function load() {
    setLoading(true);
    try {
      const { data, error: failure } = await supabase.rpc("brl_admin_season_calendar_read");
      if (failure) throw failure;
      setRecord(data);
      setError("");
    } catch (failure) { setError(failure.message || "Could not load the season calendar."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (access?.isSuperAdmin) load(); }, [access?.isSuperAdmin, activeSeasonId]);
  useEffect(() => { setSelected(firstRace ? `${firstRace.name}|${firstRace.date.iso}` : ""); }, [firstRace?.name, firstRace?.date?.iso]);
  if (!access?.isSuperAdmin) return null;
  const configured = Boolean(record?.start_date);
  const wrongSeason = Boolean(record?.season_id && activeSeasonId && String(record.season_id) !== String(activeSeasonId));

  async function save(event) {
    event.preventDefault();
    if (!validSelection || wrongSeason || configured || saving) return;
    if (!window.confirm(`Set the OFFICIAL Season 2 start to ${selectedRace.name} on ${selectedRace.date.full}? This schedules mandatory owner salaries and may immediately suspend owners with overdue bills. This cannot be casually changed after payroll is created.`)) return;
    setSaving(true); setError(""); setMessage("");
    try {
      const { data, error: failure } = await supabase.rpc("brl_admin_set_season_start", {
        p_season_id: record.season_id,
        p_start_date: selectedRace.date.iso,
        p_race_name: selectedRace.name,
      });
      if (failure) throw failure;
      setRecord(data);
      setMessage("Official season start saved. Owner salary obligations have been reconciled by the database.");
      window.dispatchEvent(new Event("brl:bank-state-changed"));
    } catch (failure) { setError(failure.message || "Could not set the season start. No partial payroll changes were saved."); }
    finally { setSaving(false); }
  }
  return <section className="brl-season-start" aria-labelledby="brl-season-start-heading">
    <p className="brl-season-start__eyebrow">Super Admin · Season 2 finance</p>
    <h2 id="brl-season-start-heading">Official season start & owner payroll</h2>
    <p>Select the <strong>first points-paying Daytona race</strong>, not the preseason event. This date controls the end-of-Day-1 owner salary deadline in Eastern Time. NLM's previously signed November 6 deadline is grandfathered.</p>
    {loading ? <p role="status">Checking the official season calendar…</p> : <>
      <p><strong>Database season:</strong> {record?.season_id || "Unavailable"}</p>
      {configured ? <div className="brl-season-start__locked" role="status"><strong>Season start is configured: {record.start_date}</strong><p>Selected race: {record.source_race || "Not recorded"}. Timezone: {record.timezone || "America/New_York"}. Salary obligations are managed by the database. Changing the start date is locked after payroll creation.</p></div> : <form onSubmit={save}>
        <label>First regular-season race
          <select required value={selected} onChange={event => setSelected(event.target.value)}>
            <option value="">Choose an official scheduled race</option>
            {events.map(event => <option key={`${event.name}-${event.date.iso}`} value={`${event.name}|${event.date.iso}`}>{event.date.full} — {event.name} ({event.phase})</option>)}
          </select>
        </label>
        {selectedRace && <p>Selected: <strong>{selectedRace.name}</strong> · {selectedRace.date.full}</p>}
        {!firstRace && <p role="status">No dated regular-season races are published. Add the official schedule before configuring payroll.</p>}
        {firstRace && !isDaytona(firstRace) && <p role="alert">The earliest dated non-preseason race is not Daytona. Verify the published race schedule before proceeding.</p>}
        {wrongSeason && <p role="alert">The app's selected season does not match the database's current career season. Switch to Season 2 before continuing.</p>}
        <button type="submit" disabled={!validSelection || wrongSeason || !record?.season_id || saving}>{saving ? "Configuring season…" : "Confirm official Daytona season start"}</button>
      </form>}
    </>}
    {error && <p role="alert" className="brl-season-start__error">{error}</p>}
    {message && <p role="status" className="brl-season-start__success">{message}</p>}
    <p className="brl-season-start__footnote">Manual salary payments only. The calendar configuration does not withdraw funds. Any existing overdue bills remain due.</p>
  </section>;
}
