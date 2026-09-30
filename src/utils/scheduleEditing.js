import {normalizeTrackName} from './raceHelpers';
export function physicalTrackName(name){return normalizeTrackName(name).replace(/^Preseason - /i,'');}
export function validateSchedule(rows,history=[]){
 const names=new Set();
 const clean=rows.map(row=>{
  const phase=row.phase||'Regular Season',raw=physicalTrackName(row.name);
  if(!raw)throw new Error('Every race needs a full track name.');
  const name=(phase==='Preseason'?'Preseason - ':'')+raw;
  if(names.has(name.toLowerCase()))throw new Error(`Duplicate event name: ${name}. Give repeated events distinct names.`);names.add(name.toLowerCase());
  const date=String(row.date||'');const day=new Date(date+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(day.getTime())||day.toISOString().slice(0,10)!==date||day.getUTCDay()!==6)throw new Error(`${name}: choose a valid Saturday date.`);
  const stageCount=Number(row.stageCount);if(![1,2,3].includes(stageCount))throw new Error(`${name}: use 1, 2, or 3 scoring stages.`);
  if(!['Preseason','Regular Season','Chase'].includes(phase))throw new Error('Choose a valid season phase.');
  const overview={...(row.overview||{})};
  for(const key of ['lengthMiles','referenceFullLaps','actualRaceLaps']){
    if(overview[key]===''||overview[key]===null||overview[key]===undefined){delete overview[key];continue;}
    overview[key]=Number(overview[key]);if(!Number.isFinite(overview[key])||overview[key]<=0||key!=='lengthMiles'&&!Number.isInteger(overview[key]))throw new Error(`${name}: check ${key}.`);
  }
  if(overview.imageUrl&&!/^https:\/\//i.test(overview.imageUrl))throw new Error('Track photos must use an HTTPS URL.');
  return {name,date,stageCount,phase,eventLabel:String(row.eventLabel||'').trim(),...(Object.keys(overview).length?{overview}:{})};
 });
 for(const race of history){if(!clean.some(t=>t.name===normalizeTrackName(race.raceName)))throw new Error(`Keep ${race.raceName}: this season has recorded results. Its date and photo can still be edited.`);}
 return clean.sort((a,b)=>a.date.localeCompare(b.date));
}
export async function uploadTrackPhoto(client,file,name){
 if(!file)throw new Error('Choose a track photo.');
 if(!physicalTrackName(name))throw new Error('Choose the track name before uploading its photo.');
 const types={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'};
 if(!types[file.type])throw new Error('Use a JPG, PNG, WebP, or AVIF photo.');
 if(file.size>10*1024*1024)throw new Error('Track photos must be 10 MB or smaller.');
 const slug=physicalTrackName(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,80)||'track';
 const path=`tracks/${slug}/${crypto.randomUUID()}.${types[file.type]}`;
 const {error}=await client.storage.from('track-images').upload(path,await file.arrayBuffer(),{contentType:file.type,cacheControl:'3600',upsert:false});
 if(error)throw error;
 const {data}=client.storage.from('track-images').getPublicUrl(path);
 if(!data?.publicUrl)throw new Error('Photo uploaded but no public URL was returned.');
 return data.publicUrl;
}
