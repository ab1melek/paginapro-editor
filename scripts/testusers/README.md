# Scripts de Prueba - Suscripciones Stripe

Conjunto de scripts para probar el flujo completo de suscripciones.

## 🚀 Inicio Rápido

### 1. Crear usuario de prueba

```bash
node scripts/testusers/createTestUser.js
```

Crea un usuario:
- **Email:** test1@mail.com
- **Contraseña:** test123
- **Username:** test1

### 2. Verificar estado del usuario

```bash
node scripts/testusers/checkUserStatus.js
# O con email específico:
node scripts/testusers/checkUserStatus.js test1@mail.com
```

Muestra:
- Estado actual de suscripción
- Días restantes si está en trial
- Si la página sería visible o bloqueada

### 3. Probar flujo completo

```bash
node scripts/testusers/testSubscriptionFlow.js
```

Simula:
1. ✅ Usuario sin suscripción
2. ✅ Crea página → inicia trial (10 días)
3. ✅ Página VISIBLE durante trial
4. ✅ Trial expira → página BLOQUEADA
5. ✅ Usuario paga → suscripción ACTIVA
6. ✅ Página VISIBLE nuevamente

### 4. Resetear usuario

```bash
node scripts/testusers/resetTestUser.js
# O con email específico:
node scripts/testusers/resetTestUser.js test1@mail.com
```

Vuelve el usuario a estado inicial (sin suscripción).

---

## 🧪 Flujo Manual de Prueba Completo

Si prefieres probar manualmente desde la UI:

### Paso 1: Crear cuenta y logger

1. Ve a http://localhost:3000/signup
2. Ingresa:
   - Email: test1@mail.com
   - Contraseña: test123
   - Username: test1
3. Haz click en "Registrarse"

### Paso 2: Acceder al dashboard

1. Ve a http://localhost:3000/login
2. Ingresa credenciales
3. Haz click en "Iniciar sesión"

### Paso 3: Crear primera página

1. En dashboard, haz click en "+ Crear desde plantilla"
2. Elige cualquier plantilla
3. Crea la página

**Resultado esperado:**
- En dashboard debe aparecer badge: "🎁 Prueba gratuita - 10 días restantes"
- La página debería estar VISIBLE públicamente

### Paso 4: Probar suscripción

1. En dashboard, haz click en "Actualizar suscripción"
2. Se abre modal con 2 planes
3. Elige "Mensual" ($199) o "Anual" ($1,788)
4. Se redirige a Stripe Checkout hosted

**En Stripe Checkout:**
1. Ingresa datos de prueba:
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura (ej: 12/25)
   - CVC: 123
   - Nombre: cualquiera
2. Haz click en "Pagar"

**Resultado esperado:**
- Webhook actualiza la BD automáticamente
- En dashboard aparece: "✅ Suscripción activa"
- Página sigue VISIBLE

### Paso 5: Verificar bloqueo (opcional)

Para simular expiración sin esperar 10 días:

```bash
# En otra terminal, ejecuta:
node scripts/testusers/resetTestUser.js
```

Luego:
1. Refresca dashboard → badge cambia a "⚠️ Suscripción expirada"
2. Intenta acceder a la página pública → verás página bloqueada

---

## 📝 Variables de Entorno Necesarias

Asegúrate de que `.env.local` tiene:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...
API_BASE_URL=http://localhost:3000
```

---

## 🔧 Solución de Problemas

### El usuario no se crea

```bash
npm run db:migrate
# Luego:
node scripts/testusers/createTestUser.js
```

### El webhook no funciona

Asegúrate de que Stripe CLI está escuchando:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### La suscripción no se activa

1. Verifica que los `STRIPE_PRICE_ID_*` están en `.env.local`
2. Revisa la consola para errores de webhook
3. Revisa el [Dashboard de Stripe](https://dashboard.stripe.com/webhooks) para eventos fallidos

---

## 📊 Estados de Base de Datos

```
subscription_status:
  - 'none'     → Sin suscripción
  - 'trial'    → En período de prueba (10 días)
  - 'active'   → Suscripción pagada
  - 'expired'  → Expirada (sin renovación)
```

---

## 🎯 Checklist de Prueba Completa

- [ ] Usuario de prueba creado
- [ ] Dashboard muestra badge de trial
- [ ] Modal de planes abre correctamente
- [ ] Redirige a Stripe Checkout
- [ ] Pago exitoso en Stripe
- [ ] Webhook actualiza BD
- [ ] Dashboard muestra "Suscripción activa"
- [ ] Página pública es visible
- [ ] Reset funciona
- [ ] Página se bloquea cuando expira
