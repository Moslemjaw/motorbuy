import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

// Parse Cloudinary connection string
// Format: cloudinary://api_key:api_secret@cloud_name
// Or use individual env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

const cloudinaryUrl = process.env.CLOUDINARY_URL || "";
const connectionString = process.env.CLOUDINARY_CONNECTION_STRING || "";

if (cloudinaryUrl) {
  // Use CLOUDINARY_URL if provided (standard Cloudinary format)
  cloudinary.config();
} else if (connectionString) {
  // Parse from custom connection string format: cloudinary://api_key:api_secret@cloud_name
  const match = connectionString.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    const [, apiKey, apiSecret, cloudName] = match;
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    console.log("✅ Cloudinary configured from connection string");
  } else {
    console.warn("⚠️ Invalid Cloudinary connection string format");
  }
} else {
  // Try individual environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    console.log("✅ Cloudinary configured from environment variables");
  } else {
    console.warn("⚠️ Cloudinary not configured. Set CLOUDINARY_CONNECTION_STRING or individual env vars.");
  }
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "motorbuy",
  publicId?: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto", // Automatically detect image, video, etc.
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        } else {
          reject(new Error("Upload failed: No result returned"));
        }
      }
    );

    // Convert buffer to stream
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);
  });
}

/**
 * Upload a file from a stream to Cloudinary
 */
export async function uploadStreamToCloudinary(
  stream: Readable,
  folder: string = "motorbuy",
  publicId?: string
): Promise<{ url: string; publicId: string; secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            secureUrl: result.secure_url,
          });
        } else {
          reject(new Error("Upload failed: No result returned"));
        }
      }
    );

    stream.pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Get Cloudinary URL for a public ID
 */
export function getCloudinaryUrl(publicId: string, options?: {
  width?: number;
  height?: number;
  crop?: string;
  quality?: number;
  format?: string;
}): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}

export { cloudinary };

