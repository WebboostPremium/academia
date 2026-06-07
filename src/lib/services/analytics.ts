import { getAllUsers } from "@/lib/services/users";
import { getCourses } from "@/lib/services/courses";
import { getPayments } from "@/lib/services/payments";
import { getCertificates } from "@/lib/services/certificates";
import { getSubmissions } from "@/lib/services/assignments";
import { getUpcomingClasses } from "@/lib/services/live-classes";
import { ROLES } from "@/lib/constants/roles";

export interface DashboardAnalytics {
  students: number;
  activeCourses: number;
  coursesSold: number;
  monthlyRevenue: number;
  annualRevenue: number;
  totalRevenue: number;
  certificates: number;
  pendingSubmissions: number;
  upcomingClasses: number;
  salesByMonth: Array<{ month: string; total: number; count: number }>;
  studentsByMonth: Array<{ month: string; count: number }>;
  certificatesByMonth: Array<{ month: string; count: number }>;
  topCourses: Array<{ name: string; value: number; revenue: number }>;
  revenueByMonth12: Array<{ month: string; total: number }>;
}

export async function getDashboardAnalytics(monthsBack = 6): Promise<DashboardAnalytics> {
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
  const monthlyRevenue = approved.filter((p) => p.approvedAt && p.approvedAt >= monthStart).reduce((s, p) => s + p.amount, 0);
  const annualRevenue = approved.filter((p) => p.approvedAt && p.approvedAt >= yearStart).reduce((s, p) => s + p.amount, 0);
  const totalRevenue = approved.reduce((s, p) => s + p.amount, 0);

  const monthBuckets = Array.from({ length: monthsBack }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("es", { month: "short", year: "2-digit" }) };
  });

  const salesByMonth = monthBuckets.map((m) => {
    const monthPayments = approved.filter(
      (p) => p.approvedAt && `${p.approvedAt.getFullYear()}-${p.approvedAt.getMonth()}` === m.key
    );
    return {
      month: m.label,
      total: monthPayments.reduce((s, p) => s + p.amount, 0),
      count: monthPayments.length,
    };
  });

  const studentsByMonth = monthBuckets.map((m) => ({
    month: m.label,
    count: students.filter((s) => `${s.createdAt.getFullYear()}-${s.createdAt.getMonth()}` === m.key).length,
  }));

  const certificatesByMonth = monthBuckets.map((m) => ({
    month: m.label,
    count: certificates.filter((c) => `${c.issuedAt.getFullYear()}-${c.issuedAt.getMonth()}` === m.key).length,
  }));

  const courseMap = new Map(courses.map((c) => [c.id, c.title]));
  const topCoursesMap: Record<string, { count: number; revenue: number }> = {};
  for (const p of approved) {
    const name = courseMap.get(p.courseId) ?? p.courseId;
    if (!topCoursesMap[name]) topCoursesMap[name] = { count: 0, revenue: 0 };
    topCoursesMap[name].count += 1;
    topCoursesMap[name].revenue += p.amount;
  }
  const topCourses = Object.entries(topCoursesMap)
    .map(([name, v]) => ({ name, value: v.count, revenue: v.revenue }))
    .sort((a, b) => b.value - a.value);

  const revenueByMonth12 = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString("es", { month: "short" });
    const total = approved
      .filter((p) => p.approvedAt && `${p.approvedAt.getFullYear()}-${p.approvedAt.getMonth()}` === key)
      .reduce((s, p) => s + p.amount, 0);
    return { month: label, total };
  });

  return {
    students: students.length,
    activeCourses: courses.length,
    coursesSold: approved.length,
    monthlyRevenue,
    annualRevenue,
    totalRevenue,
    certificates: certificates.length,
    pendingSubmissions: submissions.length,
    upcomingClasses: upcoming.length,
    salesByMonth,
    studentsByMonth,
    certificatesByMonth,
    topCourses,
    revenueByMonth12,
  };
}
