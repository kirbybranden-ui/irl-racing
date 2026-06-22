export function normalizeTrackName(name) {
  const raw = String(name || "").trim();
  const key = raw.toLowerCase();

  if (key === "preseason - wwt raceway" || key === "preseason - world wide technology raceway") {
    return "Preseason - EchoPark Speedway";
  }

  if (key === "wwt raceway" || key === "world wide technology raceway") {
    return "EchoPark Speedway";
  }

  if (key === "preseason - echpark speedway" || key === "preseason - echopark speedway") {
    return "Preseason - EchoPark Speedway";
  }

  if (key === "echpark speedway" || key === "echopark speedway") {
    return "EchoPark Speedway";
  }

  return raw;
}

export function getEasternDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

export function getEasternNowParts(date = new Date()) {
  return getEasternDateParts(date);
}

export function getStartParkCutoffInfo(raceDate, now = new Date()) {
  if (!raceDate) {
    return {
      closed: false,
      label: "Race date unavailable",
      dateKey: "",
      hour: 21,
      minute: 0,
    };
  }

  const cutoffDateKey = String(raceDate).slice(0, 10);
  const easternNow = getEasternNowParts(now);

  const closed =
    easternNow.dateKey > cutoffDateKey ||
    (easternNow.dateKey === cutoffDateKey &&
      (easternNow.hour > 21 || (easternNow.hour === 21 && easternNow.minute >= 0)));

  return {
    closed,
    label: `Deadline: Saturday ${cutoffDateKey} at 9:00 PM ET`,
    dateKey: cutoffDateKey,
    hour: 21,
    minute: 0,
  };
}

export function wasStartParkRequestBeforeCutoff(request) {
  const raceDate = request?.race_date || request?.raceDate || "";
  const createdAt = request?.created_at || request?.createdAt || "";

  if (!raceDate || !createdAt) return true;

  const cutoffKey = `${String(raceDate).slice(0, 10)} 21:00`;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(createdAt));

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const createdKey = `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;

  return createdKey < cutoffKey;
}

export function hasRaceRolledOver(track, date = new Date()) {
  if (!track?.date) return false;

  const easternNow = getEasternDateParts(date);
  const raceDate = String(track.date).slice(0, 10);

  if (easternNow.dateKey > raceDate) return true;
  if (easternNow.dateKey < raceDate) return false;

  return easternNow.hour > 22 || (easternNow.hour === 22 && easternNow.minute >= 0);
}

export function getSortedTracksByDate(tracks = []) {
  return [...tracks].sort((a, b) => {
    if (a.date && b.date) {
      return new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`);
    }

    if (a.date) return -1;
    if (b.date) return 1;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function getUpcomingRaceByDate(tracks = []) {
  const sortedTracks = getSortedTracksByDate(tracks);
  return sortedTracks.find((track) => !hasRaceRolledOver(track)) || null;
}

export function isRaceCompleteByDateOrHistory(track, completedRaces = new Set()) {
  return completedRaces.has(track?.name) || hasRaceRolledOver(track);
}

export function sanitizeTracks(rawTracks) {
  if (!Array.isArray(rawTracks)) return null;

  const cleaned = rawTracks
    .map((track) => {
      const name = normalizeTrackName(typeof track?.name === "string" ? track.name.trim() : "");
      const stageCount = Number(track?.stageCount);

      if (!name) return null;

      return {
        name,
        stageCount: [1, 2, 3].includes(stageCount) ? stageCount : 2,
        date: track?.date || null,
      };
    })
    .filter(Boolean);

  const seen = new Set();
  const deduped = [];

  cleaned.forEach((track) => {
    const key = track.name.toLowerCase();

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(track);
    }
  });

  return deduped;
}
