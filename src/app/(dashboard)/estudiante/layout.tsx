import { DashboardShell } from "@/components/layout/dashboard-shell";
import { estudianteNavItems } from "@/lib/navigation/estudiante-nav";

export default function EstudianteLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={estudianteNavItems}>{children}</DashboardShell>;
}
