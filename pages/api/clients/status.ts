import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import {
  validateMethod,
  parsePagination,
  getQueryString,
  parseQueryArray,
  buildMarketplaceFilter,
  buildProductFilter,
  formatDate,
  sendErrorResponse,
  sendSuccessResponse,
} from '../../../lib/api-helpers';
import type {
  ApiRequest,
  ClientStatus,
  Client,
  ClientStatusSummary,
  ClientStatusResponse,
} from '../../../types';

const getStatusCaseStatement = () => `
    CASE
        WHEN status = 'new' THEN 'New Client'
        WHEN status = 'active' AND last_order_date >= NOW() - INTERVAL '60 days' THEN 'Active'
        WHEN status = 'active' AND last_order_date BETWEEN NOW() - INTERVAL '180 days' AND NOW() - INTERVAL '61 days' THEN 'Churning'
        WHEN status = 'churned' OR (status = 'active' AND last_order_date < NOW() - INTERVAL '180 days') THEN 'Churned'
        ELSE 'Other' -- Should be handled or filtered out
    END
`;

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<ClientStatusResponse | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const { page, limit, offset } = parsePagination(req.query);
  const { status: statusFilter, search, startDate, endDate, product, marketplace } = req.query;

  const client = await pool.connect();
  try {
    const statusCase = getStatusCaseStatement();

    // Build base filters to be used across all queries
    const whereClauses: string[] = [`derived_status != 'Other'`, `type = 'client'`];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (statusFilter && typeof statusFilter === 'string' && statusFilter.toLowerCase() !== 'all') {
      whereClauses.push(`derived_status = $${paramIndex++}`);
      queryParams.push(statusFilter);
    }
    if (search && typeof search === 'string') {
      whereClauses.push(`(name ILIKE $${paramIndex++} OR phone_number ILIKE $${paramIndex++})`);
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    if (startDate && typeof startDate === 'string') {
      whereClauses.push(`last_order_date >= $${paramIndex++}`);
      queryParams.push(startDate);
    }
    if (endDate && typeof endDate === 'string') {
      whereClauses.push(`last_order_date <= $${paramIndex++}`);
      queryParams.push(endDate);
    }
  const productStr = getQueryString(req.query, 'product');
  if (productStr) {
    const productArray = productStr.split(',');
    if (productArray.length > 0) {
      whereClauses.push(`last_order_product = ANY($${paramIndex++}::text[])`);
      queryParams.push(productArray);
    }
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

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const fromSubqueryWithStatus = `
      (SELECT *, ${statusCase} as derived_status FROM mart_himdashboard.crm_main_table) as c
    `;

    // Summary Query (now with filters)
    const summaryResult = await client.query(
      `
      SELECT derived_status, COUNT(*) as count
      FROM ${fromSubqueryWithStatus}
      ${whereString.replace(/c\./g, '')}
      GROUP BY derived_status;
    `,
      queryParams
    );

  const summary: ClientStatusSummary = {
    'New Client': 0,
    'Active': 0,
    'Churning': 0,
    'Churned': 0,
  };
  summaryResult.rows.forEach(row => {
    if (summary.hasOwnProperty(row.derived_status)) {
      summary[row.derived_status as ClientStatus] = parseInt(row.count, 10);
    }
  });

    // Product list for dropdown filter (unfiltered)
    const allProductsResult = await client.query(
      `SELECT DISTINCT TRIM(last_order_product) as product FROM mart_himdashboard.crm_main_table 
       WHERE last_order_product IS NOT NULL AND TRIM(last_order_product) <> '' 
       ORDER BY product ASC`
    );
    const allProducts: string[] = allProductsResult.rows.map(row => row.product);

    // Marketplace list for dropdown filter (unfiltered)
    const allMarketplacesResult = await client.query(
      `SELECT DISTINCT TRIM(last_marketplace) as marketplace FROM mart_himdashboard.crm_main_table 
       WHERE last_marketplace IS NOT NULL AND TRIM(last_marketplace) <> '' 
       ORDER BY marketplace ASC`
    );
    const allMarketplaces: string[] = allMarketplacesResult.rows.map(row => row.marketplace);

    // Main Data Query with integrated total count
    const dataQuery = `
      SELECT *, COUNT(*) OVER() as total_count
      FROM ${fromSubqueryWithStatus}
      ${whereString.replace(/c\./g, '')}
      ORDER BY last_order_date DESC NULLS LAST
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
      status: row.derived_status as ClientStatus,
      lastPurchaseDate: formatDate(row.last_order_date),
      lastOrderProduct: row.last_order_product || null,
    }));

    sendSuccessResponse(res, {
      clients,
      summary,
      totalClients,
      totalPages,
      allProducts,
      allMarketplaces,
    });

  } catch (error) {
    console.error('Database query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  } finally {
    client.release();
  }
}