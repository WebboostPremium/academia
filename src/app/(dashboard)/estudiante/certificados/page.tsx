"use client";

import { useEffect, useState } from "react";
import { Award, Download, Loader2 } from "lucide-react";
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
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  async function handleDownload(cert: Certificate) {
    setDownloadingId(cert.id);
    try {
      const res = await fetch(`/api/certificates/${cert.id}?download=1`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "No se pudo descargar");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cert.certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Certificado descargado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al descargar certificado");
    } finally {
      setDownloadingId(null);
    }
  }

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
                <Button
                  size="sm"
                  className="gap-2"
                  disabled={downloadingId === cert.id}
                  onClick={() => handleDownload(cert)}
                >
                  {downloadingId === cert.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar certificado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
