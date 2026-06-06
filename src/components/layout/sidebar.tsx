"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/logo";

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  items: NavItem[];
  className?: string;
}

export function Sidebar({ items, className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex h-full w-[240px] shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:w-64", className)}>
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo variant="light" size="sm" href="/" textClassName="text-sidebar-foreground" />
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" &&
              !item.href.endsWith("/admin") &&
              !item.href.endsWith("/catequista") &&
              !item.href.endsWith("/estudiante") &&
              pathname.startsWith(`${item.href}/`)) ||
            (item.href === "/admin" && pathname === "/admin") ||
            (item.href === "/catequista" && pathname === "/catequista") ||
            (item.href === "/estudiante" && pathname === "/estudiante");
          const isExactDashboard = ["/admin", "/catequista", "/estudiante"].includes(item.href);
          const isActive = isExactDashboard ? pathname === item.href : active;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.title}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
