import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { generateReference } from "@/lib/services/payments";
import { FieldValue } from "firebase-admin/firestore";

const WOMPI_API = process.env.WOMPI_API_URL ?? "https://api.wompi.sv/v1";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { courseId } = await request.json();
  if (!courseId) return NextResponse.json({ error: "courseId requerido" }, { status: 400 });

  const db = getAdminDb();
  const courseDoc = await db.collection("courses").doc(courseId).get();
  if (!courseDoc.exists) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

  const course = courseDoc.data()!;
  const existing = await db.collection("enrollments")
    .where("userId", "==", session.uid)
    .where("courseId", "==", courseId)
    .where("status", "in", ["active", "completed"])
    .get();

  if (!existing.empty) {
    return NextResponse.json({ error: "Ya estás inscrito en este curso" }, { status: 409 });
  }

  const settingsDoc = await db.collection("settings").doc("global").get();
  const wompiPublicKey = settingsDoc.data()?.wompi?.publicKey ?? process.env.WOMPI_PUBLIC_KEY;
  const wompiPrivateKey = process.env.WOMPI_PRIVATE_KEY;

  if (!wompiPublicKey || !wompiPrivateKey) {
    return NextResponse.json({ error: "Wompi no configurado" }, { status: 503 });
  }

  const reference = generateReference(course.slug, session.uid);
  const amountInCents = course.price;

  const paymentRef = await db.collection("payments").add({
    userId: session.uid,
    courseId,
    amount: amountInCents,
    currency: "USD",
    status: "pending",
    wompi: { transactionId: "", reference },
    createdAt: FieldValue.serverTimestamp(),
  });

  try {
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/estudiante/compras?payment=${paymentRef.id}`;
    const wompiRes = await fetch(`${WOMPI_API}/payment_links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${wompiPrivateKey}`,
      },
      body: JSON.stringify({
        name: course.title,
        description: `Inscripción: ${course.title}`,
        single_use: true,
        collect_shipping: false,
        currency: "USD",
        amount_in_cents: amountInCents,
        reference,
        redirect_url: redirectUrl,
        customer_email: session.email,
      }),
    });

    const wompiData = await wompiRes.json();

    if (!wompiRes.ok) {
      await paymentRef.update({ status: "declined" });
      return NextResponse.json({ error: wompiData?.error ?? "Error Wompi" }, { status: 502 });
    }

    const checkoutUrl = wompiData.data?.permalink ?? wompiData.data?.checkout_url ?? wompiData.permalink;
    const transactionId = wompiData.data?.id ?? reference;

    await paymentRef.update({ "wompi.transactionId": transactionId });

    return NextResponse.json({ checkoutUrl, paymentId: paymentRef.id, reference });
  } catch {
    await paymentRef.update({ status: "declined" });
    return NextResponse.json({ error: "Error al conectar con Wompi" }, { status: 502 });
  }
}
