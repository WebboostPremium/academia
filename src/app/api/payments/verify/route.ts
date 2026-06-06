import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const paymentId = request.nextUrl.searchParams.get("paymentId");
  if (!paymentId) return NextResponse.json({ error: "paymentId requerido" }, { status: 400 });

  const doc = await getAdminDb().collection("payments").doc(paymentId).get();
  if (!doc.exists) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

  const data = doc.data()!;
  if (data.userId !== session.uid) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  return NextResponse.json({ status: data.status, courseId: data.courseId });
}
