import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import RaceEntryEditor from "../components/admin/RaceEntryEditor";
import { validateRaceEntries } from "../utils/raceSubmissionHelpers";

export default function RaceRecorderPage({ drivers, tracks, activeSeasonId, access }) {
  const [race,setRace]=useState("");const [entries,setEntries]=useState([]);const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);const [submissions,setSubmissions]=useState([]);
  const load=async()=>{const {data,error}=await supabase.from("brl_race_submissions").select("id,race_name,status,review_note,created_at").eq("submitted_by",access.userId).order("created_at",{ascending:false});if(error)throw error;setSubmissions(data||[]);};
  useEffect(()=>{setEntries(drivers.filter((driver)=>!driver.retired&&!driver.isSubstitute).map((driver)=>({driverId:driver.id,finishPos:"",stage1Pos:"",stage2Pos:"",stage3Pos:""})));},[activeSeasonId]);
  useEffect(()=>{load().catch((error)=>setStatus(error.message));},[access.userId]);
  const stageCount=Number(tracks.find((track)=>track.name===race)?.stageCount||2);
  const submit=async()=>{setBusy(true);setStatus("");try{if(!race)throw new Error("Select a race.");const rows=entries.filter((entry)=>entry.finishPos!=="");validateRaceEntries(rows,drivers,stageCount);const {error}=await supabase.from("brl_race_submissions").insert({season_id:String(activeSeasonId),race_name:race,submitted_by:access.userId,entries:rows});if(error)throw error;setStatus("Submitted for full admin review. Standings have not changed.");await load();}catch(error){setStatus(error.message);}finally{setBusy(false);}};
  return <main style={{ maxWidth:1200,margin:"32px auto",padding:24 }}><h1>Race Recorder</h1><p>Enter race data and submit it for approval. A full admin must review and publish it.</p><label>Race <select value={race} onChange={(event)=>setRace(event.target.value)}><option value="">Select race</option>{tracks.map((track)=><option key={track.name}>{track.name}</option>)}</select></label><RaceEntryEditor drivers={drivers} entries={entries} onChange={setEntries} stageCount={stageCount} recorder/><button disabled={busy} onClick={submit}>{busy?"Submitting…":"Submit for Approval"}</button>{status&&<p role="status">{status}</p>}<h2>Your submissions</h2>{submissions.map((item)=><p key={item.id}>{item.race_name} · {item.status}{item.review_note?` · ${item.review_note}`:""}</p>)}</main>;
}
