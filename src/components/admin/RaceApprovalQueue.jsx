import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import RaceEntryEditor from "./RaceEntryEditor";
export default function RaceApprovalQueue({ drivers, tracks, onApprove }) {
  const [rows,setRows]=useState([]);const [status,setStatus]=useState("");const [busy,setBusy]=useState(false);
  const load=async()=>{const {data,error}=await supabase.from("brl_race_submissions").select("*").eq("status","pending").order("created_at");if(error)throw error;setRows(data||[]);};
  useEffect(()=>{load().catch((error)=>setStatus(error.message));},[]);
  const review=async(row,approve)=>{setBusy(true);setStatus("");try{if(approve)await onApprove(row);else{const note=window.prompt("Reason for rejection:");if(!note?.trim())return;const {data:{user}}=await supabase.auth.getUser();const {error}=await supabase.from("brl_race_submissions").update({status:"rejected",review_note:note,reviewed_by:user.id,reviewed_at:new Date().toISOString()}).eq("id",row.id).eq("status","pending");if(error)throw error;}await load();setStatus(approve?"Race approved and published.":"Submission rejected.");}catch(error){setStatus(error.message);}finally{setBusy(false);}};
  return <section style={{ borderTop:"3px solid #d71920",padding:"20px 0",marginBottom:24 }}><h2>Race submissions awaiting approval ({rows.length})</h2>{status&&<p role="status">{status}</p>}{rows.map((row)=><details key={row.id}><summary>{row.race_name} · {new Date(row.created_at).toLocaleString()}</summary><RaceEntryEditor drivers={drivers} entries={row.entries} stageCount={Number(tracks.find((track)=>track.name===row.race_name)?.stageCount||2)} onChange={(entries)=>setRows((current)=>current.map((item)=>item.id===row.id?{...item,entries}:item))}/><button disabled={busy} onClick={()=>review(row,true)}>Approve & Publish</button><button disabled={busy} onClick={()=>review(row,false)}>Reject</button></details>)}</section>;
}
