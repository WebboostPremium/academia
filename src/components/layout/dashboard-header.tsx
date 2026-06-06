"use client";

import Image from "next/image";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS } from "@/lib/constants/roles";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function DashboardHeader({ onMenuClick, title }: DashboardHeaderProps) {
  const { user, signOut } = useAuth();
  const initials = user?.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick} aria-label="Menú">
          <Menu className="h-5 w-5" />
        </Button>
        {title && <h2 className="hidden text-lg font-semibold md:block">{title}</h2>}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="w-64 rounded-full border-muted bg-muted/40 pl-9" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold leading-none">{user?.displayName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.role ? ROLE_LABELS[user.role] : ""}</p>
          </div>
          {user?.photoURL ? (
            <Image src={user.photoURL} alt={user.displayName} width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
              {initials}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Cerrar sesión" className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
