# Manual de lanzamiento — Catequesis Online

## 1. Variables completas para Vercel

Configura en **Settings → Environment Variables** (Production + Preview).

### Firebase (8 variables)

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key del proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket (requerido por SDK, no se usa para archivos) |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID web |
| `FIREBASE_CLIENT_EMAIL` | Cuenta de servicio Admin SDK |
| `FIREBASE_PRIVATE_KEY` | Clave privada (con `\n` o saltos de línea) |

### Aplicación (2 variables)

| Variable | Descripción |
|----------|-------------|
| `SESSION_SECRET` | Secreto JWT fuerte (`openssl rand -base64 32`) — **obligatorio en producción** |
| `NEXT_PUBLIC_APP_URL` | URL pública final, ej. `https://academia.tudominio.com` |

### Cloudinary (4 variables)

| Variable | Valor |
|----------|-------|
| `CLOUDINARY_CLOUD_NAME` | `dxmtd2mga` |
| `CLOUDINARY_API_KEY` | Tu API Key |
| `CLOUDINARY_API_SECRET` | Tu API Secret |
| `CLOUDINARY_UPLOAD_PRESET` | `Vendedores` |

### Wompi El Salvador (4 variables)

| Variable | Valor |
|----------|-------|
| `WOMPI_AUTH_URL` | `https://id.wompi.sv/connect/token` |
| `WOMPI_API_URL` | `https://api.wompi.sv` |
| `WOMPI_CLIENT_ID` | App ID del panel Wompi |
| `WOMPI_CLIENT_SECRET` | API Secret del panel Wompi |

### Resend (3 variables)

| Variable | Descripción |
|----------|-------------|
| `RESEND_API_KEY` | API Key de Resend |
| `EMAIL_FROM` | Correo de dominio verificado |
| `EMAIL_FROM_NAME` | Nombre remitente, ej. `Academia` |

### Opcionales

| Variable | Cuándo usarla |
|----------|---------------|
| `ALLOW_SEED=true` | Solo para cargar datos iniciales una vez |
| `WOMPI_NOTIFICATION_EMAIL` | Correos de notificación Wompi al comercio |

---

## 2. Despliegue paso a paso

### Paso 1 — Preparar repositorio
- Código en `https://github.com/WebboostPremium/academia` (rama `main`)
- Verificar que `.env.local` **no** esté en Git

### Paso 2 — Crear proyecto en Vercel
1. [vercel.com](https://vercel.com) → **Add New → Project**
2. Importar `WebboostPremium/academia`
3. Framework: **Next.js** (auto-detectado)
4. Build: `npm run build`

### Paso 3 — Configurar variables
1. Antes del deploy, pegar **todas** las variables de la sección 1
2. Generar `SESSION_SECRET` único (no reutilizar el de desarrollo)

### Paso 4 — Primer deploy
1. Click **Deploy**
2. Esperar build exitoso
3. Anotar URL temporal: `https://academia-xxx.vercel.app`

### Paso 5 — Firebase
1. **Authentication → Settings → Authorized domains** → agregar dominio Vercel y dominio personalizado
2. **Firestore → Rules** → desplegar `firebase/firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Habilitar **Email/Password** en Authentication

### Paso 6 — Datos iniciales (una sola vez)
```bash
# Opción A: variable ALLOW_SEED=true en Vercel, luego:
curl -X POST https://tu-dominio.com/api/seed
# Opción B: crear cursos manualmente desde /admin/cursos
```
Eliminar `ALLOW_SEED` después.

### Paso 7 — Primer administrador
Ver sección 4.

### Paso 8 — Verificar integraciones
1. `/admin/configuracion` → **Wompi** → Probar conexión
2. Compra de prueba de un curso
3. Confirmar inscripción automática en `/estudiante/cursos`
4. Subir imagen de prueba en configuración
5. Generar certificado de prueba

### Paso 9 — Resend en producción
1. Verificar dominio en Resend
2. Actualizar `EMAIL_FROM` en Vercel
3. Redeploy

### Paso 10 — Go live
1. Conectar dominio personalizado (sección 3)
2. Actualizar `NEXT_PUBLIC_APP_URL`
3. Compra real de prueba en Wompi productivo

---

## 3. Dominio personalizado

1. **Vercel** → Proyecto → **Settings → Domains**
2. Agregar `tudominio.com`
3. Agregar `www.tudominio.com` (redirect a raíz o viceversa)
4. En tu registrador (GoDaddy, Cloudflare, etc.), crear registros DNS:

   | Tipo | Nombre | Valor |
   |------|--------|-------|
   | A | `@` | IP que indica Vercel |
   | CNAME | `www` | `cname.vercel-dns.com` |

5. Esperar verificación SSL automática de Vercel (candado verde)
6. Actualizar variables:
   - `NEXT_PUBLIC_APP_URL=https://tudominio.com`
7. Firebase → Authorized domains → `tudominio.com`
8. Resend → verificar `tudominio.com` para `EMAIL_FROM`

---

## 4. Crear el primer usuario administrador

### Método recomendado

1. Ir a `https://tudominio.com/registro`
2. Crear cuenta con tu correo real
3. Abrir [Firebase Console](https://console.firebase.google.com) → Firestore
4. Colección `users` → documento con tu `uid`
5. Editar campo `role`: cambiar `"estudiante"` → `"admin"`
6. Cerrar sesión y volver a iniciar sesión
7. Serás redirigido a `/admin`

### Método alternativo (Firebase Auth + Firestore manual)
Crear usuario en Authentication y documento en `users` con los campos:
```json
{
  "uid": "...",
  "email": "admin@tudominio.com",
  "displayName": "Administrador",
  "role": "admin",
  "status": "active"
}
```

---

## 5. Auditoría de seguridad pre-producción

| Control | Estado | Acción |
|---------|--------|--------|
| `.env.local` fuera de Git | OK | Verificar antes de cada push |
| `SESSION_SECRET` fuerte | Pendiente | Generar en Vercel |
| Cookies `httpOnly` + `secure` | OK | Activas en producción |
| `/api/seed` bloqueado en prod | OK | Requiere `ALLOW_SEED=true` |
| APIs protegidas por sesión | OK | Excepto register, webhook |
| Webhook Wompi | Parcial | Configurar validación de firma si Wompi la provee |
| Firestore Rules | Pendiente | Desplegar `firebase/firestore.rules` |
| Rotación de API keys | Pendiente | Rotar keys expuestas en chats |
| Firebase Storage | No usado | Sin costo Blaze |
| HTTPS | OK | Vercel provee SSL automático |

### Checklist antes de abrir al público
- [ ] `SESSION_SECRET` único en Vercel
- [ ] Firestore rules desplegadas
- [ ] Dominio en Firebase Authorized domains
- [ ] `EMAIL_FROM` con dominio verificado
- [ ] Wompi en modo productivo
- [ ] Compra real de prueba completada
- [ ] Eliminar `ALLOW_SEED` si se usó
- [ ] Rotar credenciales Resend, Wompi, Cloudinary

---

## 6. Credenciales en el repositorio

**Verificado:** solo `.env.example` está en Git (sin valores reales).

Archivos ignorados por `.gitignore`:
- `.env`
- `.env.local`
- `.env.*.local`

**Nunca commitear:** API keys, private keys, secrets de Wompi/Resend/Cloudinary.

---

## Verificación automatizada

```bash
npm run dev
npx tsx scripts/verify-production.ts
npm run build
```

Última ejecución: **11/11 pruebas OK** (Cloudinary, Wompi, Resend, Auth, Certificados, Build).
