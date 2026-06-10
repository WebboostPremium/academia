"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { getActivityLogs } from "@/lib/services/activity-logs";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { ActivityLog } from "@/types/activity-log";

const ACTION_LABELS: Record<string, string> = {
  "course.create": "Curso creado",
  "course.duplicate": "Curso duplicado",
  "course.publish": "Curso publicado",
  "payment.approved": "Pago aprobado",
  "certificate.issue": "Certificado emitido",
  "coupon.create": "Cupón creado",
  register: "Registro",
  login: "Inicio de sesión",
  "settings.update": "Configuración",
};

export default function ActividadAdminPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActivityLogs(150)
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Cargando actividad...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Registro de actividad" description="Auditoría de acciones en la plataforma" />
      <DataTable
        keyField="id"
        data={logs}
        columns={[
          {
            key: "date",
            header: "Fecha",
            render: (l) => l.createdAt.toLocaleString("es"),
          },
          { key: "user", header: "Usuario", render: (l) => l.userName },
          { key: "role", header: "Rol", render: (l) => ROLE_LABELS[l.userRole] ?? l.userRole },
          {
            key: "action",
            header: "Acción",
            render: (l) => (
              <Badge variant="outline">{ACTION_LABELS[l.action] ?? l.action}</Badge>
            ),
          },
          { key: "details", header: "Detalle", render: (l) => l.details ?? "—" },
        ]}
      />
    </div>
  );
}
