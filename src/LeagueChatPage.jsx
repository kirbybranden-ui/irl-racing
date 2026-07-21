import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

const appShellStyle = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const pageContainerStyle = { maxWidth: 1100, margin: "0 auto", padding: 24 };
const sectionCardStyle = {
  background: "#171b22",
  border: "1px solid #2c3440",
  borderRadius: 18,
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

const MASTER_ACCESS_CODE = "BCLADMINPASSWORD2026";

function normalizeAccessCode(value) {
  return String(value || "").trim().toUpperCase();
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

  const nextCodes = {};
  (rows || []).forEach((row) => {
    const code = row.code || row.access_code;
    if (!code) return;
    if (row.driver_number) nextCodes[String(row.driver_number)] = code;
    if (row.driver_name) nextCodes[String(row.driver_name).toLowerCase()] = code;
  });

  return nextCodes;
}

export default function LeagueChatPage({ drivers = [] }) {
  const activeDrivers = useMemo(() => {
    return (drivers || [])
      .filter((driver) => !driver.retired)
      .filter((driver) => String(driver?.name || "").trim())
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  const [authorizedDriverNumber, setAuthorizedDriverNumber] = useState(() => localStorage.getItem("bclChatAuthorizedDriverNumber") || "");
  const [selectedDriverNumber, setSelectedDriverNumber] = useState(() => localStorage.getItem("bclChatAuthorizedDriverNumber") || "");
  const [accessCode, setAccessCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const authorizedDriver = activeDrivers.find((driver) => String(driver.number) === String(authorizedDriverNumber)) || null;
  const selectedDriver = activeDrivers.find((driver) => String(driver.number) === String(selectedDriverNumber)) || null;

  async function loadMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("league_chat_messages")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      console.error("Could not load league chat:", error);
      setMessages([]);
      setLoading(false);
      return;
    }

    setMessages((data || []).reverse());
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 12000);
    return () => clearInterval(interval);
  }, []);

  async function unlockChat(event) {
    event.preventDefault();
    setLoginError("");

    if (!selectedDriver) {
      setLoginError("Choose your driver first.");
      return;
    }

    const codes = await loadRemoteDriverAccessCodes();
    const expectedByNumber = normalizeAccessCode(codes[String(selectedDriver.number)] || "");
    const expectedByName = normalizeAccessCode(codes[String(selectedDriver.name || "").toLowerCase()] || "");
    const typed = normalizeAccessCode(accessCode);

    if (typed !== expectedByNumber && typed !== expectedByName && typed !== normalizeAccessCode(MASTER_ACCESS_CODE)) {
      setLoginError("Incorrect driver access code.");
      return;
    }

    localStorage.setItem("bclChatAuthorizedDriverNumber", String(selectedDriver.number));
    setAuthorizedDriverNumber(String(selectedDriver.number));
    setAccessCode("");
  }

  function lockChat() {
    localStorage.removeItem("bclChatAuthorizedDriverNumber");
    setAuthorizedDriverNumber("");
    setAccessCode("");
    setSendError("");
    setSendNotice("");
  }

  async function sendMessage(event) {
    event.preventDefault();
    setSendError("");
    setSendNotice("");

    if (!authorizedDriver) {
      setSendError("Unlock League Chat before posting.");
      return;
    }

    const cleanMessage = String(messageBody || "").trim();
    if (!cleanMessage) {
      setSendError("Type a message before sending.");
      return;
    }

    if (cleanMessage.length > 600) {
      setSendError("Keep chat messages under 600 characters.");
      return;
    }

    const payload = {
      sender_driver_number: String(authorizedDriver.number),
      sender_name: authorizedDriver.name || `Driver #${authorizedDriver.number}`,
      sender_team: authorizedDriver.team || "Independent",
      message: cleanMessage,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("league_chat_messages").insert([payload]);

    if (error) {
      console.error("League chat send failed:", error);
      setSendError("Could not send chat message. Check league_chat_messages insert policy and columns.");
      return;
    }

    setMessageBody("");
    setSendNotice("Message sent.");
    await loadMessages();
  }

  return (
    <div style={appShellStyle}>
      <div style={pageContainerStyle}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #172033, #10141b)", borderColor: "rgba(212,175,55,0.45)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, letterSpacing: 1.4, color: "#d4af37", fontWeight: 900 }}>BUDWEISER CUP LEAGUE</div>
              <h1 style={{ margin: "8px 0 6px", fontSize: 38, lineHeight: 1 }}>💬 League Chat</h1>
              <div style={{ opacity: 0.74 }}>Live in-house IM room for drivers. Text only to keep Supabase usage low.</div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button onClick={() => (window.location.pathname = "/message-center")} style={secondaryButtonStyle}>📩 Message Center</button>
              <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>← Back to Standings</button>
            </div>
          </div>
        </div>

        {!authorizedDriver ? (
          <form onSubmit={unlockChat} style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>🔒 Driver Login Required</h2>
            <p style={{ opacity: 0.74, lineHeight: 1.5 }}>Choose your driver and enter your driver profile password before posting in League Chat.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>DRIVER</div>
                <select value={selectedDriverNumber} onChange={(event) => setSelectedDriverNumber(event.target.value)} style={inputStyle}>
                  <option value="">Choose driver</option>
                  {activeDrivers.map((driver) => (
                    <option key={`${driver.number}-${driver.name}`} value={driver.number}>#{driver.number} {driver.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.7, marginBottom: 8 }}>DRIVER ACCESS CODE</div>
                <input type="password" value={accessCode} onChange={(event) => setAccessCode(event.target.value)} placeholder="Enter driver password" style={inputStyle} />
              </div>
              <button type="submit" style={primaryButtonStyle}>Unlock Chat</button>
            </div>
            {loginError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{loginError}</div>}
          </form>
        ) : (
          <div style={sectionCardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, opacity: 0.72 }}>POSTING AS</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>#{authorizedDriver.number} {authorizedDriver.name}</div>
                <div style={{ fontSize: 13, opacity: 0.68 }}>{authorizedDriver.team || "Independent"}</div>
              </div>
              <button type="button" onClick={lockChat} style={secondaryButtonStyle}>Lock Chat</button>
            </div>

            <form onSubmit={sendMessage}>
              <textarea
                value={messageBody}
                onChange={(event) => setMessageBody(event.target.value)}
                placeholder="Type a league chat message..."
                rows={4}
                maxLength={600}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.62 }}>{messageBody.length}/600 characters</div>
                <button type="submit" style={primaryButtonStyle}>Send Chat Message</button>
              </div>
            </form>
            {sendNotice && <div style={{ color: "#4ade80", marginTop: 12, fontWeight: 900 }}>{sendNotice}</div>}
            {sendError && <div style={{ color: "#f87171", marginTop: 12, fontWeight: 900 }}>{sendError}</div>}
          </div>
        )}

        <div style={sectionCardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>League Room</h2>
            <button type="button" onClick={loadMessages} style={secondaryButtonStyle}>{loading ? "Refreshing..." : "Refresh"}</button>
          </div>

          {messages.length === 0 ? (
            <div style={{ opacity: 0.7 }}>No chat messages yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 620, overflowY: "auto", paddingRight: 4 }}>
              {messages.map((item) => (
                <div key={item.id || `${item.sender_driver_number}-${item.created_at}`} style={{ background: "#0f1319", border: "1px solid #2a3240", borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
                    <div style={{ fontWeight: 900 }}>
                      #{item.sender_driver_number} {item.sender_name || "Driver"}
                      <span style={{ opacity: 0.58, fontWeight: 700 }}> — {item.sender_team || "Independent"}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.55 }}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</div>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, color: "#e5e7eb" }}>{item.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
