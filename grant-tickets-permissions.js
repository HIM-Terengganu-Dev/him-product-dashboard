/**
 * Grant Permissions Script for Developer Tickets
 * 
 * This script grants the runtime user permissions to access the dev_tickets schema
 * Run this after creating the schema with setup-tickets-db.js
 * 
 * Usage: node grant-tickets-permissions.js
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables from both .env.local (runtime) and database/.env (DDL)
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, 'database', '.env') });

// Extract the username from the runtime connection string
const runtimeConnectionString = process.env.POSTGRES_URL_CURSORMADE_HIM_DB;

if (!runtimeConnectionString) {
    console.error('Error: POSTGRES_URL_CURSORMADE_HIM_DB not found in .env.local');
    console.log('Please make sure this variable is set in your .env.local file at the project root');
    process.exit(1);
}

// Parse the connection string to extract username
// Format: postgresql://username:password@host:port/database
const match = runtimeConnectionString.match(/postgresql:\/\/([^:]+):/);
const runtimeUser = match ? match[1] : null;

if (!runtimeUser) {
    console.error('Error: Could not extract username from POSTGRES_URL_CURSORMADE_HIM_DB');
    console.log('Connection string format should be: postgresql://username:password@host:port/database');
    process.exit(1);
}

console.log(`Granting permissions to user: ${runtimeUser}`);

const GRANT_SQL = `
-- Grant usage on the schema
GRANT USAGE ON SCHEMA dev_tickets TO ${runtimeUser};

-- Grant all privileges on the tickets table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE dev_tickets.tickets TO ${runtimeUser};

-- Grant usage on all sequences in the schema (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dev_tickets TO ${runtimeUser};

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA dev_tickets 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${runtimeUser};

ALTER DEFAULT PRIVILEGES IN SCHEMA dev_tickets 
    GRANT USAGE, SELECT ON SEQUENCES TO ${runtimeUser};
`;

async function grantPermissions() {
    // Use DDL credentials (admin) to grant permissions
    const pool = new Pool({
        connectionString: process.env.CURSORMADE_HIM_DB_DDL,
    });

    try {
        console.log('Connecting to database with admin credentials...');
        const client = await pool.connect();

        try {
            console.log('Granting permissions...');
            await client.query(GRANT_SQL);
            console.log('✓ Permissions granted successfully!');

            // Verify the grants
            const result = await client.query(`
        SELECT 
          grantee,
          privilege_type
        FROM information_schema.table_privileges 
        WHERE table_schema = 'dev_tickets' 
          AND table_name = 'tickets'
          AND grantee = '${runtimeUser}'
      `);

            console.log(`\nVerified permissions for user '${runtimeUser}':`);
            result.rows.forEach(row => {
                console.log(`  - ${row.privilege_type}`);
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error granting permissions:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
grantPermissions();
