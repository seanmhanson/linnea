import "server-only";
import exifr from "exifr";
import sharp from "sharp";
import { uploadImage } from "@/lib/cloudinary";
import type { UploadResult } from "@/src/mapper/upload";

async function processUpload(buffer: Buffer): Promise<UploadResult> {
  let extractedDate: Date | null = null;
  let extractedLat: number | null = null;
  let extractedLng: number | null = null;

  try {
    const exif = await exifr.parse(buffer, { gps: true, tiff: true });
    if (exif) {
      extractedDate = exif.DateTimeOriginal ?? null;
      extractedLat = exif.latitude ?? null;
      extractedLng = exif.longitude ?? null;
    }
  } catch {
    // EXIF parse failure is non-fatal; proceed with nulls
  }

  const { data: strippedBuffer, info } = await sharp(buffer).toBuffer({ resolveWithObject: true });
  if (!info.format) {
    throw new Error("Unable to determine image format");
  }
  const cloudinaryUrl = await uploadImage(strippedBuffer, `image/${info.format}`);

  return { cloudinaryUrl, extractedDate, extractedLat, extractedLng };
}

export { processUpload };
