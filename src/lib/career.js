import { supabase } from "./supabase";
import { refreshLeagueAccess } from "./roleAccess";
export async function careerRead() {
  const { data, error } = await supabase.rpc("brl_career_read");
  if (error) throw new Error(error.message);
  return data;
}
export async function careerAction(action, payload) {
  const { data, error } = await supabase.rpc("brl_career_action", { action_value: action, payload });
  if (error) throw new Error(error.message);
  await refreshLeagueAccess();
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
  const result = loginKind === "legacy" ? await supabase.rpc("brl_change_driver_password", { new_password: password }) : await supabase.auth.updateUser({ password });
  if (result.error) throw new Error(result.error.message);
}
