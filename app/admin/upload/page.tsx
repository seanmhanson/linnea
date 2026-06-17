"use client";

import { useState } from "react";
import UploadZone from "@/components/admin/UploadZone";
import type { UploadResult } from "@/src/mapper/upload";
import styles from "./page.module.scss";

function toSquareThumbnailUrl(cloudinaryUrl: string): string {
  const marker = "/upload/";
  const insertAt = cloudinaryUrl.indexOf(marker);

  if (insertAt === -1) {
    return cloudinaryUrl;
  }

  const transformation = "c_fill,g_auto,h_150,w_150,f_auto,q_auto";
  return `${cloudinaryUrl.slice(0, insertAt + marker.length)}${transformation}/${cloudinaryUrl.slice(insertAt + marker.length)}`;
}

const temporaryFixtures: UploadResult[] = [
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651543/nvpnkvjszmqkb40a0jwp.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651584/wmjvky1gafuqwxonuq6s.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651597/xjh7bqzevmc91knofh2l.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651543/nvpnkvjszmqkb40a0jwp.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651584/wmjvky1gafuqwxonuq6s.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651597/xjh7bqzevmc91knofh2l.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651584/wmjvky1gafuqwxonuq6s.png",
    extractedDate: null,
  },
  {
    cloudinaryUrl:
      "https://res.cloudinary.com/dynzu3y3k/image/upload/v1781651597/xjh7bqzevmc91knofh2l.png",
    extractedDate: null,
  },
];

export default function UploadPage() {
  const [results, setResults] = useState<UploadResult[]>(temporaryFixtures);

  return (
    <main className={styles["upload-container"]}>
      <h1 className={styles["upload-header"]}>Upload Observations</h1>
      <UploadZone
        onUploadComplete={(newResults) => setResults((prev) => [...prev, ...newResults])}
      />
      {results.length > 0 && (
        <section className={styles["upload-results"]}>
          <h2 className={styles["upload-header"]}>Uploaded</h2>
          <ul className={styles["upload-results-list"]}>
            {results.map((r, i) => (
              <li key={i} className={styles["upload-results--list-item"]}>
                <a
                  className={styles["upload-results--list-link"]}
                  href={r.cloudinaryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className={styles["upload-results--thumbnail"]}
                    src={toSquareThumbnailUrl(r.cloudinaryUrl)}
                    alt={`Uploaded observation ${i + 1}`}
                    loading="lazy"
                    width={150}
                    height={150}
                  />
                  full resolution
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
