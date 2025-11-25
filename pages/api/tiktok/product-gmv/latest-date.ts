import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the latest date with data for Product GMV
    const query = `
      SELECT 
        TO_CHAR(MAX(report_date), 'YYYY-MM-DD') as latest_date
      FROM tiktok_sales_performance_tables.campaign_performance
      WHERE campaign_type = 'PRODUCT'
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0 || !result.rows[0].latest_date) {
      return res.status(404).json({ 
        success: false,
        error: 'No data found',
        message: 'No Product GMV data found in database'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        latest_date: result.rows[0].latest_date,
      },
    });
  } catch (error) {
    console.error('Error fetching latest date:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


