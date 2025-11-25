import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';

interface DateRecord {
  report_date: string;
  num_campaigns: number;
  num_groups: number;
  total_cost: number;
  total_revenue: number;
  total_orders: number;
  last_uploaded: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Format date in SQL query itself to ensure YYYY-MM-DD format
    const query = `
      SELECT 
        TO_CHAR(report_date, 'YYYY-MM-DD') as report_date,
        COUNT(DISTINCT campaign_id) as num_campaigns,
        COUNT(DISTINCT campaign_group) as num_groups,
        SUM(cost) as total_cost,
        SUM(gross_revenue) as total_revenue,
        SUM(orders_sku) as total_orders,
        MAX(uploaded_at) as last_uploaded
      FROM tiktok_sales_performance_tables.campaign_performance
      WHERE campaign_type = 'PRODUCT'
      GROUP BY report_date
      ORDER BY report_date DESC
    `;

    const result = await pool.query(query);

    const dates: DateRecord[] = result.rows.map(row => ({
      report_date: row.report_date, // Already formatted as YYYY-MM-DD by TO_CHAR
      num_campaigns: parseInt(row.num_campaigns) || 0,
      num_groups: parseInt(row.num_groups) || 0,
      total_cost: parseFloat(row.total_cost) || 0,
      total_revenue: parseFloat(row.total_revenue) || 0,
      total_orders: parseInt(row.total_orders) || 0,
      last_uploaded: row.last_uploaded ? new Date(row.last_uploaded).toISOString() : null,
    }));

    return res.status(200).json({
      success: true,
      data: dates,
      count: dates.length,
    });
  } catch (error) {
    console.error('Error fetching date records:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

