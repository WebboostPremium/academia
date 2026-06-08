import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import { sendCertificateEmail } from "@/lib/server/email";
import { buildCertificatePdf } from "@/lib/server/certificate-pdf";
import { uploadPdfToCloudinary, isCloudinaryConfigured } from "@/lib/server/cloudinary";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 503 });
  }

  const { courseId } = await request.json();
  const userId = session.uid;
  const db = getAdminDb();
  const enrollmentId = `${userId}_${courseId}`;

  const enrollment = await db.collection("enrollments").doc(enrollmentId).get();
  if (!enrollment.exists) {
    return NextResponse.json({ error: "Sin inscripción activa" }, { status: 400 });
  }

  const progress = enrollment.data()?.progress;
  const completed = progress?.finalExamPassed && (progress?.percentComplete ?? 0) >= 70;

  if (!completed) {
    return NextResponse.json({ error: "Aún no cumples los requisitos del certificado" }, { status: 400 });
  }

  const existing = await db
    .collection("certificates")
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .where("status", "==", "active")
    .limit(1)
    .get();

  if (!existing.empty) {
    return NextResponse.json({ certificateId: existing.docs[0].id, alreadyExists: true });
  }

  const [userDoc, courseDoc, settingsDoc] = await Promise.all([
    db.collection("users").doc(userId).get(),
    db.collection("courses").doc(courseId).get(),
    db.collection("settings").doc("global").get(),
  ]);

  const user = userDoc.data()!;
  const course = courseDoc.data()!;
  const settings = settingsDoc.data() ?? {};
  const certSettings = settings.certificates ?? {};

  const certCount = (await db.collection("certificates").get()).size + 1;
  const certificateNumber = `CERT-${new Date().getFullYear()}-${String(certCount).padStart(5, "0")}`;

  const pdfBuffer = await buildCertificatePdf({
    institutionName: certSettings.headerTitle ?? settings.institution?.name ?? "Catequesis Online",
    titleText: certSettings.titleText ?? "Certificado de Completación",
    bodyText: certSettings.bodyText ?? "Se certifica que",
    studentName: user.displayName,
    courseTitle: course.title,
    certificateNumber,
    signatureName: certSettings.signatureName,
    signatureTitle: certSettings.signatureTitle,
    footer: certSettings.templateFooter,
  });

  const pdfUrl = await uploadPdfToCloudinary(
    pdfBuffer,
    `${certificateNumber}.pdf`,
    `catequesis/certificates/${userId}`
  );

  const certRef = await db.collection("certificates").add({
    userId,
    courseId,
    enrollmentId,
    certificateNumber,
    studentName: user.displayName,
    courseTitle: course.title,
    issuedAt: FieldValue.serverTimestamp(),
    issuedBy: "system",
    status: "active",
    pdfUrl,
  });

  await db.collection("enrollments").doc(enrollmentId).update({
    status: "completed",
    completedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("notifications").add({
    userId,
    type: "certificate",
    title: "¡Certificado generado!",
    body: `Tu certificado de ${course.title} está listo para descargar.`,
    link: "/estudiante/certificados",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  await sendCertificateEmail(session.email, session.displayName, course.title);

  await db.collection("activity_logs").add({
    userId,
    userName: session.displayName,
    userRole: session.role,
    action: "certificate.issue",
    entityType: "certificate",
    entityId: certRef.id,
    details: `Certificado: ${course.title}`,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ certificateId: certRef.id, certificateNumber, downloadUrl: pdfUrl });
}
