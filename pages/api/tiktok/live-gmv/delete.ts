import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Date is required',
        message: 'Please provide a date parameter (YYYY-MM-DD)'
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid date format',
        message: 'Date must be in YYYY-MM-DD format'
      });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Delete all records for this date and campaign_type = 'LIVE'
      const deleteQuery = `
        DELETE FROM tiktok_sales_performance_tables.campaign_performance
        WHERE report_date = $1
        AND campaign_type = 'LIVE'
      `;

      const result = await client.query(deleteQuery, [date]);
      const deletedCount = result.rowCount || 0;

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} records for ${date}`,
        deletedCount,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting records:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

