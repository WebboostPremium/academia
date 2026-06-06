"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCertificates } from "@/lib/services/certificates";
import { getCourses } from "@/lib/services/courses";
import { getAllUsers } from "@/lib/services/users";
import { ROLES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import type { Certificate } from "@/types";
import type { Course } from "@/types/course";
import type { AppUser } from "@/types/user";

export default function CertificadosAdminPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState("");
  const [courseId, setCourseId] = useState("");

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function load() {
    const [certs, studs, crs] = await Promise.all([
      getCertificates(),
      getAllUsers(ROLES.ESTUDIANTE),
      getCourses(),
    ]);
    setCertificates(certs);
    setStudents(studs);
    setCourses(crs);
    if (studs.length > 0) setUserId(studs[0].uid);
    if (crs.length > 0) setCourseId(crs[0].id);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleGenerate() {
    if (!userId || !courseId) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Error al generar certificado");
        return;
      }
      toast.success(`Certificado ${data.certificateNumber} generado`);
      setCertificates(await getCertificates());
    } catch {
      toast.error("Error al generar certificado");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando certificados...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Certificados" description="Emisión y gestión de certificados" />

      <Card>
        <CardHeader>
          <CardTitle>Generar certificado</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3 max-w-3xl">
          <div className="space-y-2">
            <Label>Estudiante</Label>
            <select className={selectClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
              {students.map((s) => (
                <option key={s.uid} value={s.uid}>{s.displayName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleGenerate} disabled={generating || !user}>
              {generating ? "Generando..." : "Generar certificado"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        keyField="id"
        data={certificates}
        columns={[
          { key: "number", header: "Número", render: (c) => c.certificateNumber },
          { key: "student", header: "Estudiante", render: (c) => c.studentName },
          { key: "course", header: "Curso", render: (c) => c.courseTitle },
          { key: "date", header: "Emitido", render: (c) => formatDate(c.issuedAt) },
          {
            key: "status",
            header: "Estado",
            render: (c) => (
              <Badge variant={c.status === "active" ? "default" : "secondary"}>
                {c.status === "active" ? "Activo" : "Revocado"}
              </Badge>
            ),
          },
          {
            key: "download",
            header: "PDF",
            render: (c) => (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  const res = await fetch(`/api/certificates/${c.id}`);
                  const data = await res.json();
                  if (data.url) window.open(data.url, "_blank");
                }}
              >
                Descargar
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
