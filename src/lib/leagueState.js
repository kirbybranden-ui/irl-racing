import { supabase } from "./supabase";

const ROW_KEY = "irl-league";

export async function loadLeagueState() {
  if (!supabase) return null;

  const { data, error } = await supabase.rpc("brl_read_league");

  if (error) {
    console.error("Load error:", error);
    return null;
  }

  return data || null;
}

export async function saveLeagueState(state, expectedRevision=null) {
  if (!supabase) throw new Error("Supabase is unavailable.");

  let query=supabase.from("league_state").update({data:state,updated_at:new Date().toISOString()}).eq("season_name",ROW_KEY);
  if(expectedRevision)query=query.eq("updated_at",expectedRevision);
  const {data,error}=await query.select("updated_at").maybeSingle();

  if (error) {
    console.error("Save error:", error);
    throw error;
  }
  if(!data)throw new Error("League data changed on the server. Reload before saving to protect bank and roster updates.");
  setTimeout(()=>window.dispatchEvent(new Event("brl:bank-state-changed")),50);
  return data.updated_at;
}
