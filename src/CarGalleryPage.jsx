import React, { useEffect, useState } from "react";
import { getAllCarUploads, deleteCarUpload } from "./lib/carUploads.js";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1400, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };

export default function CarGalleryPage({ drivers = [], tracks = [] }) {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all car uploads
  useEffect(() => {
    async function loadUploads() {
      setLoading(true);
      const data = await getAllCarUploads();
      setUploads(data);
      setFilteredUploads(data);
      setLoading(false);
    }
    loadUploads();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...uploads];

    if (selectedDriver) {
      filtered = filtered.filter(u => String(u.driver_id) === selectedDriver);
    }

    if (selectedRace) {
      filtered = filtered.filter(u => u.race_id === selectedRace);
    }

    setFilteredUploads(filtered);
  }, [uploads, selectedDriver, selectedRace]);

  const handleDelete = async (uploadId, filePath) => {
    if (!window.confirm("Delete this upload?")) return;

    const result = await deleteCarUpload(uploadId, filePath);
    if (result.success) {
      setUploads(uploads.filter(u => u.id !== uploadId));
      alert("Upload deleted!");
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-photo";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const isImageFile = (type) => type.startsWith("image/");
  const isVideoFile = (type) => type.startsWith("video/");

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={sectionCardStyle}>
          <button 
            onClick={() => window.history.back()} 
            style={{ ...secondaryButtonStyle, marginBottom: 12 }}
          >
            ← Back to Admin
          </button>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Car Photo Gallery</h1>
          <p style={{ opacity: 0.75, marginTop: 4 }}>
            View and manage car uploads from drivers for each race week.
          </p>
        </div>

        {/* Filters */}
        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Driver</label>
              <select 
                style={inputStyle} 
                value={selectedDriver} 
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">All Drivers</option>
                {drivers
                  .filter(d => uploads.some(u => u.driver_id === d.id))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      #{d.number} {d.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Race</label>
              <select 
                style={inputStyle} 
                value={selectedRace} 
                onChange={(e) => setSelectedRace(e.target.value)}
              >
                <option value="">All Races</option>
                {tracks
                  .filter(t => uploads.some(u => u.race_id === t.name))
                  .map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.date || "No date"})
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Results</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", height: 42 }}>
                {filteredUploads.length} uploads
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div style={sectionCardStyle}>Loading car uploads...</div>
        ) : filteredUploads.length === 0 ? (
          <div style={sectionCardStyle}>
            <div style={{ opacity: 0.75, textAlign: "center", padding: 40 }}>
              No car uploads found. Drivers will upload photos when the next race week opens!
            </div>
          </div>
        ) : (
          <div style={sectionCardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredUploads.map(upload => {
                const driver = drivers.find(d => d.id === upload.driver_id);
                const race = tracks.find(t => t.name === upload.race_id);

                return (
                  <div 
                    key={upload.id} 
                    style={{
                      background: "#0f1319",
                      border: "1px solid #2c3440",
                      borderRadius: 12,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    {/* Thumbnail */}
                    <div 
                      style={{
                        width: "100%",
                        paddingBottom: "75%",
                        position: "relative",
                        background: "#1a1f27",
                        overflow: "hidden"
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
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3Ctext fill='%23999' x='50' y='50' text-anchor='middle' dy='.3em' font-size='12'%3EImage Not Found%3C/text%3E%3C/svg%3E";
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
                            objectFit: "cover"
                          }}
                        >
                          <source src={upload.file_url} type={upload.file_type} />
                        </video>
                      ) : (
                        <div style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#1a1f27",
                          color: "#666"
                        }}>
                          📄 File
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>DRIVER</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>
                          {driver ? `#${driver.number} ${driver.name}` : "Unknown"}
                        </div>
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>RACE</div>
                        <div style={{ fontSize: 13 }}>
                          {race?.name || upload.race_id}
                        </div>
                        {race?.date && (
                          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                            {new Date(race.date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>FILE</div>
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          {upload.file_name}
                        </div>
                        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                          {(upload.file_size / 1024).toFixed(1)} KB
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>UPLOADED</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>
                          {new Date(upload.uploaded_at).toLocaleString()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                        <button 
                          onClick={() => handleDownload(upload.file_url, upload.file_name)}
                          style={{ ...primaryButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}
                        >
                          Download
                        </button>
                        <button 
                          onClick={() => handleDelete(upload.id, upload.file_path)}
                          style={{ ...dangerButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
