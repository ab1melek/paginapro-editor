# 🎯 Flujo Completo: Suscripción → Cancelación → Acceso Preservado

**Objetivo**: Verificar que el cliente puede:
1. Suscribirse ✅
2. Usar su página ✅
3. Cancelar fácilmente ✅
4. Seguir usando su página 30 días más ✅
5. Ser bloqueado después de los 30 días ✅
6. **NO recibir cobros automáticos después de cancelar** ✅

---

## 📋 Checklist Previa

- [ ] Servidor dev corriendo: `npm run dev`
- [ ] Stripe CLI escuchando: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` en `.env.local` (copiado de `stripe listen`)
- [ ] `STRIPE_SECRET_KEY` en `.env.local`

---

## 🔄 Flujo Paso a Paso

### **FASE 1: Setup**

1. **Terminal 1 - Servidor dev**
   ```bash
   npm run dev
   ```
   Espera a ver: `Local: http://localhost:3000`

2. **Terminal 2 - Stripe CLI (escuchar webhooks)**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   Copia el `whsec_...` y guárdalo en `STRIPE_WEBHOOK_SECRET`

3. **Terminal 3 - Logs de API (opcional, para debugging)**
   ```bash
   stripe logs tail
   ```

---

### **FASE 2: Crear Usuario y Suscripción de Prueba**

**Opción A: Script Automatizado (recomendado)**
```bash
node scripts/testFullCancelationFlow.js
```
✅ Crea usuario, suscripción, cancela, verifica acceso, simula expiración.

**Opción B: Manual (con Stripe CLI)**

1. Crear usuario en BD:
   ```bash
   psql $DATABASE_URL -c "
   INSERT INTO neon_auth.users (id, username, email, password_hash, subscription_status)
   VALUES ('test-sub-123', 'testuser', 'test@mail.com', 'hash', 'none');
   "
   ```

2. Simular suscripción activa (30 días):
   ```bash
   psql $DATABASE_URL -c "
   UPDATE neon_auth.users 
   SET stripe_subscription_id = 'sub_test_123',
       subscription_status = 'active',
       subscription_expires_at = NOW() + INTERVAL '30 days'
   WHERE id = 'test-sub-123';
   "
   ```

3. Verificar en BD:
   ```bash
   psql $DATABASE_URL -c "
   SELECT id, username, subscription_status, subscription_expires_at 
   FROM neon_auth.users WHERE id = 'test-sub-123';
   "
   ```
   Espera:
   ```
   id          | username  | subscription_status | subscription_expires_at
   test-sub-123| testuser  | active              | 2025-11-27 ... (en 30 días)
   ```

---

### **FASE 3: Crear Página de Prueba**

1. Abrir navegador: `http://localhost:3000/login`
2. Login con usuario de prueba
3. Crear página con slug: `test-page`
4. Publicar
5. Verificar que es accesible: `http://localhost:3000/test-page`
   - Debería ver ✅ "Página accesible"

---

### **FASE 4: Cancelar Suscripción**

**En Stripe Dashboard (interfaz web)**
1. Ve a: https://dashboard.stripe.com/subscriptions
2. Busca la suscripción (o usa la que creaste en BD: `sub_test_123`)
3. Click "Cancel subscription" → "Cancel subscription now"
4. Observa en `stripe listen` el evento: `customer.subscription.deleted` ✅

**O via Stripe CLI (simular)**
```bash
stripe subscriptions cancel sub_test_123
```

---

### **FASE 5: Verificar BD Después de Cancelar**

```bash
psql $DATABASE_URL -c "
SELECT id, username, subscription_status, subscription_expires_at 
FROM neon_auth.users WHERE id = 'test-sub-123';
"
```

Espera:
```
id          | username  | subscription_status | subscription_expires_at
test-sub-123| testuser  | canceled            | 2025-11-27 ... (aún en 30 días, NO cambió)
```

**Verificaciones críticas:**
- ✅ `subscription_status = 'canceled'` (no 'expired')
- ✅ `subscription_expires_at` sin cambios (sigue siendo +30 días)
- ✅ **No hay segundo cambio de BD** (webhook no sobrescribió)

---

### **FASE 6: Verificar Acceso a Página (PERMITIDO)**

1. Abrir: `http://localhost:3000/test-page`
2. Espera: ✅ Página accesible (aún dentro del período pagado)
3. En Terminal 2 (`stripe listen`), deberías haber visto:
   ```
   --> customer.subscription.deleted [evt_1SM...]
   <-- [200] POST http://localhost:3000/api/stripe/webhook
   ```

---

### **FASE 7: Simular Expiración (+31 días)**

Cambiar la fecha de expiración a "hace 1 hora":
```bash
psql $DATABASE_URL -c "
UPDATE neon_auth.users 
SET subscription_expires_at = NOW() - INTERVAL '1 hour'
WHERE id = 'test-sub-123';
"
```

---

### **FASE 8: Verificar Acceso Bloqueado**

1. Abrir: `http://localhost:3000/test-page`
2. Espera: 🔒 "Suscripción cancelada" (acceso bloqueado)
3. Verificar BD:
   ```bash
   psql $DATABASE_URL -c "
   SELECT subscription_status, subscription_expires_at 
   FROM neon_auth.users WHERE id = 'test-sub-123';
   "
   ```
   - Status sigue siendo `'canceled'` (correcto)
   - Fecha está en el pasado (expirado)

---

### **FASE 9: Verificar NO hay Cobro Automático**

1. En Stripe Dashboard, ir a: https://dashboard.stripe.com/invoices
2. Buscar invoices de la suscripción `sub_test_123`
3. Espera: ❌ **No debe haber ningún invoice nuevo después de la cancelación**
4. En Terminal 3 (`stripe logs tail`), buscar:
   - ✅ `customer.subscription.deleted` (debe aparecer 1 vez)
   - ❌ `invoice.paid` (NO debe aparecer después de cancelar)
   - ❌ `invoice.payment_attempt` (NO debe aparecer)

---

## ✅ Criterios de Éxito

| Criterio | Esperado | ¿Cumplido? |
|----------|----------|-----------|
| Usuario se suscribe | status='active', fecha futura | ✅ |
| Usuario cancela | status='canceled', fecha conservada | ✅ |
| Usuario accede dentro del período | Página visible | ✅ |
| Usuario accede después del período | Página bloqueada | ✅ |
| Sin cobro automático | invoice.paid NO aparece | ✅ |
| Webhook llega una sola vez | customer.subscription.deleted 1x | ✅ |

---

## 🚨 Debugging

### Error: "Suscripción cancelada" inmediatamente después de cancelar
- **Causa**: webhook cambió status a 'expired'
- **Solución**: Verificar en terminal del servidor si `userStatus.subscription_status === 'canceled'` antes de cambiar

### Error: Acceso bloqueado cuando debería estar permitido
- **Causa**: subscription_expires_at fue sobrescrita
- **Solución**: Revisar `cancelSubscriptionForUser()` — solo debe cambiar status, NO la fecha

### Error: Cobro automático después de cancelar
- **Causa**: Usar `cancel_at_period_end=true` en lugar de `.cancel()`
- **Solución**: Asegurar que endpoint usa `stripe.subscriptions.cancel(id)` (sin parámetros)

---

## 📊 Comandos Útiles

```bash
# Ver todas las suscripciones
stripe subscriptions list

# Ver una suscripción completa (expande invoice)
stripe subscriptions retrieve sub_test_123 --expand latest_invoice

# Ver invoices
stripe invoices list

# Ver un invoice específico
stripe invoices retrieve in_123

# Listar eventos
stripe events list --type customer.subscription.deleted

# Ver evento específico
stripe events retrieve evt_1SM...

# Convertir timestamp unix a fecha
date -r 1700000000
# o en Node
node -e "console.log(new Date(1700000000*1000).toISOString())"
```

---

## 📝 Resumen del Flujo

```
1. Usuario se suscribe
   → status='active', subscription_expires_at = NOW()+30d

2. Usuario cancela (click en dashboard)
   → POST /api/stripe/cancel-subscription
   → stripe.subscriptions.cancel(id) en Stripe
   → BD: status='canceled' (fecha NO cambia)
   → Webhook: customer.subscription.deleted

3. Usuario intenta acceder a página
   → /app/[slug]/page.js verifica
   → if (status='canceled' AND expires_at > now) → PERMITIR
   → Página visible ✅

4. Pasan 31 días
   → expires_at <= now
   → if (status='canceled' AND expires_at <= now) → BLOQUEAR
   → Página bloqueada 🔒

5. Stripe NO cobra
   → Suscripción está 'canceled' en Stripe
   → NO hay invoice.paid
   → NO hay invoice.payment_attempt
   → Usuario seguro ✅
```

---

## 🎯 Conclusión

Si todos los ✅ están marcados, tu flujo de cancelación es **100% seguro**:
- ✅ Cliente puede cancelar fácilmente
- ✅ Mantiene acceso hasta el último día pagado
- ✅ Acceso se revoca automáticamente
- ✅ **Sin cobro automático jamás**
