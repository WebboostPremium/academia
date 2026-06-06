# Catequesis Online

Plataforma LMS institucional para preparación sacramental: **Bautismo**, **Primera Comunión** y **Confirmación**.

## Stack

- Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
- Shadcn UI · Framer Motion · Recharts · Sonner
- Firebase Auth · Firestore · Storage · Admin SDK
- Wompi El Salvador (pagos únicos por curso)

## Inicio rápido

```bash
npm install
cp .env.example .env.local
# Completar variables Firebase y Wompi
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

### Datos iniciales (desarrollo)

```bash
curl -X POST http://localhost:3000/api/seed
```

Crea los 3 cursos sacramentales, 5 oraciones y configuración global.

### Primer administrador

1. Regístrate en `/registro`
2. Firebase Console → Firestore → `users/{uid}` → `role: "admin"`
3. Cierra sesión y vuelve a entrar → `/admin`

## Rutas principales

| Área | Ruta | Descripción |
|------|------|-------------|
| Público | `/`, `/cursos`, `/nosotros`, `/contacto` | Landing y catálogo |
| Auth | `/login`, `/registro`, `/recuperar` | Autenticación |
| Admin | `/admin` | 15 módulos de gestión |
| Catequista | `/catequista` | Estudiantes, tareas, asistencia |
| Estudiante | `/estudiante` | Cursos, lecciones, evaluaciones |

## API

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/seed` | Datos iniciales (solo dev) |
| `POST /api/payments/create` | Checkout Wompi |
| `POST /api/payments/webhook` | Webhook Wompi |
| `POST /api/certificates/generate` | Emitir certificado PDF |
| `POST /api/upload` | Subir PDF (tareas) |

## Firebase

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Webhook Wompi

URL: `https://tu-dominio.com/api/payments/webhook`

## Despliegue (Cloudflare Pages)

```bash
npm run build
# Configurar variables de entorno en Cloudflare Dashboard
# Build: npx @cloudflare/next-on-pages
```

## Documentación

Arquitectura completa: `docs/ARQUITECTURA-CATEQUESIS-ONLINE.md`
