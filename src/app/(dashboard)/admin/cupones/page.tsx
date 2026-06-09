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
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/services/coupons";
import { getCourses } from "@/lib/services/courses";
import { logActivity } from "@/lib/services/activity-logs";
import type { Coupon } from "@/types/coupon";
import type { Course } from "@/types/course";

const emptyForm = {
  code: "",
  type: "percent" as Coupon["type"],
  value: "10",
  courseId: "",
  maxUses: "",
  expiresAt: "",
};

export default function CuponesAdminPage() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  async function load() {
    const [c, cr] = await Promise.all([getCoupons(), getCourses()]);
    setCoupons(c);
    setCourses(cr);
  }

  useEffect(() => { load(); }, []);

  function openEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      courseId: coupon.courseId ?? "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : "",
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const payload = {
        code: form.code,
        type: form.type,
        value: Number(form.value),
        courseId: form.courseId || undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined,
        status: "active" as const,
      };

      if (editingId) {
        await updateCoupon(editingId, payload);
        toast.success("Cupón actualizado");
      } else {
        await createCoupon(payload);
        await logActivity({
          userId: user.uid,
          userName: user.displayName,
          userRole: user.role,
          action: "coupon.create",
          entityType: "coupon",
          details: `Cupón ${form.code}`,
        });
        toast.success("Cupón creado");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar cupón");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cupón?")) return;
    try {
      await deleteCoupon(id);
      toast.success("Cupón eliminado");
      await load();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cupones de descuento"
        description="Promociones para cursos individuales o generales"
        action={
          <Button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}>
            {showForm ? "Cancelar" : "Nuevo cupón"}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Editar cupón" : "Crear cupón"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
                <Input type="number" min={1} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required />
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
                <Input type="number" min={1} value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Expira</Label>
                <Input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">{editingId ? "Guardar cambios" : "Crear cupón"}</Button>
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
          { key: "expires", header: "Expira", render: (c) => c.expiresAt ? c.expiresAt.toLocaleDateString("es") : "—" },
          { key: "status", header: "Estado", render: (c) => <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge> },
          {
            key: "actions",
            header: "Acciones",
            render: (c) => (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => updateCoupon(c.id, { status: c.status === "active" ? "inactive" : "active" }).then(load)}>
                  {c.status === "active" ? "Desactivar" : "Activar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
