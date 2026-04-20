import React, { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { loadLeagueState } from "./lib/leagueState";

const pageStyle = {
  minHeight: "100vh",
  background: "#0c0f14",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 24,
};

const cardStyle = {
  maxWidth: 760,
  margin: "0 auto",
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 16,
  padding: 24,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};

const labelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 700,
};

const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "12px 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: "#2a3140",
  color: "white",
  border: "1px solid #3d4859",
  borderRadius: 10,
  padding: "10px 14px",
  fontWeight: 700,
  cursor: "pointer",
};

export default function SubmitAppealPage() {
  const [requester, setRequester] = useState("");
  const [track, setTrack] = useState("");
  const [lapNumber, setLapNumber] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [drivers, setDrivers] = useState([]);
  const [tracks, setTracks] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function hydrateLeagueData() {
      try {
        const savedState = await loadLeagueState();

        const allTracks = Array.isArray(savedState?.tracks) ? savedState.tracks : [];
        setTracks(allTracks);

        const seasons = Array.isArray(savedState?.seasons) ? savedState.seasons : [];
        const activeSeasonId = savedState?.activeSeasonId;
        const activeSeason =
          seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;

        const seasonDrivers = Array.isArray(activeSeason?.drivers)
          ? activeSeason.drivers.filter((d) => !d.retired)
          : [];

        setDrivers(seasonDrivers);
      } catch (error) {
        console.error("Failed to load league data for appeal form:", error);
      }
    }

    hydrateLeagueData();
  }, []);

  const removeAttachment = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let evidenceUrl = null;

      if (videoFile) {
        const fileName = `appeals/${Date.now()}-${videoFile.name}`;

        const { error: uploadError } = await supabase.storage
          .from("appeal-evidence")
          .upload(fileName, videoFile);

        if (uploadError) {
          console.error("Video upload failed:", uploadError);
          alert("Video upload failed: " + uploadError.message);
          setSubmitting(false);
          return;
        }

        const { data } = supabase.storage
          .from("appeal-evidence")
          .getPublicUrl(fileName);

        evidenceUrl = data?.publicUrl || null;
      }

      const { error } = await supabase.from("appeals").insert([
        {
          requester,
          track,
          lap_number: Number(lapNumber),
          description,
          evidence_url: evidenceUrl,
          status: "Open",
          admin_notes: "",
        },
      ]);

      if (error) {
        console.error("Appeal insert failed:", error);
        alert("Appeal failed: " + error.message);
        setSubmitting(false);
        return;
      }

      alert("Appeal submitted successfully.");

      setRequester("");
      setTrack("");
      setLapNumber("");
      setDescription("");
      removeAttachment();
    } catch (err) {
      console.error("Unexpected submit error:", err);
      alert("Something went wrong while submitting the appeal.");
    }

    setSubmitting(false);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ marginTop: 0 }}>Submit Appeal</h1>
        <p style={{ opacity: 0.8, marginBottom: 20 }}>
          Fill out the form below to submit a case for admin review.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Requester</label>
            <select
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Select a driver</option>
              {drivers
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((driver) => (
                  <option key={driver.id} value={driver.name}>
                    #{driver.number} {driver.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Track</label>
            <select
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">Select a track</option>
              {tracks
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((trackItem) => (
                  <option key={trackItem.name} value={trackItem.name}>
                    {trackItem.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Lap Number</label>
            <input
              type="number"
              value={lapNumber}
              onChange={(e) => setLapNumber(e.target.value)}
              required
              min="1"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Video Evidence (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              style={{ color: "white" }}
            />

            {videoFile && (
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  background: "#10141b",
                  border: "1px solid #2d3643",
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 14, overflowWrap: "anywhere" }}>
                  Attached: {videoFile.name}
                </div>
                <button
                  type="button"
                  onClick={removeAttachment}
                  style={secondaryButtonStyle}
                >
                  Remove Attachment
                </button>
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} style={primaryButtonStyle}>
            {submitting ? "Submitting..." : "Submit Appeal"}
          </button>
        </form>
      </div>
    </div>
  );
}
