import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
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


function safeGo(go, path) {
  if (typeof go === "function") {
    go(path);
    return;
  }
  window.location.href = path;
}

function renderTeamBadge(team, size = 44) {
  const label = String(team || "?").slice(0, 4).toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "#d4af37",
        color: "#111",
        display: "grid",
        placeItems: "center",
        fontWeight: 1000,
        fontSize: Math.max(12, size * 0.24),
        border: "1px solid rgba(255,255,255,0.2)",
        flex: "0 0 auto",
      }}
    >
      {label}
    </div>
  );
}

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


const DEV_SERIES = ["xfinity", "truck", "arca"];

function formatSeries(series) {
  const value = String(series || "").toLowerCase();
  if (value === "xfinity") return "Xfinity";
  if (value === "truck") return "Truck";
  if (value === "arca") return "ARCA";
  return series || "Series";
}

function getDriverDisplayName(driver) {
  return driver?.name || driver?.driver_name || driver?.driverName || "Unknown Driver";
}

function getDriverNumber(driver) {
  return String(driver?.number || driver?.car_number || driver?.driver_number || "").replace("#", "");
}

function requestStatusLabel(request) {
  if (request?.requires_board_approval && request?.board_status === "pending") return "Board Review";
  if (request?.final_status === "approved") return "Approved";
  if (request?.final_status === "denied") return "Denied";
  if (request?.owner_status === "approved") return "Owner Approved";
  if (request?.owner_status === "denied") return "Owner Denied";
  return "Pending Owner";
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
  const cupDrivers = useMemo(() => (drivers || []).filter((driver) => String(driver?.series || "cup").toLowerCase() === "cup"), [drivers]);

  const [developmentRequests, setDevelopmentRequests] = useState([]);
  const [developmentLoading, setDevelopmentLoading] = useState(false);
  const [developmentMessage, setDevelopmentMessage] = useState("");
  const [developmentError, setDevelopmentError] = useState("");
  const [assignmentForm, setAssignmentForm] = useState({
    driverNumber: "",
    requestedSeries: "truck",
    raceName: "",
    note: "",
  });

  const [substitutionRequests, setSubstitutionRequests] = useState([]);
  const [substitutionLoading, setSubstitutionLoading] = useState(false);
  const [substitutionMessage, setSubstitutionMessage] = useState("");
  const [substitutionError, setSubstitutionError] = useState("");
  const [substitutionForm, setSubstitutionForm] = useState({
    raceName: "",
    originalDriverId: "",
    substituteDriverId: "",
    assignmentType: "substitute",
    note: "",
  });

  useEffect(() => {
    if (!assignmentForm.driverNumber && cupDrivers.length > 0) {
      setAssignmentForm((current) => ({ ...current, driverNumber: getDriverNumber(cupDrivers[0]) }));
    }
  }, [assignmentForm.driverNumber, cupDrivers]);

  useEffect(() => {
    if (!substitutionForm.originalDriverId && roster.length > 0) {
      setSubstitutionForm((current) => ({ ...current, originalDriverId: String(roster[0].id || "") }));
    }
  }, [substitutionForm.originalDriverId, roster]);

  const selectedOriginalDriver = roster.find((driver) => String(driver?.id || "") === String(substitutionForm.originalDriverId || "")) || roster[0] || null;
  const substituteDriverOptions = cupDrivers
    .filter((driver) => String(driver?.id || "") !== String(selectedOriginalDriver?.id || ""))
    .sort((a, b) => Number(getDriverNumber(a) || 9999) - Number(getDriverNumber(b) || 9999));

  useEffect(() => {
    if (!substitutionForm.substituteDriverId && substituteDriverOptions.length > 0) {
      setSubstitutionForm((current) => ({ ...current, substituteDriverId: String(substituteDriverOptions[0].id || "") }));
    }
  }, [substitutionForm.substituteDriverId, substituteDriverOptions.map((driver) => String(driver.id)).join("|")]);

  async function loadDevelopmentRequests() {
    if (!currentTeam?.team) return;
    setDevelopmentLoading(true);
    setDevelopmentError("");

    const { data, error } = await supabase
      .from("league_transactions")
      .select("*")
      .eq("transaction_type", "development_request")
      .eq("requested_team", currentTeam.team)
      .order("created_at", { ascending: false });

    if (error) {
      setDevelopmentError(error.message || "Could not load developmental requests.");
      setDevelopmentRequests([]);
    } else {
      setDevelopmentRequests(Array.isArray(data) ? data : []);
    }

    setDevelopmentLoading(false);
  }

  useEffect(() => {
    loadDevelopmentRequests();
    loadSubstitutionRequests();
  }, [currentTeam?.team]);

  async function loadSubstitutionRequests() {
    if (!currentTeam?.team) return;
    setSubstitutionLoading(true);
    setSubstitutionError("");

    const { data, error } = await supabase
      .from("owner_driver_assignments")
      .select("*")
      .eq("series", "cup")
      .eq("team_key", currentTeam.team)
      .order("created_at", { ascending: false });

    if (error) {
      setSubstitutionError(error.message || "Could not load substitution requests.");
      setSubstitutionRequests([]);
    } else {
      setSubstitutionRequests(Array.isArray(data) ? data : []);
    }

    setSubstitutionLoading(false);
  }

  async function submitSubstitutionRequest(event) {
    event.preventDefault();
    setSubstitutionMessage("");
    setSubstitutionError("");

    const originalDriver = roster.find((driver) => String(driver?.id || "") === String(substitutionForm.originalDriverId || ""));
    const substituteDriver = cupDrivers.find((driver) => String(driver?.id || "") === String(substitutionForm.substituteDriverId || ""));

    if (!currentTeam?.team) {
      setSubstitutionError("Select a team before submitting a substitution request.");
      return;
    }

    if (!substitutionForm.raceName.trim()) {
      setSubstitutionError("Enter the race this substitution applies to.");
      return;
    }

    if (!originalDriver) {
      setSubstitutionError("Select the Cup car / roster driver being substituted.");
      return;
    }

    if (!substituteDriver) {
      setSubstitutionError("Select the substitute driver.");
      return;
    }

    if (String(originalDriver.id) === String(substituteDriver.id)) {
      setSubstitutionError("The substitute driver must be different from the original roster driver.");
      return;
    }

    const payload = {
      series: "cup",
      race_id: substitutionForm.raceName.trim(),
      race_name: substitutionForm.raceName.trim(),
      team_key: currentTeam.team,
      team_name: currentTeam.name || getTeamFullName(currentTeam.team),
      owner_name: currentTeam.name || currentTeam.team,
      car_number: getDriverNumber(originalDriver),
      original_driver_id: String(originalDriver.id || ""),
      original_driver_name: getDriverDisplayName(originalDriver),
      original_driver_number: getDriverNumber(originalDriver),
      assigned_driver_id: String(substituteDriver.id || ""),
      assigned_driver_name: getDriverDisplayName(substituteDriver),
      assigned_driver_number: getDriverNumber(substituteDriver),
      assignment_type: substitutionForm.assignmentType || "substitute",
      driver_points_awarded: false,
      original_driver_points_awarded: false,
      team_points_awarded: true,
      manufacturer_points_awarded: true,
      status: "pending",
      requested_by: currentTeam.name || currentTeam.team,
      requested_by_role: "owner",
      owner_note: substitutionForm.note || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("owner_driver_assignments").insert([payload]);

    if (error) {
      setSubstitutionError(error.message || "Could not submit substitution request.");
      return;
    }

    setSubstitutionForm((current) => ({ ...current, raceName: "", note: "" }));
    setSubstitutionMessage("Substitution request submitted to Race Operations for admin approval.");
    await loadSubstitutionRequests();
  }

  function getSubstitutionStatusLabel(request) {
    const status = String(request?.status || "pending").toLowerCase();
    if (status === "approved_pending_driver") return "Approved - Waiting on Driver";
    if (status === "driver_accepted") return "Driver Accepted";
    if (status === "driver_declined") return "Driver Declined";
    if (status === "approved") return "Approved - Waiting on Driver";
    if (status === "denied") return "Denied";
    if (status === "completed") return "Completed";
    if (status === "cancelled") return "Cancelled";
    return "Pending Admin";
  }

  async function getDevelopmentStartCount(driverNumber, requestedSeries) {
    const { count, error } = await supabase
      .from("developmental_starts")
      .select("id", { count: "exact", head: true })
      .eq("driver_number", String(driverNumber))
      .eq("series", requestedSeries)
      .eq("counts_against_limit", true);

    if (error) return 0;
    return Number(count || 0);
  }

  async function approveDevelopmentRequest(request) {
    setDevelopmentMessage("");
    setDevelopmentError("");

    const starts = await getDevelopmentStartCount(request.driver_number, request.requested_series);
    const requiresBoardApproval = starts >= 2;

    const payload = {
      owner_status: "approved",
      owner_note: request.owner_note || "Approved by owner.",
      requires_board_approval: requiresBoardApproval,
      board_status: requiresBoardApproval ? "pending" : "approved",
      final_status: requiresBoardApproval ? "pending" : "approved",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("league_transactions")
      .update(payload)
      .eq("id", request.id);

    if (error) {
      setDevelopmentError(error.message || "Could not approve request.");
      return;
    }

    setDevelopmentMessage(requiresBoardApproval ? "Owner approved. Board approval required because this exceeds the 2-race limit." : "Development ride approved. It will show on the driver profile.");
    await loadDevelopmentRequests();
  }

  async function denyDevelopmentRequest(request) {
    setDevelopmentMessage("");
    setDevelopmentError("");

    const { error } = await supabase
      .from("league_transactions")
      .update({
        owner_status: "denied",
        board_status: "denied",
        final_status: "denied",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (error) {
      setDevelopmentError(error.message || "Could not deny request.");
      return;
    }

    setDevelopmentMessage("Development request denied.");
    await loadDevelopmentRequests();
  }

  async function assignDevelopmentRide(event) {
    event.preventDefault();
    setDevelopmentMessage("");
    setDevelopmentError("");

    const selectedDriver = cupDrivers.find((driver) => getDriverNumber(driver) === String(assignmentForm.driverNumber));
    if (!selectedDriver) {
      setDevelopmentError("Select a Cup driver first.");
      return;
    }

    if (!assignmentForm.raceName.trim()) {
      setDevelopmentError("Enter the race name before assigning the ride.");
      return;
    }

    const starts = await getDevelopmentStartCount(assignmentForm.driverNumber, assignmentForm.requestedSeries);
    const requiresBoardApproval = starts >= 2;

    const payload = {
      transaction_type: "development_request",
      driver_number: getDriverNumber(selectedDriver),
      driver_name: getDriverDisplayName(selectedDriver),
      current_series: "cup",
      requested_series: assignmentForm.requestedSeries,
      current_team: selectedDriver.team || "Cup",
      requested_team: currentTeam.team,
      current_owner: selectedDriver.owner || null,
      requested_owner: currentTeam.name || currentTeam.team,
      initiated_by: currentTeam.name || currentTeam.team,
      owner_status: "approved",
      board_status: requiresBoardApproval ? "pending" : "approved",
      final_status: requiresBoardApproval ? "pending" : "approved",
      request_note: assignmentForm.note || "Owner assigned developmental ride.",
      owner_note: "Assigned by owner from Team HQ.",
      race_name: assignmentForm.raceName.trim(),
      assignment_source: "owner_assignment",
      assigned_by: currentTeam.name || currentTeam.team,
      requires_board_approval: requiresBoardApproval,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("league_transactions").insert([payload]);

    if (error) {
      setDevelopmentError(error.message || "Could not assign developmental ride.");
      return;
    }

    setAssignmentForm((current) => ({ ...current, raceName: "", note: "" }));
    setDevelopmentMessage(requiresBoardApproval ? "Ride assigned, but board approval is required because this exceeds the 2-race limit." : "Development ride assigned and sent to the driver profile.");
    await loadDevelopmentRequests();
  }

  const pendingDevelopmentRequests = developmentRequests.filter((request) => request.owner_status === "pending" || request.final_status === "pending");
  const approvedDevelopmentRequests = developmentRequests.filter((request) => request.final_status === "approved");

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
          onClick={() => safeGo(go, "/owner")}
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
              <MobileAction label="Open Full HQ" onClick={() => safeGo(go, "/owners?desktop=1")} secondary />
              <MobileAction label="Team Page" onClick={() => safeGo(go, `/team/${encodeURIComponent(currentTeam.team)}`)} />
            </div>
          </MobileCard>

          <MobileSectionTitle>Driver Assignment Center</MobileSectionTitle>
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={mobileKickerStyle}>Cup Substitute Requests</div>
                <h3 style={{ margin: "2px 0 0" }}>Request a Substitute Driver</h3>
              </div>
              <button
                type="button"
                onClick={loadSubstitutionRequests}
                style={{ border: "1px solid #263244", background: "#0b1220", color: "#fff", borderRadius: 12, padding: "9px 12px", fontWeight: 900 }}
              >
                Refresh
              </button>
            </div>

            <p style={{ margin: "0 0 12px", color: "#aab3c2", fontSize: 12, lineHeight: 1.45 }}>
              Submit a Cup substitution request for one race. If approved, the car earns team/manufacturer points, while the original driver and substitute driver receive 0 driver points.
            </p>

            {substitutionError && <div style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca", borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{substitutionError}</div>}
            {substitutionMessage && <div style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)", color: "#bbf7d0", borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{substitutionMessage}</div>}

            <form onSubmit={submitSubstitutionRequest} style={{ display: "grid", gap: 10 }}>
              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Race</label>
              <input
                value={substitutionForm.raceName}
                onChange={(event) => setSubstitutionForm((current) => ({ ...current, raceName: event.target.value }))}
                placeholder="Example: Las Vegas"
                style={{ ...inputStyle, minHeight: 46 }}
              />

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Car / Original Driver</label>
              <select
                value={substitutionForm.originalDriverId}
                onChange={(event) => setSubstitutionForm((current) => ({ ...current, originalDriverId: event.target.value, substituteDriverId: "" }))}
                style={{ ...inputStyle, minHeight: 46 }}
              >
                {roster.map((driver) => (
                  <option key={`${driver.id}-${getDriverNumber(driver)}`} value={driver.id}>
                    #{getDriverNumber(driver)} {getDriverDisplayName(driver)}
                  </option>
                ))}
              </select>

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Substitute Driver</label>
              <select
                value={substitutionForm.substituteDriverId}
                onChange={(event) => setSubstitutionForm((current) => ({ ...current, substituteDriverId: event.target.value }))}
                style={{ ...inputStyle, minHeight: 46 }}
              >
                {substituteDriverOptions.map((driver) => (
                  <option key={`${driver.id}-${getDriverNumber(driver)}`} value={driver.id}>
                    #{getDriverNumber(driver)} {getDriverDisplayName(driver)}
                  </option>
                ))}
              </select>

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Assignment Type</label>
              <select
                value={substitutionForm.assignmentType}
                onChange={(event) => setSubstitutionForm((current) => ({ ...current, assignmentType: event.target.value }))}
                style={{ ...inputStyle, minHeight: 46 }}
              >
                <option value="substitute">Substitute Driver</option>
                <option value="emergency_replacement">Emergency Replacement</option>
                <option value="one_off">One-Off Start</option>
                <option value="start_and_park">Start & Park Assignment</option>
              </select>

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Owner Note</label>
              <textarea
                value={substitutionForm.note}
                onChange={(event) => setSubstitutionForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Why is a substitute needed?"
                style={{ ...inputStyle, minHeight: 84, resize: "vertical" }}
              />

              <button type="submit" style={{ ...mobileActionStyle, background: "#34c759", borderColor: "#34c759", color: "#07110b" }}>
                Submit to Race Operations
              </button>
            </form>
          </MobileCard>

          <MobileCard>
            <div style={mobileKickerStyle}>Substitution Request History</div>
            {substitutionLoading && <p style={{ color: "#aab3c2" }}>Loading substitution requests...</p>}
            {!substitutionLoading && substitutionRequests.length === 0 && (
              <p style={{ margin: "8px 0 0", color: "#aab3c2" }}>No substitution requests submitted for this team.</p>
            )}
            {substitutionRequests.slice(0, 8).map((request) => (
              <div key={request.id} style={{ border: "1px solid #263244", borderRadius: 14, padding: 12, marginTop: 10, background: "#0b1220" }}>
                <strong>#{request.car_number} {request.assigned_driver_name}</strong>
                <div style={{ color: "#aab3c2", fontSize: 12, marginTop: 4 }}>
                  {request.race_name || "Race TBD"} • Sub for {request.original_driver_name || "Original Driver"} • {getSubstitutionStatusLabel(request)}
                </div>
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ background: "rgba(52,199,89,0.14)", color: "#bbf7d0", border: "1px solid rgba(52,199,89,0.30)", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 1000 }}>Team points: YES</span>
                  <span style={{ background: "rgba(239,68,68,0.14)", color: "#fecaca", border: "1px solid rgba(239,68,68,0.30)", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 1000 }}>Driver points: 0</span>
                </div>
                {request.owner_note && <p style={{ margin: "8px 0 0", color: "#d1d5db", fontSize: 12 }}>{request.owner_note}</p>}
              </div>
            ))}
          </MobileCard>

          <MobileSectionTitle>Development Center</MobileSectionTitle>
          <MobileCard>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={mobileKickerStyle}>Lower Series Rides</div>
                <h3 style={{ margin: "2px 0 0" }}>Assign / Approve Developmental Starts</h3>
              </div>
              <button
                type="button"
                onClick={loadDevelopmentRequests}
                style={{ border: "1px solid #263244", background: "#0b1220", color: "#fff", borderRadius: 12, padding: "9px 12px", fontWeight: 900 }}
              >
                Refresh
              </button>
            </div>

            <p style={{ margin: "0 0 12px", color: "#aab3c2", fontSize: 12, lineHeight: 1.45 }}>
              Owner approval is final for the first 2 developmental starts in a series. Requests over the limit are sent to board review automatically.
            </p>

            {developmentError && <div style={{ background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca", borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{developmentError}</div>}
            {developmentMessage && <div style={{ background: "rgba(34,197,94,0.14)", border: "1px solid rgba(34,197,94,0.35)", color: "#bbf7d0", borderRadius: 12, padding: 10, marginBottom: 10, fontWeight: 800 }}>{developmentMessage}</div>}

            <form onSubmit={assignDevelopmentRide} style={{ display: "grid", gap: 10 }}>
              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Cup Driver</label>
              <select
                value={assignmentForm.driverNumber}
                onChange={(event) => setAssignmentForm((current) => ({ ...current, driverNumber: event.target.value }))}
                style={{ ...inputStyle, minHeight: 46 }}
              >
                {cupDrivers.map((driver) => (
                  <option key={`${getDriverNumber(driver)}-${getDriverDisplayName(driver)}`} value={getDriverNumber(driver)}>
                    #{getDriverNumber(driver)} {getDriverDisplayName(driver)}
                  </option>
                ))}
              </select>

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Series</label>
              <select
                value={assignmentForm.requestedSeries}
                onChange={(event) => setAssignmentForm((current) => ({ ...current, requestedSeries: event.target.value }))}
                style={{ ...inputStyle, minHeight: 46 }}
              >
                {DEV_SERIES.map((series) => <option key={series} value={series}>{formatSeries(series)}</option>)}
              </select>

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Race</label>
              <input
                value={assignmentForm.raceName}
                onChange={(event) => setAssignmentForm((current) => ({ ...current, raceName: event.target.value }))}
                placeholder="Example: Bristol Night"
                style={{ ...inputStyle, minHeight: 46 }}
              />

              <label style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Owner Note</label>
              <textarea
                value={assignmentForm.note}
                onChange={(event) => setAssignmentForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Optional note for the driver/market"
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              />

              <button type="submit" style={{ ...mobileActionStyle, background: "#d4af37", borderColor: "#d4af37", color: "#111" }}>
                Assign Development Ride
              </button>
            </form>
          </MobileCard>

          <MobileCard>
            <div style={mobileKickerStyle}>Pending Driver Requests</div>
            {developmentLoading && <p style={{ color: "#aab3c2" }}>Loading requests...</p>}
            {!developmentLoading && pendingDevelopmentRequests.length === 0 && (
              <p style={{ margin: "8px 0 0", color: "#aab3c2" }}>No pending development requests for this team.</p>
            )}
            {pendingDevelopmentRequests.map((request) => (
              <div key={request.id} style={{ border: "1px solid #263244", borderRadius: 14, padding: 12, marginTop: 10, background: "#0b1220" }}>
                <strong>#{request.driver_number} {request.driver_name}</strong>
                <div style={{ color: "#aab3c2", fontSize: 12, marginTop: 4 }}>
                  {formatSeries(request.requested_series)} • {request.race_name || "Race TBD"} • {requestStatusLabel(request)}
                </div>
                {request.request_note && <p style={{ margin: "8px 0", color: "#d1d5db", fontSize: 12 }}>{request.request_note}</p>}
                {request.owner_status === "pending" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                    <button type="button" onClick={() => approveDevelopmentRequest(request)} style={{ border: "1px solid rgba(34,197,94,0.45)", background: "rgba(34,197,94,0.16)", color: "#bbf7d0", borderRadius: 12, padding: "10px 12px", fontWeight: 1000 }}>Approve</button>
                    <button type="button" onClick={() => denyDevelopmentRequest(request)} style={{ border: "1px solid rgba(239,68,68,0.45)", background: "rgba(239,68,68,0.16)", color: "#fecaca", borderRadius: 12, padding: "10px 12px", fontWeight: 1000 }}>Deny</button>
                  </div>
                )}
              </div>
            ))}
          </MobileCard>

          <MobileCard>
            <div style={mobileKickerStyle}>Approved Development Rides</div>
            {approvedDevelopmentRequests.length === 0 ? (
              <p style={{ margin: "8px 0 0", color: "#aab3c2" }}>No approved developmental rides posted yet.</p>
            ) : approvedDevelopmentRequests.slice(0, 6).map((request) => (
              <div key={request.id} style={{ borderTop: "1px solid #263244", paddingTop: 10, marginTop: 10 }}>
                <strong>#{request.driver_number} {request.driver_name}</strong>
                <div style={{ color: "#aab3c2", fontSize: 12 }}>{formatSeries(request.requested_series)} • {request.race_name || "Race TBD"}</div>
              </div>
            ))}
          </MobileCard>

          <MobileSectionTitle>Roster</MobileSectionTitle>
          {roster.length === 0 && <MobileCard><p style={{ margin: 0, color: "#aab3c2" }}>No active drivers found for this team.</p></MobileCard>}
          {roster.map((driver) => (
            <button
              type="button"
              key={`${driver.number}-${driver.name}`}
              onClick={() => safeGo(go, `/driver/${driver.number}`)}
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
