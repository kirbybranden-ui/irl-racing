import { useSyncExternalStore } from "react";
import { loadLeagueState } from "./leagueState";

export const isChallengeRoute = (href = "") => ["/tournament", "/bracket", "/in-season-tournament", "/in-season-bracket"].includes(href.split(/[?#]/)[0]);
export const challengeEnabledForSeason = (season) => season?.inSeasonChallengeEnabled !== false;
let snapshot = { enabled: true, loading: true, error: "" };
let pending = null, timer = null, generation = 0;
const listeners = new Set();
function publish(next) { snapshot = next; listeners.forEach((listener) => listener()); }
export function publishChallengeSetting(enabled) {
  generation += 1;
  publish({ enabled, loading: false, error: "" });
}
async function refresh() {
  if (pending) return pending;
  const started = generation;
  pending = (async () => {
    try {
      const data = await loadLeagueState();
      if (!data?.seasons?.length) throw new Error("Challenge settings could not be loaded. Refresh to try again.");
      const season = data.seasons.find((item) => item.id === data.activeSeasonId) || data.seasons[0];
      if (started === generation) publish({ enabled: challengeEnabledForSeason(season), loading: false, error: "" });
    } catch (error) {
      if (started === generation) publish({ ...snapshot, loading: false, error: error.message });
    } finally { pending = null; }
  })();
  return pending;
}
function subscribe(listener) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("brl:bank-state-changed", refresh);
    timer = window.setInterval(refresh, 30000);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("brl:bank-state-changed", refresh);
      window.clearInterval(timer);
    }
  };
}
export function useInSeasonChallenge() {
  const state = useSyncExternalStore(subscribe, () => snapshot);
  return { ...state, visible: !state.loading && !state.error && state.enabled };
}
