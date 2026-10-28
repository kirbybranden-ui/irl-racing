import { isChallengeRoute, useInSeasonChallenge } from "../lib/inSeasonChallenge";
import React, { useEffect, useRef, useState } from "react";
import logo from "../assets/logo1.png";
import { canSeeRoute, hasLeagueRole, ROLE_LABELS } from "../lib/roleAccess";
import { getTeamBranding, teamLogos } from "../data/teams";
import "./MobileShell.css";

export const mobileMenuGroups = [
  { title: "Race center", links: [["Cup standings", "/standings"], ["Season schedule", "/schedule"], ["Teams & drivers", "/owners"], ["Driver market", "/driver-market"], ["In-season tournament", "/tournament"], ["Streams", "/streams"]] },
  { title: "Media & community", links: [["News", "/news"], ["Media center & interviews", "/interviews"], ["Public interviews", "/public-interviews"], ["Race strategy", "/strategy"], ["Paint scheme vote", "/paint-scheme-vote"], ["League voting", "/vote"], ["Messages", "/message-center"], ["Notifications", "/notifications"], ["League chat", "/chat"], ["Discord", "/discord"]] },
  { title: "My league", links: [["My Career", "/career"],["My dashboard", "/my-dashboard"], ["Team HQ", "/team-hq"], ["Development requests", "/development-requests"], ["Submit appeal", "/submit-appeal"], ["Submit story", "/submit-story"], ["Issues & feedback", "/issues"], ["Files", "/files"]] },
  { title: "League operations", links: [["Admin operations", "/admin"], ["Permissions", "/admin/permissions"], ["Race recorder", "/race-recorder"], ["Car gallery", "/admin/car-gallery"], ["Interview admin", "/admin/interviews"], ["Voting admin", "/admin/votes"], ["Live control", "/admin/live-control"]] },
];

// Keep the URL as the source of truth: links survive reloads and browser Back.
export default function MobileShell({ title = "Budweiser Racing League", children, session = null, onLoginClick, onLogout, menuPage = false }) {
  const { visible: challengeVisible } = useInSeasonChallenge();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const dialog = useRef(null);
  const trigger = useRef(null);
  const path = window.location.pathname.toLowerCase().replace(/\/$/, "") || "/";
  const signedIn = Boolean(session?.userId);
  const team = session?.team || session?.teamName || session?.ownedTeams?.[0] || "";
  const brand = getTeamBranding(team);
  const teamLogo = teamLogos[team] || teamLogos[brand?.fullName];
  const name = session?.driverName || session?.displayName || "Driver";
  const number = session?.driverNumber;
  const role = (session?.roles || []).map((role) => ROLE_LABELS[role] || role).join(" · ");
  const groups = mobileMenuGroups.map((group) => ({ ...group, links: group.links.filter(([label, href]) => canSeeRoute(session, href) && (!isChallengeRoute(href) || challengeVisible) && (!href.startsWith("/my-") || signedIn) && `${label} ${group.title}`.toLowerCase().includes(query.toLowerCase())) })).filter((group) => group.links.length);
  const tabs = [["Home", "/", "⌂"], ["Race", "/schedule", "⚑"], ["Media", "/interviews", "◉"], ["My HQ", signedIn ? "/career" : "/login?next=%2Fcareer", "◎"]];
  const active = (href) => href === "/" ? ["/", "/standings"].includes(path) : href === "/schedule" ? ["/schedule", "/tracks", "/season-schedule"].includes(path) : href === "/interviews" ? ["/interviews", "/media", "/strategy", "/public-interviews", "/news"].includes(path) : path === href || (href === "/career" && path.startsWith("/driver/"));

  useEffect(() => {
    if (!open) return;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; trigger.current?.focus(); };
  }, [open]);

  const menu = <>
    <label className="brl-mobile__search">Find a page<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Schedule, voting, contracts…" /></label>
    {groups.map((group) => <section className="brl-mobile__menu-group" key={group.title}><h3>{group.title}</h3>{group.links.map(([label, href]) => <a key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}<span aria-hidden="true">↗</span></a>)}</section>)}
    {!groups.length && <p role="status">No matching pages.</p>}
    <button className="brl-mobile__desktop" type="button" onClick={() => { document.cookie = "bcl-force-desktop=1; path=/; max-age=2592000"; window.location.reload(); }}>View desktop version</button>
  </>;

  return <div className="brl-mobile" style={{ "--mobile-accent": (team && brand?.accent) || "#d71920" }}>
    <a className="brl-mobile__skip" href="#mobile-content">Skip to content</a>
    <header className="brl-mobile__header"><a href="/" className="brl-mobile__brand" aria-label="BRL home"><img src={logo} alt="" /><span>BRL<small>RACING LEAGUE</small></span></a><div className="brl-mobile__header-actions">{signedIn && (session?.isDriver || session?.isOwner || session?.isAdmin) && <a href="/notifications" aria-label="Notifications">🔔</a>}{signedIn ? <a className="brl-mobile__profile" href="/career" aria-label="My dashboard">{number ? `#${number}` : "HQ"}</a> : <button type="button" onClick={() => onLoginClick ? onLoginClick() : window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)}>Log in</button>}</div></header>
    <main id="mobile-content" className="brl-mobile__content">
      <div className="brl-mobile__eyebrow">{team ? brand?.fullName || team : "ONE LEAGUE. ONE COMMUNITY."}</div>
      <div className="brl-mobile__title-row"><h1>{title === "Cup Standings" ? "Race Center" : title}</h1>{teamLogo && <img src={teamLogo} alt={`${team} logo`} />}</div>
      {signedIn && <div className="brl-mobile__session"><a href="/career">{number ? `#${number} ` : ""}{name}<small>{role || "League member"}</small></a>{onLogout && <button type="button" disabled={signingOut} onClick={async () => { setSigningOut(true); setError(""); try { await onLogout(); } catch (failure) { setError(failure.message || "Could not sign out. Try again."); } finally { setSigningOut(false); } }}>{signingOut ? "Signing out…" : "Log out"}</button>}</div>}
      {error && <p role="alert">{error}</p>}
      <div className="brl-mobile__page">{menuPage ? menu : children}</div>
    </main>
    <nav className="brl-mobile__tabs" aria-label="Mobile navigation">{tabs.map(([label, href, icon]) => <a key={label} href={href} aria-current={active(href) ? "page" : undefined}><span aria-hidden="true">{icon}</span>{label}</a>)}<button ref={trigger} type="button" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)}><span aria-hidden="true">☰</span>More</button></nav>
    {open && <dialog ref={dialog} className="brl-mobile__dialog" aria-labelledby="mobile-menu-title" onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); setOpen(false); } }} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} onClick={(event) => { if (event.target === dialog.current) setOpen(false); }}><div className="brl-mobile__dialog-head"><h2 id="mobile-menu-title">All pages</h2><button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>×</button></div>{menu}{signedIn && (hasLeagueRole(session, "owner") || hasLeagueRole(session, "full_admin")) && <p className="brl-mobile__menu-note">Team tools use your verified league permissions.</p>}</dialog>}
  </div>;
}
