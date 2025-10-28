# PaginaPro Editor - Documentación

**Esta es la carpeta centralizada para TODA la documentación del proyecto.** Está organizada por temas para máxima claridad y escalabilidad.

## 📋 Índice Rápido

### 🏗️ [Arquitectura](./architecture/)
- [Visión General](./architecture/01-overview.md) - Estructura del proyecto y componentes clave
- [Sistema de Suscripciones](./architecture/02-subscriptions.md) - Flujo de pago, renovación, cancelación
- [BD Schema](./architecture/03-database.md) - Estructura de tablas y migraciones

### 💳 [Suscripciones](./subscriptions/)
- [Guía Completa](./subscriptions/01-guide.md) - Qué es, cómo funciona, qué esperar
- [Implementación](./subscriptions/02-implementation.md) - Detalles técnicos y decisiones de diseño
- [Sincronización BD-Stripe](./subscriptions/03-sync-strategy.md) - Cómo se garantiza consistencia

### 🚀 [Deployment & Producción](./deployment/)
- [Checklist Pre-Deploy](./deployment/01-predeploy-checklist.md) - Verificaciones antes de ir a producción
- [Sincronización en Producción](./deployment/02-production-sync.md) - Monitoreo y resolución de desincronizaciones
- [Debugging en Producción](./deployment/03-production-debugging.md) - Herramientas y comandos útiles

### 🔌 [API Reference](./api/)
- [Stripe Webhooks](./api/01-stripe-webhooks.md) - Eventos y handlers
- [Endpoints de Subscripción](./api/02-subscription-endpoints.md) - POST/GET/PUT para suscripciones

### 📖 [Guías & How-To](./guides/)
- [Testing Local](./guides/01-testing-local.md) - Cómo testear con Stripe CLI
- [Testing con Test Clocks](./guides/02-test-clocks.md) - Avanzar tiempo, simular renovaciones
- [Debugging de Problemas](./guides/03-debugging.md) - Solucionar desincronizaciones

---

## 🎯 Puntos Clave del Proyecto

### Lo que funciona ✅
- **Compra de suscripción**: Checkout → Stripe → BD
- **Auto-renovación**: Subscription Schedules (2 fases)
- **Cancelación**: ZERO charges después de cancelar
- **Dashboard**: Muestra días restantes + opción de renovación
- **Sincronización**: BD-Stripe sincronizadas en TODOS los webhooks
- **Validación**: Scripts para verificar consistencia

### Garantía de Sincronización
Cada webhook trigger (`customer.subscription.created/updated/deleted`, `invoice.paid`) ejecuta automáticamente `syncSubscriptionFromStripe()` para garantizar que BD siempre refleje Stripe.

---

## 📁 Estructura de Carpetas

```
docs/
├── README.md                    ← Estás aquí
├── subscriptions/               → Documentación de suscripciones
│   ├── 01-guide.md
│   ├── 02-implementation.md
│   └── 03-sync-strategy.md
├── architecture/                → Arquitectura del proyecto
│   ├── 01-overview.md
│   ├── 02-subscriptions.md
│   └── 03-database.md
├── deployment/                  → Deployment y producción
│   ├── 01-predeploy-checklist.md
│   ├── 02-production-sync.md
│   └── 03-production-debugging.md
├── guides/                      → Guías prácticas
│   ├── 01-testing-local.md
│   ├── 02-test-clocks.md
│   └── 03-debugging.md
└── api/                         → Referencia de APIs
    ├── 01-stripe-webhooks.md
    └── 02-subscription-endpoints.md
```

---

## 🛠️ Scripts de Testing

Todos en `/scripts/test/`:

```bash
# Crear usuario de test
node scripts/test/create-user.js email@test.com

# Crear schedule de auto-renovación
node scripts/test/setup-auto-renewal.js email@test.com

# Verificar sincronización
node scripts/test/verify-sync.js email@test.com

# Sincronizar manualmente si hay problema
node scripts/test/sync-from-stripe.js email@test.com

# Verificar que todos los webhooks sincronicen (test de cobertura)
node scripts/test/verify-webhook-sync.js
```

---

## 📊 Estado Actual

| Componente | Estado | Notas |
|-----------|--------|-------|
| Compra | ✅ | Funcional, webhooks procesando |
| Auto-renovación | ✅ | 2-phase Subscription Schedules |
| Cancelación | ✅ | ZERO charges, bloquea renovación |
| Dashboard | ✅ | Muestra días + botón renovación |
| Sync BD-Stripe | ✅ | Automática en todos los webhooks |
| Testing | ✅ | Scripts + Stripe CLI |
| Producción | ⏳ | Listo para deploy |

---

## 🚀 Próximos Pasos (Opcional)

1. **API endpoint de sync admin** (`POST /api/admin/sync-subscription`)
2. **Alertas/monitoreo** de desincronizaciones
3. **Dashboard para admins** con estadísticas de suscripciones

---

## ❓ FAQ Rápido

**¿Qué pasa si BD y Stripe se desincronizam?**
→ El siguiente webhook lo arregla automáticamente. Ver [Debugging de Problemas](./guides/03-debugging.md).

**¿Cómo testo auto-renovación?**
→ Ver [Testing con Test Clocks](./guides/02-test-clocks.md).

**¿Cómo cancelo una suscripción sin charges?**
→ Ver [Guía de Suscripciones](./subscriptions/01-guide.md).

**¿Cómo veo el estado de una suscripción?**
→ `node scripts/test/verify-sync.js email@test.com`

---

**Última actualización:** 28 de octubre, 2025
**Rama:** feature-stripe
**Status:** Listo para producción
