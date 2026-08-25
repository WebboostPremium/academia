"use client";

import { useEffect, useState } from "react";
import { HandHeart, Sparkles, X } from "lucide-react";

const STORAGE_KEY = "webboost-admin-notice-dismissed-v3";

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

      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Comunicado Webboost</p>
      <h2 className="mt-1 pr-8 font-serif text-lg font-semibold sm:text-xl">
        Acompañamiento y soporte continuo
      </h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Observamos que Catequesis Online aún no se está aprovechando en su totalidad.
        Desde <strong className="text-foreground">Webboost</strong> quedamos a su disposición
        para brindar capacitación, ajustes técnicos, mejoras o cualquier acompañamiento que
        requieran. Si desean nuestra asistencia, no duden en contactarnos.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="flex gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-border/60">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Plataforma lista para operar</p>
            <p className="text-xs text-muted-foreground">
              Cursos, lecciones, foro, anuncios y certificados se encuentran disponibles
              para el uso de su comunidad parroquial.
            </p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-border/60">
          <HandHeart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Soporte profesional</p>
            <p className="text-xs text-muted-foreground">
              Ante cualquier necesidad de cambios, mejoras o capacitación,{" "}
              <strong className="text-foreground">Webboost está disponible para asistirles</strong>.
              Estamos para servirles.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
