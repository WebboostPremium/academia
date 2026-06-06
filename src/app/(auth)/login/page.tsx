import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-muted-foreground">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
