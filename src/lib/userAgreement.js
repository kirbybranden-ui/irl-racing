import { supabase } from "./supabase";
export function safeAgreementNext(value) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value) && !/^\/(user-agreement|terms|login)(?:[/?#]|$)/i.test(value) ? value : "/career";
}
export async function agreementStatus() {
  const {data,error}=await supabase.rpc("brl_agreement_status");
  if(error)throw new Error(error.message);
  if(!Array.isArray(data?.document?.sections) || !data.version || !data.documentHash)throw new Error("The current agreement is unavailable. Please contact the league administrator.");
  return data;
}
export async function acceptAgreement(status,{gamertag,adult,consent}) {
  const {data,error}=await supabase.rpc("brl_agreement_accept",{version_value:status.version,hash_value:status.documentHash,gamertag_value:gamertag,adult_value:adult,consent_value:consent});
  if(error)throw new Error(error.message);
  if(!data?.accepted)throw new Error("Your acceptance could not be recorded. Please try again.");
  return data;
}
