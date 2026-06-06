import Link from 'next/link'
import { Logo } from '@/components/shared/logo'
import { Button } from '@/components/ui/button'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Inicio">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="#cursos"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cursos
          </a>
          <a
            href="#como-funciona"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Cómo funciona
          </a>
          <a
            href="#testimonios"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Testimonios
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild className="hidden sm:inline-flex">
            <Link href="/login">Ingresar</Link>
          </Button>
          <Button asChild>
            <Link href="/registro">Inscribirme</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
