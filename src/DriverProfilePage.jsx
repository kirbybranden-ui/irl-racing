import React, { useState, useMemo, useEffect, useRef } from "react";
import logo from "./assets/logo1.png";
import teamLogoJAM from "./assets/teams/JAM.png";
import teamLogoMER from "./assets/teams/ME.png";
import teamLogoMMS from "./assets/teams/MMS.png";
import teamLogoNLM from "./assets/teams/NLM.png";
import teamLogoBOM from "./assets/teams/BOM.png";
import teamLogoWSM from "./assets/teams/WSM.png";
import teamLogoIND from "./assets/teams/IND.png";
import teamLogo19XI from "./assets/teams/19XI.png";
import teamLogoBWR from "./assets/teams/BWR.png";
import { supabase } from "./lib/supabase";
import { uploadCarFile, getCarUploads, deleteCarUpload } from "./lib/carUploads";

// Team logos
const teamLogos = {
  "JA MOTORSPORTS": teamLogoJAM,
  JAM: teamLogoJAM,
  "ME RACING": teamLogoMER,
  MER: teamLogoMER,
  MMS: teamLogoMMS,
  NLM: teamLogoNLM,
  BOM: teamLogoBOM,
  WSM: teamLogoWSM,
  IND: teamLogoIND,
  Independent: teamLogoIND,
  "19XI": teamLogo19XI,
  "19XI Racing": teamLogo19XI,
  "Big Wheel Racing": teamLogoBWR,
  BWR: teamLogoBWR,
};

// Team Full Names
const teamFullNames = {
  JAM: "JA Motorsports",
  "JA MOTORSPORTS": "JA Motorsports",
  MER: "ME Racing",
  KRM: "Kevin Racing Motorsports",
  MMS: "Mayhem Motorsports",
  NLM: "Nine Line Motorsports",
  BOM: "Blue Oval Motorsports",
  WSM: "Wyatt SICK6 Motorsports",
  IND: "Independent",
  Independent: "Independent",
  "19XI": "19XI Racing",
  "19XI Racing": "19XI Racing",
  BWR: "Big Wheel Racing",
  "Big Wheel Racing": "Big Wheel Racing",
};

// Team Profile Themes
const teamThemes = {
  JAM: { accent: "#d4af37", glow: "rgba(212,175,55,0.28)", dark: "#2a230f", label: "JA Motorsports" },
  "JA MOTORSPORTS": { accent: "#d4af37", glow: "rgba(212,175,55,0.28)", dark: "#2a230f", label: "JA Motorsports" },
  MER: { accent: "#ef4444", glow: "rgba(239,68,68,0.28)", dark: "#2a1111", label: "ME Racing" },
  MMS: { accent: "#22c55e", glow: "rgba(34,197,94,0.25)", dark: "#102a16", label: "Mayhem Motorsports" },
  NLM: { accent: "#3b82f6", glow: "rgba(59,130,246,0.26)", dark: "#0f1d35", label: "Nine Line Motorsports" },
  BOM: { accent: "#60a5fa", glow: "rgba(96,165,250,0.25)", dark: "#102033", label: "Blue Oval Motorsports" },
  WSM: { accent: "#a855f7", glow: "rgba(168,85,247,0.26)", dark: "#251138", label: "Wyatt SICK6 Motorsports" },
  BWR: { accent: "#f97316", glow: "rgba(249,115,22,0.28)", dark: "#311707", label: "Big Wheel Racing" },
  "Big Wheel Racing": { accent: "#f97316", glow: "rgba(249,115,22,0.28)", dark: "#311707", label: "Big Wheel Racing" },
  "19XI": { accent: "#a855f7", glow: "rgba(168,85,247,0.28)", dark: "#251138", label: "19XI Racing" },
  "19XI Racing": { accent: "#a855f7", glow: "rgba(168,85,247,0.28)", dark: "#251138", label: "19XI Racing" },
  IND: { accent: "#9ca3af", glow: "rgba(156,163,175,0.24)", dark: "#1f2937", label: "Independent" },
  Independent: { accent: "#9ca3af", glow: "rgba(156,163,175,0.24)", dark: "#1f2937", label: "Independent" },
};

function getTeamFullName(teamAbbr) {
  return teamFullNames[teamAbbr] || teamAbbr;
}

function getTeamTheme(teamAbbr) {
  return teamThemes[teamAbbr] || { accent: "#d4af37", glow: "rgba(212,175,55,0.25)", dark: "#2a230f", label: getTeamFullName(teamAbbr) };
}

function money(value) {
  const safe = Number(value) || 0;
  return safe.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
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
  const { data, error } = await supabase
    .from("driver_access_codes")
    .select("driver_number, driver_name, code, active")
    .eq("active", true);

  if (error) {
    console.error("Failed to load driver access codes:", error);
    return loadLocalDriverAccessCodes();
  }

  const nextCodes = {};
  (data || []).forEach((row) => {
    if (row.driver_number && row.code) nextCodes[String(row.driver_number)] = row.code;
    if (row.driver_name && row.code) nextCodes[String(row.driver_name).toLowerCase()] = row.code;
  });

  localStorage.setItem("driverProfileAccessCodes", JSON.stringify(nextCodes));
  return nextCodes;
}

const appShellStyle = { minHeight: "100vh", background: "#0c0f14", color: "white", fontFamily: "Arial, sans-serif" };
const pageContainerStyle = { maxWidth: 1000, margin: "0 auto", padding: 20 };
const sectionCardStyle = { background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.22)" };
const primaryButtonStyle = { background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle = { background: "#2a3140", color: "white", border: "1px solid #3d4859", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const dangerButtonStyle = { background: "#b42318", color: "white", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 700, cursor: "pointer" };
const inputStyle = { width: "100%", background: "#0f1319", color: "white", border: "1px solid #313947", borderRadius: 10, padding: "10px 12px", boxSizing: "border-box" };
const statBoxStyle = { background: "#11161d", border: "1px solid #2a3240", borderRadius: 14, padding: 16, flex: "1 1 160px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const thStyle = { textAlign: "left", padding: 10, borderBottom: "1px solid #313947", background: "#10141b", fontSize: 13, fontWeight: 700 };
const tdStyle = { padding: 10, borderBottom: "1px solid #252c38", verticalAlign: "top", fontSize: 14 };

function InterviewAnswerCard({ interview, onAnswered }) {
  const isPre = interview.type === "pre";
  const qa = Array.isArray(interview.questions_and_answers) ? interview.questions_and_answers : [];
  const [answers, setAnswers] = useState(() => qa.map(q => q.answer || ""));
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(interview.answered || false);

  async function submitAnswers() {
    const filled = answers.every((a, i) => !qa[i].question || a.trim());
    if (!filled) { alert("Please answer all questions before submitting."); return; }
    setSubmitting(true);
    const updated = qa.map((q, i) => ({ question: q.question, answer: answers[i].trim() }));
    const { data, error } = await supabase
      .from("interviews")
      .update({ questions_and_answers: updated, answered: true })
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
    <div style={{ background: "#0f1319", border: `1px solid ${submitted ? (isPre ? "#1e3a6e" : "#1a5c30") : "#3a3200"}`, borderRadius: 12, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <span style={{ background: isPre ? "#3b82f6" : "#22c55e", color: "white", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 800 }}>
          {isPre ? "🎤 PRE-RACE" : "🏆 POST-RACE"}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{interview.race_name}</span>
        {submitted && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: "#14532d", color: "#4ade80", marginLeft: "auto" }}>
            ✅ Submitted
          </span>
        )}
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
                onChange={e => setAnswers(prev => prev.map((a, idx) => idx === i ? e.target.value : a))}
              />
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={submitAnswers}
          disabled={submitting}
          style={{ marginTop: 16, background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer", opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? "Submitting..." : "📨 Submit Answers"}
        </button>
      )}
    </div>
  );
}

function AppealModal({ isOpen, onClose, selectedSeason }) {
  const [requester, setRequester] = useState("");
  const [track, setTrack] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cloudinaryReady, setCloudinaryReady] = useState(false);
  const widgetRef = React.useRef(null);

  const drivers = selectedSeason?.drivers ? [...selectedSeason.drivers].sort((a, b) => a.number - b.number) : [];
  const tracks = ["Bristol (Night)", "Charlotte", "Daytona (Night)", "Homestead", "Indianapolis", "Iowa", "Kansas", "Michigan", "Nashville", "New Hampshire", "North Wilksboro", "Phoenix", "Pocono", "Preseason - Dover", "Preseason - Michigan", "Preseason - EchoPark Speedway", "Richmond", "Talladega", "Texas", "Las Vegas"];

  const handleSubmit = async () => {
    if (!requester.trim() || !track.trim() || !description.trim()) {
      alert("Please fill in all required fields (Requester, Track, Description).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        requester: requester.trim(),
        track: track.trim(),
        description: description.trim(),
        evidence_url: videoUrl || null,
        status: "Open",
        created_at: new Date().toISOString(),
      };
      const { data, error } = await supabase.from("appeals").insert(payload).select();
      if (error) throw error;
      alert("✅ Appeal submitted successfully!");
      setRequester("");
      setTrack("");
      setDescription("");
      setVideoUrl("");
      onClose();
    } catch (err) {
      console.error("Appeal submission error:", err);
      alert(`Failed to submit appeal: ${err?.message || err?.code || "Unknown error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
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

  React.useEffect(() => {
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

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
      <div style={{ background: "#171b22", border: "1px solid #2c3440", borderRadius: 16, padding: 28, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>File an Appeal</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "white", fontSize: 24, cursor: "pointer", padding: 0 }}>×</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Requester (Driver) *</label>
          <select style={inputStyle} value={requester} onChange={(e) => setRequester(e.target.value)}>
            <option value="">-- Select Driver --</option>
            {drivers.map((d) => (
              <option key={d.id} value={`${d.number} - ${d.name}`}>#{d.number} {d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Track *</label>
          <select style={inputStyle} value={track} onChange={(e) => setTrack(e.target.value)}>
            <option value="">-- Select Track --</option>
            {tracks.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Description *</label>
          <textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened and who was involved..." />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 700 }}>Video Evidence (optional)</label>
          <button
            onClick={() => {
              if (!cloudinaryReady || !widgetRef.current) {
                alert("Upload widget is still loading, please wait a moment and try again.");
                return;
              }
              widgetRef.current.open();
            }}
            style={{ ...secondaryButtonStyle, opacity: cloudinaryReady ? 1 : 0.6 }}
          >
            {videoUrl ? "✅ Video uploaded" : cloudinaryReady ? "📹 Upload Video" : "⏳ Loading uploader..."}
          </button>
          {videoUrl && <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7, wordBreak: "break-all" }}>{videoUrl}</div>}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handleSubmit} style={primaryButtonStyle} disabled={submitting}>{submitting ? "Submitting..." : "Submit Appeal"}</button>
          <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function DriverProfilePage({ seasons, activeSeason, tracks = [] }) {
  const pathParts = window.location.pathname.split("/");
  const driverNumber = pathParts[2];
  const subPage = pathParts[3];

  const allSeasons = Array.isArray(seasons) ? seasons : [];
  const selectedSeason = activeSeason && activeSeason.id
    ? allSeasons.find(s => s && s.id === activeSeason.id) || activeSeason
    : allSeasons[0] || null;

  const driver = selectedSeason && selectedSeason.drivers
    ? selectedSeason.drivers.find((d) => d && String(d.number) === String(driverNumber))
    : null;

  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [myAppeals, setMyAppeals] = useState([]);
  const [carUploads, setCarUploads] = useState([]);
  const [carUploading, setCarUploading] = useState(false);
  const [selectedRaceForUpload, setSelectedRaceForUpload] = useState("");
  const carFileInputRef = useRef(null);
  const [interviews, setInterviews] = useState([]);
  const interviewInitRef = useRef(false);
  const [contractOffers, setContractOffers] = useState([]);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState("");
  const [driverAccessCodeInput, setDriverAccessCodeInput] = useState("");
  const [driverAccessCodes, setDriverAccessCodes] = useState(loadLocalDriverAccessCodes);
  const [authorizedDriverNumber, setAuthorizedDriverNumber] = useState(() => localStorage.getItem("driverProfileAuthorizedNumber") || "");

  const driverAccessKey = driver ? String(driver.number) : String(driverNumber);
  const isDriverAuthorized = authorizedDriverNumber === driverAccessKey;

  useEffect(() => {
    async function fetchMyAppeals() {
      const { data, error } = await supabase.from("appeals").select("*").order("created_at", { ascending: false });
      if (error) { console.error("Appeals fetch error:", error); return; }
      if (data) {
        const mine = data.filter(a => {
          if (!a.requester) return false;
          const byNumber = a.requester.startsWith(`${driverNumber} - `);
          const byName = driver?.name && a.requester.toLowerCase().includes(driver.name.toLowerCase());
          return byNumber || byName;
        });
        setMyAppeals(mine);
      }
    }
    fetchMyAppeals();
    const interval = setInterval(fetchMyAppeals, 5000);
    return () => clearInterval(interval);
  }, [driverNumber, driver?.name]);

  useEffect(() => {
    if (!driver?.id) return;
    async function fetchCarUploads() {
      const data = await getCarUploads(driver.id);
      setCarUploads(data);
    }
    fetchCarUploads();
  }, [driver?.id]);

  const handleCarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !driver) return;
    if (!selectedRaceForUpload) { alert("Please select a race week before uploading."); return; }
    const allowed = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/mov","video/quicktime"];
    if (!allowed.includes(file.type)) { alert("Only image or video files are allowed."); return; }
    setCarUploading(true);
    const result = await uploadCarFile(driver.id, driver.name, selectedRaceForUpload, file);
    if (result.success) {
      const updated = await getCarUploads(driver.id);
      setCarUploads(updated);
      alert("✅ Car photo uploaded! It will appear in the admin gallery.");
    } else {
      alert(`Upload failed: ${result.error || "Unknown error"}`);
    }
    setCarUploading(false);
    if (carFileInputRef.current) carFileInputRef.current.value = "";
  };

  const handleCarDelete = async (uploadId, filePath) => {
    if (!window.confirm("Remove this upload?")) return;
    const result = await deleteCarUpload(uploadId, filePath);
    if (result.success) setCarUploads(prev => prev.filter(u => u.id !== uploadId));
    else alert("Failed to delete upload.");
  };

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

  async function unlockDriverContracts() {
    const latestCodes = await loadRemoteDriverAccessCodes();
    setDriverAccessCodes(latestCodes);
    const expectedByNumber = String(latestCodes[driverAccessKey] || driverAccessCodes[driverAccessKey] || "").trim().toUpperCase();
    const expectedByName = String(driver?.name ? (latestCodes[String(driver.name).toLowerCase()] || driverAccessCodes[String(driver.name).toLowerCase()] || "") : "").trim().toUpperCase();
    const expected = expectedByNumber || expectedByName;
    if (!expected) { setContractError("No driver access code has been generated for this driver yet. Contact league admin."); return; }
    if (String(driverAccessCodeInput).trim().toUpperCase() !== expected) { setContractError("Incorrect driver access code."); return; }
    localStorage.setItem("driverProfileAuthorizedNumber", driverAccessKey);
    setAuthorizedDriverNumber(driverAccessKey);
    setDriverAccessCodeInput("");
    setContractError("");
  }

  function lockDriverContracts() {
    localStorage.removeItem("driverProfileAuthorizedNumber");
    setAuthorizedDriverNumber("");
    setDriverAccessCodeInput("");
    setContractOffers([]);
  }

  useEffect(() => {
    if (!driver?.name || !isDriverAuthorized) {
      setContractOffers([]);
      return;
    }
    async function loadContractOffers() {
      setContractLoading(true);
      const { data, error } = await supabase.from("contract_offers").select("*").eq("driver_name", driver.name).order("created_at", { ascending: false });
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

  async function updateOfferStatus(id, status) {
    const { error } = await supabase.from("contract_offers").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) {
      console.error(error);
      alert("Failed to update contract offer. Check contract_offers RLS update policy.");
      return false;
    }
    setContractOffers((prev) => prev.map((offer) => offer.id === id ? { ...offer, status } : offer));
    return true;
  }

  async function acceptContractOffer(offer) {
    if (!window.confirm(`Accept contract from ${offer.team} for ${money(offer.salary)} salary and ${money(offer.signing_bonus)} signing bonus?`)) return;
    const totalCost = Number(offer.salary || 0) + Number(offer.signing_bonus || 0);
    const { data: financeRow, error: financeLoadError } = await supabase.from("team_finances").select("*").eq("team", offer.team).maybeSingle();
    if (financeLoadError) { console.error(financeLoadError); alert("Could not load team finances. Contract was not accepted."); return; }
    if (financeRow && Number(financeRow.balance || 0) < totalCost) { alert("This team does not have enough available balance to fund the accepted contract."); return; }
    const accepted = await updateOfferStatus(offer.id, "Accepted");
    if (!accepted) return;
    if (financeRow) {
      const nextBalance = Number(financeRow.balance || 0) - totalCost;
      const nextPayroll = Number(financeRow.payroll_spent || 0) + Number(offer.salary || 0);
      const nextBonusSpent = Number(financeRow.signing_bonus_spent || 0) + Number(offer.signing_bonus || 0);
      const { error: financeUpdateError } = await supabase.from("team_finances").update({ balance: nextBalance, payroll_spent: nextPayroll, signing_bonus_spent: nextBonusSpent, updated_at: new Date().toISOString() }).eq("id", financeRow.id);
      if (financeUpdateError) { console.error(financeUpdateError); alert("Contract accepted, but team finances were not updated. Check team_finances RLS update policy."); }
    }
    await supabase.from("contract_offers").update({ status: "Declined", updated_at: new Date().toISOString() }).eq("driver_name", driver.name).eq("status", "Pending").neq("id", offer.id);
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

  useEffect(() => {
    if (!driver?.id || interviewInitRef.current) return;
    interviewInitRef.current = true;
    async function loadInterviews() {
      const { data } = await supabase.from("interviews").select("*").eq("driver_id", driver.id).order("generated_at", { ascending: false });
      setInterviews(data || []);
    }
    loadInterviews();
    const interval = setInterval(loadInterviews, 30000);
    return () => clearInterval(interval);
  }, [driver?.id]);

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

          <div style={{ marginBottom: 20 }}><button onClick={() => setIsAppealModalOpen(true)} style={primaryButtonStyle}>📋 File New Appeal</button></div>

          {myAppeals.length === 0 ? (
            <div style={{ ...sectionCardStyle, opacity: 0.7 }}>No appeals submitted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myAppeals.map(appeal => {
                const statusConfig = {
                  Open: { color: "#3b82f6", bg: "#0f1d35", border: "#1e3a6e", icon: "🕐" },
                  Approved: { color: "#22c55e", bg: "#0e2918", border: "#1a5c30", icon: "✅" },
                  Denied: { color: "#ef4444", bg: "#2a0e0e", border: "#6b1a1a", icon: "❌" },
                }[appeal.status] || { color: "#888", bg: "#111", border: "#333", icon: "?" };
                return (
                  <div key={appeal.id} style={{ background: statusConfig.bg, border: `1px solid ${statusConfig.border}`, borderRadius: 14, padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 20 }}>{statusConfig.icon}</span><span style={{ fontWeight: 800, fontSize: 16 }}>{appeal.track}</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ background: statusConfig.color, color: "white", borderRadius: 8, padding: "3px 12px", fontSize: 12, fontWeight: 800 }}>{appeal.status}</span><span style={{ fontSize: 12, opacity: 0.5 }}>{new Date(appeal.created_at).toLocaleDateString()}</span></div>
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.6, marginBottom: appeal.admin_notes ? 12 : 0 }}>{appeal.description}</div>
                    {appeal.evidence_url && <div style={{ marginTop: 10 }}><video controls width="100%" style={{ maxWidth: 480, borderRadius: 8 }} src={appeal.evidence_url} /></div>}
                    {appeal.admin_notes && <div style={{ marginTop: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px", borderLeft: `3px solid ${statusConfig.color}` }}><div style={{ fontSize: 11, fontWeight: 800, opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>League Determination</div><div style={{ fontSize: 14, lineHeight: 1.6 }}>{appeal.admin_notes}</div></div>}
                    {appeal.status === "Open" && <div style={{ marginTop: 10, fontSize: 12, opacity: 0.5, fontStyle: "italic" }}>Awaiting league review...</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} selectedSeason={selectedSeason} />
      </div>
    );
  }

  if (!selectedSeason) {
    return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}><button onClick={() => window.location.pathname = "/standings"} style={secondaryButtonStyle}>← Back to Standings</button><div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>No season data loaded.</div><div style={{ opacity: 0.75 }}>Try refreshing the page or returning to standings.</div></div></div></div>;
  }

  if (!driver) {
    return <div style={appShellStyle}><div style={pageContainerStyle}><div style={sectionCardStyle}><button onClick={() => window.location.pathname = "/standings"} style={secondaryButtonStyle}>← Back to Standings</button><div style={{ marginTop: 16, marginBottom: 16, fontWeight: 700 }}>Driver #{driverNumber} not found in {selectedSeason?.name}</div><div style={{ opacity: 0.75 }}>Check the standings page to select a valid driver.</div></div></div></div>;
  }

  const teamTheme = getTeamTheme(driver.team);
  const themedPrimaryButtonStyle = { ...primaryButtonStyle, background: teamTheme.accent };

  const raceBreakdown = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return (selectedSeason.raceHistory || [])
      .map((race) => {
        const result = (race.results || []).find((r) => r && r.driverId === driver.id);
        return { raceName: race.raceName, stageCount: race.stageCount, ...result };
      })
      .filter((r) => r && r.driverId === driver.id);
  }, [selectedSeason, driver]);

  const calculatedStats = useMemo(() => ({
    points: driver.points || 0,
    wins: driver.wins || 0,
    top3: driver.top3 || 0,
    top5: driver.top5 || 0,
    dnfs: driver.dnfs || 0,
    fastestLaps: driver.fastestLaps || 0,
    totalPenalties: driver.totalPenalties || 0,
  }), [driver]);

  const offenseLog = useMemo(() => {
    if (!selectedSeason || !driver) return [];
    return (selectedSeason.raceHistory || []).flatMap((race) =>
      (race.results || [])
        .filter((r) => r && r.driverId === driver.id && r.offense)
        .map((r) => ({ raceName: race.raceName, ...r }))
    );
  }, [selectedSeason, driver]);

  const careerStats = useMemo(() => {
    let totalWins = 0, totalPoints = 0, totalPodiums = 0, totalRaces = 0;
    if (seasons && Array.isArray(seasons)) {
      seasons.forEach(season => {
        const d = season.drivers?.find(dr => dr.id === driver.id);
        if (d) {
          totalWins += d.wins || 0;
          totalPoints += d.points || 0;
          totalPodiums += d.top3 || 0;
          totalRaces += (season.raceHistory || []).filter(r => r.results?.some(res => res.driverId === driver.id)).length;
        }
      });
    }
    return { wins: totalWins, points: totalPoints, podiums: totalPodiums, races: totalRaces };
  }, [seasons, driver.id]);

  const recentForm = useMemo(() => {
    return (selectedSeason.raceHistory || [])
      .filter(r => r.results?.some(res => res.driverId === driver.id))
      .slice(-5)
      .map(r => {
        const result = r.results.find(res => res.driverId === driver.id);
        return { race: r.raceName, points: result?.totalRacePoints || 0, finish: result?.finishPos };
      });
  }, [selectedSeason, driver.id]);

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

  const consistencyRating = useMemo(() => {
    const finishes = raceBreakdown.filter(r => r.finishPos).map(r => r.finishPos);
    if (finishes.length === 0) return { avg: 0, best: "—", worst: "—" };
    const avg = (finishes.reduce((a, b) => a + b, 0) / finishes.length).toFixed(1);
    return { avg, best: Math.min(...finishes), worst: Math.max(...finishes) };
  }, [raceBreakdown]);

  const personalRecords = useMemo(() => {
    let bestFinish = Infinity, fastestLapCount = 0, highestPointsRace = 0;
    raceBreakdown.forEach(r => {
      if (r.finishPos) bestFinish = Math.min(bestFinish, r.finishPos);
      if (r.fastestLap) fastestLapCount++;
      if (r.totalRacePoints) highestPointsRace = Math.max(highestPointsRace, r.totalRacePoints);
    });
    return { bestFinish: bestFinish === Infinity ? "—" : bestFinish, fastestLaps: fastestLapCount, highestRacePoints: highestPointsRace };
  }, [raceBreakdown]);

  const streaks = useMemo(() => {
    let currentWinStreak = 0, longestWinStreak = 0, currentPodiumStreak = 0, longestPodiumStreak = 0, currentDnfStreak = 0, longestDnfStreak = 0;
    raceBreakdown.forEach(r => {
      if (r.isWin) { currentWinStreak++; longestWinStreak = Math.max(longestWinStreak, currentWinStreak); } else currentWinStreak = 0;
      if (r.isTop3) { currentPodiumStreak++; longestPodiumStreak = Math.max(longestPodiumStreak, currentPodiumStreak); } else currentPodiumStreak = 0;
      if (r.dnf) { currentDnfStreak++; longestDnfStreak = Math.max(longestDnfStreak, currentDnfStreak); } else currentDnfStreak = 0;
    });
    return { currentWins: currentWinStreak, longestWins: longestWinStreak, currentPodiums: currentPodiumStreak, longestPodiums: longestPodiumStreak, currentDnfs: currentDnfStreak, longestDnfs: longestDnfStreak };
  }, [raceBreakdown]);

  const driverRanking = useMemo(() => {
    const sorted = [...(selectedSeason.drivers || [])].sort((a, b) => b.points - a.points);
    return sorted.findIndex(d => d.id === driver.id) + 1;
  }, [selectedSeason, driver.id]);

  const championshipPicture = useMemo(() => {
    const sorted = [...(selectedSeason.drivers || [])].sort((a, b) => Number(b.points || 0) - Number(a.points || 0));
    const leader = sorted[0];
    const driverIdx = sorted.findIndex(d => d.id === driver.id);
    const rank = driverIdx + 1;
    const pointsBehindLeader = leader ? Math.max(0, Number(leader.points || 0) - Number(driver.points || 0)) : 0;
    const totalDrivers = sorted.length || 1;
    let status = "Building Points";
    let color = teamTheme.accent;
    let bg = teamTheme.dark;
    if (rank === 1) { status = "Points Leader"; color = "#22c55e"; bg = "#102a16"; }
    else if (rank <= Math.ceil(totalDrivers * 0.25)) { status = "Championship Contender"; color = teamTheme.accent; bg = teamTheme.dark; }
    else if (rank <= Math.ceil(totalDrivers * 0.5)) { status = "In the Hunt"; color = "#d4af37"; bg = "#2a240f"; }
    else { status = "Needs a Points Run"; color = "#ef4444"; bg = "#2a1111"; }
    return { leader, rank, pointsBehindLeader, status, color, bg };
  }, [selectedSeason, driver, teamTheme]);

  const pointsGap = useMemo(() => {
    const sorted = [...(selectedSeason.drivers || [])].sort((a, b) => b.points - a.points);
    const driverIdx = sorted.findIndex(d => d.id === driver.id);
    if (driverIdx === 0) return { ahead: 0, behind: 0 };
    const ahead = sorted[driverIdx - 1].points - driver.points;
    const behind = driverIdx < sorted.length - 1 ? driver.points - sorted[driverIdx + 1].points : 0;
    return { ahead, behind };
  }, [selectedSeason, driver.id]);

  const teamStats = useMemo(() => {
    const teammate = (selectedSeason.drivers || []).find(d => d.team === driver.team && d.id !== driver.id);
    if (!teammate) return null;
    return { name: teammate.name, number: teammate.number, points: teammate.points, wins: teammate.wins, top3: teammate.top3 };
  }, [selectedSeason, driver.id]);

  const trackStats = useMemo(() => {
    const trackMap = {};
    raceBreakdown.forEach(r => {
      const track = r.raceName;
      if (!trackMap[track]) trackMap[track] = { races: 0, points: 0, finish: [] };
      trackMap[track].races++;
      trackMap[track].points += r.totalRacePoints || 0;
      if (r.finishPos) trackMap[track].finish.push(r.finishPos);
    });
    const sorted = Object.entries(trackMap).sort((a, b) => b[1].points - a[1].points);
    return { best: sorted[0], worst: sorted[sorted.length - 1], total: sorted.length };
  }, [raceBreakdown]);

  const pointsProjection = useMemo(() => {
    const racesCompleted = raceBreakdown.length;
    const totalTracks = selectedSeason.raceHistory?.length || 0;
    if (racesCompleted === 0) return "—";
    const avgPointsPerRace = calculatedStats.points / racesCompleted;
    return Math.round(avgPointsPerRace * totalTracks);
  }, [calculatedStats.points, raceBreakdown, selectedSeason]);

  const achievementProgress = useMemo(() => {
    const achievements = [
      { name: "First Win", current: calculatedStats.wins, target: 1, emoji: "🏆" },
      { name: "Hat Trick", current: calculatedStats.wins, target: 3, emoji: "🥇" },
      { name: "Dominator", current: calculatedStats.wins, target: 5, emoji: "👑" },
      { name: "Podium Master", current: calculatedStats.top3, target: 10, emoji: "🎯" },
      { name: "Century Club", current: calculatedStats.points, target: 100, emoji: "⭐" },
      { name: "Speed Demon", current: calculatedStats.fastestLaps, target: 5, emoji: "⚡" },
    ];
    return achievements.filter(a => a.current < a.target);
  }, [calculatedStats]);

  return (
    <div style={{ ...appShellStyle, background: `radial-gradient(circle at top, ${teamTheme.glow} 0%, #0c0f14 34%, #080a0e 100%)` }}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent, boxShadow: `0 0 38px ${teamTheme.glow}`, background: `linear-gradient(135deg, #171b22 0%, #10141b 56%, ${teamTheme.dark} 100%)`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent 0%, ${teamTheme.glow} 100%)`, opacity: 0.45, pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div>
              <button onClick={() => window.location.pathname = "/standings"} style={{ ...secondaryButtonStyle, marginBottom: 12 }}>← Back to Standings</button>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900 }}>{driver.name}</div>
                <div style={{ fontSize: 16, opacity: 0.8, marginTop: 4 }}>#{driver.number}</div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 4, color: teamTheme.accent }}>{getTeamFullName(driver.team)}</div>
                <div style={{ fontSize: 12, opacity: 0.65, marginTop: 2 }}>{driver.team}</div>
                <div style={{ marginTop: 12, display: "inline-flex", padding: "6px 12px", borderRadius: 999, background: teamTheme.glow, border: `1px solid ${teamTheme.accent}`, fontSize: 12, fontWeight: 900 }}>
                  {reputation.archetype}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 150, height: 150, borderRadius: 12, background: "rgba(15,19,25,0.82)", border: `1px solid ${teamTheme.accent}`, boxShadow: `0 0 24px ${teamTheme.glow}` }}>
              {teamLogos[driver.team] ? <img src={teamLogos[driver.team]} alt={driver.team} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} /> : <div style={{ fontWeight: 700, fontSize: 13, color: teamTheme.accent, textAlign: "center", padding: 8 }}>{getTeamFullName(driver.team)}</div>}
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 140, height: 140, borderRadius: 12, background: "rgba(15,19,25,0.82)", border: "1px solid #2c3440" }}>
              {driver.manufacturerLogo ? <img src={driver.manufacturerLogo} alt={driver.manufacturer} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} /> : <div style={{ fontWeight: 700, fontSize: 12, color: teamTheme.accent, textAlign: "center", padding: 8 }}>{driver.manufacturer || "—"}</div>}
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, opacity: 0.72, marginBottom: 4 }}>SEASON</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedSeason.name}</div>
              <div style={{ marginTop: 8, color: teamTheme.accent, fontSize: 13, fontWeight: 900 }}>P{driverRanking} • {calculatedStats.points} PTS</div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => document.getElementById("driver-contract-portal")?.scrollIntoView({ behavior: "smooth" })}
            style={themedPrimaryButtonStyle}
          >
            📄 Driver Contract Portal
          </button>

          <button
            onClick={() => document.getElementById("driver-upload-center")?.scrollIntoView({ behavior: "smooth" })}
            style={secondaryButtonStyle}
          >
            📷 Upload Center
          </button>

          <button
            onClick={() => document.getElementById("driver-interview-center")?.scrollIntoView({ behavior: "smooth" })}
            style={secondaryButtonStyle}
          >
            🎙️ Interview Center
          </button>
          <button
            onClick={() => {
              const section = document.getElementById("driver-contract-portal");
              if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={themedPrimaryButtonStyle}
          >
            📄 Driver Contract Portal
          </button>

          <button
            onClick={() => {
              const section = document.getElementById("driver-upload-center");
              if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={secondaryButtonStyle}
          >
            📷 Upload Center
          </button>

          <button
            onClick={() => {
              const section = document.getElementById("driver-interview-center");
              if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            style={secondaryButtonStyle}
          >
            🎙️ Interview Center
          </button>

          <button onClick={() => setIsAppealModalOpen(true)} style={themedPrimaryButtonStyle}>📋 File an Appeal</button>

          <button
            onClick={() => window.location.pathname = `/driver/${driverNumber}/appeals`}
            style={{ ...secondaryButtonStyle, position: "relative" }}
          >
            📁 My Appeals
            {myAppeals.length > 0 && (
              <span
                style={{
                  marginLeft: 8,
                  background: myAppeals.some(a => a.status !== "Open") ? "#22c55e" : "#3b82f6",
                  color: "white",
                  borderRadius: 99,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {myAppeals.length}
              </span>
            )}
          </button>
        </div>
          {[
            { label: "POINTS", value: calculatedStats.points },
            { label: "WINS", value: calculatedStats.wins },
            { label: "TOP 3", value: calculatedStats.top3 },
            { label: "TOP 5", value: calculatedStats.top5 },
            { label: "DNFs", value: calculatedStats.dnfs },
            { label: "PENALTIES", value: calculatedStats.totalPenalties ? `-${calculatedStats.totalPenalties}` : "0" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...statBoxStyle, borderColor: teamTheme.accent, boxShadow: `0 0 18px ${teamTheme.glow}` }}>
              <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.label === "POINTS" ? teamTheme.accent : "white" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{ ...sectionCardStyle, borderColor: teamTheme.accent }}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>🔥 Driver Reputation</h2>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>DRIVER ARCHETYPE</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: teamTheme.accent }}>{reputation.archetype}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {[["Aggression", reputation.aggression], ["Consistency", reputation.consistency], ["Racecraft", reputation.racecraft], ["Momentum", reputation.momentum], ["Popularity", reputation.popularity]].map(([label, value]) => (
              <div key={label} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6 }}>{label.toUpperCase()}</div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{value}</div>
                <div style={{ background: "#202733", borderRadius: 999, height: 8, marginTop: 8, overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", background: teamTheme.accent }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div id="driver-contract-portal" style={{ ...sectionCardStyle, borderColor: isDriverAuthorized ? teamTheme.accent : "#2c3440" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div><h2 style={{ margin: 0 }}>📄 Contract Offers</h2><div style={{ fontSize: 13, opacity: 0.65, marginTop: 4 }}>Driver-only contract inbox. Unlock to review, accept, or decline offers.</div></div>
            {isDriverAuthorized && <button onClick={lockDriverContracts} style={secondaryButtonStyle}>Lock Contracts</button>}
          </div>
          {!isDriverAuthorized ? (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
                <div><div style={{ fontSize: 12, fontWeight: 800, opacity: 0.7, marginBottom: 8 }}>DRIVER CODE</div><input value={driverAccessCodeInput} onChange={(event) => setDriverAccessCodeInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") unlockDriverContracts(); }} placeholder={`Enter #${driver.number} driver code`} style={inputStyle} /></div>
                <button onClick={unlockDriverContracts} style={themedPrimaryButtonStyle}>Unlock My Contracts</button>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, opacity: 0.65, lineHeight: 1.5 }}>Contract offers are hidden until this driver unlocks the inbox with their private driver code.</div>
              {contractError && <div style={{ marginTop: 12, color: "#f87171", fontWeight: 800 }}>{contractError}</div>}
            </div>
          ) : contractLoading ? <div style={{ opacity: 0.7 }}>Loading contract offers...</div> : contractOffers.length === 0 ? <div style={{ opacity: 0.7 }}>No contract offers currently available for #{driver.number} {driver.name}.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {contractOffers.map((offer) => (
                <div key={offer.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 10 }}><div><div style={{ fontSize: 20, fontWeight: 900 }}>{offer.team}</div><div style={{ fontSize: 12, opacity: 0.65 }}>{offer.brand_style || "Balanced"}</div></div><div style={{ background: offer.status === "Accepted" ? "#14532d" : offer.status === "Declined" ? "#7f1d1d" : offer.status === "Withdrawn" ? "#3f3f46" : "#1e3a8a", padding: "4px 12px", borderRadius: 8, fontWeight: 800, fontSize: 12 }}>{offer.status}</div></div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 12, marginBottom: 14 }}>
                    {[['SALARY', money(offer.salary)], ['SIGNING BONUS', money(offer.signing_bonus)], ['CONTRACT LENGTH', `${offer.contract_length || 1} season(s)`], ['BUYOUT', money(offer.buyout_amount)], ['WIN BONUS', money(offer.win_bonus)], ['CHAMPIONSHIP BONUS', money(offer.championship_bonus)]].map(([label, value]) => <div key={label}><div style={{ opacity: 0.6, fontSize: 11 }}>{label}</div><div style={{ fontWeight: 900, color: label === 'SALARY' ? teamTheme.accent : 'white' }}>{value}</div></div>)}
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
                  {offer.status === "Pending" && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button onClick={() => acceptContractOffer(offer)} style={{ ...primaryButtonStyle, background: "#22c55e" }}>Accept Offer</button><button onClick={() => declineContractOffer(offer)} style={{ ...dangerButtonStyle }}>Decline Offer</button></div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {interviews.length > 0 && <div id="driver-interview-center" style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 4 }}>🎙️ Driver Interviews</h2><div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>Answer the questions below and submit. Your responses go to the league admin.</div><div style={{ display: "flex", flexDirection: "column", gap: 20 }}>{interviews.map(interview => <InterviewAnswerCard key={interview.id} interview={interview} onAnswered={(updated) => setInterviews(prev => prev.map(i => i.id === updated.id ? updated : i))} />)}</div></div>}

        {(() => {
          const achievements = [
            { badge: "🏆", name: "First Win", condition: calculatedStats.wins >= 1 },
            { badge: "🥇", name: "Hat Trick", condition: calculatedStats.wins >= 3 },
            { badge: "👑", name: "Dominator", condition: calculatedStats.wins >= 5 },
            { badge: "🎯", name: "Podium Master", condition: calculatedStats.top3 >= 10 },
            { badge: "⭐", name: "Century Club", condition: calculatedStats.points >= 100 },
            { badge: "⚡", name: "Speed Demon", condition: calculatedStats.fastestLaps >= 5 },
          ].filter(a => a.condition);
          return achievements.length > 0 && <div style={{ ...sectionCardStyle, marginBottom: 20, borderColor: teamTheme.accent }}><h3 style={{ marginTop: 0, marginBottom: 12 }}>Achievements</h3><div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>{achievements.map((a, i) => <div key={i} style={{ background: "#0f1319", border: `1px solid ${teamTheme.accent}`, borderRadius: 10, padding: 12, textAlign: "center", minWidth: 90 }}><div style={{ fontSize: 28, marginBottom: 4 }}>{a.badge}</div><div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8 }}>{a.name}</div></div>)}</div></div>;
        })()}

        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}><button onClick={() => setIsAppealModalOpen(true)} style={themedPrimaryButtonStyle}>📋 File an Appeal</button><button onClick={() => window.location.pathname = `/driver/${driverNumber}/appeals`} style={{ ...secondaryButtonStyle, position: "relative" }}>📁 My Appeals{myAppeals.length > 0 && <span style={{ marginLeft: 8, background: myAppeals.some(a => a.status !== "Open") ? "#22c55e" : "#3b82f6", color: "white", borderRadius: 99, padding: "2px 8px", fontSize: 11, fontWeight: 800 }}>{myAppeals.length}</span>}</button></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>📻 Garage Radio</h2><div style={{ display: "flex", flexDirection: "column", gap: 10 }}><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><strong style={{ color: teamTheme.accent }}>Race Control:</strong> Driver communications, media requests, and race-week updates will appear here.</div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><strong style={{ color: teamTheme.accent }}>Team Message:</strong> {getTeamFullName(driver.team)} expects performance, media activity, and clean execution.</div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><strong style={{ color: teamTheme.accent }}>Media Room:</strong> Interview requests are listed above when assigned by league admin.</div></div></div>

        <div id="driver-upload-center" style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 4 }}>🚗 Car Photos</h2><div style={{ fontSize: 13, opacity: 0.65, marginBottom: 16 }}>Upload your car photo for each race week. Photos appear in the admin gallery.</div><div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}><div style={{ flex: "1 1 200px" }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Race Week</div><select style={inputStyle} value={selectedRaceForUpload} onChange={e => setSelectedRaceForUpload(e.target.value)}><option value="">Select a race...</option>{tracks.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select></div><div><input ref={carFileInputRef} type="file" accept="image/*,video/mp4,video/quicktime" style={{ display: "none" }} onChange={handleCarUpload} /><button onClick={() => carFileInputRef.current?.click()} style={{ ...themedPrimaryButtonStyle, opacity: carUploading ? 0.6 : 1 }} disabled={carUploading}>{carUploading ? "⏳ Uploading..." : "📷 Upload Photo / Video"}</button></div></div>{carUploads.length === 0 ? <div style={{ fontSize: 13, opacity: 0.5, fontStyle: "italic" }}>No uploads yet.</div> : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>{carUploads.map(upload => { const url = upload.image_url || upload.file_url || ""; const fileType = upload.file_type || ""; const isImage = fileType.startsWith("image/") || (!fileType && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)); const isVideo = fileType.startsWith("video/") || (!fileType && url.match(/\.(mp4|mov|avi|webm)$/i)); const raceName = upload.race_week || upload.race_id || "—"; return <div key={upload.id} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 12, overflow: "hidden" }}><div style={{ width: "100%", paddingBottom: "75%", position: "relative", background: "#1a1f27" }}>{isImage ? <img src={url} alt="Car" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : isVideo ? <video controls style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}><source src={url} type={fileType || "video/mp4"} /></video> : url ? <img src={url} alt="Car" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>📄</div>}</div><div style={{ padding: 10 }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{raceName}</div><div style={{ fontSize: 11, opacity: 0.55, marginBottom: 8 }}>{upload.uploaded_at ? new Date(upload.uploaded_at).toLocaleDateString() : ""}</div><button onClick={() => handleCarDelete(upload.id, upload.file_path || upload.cloudinary_id)} style={{ ...dangerButtonStyle, width: "100%", padding: "6px 10px", fontSize: 12 }}>Remove</button></div></div>; })}</div>}</div>

        {driver.notes && <div style={{ ...sectionCardStyle, marginBottom: 20, background: "#1a1f27", borderLeft: `4px solid ${teamTheme.accent}` }}><h3 style={{ marginTop: 0, marginBottom: 8 }}>Admin Notes</h3><div style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.9 }}>{driver.notes}</div></div>}

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 16 }}>Season Overview</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>RANKING</div><div style={{ fontSize: 28, fontWeight: 800, color: teamTheme.accent }}>P{driverRanking}</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>PROJECTION</div><div style={{ fontSize: 22, fontWeight: 800 }}>{pointsProjection} pts</div><div style={{ fontSize: 10, opacity: 0.6 }}>Full season estimate</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>AVG FINISH</div><div style={{ fontSize: 22, fontWeight: 800 }}>P{consistencyRating.avg}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Consistency</div></div></div>{pointsGap.ahead > 0 && <div style={{ background: "#2a3140", borderRadius: 8, padding: 12, marginBottom: 12 }}><div style={{ fontSize: 13, opacity: 0.8 }}>📊 <strong>{pointsGap.ahead} points</strong> behind P{driverRanking - 1}</div></div>}{pointsGap.behind > 0 && <div style={{ background: "#2a3140", borderRadius: 8, padding: 12 }}><div style={{ fontSize: 13, opacity: 0.8 }}>📊 <strong>{pointsGap.behind} point lead</strong> over P{driverRanking + 1}</div></div>}</div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>🏁 Championship Points Picture</h2><div style={{ background: championshipPicture.bg, border: `1px solid ${championshipPicture.color}`, borderRadius: 12, padding: 16 }}><div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>CURRENT STATUS</div><div style={{ fontSize: 22, fontWeight: 900, color: championshipPicture.color }}>{championshipPicture.status}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 8 }}>Current standings position: P{championshipPicture.rank}</div><div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>{championshipPicture.rank === 1 ? "This driver currently controls the top spot in the championship standings." : `${championshipPicture.pointsBehindLeader} points behind the current points leader.`}</div></div></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Personal Records</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>{[["BEST FINISH", personalRecords.bestFinish], ["FASTEST LAPS", personalRecords.fastestLaps], ["BEST RACE", personalRecords.highestRacePoints]].map(([label, value]) => <div key={label} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800, color: teamTheme.accent }}>{value}</div>{label === "BEST RACE" && <div style={{ fontSize: 10, opacity: 0.6 }}>points</div>}</div>)}</div></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Current Streaks</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}><div style={{ background: streaks.currentWins > 0 ? "#1a3a1a" : "#0f1319", border: `1px solid ${streaks.currentWins > 0 ? "#4ade80" : "#2c3440"}`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>WIN STREAK 🏆</div><div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentWins}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Best: {streaks.longestWins}</div></div><div style={{ background: streaks.currentPodiums > 0 ? "#1a3a1a" : "#0f1319", border: `1px solid ${streaks.currentPodiums > 0 ? "#4ade80" : "#2c3440"}`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>PODIUM STREAK 🎯</div><div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentPodiums}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Best: {streaks.longestPodiums}</div></div><div style={{ background: streaks.currentDnfs > 0 ? "#3a1a1a" : "#0f1319", border: `1px solid ${streaks.currentDnfs > 0 ? "#f87171" : "#2c3440"}`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>DNF STREAK 💥</div><div style={{ fontSize: 28, fontWeight: 800 }}>{streaks.currentDnfs}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Worst: {streaks.longestDnfs}</div></div></div></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Career Stats (All Seasons)</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>{[["CAREER WINS", careerStats.wins], ["CAREER POINTS", careerStats.points], ["PODIUMS", careerStats.podiums], ["RACES", careerStats.races]].map(([label, value]) => <div key={label} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{label}</div><div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div></div>)}</div></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Consistency Analysis</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>AVERAGE FINISH</div><div style={{ fontSize: 24, fontWeight: 800 }}>P{consistencyRating.avg}</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>BEST - WORST</div><div style={{ fontSize: 18, fontWeight: 800 }}>P{consistencyRating.best} - P{consistencyRating.worst}</div><div style={{ fontSize: 10, opacity: 0.6 }}>Range</div></div></div></div>

        {trackStats.best && <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Track Performance</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}><div style={{ background: "#1a3a1a", border: "1px solid #4ade80", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, color: "#4ade80" }}>BEST TRACK 🏁</div><div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{trackStats.best[0]}</div><div style={{ fontSize: 12, opacity: 0.8 }}>{trackStats.best[1].points} pts in {trackStats.best[1].races} races</div></div><div style={{ background: "#3a1a1a", border: "1px solid #f87171", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4, color: "#f87171" }}>WORST TRACK 🚩</div><div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{trackStats.worst[0]}</div><div style={{ fontSize: 12, opacity: 0.8 }}>{trackStats.worst[1].points} pts in {trackStats.worst[1].races} races</div></div></div></div>}

        {teamStats && <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Teammate Comparison</h2><div style={{ fontSize: 13, opacity: 0.7, marginBottom: 10 }}>{getTeamFullName(driver.team)}</div><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}><div style={{ background: "#0f1319", border: `1px solid ${teamTheme.accent}`, borderRadius: 10, padding: 12 }}><div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>{driver.name}</div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Points: {driver.points}</div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Wins: {calculatedStats.wins}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {calculatedStats.top3}</div></div><div style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 10, padding: 12 }}><div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>#{teamStats.number} {teamStats.name}</div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Points: {teamStats.points}</div><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 2 }}>Wins: {teamStats.wins}</div><div style={{ fontSize: 11, opacity: 0.7 }}>Podiums: {teamStats.top3}</div></div></div></div>}

        {achievementProgress.length > 0 && <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Achievement Progress</h2><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{achievementProgress.map((a, i) => { const progress = Math.round((a.current / a.target) * 100); return <div key={i}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span style={{ fontSize: 13, fontWeight: 700 }}>{a.emoji} {a.name}</span><span style={{ fontSize: 12, opacity: 0.7 }}>{a.current}/{a.target}</span></div><div style={{ background: "#0f1319", borderRadius: 8, height: 8, overflow: "hidden" }}><div style={{ background: teamTheme.accent, height: "100%", width: `${progress}%`, transition: "width 0.3s" }} /></div></div>; })}</div></div>}

        {recentForm.length > 0 && <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>Recent Form (Last 5 Races)</h2><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10 }}>{recentForm.map((r, i) => <div key={i} style={{ background: "#0f1319", border: "1px solid #2c3440", borderRadius: 8, padding: 10, textAlign: "center" }}><div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{r.race.split("(")[0].trim().substring(0, 8)}</div><div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2, color: teamTheme.accent }}>{r.points}</div><div style={{ fontSize: 10, opacity: 0.6 }}>P{r.finish || "—"}</div></div>)}</div></div>}

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 14 }}>🎬 Replay Theater / Media Hub</h2><div style={{ fontSize: 13, opacity: 0.7, marginBottom: 14 }}>Driver highlights, uploaded car media, interviews, and race-week content will live here.</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}><button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}`}>Driver Home</button><button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/driver/${driver.number}/appeals`}>Appeals</button><button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/streams`}>Race Broadcasts</button><button style={secondaryButtonStyle} onClick={() => window.location.pathname = `/standings`}>League Standings</button></div></div>

        <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 16 }}>Race-by-Race Breakdown</h2>{raceBreakdown.length === 0 ? <div style={{ opacity: 0.75 }}>No races entered yet.</div> : <div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Finish</th><th style={thStyle}>Race Pts</th><th style={thStyle}>Stage 1</th><th style={thStyle}>Stage 2</th><th style={thStyle}>FL</th><th style={thStyle}>DNF</th><th style={thStyle}>Offense</th><th style={thStyle}>Penalty</th><th style={thStyle}>Total</th></tr></thead><tbody>{raceBreakdown.map((race) => <tr key={race.raceName}><td style={tdStyle}>{race.raceName}</td><td style={tdStyle}>{race.finishPos ?? "—"}</td><td style={tdStyle}>{race.finishPoints || 0}</td><td style={tdStyle}>{race.stage1Points || 0}</td><td style={tdStyle}>{race.stage2Points || 0}</td><td style={tdStyle}>{race.fastestLap ? "+1" : "—"}</td><td style={tdStyle}>{race.dnf ? "DNF" : "—"}</td><td style={tdStyle}>{race.offense ? `#${race.offenseNumber}` : "—"}</td><td style={{ ...tdStyle, color: (race.penaltyPoints || 0) > 0 ? "#f87171" : "inherit" }}>{(race.penaltyPoints || 0) > 0 ? `-${race.penaltyPoints}` : "—"}</td><td style={{ ...tdStyle, fontWeight: 800, color: teamTheme.accent }}>{race.totalRacePoints || 0}</td></tr>)}</tbody></table></div>}</div>

        {offenseLog.length > 0 && <div style={sectionCardStyle}><h2 style={{ marginTop: 0, marginBottom: 16 }}>Offense History</h2><div style={{ overflowX: "auto" }}><table style={tableStyle}><thead><tr><th style={thStyle}>Race</th><th style={thStyle}>Offense #</th><th style={thStyle}>Penalty Points</th></tr></thead><tbody>{offenseLog.map((entry, idx) => <tr key={`${entry.raceName}-${idx}`}><td style={tdStyle}>{entry.raceName}</td><td style={tdStyle}>#{entry.offenseNumber}</td><td style={{ ...tdStyle, color: "#f87171", fontWeight: 700 }}>-{entry.penaltyPoints} pts</td></tr>)}</tbody></table></div></div>}
      </div>

      <AppealModal isOpen={isAppealModalOpen} onClose={() => setIsAppealModalOpen(false)} selectedSeason={selectedSeason} />
    </div>
  );
}
