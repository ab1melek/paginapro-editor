# Testing Local - Guía Rápida

## 🚀 Setup de 3 Terminales

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Scripts y testing
cd /path/to/project
# (aquí corres scripts)
```

## 📝 Testing Checklist

### 1️⃣ Usuario & Auth

```bash
# Terminal 3: Crear usuario
node scripts/test/create-user.js test@local.com

# Output:
# ✅ Usuario creado
# ID: xxx
# Email: test@local.com

# Luego: login en UI (http://localhost:3000/login)
```

### 2️⃣ Compra de Suscripción

**En UI:**
1. Login con usuario creado
2. Go to `/dashboard`
3. Click "Comprar Suscripción"
4. Stripe checkout abre
5. Usa tarjeta **4242 4242 4242 4242** (test card)
6. Rellena formulario
7. Click "Pay" → Debe ir a success page

**En Terminal 2 (stripe listen):**
Deberías ver:
```
2025-10-28 14:30:45 → checkout.session.completed [200]
2025-10-28 14:30:46 → customer.subscription.created [200]
```

**En BD:**
```bash
node scripts/test/verify-sync.js test@local.com

# Output:
# ✅ Usuario encontrado
# Subscription ID: sub_xxxxx
# Status: active
# Renovación: 2025-11-28 (30 días)
```

### 3️⃣ Cancelación

**En UI:**
1. Go to `/dashboard`
2. Click "Cancelar Suscripción"
3. Modal pide confirmación
4. Enter razón (opcional)
5. Click "Confirmar Cancelación"

**Verificación:**
```bash
node scripts/test/verify-sync.js test@local.com

# Output debe mostrar:
# Status: canceled
# Renovación: (ninguna)
```

**En Stripe CLI (Terminal 2):**
```
2025-10-28 14:35:12 → customer.subscription.deleted [200]
```

### 4️⃣ Auto-Renovación (con Test Clocks)

```bash
# Terminal 3: Setup auto-renewal
node scripts/test/setup-auto-renewal.js test@local.com

# Output:
# ✅ Subscription Schedule creado
# Fase 1: Termina 2025-11-28
# Fase 2: Indefinida (auto-renews)

# Avanzar 30 días
node scripts/test/test-renewal-with-clock.js test@local.com

# Verificar renovación
node scripts/test/verify-sync.js test@local.com

# Status debe ser 'active'
# Renovación debe ser 30 días adelante
```

## 🔧 Debugging Common Issues

### Problema: Checkout abre pero no completa

**Debug:**
```bash
# 1. Ver logs de Next.js (Terminal 1)
# Busca errores en /api/stripe/create-session

# 2. Verificar STRIPE_PUBLIC_KEY
# En navegador console: check localStorage

# 3. Ver en Stripe Dashboard
# https://dashboard.stripe.com/test/dashboard
```

### Problema: Webhook no llega

**Check:**
```bash
# 1. Terminal 2 (stripe listen) debe mostrar conectado:
# > Ready! Your webhook signing secret is: whsec_xxxxx

# 2. Verificar .env tiene STRIPE_WEBHOOK_SECRET
grep STRIPE_WEBHOOK_SECRET .env

# 3. Si cambiaste secret, para/reinicia stripe listen
# Ctrl+C en Terminal 2
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. Reintenta compra en UI
```

### Problema: BD no actualiza después de compra

**Debug:**
```bash
# 1. Verificar conecta a BD
node scripts/test/verify-sync.js test@local.com

# 2. Si dice "Usuario no encontrado":
# - Usuario no existe, o
# - EMAIL en BD diferente

# 3. Ver logs de webhook
# Terminal 1 (npm run dev)
# Busca: "[webhook]" o "[syncSubscriptionFromStripe]"

# 4. Sincronizar manualmente
node scripts/test/sync-from-stripe.js test@local.com
```

### Problema: Sincronización falla

```bash
# Verificar estado actual
node scripts/test/verify-sync.js test@local.com

# Output mostrará discrepancias:
# ❌ Desincronizado
# BD Status: active
# Stripe Status: canceled

# Sincronizar
node scripts/test/sync-from-stripe.js test@local.com

# Reverificar
node scripts/test/verify-sync.js test@local.com
```

## 🧪 Test de Cobertura (Verificar Webhooks)

```bash
node scripts/test/verify-webhook-sync.js

# Output esperado:
# ✅ customer.subscription.created - SINCRONIZA desde Stripe
# ✅ customer.subscription.updated - SINCRONIZA desde Stripe
# ✅ customer.subscription.deleted - SINCRONIZA desde Stripe
# ✅ invoice.paid - SINCRONIZA desde Stripe
#
# ✅ VERIFICACIÓN EXITOSA
```

Si alguno falla:
1. Revisar `app/api/stripe/webhook/route.js`
2. Asegurar que ese caso llama `syncSubscriptionFromStripe()`
3. Re-ejecutar test

## 📊 Logs Importantes

### Terminal 1 (npm run dev)
```
[webhook] Webhook recibido: customer.subscription.created
[syncSubscriptionFromStripe] Iniciando sincronización para usuario xxx
[syncSubscriptionFromStripe] ✅ Suscripción sincronizada exitosamente
```

### Terminal 2 (stripe listen)
```
2025-10-28 14:30:45 → checkout.session.completed [200]
2025-10-28 14:30:46 → customer.subscription.created [200]
```

### Terminal 3 (scripts)
```
✅ Usuario encontrado
Subscription ID: sub_xxxxx
Status: active
Renovación: 2025-11-28
```

## 📚 Más Testing

- [Test Clocks Guide](./02-test-clocks.md) - Simular paso de tiempo
- [Debugging Guide](./03-debugging.md) - Resolver problemas
- [Production Debugging](../deployment/03-production-debugging.md) - En prod

---

**Tips**:
- Usa `4242 4242 4242 4242` para tarjeta test exitosa
- Usa `4000 0000 0000 0002` para tarjeta que falla
- Logs son tu amigo - siempre revisa Terminal 1 y 2
- Si algo está raro, sincroniza manualmente y reverifica

