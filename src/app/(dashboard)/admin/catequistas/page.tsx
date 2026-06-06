"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsers, updateUser, blockUser } from "@/lib/services/users";
import { getCourses } from "@/lib/services/courses";
import type { Course } from "@/types/course";
import { ROLES } from "@/lib/constants/roles";
import { formatDate } from "@/lib/utils/format";
import type { AppUser } from "@/types/user";

export default function CatequistasAdminPage() {
  const [catequistas, setCatequistas] = useState<AppUser[]>([]);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const [cats, studs, crs] = await Promise.all([
      getAllUsers(ROLES.CATEQUISTA),
      getAllUsers(ROLES.ESTUDIANTE),
      getCourses(),
    ]);
    setCatequistas(cats);
    setStudents(studs);
    setCourses(crs);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handlePromote() {
    const user = students.find((s) => s.email.toLowerCase() === promoteEmail.toLowerCase());
    if (!user) {
      toast.error("No se encontró un estudiante con ese correo");
      return;
    }
    try {
      await updateUser(user.uid, { role: ROLES.CATEQUISTA });
      toast.success(`${user.displayName} ahora es catequista`);
      setPromoteEmail("");
      await load();
    } catch {
      toast.error("Error al promover usuario");
    }
  }

  async function handleAssignCourses(uid: string, courseIds: string[]) {
    try {
      await updateUser(uid, { assignedCourseIds: courseIds });
      toast.success("Cursos asignados");
      await load();
      setAssigningId(null);
    } catch {
      toast.error("Error al asignar cursos");
    }
  }

  async function handleDemote(uid: string) {
    try {
      await updateUser(uid, { role: ROLES.ESTUDIANTE, assignedCatequistaId: undefined });
      toast.success("Usuario convertido a estudiante");
      await load();
    } catch {
      toast.error("Error al cambiar rol");
    }
  }

  async function handleBlock(uid: string, blocked: boolean) {
    try {
      await blockUser(uid, blocked);
      toast.success(blocked ? "Catequista bloqueado" : "Catequista desbloqueado");
      await load();
    } catch {
      toast.error("Error al cambiar estado");
    }
  }

  const assignedCount = (uid: string) => students.filter((s) => s.assignedCatequistaId === uid).length;

  if (loading) return <p className="text-muted-foreground">Cargando catequistas...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Catequistas" description="Gestiona el equipo de catequistas" />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Promover estudiante a catequista</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-2">
            <Label>Correo del estudiante</Label>
            <Input value={promoteEmail} onChange={(e) => setPromoteEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-64" />
          </div>
          <Button onClick={handlePromote}>Promover</Button>
        </CardContent>
      </Card>

      <DataTable
        keyField="uid"
        data={catequistas}
        columns={[
          { key: "name", header: "Nombre", render: (c) => c.displayName },
          { key: "email", header: "Correo", render: (c) => c.email },
          { key: "phone", header: "Teléfono", render: (c) => c.phone ?? "—" },
          { key: "students", header: "Estudiantes", render: (c) => assignedCount(c.uid) },
          { key: "courses", header: "Cursos", render: (c) => (c.assignedCourseIds?.length ?? 0) || "—" },
          {
            key: "status",
            header: "Estado",
            render: (c) => (
              <Badge variant={c.status === "active" ? "default" : "secondary"}>
                {c.status === "active" ? "Activo" : "Bloqueado"}
              </Badge>
            ),
          },
          { key: "created", header: "Registro", render: (c) => formatDate(c.createdAt) },
          {
            key: "actions",
            header: "Acciones",
            render: (c) => (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBlock(c.uid, c.status === "active")}>
                  {c.status === "active" ? "Bloquear" : "Desbloquear"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAssigningId(assigningId === c.uid ? null : c.uid)}>
                  Asignar cursos
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDemote(c.uid)}>
                  Quitar rol
                </Button>
                {assigningId === c.uid && (
                  <div className="mt-2 w-full space-y-1 rounded border p-2">
                    {courses.map((course) => (
                      <label key={course.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          defaultChecked={c.assignedCourseIds?.includes(course.id)}
                          onChange={(e) => {
                            const current = c.assignedCourseIds ?? [];
                            const next = e.target.checked
                              ? [...current, course.id]
                              : current.filter((id) => id !== course.id);
                            handleAssignCourses(c.uid, next);
                          }}
                        />
                        {course.title}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
