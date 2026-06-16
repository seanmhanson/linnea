import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sharp", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/cloudinary", () => ({
  uploadImage: vi.fn(),
}));

// subject
import { processUpload } from "@/src/controller/UploadController";
import sharp from "sharp";
import { uploadImage } from "@/lib/cloudinary";

const mockSharp = vi.mocked(sharp);
const mockUploadImage = vi.mocked(uploadImage);

const fakeBuffer = Buffer.from("fake-image");
const fakeStrippedBuffer = Buffer.from("stripped-image");
const fakeCloudinaryUrl = "https://res.cloudinary.com/test/image.jpg";

function makeSharpMock(format = "jpeg") {
  return {
    rotate: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue({
      data: fakeStrippedBuffer,
      info: { format },
    }),
  };
}

describe("src/controller/UploadController", () => {
  beforeEach(() => {
    mockSharp.mockReset();
    mockUploadImage.mockReset();
    mockUploadImage.mockResolvedValue(fakeCloudinaryUrl);
  });

  describe("#processUpload", () => {
    describe("when an extracted date is provided", () => {
      it("returns cloudinaryUrl and extractedDate", async () => {
        const date = "2024-05-01T10:00:00.000Z";
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);

        const result = await processUpload(fakeBuffer, date);

        expect(result).toEqual({
          cloudinaryUrl: fakeCloudinaryUrl,
          extractedDate: date,
        });
      });
    });

    describe("when no extracted date is provided", () => {
      it("returns null for extractedDate", async () => {
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);

        const result = await processUpload(fakeBuffer, null);

        expect(result).toEqual({
          cloudinaryUrl: fakeCloudinaryUrl,
          extractedDate: null,
        });
      });
    });

    describe("when sharp throws", () => {
      it("propagates the error", async () => {
        mockSharp.mockReturnValueOnce({
          rotate: vi.fn(() => {
            throw new Error("sharp error");
          }),
          toBuffer: vi.fn().mockRejectedValue(new Error("sharp error")),
        } as never);

        await expect(processUpload(fakeBuffer, null)).rejects.toThrow("sharp error");
      });
    });

    describe("when cloudinary upload throws", () => {
      it("propagates the error", async () => {
        mockSharp.mockReturnValueOnce(makeSharpMock() as never);
        mockUploadImage.mockRejectedValueOnce(new Error("Cloudinary upload failed"));

        await expect(processUpload(fakeBuffer, null)).rejects.toThrow("Cloudinary upload failed");
      });
    });

    it("strips EXIF by calling sharp with the original buffer", async () => {
      const sharpMock = makeSharpMock();
      mockSharp.mockReturnValueOnce(sharpMock as never);

      await processUpload(fakeBuffer, null);

      expect(mockSharp).toHaveBeenCalledWith(fakeBuffer);
      expect(sharpMock.rotate).toHaveBeenCalledTimes(1);
      expect(sharpMock.toBuffer).toHaveBeenCalledWith({ resolveWithObject: true });
    });

    it("uploads the stripped buffer with the correct MIME type", async () => {
      mockSharp.mockReturnValueOnce(makeSharpMock("png") as never);

      await processUpload(fakeBuffer, null);

      expect(mockUploadImage).toHaveBeenCalledWith(fakeStrippedBuffer, "image/png");
    });
  });
});
