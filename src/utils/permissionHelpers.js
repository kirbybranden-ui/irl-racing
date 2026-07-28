// ======================================================
// BRL Permission Helper System
// Budweiser Racing League
// ======================================================

function extractPermissionKey(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (!value || typeof value !== "object") {
    return "";
  }

  const permission =
    value.permission ??
    value.permission_key ??
    value.permissionKey ??
    value.key ??
    value.name ??
    value.code;

  return typeof permission === "string" ? permission.trim() : "";
}

function addPermissionValues(permissionSet, values) {
  if (!Array.isArray(values)) return;

  values.forEach((value) => {
    const permission = extractPermissionKey(value);

    if (permission) {
      permissionSet.add(permission);
    }
  });
}

export function normalizePermissions(user = {}) {
  if (!user || typeof user !== "object") {
    return [];
  }

  const permissions = new Set();

  addPermissionValues(permissions, user.permissions);
  addPermissionValues(permissions, user.rolePermissions);
  addPermissionValues(permissions, user.role_permissions);

  if (Array.isArray(user.roles)) {
    user.roles.forEach((role) => {
      if (!role || typeof role !== "object") return;

      addPermissionValues(permissions, role.permissions);
      addPermissionValues(permissions, role.rolePermissions);
      addPermissionValues(permissions, role.role_permissions);
    });
  }

  const overrides = [
    ...(Array.isArray(user.permissionOverrides)
      ? user.permissionOverrides
      : []),
    ...(Array.isArray(user.permission_overrides)
      ? user.permission_overrides
      : []),
  ];

  overrides.forEach((override) => {
    const permission = extractPermissionKey(override);

    if (!permission) return;

    if (typeof override === "string") {
      permissions.add(permission);
      return;
    }

    const isDenied =
      override.allowed === false ||
      override.enabled === false ||
      override.granted === false ||
      String(override.effect || "").toLowerCase() === "deny";

    if (isDenied) {
      permissions.delete(permission);
    } else {
      permissions.add(permission);
    }
  });

  return [...permissions];
}

export function permissionListHasPermission(
  permissions = [],
  requestedPermission
) {
  if (!requestedPermission || typeof requestedPermission !== "string") {
    return false;
  }

  const requested = requestedPermission.trim();

  if (!requested) return false;

  const normalized = new Set(
    permissions
      .map((permission) => extractPermissionKey(permission))
      .filter(Boolean)
  );

  if (normalized.has("*")) return true;
  if (normalized.has(requested)) return true;
  if (normalized.has("admin.*")) return true;

  const segments = requested.split(".");

  for (let index = segments.length - 1; index >= 1; index -= 1) {
    const wildcard = `${segments.slice(0, index).join(".")}.*`;

    if (normalized.has(wildcard)) {
      return true;
    }
  }

  return false;
}

export function hasPermission(user, permission) {
  if (!user) return false;

  return permissionListHasPermission(
    normalizePermissions(user),
    permission
  );
}

export function can(user, permission) {
  return hasPermission(user, permission);
}

export function cannot(user, permission) {
  return !hasPermission(user, permission);
}

export function hasEveryPermission(user, permissions = []) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) =>
    hasPermission(user, permission)
  );
}

export function hasAnyPermission(user, permissions = []) {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.some((permission) =>
    hasPermission(user, permission)
  );
}

export function normalizeRoles(user = {}) {
  if (!user || !Array.isArray(user.roles)) {
    return [];
  }

  const roles = user.roles
    .map((role) => {
      if (typeof role === "string") {
        return role.trim();
      }

      if (!role || typeof role !== "object") {
        return "";
      }

      const roleName =
        role.name ??
        role.role_name ??
        role.roleName ??
        role.label ??
        role.role?.name;

      return typeof roleName === "string"
        ? roleName.trim()
        : "";
    })
    .filter(Boolean);

  return [...new Set(roles)];
}

export function hasRole(user, roleName) {
  if (!user || !roleName) return false;

  const requestedRole = String(roleName).trim().toLowerCase();

  return normalizeRoles(user).some(
    (role) => role.toLowerCase() === requestedRole
  );
}

export function hasAnyRole(user, roleNames = []) {
  if (!Array.isArray(roleNames) || roleNames.length === 0) {
    return false;
  }

  return roleNames.some((roleName) => hasRole(user, roleName));
}

export function isCommissioner(user) {
  return (
    hasPermission(user, "*") ||
    hasRole(user, "Commissioner")
  );
}

export function isRaceDirector(user) {
  return hasRole(user, "Race Director");
}

export function isFinance(user) {
  return hasAnyRole(user, ["Finance", "CFO"]);
}

export function isHR(user) {
  return hasAnyRole(user, [
    "HR",
    "Human Resources",
    "HR Director",
  ]);
}

export function isMedia(user) {
  return hasAnyRole(user, [
    "Media",
    "Media Director",
    "PR",
    "Public Relations",
  ]);
}

export function canAccessAdmin(user) {
  return hasPermission(user, "admin.access");
}

export function canViewAdminTile(
  user,
  requiredPermissions,
  mode = "any"
) {
  if (typeof requiredPermissions === "string") {
    return hasPermission(user, requiredPermissions);
  }

  if (!Array.isArray(requiredPermissions)) {
    return false;
  }

  return mode === "all"
    ? hasEveryPermission(user, requiredPermissions)
    : hasAnyPermission(user, requiredPermissions);
}

export function canAccessRoute(
  user,
  requiredPermissions,
  mode = "all"
) {
  if (typeof requiredPermissions === "string") {
    return hasPermission(user, requiredPermissions);
  }

  if (!Array.isArray(requiredPermissions)) {
    return false;
  }

  return mode === "any"
    ? hasAnyPermission(user, requiredPermissions)
    : hasEveryPermission(user, requiredPermissions);
}

export function filterByPermission(user, items = []) {
  if (!Array.isArray(items)) return [];

  return items.filter((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    if (typeof item.permission === "string") {
      return hasPermission(user, item.permission);
    }

    if (Array.isArray(item.permissions)) {
      const mode = item.permissionMode || "any";

      return mode === "all"
        ? hasEveryPermission(user, item.permissions)
        : hasAnyPermission(user, item.permissions);
    }

    return true;
  });
}

export function createPermissionContext(user) {
  return {
    user: user || null,
    permissions: normalizePermissions(user),
    roles: normalizeRoles(user),
    can: (permission) => hasPermission(user, permission),
    cannot: (permission) => !hasPermission(user, permission),
    canAny: (permissions) =>
      hasAnyPermission(user, permissions),
    canAll: (permissions) =>
      hasEveryPermission(user, permissions),
    hasRole: (roleName) => hasRole(user, roleName),
    canAccessAdmin: canAccessAdmin(user),
    isCommissioner: isCommissioner(user),
  };
}

export default {
  normalizePermissions,
  permissionListHasPermission,
  hasPermission,
  can,
  cannot,
  hasEveryPermission,
  hasAnyPermission,
  normalizeRoles,
  hasRole,
  hasAnyRole,
  isCommissioner,
  isRaceDirector,
  isFinance,
  isHR,
  isMedia,
  canAccessAdmin,
  canViewAdminTile,
  canAccessRoute,
  filterByPermission,
  createPermissionContext,
};
