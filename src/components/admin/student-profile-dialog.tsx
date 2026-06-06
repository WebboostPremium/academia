"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { getUserEnrollments } from "@/lib/services/enrollments";
import { getCourse } from "@/lib/services/courses";
import { updateUser } from "@/lib/services/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppUser } from "@/types/user";
import type { Enrollment } from "@/types/course";

interface StudentProfileDialogProps {
  student: AppUser | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function StudentProfileDialog({ student, open, onClose, onUpdated }: StudentProfileDialogProps) {
  const [enrollments, setEnrollments] = useState<Array<{ enrollment: Enrollment; courseTitle: string }>>([]);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student || !open) return;
    setDisplayName(student.displayName);
    setPhone(student.phone ?? "");
    getUserEnrollments(student.uid).then(async (enrolls) => {
      const data = await Promise.all(
        enrolls.map(async (e) => {
          const course = await getCourse(e.courseId);
          return { enrollment: e, courseTitle: course?.title ?? e.courseId };
        })
      );
      setEnrollments(data);
    });
  }, [student, open]);

  if (!student || !open) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await updateUser(student!.uid, { displayName, phone: phone || undefined });
      onUpdated();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const initials = student.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Perfil del estudiante</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {student.photoURL ? (
              <Image src={student.photoURL} alt={student.displayName} width={64} height={64} className="h-16 w-16 rounded-full object-cover" unoptimized />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-lg font-bold text-white">{initials}</div>
            )}
            <div>
              <p className="font-semibold">{student.displayName}</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
              <Badge variant={student.status === "active" ? "default" : "secondary"} className="mt-1">
                {student.status === "active" ? "Activo" : "Bloqueado"}
              </Badge>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div>
            <h4 className="mb-2 font-medium">Cursos y progreso</h4>
            {enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin cursos inscritos</p>
            ) : (
              <div className="space-y-3">
                {enrollments.map(({ enrollment, courseTitle }) => (
                  <div key={enrollment.id} className="rounded-lg border p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{courseTitle}</span>
                      <span>{enrollment.progress.percentComplete}%</span>
                    </div>
                    <Progress value={enrollment.progress.percentComplete} className="mt-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
