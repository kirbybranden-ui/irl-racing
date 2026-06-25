import React, { useMemo, useState } from "react";

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

const NUMBER_POOL = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  ...Array.from({ length: 99 }, (_, i) => String(i + 1)),
];

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

export default function SeriesLandingPage({ seriesId = "cup", drivers = [] }) {
  const [selectedDriver, setSelectedDriver] = useState("");
  const seriesName = SERIES_NAMES[seriesId] || "Series";

  const seriesDrivers = useMemo(() => {
    return (drivers || []).filter((driver) => driverSeriesMatches(driver, seriesId));
  }, [drivers, seriesId]);

  const availableNumbers = useMemo(() => {
    const taken = new Set(seriesDrivers.map((driver) => String(driver.number || driver.carNumber || "").trim()).filter(Boolean));
    return NUMBER_POOL.filter((number) => !taken.has(number));
  }, [seriesDrivers]);

  const go = (to) => { window.location.href = to; };

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 24 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <button type="button" onClick={() => go("/")} style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid #333", background: "#111827", color: "white", fontWeight: 900 }}>
          ← Series Portal
        </button>

        <div style={{ background: "linear-gradient(145deg, #7f1d1d, #111827)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 22, padding: 24 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(34px, 6vw, 58px)" }}>{seriesName}</h1>
          <p style={{ opacity: 0.78, lineHeight: 1.6 }}>
            Select your username to enter this series, or submit a request to join if you are not listed yet.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18, marginTop: 18 }}>
          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18 }}>
            <label style={{ fontWeight: 1000 }}>Driver Username</label>
            <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 10 }}>
              <option value="">Select username</option>
              {seriesDrivers.map((driver) => (
                <option key={driver.id || `${driver.number}-${getDriverName(driver)}`} value={driver.id || getDriverName(driver)}>
                  #{driver.number} {getDriverName(driver)}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button type="button" disabled={!selectedDriver} onClick={() => go(seriesId === "cup" ? "/standings" : `/series/${seriesId}/home`)} style={{ padding: "12px 16px", borderRadius: 10, border: 0, background: selectedDriver ? "#b91c1c" : "#374151", color: "white", fontWeight: 1000 }}>
                Enter {seriesName}
              </button>
              <button type="button" onClick={() => go(`/series/${seriesId}/join`)} style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #facc15", background: "#111827", color: "#facc15", fontWeight: 1000 }}>
                Request to Join
              </button>
            </div>
          </div>

          <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 18 }}>
            <h2 style={{ marginTop: 0 }}>Available Numbers</h2>
            <p style={{ opacity: 0.75 }}>Numbers are locked only inside the selected series. Another driver can use the same number in a different series.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {availableNumbers.map((number) => (
                <span key={number} style={{ padding: "7px 10px", border: "1px solid rgba(255,255,255,0.13)", borderRadius: 9, background: "#050505", fontWeight: 900 }}>
                  {number}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
