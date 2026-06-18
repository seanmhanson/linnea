import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/react";

vi.mock("@/src/util/extractImageDate", () => ({
  extractImageDate: vi.fn(async () => null),
}));

vi.mock("@/src/util/stripImageMetadata", () => ({
  stripImageMetadata: vi.fn(async (file: File) => file),
}));

// subject
import UploadZone from "@/components/admin/UploadZone";
import { extractImageDate } from "@/src/util/extractImageDate";
import { stripImageMetadata } from "@/src/util/stripImageMetadata";

const mockFetch = vi.fn();
const longErrorMessage =
  "A significantly longer error message has occurred here without truncation or other UI handling, which may cause layout issues if not properly managed by the component's styles or structure.";

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
};

const mockExtractImageDate = vi.mocked(extractImageDate);
const mockStripImageMetadata = vi.mocked(stripImageMetadata);

describe("components/admin/UploadZone", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
    mockExtractImageDate.mockReset();
    mockStripImageMetadata.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  describe("when a file is selected via file input", () => {
    it("posts the file to /api/upload", async () => {
      mockExtractImageDate.mockResolvedValueOnce("2024-05-01T10:00:00.000Z");
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = makeFile();
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(mockExtractImageDate).toHaveBeenCalledWith(file);
      expect(mockStripImageMetadata).toHaveBeenCalledWith(file);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      expect((init.body as FormData).get("extractedDate")).toBe("2024-05-01T10:00:00.000Z");
    });

    it("calls onUploadComplete with the result", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile()] } });

      await waitFor(() => expect(onUploadComplete).toHaveBeenCalledWith([sampleResult]));
      expect(mockExtractImageDate).toHaveBeenCalledWith(expect.any(File));
      expect(mockStripImageMetadata).toHaveBeenCalledWith(expect.any(File));
    });

    it("shows done status after successful upload", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("cat.jpg")] } });

      await waitFor(() => expect(screen.getByText("done")).toBeTruthy());
    });

    it("renders file detail labels and selected file path", async () => {
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("my-photo.jpg")] } });

      await waitFor(() => expect(screen.getByText("my-photo.jpg")).toBeTruthy());
      expect(screen.getByText("File path")).toBeTruthy();
      expect(screen.getByText("Upload status")).toBeTruthy();
    });

    it("does not append extractedDate when no EXIF date is returned", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile()] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.body as FormData).get("extractedDate")).toBeNull();
    });
  });

  describe("when a file is dropped on the drop zone", () => {
    it("posts the file to /api/upload", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockReturnValueOnce(makeOkResponse(sampleResult));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const dropZone = screen.getByRole("button", { name: /upload images/i });
      const file = makeFile("dropped.jpg");
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(mockExtractImageDate).toHaveBeenCalledWith(file);
      expect(mockStripImageMetadata).toHaveBeenCalledWith(file);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
    });
  });

  describe("when the upload returns an error response", () => {
    it("shows error status with message", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockReturnValueOnce(makeErrorResponse(500, { error: "Upload failed" }));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("bad.jpg")] } });

      await waitFor(() => expect(screen.getByText(/Upload failed:\s*Upload failed/i)).toBeTruthy());
      expect(mockExtractImageDate).toHaveBeenCalledWith(expect.any(File));
      expect(mockStripImageMetadata).toHaveBeenCalledWith(expect.any(File));
    });

    it("shows long error messages returned by the API", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockReturnValueOnce(makeErrorResponse(500, { error: longErrorMessage }));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("bad-long.jpg")] } });

      await waitFor(() => {
        const status = screen.getByText(/Upload failed:/i);
        expect(status.textContent ?? "").toContain(longErrorMessage);
      });
    });

    it("does not call onUploadComplete when all files fail", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockReturnValueOnce(makeErrorResponse(500, { error: "Upload failed" }));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile()] } });

      await waitFor(() => screen.getByText(/Upload Failed/i));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(onUploadComplete).not.toHaveBeenCalled();
    });

    it("shows caught runtime errors and does not call onUploadComplete", async () => {
      mockExtractImageDate.mockResolvedValueOnce(null);
      mockFetch.mockRejectedValueOnce(new Error("Network down"));
      const onUploadComplete = vi.fn();
      render(<UploadZone onUploadComplete={onUploadComplete} />);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [makeFile("network.jpg")] } });

      await waitFor(() => expect(screen.getByText(/Upload failed:\s*Network down/i)).toBeTruthy());
      expect(onUploadComplete).not.toHaveBeenCalled();
    });
  });

  describe("when more than 8 files are selected", () => {
    it("only uploads the first 8 files", async () => {
      mockExtractImageDate.mockResolvedValue(null);
      mockFetch.mockImplementation(() => makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const files = Array.from({ length: 10 }, (_, i) => makeFile(`file${i}.jpg`));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(8));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(8);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(8);
    });
  });

  describe("when using keyboard interaction", () => {
    it("opens file picker on Enter key", () => {
      render(<UploadZone onUploadComplete={vi.fn()} />);

      const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
      const dropZone = screen.getByRole("button", { name: /upload images/i });
      fireEvent.keyDown(dropZone, { key: "Enter" });

      expect(clickSpy).toHaveBeenCalledTimes(1);
      clickSpy.mockRestore();
    });
  });

  describe("when maxFiles is provided", () => {
    it("shows custom maxFiles in helper text and caps uploads accordingly", async () => {
      mockExtractImageDate.mockResolvedValue(null);
      mockFetch.mockImplementation(() => makeOkResponse(sampleResult));
      render(<UploadZone onUploadComplete={vi.fn()} maxFiles={3} />);

      expect(screen.getByText("Up to 3 images")).toBeTruthy();

      const files = Array.from({ length: 5 }, (_, i) => makeFile(`custom${i}.jpg`));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(3);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(3);
    });
  });
});
