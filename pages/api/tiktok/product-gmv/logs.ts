import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';

interface OperationLog {
  id: number;
  operation_type: string;
  report_date: string;
  user_email: string;
  action_details: any;
  created_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, limit = '100' } = req.query;

    const client = await pool.connect();
    try {
      let query: string;
      let params: any[];

      if (date && typeof date === 'string') {
        // Filter by specific date
        query = `
          SELECT 
            id,
            operation_type,
            report_date,
            user_email,
            action_details,
            created_at
          FROM tiktok_sales_performance_tables.operation_logs
          WHERE report_date = $1
          ORDER BY created_at DESC
          LIMIT $2
        `;
        params = [date, parseInt(limit as string)];
      } else {
        // Get all logs, most recent first
        query = `
          SELECT 
            id,
            operation_type,
            report_date,
            user_email,
            action_details,
            created_at
          FROM tiktok_sales_performance_tables.operation_logs
          ORDER BY created_at DESC
          LIMIT $1
        `;
        params = [parseInt(limit as string)];
      }

      const result = await client.query(query, params);

      return res.status(200).json({
        success: true,
        data: result.rows as OperationLog[],
        count: result.rows.length,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

