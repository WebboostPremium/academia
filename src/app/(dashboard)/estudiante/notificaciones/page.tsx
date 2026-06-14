"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Megaphone } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNotifications,
  markAllRead,
  markAsRead,
} from "@/lib/services/notifications";
import { formatDateTime } from "@/lib/utils/format";
import type { Notification } from "@/types";

const TYPE_LABELS: Record<Notification["type"], string> = {
  payment: "Pago",
  course: "Curso",
  assignment: "Tarea",
  certificate: "Certificado",
  forum: "Foro",
  class: "Clase",
  system: "Anuncio",
};

export default function EstudianteNotificacionesPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setNotifications(await getNotifications(user.uid));
    } catch {
      toast.error("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleOpen(notification: Notification) {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch {
        // seguir al enlace aunque falle marcar leída
      }
    }
  }

  async function handleMarkAllRead() {
    if (!user) return;
    try {
      await markAllRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("Todas las notificaciones marcadas como leídas");
    } catch {
      toast.error("No se pudieron marcar como leídas");
    }
  }

  const unread = notifications.filter((n) => !n.read).length;

  if (loading) {
    return <p className="text-muted-foreground">Cargando buzón...</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buzón de mensajes"
        description="Anuncios, avisos y notificaciones de la plataforma"
        action={
          unread > 0 ? (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Marcar todo leído
            </Button>
          ) : undefined
        }
      />

      {unread > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Bell className="h-4 w-4 text-primary" />
          Tienes <strong>{unread}</strong> notificación{unread === 1 ? "" : "es"} sin leer
        </div>
      )}

      {notifications.length === 0 ? (
        <EmptyState
          title="Buzón vacío"
          description="Cuando el administrador envíe un anuncio o haya novedades, aparecerán aquí"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const content = (
              <Card
                className={`transition hover:shadow-md ${!notification.read ? "border-primary/40 bg-primary/5" : ""}`}
              >
                <CardContent className="flex gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Megaphone className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={notification.read ? "secondary" : "default"}>
                        {TYPE_LABELS[notification.type]}
                      </Badge>
                      {!notification.read && (
                        <span className="text-xs font-medium text-primary">Nuevo</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </span>
                    </div>
                    <h3 className="mt-1 font-semibold">{notification.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  </div>
                </CardContent>
              </Card>
            );

            if (notification.link) {
              return (
                <Link
                  key={notification.id}
                  href={notification.link}
                  onClick={() => handleOpen(notification)}
                  className="block"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div key={notification.id} onClick={() => handleOpen(notification)} className="cursor-pointer">
                {content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
