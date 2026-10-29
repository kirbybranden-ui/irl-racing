const key = value => String(value ?? "").trim().toLowerCase();
const num = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const finish = row => { const n = Number(row.finishPos); return n > 0 && Number.isFinite(n) ? n : null; };
export function driverCareerStats(seasons = [], seasonId, me) {
  const name = key(me.gamertag), identity = key(me.driver_id);
  const records = seasons.map(season => {
    const roster = Array.isArray(season.drivers) ? season.drivers : [];
    const driver = roster.find(d => key(d.name) === name) || roster.find(d => key(d.id) === identity && !key(d.name));
    const ids = new Set([...(driver ? [key(driver.id)] : []), identity]);
    const races = (season.raceHistory || []).flatMap((race, raceIndex) => {
      const result = (race.results || []).find(r => {
        const resultName = key(r.name || r.driverName);
        if (resultName) return resultName === name;
        if (!ids.has(key(r.driverId))) return false;
        const historicalDriver = roster.find(d => key(d.id) === key(r.driverId));
        return !historicalDriver || !key(historicalDriver.name) || key(historicalDriver.name) === name;
      });
      return result ? [{ ...result, raceName: race.raceName || "Race", date: race.date || race.raceDate || race.recordedAt || "", seasonName: season.name, raceIndex }] : [];
    });
    const finishes = races.map(finish).filter(n => n !== null);
    const count = check => races.filter(check).length;
    const summary = {
      starts: races.length, wins: count(r => r.isWin === true || finish(r) === 1), podiums: count(r => r.isTop3 === true || (finish(r) !== null && finish(r) <= 3)),
      top5: count(r => r.isTop5 === true || (finish(r) !== null && finish(r) <= 5)), top10: count(r => finish(r) !== null && finish(r) <= 10),
      dnfs: count(r => r.dnf === true), fastestLaps: count(r => r.fastestLap === true),
      points: driver && driver.points != null ? num(driver.points) : races.reduce((s,r) => s + num(r.totalRacePoints), 0),
      penalties: races.reduce((s,r) => s + num(r.penaltyPoints), 0), finishes,
    };
    if (!races.length && driver) {
      summary.wins = num(driver.wins); summary.podiums = num(driver.top3); summary.top5 = num(driver.top5); summary.dnfs = num(driver.dnfs); summary.fastestLaps = num(driver.fastestLaps);
    }
    const sorted = [...roster].filter(d => d.retired !== true).sort((a,b) => num(b.points) - num(a.points) || num(b.wins) - num(a.wins) || num(b.top3) - num(a.top3));
    const rankIndex = driver ? sorted.findIndex(d => key(d.id) === key(driver.id)) : -1;
    return { season, driver, races, ...summary, rank: rankIndex >= 0 ? rankIndex + 1 : null, gap: driver && sorted[0] ? Math.max(0, num(sorted[0].points) - num(driver.points)) : null };
  });
  const current = records.find(r => String(r.season.id) === String(seasonId));
  const overall = records.reduce((total,r) => {
    for (const field of ['starts','wins','podiums','top5','top10','dnfs','fastestLaps','points','penalties']) total[field] += r[field];
    total.finishes.push(...r.finishes); return total;
  }, { starts:0,wins:0,podiums:0,top5:0,top10:0,dnfs:0,fastestLaps:0,points:0,penalties:0,finishes:[] });
  const metrics = r => r ? { ...r, average: r.finishes.length ? (r.finishes.reduce((s,n) => s+n,0)/r.finishes.length).toFixed(1) : '—', best: r.finishes.length ? Math.min(...r.finishes) : '—', winRate: r.starts ? `${(r.wins/r.starts*100).toFixed(1)}%` : '—' } : null;
  return { current:metrics(current), overall:metrics(overall), seasons:records };
}
