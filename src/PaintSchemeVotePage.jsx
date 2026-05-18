import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1400, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 18, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };

function getOrCreateVoterId() {
  const key = "bclPaintSchemeVoterId";
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const next = `voter-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, next);
  return next;
}

function getEasternDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { dateKey: `${values.year}-${values.month}-${values.day}`, hour: Number(values.hour || 0), minute: Number(values.minute || 0) };
}

function hasRaceRolledOver(track, date = new Date()) {
  if (!track?.date) return false;
  const easternNow = getEasternDateParts(date);
  const raceDate = String(track.date).slice(0, 10);
  if (easternNow.dateKey > raceDate) return true;
  if (easternNow.dateKey < raceDate) return false;
  return easternNow.hour >= 22;
}

function isVotingLocked(selectedRace, tracks = []) {
  const matchingTrack = (tracks || []).find((track) => String(track.name || "") === String(selectedRace || ""));
  if (!matchingTrack?.date) return false;

  return hasRaceRolledOver(matchingTrack);
}


function getUpcomingRaceName(tracks = []) {
  const sorted = [...(tracks || [])].sort((a, b) => {
    if (a.date && b.date) return new Date(`${a.date}T12:00:00`) - new Date(`${b.date}T12:00:00`);
    if (a.date) return -1;
    if (b.date) return 1;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return sorted.find((track) => !hasRaceRolledOver(track))?.name || sorted[0]?.name || "";
}

function getUploadRace(upload) {
  return upload?.race_id || upload?.race_week || upload?.race_name || "";
}

function isImageUpload(upload) {
  const url = upload?.image_url || upload?.file_url || "";
  const fileType = String(upload?.file_type || "").toLowerCase();
  return fileType.startsWith("image/") || url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
}

export default function PaintSchemeVotePage({ drivers = [], tracks = [] }) {
  const [uploads, setUploads] = useState([]);
  const [votes, setVotes] = useState([]);
  const [selectedRace, setSelectedRace] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [votingUploadId, setVotingUploadId] = useState("");
  const voterId = useMemo(() => getOrCreateVoterId(), []);

  async function loadData() {
    setLoading(true);
    setError("");
    const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("paint_scheme_votes").select("*").order("created_at", { ascending: false }),
    ]);

    if (uploadError) {
      console.error("Paint scheme uploads failed:", uploadError);
      setError("Could not load car uploads. Check car_uploads RLS select policy.");
      setUploads([]);
    } else {
      setUploads(uploadData || []);
      setSelectedRace((current) => current || getUpcomingRaceName(tracks) || getUploadRace((uploadData || [])[0]) || "");
    }

    if (voteError) {
      console.error("Paint scheme votes failed:", voteError);
      setError("Could not load paint scheme votes. Check paint_scheme_votes RLS select policy.");
      setVotes([]);
    } else {
      setVotes(voteData || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const raceOptions = useMemo(() => {
    const values = new Set();
    (tracks || []).forEach((track) => { if (track?.name) values.add(track.name); });
    (uploads || []).forEach((upload) => { const race = getUploadRace(upload); if (race) values.add(race); });
    return Array.from(values);
  }, [tracks, uploads]);

  const imageUploads = useMemo(() => {
    return (uploads || [])
      .filter((upload) => isImageUpload(upload))
      .filter((upload) => !selectedRace || getUploadRace(upload) === selectedRace);
  }, [uploads, selectedRace]);

  const voteCountByUpload = useMemo(() => {
    const counts = new Map();
    (votes || []).forEach((vote) => {
      const key = String(vote.upload_id || "");
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [votes]);

  const selectedUploadIds = useMemo(() => new Set(imageUploads.map((upload) => String(upload.id))), [imageUploads]);

  const myVoteForRace = useMemo(() => {
    return (votes || []).find((vote) => String(vote.voter_id) === String(voterId) && selectedUploadIds.has(String(vote.upload_id))) || null;
  }, [votes, voterId, selectedUploadIds]);

  const leaderboard = useMemo(() => {
    return [...imageUploads].sort((a, b) => {
      const voteDiff = (voteCountByUpload.get(String(b.id)) || 0) - (voteCountByUpload.get(String(a.id)) || 0);
      if (voteDiff !== 0) return voteDiff;
      return new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0);
    });
  }, [imageUploads, voteCountByUpload]);

  function getDriverForUpload(upload) {
    return drivers.find((driver) => String(driver.id) === String(upload.driver_id));
  }

  function getDriverLabel(upload) {
    const driver = getDriverForUpload(upload);
    if (driver) return `#${driver.number} ${driver.name}`;
    if (upload.driver_name) return upload.driver_name;
    if (upload.uploader_name) return upload.uploader_name;
    return "Unknown Driver";
  }

  function getTeamLabel(upload) {
    const driver = getDriverForUpload(upload);
    return driver?.team || upload.team || upload.team_key || "—";
  }

  async function voteForUpload(upload) {
    setMessage("");
    setError("");

    if (votingLocked) {
      setError("Voting is closed for this race week. Winner has already been awarded.");
      return;
    }

    if (myVoteForRace) {
      setError("You already voted for this race week's Paint Scheme of the Week.");
      return;
    }

    setVotingUploadId(upload.id);
    const { error: insertError } = await supabase.from("paint_scheme_votes").insert({
      voter_id: voterId,
      upload_id: upload.id,
      created_at: new Date().toISOString(),
    });

    setVotingUploadId("");

    if (insertError) {
      console.error("Paint scheme vote failed:", insertError);
      setError("Could not submit vote. Check paint_scheme_votes RLS insert policy.");
      return;
    }

    setMessage(`Vote submitted for ${getDriverLabel(upload)}.`);
    await loadData();
  }

  const votingLocked = useMemo(() => {
    return isVotingLocked(selectedRace, tracks);
  }, [selectedRace, tracks]);

  const winner = leaderboard[0] || null;

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", borderColor: "#d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 34, fontWeight: 900 }}>🎨 Paint Scheme of the Week</div>
              <div style={{ opacity: 0.72, marginTop: 6 }}>Vote for the best uploaded car photo for the selected race week.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={loadData} style={secondaryButtonStyle}>Refresh Votes</button>
              <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>Back to Standings</button>
            </div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>RACE WEEK</label>
              <select value={selectedRace} onChange={(event) => setSelectedRace(event.target.value)} style={inputStyle}>
                <option value="">All Race Weeks</option>
                {raceOptions.map((race) => <option key={race} value={race}>{race}</option>)}
              </select>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>ENTRIES</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{imageUploads.length}</div>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 4 }}>TOTAL VOTES</div>
              <div style={{ fontSize: 24, fontWeight: 900 }}>{imageUploads.reduce((sum, upload) => sum + (voteCountByUpload.get(String(upload.id)) || 0), 0)}</div>
            </div>
            {winner && (
              <div style={{ background: "rgba(212,175,55,0.12)", border: "1px solid #d4af37", borderRadius: 14, padding: 14 }}>
                <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 4 }}>CURRENT LEADER</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#d4af37" }}>{getDriverLabel(winner)}</div>
              </div>
            )}
          </div>
          {message && <div style={{ color: "#4ade80", marginTop: 14, fontWeight: 900 }}>{message}</div>}
          {error && <div style={{ color: "#f87171", marginTop: 14, fontWeight: 900 }}>{error}</div>}
          {myVoteForRace && <div style={{ marginTop: 14, opacity: 0.78 }}>✅ You already voted for this race week.</div>}

          {votingLocked && winner && (
            <div
              style={{
                marginTop: 18,
                background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(120,90,20,0.18))",
                border: "1px solid #d4af37",
                borderRadius: 16,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 6 }}>
                🏁 OFFICIAL RESULT
              </div>

              <div style={{ fontSize: 28, fontWeight: 900, color: "#d4af37" }}>
                Paint Scheme of the Week Winner
              </div>

              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>
                {getDriverLabel(winner)}
              </div>

              <div style={{ marginTop: 6, opacity: 0.72 }}>
                {voteCountByUpload.get(String(winner.id)) || 0} votes • Voting closed at 10:00 PM EST
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={sectionCardStyle}>Loading paint schemes...</div>
        ) : imageUploads.length === 0 ? (
          <div style={sectionCardStyle}>No image uploads found for this race week yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18 }}>
            {leaderboard.map((upload, index) => {
              const url = upload.image_url || upload.file_url || "";
              const votesForUpload = voteCountByUpload.get(String(upload.id)) || 0;
              const isMyPick = String(myVoteForRace?.upload_id || "") === String(upload.id);
              return (
                <div key={upload.id} style={{ background: "#11161d", border: `1px solid ${isMyPick ? "#d4af37" : "#2c3440"}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,0.22)" }}>
                  <div style={{ position: "relative", width: "100%", paddingBottom: "72%", background: "#0f1319" }}>
                    <img src={url} alt={getDriverLabel(upload)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", top: 12, left: 12, background: index === 0 ? "#d4af37" : "rgba(0,0,0,0.72)", color: index === 0 ? "#111" : "white", borderRadius: 999, padding: "6px 10px", fontWeight: 900, fontSize: 12 }}>
                      #{index + 1}
                    </div>
                  </div>
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: "#d4af37" }}>{getDriverLabel(upload)}</div>
                    <div style={{ opacity: 0.72, fontSize: 13, marginTop: 4 }}>{getTeamLabel(upload)} • {getUploadRace(upload) || "Race week"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.65 }}>VOTES</div>
                        <div style={{ fontSize: 24, fontWeight: 900 }}>{votesForUpload}</div>
                      </div>
                      <button
                        onClick={() => voteForUpload(upload)}
                        disabled={votingLocked || Boolean(myVoteForRace) || votingUploadId === upload.id}
                        style={{
                          ...primaryButtonStyle,
                          opacity: votingLocked || Boolean(myVoteForRace) || votingUploadId === upload.id ? 0.55 : 1,
                          cursor: votingLocked || Boolean(myVoteForRace) || votingUploadId === upload.id ? "not-allowed" : "pointer",
                        }}
                      >
                        {votingLocked ? "🏁 Voting Closed" : isMyPick ? "✅ Your Vote" : votingUploadId === upload.id ? "Voting..." : "Vote"}
                      </button>
                    </div>
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
