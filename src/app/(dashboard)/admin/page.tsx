"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, DollarSign, Award, FileText, Calendar, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { getDashboardAnalytics } from "@/lib/services/analytics";
import { formatCurrency } from "@/lib/utils/format";
import {
  SalesChart,
  StudentsChart,
  CoursesPieChart,
  CertificatesChart,
  RevenueAreaChart,
  TopCoursesBarChart,
} from "@/components/dashboard/charts";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getDashboardAnalytics>> | null>(null);

  useEffect(() => {
    getDashboardAnalytics(6).then((analytics) => {
      setData(analytics);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return <p className="text-muted-foreground">Cargando métricas...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Dashboard Analytics</h1>
        <p className="text-muted-foreground">Resumen general de la academia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Estudiantes" value={data.students} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Cursos Activos" value={data.activeCourses} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Cursos Vendidos" value={data.coursesSold} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Ingresos del Mes" value={formatCurrency(data.monthlyRevenue)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ingresos Anuales" value={formatCurrency(data.annualRevenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Ingresos Totales" value={formatCurrency(data.totalRevenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Certificados Emitidos" value={data.certificates} icon={<Award className="h-5 w-5" />} />
        <StatCard title="Clases Programadas" value={data.upcomingClasses} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-ring p-5">
          <h3 className="mb-4 font-serif font-semibold">Ventas por mes</h3>
          <SalesChart data={data.salesByMonth.map((s) => ({ month: s.month, total: s.total }))} />
        </div>
        <div className="card-ring p-5">
          <h3 className="mb-4 font-serif font-semibold">Ingresos — últimos 12 meses</h3>
          <RevenueAreaChart data={data.revenueByMonth12} />
        </div>
        <div className="card-ring p-5">
          <h3 className="mb-4 font-serif font-semibold">Nuevos estudiantes</h3>
          <StudentsChart data={data.studentsByMonth} />
        </div>
        <div className="card-ring p-5">
          <h3 className="mb-4 font-serif font-semibold">Certificados emitidos</h3>
          <CertificatesChart data={data.certificatesByMonth} />
        </div>
        {data.topCourses.length > 0 && (
          <>
            <div className="card-ring p-5">
              <h3 className="mb-4 font-serif font-semibold">Cursos más vendidos</h3>
              <CoursesPieChart data={data.topCourses.map((c) => ({ name: c.name, value: c.value }))} />
            </div>
            <div className="card-ring p-5">
              <h3 className="mb-4 font-serif font-semibold">Ingresos por curso</h3>
              <TopCoursesBarChart data={data.topCourses} />
            </div>
          </>
        )}
        <div className="card-ring p-5 lg:col-span-2">
          <h3 className="mb-4 font-serif font-semibold">Tareas pendientes de calificar</h3>
          {data.pendingSubmissions > 0 ? (
            <div className="flex items-center justify-between rounded-lg bg-accent/20 px-4 py-3">
              <span className="text-sm">Entregas por revisar</span>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                {data.pendingSubmissions}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
