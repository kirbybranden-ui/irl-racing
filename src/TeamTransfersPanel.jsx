import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  boxSizing: "border-box",
};

const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};

const primaryButtonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#2a3140",
  color: "white",
  border: "1px solid #3d4859",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function getTeamFullName(team) {
  const names = {
    JAM: "JA Motorsports",
    MER: "ME Racing",
    MMS: "Mayhem Motorsports",
    NLM: "Nine Line Motorsports",
    BOM: "Blue Oval Motorsports",
    WSM: "Wyatt Sick6 Motorsports",
    BWR: "Big Wheel Racing",
    KDM: "Kev Din Motorsports",
    BMX: "BayouX Motorsports",
    BXM: "BayouX Motorsports",
    "19XI": "19XI Racing",
    IND: "Independent",
    Independent: "Independent",
  };
  return names[team] || team || "Unknown Team";
}

function normalizeTeams(allTeams = []) {
  const seen = new Set();
  return (allTeams || [])
    .map((item) => (typeof item === "string" ? item : item?.team || item?.team_key || item?.abbr))
    .filter((team) => team && team !== "Independent" && team !== "IND")
    .filter((team) => {
      const key = String(team).trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
}

export default function TeamTransfersPanel({ currentTeam, allTeams = [], currentOwnerName = "Owner Portal" }) {
  const activeTeams = useMemo(() => normalizeTeams(allTeams), [allTeams]);
  const [financeRows, setFinanceRows] = useState([]);
  const [transferLog, setTransferLog] = useState([]);
  const [toTeam, setToTeam] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const financeByTeam = useMemo(() => {
    const map = new Map();
    (financeRows || []).forEach((row) => {
      if (row?.team) map.set(String(row.team), row);
    });
    return map;
  }, [financeRows]);

  const cleanCurrentTeam = String(currentTeam || "").trim();
  const currentFinance = financeByTeam.get(cleanCurrentTeam);
  const receiverOptions = activeTeams.filter((team) => String(team) !== cleanCurrentTeam);
  const visibleLog = (transferLog || []).filter((row) => row.from_team === cleanCurrentTeam || row.to_team === cleanCurrentTeam);

  async function loadTransfers() {
    setLoading(true);
    setError("");

    const [{ data: finances, error: financeError }, { data: logs, error: logError }] = await Promise.all([
      supabase.from("team_finances").select("*").order("team", { ascending: true }),
      supabase.from("team_payment_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (financeError) {
      console.error("Could not load team finances:", financeError);
      setError("Could not load team finances. Check team_finances select policy.");
    } else {
      setFinanceRows(finances || []);
    }

    if (logError) {
      console.error("Could not load transfer log:", logError);
      setError((current) => current || "Could not load transfer log. Check team_payment_logs select policy.");
    } else {
      setTransferLog(logs || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadTransfers();
  }, [cleanCurrentTeam]);

  async function submitInstantTransfer(event) {
    event?.preventDefault?.();
    setNotice("");
    setError("");

    const cleanToTeam = String(toTeam || "").trim();
    const transferAmount = Number(amount || 0);
    const cleanReason = String(reason || "").trim();

    if (!cleanCurrentTeam) {
      setError("Could not identify the logged-in team.");
      return;
    }
    if (!cleanToTeam) {
      setError("Choose the team receiving the money.");
      return;
    }
    if (cleanToTeam === cleanCurrentTeam) {
      setError("A team cannot send money to itself.");
      return;
    }
    if (!transferAmount || transferAmount <= 0) {
      setError("Enter an amount greater than $0.");
      return;
    }

    const payer = financeByTeam.get(cleanCurrentTeam);
    const receiver = financeByTeam.get(cleanToTeam);

    if (!payer || !receiver) {
      setError("Both teams need a row in team_finances before transfers can be used.");
      return;
    }

    const payerBalance = Number(payer.balance || 0);
    const receiverBalance = Number(receiver.balance || 0);

    if (payerBalance < transferAmount) {
      setError(`${getTeamFullName(cleanCurrentTeam)} only has ${money(payerBalance)} available.`);
      return;
    }

    if (!window.confirm(`Send ${money(transferAmount)} from ${getTeamFullName(cleanCurrentTeam)} to ${getTeamFullName(cleanToTeam)}? This deducts immediately.`)) {
      return;
    }

    setSubmitting(true);
    const now = new Date().toISOString();

    const payerUpdate = await supabase
      .from("team_finances")
      .update({ balance: payerBalance - transferAmount, updated_at: now })
      .eq("id", payer.id);

    if (payerUpdate.error) {
      console.error("Could not debit sending team:", payerUpdate.error);
      setSubmitting(false);
      setError("Could not deduct money from the sending team. Check team_finances update policy.");
      return;
    }

    const receiverUpdate = await supabase
      .from("team_finances")
      .update({ balance: receiverBalance + transferAmount, updated_at: now })
      .eq("id", receiver.id);

    if (receiverUpdate.error) {
      console.error("Could not credit receiving team:", receiverUpdate.error);
      await supabase.from("team_finances").update({ balance: payerBalance, updated_at: new Date().toISOString() }).eq("id", payer.id);
      setSubmitting(false);
      setError("Could not credit the receiving team. The sending team was rolled back.");
      return;
    }

    const logPayload = {
      from_team: cleanCurrentTeam,
      to_team: cleanToTeam,
      amount: transferAmount,
      reason: cleanReason || null,
      memo: cleanReason || null,
      created_by: currentOwnerName || "Owner Portal",
      created_at: now,
      reversed: false,
    };

    const { data: insertedLog, error: logError } = await supabase.from("team_payment_logs").insert([logPayload]).select().single();
    if (logError) {
      console.error("Transfer completed but log failed:", logError);
      setError("Transfer completed, but the log failed to save. Check team_payment_logs insert policy.");
    } else {
      await supabase.from("league_messages").insert([{
        message_type: "team_transfer",
        sender_type: "team",
        sender_name: getTeamFullName(cleanCurrentTeam),
        recipient_type: "team",
        recipient_team: cleanToTeam,
        subject: `Team Transfer Received: ${money(transferAmount)}`,
        message: `${getTeamFullName(cleanCurrentTeam)} sent ${money(transferAmount)} to ${getTeamFullName(cleanToTeam)}.${cleanReason ? `\n\nReason: ${cleanReason}` : ""}`,
        related_page: "/team-hq",
        related_id: insertedLog?.id || null,
        is_read: false,
        created_at: now,
      }]);

      setNotice(`${money(transferAmount)} sent to ${getTeamFullName(cleanToTeam)}. Money deducted immediately.`);
      setToTeam("");
      setAmount("");
      setReason("");
    }

    setSubmitting(false);
    await loadTransfers();
  }

  return (
    <div style={sectionCardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>💰 Team Transfers</h2>
          <div style={{ fontSize: 13, opacity: 0.72, marginTop: 6 }}>
            Send money directly to another team. The balance deducts immediately from {getTeamFullName(cleanCurrentTeam)}.
          </div>
        </div>
        <button type="button" onClick={loadTransfers} style={secondaryButtonStyle} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</button>
      </div>

      <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 12, opacity: 0.68, fontWeight: 900 }}>AVAILABLE BALANCE</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: currentFinance ? "#d4af37" : "#f87171" }}>
          {currentFinance ? money(currentFinance.balance || 0) : "Missing finance row"}
        </div>
      </div>

      <form onSubmit={submitInstantTransfer} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>RECEIVING TEAM</label>
            <select value={toTeam} onChange={(event) => setToTeam(event.target.value)} style={inputStyle}>
              <option value="">Select team</option>
              {receiverOptions.map((team) => (
                <option key={team} value={team}>{getTeamFullName(team)} — {money(financeByTeam.get(team)?.balance || 0)}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>AMOUNT</label>
            <input type="number" min="1" step="1" value={amount} onChange={(event) => setAmount(event.target.value)} style={inputStyle} placeholder="25000" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>REASON</label>
            <input value={reason} onChange={(event) => setReason(event.target.value)} style={inputStyle} placeholder="Number sale, buyout, alliance payment..." />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
          <button type="submit" style={primaryButtonStyle} disabled={submitting}>{submitting ? "Sending..." : "Send Funds Now"}</button>
          {notice && <div style={{ color: "#4ade80", fontWeight: 900 }}>{notice}</div>}
          {error && <div style={{ color: "#f87171", fontWeight: 900 }}>{error}</div>}
        </div>
      </form>

      <h3 style={{ margin: "0 0 10px" }}>Transfer History</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>From</th>
              <th style={thStyle}>To</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {visibleLog.length === 0 ? (
              <tr><td style={tdStyle} colSpan={5}>No transfers for this team yet.</td></tr>
            ) : visibleLog.map((transfer) => (
              <tr key={transfer.id || `${transfer.created_at}-${transfer.from_team}-${transfer.to_team}-${transfer.amount}`}>
                <td style={tdStyle}>{transfer.created_at ? new Date(transfer.created_at).toLocaleString() : "—"}</td>
                <td style={tdStyle}>{getTeamFullName(transfer.from_team)}</td>
                <td style={tdStyle}>{getTeamFullName(transfer.to_team)}</td>
                <td style={{ ...tdStyle, fontWeight: 900, color: "#d4af37" }}>{money(transfer.amount || 0)}</td>
                <td style={tdStyle}>{transfer.reason || transfer.memo || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
