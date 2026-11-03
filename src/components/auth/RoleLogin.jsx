import React, {useEffect,useState} from "react";
import JoinRequestForm from "./JoinRequestForm";
import {loginToLeague} from "../../lib/leagueAuth";
import {passwordAction,savedPasswordTicket,storePasswordTicket,forgetPasswordTicket} from "../../lib/passwordRecovery";
import "../../styles/career.css";
export default function RoleLogin({next="/career"}) {
 const [register,setRegister]=useState(false),[legacy,setLegacy]=useState(false),[identity,setIdentity]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState(""),[mode,setMode]=useState("password"),[ticket,setTicket]=useState(null),[ticketStatus,setTicketStatus]=useState(""),[busy,setBusy]=useState(false),[checking,setChecking]=useState(false),[error,setError]=useState(""),[status,setStatus]=useState("");
 useEffect(()=>{
  if(legacy||register||identity.trim().length<3){setMode("password");setTicket(null);setTicketStatus("");return;}
  let live=true;setChecking(true);setPassword("");setConfirm("");setTicketStatus("");const saved=savedPasswordTicket(identity);setTicket(saved);
  const timer=setTimeout(()=>passwordAction({action:"identify",gamertag:identity}).then(async d=>{if(!live)return;setMode(d.mode);if(saved){const state=await passwordAction({action:"status",...saved});if(live)setTicketStatus(state.status);}}).catch(e=>{if(live)setError(e.message);}).finally(()=>{if(live)setChecking(false);}),700);
  return()=>{live=false;clearTimeout(timer);};
 },[identity,legacy,register]);
 async function check(){setBusy(true);setError("");try{const d=await passwordAction({action:"status",...ticket});setTicketStatus(d.status);const info=await passwordAction({action:"identify",gamertag:identity});setMode(info.mode);}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function request(){setBusy(true);setError("");try{if(ticket&&!['expired','rejected','completed'].includes(ticketStatus)){await check();return;}const d=await passwordAction({action:"request",gamertag:identity});setTicket(storePasswordTicket(identity,d));setTicketStatus("pending");setStatus(d.message);}catch(e){setError(e.message);}finally{setBusy(false);}}
 const setup=mode==="setup"&&ticket&&['approved','completing'].includes(ticketStatus);
 const waiting=ticket&&['pending','revoking','waiting_for_acceptance'].includes(ticketStatus);
 return <main className="career-auth"><nav className="career-actions" aria-label="Account access"><button aria-pressed={!register} onClick={()=>setRegister(false)}>Login</button><button aria-pressed={register} onClick={()=>setRegister(true)}>Register</button></nav>
 {register?<><h1>Join the league</h1><JoinRequestForm/></>:<><h1>League login</h1><form className="career-form" onSubmit={async e=>{e.preventDefault();if(checking||mode==="pending"||(mode==="setup"&&!setup))return;setBusy(true);setError("");setStatus("");try{
  if(setup){if(password!==confirm)throw Error("Passwords do not match.");const done=await passwordAction({action:"complete",...ticket,password});forgetPasswordTicket(identity);setTicket(null);setTicketStatus("");setMode("password");setPassword("");setConfirm("");setStatus(done.message);return;}
  const result=await loginToLeague({gamertag:legacy?undefined:identity.trim(),driverNumber:legacy?identity.trim():undefined,password});if(!result.success)throw Error(result.error);const dest=result.session?.agreementRequired?`/user-agreement?next=${encodeURIComponent(next)}`:result.session?.isDriver||result.session?.isAdmin?next:"/career";window.location.assign(dest.startsWith("/")&&!dest.startsWith("//")?dest:"/career");
 }catch(e){setError(e.message);}finally{setBusy(false);}}}>
 <label>{legacy?"Existing driver number":"Gamertag"}<input required autoComplete="username" value={identity} onChange={e=>{setIdentity(e.target.value);setError("");setStatus("");}}/></label>
 {checking?<p role="status">Checking gamertag…</p>:setup?<><h2>Set up a password</h2><p>Your account is accepted and this browser is authorized. Choose your own password.</p><label>New password<input required minLength={12} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><label>Confirm new password<input required type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label><button disabled={busy}>Set up a password</button></>:mode==="pending"?<p>Your application is awaiting approval. After acceptance, return here on the same browser to set up your password.</p>:mode==="setup"?<><h2>Set up a password</h2><p>{waiting?"Waiting for admin approval. Confirm the request with your admin through your usual league channel.":"Use the browser where you registered or requested the reset. If it is unavailable, request admin verification below."}</p></>:<><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy||identity.trim().length<1}>{busy?"Signing in…":"Login"}</button></>}
 </form>
 {!legacy&&!setup&&identity.trim().length>=3&&<><button className="career-link-button" type="button" disabled={busy||checking} onClick={request}>{mode==="setup"?"Request admin approval for password setup":"Forgot your password?"}</button>{ticket&&<><p>Request status: {ticketStatus||"checking"}. {['approved','completing'].includes(ticketStatus)&&"Approved requests expire after 30 minutes."}</p><button type="button" disabled={busy} onClick={check}>Check admin approval</button></>}</>}
 {error&&<p role="alert" className="career-error">{error}</p>}{status&&<p role="status">{status}</p>}
 <button className="career-link-button" type="button" onClick={()=>{setLegacy(v=>!v);setIdentity("");}}>{legacy?"Use gamertag login":"Use existing driver-number login"}</button><p><a href="/user-agreement">User Agreement · adults 18 and older</a></p></>}
 </main>;
}
