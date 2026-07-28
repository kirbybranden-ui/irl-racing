// ======================================================
// BRL Permission Helper System
// Budweiser Racing League
// ======================================================

export function normalizePermissions(user = {}) {
  const direct = Array.isArray(user.permissions)
    ? user.permissions
    : [];

  const rolePermissions = Array.isArray(user.roles)
    ? user.roles.flatMap((role) => role.permissions || [])
    : [];

  return [...new Set([...direct, ...rolePermissions])];
}

export function hasPermission(user, permission) {
  if (!user) return false;

  const permissions = normalizePermissions(user);

  // Super Admin
  if (permissions.includes("*")) return true;

  // Admin Wildcard
  if (permissions.includes("admin.*")) return true;

  // Exact permission
  if (permissions.includes(permission)) return true;

  // Wildcard category
  const parts = permission.split(".");

  if (parts.length > 1) {
    const wildcard = `${parts[0]}.*`;

    if (permissions.includes(wildcard))
      return true;
  }

  return false;
}

export function hasRole(user, roleName) {
  if (!user) return false;

  return (
    Array.isArray(user.roles) &&
    user.roles.some(
      (role) =>
        String(role.name).toLowerCase() ===
        String(roleName).toLowerCase()
    )
  );
}

export function can(user, permission) {
  return hasPermission(user, permission);
}

export function cannot(user, permission) {
  return !hasPermission(user, permission);
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
  return hasRole(user, "Finance");
}

export function isHR(user) {
  return hasRole(user, "HR");
}

export function isMedia(user) {
  return hasRole(user, "Media");
}

export function canAccessAdmin(user) {
  return hasPermission(user, "admin.access");
}

export function canAccessFinance(user) {
  return hasPermission(user, "finance.manage");
}

export function canAccessRaceResults(user) {
  return hasPermission(user, "race.results");
}

export function canAccessRaceControl(user) {
  return hasPermission(user, "race.control");
}

export function canAccessContracts(user) {
  return hasPermission(user, "contracts.manage");
}

export function canAccessDrivers(user) {
  return hasPermission(user, "drivers.manage");
}

export function canAccessOwners(user) {
  return hasPermission(user, "owners.manage");
}

export function canAccessSettings(user) {
  return hasPermission(user, "settings.manage");
}

export function canAccessIAM(user) {
  return hasPermission(user, "iam.manage");
}

export function canAccessMedia(user) {
  return hasPermission(user, "media.manage");
}

export function canAccessInterviews(user) {
  return hasPermission(user, "media.interviews");
}

export function canAccessPaint(user) {
  return hasPermission(user, "media.paint");
}

export function canAccessNews(user) {
  return hasPermission(user, "news.manage");
}

export function canAccessStreams(user) {
  return hasPermission(user, "streams.manage");
}

export function canAccessAppeals(user) {
  return hasPermission(user, "appeals.manage");
}

export function canAccessIssues(user) {
  return hasPermission(user, "issues.manage");
}

export function canAccessVoting(user) {
  return hasPermission(user, "league.voting");
}

export function canAccessStandings(user) {
  return hasPermission(user, "league.standings");
}

export function canAccessOwnerHQ(user) {
  return hasPermission(user, "owner.hq");
}

export function canAccessDriverProfile(user) {
  return hasPermission(user, "driver.profile");
}
