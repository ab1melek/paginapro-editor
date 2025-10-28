# 🚀 Quick Start: Testing Cancelación

## Opción 1: Testing Manual (Recomendado primero)

### Paso 1: Iniciar el servidor

```bash
cd /Users/abimelekcastrezana/Documents/workspaces/editor-js
npm run dev
```

Debe mostrar:
```
▲ Next.js 14.x
- Local:        http://localhost:3000
```

### Paso 2: Abrir en el navegador

```
http://localhost:3000/signup
```

### Paso 3: Registrarse

```
Username: testcancel
Email: testcancel@example.com
Password: Test123!
```

### Paso 4: Crear suscripción simulada (opción A - Más fácil)

#### 4A: Usar BD directamente

```bash
# En otra terminal:
psql $DATABASE_URL << SQL
UPDATE neon_auth.users 
SET 
  stripe_customer_id = 'cus_test_manual',
  stripe_subscription_id = 'sub_test_manual_' || DATE_TRUNC('second', NOW())::text,
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE username = 'testcancel'
RETURNING stripe_subscription_id, subscription_expires_at;
SQL
```

Resultado esperado:
```
            stripe_subscription_id             |  subscription_expires_at
─────────────────────────────────────────────┼─────────────────────────
 sub_test_manual_2025-10-27 14:30:45.123456 | 2025-11-26 14:30:45.123456
(1 row)
```

### Paso 5: Ir al Dashboard

```
http://localhost:3000/dashboard
```

Debes ver:
- Badge VERDE: "✅ Suscripción activa - Renueva en 30 días"
- Botón ROJO: "Cancelar"

### Paso 6: Hacer clic en "Cancelar"

```
1. Clic en botón rojo "Cancelar"
2. Se abre modal con advertencia
3. Lee el contenido
4. Clic en "Sí, cancelar"
```

### Paso 7: Escribir confirmación

```
1. Aparece campo de input
2. Escribe: "sí, quiero cancelar mi suscripción"
3. Botón "Cancelar suscripción" se habilita (rojo)
4. Clic en botón
```

### Paso 8: Verificar resultado

```
1. Alert: "Suscripción cancelada exitosamente"
2. Clic OK
3. Badge cambia a ROJO: "⚠️ Suscripción expirada"
4. Botón "Cancelar" desaparece
```

### Paso 9: Verificar en BD

```bash
psql $DATABASE_URL << SQL
SELECT 
  username,
  subscription_status,
  subscription_expires_at
FROM neon_auth.users 
WHERE username = 'testcancel';
SQL
```

Resultado esperado:
```
  username   | subscription_status |  subscription_expires_at
────────────┼─────────────────────┼──────────────────────────
 testcancel | canceled            | 2025-10-27 14:45:22.123456
(1 row)
```

---

## Opción 2: Testing Automatizado

### Paso 1: Asegurar que el servidor está corriendo

```bash
# Terminal 1
npm run dev
```

### Paso 2: Ejecutar el script de testing

```bash
# Terminal 2
cd /Users/abimelekcastrezana/Documents/workspaces/editor-js
node scripts/testCancelSubscription.js
```

Debería mostrar:
```
╔═══════════════════════════════════════════════════════════╗
║     🧪 Testing: Cancelación de Suscripciones             ║
╚═══════════════════════════════════════════════════════════╝

📝 TEST 1: Crear Usuario
─────────────────────────
✅ Usuario creado: test_cancel_1729954645123

📝 TEST 2: Login
────────────────
✅ Login exitoso

📝 TEST 3: Obtener Datos del Usuario
...

✅ TODOS LOS TESTS PASARON
```

### Paso 3: Opciones del script

```bash
# Con usuario personalizado
node scripts/testCancelSubscription.js --user miusuario --email mi@email.com

# Con output detallado
node scripts/testCancelSubscription.js --verbose

# Saltar verificación Stripe (solo BD)
node scripts/testCancelSubscription.js --skip-stripe
```

---

## Opción 3: Testing con Stripe CLI (Recomendado para PROD)

### Paso 1: Instalar Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# O descargar desde: https://stripe.com/docs/stripe-cli
```

### Paso 2: Login en Stripe

```bash
stripe login

# Abre navegador, autoriza, y copia el API key
```

### Paso 3: Escuchar webhooks

```bash
# Terminal 1: Escuchar webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copia el `signing secret` (te lo muestra):
```
Events will be sent to http://localhost:3000/api/stripe/webhook
Your webhook signing secret is: whsec_xxxxxxxxxxxx (copy)
```

### Paso 4: Configurar en .env.local

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
```

### Paso 5: Simular suscripción

```bash
# Terminal 2: Disparar evento de suscripción creada
stripe trigger customer.subscription.created

# Verifica en Terminal 1 que se recibió el webhook
```

### Paso 6: Simular cancelación desde Stripe

```bash
stripe trigger customer.subscription.deleted
```

Verifica en Terminal 1:
```
[13:45:22] subscription.deleted → 200 (success)
```

---

## Flujo Recomendado para Testing Completo

### Para DEV (Más rápido)

```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: BD - Simular suscripción
psql $DATABASE_URL << SQL
UPDATE neon_auth.users 
SET 
  stripe_subscription_id = 'sub_test_' || RANDOM()::text,
  subscription_status = 'active',
  subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE username = 'testcancel';
SQL

# Terminal 3: Navegador
# http://localhost:3000/dashboard
# 1. Login
# 2. Clic "Cancelar"
# 3. Completar modal
# 4. Verificar cambios en BD
```

### Para STAGING/PROD (Más seguro)

```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Terminal 3: Script de testing
node scripts/testCancelSubscription.js --verbose

# Verifica resultados en Terminal 1, 2 y 3
```

---

## Verificación Final

### Checklist Post-Testing

```bash
# 1. Verificar estado en BD
psql $DATABASE_URL << SQL
SELECT subscription_status FROM neon_auth.users 
WHERE username = 'testcancel';
SQL
# Resultado: canceled

# 2. Verificar en Stripe Dashboard
# https://dashboard.stripe.com/subscriptions
# Buscar sub_test_xxxx
# Verificar: Status = "Canceled"

# 3. Verificar logs
tail -f npm-debug.log | grep "cancel-subscription"

# 4. Verificar acceso bloqueado
curl http://localhost:3000/testpage
# Debe contener: "🔒 Suscripción cancelada"
```

---

## Si algo falla

### Error: "No autorizado" en cancelación

```
Causa: Token no válido o expirado
Solución:
1. Logout y login de nuevo
2. Verificar cookie en F12 → Storage → Cookies
3. Verificar COOKIE_NAME en lib/auth.js
```

### Error: "subscription_id requerido"

```
Causa: No pasaste subscriptionId en el request
Solución:
1. Verificar que subscriptionId es string
2. Verificar que no es null/undefined
3. Ejecutar verificación de BD primero
```

### Error: "Error de Stripe"

```
Causa: STRIPE_SECRET_KEY no es válido
Solución:
1. Verificar en .env.local: STRIPE_SECRET_KEY=sk_test_...
2. Verificar en Stripe Dashboard: Settings → API Keys
3. Copiar el "Secret key" correcto
```

### Error: "La página no está disponible"

```
Causa: Acceso bloqueado correctamente ✅
Esto es NORMAL después de cancelar

Para verificar que funciona:
1. Abre F12 → Network
2. Busca GET /slug
3. Verifica que devuelve 200 pero con HTML bloqueado
```

---

## Resumen Rápido

| Tarea | Comando | Resultado |
|-------|---------|-----------|
| Iniciar servidor | `npm run dev` | ✅ Corre en 3000 |
| Registrarse | Browser → /signup | ✅ Usuario creado |
| Simular suscripción | `psql` UPDATE | ✅ Status = active |
| Cancelar | Dashboard → Botón | ✅ Modal abre |
| Escribir confirmación | Modal → Input | ✅ Botón habilita |
| Ejecutar cancelación | Modal → Clic | ✅ Status = canceled |
| Verificar BD | `psql` SELECT | ✅ canceled |
| Verificar página bloqueada | Browser /slug | ✅ Bloqueado |

---

✅ **CUANDO TODOS LOS PASOS FUNCIONEN, ESTÁ LISTO PARA PRODUCCIÓN**
