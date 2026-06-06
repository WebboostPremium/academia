"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPayments } from "@/lib/services/payments";
import { getAllUsers } from "@/lib/services/users";
import { getCourses } from "@/lib/services/courses";
import { ROLES } from "@/lib/constants/roles";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { Payment } from "@/types";

const STATUS_LABELS: Record<Payment["status"], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  declined: "Rechazado",
  refunded: "Reembolsado",
};

export default function PagosAdminPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<Payment["status"] | "">("");
  const [courseFilter, setCourseFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);

  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  useEffect(() => {
    Promise.all([
      getPayments(),
      getAllUsers(ROLES.ESTUDIANTE),
      getCourses(),
    ]).then(([pays, studs, crs]) => {
      setPayments(pays);
      setUsers(Object.fromEntries(studs.map((s) => [s.uid, s.displayName])));
      setCourses(Object.fromEntries(crs.map((c) => [c.id, c.title])));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (courseFilter && p.courseId !== courseFilter) return false;
      if (userFilter && p.userId !== userFilter) return false;
      if (dateFrom && p.createdAt < new Date(dateFrom)) return false;
      if (dateTo && p.createdAt > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [payments, statusFilter, courseFilter, userFilter, dateFrom, dateTo]);

  if (loading) return <p className="text-muted-foreground">Cargando pagos...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Pagos Wompi" description="Pagos exitosos, rechazados y pendientes" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label>Estado</Label>
          <select className={selectClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Payment["status"] | "")}>
            <option value="">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobado</option>
            <option value="declined">Rechazado</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Curso</Label>
          <select className={selectClass} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(courses).map(([id, title]) => <option key={id} value={id}>{title}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Estudiante</Label>
          <select className={selectClass} value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(users).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Desde</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Hasta</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <DataTable
        keyField="id"
        data={filtered}
        columns={[
          { key: "user", header: "Estudiante", render: (p) => users[p.userId] ?? p.userId.slice(0, 8) },
          { key: "course", header: "Curso", render: (p) => courses[p.courseId] ?? p.courseId },
          { key: "amount", header: "Monto", render: (p) => formatCurrency(p.amount) },
          { key: "status", header: "Estado", render: (p) => <Badge variant={p.status === "approved" ? "default" : "secondary"}>{STATUS_LABELS[p.status]}</Badge> },
          { key: "reference", header: "Referencia Wompi", render: (p) => p.wompi?.reference ?? "—" },
          { key: "date", header: "Fecha", render: (p) => formatDateTime(p.createdAt) },
        ]}
      />
    </div>
  );
}
