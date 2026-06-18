"use client";

import { useState } from "react";
import classnames from "classnames";
import UploadZone from "@/components/admin/UploadZone";
import type { UploadResult } from "@/src/mapper/upload";
import { useBreakpoint } from "@/src/util/useBreakpoint";
import styles from "./page.module.scss";

function toSquareThumbnailUrl(cloudinaryUrl: string, size: number): string {
  const marker = "/upload/";
  const insertAt = cloudinaryUrl.indexOf(marker);

  if (insertAt === -1) {
    return cloudinaryUrl;
  }

  const transformation = `c_fill,g_auto,h_${size},w_${size},f_auto,q_auto`;
  return `${cloudinaryUrl.slice(0, insertAt + marker.length)}${transformation}/${cloudinaryUrl.slice(insertAt + marker.length)}`;
}

export default function UploadPage() {
  const { isSmallViewport } = useBreakpoint();
  const [results, setResults] = useState<UploadResult[]>([]);
  const thumbnailSize = isSmallViewport ? 220 : 150;

  return (
    <main className={styles["upload-container"]}>
      <h1 className={styles["upload-header"]}>Upload Observations</h1>
      <UploadZone
        onUploadComplete={(newResults) => setResults((prev) => [...prev, ...newResults])}
      />
      {results.length > 0 && (
        <section className={styles["upload-results"]}>
          <h2 className={styles["upload-header"]}>Uploaded</h2>
          <ul
            className={classnames(styles["upload-results-list"], {
              [styles["upload-results-list--single-column"]]: isSmallViewport,
            })}
          >
            {results.map((r, i) => (
              <li key={i} className={styles["upload-results--list-item"]}>
                <a
                  className={styles["upload-results--list-link"]}
                  href={r.cloudinaryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className={classnames(styles["upload-results--thumbnail"], {
                      [styles["upload-results--thumbnail__small-viewport"]]: isSmallViewport,
                    })}
                    src={toSquareThumbnailUrl(r.cloudinaryUrl, thumbnailSize)}
                    alt={`Uploaded observation ${i + 1}`}
                    loading="lazy"
                    width={thumbnailSize}
                    height={thumbnailSize}
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
