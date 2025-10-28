#!/usr/bin/env node

/**
 * Script para crear usuario de prueba
 * Uso: node scripts/testusers/createTestUser.js
 */

import bcrypt from "bcryptjs";
import 'dotenv/config';
import { nanoid } from "nanoid";
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.DB_HOST_APP,
  port: parseInt(process.env.DB_PORT_APP || '5432'),
  database: process.env.DB_NAME_APP,
  user: process.env.DB_USER_APP,
  password: process.env.DB_PASSWORD_APP,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function createTestUser() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const userId = nanoid();
    const username = process.argv[2] || "test1";
    const email = process.argv[3] || "test1@mail.com";
    const plainPassword = process.argv[4] || "test123";

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const sql = `
      INSERT INTO neon_auth.users (id, username, email, password_hash, is_special)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE SET password_hash = $4
      RETURNING id, username, email, is_special, subscription_status;
    `;

    const result = await client.query(sql, [
      userId,
      username,
      email,
      passwordHash,
      false, // no especial
    ]);

    await client.query("COMMIT");

    const user = result.rows[0];
    console.log("✅ Usuario de prueba creado/actualizado:");
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Especial: ${user.is_special}`);
    console.log(`   Estado Suscripción: ${user.subscription_status}`);
    console.log("");
    console.log("📧 Credenciales:");
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${plainPassword}`);
    console.log("");
    console.log("🔗 Enlace para probar: http://localhost:3000/login");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error al crear usuario:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUser();
