import { supabase } from "./supabase";
import { refreshLeagueAccess } from "./roleAccess";
import {createSharedRead} from "./sharedRead";
const careerReader=createSharedRead({label:"Your applications and agreements",request:async signal=>{
  const {data,error}=await supabase.rpc("brl_career_read").abortSignal(signal);
  if(error)throw new Error(error.message);
  return data;
},validate:data=>{
  if(!data?.me?.user_id)throw new Error("The dashboard returned no member record. Retry, or contact league administration if this continues.");
  for(const key of ["teams","members","contracts","requests","obligations","payments","balances","agreements","claims","loans","budgets","numbers"]){if(!Array.isArray(data[key]))throw new Error("The dashboard response is incomplete. League administration should verify the installed career migrations.");}
  return data;
}});
let lastReadUser;
supabase.auth.onAuthStateChange((event,session)=>{const user=session?.user?.id||null;if(event==="SIGNED_OUT"||(lastReadUser!==undefined&&lastReadUser!==user))careerReader.invalidate();lastReadUser=user;});
export async function careerRead(){return careerReader.read();}
export async function careerAction(action, payload) {
  const { data, error } = action === "reject_member_account" ? await supabase.rpc("brl_reject_member_application",{payload}) : ["fund_treasury","reconcile_funding"].includes(action) ? await supabase.rpc("brl_funding_console_action",{action_value:action,payload}) : action === "prepare_support" ? await supabase.rpc("brl_support_prepare",{payload}) : await supabase.rpc(action === "fund_payroll" ? "brl_fund_payroll" : action === "owner_payroll" ? "brl_owner_payroll_offer" : action === "review_team_finance" ? "brl_review_team_finance" : action === "set_funding_champion" ? "brl_set_funding_champion" : "brl_career_action", ["fund_payroll", "owner_payroll", "review_team_finance", "set_funding_champion"].includes(action) ? { payload } : { action_value: action, payload });
  if (error) throw new Error(error.message);
  careerReader.invalidate();
  refreshLeagueAccess().catch(error=>console.warn("Saved career action; permission refresh failed:",error));
  if(action!=="prepare_support")window.dispatchEvent(new Event("brl:bank-state-changed"));
  return data;
}
export async function claimOwnerDriverNumber(teamId,number){
  const {data,error}=await supabase.rpc("brl_owner_claim_leased_number",{
    p_team_id:teamId,p_number:number
  });
  if(error)throw new Error(error.message);
  careerReader.invalidate();
  window.dispatchEvent(new Event("brl:bank-state-changed"));
  return data;
}
export async function functionError(error, fallback) {
  if (error?.context) { try { const body = await error.context.json(); if (body.error) return body.error; } catch { /* fall through */ } }
  return error?.message || fallback;
}
export const signatureConsent = "I have reviewed this version and accept every term of this agreement.";
export const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
export function makeCareerSchedule(total, type, firstDate, count = 20) {
  const size = type === "lump" ? 1 : type === "three" ? 3 : Number(count);
  if (!firstDate || !Number.isInteger(size) || size < 1 || size > 52) throw new Error("Choose a first payment date and 1–52 payments.");
  const cents = Math.round(Number(total) * 100);
  return Array.from({ length: size }, (_, i) => {
    const date = new Date(`${firstDate}T18:00:00Z`);
    date.setUTCDate(date.getUTCDate() + i * (type === "three" ? 28 : 7));
    return { amount: (i === size - 1 ? cents - Math.floor(cents / size) * (size - 1) : Math.floor(cents / size)) / 100, due_at: date.toISOString() };
  });
}

export async function changeCareerPassword(password, loginKind) {
  if (String(password).length < 12 || String(password).length > 128) throw new Error("Use a password of 12–128 characters.");
  if (loginKind === "legacy") throw new Error("Use Forgot your password on the login screen. After admin verification you can create a personal password.");
  const result = await supabase.auth.updateUser({ password });
  if (result.error) throw new Error(result.error.message);
}
