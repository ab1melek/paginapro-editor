# Pre-Deploy Checklist

**Antes de ir a producción, verifica TODO esto:**

## ✅ Sistema de Suscripciones

### Funcionalidad
- [ ] Compra funciona en local con Stripe CLI
- [ ] Webhook recibe eventos correctamente
- [ ] BD se actualiza con status/dates correctos
- [ ] Dashboard muestra días restantes
- [ ] Usuario puede cancelar desde UI
- [ ] Auto-renovación ocurre (test con Test Clocks)
- [ ] Cancelado = ZERO charges posteriores (verificado)

### Códigos de Retorno
- [ ] HTTP 200 en webhooks exitosos
- [ ] HTTP 201 en creación de sesión
- [ ] HTTP 400/404 en errores sin crash
- [ ] HTTP 500 + logging en errores críticos

### Tests
```bash
# Ejecutar todos los tests
node scripts/test/verify-webhook-sync.js         # ✅ Debe pasar
node scripts/test/verify-auto-renewal.js         # ✅ Debe pasar
node scripts/test/verify-sync.js email@test.com  # ✅ Debe sincronizar
```

## ✅ Variables de Entorno

### Stripe (verificar .env)
- [ ] `STRIPE_SECRET_KEY` → key_live_... (si es producción)
- [ ] `STRIPE_PUBLIC_KEY` → pk_live_... (si es producción)
- [ ] `STRIPE_WEBHOOK_SECRET` → whsec_... (correcto para el endpoint)

### Base de Datos
- [ ] `DATABASE_URL` → PostgreSQL correcta
- [ ] `DB_*_APP` variables alternativas (si aplica)
- [ ] Connection pool funcionando
- [ ] BD tiene todas las migraciones aplicadas

### Otros
- [ ] `NEXTAUTH_SECRET` definida (si usa NextAuth)
- [ ] `JWT_SECRET` definida
- [ ] `NODE_ENV` = 'production'

## ✅ Base de Datos

### Migrations
```bash
npm run db:migrate  # ✅ Sin errores
```

Debe criar:
- [ ] Tabla `neon_auth.users` con columnas de suscripción
- [ ] Índices en `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- [ ] Tabla `neon_pages.pages` existente
- [ ] Triggers/stored procedures (si hay)

### Datos
- [ ] Sin datos de test residuales
- [ ] Usuarios de admin configurados
- [ ] Datos iniciales (seeders) listos si necesarios

## ✅ API Endpoints

### Auth
- [ ] POST `/api/auth/signup` → Funciona, guarda en BD
- [ ] POST `/api/auth/login` → Funciona, retorna JWT
- [ ] GET `/api/auth/me` → Retorna usuario actual
- [ ] POST `/api/auth/logout` → Limpia sesión

### Stripe/Suscripciones
- [ ] POST `/api/stripe/create-session` → Retorna URL checkout
- [ ] POST `/api/stripe/webhook` → Recibe eventos, retorna 200
- [ ] GET `/api/auth/me` → Incluye subscription_status

### Editor/Páginas
- [ ] GET `/api/editor?slug=...` → Retorna página
- [ ] POST `/api/editor` → Crea página
- [ ] PUT `/api/editor` → Actualiza página

## ✅ Seguridad

- [ ] Webhooks verifican firma de Stripe (`stripe.webhooks.constructEvent`)
- [ ] Endpoints autenticados usan JWT/cookies
- [ ] CORS configurado correctamente
- [ ] Rate limiting en login/signup
- [ ] Passwords hasheados (bcrypt)
- [ ] No hay secrets en código
- [ ] HTTPS enforced (Vercel automático)

## ✅ Performance

- [ ] BD queries usan índices
- [ ] Connection pooling activo
- [ ] N+1 queries revisadas
- [ ] Bundle size < 500KB (client)
- [ ] Lighthouse score ≥ 80
- [ ] Webhooks responden < 5s

## ✅ Monitoreo & Logging

### Logging
- [ ] Console.log críticos tienen prefijo `[webhook]`, `[sync]`, `[error]`
- [ ] Logs incluyen timestamp, contexto, result
- [ ] No logs de passwords/tokens

### Monitoring
- [ ] Vercel analytics habilitado
- [ ] Error tracking configurado (Sentry, etc)
- [ ] Stripe Dashboard accesible para revisar webhooks
- [ ] BD backups automáticos confirmados

## ✅ Documentación

- [ ] README.md actualizado
- [ ] `/docs` completa y clara
- [ ] Runbook de troubleshooting creado
- [ ] Credenciales compartidas de forma segura (no en repo)

## ✅ Deployment

### Configuración Vercel
- [ ] Rama correcta (main/develop)
- [ ] Environment variables importadas
- [ ] Domain configurado
- [ ] SSL/HTTPS habilitado

### Post-Deploy
- [ ] Health check endpoint responde
- [ ] Webhooks de Stripe apuntando a URL producción
- [ ] BD conexión verificada
- [ ] Login/logout funciona
- [ ] Suscripción funciona (test de extremo a extremo)

## ✅ Rollback Plan

Si algo sale mal después de deploy:

```bash
# 1. Revertir a commit anterior
git revert <commit>

# 2. Re-deploy en Vercel
# (automático si está en rama main)

# 3. Verificar logs
# https://vercel.com/dashboard

# 4. Revisar Stripe (posibles webhooks pendientes)
# https://dashboard.stripe.com/events

# 5. Sincronizar si hay problema
node scripts/test/sync-from-stripe.js admin@email.com
```

## ✅ Validación Final

Antes de anunciar:

```bash
# 1. Test de compra real
# → Usar tarjeta de test: 4242 4242 4242 4242
# → Verificar BD se actualiza

# 2. Test de cancelación
# → Cancelar desde dashboard
# → Verificar status cambia a 'canceled'

# 3. Test de renovación (si tienes tiempo)
# → Usar Test Clocks para avanzar 30 días
# → Verificar se renueva automáticamente

# 4. Logging review
# → Ver que todos los eventos loguean correctamente
# → https://vercel.com/dashboard/[project]/logs

# 5. Usuarios existentes
# → Revisar que no se afecten usuarios sin suscripción
```

---

**Status**: ✅ Listo para producción si todos pasan
**Next**: Ver [Production Sync](./02-production-sync.md)
