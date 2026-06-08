const WOMPI_AUTH_URL = process.env.WOMPI_AUTH_URL ?? "https://id.wompi.sv/connect/token";
const WOMPI_API_URL = (process.env.WOMPI_API_URL ?? "https://api.wompi.sv").replace(/\/v1$/, "");

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

export function getWompiClientId(): string | undefined {
  return process.env.WOMPI_CLIENT_ID ?? process.env.WOMPI_APP_ID;
}

export function getWompiClientSecret(): string | undefined {
  return process.env.WOMPI_CLIENT_SECRET ?? process.env.WOMPI_PRIVATE_KEY;
}

export async function getWompiAccessToken(): Promise<string> {
  const clientId = getWompiClientId();
  const clientSecret = getWompiClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("Wompi no configurado (WOMPI_CLIENT_ID / WOMPI_CLIENT_SECRET)");
  }

  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    audience: "wompi_api",
  });

  const res = await fetch(WOMPI_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description ?? data.error ?? "Error autenticando con Wompi");
  }

  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return tokenCache.accessToken;
}

export interface WompiPaymentLinkInput {
  reference: string;
  amountDollars: number;
  productName: string;
  productDescription?: string;
  redirectUrl: string;
  webhookUrl: string;
  customerEmail?: string;
}

export interface WompiPaymentLinkResult {
  idEnlace: number;
  urlEnlace: string;
  urlQrCodeEnlace?: string;
  estaProductivo: boolean;
}

export async function createWompiPaymentLink(input: WompiPaymentLinkInput): Promise<WompiPaymentLinkResult> {
  const token = await getWompiAccessToken();

  const res = await fetch(`${WOMPI_API_URL}/EnlacePago`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      identificadorEnlaceComercio: input.reference,
      monto: input.amountDollars,
      nombreProducto: input.productName,
      infoProducto: input.productDescription
        ? { descripcionProducto: input.productDescription }
        : undefined,
      formaPago: {
        permitirTarjetaCreditoDebido: true,
        permitirPagoConPuntoAgricola: true,
        permitirPagoEnCuotasAgricola: false,
        permitirPagoEnBitcoin: false,
        permitePagoQuickPay: true,
      },
      configuracion: {
        urlRedirect: input.redirectUrl,
        urlWebhook: input.webhookUrl,
        emailsNotificacion: process.env.WOMPI_NOTIFICATION_EMAIL ?? undefined,
        notificarTransaccionCliente: true,
        esMontoEditable: false,
        esCantidadEditable: false,
      },
      limitesDeUso: {
        cantidadMaximaPagosExitosos: 1,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? data.title ?? "Error creando enlace Wompi");
  }

  return {
    idEnlace: data.idEnlace,
    urlEnlace: data.urlEnlace,
    urlQrCodeEnlace: data.urlQrCodeEnlace,
    estaProductivo: data.estaProductivo ?? false,
  };
}

export async function testWompiConnection(): Promise<{ ok: boolean; productivo?: boolean }> {
  await getWompiAccessToken();
  return { ok: true };
}
