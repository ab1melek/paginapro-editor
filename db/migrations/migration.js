import { query } from '../pool.js';

export async function migrate() {
  // Extensiones base
  await query(`CREATE EXTENSION IF NOT EXISTS citext;`);

  // ========= Auth mínima (esquema neon_auth) =========
  await query(`CREATE SCHEMA IF NOT EXISTS neon_auth;`);
  await query(`
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
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_users_username ON neon_auth.users (username);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_auth_users_email ON neon_auth.users (email);`);

  // Asegurar columnas adicionales que existen en la BD/GUI (no modificamos datos)
  await query(`ALTER TABLE IF EXISTS neon_auth.users
    ADD COLUMN IF NOT EXISTS plan TEXT,
    ADD COLUMN IF NOT EXISTS next_pay TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT,
    ADD COLUMN IF NOT EXISTS mp_customer_id TEXT,
    ADD COLUMN IF NOT EXISTS first_page_created_at TIMESTAMPTZ;
  `);

  // ========= Páginas (schema actual en search_path, por defecto 'editor') =========
  await query(`
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

  // owner_id + FK -> neon_auth.users
  await query(`ALTER TABLE pages ADD COLUMN IF NOT EXISTS owner_id TEXT;`);
  await query(`
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

  // trigger to auto-update updated_at
  await query(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await query(`
    DROP TRIGGER IF EXISTS trigger_set_updated_at ON pages;
    CREATE TRIGGER trigger_set_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  migrate().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(err => {
    console.error('Migration failed', err);
    process.exit(1);
  });
}
