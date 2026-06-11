"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrayers, createPrayer, updatePrayer, deletePrayer } from "@/lib/services/prayers";
import type { Prayer } from "@/types";

const emptyForm = { title: "", text: "", order: "1", audioUrl: "" };

export default function OracionesAdminPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setPrayers(await getPrayers());
    } catch {
      toast.error("Error al cargar oraciones");
      setPrayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, order: String(prayers.length + 1) });
    setShowForm(true);
  }

  function openEdit(p: Prayer) {
    setEditingId(p.id);
    setForm({ title: p.title, text: p.text, order: String(p.order), audioUrl: p.audioUrl ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.text.trim()) {
      toast.error("Título y texto son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const data = {
        slug: "",
        title: form.title.trim(),
        text: form.text.trim(),
        order: Number(form.order) || 1,
        audioUrl: form.audioUrl.trim() || undefined,
      };
      if (editingId) {
        await updatePrayer(editingId, data);
        toast.success("Oración actualizada");
      } else {
        await createPrayer(data);
        toast.success("Oración creada");
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch {
      toast.error("Error al guardar la oración");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta oración?")) return;
    try {
      await deletePrayer(id);
      toast.success("Oración eliminada");
      await load();
    } catch {
      toast.error("Error al eliminar");
    }
  }

  if (loading) return <p className="text-muted-foreground">Cargando oraciones...</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oraciones"
        description="Catálogo de oraciones para memorizar"
        action={<Button onClick={() => (showForm ? setShowForm(false) : openCreate())}>{showForm ? "Cancelar" : "Nueva oración"}</Button>}
      />

      {showForm && (
        <Card>
          <CardHeader><CardTitle>{editingId ? "Editar oración" : "Nueva oración"}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Título</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Texto de la oración</Label>
                <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={8} required />
              </div>
              <div className="space-y-2">
                <Label>Orden</Label>
                <Input type="number" min="1" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Audio URL (opcional)</Label>
                <Input value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        keyField="id"
        data={prayers}
        columns={[
          { key: "order", header: "Orden", render: (p) => p.order },
          { key: "title", header: "Título", render: (p) => p.title },
          { key: "text", header: "Texto", render: (p) => <span className="line-clamp-2 max-w-md text-muted-foreground">{p.text}</span> },
          { key: "audio", header: "Audio", render: (p) => p.audioUrl ? "Sí" : "—" },
          {
            key: "actions",
            header: "Acciones",
            render: (p) => (
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Eliminar</Button>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
