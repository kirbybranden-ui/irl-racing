import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "../lib/supabase";

const pageFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

export function IssueChatPanel({ issue, isAdmin = false, authorName = "Guest", authorNumber = "", drivers = [], onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedDriverKey, setSelectedDriverKey] = useState("");
  const scrollRef = useRef(null);

  const driversBySeries = drivers.reduce((groups, driver) => {
    const label = driver.seriesLabel || "Other";
    if (!groups[label]) groups[label] = [];
    groups[label].push(driver);
    return groups;
  }, {});

  const selectedDriver = drivers.find((d) => d.key === selectedDriverKey) || null;
  const effectiveAuthorName = selectedDriver ? selectedDriver.name : authorName;
  const effectiveAuthorNumber = selectedDriver ? selectedDriver.number : authorNumber;

  async function loadMessages(isInitialLoad = false) {
    if (isInitialLoad) setLoading(true);
    const { data, error } = await supabase
      .from("issue_comments")
      .select("*")
      .eq("issue_id", issue.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading issue comments:", error);
    } else {
      setMessages(data || []);
    }
    if (isInitialLoad) setLoading(false);
  }

  useEffect(() => {
    loadMessages(true);
    const interval = setInterval(() => loadMessages(false), 6000);
    return () => clearInterval(interval);
  }, [issue.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!draft.trim()) return;
    setSending(true);
    const { error } = await supabase.from("issue_comments").insert({
      issue_id: issue.id,
      author_name: effectiveAuthorName || (isAdmin ? "Admin" : "Guest"),
      author_number: effectiveAuthorNumber || null,
      is_admin: isAdmin,
      message: draft.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    } else {
      setDraft("");
      await loadMessages(false);
    }
    setSending(false);
  }

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
      zIndex: 1100,
      padding: 20,
      fontFamily: pageFont,
    }}>
      <div style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94))",
        border: "1px solid rgba(255,255,255,0.8)",
        borderRadius: 30,
        padding: "clamp(18px, 3.5vw, 26px)",
        maxWidth: 560,
        width: "100%",
        height: "min(640px, 84vh)",
        boxShadow: "0 30px 90px rgba(0,0,0,0.28)",
        color: "#1d1d1f",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "0 12px 26px rgba(0,122,255,0.26)",
              flexShrink: 0,
            }}>
              💬
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, opacity: 0.55, fontWeight: 1000, textTransform: "uppercase", letterSpacing: "0.06em" }}>Discussion</div>
              <div style={{ fontSize: 15, fontWeight: 1000, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{issue.title}</div>
            </div>
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

        {!isAdmin && drivers.length > 0 && (
          <div style={{
            marginBottom: 12,
            flexShrink: 0,
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 14,
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}>
            <div style={{ fontSize: 10.5, opacity: 0.55, fontWeight: 1000, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
              Chatting as
            </div>
            <select
              value={selectedDriverKey}
              onChange={(e) => setSelectedDriverKey(e.target.value)}
              style={{
                flex: 1,
                minWidth: 160,
                background: "rgba(255,255,255,0.8)",
                color: "#1d1d1f",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12.5,
                fontWeight: 800,
                fontFamily: pageFont,
              }}
            >
              <option value="">Guest / Prefer not to say</option>
              {Object.entries(driversBySeries).map(([seriesLabel, list]) => (
                <optgroup key={seriesLabel} label={seriesLabel}>
                  {list.map((driver) => (
                    <option key={driver.key} value={driver.key}>
                      #{driver.number} {driver.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}

        {/* Messages */}
        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            background: "rgba(0,0,0,0.03)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 18,
            padding: 14,
            marginBottom: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {loading ? (
            <div style={{ textAlign: "center", opacity: 0.6, fontWeight: 700, fontSize: 13 }}>Loading messages…</div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", opacity: 0.6, fontWeight: 700, fontSize: 13, margin: "auto" }}>
              No messages yet. Say hello 👋
            </div>
          ) : (
            (() => {
              // Group consecutive messages from the same sender, iMessage-style
              const groups = [];
              messages.forEach((msg) => {
                const last = groups[groups.length - 1];
                const sameSender = last && last.is_admin === msg.is_admin && last.author_name === msg.author_name;
                if (sameSender) {
                  last.items.push(msg);
                } else {
                  groups.push({ is_admin: msg.is_admin, author_name: msg.author_name, items: [msg] });
                }
              });

              return groups.map((group, gi) => {
                const mine = group.is_admin === isAdmin;
                const lastMsg = group.items[group.items.length - 1];
                return (
                  <div key={gi} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                    <div style={{ fontSize: 10.5, opacity: 0.55, fontWeight: 800, marginBottom: 4 }}>
                      {group.is_admin ? `🛠️ Admin${group.author_name && group.author_name !== "Admin" ? ` — ${group.author_name}` : ""}` : group.author_name}
                    </div>
                    {group.items.map((msg, idx) => {
                      const isLast = idx === group.items.length - 1;
                      return (
                        <div
                          key={msg.id}
                          style={{
                            maxWidth: "78%",
                            marginTop: idx === 0 ? 0 : 3,
                            background: mine ? "linear-gradient(135deg, #007aff 0%, #5856d6 100%)" : "rgba(255,255,255,0.9)",
                            color: mine ? "#ffffff" : "#1d1d1f",
                            border: mine ? "none" : "1px solid rgba(0,0,0,0.06)",
                            borderRadius: 16,
                            borderBottomRightRadius: mine && isLast ? 4 : 16,
                            borderBottomLeftRadius: !mine && isLast ? 4 : 16,
                            padding: "9px 13px",
                            fontSize: 13.5,
                            lineHeight: 1.45,
                            boxShadow: mine ? "0 8px 20px rgba(0,122,255,0.20)" : "0 4px 12px rgba(15,23,42,0.05)",
                            wordBreak: "break-word",
                          }}
                        >
                          {msg.message}
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 10, opacity: 0.42, fontWeight: 700, marginTop: 4 }}>
                      {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>

        {/* Composer */}
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !sending) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message…"
            style={{
              flex: 1,
              background: "rgba(255,255,255,0.75)",
              color: "#1d1d1f",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 999,
              padding: "12px 16px",
              fontSize: 14,
              fontFamily: pageFont,
              boxSizing: "border-box",
            }}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={sending || !draft.trim()}
            style={{
              border: 0,
              borderRadius: 999,
              padding: "12px 20px",
              background: "linear-gradient(135deg, #007aff 0%, #5856d6 100%)",
              color: "#ffffff",
              fontWeight: 1000,
              cursor: sending || !draft.trim() ? "default" : "pointer",
              opacity: sending || !draft.trim() ? 0.55 : 1,
              fontFamily: pageFont,
              whiteSpace: "nowrap",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
