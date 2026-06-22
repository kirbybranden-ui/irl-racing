import React, { useEffect, useMemo, useState } from "react";
import logo from "../assets/logo1.png";
import { supabase } from "../lib/supabase";
import {
  dedupeDriversByNumber,
  isInactivePlaceholderDriver,
} from "../utils/driverHelpers";
import {
  normalizeMessageValue,
  getCurrentUserFromSession,
  filterLeagueMessagesForSession,
} from "../utils/messagePermissions";
import {
  appShellStyle,
  pageContainerStyle,
  sectionCardStyle,
  primaryButtonStyle,
  secondaryButtonStyle,
  dangerButtonStyle,
  inputStyle,
} from "../styles/sharedStyles";

const BCL_MOBILE_SESSION_KEY = "bcl-mobile-session-v1";

function getBclRoleFlagsForDriver(driver = {}, enteredAdminCode = false) {
  const possibleNames = [
    driver.name,
    driver.driver_name,
    driver.driverName,
    driver.display_name,
    driver.displayName,
    driver.username,
    driver.handle,
  ].map(normalizeBclName).filter(Boolean);

  const isNamedAdmin = possibleNames.some((name) => BCL_ADMIN_NAMES.has(name));
  const isNamedOwner = possibleNames.some((name) => BCL_OWNER_NAMES.has(name));

  const team = driver.team || "";
  const manufacturer = driver.manufacturer || "";

  return {
    role: enteredAdminCode || isNamedAdmin ? "admin" : (isNamedOwner ? "owner" : "driver"),
    isAdmin: enteredAdminCode || isNamedAdmin,
    isOwner: isNamedOwner,
    isDriver: true,
    team,
    manufacturer,
  };
}

function readBclMobileSession() {
  try {
    const raw = localStorage.getItem(BCL_MOBILE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.mode) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getMessageCategory(message) {
    const type = String(message?.recipient_type || "").toLowerCase();
    if (type === "owners") return "owners";
    if (type === "team" || message?.recipient_team) return "team";
    if (type === "driver" || message?.recipient_driver_number) return "driver";
    if (type === "manufacturer" || message?.recipient_manufacturer) return "manufacturer";
    if (type === "league") return "league";
    return "other";
  }

function LeagueMessageCenterLandingPage({ drivers = [] }) {
  const [selectedDriverNumber, setSelectedDriverNumber] = useState("");
  const [driverCode, setDriverCode] = useState("");
  const [error, setError] = useState("");
  const [unreadCounts, setUnreadCounts] = useState({});
  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCounts() {
      const nextCounts = {};
      for (const driver of activeDrivers) {
        const driverNumber = String(driver.number || "");
        if (!driverNumber) continue;

        const { count, error: countError } = await supabase
          .from("league_messages")
          .select("*", { count: "exact", head: true })
          .or(`recipient_type.eq.league,recipient_driver_number.eq.${driverNumber},recipient_team.eq.${driver.team},recipient_manufacturer.eq.${driver.manufacturer}`)
          .eq("archived", false);

        if (!countError) nextCounts[driverNumber] = count || 0;
      }

      if (isMounted) setUnreadCounts(nextCounts);
    }

    if (activeDrivers.length) loadUnreadCounts();
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeDrivers]);

  async function unlockMessageCenter(event) {
    event?.preventDefault?.();
    setError("");

    const driver = activeDrivers.find((item) => String(item.number) === String(selectedDriverNumber));
    if (!driver) {
      setError("Choose your driver first.");
      return;
    }

    const enteredCode = String(driverCode || "").trim().toUpperCase();
    if (!enteredCode) {
      setError("Enter your driver access code.");
      return;
    }

    const { data, error: codeError } = await supabase
      .from("driver_access_codes")
      .select("driver_number, driver_name, code, active")
      .eq("active", true)
      .or(`driver_number.eq.${String(driver.number)},driver_name.ilike.${driver.name}`)
      .limit(10);

    if (codeError) {
      console.error("Could not verify driver access code:", codeError);
      setError("Could not verify access. Check driver_access_codes select policy.");
      return;
    }

    const match = (data || []).some((row) => {
      const rowDriverNumber = String(row.driver_number || "");
      const rowDriverName = String(row.driver_name || "").trim().toLowerCase();
      const rowCode = String(row.code || "").trim().toUpperCase();
      return (
        rowCode === enteredCode &&
        (rowDriverNumber === String(driver.number) || rowDriverName === String(driver.name || "").trim().toLowerCase())
      );
    });

    const adminMatch = enteredCode === "BCLADMINPASSWORD2026";

    if (!match && !adminMatch) {
      setError("Incorrect driver access code.");
      return;
    }

    const roleFlags = getBclRoleFlagsForDriver(driver, Boolean(adminMatch));
    const session = {
      mode: "driver",
      role: roleFlags.role,
      driverId: driver.id || null,
      driverNumber: String(driver.number),
      driverName: driver.name,
      team: driver.team || "",
      manufacturer: driver.manufacturer || "",
      isAdmin: roleFlags.isAdmin,
      isOwner: roleFlags.isOwner,
      isDriver: true,
    };
    saveBclMobileSession(session);
    window.location.pathname = "/message-center";
  }

  return (
    <div style={appShellStyle}>
      <div style={{ ...pageContainerStyle, maxWidth: 980 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", letterSpacing: 1.4 }}>BUDWEISER CUP LEAGUE</div>
              <h1 style={{ margin: "6px 0", fontSize: 34 }}>📩 League Message Center</h1>
              <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.5 }}>
                Direct messages, Race Control notices, owner/team messages, contract alerts, and assignments all live here.
              </p>
            </div>
            <button onClick={() => (window.location.pathname = "/standings")} style={secondaryButtonStyle}>Back to Standings</button>
          </div>
        </div>

        <form onSubmit={unlockMessageCenter} style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Driver Login Required</h2>
          <p style={{ opacity: 0.72, lineHeight: 1.5 }}>
            Drivers can see message counts publicly, but must unlock their profile before reading or sending messages.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER</div>
              <select value={selectedDriverNumber} onChange={(event) => setSelectedDriverNumber(event.target.value)} style={inputStyle}>
                <option value="">Choose driver</option>
                {activeDrivers.map((driver) => {
                  const count = unreadCounts[String(driver.number)] || 0;
                  return (
                    <option key={driver.id || driver.number} value={driver.number}>
                      #{driver.number} {driver.name}{count ? ` — ${count} message${count === 1 ? "" : "s"}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER ACCESS CODE</div>
              <input
                type="password"
                value={driverCode}
                onChange={(event) => setDriverCode(event.target.value)}
                placeholder="Enter driver password"
                style={inputStyle}
              />
            </div>

            <button type="submit" style={primaryButtonStyle}>Open Message Center</button>
          </div>

          {error && <div style={{ color: "#f87171", fontWeight: 900, marginTop: 12 }}>{error}</div>}
        </form>

        <div style={sectionCardStyle}>
          <h2 style={{ marginTop: 0 }}>Message Counts</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10 }}>
            {activeDrivers.map((driver) => {
              const count = unreadCounts[String(driver.number)] || 0;
              return (
                <button
                  key={driver.id || driver.number}
                  type="button"
                  onClick={() => setSelectedDriverNumber(String(driver.number))}
                  style={{
                    textAlign: "left",
                    background: count ? "rgba(239,68,68,0.12)" : "#0f1319",
                    border: count ? "1px solid #ef4444" : "1px solid #313947",
                    color: "white",
                    borderRadius: 12,
                    padding: 12,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 900 }}>#{driver.number} {driver.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>
                    {count ? `🔔 ${count} message${count === 1 ? "" : "s"}` : "No messages showing"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LeagueMessageCenter({ drivers = [], session: suppliedSession = null, mobile = false, go = null }) {
  const [session, setSession] = useState(() => suppliedSession || readBclMobileSession());
  const [driverNumber, setDriverNumber] = useState("");
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [filter, setFilter] = useState("inbox");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const activeDrivers = useMemo(() => {
    return dedupeDriversByNumber(drivers || [])
      .filter((driver) => !driver.retired && !isInactivePlaceholderDriver(driver))
      .sort((a, b) => Number(a.number || 9999) - Number(b.number || 9999));
  }, [drivers]);

  const currentUser = getCurrentUserFromSession(session || {});
  const isGuest = !session || currentUser.isGuest;

  useEffect(() => {
    if (suppliedSession) setSession(suppliedSession);
  }, [suppliedSession]);

  useEffect(() => {
    if (!session || currentUser.isGuest) return;
    loadMessages();
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, [session?.driverNumber, session?.role, session?.team, session?.manufacturer]);

  async function loginMessageCenter(event) {
    event?.preventDefault?.();
    setError("");
    setStatus("");

    const number = String(driverNumber || "").trim();
    const code = String(password || "").trim().toUpperCase();

    if (!number || !code) {
      setError("Select your driver and enter your password.");
      return;
    }

    setLoading(true);
    const { data, error: accessError } = await supabase
      .from("driver_access_codes")
      .select("*")
      .eq("driver_number", number)
      .limit(10);

    setLoading(false);

    if (accessError) {
      console.error("Could not verify message center login:", accessError);
      setError("Could not verify access. Check driver_access_codes select policy.");
      return;
    }

    const match = (data || []).find((row) => {
      const rowNumber = String(row.driver_number ?? row.car_number ?? "").trim();
      const possibleCodes = [row.code, row.access_code, row.password, row.driver_password]
        .map((value) => String(value ?? "").trim().toUpperCase())
        .filter(Boolean);
      return rowNumber === number && possibleCodes.includes(code) && row.active !== false;
    });

    const adminMatch = code === "BCLADMINPASSWORD2026";

    if (!match && !adminMatch) {
      setError("Invalid driver password.");
      return;
    }

    const rosterDriver = activeDrivers.find((driver) => String(driver.number) === number) || {};
    const authRow = match || {};
    const driverForRoles = {
      ...authRow,
      ...rosterDriver,
      name: rosterDriver.name || authRow.driver_name || authRow.name || `#${number}`,
      team: rosterDriver.team || authRow.team || "",
      manufacturer: rosterDriver.manufacturer || authRow.manufacturer || "",
    };
    const roleFlags = getBclRoleFlagsForDriver(driverForRoles, Boolean(adminMatch));
    const nextSession = {
      mode: "driver",
      role: roleFlags.role,
      driverId: rosterDriver.id || authRow.driver_id || authRow.id || null,
      driverNumber: number,
      driverName: driverForRoles.name,
      team: driverForRoles.team,
      manufacturer: driverForRoles.manufacturer,
      isAdmin: roleFlags.isAdmin,
      isOwner: roleFlags.isOwner,
      isDriver: true,
    };

    saveBclMobileSession(nextSession);
    setSession(nextSession);
    setPassword("");
    setStatus("Message Center unlocked.");
  }

  async function loadMessages() {
    if (!session || getCurrentUserFromSession(session).isGuest) return;
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("league_messages")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (loadError) {
      console.error("Could not load message center:", loadError);
      setError("Could not load messages. Check league_messages select policy.");
      setMessages([]);
      return;
    }

    const allowed = filterLeagueMessagesForSession(data || [], session);
    setMessages(allowed);
  }

  async function openMessage(message) {
    setSelectedMessage(message);
    setReplyBody("");
    setError("");
    setStatus("");

    if (!message?.id) return;

    if (!message.is_read && !message.read) {
      await supabase.from("league_messages").update({ is_read: true }).eq("id", message.id);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, is_read: true } : item));
    }

    const { data, error: replyError } = await supabase
      .from("league_message_replies")
      .select("*")
      .eq("message_id", message.id)
      .order("created_at", { ascending: true });

    if (!replyError) setReplies(data || []);
  }

  async function sendReply(event) {
    event?.preventDefault?.();
    setError("");
    setStatus("");

    if (!selectedMessage?.id) {
      setError("Open a message before replying.");
      return;
    }

    if (!replyBody.trim()) {
      setError("Type a reply first.");
      return;
    }

    const payload = {
      message_id: selectedMessage.id,
      sender_type: currentUser.isAdmin ? "admin" : currentUser.isOwner ? "owner" : "driver",
      sender_driver_id: String(session?.driverId || ""),
      sender_driver_number: String(session?.driverNumber || ""),
      sender_driver_name: session?.driverName || "",
      sender_team: session?.team || "",
      sender_manufacturer: session?.manufacturer || "",
      body: replyBody.trim(),
      created_at: new Date().toISOString(),
    };

    const { error: replyError } = await supabase.from("league_message_replies").insert([payload]);

    if (replyError) {
      console.error("Could not send reply:", replyError);
      setError("Could not send reply. Run the Message Center SQL and check RLS.");
      return;
    }

    setReplyBody("");
    setStatus("Reply sent.");
    await openMessage(selectedMessage);
  }

  function logout() {
    clearBclMobileSession();
    setSession(null);
    setSelectedMessage(null);
    setMessages([]);
    setReplies([]);
  }

  function getMessageBody(message) {
    return message.message || message.body || message.content || message.details || "";
  }

  function getMessageSender(message) {
    return message.sender_name || message.sender || message.sender_type || "League Office";
  }

  function getMessageTypeLabel(message) {
    const type = message.message_type || message.category || message.recipient_type || "message";
    return String(type).replace(/_/g, " ").toUpperCase();
  }

  const visibleMessages = useMemo(() => {
    const rows = messages || [];
    if (filter === "unread") return rows.filter((message) => !message.is_read && !message.read);
    if (filter === "archived") return rows.filter((message) => message.archived);
    if (filter === "team") return rows.filter((message) => normalizeMessageValue(message.recipient_type || message.target_type) === "team" || normalizeMessageValue(message.team || message.recipient_team) === normalizeMessageValue(session?.team));
    if (filter === "league") return rows.filter((message) => {
      const type = normalizeMessageValue(message.recipient_type || message.target_type || message.visibility || message.category);
      return ["league", "all", "everyone", "all_drivers", "drivers", "broadcast", "league_broadcast"].includes(type);
    });
    return rows.filter((message) => !message.archived);
  }, [messages, filter, session?.team]);

  if (!session || currentUser.isGuest) {
    return (
      <div style={mobile ? {} : appShellStyle}>
        <div style={mobile ? {} : { ...pageContainerStyle, maxWidth: 860 }}>
          <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #d4af37" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", letterSpacing: 1.4 }}>BUDWEISER CUP LEAGUE</div>
            <h1 style={{ margin: "6px 0", fontSize: mobile ? 28 : 34 }}>📬 Message Center</h1>
            <p style={{ margin: 0, opacity: 0.72, lineHeight: 1.5 }}>
              Log in once to view your official inbox. Drivers see their messages. Owners see owner/team messages. Admins see admin messages.
            </p>
          </div>

          <form onSubmit={loginMessageCenter} style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Open Message Center</h2>
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>DRIVER / ADMIN</div>
                <select value={driverNumber} onChange={(event) => setDriverNumber(event.target.value)} style={inputStyle}>
                  <option value="">Choose driver/admin</option>
                  {activeDrivers.map((driver) => (
                    <option key={driver.id || driver.number} value={driver.number}>#{driver.number} {driver.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>PASSWORD</div>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" style={inputStyle} />
              </div>
              <button type="submit" style={primaryButtonStyle} disabled={loading}>{loading ? "Opening..." : "Open Inbox"}</button>
            </div>
            {error && <div style={{ color: "#f87171", fontWeight: 900, marginTop: 12 }}>{error}</div>}
          </form>
        </div>
      </div>
    );
  }

  const mailboxLabel = currentUser.isAdmin
    ? "Admin Inbox"
    : currentUser.isOwner
      ? "Owner / Team Inbox"
      : currentUser.isManufacturer
        ? "Manufacturer Inbox"
        : "Driver Inbox";

  return (
    <div style={mobile ? {} : appShellStyle}>
      <div style={mobile ? {} : { ...pageContainerStyle, maxWidth: 1160 }}>
        <div style={{ ...sectionCardStyle, background: "linear-gradient(135deg, #17191f 0%, #101216 100%)", border: "1px solid #d4af37" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "#d4af37", letterSpacing: 1.4 }}>{mailboxLabel}</div>
              <h1 style={{ margin: "6px 0", fontSize: mobile ? 28 : 34 }}>📬 Message Center</h1>
              <p style={{ margin: 0, opacity: 0.72 }}>Signed in as #{session.driverNumber} {session.driverName}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={loadMessages} style={secondaryButtonStyle}>Refresh</button>
              <button type="button" onClick={logout} style={dangerButtonStyle}>Log Out</button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
          {[
            ["inbox", "Inbox"],
            ["unread", "Unread"],
            ["league", "League"],
            ...(currentUser.isOwner ? [["team", "Team"]] : []),
            ["archived", "Archived"],
          ].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setFilter(key)} style={filter === key ? activeHeaderButtonStyle : headerButtonStyle}>
              {label}
            </button>
          ))}
        </div>

        {status && <div style={{ color: "#4ade80", marginBottom: 12, fontWeight: 900 }}>{status}</div>}
        {error && <div style={{ color: "#f87171", marginBottom: 12, fontWeight: 900 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(320px, 0.9fr) minmax(360px, 1.1fr)", gap: 16, alignItems: "start" }}>
          <div style={sectionCardStyle}>
            <h2 style={{ marginTop: 0 }}>Inbox ({visibleMessages.length})</h2>
            {loading && <div style={{ opacity: 0.72 }}>Loading messages...</div>}
            {!loading && visibleMessages.length === 0 && <div style={{ opacity: 0.72 }}>No messages in this mailbox.</div>}
            <div style={{ display: "grid", gap: 10 }}>
              {visibleMessages.map((message) => {
                const unread = !message.is_read && !message.read;
                return (
                  <button
                    key={message.id}
                    type="button"
                    onClick={() => openMessage(message)}
                    style={{
                      textAlign: "left",
                      background: selectedMessage?.id === message.id ? "rgba(212,175,55,0.12)" : unread ? "rgba(239,68,68,0.10)" : "#0f1319",
                      border: selectedMessage?.id === message.id ? "1px solid #d4af37" : unread ? "1px solid rgba(239,68,68,0.55)" : "1px solid #313947",
                      color: "white",
                      borderRadius: 14,
                      padding: 14,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                      <strong>{unread ? "● " : ""}{message.subject || "No subject"}</strong>
                      <span style={{ fontSize: 10, opacity: 0.72 }}>{getMessageTypeLabel(message)}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 5 }}>From: {getMessageSender(message)}</div>
                    <div style={{ fontSize: 12, opacity: 0.62, marginTop: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {getMessageBody(message)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={sectionCardStyle}>
            {!selectedMessage ? (
              <div style={{ opacity: 0.72 }}>Select a message to read or reply.</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ margin: 0 }}>{selectedMessage.subject || "No subject"}</h2>
                    <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>From: {getMessageSender(selectedMessage)}</div>
                    <div style={{ opacity: 0.55, fontSize: 12, marginTop: 4 }}>{selectedMessage.created_at ? new Date(selectedMessage.created_at).toLocaleString() : ""}</div>
                  </div>
                  {mobile && <button type="button" onClick={() => setSelectedMessage(null)} style={secondaryButtonStyle}>Back</button>}
                </div>

                <div style={{ marginTop: 16, background: "#0f1319", border: "1px solid #2c3440", borderRadius: 14, padding: 16, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {getMessageBody(selectedMessage) || "No message body."}
                </div>

                <h3 style={{ marginBottom: 8 }}>Replies</h3>
                <div style={{ display: "grid", gap: 8 }}>
                  {replies.length === 0 && <div style={{ opacity: 0.65, fontSize: 13 }}>No replies yet.</div>}
                  {replies.map((reply) => (
                    <div key={reply.id} style={{ background: "#0f1319", border: "1px solid #313947", borderRadius: 14, padding: 12 }}>
                      <div style={{ fontWeight: 900 }}>{reply.sender_driver_name || reply.sender_type || "Reply"}</div>
                      <div style={{ opacity: 0.55, fontSize: 11, marginTop: 2 }}>{reply.created_at ? new Date(reply.created_at).toLocaleString() : ""}</div>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5, marginTop: 8 }}>{reply.body}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendReply} style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.72, marginBottom: 8 }}>REPLY</div>
                  <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={4} placeholder="Type your reply..." style={{ ...inputStyle, minHeight: 110 }} />
                  <button type="submit" style={{ ...primaryButtonStyle, marginTop: 10 }}>Send Reply</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getMessageBody(message) {
    return message.message || message.body || message.content || message.details || "";
  }

function getMessageSender(message) {
    return message.sender_name || message.sender || message.sender_type || "League Office";
  }

function getMessageTypeLabel(message) {
    const type = message.message_type || message.category || message.recipient_type || "message";
    return String(type).replace(/_/g, " ").toUpperCase();
  }

