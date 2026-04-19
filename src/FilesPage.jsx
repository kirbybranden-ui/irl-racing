import { useEffect, useState, useRef } from "react";
import { supabase } from "./lib/supabase";

const BUCKET = "league-files";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1100, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 13 };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "middle", fontSize: 14 };

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function loadFiles() {
    setLoading(true);
    setError("");
    try {
      const { data, error: listError } = await supabase
        .storage
        .from(BUCKET)
        .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      if (listError) throw listError;
      // .list() returns folder placeholders too; filter to real files
      setFiles((data || []).filter((f) => f.name && f.name !== ".emptyFolderPlaceholder"));
    } catch (err) {
      console.error("List failed:", err);
      setError(err.message || "Failed to load files.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFiles(); }, []);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      // Prepend a timestamp to avoid name collisions
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadError } = await supabase
        .storage
        .from(BUCKET)
        .upload(safeName, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      await loadFiles();
    } catch (err) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (event.target) event.target.value = "";
    }
  }

  async function handleDownload(fileName) {
    try {
      const { data, error: dlError } = await supabase
        .storage
        .from(BUCKET)
        .download(fileName);
      if (dlError) throw dlError;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      // Strip the timestamp prefix when saving locally
      a.download = fileName.replace(/^\d+-/, "");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert(err.message || "Download failed.");
    }
  }

  async function handleDelete(fileName) {
    if (!window.confirm(`Delete "${fileName.replace(/^\d+-/, "")}"? This cannot be undone.`)) return;
    try {
      const { error: rmError } = await supabase
        .storage
        .from(BUCKET)
        .remove([fileName]);
      if (rmError) throw rmError;
      await loadFiles();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.message || "Delete failed.");
    }
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0 }}>League Documents</h1>
            <div style={{ opacity: 0.72, marginTop: 4 }}>Shared file storage for league admins.</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={secondaryButtonStyle} onClick={() => (window.location.href = "/")}>← Back to Admin</button>
            <button style={secondaryButtonStyle} onClick={loadFiles} disabled={loading}>Refresh</button>
            <button style={primaryButtonStyle} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload File"}
            </button>
            <input ref={fileInputRef} type="file" onChange={handleUpload} style={{ display: "none" }} />
          </div>
        </div>

        {error && (
          <div style={{ ...sectionCardStyle, background: "#3a1a1a", border: "1px solid #b42318", color: "#fecaca" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <div style={sectionCardStyle}>
          {loading ? (
            <div style={{ opacity: 0.75 }}>Loading files...</div>
          ) : files.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No files uploaded yet. Click "Upload File" to add one.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>File Name</th>
                    <th style={thStyle}>Size</th>
                    <th style={thStyle}>Uploaded</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr key={f.name}>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{f.name.replace(/^\d+-/, "")}</td>
                      <td style={tdStyle}>{formatBytes(f.metadata?.size)}</td>
                      <td style={tdStyle}>{formatDate(f.created_at)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button style={secondaryButtonStyle} onClick={() => handleDownload(f.name)}>Download</button>
                          <button style={dangerButtonStyle} onClick={() => handleDelete(f.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
