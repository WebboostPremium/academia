import Link from "next/link";
import { Church, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NosotrosPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
        <Church className="h-4 w-4" />
        Nuestra misión
      </div>
      <h1 className="text-4xl font-bold">Sobre Catequesis Online</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Somos una plataforma digital dedicada a la preparación sacramental con excelencia pastoral.
        Acompañamos a familias, niños y jóvenes en su camino hacia los sacramentos de iniciación cristiana.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {[
          { icon: Heart, title: "Fe viva", desc: "Contenido fiel a la doctrina católica, presentado con claridad y amor." },
          { icon: Users, title: "Acompañamiento", desc: "Catequistas asignados que guían el proceso de cada estudiante." },
          { icon: Church, title: "Sacramentos", desc: "Programas para Bautismo, Primera Comunión y Confirmación." },
        ].map((item) => (
          <Card key={item.title} className="rounded-2xl">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-2xl border bg-muted/30 p-8">
        <h2 className="text-xl font-semibold">Nuestro compromiso</h2>
        <p className="mt-3 text-muted-foreground">
          Creemos que la catequesis debe ser accesible, rigurosa y personal. Por eso combinamos
          tecnología moderna con el acompañamiento humano de catequistas formados, para que cada
          persona llegue preparada a recibir los sacramentos con alegría y comprensión.
        </p>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/cursos">Explorar programas</Link>
        </Button>
      </div>
    </main>
  );
}
