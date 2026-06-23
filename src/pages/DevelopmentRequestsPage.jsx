import React, { useEffect, useMemo, useState } from "react";

const SERIES_OPTIONS = [
  { value: "xfinity", label: "Xfinity Series" },
  { value: "truck", label: "Truck Series" },
  { value: "arca", label: "ARCA Series" },
];

const STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
  completed: "Completed",
  cancelled: "Cancelled",
};

const txCard = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 18px 50px rgba(0,0,0,0.3)",
};

const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(2,6,23,0.8)",
  color: "white",
  outline: "none",
};

const buttonStyle = {
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

function normalizeSeries(value) {
  return String(value || "").trim().toLowerCase();
}

function getCurrentDriver(currentUser, leagueState) {
  const number = String(
    currentUser?.number || currentUser?.driver_number || currentUser?.carNumber || ""
  );

  const drivers = Array.isArray(leagueState?.drivers) ? leagueState.drivers : [];
  const found = drivers.find((d) => String(d.number) === number);

  return {
    number: number || found?.number || "",
    name:
      currentUser?.driverName ||
      currentUser?.driver_name ||
      currentUser?.name ||
      found?.name ||
      found?.driver ||
      "Cup Driver",
    team: currentUser?.team || found?.team || "",
    owner: currentUser?.owner || found?.owner || "",
    series: normalizeSeries(currentUser?.series || found?.series || "cup"),
  };
}

function getLowerSeriesTeams(leagueState) {
  const teams = Array.isArray(leagueState?.teams) ? leagueState.teams : [];

  const fallbackTeams = [
    { team: "Xfinity Open Team", owner: "TBD", series: "xfinity" },
    { team: "Truck Open Team", owner: "TBD", series: "truck" },
    { team: "ARCA Open Team", owner: "TBD", series: "arca" },
  ];

  const lowerTeams = teams
    .filter((t) => ["xfinity", "truck", "arca"].includes(normalizeSeries(t.series)))
    .map((t) => ({
      team: t.team || t.name || t.abbr || "Unnamed Team",
      owner: t.owner || "TBD",
      series: normalizeSeries(t.series),
    }));

  return lowerTeams.length ? lowerTeams : fallbackTeams;
}

function statusBadge(label, tone = "neutral") {
  const colors = {
    neutral: "rgba(148,163,184,0.18)",
    good: "rgba(34,197,94,0.18)",
    bad: "rgba(239,68,68,0.18)",
    warn: "rgba(234,179,8,0.18)",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        padding: "5px 9px",
        background: colors[tone] || colors.neutral,
        border: "1px solid rgba(255,255,255,0.12)",
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      {label}
    </span>
  );
}

export default function DevelopmentRequestsPage({
  leagueState,
  currentUser,
  isAdmin = false,
  supabase,
  go,
}) {
  const currentDriver = useMemo(
    () => getCurrentDriver(currentUser, leagueState),
    [currentUser, leagueState]
  );

  const lowerSeriesTeams = useMemo(
    () => getLowerSeriesTeams(leagueState),
    [leagueState]
  );

  const isCupDriver = currentDriver.series === "cup";
  const isOwner = Boolean(currentUser?.isOwner || currentUser?.owner || currentUser?.role === "owner");
  const ownerName = currentUser?.owner || currentUser?.name || currentUser?.driverName || "";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [starts, setStarts] = useState([]);

  const [requestedSeries, setRequestedSeries] = useState("xfinity");
  const [requestedTeam, setRequestedTeam] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [adminOverrideReason, setAdminOverrideReason] = useState("");

  const filteredTeams = lowerSeriesTeams.filter((t) => t.series === requestedSeries);

  useEffect(() => {
    if (!requestedTeam && filteredTeams[0]?.team) {
      setRequestedTeam(filteredTeams[0].team);
    }
  }, [requestedSeries, requestedTeam, filteredTeams]);

  async function loadData() {
    if (!supabase) {
      setError("Supabase client was not passed into DevelopmentRequestsPage.");
      return;
    }

    setLoading(true);
    setError("");

    const [txResult, startsResult] = await Promise.all([
      supabase
        .from("league_transactions")
        .select("*")
        .eq("transaction_type", "development_request")
        .order("created_at", { ascending: false }),
      supabase
        .from("developmental_starts")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (txResult.error) setError(txResult.error.message);
    if (startsResult.error) setError(startsResult.error.message);

    setTransactions(txResult.data || []);
    setStarts(startsResult.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myStartsBySeries = useMemo(() => {
    const counts = { xfinity: 0, truck: 0, arca: 0 };
    starts.forEach((s) => {
      if (
        String(s.driver_number) === String(currentDriver.number) &&
        s.counts_against_limit !== false &&
        counts[s.series] !== undefined
      ) {
        counts[s.series] += 1;
      }
    });
    return counts;
  }, [starts, currentDriver.number]);

  const visibleTransactions = useMemo(() => {
    if (isAdmin) return transactions;

    if (isOwner) {
      return transactions.filter(
        (tx) =>
          String(tx.requested_owner || "").toLowerCase() === String(ownerName || "").toLowerCase() ||
          String(tx.current_owner || "").toLowerCase() === String(ownerName || "").toLowerCase()
      );
    }

    return transactions.filter(
      (tx) => String(tx.driver_number) === String(currentDriver.number)
    );
  }, [transactions, isAdmin, isOwner, ownerName, currentDriver.number]);

  async function submitRequest() {
    setSaving(true);
    setError("");

    const team = lowerSeriesTeams.find(
      (t) => t.series === requestedSeries && t.team === requestedTeam
    );

    const count = myStartsBySeries[requestedSeries] || 0;
    const limitReached = count >= 2;

    if (!isCupDriver) {
      setSaving(false);
      setError("Only Cup Series drivers can submit developmental start requests.");
      return;
    }

    if (limitReached && !isAdmin) {
      setSaving(false);
      setError("This driver has reached the 2-race developmental limit for this series. Admin override is required.");
      return;
    }

    const payload = {
      transaction_type: "development_request",
      driver_number: String(currentDriver.number),
      driver_name: currentDriver.name,
      current_series: "cup",
      requested_series: requestedSeries,
      current_team: currentDriver.team || null,
      requested_team: requestedTeam,
      current_owner: currentDriver.owner || null,
      requested_owner: team?.owner || "TBD",
      initiated_by: currentDriver.name,
      owner_status: "pending",
      board_status: "pending",
      final_status: "pending",
      request_note: requestNote || null,
      admin_override: Boolean(limitReached && isAdmin),
      admin_override_by: limitReached && isAdmin ? currentDriver.name : null,
      admin_override_reason: limitReached && isAdmin ? adminOverrideReason || "Admin override" : null,
    };

    const { error: insertError } = await supabase
      .from("league_transactions")
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
    } else {
      setRequestNote("");
      setAdminOverrideReason("");
      await loadData();
    }

    setSaving(false);
  }

  async function updateTransaction(tx, patch) {
    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("league_transactions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", tx.id);

    if (updateError) setError(updateError.message);
    await loadData();
    setSaving(false);
  }

  async function ownerApprove(tx) {
    await updateTransaction(tx, {
      owner_status: "approved",
      board_status: "pending",
      final_status: "pending",
      owner_note: tx.owner_note || "Owner approved. Sent to board.",
    });
  }

  async function ownerDeny(tx) {
    await updateTransaction(tx, {
      owner_status: "denied",
      final_status: "denied",
      owner_note: tx.owner_note || "Owner denied request.",
    });
  }

  async function boardApprove(tx) {
    await updateTransaction(tx, {
      board_status: "approved",
      final_status: "approved",
      board_note: tx.board_note || "Board approved developmental start.",
    });
  }

  async function boardDeny(tx) {
    await updateTransaction(tx, {
      board_status: "denied",
      final_status: "denied",
      board_note: tx.board_note || "Board denied request.",
    });
  }

  async function recordStart(tx) {
    setSaving(true);
    setError("");

    const payload = {
      driver_number: String(tx.driver_number),
      driver_name: tx.driver_name,
      cup_driver: true,
      series: tx.requested_series,
      season: 2026,
      race_name: null,
      owner: tx.requested_owner,
      team: tx.requested_team,
      points_eligible: false,
      payout_eligible: false,
      counts_against_limit: true,
      admin_override: Boolean(tx.admin_override),
      admin_override_by: tx.admin_override_by,
      admin_override_reason: tx.admin_override_reason,
    };

    const { error: startError } = await supabase
      .from("developmental_starts")
      .insert(payload);

    if (startError) {
      setError(startError.message);
      setSaving(false);
      return;
    }

    await updateTransaction(tx, { final_status: "completed" });
    setSaving(false);
  }

  return (
    <div style={{ color: "white", padding: 18, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <button
          style={{ ...buttonStyle, background: "rgba(255,255,255,0.12)", color: "white" }}
          onClick={() => (go ? go("/") : window.history.back())}
        >
          Back
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 30 }}>Development Requests</h1>
          <p style={{ margin: "5px 0 0", color: "rgba(255,255,255,0.68)" }}>
            Cup drivers can request lower-series starts. Owners approve first, then the board approves.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ ...txCard, borderColor: "rgba(239,68,68,0.45)", marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={txCard}>
          <h2 style={{ marginTop: 0 }}>Your Developmental Limits</h2>
          {SERIES_OPTIONS.map((s) => (
            <div
              key={s.value}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <span>{s.label}</span>
              <strong>{myStartsBySeries[s.value] || 0} / 2</strong>
            </div>
          ))}
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
            Cup drivers earn no lower-series driver points or driver payout. Team and owner payouts stay active.
          </p>
        </div>

        <div style={txCard}>
          <h2 style={{ marginTop: 0 }}>Request a Lower-Series Start</h2>
          {!isCupDriver && !isAdmin ? (
            <p style={{ color: "rgba(255,255,255,0.7)" }}>
              Only Cup Series drivers can request developmental starts.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              <label>
                <div style={{ fontWeight: 900, marginBottom: 5 }}>Series</div>
                <select
                  style={inputStyle}
                  value={requestedSeries}
                  onChange={(e) => {
                    setRequestedSeries(e.target.value);
                    const nextTeam = lowerSeriesTeams.find((t) => t.series === e.target.value);
                    setRequestedTeam(nextTeam?.team || "");
                  }}
                >
                  {SERIES_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>

              <label>
                <div style={{ fontWeight: 900, marginBottom: 5 }}>Team</div>
                <select
                  style={inputStyle}
                  value={requestedTeam}
                  onChange={(e) => setRequestedTeam(e.target.value)}
                >
                  {filteredTeams.map((t) => (
                    <option key={`${t.series}-${t.team}`} value={t.team}>
                      {t.team} — Owner: {t.owner}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <div style={{ fontWeight: 900, marginBottom: 5 }}>Request Note</div>
                <textarea
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  value={requestNote}
                  onChange={(e) => setRequestNote(e.target.value)}
                  placeholder="Example: I want to run this race for fun and help the team earn owner money."
                />
              </label>

              {isAdmin && (myStartsBySeries[requestedSeries] || 0) >= 2 && (
                <label>
                  <div style={{ fontWeight: 900, marginBottom: 5 }}>Admin Override Reason</div>
                  <textarea
                    style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
                    value={adminOverrideReason}
                    onChange={(e) => setAdminOverrideReason(e.target.value)}
                    placeholder="Required when approving a request over the 2-race limit."
                  />
                </label>
              )}

              <button
                style={{ ...buttonStyle, background: "#d4af37", color: "#111" }}
                disabled={saving}
                onClick={submitRequest}
              >
                {saving ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={txCard}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <h2 style={{ marginTop: 0 }}>Requests</h2>
          <button
            style={{ ...buttonStyle, background: "rgba(255,255,255,0.12)", color: "white" }}
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : visibleTransactions.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.65)" }}>No development requests found.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {visibleTransactions.map((tx) => {
              const ownerPending = tx.owner_status === "pending";
              const boardPending = tx.owner_status === "approved" && tx.board_status === "pending";
              const approved = tx.final_status === "approved";
              const completed = tx.final_status === "completed";

              return (
                <div
                  key={tx.id}
                  style={{
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14,
                    padding: 14,
                    background: "rgba(2,6,23,0.45)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong style={{ fontSize: 18 }}>
                        #{tx.driver_number} {tx.driver_name}
                      </strong>
                      <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                        Cup → {String(tx.requested_series || "").toUpperCase()} | {tx.requested_team}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {statusBadge(`Owner: ${STATUS_LABELS[tx.owner_status] || tx.owner_status}`, tx.owner_status === "approved" ? "good" : tx.owner_status === "denied" ? "bad" : "warn")}
                      {statusBadge(`Board: ${STATUS_LABELS[tx.board_status] || tx.board_status}`, tx.board_status === "approved" ? "good" : tx.board_status === "denied" ? "bad" : "warn")}
                      {statusBadge(`Final: ${STATUS_LABELS[tx.final_status] || tx.final_status}`, tx.final_status === "approved" || completed ? "good" : tx.final_status === "denied" ? "bad" : "neutral")}
                      {tx.admin_override && statusBadge("Admin Override", "warn")}
                    </div>
                  </div>

                  {tx.request_note && (
                    <p style={{ color: "rgba(255,255,255,0.75)" }}>{tx.request_note}</p>
                  )}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    {isOwner && ownerPending && (
                      <>
                        <button style={{ ...buttonStyle, background: "#22c55e", color: "#052e16" }} disabled={saving} onClick={() => ownerApprove(tx)}>
                          Owner Approve
                        </button>
                        <button style={{ ...buttonStyle, background: "#ef4444", color: "white" }} disabled={saving} onClick={() => ownerDeny(tx)}>
                          Owner Deny
                        </button>
                      </>
                    )}

                    {isAdmin && boardPending && (
                      <>
                        <button style={{ ...buttonStyle, background: "#22c55e", color: "#052e16" }} disabled={saving} onClick={() => boardApprove(tx)}>
                          Board Approve
                        </button>
                        <button style={{ ...buttonStyle, background: "#ef4444", color: "white" }} disabled={saving} onClick={() => boardDeny(tx)}>
                          Board Deny
                        </button>
                      </>
                    )}

                    {isAdmin && approved && !completed && (
                      <button style={{ ...buttonStyle, background: "#d4af37", color: "#111" }} disabled={saving} onClick={() => recordStart(tx)}>
                        Mark Start Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
