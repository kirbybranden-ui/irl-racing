import { useEffect, useState } from 'react';
import { supabase } from './supabase';
export async function bankCall(name,args={}) { const {data,error}=await supabase.rpc(`brl_bank_${name}`,args); if(error) throw new Error(error.message); if(['accept','decide','tick'].includes(name))window.dispatchEvent(new Event('brl:bank-state-changed')); return data; }
export function useBankingEnabled() {
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{let live=true; const read=async()=>{const {data}=await supabase.from('brl_bank_settings').select('enabled').eq('id',true).maybeSingle(); if(live)setEnabled(Boolean(data?.enabled));};read();const id=setInterval(read,20000);return()=>{live=false;clearInterval(id);};},[]);
 return enabled;
}
export function makePaySchedule(total,method,dates,weeklyCount=20) {
 const count=method==='lump'?1:method==='three'?3:Number(weeklyCount);
 if(!Number.isInteger(count)||count<1||count>52)throw new Error('Choose 1–52 weekly payments.');
 const cents=Math.round(Number(total)*100); if(!Number.isSafeInteger(cents)||cents<=0)throw new Error('Enter a positive compensation amount.');
 return Array.from({length:count},(_,i)=>{let dt=new Date(dates[method==='three'?i:0]);if(Number.isNaN(dt.valueOf()))throw new Error('Select each payment date.');if(method==='weekly')dt.setTime(dt.getTime()+i*7*86400000);return {amount:(i===count-1?cents-Math.floor(cents/count)*(count-1):Math.floor(cents/count))/100,due_at:dt.toISOString()};});
}
export const bankMoney=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(value||0));
