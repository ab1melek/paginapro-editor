#!/usr/bin/env node

/**
 * Script de setup completo para probar suscripciones
 * Uso: node scripts/testusers/setup.js
 */

import { spawn } from "child_process";
import pool from "../../db/pool.js";

async function runSetup() {
  console.log("🚀 SETUP DE PRUEBAS - SUSCRIPCIONES STRIPE\n");

  try {
    // 1. Verificar conexión a BD
    console.log("1️⃣  Verificando conexión a base de datos...");
    await pool.query("SELECT 1");
    console.log("✅ Conexión OK\n");

    // 2. Crear usuario de prueba
    console.log("2️⃣  Creando usuario de prueba...");
    const userRes = await pool.query(
      `SELECT id, email FROM neon_auth.users WHERE email = $1`,
      ["test1@mail.com"]
    );

    if (userRes.rows.length === 0) {
      console.log("   Usuario no existe, creando...");
      // Importar y ejecutar el script de creación
      await new Promise((resolve) => {
        const proc = spawn("node", [
          "scripts/testusers/createTestUser.js",
        ]);
        proc.on("close", resolve);
      });
    } else {
      console.log(`✅ Usuario ya existe: ${userRes.rows[0].email}\n`);
    }

    // 3. Verificar variables de entorno
    console.log("3️⃣  Verificando variables de entorno...");
    const required = [
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
      "STRIPE_PRICE_ID_MONTHLY",
      "STRIPE_PRICE_ID_YEARLY",
    ];
    let allOk = true;
    for (const env of required) {
      const value = process.env[env];
      if (value) {
        console.log(`   ✅ ${env}`);
      } else {
        console.log(`   ❌ ${env} (falta)`);
        allOk = false;
      }
    }
    if (!allOk) {
      console.warn("\n⚠️  Algunas variables no están configuradas.");
      console.warn("   Actualiza .env.local con los valores de Stripe\n");
    } else {
      console.log("✅ Variables OK\n");
    }

    // 4. Mostrar instrucciones
    console.log("4️⃣  Próximos pasos:\n");
    console.log("   Terminal 1 (escuchar webhooks):");
    console.log("   $ stripe listen --forward-to localhost:3000/api/stripe/webhook\n");
    console.log("   Terminal 2 (correr aplicación):");
    console.log("   $ npm run dev\n");
    console.log("   Terminal 3 (opcional - probar flujo automático):");
    console.log("   $ node scripts/testusers/testSubscriptionFlow.js\n");
    console.log("   O accede manualmente:");
    console.log("   🔗 http://localhost:3000/login");
    console.log("   📧 Email: test1@mail.com");
    console.log("   🔑 Contraseña: test123\n");

    console.log("✅ SETUP COMPLETADO\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSetup();
