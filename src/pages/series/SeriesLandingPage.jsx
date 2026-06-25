import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SERIES_NAMES = {
  cup: "Cup Series",
  xfinity: "Xfinity Series",
  trucks: "Craftsman Truck Series",
  arca: "ARCA Menards Series",
};

const numberPool = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  ...Array.from({ length: 99 }, (_, i) => String(i + 1)),
];

export default function SeriesLandingPage() {
  const { seriesId } = useParams();
  const navigate = useNavigate();
  const [selectedDriver, setSelectedDriver] = useState("");

  const seriesName = SERIES_NAMES[seriesId] || "Series";

  // Later this should come from Supabase.
  const drivers = [];

  const availableNumbers = useMemo(() => {
    const takenNumbers = drivers.map((driver) => driver.number);
    return numberPool.filter((number) => !takenNumbers.includes(number));
  }, [drivers]);

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#050505", color: "white" }}>
      <button onClick={() => navigate("/")} style={{ marginBottom: 16 }}>
        ← Back
      </button>

      <h1>{seriesName}</h1>
      <p>Select your username to enter, or request to join this series.</p>

      <div style={{ marginTop: 24 }}>
        <label>Driver Username</label>
        <select
          value={selectedDriver}
          onChange={(e) => setSelectedDriver(e.target.value)}
          style={{ display: "block", padding: 12, marginTop: 8, width: "100%" }}
        >
          <option value="">Select username</option>
          {drivers.map((driver) => (
            <option key={driver.id} value={driver.id}>
              #{driver.number} {driver.username}
            </option>
          ))}
        </select>
      </div>

      <button
        disabled={!selectedDriver}
        onClick={() => navigate(`/series/${seriesId}/home`)}
        style={{ marginTop: 16, padding: 12, width: "100%" }}
      >
        Enter {seriesName}
      </button>

      <button
        onClick={() => navigate(`/series/${seriesId}/join`)}
        style={{
          marginTop: 12,
          padding: 12,
          width: "100%",
          background: "#b30000",
          color: "white",
          fontWeight: "bold",
        }}
      >
        Request to Join
      </button>

      <h3 style={{ marginTop: 32 }}>Available Numbers</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {availableNumbers.map((number) => (
          <span
            key={number}
            style={{
              padding: "6px 10px",
              border: "1px solid #333",
              borderRadius: 8,
              background: "#111",
            }}
          >
            {number}
          </span>
        ))}
      </div>
    </div>
  );
}
