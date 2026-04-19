import { useState } from "react";
import { supabase } from "./supabase";

export default function FilesPage() {
  const [file, setFile] = useState(null);

  const uploadFile = async () => {
    if (!file) return alert("Pick a file first");

    const filePath = `public/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from("league-files")
      .upload(filePath, file);

    if (error) {
      alert("Upload failed");
      console.error(error);
    } else {
      alert("Uploaded!");
    }
  };

  return (
    <div style={{ padding: 20, color: "white" }}>
      <h1>League Documents</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />

      <br /><br />

      <button onClick={uploadFile}>
        Upload File
      </button>
    </div>
  );
}
