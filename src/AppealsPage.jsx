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

    const channel = supabase
      .channel("appeals-live-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appeals",
        },
        () => {
          loadAppeals();
        }
      )
      .subscribe();

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
