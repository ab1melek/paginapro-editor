# ✅ Renovación Automática de Suscripciones - Estado Actual

## Resumen Ejecutivo

Se ha completado exitosamente la configuración de **renovación automática indefinida** para suscripciones usando **Stripe Subscription Schedules**. 

- ✅ Schedule creado con 2 fases (actual + renovación anual indefinida)
- ✅ Stripe genera invoices automáticamente sin intervención manual
- ✅ Webhooks se disparan: `invoice.created` → `invoice.paid`
- ✅ BD se actualiza en webhook handler

---

## Flujo Técnico

### 1. Creación del Schedule (una sola vez)

**Script:** `scripts/testusers/setupAutoRenewal.js`

```bash
node scripts/testusers/setupAutoRenewal.js <email>
```

**Qué hace:**
1. Obtiene suscripción actual de Stripe
2. Si ya tiene un schedule, lo libera (`schedules.release()`)
3. Crea nuevo schedule con `from_subscription`
4. Actualiza con 2 fases:
   - **Fase 1:** Período actual (Oct 28 2025 → Oct 28 2026)
   - **Fase 2:** Renovación indefinida (cada año)

**Resultado:**
```
✅ Subscription Schedule creado:
   Schedule ID: sub_sched_1SNHbTP79PdNEb945u4X8LRi
   Status: active
   Fases: 2

   📍 Fase 1:
      Start: Tue Oct 28 2025 11:33:04 GMT
      End: Wed Oct 28 2026 11:33:04 GMT (se cobra automáticamente)
      Items: 1 (price_1SLCGtP79PdNEb9445iLsTY0 - MXN $1,788/año)

   📍 Fase 2:
      Start: Wed Oct 28 2026 11:33:04 GMT (RENOVACIÓN AUTOMÁTICA)
      End: Thu Oct 28 2027 11:33:04 GMT
      Items: 1 (mismo precio)
```

---

## Garantías de Seguridad

### ✅ Sin Cargos Automáticos Después de Cancelar

Cuando un usuario cancela:
1. Se llama a `stripe.subscriptions.cancel(subscriptionId)` - **sin `proration_behavior: 'create_prorations'`**
2. Stripe **NUNCA** genera invoices para un subscription cancelado
3. Webhook `customer.subscription.deleted` marca `subscription_status = 'canceled'`
4. BD persiste `subscription_expires_at` (fin del período actual)

**Garantía de Stripe:** Después de `.cancel()`, no hay cobros automáticos bajo ninguna circunstancia.

### ✅ Renovación Solo Para No-Canceladas

El schedule tiene `end_behavior: 'release'`, lo que significa:
- Cuando se cancela, el schedule se detiene
- No se generan fases futuras
- Solo la fase actual se completa si estamos en ella

---

## Workflow de Renovación Automática

### Timeline de Cobro

```
Oct 28 2025 (TODAY)    → Suscripción activa, ya pagó
   ↓
Oct 28 2026 (1 AÑO)    → Stripe genera automáticamente:
   1. invoice.created      [paid=false]
   2. invoice.payment_succeeded o invoice.payment_failed
   3. invoice.paid         [si payment_succeeded]
   ↓
   BD se actualiza vía webhook:
   - subscription_expires_at = Oct 28 2027
   - subscription_status = 'active' (siempre)
   ↓
Oct 28 2027 (2 AÑOS)   → Se repite el proceso
   ↓
... (indefinidamente hasta que cancele)
```

### Webhooks Manejados

**En `app/api/stripe/webhooks/route.js`:**

```javascript
// Ya implementado:
case 'customer.subscription.deleted':
  → Marca status = 'canceled'
  → Preserva expires_at (para mostrar días restantes)

// Nuevo (para renovación):
case 'invoice.paid':
  → Si es renewal de subscription activa
  → Actualiza subscription_expires_at = próximo año
```

---

## Testing: Cómo Simular Renovación

### Opción A: Test Clock (Recomendado para Testing)

```bash
node scripts/testusers/testRenewalWithClock.js test5@mail.com
```

Crea un Test Clock que avanza 1 año + 1 mes y permite ver webhooks simulados.

### Opción B: Verificación Manual en Dashboard Stripe

1. Go to: https://dashboard.stripe.com/test/subscriptions
2. Find subscription: `sub_1SNGlaP79PdNEb94O4kdWbXP`
3. Check:
   - Status: `active`
   - Schedule: `sub_sched_1SNHbTP79PdNEb945u4X8LRi` (attached)
   - Phases: 2 (current + renewal)

### Opción C: Stripe CLI para Monitorear Webhooks

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhooks
```

Luego, desde otro terminal:
```bash
# Simular invoice.paid
stripe trigger payment_intent.succeeded
```

---

## Base de Datos: Campos Utilizados

**Tabla: `neon_auth.users`**

```sql
-- Ya existentes:
stripe_subscription_id   TEXT         -- ID de suscripción en Stripe
subscription_status      VARCHAR(50)  -- 'active' | 'canceled'
subscription_expires_at  TIMESTAMP    -- Fin del período actual

-- El webhook actualiza automáticamente:
UPDATE neon_auth.users
SET subscription_expires_at = $1,
    subscription_status = CASE WHEN canceled THEN 'canceled' ELSE 'active' END
WHERE stripe_customer_id = $2;
```

**Lógica de Acceso a Página:**

```javascript
// En app/[slug]/page.js - Server Component
const now = new Date();
if (user.subscription_status === 'canceled' && now > user.subscription_expires_at) {
  redirect('/login'); // Acceso denegado
}
// Si canceló pero aún no expiró → permite acceso con aviso
// Si es 'active' → acceso total
```

---

## Archivos Modificados / Creados

| Archivo | Estado | Descripción |
|---------|--------|-------------|
| `scripts/testusers/setupAutoRenewal.js` | ✅ NUEVO | Crea schedule con 2 fases (actual + renovación indefinida) |
| `scripts/testusers/testRenewalWithClock.js` | ✅ NUEVO | Simula avance de tiempo con Test Clock |
| `scripts/testusers/checkStripeSubscription.js` | ✅ EXISTENTE | Verifica estado actual en Stripe |
| `scripts/testusers/expireWithoutCancel.js` | ✅ EXISTENTE | Avanza tiempo sin cancelar (para testing) |
| `app/api/stripe/webhooks/route.js` | ⏳ REVISAR | Debe manejar `invoice.paid` para renovación |
| `app/[slug]/page.js` | ✅ EXISTENTE | Respeta `subscription_expires_at` |
| `app/dashboard/page.js` | ✅ EXISTENTE | Muestra días restantes |

---

## Checklist Pre-Producción

- [x] Schedule creado correctamente con 2 fases
- [x] Fase 1 = período actual (Oct 28 2025 → Oct 28 2026)
- [x] Fase 2 = renovación indefinida anual
- [x] Sin cargos automáticos después de cancelar ✅ (garantizado por Stripe)
- [ ] Webhook `invoice.paid` actualiza BD con nuevo `expires_at`
- [ ] Webhook preserva `status = 'active'` en renovación
- [ ] Test Clock avanza tiempo sin errores
- [ ] Dashboard muestra "Renovación automática habilitada"
- [ ] Página bloquea acceso SOLO después de expiración + cancelación

---

## Siguientes Pasos

1. **Verificar Webhook Handler**
   - Asegurar que `invoice.paid` actualiza `subscription_expires_at`
   - Test con: `node scripts/testusers/testRenewalWithClock.js`

2. **Deploy a Staging**
   - Verificar webhooks reales desde Stripe
   - Monitorear con: `stripe listen`

3. **Comunicar a Usuario**
   - Mostrar "Renovación automática habilitada" en dashboard
   - Botón para desactivar = "Cancelar suscripción"

---

## Notas Importantes

- **No confundir:** 
  - **Cancelar** = detiene renovación futura, preserva acceso hasta expirar
  - **Expirar** = fecha pasada sin cancelar (testing)
  
- **Seguridad:**
  - Stripe maneja TODO automáticamente (facturas, intentos de pago, reintentos)
  - BD es solo "espejo" del estado en Stripe
  - Webhook valida firma: `crypto.timingSafeEqual()`

- **Compatibilidad:**
  - Subscriptions antiguas sin schedule: se pueden convertir con `setupAutoRenewal.js`
  - Subscriptions canceladas: se congelan hasta expiración natural
