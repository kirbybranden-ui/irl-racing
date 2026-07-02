import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ReportIssueModal } from "../components/ReportIssueModal";
import { IssueChatPanel } from "../components/IssueChatPanel";
import { EditIssueModal } from "../components/EditIssueModal";
import { defaultDrivers } from "../data/drivers";
import { defaultArcaDrivers } from "../data/arca/drivers";

const pageFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(245,245,247,0.94) 36%, rgba(229,229,234,0.98) 100%)",
  color: "#1d1d1f",
  fontFamily: pageFont,
  padding: "clamp(18px, 4vw, 42px)",
  boxSizing: "border-box",
};

const wrapStyle = { maxWidth: 1000, margin: "0 auto" };

const glassCardStyle = {
  borderRadius: 28,
  padding: "clamp(16px, 3vw, 24px)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.86), rgba(255,255,255,0.58))",
  border: "1px solid rgba(255,255,255,0.78)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.10)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
};

const statusColors = {
  Submitted: { soft: "rgba(0,122,255,0.12)", text: "#0057d9", ring: "rgba(0,122,255,0.18)", label: "📋 Submitted" },
  Reviewed: { soft: "rgba(175,82,222,0.12)", text: "#7d1fb0", ring: "rgba(175,82,222,0.18)", label: "👀 Reviewed" },
  Actioned: { soft: "rgba(255,149,0,0.14)", text: "#9a5a00", ring: "rgba(255,149,0,0.20)", label: "⚙️ Actioned" },
  Complete: { soft: "rgba(52,199,89,0.14)", text: "#147d35", ring: "rgba(52,199,89,0.20)", label: "✅ Complete" },
  "Needs Work": { soft: "rgba(255,59,48,0.12)", text: "#c62d24", ring: "rgba(255,59,48,0.18)", label: "❌ Needs Work" },
};

export default function IssuesRollupPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReportingIssue, setIsReportingIssue] = useState(false);
  const [chatIssue, setChatIssue] = useState(null);
  const [editIssue, setEditIssue] = useState(null);

  const allLeagueDrivers = [
    ...(defaultDrivers || []).map((driver) => ({
      key: `cup-${driver.id || driver.number}`,
      number: driver.number || "",
      name: driver.name || "Unknown Driver",
      seriesLabel: "Cup / Xfinity / Truck Rosters",
    })),
    ...(defaultArcaDrivers || []).map((driver) => ({
      key: `arca-${driver.id || driver.number}`,
      number: driver.number || "",
      name: driver.name || "Unknown Driver",
      seriesLabel: "ARCA Series",
    })),
  ];

  async function loadIssues(isInitialLoad = false) {
    if (isInitialLoad) setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading issues:", error);
      setIssues([]);
    } else {
      setIssues(data || []);
    }
    if (isInitialLoad) setLoading(false);
  }

  useEffect(() => {
    loadIssues(true);
    const interval = setInterval(() => loadIssues(false), 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || issues.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const openChatId = params.get("openChat");
    if (!openChatId) return;
    const match = issues.find((i) => String(i.id) === String(openChatId));
    if (match) {
      setChatIssue(match);
      // Clean the query param out of the URL so refreshing doesn't reopen it.
      params.delete("openChat");
      const cleanedSearch = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (cleanedSearch ? `?${cleanedSearch}` : ""));
    }
  }, [issues]);

  function closeReportModal() {
    setIsReportingIssue(false);
    loadIssues(false);
  }

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
              flexShrink: 0,
            }}>
              🐛
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(29,29,31,0.55)" }}>
                Budweiser Motorsports
              </div>
              <h1 style={{ margin: "2px 0 0", fontSize: "clamp(24px, 3.4vw, 34px)", letterSpacing: "-0.04em" }}>Issues &amp; Feedback</h1>
              <p style={{ margin: "4px 0 0", opacity: 0.6, fontSize: 13.5, fontWeight: 700 }}>
                Found a bug or have feedback? Submit it below and track its status here.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              aria-label="Go to league landing page"
              onClick={() => (window.location.pathname = "/")}
              title="Home"
              style={{
                width: 50,
                height: 50,
                borderRadius: 16,
                border: "1px solid rgba(17,24,39,0.10)",
                background: "linear-gradient(180deg, #ffd60a 0%, #ff9f0a 100%)",
                color: "#ffffff",
                boxShadow: "0 16px 38px rgba(255,159,10,0.30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 20,
                fontWeight: 1000,
                flexShrink: 0,
              }}
            >
              🏠
            </button>

            <button
              type="button"
              onClick={() => setIsReportingIssue(true)}
              style={{
                border: 0,
                borderRadius: 999,
                padding: "14px 20px",
                background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
                color: "#ffffff",
                fontWeight: 1000,
                cursor: "pointer",
                fontSize: 14,
                boxShadow: "0 16px 34px rgba(255,59,48,0.28)",
                whiteSpace: "nowrap",
              }}
            >
              🐛 Report an Issue
            </button>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div style={{ ...glassCardStyle, textAlign: "center", opacity: 0.7, fontWeight: 800 }}>Loading issues…</div>
        ) : issues.length === 0 ? (
          <div style={{ ...glassCardStyle, textAlign: "center" }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>🎉</div>
            <p style={{ margin: 0, fontWeight: 800, opacity: 0.7 }}>No issues reported. Great work!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {issues.map((issue) => {
              const colors = statusColors[issue.status] || statusColors.Submitted;
              return (
                <div
                  key={issue.id}
                  style={{
                    background: "rgba(255,255,255,0.72)",
                    border: `1px solid ${colors.ring}`,
                    borderRadius: 22,
                    padding: 16,
                    boxShadow: "0 14px 32px rgba(15,23,42,0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 15, fontWeight: 1000, marginBottom: 4, color: "#1d1d1f" }}>{issue.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 800, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>#{issue.driver_number} {issue.driver_name}</span>
                        <span>{issue.series === "arca" ? "🏎️ ARCA" : "🏁 Cup"}</span>
                        <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <span style={{
                      background: colors.soft,
                      color: colors.text,
                      borderRadius: 999,
                      padding: "6px 13px",
                      fontSize: 11.5,
                      fontWeight: 1000,
                      whiteSpace: "nowrap",
                    }}>
                      {colors.label}
                    </span>
                  </div>

                  {issue.description && (
                    <div style={{ fontSize: 13.5, lineHeight: 1.55, color: "#1d1d1f", background: "rgba(0,0,0,0.035)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 14, padding: 12, marginBottom: issue.admin_notes || issue.screenshot_url ? 10 : 0 }}>
                      {issue.description}
                    </div>
                  )}

                  {issue.screenshot_url && (
                    <a
                      href={issue.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", color: "#0057d9", fontSize: 12, fontWeight: 900, textDecoration: "none", marginBottom: issue.admin_notes ? 10 : 0 }}
                    >
                      📸 View Screenshot
                    </a>
                  )}

                  {issue.admin_notes && (
                    <div style={{ fontSize: 12, color: "#9a5a00", fontStyle: "italic", fontWeight: 700, background: "rgba(255,149,0,0.08)", borderRadius: 12, padding: 10, marginBottom: 10 }}>
                      Admin: {issue.admin_notes}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 12, marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => setChatIssue(issue)}
                      style={{
                        border: 0,
                        borderRadius: 999,
                        padding: "8px 15px",
                        background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
                        color: "#ffffff",
                        fontWeight: 900,
                        cursor: "pointer",
                        fontSize: 12.5,
                        boxShadow: "0 10px 22px rgba(0,122,255,0.22)",
                      }}
                    >
                      💬 Chat
                    </button>
                    {issue.status === "Submitted" && (
                      <button
                        type="button"
                        onClick={() => setEditIssue(issue)}
                        style={{
                          border: "1px solid rgba(0,0,0,0.10)",
                          borderRadius: 999,
                          padding: "8px 15px",
                          background: "rgba(255,255,255,0.7)",
                          color: "#1d1d1f",
                          fontWeight: 900,
                          cursor: "pointer",
                          fontSize: 12.5,
                        }}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ReportIssueModal
        isOpen={isReportingIssue}
        onClose={closeReportModal}
        driverNumber=""
        driverName="Guest User"
        series="cup"
        drivers={allLeagueDrivers}
      />

      {chatIssue && (
        <IssueChatPanel
          issue={chatIssue}
          isAdmin={false}
          authorName="Guest"
          authorNumber=""
          drivers={allLeagueDrivers}
          onClose={() => setChatIssue(null)}
        />
      )}

      {editIssue && (
        <EditIssueModal
          issue={editIssue}
          onClose={() => setEditIssue(null)}
          onSaved={() => loadIssues(false)}
        />
      )}
    </div>
  );
}
