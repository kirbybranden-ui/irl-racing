import React from "react";

export default function CarGalleryPage({ drivers = [], tracks = [] }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1>Car Gallery Test</h1>
      <p>If you see this, the component loaded successfully!</p>
      <p>Drivers: {Array.isArray(drivers) ? drivers.length : 0}</p>
      <p>Tracks: {Array.isArray(tracks) ? tracks.length : 0}</p>
      <button 
        onClick={() => window.history.back()}
        style={{ background: "#d4af37", color: "#111", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontWeight: 700 }}
      >
        Back to Admin
      </button>
    </div>
  );
}
