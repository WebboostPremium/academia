"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { getSacramentalRecords, updateSacramentalStatus } from "@/lib/services/sacramental";
import { getCourses } from "@/lib/services/courses";
import { formatDate } from "@/lib/utils/format";
import type { SacramentalRecord } from "@/types";
import type { Course } from "@/types/course";

const STATUS_LABELS: Record<SacramentalRecord["status"], string> = {
  not_started: "No iniciado",
  in_progress: "En progreso",
  requirements_met: "Requisitos cumplidos",
  scheduled: "Programado",
  completed: "Completado",
};

const SACRAMENT_LABELS: Record<SacramentalRecord["sacrament"], string> = {
  bautismo: "Bautismo",
  primera_comunion: "Primera Comunión",
  confirmacion: "Confirmación",
};

export default function SacramentalAdminPage() {
  const [records, setRecords] = useState<SacramentalRecord[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function load(filter?: string) {
    const [recs, crs] = await Promise.all([
      getSacramentalRecords(filter || undefined),
      getCourses(),
    ]);
    setRecords(recs);
    setCourses(crs);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    getSacramentalRecords(courseFilter || undefined).then(setRecords);
  }, [courseFilter, loading]);

  async function handleStatusChange(id: string, status: SacramentalRecord["status"]) {
    try {
      await updateSacramentalStatus(id, status);
      toast.success("Estado actualizado");
      setRecords(await getSacramentalRecords(courseFilter || undefined));
    } catch {
      toast.error("Error al actualizar el estado");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando registros...</p>;

  const courseTitle = (id: string) => courses.find((c) => c.id === id)?.title ?? id.slice(0, 8) + "…";

  return (
    <div className="space-y-6">
      <PageHeader title="Gestión Sacramental" description="Seguimiento de requisitos sacramentales" />

      <div className="max-w-xs space-y-2">
        <Label>Filtrar por curso</Label>
        <select className={selectClass} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
          <option value="">Todos</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      <DataTable
        keyField="id"
        data={records}
        columns={[
          { key: "user", header: "Estudiante", render: (r) => r.userId.slice(0, 8) + "…" },
          { key: "course", header: "Curso", render: (r) => courseTitle(r.courseId) },
          { key: "sacrament", header: "Sacramento", render: (r) => SACRAMENT_LABELS[r.sacrament] },
          {
            key: "requirements",
            header: "Requisitos",
            render: (r) => `${r.requirements.filter((req) => req.completed).length}/${r.requirements.length}`,
          },
          {
            key: "status",
            header: "Estado",
            render: (r) => (
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={r.status}
                onChange={(e) => handleStatusChange(r.id, e.target.value as SacramentalRecord["status"])}
              >
                {(Object.keys(STATUS_LABELS) as SacramentalRecord["status"][]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
            ),
          },
          { key: "updated", header: "Actualizado", render: (r) => formatDate(r.updatedAt) },
        ]}
      />
    </div>
  );
}
