/**
 * Grant permissions for ticket_replies table
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });
require('dotenv').config({ path: path.join(__dirname, 'database', '.env') });

const runtimeConnectionString = process.env.POSTGRES_URL_CURSORMADE_HIM_DB;
const match = runtimeConnectionString.match(/postgresql:\/\/([^:]+):/);
const runtimeUser = match ? match[1] : null;

const GRANT_SQL = `
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE dev_tickets.ticket_replies TO ${runtimeUser};
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA dev_tickets TO ${runtimeUser};
`;

async function grantRepliesPermissions() {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL_DDL });

    try {
        const client = await pool.connect();
        try {
            await client.query(GRANT_SQL);
            console.log(`✓ Granted permissions on ticket_replies to ${runtimeUser}`);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

grantRepliesPermissions();
