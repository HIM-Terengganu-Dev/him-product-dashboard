import type { NextApiResponse } from 'next';
import { pool } from '../../../lib/db';
import {
  validateMethod,
  parsePagination,
  getQueryString,
  buildMarketplaceFilter,
  formatDate,
  sendErrorResponse,
  sendSuccessResponse,
} from '../../../lib/api-helpers';
import type {
  ApiRequest,
  ProspectStatus,
  Prospect,
  ProspectStatusSummary,
  ProspectStatusResponse,
} from '../../../types';

// A prospect is 'Active' if their status in the database is 'new' or 'active', otherwise they are 'Inactive'.
const getStatusCaseStatement = () => `
    CASE
        WHEN status = 'new' OR status = 'active' THEN 'Active'
        ELSE 'Inactive'
    END
`;

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<ProspectStatusResponse | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const { page, limit, offset } = parsePagination(req.query);
  const { status: statusFilter, search, marketplace } = req.query;
    
    const client = await pool.connect();
    try {
        const statusCase = getStatusCaseStatement();

        const whereClauses: string[] = [`type = 'prospect'`];
        const queryParams: any[] = [];
        let paramIndex = 1;
        
        const fromSubqueryWithStatus = `
            (SELECT *, ${statusCase} as derived_status FROM mart_himdashboard.crm_main_table) as c
        `;

        if (statusFilter && typeof statusFilter === 'string' && statusFilter.toLowerCase() !== 'all') {
            whereClauses.push(`derived_status = $${paramIndex++}`);
            queryParams.push(statusFilter);
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

        // Summary Query
        const summaryResult = await client.query(`
            SELECT derived_status, COUNT(*) as count
            FROM ${fromSubqueryWithStatus}
            ${whereString.replace(/c\./g, '')}
            GROUP BY derived_status;
        `, queryParams);
  const summary: ProspectStatusSummary = { 'Active': 0, 'Inactive': 0 };
  summaryResult.rows.forEach(row => {
    if (summary.hasOwnProperty(row.derived_status)) {
      summary[row.derived_status as ProspectStatus] = parseInt(row.count, 10);
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
      SELECT *, COUNT(*) OVER() as total_count
      FROM ${fromSubqueryWithStatus}
      ${whereString.replace(/c\./g, '')}
      ORDER BY last_order_date DESC NULLS LAST
      LIMIT $${paramIndex++} OFFSET $${paramIndex++};
    `;
    const limitOffsetParams = [...queryParams, limit, offset];
    const result = await client.query(dataQuery, limitOffsetParams);

    const totalProspects = result.rows.length > 0 ? parseInt(result.rows[0].total_count, 10) : 0;
    const totalPages = Math.ceil(totalProspects / limit);

    const prospects: Prospect[] = result.rows.map(row => ({
      id: String(row.phone_number || ''),
      name: row.name || 'N/A',
      phone: row.phone_number || 'N/A',
      status: row.derived_status as ProspectStatus,
      lastContactDate: formatDate(row.last_order_date),
    }));

    sendSuccessResponse(res, { prospects, summary, totalProspects, totalPages, allMarketplaces });

  } catch (error) {
    console.error('Database query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  } finally {
    client.release();
  }
}