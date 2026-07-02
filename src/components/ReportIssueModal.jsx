import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", resize: "vertical" };
const buttonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 };
const secondaryButtonStyle = { background: "#1e2530", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };

export function ReportIssueModal({ isOpen, onClose, driverNumber, driverName, series = "cup", drivers = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const [selectedDriverKey, setSelectedDriverKey] = useState("");
  const widgetRef = useRef(null);

  const driversBySeries = drivers.reduce((groups, driver) => {
    const label = driver.seriesLabel || "Other";
    if (!groups[label]) groups[label] = [];
    groups[label].push(driver);
    return groups;
  }, {});

  const selectedDriver = drivers.find((d) => d.key === selectedDriverKey) || null;
  const effectiveDriverNumber = selectedDriver ? selectedDriver.number : driverNumber;
  const effectiveDriverName = selectedDriver ? selectedDriver.name : driverName;

  // Load Cloudinary widget
  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
      return;
    }
    const existing = document.getElementById("cloudinary-widget-script-issues");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "cloudinary-widget-script-issues";
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryReady(true);
    script.onerror = () => console.error("Cloudinary widget failed to load");
    document.body.appendChild(script);
  }, []);

  // Initialize Cloudinary widget
  useEffect(() => {
    if (!cloudinaryReady || !window.cloudinary) return;
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "irl_racing",
        maxFileSize: 104857600,
        clientAllowedFormats: ["jpg", "jpeg", "png", "gif", "webp"],
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          alert("Upload failed: " + (error.message || "Unknown error"));
          return;
        }
        if (result?.event === "success") {
          setScreenshotUrl(result.info.secure_url);
          alert("✅ Screenshot uploaded successfully!");
        }
      }
    );
  }, [cloudinaryReady]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("issues").insert({
        driver_number: String(effectiveDriverNumber || ""),
        driver_name: effectiveDriverName,
        series: series,
        title: title.trim(),
        description: description.trim(),
        screenshot_url: screenshotUrl || null,
        status: "Submitted",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert("✅ Issue submitted successfully! Thank you for your feedback.");
      setTitle("");
      setDescription("");
      setScreenshotUrl("");
      setSelectedDriverKey("");
      onClose();
    } catch (err) {
      console.error("Issue submission error:", err);
      alert(`Failed to submit issue: ${err?.message || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🐛 Report an Issue</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: 0 }}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Driver Info */}
          <div style={{ marginBottom: 16, background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.6, fontWeight: 700, marginBottom: 6 }}>SUBMITTING AS</div>

            {drivers.length > 0 ? (
              <>
                <select
                  value={selectedDriverKey}
                  onChange={(e) => setSelectedDriverKey(e.target.value)}
                  style={{ ...inputStyle, marginBottom: selectedDriver ? 0 : undefined }}
                >
                  <option value="">Guest / Prefer not to say</option>
                  {Object.entries(driversBySeries).map(([seriesLabel, list]) => (
                    <optgroup key={seriesLabel} label={seriesLabel}>
                      {list.map((driver) => (
                        <option key={driver.key} value={driver.key}>
                          #{driver.number} {driver.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {!selectedDriver && (
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                    #{driverNumber} {driverName}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700 }}>#{driverNumber} {driverName}</div>
            )}
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>{series === "arca" ? "🏎️ ARCA Series" : "🏁 Cup Series"}</div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Issue Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Login button not working, Paint scheme voting broken..."
              style={inputStyle}
              maxLength={100}
            />
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>{title.length}/100 characters</div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. What were you trying to do? What happened instead?"
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>

          {/* Screenshot Upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Screenshot (Optional)</label>
            <button
              type="button"
              onClick={() => {
                if (!cloudinaryReady || !widgetRef.current) {
                  alert("Upload widget is loading. Try again in a moment.");
                  return;
                }
                widgetRef.current.open();
              }}
              style={{ ...secondaryButtonStyle, width: "100%", opacity: cloudinaryReady ? 1 : 0.6 }}
              disabled={!cloudinaryReady}
            >
              {screenshotUrl ? "✅ Screenshot uploaded" : cloudinaryReady ? "📸 Upload Screenshot" : "⏳ Loading uploader..."}
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <button type="submit" style={buttonStyle} disabled={submitting}>
              {submitting ? "Submitting..." : "📤 Submit Issue"}
            </button>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
