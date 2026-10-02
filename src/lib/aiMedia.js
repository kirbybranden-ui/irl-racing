import { supabase } from "./supabase";

export const mediaPersonas = [
  ["pit", "Alex Carter", "Direct pit-road questions"],
  ["driver", "Ryan Cole", "Driver perspective and racecraft"],
  ["story", "Morgan Reed", "Team stories and rivalries"],
  ["grid", "Mick Walker", "Playful grid-walk banter"],
  ["straight", "Cal Porter", "Blunt, evidence-based analysis"],
  ["champion", "Dean Mercer", "Championship perspective"],
  ["banter", "Chase Brooks", "Energetic paddock conversation"],
  ["fan", "Evan Davis", "Passionate racing discussion"],
  ["crew", "Ray McCall", "Crew-chief strategy and handling"],
];

export async function callMedia(body) {
  const { data, error } = await supabase.functions.invoke("brl-media", { body });
  if (error) {
    let message = error.message;
    try { const details = await error.context.json(); message = details.error || message; } catch { /* transport errors have no response */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function interviewPairs(messages = []) {
  return messages.flatMap((m, index) => m.role === "assistant" && messages[index + 1]?.role === "user" ? [{ question: m.text, answer: messages[index + 1].text }] : []);
}
