import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../../lib/db-live-gmv';

interface ManualEntryData {
  campaign_id: string;
  campaign_name: string;
  campaign_group: string;
  cost: number;
  net_cost: number;
  live_views: number;
  orders_sku: number;
  gross_revenue: number;
  roi: number;
  currency: string;
}

interface ManualEntryRequest {
  reportDate: string;
  data: ManualEntryData[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: ManualEntryRequest = req.body;

    if (!body.reportDate || !body.data || !Array.isArray(body.data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'reportDate and data array are required',
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.reportDate)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'reportDate must be in YYYY-MM-DD format',
      });
    }

    if (body.data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        message: 'At least one campaign record is required',
      });
    }

    const client = await pool.connect();
    let recordsInserted = 0;
    let recordsUpdated = 0;
    const errors: string[] = [];

    try {
      await client.query('BEGIN');

      for (const row of body.data) {
        // Validate required fields
        if (!row.campaign_id || !row.campaign_name) {
          errors.push(`Skipped row: Campaign ID and Name are required`);
          continue;
        }

        // Parse campaign_id as bigint
        let campaignIdBigint: bigint;
        try {
          campaignIdBigint = BigInt(row.campaign_id);
        } catch (error) {
          errors.push(`Skipped campaign ${row.campaign_id}: Invalid Campaign ID format`);
          continue;
        }

        // Calculate ROAS (it's a computed column, so we don't insert it)
        // Insert/Update the record
        const query = `
          INSERT INTO tiktok_sales_performance_tables.campaign_performance (
            campaign_id,
            campaign_group,
            campaign_name,
            report_date,
            campaign_type,
            cost,
            net_cost,
            live_views,
            orders_sku,
            gross_revenue,
            roi,
            currency,
            uploaded_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (campaign_id, report_date)
          DO UPDATE SET
            campaign_group = EXCLUDED.campaign_group,
            campaign_name = EXCLUDED.campaign_name,
            campaign_type = EXCLUDED.campaign_type,
            cost = EXCLUDED.cost,
            net_cost = EXCLUDED.net_cost,
            live_views = EXCLUDED.live_views,
            orders_sku = EXCLUDED.orders_sku,
            gross_revenue = EXCLUDED.gross_revenue,
            roi = EXCLUDED.roi,
            currency = EXCLUDED.currency,
            uploaded_at = CURRENT_TIMESTAMP,
            uploaded_by = EXCLUDED.uploaded_by
          RETURNING (xmax = 0) AS is_insert
        `;

        const values = [
          campaignIdBigint,
          row.campaign_group || '',
          row.campaign_name || '',
          body.reportDate,
          'LIVE',
          row.cost || 0,
          row.net_cost || 0,
          row.live_views || 0,
          row.orders_sku || 0,
          row.gross_revenue || 0,
          row.roi || 0,
          row.currency || 'RM',
          'manual_entry', // Indicate this was entered manually
        ];

        const result = await client.query(query, values);
        const isInsert = result.rows[0]?.is_insert;

        if (isInsert) {
          recordsInserted++;
        } else {
          recordsUpdated++;
        }
      }

      await client.query('COMMIT');

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${body.data.length} record(s): ${recordsInserted} inserted, ${recordsUpdated} updated`,
        recordsProcessed: body.data.length,
        recordsInserted,
        recordsUpdated,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error processing manual entry:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

