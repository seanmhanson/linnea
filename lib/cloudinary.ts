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

async function uploadImage(buffer: Buffer): Promise<string> {
  configureCloudinary();

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, res) => {
      if (error || !res?.secure_url) {
        reject(error ?? new Error("Cloudinary upload failed"));
        return;
      }
      resolve(res as { secure_url: string });
    });

    stream.end(buffer);
  });

  return result.secure_url;
}

export { uploadImage };
