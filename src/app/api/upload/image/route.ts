import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { uploadToCloudinary } from "@/lib/server/cloudinary";
import { getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";

const FOLDERS = ["avatars", "courses", "logos", "banners"] as const;

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "courses";

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
  if (!FOLDERS.includes(folder as typeof FOLDERS[number])) {
    return NextResponse.json({ error: "Carpeta inválida" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Máximo 5MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const cloudFolder = `catequesis/${folder}`;

  try {
    const cloudUrl = await uploadToCloudinary(buffer, file.type, file.name, cloudFolder);
    if (cloudUrl) return NextResponse.json({ url: cloudUrl, provider: "cloudinary" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error Cloudinary" },
      { status: 500 }
    );
  }

  const path = `${folder}/${session.uid}/${Date.now()}_${file.name}`;
  const bucket = getStorage(getAdminApp()).bucket();
  await bucket.file(path).save(buffer, { metadata: { contentType: file.type } });
  const [url] = await bucket.file(path).getSignedUrl({ action: "read", expires: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  return NextResponse.json({ url, provider: "firebase" });
}
