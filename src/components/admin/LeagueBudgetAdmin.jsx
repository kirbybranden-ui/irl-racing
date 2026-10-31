import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/leagueBudget.css";

const money = value => value == null ? "Not set" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value));
const names = { contracts: "Team manufacturer contracts", bonuses: "Requirement & performance bonuses", number_assistance: "Number lease assistance", reserve: "Contingency reserve", team_opening: "Team opening budgets", race_purses: "Race purses & prizes", sponsor_media: "Sponsor & media agreements", loans: "League loans issued", operations: "Other league expenses" };
const order = { contracts: 0, bonuses: 1, number_assistance: 2, team_opening: 0, race_purses: 1, sponsor_media: 2, loans: 3, operations: 4, reserve: 9 };
const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);
const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function LeagueBudgetAdmin({ activeSeasonId }) {
  const [data, setData] = useState(null), [error, setError] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState(null), [reason, setReason] = useState("");
  const load = useCallback(async () => {
    const { data: next, error: problem } = await supabase.rpc("brl_budget_read");
    if (problem) throw new Error(problem.message);
    return next;
  }, []);
  useEffect(() => {
    let live = true;
    setData(null); setDraft(null); setError("");
    const refresh = () => load().then(next => { if (live) { setData(next); setError(""); } }).catch(e => { if (live) setError(e.message); });
    refresh();
    window.addEventListener("brl:bank-state-changed", refresh);
    const timer = setInterval(refresh, 30000);
    return () => { live = false; clearInterval(timer); window.removeEventListener("brl:bank-state-changed", refresh); };
  }, [load, activeSeasonId]);

  async function refresh() {
    setBusy(true); setError("");
    try { setData(await load()); } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function initialize() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error: problem } = await supabase.rpc("brl_budget_initialize", { season_value: data.seasonId });
      if (problem) throw new Error(problem.message);
      setData(await load());
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  async function save(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setStatus("");
    try {
      const { error: problem } = await supabase.rpc("brl_budget_save", { season_value: data.seasonId, lines_value: draft.map(row => ({ department: row.department, category: row.category, amount: row.amount === "" ? null : Number(row.amount) })), note_value: reason });
      if (problem) throw new Error(problem.message);
      setDraft(null); setReason(""); setStatus("Season allowances saved. Cash balances were not changed."); setData(await load());
      window.dispatchEvent(new Event("brl:bank-state-changed"));
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function exportCsv() {
    const csv = [["Season", "Department", "Expense", "Budget", "Paid", "Committed unpaid", "Available to commit"], ...data.lines.map(row => [data.seasonId, row.department, names[row.category], row.amount, row.paid, row.committed, row.available])].map(row => row.map(quote).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "BRL-season-budget.csv"; anchor.click(); URL.revokeObjectURL(url);
  }
  const lines = data?.lines || [];
  const manufacturerLines = lines.filter(row => row.department !== "League");
  const missing = lines.some(row => row.amount == null);
  const over = lines.filter(row => row.available != null && Number(row.available) < 0);
  return <section className="brl-budget" aria-label="League season budget">
    <header className="budget-heading"><div><span className="budget-eyebrow">BUDWEISER RACING LEAGUE · ADMIN FINANCE</span><h2>League Budget</h2><p>League funds, season allowances and the commitments behind them.</p></div><div className="budget-actions"><button disabled={busy || !!draft} onClick={refresh}>Refresh</button><button disabled={!data || busy} onClick={exportCsv}>Export CSV</button></div></header>
    {error && <p className="budget-alert" role="alert">Budget could not be loaded or saved: {error}</p>}
    {status && <p role="status">{status}</p>}
    {!data && !error && <p role="status">Loading the league ledger…</p>}
    {data && <>
      <div className="budget-treasury"><div><span className="budget-eyebrow">LEAGUE TREASURY · CASH NOW</span><strong>{money(data.treasury)}</strong><p>Active season: {data.seasonId}. Cash rolls forward; the tables below show this season.</p></div><div><span>Unpaid commitments</span><b>{money(data.committed)}</b><span>Unallocated after remaining allowances</span><b className={Number(data.unallocated) < 0 ? "budget-negative" : ""}>{money(data.unallocated)}</b></div></div>
      <div className="budget-stats">{[[missing ? "League allowances set so far" : "Total league season budget", sum(lines, "amount")], ["All season costs paid", sum(lines, "paid")], ["Remaining allowances reserved", data.remainingAllowances], ["Cash after accepted commitments", Number(data.cash) - Number(data.committed)]].map(([label, value]) => <article key={label}><span>{label}</span><strong className={value < 0 ? "budget-negative" : ""}>{money(value)}</strong></article>)}</div>
      <div className="budget-stats">{[["Manufacturer season budget", sum(manufacturerLines, "amount")], ["Manufacturer costs paid", sum(manufacturerLines, "paid")], ["Manufacturer committed unpaid", sum(manufacturerLines, "committed")], ["Manufacturer available to commit", sum(manufacturerLines, "amount") - sum(manufacturerLines, "paid") - sum(manufacturerLines, "committed")]].map(([label, value]) => <article key={label}><span>{label}</span><strong className={value < 0 ? "budget-negative" : ""}>{money(value)}</strong></article>)}</div>
      {data.treasury == null && <p className="budget-alert">The league treasury account has not been prepared. No starting cash has been assumed.</p>}
      {Number(data.legacyManufacturerCash) !== 0 && <p className="budget-note">Existing manufacturer cash: {money(data.legacyManufacturerCash)}. Combined league-backed cash: {money(data.cash)}. Existing cash is used before additional treasury funding; internal transfers are excluded from cash-flow totals.</p>}
      {(missing || !lines.length) && <p className="budget-alert">League expense allowances still need to be set. The manufacturer allowance is not the complete league season budget.</p>}
      {!lines.length && data.isSuperAdmin && <button disabled={busy} onClick={initialize}>Prepare this season’s budget allowances</button>}
      {Number(data.unallocated) < 0 && <p className="budget-alert">Current league cash does not cover all remaining allowances. Funding shortfall: {money(-Number(data.unallocated))}.</p>}
      {!!over.length && <p className="budget-alert">{over.length} expense {over.length === 1 ? "category is" : "categories are"} over budget after paid costs and accepted commitments. Review the amounts below.</p>}
      <div className="budget-section-title"><div><h3>Season spending plan</h3><p>Budget − paid − committed unpaid = available to commit. Accepting a contract reserves its maximum remaining payout.</p></div>{data.isSuperAdmin && !draft && <button disabled={busy || !lines.length} onClick={() => { setDraft(lines.map(row => ({ ...row, amount: row.amount ?? "" }))); setReason(""); }}>Edit allowances</button>}</div>
      <form onSubmit={save}>
        {["Chevrolet", "Toyota", "Ford", "League"].map(department => {
          const rows = (draft || lines).filter(row => row.department === department).sort((a, b) => order[a.category] - order[b.category]);
          const current = lines.filter(row => row.department === department);
          return <article className="budget-program" key={department}><div className="budget-program-title"><h3>{department === "League" ? "Other league costs" : department}</h3><span>{rows.some(row => row.amount == null || row.amount === "") ? "Allowances incomplete" : `${money(sum(rows, "amount"))} season allowance`}</span></div><div className="budget-scroll"><table><caption className="budget-sr-only">{department} season budget</caption><thead><tr><th scope="col">Expense</th><th scope="col">Season budget</th><th scope="col">Paid</th><th scope="col">Committed unpaid</th><th scope="col">Available to commit</th></tr></thead><tbody>{rows.map(row => {
            const original = current.find(item => item.category === row.category);
            const available = row.amount === "" || row.amount == null ? null : Number(row.amount) - Number(original.paid) - Number(original.committed);
            return <tr key={row.category}><th scope="row">{names[row.category]}</th><td>{draft ? <input aria-label={`${department}: ${names[row.category]} allowance`} type="number" min="0" max="100000000" step="0.01" value={row.amount} onChange={e => setDraft(previous => previous.map(item => item.department === department && item.category === row.category ? { ...item, amount: e.target.value } : item))} /> : money(row.amount)}</td><td>{money(original.paid)}</td><td>{money(original.committed)}</td><td className={available != null && available < 0 ? "budget-negative" : ""}>{money(available)}</td></tr>;
          })}</tbody><tfoot><tr><th scope="row">Total</th><td>{rows.some(row => row.amount == null || row.amount === "") ? "Incomplete" : money(sum(rows, "amount"))}</td><td>{money(sum(current, "paid"))}</td><td>{money(sum(current, "committed"))}</td><td>{rows.some(row => row.amount == null || row.amount === "") ? "Not set" : money(sum(rows, "amount") - sum(current, "paid") - sum(current, "committed"))}</td></tr></tfoot></table></div></article>;
        })}
        {draft && <div className="budget-edit"><label>Reason for budget changes<textarea required minLength={8} value={reason} onChange={e => setReason(e.target.value)} /></label><p>Saving sets spending allowances. It does not add cash or pay a team. Changes are recorded in the admin audit log.</p><div className="budget-actions"><button disabled={busy} type="submit">{busy ? "Saving…" : "Save season allowances"}</button><button disabled={busy} type="button" onClick={() => setDraft(null)}>Cancel</button></div></div>}
      </form>
      <p className="budget-note">Remaining allowances reserve the greater of each category’s unspent budget or unpaid commitments, so commitments are counted once. Number assistance uses budget even when it offsets a fee returned to the league; cash flow shows the actual net movement. Taxes and loan repayments are treasury receipts.</p>
      <details className="budget-program"><summary>League cash flow by category · current season</summary><p>Net movement across treasury and existing manufacturer cash. Positive amounts are receipts; negative amounts are cash out. Transfers between those accounts cancel.</p><div className="budget-scroll"><table><thead><tr><th>Category</th><th>Net cash movement</th></tr></thead><tbody>{data.cashFlow.map(row => <tr key={row.category}><td>{row.category}</td><td className={Number(row.net) < 0 ? "budget-negative" : ""}>{money(row.net)}</td></tr>)}</tbody></table>{!data.cashFlow.length && <p>No season cash movements recorded.</p>}</div></details>
      <details className="budget-program"><summary>Accepted commitments · {data.obligations.length}</summary><div className="budget-scroll"><table><thead><tr><th>Department</th><th>Obligation</th><th>Remaining maximum</th></tr></thead><tbody>{data.obligations.map(row => <tr key={`${row.department}:${row.category}:${row.reference}`}><td>{row.department}</td><td>{row.description}</td><td>{money(row.amount)}</td></tr>)}</tbody></table>{!data.obligations.length && <p>No unpaid accepted commitments.</p>}</div></details>
      <details className="budget-program"><summary>Expense history · latest 250 records</summary><div className="budget-scroll"><table><thead><tr><th>Date</th><th>Department</th><th>Expense</th><th>Amount</th></tr></thead><tbody>{data.transactions.map(row => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString()}</td><td>{row.department}</td><td>{row.description}</td><td>{money(row.amount)}</td></tr>)}</tbody></table>{!data.transactions.length && <p>No season expenses recorded.</p>}</div></details>
    </>}
  </section>;
}
