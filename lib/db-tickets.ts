import { Pool } from 'pg';

// Separate database connection pool for tickets system
// This connects to the cursormade_him_db database using .env.local credentials
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL_CURSORMADE_HIM_DB || process.env.POSTGRES_URL_HIM_CRM,
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle tickets DB client', err);
    process.exit(-1);
});

export { pool };
