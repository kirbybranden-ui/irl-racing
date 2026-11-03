import React,{useState,useId} from 'react';
export function fundingPeriodValue(rows){return rows.map(row=>{const date=new Date(row.due);return `${row.race.trim()} | ${Number.isNaN(date.getTime())?row.due:date.toISOString()}`;}).join('\n');}
export default function FundingRacePeriods({name='periods',count,uploads=[]}){
 const listId=useId();
 const [rows,setRows]=useState(()=>Array.from({length:count||1},()=>({race:'',due:''})));
 const update=(index,field,value)=>setRows(current=>current.map((row,i)=>i===index?{...row,[field]:value}:row));
 const choices=[...new Set(uploads.map(u=>String(u.race_id||u.race_week||'').trim()).filter(Boolean))];
 return <fieldset className="funding-race-periods"><legend>Races and proof deadlines</legend><p>Use the same race name/key shown on the car uploads. Enter deadlines in your local time; the app saves the timezone automatically.</p><input type="hidden" name={name} value={fundingPeriodValue(rows)}/>{choices.length>0&&<datalist id={listId}>{choices.map(race=><option value={race} key={race}/>)}</datalist>}{rows.map((row,index)=><div className="funding-race-row" key={index}><label>Race {index+1}<input required value={row.race} maxLength={100} list={choices.length?listId:undefined} onChange={e=>update(index,'race',e.target.value)} placeholder="Race name/key from car uploads"/></label><label>Proof due (your local time)<input required type="datetime-local" value={row.due} onChange={e=>update(index,'due',e.target.value)}/></label>{!count&&rows.length>1&&<button type="button" onClick={()=>setRows(current=>current.filter((_,i)=>i!==index))}>Remove race {index+1}</button>}</div>)}{!count&&<button type="button" disabled={rows.length>=60} onClick={()=>setRows(current=>[...current,{race:'',due:''}])}>Add another race</button>}</fieldset>;
}
