import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const numberPool = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  ...Array.from({ length: 99 }, (_, i) => String(i + 1)),
];

const SERIES_NAMES = {
  cup: "Cup Series",
  xfinity: "Xfinity Series",
  trucks: "Craftsman Truck Series",
  arca: "ARCA Menards Series",
};

export default function SeriesJoinPage() {
  const { seriesId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    gamertag: "",
    preferredNumber: "",
    preferredTeam: "",
    role: "Driver",
    notes: "",
  });

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submitRequest = () => {
    const request = {
      id: crypto.randomUUID(),
      seriesId,
      seriesName: SERIES_NAMES[seriesId],
      ...form,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("series_join_requests") || "[]");
    localStorage.setItem("series_join_requests", JSON.stringify([request, ...existing]));

    alert("Join request submitted to admin.");
    navigate(`/series/${seriesId}`);
  };

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#050505", color: "white" }}>
      <button onClick={() => navigate(`/series/${seriesId}`)}>← Back</button>

      <h1>Request to Join {SERIES_NAMES[seriesId]}</h1>

      <input placeholder="Username" onChange={(e) => update("username", e.target.value)} />
      <input placeholder="PSN / Gamertag" onChange={(e) => update("gamertag", e.target.value)} />

      <select onChange={(e) => update("preferredNumber", e.target.value)}>
        <option value="">Preferred Number</option>
        {numberPool.map((number) => (
          <option key={number} value={number}>{number}</option>
        ))}
      </select>

      <input placeholder="Preferred Team" onChange={(e) => update("preferredTeam", e.target.value)} />

      <select onChange={(e) => update("role", e.target.value)}>
        <option>Driver</option>
        <option>Owner</option>
        <option>Owner / Driver</option>
      </select>

      <textarea placeholder="Notes" onChange={(e) => update("notes", e.target.value)} />

      <button onClick={submitRequest}>Submit Request</button>
    </div>
  );
}
