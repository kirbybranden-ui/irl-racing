import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {createSharedRead} from "./sharedRead";
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
let lastSuccessfulVerificationAt=0;
const ACCESS_RECHECK_MS=300000;
const ACCESS_CACHE_KEY="bcl-league-session";
const ACCESS_CACHE_AGE_KEY="brl-access-cache-verified-at";
const ACCESS_CACHE_MAX_AGE_MS=24*60*60*1000;
// A verified access receipt is display continuity ONLY. Supabase RPCs and RLS
// must independently authorize all writes; never use this cache as a credential.
function readAccessReceipt(authUserId){
  if(!authUserId || typeof window==='undefined') return null;
  try {
    const saved=JSON.parse(localStorage.getItem(ACCESS_CACHE_KEY)||'null');
    if(saved?.userId!==authUserId || saved?.agreementRequired===true)return null;
    // Existing BRL installs already have a verified access receipt but no
    // timestamp. Migrate that receipt once for the same authenticated user.
    let verifiedAt=Number(localStorage.getItem(ACCESS_CACHE_AGE_KEY)||0);
    if(!verifiedAt){verifiedAt=Date.now();localStorage.setItem(ACCESS_CACHE_AGE_KEY,String(verifiedAt));}
    const age=Date.now()-verifiedAt;
    return Number.isFinite(age)&&age>=0&&age<=ACCESS_CACHE_MAX_AGE_MS ? saved : null;
  } catch {return null;}
}
function clearAccessReceipt(){
  try{localStorage.removeItem(ACCESS_CACHE_KEY);localStorage.removeItem('bcl-mobile-session-v1');localStorage.removeItem(ACCESS_CACHE_AGE_KEY);}catch{/* browser storage unavailable */}
}
const accessReader=createSharedRead({label:"Account permissions",retries:1,request:async signal=>{
  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)return null;
  const {data,error}=await supabase.rpc("brl_portal_access").abortSignal(signal);
  if(error)throw error;
  // A missing access response for an authenticated Supabase session is a
  // verification problem, not proof that the member logged out.
  if (!data || !data.userId) throw new Error('League account verification is temporarily unavailable. Your saved login has not been cleared.');
  return data;
}});
supabase.auth.onAuthStateChange((event,session)=>{
  const user=session?.user?.id||null;
  if(event==="SIGNED_OUT"||(lastAccessUser!==undefined&&lastAccessUser!==user)){accessGeneration++;accessReader.invalidate();publishedAccess=undefined;lastSuccessfulVerificationAt=0;
    clearAccessReceipt();
    if(typeof window!=="undefined")window.dispatchEvent(new CustomEvent("brl:access-loaded",{detail:null}));
  }
  lastAccessUser=user;
});
export async function refreshLeagueAccess(){
  const generation=accessGeneration,access=await accessReader.read();
  if(generation!==accessGeneration)return null;
  if(access===publishedAccess)return access;
  publishedAccess=access;
  lastSuccessfulVerificationAt=Date.now();
  try{
    if(access?.userId){localStorage.setItem(ACCESS_CACHE_KEY,JSON.stringify(access));localStorage.setItem("bcl-mobile-session-v1",JSON.stringify(access));localStorage.setItem(ACCESS_CACHE_AGE_KEY,String(Date.now()));}
    else{clearAccessReceipt();}
  }catch{/* The verified in-memory access still works if browser storage is blocked. */}
  window.dispatchEvent(new CustomEvent("brl:access-loaded",{detail:access}));
  window.dispatchEvent(new Event("brl:session-changed"));
  return access;
}

export function useLeagueAccess() {
  const [state,setState]=useState({access:null,loading:true,error:""});
  useEffect(()=>{
    let live=true, identity=null, retryTimer=null, retries=0;
    const clearRetry=()=>{if(retryTimer!==null)clearTimeout(retryTimer);retryTimer=null;};
    const apply=(access,error="")=>{
      if(!live)return;
      setState(previous=>({access:access??previous.access??null,loading:false,error}));
    };
    const refresh=async(force=false)=>{
      if(!live)return;
      if(!force&&publishedAccess?.userId===identity&&Date.now()-lastSuccessfulVerificationAt<ACCESS_RECHECK_MS)return;
      clearRetry();
      const expected=identity;
      try{
        const access=await refreshLeagueAccess();
        if(!live||identity!==expected)return;
        retries=0;
        // A null response is only a sign-out if Supabase itself confirms it.
        if(access)apply(access);
        else {
          const {data:{session}}=await supabase.auth.getSession();
          if(!live||identity!==expected)return;
          apply(session?.user?.id ? readAccessReceipt(session.user.id) : null);
        }
      }catch(error){
        if(!live||identity!==expected)return;
        const fallback=publishedAccess?.userId===identity ? publishedAccess : readAccessReceipt(identity);
        if(fallback)apply(fallback); // Do not discard the signed-in screen on timeout.
        else setState({access:null,loading:false,error:error?.message||'Account verification is temporarily unavailable.'});
        retryTimer=setTimeout(()=>refresh(true),Math.min(30000,2000*2**Math.min(retries++,4)));
      }
    };
    const update=(event)=>{
      if(!live)return;
      const next=event.detail;
      if(next?.userId===identity){retries=0;clearRetry();apply(next);}
    };
    window.addEventListener('brl:access-loaded',update);
    const onFocus=()=>refresh(false);
    const onVisibility=()=>{if(document.visibilityState==='visible')refresh(false);};
    const onRetry=()=>refresh(true);
    window.addEventListener('focus',onFocus);
    document.addEventListener('visibilitychange',onVisibility);
    window.addEventListener('brl:retry-access',onRetry);
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
      const userId=session?.user?.id||null;
      const changed=identity!==userId;
      identity=userId;
      if(event==='SIGNED_OUT'){
        clearRetry();
        if(live)setState({access:null,loading:false,error:''});
        return;
      }
      if(changed){
        clearRetry();
        const cached=readAccessReceipt(userId);
        if(live)setState({access:cached,loading:!!userId&&!cached,error:''});
        if(userId)retryTimer=setTimeout(()=>refresh(true),0);
      }
    });
    // The session is held securely by Supabase, not by our access receipt.
    // Rehydrate the visible dashboard immediately for that SAME authenticated user.
    supabase.auth.getSession().then(({data:{session},error})=>{
      if(!live)return;
      if(error)throw error;
      const userId=session?.user?.id||null;
      identity=userId;
      if(!userId){setState({access:null,loading:false,error:''});return;}
      const cached=readAccessReceipt(userId);
      if(cached)setState({access:cached,loading:false,error:''});
      else setState(previous=>previous.access?.userId===userId?previous:{access:null,loading:true,error:''});
      refresh(true);
    }).catch(error=>{
      if(live)setState({access:null,loading:false,error:error?.message||'Could not restore your BRL session.'});
    });
    return()=>{
      live=false;clearRetry();subscription.unsubscribe();
      window.removeEventListener('brl:access-loaded',update);
      window.removeEventListener('focus',onFocus);
      document.removeEventListener('visibilitychange',onVisibility);
      window.removeEventListener('brl:retry-access',onRetry);
    };
  },[]);
  return state;
}
