import React from "react";
import { money } from "../../lib/career";
import "../../styles/ownerFinancial.css";

/** Safe owner view: never exposes management actions while an overdue bill exists. */
export default function OwnerFinancialSuspension({ status, payments = [], busy, onPay, onRefresh, error }) {
  const overdue = (status?.overdueBills || []).map(b => ({
    ...b,
    id: b.id || b.payment_id,
    amount: Number(b.amount || 0),
    paid: Number(b.paid || 0),
  }));
  const paymentRows = payments.filter(p => p.status === "scheduled" && Number(p.amount) > Number(p.paid) && new Date(p.due_at).getTime() < Date.now());
  const rows = paymentRows.length ? paymentRows : overdue;
  return <main className="career">
    <section className="brl-financial-suspension" role="alert" aria-labelledby="brl-finance-suspension-title">
      <p className="brl-season-start__eyebrow">Owner HQ · Financial restriction</p>
      <h2 id="brl-finance-suspension-title">Owner management temporarily suspended</h2>
      <p>Your team has overdue financial obligations. Team management actions are restricted until all overdue bills are paid. You can still view these obligations, pay them manually, access My Career as a driver, and manage your account.</p>
      <p><strong>{status?.overdueCount ?? rows.length} overdue obligation(s)</strong> · Outstanding total: <strong>{money(status?.overdueTotal ?? rows.reduce((sum,p)=>sum+Number(p.amount||0)-Number(p.paid||0),0))}</strong></p>
      <table className="brl-financial-suspension__bills"><thead><tr><th>Team / obligation</th><th>Due</th><th>Unpaid</th><th>Action</th></tr></thead><tbody>
        {rows.map((p,index) => <tr key={p.id || index}><td>{p.team || "Team"} · {p.description || "Scheduled bill"}</td><td>{p.due_at ? new Date(p.due_at).toLocaleString() : "Overdue"}</td><td>{money(p.unpaid != null ? Number(p.unpaid) : Number(p.amount||0)-Number(p.paid||0))}</td><td>{p.id ? <button disabled={busy} onClick={()=>onPay(p.id)}>Pay manually</button> : <span>Open Driver payments to review</span>}</td></tr>)}
      </tbody></table>
      <p><strong>Emergency assistance:</strong> An overdue owner must pay 20% of the overdue obligation from existing eligible funds before the remaining amount can qualify for an automatic emergency loan. The emergency-loan submission workflow is not yet available in this version of the app; contact league administration. No loan is issued by this screen.</p>
      {error && <p role="alert" className="brl-financial-suspension__error">{error}</p>}
      <div className="brl-financial-suspension__links"><button disabled={busy} onClick={onRefresh}>Refresh financial status</button><a href="/career">Continue to My Career (driver access)</a><a href="/login">Account / sign-in</a></div>
    </section>
  </main>;
}
