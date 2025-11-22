import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import {
  validateMethod,
  parsePagination,
  getQueryString,
  buildMarketplaceFilter,
  sendErrorResponse,
  sendSuccessResponse,
} from '../../../lib/api-helpers';
import type {
  ApiRequest,
  ClientSegment,
  Client,
  ClientSegmentSummary,
  ClientSegmentResponse,
} from '../../../types';

const getSegmentCaseStatement = () => `
    CASE
        WHEN segment = 'high-spender' THEN 'High-Spender Client'
        WHEN segment = 'repeat' AND total_orders > 5 THEN 'Loyal Client'
        WHEN segment = 'repeat' THEN 'Repeat Client'
        WHEN segment = 'one-time' THEN 'One-time Client'
        ELSE 'Other'
    END
`;

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<ClientSegmentResponse | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const { page, limit, offset } = parsePagination(req.query);
  const { segment: segmentFilter, search, marketplace } = req.query;

  const client = await pool.connect();
  try {
    const segmentCase = getSegmentCaseStatement();

    // Build base filters for all queries
    const whereClauses = [`segment IS NOT NULL`, `derived_segment != 'Other'`, `type = 'client'`];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (segmentFilter && typeof segmentFilter === 'string' && segmentFilter.toLowerCase() !== 'all') {
      whereClauses.push(`derived_segment = $${paramIndex++}`);
      queryParams.push(segmentFilter);
    }
    if (search && typeof search === 'string') {
      whereClauses.push(`(name ILIKE $${paramIndex++} OR phone_number ILIKE $${paramIndex++})`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }
  const marketplaceStr = getQueryString(req.query, 'marketplace');
  if (marketplaceStr) {
    const marketplaceArray = marketplaceStr.split(',');
    const filter = buildMarketplaceFilter(marketplaceArray, paramIndex, queryParams);
    if (filter.clause) {
      whereClauses.push(filter.clause);
      paramIndex = filter.nextParamIndex;
    }
  }
        
    const whereString = `WHERE ${whereClauses.join(' AND ')}`;

    const fromSubqueryWithSegment = `
      (SELECT *, ${segmentCase} as derived_segment FROM mart_himdashboard.crm_main_table) as c
    `;

    // Summary Query (with filters)
    const summaryResult = await client.query(
      `
      SELECT derived_segment, COUNT(*) as count
      FROM ${fromSubqueryWithSegment}
      ${whereString.replace(/c\./g, '')}
      GROUP BY derived_segment;
    `,
      queryParams
    );
  const summary: ClientSegmentSummary = {
    'Loyal Client': 0,
    'High-Spender Client': 0,
    'Repeat Client': 0,
    'One-time Client': 0,
  };
  summaryResult.rows.forEach(row => {
    if (summary.hasOwnProperty(row.derived_segment)) {
      summary[row.derived_segment as ClientSegment] = parseInt(row.count, 10);
    }
  });

    // Marketplace list for dropdown filter (unfiltered)
    const allMarketplacesResult = await client.query(
      `SELECT DISTINCT TRIM(last_marketplace) as marketplace FROM mart_himdashboard.crm_main_table 
       WHERE last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> '' 
       ORDER BY marketplace ASC`
    );
    const allMarketplaces: string[] = allMarketplacesResult.rows.map(row => row.marketplace);

    // Main Data Query with integrated total count
    const dataQuery = `
      SELECT 
        phone_number,
        name,
        derived_segment,
        aov,
        total_orders,
        (aov * total_orders) as total_spent,
        COUNT(*) OVER() as total_count
      FROM ${fromSubqueryWithSegment}
      ${whereString.replace(/c\./g, '')}
      ORDER BY total_spent DESC NULLS LAST
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    const limitOffsetParams = [...queryParams, limit, offset];
    const result = await client.query(dataQuery, limitOffsetParams);

    const totalClients = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalClients / limit);

    const clients: Client[] = result.rows.map(row => ({
      id: String(row.phone_number || ''),
      name: row.name || 'N/A',
      phone: row.phone_number || 'N/A',
      segment: row.derived_segment as ClientSegment,
      totalSpent: parseFloat(row.total_spent || 0),
      aov: parseFloat(row.aov || 0),
      totalOrders: parseInt(row.total_orders || 0),
    }));

    sendSuccessResponse(res, { clients, summary, totalClients, totalPages, allMarketplaces });

  } catch (error) {
    console.error('Database query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  } finally {
    client.release();
  }
}