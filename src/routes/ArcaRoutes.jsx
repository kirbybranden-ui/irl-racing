import React from "react";
import ArcaHomePage from "../series/arca/ArcaHomePage";
import ArcaStandingsPage from "../series/arca/ArcaStandingsPage";
import ArcaSchedulePage from "../series/arca/ArcaSchedulePage";
import ArcaDriversPage from "../series/arca/ArcaDriversPage";
import ArcaTeamsPage from "../series/arca/ArcaTeamsPage";

export default function ArcaRoutes({ path = "/arca" }) {
  if (path === "/arca/standings") return <ArcaStandingsPage />;
  if (path === "/arca/schedule") return <ArcaSchedulePage />;
  if (path === "/arca/drivers") return <ArcaDriversPage />;
  if (path === "/arca/teams") return <ArcaTeamsPage />;

  return <ArcaHomePage />;
}
