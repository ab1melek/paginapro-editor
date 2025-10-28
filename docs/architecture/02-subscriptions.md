# Sistema de Suscripciones

## 🎯 Visión General

El sistema de suscripciones maneja:
- **Compra**: Checkout → Stripe → Webhook → BD
- **Auto-renovación**: Cada mes/año automáticamente
- **Cancelación**: Sin charges posteriores (GARANTIZADO)
- **Dashboard**: El usuario ve días restantes y puede renovar

## 💰 Ciclo de Vida de una Suscripción

```
1. Usuario compra
   ↓
2. Stripe crea subscription (estatus: 'active')
   ↓
3. Webhook 'customer.subscription.created' → BD guardado
   ↓
4. Cada período (30 días, 1 año, etc):
   - Stripe genera invoice automáticamente
   - Webhook 'invoice.paid' → BD actualizado
   ↓
5. Si usuario cancela:
   - Stripe marca como 'canceled'
   - Webhook 'customer.subscription.deleted'
   - BD: status='canceled', NO se renueva más
   ↓
6. Fin del período actual:
   - Último pago procesado
   - Acceso disponible hasta subscription_expires_at
```

## 🔌 Componentes Clave

### Frontend
- **`components/SubscriptionButton.js`**: Botón "Comprar suscripción"
- **`app/dashboard/page.js`**: Muestra status, días restantes, botón cancelación
- **Modal de cancelación**: 3 pasos (confirmación, razón, final)

### Backend - API
```
POST /api/stripe/create-session
  → Crea sesión de checkout

POST /api/stripe/webhook
  → Maneja eventos de Stripe
  → Sincroniza BD automáticamente

GET /api/auth/me
  → Retorna status de suscripción del usuario
```

### Backend - Servicios
```
stripe.db.service.js
├── saveSubscriptionForUser()        → Guarda sub en BD
├── getUserSubscriptionStatus()      → Lee status actual
├── expireSubscriptionForUser()      → Marca como expirado
└── saveStripeCustomerForUser()      → Guarda customer ID

sync.db.service.js
├── syncSubscriptionFromStripe()     → Sincroniza desde Stripe
├── validateSync()                   → Verifica consistencia
└── emergencySyncIfNeeded()          → Sincroniza si necesario
```

### BD Schema
```sql
-- Columnas de suscripción en tabla 'users'
stripe_customer_id        TEXT
stripe_subscription_id    TEXT
subscription_status       VARCHAR(50)   -- 'active', 'canceled', 'none'
subscription_expires_at   TIMESTAMP     -- Fin del período actual
```

## 🔄 Webhook Events Handled

| Evento | Qué hace | BD Update |
|--------|----------|-----------|
| `checkout.session.completed` | Pago exitoso, crear sub | Guarda customer ID |
| `customer.subscription.created` | Nueva suscripción | Status='active' + expires_at |
| `customer.subscription.updated` | Cambio en suscripción | Actualiza dados |
| `customer.subscription.deleted` | Usuario canceló | Status='canceled' |
| `invoice.paid` | Renovación procesada | Actualiza expires_at |

Cada uno llama automáticamente a `syncSubscriptionFromStripe()`.

## 🔐 Garantías de Seguridad

### ZERO Charges después de cancelar
```
1. Usuario cancela → BD status='canceled'
2. Stripe genera invoice al fin del período
3. Webhook recibe 'invoice.payment_failed'
   (porque suscripción está cancelada en Stripe)
4. NO SE COBRA NADA

Garantía: Imposible cobrar después de cancelar.
Cómo: Stripe respeta el estado 'canceled'.
```

### Sincronización Garantizada
```
Si BD se desincroniza por cualquier razón:
1. Siguiente webhook dispara syncSubscriptionFromStripe()
2. Fetch estado ACTUAL de Stripe
3. Actualiza BD con valores correctos
4. Logging completo para debugging

Garantía: BD siempre reflejará Stripe dentro de milisegundos.
```

## 📊 Estados Posibles

```
'none'      → Usuario sin suscripción activa
'active'    → Suscripción vigente, renovación garantizada
'canceled'  → Usuario canceló, NO se renueva
'expired'   → Período pasado, acceso revocado
'trial'     → Período de prueba (si aplica)
```

## 📈 Auto-Renovación (2 Fases)

Usamos Stripe **Subscription Schedules** para garantizar renovación automática:

```
Fase 1: Suscripción inicial (1 mes / 1 año)
├─ current_period_end = fecha_renovación
└─ Status: 'active'

Fase 2: Renovación indefinida
├─ Automática cada período
├─ Status: 'active' siempre
└─ Se renueva hasta que usuario cancele
```

Si usuario cancela:
```
Stripe cancela toda la schedule
→ Webhook 'customer.subscription.deleted'
→ BD status='canceled'
→ NO habrá más renovaciones
```

## 🛠️ Testing

Todos los scripts en `/scripts/test/`:

```bash
# Setup auto-renewal para un usuario
node scripts/test/setup-auto-renewal.js email@test.com

# Verificar que todo esté sincronizado
node scripts/test/verify-sync.js email@test.com

# Sincronizar manualmente si hay problema
node scripts/test/sync-from-stripe.js email@test.com

# Verificar que webhooks sincronicen (testing de cobertura)
node scripts/test/verify-webhook-sync.js
```

## 📚 Más Información

- [Implementación técnica](./02-implementation.md) - Detalles de código
- [Estrategia de sincronización](./03-sync-strategy.md) - Cómo garantizar consistencia
- [Testing local](../guides/01-testing-local.md) - Cómo testear
- [Production debugging](../deployment/03-production-debugging.md) - Resolver problemas

---

[← Atrás: Overview](./01-overview.md) | [Siguiente: Implementación →](./02-implementation.md)
