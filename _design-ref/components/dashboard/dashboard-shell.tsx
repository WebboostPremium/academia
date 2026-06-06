'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, LogOut } from 'lucide-react'
import type { AppUser } from '@/types'
import { navForRole, roleLabels } from '@/lib/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { Logo } from '@/components/shared/logo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet'

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function NavLinks({
  user,
  onNavigate,
}: {
  user: AppUser
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const items = navForRole(user.role)
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarInner({
  user,
  onNavigate,
}: {
  user: AppUser
  onNavigate?: () => void
}) {
  const { logout } = useAuth()
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo textClassName="text-sidebar-foreground" />
      </div>
      <NavLinks user={user} onNavigate={onNavigate} />
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="size-9 border border-sidebar-border">
            <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
              {initials(user.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {roleLabels[user.role]}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => logout()}
          className="mt-1 w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="size-[18px]" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

export function DashboardShell({
  user,
  title,
  children,
}: {
  user: AppUser
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <SidebarInner user={user} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-0 p-0">
              <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
              <SidebarInner user={user} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <h1 className="font-serif text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
