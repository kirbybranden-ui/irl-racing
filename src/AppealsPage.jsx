import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const cardStyle = {
  border: "1px solid #2c3440",
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
  background: "#171b22",
  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
};
const labelStyle = { fontSize: 12, opacity: 0.6, fontWeight: 700, textTransform: "uppercase", marginBottom: 2 };
const valueStyle = { fontSize: 15, marginBottom: 12 };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", resize: "vertical" };
const selectStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", minWidth: 160 };
const saveButtonStyle = { marginTop: 12, background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 };

const statusColors = {
  Open:     { bg: "#1a2030", border: "#3b4f6e", badge: "#3b82f6" },
  Approved: { bg: "#14291a", border: "#2d6641", badge: "#22c55e" },
  Denied:   { bg: "#2a1010", border: "#6b2020", badge: "#ef4444" },
};

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

  const openCount = appeals.filter(a => a.status === "Open").length;
  const resolvedCount = appeals.filter(a => a.status !== "Open").length;

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Appeals Review</h1>
            <div style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>
              {openCount} open · {resolvedCount} resolved
            </div>
          </div>
          <button
            onClick={() => window.location.pathname = "/"}
            style={{ background: "#1e2530", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" }}
          >
            ← Admin
          </button>
        </div>

        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading appeals...</p>
        ) : appeals.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No appeals submitted yet.</p>
        ) : (
          appeals.map((appeal) => (
            <AppealCard key={appeal.id} appeal={appeal} onSave={updateAppeal} />
          ))
        )}
      </div>
    </div>
  );
}

function AppealCard({ appeal, onSave }) {
  const [status, setStatus] = useState(appeal.status || "Open");
  const [notes, setNotes] = useState(appeal.admin_notes || "");
  const [saving, setSaving] = useState(false);

  const colors = statusColors[appeal.status] || statusColors.Open;
  const wasResolved = appeal.status === "Approved" || appeal.status === "Denied";
  const willNotify = (status === "Approved" || status === "Denied") && status !== appeal.status;

  const handleSave = async () => {
    setSaving(true);
    await onSave(appeal.id, status, notes);
    setSaving(false);
  };

  return (
    <div style={{ ...cardStyle, background: colors.bg, borderColor: colors.border }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 2 }}>{appeal.requester}</div>
          <div style={{ fontSize: 12, opacity: 0.55 }}>{new Date(appeal.created_at).toLocaleString()}</div>
        </div>
        <div style={{ background: colors.badge, color: "white", borderRadius: 8, padding: "4px 12px", fontSize: 12, fontWeight: 800 }}>
          {appeal.status}
        </div>
      </div>

      {/* Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
        <div>
          <div style={labelStyle}>Track</div>
          <div style={valueStyle}>{appeal.track}</div>
        </div>
        {appeal.lap_number != null && (
          <div>
            <div style={labelStyle}>Lap</div>
            <div style={valueStyle}>{appeal.lap_number}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Description</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>{appeal.description}</div>
      </div>

      {/* Evidence video */}
      {appeal.evidence_url ? (
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Evidence</div>
          <video controls width="100%" style={{ maxWidth: 480, borderRadius: 8, marginTop: 6 }} src={appeal.evidence_url} />
        </div>
      ) : (
        <div style={{ marginBottom: 14, fontSize: 13, opacity: 0.55 }}>No video evidence uploaded</div>
      )}

      {/* Previous admin notes if already resolved */}
      {wasResolved && appeal.admin_notes && (
        <div style={{ marginBottom: 14, background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: 12 }}>
          <div style={labelStyle}>Previous Determination</div>
          <div style={{ fontSize: 14, lineHeight: 1.5 }}>{appeal.admin_notes}</div>
        </div>
      )}

      {/* Controls */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
          <select style={selectStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Open">Open</option>
            <option value="Approved">Approved</option>
            <option value="Denied">Denied</option>
          </select>
          {willNotify && (
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
              🔔 Driver will be notified on their profile page
            </div>
          )}
        </div>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add league determination / admin notes for the driver..."
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <button style={saveButtonStyle} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Determination"}
        </button>
      </div>
    </div>
  );
}
