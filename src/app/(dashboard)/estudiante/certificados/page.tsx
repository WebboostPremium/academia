"use client";

import { useEffect, useState } from "react";
import { Award, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCertificates } from "@/lib/services/certificates";
import { formatDate } from "@/lib/utils/format";
import type { Certificate } from "@/types";

export default function EstudianteCertificadosPage() {
  const { user, loading: authLoading } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const certs = await getCertificates({ userId: user!.uid });
        setCertificates(certs.filter((c) => c.status === "active"));
      } catch {
        toast.error("Error al cargar certificados");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando certificados...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Certificados"
        description="Certificados obtenidos al completar tus cursos"
      />

      {certificates.length === 0 ? (
        <EmptyState
          title="Sin certificados"
          description="Completa un curso para recibir tu certificado de preparación sacramental"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader className="flex flex-row items-start gap-3">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <CardTitle className="text-base">{cert.courseTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">{cert.studentName}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="secondary">#{cert.certificateNumber}</Badge>
                  <Badge variant="outline">Emitido: {formatDate(cert.issuedAt)}</Badge>
                </div>
                {cert.pdfUrl && (
                  <Button asChild size="sm" className="gap-2">
                    <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      Descargar certificado
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
