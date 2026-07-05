import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import {
  dedupeDriversByNumber,
  isInactivePlaceholderDriver,
} from "../utils/driverHelpers";
import { getTeamFullName } from "../data/teams";
import { getLeagueSession, loginToLeague, logoutOfLeague } from "../lib/leagueAuth";
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
  GOLD,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
  HAIRLINE,
  GLASS_BG,
  GREEN,
  RED,
  BLUE,
  PURPLE,
} from "../styles/sharedStyles";

// Cycled across ballots so the swipeable chip list reads with some visual
// variety instead of every active ballot using the same gold highlight.
const BALLOT_COLORS = [GOLD, BLUE, PURPLE];

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

  useEffect(() => {
    const session = getLeagueSession();
    if (!session?.driverNumber) return;
    const rosterDriver = activeDrivers.find((item) => String(item.number) === String(session.driverNumber)) || {};
    setDriver({
      ...rosterDriver,
      number: session.driverNumber,
      driver_number: session.driverNumber,
      name: rosterDriver.name || session.driverName || `#${session.driverNumber}`,
    });
  }, [activeDrivers]);

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

    const { data: accessCodes, error: codeError } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    if (codeError) {
      console.error("Could not verify driver vote login:", codeError);
      setError("Could not verify access. Check driver_access_codes select policy and columns.");
      return;
    }

    const result = await loginToLeague({
      driverNumber: number,
      password: code,
      driverAccessCodes: accessCodes || [],
      drivers: activeDrivers,
      teams: [],
      supabase,
    });

    if (!result.success) {
      setError(result.error || "Invalid car number or driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((item) => String(item.number) === number) || {};
    setDriver({
      ...rosterDriver,
      number,
      driver_number: number,
      name: rosterDriver.name || result.session?.driverName || `#${number}`,
    });
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

  const pageStyle = appShellStyle;

  const containerStyle = isPhone
    ? { ...pageContainerStyle, maxWidth: 520, padding: "12px 12px 92px" }
    : pageContainerStyle;

  const cardStyle = isPhone
    ? { ...sectionCardStyle, padding: 14, marginBottom: 12 }
    : sectionCardStyle;

  const heroStyle = {
    ...sectionCardStyle,
    background: "linear-gradient(135deg, rgba(212,175,55,0.14), rgba(255,255,255,0.85))",
    border: `1px solid ${GOLD}55`,
  };

  const mobileInputStyle = isPhone
    ? { ...inputStyle, minHeight: 48, borderRadius: 14, fontSize: 16 }
    : inputStyle;

  const mobilePrimaryButtonStyle = isPhone
    ? { ...primaryButtonStyle, width: "100%", minHeight: 50, fontSize: 15 }
    : primaryButtonStyle;

  const mobileSecondaryButtonStyle = isPhone
    ? { ...secondaryButtonStyle, width: "100%", minHeight: 46, fontSize: 14 }
    : secondaryButtonStyle;

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={heroStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: isPhone ? "flex-start" : "center", flexDirection: isPhone ? "column" : "row" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: GOLD }}>
                Official Ballot
              </div>
              <h1 style={{ margin: "8px 0 4px", fontSize: isPhone ? 30 : 36, lineHeight: 1.05, fontWeight: 700, letterSpacing: -0.8, color: TEXT_PRIMARY }}>🗳️ League Voting</h1>
              <p style={{ color: TEXT_SECONDARY, margin: 0, lineHeight: 1.45, fontSize: isPhone ? 14 : 15 }}>
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
              <h2 style={{ margin: 0, fontSize: isPhone ? 18 : 22, fontWeight: 600, letterSpacing: -0.3, color: TEXT_PRIMARY }}>Driver Login</h2>
              {driver && <span style={{ color: GREEN, fontSize: 12, fontWeight: 700 }}>SIGNED IN</span>}
            </div>

            {!driver ? (
              <form onSubmit={loginDriver} style={{ display: "grid", gap: 12 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Car / Driver</span>
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
                  <span style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Driver Password</span>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter driver password" style={mobileInputStyle} />
                </label>
                <button type="submit" style={mobilePrimaryButtonStyle}>Log In To Vote</button>
              </form>
            ) : (
              <div style={{ background: "rgba(52,199,89,0.08)", border: `1px solid ${GREEN}55`, borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: TEXT_SECONDARY, fontWeight: 700, textTransform: "uppercase" }}>Logged In As</div>
                <div style={{ fontSize: isPhone ? 22 : 24, fontWeight: 700, marginTop: 4, color: TEXT_PRIMARY, letterSpacing: -0.5 }}>#{driver.number} {driver.name}</div>
                <div style={{ color: TEXT_SECONDARY, fontSize: 13, marginTop: 3 }}>{getTeamFullName(driver.team || "Independent")} • {driver.manufacturer || ""}</div>
                <button type="button" onClick={() => { logoutOfLeague(); setDriver(null); setPassword(""); setMessage("Logged out."); }} style={{ ...mobileSecondaryButtonStyle, marginTop: 12 }}>Log Out</button>
              </div>
            )}
            {message && <div style={{ marginTop: 12, color: GREEN, fontWeight: 700, lineHeight: 1.35 }}>{message}</div>}
            {error && <div style={{ marginTop: 12, color: RED, fontWeight: 700, lineHeight: 1.35 }}>{error}</div>}
          </div>

          <div style={{ ...cardStyle, overflowX: isPhone ? "auto" : cardStyle.overflow, WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: isPhone ? 18 : 22, fontWeight: 600, letterSpacing: -0.3, color: TEXT_PRIMARY }}>Open Votes</h2>
              {!loading && <span style={{ color: TEXT_SECONDARY, fontSize: 12, fontWeight: 600 }}>{votes.length} open</span>}
            </div>

            {loading && <div style={{ color: TEXT_SECONDARY }}>Loading votes...</div>}
            {!loading && votes.length === 0 && <div style={{ color: TEXT_SECONDARY }}>No active votes are open right now.</div>}

            {votes.length > 0 && (
              <div style={{ display: "grid", gap: 12 }}>
                {isPhone ? (
                  <>
                    <div style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>Swipe ballots →</div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", overflowY: "hidden", paddingBottom: 8, WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", maxWidth: "100%" }}>
                    {votes.map((vote, voteIndex) => {
                      const active = String(vote.id) === String(selectedVoteId);
                      const chipColor = BALLOT_COLORS[voteIndex % BALLOT_COLORS.length];
                      return (
                        <button
                          key={vote.id}
                          type="button"
                          onClick={() => { setSelectedVoteId(vote.id); setSelectedOptionId(""); }}
                          style={{
                            minWidth: 210,
                            textAlign: "left",
                            background: active ? chipColor : "rgba(0,0,0,0.03)",
                            color: active ? "#fff" : TEXT_PRIMARY,
                            border: active ? `1px solid ${chipColor}` : HAIRLINE,
                            borderRadius: 14,
                            padding: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
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
                    {isPhone && <div style={{ color: TEXT_SECONDARY, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 8 }}>Swipe ballot if needed →</div>}
                    <div style={{ background: GLASS_BG, border: HAIRLINE, borderRadius: 18, padding: isPhone ? 14 : 16, minWidth: isPhone ? 340 : "auto", maxWidth: isPhone ? 440 : "none", boxSizing: "border-box" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexDirection: isPhone ? "column" : "row" }}>
                      <div>
                        <div style={{ color: GOLD, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>League Ballot</div>
                        <h2 style={{ margin: "6px 0", fontSize: isPhone ? 24 : 26, lineHeight: 1.1, fontWeight: 700, letterSpacing: -0.6, color: TEXT_PRIMARY }}>{selectedVote.title}</h2>
                        {selectedVote.description && <p style={{ color: TEXT_SECONDARY, lineHeight: 1.45, margin: "8px 0 0", fontSize: 14 }}>{selectedVote.description}</p>}
                      </div>
                      <div style={{ textAlign: isPhone ? "left" : "right", background: "rgba(0,0,0,0.03)", border: HAIRLINE, borderRadius: 14, padding: 10, minWidth: isPhone ? "auto" : 170 }}>
                        <div style={{ color: selectedStatus.closed ? RED : GREEN, fontWeight: 700 }}>{selectedStatus.remaining}</div>
                        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 3 }}>Deadline: {selectedStatus.label}</div>
                        <div style={{ fontSize: 11, color: TEXT_SECONDARY, marginTop: 6 }}>{voteResponseCount} submitted</div>
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
                              background: checked ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.02)",
                              border: checked ? `2px solid ${GOLD}` : HAIRLINE,
                              borderRadius: 15,
                              padding: isPhone ? 14 : 12,
                              cursor: disabled ? "not-allowed" : "pointer",
                              minHeight: isPhone ? 54 : "auto",
                            }}
                          >
                            <input type="radio" disabled={disabled} name="league-vote-option" value={option.id} checked={checked} onChange={(event) => setSelectedOptionId(event.target.value)} style={{ width: 20, height: 20 }} />
                            <span style={{ fontWeight: 600, fontSize: isPhone ? 16 : 14, lineHeight: 1.3, color: TEXT_PRIMARY }}>{option.option_text || option.label}</span>
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

