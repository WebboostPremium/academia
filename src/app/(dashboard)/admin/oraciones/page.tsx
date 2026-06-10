"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/dashboard/data-table";
import { getPrayers } from "@/lib/services/prayers";
import type { Prayer } from "@/types";

export default function OracionesAdminPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrayers()
      .then((data) => setPrayers(data))
      .catch(() => setPrayers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted-foreground">Cargando oraciones...</p>;

  return (
    <div className="space-y-6">
      <PageHeader title="Oraciones" description="Catálogo de oraciones para memorizar" />

      <DataTable
        keyField="id"
        data={prayers}
        columns={[
          { key: "order", header: "Orden", render: (p) => p.order },
          { key: "title", header: "Título", render: (p) => p.title },
          { key: "slug", header: "Slug", render: (p) => p.slug },
          {
            key: "text",
            header: "Texto",
            render: (p) => (
              <span className="line-clamp-2 max-w-xs text-muted-foreground">{p.text}</span>
            ),
          },
          { key: "audio", header: "Audio", render: (p) => p.audioUrl ? "Sí" : "—" },
        ]}
      />
    </div>
  );
}
