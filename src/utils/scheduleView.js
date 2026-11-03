import {normalizeTrackName,getSortedTracksByDate,hasRaceRolledOver} from './raceHelpers';
const key=value=>normalizeTrackName(value).trim().toLowerCase();
export function scheduleDate(value){
 const raw=String(value||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
 const date=new Date(`${raw}T12:00:00Z`);if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==raw)return null;
 const format=options=>new Intl.DateTimeFormat('en-US',{...options,timeZone:'UTC'}).format(date);
 return {iso:raw,month:format({month:'short'}),day:format({day:'2-digit'}),year:format({year:'numeric'}),weekday:format({weekday:'short'}),full:format({weekday:'long',month:'long',day:'numeric',year:'numeric'})};
}
export function buildScheduleView(tracks=[],raceHistory=[],now=new Date()){
 const completed=new Set((Array.isArray(raceHistory)?raceHistory:[]).filter(Boolean).map(r=>key(r.raceName||r.track||r.name||r.race||'')));
 const source=(Array.isArray(tracks)?tracks:[]).filter(t=>t&&typeof t==='object');
 const ordered=[...getSortedTracksByDate(source.filter(t=>scheduleDate(t.date))),...source.filter(t=>!scheduleDate(t.date))];
 const events=ordered.map((track,index)=>{
  const name=String(track.name||track.track||`Event ${index+1}`),date=scheduleDate(track.date),done=completed.has(key(name));
  return {track,name,date,index,id:`schedule-event-${index+1}`,phase:track.phase||(/^Preseason\s*-/i.test(name)?'Preseason':'Regular Season'),status:done?'completed':!date?'date_pending':hasRaceRolledOver(track,now)?'awaiting_results':'scheduled'};
 });
 const next=events.find(e=>e.status==='scheduled')||null;if(next)next.status='next';
 return {events,next,phases:[...new Set(events.map(e=>e.phase))],completed:events.filter(e=>e.status==='completed').length,upcoming:events.filter(e=>['next','scheduled'].includes(e.status)).length};
}
export function filterSchedule(events,{status='all',phase='all',search=''}={}){
 const query=search.trim().toLowerCase();return events.filter(e=>(status==='all'||status==='upcoming'&&['next','scheduled'].includes(e.status)||status==='completed'&&e.status==='completed'||status==='awaiting_results'&&e.status==='awaiting_results')&&(phase==='all'||e.phase===phase)&&(!query||`${e.name} ${e.track.eventLabel||''} ${e.phase}`.toLowerCase().includes(query)));
}
