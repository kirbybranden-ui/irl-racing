import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAppeals() {
    setLoading(true);

    const { data, error } = await supabase
      .from("appeals")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setAppeals([]);
      setLoading(false);
      return;
    }

    setAppeals(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAppeals();
  }, []);

  async function updateAppeal(id, status, admin_notes) {
    const { error } = await supabase
      .from("appeals")
      .update({ status, admin_notes })
      .eq("id", id);

    if (error) {
      alert("Update failed");
      return;
    }

    await loadAppeals();
  }

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Appeals Review</h1>

      {loading ? (
        <p>Loading appeals...</p>
      ) : appeals.length === 0 ? (
        <p>No appeals submitted.</p>
      ) : (
        appeals.map((appeal) => (
          <AppealCard key={appeal.id} appeal={appeal} onSave={updateAppeal} />
        ))
      )}
    </div>
  );
}

function AppealCard({ appeal, onSave }) {
  const [status, setStatus] = useState(appeal.status || "Open");
  const [notes, setNotes] = useState(appeal.admin_notes || "");

  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        background: "#1b1b1b",
      }}
    >
      <p><strong>Requester:</strong> {appeal.requester}</p>
      <p><strong>Track:</strong> {appeal.track}</p>
      <p><strong>Lap:</strong> {appeal.lap_number ?? "-"}</p>
      <p><strong>Description:</strong> {appeal.description}</p>
      <p><strong>Status:</strong> {appeal.status}</p>

      {appeal.evidence_url ? (
        <div style={{ marginBottom: 12 }}>
          <p><strong>Evidence:</strong></p>
          <video controls width="320" src={appeal.evidence_url} />
        </div>
      ) : (
        <p><strong>Evidence:</strong> None uploaded</p>
      )}

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Open">Open</option>
        <option value="Approved">Approved</option>
        <option value="Denied">Denied</option>
      </select>

      <div style={{ marginTop: 10 }}>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Admin notes / determination"
          style={{ width: "100%" }}
        />
      </div>

      <button
        style={{ marginTop: 10 }}
        onClick={() => onSave(appeal.id, status, notes)}
      >
        Save Determination
      </button>
    </div>
  );
}
