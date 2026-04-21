import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";

export default function CarUploadWidget({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);

  return (
    <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
      <h2 style={{ marginTop: 0 }}>📸 Upload Car Photo</h2>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>Select a photo of your car to add to the gallery.</div>
      
      <CldUploadWidget
        uploadPreset="dpu05oykz"
        cloudName="dpu05oykz"
        onSuccess={(result) => {
          if (result.event === "success") {
            onUploadSuccess({
              url: result.info.secure_url,
              publicId: result.info.public_id,
              uploadedAt: new Date().toISOString()
            });
            setUploading(false);
          }
        }}
        onUpload={() => setUploading(true)}
      >
        {({ open }) => (
          <button
            onClick={() => open()}
            disabled={uploading}
            style={{
              background: uploading ? "#999" : "#d4af37",
              color: "#111",
              border: "none",
              borderRadius: 10,
              padding: "12px 24px",
              fontWeight: 700,
              cursor: uploading ? "not-allowed" : "pointer",
              fontSize: 14
            }}
          >
            {uploading ? "Uploading..." : "Choose Photo"}
          </button>
        )}
      </CldUploadWidget>
    </div>
  );
}
