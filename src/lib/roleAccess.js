import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {createSharedRead} from "./sharedRead";

export const ROLE_LABELS = { driver: "Driver", owner: "Owner", race_recorder: "Race Recorder", full_admin: "Full Admin" };
export function hasLeagueRole(access, role) { return access?.roles?.includes(role) === true; }
export function canManageTeam(access, team) { return hasLeagueRole(access, "full_admin") || (hasLeagueRole(access, "owner") && access?.ownedTeams?.includes(team)); }
export function canSeeRoute(access, path) {
  if (access?.agreementRequired && !["/login","/user-agreement","/terms"].includes(path)) return false;
  if (["/career", "/appeals", "/submit-appeal"].includes(path) || /^\/driver\/[^/]+\/appeals\/?$/.test(path)) return Boolean(access?.userId);
  const applicant = access?.userId && !access.isDriver && !access.isOwner && !access.isAdmin;
  if (applicant && ["/media", "/strategy", "/interviews", "/welcome", "/message-center", "/notifications", "/submit-appeal", "/chat", "/vote", "/league-vote", "/voting", "/paint-scheme-vote", "/submit-story", "/development-requests", "/developmental-requests", "/dev-requests"].includes(path)) return false;

  if (path.startsWith("/admin") || ["/stories"].includes(path)) return hasLeagueRole(access, "full_admin") || (path === "/admin" && hasLeagueRole(access, "race_recorder"));
  if (path === "/race-recorder") return hasLeagueRole(access, "race_recorder") || hasLeagueRole(access, "full_admin");
  if (["/team-hq", "/owner-hq", "/owner", "/hq", "/teamhq"].includes(path)) return hasLeagueRole(access, "owner") || hasLeagueRole(access, "full_admin") || Boolean(access?.userId && ["owner", "independent"].includes(access?.applicationKind));
  if (["/media", "/strategy", "/welcome", "/contracts", "/message-center", "/notifications", "/submit-appeal", "/chat", "/vote", "/voting", "/submit-story", "/development-requests"].includes(path)) return Boolean(access?.userId);
  return true;
}

let accessGeneration=0,lastAccessUser,publishedAccess;
const accessReader=createSharedRead({label:"Account permissions",request:async signal=>{
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)return null;
  const {data,error}=await supabase.rpc("brl_my_access").abortSignal(signal);
  if(error)throw error;
  return data;
}});
supabase.auth.onAuthStateChange((event,session)=>{
  const user=session?.user?.id||null;
  if(event==="SIGNED_OUT"||(lastAccessUser!==undefined&&lastAccessUser!==user)){accessGeneration++;accessReader.invalidate();publishedAccess=undefined;}
  lastAccessUser=user;
});
export async function refreshLeagueAccess(){
  const generation=accessGeneration,access=await accessReader.read();
  if(generation!==accessGeneration)return null;
  if(access===publishedAccess)return access;
  publishedAccess=access;
  try{
    if(access?.userId){localStorage.setItem("bcl-league-session",JSON.stringify(access));localStorage.setItem("bcl-mobile-session-v1",JSON.stringify(access));}
    else{localStorage.removeItem("bcl-league-session");localStorage.removeItem("bcl-mobile-session-v1");}
  }catch{/* The verified in-memory access still works if browser storage is blocked. */}
  window.dispatchEvent(new CustomEvent("brl:access-loaded",{detail:access}));
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
