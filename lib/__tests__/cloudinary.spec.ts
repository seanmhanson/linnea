import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload: vi.fn(),
    },
  },
}));

vi.mock("@/src/util/Config", () => ({
  getConfig: vi.fn(() => ({
    cloudinaryCloudName: "test-cloud",
    cloudinaryApiKey: "test-key",
    cloudinaryApiSecret: "test-secret",
  })),
}));

// subject
import { uploadImage } from "@/lib/cloudinary";
import { v2 as cloudinary } from "cloudinary";

const mockUpload = vi.mocked(cloudinary.uploader.upload);

describe("lib/cloudinary", () => {
  beforeEach(() => {
    mockUpload.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("#uploadImage", () => {
    it("calls cloudinary upload with a base64 data URI", async () => {
      const buffer = Buffer.from("fake-image-bytes");
      const mimeType = "image/jpeg";
      const expectedDataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
      mockUpload.mockResolvedValueOnce({
        secure_url: "https://res.cloudinary.com/test/image.jpg",
      } as never);

      await uploadImage(buffer, mimeType);

      expect(mockUpload).toHaveBeenCalledWith(expectedDataUri, { resource_type: "image" });
    });

    it("returns the secure_url from the upload result", async () => {
      const url = "https://res.cloudinary.com/test/image.jpg";
      mockUpload.mockResolvedValueOnce({ secure_url: url } as never);

      const result = await uploadImage(Buffer.from("bytes"), "image/png");

      expect(result).toBe(url);
    });

    it("propagates errors from cloudinary upload", async () => {
      mockUpload.mockRejectedValueOnce(new Error("Cloudinary upload failed"));

      await expect(uploadImage(Buffer.from("bytes"), "image/jpeg")).rejects.toThrow(
        "Cloudinary upload failed"
      );
    });
  });
});
