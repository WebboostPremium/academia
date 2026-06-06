'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FirebaseError } from 'firebase/app'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { registerStudent, friendlyAuthError } from '@/lib/auth/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      await registerStudent(email.trim(), password, name.trim())
      toast.success('Cuenta creada. ¡Bienvenido!')
      router.replace('/redireccion')
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
          Crear cuenta
        </h1>
        <p className="text-sm text-muted-foreground">
          Comienza tu preparación sacramental hoy mismo.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre completo</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="María González"
          />
        </div>
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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Crear mi cuenta
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes una cuenta?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
