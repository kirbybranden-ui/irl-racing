import React from "react";

const pageStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: 24,
};

const cardStyle = {
  background: "#151a22",
  border: "1px solid #2d3643",
  borderRadius: 22,
  padding: 20,
  marginBottom: 18,
  boxShadow: "0 10px 28px rgba(0,0,0,0.22)",
};

const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #313947",
  background: "#10141b",
  fontSize: 13,
};

const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #252c38",
  verticalAlign: "top",
  fontSize: 14,
};

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getTeamFullName(team) {
  const names = {
    JAM: "JA Motorsports",
    MER: "ME Racing",
    MMS: "Mayhem Motorsports",
    NLM: "Nine Line Motorsports",
    BOM: "Blue Oval Motorsports",
    Independent: "Independent",
  };

  return names[team] || team || "Unknown Team";
}

export default function TeamDetailPage({
  drivers = [],
  teamDrivers = [],
  teamStandings = [],
  standings = [],
  selectedStanding = null,
  team = null,
  initialTeam = "",
  selectedTeam = "",
  seasonName = "",
}) {
  const teamKey = normalize(
    selectedTeam ||
      initialTeam ||
      selectedStanding?.team ||
      team?.team
  );

  // 🔥 ALWAYS build roster from drivers (this is your live feed source)
  const roster = (teamDrivers.length
    ? teamDrivers
    : drivers.filter((d) => normalize(d.team) === teamKey)
  )
    .filter((d) => !normalize(d.name).startsWith("inactive-"))
    .sort(
      (a, b) =>
        (b.points || 0) - (a.points || 0) ||
        (b.wins || 0) - (a.wins || 0) ||
        Number(a.number || 0) - Number(b.number || 0)
    );

  // 🔥 LIVE ANALYTICS (calculated every render)
  const points = roster.reduce((s, d) => s + (Number(d.points) || 0), 0);
  const wins = roster.reduce((s, d) => s + (Number(d.wins) || 0), 0);
  const top3 = roster.reduce((s, d) => s + (Number(d.top3) || 0), 0);
  const top5 = roster.reduce((s, d) => s + (Number(d.top5) || 0), 0);
  const dnfs = roster.reduce((s, d) => s + (Number(d.dnfs) || 0), 0);
  const fastestLaps = roster.reduce((s, d) => s + (Number(d.fastestLaps) || 0), 0);
  const penalties = roster.reduce((s, d) => s + (Number(d.totalPenalties) || 0), 0);

  const avgPoints = roster.length ? (points / roster.length).toFixed(1) : "0.0";
  const winRate = roster.length ? ((wins / roster.length) * 100).toFixed(1) : "0.0";
  const podiumRate = roster.length ? ((top3 / roster.length) * 100).toFixed(1) : "0.0";

  const topDriver = roster[0] || null;

  return (
    <div style={pageStyle}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <button
          onClick={() => (window.location.href = "/standings")}
          style={{
            background: "#2a3140",
            color: "white",
            border: "1px solid #3d4859",
            borderRadius: 10,
            padding: "10px 16px",
            fontWeight: 700,
            cursor: "pointer",
            marginBottom: 18,
          }}
        >
          ← Back to Standings
        </button>

        {/* HEADER */}
        <div style={{ ...cardStyle, borderColor: "#d4af37" }}>
          <div style={{ fontSize: 13, opacity: 0.72, marginBottom: 6 }}>
            {seasonName}
          </div>

          <div style={{ fontSize: 38, fontWeight: 900 }}>
            {getTeamFullName(teamKey)}
          </div>

          <div style={{ fontSize: 15, opacity: 0.72, marginTop: 6 }}>
            Live Team Analytics
          </div>
        </div>

        {/* ANALYTICS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 14,
            marginBottom: 18,
          }}
        >
          {[
            ["POINTS", points],
            ["WINS", wins],
            ["TOP 3", top3],
            ["TOP 5", top5],
            ["DRIVERS", roster.length],
            ["DNFs", dnfs],
            ["FASTEST LAPS", fastestLaps],
            ["PENALTIES", penalties ? `-${penalties}` : 0],
            ["AVG PTS / DRIVER", avgPoints],
            ["WIN RATE", `${winRate}%`],
            ["PODIUM RATE", `${podiumRate}%`],
          ].map(([label, value]) => (
            <div key={label} style={cardStyle}>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
              <div style={{ fontSize: 30, fontWeight: 900 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* SNAPSHOT */}
        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Team Snapshot
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>TOP DRIVER</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#d4af37" }}>
                {topDriver ? `#${topDriver.number} ${topDriver.name}` : "—"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.65 }}>LIVE DATA STATUS</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#4ade80" }}>
                Feeding From Driver Data
              </div>
            </div>
          </div>
        </div>

        {/* DRIVER TABLE */}
        <div style={cardStyle}>
          <div style={{ fontSize: 26, fontWeight: 900, marginBottom: 14 }}>
            Drivers
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>Driver</th>
                  <th style={thStyle}>Manufacturer</th>
                  <th style={thStyle}>Points</th>
                  <th style={thStyle}>Wins</th>
                  <th style={thStyle}>Top 3</th>
                  <th style={thStyle}>Top 5</th>
                  <th style={thStyle}>DNFs</th>
                  <th style={thStyle}>FL</th>
                  <th style={thStyle}>Penalties</th>
                </tr>
              </thead>

              <tbody>
                {roster.map((d) => (
                  <tr
                    key={d.id || d.number}
                    style={{ cursor: "pointer" }}
                    onClick={() => (window.location.href = `/driver/${d.number}`)}
                  >
                    <td style={{ ...tdStyle, fontWeight: 900 }}>#{d.number}</td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: "#d4af37" }}>
                      {d.name}
                    </td>
                    <td style={tdStyle}>{d.manufacturer || "—"}</td>
                    <td style={{ ...tdStyle, fontWeight: 900 }}>{d.points || 0}</td>
                    <td style={tdStyle}>{d.wins || 0}</td>
                    <td style={tdStyle}>{d.top3 || 0}</td>
                    <td style={tdStyle}>{d.top5 || 0}</td>
                    <td style={tdStyle}>{d.dnfs || 0}</td>
                    <td style={tdStyle}>{d.fastestLaps || 0}</td>
                    <td style={{ ...tdStyle, color: (d.totalPenalties || 0) > 0 ? "#f87171" : "white" }}>
                      {d.totalPenalties ? `-${d.totalPenalties}` : "0"}
                    </td>
                  </tr>
                ))}

                {roster.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={10}>
                      No drivers found for this team.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
