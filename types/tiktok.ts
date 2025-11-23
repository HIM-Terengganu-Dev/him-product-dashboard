// TikTok Sales Performance Types

export interface CampaignPerformance {
  campaign_id: string;
  campaign_group: string;
  campaign_name: string;
  report_date: string;
  cost: number;
  net_cost: number;
  live_views: number;
  orders_sku: number;
  gross_revenue: number;
  roi: number;
  roas: number;
  currency: string;
  uploaded_at: string;
  uploaded_by: string | null;
}

export interface GroupPerformance {
  campaign_group: string;
  report_date: string;
  num_campaigns: number;
  total_cost: number;
  total_net_cost: number;
  total_revenue: number;
  avg_roi: number;
  total_orders_sku: number;
  total_live_views: number;
  roas: number;
  currency: string;
  last_uploaded_at: string;
}

export interface DailyMetrics {
  report_date: string;
  total_cost: number;
  total_orders: number;
  total_revenue: number;
  cost_per_order: number;
  roas: number;
  num_groups: number;
  num_campaigns: number;
}

export interface PerformanceComparison {
  current: DailyMetrics;
  yesterday: DailyMetrics | null;
  lastWeek: DailyMetrics | null;
  lastMonth: DailyMetrics | null;
  lastThreeMonths: DailyMetrics | null;
}

export interface PercentageChange {
  cost: number | null;
  orders: number | null;
  revenue: number | null;
  costPerOrder: number | null;
  roas: number | null;
}

export interface MetricsWithChange extends DailyMetrics {
  vsYesterday: PercentageChange;
  vsLastWeek: PercentageChange;
  vsLastMonth: PercentageChange;
  vsLastThreeMonths: PercentageChange;
}

export interface UploadHistory {
  upload_id: string;
  report_date: string;
  data_type: 'live_gmv' | 'product_gmv' | 'ttam';
  records_count: number;
  uploaded_by: string;
  uploaded_at: string;
  status: 'success' | 'failed' | 'partial';
  error_message: string | null;
}

// Data upload types
export interface LiveGMVUploadData {
  report_date: string;
  campaign_id: string;
  campaign_name: string;
  cost: number;
  net_cost: number;
  live_views: number;
  orders_sku: number;
  gross_revenue: number;
  roi: number;
  currency: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors?: string[];
}

