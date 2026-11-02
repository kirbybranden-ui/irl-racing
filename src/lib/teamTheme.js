const validHex = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || "") ? value.toLowerCase() : fallback;
const rgb = value => [1, 3, 5].map(start => parseInt(value.slice(start, start + 2), 16));
const hex = channels => `#${channels.map(value => Math.round(value).toString(16).padStart(2, "0")).join("")}`;
const mix = (first, second, weight) => hex(rgb(first).map((value, i) => value * (1 - weight) + rgb(second)[i] * weight));
function luminance(color) {
  const channels = rgb(color).map(value => { const s = value / 255;return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
export function contrastRatio(first, second) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
function readable(color, background) {
  if (contrastRatio(color, background) >= 4.5) return color;
  const target = contrastRatio("#111216", background) > contrastRatio("#ffffff", background) ? "#111216" : "#ffffff";
  for (let step = 1; step <= 10; step += 1) { const candidate = mix(color, target, step / 10);if (contrastRatio(candidate, background) >= 4.5) return candidate; }
  return target;
}
const key = value => String(value || "").trim().toLowerCase();
export function findTeamKey(value, branding = {}, names = {}, identifiers = {}) {
  const wanted = key(value);
  if (!wanted) return "";
  return Object.keys(branding).find(code => key(code) === wanted) ||
    Object.keys(branding).find(code => [branding[code]?.fullName, names[code], identifiers[code]].some(alias => key(alias) === wanted)) ||
    Object.keys(names).find(code => key(code) === wanted || key(names[code]) === wanted) || String(value).trim();
}
export function makeTeamTheme(branding = {}) {
  const accent = validHex(branding.accent, "#64748b"), dark = validHex(branding.dark, "#161a20");
  const onAccent = contrastRatio("#111216", accent) > contrastRatio("#ffffff", accent) ? "#111216" : "#ffffff";
  const onDark = contrastRatio("#111216", dark) > contrastRatio("#ffffff", dark) ? "#111216" : "#ffffff";
  const soft = mix(accent, "#ffffff", 0.94), ink = readable(accent, soft);
  return { ...branding, accent, dark, ink, onAccent, onDark, soft, border: mix(accent, "#ffffff", 0.65),
    glow: `rgba(${rgb(accent).join(",")},0.25)`,
    style: { "--brl-team-accent": accent, "--brl-team-ink": ink, "--brl-team-dark": dark, "--brl-team-on-accent": onAccent, "--brl-team-on-dark": onDark, "--brl-team-soft": soft, "--brl-team-border": mix(accent, "#ffffff", 0.65) },
  };
}

export function careerTeamCode(data, seasons, activeSeasonId, ownerWorkspace) {
  if (!data?.me) return "";
  const me = data.me;
  if (ownerWorkspace) return (data.teams || []).find(t => t.owner_user === me.user_id && t.status === "approved")?.code || "";
  const season = (seasons || []).find(s => String(s.id) === String(activeSeasonId));
  const roster = season?.drivers || [];
  const driver = (key(me.gamertag) && roster.find(d => key(d.name) === key(me.gamertag))) || (me.driver_id != null && roster.find(d => !d.name && String(d.id) === String(me.driver_id)));
  if (driver) return driver.team || "";
  const contract = (data.contracts || []).find(c => c.driver_user === me.user_id && c.status === "active");
  return (data.teams || []).find(t => t.id === contract?.team_id && t.status === "approved")?.code || "";
}
