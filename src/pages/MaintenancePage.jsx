export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#0b0b0b 0%, #161616 60%, #8B0000 100%)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 30,
      }}
    >
      <div style={{ maxWidth: 900 }}>
        <h1 style={{ fontSize: 56, marginBottom: 10 }}>
          Budweiser Racing League
        </h1>

        <h2 style={{ color: "#ff4444" }}>
          🚧 Down for Scheduled Maintenance
        </h2>

        <p style={{ fontSize: 22, lineHeight: 1.7 }}>
          We're rebuilding the league experience from the ground up as we
          prepare for the future of the Budweiser Racing League.
        </p>

        <div
          style={{
            marginTop: 40,
            padding: 25,
            borderRadius: 18,
            background: "rgba(255,255,255,.08)",
          }}
        >
          <h2>Expected Downtime</h2>
          <h1 style={{ color: "#FFD700", fontSize: 48 }}>
            Approximately 5 Days
          </h1>
        </div>

        <div
          style={{
            marginTop: 50,
            textAlign: "left",
            display: "inline-block",
          }}
        >
          <h2>What's Coming</h2>

          <ul style={{ fontSize: 20, lineHeight: 2 }}>
            <li>🏁 Budweiser Cup Series</li>
            <li>🏎 Xfinity Series</li>
            <li>🚚 Craftsman Truck Series</li>
            <li>⭐ ARCA Menards Series</li>
            <li>📱 Redesigned Mobile Experience</li>
            <li>👥 Improved Owner & Driver Portals</li>
            <li>📊 Expanded Statistics</li>
            <li>⚡ Faster Performance</li>
          </ul>
        </div>

        <p
          style={{
            marginTop: 60,
            color: "#ccc",
            fontSize: 18,
            fontStyle: "italic",
          }}
        >
          "The Next Generation of Sim Racing Starts Here."
        </p>

        <button
          onClick={() => {
            sessionStorage.setItem("bcl-maintenance-bypass", "true");
            window.location.reload();
          }}
          style={{
            marginTop: 40,
            padding: "14px 28px",
            background: "#d4af37",
            color: "#111",
            fontWeight: 900,
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Enter as Admin
        </button>
      </div>
    </div>
  );
}
