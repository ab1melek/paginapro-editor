# 📊 Diagrama de Flujo: Cancelación de Suscripción

## Flujo Visual Completo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    USUARIO CON SUSCRIPCIÓN ACTIVA                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  DASHBOARD - Badge Verde: "Activa"                       │
│                            [Botón: Cancelar]                            │
│                                                                          │
│    subscription_status = 'active'                                        │
│    stripe_subscription_id = 'sub_xxxxx'                                  │
│    subscription_expires_at = Fecha futura                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Usuario hace clic: "Cancelar"
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  MODAL - PASO 1: Advertencia                             │
│                                                                          │
│    ⚠️ Cancelar suscripción                                               │
│                                                                          │
│    Si cancelas tu suscripción:                                           │
│    - Deja de funcionar tu página/s después del período actual           │
│    - NO habrá cobros automáticos futuros                                 │
│    - Puedes reactivar cuando quieras                                     │
│                                                                          │
│                 [Volver]              [Sí, cancelar]                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Usuario: "Sí, cancelar"
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  MODAL - PASO 2: Confirmación                            │
│                                                                          │
│    Confirmación final                                                    │
│    Para confirmar, escribe:                                              │
│                                                                          │
│    ┌───────────────────────────────────────────────┐                   │
│    │ sí, quiero cancelar mi suscripción          │                   │
│    └───────────────────────────────────────────────┘                   │
│                                                                          │
│    ┌───────────────────────────────────────────────┐                   │
│    │ [Input] Escribe aquí...                     │                   │
│    └───────────────────────────────────────────────┘                   │
│                                                                          │
│    [Botón DESHABILITADO hasta que texto coincida]                       │
│                                                                          │
│    (Usuario escribe: "sí, quiero cancelar mi suscripción")              │
│                                                                          │
│    [Volver]              [Cancelar suscripción] ← HABILITADO            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Usuario: "Cancelar suscripción"
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  MODAL - PASO 3: Procesando                              │
│                                                                          │
│    Procesando cancelación...                                             │
│                                                                          │
│           ╱── spinner girando ──╲                                       │
│                                                                          │
│    Por favor, espera mientras procesamos tu solicitud.                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ POST /api/stripe/cancel-subscription
                                    ▼
    ┌────────────────────────────────────────────────────────────────────┐
    │                        BACKEND                                     │
    │                                                                    │
    │  1. Verificar autenticación ✅                                    │
    │     └─ Token válido y payload.id existe                         │
    │                                                                    │
    │  2. Verificar confirmación ✅                                    │
    │     └─ confirmed === true                                       │
    │                                                                    │
    │  3. Cancelar en Stripe ✅  ← CRÍTICO                            │
    │     └─ stripe.subscriptions.del(subscriptionId)                │
    │     └─ Retorna: id, status, canceled_at                        │
    │     └─ Stripe Status cambia a: "canceled"                      │
    │     └─ ❌ NO hay renovación después                            │
    │     └─ ❌ NO hay cobro al final del período                    │
    │     └─ ❌ NO hay facturas pendientes                           │
    │                                                                    │
    │  4. Actualizar BD ✅                                            │
    │     UPDATE neon_auth.users                                      │
    │     SET subscription_status = 'canceled'                        │
    │     WHERE id = $userId                                          │
    │     └─ subscription_status: 'active' → 'canceled'              │
    │     └─ subscription_expires_at: ahora                          │
    │                                                                    │
    │  5. Retornar respuesta ✅                                       │
    │     200 OK                                                      │
    │     {                                                           │
    │       "message": "Suscripción cancelada exitosamente",         │
    │       "subscription": {                                        │
    │         "status": "canceled",                                  │
    │         "canceled_at": "2025-10-27T14:45:22Z"                │
    │       }                                                         │
    │     }                                                           │
    └────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  FRONTEND: Éxito                                         │
│                                                                          │
│    Alert: "Tu suscripción ha sido cancelada exitosamente."              │
│                                                                          │
│    Usuario click OK                                                      │
│                                                                          │
│    Modal cierra                                                          │
│    Dashboard recarga datos                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                  DASHBOARD - Badge Rojo: "Expirada"                      │
│                                                                          │
│    subscription_status = 'canceled'  ← Actualizado                       │
│    stripe_subscription_id = 'sub_xxxxx'                                  │
│    subscription_expires_at = Ahora                                       │
│                                                                          │
│    ⚠️ Suscripción expirada                                               │
│    [Botón "Cancelar" DESAPARECE]                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
    ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ BD SINCRONIZADA  │  │   STRIPE WEBHOOK │  │   USUARIO INTENTA│
    │                  │  │                  │  │   ACCEDER PÁGINA │
    │ UPDATE users:    │  │ customer.subsc   │  │                  │
    │ status='canceled'│  │ .deleted event   │  │ GET /[slug]      │
    │                  │  │                  │  │                  │
    │ ✅ Registrado   │  │ Stripe envía:    │  │ Check en servidor│
    │                  │  │ {                │  │ if(status=== "ca│
    │ subscription     │  │   subscription:{ │  │ nceled") {       │
    │ _expires_at:NOW  │  │     status:      │  │   return Block   │
    │                  │  │     "canceled",  │  │ }                │
    │                  │  │     canceled_at: │  │                  │
    │                  │  │     timestamp    │  │ 🔒 Página       │
    │                  │  │   }              │  │ Bloqueada:       │
    │                  │  │ }                │  │ "Suscripción    │
    │                  │  │                  │  │ cancelada"       │
    │                  │  │ Backend recibe   │  │                  │
    │                  │  │ UPDATE users:    │  │ ❌ Acceso denegado
    │                  │  │ status='expired' │  │                  │
    │                  │  │ ✅ Confirmado   │  │ usuario NO ve    │
    │                  │  │                  │  │ contenido        │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│          LÍNEA DE TIEMPO: PREVENCIÓN DE COBROS AUTOMÁTICOS              │
│                                                                          │
│  T₀ (Ahora): Cancelación                                                 │
│  ├─ Stripe: stripe.subscriptions.del(id) ✅                            │
│  ├─ BD: subscription_status = 'canceled' ✅                            │
│  └─ Webhook: customer.subscription.deleted ✅                          │
│                                                                          │
│  T₁ (Mañana):                                                            │
│  ├─ ❌ NO hay invoice.payment_attempt                                  │
│  ├─ ❌ NO hay retry de pago                                            │
│  └─ ✅ Stripe NO intenta cobrar                                        │
│                                                                          │
│  T₂ (30 días después):                                                   │
│  ├─ ❌ NO hay invoice.created                                          │
│  ├─ ❌ NO hay invoice.payment_succeeded                                │
│  └─ ✅ Stripe NO cobra automaticamente                                 │
│                                                                          │
│  T₃ (90 días después):                                                   │
│  ├─ ❌ Sigue sin cobros                                                │
│  ├─ ❌ Suscripción permanece 'canceled'                                │
│  └─ ✅ Usuario está protegido                                          │
│                                                                          │
│  GARANTÍA: stripe.subscriptions.del() asegura que NUNCA habrá cobro   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Estados

```
┌─────────────┐
│   SIGNUP    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│  subscription_status │
│  = 'none'           │
└──────┬──────────────┘
       │ Primera página creada
       ▼
┌─────────────────────┐
│  subscription_status │
│  = 'trial'          │
│  (10 días gratis)   │
└──────┬──────────────┘
       │ Después de 10 días O usuario upgradea
       ▼
┌─────────────────────┐
│  subscription_status │
│  = 'active'         │◄────────┐
│  (suscripción paga) │         │
└──────┬──────────────┘         │
       │                        │ Puede reactivar
       │ Usuario cancela        │
       ▼                        │
┌─────────────────────┐         │
│  subscription_status │         │
│  = 'canceled'       │─────────┤ Webhook: expired
│  (cancelada)        │         │
└──────┬──────────────┘         │
       │                        │
       ▼                        │
┌─────────────────────┐         │
│  subscription_status │         │
│  = 'expired'        │─────────┘
│  (confirmado expirada)
└─────────────────────┘
```

---

## Estados en Stripe vs BD

```
╔═══════════════════╦═══════════════════╦═════════════════════╗
║   Acción Usuario  ║   Status Stripe   ║   Status BD         ║
╠═══════════════════╬═══════════════════╬═════════════════════╣
║ Crea cuenta       ║ N/A               ║ 'none'              ║
║ Prueba gratis     ║ N/A               ║ 'trial'             ║
║ Compra plan       ║ 'active'          ║ 'active'            ║
║ Pago se procesa   ║ 'active'          ║ 'active'            ║
║ Usuario cancela   ║ 'canceled'        ║ 'canceled'          ║
║ Webhook llega     ║ 'canceled'        ║ 'expired'           ║
║ Intenta acceder   ║ 'canceled'        ║ 'expired'           ║
║ a página          ║                   ║ (página bloqueada)   ║
╚═══════════════════╩═══════════════════╩═════════════════════╝
```

---

## Protecciones Multicapa

```
┌────────────────────────────────────────────────────────────────┐
│                  CAPA 1: FRONTEND - UI                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Botón "Cancelar" solo si status = 'active'           │ │
│  │ • Modal con 3 pasos (confirmación múltiple)            │ │
│  │ • Usuario debe escribir texto exacto                    │ │
│  │ • Procesamiento visible (spinner)                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────────┐
│              CAPA 2: API - Validación                          │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Verificar autenticación (token)                       │ │
│  │ • Verificar confirmación (confirmed=true)              │ │
│  │ • Validar subscriptionId                                │ │
│  │ • Manejo robusto de errores                            │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────────┐
│          CAPA 3: STRIPE - Cancelación Segura                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • stripe.subscriptions.del() - INMEDIATA               │ │
│  │ • Status = 'canceled' (NO at_period_end)              │ │
│  │ • ❌ NO genera facturas futuras                        │ │
│  │ • ❌ NO renueva automáticamente                        │ │
│  │ • ❌ NO cobra al final del período                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────────┐
│           CAPA 4: BD - Estado Persistente                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • subscription_status = 'canceled'                       │ │
│  │ • Impide reactivación accidental                        │ │
│  │ • Bloquea acceso a páginas                             │ │
│  │ • Histórico auditable                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────────┐
│        CAPA 5: WEBHOOK - Sincronización                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Recibe customer.subscription.deleted                   │ │
│  │ • Confirma estado en Stripe                             │ │
│  │ • Actualiza BD a 'expired'                              │ │
│  │ • Verifica integridad de datos                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
                          ▼
┌────────────────────────────────────────────────────────────────┐
│        CAPA 6: ACCESO - Bloqueo de Contenido                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ • Check en [slug]/page.js                              │ │
│  │ • Si status = 'canceled' → RECHAZAR                    │ │
│  │ • Muestra: "🔒 Suscripción cancelada"                 │ │
│  │ • User NO ve contenido                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

════════════════════════════════════════════════════════════════════
           ✅ GARANTÍA: SIN COBROS AUTOMÁTICOS NUNCA
════════════════════════════════════════════════════════════════════
```

---

## Escenarios Críticos Cubiertos

```
ESCENARIO 1: Usuario cancela justo antes de renovación
───────────────────────────────────────────────────────
  T-1h: Debe haber cobro
  T₀: Usuario cancela
  stripe.subscriptions.del(id) ejecutado ✅
  Stripe NO cobra ✅

ESCENARIO 2: Usuario cancela pero rechaza confirmación
──────────────────────────────────────────────────────
  Modal Paso 2: Usuario escribe mal el texto
  Botón permanece deshabilitado ✅
  No se envía POST a API ✅
  BD no cambia ✅

ESCENARIO 3: Webhook no llega
──────────────────────────────
  BD tiene status = 'canceled' ✅ (de API)
  Stripe tiene status = 'canceled' ✅ (del cliente)
  Incluso sin webhook, está protegido ✅

ESCENARIO 4: Usuario intenta reactivar manualmente
──────────────────────────────────────────────────
  Busca en Stripe: status = 'canceled' (NO se puede)
  Busca en BD: status = 'canceled' (NO se reactiva)
  ❌ Acceso denegado ✅

ESCENARIO 5: Usuario cancela, espera, intenta acceder
─────────────────────────────────────────────────────
  Inmediato:  subscription_status = 'canceled'
  +5 sec:     subscription_status = 'expired' (webhook)
  +30 días:   Página sigue bloqueada ✅
  +1 año:     Sin cobro automático ✅
```

---

✅ **Flujo 100% seguro contra cobros automáticos**
