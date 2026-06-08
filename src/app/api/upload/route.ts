import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { uploadPdfToCloudinary, isCloudinaryConfigured } from "@/lib/server/cloudinary";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) ?? "submissions";
  const assignmentId = formData.get("assignmentId") as string | null;

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Solo PDF permitido" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Máximo 10MB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const cloudFolder = assignmentId
    ? `catequesis/submissions/${session.uid}/${assignmentId}`
    : `catequesis/${folder}/${session.uid}`;

  try {
    const url = await uploadPdfToCloudinary(buffer, file.name, cloudFolder);
    return NextResponse.json({ url, fileName: file.name, provider: "cloudinary" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }
}
