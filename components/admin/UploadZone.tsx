"use client";

import { useRef, useState } from "react";
import type { UploadResult } from "@/src/mapper/upload";

type FileStatus = "idle" | "uploading" | "done" | "error";

type FileEntry = {
  file: File;
  status: FileStatus;
  error?: string;
};

type Props = {
  onUploadComplete: (results: UploadResult[]) => void;
};

const MAX_FILES = 8;

export default function UploadZone({ onUploadComplete }: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function updateEntry(index: number, patch: Partial<FileEntry>) {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  }

  async function uploadFiles(files: File[]) {
    const capped = files.slice(0, MAX_FILES);
    const initial: FileEntry[] = capped.map((file) => ({ file, status: "idle" }));
    setEntries(initial);

    const results: UploadResult[] = [];

    for (let i = 0; i < capped.length; i++) {
      updateEntry(i, { status: "uploading" });
      const formData = new FormData();
      formData.append("file", capped[i]);

      try {
        const response = await fetch("/api/upload", { method: "POST", body: formData });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          updateEntry(i, { status: "error", error: body.error ?? "Upload failed" });
        } else {
          const result: UploadResult = await response.json();
          updateEntry(i, { status: "done" });
          results.push(result);
        }
      } catch {
        updateEntry(i, { status: "error", error: "Network error" });
      }
    }

    if (results.length > 0) {
      onUploadComplete(results);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        aria-label="Upload images"
        style={{
          border: `2px dashed ${dragOver ? "#0070f3" : "#ccc"}`,
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <p>Drag and drop images here, or click to select</p>
        <p style={{ fontSize: 12, color: "#666" }}>Up to {MAX_FILES} images</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.currentTarget.value = "";
        }}
      />
      {entries.length > 0 && (
        <ul style={{ marginTop: 16, listStyle: "none", padding: 0 }}>
          {entries.map(({ file, status, error }, i) => (
            <li key={i} style={{ marginBottom: 4 }}>
              <span>{file.name}</span>
              <span style={{ marginLeft: 8, color: status === "error" ? "red" : "#666" }}>
                {status === "error" ? `error: ${error}` : status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
