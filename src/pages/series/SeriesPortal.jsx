import React from "react";
import { useNavigate } from "react-router-dom";

const SERIES = [
  { id: "cup", name: "Cup Series" },
  { id: "xfinity", name: "Xfinity Series" },
  { id: "trucks", name: "Craftsman Truck Series" },
  { id: "arca", name: "ARCA Menards Series" },
];

export default function SeriesPortal() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#050505", color: "white" }}>
      <h1>Budweiser Cup League</h1>
      <h2>Select Your Series</h2>

      <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
        {SERIES.map((series) => (
          <button
            key={series.id}
            onClick={() => navigate(`/series/${series.id}`)}
            style={{
              padding: 24,
              fontSize: 22,
              fontWeight: "bold",
              borderRadius: 14,
              border: "1px solid #333",
              background: "#b30000",
              color: "white",
              cursor: "pointer",
            }}
          >
            {series.name}
          </button>
        ))}
      </div>
    </div>
  );
}
