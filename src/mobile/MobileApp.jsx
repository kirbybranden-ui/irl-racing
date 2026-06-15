import React from "react";
import "./mobile.css";

export default function MobileApp({
  drivers,
  teams,
  manufacturerStandings,
  seasonName,
  tracks,
  raceHistory,
}) {
  const path = window.location.pathname.toLowerCase();

  if (path === "/standings" || path === "/") {
    return <MobileStandings drivers={drivers} seasonName={seasonName} />;
  }

  if (path === "/news") {
    return <MobileSimplePage title="News" text="Mobile news page coming next." />;
  }

  if (path === "/streams") {
    return <MobileSimplePage title="Streams" text="Mobile streams page coming next." />;
  }

  if (path === "/team-hq" || path === "/owners") {
    return <MobileSimplePage title="Team HQ" text="Mobile Team HQ coming next." />;
  }

  return <MobileHome drivers={drivers} seasonName={seasonName} />;
}

function MobileHome({ drivers, seasonName }) {
  const leader = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0))[0];

  return (
    <MobileLayout title="Budweiser Cup">
      <div className="mobile-hero">
        <div className="mobile-kicker">{seasonName || "Season"}</div>
        <h1>League Hub</h1>
        <p>Mobile version is live.</p>
      </div>

      {leader && (
        <div className="mobile-card">
          <div className="mobile-kicker">Points Leader</div>
          <h2>#{leader.number} {leader.name}</h2>
          <p>{leader.team} • {leader.manufacturer}</p>
          <strong>{leader.points || 0} pts</strong>
        </div>
      )}
    </MobileLayout>
  );
}

function MobileStandings({ drivers, seasonName }) {
  const sortedDrivers = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <MobileLayout title="Standings">
      <div className="mobile-hero">
        <div className="mobile-kicker">{seasonName || "Current Season"}</div>
        <h1>Driver Standings</h1>
      </div>

      {sortedDrivers.map((driver, index) => (
        <button
          key={`${driver.number}-${driver.name}`}
          className="mobile-driver-card"
          onClick={() => (window.location.pathname = `/driver/${driver.number}`)}
        >
          <div className="mobile-rank">{index + 1}</div>

          <div className="mobile-driver-info">
            <strong>#{driver.number} {driver.name}</strong>
            <span>{driver.team || "Independent"} • {driver.manufacturer}</span>
          </div>

          <div className="mobile-points">
            {driver.points || 0}
            <span>PTS</span>
          </div>
        </button>
      ))}
    </MobileLayout>
  );
}

function MobileSimplePage({ title, text }) {
  return (
    <MobileLayout title={title}>
      <div className="mobile-card">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </MobileLayout>
  );
}

function MobileLayout({ title, children }) {
  return (
    <div className="mobile-app">
      <header className="mobile-topbar">
        <strong>{title}</strong>
        <button onClick={() => (window.location.pathname = "/notifications")}>🔔</button>
      </header>

      <main className="mobile-content">{children}</main>

      <nav className="mobile-bottom-nav">
        <button onClick={() => (window.location.pathname = "/")}>🏁<span>Home</span></button>
        <button onClick={() => (window.location.pathname = "/standings")}>📊<span>Standings</span></button>
        <button onClick={() => (window.location.pathname = "/news")}>📰<span>News</span></button>
        <button onClick={() => (window.location.pathname = "/streams")}>📡<span>Streams</span></button>
        <button onClick={() => (window.location.pathname = "/team-hq")}>🏢<span>HQ</span></button>
      </nav>
    </div>
  );
}