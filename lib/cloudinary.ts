import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getConfig } from "@/src/util/Config";

function configureCloudinary() {
  const config = getConfig();
  cloudinary.config({
    cloud_name: config.cloudinaryCloudName,
    api_key: config.cloudinaryApiKey,
    api_secret: config.cloudinaryApiSecret,
  });
}

async function uploadImage(buffer: Buffer, mimeType: string): Promise<string> {
  configureCloudinary();
  const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, { resource_type: "image" });
  return result.secure_url;
}

export { uploadImage };
