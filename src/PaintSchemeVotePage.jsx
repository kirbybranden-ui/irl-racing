import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = { maxWidth: 1180, margin: "0 auto", padding: 24 };
const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 18,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 900, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const MASTER_ACCESS_CODE = "BCLADMINPASSWORD2026";

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
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
    "BayouX Motorsports": "BayouX Motorsports",
    "19XI": "19XI Racing",
    "19XI Racing": "19XI Racing",
    Independent: "Independent",
    IND: "Independent",
  };
  return names[team] || team || "Independent";
}

function isPaintImageUpload(upload) {
  const url = upload?.image_url || upload?.file_url || upload?.url || "";
  const fileType = String(upload?.file_type || upload?.mime_type || "").toLowerCase();
  return fileType.startsWith("image/") || /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

function getUploadUrl(upload) {
  return upload?.image_url || upload?.file_url || upload?.url || "";
}

function getUploadRace(upload) {
  return upload?.race_name || upload?.race_week || upload?.race_id || "";
}

function getUploadDriverNumber(upload) {
  return upload?.driver_number || upload?.car_number || upload?.number || "";
}

function getUploadDriverName(upload) {
  return upload?.driver_name || upload?.uploader_name || upload?.name || "Unknown Driver";
}

function getUploadUpdatedAt(upload) {
  return upload?.updated_at || upload?.modified_at || upload?.uploaded_at || upload?.created_at || upload?.inserted_at || null;
}

function getEasternParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function isVotingClosedNow(date = new Date()) {
  const parts = getEasternParts(date);
  const dayIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[parts.weekday] ?? 0;
  // Friday at 12:00 AM ET starts the closed window for the current vote week.
  return dayIndex === 5 || dayIndex === 6;
}

function getDefaultRaceName(tracks = []) {
  const nowParts = getEasternParts(new Date());
  const todayKey = `${nowParts.year}-${nowParts.month}-${nowParts.day}`;
  const sorted = [...(tracks || [])]
    .filter((track) => track?.name)
    .sort((a, b) => String(a.date || "9999-12-31").localeCompare(String(b.date || "9999-12-31")));
  return sorted.find((track) => String(track.date || "").slice(0, 10) >= todayKey)?.name || sorted[sorted.length - 1]?.name || "";
}

function getDeadlineLabel() {
  return "Friday at 12:00 AM ET";
}

export default function PaintSchemeVotePage({ drivers = [], tracks = [] }) {
  const activeDrivers = useMemo(
    () => (drivers || [])
      .filter((driver) => driver && !normalize(driver.name).startsWith("inactive-"))
      .sort((a, b) => Number(a.number || 0) - Number(b.number || 0)),
    [drivers]
  );

  const [raceName, setRaceName] = useState(() => getDefaultRaceName(tracks));
  const [uploads, setUploads] = useState([]);
  const [votes, setVotes] = useState([]);
  const [driverCodes, setDriverCodes] = useState({});
  const [selectedVoterNumber, setSelectedVoterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [unlockedDriver, setUnlockedDriver] = useState(null);
  const [selectedUploadId, setSelectedUploadId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const votingClosed = isVotingClosedNow();

  const voterHasAlreadyVoted = useMemo(() => {
    if (!unlockedDriver) return false;
    return (votes || []).some((vote) => String(vote.voter_driver_number || "") === String(unlockedDriver.number || ""));
  }, [votes, unlockedDriver]);

  const selectedUpload = uploads.find((upload) => String(upload.id) === String(selectedUploadId));

  useEffect(() => {
    if (!raceName && tracks?.length) setRaceName(getDefaultRaceName(tracks));
  }, [tracks, raceName]);

  useEffect(() => {
    loadDriverCodes();
  }, []);

  useEffect(() => {
    loadPaintSchemeData();
    setSelectedUploadId("");
    setStatus("");
    setError("");
  }, [raceName]);

  async function loadDriverCodes() {
    const { data, error: codeError } = await supabase
      .from("driver_access_codes")
      .select("driver_number, driver_name, code, active")
      .eq("active", true);

    if (codeError) {
      console.error("Failed to load driver access codes:", codeError);
      setError("Could not load driver passwords. Check driver_access_codes RLS/select policy.");
      return;
    }

    const nextCodes = {};
    (data || []).forEach((row) => {
      const code = row.code;
      if (!code) return;
      if (row.driver_number) nextCodes[String(row.driver_number).trim()] = code;
      if (row.driver_name) nextCodes[normalize(row.driver_name)] = code;
    });
    setDriverCodes(nextCodes);
  }

  async function loadPaintSchemeData() {
    if (!raceName) return;
    setLoading(true);
    setError("");
    setStatus("");

    const [{ data: uploadData, error: uploadError }, { data: voteData, error: voteError }] = await Promise.all([
      supabase.from("car_uploads").select("*").order("uploaded_at", { ascending: false }),
      supabase.from("paint_scheme_votes").select("*").eq("race_name", raceName).order("created_at", { ascending: false }),
    ]);

    setLoading(false);

    if (uploadError || voteError) {
      console.error("Paint scheme load failed:", uploadError || voteError);
      setError("Could not load paint scheme uploads or votes. Check car_uploads, paint_scheme_votes, and RLS policies.");
      return;
    }

    const filteredUploads = (uploadData || [])
      .filter(isPaintImageUpload)
      .filter((upload) => getUploadRace(upload) === raceName)
      .map((upload) => {
        const matchedDriver = activeDrivers.find((driver) =>
          String(driver.number || "") === String(getUploadDriverNumber(upload) || "") ||
          normalize(driver.name) === normalize(getUploadDriverName(upload)) ||
          String(driver.id || "") === String(upload.driver_id || "")
        );

        return {
          ...upload,
          matchedDriver,
          displayDriverNumber: matchedDriver?.number || getUploadDriverNumber(upload),
          displayDriverName: matchedDriver?.name || getUploadDriverName(upload),
          displayTeam: matchedDriver?.team || upload.team || upload.team_key || "Independent",
          imageUrl: getUploadUrl(upload),
          voteCount: (voteData || []).filter((vote) => String(vote.upload_id || vote.voted_upload_id || "") === String(upload.id)).length,
        };
      })
      .sort((a, b) => Number(b.voteCount || 0) - Number(a.voteCount || 0));

    setUploads(filteredUploads);
    setVotes(voteData || []);
  }

  function unlockVoter() {
    setError("");
    setStatus("");

    const voter = activeDrivers.find((driver) => String(driver.number || "") === String(selectedVoterNumber || ""));
    if (!voter) {
      setError("Select your driver profile first.");
      return;
    }

    const savedCode = driverCodes[String(voter.number)] || driverCodes[normalize(voter.name)] || "";
    const codeMatches = normalizeCode(password) === normalizeCode(savedCode) || normalizeCode(password) === normalizeCode(MASTER_ACCESS_CODE);

    if (!codeMatches) {
      setError("Incorrect driver password. Use the same password that unlocks your Driver Profile.");
      setUnlockedDriver(null);
      return;
    }

    setUnlockedDriver(voter);
    setPassword("");
    setStatus(`Unlocked as #${voter.number} ${voter.name}.`);
  }

  async function submitVote() {
    setError("");
    setStatus("");

    if (votingClosed) {
      setError(`Voting is closed. Paint scheme voting closes every ${getDeadlineLabel()}.`);
      return;
    }

    if (!unlockedDriver) {
      setError("You must enter your driver password before voting.");
      return;
    }

    if (voterHasAlreadyVoted) {
      setError("Your driver profile has already voted for this race week. Votes lock after submission.");
      return;
    }

    if (!selectedUpload) {
      setError("Select a paint scheme before submitting your vote.");
      return;
    }

    const votedDriverNumber = selectedUpload.displayDriverNumber || getUploadDriverNumber(selectedUpload);
    if (String(votedDriverNumber) === String(unlockedDriver.number)) {
      setError("Drivers cannot vote for themselves.");
      return;
    }

    const confirmed = window.confirm(
      `Submit vote for #${votedDriverNumber} ${selectedUpload.displayDriverName}?\n\nThis vote will be logged to your driver profile and cannot be changed.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    const payload = {
      race_name: raceName,
      upload_id: String(selectedUpload.id || ""),
      voter_driver_number: String(unlockedDriver.number || ""),
      voter_driver_name: unlockedDriver.name || "",
      voted_driver_number: String(votedDriverNumber || ""),
      voted_driver_name: selectedUpload.displayDriverName || getUploadDriverName(selectedUpload),
      voted_team: selectedUpload.displayTeam || "Independent",
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from("paint_scheme_votes").insert(payload);
    setSubmitting(false);

    if (insertError) {
      console.error("Paint scheme vote insert failed:", insertError);
      setError(insertError?.message || JSON.stringify(insertError));
      return;
    }

    setStatus(`Vote submitted and locked for #${unlockedDriver.number} ${unlockedDriver.name}.`);
    setSelectedUploadId("");
    await loadPaintSchemeData();
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>← Back to Standings</button>

        <div style={{ ...sectionCardStyle, marginTop: 18, borderColor: "#f97316" }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "#f97316", letterSpacing: 1 }}>BUDWEISER CUP LEAGUE</div>
          <h1 style={{ margin: "6px 0 6px", fontSize: 38 }}>🎨 Paint Scheme Vote</h1>
          <div style={{ opacity: 0.75, lineHeight: 1.6 }}>
            Drivers must unlock with their Driver Profile password before voting. One vote per driver profile per race week. No self-votes. Voting closes every {getDeadlineLabel()}.
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Official Rules</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 10 }}>
            {[
              "Driver password required to vote.",
              "One vote per driver account per race week.",
              "Drivers may not vote for themselves.",
              "Votes are logged by driver number, driver name, timestamp, and race week.",
              "Votes lock immediately after submission.",
              "Voting closes Friday at 12:00 AM ET.",
              "Cars not updated by the deadline are ineligible for payout.",
            ].map((rule) => (
              <div key={rule} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, padding: 12, fontWeight: 800 }}>✅ {rule}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>1. Select Vote Week</h2>
            <select value={raceName} onChange={(event) => setRaceName(event.target.value)} style={inputStyle}>
              <option value="">Select race week...</option>
              {(tracks || []).map((track) => <option key={track.name} value={track.name}>{track.name}</option>)}
            </select>
            <button onClick={loadPaintSchemeData} disabled={loading || !raceName} style={{ ...secondaryButtonStyle, marginTop: 12, opacity: loading || !raceName ? 0.55 : 1 }}>
              {loading ? "Loading..." : "Refresh Vote Board"}
            </button>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>2. Unlock Driver Profile</h2>
            {unlockedDriver ? (
              <div style={{ background: "#102a16", border: "1px solid #22c55e", borderRadius: 12, padding: 14 }}>
                <div style={{ fontWeight: 900, color: "#4ade80" }}>Unlocked</div>
                <div style={{ marginTop: 4 }}>#{unlockedDriver.number} {unlockedDriver.name}</div>
                <button onClick={() => { setUnlockedDriver(null); setSelectedUploadId(""); }} style={{ ...dangerButtonStyle, marginTop: 12 }}>Lock / Switch Driver</button>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 8, fontWeight: 800 }}>Driver</div>
                <select value={selectedVoterNumber} onChange={(event) => setSelectedVoterNumber(event.target.value)} style={inputStyle}>
                  <option value="">Select your driver...</option>
                  {activeDrivers.map((driver) => <option key={driver.id || driver.number} value={driver.number}>#{driver.number} {driver.name}</option>)}
                </select>
                <div style={{ marginTop: 12, marginBottom: 8, fontWeight: 800 }}>Driver Profile Password</div>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter driver password" style={inputStyle} />
                <button onClick={unlockVoter} style={{ ...primaryButtonStyle, marginTop: 12 }}>Unlock To Vote</button>
              </>
            )}
          </div>
        </div>

        {status && <div style={{ ...sectionCardStyle, borderColor: "#22c55e", color: "#4ade80", fontWeight: 900 }}>{status}</div>}
        {error && <div style={{ ...sectionCardStyle, borderColor: "#ef4444", color: "#fecaca", fontWeight: 900 }}>{error}</div>}

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>3. Choose Paint Scheme</h2>
              <div style={{ opacity: 0.7, marginTop: 5 }}>{uploads.length} eligible image upload(s) found for {raceName || "this race week"}.</div>
            </div>
            {votingClosed && <div style={{ background: "#431407", border: "1px solid #f97316", color: "#fed7aa", borderRadius: 12, padding: "10px 12px", fontWeight: 900 }}>Voting Closed</div>}
            {unlockedDriver && voterHasAlreadyVoted && <div style={{ background: "#1e293b", border: "1px solid #64748b", borderRadius: 12, padding: "10px 12px", fontWeight: 900 }}>Vote Already Submitted</div>}
          </div>

          {uploads.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, opacity: 0.78 }}>
              No paint scheme image uploads found for this race week yet.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 }}>
              {uploads.map((upload) => {
                const isSelf = unlockedDriver && String(upload.displayDriverNumber || "") === String(unlockedDriver.number || "");
                const selected = String(selectedUploadId) === String(upload.id);
                return (
                  <button
                    key={upload.id}
                    type="button"
                    disabled={!unlockedDriver || votingClosed || voterHasAlreadyVoted || isSelf}
                    onClick={() => setSelectedUploadId(upload.id)}
                    style={{
                      textAlign: "left",
                      background: selected ? "#2a230f" : "#0f1319",
                      color: "white",
                      border: selected ? "2px solid #d4af37" : "1px solid #2c3440",
                      borderRadius: 16,
                      padding: 12,
                      cursor: !unlockedDriver || votingClosed || voterHasAlreadyVoted || isSelf ? "not-allowed" : "pointer",
                      opacity: isSelf ? 0.48 : 1,
                    }}
                  >
                    {upload.imageUrl ? (
                      <img src={upload.imageUrl} alt={`${upload.displayDriverName} paint scheme`} style={{ width: "100%", height: 145, objectFit: "cover", borderRadius: 12, marginBottom: 10, background: "#111" }} />
                    ) : (
                      <div style={{ height: 145, borderRadius: 12, background: "#111", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>No Image URL</div>
                    )}
                    <div style={{ fontWeight: 900 }}>#{upload.displayDriverNumber || "—"} {upload.displayDriverName}</div>
                    <div style={{ opacity: 0.68, marginTop: 3 }}>{getTeamFullName(upload.displayTeam)}</div>
                    <div style={{ marginTop: 8, color: "#d4af37", fontWeight: 900 }}>{upload.voteCount || 0} vote{Number(upload.voteCount || 0) === 1 ? "" : "s"}</div>
                    {isSelf && <div style={{ color: "#f87171", marginTop: 8, fontWeight: 900 }}>Self-vote blocked</div>}
                    {getUploadUpdatedAt(upload) && <div style={{ opacity: 0.5, fontSize: 11, marginTop: 8 }}>Updated: {new Date(getUploadUpdatedAt(upload)).toLocaleString()}</div>}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button
              onClick={submitVote}
              disabled={!unlockedDriver || !selectedUploadId || votingClosed || voterHasAlreadyVoted || submitting}
              style={{ ...primaryButtonStyle, opacity: !unlockedDriver || !selectedUploadId || votingClosed || voterHasAlreadyVoted || submitting ? 0.55 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Locked Vote"}
            </button>
            <button onClick={() => setSelectedUploadId("")} style={secondaryButtonStyle}>Clear Selection</button>
          </div>
        </div>
      </div>
    </div>
  );
}
