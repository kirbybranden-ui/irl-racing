import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "../lib/supabase";

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 24 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const inputStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", width: "100%", resize: "vertical" };
const selectStyle = { background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", width: "100%" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer", fontSize: 12 };
const blueButtonStyle = { background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const greenButtonStyle = { background: "#16a34a", color: "white", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" };
const exportButtonStyle = { background: "#1e293b", color: "#d4af37", border: "1px solid #d4af37", borderRadius: 8, padding: "6px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 };

const INTERVIEW_DEFAULT_BONUS = 25000;

const teamFullNames = {
  B2J: "B2J Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt Sick6 Motorsports",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
  BWR: "Big Wheel Racing",
  KDM: "Kev Din Motorsports",
  BMX: "BayouX Motorsports",
  BXM: "BayouX Motorsports",
  "BayouX Motorsports": "BayouX Motorsports",
  Independent: "Independent",
  IND: "Independent",
};

const TEAM_STARTING_FUNDS = { 1: 300000, 2: 700000, 3: 1000000, 4: 1500000 };
const TEAM_BUDGET_OVERRIDES = { B2J: 5000000, BXM: 700000, BMX: 700000, "BayouX Motorsports": 700000 };

function getTeamFullName(team) {
  return teamFullNames[team] || team || "Independent";
}

function getTeamStartingBudget(driverCount, teamName = "") {
  if (TEAM_BUDGET_OVERRIDES[teamName]) return TEAM_BUDGET_OVERRIDES[teamName];
  if (driverCount <= 0) return 0;
  return TEAM_STARTING_FUNDS[driverCount] || TEAM_STARTING_FUNDS[4];
}

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDateTime(value) {
  if (!value) return "No deadline set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function toIsoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getInterviewDeadline(interview) {
  return interview?.deadline_at || interview?.due_at || interview?.deadlineAt || null;
}

function getInterviewSubmittedAt(interview) {
  return interview?.submitted_at || interview?.submittedAt || interview?.answered_at || interview?.updated_at || null;
}

function isInterviewOnTime(interview) {
  const deadline = getInterviewDeadline(interview);
  const submittedAt = getInterviewSubmittedAt(interview);
  if (!interview?.answered || !submittedAt) return false;
  if (!deadline) return true;
  return new Date(submittedAt).getTime() <= new Date(deadline).getTime();
}

function getInterviewAdminStatus(interview) {
  if (interview?.paid || interview?.payment_status === "paid") return { label: "PAID", color: "#4ade80", bg: "#14532d" };
  if (interview?.completed || interview?.status === "complete" || interview?.status === "completed") return { label: "COMPLETE", color: "#93c5fd", bg: "#1e3a8a" };
  if (interview?.answered) {
    if (!isInterviewOnTime(interview)) return { label: "LATE / UNPAID", color: "#f87171", bg: "#3f1212" };
    return { label: "SUBMITTED", color: "#facc15", bg: "#3a2a00" };
  }
  const deadline = getInterviewDeadline(interview);
  if (deadline && new Date().getTime() > new Date(deadline).getTime()) return { label: "MISSING", color: "#f87171", bg: "#3f1212" };
  return { label: "OPEN", color: "#93c5fd", bg: "#172554" };
}


const emptyQuestions = () => ["", "", ""];

const removedDriverNumbers = new Set(["16"]);
const removedDriverNames = new Set(["vtfan_25"]);

function isRemovedLeagueInterview(interview) {
  const numberKey = String(interview?.driver_number ?? "").trim();
  const nameKey = String(interview?.driver_name ?? "").trim().toLowerCase();
  return removedDriverNumbers.has(numberKey) || removedDriverNames.has(nameKey);
}

// ─── Facebook export helpers ─────────────────────────────────────────────────
function buildFacebookText(interview) {
  const isPre = interview.type === "pre";
  const tag = isPre ? "🎤 PRE-RACE INTERVIEW" : "🏆 POST-RACE INTERVIEW";
  const qa = Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [];
  const qaText = qa
    .filter(item => item.question && item.answer)
    .map(item => `❓ ${item.question}\n💬 "${item.answer}"`)
    .join("\n\n");
  const hashtags = isPre
    ? "#BudweiserCupLeague #PreRace #Racing #SimRacing"
    : "#BudweiserCupLeague #PostRace #Racing #SimRacing";
  return `${tag}\n#${interview.driver_number} ${interview.driver_name}\n🏁 ${interview.race_name}\n\n${qaText}\n\n${hashtags}`;
}

// Wrap text on a canvas given a max width — returns an array of lines
function wrapCanvasText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Render a single interview to a 1080x1350 PNG (Facebook portrait format)
function renderInterviewToCanvas(interview) {
  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  const isPre = interview.type === "pre";
  const accentColor = isPre ? "#3b82f6" : "#22c55e";
  const goldColor = "#d4af37";

  // Background — dark gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "#18202b");
  bgGrad.addColorStop(0.5, "#0d1117");
  bgGrad.addColorStop(1, "#090c11");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Decorative accent circle (top-right)
  ctx.fillStyle = `${accentColor}22`;
  ctx.beginPath();
  ctx.arc(W - 80, 80, 220, 0, Math.PI * 2);
  ctx.fill();

  // Gold border
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, W - 40, H - 40);

  // ── Header band ────────────────────────────
  ctx.fillStyle = "#0f1218";
  ctx.fillRect(40, 40, W - 80, 110);
  ctx.fillStyle = goldColor;
  ctx.font = "bold 36px Arial";
  ctx.textAlign = "left";
  ctx.fillText("BUDWEISER CUP LEAGUE", 70, 100);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#bbb";
  ctx.fillText("Driver Interview", 70, 130);

  // ── Pre/Post tag ───────────────────────────
  const tagText = isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE";
  ctx.font = "bold 28px Arial";
  ctx.fillStyle = accentColor;
  ctx.fillRect(40, 180, 280, 50);
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText(tagText, 180, 215);

  // ── Driver number circle ───────────────────
  const cx = 130, cy = 320, radius = 70;
  ctx.fillStyle = "#404854";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.font = "bold 56px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(interview.driver_number), cx, cy);

  // ── Driver name & race ─────────────────────
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = goldColor;
  ctx.font = "bold 44px Arial";
  ctx.fillText(interview.driver_name, 230, 310);
  ctx.fillStyle = "#aaa";
  ctx.font = "26px Arial";
  ctx.fillText(`🏁 ${interview.race_name}`, 230, 350);

  // ── Q&A section ────────────────────────────
  const qa = (Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [])
    .filter(item => item.question && item.answer);

  let y = 430;
  const leftMargin = 60;
  const maxWidth = W - 120;

  for (const item of qa) {
    // Accent line
    ctx.fillStyle = accentColor;
    ctx.fillRect(leftMargin, y - 20, 6, 100);

    // Question
    ctx.fillStyle = "#ddd";
    ctx.font = "bold 24px Arial";
    const qLines = wrapCanvasText(ctx, `Q: ${item.question}`, maxWidth - 30);
    for (const line of qLines.slice(0, 3)) {
      ctx.fillText(line, leftMargin + 24, y);
      y += 32;
    }
    y += 8;

    // Answer
    ctx.fillStyle = "white";
    ctx.font = "italic 26px Arial";
    const aLines = wrapCanvasText(ctx, `"${item.answer}"`, maxWidth - 30);
    for (const line of aLines.slice(0, 5)) {
      ctx.fillText(line, leftMargin + 24, y);
      y += 36;
    }
    y += 30;

    if (y > H - 120) break; // out of room
  }

  // ── Footer ──────────────────────────────────
  ctx.fillStyle = "#0f1218";
  ctx.fillRect(40, H - 90, W - 80, 50);
  ctx.fillStyle = goldColor;
  ctx.font = "bold 18px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BUDWEISER CUP LEAGUE • #BudCupLeague", W / 2, H - 58);

  return canvas;
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
}

function safeFileName(s) {
  return String(s).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

export default function InterviewsPage({ drivers = [], arcaDrivers = [], tracks = [], arcaTracks = [], seasons = [], activeSeasonId = "" }) {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [previewInterview, setPreviewInterview] = useState(null);
  const previewCanvasRef = useRef(null);

  // Filters
  const [filterDriver, setFilterDriver] = useState("");
  const [filterRace, setFilterRace] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterAnswered, setFilterAnswered] = useState("");
  const [filterSeries, setFilterSeries] = useState("cup");

  // Bulk export
  const [bulkRace, setBulkRace] = useState("");
  const [bulkType, setBulkType] = useState("");

  // Form state — only questions, no answers
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [selectedRace, setSelectedRace] = useState("");
  const [interviewType, setInterviewType] = useState("pre");
  const [interviewSeries, setInterviewSeries] = useState("cup");
  const [questions, setQuestions] = useState(emptyQuestions());
  const [deadlineAt, setDeadlineAt] = useState("");
  const [interviewBonus, setInterviewBonus] = useState(INTERVIEW_DEFAULT_BONUS);
  const [processingInterviewId, setProcessingInterviewId] = useState(null);

  // Auto-detect next upcoming race based on selected series
  const nextRace = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tracksToUse = interviewSeries === "arca" ? arcaTracks : tracks;
    return [...tracksToUse]
      .filter(t => t.date)
      .map(t => ({ ...t, dateObj: new Date(t.date + "T12:00:00") }))
      .sort((a, b) => a.dateObj - b.dateObj)
      .find(t => { const d = new Date(t.dateObj); d.setHours(0, 0, 0, 0); return d >= today; });
  }, [tracks, arcaTracks, interviewSeries]);

  useEffect(() => {
    setSelectedDriverId(""); // Reset driver when series changes
    setSelectedRace(""); // Reset race when series changes
  }, [interviewSeries]);

  useEffect(() => {
    loadInterviews();
    setSelectedDriverId(""); // Reset driver when series changes
    setSelectedRace(""); // Reset race when series changes
  }, [filterSeries]);

  // Render preview into the modal canvas when an interview is being previewed
  useEffect(() => {
    if (previewInterview && previewCanvasRef.current) {
      const canvas = renderInterviewToCanvas(previewInterview);
      const target = previewCanvasRef.current;
      target.width = canvas.width;
      target.height = canvas.height;
      const ctx = target.getContext("2d");
      ctx.drawImage(canvas, 0, 0);
    }
  }, [previewInterview]);

  async function loadInterviews() {
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .eq("series", filterSeries)
      .order("generated_at", { ascending: false });
    if (!error) setInterviews((data || []).filter((interview) => !isRemovedLeagueInterview(interview)));
    setLoading(false);
  }

  async function deleteInterview(id) {
    if (!window.confirm("Delete this interview?")) return;
    await supabase.from("interviews").delete().eq("id", id);
    setInterviews(prev => prev.filter(i => i.id !== id));
  }

  async function publishQuestions() {
    if (!selectedDriverId) { setSaveStatus("⚠️ Please select a driver."); return; }
    if (!selectedRace) { setSaveStatus("⚠️ Please select a race."); return; }
    const filled = questions.filter(q => q.trim());
    if (filled.length === 0) { setSaveStatus("⚠️ Please enter at least one question."); return; }

    const driver = (interviewSeries === "arca" ? arcaDrivers : drivers).find(d => String(d.id) === String(selectedDriverId));
    if (!driver) { setSaveStatus("⚠️ Driver not found."); return; }

    const exists = interviews.some(
      i => String(i.driver_id) === String(driver.id) && i.race_name === selectedRace && i.type === interviewType
    );
    if (exists) {
      setSaveStatus(`⚠️ A ${interviewType}-race interview for ${driver.name} at ${selectedRace} already exists. Delete it first to replace.`);
      return;
    }

    setSaving(true);
    setSaveStatus("");

    // Save with questions only — answers are empty, driver fills them in
    const qa = filled.map(q => ({ question: q, answer: "" }));

    const { data: saved, error } = await supabase.from("interviews").insert({
      driver_id: driver.id,
      driver_name: driver.name,
      driver_number: driver.number,
      race_name: selectedRace,
      type: interviewType,
      series: interviewSeries,
      questions_and_answers: qa,
      answered: false,
      generated_at: new Date().toISOString(),
      deadline_at: toIsoOrNull(deadlineAt),
      due_at: toIsoOrNull(deadlineAt),
      bonus_amount: Math.max(0, Number(interviewBonus) || 0),
      status: "open",
      completed: false,
      paid: false,
      payment_status: "unpaid",
      team: driver.team || "Independent",
    }).select().single();

    if (error) {
      setSaveStatus(`❌ Failed: ${error.message}`);
    } else {
      setInterviews(prev => [saved, ...prev]);
      setQuestions(emptyQuestions());
      setSaveStatus(`✅ Questions published to ${driver.name}'s profile! Waiting for their answers.`);
    }
    setSaving(false);
  }

  function getDriverTeam(driver) {
    return driver?.team || "Independent";
  }

  function getFinanceKeysForTeam(team) {
    return Array.from(new Set([team, getTeamFullName(team)].filter(Boolean).map((value) => String(value).trim())));
  }

  async function loadFinanceRowForTeam(team) {
    const financeKeys = getFinanceKeysForTeam(team);
    const { data, error } = await supabase
      .from("team_finances")
      .select("*")
      .in("team", financeKeys)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`Failed to load finance row for ${team}:`, error);
      return null;
    }

    return Array.isArray(data) && data.length ? data[0] : null;
  }

  async function ensureFinanceRowForTeam(team) {
    const existing = await loadFinanceRowForTeam(team);
    if (existing?.id) return existing;

    const teamDriverCount = (drivers || []).filter((driver) => String(driver?.team || "") === String(team)).length;
    const startingBalance = Math.max(getTeamStartingBudget(teamDriverCount, team), 700000);

    const { data: createdRow, error } = await supabase
      .from("team_finances")
      .insert([{
        team,
        balance: startingBalance,
        payroll_spent: 0,
        signing_bonus_spent: 0,
        buyout_spent: 0,
        number_pool_spent: 0,
        updated_at: new Date().toISOString(),
      }])
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(`Could not create finance row for ${team}:`, error);
      return null;
    }

    return createdRow || null;
  }

  async function markCompleteAndPay(interview) {
    if (!interview?.id) return;
    if (!interview.answered) {
      setSaveStatus("⚠️ This interview has not been submitted yet, so it cannot be paid.");
      return;
    }
    if (!isInterviewOnTime(interview)) {
      setSaveStatus("⚠️ This interview was submitted late, so the team is not eligible for payment.");
      return;
    }
    if (interview.paid || interview.payment_status === "paid") {
      setSaveStatus("⚠️ This interview has already been paid.");
      return;
    }

    const driverPool = interview.series === "arca" ? arcaDrivers : drivers;
    const driver = (driverPool || []).find((item) => String(item.id) === String(interview.driver_id) || String(item.number) === String(interview.driver_number));
    const team = interview.team || getDriverTeam(driver);
    const amount = Math.max(0, Number(interview.bonus_amount ?? interview.payment_amount ?? INTERVIEW_DEFAULT_BONUS) || 0);

    if (!team || team === "Independent") {
      setSaveStatus("⚠️ This driver is not attached to a paid team, so no team payment was made.");
      return;
    }
    if (amount <= 0) {
      setSaveStatus("⚠️ Bonus amount must be greater than $0 before payment can be processed.");
      return;
    }

    setProcessingInterviewId(interview.id);
    setSaveStatus("");

    const financeRow = await ensureFinanceRowForTeam(team);
    if (!financeRow?.id) {
      setProcessingInterviewId(null);
      setSaveStatus("❌ Could not find or create this team's finance row. Check team_finances insert/select policies.");
      return;
    }

    const timestamp = new Date().toISOString();
    const nextBalance = Number(financeRow.balance || 0) + amount;

    const { error: financeError } = await supabase
      .from("team_finances")
      .update({ balance: nextBalance, updated_at: timestamp })
      .eq("id", financeRow.id);

    if (financeError) {
      console.error("Could not pay interview bonus:", financeError);
      setProcessingInterviewId(null);
      setSaveStatus("❌ Interview was not paid. Check team_finances update policy.");
      return;
    }

    const paymentPayload = {
      completed: true,
      completed_at: timestamp,
      status: "complete",
      paid: true,
      paid_at: timestamp,
      paid_amount: amount,
      payment_status: "paid",
      team,
    };

    const { data: updatedInterview, error: interviewError } = await supabase
      .from("interviews")
      .update(paymentPayload)
      .eq("id", interview.id)
      .select()
      .single();

    if (interviewError) {
      console.error("Team was paid but interview could not be marked paid:", interviewError);
      setSaveStatus("⚠️ Team was paid, but the interview record was not marked paid. Check interviews table columns/RLS.");
      await loadInterviews();
      setProcessingInterviewId(null);
      return;
    }

    await supabase.from("team_payment_logs").insert([{
      from_team: "Budweiser Cup League",
      to_team: team,
      amount,
      reason: `Interview bonus: #${interview.driver_number} ${interview.driver_name} — ${interview.race_name} ${interview.type}-race`,
      deal_type: "Interview Bonus",
      driver_id: interview.driver_id || null,
      driver_name: interview.driver_name || null,
      number: interview.driver_number || null,
      request_id: interview.id,
      created_by: "League Admin",
      created_at: timestamp,
    }]);

    setInterviews((prev) => prev.map((item) => item.id === interview.id ? updatedInterview : item));
    setProcessingInterviewId(null);
    setSaveStatus(`✅ Marked complete and paid ${money(amount)} to ${getTeamFullName(team)}.`);
  }

  // ─── Export handlers ──────────────────────────────────────────────────────
  async function copyTextToClipboard(interview) {
    const text = buildFacebookText(interview);
    try {
      await navigator.clipboard.writeText(text);
      setExportStatus(`✅ Copied ${interview.driver_name}'s ${interview.type}-race interview to clipboard! Paste into Facebook.`);
      setTimeout(() => setExportStatus(""), 4000);
    } catch (err) {
      // Fallback for browsers/contexts where clipboard API fails
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setExportStatus(`✅ Copied to clipboard!`);
      setTimeout(() => setExportStatus(""), 4000);
    }
  }

  function exportInterviewImage(interview) {
    const canvas = renderInterviewToCanvas(interview);
    const filename = `${safeFileName(interview.driver_name)}-${safeFileName(interview.race_name)}-${interview.type}-race.png`;
    downloadCanvas(canvas, filename);
    setExportStatus(`✅ Image downloaded: ${filename}`);
    setTimeout(() => setExportStatus(""), 4000);
  }

  function bulkExportImages() {
    if (!bulkRace) { setExportStatus("⚠️ Pick a race for bulk export."); return; }
    const target = interviews.filter(i => {
      if (i.race_name !== bulkRace) return false;
      if (bulkType && i.type !== bulkType) return false;
      return i.answered;
    });
    if (target.length === 0) {
      setExportStatus(`⚠️ No answered interviews found for ${bulkRace}${bulkType ? ` (${bulkType}-race)` : ""}.`);
      return;
    }
    target.forEach((interview, idx) => {
      // Slight stagger so the browser doesn't choke on simultaneous downloads
      setTimeout(() => {
        const canvas = renderInterviewToCanvas(interview);
        const filename = `${safeFileName(interview.driver_name)}-${safeFileName(interview.race_name)}-${interview.type}-race.png`;
        downloadCanvas(canvas, filename);
      }, idx * 300);
    });
    setExportStatus(`✅ Exporting ${target.length} interview image${target.length === 1 ? "" : "s"} for ${bulkRace}...`);
    setTimeout(() => setExportStatus(""), 5000);
  }

  async function bulkCopyText() {
    if (!bulkRace) { setExportStatus("⚠️ Pick a race for bulk copy."); return; }
    const target = interviews.filter(i => {
      if (i.race_name !== bulkRace) return false;
      if (bulkType && i.type !== bulkType) return false;
      return i.answered;
    });
    if (target.length === 0) {
      setExportStatus(`⚠️ No answered interviews found for ${bulkRace}${bulkType ? ` (${bulkType}-race)` : ""}.`);
      return;
    }
    const combined = target.map(buildFacebookText).join("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n");
    try {
      await navigator.clipboard.writeText(combined);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = combined;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setExportStatus(`✅ Copied ${target.length} interview${target.length === 1 ? "" : "s"} to clipboard!`);
    setTimeout(() => setExportStatus(""), 5000);
  }

  const allDriverNames = [...new Set(interviews.map(i => i.driver_name).filter(Boolean))].sort();
  const allRaces = [...new Set(interviews.map(i => i.race_name).filter(Boolean))].sort();

  const filtered = interviews.filter(i => {
    if (filterDriver && i.driver_name !== filterDriver) return false;
    if (filterRace && i.race_name !== filterRace) return false;
    if (filterType && i.type !== filterType) return false;
    if (filterAnswered === "answered" && !i.answered) return false;
    if (filterAnswered === "pending" && i.answered) return false;
    if (filterAnswered === "paid" && !(i.paid || i.payment_status === "paid")) return false;
    if (filterAnswered === "unpaid" && (!i.answered || i.paid || i.payment_status === "paid")) return false;
    return true;
  });

  const grouped = filtered.reduce((acc, interview) => {
    const key = interview.race_name || "Unknown Race";
    if (!acc[key]) acc[key] = [];
    acc[key].push(interview);
    return acc;
  }, {});

  const pendingCount = interviews.filter(i => !i.answered && (i.questions_and_answers || []).some(q => q.question)).length;
  const answeredCount = interviews.filter(i => i.answered).length;

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>🎙️ Driver Interviews</h1>
            <div style={{ opacity: 0.6, fontSize: 14, marginTop: 4 }}>
              {answeredCount} answered · {pendingCount} awaiting response
            </div>
          </div>
          <button onClick={() => window.location.pathname = "/"} style={secondaryButtonStyle}>← Admin</button>
        </div>

        {/* Post Questions Form */}
        <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>Post Interview Questions</h2>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 20 }}>
            Type up to 3 questions. They appear on the driver's profile page where the driver types their answers and submits back here.
          </div>

          {/* Step 1: Series Selection */}
          <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "2px solid #2c3440" }}>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#d4af37", letterSpacing: 1.2, textTransform: "uppercase" }}>Step 1: Select Series</div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setInterviewSeries("cup")} style={{ ...(interviewSeries === "cup" ? { ...blueButtonStyle, flex: 1, fontSize: 14, padding: "12px 16px" } : { ...secondaryButtonStyle, flex: 1, fontSize: 14, padding: "12px 16px" }) }}>🏁 Cup Series</button>
              <button onClick={() => setInterviewSeries("arca")} style={{ ...(interviewSeries === "arca" ? { ...greenButtonStyle, flex: 1, fontSize: 14, padding: "12px 16px" } : { ...secondaryButtonStyle, flex: 1, fontSize: 14, padding: "12px 16px" }) }}>🏎️ ARCA Series</button>
            </div>
          </div>

          {/* Step 2-4: Driver, Race, Type */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            {/* Step 2: Driver Selection */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#d4af37" }}>Step 2: Driver</div>
              <select style={selectStyle} value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)}>
                <option value="">Select driver...</option>
                {[...(interviewSeries === "arca" ? arcaDrivers : drivers)].filter(d => !d.retired).sort((a, b) => a.number - b.number).map(d => (
                  <option key={d.id} value={d.id}>#{d.number} {d.name}</option>
                ))}
              </select>
            </div>

            {/* Step 3: Race Selection */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#d4af37" }}>
                Step 3: Race {nextRace && <span style={{ color: "#d4af37", fontWeight: 400 }}>→ {nextRace.name}</span>}
              </div>
              <select style={selectStyle} value={selectedRace} onChange={e => setSelectedRace(e.target.value)}>
                <option value="">Select race...</option>
                {[...(interviewSeries === "arca" ? arcaTracks : tracks)].sort((a, b) => {
                  if (a.date && b.date) return new Date(a.date) - new Date(b.date);
                  return a.name.localeCompare(b.name);
                }).map(t => (
                  <option key={t.name} value={t.name}>
                    {t.name}{t.date ? ` (${new Date(t.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })})` : ""}
                    {t.name === nextRace?.name ? " ← Next" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 4: Interview Type */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#d4af37" }}>Step 4: Type</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setInterviewType("pre")} style={{ ...(interviewType === "pre" ? blueButtonStyle : secondaryButtonStyle), flex: 1, fontSize: 13 }}>🎤 Pre</button>
                <button onClick={() => setInterviewType("post")} style={{ ...(interviewType === "post" ? greenButtonStyle : secondaryButtonStyle), flex: 1, fontSize: 13 }}>🏆 Post</button>
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Submission Deadline</div>
              <input type="datetime-local" value={deadlineAt} onChange={(e) => setDeadlineAt(e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>Drivers must submit before this time to be eligible for admin-approved payment.</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Team Bonus</div>
              <input type="number" min="0" step="1000" value={interviewBonus} onChange={(e) => setInterviewBonus(e.target.value)} style={inputStyle} />
              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>Paid only after you click Mark Complete & Pay Team.</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            {questions.map((q, i) => (
              <div key={i}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: interviewType === "pre" ? "#3b82f6" : "#22c55e" }}>
                  Question {i + 1}
                </div>
                <textarea
                  rows={2}
                  style={inputStyle}
                  placeholder={`Type question ${i + 1}...`}
                  value={q}
                  onChange={e => setQuestions(prev => prev.map((item, idx) => idx === i ? e.target.value : item))}
                />
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button style={{ ...primaryButtonStyle, opacity: saving ? 0.6 : 1 }} disabled={saving} onClick={publishQuestions}>
              {saving ? "Posting..." : "📤 Post Questions to Driver"}
            </button>
            <button style={secondaryButtonStyle} onClick={() => { setQuestions(emptyQuestions()); setDeadlineAt(""); setInterviewBonus(INTERVIEW_DEFAULT_BONUS); setSaveStatus(""); }}>Clear</button>
          </div>

          {saveStatus && (
            <div style={{ marginTop: 14, fontSize: 13, padding: "10px 14px", background: "#0a0d12", borderRadius: 10, border: "1px solid #2c3440" }}>
              {saveStatus}
            </div>
          )}
        </div>

        {/* ─── Facebook Export (Bulk) ─────────────────────────────────────── */}
        <div style={{ ...sectionCardStyle, border: "1px solid #d4af37" }}>
          <h2 style={{ marginTop: 0, marginBottom: 4 }}>📘 Facebook Export</h2>
          <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 20 }}>
            Export answered interviews as branded image cards (1080×1350, perfect for Facebook) or copy as ready-to-paste text. Use the buttons on individual interviews below, or bulk export by race here.
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race</div>
              <select style={selectStyle} value={bulkRace} onChange={e => setBulkRace(e.target.value)}>
                <option value="">Select race...</option>
                {allRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Type</div>
              <select style={selectStyle} value={bulkType} onChange={e => setBulkType(e.target.value)}>
                <option value="">Pre & Post</option>
                <option value="pre">Pre-Race only</option>
                <option value="post">Post-Race only</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={bulkExportImages} style={primaryButtonStyle}>🖼️ Export All as Images</button>
            <button onClick={bulkCopyText} style={secondaryButtonStyle}>📋 Copy All as Text</button>
          </div>

          {exportStatus && (
            <div style={{ marginTop: 14, fontSize: 13, padding: "10px 14px", background: "#0a0d12", borderRadius: 10, border: "1px solid #2c3440" }}>
              {exportStatus}
            </div>
          )}
        </div>

        {/* Filters */}
        <div style={sectionCardStyle}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Driver</div>
              <select style={selectStyle} value={filterDriver} onChange={e => setFilterDriver(e.target.value)}>
                <option value="">All Drivers</option>
                {allDriverNames.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race</div>
              <select style={selectStyle} value={filterRace} onChange={e => setFilterRace(e.target.value)}>
                <option value="">All Races</option>
                {allRaces.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Type</div>
              <select style={selectStyle} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Pre & Post</option>
                <option value="pre">Pre-Race</option>
                <option value="post">Post-Race</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Status</div>
              <select style={selectStyle} value={filterAnswered} onChange={e => setFilterAnswered(e.target.value)}>
                <option value="">All</option>
                <option value="answered">Answered</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid Submitted</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Series</div>
              <select style={selectStyle} value={filterSeries} onChange={e => setFilterSeries(e.target.value)}>
                <option value="cup">Cup Series</option>
                <option value="arca">ARCA Series</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button onClick={() => { setFilterDriver(""); setFilterRace(""); setFilterType(""); setFilterAnswered(""); }} style={{ ...secondaryButtonStyle, width: "100%" }}>
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Interview List */}
        {loading ? (
          <div style={sectionCardStyle}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...sectionCardStyle, opacity: 0.7, textAlign: "center", padding: 40 }}>
            No interviews yet. Post some questions above.
          </div>
        ) : (
          Object.entries(grouped).map(([raceName, raceInterviews]) => (
            <div key={raceName} style={sectionCardStyle}>
              <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 16, borderBottom: "1px solid #2c3440", paddingBottom: 12 }}>
                🏁 {raceName}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {raceInterviews.map(interview => {
                  const isPre = interview.type === "pre";
                  const qa = Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [];
                  const isAnswered = interview.answered;
                  const adminStatus = getInterviewAdminStatus(interview);
                  const deadline = getInterviewDeadline(interview);
                  const submittedAt = getInterviewSubmittedAt(interview);
                  const bonusAmount = Math.max(0, Number(interview.bonus_amount ?? interview.payment_amount ?? INTERVIEW_DEFAULT_BONUS) || 0);
                  const canPay = isAnswered && isInterviewOnTime(interview) && !(interview.paid || interview.payment_status === "paid");
                  return (
                    <div key={interview.id} style={{ background: "#0f1319", border: `1px solid ${isAnswered ? (isPre ? "#1e3a6e" : "#1a5c30") : "#3a3a1a"}`, borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                            <span style={{ background: isPre ? "#3b82f6" : "#22c55e", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
                              {isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE"}
                            </span>
                            <span style={{ fontSize: 16, fontWeight: 800 }}>#{interview.driver_number} {interview.driver_name}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: isAnswered ? "#14532d" : "#3a2a00", color: isAnswered ? "#4ade80" : "#f59e0b" }}>
                              {isAnswered ? "✅ Answered" : "⏳ Awaiting Answer"}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 6, background: adminStatus.bg, color: adminStatus.color }}>
                              {adminStatus.label}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.62, lineHeight: 1.6 }}>
                            Posted: {interview.generated_at ? new Date(interview.generated_at).toLocaleString() : "—"}<br />
                            Deadline: {formatDateTime(deadline)}<br />
                            Submitted: {submittedAt ? formatDateTime(submittedAt) : "Not submitted"}<br />
                            Team bonus: {money(bonusAmount)} {interview.paid || interview.payment_status === "paid" ? `· Paid ${interview.paid_at ? formatDateTime(interview.paid_at) : ""}` : "· Not paid"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {isAnswered && (
                            <>
                              <button onClick={() => copyTextToClipboard(interview)} style={exportButtonStyle} title="Copy formatted text for Facebook">📋 Copy Text</button>
                              <button onClick={() => exportInterviewImage(interview)} style={exportButtonStyle} title="Download as image card">🖼️ Image</button>
                              <button onClick={() => setPreviewInterview(interview)} style={exportButtonStyle} title="Preview image card">👁️ Preview</button>
                            </>
                          )}
                          {canPay && (
                            <button
                              onClick={() => markCompleteAndPay(interview)}
                              disabled={processingInterviewId === interview.id}
                              style={{ ...greenButtonStyle, padding: "6px 12px", fontSize: 12, opacity: processingInterviewId === interview.id ? 0.6 : 1 }}
                            >
                              {processingInterviewId === interview.id ? "Paying..." : "✅ Mark Complete & Pay Team"}
                            </button>
                          )}
                          {isAnswered && !canPay && !(interview.paid || interview.payment_status === "paid") && (
                            <span style={{ alignSelf: "center", fontSize: 11, color: "#f87171", fontWeight: 800 }}>Not eligible for payment</span>
                          )}
                          <button onClick={() => deleteInterview(interview.id)} style={dangerButtonStyle}>Delete</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        {qa.map((item, i) => (
                          <div key={i} style={{ borderLeft: `3px solid ${isPre ? "#3b82f6" : "#22c55e"}`, paddingLeft: 14 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, marginBottom: 6 }}>Q: {item.question}</div>
                            {item.answer ? (
                              <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic", color: "#e2e8f0" }}>"{item.answer}"</div>
                            ) : (
                              <div style={{ fontSize: 12, opacity: 0.4, fontStyle: "italic" }}>No answer yet...</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* ─── Preview Modal ──────────────────────────────────────────────── */}
        {previewInterview && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
            onClick={() => setPreviewInterview(null)}
          >
            <div
              style={{ background: "#151a22", border: "1px solid #d4af37", borderRadius: 20, padding: 24, maxWidth: 600, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 18, fontWeight: 900 }}>📘 Facebook Post Preview</div>
                <button onClick={() => setPreviewInterview(null)} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer" }}>×</button>
              </div>
              <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                <canvas ref={previewCanvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                <button onClick={() => exportInterviewImage(previewInterview)} style={primaryButtonStyle}>⬇️ Download Image</button>
                <button onClick={() => copyTextToClipboard(previewInterview)} style={secondaryButtonStyle}>📋 Copy Text</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
