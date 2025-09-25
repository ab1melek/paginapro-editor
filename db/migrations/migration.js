import { query } from '../pool.js';

export async function migrate() {
  await query(`CREATE EXTENSION IF NOT EXISTS citext;`);
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
