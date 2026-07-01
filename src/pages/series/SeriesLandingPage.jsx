import React, { useMemo, useState } from "react";
// import { ReportIssueModal } from "../components/ReportIssueModal"; // TODO: Uncomment once ReportIssueModal.jsx is in repo

const SERIES_NAMES = {
  cup: "Cup Series",
  xfinity: "Xfinity Series",
  trucks: "Craftsman Truck Series",
  arca: "ARCA Menards Series",
};

const SERIES_KEYS = {
  cup: ["cup", "budweiser cup", "cup series"],
  xfinity: ["xfinity", "nascar xfinity", "xfinity series"],
  trucks: ["truck", "trucks", "craftsman", "craftsman truck series"],
  arca: ["arca", "arca menards", "arca menards series"],
};

const LISTED_OWNER_NAMES = new Set([
  "highlander", "highlander713",
  "bowhunter", "bowhunter6758",
  "rookie", "rookievet99",
  "jpc_racing",
  "cajun", "cajunthrottle28",
  "orly", "orly_revo23",
  "kevdinho", "kevdinho7",
]);

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function driverSeriesMatches(driver, seriesId) {
  if (seriesId === "cup") return !driver.series || SERIES_KEYS.cup.includes(String(driver.series).toLowerCase());
  const haystack = [driver.series, driver.primarySeries, driver.division, driver.leagueSeries]
    .filter(Boolean)
    .map((v) => String(v).toLowerCase());
  return haystack.some((value) => SERIES_KEYS[seriesId]?.includes(value));
}

function getDriverName(driver) {
  return driver?.name || driver?.username || driver?.driverName || driver?.gamertag || "Unknown Driver";
}

function getDriverNumber(driver) {
  return String(driver?.number ?? driver?.carNumber ?? driver?.driver_number ?? "").trim();
}

function isListedOwner(driver) {
  const possibleNames = [
    driver?.name,
    driver?.driver_name,
    driver?.driverName,
    driver?.display_name,
    driver?.displayName,
    driver?.username,
    driver?.handle,
  ].map(normalize).filter(Boolean);
  return possibleNames.some((name) => LISTED_OWNER_NAMES.has(name));
}

function findPasswordMatch({ driverNumber, password, driverAccessCodes }) {
  const number = String(driverNumber || "").trim();
  const enteredCode = String(password || "").trim().toUpperCase();
  if (!number || !enteredCode) return false;

  // Admin override keeps you from locking yourself out while building.
  if (enteredCode === "BCLADMINPASSWORD2026") return true;

  return (driverAccessCodes || []).some((row) => {
    const rowNumber = String(row.driver_number ?? row.car_number ?? row.number ?? "").trim();
    const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
      .map((value) => String(value ?? "").trim().toUpperCase())
      .filter(Boolean);
    return rowNumber === number && possibleCodes.includes(enteredCode) && row.active !== false;
  });
}

export default function SeriesLandingPage({ seriesId = "cup", drivers = [], driverAccessCodes = [] }) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [password, setPassword] = useState("");
  const [loginMode, setLoginMode] = useState("driver");
  const [error, setError] = useState("");
  // const [isReportingIssue, setIsReportingIssue] = useState(false); // TODO: Uncomment once ReportIssueModal.jsx is in repo

  const seriesName = SERIES_NAMES[seriesId] || "Series";
  const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
  const isSeriesHome = currentPath === `/series/${seriesId}/home`;
  const sessionKey = `bcl-series-auth-${seriesId}`;

  const seriesDrivers = useMemo(() => {
    return (drivers || []).filter((driver) => driverSeriesMatches(driver, seriesId));
  }, [drivers, seriesId]);

  const listedOwners = useMemo(() => {
    return (drivers || []).filter(isListedOwner).sort((a, b) => getDriverName(a).localeCompare(getDriverName(b)));
  }, [drivers]);


  const go = (to) => { window.location.href = to; };

  const savedSession = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(sessionKey) || "null");
    } catch {
      return null;
    }
  }, [sessionKey]);

  function handleLogin(event) {
    event.preventDefault();
    setError("");

    const selectedNumber = loginMode === "owner" ? selectedOwner : selectedDriver;
    if (!selectedNumber || !password.trim()) {
      setError(loginMode === "owner" ? "Select an owner and enter their driver password." : "Select your username and enter your driver password.");
      return;
    }

    const valid = findPasswordMatch({ driverNumber: selectedNumber, password, driverAccessCodes });
    if (!valid) {
      setError("Invalid driver/owner password.");
      return;
    }

    const selectedRoster = (drivers || []).find((driver) => getDriverNumber(driver) === String(selectedNumber));
    const session = {
      seriesId,
      seriesName,
      role: loginMode,
      driverNumber: selectedNumber,
      driverName: getDriverName(selectedRoster),
      team: selectedRoster?.team || "",
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    go(seriesId === "cup" ? "/standings" : `/series/${seriesId}/home`);
  }

  function logoutSeries() {
    sessionStorage.removeItem(sessionKey);
    go(`/series/${seriesId}`);
  }

  function handleGuestView() {
    const session = {
      seriesId,
      seriesName,
      role: "guest",
      driverNumber: "",
      driverName: "Guest",
      team: "",
      savedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    go(seriesId === "cup" ? "/standings" : `/series/${seriesId}/home`);
  }

  if (isSeriesHome && savedSession) {
    return (
      <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 24 }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <button type="button" onClick={() => go("/")} style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid #333", background: "#111827", color: "white", fontWeight: 900 }}>
            ← Series Portal
          </button>

          <div style={{ background: "linear-gradient(145deg, #7f1d1d, #111827)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 22, padding: 24 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 6vw, 58px)" }}>{seriesName} Hub</h1>
            <p style={{ opacity: 0.78, lineHeight: 1.6 }}>
              {savedSession.role === "guest" ? (
                <>Viewing as <strong>Guest</strong>. Public pages only.</>
              ) : (
                <>Logged in as {savedSession.role === "owner" ? "Owner" : "Driver"}: <strong>{savedSession.driverName}</strong></>
              )}
            </p>
            <button type="button" onClick={logoutSeries} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", background: "#111827", color: "white", fontWeight: 900 }}>
              Log Out of {seriesName}
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
            {(() => {
              const publicPages = ["Standings", "Schedule", "Results", "Driver Profiles", "Team Pages", "News", "Paint Scheme Winners", "Statistics"];
              const protectedPages = ["Owner HQ", "Contracts", "Interviews", "Paint Scheme Voting", "Developmental Rides", "Messages"];
              const labels = savedSession.role === "guest" ? publicPages : [...publicPages, ...protectedPages];
              return labels.map((label) => (
                <div key={label} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, padding: 18, fontWeight: 1000 }}>
                  {label}
                  {savedSession.role === "guest" && protectedPages.includes(label) && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>Login required</div>}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <button type="button" onClick={() => go("/")} style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid #333", background: "#111827", color: "white", fontWeight: 900 }}>
          ← Series Portal
        </button>

        <div style={{ background: "linear-gradient(145deg, #7f1d1d, #111827)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 22, padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 6vw, 58px)" }}>{seriesName}</h1>
          <p style={{ opacity: 0.82, lineHeight: 1.6 }}>
            Sign in to manage your career, team, contracts, interviews, development rides, and series activity. Sign up requests go to admin approval. Guest view stays public-only.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18, marginTop: 18 }}>
          <form onSubmit={handleLogin} style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              <button type="button" onClick={() => setLoginMode("driver")} style={{ padding: "10px 14px", borderRadius: 10, border: loginMode === "driver" ? "1px solid #facc15" : "1px solid #333", background: loginMode === "driver" ? "#7f1d1d" : "#050505", color: "white", fontWeight: 1000 }}>
                Driver Login
              </button>
              <button type="button" onClick={() => setLoginMode("owner")} style={{ padding: "10px 14px", borderRadius: 10, border: loginMode === "owner" ? "1px solid #facc15" : "1px solid #333", background: loginMode === "owner" ? "#7f1d1d" : "#050505", color: "white", fontWeight: 1000 }}>
                Owner Login
              </button>
            </div>

            {loginMode === "driver" ? (
              <>
                <label style={{ fontWeight: 1000 }}>Driver Username</label>
                <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 10 }}>
                  <option value="">Select username</option>
                  {seriesDrivers.map((driver) => {
                    const number = getDriverNumber(driver);
                    return (
                      <option key={driver.id || `${number}-${getDriverName(driver)}`} value={number}>
                        #{number} {getDriverName(driver)}
                      </option>
                    );
                  })}
                </select>
              </>
            ) : (
              <>
                <label style={{ fontWeight: 1000 }}>Owner Username</label>
                <select value={selectedOwner} onChange={(e) => setSelectedOwner(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 10 }}>
                  <option value="">Select owner</option>
                  {listedOwners.map((owner) => {
                    const number = getDriverNumber(owner);
                    return (
                      <option key={owner.id || `${number}-${getDriverName(owner)}`} value={number}>
                        #{number} {getDriverName(owner)} — {owner.team || "Owner"}
                      </option>
                    );
                  })}
                </select>
                <p style={{ margin: "8px 0 0", opacity: 0.72, fontSize: 13 }}>
                  Listed owners use their normal driver password as the owner password.
                </p>
              </>
            )}

            <label style={{ display: "block", marginTop: 14, fontWeight: 1000 }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter driver password" style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 10, boxSizing: "border-box" }} />

            {error && <div style={{ marginTop: 12, color: "#fca5a5", fontWeight: 900 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button type="submit" style={{ padding: "12px 16px", borderRadius: 10, border: 0, background: "#b91c1c", color: "white", fontWeight: 1000 }}>
                Enter {seriesName}
              </button>
              <button type="button" onClick={() => go(`/series/${seriesId}/join`)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #facc15", background: "#111827", color: "#facc15", fontWeight: 1000 }}>
                Sign Up / Request to Join
              </button>
              <button type="button" onClick={handleGuestView} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.24)", background: "#050505", color: "white", fontWeight: 1000 }}>
                View as Guest
              </button>
              {/* <button type="button" onClick={() => setIsReportingIssue(true)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #ef4444", background: "#050505", color: "#fca5a5", fontWeight: 1000 }}>
                🐛 Report Issue
              </button> */}
              {/* TODO: Uncomment once ReportIssueModal.jsx is in repo */}
            </div>
          </form>
        </div>
      </div>
      
      {/* <ReportIssueModal
        isOpen={isReportingIssue}
        onClose={() => setIsReportingIssue(false)}
        driverNumber=""
        driverName="Guest User"
        series={seriesId}
      /> */}
      {/* TODO: Uncomment once ReportIssueModal.jsx is in repo */}
    </div>
  );
}
