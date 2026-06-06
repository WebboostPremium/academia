"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  getSettings,
  saveInstitutionSettings,
  saveBrandingSettings,
  saveWompiSettings,
  saveCertificateSettings,
  DEFAULT_SETTINGS,
} from "@/lib/services/settings";
import { ImageUpload } from "@/components/shared/image-upload";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AppSettings } from "@/types/settings";

type Tab = "institucion" | "branding" | "wompi" | "certificados";

const TABS: { id: Tab; label: string }[] = [
  { id: "institucion", label: "Institución" },
  { id: "branding", label: "Branding" },
  { id: "wompi", label: "Wompi" },
  { id: "certificados", label: "Certificados" },
];

export default function ConfiguracionPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("institucion");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [institution, setInstitution] = useState(DEFAULT_SETTINGS.institution);
  const [branding, setBranding] = useState(DEFAULT_SETTINGS.branding);
  const [wompi, setWompi] = useState(DEFAULT_SETTINGS.wompi);
  const [certificates, setCertificates] = useState(DEFAULT_SETTINGS.certificates);

  useEffect(() => {
    getSettings().then((settings) => {
      if (settings) {
        setInstitution(settings.institution);
        setBranding(settings.branding);
        setWompi(settings.wompi);
        setCertificates(settings.certificates);
      }
      setLoading(false);
    });
  }, []);

  async function handleSaveInstitution(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveInstitutionSettings(institution, user.uid);
      toast.success("Configuración institucional guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBranding(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveBrandingSettings(branding, user.uid);
      toast.success("Branding guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWompi(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveWompiSettings(wompi, user.uid);
      toast.success("Configuración Wompi guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestWompi() {
    setTesting(true);
    try {
      const res = await fetch("/api/settings/wompi/test", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error de conexión");
      setWompi((prev) => ({ ...prev, connectionStatus: "connected", lastVerifiedAt: new Date() }));
      toast.success("Conexión con Wompi verificada");
    } catch (err) {
      setWompi((prev) => ({ ...prev, connectionStatus: "error" }));
      toast.error(err instanceof Error ? err.message : "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveCertificates(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveCertificateSettings(certificates, user.uid);
      toast.success("Configuración de certificados guardada");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  const connectionLabel: Record<AppSettings["wompi"]["connectionStatus"], string> = {
    connected: "Conectado",
    disconnected: "Desconectado",
    error: "Error",
  };

  if (loading) {
    return <p className="text-muted-foreground">Cargando configuración...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Información institucional, branding, pagos y certificados"
      />

      <div className="flex flex-wrap gap-2 border-b pb-2">
        {TABS.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "institucion" && (
        <Card>
          <CardHeader>
            <CardTitle>Institución</CardTitle>
            <CardDescription>Datos visibles en la plataforma y certificados</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveInstitution} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la institución</Label>
                <Input
                  id="name"
                  value={institution.name}
                  onChange={(e) => setInstitution((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo de contacto</Label>
                <Input
                  id="email"
                  type="email"
                  value={institution.email}
                  onChange={(e) => setInstitution((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={institution.whatsapp ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, whatsapp: e.target.value || undefined }))}
                  placeholder="+503..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={institution.phone ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, phone: e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={institution.address ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, address: e.target.value || undefined }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo institucional (Cloudinary)</Label>
                <ImageUpload folder="logos" value={institution.logoUrl} onChange={(url) => setInstitution((p) => ({ ...p, logoUrl: url }))} label="Subir logo" />
                <Input
                  id="logoUrl"
                  value={institution.logoUrl}
                  onChange={(e) => setInstitution((p) => ({ ...p, logoUrl: e.target.value }))}
                  placeholder="O URL manual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook">Facebook</Label>
                <Input
                  id="facebook"
                  value={institution.social?.facebook ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, social: { ...p.social, facebook: e.target.value || undefined } }))}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={institution.social?.instagram ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, social: { ...p.social, instagram: e.target.value || undefined } }))}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="youtube">YouTube</Label>
                <Input
                  id="youtube"
                  value={institution.social?.youtube ?? ""}
                  onChange={(e) => setInstitution((p) => ({ ...p, social: { ...p.social, youtube: e.target.value || undefined } }))}
                  placeholder="https://youtube.com/..."
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "branding" && (
        <Card>
          <CardHeader>
            <CardTitle>Branding</CardTitle>
            <CardDescription>Colores de la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveBranding} className="space-y-4">
              {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>
                    {key === "primaryColor" ? "Color primario" : key === "secondaryColor" ? "Color secundario" : "Color de acento"}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={key}
                      type="color"
                      value={branding[key]}
                      onChange={(e) => setBranding((p) => ({ ...p, [key]: e.target.value }))}
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={branding[key]}
                      onChange={(e) => setBranding((p) => ({ ...p, [key]: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              ))}
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar branding"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "wompi" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Wompi</CardTitle>
                <CardDescription>Configuración de pagos en línea</CardDescription>
              </div>
              <Badge variant={wompi.connectionStatus === "connected" ? "default" : "outline"}>
                {connectionLabel[wompi.connectionStatus]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveWompi} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publicKey">Public Key</Label>
                <Input
                  id="publicKey"
                  value={wompi.publicKey}
                  onChange={(e) => setWompi((p) => ({ ...p, publicKey: e.target.value }))}
                  placeholder="pub_test_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Entorno</Label>
                <select
                  id="environment"
                  value={wompi.environment}
                  onChange={(e) =>
                    setWompi((p) => ({ ...p, environment: e.target.value as AppSettings["wompi"]["environment"] }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="sandbox">Sandbox (pruebas)</option>
                  <option value="production">Producción</option>
                </select>
              </div>
              <p className="text-xs text-muted-foreground">
                La Private Key se configura en las variables de entorno del servidor (WOMPI_PRIVATE_KEY).
              </p>
              {wompi.lastVerifiedAt && (
                <p className="text-xs text-muted-foreground">
                  Última verificación: {wompi.lastVerifiedAt.toLocaleString("es-SV")}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : "Guardar Wompi"}
                </Button>
                <Button type="button" variant="outline" onClick={handleTestWompi} disabled={testing}>
                  {testing ? "Probando..." : "Probar conexión"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "certificados" && (
        <Card>
          <CardHeader>
            <CardTitle>Certificados</CardTitle>
            <CardDescription>Firma y pie de página en certificados PDF</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveCertificates} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signatureName">Nombre del firmante</Label>
                <Input
                  id="signatureName"
                  value={certificates.signatureName ?? ""}
                  onChange={(e) => setCertificates((p) => ({ ...p, signatureName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureTitle">Cargo del firmante</Label>
                <Input
                  id="signatureTitle"
                  value={certificates.signatureTitle ?? ""}
                  onChange={(e) => setCertificates((p) => ({ ...p, signatureTitle: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signatureUrl">URL de imagen de firma</Label>
                <Input
                  id="signatureUrl"
                  value={certificates.signatureUrl ?? ""}
                  onChange={(e) => setCertificates((p) => ({ ...p, signatureUrl: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="templateFooter">Pie de página</Label>
                <Textarea
                  id="templateFooter"
                  value={certificates.templateFooter ?? ""}
                  onChange={(e) => setCertificates((p) => ({ ...p, templateFooter: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar certificados"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
