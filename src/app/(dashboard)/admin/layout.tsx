import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNavItems } from "@/lib/navigation/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell navItems={adminNavItems}>{children}</DashboardShell>;
}
