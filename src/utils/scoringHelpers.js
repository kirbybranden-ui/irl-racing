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
