import teamLogoB2J from "../assets/teams/B2J.png";
import teamLogoMER from "../assets/teams/ME.png";
import teamLogoNLM from "../assets/teams/NLM.png";
import teamLogoMMS from "../assets/teams/MMS.png";
import teamLogoIND from "../assets/teams/IND.png";
import teamLogo19XI from "../assets/teams/19XI.png";
import teamLogoBWR from "../assets/teams/BWR.png";
import teamLogoBXM from "../assets/teams/BXM.png";

import manufacturerChevrolet from "../assets/manufacturers/chevrolet.png";
import manufacturerFord from "../assets/manufacturers/ford.png";
import manufacturerToyota from "../assets/manufacturers/toyota.png";

export const teamLogos = {
  B2J: teamLogoB2J,
  "B2J MOTORSPORTS": teamLogoB2J,
  "B2J Motorsports": teamLogoB2J,

  MER: teamLogoMER,
  "ME RACING": teamLogoMER,
  "ME Racing": teamLogoMER,

  NLM: teamLogoNLM,
  "NINE LINE MOTORSPORTS": teamLogoNLM,
  "Nine Line Motorsports": teamLogoNLM,

  MMS: teamLogoMMS,
  "MAYHEM MOTORSPORTS": teamLogoMMS,
  "Mayhem Motorsports": teamLogoMMS,

  IND: teamLogoIND,
  Independent: teamLogoIND,

  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,

  BWR: teamLogoBWR,
  "Big Wheel Racing": teamLogoBWR,

  BXM: teamLogoBXM,
  "BayouX Motorsports": teamLogoBXM,
};

export const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};

export const teamFullNames = {
  B2J: "B2J Motorsports",
  "B2J MOTORSPORTS": "B2J Motorsports",
  "B2J Motorsports": "B2J Motorsports",

  MER: "ME Racing",
  "ME RACING": "ME Racing",
  "ME Racing": "ME Racing",

  MMS: "Mayhem Motorsports",
  "Mayhem Motorsports": "Mayhem Motorsports",

  NLM: "Nine Line Motorsports",
  "Nine Line Motorsports": "Nine Line Motorsports",

  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",

  BWR: "Big Wheel Racing",
  "Big Wheel Racing": "Big Wheel Racing",

  BXM: "BayouX Motorsports",
  "BayouX Motorsports": "BayouX Motorsports",

  IND: "Independent",
  Independent: "Independent",
};

export const teamBudgets = {
  B2J: 3500000,
  "B2J MOTORSPORTS": 3500000,
  "B2J Motorsports": 3500000,
};

export const teamBranding = {
  B2J: { logo: "B2J", accent: "#d4af37", dark: "#1b1b1b", fullName: "B2J Motorsports" },
  "B2J MOTORSPORTS": { logo: "B2J", accent: "#d4af37", dark: "#1b1b1b", fullName: "B2J Motorsports" },
  "B2J Motorsports": { logo: "B2J", accent: "#d4af37", dark: "#1b1b1b", fullName: "B2J Motorsports" },

  MER: { logo: "MER", accent: "#dc2626", dark: "#200a0a", fullName: "ME Racing" },
  "ME Racing": { logo: "MER", accent: "#dc2626", dark: "#200a0a", fullName: "ME Racing" },

  MMS: { logo: "MMS", accent: "#9333ea", dark: "#150a2e", fullName: "Mayhem Motorsports" },

  NLM: { logo: "NLM", accent: "#f97316", dark: "#1f0e00", fullName: "Nine Line Motorsports" },

  Independent: { logo: "IND", accent: "#808080", dark: "#2a2a2a", fullName: "Independent" },
  IND: { logo: "IND", accent: "#808080", dark: "#2a2a2a", fullName: "Independent" },

  "19XI": { logo: "19XI", accent: "#8b5cf6", dark: "#160b2d", fullName: "19XI Racing" },
  "19XI Racing": { logo: "19XI", accent: "#8b5cf6", dark: "#160b2d", fullName: "19XI Racing" },

  BWR: { logo: "BWR", accent: "#2563eb", dark: "#0f172a", fullName: "Big Wheel Racing" },

  BXM: { logo: "BXM", accent: "#2563eb", dark: "#0f172a", fullName: "BayouX Motorsports" },
  "BayouX Motorsports": { logo: "BXM", accent: "#2563eb", dark: "#0f172a", fullName: "BayouX Motorsports" },
};

export function getTeamFullName(teamAbbr) {
  return teamFullNames[teamAbbr] || teamAbbr;
}

export function getTeamBudget(teamAbbr) {
  return teamBudgets[teamAbbr] || teamBudgets[getTeamFullName(teamAbbr)?.toUpperCase?.()] || 0;
}

export function getTeamBranding(teamName) {
  return (
    teamBranding[teamName] || {
      logo: teamName?.charAt(0)?.toUpperCase() || "?",
      accent: "#d4af37",
      dark: "#161a20",
      fullName: teamName || "Unknown Team",
    }
  );
}
