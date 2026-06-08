# Despliegue en Vercel

## 1. Conectar repositorio

1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Importa `WebboostPremium/academia`
3. Framework: **Next.js** (detectado automáticamente)

## 2. Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Sí | Firebase cliente |
| `FIREBASE_CLIENT_EMAIL` | Sí | Firebase Admin |
| `FIREBASE_PRIVATE_KEY` | Sí | Firebase Admin |
| `SESSION_SECRET` | Sí | JWT de sesión |
| `NEXT_PUBLIC_APP_URL` | Sí | URL pública (ej. `https://tu-dominio.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | Sí | Archivos (imágenes, PDFs, certificados) |
| `CLOUDINARY_UPLOAD_PRESET` o `CLOUDINARY_API_KEY`+`SECRET` | Sí | Subida a Cloudinary |
| `WOMPI_CLIENT_ID` | Sí | App ID de Wompi |
| `WOMPI_CLIENT_SECRET` | Sí | API Secret de Wompi |
| `RESEND_API_KEY` | Recomendado | Correos automáticos |
| `EMAIL_FROM` | Recomendado | Remitente verificado en Resend |
| `EMAIL_FROM_NAME` | Opcional | Nombre del remitente |

> **No se usa Firebase Storage.** Solo Firestore + URLs de Cloudinary.

## 3. Firebase

En Firebase Console → **Authentication → Authorized domains**, agrega tu dominio Vercel.

## 4. Webhook Wompi

URL del webhook (se envía automáticamente al crear cada enlace de pago):

```
https://tu-dominio.vercel.app/api/payments/webhook
```

Flujo: Usuario compra → Enlace Wompi → Pago exitoso → Webhook → Inscripción automática.

## 5. Cloudinary

Preset recomendado: unsigned upload habilitado, carpetas `catequesis/*`.
Tipos: imágenes (perfil, logos, portadas) y raw/PDF (tareas, certificados).

## 6. Resend

1. Verifica tu dominio en [resend.com](https://resend.com)
2. Actualiza `EMAIL_FROM` con un correo de ese dominio

## 7. Primer admin

Regístrate en `/registro` → Firestore `users/{uid}` → `role: "admin"`.
