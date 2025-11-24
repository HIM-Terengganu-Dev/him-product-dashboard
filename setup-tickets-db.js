/**
 * Database Setup Script for Developer Tickets
 * 
 * This script creates the dev_tickets schema and tickets table
 * Run this once to set up the database structure
 * 
 * Usage: node setup-tickets-db.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, 'database', '.env') });

const DDL_SQL = `
-- Developer Ticketing System Schema
-- This schema stores support tickets submitted by users to the dashboard developers

CREATE SCHEMA IF NOT EXISTS dev_tickets;

-- Main tickets table
CREATE TABLE IF NOT EXISTS dev_tickets.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('bug', 'feature_request', 'question', 'improvement', 'other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    submitted_by_email VARCHAR(255) NOT NULL,
    submitted_by_name VARCHAR(255) NOT NULL,
    page_url TEXT,
    browser_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    developer_notes TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_email ON dev_tickets.tickets(submitted_by_email);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON dev_tickets.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON dev_tickets.tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON dev_tickets.tickets(category);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION dev_tickets.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS update_tickets_updated_at ON dev_tickets.tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON dev_tickets.tickets
    FOR EACH ROW
    EXECUTE FUNCTION dev_tickets.update_updated_at_column();
`;

async function createTicketsSchema() {
    // Create connection pool using POSTGRES_URL_DDL from database/.env
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL_DDL,
    });

    try {
        console.log('Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('Creating dev_tickets schema and tables...');
            await client.query(DDL_SQL);
            console.log('✓ Schema and tables created successfully!');

            // Verify the creation
            const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'dev_tickets'
      `);

            console.log('\nCreated tables:');
            result.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating schema:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run the script
createTicketsSchema();
