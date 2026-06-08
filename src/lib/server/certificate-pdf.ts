import PDFDocument from "pdfkit";

interface CertificatePdfInput {
  institutionName: string;
  titleText: string;
  bodyText: string;
  studentName: string;
  courseTitle: string;
  certificateNumber: string;
  signatureName?: string;
  signatureTitle?: string;
  footer?: string;
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ size: "A4", layout: "landscape" });
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);
    doc.fontSize(28).text(input.institutionName, { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text(input.titleText, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).text(input.bodyText, { align: "center" });
    doc.moveDown();
    doc.fontSize(24).text(input.studentName, { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text("ha completado satisfactoriamente el programa de", { align: "center" });
    doc.fontSize(20).text(input.courseTitle, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString("es-SV")}`, { align: "center" });
    doc.text(`No. ${input.certificateNumber}`, { align: "center" });
    if (input.signatureName) {
      doc.moveDown(3);
      doc.text(input.signatureName, { align: "center" });
      if (input.signatureTitle) doc.text(input.signatureTitle, { align: "center" });
    }
    if (input.footer) {
      doc.moveDown(2);
      doc.fontSize(10).text(input.footer, { align: "center" });
    }
    doc.end();
  });

  return Buffer.concat(chunks);
}
