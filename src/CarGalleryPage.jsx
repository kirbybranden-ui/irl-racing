import React, { useEffect, useState } from "react";

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
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setError("Supabase credentials missing");
        setUploads([]);
        setFilteredUploads([]);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/car_uploads?order=uploaded_at.desc`,
        {
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setUploads(Array.isArray(data) ? data : []);
      setFilteredUploads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading uploads:", err);
      setError(err.message);
      setUploads([]);
      setFilteredUploads([]);
    } finally {
      setLoading(false);
    }
  };

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

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Delete from storage
      await fetch(
        `${supabaseUrl}/storage/v1/object/car-uploads/${filePath}`,
        {
          method: "DELETE",
          headers: {
            "apikey": supabaseAnonKey,
          },
        }
      );

      // Delete from database
      await fetch(
        `${supabaseUrl}/rest/v1/car_uploads?id=eq.${uploadId}`,
        {
          method: "DELETE",
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
        }
      );

      setUploads(uploads.filter(u => u.id !== uploadId));
      alert("Upload deleted!");
    } catch (err) {
      console.error("Error:", err);
      alert("Error deleting upload");
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

  const isImageFile = (type) => type && type.startsWith("image/");
  const isVideoFile = (type) => type && type.startsWith("video/");

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

        {error && (
          <div style={{ ...sectionCardStyle, background: "#5d2c2c", borderColor: "#b42318" }}>
            <div style={{ color: "#ff6b6b" }}>Error: {error}</div>
            <button onClick={loadUploads} style={{ ...primaryButtonStyle, marginTop: 12 }}>
              Retry
            </button>
          </div>
        )}

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
                      {t.name}
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

        {loading ? (
          <div style={sectionCardStyle}>Loading car uploads...</div>
        ) : filteredUploads.length === 0 ? (
          <div style={sectionCardStyle}>
            <div style={{ opacity: 0.75, textAlign: "center", padding: 40 }}>
              No car uploads found.
            </div>
          </div>
        ) : (
          <div style={sectionCardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredUploads.map(upload => {
                const driver = drivers.find(d => d.id === upload.driver_id);

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
                          {upload.race_id}
                        </div>
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
