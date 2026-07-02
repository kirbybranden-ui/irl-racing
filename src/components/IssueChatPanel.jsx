import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

const pageFont = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif";

export function IssueChatPanel({ issue, isAdmin = false, authorName = "Guest", authorNumber = "", onClose }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

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
      author_name: authorName || (isAdmin ? "Admin" : "Guest"),
      author_number: authorNumber || null,
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

  return (
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
            messages.map((msg) => {
              const mine = msg.is_admin === isAdmin;
              return (
                <div key={msg.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "78%" }}>
                    <div style={{ fontSize: 10.5, opacity: 0.55, fontWeight: 800, marginBottom: 3, textAlign: mine ? "right" : "left" }}>
                      {msg.is_admin ? `🛠️ Admin${msg.author_name && msg.author_name !== "Admin" ? ` — ${msg.author_name}` : ""}` : msg.author_name}
                    </div>
                    <div style={{
                      background: mine ? "linear-gradient(135deg, #007aff 0%, #5856d6 100%)" : "rgba(255,255,255,0.9)",
                      color: mine ? "#ffffff" : "#1d1d1f",
                      border: mine ? "none" : "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 16,
                      borderBottomRightRadius: mine ? 4 : 16,
                      borderBottomLeftRadius: mine ? 16 : 4,
                      padding: "9px 13px",
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      boxShadow: mine ? "0 8px 20px rgba(0,122,255,0.20)" : "0 4px 12px rgba(15,23,42,0.05)",
                      wordBreak: "break-word",
                    }}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              );
            })
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
    </div>
  );
}
