'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Lock, ShoppingCart } from 'lucide-react'
import { startCheckout, confirmDemoPayment } from '@/lib/actions/checkout'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

declare global {
  interface Window {
    WidgetCheckout?: new (opts: Record<string, unknown>) => {
      open: (cb: (result: { transaction?: { id: string; status: string } }) => void) => void
    }
  }
}

function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.wompi.co/widget.js'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Wompi'))
    document.body.appendChild(script)
  })
}

export function PurchaseButton({
  courseId,
  courseTitle,
  price,
}: {
  courseId: string
  courseTitle: string
  price: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingRef, setPendingRef] = useState('')

  async function handlePurchase() {
    setLoading(true)
    try {
      const result = await startCheckout(courseId)
      if (result.error) {
        toast.error(result.error)
        return
      }

      // Modo demostración (Wompi no configurado): confirmar manualmente
      if (result.demo && result.reference) {
        setPendingRef(result.reference)
        setConfirmOpen(true)
        return
      }

      // Widget real de Wompi
      await loadWompiScript()
      if (!window.WidgetCheckout) {
        toast.error('No se pudo cargar la pasarela de pago')
        return
      }
      const checkout = new window.WidgetCheckout({
        currency: result.currency,
        amountInCents: result.amountInCents,
        reference: result.reference,
        publicKey: result.publicKey,
        signature: { integrity: result.signature },
        customerData: { email: result.customerEmail },
      })
      checkout.open((widgetResult) => {
        const tx = widgetResult.transaction
        if (tx?.status === 'APPROVED') {
          toast.success('Pago aprobado. Activando tu curso...')
          setTimeout(() => router.refresh(), 2500)
        } else {
          toast.info('El pago no se completó. Inténtalo de nuevo.')
        }
      })
    } catch (error) {
      console.error('[v0] purchase:', error)
      toast.error('Ocurrió un error al iniciar el pago')
    } finally {
      setLoading(false)
    }
  }

  async function handleDemoConfirm() {
    setLoading(true)
    try {
      const result = await confirmDemoPayment(pendingRef)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('¡Inscripción activada!')
      setConfirmOpen(false)
      router.push(`/estudiante/cursos/${courseId}`)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={handlePurchase} disabled={loading} className="w-full">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ShoppingCart className="size-4" />
        )}
        Comprar ${price}
      </Button>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              Pasarela en modo prueba
            </DialogTitle>
            <DialogDescription>
              La pasarela de Wompi aún no está configurada por la institución.
              Puedes simular la compra de{' '}
              <strong className="text-foreground">{courseTitle}</strong> por $
              {price} para activar tu inscripción y probar la plataforma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleDemoConfirm} disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Simular pago e inscribirme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
