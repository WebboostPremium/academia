import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { uploadImageToCloudinary, isCloudinaryConfigured } from "@/lib/server/cloudinary";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Máximo 2MB" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadImageToCloudinary(buffer, file.type, file.name, "catequesis/avatars");
    return NextResponse.json({ url, provider: "cloudinary" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir avatar" },
      { status: 500 }
    );
  }
}
