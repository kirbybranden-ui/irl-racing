import {getTeamFullName} from '../data/teams';
export const comparisonMetrics=[['points','Points'],['wins','Wins'],['top3','Top 3'],['top5','Top 5'],['dnfs','DNFs']];
export function comparisonNumber(value){if(value===null||value===undefined||typeof value==='boolean'||typeof value==='object'||typeof value==='string'&&!value.trim())return null;const number=Number(value);return Number.isFinite(number)?number:null;}
export function comparisonTeamKey(value){const name=getTeamFullName(String(value||'').trim());return String(name||'').trim().toLowerCase().replace(/\s+/g,' ');}
export function comparisonDriverHref(driver){const number=String(driver?.number??'').trim();return /^\d{1,3}$/.test(number)?`/driver/${encodeURIComponent(number)}`:null;}
export function buildComparisonOptions(drivers=[],teams=[]){
 const roster=(Array.isArray(drivers)?drivers:[]).filter(d=>d&&typeof d==='object');
 const driverOptions=roster.map((driver,index)=>({...driver,key:`driver:${String(driver.id??`${driver.number??''}:${driver.name??index}`)}`,label:`${driver.number!==null&&driver.number!==undefined&&String(driver.number)!==''?`#${driver.number} `:''}${driver.name||'Unnamed driver'}`,stats:Object.fromEntries(comparisonMetrics.map(([metric])=>[metric,comparisonNumber(driver[metric])]))}));
 const groups=new Map();
 for(const team of (Array.isArray(teams)?teams:[]).filter(t=>t&&typeof t==='object')){const raw=team.team||team.code||team.name;if(!raw)continue;const key=comparisonTeamKey(raw);if(!groups.has(key))groups.set(key,{key:`team:${key}`,team:raw,label:getTeamFullName(raw),records:[]});groups.get(key).records.push(team);}
 for(const driver of roster){if(!driver.team)continue;const key=comparisonTeamKey(driver.team);if(!groups.has(key))groups.set(key,{key:`team:${key}`,team:driver.team,label:getTeamFullName(driver.team),records:[]});}
 const teamOptions=[...groups.entries()].map(([canonical,group])=>{
  const conflicts=[];const stats=Object.fromEntries(comparisonMetrics.map(([metric])=>{const values=[...new Set(group.records.map(t=>comparisonNumber(t[metric])).filter(v=>v!==null))];if(values.length>1)conflicts.push(metric);return[metric,values.length===1?values[0]:null];}));
  return {...group,stats,conflicts,roster:roster.filter(d=>comparisonTeamKey(d.team)===canonical)};
 });
 return {teams:teamOptions,drivers:driverOptions};
}
export function comparisonPair(options,left,right){const a=options.find(o=>o.key===left)||options[0]||null;const b=options.find(o=>o.key===right&&o.key!==a?.key)||options.find(o=>o.key!==a?.key)||null;return[a,b];}
