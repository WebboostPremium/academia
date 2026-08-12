"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Headphones, X } from "lucide-react";

const STORAGE_KEY = "webboost-admin-notice-dismissed";

export function WebboostNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <aside className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-accent/10 p-4 shadow-sm sm:p-5">
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "1");
          setVisible(false);
        }}
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Cerrar aviso"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Aviso Webboost</p>
      <h2 className="mt-1 pr-8 font-serif text-lg font-semibold sm:text-xl">
        Recuerda la fecha de pago de tu plataforma
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Este es un recordatorio de tu <strong className="text-foreground">fecha de pago</strong> por
        el servicio y mantenimiento de Catequesis Online. Mantener el pago al día asegura que el
        sitio, los cursos y el panel sigan funcionando sin interrupciones.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-border/60">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Pago de la plataforma</p>
            <p className="text-xs text-muted-foreground">
              Anota tu fecha de pago mensual y coordínala con Webboost para no perder el servicio.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-border/60">
          <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">¿Necesitas un cambio?</p>
            <p className="text-xs text-muted-foreground">
              Cualquier ajuste, mejora o función nueva que quieras en la plataforma,{" "}
              <strong className="text-foreground">Webboost está para ayudarte</strong>.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
