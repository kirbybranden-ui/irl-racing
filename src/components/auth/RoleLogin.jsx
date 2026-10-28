import React, { useState } from "react";
import JoinRequestForm from "./JoinRequestForm";
import { loginToLeague } from "../../lib/leagueAuth";
import "../../styles/career.css";
export default function RoleLogin({ next = "/career" }) {
  const [register, setRegister] = useState(false), [legacy, setLegacy] = useState(false), [identity, setIdentity] = useState(""), [password, setPassword] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <main className="career-auth"><nav className="career-actions" aria-label="Account access"><button aria-pressed={!register} onClick={() => setRegister(false)}>Login</button><button aria-pressed={register} onClick={() => setRegister(true)}>Register</button></nav>
    {register ? <><h1>Join the league</h1><JoinRequestForm /></> : <><h1>League login</h1><form className="career-form" onSubmit={async event => { event.preventDefault();setBusy(true);setError("");try { const result = await loginToLeague({ gamertag: legacy ? undefined : identity.trim(), driverNumber: legacy ? identity.trim() : undefined, password });if (!result.success) throw new Error(result.error);const dest = result.session?.isDriver || result.session?.isAdmin ? next : "/career";window.location.assign(dest.startsWith("/") && !dest.startsWith("//") ? dest : "/career"); } catch (failure) { setError(failure.message); } finally { setBusy(false); } }}>
      <label>{legacy ? "Existing driver number" : "Gamertag"}<input required autoComplete="username" value={identity} onChange={e => setIdentity(e.target.value)} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label><button disabled={busy}>{busy ? "Signing in…" : "Login"}</button>{error && <p role="alert" className="career-error">{error}</p>}
    </form><button className="career-link-button" type="button" onClick={() => { setLegacy(v => !v);setIdentity(""); }}>{legacy ? "Use gamertag login" : "Use existing driver-number login"}</button><p><a href="/">View league home</a></p></>}
  </main>;
}
