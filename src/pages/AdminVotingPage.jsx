import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  dangerButtonStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "../styles/sharedStyles";

export default function AdminVotingPage({ drivers = [] }) {
  const [votes, setVotes] = useState([]);
  const [options, setOptions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", deadline: "", active: true, optionsText: "Yes\nNo\nAbstain" });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function loadAdminVotes() {
    const [{ data: voteRows, error: voteError }, { data: optionRows }, { data: responseRows }] = await Promise.all([
      supabase.from("league_votes").select("*").order("created_at", { ascending: false }),
      supabase.from("league_vote_options").select("*").order("created_at", { ascending: true }),
      supabase.from("league_vote_responses").select("*").order("submitted_at", { ascending: false }),
    ]);
    if (voteError) {
      console.error("Could not load admin votes:", voteError);
      setError("Could not load votes. Check Supabase tables and RLS policies.");
      return;
    }
    setVotes((voteRows || []).map(normalizeVoteRow));
    setOptions(optionRows || []);
    setResponses(responseRows || []);
  }

  useEffect(() => { loadAdminVotes(); }, []);

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createVote(event) {
    event.preventDefault();
    setStatus("");
    setError("");
    const title = form.title.trim();
    const optionLines = form.optionsText.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!title) return setError("Vote title is required.");
    if (!form.deadline) return setError("Deadline is required.");
    if (optionLines.length < 2) return setError("Add at least two vote options, one per line.");

    const deadlineIso = new Date(form.deadline).toISOString();
    const { data: insertedVote, error: voteError } = await supabase
      .from("league_votes")
      .insert({ title, description: form.description.trim(), deadline: deadlineIso, active: Boolean(form.active), created_at: new Date().toISOString() })
      .select("*")
      .single();

    if (voteError || !insertedVote) {
      console.error("Could not create vote:", voteError);
      setError("Could not create vote. Check league_votes insert policy and columns.");
      return;
    }

    const rows = optionLines.map((optionText) => ({ vote_id: insertedVote.id, option_text: optionText, created_at: new Date().toISOString() }));
    const { error: optionError } = await supabase.from("league_vote_options").insert(rows);
    if (optionError) {
      console.error("Could not create vote options:", optionError);
      setError("Vote was created, but options failed. Check league_vote_options policies and columns.");
      return;
    }

    setStatus("Vote created successfully.");
    setForm({ title: "", description: "", deadline: "", active: true, optionsText: "Yes\nNo\nAbstain" });
    await loadAdminVotes();
  }

  async function toggleVote(vote) {
    const { error } = await supabase.from("league_votes").update({ active: !vote.active }).eq("id", vote.id);
    if (error) return setError("Could not update vote active status.");
    await loadAdminVotes();
  }

  function getVoteOptions(voteId) {
    return options.filter((option) => String(option.vote_id) === String(voteId));
  }

  function getVoteResponses(voteId) {
    return responses.filter((response) => String(response.vote_id) === String(voteId));
  }

  function exportVoteCsv(vote) {
    const rows = getVoteResponses(vote.id);
    const csvRows = [["Vote", "Driver Number", "Driver", "Team", "Manufacturer", "Option", "Submitted At"], ...rows.map((row) => [vote.title, row.driver_number || "", row.driver_name || "", row.team || "", row.manufacturer || "", row.option_text || "", row.submitted_at || ""] )];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `league-vote-${String(vote.title || "vote").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <h1 style={{ margin: 0 }}>Admin Voting Control</h1>
              <div style={{ opacity: 0.72, marginTop: 6 }}>Create votes, set deadlines, close voting, and review/export results.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/vote")} style={primaryButtonStyle}>Open Public Vote Page</button>
              <button onClick={() => (window.location.pathname = "/admin")} style={secondaryButtonStyle}>Back to Admin</button>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 440px) 1fr", gap: 18, alignItems: "start" }}>
          <form onSubmit={createVote} style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Create New Vote</h2>
            <div style={{ display: "grid", gap: 12 }}>
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="Vote title" style={inputStyle} />
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} placeholder="Vote description" rows={4} style={inputStyle} />
              <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>DEADLINE</label>
              <input type="datetime-local" value={form.deadline} onChange={(event) => updateForm("deadline", event.target.value)} style={inputStyle} />
              <label style={{ fontSize: 12, fontWeight: 900, opacity: 0.75 }}>OPTIONS — ONE PER LINE</label>
              <textarea value={form.optionsText} onChange={(event) => updateForm("optionsText", event.target.value)} rows={7} style={inputStyle} />
              <label style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 900 }}>
                <input type="checkbox" checked={form.active} onChange={(event) => updateForm("active", event.target.checked)} /> Active immediately
              </label>
              <button type="submit" style={primaryButtonStyle}>Create Vote</button>
            </div>
            {status && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{status}</div>}
            {error && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{error}</div>}
          </form>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Vote Results</h2>
            <div style={{ display: "grid", gap: 14 }}>
              {votes.map((vote) => {
                const voteOptions = getVoteOptions(vote.id);
                const voteResponses = getVoteResponses(vote.id);
                const statusInfo = getVoteDeadlineStatus(vote.deadline);
                return (
                  <div key={vote.id} style={{ background: "#10141b", border: "1px solid #2a3240", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <h3 style={{ margin: 0 }}>{vote.title}</h3>
                        <div style={{ opacity: 0.72, marginTop: 4 }}>{vote.description}</div>
                        <div style={{ fontSize: 12, opacity: 0.68, marginTop: 6 }}>Deadline: {statusInfo.label} — {statusInfo.remaining}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "start" }}>
                        <button type="button" onClick={() => toggleVote(vote)} style={vote.active ? dangerButtonStyle : primaryButtonStyle}>{vote.active ? "Close" : "Reopen"}</button>
                        <button type="button" onClick={() => exportVoteCsv(vote)} style={secondaryButtonStyle}>Export CSV</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                      {voteOptions.map((option) => {
                        const count = voteResponses.filter((row) => String(row.option_id) === String(option.id)).length;
                        const percent = voteResponses.length ? Math.round((count / voteResponses.length) * 100) : 0;
                        return (
                          <div key={option.id}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: 13 }}><span>{option.option_text}</span><span>{count} vote(s) — {percent}%</span></div>
                            <div style={{ height: 10, background: "#0b0f15", borderRadius: 999, overflow: "hidden", marginTop: 4 }}><div style={{ width: `${percent}%`, height: "100%", background: "#d4af37" }} /></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {votes.length === 0 && <div style={{ opacity: 0.72 }}>No votes created yet.</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

