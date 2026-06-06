import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { uploadToCloudinary } from "@/lib/server/cloudinary";
import { getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const cloudUrl = await uploadToCloudinary(buffer, file.type, file.name, "catequesis/avatars");
    if (cloudUrl) return NextResponse.json({ url: cloudUrl, provider: "cloudinary" });
  } catch {
    /* fallback firebase */
  }

  const path = `avatars/${session.uid}/${Date.now()}_${file.name}`;
  const bucket = getStorage(getAdminApp()).bucket();
  await bucket.file(path).save(buffer, { metadata: { contentType: file.type } });
  const [url] = await bucket.file(path).getSignedUrl({ action: "read", expires: Date.now() + 365 * 24 * 60 * 60 * 1000 });
  return NextResponse.json({ url, provider: "firebase" });
}
