import React, { useState, useEffect } from "react";

export default function CarGalleryPage({ drivers = [], tracks = [] }) {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) { setUploads([]); setFilteredUploads([]); return; }
      const response = await fetch(`${supabaseUrl}/rest/v1/car_uploads?order=uploaded_at.desc`, { headers: { "apikey": supabaseAnonKey, "Content-Type": "application/json" } });
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      setUploads(Array.isArray(data) ? data : []);
      setFilteredUploads(Array.isArray(data) ? data : []);
    } catch (err) { setUploads([]); setFilteredUploads([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    let filtered = [...uploads];
    if (selectedDriver) filtered = filtered.filter(u => String(u.driver_id) === selectedDriver);
    if (selectedRace) filtered = filtered.filter(u => u.race_id === selectedRace);
    setFilteredUploads(filtered);
  }, [uploads, selectedDriver, selectedRace]);

  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-photo";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (uploadId, filePath) => {
    if (!window.confirm("Delete this upload?")) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      await fetch(`${supabaseUrl}/storage/v1/object/car-uploads/${filePath}`, { method: "DELETE", headers: { "apikey": supabaseAnonKey } });
      await fetch(`${supabaseUrl}/rest/v1/car_uploads?id=eq.${uploadId}`, { method: "DELETE", headers: { "apikey": supabaseAnonKey, "Content-Type": "application/json" } });
      setUploads(uploads.filter(u => u.id !== uploadId));
      alert("Upload deleted!");
    } catch (err) { alert("Error deleting upload"); }
  };

  const isImageFile = (type) => type && type.startsWith("image/");
  const isVideoFile = (type) => type && type.startsWith("video/");

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <button onClick={() => window.history.back()} style={{ background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", marginBottom: 12 }}>← Back</button>
          <h1 style={{ marginTop: 0 }}>Car Gallery</h1>
        </div>
        {loading ? <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18 }}>Loading...</div> : filteredUploads.length === 0 ? <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, textAlign: "center", opacity: 0.75 }}>No uploads</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filteredUploads.map(upload => {
            const driver = drivers.find(d => d.id === upload.driver_id);
            return (
              <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27" }}>
                  {isImageFile(upload.file_type) ? <img src={upload.file_url} alt="Car" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : isVideoFile(upload.file_type) ? <video style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}><source src={upload.file_url} type={upload.file_type} /></video> : <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f27", color: "#666" }}>📄</div>}
                </div>
                <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                  <div style={{ marginBottom: 8 }}><div style={{ fontSize: 12, opacity: 0.7 }}>DRIVER</div><div style={{ fontWeight: 700 }}>{driver ? `#${driver.number}` : "Unknown"}</div></div>
                  <div style={{ marginBottom: 12 }}><div style={{ fontSize: 12, opacity: 0.7 }}>RACE</div><div>{upload.race_id}</div></div>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button onClick={() => handleDownload(upload.file_url, upload.file_name)} style={{ flex: 1, background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Download</button>
                    <button onClick={() => handleDelete(upload.id, upload.file_path)} style={{ flex: 1, background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
