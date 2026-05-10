import React, { useEffect, useState } from "react";
import JSZip from "jszip";
import { supabase } from "./lib/supabase.js";

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
  const [zipDownloadRace, setZipDownloadRace] = useState("");
  const [zipDownloading, setZipDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await supabase
        .from("car_uploads")
        .select("*")
        .order("uploaded_at", { ascending: false });

      console.log("CarGallery fetch — data:", data, "error:", error);

      if (error) {
        console.error("Error loading uploads:", error);
        setLoadError(error.message);
        setUploads([]);
        setFilteredUploads([]);
      } else {
        setUploads(data || []);
        setFilteredUploads(data || []);
      }
    } catch (err) {
      console.error("Error:", err);
      setLoadError(err.message);
      setUploads([]);
      setFilteredUploads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...uploads];
    if (selectedDriver) filtered = filtered.filter(u => String(u.driver_id) === String(selectedDriver));
    if (selectedRace) filtered = filtered.filter(u => (u.race_id || u.race_week) === selectedRace);
    setFilteredUploads(filtered);
  }, [uploads, selectedDriver, selectedRace]);

  const handleDelete = async (uploadId, filePath) => {
    if (!window.confirm("Delete this upload?")) return;
    try {
      if (filePath) await supabase.storage.from("car-uploads").remove([filePath]);
      await supabase.from("car_uploads").delete().eq("id", uploadId);
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

  const makeSafeFileName = (value) => {
    return String(value || "car-photo")
      .trim()
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "car-photo";
  };

  const getFileExtensionFromUpload = (upload, url) => {
    const fromName = String(upload.file_name || "").match(/\.([a-z0-9]+)$/i)?.[1];
    if (fromName) return fromName.toLowerCase();

    const cleanUrl = String(url || "").split("?")[0];
    const fromUrl = cleanUrl.match(/\.([a-z0-9]+)$/i)?.[1];
    if (fromUrl) return fromUrl.toLowerCase();

    const fileType = String(upload.file_type || "").toLowerCase();
    if (fileType.includes("jpeg")) return "jpg";
    if (fileType.includes("png")) return "png";
    if (fileType.includes("webp")) return "webp";
    if (fileType.includes("gif")) return "gif";
    if (fileType.includes("mp4")) return "mp4";
    if (fileType.includes("quicktime")) return "mov";

    return "jpg";
  };

  const downloadCarsZipByTrack = async () => {
    if (!zipDownloadRace) {
      alert("Select a track/race first.");
      return;
    }

    const raceUploads = uploads.filter(u => (u.race_id || u.race_week) === zipDownloadRace);
    const downloadableUploads = raceUploads.filter(u => u.image_url || u.file_url);

    if (downloadableUploads.length === 0) {
      alert("No downloadable car photos found for that track.");
      return;
    }

    try {
      setZipDownloading(true);
      const zip = new JSZip();
      const folder = zip.folder(makeSafeFileName(zipDownloadRace));
      const usedNames = new Set();

      for (const upload of downloadableUploads) {
        const driver = drivers.find(d => String(d.id) === String(upload.driver_id));
        const url = upload.image_url || upload.file_url || "";
        const response = await fetch(url);

        if (!response.ok) {
          console.warn("Could not download car upload:", url, response.status);
          continue;
        }

        const blob = await response.blob();
        const extension = getFileExtensionFromUpload(upload, url);
        const driverName = driver ? `${driver.number}-${driver.name}` : (upload.driver_name || upload.uploader_name || `upload-${upload.id}`);
        const baseName = makeSafeFileName(driverName);
        let fileName = `${baseName}.${extension}`;
        let counter = 2;

        while (usedNames.has(fileName)) {
          fileName = `${baseName}-${counter}.${extension}`;
          counter += 1;
        }

        usedNames.add(fileName);
        folder.file(fileName, blob);
      }

      if (usedNames.size === 0) {
        alert("The ZIP could not be created because none of the files downloaded. Check that the uploaded file URLs are public.");
        return;
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${makeSafeFileName(zipDownloadRace)}-car-photos.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP download error:", err);
      alert("Could not create ZIP file. Make sure jszip is installed and the car upload URLs are public.");
    } finally {
      setZipDownloading(false);
    }
  };


  // Unique race values — prefer race_id, fall back to race_week
  const raceOptions = [...new Set(uploads.map(u => u.race_id || u.race_week).filter(Boolean))];

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={sectionCardStyle}>
          <button onClick={() => window.history.back()} style={{ ...secondaryButtonStyle, marginBottom: 12 }}>
            ← Back to Admin
          </button>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Car Photo Gallery</h1>
          <p style={{ opacity: 0.75, marginTop: 4 }}>View and manage car uploads from drivers for each race week.</p>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Driver</label>
              <select style={inputStyle} value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {drivers
                  .filter(d => uploads.some(u => String(u.driver_id) === String(d.id)))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(d => (
                    <option key={d.id} value={String(d.id)}>#{d.number} {d.name}</option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Race</label>
              <select style={inputStyle} value={selectedRace} onChange={(e) => setSelectedRace(e.target.value)}>
                <option value="">All Races</option>
                {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Results</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", height: 42 }}>
                {filteredUploads.length} uploads
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid #2c3440" }}>
            <h3 style={{ marginTop: 0, marginBottom: 10 }}>Download All Cars by Track</h3>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Select Track / Race</label>
                <select style={inputStyle} value={zipDownloadRace} onChange={(e) => setZipDownloadRace(e.target.value)}>
                  <option value="">Choose a track/race</option>
                  {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button
                onClick={downloadCarsZipByTrack}
                disabled={zipDownloading || !zipDownloadRace}
                style={{
                  ...primaryButtonStyle,
                  opacity: zipDownloading || !zipDownloadRace ? 0.55 : 1,
                  cursor: zipDownloading || !zipDownloadRace ? "not-allowed" : "pointer",
                  minHeight: 42,
                }}
              >
                {zipDownloading ? "Building ZIP..." : "Download Track ZIP"}
              </button>
            </div>
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 8 }}>
              This downloads the actual uploaded car photos for the selected track into one ZIP file.
            </div>
          </div>
        </div>

        {loadError ? (
          <div style={{ ...sectionCardStyle, borderColor: "#b42318" }}>
            <div style={{ color: "#f87171", fontWeight: 700, marginBottom: 8 }}>Failed to load uploads</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{loadError}</div>
            <button onClick={loadUploads} style={{ ...primaryButtonStyle, marginTop: 12 }}>Retry</button>
          </div>
        ) : loading ? (
          <div style={sectionCardStyle}>Loading car uploads...</div>
        ) : filteredUploads.length === 0 ? (
          <div style={sectionCardStyle}>
            <div style={{ opacity: 0.75, textAlign: "center", padding: 40 }}>No car uploads found.</div>
          </div>
        ) : (
          <div style={sectionCardStyle}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {filteredUploads.map(upload => {
                const driver = drivers.find(d => String(d.id) === String(upload.driver_id));
                const url = upload.image_url || upload.file_url || "";
                const fileType = upload.file_type || "";
                const isImage = fileType.startsWith("image/") || (!fileType && url.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                const isVideo = fileType.startsWith("video/") || (!fileType && url.match(/\.(mp4|mov|avi|webm)$/i));
                const raceName = upload.race_id || upload.race_week || "—";
                const driverLabel = driver
                  ? `#${driver.number} ${driver.name}`
                  : (upload.driver_name || upload.uploader_name || "Unknown");

                return (
                  <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27", overflow: "hidden" }}>
                      {isImage ? (
                        <img src={url} alt="Car" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : isVideo ? (
                        <video style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}>
                          <source src={url} type={fileType || "video/mp4"} />
                        </video>
                      ) : url ? (
                        <img src={url} alt="Car" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>📄 File</div>
                      )}
                    </div>

                    <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>DRIVER</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{driverLabel}</div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>RACE</div>
                        <div style={{ fontSize: 13 }}>{raceName}</div>
                      </div>
                      {upload.file_name && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>FILE</div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>{upload.file_name}</div>
                          {upload.file_size && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{(upload.file_size / 1024).toFixed(1)} KB</div>}
                        </div>
                      )}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>UPLOADED</div>
                        <div style={{ fontSize: 11, opacity: 0.8 }}>
                          {upload.uploaded_at ? new Date(upload.uploaded_at).toLocaleString() : "—"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                        <button onClick={() => handleDownload(url, upload.file_name || "car-photo")} style={{ ...primaryButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}>
                          Download
                        </button>
                        <button onClick={() => handleDelete(upload.id, upload.file_path)} style={{ ...dangerButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}>
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
