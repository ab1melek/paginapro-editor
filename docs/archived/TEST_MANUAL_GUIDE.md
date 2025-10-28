# 🧪 Test Manual de Renovación Automática

**Script:** `scripts/testusers/testManualRenewal.js`

---

## ⚡ Inicio Rápido

```bash
node scripts/testusers/testManualRenewal.js email@mail.com
```

**Ejemplo:**
```bash
node scripts/testusers/testManualRenewal.js test5@mail.com
```

---

## 📋 ¿Qué Hace?

Es un **test interactivo paso a paso** donde:
- ✅ Tú controlas cuándo ejecutar cada acción
- ✅ Ves los resultados en tiempo real
- ✅ Entiendes exactamente qué sucede
- ✅ Puedes pausar en cualquier momento

---

## 🚀 Pasos del Test Manual

### **PASO 1: Obtener datos del usuario**
```
🔍 Buscando usuario en BD...
✅ Usuario encontrado:
   ID: LORCJD76usa3rwYQRdMP8
   Email: test5@mail.com
   Status: active
   Expires: 2026-10-28T17:33:04.000Z
   Stripe Sub ID: sub_1SNGlaP79PdNEb94O4kdWbXP

¿Continuar? (s/n): s
```

---

### **PASO 2: Verificar suscripción en Stripe**
```
🔍 Obteniendo suscripción de Stripe...
✅ Suscripción encontrada:
   ID: sub_1SNGlaP79PdNEb94O4kdWbXP
   Status: active
   Customer: cus_TJuaVtALbmCtkR
   Current Period End: 2026-10-28T17:33:04.000Z
   Schedule: sub_sched_1SNHbTP79PdNEb945u4X8LRi

¿Continuar? (s/n): s
```

---

### **PASO 3: Verificar Schedule**
```
🔍 Obteniendo schedule de Stripe...
✅ Schedule encontrado:
   ID: sub_sched_1SNHbTP79PdNEb945u4X8LRi
   Status: active
   Phases: 2
   End Behavior: release

   Fase 1:
      Start: 2025-10-28T17:33:04.000Z
      End: 2026-10-28T17:33:04.000Z
      Items: 1

   Fase 2:
      Start: 2026-10-28T17:33:04.000Z
      End: 2027-10-28T17:33:04.000Z
      Items: 1

¿Continuar? (s/n): s
```

---

### **PASO 4: Crear Test Clock**
```
⏰ Preparando Test Clock...
   Esto avanzará el tiempo 1 año + 1 mes
   Stripe generará invoice automáticamente

🕐 Tiempo congelado será: 2026-11-28T17:33:04.000Z

¿Crear Test Clock ahora? (s/n): s

⏳ Creando Test Clock...
✅ Test Clock creado:
   ID: clock_1SNHzAP79PdNEb94xxxxx
   Frozen Time: 2026-11-28T17:33:04.000Z

¿Continuar? (s/n): s
```

---

### **PASO 5: Avanzar Test Clock (IMPORTANTE)**

```
⏳ Avanzando tiempo...

ATENCIÓN: Este paso debe estar escuchando webhooks con:
   stripe listen --forward-to localhost:3000/api/stripe/webhook

¿Tienes Stripe CLI escuchando? (s/n): s

⏳ Avanzando Test Clock...

✅ Test Clock avanzado!

STRIPE DEBERÍA HABER GENERADO AUTOMÁTICAMENTE:
   ✓ invoice.created
   ✓ invoice.payment_succeeded
   ✓ invoice.paid ← Tu webhook debe actualizarse aquí

Verifica en la terminal de Stripe CLI si los webhooks aparecen.

¿Presiona Enter cuando veas los webhooks en Stripe CLI:
```

**En Terminal 2 (Stripe CLI) deberías ver:**
```
▶ invoice.created [evt_test_1SNI0aP79PdNEb94xxxxx]
▶ invoice.payment_succeeded [evt_test_1SNI0bP79PdNEb94xxxxx]
▶ invoice.paid [evt_test_1SNI0cP79PdNEb94xxxxx]
```

**En Terminal 1 (npm run dev) deberías ver:**
```
🔔 Webhook recibido: invoice.paid
💰 Invoice pagado: in_1SNI0cP79PdNEb94xxxxx
   - Customer: cus_TJuaVtALbmCtkR
   - Subscription: sub_1SNGlaP79PdNEb94O4kdWbXP
   - Amount: 178800MXN
🔄 Renovación automática detectada, actualizando expires_at
✅ Fecha de vencimiento actualizada: 2027-10-28T17:33:04.000Z
```

---

### **PASO 6: Verificar suscripción renovada**
```
🔍 Obteniendo suscripción actualizada de Stripe...

✅ Suscripción actualizada:
   ID: sub_1SNGlaP79PdNEb94O4kdWbXP
   Status: active
   NEW Current Period End: 2027-10-28T17:33:04.000Z

¿Continuar? (s/n): s
```

---

### **PASO 7: Verificar BD actualizada**
```
🔍 Consultando BD...

✅ Datos en BD:
   Status: active
   Expires: 2027-10-28T17:33:04.000Z

✅ Status = 'active' (Correcto para renovación)
✅ Días restantes: ~365

¿Continuar? (s/n): s
```

---

### **PASO 8: Ejecutar verificación**
```
¿Ejecutar verificación completa? (s/n): s

⏳ Ejecutando: verifyAutoRenewal.js

⚠️  Para ejecutar la verificación manualmente, usa:
   node scripts/testusers/verifyAutoRenewal.js test5@mail.com
```

---

### **RESUMEN FINAL**
```
════════════════════════════════════════════════════════════════════════════
  ✅ TEST COMPLETADO
════════════════════════════════════════════════════════════════════════════

Si todo salió bien, deberías ver:

   ✅ Webhooks en Stripe CLI
   ✅ BD actualizada con nuevo expires_at
   ✅ Status = 'active'

¿QUÉ SIGNIFICA?

   ✅ Renovación automática FUNCIONA
   ✅ Webhooks se procesan correctamente
   ✅ BD se sincroniza automáticamente

PRÓXIMOS PASOS:

   1. Ejecutar: node scripts/testusers/verifyAutoRenewal.js test5@mail.com
   2. Confirmar que todas las verificaciones pasan
   3. ¡Renovación automática está lista!
```

---

## 🎯 Checklist Para el Test Manual

- [ ] Tener 3 terminales abiertas
- [ ] Terminal 1: `npm run dev` (dev server)
- [ ] Terminal 2: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] Terminal 3: `node scripts/testusers/testManualRenewal.js test5@mail.com`
- [ ] Avanzar paso a paso con "s" (sí) cuando pida
- [ ] Ver webhooks en Terminal 2
- [ ] Ver logs en Terminal 1
- [ ] Confirmar BD actualizada en Paso 7

---

## 📊 Qué Sucede Internamente

```
Paso 5: Avanzas el tiempo
    ↓
Stripe detecta renovación
    ↓
Genera invoice.created
    ↓
Procesa pago
    ↓
Genera invoice.payment_succeeded
    ↓
Genera invoice.paid
    ↓
Stripe CLI captura eventos
    ↓
localhost:3000/api/stripe/webhook recibe invoice.paid
    ↓
Tu webhook handler ejecuta:
   - Obtiene subscription actualizada
   - Llama saveSubscriptionForUser()
   - BD actualiza subscription_expires_at
    ↓
Paso 7: Verificas BD - ¡Actualizada!
```

---

## ✅ Resultado Esperado

Si el test pasa completamente:

✅ **Renovación automática funciona**
- Stripe generó invoice automáticamente

✅ **Webhooks se procesan**
- Viste los eventos en Stripe CLI

✅ **BD se sincroniza**
- `subscription_expires_at` se actualizó

✅ **Sin intervención manual**
- Todo sucedió automáticamente

---

## 🚨 Si Algo Falla

### "No veo webhooks en Stripe CLI"
**Solución:**
1. Verifica que `stripe listen` está corriendo
2. Comprueba que tienes `.env.local` con `STRIPE_WEBHOOK_SECRET`
3. Reinicia: `Ctrl+C` en Stripe CLI y ejecuta de nuevo

### "BD no se actualizó"
**Solución:**
1. Verifica logs en Terminal 1 (npm run dev)
2. Busca: "Error: Cannot read properties of undefined"
3. Ejecuta: `node scripts/testusers/verifyAutoRenewal.js test5@mail.com`

### "Script se queda esperando"
**Solución:**
- Es normal, presiona Enter cuando veas los webhooks
- El script espera a que confirmes que viste los webhooks

---

## 💡 Tips Útiles

### Ejecutar directamente sin parar:
```bash
# Esto saltará todas las confirmaciones
(echo "s"; echo "s"; echo "s"; echo "s"; echo "s"; sleep 2; echo "s"; echo "s"; echo "n") | \
  node scripts/testusers/testManualRenewal.js test5@mail.com
```

### Ver el estado después del test:
```bash
node scripts/testusers/verifyAutoRenewal.js test5@mail.com
```

### Monitorear webhooks en tiempo real:
```bash
stripe events list --limit 50 | grep invoice
```

---

## 🎓 Conclusión

**El test manual te permite:**
- ✅ Ver exactamente qué sucede en cada paso
- ✅ Confirmar que la renovación automática funciona
- ✅ Entender el flujo completo
- ✅ Debuggear si algo falla

**Tiempo total:** ~2-3 minutos (esperar webhooks incluido)

¡Listo para testear! 🚀
