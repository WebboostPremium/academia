import { NextRequest, NextResponse } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "uploads";
  const assignmentId = formData.get("assignmentId") as string | null;

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const isPdf = file.type === "application/pdf";
  const isImage = file.type.startsWith("image/");
  const isAvatar = folder === "avatars";

  if (isAvatar && !isImage) return NextResponse.json({ error: "Solo imágenes permitidas para avatar" }, { status: 400 });
  if (!isAvatar && !isPdf) return NextResponse.json({ error: "Solo PDF permitido" }, { status: 400 });

  const maxSize = isAvatar ? 2 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxSize) return NextResponse.json({ error: `Máximo ${isAvatar ? "2MB" : "10MB"}` }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const path = assignmentId
    ? `submissions/${session.uid}/${assignmentId}/${Date.now()}_${file.name}`
    : `${folder}/${session.uid}/${Date.now()}_${file.name}`;

  const bucket = getStorage(getAdminApp()).bucket();
  const fileRef = bucket.file(path);
  await fileRef.save(buffer, { metadata: { contentType: file.type } });
  const [url] = await fileRef.getSignedUrl({ action: "read", expires: Date.now() + 7 * 24 * 60 * 60 * 1000 });

  return NextResponse.json({ path, url, fileName: file.name });
}
