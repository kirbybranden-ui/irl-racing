
export async function loadEffectiveAccess(supabase, userId) {
  if (!supabase || !userId) {
    return {
      permissions: new Set(),
      seriesScopes: new Set(),
      teamScopes: new Set(),
      roles: new Set(),
    };
  }

  const [roleResult, overrideResult, scopeResult] = await Promise.all([
    supabase
      .from("user_roles")
      .select("permission_roles(key, role_permissions(permission_key))")
      .eq("user_id", userId),
    supabase
      .from("user_permission_overrides")
      .select("permission_key, allowed")
      .eq("user_id", userId),
    supabase
      .from("user_access_scopes")
      .select("scope_type, scope_value")
      .eq("user_id", userId),
  ]);

  const error = roleResult.error || overrideResult.error || scopeResult.error;
  if (error) throw error;

  const permissions = new Set();
  const roles = new Set();

  (roleResult.data || []).forEach((row) => {
    const role = row.permission_roles;
    if (role?.key) roles.add(role.key);

    (role?.role_permissions || []).forEach((permission) => {
      if (permission.permission_key) permissions.add(permission.permission_key);
    });
  });

  (overrideResult.data || []).forEach((override) => {
    if (override.allowed) permissions.add(override.permission_key);
    else permissions.delete(override.permission_key);
  });

  const seriesScopes = new Set();
  const teamScopes = new Set();

  (scopeResult.data || []).forEach((scope) => {
    if (scope.scope_type === "series") seriesScopes.add(scope.scope_value);
    if (scope.scope_type === "team") teamScopes.add(scope.scope_value);
  });

  return { permissions, seriesScopes, teamScopes, roles };
}

export function hasPermission(access, permissionKey) {
  return Boolean(access?.permissions?.has(permissionKey));
}

export function hasRole(access, roleKey) {
  return Boolean(access?.roles?.has(roleKey));
}

export function canAccessSeries(access, seriesId) {
  if (!access) return false;
  if (!access.seriesScopes?.size) return true;
  return access.seriesScopes.has(String(seriesId));
}

export function canAccessTeam(access, teamId) {
  if (!access) return false;
  if (!access.teamScopes?.size) return true;
  return access.teamScopes.has(String(teamId));
}

export function canPerform(access, permissionKey, options = {}) {
  if (!hasPermission(access, permissionKey)) return false;
  if (options.seriesId && !canAccessSeries(access, options.seriesId)) return false;
  if (options.teamId && !canAccessTeam(access, options.teamId)) return false;
  return true;
}
