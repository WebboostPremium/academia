"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { getSettings, DEFAULT_SETTINGS } from "@/lib/services/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function toWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function ContactoPage() {
  const [institution, setInstitution] = useState(DEFAULT_SETTINGS.institution);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSettings().then((s) => {
      if (s?.institution) setInstitution(s.institution);
    });
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Consulta de ${name}`);
    const body = encodeURIComponent(`Nombre: ${name}\nCorreo: ${email}\nTeléfono: ${phone}\n\n${message}`);
    window.location.href = `mailto:${institution.email}?subject=${subject}&body=${body}`;
    toast.success("Se abrirá tu cliente de correo para enviar el mensaje");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 lg:px-8">
      <h1 className="text-3xl font-bold">Contacto</h1>
      <p className="mt-2 text-muted-foreground">Escríbenos y te responderemos lo antes posible</p>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Información</CardTitle>
            <CardDescription>Datos de contacto institucional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><span className="font-medium">Institución:</span> {institution.name}</p>
            <p>
              <span className="font-medium">Correo:</span>{" "}
              <a href={`mailto:${institution.email}`} className="text-primary hover:underline">{institution.email}</a>
            </p>
            {institution.whatsapp && (
              <Button asChild className="mt-2 w-full rounded-full bg-[#25D366] hover:bg-[#20bd5a]">
                <a
                  href={toWhatsAppUrl(institution.whatsapp, "Hola, me gustaría información sobre Catequesis Online")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Escribir por WhatsApp
                </a>
              </Button>
            )}
            {institution.phone && <p><span className="font-medium">Teléfono:</span> {institution.phone}</p>}
            {institution.address && <p><span className="font-medium">Dirección:</span> {institution.address}</p>}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Formulario de contacto</CardTitle>
            <CardDescription>Completa el formulario para contactarnos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required />
              </div>
              <Button type="submit" className="w-full rounded-full">Enviar mensaje</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
