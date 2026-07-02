import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { IssueChatPanel } from "../components/IssueChatPanel";

const pageFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(245,245,247,0.94) 36%, rgba(229,229,234,0.98) 100%)",
  color: "#1d1d1f",
  fontFamily: pageFont,
  padding: "clamp(18px, 4vw, 42px)",
  boxSizing: "border-box",
};

const wrapStyle = { maxWidth: 1180, margin: "0 auto" };

const glassCardStyle = {
  borderRadius: 28,
  padding: "clamp(16px, 3vw, 24px)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.58))",
  border: "1px solid rgba(255,255,255,0.78)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
};

const labelStyle = { fontSize: 11, opacity: 0.55, fontWeight: 1000, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 };

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.7)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: "10px 12px",
  boxSizing: "border-box",
  resize: "vertical",
  fontFamily: pageFont,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
};

const selectStyle = {
  background: "rgba(255,255,255,0.8)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 999,
  padding: "10px 16px",
  minWidth: 160,
  fontWeight: 800,
  fontFamily: pageFont,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
};

const pillButtonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "10px 18px",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: pageFont,
  background: "#007aff",
  color: "#ffffff",
  boxShadow: "0 12px 28px rgba(0,122,255,0.24)",
};

const secondaryPillButtonStyle = {
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 999,
  padding: "9px 16px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: pageFont,
  background: "rgba(255,255,255,0.7)",
  color: "#1d1d1f",
};

const statusColors = {
  Submitted: { soft: "rgba(0,122,255,0.12)", text: "#0057d9", ring: "rgba(0,122,255,0.18)", label: "📋 Submitted" },
  Reviewed: { soft: "rgba(175,82,222,0.12)", text: "#7d1fb0", ring: "rgba(175,82,222,0.18)", label: "👀 Reviewed" },
  Actioned: { soft: "rgba(255,149,0,0.14)", text: "#9a5a00", ring: "rgba(255,149,0,0.20)", label: "⚙️ Actioned" },
  Complete: { soft: "rgba(52,199,89,0.14)", text: "#147d35", ring: "rgba(52,199,89,0.20)", label: "✅ Complete" },
  "Needs Work": { soft: "rgba(255,59,48,0.12)", text: "#c62d24", ring: "rgba(255,59,48,0.18)", label: "❌ Needs Work" },
};

function getAdminChatName() {
  if (typeof window === "undefined") return "Admin";
  const stored = sessionStorage.getItem("bcl-admin-chat-name");
  if (stored) return stored;
  const entered = window.prompt('Enter your name for chat (shown as "Admin — Name"). Leave blank to just show "Admin".', "");
  const name = (entered || "").trim();
  sessionStorage.setItem("bcl-admin-chat-name", name || "Admin");
  return name || "Admin";
}

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

  const visibleIssues = seriesFilter
    ? issues.filter((issue) => (issue.series || "cup") === seriesFilter)
    : issues;

  return (
    <div style={pageStyle}>
      <div style={wrapStyle}>
        {/* Header */}
        <div style={{ ...glassCardStyle, marginBottom: 22, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: 20,
              background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              boxShadow: "0 16px 34px rgba(255,59,48,0.28)",
            }}>
              🐛
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(29,29,31,0.55)" }}>
                Budweiser Motorsports
              </div>
              <h1 style={{ margin: "2px 0 0", fontSize: "clamp(24px, 3.4vw, 34px)", letterSpacing: "-0.04em" }}>Issues &amp; Feedback</h1>
              <p style={{ margin: "4px 0 0", opacity: 0.6, fontSize: 13.5, fontWeight: 700 }}>
                Report bugs, suggest features, and track resolution status.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14, marginBottom: 22 }}>
          {[
            { label: "Submitted", value: stats.submitted, color: "#007aff", icon: "📋" },
            { label: "Reviewed", value: stats.reviewed, color: "#af52de", icon: "👀" },
            { label: "Actioned", value: stats.actioned, color: "#ff9500", icon: "⚙️" },
            { label: "Needs Work", value: stats.needsWork, color: "#ff3b30", icon: "❌" },
            { label: "Complete", value: stats.complete, color: "#34c759", icon: "✅" },
          ].map((stat) => (
            <div key={stat.label} style={{
              borderRadius: 24,
              padding: 16,
              background: "rgba(255,255,255,0.76)",
              border: "1px solid rgba(229,231,235,0.9)",
              boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 11, background: `${stat.color}1e`, color: stat.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  {stat.icon}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 1000, color: "#1d1d1f", letterSpacing: "-0.03em" }}>{stat.value}</div>
              <div style={{ fontSize: 11, opacity: 0.55, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ ...glassCardStyle, marginBottom: 22, padding: "14px 18px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <div style={labelStyle}>Status</div>
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
              <div style={labelStyle}>Series</div>
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
          <div style={{ ...glassCardStyle, textAlign: "center", opacity: 0.7, fontWeight: 800 }}>Loading issues…</div>
        ) : visibleIssues.length === 0 ? (
          <div style={{ ...glassCardStyle, textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🎉</div>
            <p style={{ margin: 0, fontWeight: 800, opacity: 0.7 }}>No issues found. Great work!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {visibleIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isAdmin={isAdmin}
                driverNumber={driverNumber}
                onStatusChange={updateIssueStatus}
                onNotesChange={addAdminNotes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function IssueCard({ issue, isAdmin, driverNumber, onStatusChange, onNotesChange }) {
  const [notes, setNotes] = useState(issue.admin_notes || "");
  const [editingNotes, setEditingNotes] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatAuthorName, setChatAuthorName] = useState(isAdmin ? "Admin" : (driverNumber ? `Driver #${driverNumber}` : "Guest"));
  const colors = statusColors[issue.status] || statusColors.Submitted;
  const isReporter = driverNumber && String(driverNumber) === String(issue.driver_number);

  const handleSaveNotes = () => {
    onNotesChange(issue.id, notes);
    setEditingNotes(false);
  };

  const canMarkComplete = isAdmin || (isReporter && issue.status === "Actioned");
  const canMarkNeedsWork = isReporter && issue.status === "Complete";

  return (
    <div style={{
      borderRadius: 28,
      padding: "clamp(16px, 3vw, 22px)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.62))",
      border: `1px solid ${colors.ring}`,
      boxShadow: "0 20px 55px rgba(15,23,42,0.10)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 1000, marginBottom: 6, letterSpacing: "-0.02em" }}>{issue.title}</div>
          <div style={{ fontSize: 12.5, opacity: 0.6, display: "flex", gap: 14, flexWrap: "wrap", fontWeight: 800 }}>
            <span>#{issue.driver_number} {issue.driver_name}</span>
            <span>{issue.series === "arca" ? "🏎️ ARCA" : "🏁 Cup"}</span>
            <span>{new Date(issue.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{
          background: colors.soft,
          color: colors.text,
          borderRadius: 999,
          padding: "7px 14px",
          fontSize: 12,
          fontWeight: 1000,
          whiteSpace: "nowrap",
        }}>
          {colors.label}
        </div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Description</div>
        <div style={{ fontSize: 14, lineHeight: 1.6, background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: 14, color: "#1d1d1f" }}>
          {issue.description}
        </div>
      </div>

      {/* Screenshot */}
      {issue.screenshot_url && (
        <div style={{ marginBottom: 14 }}>
          <div style={labelStyle}>Screenshot</div>
          <img src={issue.screenshot_url} alt="Issue screenshot" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 16, marginTop: 6, border: "1px solid rgba(0,0,0,0.06)" }} />
        </div>
      )}

      {/* Admin Notes */}
      {isAdmin && (
        <div style={{ marginBottom: 14, background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 16, padding: 14 }}>
          <div style={labelStyle}>Admin Notes</div>
          {editingNotes ? (
            <>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes here..."
                rows={3}
                style={{ ...inputStyle, marginBottom: 10 }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleSaveNotes} style={pillButtonStyle}>Save Notes</button>
                <button onClick={() => setEditingNotes(false)} style={secondaryPillButtonStyle}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>
                {notes || <span style={{ opacity: 0.5 }}>No notes yet</span>}
              </div>
              <button
                onClick={() => setEditingNotes(true)}
                style={{ ...secondaryPillButtonStyle, fontSize: 12, padding: "7px 14px" }}
              >
                Edit Notes
              </button>
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 14, marginTop: 4 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => {
              if (isAdmin) setChatAuthorName(getAdminChatName());
              setShowChat(true);
            }}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "9px 16px",
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              color: "#ffffff",
              fontWeight: 900,
              cursor: "pointer",
              fontSize: 13,
              boxShadow: "0 10px 22px rgba(0,122,255,0.22)",
            }}
          >
            💬 Chat
          </button>
          {isAdmin ? (
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
          ) : (
            <>
              {canMarkComplete && (
                <button
                  onClick={() => onStatusChange(issue.id, "Complete")}
                  style={{ ...pillButtonStyle, background: "#34c759", boxShadow: "0 12px 28px rgba(52,199,89,0.28)" }}
                >
                  ✅ Mark Complete
                </button>
              )}
              {canMarkNeedsWork && (
                <button
                  onClick={() => onStatusChange(issue.id, "Needs Work")}
                  style={{ ...pillButtonStyle, background: "#ff3b30", boxShadow: "0 12px 28px rgba(255,59,48,0.28)" }}
                >
                  ❌ Solution Didn't Work
                </button>
              )}
              {!canMarkComplete && !canMarkNeedsWork && (
                <div style={{ fontSize: 13, opacity: 0.65, fontWeight: 800 }}>
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

      {showChat && (
        <IssueChatPanel
          issue={issue}
          isAdmin={isAdmin}
          authorName={chatAuthorName}
          authorNumber={driverNumber || ""}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}
