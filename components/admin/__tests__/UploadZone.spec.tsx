import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// subject
import UploadZone from "@/components/admin/UploadZone";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeFile(name = "photo.jpg", type = "image/jpeg"): File {
  return new File(["bytes"], name, { type });
}

function makeOkResponse(data: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function makeErrorResponse(status: number, body: object) {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

const sampleResult = {
  cloudinaryUrl: "https://res.cloudinary.com/test/image.jpg",
  extractedDate: null,
  extractedLat: null,
  extractedLng: null,
};

describe("components/admin/UploadZone", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("when a file is selected via file input", () => {
    it("posts the file to /api/upload", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = makeFile();
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
    });

    it("calls onUploadComplete with the result", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile()] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith([sampleResult]));
    });

    it("shows done status after successful upload", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("cat.jpg")] } });

      await waitFor(() => expect(screen.getByText("done")).toBeInTheDocument());
    });
  });

  describe("when a file is dropped on the drop zone", () => {
    it("posts the file to /api/upload", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const dropZone = screen.getByRole("button", { name: /upload images/i });
      const file = makeFile("dropped.jpg");
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
    });
  });

  describe("when the upload returns an error response", () => {
    it("shows error status with message", async () => {
      mockFetch.mockReturnValueOnce(makeErrorResponse(500, { error: "Upload failed" }));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("bad.jpg")] } });

      await waitFor(() => expect(screen.getByText("error: Upload failed")).toBeInTheDocument());
    });

    it("does not call onUploadComplete when all files fail", async () => {
      mockFetch.mockReturnValueOnce(makeErrorResponse(500, { error: "Upload failed" }));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile()] } });

      await waitFor(() => screen.getByText(/error/i));
      expect(onUploadComplete).not.toHaveBeenCalled();
    });
  });

  describe("when more than 8 files are selected", () => {
    it("only uploads the first 8 files", async () => {
      mockFetch.mockResolvedValue(makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const files = Array.from({ length: 10 }, (_, i) => makeFile(`file${i}.jpg`));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(8));
    });
  });
});
