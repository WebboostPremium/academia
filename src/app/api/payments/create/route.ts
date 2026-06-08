import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { generateReference } from "@/lib/utils/payment-reference";
import { createWompiPaymentLink, getWompiClientId, getWompiClientSecret } from "@/lib/server/wompi";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { courseId, couponCode } = await request.json();
  if (!courseId) return NextResponse.json({ error: "courseId requerido" }, { status: 400 });

  if (!getWompiClientId() || !getWompiClientSecret()) {
    return NextResponse.json({ error: "Wompi no configurado" }, { status: 503 });
  }

  const db = getAdminDb();
  const courseDoc = await db.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const course = courseDoc.data()!;
  const existing = await db
    .collection("enrollments")
    .where("userId", "==", session.uid)
    .where("courseId", "==", courseId)
    .where("status", "in", ["active", "completed"])
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 409 });
  }

  const reference = generateReference(course.slug, session.uid);
  let amountInCents = course.price as number;
  let discountCents = 0;
  let couponId: string | undefined;

  if (couponCode) {
    const code = String(couponCode).trim().toUpperCase();
    const couponSnap = await db.collection("coupons").where("code", "==", code).limit(1).get();
    if (couponSnap.empty) {
      return NextResponse.json({ error: "Cupón no válido" }, { status: 400 });
    }
    const coupon = couponSnap.docs[0];
    const c = coupon.data();
    const now = new Date();
    if (c.status !== "active") return NextResponse.json({ error: "Cupón inactivo" }, { status: 400 });
    if (c.expiresAt?.toDate?.() && c.expiresAt.toDate() < now) {
      return NextResponse.json({ error: "Cupón expirado" }, { status: 400 });
    }
    if (c.maxUses && (c.usedCount ?? 0) >= c.maxUses) {
      return NextResponse.json({ error: "Cupón agotado" }, { status: 400 });
    }
    if (c.courseId && c.courseId !== courseId) {
      return NextResponse.json({ error: "Cupón no válido para este curso" }, { status: 400 });
    }
    discountCents =
      c.type === "percent"
        ? Math.round(amountInCents * (c.value / 100))
        : Math.min(c.value, amountInCents);
    amountInCents = Math.max(0, amountInCents - discountCents);
    couponId = coupon.id;
  }

  const paymentRef = await db.collection("payments").add({
    userId: session.uid,
    courseId,
    amount: amountInCents,
    originalAmount: course.price,
    discountCents,
    couponId: couponId ?? null,
    couponCode: couponCode ? String(couponCode).trim().toUpperCase() : null,
    currency: "USD",
    status: "pending",
    wompi: { transactionId: "", reference },
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUrl = `${appUrl}/estudiante/compras?payment=${paymentRef.id}`;
    const webhookUrl = `${appUrl}/api/payments/webhook`;

    const link = await createWompiPaymentLink({
      reference,
      amountDollars: amountInCents / 100,
      productName: course.title,
      productDescription: `Inscripción al curso: ${course.title}`,
      redirectUrl,
      webhookUrl,
      customerEmail: session.email,
    });

    await paymentRef.update({
      "wompi.transactionId": String(link.idEnlace),
      "wompi.environment": link.estaProductivo ? "production" : "sandbox",
    });

    return NextResponse.json({
      checkoutUrl: link.urlEnlace,
      paymentId: paymentRef.id,
      reference,
      amount: amountInCents,
      discount: discountCents,
    });
  } catch (err) {
    await paymentRef.update({ status: "declined" });
    const message = err instanceof Error ? err.message : "Error al conectar con Wompi";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
