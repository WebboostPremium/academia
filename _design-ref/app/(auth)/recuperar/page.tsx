'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FirebaseError } from 'firebase/app'
import { toast } from 'sonner'
import { Loader2, MailCheck } from 'lucide-react'
import { resetPassword, friendlyAuthError } from '@/lib/auth/client-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function RecoverPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email.trim())
      setSent(true)
      toast.success('Correo de recuperación enviado')
    } catch (error) {
      const code = error instanceof FirebaseError ? error.code : ''
      toast.error(friendlyAuthError(code))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
          <MailCheck className="size-6" />
        </span>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Revisa tu correo
        </h1>
        <p className="text-sm text-muted-foreground">
          Hemos enviado un enlace para restablecer tu contraseña a{' '}
          <strong className="text-foreground">{email}</strong>.
        </p>
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link href="/login">Volver a iniciar sesión</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          Recuperar contraseña
        </h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para restablecer tu contraseña.
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
        <Button type="submit" disabled={loading} className="mt-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Enviar enlace
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  )
}
