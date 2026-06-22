import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import { getTeamFullName } from "../data/teams";
import {
  INDEPENDENT_DRIVER_BASE_SALARY,
  LEAGUE_BANK_NAME,
} from "../data/appConfig";
import {
  dedupeDriversByNumber,
  isInactivePlaceholderDriver,
} from "../utils/driverHelpers";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  inputStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from "../styles/sharedStyles";

export default function ContractsPage({ drivers = [] }) {
  const [contracts, setContracts] = useState([]);
  const [independentPayments, setIndependentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [payingDriverNumber, setPayingDriverNumber] = useState(null);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");

  const formatMoney = (value) => {
    const safe = Number(value) || 0;
    return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  };

  const activeRoster = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver));
  }, [drivers]);

  const independentDrivers = useMemo(() => {
    return activeRoster
      .filter((driver) => String(driver.team || "").trim().toLowerCase() === "independent")
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [activeRoster]);

  async function loadContracts() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contract_offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load active contracts:", error);
      setError(error.message || "Could not load active contracts.");
      setContracts([]);
      setLoading(false);
      return;
    }

    const signedContracts = (data || []).filter((contract) => {
      const status = String(contract.status || "").trim().toLowerCase();
      return ["accepted", "active", "signed"].includes(status);
    });

    const byDriver = new Map();
    signedContracts.forEach((contract) => {
      const numberKey = String(contract.driver_number || "").trim();
      const nameKey = String(contract.driver_name || "").trim().toLowerCase();
      const key = numberKey || nameKey;
      if (!key) return;

      const existing = byDriver.get(key);
      if (!existing) {
        byDriver.set(key, contract);
        return;
      }

      const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
      const nextTime = new Date(contract.updated_at || contract.created_at || 0).getTime();
      if (nextTime >= existingTime) byDriver.set(key, contract);
    });

    setContracts(Array.from(byDriver.values()));
    setError("");
    setLoading(false);
  }

  async function loadIndependentPayments() {
    setPaymentsLoading(true);
    const { data, error } = await supabase
      .from("team_payments")
      .select("*")
      .eq("payment_type", "Independent Driver Base Salary")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load independent driver payments:", error);
      setPaymentError(error.message || "Could not load independent driver payments.");
      setIndependentPayments([]);
      setPaymentsLoading(false);
      return;
    }

    setIndependentPayments(data || []);
    setPaymentError("");
    setPaymentsLoading(false);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      await loadContracts();
      if (isMounted) await loadIndependentPayments();
    }

    loadAll();
    const interval = setInterval(loadAll, 10000);
    return () => {
      isMounted = false;
    };
  }, []);

  async function payIndependentDriver(driver) {
    if (!driver) return;

    const driverNumber = Number(driver.number);
    setPayingDriverNumber(driverNumber);
    setPaymentError("");

    const { error } = await supabase.from("team_payments").insert({
      driver_number: driverNumber,
      driver_name: driver.name,
      team_name: "Independent",
      paid_by: LEAGUE_BANK_NAME,
      payment_type: "Independent Driver Base Salary",
      amount: INDEPENDENT_DRIVER_BASE_SALARY,
      created_at: new Date().toISOString(),
    });

    setPayingDriverNumber(null);

    if (error) {
      console.error("Could not pay independent driver:", error);
      setPaymentError(error.message || "Could not pay independent driver. Check the team_payments table and RLS policies.");
      alert("Could not pay independent driver. Check the team_payments table and RLS policies.");
      return;
    }

    await loadIndependentPayments();
    alert(`${driver.name} has been paid ${formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)} from ${LEAGUE_BANK_NAME}.`);
  }

  const latestPaymentByDriver = useMemo(() => {
    const byDriver = new Map();
    (independentPayments || []).forEach((payment) => {
      const key = String(payment.driver_number || "").trim() || String(payment.driver_name || "").trim().toLowerCase();
      if (!key) return;
      const existing = byDriver.get(key);
      if (!existing) {
        byDriver.set(key, payment);
        return;
      }
      const existingTime = new Date(existing.created_at || 0).getTime();
      const nextTime = new Date(payment.created_at || 0).getTime();
      if (nextTime >= existingTime) byDriver.set(key, payment);
    });
    return byDriver;
  }, [independentPayments]);

  const contractedDriverNumbers = new Set(
    contracts.map((contract) => String(contract.driver_number || "").trim()).filter(Boolean)
  );

  const contractedDriverNames = new Set(
    contracts.map((contract) => String(contract.driver_name || "").trim().toLowerCase()).filter(Boolean)
  );

  const uncontractedDrivers = activeRoster
    .filter((driver) => {
      const numberKey = String(driver.number || "").trim();
      const nameKey = String(driver.name || "").trim().toLowerCase();
      return !contractedDriverNumbers.has(numberKey) && !contractedDriverNames.has(nameKey);
    })
    .sort((a, b) => {
      const teamCompare = getTeamFullName(a.team || "Independent").localeCompare(getTeamFullName(b.team || "Independent"));
      if (teamCompare !== 0) return teamCompare;
      return Number(a.number || 9999) - Number(b.number || 9999);
    });

  const totalIndependentPayroll = independentDrivers.length * INDEPENDENT_DRIVER_BASE_SALARY;
  const totalIndependentPaid = (independentPayments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <img src={logo} alt="League Logo" style={{ height: 58 }} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 0.5 }}>Active Contracts</div>
                <div style={{ opacity: 0.7, marginTop: 4 }}>Official Budweiser Cup League contract board</div>
              </div>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={primaryButtonStyle}>
              Back to Standings
            </button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>LEAGUE-FUNDED INDEPENDENTS</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Independent Driver Base Salary</h2>
              <div style={{ opacity: 0.72, marginTop: 6 }}>
                Independent drivers are paid by {LEAGUE_BANK_NAME}, not by a team owner budget.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>BASE SALARY</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)}</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>SEASON PAYROLL</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(totalIndependentPayroll)}</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
                <div style={{ fontSize: 11, opacity: 0.65 }}>PAYMENTS LOGGED</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{formatMoney(totalIndependentPaid)}</div>
              </div>
            </div>
          </div>

          {paymentError && (
            <div style={{ background: "#2a1212", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 14, padding: 14, fontWeight: 800, marginBottom: 14 }}>
              Payment error: {paymentError}
            </div>
          )}

          {independentDrivers.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              No independent drivers are currently listed on the active roster.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Paid By</th>
                    <th style={thStyle}>Base Salary</th>
                    <th style={thStyle}>Last Paid</th>
                    <th style={thStyle}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {independentDrivers.map((driver) => {
                    const lastPayment = latestPaymentByDriver.get(String(driver.number || "").trim());
                    return (
                      <tr key={`independent-pay-${driver.id || driver.number}`}>
                        <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                        <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                        <td style={tdStyle}>{LEAGUE_BANK_NAME}</td>
                        <td style={tdStyle}>{formatMoney(INDEPENDENT_DRIVER_BASE_SALARY)}</td>
                        <td style={tdStyle}>
                          {paymentsLoading ? "Loading..." : lastPayment?.created_at ? new Date(lastPayment.created_at).toLocaleDateString() : "Not paid yet"}
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => payIndependentDriver(driver)}
                            style={primaryButtonStyle}
                            disabled={payingDriverNumber === Number(driver.number)}
                          >
                            {payingDriverNumber === Number(driver.number) ? "Paying..." : "Pay Base Salary"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>SIGNED / ACCEPTED DEALS</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Active Driver Contracts</h2>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.65 }}>ACTIVE DEALS</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{contracts.length}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>Loading active contracts...</div>
          ) : error ? (
            <div style={{ background: "#2a1212", border: "1px solid #7f1d1d", color: "#fecaca", borderRadius: 14, padding: 14, fontWeight: 800 }}>
              Could not load active contracts: {error}
            </div>
          ) : contracts.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              No active contracts found yet. Accepted, active, and signed contract rows will show here.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Salary</th>
                    <th style={thStyle}>Signing Bonus</th>
                    <th style={thStyle}>Length</th>
                    <th style={thStyle}>Buyout</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => {
                    const driver = activeRoster.find((d) => {
                      const numberMatch = String(d.number || "") === String(contract.driver_number || "");
                      const nameMatch = String(d.name || "").trim().toLowerCase() === String(contract.driver_name || "").trim().toLowerCase();
                      return numberMatch || nameMatch;
                    });

                    return (
                      <tr key={contract.id}>
                        <td style={{ ...tdStyle, fontWeight: 900 }}>#{contract.driver_number || driver?.number || "—"} {contract.driver_name || driver?.name || "Unknown Driver"}</td>
                        <td style={tdStyle}>{getTeamFullName(contract.team || contract.team_name || contract.created_by_team || driver?.team || "Independent")}</td>
                        <td style={tdStyle}>{contract.manufacturer || driver?.manufacturer || "—"}</td>
                        <td style={tdStyle}>{formatMoney(contract.salary)}</td>
                        <td style={tdStyle}>{formatMoney(contract.signing_bonus)}</td>
                        <td style={tdStyle}>{contract.contract_length || contract.length || "—"} season{Number(contract.contract_length || contract.length) === 1 ? "" : "s"}</td>
                        <td style={tdStyle}>{formatMoney(contract.buyout_amount || contract.buyout)}</td>
                        <td style={{ ...tdStyle, fontWeight: 900, color: "#4ade80" }}>{contract.status || "Signed"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#d4af37", letterSpacing: 1 }}>FREE AGENTS / NO ACTIVE DEAL</div>
              <h2 style={{ margin: "6px 0 0", fontSize: 28 }}>Drivers Without Active Contracts</h2>
            </div>
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: "12px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 11, opacity: 0.65 }}>UNSIGNED</div>
              <div style={{ fontSize: 26, fontWeight: 900 }}>{uncontractedDrivers.length}</div>
            </div>
          </div>

          {uncontractedDrivers.length === 0 ? (
            <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14, opacity: 0.78 }}>
              Every active driver currently has an active contract.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Driver</th>
                    <th style={thStyle}>Team</th>
                    <th style={thStyle}>Manufacturer</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {uncontractedDrivers.map((driver) => (
                    <tr key={driver.id || driver.number}>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>#{driver.number} {driver.name}</td>
                      <td style={tdStyle}>{getTeamFullName(driver.team || "Independent")}</td>
                      <td style={tdStyle}>{driver.manufacturer || "—"}</td>
                      <td style={{ ...tdStyle, color: "#fbbf24", fontWeight: 900 }}>No active contract</td>
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


const PAINT_SCHEME_WEEKLY_TEAM_PAYOUT_CAP = 150000;
const PAINT_SCHEME_SEASON_TEAM_PAYOUT_CAP = 750000;
