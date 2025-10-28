# Arquitectura General - PaginaPro Editor

## 📐 Stack Técnico

```
Frontend: Next.js 15.5 (App Router)
Backend: Next.js API Routes
Editor: Editor.js (WYSIWYG)
Pago: Stripe (Subscriptions + Webhooks)
BD: PostgreSQL (Neon)
Storage: Vercel Blob (imágenes/archivos)
```

## 🏛️ Estructura de Carpetas

```
app/
├── api/
│   ├── auth/              → Autenticación (login, signup, cambio contraseña)
│   ├── editor/            → CRUD de páginas
│   ├── images/            → Upload/delete de imágenes (Vercel Blob)
│   ├── stripe/            → Stripe integration
│   │   ├── webhook/       → Webhook handler
│   │   ├── create-session/
│   │   └── services/      → DB sync services
│   ├── services/          → Servicios de BD (queries, migrations)
│   └── middlewares/
├── auth/                  → Server Components para auth
├── dashboard/             → Dashboard del usuario (editor, preview, etc)
├── [slug]/                → Página pública por slug
└── config.js              → Configuración centralizada

components/
├── Editor.js              → Cliente Editor.js wrapper
├── EditorRender.js        → Render cliente (interactivo)
├── EditorRender.server.js → Render servidor (SEO)
├── editorPlugins/         → Plugins custom para Editor.js
├── utils/                 → Funciones utilitarias
└── ... (otros componentes)

db/
├── pool.js                → Connection pool a Postgres
├── migrations/            → SQL migrations
├── models/
│   └── page.model.js      → Data model de páginas
├── queries/
│   └── page.queries.js    → Queries SQL
└── seeders/               → Datos de ejemplo

scripts/
├── test/                  → Scripts de testing (Stripe, BD, etc)
├── db/                    → Scripts de DB (migrations, seeders)
└── utils/                 → Utilidades compartidas

lib/
├── auth.js                → Lógica de autenticación
└── config.js              → Config centralizada

docs/
└── ... (documentación)
```

## 🔄 Flujos Principales

### 1️⃣ Autenticación
```
Usuario → Signup/Login → Hash password → Guarda en BD → JWT en Cookie
```

### 2️⃣ Edición de Página
```
Usuario logueado → Editor → Save → API /api/editor → BD (JSONB)
```

### 3️⃣ Compra de Suscripción
```
Usuario → Checkout → Stripe → Pago → Webhook → BD actualizada
```

Más detalles en [Sistema de Suscripciones](./02-subscriptions.md).

## 🗄️ Base de Datos

**Tabla principal:** `neon_auth.users`

```sql
id (PRIMARY KEY)
username, email, password (hashed)
is_special, role
created_at, updated_at

-- Suscripciones
stripe_customer_id
stripe_subscription_id
subscription_status ('none', 'active', 'canceled', 'expired')
subscription_expires_at
```

Más en [BD Schema](./03-database.md).

## 🔐 Seguridad

- ✅ Passwords hasheadas (bcrypt)
- ✅ JWT en cookies HttpOnly
- ✅ CSRF protection (middleware)
- ✅ Rate limiting en login/signup
- ✅ Webhook signature verification (Stripe)

## 🚀 Performance

- ✅ Server Components (SSR) por defecto
- ✅ Client Components solo donde necesario (`"use client"`)
- ✅ Connection pooling en BD
- ✅ Caching (Next.js revalidation tags)
- ✅ Blob storage para imágenes (CDN)

## 📊 Estado del Código

- **Modular:** Separación clara de responsabilidades
- **Testeable:** Scripts de test para cada subsistema
- **Documentado:** Comentarios en código crítico
- **Escalable:** Fácil agregar nuevas features

---

[Siguiente: Sistema de Suscripciones →](./02-subscriptions.md)
