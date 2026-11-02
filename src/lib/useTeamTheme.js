import { useSyncExternalStore } from "react";
import { getTeamBranding, getTeamBrandingRevision, subscribeTeamBranding, resolveTeamKey, teamLogos } from "../data/teams";
import { makeTeamTheme } from "./teamTheme";

export function useTeamTheme(team, profile) {
  useSyncExternalStore(subscribeTeamBranding, getTeamBrandingRevision, () => 0);
  const code = resolveTeamKey(team || "Independent");
  const base = getTeamBranding(code);
  const saved = profile?.savedAt ? { ...profile, logoUrl: profile.logoDataUrl || teamLogos[code] || "" } : {};
  return makeTeamTheme({ ...base, logoUrl: teamLogos[code] || "", ...saved });
}
