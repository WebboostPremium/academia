"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { getAllUsers, blockUser, updateUser } from "@/lib/services/users";
import { getUserEnrollments, resetEnrollmentProgress } from "@/lib/services/enrollments";
import { StudentProfileDialog } from "@/components/admin/student-profile-dialog";
import { ROLES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import type { AppUser } from "@/types/user";

export default function EstudiantesAdminPage() {
  const [students, setStudents] = useState<AppUser[]>([]);
  const [catequistas, setCatequistas] = useState<AppUser[]>([]);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const selectClass =
    "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  async function load() {
    const [allStudents, allCatequistas] = await Promise.all([
      getAllUsers(ROLES.ESTUDIANTE),
      getAllUsers(ROLES.CATEQUISTA),
    ]);
    setStudents(allStudents);
    setCatequistas(allCatequistas);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleBlock(uid: string, blocked: boolean) {
    try {
      await blockUser(uid, blocked);
      toast.success(blocked ? "Estudiante bloqueado" : "Estudiante desbloqueado");
      await load();
    } catch {
      toast.error("Error al cambiar el estado");
    }
  }

  async function handleResetProgress(uid: string) {
    if (!confirm("¿Reiniciar el progreso de todos los cursos de este estudiante?")) return;
    try {
      const enrollments = await getUserEnrollments(uid);
      await Promise.all(enrollments.map((e) => resetEnrollmentProgress(e.id)));
      toast.success("Progreso reiniciado");
    } catch {
      toast.error("Error al reiniciar progreso");
    }
  }

  async function handleAssignCatequista(uid: string, catequistaId: string) {
    try {
      await updateUser(uid, { assignedCatequistaId: catequistaId || undefined });
      toast.success("Catequista asignado");
      await load();
    } catch {
      toast.error("Error al asignar catequista");
    }
  }

  const catequistaName = (id?: string) =>
    catequistas.find((c) => c.uid === id)?.displayName ?? "Sin asignar";

  if (loading) return <p className="text-muted-foreground">Cargando estudiantes...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Estudiantes" description="Gestiona inscripciones y asignaciones" />

      <StudentProfileDialog
        student={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onUpdated={load}
      />

      <DataTable
        keyField="uid"
        data={students}
        columns={[
          {
            key: "photo",
            header: "Foto",
            render: (s) => s.photoURL ? (
              <Image src={s.photoURL} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs text-white">
                {s.displayName[0]}
              </div>
            ),
          },
          { key: "name", header: "Nombre", render: (s) => s.displayName },
          { key: "phone", header: "Teléfono", render: (s) => s.phone ?? "—" },
          { key: "email", header: "Correo", render: (s) => s.email },
          {
            key: "status",
            header: "Estado",
            render: (s) => (
              <Badge variant={s.status === "active" ? "default" : "secondary"}>
                {s.status === "active" ? "Activo" : "Bloqueado"}
              </Badge>
            ),
          },
          { key: "catequista", header: "Catequista", render: (s) => catequistaName(s.assignedCatequistaId) },
          { key: "created", header: "Registro", render: (s) => formatDate(s.createdAt) },
          {
            key: "actions",
            header: "Acciones",
            render: (s) => (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelected(s)}>Ver perfil</Button>
                <Button size="sm" variant="outline" onClick={() => handleBlock(s.uid, s.status === "active")}>
                  {s.status === "active" ? "Bloquear" : "Desbloquear"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleResetProgress(s.uid)}>
                  Reiniciar progreso
                </Button>
                <div className="flex items-center gap-1">
                  <Label className="sr-only">Asignar catequista</Label>
                  <select
                    className={selectClass}
                    value={s.assignedCatequistaId ?? ""}
                    onChange={(e) => handleAssignCatequista(s.uid, e.target.value)}
                  >
                    <option value="">Sin asignar</option>
                    {catequistas.map((c) => (
                      <option key={c.uid} value={c.uid}>{c.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
