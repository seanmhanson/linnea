"use client";

import { useState } from "react";
import UploadZone from "@/components/admin/UploadZone";
import type { UploadResult } from "@/src/mapper/upload";
import styles from "./page.module.css";

export default function UploadPage() {
  const [results, setResults] = useState<UploadResult[]>([]);

  return (
    <main className={styles["upload-container"]}>
      <h1 className={styles["upload-header"]}>Upload Observations</h1>
      <UploadZone
        onUploadComplete={(newResults) => setResults((prev) => [...prev, ...newResults])}
      />
      {results.length > 0 && (
        <section className={styles["upload-results"]}>
          <h2>Uploaded</h2>
          <ul className={styles["upload-results-list"]}>
            {results.map((r, i) => (
              <li key={i} className={styles["upload-results--list-item"]}>
                <a href={r.cloudinaryUrl} target="_blank" rel="noreferrer">
                  {r.cloudinaryUrl}
                </a>
                {r.extractedDate && (
                  <div className={styles["upload-results--date"]}>EXIF date: {r.extractedDate}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
