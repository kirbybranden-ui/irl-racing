import React, { useEffect, useState } from "react";
import logo from "../../assets/logo1.png";
import { getLeagueSession, logoutOfLeague } from "../../lib/leagueAuth";
import { canSeeRoute, useLeagueAccess, hasLeagueRole } from "../../lib/roleAccess";
import "./DesktopNavigation.css";

// Keep this list aligned with the public and protected routes in App.jsx.
const groups = [
  { title: "League", links: [["League Home", "/"], ["Cup Standings", "/standings"], ["Race Schedule", "/schedule"], ["Results & Race History", "/standings#results"], ["In Season Tournament", "/tournament"], ["Streams", "/streams"]] },
  { title: "Paddock", links: [["Teams & Owners", "/owners"], ["Driver Market", "/driver-market"], ["Contracts", "/contracts"], ["Development Requests", "/development-requests"], ["Paint Scheme Vote", "/paint-scheme-vote"]] },
  { title: "Media & Community", links: [["News", "/news"], ["Interviews", "/public-interviews"], ["League Voting", "/vote"], ["League Chat", "/chat"], ["Messages", "/message-center"], ["Notifications", "/notifications"], ["Discord", "/discord"]] },
  { title: "My League", links: [["My Profile", "/welcome"], ["My Media Interviews", "/media"], ["Strategy Desk", "/strategy"], ["Owner HQ", "/team-hq"], ["Submit Appeal", "/submit-appeal"], ["Submit Story", "/submit-story"], ["Issues & Feedback", "/issues"], ["Files", "/files"], ["Admin Operations", "/admin"], ["Admin Permissions", "/admin/permissions"], ["Admin Car Gallery", "/admin/car-gallery"], ["Admin Interviews", "/admin/interviews"], ["Admin Voting", "/admin/votes"], ["Live Control", "/admin/live-control"]] },
];

export default function DesktopNavigation() {
  const { access } = useLeagueAccess();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [session, setSession] = useState(() => getLeagueSession());
  const path = window.location.pathname.toLowerCase();
  const profile = session?.driverNumber ? `/driver/${session.driverNumber}` : "/standings?login=1";
  useEffect(() => {
    const refresh = () => setSession(getLeagueSession());
    window.addEventListener("brl:session-changed", refresh);
    return () => window.removeEventListener("brl:session-changed", refresh);
  }, []);
  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError("");
    try {
      await logoutOfLeague();
      setSession(null);
      setOpen(false);
      window.location.assign("/standings?login=1");
    } catch (error) {
      setLogoutError(error.message || "Unable to sign out. Please try again.");
      setSigningOut(false);
    }
  };
  return <header className="brl-desktop-header">
    <div className="brl-desktop-header__row">
      <a className="brl-desktop-header__brand" href="/" aria-label="BRL home"><img src={logo} alt="" /><span>BRL <small>SEASON 2</small></span></a>
      <nav className="brl-desktop-header__quick" aria-label="Quick links">
        {[["Home", "/"], ["Schedule", "/schedule"], ["News", "/news"], ["Teams", "/owners"]].map(([label, href]) => <a className={path === href ? "active" : ""} href={href} key={href}>{label}</a>)}
      </nav>
      {access?.userId && <a className="brl-desktop-header__message" href="/message-center">Messages</a>}
      <a className="brl-desktop-header__profile" href={profile}>{session?.driverNumber ? `#${session.driverNumber} Profile` : "Login / Register"}</a>
      <button className="brl-desktop-header__menu" type="button" aria-expanded={open} aria-controls="brl-all-pages" onClick={() => setOpen(!open)}>{open ? "Close" : "☰  All pages"}</button>
    </div>
    {open && <div id="brl-all-pages" className="brl-desktop-header__panel">
      {groups.map(group => <section key={group.title}><h2>{group.title}</h2>{group.links.filter(([,href]) => canSeeRoute(access,href)).map(([label, href]) => <a key={`${label}-${href}`} href={href} className={path === href ? "active" : ""}>{label}<span aria-hidden="true">↗</span></a>)}</section>)}
      {(hasLeagueRole(access,"race_recorder") || hasLeagueRole(access,"full_admin")) && <section><h2>Race Operations</h2><a href="/race-recorder">Record Race Data</a></section>}
      <section><h2>Account & team</h2><a href={profile}>{session?.driverNumber ? "Driver profile" : "Login / Register"}<span>↗</span></a>{session?.team && <a href={`/team/${encodeURIComponent(session.team)}`}>{session.team} page<span>↗</span></a>}{session && <button className="brl-desktop-header__signout" type="button" onClick={signOut} disabled={signingOut}>{signingOut ? "Signing out…" : "Log out"} <span>↗</span></button>}</section>
      {logoutError && <p role="alert">{logoutError}</p>}
    </div>}
  </header>;
}
