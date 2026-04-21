import React from "react";

export default function CarGalleryPage({ drivers = [], tracks = [] }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", padding: 20 }}>
      <h1>Car Photo Gallery</h1>
      <p>Test version - if you see this, the import works!</p>
      <p>Drivers: {drivers.length}</p>
      <p>Tracks: {tracks.length}</p>
      <button onClick={() => window.history.back()}>Back</button>
    </div>
  );
}
