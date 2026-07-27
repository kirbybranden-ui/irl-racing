export const EVENT_PERMISSION_KEYS = [
  "event.manage",
  "event.settings",
  "event.roster",
  "event.schedule",
  "event.results",
  "event.penalties",
  "event.staff",
  "event.publish",
];

export const EVENT_ROLE_TEMPLATES = {
  owner: Object.fromEntries(EVENT_PERMISSION_KEYS.map((key) => [key, true])),
  cohost: Object.fromEntries(EVENT_PERMISSION_KEYS.map((key) => [key, true])),
  race_director: {
    "event.schedule": true,
    "event.results": true,
    "event.penalties": true,
    "event.publish": true,
  },
  scorer: {
    "event.results": true,
  },
  roster_manager: {
    "event.roster": true,
  },
  broadcaster: {
    "event.publish": true,
  },
  moderator: {
    "event.roster": true,
    "event.penalties": true,
  },
};

export function getSessionKey(session) {
  return String(
    session?.username ||
      session?.driverName ||
      session?.name ||
      session?.email ||
      session?.driverId ||
      ""
  ).trim().toLowerCase();
}

export function getSessionDisplayName(session) {
  return String(
    session?.driverName || session?.name || session?.username || session?.email || "League Member"
  ).trim();
}

export function canManageEvent(event, staffRows, session, permission) {
  const key = getSessionKey(session);
  if (!key) return false;
  if (String(event?.created_by || "").toLowerCase() === key) return true;
  const rows = (staffRows || []).filter((row) => String(row.user_key || "").toLowerCase() === key);
  return rows.some((row) => {
    const rolePermissions = EVENT_ROLE_TEMPLATES[row.role_key] || {};
    return row.permissions?.[permission] === true || rolePermissions[permission] === true;
  });
}
