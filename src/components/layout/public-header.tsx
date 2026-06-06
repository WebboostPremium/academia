"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const NAV = [
  { label: "Cursos", href: "/#cursos" },
  { label: "Cómo funciona", href: "/#como-funciona" },
  { label: "Testimonios", href: "/#testimonios" },
  { label: "FAQ", href: "/#faq" },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo variant="dark" size="md" />
        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/cursos"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Programas
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild>
            <Link href="/registro">Inscribirme</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
