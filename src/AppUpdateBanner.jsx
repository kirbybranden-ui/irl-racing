import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";

export default function AppUpdateBanner({ page = "all" }) {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    async function loadBanner() {
      const { data } = await supabase
        .from("app_update_banners")
        .select("*")
        .in("page", ["all", page])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setBanner(data);
    }

    loadBanner();
  }, [page]);

  if (!banner) return null;

  return (
    <div
      style={{
        background: "linear-gradient(90deg, #d4af37, #facc15)",
        color: "#111",
        borderRadius: 16,
        padding: "14px 20px",
        marginBottom: 20,
        fontWeight: 800,
        fontSize: 14,
        boxShadow: "0 10px 30px rgba(212,175,55,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      🚨 {banner.message}
    </div>
  );
}
