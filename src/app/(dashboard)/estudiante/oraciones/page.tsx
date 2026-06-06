"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getPrayers, getPrayerProgress, markPrayerLearned } from "@/lib/services/prayers";
import type { Prayer, PrayerProgress } from "@/types";

export default function EstudianteOracionesPage() {
  const { user, loading: authLoading } = useAuth();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [progress, setProgress] = useState<PrayerProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function load() {
      try {
        const [prayerList, progressList] = await Promise.all([
          getPrayers(),
          getPrayerProgress(user!.uid),
        ]);
        setPrayers(prayerList);
        setProgress(progressList);
      } catch {
        toast.error("Error al cargar las oraciones");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, authLoading]);

  async function handleMarkLearned(prayerId: string) {
    if (!user) return;
    setMarkingId(prayerId);
    try {
      await markPrayerLearned(user.uid, prayerId);
      setProgress((prev) => {
        const existing = prev.find((p) => p.prayerId === prayerId);
        if (existing) {
          return prev.map((p) => (p.prayerId === prayerId ? { ...p, learned: true } : p));
        }
        return [...prev, { id: `${user.uid}_${prayerId}`, userId: user.uid, prayerId, learned: true, practiceCount: 1 }];
      });
      toast.success("Oración marcada como aprendida");
    } catch {
      toast.error("No se pudo guardar el progreso");
    } finally {
      setMarkingId(null);
    }
  }

  function isLearned(prayerId: string) {
    return progress.some((p) => p.prayerId === prayerId && p.learned);
  }

  const learnedCount = prayers.filter((p) => isLearned(p.id)).length;
  const percent = prayers.length ? Math.round((learnedCount / prayers.length) * 100) : 0;

  if (authLoading || loading) {
    return <p className="text-muted-foreground">Cargando oraciones...</p>;
  }

  return (
    <div>
      <PageHeader
        title="Mis Oraciones"
        description="Aprende las oraciones fundamentales de la fe católica"
      />

      <Card className="mb-6">
        <CardContent className="pt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{learnedCount} de {prayers.length} aprendidas</span>
            <span>{percent}%</span>
          </div>
          <Progress value={percent} />
        </CardContent>
      </Card>

      {prayers.length === 0 ? (
        <EmptyState title="Sin oraciones" description="Las oraciones estarán disponibles pronto" />
      ) : (
        <div className="space-y-4">
          {prayers.map((prayer) => {
            const learned = isLearned(prayer.id);
            return (
              <Card key={prayer.id}>
                <CardHeader className="flex flex-row items-start gap-3">
                  {learned ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-base">{prayer.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed">{prayer.text}</p>
                  {prayer.audioUrl && (
                    <audio controls className="w-full" src={prayer.audioUrl}>
                      Tu navegador no soporta audio
                    </audio>
                  )}
                  {!learned && (
                    <Button
                      size="sm"
                      disabled={markingId === prayer.id}
                      onClick={() => handleMarkLearned(prayer.id)}
                    >
                      {markingId === prayer.id ? "Guardando..." : "Marcar como aprendida"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
