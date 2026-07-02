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
  background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "12px 20px",
  fontWeight: 1000,
  cursor: "pointer",
  fontSize: 14,
  fontFamily: pageFont,
  boxShadow: "0 14px 32px rgba(0,122,255,0.26)",
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

export function EditIssueModal({ issue, onClose, onSaved }) {
  const [title, setTitle] = useState(issue.title || "");
  const [description, setDescription] = useState(issue.description || "");
  const [screenshotUrl, setScreenshotUrl] = useState(issue.screenshot_url || "");
  const [saving, setSaving] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
      return;
    }
    const existing = document.getElementById("cloudinary-widget-script-issues");
    if (existing) {
      existing.addEventListener("load", () => setCloudinaryReady(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "cloudinary-widget-script-issues";
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryReady(true);
    script.onerror = () => console.error("Cloudinary widget failed to load");
    document.body.appendChild(script);
  }, []);

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
        }
      }
    );
  }, [cloudinaryReady]);

  async function handleSave(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in title and description.");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("issues")
      .update({
        title: title.trim(),
        description: description.trim(),
        screenshot_url: screenshotUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", issue.id);

    setSaving(false);
    if (error) {
      console.error("Error updating issue:", error);
      alert("Failed to save changes.");
      return;
    }
    onSaved?.();
    onClose();
  }

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
      zIndex: 1100,
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
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 12px 26px rgba(0,122,255,0.26)",
              flexShrink: 0,
            }}>
              ✏️
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 1000, letterSpacing: "-0.03em" }}>Edit Your Report</h2>
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

        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Issue Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={inputStyle}
              maxLength={100}
            />
            <div style={{ fontSize: 11, opacity: 0.5, marginTop: 5, fontWeight: 700 }}>{title.length}/100 characters</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: 120 }}
            />
          </div>

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
              {screenshotUrl ? "✅ Screenshot attached — tap to replace" : cloudinaryReady ? "📸 Upload Screenshot" : "⏳ Loading uploader..."}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" style={{ ...primaryButtonStyle, opacity: saving ? 0.7 : 1 }} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>
            <button type="button" onClick={onClose} style={secondaryButtonStyle} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
