import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import logo from "./assets/logo1.png";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("news")
        .select("*")
        .order("created_at", { ascending: false });

      setNews(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(circle at top, #18202b 0%, #0d1117 38%, #090c11 100%)",
      color: "white",
      fontFamily: "Arial"
    }}>
      
      {/* Header */}
      <div style={{
        padding: 20,
        borderBottom: "1px solid #2d3643",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <img src={logo} style={{ height: 40 }} />
        <h2>📰 League News</h2>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: 20 }}>
        
        {loading ? (
          <div>Loading...</div>
        ) : news.length === 0 ? (
          <div>No news yet.</div>
        ) : (
          news.map((post) => (
            <div key={post.id} style={{
              background: "#151a22",
              border: "1px solid #2d3643",
              borderRadius: 16,
              padding: 20,
              marginBottom: 16
            }}>
              <h2>{post.title}</h2>
              <p style={{ opacity: 0.7, fontSize: 12 }}>
                {new Date(post.created_at).toLocaleString()}
              </p>
              <p>{post.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
