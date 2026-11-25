import {careerWorkspaceData} from "../../lib/careerWorkspace";
import { supabase } from "../../lib/supabase";
import OwnerFinancialSuspension from "../../components/career/OwnerFinancialSuspension";
import NumberLeaseAdmin from "../../components/admin/NumberLeaseAdmin";
import { ManufacturerAppointments } from "../../components/career/TeamFunding";
import AppealsWorkspace from "../../components/appeals/AppealsWorkspace";
import { useTeamTheme } from "../../lib/useTeamTheme";
import { careerTeamCode } from "../../lib/teamTheme";
import "../../styles/teamTheme.css";
import TeamBuilder, { OwnerBuildNotice } from "../../components/career/TeamBuilder";
import MemberStreamSettings from "../../components/streams/MemberStreamSettings";
import JoinDate from "../../components/career/JoinDate";
import { OwnerCharterRequest } from "../../components/career/CharterControls";
import NumberLeaseCenter from "../../components/career/NumberLeaseCenter";
import DriverCareerSummary from "../../components/career/DriverCareerSummary";
import { FundingCenter, BudgetCenter, LoanRepayments, LoanApproval } from "../../components/career/TeamFunding";
import TeamCostBreakdown from "../../components/career/TeamCostBreakdown";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { careerAction, careerRead, changeCareerPassword, makeCareerSchedule, money } from "../../lib/career";
import { logoutOfLeague } from "../../lib/leagueAuth";
import ContractDocument, { FundingDocument, SignForm } from "../../components/career/ContractDocument";
import "../../styles/career.css";
const isAbaChampion = (gamertag, policyGamertag) => {
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ["abajack91"].some(name => name && normalize(gamertag) === normalize(name));
};
const championIdentity = (driverUser, data) => isAbaChampion((data.members || []).find(m => m.user_id === driverUser)?.gamertag);
const contractSalaryError = ({ salary, role, champion }) => {
  if (salary === "" || salary === null || salary === undefined || !Number.isFinite(Number(salary))) return "Enter the driver's base salary before submitting the contract.";
  const amount = Number(salary);
  const floor = champion ? 1000000 : role === "owner" ? 500000 : role === "franchise" ? 750000 : 250000;
  if (amount < floor) return champion
    ? `ABA is the defending champion and must receive a minimum base salary of ${money(floor)}. You entered ${money(amount)}.`
    : `This ${role === "owner" ? "owner-driver" : role === "franchise" ? "franchise driver" : "driver"} requires a minimum base salary of ${money(floor)}. You entered ${money(amount)}.`;
  if (amount > 100000000) return "Base salary cannot exceed $100,000,000.";
  return "";
};
const dateToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dateAfter = days => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
function Badge({ value }) { return <span className={`career-badge ${["active", "approved", "completed", "paid", "funded"].includes(value) ? "career-badge--ready" : ""}`}>{String(value || "pending").replaceAll("_", " ")}</span>; }
function Review({ onSubmit, options = [["approve", "Approve"], ["reject", "Reject"]], busy, verification = false }) {
  const [decision, setDecision] = useState(options[0][0]), [note, setNote] = useState(""), [verified, setVerified] = useState(false);
  return <form className="career-form career-review" onSubmit={e => { e.preventDefault();onSubmit({ decision, note, verified }); }}><label>Decision<select value={decision} onChange={e => setDecision(e.target.value)}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Review / verification notes<textarea required minLength={5} value={note} onChange={e => setNote(e.target.value)} /></label>{verification && <label className="career-check"><input type="checkbox" checked={verified} onChange={e => setVerified(e.target.checked)} /><span>I verified the evidence and all terms required for this payment.</span></label>}<button disabled={busy}>Submit decision</button></form>;
}
export function OfferForm({ draft, data, onSave, onClose, busy }) {
  const initial = draft.prior?.terms || {};
  const ownerPayroll = draft.ownerPayroll || initial.existingOwnerPayroll;
  const ownerManagement = draft.management || initial.ownerManagement;
  const initialDriver=draft.prior?.driver_user || (ownerPayroll ? data.teams.find(t=>t.id===draft.teamId)?.owner_user : data.requests.find(r=>r.id===draft.requestId)?.driver_user);
  const initialChampion=isAbaChampion(data.members.find(m=>m.user_id===initialDriver)?.gamertag,data.fundingPolicy?.champion_gamertag);
  // Existing franchise designations remain the default, but owners must be
  // able to designate the team's funded franchise seat on a new offer.
  const priorFranchise = (data.contracts || []).some(c =>
    c.driver_user === initialDriver && c.team_id === (draft.teamId || draft.prior?.team_id) && c.terms?.driverRole === "franchise");
  const [f, setF] = useState({ teamId: draft.teamId || draft.prior?.team_id || "", requestId: draft.requestId || "", number: initial.number || draft.number || "", driverRole: initial.driverRole || (initialChampion || priorFranchise ? "franchise" : "driver"), salary: initial.salary ?? (ownerPayroll ? 500000 : draft.independent ? 0 : ""), bonus: initial.bonus || 0, buyout: initial.buyout ?? (draft.independent || ownerPayroll ? 0 : ""), seasons: initial.seasons || 1, startsOn: initial.startsOn || dateToday(), endsOn: initial.endsOn || dateAfter(365), scheduleType: initial.scheduleType || "three", firstPayment: initial.schedule?.[0]?.due_at?.slice(0, 10) || dateToday(), paymentCount: initial.schedule?.length || 20, mediaRequirements: initial.mediaRequirements || "Complete all required pre-race and post-race interviews by league deadlines. Submit dated evidence to the owner for review. No separate interview bonus is earned.", manufacturerRequirements: initial.manufacturerRequirements || "Race the team-approved manufacturer and vehicle. Display required manufacturer branding and avoid competing manufacturer promotions without prior written approval.", sponsorRequirements: initial.sponsorRequirements || "Use the owner-approved sponsor scheme on the agreed race dates, retain required logo placement, and submit dated paint/promotion evidence. Conflicting sponsors require prior written approval. Specific sponsors and dates must be listed here before signing.", message: "" });
  const [validationError, setValidationError] = useState("");
  const [submissionState, setSubmissionState] = useState("idle");
  const submitLock = useRef(false);
  const feedbackRef = useRef(null);
  const update = (key, value) => { setValidationError("");setSubmissionState("idle");setF(current => ({ ...current, [key]: value })); };
  const teams = data.teams.filter(t => t.owner_user === data.me.user_id || data.isSuperAdmin);
  const team = data.teams.find(t => t.id === f.teamId), independent = team?.tier === "independent";
  const numbers = ownerPayroll ? (data.ownerPayrollSeats || []).filter(n=>n.teamId===f.teamId).map(n=>({...n,id:n.teamId})) : data.numbers.filter(n => n.team_id === f.teamId && n.activeLease && !n.assigned_user);
  const requests = data.requests.filter(r => r.team_id === f.teamId && r.status === "approved");
  const driverUser = (ownerPayroll ? team?.owner_user : draft.prior?.driver_user) || requests.find(r => r.id === f.requestId)?.driver_user;
  const existingFranchise = (data.contracts || []).some(c => c.driver_user === driverUser && c.team_id === f.teamId && c.terms?.driverRole === "franchise");
  const role = driverUser && driverUser === team?.owner_user ? "owner" : (championIdentity(driverUser, data) || existingFranchise || f.driverRole === "franchise") ? "franchise" : "driver";
  const targetMember = data.members.find(m=>m.user_id===driverUser);
  const champion = isAbaChampion(targetMember?.gamertag,data.fundingPolicy?.champion_gamertag);
  const salaryFloor = champion ? Math.max(1000000, Number(data.fundingPolicy?.champion_salary || 0)) : role === "owner" ? 500000 : role === "franchise" ? 750000 : 250000;
  // The owner salary input is intentionally read-only. Use the SAME effective value
  // for rendering, validation, the payment schedule and the saved contract.
  // Otherwise choosing the owner as the approved applicant leaves f.salary empty
  // even while the screen visibly displays $500,000.
  const effectiveSalary = role === "owner" ? 500000 : f.salary;

  const showFailure = message => {
    setValidationError(message);
    setSubmissionState("error");
    window.requestAnimationFrame(() => feedbackRef.current?.scrollIntoView({behavior:"smooth",block:"center"}));
  };
  const submitOffer = async e => {
    e.preventDefault();
    if (submitLock.current || busy) return;
    const form=e.currentTarget;
    if (!form.checkValidity()) {
      const invalid = form.querySelector(":invalid");
      showFailure(`Complete the required field: ${invalid?.closest("label")?.textContent?.trim() || "contract information"}.`);
      invalid?.focus();
      return;
    }
    setValidationError("");
    if (!independent || ownerPayroll) {
      const error = contractSalaryError({salary:effectiveSalary,role,champion});
      if (error) { showFailure(error);return; }
      if (Number(effectiveSalary) < salaryFloor) { showFailure(`League rules require at least ${money(salaryFloor)} for this driver. You entered ${money(Number(effectiveSalary))}.`);return; }
      if (role === "owner" && Number(effectiveSalary) !== 500000) {showFailure("Required owner-driver salary is fixed at $500,000 for Season 2.");return;}
      if (role === "owner" && (Number(f.bonus)!==0 || Number(f.buyout)!==0)) {showFailure("Mandatory owner-driver contracts cannot include signing bonuses or buyouts.");return;}
      if (role !== "owner" && (f.buyout === "" || !Number.isFinite(Number(f.buyout)) || Number(f.buyout)<0 || Number(f.buyout)>Number(f.salary)*1.5)) {showFailure(`Buyout must be between $0 and ${money(Number(f.salary)*1.5)}.`);return;}
      if (!Number.isInteger(Number(f.seasons)) || Number(f.seasons)<1 || Number(f.seasons)>5) {showFailure("Contract length must be between 1 and 5 seasons.");return;}
    }
    if (f.endsOn <= f.startsOn) { showFailure("The contract end date must be after its effective date.");return; }
    if (!independent && !ownerPayroll && !draft.prior && !f.requestId) {showFailure("Select an approved driver application before creating the offer.");return;}
    if (!ownerManagement && (!f.number || !numbers.some(n=>Number(n.number)===Number(f.number))) && !draft.prior) {showFailure("Select a currently available team-leased car number.");return;}
    let schedule;
    try { schedule = independent && !ownerPayroll ? [] : makeCareerSchedule(effectiveSalary, role === "owner" ? "lump" : f.scheduleType, role === "owner" ? dateToday() : f.firstPayment, f.paymentCount); }
    catch (error) { showFailure(error.message || "Invalid payment schedule.");return; }
    const request = { action: ownerPayroll ? "owner_payroll" : draft.adminDelegation ? (draft.prior ? "admin_counter_contract" : "admin_offer_contract") : draft.prior ? "counter_contract" : "offer_contract", payload: { id: draft.prior?.id, teamId: f.teamId, requestId: f.requestId, message: f.message, terms: { number: Number(f.number), driverRole: role, salary: independent && !ownerPayroll ? 0 : role === "owner" ? 500000 : Number(f.salary), bonus: independent || role === "owner" ? 0 : Number(f.bonus), buyout: independent || role === "owner" ? 0 : Number(f.buyout), seasons: Number(f.seasons), startsOn: f.startsOn, endsOn: f.endsOn, scheduleType: role === "owner" ? "lump" : f.scheduleType, schedule, mediaRequirements: f.mediaRequirements, manufacturerRequirements: f.manufacturerRequirements, sponsorRequirements: f.sponsorRequirements } } };
    submitLock.current = true;
    setSubmissionState("submitting");
    try {
      // onSave resolves only after the server action finishes, not after a subsequent dashboard reload.
      const result=await onSave(request);
      if (!result?.ok) {
        showFailure(result?.message || "The contract was not confirmed. Refresh your offers before attempting again to avoid duplicates.");
      } else setSubmissionState("saved");
    } catch(error) { showFailure(error?.message || "The contract could not be confirmed. Refresh your offers before retrying."); }
    finally { submitLock.current = false; }
  };
  return <section className="career-compose"><div className="career-row"><h2>{draft.prior ? "Submit a new proposal" : independent ? "Independent ride agreement" : "Prepare a contract offer"}</h2><button type="button" onClick={onClose}>Cancel</button></div><p className="career-muted">Each proposal creates a separate version. Both parties must review and sign the same final version. Buyout cap: 1.5 × total base compensation.</p><form className="career-form" noValidate onSubmit={submitOffer}>
    {!draft.prior && <><label>Team<select required value={f.teamId} onChange={e => update("teamId", e.target.value)}><option value="">Choose team</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>{!independent && !ownerPayroll && <label>Approved applicant<select required value={f.requestId} onChange={e => update("requestId", e.target.value)}><option value="">Choose approved seat request</option>{requests.map(r => <option key={r.id} value={r.id}>{data.members.find(m => m.user_id === r.driver_user)?.gamertag || r.driver_user}</option>)}</select></label>}</>}
    {!ownerManagement && <label>Assign a team-leased number<select required value={f.number} onChange={e => update("number", e.target.value)}><option value="">Choose number</option>{numbers.map(n => <option key={n.id} value={n.number}>#{n.number} — leased by this team</option>)}</select></label>}
    {(!independent || ownerPayroll) && <>
      {role !== "owner" && !champion && !existingFranchise && <label>Driver classification
        <select value={f.driverRole} onChange={e => update("driverRole", e.target.value)}>
          <option value="driver">Regular driver — $250,000 minimum</option>
          <option value="franchise">Franchise driver — $750,000 minimum (funded seat required)</option>
        </select>
      </label>}
      <div className="career-notice" aria-live="polite"><strong>Contract classification:</strong> {champion ? "Defending champion / franchise" : role === "owner" ? "Owner-driver" : role === "franchise" ? "Franchise driver" : "Regular driver"}. <strong>League minimum: {money(salaryFloor)}.</strong> Franchise designations require an available, league-funded franchise seat; the server checks availability before creating or activating an agreement.</div>
    </>}
    {(!independent || ownerPayroll) && <div className="career-form-grid"><label>Base compensation — full contract total<input type="number" step="0.01" min="0" disabled={role === "owner"} placeholder={role === "owner" ? "Required owner salary" : "Enter salary amount"} value={effectiveSalary} onChange={e => update("salary", e.target.value)} /></label><label>Immediate signing bonus<input disabled={role === "owner"} required type="number" min="0" step="0.01" value={f.bonus} onChange={e => update("bonus", e.target.value)} /></label><label>Buyout amount<input required type="number" min="0" step="0.01" placeholder="Enter buyout amount" disabled={role === "owner"} value={role === "owner" ? 0 : f.buyout} onChange={e => update("buyout", e.target.value)} /></label><label>Seasons<input required type="number" min="1" max="5" value={f.seasons} onChange={e => update("seasons", e.target.value)} /></label></div>}
    <div className="career-form-grid"><label>Effective date<input required type="date" value={f.startsOn} onChange={e => update("startsOn", e.target.value)} /></label><label>End date<input required type="date" value={f.endsOn} onChange={e => update("endsOn", e.target.value)} /></label></div>
    {(!independent || ownerPayroll) && <>{role === "owner" ? <p className="career-notice">Owner salary: one manual payment due at the end of official Season Day 1 (Eastern Time), except grandfathered signed agreements. No automatic withdrawal or installments.</p> : <><label>Salary payment schedule<select value={f.scheduleType} onChange={e => update("scheduleType", e.target.value)}><option value="lump">One payment</option><option value="three">Three installments, 28 days apart</option><option value="weekly">Weekly installments</option></select></label><div className="career-form-grid"><label>First salary payment<input required type="date" value={f.firstPayment} onChange={e => update("firstPayment", e.target.value)} /></label>{f.scheduleType === "weekly" && <label>Number of weekly payments<input required type="number" min="1" max="52" value={f.paymentCount} onChange={e => update("paymentCount", e.target.value)} /></label>}</div></>}</>}
    <p className="career-notice">League media requirements remain mandatory in every contract. Salary and bonuses are paid by the owner; pending league funding claims do not count as available cash.</p>
    {[["mediaRequirements", "Media obligations — tasks, deadlines and proof"], ["manufacturerRequirements", "Manufacturer obligations"], ["sponsorRequirements", "Sponsor names, placements, appearances, deadlines and proof"], ["message", "Negotiation message / agreed notes"]].map(([key, label]) => <label key={key}>{label}<textarea required={key !== "message"} minLength={key === "message" ? 0 : 10} value={f[key]} onChange={e => update(key, e.target.value)} /></label>)}
    <div ref={feedbackRef} role="status" aria-live="polite">
      {validationError && <p role="alert" className="career-error" style={{padding:"12px",borderLeft:"4px solid #b91c1c",margin:"12px 0"}}>{validationError}</p>}
      {submissionState === "submitting" && <p>Submitting contract to the league… Do not submit again.</p>}
    </div>
    {champion&&<p className="career-notice">The defending champion must receive at least {money(salaryFloor)}. This salary cannot be reduced to a base-driver salary.</p>}
    <button type="submit" disabled={busy || submissionState === "submitting"}>{submissionState === "submitting" ? "Submitting contract…" : "Create version for review and signatures"}</button>
  </form></section>;
}
/** Super-admin seat assignment. The server MUST implement admin_assign_seat with
 * verified super-admin authorization and all Season 2 capacity/eligibility checks.
 * This only approves a seat request; it never activates a driver or pays salary. */
function AdminSeatAssignment({ data, busy, onAssign }) {
  const [teamId, setTeamId] = useState("");
  const [driverUser, setDriverUser] = useState("");
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const teams = (data.teams || []).filter(team => team.status === "approved" && team.tier !== "independent");
  const members = (data.members || []).filter(member =>
    member.user_id && String(member.gamertag || "").toLowerCase().includes(search.toLowerCase())
  );
  const selected = (data.members || []).find(member => member.user_id === driverUser);
  const active = (data.contracts || []).find(contract => contract.driver_user === driverUser && contract.status === "active");
  const existing = (data.requests || []).find(request => request.driver_user === driverUser && request.team_id === teamId && ["pending", "approved", "signed"].includes(request.status));
  return <section className="career-card" aria-label="Super-admin seat assignment">
    <h2>Assign a registered driver to a team</h2>
    <p className="career-muted">Administrative assignment creates an approved seat request for contract preparation. It does not activate the driver, bypass a driver signature, or change payroll. The database must enforce all eligibility, charter, lease, and funding rules.</p>
    <form className="career-form" onSubmit={event => { event.preventDefault();onAssign({teamId,driverUser,reason:reason.trim()}); }}>
      <label>Approved team<select required value={teamId} onChange={event => setTeamId(event.target.value)}><option value="">Select team</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name} · {team.occupied}/{team.capacity} seats</option>)}</select></label>
      <label>Find registered gamertag<input value={search} onChange={event => {setSearch(event.target.value);setDriverUser("");}} placeholder="Search gamertag" /></label>
      <label>Registered driver<select required value={driverUser} onChange={event => setDriverUser(event.target.value)}><option value="">Select driver</option>{members.slice(0, 100).map(member => <option key={member.user_id} value={member.user_id}>{member.gamertag}</option>)}</select></label>
      {selected && <p className="career-muted">Selected: {selected.gamertag} · account {selected.status || "status unknown"}</p>}
      {active && <p className="career-error" role="alert">This driver already has an active contract. Use the approved release/transfer process.</p>}
      {existing && <p className="career-error" role="alert">This team already has a {existing.status} request for this driver. Review that request instead.</p>}
      <label>Reason for administrative assignment<textarea required minLength={10} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} placeholder="Why is the Super Admin assigning this seat on behalf of the owner?" /></label>
      <button disabled={busy || !teamId || !driverUser || Boolean(active) || Boolean(existing) || reason.trim().length < 10}>Approve seat as Super Admin</button>
    </form>
  </section>;
}
export default function CareerDashboard({ workspace = "driver", initialTab, seasons = [], activeSeasonId = "", leagueReady = false }) {
  const ownerWorkspace = workspace === "owner", adminWorkspace = workspace === "admin";
  const [rawData, setData] = useState(null), [error, setError] = useState(""), [status, setStatus] = useState(""), [busy, setBusy] = useState(false), [tab, setTab] = useState(() => window.location.hash.slice(1) || initialTab || (window.location.pathname.includes("contracts") ? "offers" : window.location.pathname.includes("market") ? "teams" : window.location.pathname === "/manufacturer-hq" ? "funding" : "overview")), [selected, setSelected] = useState(() => new URLSearchParams(window.location.search).get("contract")), [fundingDoc, setFundingDoc] = useState(() => new URLSearchParams(window.location.search).get("funding")), [draft, setDraft] = useState(null), [search, setSearch] = useState("");
  const [financialStatus, setFinancialStatus] = useState(null);
  const [financialError, setFinancialError] = useState("");
  const [financialLoading, setFinancialLoading] = useState(ownerWorkspace);
  const refreshFinancialStatus = useCallback(async () => {
    if (!ownerWorkspace) return;
    try {
      const { data, error: failure } = await supabase.rpc("brl_owner_financial_status");
      if (failure) throw failure;
      setFinancialStatus(data);
      setFinancialError("");
    } catch (failure) { setFinancialError(failure?.message || "Unable to check owner financial clearance."); }
    finally { setFinancialLoading(false); }
  }, [ownerWorkspace]);
  useEffect(() => {
    if (!ownerWorkspace) return;
    refreshFinancialStatus();
    window.addEventListener("focus", refreshFinancialStatus);
    window.addEventListener("brl:bank-state-changed", refreshFinancialStatus);
    return () => { window.removeEventListener("focus", refreshFinancialStatus); window.removeEventListener("brl:bank-state-changed", refreshFinancialStatus); };
  }, [ownerWorkspace, refreshFinancialStatus]);
  const themeTeamCode = adminWorkspace ? "" : careerTeamCode(rawData, seasons, activeSeasonId, ownerWorkspace);
  const themeTeam = (rawData?.teams || []).find(t => t.code === themeTeamCode);
  const theme = useTeamTheme(themeTeamCode, themeTeam?.owner_profile);
  const themed = Boolean(themeTeamCode && !["ind", "independent"].includes(themeTeamCode.toLowerCase()));
  function openContract(id) {
    setSelected(id);setFundingDoc(null);
    const url = new URL(window.location.href);url.searchParams.delete("funding");if (id) url.searchParams.set("contract", id);else url.searchParams.delete("contract");window.history.replaceState(null, "", url);
  }
  function openFunding(id) {
    setFundingDoc(id);setSelected(null);
    const url = new URL(window.location.href);url.searchParams.delete("contract");if (id) url.searchParams.set("funding", id);else url.searchParams.delete("funding");window.history.replaceState(null, "", url);
  }
  useEffect(() => {
    const sync = () => { setTab(window.location.hash.slice(1) || initialTab || "overview");setSelected(new URLSearchParams(window.location.search).get("contract"));setFundingDoc(new URLSearchParams(window.location.search).get("funding")); };
    window.addEventListener("hashchange", sync);window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync);window.removeEventListener("popstate", sync); };
  }, [initialTab]);
  const load = useCallback(async () => { const next = await careerRead();setData(next);setError("");return next; }, []);
  useEffect(() => { let live = true;const refresh = () => careerRead().then(next => { if (live) { setData(next);setError(""); } }).catch(e => { if (live) setError(e.message); });refresh();window.addEventListener("focus", refresh);return () => { live = false;window.removeEventListener("focus", refresh); }; }, []);
  useEffect(() => {
    if (!["owner", "independent"].includes(rawData?.me?.kind) || rawData?.me?.status !== "applicant") return;
    let live = true;
    const timer = setInterval(() => careerRead().then(next => { if (live) { setData(next);setError(""); } }).catch(e => { if (live) setError(e.message); }), 20000);
    return () => { live = false;clearInterval(timer); };
  }, [ownerWorkspace, rawData?.me?.kind, rawData?.me?.status]);
  async function run(action, payload) {
    setBusy(true);setError("");setStatus("");
    try {
      const result = await careerAction(action, payload);
      // A successful write must never be reported as failed because a later read times out.
      setStatus("Saved successfully.");
      try { await load(); } catch (refreshError) {
        setStatus("Saved successfully. The updated dashboard could not refresh yet; please refresh the page to see it.");
        console.warn("BRL: contract action saved; dashboard refresh failed",refreshError);
      }
      return result;
    } catch (failure) { setError(failure?.message || "Action failed; check current records before retrying.");return null; }
    finally { setBusy(false); }
  }
  const data=careerWorkspaceData(rawData,workspace);
  if (!data) return <div className="career"><h1>{adminWorkspace?"League administration":ownerWorkspace?"Owner HQ":"My Career"}</h1>{error ? <><p role="alert" className="career-error">{error}</p><button onClick={() => { setError("");load().catch(e => setError(e.message)); }}>Retry</button><p><a href="/login">Sign in / Register</a></p></> : <p role="status">Loading your applications and agreements…</p>}</div>;
  const me = data.me, root = adminWorkspace && data.isSuperAdmin, owned = ownerWorkspace ? data.teams.filter(t => t.owner_user === me.user_id && t.status === "approved") : [], owner = owned.length > 0;
  if (ownerWorkspace && financialStatus?.suspended && !financialStatus?.adminOverride) {
    return <OwnerFinancialSuspension status={financialStatus} payments={data.payments} busy={busy}
      error={error || financialError} onRefresh={() => { refreshFinancialStatus(); load(); }}
      onPay={async id => { await run("pay_obligation", { id }); await refreshFinancialStatus(); }} />;
  }

  const restrictedOwner = ownerWorkspace && me.kind !== "driver" && ["applicant", "rejected"].includes(me.status);
  // A membership with status "active" is not, by itself, proof of an
  // active Season 2 driver contract. Do not block applications on that flag.
  // The server remains authoritative for transfers, contracts and charters.
  const hasActiveDriverContract = (data.contracts || []).some(contract =>
    contract.driver_user === me.user_id && contract.status === "active");
  const seatRequestBlockReason = (team) => {
    if (busy) return "Another request is being processed. Please wait.";
    if (hasActiveDriverContract) return "You already have an active driver contract. Use the approved transfer process before joining another team.";
    if (!team.ready) return "This team is not marked ready for recruiting in your dashboard. Its funding and paid number leases may need to be refreshed.";
    const occupied = Number(team.occupied || 0);
    const reserved = Number(team.reserved || 0);
    const capacity = Number(team.capacity || 0);
    if (occupied + reserved >= capacity)
      return `The dashboard reports ${occupied} occupied + ${reserved} reserved seats against ${capacity} approved slots. If this double-counts an owner seat, the team occupancy calculation needs correcting.`;
    if ((data.requests || []).some(request =>
      request.driver_user === me.user_id && request.team_id === team.id &&
      ["pending", "approved", "signed"].includes(request.status)))
      return "You already have a pending or approved seat request for this team.";
    return "";
  };
  const manufacturer = (data.manufacturerRoles || []).length > 0;
  const applicationOwner = ["owner", "independent"].includes(me.kind);
  const canOpenOwner = owner || root || applicationOwner || manufacturer;
  const tabs = adminWorkspace ? (root && ["/admin/funding","/admin/contracts","/admin/appointments","/admin/support"].includes(window.location.pathname) ? (window.location.pathname === "/admin/contracts" ? [["offers","Driver contracts"],["requests","Team seat assignments"]] : [[initialTab||"budgets",{"budgets":"Funding center","offers":"Driver contracts","appointments":"Staff appointments","funding":"Manufacturer support"}[initialTab||"budgets"]]]) : root ? [["overview","Staff overview"],["requests","Team seat assignments"],["budgets","Team budgets"],["approvals","Loan approvals"],["team","Independent rides"],["offers","Driver contracts"],["requirements","Contract requirements"],["leases","Number administration"],["funding","Manufacturer support"],["appointments","Staff appointments"]] : manufacturer ? [["funding","Manufacturer support"]] : []) : ownerWorkspace ? restrictedOwner ? [["overview", "Ownership application"], ["appeals", "Appeals"], ["account", "Account"]] : [
    ["overview", "Team overview"], ...(owner || root ? [["team", "Team setup"], ["requests", "Seat applications"], ["offers", "Driver contracts"], ["requirements", "Driver requirements"], ["payments", "Driver payments"]] : []),
    ...(owner || root || manufacturer ? [["leases", "Number leases"], ["funding", "Manufacturer support"]] : []),
    ...(root ? [["budgets", "Team budgets"], ["approvals", "Super-admin approvals"]] : []), ["streams", "My streams"], ["appeals", "Appeals"], ["account", "Account"],
  ] : [["overview", "Overview"], ["stats", "My stats"], ["money", "My money"], ["offers", "My contracts"], ["requests", "My seat requests"], ["teams", "Shop teams"], ["requirements", "My requirements"], ["streams", "My streams"], ["appeals", "Appeals"], ["account", "Account"]];
  const currentTab = tabs.some(([key]) => key === tab) ? tab : (tabs[0]?.[0] || "overview");
  const myApprovedTeams = (rawData?.teams || []).filter(t => t.owner_user === me.user_id && t.status === "approved");
  // My Career is the same account as Owner HQ. A required owner agreement does
  // NOT depend on a self-submitted seat application.
  const myOwnerSalarySeats = (rawData?.ownerPayrollSeats || []).filter(s =>
    s.userId === me.user_id && myApprovedTeams.some(t => t.id === s.teamId));
  const myOwnerAgreementTeams = myApprovedTeams.filter(t =>
    (rawData?.contracts || []).some(c => c.team_id === t.id && c.driver_user === me.user_id &&
      ["offered", "partially_signed", "active"].includes(c.status)));
  const missingOwnerAgreements = myApprovedTeams.filter(t =>
    !myOwnerAgreementTeams.some(existing => existing.id === t.id));
  const prepareOwnerAgreement = async (team) => {
    // The backend retains the authoritative funded-seat, duplicate-salary and
    // season validations. Never generate signatures or change leases here.
    const eligibleSeat = myOwnerSalarySeats.find(s => s.teamId === team.id);
    if (!eligibleSeat) {
      setError("Your owner agreement cannot be issued yet: your team must have its owner seat and approved number assignment ready. You do not need to apply to your own team.");
      return;
    }
    const start = dateToday();
    const end = dateAfter(365);
    const terms = {
      number: eligibleSeat.number ? Number(eligibleSeat.number) : null,
      salary: 500000, bonus: 0, buyout: 0, seasons: 1,
      startsOn: start, endsOn: end, scheduleType: "lump",
      schedule: makeCareerSchedule(500000, "lump", start),
      mediaRequirements: "Complete league-required pre-race and post-race interviews by published deadlines; submit evidence as required.",
      manufacturerRequirements: "Race the team-approved manufacturer, including all required branding and league eligibility rules.",
      sponsorRequirements: "Follow each team-approved sponsor placement and race obligation; submit dated verification as required."
    };
    const result = await run("owner_payroll", { teamId: team.id, terms });
    if (result?.id) openContract(result.id);
  };
  if (ownerWorkspace && !canOpenOwner) return <main className="career"><h1>Owner HQ</h1><p>An approved ownership account or manufacturer appointment is required for team management.</p><a href="/career">Return to My Career</a></main>;
  const teamName = id => data.teams.find(t => t.id === id)?.name || "Team";
  const memberName = uid => data.members.find(m => m.user_id === uid)?.gamertag || "Applicant";
  const changeTab = value => { setTab(value);setSelected(null);setFundingDoc(null);setDraft(null);window.history.replaceState(null, "", `${window.location.pathname}#${value}`); };
  const notices = <>{error && <p className="career-error" role="alert">{error}</p>}{status && <p className="career-status" role="status">{status}</p>}</>;
  if(adminWorkspace && !root && !manufacturer) return <main className="career"><h1>League administration</h1><p>Your account has no assigned access to this workspace.</p></main>;
  const doc = data.contracts.find(c => c.id === selected), funding = (ownerWorkspace || adminWorkspace) ? data.agreements.find(a => a.id === fundingDoc) : null;
  if (doc && !draft) return <div className="career">{notices}<ContractDocument contract={doc} me={me} isOwner={myApprovedTeams.some(t => t.id === doc.team_id)} isSuperAdmin={root} onBack={() => openContract(null)} onAction={run} onNegotiate={c => setDraft({ prior: c, adminDelegation: adminWorkspace && root })} busy={busy} numberChanges={data.numberChanges || []} /></div>;
  if (funding) return <div className="career">{notices}<FundingDocument agreement={funding} team={data.teams.find(t => t.id === funding.team_id)} me={me} owner={owned.some(t => t.id === funding.team_id)} busy={busy} onClose={() => openFunding(null)} onSign={signature => run("sign_funding", { id: funding.id, signature })} /></div>;
  return <main className={`career${themed ? " brl-team-themed" : ""}`} data-team-theme={themeTeamCode || undefined} style={themed ? theme.style : undefined}><div className="career-row"><div><div className="career-kicker">BRL / {adminWorkspace ? "League administration" : ownerWorkspace ? "Team management" : "Driver dashboard"}</div><h1>{adminWorkspace ? "League administration" : ownerWorkspace ? "Owner HQ" : "My Career"}</h1><p><strong>{me.gamertag}</strong> · <Badge value={me.status} /></p></div><div className="career-actions"><a href="/standings">League home ↗</a><button onClick={() => logoutOfLeague().then(() => window.location.assign("/login")).catch(e => setError(e.message))}>Log out</button></div></div>
    {themed && <section className="team-identity-strip" aria-label="Your team">{theme.logoUrl && <img src={theme.logoUrl} alt={`${themeTeam?.name || theme.fullName} logo`} />}<div><strong>{themeTeam?.name || theme.fullName || themeTeamCode}</strong><span>{ownerWorkspace ? "Owner HQ" : "Driver career"} · {themeTeamCode}{themeTeam?.manufacturer ? ` · ${themeTeam.manufacturer}` : ""}</span></div></section>}
    {ownerWorkspace && financialLoading && <p role="status">Checking owner financial clearance…</p>}
    {ownerWorkspace && financialError && <p className="career-error" role="alert">Financial clearance check unavailable: {financialError}. The database will continue to enforce owner restrictions.</p>}
    <div className="career-workspace-links">{rawData.isSuperAdmin || (rawData.manufacturerRoles||[]).length ? <a href="/admin">Admin Portal ↗</a> : null}{ownerWorkspace ? <a href="/career">My Career ↗</a> : ["owner", "independent"].includes(me.kind) || data.isSuperAdmin ? <a href="/team-hq">Owner HQ ↗</a> : manufacturer ? <a href="/admin/support">Manufacturer staff ↗</a> : null}</div>
    <nav className="career-nav" aria-label={adminWorkspace ? "League administration sections" : ownerWorkspace ? "Owner HQ sections" : "Career sections"}>{tabs.map(([key, label]) => <button key={key} aria-pressed={currentTab === key} onClick={() => changeTab(key)}>{label}</button>)}</nav>{notices}
    {ownerWorkspace && ["overview","leases","offers","payments"].includes(currentTab) && owned.map(t=><TeamCostBreakdown key={t.id} data={data} team={t} busy={busy} run={run}/>)}
    {adminWorkspace && currentTab === "overview" && <section className="career-card"><h2>League staff workspace</h2><p>Manage team funding, loans, independent contracts, number administration and manufacturer support here. Owner signatures and team operations remain in Owner HQ.</p></section>}
    {currentTab === "overview" && !adminWorkspace && <OwnerBuildNotice teams={myApprovedTeams} onBuild={ownerWorkspace ? () => changeTab("team") : undefined} />}
    {!ownerWorkspace && !adminWorkspace && ["overview", "stats", "money"].includes(currentTab) && <DriverCareerSummary data={data} seasons={seasons} seasonId={activeSeasonId} leagueReady={leagueReady} section={currentTab} onTab={changeTab} onContract={openContract} />}

    {draft && <OfferForm key={draft.prior?.id || `${draft.teamId}-${draft.requestId}`} draft={draft} data={data} busy={busy} onClose={() => setDraft(null)} onSave={async value => {
      // Save once and report the actual server result to the form.
      // Do not dismiss the form when the write fails or is unconfirmed.
      setBusy(true);setError("");setStatus("");
      try {
        const result = await careerAction(value.action, value.payload);
        setStatus("Contract offer created successfully.");
        setDraft(null);
        if (result?.id) openContract(result.id);
        // Refresh only AFTER success. A slow read cannot turn a saved offer into a failure.
        careerRead().then(setData).catch(error => {
          console.warn("BRL: saved offer but refresh failed",error);
          setStatus("Contract saved. The list is still refreshing; reopen Driver Contracts shortly.");
        });
        return {ok:true};
      } catch(error) {
        return {ok:false,message:error?.message || "The server did not confirm the offer. Review pending contracts before retrying."};
      } finally { setBusy(false); }
    }} />}
    {ownerWorkspace && currentTab === "overview" && <>{!data.teams.some(t=>t.owner_user===me.user_id) && (data.previousTeams||[]).filter((t,i,all)=>all.findIndex(x=>x.code===t.code)===i).map(t=><section className="career-card" key={t.id}><h2>Renew {t.name} for this season</h2><p>Previous team approval and number use do not renew automatically. Submit your current-season ownership application, then sign and fund new number leases.</p><button disabled={busy} onClick={()=>run("renew_team_application",{previousTeamId:t.id})}>Request renewed team approval</button></section>)}<section className="career-card"><h2>{restrictedOwner ? "Your ownership application" : "Your team operations"}</h2><p>{"Manage your team’s roster, active number leases, driver contracts, payroll and funding. Only the super admin approves ownership and independent rides. Recruiting stays closed until approval, funding and active number leases are complete."}</p><p className="career-notice">Your registered name is your racing-platform gamertag: <strong>{me.gamertag}</strong>. Use this same gamertag to sign documents.</p>{!restrictedOwner && <div className="career-actions"><button onClick={() => changeTab("offers")}>Manage driver contracts</button>{owner && <button onClick={() => changeTab("team")}>Set up my team</button>}{me.driverNumber && <a href={`/driver/${me.driverNumber}`}>Open my driver profile ↗</a>}</div>}</section>{data.teams.filter(t => t.owner_user === me.user_id).map(t => <section key={t.id} className="career-card"><h2>{t.name}</h2><Badge value={t.status} /><p>{t.manufacturer} · {t.status==="approved"?`${t.tier} · ${t.capacity} approved cars`:`${t.requestedCapacity||1} cars requested · charter unassigned`}</p><p>{t.review_note || (t.status === "pending" ? "Waiting for super-admin review. Team operations are locked." : t.ready ? "Team is ready to recruit." : "Complete funding and active number leases before signing drivers.")}</p>{["pending", "rejected"].includes(t.status) && <form className="career-form" onSubmit={e => { e.preventDefault();const f = new FormData(e.currentTarget);run("revise_application", { name: f.get("name"), code: f.get("code"), manufacturer: f.get("manufacturer"), requestedCapacity: Number(f.get("requestedCapacity")) }); }}><h3>Correct / resubmit application</h3><label>Team name<input name="name" required defaultValue={t.name} /></label><label>Team code<input name="code" required pattern="[A-Za-z0-9_-]{2,20}" defaultValue={t.code} /></label><label>Manufacturer<select name="manufacturer" defaultValue={t.manufacturer}><option>Toyota</option><option>Ford</option><option>Chevrolet</option></select></label><label>Requested number of cars<select name="requestedCapacity" defaultValue={t.requestedCapacity||1}>{(me.kind==="independent"?[1]:[1,2,3,4]).map(n=><option key={n} value={n}>{n}</option>)}</select></label><p>The super admin assigns your charter tier and alliance.</p><button disabled={busy}>Submit revised application for approval</button></form>}</section>)}</>}
    {currentTab === "streams" && <MemberStreamSettings/>}
    {currentTab === "appeals" && <AppealsWorkspace/>}
    {currentTab === "account" && <form className="career-form career-card" onSubmit={async e => { e.preventDefault();const f = new FormData(e.currentTarget), password = String(f.get("password"));if (password !== f.get("confirm")) { setError("Passwords do not match.");return; }setBusy(true);setError("");try { await changeCareerPassword(password, me.login_kind);setStatus("Login password updated."); } catch (failure) { setError(failure.message); } finally { setBusy(false); } }}><h3>Account password</h3><p><JoinDate member={me}/></p><label>New password<input type="password" name="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><label>Confirm new password<input type="password" name="confirm" required minLength={12} maxLength={128} autoComplete="new-password" /></label><button disabled={busy}>Change login password</button></form>}
    {currentTab === "teams" && <><label>Find a team<input className="career-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Team name or manufacturer" /></label><div className="career-grid" style={{ marginTop: 20 }}>{data.teams.filter(t => t.status === "approved" && `${t.name} ${t.manufacturer}`.toLowerCase().includes(search.toLowerCase())).map(t => <section className="career-card" key={t.id}><div className="career-kicker">{t.manufacturer} / {t.tier}</div><h2>{t.name}</h2>{t.owner_profile?.logoDataUrl && <img className="team-market-logo" src={t.owner_profile.logoDataUrl} alt={`${t.name} logo`} />}<p>Owner: {t.owner_gamertag}</p>{t.owner_profile?.bio && <p>{t.owner_profile.bio}</p>}<p>{t.occupied}/{t.capacity} seats occupied · {t.reserved} reserved offers</p><Badge value={t.ready ? "approved" : "setup required"} /><p className="career-muted">{t.ready ? "Approved, funded and holds a paid seasonal lease." : "Applications open once funding and number agreements are established."}</p>{t.tier !== "independent" && <form className="career-form" onSubmit={async e => { e.preventDefault();const form = new FormData(e.currentTarget);await run("request_seat", { teamId: t.id, message: form.get("message") }); }}><label>Introduce yourself<textarea name="message" maxLength={2000} placeholder="Experience, availability, and what you want in a team" /></label><button type="submit" disabled={Boolean(seatRequestBlockReason(t))}>Request a seat</button>{seatRequestBlockReason(t) ? <p className="career-notice" role="status"><strong>Seat request unavailable:</strong> {seatRequestBlockReason(t)} <span className="career-muted">(Membership: {me.status}; team ready: {String(Boolean(t.ready))}; occupied: {t.occupied ?? 0}; reserved: {t.reserved ?? 0}; capacity: {t.capacity ?? 0}.)</span></p> : <p className="career-muted">You can submit a seat request. The league will verify eligibility when you submit.</p>}</form>}{t.tier === "independent" && <p>Independent team: super-admin approval only.</p>}</section>)}</div>{!data.teams.some(t => t.status === "approved") && <p className="career-empty">No approved teams yet. Check back after owner approvals.</p>}</>}
    {currentTab === "requests" && <>{adminWorkspace && root && <AdminSeatAssignment data={data} busy={busy} onAssign={async payload => {const result = await run("admin_assign_seat", payload);if(result) await load();}} />}{data.requests.length === 0 && <p className="career-empty">No seat requests yet.</p>}{data.requests.map(r => <section className="career-card" key={r.id}><div className="career-row"><h2>{teamName(r.team_id)} · {memberName(r.driver_user)}</h2><Badge value={r.status} /></div><p>{r.message || "No introductory message."}</p>{r.review_note && <p>Owner response: {r.review_note}</p>}{(root || owned.some(t => t.id === r.team_id)) && r.status === "pending" && <Review busy={busy} onSubmit={values => run(root && adminWorkspace ? "admin_review_seat" : "review_seat", { id: r.id, ...values })} />}{(root || owned.some(t => t.id === r.team_id)) && r.status === "approved" && <button onClick={() => { changeTab("offers");setDraft({ teamId: r.team_id, requestId: r.id, adminDelegation: adminWorkspace && root }); }}>Prepare a contract</button>}{r.driver_user === me.user_id && r.status === "pending" && <button disabled={busy} onClick={() => run("withdraw_seat", { id: r.id })}>Withdraw request</button>}</section>)}</>}
    {currentTab === "offers" && <>{!ownerWorkspace && !adminWorkspace && myApprovedTeams.length > 0 && <p className="career-notice">Owner-driver agreements are tied to this same account. You never need to submit a seat request to yourself. Open your agreement to review and sign the owner and driver signature blocks.</p>}{(owner || root) && <><button onClick={() => setDraft({ teamId: owner ? owned[0].id : "", adminDelegation: adminWorkspace && root })}>{root && adminWorkspace ? "Create offer for any team" : "Create contract offer"}</button>{(data.ownerPayrollSeats || []).filter(s=>owned.some(t=>t.id===s.teamId)).map(s=><button key={s.teamId} onClick={()=>setDraft({teamId:s.teamId,number:s.number,management:s.management,ownerPayroll:true})}>Review owner salary agreement · {data.teams.find(t=>t.id===s.teamId)?.name}</button>)}</>}<p className="career-muted">Compare compensation, requirements, manufacturer, term, and buyout. Select a document to review, negotiate, decline, or sign. Every revised proposal needs fresh signatures.</p><div className="career-offer-compare">{data.contracts.map(c => <section key={c.id} className="career-card"><div className="career-kicker">{c.terms.manufacturer} / #{c.terms.number}</div><h2>{c.terms.teamName}</h2><p>{c.terms.driverGamertag} · Version {c.version}</p><Badge value={new Date(c.expires_at) <= new Date() && ["offered", "partially_signed"].includes(c.status) ? "expired" : c.status} /><dl><dt>Base compensation</dt><dd>{money(c.terms.salary)}</dd><dt>Signing bonus / Buyout</dt><dd>{money(c.terms.bonus)} / {money(c.terms.buyout)}</dd><dt>Term</dt><dd>{c.terms.seasons} season(s) · {c.terms.startsOn} – {c.terms.endsOn}</dd></dl><p className="career-muted">{c.terms.note}</p><button onClick={() => openContract(c.id)}>Review document & requirements</button></section>)}</div>{!ownerWorkspace && !adminWorkspace && missingOwnerAgreements.map(t => <section className="career-card" key={`owner-agreement-${t.id}`}>
      <div className="career-kicker">Required owner-driver agreement</div>
      <h2>{t.name}</h2>
      <p>Your Season 2 owner-driver compensation is <strong>{money(500000)}</strong> base salary, with <strong>$0 signing bonus</strong> and <strong>$0 buyout</strong>. Your approved owner account does not need a seat application.</p>
      <p className="career-muted">No open or active owner contract was found for your account on this team. Generate the agreement for your own review and signatures; no salary is paid or activated just by preparing it.</p>
      <button disabled={busy} onClick={() => prepareOwnerAgreement(t)}>Prepare my required owner agreement</button>
    </section>)}
    {!data.contracts.length && !missingOwnerAgreements.length && <p className="career-empty">{myApprovedTeams.length ? "No owner-driver agreement is visible. Refresh this page or contact league administration to reconcile the account; do not create a duplicate account." : data.requests.some(r=>r.status === "pending") ? "Your seat application is waiting for the team's decision." : "No contract offers are available yet. Browse teams or check your seat applications."}</p>}</>}
    {currentTab === "team" && <>{owned.map(t => <React.Fragment key={t.id}><TeamBuilder team={t} data={data} onSaved={load} onStep={changeTab} /><div id={`team-finance-${t.id}`}><TeamSetup team={t} data={data} busy={busy} run={run} /></div></React.Fragment>)}{root && data.teams.filter(t => t.status === "approved" && t.tier === "independent").map(t => <section className="career-card" key={t.id}><h2>{t.name} — Independent</h2><p>The independent owner must first fund the team and lease a number.</p><button disabled={!t.ready || busy} onClick={() => { changeTab("offers");setDraft({ teamId: t.id, independent: true }); }}>Prepare independent ride agreement</button></section>)}</>}
    {currentTab === "leases" && (adminWorkspace && root ? <NumberLeaseAdmin/> : <NumberLeaseCenter data={data} owned={owned} busy={busy} run={run} staffMode={adminWorkspace} onAssign={assignment=>{changeTab("offers");setDraft(assignment);}}/>)}
    {currentTab === "appointments" && root && <ManufacturerAppointments data={data} busy={busy} run={run}/>}
    {currentTab === "budgets" && root && <BudgetCenter data={data} busy={busy} run={run} />}
    {currentTab === "funding" && <FundingCenter data={data} owned={owned} busy={busy} run={run} onDocument={openFunding} staffMode={adminWorkspace} />}
    {currentTab === "payments" && <><h2>Owner payment responsibilities</h2><p>Pending manufacturer, sponsor, and media claims do not excuse payroll. Loan repayments remain obligations even before they are due.</p><div className="career-table-wrap"><table><thead><tr><th>Team</th><th>Purpose</th><th>Due</th><th>Amount / paid</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.payments.map(p => <tr key={p.id}><td>{p.team}</td><td>{p.description}</td><td>{new Date(p.due_at).toLocaleDateString()}</td><td>{money(p.amount)} / {money(p.paid)}</td><td><Badge value={p.status} /></td><td>{p.status === "scheduled" && <button disabled={busy} onClick={() => run("pay_obligation", { id: p.id })}>Pay from team account</button>}</td></tr>)}</tbody></table></div></>}
    {currentTab === "requirements" && <>{data.obligations.map(o => { const c = data.contracts.find(c => c.id === o.contract_id), canReview = root || owned.some(t => t.id === c?.team_id);return <section className="career-card" key={o.id}><div className="career-kicker">{o.category}</div><h2>{c?.terms.driverGamertag} · {c?.terms.teamName}</h2><Badge value={o.status} /><p>{o.requirement}</p><p>Due: {new Date(o.due_at).toLocaleString()}</p><p>Proof: {o.evidence_requirement}</p><p>{o.consequence}</p>{o.evidence && <p>Submitted evidence: {o.evidence}</p>}{o.review_note && <p>Review: {o.review_note}</p>}{c?.driver_user === me.user_id && ["upcoming", "submitted", "missed"].includes(o.status) && <form className="career-form" onSubmit={e => { e.preventDefault();run("submit_obligation", { id: o.id, evidence: new FormData(e.currentTarget).get("evidence") }); }}><label>Evidence / dated links<textarea name="evidence" required minLength={10} defaultValue={o.evidence} /></label><button disabled={busy}>Submit evidence</button></form>}{canReview && <Review busy={busy} options={[["completed", "Verified complete"], ["excused", "Excused"], ["missed", "Missed — reviewed"]]} onSubmit={values => run("review_obligation", { id: o.id, ...values })} />}</section>;})}{!data.obligations.length && <p className="career-empty">Contractual requirements appear here after activation.</p>}{owner && <form className="career-form career-card" onSubmit={e => { e.preventDefault();const f = new FormData(e.currentTarget);run("add_obligation", { contractId: f.get("contractId"), category: f.get("category"), event: f.get("event"), dueAt: new Date(f.get("dueAt")).toISOString() }); }}><h2>Track an event under an existing contract</h2><label>Active contract<select required name="contractId">{data.contracts.filter(c => c.status === "active" && owned.some(t => t.id === c.team_id)).map(c => <option key={c.id} value={c.id}>{c.terms.driverGamertag} / {c.terms.teamName}</option>)}</select></label><label>Category<select name="category"><option value="media">Media</option><option value="manufacturer">Manufacturer</option><option value="sponsor">Sponsor</option></select></label><label>Event / race<input required name="event" /></label><label>Due date/time<input required name="dueAt" type="datetime-local" /></label><button disabled={busy}>Track signed contractual requirement</button></form>}</>}
    {currentTab === "approvals" && root && <><h2>Owner & independent applications</h2><p>Review owner applications and assign charter tiers in Admin Portal → Finance Department → Super-admin number lease administration.</p><a href="/admin">Open Admin Portal ↗</a><h2>League loan requests</h2>{data.loans.map(l => <section className="career-card" key={l.id}><h3>{teamName(l.team_id)} · {money(l.amount)}</h3><Badge value={l.status} /><p>{l.reason}</p><p>Repayment due {new Date(l.due_at).toLocaleDateString()}</p>{l.status === "pending" && <LoanApproval data={data} loan={l} busy={busy} run={run} />}</section>)}<p className="career-muted">An approved loan disburses real league treasury funds and records repayment. If treasury funds are insufficient, approval rolls back.</p></>}
  </main>;
}
function TeamSetup({ team: t, data, busy, run }) {
  const cash = data.balances.find(b => b.kind === "team" && b.subject === t.code), numbers = data.numbers.filter(n => n.team_id === t.id && n.activeLease);
  return <section className="career-card"><div className="career-row"><h2>{t.name}</h2><Badge value={t.ready ? "approved" : "setup required"} /></div><p>{t.manufacturer} · {t.capacity} seats · {t.occupied} occupied</p><p className="career-cash">Total cash {money(cash?.balance)} · Available for operations {money(cash?.available)}</p><TeamCostBreakdown data={data} team={t} busy={busy} run={run}/><p className="career-notice">Salary obligations require manual payment by their published deadlines. Review the operating-cost breakdown, confirm league funding and paid number leases, and verify the required owner and franchise payroll obligations. Returning teams receive operating cash; extra pay needs separate funding.</p><p>Active seasonal leases: {numbers.map(n => `#${n.number}${n.assigned_user ? " (assigned)" : ""}`).join(", ") || "None"}</p><OwnerCharterRequest team={t} data={data} busy={busy} run={run}/><LoanRepayments data={data} team={t} busy={busy} run={run} /><div className="career-grid"><section><h3>Seasonal number leases</h3><p>The league owns all numbers. Your team must pay the published Financial Summary lease fee each season. Manufacturer cost-sharing requires signed additional recurring obligations.</p><a href="/team-hq#leases">Request or assign team numbers ↗</a></section><form className="career-form" onSubmit={e => { e.preventDefault();const f = new FormData(e.currentTarget);run("request_loan", { teamId: t.id, amount: Number(f.get("amount")),  reason: f.get("reason") }); }}><h3>Request operating funds</h3><p>Borrow for planned lease fees, race entries and other costs. Include signed funding income in your repayment plan; pending claims are not cash.</p><label>Loan amount<input required type="number" min="1" max="10000000" step="0.01" name="amount" /></label><p>Repayment deadline: {data.rules.loanDeadlineSeason === data.seasonId && data.rules.loanDeadline ? new Date(data.rules.loanDeadline).toLocaleString() : "Awaiting super-admin pre-Chase deadline"}. The league sets this date for all season loans.</p><label>Purpose and repayment plan<textarea required minLength={8} name="reason" /></label><button disabled={busy}>Submit loan request</button></form></div>{data.loans.filter(l => l.team_id === t.id).map(l => <p key={l.id}>Loan {money(l.amount)}: <Badge value={l.status} /> {l.review_note}</p>)}</section>;
}
