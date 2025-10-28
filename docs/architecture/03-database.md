# Database Schema

## 📋 Tabla Principal: `neon_auth.users`

```sql
CREATE TABLE neon_auth.users (
  id TEXT PRIMARY KEY,
  username CITEXT UNIQUE NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                    -- bcrypt hashed
  
  -- Perfil
  is_special BOOLEAN DEFAULT FALSE,
  role VARCHAR(50) DEFAULT 'user',           -- 'user', 'admin'
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Suscripciones
  stripe_customer_id TEXT,                   -- ID del customer en Stripe
  stripe_subscription_id TEXT,               -- ID de la subscription en Stripe
  subscription_status VARCHAR(50),           -- 'active', 'canceled', 'expired', 'trial', 'none'
  subscription_expires_at TIMESTAMP,         -- Cuándo expira/renovación
  
  -- Auditoría
  last_login_at TIMESTAMP,
  deleted_at TIMESTAMP                       -- Soft delete
);

-- Índices para performance
CREATE INDEX idx_users_email ON neon_auth.users(email);
CREATE INDEX idx_users_stripe_customer_id ON neon_auth.users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON neon_auth.users(stripe_subscription_id);
CREATE INDEX idx_users_subscription_status ON neon_auth.users(subscription_status);
```

## Tabla: `neon_pages.pages`

```sql
CREATE TABLE neon_pages.pages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users(id),
  slug CITEXT UNIQUE NOT NULL,               -- URL-friendly identifier
  
  data JSONB NOT NULL,                       -- Editor.js blocks (todo el contenido)
  page_settings JSONB,                       -- Colores, fuentes, estilos globales
  
  template_name VARCHAR(100),                -- 'default', 'landing', 'paginapro'
  is_published BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP,
  
  -- Blobs/imágenes
  blob_urls TEXT[] DEFAULT ARRAY[]::TEXT[], -- URLs de Vercel Blob
  
  -- Auditoría
  deleted_at TIMESTAMP
);

-- Índices
CREATE INDEX idx_pages_user_id ON neon_pages.pages(user_id);
CREATE INDEX idx_pages_slug ON neon_pages.pages(slug);
CREATE INDEX idx_pages_is_published ON neon_pages.pages(is_published);
```

## Migrations

Todos los cambios de schema están en `db/migrations/`:

```
2025-10-22_add_subscription_columns.js
```

Para aplicar:
```bash
npm run db:migrate
```

## Seeders

Para datos de ejemplo:

```bash
# Seed usuarios de test
node db/seed_auth_specials.js

# Seed páginas de ejemplo
node db/seedPages.js
```

## Queries Principales

### Obtener status de suscripción
```sql
SELECT 
  subscription_status,
  subscription_expires_at,
  stripe_subscription_id
FROM neon_auth.users
WHERE id = $1;
```

### Actualizar suscripción
```sql
UPDATE neon_auth.users
SET 
  subscription_status = $2,
  subscription_expires_at = $3,
  stripe_subscription_id = $4,
  updated_at = CURRENT_TIMESTAMP
WHERE id = $1;
```

### Listar usuarios con suscripción activa
```sql
SELECT id, email, subscription_expires_at
FROM neon_auth.users
WHERE subscription_status = 'active'
ORDER BY subscription_expires_at ASC;
```

## Relaciones

```
users (1) ──── (N) pages
  ↓
  stripe_customer_id ──► Stripe Account
  stripe_subscription_id ──► Stripe Subscription
```

## Tipos de Datos

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | TEXT | UUID |
| `username`, `email` | CITEXT | Case-insensitive |
| `password` | TEXT | Bcrypt hasheado |
| `is_special` | BOOLEAN | Flag para usuarios especiales |
| `stripe_customer_id` | TEXT | De Stripe |
| `subscription_status` | VARCHAR(50) | Enum-like |
| `subscription_expires_at` | TIMESTAMP | Cuándo vence/renueva |
| `data` | JSONB | Toda estructura de Editor.js |
| `page_settings` | JSONB | Colores, estilos globales |

## Constraints

- **PRIMARY KEY**: `id` en cada tabla
- **UNIQUE**: `username`, `email`, `slug`
- **FOREIGN KEY**: `user_id` en pages
- **NOT NULL**: Campos esenciales

## Backups

BD en Neon Cloud (PostgreSQL serverless). Backups automáticos cada 24h.

Para respaldar localmente:
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## Monitoring

Queries lentos:
```sql
SELECT query, mean_time FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

---

[← Atrás](./02-subscriptions.md) | [Documentación →](../README.md)
