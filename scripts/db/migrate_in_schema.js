#!/usr/bin/env node
/**
 * Helper to run db/migrations/migration.js inside a specific schema.
 * Usage:
 *   node scripts/migrate_in_schema.js [schema] [--apply]
 *
 * By default this script runs in dry-run mode (prints the commands it will run).
 * Use --apply to actually run the migration.
 */
import dotenv from 'dotenv';
import pg from 'pg';
const { Pool, Client } = pg;

dotenv.config();

const schema = process.argv[2] || 'editor';
const apply = process.argv.includes('--apply');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in the environment. Aborting.');
  process.exit(1);
}

async function createSchemaIfNotExists(url, schemaName) {
  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
    console.log(`Schema \"${schemaName}\" ensured.`);
  } finally {
    client.release();
    await pool.end();
  }
}

function buildUrlWithSearchPath(url, schemaName) {
  // Append options to set search_path. Encode properly.
  const encoded = encodeURIComponent(`search_path=${schemaName}`);
  // If DATABASE_URL already contains query params, append with &
  if (url.includes('?')) return `${url}&options=-c%20${encoded}`;
  return `${url}?options=-c%20${encoded}`;
}

(async () => {
  try {
    console.log('Target schema:', schema);
    if (!apply) console.log('DRY RUN (no changes will be applied). Use --apply to run.');

    await createSchemaIfNotExists(process.env.DATABASE_URL, schema);

    // Build URL-with-search-path for informational purposes, but Neon rejects
    // startup parameter 'options' for pooled connections. We'll run the
    // migration statements directly on an unpooled client (Client) after
    // setting the session search_path.
    const urlForSchema = buildUrlWithSearchPath(process.env.DATABASE_URL, schema);
    console.log('Migration command (info):');
    console.log(`DATABASE_URL="${urlForSchema}" node db/migrations/migration.js`);

    if (apply) {
      console.log('Running migration using an unpooled client...');
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      try {
        // set search_path for this session
        await client.query(`SET search_path TO "${schema}";`);

        // Run statements similar to db/migrations/migration.js but using this client
        await client.query(`CREATE EXTENSION IF NOT EXISTS citext;`);

        // neon_auth.users (global schema)
        await client.query(`CREATE SCHEMA IF NOT EXISTS neon_auth;`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS neon_auth.users (
            id TEXT PRIMARY KEY,
            username CITEXT UNIQUE NOT NULL,
            email CITEXT UNIQUE,
            password_hash TEXT NOT NULL,
            is_special BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_username ON neon_auth.users (username);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_auth_users_email ON neon_auth.users (email);`);

        await client.query(`
          CREATE TABLE IF NOT EXISTS pages (
            id TEXT PRIMARY KEY,
            slug CITEXT UNIQUE NOT NULL,
            title TEXT,
            data JSONB NOT NULL,
            page_settings JSONB,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
          );
        `);
        await client.query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS owner_id TEXT;`);
        await client.query(`
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.table_constraints
              WHERE constraint_name = 'pages_owner_fk'
                AND table_name = 'pages'
            ) THEN
              ALTER TABLE pages
                ADD CONSTRAINT pages_owner_fk FOREIGN KEY (owner_id)
                REFERENCES neon_auth.users(id) ON DELETE SET NULL;
            END IF;
          END$$;
        `);

        await client.query(`
          CREATE OR REPLACE FUNCTION set_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = now();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `);

        await client.query(`
          DROP TRIGGER IF EXISTS trigger_set_updated_at ON pages;
          CREATE TRIGGER trigger_set_updated_at
          BEFORE UPDATE ON pages
          FOR EACH ROW
          EXECUTE FUNCTION set_updated_at();
        `);

        console.log('Migration finished.');
      } finally {
        await client.end();
      }
    }
  } catch (err) {
    console.error('Error:', err?.message || err);
    process.exitCode = 1;
  }
})();
