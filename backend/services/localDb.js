import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    }
  : {
      host: process.env.LOCAL_PG_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_PG_PORT || '5432', 10),
      database: process.env.LOCAL_PG_DATABASE || 'digitech_ims',
      user: process.env.LOCAL_PG_USER || 'ims_user',
      password: process.env.LOCAL_PG_PASSWORD || 'ims_password_2026',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 3000,
    };
let isLocalDbConnected = false;
let pool = null;

if (!process.env.VERCEL) {
  try {
    pool = new Pool(poolConfig);
    pool.query('SELECT 1 AS health_check')
      .then(() => {
        isLocalDbConnected = true;
        console.log('[Local DB] PostgreSQL local database connected successfully (digitech_ims).');
      })
      .catch((err) => {
        isLocalDbConnected = false;
        console.log('[Local DB] Local PostgreSQL not connected or waiting for server (' + err.message + '). Supabase Cloud will serve as primary.');
      });
  } catch (e) {
    isLocalDbConnected = false;
  }
} else {
  console.log('[Local DB] Vercel Serverless environment detected: Supabase Cloud is primary DB.');
}

export const query = async (text, params) => {
  if (!pool || !isLocalDbConnected) {
    return { rows: [] };
  }
  return pool.query(text, params);
};

export const getClient = async () => {
  if (!pool || !isLocalDbConnected) {
    throw new Error('Local database pool is not connected');
  }
  return pool.connect();
};

export const isConnected = () => isLocalDbConnected;

export default {
  query,
  getClient,
  isConnected,
  pool
};
