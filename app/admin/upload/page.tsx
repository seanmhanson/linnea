"use client";

import { useState } from "react";
import UploadZone from "@/components/admin/UploadZone";
import type { UploadResult } from "@/src/mapper/upload";

export default function UploadPage() {
  const [results, setResults] = useState<UploadResult[]>([]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: 32 }}>
      <h1>Upload Observations</h1>
      <UploadZone
        onUploadComplete={(newResults) => setResults((prev) => [...prev, ...newResults])}
      />
      {results.length > 0 && (
        <section style={{ marginTop: 32 }}>
          <h2>Uploaded</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((r, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <a href={r.cloudinaryUrl} target="_blank" rel="noreferrer">
                  {r.cloudinaryUrl}
                </a>
                {r.extractedDate && (
                  <div style={{ fontSize: 12, color: "#666" }}>EXIF date: {r.extractedDate}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
