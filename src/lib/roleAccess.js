import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export const ROLE_LABELS = { driver: "Driver", owner: "Owner", race_recorder: "Race Recorder", full_admin: "Full Admin" };
export function hasLeagueRole(access, role) { return access?.roles?.includes(role) === true; }
export function canManageTeam(access, team) { return hasLeagueRole(access, "full_admin") || (hasLeagueRole(access, "owner") && access?.ownedTeams?.includes(team)); }
export function canSeeRoute(access, path) {
  if (path.startsWith("/admin") || ["/appeals","/stories"].includes(path)) return hasLeagueRole(access, "full_admin") || (path === "/admin" && hasLeagueRole(access, "race_recorder"));
  if (path === "/race-recorder") return hasLeagueRole(access, "race_recorder") || hasLeagueRole(access, "full_admin");
  if (["/team-hq", "/owner-hq", "/owner", "/hq", "/teamhq"].includes(path)) return hasLeagueRole(access, "owner") || hasLeagueRole(access, "full_admin");
  if (["/welcome", "/contracts", "/message-center", "/notifications", "/submit-appeal", "/chat", "/vote", "/voting", "/submit-story", "/development-requests"].includes(path)) return Boolean(access?.userId);
  return true;
}

let accessGeneration = 0;
supabase.auth.onAuthStateChange(() => { accessGeneration += 1; });

export async function refreshLeagueAccess() {
  const generation = accessGeneration;
  const { data: { session } } = await supabase.auth.getSession();
  let access = null;
  if (session) {
    const { data, error } = await supabase.rpc("brl_my_access");
    if (error) throw error;
    access = data;
  }
  if (generation !== accessGeneration) return null;
  if (access?.userId) {
    localStorage.setItem("bcl-league-session", JSON.stringify(access));
    localStorage.setItem("bcl-mobile-session-v1", JSON.stringify(access));
  }
  else { localStorage.removeItem("bcl-league-session"); localStorage.removeItem("bcl-mobile-session-v1"); }
  window.dispatchEvent(new CustomEvent("brl:access-loaded", { detail: access }));
  window.dispatchEvent(new Event("brl:session-changed"));
  return access;
}

export function useLeagueAccess() {
  const [state, setState] = useState({ access: null, loading: true, error: "" });
  useEffect(() => {
    let active = true;
    const update = (event) => { if (active) setState({ access: event.detail || null, loading: false, error: "" }); };
    const refresh = () => refreshLeagueAccess().catch((error) => { if (active) setState({ access: null, loading: false, error: error.message }); });
    window.addEventListener("brl:access-loaded", update);
    window.addEventListener("focus", refresh);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { setTimeout(refresh, 0); });
    refresh();
    return () => { active = false; subscription.unsubscribe(); window.removeEventListener("brl:access-loaded", update); window.removeEventListener("focus", refresh); };
  }, []);
  return state;
}
