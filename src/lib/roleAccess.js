import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {createSharedRead} from "./sharedRead";
import {accessAfterFailure,identityChanged} from "./accessContinuity";
import {canUseAdminRoute} from "./adminPortalAccess";

export const ROLE_LABELS = { driver: "Driver", owner: "Owner", race_recorder: "Race Recorder", full_admin: "Full Admin" };
export function hasLeagueRole(access, role) { return access?.roles?.includes(role) === true; }
export function canManageTeam(access, team) { return hasLeagueRole(access, "full_admin") || (hasLeagueRole(access, "owner") && access?.ownedTeams?.includes(team)); }
export function canSeeRoute(access, path) {
  if (access?.agreementRequired && !["/login","/user-agreement","/terms"].includes(path)) return false;
  if (["/career", "/appeals", "/submit-appeal"].includes(path) || /^\/driver\/[^/]+\/appeals\/?$/.test(path)) return Boolean(access?.userId);
  const applicant = access?.userId && !access.isDriver && !access.isOwner && !access.isAdmin;
  if (applicant && ["/media", "/strategy", "/interviews", "/welcome", "/message-center", "/notifications", "/submit-appeal", "/chat", "/vote", "/league-vote", "/voting", "/paint-scheme-vote", "/submit-story", "/development-requests", "/developmental-requests", "/dev-requests"].includes(path)) return false;

  if (path === "/admin-login") return true;
  if (path.startsWith("/admin")) return canUseAdminRoute(access, path);
  if (path === "/stories") return canUseAdminRoute(access, "/admin/stories");
  if (path === "/manufacturer-hq") return canUseAdminRoute(access, "/admin/support");
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
  const {data,error}=await supabase.rpc("brl_portal_access").abortSignal(signal);
  if(error)throw error;
  return data;
}});
supabase.auth.onAuthStateChange((event,session)=>{
  const user=session?.user?.id||null;
  if(event==="SIGNED_OUT"||(lastAccessUser!==undefined&&lastAccessUser!==user)){accessGeneration++;accessReader.invalidate();publishedAccess=undefined;
    try{localStorage.removeItem("bcl-league-session");localStorage.removeItem("bcl-mobile-session-v1");}catch{/* Storage may be unavailable. */}
    if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("brl:access-loaded",{detail:null}));
  }
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
    let active = true, identity=lastAccessUser??publishedAccess?.userId??null, retryTimer, attempts=0;
    const update = (event) => { if (active) {attempts=0;clearTimeout(retryTimer);setState({ access: event.detail || null, loading: false, error: "" });} };
    const refresh = () => {
      clearTimeout(retryTimer);
      const expectedIdentity=identity;
      return refreshLeagueAccess().catch((error) => {
        if (!active||expectedIdentity!==identity) return;
        setState(previous=>accessAfterFailure(previous.access,identity,error));
        // Bounded backoff; no sign-out or credential clearing on network/RPC failure.
        retryTimer=setTimeout(refresh,Math.min(30000,2000*2**Math.min(attempts++,4)));
      });
    };
    window.addEventListener("brl:access-loaded", update);
    window.addEventListener("focus", refresh);
    window.addEventListener("brl:retry-access",refresh);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event,session) => {
      const changed=identityChanged(identity,event,session);identity=session?.user?.id||null;
      if(changed&&active){clearTimeout(retryTimer);setState({access:null,loading:event!=="SIGNED_OUT",error:""});}
      // Never await an auth operation inside the Supabase callback.
      clearTimeout(retryTimer);retryTimer=setTimeout(refresh,0);
    });
    refresh();
    return () => { active = false;clearTimeout(retryTimer);subscription.unsubscribe();window.removeEventListener("brl:access-loaded", update);window.removeEventListener("focus", refresh);window.removeEventListener("brl:retry-access",refresh); };
  }, []);
  return state;
}
