import exifr from "exifr";

async function extractImageDate(file: File): Promise<string | null> {
  try {
    const exif = await exifr.parse(file, { tiff: true });
    const dateTimeOriginal = exif?.DateTimeOriginal;

    if (!dateTimeOriginal) {
      return null;
    }

    return typeof dateTimeOriginal === "string" ? dateTimeOriginal : dateTimeOriginal.toISOString();
  } catch {
    return null;
  }
}

export { extractImageDate };
