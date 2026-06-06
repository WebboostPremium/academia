import 'server-only'
import crypto from 'crypto'

const WOMPI_BASE =
  process.env.WOMPI_API_BASE || 'https://api.wompi.co/v1'

export function generateReference(userId: string, courseId: string): string {
  const rand = crypto.randomBytes(6).toString('hex')
  return `CQ-${courseId}-${userId.slice(0, 6)}-${rand}`
}

/**
 * Firma de integridad para el Widget/Checkout de Wompi.
 * SHA256 de: <referencia><montoEnCentavos><moneda><secretoDeIntegridad>
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency: string,
  integritySecret: string,
): string {
  const payload = `${reference}${amountInCents}${currency}${integritySecret}`
  return crypto.createHash('sha256').update(payload).digest('hex')
}

/**
 * Verifica la firma del evento de webhook de Wompi.
 * Wompi concatena los valores de las propiedades indicadas en
 * signature.properties seguidas del timestamp y el secreto de eventos.
 */
export function verifyEventSignature(
  event: WompiEvent,
  eventsSecret: string,
): boolean {
  try {
    const props = event.signature?.properties ?? []
    let concatenated = ''
    for (const prop of props) {
      const value = prop
        .split('.')
        .reduce<unknown>(
          (acc, key) =>
            acc && typeof acc === 'object'
              ? (acc as Record<string, unknown>)[key]
              : undefined,
          event.data,
        )
      concatenated += String(value ?? '')
    }
    concatenated += String(event.timestamp)
    concatenated += eventsSecret
    const checksum = crypto
      .createHash('sha256')
      .update(concatenated)
      .digest('hex')
    return checksum.toLowerCase() === (event.signature?.checksum ?? '').toLowerCase()
  } catch {
    return false
  }
}

export interface WompiEvent {
  event: string
  data: {
    transaction?: {
      id: string
      status: 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR' | 'PENDING'
      reference: string
      amount_in_cents: number
      currency: string
      customer_email?: string
    }
  }
  timestamp: number
  signature?: {
    checksum: string
    properties: string[]
  }
}

export async function fetchTransaction(
  transactionId: string,
): Promise<WompiEvent['data']['transaction'] | null> {
  try {
    const res = await fetch(`${WOMPI_BASE}/transactions/${transactionId}`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    const json = (await res.json()) as {
      data: WompiEvent['data']['transaction']
    }
    return json.data
  } catch {
    return null
  }
}
