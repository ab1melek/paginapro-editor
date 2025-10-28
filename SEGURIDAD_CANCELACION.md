# 🔐 Análisis de Seguridad: Cancelación sin Cobros Automáticos

## El Problema
Después de que un usuario cancela su suscripción, **NO debe haber ningún cobro automático** bajo ninguna circunstancia. Esto podría causar graves problemas legales y de confianza.

## La Solución Implementada

### 1. Cancelación en Stripe (INMEDIATA)
```javascript
// app/api/stripe/cancel-subscription/route.js
const cancelledSubscription = await stripe.subscriptions.del(subscriptionId);
```

**¿Por qué `del()` y no `update(...cancel_at_period_end)`?**

| Método | Behavior | Cobro? | Renovación? |
|--------|----------|--------|------------|
| `stripe.subscriptions.del(id)` | Cancela AHORA | ❌ NO | ❌ NO |
| `stripe.subscriptions.update(id, {cancel_at_period_end: true})` | Cancela al final del período | ✅ SÍ cobro | ✅ Sí renueva |

→ Usamos `del()` porque es **100% seguro** y no causa renovación.

---

### 2. Estados en BD

La BD mantiene sincronización con Stripe:

```
subscription_status: 'active'
    ↓ [Usuario cancela]
subscription_status: 'canceled' (inmediato en nuestro endpoint)
    ↓ [Stripe envía webhook]
subscription_status: 'expired' (webhook confirma)
```

**Garantía**: Si está en `'canceled'` o `'expired'`, la página NO se muestra.

---

### 3. Protecciones en el Webhook

#### 3.1 Evento `customer.subscription.deleted`
```javascript
case "customer.subscription.deleted": {
  const sub = event.data.object;
  // ...
  await expireSubscriptionForUser(userId);
  // subscription_status = 'expired' → página bloqueada
}
```
→ Confirma en BD que fue cancelada.

#### 3.2 Evento `invoice.paid`
```javascript
case "invoice.paid": {
  const invoice = event.data.object;
  // Solo registramos que fue pagado
  // NO renovamos ni hacemos nada especial
}
```
→ Si está cancelada, Stripe NUNCA envía este evento para esa suscripción.

#### 3.3 Evento `invoice.payment_failed`
```javascript
case "invoice.payment_failed": {
  const invoice = event.data.object;
  // Registramos el fallo
  // Stripe reintentará automáticamente según su política
  // Si está cancelada, NO habrá intentos
}
```
→ Stripe maneja reintentos, nosotros solo registramos.

---

### 4. Por qué Stripe NO cobrará después de `del()`

Según la documentación de Stripe:

> When you delete a subscription, Stripe immediately stops billing. The subscription status becomes `canceled` and no further invoices will be created.

**Esto es vinculante**:
- ✅ No hay facturas pendientes generadas automáticamente
- ✅ No hay reintentos de pago para facturas futuras
- ✅ No hay renovación automática
- ✅ El cliente está protegido

---

## Escenarios de Prueba

### Escenario 1: Usuario cancela voluntariamente
```
1. Usuario hace clic "Cancelar suscripción"
2. stripe.subscriptions.del(id) ✅
3. BD: subscription_status = 'canceled'
4. Webhook: customer.subscription.deleted
5. BD: subscription_status = 'expired'
6. Resultado: ❌ Sin cobro, página bloqueada
```

### Escenario 2: Tarjeta rechazada antes de cancelar
```
1. invoice.payment_failed → Stripe reintenta automáticamente
2. Usuario cancela suscripción
3. stripe.subscriptions.del(id) ✅
4. Resultado: ❌ Sin cobro adicional, página bloqueada
```

### Escenario 3: Usuario cancela justo antes de renovación
```
1. Suscripción expira mañana
2. Usuario cancela hoy
3. stripe.subscriptions.del(id) ✅ (cancela antes de renovar)
4. Resultado: ❌ Sin cobro, página bloqueada
```

### Escenario 4: Webhook no llega (edge case)
```
1. Usuario cancela → BD: status = 'canceled'
2. Webhook falla
3. Pero stripe.subscriptions.del() ya se ejecutó
4. En Stripe Dashboard: status = 'canceled' (seguro)
5. En BD: status = 'canceled' (seguro)
6. Resultado: ✅ Página bloqueada de todos modos
```

---

## Verificación de Seguridad

### Antes de producción, verifica:

```sql
-- 1. Usuario canceló correctamente
SELECT id, email, subscription_status, stripe_subscription_id 
FROM neon_auth.users 
WHERE subscription_status IN ('canceled', 'expired');

-- 2. No hay usuarios activos que NO deberían estar
SELECT id, email, subscription_status, subscription_expires_at
FROM neon_auth.users
WHERE subscription_status = 'active' 
  AND subscription_expires_at < NOW();
```

### En Stripe Dashboard:

```
1. Ve a Subscriptions
2. Busca una cancelada (status = "Canceled")
3. Verifica que:
   - No haya invoice pendiente (Current Period → ninguno)
   - canceled_at tenga la fecha de cancelación
   - No habrá "upcoming invoice"
```

---

## Posibles Problemas y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| Usuario ve "Suscripción cancelada" pero no canceló | BD desincronizada | Ejecutar webhook manualmente o sincronizar |
| Página se muestra aunque esté cancelada | El check en `[slug]/page.js` no funciona | Verifica `subscription_status` en BD |
| Stripe envía `invoice.paid` después de cancelar | Webhook mal configurado | Revisa `STRIPE_WEBHOOK_SECRET` |
| Usuario fue cobrado después de cancelar | NO DEBERÍA PASAR si usamos `del()` | Revisar logs de Stripe y webhook |

---

## Código de Referencia Rápida

### Para el equipo: Cómo está protegido

```javascript
// ✅ SEGURO: Cancelación inmediata en Stripe
await stripe.subscriptions.del(subscriptionId);

// ✅ SEGURO: BD marca como cancelada
UPDATE neon_auth.users SET subscription_status = 'canceled'

// ✅ SEGURO: Acceso bloqueado
if (owner.subscription_status === "canceled") {
  return <BlockedPage />;
}

// ❌ INSEGURO: Esto causaría cobro
// await stripe.subscriptions.update(id, { cancel_at_period_end: true });
```

---

## Auditoría de Seguridad

Para auditar que todo funciona:

```bash
# 1. Crear usuario de prueba
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testcancel",
    "email": "testcancel@example.com",
    "password": "Test123!"
  }'

# 2. Crear suscripción (simular con Stripe)
# → Usar Stripe Dashboard o webhook de prueba

# 3. Cancelar suscripción
curl -X POST http://localhost:3000/api/stripe/cancel-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: token=..." \
  -d '{"subscriptionId": "sub_...", "confirmed": true}'

# 4. Verificar en BD
psql -c "SELECT subscription_status FROM neon_auth.users WHERE username='testcancel';"
# Resultado esperado: canceled

# 5. Verificar acceso bloqueado
curl http://localhost:3000/slug-del-usuario
# Resultado esperado: "🔒 Suscripción cancelada"

# 6. Verificar en Stripe
# Dashboard → Subscriptions → Buscar "sub_..." → Status debe ser "Canceled"
```

---

## Conclusión

El sistema está diseñado con múltiples capas de seguridad:

1. **Capa Stripe**: `subscriptions.del()` garantiza no se cobren
2. **Capa BD**: Status = 'canceled' bloquea acceso
3. **Capa Webhook**: Confirma y sincroniza estados
4. **Capa UI**: Usuario ve confirmación clara

**Garantía**: Si un usuario cancela, NO hay cobro automático. Período.
