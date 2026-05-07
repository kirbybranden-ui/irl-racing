import React, { useEffect, useMemo, useState } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoBOM from "./assets/teams/BOM.png";
import teamLogoWSM from "./assets/teams/WSM.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import manufacturerChevrolet from "./assets/manufacturers/chevrolet.png";
import manufacturerFord from "./assets/manufacturers/ford.png";
import manufacturerToyota from "./assets/manufacturers/toyota.png";
import { supabase } from "./lib/supabase";

const teamLogos = {
  JAM: teamLogoJAM,
  "JA MOTORSPORTS": teamLogoJAM,
  MER: teamLogoMER,
  "ME RACING": teamLogoMER,
  NLM: teamLogoNLM,
  "Nine Line Motorsports": teamLogoNLM,
  MMS: teamLogoMMS,
  BOM: teamLogoBOM,
  WSM: teamLogoWSM,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
};

const manufacturerLogos = {
  Chevrolet: manufacturerChevrolet,
  Ford: manufacturerFord,
  Toyota: manufacturerToyota,
};

const teamFullNames = {
  JAM: "JA Motorsports",
  "JA MOTORSPORTS": "JA Motorsports",
  MER: "ME Racing",
  "ME RACING": "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt Sick6 Motorsports",
  IND: "Independent",
  Independent: "Independent",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
};

const appShellStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
};
const pageContainerStyle = { maxWidth: 1320, margin: "0 auto", padding: 24 };
const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 20,
  padding: 20,
  marginBottom: 20,
  boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
};
const primaryButtonStyle = {
  background: "#d4af37",
  color: "#111",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 900,
  cursor: "pointer",
};
const secondaryButtonStyle = {
  background: "#2a3140",
  color: "white",
  border: "1px solid #3d4859",
  borderRadius: 10,
  padding: "10px 16px",
  fontWeight: 800,
  cursor: "pointer",
};
const inputStyle = {
  width: "100%",
  background: "#0f1319",
  color: "white",
  border: "1px solid #313947",
  borderRadius: 10,
  padding: "10px 12px",
  boxSizing: "border-box",
};
const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid #313947",
  background: "#10141b",
  fontSize: 12,
  letterSpacing: 0.4,
};
const tdStyle = {
  padding: 10,
  borderBottom: "1px solid #252c38",
  verticalAlign: "top",
  fontSize: 13,
};

function getTeamFullName(team) {
  return teamFullNames[team] || team || "Independent";
}

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function getDriverNumberFromPath() {
  if (typeof window === "undefined") return "";
  const raw = window.location.pathname.replace(/^\/driver\//i, "").split("/")[0] || "";
  return decodeURIComponent(raw);
}

function getRaceFinish(result) {
  return Number(result?.finishPos || result?.finish || result?.position || 0) || null;
}

function getDriverRaceRows(driver, raceHistory = []) {
  if (!driver) return [];
  return (raceHistory || [])
    .map((race) => {
      const result = (race.results || []).find((item) => Number(item.driverId) === Number(driver.id));
      if (!result) return null;
      return {
        raceName: race.raceName,
        date: race.date || race.raceDate || "",
        finish: getRaceFinish(result),
        stage1: result.stage1Finish || result.stage1 || "—",
        stage2: result.stage2Finish || result.stage2 || "—",
        stage3: result.stage3Finish || result.stage3 || "—",
        points: Number(result.totalRacePoints || result.points || 0),
        dnf: Boolean(result.dnf),
        offense: Boolean(result.offense),
        fastestLap: Boolean(result.fastestLap),
      };
    })
    .filter(Boolean)
    .reverse();
}

function StatCard({ label, value, accent = "white" }) {
  return (
    <div style={{ background: "#131922", border: "1px solid #2d3643", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6, fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent }}>{value}</div>
    </div>
  );
}

export default function DriverProfilePage({
  driver: driverProp = null,
  drivers = [],
  activeSeason = null,
  seasons = [],
  raceHistory: raceHistoryProp = [],
  teams = [],
  standings = [],
  manufacturers = [],
  manufacturerStandings = [],
  seasonName = "",
}) {
  const driverNumberFromPath = getDriverNumberFromPath();
  const activeDrivers = activeSeason?.drivers || drivers || [];
  const raceHistory = raceHistoryProp?.length ? raceHistoryProp : activeSeason?.raceHistory || [];

  const sortedDrivers = useMemo(() => {
    return [...(standings?.length ? standings : activeDrivers)].sort(
      (a, b) => (b.points || 0) - (a.points || 0) || (b.wins || 0) - (a.wins || 0) || String(a.name || "").localeCompare(String(b.name || ""))
    );
  }, [activeDrivers, standings]);

  const driver = useMemo(() => {
    if (driverProp) return driverProp;
    return activeDrivers.find((item) => String(item.number) === String(driverNumberFromPath)) || null;
  }, [driverProp, activeDrivers, driverNumberFromPath]);

  const driverRank = driver ? sortedDrivers.findIndex((item) => Number(item.id) === Number(driver.id)) + 1 : 0;
  const raceRows = useMemo(() => getDriverRaceRows(driver, raceHistory), [driver, raceHistory]);
  const avgFinish = raceRows.length
    ? (raceRows.reduce((sum, row) => sum + (row.finish || 0), 0) / raceRows.length).toFixed(1)
    : "—";
  const recentBest = raceRows.length ? Math.min(...raceRows.map((row) => row.finish || 99)) : "—";
  const teamName = getTeamFullName(driver?.team);
  const teamLogo = teamLogos[driver?.team] || teamLogos[teamName] || teamLogoIND;
  const manufacturerLogo = manufacturerLogos[driver?.manufacturer] || null;

  const [offers, setOffers] = useState([]);
  const [offerMessage, setOfferMessage] = useState("");
  const [offerError, setOfferError] = useState("");
  const [counterForms, setCounterForms] = useState({});

  async function loadContractOffers() {
    if (!driver) return;
    const { data, error } = await supabase
      .from("contract_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load contract offers:", error);
      setOffers([]);
      return;
    }

    const myOffers = (data || []).filter((offer) => {
      const sameName = normalize(offer.driver_name) === normalize(driver.name);
      const sameNumber = String(offer.driver_number || "") === String(driver.number || "");
      return sameName || sameNumber;
    });
    setOffers(myOffers);
  }

  useEffect(() => {
    loadContractOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driver?.id, driver?.number, driver?.name]);

  function setCounterField(offerId, field, value) {
    setCounterForms((current) => ({
      ...current,
      [offerId]: {
        salary: current[offerId]?.salary || "",
        bonus: current[offerId]?.bonus || "",
        length: current[offerId]?.length || "",
        buyout: current[offerId]?.buyout || "",
        notes: current[offerId]?.notes || "",
        ...current[offerId],
        [field]: value,
      },
    }));
  }

  async function updateOfferStatus(offer, status) {
    setOfferMessage("");
    setOfferError("");
    const { error } = await supabase
      .from("contract_offers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", offer.id);

    if (error) {
      console.error("Failed to update offer:", error);
      setOfferError("Could not update this contract offer. Check contract_offers RLS update policy.");
      return;
    }

    setOfferMessage(`Contract offer ${status.toLowerCase()}.`);
    await loadContractOffers();
  }

  async function submitCounterOffer(offer) {
    setOfferMessage("");
    setOfferError("");
    const form = counterForms[offer.id] || {};
    const counterSalary = Number(form.salary || offer.salary || 0);
    const counterBonus = Number(form.bonus || offer.signing_bonus || 0);
    const counterLength = Number(form.length || offer.contract_length || 1);
    const counterBuyout = Number(form.buyout || offer.buyout_amount || 0);

    if (counterSalary < 250000) {
      setOfferError("Counter salary must be at least $250,000.");
      return;
    }
    if (counterLength < 1) {
      setOfferError("Counter contract length must be at least 1 season.");
      return;
    }
    if (counterBuyout > counterSalary * 1.5) {
      setOfferError("Counter buyout cannot exceed 1.5x the salary.");
      return;
    }

    const { error } = await supabase
      .from("contract_offers")
      .update({
        status: "Countered",
        counter_salary: counterSalary,
        counter_bonus: counterBonus,
        counter_contract_length: counterLength,
        counter_buyout_amount: counterBuyout,
        counter_notes: form.notes || "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.id);

    if (error) {
      console.error("Failed to send counter offer:", error);
      setOfferError("Failed to send counter offer. Check contract_offers counter columns and RLS update policy.");
      return;
    }

    setOfferMessage("Counter offer sent to the team owner.");
    await loadContractOffers();
  }

  if (!driver) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <h1 style={{ marginTop: 0 }}>Driver Not Found</h1>
            <p style={{ opacity: 0.75 }}>No driver was found for #{driverNumberFromPath}.</p>
            <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>Back to Standings</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", borderColor: "#d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 13, opacity: 0.68, fontWeight: 900 }}>{seasonName || activeSeason?.name || "Active Season"}</div>
                <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>Driver Profile</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>Standings</button>
              <button onClick={() => (window.location.pathname = "/news")} style={secondaryButtonStyle}>News</button>
            </div>
          </div>
        </div>

        <div style={{ ...sectionCardStyle, overflow: "hidden", position: "relative", background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)" }}>
          <div style={{ position: "absolute", right: -60, top: -70, width: 230, height: 230, borderRadius: "50%", background: "rgba(212,175,55,0.08)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 18, alignItems: "center" }}>
            <div style={{ width: 112, height: 112, borderRadius: 24, background: "#0f1319", border: "1px solid #2c3440", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 42, fontWeight: 900, color: "#d4af37" }}>
              #{driver.number}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                {teamLogo && <img src={teamLogo} alt={teamName} style={{ height: 42, maxWidth: 72, objectFit: "contain" }} />}
                {manufacturerLogo && <img src={manufacturerLogo} alt={driver.manufacturer} style={{ height: 34, maxWidth: 80, objectFit: "contain" }} />}
              </div>
              <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.05 }}>{driver.name}</div>
              <div style={{ opacity: 0.76, fontSize: 16, marginTop: 8 }}>{teamName} · {driver.manufacturer || "Manufacturer TBD"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, opacity: 0.65, fontWeight: 900 }}>STANDINGS RANK</div>
              <div style={{ fontSize: 42, fontWeight: 900, color: "#d4af37" }}>{driverRank ? `P${driverRank}` : "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
          <StatCard label="Points" value={driver.points || 0} accent="#d4af37" />
          <StatCard label="Wins" value={driver.wins || 0} />
          <StatCard label="Top 3" value={driver.top3 || 0} />
          <StatCard label="Top 5" value={driver.top5 || 0} />
          <StatCard label="DNFs" value={driver.dnfs || 0} accent={(driver.dnfs || 0) > 0 ? "#f87171" : "white"} />
          <StatCard label="Avg Finish" value={avgFinish} />
          <StatCard label="Best Recent Finish" value={recentBest === "—" ? "—" : `P${recentBest}`} />
          <StatCard label="Starts" value={raceRows.length} />
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Contract Offers</h2>
          {offerError && <div style={{ color: "#f87171", fontWeight: 900, marginBottom: 12 }}>{offerError}</div>}
          {offerMessage && <div style={{ color: "#4ade80", fontWeight: 900, marginBottom: 12 }}>{offerMessage}</div>}
          {offers.length === 0 ? (
            <div style={{ opacity: 0.72 }}>No contract offers found for this driver.</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {offers.map((offer) => {
                const canRespond = ["Pending", "Countered"].includes(String(offer.status || ""));
                return (
                  <div key={offer.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{offer.team || offer.created_by_team || "Team Offer"}</div>
                        <div style={{ opacity: 0.7, fontSize: 13 }}>Status: <strong>{offer.status || "Pending"}</strong></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, opacity: 0.65 }}>SALARY</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#d4af37" }}>{money(offer.salary)}</div>
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, fontSize: 13 }}>
                      <div><strong>Signing Bonus:</strong> {money(offer.signing_bonus)}</div>
                      <div><strong>Length:</strong> {offer.contract_length || 1} season{Number(offer.contract_length) === 1 ? "" : "s"}</div>
                      <div><strong>Buyout:</strong> {money(offer.buyout_amount)}</div>
                      <div><strong>Brand Style:</strong> {offer.brand_style || "—"}</div>
                    </div>
                    {offer.media_requirements && (
                      <div style={{ marginTop: 12, lineHeight: 1.5 }}>
                        <strong>Media Requirements / Brand Conduct:</strong>
                        <div style={{ whiteSpace: "pre-wrap", opacity: 0.82, marginTop: 6 }}>{offer.media_requirements}</div>
                      </div>
                    )}
                    {offer.notes && <div style={{ marginTop: 12, opacity: 0.82, lineHeight: 1.5 }}><strong>Notes:</strong> {offer.notes}</div>}

                    {canRespond && (
                      <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: 10, marginTop: 14 }}>
                          <input placeholder="Counter salary" type="number" style={inputStyle} value={counterForms[offer.id]?.salary || ""} onChange={(event) => setCounterField(offer.id, "salary", event.target.value)} />
                          <input placeholder="Counter bonus" type="number" style={inputStyle} value={counterForms[offer.id]?.bonus || ""} onChange={(event) => setCounterField(offer.id, "bonus", event.target.value)} />
                          <input placeholder="Counter length" type="number" style={inputStyle} value={counterForms[offer.id]?.length || ""} onChange={(event) => setCounterField(offer.id, "length", event.target.value)} />
                          <input placeholder="Counter buyout" type="number" style={inputStyle} value={counterForms[offer.id]?.buyout || ""} onChange={(event) => setCounterField(offer.id, "buyout", event.target.value)} />
                        </div>
                        <textarea placeholder="Counter notes" style={{ ...inputStyle, minHeight: 70, marginTop: 10, resize: "vertical" }} value={counterForms[offer.id]?.notes || ""} onChange={(event) => setCounterField(offer.id, "notes", event.target.value)} />
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                          <button onClick={() => updateOfferStatus(offer, "Accepted")} style={primaryButtonStyle}>Accept Offer</button>
                          <button onClick={() => submitCounterOffer(offer)} style={secondaryButtonStyle}>Send Counter Offer</button>
                          <button onClick={() => updateOfferStatus(offer, "Declined")} style={{ ...secondaryButtonStyle, background: "#7f1d1d", border: "1px solid #991b1b" }}>Decline</button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Race History</h2>
          {raceRows.length === 0 ? (
            <div style={{ opacity: 0.72 }}>No race results found for this driver yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Race</th>
                    <th style={thStyle}>Finish</th>
                    <th style={thStyle}>Stage 1</th>
                    <th style={thStyle}>Stage 2</th>
                    <th style={thStyle}>Stage 3</th>
                    <th style={thStyle}>Points</th>
                    <th style={thStyle}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {raceRows.map((row, index) => (
                    <tr key={`${row.raceName}-${index}`}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{row.raceName}</td>
                      <td style={tdStyle}>{row.finish ? `P${row.finish}` : "—"}</td>
                      <td style={tdStyle}>{row.stage1}</td>
                      <td style={tdStyle}>{row.stage2}</td>
                      <td style={tdStyle}>{row.stage3}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>{row.points}</td>
                      <td style={tdStyle}>{[row.dnf ? "DNF" : "", row.offense ? "Penalty" : "", row.fastestLap ? "Fastest Lap" : ""].filter(Boolean).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
