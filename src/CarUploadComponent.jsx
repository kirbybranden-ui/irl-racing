import React, { useEffect, useState } from "react";
import { uploadCarFile, getCarUploads, getNextRace } from "./lib/carUploads";

const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };

export default function CarUploadSection({ driver, tracks }) {
  const [nextRace, setNextRace] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loadingUploads, setLoadingUploads] = useState(true);

  // Get next race on mount
  useEffect(() => {
    const race = getNextRace(tracks);
    setNextRace(race);

    // Load existing uploads for this driver and race
    async function loadUploads() {
      if (race && driver) {
        const data = await getCarUploads(driver.id, race.name);
        setUploads(data);
      }
      setLoadingUploads(false);
    }
    loadUploads();
  }, [driver, tracks]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !nextRace) {
      alert("Please select files and ensure there is a race of the week.");
      return;
    }

    setUploading(true);

    for (const file of selectedFiles) {
      const result = await uploadCarFile(driver.id, driver.name, nextRace.name, file);
      if (!result.success) {
        alert(`Error uploading ${file.name}: ${result.error}`);
      }
    }

    // Reload uploads
    const data = await getCarUploads(driver.id, nextRace.name);
    setUploads(data);
    setSelectedFiles([]);
    setUploading(false);
    alert("Upload complete!");
  };

  const isImageFile = (type) => type.startsWith("image/");
  const isVideoFile = (type) => type.startsWith("video/");

  if (!nextRace) {
    return (
      <div style={sectionCardStyle}>
        <h2 style={{ marginTop: 0 }}>📸 Car Upload</h2>
        <div style={{ opacity: 0.75 }}>
          No upcoming race scheduled yet. Check back soon!
        </div>
      </div>
    );
  }

  return (
    <div style={sectionCardStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 8 }}>📸 Upload Car Photos & Videos</h2>
      <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>
        Race of the Week: <strong>{nextRace.name}</strong> ({new Date(nextRace.date).toLocaleDateString()})
      </div>

      {/* Upload Zone */}
      <div
        style={{
          border: "2px dashed #3d4859",
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
          background: "#0f1319",
          marginBottom: 16,
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("carFileInput").click()}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Drag files here or click to upload</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>Photos and videos - upload as many as you like!</div>
        <input
          id="carFileInput"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>Selected Files ({selectedFiles.length})</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#0f1319",
                  border: "1px solid #2c3440",
                  borderRadius: 8,
                  padding: 10,
                }}
              >
                <div style={{ fontSize: 13 }}>
                  {isImageFile(file.type) && "🖼️ "}
                  {isVideoFile(file.type) && "🎬 "}
                  {file.name}
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  style={{ ...dangerButtonStyle, padding: "6px 10px", fontSize: 12 }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            style={{
              ...primaryButtonStyle,
              width: "100%",
              marginTop: 12,
              opacity: uploading ? 0.6 : 1,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? "Uploading..." : `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Existing Uploads */}
      {loadingUploads ? (
        <div style={{ opacity: 0.75, fontSize: 13 }}>Loading your uploads...</div>
      ) : uploads.length > 0 ? (
        <div>
          <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 14 }}>
            Your Uploads ({uploads.length})
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {uploads.map((upload) => (
              <div
                key={upload.id}
                style={{
                  background: "#0f1319",
                  border: "1px solid #2c3440",
                  borderRadius: 8,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    paddingBottom: "100%",
                    position: "relative",
                    background: "#1a1f27",
                  }}
                >
                  {isImageFile(upload.file_type) ? (
                    <img
                      src={upload.file_url}
                      alt="Car"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : isVideoFile(upload.file_type) ? (
                    <video
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    >
                      <source src={upload.file_url} type={upload.file_type} />
                    </video>
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#1a1f27",
                        color: "#666",
                        fontSize: 24,
                      }}
                    >
                      📄
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    opacity: 0.6,
                    padding: 6,
                    textAlign: "center",
                  }}
                >
                  {new Date(upload.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ opacity: 0.75, fontSize: 13, padding: 12, background: "#0f1319", borderRadius: 8, textAlign: "center" }}>
          No uploads yet for {nextRace.name}. Upload your car photos above!
        </div>
      )}
    </div>
  );
}
