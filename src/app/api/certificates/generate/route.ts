import { NextRequest, NextResponse } from "next/server";
import { getAdminDb, getAdminApp } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { verifySessionToken, getSessionCookieName } from "@/lib/auth/session";
import { FieldValue } from "firebase-admin/firestore";
import PDFDocument from "pdfkit";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(getSessionCookieName())?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
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

  const certCount = (await db.collection("certificates").get()).size + 1;
  const certificateNumber = `CERT-${new Date().getFullYear()}-${String(certCount).padStart(5, "0")}`;

  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", layout: "landscape" });
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);
    doc.fontSize(28).text(settings.institution?.name ?? "Catequesis Online", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text("Certificado de Completación", { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).text("Se certifica que", { align: "center" });
    doc.moveDown();
    doc.fontSize(24).text(user.displayName, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`ha completado satisfactoriamente el programa de`, { align: "center" });
    doc.fontSize(20).text(course.title, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString("es-SV")}`, { align: "center" });
    doc.text(`No. ${certificateNumber}`, { align: "center" });
    if (settings.certificates?.signatureName) {
      doc.moveDown(3);
      doc.text(settings.certificates.signatureName, { align: "center" });
      doc.text(settings.certificates.signatureTitle ?? "", { align: "center" });
    }
    doc.end();
  });

  const pdfBuffer = Buffer.concat(chunks);
  const path = `certificates/${userId}/${certificateNumber}.pdf`;
  const bucket = getStorage(getAdminApp()).bucket();
  await bucket.file(path).save(pdfBuffer, { metadata: { contentType: "application/pdf" } });
  const [pdfUrl] = await bucket.file(path).getSignedUrl({ action: "read", expires: "03-01-2500" });

  const certRef = await db.collection("certificates").add({
    userId, courseId, enrollmentId, certificateNumber,
    studentName: user.displayName, courseTitle: course.title,
    issuedAt: FieldValue.serverTimestamp(), issuedBy: session.uid,
    status: "active", pdfUrl: path,
  });

  await db.collection("notifications").add({
    userId, type: "certificate", title: "Certificado emitido",
    body: `Tu certificado de ${course.title} está disponible.`,
    link: "/estudiante/certificados", read: false,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ certificateId: certRef.id, certificateNumber, downloadUrl: pdfUrl });
}
