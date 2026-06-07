# Despliegue en Vercel

## 1. Conectar repositorio

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa `WebboostPremium/academia` (o `Catequesis-Online`)
3. Framework: **Next.js** (detectado automáticamente)
4. Build: `npm run build` · Output: default

## 2. Variables de entorno (Settings → Environment Variables)

Copia desde tu `.env.local` (marca **Production**, **Preview** y **Development**):

> Si falta o está mal `NEXT_PUBLIC_FIREBASE_API_KEY`, el build falla con `auth/invalid-api-key`.

| Variable | Requerida |
|----------|-----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sí |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sí |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sí |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sí |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sí |
| `FIREBASE_CLIENT_EMAIL` | Sí |
| `FIREBASE_PRIVATE_KEY` | Sí (pegar con `\n` o saltos de línea reales) |
| `SESSION_SECRET` | Sí |
| `NEXT_PUBLIC_APP_URL` | Sí → `https://tu-dominio.vercel.app` |
| `NEXT_PUBLIC_WOMPI_PUBLIC_KEY` | Pagos |
| `WOMPI_PUBLIC_KEY` | Pagos |
| `WOMPI_PRIVATE_KEY` | Pagos |
| `WOMPI_WEBHOOK_SECRET` | Pagos |
| `CLOUDINARY_CLOUD_NAME` | Fotos (opcional) |
| `CLOUDINARY_API_KEY` | Fotos (opcional) |
| `CLOUDINARY_API_SECRET` | Fotos (opcional) |
| `RESEND_API_KEY` | Correos (opcional) |

## 3. Firebase

En Firebase Console → **Authentication → Settings → Authorized domains**, agrega:

- `tu-proyecto.vercel.app`

## 4. Después del deploy

```bash
# Datos iniciales (solo si ALLOW_SEED=true en Vercel)
curl -X POST https://tu-dominio.vercel.app/api/seed
```

**Primer admin:** regístrate en `/registro` → Firestore `users/{uid}` → `role: "admin"`.

## 5. Webhook Wompi

URL: `https://tu-dominio.vercel.app/api/payments/webhook`
