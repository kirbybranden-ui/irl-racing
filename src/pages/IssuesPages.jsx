import React, { useEffect, useState } from "react";
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
const buttonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 };
const secondaryButtonStyle = { background: "#1e2530", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };

const statusColors = {
  Submitted: { bg: "#1a2030", border: "#3b4f6e", badge: "#3b82f6", label: "📋 Submitted" },
  Reviewed: { bg: "#1a2820", border: "#3b6b4f", badge: "#8b5cf6", label: "👀 Reviewed" },
  Actioned: { bg: "#2a2010", border: "#6b5020", badge: "#f59e0b", label: "⚙️ Actioned" },
  Complete: { bg: "#142a14", border: "#2d642d", badge: "#22c55e", label: "✅ Complete" },
  "Needs Work": { bg: "#2a1010", border: "#6b2020", badge: "#ef4444", label: "❌ Needs Work" },
};

export default function IssuesPage({ isAdmin = false, driverNumber = null, seriesId = "cup" }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [seriesFilter, setSeriesFilter] = useState(seriesId);

  async function loadIssues() {
    setLoading(true);
    let query = supabase.from("issues").select("*").order("created_at", { ascending: false });

    if (statusFilter !== "All") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading issues:", error);
      setIssues([]);
    } else {
      setIssues(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadIssues();
  }, [statusFilter]);

  async function updateIssueStatus(id, newStatus) {
    const { error } = await supabase
      .from("issues")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Failed to update issue");
      return;
    }
    loadIssues();
  }

  async function addAdminNotes(id, notes) {
    const { error } = await supabase
      .from("issues")
      .update({ admin_notes: notes, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Failed to save notes");
      return;
    }
    loadIssues();
  }

  const stats = {
    submitted: issues.filter(i => i.status === "Submitted").length,
    reviewed: issues.filter(i => i.status === "Reviewed").length,
    actioned: issues.filter(i => i.status === "Actioned").length,
    complete: issues.filter(i => i.status === "Complete").length,
    needsWork: issues.filter(i => i.status === "Needs Work").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900 }}>🐛 Issues & Feedback</h1>
          <p style={{ opacity: 0.7, fontSize: 14, marginTop: 8 }}>
            Report bugs, suggest features, and track resolution status
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Submitted", value: stats.submitted, color: "#3b82f6" },
            { label: "Reviewed", value: stats.reviewed, color: "#8b5cf6" },
            { label: "Actioned", value: stats.actioned, color: "#f59e0b" },
            { label: "Needs Work", value: stats.needsWork, color: "#ef4444" },
            { label: "Complete", value: stats.complete, color: "#22c55e" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 12, opacity: 0.6, textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={selectStyle}>
              <option value="All">All Statuses</option>
              <option value="Submitted">📋 Submitted</option>
              <option value="Reviewed">👀 Reviewed</option>
              <option value="Actioned">⚙️ Actioned</option>
              <option value="Needs Work">❌ Needs Work</option>
              <option value="Complete">✅ Complete</option>
            </select>
          </div>
          {isAdmin && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Series</label>
              <select value={seriesFilter} onChange={(e) => setSeriesFilter(e.target.value)} style={selectStyle}>
                <option value="">All Series</option>
                <option value="cup">🏁 Cup</option>
                <option value="arca">🏎️ ARCA</option>
              </select>
            </div>
          )}
        </div>

        {/* Issues List */}
        {loading ? (
          <p style={{ opacity: 0.7 }}>Loading issues...</p>
        ) : issues.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: "center", opacity: 0.7 }}>
            <p>No issues found. Great work! 🎉</p>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              isAdmin={isAdmin}
              driverNumber={driverNumber}
              onStatusChange={updateIssueStatus}
              onNotesChange={addAdminNotes}
            />
          ))
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue, isAdmin, driverNumber, onStatusChange, onNotesChange }) {
  const [notes, setNotes] = useState(issue.admin_notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const colors = statusColors[issue.status] || statusColors.Submitted;
  const isReporter = driverNumber && String(driverNumber) === String(issue.driver_number);

  const handleSaveNotes = () => {
    onNotesChange(issue.id, notes);
    setEditingNotes(false);
  };

  const canMarkComplete = isAdmin || (isReporter && issue.status === "Actioned");
  const canMarkNeedsWork = isReporter && issue.status === "Complete";

  return (
    <div style={{ ...cardStyle, background: colors.bg, borderColor: colors.border }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4 }}>{issue.title}</div>
          <div style={{ fontSize: 13, opacity: 0.7, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>#{issue.driver_number} {issue.driver_name}</span>
            <span>{issue.series === "arca" ? "🏎️ ARCA" : "🏁 Cup"}</span>
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ background: colors.badge, color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
          {colors.label}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Description</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
          {issue.description}
        </div>
      </div>

      {/* Screenshot */}
      {issue.screenshot_url && (
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Screenshot</div>
          <img src={issue.screenshot_url} alt="Issue screenshot" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, marginTop: 6 }} />
        </div>
      )}

      {/* Admin Notes */}
      {isAdmin && (
        <div style={{ marginBottom: 14, background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: 12 }}>
          <div style={labelStyle}>Admin Notes</div>
          {editingNotes ? (
            <>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes here..."
                rows={3}
                style={{ ...inputStyle, marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleSaveNotes} style={buttonStyle}>Save Notes</button>
                <button onClick={() => setEditingNotes(false)} style={secondaryButtonStyle}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 8 }}>
                {notes || <span style={{ opacity: 0.5 }}>No notes yet</span>}
              </div>
              <button onClick={() => setEditingNotes(true)} style={secondaryButtonStyle} style={{ fontSize: 12, padding: "6px 10px" }}>
                Edit Notes
              </button>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {isAdmin ? (
            <>
              <select
                value={issue.status}
                onChange={(e) => onStatusChange(issue.id, e.target.value)}
                style={selectStyle}
              >
                <option value="Submitted">📋 Submitted</option>
                <option value="Reviewed">👀 Reviewed</option>
                <option value="Actioned">⚙️ Actioned</option>
                <option value="Needs Work">❌ Needs Work</option>
                <option value="Complete">✅ Complete</option>
              </select>
            </>
          ) : (
            <>
              {canMarkComplete && (
                <button
                  onClick={() => onStatusChange(issue.id, "Complete")}
                  style={{ ...buttonStyle, background: "#22c55e" }}
                >
                  ✅ Mark Complete
                </button>
              )}
              {canMarkNeedsWork && (
                <button
                  onClick={() => onStatusChange(issue.id, "Needs Work")}
                  style={{ ...buttonStyle, background: "#ef4444" }}
                >
                  ❌ Solution Didn't Work
                </button>
              )}
              {!canMarkComplete && !canMarkNeedsWork && (
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {issue.status === "Submitted" && "⏳ Awaiting review..."}
                  {issue.status === "Reviewed" && "👀 Admin is reviewing..."}
                  {issue.status === "Actioned" && "⚙️ Issue has been actioned. Check the admin notes!"}
                  {issue.status === "Needs Work" && "🔄 Admin will look at this again..."}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
