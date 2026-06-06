'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FirebaseError } from 'firebase/app'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { loginWithEmail, friendlyAuthError } from '@/lib/auth/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await loginWithEmail(email.trim(), password)
      toast.success('Bienvenido de nuevo')
      const next = params.get('next')
      router.replace(next || '/redireccion')
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : ''
      toast.error(friendlyAuthError(code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Iniciar sesión
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa a tu camino de formación en la fe.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@ejemplo.com"
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/recuperar"
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Ingresar
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{' '}
        <Link
          href="/registro"
          className="font-medium text-primary hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </div>
  )
}
