import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { cloudinaryDownloadUrl } from "@/lib/utils/cloudinary-url";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const doc = await getAdminDb().collection("certificates").doc(id).get();
  if (!doc.exists) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data = doc.data()!;
  if (data.userId !== session.uid && session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const pdfUrl = data.pdfUrl as string;
  if (!pdfUrl?.startsWith("http")) {
    return NextResponse.json({ error: "URL de certificado no disponible" }, { status: 404 });
  }

  const download = request.nextUrl.searchParams.get("download") === "1";
  const filename = `${data.certificateNumber ?? "certificado"}.pdf`;

  if (download) {
    const targetUrl = cloudinaryDownloadUrl(pdfUrl, filename);
    try {
      const res = await fetch(targetUrl);
      if (!res.ok) {
        return NextResponse.json({ error: "No se pudo cargar el certificado" }, { status: 502 });
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json({ error: "No se pudo cargar el certificado" }, { status: 502 });
    }
  }

  return NextResponse.json({
    url: cloudinaryDownloadUrl(pdfUrl, filename),
    certificateNumber: data.certificateNumber,
  });
}
