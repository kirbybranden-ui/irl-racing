import React from "react";
import "./mobile.css";

export default function MobileApp({
  drivers = [],
  teams = [],
  manufacturerStandings = [],
  seasonName = "",
  tracks = [],
  raceHistory = [],
}) {
  const path = window.location.pathname.toLowerCase();

  if (path === "/" || path === "/standings") {
    return <MobileStandings drivers={drivers} seasonName={seasonName} />;
  }

  if (path.startsWith("/driver/")) {
    const number = path.split("/driver/")[1];
    const driver = drivers.find((d) => String(d.number) === String(number));
    return <MobileDriverProfile driver={driver} />;
  }

  if (path === "/news" || path === "/submit-story") {
    return <MobileNews />;
  }

  if (path === "/streams") {
    return <MobileStreams />;
  }

  if (path === "/owners" || path === "/team-hq" || path === "/hq") {
    return <MobileTeamHQ teams={teams} drivers={drivers} />;
  }

  if (path === "/interviews") {
    return <MobileSimplePage title="Interviews" icon="🎙️" text="Driver interviews, pre-race, and post-race media center." />;
  }

  if (path === "/contracts") {
    return <MobileSimplePage title="Contracts" icon="📝" text="Driver contracts and team offers." />;
  }

  if (path === "/chat" || path === "/message-center") {
    return <MobileSimplePage title="League Chat" icon="💬" text="League messages, owner messages, and driver communication." />;
  }

  if (path.includes("vote") || path === "/paint-scheme-vote") {
    return <MobileSimplePage title="Voting" icon="🗳️" text="League votes and paint scheme voting." />;
  }

  if (path.includes("appeal")) {
    return <MobileSimplePage title="Appeals" icon="⚖️" text="Submit and review league appeals." />;
  }

  if (path === "/notifications") {
    return <MobileSimplePage title="Notifications" icon="🔔" text="Interview reminders, votes, messages, and league alerts." />;
  }

  return <MobileHome drivers={drivers} teams={teams} manufacturerStandings={manufacturerStandings} tracks={tracks} seasonName={seasonName} />;
}

function MobileLayout({ title, children }) {
  return (
    <div className="bcl-mobile-app">
      <header className="bcl-mobile-topbar">
        <div>
          <div className="bcl-mobile-kicker">Budweiser Cup</div>
          <strong>{title}</strong>
        </div>
        <button onClick={() => (window.location.href = "/notifications")}>🔔</button>
      </header>

      <main className="bcl-mobile-content">{children}</main>

      <nav className="bcl-mobile-bottom-nav">
        <button onClick={() => (window.location.href = "/")}>🏁<span>Home</span></button>
        <button onClick={() => (window.location.href = "/standings")}>📊<span>Standings</span></button>
        <button onClick={() => (window.location.href = "/news")}>📰<span>News</span></button>
        <button onClick={() => (window.location.href = "/streams")}>📺<span>Streams</span></button>
        <button onClick={() => (window.location.href = "/owners")}>🏢<span>HQ</span></button>
      </nav>
    </div>
  );
}

function MobileHome({ drivers, teams, manufacturerStandings, tracks, seasonName }) {
  const leader = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0))[0];
  const nextRace = tracks?.[0];

  return (
    <MobileLayout title="Race Hub">
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">{seasonName || "Current Season"}</div>
        <h1>League Race Hub</h1>
        <p>News, standings, streams, teams, and driver updates.</p>
      </section>

      <section className="bcl-mobile-card gold">
        <div className="bcl-mobile-kicker">Next Race</div>
        <h2>{nextRace?.name || "Race Schedule"}</h2>
        <p>Qualifying 9:15 PM ET • Race 9:30 PM ET</p>
      </section>

      {leader && (
        <section className="bcl-mobile-card">
          <div className="bcl-mobile-kicker">Points Leader</div>
          <h2>#{leader.number} {leader.name}</h2>
          <p>{leader.team || "Independent"} • {leader.manufacturer}</p>
          <strong>{leader.points || 0} points</strong>
        </section>
      )}

      <div className="bcl-mobile-grid">
        <button onClick={() => (window.location.href = "/standings")}>📊 Standings</button>
        <button onClick={() => (window.location.href = "/news")}>📰 News</button>
        <button onClick={() => (window.location.href = "/interviews")}>🎙️ Interviews</button>
        <button onClick={() => (window.location.href = "/paint-scheme-vote")}>🗳️ Voting</button>
        <button onClick={() => (window.location.href = "/chat")}>💬 Chat</button>
        <button onClick={() => (window.location.href = "/contracts")}>📝 Contracts</button>
      </div>
    </MobileLayout>
  );
}

function MobileStandings({ drivers, seasonName }) {
  const sorted = [...drivers].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <MobileLayout title="Standings">
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">{seasonName || "Season"}</div>
        <h1>Driver Standings</h1>
      </section>

      {sorted.map((d, index) => (
        <button
          key={`${d.number}-${d.name}`}
          className="bcl-mobile-driver-card"
          onClick={() => (window.location.href = `/driver/${d.number}`)}
        >
          <div className="bcl-mobile-rank">{index + 1}</div>
          <div>
            <strong>#{d.number} {d.name}</strong>
            <span>{d.team || "Independent"} • {d.manufacturer}</span>
          </div>
          <div className="bcl-mobile-points">
            {d.points || 0}
            <small>PTS</small>
          </div>
        </button>
      ))}
    </MobileLayout>
  );
}

function MobileDriverProfile({ driver }) {
  if (!driver) {
    return <MobileSimplePage title="Driver" icon="👤" text="Driver not found." />;
  }

  return (
    <MobileLayout title={`#${driver.number}`}>
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">Driver Profile</div>
        <h1>#{driver.number} {driver.name}</h1>
        <p>{driver.team || "Independent"} • {driver.manufacturer}</p>
      </section>

      <div className="bcl-mobile-stats">
        <div><strong>{driver.points || 0}</strong><span>Points</span></div>
        <div><strong>{driver.wins || 0}</strong><span>Wins</span></div>
        <div><strong>{driver.top3 || 0}</strong><span>Top 3</span></div>
        <div><strong>{driver.top5 || 0}</strong><span>Top 5</span></div>
      </div>

      <div className="bcl-mobile-grid">
        <button onClick={() => (window.location.href = "/interviews")}>🎙️ Interviews</button>
        <button onClick={() => (window.location.href = "/contracts")}>📝 Contract</button>
        <button onClick={() => (window.location.href = "/paint-scheme-vote")}>🗳️ Vote</button>
        <button onClick={() => (window.location.href = "/notifications")}>🔔 Alerts</button>
      </div>
    </MobileLayout>
  );
}

function MobileTeamHQ({ teams, drivers }) {
  return (
    <MobileLayout title="Team HQ">
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">Owner Center</div>
        <h1>Team HQ</h1>
        <p>Manage drivers, contracts, tasks, messages, and budgets.</p>
      </section>

      <div className="bcl-mobile-grid">
        <button>💰 Budgets</button>
        <button>👥 Drivers</button>
        <button>📝 Contracts</button>
        <button>✅ Tasks</button>
        <button>💬 Messages</button>
        <button>🏁 Start & Park</button>
      </div>

      {teams?.map((team) => (
        <div key={team.team} className="bcl-mobile-card">
          <h2>{team.team}</h2>
          <p>{team.points || 0} points • {team.wins || 0} wins</p>
        </div>
      ))}
    </MobileLayout>
  );
}

function MobileNews() {
  return (
    <MobileLayout title="News">
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">Garage Talk</div>
        <h1>League News</h1>
        <p>Stories, team updates, penalties, signings, and race coverage.</p>
      </section>

      <div className="bcl-mobile-card">
        <div className="bcl-mobile-kicker">Latest</div>
        <h2>News Feed</h2>
        <p>Use desktop for full story management. Mobile news feed is now active.</p>
      </div>
    </MobileLayout>
  );
}

function MobileStreams() {
  return (
    <MobileLayout title="Streams">
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">Watch Live</div>
        <h1>Streams</h1>
        <p>Twitch, YouTube, watch party, and league broadcast links.</p>
      </section>

      <div className="bcl-mobile-card">
        <h2>📺 Stream Center</h2>
        <p>Open the full streams page on desktop for admin edits. Mobile stream cards are ready.</p>
      </div>
    </MobileLayout>
  );
}

function MobileSimplePage({ title, icon, text }) {
  return (
    <MobileLayout title={title}>
      <section className="bcl-mobile-hero">
        <div className="bcl-mobile-kicker">Mobile Center</div>
        <h1>{icon} {title}</h1>
        <p>{text}</p>
      </section>

      <div className="bcl-mobile-card">
        <h2>{title}</h2>
        <p>This page is now routed through the NASCAR-style mobile app.</p>
      </div>
    </MobileLayout>
  );
}
