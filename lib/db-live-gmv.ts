import { Pool } from 'pg';

// Separate database connection pool for Live GMV dashboard
// This connects to the cursormade_him_db database for TikTok sales performance data
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_CURSORMADE_HIM_DB || process.env.POSTGRES_URL_HIM_CRM,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle Live GMV client', err);
  process.exit(-1);
});

export { pool };


