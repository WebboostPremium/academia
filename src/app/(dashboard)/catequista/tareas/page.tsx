"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getStudentsByCatequista } from "@/lib/services/users";
import { getSubmissions, getAssignments, gradeSubmission } from "@/lib/services/assignments";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/format";
import type { Submission, Assignment } from "@/types";

interface PendingRow extends Record<string, unknown> {
  id: string;
  studentName: string;
  assignmentTitle: string;
  fileName: string;
  fileUrl: string;
  submittedAt: Date;
  maxScore: number;
}

export default function TareasPage() {
  const { user } = useAuth();
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadPending() {
    if (!user) return;
    const students = await getStudentsByCatequista(user.uid);
    const studentIds = new Set(students.map((s) => s.uid));
    const studentMap = new Map(students.map((s) => [s.uid, s.displayName]));

    const [submissions, assignments] = await Promise.all([
      getSubmissions({ status: "pending" }),
      getAssignments(),
    ]);
    const assignmentMap = new Map(assignments.map((a: Assignment) => [a.id, a]));

    const rows = submissions
      .filter((s: Submission) => studentIds.has(s.userId))
      .map((s: Submission) => {
        const assignment = assignmentMap.get(s.assignmentId);
        return {
          id: s.id,
          studentName: studentMap.get(s.userId) ?? s.userId,
          assignmentTitle: assignment?.title ?? "Tarea",
          fileName: s.fileName,
          fileUrl: s.fileUrl,
          submittedAt: s.submittedAt,
          maxScore: assignment?.maxScore ?? 100,
        };
      });

    setPending(rows);
    setLoading(false);
  }

  useEffect(() => {
    loadPending();
  }, [user]);

  async function handleGrade(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !gradingId) return;

    const scoreNum = Number(score);
    if (Number.isNaN(scoreNum) || scoreNum < 0) {
      toast.error("Ingresa una calificación válida");
      return;
    }

    setSaving(true);
    try {
      await gradeSubmission(gradingId, scoreNum, feedback, user.uid);
      toast.success("Tarea calificada correctamente");
      setGradingId(null);
      setScore("");
      setFeedback("");
      await loadPending();
    } catch {
      toast.error("Error al calificar la tarea");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Cargando tareas...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tareas pendientes"
        description="Entregas de estudiantes por calificar"
      />

      {gradingId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Calificar entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGrade} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="score">Calificación</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  max={pending.find((p) => p.id === gradingId)?.maxScore as number}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="feedback">Retroalimentación</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Comentarios para el estudiante..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar calificación"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setGradingId(null)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={pending}
        columns={[
          { key: "student", header: "Estudiante", render: (r) => r.studentName as string },
          { key: "assignment", header: "Tarea", render: (r) => r.assignmentTitle as string },
          {
            key: "file",
            header: "Archivo",
            render: (r) => (
              <a href={r.fileUrl as string} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {r.fileName as string}
              </a>
            ),
          },
          { key: "date", header: "Fecha", render: (r) => formatDate(r.submittedAt as Date) },
          {
            key: "action",
            header: "Acción",
            render: (r) => (
              <Button size="sm" onClick={() => setGradingId(r.id as string)}>
                Calificar
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
