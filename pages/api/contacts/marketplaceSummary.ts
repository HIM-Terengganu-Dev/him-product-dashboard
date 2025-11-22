import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import { validateMethod, sendErrorResponse, sendSuccessResponse } from '../../../lib/api-helpers';
import type { ApiRequest, MarketplaceSummaryData } from '../../../types';

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<MarketplaceSummaryData[] | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
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

      sendSuccessResponse(res, summary);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database marketplace summary query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
}