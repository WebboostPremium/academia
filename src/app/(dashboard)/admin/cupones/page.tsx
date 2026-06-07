"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCoupons, createCoupon, updateCoupon } from "@/lib/services/coupons";
import { getCourses } from "@/lib/services/courses";
import { logActivity } from "@/lib/services/activity-logs";
import type { Coupon } from "@/types/coupon";
import type { Course } from "@/types/course";

export default function CuponesAdminPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percent" as Coupon["type"],
    value: "10",
    courseId: "",
    maxUses: "",
    expiresAt: "",
  });

  async function load() {
    const [c, cr] = await Promise.all([getCoupons(), getCourses()]);
    setCoupons(c);
    setCourses(cr);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await createCoupon({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        courseId: form.courseId || undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
        status: "active",
      });
      await logActivity({
        userId: user.uid,
        userName: user.displayName,
        userRole: user.role,
        action: "coupon.create",
        entityType: "coupon",
        details: `Cupón ${form.code}`,
      });
      toast.success("Cupón creado");
      setShowForm(false);
      setForm({ code: "", type: "percent", value: "10", courseId: "", maxUses: "", expiresAt: "" });
      await load();
    } catch {
      toast.error("Error al crear cupón");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupones de descuento"
        description="Promociones para cursos individuales o generales"
        action={<Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancelar" : "Nuevo cupón"}</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Crear cupón</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="COMUNION20" />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Coupon["type"] })}>
                  <option value="percent">Porcentaje (%)</option>
                  <option value="fixed">Monto fijo (centavos)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Valor {form.type === "percent" ? "(%)" : "(centavos)"}</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Curso (opcional)</Label>
                <select className="flex h-10 w-full rounded-md border px-3 text-sm" value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                  <option value="">Todos los cursos</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Usos máximos</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expira</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Crear cupón</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={coupons}
        columns={[
          { key: "code", header: "Código", render: (c) => <span className="font-mono font-semibold">{c.code}</span> },
          { key: "value", header: "Descuento", render: (c) => c.type === "percent" ? `${c.value}%` : `$${(c.value / 100).toFixed(2)}` },
          { key: "uses", header: "Usos", render: (c) => `${c.usedCount}${c.maxUses ? ` / ${c.maxUses}` : ""}` },
          { key: "status", header: "Estado", render: (c) => <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (c) => (
              <Button size="sm" variant="outline" onClick={() => updateCoupon(c.id, { status: c.status === "active" ? "inactive" : "active" }).then(load)}>
                {c.status === "active" ? "Desactivar" : "Activar"}
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
