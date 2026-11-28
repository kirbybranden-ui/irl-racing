export const SEASON2 = 'season-2-1790801575252';
export const SEEDS=[30,25,20,18,16,14,12,10,8,6,5,4,3,2,1,0];
const n=x=>Number.isFinite(Number(x))?Number(x):0;
const id=x=>String(x);
const started=r=>r.status==='finished'||r.status==='dnf';
const finished=r=>r.status==='finished';
const official=r=>r.status==='Posted'&&r.recorderVersion===2;
const empty=()=>({points:0,wins:0,top3:0,top5:0,top10:0,dnfs:0,poles:0,fastestLaps:0,stageWins:0,totalPenalties:0,finishCounts:Array(40).fill(0)});
function tally(s,r){const p=n(r.finishPos);if(finished(r)&&p>=1&&p<=40){s.finishCounts[p-1]++;s.wins+=+(p===1);s.top3+=+(p<=3);s.top5+=+(p<=5);s.top10+=+(p<=10);}s.dnfs+=+(r.status==='dnf');s.poles+=+Boolean(r.pole);s.fastestLaps+=+Boolean(r.fastestLap);s.stageWins+=[1,2,3].filter(i=>n(r[`stage${i}Pos`])===1).length;s.totalPenalties+=n(r.penaltyPoints);}
export function rankCompare(a,b){return n(b.points)-n(a.points)||countback(a,b);}
function countback(a,b){for(let i=0;i<40;i++){const diff=n(b.finishCounts?.[i])-n(a.finishCounts?.[i]);if(diff)return diff;}return 0;}
const labelCompare=(a,b)=>String(a.name??a.team??a.manufacturer).localeCompare(String(b.name??b.team??b.manufacturer),undefined,{sensitivity:'base'})||id(a.id).localeCompare(id(b.id));
export function championship(roster,history,tracks){
 const races=history.filter(official).sort((a,b)=>String(a.raceDate).localeCompare(String(b.raceDate))||a.raceName.localeCompare(b.raceName));
 const regular=races.filter(r=>r.phase==='Regular Season'),chase=races.filter(r=>r.phase==='Chase'),competitive=[...regular,...chase];
 const entries=new Map(roster.map(d=>[id(d.id),{...d,...empty(),regular:[],chasePoints:0,chaseFinishCounts:Array(40).fill(0),earnedPoints:0,droppedPoints:0,regularPoints:0,attendanceEligible:0,attendancePresent:0,starts:0,finishes:0,dns:0,absences:0}]));
 const teams=new Map(),manufacturers=new Map();const group=(map,key,field)=>{if(!map.has(key))map.set(key,{[field]:key,...empty()});return map.get(key);};
 for(const race of races){const counts=race.phase==='Regular Season'||race.phase==='Chase';const brands=new Map();
  for(const r of race.attendance||[]){const k=id(r.driverId);if(!entries.has(k))entries.set(k,{id:r.driverId,name:r.name,number:r.number,team:r.team,manufacturer:r.manufacturer,retired:true,...empty(),regular:[],chasePoints:0,chaseFinishCounts:Array(40).fill(0),earnedPoints:0,droppedPoints:0,regularPoints:0,attendanceEligible:0,attendancePresent:0,starts:0,finishes:0,dns:0,absences:0});const d=entries.get(k);
   d.attendanceEligible++;d.attendancePresent+=+(r.status!=='absent');d.starts+=+started(r);d.finishes+=+finished(r);d.dns+=+(r.status==='did_not_start');d.absences+=+(r.status==='absent');
   if(!counts)continue;
   // Use stamped official results for starters; attendance carries nonstarter deductions.
   const scored=(race.results||[]).find(x=>id(x.driverId)===k)||r;const earned=n(scored.earned),penalty=n(scored.penaltyPoints),points=earned-penalty;d.earnedPoints+=earned;tally(d,scored);
   if(race.phase==='Regular Season')d.regular.push({name:race.raceName,earned,penalty,finish:finished(scored)?n(scored.finishPos):0});else {d.chasePoints+=points;if(finished(scored)&&n(scored.finishPos)>=1&&n(scored.finishPos)<=40)d.chaseFinishCounts[n(scored.finishPos)-1]++;}
   if(scored.team&&!['independent','ind'].includes(scored.team.toLowerCase())&&started(scored)){const t=group(teams,scored.team,'team');tally(t,scored);t.points+=n(scored.teamPoints);}
   if(scored.manufacturer&&started(scored)&&!(!scored.team||['independent','ind'].includes(scored.team.toLowerCase()))){const m=group(manufacturers,scored.manufacturer,'manufacturer');tally(m,scored);if(!brands.has(scored.manufacturer))brands.set(scored.manufacturer,[]);brands.get(scored.manufacturer).push(points);}
  }
  for(const [brand,values] of brands)manufacturers.get(brand).points+=values.sort((a,b)=>b-a).slice(0,4).reduce((a,b)=>a+b,0);
 }
 const drivers=[...entries.values()];
 for(const d of drivers){const dropped=[...d.regular].sort((a,b)=>a.earned-b.earned).slice(0,3);d.droppedPoints=dropped.reduce((a,b)=>a+b.earned,0);d.droppedRaces=dropped.map(x=>x.name);d.regularPoints=d.regular.reduce((a,b)=>a+b.earned-b.penalty,0)-d.droppedPoints;d.points=d.regularPoints+d.chasePoints;d.regularFinishCounts=Array(40).fill(0);for(const r of d.regular)if(r.finish>=1&&r.finish<=40)d.regularFinishCounts[r.finish-1]++;d.attendanceRate=d.attendanceEligible?d.attendancePresent/d.attendanceEligible:null;d.completionRate=d.starts?d.finishes/d.starts:null;}
 const regularSchedule=tracks.filter(t=>t.phase==='Regular Season');const complete=regularSchedule.length>0&&regularSchedule.every(t=>regular.some(r=>r.raceName===t.name));
 // No attendance threshold. Resolve exact countback ties via existing permanent ID only for display;
 // an unresolved tie crossing the cutline or affecting seeds blocks reset, rather than silently picking.
 const ranking=drivers.filter(d=>!d.retired||d.regular.length).map(d=>({...d,points:d.regularPoints,finishCounts:d.regularFinishCounts})).sort((a,b)=>rankCompare(a,b)||labelCompare(a,b));
 const cutoff=ranking.slice(0,16);const unresolved=ranking.some((r,i)=>i>0&&i<=16&&rankCompare(r,ranking[i-1])===0);
 const seeded=complete&&!unresolved;
 const regularChampion=complete&&ranking.length&&!(ranking.length>1&&rankCompare(ranking[0],ranking[1])===0)?ranking[0]:null;
 if(seeded)cutoff.forEach((r,i)=>{const d=entries.get(id(r.id));d.chaseSeed=i+1;d.seedPoints=SEEDS[i];d.points=d.seedPoints+d.chasePoints;});
 for(const d of drivers){d.chaseResetReady=seeded;d.chaseTiePending=complete&&unresolved;d.championshipRank=null;}
 drivers.sort((a,b)=>(seeded?Number(Boolean(b.chaseSeed))-Number(Boolean(a.chaseSeed)):0)||(seeded&&a.chaseSeed&&b.chaseSeed?rankCompare({...a,finishCounts:a.chaseFinishCounts},{...b,finishCounts:b.chaseFinishCounts}):rankCompare(a,b))||labelCompare(a,b));drivers.forEach((d,i)=>d.championshipRank=i+1);
 const chaseSchedule=tracks.filter(t=>t.phase==='Chase');const chaseComplete=seeded&&chaseSchedule.length>0&&chaseSchedule.every(t=>chase.some(r=>r.raceName===t.name));
 const cupChampion=chaseComplete&&drivers[0]?.chaseSeed&&!(drivers[1]?.chaseSeed&&rankCompare({...drivers[0],finishCounts:drivers[0].chaseFinishCounts},{...drivers[1],finishCounts:drivers[1].chaseFinishCounts})===0)?drivers[0]:null;
 return {drivers,regularChampion,cupChampion,chaseComplete,teams:[...teams.values()],manufacturers:[...manufacturers.values()],seeded,unresolved,regularCompleted:regular.length,competitiveCompleted:competitive.length};
}
