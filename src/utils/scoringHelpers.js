export const FINISH_POINTS = [
  55, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  16, 15, 14, 13, 12, 11, 10, 9, 8, 7,
  6, 5, 4, 3, 2, 1, 1, 1, 1, 1,
];

export const STAGE_POINTS = [
  10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
];

export const FASTEST_LAP_BONUS = 1;
export const POLE_POINTS = 0;

export function pointsForPosition(position, table) {
  const numericPosition = Number(position);

  if (!Number.isInteger(numericPosition) || numericPosition < 1) {
    return 0;
  }

  return Number(table[numericPosition - 1] || 0);
}

export function getStagePoints(position) {
  return pointsForPosition(position, STAGE_POINTS);
}

export function getOffensePenaltyPoints(offense) {
  if (!offense) return 0;

  if (typeof offense === "number") {
    return Math.max(0, offense);
  }

  if (typeof offense === "object") {
    return Math.max(
      0,
      Number(
        offense.penaltyPoints ??
        offense.penalty_points ??
        offense.points ??
        offense.value ??
        0
      ) || 0
    );
  }

  const normalized = String(offense).trim().toLowerCase();

  const penalties = {
    warning: 0,
    "verbal warning": 0,
    minor: 5,
    moderate: 10,
    major: 25,
    severe: 50,
    disqualification: 55,
    dq: 55,
  };

  return penalties[normalized] ?? 0;
}

export function countPriorOffenses(offenseLog, driverId, currentRaceName = "") {
  if (!Array.isArray(offenseLog) || !driverId) {
    return 0;
  }

  return offenseLog.filter((offense) => {
    const offenseDriverId =
      offense.driverId ??
      offense.driver_id ??
      offense.driver?.id;

    const offenseRaceName =
      offense.raceName ??
      offense.race_name ??
      offense.race ??
      "";

    const sameDriver =
      String(offenseDriverId) === String(driverId);

    const isDifferentRace =
      !currentRaceName ||
      String(offenseRaceName) !== String(currentRaceName);

    return sameDriver && isDifferentRace;
  }).length;
}

export function calculateRacePoints({
  finishPosition,
  stage1Position,
  stage2Position,
  stage3Position,
  isFastestLap = false,
  penaltyPoints = 0,
  isStartPark = false,
}) {
  const finishPoints = pointsForPosition(
    finishPosition,
    FINISH_POINTS
  );

  const stage1Points = isStartPark
    ? 0
    : pointsForPosition(stage1Position, STAGE_POINTS);

  const stage2Points = isStartPark
    ? 0
    : pointsForPosition(stage2Position, STAGE_POINTS);

  const stage3Points = isStartPark
    ? 0
    : pointsForPosition(stage3Position, STAGE_POINTS);

  const fastestLapPoints = isFastestLap
    ? FASTEST_LAP_BONUS
    : 0;

  const deductions = Math.max(
    0,
    Number(penaltyPoints) || 0
  );

  const pointsBeforePenalty =
    finishPoints +
    stage1Points +
    stage2Points +
    stage3Points +
    fastestLapPoints;

  return {
    finishPoints,
    stage1Points,
    stage2Points,
    stage3Points,
    fastestLapPoints,
    penaltyPoints: deductions,
    pointsBeforePenalty,
    totalPoints: Math.max(
      0,
      pointsBeforePenalty - deductions
    ),
  };
}
