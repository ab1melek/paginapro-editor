# Guía Completa de Suscripciones

## ¿Qué es una suscripción?

Un **plan recurrente** que:
- Usuario paga cantidad X (mensual/anual)
- Stripe renueva automáticamente cada período
- Usuario puede acceder a features premium
- Usuario puede cancelar en cualquier momento

## 🎯 El Usuario - Qué Ve

### Compra Inicial
1. Entra a dashboard
2. Ve botón "Comprar suscripción"
3. Clica → Stripe checkout
4. Paga con tarjeta/Apple Pay/Google Pay
5. Stripe procesa → Compra exitosa

### Después de Comprar
- Dashboard muestra: **"Suscripción activa • Renovación en 28 días"**
- Pueden ver exactamente cuándo vence
- Opción para renovar manualmente (si quieren pagar antes)
- Opción para CANCELAR sin penalidad

### Cancelación
1. Clican botón "Cancelar"
2. Modal pide confirmación (¿estás seguro?)
3. Usuario confirma
4. **GARANTIZADO**: No se cobra nada más
5. Pueden seguir usando hasta fin del período

## 💻 El Admin - Qué Control Tiene

### Ver suscripción de un usuario
```bash
node scripts/test/verify-sync.js email@test.com
```

Output:
```
✅ Usuario encontrado
Subscription ID: sub_xxxxx
Status: active
Renovación: 2025-11-28 (30 días)
```

### Cancelar manualmente
```bash
# Si el usuario no puede (por UI bug)
node scripts/test/cancel-subscription.js email@test.com
```

### Sincronizar si hay desincronización
```bash
# Si BD y Stripe no coinciden
node scripts/test/sync-from-stripe.js email@test.com
```

### Crear suscripción de prueba
```bash
# Para testear sin UI
node scripts/test/setup-auto-renewal.js email@test.com
```

## 🔄 Ciclo Automático

```
DÍA 1: Usuario compra
├─ Compra procesada por Stripe
├─ Webhook llega: "customer.subscription.created"
├─ BD se actualiza: status='active', expires_at=DÍA 31
└─ Dashboard muestra: "30 días restantes"

DÍA 30-31: Renovación automática
├─ Stripe genera invoice automáticamente
├─ Cobra tarjeta del usuario
├─ Webhook llega: "invoice.paid"
├─ BD se actualiza: expires_at=PRÓXIMO MES
└─ Contador reinicia

DÍA N: Usuario cancela (o contigo)
├─ Cancelación registrada en Stripe
├─ Webhook llega: "customer.subscription.deleted"
├─ BD se actualiza: status='canceled'
├─ Dashboard muestra: "Cancelado • Acceso hasta FECHA"
└─ Después de FECHA: Acceso revocado
```

## 🛡️ Garantías

### ✅ ZERO Charges Después de Cancelar
No es posible que Stripe cobre después de que el usuario cancele. Es imposible porque:
1. Cancelación marca subscription como 'canceled' en Stripe
2. Stripe NUNCA genera invoices para suscripciones canceladas
3. Si algo sale mal, el webhook lo sincroniza automáticamente

### ✅ Renovación Automática Siempre Ocurre
Usamos Stripe Subscription Schedules (plan fijo):
- Fase 1: Período actual (1 mes o lo que sea)
- Fase 2: Renovaciones indefinidas (cada mes/año automáticamente)
- Si usuario no cancela, seguirá renovándose para siempre

### ✅ BD-Stripe Siempre Sincronizadas
Cada evento de Stripe dispara `syncSubscriptionFromStripe()`:
- Si pasa algo raro, el siguiente webhook lo arregla
- Máximo desincronización: segundos
- En producción: imperceptible para usuario

## 📊 Estados de Suscripción

| Estado | Significa | Qué puede hacer |
|--------|-----------|-----------------|
| `none` | Sin suscripción | Ver botón "Comprar" |
| `active` | Suscripción vigente | Acceso a features, ver "Cancelar" |
| `canceled` | Usuario canceló | Acceso hasta fin del período |
| `expired` | Período pasado | Sin acceso, ver "Renovar" |
| `trial` | Período de prueba | (Si implementamos) |

## 🔍 Debugging Rápido

**Problema**: Dashboard no muestra información de suscripción
```bash
node scripts/test/verify-sync.js your-email@test.com
```

**Problema**: Usuario dice que no se renovó
```bash
# 1. Verificar status
node scripts/test/verify-sync.js email@test.com

# 2. Verificar si Stripe tiene schedule
grep stripe_subscription_id scripts/test/output.log

# 3. Sincronizar manualmente
node scripts/test/sync-from-stripe.js email@test.com
```

**Problema**: Se cobró dos veces
1. Revisar Stripe Dashboard: https://dashboard.stripe.com/subscriptions
2. Si hay duplicado, contactar Stripe Support
3. Usar refund tool si es error nuestro

## 📞 Stripe Dashboard

**URL**: https://dashboard.stripe.com/

Aquí puedes:
- Ver todas las suscripciones activas
- Ver invoices (pagos procesados)
- Ver disputes (cobros impugnados)
- Hacer refunds manuales
- Ver webhooks recibidos

## 📚 Más Info

- [Sistema Técnico](../architecture/02-subscriptions.md) - Cómo funciona por dentro
- [Sincronización](./03-sync-strategy.md) - Garantía de consistencia
- [Testing](../guides/01-testing-local.md) - Cómo testear
- [Production](../deployment/02-production-sync.md) - En producción

---

[← Atrás: Documentación](../README.md)
