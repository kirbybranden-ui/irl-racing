import { supabase } from "./supabase";
import { functionError } from "./career";
const storageKey="brl-password-requests-v1";
const normalized=value=>String(value||"").trim().toLowerCase();
export function savedPasswordTicket(gamertag){try{return JSON.parse(localStorage.getItem(storageKey)||"{}")[normalized(gamertag)]||null;}catch{return null;}}
export function storePasswordTicket(gamertag,ticket){let all={};try{all=JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{}all[normalized(gamertag)]={...ticket,attemptId:ticket.attemptId||crypto.randomUUID()};localStorage.setItem(storageKey,JSON.stringify(all));return all[normalized(gamertag)];}
export function forgetPasswordTicket(gamertag){let all={};try{all=JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{}delete all[normalized(gamertag)];localStorage.setItem(storageKey,JSON.stringify(all));}
export async function passwordAction(body){const {data,error}=await supabase.functions.invoke("brl-password",{body});if(error)throw new Error(await functionError(error,"Unable to reach password recovery."));if(data?.error)throw new Error(data.error);return data;}
