import React, { useEffect, useState } from "react";
import logo from "../../assets/logo1.png";
import { getLeagueSession, logoutOfLeague } from "../../lib/leagueAuth";
import "./DesktopNavigation.css";

// Keep this list aligned with the public and protected routes in App.jsx.
const groups = [
  { title: "League", links: [["League Home", "/"], ["Cup Standings", "/standings"], ["Race Schedule", "/schedule"], ["Results & Race History", "/standings#results"], ["In Season Tournament", "/tournament"], ["Streams", "/streams"]] },
  { title: "Series", links: [["Series Hub", "/series"], ["Cup", "/standings"], ["Xfinity", "/series/xfinity"], ["Trucks", "/series/trucks"], ["ARCA", "/series/arca"], ["ARCA Standings", "/series/arca/standings"], ["ARCA Schedule", "/series/arca/schedule"], ["ARCA Drivers", "/series/arca/drivers"], ["ARCA Teams", "/series/arca/teams"]] },
  { title: "Paddock", links: [["Teams & Owners", "/owners"], ["Driver Market", "/driver-market"], ["Contracts", "/contracts"], ["Development Requests", "/development-requests"], ["Paint Scheme Vote", "/paint-scheme-vote"]] },
  { title: "Media & Community", links: [["News", "/news"], ["Interviews", "/public-interviews"], ["League Voting", "/vote"], ["League Chat", "/chat"], ["Messages", "/message-center"], ["Notifications", "/notifications"], ["Discord", "/discord"]] },
  { title: "My League", links: [["My Profile", "/welcome"], ["Owner HQ", "/team-hq"], ["Submit Appeal", "/submit-appeal"], ["Submit Story", "/submit-story"], ["Issues & Feedback", "/issues"], ["Files", "/files"], ["Admin Operations", "/admin"], ["Admin Permissions", "/admin/permissions"], ["Admin Car Gallery", "/admin/car-gallery"], ["Admin Interviews", "/admin/interviews"], ["Admin Voting", "/admin/votes"], ["Live Control", "/admin/live-control"]] },
];

export default function DesktopNavigation() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(() => getLeagueSession());
  const path = window.location.pathname.toLowerCase();
  const profile = session?.driverNumber ? `/driver/${session.driverNumber}` : "/standings?login=1";
  useEffect(() => {
    const refresh = () => setSession(getLeagueSession());
    window.addEventListener("brl:session-changed", refresh);
    return () => window.removeEventListener("brl:session-changed", refresh);
  }, []);
  const signOut = () => {
    logoutOfLeague();
    setSession(null);
    setOpen(false);
    window.location.href = "/standings";
  };
  return <header className="brl-desktop-header">
    <div className="brl-desktop-header__row">
      <a className="brl-desktop-header__brand" href="/" aria-label="BRL home"><img src={logo} alt="" /><span>BRL <small>SEASON 2</small></span></a>
      <nav className="brl-desktop-header__quick" aria-label="Quick links">
        {[["Home", "/"], ["Series", "/series"], ["Schedule", "/schedule"], ["News", "/news"], ["Teams", "/owners"]].map(([label, href]) => <a className={path === href ? "active" : ""} href={href} key={href}>{label}</a>)}
      </nav>
      <a className="brl-desktop-header__message" href="/message-center">Messages</a>
      <a className="brl-desktop-header__profile" href={profile}>{session?.driverNumber ? `#${session.driverNumber} Profile` : "Log In"}</a>
      <button className="brl-desktop-header__menu" type="button" aria-expanded={open} aria-controls="brl-all-pages" onClick={() => setOpen(!open)}>{open ? "Close" : "☰  All pages"}</button>
    </div>
    {open && <div id="brl-all-pages" className="brl-desktop-header__panel">
      {groups.map(group => <section key={group.title}><h2>{group.title}</h2>{group.links.map(([label, href]) => <a key={`${label}-${href}`} href={href} className={path === href ? "active" : ""}>{label}<span aria-hidden="true">↗</span></a>)}</section>)}
      <section><h2>Account & team</h2><a href={profile}>{session?.driverNumber ? "Driver profile" : "Log in"}<span>↗</span></a>{session?.team && <a href={`/team/${encodeURIComponent(session.team)}`}>{session.team} page<span>↗</span></a>}{session && <button className="brl-desktop-header__signout" type="button" onClick={signOut}>Log out <span>↗</span></button>}</section>
    </div>}
  </header>;
}
