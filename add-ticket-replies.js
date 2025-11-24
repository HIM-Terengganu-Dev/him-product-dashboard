/**
 * Add Ticket Replies Table
 * 
 * This script adds the ticket_replies table for chat/conversation functionality
 * 
 * Usage: node add-ticket-replies.js
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'database', '.env') });

const DDL_SQL = `
-- Ticket Replies table for chat/conversation functionality
CREATE TABLE IF NOT EXISTS dev_tickets.ticket_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES dev_tickets.tickets(id) ON DELETE CASCADE,
    author_email VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    author_picture TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_replies_ticket_id ON dev_tickets.ticket_replies(ticket_id);
CREATE INDEX IF NOT EXISTS idx_replies_created ON dev_tickets.ticket_replies(created_at);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION dev_tickets.update_replies_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS update_replies_updated_at ON dev_tickets.ticket_replies;
CREATE TRIGGER update_replies_updated_at
    BEFORE UPDATE ON dev_tickets.ticket_replies
    FOR EACH ROW
    EXECUTE FUNCTION dev_tickets.update_replies_updated_at_column();
`;

async function createRepliesTable() {
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL_DDL,
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Creating ticket_replies table...');
            await client.query(DDL_SQL);
            console.log('✓ Ticket replies table created successfully!');

            // Verify the creation
            const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dev_tickets' 
          AND table_name = 'ticket_replies'
      `);

            if (result.rows.length > 0) {
                console.log('\nVerified: ticket_replies table exists');
            }

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating table:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createRepliesTable();
