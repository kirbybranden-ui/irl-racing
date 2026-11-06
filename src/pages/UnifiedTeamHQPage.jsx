import React, { useState } from "react";
import OwnersPage from "../OwnersPage.jsx";
import OwnerHQPage from "./OwnerHQPage.jsx";

/** Single owner workspace. Both historical URLs render this same page. */
export default function UnifiedTeamHQPage({ drivers, teams, teamBudgets, raceHistory, seasonName, tracks, paymentCompliance, onApplyTeamTransaction, go, PaymentCompliancePanel }) {
  const [section, setSection] = useState("management");
  const tabs = [
    { id: "management", label: "Contracts, Finances & Numbers" },
    { id: "operations", label: "Roster & Race Operations" },
  ];
  return (
    <main className="brl-unified-team-hq">
      <header style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 20px 6px" }}>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7 }}>Budweiser Racing League</div>
        <h1 style={{ margin: "4px 0 8px" }}>Team HQ</h1>
        <p style={{ margin: "0 0 16px", opacity: 0.8 }}>One workspace for team management, contracts, finances, numbers, and race operations.</p>
        <nav aria-label="Team HQ sections" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {tabs.map(tab => (
            <button key={tab.id} type="button" aria-current={section === tab.id ? "page" : undefined}
              onClick={() => setSection(tab.id)}
              style={{ borderRadius: 999, padding: "11px 18px", fontWeight: 750, cursor: "pointer", border: section === tab.id ? "1px solid #c8102e" : "1px solid #626977", background: section === tab.id ? "#c8102e" : "transparent", color: section === tab.id ? "#fff" : "inherit" }}>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>
      <div hidden={section !== "management"}>
        <OwnersPage drivers={drivers} teams={teams} teamBudgets={teamBudgets} raceHistory={raceHistory}
          seasonName={seasonName} tracks={tracks} paymentCompliance={paymentCompliance}
          onApplyTeamTransaction={onApplyTeamTransaction} />
        {PaymentCompliancePanel && <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px 20px" }}><PaymentCompliancePanel mode="team" /></div>}
      </div>
      {section === "operations" && <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px 20px" }}>
        <OwnerHQPage drivers={drivers} teams={teams} seasonName={seasonName} tracks={tracks} go={go} />
      </div>}
    </main>
  );
}
