import React, { useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function CarUploadWidget({ onUploadSuccess }) {
  useEffect(() => {
    // Load Cloudinary script
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/latest/CloudinaryUploadWidget.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleOpenWidget = () => {
    if (window.cloudinary) {
      window.cloudinary.openUploadWidget(
        {
          cloudName: "dpu05oykz",
          uploadPreset: "dpu05oykz",
          folder: "car-uploads"
        },
        async (error, result) => {
          if (!error && result && result.event === "success") {
            const imageUrl = result.info.secure_url;
            const publicId = result.info.public_id;

            // Save to Supabase
            try {
              const { error: dbError } = await supabase
                .from("car_uploads")
                .insert([
                  {
                    uploader_name: "Driver",
                    driver_number: null,
                    image_url: imageUrl,
                    cloudinary_id: publicId,
                    race_week: null,
                    uploaded_at: new Date().toISOString()
                  }
                ]);

              if (dbError) throw dbError;
              
              alert("✅ Photo uploaded successfully!");
              onUploadSuccess();
            } catch (err) {
              console.error("Database error:", err);
              alert("Photo uploaded but couldn't save metadata");
            }
          }
        }
      );
    }
  };

  return (
    <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
      <h2 style={{ marginTop: 0 }}>📸 Upload Car Photo</h2>
      <div style={{ opacity: 0.8, marginBottom: 12 }}>Select a photo of your car to add to the weekly gallery.</div>
      
      <button
        onClick={handleOpenWidget}
        style={{
          background: "#d4af37",
          color: "#111",
          border: "none",
          borderRadius: 10,
          padding: "12px 24px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: 14
        }}
      >
        Choose Photo
      </button>
    </div>
  );
}
