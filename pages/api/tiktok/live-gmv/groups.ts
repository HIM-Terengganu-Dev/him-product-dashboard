import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';
import type { GroupPerformance } from '../../../../types/tiktok';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;
    
    // If no date specified, use today
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    const query = `
      SELECT 
        campaign_group,
        report_date,
        num_campaigns,
        total_cost,
        total_net_cost,
        total_revenue,
        roi_percentage as avg_roi,
        total_orders as total_orders_sku,
        total_live_views,
        last_updated as last_uploaded_at
      FROM tiktok_sales_performance_views.mv_group_performance
      WHERE report_date = $1
      AND campaign_type = 'LIVE'
      ORDER BY total_revenue DESC
    `;

    const result = await pool.query(query, [targetDate]);

    const groups: GroupPerformance[] = result.rows.map(row => {
      // Calculate ROAS if we have cost and revenue
      const roas = row.total_cost > 0 ? row.total_revenue / row.total_cost : 0;
      
      return {
        campaign_group: row.campaign_group,
        report_date: row.report_date,
        num_campaigns: parseInt(row.num_campaigns) || 0,
        total_cost: parseFloat(row.total_cost) || 0,
        total_net_cost: parseFloat(row.total_net_cost) || 0,
        total_revenue: parseFloat(row.total_revenue) || 0,
        avg_roi: parseFloat(row.avg_roi) || 0,
        total_orders_sku: parseInt(row.total_orders_sku) || 0,
        total_live_views: parseInt(row.total_live_views) || 0,
        roas: roas,
        currency: 'RM', // Default to RM since currency is not in the view
        last_uploaded_at: row.last_uploaded_at ? new Date(row.last_uploaded_at).toISOString() : '',
      };
    });

    return res.status(200).json({
      success: true,
      data: groups,
      count: groups.length,
    });
  } catch (error) {
    console.error('Error fetching group performance:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    
    return res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.stack : undefined)
        : undefined,
    });
  }
}

