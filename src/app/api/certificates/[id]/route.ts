import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
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

  const bucket = getStorage(getAdminApp()).bucket();
  const file = bucket.file(data.pdfUrl);
  const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });

  return NextResponse.json({ url, certificateNumber: data.certificateNumber });
}
