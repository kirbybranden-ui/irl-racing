import React, { useEffect, useMemo, useRef, useState } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import manufacturerChevrolet from "./assets/manufacturers/chevrolet.png";
import manufacturerFord from "./assets/manufacturers/ford.png";
import manufacturerToyota from "./assets/manufacturers/toyota.png";
import FilesPage from "./FilesPage";
import SubmitAppealPage from "./SubmitAppealPage";
import AppealsPage from "./AppealsPage";
import DriverProfilePage from "./DriverProfilePage";
import WelcomePage from "./WelcomePage";
import { supabase } from "./lib/supabase";

// Team logos
const teamLogos = {
  "JA MOTORSPORTS": teamLogoJAM,
  JAM: teamLogoJAM,
};
const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};
import { loadLeagueState, saveLeagueState } from "./lib/leagueState";

const defaultDrivers = [
  { id: 1, number: 42, name: "AMP-GHOSTRIDER", manufacturer: "Toyota", team: "JAM" },
  { id: 2, number: 99, name: "RookieVet99", manufacturer: "Toyota", team: "JAM" },
  { id: 3, number: 18, name: "bowhunter6758", manufacturer: "Toyota", team: "JAM" },
  { id: 4, number: 81, name: "HOLDEN2DX4EV3R", manufacturer: "Chevrolet", team: "JAM" },
  { id: 5, number: 3, name: "ixGusty", manufacturer: "Toyota", team: "None" },
  { id: 6, number: 14, name: "KapSig", manufacturer: "Chevrolet", team: "None" },
  { id: 7, number: 24, name: "KEVDINHO7", manufacturer: "Chevrolet", team: "None" },
  { id: 8, number: 38, name: "It's_tricky88", manufacturer: "Toyota", team: "None" },
  { id: 9, number: 97, name: "American_Hero216", manufacturer: "Ford", team: "None" },
];

const defaultRaces = [
  { name: "Preseason - Michigan", stageCount: 2, date: "2026-04-25" },
  { name: "Preseason - Dover", stageCount: 2, date: "2026-05-02" },
  { name: "Preseason - WWT Raceway", stageCount: 2, date: "2026-05-09" },
  { name: "Daytona (Night)", stageCount: 2, date: "2026-05-16" },
  { name: "Charlotte", stageCount: 3, date: "2026-05-23" },
  { name: "Nashville", stageCount: 2, date: "2026-05-30" },
  { name: "Michigan", stageCount: 2, date: "2026-06-06" },
  { name: "Pocono", stageCount: 2, date: "2026-06-13" },
  { name: "Bristol (Night)", stageCount: 2, date: "2026-06-20" },
  { name: "Las Vegas", stageCount: 2, date: "2026-06-27" },
  { name: "Talladega", stageCount: 2, date: "2026-07-11" },
  { name: "North Wilksboro", stageCount: 2, date: "2026-07-18" },
  { name: "Indianapolis", stageCount: 2, date: "2026-07-25" },
  { name: "New Hampshire", stageCount: 2, date: "2026-08-01" },
  { name: "Phoenix", stageCount: 2, date: "2026-08-08" },
  { name: "Richmond", stageCount: 2, date: "2026-08-15" },
  { name: "Kansas", stageCount: 2, date: "2026-08-22" },
  { name: "Texas", stageCount: 2, date: "2026-08-29" },
  { name: "Iowa", stageCount: 2, date: "2026-09-05" },
  { name: "Homestead", stageCount: 2, date: "2026-09-12" },
];

// Winston Cup points system
const pointsTable = [
  40, 35, 34, 33, 32, 31, 30, 29, 28, 27,
  26, 25, 24, 23, 22, 21, 20, 19, 18, 17,
  16, 15, 14, 13, 12, 11, 10, 9, 8, 7,
];
const stagePointsTable = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const offensePenaltyPoints = [5, 10, 15, 25];

function getOffensePenaltyPoints(offenseNumber) {
  if (offenseNumber <= 0) return 0;
  const idx = Math.min(offenseNumber, offensePenaltyPoints.length) - 1;
  return offensePenaltyPoints[idx];
}

function countPriorOffenses(raceHistory, driverId, excludeRaceName = null) {
  let count = 0;
  raceHistory.forEach((race) => {
    if (excludeRaceName && race.raceName === excludeRaceName) return;
    const result = race.results?.find((r) => r.driverId === driverId);
    if (result?.offense) count += 1;
  });
  return count;
}

function sanitizeTracks(rawTracks) {
  if (!Array.isArray(rawTracks)) return null;
  const cleaned = rawTracks
    .map((t) => {
      const name = typeof t?.name === "string" ? t.name.trim() : "";
      const stageCount = Number(t?.stageCount);
      if (!name) return null;
      const stages = [1, 2, 3].includes(stageCount) ? stageCount : 2;
      return { name, stageCount: stages };
    })
    .filter(Boolean);
  const seen = new Set();
  const deduped = [];
  cleaned.forEach((t) => {
    const key = t.name.toLowerCase();
    if (!seen.has(key)) { seen.add(key); deduped.push(t); }
  });
  return deduped;
}

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1400, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const headerButtonStyle = { background: "#222936", color: "white", border: "1px solid #3a4453", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const activeHeaderButtonStyle = { ...headerButtonStyle, background: "#d4af37", color: "#111", border: "1px solid #d4af37" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 220px" };

function getTeamBranding(teamName) {
  const teamBranding = {
    JAM: { logo: "JAM", accent: "#d4af37", dark: "#1b1b1b" },
    "JA MOTORSPORTS": { logo: "JA", accent: "#d4af37", dark: "#1b1b1b" },
    "None": { logo: "N", accent: "#808080", dark: "#2a2a2a" },
  };
  return teamBranding[teamName] || { logo: teamName?.charAt(0)?.toUpperCase() || "?", accent: "#d4af37", dark: "#161a20" };
}

function renderTeamBadge(teamName, size = 44) {
  const brand = getTeamBranding(teamName);
  const logoSrc = teamLogos[teamName];
  if (logoSrc) {
    return (
      <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", overflow: "hidden", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", background: "#111" }}>
        <img src={logoSrc} alt={teamName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: "50%", background: `linear-gradient(135deg, ${brand.accent} 0%, ${brand.dark} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", border: "2px solid rgba(255,255,255,0.15)", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", fontSize: size * 0.38 }}>
      {brand.logo}
    </div>
  );
}

function makeDriverWithStats(driver) {
  return { ...driver, manufacturer: driver.manufacturer || "", manufacturerLogo: driver.manufacturerLogo || manufacturerLogos[driver.manufacturer] || null, startingPoints: Number(driver.startingPoints) || 0, manualWins: Number(driver.manualWins) || 0, points: Number(driver.startingPoints) || 0, wins: Number(driver.manualWins) || 0, top3: 0, top5: 0, dnfs: 0, retired: driver.retired || false, notes: driver.notes || "" };
}

function getStagePoints(stageFinish) {
  if (!stageFinish || stageFinish < 1 || stageFinish > 10) return 0;
  return stagePointsTable[stageFinish - 1];
}

function rebuildDriversFromHistory(history, driverRoster) {
  return driverRoster.map((baseDriver) => {
    let points = Number(baseDriver.startingPoints) || 0;
    let wins = Number(baseDriver.manualWins) || 0;
    let top3 = 0, top5 = 0, dnfs = 0, fastestLaps = 0, totalPenalties = 0;
    history.forEach((race) => {
      const result = race.results?.find((r) => r.driverId === baseDriver.id);
      if (!result) return;
      points += result.totalRacePoints || 0;
      wins += result.isWin ? 1 : 0;
      top3 += result.isTop3 ? 1 : 0;
      top5 += result.isTop5 ? 1 : 0;
      dnfs += result.dnf ? 1 : 0;
      fastestLaps += result.fastestLap ? 1 : 0;
      totalPenalties += result.penaltyPoints || 0;
    });
    return { ...baseDriver, manufacturerLogo: baseDriver.manufacturerLogo || manufacturerLogos[baseDriver.manufacturer] || null, startingPoints: Number(baseDriver.startingPoints) || 0, manualWins: Number(baseDriver.manualWins) || 0, points, wins, top3, top5, dnfs, fastestLaps, totalPenalties, retired: baseDriver.retired || false };
  });
}

function makeSeasonId() { return `season-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

function createEmptySeason(name, roster = []) {
  const cleanRoster = roster.map((d) => ({ id: d.id, number: d.number, name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0 }));
  return { id: makeSeasonId(), name: name || "New Season", createdAt: new Date().toISOString(), drivers: rebuildDriversFromHistory([], cleanRoster), selectedRace: "", positions: {}, stage1: {}, stage2: {}, stage3: {}, dnfMap: {}, offenseMap: {}, fastestLapMap: {}, raceHistory: [] };
}

function sanitizeSeason(season, fallbackName = "Season") {
  const rosterSource = Array.isArray(season?.drivers) && season.drivers.length > 0 ? season.drivers : defaultDrivers.map(makeDriverWithStats);
  const rosterOnly = rosterSource.map((d) => ({ id: d.id, number: Number(d.number), name: d.name, manufacturer: d.manufacturer || "", team: d.team, startingPoints: Number(d.startingPoints) || 0, manualWins: Number(d.manualWins) || 0, retired: d.retired || false }));
  const history = Array.isArray(season?.raceHistory) ? season.raceHistory : [];
  return {
    id: season?.id || makeSeasonId(), name: season?.name || fallbackName, createdAt: season?.createdAt || new Date().toISOString(),
    drivers: rebuildDriversFromHistory(history, rosterOnly), selectedRace: season?.selectedRace || "",
    positions: season?.positions || {}, stage1: season?.stage1 || {}, stage2: season?.stage2 || {}, stage3: season?.stage3 || {},
    dnfMap: season?.dnfMap || {}, offenseMap: season?.offenseMap || {}, fastestLapMap: season?.fastestLapMap || {}, raceHistory: history,
  };
}

function loadInitialLeagueState() {
  let tracks = defaultRaces;
  try {
    const savedTracks = localStorage.getItem("irl-tracks");
    if (savedTracks) {
      const parsed = sanitizeTracks(JSON.parse(savedTracks));
      if (parsed && parsed.length > 0) tracks = parsed;
    }
  } catch { }
  try {
    const savedSeasons = localStorage.getItem("irl-seasons");
    const savedActiveSeasonId = localStorage.getItem("irl-activeSeasonId");
    if (savedSeasons) {
      const parsed = JSON.parse(savedSeasons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleanSeasons = parsed.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
        const activeExists = cleanSeasons.some((s) => s.id === savedActiveSeasonId);
        return { seasons: cleanSeasons, activeSeasonId: activeExists ? savedActiveSeasonId : cleanSeasons[0].id, tracks };
      }
    }
  } catch { }
  const legacySeason = createEmptySeason("Season 1", defaultDrivers.map(makeDriverWithStats));
  return { seasons: [legacySeason], activeSeasonId: legacySeason.id, tracks };
}

function PublicStandings({ drivers, teams, seasonName = "" }) {
  const sorted = [...drivers].sort((a, b) => b.points - a.points || b.wins - a.wins || b.top3 - a.top3 || a.name.localeCompare(b.name));
  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", padding: 20 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h1>{seasonName} - Standings</h1>
        <table style={tableStyle}>
          <thead><tr><th style={thStyle}>Pos</th><th style={thStyle}>#</th><th style={thStyle}>Driver</th><th style={thStyle}>Points</th><th style={thStyle}>Wins</th></tr></thead>
          <tbody>{sorted.map((d, i) => <tr key={d.id}><td style={tdStyle}>{i+1}</td><td style={tdStyle}>{d.number}</td><td style={tdStyle}>{d.name}</td><td style={tdStyle}>{d.points}</td><td style={tdStyle}>{d.wins}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

// ===== CAR GALLERY COMPONENT =====
function CarGalleryPageComponent({ drivers = [], tracks = [] }) {
  const [uploads, setUploads] = React.useState([]);
  const [filteredUploads, setFilteredUploads] = React.useState([]);
  const [selectedDriver, setSelectedDriver] = React.useState("");
  const [selectedRace, setSelectedRace] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setUploads([]);
        setFilteredUploads([]);
        return;
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/car_uploads?order=uploaded_at.desc`,
        {
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      setUploads(Array.isArray(data) ? data : []);
      setFilteredUploads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading uploads:", err);
      setUploads([]);
      setFilteredUploads([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    let filtered = [...uploads];
    if (selectedDriver) {
      filtered = filtered.filter(u => String(u.driver_id) === selectedDriver);
    }
    if (selectedRace) {
      filtered = filtered.filter(u => u.race_id === selectedRace);
    }
    setFilteredUploads(filtered);
  }, [uploads, selectedDriver, selectedRace]);

  const handleDownload = (url, fileName) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-photo";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDelete = async (uploadId, filePath) => {
    if (!window.confirm("Delete this upload?")) return;
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(
        `${supabaseUrl}/storage/v1/object/car-uploads/${filePath}`,
        {
          method: "DELETE",
          headers: { "apikey": supabaseAnonKey },
        }
      );

      await fetch(
        `${supabaseUrl}/rest/v1/car_uploads?id=eq.${uploadId}`,
        {
          method: "DELETE",
          headers: {
            "apikey": supabaseAnonKey,
            "Content-Type": "application/json",
          },
        }
      );

      setUploads(uploads.filter(u => u.id !== uploadId));
      alert("Upload deleted!");
    } catch (err) {
      console.error("Error:", err);
      alert("Error deleting upload");
    }
  };

  const isImageFile = (type) => type && type.startsWith("image/");
  const isVideoFile = (type) => type && type.startsWith("video/");

  return (
    <div style={{ minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
        <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <button 
            onClick={() => window.history.back()} 
            style={{ ...secondaryButtonStyle, marginBottom: 12 }}
          >
            ← Back to Admin
          </button>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>Car Photo Gallery</h1>
          <p style={{ opacity: 0.75, marginTop: 4 }}>View and manage car uploads from drivers</p>
        </div>

        <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 18, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Filters</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Driver</label>
              <select 
                style={inputStyle}
                value={selectedDriver} 
                onChange={(e) => setSelectedDriver(e.target.value)}
              >
                <option value="">All Drivers</option>
                {drivers
                  .filter(d => uploads.some(u => u.driver_id === d.id))
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(d => (
                    <option key={d.id} value={d.id}>
                      #{d.number} {d.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Filter by Race</label>
              <select 
                style={inputStyle}
                value={selectedRace} 
                onChange={(e) => setSelectedRace(e.target.value)}
              >
                <option value="">All Races</option>
                {tracks
                  .filter(t => uploads.some(u => u.race_id === t.name))
                  .map(t => (
                    <option key={t.name} value={t.name}>
                      {t.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Results</label>
              <div style={{ ...inputStyle, display: "flex", alignItems: "center", height: 42 }}>
                {filteredUploads.length} uploads
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ ...sectionCardStyle }}>Loading uploads...</div>
        ) : filteredUploads.length === 0 ? (
          <div style={{ ...sectionCardStyle, textAlign: "center", opacity: 0.75 }}>
            No car uploads found
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {filteredUploads.map(upload => {
              const driver = drivers.find(d => d.id === upload.driver_id);
              return (
                <div 
                  key={upload.id} 
                  style={{
                    background: "#0f1319",
                    border: "1px solid #2c3440",
                    borderRadius: 12,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column"
                  }}
                >
                  <div 
                    style={{
                      width: "100%",
                      paddingBottom: "75%",
                      position: "relative",
                      background: "#1a1f27",
                      overflow: "hidden"
                    }}
                  >
                    {isImageFile(upload.file_type) ? (
                      <img 
                        src={upload.file_url} 
                        alt="Car" 
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      />
                    ) : isVideoFile(upload.file_type) ? (
                      <video 
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover"
                        }}
                      >
                        <source src={upload.file_url} type={upload.file_type} />
                      </video>
                    ) : (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1f27", color: "#666" }}>
                        📄 File
                      </div>
                    )}
                  </div>

                  <div style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>DRIVER</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>
                        {driver ? `#${driver.number} ${driver.name}` : "Unknown"}
                      </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>RACE</div>
                      <div style={{ fontSize: 13 }}>{upload.race_id}</div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>FILE</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{upload.file_name}</div>
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
                        {(upload.file_size / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>UPLOADED</div>
                      <div style={{ fontSize: 11, opacity: 0.8 }}>
                        {new Date(upload.uploaded_at).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      <button 
                        onClick={() => handleDownload(upload.file_url, upload.file_name)}
                        style={{ ...primaryButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}
                      >
                        Download
                      </button>
                      <button 
                        onClick={() => handleDelete(upload.id, upload.file_path)}
                        style={{ ...dangerButtonStyle, flex: 1, padding: "8px 12px", fontSize: 12 }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
// ===== END CAR GALLERY COMPONENT =====

export default function App() {
  const [seasons, setSeasons] = useState(() => loadInitialLeagueState().seasons);
  const [openAppealCount, setOpenAppealCount] = useState(0);
  const [activeSeasonId, setActiveSeasonId] = useState(() => loadInitialLeagueState().activeSeasonId);
  const [tracks, setTracks] = useState(() => loadInitialLeagueState().tracks);
  const [isHydrated, setIsHydrated] = useState(false);
  const importFileRef = useRef(null);
  const path = window.location.pathname.toLowerCase();

  // ROUTES - ORDER MATTERS!
  if (path === "/files") return <FilesPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/appeals") return <AppealsPage />;
  if (path === "/standings") return <PublicStandings drivers={seasons.find(s => s.id === activeSeasonId)?.drivers || []} teams={[]} seasonName={seasons.find(s => s.id === activeSeasonId)?.name || ""} />;
  if (path === "/admin/car-gallery") return <CarGalleryPageComponent drivers={seasons.find(s => s.id === activeSeasonId)?.drivers || []} tracks={tracks} />;
  if (path.startsWith("/driver/")) {
    const activeSeason = seasons.find((s) => s.id === activeSeasonId) || seasons[0] || null;
    return <DriverProfilePage seasons={seasons} activeSeason={activeSeason} tracks={tracks} />;
  }

  useEffect(() => {
    let isMounted = true;
    async function hydrateFromSupabase() {
      try {
        const savedState = await loadLeagueState();
        if (!isMounted) return;
        if (savedState?.seasons && Array.isArray(savedState.seasons)) {
          const cleanSeasons = savedState.seasons.map((s, i) => sanitizeSeason(s, `Season ${i + 1}`));
          if (cleanSeasons.length > 0) {
            setSeasons(cleanSeasons);
            const activeExists = cleanSeasons.some((s) => s.id === savedState.activeSeasonId);
            setActiveSeasonId(activeExists ? savedState.activeSeasonId : cleanSeasons[0].id);
          }
        }
        const cleanTracks = sanitizeTracks(savedState?.tracks);
        if (cleanTracks && cleanTracks.length > 0) setTracks(cleanTracks);
      } catch (error) {
        console.error("Supabase load failed:", error);
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    }
    hydrateFromSupabase();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    async function loadOpenAppeals() {
      const { count, error } = await supabase
        .from("appeals")
        .select("*", { count: "exact", head: true })
        .eq("status", "Open");
      if (!error) setOpenAppealCount(count || 0);
    }
    loadOpenAppeals();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const timeout = setTimeout(() => {
      saveLeagueState({ seasons, activeSeasonId, tracks }).catch((e) => console.error("Supabase save failed:", e));
    }, 250);
    return () => clearTimeout(timeout);
  }, [seasons, activeSeasonId, tracks, isHydrated]);

  if (!isHydrated) return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}>Loading league data...</div></div></div>;

  // ADMIN DASHBOARD
  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 54 }} />
              <div>
                <div style={{ fontSize: 30, fontWeight: 800 }}>Budweiser Cup League</div>
                <div style={{ opacity: 0.72 }}>Admin Dashboard</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/standings")} style={headerButtonStyle}>
                Standings
              </button>
              <button onClick={() => (window.location.pathname = "/appeals")} style={headerButtonStyle}>
                Appeals ({openAppealCount})
              </button>
              <button onClick={() => (window.location.pathname = "/admin/car-gallery")} style={headerButtonStyle}>
                Car Gallery
              </button>
            </div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Welcome to Admin Panel</h2>
          <p>Manage drivers, races, and league standings.</p>
          <p style={{ opacity: 0.7 }}>Active Season: <strong>{seasons.find(s => s.id === activeSeasonId)?.name}</strong></p>
        </div>
      </div>
    </div>
  );
}
