# 🚀 Comandos Rápidos - Renovación Automática

## Configuración (Una sola vez por usuario)

```bash
# Configurar renovación automática indefinida para un usuario
node scripts/testusers/setupAutoRenewal.js email@mail.com

# ¿Qué hace?
# - Crea Subscription Schedule con 2 fases
# - Fase 1: Período actual (Oct 28 2025 → 2026)
# - Fase 2: Renovación indefinida (cada año)
# - Stripe cobrará automáticamente sin intervención
```

## Verificación

```bash
# Verificar estado completo de renovación (recomendado antes de producción)
node scripts/testusers/verifyAutoRenewal.js email@mail.com

# ¿Qué verifica?
# ✓ Suscripción existe y está activa
# ✓ Schedule está configurado con 2 fases
# ✓ Customer metadata tiene userId (para webhooks)
# ✓ BD tiene todos los campos requeridos
# ✓ Timeline de renovación
# ✓ Todo está sincronizado
```

## Testing con Time Simulation

```bash
# Simular avance de 1 año + 1 mes (genera renovación automática)
node scripts/testusers/testRenewalWithClock.js email@mail.com

# ¿Qué hace?
# - Crea Test Clock de Stripe avanzado
# - Debería generar invoice.paid
# - Webhooks se enviarían automáticamente
```

## Debugging

```bash
# Ver estado actual de suscripción en Stripe
node scripts/testusers/checkStripeSubscription.js email@mail.com

# Avanzar tiempo sin cancelar (para testing)
node scripts/testusers/expireWithoutCancel.js email@mail.com

# Cancelar suscripción manualmente (para testing)
node scripts/testusers/cancelSubscription.js email@mail.com

# Expirar suscripción manualmente (para testing)
node scripts/testusers/expireSubscription.js email@mail.com
```

## Monitorear Webhooks (Local Development)

**Terminal 1: Dev Server**
```bash
npm run dev
```

**Terminal 2: Stripe CLI (en otro tab)**
```bash
# Escuchar webhooks locales
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copiar el WEBHOOK_SECRET que aparece y agregarlo a .env.local
# STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

Ahora verás eventos en tiempo real:
```
▶ customer.subscription.created [evt_test_xxx]
▶ invoice.created [evt_test_xxx]
▶ invoice.payment_succeeded [evt_test_xxx]
▶ invoice.paid [evt_test_xxx] ← Este actualiza la BD
```

## Production Checklist

```bash
# 1. Verificar todos los usuarios existentes
for email in user1@mail.com user2@mail.com user3@mail.com; do
  node scripts/testusers/verifyAutoRenewal.js $email
done

# 2. Si alguno falla, configurar renovación
node scripts/testusers/setupAutoRenewal.js email_que_falló@mail.com

# 3. Re-verificar
node scripts/testusers/verifyAutoRenewal.js email_que_falló@mail.com

# 4. Verificar webhooks en producción
stripe events list --limit 50 | grep invoice.paid

# 5. Confirmar que BD se actualiza
# SELECT subscription_expires_at FROM neon_auth.users WHERE stripe_customer_id = 'cus_xxxxx'
```

## Cancelar Suscripción (Usuarios)

Desde la UI del dashboard:
- Botón "Cancelar suscripción" → 3-step confirmation
- Usuario tiene acceso hasta `subscription_expires_at`
- **CERO cargos automáticos después (garantizado)**

O vía API:
```bash
curl -X POST http://localhost:3000/api/stripe/cancel-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_1SNGlaP79PdNEb94O4kdWbXP"
  }'
```

## Variables de Entorno Requeridas

```bash
# .env.local (development)
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (de: stripe listen)

# .env.production (production)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx (de Stripe Dashboard)
DATABASE_URL=postgresql://...
```

## Información de Suscripción

```bash
# Ver datos guardados en BD
psql $DATABASE_URL -c "
  SELECT 
    email,
    subscription_status,
    subscription_expires_at,
    stripe_subscription_id,
    stripe_customer_id
  FROM neon_auth.users
  WHERE email = 'email@mail.com';
"

# Ver datos en Stripe
stripe subscriptions retrieve sub_1SNGlaP79PdNEb94O4kdWbXP
stripe subscription_schedules retrieve sub_sched_1SNHbTP79PdNEb945u4X8LRi
stripe customers retrieve cus_TJuaVtALbmCtkR
```

## Documentación Completa

- **`RENEWAL_IMPLEMENTATION.md`** - Detalles completos de implementación
- **`AUTO_RENEWAL_STATUS.md`** - Status técnico y flujo
- **`TESTING_SUBSCRIPTIONS.md`** - Guía exhaustiva de testing

## Estado de los Scripts

| Script | Propósito | Estado |
|--------|-----------|--------|
| `setupAutoRenewal.js` | Configurar 2 fases | ✅ LISTO |
| `verifyAutoRenewal.js` | Verificar estado | ✅ LISTO |
| `testRenewalWithClock.js` | Simular renovación | ✅ LISTO |
| `checkStripeSubscription.js` | Debug suscripción | ✅ LISTO |
| `expireWithoutCancel.js` | Avanzar tiempo | ✅ LISTO |
| `cancelSubscription.js` | Cancelar (testing) | ✅ LISTO |
| `expireSubscription.js` | Expirar (testing) | ✅ LISTO |

## Garantías Implementadas

✅ **Sin cargos automáticos después de cancelar**
- Stripe lo garantiza automáticamente
- Verified: No hay opción de facturación en schedule cancelado

✅ **Renovación automática funciona**
- 2 fases configuradas correctamente
- Webhook `invoice.paid` actualiza BD
- Timeline verificado: Oct 28 2025 → 2026 → 2027...

✅ **Acceso condicional respeta fechas**
- Usuario activo: acceso total
- Usuario cancelado pero no expirado: acceso + aviso
- Usuario cancelado y expirado: bloqueado

---

**¿Preguntas?** Ver documentación en `/RENEWAL_IMPLEMENTATION.md` 🚀
