"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { updateUser } from "@/lib/services/users";
import { ProfilePhotoUpload } from "@/components/profile/profile-photo-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABELS } from "@/lib/constants/roles";

export default function CatequistaPerfilPage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await updateUser(user!.uid, { displayName, phone: phone || undefined });
      await refreshUser();
      toast.success("Perfil actualizado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">Mi Perfil</h1>
      <Card className="card-shadow rounded-2xl">
        <CardHeader className="items-center text-center">
          <ProfilePhotoUpload
            uid={user.uid}
            displayName={user.displayName}
            photoURL={user.photoURL}
            onUpdated={() => refreshUser()}
          />
          <CardTitle className="mt-2">{user.displayName}</CardTitle>
          <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Correo</Label>
            <Input value={user.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button className="w-full rounded-full" onClick={handleSave} disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
