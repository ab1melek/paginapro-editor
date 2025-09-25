import dotenv from 'dotenv';

dotenv.config();

const parseIntOr = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const get = (k, fallback) => (process.env[k] === undefined ? fallback : process.env[k]);

const config = {
  app: {
    host: get('HOST', 'localhost'),
    port: parseIntOr(get('PORT', 3000), 3000),
    baseURL: get('API_BASE_URL', `http://localhost:${parseIntOr(get('PORT', 3000),3000)}`),
    env: get('NODE_ENV', 'development'),
  },
  db: {
    host: get('DB_HOST_APP', 'localhost'),
    port: parseIntOr(get('DB_PORT_APP', 5432), 5432),
    name: get('DB_NAME_APP', 'postgres'),
    user: get('DB_USER_APP', 'postgres'),
    password: get('DB_PASSWORD_APP', 'postgres'),
    // construye DATABASE_URL si no está provista
    databaseUrl: get('DATABASE_URL', null) || `postgresql://${get('DB_USER_APP','postgres')}:${get('DB_PASSWORD_APP','postgres')}@${get('DB_HOST_APP','localhost')}:${parseIntOr(get('DB_PORT_APP',5432),5432)}/${get('DB_NAME_APP','postgres')}`,
  },
  features: {
    useDb: get('USE_DB', get('DATABASE_URL') ? '1' : '0') === '1' || !!get('DATABASE_URL', null),
  }
};

export default config;
