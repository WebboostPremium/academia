import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendPurchaseEmail } from "@/lib/server/email";
import { FieldValue } from "firebase-admin/firestore";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function parseWompiWebhook(payload: Record<string, unknown>) {
  const svReference =
    (payload.EnlacePago as { IdentificadorEnlaceComercio?: string } | undefined)
      ?.IdentificadorEnlaceComercio ??
    (payload.enlacePago as { identificadorEnlaceComercio?: string } | undefined)
      ?.identificadorEnlaceComercio;

  const svStatus = (payload.ResultadoTransaccion ?? payload.resultadoTransaccion) as string | undefined;
  const svTransactionId = (payload.IdTransaccion ?? payload.idTransaccion) as string | undefined;

  const legacy = payload.data as Record<string, unknown> | undefined;
  const legacyTx = (legacy?.transaction ?? legacy ?? payload) as Record<string, unknown>;

  const reference =
    svReference ??
    (legacyTx.reference as string | undefined) ??
    (legacyTx.payment_link_id as string | undefined);

  const status =
    svStatus ??
    ((legacyTx.status ?? legacyTx.payment_status ?? payload.status) as string | undefined);

  const transactionId =
    svTransactionId ??
    ((legacyTx.id ?? legacyTx.transaction_id) as string | undefined) ??
    "";

  const approved =
    status === "ExitosaAprobada" ||
    status?.toUpperCase() === "APPROVED" ||
    status?.toUpperCase() === "APPROVED_TRANSACTION" ||
    status?.toUpperCase() === "COMPLETED";

  const declined =
    status?.toUpperCase() === "DECLINED" ||
    status?.toUpperCase() === "VOIDED" ||
    status === "Rechazada";

  return { reference, transactionId, approved, declined };
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-event-checksum") ?? request.headers.get("X-Event-Checksum");
  const secret = process.env.WOMPI_WEBHOOK_SECRET ?? process.env.WOMPI_CLIENT_SECRET ?? "";

  if (secret && signature) {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
  }

  const payload = JSON.parse(body) as Record<string, unknown>;
  const { reference, transactionId, approved, declined } = parseWompiWebhook(payload);

  if (!reference) return NextResponse.json({ received: true });

  const db = getAdminDb();
  const paymentsSnap = await db
    .collection("payments")
    .where("wompi.reference", "==", reference)
    .limit(1)
    .get();

  if (paymentsSnap.empty) return NextResponse.json({ received: true });

  const paymentDoc = paymentsSnap.docs[0];
  const payment = paymentDoc.data();

  if (payment.status === "approved") return NextResponse.json({ received: true });

  if (approved) {
    await paymentDoc.ref.update({
      status: "approved",
      approvedAt: FieldValue.serverTimestamp(),
      "wompi.transactionId": transactionId,
    });

    const enrollmentId = `${payment.userId}_${payment.courseId}`;
    await db.collection("enrollments").doc(enrollmentId).set({
      userId: payment.userId,
      courseId: payment.courseId,
      paymentId: paymentDoc.id,
      status: "active",
      enrolledAt: FieldValue.serverTimestamp(),
      progress: {
        percentComplete: 0,
        modulesCompleted: [],
        lessonsCompleted: [],
        quizzesPassed: [],
        finalExamPassed: false,
        averageScore: 0,
        lastActivityAt: FieldValue.serverTimestamp(),
      },
    });

    const courseDoc = await db.collection("courses").doc(payment.courseId).get();
    const sacrament = courseDoc.data()?.slug ?? "bautismo";
    await db.collection("sacramental_records").doc(enrollmentId).set(
      {
        userId: payment.userId,
        courseId: payment.courseId,
        sacrament,
        status: "in_progress",
        requirements: [
          { id: "docs", title: "Documentos entregados", completed: false },
          { id: "bautismo", title: "Bautismo (si aplica)", completed: false },
          { id: "asistencia", title: "Asistencia mínima", completed: false },
        ],
        observations: [],
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    await db.collection("notifications").add({
      userId: payment.userId,
      type: "payment",
      title: "Pago confirmado",
      body: "Tu inscripción al curso ha sido activada.",
      link: "/estudiante/cursos",
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    await db.collection("courses").doc(payment.courseId).update({
      "stats.enrollmentCount": FieldValue.increment(1),
    });

    if (payment.couponId) {
      await db.collection("coupons").doc(payment.couponId).update({
        usedCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    const userDoc = await db.collection("users").doc(payment.userId).get();
    const courseTitle = courseDoc.data()?.title ?? "Curso";
    const userData = userDoc.data();
    if (userData?.email) {
      const amount = `$${((payment.amount ?? 0) / 100).toFixed(2)}`;
      await sendPurchaseEmail(userData.email, userData.displayName ?? "Estudiante", courseTitle, amount);
    }

    await db.collection("activity_logs").add({
      userId: payment.userId,
      userName: userData?.displayName ?? "Estudiante",
      userRole: userData?.role ?? "estudiante",
      action: "payment.approved",
      entityType: "payment",
      entityId: paymentDoc.id,
      details: `Pago aprobado: ${courseTitle}`,
      createdAt: FieldValue.serverTimestamp(),
    });
  } else if (declined) {
    await paymentDoc.ref.update({ status: "declined" });
  }

  return NextResponse.json({ received: true });
}
