import React, { useMemo, useState } from "react";
import { getTeamFullName, getTeamBudget } from "../data/teams";
import { money } from "../utils/formatters";
import { inputStyle } from "../styles/sharedStyles";

const mobileHeroStyle = { background: "linear-gradient(135deg, #c8102e, #111827)", borderRadius: 20, padding: 18, marginBottom: 14, border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 14px 30px rgba(0,0,0,0.25)" };
const mobileKickerStyle = { color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 1.3 };
const mobileCardStyle = { background: "#111827", border: "1px solid #263244", borderRadius: 16, padding: 14, marginBottom: 12 };
const mobileDriverCardStyle = { width: "100%", background: "#111827", color: "white", border: "1px solid #263244", borderRadius: 16, padding: 12, marginBottom: 10, display: "grid", gridTemplateColumns: "38px 1fr auto", alignItems: "center", gap: 10, textAlign: "left" };
const mobileRankStyle = { width: 34, height: 34, background: "#d4af37", color: "#111", borderRadius: 999, display: "grid", placeItems: "center", fontWeight: 1000 };
const mobilePointsStyle = { fontWeight: 1000, fontSize: 19, textAlign: "right" };
const mobileActionStyle = { width: "100%", minHeight: 48, borderRadius: 14, border: "1px solid", padding: "12px 14px", fontWeight: 1000, marginBottom: 10 };
const mobileStatGridStyle = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 12 };
const mobileStatCardStyle = { background: "#111827", border: "1px solid #263244", borderRadius: 16, padding: 12 };

function MobileCard({ children }) {
  return <section style={mobileCardStyle}>{children}</section>;
}

function MobileAction({ label, onClick, secondary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...mobileActionStyle,
        background: secondary ? "#111827" : "#d4af37",
        color: secondary ? "#ffffff" : "#111111",
        borderColor: secondary ? "#263244" : "#d4af37",
      }}
    >
      {label}
    </button>
  );
}

function MobileHero({ kicker, title, subtitle }) {
  return (
    <section style={mobileHeroStyle}>
      <div style={mobileKickerStyle}>{kicker}</div>
      <h1 style={{ margin: "4px 0", fontSize: 28, lineHeight: 1.05 }}>{title}</h1>
      {subtitle && <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{subtitle}</p>}
    </section>
  );
}

function MobileStatGrid({ items }) {
  return (
    <div style={mobileStatGridStyle}>
      {items.map(([label, value]) => (
        <div key={label} style={mobileStatCardStyle}>
          <div style={{ color: "#aab3c2", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
          <strong style={{ fontSize: 20 }}>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function MobileSectionTitle({ children }) {
  return <h2 style={{ fontSize: 16, margin: "20px 2px 10px", color: "#ffffff" }}>{children}</h2>;
}

export default function OwnerHQPage({ drivers = [], teams = [], seasonName = "", go }) {
  const [selectedTeam, setSelectedTeam] = useState(() => {
    const firstTeam = (teams || []).find((team) => team?.team)?.team;
    return firstTeam || (drivers || []).find((driver) => driver?.team)?.team || "B2J";
  });

  const safeTeams = useMemo(() => {
    const fromStandings = Array.isArray(teams) ? teams.filter((team) => team?.team) : [];
    const teamKeys = new Set(fromStandings.map((team) => String(team.team)));
    (drivers || []).forEach((driver) => {
      const key = String(driver?.team || "").trim();
      if (key && !teamKeys.has(key)) teamKeys.add(key);
    });
    return Array.from(teamKeys).map((key) => {
      const standing = fromStandings.find((team) => String(team.team) === key) || {};
      const roster = (drivers || []).filter((driver) => String(driver?.team || "") === key);
      return {
        team: key,
        name: getTeamFullName(key),
        points: Number(standing.points || roster.reduce((sum, driver) => sum + Number(driver.points || 0), 0)),
        wins: Number(standing.wins || roster.reduce((sum, driver) => sum + Number(driver.wins || 0), 0)),
        drivers: roster,
      };
    }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }, [drivers, teams]);

  const currentTeam = safeTeams.find((team) => String(team.team) === String(selectedTeam)) || safeTeams[0] || null;
  const roster = currentTeam?.drivers || [];

  return (
    <>
      <MobileHero
        kicker="Owner Center"
        title="Team HQ"
        subtitle="Mobile-friendly HQ view using the same live league drivers, standings, and team data."
      />

      <MobileCard>
        <MobileAction
          label="🔐 Owner Login"
          onClick={() => go("/owner")}
        />
        <div style={{ marginTop: 10, color: "#aab3c2", fontSize: 12, lineHeight: 1.45 }}>
          Opens the full Team HQ owner portal with the same login, password rules, and tools as desktop.
        </div>
      </MobileCard>

      <MobileCard>
        <label style={{ display: "block", color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", marginBottom: 8 }}>
          Select Team
        </label>
        <select
          value={currentTeam?.team || selectedTeam}
          onChange={(event) => setSelectedTeam(event.target.value)}
          style={{ ...inputStyle, minHeight: 48, fontSize: 16 }}
        >
          {safeTeams.map((team) => (
            <option key={team.team} value={team.team}>{team.name}</option>
          ))}
        </select>
      </MobileCard>

      {currentTeam ? (
        <>
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {renderTeamBadge(currentTeam.team, 54)}
              <div style={{ minWidth: 0 }}>
                <div style={mobileKickerStyle}>{seasonName || "Current Season"}</div>
                <h2 style={{ margin: "2px 0 0", lineHeight: 1.05 }}>{currentTeam.name}</h2>
              </div>
            </div>
            <MobileStatGrid items={[
              ["Points", currentTeam.points || 0],
              ["Wins", currentTeam.wins || 0],
              ["Drivers", roster.length],
              ["Budget", money(getTeamBudget(currentTeam.team))],
            ]} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <MobileAction label="Open Full HQ" onClick={() => { window.location.href = "/owners?desktop=1"; }} secondary />
              <MobileAction label="Team Page" onClick={() => go(`/team/${encodeURIComponent(currentTeam.team)}`)} />
            </div>
          </MobileCard>

          <MobileSectionTitle>Roster</MobileSectionTitle>
          {roster.length === 0 && <MobileCard><p style={{ margin: 0, color: "#aab3c2" }}>No active drivers found for this team.</p></MobileCard>}
          {roster.map((driver) => (
            <button
              type="button"
              key={`${driver.number}-${driver.name}`}
              onClick={() => go(`/driver/${driver.number}`)}
              style={mobileDriverCardStyle}
            >
              <div style={mobileRankStyle}>#{driver.number}</div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{driver.name}</strong>
                <span style={{ color: "#aab3c2", fontSize: 12 }}>{driver.manufacturer || ""}</span>
              </div>
              <div style={mobilePointsStyle}>{driver.points || 0}<span style={{ display: "block", fontSize: 10, color: "#aab3c2" }}>PTS</span></div>
            </button>
          ))}
        </>
      ) : (
        <MobileCard><p style={{ margin: 0, color: "#aab3c2" }}>No team data loaded yet.</p></MobileCard>
      )}
    </>
  );
}
