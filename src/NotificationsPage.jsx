import { useCallback, useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

const inputStyle = {
  width: "100%",
  margin: "8px 0 16px",
  padding: "12px",
  borderRadius: 10,
  border: "1px solid #313947",
  background: "#0f1319",
  color: "white",
  boxSizing: "border-box",
};

const checkboxRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 14px",
  background: "#0f1319",
  border: "1px solid #2d3643",
  borderRadius: 12,
  marginBottom: 10,
  cursor: "pointer",
};

function formatEventDate(value) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatEntryFee(event) {
  const fee = Number(event?.entry_fee || 0);
  if (!event?.is_paid && fee <= 0) return "Free Entry";
  return `${fee.toLocaleString("en-US", { style: "currency", currency: "USD" })} Entry`;
}

function CommunityEventNotifications() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data, error: loadError } = await supabase
      .from("community_events")
      .select("id,name,description,event_type,status,visibility,max_drivers,entry_fee,is_paid,prize_pool,starts_at,registration_deadline,created_by,created_at")
      .eq("visibility", "public")
      .in("status", ["registration", "active"])
      .order("created_at", { ascending: false })
      .limit(20);

    if (loadError) {
      console.error("Community event notification load failed:", loadError);
      setError("Community events could not be loaded. Confirm the community_events table and RLS policy are installed.");
      setEvents([]);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel("community-event-notification-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_events" },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadEvents]);

  return (
    <section style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Community Events</div>
          <div style={{ opacity: 0.65, fontSize: 13, marginTop: 4 }}>New public events appear here automatically when a host posts them.</div>
        </div>
        <button
          type="button"
          onClick={() => (window.location.pathname = "/community-events")}
          style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 900, cursor: "pointer" }}
        >
          View All Events
        </button>
      </div>

      {loading && (
        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 16, padding: 18, opacity: 0.75 }}>
          Loading community events...
        </div>
      )}

      {!loading && error && (
        <div style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca", borderRadius: 16, padding: 18 }}>
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 16, padding: 18, opacity: 0.75 }}>
          No community events are open right now.
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => (window.location.pathname = `/community-events/${event.id}`)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "linear-gradient(135deg, #171d26 0%, #11161d 100%)",
                color: "white",
                border: "1px solid #2d3643",
                borderRadius: 18,
                padding: 18,
                cursor: "pointer",
                boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
                    <span style={{ background: "rgba(212,175,55,0.16)", color: "#f8d568", border: "1px solid rgba(212,175,55,0.35)", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900 }}>
                      NEW COMMUNITY EVENT
                    </span>
                    <span style={{ background: event.status === "active" ? "rgba(34,197,94,0.16)" : "rgba(59,130,246,0.16)", color: event.status === "active" ? "#86efac" : "#93c5fd", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>
                      {event.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.name}</div>
                  <div style={{ opacity: 0.68, fontSize: 13, marginTop: 5, lineHeight: 1.45 }}>
                    {event.description || "A new driver-hosted event is accepting participants."}
                  </div>
                </div>
                <div style={{ textAlign: "right", fontWeight: 900, color: "#f8d568" }}>{formatEntryFee(event)}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))", gap: 10, marginTop: 15 }}>
                <div style={{ background: "#0f1319", borderRadius: 12, padding: 11 }}>
                  <div style={{ opacity: 0.55, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Race Time</div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800 }}>{formatEventDate(event.starts_at)}</div>
                </div>
                <div style={{ background: "#0f1319", borderRadius: 12, padding: 11 }}>
                  <div style={{ opacity: 0.55, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Host</div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800 }}>{event.created_by || "BRL Driver"}</div>
                </div>
                <div style={{ background: "#0f1319", borderRadius: 12, padding: 11 }}>
                  <div style={{ opacity: 0.55, fontSize: 10, fontWeight: 900, textTransform: "uppercase" }}>Field Limit</div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 800 }}>{event.max_drivers || 24} drivers</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default function NotificationsPage() {
  const [form, setForm] = useState({
    driver_number: "",
    driver_name: "",
    phone_or_email: "",
    notify_race_results: true,
    notify_news: true,
    notify_streams: true,
    notify_pre_race: true,
    notify_post_race: true,
    notify_community_events: true,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submitSignup(e) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      ...form,
      driver_number: String(form.driver_number).trim(),
      driver_name: String(form.driver_name).trim(),
      phone_or_email: String(form.phone_or_email).trim(),
    };

    const { error } = await supabase.from("notification_signups").insert([payload]);
    setSubmitting(false);

    if (error) {
      console.error("Notification signup failed:", error);
      alert("Signup failed. Run the included notification migration, then confirm the notification_signups RLS policy allows inserts.");
      return;
    }

    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)", color: "white", fontFamily: "Arial, sans-serif" }}>
      <div style={{ background: "linear-gradient(135deg, #1a1f27 0%, #10141b 100%)", borderBottom: "3px solid #d4af37", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={logo} alt="League Logo" style={{ height: 48 }} />
          <div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Notifications</div>
            <div style={{ fontSize: 13, opacity: 0.65 }}>Community events and Budweiser Racing League alerts</div>
          </div>
        </div>

        <button onClick={() => (window.location.pathname = "/standings")} style={{ background: "#d4af37", color: "#111", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 900, cursor: "pointer" }}>
          Back to Standings
        </button>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
        <CommunityEventNotifications />

        {submitted ? (
          <div style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 34, textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ margin: 0 }}>You’re signed up</h2>
            <p style={{ opacity: 0.75 }}>Your notification preferences were saved.</p>
            <button onClick={() => (window.location.pathname = "/community-events")} style={{ marginTop: 14, background: "#d4af37", color: "#111", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }}>
              Browse Community Events
            </button>
          </div>
        ) : (
          <form onSubmit={submitSignup} style={{ background: "#151a22", border: "1px solid #2d3643", borderRadius: 20, padding: 24, boxShadow: "0 14px 34px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 6 }}>Notification Signup</div>
            <div style={{ opacity: 0.65, fontSize: 13, marginBottom: 20 }}>Choose the alerts you want to receive outside the app.</div>

            <label style={{ fontWeight: 800 }}>Driver Number</label>
            <input value={form.driver_number} onChange={(e) => updateField("driver_number", e.target.value)} required style={inputStyle} placeholder="42" />

            <label style={{ fontWeight: 800 }}>Driver Name</label>
            <input value={form.driver_name} onChange={(e) => updateField("driver_name", e.target.value)} required style={inputStyle} placeholder="Driver name" />

            <label style={{ fontWeight: 800 }}>Email or Phone</label>
            <input value={form.phone_or_email} onChange={(e) => updateField("phone_or_email", e.target.value)} required style={inputStyle} placeholder="name@email.com or phone number" />

            <div style={{ fontSize: 22, fontWeight: 900, margin: "10px 0 12px" }}>Alert Preferences</div>

            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_community_events} onChange={(e) => updateField("notify_community_events", e.target.checked)} />🏆 New community events</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_race_results} onChange={(e) => updateField("notify_race_results", e.target.checked)} />🏁 Race results</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_news} onChange={(e) => updateField("notify_news", e.target.checked)} />📰 News updates</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_streams} onChange={(e) => updateField("notify_streams", e.target.checked)} />📡 Live streams</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_pre_race} onChange={(e) => updateField("notify_pre_race", e.target.checked)} />🎤 Pre-race interviews</label>
            <label style={checkboxRowStyle}><input type="checkbox" checked={form.notify_post_race} onChange={(e) => updateField("notify_post_race", e.target.checked)} />🎙️ Post-race interviews</label>

            <button type="submit" disabled={submitting} style={{ marginTop: 18, width: "100%", background: submitting ? "#6b7280" : "#d4af37", color: "#111", border: "none", borderRadius: 14, padding: 15, fontWeight: 900, cursor: submitting ? "not-allowed" : "pointer", fontSize: 15 }}>
              {submitting ? "Saving..." : "Save Notification Preferences"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
