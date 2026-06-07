"use client";

import type { AppSettings } from "@/types/settings";

interface CertificatePreviewProps {
  institution: AppSettings["institution"];
  certificates: AppSettings["certificates"];
  studentName?: string;
  courseTitle?: string;
}

export function CertificatePreview({
  institution,
  certificates,
  studentName = "María Elena Rodríguez",
  courseTitle = "Primera Comunión",
}: CertificatePreviewProps) {
  const borderColor = certificates.borderColor ?? "#2d4a7a";

  return (
    <div
      className="mx-auto aspect-[1.414/1] w-full max-w-md rounded-lg bg-white p-8 shadow-lg ring-1 ring-foreground/10"
      style={{ border: `4px double ${borderColor}` }}
    >
      {institution.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={institution.logoUrl} alt="" className="mx-auto mb-4 h-12 object-contain" />
      )}
      <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">
        {certificates.headerTitle ?? institution.name}
      </p>
      <h3 className="mt-4 text-center font-serif text-xl font-semibold" style={{ color: borderColor }}>
        {certificates.titleText ?? "Certificado de Participación"}
      </h3>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {certificates.bodyText ?? "Se certifica que"}
      </p>
      <p className="mt-2 text-center font-serif text-2xl font-semibold">{studentName}</p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        ha completado satisfactoriamente el programa de
      </p>
      <p className="mt-1 text-center font-medium">{courseTitle}</p>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        {new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <div className="mt-8 border-t pt-4 text-center">
        {certificates.signatureUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={certificates.signatureUrl} alt="Firma" className="mx-auto h-10 object-contain" />
        )}
        <p className="text-sm font-medium">{certificates.signatureName ?? "Director Catequético"}</p>
        <p className="text-xs text-muted-foreground">{certificates.signatureTitle ?? "Institución"}</p>
      </div>
      {certificates.templateFooter && (
        <p className="mt-4 text-center text-[10px] text-muted-foreground">{certificates.templateFooter}</p>
      )}
    </div>
  );
}
