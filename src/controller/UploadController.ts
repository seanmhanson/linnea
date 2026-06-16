import "server-only";
import sharp from "sharp";
import { uploadImage } from "@/lib/cloudinary";
import type { UploadResult } from "@/src/mapper/upload";

async function processUpload(buffer: Buffer, extractedDate: string | null): Promise<UploadResult> {
  const { data: strippedBuffer, info } = await sharp(buffer)
    .rotate()
    .toBuffer({ resolveWithObject: true });
  if (!info.format) {
    throw new Error("Unable to determine image format");
  }
  const cloudinaryUrl = await uploadImage(strippedBuffer, `image/${info.format}`);

  return { cloudinaryUrl, extractedDate };
}

export { processUpload };
