"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { getRoleHomePath } from "@/lib/constants/routes";
import { canAccessRoute } from "@/lib/auth/permissions";
import { ROLE_LABELS } from "@/lib/constants/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<LoginInput>({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    setStatusMessage("Verificando credenciales...");
    try {
      const credential = await signInWithEmailAndPassword(getClientAuth(), form.email, form.password);
      setStatusMessage("Obteniendo tu perfil...");
      const idToken = await credential.user.getIdToken(true);
      const sessionRes = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!sessionRes.ok) {
        const data = await sessionRes.json();
        throw new Error(data.error ?? "No se pudo iniciar sesión");
      }

      const { user } = await sessionRes.json();
      const home = getRoleHomePath(user.role);
      const redirectParam = searchParams.get("redirect");
      const redirect =
        redirectParam && canAccessRoute(user.role, redirectParam) ? redirectParam : home;

      setStatusMessage(`Redirigiendo al panel de ${ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] ?? user.role}...`);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Credenciales incorrectas";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("Correo o contraseña incorrectos. Verifica tus datos o recupera tu contraseña.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
      setStatusMessage(null);
    }
  }

  const blocked = searchParams.get("error") === "blocked";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>Accede a tu cuenta de Catequesis Online</CardDescription>
      </CardHeader>
      <CardContent>
        {blocked && (
          <p className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Tu cuenta está bloqueada. Contacta al administrador.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {statusMessage && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusMessage}
            </p>
          )}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
        <div className="mt-4 space-y-2 text-center text-sm text-muted-foreground">
          <Link href="/recuperar" className="text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p>
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="text-primary hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
