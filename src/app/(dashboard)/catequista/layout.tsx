import { DashboardShell } from "@/components/layout/dashboard-shell";
import { catequistaNavItems } from "@/lib/navigation/catequista-nav";

export default function CatequistaLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={catequistaNavItems}>{children}</DashboardShell>;
}
