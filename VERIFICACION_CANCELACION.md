# ✅ Checklist de Verificación: Cancelación de Suscripciones

## Pre-Producción

### 1. Verificación de Archivos
- [x] `/app/api/stripe/cancel-subscription/route.js` existe
- [x] `/components/CancelSubscriptionModal.js` existe
- [x] `/app/api/services/stripe.db.service.js` tiene `cancelSubscriptionForUser()`
- [x] `/app/dashboard/page.js` importa modal y muestra botón
- [x] `/app/api/stripe/webhook/route.js` maneja `customer.subscription.deleted`
- [x] `/app/[slug]/page.js` bloquea acceso si status = 'canceled'

### 2. Verificación de Seguridad
- [x] Endpoint usa `stripe.subscriptions.del()` (NO `cancel_at_period_end`)
- [x] BD marca como 'canceled' tras cancelación
- [x] Webhook confirma en BD
- [x] Página bloquea acceso para status 'canceled'
- [x] No hay lógica que reactive suscripción cancelada

### 3. Verificación de UX
- [x] Modal tiene 3 pasos claros
- [x] Usuario debe escribir texto exacto para confirmar
- [x] Botón "Cancelar" solo se muestra si status = 'active'
- [x] Mensaje de éxito después de cancelar
- [x] Error handling en modal

---

## Testing Manual

### Paso 1: Crear Usuario de Prueba
```bash
# Registrarse en /signup con:
- Username: testcancel
- Email: testcancel@example.com
- Password: Test123!
```

### Paso 2: Crear Suscripción de Prueba
```bash
# Opción A: Usar Stripe CLI para simular webhook
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Opción B: Ir a dashboard y usar "Upgrading to Plan" (si existe)

# Opción C: Hacer POST a /api/stripe/checkout-session
curl -X POST http://localhost:3000/api/stripe/checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=<tu_token>" \
  -d '{"plan": "monthly"}'
```

### Paso 3: Verificar en Dashboard
```
1. Abre /dashboard
2. Verifica badge verde: "✅ Suscripción activa"
3. Verifica botón rojo: "Cancelar"
```

### Paso 4: Probar Modal
```
1. Haz clic en "Cancelar"
2. Abre modal Paso 1
   - Lee advertencia
   - Haz clic "Sí, cancelar"
3. Modal Paso 2
   - Intenta escribir algo incorrecto
   - Verifica que botón esté deshabilitado
   - Escribe: "sí, quiero cancelar mi suscripción"
   - Verifica que botón esté habilitado
4. Modal Paso 3
   - Verifica spinner de "Procesando..."
5. Resultado
   - Verifica alert: "Suscripción cancelada exitosamente"
   - Modal cierra
   - Badge cambia a rojo: "⚠️ Suscripción expirada"
```

### Paso 5: Verificar BD
```bash
psql $DATABASE_URL << SQL
SELECT id, email, subscription_status, stripe_subscription_id 
FROM neon_auth.users 
WHERE email = 'testcancel@example.com';
SQL

# Resultado esperado:
# subscription_status = 'canceled'
```

### Paso 6: Verificar en Stripe
```
1. Ve a https://dashboard.stripe.com/subscriptions
2. Busca la suscripción de testcancel
3. Verifica:
   - Status: "Canceled"
   - canceled_at: Tiene fecha
   - No hay "Upcoming Invoice"
```

### Paso 7: Probar Acceso a Página Bloqueada
```bash
# Primero crea una página con el usuario testcancel
1. En /dashboard/editor, crea una página
2. Publica con slug: testpage-cancelado
3. Verifica que se muestra: http://localhost:3000/testpage-cancelado

# Luego cancela la suscripción (pasos anteriores)

# Finalmente verifica que está bloqueada
1. Abre http://localhost:3000/testpage-cancelado
2. Verifica que muestre: "🔒 Suscripción cancelada"
3. La página NO debe renderizar
```

### Paso 8: Verificar No Hay Cobro Automático
```bash
# Esperar 1-2 minutos y verificar
1. Dashboard de Stripe: Sin nuevas facturas para testcancel
2. BD: subscription_status sigue siendo 'canceled'
3. Logs: Sin intentos de renovación

# Si pasa el tiempo sin cobro automático:
✅ SEGURO - No hay renovación
```

---

## Testing Automatizado (Opcional)

```javascript
// tests/cancel-subscription.spec.js
describe('Cancelación de Suscripción', () => {
  test('debe cancelar suscripción en Stripe', async () => {
    // 1. Crear usuario y suscripción
    // 2. Llamar POST /api/stripe/cancel-subscription
    // 3. Verificar respuesta 200
    // 4. Verificar en Stripe que está 'canceled'
    // 5. Verificar en BD que está 'canceled'
  });

  test('debe bloquear página tras cancelar', async () => {
    // 1. Crear usuario, suscripción y página
    // 2. Cancelar suscripción
    // 3. GET /[slug]
    // 4. Verificar response contiene "🔒 Suscripción cancelada"
  });

  test('debe rechazar cancelación sin confirmación', async () => {
    // 1. POST /api/stripe/cancel-subscription sin confirmed=true
    // 2. Verificar respuesta 400
  });
});
```

---

## Verificación en Producción

### Checklist Inicial
- [ ] Las variables de entorno están configuradas:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `API_BASE_URL`
- [ ] La BD está migrada (columnas de suscripción existen)
- [ ] Webhook está configurado en Stripe Dashboard
- [ ] El SSL certificado es válido

### Monitoreo Diario
```bash
# Revisar logs de errores
tail -f /var/log/app.log | grep "cancel-subscription"

# Revisar logs de webhook
tail -f /var/log/app.log | grep "webhook.*subscription"

# Contar cancelaciones diarias
grep "cancelSubscriptionForUser" /var/log/app.log | wc -l

# Verificar que NO hay cobros duplicados
SELECT DATE(created), COUNT(*) 
FROM payments 
GROUP BY DATE(created)
```

### Alertas Críticas a Configurar
```
❌ ALERTA SI:
- Usuario canceló pero sigue 'active' en BD (después de 5 min)
- Cobro realizado a usuario con status = 'canceled'
- Webhook error en customer.subscription.deleted
- POST /api/stripe/cancel-subscription falla > 3 veces en 1 hora
```

---

## Rollback (Si algo sale mal)

### Opción 1: Revertir cambios git
```bash
git revert <commit-del-cancel-subscription>
```

### Opción 2: Mantener funcional pero desactivar
```javascript
// En /app/api/stripe/cancel-subscription/route.js
if (process.env.DISABLE_CANCEL_SUBSCRIPTION === '1') {
  return NextResponse.json(
    { error: "Cancelación temporalmente deshabilitada" },
    { status: 503 }
  );
}
```

### Opción 3: Si hubo cobro después de cancelar
```sql
-- Reactivar suscripción en BD (temporal, mientras investigas)
UPDATE neon_auth.users 
SET subscription_status = 'active'
WHERE email = 'usuario@afectado.com';

-- Crear ticket en Stripe para reembolso
-- Contactar a usuario explicando el error
```

---

## Post-Implementación

### Monitoreo Continuo
- [ ] Revisar logs diarios por errores
- [ ] Verificar tasa de cancelaciones (normal?)
- [ ] Monitorear soporte por reportes de "cobro después de cancelar"
- [ ] Sincronizar BD con Stripe weekly

### Mejoras Futuras
- [ ] Agregar email de confirmación de cancelación
- [ ] Permitir reactivar suscripción
- [ ] Dashboard de analítica: cancelaciones por razón
- [ ] Encuesta: ¿por qué cancelaste?
- [ ] Opción de pausar (no cancelar) por 30 días

---

## Contacto y Escalamiento

### Si hay problema con:
- **Cancelación no funciona**: Revisar logs de `/api/stripe/cancel-subscription/route.js`
- **Página no se bloquea**: Revisar BD status y código en `/app/[slug]/page.js`
- **Cobro después de cancelar**: Verificar Stripe Dashboard + BD status
- **Webhook no llega**: Revisar STRIPE_WEBHOOK_SECRET + logs de webhook

### Escalar a:
1. DBA: Verificar sincronización BD
2. Stripe Support: Si hay cobro no autorizado
3. Legal: Si hay problema de compliance

---

## Resumen Rápido

| Tarea | Status | Verificado |
|-------|--------|-----------|
| Endpoint creado | ✅ | ✅ |
| Modal implementado | ✅ | ✅ |
| BD actualizada | ✅ | ✅ |
| Páginas bloqueadas | ✅ | ✅ |
| Webhook actualizado | ✅ | ✅ |
| Documentación | ✅ | ✅ |
| Testing manual | 🚀 | ⏳ |
| Testing prod | 🚀 | ⏳ |

---

✅ **LISTO PARA PRODUCCIÓN** cuando hayas completado Testing manual y confirmado que NO hay cobros automáticos.
