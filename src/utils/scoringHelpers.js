import { stagePointsTable, offensePenaltyPoints } from "../data/points";

export function getOffensePenaltyPoints(offenseNumber) {
  if (offenseNumber <= 0) return 0;
  const idx = Math.min(offenseNumber, offensePenaltyPoints.length) - 1;
  return offensePenaltyPoints[idx];
}

export function countPriorOffenses(raceHistory, driverId, excludeRaceName = null) {
  let count = 0;

  raceHistory.forEach((race) => {
    if (excludeRaceName && race.raceName === excludeRaceName) return;

    const result = race.results?.find((r) => r.driverId === driverId);
    if (result?.offense) count += 1;
  });

  return count;
}

export function getStagePoints(stageFinish) {
  if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
  return stagePointsTable[stageFinish - 1];
}
