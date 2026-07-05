import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import {
  dedupeDriversByNumber,
  isInactivePlaceholderDriver,
} from "../utils/driverHelpers";
import { getTeamFullName } from "../data/teams";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "../styles/sharedStyles";

function getVoteDeadlineStatus(deadline) {
  if (!deadline) return { closed: false, label: "No deadline set", remaining: "Open" };
  const deadlineDate = new Date(deadline);
  if (Number.isNaN(deadlineDate.getTime())) return { closed: false, label: "Invalid deadline", remaining: "Open" };
  const diff = deadlineDate.getTime() - Date.now();
  if (diff <= 0) return { closed: true, label: deadlineDate.toLocaleString(), remaining: "Voting Closed" };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { closed: false, label: deadlineDate.toLocaleString(), remaining: `${days}d ${hours}h ${minutes}m left` };
}

function normalizeVoteRow(row = {}) {
  return {
    ...row,
    title: row.title || row.vote_title || "League Vote",
    description: row.description || row.vote_description || "",
    deadline: row.deadline || row.deadline_at || row.closes_at || row.ends_at || "",
    active: row.active !== false,
  };
}

export default function LeagueVotingPage({ drivers = [] }) {
  const [votes, setVotes] = useState([]);
  const [optionsByVote, setOptionsByVote] = useState({});
  const [responses, setResponses] = useState([]);
  const [selectedVoteId, setSelectedVoteId] = useState("");
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [driver, setDriver] = useState(null);
  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const activeDrivers = useMemo(() => dedupeDriversByNumber(drivers || []).filter((item) => !item.retired && !isInactivePlaceholderDriver(item)).sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999)), [drivers]);

  async function loadVotes() {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("league_votes")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load league votes:", error);
      setError("Could not load league votes. Create the league_votes, league_vote_options, and league_vote_responses tables and check RLS policies.");
      setVotes([]);
      setLoading(false);
      return;
    }

    const cleanVotes = (data || []).map(normalizeVoteRow);
    setVotes(cleanVotes);
    if (!selectedVoteId && cleanVotes.length) setSelectedVoteId(cleanVotes[0].id);

    const voteIds = cleanVotes.map((vote) => vote.id).filter(Boolean);
    if (voteIds.length) {
      const [{ data: optionRows, error: optionError }, { data: responseRows, error: responseError }] = await Promise.all([
        supabase.from("league_vote_options").select("*").in("vote_id", voteIds).order("created_at", { ascending: true }),
        supabase.from("league_vote_responses").select("*").in("vote_id", voteIds),
      ]);

      if (optionError) console.error("Could not load vote options:", optionError);
      if (responseError) console.error("Could not load vote responses:", responseError);

      const grouped = {};
      (optionRows || []).forEach((option) => {
        const key = String(option.vote_id || "");
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(option);
      });
      setOptionsByVote(grouped);
      setResponses(responseRows || []);
    } else {
      setOptionsByVote({});
      setResponses([]);
    }

    setLoading(false);
  }

  useEffect(() => { loadVotes(); }, []);

  const selectedVote = useMemo(() => votes.find((vote) => String(vote.id) === String(selectedVoteId)) || null, [votes, selectedVoteId]);
  const selectedOptions = selectedVote ? (optionsByVote[String(selectedVote.id)] || []) : [];
  const selectedStatus = getVoteDeadlineStatus(selectedVote?.deadline);
  const driverAlreadyVoted = !!(driver && selectedVote && responses.some((row) => String(row.vote_id) === String(selectedVote.id) && String(row.driver_number) === String(driver.number || driver.driver_number)));

  async function loginDriver(event) {
    event.preventDefault();
    setMessage("");
    setError("");
    const number = String(driverNumber || "").trim();
    const code = String(password || "").trim();
    if (!number || !code) {
      setError("Select your driver and enter your driver password.");
      return;
    }

    const { data, error } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    if (error) {
      console.error("Could not verify driver vote login:", error);
      setError("Could not verify access. Check driver_access_codes select policy and columns.");
      return;
    }

    const enteredCode = code.toUpperCase();
    const match = (data || []).find((row) => {
      const rowNumber = String(row.driver_number ?? row.car_number ?? "").trim();
      const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean);
      return rowNumber === number && possibleCodes.includes(enteredCode) && row.active !== false;
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";

    if (!match && !adminMatch) {
      setError("Invalid car number or driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((item) => String(item.number) === number) || {};
    const authRow = match || {};
    setDriver({ ...authRow, ...rosterDriver, number, driver_number: number, name: rosterDriver.name || authRow.driver_name || authRow.name || `#${number}` });
    setMessage(`Logged in as #${number}.`);
  }

  async function submitVote() {
    setMessage("");
    setError("");
    if (!driver) return setError("You must log in before voting.");
    if (!selectedVote) return setError("Select a vote first.");
    if (selectedStatus.closed) return setError("Voting is closed. The deadline has passed.");
    if (!selectedOptionId) return setError("Select an option before submitting your vote.");
    if (driverAlreadyVoted) return setError("You have already voted on this item.");

    const option = selectedOptions.find((item) => String(item.id) === String(selectedOptionId));
    const payload = {
      vote_id: selectedVote.id,
      option_id: selectedOptionId,
      option_text: option?.option_text || option?.label || "",
      driver_number: String(driver.number || driver.driver_number || ""),
      driver_name: driver.name || driver.driver_name || `#${driver.number || driver.driver_number}`,
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
      submitted_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("league_vote_responses").insert(payload);
    if (error) {
      console.error("Could not submit vote:", error);
      if (String(error.message || "").toLowerCase().includes("duplicate")) setError("You have already voted on this item.");
      else setError(`Could not submit vote: ${error.message || "Check league_vote_responses columns and RLS policies."}`);
      return;
    }

    setMessage("Vote submitted successfully.");
    setSelectedOptionId("");
    await loadVotes();
  }

  const isPhone = typeof window !== "undefined" && window.innerWidth <= 760;
  const voteResponseCount = selectedVote
    ? responses.filter((row) => String(row.vote_id) === String(selectedVote.id)).length
    : 0;

  const pageStyle = isPhone
    ? {
        minHeight: "100vh",
        background: "#070a0f",
        color: "white",
        fontFamily: "Arial, sans-serif",
        paddingBottom: 92,
        overflowX: "hidden",
      }
    : appShellStyle;

  const containerStyle = isPhone
    ? { width: "100%", maxWidth: 520, margin: "0 auto", padding: "12px 12px 92px", boxSizing: "border-box", overflowX: "hidden" }
    : pageContainerStyle;

  const cardStyle = isPhone
    ? {
        background: "linear-gradient(180deg, #151a22 0%, #0f141b 100%)",
        border: "1px solid rgba(212,175,55,0.22)",
        borderRadius: 18,
        padding: 14,
        marginBottom: 12,
        boxShadow: "0 12px 28px rgba(0,0,0,0.34)",
        minWidth: 0,
        overflow: "hidden",
      }
    : sectionCardStyle;

  const heroStyle = isPhone
    ? {
        ...cardStyle,
        background: "linear-gradient(135deg, #d4af37 0%, #9f7414 45%, #111827 100%)",
        color: "#ffffff",
        padding: 16,
        position: "relative",
        overflow: "hidden",
      }
    : { ...sectionCardStyle, background: "linear-gradient(135deg, #191d25 0%, #10141b 100%)" };

  const mobileInputStyle = isPhone
    ? {
        ...inputStyle,
        minHeight: 48,
        borderRadius: 14,
        fontSize: 16,
        background: "#090d13",
        border: "1px solid #303a49",
      }
    : inputStyle;

  const mobilePrimaryButtonStyle = isPhone
    ? {
        ...primaryButtonStyle,
        width: "100%",
        minHeight: 50,
        borderRadius: 14,
        fontSize: 15,
        boxShadow: "0 10px 24px rgba(212,175,55,0.24)",
      }
    : primaryButtonStyle;

  const mobileSecondaryButtonStyle = isPhone
    ? {
        ...secondaryButtonStyle,
        width: "100%",
        minHeight: 46,
        borderRadius: 14,
        fontSize: 14,
      }
    : secondaryButtonStyle;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: isPhone ? "flex-start" : "center", flexDirection: isPhone ? "column" : "row" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 1000, letterSpacing: 1.1, textTransform: "uppercase", color: isPhone ? "#111" : "#d4af37", background: isPhone ? "rgba(255,255,255,0.75)" : "transparent", display: "inline-block", padding: isPhone ? "5px 8px" : 0, borderRadius: 999 }}>
                Official Ballot
              </div>
              <h1 style={{ margin: "8px 0 4px", fontSize: isPhone ? 30 : 38, lineHeight: 1 }}>🗳️ League Voting</h1>
              <p style={{ opacity: 0.86, margin: 0, lineHeight: 1.45, fontSize: isPhone ? 14 : 16 }}>
                Pick your car, enter your driver password, and cast your vote before the deadline.
              </p>
            </div>
            {!isPhone && <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>}
          </div>
        </div>

        {isPhone && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <button type="button" onClick={() => (window.location.pathname = "/vote")} style={mobilePrimaryButtonStyle}>Paint Vote</button>
            <button type="button" onClick={() => (window.location.pathname = "/standings")} style={mobileSecondaryButtonStyle}>Home</button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: isPhone ? "minmax(0, 1fr)" : "minmax(280px, 380px) minmax(0, 1fr)", gap: isPhone ? 12 : 18, alignItems: "start", minWidth: 0, overflowX: "hidden" }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: isPhone ? 18 : 24 }}>Driver Login</h2>
              {driver && <span style={{ color: "#4ade80", fontSize: 12, fontWeight: 1000 }}>SIGNED IN</span>}
            </div>

            {!driver ? (
              <form onSubmit={loginDriver} style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Car / Driver</span>
                  <select value={driverNumber} onChange={(event) => setDriverNumber(event.target.value)} style={mobileInputStyle}>
                    <option value="">Select Your Driver</option>
                    {activeDrivers.map((item) => (
                      <option key={item.id || item.number} value={String(item.number)}>
                        #{item.number} — {item.name} ({getTeamFullName(item.team)})
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: "#aab3c2", fontSize: 11, fontWeight: 1000, textTransform: "uppercase" }}>Driver Password</span>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter driver password" style={mobileInputStyle} />
                </label>
                <button type="submit" style={mobilePrimaryButtonStyle}>Log In To Vote</button>
              </form>
            ) : (
              <div style={{ background: "#090d13", border: "1px solid #2a3240", borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#aab3c2", fontWeight: 1000, textTransform: "uppercase" }}>Logged In As</div>
                <div style={{ fontSize: isPhone ? 22 : 24, fontWeight: 1000, marginTop: 4 }}>#{driver.number} {driver.name}</div>
                <div style={{ color: "#aab3c2", fontSize: 13, marginTop: 3 }}>{getTeamFullName(driver.team || "Independent")} • {driver.manufacturer || ""}</div>
                <button type="button" onClick={() => { setDriver(null); setPassword(""); setMessage("Logged out."); }} style={{ ...mobileSecondaryButtonStyle, marginTop: 12 }}>Log Out</button>
              </div>
            )}
            {message && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900, lineHeight: 1.35 }}>{message}</div>}
            {error && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900, lineHeight: 1.35 }}>{error}</div>}
          </div>

          <div style={{ ...cardStyle, overflowX: isPhone ? "auto" : cardStyle.overflow, WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isPhone ? 18 : 24 }}>Open Votes</h2>
              {!loading && <span style={{ color: "#aab3c2", fontSize: 12, fontWeight: 900 }}>{votes.length} open</span>}
            </div>

            {loading && <div style={{ color: "#aab3c2" }}>Loading votes...</div>}
            {!loading && votes.length === 0 && <div style={{ opacity: 0.72 }}>No active votes are open right now.</div>}

            {votes.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                {isPhone ? (
                  <>
                    <div style={{ color: "#aab3c2", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.7 }}>Swipe ballots →</div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", overflowY: "hidden", paddingBottom: 8, WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", maxWidth: "100%" }}>
                    {votes.map((vote) => {
                      const active = String(vote.id) === String(selectedVoteId);
                      return (
                        <button
                          key={vote.id}
                          type="button"
                          onClick={() => { setSelectedVoteId(vote.id); setSelectedOptionId(""); }}
                          style={{
                            minWidth: 210,
                            textAlign: "left",
                            background: active ? "linear-gradient(135deg, #d4af37 0%, #facc15 100%)" : "#090d13",
                            color: active ? "#111" : "#fff",
                            border: active ? "1px solid #d4af37" : "1px solid #2a3240",
                            borderRadius: 14,
                            padding: 12,
                            fontWeight: 1000,
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ display: "block", fontSize: 11, opacity: 0.78, textTransform: "uppercase" }}>Ballot</span>
                          <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{vote.title}</span>
                        </button>
                      );
                    })}
                    </div>
                  </>
                ) : (
                  <select value={selectedVoteId} onChange={(event) => { setSelectedVoteId(event.target.value); setSelectedOptionId(""); }} style={inputStyle}>
                    {votes.map((vote) => <option key={vote.id} value={vote.id}>{vote.title}</option>)}
                  </select>
                )}

                {selectedVote && (
                  <div style={isPhone ? { width: "100%", maxWidth: "100%", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch", paddingBottom: 8 } : {}}>
                    {isPhone && <div style={{ color: "#aab3c2", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Swipe ballot if needed →</div>}
                    <div style={{ background: "#090d13", border: "1px solid #2a3240", borderRadius: 18, padding: isPhone ? 14 : 16, minWidth: isPhone ? 340 : "auto", maxWidth: isPhone ? 440 : "none", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexDirection: isPhone ? "column" : "row" }}>
                      <div>
                        <div style={{ color: "#d4af37", fontSize: 11, fontWeight: 1000, textTransform: "uppercase", letterSpacing: 0.8 }}>League Ballot</div>
                        <h2 style={{ margin: "6px 0", fontSize: isPhone ? 24 : 28, lineHeight: 1.05 }}>{selectedVote.title}</h2>
                        {selectedVote.description && <p style={{ opacity: 0.82, lineHeight: 1.45, margin: "8px 0 0" }}>{selectedVote.description}</p>}
                      </div>
                      <div style={{ textAlign: isPhone ? "left" : "right", background: "#0f151f", border: "1px solid #263244", borderRadius: 14, padding: 10, minWidth: isPhone ? "auto" : 170 }}>
                        <div style={{ color: selectedStatus.closed ? "#f87171" : "#4ade80", fontWeight: 1000 }}>{selectedStatus.remaining}</div>
                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Deadline: {selectedStatus.label}</div>
                        <div style={{ fontSize: 11, color: "#aab3c2", marginTop: 6 }}>{voteResponseCount} submitted</div>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                      {selectedOptions.map((option) => {
                        const checked = String(selectedOptionId) === String(option.id);
                        const disabled = selectedStatus.closed || driverAlreadyVoted;
                        return (
                          <label
                            key={option.id}
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              background: checked ? "rgba(212,175,55,0.14)" : "#070b10",
                              border: checked ? "2px solid #d4af37" : "1px solid #273140",
                              borderRadius: 15,
                              padding: isPhone ? 14 : 12,
                              cursor: disabled ? "not-allowed" : "pointer",
                              minHeight: isPhone ? 54 : "auto",
                            }}
                          >
                            <input type="radio" disabled={disabled} name="league-vote-option" value={option.id} checked={checked} onChange={(event) => setSelectedOptionId(event.target.value)} style={{ width: 20, height: 20 }} />
                            <span style={{ fontWeight: 1000, fontSize: isPhone ? 16 : 14, lineHeight: 1.3 }}>{option.option_text || option.label}</span>
                          </label>
                        );
                      })}
                    </div>

                    <button type="button" disabled={selectedStatus.closed || driverAlreadyVoted} onClick={submitVote} style={{ ...mobilePrimaryButtonStyle, marginTop: 16, opacity: selectedStatus.closed || driverAlreadyVoted ? 0.55 : 1 }}>
                      {driverAlreadyVoted ? "Vote Already Submitted" : selectedStatus.closed ? "Voting Closed" : "Submit Vote"}
                    </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

