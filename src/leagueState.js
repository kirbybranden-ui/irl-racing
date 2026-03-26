import { supabase } from "./supabase";

const SEASON_NAME = "2026 Season";

export async function loadLeagueState() {
  const { data, error } = await supabase
    .from("league_state")
    .select("*")
    .eq("season_name", SEASON_NAME)
    .maybeSingle();

  if (error) {
    console.error("Load error:", error);
    return null;
  }

  return data?.data || null;
}

export async function saveLeagueState(state) {
  const { error } = await supabase
    .from("league_state")
    .upsert({
      season_name: SEASON_NAME,
      data: state,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Save error:", error);
  }
}