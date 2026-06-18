"use client";

import { useRef, useState } from "react";
import type { DragEvent, KeyboardEvent } from "react";
import classnames from "classnames";
import type { UploadResult } from "@/src/mapper/upload";
import { extractImageDate } from "@/src/util/extractImageDate";
import { stripImageMetadata } from "@/src/util/stripImageMetadata";
import styles from "./UploadZone.module.scss";

type FileStatus = "waiting" | "uploading" | "done" | "error";

type FileEntry = {
  file: File;
  status: FileStatus;
  error?: string;
};

export type UploadZoneProps = {
  onUploadComplete: (results: UploadResult[]) => void;
  maxFiles?: number;
};

export default function UploadZone({ onUploadComplete, maxFiles = 8 }: UploadZoneProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateEntry(index: number, patch: Partial<FileEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  async function uploadFiles(files: File[]) {
    const capped = files.slice(0, maxFiles);
    const initial: FileEntry[] = capped.map((file) => ({ file, status: "waiting" }));
    setEntries(initial);

    const results: UploadResult[] = [];

    setIsUploading(true);
    for (let i = 0; i < capped.length; i++) {
      updateEntry(i, { status: "uploading" });
      const formData = new FormData();

      try {
        const extractedDate = await extractImageDate(capped[i]);
        const strippedImage = await stripImageMetadata(capped[i]);
        formData.append("file", strippedImage, capped[i].name);
        if (extractedDate) {
          formData.append("extractedDate", extractedDate);
        }
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          updateEntry(i, { status: "error", error: body.error ?? "Upload failed" });
        } else {
          const result: UploadResult = await response.json();
          updateEntry(i, { status: "done" });
          results.push(result);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed";
        updateEntry(i, { status: "error", error: message });
      }
    }

    if (results.length === capped.length) {
      onUploadComplete(results);
    }
    setIsUploading(false);
  }

  /**
   *  Input event and file upload handlers
   */

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFiles(e.target.files);
    e.currentTarget.value = "";
  }

  /**
   *  Drag/Drop area & input event handlers
   */

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleClick() {
    inputRef.current?.click();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  const fileListItem = ({ file, status, error }: FileEntry, i: number) => {
    const errorStatus = error ? (
      <>
        Upload failed:
        {error && error?.length > 40 ? <br /> : <> </>}
        {error}
      </>
    ) : (
      "Upload failed"
    );
    const statusText = status === "error" ? errorStatus : status;
    return (
      <li key={i} className={styles["upload-zone--list-item"]}>
        <span className={styles["upload-zone--label"]}>File path</span>
        <span
          className={classnames(styles["upload-zone--path"], {
            [styles["upload-zone--path__done"]]: status === "done",
            [styles["upload-zone--path__error"]]: status === "error",
            [styles["upload-zone--path__active"]]: status === "uploading",
          })}
        >
          {file.name}
        </span>

        <span className={styles["upload-zone--label"]}>Upload status</span>
        <span
          className={classnames(styles["upload-zone--status"], {
            [styles["upload-zone--status__done"]]: status === "done",
            [styles["upload-zone--status__error"]]: status === "error",
            [styles["upload-zone--status__active"]]: status === "uploading",
          })}
        >
          {statusText}
        </span>
      </li>
    );
  };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        className={classnames(styles["upload-zone"], {
          [styles["upload-zone__drag-over"]]: dragOver,
          [styles["upload-zone__disabled"]]: isUploading,
        })}
      >
        <p>Drag and drop images here, or click to select</p>
        <p className={styles["upload-zone--subtext"]}>Up to {maxFiles} images</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className={styles["upload-zone--input"]}
        onChange={onInputChange}
        multiple
      />
      {entries.length > 0 && (
        <ul className={styles["upload-zone--list"]}>
          {entries.map(({ file, status, error }, i) => fileListItem({ file, status, error }, i))}
        </ul>
      )}
    </div>
  );
}
