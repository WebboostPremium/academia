import { DashboardShell } from "@/components/layout/dashboard-shell";
import { adminNavItems } from "@/lib/navigation/admin-nav";
import { WebboostNotice } from "@/components/admin/webboost-notice";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell navItems={adminNavItems}>
      <div className="space-y-6">
        <WebboostNotice />
        {children}
      </div>
    </DashboardShell>
  );
}
