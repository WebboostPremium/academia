import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import { buildCertificatePdf } from "@/lib/server/certificate-pdf";
import { uploadPdfToCloudinary, isCloudinaryConfigured } from "@/lib/server/cloudinary";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!isCloudinaryConfigured()) {
    return NextResponse.json({ error: "Cloudinary no configurado" }, { status: 503 });
  }

  const { userId, courseId } = await request.json();
  const db = getAdminDb();

  const enrollmentId = `${userId}_${courseId}`;
  const enrollment = await db.collection("enrollments").doc(enrollmentId).get();
  if (!enrollment.exists || !enrollment.data()?.progress?.finalExamPassed) {
    return NextResponse.json({ error: "El estudiante no ha completado el curso" }, { status: 400 });
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
    issuedBy: session.uid,
    status: "active",
    pdfUrl,
  });

  await db.collection("notifications").add({
    userId,
    type: "certificate",
    title: "Certificado emitido",
    body: `Tu certificado de ${course.title} está disponible.`,
    link: "/estudiante/certificados",
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ certificateId: certRef.id, certificateNumber, downloadUrl: pdfUrl });
}
