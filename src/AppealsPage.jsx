import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AppealsPage() {
  const [appeals, setAppeals] = useState([]);

  useEffect(() => {
    async function loadAppeals() {
      const { data, error } = await supabase
        .from("appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load appeals:", error);
        return;
      }

      setAppeals(data || []);
    }

    loadAppeals();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0c0f14",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          background: "#171b22",
          border: "1px solid #2c3440",
          borderRadius: 16,
          padding: 24,
        }}
      >
        <h1 style={{ marginTop: 0 }}>Appeals Review</h1>

        {appeals.length === 0 ? (
          <p style={{ opacity: 0.7 }}>No appeals submitted yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {appeals.map((appeal) => (
              <div
                key={appeal.id}
                style={{
                  background: "#10141b",
                  border: "1px solid #2d3643",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 6 }}>
                  {appeal.requester} — {appeal.track}
                </div>

                <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6 }}>
                  Lap {appeal.lap_number}
                </div>

                <div style={{ marginBottom: 10 }}>
                  {appeal.description}
                </div>

                <div style={{ marginBottom: 10 }}>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color:
                        appeal.status === "Open"
                          ? "#facc15"
                          : appeal.status === "Approved"
                          ? "#22c55e"
                          : "#ef4444",
                    }}
                  >
                    {appeal.status}
                  </span>
                </div>

                {appeal.evidence_url && (
                  <div style={{ marginBottom: 10 }}>
                    <video
                      src={appeal.evidence_url}
                      controls
                      style={{ width: "100%", maxHeight: 300 }}
                    />
                  </div>
                )}

                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  Submitted:{" "}
                  {new Date(appeal.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div>
      {/* your existing UI here */}
    </div>
  );
}
