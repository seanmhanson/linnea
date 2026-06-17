import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn(),
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

const mockUploadStream = vi.mocked(cloudinary.uploader.upload_stream);

function makeUploadStreamMock(secureUrl?: string, error?: Error) {
  return (
    options: { resource_type: string },
    callback: (err: Error | null, res?: { secure_url: string }) => void
  ) => {
    expect(options).toEqual({ resource_type: "image" });

    return {
      end: (buffer: Buffer) => {
        expect(buffer).toBeInstanceOf(Buffer);
        if (error) {
          callback(error);
          return;
        }

        callback(null, { secure_url: secureUrl ?? "https://res.cloudinary.com/test/image.jpg" });
      },
    };
  };
}

describe("lib/cloudinary", () => {
  beforeEach(() => {
    mockUploadStream.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("#uploadImage", () => {
    it("calls cloudinary upload_stream with the provided buffer", async () => {
      const buffer = Buffer.from("fake-image-bytes");
      mockUploadStream.mockImplementationOnce(makeUploadStreamMock());

      await uploadImage(buffer, "image/jpeg");

      expect(mockUploadStream).toHaveBeenCalledWith(
        { resource_type: "image" },
        expect.any(Function)
      );
    });

    it("returns the secure_url from the upload result", async () => {
      const url = "https://res.cloudinary.com/test/image.jpg";
      mockUploadStream.mockImplementationOnce(makeUploadStreamMock(url));

      const result = await uploadImage(Buffer.from("bytes"), "image/png");

      expect(result).toBe(url);
    });

    it("propagates errors from cloudinary upload", async () => {
      mockUploadStream.mockImplementationOnce(
        makeUploadStreamMock(undefined, new Error("Cloudinary upload failed"))
      );

      await expect(uploadImage(Buffer.from("bytes"), "image/jpeg")).rejects.toThrow(
        "Cloudinary upload failed"
      );
    });
  });
});
