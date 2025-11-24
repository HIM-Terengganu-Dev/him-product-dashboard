import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';
import type { MetricsWithChange, DailyMetrics, PercentageChange } from '../../../../types/tiktok';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, comparisonPeriod = 'all', customDate } = req.query;
    
    // If no date specified, use today
    const targetDate = date ? String(date) : new Date().toISOString().split('T')[0];

    // Fetch current metrics
    const currentMetrics = await getDailyMetrics(targetDate);

    if (!currentMetrics) {
      return res.status(404).json({ error: 'No data found for specified date' });
    }

    // Calculate comparison metrics based on requested period
    const comparisons: {
      yesterday?: DailyMetrics | null;
      lastWeek?: DailyMetrics | null;
      lastMonth?: DailyMetrics | null;
      lastThreeMonths?: DailyMetrics | null;
      customDate?: DailyMetrics | null;
    } = {};

    if (comparisonPeriod === 'all' || comparisonPeriod === 'yesterday') {
      const yesterdayDate = getDateOffset(targetDate, -1);
      comparisons.yesterday = await getDailyMetrics(yesterdayDate);
    }

    if (comparisonPeriod === 'all' || comparisonPeriod === 'lastWeek') {
      const lastWeekDate = getDateOffset(targetDate, -7);
      comparisons.lastWeek = await getDailyMetrics(lastWeekDate);
    }

    if (comparisonPeriod === 'all' || comparisonPeriod === 'lastMonth') {
      const lastMonthDate = getDateOffsetMonths(targetDate, -1);
      comparisons.lastMonth = await getDailyMetrics(lastMonthDate);
    }

    if (comparisonPeriod === 'all' || comparisonPeriod === 'lastThreeMonths') {
      const lastThreeMonthsDate = getDateOffsetMonths(targetDate, -3);
      comparisons.lastThreeMonths = await getDailyMetrics(lastThreeMonthsDate);
    }

    // Handle custom date comparison
    if (comparisonPeriod === 'customDate' && customDate) {
      const customDateStr = String(customDate);
      comparisons.customDate = await getDailyMetrics(customDateStr);
    }

    // Calculate percentage changes
    const metricsWithChange: MetricsWithChange = {
      ...currentMetrics,
      vsYesterday: calculatePercentageChange(currentMetrics, comparisons.yesterday),
      vsLastWeek: calculatePercentageChange(currentMetrics, comparisons.lastWeek),
      vsLastMonth: calculatePercentageChange(currentMetrics, comparisons.lastMonth),
      vsLastThreeMonths: calculatePercentageChange(currentMetrics, comparisons.lastThreeMonths),
      vsCustomDate: comparisons.customDate ? calculatePercentageChange(currentMetrics, comparisons.customDate) : undefined,
    };

    return res.status(200).json({
      success: true,
      data: metricsWithChange,
      comparisons,
    });
  } catch (error) {
    console.error('Error fetching Live GMV metrics:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function getDailyMetrics(date: string): Promise<DailyMetrics | null> {
  const query = `
    SELECT 
      report_date,
      SUM(cost) as total_cost,
      SUM(orders_sku) as total_orders,
      SUM(gross_revenue) as total_revenue,
      CASE 
        WHEN SUM(orders_sku) > 0 
        THEN SUM(cost) / SUM(orders_sku) 
        ELSE 0 
      END as cost_per_order,
      CASE 
        WHEN SUM(cost) > 0 
        THEN SUM(gross_revenue) / SUM(cost) 
        ELSE 0 
      END as roas,
      COUNT(DISTINCT campaign_group) as num_groups,
      COUNT(DISTINCT campaign_id) as num_campaigns
    FROM tiktok_sales_performance_tables.campaign_performance
    WHERE report_date = $1
    AND campaign_type = 'LIVE'
    GROUP BY report_date
  `;

  const result = await pool.query(query, [date]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  
  // Log values for debugging
  console.log('[DEBUG] Metrics query result:', {
    report_date: row.report_date,
    total_cost: row.total_cost,
    total_orders: row.total_orders,
    total_revenue: row.total_revenue,
    cost_per_order: row.cost_per_order,
    roas: row.roas,
    num_groups: row.num_groups,
    num_campaigns: row.num_campaigns,
  });
  
  return {
    report_date: row.report_date,
    total_cost: parseFloat(row.total_cost) || 0,
    total_orders: parseInt(row.total_orders) || 0,
    total_revenue: parseFloat(row.total_revenue) || 0,
    cost_per_order: parseFloat(row.cost_per_order) || 0,
    roas: parseFloat(row.roas) || 0,
    num_groups: parseInt(row.num_groups) || 0,
    num_campaigns: parseInt(row.num_campaigns) || 0,
  };
}

function calculatePercentageChange(
  current: DailyMetrics,
  previous: DailyMetrics | null | undefined
): PercentageChange {
  if (!previous) {
    return {
      cost: null,
      orders: null,
      revenue: null,
      costPerOrder: null,
      roas: null,
    };
  }

  const calcChange = (curr: number, prev: number): number | null => {
    if (prev === 0) return null;
    return ((curr - prev) / prev) * 100;
  };

  return {
    cost: calcChange(current.total_cost, previous.total_cost),
    orders: calcChange(current.total_orders, previous.total_orders),
    revenue: calcChange(current.total_revenue, previous.total_revenue),
    costPerOrder: calcChange(current.cost_per_order, previous.cost_per_order),
    roas: calcChange(current.roas, previous.roas),
  };
}

function getDateOffset(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function getDateOffsetMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

