"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, DollarSign, Award, FileText, Calendar } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getAllUsers } from "@/lib/services/users";
import { getCourses } from "@/lib/services/courses";
import { getPayments } from "@/lib/services/payments";
import { getCertificates } from "@/lib/services/certificates";
import { getSubmissions } from "@/lib/services/assignments";
import { getUpcomingClasses } from "@/lib/services/live-classes";
import { ROLES } from "@/lib/constants/roles";
import { formatCurrency } from "@/lib/utils/format";
import { SalesChart, StudentsChart, CoursesPieChart, CertificatesChart } from "@/components/dashboard/charts";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    activeCourses: 0,
    monthlyRevenue: 0,
    annualRevenue: 0,
    totalRevenue: 0,
    coursesSold: 0,
    certificates: 0,
    pendingSubmissions: 0,
    upcomingClasses: 0,
  });
  const [salesData, setSalesData] = useState<Array<{ month: string; total: number }>>([]);
  const [studentsData, setStudentsData] = useState<Array<{ month: string; count: number }>>([]);
  const [coursesData, setCoursesData] = useState<Array<{ name: string; value: number }>>([]);
  const [certificatesData, setCertificatesData] = useState<Array<{ month: string; count: number }>>([]);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const [students, courses, payments, certificates, submissions, upcoming] = await Promise.all([
        getAllUsers(ROLES.ESTUDIANTE),
        getCourses("published"),
        getPayments(),
        getCertificates(),
        getSubmissions({ status: "pending" }),
        getUpcomingClasses(),
      ]);

      const approved = payments.filter((p) => p.status === "approved");
      const monthlyRevenue = approved
        .filter((p) => p.approvedAt && p.approvedAt >= monthStart)
        .reduce((sum, p) => sum + p.amount, 0);
      const annualRevenue = approved
        .filter((p) => p.approvedAt && p.approvedAt >= yearStart)
        .reduce((sum, p) => sum + p.amount, 0);
      const totalRevenue = approved.reduce((sum, p) => sum + p.amount, 0);
      const coursesSold = approved.length;

      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("es", { month: "short" }) };
      });

      setSalesData(months.map((m) => ({
        month: m.label,
        total: approved.filter((p) => p.approvedAt && `${p.approvedAt.getFullYear()}-${p.approvedAt.getMonth()}` === m.key).reduce((s, p) => s + p.amount, 0),
      })));

      setStudentsData(months.map((m) => ({
        month: m.label,
        count: students.filter((s) => `${s.createdAt.getFullYear()}-${s.createdAt.getMonth()}` === m.key).length,
      })));

      const courseSales: Record<string, number> = {};
      for (const p of approved) {
        const c = courses.find((c) => c.id === p.courseId);
        const name = c?.title ?? p.courseId;
        courseSales[name] = (courseSales[name] ?? 0) + 1;
      }
      setCoursesData(Object.entries(courseSales).map(([name, value]) => ({ name, value })));

      setCertificatesData(months.map((m) => ({
        month: m.label,
        count: certificates.filter((c) => `${c.issuedAt.getFullYear()}-${c.issuedAt.getMonth()}` === m.key).length,
      })));

      setStats({
        students: students.length,
        activeCourses: courses.length,
        monthlyRevenue,
        annualRevenue,
        totalRevenue,
        coursesSold,
        certificates: certificates.length,
        pendingSubmissions: submissions.length,
        upcomingClasses: upcoming.length,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-muted-foreground">Cargando métricas...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de la plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Estudiantes" value={stats.students} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Cursos Activos" value={stats.activeCourses} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Cursos Vendidos" value={stats.coursesSold} icon={<BookOpen className="h-5 w-5" />} />
        <StatCard title="Ingresos del Mes" value={formatCurrency(stats.monthlyRevenue)} icon={<DollarSign className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ingresos Anuales" value={formatCurrency(stats.annualRevenue)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Certificados Emitidos" value={stats.certificates} icon={<Award className="h-5 w-5" />} />
        <StatCard title="Tareas Pendientes" value={stats.pendingSubmissions} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Clases Programadas" value={stats.upcomingClasses} icon={<Calendar className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h3 className="mb-4 font-bold">Ventas por mes</h3>
          <SalesChart data={salesData} />
        </div>
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h3 className="mb-4 font-bold">Nuevos estudiantes</h3>
          <StudentsChart data={studentsData} />
        </div>
        {coursesData.length > 0 && (
          <div className="card-shadow rounded-2xl bg-white p-5">
            <h3 className="mb-4 font-bold">Cursos más vendidos</h3>
            <CoursesPieChart data={coursesData} />
          </div>
        )}
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h3 className="mb-4 font-bold">Certificados emitidos</h3>
          <CertificatesChart data={certificatesData} />
        </div>
        <div className="card-shadow rounded-2xl bg-white p-5">
          <h3 className="mb-4 font-bold">Tareas pendientes</h3>
          {stats.pendingSubmissions > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-orange-50 px-4 py-3">
                <span className="text-sm">Entregas por calificar</span>
                <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">{stats.pendingSubmissions}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay tareas pendientes</p>
          )}
        </div>
      </div>
    </div>
  );
}
