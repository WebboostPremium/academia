"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getStudentsByCatequista } from "@/lib/services/users";
import { getSacramentalRecords, updateSacramentalStatus, updateRequirement, addObservation } from "@/lib/services/sacramental";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SacramentalRecord } from "@/types";

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

export default function SacramentalPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<SacramentalRecord[]>([]);
  const [studentNames, setStudentNames] = useState<Record<string, string>>({});
  const [observationText, setObservationText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!user) return;
    const students = await getStudentsByCatequista(user.uid);
    const studentIds = new Set(students.map((s) => s.uid));
    setStudentNames(Object.fromEntries(students.map((s) => [s.uid, s.displayName])));

    const all = await getSacramentalRecords();
    setRecords(all.filter((r) => studentIds.has(r.userId)));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [user]);

  async function handleStatusChange(id: string, status: SacramentalRecord["status"]) {
    try {
      await updateSacramentalStatus(id, status);
      toast.success("Estado actualizado");
      await load();
    } catch {
      toast.error("Error al actualizar estado");
    }
  }

  async function handleRequirement(recordId: string, requirementId: string, completed: boolean) {
    if (!user) return;
    try {
      await updateRequirement(recordId, requirementId, completed, user.uid);
      toast.success("Requisito actualizado");
      await load();
    } catch {
      toast.error("Error al actualizar requisito");
    }
  }

  async function handleObservation(recordId: string) {
    if (!user) return;
    const text = observationText[recordId]?.trim();
    if (!text) return;
    try {
      await addObservation(recordId, text, user.uid, user.role);
      toast.success("Observación agregada");
      setObservationText((prev) => ({ ...prev, [recordId]: "" }));
      await load();
    } catch {
      toast.error("Error al agregar observación");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Cargando registros sacramentales...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión sacramental"
        description="Consulta y actualiza el avance sacramental de tus estudiantes"
      />

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay registros sacramentales para tus estudiantes</p>
      ) : (
        <div className="space-y-4">
          {records.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    {studentNames[r.userId] ?? r.userId} — {SACRAMENT_LABELS[r.sacrament]}
                  </CardTitle>
                  <Badge>{STATUS_LABELS[r.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Estado sacramental</Label>
                  <select
                    value={r.status}
                    onChange={(e) => handleStatusChange(r.id, e.target.value as SacramentalRecord["status"])}
                    className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {r.requirements.length > 0 && (
                  <div className="space-y-2">
                    <Label>Requisitos</Label>
                    <ul className="space-y-2">
                      {r.requirements.map((req) => (
                        <li key={req.id} className="flex items-center gap-3 text-sm">
                          <input
                            type="checkbox"
                            checked={req.completed}
                            onChange={(e) => handleRequirement(r.id, req.id, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span className={req.completed ? "text-muted-foreground line-through" : ""}>
                            {req.title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.observations.length > 0 && (
                  <div className="space-y-1 rounded-lg bg-muted/50 p-3">
                    <Label>Observaciones</Label>
                    {r.observations.map((obs, i) => (
                      <p key={i} className="text-sm text-muted-foreground">
                        {obs.text}
                      </p>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`obs-${r.id}`}>Nueva observación</Label>
                  <Textarea
                    id={`obs-${r.id}`}
                    value={observationText[r.id] ?? ""}
                    onChange={(e) => setObservationText((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    rows={2}
                    placeholder="Nota pastoral o catequética..."
                  />
                  <Button size="sm" onClick={() => handleObservation(r.id)}>
                    Agregar observación
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
