"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/services/settings";

export function PublicFooter() {
  const [institution, setInstitution] = useState(DEFAULT_SETTINGS.institution);

  useEffect(() => {
    getSettings().then((s) => {
      if (s?.institution) setInstitution(s.institution);
    });
  }, []);

  const social = institution.social ?? {};

  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row sm:items-start">
          <div className="space-y-3 text-center sm:text-left">
            <Logo variant="dark" size="sm" />
            <p className="max-w-xs text-sm text-muted-foreground">
              Formación católica en línea para Bautismo, Primera Comunión y Confirmación.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
              {social.facebook && (
                <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                  Facebook <ExternalLink className="size-3.5" />
                </a>
              )}
              {social.instagram && (
                <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                  Instagram <ExternalLink className="size-3.5" />
                </a>
              )}
              {social.youtube && (
                <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary">
                  YouTube <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <h4 className="font-medium">Programas</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><Link href="/cursos/bautismo" className="hover:text-foreground">Bautismo</Link></li>
                <li><Link href="/cursos/primera-comunion" className="hover:text-foreground">Primera Comunión</Link></li>
                <li><Link href="/cursos/confirmacion" className="hover:text-foreground">Confirmación</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Enlaces</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li><Link href="/nosotros" className="hover:text-foreground">Nosotros</Link></li>
                <li><Link href="/contacto" className="hover:text-foreground">Contacto</Link></li>
                <li><Link href="/login" className="hover:text-foreground">Ingresar</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-medium">Contacto</h4>
              <ul className="mt-3 space-y-2 text-muted-foreground">
                <li>{institution.email}</li>
                {institution.phone && <li>{institution.phone}</li>}
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground sm:text-left">
          &copy; {new Date().getFullYear()} {institution.name}. Formación en la fe.
        </p>
      </div>
    </footer>
  );
}
