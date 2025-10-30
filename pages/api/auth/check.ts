import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ authorized: boolean } | { error: string }>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const client = await pool.connect();
    try {
      // Check if the email exists in the authorized_users table.
      // We use `SELECT 1` because we only care about existence, which is faster than `COUNT(*)`
      const result = await client.query(
        'SELECT 1 FROM mart_himdashboard.authorized_users WHERE email = $1',
        [email.toLowerCase()] // Store and check emails in a consistent case
      );
      
      const isAuthorized = result.rowCount > 0;

      res.status(200).json({ authorized: isAuthorized });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Authorization check failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}