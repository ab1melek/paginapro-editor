# 🖥️ Setup Visual - 3 Terminales

## La Mejor Forma de Hacer el Test

### Abre 3 Terminales Lado a Lado:

```
┌─────────────────────────┬──────────────────────┬──────────────────────┐
│   TERMINAL 1            │   TERMINAL 2         │   TERMINAL 3         │
│   Dev Server            │   Stripe CLI         │   Test Manual        │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│                         │                      │                      │
│ npm run dev             │ stripe listen \      │ node scripts/        │
│                         │   --forward-to \     │ testusers/           │
│ Ver logs del webhook    │   localhost:3000/... │ testManualRenewal.js │
│                         │                      │ test5@mail.com       │
│ ↓ Verás aquí:          │ ↓ Verás aquí:        │ ↓ Sigue aquí:        │
│                         │                      │                      │
│ 🔔 Webhook recibido:   │ ▶ invoice.created   │ 📍 PASO 1: ...        │
│ invoice.paid           │ ▶ invoice.paid      │ ¿Continuar? (s/n): s │
│                         │                      │                      │
│ 💰 Invoice pagado      │                      │ 📍 PASO 2: ...        │
│ 🔄 Renovación auto...  │                      │ ¿Continuar? (s/n): s │
│                         │                      │                      │
└─────────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 📋 Pasos Exactos

### **1️⃣ Abre Terminal 1 - Dev Server**

```bash
npm run dev
```

**Espera a ver:**
```
ready - started server on 0.0.0.0:3000
```

---

### **2️⃣ Abre Terminal 2 - Stripe CLI**

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Deberías ver:**
```
▶ Ready! Your webhook signing secret is: whsec_xxxxxxxxxxxxx
```

**IMPORTANTE:** Copia ese `whsec_xxxxxxxxxxxxx` y pega en tu `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Luego presiona **Ctrl+C** en Terminal 2 y ejecuta de nuevo.

---

### **3️⃣ Abre Terminal 3 - Test Manual**

```bash
node scripts/testusers/testManualRenewal.js test5@mail.com
```

**Seguirá los 8 pasos interactivamente**

---

## 🎬 Simulación del Test

Aquí está lo que verá en cada terminal mientras ejecutas el test:

### **Terminal 1 (npm run dev)** - Verás esto al Paso 5:

```
🔔 Webhook recibido: invoice.created
💰 Invoice creada: in_1SNI0aP79PdNEb94xxxxx
   - Customer: cus_TJuaVtALbmCtkR
   - Subscription: sub_1SNGlaP79PdNEb94O4kdWbXP
   - Amount: 178800MXN

🔔 Webhook recibido: invoice.payment_succeeded
✅ Pago procesado para: in_1SNI0bP79PdNEb94xxxxx

🔔 Webhook recibido: invoice.paid
💰 Invoice pagado: in_1SNI0cP79PdNEb94xxxxx
   - Customer: cus_TJuaVtALbmCtkR
   - Subscription: sub_1SNGlaP79PdNEb94O4kdWbXP
   - Amount: 178800MXN
🔄 Renovación automática detectada, actualizando expires_at
✅ Fecha de vencimiento actualizada: 2027-10-28T17:33:04.000Z
```

### **Terminal 2 (stripe listen)** - Verás esto al Paso 5:

```
▶ invoice.created [evt_test_1SNI0aP79PdNEb94xxxxx]
▶ invoice.payment_succeeded [evt_test_1SNI0bP79PdNEb94xxxxx]
▶ invoice.paid [evt_test_1SNI0cP79PdNEb94xxxxx]
```

### **Terminal 3 (testManualRenewal.js)** - Interactivo:

```
═══════════════════════════════════════════════════════════════════════════
  🕐 TEST MANUAL DE RENOVACIÓN AUTOMÁTICA
═══════════════════════════════════════════════════════════════════════════

📍 PASO 1: Obtener datos del usuario
────────────────────────────────────────────────────────────────────────────

🔍 Buscando usuario en BD...
✅ Usuario encontrado:
   ID: LORCJD76usa3rwYQRdMP8
   Email: test5@mail.com
   Status: active
   Expires: 2026-10-28T17:33:04.000Z
   Stripe Sub ID: sub_1SNGlaP79PdNEb94O4kdWbXP

¿Continuar? (s/n): s

📍 PASO 2: Verificar suscripción actual en Stripe
...
```

---

## ⚙️ Flujo Completo Paso a Paso

```
Terminal 3: PASO 1
  ↓
Terminal 3: Muestra datos del usuario
  ↓
Terminal 3: PASO 2-4
  ↓
Terminal 3: PASO 5 - "¿Tienes Stripe CLI escuchando?"
  ↓
Confirmas: s
  ↓
Terminal 3: Avanza el tiempo
  ↓
Stripe genera eventos
  ↓
Terminal 2: ▶ invoice.created, invoice.paid, etc.
  ↓
Terminal 1: npm run dev recibe webhooks
  ↓
Terminal 1: "Renovación automática detectada"
  ↓
Terminal 3: "¿Presiona Enter cuando veas los webhooks"
  ↓
Presionas Enter
  ↓
Terminal 3: PASO 6-7
  ↓
Terminal 3: ✅ Datos BD actualizados
  ↓
Terminal 3: ✅ TEST COMPLETADO
```

---

## ✅ Checklist Final

Antes de ejecutar el test, verifica:

- [ ] Terminal 1: `npm run dev` ejecutando (ver "ready - started server")
- [ ] Terminal 2: `stripe listen` ejecutando (ver "Ready!")
- [ ] Terminal 2: Copiaste el `STRIPE_WEBHOOK_SECRET`
- [ ] `.env.local` tiene `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Terminal 3: Listo para ejecutar el script

---

## 🚀 ¡Ejecuta Ahora!

**Terminal 3:**
```bash
node scripts/testusers/testManualRenewal.js test5@mail.com
```

Confirma con `s` en cada paso y observa los webhooks en Terminales 1 y 2.

---

## 🎯 Qué Significa Si Todo Sale Bien

✅ **Terminal 2 muestra webhooks**
   → Stripe generó invoice automáticamente

✅ **Terminal 1 muestra logs**
   → Tu servidor procesó el webhook

✅ **Terminal 3 confirma BD actualizada**
   → `subscription_expires_at` cambió de 2026 a 2027

**Resultado: ¡Renovación automática funciona! 🎉**

---

## 🆘 Troubleshooting Visual

### "No veo webhooks en Terminal 2"
```bash
# Terminal 2: Presiona Ctrl+C
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Ejecuta de nuevo
```

### "Terminal 1 no muestra logs"
```bash
# Terminal 1: Verifica que mostraba "ready - started server"
# Si no, ejecuta: npm run dev
```

### "Terminal 3 se queda esperando"
```bash
# Es normal, presiona Enter cuando veas webhooks en Terminal 2
# O presiona Ctrl+C para cancelar y reintentar
```

---

**¡Listo! Ahora tienes todo para hacer el test manual. ¡A probar! 🚀**
