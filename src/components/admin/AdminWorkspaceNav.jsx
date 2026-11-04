import React from "react";
import { ADMIN_WORKSPACES, canUseAdminRoute } from "../../lib/adminPortalAccess";
import "../../styles/adminWorkspaces.css";
export default function AdminWorkspaceNav({access, children, home = false, embedded = false}) {
  const links = ADMIN_WORKSPACES.filter(([,path]) => canUseAdminRoute(access,path));
  return <div className={`admin-workspaces${embedded?" admin-workspaces--embedded":""}`}>{!embedded&&<header className="admin-workspaces-header"><a href="/admin">BRL / Admin Portal</a><a href="/career">My Career ↗</a></header>}
    {home ? <main><h1>{embedded?"League workspaces":"Admin Portal"}</h1><p>Your assigned roles determine which workspaces are available. Each action keeps its existing league approval requirements.</p><nav className="admin-workspace-grid" aria-label="Admin workspaces">{links.filter(([,path])=>path!=="/admin").map(([label,path])=><a key={path} href={path}>{label}<span>Open workspace ↗</span></a>)}</nav></main> : <><details className="admin-workspace-menu"><summary>Admin workspaces</summary><nav aria-label="Admin workspaces">{links.map(([label,path])=><a key={path} href={path}>{label}</a>)}</nav></details>{children}</>}
  </div>;
}
