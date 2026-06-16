import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("exifr", () => ({
  default: {
    parse: vi.fn(),
  },
}));

vi.mock("sharp", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/cloudinary", () => ({
  uploadImage: vi.fn(),
}));

// subject
import { processUpload } from "@/src/controller/UploadController";
import exifr from "exifr";
import sharp from "sharp";
import { uploadImage } from "@/lib/cloudinary";

const mockExifrParse = vi.mocked(exifr.parse);
const mockSharp = vi.mocked(sharp);
const mockUploadImage = vi.mocked(uploadImage);

const fakeBuffer = Buffer.from("fake-image");
const fakeStrippedBuffer = Buffer.from("stripped-image");
const fakeCloudinaryUrl = "https://res.cloudinary.com/test/image.jpg";

function makeSharpMock(format = "jpeg") {
  return {
    toBuffer: vi.fn().mockResolvedValue({
      data: fakeStrippedBuffer,
      info: { format },
    }),
  };
}

describe("src/controller/UploadController", () => {
  beforeEach(() => {
    mockExifrParse.mockReset();
    mockSharp.mockReset();
    mockUploadImage.mockReset();
    mockUploadImage.mockResolvedValue(fakeCloudinaryUrl);
  });

  describe("#processUpload", () => {
    describe("when EXIF data is present", () => {
      it("returns cloudinaryUrl, extractedDate, extractedLat, and extractedLng", async () => {
        const date = new Date("2024-05-01T10:00:00Z");
        mockExifrParse.mockResolvedValueOnce({
          DateTimeOriginal: date,
          latitude: 40.7128,
          longitude: -74.006,
        });
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);

        const result = await processUpload(fakeBuffer);

        expect(result).toEqual({
          cloudinaryUrl: fakeCloudinaryUrl,
          extractedDate: date,
          extractedLat: 40.7128,
          extractedLng: -74.006,
        });
      });
    });

    describe("when no EXIF data is present", () => {
      it("returns null for date, lat, and lng", async () => {
        mockExifrParse.mockResolvedValueOnce(null);
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);

        const result = await processUpload(fakeBuffer);

        expect(result).toEqual({
          cloudinaryUrl: fakeCloudinaryUrl,
          extractedDate: null,
          extractedLat: null,
          extractedLng: null,
        });
      });
    });

    describe("when EXIF parsing throws", () => {
      it("returns null for date, lat, and lng and continues", async () => {
        mockExifrParse.mockRejectedValueOnce(new Error("EXIF parse error"));
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);

        const result = await processUpload(fakeBuffer);

        expect(result).toEqual({
          cloudinaryUrl: fakeCloudinaryUrl,
          extractedDate: null,
          extractedLat: null,
          extractedLng: null,
        });
      });
    });

    describe("when sharp throws", () => {
      it("propagates the error", async () => {
        mockExifrParse.mockResolvedValueOnce(null);
        mockSharp.mockReturnValueOnce({
          toBuffer: vi.fn().mockRejectedValue(new Error("sharp error")),
        } as never);

        await expect(processUpload(fakeBuffer)).rejects.toThrow("sharp error");
      });
    });

    describe("when cloudinary upload throws", () => {
      it("propagates the error", async () => {
        mockExifrParse.mockResolvedValueOnce(null);
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);
        mockUploadImage.mockRejectedValueOnce(new Error("Cloudinary upload failed"));

        await expect(processUpload(fakeBuffer)).rejects.toThrow("Cloudinary upload failed");
      });
    });

    it("strips EXIF by calling sharp with the original buffer", async () => {
      mockExifrParse.mockResolvedValueOnce(null);
      const sharpMock = makeSharpMock();
      mockSharp.mockReturnValueOnce(sharpMock as never);

      await processUpload(fakeBuffer);

      expect(mockSharp).toHaveBeenCalledWith(fakeBuffer);
      expect(sharpMock.toBuffer).toHaveBeenCalledWith({ resolveWithObject: true });
    });

    it("uploads the stripped buffer with the correct MIME type", async () => {
      mockExifrParse.mockResolvedValueOnce(null);
      mockSharp.mockReturnValueOnce(makeSharpMock("png") as never);

      await processUpload(fakeBuffer);

      expect(mockUploadImage).toHaveBeenCalledWith(fakeStrippedBuffer, "image/png");
    });
  });
});
