import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function photoUrl(media) {
  const url = String(media?.video_url || "");
  const path = String(media?.file_path || "");
  if (!/^https:\/\//i.test(url)) return "";
  return /\.(?:png|jpe?g|webp|gif|avif)(?:[?#]|$)/i.test(path || url) ? url : "";
}

// Uses BRL's existing Featured Media publisher; no new table or public write endpoint.
export default function HomepageFeaturedPhoto({ media, loadFromDatabase = false }) {
  const [loadedMedia, setLoadedMedia] = useState(null);
  useEffect(() => {
    if (!loadFromDatabase) return undefined;
    let mounted = true;
    async function load() {
      const { data, error } = await supabase.from("featured_video")
        .select("title,description,video_url,file_path")
        .eq("series", "cup")
        .order("uploaded_at", { ascending: false }).limit(1).maybeSingle();
      if (mounted && !error) setLoadedMedia(data);
    }
    load();
    return () => { mounted = false; };
  }, [loadFromDatabase]);
  const featured = loadFromDatabase ? loadedMedia : media;
  const url = photoUrl(featured);
  if (!url) return null;
  return (
    <section aria-label="Featured league photograph" style={{ margin: "18px 0 24px", borderTop: "3px solid #d71920", paddingTop: 15 }}>
      <div style={{ fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b91c1c", fontSize: 11 }}>BRL / Featured Story</div>
      <h2 style={{ color: "#141519", fontSize: "clamp(22px,4vw,36px)", fontWeight: 950, margin: "7px 0 12px", lineHeight: 1.1, letterSpacing: "-0.03em" }}>
        {featured.title || "League Spotlight"}
      </h2>
      <img src={url} alt={featured.title || "BRL featured photograph"} loading="eager" style={{ display: "block", width: "100%", maxHeight: 630, objectFit: "contain", background: "#101116" }} />
      {featured.description && <p style={{ fontSize: 14, color: "#40434b", lineHeight: 1.5, margin: "11px 0 0" }}>{featured.description}</p>}
    </section>
  );
}
