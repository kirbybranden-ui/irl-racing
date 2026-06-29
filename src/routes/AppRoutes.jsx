import React from "react";
import CupRoutes from "./CupRoutes";
import ArcaRoutes from "./ArcaRoutes";

export default function AppRoutes() {
  const rawPath = window.location.pathname || "/";
  const path = rawPath.toLowerCase();

  if (path === "/arca" || path.startsWith("/arca/")) {
    return <ArcaRoutes path={path} rawPath={rawPath} />;
  }

  return <CupRoutes path={path} rawPath={rawPath} />;
}
