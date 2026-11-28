import {scoreRace} from './season2RaceScoring.mjs';
export const seasonId='season-2-1790801575252';
export const emptyRow=d=>({driverId:String(d.id),status:'unmarked',finishPos:'',stage1Pos:'',stage2Pos:'',stage3Pos:'',pole:false,fastestLap:false,penaltyPoints:0});
export function finalizeDraft(rows,ids,stages){
 const normalized=rows.map(r=>r.status==='unmarked'?{...r,status:'absent'}:{...r});
 if(normalized.some(r=>r.status==='absent'&&r.pole))throw Error('Absent driver cannot have pole');
 const scored=scoreRace(normalized,ids,stages);
 const starters=scored.filter(r=>r.started);
 if(!starters.length)throw Error('At least one starter is required');
 const positions=new Set(starters.map(r=>r.finishPos));
 for(let i=1;i<=starters.length;i++)if(!positions.has(i))throw Error(`Missing classified finish ${i}`);
 return scored;
}
export function chooseRace(tracks,history,now=new Date()){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));const today=`${p.year}-${p.month}-${p.day}`;
 const day=new Date(today+'T00:00:00Z');day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);const monday=day.toISOString().slice(0,10);
 const posted=new Set(history.map(r=>r.raceName));return [...tracks].filter(t=>t.date>=monday&&!posted.has(t.name)).sort((a,b)=>a.date.localeCompare(b.date))[0]?.name||'';
}
