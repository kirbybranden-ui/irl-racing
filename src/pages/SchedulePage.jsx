import TrackGuide from "../components/TrackGuide";
import { trackKey } from "../utils/trackStrategy";
import React, { useMemo } from "react";
import { getSortedTracksByDate, getUpcomingRaceByDate } from "../utils/raceHelpers";
import { getTrackOverview } from "../data/trackOverview";

export default function SchedulePage({ tracks = [], raceHistory = [], seasons = [], activeSeasonId = "" }) {
  const sorted = useMemo(() => getSortedTracksByDate(tracks || []), [tracks]);
  const upcoming = useMemo(() => getUpcomingRaceByDate(tracks || []), [tracks]);
  const completed = new Set((raceHistory || []).map(r => String(r.raceName || r.track || r.name || r.race || "").toLowerCase()));
  const selected = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("selected") : "";
  const selectedTrack = tracks.find(t => t.name === selected);
  if (selectedTrack) return <TrackGuide track={selectedTrack} seasons={seasons} activeSeasonId={activeSeasonId}/>;
  return (
    <div className="brl-schedule-page">
      <section className="brl-route-hero">
        <span className="brl-flow-kicker">RACE WEEK</span>
        <h1>Season Schedule</h1>
        <p>What's next, what's complete, and every stop on the BRL calendar.</p>
        {upcoming && <a className="brl-primary-action" href={`#race-${encodeURIComponent(upcoming.name || upcoming.track || "next")}`}>View next race <span>→</span></a>}
      </section>
      {upcoming && <section className="brl-next-race-flow">
        <div><small>NEXT UP</small><h2>{upcoming.name || upcoming.track}</h2><p>{upcoming.date || "Date TBD"}{upcoming.time ? ` • ${upcoming.time}` : ""}</p></div>
        <strong>{String(sorted.findIndex(t => t === upcoming) + 1).padStart(2,"0")}</strong>
      </section>}
      <section className="brl-schedule-flow">
        {sorted.map((track, index) => {
          const name = track.name || track.track || `Race ${index + 1}`;
          const overview = getTrackOverview(track);
          const isNext = upcoming && String(upcoming.name || upcoming.track) === String(name);
          const isDone = completed.has(String(name).toLowerCase());
          return <article id={`race-${encodeURIComponent(name)}`} className={`brl-race-row ${isNext ? "is-next" : ""}`} key={`${name}-${track.date || index}`}>
            <div className="brl-race-index">{String(index+1).padStart(2,"0")}</div>
            <div className="brl-race-main"><small>{track.phase || "Regular Season"} · {isNext ? "NEXT RACE" : isDone ? "COMPLETED" : "SCHEDULED"}</small>{overview.imageUrl && <img className="brl-schedule-photo" src={overview.imageUrl} alt={`${name} track`} onError={e=>{e.currentTarget.style.display="none";}}/>}<h3>{name}</h3><a className="brl-guide-link" href={`/schedule?selected=${encodeURIComponent(name)}`}>Track guide &amp; strategy →</a><p>{track.date || "Date TBD"}{track.time ? ` • ${track.time}` : ""}</p></div>
            <div className="brl-race-meta">{track.eventLabel && <span>{track.eventLabel}</span>}<span>{track.stageCount || 2} stages</span>{overview.type && <span>{overview.type}</span>}{overview.length && <span>{overview.length}</span>}{overview.pitSpeed && <span>Pit {overview.pitSpeed}</span>}</div>
          </article>;
        })}
        {!sorted.length && <div className="brl-empty-state">No schedule has been published yet.</div>}
      </section>
    </div>
  );
}
