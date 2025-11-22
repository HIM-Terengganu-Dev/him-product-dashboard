// This is your new backend API endpoint.
// It securely connects to your Neon database and fetches the data.
// To access this data, your frontend will make a request to /api/contacts.

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
  Contact,
  ContactType,
} from '../../../types';

interface PaginatedResponse {
  contacts: Contact[];
  totalContacts: number;
  totalPages: number;
}

export default async function handler(
  req: ApiRequest,
  res: NextApiResponse<PaginatedResponse | { error: string }>
) {
  if (!validateMethod(req, res, ['GET'])) {
    return;
  }

  const { page, limit, offset } = parsePagination(req.query);
  const { name, type, marketplace, product, startDate, endDate } = req.query;

  const whereClauses: string[] = [];
  const queryParams: (string | number | string[])[] = [];
  let paramIndex = 1;

  if (name && typeof name === 'string') {
    whereClauses.push(`name ILIKE $${paramIndex++}`);
    queryParams.push(`%${name}%`);
  }
  const typeArray = parseQueryArray(req.query, 'type');
  if (typeArray.length > 0) {
    whereClauses.push(`type ILIKE ANY($${paramIndex++}::text[])`);
    queryParams.push(typeArray);
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

  const productStr = getQueryString(req.query, 'product');
  if (productStr) {
    const productArray = productStr.split(',');
    const filter = buildProductFilter(productArray, paramIndex, queryParams);
    if (filter.clause) {
      whereClauses.push(filter.clause);
      paramIndex = filter.nextParamIndex;
    }
  }
  if (startDate && typeof startDate === 'string') {
    whereClauses.push(`last_order_date >= $${paramIndex++}`);
    queryParams.push(startDate);
  }
  if (endDate && typeof endDate === 'string') {
    whereClauses.push(`last_order_date <= $${paramIndex++}`);
    queryParams.push(endDate);
  }

  const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const baseTable = 'mart_himdashboard.crm_main_table';
  
  try {
    const client = await pool.connect();
    try {
      const dataQuery = client.query(`
          SELECT *, COUNT(*) OVER() as total_count
          FROM ${baseTable}
          ${whereString}
          ORDER BY last_order_date DESC NULLS LAST 
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...queryParams, limit, offset]
      );
      
      const dataResult = await dataQuery;

      const totalContacts = dataResult.rows.length > 0 ? parseInt(dataResult.rows[0].total_count, 10) : 0;
      const totalPages = Math.ceil(totalContacts / limit);
      
      const contacts: Contact[] = dataResult.rows.map(row => {
        const lastPurchaseDate = formatDate(row.last_order_date);
        const validTypes: ContactType[] = ['Client', 'Prospect', 'Lead'];
        let contactType: ContactType = 'Lead';
        if (typeof row.type === 'string') {
          const normalizedType = row.type.trim();
          const titleCaseType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1).toLowerCase();
          if (validTypes.includes(titleCaseType as ContactType)) {
            contactType = titleCaseType as ContactType;
          }
        }
        return {
          id: String(row.phone_number || ''),
          name: row.name || 'N/A', phone: row.phone_number || 'N/A', type: contactType,
          lastPurchaseDate: lastPurchaseDate, lastPurchaseProduct: row.last_order_product || null, lastMarketplace: row.last_marketplace || null,
        };
      });

      const responseData: PaginatedResponse = {
        contacts,
        totalContacts,
        totalPages,
      };

      sendSuccessResponse(res, responseData);

    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query failed:', error);
    sendErrorResponse(res, 500, 'Internal Server Error');
  }
}