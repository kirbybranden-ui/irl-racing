import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

const statusColors = {
  Submitted: { bg: "#1a2030", border: "#3b4f6e", badge: "#3b82f6", label: "📋 Submitted" },
  Reviewed: { bg: "#1a2820", border: "#3b6b4f", badge: "#8b5cf6", label: "👀 Reviewed" },
  Actioned: { bg: "#2a2010", border: "#6b5020", badge: "#f59e0b", label: "⚙️ Actioned" },
  Complete: { bg: "#142a14", border: "#2d642d", badge: "#22c55e", label: "✅ Complete" },
  "Needs Work": { bg: "#2a1010", border: "#6b2020", badge: "#ef4444", label: "❌ Needs Work" },
};

export function IssuesRollup() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadIssues() {
    setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .in("status", ["Submitted", "Reviewed", "Needs Work"])
      .order("created_at", { ascending: false });

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
    const interval = setInterval(loadIssues, 10000);
    return () => clearInterval(interval);
  }, []);

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

  const submitCount = issues.filter(i => i.status === "Submitted").length;
  const reviewCount = issues.filter(i => i.status === "Reviewed").length;
  const needsWorkCount = issues.filter(i => i.status === "Needs Work").length;
  const totalPending = submitCount + reviewCount + needsWorkCount;

  if (loading || totalPending === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>🐛 Pending Issues</h3>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
            {submitCount} submitted • {reviewCount} reviewing • {needsWorkCount} needs work
          </div>
        </div>
        <button
          onClick={() => window.location.pathname = "/admin/issues"}
          style={{
            background: "#d4af37",
            color: "#111",
            border: "none",
            borderRadius: 10,
            padding: "8px 16px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          View All Issues
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {issues.slice(0, 5).map((issue) => {
          const colors = statusColors[issue.status] || statusColors.Submitted;
          return (
            <div
              key={issue.id}
              style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 2 }}>{issue.title}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>
                    #{issue.driver_number} {issue.driver_name} • {issue.series === "arca" ? "🏎️ ARCA" : "🏁 Cup"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={issue.status}
                    onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                    style={{
                      background: "#0f1319",
                      color: "white",
                      border: "1px solid #313947",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <option value="Submitted">📋 Submitted</option>
                    <option value="Reviewed">👀 Reviewed</option>
                    <option value="Actioned">⚙️ Actioned</option>
                    <option value="Needs Work">❌ Needs Work</option>
                    <option value="Complete">✅ Complete</option>
                  </select>
                  {issue.screenshot_url && (
                    <a
                      href={issue.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#d4af37",
                        fontSize: 11,
                        fontWeight: 700,
                        textDecoration: "none",
                      }}
                    >
                      📸 Screenshot
                    </a>
                  )}
                </div>
              </div>
              {issue.description && (
                <div style={{ fontSize: 12, opacity: 0.8, background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  {issue.description.substring(0, 150)}{issue.description.length > 150 ? "..." : ""}
                </div>
              )}
              {issue.admin_notes && (
                <div style={{ fontSize: 11, opacity: 0.7, color: "#d4af37", fontStyle: "italic" }}>
                  Admin: {issue.admin_notes.substring(0, 80)}{issue.admin_notes.length > 80 ? "..." : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {issues.length > 5 && (
        <div style={{ textAlign: "center", marginTop: 12, opacity: 0.6, fontSize: 12 }}>
          +{issues.length - 5} more issues • <span style={{ cursor: "pointer", textDecoration: "underline", color: "#d4af37" }} onClick={() => window.location.pathname = "/admin/issues"}>View all</span>
        </div>
      )}
    </div>
  );
}
