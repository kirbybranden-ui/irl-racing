import { pointsTable, stagePointsTable, offensePenaltyPoints } from "../data/points";

export function validateRaceEntries(entries, drivers, stageCount = 2) {
  if (![1,2,3].includes(stageCount)) throw new Error("Invalid stage count.");
  if (!entries.length) throw new Error("Enter at least one finish position.");
  const ids = new Set(), finishes = new Set(), stages = [new Set(),new Set(),new Set()]; let laps=0;
  for (const entry of entries) {
    const id=String(entry.driverId);
    if (!drivers.some((driver)=>String(driver.id)===id) || ids.has(id)) throw new Error("Choose unique drivers from the current roster.");
    ids.add(id);
    const finish=Number(entry.finishPos);
    if (!Number.isInteger(finish) || finish<1 || finish>40 || finishes.has(finish)) throw new Error("Finish positions must be unique numbers from 1 to 40.");
    finishes.add(finish);
    for (let index=0;index<stageCount;index++) {
      const value=entry[`stage${index+1}Pos`]; if (value==="" || value===null || value===undefined) continue;
      const position=Number(value); if (!Number.isInteger(position) || position<1 || position>10 || stages[index].has(position)) throw new Error("Stage positions must be unique numbers from 1 to 10.");
      stages[index].add(position);
    }
    if (entry.fastestLap && ++laps>1) throw new Error("Only one driver can have the fastest lap.");
    if (Number(entry.manualPenaltyPoints||0)<0 || !Number.isFinite(Number(entry.manualPenaltyPoints||0))) throw new Error("Penalties must be nonnegative.");
  }
}

export function buildSubmissionRace(submission, drivers, stageCount, history = []) {
  validateRaceEntries(submission.entries,drivers,stageCount);
  return { raceName: submission.race_name, stageCount, savedAt: new Date().toISOString(), results: submission.entries.map((entry)=> {
    const driver=drivers.find((driver)=>String(driver.id)===String(entry.driverId));
    const finishPos=Number(entry.finishPos); const finishPoints=pointsTable[finishPos-1]||0;
    const stageValues=[1,2,3].map((stage)=>stage<=stageCount && entry[`stage${stage}Pos`] ? Number(entry[`stage${stage}Pos`]) : null);
    const stageScores=stageValues.map((position)=>(stagePointsTable[(position||0)-1]||0));
    const priorOffenses=history.reduce((count,race)=>count+(race.results||[]).filter((result)=>String(result.driverId)===String(driver.id)&&result.offense).length,0);
    const offenseNumber=entry.offense?priorOffenses+1:0; const offensePenalty=entry.offense?(offensePenaltyPoints[Math.min(priorOffenses,offensePenaltyPoints.length-1)]||0):0;
    const manualPenaltyPoints=Number(entry.manualPenaltyPoints||0); const fastestLapPoints=entry.fastestLap?1:0;
    return { driverId:driver.id,name:driver.name,number:driver.number,team:driver.team,manufacturer:driver.manufacturer,
      finishPos,finishPoints,stage1Pos:stageValues[0],stage2Pos:stageValues[1],stage3Pos:stageValues[2],stage1Points:stageScores[0],stage2Points:stageScores[1],stage3Points:stageScores[2],
      dnf:Boolean(entry.dnf),startPark:false,fastestLap:Boolean(entry.fastestLap),fastestLapPoints,
      offense:Boolean(entry.offense),offenseNumber,offensePenalty,manualPenaltyPoints,penaltyPoints:offensePenalty+manualPenaltyPoints,
      totalRacePoints:entry.dnf?0:finishPoints+stageScores.reduce((sum,value)=>sum+value,0)+fastestLapPoints-offensePenalty-manualPenaltyPoints,
      isWin:!entry.dnf&&finishPos===1,isTop3:!entry.dnf&&finishPos<=3,isTop5:!entry.dnf&&finishPos<=5,notes:String(entry.notes||"").slice(0,1000),dnfReason:entry.dnf?String(entry.dnfReason||"Unknown"):null };
  }).sort((left,right)=>left.finishPos-right.finishPos) };
}
