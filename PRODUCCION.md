# Guía de producción — Catequesis Online

## Variables en Vercel (copiar todas)

### Firebase (obligatorio)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

### App (obligatorio)
```
SESSION_SECRET          → openssl rand -base64 32 (valor único y secreto)
NEXT_PUBLIC_APP_URL     → https://tu-dominio.com
```

### Cloudinary (obligatorio)
```
CLOUDINARY_CLOUD_NAME=dxmtd2mga
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
CLOUDINARY_UPLOAD_PRESET=Vendedores
```

### Wompi El Salvador (obligatorio)
```
WOMPI_AUTH_URL=https://id.wompi.sv/connect/token
WOMPI_API_URL=https://api.wompi.sv
WOMPI_CLIENT_ID         → App ID del panel Wompi
WOMPI_CLIENT_SECRET     → API Secret del panel Wompi
```

### Resend (recomendado)
```
RESEND_API_KEY
EMAIL_FROM              → correo de dominio verificado (ej. noreply@tudominio.com)
EMAIL_FROM_NAME=Academia
```

---

## Dominio personalizado en Vercel

1. Vercel → tu proyecto → **Settings → Domains**
2. Agrega `tudominio.com` y `www.tudominio.com`
3. En tu registrador DNS, crea los registros que Vercel indique (normalmente `A` + `CNAME`)
4. Espera propagación DNS (hasta 48 h, usualmente minutos)
5. Actualiza `NEXT_PUBLIC_APP_URL=https://tudominio.com` en Vercel
6. Firebase Console → Authentication → **Authorized domains** → agrega `tudominio.com`

---

## Post-deploy

1. `POST https://tudominio.com/api/seed` (solo primera vez; opcional `ALLOW_SEED=true`)
2. Regístrate en `/registro`
3. Firestore → `users/{tu-uid}` → `role: "admin"`
4. `/admin/configuracion` → Wompi → **Probar conexión**
5. Compra de prueba con tarjeta sandbox Wompi

---

## Verificación local

```bash
npm run dev
npx tsx scripts/verify-production.ts
npm run build
```

---

## Arquitectura de archivos

| Recurso | Servicio | Firestore guarda |
|---------|----------|------------------|
| Fotos perfil | Cloudinary | URL |
| Logos / portadas | Cloudinary | URL |
| Tareas PDF | Cloudinary | URL |
| Certificados PDF | Cloudinary | URL |
| Videos | YouTube (unlisted) | URL en lección |
| Datos | Firestore | Documentos |

**No se usa Firebase Storage.**
