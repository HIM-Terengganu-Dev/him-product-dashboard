import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';
import type { CampaignPerformance } from '../../../../types/tiktok';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, group } = req.query;
    
    // If no date specified, use today
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    let query = `
      SELECT 
        campaign_id,
        campaign_group,
        campaign_name,
        report_date,
        cost,
        net_cost,
        live_views,
        orders_sku,
        gross_revenue,
        roi,
        roas,
        currency,
        uploaded_at,
        uploaded_by
      FROM tiktok_sales_performance_tables.campaign_performance
      WHERE report_date = $1
      AND campaign_type = 'LIVE'
    `;

    const params: any[] = [targetDate];

    if (group) {
      query += ` AND campaign_group = $2`;
      params.push(String(group));
    }

    query += ` ORDER BY gross_revenue DESC`;

    const result = await pool.query(query, params);

    const campaigns: CampaignPerformance[] = result.rows.map(row => ({
      campaign_id: row.campaign_id,
      campaign_group: row.campaign_group,
      campaign_name: row.campaign_name,
      report_date: row.report_date,
      cost: parseFloat(row.cost),
      net_cost: parseFloat(row.net_cost),
      live_views: parseInt(row.live_views),
      orders_sku: parseInt(row.orders_sku),
      gross_revenue: parseFloat(row.gross_revenue),
      roi: parseFloat(row.roi),
      roas: parseFloat(row.roas),
      currency: row.currency,
      uploaded_at: row.uploaded_at,
      uploaded_by: row.uploaded_by,
    }));

    return res.status(200).json({
      success: true,
      data: campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

