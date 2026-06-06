"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CatequistaConfiguracionPage() {
  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Configuración</h1>
      <Card className="card-shadow rounded-2xl">
        <CardHeader><CardTitle>Preferencias</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Las opciones de configuración del catequista estarán disponibles próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
