import crypto from "crypto";

type ResourceType = "image" | "raw";

function getConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
  };
}

async function uploadBuffer(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  folder: string,
  resourceType: ResourceType
): Promise<string> {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getConfig();
  if (!cloudName) throw new Error("CLOUDINARY_CLOUD_NAME no configurado");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), filename);
  form.append("folder", folder);

  if (apiKey && apiSecret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
  } else if (uploadPreset) {
    form.append("upload_preset", uploadPreset);
  } else {
    throw new Error("Configura CLOUDINARY_API_KEY/SECRET o CLOUDINARY_UPLOAD_PRESET");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Error Cloudinary");
  return data.secure_url as string;
}

export async function uploadImageToCloudinary(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  folder: string
): Promise<string> {
  return uploadBuffer(buffer, mimeType, filename, folder, "image");
}

export async function uploadPdfToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<string> {
  return uploadBuffer(buffer, "application/pdf", filename, folder, "raw");
}

/** @deprecated Use uploadImageToCloudinary */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  folder: string
): Promise<string | null> {
  try {
    return await uploadImageToCloudinary(buffer, mimeType, filename, folder);
  } catch {
    return null;
  }
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret, uploadPreset } = getConfig();
  return Boolean(cloudName && ((apiKey && apiSecret) || uploadPreset));
}
