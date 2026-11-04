import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ROLE_LABELS, refreshLeagueAccess } from "../lib/roleAccess";

export default function RoleManagement({access}) {
  const [users, setUsers] = useState([]); const [status, setStatus] = useState(""); const [search, setSearch] = useState(""); const [busy, setBusy] = useState(false);
  const load = async () => { const { data, error } = await supabase.rpc("brl_list_accounts"); if (error) throw error; setUsers(data || []); };
  useEffect(() => { load().catch((error) => setStatus(error.message)); }, []);
  const save = async (user) => {
    setBusy(true); setStatus("");
    try { const { error } = await supabase.rpc("brl_set_roles", { target_driver_id: user.driver_id, new_roles: user.roles }); if (error) throw error; await load(); await refreshLeagueAccess(); setStatus(`${user.driver_name}: roles saved.`); }
    catch (error) { setStatus(error.message); } finally { setBusy(false); }
  };
  return <main style={{ maxWidth: 1000, margin: "32px auto", padding: 24 }}><a href="/admin">← Admin</a><h1>Roles & Permissions</h1><p>Assign the existing league roles here. Full Admin opens league administration; Race Recorder opens only race entry and submission. Owner grants team tools, not Admin Portal access. Super-admin authority remains separately configured and cannot be granted with this form.</p>{access?.isSuperAdmin&&<p><a href="/admin/appointments">Assign manufacturer staff ↗</a> — representatives receive manufacturer workspaces only; approval and payment stay with the super admin.</p>}<input aria-label="Find driver" placeholder="Find driver" value={search} onChange={(event) => setSearch(event.target.value)} style={{ padding: 12, width: "100%" }} />{status && <p role="status">{status}</p>}{users.filter((user) => `${user.driver_name} ${user.driver_number}`.toLowerCase().includes(search.toLowerCase())).map((user) => <section key={user.driver_id} style={{ borderBottom: "1px solid #bbb", padding: "20px 0", display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}><strong style={{ minWidth: 0 }}>#{user.driver_number} {user.driver_name}</strong>{Object.entries(ROLE_LABELS).map(([role, label]) => <label key={role}><input type="checkbox" checked={role === "driver" || (user.roles||[]).includes(role)} disabled={busy || role === "driver"} onChange={(event) => setUsers((current) => current.map((item) => item.driver_id === user.driver_id ? { ...item, roles: event.target.checked ? [...new Set([...(item.roles||[]), role])] : (item.roles||[]).filter((value) => value !== role) } : item))} /> {label}</label>)}<button disabled={busy} onClick={() => save(user)}>Save roles</button></section>)}</main>;
}
