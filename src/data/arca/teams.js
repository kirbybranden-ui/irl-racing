/**
 * ARCA Menards Series - Teams
 * Teams for the ARCA series will be defined here as they're established.
 * Currently a placeholder - structure ready to expand.
 */

export const arcaTeamLogos = {
  // Team logos will be imported and added here as teams join ARCA
  // Example: TEAM_ABBR: teamLogoTeamAbbr,
};

export const arcaManufacturerLogos = {
  Chevrolet: undefined, // Will import once manufacturer assets are confirmed
  Ford: undefined,
  Toyota: undefined,
};

export const arcaTeamFullNames = {
  // Team abbreviations mapped to full names
  // Example: "TAB": "Team Abbreviation",
};

export const arcaTeamBudgets = {
  // Team budgets will be defined here
  // Example: "TAB": 2000000,
};

export const arcaTeamBranding = {
  // Team branding with colors and assets
  // Example: "TAB": { logo: "TAB", accent: "#color", dark: "#darkcolor", fullName: "Team Abbreviation" },
};

export function getArcaTeamFullName(teamAbbr) {
  return arcaTeamFullNames[teamAbbr] || teamAbbr;
}

export function getArcaTeamBudget(teamAbbr) {
  return arcaTeamBudgets[teamAbbr] || arcaTeamBudgets[getArcaTeamFullName(teamAbbr)?.toUpperCase?.()] || 0;
}

export function getArcaTeamBranding(teamName) {
  return (
    arcaTeamBranding[teamName] || {
      logo: teamName?.charAt(0)?.toUpperCase() || "?",
      accent: "#16a34a", // ARCA green
      dark: "#0a3a0a",
      fullName: teamName || "Unknown Team",
    }
  );
}
