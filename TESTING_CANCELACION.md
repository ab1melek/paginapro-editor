# 🧪 Testing: Cancelación de Suscripciones

## Escenario 1: Cancelar una Suscripción Activa

### Objetivo
Verificar que un usuario con suscripción activa puede cancelarla correctamente.

### Prerequisitos
- Usuario registrado ✅
- Suscripción activa en Stripe ✅
- Dashboard accesible ✅

### Pasos para Crear Suscripción de Prueba

#### Opción A: Usar Stripe CLI (Recomendado para DEV)

```bash
# Terminal 1: Escuchar webhooks
cd /Users/abimelekcastrezana/Documents/workspaces/editor-js
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Copiar signing secret (te lo muestra)
# Usarlo como STRIPE_WEBHOOK_SECRET en .env.local

# Terminal 2: Hacer trigger manual de eventos
stripe trigger customer.subscription.created

# O simular todo el flujo de checkout
stripe trigger checkout.session.completed \
  --override metadata.userId=<user-id-aqui>
```

#### Opción B: Usar Stripe Dashboard

1. Ir a https://dashboard.stripe.com/
2. Subscriptions → Create subscription
3. Buscar o crear customer con email del usuario
4. Seleccionar price (monthly o yearly)
5. Crear suscripción

#### Opción C: Simular Webhook Manual (Más rápido)

```bash
# Archivo: /tmp/test-webhook.js
import fetch from 'node-fetch';

const event = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_123",
      customer: "cus_test_123",
      metadata: {
        userId: "<usuario-id>" // Reemplazar con ID real
      }
    }
  }
};

const sig = "t=timestamp,v1=signature"; // Simplificado para test

fetch('http://localhost:3000/api/stripe/webhook', {
  method: 'POST',
  headers: {
    'stripe-signature': sig,
    'content-type': 'application/json'
  },
  body: JSON.stringify(event)
}).then(r => r.json()).then(console.log);
```

---

### Test: Flujo de Cancelación

#### 1. Verificar Estado Inicial en BD

```bash
# Terminal
psql $DATABASE_URL << SQL
SELECT 
  id,
  username,
  email,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_expires_at
FROM neon_auth.users 
WHERE username = 'testuser'
LIMIT 1;
SQL

# Resultado esperado:
# subscription_status = 'active'
# subscription_expires_at = fecha futura
# stripe_subscription_id = sub_xxxxxx
```

#### 2. Verificar en Dashboard

```
1. Abre http://localhost:3000/dashboard
2. Inicia sesión con testuser
3. Busca el badge de suscripción
4. Verificar que sea VERDE con botón ROJO "Cancelar"

Aspecto esperado:
┌─────────────────────────────────┐
│ ✅ Suscripción activa - Renueva │
│ en 25 días                      │
│              [Cancelar]         │
└─────────────────────────────────┘
```

#### 3. Hacer Clic en "Cancelar"

```
1. Haz clic en botón rojo "Cancelar"
2. Se abre modal con título: "⚠️ Cancelar suscripción"
3. Verifica contenido:
   - "Si cancelas tu suscripción:"
   - "Deja de funcionar tu página/s después..."
   - "NO habrá cobros automáticos futuros"
   - Botones: [Volver] [Sí, cancelar]
```

#### 4. Confirmación Paso 1

```
1. Haz clic en "Sí, cancelar"
2. Modal cambia a Paso 2
3. Muestra texto requerido:
   "sí, quiero cancelar mi suscripción"
4. Campo de input vacío con placeholder "Escribe aquí..."
5. Botón deshabilitado (gris)
```

#### 5. Escribir Confirmación

```
1. Escribe en el campo: "sí, quiero cancelar mi suscripción"
2. Verifica que botón "Cancelar suscripción" se habilita (rojo)
3. Si escribes incorrectamente (ej: "si quiero cancelar")
   - Botón permanece deshabilitado
   - Error: "El texto no coincide..."
```

#### 6. Ejecutar Cancelación

```
1. Haz clic en "Cancelar suscripción" (habilitado)
2. Modal muestra Paso 3: "Procesando cancelación..."
3. Spinner girando
4. En consola del navegador verifica:
   - POST /api/stripe/cancel-subscription 200 OK
```

#### 7. Verificar Éxito

```
1. Alert: "Tu suscripción ha sido cancelada exitosamente."
2. Click OK
3. Modal cierra
4. Dashboard recarga datos del usuario
5. Badge cambia a ROJO: "⚠️ Suscripción expirada"
   (Sin botón "Cancelar")
```

#### 8. Verificar en BD (Inmediato)

```bash
psql $DATABASE_URL << SQL
SELECT 
  subscription_status,
  subscription_expires_at
FROM neon_auth.users 
WHERE username = 'testuser'
LIMIT 1;
SQL

# Resultado esperado:
# subscription_status = 'canceled'
# subscription_expires_at = <fecha reciente>
```

#### 9. Verificar en Stripe Dashboard

```
1. Ve a https://dashboard.stripe.com/subscriptions
2. Busca por customer email
3. Verifica:
   - Status: "Canceled"
   - canceled_at: Tiene fecha de ahora
   - No hay "Upcoming Invoice" (vacío)
   - No hay facturas pendientes
```

#### 10. Revisar Logs en Backend

```bash
# Ver logs de cancelación
tail -f /Users/abimelekcastrezana/Documents/workspaces/editor-js/.logs

# O en consola si tienes npm run dev corriendo
# Busca:
# [cancel-subscription] Usuario XYZ solicita cancelar sub_ABC
# [cancel-subscription] Suscripción cancelada en Stripe: status=canceled
# [cancel-subscription] Usuario XYZ tiene suscripción marcada como 'canceled'
```

---

## Escenario 2: Verificar NO hay Cobro Automático

### Objetivo
Garantizar que después de cancelar, **NUNCA** habrá cobro automático.

### Prerequisitos
- Escenario 1 completado ✅
- Usuario con suscripción cancelada ✅
- Acceso a Stripe Dashboard ✅

### Pasos de Verificación

#### 1. Esperar el Webhook

```
1. Backend debe recibir webhook: customer.subscription.deleted
2. En logs verifica:
   ❌ Suscripción cancelada: sub_ABC para usuario XYZ
   ✅ Usuario XYZ marcado con subscription_status='expired'

3. Si no ves el webhook:
   - Verifica STRIPE_WEBHOOK_SECRET está correcto
   - Verifica en Stripe Dashboard → Webhooks que esté configurado
   - Prueba con: stripe trigger customer.subscription.deleted
```

#### 2. Verificar en BD después del Webhook

```bash
# Esperar 5 segundos, luego:
psql $DATABASE_URL << SQL
SELECT subscription_status FROM neon_auth.users 
WHERE username = 'testuser';
SQL

# Resultado esperado:
# subscription_status = 'expired' (actualizado por webhook)
```

#### 3. Verificar NO hay Invoice Pendiente en Stripe

```
1. Ve a https://dashboard.stripe.com/invoices
2. Busca por email del usuario
3. Verifica:
   - Último invoice: "Pagado" (el que pagó antes de cancelar)
   - NO hay invoice en estado "Draft"
   - NO hay invoice en estado "Open"
   - NO hay "próximo invoice" listado
```

#### 4. Simular Renovación (¿qué pasaría sin cancelación?)

```javascript
// Para ver la diferencia, abre otra suscripción (NO cancelada)
// En Stripe, puedes ver:
// - Subscription sin status 'canceled'
// - Tiene "Upcoming invoice" con fecha de renovación
// - Stripe renovará automáticamente

// Pero la que CANCELAMOS:
// - Status = 'Canceled'
// - Sin "Upcoming invoice"
// - Stripe NUNCA renovará
```

#### 5. Esperar Período de Renovación (Opcional)

Si quieres ser 100% seguro (solo en DEV):

```bash
# Opción A: Simular fecha de renovación
# En test, modifica subscription_expires_at a hace 1 segundo
UPDATE neon_auth.users 
SET subscription_expires_at = NOW() - INTERVAL '1 second'
WHERE username = 'testuser';

# Opción B: Usar reloj de Stripe
# En Dashboard, puedes ver "Test Clock" para acelerar tiempo
# https://dashboard.stripe.com/test/clocks
```

#### 6. Revisar Logs de Stripe

```
1. Ve a https://dashboard.stripe.com/logs
2. Busca eventos para la suscripción:
   - customer.subscription.created
   - customer.subscription.deleted
   - invoice.payment_succeeded (solo el pago inicial)
   - NO debe haber invoice.payment_attempt después de deleted
```

#### 7. Verificar Acceso a Página Bloqueado

```
1. Crea una página con el usuario antes de cancelar
   (o usa una existente)

2. Verifica que funciona:
   http://localhost:3000/slug-de-pagina
   → Muestra la página correctamente

3. Luego cancela suscripción (pasos anteriores)

4. Intenta acceder nuevamente:
   http://localhost:3000/slug-de-pagina
   → Muestra: "🔒 Suscripción cancelada"
   → NO renderiza la página

5. En Network tab (F12 → Network):
   - GET /[slug] → 200 OK
   - Pero el JSX devuelto es el bloqueo
```

#### 8. Verificar BD NO reactiva suscripción

```bash
# Intenta de todos los modos, no debería reactivarse:
psql $DATABASE_URL << SQL
-- Intentar reactivar (esto NUNCA debe pasar en código)
UPDATE neon_auth.users 
SET subscription_status = 'active'
WHERE username = 'testuser' AND subscription_status = 'canceled';

-- Verificar que nadie lo cambió:
SELECT subscription_status FROM neon_auth.users 
WHERE username = 'testuser';
-- Resultado: canceled (sin cambios)
SQL
```

---

## Escenario 3: Flujo Completo End-to-End

### Test Integrado (Todos los pasos juntos)

```bash
#!/bin/bash

echo "🧪 TESTING COMPLETO: CANCELACIÓN DE SUSCRIPCIÓN"
echo "================================================"

# 1. Crear usuario
echo "\n[1/10] Creando usuario de prueba..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_cancel_'$(date +%s)'",
    "email": "testcancel_'$(date +%s)'@example.com",
    "password": "Test123!SecurePass"
  }')
echo "✅ Usuario creado"

# 2. Login
echo "\n[2/10] Login del usuario..."
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "'$(echo $USER_RESPONSE | grep -o '"username":"[^"]*' | cut -d'"' -f4)'",
    "password": "Test123!SecurePass"
  }')
TOKEN=$(echo $LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "✅ Login exitoso, token: ${TOKEN:0:20}..."

# 3. Simular creación de suscripción
echo "\n[3/10] Simulando webhook de suscripción..."
# (Aquí iría el webhook trigger)
echo "✅ Suscripción simulada"

# 4. Verificar estado inicial
echo "\n[4/10] Verificando estado inicial en BD..."
psql $DATABASE_URL << SQL
SELECT subscription_status FROM neon_auth.users 
WHERE subscription_status = 'active' LIMIT 1;
SQL
echo "✅ Estado verificado"

# 5. Cancelar suscripción
echo "\n[5/10] Cancelando suscripción..."
CANCEL=$(curl -s -X POST http://localhost:3000/api/stripe/cancel-subscription \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=$TOKEN" \
  -d '{
    "subscriptionId": "sub_test_123",
    "confirmed": true
  }')
echo "Respuesta: $CANCEL"
echo "✅ Cancelación enviada"

# 6. Verificar estado cancelado en BD
echo "\n[6/10] Verificando estado cancelado en BD..."
psql $DATABASE_URL << SQL
SELECT subscription_status FROM neon_auth.users 
WHERE subscription_status = 'canceled' LIMIT 1;
SQL
echo "✅ Estado actualizado a 'canceled'"

# 7. Verificar acceso bloqueado a página
echo "\n[7/10] Verificando acceso bloqueado..."
curl -s http://localhost:3000/test-page | grep -q "Suscripción cancelada"
echo "✅ Página bloqueada correctamente"

# 8. Esperar webhook
echo "\n[8/10] Esperando webhook de Stripe..."
sleep 5
echo "✅ Webhook procesado"

# 9. Verificar estado final en BD
echo "\n[9/10] Verificando estado final en BD..."
psql $DATABASE_URL << SQL
SELECT subscription_status FROM neon_auth.users 
WHERE subscription_status IN ('canceled', 'expired') LIMIT 1;
SQL
echo "✅ Estado sincronizado"

# 10. Verificar en Stripe
echo "\n[10/10] Verificando en Stripe Dashboard..."
echo "⚠️  MANUAL: Ve a https://dashboard.stripe.com/subscriptions"
echo "    Busca: sub_test_123"
echo "    Verifica: Status = 'Canceled'"

echo "\n✅ TEST COMPLETO EXITOSO"
echo "   - Suscripción cancelada ✅"
echo "   - BD sincronizada ✅"
echo "   - Acceso bloqueado ✅"
echo "   - SIN cobros automáticos ✅"
```

---

## Puntos Críticos a Verificar

### ✅ Checklist de Verificación

```
CANCELACIÓN EXITOSA:
[ ] Modal abre correctamente
[ ] 3 pasos funcionan en orden
[ ] Usuario debe escribir texto exacto
[ ] Botón se habilita/deshabilita correctamente
[ ] POST devuelve 200 OK
[ ] Alert muestra mensaje de éxito

BD ACTUALIZADA:
[ ] subscription_status = 'canceled' (inmediato)
[ ] subscription_status = 'expired' (después de webhook)
[ ] subscription_expires_at actualizada
[ ] Cambios persistidos en DB

STRIPE SINCRONIZADO:
[ ] Status en Stripe = 'canceled'
[ ] canceled_at tiene fecha
[ ] Sin "Upcoming invoice"
[ ] Sin facturas pendientes
[ ] Sin reintentos de pago programados

ACCESO BLOQUEADO:
[ ] Página no se renderiza
[ ] Muestra "🔒 Suscripción cancelada"
[ ] Usuario no puede ver contenido
[ ] Error 403 o bloqueo en servidor

SIN COBROS AUTOMÁTICOS:
[ ] Sin invoice.paid después de cancelar
[ ] Sin invoice.payment_attempt después de cancelar
[ ] Sin retry automático de Stripe
[ ] Sin renovación registrada en logs
```

---

## Solución de Problemas

### Problema: Modal no se abre
```
1. Verificar que subscription_status = 'active'
2. Verificar que botón "Cancelar" está visible
3. Verificar que CancelSubscriptionModal está importado
4. Ver console browser (F12 → Console) por errores
```

### Problema: POST devuelve error
```
1. Verificar autenticación: ¿hay token válido?
2. Verificar datos: ¿subscriptionId es correcto?
3. Verificar confirmed=true está en body
4. Ver logs backend: npm run dev → busca [cancel-subscription]
```

### Problema: BD no actualiza
```
1. Verificar DATABASE_URL está correcto
2. Ejecutar: psql $DATABASE_URL -c "SELECT 1"
3. Verificar tabla neon_auth.users existe
4. Revisar logs por errores de SQL
```

### Problema: Stripe no muestra cancelada
```
1. Verificar STRIPE_SECRET_KEY es correcto
2. Verificar subscriptionId existe en Stripe
3. Ir a https://dashboard.stripe.com/subscriptions
4. Buscar por ID y verificar status
```

### Problema: Página no se bloquea
```
1. Verificar que subscription_status = 'canceled' en BD
2. Ir a /[slug] y verificar fetch retorna datos
3. Ver consola del servidor por errores
4. Revisar código en app/[slug]/page.js
```

---

## Resumen del Testing

| Aspecto | Test | Resultado |
|---------|------|-----------|
| Modal abre | Haz clic "Cancelar" | ✅ Abre paso 1 |
| Confirmación | Escribe texto | ✅ Botón habilita |
| POST exitoso | Revisa status | ✅ 200 OK |
| BD actualizada | SELECT status | ✅ 'canceled' |
| Stripe actualizado | Dashboard | ✅ 'Canceled' |
| Acceso bloqueado | GET /[slug] | ✅ Bloqueado |
| Sin cobros | Espera 7 días | ✅ Sin invoice |

---

✅ **CUANDO TODO FUNCIONE CORRECTAMENTE, PUEDES DESPLEGAR A PRODUCCIÓN**
