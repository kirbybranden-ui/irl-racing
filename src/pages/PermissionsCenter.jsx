
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase as appSupabase } from "../lib/supabase";

const TABS = ["Users", "Roles", "Permission Matrix", "Audit Log"];

const PERMISSION_GROUPS = [
  {
    key: "system",
    label: "System",
    permissions: [
      ["admin.access", "Access Admin Portal"],
      ["permissions.manage", "Manage Roles & Permissions"],
      ["settings.manage", "Manage League Settings"],
      ["backups.manage", "Manage Backups"],
      ["seasons.manage", "Manage Seasons"],
      ["series.manage", "Manage Series"],
    ],
  },
  {
    key: "executive",
    label: "Executive",
    permissions: [
      ["executive.dashboard", "View Executive Dashboard"],
      ["executive.override", "Use Executive Override"],
      ["executive.staff", "Manage Executive Staff"],
      ["league.rules", "Manage League Rules"],
      ["league.teams", "Manage All Teams"],
      ["league.drivers", "Manage All Drivers"],
    ],
  },
  {
    key: "race",
    label: "Race Operations",
    permissions: [
      ["race.view", "View Race Operations"],
      ["race.schedule", "Manage Schedule & Tracks"],
      ["race.entries", "Manage Race Entries"],
      ["race.results", "Post & Edit Results"],
      ["race.stage_points", "Manage Stage Points"],
      ["race.penalties", "Manage Penalties"],
      ["race.start_park", "Manage Start & Park"],
      ["race.playoffs", "Manage Playoffs"],
      ["race.bracket", "Manage In-Season Bracket"],
      ["race.export", "Export Race Data"],
    ],
  },
  {
    key: "team",
    label: "Team Owner",
    permissions: [
      ["team.portal", "Access Team HQ"],
      ["team.roster", "Manage Team Roster"],
      ["team.contracts", "Manage Team Contracts"],
      ["team.finances", "View Team Finances"],
      ["team.transactions", "Submit Team Transactions"],
      ["team.loans", "Request Team Loans"],
      ["team.alliances", "Manage Technical Alliances"],
      ["team.paint", "Manage Team Paint Schemes"],
      ["team.interviews", "Manage Team Interviews"],
      ["team.tasks", "Manage Team Tasks"],
    ],
  },
  {
    key: "driver",
    label: "Driver",
    permissions: [
      ["driver.portal", "Access Driver Portal"],
      ["driver.profile", "Edit Driver Profile"],
      ["driver.contract", "View Driver Contract"],
      ["driver.interviews", "Submit Interviews"],
      ["driver.paint", "Submit Paint Schemes"],
      ["driver.start_park", "Request Start & Park"],
      ["driver.appeals", "Submit Appeals"],
      ["driver.recruiting", "Use Recruiting Portal"],
      ["driver.vote", "Vote in League Polls"],
      ["driver.chat", "Use League Chat"],
    ],
  },
  {
    key: "finance",
    label: "Finance",
    permissions: [
      ["finance.view", "View League Finances"],
      ["finance.budgets", "Manage Team Budgets"],
      ["finance.transactions", "Manage Transactions"],
      ["finance.loans", "Approve Loans"],
      ["finance.fines", "Manage Fines"],
      ["finance.payouts", "Process Payouts"],
      ["finance.contracts", "Review Contracts"],
      ["finance.reports", "Export Financial Reports"],
    ],
  },
  {
    key: "hr",
    label: "Human Resources",
    permissions: [
      ["hr.view", "View HR Records"],
      ["drivers.manage", "Manage Drivers"],
      ["owners.manage", "Manage Owners"],
      ["contracts.manage", "Manage Contracts"],
      ["appeals.manage", "Manage Appeals"],
      ["access_codes.manage", "Manage Access Codes"],
      ["join_requests.manage", "Manage Join Requests"],
      ["substitutes.manage", "Manage Substitute Drivers"],
    ],
  },
  {
    key: "pr",
    label: "Public Relations",
    permissions: [
      ["pr.view", "View PR Tools"],
      ["pr.news", "Manage News"],
      ["pr.ticker", "Manage Ticker"],
      ["pr.interviews", "Manage Interviews"],
      ["pr.paint_votes", "Manage Paint Voting"],
      ["pr.media", "Manage Featured Media"],
      ["pr.winner", "Manage Previous Race Winner"],
      ["pr.notifications", "Manage Notifications"],
    ],
  },
  {
    key: "communications",
    label: "Communications",
    permissions: [
      ["messages.send", "Send League Messages"],
      ["messages.manage", "Manage Messages"],
      ["chat.moderate", "Moderate Chat"],
      ["chat.rooms", "Manage Chat Rooms"],
    ],
  },
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap((group) =>
  group.permissions.map(([key, label]) => ({ key, label, group: group.label }))
);

const BUILT_IN_ROLES = [
  {
    key: "ceo",
    name: "CEO",
    description: "Full league authority and complete system access.",
    permissions: ALL_PERMISSIONS.map((item) => item.key),
  },
  {
    key: "coo",
    name: "COO",
    description: "League operations, race operations, teams, and drivers.",
    permissions: [
      "admin.access", "executive.dashboard", "league.rules", "league.teams", "league.drivers",
      "race.view", "race.schedule", "race.entries", "race.results", "race.stage_points",
      "race.penalties", "race.start_park", "race.playoffs", "race.bracket", "race.export",
      "hr.view", "drivers.manage", "owners.manage", "contracts.manage", "appeals.manage",
      "join_requests.manage", "substitutes.manage", "messages.send", "messages.manage",
    ],
  },
  {
    key: "cfo",
    name: "CFO",
    description: "League finances, contracts, payouts, loans, and financial reporting.",
    permissions: [
      "admin.access", "executive.dashboard", "finance.view", "finance.budgets",
      "finance.transactions", "finance.loans", "finance.fines", "finance.payouts",
      "finance.contracts", "finance.reports", "contracts.manage", "messages.send",
    ],
  },
  {
    key: "race_director",
    name: "Race Director",
    description: "Race control, results, penalties, and race administration.",
    permissions: [
      "admin.access", "race.view", "race.schedule", "race.entries", "race.results",
      "race.stage_points", "race.penalties", "race.start_park", "race.playoffs",
      "race.bracket", "race.export", "messages.send",
    ],
  },
  {
    key: "team_owner",
    name: "Team Owner",
    description: "Manages only the team or teams assigned to the user.",
    permissions: [
      "team.portal", "team.roster", "team.contracts", "team.finances",
      "team.transactions", "team.loans", "team.alliances", "team.paint",
      "team.interviews", "team.tasks", "messages.send", "driver.chat",
    ],
  },
  {
    key: "driver",
    name: "Driver",
    description: "Standard driver portal access and driver actions.",
    permissions: [
      "driver.portal", "driver.profile", "driver.contract", "driver.interviews",
      "driver.paint", "driver.start_park", "driver.appeals", "driver.recruiting",
      "driver.vote", "driver.chat",
    ],
  },
  {
    key: "pr_director",
    name: "PR Director",
    description: "News, ticker, interviews, voting, media, and notifications.",
    permissions: [
      "admin.access", "pr.view", "pr.news", "pr.ticker", "pr.interviews",
      "pr.paint_votes", "pr.media", "pr.winner", "pr.notifications",
      "messages.send", "messages.manage",
    ],
  },
  {
    key: "hr_manager",
    name: "HR Manager",
    description: "Drivers, owners, contracts, appeals, access codes, and recruiting.",
    permissions: [
      "admin.access", "hr.view", "drivers.manage", "owners.manage", "contracts.manage",
      "appeals.manage", "access_codes.manage", "join_requests.manage",
      "substitutes.manage", "messages.send",
    ],
  },
  {
    key: "finance_manager",
    name: "Finance Manager",
    description: "Budgets, transactions, loans, fines, payouts, and reports.",
    permissions: [
      "admin.access", "finance.view", "finance.budgets", "finance.transactions",
      "finance.loans", "finance.fines", "finance.payouts", "finance.contracts",
      "finance.reports", "messages.send",
    ],
  },
];

const SERIES = [
  ["cup", "NCS / Cup"],
  ["xfinity", "NXS / Xfinity"],
  ["trucks", "CTS / Trucks"],
  ["arca", "AMS / ARCA"],
];

function normalizeUser(row) {
  return {
    id: row.id,
    displayName: row.display_name || row.name || row.username || "Unnamed User",
    username: row.username || row.login_name || "",
    email: row.email || "",
    team: row.team || "",
    driverId: row.driver_id || null,
    active: row.active !== false,
  };
}

function avatarText(value) {
  return String(value || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function PermissionsCenter({
  supabase: providedSupabase = null,
  drivers = [],
  teams = [],
  currentSession = null,
}) {
  const supabase = providedSupabase || appSupabase;
  // Keep the initial driver fallback stable. App.jsx refreshes league state periodically,
  // which can create a new drivers array even when its contents have not changed.
  // Using that array as an effect dependency caused this page to enter its full-screen
  // loading state repeatedly, which looked like a five-second blink.
  const initialDriversRef = useRef(drivers);
  const [activeTab, setActiveTab] = useState("Users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState(BUILT_IN_ROLES);
  const [selectedRoleKey, setSelectedRoleKey] = useState("");
  const [roleForm, setRoleForm] = useState({ name: "", key: "", description: "", permissions: [] });
  const [roleSaving, setRoleSaving] = useState(false);
  const [matrixDirty, setMatrixDirty] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [search, setSearch] = useState("");
  const [roleKeys, setRoleKeys] = useState([]);
  const [permissionOverrides, setPermissionOverrides] = useState({});
  const [seriesScopes, setSeriesScopes] = useState([]);
  const [teamScopes, setTeamScopes] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedUser = useMemo(
    () => users.find((user) => String(user.id) === String(selectedUserId)) || null,
    [users, selectedUserId]
  );

  const selectedRole = useMemo(
    () => roles.find((role) => role.key === selectedRoleKey) || null,
    [roles, selectedRoleKey]
  );

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.displayName, user.username, user.email, user.team]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [users, search]);

  const rolePermissionSet = useMemo(() => {
    const set = new Set();
    roleKeys.forEach((key) => {
      const role = roles.find((item) => item.key === key);
      (role?.permissions || []).forEach((permission) => set.add(permission));
    });
    return set;
  }, [roleKeys, roles]);

  function permissionAllowed(key) {
    if (permissionOverrides[key] === true) return true;
    if (permissionOverrides[key] === false) return false;
    return rolePermissionSet.has(key);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [userResult, roleResult, auditResult] = await Promise.all([
          supabase.from("app_users").select("*").order("display_name"),
          supabase.from("permission_roles").select("*").order("name"),
          supabase
            .from("permission_audit_log")
            .select("*, target:target_user_id(display_name), actor:actor_user_id(display_name)")
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

        if (userResult.error) throw userResult.error;

        let loadedUsers = (userResult.data || []).map(normalizeUser);

        const fallbackDrivers = initialDriversRef.current || [];
        if (!loadedUsers.length && fallbackDrivers.length) {
          loadedUsers = fallbackDrivers.map((driver) =>
            normalizeUser({
              id: `driver-${driver.id}`,
              display_name: driver.name,
              username: driver.name,
              driver_id: driver.id,
              team: driver.team,
              active: !driver.retired,
            })
          );
        }

        let loadedRoles = BUILT_IN_ROLES;

        if (!roleResult.error && roleResult.data?.length) {
          loadedRoles = await Promise.all(
            roleResult.data.map(async (role) => {
              const { data: permissions } = await supabase
                .from("role_permissions")
                .select("permission_key")
                .eq("role_id", role.id);

              const loadedPermissionKeys = (permissions || []).map((row) => row.permission_key);
              return {
                ...role,
                permissions: loadedPermissionKeys.includes("*")
                  ? ALL_PERMISSIONS.map((item) => item.key)
                  : loadedPermissionKeys,
              };
            })
          );
        }

        if (!active) return;
        setUsers(loadedUsers);
        setRoles(loadedRoles);
        setAuditRows(auditResult.data || []);
        setSelectedRoleKey((current) => current || loadedRoles[0]?.key || "");
        setSelectedUserId((current) => current || String(loadedUsers[0]?.id || ""));
      } catch (loadError) {
        console.error(loadError);
        if (active) setError(loadError.message || "Unable to load permissions center.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!selectedUserId || String(selectedUserId).startsWith("driver-")) {
      setRoleKeys([]);
      setPermissionOverrides({});
      setSeriesScopes([]);
      setTeamScopes([]);
      return;
    }

    let active = true;

    async function loadUserAccess() {
      setError("");
      setMessage("");

      const [rolesResult, overridesResult, scopesResult] = await Promise.all([
        supabase
          .from("user_roles")
          .select("permission_roles(key)")
          .eq("user_id", selectedUserId),
        supabase
          .from("user_permission_overrides")
          .select("permission_key, allowed")
          .eq("user_id", selectedUserId),
        supabase
          .from("user_access_scopes")
          .select("scope_type, scope_value")
          .eq("user_id", selectedUserId),
      ]);

      if (!active) return;

      const loadError = rolesResult.error || overridesResult.error || scopesResult.error;
      if (loadError) {
        setError(loadError.message || "Unable to load assigned access.");
        return;
      }

      setRoleKeys(
        (rolesResult.data || [])
          .map((row) => row.permission_roles?.key)
          .filter(Boolean)
      );

      setPermissionOverrides(
        Object.fromEntries(
          (overridesResult.data || []).map((row) => [
            row.permission_key,
            Boolean(row.allowed),
          ])
        )
      );

      setSeriesScopes(
        (scopesResult.data || [])
          .filter((row) => row.scope_type === "series")
          .map((row) => row.scope_value)
      );

      setTeamScopes(
        (scopesResult.data || [])
          .filter((row) => row.scope_type === "team")
          .map((row) => row.scope_value)
      );
    }

    loadUserAccess();
    return () => {
      active = false;
    };
  }, [selectedUserId, supabase]);

  useEffect(() => {
    if (!selectedRole) return;
    setRoleForm({
      name: selectedRole.name || "",
      key: selectedRole.key || "",
      description: selectedRole.description || "",
      permissions: [...(selectedRole.permissions || [])],
    });
  }, [selectedRole]);

  function makeRoleKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function startNewRole() {
    setSelectedRoleKey("");
    setRoleForm({ name: "", key: "", description: "", permissions: [] });
    setMessage("");
    setError("");
  }

  function toggleRoleFormPermission(permissionKey) {
    setRoleForm((current) => ({
      ...current,
      permissions: current.permissions.includes(permissionKey)
        ? current.permissions.filter((key) => key !== permissionKey)
        : [...current.permissions, permissionKey],
    }));
  }

  async function saveRoleDefinition() {
    const name = roleForm.name.trim();
    const key = makeRoleKey(roleForm.key || name);
    if (!name || !key) {
      setError("Enter a role name and role key.");
      return;
    }

    setRoleSaving(true);
    setError("");
    setMessage("");
    try {
      let roleId = selectedRole?.id || null;
      if (roleId) {
        const { error: updateError } = await supabase
          .from("permission_roles")
          .update({ name, key, description: roleForm.description.trim() })
          .eq("id", roleId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("permission_roles")
          .insert({ name, key, description: roleForm.description.trim(), protected: false })
          .select("*")
          .single();
        if (insertError) throw insertError;
        roleId = data.id;
      }

      const { error: deleteError } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId);
      if (deleteError) throw deleteError;

      if (roleForm.permissions.length) {
        const { error: insertPermissionsError } = await supabase
          .from("role_permissions")
          .insert(roleForm.permissions.map((permissionKey) => ({
            role_id: roleId,
            permission_key: permissionKey,
          })));
        if (insertPermissionsError) throw insertPermissionsError;
      }

      const savedRole = {
        ...(selectedRole || {}),
        id: roleId,
        key,
        name,
        description: roleForm.description.trim(),
        permissions: [...roleForm.permissions],
      };
      setRoles((current) => {
        const exists = current.some((role) => role.id === roleId);
        return exists
          ? current.map((role) => (role.id === roleId ? savedRole : role))
          : [...current, savedRole].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedRoleKey(key);
      setMessage(`Role ${name} saved.`);

      await supabase.from("permission_audit_log").insert({
        actor_user_id: currentSession?.userId || currentSession?.id || null,
        action: selectedRole ? "role_updated" : "role_created",
        details: { role_id: roleId, role_key: key, role_name: name, permissions: roleForm.permissions },
      });
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Unable to save role.");
    } finally {
      setRoleSaving(false);
    }
  }

  async function deleteSelectedRole() {
    if (!selectedRole?.id) return;
    if (selectedRole.protected) {
      setError("This built-in role is protected. You can edit its permissions, but it cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete the ${selectedRole.name} role? Users assigned to it will lose that role.`)) return;

    setRoleSaving(true);
    setError("");
    try {
      const { error: deleteError } = await supabase
        .from("permission_roles")
        .delete()
        .eq("id", selectedRole.id);
      if (deleteError) throw deleteError;
      setRoles((current) => current.filter((role) => role.id !== selectedRole.id));
      setSelectedRoleKey("");
      setRoleForm({ name: "", key: "", description: "", permissions: [] });
      setMessage(`Role ${selectedRole.name} deleted.`);
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete role.");
    } finally {
      setRoleSaving(false);
    }
  }

  function toggleMatrixPermission(roleKey, permissionKey) {
    setRoles((current) => current.map((role) => {
      if (role.key !== roleKey) return role;
      const permissions = role.permissions || [];
      return {
        ...role,
        permissions: permissions.includes(permissionKey)
          ? permissions.filter((key) => key !== permissionKey)
          : [...permissions, permissionKey],
      };
    }));
    setMatrixDirty(true);
  }

  async function savePermissionMatrix() {
    setRoleSaving(true);
    setError("");
    setMessage("");
    try {
      for (const role of roles) {
        if (!role.id) continue;
        const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", role.id);
        if (deleteError) throw deleteError;
        if ((role.permissions || []).length) {
          const { error: insertError } = await supabase.from("role_permissions").insert(
            role.permissions.map((permissionKey) => ({ role_id: role.id, permission_key: permissionKey }))
          );
          if (insertError) throw insertError;
        }
      }
      setMatrixDirty(false);
      setMessage("Permission matrix saved.");
    } catch (matrixError) {
      setError(matrixError.message || "Unable to save permission matrix.");
    } finally {
      setRoleSaving(false);
    }
  }

  function toggleRole(key) {
    setRoleKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  function cyclePermission(key) {
    setPermissionOverrides((current) => {
      const next = { ...current };
      if (!(key in next)) next[key] = true;
      else if (next[key] === true) next[key] = false;
      else delete next[key];
      return next;
    });
  }

  function toggleScope(value, setter) {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  }

  async function saveUserAccess() {
    if (!selectedUser) return;

    if (String(selectedUser.id).startsWith("driver-")) {
      setError("Create this person in app_users before assigning permissions.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const selectedRoles = roles.filter((role) => roleKeys.includes(role.key));

      const deleteResults = await Promise.all([
        supabase.from("user_roles").delete().eq("user_id", selectedUser.id),
        supabase.from("user_permission_overrides").delete().eq("user_id", selectedUser.id),
        supabase.from("user_access_scopes").delete().eq("user_id", selectedUser.id),
      ]);

      const deletionError = deleteResults.find((result) => result.error)?.error;
      if (deletionError) throw deletionError;

      if (selectedRoles.length) {
        const { error: roleInsertError } = await supabase.from("user_roles").insert(
          selectedRoles.map((role) => ({
            user_id: selectedUser.id,
            role_id: role.id,
            assigned_by: currentSession?.userId || currentSession?.id || null,
          }))
        );
        if (roleInsertError) throw roleInsertError;
      }

      const overrides = Object.entries(permissionOverrides);
      if (overrides.length) {
        const { error: overrideInsertError } = await supabase
          .from("user_permission_overrides")
          .insert(
            overrides.map(([permissionKey, allowed]) => ({
              user_id: selectedUser.id,
              permission_key: permissionKey,
              allowed,
              assigned_by: currentSession?.userId || currentSession?.id || null,
            }))
          );
        if (overrideInsertError) throw overrideInsertError;
      }

      const scopes = [
        ...seriesScopes.map((scopeValue) => ({
          user_id: selectedUser.id,
          scope_type: "series",
          scope_value: scopeValue,
          assigned_by: currentSession?.userId || currentSession?.id || null,
        })),
        ...teamScopes.map((scopeValue) => ({
          user_id: selectedUser.id,
          scope_type: "team",
          scope_value: scopeValue,
          assigned_by: currentSession?.userId || currentSession?.id || null,
        })),
      ];

      if (scopes.length) {
        const { error: scopeInsertError } = await supabase
          .from("user_access_scopes")
          .insert(scopes);
        if (scopeInsertError) throw scopeInsertError;
      }

      const { error: auditError } = await supabase.from("permission_audit_log").insert({
        target_user_id: selectedUser.id,
        actor_user_id: currentSession?.userId || currentSession?.id || null,
        action: "user_access_updated",
        details: {
          roles: roleKeys,
          permission_overrides: permissionOverrides,
          series_scopes: seriesScopes,
          team_scopes: teamScopes,
        },
      });

      if (auditError) console.warn("Audit log insert failed:", auditError);

      setMessage(`Access updated for ${selectedUser.displayName}.`);
    } catch (saveError) {
      console.error(saveError);
      setError(saveError.message || "Unable to save user access.");
    } finally {
      setSaving(false);
    }
  }

  const card = {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(17,24,39,0.07)",
    borderRadius: 24,
    boxShadow: "0 20px 60px rgba(15,23,42,0.09)",
  };

  const pill = (active) => ({
    border: active ? "1px solid rgba(0,122,255,0.4)" : "1px solid rgba(17,24,39,0.08)",
    background: active ? "rgba(0,122,255,0.1)" : "#fff",
    color: "#111827",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", padding: 24, background: "#f5f5f7" }}>
        <div style={{ ...card, maxWidth: 1200, margin: "0 auto", padding: 30 }}>
          Loading Identity & Access Management…
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 10% 0%, rgba(0,122,255,0.14), transparent 28%), radial-gradient(circle at 90% 0%, rgba(88,86,214,0.13), transparent 28%), #f5f5f7",
        color: "#1d1d1f",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "20px 14px 56px" }}>
        <header style={{ ...card, padding: 24, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#5856d6", fontWeight: 950, letterSpacing: 1.5, fontSize: 12 }}>
                BRL IDENTITY & ACCESS MANAGEMENT
              </div>
              <h1 style={{ margin: "7px 0 4px", fontSize: "clamp(30px,5vw,48px)", letterSpacing: -1.4 }}>
                Permissions Center
              </h1>
              <div style={{ color: "#6e6e73", fontWeight: 700 }}>
                Manage executives, race officials, team owners, drivers, staff, series access, and team access.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.pathname = "/admin";
              }}
              style={pill(false)}
            >
              ← Admin Portal
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={pill(activeTab === tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        {(error || message) && (
          <div
            style={{
              ...card,
              padding: 15,
              marginBottom: 18,
              color: error ? "#b91c1c" : "#15803d",
              fontWeight: 850,
            }}
          >
            {error || message}
          </div>
        )}

        {activeTab === "Users" && (
          <div className="iam-grid" style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 18 }}>
            <aside style={{ ...card, padding: 15, alignSelf: "start", position: "sticky", top: 12 }}>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: 13,
                  borderRadius: 15,
                  border: "1px solid rgba(17,24,39,0.09)",
                  background: "#f5f5f7",
                  fontSize: 15,
                }}
              />

              <div style={{ display: "grid", gap: 8, marginTop: 12, maxHeight: "75vh", overflowY: "auto" }}>
                {filteredUsers.map((user) => {
                  const selected = String(user.id) === String(selectedUserId);
                  return (
                    <button
                      type="button"
                      key={user.id}
                      onClick={() => setSelectedUserId(String(user.id))}
                      style={{
                        border: selected ? "1px solid rgba(0,122,255,0.35)" : "1px solid rgba(17,24,39,0.07)",
                        background: selected ? "rgba(0,122,255,0.1)" : "#fff",
                        borderRadius: 17,
                        padding: 11,
                        display: "grid",
                        gridTemplateColumns: "42px 1fr",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: selected ? "#007aff" : "#e5e7eb", color: selected ? "#fff" : "#374151", fontWeight: 950 }}>
                        {avatarText(user.displayName)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {user.displayName}
                        </div>
                        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 3 }}>
                          {[user.team, user.username].filter(Boolean).join(" • ") || "League user"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main style={{ display: "grid", gap: 18 }}>
              {!selectedUser ? (
                <section style={{ ...card, padding: 28 }}>Select a user.</section>
              ) : (
                <>
                  <section style={{ ...card, padding: 22 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 60, height: 60, borderRadius: 20, display: "grid", placeItems: "center", background: "linear-gradient(135deg,#007aff,#5856d6)", color: "#fff", fontSize: 20, fontWeight: 950 }}>
                        {avatarText(selectedUser.displayName)}
                      </div>
                      <div>
                        <div style={{ fontSize: 25, fontWeight: 950 }}>{selectedUser.displayName}</div>
                        <div style={{ color: "#6e6e73", marginTop: 4 }}>
                          {[selectedUser.team, selectedUser.email || selectedUser.username].filter(Boolean).join(" • ") || "League user"}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section style={{ ...card, padding: 22 }}>
                    <div style={{ fontSize: 20, fontWeight: 950 }}>Assigned roles</div>
                    <div style={{ color: "#6e6e73", marginTop: 5 }}>
                      A user may have multiple roles, such as CEO, Team Owner, and Driver.
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 11, marginTop: 15 }}>
                      {roles.map((role) => {
                        const selected = roleKeys.includes(role.key);
                        return (
                          <button
                            key={role.id || role.key}
                            type="button"
                            onClick={() => toggleRole(role.key)}
                            style={{
                              border: selected ? "1px solid rgba(0,122,255,0.4)" : "1px solid rgba(17,24,39,0.08)",
                              background: selected ? "rgba(0,122,255,0.1)" : "#fff",
                              borderRadius: 18,
                              padding: 14,
                              cursor: "pointer",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                              <strong>{role.name}</strong>
                              <span>{selected ? "✓" : ""}</span>
                            </div>
                            <div style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.4, marginTop: 7 }}>
                              {role.description}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <section style={{ ...card, padding: 22 }}>
                    <div style={{ fontSize: 20, fontWeight: 950 }}>Series access</div>
                    <div style={{ color: "#6e6e73", marginTop: 5 }}>
                      Restrict race officials or staff to specific series. Leave empty for all assigned-role access.
                    </div>
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
                      {SERIES.map(([key, label]) => (
                        <button
                          type="button"
                          key={key}
                          onClick={() => toggleScope(key, setSeriesScopes)}
                          style={pill(seriesScopes.includes(key))}
                        >
                          {seriesScopes.includes(key) ? "✓ " : ""}{label}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section style={{ ...card, padding: 22 }}>
                    <div style={{ fontSize: 20, fontWeight: 950 }}>Team access</div>
                    <div style={{ color: "#6e6e73", marginTop: 5 }}>
                      Team owners and team staff can only manage assigned organizations.
                    </div>
                    <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
                      {(teams || []).map((team) => {
                        const value = String(team.id || team.code || team.name);
                        const label = team.name || team.code || value;
                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() => toggleScope(value, setTeamScopes)}
                            style={pill(teamScopes.includes(value))}
                          >
                            {teamScopes.includes(value) ? "✓ " : ""}{label}
                          </button>
                        );
                      })}
                      {!teams?.length && (
                        <div style={{ color: "#6e6e73" }}>
                          Pass your teams array into PermissionsCenter to assign team scopes.
                        </div>
                      )}
                    </div>
                  </section>

                  {PERMISSION_GROUPS.map((group) => (
                    <section key={group.key} style={{ ...card, padding: 22 }}>
                      <div style={{ fontSize: 20, fontWeight: 950 }}>{group.label}</div>
                      <div style={{ display: "grid", gap: 9, marginTop: 13 }}>
                        {group.permissions.map(([key, label]) => {
                          const inherited = rolePermissionSet.has(key);
                          const overridden = key in permissionOverrides;
                          const allowed = permissionAllowed(key);
                          const state = overridden
                            ? permissionOverrides[key]
                              ? "Explicitly allowed"
                              : "Explicitly denied"
                            : inherited
                              ? "Allowed by role"
                              : "Not allowed";

                          return (
                            <button
                              type="button"
                              key={key}
                              onClick={() => cyclePermission(key)}
                              style={{
                                border: "1px solid rgba(17,24,39,0.08)",
                                background: "#fff",
                                borderRadius: 17,
                                padding: 14,
                                display: "grid",
                                gridTemplateColumns: "1fr auto",
                                alignItems: "center",
                                gap: 14,
                                cursor: "pointer",
                                textAlign: "left",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 900 }}>{label}</div>
                                <div style={{ marginTop: 5, color: overridden ? (allowed ? "#15803d" : "#b91c1c") : "#6b7280", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.6 }}>
                                  {state}
                                </div>
                              </div>
                              <div style={{ width: 48, height: 30, borderRadius: 999, padding: 3, background: allowed ? "#34c759" : "#d1d5db", display: "flex", justifyContent: allowed ? "flex-end" : "flex-start", boxSizing: "border-box" }}>
                                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 7px rgba(0,0,0,0.2)" }} />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))}

                  <section style={{ ...card, padding: 17, position: "sticky", bottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ color: "#6e6e73", fontSize: 13 }}>
                      Permissions cycle through inherited, explicitly allowed, and explicitly denied.
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={saveUserAccess}
                      style={{
                        border: 0,
                        borderRadius: 999,
                        padding: "13px 20px",
                        color: "#fff",
                        background: saving ? "#9ca3af" : "linear-gradient(135deg,#007aff,#5856d6)",
                        fontWeight: 950,
                        cursor: saving ? "wait" : "pointer",
                      }}
                    >
                      {saving ? "Saving…" : "Save Access"}
                    </button>
                  </section>
                </>
              )}
            </main>
          </div>
        )}

        {activeTab === "Roles" && (
          <div className="iam-grid" style={{ display: "grid", gridTemplateColumns: "320px minmax(0,1fr)", gap: 18 }}>
            <aside style={{ ...card, padding: 15, alignSelf: "start", position: "sticky", top: 12 }}>
              <button type="button" onClick={startNewRole} style={{ ...pill(false), width: "100%", marginBottom: 12 }}>
                ＋ Create Role
              </button>
              <div style={{ display: "grid", gap: 8 }}>
                {roles.map((role) => {
                  const selected = role.key === selectedRoleKey;
                  return (
                    <button
                      key={role.id || role.key}
                      type="button"
                      onClick={() => setSelectedRoleKey(role.key)}
                      style={{
                        border: selected ? "1px solid rgba(0,122,255,0.4)" : "1px solid rgba(17,24,39,0.08)",
                        background: selected ? "rgba(0,122,255,0.1)" : "#fff",
                        borderRadius: 17,
                        padding: 13,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>{role.name}</strong>
                        {role.protected && <span title="Protected role">🔒</span>}
                      </div>
                      <div style={{ color: "#6e6e73", fontSize: 12, marginTop: 5 }}>
                        {(role.permissions || []).length} permissions
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main style={{ display: "grid", gap: 18 }}>
              <section style={{ ...card, padding: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedRole ? `Edit ${selectedRole.name}` : "Create Role"}</h2>
                    <div style={{ color: "#6e6e73", marginTop: 5 }}>Change the role name, description, and every permission assigned to it.</div>
                  </div>
                  {selectedRole && !selectedRole.protected && (
                    <button type="button" onClick={deleteSelectedRole} disabled={roleSaving} style={{ ...pill(false), color: "#b91c1c" }}>Delete Role</button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 18 }}>
                  <label style={{ fontWeight: 850 }}>
                    Role name
                    <input value={roleForm.name} onChange={(event) => setRoleForm((current) => ({ ...current, name: event.target.value, key: current.key || makeRoleKey(event.target.value) }))} style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 12, borderRadius: 14, border: "1px solid rgba(17,24,39,0.1)" }} />
                  </label>
                  <label style={{ fontWeight: 850 }}>
                    Role key
                    <input value={roleForm.key} disabled={Boolean(selectedRole?.protected)} onChange={(event) => setRoleForm((current) => ({ ...current, key: makeRoleKey(event.target.value) }))} style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 12, borderRadius: 14, border: "1px solid rgba(17,24,39,0.1)", opacity: selectedRole?.protected ? 0.65 : 1 }} />
                  </label>
                </div>
                <label style={{ display: "block", fontWeight: 850, marginTop: 12 }}>
                  Description
                  <textarea value={roleForm.description} onChange={(event) => setRoleForm((current) => ({ ...current, description: event.target.value }))} rows={3} style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 12, borderRadius: 14, border: "1px solid rgba(17,24,39,0.1)", resize: "vertical" }} />
                </label>
              </section>

              {PERMISSION_GROUPS.map((group) => (
                <section key={group.key} style={{ ...card, padding: 22 }}>
                  <div style={{ fontSize: 20, fontWeight: 950 }}>{group.label}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 9, marginTop: 13 }}>
                    {group.permissions.map(([key, label]) => {
                      const enabled = roleForm.permissions.includes(key);
                      return (
                        <button key={key} type="button" onClick={() => toggleRoleFormPermission(key)} style={{ border: enabled ? "1px solid rgba(52,199,89,0.45)" : "1px solid rgba(17,24,39,0.08)", background: enabled ? "rgba(52,199,89,0.1)" : "#fff", borderRadius: 16, padding: 13, cursor: "pointer", display: "flex", justifyContent: "space-between", gap: 10, textAlign: "left" }}>
                          <span style={{ fontWeight: 850 }}>{label}</span>
                          <span>{enabled ? "✓" : "—"}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}

              <section style={{ ...card, padding: 17, position: "sticky", bottom: 10, display: "flex", justifyContent: "flex-end" }}>
                <button type="button" onClick={saveRoleDefinition} disabled={roleSaving} style={{ border: 0, borderRadius: 999, padding: "13px 20px", color: "#fff", background: roleSaving ? "#9ca3af" : "linear-gradient(135deg,#007aff,#5856d6)", fontWeight: 950, cursor: roleSaving ? "wait" : "pointer" }}>
                  {roleSaving ? "Saving…" : selectedRole ? "Save Role" : "Create Role"}
                </button>
              </section>
            </main>
          </div>
        )}

        {activeTab === "Permission Matrix" && (
          <section style={{ ...card, padding: 22, overflowX: "auto" }}>
            <h2 style={{ marginTop: 0 }}>Permission Matrix</h2>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10 }}>Permission</th>
                  {roles.map((role) => (
                    <th key={role.id || role.key} style={{ padding: 10, fontSize: 12 }}>
                      {role.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((permission) => (
                  <tr key={permission.key} style={{ borderTop: "1px solid rgba(17,24,39,0.07)" }}>
                    <td style={{ padding: 10 }}>
                      <strong>{permission.label}</strong>
                      <div style={{ fontSize: 11, color: "#6e6e73" }}>{permission.group}</div>
                    </td>
                    {roles.map((role) => (
                      <td key={`${permission.key}-${role.key}`} style={{ textAlign: "center", padding: 7 }}>
                        <button
                          type="button"
                          onClick={() => toggleMatrixPermission(role.key, permission.key)}
                          title={`Toggle ${permission.label} for ${role.name}`}
                          style={{
                            width: 38,
                            height: 32,
                            borderRadius: 10,
                            border: (role.permissions || []).includes(permission.key) ? "1px solid rgba(52,199,89,0.45)" : "1px solid rgba(17,24,39,0.08)",
                            background: (role.permissions || []).includes(permission.key) ? "rgba(52,199,89,0.12)" : "#fff",
                            cursor: "pointer",
                            fontWeight: 950,
                          }}
                        >
                          {(role.permissions || []).includes(permission.key) ? "✓" : "—"}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ position: "sticky", bottom: 10, marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button type="button" disabled={!matrixDirty || roleSaving} onClick={savePermissionMatrix} style={{ border: 0, borderRadius: 999, padding: "13px 20px", color: "#fff", background: !matrixDirty || roleSaving ? "#9ca3af" : "linear-gradient(135deg,#007aff,#5856d6)", fontWeight: 950, cursor: !matrixDirty || roleSaving ? "default" : "pointer" }}>
                {roleSaving ? "Saving…" : matrixDirty ? "Save Matrix Changes" : "Matrix Saved"}
              </button>
            </div>
          </section>
        )}

        {activeTab === "Audit Log" && (
          <section style={{ ...card, padding: 22 }}>
            <h2 style={{ marginTop: 0 }}>Audit Log</h2>
            <div style={{ display: "grid", gap: 9 }}>
              {auditRows.map((row) => (
                <div key={row.id} style={{ border: "1px solid rgba(17,24,39,0.08)", borderRadius: 16, padding: 13, background: "#fff" }}>
                  <div style={{ fontWeight: 900 }}>
                    {row.actor?.display_name || "System"} updated {row.target?.display_name || "a user"}
                  </div>
                  <div style={{ color: "#6e6e73", marginTop: 4, fontSize: 13 }}>
                    {row.action} • {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {!auditRows.length && <div style={{ color: "#6e6e73" }}>No audit records yet.</div>}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 850px) {
          .iam-grid {
            grid-template-columns: 1fr !important;
          }
          .iam-grid aside {
            position: static !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PermissionsCenter;
