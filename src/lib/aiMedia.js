import { supabase } from "./supabase";

export const mediaPersonas = [
  ["pit", "Jamie Little", "Direct pit-road questions"],
  ["driver", "Regan Smith", "Driver perspective and racecraft"],
  ["story", "Kim Coon", "Team stories and rivalries"],
  ["grid", "Michael Waltrip", "Playful grid-walk banter"],
  ["straight", "Kyle Petty", "Blunt, evidence-based analysis"],
  ["champion", "Dale Jarrett", "Championship perspective"],
  ["banter", "Clint Bowyer", "Energetic paddock conversation"],
  ["fan", "Dale Earnhardt Jr.", "Passionate racing discussion"],
  ["crew", "Larry McReynolds", "Crew-chief strategy and handling"],
  ["josh", "Josh Sims", "Pit reporter"],
  ["trevor", "Trevor Bayne", "Driver analyst"],
  ["snider", "Marty Snider", "Pit reporter"],
  ["burns", "Dave Burns", "Pit reporter"],
  ["harvick", "Kevin Harvick", "Driver analyst"],
  ["letarte", "Steve Letarte", "Crew-chief analyst"],
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
