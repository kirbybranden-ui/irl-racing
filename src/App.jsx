import React, { useState, useEffect } from "react";
import AdminDashboard from "./AdminDashboard";
import PublicStandings from "./PublicStandings";
import FilesPage from "./FilesPage";
import SubmitAppealPage from "./SubmitAppealPage";
import AppealsPage from "./AppealsPage";
import WelcomePage from "./WelcomePage";
import DriverProfilePage from "./DriverProfilePage";
import Ticker from "./Ticker";
import CarGalleryPage from "./CarGalleryPage";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };

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

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [drivers, setDrivers] = useState(defaultDrivers);
  const [seasons, setSeasons] = useState([
    {
      id: 1,
      name: "2026 Season",
      activeSeasonId: 1,
      drivers: defaultDrivers,
      raceHistory: [],
      positions: {},
      stage1: {},
      stage2: {},
      stage3: {},
      dnfMap: {},
      offenseMap: {},
      fastestLapMap: {},
    },
  ]);
  const [activeSeason, setActiveSeason] = useState(seasons[0]);

  const tracks = defaultRaces;

  useEffect(() => {
    const handleNavigation = (e) => {
      setPath(e.detail || window.location.pathname);
    };
    window.addEventListener("navigate", handleNavigation);
    return () => window.removeEventListener("navigate", handleNavigation);
  }, []);

  const headerButtonStyle = {
    background: "#d4af37",
    color: "#111",
    border: "none",
    borderRadius: 10,
    padding: "10px 16px",
    fontWeight: 700,
    cursor: "pointer",
    marginRight: 8,
  };

  // ROUTE HANDLER - ORDER MATTERS!
  if (path === "/") return <AdminDashboard seasons={seasons} setSeasons={setSeasons} activeSeason={activeSeason} drivers={drivers} setDrivers={setDrivers} />;
  if (path === "/standings") return <PublicStandings seasons={seasons} activeSeason={activeSeason} />;
  if (path === "/files") return <FilesPage />;
  if (path === "/submit-appeal") return <SubmitAppealPage />;
  if (path === "/appeals") return <AppealsPage />;
  if (path === "/welcome") return <WelcomePage />;
  if (path === "/overlay/ticker") return <Ticker seasons={seasons} activeSeason={activeSeason} />;
  
  // CAR GALLERY ROUTE - MUST BE BEFORE /driver/:number
  if (path === "/admin/car-gallery") return <CarGalleryPage drivers={drivers} tracks={tracks} />;
  
  // DRIVER PROFILE ROUTE - LAST
  if (path.startsWith("/driver/")) {
    const driverNumber = path.split("/").pop();
    return <DriverProfilePage seasons={seasons} activeSeason={activeSeason} driverNumber={driverNumber} tracks={tracks} />;
  }

  // FALLBACK
  return (
    <div style={appShellStyle}>
      <div style={{ padding: 20 }}>
        <h1>404 - Page Not Found</h1>
        <p>Path: {path}</p>
        <button onClick={() => (window.location.pathname = "/")} style={headerButtonStyle}>
          Go Home
        </button>
      </div>
    </div>
  );
}
