import React, { useState, useEffect } from "react";
import CarUploadWidget from "./CarUploadWidget";
import { supabase } from "./lib/supabase";

export default function CarGalleryPage({ drivers = [] }) {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("car_uploads")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (err) {
      console.error("Load error:", err);
      alert("Error loading photos");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, cloudinaryId) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const { error } = await supabase
        .from("car_uploads")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setUploads(uploads.filter(u => u.id !== id));
      alert("Photo deleted!");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Error deleting photo");
    }
  };

  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-photo.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <button 
            onClick={() => window.history.back()} 
            style={{ background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer", marginBottom: 12 }}
          >
            ← Back
          </button>
          <h1 style={{ marginTop: 0 }}>Car Gallery</h1>
        </div>

        <CarUploadWidget 
          onUploadSuccess={() => loadUploads()}
          uploaderName="Driver"
        />

        {loading ? (
          <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18 }}>
            Loading photos...
          </div>
        ) : uploads.length === 0 ? (
          <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, textAlign: "center", opacity: 0.75 }}>
            No photos uploaded yet
          </div>
        ) : (
          <div>
            <h3>Weekly Photos ({uploads.length})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {uploads.map(upload => (
                <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27" }}>
                    <img 
                      src={upload.image_url} 
                      alt="Car" 
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} 
                    />
                  </div>
                  <div style={{ padding: 12, display: "flex", flexDirection: "column", flex: 1 }}>
                    <small style={{ opacity: 0.7, marginBottom: 8 }}>
                      {upload.uploader_name} • {new Date(upload.uploaded_at).toLocaleDateString()}
                    </small>
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      <button 
                        onClick={() => handleDownload(upload.image_url, "car-photo.jpg")} 
                        style={{ flex: 1, background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => handleDelete(upload.id, upload.cloudinary_id)} 
                        style={{ flex: 1, background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
