import { Pool } from 'pg';
import type { NextApiRequest, NextApiResponse } from 'next';

// FIX: Correct the type for NextApiRequest to include the 'method' property,
// resolving an error that can be caused by conflicting types or configuration issues.
interface ApiRequest extends NextApiRequest {
  method?: string;
}

interface MarketplaceSummaryData {
  marketplace: string;
  count: number;
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<MarketplaceSummaryData[] | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const client = await pool.connect();
    try {
      // Query to group by marketplace, but only for records where the marketplace is not null or empty.
      const result = await client.query(
        `SELECT 
           TRIM(last_marketplace) as marketplace, 
           COUNT(*) as count 
         FROM mart_himdashboard.crm_main_table 
         WHERE last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> ''
         GROUP BY TRIM(last_marketplace)
         ORDER BY count DESC`
      );
      
      const summary: MarketplaceSummaryData[] = result.rows.map(row => ({
        marketplace: row.marketplace,
        count: parseInt(row.count, 10),
      }));

      res.status(200).json(summary);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database marketplace summary query failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}