import React, { useMemo, useState } from "react";
import "./mobile.css";

const pages = {
  home: "Home",
  standings: "Standings",
  news: "News",
  streams: "Streams",
  hq: "Team HQ",
  drivers: "Drivers",
  interviews: "Interviews",
  contracts: "Contracts",
  notifications: "Alerts",
  chat: "Chat",
  voting: "Voting",
  appeals: "Appeals",
  owners: "Owners",
};

function getInitialPage() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("standings")) return "standings";
  if (path.includes("streams")) return "streams";
  if (path.includes("news")) return "news";
  if (path.includes("hq") || path.includes("owner")) return "hq";
  if (path.includes("interviews")) return "interviews";
  if (path.includes("contracts")) return "contracts";
  if (path.includes("chat")) return "chat";
  if (path.includes("vote")) return "voting";
  if (path.includes("appeal")) return "appeals";
  if (path.includes("driver")) return "drivers";
  return "home";
}

function MobileTopBar({ page, setPage }) {
  return (
    <header className="m-topbar">
      <div>
        <div className="m-kicker">Budweiser Cup League</div>
        <h1>{pages[page]}</h1>
      </div>
      <button className="m-alert-btn" onClick={() => setPage("notifications")}>🔔</button>
    </header>
  );
}

function MobileBottomNav({ page, setPage }) {
  const items = [
    ["home", "🏁", "Home"],
    ["standings", "🏆", "Standings"],
    ["news", "📰", "News"],
    ["streams", "📺", "Streams"],
    ["hq", "🏢", "Team HQ"],
  ];
  return (
    <nav className="m-bottomnav">
      {items.map(([key, icon, label]) => (
        <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>
          <span>{icon}</span><small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function MobileCard({ title, children, action }) {
  return <section className="m-card"><div className="m-card-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

function MobileHome({ setPage }) {
  return (
    <main className="m-page">
      <div className="m-hero">
        <div className="m-kicker">Race Center</div>
        <h2>Mobile Command Center</h2>
        <p>Standings, news, streams, interviews, voting, contracts, and Team HQ built for phones.</p>
      </div>
      <div className="m-grid2">
        {[["standings","Standings"],["drivers","Drivers"],["interviews","Interviews"],["contracts","Contracts"],["voting","Voting"],["chat","League Chat"],["appeals","Appeals"],["owners","Owners"]].map(([key,label]) => (
          <button className="m-tile" key={key} onClick={() => setPage(key)}>{label}</button>
        ))}
      </div>
    </main>
  );
}

function MobilePlaceholder({ name, note }) {
  return (
    <main className="m-page">
      <MobileCard title={name}>
        <p>{note || "This mobile page is ready for your existing Supabase-powered content to be dropped in without touching the desktop UI."}</p>
      </MobileCard>
    </main>
  );
}

export default function MobileApp() {
  const [page, setPage] = useState(getInitialPage);
  const title = useMemo(() => pages[page] || "Home", [page]);

  let content;
  if (page === "home") content = <MobileHome setPage={setPage} />;
  else if (page === "standings") content = <MobilePlaceholder name="Mobile Standings" note="Use this page for mobile points, team standings, manufacturer standings, and race control summaries." />;
  else if (page === "news") content = <MobilePlaceholder name="Mobile News" note="Large NASCAR-style story cards, ticker banners, and league announcements." />;
  else if (page === "streams") content = <MobilePlaceholder name="Mobile Streams" note="Driver stream cards with Twitch/YouTube links, team filters, manufacturer filters, and watch party controls." />;
  else if (page === "hq") content = <MobilePlaceholder name="Mobile Team HQ" note="Owner login, finance tools, tasks, messages, number pool, contracts, and driver management." />;
  else content = <MobilePlaceholder name={`Mobile ${title}`} />;

  return <div className="mobile-shell"><MobileTopBar page={page} setPage={setPage} />{content}<MobileBottomNav page={page} setPage={setPage} /></div>;
}
