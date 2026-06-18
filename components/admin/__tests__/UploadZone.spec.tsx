import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/react";

// mocks
vi.mock("@/src/util/extractImageDate", () => ({
  extractImageDate: vi.fn(async () => null),
}));

vi.mock("@/src/util/stripImageMetadata", () => ({
  stripImageMetadata: vi.fn(async (file: File) => file),
}));

import { extractImageDate } from "@/src/util/extractImageDate";
import { stripImageMetadata } from "@/src/util/stripImageMetadata";
import * as fetchUtils from "@/src/testUtils/fetchResponses";
import { deferred } from "@/src/testUtils/deferred";
import type { PromiseOrValue } from "@/src/testUtils/fetchResponses";
import type { UploadZoneProps } from "@/components/admin/UploadZone";

// subject
import UploadZone from "@/components/admin/UploadZone";

// fixture data & fixture helpers
function makeFile(name = "photo.jpg", type = "image/jpeg"): File {
  return new File(["bytes"], name, { type });
}

const longErrorMessage =
  "A significantly longer error message has occurred here without truncation or other UI handling," +
  " which may cause layout issues if not properly managed by the component's styles or structure.";

const fixtureResult = {
  cloudinaryUrl: "https://res.cloudinary.com/test/image.jpg",
  extractedDate: null,
};
const fixtureSuccessResponse = fetchUtils.get200Response(fixtureResult);
const fixtureErrorResponse = fetchUtils.get400Response("Upload failed");
const fixtureLongErrorResponse = fetchUtils.get400Response(longErrorMessage);
const fixtureFile = makeFile();

describe("components/admin/UploadZone", () => {
  const mockFetch = vi.fn();
  const mockExtractImageDate = vi.mocked(extractImageDate);
  const mockStripImageMetadata = vi.mocked(stripImageMetadata);
  const onClickSpy = vi.spyOn(HTMLInputElement.prototype, "click");
  const onUploadCompleteSpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetAllMocks();
    cleanup();
  });

  function setupFetchMock({
    response = fixtureSuccessResponse,
    error,
  }: { response?: Promise<Response>; error?: Error } = {}) {
    if (error) {
      mockFetch.mockRejectedValue(error);
    } else {
      mockFetch.mockReturnValue(response);
    }
  }

  function setupExtractDateMock(extractedDate: PromiseOrValue<string | null>) {
    if (extractedDate instanceof Promise) {
      mockExtractImageDate.mockReturnValue(extractedDate);
    } else {
      mockExtractImageDate.mockResolvedValue(extractedDate);
    }
  }

  function setupStripMetadataMock(strippedFile: PromiseOrValue<File>) {
    if (strippedFile instanceof Promise) {
      mockStripImageMetadata.mockReturnValue(strippedFile);
    } else {
      mockStripImageMetadata.mockResolvedValue(strippedFile);
    }
  }

  function useDefaultMocks() {
    setupFetchMock();
    setupExtractDateMock(null);
    setupStripMetadataMock(fixtureFile);
  }

  function renderSubject(overrides: Partial<UploadZoneProps> = {}) {
    return render(<UploadZone onUploadComplete={onUploadCompleteSpy} {...overrides} />);
  }

  function triggerFileInputChange(files: File[] = [fixtureFile]) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });
  }

  describe("when a file is selected via file input", () => {
    it("extracts and strips metadata prior to upload", async () => {
      const extractDeferred = deferred<string>();
      const stripDeferred = deferred<File>();

      setupFetchMock();
      setupExtractDateMock(extractDeferred.promise);
      setupStripMetadataMock(stripDeferred.promise);

      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(mockExtractImageDate).toHaveBeenCalledTimes(1));
      expect(mockStripImageMetadata).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();

      extractDeferred.resolve("2024-05-01T10:00:00.000Z");

      await waitFor(() => expect(mockStripImageMetadata).toHaveBeenCalledTimes(1));
      expect(mockFetch).not.toHaveBeenCalled();

      stripDeferred.resolve(fixtureFile);

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    });

    it("posts the file to /api/upload", async () => {
      const extractedDate = "2024-05-01T10:00:00.000Z";

      setupFetchMock();
      setupExtractDateMock(extractedDate);
      setupStripMetadataMock(fixtureFile);

      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(mockExtractImageDate).toHaveBeenCalledWith(fixtureFile);
      expect(mockStripImageMetadata).toHaveBeenCalledWith(fixtureFile);

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
      expect(init.method).toBe("POST");
      expect(init.body).toBeInstanceOf(FormData);
      expect((init.body as FormData).get("extractedDate")).toBe("2024-05-01T10:00:00.000Z");
    });

    it("calls onUploadComplete with the result", async () => {
      useDefaultMocks();
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(onUploadCompleteSpy).toHaveBeenCalledWith([fixtureResult]));
      expect(onUploadCompleteSpy).toHaveBeenCalledTimes(1);
      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(mockExtractImageDate).toHaveBeenCalledWith(expect.any(File));
      expect(mockStripImageMetadata).toHaveBeenCalledWith(expect.any(File));
    });

    it("shows done status after successful upload", async () => {
      useDefaultMocks();
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(screen.getByText("done")).toBeTruthy());
    });

    it("renders file detail labels and selected file path", async () => {
      useDefaultMocks();
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(screen.getByText("photo.jpg")).toBeTruthy());
      expect(screen.getByText("File path")).toBeTruthy();
      expect(screen.getByText("Upload status")).toBeTruthy();
    });

    it("does not append extractedDate when no EXIF date is returned", async () => {
      useDefaultMocks();
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect((init.body as FormData).get("extractedDate")).toBeNull();
    });
  });

  describe("when a file is dropped on the drop zone", () => {
    it("posts the file to /api/upload", async () => {
      useDefaultMocks();
      renderSubject();

      const dropZone = screen.getByRole("button", { name: /upload images/i });
      const file = makeFile("dropped.jpg");
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(mockExtractImageDate).toHaveBeenCalledWith(file);
      expect(mockStripImageMetadata).toHaveBeenCalledWith(file);

      const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe("/api/upload");
    });
  });

  describe("when the upload returns an error response", () => {
    it("shows error status with message", async () => {
      setupFetchMock({ response: fixtureErrorResponse });
      setupExtractDateMock("2024-05-01T10:00:00.000Z");
      setupStripMetadataMock(fixtureFile);
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(screen.getByText(/Upload failed:\s*Upload failed/i)).toBeTruthy());
      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(mockExtractImageDate).toHaveBeenCalledWith(expect.any(File));
      expect(mockStripImageMetadata).toHaveBeenCalledWith(expect.any(File));
    });

    it("shows long error messages returned by the API", async () => {
      setupFetchMock({ response: fixtureLongErrorResponse });
      setupExtractDateMock("2024-05-01T10:00:00.000Z");
      setupStripMetadataMock(fixtureFile);
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => {
        const status = screen.getByText(/Upload failed:/i);
        expect(status.textContent ?? "").toContain(longErrorMessage);
      });
    });

    it("does not call onUploadComplete when all files fail", async () => {
      setupFetchMock({ response: fixtureErrorResponse });
      setupExtractDateMock("2024-05-01T10:00:00.000Z");
      setupStripMetadataMock(fixtureFile);
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => screen.getByText(/Upload Failed/i));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(1);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(1);
      expect(onUploadCompleteSpy).not.toHaveBeenCalled();
    });

    it("shows caught runtime errors and does not call onUploadComplete", async () => {
      setupFetchMock({ error: new Error("Network down") });
      setupExtractDateMock("2024-05-01T10:00:00.000Z");
      setupStripMetadataMock(fixtureFile);
      renderSubject();
      triggerFileInputChange();

      await waitFor(() => expect(screen.getByText(/Upload failed:\s*Network down/i)).toBeTruthy());
      expect(onUploadCompleteSpy).not.toHaveBeenCalled();
    });
  });

  describe("when more than 8 files are selected", () => {
    it("only uploads the first 8 files", async () => {
      useDefaultMocks();
      renderSubject();

      const files = Array.from({ length: 10 }, (_, i) => makeFile(`file${i}.jpg`));
      triggerFileInputChange(files);

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(8));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(8);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(8);
    });
  });

  describe("when using keyboard interaction", () => {
    it("opens file picker on Enter key", () => {
      useDefaultMocks();
      renderSubject();

      const dropZone = screen.getByRole("button", { name: /upload images/i });
      fireEvent.keyDown(dropZone, { key: "Enter" });

      expect(onClickSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("when maxFiles is provided", () => {
    const maxFiles = 3;

    it("shows custom maxFiles in helper text and caps uploads accordingly", async () => {
      useDefaultMocks();
      renderSubject({ maxFiles });

      expect(screen.getByText(`Up to ${maxFiles} images`)).toBeTruthy();
    });

    it("calls to fetch with the capped number of files when maxFiles is set", async () => {
      const files = Array.from({ length: 5 }, (_, i) => makeFile(`test${i}.jpg`));

      useDefaultMocks();
      renderSubject({ maxFiles });
      triggerFileInputChange(files);

      await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(maxFiles));
      expect(mockExtractImageDate).toHaveBeenCalledTimes(maxFiles);
      expect(mockStripImageMetadata).toHaveBeenCalledTimes(maxFiles);
    });
  });
});
