import React,{useEffect,useRef,useState} from "react";
import {supabase} from "../../lib/supabase";
import {refreshLeagueAccess} from "../../lib/roleAccess";
import {logoutOfLeague} from "../../lib/leagueAuth";
import {agreementStatus,acceptAgreement,safeAgreementNext} from "../../lib/userAgreement";
import RoleLogin from "./RoleLogin";
import {createAgreementSession} from "../../lib/agreementSession";
import "../../styles/userAgreement.css";

export function AgreementDocument({status}) {
 const d=status.document;
 return <article className="brl-agreement-paper" aria-label="BRL User Agreement"><header><p className="brl-agreement-kicker">BUDWEISER RACING LEAGUE · ACCOUNT ACCESS</p><h1>{d.title}</h1><p>Version {status.version} · Adults 18 and older</p><p>{d.summary}</p></header><nav aria-label="Agreement contents"><h2>Contents</h2><ol>{d.sections.map((s,i)=><li key={s.title}><a href={`#agreement-section-${i}`}>{s.title}</a></li>)}</ol></nav>{d.sections.map((s,i)=><section id={`agreement-section-${i}`} key={s.title}><h2>{s.title}</h2>{s.paragraphs.map((p,n)=><p key={n}>{p}</p>)}</section>)}<footer><p>Document fingerprint: <code>{status.documentHash}</code></p><p>Keep a copy of the version you accept. Questions, permission requests and privacy concerns should go to league administration through your established league communication channel.</p></footer></article>;
}
export function AgreementAcceptanceForm({status,busy,error,onAccept,onDecline}) {
 const [gamertag,setGamertag]=useState(""),[adult,setAdult]=useState(false),[consent,setConsent]=useState(false);
 return <form className="brl-agreement-accept" onSubmit={e=>{e.preventDefault();onAccept({gamertag,adult,consent});}}><h2>Your acceptance is required</h2><p>You are accepting for <strong>{status.gamertag}</strong>. This applies to every league role you hold, including owner and administrator. Acceptance does not grant additional permissions or approve an application.</p><label><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)} required/>I confirm that I am at least 18 years old and can enter this agreement.</label><label><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required/>I have read and can retain version {status.version}. I accept its terms, including my role duties, app-protection rules, privacy notice and electronic-record provisions.</label><label className="brl-agreement-signature">Type your registered gamertag<input required autoComplete="off" maxLength={80} value={gamertag} onChange={e=>setGamertag(e.target.value)} placeholder={status.gamertag||"Your own gamertag"} aria-describedby="brl-gamertag-help"/></label><p id="brl-gamertag-help">Enter your gamertag in the box above. The example text is not a signature. Both checkboxes must be checked before you can agree.</p>{error&&<p role="alert">{error}</p>}<div className="brl-agreement-actions"><button disabled={busy||!adult||!consent||gamertag.trim().toLocaleLowerCase()!==status.gamertag?.trim().toLocaleLowerCase()}>{busy?"Recording acceptance…":"I agree · continue to the league"}</button><button type="button" disabled={busy} onClick={onDecline}>Decline and sign out</button></div><p>Declining keeps league access closed. Neither an administrator nor another member can accept on your behalf.</p></form>;
}
export default function UserAgreementGate({children}) {
 const [status,setStatus]=useState(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[archived,setArchived]=useState(null),[copyError,setCopyError]=useState("");
 const controller=useRef(null);
 const [showLoading,setShowLoading]=useState(false);
 const path=window.location.pathname.toLowerCase(),legal=["/user-agreement","/terms","/user-agreement/","/terms/"].includes(path),params=new URLSearchParams(window.location.search),copy=params.get("copy");
 const refresh=()=>controller.current?.refresh();
 useEffect(()=>{
  // A non-secret agreement receipt belongs in persistent device storage, not
  // sessionStorage (which disappears when an iOS app/browser is closed).
  let storage;
  try {
    storage=window.localStorage;
    const key='brl-agreement-receipt-v1';
    if (!storage.getItem(key)) {
      const previous=window.sessionStorage?.getItem(key);
      if (previous) storage.setItem(key,previous);
    }
  } catch {
    try { storage=window.sessionStorage; } catch { /* Storage disabled. */ }
  }
  const session=createAgreementSession({storage,legal,getSession:async()=>{const {data,error}=await supabase.auth.getSession();if(error)throw error;return data.session;},readStatus:agreementStatus,onChange:next=>{setStatus(next.status);setError(next.error);}});
  controller.current=session;session.start();
  let authTimer;
  const schedule=()=>{clearTimeout(authTimer);authTimer=setTimeout(()=>session.refresh(),0);};
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,current)=>{if(session.authChanged(event,current)){setArchived(null);schedule();}});
  let lastFocusCheck=Date.now();
  const onFocus=()=>{const now=Date.now();if(now-lastFocusCheck>=300000){lastFocusCheck=now;session.refresh();}};
  const onAccess=event=>{if(session.agreementChanged(event.detail))schedule();};
  const timer=setInterval(onFocus,300000);
  window.addEventListener("focus",onFocus);window.addEventListener("brl:access-loaded",onAccess);
  return()=>{session.stop();controller.current=null;clearTimeout(authTimer);subscription.unsubscribe();clearInterval(timer);window.removeEventListener("focus",onFocus);window.removeEventListener("brl:access-loaded",onAccess);};
 },[legal]);
 useEffect(()=>{if(status){setShowLoading(false);return;}const timer=setTimeout(()=>setShowLoading(true),200);return()=>clearTimeout(timer);},[Boolean(status)]);
 useEffect(()=>{let live=true;setCopyError("");if(!legal||!copy){setArchived(null);return;}supabase.rpc("brl_agreement_copy",{version_value:copy}).then(({data,error})=>{if(!live)return;if(error)setCopyError(error.message);else setArchived(data);}).catch(e=>{if(live)setCopyError(e.message);});return()=>{live=false;};},[legal,copy,status?.userId]);
 if(!status&&!error&&!showLoading)return <div className="brl-agreement-loading" aria-busy="true" aria-label="Loading account" style={{minHeight:120}}/>;
 if(!status)return <main className="brl-agreement-shell"><h1>BRL access agreement</h1>{error?<><p role="alert">{error}</p><p>Access remains closed until the current agreement can be verified.</p><button onClick={refresh}>Retry</button><a href="/login">Login</a></>:<p role="status">Loading your account…</p>}</main>;
 if(!status.userId&&!legal)return <div className="brl-agreement-shell"><p>Members must be 18 or older and accept the BRL User Agreement before league access.</p><a href="/user-agreement">Read the agreement before registering</a><RoleLogin next={safeAgreementNext(path+window.location.search)}/></div>;
 if(status.accepted&&!legal)return children;
 if(legal&&copy&&!archived)return <main className="brl-agreement-shell"><h1>Archived agreement copy</h1>{copyError?<p role="alert">{copyError}</p>:<p role="status">Loading the requested version…</p>}<a href="/user-agreement">View the current agreement</a></main>;
 const shown=archived||status;
 return <main className="brl-agreement-shell"><div className="brl-agreement-actions brl-agreement-tools"><a href="/user-agreement">Current agreement</a><button type="button" onClick={()=>window.print()}>Print / Save PDF</button>{status.accepted&&<a href={safeAgreementNext(params.get("next"))}>Return to the league</a>}</div>{copy&&<p className="brl-agreement-notice">Archived copy. It cannot be used to accept the current version. <a href="/user-agreement">Review the current agreement</a>.</p>}<AgreementDocument status={shown}/>{shown.acceptedAt&&<p className="brl-agreement-notice">Your account accepted this version on {new Date(shown.acceptedAt).toLocaleString()}.</p>}{!status.userId?<p className="brl-agreement-notice"><a href="/login">Log in or register</a> to accept for your own account.</p>:!status.accepted&&!copy?<AgreementAcceptanceForm key={`${status.userId}:${status.version}:${status.documentHash}`} status={status} error={error} busy={busy} onDecline={async()=>{setBusy(true);try{await logoutOfLeague();window.location.assign("/login");}catch(e){setError(e.message);setBusy(false);}}} onAccept={async values=>{setBusy(true);setError("");try{const receipt=await acceptAgreement(status,values);if(receipt.version!==status.version||receipt.documentHash!==status.documentHash||!controller.current?.recordAcceptance({...status,...receipt}))throw new Error("Your account or agreement changed. Please review the current version again.");await refreshLeagueAccess();window.location.assign(safeAgreementNext(legal?params.get("next"):path+window.location.search));}catch(e){const message=e.message;await refresh();setError(message);}finally{setBusy(false);}}}/>:status.accepted&&!copy?<p className="brl-agreement-notice">Your acceptance is recorded. <a href={safeAgreementNext(params.get("next"))}>Continue to the league</a>.</p>:null}{status.history?.length>0&&<section className="brl-agreement-history"><h2>Your recorded versions</h2>{status.history.map(h=><p key={h.version}><a href={`/user-agreement?copy=${encodeURIComponent(h.version)}`}>Version {h.version}</a> · {new Date(h.acceptedAt).toLocaleString()}</p>)}</section>}</main>;
}
