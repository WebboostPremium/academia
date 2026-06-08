import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";

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
  const url = pdfUrl.startsWith("http") ? pdfUrl : null;
  if (!url) {
    return NextResponse.json({ error: "URL de certificado no disponible" }, { status: 404 });
  }

  return NextResponse.json({ url, certificateNumber: data.certificateNumber });
}
