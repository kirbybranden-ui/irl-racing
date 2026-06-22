export function normalizeMessageValue(value) {
  return String(value || "").trim().toLowerCase();
}

export function getCurrentUserFromSession(session = {}) {
  const role = normalizeMessageValue(
    session.role ||
      session.type ||
      session.userType ||
      session.mode
  );

  return {
    role,
    isGuest: role === "guest",
    isAdmin: role === "admin" || session.isAdmin === true,
    isDriver:
      role === "driver" ||
      Boolean(session.driverNumber || session.driver_number),
    isOwner: role === "owner" || session.isOwner === true,
    isManufacturer:
      role === "manufacturer" ||
      session.isManufacturer === true,

    driverId: String(
      session.driverId ||
      session.driver_id ||
      ""
    ).trim(),

    driverNumber: String(
      session.driverNumber ||
      session.driver_number ||
      session.number ||
      ""
    ).trim(),

    driverName: String(
      session.driverName ||
      session.driver_name ||
      session.name ||
      ""
    ).trim(),

    team: String(
      session.team ||
      session.ownerTeam ||
      session.owner_team ||
      ""
    ).trim(),

    manufacturer: String(
      session.manufacturer || ""
    ).trim(),
  };
}

export function canViewLeagueMessage(message = {}, rawSession = {}) {
  const user = getCurrentUserFromSession(rawSession);

  if (!message || user.isGuest) return false;
  if (user.isAdmin) return true;

  const recipientType = normalizeMessageValue(
    message.recipient_type ||
    message.recipientType ||
    message.target_type ||
    message.targetType ||
    message.audience_type ||
    message.audienceType
  );

  const visibility = normalizeMessageValue(
    message.visibility ||
    message.audience ||
    message.scope
  );

  const category = normalizeMessageValue(
    message.category ||
    message.message_type ||
    message.messageType
  );

  const recipientId = normalizeMessageValue(
    message.recipient_id ||
    message.recipientId ||
    message.target_id ||
    message.targetId ||
    message.driver_id ||
    message.driverId
  );

  const recipientNumber = normalizeMessageValue(
    message.recipient_driver_number ||
    message.recipientDriverNumber ||
    message.recipient_number ||
    message.recipientNumber ||
    message.driver_number ||
    message.driverNumber ||
    message.car_number ||
    message.carNumber
  );

  const recipientName = normalizeMessageValue(
    message.recipient_driver_name ||
    message.recipientDriverName ||
    message.recipient_name ||
    message.recipientName ||
    message.driver_name ||
    message.driverName
  );

  const messageTeam = normalizeMessageValue(
    message.recipient_team ||
    message.recipientTeam ||
    message.team ||
    message.team_key ||
    message.teamKey ||
    message.owner_team ||
    message.ownerTeam
  );

  const messageManufacturer = normalizeMessageValue(
    message.recipient_manufacturer ||
    message.recipientManufacturer ||
    message.manufacturer ||
    message.manufacturer_key ||
    message.manufacturerKey
  );

  const userDriverId = normalizeMessageValue(user.driverId);
  const userDriverNumber = normalizeMessageValue(user.driverNumber);
  const userDriverName = normalizeMessageValue(user.driverName);
  const userTeam = normalizeMessageValue(user.team);
  const userManufacturer = normalizeMessageValue(user.manufacturer);

  const adminOnly =
    recipientType === "admin" ||
    recipientType === "admins" ||
    recipientType === "league_office" ||
    visibility === "admin" ||
    category === "admin" ||
    category === "start_park" ||
    category === "start_and_park" ||
    category === "start park" ||
    category === "appeal_admin" ||
    category === "race_control";

  if (adminOnly) return false;

  const leagueWide =
    recipientType === "all" ||
    recipientType === "everyone" ||
    recipientType === "league" ||
    recipientType === "all_drivers" ||
    recipientType === "drivers" ||
    visibility === "all" ||
    visibility === "league" ||
    visibility === "all_drivers" ||
    category === "league_broadcast" ||
    category === "broadcast";

  if (leagueWide) {
    return (
      user.isDriver ||
      user.isOwner ||
      user.isManufacturer
    );
  }

  if (
    recipientType === "driver" ||
    recipientType === "driver_message"
  ) {
    if (recipientId && userDriverId && recipientId === userDriverId)
      return true;

    if (
      recipientNumber &&
      userDriverNumber &&
      recipientNumber === userDriverNumber
    )
      return true;

    if (
      recipientName &&
      userDriverName &&
      recipientName === userDriverName
    )
      return true;

    return false;
  }

  if (
    recipientType === "owner" ||
    recipientType === "owners" ||
    recipientType === "team" ||
    recipientType === "team_owner"
  ) {
    if (!user.isOwner) return false;
    return !!messageTeam && !!userTeam && messageTeam === userTeam;
  }

  if (
    recipientType === "manufacturer" ||
    recipientType === "manufacturers"
  ) {
    if (!user.isManufacturer) return false;
    return (
      !!messageManufacturer &&
      !!userManufacturer &&
      messageManufacturer === userManufacturer
    );
  }

  if (
    recipientNumber &&
    userDriverNumber &&
    recipientNumber === userDriverNumber
  )
    return true;

  if (
    recipientName &&
    userDriverName &&
    recipientName === userDriverName
  )
    return true;

  if (
    user.isOwner &&
    messageTeam &&
    userTeam &&
    messageTeam === userTeam
  )
    return true;

  if (
    user.isManufacturer &&
    messageManufacturer &&
    userManufacturer &&
    messageManufacturer === userManufacturer
  )
    return true;

  return false;
}

export function filterLeagueMessagesForSession(
  messages = [],
  session = {}
) {
  return (Array.isArray(messages) ? messages : []).filter((message) =>
    canViewLeagueMessage(message, session)
  );
}
