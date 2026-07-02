import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { IssueChatPanel } from "./IssueChatPanel";

const statusColors = {
  Submitted: { soft: "rgba(0,122,255,0.12)", text: "#0057d9", ring: "rgba(0,122,255,0.18)", label: "📋 Submitted" },
  Reviewed: { soft: "rgba(175,82,222,0.12)", text: "#7d1fb0", ring: "rgba(175,82,222,0.18)", label: "👀 Reviewed" },
  Actioned: { soft: "rgba(255,149,0,0.14)", text: "#9a5a00", ring: "rgba(255,149,0,0.20)", label: "⚙️ Actioned" },
  Complete: { soft: "rgba(52,199,89,0.14)", text: "#147d35", ring: "rgba(52,199,89,0.20)", label: "✅ Complete" },
  "Needs Work": { soft: "rgba(255,59,48,0.12)", text: "#c62d24", ring: "rgba(255,59,48,0.18)", label: "❌ Needs Work" },
};

export function IssuesRollup() {
  const [issues, setIssues] = useState([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [chatIssue, setChatIssue] = useState(null);

  async function loadIssues() {
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
    setHasLoadedOnce(true);
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

  if (!hasLoadedOnce || totalPending === 0) return null;

  return (
    <div style={{
      marginBottom: 24,
      borderRadius: 28,
      padding: 18,
      background: "linear-gradient(180deg, rgba(255,255,255,0.90), rgba(255,255,255,0.62))",
      border: "1px solid rgba(255,255,255,0.78)",
      boxShadow: "0 20px 55px rgba(15,23,42,0.10)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            boxShadow: "0 12px 26px rgba(255,59,48,0.26)",
            flexShrink: 0,
          }}>
            🐛
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 1000, letterSpacing: "-0.02em", color: "#1d1d1f" }}>Pending Issues</h3>
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2, fontWeight: 800, color: "#1d1d1f" }}>
              {submitCount} submitted • {reviewCount} reviewing • {needsWorkCount} needs work
            </div>
          </div>
        </div>
        <button
          onClick={() => window.location.pathname = "/admin/issues"}
          style={{
            background: "#007aff",
            color: "#ffffff",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontWeight: 900,
            cursor: "pointer",
            fontSize: 12.5,
            boxShadow: "0 12px 26px rgba(0,122,255,0.26)",
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
                background: "rgba(255,255,255,0.72)",
                border: `1px solid ${colors.ring}`,
                borderRadius: 20,
                padding: 14,
                boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 1000, marginBottom: 3, color: "#1d1d1f" }}>{issue.title}</div>
                  <div style={{ fontSize: 11.5, opacity: 0.62, fontWeight: 800, color: "#1d1d1f" }}>
                    #{issue.driver_number} {issue.driver_name} • {issue.series === "arca" ? "🏎️ ARCA" : "🏁 Cup"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{
                    background: colors.soft,
                    color: colors.text,
                    borderRadius: 999,
                    padding: "5px 11px",
                    fontSize: 11,
                    fontWeight: 1000,
                    whiteSpace: "nowrap",
                  }}>
                    {colors.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChatIssue(issue)}
                    style={{
                      border: 0,
                      borderRadius: 999,
                      padding: "6px 12px",
                      background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
                      color: "#ffffff",
                      fontWeight: 900,
                      cursor: "pointer",
                      fontSize: 11,
                      boxShadow: "0 8px 18px rgba(0,122,255,0.22)",
                    }}
                  >
                    💬 Chat
                  </button>
                  <select
                    value={issue.status}
                    onChange={(e) => updateIssueStatus(issue.id, e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.85)",
                      color: "#1d1d1f",
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 999,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 900,
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
                        color: "#0057d9",
                        fontSize: 11,
                        fontWeight: 900,
                        textDecoration: "none",
                      }}
                    >
                      📸 Screenshot
                    </a>
                  )}
                </div>
              </div>
              {issue.description && (
                <div style={{ fontSize: 12, opacity: 0.75, color: "#1d1d1f", background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 12, padding: 10, marginBottom: 8 }}>
                  {issue.description.substring(0, 150)}{issue.description.length > 150 ? "..." : ""}
                </div>
              )}
              {issue.admin_notes && (
                <div style={{ fontSize: 11, opacity: 0.75, color: "#9a5a00", fontStyle: "italic", fontWeight: 700 }}>
                  Admin: {issue.admin_notes.substring(0, 80)}{issue.admin_notes.length > 80 ? "..." : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {issues.length > 5 && (
        <div style={{ textAlign: "center", marginTop: 14, opacity: 0.65, fontSize: 12, fontWeight: 800, color: "#1d1d1f" }}>
          +{issues.length - 5} more issues • <span style={{ cursor: "pointer", textDecoration: "underline", color: "#007aff" }} onClick={() => window.location.pathname = "/admin/issues"}>View all</span>
        </div>
      )}

      {chatIssue && (
        <IssueChatPanel
          issue={chatIssue}
          isAdmin={true}
          authorName="Admin"
          authorNumber=""
          onClose={() => setChatIssue(null)}
        />
      )}
    </div>
  );
}
