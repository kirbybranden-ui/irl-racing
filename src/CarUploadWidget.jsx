import React, { useState } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { supabase } from "./lib/supabase";

export default function CarUploadWidget({ onUploadSuccess, uploaderName = "Anonymous", driverNumber = null, raceWeek = null }) {
  const [uploading, setUploading] = useState(false);

  const saveToSupabase = async (cloudinaryData) => {
    try {
      const { data, error } = await supabase
        .from("car_uploads")
        .insert([
          {
            uploader_name: uploaderName,
            driver_number: driverNumber,
            image_url: cloudinaryData.secure_url,
            cloudinary_id: cloudinaryData.public_id,
            race_week: raceWeek,
            uploaded_at: new Date().toISOString()
          }
        ]);

      if (error) throw error;
      
      onUploadSuccess({
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
        uploaderName: uploaderName,
        uploadedAt: new Date().toISOString()
      });
      
      alert("✅ Photo uploaded!");
    } catch (err) {
      console.error("Supabase save error:", err);
      alert("Photo uploaded to Cloudinary but couldn't save metadata. Try again.");
    }
  };

  return (
    <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
      <h2 style={{ marginTop: 0 }}>📸 Upload Car Photo</h2>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>Upload your car photo for the weekly compilation.</div>
      
      <CldUploadWidget
        uploadPreset="dpu05oykz"
        cloudName="dpu05oykz"
        onSuccess={(result) => {
          if (result.event === "success") {
            setUploading(false);
            saveToSupabase(result.info);
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
}              fontWeight: 700,
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
