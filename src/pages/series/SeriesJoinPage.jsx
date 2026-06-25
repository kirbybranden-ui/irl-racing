import React, { useMemo, useState } from "react";

const SERIES_NAMES = {
  cup: "Cup Series",
  xfinity: "Xfinity Series",
  trucks: "Craftsman Truck Series",
  arca: "ARCA Menards Series",
};

const NUMBER_POOL = [
  "00", "01", "02", "03", "04", "05", "06", "07", "08", "09",
  ...Array.from({ length: 99 }, (_, i) => String(i + 1)),
];

export default function SeriesJoinPage({ seriesId = "cup", drivers = [], teams = [] }) {
  const seriesName = SERIES_NAMES[seriesId] || "Series";
  const [form, setForm] = useState({
    username: "",
    gamertag: "",
    preferredNumber: "",
    preferredTeam: "",
    role: "Driver",
    notes: "",
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const go = (to) => { window.location.href = to; };

  const availableNumbers = useMemo(() => {
    const taken = new Set((drivers || [])
      .filter((driver) => seriesId === "cup" ? !driver.series || String(driver.series).toLowerCase().includes("cup") : String(driver.series || "").toLowerCase().includes(seriesId))
      .map((driver) => String(driver.number || "").trim())
      .filter(Boolean));
    return NUMBER_POOL.filter((number) => !taken.has(number));
  }, [drivers, seriesId]);

  function submitRequest() {
    if (!form.username.trim() || !form.gamertag.trim() || !form.preferredNumber) {
      alert("Please enter username, gamertag, and preferred number.");
      return;
    }

    const request = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      seriesId,
      seriesName,
      ...form,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem("series_join_requests") || "[]");
    localStorage.setItem("series_join_requests", JSON.stringify([request, ...existing]));
    alert("Join request submitted to admin.");
    go(`/series/${seriesId}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "white", padding: 24 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <button type="button" onClick={() => go(`/series/${seriesId}`)} style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, border: "1px solid #333", background: "#111827", color: "white", fontWeight: 900 }}>
          ← Back to {seriesName}
        </button>

        <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 22 }}>
          <h1 style={{ marginTop: 0 }}>Request to Join {seriesName}</h1>

          <div style={{ display: "grid", gap: 12 }}>
            <input value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="Username" style={{ padding: 12, borderRadius: 10 }} />
            <input value={form.gamertag} onChange={(e) => update("gamertag", e.target.value)} placeholder="PSN / Gamertag" style={{ padding: 12, borderRadius: 10 }} />

            <select value={form.preferredNumber} onChange={(e) => update("preferredNumber", e.target.value)} style={{ padding: 12, borderRadius: 10 }}>
              <option value="">Preferred Number</option>
              {availableNumbers.map((number) => <option key={number} value={number}>{number}</option>)}
            </select>

            <select value={form.preferredTeam} onChange={(e) => update("preferredTeam", e.target.value)} style={{ padding: 12, borderRadius: 10 }}>
              <option value="">Preferred Team / Independent</option>
              {(teams || []).map((team) => (
                <option key={team.team || team.id || team.name} value={team.team || team.name}>
                  {team.name || team.teamName || team.team || team.id}
                </option>
              ))}
            </select>

            <select value={form.role} onChange={(e) => update("role", e.target.value)} style={{ padding: 12, borderRadius: 10 }}>
              <option>Driver</option>
              <option>Owner</option>
              <option>Owner / Driver</option>
            </select>

            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Notes for admin" rows={5} style={{ padding: 12, borderRadius: 10 }} />

            <button type="button" onClick={submitRequest} style={{ padding: 14, borderRadius: 12, border: 0, background: "#b91c1c", color: "white", fontWeight: 1000 }}>
              Submit Request to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
