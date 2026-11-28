// Pure Season 2 scoring foundation. No database writes or legacy data access.
const integer=(v,min,max,label)=>{const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw Error(`Invalid ${label}`);return n;};
const optional=(v,min,max,label)=>v==null||v===''?null:integer(v,min,max,label);
export const finishPoints=p=>p===1?55:Math.max(1,37-p);
export function scoreEntry(entry,stageCount){
 integer(stageCount,1,3,'stage count');
 const status=entry.status;
 if(!['finished','dnf','absent','did_not_start'].includes(status))throw Error('Invalid attendance status');
 const started=['finished','dnf'].includes(status);
 const finish=optional(entry.finishPos,1,40,'finish');
 if(status==='finished'&&finish===null)throw Error('Finishing position required');
 if(!started&&finish!==null)throw Error('Nonstarter cannot have a finishing position');
 if(entry.startPark||entry.isSubstitute||entry.partTime)throw Error('Ineligible entry');
 const stages=[1,2,3].map(i=>optional(entry[`stage${i}Pos`],1,10,`stage ${i}`));
 if(stages.some((v,i)=>v!==null&&(!started||i>=stageCount)))throw Error('Invalid stage result');
 if(entry.fastestLap&&status!=='finished')throw Error('Fastest lap requires a finish');
 const penalty=integer(entry.penaltyPoints??0,0,Number.MAX_SAFE_INTEGER,'penalty');
 const stageScores=stages.map(p=>p===null?0:11-p);
 const polePoints=entry.pole?1:0; // qualifying is separate from race start
 const fastestLapPoints=entry.fastestLap?1:0;
 const fp=status==='finished'?finishPoints(finish):0;
 const earned=fp+stageScores.reduce((a,b)=>a+b,0)+polePoints+fastestLapPoints;
 return {...entry,started,finishPos:finish,finishPoints:fp,stage1Points:stageScores[0],stage2Points:stageScores[1],stage3Points:stageScores[2],polePoints,fastestLapPoints,earned,penaltyPoints:penalty,totalRacePoints:earned-penalty};
}
export function scoreRace(entries,eligibleIds,stageCount){
 const expected=new Set(eligibleIds.map(String));const seen=new Set();const used=[new Set(),new Set(),new Set(),new Set()];let poles=0,fast=0;
 const rows=entries.map(e=>{const id=String(e.driverId);if(!expected.has(id)||seen.has(id))throw Error('Invalid or duplicate driver');seen.add(id);const r=scoreEntry(e,stageCount);if(r.pole&&++poles>1)throw Error('Duplicate pole');if(r.fastestLap&&++fast>1)throw Error('Duplicate fastest lap');[r.finishPos,...[1,2,3].map(i=>optional(r[`stage${i}Pos`],1,10,'stage'))].forEach((p,i)=>{if(p===null)return;if(used[i].has(p))throw Error('Duplicate position');used[i].add(p);});return r;});
 if(seen.size!==expected.size)throw Error('Mark every eligible driver');return rows;
}
// Input must be official published Season 2 race snapshots, in schedule order.
// Missing entries are errors, not fabricated absences. Eligibility is snapshotted per event.
export function regularSeasonTotals(races,driverId){
 const rows=races.filter(r=>r.phase==='regular'&&r.eligibleIds.map(String).includes(String(driverId))).map(r=>{const e=r.results.find(e=>String(e.driverId)===String(driverId));if(!e)throw Error('Missing official attendance/result');return {raceId:r.id,earned:e.earned,penalty:e.penaltyPoints};});
 const drops=[...rows].sort((a,b)=>a.earned-b.earned).slice(0,3);const earned=rows.reduce((a,r)=>a+r.earned,0),penalty=rows.reduce((a,r)=>a+r.penalty,0),dropped=drops.reduce((a,r)=>a+r.earned,0);
 return {earned,penalty,dropped,points:earned-dropped-penalty,droppedRaceIds:drops.map(r=>r.raceId)};
}
export function attendance(races,driverId){
 const rows=races.filter(r=>r.eligibleIds.map(String).includes(String(driverId))).map(r=>{const e=r.results.find(e=>String(e.driverId)===String(driverId));if(!e)throw Error('Missing official attendance');return e;});
 const starts=rows.filter(e=>e.started).length,finished=rows.filter(e=>e.status==='finished').length;
 return {eligible:rows.length,starts,finished,dnfs:rows.filter(e=>e.status==='dnf').length,missed:rows.length-starts,attendanceRate:rows.length?starts/rows.length:null,completionRate:starts?finished/starts:null};
}
