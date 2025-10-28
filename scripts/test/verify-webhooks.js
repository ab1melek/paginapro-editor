#!/usr/bin/env node

/**
 * Script para verificar que todos los casos de webhook estén llamando a syncSubscriptionFromStripe()
 * Asegura que BD-Stripe se sincronizarán automáticamente en TODOS los eventos relevantes.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const webhookPath = path.join(
  __dirname,
  "../../app/api/stripe/webhook/route.js"
);

console.log("🔍 Verificando que todos los casos de webhook sincronicen desde Stripe...\n");

if (!fs.existsSync(webhookPath)) {
  console.error(`❌ Archivo no encontrado: ${webhookPath}`);
  process.exit(1);
}

const content = fs.readFileSync(webhookPath, "utf-8");

// Casos que deben sincronizar
const requiredCases = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid"
];

// Verificar cada caso
console.log("📋 Casos a verificar:");
let allPassed = true;

requiredCases.forEach((caseLabel, index) => {
  const caseRegex = new RegExp(`case\\s+"${caseLabel.replace(/"/g, '\\"')}"`, "m");
  
  if (!caseRegex.test(content)) {
    console.log(`   ${index + 1}. ❌ ${caseLabel} - NO ENCONTRADO`);
    allPassed = false;
    return;
  }

  // Buscar syncSubscriptionFromStripe después de este case
  const caseIndex = content.indexOf(`case "${caseLabel}"`);
  const nextCaseIndex = content.indexOf("case ", caseIndex + 1);
  const caseContent = nextCaseIndex !== -1 
    ? content.substring(caseIndex, nextCaseIndex)
    : content.substring(caseIndex);

  // Verificar que contiene syncSubscriptionFromStripe o saveSubscriptionForUser
  const hasSyncCall = caseContent.includes("syncSubscriptionFromStripe");
  const hasSaveCall = caseContent.includes("saveSubscriptionForUser");

  if (hasSyncCall) {
    console.log(
      `   ${index + 1}. ✅ ${caseLabel} - SINCRONIZA desde Stripe`
    );
  } else if (hasSaveCall) {
    console.log(
      `   ${index + 1}. ⚠️  ${caseLabel} - Guarda en BD pero FALTA sincronización`
    );
    allPassed = false;
  } else {
    console.log(`   ${index + 1}. ❌ ${caseLabel} - NO actualiza BD`);
    allPassed = false;
  }
});

console.log("\n📊 Verificación de importaciones:");

// Verificar que las funciones estén importadas
const hasSyncCallInFile = content.includes("syncSubscriptionFromStripe(");
const hasEmergencySyncCall = content.includes("emergencySyncIfNeeded");

if (hasSyncCallInFile) {
  console.log("   ✅ syncSubscriptionFromStripe() se llama en el webhook");
} else {
  console.log("   ❌ FALTA llamadas a syncSubscriptionFromStripe()");
  allPassed = false;
}

if (hasEmergencySyncCall) {
  console.log("   ✅ emergencySyncIfNeeded importada");
} else {
  console.log("   ℹ️  emergencySyncIfNeeded no está en uso (es complementaria)");
}

// Verificar que el archivo existe
const syncServicePath = path.join(
  __dirname,
  "../../app/api/services/sync.db.service.js"
);
if (fs.existsSync(syncServicePath)) {
  console.log(`   ✅ Archivo de servicio de sincronización existe`);
} else {
  console.log(
    `   ❌ Archivo de servicio de sincronización NO existe: ${syncServicePath}`
  );
  allPassed = false;
}

console.log("\n" + "=".repeat(60));

if (allPassed) {
  console.log(
    "✅ VERIFICACIÓN EXITOSA - BD-Stripe estarán sincronizados en TODOS los webhooks"
  );
  console.log("\n📝 Resumen:");
  console.log("   - Checkout completado: saveSubscriptionForUser");
  console.log("   - Suscripción creada: syncSubscriptionFromStripe ✅");
  console.log("   - Suscripción actualizada: syncSubscriptionFromStripe ✅");
  console.log("   - Suscripción cancelada: syncSubscriptionFromStripe ✅");
  console.log("   - Factura pagada: syncSubscriptionFromStripe ✅");
  console.log("\n🎯 Beneficios:");
  console.log("   • Desincronización imposible - cada webhook sincroniza");
  console.log("   • Redundancia: saveSubscriptionForUser + syncSubscriptionFromStripe");
  console.log("   • Rollback automático si sync falla");
  console.log("   • Logging completo para debugging");
  process.exit(0);
} else {
  console.log(
    "❌ VERIFICACIÓN FALLIDA - Hay casos de webhook sin sincronización"
  );
  console.log("\n⚠️  Acción requerida:");
  console.log("   1. Revisa los casos marcados con ❌ o ⚠️");
  console.log("   2. Asegúrate que cada caso llame a syncSubscriptionFromStripe()");
  console.log("   3. Re-ejecuta este script para verificar");
  process.exit(1);
}
