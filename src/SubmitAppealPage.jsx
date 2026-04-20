import React, { useState } from "react";
import { supabase } from "./lib/supabase";

export default function SubmitAppealPage() {
  const [requester, setRequester] = useState("");
  const [track, setTrack] = useState("");
  const [lapNumber, setLapNumber] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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

        evidenceUrl = data.publicUrl;
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
      setVideoFile(null);
    } catch (err) {
      console.error("Unexpected submit error:", err);
      alert("Something went wrong while submitting the appeal.");
    }

    setSubmitting(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0f14",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          background: "#171b22",
          border: "1px solid #2c3440",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h1 style={{ marginTop: 0 }}>Submit Appeal</h1>
        <p style={{ opacity: 0.8 }}>
          Fill out the form below to submit a case for admin review.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Requester</label>
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #313947",
                background: "#0f1319",
                color: "white",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Track</label>
            <input
              type="text"
              value={track}
              onChange={(e) => setTrack(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #313947",
                background: "#0f1319",
                color: "white",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Lap Number</label>
            <input
              type="number"
              value={lapNumber}
              onChange={(e) => setLapNumber(e.target.value)}
              required
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #313947",
                background: "#0f1319",
                color: "white",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 8,
                border: "1px solid #313947",
                background: "#0f1319",
                color: "white",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Video Evidence (optional)
            </label>
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              style={{ color: "white" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: "#d4af37",
              color: "#111",
              border: "none",
              borderRadius: 10,
              padding: "12px 16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "Submitting..." : "Submit Appeal"}
          </button>
        </form>
      </div>
    </div>
  );
}
