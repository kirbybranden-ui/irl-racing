import React from "react";
import logo from "../../assets/logo1.png";
import "./AppShell.css";

const defaultNav = [
  { label: "Home", href: "/" },
  { label: "Race Week", href: "/schedule" },
  { label: "Standings", href: "/standings" },
  { label: "News", href: "/news" },
  { label: "Team HQ", href: "/owners" },
  { label: "More", href: "/series" },
];

const mobileNav = [
  { label: "Home", href: "/", icon: "⌂" },
  { label: "Race", href: "/schedule", icon: "◫" },
  { label: "Tasks", href: "/foundation-preview#tasks", icon: "✓" },
  { label: "Messages", href: "/message-center", icon: "✉" },
  { label: "More", href: "/series", icon: "•••" },
];

function pathIsActive(href, currentPath) {
  if (href === "/") return currentPath === "/" || currentPath === "/foundation-preview";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

export function AppShell({ children, navItems = defaultNav, currentUser = null, currentPath, teamTheme = null, teamIdentity = null }) {
  const path = currentPath || (typeof window !== "undefined" ? window.location.pathname : "/");
  const displayName = currentUser?.displayName || currentUser?.driverName || "Guest";
  const role = currentUser?.roleLabel || currentUser?.role || "Public";
  const initials = displayName.split(/\s|_/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "BR";

  return (
    <div className={`brl-shell ${teamIdentity ? "brl-shell--team" : ""}`} style={teamTheme || undefined}>
      <header className="brl-shell__topbar">
        <div className="brl-shell__topbar-inner">
          <a className="brl-shell__brand" href="/">
            <img className="brl-shell__logo" src={logo} alt="BRL" />
            <span className="brl-shell__brand-copy">
              <span className="brl-shell__brand-title">BRL</span>
              <span className="brl-shell__brand-subtitle">CUP SERIES</span>
            </span>
          </a>
          <nav className="brl-shell__nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className={`brl-shell__nav-link ${pathIsActive(item.href, path) ? "brl-shell__nav-link--active" : ""}`}>{item.label}</a>
            ))}
          </nav>
          <div className="brl-shell__actions">
            <a className="brl-shell__icon-button" href="/message-center" aria-label="Messages">✉<i /></a>
            <a className="brl-shell__account" href={currentUser?.driverNumber ? `/driver/${currentUser.driverNumber}` : "/welcome"}>
              <span className="brl-shell__avatar">{currentUser?.driverNumber || initials}</span>
              <span className="brl-shell__account-copy">
                <span className="brl-shell__account-name">{displayName}</span>
                <span className="brl-shell__account-role">{role}</span>
              </span>
              <span className="brl-shell__chevron">⌄</span>
            </a>
          </div>
        </div>
      </header>
      <main className="brl-shell__main">
        {teamIdentity && <div className="brl-shell__team-banner">
          {teamIdentity.logo && <img src={teamIdentity.logo} alt={`${teamIdentity.name} logo`} />}
          <div><span>TEAM GARAGE</span><strong>{teamIdentity.name}</strong></div>
          <i aria-hidden="true" />
        </div>}
        {children}
      </main>
      <nav className="brl-shell__mobile-nav" aria-label="Mobile navigation">
        {mobileNav.map((item) => (
          <a key={item.href} href={item.href} className={`brl-shell__mobile-link ${pathIsActive(item.href, path) ? "brl-shell__mobile-link--active" : ""}`}>
            <span>{item.icon}</span>{item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
