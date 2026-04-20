    if (videoFile) {
      const safeName = videoFile.name.replace(/\s+/g, "-");
      const path = `${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("appeal-evidence")
        .upload(path, videoFile, { upsert: false });

      if (uploadError) {
        setSubmitting(false);
        setMessage("Video upload failed.");
        return;
      }

      const { data } = supabase.storage.from("appeal-evidence").getPublicUrl(path);
      evidenceUrl = data?.publicUrl || "";
    }

    const { error } = await supabase.from("appeals").insert([
      {
        requester,
        track,
        lap_number: lapNumber ? Number(lapNumber) : null,
        description,
        evidence_url: evidenceUrl,
        status: "Open",
      },
    ]);

    if (error) {
      setMessage("Appeal submission failed.");
      setSubmitting(false);
      return;
    }

    setRequester("");
    setTrack(TRACKS[0]);
    setLapNumber("");
    setDescription("");
    setVideoFile(null);
    const fileInput = document.getElementById("appeal-video-input");
    if (fileInput) fileInput.value = "";
    setMessage("Appeal submitted successfully.");
    setSubmitting(false);
  }

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>Submit Appeal</h1>
      <p>Use this form to submit a case for review.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
        <input
          value={requester}
          onChange={(e) => setRequester(e.target.value)}
          placeholder="Requester name"
          required
        />

        <select value={track} onChange={(e) => setTrack(e.target.value)}>
          {TRACKS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={lapNumber}
          onChange={(e) => setLapNumber(e.target.value)}
          placeholder="Lap number"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the appeal"
          rows={6}
          required
        />

        <input
          id="appeal-video-input"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Appeal"}
        </button>
      </form>

      {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
    </div>
  );
}
