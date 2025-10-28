# 📝 PaginaPro - Editor con Sistema de Suscripciones

**Editor WYSIWYG basado en Editor.js con integración completa de Stripe, auto-renovación y sincronización BD garantizada.**

## 🎯 Qué es

Una plataforma para crear/editar páginas web visuales con:
- **Editor**: Drag & drop, bloques customizables, preview responsive
- **Suscripciones**: Compra, auto-renovación, cancelación (ZERO charges)
- **Sincronización**: BD-Stripe siempre consistentes
- **Storage**: Imágenes en Vercel Blob, datos en PostgreSQL

## ⚡ Quick Start

### Desarrollo

```bash
# 1. Clone & install
git clone <repo>
cd editor-js
npm install

# 2. Setup .env
cp .env.example .env
# Edita: DATABASE_URL, STRIPE_*_KEY, STRIPE_WEBHOOK_SECRET

# 3. Database
npm run db:migrate

# 4. Start (3 terminales)
# Terminal 1
npm run dev

# Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3
node scripts/test/create-user.js test@local.com
node scripts/test/verify-sync.js test@local.com
```

## 📚 Documentación

**TODO en `/docs` - [Abre la documentación completa →](./docs/README.md)**

```
docs/README.md                    ← Índice maestro
  subscriptions/                  → Guías de suscripciones
  architecture/                   → Arquitectura del sistema
  deployment/                     → Pre-deploy & producción
  guides/                         → Guías prácticas
```

## 🏗️ Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15.5 + Editor.js |
| Backend | Next.js API Routes |
| BD | PostgreSQL (Neon) |
| Pagos | Stripe (Subscriptions + Webhooks) |
| Storage | Vercel Blob |
| Auth | JWT + Bcrypt |

## ✅ Features

### 🎨 Editor
- ✅ Bloques personalizados con colores
- ✅ Upload de imágenes
- ✅ Preview responsive
- ✅ Render servidor (SEO)

### 💳 Suscripciones
- ✅ Compra (Stripe checkout)
- ✅ Auto-renovación garantizada
- ✅ Cancelación (ZERO charges)
- ✅ Dashboard con días restantes
- ✅ Sincronización BD-Stripe automática

### 🔐 Seguridad
- ✅ Autenticación (JWT + Bcrypt)
- ✅ Webhook signature verification
- ✅ Passwords hasheados

## 🧪 Scripts Útiles

```bash
# Crear usuario test
node scripts/test/create-user.js email@test.com

# Verificar sincronización
node scripts/test/verify-sync.js email@test.com

# Sincronizar si hay problema
node scripts/test/sync-from-stripe.js email@test.com

# Test de auto-renewal
node scripts/test/setup-auto-renewal.js email@test.com

# Verificar webhooks sincronicen
node scripts/test/verify-webhook-sync.js
```

## 🚀 Status

| Feature | Status |
|---------|--------|
| Editor | ✅ |
| Compra | ✅ |
| Auto-renovación | ✅ |
| Cancelación | ✅ |
| Sincronización | ✅ |
| Testing | ✅ |
| **Producción** | **✅ Listo** |

## 🛡️ Garantías

✅ **ZERO Charges después de cancelar** - Imposible
✅ **BD-Stripe sincronizadas** - Automático en cada webhook
✅ **Auto-renovación garantizada** - Subscription Schedules

## 📞 Support

- [📖 Documentación completa](./docs/README.md)
- [🐛 Debugging guide](./docs/guides/03-debugging.md)
- [🚀 Production guide](./docs/deployment/02-production-sync.md)

---

**Estado**: ✅ Listo para producción | **Última actualización**: 28 de octubre, 2025
