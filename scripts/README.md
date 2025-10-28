# Scripts

Todos los scripts del proyecto, organizados por categoría:

## 📁 Estructura

```
test/        → Testing scripts (Stripe, BD, suscripciones)
db/          → Database scripts (migrations, seeders)
```

## 🧪 Testing Scripts (`/test`)

```bash
# Crear usuario test
node scripts/test/create-user.js email@test.com

# Verificar status de suscripción
node scripts/test/check-user.js email@test.com

# Sincronizar BD desde Stripe
node scripts/test/sync-stripe.js email@test.com

# Setup auto-renewal
node scripts/test/setup-auto-renewal.js email@test.com

# Verificar auto-renewal
node scripts/test/verify-auto-renewal.js email@test.com

# Test renewal con Test Clocks
node scripts/test/test-renewal-clock.js email@test.com

# Verificar que webhooks sincronicen
node scripts/test/verify-webhooks.js

# Verificar status en Stripe
node scripts/test/check-stripe.js email@test.com

# Cancelar suscripción
node scripts/test/cancel.js email@test.com

# Reset usuario
node scripts/test/reset-user.js email@test.com
```

## 🗄️ Database Scripts (`/db`)

```bash
# Migrations y schema changes
npm run db:migrate

# Seeders - datos de ejemplo
node scripts/db/seed_auth_specials.js
node scripts/db/seed_in_schema.js

# Utilities
node scripts/db/migrate_page_blobs.js
node scripts/db/migrate_in_schema.js
node scripts/db/cleanOrphanBlobs.js
```

---

[Documentación de Testing →](../docs/guides/01-testing-local.md)
