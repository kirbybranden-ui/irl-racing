import React, { useState } from "react";
import JoinRequestForm from "./JoinRequestForm";
import { loginToLeague } from "../../lib/leagueAuth";

export default function RoleLogin({ next = "/standings" }) {
  const [register, setRegister] = useState(false);
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <main style={{ maxWidth: 460, margin: "60px auto", padding: 24 }}><div style={{display:"flex",gap:12,marginBottom:20}}><button onClick={()=>setRegister(false)}>Login</button><button onClick={()=>setRegister(true)}>Register</button></div>{register ? <><h1>Join the League</h1><JoinRequestForm /></> : <><h1>Login</h1><form onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await loginToLeague({ driverNumber: number, password }); if (!result.success) throw new Error(result.error); window.location.href = next.startsWith("/") && !next.startsWith("//") ? next : "/standings"; }
    catch (failure) { setError(failure.message); } finally { setBusy(false); }
  }}><label>Driver number<input required inputMode="numeric" autoComplete="username" value={number} onChange={(event) => setNumber(event.target.value)} style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 20px" }} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ display: "block", width: "100%", padding: 12, margin: "8px 0 20px" }} /></label><button disabled={busy} type="submit">{busy ? "Signing in…" : "Login"}</button>{error && <p role="alert">{error}</p>}</form></>}</main>;
}
