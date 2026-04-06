import { supabase } from "./supabase";

const ROW_KEY = "irl-league";

export async function loadLeagueState() {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("league_state")
    .select("*")
    .eq("season_name", ROW_KEY)
    .maybeSingle();

  if (error) {
    console.error("Load error:", error);
    return null;
  }

  return data?.data || null;
}

export async function saveLeagueState(state) {
  if (!supabase) return;

  const { error } = await supabase
    .from("league_state")
    .upsert({
      season_name: ROW_KEY,
      data: state,
      updated_at: new Date().toISOString(),
    }, { onConflict: "season_name" });

  if (error) {
    console.error("Save error:", error);
  }
}
