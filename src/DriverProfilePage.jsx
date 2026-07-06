import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import teamLogoB2J from "./assets/teams/B2J.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import teamLogoBWR from "./assets/teams/BWR.png";
import teamLogoBXM from "./assets/teams/BXM.png";
import teamLogoTMS from "./assets/teams/TMS.png";
import { supabase } from "./lib/supabase";
import { getLeagueSession } from "./lib/leagueAuth";
import { uploadCarFile, getCarUploads, deleteCarUpload } from "./lib/carUploads";
// import { ReportIssueModal } from "./components/ReportIssueModal"; // TODO: Uncomment once ReportIssueModal.jsx is in repo

const teamLogos = {
  "B2J MOTORSPORTS": teamLogoB2J,
  B2J: teamLogoB2J,
  "ME RACING": teamLogoMER,
  MER: teamLogoMER,
  MMS: teamLogoMMS,
  NLM: teamLogoNLM,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  "Big Wheel Racing": teamLogoBWR,
  BWR: teamLogoBWR,
  "ME Racing": teamLogoMER,
  BXM: teamLogoBXM,
  "BayouX Motorsports": teamLogoBXM,
  TMS: teamLogoTMS,
  "Tolbert Motorsports": teamLogoTMS,
};

const teamFullNames = {
  B2J: "B2J Motorsports",
    MER: "ME Racing",
  "B2J MOTORSPORTS": "B2J Motorsports",
  MER: "ME Racing",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
    IND: "Independent",
  Independent: "Independent",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
  BWR: "Big Wheel Racing",
  "Big Wheel Racing": "Big Wheel Racing",
  "ME Racing": "ME Racing",
  BXM: "BayouX Motorsports",
  "BayouX Motorsports": "BayouX Motorsports",
  TMS: "Tolbert Motorsports",
  "Tolbert Motorsports": "Tolbert Motorsports",
};

const teamThemes = {
  B2J: { accent: "#d4af37", glow: "rgba(212,175,55,0.28)", dark: "#2a230f" },
  "B2J MOTORSPORTS": { accent: "#d4af37", glow: "rgba(212,175,55,0.28)", dark: "#2a230f" },
  MER: { accent: "#ef4444", glow: "rgba(239,68,68,0.28)", dark: "#2a1111" },
  "ME Racing": { accent: "#ef4444", glow: "rgba(239,68,68,0.28)", dark: "#2a1111" },
  MMS: { accent: "#22c55e", glow: "rgba(34,197,94,0.25)", dark: "#102a16" },
  NLM: { accent: "#3b82f6", glow: "rgba(59,130,246,0.26)", dark: "#0f1d35" },
  BWR: { accent: "#f97316", glow: "rgba(249,115,22,0.28)", dark: "#311707" },
  "Big Wheel Racing": { accent: "#f97316", glow: "rgba(249,115,22,0.28)", dark: "#311707" },
  "19XI": { accent: "#a855f7", glow: "rgba(168,85,247,0.28)", dark: "#251138" },
  "19XI Racing": { accent: "#a855f7", glow: "rgba(168,85,247,0.28)", dark: "#251138" },
  IND: { accent: "#9ca3af", glow: "rgba(156,163,175,0.24)", dark: "#1f2937" },
  Independent: { accent: "#9ca3af", glow: "rgba(156,163,175,0.24)", dark: "#1f2937" },
  BXM: { accent: "#2563eb", glow: "rgba(37,99,235,0.28)", dark: "#0f172a" },
  "BayouX Motorsports": { accent: "#2563eb", glow: "rgba(37,99,235,0.28)", dark: "#0f172a" },
  TMS: { accent: "#0891b2", glow: "rgba(8,145,178,0.28)", dark: "#052e33" },
  "Tolbert Motorsports": { accent: "#0891b2", glow: "rgba(8,145,178,0.28)", dark: "#052e33" },
};

function getTeamFullName(teamAbbr) {
  return teamFullNames[teamAbbr] || teamAbbr || "Independent";
}

function getTeamTheme(teamAbbr) {
  return teamThemes[teamAbbr] || { accent: "#d4af37", glow: "rgba(212,175,55,0.25)", dark: "#2a230f" };
}

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

const DEFAULT_RENEGOTIATION_FORM = {
  requested_salary: 250000,
  requested_signing_bonus: 0,
  requested_contract_length: 1,
  requested_buyout_amount: 375000,
  requested_win_bonus: 0,
  requested_championship_bonus: 0,
  message: "",
};

function clampScore(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function getSatisfactionStatus(score) {
  if (score >= 90) return { label: "Fully Bought In", color: "#147d35", bg: "rgba(52,199,89,0.10)" };
  if (score >= 75) return { label: "Happy", color: "#248a3d", bg: "rgba(52,199,89,0.08)" };
  if (score >= 60) return { label: "Stable", color: "#9a5a00", bg: "rgba(255,149,0,0.10)" };
  if (score >= 40) return { label: "Frustrated", color: "#c2410c", bg: "rgba(255,149,0,0.12)" };
  return { label: "At Risk", color: "#c62d24", bg: "rgba(255,59,48,0.10)" };
}


const DEFAULT_START_PARK_RACES = [
  { name: "Daytona (Night)", date: "2026-05-16" },
  { name: "Charlotte", date: "2026-05-23" },
  { name: "Nashville", date: "2026-05-30" },
  { name: "Michigan", date: "2026-06-06" },
  { name: "Pocono", date: "2026-06-13" },
  { name: "Bristol (Night)", date: "2026-06-20" },
  { name: "Las Vegas", date: "2026-06-27" },
  { name: "Talladega", date: "2026-07-11" },
  { name: "North Wilkesboro", date: "2026-07-18" },
  { name: "Indianapolis", date: "2026-07-25" },
  { name: "New Hampshire", date: "2026-08-01" },
  { name: "Phoenix", date: "2026-08-08" },
  { name: "Richmond", date: "2026-08-15" },
  { name: "Kansas", date: "2026-08-22" },
  { name: "Texas", date: "2026-08-29" },
  { name: "Iowa", date: "2026-09-05" },
  { name: "Homestead", date: "2026-09-12" },
];

const DEVELOPMENT_SERIES_OPTIONS = [
  { value: "xfinity", label: "Xfinity Series" },
  { value: "truck", label: "Truck Series" },
  { value: "arca", label: "ARCA Series" },
];

const DEVELOPMENT_FALLBACK_TEAMS = {
  xfinity: ["Xfinity Open Team"],
  truck: ["Truck Open Team"],
  arca: ["ARCA Open Team"],
};

function getDevelopmentStatusLabel(value) {
  const status = String(value || "pending").toLowerCase();
  if (status === "approved") return "Approved";
  if (status === "denied") return "Denied";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Cancelled";
  return "Pending";
}

function developmentBadgeStyle(value) {
  const status = String(value || "pending").toLowerCase();
  if (status === "approved" || status === "completed") return { background: "rgba(52,199,89,0.12)", color: "#147d35", borderColor: "rgba(52,199,89,0.30)" };
  if (status === "denied" || status === "cancelled") return { background: "rgba(255,59,48,0.10)", color: "#c62d24", borderColor: "rgba(255,59,48,0.28)" };
  return { background: "rgba(255,149,0,0.12)", color: "#9a5a00", borderColor: "rgba(255,149,0,0.30)" };
}



function getEasternNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour || 0),
    minute: Number(values.minute || 0),
  };
}

function getStartParkCutoffInfo(raceDate, now = new Date()) {
  if (!raceDate) return { closed: false, label: "Race date unavailable", dateKey: "", hour: 21, minute: 0 };
  const cutoffDateKey = String(raceDate).slice(0, 10);
  const easternNow = getEasternNowParts(now);
  const closed = easternNow.dateKey > cutoffDateKey ||
    (easternNow.dateKey === cutoffDateKey && (easternNow.hour > 21 || (easternNow.hour === 21 && easternNow.minute >= 0)));
  return {
    closed,
    label: `Deadline: Saturday ${cutoffDateKey} at 9:00 PM ET`,
    dateKey: cutoffDateKey,
    hour: 21,
    minute: 0,
  };
}

function wasStartParkRequestBeforeCutoff(request) {
  const raceDate = request?.race_date || request?.raceDate || "";
  const createdAt = request?.created_at || request?.createdAt || "";
  if (!raceDate || !createdAt) return true;
  const cutoffKey = `${String(raceDate).slice(0, 10)} 21:00`;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(createdAt));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const createdKey = `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
  return createdKey < cutoffKey;
}

const MASTER_ACCESS_CODE = "BCLADMINPASSWORD2026";

function normalizeAccessCode(value) {
  return String(value || "").trim().toUpperCase();
}

function loadLocalDriverAccessCodes() {
  try {
    const saved = localStorage.getItem("driverProfileAccessCodes");
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

async function loadRemoteDriverAccessCodes() {
  async function fetchCodes(selectColumns) {
    const { data, error } = await supabase
      .from("driver_access_codes")
      .select(selectColumns)
      .eq("active", true);

    if (error) {
      console.error(`Failed to load driver access codes with ${selectColumns}:`, error);
      return null;
    }

    return data || [];
  }

  let rows = await fetchCodes("driver_number, driver_name, code, active");

  if (!rows) {
    rows = await fetchCodes("driver_number, driver_name, access_code, active");
  }

  if (!rows) {
    return loadLocalDriverAccessCodes();
  }

  const nextCodes = {};
  rows.forEach((row) => {
    const code = row.code || row.access_code;
    if (!code) return;
    if (row.driver_number) nextCodes[String(row.driver_number)] = code;
    if (row.driver_name) nextCodes[String(row.driver_name).toLowerCase()] = code;
  });

  localStorage.setItem("driverProfileAccessCodes", JSON.stringify(nextCodes));
  return nextCodes;
}

const appleFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

const appShellStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(255,255,255,0.95), rgba(245,245,247,0.94) 36%, rgba(229,229,234,0.98) 100%)",
  color: "#1d1d1f",
  fontFamily: appleFont,
};
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 20 };
const sectionCardStyle = {
  background: "linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.60))",
  border: "1px solid rgba(255,255,255,0.78)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 20,
  boxShadow: "0 20px 55px rgba(15,23,42,0.08)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};
const primaryButtonStyle = {
  background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "11px 18px",
  fontWeight: 900,
  fontFamily: appleFont,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(0,122,255,0.24)",
};
const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.72)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 999,
  padding: "11px 18px",
  fontWeight: 900,
  fontFamily: appleFont,
  cursor: "pointer",
};
const dangerButtonStyle = {
  background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
  color: "#ffffff",
  border: "none",
  borderRadius: 999,
  padding: "11px 18px",
  fontWeight: 900,
  fontFamily: appleFont,
  cursor: "pointer",
  boxShadow: "0 12px 28px rgba(255,59,48,0.24)",
};
const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.72)",
  color: "#1d1d1f",
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  padding: "11px 13px",
  boxSizing: "border-box",
  fontFamily: appleFont,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
};
const statBoxStyle = {
  background: "rgba(255,255,255,0.76)",
  border: "1px solid rgba(229,231,235,0.9)",
  borderRadius: 20,
  padding: 16,
  flex: "1 1 160px",
  boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
};
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = {
  textAlign: "left",
  padding: 10,
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(0,0,0,0.03)",
  fontSize: 12,
  fontWeight: 950,
  color: "#6e6e73",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const tdStyle = {
  padding: 10,
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  verticalAlign: "top",
  fontSize: 14,
  color: "#1d1d1f",
};

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}


function isClosedOrRemovedDriver(driver) {
  const numberKey = String(driver?.number ?? driver?.driver_number ?? "").trim();
  const nameKey = String(driver?.name ?? driver?.driver_name ?? "").trim().toLowerCase();
  return (
    numberKey === "66" ||
    numberKey === "76" ||
    nameKey === "undeadhelliday" ||
    nameKey === "bcr_ziggy5525"
  );
}

function normalizeBigDiehlMerDriver(driver) {
  const nameKey = String(driver?.name ?? driver?.driver_name ?? "").trim().toLowerCase();

  if (nameKey === "knighttrain41") {
    return {
      ...driver,
      number: 41,
      manufacturer: "Chevrolet",
      team: "BXM",
      retired: false,
    };
  }

  if (nameKey === "mare951") {
    return {
      ...driver,
      manufacturer: "Ford",
      team: driver?.team || "BWR",
      retired: false,
    };
  }

  if (Number(driver?.id) === 46 || nameKey === "bigdiehl21") {
    return {
      ...driver,
      id: 46,
      number: 39,
      name: "BigDiehl21",
      manufacturer: "Chevrolet",
      manufacturerLogo: driver?.manufacturerLogo || null,
      team: "MER",
      retired: false,
    };
  }

  return driver;
}

function normalizeBigDiehlMerResult(result) {
  const nameKey = String(result?.name ?? result?.driver_name ?? "").trim().toLowerCase();

  if (nameKey === "knighttrain41") {
    return {
      ...result,
      number: 41,
      manufacturer: "Chevrolet",
      team: "BXM",
    };
  }

  if (nameKey === "mare951") {
    return {
      ...result,
      manufacturer: "Ford",
      team: result?.team || "BWR",
    };
  }

  if (Number(result?.driverId) === 46 || Number(result?.driver_id) === 46 || nameKey === "bigdiehl21") {
    return {
      ...result,
      driverId: 46,
      number: 39,
      name: "BigDiehl21",
      manufacturer: "Chevrolet",
      team: "MER",
    };
  }

  return result;
}

function normalizeDriverProfileRoster(drivers = []) {
  if (!Array.isArray(drivers)) return [];
  return drivers
    .filter((driver) => !isClosedOrRemovedDriver(driver))
    .map(normalizeBigDiehlMerDriver);
}

function normalizeDriverProfileRaceHistory(raceHistory = []) {
  if (!Array.isArray(raceHistory)) return [];
  return raceHistory.map((race) => ({
    ...race,
    results: Array.isArray(race?.results)
      ? race.results
          .filter((result) => !isClosedOrRemovedDriver(result))
          .map(normalizeBigDiehlMerResult)
      : [],
  }));
}


function getInterviewDeadline(interview) {
  return interview?.deadline_at || interview?.due_at || interview?.deadlineAt || null;
}

function formatInterviewDateTime(value) {
  if (!value) return "No deadline set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}

function isDriverInterviewLate(interview, submittedAt = new Date()) {
  const deadline = getInterviewDeadline(interview);
  if (!deadline) return false;
  return new Date(submittedAt).getTime() > new Date(deadline).getTime();
}

function InterviewAnswerCard({ interview, onAnswered, accent = "#d4af37" }) {
  const isPre = interview.type === "pre";
  const qa = Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [];
  const [answers, setAnswers] = useState(() => qa.map((q) => q.answer || ""));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(interview.answered || false);
  const deadline = getInterviewDeadline(interview);
  const submittedAt = interview.submitted_at || interview.answered_at || interview.updated_at || null;
  const wasLate = submitted ? isDriverInterviewLate(interview, submittedAt || new Date()) : isDriverInterviewLate(interview, new Date());

  async function submitAnswers() {
    const filled = answers.every((a, i) => !qa[i].question || a.trim());
    if (!filled) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    const updated = qa.map((q, i) => ({ question: q.question, answer: answers[i].trim() }));
    const nowIso = new Date().toISOString();
    const late = isDriverInterviewLate(interview, nowIso);
    const { data, error } = await supabase
      .from("interviews")
      .update({
        questions_and_answers: updated,
        answered: true,
        submitted_at: nowIso,
        status: late ? "late" : "submitted",
        payment_status: "unpaid",
      })
      .eq("id", interview.id)
      .select()
      .single();

    if (!error && data) {
      setSubmitted(true);
      onAnswered(data);
    } else {
      alert("Failed to submit answers. Please try again.");
    }
    setSubmitting(false);
  }

  return (
    <div style={{ background: "#0f1319", border: `1px solid ${submitted ? accent : "#3a3200"}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ background: isPre ? "#3b82f6" : "#22c55e", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
          {isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE"}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{interview.race_name}</span>
        {submitted && <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: wasLate ? "#3f1212" : "#14532d", color: wasLate ? "#f87171" : "#4ade80", marginLeft: "auto" }}>{wasLate ? "⚠️ Submitted Late" : "✅ Submitted"}</span>}
      </div>
      <div style={{ background: "#0b1017", border: "1px solid #2c3440", borderRadius: 10, padding: "10px 12px", marginBottom: 14, fontSize: 12, lineHeight: 1.5 }}>
        <strong>Deadline:</strong> {formatInterviewDateTime(deadline)}<br />
        <span style={{ opacity: 0.72 }}>Team bonus is only paid if you submit on time and league admin marks the interview complete.</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {qa.map((item, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${isPre ? "#3b82f6" : "#22c55e"}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 8 }}>Q: {item.question}</div>
            {submitted ? (
              <div style={{ fontSize: 14, lineHeight: 1.6, fontStyle: "italic", color: "#e2e8f0" }}>"{answers[i]}"</div>
            ) : (
              <textarea
                rows={3}
                style={{ width: "100%", background: "#0c1018", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box", resize: "vertical", fontSize: 14, lineHeight: 1.5 }}
                placeholder="Type your answer..."
                value={answers[i]}
                onChange={(e) => setAnswers((prev) => prev.map((a, idx) => (idx === i ? e.target.value : a)))}
              />
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button onClick={submitAnswers} disabled={submitting} style={{ marginTop: 16, background: accent, color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}>
          {submitting ? "Submitting..." : "📨 Submit Answers"}
        </button>
      )}
    </div>
  );
}

function AppealModal({ isOpen, onClose, selectedSeason, driverNumber, arcaDrivers, allDrivers, tracks, arcaTracks }) {
  const [requester, setRequester] = useState("");
  const [track, setTrack] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [series, setSeries] = useState("cup");
  const [submitting, setSubmitting] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const widgetRef = useRef(null);

  const trackOptions = useMemo(() => {
    const source = series === "arca" ? arcaTracks : tracks;
    return (Array.isArray(source) ? source : [])
      .map((t) => t?.name || t?.track || t)
      .filter(Boolean);
  }, [series, tracks, arcaTracks]);

  // Check if driver runs in both series
  const inCup = (allDrivers || []).some(d => String(d.number) === String(driverNumber));
  const inArca = (arcaDrivers || []).some(d => String(d.number) === String(driverNumber));
  const runsInBothSeries = inCup && inArca;

  // If only in ARCA, force series to ARCA
  useEffect(() => {
    if (!inCup && inArca) {
      setSeries("arca");
    }
  }, [inCup, inArca]);

  async function handleSubmit() {
    if (!requester.trim() || !track.trim() || !description.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("appeals").insert({
        requester: requester.trim(),
        track: track.trim(),
        description: description.trim(),
        evidence_url: videoUrl || null,
        status: "Open",
        series: series,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      alert("✅ Appeal submitted successfully!");
      setRequester("");
      setTrack("");
      setDescription("");
      setVideoUrl("");
      setSeries("cup");
      onClose();
    } catch (err) {
      console.error("Appeal submission error:", err);
      alert(`Failed to submit appeal: ${err?.message || err?.code || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (window.cloudinary) {
      setCloudinaryReady(true);
      return;
    }
    const existing = document.getElementById("cloudinary-widget-script");
    if (existing) return;
    const script = document.createElement("script");
    script.id = "cloudinary-widget-script";
    script.src = "https://widget.cloudinary.com/v2.0/global/all.js";
    script.async = true;
    script.onload = () => setCloudinaryReady(true);
    script.onerror = () => console.error("Cloudinary widget failed to load");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!cloudinaryReady || !window.cloudinary) return;
    widgetRef.current = window.cloudinary.createUploadWidget(
      {
        cloudName: "dpu05oykz",
        uploadPreset: "dpu05oykz",
        resourceType: "video",
        folder: "appeal-evidence",
        maxFileSize: 200000000,
        clientAllowedFormats: ["mp4", "mov", "avi", "mkv", "webm"],
      },
      (error, result) => {
        if (error) {
          console.error("Upload error:", error);
          alert("Upload failed: " + (error.message || "Unknown error"));
          return;
        }
        if (result?.event === "success") {
          setVideoUrl(result.info.secure_url);
          alert("✅ Video uploaded successfully!");
        }
      }
    );
  }, [cloudinaryReady]);

  if (!isOpen) return null;

  const appealInputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.72)",
    color: "#1d1d1f",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 14,
    padding: "11px 13px",
    boxSizing: "border-box",
    fontFamily: appleFont,
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  };

  return createPortal(
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(29,29,31,0.42)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 20,
      fontFamily: appleFont,
    }}>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.94), rgba(248,250,252,0.92))",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 30,
        padding: "clamp(20px, 4vw, 30px)",
        maxWidth: 540,
        width: "100%",
        boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
        maxHeight: "90vh",
        overflowY: "auto",
        color: "#1d1d1f",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              boxShadow: "0 12px 26px rgba(255,59,48,0.28)",
              flexShrink: 0,
            }}>
              📋
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 1000, letterSpacing: "-0.03em" }}>File an Appeal</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(0,0,0,0.05)",
              border: "none",
              borderRadius: 999,
              width: 32,
              height: 32,
              color: "#1d1d1f",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Requester Driver *</label>
          <select style={appealInputStyle} value={requester} onChange={(e) => setRequester(e.target.value)}>
            <option value="">-- Select Driver --</option>
            {(allDrivers || []).map((d) => <option key={d.id} value={`${d.number} - ${d.name}`}>#{d.number} {d.name}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Track *</label>
          <select style={appealInputStyle} value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="">-- Select Track --</option>
            {trackOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {runsInBothSeries && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Series *</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={() => setSeries("cup")}
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  borderRadius: 999,
                  border: series === "cup" ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(0,0,0,0.08)",
                  background: series === "cup" ? "rgba(212,175,55,0.14)" : "rgba(255,255,255,0.7)",
                  color: series === "cup" ? "#9a5a00" : "#1d1d1f",
                  fontWeight: 900,
                  fontFamily: appleFont,
                  cursor: "pointer",
                }}
              >
                🏁 Cup Series
              </button>
              <button
                type="button"
                onClick={() => setSeries("arca")}
                style={{
                  flex: 1,
                  padding: "11px 12px",
                  borderRadius: 999,
                  border: series === "arca" ? "1px solid rgba(52,199,89,0.5)" : "1px solid rgba(0,0,0,0.08)",
                  background: series === "arca" ? "rgba(52,199,89,0.14)" : "rgba(255,255,255,0.7)",
                  color: series === "arca" ? "#147d35" : "#1d1d1f",
                  fontWeight: 900,
                  fontFamily: appleFont,
                  cursor: "pointer",
                }}
              >
                🏎️ ARCA Series
              </button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Description *</label>
          <textarea style={{ ...appealInputStyle, minHeight: 120, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened and who was involved..." />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 7, fontWeight: 900, fontSize: 13 }}>Video Evidence (Optional)</label>
          <button
            type="button"
            onClick={() => {
              if (!cloudinaryReady || !widgetRef.current) {
                alert("Upload widget is still loading. Try again in a moment.");
                return;
              }
              widgetRef.current.open();
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "rgba(255,255,255,0.7)",
              color: "#1d1d1f",
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 999,
              padding: "12px 18px",
              fontWeight: 900,
              fontFamily: appleFont,
              cursor: "pointer",
              opacity: cloudinaryReady ? 1 : 0.55,
            }}
            disabled={!cloudinaryReady}
          >
            {videoUrl ? "✅ Video uploaded" : cloudinaryReady ? "📹 Upload Video" : "⏳ Loading uploader..."}
          </button>
          {videoUrl && <div style={{ marginTop: 8, fontSize: 11.5, color: "#6e6e73", fontWeight: 700, wordBreak: "break-all" }}>{videoUrl}</div>}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 1,
              border: 0,
              borderRadius: 999,
              padding: "13px 18px",
              background: "linear-gradient(135deg, #ff6482 0%, #ff3b30 60%, #b91c1c 100%)",
              color: "#ffffff",
              fontWeight: 1000,
              fontSize: 14,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.7 : 1,
              boxShadow: "0 14px 32px rgba(255,59,48,0.26)",
              fontFamily: appleFont,
            }}
          >
            {submitting ? "Submitting..." : "📤 Submit Appeal"}
          </button>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              border: "1px solid rgba(0,0,0,0.10)",
              borderRadius: 999,
              padding: "13px 18px",
              background: "rgba(255,255,255,0.7)",
              color: "#1d1d1f",
              fontWeight: 900,
              fontFamily: appleFont,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function DriverTransferPortalPanel({ driver, driverNumber, teamTheme, standingsRoute }) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [interestCount, setInterestCount] = useState(0);

  async function loadPortalStatus() {
    setLoading(true);
    const { data, error } = await supabase
      .from("driver_portal_entries")
      .select("*")
      .eq("driver_number", String(driverNumber))
      .eq("status", "open")
      .order("entered_at", { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      setEntry(data[0]);
      setWishlist(data[0].wishlist || "");
    } else {
      setEntry(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadPortalStatus();
  }, [driverNumber]);

  useEffect(() => {
    if (!entry) {
      setInterestCount(0);
      return;
    }
    async function loadInterest() {
      const { data } = await supabase
        .from("driver_recruiting_interest")
        .select("id")
        .eq("driver_number", String(driverNumber));
      setInterestCount((data || []).length);
    }
    loadInterest();
  }, [entry, driverNumber]);

  async function handleEnterPortal(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const { data, error } = await supabase
      .from("driver_portal_entries")
      .insert({
        driver_number: String(driverNumber),
        driver_name: driver.name,
        current_team: driver.team || "Independent",
        wishlist: wishlist.trim() || null,
        status: "open",
        entered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      console.error("Could not enter transfer portal:", error);
      setMessage("Something went wrong — please try again.");
      return;
    }
    setEntry(data);
    setMessage("You're in the Transfer Portal. Other teams can now see your profile and wish list.");
  }

  async function handleWithdraw() {
    if (!entry) return;
    if (!window.confirm("Withdraw from the Transfer Portal and stay with your current team?")) return;

    setSubmitting(true);
    const { error } = await supabase
      .from("driver_portal_entries")
      .update({ status: "withdrawn", updated_at: new Date().toISOString() })
      .eq("id", entry.id);

    setSubmitting(false);
    if (error) {
      console.error("Could not withdraw from transfer portal:", error);
      setMessage("Could not withdraw — please try again.");
      return;
    }
    setEntry(null);
    setMessage("You've withdrawn from the Transfer Portal and remain with your current team.");
  }

  async function handleUpdateWishlist(e) {
    e.preventDefault();
    if (!entry) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("driver_portal_entries")
      .update({ wishlist: wishlist.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", entry.id);
    setSubmitting(false);
    if (!error) setMessage("Wish list updated.");
  }

  return (
    <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
      <div style={pageContainerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Transfer Portal</div>
            <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>
              Enter the portal to test the market. You stay with {getTeamFullName ? getTeamFullName(driver.team) : driver.team} unless a team signs you before the deadline.
            </div>
          </div>
        </div>

        {loading ? (
          <div style={sectionCardStyle}>Loading...</div>
        ) : entry ? (
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: "rgba(52,199,89,0.14)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🔄</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>You're in the Transfer Portal</h2>
                <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>
                  Entered {new Date(entry.entered_at).toLocaleDateString()} • {interestCount} team{interestCount === 1 ? "" : "s"} watching
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.25)", borderRadius: 16, padding: 14, marginBottom: 16, color: "#147d35", fontWeight: 700, fontSize: 13.5 }}>
              If no team signs you before the league signing deadline, you automatically stay with {driver.team || "your current team"} — no action needed.
            </div>

            {message && <div style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.22)", borderRadius: 14, padding: 12, marginBottom: 16, color: "#0057d9", fontWeight: 700, fontSize: 13.5 }}>{message}</div>}

            <form onSubmit={handleUpdateWishlist}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 900, fontSize: 13 }}>Your Wish List</label>
              <textarea
                value={wishlist}
                onChange={(e) => setWishlist(e.target.value)}
                placeholder="What are you looking for? Preferred teams, manufacturer, role, anything you want interested owners to see."
                style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <button type="submit" disabled={submitting} style={primaryButtonStyle}>Save Wish List</button>
                <button type="button" onClick={handleWithdraw} disabled={submitting} style={dangerButtonStyle}>Withdraw from Portal</button>
              </div>
            </form>
          </div>
        ) : (
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>🔄</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Enter the Transfer Portal</h2>
                <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>
                  Test the market without leaving your current team. Other owners can see you're available and reach out.
                </div>
              </div>
            </div>

            {message && <div style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.22)", borderRadius: 14, padding: 12, marginBottom: 16, color: "#0057d9", fontWeight: 700, fontSize: 13.5 }}>{message}</div>}

            <form onSubmit={handleEnterPortal}>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 900, fontSize: 13 }}>Wish List (optional)</label>
              <textarea
                value={wishlist}
                onChange={(e) => setWishlist(e.target.value)}
                placeholder="What are you looking for? Preferred teams, manufacturer, role, anything you want interested owners to see."
                style={{ ...inputStyle, minHeight: 100, resize: "vertical", marginBottom: 14 }}
              />
              <button type="submit" disabled={submitting} style={primaryButtonStyle}>
                {submitting ? "Entering..." : "🔄 Enter the Transfer Portal"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DriverProfilePage({ seasons, activeSeason, tracks = [], ownerDriverAssignments = [], loadOwnerDriverAssignments, arcaDrivers = [], arcaTracks = [], driverNumberOverride = "", driverSeriesOverride = "" }) {
  const pathParts = window.location.pathname.split("/");
  
  // Parse driver number from either /driver/:number or /series/arca/driver/:number
  let requestedDriverNumber;
  let subPage;
  let isArcaRoute;
  
  if (driverNumberOverride) {
    // Used by the mobile Home tab, which shows "my profile" at a stable "/"
    // URL rather than redirecting to /driver/:number. There's no URL path to
    // read the series from here, so rely on the driver's actual series
    // (from their login session) instead.
    requestedDriverNumber = driverNumberOverride;
    subPage = undefined;
    isArcaRoute = driverSeriesOverride === "arca";
  } else if (pathParts.includes("arca")) {
    // ARCA route: /series/arca/driver/88 or /series/arca/driver/88/subpage
    requestedDriverNumber = pathParts[4];
    subPage = pathParts[5];
    isArcaRoute = true;
  } else {
    // Cup route: /driver/88 or /driver/88/subpage
    requestedDriverNumber = pathParts[2];
    subPage = pathParts[3];
    isArcaRoute = false;
  }
  
  const driverNumber = String(requestedDriverNumber) === "46" ? "39" : requestedDriverNumber;

  // Only look up an ARCA driver when the route/session actually indicates ARCA.
  // Car numbers can repeat between Cup and ARCA rosters, so matching by number
  // alone (regardless of series) would show the wrong driver whenever a Cup
  // and ARCA car happen to share a number.
  const arcaDriver = isArcaRoute ? arcaDrivers.find((d) => String(d.number) === String(driverNumber)) : null;
  const isArcaDriver = !!arcaDriver;

  const allSeasons = Array.isArray(seasons) ? seasons : [];
  const selectedSeason = activeSeason && activeSeason.id
    ? allSeasons.find((s) => s && s.id === activeSeason.id) || activeSeason
    : allSeasons[0] || null;

  const sanitizedDrivers = normalizeDriverProfileRoster(selectedSeason?.drivers || []);
  const normalizedRaceHistory = normalizeDriverProfileRaceHistory(selectedSeason?.raceHistory || []);

  let driver = !isArcaDriver ? sanitizedDrivers.find((d) => d && String(d.number) === String(driverNumber)) || null : null;
  
  // For ARCA drivers, use arcaDriver as the main driver object for the profile
  if (isArcaDriver && arcaDriver && !driver) {
    driver = {
      ...arcaDriver,
      id: arcaDriver.number,
      isArcaDriver: true,
    };
  }
  
  const teamTheme = getTeamTheme(driver?.team || arcaDriver?.team);
  const themedPrimaryButtonStyle = { ...primaryButtonStyle, background: teamTheme.accent };

  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  // const [isReportingIssue, setIsReportingIssue] = useState(false); // TODO: Uncomment once ReportIssueModal.jsx is in repo
  const [myAppeals, setMyAppeals] = useState([]);
  const [carUploads, setCarUploads] = useState([]);
  const [carUploading, setCarUploading] = useState(false);
  const [selectedRaceForUpload, setSelectedRaceForUpload] = useState("");
  const carFileInputRef = useRef(null);
  const [interviews, setInterviews] = useState([]);
  const [arcaInterviews, setArcaInterviews] = useState([]);
  const [arcaInterviewsLoading, setArcaInterviewsLoading] = useState(false);
  const [contractOffers, setContractOffers] = useState([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState("");
  const [renegotiationForm, setRenegotiationForm] = useState(DEFAULT_RENEGOTIATION_FORM);
  const [renegotiationMessage, setRenegotiationMessage] = useState("");
  const [renegotiationError, setRenegotiationError] = useState("");
  const [renegotiationSubmitting, setRenegotiationSubmitting] = useState(false);
  const [driverAccessCodeInput, setDriverAccessCodeInput] = useState("");
  const [newDriverPassword, setNewDriverPassword] = useState("");
  const [confirmDriverPassword, setConfirmDriverPassword] = useState("");
  const [passwordChangeMessage, setPasswordChangeMessage] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");
  const [driverAccessCodes, setDriverAccessCodes] = useState(loadLocalDriverAccessCodes);
  const [authorizedDriverNumber, setAuthorizedDriverNumber] = useState(() => {
    const leagueSession = getLeagueSession();
    if (leagueSession?.driverNumber) return String(leagueSession.driverNumber);
    return localStorage.getItem("driverProfileAuthorizedNumber") || "";
  });
  const [pendingDriverPath, setPendingDriverPath] = useState("");
  const [feedbackForm, setFeedbackForm] = useState({
    team_happiness: 8,
    equipment_quality: 8,
    team_communication: 8,
    leadership_confidence: 8,
    manufacturer_support: 8,
    future_confidence: 8,
    comments: "",
  });
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [driverAssignments, setDriverAssignments] = useState([]);
  const [raceAssignmentRequests, setRaceAssignmentRequests] = useState([]);
  const [driverAssignmentMessage, setDriverAssignmentMessage] = useState("");
  const [driverAssignmentError, setDriverAssignmentError] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [driverMessages, setDriverMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageRecipientNumber, setMessageRecipientNumber] = useState("");
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageNotice, setMessageNotice] = useState("");
  const [messageError, setMessageError] = useState("");
  const [teamInterestForm, setTeamInterestForm] = useState({ interested_team: "", interest_level: "High", message: "" });
  const [teamInterestHistory, setTeamInterestHistory] = useState([]);
  const [teamInterestNotice, setTeamInterestNotice] = useState("");
  const [teamInterestError, setTeamInterestError] = useState("");
  const [teamInterestSubmitting, setTeamInterestSubmitting] = useState(false);
  const [startParkForm, setStartParkForm] = useState({ race_name: "", race_date: "", reason: "" });
  const [startParkRequests, setStartParkRequests] = useState([]);
  const [startParkMessage, setStartParkMessage] = useState("");
  const [startParkError, setStartParkError] = useState("");
  const [startParkSubmitting, setStartParkSubmitting] = useState(false);
  const [developmentTransactions, setDevelopmentTransactions] = useState([]);
  const [developmentStarts, setDevelopmentStarts] = useState([]);
  const [developmentMessage, setDevelopmentMessage] = useState("");
  const [developmentError, setDevelopmentError] = useState("");
  const [developmentSubmitting, setDevelopmentSubmitting] = useState(false);
  const [developmentForm, setDevelopmentForm] = useState({
    requested_series: "xfinity",
    requested_team: "",
    race_name: "",
    request_note: "",
  });
  const [showDriverTodo, setShowDriverTodo] = useState(false);
  const [showDriverMenu, setShowDriverMenu] = useState(false);
  const driverMenuButtonRef = useRef(null);
  const driverTodoButtonRef = useRef(null);
  const [driverMenuPosition, setDriverMenuPosition] = useState(null);
  const [driverTodoPosition, setDriverTodoPosition] = useState(null);

  function toggleDriverMenu() {
    if (!showDriverMenu && driverMenuButtonRef.current) {
      const rect = driverMenuButtonRef.current.getBoundingClientRect();
      setDriverMenuPosition({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
    setShowDriverMenu((current) => !current);
  }

  function toggleDriverTodo() {
    if (!showDriverTodo && driverTodoButtonRef.current) {
      const rect = driverTodoButtonRef.current.getBoundingClientRect();
      setDriverTodoPosition({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
    setShowDriverTodo((current) => !current);
  }

  function scrollToDevelopmentalRides() {
    setShowDriverMenu(false);
    document.getElementById("developmental-rides-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const driverAccessKey = driver ? String(driver.number) : String(driverNumber);
  const isDriverAuthorized = authorizedDriverNumber === driverAccessKey;
  const authorizedDriver = sanitizedDrivers.find((item) => String(item.number) === String(authorizedDriverNumber)) || null;
  const messageRecipientOptions = useMemo(() => {
    return sanitizedDrivers
      .filter((item) => item && String(item.number) !== String(driver?.number || driverNumber))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [sanitizedDrivers, driver?.number, driverNumber]);

  const teamInterestOptions = useMemo(() => {
    const teams = Array.from(new Set((sanitizedDrivers || [])
      .map((item) => item?.team || "")
      .filter((team) => team && team !== "Independent" && team !== "IND")
    ));
    return teams.sort((a, b) => getTeamFullName(a).localeCompare(getTeamFullName(b)));
  }, [sanitizedDrivers]);

  const startParkRaceOptions = useMemo(() => {
    const trackRows = Array.isArray(tracks) && tracks.length
      ? tracks.map((track) => ({ name: track.name, date: track.date })).filter((track) => track.name)
      : DEFAULT_START_PARK_RACES;
    return trackRows.filter((track) => track.date && !getStartParkCutoffInfo(track.date).closed);
  }, [tracks]);

  const selectedStartParkCutoff = getStartParkCutoffInfo(startParkForm.race_date);

  const developmentRaceOptions = useMemo(() => {
    const trackRows = Array.isArray(tracks) && tracks.length
      ? tracks.map((track) => ({ name: track.name, date: track.date })).filter((track) => track.name)
      : DEFAULT_START_PARK_RACES;
    return trackRows.map((track) => track.name).filter(Boolean);
  }, [tracks]);

  const lowerSeriesTeamOptions = useMemo(() => {
    const teamsBySeries = { xfinity: [], truck: [], arca: [] };
    (selectedSeason?.teams || selectedSeason?.lowerSeriesTeams || []).forEach((team) => {
      const series = String(team?.series || "").toLowerCase();
      const name = team?.team || team?.name || team?.abbr;
      if (teamsBySeries[series] && name && !teamsBySeries[series].includes(name)) {
        teamsBySeries[series].push(name);
      }
    });
    Object.keys(teamsBySeries).forEach((series) => {
      if (!teamsBySeries[series].length) teamsBySeries[series] = DEVELOPMENT_FALLBACK_TEAMS[series];
    });
    return teamsBySeries;
  }, [selectedSeason]);

  const developmentStartsBySeries = useMemo(() => {
    const counts = { xfinity: 0, truck: 0, arca: 0 };
    developmentStarts.forEach((start) => {
      const series = String(start?.series || "").toLowerCase();
      if (String(start?.driver_number) === String(driver?.number || driverNumber) && counts[series] !== undefined && start?.counts_against_limit !== false) {
        counts[series] += 1;
      }
    });
    return counts;
  }, [developmentStarts, driver?.number, driverNumber]);

  const myDevelopmentTransactions = useMemo(() => {
    return (developmentTransactions || []).filter((tx) => String(tx.driver_number) === String(driver?.number || driverNumber));
  }, [developmentTransactions, driver?.number, driverNumber]);

  const isCupDriverProfile = String(driver?.series || "cup").toLowerCase() === "cup";

  const [issueChatTodos, setIssueChatTodos] = useState([]);

  useEffect(() => {
    if (!driver?.number) {
      setIssueChatTodos([]);
      return;
    }

    async function loadIssueChatTodos() {
      const { data: myIssues, error: issuesError } = await supabase
        .from("issues")
        .select("id, title")
        .eq("driver_number", String(driver.number));

      if (issuesError || !myIssues || myIssues.length === 0) {
        setIssueChatTodos([]);
        return;
      }

      const issueIds = myIssues.map((i) => i.id);
      const { data: comments, error: commentsError } = await supabase
        .from("issue_comments")
        .select("issue_id, created_at")
        .eq("is_admin", true)
        .in("issue_id", issueIds)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Failed to load issue chat replies:", commentsError);
        setIssueChatTodos([]);
        return;
      }

      const latestByIssue = {};
      (comments || []).forEach((c) => {
        if (!latestByIssue[c.issue_id]) latestByIssue[c.issue_id] = c.created_at;
      });

      const items = [];
      Object.entries(latestByIssue).forEach(([issueId, lastAdminReplyAt]) => {
        const seenAt = typeof window !== "undefined" ? localStorage.getItem(`bcl-issue-chat-seen-${issueId}`) : null;
        if (!seenAt || new Date(lastAdminReplyAt).getTime() > new Date(seenAt).getTime()) {
          const issue = myIssues.find((i) => String(i.id) === String(issueId));
          items.push({ issueId, title: issue?.title || "Issue Report" });
        }
      });

      setIssueChatTodos(items);
    }

    loadIssueChatTodos();
    const interval = setInterval(loadIssueChatTodos, 30000);
    return () => clearInterval(interval);
  }, [driver?.number]);

  const driverTodoItems = useMemo(() => {
    const items = [];
    const now = new Date();
    const myInterviews = isArcaDriver ? arcaInterviews : interviews;

    (myInterviews || []).forEach((interview) => {
      const answered = Boolean(interview?.answered);
      const status = String(interview?.status || "").toLowerCase();
      const deadline = getInterviewDeadline(interview);
      const isLateWindow = deadline ? now.getTime() > new Date(deadline).getTime() : false;

      if (!answered && status !== "complete" && status !== "paid") {
        items.push({
          id: `interview-${interview.id || interview.race_name || Math.random()}`,
          icon: isLateWindow ? "⚠️" : "🎤",
          title: isLateWindow ? "Interview Past Due" : "Interview Due",
          detail: `${interview.type === "post" ? "Post-race" : "Pre-race"} • ${interview.race_name || "Race"} • ${formatInterviewDateTime(deadline)}`,
          href: `/driver/${driverNumber}/interviews`,
          priority: isLateWindow ? 1 : 2,
        });
      }
    });

    (driverAssignments || []).forEach((task) => {
      const status = String(task?.status || "Assigned").toLowerCase();
      if (!["completed", "complete", "rejected", "closed", "paid"].includes(status)) {
        items.push({
          id: `task-${task.id || task.title || Math.random()}`,
          icon: "🎯",
          title: "Driver Assignment Active",
          detail: `${task.title || task.task_title || task.name || "Assignment"}${task.due_at ? ` • Due ${formatInterviewDateTime(task.due_at)}` : ""}`,
          href: `/driver/${driverNumber}/assignments`,
          priority: 3,
        });
      }
    });

    (contractOffers || []).forEach((offer) => {
      const status = String(offer?.status || "").toLowerCase();
      if (status === "pending" || status === "offered" || status === "open") {
        items.push({
          id: `contract-${offer.id || offer.team || Math.random()}`,
          icon: "💰",
          title: "Contract Offer Pending",
          detail: `${getTeamFullName(offer.team || offer.offering_team || "") || "Team"} offer needs review`,
          href: `/driver/${driverNumber}/contracts`,
          priority: 4,
        });
      }
    });

    if (Number(unreadMessages || 0) > 0) {
      items.push({
        id: "unread-messages",
        icon: "📨",
        title: `${unreadMessages} Unread Message${Number(unreadMessages) === 1 ? "" : "s"}`,
        detail: "Open your message center.",
        href: `/driver/${driverNumber}/messages`,
        priority: 5,
      });
    }

    (issueChatTodos || []).forEach((item) => {
      items.push({
        id: `issue-chat-${item.issueId}`,
        icon: "💬",
        title: "New Reply on Your Issue Report",
        detail: `${item.title} — Admin replied`,
        href: `/issues?openChat=${item.issueId}`,
        priority: 5,
      });
    });

    (startParkRequests || []).forEach((request) => {
      const status = String(request?.status || "pending").toLowerCase();
      if (["pending", "approved", "rejected"].includes(status)) {
        items.push({
          id: `start-park-${request.id || request.race_name || Math.random()}`,
          icon: status === "pending" ? "🏁" : status === "approved" ? "✅" : "⚠️",
          title: status === "pending" ? "Start & Park Request Pending" : status === "approved" ? "Start & Park Approved" : "Start & Park Update",
          detail: `${request.race_name || "Race"} • ${status.toUpperCase()}`,
          href: `/driver/${driverNumber}/start-park`,
          priority: status === "pending" ? 6 : 7,
        });
      }
    });

    (teamInterestHistory || []).forEach((interest) => {
      const status = String(interest?.status || "Open").toLowerCase();
      if (!["closed", "complete", "completed", "rejected"].includes(status)) {
        items.push({
          id: `team-interest-${interest.id || interest.interested_team || Math.random()}`,
          icon: "🤝",
          title: "Team Interest Active",
          detail: `${getTeamFullName(interest.interested_team || "") || "Team"} • ${interest.status || "Open"}`,
          href: `/driver/${driverNumber}/team-interest`,
          priority: 8,
        });
      }
    });

    (myAppeals || []).forEach((appeal) => {
      const status = String(appeal?.status || "Open").toLowerCase();
      if (!["closed", "resolved", "denied", "approved"].includes(status)) {
        items.push({
          id: `appeal-${appeal.id || appeal.track || Math.random()}`,
          icon: "📋",
          title: "Appeal Still Open",
          detail: `${appeal.track || "Track"} • ${appeal.status || "Open"}`,
          href: `/driver/${driverNumber}/appeals`,
          priority: 9,
        });
      }
    });

    return items.sort((a, b) => a.priority - b.priority);
  }, [interviews, arcaInterviews, isArcaDriver, driverAssignments, contractOffers, unreadMessages, issueChatTodos, startParkRequests, teamInterestHistory, myAppeals, driverNumber]);

  const driverTodoCount = driverTodoItems.length;

  const raceBreakdown = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return normalizedRaceHistory
      .map((race) => {
        const result = (race.results || []).find((r) => r && r.driverId === driver.id);
        return { raceName: race.raceName, stageCount: race.stageCount, ...result };
      })
      .filter((r) => r && r.driverId === driver.id);
  }, [normalizedRaceHistory, selectedSeason, driver]);

  const calculatedStats = useMemo(() => ({
    points: driver?.points || 0,
    wins: driver?.wins || 0,
    top3: driver?.top3 || 0,
    top5: driver?.top5 || 0,
    dnfs: driver?.dnfs || 0,
    fastestLaps: driver?.fastestLaps || 0,
    totalPenalties: driver?.totalPenalties || 0,
  }), [driver]);

  const paintSchemeStats = useMemo(() => ({
    votesReceived: Number(driver?.paintSchemeVotesReceived || 0),
    seasonVotes: Number(driver?.paintSchemeSeasonVotes || driver?.paintSchemeVotesReceived || 0),
    wins: Number(driver?.paintSchemeWins || 0),
    top5s: Number(driver?.paintSchemeTop5s || 0),
    top10s: Number(driver?.paintSchemeTop10s || 0),
    driverEarnings: Number(driver?.paintSchemeDriverEarnings || 0),
    teamEarnings: Number(driver?.paintSchemeTeamEarnings || 0),
    lastAwardedRace: driver?.paintSchemeLastAwardedRace || "—",
  }), [driver]);

  const recentForm = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return normalizedRaceHistory
      .filter((r) => r.results?.some((res) => res.driverId === driver.id))
      .slice(-5)
      .map((r) => {
        const result = r.results.find((res) => res.driverId === driver.id);
        return { race: r.raceName, points: result?.totalRacePoints || 0, finish: result?.finishPos };
      });
  }, [selectedSeason, driver]);

  const reputation = useMemo(() => {
    const recentPoints = recentForm.reduce((sum, r) => sum + Number(r.points || 0), 0);
    const aggression = Math.min(99, 50 + calculatedStats.totalPenalties * 8 + calculatedStats.wins * 3);
    const consistency = Math.max(35, 90 - calculatedStats.dnfs * 12 - calculatedStats.totalPenalties * 4);
    const racecraft = Math.min(99, 55 + calculatedStats.top5 * 5 + calculatedStats.wins * 8);
    const momentum = Math.min(99, 45 + recentPoints);
    const popularity = Math.min(99, 60 + calculatedStats.wins * 7 + calculatedStats.top3 * 3);

    let archetype = "Developing Driver";
    if (aggression >= 80 && consistency < 70) archetype = "Aggressive Wildcard";
    else if (consistency >= 80 && racecraft >= 75) archetype = "Championship-Caliber";
    else if (momentum >= 80) archetype = "Hot Streak Driver";
    else if (calculatedStats.wins > 0) archetype = "Race Winner";
    else if (calculatedStats.dnfs > 1) archetype = "High-Risk Driver";

    return { aggression, consistency, racecraft, momentum, popularity, archetype };
  }, [calculatedStats, recentForm]);

  const driverRanking = useMemo(() => {
    if (!selectedSeason || !driver) return 0;
    const sorted = [...sanitizedDrivers].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    return sorted.findIndex((d) => d.id === driver.id) + 1;
  }, [selectedSeason, driver]);

  const championshipPicture = useMemo(() => {
    if (!selectedSeason || !driver) return { rank: 0, pointsBehindLeader: 0, status: "No Data", color: teamTheme.accent, bg: `${teamTheme.accent}14` };
    const sorted = [...sanitizedDrivers].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    const leader = sorted[0];
    const rank = sorted.findIndex((d) => d.id === driver.id) + 1;
    const totalDrivers = sorted.length || 1;
    const pointsBehindLeader = leader ? Math.max(0, Number(leader.points || 0) - Number(driver.points || 0)) : 0;

    if (rank === 1) return { rank, pointsBehindLeader, status: "Points Leader", color: "#147d35", bg: "rgba(52,199,89,0.10)" };
    if (rank <= Math.ceil(totalDrivers * 0.25)) return { rank, pointsBehindLeader, status: "Championship Contender", color: teamTheme.accent, bg: `${teamTheme.accent}14` };
    if (rank <= Math.ceil(totalDrivers * 0.5)) return { rank, pointsBehindLeader, status: "In the Hunt", color: "#9a5a00", bg: "rgba(255,149,0,0.10)" };
    return { rank, pointsBehindLeader, status: "Needs a Points Run", color: "#c62d24", bg: "rgba(255,59,48,0.08)" };
  }, [selectedSeason, driver, teamTheme]);

  const pointsGap = useMemo(() => {
    if (!selectedSeason || !driver) return { ahead: 0, behind: 0 };
    const sorted = [...sanitizedDrivers].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    const driverIdx = sorted.findIndex((d) => d.id === driver.id);
    if (driverIdx <= 0) return { ahead: 0, behind: driverIdx === 0 && sorted[1] ? Number(driver.points || 0) - Number(sorted[1].points || 0) : 0 };
    const ahead = Number(sorted[driverIdx - 1]?.points || 0) - Number(driver.points || 0);
    const behind = driverIdx < sorted.length - 1 ? Number(driver.points || 0) - Number(sorted[driverIdx + 1]?.points || 0) : 0;
    return { ahead, behind };
  }, [selectedSeason, driver]);

  const consistencyRating = useMemo(() => {
    const finishes = raceBreakdown.filter((r) => r.finishPos).map((r) => Number(r.finishPos));
    if (finishes.length === 0) return { avg: 0, best: "—", worst: "—" };
    const avg = (finishes.reduce((a, b) => a + b, 0) / finishes.length).toFixed(1);
    return { avg, best: Math.min(...finishes), worst: Math.max(...finishes) };
  }, [raceBreakdown]);

  const personalRecords = useMemo(() => {
    let bestFinish = Infinity;
    let fastestLapCount = 0;
    let highestPointsRace = 0;
    raceBreakdown.forEach((r) => {
      if (r.finishPos) bestFinish = Math.min(bestFinish, Number(r.finishPos));
      if (r.fastestLap) fastestLapCount += 1;
      if (r.totalRacePoints) highestPointsRace = Math.max(highestPointsRace, Number(r.totalRacePoints));
    });
    return { bestFinish: bestFinish === Infinity ? "—" : bestFinish, fastestLaps: fastestLapCount, highestRacePoints: highestPointsRace };
  }, [raceBreakdown]);

  const streaks = useMemo(() => {
    let currentWinStreak = 0;
    let longestWinStreak = 0;
    let currentPodiumStreak = 0;
    let longestPodiumStreak = 0;
    let currentDnfStreak = 0;
    let longestDnfStreak = 0;

    raceBreakdown.forEach((r) => {
      if (r.isWin) {
        currentWinStreak += 1;
        longestWinStreak = Math.max(longestWinStreak, currentWinStreak);
      } else currentWinStreak = 0;

      if (r.isTop3) {
        currentPodiumStreak += 1;
        longestPodiumStreak = Math.max(longestPodiumStreak, currentPodiumStreak);
      } else currentPodiumStreak = 0;

      if (r.dnf) {
        currentDnfStreak += 1;
        longestDnfStreak = Math.max(longestDnfStreak, currentDnfStreak);
      } else currentDnfStreak = 0;
    });

    return { currentWins: currentWinStreak, longestWins: longestWinStreak, currentPodiums: currentPodiumStreak, longestPodiums: longestPodiumStreak, currentDnfs: currentDnfStreak, longestDnfs: longestDnfStreak };
  }, [raceBreakdown]);

  const activeContract = useMemo(() => {
    const acceptedStatuses = ["accepted", "active"];
    return (contractOffers || []).find((offer) => acceptedStatuses.includes(String(offer.status || "").toLowerCase())) || null;
  }, [contractOffers]);

  const driverSatisfaction = useMemo(() => {
    const starts = raceBreakdown.length || 0;
    const averageFinish = starts
      ? raceBreakdown
          .filter((race) => race.finishPos)
          .reduce((sum, race) => sum + Number(race.finishPos || 0), 0) / Math.max(1, raceBreakdown.filter((race) => race.finishPos).length)
      : 0;

    const top10s = raceBreakdown.filter((race) => Number(race.finishPos || 999) <= 10).length;
    const completedAssignments = driverAssignments.filter((task) => String(task.status || "") === "Completed").length;
    const rejectedAssignments = driverAssignments.filter((task) => String(task.status || "") === "Rejected").length;
    const answeredInterviews = (isArcaDriver ? arcaInterviews : interviews).filter((interview) => interview.answered).length;
    const pendingContractOffers = contractOffers.filter((offer) => String(offer.status || "") === "Pending").length;
    const acceptedContractBonus = activeContract ? 8 : 0;

    let score = 62;
    score += Number(calculatedStats.wins || 0) * 10;
    score += Number(calculatedStats.top3 || 0) * 5;
    score += Number(calculatedStats.top5 || 0) * 3;
    score += top10s * 2;
    score += completedAssignments * 3;
    score += answeredInterviews * 1;
    score += pendingContractOffers * 2;
    score += acceptedContractBonus;

    if (averageFinish && averageFinish <= 5) score += 8;
    else if (averageFinish && averageFinish <= 10) score += 5;
    else if (averageFinish && averageFinish > 18) score -= 8;

    score -= Number(calculatedStats.dnfs || 0) * 9;
    score -= Number(calculatedStats.totalPenalties || 0) * 4;
    score -= rejectedAssignments * 5;

    const finalScore = clampScore(score);
    const status = getSatisfactionStatus(finalScore);

    let summary = "Driver is steady, but the next few races can swing the mood quickly.";
    if (finalScore >= 90) summary = "Driver is fully bought into the program and performing like a cornerstone piece.";
    else if (finalScore >= 75) summary = "Driver morale is strong and performance is trending in the right direction.";
    else if (finalScore >= 60) summary = "Driver is stable, but wins, clean races, and contract clarity would help.";
    else if (finalScore >= 40) summary = "Driver frustration is building. Results, communication, or contract talks may be needed.";
    else summary = "Driver is at risk. Ownership should address performance, penalties, or contract concerns quickly.";

    return {
      score: finalScore,
      status: status.label,
      color: status.color,
      bg: status.bg,
      summary,
      factors: [
        `Wins: ${calculatedStats.wins || 0}`,
        `Top 5s: ${calculatedStats.top5 || 0}`,
        `Top 10s: ${top10s}`,
        `DNFs: ${calculatedStats.dnfs || 0}`,
        `Penalties: ${calculatedStats.totalPenalties || 0}`,
        `Assignments completed: ${completedAssignments}`,
        activeContract ? "Active contract on file" : "No active contract loaded",
      ],
    };
  }, [raceBreakdown, driverAssignments, interviews, arcaInterviews, isArcaDriver, contractOffers, activeContract, calculatedStats]);


  const careerStats = useMemo(() => {
    if (!driver || !Array.isArray(seasons)) return { wins: 0, points: 0, podiums: 0, races: 0 };
    let totalWins = 0;
    let totalPoints = 0;
    let totalPodiums = 0;
    let totalRaces = 0;
    seasons.forEach((season) => {
      const d = season.drivers?.find((dr) => dr.id === driver.id);
      if (d) {
        totalWins += Number(d.wins || 0);
        totalPoints += Number(d.points || 0);
        totalPodiums += Number(d.top3 || 0);
        totalRaces += (season.raceHistory || []).filter((r) => r.results?.some((res) => res.driverId === driver.id)).length;
      }
    });
    return { wins: totalWins, points: totalPoints, podiums: totalPodiums, races: totalRaces };
  }, [seasons, driver]);

  const teamStats = useMemo(() => {
    if (!selectedSeason || !driver) return null;
    const teammates = sanitizedDrivers.filter((d) => d.team === driver.team && d.id !== driver.id);
    if (!teammates.length) return null;
    return teammates.sort((a, b) => Number(b.points || 0) - Number(a.points || 0))[0];
  }, [selectedSeason, driver]);

  const trackStats = useMemo(() => {
    const trackMap = {};
    raceBreakdown.forEach((r) => {
      const track = r.raceName;
      if (!trackMap[track]) trackMap[track] = { races: 0, points: 0 };
      trackMap[track].races += 1;
      trackMap[track].points += Number(r.totalRacePoints || 0);
    });
    const sorted = Object.entries(trackMap).sort((a, b) => b[1].points - a[1].points);
    return { best: sorted[0], worst: sorted[sorted.length - 1] };
  }, [raceBreakdown]);

  const pointsProjection = useMemo(() => {
    const racesCompleted = raceBreakdown.length;
    const totalRaces = tracks.length || selectedSeason?.schedule?.length || selectedSeason?.races?.length || selectedSeason?.raceHistory?.length || racesCompleted;
    if (racesCompleted === 0) return "—";
    return Math.round((calculatedStats.points / racesCompleted) * totalRaces);
  }, [calculatedStats.points, raceBreakdown.length, selectedSeason, tracks.length]);

  const achievementProgress = useMemo(() => {
    const achievements = [
      { name: "First Win", current: calculatedStats.wins, target: 1, emoji: "🏆" },
      { name: "Hat Trick", current: calculatedStats.wins, target: 3, emoji: "🥇" },
      { name: "Dominator", current: calculatedStats.wins, target: 5, emoji: "👑" },
      { name: "Podium Master", current: calculatedStats.top3, target: 10, emoji: "🎯" },
      { name: "Century Club", current: calculatedStats.points, target: 100, emoji: "⭐" },
      { name: "Speed Demon", current: calculatedStats.fastestLaps, target: 5, emoji: "⚡" },
    ];
    return achievements.filter((a) => Number(a.current || 0) < a.target);
  }, [calculatedStats]);

  const unlockedAchievements = useMemo(() => [
    { badge: "🏆", name: "First Win", condition: calculatedStats.wins >= 1 },
    { badge: "🥇", name: "Hat Trick", condition: calculatedStats.wins >= 3 },
    { badge: "👑", name: "Dominator", condition: calculatedStats.wins >= 5 },
    { badge: "🎯", name: "Podium Master", condition: calculatedStats.top3 >= 10 },
    { badge: "⭐", name: "Century Club", condition: calculatedStats.points >= 100 },
    { badge: "⚡", name: "Speed Demon", condition: calculatedStats.fastestLaps >= 5 },
  ].filter((a) => a.condition), [calculatedStats]);

  const offenseLog = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return (selectedSeason.raceHistory || []).flatMap((race) =>
      (race.results || [])
        .filter((r) => r && r.driverId === driver.id && r.offense)
        .map((r) => ({ raceName: race.raceName, ...r }))
    );
  }, [selectedSeason, driver]);

  useEffect(() => {
    async function fetchMyAppeals() {
      const { data, error } = await supabase.from("appeals").select("*").order("created_at", { ascending: false });
      if (error) {
        console.error("Appeals fetch error:", error);
        return;
      }
      const mine = (data || []).filter((a) => {
        if (!a.requester) return false;
        const byNumber = a.requester.startsWith(`${driverNumber} - `);
        const byName = driver?.name && a.requester.toLowerCase().includes(driver.name.toLowerCase());
        return byNumber || byName;
      });
      setMyAppeals(mine);
    }

    fetchMyAppeals();
    const interval = setInterval(fetchMyAppeals, 5000);
    return () => clearInterval(interval);
  }, [driverNumber, driver?.name]);

  useEffect(() => {
    if (!driver?.id) return;
    async function fetchCarUploads() {
      const uploadSeries = isCupDriverProfile ? "cup" : "arca";
      const data = await getCarUploads(driver.id, null, uploadSeries);
      setCarUploads(data || []);
    }
    fetchCarUploads();
  }, [driver?.id, isCupDriverProfile]);

  useEffect(() => {
    let isMounted = true;
    async function refreshDriverCodes(event) {
      if (event && event.key !== "driverProfileAccessCodes") return;
      const codes = await loadRemoteDriverAccessCodes();
      if (isMounted) setDriverAccessCodes(codes);
    }

    refreshDriverCodes();
    window.addEventListener("storage", refreshDriverCodes);
    window.addEventListener("focus", refreshDriverCodes);
    return () => {
      isMounted = false;
      window.removeEventListener("storage", refreshDriverCodes);
      window.removeEventListener("focus", refreshDriverCodes);
    };
  }, []);

  useEffect(() => {
    if (!driver?.name || !isDriverAuthorized) {
      setContractOffers([]);
      return;
    }

    async function loadContractOffers() {
      setContractLoading(true);
      const { data, error } = await supabase
        .from("contract_offers")
        .select("*")
        .eq("driver_name", driver.name)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load contract offers:", error);
        setContractError("Could not load contract offers. Check contract_offers RLS select policy.");
        setContractLoading(false);
        return;
      }

      setContractOffers(data || []);
      setContractLoading(false);
    }

    loadContractOffers();
    const interval = setInterval(loadContractOffers, 5000);
    return () => clearInterval(interval);
  }, [driver?.name, isDriverAuthorized]);

  useEffect(() => {
    if (!driver?.id || isArcaDriver) return;
    async function loadInterviews() {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("driver_id", driver.id)
        .eq("series", "cup")
        .order("generated_at", { ascending: false });
      setInterviews(data || []);
    }

    loadInterviews();
    const interval = setInterval(loadInterviews, 30000);
    return () => clearInterval(interval);
  }, [driver?.id, isArcaDriver]);

  // Load ARCA interviews if this is an ARCA driver
  useEffect(() => {
    if (!isArcaDriver) return;
    setArcaInterviewsLoading(true);
    async function loadArcaInterviews() {
      const { data } = await supabase
        .from("interviews")
        .select("*")
        .eq("driver_number", String(driverNumber))
        .eq("series", "arca")
        .order("generated_at", { ascending: false });
      setArcaInterviews(data || []);
      setArcaInterviewsLoading(false);
    }

    loadArcaInterviews();
    const interval = setInterval(loadArcaInterviews, 30000);
    return () => clearInterval(interval);
  }, [isArcaDriver, driverNumber]);

  useEffect(() => {
    if (!driver?.number || !isDriverAuthorized) {
      setDriverAssignments([]);
      return;
    }

    async function loadDriverAssignments() {
      const { data, error } = await supabase
        .from("driver_tasks")
        .select("*")
        .eq("driver_number", String(driver.number))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load driver assignments:", error);
        setDriverAssignmentError("Could not load assignments. Check driver_tasks RLS select policy.");
        setDriverAssignments([]);
        return;
      }

      setDriverAssignments(data || []);
    }

    loadDriverAssignments();
    const interval = setInterval(loadDriverAssignments, 15000);
    return () => clearInterval(interval);
  }, [driver?.number, isDriverAuthorized]);


  useEffect(() => {
    if (!driver?.number || !isDriverAuthorized) {
      setRaceAssignmentRequests([]);
      return;
    }

    let isMounted = true;

    async function loadRaceAssignmentRequests() {
      const localMatches = (ownerDriverAssignments || []).filter((assignment) => {
        const status = String(assignment?.status || "").toLowerCase();
        const numberMatches = String(assignment?.assigned_driver_number || "").replace("#", "") === String(driver.number || "").replace("#", "");
        const idMatches = assignment?.assigned_driver_id && driver?.id && String(assignment.assigned_driver_id) === String(driver.id);
        return ["approved", "approved_pending_driver", "driver_accepted"].includes(status) && (numberMatches || idMatches);
      });

      if (localMatches.length) {
        if (isMounted) setRaceAssignmentRequests(localMatches);
        return;
      }

      const { data, error } = await supabase
        .from("owner_driver_assignments")
        .select("*")
        .eq("assigned_driver_number", String(driver.number))
        .in("status", ["approved", "approved_pending_driver", "driver_accepted"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load race assignment requests:", error);
        return;
      }

      if (isMounted) setRaceAssignmentRequests(data || []);
    }

    loadRaceAssignmentRequests();
    const interval = setInterval(loadRaceAssignmentRequests, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [driver?.id, driver?.number, isDriverAuthorized, ownerDriverAssignments]);

  useEffect(() => {
    if (!driver?.number) {
      setUnreadMessages(0);
      return;
    }

    async function loadUnreadMessages() {
      const { count, error } = await supabase
        .from("league_messages")
        .select("*", { count: "exact", head: true })
        .eq("recipient_driver_number", String(driver.number))
        .eq("is_read", false);

      if (error) {
        console.error("Failed to load unread messages:", error);
        setUnreadMessages(0);
        return;
      }

      setUnreadMessages(count || 0);
    }

    loadUnreadMessages();
    const interval = setInterval(loadUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, [driver?.number]);

  useEffect(() => {
    if (subPage !== "messages" || !driver?.number || !isDriverAuthorized) return;

    const queryParams = new URLSearchParams(window.location.search);
    const toNumber = queryParams.get("to");
    if (toNumber) setMessageRecipientNumber(String(toNumber));

    loadDriverMessages(false);
    const interval = setInterval(() => loadDriverMessages(false), 30000);
    return () => clearInterval(interval);
  }, [subPage, driver?.number, isDriverAuthorized]);

  async function loadDriverMessages(markIncomingAsRead = false) {
    if (!driver?.number) return;

    setMessagesLoading(true);
    const currentNumber = String(driver.number);
    const { data, error } = await supabase
      .from("league_messages")
      .select("*")
      .or(`sender_driver_number.eq.${currentNumber},recipient_driver_number.eq.${currentNumber},recipient_type.eq.league,recipient_team.eq.${driver.team},recipient_manufacturer.eq.${driver.manufacturer}`)
      .eq("archived", false)
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      console.error("Failed to load driver messages:", error);
      setMessageError("Could not load messages. Check league_messages RLS select policy.");
      setDriverMessages([]);
      setMessagesLoading(false);
      return;
    }

    setDriverMessages(data || []);
    setMessagesLoading(false);

    if (markIncomingAsRead) {
      const unreadIncomingIds = (data || [])
        .filter((message) => String(message.recipient_driver_number) === currentNumber && !message.is_read)
        .map((message) => message.id)
        .filter(Boolean);

      if (unreadIncomingIds.length) {
        const { error: updateError } = await supabase
          .from("league_messages")
          .update({ is_read: true })
          .in("id", unreadIncomingIds);

        if (updateError) {
          console.error("Failed to mark messages read:", updateError);
        } else {
          setUnreadMessages(0);
          setDriverMessages((current) => current.map((message) => unreadIncomingIds.includes(message.id) ? { ...message, is_read: true } : message));
        }
      }
    }
  }


  async function updateDriverMessageReadStatus(messageId, isRead) {
    if (!messageId) return;
    setMessageNotice("");
    setMessageError("");

    const { error } = await supabase
      .from("league_messages")
      .update({ is_read: Boolean(isRead) })
      .eq("id", messageId);

    if (error) {
      console.error("Could not update message read status:", error);
      setMessageError("Could not update message. Check league_messages update policy.");
      return;
    }

    setDriverMessages((current) => current.map((message) => message.id === messageId ? { ...message, is_read: Boolean(isRead) } : message));
    if (isRead) setUnreadMessages((current) => Math.max(0, Number(current || 0) - 1));
    else setUnreadMessages((current) => Number(current || 0) + 1);
    setMessageNotice(isRead ? "Message marked read." : "Message marked unread.");
  }

  async function markAllDriverMessagesRead() {
    if (!driver?.number) return;
    setMessageNotice("");
    setMessageError("");

    const unreadIds = (driverMessages || [])
      .filter((message) => !message.is_read && String(message.recipient_driver_number || "") === String(driver.number))
      .map((message) => message.id)
      .filter(Boolean);

    if (!unreadIds.length) {
      setMessageNotice("No unread messages to mark read.");
      return;
    }

    const { error } = await supabase
      .from("league_messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (error) {
      console.error("Could not mark all messages read:", error);
      setMessageError("Could not mark all read. Check league_messages update policy.");
      return;
    }

    setDriverMessages((current) => current.map((message) => unreadIds.includes(message.id) ? { ...message, is_read: true } : message));
    setUnreadMessages(0);
    setMessageNotice("All unread messages marked read.");
  }

  useEffect(() => {
    if (!driver?.number || !isDriverAuthorized) {
      setTeamInterestHistory([]);
      return;
    }

    async function loadTeamInterestHistory() {
      const { data, error } = await supabase
        .from("team_interest")
        .select("*")
        .eq("driver_number", String(driver.number))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load team interest history:", error);
        setTeamInterestHistory([]);
        return;
      }

      setTeamInterestHistory(data || []);
    }

    loadTeamInterestHistory();
    const interval = setInterval(loadTeamInterestHistory, 30000);
    return () => clearInterval(interval);
  }, [driver?.number, isDriverAuthorized]);


  useEffect(() => {
    if (!driver?.number || !isDriverAuthorized) {
      setStartParkRequests([]);
      return;
    }

    async function loadStartParkRequests() {
      const { data, error } = await supabase
        .from("start_park_requests")
        .select("*")
        .eq("driver_number", String(driver.number))
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Could not load Start & Park requests:", error);
        setStartParkRequests([]);
        return;
      }

      setStartParkRequests(data || []);
    }

    loadStartParkRequests();
    const interval = setInterval(loadStartParkRequests, 30000);
    return () => clearInterval(interval);
  }, [driver?.number, isDriverAuthorized]);

  function updateStartParkRace(value) {
    const race = startParkRaceOptions.find((item) => item.name === value) || {};
    setStartParkForm((current) => ({ ...current, race_name: value, race_date: race.date || "" }));
  }

  async function submitStartParkRequest(event) {
    event?.preventDefault?.();
    setStartParkMessage("");
    setStartParkError("");

    if (!isDriverAuthorized || !driver) {
      setStartParkError("Unlock driver access before requesting Start & Park.");
      return;
    }

    if (!startParkForm.race_name || !startParkForm.race_date) {
      setStartParkError("Choose the race you are requesting Start & Park for.");
      return;
    }

    const cutoff = getStartParkCutoffInfo(startParkForm.race_date);
    if (cutoff.closed) {
      setStartParkError("Start & Park requests are closed for this race. Deadline is Saturday at 9:00 PM ET.");
      return;
    }

    const duplicate = (startParkRequests || []).find((request) =>
      String(request.race_name || "") === String(startParkForm.race_name) &&
      ["pending", "approved", "applied"].includes(String(request.status || "pending").toLowerCase())
    );

    if (duplicate) {
      setStartParkError("You already have an active Start & Park request for this race.");
      return;
    }

    const payload = {
      race_name: startParkForm.race_name,
      race_date: startParkForm.race_date,
      driver_id: String(driver.id || ""),
      driver_number: String(driver.number || ""),
      driver_name: driver.name || "",
      team: driver.team || "Independent",
      manufacturer: driver.manufacturer || "",
      requested_by_type: "driver",
      requested_by_name: driver.name || `#${driver.number}`,
      requested_by_team: driver.team || "Independent",
      reason: String(startParkForm.reason || "").trim(),
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setStartParkSubmitting(true);
    const { data, error } = await supabase.from("start_park_requests").insert([payload]).select().single();
    setStartParkSubmitting(false);

    if (error) {
      console.error("Could not submit Start & Park request:", error);
      setStartParkError("Could not submit request. Check start_park_requests insert policy and columns.");
      return;
    }

    await supabase.from("league_messages").insert([{
      message_type: "start_park_request",
      sender_type: "driver",
      sender_driver_number: String(driver.number || ""),
      sender_name: driver.name || `#${driver.number}`,
      recipient_type: "league",
      subject: `Start & Park Request: #${driver.number} ${driver.name}`,
      message: `${driver.name || `#${driver.number}`} requested Start & Park for ${startParkForm.race_name}.`,
      related_page: "/admin",
      related_id: data?.id || null,
      created_at: new Date().toISOString(),
    }]);

    setStartParkRequests((current) => [data || payload, ...(current || [])]);
    setStartParkForm({ race_name: "", race_date: "", reason: "" });
    setStartParkMessage("Start & Park request sent to Race Control. If approved, you will be placed at the rear based on request receipt order.");
  }

  function updateTeamInterestField(field, value) {
    setTeamInterestForm((current) => ({ ...current, [field]: value }));
  }

  async function submitTeamInterest(event) {
    event?.preventDefault?.();
    setTeamInterestNotice("");
    setTeamInterestError("");

    if (!isDriverAuthorized || !driver) {
      setTeamInterestError("Unlock driver access before expressing team interest.");
      return;
    }

    const interestedTeam = String(teamInterestForm.interested_team || "").trim();
    const message = String(teamInterestForm.message || "").trim();

    if (!interestedTeam) {
      setTeamInterestError("Choose the team you are interested in.");
      return;
    }

    if (message.length > 1000) {
      setTeamInterestError("Keep the message under 1,000 characters.");
      return;
    }

    const payload = {
      driver_number: String(driver.number),
      driver_name: driver.name || "",
      current_team: driver.team || "Independent",
      current_manufacturer: driver.manufacturer || "",
      interested_team: interestedTeam,
      interest_level: teamInterestForm.interest_level || "Medium",
      message,
      status: "Open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTeamInterestSubmitting(true);
    const { data, error } = await supabase.from("team_interest").insert([payload]).select().single();
    setTeamInterestSubmitting(false);

    if (error) {
      console.error("Could not submit team interest:", error);
      setTeamInterestError("Could not submit team interest. Check team_interest insert policy and columns.");
      return;
    }

    // Also create a Message Center notice for the owner/team inbox.
    await supabase.from("league_messages").insert([{
      message_type: "team_interest",
      sender_type: "driver",
      sender_driver_number: String(driver.number),
      sender_name: driver.name || `#${driver.number}`,
      recipient_type: "team",
      recipient_team: interestedTeam,
      subject: `Team Interest: #${driver.number} ${driver.name || "Driver"}`,
      message: message || `${driver.name || `#${driver.number}`} expressed ${teamInterestForm.interest_level || "Medium"} interest in ${getTeamFullName(interestedTeam)}.`,
      related_page: `/owner`,
      related_id: data?.id || null,
      created_at: new Date().toISOString(),
    }]);

    setTeamInterestHistory((current) => [data || payload, ...(current || [])]);
    setTeamInterestForm({ interested_team: "", interest_level: "High", message: "" });
    setTeamInterestNotice(`Interest sent to ${getTeamFullName(interestedTeam)}.`);
  }

  async function sendDriverMessage(event) {
    event?.preventDefault?.();
    setMessageNotice("");
    setMessageError("");

    if (!isDriverAuthorized || !driver) {
      setMessageError("Unlock your driver profile before sending messages.");
      return;
    }

    const recipient = sanitizedDrivers.find((item) => String(item.number) === String(messageRecipientNumber));
    const body = String(messageBody || "").trim();

    if (!recipient) {
      setMessageError("Choose the driver you want to message.");
      return;
    }

    if (!body) {
      setMessageError("Type a message before sending.");
      return;
    }

    if (body.length > 1200) {
      setMessageError("Keep messages under 1,200 characters to save database space.");
      return;
    }

    const payload = {
      message_type: "dm",
      sender_type: "driver",
      sender_driver_number: String(driver.number),
      sender_name: driver.name || `#${driver.number}`,
      recipient_type: "driver",
      recipient_driver_number: String(recipient.number),
      subject: String(messageSubject || "").trim() || null,
      message: body,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("league_messages").insert([payload]);

    if (error) {
      console.error("Failed to send message:", error);
      setMessageError("Could not send message. Check league_messages insert policy and columns.");
      return;
    }

    setMessageBody("");
    setMessageSubject("");
    setMessageNotice(`Message sent to #${recipient.number} ${recipient.name}.`);
    await loadDriverMessages(false);
  }

  function startMessageFromProfile() {
    if (authorizedDriverNumber && String(authorizedDriverNumber) !== String(driver?.number || driverNumber)) {
      window.location.href = `/driver/${authorizedDriverNumber}/messages?to=${driver?.number || driverNumber}`;
      return;
    }

    openProtectedDriverSection(`/driver/${driverNumber}/messages`);
  }

  async function unlockDriverContracts() {
    const latestCodes = await loadRemoteDriverAccessCodes();
    setDriverAccessCodes(latestCodes);

    const expectedByNumber = normalizeAccessCode(latestCodes[driverAccessKey] || driverAccessCodes[driverAccessKey] || "");
    const expectedByName = normalizeAccessCode(driver?.name ? latestCodes[String(driver.name).toLowerCase()] || driverAccessCodes[String(driver.name).toLowerCase()] || "" : "");
    const expected = expectedByNumber || expectedByName;

    if (!expected) {
      setContractError("No driver access code has been generated for this driver yet. Contact league admin.");
      return;
    }

    if (normalizeAccessCode(driverAccessCodeInput) !== expected && normalizeAccessCode(driverAccessCodeInput) !== normalizeAccessCode(MASTER_ACCESS_CODE)) {
      setContractError("Incorrect driver access code.");
      return;
    }

    localStorage.setItem("driverProfileAuthorizedNumber", driverAccessKey);
    setAuthorizedDriverNumber(driverAccessKey);
    setDriverAccessCodeInput("");
    setContractError("");

    if (pendingDriverPath) {
      window.location.pathname = pendingDriverPath;
    }
  }

  async function changeDriverPassword() {
    setPasswordChangeMessage("");
    setPasswordChangeError("");

    if (!isDriverAuthorized || !driver) {
      setPasswordChangeError("Unlock driver access before changing the password.");
      return;
    }

    const nextPassword = String(newDriverPassword || "").trim();
    const confirmPassword = String(confirmDriverPassword || "").trim();

    if (nextPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setPasswordChangeError("Passwords do not match.");
      return;
    }

    async function updatePassword(payload) {
      return await supabase
        .from("driver_access_codes")
        .update(payload)
        .eq("driver_number", String(driver.number));
    }

    let { error } = await updatePassword({
      code: nextPassword,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Could not change driver password:", error);
      setPasswordChangeError("Could not change password. Check driver_access_codes RLS update policy.");
      return;
    }

    const nextCodes = {
      ...driverAccessCodes,
      [String(driver.number)]: nextPassword,
      [String(driver.number).toLowerCase()]: nextPassword,
      [String(driver.name || "")]: nextPassword,
      [String(driver.name || "").toLowerCase()]: nextPassword,
    };

    localStorage.setItem("driverProfileAccessCodes", JSON.stringify(nextCodes));
    setDriverAccessCodes(nextCodes);
    setNewDriverPassword("");
    setConfirmDriverPassword("");
    setPasswordChangeMessage("Password updated. This new password now works anywhere the original driver password worked.");
  }

  function openProtectedDriverSection(path) {
    // Always move to the requested tool page.
    // If the driver is not unlocked yet, the protected page will show the access-code screen first.
    window.location.pathname = path;
  }

  function lockDriverContracts() {
    localStorage.removeItem("driverProfileAuthorizedNumber");
    setAuthorizedDriverNumber("");
    setDriverAccessCodeInput("");
    setPendingDriverPath("");
    setContractOffers([]);
  }

  async function updateOfferStatus(id, status) {
    const { error } = await supabase
      .from("contract_offers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Failed to update contract offer. Check contract_offers RLS update policy.");
      return false;
    }

    setContractOffers((prev) => prev.map((offer) => (offer.id === id ? { ...offer, status } : offer)));
    return true;
  }

  async function acceptContractOffer(offer) {
    if (!window.confirm(`Accept contract from ${offer.team} for ${money(offer.salary)} salary and ${money(offer.signing_bonus)} signing bonus?`)) return;

    const totalCost = Number(offer.salary || 0) + Number(offer.signing_bonus || 0);
    const { data: financeRow, error: financeLoadError } = await supabase
      .from("team_finances")
      .select("*")
      .eq("team", offer.team)
      .maybeSingle();

    if (financeLoadError) {
      console.error(financeLoadError);
      alert("Could not load team finances. Contract was not accepted.");
      return;
    }

    if (financeRow && Number(financeRow.balance || 0) < totalCost) {
      alert("This team does not have enough available balance to fund the accepted contract.");
      return;
    }

    const accepted = await updateOfferStatus(offer.id, "Accepted");
    if (!accepted) return;

    if (financeRow) {
      const { error: financeUpdateError } = await supabase
        .from("team_finances")
        .update({
          balance: Number(financeRow.balance || 0) - totalCost,
          payroll_spent: Number(financeRow.payroll_spent || 0) + Number(offer.salary || 0),
          signing_bonus_spent: Number(financeRow.signing_bonus_spent || 0) + Number(offer.signing_bonus || 0),
          updated_at: new Date().toISOString(),
        })
        .eq("id", financeRow.id);

      if (financeUpdateError) {
        console.error(financeUpdateError);
        alert("Contract accepted, but team finances were not updated. Check team_finances RLS update policy.");
      }
    }

    await supabase
      .from("contract_offers")
      .update({ status: "Declined", updated_at: new Date().toISOString() })
      .eq("driver_name", driver.name)
      .eq("status", "Pending")
      .neq("id", offer.id);

    setContractOffers((prev) => prev.map((item) => {
      if (item.id === offer.id) return { ...item, status: "Accepted" };
      if (item.status === "Pending") return { ...item, status: "Declined" };
      return item;
    }));

    alert("Contract accepted. Salary and signing bonus have been charged to the team account.");
  }

  async function declineContractOffer(offer) {
    if (!window.confirm(`Decline contract offer from ${offer.team}?`)) return;
    const declined = await updateOfferStatus(offer.id, "Declined");
    if (declined) alert("Contract offer declined.");
  }

  function updateRenegotiationField(field, value) {
    setRenegotiationForm((current) => ({ ...current, [field]: value }));
  }

  async function submitRenegotiationRequest(event) {
    event?.preventDefault?.();
    setRenegotiationMessage("");
    setRenegotiationError("");

    if (!isDriverAuthorized) {
      setRenegotiationError("Driver access required before requesting a renegotiation.");
      return;
    }

    const requestedSalary = Number(renegotiationForm.requested_salary) || 0;
    const requestedSigningBonus = Number(renegotiationForm.requested_signing_bonus) || 0;
    const requestedLength = Number(renegotiationForm.requested_contract_length) || 0;
    const requestedBuyout = Number(renegotiationForm.requested_buyout_amount) || 0;
    const requestedWinBonus = Number(renegotiationForm.requested_win_bonus) || 0;
    const requestedChampionshipBonus = Number(renegotiationForm.requested_championship_bonus) || 0;

    if (requestedSalary < 250000) {
      setRenegotiationError("Requested salary must be at least $250,000.");
      return;
    }

    if (requestedLength < 1) {
      setRenegotiationError("Requested contract length must be at least 1 season.");
      return;
    }

    if (requestedSigningBonus < 0 || requestedBuyout < 0 || requestedWinBonus < 0 || requestedChampionshipBonus < 0) {
      setRenegotiationError("Contract money fields cannot be negative.");
      return;
    }

    if (requestedBuyout > requestedSalary * 1.5) {
      setRenegotiationError("Requested buyout cannot exceed 1.5x the requested salary.");
      return;
    }

    const teamName = getTeamFullName(driver.team || "Independent");
    const payload = {
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: teamName,
      manufacturer: driver.manufacturer || "",
      salary: requestedSalary,
      signing_bonus: requestedSigningBonus,
      contract_length: requestedLength,
      buyout_amount: requestedBuyout,
      win_bonus: requestedWinBonus,
      championship_bonus: requestedChampionshipBonus,
      status: "Renegotiation Requested",
      created_by_team: teamName,
      brand_style: "Driver Requested Renegotiation",
      media_requirements: "",
      no_trade_clause: false,
      team_option: false,
      mutual_option: false,
      guaranteed_seat: false,
      notes: `${renegotiationForm.message || "Driver requested a new contract conversation."}\n\nDriver Satisfaction: ${driverSatisfaction.score}/100 (${driverSatisfaction.status})`,
      created_at: new Date().toISOString(),
    };

    setRenegotiationSubmitting(true);
    const { data, error } = await supabase.from("contract_offers").insert([payload]).select().single();
    setRenegotiationSubmitting(false);

    if (error) {
      console.error("Renegotiation request failed:", error);
      setRenegotiationError("Could not send renegotiation request. Check contract_offers RLS insert policy.");
      return;
    }

    setContractOffers((current) => [data || payload, ...(current || [])]);
    setRenegotiationForm(DEFAULT_RENEGOTIATION_FORM);
    setRenegotiationMessage("Renegotiation request sent to Team HQ.");
  }

  async function handleCarUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !driver) return;
    if (!selectedRaceForUpload) {
      alert("Please select a race week before uploading.");
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/mov", "video/quicktime"];
    if (!allowed.includes(file.type)) {
      alert("Only image or video files are allowed.");
      return;
    }

    setCarUploading(true);
    const uploadSeries = isCupDriverProfile ? "cup" : "arca";
    const result = await uploadCarFile(driver.id, driver.name, selectedRaceForUpload, file, uploadSeries);
    if (result.success) {
      const updated = await getCarUploads(driver.id, null, uploadSeries);
      setCarUploads(updated || []);
      alert("✅ Car photo uploaded! It will appear in the admin gallery.");
    } else {
      alert(`Upload failed: ${result.error || "Unknown error"}`);
    }
    setCarUploading(false);
    if (carFileInputRef.current) carFileInputRef.current.value = "";
  }

  async function handleCarDelete(uploadId, filePath) {
    if (!window.confirm("Remove this upload?")) return;
    const result = await deleteCarUpload(uploadId, filePath);
    if (result.success) setCarUploads((prev) => prev.filter((u) => u.id !== uploadId));
    else alert("Failed to delete upload.");
  }

  async function updateDriverAssignmentStatus(taskId, status) {
    setDriverAssignmentMessage("");
    setDriverAssignmentError("");

    const { error } = await supabase
      .from("driver_tasks")
      .update({ status })
      .eq("id", taskId);

    if (error) {
      console.error("Could not update driver assignment:", error);
      setDriverAssignmentError("Could not update assignment. Check driver_tasks RLS update policy.");
      return;
    }

    setDriverAssignments((current) => current.map((task) => task.id === taskId ? { ...task, status } : task));
    setDriverAssignmentMessage(status === "Completed" ? "Assignment marked complete." : `Assignment marked ${status}.`);
  }

  async function respondToRaceAssignment(assignmentId, response) {
    if (!assignmentId) return;
    setDriverAssignmentMessage("");
    setDriverAssignmentError("");

    const normalizedResponse = String(response || "").toLowerCase();
    const nextStatus = normalizedResponse === "accepted" ? "driver_accepted" : "driver_declined";

    const { error } = await supabase
      .from("owner_driver_assignments")
      .update({
        status: nextStatus,
        driver_response: normalizedResponse,
        driver_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    if (error) {
      console.error("Could not update race assignment:", error);
      setDriverAssignmentError("Could not update substitute request. Check owner_driver_assignments update policy.");
      return;
    }

    setRaceAssignmentRequests((current) => current.filter((assignment) => assignment.id !== assignmentId));
    await loadOwnerDriverAssignments?.();
    setDriverAssignmentMessage(normalizedResponse === "accepted" ? "Race assignment accepted." : "Race assignment declined.");
  }

  function updateFeedbackField(field, value) {
    setFeedbackForm((current) => ({ ...current, [field]: value }));
  }

  async function loadDevelopmentData() {
    try {
      const [txResult, startsResult] = await Promise.all([
        supabase
          .from("league_transactions")
          .select("*")
          .eq("transaction_type", "development_request")
          .order("created_at", { ascending: false }),
        supabase
          .from("developmental_starts")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (txResult.error) throw txResult.error;
      if (startsResult.error) throw startsResult.error;
      setDevelopmentTransactions(txResult.data || []);
      setDevelopmentStarts(startsResult.data || []);
      setDevelopmentError("");
    } catch (error) {
      console.error("Could not load developmental ride data:", error);
      setDevelopmentError("Could not load developmental ride data. Check league_transactions and developmental_starts tables/RLS policies.");
    }
  }

  useEffect(() => {
    if (!driver) return;
    loadDevelopmentData();
    const interval = setInterval(loadDevelopmentData, 30000);
    return () => clearInterval(interval);
  }, [driver?.number]);

  useEffect(() => {
    const teams = lowerSeriesTeamOptions[developmentForm.requested_series] || [];
    if (!developmentForm.requested_team && teams[0]) {
      setDevelopmentForm((current) => ({ ...current, requested_team: teams[0] }));
    }
  }, [developmentForm.requested_series, developmentForm.requested_team, lowerSeriesTeamOptions]);

  function updateDevelopmentSeries(series) {
    const teams = lowerSeriesTeamOptions[series] || [];
    setDevelopmentForm((current) => ({
      ...current,
      requested_series: series,
      requested_team: teams[0] || "",
    }));
  }

  async function submitDevelopmentRequest(event) {
    event.preventDefault();
    setDevelopmentMessage("");
    setDevelopmentError("");

    if (!isDriverAuthorized) {
      setDevelopmentError("Enter this driver's access code before requesting a developmental ride.");
      return;
    }

    if (!isCupDriverProfile) {
      setDevelopmentError("Only Cup Series drivers can request developmental rides.");
      return;
    }

    if (!developmentForm.requested_series || !developmentForm.requested_team) {
      setDevelopmentError("Choose a series and team before submitting.");
      return;
    }

    const startsUsed = developmentStartsBySeries[developmentForm.requested_series] || 0;
    const requiresBoardApproval = startsUsed >= 2;

    setDevelopmentSubmitting(true);
    try {
      const payload = {
        transaction_type: "development_request",
        driver_number: String(driver.number),
        driver_name: driver.name,
        current_series: "cup",
        requested_series: developmentForm.requested_series,
        current_team: driver.team || null,
        requested_team: developmentForm.requested_team,
        current_owner: null,
        requested_owner: "TBD",
        initiated_by: driver.name,
        owner_status: "pending",
        board_status: requiresBoardApproval ? "pending" : "approved",
        final_status: "pending",
        race_name: developmentForm.race_name || null,
        assignment_source: "driver_request",
        requires_board_approval: requiresBoardApproval,
        request_note: developmentForm.request_note || null,
      };

      const { error } = await supabase.from("league_transactions").insert(payload);
      if (error) throw error;

      setDevelopmentMessage(requiresBoardApproval
        ? "Request submitted. This is over the 2-start limit, so board approval will be required after owner approval."
        : "Request submitted to the lower-series owner for approval.");
      setDevelopmentForm((current) => ({ ...current, request_note: "" }));
      await loadDevelopmentData();
    } catch (error) {
      console.error("Could not submit developmental ride request:", error);
      setDevelopmentError(error.message || "Could not submit developmental ride request.");
    } finally {
      setDevelopmentSubmitting(false);
    }
  }


  async function submitDriverFeedback(event) {
    event.preventDefault();
    setFeedbackMessage("");
    setFeedbackError("");

  
    if (!driver) {
      setFeedbackError("Driver profile could not be loaded.");
      return;
    }

    const payload = {
      driver_id: String(driver.id),
      driver_name: driver.name || "",
      driver_number: String(driver.number || ""),
      team: getTeamFullName(driver.team || "Independent"),
      team_key: driver.team || "Independent",
      manufacturer: driver.manufacturer || "",
      team_happiness: Number(feedbackForm.team_happiness) || 0,
      equipment_quality: Number(feedbackForm.equipment_quality) || 0,
      team_communication: Number(feedbackForm.team_communication) || 0,
      leadership_confidence: Number(feedbackForm.leadership_confidence) || 0,
      manufacturer_support: Number(feedbackForm.manufacturer_support) || 0,
      future_confidence: Number(feedbackForm.future_confidence) || 0,
      comments: feedbackForm.comments || "",
      created_at: new Date().toISOString(),
    };

    setFeedbackSubmitting(true);
    const { error } = await supabase.from("driver_feedback").insert([payload]);
    setFeedbackSubmitting(false);

    if (error) {
      console.error("Driver feedback insert failed:", error);
      try {
        const saved = JSON.parse(localStorage.getItem("bclDriverFeedbackRatings") || "[]");
        localStorage.setItem("bclDriverFeedbackRatings", JSON.stringify([{ ...payload, id: `local-${Date.now()}` }, ...saved]));
        setFeedbackMessage("Feedback saved on this browser. Add or check the driver_feedback table in Supabase to make it visible in Team HQ everywhere.");
        setFeedbackForm((current) => ({ ...current, comments: "" }));
        return;
      } catch {
        setFeedbackError("Could not save feedback. Check your driver_feedback Supabase table and RLS policies.");
        return;
      }
    }

    setFeedbackMessage("Feedback submitted. Your team owner will see the updated morale signal in Team HQ.");
    setFeedbackForm((current) => ({ ...current, comments: "" }));
  }

  const feedbackRatingFields = [
    ["team_happiness", "Team Happiness", "How happy are you with your organization?"],
    ["equipment_quality", "Equipment Quality", "How competitive is your equipment?"],
    ["team_communication", "Team Communication", "How well does the team work together?"],
    ["leadership_confidence", "Owner Leadership", "How confident are you in ownership?"],
    ["manufacturer_support", "Manufacturer Support", "How strong is manufacturer support?"],
    ["future_confidence", "Future Confidence", "Do you believe this team can win?"],
  ];

  const protectedDriverPages = ["contracts", "upload", "interviews", "appeals", "feedback", "assignments", "messages", "team-interest", "start-park", "settings", "development", "portal"];

  if (protectedDriverPages.includes(subPage) && !isDriverAuthorized) {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Driver Access Required</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Unlock to use contracts, uploads, interviews, appeals, assignments, messages, and driver feedback.</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0 }}>🔒 Driver Access Locked</h2>
            <div style={{ fontSize: 14, opacity: 0.72, lineHeight: 1.6, marginBottom: 16 }}>
              Enter the private driver access code for #{driver.number} {driver.name}. This keeps other people from answering interviews, submitting happiness feedback, viewing assignments, reading messages, uploading files, or managing contracts.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER ACCESS CODE</div>
                <input
                  value={driverAccessCodeInput}
                  onChange={(event) => setDriverAccessCodeInput(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") unlockDriverContracts(); }}
                  placeholder={`Enter #${driver.number} driver code`}
                  type="password"
                  style={inputStyle}
                  autoFocus
                />
              </div>
              <button onClick={unlockDriverContracts} style={themedPrimaryButtonStyle}>Unlock Driver Access</button>
            </div>

            {contractError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{contractError}</div>}
          </div>
        </div>
      </div>
    );
  }

  const passwordManagerCard = isDriverAuthorized ? (
    <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
      <h2 style={{ marginTop: 0 }}>🔑 Driver Password</h2>
      <p style={{ opacity: 0.72, lineHeight: 1.5 }}>
        Change your driver profile password here. This same password can also unlock your owner/team page if you are assigned as a team owner.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>NEW PASSWORD</div>
          <input
            type="password"
            value={newDriverPassword}
            onChange={(event) => setNewDriverPassword(event.target.value)}
            placeholder="Enter new password"
            style={inputStyle}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>CONFIRM PASSWORD</div>
          <input
            type="password"
            value={confirmDriverPassword}
            onChange={(event) => setConfirmDriverPassword(event.target.value)}
            placeholder="Confirm new password"
            style={inputStyle}
          />
        </div>
        <button type="button" onClick={changeDriverPassword} style={themedPrimaryButtonStyle}>Update Password</button>
      </div>
      {passwordChangeMessage && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 800 }}>{passwordChangeMessage}</div>}
      {passwordChangeError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 800 }}>{passwordChangeError}</div>}
    </div>
  ) : null;

  if (subPage === "team-interest") {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Team Interest</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Privately notify owners that you are interested in their organization.</div>
            </div>
            {isDriverAuthorized && <button onClick={lockDriverContracts} style={{ ...secondaryButtonStyle, marginLeft: "auto" }}>Lock Driver Access</button>}
          </div>

          <form onSubmit={submitTeamInterest} style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0 }}>🤝 Express Interest in a Team</h2>
            <p style={{ opacity: 0.72, lineHeight: 1.5 }}>
              This sends a private interest card to the selected team owner inside Team HQ. It does not change your current team or contract.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TEAM</div>
                <select value={teamInterestForm.interested_team} onChange={(event) => updateTeamInterestField("interested_team", event.target.value)} style={inputStyle}>
                  <option value="">Choose team</option>
                  {teamInterestOptions.map((team) => (
                    <option key={team} value={team}>{getTeamFullName(team)}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>INTEREST LEVEL</div>
                <select value={teamInterestForm.interest_level} onChange={(event) => updateTeamInterestField("interest_level", event.target.value)} style={inputStyle}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Priority Target">Priority Target</option>
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>MESSAGE TO OWNER OPTIONAL</div>
              <textarea
                value={teamInterestForm.message}
                onChange={(event) => updateTeamInterestField("message", event.target.value)}
                placeholder="Tell the owner why you're interested, what you bring, or what kind of deal you'd consider..."
                rows={5}
                style={{ ...inputStyle, resize: "vertical" }}
                maxLength={1000}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <button type="submit" disabled={teamInterestSubmitting} style={{ ...themedPrimaryButtonStyle, opacity: teamInterestSubmitting ? 0.65 : 1 }}>
                {teamInterestSubmitting ? "Sending..." : "Send Team Interest"}
              </button>
              <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 700 }}>{teamInterestForm.message.length}/1000 characters</div>
            </div>
            {teamInterestNotice && <div style={{ background: "rgba(52,199,89,0.10)", border: "1px solid rgba(52,199,89,0.28)", borderRadius: 14, padding: 12, marginTop: 14, color: "#147d35", fontWeight: 700, fontSize: 13.5 }}>{teamInterestNotice}</div>}
            {teamInterestError && <div style={{ background: "rgba(255,59,48,0.10)", border: "1px solid rgba(255,59,48,0.28)", borderRadius: 14, padding: 12, marginTop: 14, color: "#c62d24", fontWeight: 700, fontSize: 13.5 }}>{teamInterestError}</div>}
          </form>

          <div style={sectionCardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📋</div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>My Team Interest History</h2>
            </div>
            {teamInterestHistory.length === 0 ? (
              <div style={{ color: "#6e6e73", fontWeight: 700 }}>No team interest submitted yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {teamInterestHistory.map((interest) => {
                  const isClosed = interest.status === "Closed";
                  return (
                    <div key={interest.id || `${interest.interested_team}-${interest.created_at}`} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 18, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 950, color: "#1d1d1f" }}>{getTeamFullName(interest.interested_team)}</div>
                          <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 700, marginTop: 3 }}>Level: {interest.interest_level || "Medium"}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ display: "inline-block", background: isClosed ? "rgba(0,0,0,0.06)" : "rgba(52,199,89,0.12)", color: isClosed ? "#6e6e73" : "#147d35", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 900 }}>{interest.status || "Open"}</span>
                          <div style={{ fontSize: 11, color: "#86868b", fontWeight: 700, marginTop: 6 }}>{interest.created_at ? new Date(interest.created_at).toLocaleString() : ""}</div>
                        </div>
                      </div>
                      {interest.message && <div style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.55, whiteSpace: "pre-wrap", color: "#3a3a3c", fontWeight: 600 }}>{interest.message}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  if (subPage === "portal") {
    return <DriverTransferPortalPanel driver={driver} driverNumber={driverNumber} teamTheme={teamTheme} standingsRoute={standingsRoute} />;
  }

  if (subPage === "development") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Developmental Ride</div>
              <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>Request Xfinity, Truck, or ARCA starts.</div>
            </div>
          </div>

          {isArcaDriver ? (
            <div style={sectionCardStyle}>
              <div style={{ color: "#6e6e73", fontWeight: 700 }}>Developmental ride requests are only available for Cup Series drivers.</div>
            </div>
          ) : (
        <div style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🏎️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Developmental Rides</h2>
              <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>
                Cup drivers can request Xfinity, Truck, or ARCA starts. Driver points and payout are disabled; team/owner credit remains active.
              </div>
            </div>
          </div>

          {developmentError && (
            <div style={{ background: "rgba(255,59,48,0.10)", border: "1px solid rgba(255,59,48,0.28)", borderRadius: 14, padding: 12, marginBottom: 12, color: "#c62d24", fontWeight: 700, fontSize: 13.5 }}>
              {developmentError}
            </div>
          )}
          {developmentMessage && (
            <div style={{ background: "rgba(52,199,89,0.10)", border: "1px solid rgba(52,199,89,0.28)", borderRadius: 14, padding: 12, marginBottom: 12, color: "#147d35", fontWeight: 700, fontSize: 13.5 }}>
              {developmentMessage}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
            {DEVELOPMENT_SERIES_OPTIONS.map((series) => {
              const used = developmentStartsBySeries[series.value] || 0;
              const remaining = Math.max(0, 2 - used);
              return (
                <div key={series.value} style={{ background: "rgba(0,0,0,0.03)", border: `1px solid ${remaining > 0 ? `${teamTheme.accent}44` : "rgba(255,149,0,0.35)"}`, borderRadius: 16, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 6, letterSpacing: "0.04em" }}>{series.label.toUpperCase()}</div>
                  <div style={{ fontSize: 26, fontWeight: 950, color: "#1d1d1f" }}>{used} / 2</div>
                  <div style={{ fontSize: 11.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>{remaining > 0 ? `${remaining} start${remaining === 1 ? "" : "s"} remaining` : "Board approval required"}</div>
                </div>
              );
            })}
          </div>

          {isCupDriverProfile && !isDriverAuthorized ? (
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 950, marginBottom: 6, color: "#1d1d1f" }}>🔒 Driver Access Required</div>
              <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 700, lineHeight: 1.5 }}>
                Approved and owner-assigned developmental rides can be viewed here, but submitting a new ride request requires this driver's private access code. Unlock the profile at the top just like interviews and car uploads.
              </div>
            </div>
          ) : isCupDriverProfile ? (
            <form onSubmit={submitDevelopmentRequest} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#1d1d1f" }}>Series</div>
                  <select value={developmentForm.requested_series} onChange={(event) => updateDevelopmentSeries(event.target.value)} style={inputStyle}>
                    {DEVELOPMENT_SERIES_OPTIONS.map((series) => <option key={series.value} value={series.value}>{series.label}</option>)}
                  </select>
                </label>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#1d1d1f" }}>Team</div>
                  <select value={developmentForm.requested_team} onChange={(event) => setDevelopmentForm((current) => ({ ...current, requested_team: event.target.value }))} style={inputStyle}>
                    {(lowerSeriesTeamOptions[developmentForm.requested_series] || []).map((team) => <option key={team} value={team}>{team}</option>)}
                  </select>
                </label>
                <label>
                  <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#1d1d1f" }}>Race</div>
                  <select value={developmentForm.race_name} onChange={(event) => setDevelopmentForm((current) => ({ ...current, race_name: event.target.value }))} style={inputStyle}>
                    <option value="">Owner assigns later</option>
                    {developmentRaceOptions.map((race) => <option key={race} value={race}>{race}</option>)}
                  </select>
                </label>
              </div>
              <label style={{ display: "block", marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 6, color: "#1d1d1f" }}>Note to Owner</div>
                <textarea value={developmentForm.request_note} onChange={(event) => setDevelopmentForm((current) => ({ ...current, request_note: event.target.value }))} style={{ ...inputStyle, minHeight: 74, resize: "vertical" }} placeholder="Example: I want to run this one for fun and help the team earn owner money." />
              </label>
              <button type="submit" disabled={developmentSubmitting} style={{ ...themedPrimaryButtonStyle, marginTop: 12 }}>
                {developmentSubmitting ? "Submitting..." : "Request Development Ride"}
              </button>
            </form>
          ) : (
            <div style={{ color: "#6e6e73", fontWeight: 700, marginBottom: 12 }}>Developmental ride requests are only available for Cup Series drivers.</div>
          )}

          <h3 style={{ marginTop: 0, color: "#1d1d1f" }}>My Requests</h3>
          {myDevelopmentTransactions.length === 0 ? (
            <div style={{ color: "#6e6e73", fontWeight: 700 }}>No developmental ride requests yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr><th style={thStyle}>Series</th><th style={thStyle}>Team</th><th style={thStyle}>Race</th><th style={thStyle}>Owner</th><th style={thStyle}>Board</th><th style={thStyle}>Final</th></tr>
                </thead>
                <tbody>
                  {myDevelopmentTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={tdStyle}>{String(tx.requested_series || "").toUpperCase()}</td>
                      <td style={tdStyle}>{tx.requested_team || "—"}</td>
                      <td style={tdStyle}>{tx.race_name || "Owner assigns"}</td>
                      <td style={tdStyle}>{getDevelopmentStatusLabel(tx.owner_status)}</td>
                      <td style={tdStyle}>{tx.requires_board_approval ? getDevelopmentStatusLabel(tx.board_status) : "Not needed"}</td>
                      <td style={{ ...tdStyle, fontWeight: 900 }}>
                        <span style={{ display: "inline-flex", border: "1px solid", borderRadius: 999, padding: "4px 8px", ...developmentBadgeStyle(tx.final_status) }}>
                          {getDevelopmentStatusLabel(tx.final_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
          )}
        </div>
      </div>
    );
  }

  if (subPage === "start-park") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Start & Park Request</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Requests close Saturday at 9:00 PM ET. Race Control approves requests and places approved cars at the rear by receipt order.</div>
            </div>
            {isDriverAuthorized && <button onClick={lockDriverContracts} style={{ ...secondaryButtonStyle, marginLeft: "auto" }}>Lock Driver Access</button>}
          </div>

          <form onSubmit={submitStartParkRequest} style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0 }}>🏁 Request Start & Park</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>RACE</div>
                <select value={startParkForm.race_name} onChange={(event) => updateStartParkRace(event.target.value)} style={inputStyle}>
                  <option value="">Select race</option>
                  {startParkRaceOptions.map((race) => <option key={race.name} value={race.name}>{race.name} — deadline 9:00 PM ET</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>STATUS</div>
                <div style={{ ...inputStyle, color: selectedStartParkCutoff.closed ? "#f87171" : "#4ade80", fontWeight: 900 }}>
                  {startParkForm.race_name ? (selectedStartParkCutoff.closed ? "Closed" : "Open") : "Choose a race"}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>REASON OPTIONAL</div>
              <textarea value={startParkForm.reason} onChange={(event) => setStartParkForm((current) => ({ ...current, reason: event.target.value }))} style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} placeholder="Reason for Start & Park request" maxLength={500} />
            </div>
            <div style={{ marginTop: 12, opacity: 0.72, fontSize: 13 }}>{startParkForm.race_name ? selectedStartParkCutoff.label : "Requests must be submitted before Saturday 9:00 PM ET."}</div>
            <button type="submit" disabled={startParkSubmitting || selectedStartParkCutoff.closed} style={{ ...themedPrimaryButtonStyle, marginTop: 14, opacity: startParkSubmitting || selectedStartParkCutoff.closed ? 0.6 : 1 }}>{startParkSubmitting ? "Submitting..." : "Submit Start & Park Request"}</button>
            {startParkMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{startParkMessage}</div>}
            {startParkError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{startParkError}</div>}
          </form>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Request History</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Requested</th><th style={thStyle}>Status</th><th style={thStyle}>Reason</th></tr></thead>
                <tbody>
                  {startParkRequests.map((request) => <tr key={request.id || `${request.race_name}-${request.created_at}`}><td style={tdStyle}>{request.race_name}</td><td style={tdStyle}>{request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</td><td style={{ ...tdStyle, fontWeight: 900 }}>{String(request.status || "pending").toUpperCase()}</td><td style={tdStyle}>{request.reason || "—"}</td></tr>)}
                  {startParkRequests.length === 0 && <tr><td style={tdStyle} colSpan={4}>No Start & Park requests yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "settings") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Settings</div>
              <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>Manage your account access and password.</div>
            </div>
          </div>

          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>⚙️ Account</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 6 }}>
              <div style={{ background: isDriverAuthorized ? "rgba(52,199,89,0.12)" : "rgba(0,0,0,0.05)", color: isDriverAuthorized ? "#147d35" : "#6e6e73", border: `1px solid ${isDriverAuthorized ? "rgba(52,199,89,0.25)" : "rgba(0,0,0,0.08)"}`, borderRadius: 999, padding: "9px 14px", fontSize: 12, fontWeight: 900 }}>
                {isDriverAuthorized ? "✅ Driver Access Authorized" : "🔒 Driver Access Locked"}
              </div>
              {isDriverAuthorized && <button onClick={lockDriverContracts} style={secondaryButtonStyle}>Lock Driver Access</button>}
            </div>
            <div style={{ fontSize: 13, color: "#6e6e73", fontWeight: 700, marginTop: 10 }}>
              #{driver.number} · {getTeamFullName(driver.team)} · {driver.manufacturer || "—"}
            </div>
          </div>

          {passwordManagerCard}
        </div>
      </div>
    );
  }

  if (subPage === "messages") {
    const groupedMessages = driverMessages.reduce((groups, message) => {
      const otherNumber = String(message.sender_driver_number) === String(driver.number)
        ? String(message.recipient_driver_number || "")
        : String(message.sender_driver_number || "");
      if (!groups[otherNumber]) groups[otherNumber] = [];
      groups[otherNumber].push(message);
      return groups;
    }, {});

    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Message Center</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Direct messages, Race Control notices, team messages, and league alerts are only visible after driver access is unlocked.</div>
            </div>
            {isDriverAuthorized && <button onClick={lockDriverContracts} style={{ ...secondaryButtonStyle, marginLeft: "auto" }}>Lock Driver Access</button>}
          </div>

          <form onSubmit={sendDriverMessage} style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0 }}>✉️ Send Direct Message</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>TO DRIVER</div>
                <select value={messageRecipientNumber} onChange={(event) => setMessageRecipientNumber(event.target.value)} style={inputStyle}>
                  <option value="">Choose driver</option>
                  {messageRecipientOptions.map((item) => (
                    <option key={item.id || item.number} value={String(item.number)}>#{item.number} {item.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>SUBJECT OPTIONAL</div>
                <input value={messageSubject} onChange={(event) => setMessageSubject(event.target.value)} placeholder="Race strategy, contract, practice, etc." style={inputStyle} maxLength={120} />
              </div>
            </div>
            <textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} placeholder="Type your message..." rows={5} style={{ ...inputStyle, resize: "vertical" }} maxLength={1200} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
              <button type="submit" style={themedPrimaryButtonStyle}>Send Message</button>
              <div style={{ fontSize: 12, opacity: 0.65 }}>{messageBody.length}/1200 characters</div>
            </div>
            {messageNotice && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 800 }}>{messageNotice}</div>}
            {messageError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 800 }}>{messageError}</div>}
          </form>

          <div style={sectionCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0 }}>📩 Inbox</h2>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>{driverMessages.length} message{driverMessages.length !== 1 ? "s" : ""} loaded</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" onClick={() => loadDriverMessages(false)} style={secondaryButtonStyle}>{messagesLoading ? "Refreshing..." : "Refresh"}</button><button type="button" onClick={markAllDriverMessagesRead} style={primaryButtonStyle}>Mark All Read</button></div>
            </div>

            {driverMessages.length === 0 ? (
              <div style={{ opacity: 0.72 }}>No Message Center items yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {Object.entries(groupedMessages).map(([otherNumber, messages]) => {
                  const otherDriver = sanitizedDrivers.find((item) => String(item.number) === String(otherNumber));
                  return (
                    <div key={otherNumber || "unknown"} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                      <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 10 }}>
                        Conversation with {otherDriver ? `#${otherDriver.number} ${otherDriver.name}` : `#${otherNumber || "Unknown"}`}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {messages.map((message) => {
                          const sentByMe = String(message.sender_driver_number) === String(driver.number);
                          return (
                            <div key={message.id || `${message.created_at}-${message.message}`} style={{ marginLeft: sentByMe ? "auto" : 0, maxWidth: "82%", background: !sentByMe && !message.is_read ? "#2a240f" : (sentByMe ? teamTheme.dark : "#151b24"), border: `1px solid ${!sentByMe && !message.is_read ? "#d4af37" : (sentByMe ? teamTheme.accent : "#313947")}`, borderRadius: 12, padding: 12 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                                <div style={{ fontSize: 12, fontWeight: 900, color: sentByMe ? teamTheme.accent : "#e5e7eb" }}>{sentByMe ? "You" : (message.sender_name || `#${message.sender_driver_number}`)}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><span style={{ fontSize: 11, opacity: 0.55 }}>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</span>{!sentByMe && <span style={{ fontSize: 10, fontWeight: 900, padding: "2px 7px", borderRadius: 999, background: message.is_read ? "#102a16" : "#3a3200", color: message.is_read ? "#4ade80" : "#facc15" }}>{message.is_read ? "READ" : "UNREAD"}</span>}</div>
                              </div>
                              {message.subject && <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 6 }}>{message.subject}</div>}
                              <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{message.message}</div>
                              {!sentByMe && (
                                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                                  {!message.is_read ? (
                                    <button type="button" onClick={() => updateDriverMessageReadStatus(message.id, true)} style={{ ...secondaryButtonStyle, padding: "6px 10px", fontSize: 12 }}>Mark Read</button>
                                  ) : (
                                    <button type="button" onClick={() => updateDriverMessageReadStatus(message.id, false)} style={{ ...secondaryButtonStyle, padding: "6px 10px", fontSize: 12 }}>Mark Unread</button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "appeals") {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{driver ? `#${driver.number} ${driver.name}` : `Driver #${driverNumber}`} — Appeals</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{myAppeals.length} appeal{myAppeals.length !== 1 ? "s" : ""} total</div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setIsAppealModalOpen(true)} style={themedPrimaryButtonStyle}>📋 File New Appeal</button>
            {/* <button onClick={() => setIsReportingIssue(true)} style={{ ...themedPrimaryButtonStyle, marginLeft: 12 }}>🐛 Report Issue</button> */}
            {/* TODO: Uncomment once ReportIssueModal.jsx is in repo */}
          </div>

          {myAppeals.length === 0 ? (
            <div style={{ ...sectionCardStyle, opacity: 0.7 }}>No appeals submitted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myAppeals.map((appeal) => {
                const statusConfig = {
                  Open: { color: "#3b82f6", bg: "#0f1d35", border: "#1e3a6e", icon: "🕐" },
                  Approved: { color: "#22c55e", bg: "#0e2918", border: "#1a5c30", icon: "✅" },
                  Denied: { color: "#ef4444", bg: "#2a0e0e", border: "#6b1a1a", icon: "❌" },
                }[appeal.status] || { color: "#888", bg: "#111", border: "#333", icon: "?" };

                return (
                  <div key={appeal.id} style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{statusConfig.icon}</span>
                        <span style={{ fontWeight: 800, fontSize: 16 }}>{appeal.track}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ background: statusConfig.color, color: "white", borderRadius: 8, padding: "3px 12px", fontSize: 12, fontWeight: 800 }}>{appeal.status}</span>
                        <span style={{ fontSize: 12, opacity: 0.5 }}>{new Date(appeal.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6 }}>{appeal.description}</div>
                    {appeal.evidence_url && <div style={{ marginTop: 10 }}><video controls width="100%" style={{ maxWidth: 480, borderRadius: 8 }} src={appeal.evidence_url} /></div>}
                    {appeal.admin_notes && (
                      <div style={{ marginTop: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${statusConfig.color}` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>League Determination</div>
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>{appeal.admin_notes}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} selectedSeason={selectedSeason} driverNumber={driverNumber} arcaDrivers={arcaDrivers} allDrivers={sanitizedDrivers} tracks={tracks} arcaTracks={arcaTracks} />
        {/* <ReportIssueModal
          isOpen={isReportingIssue}
          onClose={() => setIsReportingIssue(false)}
          driverNumber={driverNumber}
          driverName={driver?.name || ""}
          series={isArcaDriver ? "arca" : "cup"}
        /> */}
        {/* TODO: Uncomment once ReportIssueModal.jsx is in repo */}
      </div>
    );
  }

  const standingsRoute = isArcaDriver ? "/series/arca/standings" : "/standings";

  if (!selectedSeason) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <button onClick={() => window.location.pathname = standingsRoute} style={secondaryButtonStyle}>← Back to Standings</button>
            <div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>No season data loaded.</div>
            <div style={{ opacity: 0.75 }}>Try refreshing the page or returning to standings.</div>
          </div>
        </div>
      </div>
    );
  }

  // ARCA driver profile view
  if (!driver && !isArcaDriver) {
    return (
      <div style={appShellStyle}>
        <div style={pageContainerStyle}>
          <div style={sectionCardStyle}>
            <button onClick={() => window.location.pathname = standingsRoute} style={secondaryButtonStyle}>← Back to Standings</button>
            <div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>Driver #{driverNumber} not found in {selectedSeason?.name}</div>
            <div style={{ opacity: 0.75 }}>Check the standings page to select a valid driver.</div>
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "assignments") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Team Assignments</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Tasks assigned by your team owner</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>🎯 Team Assignments</h2>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 6 }}>Review owner-issued tasks, accept them, reject them, or mark them complete.</div>
              </div>
              <div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 999, padding: "8px 12px", fontSize: 12, fontWeight: 900 }}>
                {driverAssignments.length} assignment{driverAssignments.length !== 1 ? "s" : ""}
              </div>
            </div>

            {driverAssignmentMessage && <div style={{ color: "#4ade80", marginBottom: 12, fontWeight: 900 }}>{driverAssignmentMessage}</div>}
            {driverAssignmentError && <div style={{ color: "#f87171", marginBottom: 12, fontWeight: 900 }}>{driverAssignmentError}</div>}

            {raceAssignmentRequests.length > 0 && (
              <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
                {raceAssignmentRequests.map((assignment) => (
                  <div key={assignment.id} style={{ background: "#101827", border: `1px solid ${teamTheme.accent}`, borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.72, textTransform: "uppercase" }}>Approved Race Assignment</div>
                    <div style={{ fontSize: 20, fontWeight: 900, marginTop: 5 }}>
                      {assignment.race_name || assignment.race_id || "Selected Race"}
                    </div>
                    <div style={{ opacity: 0.82, fontSize: 13, lineHeight: 1.6, marginTop: 8 }}>
                      <div><strong>Team:</strong> {assignment.team_name || assignment.team_key || "Team"}</div>
                      <div><strong>Original Car:</strong> #{assignment.original_driver_number || assignment.car_number} {assignment.original_driver_name || ""}</div>
                      <div><strong>Requested Driver:</strong> #{assignment.assigned_driver_number || driver.number} {assignment.assigned_driver_name || driver.name}</div>
                      <div><strong>Type:</strong> {String(assignment.assignment_type || "substitute").replaceAll("_", " ")}</div>
                      {assignment.owner_note && <div><strong>Owner Note:</strong> {assignment.owner_note}</div>}
                    </div>
                    <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>
                      Admin approved this substitute assignment. No driver approval is required.
                    </div>
                  </div>
                ))}
              </div>
            )}

            {driverAssignments.length === 0 ? (
              <div style={{ opacity: 0.72 }}>No team assignments have been sent to you yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                {driverAssignments.map((task) => {
                  const status = String(task.status || "Assigned");
                  const completed = status === "Completed";
                  const rejected = status === "Rejected";
                  const accepted = status === "Accepted";
                  const cardBorder = completed ? "#22c55e" : rejected ? "#ef4444" : accepted ? teamTheme.accent : "#2c3440";
                  const cardBg = completed ? "#102a16" : rejected ? "#2a1111" : "#0f1319";
                  return (
                    <div key={task.id} style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.65, textTransform: "uppercase" }}>{task.team || getTeamFullName(driver.team)} • {status}</div>
                          <div style={{ fontSize: 19, fontWeight: 900, marginTop: 5 }}>{completed ? "✅ " : rejected ? "❌ " : "🎯 "}{task.title}</div>
                        </div>
                      </div>

                      {task.description && <div style={{ opacity: 0.78, fontSize: 13, lineHeight: 1.55, marginBottom: 12 }}>{task.description}</div>}
                      {task.due_race && <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>Due: {task.due_race}</div>}
                      <div style={{ fontSize: 13, fontWeight: 900, color: teamTheme.accent, marginBottom: 12 }}>Reward: {task.reward || "—"}</div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {status === "Assigned" && <button onClick={() => updateDriverAssignmentStatus(task.id, "Accepted")} style={themedPrimaryButtonStyle}>Accept</button>}
                        {!completed && !rejected && <button onClick={() => updateDriverAssignmentStatus(task.id, "Completed")} style={{ ...primaryButtonStyle, background: "#22c55e" }}>Mark Complete</button>}
                        {!completed && !rejected && <button onClick={() => updateDriverAssignmentStatus(task.id, "Rejected")} style={dangerButtonStyle}>Reject</button>}
                        {(completed || rejected) && <button onClick={() => updateDriverAssignmentStatus(task.id, "Assigned")} style={secondaryButtonStyle}>Reopen</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "feedback") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Driver Feedback</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Submit morale ratings for Team HQ</div>
            </div>
          </div>

          <form onSubmit={submitDriverFeedback} style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>😊 Driver Happiness Survey</h2>
            <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>
              Rate your team experience from 1–10. These ratings feed the Team HQ morale system for {getTeamFullName(driver.team)}.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {feedbackRatingFields.map(([field, label, help]) => (
                <div key={field} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 900 }}>{label}</div>
                    <div style={{ color: teamTheme.accent, fontWeight: 900 }}>{feedbackForm[field]}/10</div>
                  </div>
                  <div style={{ opacity: 0.65, fontSize: 12, margin: "6px 0 10px" }}>{help}</div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={feedbackForm[field]}
                    onChange={(event) => updateFeedbackField(field, event.target.value)}
                    style={{ width: "100%" }}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 900, opacity: 0.75, marginBottom: 8 }}>OPTIONAL OWNER NOTE</label>
              <textarea
                value={feedbackForm.comments}
                onChange={(event) => updateFeedbackField("comments", event.target.value)}
                placeholder="What should ownership know?"
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {feedbackMessage && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{feedbackMessage}</div>}
            {feedbackError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{feedbackError}</div>}

            <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
              <button type="submit" disabled={feedbackSubmitting} style={{ ...themedPrimaryButtonStyle, opacity: feedbackSubmitting ? 0.65 : 1 }}>
                {feedbackSubmitting ? "Submitting..." : "Submit Driver Feedback"}
              </button>
              <button type="button" onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>Back to Profile</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (subPage === "contracts") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Contract Portal</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>Private driver contract inbox</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, borderColor: isDriverAuthorized ? teamTheme.accent : "#2c3440" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>📄 Driver Contract Portal</h2>
                <div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Review, accept, or decline contract offers. Driver access is already authorized.</div>
              </div>
              {isDriverAuthorized && <button onClick={lockDriverContracts} style={secondaryButtonStyle}>Lock Driver Access</button>}
            </div>

            {isDriverAuthorized && (
              <div style={{ background: driverSatisfaction.bg, border: `1px solid ${driverSatisfaction.color}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7, fontWeight: 900 }}>DRIVER SATISFACTION</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: driverSatisfaction.color }}>{driverSatisfaction.status}</div>
                    <div style={{ fontSize: 13, opacity: 0.78, marginTop: 5 }}>{driverSatisfaction.summary}</div>
                  </div>
                  <div style={{ minWidth: 170 }}>
                    <div style={{ textAlign: "right", fontSize: 28, fontWeight: 900, color: driverSatisfaction.color }}>{driverSatisfaction.score}/100</div>
                    <div style={{ background: "#0f1319", borderRadius: 999, height: 10, overflow: "hidden", border: "1px solid #2c3440" }}>
                      <div style={{ width: `${driverSatisfaction.score}%`, height: "100%", background: driverSatisfaction.color }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isDriverAuthorized ? (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER CODE</div>
                    <input value={driverAccessCodeInput} onChange={(event) => setDriverAccessCodeInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") unlockDriverContracts(); }} placeholder={`Enter #${driver.number} driver code`} style={inputStyle} />
                  </div>
                  <button onClick={unlockDriverContracts} style={themedPrimaryButtonStyle}>Unlock My Contracts</button>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, opacity: 0.65, lineHeight: 1.5 }}>Contract offers are hidden until this driver unlocks the inbox with their private driver code.</div>
                {contractError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{contractError}</div>}
              </div>
            ) : contractLoading ? (
              <div style={{ opacity: 0.7 }}>Loading contract offers...</div>
            ) : contractOffers.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No contract offers currently available for #{driver.number} {driver.name}.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {contractOffers.map((offer) => (
                  <div key={offer.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 900 }}>{offer.team}</div>
                        <div style={{ fontSize: 12, opacity: 0.65 }}>{offer.brand_style || "Balanced"}</div>
                      </div>
                      <div style={{ background: offer.status === "Accepted" ? "#14532d" : offer.status === "Declined" ? "#7f1d1d" : offer.status === "Withdrawn" ? "#3f3f46" : "#1e3a8a", padding: "4px 12px", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>{offer.status}</div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 14 }}>
                      {[
                        ["SALARY", money(offer.salary)],
                        ["SIGNING BONUS", money(offer.signing_bonus)],
                        ["CONTRACT LENGTH", `${offer.contract_length || 1} season(s)`],
                        ["BUYOUT", money(offer.buyout_amount)],
                        ["WIN BONUS", money(offer.win_bonus)],
                        ["CHAMPIONSHIP BONUS", money(offer.championship_bonus)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <div style={{ opacity: 0.6, fontSize: 11 }}>{label}</div>
                          <div style={{ fontWeight: 900, color: label === "SALARY" ? teamTheme.accent : "white" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                      {offer.no_trade_clause && <span style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>No-trade clause</span>}
                      {offer.team_option && <span style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>Team option</span>}
                      {offer.mutual_option && <span style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>Mutual option</span>}
                      {offer.guaranteed_seat && <span style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 999, padding: "5px 10px", fontSize: 12 }}>Guaranteed seat</span>}
                    </div>

                    {offer.media_requirements && <div style={{ marginBottom: 14, background: "#171b22", borderRadius: 10, padding: 12, lineHeight: 1.6, fontSize: 13 }}><div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6, fontWeight: 800 }}>MEDIA / BRAND REQUIREMENTS</div>{offer.media_requirements}</div>}
                    {offer.notes && <div style={{ marginBottom: 14, background: "#11161d", borderRadius: 10, padding: 12, lineHeight: 1.6, fontSize: 13 }}><div style={{ fontSize: 11, opacity: 0.65, marginBottom: 6, fontWeight: 800 }}>OWNER NOTES</div>{offer.notes}</div>}
                    {offer.expires_at && <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 14 }}>Expires: {new Date(offer.expires_at).toLocaleDateString()}</div>}

                    {offer.status === "Pending" && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button onClick={() => acceptContractOffer(offer)} style={{ ...primaryButtonStyle, background: "#22c55e" }}>Accept Offer</button>
                        <button onClick={() => declineContractOffer(offer)} style={dangerButtonStyle}>Decline Offer</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isDriverAuthorized && (
              <form onSubmit={submitRenegotiationRequest} style={{ background: "#0f1319", border: `1px solid ${teamTheme.accent}`, borderRadius: 14, padding: 18, marginTop: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0 }}>🤝 Request Contract Renegotiation</h3>
                    <div style={{ fontSize: 13, opacity: 0.66, marginTop: 5 }}>Send a driver-side request to Team HQ. Ownership can review the request in the contracts list.</div>
                  </div>
                  {activeContract && <div style={{ fontSize: 12, fontWeight: 900, color: "#4ade80" }}>Active deal loaded</div>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>REQUESTED SALARY</div>
                    <input type="number" min="250000" value={renegotiationForm.requested_salary} onChange={(event) => updateRenegotiationField("requested_salary", event.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>SIGNING BONUS</div>
                    <input type="number" min="0" value={renegotiationForm.requested_signing_bonus} onChange={(event) => updateRenegotiationField("requested_signing_bonus", event.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>LENGTH</div>
                    <input type="number" min="1" value={renegotiationForm.requested_contract_length} onChange={(event) => updateRenegotiationField("requested_contract_length", event.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>BUYOUT</div>
                    <input type="number" min="0" value={renegotiationForm.requested_buyout_amount} onChange={(event) => updateRenegotiationField("requested_buyout_amount", event.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>WIN BONUS</div>
                    <input type="number" min="0" value={renegotiationForm.requested_win_bonus} onChange={(event) => updateRenegotiationField("requested_win_bonus", event.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>CHAMPIONSHIP BONUS</div>
                    <input type="number" min="0" value={renegotiationForm.requested_championship_bonus} onChange={(event) => updateRenegotiationField("requested_championship_bonus", event.target.value)} style={inputStyle} />
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, opacity: 0.7, marginBottom: 7 }}>MESSAGE TO OWNER</div>
                  <textarea
                    value={renegotiationForm.message}
                    onChange={(event) => updateRenegotiationField("message", event.target.value)}
                    placeholder="Explain why you want to renegotiate..."
                    rows={4}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                {renegotiationMessage && <div style={{ marginTop: 12, color: "#4ade80", fontWeight: 900 }}>{renegotiationMessage}</div>}
                {renegotiationError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 900 }}>{renegotiationError}</div>}

                <button type="submit" disabled={renegotiationSubmitting} style={{ ...themedPrimaryButtonStyle, marginTop: 14, opacity: renegotiationSubmitting ? 0.65 : 1 }}>
                  {renegotiationSubmitting ? "Sending Request..." : "Send Renegotiation Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "interviews") {
    const activeInterviews = isArcaDriver ? arcaInterviews : interviews;
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Interview Center</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{activeInterviews.length} interview{activeInterviews.length !== 1 ? "s" : ""} assigned</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>🎙️ Interview Center</h2>
            <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>Answer assigned league interviews here. Your responses go to league admin.</div>
            {arcaInterviewsLoading && isArcaDriver ? (
              <div style={{ opacity: 0.7 }}>Loading interviews...</div>
            ) : activeInterviews.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No interviews assigned right now.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {activeInterviews.map((interview) => (
                  <InterviewAnswerCard
                    key={interview.id}
                    interview={interview}
                    accent={teamTheme.accent}
                    onAnswered={(updated) => {
                      if (isArcaDriver) {
                        setArcaInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                      } else {
                        setInterviews((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (subPage === "upload") {
    return (
      <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, rgba(245,245,247,0.95) 34%, rgba(229,229,234,0.98) 100%)` }}>
        <div style={pageContainerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
            <button onClick={() => window.location.pathname = `/driver/${driverNumber}`} style={secondaryButtonStyle}>← Back to Profile</button>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>#{driver.number} {driver.name} — Upload Center</div>
              <div style={{ fontSize: 13, opacity: 0.6, marginTop: 2 }}>{carUploads.length} upload{carUploads.length !== 1 ? "s" : ""} submitted</div>
            </div>
          </div>

          <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
            <h2 style={{ marginTop: 0, marginBottom: 4 }}>🚗 Upload Center</h2>
            <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>Upload your car photo or video for each race week. Files appear in the admin gallery.</div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
              <div style={{ flex: "1 1 200px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race Week</div>
                <select style={inputStyle} value={selectedRaceForUpload} onChange={(e) => setSelectedRaceForUpload(e.target.value)}>
                  <option value="">Select a race...</option>
                  {(isCupDriverProfile ? tracks : arcaTracks || []).map((t) => <option key={t.name || t.raceName || t} value={t.name || t.raceName || t}>{t.name || t.raceName || t}</option>)}
                </select>
              </div>
              <div>
                <input ref={carFileInputRef} type="file" accept="image/*,video/mp4,video/quicktime" style={{ display: "none" }} onChange={handleCarUpload} />
                <button onClick={() => carFileInputRef.current?.click()} style={{ ...themedPrimaryButtonStyle, opacity: carUploading ? 0.6 : 1 }} disabled={carUploading}>{carUploading ? "⏳ Uploading..." : "📷 Upload Photo / Video"}</button>
              </div>
            </div>

            {carUploads.length === 0 ? (
              <div style={{ fontSize: 13, opacity: 0.5, fontStyle: "italic" }}>No uploads yet.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                {carUploads.map((upload) => {
                  const url = upload.image_url || upload.file_url || "";
                  const fileType = upload.file_type || "";
                  const isImage = fileType.startsWith("image/") || (!fileType && url.match(/\.(jpg|jpeg|png|gif|webp)$/i));
                  const isVideo = fileType.startsWith("video/") || (!fileType && url.match(/\.(mp4|mov|avi|webm)$/i));
                  const raceName = upload.race_week || upload.race_id || "—";

                  return (
                    <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27" }}>
                        {isImage ? <img src={url} alt="Car" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : isVideo ? <video controls style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}><source src={url} type={fileType || "video/mp4"} /></video> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>📄</div>}
                      </div>
                      <div style={{ padding: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{raceName}</div>
                        <div style={{ fontSize: 11, opacity: 0.55, marginBottom: 8 }}>{upload.uploaded_at ? new Date(upload.uploaded_at).toLocaleDateString() : ""}</div>
                        <button onClick={() => handleCarDelete(upload.id, upload.file_path || upload.cloudinary_id)} style={{ ...dangerButtonStyle, width: "100%", padding: "6px 10px", fontSize: 12 }}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: `${teamTheme.accent}18`, pointerEvents: "none" }} />

          <div style={{ position: "relative", display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 18 }}>
            <button
              type="button"
              aria-label="Go to standings home page"
              onClick={() => window.location.pathname = standingsRoute}
              title="Home"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(17,24,39,0.10)",
                background: "linear-gradient(180deg, #ffd60a 0%, #ff9f0a 100%)",
                boxShadow: "0 16px 38px rgba(255,159,10,0.30)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 19,
              }}
            >
              🏠
            </button>

            <button
              type="button"
              aria-label="Open messages"
              onClick={() => openProtectedDriverSection(`/driver/${driverNumber}/messages`)}
              title="Messages"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: "1px solid rgba(17,24,39,0.10)",
                background: "linear-gradient(180deg, #007aff 0%, #5856d6 100%)",
                color: "#ffffff",
                boxShadow: "0 16px 38px rgba(0,122,255,0.26)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                fontSize: 19,
              }}
            >
              💬
              {unreadMessages > 0 && (
                <span style={{ position: "absolute", top: -6, right: -6, background: "#ff3b30", color: "white", borderRadius: 99, minWidth: 18, height: 18, padding: "0 4px", fontSize: 10.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{unreadMessages}</span>
              )}
            </button>

            <div style={{ position: "relative" }}>
              <button
                ref={driverMenuButtonRef}
                type="button"
                aria-label="Open menu"
                onClick={toggleDriverMenu}
                title="Menu"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: "1px solid rgba(17,24,39,0.10)",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0 10px 28px rgba(15,23,42,0.12)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 5,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <span style={{ width: 20, height: 2, borderRadius: 999, background: "#111827" }} />
                <span style={{ width: 20, height: 2, borderRadius: 999, background: "#111827" }} />
                <span style={{ width: 20, height: 2, borderRadius: 999, background: "#111827" }} />
                {myAppeals.length > 0 && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: myAppeals.some((a) => a.status !== "Open") ? "#34c759" : "#007aff", color: "white", borderRadius: 99, minWidth: 18, height: 18, padding: "0 4px", fontSize: 10.5, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>{myAppeals.length}</span>
                )}
              </button>

              {showDriverMenu && driverMenuPosition && createPortal(
                <div
                  style={{
                    position: "fixed",
                    top: driverMenuPosition.top,
                    right: driverMenuPosition.right,
                    width: 280,
                    maxWidth: "calc(100vw - 40px)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,250,252,0.95))",
                    border: "1px solid rgba(255,255,255,0.8)",
                    borderRadius: 22,
                    boxShadow: "0 30px 80px rgba(0,0,0,0.20)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    zIndex: 99999,
                    overflow: "hidden",
                    padding: 8,
                  }}
                >
                  {[
                    { icon: "📄", label: "Contracts", href: `/driver/${driverNumber}/contracts` },
                    ...(isArcaDriver ? [] : [{ icon: "🏎️", label: "Developmental Ride", href: `/driver/${driverNumber}/development` }]),
                    { icon: "📷", label: "Uploads", href: `/driver/${driverNumber}/upload` },
                    { icon: "🎙️", label: "Interviews", href: `/driver/${driverNumber}/interviews` },
                    { icon: "📋", label: "Appeals", href: `/driver/${driverNumber}/appeals`, badge: myAppeals.length > 0 ? myAppeals.length : null, badgeColor: myAppeals.some((a) => a.status !== "Open") ? "#34c759" : "#007aff" },
                    { icon: "🎯", label: "Assignments", href: `/driver/${driverNumber}/assignments` },
                    { icon: "😊", label: "Driver Feedback", href: `/driver/${driverNumber}/feedback` },
                    { icon: "🤝", label: "Team Interest", href: `/driver/${driverNumber}/team-interest` },
                    { icon: "🏁", label: "Start & Park", href: `/driver/${driverNumber}/start-park` },
                    { icon: "🔄", label: "Transfer Portal", href: `/driver/${driverNumber}/portal` },
                    { icon: "🎨", label: "Paint Scheme Vote", href: "/paint-scheme-vote" },
                    { icon: "🏆", label: "In-Season Bracket", href: "/bracket" },
                    { icon: "🗳️", label: "League Vote", href: "/vote" },
                    { icon: "✍️", label: "Add Story", href: "/submit-story" },
                    { icon: "⚙️", label: "Settings", href: `/driver/${driverNumber}/settings` },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        if (item.action) {
                          item.action();
                        } else {
                          setShowDriverMenu(false);
                          openProtectedDriverSection(item.href);
                        }
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textAlign: "left",
                        background: "transparent",
                        color: "#1d1d1f",
                        border: "none",
                        borderRadius: 14,
                        padding: "11px 12px",
                        cursor: "pointer",
                        fontFamily: appleFont,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      <span style={{ fontSize: 18, width: 22, textAlign: "center" }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.badge && (
                        <span style={{ background: item.badgeColor, color: "white", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{item.badge}</span>
                      )}
                    </button>
                  ))}
                </div>,
                document.body
              )}
            </div>

            <div style={{ position: "relative" }}>
              <button
                ref={driverTodoButtonRef}
                type="button"
                onClick={toggleDriverTodo}
                title="To-Do"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: `1px solid ${driverTodoCount > 0 ? teamTheme.accent : "rgba(17,24,39,0.10)"}`,
                  background: driverTodoCount > 0 ? `${teamTheme.accent}14` : "rgba(255,255,255,0.92)",
                  boxShadow: driverTodoCount > 0 ? `0 10px 26px ${teamTheme.glow}` : "0 10px 28px rgba(15,23,42,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  fontSize: 19,
                  cursor: "pointer",
                }}
              >
                🔔
                {driverTodoCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      minWidth: 18,
                      height: 18,
                      padding: "0 4px",
                      borderRadius: 999,
                      background: "#ff3b30",
                      color: "white",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10.5,
                      fontWeight: 900,
                      border: "2px solid #fff",
                    }}
                  >
                    {driverTodoCount}
                  </span>
                )}
              </button>

              {showDriverTodo && driverTodoPosition && createPortal(
                <div
                  style={{
                    position: "fixed",
                    top: driverTodoPosition.top,
                    right: driverTodoPosition.right,
                    width: 360,
                    maxWidth: "calc(100vw - 40px)",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.97), rgba(248,250,252,0.95))",
                    border: "1px solid rgba(255,255,255,0.8)",
                    borderRadius: 22,
                    boxShadow: "0 30px 80px rgba(0,0,0,0.20)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    zIndex: 99999,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: 16, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize: 15, fontWeight: 1000, color: "#1d1d1f" }}>🔔 Driver To-Do Center</div>
                    <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 700, marginTop: 3 }}>
                      Interviews, assignments, messages, contracts, and request updates.
                    </div>
                  </div>

                  {driverTodoItems.length === 0 ? (
                    <div style={{ padding: 24, fontSize: 14, color: "#6e6e73", fontWeight: 700, textAlign: "center" }}>
                      ✅ Nothing due right now.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 380, overflowY: "auto" }}>
                      {driverTodoItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setShowDriverTodo(false);
                            openProtectedDriverSection(item.href);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            gap: 12,
                            textAlign: "left",
                            background: "transparent",
                            color: "#1d1d1f",
                            border: "none",
                            borderBottom: "1px solid rgba(0,0,0,0.05)",
                            padding: 14,
                            cursor: "pointer",
                            fontFamily: appleFont,
                          }}
                        >
                          <span style={{ fontSize: 22, lineHeight: 1 }}>{item.icon}</span>
                          <span>
                            <span style={{ display: "block", fontSize: 13, fontWeight: 900 }}>{item.title}</span>
                            <span style={{ display: "block", fontSize: 12, color: "#6e6e73", fontWeight: 700, marginTop: 3, lineHeight: 1.35 }}>{item.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>
          </div>

          <div style={{ position: "relative", display: "flex", gap: 22, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div style={{
              width: 84,
              height: 84,
              borderRadius: 24,
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${teamTheme.accent}33`,
              boxShadow: `0 16px 34px ${teamTheme.glow}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              padding: 10,
            }}>
              {teamLogos[driver.team] ? <img src={teamLogos[driver.team]} alt={driver.team} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <div style={{ fontWeight: 900, fontSize: 13, color: teamTheme.accent, textAlign: "center" }}>{getTeamFullName(driver.team)}</div>}
            </div>

            <div style={{ flex: "1 1 260px", minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 1000, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(29,29,31,0.5)" }}>
                #{driver.number} • {getTeamFullName(driver.team)}
              </div>
              <div style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 950, letterSpacing: "-0.03em", lineHeight: 1.05, marginTop: 2 }}>{driver.name}</div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                <span style={{ display: "inline-flex", padding: "7px 14px", borderRadius: 999, background: `${teamTheme.accent}18`, color: teamTheme.accent, fontSize: 12.5, fontWeight: 1000 }}>
                  {reputation.archetype}
                </span>
                {unreadMessages > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: "rgba(255,59,48,0.12)", color: "#c62d24", fontSize: 12.5, fontWeight: 1000 }}>
                    🔔 {unreadMessages} New Message{unreadMessages !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(255,255,255,0.9)",
              border: "1px solid rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}>
              {driver.manufacturerLogo ? <img src={driver.manufacturerLogo} alt={driver.manufacturer} style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} /> : <div style={{ fontWeight: 900, fontSize: 10, color: "#6e6e73", textAlign: "center" }}>{driver.manufacturer || "—"}</div>}
            </div>

            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 1000, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(29,29,31,0.5)" }}>{selectedSeason.name}</div>
              <div style={{ fontSize: 26, fontWeight: 950, letterSpacing: "-0.02em", marginTop: 2 }}>P{driverRanking}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: teamTheme.accent }}>{calculatedStats.points} PTS</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, marginTop: 18, alignItems: "center" }}>
          {authorizedDriverNumber && String(authorizedDriverNumber) !== String(driver.number) && (
            <button onClick={startMessageFromProfile} style={themedPrimaryButtonStyle}>✉️ Message Driver</button>
          )}
        </div>


        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          {[
            { label: "POINTS", value: calculatedStats.points },
            { label: "WINS", value: calculatedStats.wins },
            { label: "TOP 3", value: calculatedStats.top3 },
            { label: "TOP 5", value: calculatedStats.top5 },
            { label: "DNFs", value: calculatedStats.dnfs },
            { label: "PENALTIES", value: calculatedStats.totalPenalties ? `-${calculatedStats.totalPenalties}` : "0" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...statBoxStyle, border: stat.label === "POINTS" ? `1px solid ${teamTheme.accent}44` : statBoxStyle.border, boxShadow: stat.label === "POINTS" ? `0 14px 30px ${teamTheme.glow}` : statBoxStyle.boxShadow }}>
              <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 6, letterSpacing: "0.04em" }}>{stat.label}</div>
              <div style={{ fontSize: 26, fontWeight: 950, color: stat.label === "POINTS" ? teamTheme.accent : "#1d1d1f" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🎨</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Paint Scheme Profile</h2>
                <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>Votes and payouts logged from Paint Scheme of the Week awards.</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 26, fontWeight: 950, color: teamTheme.accent }}>{money(paintSchemeStats.driverEarnings)}</div>
              <div style={{ fontSize: 12, color: "#6e6e73", fontWeight: 700 }}>Driver paint earnings</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 12 }}>
            {[
              ["Season Votes", paintSchemeStats.seasonVotes],
              ["Career Votes", paintSchemeStats.votesReceived],
              ["Wins", paintSchemeStats.wins],
              ["Top 5s", paintSchemeStats.top5s],
              ["Top 10s", paintSchemeStats.top10s],
              ["Team Earned", money(paintSchemeStats.teamEarnings)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 19, fontWeight: 950, color: "#1d1d1f" }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: "#6e6e73", fontWeight: 700 }}>Last payout race: {paintSchemeStats.lastAwardedRace}</div>
        </div>

        <div style={{ ...sectionCardStyle, background: `linear-gradient(135deg, rgba(255,255,255,0.92), ${driverSatisfaction.bg})` }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: `${driverSatisfaction.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>😊</div>
              <div>
                <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Driver Satisfaction</h2>
                <div style={{ fontSize: 12.5, color: "#6e6e73", fontWeight: 700, marginTop: 2 }}>Performance, clean races, assignments, interviews, and contract stability all feed this score.</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 30, fontWeight: 950, color: driverSatisfaction.color }}>{driverSatisfaction.score}/100</div>
              <div style={{ fontSize: 13, fontWeight: 900, color: driverSatisfaction.color }}>{driverSatisfaction.status}</div>
            </div>
          </div>

          <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: 999, height: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ width: `${driverSatisfaction.score}%`, height: "100%", background: driverSatisfaction.color, transition: "width 0.3s" }} />
          </div>

          <div style={{ fontSize: 14, lineHeight: 1.6, color: "#3a3a3c", fontWeight: 600, marginBottom: 14 }}>{driverSatisfaction.summary}</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {driverSatisfaction.factors.map((factor) => (
              <span key={factor} style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 999, padding: "7px 12px", fontSize: 12, fontWeight: 800, color: "#1d1d1f" }}>{factor}</span>
            ))}
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🔥</div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Driver Reputation</h2>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4, letterSpacing: "0.04em" }}>DRIVER ARCHETYPE</div>
            <div style={{ fontSize: 22, fontWeight: 950, color: teamTheme.accent }}>{reputation.archetype}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[
              ["Aggression", reputation.aggression],
              ["Consistency", reputation.consistency],
              ["Racecraft", reputation.racecraft],
              ["Momentum", reputation.momentum],
              ["Popularity", reputation.popularity],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 22, fontWeight: 950, color: "#1d1d1f" }}>{value}</div>
                <div style={{ background: "rgba(0,0,0,0.06)", borderRadius: 999, height: 7, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ width: `${value}%`, height: "100%", background: teamTheme.accent }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {unlockedAchievements.length > 0 && (
          <div style={sectionCardStyle}>
            <h3 style={{ marginTop: 0, marginBottom: 14, fontSize: 17, fontWeight: 950 }}>Achievements</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {unlockedAchievements.map((a) => (
                <div key={a.name} style={{ background: `${teamTheme.accent}0f`, border: `1px solid ${teamTheme.accent}33`, borderRadius: 16, padding: 14, textAlign: "center", minWidth: 92 }}>
                  <div style={{ fontSize: 28, marginBottom: 4 }}>{a.badge}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#1d1d1f" }}>{a.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {driver.notes && (
          <div style={{ ...sectionCardStyle, borderLeft: `4px solid ${teamTheme.accent}` }}>
            <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, fontWeight: 950 }}>Admin Notes</h3>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "#3a3a3c", fontWeight: 600 }}>{driver.notes}</div>
          </div>
        )}

          <div style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>📈</div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Season Overview</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4, letterSpacing: "0.04em" }}>RANKING</div>
              <div style={{ fontSize: 26, fontWeight: 950, color: teamTheme.accent }}>P{driverRanking}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4, letterSpacing: "0.04em" }}>PROJECTION</div>
              <div style={{ fontSize: 21, fontWeight: 950, color: "#1d1d1f" }}>{pointsProjection} pts</div>
              <div style={{ fontSize: 10.5, color: "#86868b", fontWeight: 700, marginTop: 2 }}>Full season estimate</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
              <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4, letterSpacing: "0.04em" }}>AVG FINISH</div>
              <div style={{ fontSize: 21, fontWeight: 950, color: "#1d1d1f" }}>P{consistencyRating.avg}</div>
              <div style={{ fontSize: 10.5, color: "#86868b", fontWeight: 700, marginTop: 2 }}>Consistency</div>
            </div>
          </div>
          {pointsGap.ahead > 0 && (
            <div style={{ background: "rgba(0,122,255,0.08)", border: "1px solid rgba(0,122,255,0.22)", borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <div style={{ fontSize: 13.5, color: "#0057d9", fontWeight: 700 }}><strong style={{ fontWeight: 950 }}>{pointsGap.ahead} points</strong> behind P{driverRanking - 1}</div>
            </div>
          )}
          {pointsGap.behind > 0 && (
            <div style={{ background: "rgba(52,199,89,0.08)", border: "1px solid rgba(52,199,89,0.22)", borderRadius: 16, padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>📊</span>
              <div style={{ fontSize: 13.5, color: "#147d35", fontWeight: 700 }}><strong style={{ fontWeight: 950 }}>{pointsGap.behind} point lead</strong> over P{driverRanking + 1}</div>
            </div>
          )}
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🏁</div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Championship Points Picture</h2>
          </div>
          <div style={{ background: championshipPicture.bg, border: `1px solid ${championshipPicture.color}33`, borderRadius: 18, padding: 18 }}>
            <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 6, letterSpacing: "0.04em" }}>CURRENT STATUS</div>
            <div style={{ fontSize: 22, fontWeight: 950, color: championshipPicture.color }}>{championshipPicture.status}</div>
            <div style={{ fontSize: 13.5, color: "#3a3a3c", fontWeight: 600, marginTop: 8 }}>Current standings position: P{championshipPicture.rank}</div>
            <div style={{ fontSize: 13.5, color: "#3a3a3c", fontWeight: 600, marginTop: 4 }}>{championshipPicture.rank === 1 ? "This driver currently controls the top spot in the championship standings." : `${championshipPicture.pointsBehindLeader} points behind the current points leader.`}</div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${teamTheme.accent}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>🏆</div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 950 }}>Personal Records</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              ["BEST FINISH", personalRecords.bestFinish],
              ["FASTEST LAPS", personalRecords.fastestLaps],
              ["BEST RACE", personalRecords.highestRacePoints],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 16, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4, letterSpacing: "0.04em" }}>{label}</div>
                <div style={{ fontSize: 26, fontWeight: 950, color: teamTheme.accent }}>{value}</div>
                {label === "BEST RACE" && <div style={{ fontSize: 10.5, color: "#86868b", fontWeight: 700, marginTop: 2 }}>points</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Current Streaks</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            <div style={{ background: streaks.currentWins > 0 ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.03)", border: `1px solid ${streaks.currentWins > 0 ? "rgba(52,199,89,0.35)" : "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: 14 }}><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4 }}>WIN STREAK 🏆</div><div style={{ fontSize: 26, fontWeight: 950, color: "#1d1d1f" }}>{streaks.currentWins}</div><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 700 }}>Best: {streaks.longestWins}</div></div>
            <div style={{ background: streaks.currentPodiums > 0 ? "rgba(52,199,89,0.10)" : "rgba(0,0,0,0.03)", border: `1px solid ${streaks.currentPodiums > 0 ? "rgba(52,199,89,0.35)" : "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: 14 }}><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4 }}>PODIUM STREAK 🎯</div><div style={{ fontSize: 26, fontWeight: 950, color: "#1d1d1f" }}>{streaks.currentPodiums}</div><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 700 }}>Best: {streaks.longestPodiums}</div></div>
            <div style={{ background: streaks.currentDnfs > 0 ? "rgba(255,59,48,0.08)" : "rgba(0,0,0,0.03)", border: `1px solid ${streaks.currentDnfs > 0 ? "rgba(255,59,48,0.30)" : "rgba(0,0,0,0.08)"}`, borderRadius: 16, padding: 14 }}><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 900, marginBottom: 4 }}>DNF STREAK 💥</div><div style={{ fontSize: 26, fontWeight: 950, color: "#1d1d1f" }}>{streaks.currentDnfs}</div><div style={{ fontSize: 11, color: "#6e6e73", fontWeight: 700 }}>Worst: {streaks.longestDnfs}</div></div>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Career Stats All Seasons</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              ["CAREER WINS", careerStats.wins],
              ["CAREER POINTS", careerStats.points],
              ["PODIUMS", careerStats.podiums],
              ["RACES", careerStats.races],
            ].map(([label, value]) => (
              <div key={label} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Consistency Analysis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>AVERAGE FINISH</div><div style={{ fontSize: 24, fontWeight: 800 }}>P{consistencyRating.avg}</div></div>
            <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>BEST - WORST</div><div style={{ fontSize: 18, fontWeight: 800 }}>P{consistencyRating.best} - P{consistencyRating.worst}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Range</div></div>
          </div>
        </div>

        {trackStats.best && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Track Performance</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              <div style={{ background: "rgba(52,199,89,0.10)", border: "1px solid rgba(52,199,89,0.30)", borderRadius: 16, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 900, marginBottom: 4, color: "#147d35" }}>BEST TRACK 🏁</div><div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#1d1d1f" }}>{trackStats.best[0]}</div><div style={{ fontSize: 12, color: "#3a3a3c", fontWeight: 600 }}>{trackStats.best[1].points} pts in {trackStats.best[1].races} races</div></div>
              <div style={{ background: "rgba(255,59,48,0.08)", border: "1px solid rgba(255,59,48,0.28)", borderRadius: 16, padding: 14 }}><div style={{ fontSize: 11, fontWeight: 900, marginBottom: 4, color: "#c62d24" }}>WORST TRACK 🚩</div><div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4, color: "#1d1d1f" }}>{trackStats.worst[0]}</div><div style={{ fontSize: 12, color: "#3a3a3c", fontWeight: 600 }}>{trackStats.worst[1].points} pts in {trackStats.worst[1].races} races</div></div>
            </div>
          </div>
        )}

        {teamStats && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Teammate Comparison</h2>
            <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>{getTeamFullName(driver.team)}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ background: "rgba(0,0,0,0.03)", border: `1px solid ${teamTheme.accent}`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{driver.name}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Points: {driver.points}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Wins: {calculatedStats.wins}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {calculatedStats.top3}</div></div>
              <div style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>#{teamStats.number} {teamStats.name}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Points: {teamStats.points}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Wins: {teamStats.wins}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {teamStats.top3}</div></div>
            </div>
          </div>
        )}

        {achievementProgress.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Achievement Progress</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {achievementProgress.map((a) => {
                const progress = Math.min(100, Math.round((Number(a.current || 0) / a.target) * 100));
                return (
                  <div key={a.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{a.emoji} {a.name}</span><span style={{ fontSize: 12, opacity: 0.7 }}>{a.current}/{a.target}</span></div>
                    <div style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ background: teamTheme.accent, height: "100%", width: `${progress}%`, transition: "width 0.3s" }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {recentForm.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Recent Form Last 5 Races</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>
              {recentForm.map((r, i) => (
                <div key={`${r.race}-${i}`} style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #2c3440", borderRadius: 8, padding: 10, textAlign: "center" }}>
                  <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{String(r.race || "Race").split("(")[0].trim().substring(0, 8)}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2, color: teamTheme.accent }}>{r.points}</div>
                  <div style={{ fontSize: 10, opacity: 0.6 }}>P{r.finish || "—"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>🎬 Replay Theater / Media Hub</h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14 }}>Driver highlights, uploaded car media, interviews, and race-week content will live here.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}`}>Driver Home</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}/appeals`}>Appeals</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}/assignments`}>Assignments</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}/messages`}>Messages</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = "/streams"}>Race Broadcasts</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = standingsRoute}>League Standings</button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>League Participation</h2>
          <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14 }}>Vote on paint schemes, track the in-season tournament, weigh in on league ballots, and submit your own stories.</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = "/paint-scheme-vote"}>🎨 Paint Scheme Vote</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = "/bracket"}>🏆 In-Season Bracket</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = "/vote"}>🗳️ League Vote</button>
            <button style={secondaryButtonStyle} onClick={() => window.location.pathname = "/submit-story"}>✍️ Add Story</button>
          </div>
        </div>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 16 }}>Race-by-Race Breakdown</h2>
          {raceBreakdown.length === 0 ? (
            <div style={{ opacity: 0.75 }}>No races entered yet.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr><th style={thStyle}>Race</th><th style={thStyle}>Finish</th><th style={thStyle}>Race Pts</th><th style={thStyle}>Stage 1</th><th style={thStyle}>Stage 2</th><th style={thStyle}>FL</th><th style={thStyle}>DNF</th><th style={thStyle}>Offense</th><th style={thStyle}>Penalty</th><th style={thStyle}>Total</th></tr>
                </thead>
                <tbody>
                  {raceBreakdown.map((race) => (
                    <tr key={race.raceName}>
                      <td style={tdStyle}>{race.raceName}</td>
                      <td style={tdStyle}>{race.finishPos ?? "—"}</td>
                      <td style={tdStyle}>{race.finishPoints || 0}</td>
                      <td style={tdStyle}>{race.stage1Points || 0}</td>
                      <td style={tdStyle}>{race.stage2Points || 0}</td>
                      <td style={tdStyle}>{race.fastestLap ? "+1" : "—"}</td>
                      <td style={tdStyle}>{race.dnf ? "DNF" : "—"}</td>
                      <td style={tdStyle}>{race.offense ? `#${race.offenseNumber}` : "—"}</td>
                      <td style={{ ...tdStyle, color: (race.penaltyPoints || 0) > 0 ? "#f87171" : "inherit" }}>{(race.penaltyPoints || 0) > 0 ? `-${race.penaltyPoints}` : "—"}</td>
                      <td style={{ ...tdStyle, fontWeight: 800, color: teamTheme.accent }}>{race.totalRacePoints || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {offenseLog.length > 0 && (
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>Offense History</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Offense #</th><th style={thStyle}>Penalty Points</th></tr></thead>
                <tbody>
                  {offenseLog.map((entry, idx) => (
                    <tr key={`${entry.raceName}-${idx}`}>
                      <td style={tdStyle}>{entry.raceName}</td>
                      <td style={tdStyle}>#{entry.offenseNumber}</td>
                      <td style={{ ...tdStyle, color: "#f87171", fontWeight: 700 }}>-{entry.penaltyPoints} pts</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} selectedSeason={selectedSeason} driverNumber={driverNumber} arcaDrivers={arcaDrivers} allDrivers={sanitizedDrivers} tracks={tracks} arcaTracks={arcaTracks} />
    </div>
  );
}
