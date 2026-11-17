import React, { useMemo, useState } from "react";
import { useLeagueAccess, canManageTeam } from "../lib/roleAccess";
import { getTeamFullName } from "../data/teams";
import { buildTeamDriverPerformance } from "../lib/teamDriverPerformance";
import "./TeamDriverPerformancePage.css";

const number = (value, digits = 1) => value === null || value === undefined ? "—" : Number(value).toFixed(digits);
const integer = (value) => Number(value || 0).toLocaleString();
const SORTS = [
  { value: "points", label: "Season points", descending: true },
  { value: "pointsPerStart", label: "Points per start", descending: true },
  { value: "avgFinish", label: "Average finish", descending: false },
  { value: "recentAvg", label: "Last 5 average", descending: false },
  { value: "wins", label: "Wins", descending: true },
  { value: "top5", label: "Top 5 finishes", descending: true },
  { value: "dnfs", label: "Fewest DNFs", descending: false },
];

function Metric({ label, value, sub }) {
  return <div className="brl-performance-metric"><span>{label}</span><strong>{value}</strong>{sub && <small>{sub}</small>}</div>;
}

export default function TeamDriverPerformancePage({ drivers = [], teams = [], raceHistory = [], seasonName = "" }) {
  const { access, loading, error } = useLeagueAccess();
  const [requestedTeam, setRequestedTeam] = useState("");
  const [sort, setSort] = useState("pointsPerStart");
  const [selectedDriver, setSelectedDriver] = useState("");

  const authorizedTeams = useMemo(() => {
    if (!access) return [];
    const codes = new Set([
      ...(Array.isArray(drivers) ? drivers : []).map((d) => String(d?.team || "").trim()),
      ...(Array.isArray(teams) ? teams : []).map((t) => String(t?.team || "").trim()),
    ].filter(Boolean));
    return [...codes].filter((code) => canManageTeam(access, code)).sort();
  }, [access, drivers, teams]);

  const teamCode = authorizedTeams.includes(requestedTeam) ? requestedTeam : authorizedTeams[0] || "";
  const performance = useMemo(
    () => teamCode ? buildTeamDriverPerformance(drivers, raceHistory, teamCode) : [],
    [drivers, raceHistory, teamCode]
  );
  const ordered = useMemo(() => {
    const option = SORTS.find((s) => s.value === sort) || SORTS[0];
    return [...performance].sort((a, b) => {
      const av = a[option.value], bv = b[option.value];
      if (av === null && bv !== null) return 1;
      if (bv === null && av !== null) return -1;
      if (av !== null && bv !== null && av !== bv) return option.descending ? bv - av : av - bv;
      return b.points - a.points || a.name.localeCompare(b.name);
    });
  }, [performance, sort]);
  const detail = performance.find((d) => d.id === selectedDriver) || ordered[0] || null;
  const racesRecorded = (Array.isArray(raceHistory) ? raceHistory : []).filter((r) => Array.isArray(r?.results) && !r.isPreseason && !r.preseason && !/^pre[\s-]?season\b/i.test(String(r?.raceName || ""))).length;
  const sum = (field) => performance.reduce((total, driver) => total + driver[field], 0);
  const teamAverage = performance.flatMap((d) => d.results.map((r) => r.finish).filter((f) => f !== null));
  const averageFinish = teamAverage.length ? teamAverage.reduce((a, b) => a + b, 0) / teamAverage.length : null;

  if (loading && !access) return <section className="brl-performance-empty" role="status">Verifying your Owner HQ access…</section>;
  if (!authorizedTeams.length) return <section className="brl-performance-empty" role="status">{error || "No approved team is available for this account. Owner access is required to view team driver performance."}</section>;

  return <section className="brl-performance-page" aria-label="Team driver performance">
    <div className="brl-performance-hero">
      <div><div className="brl-performance-kicker">OWNER HQ / TEAM ANALYTICS</div><h2>Driver performance</h2><p>Compare your roster using official current-season Cup results, consistency and points production.</p></div>
      <div className="brl-performance-controls">
        {authorizedTeams.length > 1 && <label>Team<select value={teamCode} onChange={(e) => { setRequestedTeam(e.target.value); setSelectedDriver(""); }}>{authorizedTeams.map((code) => <option key={code} value={code}>{getTeamFullName(code)} ({code})</option>)}</select></label>}
        <label>Rank by<select value={sort} onChange={(e) => setSort(e.target.value)}>{SORTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      </div>
    </div>
    <p className="brl-performance-context"><strong>{getTeamFullName(teamCode)}</strong> · {seasonName || "Active season"} · {racesRecorded} recorded race{racesRecorded === 1 ? "" : "s"}</p>
    <div className="brl-performance-summary">
      <Metric label="Roster drivers" value={performance.length} sub="Current Cup lineup" />
      <Metric label="Team driver wins" value={sum("wins")} sub="Recorded finishes" />
      <Metric label="Average finish" value={number(averageFinish)} sub="Across recorded finishes" />
      <Metric label="Top 5 finishes" value={sum("top5")} sub="All team drivers" />
    </div>
    {!performance.length ? <div className="brl-performance-empty">No active Cup drivers are listed for this team in the current season.</div> : <>
      <div className="brl-performance-section-heading"><div><h3>Driver leaderboard</h3><p>Sort by performance metric. Select a driver to review individual race results.</p></div></div>
      <div className="brl-performance-table-wrap"><table className="brl-performance-table"><thead><tr><th>Driver</th><th>Pts</th><th>Starts</th><th>Pts / start</th><th>Avg finish</th><th>Last 5</th><th>Wins</th><th>Top 5</th><th>DNF</th></tr></thead><tbody>{ordered.map((d, index) => <tr key={d.id} className={detail?.id === d.id ? "is-selected" : ""}><td><button type="button" className="brl-performance-driver-button" onClick={() => setSelectedDriver(d.id)} aria-pressed={detail?.id === d.id}><span className="brl-performance-rank">{index + 1}</span><span><strong>#{d.number ?? "—"} {d.name}</strong><small>View race breakdown</small></span></button></td><td>{integer(d.points)}</td><td>{d.starts}</td><td>{number(d.pointsPerStart)}</td><td>{number(d.avgFinish)}</td><td>{number(d.recentAvg)}</td><td>{d.wins}</td><td>{d.top5}</td><td>{d.dnfs}</td></tr>)}</tbody></table></div>
      {racesRecorded === 0 && <p className="brl-performance-note">No official race results have been recorded for this season. Season standings points may be visible, but averages and per-race statistics will appear as results are posted.</p>}
      {detail && <div className="brl-performance-detail" key={`${teamCode}-${detail.id}`}>
        <div className="brl-performance-detail-heading"><div><div className="brl-performance-kicker">Driver analysis</div><h3>#{detail.number ?? "—"} {detail.name}</h3></div><span>{detail.starts} recorded start{detail.starts === 1 ? "" : "s"}</span></div>
        <div className="brl-performance-summary brl-performance-summary-detail">
          <Metric label="Average finish" value={number(detail.avgFinish)} sub={`Median: ${number(detail.medianFinish)}`} />
          <Metric label="Best finish" value={detail.bestFinish !== null ? `P${detail.bestFinish}` : "—"} sub={`${detail.top3} top 3 · ${detail.top10} top 10`} />
          <Metric label="Finish rate" value={detail.finishRate === null ? "—" : `${number(detail.finishRate, 0)}%`} sub={`${detail.dnfs} DNF${detail.dnfs === 1 ? "" : "s"}`} />
          <Metric label="Fastest laps" value={detail.fastestLaps} sub={`${integer(detail.penaltyPoints)} penalty pts recorded`} />
        </div>
        <h4>Recent finishing positions</h4>
        {detail.results.length ? <div className="brl-performance-trend">{detail.results.slice(-8).map((r, i) => <div key={`${r.raceName}-${i}`} className="brl-performance-trend-item"><span title={r.raceName}>{r.raceName}</span><strong>{r.finish === null ? (r.dnf ? "DNF" : "—") : `P${r.finish}`}</strong><div className="brl-performance-trend-track"><div style={{ width: r.finish !== null ? `${Math.max(5, 100 - (r.finish - 1) * 2.5)}%` : "0%" }} /></div></div>)}</div> : <p className="brl-performance-note">This driver has no recorded official race starts yet.</p>}
        <h4>Race-by-race results</h4>
        <div className="brl-performance-table-wrap"><table className="brl-performance-table"><thead><tr><th>Race</th><th>Finish</th><th>Points</th><th>DNF</th><th>Fastest lap</th><th>Penalty pts</th></tr></thead><tbody>{detail.results.length ? [...detail.results].reverse().map((r, i) => <tr key={`${r.raceName}-${i}`}><td>{r.raceName}</td><td>{r.finish === null ? "—" : `P${r.finish}`}</td><td>{r.points === null ? "—" : integer(r.points)}</td><td>{r.dnf ? "Yes" : "No"}</td><td>{r.fastestLap ? "Yes" : "No"}</td><td>{r.penaltyPoints === null ? "—" : integer(r.penaltyPoints)}</td></tr>) : <tr><td colSpan={6}>No recorded starts for this driver.</td></tr>}</tbody></table></div>
      </div>}
    </>}
    <p className="brl-performance-footnote">Current Season 2 Cup data only. Preseason and historical seasons are excluded. Car numbers may change; results are matched by gamertag and checked against the recorded team. A dash means no result is available. Race points and official standings points can differ because of adjustments. Substitutes are not treated as contracted roster drivers.</p>
  </section>;
}
