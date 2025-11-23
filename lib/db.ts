import { Pool } from 'pg';

// Shared database connection pool
// This ensures we only have one pool instance across all API routes
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_HIM_CRM,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export { pool };

