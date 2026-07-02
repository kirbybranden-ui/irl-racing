import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

const pageFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.7)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: "11px 13px",
  boxSizing: "border-box",
  resize: "vertical",
  fontFamily: pageFont,
  fontSize: 14,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
};

const primaryButtonStyle = {
  background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "12px 20px",
  fontWeight: 1000,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: pageFont,
  boxShadow: "0 14px 32px rgba(255,59,48,0.28)",
};

const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.7)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
  fontFamily: pageFont,
};

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

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(29,29,31,0.42)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 20,
      fontFamily: pageFont,
    }}>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.92))",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 30,
        padding: "clamp(20px, 4vw, 30px)",
        maxWidth: 540,
        width: "100%",
        boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
        maxHeight: "90vh",
        overflowY: "auto",
        color: "#1d1d1f",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 12px 26px rgba(255,59,48,0.28)",
              flexShrink: 0,
            }}>
              🐛
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 1000, letterSpacing: "-0.03em" }}>Report an Issue</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: 999,
              width: 32,
              height: 32,
              color: "#1d1d1f",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Driver Info */}
          <div style={{ marginBottom: 18, background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 18, padding: 14 }}>
            <div style={{ fontSize: 11, opacity: 0.55, fontWeight: 1000, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Submitting As</div>

            {drivers.length > 0 ? (
              <>
                <select
                  value={selectedDriverKey}
                  onChange={(e) => setSelectedDriverKey(e.target.value)}
                  style={{ ...inputStyle, borderRadius: 999, fontWeight: 800 }}
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
                  <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8, fontWeight: 700 }}>
                    #{driverNumber} {driverName}
                  </div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 900 }}>#{driverNumber} {driverName}</div>
            )}
            <div style={{ fontSize: 12, opacity: 0.55, marginTop: 8, fontWeight: 800 }}>{series === "arca" ? "🏎️ ARCA Series" : "🏁 Cup Series"}</div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Issue Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Login button not working, Paint scheme voting broken..."
              style={inputStyle}
              maxLength={100}
            />
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5, fontWeight: 700 }}>{title.length}/100 characters</div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. What were you trying to do? What happened instead?"
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>

          {/* Screenshot Upload */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Screenshot (Optional)</label>
            <button
              type="button"
              onClick={() => {
                if (!cloudinaryReady || !widgetRef.current) {
                  alert("Upload widget is loading. Try again in a moment.");
                  return;
                }
                widgetRef.current.open();
              }}
              style={{ ...secondaryButtonStyle, width: "100%", opacity: cloudinaryReady ? 1 : 0.55, boxSizing: "border-box" }}
              disabled={!cloudinaryReady}
            >
              {screenshotUrl ? "✅ Screenshot uploaded" : cloudinaryReady ? "📸 Upload Screenshot" : "⏳ Loading uploader..."}
            </button>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" style={{ ...primaryButtonStyle, opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
              {submitting ? "Submitting..." : "📤 Submit Issue"}
            </button>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
