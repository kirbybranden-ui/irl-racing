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

export async function saveLeagueState(state) {
  if (!supabase) throw new Error("Supabase is unavailable.");

  const { data, error } = await supabase
    .from("league_state")
    .upsert({
      season_name: ROW_KEY,
      data: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: "season_name" }).select("updated_at").single();

  if (error) {
    console.error("Save error:", error);
    throw error;
  }
  return data.updated_at;
}
