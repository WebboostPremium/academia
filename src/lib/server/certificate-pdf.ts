import { readFile } from "fs/promises";
import path from "path";
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
  logoUrl?: string;
  signatureUrl?: string;
  borderColor?: string;
  showLogo?: boolean;
}

async function loadImageBuffer(url?: string): Promise<Buffer | null> {
  if (!url) return null;
  try {
    if (url.startsWith("/")) {
      const localPath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
      return await readFile(localPath);
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function resolveLogoBuffer(logoUrl?: string): Promise<Buffer | null> {
  const fromUrl = await loadImageBuffer(logoUrl);
  if (fromUrl) return fromUrl;
  try {
    return await readFile(path.join(process.cwd(), "public", "brand", "logo-catequesis-online.jpg"));
  } catch {
    return null;
  }
}

export async function buildCertificatePdf(input: CertificatePdfInput): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const borderColor = input.borderColor ?? "#2d4a7a";
  const doc = new PDFDocument({ size: "A4", layout: "landscape", margins: { top: 40, bottom: 40, left: 50, right: 50 } });
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const contentWidth = pageWidth - 100;

  const [logoBuffer, signatureBuffer] = await Promise.all([
    input.showLogo !== false ? resolveLogoBuffer(input.logoUrl) : null,
    loadImageBuffer(input.signatureUrl),
  ]);

  await new Promise<void>((resolve) => {
    doc.on("end", resolve);

    doc.lineWidth(3).strokeColor(borderColor);
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();
    doc.lineWidth(1);
    doc.rect(38, 38, pageWidth - 76, pageHeight - 76).stroke();

    let y = 55;

    if (logoBuffer) {
      const logoWidth = 90;
      const logoHeight = 70;
      doc.image(logoBuffer, (pageWidth - logoWidth) / 2, y, {
        fit: [logoWidth, logoHeight],
        align: "center",
        valign: "center",
      });
      y += logoHeight + 10;
    }

    doc.fillColor(borderColor).fontSize(22).text(input.institutionName, 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 12;

    doc.fillColor("#333333").fontSize(15).text(input.titleText, 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 20;

    doc.fontSize(12).fillColor("#555555").text(input.bodyText, 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 10;

    doc.fillColor("#111111").fontSize(22).text(input.studentName, 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 14;

    doc.fontSize(12).fillColor("#555555").text("ha completado satisfactoriamente el programa de", 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 6;

    doc.fontSize(16).fillColor(borderColor).text(input.courseTitle, 50, y, {
      width: contentWidth,
      align: "center",
    });
    y = doc.y + 18;

    const dateStr = new Date().toLocaleDateString("es-SV", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    doc.fontSize(10).fillColor("#666666").text(`Fecha: ${dateStr}`, 50, y, {
      width: contentWidth,
      align: "center",
    });
    doc.text(`No. ${input.certificateNumber}`, { width: contentWidth, align: "center" });

    const signatureY = pageHeight - 130;
    if (signatureBuffer) {
      doc.image(signatureBuffer, (pageWidth - 120) / 2, signatureY, {
        fit: [120, 45],
        align: "center",
        valign: "center",
      });
    }

    if (input.signatureName) {
      const nameY = signatureBuffer ? signatureY + 50 : signatureY;
      doc.fontSize(11).fillColor("#111111").text(input.signatureName, 50, nameY, {
        width: contentWidth,
        align: "center",
      });
      if (input.signatureTitle) {
        doc.fontSize(9).fillColor("#666666").text(input.signatureTitle, {
          width: contentWidth,
          align: "center",
        });
      }
      doc.moveTo(pageWidth / 2 - 80, nameY - 4).lineTo(pageWidth / 2 + 80, nameY - 4).strokeColor("#999999").stroke();
    }

    if (input.footer) {
      doc.fontSize(8).fillColor("#888888").text(input.footer, 50, pageHeight - 55, {
        width: contentWidth,
        align: "center",
      });
    }

    doc.end();
  });

  return Buffer.concat(chunks);
}
